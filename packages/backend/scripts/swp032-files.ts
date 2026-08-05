import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, eq } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);
  const pat = "%SWP-032%";
  const rows = await db
    .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, "145b3dcf-272e-4c45-9e19-953f20f25bb9"), sql`${fileRecords.fileName} ILIKE ${pat}`));
  rows.forEach(r => console.log(r.cnt > 0 ? "✅" : "❌", r.id.slice(0,8), "c="+r.cnt, r.fn.slice(0,80)));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
