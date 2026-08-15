/**
 * Question-and-answer only, stripped of every trace and grade.
 *
 * Reads the JSONL produced by `run-97-traced.ts` and writes just the question and
 * the answer as the user would have seen it in chat — no routing, no retrieval
 * counts, no extractor status, no grade. For the full account of how each answer
 * was reached, use `generate-97-traced-report.ts` against the same JSONL.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/generate-qa-only.ts [in.jsonl] [out.md]
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
}

interface HeaderRow {
  kind: "header";
  startedAt: string;
  projectId: string;
  questionFile: string;
}

function resolvePath(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(scriptDir, "..", value));
}

const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const inputPath = resolvePath(positional[0] ?? "./eval/mlj017-97-variant-run.jsonl");
const outputPath = resolvePath(positional[1] ?? "./eval/mlj017-97-variant-questions-answers.md");

let header: HeaderRow | undefined;
const rows: ResultRow[] = [];
for (const line of fs.readFileSync(inputPath, "utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;
  const parsed = JSON.parse(line) as HeaderRow | ResultRow;
  if (parsed.kind === "header") header = parsed;
  else rows.push(parsed);
}

let md = `# Questions and Answers — ${rows.length} questions

**Project:** MLJ-017 Package 6 General
**Question set:** \`eval/${header?.questionFile ?? "?"}\`
**Run started:** ${header?.startedAt ?? "n/a"}

Each answer below is the text the pipeline returned to the user, verbatim. Nothing about
how it was reached is included here — see \`eval/${path.basename(inputPath).replace(/-run\.jsonl$/, "-qa-report.md")}\`
for the per-question reasoning trace and grade.

## Contents

${rows.map((row) => `- [${row.id}](#${row.id}) — ${row.query.replace(/\|/g, "\\|")}`).join("\n")}

---

`;

for (const row of rows) {
  md += `<a id="${row.id}"></a>\n\n## ${row.id}\n\n`;
  md += `**Q:** ${row.query}\n\n`;
  md += `**A:**\n\n${row.error ? `_run error_ — \`${row.error}\`` : (row.content ?? "_(empty)_").trim()}\n\n`;
  md += `---\n\n`;
}

fs.writeFileSync(outputPath, md, "utf8");
console.log(`Wrote ${rows.length} question/answer pairs to ${outputPath}`);
