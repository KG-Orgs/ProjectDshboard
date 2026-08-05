/**
 * Find the August 2025 SWP-032 approval transmittal for sq80.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq, like } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

const TARGETS = [
  "%SWP-032%transmittal%",
  "%transmittal%SWP%032%",
  "%08 20 2025%SWP%",
  "%August%SWP-032%",
  "%SWP-032%approval%",
  "%GEN-032%SWP%",
  "%SWP-032%cover%",
  "%SWP-032%spec%01 35%",
  "%GEN-093%",  // might be the SWP-032 submittal
  "%GEN-094%",
  "%GEN-095%",
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  for (const pat of TARGETS) {
    const rows = await db
      .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));
    if (rows.length > 0) {
      for (const r of rows.slice(0, 2)) {
        const mark = r.cnt > 0 ? "✅" : "❌";
        console.log(`${mark} ${r.id} | chunks=${r.cnt} | ${r.fn.slice(0, 80)} [pattern: ${pat}]`);
      }
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
