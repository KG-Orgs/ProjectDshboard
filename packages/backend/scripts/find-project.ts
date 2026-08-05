import { config } from "dotenv";
config({ path: "../../.env" });
import { initializeDb } from "../src/db/index.js";
import { projects } from "../src/db/schema.js";
import { ilike } from "drizzle-orm";

async function main() {
  const db = await initializeDb();
  const rows = await db.select({ id: projects.id, name: projects.name }).from(projects).where(ilike(projects.name, "%MLJ-017%"));
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
