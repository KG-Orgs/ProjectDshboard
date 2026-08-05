import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();
const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);
  // Look up the NOR-010R00 CCTV file to see the actual filePath format
  const rows = await db
    .select({ id: fileRecords.id, fp: fileRecords.filePath, fn: fileRecords.fileName, cnt: fileRecords.chunkCount })
    .from(fileRecords)
    .where(and(
      eq(fileRecords.projectId, PROJECT_ID),
      sql`${fileRecords.fileName} ILIKE '%NOR-010R00%CCTV%'`
    ));
  rows.forEach(r => console.log("cnt="+r.cnt, "fp="+r.fp.slice(0, 120)));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
