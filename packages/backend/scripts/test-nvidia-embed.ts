/**
 * Test Nvidia NIM embedding with openai model name AND check DB vector dimensions.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { getEnv, resetEnvCache } from "../src/config/env.js";
import { initializeDb } from "../src/db/index.js";
import { fileChunks } from "../src/db/schema.js";
import { eq, isNotNull, sql } from "drizzle-orm";

resetEnvCache();
const env = getEnv();
const key = env.openAiApiKey!;

async function main() {
  // Test Nvidia NIM with openai model
  console.log("Testing integrate.api.nvidia.com with openai/text-embedding-3-small...");
  try {
    const resp = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: ["test"], dimensions: 1024 }),
      signal: AbortSignal.timeout(10000),
    });
    const body = await resp.text();
    console.log(`Status: ${resp.status} body: ${body.slice(0, 200)}`);
  } catch (e) {
    console.log(`Error: ${(e as Error).message}`);
  }

  // Test nvidia/nv-embedqa-e5-v5
  console.log("\nTesting integrate.api.nvidia.com with nvidia/nv-embedqa-e5-v5...");
  try {
    const resp = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: "nvidia/nv-embedqa-e5-v5", input: ["test"], input_type: "query" }),
      signal: AbortSignal.timeout(10000),
    });
    if (resp.ok) {
      const data = await resp.json() as { data?: Array<{ embedding?: number[] }> };
      console.log(`✅ SUCCESS dims=${data.data?.[0]?.embedding?.length}`);
    } else {
      const body = await resp.text();
      console.log(`❌ Status: ${resp.status} body: ${body.slice(0, 200)}`);
    }
  } catch (e) {
    console.log(`Error: ${(e as Error).message}`);
  }

  // Check DB vector dimensions
  console.log("\nChecking DB vector dimensions...");
  const db = await initializeDb(env.databaseUrl!);
  const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9";
  const sample = await db
    .select({ dims: sql<number>`array_length(embedding_vector, 1)` })
    .from(fileChunks)
    .where(sql`${fileChunks.projectId} = ${PROJECT_ID} AND embedding_vector IS NOT NULL`)
    .limit(1);
  console.log("Sample chunk vector dims:", sample[0]?.dims ?? "none found");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
