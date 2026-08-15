import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { getEnv } from "../src/config/env.js";

async function main() {
  const env = getEnv();
  await initializeDb(env.databaseUrl!);
  const db = getDbIfInitialized()!;

  // Check index scan counts
  const r = await db.execute<{ indexrelname: string; idx_scan: string }>(sql`
    SELECT indexrelname, idx_scan
    FROM pg_stat_user_indexes
    WHERE relname='file_chunks'
      AND indexrelname IN (
        'idx_file_chunks_embedding_hnsw',
        'idx_file_chunks_chunk_text_fts',
        'idx_file_chunks_file_name_fts'
      )
    ORDER BY indexrelname
  `);
  for (const row of r as unknown as Array<{ indexrelname: string; idx_scan: string }>) {
    console.log(`  ${row.indexrelname}: ${row.idx_scan} scans`);
  }

  // Run ANALYZE to refresh planner statistics
  console.log("\nRunning ANALYZE file_chunks ...");
  await db.execute(sql`ANALYZE file_chunks`);
  console.log("ANALYZE done");

  // Quick test: explain a vector query
  const explain = await db.execute<{ "QUERY PLAN": string }>(sql`
    EXPLAIN (FORMAT TEXT)
    SELECT id FROM file_chunks
    ORDER BY embedding_vector <=> (SELECT embedding_vector FROM file_chunks LIMIT 1)
    LIMIT 20
  `);
  console.log("\nEXPLAIN for vector ORDER BY <=> LIMIT 20:");
  for (const row of explain as unknown as Array<{ "QUERY PLAN": string }>) {
    console.log("  " + row["QUERY PLAN"]);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
