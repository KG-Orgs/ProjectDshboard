import type { ExtractedAnswer } from "@contractor/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

const callChatLlm = vi.fn();

vi.mock("./llm-client", () => ({
  callChatLlm: (...args: unknown[]) => callChatLlm(...args),
  extractFirstJsonObject: () => null,
}));

const { ANSWER_FORMATTER_SYSTEM_PROMPT, formatAnswer } = await import("./answer-formatter.service");

const FILE_ID = "11111111-1111-4111-8111-111111111111";

const ANSWER: ExtractedAnswer = {
  status: "partial",
  title: "Approval Details",
  summary: "The agreement was approved on March 19, 2025.",
  items: [
    { label: "Approval date", value: "March 19, 2025", citationIds: ["c1"] },
    { label: "Contract value", value: "$632,640", citationIds: ["c2"] },
  ],
  missing: ["supplier"],
  citations: [
    { id: "c1", documentId: "MTACD-MLJTC2-L-0024", fileId: FILE_ID, page: 1 },
    { id: "c2", documentId: "MTACD-MLJTC2-L-0024", fileId: FILE_ID, page: 4 },
  ],
};

beforeEach(() => {
  callChatLlm.mockReset();
});

describe("formatAnswer end to end", () => {
  it("links inline markers, appends the real source line, and keeps the model's prose", async () => {
    callChatLlm.mockResolvedValue(
      [
        "### Approval Details",
        "",
        "* **Approval date:** March 19, 2025. [1]",
        "* **Contract value:** $632,640. [2]",
        "* **Supplier:** Could not be verified from the available source.",
      ].join("\n")
    );

    const markdown = await formatAnswer({ question: "When was it approved and for how much?", answer: ANSWER });

    expect(markdown).toBe(
      [
        "### Approval Details",
        "",
        `* **Approval date:** March 19, 2025. [[1]](#citation:${FILE_ID}:1)`,
        `* **Contract value:** $632,640. [[2]](#citation:${FILE_ID}:4)`,
        "* **Supplier:** Could not be verified from the available source.",
        "",
        "**Sources:**",
        "",
        `* [1] [MTACD-MLJTC2-L-0024](#citation:${FILE_ID}:1), p. 1`,
        `* [2] [MTACD-MLJTC2-L-0024](#citation:${FILE_ID}:4), p. 4`,
      ].join("\n")
    );
  });

  it("renders a single-document answer as one compact source line", async () => {
    callChatLlm.mockResolvedValue("**Unit price:** $350 per pest-control visit. [1]");

    const markdown = await formatAnswer({
      question: "What is the unit price?",
      answer: {
        status: "complete",
        title: "Invoice 11830",
        items: [{ label: "Unit price", value: "$350 per pest-control visit", citationIds: ["c1"] }],
        citations: [{ id: "c1", documentId: "Invoice 11830", fileId: FILE_ID, page: 1 }],
      },
    });

    expect(markdown).toBe(
      [
        `**Unit price:** $350 per pest-control visit. [[1]](#citation:${FILE_ID}:1)`,
        "",
        `**Source:** [Invoice 11830](#citation:${FILE_ID}:1), p. 1`,
      ].join("\n")
    );
  });

  it("sends the formatter prompt and the verified facts to the model", async () => {
    callChatLlm.mockResolvedValue("* **Approval date:** March 19, 2025. [1]");

    await formatAnswer({ question: "When was it approved?", answer: ANSWER });

    const [messages, options] = callChatLlm.mock.calls[0] as [
      Array<{ role: string; content: string }>,
      { temperature: number; maxTokens: number },
    ];

    expect(messages[0]).toEqual({ role: "system", content: ANSWER_FORMATTER_SYSTEM_PROMPT });
    expect(messages[1].content).toContain("- Approval date: March 19, 2025 (cite [1])");
    expect(messages[1].content).toContain("Could not be verified");
    expect(options.temperature).toBeLessThanOrEqual(0.2);
  });

  it("replaces a hallucinated source reference with the real one", async () => {
    callChatLlm.mockResolvedValue(
      [
        "* **Approval date:** March 19, 2025. [1]",
        "",
        "**Source:** RFI-9999, p. 42 — https://example.com/not-a-real-doc",
      ].join("\n")
    );

    const markdown = await formatAnswer({ question: "When was it approved?", answer: ANSWER });

    expect(markdown).not.toContain("RFI-9999");
    expect(markdown).not.toContain("p. 42");
    expect(markdown).toContain(`* [1] [MTACD-MLJTC2-L-0024](#citation:${FILE_ID}:1), p. 1`);
  });

  it("falls back when the model leaks internal terminology", async () => {
    callChatLlm.mockResolvedValue("I could not find an exact indexed passage for the approval date.");

    await expect(
      formatAnswer({ question: "When was it approved?", answer: ANSWER })
    ).resolves.toBeNull();
  });

  it("falls back when the model is unavailable", async () => {
    callChatLlm.mockResolvedValue(null);

    await expect(
      formatAnswer({ question: "When was it approved?", answer: ANSWER })
    ).resolves.toBeNull();
  });

  it("leaves markers unlinked when the source file is unknown", async () => {
    callChatLlm.mockResolvedValue("* **Approval date:** March 19, 2025. [1]");

    const markdown = await formatAnswer({
      question: "When was it approved?",
      answer: {
        ...ANSWER,
        citations: ANSWER.citations.map(({ fileId, ...rest }) => rest),
      },
    });

    expect(markdown).toContain("* **Approval date:** March 19, 2025. [1]");
    expect(markdown).toContain("* [1] MTACD-MLJTC2-L-0024, p. 1");
    expect(markdown).not.toContain("#citation:");
  });
});
