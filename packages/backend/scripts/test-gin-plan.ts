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

  // Test with the CTE approach (no project filter in inner query, AS MATERIALIZED)
  const result = await db.transaction(async (tx) => {
    // No timeout — just get the plan
    const plan = await tx.execute<{ "QUERY PLAN": string }>(sql.raw(`
      EXPLAIN (FORMAT TEXT)
      WITH gin_hits AS MATERIALIZED (
        SELECT id
        FROM file_chunks
        WHERE (
          to_tsvector('english', COALESCE(chunk_text, '')) @@ ${tsquery}
          OR to_tsvector('english', COALESCE(file_name, '')) @@ ${tsquery}
        )
      )
      SELECT fc.id, fc.file_name,
        ts_rank_cd(to_tsvector('english', COALESCE(fc.chunk_text, '')), ${tsquery}) AS fts_rank
      FROM file_chunks fc
      JOIN gin_hits ON fc.id = gin_hits.id
      WHERE fc.project_id = '${PROJECT_ID}'
      ORDER BY fts_rank DESC
      LIMIT 20
    `));
    return plan;
  });

  console.log("\n=== EXPLAIN with GIN CTE approach ===");
  for (const row of result as unknown as Array<{ "QUERY PLAN": string }>) {
    console.log(row["QUERY PLAN"]);
  }

  // Check index scans now
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
