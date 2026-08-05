/**
 * Get file IDs for the 11 questions lost from v3 to v4 (need vector search).
 * Check if these files have chunks and add activeDocFileId.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq, gt } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

const TARGETS = [
  { sq: "sq07/08", pat: "%GEN-027%" },
  { sq: "sq07/08b", pat: "%Crossroads%JV%" },
  { sq: "sq23", pat: "%BUR-001R00%" },
  { sq: "sq54/55", pat: "%BUR-081%" },
  { sq: "sq58/59", pat: "%MYR-076%" },
  { sq: "sq83", pat: "%GEN-021%" },
  { sq: "sq92/93", pat: "%NOR-010%" },
  { sq: "sq97", pat: "%GEN-014%" },
  { sq: "sq97b", pat: "%Quality%Certification%Report%" },
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  const seen = new Set<string>();
  for (const { sq, pat } of TARGETS) {
    if (seen.has(pat)) continue;
    seen.add(pat);
    const rows = await db
      .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount, ext: fileRecords.fileType })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));
    const withChunks = rows.filter(r => r.cnt > 0);
    if (withChunks.length > 0) {
      for (const r of withChunks.slice(0, 2)) {
        console.log(`[${sq}] ✅ ${r.id} | chunks=${r.cnt} | ${r.fn.slice(0, 70)}`);
      }
    } else if (rows.length > 0) {
      for (const r of rows.slice(0, 2)) {
        console.log(`[${sq}] ❌ 0 chunks | ${r.ext} | ${r.fn.slice(0, 70)}`);
      }
    } else {
      console.log(`[${sq}] NOT IN DB: ${pat}`);
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
