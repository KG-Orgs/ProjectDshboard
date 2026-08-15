/**
 * Independent PASS / PARTIAL / FAIL grader.
 *
 * This is an *evaluation* layer, not part of the answer pipeline. It grades the
 * final user-visible answer text against benchmark reference facts and reports a
 * grade that is completely separate from the pipeline's own status:
 *
 *   production status   complete | partial | not_found | source_mismatch | deterministic
 *   independent grade   PASS | PARTIAL | FAIL   (plus UNGRADED when no reference exists)
 *
 * A `complete` answer can grade FAIL, and a `not_found` answer can grade PASS.
 * Nothing in here reads the production status as evidence of correctness; it is
 * carried through only so the report can cross-tabulate the two.
 *
 * Deterministic rules decide the cases that do not need judgement (wrong
 * document, false not-found, correct refusal, unrenderable answer). Everything
 * else goes to an LLM judge which is given the reference facts and told to
 * ignore confidence, formatting, citations, and the candidate's own labels. The
 * judge's field-by-field results are then aggregated into the overall grade by
 * code, so the headline number follows a fixed rubric rather than the judge's
 * mood.
 */
import { callChatLlm, extractFirstJsonObject } from "../src/services/llm-client";
import {
  checkDocumentFidelity,
  checkExpectedEvidence,
  detectRefusal,
  essentialFacts,
  isEssential,
  isGradable,
  type CandidateSource,
  type DocumentFidelityResult,
  type EvidenceCheckResult,
  type GroundTruthStatus,
  type QuestionExpectation,
} from "./eval-expectations";

export type IndependentGrade = "PASS" | "PARTIAL" | "FAIL" | "UNGRADED";
export type FieldResult = "correct" | "incorrect" | "missing" | "unsupported";
export type CitationGrade = "supported" | "partially_supported" | "unsupported" | "unavailable";

export const ERROR_CATEGORIES = [
  "WRONG_DOCUMENT",
  "WRONG_FACT",
  "MISSING_FACT",
  "FALSE_NOT_FOUND",
  "UNSUPPORTED_INFERENCE",
  "VISUAL_EVIDENCE_MISSED",
  "RETRIEVAL_FAILURE",
  "ANSWER_FORMAT_FAILURE",
  "CITATION_MISMATCH",
  "OTHER",
] as const;
export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

/** Human-readable labels for the failure roll-up. */
export const ERROR_CATEGORY_LABELS: Record<ErrorCategory, string> = {
  WRONG_DOCUMENT: "Wrong document",
  WRONG_FACT: "Wrong fact",
  MISSING_FACT: "Missing fact",
  FALSE_NOT_FOUND: "False not-found",
  UNSUPPORTED_INFERENCE: "Unsupported inference",
  VISUAL_EVIDENCE_MISSED: "Visual evidence missed",
  RETRIEVAL_FAILURE: "Retrieval failure",
  ANSWER_FORMAT_FAILURE: "Answer format failure",
  CITATION_MISMATCH: "Citation mismatch",
  OTHER: "Other",
};

export interface GradedFieldResult {
  field: string;
  label: string;
  essential: boolean;
  result: FieldResult;
  reason: string;
}

/** The judge's raw verdict, before code-side aggregation. */
export interface JudgeVerdict {
  grade: "PASS" | "PARTIAL" | "FAIL";
  fieldResults: Array<{ field: string; result: FieldResult; reason: string }>;
  materialErrors: string[];
  citationGrade: CitationGrade;
  reason: string;
}

/**
 * Signals lifted from the run trace. Used only to attribute a *cause* to a
 * failure the grade has already established — never to decide the grade.
 */
export interface TraceSignals {
  productionStatus: string;
  sourceCount: number;
  visualLikely?: boolean;
  visualTriggered?: boolean;
  visualEvidenceFound?: boolean;
  guardBlocked?: boolean;
  extractorFellBack?: boolean;
}

export interface GradeInput {
  id: string;
  query: string;
  /** The final rendered answer, exactly as the user sees it. */
  candidateAnswer: string;
  /** Sources/citations returned with the answer, for the fidelity check. */
  sources: CandidateSource[];
  expectation: QuestionExpectation | undefined;
  trace: TraceSignals;
  /** Present when the run itself threw. */
  runError?: string;
}

export interface GradeRecord {
  id: string;
  query: string;
  /** Carried through for cross-tabulation only. */
  productionStatus: string;
  grade: IndependentGrade;
  /** What the judge said before aggregation, when a judge ran. */
  judgeGrade: JudgeVerdict["grade"] | null;
  gradeSource: "deterministic" | "judge" | "ungraded";
  fieldResults: GradedFieldResult[];
  materialErrors: string[];
  citationGrade: CitationGrade;
  categories: ErrorCategory[];
  documentFidelity: DocumentFidelityResult | null;
  evidenceCheck: EvidenceCheckResult | null;
  reason: string;
  groundTruth: GroundTruthStatus | "none";
  /** The text that was graded, truncated for report size. */
  gradedText: string;
}

// ---------------------------------------------------------------------------
// Grade aggregation
// ---------------------------------------------------------------------------

/**
 * Fold per-field results into one grade.
 *
 *   no essential field correct                          → FAIL
 *   an essential field is wrong, and wrong ≥ correct     → FAIL
 *   an essential field is wrong, but correct outweighs   → PARTIAL
 *   all essential fields correct, material errors exist  → PARTIAL
 *   all essential fields correct, no material errors     → PASS
 *   some essential fields correct, rest missing/unsupported → PARTIAL
 *
 * Returns null when there are no fields to aggregate, leaving the caller to fall
 * back to the judge's own grade.
 */
export function aggregateGrade(
  fields: GradedFieldResult[],
  materialErrors: string[]
): "PASS" | "PARTIAL" | "FAIL" | null {
  const essential = fields.filter((f) => f.essential);
  const scope = essential.length > 0 ? essential : fields;
  if (scope.length === 0) return null;

  const correct = scope.filter((f) => f.result === "correct").length;
  const incorrect = scope.filter((f) => f.result === "incorrect").length;

  if (correct === 0) return "FAIL";
  if (incorrect > 0) return incorrect >= correct ? "FAIL" : "PARTIAL";
  if (correct < scope.length) return "PARTIAL";
  return materialErrors.length > 0 ? "PARTIAL" : "PASS";
}

/**
 * Map the judge's field list onto the benchmark's required facts.
 *
 * The benchmark defines the field set, so a fact the judge forgot to report
 * counts as `missing` rather than vanishing from the score. Field keys are
 * matched case-insensitively and ignoring separators, because judges rewrite
 * `unit_price` as `Unit Price` given the chance.
 */
export function alignFieldResults(
  expectation: QuestionExpectation,
  judged: JudgeVerdict["fieldResults"]
): GradedFieldResult[] {
  const key = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const byKey = new Map<string, JudgeVerdict["fieldResults"][number]>();
  for (const entry of judged) {
    if (entry?.field) byKey.set(key(entry.field), entry);
  }

  const aligned: GradedFieldResult[] = expectation.expected.requiredFacts.map((fact) => {
    const match = byKey.get(key(fact.field));
    if (match) byKey.delete(key(fact.field));
    return {
      field: fact.field,
      label: fact.label ?? fact.field,
      essential: isEssential(fact),
      result: match?.result ?? "missing",
      reason: match?.reason ?? "the grader returned no result for this required fact",
    };
  });

  // Fields the judge raised that the benchmark does not require are kept as
  // non-essential context — they can carry a material error worth reading.
  for (const leftover of byKey.values()) {
    aligned.push({
      field: leftover.field,
      label: leftover.field,
      essential: false,
      result: leftover.result,
      reason: leftover.reason ?? "",
    });
  }
  return aligned;
}

// ---------------------------------------------------------------------------
// Deterministic rules
// ---------------------------------------------------------------------------

export interface DeterministicOutcome {
  grade: IndependentGrade;
  categories: ErrorCategory[];
  citationGrade: CitationGrade;
  reason: string;
}

/**
 * Decide the cases that need no judgement. Returns null when the answer has to
 * go to the LLM judge.
 *
 * Order matters: an unrenderable answer is a format failure whatever it claims,
 * a refusal is graded against whether the benchmark says the fact exists, and a
 * wrong-document answer fails before anyone reads its contents.
 */
export function applyDeterministicRules(input: {
  expectation: QuestionExpectation | undefined;
  candidateAnswer: string;
  runError?: string;
  fidelity: DocumentFidelityResult | null;
  trace: TraceSignals;
}): DeterministicOutcome | null {
  const { expectation, candidateAnswer, runError, fidelity, trace } = input;

  if (runError) {
    return {
      grade: "FAIL",
      categories: ["OTHER"],
      citationGrade: "unavailable",
      reason: `the run itself failed: ${runError}`,
    };
  }

  if (!isGradable(expectation)) {
    return {
      grade: "UNGRADED",
      categories: [],
      citationGrade: "unavailable",
      reason: expectation
        ? "the benchmark has no reference facts for this question yet"
        : "no benchmark entry exists for this question id",
    };
  }
  const expected = expectation as QuestionExpectation;

  if (candidateAnswer.trim().length === 0) {
    return {
      grade: "FAIL",
      categories: ["ANSWER_FORMAT_FAILURE"],
      citationGrade: "unavailable",
      reason: "the pipeline returned an empty answer to the user",
    };
  }

  const refusal = detectRefusal(candidateAnswer);

  // A refusal is correct when the corpus genuinely does not carry the answer.
  if (!expected.expected.answerAvailable) {
    if (refusal.isRefusal) {
      return {
        grade: "PASS",
        categories: [],
        citationGrade: "unavailable",
        reason: `the benchmark records the information as absent and the answer correctly declines (${refusal.signal})`,
      };
    }
    return {
      grade: "FAIL",
      categories: ["UNSUPPORTED_INFERENCE"],
      citationGrade: "unsupported",
      reason:
        "the benchmark records the information as absent, but the answer asserts it anyway instead of declining",
    };
  }

  // A refusal is wrong when the benchmark says the fact is there.
  if (refusal.isRefusal) {
    const categories: ErrorCategory[] = ["FALSE_NOT_FOUND"];
    if (trace.sourceCount === 0 || fidelity?.status === "mismatch") {
      categories.push("RETRIEVAL_FAILURE");
    }
    if (expected.visualEvidenceExpected && !trace.visualEvidenceFound) {
      categories.push("VISUAL_EVIDENCE_MISSED");
    }
    return {
      grade: "FAIL",
      categories,
      citationGrade: "unavailable",
      reason: `the benchmark records the requested fact as present, but the answer reports it as unavailable (${refusal.signal})`,
    };
  }

  // An answer that asserts facts off the wrong document is wrong, however
  // confident it reads. Only a correct refusal escapes this rule, and a refusal
  // has already been handled above.
  if (fidelity?.status === "mismatch") {
    return {
      grade: "FAIL",
      categories: ["WRONG_DOCUMENT"],
      citationGrade: "unsupported",
      reason: `the answer is built on the wrong document — ${fidelity.detail} (returned: ${fidelity.otherSources.join(", ") || "none"})`,
    };
  }

  return null;
}

/**
 * Attribute a cause to a judge-graded PARTIAL or FAIL.
 *
 * Categories describe *why* the answer fell short and may overlap; PASS carries
 * none. The grade is already fixed by this point — nothing here changes it.
 */
export function assignCategories(input: {
  grade: IndependentGrade;
  fields: GradedFieldResult[];
  materialErrors: string[];
  citationGrade: CitationGrade;
  fidelity: DocumentFidelityResult | null;
  evidence: EvidenceCheckResult | null;
  expectation: QuestionExpectation;
  trace: TraceSignals;
}): ErrorCategory[] {
  if (input.grade === "PASS" || input.grade === "UNGRADED") return [];

  const categories = new Set<ErrorCategory>();
  const essential = input.fields.filter((f) => f.essential);

  if (essential.some((f) => f.result === "incorrect")) categories.add("WRONG_FACT");
  if (essential.some((f) => f.result === "missing")) categories.add("MISSING_FACT");
  if (input.fields.some((f) => f.result === "unsupported")) categories.add("UNSUPPORTED_INFERENCE");
  if (input.materialErrors.length > 0) categories.add("WRONG_FACT");

  if (input.citationGrade === "unsupported") categories.add("CITATION_MISMATCH");
  // A page-level evidence mismatch only counts as a root cause when the expected
  // location was verified by a human. Drafted page numbers come from the chunk
  // metadata of whichever copy of the document the drafting pass happened to read,
  // and duplicate file records page differently — so on a draft this check is
  // reported for information but is not evidence of a citation defect.
  if (
    input.expectation.groundTruth === "verified" &&
    (input.evidence?.status === "mismatch" || input.evidence?.status === "partial")
  ) {
    categories.add("CITATION_MISMATCH");
  }
  if (input.fidelity?.status === "mismatch") categories.add("WRONG_DOCUMENT");

  const missingOrWrong = essential.some((f) => f.result !== "correct");
  if (missingOrWrong && input.trace.sourceCount === 0) categories.add("RETRIEVAL_FAILURE");
  if (missingOrWrong && input.expectation.visualEvidenceExpected && !input.trace.visualEvidenceFound) {
    categories.add("VISUAL_EVIDENCE_MISSED");
  }
  // A deterministic render that answers the wrong thing is a formatting/route
  // failure rather than a knowledge failure: the extractor never produced the
  // structured answer the formatter needed.
  if (input.grade === "FAIL" && input.trace.productionStatus === "deterministic") {
    categories.add("ANSWER_FORMAT_FAILURE");
  }

  if (categories.size === 0) categories.add("OTHER");
  return [...categories];
}

// ---------------------------------------------------------------------------
// Judge prompt
// ---------------------------------------------------------------------------

const JUDGE_MAX_OUTPUT_TOKENS = 1_500;

export const INDEPENDENT_GRADER_SYSTEM_PROMPT = [
  "You are an independent QA evaluator.",
  "",
  "You are NOT the answering agent.",
  "",
  "Grade the candidate answer against the reference facts.",
  "",
  "Do not reward confidence, formatting, verbosity, citations, or the candidate's own status labels.",
  "",
  "Judge factual correctness and completeness.",
  "",
  "Return strict JSON only, with no prose and no code fences:",
  "{",
  '  "grade": "PASS" | "PARTIAL" | "FAIL",',
  '  "fieldResults": [',
  "    {",
  '      "field": "...",',
  '      "result": "correct" | "incorrect" | "missing" | "unsupported",',
  '      "reason": "..."',
  "    }",
  "  ],",
  '  "materialErrors": [],',
  '  "citationGrade": "supported" | "partially_supported" | "unsupported" | "unavailable",',
  '  "reason": "one concise explanation"',
  "}",
  "",
  "Rules:",
  "",
  "PASS:",
  "All essential facts are correct and no material incorrect claims exist.",
  "",
  "PARTIAL:",
  "At least one essential fact is correct, but another essential requested fact is missing or materially incomplete.",
  "",
  "FAIL:",
  "The core answer is incorrect, irrelevant, contradicts expected facts, uses the wrong document, or refuses despite benchmark evidence showing the answer exists.",
  "",
  "Field rules:",
  "- Use the exact field keys given in EXPECTED FACTS, one entry per key.",
  '- "correct" — the answer states this fact and it agrees with an accepted value or the expected meaning. Wording may differ; do not require exact wording.',
  '- "incorrect" — the answer states this fact and it contradicts the reference.',
  '- "missing" — the answer does not state this fact, or is too vague to be useful.',
  '- "unsupported" — the answer states this fact but the cited sources do not support it.',
  "",
  "Citation rules:",
  "- Judge whether the cited evidence actually supports the claims made.",
  "- Do not assume a citation is valid merely because one exists.",
  '- "unavailable" when the answer cites nothing.',
  "",
  "Do not use the candidate answer's self-reported status as evidence of correctness.",
].join("\n");

/** Render the reference facts block for the judge prompt. */
export function formatExpectedFacts(expectation: QuestionExpectation): string {
  const lines: string[] = [];
  for (const fact of expectation.expected.requiredFacts) {
    const parts = [`- field: ${fact.field}`];
    parts.push(`  essential: ${isEssential(fact) ? "yes" : "no"}`);
    if (fact.label && fact.label !== fact.field) parts.push(`  asks for: ${fact.label}`);
    if (fact.acceptedValues?.length) {
      parts.push(`  accepted values (any one is correct): ${fact.acceptedValues.map((v) => `"${v}"`).join(" | ")}`);
    }
    if (fact.expectedMeaning) parts.push(`  expected meaning: ${fact.expectedMeaning}`);
    lines.push(parts.join("\n"));
  }
  if (expectation.expected.forbiddenClaims.length > 0) {
    lines.push(
      `- forbidden claims (each one present is a material error): ${expectation.expected.forbiddenClaims
        .map((c) => `"${c}"`)
        .join(" | ")}`
    );
  }
  if (expectation.expected.notes) lines.push(`- notes: ${expectation.expected.notes}`);
  return lines.join("\n") || "(none recorded)";
}

function formatExpectedDocument(expectation: QuestionExpectation): string {
  const doc = expectation.expectedDocument;
  if (!doc || (!doc.identifier && !(doc.fileNamePatterns ?? []).length)) {
    return "(the benchmark pins no specific document)";
  }
  const bits = [`identifier: ${doc.identifier ?? "(none)"}`, `revision: ${doc.revision ?? "(any)"}`];
  if (doc.fileNamePatterns?.length) bits.push(`file name contains: ${doc.fileNamePatterns.join(" | ")}`);
  return bits.join("\n");
}

function formatCandidateSources(sources: CandidateSource[]): string {
  if (sources.length === 0) return "(the answer cited no sources)";
  return sources
    .map((source) => {
      const pages = [
        ...(typeof source.page === "number" ? [source.page] : []),
        ...(source.pages ?? []),
      ];
      return `- ${source.fileName ?? "unknown file"}${pages.length ? ` — pages ${[...new Set(pages)].join(", ")}` : ""}`;
    })
    .join("\n");
}

export function buildJudgeUserMessage(input: {
  query: string;
  candidateAnswer: string;
  sources: CandidateSource[];
  expectation: QuestionExpectation;
}): string {
  return [
    "QUESTION:",
    input.query,
    "",
    "EXPECTED FACTS:",
    formatExpectedFacts(input.expectation),
    "",
    "EXPECTED DOCUMENT:",
    formatExpectedDocument(input.expectation),
    "",
    "CANDIDATE ANSWER (this is the final text the user sees — grade exactly this):",
    input.candidateAnswer,
    "",
    "CANDIDATE SOURCES:",
    formatCandidateSources(input.sources),
  ].join("\n");
}

const FIELD_RESULTS = new Set<FieldResult>(["correct", "incorrect", "missing", "unsupported"]);
const CITATION_GRADES = new Set<CitationGrade>([
  "supported",
  "partially_supported",
  "unsupported",
  "unavailable",
]);

/** Parse a judge completion into a verdict, or null when it is unusable. */
export function parseJudgeVerdict(raw: string): JudgeVerdict | null {
  const jsonText = extractFirstJsonObject(raw);
  if (!jsonText) return null;
  let parsed: Record<string, unknown>;
  try {
    const value = JSON.parse(jsonText) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    parsed = value as Record<string, unknown>;
  } catch {
    return null;
  }

  const gradeRaw = typeof parsed.grade === "string" ? parsed.grade.trim().toUpperCase() : "";
  if (gradeRaw !== "PASS" && gradeRaw !== "PARTIAL" && gradeRaw !== "FAIL") return null;

  const fieldResults = Array.isArray(parsed.fieldResults)
    ? (parsed.fieldResults as unknown[])
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const obj = entry as Record<string, unknown>;
          const field = typeof obj.field === "string" ? obj.field.trim() : "";
          if (!field) return null;
          const result = FIELD_RESULTS.has(obj.result as FieldResult)
            ? (obj.result as FieldResult)
            : "missing";
          return { field, result, reason: typeof obj.reason === "string" ? obj.reason.trim() : "" };
        })
        .filter((entry): entry is JudgeVerdict["fieldResults"][number] => Boolean(entry))
    : [];

  const materialErrors = Array.isArray(parsed.materialErrors)
    ? (parsed.materialErrors as unknown[]).filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
      )
    : [];

  const citationGrade = CITATION_GRADES.has(parsed.citationGrade as CitationGrade)
    ? (parsed.citationGrade as CitationGrade)
    : "unavailable";

  return {
    grade: gradeRaw,
    fieldResults,
    materialErrors,
    citationGrade,
    reason: typeof parsed.reason === "string" ? parsed.reason.trim() : "",
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export type JudgeCall = (system: string, user: string) => Promise<string | null>;

/** Default judge transport: the shared provider ladder at temperature 0. */
export const defaultJudgeCall: JudgeCall = (system, user) =>
  callChatLlm(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0, maxTokens: JUDGE_MAX_OUTPUT_TOKENS, timeoutMs: 60_000 }
  );

const MAX_GRADED_TEXT = 4_000;

/**
 * Grade one question. Deterministic rules first; the judge only sees the cases
 * they do not settle. `judge` is injectable so the grading logic can be tested
 * without a provider.
 */
export async function gradeQuestion(
  input: GradeInput,
  judge: JudgeCall = defaultJudgeCall
): Promise<GradeRecord> {
  const candidateAnswer = input.candidateAnswer ?? "";
  const expectation = input.expectation;
  const fidelity = expectation ? checkDocumentFidelity(expectation, input.sources) : null;
  const evidence = expectation ? checkExpectedEvidence(expectation, input.sources) : null;

  const base = {
    id: input.id,
    query: input.query,
    productionStatus: input.trace.productionStatus,
    documentFidelity: fidelity,
    evidenceCheck: evidence,
    groundTruth: expectation?.groundTruth ?? ("none" as const),
    gradedText: candidateAnswer.slice(0, MAX_GRADED_TEXT),
  };

  const deterministic = applyDeterministicRules({
    expectation,
    candidateAnswer,
    runError: input.runError,
    fidelity,
    trace: input.trace,
  });

  if (deterministic) {
    return {
      ...base,
      grade: deterministic.grade,
      judgeGrade: null,
      gradeSource: deterministic.grade === "UNGRADED" ? "ungraded" : "deterministic",
      fieldResults: [],
      materialErrors: [],
      citationGrade: deterministic.citationGrade,
      categories: deterministic.categories,
      reason: deterministic.reason,
    };
  }

  const expected = expectation as QuestionExpectation;
  const userMessage = buildJudgeUserMessage({
    query: input.query,
    candidateAnswer,
    sources: input.sources,
    expectation: expected,
  });

  const completion = await judge(INDEPENDENT_GRADER_SYSTEM_PROMPT, userMessage);
  const verdict = completion ? parseJudgeVerdict(completion) : null;

  if (!verdict) {
    return {
      ...base,
      grade: "UNGRADED",
      judgeGrade: null,
      gradeSource: "ungraded",
      fieldResults: essentialFacts(expected).map((fact) => ({
        field: fact.field,
        label: fact.label ?? fact.field,
        essential: true,
        result: "missing" as FieldResult,
        reason: "not graded",
      })),
      materialErrors: [],
      citationGrade: "unavailable",
      categories: [],
      reason: completion
        ? "the grader returned output that could not be parsed as a verdict"
        : "the grader LLM was unavailable, so this question was not graded",
    };
  }

  const fields = alignFieldResults(expected, verdict.fieldResults);
  const citationGrade: CitationGrade = input.sources.length === 0 ? "unavailable" : verdict.citationGrade;
  const aggregated = aggregateGrade(fields, verdict.materialErrors);
  const grade: IndependentGrade = aggregated ?? verdict.grade;

  const categories = assignCategories({
    grade,
    fields,
    materialErrors: verdict.materialErrors,
    citationGrade,
    fidelity,
    evidence,
    expectation: expected,
    trace: input.trace,
  });

  // Record the disagreement rather than hiding it: the rubric owns the headline
  // grade, but a judge that scored it differently is worth a reader's attention.
  const reason =
    aggregated && aggregated !== verdict.grade
      ? `${verdict.reason} [rubric aggregation returned ${aggregated} where the grader said ${verdict.grade}]`
      : verdict.reason;

  return {
    ...base,
    grade,
    judgeGrade: verdict.grade,
    gradeSource: "judge",
    fieldResults: fields,
    materialErrors: verdict.materialErrors,
    citationGrade,
    categories,
    reason,
  };
}
