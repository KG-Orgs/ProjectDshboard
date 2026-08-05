/**
 * Count zero-chunk PDF files in specific target folders.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";
const BASE = "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\";

const FOLDERS = [
  { sq: "sq92/93 (CCTV)", folder: BASE + "33 - UTILITIES\\33 14 15 Sewer and Water Main Work\\" },
  { sq: "sq97 (Quality)", folder: BASE + "01 40 10 Quality Management\\" },
  { sq: "sq07/08 (Subcontractors)", folder: BASE + "PRDC SUBCONTRACTORS\\" },
  { sq: "sq22 (Staircase)", folder: BASE + "08 - OPENINGS\\08 45 25 - Interior Porcelain Enamel Panel\\BUR\\" },
  { sq: "sq83 (Safety)", folder: "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\01 35 10 Construction Safety Requirements\\" },
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);
  for (const { sq, folder } of FOLDERS) {
    const rows = await db
      .select({ id: fileRecords.id, cnt: fileRecords.chunkCount, ext: fileRecords.fileType })
      .from(fileRecords)
      .where(and(
        eq(fileRecords.projectId, PROJECT_ID),
        sql`${fileRecords.filePath} LIKE ${folder + "%"}`
      ));
    const zero = rows.filter(r => r.cnt === 0).length;
    const hasChunks = rows.filter(r => r.cnt > 0).length;
    console.log(`[${sq}] ${rows.length} total PDFs | ${hasChunks} with chunks | ${zero} zero-chunk (need OCR)`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
