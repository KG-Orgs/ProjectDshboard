/**
 * Merge duplicate file_records rows that arose when tier2-stream-index created
 * a new "local:" record for a file that OneDrive-sync had already registered
 * under its real item ID.
 *
 * A duplicate pair is: two rows in the same project with the same file_name,
 * one of which has chunk_count = 0 (the stale record the UI references via
 * activeDocFileId) and the other has chunk_count > 0 (the shadow record that
 * holds the actual indexed text).
 *
 * The fix:
 *   1. Re-parent all file_chunks from the shadow record to the canonical record.
 *   2. Recompute chunk_count on the canonical record.
 *   3. Delete the now-empty shadow record.
 *
 * Usage (from packages/backend):
 *   pnpm tsx scripts/dedup-file-records.ts                     # dry run
 *   pnpm tsx scripts/dedup-file-records.ts --apply             # apply
 *   pnpm tsx scripts/dedup-file-records.ts --project <uuid>    # specific project
 */

import { config } from "dotenv";
config({ path: "../../.env" });

import { randomUUID } from "node:crypto";
import { and, count, eq, gt, ne, sql } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords, fileChunks } from "../src/db/schema.js";

resetEnvCache();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseArgs(argv: string[]): { projectId?: string; apply: boolean } {
  let projectId: string | undefined;
  let apply = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") apply = true;
    else if (arg === "--project" && argv[i + 1]) {
      projectId = argv[++i];
      if (!UUID_RE.test(projectId!)) throw new Error(`invalid --project uuid: ${projectId}`);
    }
  }
  return { projectId, apply };
}

async function main() {
  const { projectId, apply } = parseArgs(process.argv.slice(2));
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl);

  // ── Find all (project_id, file_name) groups that have ≥2 records ──────────
  // We want: at least one record with 0 chunks and at least one with >0 chunks.
  const dupGroups = await db.execute<{
    project_id: string;
    file_name: string;
    rec_count: number;
  }>(sql`
    SELECT project_id, file_name, count(*)::int AS rec_count
    FROM file_records
    ${projectId ? sql`WHERE project_id = ${projectId}` : sql``}
    GROUP BY project_id, file_name
    HAVING count(*) > 1
  `);

  if (dupGroups.length === 0) {
    console.log("[dedup] No duplicate file_name groups found. Nothing to do.");
    process.exit(0);
  }

  console.log(`[dedup] Found ${dupGroups.length} duplicate file_name group(s). mode=${apply ? "APPLY" : "DRY RUN"}`);

  let merged = 0;
  let skipped = 0;

  for (const group of dupGroups) {
    const rows = await db
      .select({
        id: fileRecords.id,
        onedriveItemId: fileRecords.onedriveItemId,
        chunkCount: fileRecords.chunkCount,
        updatedAt: fileRecords.updatedAt,
      })
      .from(fileRecords)
      .where(
        and(
          eq(fileRecords.projectId, group.project_id),
          eq(fileRecords.fileName, group.file_name)
        )
      )
      .orderBy(fileRecords.chunkCount);  // ascending — 0-chunk first

    // Verify the pattern: at least one 0-chunk and at least one >0-chunk record.
    const zeroRecords = rows.filter((r) => (r.chunkCount ?? 0) === 0);
    const nonZeroRecords = rows.filter((r) => (r.chunkCount ?? 0) > 0);

    if (zeroRecords.length === 0 || nonZeroRecords.length === 0) {
      // All have the same chunk state — skip (manual review needed).
      console.log(`  SKIP  ${group.file_name} (${rows.length} records, all same chunk state)`);
      skipped++;
      continue;
    }

    // Canonical = the record with the highest chunk_count (most likely the OneDrive one the UI knows).
    // Shadow   = any record with fewer chunks (typically the "local:" ones).
    const canonical = nonZeroRecords.sort((a, b) => (b.chunkCount ?? 0) - (a.chunkCount ?? 0))[0]!;
    const shadows = [...zeroRecords, ...nonZeroRecords.slice(1)].filter((r) => r.id !== canonical.id);

    // Count how many chunks live in shadow records.
    const shadowIds = shadows.map((r) => r.id);
    const shadowChunkCount = await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM file_chunks
      WHERE file_id = ANY(${sql`ARRAY[${sql.join(shadowIds.map((id) => sql`${id}::uuid`), sql`, `)}]::uuid[]`})
    `);

    const totalShadowChunks = shadowChunkCount[0]?.n ?? 0;
    const canonicalLabel = canonical.onedriveItemId?.startsWith("local:") ? "local" : "onedrive";

    console.log(
      `  MERGE ${group.file_name}\n` +
      `        canonical=${canonical.id} (${canonicalLabel}, chunks=${canonical.chunkCount})\n` +
      `        shadows=${shadowIds.join(", ")} shadow_chunks=${totalShadowChunks}`
    );

    if (!apply) continue;

    await db.transaction(async (tx) => {
      // Re-parent shadow chunks to canonical.
      if (totalShadowChunks > 0) {
        for (const shadowId of shadowIds) {
          await tx.execute(sql`
            UPDATE file_chunks SET file_id = ${canonical.id}::uuid
            WHERE file_id = ${shadowId}::uuid
          `);
        }
      }

      // Re-parent chunk_links.file_id (FK to file_records.id) so we can delete shadows.
      for (const shadowId of shadowIds) {
        await tx.execute(sql`
          UPDATE chunk_links SET file_id = ${canonical.id}::uuid
          WHERE file_id = ${shadowId}::uuid
        `);
      }

      // Recompute canonical chunk_count.
      await tx.execute(sql`
        UPDATE file_records
        SET chunk_count = (SELECT count(*) FROM file_chunks WHERE file_id = ${canonical.id}::uuid),
            updated_at  = now()
        WHERE id = ${canonical.id}::uuid
      `);

      // Delete shadow records (no chunks or links remain in them now).
      for (const shadowId of shadowIds) {
        await tx.execute(sql`DELETE FROM file_records WHERE id = ${shadowId}::uuid`);
      }
    });

    merged++;
  }

  console.log(`\n[dedup] Done. merged=${merged} skipped=${skipped} ${apply ? "(APPLIED)" : "(DRY run — re-run with --apply to commit)"}`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
