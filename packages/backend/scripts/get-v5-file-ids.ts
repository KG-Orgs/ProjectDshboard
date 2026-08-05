/**
 * Get specific file IDs for v5 batch input additions.
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
  // VECP Presentation - specifically May 13 2025
  { sq: "sq60/61", pat: "%05-13%VECP%" },
  { sq: "sq60/61b", pat: "%2025-05%VECP%" },
  { sq: "sq60/61c", pat: "%May%VECP%" },
  // AVI-002 R02 Foundation Rebar
  { sq: "sq18", pat: "%AVI-002R02%" },
  { sq: "sq18b", pat: "%AVI-002R01%" },
  // J-TRACK-13A-041 DOCX cert (has 3 chunks)
  { sq: "sq65", pat: "%J-TRACK-13A-041%" },
  // PRO 26-01 NCR process doc
  { sq: "sq62-pro", pat: "%PRO%26-01%Control%" },
  { sq: "sq62-pro2", pat: "%26-01%Nonconforming%" },
  { sq: "sq62-pro3", pat: "%PRO 26-01%" },
  // Schedule Update 5 June 2025  
  { sq: "sq85/86", pat: "%GEN-032%" },
  // SikaGrout 212 with chunks
  { sq: "sq99/102", pat: "%SikaGrout%" },
  // Lead Placard Burnside with chunks
  { sq: "sq101", pat: "%PRDC12-012%Lead%Placard%" },
  { sq: "sq101b", pat: "%Lead%Placard%Burnside%" },
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
