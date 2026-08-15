/**
 * Isolated probe for the visual evidence fallback's two external dependencies:
 * page rendering (pdftoppm) and the vision transport.
 *
 * Renders a page of a real corpus PDF and asks the narrow question the fallback
 * would ask, printing the raw completion and the parsed `VisualEvidence`. Use it
 * to check the stage works in this environment before spending a full eval run.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/probe-visual-fallback.ts <fileId> "<question>" [page]
 *   pnpm tsx ./eval/probe-visual-fallback.ts --path "C:\path\to.pdf" "<question>" [page]
 */
import { config } from "dotenv";
import type { UUID } from "@contractor/shared";
import { and, eq } from "drizzle-orm";
import { getEnv, resetEnvCache } from "../src/config/env";
import { initializeDb, getDbIfInitialized } from "../src/db";
import { fileRecords } from "../src/db/schema";
import { callVisionLlm } from "../src/services/llm-client";
import {
  readLocalCorpusFile,
  resolveLocalCorpusAbsolutePath,
} from "../src/services/local-corpus.utils";
import { getPdfPageCount, renderPdfPages } from "../src/services/pdf-page-render.service";
import { buildVisionPrompt, parseVisualEvidence } from "../src/services/visual-fallback.service";
import { assessVisualNeed } from "../src/services/visual-need.utils";

config({ path: "../../.env" });
process.env.CHAT_VISUAL_FALLBACK_ENABLED = "true";
resetEnvCache();

const VISION_SYSTEM = [
  "You are reading a single rendered page from a construction project document in order to answer one narrow question.",
  "Report only what is visibly present. Do not guess or infer. Do not estimate dimensions from scale.",
  "Return valid JSON only: {\"visible\":true,\"confidence\":0.0,\"observations\":[{\"field\":\"\",\"value\":\"\",\"where\":\"\"}]}",
  "Set visible=false with an empty observations array when the answer is not determinable from this page.",
].join("\n");

async function resolvePdf(target: string): Promise<{ bytes: Buffer; fileName: string }> {
  const env = getEnv();

  if (target.startsWith("--path=") || /^[A-Za-z]:[/\\]/.test(target)) {
    const filePath = target.startsWith("--path=") ? target.slice("--path=".length) : target;
    return { bytes: await readLocalCorpusFile(filePath), fileName: filePath };
  }

  if (!env.databaseUrl) throw new Error("DATABASE_URL is missing");
  await initializeDb(env.databaseUrl);
  const db = getDbIfInitialized();
  if (!db) throw new Error("database did not initialise");

  const [record] = await db
    .select()
    .from(fileRecords)
    .where(eq(fileRecords.id, target as UUID))
    .limit(1);
  if (!record) throw new Error(`no file record for ${target}`);

  const absolutePath = resolveLocalCorpusAbsolutePath({
    onedriveItemId: record.onedriveItemId,
    filePath: record.filePath,
    deepLinkUrl: record.deepLinkUrl,
    corpusParent: env.localCorpusParent,
  });
  if (!absolutePath) throw new Error("could not resolve a local path for that file");

  console.log(`[probe] resolved: ${absolutePath}`);
  return { bytes: await readLocalCorpusFile(absolutePath, 30_000), fileName: record.fileName };
}

async function main(): Promise<void> {
  const [target, question, pageArg] = process.argv.slice(2);
  if (!target || !question) {
    console.error('Usage: probe-visual-fallback.ts <fileId|--path=C:\\file.pdf> "<question>" [page]');
    process.exit(1);
  }

  const env = getEnv();
  const { bytes, fileName } = await resolvePdf(target);
  const pageCount = await getPdfPageCount({ pdfBytes: bytes });
  const page = pageArg ? Number.parseInt(pageArg, 10) : 1;

  const assessment = assessVisualNeed(question);
  console.log(`[probe] file: ${fileName} (${bytes.length} bytes, ~${pageCount ?? "?"} pages)`);
  console.log(`[probe] assessment: ${JSON.stringify(assessment)}`);

  const rendered = await renderPdfPages({ pdfBytes: bytes }, [page], { dpi: env.chatVisualFallbackDpi });
  if (rendered.length === 0) {
    console.error("[probe] RENDER FAILED — pdftoppm unavailable or the page does not exist");
    process.exit(1);
  }
  const image = rendered[0];
  console.log(`[probe] rendered p.${image.page} at ${image.dpi} dpi, ${(image.bytes / 1024).toFixed(0)} KB`);

  const prompt = buildVisionPrompt({
    question,
    documentAlias: fileName,
    fileName,
    page: image.page,
    visualTaskTypes: assessment.visualTaskTypes,
    textEvidence: [],
  });
  console.log(`\n[probe] ---- prompt ----\n${prompt}\n`);

  const completion = await callVisionLlm(
    { system: VISION_SYSTEM, prompt, images: [{ base64: image.base64, mediaType: image.mediaType }] },
    { temperature: 0, maxTokens: 1024, timeoutMs: env.chatVisualFallbackTimeoutMs }
  );

  if (!completion) {
    console.error("[probe] VISION CALL FAILED — no completion from any configured provider");
    process.exit(1);
  }

  console.log(`[probe] ---- raw completion ----\n${completion}\n`);
  console.log(
    `[probe] ---- parsed VisualEvidence ----\n${JSON.stringify(
      parseVisualEvidence(completion, { fileId: String(target), page: image.page }),
      null,
      2
    )}`
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
