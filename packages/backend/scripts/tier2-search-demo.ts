/**
 * Tier 2 content search demo (MVP Slice 2/3).
 *
 * Runs a semantic/content query against indexed chunks via retrievalService.
 * Hybrid retrieval (vector + FTS + keyword) is enabled by default for tier2 demos.
 *
 * Usage (from packages/backend):
 *   pnpm tier2:search "concrete reinforcement requirements"
 *   pnpm tier2:search -- --project-id <uuid> --top 5 "selective demolition"
 */

import { config } from "dotenv";

config({ path: "../../.env" });
process.env.RETRIEVAL_HYBRID_ENABLED = process.env.RETRIEVAL_HYBRID_ENABLED ?? "true";
resetEnvCache();
import { eq } from "drizzle-orm";
import { initializeDb } from "../src/db";
import { getEnv, resetEnvCache } from "../src/config/env";
import { projects } from "../src/db/schema";
import { retrievalService } from "../src/services/retrieval.service";

const PROJECT_NAME = "MLJ-017 Package 6 - General (TEST CLONE)";
const DEFAULT_QUERY = "concrete reinforcement bar requirements";

function parseArgs(argv: string[]): { projectId?: string; query: string; top: number } {
  let projectId: string | undefined;
  let top = 5;
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--project-id" && next) {
      projectId = next;
      i += 1;
    } else if (arg === "--top" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) top = parsed;
      i += 1;
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  const query = positional.join(" ").trim() || DEFAULT_QUERY;
  return { projectId, query, top };
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
  const { projectId: cliProjectId, query, top } = parseArgs(process.argv.slice(2));

  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);
  const projectId = await resolveProjectId(db, cliProjectId);

  console.log(`[tier2-search] project: ${projectId}`);
  console.log(`[tier2-search] hybrid: ${env.retrievalHybridEnabled}`);
  console.log(`[tier2-search] query: "${query}"\n`);

  const result = await retrievalService.searchProject(projectId as any, query, {
    includeChunks: true,
    topK: top,
  });

  console.log(`totalMatches: ${result.totalMatches}`);
  console.log(`results (top ${top}):\n`);

  for (const [index, hit] of result.results.slice(0, top).entries()) {
    const chunk = hit.matchedChunks?.[0];
    const snippet = chunk?.chunkText?.slice(0, 200).replace(/\s+/g, " ") ?? "(no chunk text)";
    console.log(`--- #${index + 1} relevance=${hit.topRelevance?.toFixed(3) ?? "?"} ---`);
    console.log(`file: ${hit.fileName}`);
    console.log(`path: ${hit.filePath ?? "?"}`);
    console.log(`page: ${chunk?.pageNumber ?? "?"}`);
    console.log(`matchReasons: ${JSON.stringify(hit.matchReasons ?? [])}`);
    console.log(`snippet: ${snippet}...`);
    console.log(`deepLink: ${hit.deepLinkUrl ?? "?"}\n`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
