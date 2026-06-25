/**
 * Purge extraction-garbage chunks (mojibake from binary .pptx/.docx/.msg bytes)
 * from the index. These chunks were embedded as noise; ~18% of the corpus
 * matched this profile in MLJ-017. They are now gated at index time and filtered
 * at retrieval time, but the existing rows still bloat the table and the HNSW
 * index, so this one-time maintenance removes them.
 *
 * The garbage predicate is kept in lock-step with isLikelyGarbageText
 * (text-ranking.utils.ts): a chunk is garbage when, for text >= 16 chars,
 *   - replacement-char (U+FFFD) ratio > 0.05, OR
 *   - non-printable ratio > 0.45 (i.e. printable-ASCII+whitespace ratio < 0.55).
 *
 * Safety:
 *   - DRY RUN by default: prints counts + samples and changes nothing.
 *   - Pass --apply to delete. All deletes run in a single transaction.
 *   - chunk_links referencing a purged chunk are deleted first (no ON DELETE
 *     CASCADE on that FK), then the chunks, then file_records.chunk_count is
 *     recomputed (including files emptied entirely).
 *
 * Usage (from packages/backend):
 *   npx tsx scripts/purge-garbage-chunks.ts                 # dry run, default project
 *   npx tsx scripts/purge-garbage-chunks.ts --project <id>  # dry run, specific project
 *   npx tsx scripts/purge-garbage-chunks.ts --apply         # delete
 */

import { config } from "dotenv";
config({ path: "/Users/kyle.weixu/src/ai-assistant/.env" });

const DEFAULT_PROJECT_ID = "731cfd5d-e647-4551-89e7-0a3cc4915115";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseArgs(argv: string[]): { projectId: string; apply: boolean } {
  let projectId = DEFAULT_PROJECT_ID;
  let apply = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") apply = true;
    else if (arg === "--project") projectId = argv[++i] ?? projectId;
  }
  if (!UUID_RE.test(projectId)) {
    throw new Error(`invalid --project uuid: ${projectId}`);
  }
  return { projectId, apply };
}

async function main() {
  const { projectId, apply } = parseArgs(process.argv.slice(2));

  const { initializeDb, getDbIfInitialized } = await import("../src/db");
  initializeDb(process.env.DATABASE_URL);
  const db = getDbIfInitialized();
  if (!db) throw new Error("database not initialized (DATABASE_URL set?)");
  const { sql } = await import("drizzle-orm");

  // Parity with isLikelyGarbageText. Bound params are safe; the regex/U& literals
  // need doubled backslashes so the actual SQL string keeps a single backslash.
  const garbagePredicate = sql`
    length(fc.chunk_text) >= 16
    AND (
      (length(fc.chunk_text) - length(replace(fc.chunk_text, U&'\\FFFD', '')))::float
        / length(fc.chunk_text) > 0.05
      OR length(regexp_replace(fc.chunk_text, '[\\x20-\\x7E\\s]', '', 'g'))::float
        / length(fc.chunk_text) > 0.45
    )
  `;

  console.log(`[purge] project=${projectId} mode=${apply ? "APPLY (will delete)" : "DRY RUN"}`);

  await db.transaction(async (tx) => {
    // Materialize the garbage set once (the predicate scans ~1.18M rows).
    await tx.execute(sql`
      CREATE TEMP TABLE _garbage ON COMMIT DROP AS
      SELECT fc.id, fc.file_id
      FROM file_chunks fc
      WHERE fc.project_id = ${projectId}
        AND ${garbagePredicate}
    `);
    await tx.execute(sql`CREATE INDEX ON _garbage (id)`);
    // Without stats the planner picks nested loops for the chunk_links semi-joins.
    await tx.execute(sql`ANALYZE _garbage`);

    const totals = await tx.execute<{ chunks: number; files: number }>(sql`
      SELECT count(*)::int AS chunks, count(DISTINCT file_id)::int AS files FROM _garbage
    `);
    // Count via two index-driven semi-joins (UNION dedups links where both
    // endpoints are garbage). A single OR across the two FK columns can't use
    // both btree indexes and degrades to a scan/nested-loop.
    const links = await tx.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM (
        SELECT cl.id FROM chunk_links cl JOIN _garbage g ON g.id = cl.source_chunk_id
        UNION
        SELECT cl.id FROM chunk_links cl JOIN _garbage g ON g.id = cl.target_chunk_id
      ) u
    `);
    const emptied = await tx.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM (
        SELECT g.file_id, count(*) AS gc FROM _garbage g GROUP BY g.file_id
      ) x
      JOIN (
        SELECT file_id, count(*) AS tc FROM file_chunks
        WHERE project_id = ${projectId} GROUP BY file_id
      ) y ON y.file_id = x.file_id
      WHERE x.gc = y.tc
    `);
    const samples = await tx.execute<{ file_name: string; snip: string }>(sql`
      SELECT fc.file_name, left(regexp_replace(fc.chunk_text, '\\s+', ' ', 'g'), 70) AS snip
      FROM file_chunks fc JOIN _garbage g ON g.id = fc.id
      LIMIT 8
    `);

    const garbageChunks = totals[0]?.chunks ?? 0;
    const affectedFiles = totals[0]?.files ?? 0;
    console.log(`[purge] garbage chunks:      ${garbageChunks}`);
    console.log(`[purge] files affected:      ${affectedFiles}`);
    console.log(`[purge] files fully emptied: ${emptied[0]?.n ?? 0}`);
    console.log(`[purge] chunk_links to drop: ${links[0]?.n ?? 0}`);
    console.log(`[purge] sample garbage chunks:`);
    for (const s of samples) {
      console.log(`   ${s.file_name.slice(0, 50)} :: ${s.snip}`);
    }

    if (!apply) {
      console.log("[purge] DRY RUN — no changes made. Re-run with --apply to delete.");
      return;
    }

    // Two index-driven deletes (see count note above). The second only touches
    // links not already removed by the first.
    const deletedBySource = await tx.execute(sql`
      DELETE FROM chunk_links cl USING _garbage g WHERE g.id = cl.source_chunk_id
    `);
    const deletedByTarget = await tx.execute(sql`
      DELETE FROM chunk_links cl USING _garbage g WHERE g.id = cl.target_chunk_id
    `);
    const deletedLinks = {
      count: (deletedBySource.count ?? 0) + (deletedByTarget.count ?? 0),
    };
    const deletedChunks = await tx.execute(sql`
      DELETE FROM file_chunks WHERE id IN (SELECT id FROM _garbage)
    `);
    // Recompute the cached chunk_count for files that still have chunks...
    await tx.execute(sql`
      UPDATE file_records fr
      SET chunk_count = sub.cnt
      FROM (
        SELECT file_id, count(*)::int AS cnt FROM file_chunks
        WHERE project_id = ${projectId} GROUP BY file_id
      ) sub
      WHERE fr.id = sub.file_id AND fr.project_id = ${projectId}
    `);
    // ...and zero it for files that lost all of their chunks.
    await tx.execute(sql`
      UPDATE file_records
      SET chunk_count = 0
      WHERE project_id = ${projectId}
        AND id NOT IN (SELECT DISTINCT file_id FROM file_chunks WHERE project_id = ${projectId})
    `);

    console.log(`[purge] APPLIED: deleted ${deletedChunks.count ?? garbageChunks} chunks, ${deletedLinks.count ?? "?"} links; chunk_count recomputed.`);
  });

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
