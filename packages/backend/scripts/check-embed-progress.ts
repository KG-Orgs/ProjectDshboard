import { config } from "dotenv";
import { sql } from "drizzle-orm";
config({ path: "../../.env" });

import { initializeDb, getDbIfInitialized, fileChunks, fileRecords } from "../src/db/index.js";

async function main() {
  await initializeDb(process.env.DATABASE_URL!);
  const db = getDbIfInitialized()!;

  const [chunks] = await db.select({
    withEmbed: sql<number>`count(*) filter (where embedding_vector is not null)`,
    withoutEmbed: sql<number>`count(*) filter (where embedding_vector is null)`,
  }).from(fileChunks);

  const [files] = await db.select({
    indexed: sql<number>`count(*) filter (where chunk_count > 0)`,
    zeroChunk: sql<number>`count(*) filter (where chunk_count = 0)`,
    total: sql<number>`count(*)`,
  }).from(fileRecords);

  console.log("=== Chunk embedding status ===");
  console.log(`  with embeddings : ${chunks.withEmbed}`);
  console.log(`  missing embed   : ${chunks.withoutEmbed}`);
  console.log("");
  console.log("=== File record status ===");
  console.log(`  indexed (chunks>0) : ${files.indexed}`);
  console.log(`  zero-chunk         : ${files.zeroChunk}`);
  console.log(`  total              : ${files.total}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
