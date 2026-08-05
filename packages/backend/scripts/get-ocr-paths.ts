/**
 * Get corpus folder paths for zero-chunk files that need OCR.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";
import path from "node:path";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

const TARGETS = [
  { sq: "sq07/08", pat: "%GEN-027R00%Crossroads%" },
  { sq: "sq83", pat: "%GEN-021R00%Diego%" },
  { sq: "sq92/93", pat: "%NOR-010R00%CCTV%" },
  { sq: "sq97", pat: "%GEN-014R00%Monthly%Quality%" },
  { sq: "sq22", pat: "%BUR-001R00%Staircase%" },
  { sq: "sq54/55", pat: "%BUR-081R00%" },
  { sq: "sq58/59", pat: "%MYR-076R00%" },
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  const seenFolders = new Set<string>();
  for (const { sq, pat } of TARGETS) {
    const rows = await db
      .select({ fp: fileRecords.filePath, fn: fileRecords.fileName, cnt: fileRecords.chunkCount, ext: fileRecords.fileType })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));
    if (rows.length === 0) { console.log(`[${sq}] NOT FOUND`); continue; }
    for (const r of rows.filter(r => r.fp && r.ext === "pdf").slice(0, 1)) {
      const folder = path.dirname(r.fp);
      if (!seenFolders.has(folder)) {
        seenFolders.add(folder);
        console.log(`[${sq}] chunks=${r.cnt} | folder: ${folder}`);
      }
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
