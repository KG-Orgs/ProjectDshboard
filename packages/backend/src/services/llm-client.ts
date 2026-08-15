import { getEnv } from "../config/env";
import { logger } from "../lib/logger";

export type ChatLlmMessage = { role: "system" | "user" | "assistant"; content: string };

/** Default per-request timeout for LLM calls when a caller does not override it. */
export const DEFAULT_LLM_TIMEOUT_MS = 12_000;

/**
 * Provider-agnostic chat transport shared by the answer extractor and the
 * answer validator. Tries OpenRouter, then the primary OpenAI-compatible
 * endpoint (Gemini, then OpenAI/DeepSeek), then the Anthropic Messages API when
 * an `ANTHROPIC_API_KEY` is configured. Returns null when every configured
 * provider fails so callers can fall back to deterministic behaviour.
 */
export async function callChatLlm(
  messages: ChatLlmMessage[],
  options: { temperature: number; maxTokens: number; timeoutMs?: number }
): Promise<string | null> {
  const env = getEnv();
  const timeoutMs = options.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS;

  // OpenRouter — first priority when OPENROUTER_API_KEY is set.
  // OpenRouter is OpenAI-compatible; HTTP-Referer and X-Title headers are
  // recommended by OpenRouter for rate-limit and analytics attribution.
  if (env.openrouterApiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(env.openrouterChatEndpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.openrouterApiKey}`,
          "HTTP-Referer": "https://contractorai.app",
          "X-Title": "ContractorAI",
        },
        body: JSON.stringify({
          model: env.openrouterChatModel,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          messages,
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const completion = payload.choices?.[0]?.message?.content?.trim();
        if (completion) return completion;
      } else {
        const body = await response.text();
        logger.warn("llm_client.openrouter_llm_failed", { reason: body || response.statusText });
      }
    } catch (error) {
      logger.warn("llm_client.openrouter_llm_error", {
        reason:
          error instanceof Error && error.name === "AbortError"
            ? `openrouter_llm_timeout_${timeoutMs}ms`
            : error instanceof Error
              ? error.message
              : "unknown_error",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  const primaryApiKey = env.geminiApiKey ?? env.openAiApiKey;
  if (primaryApiKey) {
    const chatEndpoint =
      env.geminiChatEndpoint ??
      env.openAiChatEndpoint ??
      "https://api.openai.com/v1/chat/completions";
    const chatModel = env.geminiChatModel ?? env.openAiChatModel ?? "gemini-2.5-flash";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${primaryApiKey}`,
        },
        body: JSON.stringify({
          model: chatModel,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          messages,
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const completion = payload.choices?.[0]?.message?.content?.trim();
        if (completion) return completion;
      } else {
        const body = await response.text();
        logger.warn("llm_client.primary_llm_failed", { reason: body || response.statusText });
      }
    } catch (error) {
      logger.warn("llm_client.primary_llm_error", {
        reason:
          error instanceof Error && error.name === "AbortError"
            ? `primary_llm_timeout_${timeoutMs}ms`
            : error instanceof Error
              ? error.message
              : "unknown_error",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  if (env.anthropicApiKey) {
    const systemPrompt = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const conversation = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(env.anthropicChatEndpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.anthropicChatModel,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: conversation,
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          content?: Array<{ type?: string; text?: string }>;
        };
        const completion = (payload.content ?? [])
          .filter((block) => block.type === "text" && typeof block.text === "string")
          .map((block) => block.text as string)
          .join("")
          .trim();
        if (completion) return completion;
      } else {
        const body = await response.text();
        logger.warn("llm_client.anthropic_llm_failed", { reason: body || response.statusText });
      }
    } catch (error) {
      logger.warn("llm_client.anthropic_llm_error", {
        reason:
          error instanceof Error && error.name === "AbortError"
            ? `anthropic_llm_timeout_${timeoutMs}ms`
            : error instanceof Error
              ? error.message
              : "unknown_error",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

/** One rendered page image handed to a vision model. */
export interface VisionImage {
  /** Raw image bytes, base64-encoded (no data-URL prefix). */
  base64: string;
  mediaType: "image/png" | "image/jpeg";
}

/**
 * Vision transport: the same provider ladder as `callChatLlm`, but the user turn
 * carries rendered page images alongside the prompt.
 *
 * Both request shapes are built from the same inputs — OpenAI-compatible
 * providers (OpenRouter, Gemini's compatibility endpoint, OpenAI) take
 * `image_url` parts with a data URL, Anthropic takes `image` blocks with base64
 * source. Returns null when no provider is configured or every one fails, so the
 * caller reports an honest "could not inspect" rather than a guess.
 */
export async function callVisionLlm(
  input: {
    system: string;
    prompt: string;
    images: VisionImage[];
  },
  options: { temperature: number; maxTokens: number; timeoutMs?: number }
): Promise<string | null> {
  const env = getEnv();
  const timeoutMs = options.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS;

  if (input.images.length === 0) return null;

  const openAiContent = [
    { type: "text", text: input.prompt },
    ...input.images.map((image) => ({
      type: "image_url",
      image_url: { url: `data:${image.mediaType};base64,${image.base64}` },
    })),
  ];

  const openAiCompatible: Array<{ label: string; endpoint: string; model: string; key: string; headers?: Record<string, string> }> = [];
  if (env.openrouterApiKey) {
    openAiCompatible.push({
      label: "openrouter",
      endpoint: env.openrouterChatEndpoint,
      model: env.visionModel ?? env.openrouterChatModel,
      key: env.openrouterApiKey,
      headers: { "HTTP-Referer": "https://contractorai.app", "X-Title": "ContractorAI" },
    });
  }
  const primaryApiKey = env.geminiApiKey ?? env.openAiApiKey;
  if (primaryApiKey) {
    openAiCompatible.push({
      label: "primary",
      endpoint:
        env.geminiChatEndpoint ?? env.openAiChatEndpoint ?? "https://api.openai.com/v1/chat/completions",
      model: env.visionModel ?? env.geminiChatModel ?? env.openAiChatModel ?? "gemini-2.5-flash",
      key: primaryApiKey,
    });
  }

  for (const provider of openAiCompatible) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(provider.endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.key}`,
          ...(provider.headers ?? {}),
        },
        body: JSON.stringify({
          model: provider.model,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: openAiContent },
          ],
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const completion = payload.choices?.[0]?.message?.content?.trim();
        if (completion) return completion;
      } else {
        const body = await response.text();
        logger.warn("llm_client.vision_failed", {
          provider: provider.label,
          reason: body || response.statusText,
        });
      }
    } catch (error) {
      logger.warn("llm_client.vision_error", {
        provider: provider.label,
        reason:
          error instanceof Error && error.name === "AbortError"
            ? `vision_timeout_${timeoutMs}ms`
            : error instanceof Error
              ? error.message
              : "unknown_error",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  if (env.anthropicApiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(env.anthropicChatEndpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.visionModel ?? env.anthropicChatModel,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          system: input.system,
          messages: [
            {
              role: "user",
              content: [
                ...input.images.map((image) => ({
                  type: "image",
                  source: { type: "base64", media_type: image.mediaType, data: image.base64 },
                })),
                { type: "text", text: input.prompt },
              ],
            },
          ],
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          content?: Array<{ type?: string; text?: string }>;
        };
        const completion = (payload.content ?? [])
          .filter((block) => block.type === "text" && typeof block.text === "string")
          .map((block) => block.text as string)
          .join("")
          .trim();
        if (completion) return completion;
      } else {
        const body = await response.text();
        logger.warn("llm_client.vision_failed", {
          provider: "anthropic",
          reason: body || response.statusText,
        });
      }
    } catch (error) {
      logger.warn("llm_client.vision_error", {
        provider: "anthropic",
        reason:
          error instanceof Error && error.name === "AbortError"
            ? `vision_timeout_${timeoutMs}ms`
            : error instanceof Error
              ? error.message
              : "unknown_error",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

/**
 * Extract the first balanced top-level JSON object from a raw LLM completion.
 * Tolerant of code fences and surrounding prose that some providers emit even
 * when asked for JSON only. Returns null when no balanced object is found.
 */
export function extractFirstJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, i + 1);
      }
    }
  }
  return null;
}
