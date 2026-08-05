/**
 * Diagnose chunk status for the remaining v3 failing questions.
 * Groups: PPTX (sq36/37/60/61), shop drawings (sq18/22/65/71/72), 
 * submittals/products (sq49/75/85/86/99/101/102), other (sq06/62/80)
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq, gt } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

const QUERIES = [
  // PPTX presentations
  { id: "sq36/37", pat: "%Kick%Off%Pre-Work%" },
  { id: "sq60/61", pat: "%VECP%Burnside%" },
  { id: "sq60/61b", pat: "%Burnside%VECP%" },
  // Shop drawings / submittals
  { id: "sq18", pat: "%AVI-002%" },
  { id: "sq22", pat: "%BUR-001%" },
  { id: "sq49", pat: "%MDT-005%" },
  { id: "sq65", pat: "%J-TRACK-13A-041%" },
  { id: "sq71", pat: "%MYR-002%" },
  { id: "sq72", pat: "%MYR-A-444A%" },
  // Other submittals/products
  { id: "sq75", pat: "%GEN-096%" },
  { id: "sq85/86", pat: "%Schedule%Update%5%" },
  { id: "sq85/86b", pat: "%Schedule%Update%June%" },
  { id: "sq99/102", pat: "%PRDC12-019%" },
  { id: "sq99/102b", pat: "%SikaGrout%212%" },
  { id: "sq101", pat: "%PRDC12-012%" },
  { id: "sq101b", pat: "%Lead%Placard%" },
  // Other
  { id: "sq06", pat: "%RFP%Addendum%02%" },
  { id: "sq06b", pat: "%Pre-Proposal%Slideshow%" },
  { id: "sq62", pat: "%PRO%26-01%" },
  { id: "sq62b", pat: "%NCR%Template%" },
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  const seen = new Set<string>();
  for (const { id, pat } of QUERIES) {
    if (seen.has(pat)) continue;
    seen.add(pat);
    const recs = await db
      .select({ fn: fileRecords.fileName, cnt: fileRecords.chunkCount, ext: fileRecords.fileType })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));
    if (recs.length === 0) {
      console.log(`[${id}] ${pat} → NOT IN DB`);
    } else {
      for (const r of recs.slice(0, 2)) {
        console.log(`[${id}] ${pat} → ${r.cnt} chunks | ${r.ext} | ${r.fn.slice(0, 70)}`);
      }
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
