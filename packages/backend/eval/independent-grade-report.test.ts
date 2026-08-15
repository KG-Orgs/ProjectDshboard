import { describe, expect, it } from "vitest";
import type { GradeRecord, IndependentGrade } from "./independent-grader";
import {
  classifyTransition,
  compareGradeRuns,
  renderComparison,
  renderCrossTab,
  renderGradeTotals,
  renderRootCauses,
  summarizeGrades,
} from "./independent-grade-report";

function record(overrides: Partial<GradeRecord> & { id: string }): GradeRecord {
  return {
    query: `question ${overrides.id}`,
    productionStatus: "complete",
    grade: "PASS",
    judgeGrade: null,
    gradeSource: "judge",
    fieldResults: [],
    materialErrors: [],
    citationGrade: "supported",
    categories: [],
    documentFidelity: null,
    evidenceCheck: null,
    reason: "",
    groundTruth: "verified",
    gradedText: `answer ${overrides.id}`,
    ...overrides,
  };
}

const RUN: GradeRecord[] = [
  record({ id: "sq01", grade: "PASS", productionStatus: "complete" }),
  record({
    id: "sq02",
    grade: "FAIL",
    productionStatus: "complete",
    categories: ["WRONG_DOCUMENT"],
    groundTruth: "draft",
  }),
  record({ id: "sq03", grade: "PASS", productionStatus: "not_found" }),
  record({ id: "sq04", grade: "FAIL", productionStatus: "not_found", categories: ["FALSE_NOT_FOUND", "RETRIEVAL_FAILURE"] }),
  record({ id: "sq05", grade: "PARTIAL", productionStatus: "partial", categories: ["MISSING_FACT"] }),
  record({ id: "sq06", grade: "FAIL", productionStatus: "deterministic", categories: ["ANSWER_FORMAT_FAILURE", "WRONG_DOCUMENT"] }),
  record({ id: "sq07", grade: "UNGRADED", productionStatus: "complete", groundTruth: "missing" }),
];

describe("summarizeGrades", () => {
  const summary = summarizeGrades(RUN);

  it("excludes ungraded questions from the graded denominator", () => {
    expect(summary.total).toBe(7);
    expect(summary.graded).toBe(6);
    expect(summary.counts).toMatchObject({ PASS: 2, PARTIAL: 1, FAIL: 3, UNGRADED: 1 });
  });

  it("cross-tabulates the production status against the independent grade", () => {
    expect(summary.crossTab.get("complete")).toMatchObject({ PASS: 1, FAIL: 1, UNGRADED: 1 });
    expect(summary.crossTab.get("not_found")).toMatchObject({ PASS: 1, FAIL: 1 });
  });

  it("counts every root cause a failure carries", () => {
    expect(summary.categories.get("WRONG_DOCUMENT")).toBe(2);
    expect(summary.categories.get("FALSE_NOT_FOUND")).toBe(1);
  });

  it("separates human-verified ground truth from machine drafts", () => {
    expect(summary.groundTruth).toMatchObject({ verified: 5, draft: 1 });
  });

  it("counts rubric/grader disagreements", () => {
    const disputed = summarizeGrades([record({ id: "sq08", grade: "FAIL", judgeGrade: "PARTIAL" })]);
    expect(disputed.judgeDisagreements).toBe(1);
  });
});

describe("report rendering", () => {
  const summary = summarizeGrades(RUN);

  it("reports totals and percentages against the graded denominator", () => {
    const md = renderGradeTotals(summary);
    expect(md).toContain("PASS        2/6    33.3%");
    expect(md).toContain("FAIL        3/6    50.0%");
    expect(md).toContain("1 of 7 questions are **UNGRADED**");
  });

  it("calls out complete → FAIL and not_found → PASS in the matrix", () => {
    const md = renderCrossTab(summary);
    expect(md).toContain("| complete | 1 | 0 | 1 | 1 | 3 |");
    expect(md).toContain("`complete` → FAIL");
    expect(md).toContain("`not_found` → PASS");
    expect(md).toContain("`not_found` → FAIL");
  });

  it("ranks root causes and links the questions behind each one", () => {
    const md = renderRootCauses(summary, RUN);
    expect(md).toContain("Wrong document");
    expect(md).toContain("[sq02](#sq02), [sq06](#sq06)");
  });
});

describe("run comparison", () => {
  it("classifies moves by grade rather than by answered/refused", () => {
    expect(classifyTransition("FAIL", "PASS")).toBe("improved");
    expect(classifyTransition("PARTIAL", "PASS")).toBe("improved");
    // A confident wrong answer replaced by a correct refusal is an improvement.
    expect(classifyTransition("FAIL", "PARTIAL")).toBe("improved");
    expect(classifyTransition("PASS", "PARTIAL")).toBe("regressed");
    expect(classifyTransition("PASS", "FAIL")).toBe("regressed");
    expect(classifyTransition("PASS", "PASS")).toBe("unchanged");
    expect(classifyTransition("UNGRADED", "PASS")).toBe("uncomparable");
  });

  const previous: GradeRecord[] = [
    record({ id: "sq01", grade: "FAIL", gradedText: "old wrong answer", reason: "wrong document" }),
    record({ id: "sq02", grade: "PASS", gradedText: "old right answer", reason: "both facts correct" }),
    record({ id: "sq03", grade: "PASS" }),
    record({ id: "sq09", grade: "PASS" }),
  ];
  const current: GradeRecord[] = [
    record({ id: "sq01", grade: "PASS", gradedText: "new right answer", reason: "now correct" }),
    record({
      id: "sq02",
      grade: "FAIL",
      gradedText: "new wrong answer",
      reason: "fact now missing",
      categories: ["MISSING_FACT"],
    }),
    record({ id: "sq03", grade: "PASS" }),
    record({ id: "sq10", grade: "PASS" }),
  ];

  it("pairs questions present in both runs and reports the strays", () => {
    const comparison = compareGradeRuns(previous, current);
    expect(comparison.transitions.map((t) => t.label)).toEqual([
      "FAIL → PASS",
      "PASS → FAIL",
      "PASS → PASS",
    ]);
    expect(comparison.onlyInPrevious).toEqual(["sq09"]);
    expect(comparison.onlyInCurrent).toEqual(["sq10"]);
  });

  it("shows both answers, both grades, and the likely cause for each regression", () => {
    const md = renderComparison(compareGradeRuns(previous, current), {
      previousLabel: "prev.jsonl",
      currentLabel: "curr.jsonl",
      expectedFactsFor: (id) => (id === "sq02" ? "- field: total_amount" : undefined),
    });
    expect(md).toContain("Improved:\n  FAIL → PASS");
    expect(md).toContain("Regressed:\n  PASS → FAIL");
    expect(md).toContain("### Regressions (1)");
    expect(md).toContain("- field: total_amount");
    expect(md).toContain("old right answer");
    expect(md).toContain("new wrong answer");
    expect(md).toContain("`MISSING_FACT`");
  });

  it("does not count an ungraded side as a regression", () => {
    const md = renderComparison(
      compareGradeRuns([record({ id: "sq01", grade: "PASS" })], [record({ id: "sq01", grade: "UNGRADED" })]),
      { previousLabel: "a", currentLabel: "b" }
    );
    expect(md).toContain("Regressed:\n  (none)");
    expect(md).toContain("Not comparable");
  });
});

describe("grade separation invariant", () => {
  it("allows every combination of production status and independent grade", () => {
    const statuses = ["complete", "partial", "not_found", "source_mismatch", "deterministic"];
    const grades: IndependentGrade[] = ["PASS", "PARTIAL", "FAIL"];
    const all = statuses.flatMap((productionStatus, i) =>
      grades.map((grade, j) => record({ id: `q${i}${j}`, productionStatus, grade }))
    );
    const summary = summarizeGrades(all);
    for (const status of statuses) {
      expect(summary.crossTab.get(status)).toMatchObject({ PASS: 1, PARTIAL: 1, FAIL: 1 });
    }
  });
});
