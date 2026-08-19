/**
 * Question-and-answer report for the 100 project-manager question set.
 *
 * Reads the JSONL produced by `run-97-traced.ts` and writes the question next to
 * the answer the user would have seen in chat. Unlike `generate-qa-only.ts` this
 * also emits a one-row-per-question summary table up front, because with 100
 * short-answer lookups the useful view is "scan all of them at once" rather than
 * "read each one in turn".
 *
 * No grading happens here — `status` is the pipeline's own self-reported answer
 * status, not a judgement about whether the answer is correct.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/generate-pm-qa-report.ts [in.jsonl] [out.md]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

interface ResultRow {
  kind: "result";
  id: string;
  query: string;
  error?: string;
  content?: string;
  elapsedMs?: number;
  answer?: { status?: string; title?: string; summary?: string } | null;
  sources?: Array<{ fileName?: string; pages?: number[] }>;
}

interface HeaderRow {
  kind: "header";
  startedAt: string;
  projectId: string;
  questionFile: string;
  flags?: Record<string, unknown>;
}

function resolvePath(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(scriptDir, "..", value));
}

const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const inputPath = resolvePath(positional[0] ?? "./eval/mlj017-100-pm-run.jsonl");
const outputPath = resolvePath(positional[1] ?? "./eval/mlj017-100-pm-questions-answers.md");
const questionFilePath = resolvePath("./eval/mlj017-100-pm-batch-input.json");

/** `_case` tags from the question file, so the summary can group by category. */
const cases = new Map<string, string>();
if (fs.existsSync(questionFilePath)) {
  const batch = JSON.parse(fs.readFileSync(questionFilePath, "utf8")) as {
    questions: Array<{ id: string; _case?: string }>;
  };
  for (const q of batch.questions) if (q._case) cases.set(q.id, q._case);
}

let header: HeaderRow | undefined;
const rows: ResultRow[] = [];
for (const line of fs.readFileSync(inputPath, "utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;
  const parsed = JSON.parse(line) as HeaderRow | ResultRow;
  if (parsed.kind === "header") header = parsed;
  else rows.push(parsed);
}

const cell = (v: string): string => v.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

/** The pipeline's self-reported status, normalised for rows that never got one. */
function statusOf(row: ResultRow): string {
  if (row.error) return "run_error";
  return row.answer?.status ?? "deterministic";
}

/**
 * A one-line gist of the answer for the summary table.
 *
 * Prefers the structured summary when the answer pipeline produced one; falls
 * back to the first meaningful line of rendered markdown, skipping headings and
 * list bullets so the excerpt carries content rather than formatting.
 */
function gist(row: ResultRow): string {
  if (row.error) return `run error — ${row.error}`;
  const summary = row.answer?.summary?.trim();
  if (summary) return summary.length > 240 ? `${summary.slice(0, 237)}…` : summary;
  const text = (row.content ?? "").trim();
  if (!text) return "(empty)";
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const body = lines.find((l) => !l.startsWith("#")) ?? lines[0];
  const cleaned = body.replace(/^[-*]\s*/, "").replace(/\*\*/g, "");
  return cleaned.length > 240 ? `${cleaned.slice(0, 237)}…` : cleaned;
}

/** Primary cited file, trimmed of extension, for the summary table. */
function topSource(row: ResultRow): string {
  const first = row.sources?.[0]?.fileName;
  if (!first) return "—";
  const base = first.replace(/\.(pdf|docx?|xlsx?|pptx?|csv|msg)$/i, "");
  return base.length > 70 ? `${base.slice(0, 67)}…` : base;
}

const statusCounts = new Map<string, number>();
for (const row of rows) statusCounts.set(statusOf(row), (statusCounts.get(statusOf(row)) ?? 0) + 1);

const totalMs = rows.reduce((a, r) => a + (r.elapsedMs ?? 0), 0);
const flags = header?.flags ?? {};

let md = `# Questions and Answers — ${rows.length} project-manager questions

**Project:** MLJ-017 Package 6 General (Contract A-37806)
**Question set:** \`eval/${header?.questionFile ?? path.basename(questionFilePath)}\`
**Run started:** ${header?.startedAt ?? "n/a"}
**Chat model:** ${String(flags.chatModel ?? "?")} via ${String(flags.llmProvider ?? "?")}
**Total answer time:** ${(totalMs / 60000).toFixed(1)} min (${(totalMs / rows.length / 1000).toFixed(1)}s average)

Each answer below is the text the pipeline returned to the user, verbatim.

\`status\` is the pipeline's **own** self-reported answer status, not an independent
judgement of correctness. \`complete\` means the answer pipeline believed it satisfied
the question; \`deterministic\` means a non-LLM path (usually file lookup) served it;
\`partial\`, \`not_found\`, and \`source_mismatch\` are the pipeline flagging its own
shortfall. To grade accuracy, run \`grade-independent.ts\` against an expected-answer file.

## Status distribution

| Status | Count |
|---|---|
${[...statusCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([s, n]) => `| \`${s}\` | ${n} |`)
  .join("\n")}

## Summary — all ${rows.length} answers

| Id | Question | Status | Answer gist | Top source |
|---|---|---|---|---|
${rows
  .map(
    (row) =>
      `| [${row.id}](#${row.id}) | ${cell(row.query)} | \`${statusOf(row)}\` | ${cell(gist(row))} | ${cell(topSource(row))} |`
  )
  .join("\n")}

---

# Full answers

`;

for (const row of rows) {
  const caseTag = cases.get(row.id);
  md += `<a id="${row.id}"></a>\n\n## ${row.id}\n\n`;
  md += `**Q:** ${row.query}\n\n`;
  if (caseTag) md += `_Category: ${caseTag} · status: \`${statusOf(row)}\` · ${((row.elapsedMs ?? 0) / 1000).toFixed(1)}s_\n\n`;
  md += `**A:**\n\n${row.error ? `_run error_ — \`${row.error}\`` : (row.content ?? "_(empty)_").trim()}\n\n`;
  const srcs = row.sources ?? [];
  if (srcs.length > 0) {
    md += `**Files cited:**\n\n`;
    for (const s of srcs.slice(0, 8)) {
      const pages = s.pages && s.pages.length > 0 ? ` — p. ${s.pages.slice(0, 6).join(", ")}` : "";
      md += `* ${s.fileName ?? "(unnamed)"}${pages}\n`;
    }
    if (srcs.length > 8) md += `* _…and ${srcs.length - 8} more_\n`;
    md += `\n`;
  }
  md += `---\n\n`;
}

fs.writeFileSync(outputPath, md, "utf8");
console.log(`Wrote ${rows.length} question/answer pairs to ${outputPath}`);
