import { describe, expect, it } from "vitest";
import {
  checkDocumentFidelity,
  checkExpectedEvidence,
  detectRefusal,
  identifierAppearsIn,
  isGradable,
  type QuestionExpectation,
} from "./eval-expectations";
import {
  aggregateGrade,
  alignFieldResults,
  applyDeterministicRules,
  assignCategories,
  buildJudgeUserMessage,
  gradeQuestion,
  parseJudgeVerdict,
  type GradedFieldResult,
  type TraceSignals,
} from "./independent-grader";

function expectation(overrides: Partial<QuestionExpectation> = {}): QuestionExpectation {
  return {
    id: "sq27",
    query: "In Invoice 11830, what is the unit price per pest control visit and total amount due?",
    groundTruth: "verified",
    expected: {
      answerAvailable: true,
      requiredFacts: [
        { field: "unit_price", label: "unit price per visit", acceptedValues: ["$350", "$350.00"] },
        { field: "total_amount", label: "total amount due", acceptedValues: ["$1,400", "$1,400.00"] },
      ],
      forbiddenClaims: [],
      notes: "",
    },
    expectedDocument: { identifier: "INV-11830", revision: null, fileNamePatterns: ["11830"] },
    ...overrides,
  };
}

function trace(overrides: Partial<TraceSignals> = {}): TraceSignals {
  return { productionStatus: "complete", sourceCount: 1, ...overrides };
}

function field(overrides: Partial<GradedFieldResult>): GradedFieldResult {
  return {
    field: "f",
    label: "f",
    essential: true,
    result: "correct",
    reason: "",
    ...overrides,
  };
}

describe("identifier matching", () => {
  it("matches the same identifier written with and without zero padding", () => {
    expect(identifierAppearsIn("RFI-096", "A37806_ADA P6_RFI096.pdf")).toBe(true);
    expect(identifierAppearsIn("RFI096", "A37806_RFI-0096 - CLO - something.pdf")).toBe(true);
    expect(identifierAppearsIn("GEN-042R00", "a37806 01 30 20 gen-042r00 - fio -")).toBe(true);
  });

  it("does not match a different document number", () => {
    expect(identifierAppearsIn("RFI-096", "A37806_RFI-0042 - Response.pdf")).toBe(false);
    // A plain substring test on zero-stripped text would match AVI-002 here.
    expect(identifierAppearsIn("AVI-002", "A37806_AVI-020R00 - FIO - something.pdf")).toBe(false);
  });

  it("refuses to match on a single ambiguous token", () => {
    expect(identifierAppearsIn("GEN", "A37806_01 30 20_GEN-042R00.pdf")).toBe(false);
  });
});

describe("document fidelity", () => {
  it("fails an answer built on a different document", () => {
    const result = checkDocumentFidelity(expectation({ expectedDocument: { identifier: "RFI-096" } }), [
      { fileName: "A37806_RFI-0042 - Response.pdf" },
    ]);
    expect(result.status).toBe("mismatch");
    expect(result.otherSources).toEqual(["A37806_RFI-0042 - Response.pdf"]);
  });

  it("passes when at least one returned source is the requested document", () => {
    const result = checkDocumentFidelity(expectation({ expectedDocument: { identifier: "RFI-096" } }), [
      { fileName: "some other file.pdf" },
      { fileName: "A37806_ADA P6_RFI096.pdf" },
    ]);
    expect(result.status).toBe("match");
    expect(result.matchedSources).toEqual(["A37806_ADA P6_RFI096.pdf"]);
  });

  it("prefers the file-name pin over the identifier when both are recorded", () => {
    // Sixteen files in this corpus carry RFI-096. The pin names the one meant, so
    // a same-identifier sibling must not satisfy the check.
    const pinned = expectation({
      expectedDocument: { identifier: "RFI-096", fileNamePatterns: ["A37806_ADA P6_RFI096.pdf"] },
    });
    expect(checkDocumentFidelity(pinned, [{ fileName: "A37806_ADA P6_RFI096.pdf" }]).status).toBe("match");
    expect(
      checkDocumentFidelity(pinned, [
        { fileName: "A37806_RFI-0163 - AECOM-RFI-096 follow Up to RFI-119 EMR HVAC.pdf" },
      ]).status
    ).toBe("mismatch");
  });

  it("accepts the same document re-transmitted under a different status code", () => {
    // ORIG / FIO / APP / AAN / RWC are transmittal states of one document, each a
    // separate file record. Answering from a sibling state is not a wrong document.
    const pinned = expectation({
      expectedDocument: {
        fileNamePatterns: [
          "A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf",
        ],
      },
    });
    expect(
      checkDocumentFidelity(pinned, [
        {
          fileName:
            "A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf",
        },
      ]).status
    ).toBe("match");
  });

  it("still rejects a different revision of the same drawing", () => {
    const pinned = expectation({
      expectedDocument: {
        fileNamePatterns: ["A37806_03 20 00_AVI-002R02 - FIO - Ave I North Foundation Rebar Shop Drawings.pdf"],
      },
    });
    expect(
      checkDocumentFidelity(pinned, [
        { fileName: "A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf" },
      ]).status
    ).toBe("mismatch");
  });

  it("still rejects a genuinely unrelated document", () => {
    const pinned = expectation({
      expectedDocument: {
        fileNamePatterns: ["A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf"],
      },
    });
    expect(
      checkDocumentFidelity(pinned, [{ fileName: "MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf" }]).status
    ).toBe("mismatch");
  });

  it("matches across format siblings of one document", () => {
    const pinned = expectation({
      expectedDocument: { fileNamePatterns: ["M017_IMP_Draft Subcontract_20251024.docx"] },
    });
    expect(checkDocumentFidelity(pinned, [{ fileName: "M017_IMP_Draft Subcontract_20251024.pdf" }]).status).toBe(
      "match"
    );
  });

  it("matches a pin against the extractor's truncated lower-cased label", () => {
    const pinned = expectation({
      expectedDocument: {
        fileNamePatterns: ["A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf"],
      },
    });
    expect(checkDocumentFidelity(pinned, [{ fileName: "a37806 01 30 20 gen-042r00 - fio -" }]).status).toBe(
      "match"
    );
  });

  it("is unknown when no document is pinned or no source came back", () => {
    expect(checkDocumentFidelity(expectation({ expectedDocument: undefined }), [{ fileName: "x.pdf" }]).status).toBe(
      "unknown"
    );
    expect(checkDocumentFidelity(expectation(), []).status).toBe("unknown");
  });
});

describe("expected evidence", () => {
  const withEvidence = expectation({
    expectedEvidence: [{ fileNamePattern: "11830", pages: [2] }],
  });

  it("matches when the cited page is one the benchmark records", () => {
    expect(checkExpectedEvidence(withEvidence, [{ fileName: "Invoice 11830.pdf", pages: [2, 3] }]).status).toBe(
      "match"
    );
  });

  it("flags a citation to the right file but the wrong page", () => {
    const result = checkExpectedEvidence(withEvidence, [{ fileName: "Invoice 11830.pdf", pages: [7] }]);
    expect(result.status).toBe("mismatch");
    expect(result.detail).toContain("expected p.2");
  });

  it("does not judge citations the benchmark says nothing about", () => {
    expect(checkExpectedEvidence(expectation(), [{ fileName: "Invoice 11830.pdf", pages: [2] }]).status).toBe(
      "unknown"
    );
  });
});

describe("refusal detection on the rendered answer", () => {
  it("treats a whole-answer 'not specified' as a refusal", () => {
    const content = [
      "## Answer",
      "- The available information does not specify the insurance, bonding, or payment terms.",
    ].join("\n");
    expect(detectRefusal(content).isRefusal).toBe(true);
  });

  it("treats the source-mismatch notice as a refusal", () => {
    const content = [
      "## Requested document not confirmed",
      "Requested BUR-001R00 but no retrieved source carries that identifier.",
      "",
      "Evidence: mljtc2 aecom atc 1 burnside avenue drawings (p. 3).",
    ].join("\n");
    expect(detectRefusal(content).isRefusal).toBe(true);
  });

  it("does not treat a partly answered question as a refusal", () => {
    const content = [
      "### Action Items for GEN-042R00",
      "",
      "*   **Ahern** is to send a draft agreement for shielding access. [[1]](#citation:abc:4)",
      "",
      "The next coordination meeting schedule is not specified in the provided evidence.",
      "",
      "### Sources",
      "",
      "[1] **gen-042r00** — p. 4 — [View source](#citation:abc:4)",
    ].join("\n");
    const result = detectRefusal(content);
    expect(result.isRefusal).toBe(false);
    expect(result.substantiveLines).toHaveLength(1);
  });

  it("treats an answer with no body at all as a refusal", () => {
    expect(detectRefusal("## Answer\n\n### Sources\n").isRefusal).toBe(true);
  });
});

describe("grade aggregation", () => {
  it("passes only when every essential field is correct and nothing is materially wrong", () => {
    expect(aggregateGrade([field({}), field({ field: "b" })], [])).toBe("PASS");
    expect(aggregateGrade([field({}), field({ field: "b" })], ["invented a payment term"])).toBe("PARTIAL");
  });

  it("returns PARTIAL when some essential fields are answered and the rest are missing", () => {
    expect(aggregateGrade([field({}), field({ field: "b", result: "missing" })], [])).toBe("PARTIAL");
  });

  it("returns FAIL when no essential field is correct", () => {
    expect(aggregateGrade([field({ result: "missing" }), field({ field: "b", result: "incorrect" })], [])).toBe(
      "FAIL"
    );
  });

  it("weighs wrong facts against right ones", () => {
    // one right, one wrong — the core answer is compromised
    expect(aggregateGrade([field({}), field({ field: "b", result: "incorrect" })], [])).toBe("FAIL");
    // two right, one wrong — a minor error on top of a usable answer
    expect(
      aggregateGrade([field({}), field({ field: "b" }), field({ field: "c", result: "incorrect" })], [])
    ).toBe("PARTIAL");
  });

  it("ignores non-essential fields when essential ones exist", () => {
    expect(aggregateGrade([field({}), field({ field: "cosmetic", essential: false, result: "missing" })], [])).toBe(
      "PASS"
    );
  });

  it("has nothing to aggregate when no fields were graded", () => {
    expect(aggregateGrade([], [])).toBeNull();
  });
});

describe("field alignment", () => {
  it("keeps the benchmark's field set and marks unreported facts missing", () => {
    const aligned = alignFieldResults(expectation(), [
      { field: "Unit Price", result: "correct", reason: "$350.00 per visit" },
    ]);
    expect(aligned).toHaveLength(2);
    expect(aligned[0]).toMatchObject({ field: "unit_price", result: "correct", essential: true });
    expect(aligned[1]).toMatchObject({ field: "total_amount", result: "missing", essential: true });
  });

  it("keeps extra fields the grader raised as non-essential", () => {
    const aligned = alignFieldResults(expectation(), [
      { field: "unit_price", result: "correct", reason: "" },
      { field: "total_amount", result: "correct", reason: "" },
      { field: "payment_terms", result: "unsupported", reason: "not in the cited evidence" },
    ]);
    expect(aligned).toHaveLength(3);
    expect(aligned[2]).toMatchObject({ field: "payment_terms", essential: false });
  });
});

describe("deterministic rules", () => {
  const rules = (input: Parameters<typeof applyDeterministicRules>[0]) => applyDeterministicRules(input);

  it("grades a correct refusal PASS when the benchmark says the fact is absent", () => {
    const outcome = rules({
      expectation: expectation({
        expected: { answerAvailable: false, requiredFacts: [], forbiddenClaims: [], notes: "" },
      }),
      candidateAnswer: "## Answer\n- The available information does not specify the payment terms.",
      fidelity: null,
      trace: trace({ productionStatus: "not_found" }),
    });
    expect(outcome?.grade).toBe("PASS");
    expect(outcome?.categories).toEqual([]);
  });

  it("fails a refusal when the benchmark says the fact is present", () => {
    const outcome = rules({
      expectation: expectation(),
      candidateAnswer: "## Answer\n- The available information does not specify the unit price.",
      fidelity: null,
      trace: trace({ productionStatus: "not_found", sourceCount: 1 }),
    });
    expect(outcome?.grade).toBe("FAIL");
    expect(outcome?.categories).toContain("FALSE_NOT_FOUND");
  });

  it("adds a visual cause when a visual question was refused without page evidence", () => {
    const outcome = rules({
      expectation: expectation({ visualEvidenceExpected: true }),
      candidateAnswer: "## Answer\n- The cab dimensions could not be verified.",
      fidelity: null,
      trace: trace({ productionStatus: "not_found", visualEvidenceFound: false }),
    });
    expect(outcome?.categories).toContain("VISUAL_EVIDENCE_MISSED");
  });

  it("fails an answer that asserts a fact the benchmark says is absent", () => {
    const outcome = rules({
      expectation: expectation({
        expected: { answerAvailable: false, requiredFacts: [], forbiddenClaims: [], notes: "" },
      }),
      candidateAnswer: "The unit price is $350 per visit.",
      fidelity: null,
      trace: trace(),
    });
    expect(outcome?.grade).toBe("FAIL");
    expect(outcome?.categories).toContain("UNSUPPORTED_INFERENCE");
  });

  it("fails a confident answer built on the wrong document", () => {
    const fidelity = checkDocumentFidelity(expectation({ expectedDocument: { identifier: "RFI-096" } }), [
      { fileName: "A37806_RFI-0042.pdf" },
    ]);
    const outcome = rules({
      expectation: expectation(),
      candidateAnswer: "The design team directed the contractor to maintain the existing clearance.",
      fidelity,
      trace: trace({ productionStatus: "complete" }),
    });
    expect(outcome?.grade).toBe("FAIL");
    expect(outcome?.categories).toEqual(["WRONG_DOCUMENT"]);
  });

  it("fails an empty rendered answer regardless of what the pipeline reported", () => {
    const outcome = rules({
      expectation: expectation(),
      candidateAnswer: "   ",
      fidelity: null,
      trace: trace({ productionStatus: "complete" }),
    });
    expect(outcome?.grade).toBe("FAIL");
    expect(outcome?.categories).toEqual(["ANSWER_FORMAT_FAILURE"]);
  });

  it("leaves a substantive answer on the right document to the grader", () => {
    const fidelity = checkDocumentFidelity(expectation(), [{ fileName: "Invoice 11830.pdf" }]);
    expect(
      rules({
        expectation: expectation(),
        candidateAnswer: "The unit price is $350.00 per visit and the total due is $1,400.00.",
        fidelity,
        trace: trace(),
      })
    ).toBeNull();
  });

  it("marks a question with no reference facts UNGRADED instead of guessing", () => {
    const outcome = rules({
      expectation: expectation({
        groundTruth: "missing",
        expected: { answerAvailable: true, requiredFacts: [], forbiddenClaims: [], notes: "" },
      }),
      candidateAnswer: "The unit price is $350.00.",
      fidelity: null,
      trace: trace(),
    });
    expect(outcome?.grade).toBe("UNGRADED");
    expect(isGradable(undefined)).toBe(false);
  });

  it("fails a run that threw", () => {
    const outcome = rules({
      expectation: expectation(),
      candidateAnswer: "",
      runError: "Error: timeout",
      fidelity: null,
      trace: trace({ productionStatus: "error" }),
    });
    expect(outcome?.grade).toBe("FAIL");
    expect(outcome?.reason).toContain("timeout");
  });
});

describe("root-cause attribution", () => {
  it("assigns nothing to a PASS", () => {
    expect(
      assignCategories({
        grade: "PASS",
        fields: [field({})],
        materialErrors: [],
        citationGrade: "supported",
        fidelity: null,
        evidence: null,
        expectation: expectation(),
        trace: trace(),
      })
    ).toEqual([]);
  });

  it("separates a missing fact from a wrong one", () => {
    const categories = assignCategories({
      grade: "PARTIAL",
      fields: [field({}), field({ field: "b", result: "missing" })],
      materialErrors: [],
      citationGrade: "supported",
      fidelity: null,
      evidence: null,
      expectation: expectation(),
      trace: trace(),
    });
    expect(categories).toEqual(["MISSING_FACT"]);
  });

  it("blames the renderer when a deterministic answer fails", () => {
    const categories = assignCategories({
      grade: "FAIL",
      fields: [field({ result: "missing" })],
      materialErrors: [],
      citationGrade: "partially_supported",
      fidelity: null,
      evidence: null,
      expectation: expectation(),
      trace: trace({ productionStatus: "deterministic" }),
    });
    expect(categories).toContain("ANSWER_FORMAT_FAILURE");
    expect(categories).toContain("MISSING_FACT");
  });

  it("flags a citation that does not support the claim", () => {
    const categories = assignCategories({
      grade: "PARTIAL",
      fields: [field({}), field({ field: "b", result: "unsupported" })],
      materialErrors: [],
      citationGrade: "unsupported",
      fidelity: null,
      evidence: { status: "mismatch", detail: "wrong page" },
      expectation: expectation(),
      trace: trace(),
    });
    expect(categories).toContain("UNSUPPORTED_INFERENCE");
    expect(categories).toContain("CITATION_MISMATCH");
  });

  it("only trusts an expected-page mismatch when a human verified the page", () => {
    const args = {
      grade: "PARTIAL" as const,
      fields: [field({}), field({ field: "b", result: "missing" as const })],
      materialErrors: [],
      citationGrade: "partially_supported" as const,
      fidelity: null,
      evidence: { status: "mismatch" as const, detail: "wrong page" },
      trace: trace(),
    };
    expect(assignCategories({ ...args, expectation: expectation() })).toContain("CITATION_MISMATCH");
    expect(
      assignCategories({ ...args, expectation: expectation({ groundTruth: "draft" }) })
    ).not.toContain("CITATION_MISMATCH");
  });
});

describe("judge verdict parsing", () => {
  it("parses a fenced JSON verdict", () => {
    const verdict = parseJudgeVerdict(
      [
        "```json",
        JSON.stringify({
          grade: "partial",
          fieldResults: [{ field: "unit_price", result: "correct", reason: "$350" }],
          materialErrors: [],
          citationGrade: "supported",
          reason: "total is missing",
        }),
        "```",
      ].join("\n")
    );
    expect(verdict).toMatchObject({ grade: "PARTIAL", citationGrade: "supported" });
    expect(verdict?.fieldResults).toHaveLength(1);
  });

  it("rejects output with no usable grade", () => {
    expect(parseJudgeVerdict("I think the answer is fine.")).toBeNull();
    expect(parseJudgeVerdict(JSON.stringify({ grade: "good" }))).toBeNull();
  });

  it("falls back to safe values for unknown enum members", () => {
    const verdict = parseJudgeVerdict(
      JSON.stringify({
        grade: "FAIL",
        fieldResults: [{ field: "x", result: "sort-of", reason: "" }],
        citationGrade: "great",
      })
    );
    expect(verdict?.fieldResults[0].result).toBe("missing");
    expect(verdict?.citationGrade).toBe("unavailable");
  });
});

describe("judge prompt", () => {
  it("gives the grader the reference facts, the pinned document, and the rendered answer", () => {
    const message = buildJudgeUserMessage({
      query: "unit price and total?",
      candidateAnswer: "The unit price is $350.00.",
      sources: [{ fileName: "Invoice 11830.pdf", pages: [2] }],
      expectation: expectation(),
    });
    expect(message).toContain("EXPECTED FACTS:");
    expect(message).toContain('accepted values (any one is correct): "$350" | "$350.00"');
    expect(message).toContain("identifier: INV-11830");
    expect(message).toContain("Invoice 11830.pdf — pages 2");
    expect(message).toContain("grade exactly this");
  });

  it("does not leak the pipeline's own status to the grader", () => {
    const message = buildJudgeUserMessage({
      query: "unit price?",
      candidateAnswer: "The unit price is $350.00.",
      sources: [],
      expectation: expectation(),
    });
    for (const status of ["complete", "partial", "not_found", "source_mismatch", "deterministic"]) {
      expect(message).not.toContain(status);
    }
  });
});

describe("gradeQuestion", () => {
  const judge = (verdict: unknown) => async () => JSON.stringify(verdict);

  it("keeps the production status separate from the grade it returns", async () => {
    const record = await gradeQuestion(
      {
        id: "sq27",
        query: "unit price and total?",
        candidateAnswer: "The unit price is $99.00 and the total is $1,400.00.",
        sources: [{ fileName: "Invoice 11830.pdf", pages: [2] }],
        expectation: expectation(),
        trace: trace({ productionStatus: "complete" }),
      },
      judge({
        grade: "PARTIAL",
        fieldResults: [
          { field: "unit_price", result: "incorrect", reason: "document says $350.00" },
          { field: "total_amount", result: "correct", reason: "$1,400.00" },
        ],
        materialErrors: ["states a unit price of $99.00"],
        citationGrade: "partially_supported",
        reason: "unit price contradicts the invoice",
      })
    );

    // A `complete` production status still grades FAIL: one right, one wrong.
    expect(record.productionStatus).toBe("complete");
    expect(record.grade).toBe("FAIL");
    expect(record.judgeGrade).toBe("PARTIAL");
    expect(record.reason).toContain("rubric aggregation returned FAIL");
    expect(record.categories).toContain("WRONG_FACT");
  });

  it("does not call the grader when a deterministic rule already settles the case", async () => {
    let called = false;
    const record = await gradeQuestion(
      {
        id: "sq27",
        query: "unit price?",
        candidateAnswer: "The unit price is $350.00 per visit.",
        sources: [{ fileName: "A37806_RFI-0042.pdf" }],
        expectation: expectation({ expectedDocument: { identifier: "RFI-096" } }),
        trace: trace({ productionStatus: "complete" }),
      },
      async () => {
        called = true;
        return null;
      }
    );
    expect(called).toBe(false);
    expect(record.grade).toBe("FAIL");
    expect(record.gradeSource).toBe("deterministic");
    expect(record.categories).toEqual(["WRONG_DOCUMENT"]);
  });

  it("reports UNGRADED rather than a verdict when the grader is unavailable", async () => {
    const record = await gradeQuestion(
      {
        id: "sq27",
        query: "unit price?",
        candidateAnswer: "The unit price is $350.00 per visit and the total is $1,400.00.",
        sources: [{ fileName: "Invoice 11830.pdf" }],
        expectation: expectation(),
        trace: trace(),
      },
      async () => null
    );
    expect(record.grade).toBe("UNGRADED");
    expect(record.gradeSource).toBe("ungraded");
    expect(record.reason).toContain("unavailable");
  });

  it("marks citations unavailable when the answer cited nothing, whatever the grader said", async () => {
    const record = await gradeQuestion(
      {
        id: "sq27",
        query: "unit price and total?",
        candidateAnswer: "The unit price is $350.00 and the total is $1,400.00.",
        sources: [],
        expectation: expectation(),
        trace: trace({ sourceCount: 0 }),
      },
      judge({
        grade: "PASS",
        fieldResults: [
          { field: "unit_price", result: "correct", reason: "" },
          { field: "total_amount", result: "correct", reason: "" },
        ],
        materialErrors: [],
        citationGrade: "supported",
        reason: "both facts correct",
      })
    );
    expect(record.grade).toBe("PASS");
    expect(record.citationGrade).toBe("unavailable");
  });
});
