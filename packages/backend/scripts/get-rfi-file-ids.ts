/**
 * Get file IDs for RFI files needed for batch input activeDocFileId.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq, gt } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

const PATTERNS = [
  // RFI sq66: Louver Exhaust Face Velocity
  { sq: "sq66", pat: "%RFI-0115%Louver%" },
  { sq: "sq66", pat: "%RFI-0115%CLO%" },
  // RFI sq69/sq70: AECOM-RFI065 electrical panel WRHP - show ALL RFI-0096
  { sq: "sq69/70", pat: "%RFI-0096%" },
  // RFI sq73: Myrtle Ave PS LAN - show ALL RFI-0116
  { sq: "sq73", pat: "%RFI-0116%" },
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  const seen = new Set<string>();
  for (const { sq, pat } of PATTERNS) {
    if (seen.has(pat)) continue;
    seen.add(pat);
    const rows = await db
      .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`, gt(fileRecords.chunkCount, 0)));
    const shown = new Set<string>();
    for (const r of rows) {
      if (shown.has(r.id)) continue;
      shown.add(r.id);
      console.log(`[${sq}] ${r.id} | chunks=${r.cnt} | ${r.fn}`);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
