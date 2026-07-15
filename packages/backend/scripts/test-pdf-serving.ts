/**
 * Diagnostic + regression test: verifies that local-corpus PDFs can be read
 * from disk using the current LOCAL_CORPUS_PARENT and the deepLinkUrl / filePath
 * values stored in the database.
 *
 * Run from packages/backend:
 *   pnpm tsx scripts/test-pdf-serving.ts
 *   pnpm tsx scripts/test-pdf-serving.ts -- --project-id <uuid>
 *   pnpm tsx scripts/test-pdf-serving.ts -- --limit 20
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
// Load env BEFORE any module that reads process.env
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), "../../.env"), override: false });
config({ path: path.resolve(process.cwd(), ".env"), override: false });

import { eq, and, gt } from "drizzle-orm";
import { initializeDb } from "../src/db";
import { fileRecords, projects } from "../src/db/schema";
import { getEnv, resetEnvCache } from "../src/config/env";

// Force env re-read after dotenv has populated process.env
resetEnvCache();

const LOCAL_ITEM_PREFIX = "local:";

function isLocalCorpusItemId(id?: string | null): boolean {
  return typeof id === "string" && id.startsWith(LOCAL_ITEM_PREFIX);
}

function resolveAbsolutePath(
  onedriveItemId: string | null | undefined,
  filePath: string | null | undefined,
  deepLinkUrl: string | null | undefined,
  corpusParent: string | undefined
): { path: string | null; method: string } {
  if (deepLinkUrl?.startsWith("file://")) {
    try {
      const candidate = fileURLToPath(deepLinkUrl);
      if (fs.existsSync(candidate)) {
        return { path: candidate, method: "deepLinkUrl (exists)" };
      }
      return { path: null, method: `deepLinkUrl stale (not on disk): ${candidate}` };
    } catch (e) {
      return { path: null, method: `deepLinkUrl parse error: ${e}` };
    }
  }

  if (!corpusParent?.trim()) {
    return { path: null, method: "no LOCAL_CORPUS_PARENT" };
  }

  if (isLocalCorpusItemId(onedriveItemId)) {
    const relative = onedriveItemId!.slice(LOCAL_ITEM_PREFIX.length);
    return { path: path.join(corpusParent, relative), method: "LOCAL_CORPUS_PARENT + onedriveItemId" };
  }

  if (filePath) {
    return { path: path.join(corpusParent, filePath), method: "LOCAL_CORPUS_PARENT + filePath" };
  }

  return { path: null, method: "no path available" };
}

async function main() {
  const args = process.argv.slice(2);
  let projectId: string | undefined;
  let limit = 10;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--project-id" && args[i + 1]) { projectId = args[++i]; }
    if (args[i] === "--limit" && args[i + 1]) { limit = Number(args[++i]) || 10; }
  }

  const env = getEnv();
  const corpusParent = env.localCorpusParent;
  console.log(`\nLOCAL_CORPUS_PARENT = ${corpusParent ?? "(not set)"}\n`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) { console.error("DATABASE_URL not set"); process.exit(1); }
  const db = await initializeDb(databaseUrl);

  // Find a project if not specified
  if (!projectId) {
    const [proj] = await db.select({ id: projects.id, name: projects.name })
      .from(projects).limit(1);
    if (!proj) { console.error("No projects found in database."); process.exit(1); }
    projectId = proj.id;
    console.log(`Using project: ${proj.name} (${proj.id})\n`);
  }

  // Fetch local-corpus file records
  const rows = await db
    .select({
      id: fileRecords.id,
      fileName: fileRecords.fileName,
      filePath: fileRecords.filePath,
      onedriveItemId: fileRecords.onedriveItemId,
      deepLinkUrl: fileRecords.deepLinkUrl,
    })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, projectId), gt(fileRecords.chunkCount, 0)))
    .limit(limit);

  if (rows.length === 0) {
    console.error("No indexed file records found for this project.");
    process.exit(1);
  }

  let ok = 0, missing = 0, noPath = 0;

  for (const row of rows) {
    if (!isLocalCorpusItemId(row.onedriveItemId)) {
      console.log(`[SKIP non-local] ${row.fileName}`);
      continue;
    }

    const { path: resolved, method } = resolveAbsolutePath(
      row.onedriveItemId,
      row.filePath,
      row.deepLinkUrl,
      corpusParent
    );

    if (!resolved) {
      console.log(`[NO PATH ] ${row.fileName}\n  method: ${method}`);
      noPath++;
      continue;
    }

    const exists = fs.existsSync(resolved);
    if (exists) {
      const size = fs.statSync(resolved).size;
      console.log(`[OK  ${(size / 1024).toFixed(0).padStart(6)}KB] ${row.fileName}\n  ${method}\n  ${resolved}`);
      ok++;
    } else {
      console.log(`[MISSING ] ${row.fileName}\n  ${method}\n  ${resolved}`);
      missing++;
    }
  }

  console.log(`\n--- Results (${rows.length} files sampled) ---`);
  console.log(`  OK      : ${ok}`);
  console.log(`  MISSING : ${missing}`);
  console.log(`  NO PATH : ${noPath}`);

  if (missing > 0 || noPath > 0) {
    console.log("\n⚠  Some files cannot be resolved. Check LOCAL_CORPUS_PARENT and deepLinkUrl values.");
    process.exit(1);
  } else {
    console.log("\n✓  All sampled files resolve successfully.");
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
