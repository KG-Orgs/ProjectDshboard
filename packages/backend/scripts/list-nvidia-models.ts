/**
 * List available embedding models on Nvidia NIM API.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { getEnv, resetEnvCache } from "../src/config/env.js";

resetEnvCache();
const env = getEnv();
const key = env.openAiApiKey!;

async function listModels(baseUrl: string) {
  console.log(`\n=== ${baseUrl} ===`);
  try {
    const resp = await fetch(`${baseUrl}/models`, {
      headers: { "Authorization": `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (resp.ok) {
      const data = await resp.json() as { data?: Array<{ id: string }> };
      const embeddingModels = (data.data ?? []).filter(m => 
        m.id.includes("embed") || m.id.includes("nv-") || m.id.includes("bge") || m.id.includes("e5")
      );
      console.log(`Found ${data.data?.length ?? 0} models, ${embeddingModels.length} potentially embedding:`);
      embeddingModels.forEach(m => console.log(`  - ${m.id}`));
    } else {
      const body = await resp.text();
      console.log(`Status: ${resp.status} body: ${body.slice(0, 200)}`);
    }
  } catch (e) {
    console.log(`Error: ${(e as Error).message}`);
  }
}

async function main() {
  await listModels("https://integrate.api.nvidia.com/v1");
  await listModels("https://api.nvidia.com/v1");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
