/**
 * Check DB state for remaining hard-to-fix questions.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

const TARGETS = [
  { sq: "sq33-invoice", pat: "%Invoice%01%12-31-2025%" },
  { sq: "sq33-invoice2", pat: "%Invoice%01%G703%" },
  { sq: "sq33-invoice3", pat: "%Invoice%01%December%" },
  { sq: "sq56-bur080", pat: "%BUR-080R00%" },
  { sq: "sq65-jtrack", pat: "%J-TRACK-13A-041%" },
  { sq: "sq65-jtrack2", pat: "%J-TRACK%13A%" },
  { sq: "sq69-rfi096", pat: "%RFI-0096%" },
  { sq: "sq69-rfi096b", pat: "%RFI096%" },
  { sq: "sq80-swp032", pat: "%SWP-032%" },
  { sq: "sq80-wilson", pat: "%Michael%Wilson%" },
  { sq: "sq80-trans%SWP", pat: "%Transmittal%SWP-032%" },
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
    if (rows.length === 0) { console.log(`[${sq}] NOT IN DB: ${pat}`); continue; }
    for (const r of rows.filter(r => r.cnt > 0).slice(0, 2)) {
      console.log(`[${sq}] ✅ ${r.id} | chunks=${r.cnt} | ${r.fn.slice(0, 80)}`);
    }
    for (const r of rows.filter(r => r.cnt === 0).slice(0, 1)) {
      console.log(`[${sq}] ❌ 0 chunks | ${r.ext} | ${r.fn.slice(0, 80)}`);
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
