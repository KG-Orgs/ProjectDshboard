import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";
import { eq, and, sql } from "drizzle-orm";
resetEnvCache();

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";
const targets = [
  "%GEN-029R00%Monthly%07.24%",
  "%GEN-143R00%Monthly%05.28%",
  "%Transmittal%0014%",
  "%Lockton%0849812%",
  "%Backup%Invoice%",
  "%Invoice%01%12-31%",
  "%212%NOR%",
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);
  for (const pat of targets) {
    const rows = await db
      .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));
    for (const r of rows) {
      console.log(`${r.id} | chunks=${r.cnt} | ${r.fn}`);
    }
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
