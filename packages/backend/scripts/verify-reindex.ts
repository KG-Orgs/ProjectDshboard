/**
 * Verify that the DOCX reindex actually wrote chunks to DB by checking
 * a few specific files from the reindex log.
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { sql, eq, and, ilike } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";
resetEnvCache();

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

// Files that appeared in the DOCX reindex log with chunks > 0
const TEST_FILES = [
  // From log line [w3 1965/2750] ✔ chunks=159
  "M017_MLJ_50 States_Subcontract_DRAFT_20250311.docx",
  // From log line [w1 1964/2750] ✔ chunks=159  
  "50 States Subcontract - DRAFT 3.7.25.docx",
  // From log line [w4 2735/2750] ✔ chunks=7
  "A37806_ADA P6_RFI043_LCIS POWER CLARIFICATION_REV01.docx",
  // The IMP files
  "M017_IMP_Draft Subcontract_20251024.docx",
  "M017_IMP_Draft Subcontract_20260218.docx",
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl);

  for (const fileName of TEST_FILES) {
    const records = await db
      .select({ id: fileRecords.id, chunkCount: fileRecords.chunkCount, updatedAt: fileRecords.updatedAt, onedriveItemId: fileRecords.onedriveItemId })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), ilike(fileRecords.fileName, `%${fileName}%`)));

    if (records.length === 0) {
      console.log(`${fileName}: NO RECORD FOUND`);
      continue;
    }
    for (const r of records) {
      const [counts] = await db.execute<{ total: number }>(sql`
        SELECT count(*)::int AS total FROM file_chunks WHERE file_id = ${r.id}::uuid
      `);
      const updated = r.updatedAt ? new Date(r.updatedAt as unknown as string).toISOString().slice(0,19) : "null";
      const gotChunks = (counts?.total ?? 0) > 0 ? "✅" : "❌";
      console.log(`${gotChunks} ${fileName}`);
      console.log(`   chunkCount(col)=${r.chunkCount}  actual=${counts?.total}  updated=${updated}`);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
