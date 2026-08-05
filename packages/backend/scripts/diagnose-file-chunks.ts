/**
 * Diagnostic: check the chunk state for a specific file by name.
 * Usage: pnpm tier2:ask-batch -- ... (run via pnpm from packages/backend)
 * OR: add to package.json scripts and run as pnpm db:diagnose-file -- --file "M017_IMP..."
 *
 * Run (from packages/backend):
 *   pnpm tsx scripts/diagnose-file-chunks.ts -- --project 145b3dcf-272e-4c45-9e19-953f20f25bb9 --name "M017_IMP_Draft Subcontract_20251024.docx"
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { sql, eq, and, ilike } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords, fileChunks } from "../src/db/schema.js";
resetEnvCache();

function parseArgs(argv: string[]) {
  let projectId = "145b3dcf-272e-4c45-9e19-953f20f25bb9";
  let fileName = "M017_IMP_Draft Subcontract_20251024.docx";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project" && argv[i+1]) projectId = argv[++i]!;
    if (argv[i] === "--name" && argv[i+1]) fileName = argv[++i]!;
  }
  return { projectId, fileName };
}

async function main() {
  const { projectId, fileName } = parseArgs(process.argv.slice(2));
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl);

  // 1. file_records rows
  const records = await db
    .select({
      id: fileRecords.id,
      onedriveItemId: fileRecords.onedriveItemId,
      chunkCount: fileRecords.chunkCount,
      indexStatus: fileRecords.indexStatus,
      updatedAt: fileRecords.updatedAt,
    })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, projectId), ilike(fileRecords.fileName, `%${fileName}%`)));

  console.log(`\nfile_records for "%${fileName}%":`);
  for (const r of records) {
    console.log(`  id=${r.id}  onedriveItemId=${r.onedriveItemId}  chunk_count=${r.chunkCount}  status=${r.indexStatus}  updated=${r.updatedAt?.toISOString()}`);

    // 2. actual chunk counts
    const [counts] = await db.execute<{ total: number; with_embedding: number }>(sql`
      SELECT count(*)::int AS total,
             count(embedding_vector)::int AS with_embedding
      FROM file_chunks
      WHERE file_id = ${r.id}::uuid
    `);
    console.log(`    → actual chunks: total=${counts?.total ?? 0}  with_embedding=${counts?.with_embedding ?? 0}`);
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
