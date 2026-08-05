/**
 * Diagnose OCR'd correspondence file records.
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { sql, and, ilike, eq } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";
resetEnvCache();

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";
const FILES = [
  "L-0024",
  "L-0017",
  "L-0028",
  "L-0049",
  "L-0083",
  "L-0093",
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  for (const id of FILES) {
    const recs = await db.select({
      id: fileRecords.id,
      fileName: fileRecords.fileName,
      onedriveItemId: fileRecords.onedriveItemId,
      chunkCount: fileRecords.chunkCount,
      updatedAt: fileRecords.updatedAt,
    })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, PROJECT_ID), ilike(fileRecords.fileName, `%${id}%`)));

    console.log(`\n=== ${id} ===`);
    for (const r of recs) {
      const [c] = await db.execute<{ total: number; sample: string }>(sql`
        SELECT count(*)::int AS total,
               left(string_agg(chunk_text, ' '), 200) AS sample
        FROM file_chunks WHERE file_id = ${r.id}::uuid
      `);
      const upd = r.updatedAt ? new Date(r.updatedAt as unknown as string).toISOString().slice(0,19) : "?";
      console.log(`  ${r.chunkCount} col / ${(c as any)?.total} actual | updated=${upd}`);
      console.log(`  file: ${r.fileName}`);
      console.log(`  path: ${(r.onedriveItemId ?? "").slice(0, 90)}`);
      if ((c as any)?.total > 0) {
        console.log(`  sample: ${(c as any)?.sample?.slice(0,150)}`);
      }
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
