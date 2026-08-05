/**
 * Check for shadow records by onedriveItemId prefix and orphaned chunks.
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { sql, eq, and, ilike, like } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords, fileChunks } from "../src/db/schema.js";
resetEnvCache();

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl);

  // Look for any record with local:13 - SUBCONTRACTS path for M017_IMP
  const shadowId = "local:13 - SUBCONTRACTS\\IMP PLUMBING\\SS\\M017_IMP_Draft Subcontract_20251024.docx";
  const [shadow] = await db
    .select({ id: fileRecords.id, onedriveItemId: fileRecords.onedriveItemId, chunkCount: fileRecords.chunkCount, updatedAt: fileRecords.updatedAt })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, PROJECT_ID), eq(fileRecords.onedriveItemId, shadowId)));

  if (shadow) {
    const [counts] = await db.execute<{ total: number }>(sql`
      SELECT count(*)::int AS total FROM file_chunks WHERE file_id = ${shadow.id}::uuid
    `);
    console.log(`Shadow record found: id=${shadow.id} chunkCount=${shadow.chunkCount} updated=${shadow.updatedAt?.toISOString()} actual=${counts?.total}`);
  } else {
    console.log("No shadow record found with local:13 - SUBCONTRACTS path.");
  }

  // Also count ALL records for this project that have chunkCount > 0 with M017_IMP in any field
  const [result] = await db.execute<{ count: number }>(sql`
    SELECT count(*)::int FROM file_records 
    WHERE project_id = ${PROJECT_ID}::uuid
    AND (file_name ILIKE '%M017_IMP%' OR onedrive_item_id ILIKE '%M017_IMP%')
  `);
  console.log(`Total file_records matching M017_IMP (any field): ${result?.count}`);

  // Show ALL of them
  const all = await db.execute<{ id: string; onedrive_item_id: string; file_name: string; chunk_count: number; updated_at: Date }>(sql`
    SELECT id, onedrive_item_id, file_name, chunk_count, updated_at 
    FROM file_records 
    WHERE project_id = ${PROJECT_ID}::uuid
    AND (file_name ILIKE '%M017_IMP%' OR onedrive_item_id ILIKE '%M017_IMP%')
    ORDER BY updated_at DESC
  `);
  for (const r of all) {
    const [chunks] = await db.execute<{ total: number }>(sql`
      SELECT count(*)::int AS total FROM file_chunks WHERE file_id = ${r.id}::uuid
    `);
    const upd = r.updated_at ? new Date(r.updated_at as unknown as string).toISOString().slice(0,19) : "null";
    console.log(`  id=${r.id} fileName=${r.file_name} chunkCount=${r.chunk_count} actual=${chunks?.total} updated=${upd}`);
    console.log(`    onedriveItemId=${r.onedrive_item_id}`);
  }

  // Check the GEN-042R00 FIO meeting minutes specifically
  console.log("\n--- GEN-042R00 FIO Coordination Meeting ---");
  const genFio = await db.execute<{ id: string; onedrive_item_id: string; chunk_count: number; updated_at: Date }>(sql`
    SELECT id, onedrive_item_id, chunk_count, updated_at 
    FROM file_records 
    WHERE project_id = ${PROJECT_ID}::uuid
    AND file_name ILIKE '%GEN-042R00%FIO%Coordination%'
  `);
  for (const r of genFio) {
    const [chunks] = await db.execute<{ total: number }>(sql`
      SELECT count(*)::int AS total FROM file_chunks WHERE file_id = ${r.id}::uuid
    `);
    const upd = r.updated_at ? new Date(r.updated_at as unknown as string).toISOString().slice(0,19) : "null";
    console.log(`  id=${r.id} chunkCount=${r.chunk_count} actual=${chunks?.total} updated=${upd}`);
    console.log(`    path=${r.onedrive_item_id}`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
