/**
 * Compare two independent-grading runs and report true improvements and
 * regressions.
 *
 * Comparison is on the independent PASS/PARTIAL/FAIL grade rather than on
 * "answered vs refused", so a question that moved from an answer to a refusal
 * only counts as a regression when the benchmark says the fact is present — and
 * a question that moved from a confident wrong answer to a refusal counts as an
 * improvement.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/compare-independent-grades.ts <previous.jsonl> <current.jsonl> [out.md]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatExpectedFacts, type GradeRecord } from "./independent-grader";
import { compareGradeRuns, renderComparison, summarizeGrades } from "./independent-grade-report";
import { loadExpectations } from "./eval-expectations";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");

function resolvePath(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(backendRoot, value));
}

function readGrades(filePath: string): GradeRecord[] {
  const records: GradeRecord[] = [];
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    records.push(JSON.parse(line) as GradeRecord);
  }
  return records;
}

const [previousArg, currentArg, outArg, expectedArg] = process.argv.slice(2);
if (!previousArg || !currentArg) {
  console.error(
    "Usage: pnpm tsx ./eval/compare-independent-grades.ts <previous.jsonl> <current.jsonl> [out.md] [expected.json]"
  );
  process.exit(1);
}

const previousPath = resolvePath(previousArg);
const currentPath = resolvePath(currentArg);
const outPath = resolvePath(outArg ?? "./eval/mlj017-97-grade-comparison.md");
const expectedPath = resolvePath(expectedArg ?? "./eval/mlj017-97-expected.json");

const previous = readGrades(previousPath);
const current = readGrades(currentPath);
const expectations = fs.existsSync(expectedPath) ? loadExpectations(expectedPath) : new Map();

const comparison = compareGradeRuns(previous, current);
const previousSummary = summarizeGrades(previous);
const currentSummary = summarizeGrades(current);

let md = `# Independent-grade comparison\n\n`;
md += `| | Previous (\`${path.basename(previousPath)}\`) | Current (\`${path.basename(currentPath)}\`) |\n`;
md += `|---|---:|---:|\n`;
md += `| PASS | ${previousSummary.counts.PASS} | ${currentSummary.counts.PASS} |\n`;
md += `| PARTIAL | ${previousSummary.counts.PARTIAL} | ${currentSummary.counts.PARTIAL} |\n`;
md += `| FAIL | ${previousSummary.counts.FAIL} | ${currentSummary.counts.FAIL} |\n`;
md += `| UNGRADED | ${previousSummary.counts.UNGRADED} | ${currentSummary.counts.UNGRADED} |\n`;
md += `| Graded total | ${previousSummary.graded} | ${currentSummary.graded} |\n\n`;

md += renderComparison(comparison, {
  previousLabel: path.basename(previousPath),
  currentLabel: path.basename(currentPath),
  expectedFactsFor: (id) => {
    const expectation = expectations.get(id);
    return expectation ? formatExpectedFacts(expectation) : undefined;
  },
});

fs.writeFileSync(outPath, md, "utf8");

const counts = { improved: 0, regressed: 0, unchanged: 0, uncomparable: 0 };
for (const transition of comparison.transitions) counts[transition.direction] += 1;
console.log(
  `[compare] improved ${counts.improved} · regressed ${counts.regressed} · unchanged ${counts.unchanged} · not comparable ${counts.uncomparable}`
);
console.log(`[compare] report: ${outPath}`);
