/**
 * Broad diagnostic: find ALL file_records + chunk counts for a given fileName,
 * and find any orphaned chunks (chunks whose file_id has no file_record).
 * Run: pnpm tsx scripts/diagnose-broad.ts
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { sql, eq, and, ilike } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords, fileChunks } from "../src/db/schema.js";
resetEnvCache();

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";
const FILE_NAME = "M017_IMP_Draft Subcontract_20251024.docx";

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl);

  // All records for this file name across ALL projects
  const records = await db
    .select({
      id: fileRecords.id,
      projectId: fileRecords.projectId,
      onedriveItemId: fileRecords.onedriveItemId,
      fileName: fileRecords.fileName,
      chunkCount: fileRecords.chunkCount,
      indexStatus: fileRecords.indexStatus,
      updatedAt: fileRecords.updatedAt,
    })
    .from(fileRecords)
    .where(ilike(fileRecords.fileName, `%${FILE_NAME}%`));

  console.log(`\nALL file_records matching "${FILE_NAME}" (all projects):`);
  for (const r of records) {
    const [counts] = await db.execute<{ total: number; with_embedding: number }>(sql`
      SELECT count(*)::int AS total,
             count(embedding_vector)::int AS with_embedding
      FROM file_chunks WHERE file_id = ${r.id}::uuid
    `);
    console.log(`  id=${r.id}`);
    console.log(`    project=${r.projectId}`);
    console.log(`    onedriveItemId=${r.onedriveItemId}`);
    console.log(`    fileName=${r.fileName}`);
    console.log(`    chunkCount(col)=${r.chunkCount}  status=${r.indexStatus}  updated=${r.updatedAt?.toISOString()}`);
    console.log(`    actual chunks: total=${counts?.total ?? 0}  with_embedding=${counts?.with_embedding ?? 0}`);
    console.log();
  }

  // Also check for GEN-042R00
  const genFile = "GEN-042R00";
  const genRecords = await db
    .select({
      id: fileRecords.id,
      projectId: fileRecords.projectId,
      onedriveItemId: fileRecords.onedriveItemId,
      fileName: fileRecords.fileName,
      chunkCount: fileRecords.chunkCount,
      indexStatus: fileRecords.indexStatus,
      updatedAt: fileRecords.updatedAt,
    })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, PROJECT_ID), ilike(fileRecords.fileName, `%${genFile}%`)));

  console.log(`\nfile_records matching "${genFile}" in project:`);
  for (const r of genRecords) {
    const [counts] = await db.execute<{ total: number; with_embedding: number }>(sql`
      SELECT count(*)::int AS total,
             count(embedding_vector)::int AS with_embedding
      FROM file_chunks WHERE file_id = ${r.id}::uuid
    `);
    console.log(`  id=${r.id}  fileName=${r.fileName}`);
    console.log(`    onedriveItemId=${r.onedriveItemId}`);
    console.log(`    chunkCount(col)=${r.chunkCount}  status=${r.indexStatus}  updated=${r.updatedAt?.toISOString()}`);
    console.log(`    actual chunks: total=${counts?.total ?? 0}  with_embedding=${counts?.with_embedding ?? 0}`);
    console.log();
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
