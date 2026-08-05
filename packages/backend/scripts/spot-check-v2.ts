/**
 * Quick spot-check: verify that a file recently processed by v2 reindex
 * has actual chunks in the DB.
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { sql, eq, and, ilike } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";
resetEnvCache();

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl);

  // Check a file processed early in the v2 run
  const testFiles = [
    "General Site Cleanup.docx",
    "A37806 SWP-019 -Track Work- Rev0.docx",
    "SWP-026 -Excavation Rev.0  6.9.25.docx",
  ];

  for (const fileName of testFiles) {
    const recs = await db.select({ id: fileRecords.id, chunkCount: fileRecords.chunkCount, updatedAt: fileRecords.updatedAt })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, PROJECT_ID), ilike(fileRecords.fileName, `%${fileName}%`)));
    
    for (const r of recs) {
      const [c] = await db.execute<{ total: number }>(sql`SELECT count(*)::int AS total FROM file_chunks WHERE file_id = ${r.id}::uuid`);
      const upd = r.updatedAt ? new Date(r.updatedAt as unknown as string).toISOString().slice(0,19) : "null";
      const ok = (c?.total ?? 0) > 0 ? "✅" : "❌";
      console.log(`${ok} ${fileName}: actual=${c?.total}  col=${r.chunkCount}  updated=${upd}`);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
