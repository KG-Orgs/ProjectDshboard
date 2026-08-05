/**
 * Get file IDs for questions needing activeDocFileId.
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
  { sq: "sq36/37", pat: "%Kick%Off%Pre-Work%Final%" },     // the PDF version
  { sq: "sq36/37-pptx", pat: "%Kick%Off%Pre-Work%.pptx" },
  { sq: "sq60/61", pat: "%Burnside%VECP%Presentation%.pdf" },
  { sq: "sq18", pat: "%AVI-002R0%Foundation%Rebar%" },
  { sq: "sq49", pat: "%MDT-005R00%FIO%Tree%Work%" },
  { sq: "sq65", pat: "%J-TRACK-13A-041R00%Cert%" },
  { sq: "sq72", pat: "%MYR-A-444A%.pdf" },
  { sq: "sq75", pat: "%GEN-096R04%SWP-016%" },
  { sq: "sq62", pat: "%GEN-006R00%NCR%Template%" },
  { sq: "sq06", pat: "%Pre-Proposal%Slideshow%" },
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  for (const { sq, pat } of TARGETS) {
    const rows = await db
      .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`, gt(fileRecords.chunkCount, 0)));
    if (rows.length === 0) {
      // Try without chunk count filter
      const all = await db
        .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount })
        .from(fileRecords)
        .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));
      console.log(`[${sq}] ${pat} → NO CHUNKS (${all.length} records total)`);
      for (const r of all.slice(0, 2)) console.log(`  ${r.id} | chunks=${r.cnt} | ${r.fn}`);
    } else {
      for (const r of rows.slice(0, 1)) {
        console.log(`[${sq}] ${r.id} | chunks=${r.cnt} | ${r.fn}`);
      }
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
