import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { getEnv } from "../src/config/env.js";

async function main() {
  const env = getEnv();
  await initializeDb(env.databaseUrl!);
  const db = getDbIfInitialized()!;

  // Check and drop the invalid index
  const before = await db.execute<{ index_name: string; indisvalid: boolean }>(sql`
    SELECT i.indexrelid::regclass AS index_name, i.indisvalid
    FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'idx_file_chunks_chunk_text_fts'
  `);
  const row = (before as unknown as Array<{ index_name: string; indisvalid: boolean }>)[0];
  if (!row) {
    console.log("Index not found — will create fresh");
  } else if (row.indisvalid) {
    console.log("Index is already valid — nothing to do");
    process.exit(0);
  } else {
    console.log(`Index ${row.index_name} is INVALID — dropping it`);
    await db.execute(sql`DROP INDEX IF EXISTS idx_file_chunks_chunk_text_fts`);
    console.log("Dropped");
  }

  console.log(`\n[BUILD] idx_file_chunks_chunk_text_fts`);
  console.log(`  Started: ${new Date().toISOString()}`);
  const t0 = Date.now();

  await db.execute(sql.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_chunks_chunk_text_fts
    ON file_chunks
    USING GIN (to_tsvector('english', COALESCE(chunk_text, '')))
  `));

  const elapsed = Math.round((Date.now() - t0) / 1000);
  console.log(`  Done in ${elapsed}s — ${new Date().toISOString()}`);

  // Verify
  const after = await db.execute<{ index_name: string; indisvalid: boolean; index_size: string }>(sql`
    SELECT i.indexrelid::regclass AS index_name, i.indisvalid,
           pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
    FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'idx_file_chunks_chunk_text_fts'
  `);
  console.log("\nResult:", JSON.stringify(after, null, 2));

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
