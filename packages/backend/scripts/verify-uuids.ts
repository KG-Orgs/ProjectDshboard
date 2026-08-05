import { config } from "dotenv";
config({ path: "../../.env" });
import { eq } from "drizzle-orm";
import { initializeDb } from "../src/db/index.js";
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { fileRecords } from "../src/db/schema.js";

resetEnvCache();

async function main() {
  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  // Check specific UUIDs used in the batch input
  const ids = [
    "07ab6118-aeae-4c02-b69a-c3ba207df9e4", // sq69/70 - should be ADA P6 RFI096
    "7b0f086a-0507-4097-b50d-cfa1f6525e45", // sq22/23 - BUR-001R00 staircase
    "eb5a80ab-b89c-48e5-bde3-9f5db46f891a", // sq33 - Invoice#01
  ];
  for (const id of ids) {
    const [row] = await db.select({ fn: fileRecords.fileName, cnt: fileRecords.chunkCount }).from(fileRecords).where(eq(fileRecords.id, id));
    if (row) {
      console.log(`✅ ${id} → chunks=${row.cnt} | ${row.fn}`);
    } else {
      console.log(`❌ ${id} NOT FOUND`);
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
