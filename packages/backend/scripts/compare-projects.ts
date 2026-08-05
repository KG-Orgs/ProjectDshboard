import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb } from "../src/db/index.js";
import { projects, fileRecords } from "../src/db/schema.js";
import { eq, count, and, sql, lte, isNull } from "drizzle-orm";
import { getEnv, resetEnvCache } from "../src/config/env.js";

const TARGET = "145b3dcf-272e-4c45-9e19-953f20f25bb9";

async function main() {
  resetEnvCache();
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl);

  // 1. By processingMode
  console.log("\n=== Zero-chunk files by processingMode ===");
  const byMode = await db
    .select({ mode: fileRecords.processingMode, cnt: count() })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, TARGET), lte(fileRecords.chunkCount, 0)))
    .groupBy(fileRecords.processingMode)
    .orderBy(sql`count(*) desc`);
  byMode.forEach((r) => console.log(`  ${r.mode ?? "null"}: ${r.cnt}`));

  // 2. By indexStatus
  console.log("\n=== Zero-chunk files by indexStatus ===");
  const byStatus = await db
    .select({ status: fileRecords.indexStatus, cnt: count() })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, TARGET), lte(fileRecords.chunkCount, 0)))
    .groupBy(fileRecords.indexStatus)
    .orderBy(sql`count(*) desc`);
  byStatus.forEach((r) => console.log(`  ${r.status ?? "null"}: ${r.cnt}`));

  // 3. By file extension
  console.log("\n=== Zero-chunk files by extension (top 20) ===");
  const byExt = await db
    .select({
      ext: sql<string>`lower(regexp_replace(file_name, '^.*\\.', ''))`,
      cnt: count(),
    })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, TARGET), lte(fileRecords.chunkCount, 0)))
    .groupBy(sql`lower(regexp_replace(file_name, '^.*\\.', ''))`)
    .orderBy(sql`count(*) desc`)
    .limit(20);
  byExt.forEach((r) => console.log(`  .${r.ext}: ${r.cnt}`));

  // 4. By processingReason for zero-chunk files
  console.log("\n=== Zero-chunk files by processingReason (top 15) ===");
  const byReason = await db
    .select({ reason: fileRecords.processingReason, cnt: count() })
    .from(fileRecords)
    .where(and(eq(fileRecords.projectId, TARGET), lte(fileRecords.chunkCount, 0)))
    .groupBy(fileRecords.processingReason)
    .orderBy(sql`count(*) desc`)
    .limit(15);
  byReason.forEach((r) => console.log(`  "${r.reason ?? "null"}": ${r.cnt}`));

  // 5. Sample zero-chunk PDFs with failed/indexed status
  console.log("\n=== Sample zero-chunk indexed PDFs (first 10) ===");
  const samplePdfs = await db
    .select({ fileName: fileRecords.fileName, status: fileRecords.indexStatus, reason: fileRecords.processingReason })
    .from(fileRecords)
    .where(
      and(
        eq(fileRecords.projectId, TARGET),
        lte(fileRecords.chunkCount, 0),
        eq(fileRecords.indexStatus, "indexed"),
        sql`lower(file_name) like '%.pdf'`
      )
    )
    .limit(10);
  samplePdfs.forEach((r) => console.log(`  [${r.status}] ${r.fileName} | reason: ${r.reason}`));
}

main().catch(console.error).finally(() => process.exit(0));
