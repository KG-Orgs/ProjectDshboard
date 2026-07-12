/**
 * Tier 2 RAG ask demo (MVP Slice 2/3).
 *
 * Calls chatCoordinatorService.generateReply directly (no session/auth).
 * Hybrid retrieval is enabled by default for tier2 demos.
 *
 * Usage (from packages/backend):
 *   pnpm tier2:ask "What are the requirements for concrete reinforcement?"
 *   pnpm tier2:ask -- --project-id <uuid> "selective demolition procedures"
 */

import { config } from "dotenv";

config({ path: "../../.env" });
process.env.RETRIEVAL_HYBRID_ENABLED = process.env.RETRIEVAL_HYBRID_ENABLED ?? "true";
resetEnvCache();
import { eq } from "drizzle-orm";
import { initializeDb } from "../src/db";
import { getEnv, resetEnvCache } from "../src/config/env";
import { projects } from "../src/db/schema";
import { chatCoordinatorService } from "../src/services/chat-coordinator.service";

const PROJECT_NAME = "MLJ-017 Package 6 - General (TEST CLONE)";
const DEFAULT_QUERY = "ACI 315 concrete reinforcement detailing standards";

function parseArgs(argv: string[]): { projectId?: string; query: string } {
  let projectId: string | undefined;
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--project-id" && next) {
      projectId = next;
      i += 1;
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  const query = positional.join(" ").trim() || DEFAULT_QUERY;
  return { projectId, query };
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

async function main(): Promise<void> {
  const { projectId: cliProjectId, query } = parseArgs(process.argv.slice(2));

  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);
  const projectId = await resolveProjectId(db, cliProjectId);

  console.log(`[tier2-ask] project: ${projectId}`);
  console.log(`[tier2-ask] hybrid: ${env.retrievalHybridEnabled}`);
  console.log(`[tier2-ask] query: "${query}"\n`);

  const startedAt = Date.now();
  const reply = await chatCoordinatorService.generateReply(projectId as any, query);
  const elapsedMs = Date.now() - startedAt;

  console.log("========== ANSWER ==========");
  console.log(reply.content);
  console.log("\n========== SOURCES ==========");
  for (const source of reply.sources ?? []) {
    console.log(`- ${source.fileName ?? source.displayName ?? source.fileId}`);
    if (source.suggestedPages?.length) {
      console.log(`  pages: ${source.suggestedPages.join(", ")}`);
    }
  }

  if (reply.citations?.length) {
    console.log("\n========== CITATIONS ==========");
    for (const citation of reply.citations) {
      console.log(
        `- ${citation.fileName} chunk=${citation.chunkIndex} (p. ${citation.pageNumber ?? "?"}) rel=${citation.relevance.toFixed(3)}`
      );
      if (citation.sectionLabel) {
        console.log(`  section: ${citation.sectionLabel}`);
      }
    }
  }

  console.log("\n========== META ==========");
  console.log(`domains: ${reply.domains.join(", ")}`);
  console.log(`cacheHit: ${reply.cacheHit}`);
  console.log(`elapsedMs: ${elapsedMs}`);
  if (reply.coordinator?.telemetry) {
    const t = reply.coordinator.telemetry;
    console.log(
      `telemetry: route=${t.routeMs}ms retrieval=${t.retrievalMs}ms merge=${t.mergeMs}ms agent=${t.agentMs}ms total=${t.totalMs}ms`
    );
  }
  if (reply.interpretation) {
    console.log(`intent: ${reply.interpretation.intent} (confidence=${reply.interpretation.confidence})`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
