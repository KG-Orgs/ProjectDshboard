import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb } from "../src/db/index.js";
import { getEnv } from "../src/config/env.js";
import { sql } from "drizzle-orm";

async function main() {
  const env = getEnv();
  if (!env.databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const db = await initializeDb(env.databaseUrl);
  await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS onedrive_drive_id text`);
  console.log("Migration applied: onedrive_drive_id column added to projects");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
