/**
 * Find the actual document IDs for sq07/08, sq83, sq92/93, sq97.
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
  // sq07/08: actual GEN-027 Subcontractor Approval
  { sq: "sq07/08-genform", pat: "%GEN-027%Subcontract%" },
  { sq: "sq07/08-genform2", pat: "%GEN-027%Crossroads%" },
  { sq: "sq07/08-subapproval", pat: "%Sub%Contract%Approval%" },
  { sq: "sq07/08-jv", pat: "%Joint%Venture%" },
  // sq23: Staircase Enclosure  
  { sq: "sq23-staircase", pat: "%BUR-001%Staircase%" },
  { sq: "sq23-enclosure", pat: "%BUR-001%Enclosure%" },
  // sq83: Safety Coordinator / Diego Gonzalez
  { sq: "sq83-safety-coord", pat: "%Safety%Coordinator%" },
  { sq: "sq83-diego", pat: "%Diego%Gonzalez%" },
  { sq: "sq83-gen021", pat: "%GEN-021%Safety%" },
  // sq92/93: CCTV
  { sq: "sq92-cctv", pat: "%NOR-010%CCTV%" },
  { sq: "sq92-norwood-cctv", pat: "%CCTV%Norwood%" },
  // sq97: Quality Certification Report
  { sq: "sq97-monthly-quality", pat: "%Monthly%Quality%Certif%" },
  { sq: "sq97-gen014-quality", pat: "%GEN-014%Monthly%" },
  { sq: "sq97-gen014-quality2", pat: "%GEN-014%Quality%" },
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  const seen = new Set<string>();
  for (const { sq, pat } of TARGETS) {
    if (seen.has(pat)) continue;
    seen.add(pat);
    const rows = await db
      .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));
    const withChunks = rows.filter(r => r.cnt > 0);
    if (withChunks.length > 0) {
      for (const r of withChunks.slice(0, 3)) {
        console.log(`[${sq}] ✅ ${r.id} | chunks=${r.cnt} | ${r.fn.slice(0, 80)}`);
      }
    } else if (rows.length > 0) {
      for (const r of rows.slice(0, 2)) {
        console.log(`[${sq}] ❌ 0 chunks | ${r.fn.slice(0, 80)}`);
      }
    } else {
      console.log(`[${sq}] NOT IN DB: ${pat}`);
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
