import { config } from 'dotenv';
config({ path: '../../.env' });
import { sql, and, ilike, eq } from 'drizzle-orm';
import { initializeDb } from './src/db/index.js';
import { getEnv, resetEnvCache } from './src/config/env.js';
import { fileRecords } from './src/db/schema.js';
resetEnvCache();
const env = getEnv();
const db = await initializeDb(env.databaseUrl);
const recs = await db.select({ id: fileRecords.id, chunkCount: fileRecords.chunkCount, updatedAt: fileRecords.updatedAt }).from(fileRecords).where(and(eq(fileRecords.projectId, '145b3dcf-272e-4c45-9e19-953f20f25bb9'), ilike(fileRecords.fileName, '%SWP-026%')));
for (const r of recs) {
  const [c] = await db.execute(sql`SELECT count(*)::int AS total FROM file_chunks WHERE file_id = ${r.id}::uuid`);
  const upd = r.updatedAt ? new Date(r.updatedAt as unknown as string).toISOString().slice(0,19) : 'null';
  console.log(`chunks in DB: ${(c as any)?.total}  chunkCount col: ${r.chunkCount}  updated: ${upd}`);
}
process.exit(0);
