/**
 * Quick test of embedding endpoint connectivity.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { getEnv, resetEnvCache } from "../src/config/env.js";

resetEnvCache();
const env = getEnv();

console.log("Embedding endpoint:", env.openAiEmbeddingEndpoint);
console.log("Embedding model:", env.openAiEmbeddingModel);
console.log("API key present:", !!env.openAiApiKey, "len:", env.openAiApiKey?.length ?? 0);
console.log("API key prefix:", env.openAiApiKey?.slice(0, 8) ?? "(none)");

async function testEmbedding() {
  const response = await fetch(env.openAiEmbeddingEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openAiEmbeddingModel,
      input: ["test embedding"],
      dimensions: env.openAiEmbeddingDimensions,
    }),
    signal: AbortSignal.timeout(15000),
  });

  console.log("Response status:", response.status, response.statusText);
  if (!response.ok) {
    const body = await response.text();
    console.log("Error body:", body);
  } else {
    const data = await response.json() as { data?: Array<{ embedding?: number[] }> };
    const vec = data.data?.[0]?.embedding ?? [];
    console.log("Embedding success! Dimensions:", vec.length);
  }
}

testEmbedding()
  .then(() => process.exit(0))
  .catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
