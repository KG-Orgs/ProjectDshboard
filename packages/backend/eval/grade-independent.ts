/**
 * Run the independent PASS / PARTIAL / FAIL grader over a traced eval run.
 *
 * Reads the JSONL produced by `run-97-traced.ts` plus a benchmark expectations
 * file, grades the *final rendered answer* of every question, and writes one
 * grade record per question as JSONL plus a standalone markdown report.
 *
 * The production pipeline is not touched: this reads a finished run's output.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/grade-independent.ts
 *   pnpm tsx ./eval/grade-independent.ts --run ./eval/mlj017-97-traced-run.jsonl \
 *     --expected ./eval/mlj017-97-expected.json --out ./eval/mlj017-97-grades.jsonl
 *   pnpm tsx ./eval/grade-independent.ts --ids sq26,sq27 --concurrency 2
 *   pnpm tsx ./eval/grade-independent.ts --resume       # skip ids already graded
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadExpectations, type QuestionExpectation } from "./eval-expectations";
import {
  formatExpectedFacts,
  gradeQuestion,
  type GradeRecord,
  type TraceSignals,
} from "./independent-grader";
import {
  GRADE_ICON,
  renderCrossTab,
  renderGradeDetail,
  renderGradeTotals,
  renderRootCauses,
  summarizeGrades,
} from "./independent-grade-report";

config({ path: "../../.env" });

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");

interface LogEvent {
  event: string;
  level: string;
  meta: Record<string, unknown>;
}

interface RunRow {
  kind: "result";
  id: string;
  query: string;
  error?: string;
  content?: string;
  answer?: {
    status?: string;
    citations?: Array<{ fileName?: string; documentName?: string; page?: number }>;
    visualFallback?: { evidence?: unknown[] };
  } | null;
  sources?: Array<{ fileName?: string; pages?: number[] }>;
  citations?: Array<{ fileName?: string; page?: number | null }>;
  events?: LogEvent[];
}

function resolvePath(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(backendRoot, value));
}

function parseArgs(argv: string[]) {
  let runPath = "./eval/mlj017-97-traced-run.jsonl";
  let expectedPath = "./eval/mlj017-97-expected.json";
  let outPath = "./eval/mlj017-97-grades.jsonl";
  let reportPath = "./eval/mlj017-97-independent-grade-report.md";
  let ids: Set<string> | undefined;
  let concurrency = 4;
  let resume = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--run" && next) (runPath = next), (i += 1);
    else if (arg === "--expected" && next) (expectedPath = next), (i += 1);
    else if (arg === "--out" && next) (outPath = next), (i += 1);
    else if (arg === "--report" && next) (reportPath = next), (i += 1);
    else if (arg === "--ids" && next) {
      ids = new Set(next.split(",").map((v) => v.trim()).filter(Boolean));
      i += 1;
    } else if (arg === "--concurrency" && next) {
      concurrency = Math.max(1, Number.parseInt(next, 10) || 1);
      i += 1;
    } else if (arg === "--resume") resume = true;
  }

  return {
    runPath: resolvePath(runPath),
    expectedPath: resolvePath(expectedPath),
    outPath: resolvePath(outPath),
    reportPath: resolvePath(reportPath),
    ids,
    concurrency,
    resume,
  };
}

/** Production status, read straight off the run record. Not a grade. */
function productionStatusOf(row: RunRow): string {
  if (row.error) return "error";
  return row.answer?.status ?? "deterministic";
}

/**
 * The sources the answer stands on. `sources` is what the UI shows; the
 * extractor's own citations are folded in because they carry per-page detail the
 * source list flattens.
 */
function candidateSources(row: RunRow) {
  const byFile = new Map<string, { fileName: string; pages: number[] }>();
  const add = (fileName: string | undefined, pages: Array<number | null | undefined>) => {
    if (!fileName) return;
    const entry = byFile.get(fileName) ?? { fileName, pages: [] };
    for (const page of pages) {
      if (typeof page === "number" && !entry.pages.includes(page)) entry.pages.push(page);
    }
    byFile.set(fileName, entry);
  };

  for (const source of row.sources ?? []) add(source.fileName, source.pages ?? []);
  for (const citation of row.citations ?? []) add(citation.fileName, [citation.page]);
  for (const citation of row.answer?.citations ?? []) {
    add(citation.fileName ?? citation.documentName, [citation.page]);
  }

  return [...byFile.values()].map((entry) => ({
    fileName: entry.fileName,
    pages: entry.pages.sort((a, b) => a - b),
  }));
}

/** Cause-attribution signals only — never inputs to the grade itself. */
function traceSignals(row: RunRow): TraceSignals {
  const events = row.events ?? [];
  const has = (event: string) => events.some((e) => e.event === event);
  const assessed = events.find((e) => e.event === "visual_fallback.assessed");
  return {
    productionStatus: productionStatusOf(row),
    sourceCount: row.sources?.length ?? 0,
    visualLikely: assessed?.meta.visualLikely === true,
    visualTriggered: has("visual_fallback.triggered") || has("visual_fallback.pages_selected"),
    visualEvidenceFound: (row.answer?.visualFallback?.evidence?.length ?? 0) > 0,
    guardBlocked: has("chat.source_identity_guard.retry_retrieval"),
    extractorFellBack:
      has("chat.coordinator.extractor_no_json") || has("chat.coordinator.extractor_parse_error"),
  };
}

/** Run `worker` over `items` with a bounded number in flight. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function buildReport(
  records: GradeRecord[],
  expectations: Map<string, QuestionExpectation>,
  meta: { runFile: string; expectedFile: string }
): string {
  const summary = summarizeGrades(records);

  let md = `# Independent Answer Grading — ${records.length} questions\n\n`;
  md += `**Run under test:** \`eval/${meta.runFile}\`\n`;
  md += `**Benchmark:** \`eval/${meta.expectedFile}\`\n\n`;
  md += `This grade is produced outside the answer pipeline. It measures whether the final\n`;
  md += `user-visible answer is actually correct against benchmark reference facts, and is kept\n`;
  md += `strictly separate from the pipeline's own status (\`complete\`, \`partial\`, \`not_found\`,\n`;
  md += `\`source_mismatch\`, \`deterministic\`), which describes pipeline behaviour rather than\n`;
  md += `correctness. A \`complete\` answer can grade FAIL; a \`not_found\` answer can grade PASS.\n\n`;
  md += `## Summary\n\n`;
  md += renderGradeTotals(summary);
  md += renderCrossTab(summary);
  md += renderRootCauses(summary, records);
  md += `---\n\n## Per-question grades\n\n`;

  for (const record of records) {
    md += `<a id="${record.id}"></a>\n\n### ${record.id} — ${GRADE_ICON[record.grade]}\n\n`;
    md += `**Q:** ${record.query}\n\n`;
    const expectation = expectations.get(record.id);
    if (expectation) {
      md += `<details><summary>Expected facts (${expectation.groundTruth}${expectation.provenance ? `, ${expectation.provenance}` : ""})</summary>\n\n\`\`\`text\n${formatExpectedFacts(expectation)}\n\`\`\`\n\n</details>\n\n`;
    }
    md += renderGradeDetail(record);
    md += `<details><summary>Graded answer text</summary>\n\n\`\`\`text\n${record.gradedText || "(empty)"}\n\`\`\`\n\n</details>\n\n---\n\n`;
  }

  return md;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(args.runPath)) throw new Error(`Run file not found: ${args.runPath}`);
  if (!fs.existsSync(args.expectedPath)) throw new Error(`Expectations not found: ${args.expectedPath}`);

  const expectations = loadExpectations(args.expectedPath);

  const rows: RunRow[] = [];
  for (const line of fs.readFileSync(args.runPath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line) as RunRow | { kind: "header" };
    if (parsed.kind === "result") rows.push(parsed as RunRow);
  }

  const existing: GradeRecord[] = [];
  if (args.resume && fs.existsSync(args.outPath)) {
    for (const line of fs.readFileSync(args.outPath, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        existing.push(JSON.parse(line) as GradeRecord);
      } catch {
        // partially written trailing line
      }
    }
  }
  const alreadyGraded = new Set(existing.filter((r) => r.grade !== "UNGRADED").map((r) => r.id));

  let pending = rows;
  if (args.ids) pending = pending.filter((row) => args.ids!.has(row.id));
  if (args.resume) pending = pending.filter((row) => !alreadyGraded.has(row.id));

  console.log(`[grade] run: ${path.basename(args.runPath)} — ${rows.length} question(s)`);
  console.log(`[grade] benchmark: ${path.basename(args.expectedPath)} — ${expectations.size} expectation(s)`);
  console.log(`[grade] grading ${pending.length} question(s), concurrency ${args.concurrency}`);

  let done = 0;
  const graded = await mapWithConcurrency(pending, args.concurrency, async (row) => {
    const record = await gradeQuestion({
      id: row.id,
      query: row.query,
      // Step 4: the rendered answer is what the user experiences, so that is
      // what gets graded — not the structured extractor payload behind it.
      candidateAnswer: row.content ?? "",
      sources: candidateSources(row),
      expectation: expectations.get(row.id),
      trace: traceSignals(row),
      runError: row.error,
    });
    done += 1;
    console.log(
      `[grade] (${done}/${pending.length}) ${record.id} ${record.grade}` +
        ` (production \`${record.productionStatus}\`)` +
        (record.categories.length > 0 ? ` — ${record.categories.join(", ")}` : "")
    );
    return record;
  });

  // Keep every question in the output, in run order, with resumed rows retained.
  const byId = new Map<string, GradeRecord>();
  for (const record of existing) byId.set(record.id, record);
  for (const record of graded) byId.set(record.id, record);
  const ordered = rows.map((row) => byId.get(row.id)).filter((r): r is GradeRecord => Boolean(r));

  fs.writeFileSync(args.outPath, `${ordered.map((r) => JSON.stringify(r)).join("\n")}\n`, "utf8");
  fs.writeFileSync(
    args.reportPath,
    buildReport(ordered, expectations, {
      runFile: path.basename(args.runPath),
      expectedFile: path.basename(args.expectedPath),
    }),
    "utf8"
  );

  const summary = summarizeGrades(ordered);
  console.log(
    `[grade] PASS ${summary.counts.PASS} · PARTIAL ${summary.counts.PARTIAL} · FAIL ${summary.counts.FAIL} · UNGRADED ${summary.counts.UNGRADED} (of ${summary.total})`
  );
  console.log(`[grade] grades:  ${args.outPath}`);
  console.log(`[grade] report:  ${args.reportPath}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
