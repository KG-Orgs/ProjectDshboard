import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "../config/env";
import { EmbeddingProviderError, embeddingsService } from "./embeddings.service";

describe("embeddingsService", () => {
  beforeEach(() => {
    resetEnvCache();
    vi.restoreAllMocks();
    vi.stubEnv("OPENAI_EMBEDDING_ENDPOINT", "https://api.openai.com/v1/embeddings");
    vi.stubEnv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small");
    vi.stubEnv("OPENAI_EMBEDDING_DIMENSIONS", "2");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails preflight when OPENAI_API_KEY is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    resetEnvCache();

    const result = await embeddingsService.preflight();

    expect(result.ok).toBe(false);
    expect(result.code).toBe("embedding_auth");
  });

  it("retries transient provider errors and succeeds", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    resetEnvCache();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "rate limited" } }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              { embedding: [0.1, 0.2] },
              { embedding: [0.3, 0.4] },
            ],
            model: "text-embedding-3-small",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const result = await embeddingsService.embedBatch(["alpha", "beta"]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0]?.vector).toEqual([0.1, 0.2]);
  });

  it("does not retry fatal auth failures", async () => {
    vi.stubEnv("OPENAI_API_KEY", "bad-key");
    resetEnvCache();

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "invalid api key" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await expect(embeddingsService.embedBatch(["alpha"]))
      .rejects.toBeInstanceOf(EmbeddingProviderError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("splits a batch after repeated timeout failures", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    resetEnvCache();

    const timeoutError = new Error("The operation was aborted due to timeout");
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ embedding: [0.11, 0.22] }],
            model: "text-embedding-3-small",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ embedding: [0.33, 0.44] }],
            model: "text-embedding-3-small",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const result = await embeddingsService.embedBatch(["alpha", "beta"]);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(result).toHaveLength(2);
    expect(result[0]?.vector).toEqual([0.11, 0.22]);
    expect(result[1]?.vector).toEqual([0.33, 0.44]);
  });

  it("splits a batch when provider returns mismatched vector count", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    resetEnvCache();

    const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { input?: string | string[] };
      const inputs = Array.isArray(body.input) ? body.input : [body.input ?? ""];

      if (inputs.length > 1) {
        return new Response(
          JSON.stringify({
            data: [{ embedding: [0.1, 0.2] }],
            model: "text-embedding-3-small",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const value = inputs[0] === "beta" ? 0.3 : inputs[0] === "gamma" ? 0.5 : 0.1;
      return new Response(
        JSON.stringify({
          data: [{ embedding: [value, value + 0.1] }],
          model: "text-embedding-3-small",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const result = await embeddingsService.embedBatch(["alpha", "beta", "gamma"]);

    expect(fetchMock.mock.calls.length).toBeGreaterThan(3);
    expect(result).toHaveLength(3);
  });
});
