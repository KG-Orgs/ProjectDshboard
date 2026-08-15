import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { getEnv } from "../src/config/env.js";

async function main() {
  const env = getEnv();
  await initializeDb(env.databaseUrl!);
  const db = getDbIfInitialized()!;

  // Check index validity and readiness
  const validity = await db.execute(sql`
    SELECT
      i.indexrelid::regclass AS index_name,
      i.indisvalid,
      i.indisready,
      i.indislive,
      c.reltuples AS estimated_rows,
      pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname IN (
      'idx_file_chunks_chunk_text_fts',
      'idx_file_chunks_file_name_fts',
      'idx_file_chunks_embedding_hnsw'
    )
  `);
  console.log("=== Index validity ===");
  console.log(JSON.stringify(validity, null, 2));

  // Check operator classes available for GIN tsvector
  const ops = await db.execute(sql`
    SELECT am.amname, opc.opcname, opc.opcintype::regtype AS input_type
    FROM pg_opclass opc
    JOIN pg_am am ON am.oid = opc.opcmethod
    WHERE am.amname = 'gin'
      AND opc.opcintype::regtype::text LIKE '%tsvector%'
  `);
  console.log("\n=== GIN operator classes for tsvector ===");
  console.log(JSON.stringify(ops, null, 2));

  // Count rows in the index via pg_stats
  const stats = await db.execute(sql`
    SELECT schemaname, tablename, attname, n_distinct, correlation
    FROM pg_stats
    WHERE tablename = 'file_chunks'
    LIMIT 10
  `);
  console.log("\n=== pg_stats sample ===");
  console.log(JSON.stringify(stats, null, 2));

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
