import { describe, expect, it } from "vitest";
import {
  combineAnswerResult,
  scoreAnswerPhrases,
  scoreSearchQuestion,
  type Mlj017TestQuestion,
  type SearchHitRow,
} from "./mlj017-eval.utils";

function row(fileName: string, relevance: number, filePath?: string): SearchHitRow {
  return { fileId: "id", fileName, relevance, filePath };
}

describe("mlj017 eval utils", () => {
  it("passes find when expected pattern is in top-K", () => {
    const question: Mlj017TestQuestion = {
      id: "find-01",
      bucket: "find",
      query: "track specs",
      expectedFilePatterns: ["Volume_06_Track"],
    };
    const result = scoreSearchQuestion(
      question,
      [row("A37806_Volume_06_Track_Specifications.pdf", 0.9)],
      5
    );
    expect(result.passed).toBe(true);
    expect(result.matchedPatterns).toContain("Volume_06_Track");
  });

  it("fails identifier when pattern missing", () => {
    const question: Mlj017TestQuestion = {
      id: "id-01",
      bucket: "identifier",
      query: "RFI-063",
      expectedFilePatterns: ["RFI063"],
    };
    const result = scoreSearchQuestion(question, [row("unrelated.pdf", 0.8)], 1);
    expect(result.passed).toBe(false);
  });

  it("passes not_found when relevance is low", () => {
    const question: Mlj017TestQuestion = {
      id: "nf-01",
      bucket: "not_found",
      query: "Mars colony",
      expectedFilePatterns: [],
      maxTopRelevance: 0.65,
    };
    const result = scoreSearchQuestion(question, [row("weak.pdf", 0.4)], 2);
    expect(result.passed).toBe(true);
  });

  it("combines search and phrase checks for answer bucket", () => {
    const search = scoreSearchQuestion(
      {
        id: "ans-01",
        bucket: "answer",
        query: "UPS backup",
        expectedFilePatterns: ["RFI063"],
      },
      [row("A37806_ADA P6_RFI063 Data Cabinet AC on UPS.pdf", 0.85)],
      3
    );
    const phrases = scoreAnswerPhrases("Communications UPS backup is two hours", ["UPS", "two hours"]);
    const combined = combineAnswerResult(search, phrases, "Communications UPS backup is two hours");
    expect(combined.passed).toBe(true);
    expect(combined.answerPhraseHits).toContain("UPS");
  });
});
