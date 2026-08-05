/**
 * Query DB for RFI file records to understand current indexing state.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";
import { eq, and, sql, gt, lt } from "drizzle-orm";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl);

  // 1. Count all RFI file records (by onedriveItemId path or fileName)
  const all = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(fileRecords)
    .where(
      and(
        eq(fileRecords.projectId, PROJECT_ID),
        sql`${fileRecords.onedriveItemId} ILIKE '%RFI%'`
      )
    );
  console.log("All RFI records in DB:", all[0].cnt);

  // 2. How many have chunks?
  const withChunks = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(fileRecords)
    .where(
      and(
        eq(fileRecords.projectId, PROJECT_ID),
        sql`${fileRecords.onedriveItemId} ILIKE '%RFI%'`,
        gt(fileRecords.chunkCount, 0)
      )
    );
  console.log("RFI records WITH chunks:", withChunks[0].cnt);

  // 3. How many have 0 chunks?
  const zeroChunks = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(fileRecords)
    .where(
      and(
        eq(fileRecords.projectId, PROJECT_ID),
        sql`${fileRecords.onedriveItemId} ILIKE '%RFI%'`,
        sql`${fileRecords.chunkCount} = 0`
      )
    );
  console.log("RFI records WITH 0 chunks:", zeroChunks[0].cnt);

  // 4. Specific files
  const patterns = ["%RFI-0115%", "%RFI-0096%", "%RFI-0116%"];
  for (const pat of patterns) {
    const rows = await db
      .select({ fn: fileRecords.fileName, cnt: fileRecords.chunkCount, path: fileRecords.onedriveItemId })
      .from(fileRecords)
      .where(
        and(
          eq(fileRecords.projectId, PROJECT_ID),
          sql`${fileRecords.fileName} ILIKE ${pat}`
        )
      );
    console.log(`\n${pat}: ${rows.length} rows`);
    for (const r of rows.slice(0, 3)) {
      console.log(`  ${r.cnt} chunks | ${r.fn.slice(0, 70)}`);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
