import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { getEnv } from "../src/config/env.js";

async function main() {
  const env = getEnv();
  await initializeDb(env.databaseUrl!);
  const db = getDbIfInitialized()!;

  console.log("=== ALL file_chunks indexes ===");
  const idx = await db.execute<{ indexname: string; indexdef: string }>(sql`
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename='file_chunks' ORDER BY indexname
  `);
  for (const r of idx as unknown as Array<{ indexname: string; indexdef: string }>) {
    console.log(" ", r.indexname, "->", r.indexdef?.slice(0, 80));
  }

  console.log("\n=== CRITICAL MISSING INDEXES ===");
  const names = new Set((idx as unknown as Array<{ indexname: string }>).map(r => r.indexname));
  const needed = ["idx_file_chunks_embedding_hnsw", "idx_file_chunks_chunk_text_fts", "idx_file_chunks_file_name_fts"];
  for (const n of needed) console.log(" ", n, "->", names.has(n) ? "EXISTS" : "*** MISSING ***");

  console.log("\n=== embedding_vector column udt_name ===");
  const col = await db.execute<{ udt_name: string; data_type: string }>(sql`
    SELECT data_type, udt_name
    FROM information_schema.columns
    WHERE table_name='file_chunks' AND column_name='embedding_vector'
  `);
  for (const r of col as unknown as Array<{ udt_name: string; data_type: string }>) {
    console.log(" ", r.udt_name, r.data_type);
  }

  console.log("\n=== pg_stat_user_indexes for file_chunks ===");
  const stats = await db.execute<{ indexrelname: string; idx_scan: string }>(sql`
    SELECT indexrelname, idx_scan
    FROM pg_stat_user_indexes
    WHERE relname='file_chunks'
    ORDER BY idx_scan DESC
  `);
  for (const r of stats as unknown as Array<{ indexrelname: string; idx_scan: string }>) {
    console.log(" ", r.indexrelname, "scans:", r.idx_scan);
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
