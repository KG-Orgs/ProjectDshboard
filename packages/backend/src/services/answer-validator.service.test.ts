import type { ExtractedAnswer } from "@contractor/shared";
import { describe, expect, it } from "vitest";
import {
  buildValidatorUserMessage,
  coerceAnswerValidation,
  evidenceFromExtractedAnswer,
  parseAnswerValidation,
} from "./answer-validator.service";

describe("coerceAnswerValidation", () => {
  it("maps snake_case fields to camelCase", () => {
    const v = coerceAnswerValidation({
      grade: "partial",
      failure_type: "incomplete",
      requested_fields: [
        { field: "due date", status: "answered" },
        { field: "reviewer", status: "missing" },
      ],
      unsupported_claims: ["claims a 30-day extension not in evidence"],
      notes: "Due date answered; reviewer missing.",
    });

    expect(v).toEqual({
      grade: "partial",
      failureType: "incomplete",
      requestedFields: [
        { field: "due date", status: "answered" },
        { field: "reviewer", status: "missing" },
      ],
      unsupportedClaims: ["claims a 30-day extension not in evidence"],
      notes: "Due date answered; reviewer missing.",
    });
  });

  it("returns null when grade is not a recognised value", () => {
    expect(coerceAnswerValidation({ grade: "maybe" })).toBeNull();
  });

  it("defaults failureType from the grade when missing or invalid", () => {
    expect(coerceAnswerValidation({ grade: "pass" })!.failureType).toBe("none");
    expect(coerceAnswerValidation({ grade: "partial" })!.failureType).toBe("incomplete");
    expect(coerceAnswerValidation({ grade: "fail", failure_type: "bogus" })!.failureType).toBe(
      "unsupported_claim"
    );
  });

  it("drops nameless requested fields and defaults bad statuses to missing", () => {
    const v = coerceAnswerValidation({
      grade: "partial",
      requested_fields: [
        { field: "", status: "answered" },
        { field: "scope", status: "nonsense" },
      ],
    });
    expect(v!.requestedFields).toEqual([{ field: "scope", status: "missing" }]);
  });
});

describe("parseAnswerValidation", () => {
  it("parses a verdict wrapped in code fences", () => {
    const raw = 'Result:\n```json\n{"grade":"pass","notes":"ok"}\n```';
    expect(parseAnswerValidation(raw)!.grade).toBe("pass");
  });

  it("returns null when there is no JSON object", () => {
    expect(parseAnswerValidation("the answer looks fine")).toBeNull();
  });
});

describe("evidenceFromExtractedAnswer", () => {
  it("keeps only citations that carry evidence text", () => {
    const answer: ExtractedAnswer = {
      status: "complete",
      title: "T",
      items: [],
      citations: [
        { id: "c1", documentName: "RFI-0115", page: 3, evidenceText: "Response due 2026-02-01." },
        { id: "c2", documentName: "RFI-0115", page: 4 },
      ],
    };
    const evidence = evidenceFromExtractedAnswer(answer);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({ id: "c1", documentName: "RFI-0115", page: 3, text: "Response due 2026-02-01." });
  });
});

describe("buildValidatorUserMessage", () => {
  it("includes the question, answer, and tagged evidence", () => {
    const msg = buildValidatorUserMessage({
      question: "When is RFI-0115 due?",
      answerText: "Due 2026-02-01.",
      evidence: [{ id: "c1", documentName: "RFI-0115", page: 3, text: "Response due 2026-02-01." }],
    });
    expect(msg).toContain("When is RFI-0115 due?");
    expect(msg).toContain("Due 2026-02-01.");
    expect(msg).toContain('[c1] document="RFI-0115" page=3');
  });

  it("notes when no evidence was supplied", () => {
    const msg = buildValidatorUserMessage({ question: "q", answerText: "a", evidence: [] });
    expect(msg).toContain("(no evidence was supplied)");
  });
});
