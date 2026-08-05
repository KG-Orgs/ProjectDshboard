/**
 * Test multiple embedding endpoints to find one that works with the nvapi key.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { getEnv, resetEnvCache } from "../src/config/env.js";

resetEnvCache();
const env = getEnv();
const key = env.openAiApiKey!;
const model = env.openAiEmbeddingModel;
const dims = env.openAiEmbeddingDimensions;

const endpoints = [
  "https://integrate.api.nvidia.com/v1/embeddings",
  "https://api.nvidia.com/v1/embeddings",
  "https://openrouter.ai/api/v1/embeddings",
];

async function testEndpoint(url: string) {
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model, input: ["test"], dimensions: dims }),
      signal: AbortSignal.timeout(10000),
    });
    const body = await resp.text();
    if (resp.ok) {
      const data = JSON.parse(body) as { data?: Array<{ embedding?: number[] }> };
      const dims2 = data.data?.[0]?.embedding?.length ?? 0;
      console.log(`✅ ${url} → status=${resp.status} dims=${dims2}`);
    } else {
      console.log(`❌ ${url} → status=${resp.status} body=${body.slice(0, 100)}`);
    }
  } catch (e) {
    console.log(`❌ ${url} → ERROR: ${(e as Error).message}`);
  }
}

async function main() {
  for (const ep of endpoints) {
    await testEndpoint(ep);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
