/**
 * Traced 97-question eval run.
 *
 * Same path as web chat (chatCoordinatorService.generateReply), but every
 * structured log line the pipeline emits while a question is in flight is
 * captured and stored with that question's result. That gives a per-question
 * record of *how* the answer was reached — intent, routing, retrieval counts,
 * rerank, source identity guard, extractor status, formatter — not just the text.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/run-97-traced.ts
 *   pnpm tsx ./eval/run-97-traced.ts --ids sq01,sq02
 *   pnpm tsx ./eval/run-97-traced.ts --limit 5 --out ./eval/smoke.jsonl
 *   pnpm tsx ./eval/run-97-traced.ts --resume        # skip ids already in --out
 *
 * Output: JSONL, one record per question, appended as each question finishes so
 * a crash or Ctrl-C never loses completed work.
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UUID } from "@contractor/shared";
import { initializeDb } from "../src/db";
import { getEnv, resetEnvCache } from "../src/config/env";
import { chatCoordinatorService } from "../src/services/chat-coordinator.service";

config({ path: "../../.env" });

// The run exercises the current working-tree pipeline with the new stages on.
// Both default to off in env.ts, so they are set explicitly here (and recorded
// in the output header) rather than relying on the ambient environment.
process.env.RETRIEVAL_HYBRID_ENABLED = process.env.RETRIEVAL_HYBRID_ENABLED ?? "true";
process.env.CHAT_ANSWER_FORMATTER_ENABLED = process.env.CHAT_ANSWER_FORMATTER_ENABLED ?? "true";
process.env.CHAT_SOURCE_IDENTITY_GUARD_ENABLED =
  process.env.CHAT_SOURCE_IDENTITY_GUARD_ENABLED ?? "true";
process.env.CHAT_VISUAL_FALLBACK_ENABLED = process.env.CHAT_VISUAL_FALLBACK_ENABLED ?? "true";
resetEnvCache();

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");

interface BatchQuestion {
  id?: string;
  query: string;
  activeDocFileId?: string;
  activeDocFileName?: string;
}

interface LogEvent {
  event: string;
  level: string;
  meta: Record<string, unknown>;
}

function resolvePath(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(backendRoot, value));
}

function parseArgs(argv: string[]): {
  filePath: string;
  outPath: string;
  ids?: Set<string>;
  limit?: number;
  resume: boolean;
} {
  let filePath = "./eval/mlj017-adjusted-v2-batch-input.json";
  let outPath = "./eval/mlj017-97-traced-run.jsonl";
  let ids: Set<string> | undefined;
  let limit: number | undefined;
  let resume = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--file" && next) {
      filePath = next;
      i += 1;
    } else if (arg === "--out" && next) {
      outPath = next;
      i += 1;
    } else if (arg === "--ids" && next) {
      ids = new Set(next.split(",").map((v) => v.trim()).filter(Boolean));
      i += 1;
    } else if (arg === "--limit" && next) {
      limit = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--resume") {
      resume = true;
    }
  }

  return { filePath: resolvePath(filePath), outPath: resolvePath(outPath), ids, limit, resume };
}

/** Ids already present in an existing JSONL output, for --resume. */
function completedIds(outPath: string): Set<string> {
  if (!fs.existsSync(outPath)) return new Set();
  const done = new Set<string>();
  for (const line of fs.readFileSync(outPath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as { id?: string; error?: string };
      if (row.id && !row.error) done.add(row.id);
    } catch {
      // Partially written trailing line — ignore.
    }
  }
  return done;
}

/**
 * Redirect console output into a per-question event buffer.
 *
 * `lib/logger` writes one JSON object per line to console.log/warn/error, so
 * intercepting console is enough to capture the whole pipeline trace. Anything
 * that is not JSON (stray prints from dependencies) is kept as a raw line.
 */
function installLogCapture(rawLogStream: fs.WriteStream): {
  start: () => void;
  stop: () => LogEvent[];
  print: (message: string) => void;
} {
  const original = { log: console.log, warn: console.warn, error: console.error };
  let buffer: LogEvent[] | null = null;

  const capture = (level: string) => (...args: unknown[]) => {
    const text = args
      .map((a) => (typeof a === "string" ? a : a instanceof Error ? (a.stack ?? a.message) : JSON.stringify(a)))
      .join(" ");
    rawLogStream.write(`${text}\n`);
    if (!buffer) return;
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (typeof parsed.event === "string") {
        const { event, level: parsedLevel, timestamp, ...meta } = parsed;
        void timestamp;
        buffer.push({ event, level: typeof parsedLevel === "string" ? parsedLevel : level, meta });
        return;
      }
    } catch {
      // not JSON
    }
    buffer.push({ event: "raw", level, meta: { text: text.slice(0, 2000) } });
  };

  console.log = capture("info");
  console.warn = capture("warn");
  console.error = capture("error");

  return {
    start: () => {
      buffer = [];
    },
    stop: () => {
      const events = buffer ?? [];
      buffer = null;
      return events;
    },
    print: (message: string) => {
      original.log(message);
    },
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const batch = JSON.parse(fs.readFileSync(args.filePath, "utf8")) as {
    projectId?: string;
    questions: BatchQuestion[];
  };

  let questions = batch.questions;
  if (args.ids) questions = questions.filter((q) => q.id && args.ids!.has(q.id));
  if (args.resume) {
    const done = completedIds(args.outPath);
    questions = questions.filter((q) => !q.id || !done.has(q.id));
    if (done.size > 0) console.log(`[run-97] resuming — ${done.size} already complete`);
  }
  if (args.limit !== undefined && !Number.isNaN(args.limit)) questions = questions.slice(0, args.limit);

  const env = getEnv();
  if (!env.databaseUrl) throw new Error("DATABASE_URL is missing");
  const projectId = batch.projectId;
  if (!projectId) throw new Error("Question file has no projectId");

  await initializeDb(env.databaseUrl);

  const flags = {
    retrievalHybridEnabled: env.retrievalHybridEnabled,
    chatAnswerFormatterEnabled: env.chatAnswerFormatterEnabled,
    chatSourceIdentityGuardEnabled: env.chatSourceIdentityGuardEnabled,
    chatVisualFallbackEnabled: env.chatVisualFallbackEnabled,
    chatVisualFallbackMaxPages: env.chatVisualFallbackMaxPages,
    chatVisualFallbackDpi: env.chatVisualFallbackDpi,
    visionModel: env.visionModel ?? "(chat model)",
    chatStrictCitationVerificationEnabled: env.chatStrictCitationVerificationEnabled,
    chatSectionProximityBoostEnabled: env.chatSectionProximityBoostEnabled,
    retrievalRerankEnabled: env.retrievalRerankEnabled,
    retrievalRerankProvider: env.retrievalRerankProvider,
    chatModel: env.openrouterApiKey ? env.openrouterChatModel : (env.geminiChatModel ?? env.openAiChatModel),
    llmProvider: env.openrouterApiKey ? "openrouter" : env.geminiApiKey ? "gemini" : "openai",
  };

  const rawLogPath = args.outPath.replace(/\.jsonl$/, "") + ".log";
  const rawLogStream = fs.createWriteStream(rawLogPath, { flags: "a" });
  const out = fs.createWriteStream(args.outPath, { flags: args.resume ? "a" : "w" });

  console.log(`[run-97] project: ${projectId}`);
  console.log(`[run-97] questions: ${questions.length}`);
  console.log(`[run-97] flags: ${JSON.stringify(flags)}`);
  console.log(`[run-97] out: ${args.outPath}`);
  console.log(`[run-97] raw log: ${rawLogPath}`);

  const capture = installLogCapture(rawLogStream);
  const runStartedAt = Date.now();

  if (!args.resume) {
    out.write(
      `${JSON.stringify({
        kind: "header",
        startedAt: new Date(runStartedAt).toISOString(),
        projectId,
        questionFile: path.basename(args.filePath),
        questionCount: questions.length,
        flags,
      })}\n`
    );
  }

  for (const [index, question] of questions.entries()) {
    const id = question.id ?? `q${index + 1}`;
    const startedAt = Date.now();
    capture.start();
    let record: Record<string, unknown>;
    try {
      const reply = await chatCoordinatorService.generateReply(
        projectId as UUID,
        question.query,
        undefined,
        undefined,
        question.activeDocFileName,
        question.activeDocFileId as UUID | undefined
      );
      const events = capture.stop();
      record = {
        kind: "result",
        id,
        query: question.query,
        elapsedMs: Date.now() - startedAt,
        content: reply.content,
        answer: reply.answer ?? null,
        sources: (reply.sources ?? []).map((s) => ({
          fileName: s.fileName ?? s.displayName ?? s.fileId,
          fileId: s.fileId,
          pages: s.suggestedPages ?? [],
          pageOrigin: s.pageOrigin ?? null,
        })),
        citations: (reply.citations ?? []).map((c) => ({
          fileName: c.fileName,
          chunkIndex: c.chunkIndex,
          page: c.pageNumber ?? null,
          relevance: c.relevance,
        })),
        domains: reply.domains,
        interpretation: reply.interpretation ?? null,
        coordinator: reply.coordinator,
        cacheHit: reply.cacheHit,
        events,
      };
    } catch (error) {
      const events = capture.stop();
      record = {
        kind: "result",
        id,
        query: question.query,
        elapsedMs: Date.now() - startedAt,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        events,
      };
    }

    out.write(`${JSON.stringify(record)}\n`);
    const status =
      typeof record.error === "string"
        ? `ERROR ${record.error}`
        : `${(record.answer as { status?: string } | null)?.status ?? "deterministic"} · ${(record.sources as unknown[]).length} sources`;
    capture.print(
      `[${index + 1}/${questions.length}] ${id} ${((record.elapsedMs as number) / 1000).toFixed(1)}s — ${status}`
    );
  }

  out.end();
  rawLogStream.end();
  capture.print(`[run-97] done in ${((Date.now() - runStartedAt) / 60000).toFixed(1)} min`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
