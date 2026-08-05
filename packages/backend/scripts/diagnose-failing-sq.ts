/**
 * Diagnose chunk status for RFI/transmittal files mentioned in failing questions.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { sql, and, ilike, or, eq } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";
resetEnvCache();

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";
const FILES = [
  // RFIs
  { id: "sq66",  pat: "RFI-0115%Louver%Exhaust" },
  { id: "sq69",  pat: "RFI%0096%AECOM%RFI065" },
  { id: "sq70",  pat: "RFI%0096%" },
  { id: "sq73",  pat: "RFI%0116%" },
  // Transmittals
  { id: "sq11",  pat: "%Transmittal%0014%" },
  { id: "sq80",  pat: "%SWP%032%" },
  { id: "sq91",  pat: "%212%NOR%" },
  // Monthly meetings
  { id: "sq38",  pat: "%GEN-029%" },
  { id: "sq39",  pat: "%GEN-029%" },
  { id: "sq40",  pat: "%GEN-143%" },
  { id: "sq41",  pat: "%GEN-143%" },
  // Invoices
  { id: "sq28",  pat: "%0849812%" },
  { id: "sq29",  pat: "%0849812%" },
  { id: "sq30",  pat: "%Backup%Invoice%" },
  { id: "sq33",  pat: "%Invoice%01%12-31%" },
];

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  const seen = new Set<string>();
  for (const { id, pat } of FILES) {
    if (seen.has(pat)) continue;
    seen.add(pat);
    const recs = await db.select({
      id: fileRecords.id,
      fileName: fileRecords.fileName,
      chunkCount: fileRecords.chunkCount,
      updatedAt: fileRecords.updatedAt,
    })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, PROJECT_ID), sql`${fileRecords.fileName} ILIKE ${pat}`));

    const tag = `[${id}] ${pat}`;
    if (recs.length === 0) {
      console.log(`${tag} → NOT IN DB`);
    } else {
      for (const r of recs) {
        const [c] = await db.execute<{ total: number }>(sql`SELECT count(*)::int AS total FROM file_chunks WHERE file_id = ${r.id}::uuid`);
        const upd = r.updatedAt ? new Date(r.updatedAt as unknown as string).toISOString().slice(0,19) : "?";
        const chk = (c as any)?.total ?? 0;
        const ext = r.fileName.split('.').pop() ?? '';
        console.log(`${tag} → ${chk} chunks | ${ext} | ${r.fileName}`);
      }
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
