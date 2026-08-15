import type { AnswerValidation, ExtractedAnswer } from "@contractor/shared";
import { logger } from "../lib/logger";
import { callChatLlm, extractFirstJsonObject } from "./llm-client";

/**
 * Answer Completeness and Grounding Validator.
 *
 * Grades an AI-generated answer against the user's question and the evidence it
 * was allowed to use. Shared between the eval harness (offline scoring) and the
 * runtime path (optional self-check over the extractor's `answer`). Deliberately
 * has no eval- or request-specific dependencies — it takes plain data in and
 * returns a typed verdict.
 */

const VALIDATOR_MAX_OUTPUT_TOKENS = 1_024;

export const ANSWER_VALIDATOR_SYSTEM_PROMPT = [
  "You are validating an AI-generated answer against a user's question and its supporting evidence.",
  "Your goal is to determine whether the answer actually answers the question completely and whether every claim is supported.",
  "",
  "## Instructions",
  "1. Break the user's question into the individual facts, fields, or tasks being requested.",
  "2. Check whether the proposed answer addresses each requested item.",
  "3. Check whether every factual claim is supported by the cited evidence.",
  "4. Check whether the cited source matches any exact document identifier and revision specified by the user.",
  "5. Do not give credit merely because the correct document was retrieved.",
  "6. Do not give credit for irrelevant information.",
  "7. Do not allow a wrong document to answer an exact-document question.",
  "8. If part of the question is answered and part is missing, classify the answer as partial.",
  "9. If the answer says information is unavailable but the supplied evidence clearly contains it, classify this as a synthesis failure.",
  "10. If the correct evidence was never supplied, classify this as a retrieval failure.",
  "",
  "## Output",
  "Return valid JSON only, with this exact shape:",
  "{",
  '  "grade": "pass | partial | fail",',
  '  "failure_type": "none | retrieval | synthesis | source_mismatch | unsupported_claim | incomplete",',
  '  "requested_fields": [ { "field": "Requested item", "status": "answered | missing | unsupported" } ],',
  '  "unsupported_claims": [],',
  '  "notes": "One concise explanation of the result"',
  "}",
  "",
  "## Grading",
  "pass — all material requested fields are answered, claims are supported, and the correct document/revision is used.",
  "partial — some requested fields are correctly answered but at least one requested field is missing.",
  "fail — wrong document; answer is materially irrelevant; most requested information is missing; claims are unsupported; or the response claims it answered the question when it did not.",
].join("\n");

export interface ValidatorEvidenceItem {
  id?: string;
  documentId?: string;
  documentName?: string;
  page?: number;
  text: string;
}

export interface ValidateAnswerInput {
  question: string;
  /** The answer under test, as displayed to the user. */
  answerText: string;
  /** The evidence the answer was allowed to draw on. */
  evidence: ValidatorEvidenceItem[];
}

const GRADES = new Set<AnswerValidation["grade"]>(["pass", "partial", "fail"]);
const FAILURE_TYPES = new Set<AnswerValidation["failureType"]>([
  "none",
  "retrieval",
  "synthesis",
  "source_mismatch",
  "unsupported_claim",
  "incomplete",
]);
const FIELD_STATUSES = new Set<AnswerValidation["requestedFields"][number]["status"]>([
  "answered",
  "missing",
  "unsupported",
]);

/** Build the evidence block the validator prompt consumes. */
export function buildValidatorUserMessage(input: ValidateAnswerInput): string {
  const evidenceBlocks =
    input.evidence.length > 0
      ? input.evidence.map((item, index) => {
          const id = item.id ?? `c${index + 1}`;
          const doc = item.documentName ?? item.documentId ?? "unknown";
          const page = typeof item.page === "number" ? ` page=${item.page}` : "";
          const text = item.text.replace(/\s+/g, " ").trim().slice(0, 1200);
          return `[${id}] document="${doc}"${page}\n${text}`;
        })
      : ["(no evidence was supplied)"];

  return [
    `Question:\n${input.question}`,
    "",
    `Proposed answer:\n${input.answerText}`,
    "",
    "Evidence:",
    evidenceBlocks.join("\n\n"),
  ].join("\n");
}

/**
 * Validate and normalise a parsed JSON object into an AnswerValidation. Maps the
 * prompt's snake_case fields to the camelCase API type. Returns null when the
 * object is not a recognisable verdict.
 */
export function coerceAnswerValidation(parsed: Record<string, unknown>): AnswerValidation | null {
  if (!GRADES.has(parsed.grade as AnswerValidation["grade"])) {
    return null;
  }
  const grade = parsed.grade as AnswerValidation["grade"];

  const failureType = FAILURE_TYPES.has(parsed.failure_type as AnswerValidation["failureType"])
    ? (parsed.failure_type as AnswerValidation["failureType"])
    : grade === "pass"
      ? "none"
      : grade === "partial"
        ? "incomplete"
        : "unsupported_claim";

  const requestedFields = Array.isArray(parsed.requested_fields)
    ? (parsed.requested_fields as unknown[])
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const obj = entry as Record<string, unknown>;
          const field = typeof obj.field === "string" ? obj.field.trim() : "";
          if (!field) return null;
          const status = FIELD_STATUSES.has(obj.status as AnswerValidation["requestedFields"][number]["status"])
            ? (obj.status as AnswerValidation["requestedFields"][number]["status"])
            : "missing";
          return { field, status };
        })
        .filter((entry): entry is AnswerValidation["requestedFields"][number] => Boolean(entry))
    : [];

  const unsupportedClaims = Array.isArray(parsed.unsupported_claims)
    ? (parsed.unsupported_claims as unknown[]).filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];

  const notes = typeof parsed.notes === "string" ? parsed.notes.trim() : "";

  return { grade, failureType, requestedFields, unsupportedClaims, notes };
}

/** Parse a raw LLM completion into an AnswerValidation, or null on failure. */
export function parseAnswerValidation(raw: string): AnswerValidation | null {
  const jsonText = extractFirstJsonObject(raw);
  if (!jsonText) return null;
  try {
    const value = JSON.parse(jsonText) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return coerceAnswerValidation(value as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Derive validator evidence from an extractor answer's own citations. */
export function evidenceFromExtractedAnswer(answer: ExtractedAnswer): ValidatorEvidenceItem[] {
  return answer.citations
    .filter((citation) => typeof citation.evidenceText === "string" && citation.evidenceText.trim().length > 0)
    .map((citation) => ({
      id: citation.id,
      documentId: citation.documentId,
      documentName: citation.documentName,
      page: citation.page,
      text: citation.evidenceText as string,
    }));
}

/**
 * Run the validator end to end. Returns null when the LLM is unavailable or
 * returns unparseable output, so callers can decide how to treat an ungraded
 * answer rather than receiving a fabricated verdict.
 */
export async function validateAnswer(
  input: ValidateAnswerInput,
  options?: { timeoutMs?: number }
): Promise<AnswerValidation | null> {
  const completion = await callChatLlm(
    [
      { role: "system", content: ANSWER_VALIDATOR_SYSTEM_PROMPT },
      { role: "user", content: buildValidatorUserMessage(input) },
    ],
    { temperature: 0, maxTokens: VALIDATOR_MAX_OUTPUT_TOKENS, timeoutMs: options?.timeoutMs }
  );

  if (!completion) return null;

  const validation = parseAnswerValidation(completion);
  if (!validation) {
    logger.warn("answer_validator.parse_failed", { sample: completion.slice(0, 160) });
    return null;
  }
  return validation;
}
