import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { getEnv } from "../src/config/env.js";

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

async function main() {
  const env = getEnv();
  await initializeDb(env.databaseUrl!);
  const db = getDbIfInitialized()!;

  const tsquery = `websearch_to_tsquery('english', 'island pavement cutting subcontract')`;

  // EXPLAIN ANALYZE the actual FTS query
  const plan = await db.execute<{ "QUERY PLAN": string }>(sql.raw(`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT fc.id, fc.file_name,
      ts_rank_cd(to_tsvector('english', COALESCE(fc.chunk_text, '')), ${tsquery}) AS fts_rank
    FROM file_chunks fc
    WHERE fc.project_id = '${PROJECT_ID}'
      AND (
        to_tsvector('english', COALESCE(fc.chunk_text, '')) @@ ${tsquery}
        OR to_tsvector('english', COALESCE(fc.file_name, '')) @@ ${tsquery}
      )
    ORDER BY fts_rank DESC
    LIMIT 20
  `));

  console.log("\n=== EXPLAIN ANALYZE: FTS query for Island Pavement Cutting ===");
  for (const row of plan as unknown as Array<{ "QUERY PLAN": string }>) {
    console.log(row["QUERY PLAN"]);
  }

  // Also check index usage stats now
  const stats = await db.execute<{ indexrelname: string; idx_scan: string }>(sql`
    SELECT indexrelname, idx_scan
    FROM pg_stat_user_indexes
    WHERE relname='file_chunks'
      AND indexrelname IN (
        'idx_file_chunks_embedding_hnsw',
        'idx_file_chunks_chunk_text_fts',
        'idx_file_chunks_file_name_fts',
        'idx_file_chunks_project'
      )
    ORDER BY indexrelname
  `);
  console.log("\n=== Index scan counts ===");
  for (const r of stats as unknown as Array<{ indexrelname: string; idx_scan: string }>) {
    console.log(`  ${r.indexrelname}: ${r.idx_scan} scans`);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
