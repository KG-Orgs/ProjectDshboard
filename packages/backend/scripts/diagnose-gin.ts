import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { getEnv } from "../src/config/env.js";

async function main() {
  const env = getEnv();
  await initializeDb(env.databaseUrl!);
  const db = getDbIfInitialized()!;

  // 1. Show the actual index definition
  const idxDef = await db.execute<{ indexdef: string }>(sql`
    SELECT indexdef FROM pg_indexes
    WHERE indexname IN ('idx_file_chunks_chunk_text_fts', 'idx_file_chunks_file_name_fts')
  `);
  console.log("=== Index definitions ===");
  for (const r of idxDef as unknown as Array<{ indexdef: string }>) {
    console.log(r.indexdef);
  }

  // 2. Check pg_stats for the expression indexes
  const stats = await db.execute(sql`
    SELECT attname, n_distinct, most_common_freqs
    FROM pg_stats
    WHERE tablename = 'file_chunks'
      AND attname LIKE '%tsvector%'
    LIMIT 5
  `);
  console.log("\n=== pg_stats for tsvector columns ===");
  console.log(JSON.stringify(stats, null, 2));

  // 3. Check if index stats exist at all for the GIN indexes
  const idxStats = await db.execute(sql`
    SELECT schemaname, tablename, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE tablename = 'file_chunks'
      AND indexrelname LIKE '%fts%'
  `);
  console.log("\n=== GIN index stats ===");
  console.log(JSON.stringify(idxStats, null, 2));

  // 4. Test: EXPLAIN with enable_seqscan=off (should force GIN)
  const planFts = await db.execute<{ "QUERY PLAN": string }>(sql.raw(`
    EXPLAIN (FORMAT TEXT)
    SELECT id FROM file_chunks WHERE
      to_tsvector('english', COALESCE(chunk_text, ''))
      @@ websearch_to_tsquery('english', 'island pavement cutting')
    LIMIT 10
  `));
  console.log("\n=== EXPLAIN simple FTS (no set) ===");
  for (const r of planFts as unknown as Array<{ "QUERY PLAN": string }>) {
    console.log(r["QUERY PLAN"]);
  }

  // 5. Force with enable_seqscan off
  const planForced = await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET LOCAL enable_seqscan = off`));
    return tx.execute<{ "QUERY PLAN": string }>(sql.raw(`
      EXPLAIN (FORMAT TEXT)
      SELECT id FROM file_chunks WHERE
        to_tsvector('english', COALESCE(chunk_text, ''))
        @@ websearch_to_tsquery('english', 'island pavement cutting')
      LIMIT 10
    `));
  });
  console.log("\n=== EXPLAIN simple FTS (enable_seqscan=off) ===");
  for (const r of planForced as unknown as Array<{ "QUERY PLAN": string }>) {
    console.log(r["QUERY PLAN"]);
  }

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
