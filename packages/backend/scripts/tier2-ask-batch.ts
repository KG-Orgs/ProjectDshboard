/**
 * Batch RAG ask — same path as web chat / tier2:ask, without the UI.
 *
 * Usage (from packages/backend):
 *   pnpm tier2:ask-batch -- --file ./eval/qwp001-depth-questions.json
 *   pnpm tier2:ask-batch -- --file ./eval/qwp001-depth-questions.json --ids qwp-holdpoints,qwp-rebar-risks
 *   pnpm tier2:ask-batch -- "What hold points does QWP-001 require?"
 *
 * Agents: point a shell/agent at this script for repeatable depth testing.
 */

import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UUID } from "@contractor/shared";
import { eq } from "drizzle-orm";
import { initializeDb } from "../src/db";
import { projects } from "../src/db/schema";
import { getEnv, resetEnvCache } from "../src/config/env";
import { chatCoordinatorService } from "../src/services/chat-coordinator.service";

config({ path: "../../.env" });
process.env.RETRIEVAL_HYBRID_ENABLED = process.env.RETRIEVAL_HYBRID_ENABLED ?? "true";
resetEnvCache();

const PROJECT_NAME = "MLJ-017 Package 6 - General (TEST CLONE)";

interface BatchQuestion {
  id?: string;
  query: string;
}

interface QuestionFile {
  projectId?: string;
  questions: BatchQuestion[];
}

function parseArgs(argv: string[]): {
  projectId?: string;
  filePath?: string;
  ids?: Set<string>;
  positional: string[];
} {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const backendRoot = path.resolve(scriptDir, "..");
  let projectId: string | undefined;
  let filePath: string | undefined;
  let ids: Set<string> | undefined;
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--project-id" && next) {
      projectId = next;
      i += 1;
    } else if (arg === "--file" && next) {
      // Treat as absolute if it starts with / (Unix) or a Windows drive letter (C:\, D:/)
      const isAbsolute = next.startsWith("/") || /^[A-Za-z]:[/\\]/.test(next);
      filePath = path.resolve(isAbsolute ? next : path.join(backendRoot, next));
      i += 1;
    } else if (arg === "--ids" && next) {
      ids = new Set(next.split(",").map((value) => value.trim()).filter(Boolean));
      i += 1;
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  return { projectId, filePath, ids, positional };
}

async function resolveProjectId(
  db: Awaited<ReturnType<typeof initializeDb>>,
  projectId?: string
): Promise<string> {
  if (projectId) {
    const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!row) throw new Error(`Project not found: ${projectId}`);
    return row.id;
  }
  const [row] = await db.select().from(projects).where(eq(projects.name, PROJECT_NAME)).limit(1);
  if (!row) throw new Error(`Project not found: ${PROJECT_NAME}. Run tier1:ingest first.`);
  return row.id;
}

async function loadQuestions(input: ReturnType<typeof parseArgs>): Promise<{
  projectId?: string;
  questions: BatchQuestion[];
}> {
  if (input.filePath) {
    const raw = await readFile(input.filePath, "utf8");
    const parsed = JSON.parse(raw) as QuestionFile;
    let questions = parsed.questions ?? [];
    if (input.ids) {
      questions = questions.filter((q) => q.id && input.ids!.has(q.id));
    }
    return { projectId: parsed.projectId ?? input.projectId, questions };
  }

  if (input.positional.length > 0) {
    return {
      projectId: input.projectId,
      questions: input.positional.map((query, index) => ({ id: `q${index + 1}`, query })),
    };
  }

  throw new Error("Provide --file <questions.json> or one or more query strings.");
}

function printReply(label: string, query: string, startedAt: number, reply: Awaited<ReturnType<typeof chatCoordinatorService.generateReply>>): void {
  const elapsedMs = Date.now() - startedAt;
  console.log(`\n${"=".repeat(72)}`);
  console.log(`${label}${query.length > 60 ? `\n  ${query}` : `: ${query}`}`);
  console.log(`${"=".repeat(72)}`);
  console.log("\n--- ANSWER ---\n");
  console.log(reply.content);
  console.log("\n--- SOURCES ---\n");
  if (!reply.sources?.length) {
    console.log("(none)");
  } else {
    for (const source of reply.sources) {
      console.log(`- ${source.fileName ?? source.displayName ?? source.fileId}`);
      if (source.suggestedPages?.length) {
        console.log(`  pages: ${source.suggestedPages.join(", ")}`);
      }
    }
  }
  if (reply.citations?.length) {
    console.log("\n--- CITATIONS ---\n");
    for (const citation of reply.citations) {
      console.log(
        `- ${citation.fileName} chunk=${citation.chunkIndex} (p. ${citation.pageNumber ?? "?"}) rel=${citation.relevance.toFixed(3)}`
      );
    }
  }
  console.log(`\n--- META --- elapsed=${elapsedMs}ms domains=${reply.domains.join(", ")} cacheHit=${reply.cacheHit}`);
}

async function main(): Promise<void> {
  const input = parseArgs(process.argv.slice(2));
  const { projectId: fileProjectId, questions } = await loadQuestions(input);

  const env = getEnv();
  if (!env.databaseUrl) throw new Error("DATABASE_URL is missing");

  const db = await initializeDb(env.databaseUrl);
  const projectId = await resolveProjectId(db, fileProjectId ?? input.projectId);

  console.log(`[tier2:ask-batch] project: ${projectId}`);
  console.log(`[tier2:ask-batch] hybrid: ${env.retrievalHybridEnabled}`);
  console.log(`[tier2:ask-batch] questions: ${questions.length}`);

  for (const [index, question] of questions.entries()) {
    const label = question.id ? `[${question.id}]` : `[${index + 1}/${questions.length}]`;
    const startedAt = Date.now();
    const reply = await chatCoordinatorService.generateReply(projectId as UUID, question.query);
    printReply(label, question.query, startedAt, reply);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
