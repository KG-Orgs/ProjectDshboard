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
  const pats = ["%PRDC12-012%", "%Lead%Placard%Burnside%", "%Lead%Abatement%Burnside%"];
  for (const pat of pats) {
    const rows = await db
      .select({ id: fileRecords.id, fn: fileRecords.fileName, cnt: fileRecords.chunkCount, ext: fileRecords.fileType })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));
    for (const r of rows.slice(0, 4)) {
      console.log(r.cnt > 0 ? "✅" : "❌", r.id, "c="+r.cnt, r.ext, r.fn.slice(0, 80));
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
