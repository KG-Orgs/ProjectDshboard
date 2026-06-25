import { getEnv } from "../config/env";
import { logger } from "../lib/logger";
import { tokenizeQuery, keywordHitScore } from "./text-ranking.utils";

export interface RerankCandidate {
  chunkId: string;
  chunkText: string;
  relevance: number;
}

// Keep the LLM rerank call well inside the overall latency budget; on timeout
// or any failure we fall back to the cheap heuristic reorder.
const LLM_RERANK_TIMEOUT_MS = 4_000;
// Chars of each candidate passage shown to the model. Enough to judge relevance
// without blowing up the prompt for ~20 candidates.
const LLM_RERANK_SNIPPET_CHARS = 480;

export interface RerankResult<T> {
  candidates: T[];
  applied: boolean;
  durationMs: number;
  costEstimateTokens: number;
  provider: string;
}

function estimateTokenCost(query: string, candidates: Array<{ chunkText: string }>): number {
  const queryTokens = query.split(/\s+/).filter(Boolean).length;
  const candidateTokens = candidates.reduce((sum, candidate) => {
    return sum + candidate.chunkText.split(/\s+/).filter(Boolean).length;
  }, 0);
  return queryTokens + candidateTokens;
}

function heuristicRerank<T extends RerankCandidate>(query: string, candidates: T[], topN: number): T[] {
  const tokens = tokenizeQuery(query, 3, 12);
  const head = candidates
    .slice(0, topN)
    .map((candidate) => {
      const lexicalScore = tokens.length > 0 ? keywordHitScore(tokens, candidate.chunkText) / tokens.length : 0;
      const rerankScore = candidate.relevance * 0.65 + lexicalScore * 0.35;
      return {
        candidate,
        rerankScore,
      };
    })
    .sort((left, right) => right.rerankScore - left.rerankScore)
    .map((item) => item.candidate);

  const headIds = new Set(head.map((candidate) => candidate.chunkId));
  const tail = candidates
    .slice(topN)
    .filter((candidate) => !headIds.has(candidate.chunkId));

  return head.concat(tail);
}

/**
 * Parse a JSON array of candidate indices from a model completion, tolerating
 * surrounding prose/markdown. Returns the de-duplicated, in-range indices.
 */
function parseOrderIndices(completion: string, count: number): number[] {
  const match = completion.match(/\[[\s\d,]*\]/);
  if (!match) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<number>();
  const order: number[] = [];
  for (const value of parsed) {
    const index = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (Number.isInteger(index) && index >= 0 && index < count && !seen.has(index)) {
      seen.add(index);
      order.push(index);
    }
  }
  return order;
}

/**
 * Rerank the top-N candidates with the configured chat LLM. Self-contained
 * (mirrors chat-coordinator's primary provider config) to avoid a circular
 * import. Returns null on missing key, timeout, or any parse/transport failure
 * so the caller can fall back to the heuristic reorder.
 */
async function llmRerankHead<T extends RerankCandidate>(
  query: string,
  head: T[]
): Promise<T[] | null> {
  const env = getEnv();
  const apiKey = env.geminiApiKey ?? env.openAiApiKey;
  if (!apiKey || head.length <= 1) return null;

  const endpoint =
    env.geminiChatEndpoint ?? env.openAiChatEndpoint ?? "https://api.openai.com/v1/chat/completions";
  const model = env.geminiChatModel ?? env.openAiChatModel ?? "gemini-2.5-flash";

  const list = head
    .map((candidate, index) => {
      const snippet = candidate.chunkText
        .slice(0, LLM_RERANK_SNIPPET_CHARS)
        .replace(/\s+/g, " ")
        .trim();
      return `[${index}] ${snippet}`;
    })
    .join("\n\n");

  const system =
    "You are a search-result reranker. Given a user query and numbered candidate passages, " +
    "order the passages from most to least relevant to the query. " +
    "Respond with ONLY a JSON array of the passage indices in that order (e.g. [3,0,1,2]). " +
    "Include every index exactly once and output nothing else.";
  const user = `Query: ${query}\n\nCandidates:\n${list}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_RERANK_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 256,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!response.ok) {
      logger.warn("retrieval.rerank.llm_http_error", { status: response.status });
      return null;
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const completion = payload.choices?.[0]?.message?.content?.trim();
    if (!completion) return null;

    const order = parseOrderIndices(completion, head.length);
    if (order.length === 0) return null;

    // Reorder by the model's ranking, then append any indices it omitted so no
    // candidate is silently dropped.
    const ordered = order.map((index) => head[index]);
    const placed = new Set(order);
    for (let index = 0; index < head.length; index += 1) {
      if (!placed.has(index)) ordered.push(head[index]);
    }
    return ordered;
  } catch (error) {
    logger.warn("retrieval.rerank.llm_error", {
      reason:
        error instanceof Error && error.name === "AbortError"
          ? `llm_rerank_timeout_${LLM_RERANK_TIMEOUT_MS}ms`
          : error instanceof Error
            ? error.message
            : "unknown_error",
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export const retrievalRerankerService = {
  async rerank<T extends RerankCandidate>(input: {
    query: string;
    candidates: T[];
    topN: number;
    provider: string;
  }): Promise<RerankResult<T>> {
    const startedAt = Date.now();
    const limitedTopN = Math.max(1, Math.min(input.topN, input.candidates.length));
    const costEstimateTokens = estimateTokenCost(input.query, input.candidates.slice(0, limitedTopN));

    if (input.provider === "none") {
      return {
        candidates: input.candidates,
        applied: false,
        durationMs: Date.now() - startedAt,
        costEstimateTokens,
        provider: input.provider,
      };
    }

    if (input.provider === "heuristic") {
      return {
        candidates: heuristicRerank(input.query, input.candidates, limitedTopN),
        applied: true,
        durationMs: Date.now() - startedAt,
        costEstimateTokens,
        provider: input.provider,
      };
    }

    if (input.provider === "llm") {
      const head = input.candidates.slice(0, limitedTopN);
      const tail = input.candidates.slice(limitedTopN);
      const reorderedHead = await llmRerankHead(input.query, head);
      if (reorderedHead) {
        return {
          candidates: reorderedHead.concat(tail),
          applied: true,
          durationMs: Date.now() - startedAt,
          costEstimateTokens,
          provider: input.provider,
        };
      }
      // LLM unavailable/failed: degrade to the cheap heuristic reorder.
      return {
        candidates: heuristicRerank(input.query, input.candidates, limitedTopN),
        applied: true,
        durationMs: Date.now() - startedAt,
        costEstimateTokens,
        provider: "heuristic_fallback",
      };
    }

    throw new Error(`unsupported_rerank_provider:${input.provider}`);
  },
};
