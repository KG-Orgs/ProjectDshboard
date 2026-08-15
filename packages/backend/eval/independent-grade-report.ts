/**
 * Reporting for the independent grader: totals, the production-status ×
 * independent-grade matrix, the failure root-cause roll-up, and run-to-run
 * comparison by grade.
 *
 * Pure functions over `GradeRecord[]` so the same code serves the standalone
 * grading report, the traced Q&A report, and the comparison script.
 */
import {
  ERROR_CATEGORIES,
  ERROR_CATEGORY_LABELS,
  type ErrorCategory,
  type GradeRecord,
  type IndependentGrade,
} from "./independent-grader";

/** Production statuses, in the order the matrix presents them. */
export const PRODUCTION_STATUSES = [
  "complete",
  "partial",
  "deterministic",
  "not_found",
  "source_mismatch",
  "error",
] as const;

export const GRADE_ICON: Record<IndependentGrade, string> = {
  PASS: "🟢 PASS",
  PARTIAL: "🟡 PARTIAL",
  FAIL: "🔴 FAIL",
  UNGRADED: "⚪ UNGRADED",
};

export interface GradeSummary {
  total: number;
  /** Questions with a real grade — the denominator for the headline rates. */
  graded: number;
  ungraded: number;
  counts: Record<IndependentGrade, number>;
  /** production status → grade → count */
  crossTab: Map<string, Record<IndependentGrade, number>>;
  /** category → count, over PARTIAL and FAIL rows. */
  categories: Map<ErrorCategory, number>;
  /** Ground-truth provenance of the graded rows. */
  groundTruth: { verified: number; draft: number; other: number };
  /** Rows where the rubric and the judge disagreed, for auditing. */
  judgeDisagreements: number;
}

function emptyCounts(): Record<IndependentGrade, number> {
  return { PASS: 0, PARTIAL: 0, FAIL: 0, UNGRADED: 0 };
}

export function summarizeGrades(records: GradeRecord[]): GradeSummary {
  const counts = emptyCounts();
  const crossTab = new Map<string, Record<IndependentGrade, number>>();
  const categories = new Map<ErrorCategory, number>();
  const groundTruth = { verified: 0, draft: 0, other: 0 };
  let judgeDisagreements = 0;

  for (const record of records) {
    counts[record.grade] += 1;

    const status = record.productionStatus || "unknown";
    if (!crossTab.has(status)) crossTab.set(status, emptyCounts());
    crossTab.get(status)![record.grade] += 1;

    for (const category of record.categories) {
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }

    if (record.grade !== "UNGRADED") {
      if (record.groundTruth === "verified") groundTruth.verified += 1;
      else if (record.groundTruth === "draft") groundTruth.draft += 1;
      else groundTruth.other += 1;
    }

    if (record.judgeGrade && record.judgeGrade !== record.grade) judgeDisagreements += 1;
  }

  const ungraded = counts.UNGRADED;
  return {
    total: records.length,
    graded: records.length - ungraded,
    ungraded,
    counts,
    crossTab,
    categories,
    groundTruth,
    judgeDisagreements,
  };
}

function rate(count: number, denominator: number): string {
  if (denominator <= 0) return "n/a";
  return `${((100 * count) / denominator).toFixed(1)}%`;
}

/** Headline PASS / PARTIAL / FAIL table. */
export function renderGradeTotals(summary: GradeSummary): string {
  const d = summary.graded;
  let md = `### Independent Quality Grade\n\n`;
  md += "```text\n";
  md += `PASS       ${String(summary.counts.PASS).padStart(2)}/${d}   ${rate(summary.counts.PASS, d).padStart(6)}\n`;
  md += `PARTIAL    ${String(summary.counts.PARTIAL).padStart(2)}/${d}   ${rate(summary.counts.PARTIAL, d).padStart(6)}\n`;
  md += `FAIL       ${String(summary.counts.FAIL).padStart(2)}/${d}   ${rate(summary.counts.FAIL, d).padStart(6)}\n`;
  md += "```\n\n";
  md += `Denominator is the ${d} question${d === 1 ? "" : "s"} that have benchmark reference facts. `;
  md += `${summary.ungraded} of ${summary.total} question${summary.total === 1 ? " is" : "s are"} **UNGRADED** — no reference facts recorded yet, or the grader was unavailable. `;
  md += `Graded rows by ground truth: ${summary.groundTruth.verified} human-verified · ${summary.groundTruth.draft} machine-drafted · ${summary.groundTruth.other} other.\n\n`;
  if (summary.judgeDisagreements > 0) {
    md += `> On ${summary.judgeDisagreements} question${summary.judgeDisagreements === 1 ? "" : "s"} the fixed rubric aggregated the per-field results to a different grade than the grader's own overall label. The rubric wins; each case notes the disagreement.\n\n`;
  }
  return md;
}

/**
 * Production status × independent grade. The interesting cells are
 * `complete → FAIL` (false confidence) and `not_found → PASS` (correct
 * conservative refusal).
 */
export function renderCrossTab(summary: GradeSummary): string {
  const statuses = [
    ...PRODUCTION_STATUSES.filter((s) => summary.crossTab.has(s)),
    ...[...summary.crossTab.keys()].filter(
      (s) => !(PRODUCTION_STATUSES as readonly string[]).includes(s)
    ),
  ];

  let md = `### Production status × independent grade\n\n`;
  md += `| Production status | PASS | PARTIAL | FAIL | UNGRADED | Total |\n`;
  md += `|---|---:|---:|---:|---:|---:|\n`;
  for (const status of statuses) {
    const row = summary.crossTab.get(status)!;
    const total = row.PASS + row.PARTIAL + row.FAIL + row.UNGRADED;
    md += `| ${status} | ${row.PASS} | ${row.PARTIAL} | ${row.FAIL} | ${row.UNGRADED} | ${total} |\n`;
  }
  md += `| **all** | ${summary.counts.PASS} | ${summary.counts.PARTIAL} | ${summary.counts.FAIL} | ${summary.counts.UNGRADED} | ${summary.total} |\n\n`;

  const falseConfidence = summary.crossTab.get("complete")?.FAIL ?? 0;
  const goodRefusals = summary.crossTab.get("not_found")?.PASS ?? 0;
  const notes: string[] = [];
  if (falseConfidence > 0) {
    notes.push(
      `**${falseConfidence} \`complete\` → FAIL** — the pipeline reported the question fully answered and the answer is wrong. This is false confidence, the most expensive failure mode here.`
    );
  }
  if (goodRefusals > 0) {
    notes.push(
      `**${goodRefusals} \`not_found\` → PASS** — the pipeline declined and the benchmark agrees the fact is absent. Correct conservative behaviour, not a regression.`
    );
  }
  const falseNotFound = summary.crossTab.get("not_found")?.FAIL ?? 0;
  if (falseNotFound > 0) {
    notes.push(
      `**${falseNotFound} \`not_found\` → FAIL** — the pipeline declined but the benchmark says the fact is in the corpus. These are retrieval or synthesis regressions, not safety.`
    );
  }
  if (notes.length > 0) md += `${notes.map((n) => `- ${n}`).join("\n")}\n\n`;
  return md;
}

/** Failure root-cause roll-up over PARTIAL and FAIL rows. */
export function renderRootCauses(summary: GradeSummary, records: GradeRecord[]): string {
  const ordered = ERROR_CATEGORIES.filter((category) => (summary.categories.get(category) ?? 0) > 0).sort(
    (a, b) => (summary.categories.get(b) ?? 0) - (summary.categories.get(a) ?? 0)
  );
  if (ordered.length === 0) return "";

  const width = Math.max(...ordered.map((c) => ERROR_CATEGORY_LABELS[c].length)) + 2;
  let md = `### Failures by root cause\n\n`;
  md += "```text\n";
  for (const category of ordered) {
    md += `${ERROR_CATEGORY_LABELS[category].padEnd(width)}${summary.categories.get(category)}\n`;
  }
  md += "```\n\n";
  md += `A question may carry more than one category, so the column does not sum to the FAIL count.\n\n`;

  md += `| Category | Questions |\n|---|---|\n`;
  for (const category of ordered) {
    const ids = records.filter((r) => r.categories.includes(category)).map((r) => `[${r.id}](#${r.id})`);
    md += `| ${ERROR_CATEGORY_LABELS[category]} | ${ids.join(", ")} |\n`;
  }
  return `${md}\n`;
}

/** Per-question grade block for the detailed report. */
export function renderGradeDetail(record: GradeRecord): string {
  let md = `**Independent grade:** ${GRADE_ICON[record.grade]}`;
  md += ` · production status \`${record.productionStatus}\``;
  md += ` · citations ${record.citationGrade}`;
  if (record.groundTruth !== "none") md += ` · ground truth \`${record.groundTruth}\``;
  md += `\n\n`;
  md += `- **Why:** ${record.reason || "_no reason recorded_"}\n`;
  md += `- **Decided by:** ${record.gradeSource === "judge" ? "independent grader + rubric aggregation" : record.gradeSource === "deterministic" ? "deterministic rule (no grader call needed)" : "not graded"}\n`;
  if (record.documentFidelity && record.documentFidelity.status !== "unknown") {
    md += `- **Document fidelity:** ${record.documentFidelity.status} — ${record.documentFidelity.detail}\n`;
  }
  if (record.evidenceCheck && record.evidenceCheck.status !== "unknown") {
    md += `- **Expected evidence:** ${record.evidenceCheck.status} — ${record.evidenceCheck.detail}\n`;
  }
  if (record.categories.length > 0) {
    md += `- **Root cause:** ${record.categories.map((c) => `\`${c}\``).join(", ")}\n`;
  }
  if (record.fieldResults.length > 0) {
    md += `\n| Requested field | Essential | Result | Grader's note |\n|---|---|---|---|\n`;
    for (const field of record.fieldResults) {
      const icon =
        field.result === "correct"
          ? "✅ correct"
          : field.result === "incorrect"
            ? "❌ incorrect"
            : field.result === "unsupported"
              ? "🚧 unsupported"
              : "➖ missing";
      md += `| ${field.label} | ${field.essential ? "yes" : "no"} | ${icon} | ${(field.reason || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ")} |\n`;
    }
    md += `\n`;
  }
  if (record.materialErrors.length > 0) {
    md += `**Material errors:**\n\n${record.materialErrors.map((e) => `- ${e}`).join("\n")}\n\n`;
  }
  return md;
}

// ---------------------------------------------------------------------------
// Run-to-run comparison
// ---------------------------------------------------------------------------

export type TransitionDirection = "improved" | "regressed" | "unchanged" | "uncomparable";

export interface GradeTransition {
  id: string;
  query: string;
  previousGrade: IndependentGrade;
  currentGrade: IndependentGrade;
  direction: TransitionDirection;
  label: string;
  previousAnswer: string;
  currentAnswer: string;
  previousReason: string;
  currentReason: string;
  categories: ErrorCategory[];
}

/** Ordering used to decide whether a move is an improvement. */
const GRADE_RANK: Record<IndependentGrade, number> = { FAIL: 0, PARTIAL: 1, PASS: 2, UNGRADED: -1 };

export function classifyTransition(
  previous: IndependentGrade,
  current: IndependentGrade
): TransitionDirection {
  if (previous === "UNGRADED" || current === "UNGRADED") return "uncomparable";
  if (GRADE_RANK[current] > GRADE_RANK[previous]) return "improved";
  if (GRADE_RANK[current] < GRADE_RANK[previous]) return "regressed";
  return "unchanged";
}

/**
 * Compare two grading runs on the independent grade rather than on
 * "answered vs refused". A question that moved from an answer to a refusal is
 * only a regression if the benchmark says the fact was there.
 */
export function compareGradeRuns(
  previous: GradeRecord[],
  current: GradeRecord[]
): { transitions: GradeTransition[]; onlyInPrevious: string[]; onlyInCurrent: string[] } {
  const prevById = new Map(previous.map((r) => [r.id, r]));
  const currById = new Map(current.map((r) => [r.id, r]));

  const transitions: GradeTransition[] = [];
  for (const record of current) {
    const before = prevById.get(record.id);
    if (!before) continue;
    transitions.push({
      id: record.id,
      query: record.query,
      previousGrade: before.grade,
      currentGrade: record.grade,
      direction: classifyTransition(before.grade, record.grade),
      label: `${before.grade} → ${record.grade}`,
      previousAnswer: before.gradedText,
      currentAnswer: record.gradedText,
      previousReason: before.reason,
      currentReason: record.reason,
      categories: record.categories,
    });
  }

  return {
    transitions,
    onlyInPrevious: previous.filter((r) => !currById.has(r.id)).map((r) => r.id),
    onlyInCurrent: current.filter((r) => !prevById.has(r.id)).map((r) => r.id),
  };
}

function truncate(text: string, max: number): string {
  const clean = (text ?? "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

export interface ExpectationLookup {
  (id: string): string | undefined;
}

/**
 * Render the comparison. Regressions get the full side-by-side (question,
 * previous answer, current answer, expected facts, both grades, likely cause)
 * because those are the ones somebody has to act on.
 */
export function renderComparison(
  comparison: ReturnType<typeof compareGradeRuns>,
  options: { previousLabel: string; currentLabel: string; expectedFactsFor?: ExpectationLookup }
): string {
  const byDirection = (direction: TransitionDirection) =>
    comparison.transitions.filter((t) => t.direction === direction);

  const improved = byDirection("improved");
  const regressed = byDirection("regressed");
  const unchanged = byDirection("unchanged");
  const uncomparable = byDirection("uncomparable");

  const tally = (transitions: GradeTransition[]) => {
    const counts = new Map<string, number>();
    for (const t of transitions) counts.set(t.label, (counts.get(t.label) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  let md = `## Independent-grade change vs the previous run\n\n`;
  md += `Previous: \`${options.previousLabel}\` · Current: \`${options.currentLabel}\` · ${comparison.transitions.length} question${comparison.transitions.length === 1 ? "" : "s"} in both runs.\n\n`;
  md += `Comparison is on the independent grade, not on "answered vs refused": a question that moved from an answer to a refusal only counts as a regression when the benchmark says the fact is present.\n\n`;

  md += "```text\n";
  md += `Improved:\n${improved.length > 0 ? tally(improved).map(([label, count]) => `  ${label.padEnd(22)}${count}`).join("\n") : "  (none)"}\n\n`;
  md += `Regressed:\n${regressed.length > 0 ? tally(regressed).map(([label, count]) => `  ${label.padEnd(22)}${count}`).join("\n") : "  (none)"}\n\n`;
  md += `Unchanged:\n${unchanged.length > 0 ? tally(unchanged).map(([label, count]) => `  ${label.padEnd(22)}${count}`).join("\n") : "  (none)"}\n`;
  if (uncomparable.length > 0) {
    md += `\nNot comparable (ungraded on one side):\n${tally(uncomparable).map(([label, count]) => `  ${label.padEnd(22)}${count}`).join("\n")}\n`;
  }
  md += "```\n\n";

  if (comparison.onlyInCurrent.length > 0 || comparison.onlyInPrevious.length > 0) {
    md += `Only in the current run: ${comparison.onlyInCurrent.join(", ") || "none"} · only in the previous run: ${comparison.onlyInPrevious.join(", ") || "none"}\n\n`;
  }

  if (regressed.length > 0) {
    md += `### Regressions (${regressed.length})\n\n`;
    for (const t of regressed) {
      md += `#### ${t.id} — ${t.label}\n\n`;
      md += `**Question:** ${t.query}\n\n`;
      const expected = options.expectedFactsFor?.(t.id);
      if (expected) md += `**Expected facts:**\n\n\`\`\`text\n${expected}\n\`\`\`\n\n`;
      md += `**Previous grade:** ${GRADE_ICON[t.previousGrade]} — ${t.previousReason || "_no reason recorded_"}\n\n`;
      md += `**Current grade:** ${GRADE_ICON[t.currentGrade]} — ${t.currentReason || "_no reason recorded_"}\n\n`;
      md += `**Likely failure category:** ${t.categories.length > 0 ? t.categories.map((c) => `\`${c}\``).join(", ") : "_none assigned_"}\n\n`;
      md += `<details><summary>Previous answer</summary>\n\n\`\`\`text\n${truncate(t.previousAnswer, 1500)}\n\`\`\`\n\n</details>\n\n`;
      md += `<details><summary>Current answer</summary>\n\n\`\`\`text\n${truncate(t.currentAnswer, 1500)}\n\`\`\`\n\n</details>\n\n`;
      md += `---\n\n`;
    }
  }

  if (improved.length > 0) {
    md += `### Improvements (${improved.length})\n\n`;
    for (const t of improved) {
      md += `- **${t.id}** ${t.label} — ${t.currentReason || t.query}\n`;
    }
    md += `\n`;
  }

  return md;
}
