import { config } from "dotenv";
import { sql } from "drizzle-orm";
config({ path: "../../.env" });

import { initializeDb, getDbIfInitialized } from "../src/db/index.js";

async function main() {
  await initializeDb(process.env.DATABASE_URL!);
  const db = getDbIfInitialized()!;

  const rows = await db.execute<{ project_id: string; project_name: string; chunk_count: string }>(sql`
    SELECT fc.project_id, p.name as project_name, count(*) as chunk_count
    FROM file_chunks fc
    JOIN projects p ON p.id = fc.project_id
    WHERE fc.embedding_vector IS NOT NULL
    GROUP BY fc.project_id, p.name
    ORDER BY chunk_count DESC
    LIMIT 20
  `);

  console.log("=== Chunk counts by project ===");
  for (const row of rows as unknown as Array<{ project_id: string; project_name: string; chunk_count: string }>) {
    console.log(`  ${row.project_id}  ${row.chunk_count.toString().padStart(8)}  ${row.project_name}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
