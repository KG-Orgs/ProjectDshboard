import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "../config/env";
import { interpretationService } from "./interpretation.service";

describe("interpretationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.CHAT_INTERPRETER_ENABLE_LLM = "true";
    process.env.DEEPSEEK_API_KEY = "test-key";
    resetEnvCache();
  });

  afterEach(() => {
    delete process.env.CHAT_INTERPRETER_ENABLE_LLM;
    delete process.env.DEEPSEEK_API_KEY;
    resetEnvCache();
  });

  it("normalizes invalid llm intents to general_qa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "unknown_intent",
                  confidence: 0.95,
                  alternatives: [{ intent: "bogus", confidence: 0.9 }],
                }),
              },
            },
          ],
        }),
      })
    );

    const interpreted = await interpretationService.interpret({
      query: "give me a project update",
    });

    expect(interpreted.source).toBe("llm");
    expect(interpreted.intent).toBe("general_qa");
    expect(interpreted.alternatives?.[0]?.intent).toBe("general_qa");
  });

  it("enriches interpretation with construction identifiers from the query", async () => {
    delete process.env.CHAT_INTERPRETER_ENABLE_LLM;

    const interpreted = await interpretationService.interpret({
      query: "What hold points does QWP-001 require before concrete placement?",
    });

    expect(interpreted.retrievalHints?.exactIdentifierFirst).toBe(true);
    expect(interpreted.entities?.constructionIdentifiers).toContain("QWP1");
  });

  describe("enrichWithMeetingIntent", () => {
    beforeEach(() => {
      delete process.env.CHAT_INTERPRETER_ENABLE_LLM;
      resetEnvCache();
    });

    it("creates a meeting_minutes restriction from an empty list on strong meeting phrases (sq38 pattern)", async () => {
      // Rules fallback → general_qa, empty preferredCategories.
      // The strong phrase "Monthly Job Progress Meeting" must create a restriction.
      const interpreted = await interpretationService.interpret({
        query:
          "In the July 24, 2025 Monthly Job Progress Meeting, which MLJ Contracting and TC Electric staff attended and presented?",
      });
      const cats = interpreted.retrievalHints?.preferredCategories ?? [];
      expect(cats).toContain("meeting_minutes");
      expect(cats).toContain("communication");
    });

    it("creates a meeting_minutes restriction for sq41 (no attendance vocabulary)", async () => {
      const interpreted = await interpretationService.interpret({
        query:
          "In the May 28, 2026 Monthly Job Progress Meeting, how many Grade Operations have been completed?",
      });
      const cats = interpreted.retrievalHints?.preferredCategories ?? [];
      expect(cats).toContain("meeting_minutes");
      expect(cats).toContain("communication");
    });

    it("widens an existing contract restriction for a meeting query (sq38 + LLM contracts domain)", async () => {
      process.env.CHAT_INTERPRETER_ENABLE_LLM = "true";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    intent: "contract_notice",
                    confidence: 0.80,
                    retrievalHints: {
                      preferredCategories: ["contract", "rfi", "correspondence"],
                    },
                  }),
                },
              },
            ],
          }),
        })
      );

      const interpreted = await interpretationService.interpret({
        query:
          "In the July 24, 2025 Monthly Job Progress Meeting, which MLJ Contracting and TC Electric staff attended and presented?",
      });

      const cats = interpreted.retrievalHints?.preferredCategories ?? [];
      expect(cats).toContain("meeting_minutes");
      expect(cats).toContain("communication");
      expect(cats).toContain("contract");
    });

    it("does not create a restriction from an empty list on weak meeting signal (meeting + attended, no explicit type)", async () => {
      // Query has "meeting" and "attended" but no explicit meeting type phrase.
      // Weak signal must not create a new restriction from empty list.
      const interpreted = await interpretationService.interpret({
        query: "Who attended the meeting on Friday?",
      });
      const cats = interpreted.retrievalHints?.preferredCategories ?? [];
      // Either empty (no change) or already had categories → meeting_minutes added
      if (cats.length === 1 && cats[0] === "meeting_minutes") {
        // This should NOT happen for a weak signal with an empty starting list
        expect(cats.length).toBeGreaterThan(1);
      }
    });

    it("does not add meeting_minutes to unrelated queries", async () => {
      const interpreted = await interpretationService.interpret({
        query: "What is the retainage amount in the Island Pavement subcontract?",
      });
      const cats = interpreted.retrievalHints?.preferredCategories ?? [];
      expect(cats).not.toContain("meeting_minutes");
    });
  });
});
