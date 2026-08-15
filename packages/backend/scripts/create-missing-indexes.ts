/**
 * Creates the 3 critical missing indexes on file_chunks:
 *   1. HNSW index for vector ANN search (pgvector)
 *   2. GIN index for FTS on chunk_text
 *   3. GIN index for FTS on file_name
 *
 * Uses CREATE INDEX CONCURRENTLY — cannot run inside a transaction.
 * Run times: HNSW ~20-60 min, each GIN ~5-15 min on 1.88M rows.
 */

import { config } from "dotenv";
config({ path: "../../.env" });
import { sql } from "drizzle-orm";
import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { getEnv } from "../src/config/env.js";

interface IndexDef {
  name: string;
  ddl: string;
}

const INDEXES: IndexDef[] = [
  {
    name: "idx_file_chunks_chunk_text_fts",
    ddl: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_chunks_chunk_text_fts
          ON file_chunks
          USING GIN (to_tsvector('english', COALESCE(chunk_text, '')))`,
  },
  {
    name: "idx_file_chunks_file_name_fts",
    ddl: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_chunks_file_name_fts
          ON file_chunks
          USING GIN (to_tsvector('english', COALESCE(file_name, '')))`,
  },
  {
    name: "idx_file_chunks_embedding_hnsw",
    ddl: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_chunks_embedding_hnsw
          ON file_chunks
          USING hnsw (embedding_vector vector_cosine_ops)
          WITH (m = 16, ef_construction = 64)`,
  },
];

async function checkExists(name: string, db: NonNullable<ReturnType<typeof getDbIfInitialized>>): Promise<boolean> {
  const rows = await db.execute<{ "?column?": number }>(
    sql`SELECT 1 FROM pg_indexes WHERE indexname = ${name}`
  );
  return (rows as unknown as unknown[]).length > 0;
}

async function main() {
  const env = getEnv();
  await initializeDb(env.databaseUrl!);
  const db = getDbIfInitialized()!;

  console.log("=== Missing index creation ===\n");

  for (const idx of INDEXES) {
    const exists = await checkExists(idx.name, db);
    if (exists) {
      console.log(`[SKIP] ${idx.name} — already exists`);
      continue;
    }

    console.log(`[BUILD] ${idx.name}`);
    console.log(`  Started: ${new Date().toISOString()}`);
    const t0 = Date.now();

    try {
      await db.execute(sql.raw(idx.ddl));
      const elapsed = Math.round((Date.now() - t0) / 1000);
      console.log(`  Done in ${elapsed}s — ${new Date().toISOString()}`);
    } catch (err) {
      console.error(`  FAILED: ${String(err)}`);
      // Continue to next index — partial indexes are harmless.
    }
    console.log();
  }

  console.log("=== Done ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
