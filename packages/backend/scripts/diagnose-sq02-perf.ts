/**
 * Diagnostic script for sq02 retrieval timeout.
 * Runs EXPLAIN (ANALYZE, BUFFERS) on the exact pgvector and FTS queries
 * used in production for the "What scope of work and pricing is in Island
 * Pavement Cutting Co's subcontract" query against project 145b3dcf-...
 *
 * Usage (from packages/backend):
 *   pnpm tsx scripts/diagnose-sq02-perf.ts
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { getEnv } from "../src/config/env.js";

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

// sq02 query tokens used in ftsSearch fallback (top-4 longest tokens, AND-joined)
// tokenizeQuery("What scope of work and pricing is in Island Pavement Cutting Co's subcontract", 3)
//   longest-first: subcontract(11), pavement(8), cutting(7), pricing(7)
const FTS_FALLBACK_QUERY = "subcontract & pavement & cutting & pricing";

// websearch_to_tsquery for the full natural-language query
const FTS_WEBSEARCH_QUERY = "What scope of work and pricing is in Island Pavement Cutting Co's subcontract";

async function main() {
  const env = getEnv();
  if (!env.databaseUrl) throw new Error("DATABASE_URL not set");
  await initializeDb(env.databaseUrl);
  const db = getDbIfInitialized()!;

  console.log("=".repeat(72));
  console.log("SQ02 RETRIEVAL PERFORMANCE DIAGNOSTICS");
  console.log(`Project: ${PROJECT_ID}`);
  console.log("=".repeat(72));

  // ── 0. Table/index inventory ───────────────────────────────────────────────
  console.log("\n[0] INDEXES ON file_chunks\n");
  const indexes = await db.execute<{ indexname: string; indexdef: string }>(sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'file_chunks'
    ORDER BY indexname
  `);
  for (const row of indexes as unknown as Array<{ indexname: string; indexdef: string }>) {
    console.log(`  ${row.indexname}`);
    console.log(`    ${row.indexdef}`);
  }

  // ── 1. Row counts ──────────────────────────────────────────────────────────
  console.log("\n[1] ROW COUNTS\n");
  const [totalChunks] = await db.execute<{ cnt: string }>(sql`
    SELECT count(*) AS cnt FROM file_chunks
  `) as unknown as Array<{ cnt: string }>;
  const [projectChunks] = await db.execute<{ cnt: string }>(sql`
    SELECT count(*) AS cnt FROM file_chunks WHERE project_id = ${PROJECT_ID}
  `) as unknown as Array<{ cnt: string }>;
  const [embeddedProjectChunks] = await db.execute<{ cnt: string }>(sql`
    SELECT count(*) AS cnt FROM file_chunks
    WHERE project_id = ${PROJECT_ID} AND embedding_vector IS NOT NULL
  `) as unknown as Array<{ cnt: string }>;

  console.log(`  file_chunks total: ${totalChunks?.cnt}`);
  console.log(`  file_chunks for project: ${projectChunks?.cnt}`);
  console.log(`  file_chunks with embedding for project: ${embeddedProjectChunks?.cnt}`);

  // ── 2. EXPLAIN ANALYZE — pgvector query (dummy 1024-dim zero vector) ───────
  console.log("\n[2] EXPLAIN (ANALYZE, BUFFERS) — pgvector ANN query\n");
  console.log("    (using zero vector — plan is identical regardless of vector values)\n");
  const dummyVec = `[${Array(1024).fill(0).join(",")}]`;
  try {
    const vectorExplain = await db.execute<{ "QUERY PLAN": string }>(sql.raw(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT fc.id, fc.file_id, fc.file_name, fc.chunk_index,
             1 - (fc.embedding_vector <=> '${dummyVec}'::vector) AS similarity
      FROM file_chunks fc
      JOIN file_records fr ON fr.id = fc.file_id
      WHERE fc.project_id = '${PROJECT_ID}'
        AND fc.embedding_vector IS NOT NULL
      ORDER BY fc.embedding_vector <=> '${dummyVec}'::vector
      LIMIT 24
    `));
    for (const row of vectorExplain as unknown as Array<{ "QUERY PLAN": string }>) {
      console.log("  " + row["QUERY PLAN"]);
    }
  } catch (err) {
    console.log("  ERROR:", err instanceof Error ? err.message : String(err));
  }

  // ── 3. EXPLAIN ANALYZE — FTS websearch_to_tsquery ─────────────────────────
  console.log("\n[3] EXPLAIN (ANALYZE, BUFFERS) — FTS websearch_to_tsquery\n");
  console.log(`    tsquery: websearch_to_tsquery('english', '${FTS_WEBSEARCH_QUERY.slice(0,60)}...')\n`);
  try {
    const ftsExplain = await db.execute<{ "QUERY PLAN": string }>(sql.raw(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT fc.id, fc.file_id, fc.file_name
      FROM file_chunks fc
      JOIN file_records fr ON fr.id = fc.file_id
      WHERE fc.project_id = '${PROJECT_ID}'
        AND (
          to_tsvector('english', COALESCE(fc.chunk_text, '')) @@
            websearch_to_tsquery('english', ${sql.placeholder("q")}::text)
          OR
          to_tsvector('english', COALESCE(fc.file_name, '')) @@
            websearch_to_tsquery('english', ${sql.placeholder("q")}::text)
        )
      ORDER BY (
        ts_rank_cd(to_tsvector('english', COALESCE(fc.chunk_text, '')),
                   websearch_to_tsquery('english', ${sql.placeholder("q")}::text))
        + ts_rank_cd(to_tsvector('english', COALESCE(fc.file_name, '')),
                     websearch_to_tsquery('english', ${sql.placeholder("q")}::text))
      ) DESC
      LIMIT 32
    `));
    for (const row of ftsExplain as unknown as Array<{ "QUERY PLAN": string }>) {
      console.log("  " + row["QUERY PLAN"]);
    }
  } catch (err) {
    // Fallback: use raw SQL without parameterised placeholder
    try {
      const ftsExplainRaw = await db.execute<{ "QUERY PLAN": string }>(sql.raw(`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
        SELECT fc.id, fc.file_id, fc.file_name
        FROM file_chunks fc
        JOIN file_records fr ON fr.id = fc.file_id
        WHERE fc.project_id = '${PROJECT_ID}'
          AND (
            to_tsvector('english', COALESCE(fc.chunk_text, '')) @@
              websearch_to_tsquery('english', 'scope work pricing island pavement cutting subcontract')
            OR
            to_tsvector('english', COALESCE(fc.file_name, '')) @@
              websearch_to_tsquery('english', 'scope work pricing island pavement cutting subcontract')
          )
        ORDER BY (
          ts_rank_cd(to_tsvector('english', COALESCE(fc.chunk_text, '')),
                     websearch_to_tsquery('english', 'scope work pricing island pavement cutting subcontract'))
          + ts_rank_cd(to_tsvector('english', COALESCE(fc.file_name, '')),
                       websearch_to_tsquery('english', 'scope work pricing island pavement cutting subcontract'))
        ) DESC
        LIMIT 32
      `));
      for (const row of ftsExplainRaw as unknown as Array<{ "QUERY PLAN": string }>) {
        console.log("  " + row["QUERY PLAN"]);
      }
    } catch (err2) {
      console.log("  ERROR:", err2 instanceof Error ? err2.message : String(err2));
    }
  }

  // ── 4. EXPLAIN ANALYZE — FTS fallback to_tsquery (AND of top tokens) ───────
  console.log("\n[4] EXPLAIN (ANALYZE, BUFFERS) — FTS fallback to_tsquery\n");
  console.log(`    tsquery: to_tsquery('english', '${FTS_FALLBACK_QUERY}')\n`);
  try {
    const ftsFallbackExplain = await db.execute<{ "QUERY PLAN": string }>(sql.raw(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT fc.id, fc.file_id, fc.file_name
      FROM file_chunks fc
      JOIN file_records fr ON fr.id = fc.file_id
      WHERE fc.project_id = '${PROJECT_ID}'
        AND (
          to_tsvector('english', COALESCE(fc.chunk_text, '')) @@
            to_tsquery('english', '${FTS_FALLBACK_QUERY}')
          OR
          to_tsvector('english', COALESCE(fc.file_name, '')) @@
            to_tsquery('english', '${FTS_FALLBACK_QUERY}')
        )
      LIMIT 32
    `));
    for (const row of ftsFallbackExplain as unknown as Array<{ "QUERY PLAN": string }>) {
      console.log("  " + row["QUERY PLAN"]);
    }
  } catch (err) {
    console.log("  ERROR:", err instanceof Error ? err.message : String(err));
  }

  // ── 5. Project distribution — are rows clustered or spread? ───────────────
  console.log("\n[5] PHYSICAL BLOCK DISTRIBUTION (project filter selectivity)\n");
  const [blockStats] = await db.execute<{
    total_blocks: string; project_blocks: string; selectivity: string;
  }>(sql`
    SELECT
      (SELECT relpages FROM pg_class WHERE relname = 'file_chunks') AS total_blocks,
      count(DISTINCT (ctid::text::point)[0]) AS project_blocks,
      round(
        count(DISTINCT (ctid::text::point)[0])::numeric /
        NULLIF((SELECT relpages FROM pg_class WHERE relname = 'file_chunks'), 0) * 100,
        1
      ) AS selectivity
    FROM file_chunks
    WHERE project_id = ${PROJECT_ID}
  `) as unknown as Array<{ total_blocks: string; project_blocks: string; selectivity: string }>;
  console.log(`  Total table blocks: ${blockStats?.total_blocks}`);
  console.log(`  Blocks containing project rows: ${blockStats?.project_blocks}`);
  console.log(`  Physical selectivity: ${blockStats?.selectivity}% of table`);
  console.log("  (if ~100%, project rows are spread across the whole table → filter is expensive)");

  // ── 6. HNSW index metadata ─────────────────────────────────────────────────
  console.log("\n[6] HNSW INDEX METADATA\n");
  try {
    const hnswInfo = await db.execute<{
      indexname: string; index_size: string; table_size: string;
    }>(sql`
      SELECT
        i.relname AS indexname,
        pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
        pg_size_pretty(pg_relation_size(t.oid)) AS table_size
      FROM pg_class t
      JOIN pg_index ix ON ix.indrelid = t.oid
      JOIN pg_class i ON i.oid = ix.indexrelid
      WHERE t.relname = 'file_chunks'
        AND i.relname LIKE '%hnsw%'
    `);
    for (const row of hnswInfo as unknown as Array<{ indexname: string; index_size: string; table_size: string }>) {
      console.log(`  Index: ${row.indexname}`);
      console.log(`    Index size: ${row.index_size}`);
      console.log(`    Table size: ${row.table_size}`);
    }
  } catch (err) {
    console.log("  Could not query HNSW metadata:", err instanceof Error ? err.message : String(err));
  }

  // ── 7. GIN index usage check ──────────────────────────────────────────────
  console.log("\n[7] GIN INDEX STATS (usage counts)\n");
  const ginStats = await db.execute<{ relname: string; idx_scan: string; idx_tup_read: string }>(sql`
    SELECT
      c.relname,
      s.idx_scan,
      s.idx_tup_read
    FROM pg_stat_user_indexes s
    JOIN pg_class c ON c.oid = s.indexrelid
    WHERE s.relname = 'file_chunks'
      AND c.relname LIKE '%fts%'
    ORDER BY s.idx_scan DESC
  `);
  for (const row of ginStats as unknown as Array<{ relname: string; idx_scan: string; idx_tup_read: string }>) {
    console.log(`  ${row.relname}: scans=${row.idx_scan} tuples_read=${row.idx_tup_read}`);
  }
  if ((ginStats as unknown as unknown[]).length === 0) {
    console.log("  No GIN index stats found (may not have been used yet or stats reset)");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
