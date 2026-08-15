import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb, getDbIfInitialized } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { getEnv } from "../src/config/env.js";

async function main() {
  const env = getEnv();
  await initializeDb(env.databaseUrl!);
  const db = getDbIfInitialized()!;

  // Simple FTS plan with seqscan forced off
  const q = `EXPLAIN (FORMAT TEXT) SELECT id FROM file_chunks WHERE to_tsvector('english', COALESCE(chunk_text,'')) @@ websearch_to_tsquery('english','island pavement cutting') LIMIT 10`;

  console.log("=== Without hint ===");
  const r1 = await db.execute<{ "QUERY PLAN": string }>(sql.raw(q));
  for (const row of r1 as unknown as Array<{ "QUERY PLAN": string }>) console.log(row["QUERY PLAN"]);

  console.log("\n=== With enable_seqscan=off ===");
  const r2 = await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET LOCAL enable_seqscan = off`));
    return tx.execute<{ "QUERY PLAN": string }>(sql.raw(q));
  });
  for (const row of r2 as unknown as Array<{ "QUERY PLAN": string }>) console.log(row["QUERY PLAN"]);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
