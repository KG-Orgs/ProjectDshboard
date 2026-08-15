/**
 * LLM-grade a batch of generated answers with the Answer Completeness and
 * Grounding Validator, and write a graded markdown report.
 *
 * Run: pnpm tsx ./eval/grade-answers.ts [input.json] [output.md]
 *
 * Input JSON shape (either give the extractor `answer` object, or answerText + evidence):
 * {
 *   "entries": [
 *     {
 *       "id": "sq01",
 *       "question": "What is the response due date for RFI-0115?",
 *       "answer": { ...ExtractedAnswer... }          // preferred: evidence is taken from answer.citations
 *     },
 *     {
 *       "id": "sq02",
 *       "question": "...",
 *       "answerText": "## ...",                        // alternative: plain markdown answer
 *       "evidence": [ { "id": "c1", "documentName": "RFI-0115", "page": 3, "text": "..." } ]
 *     }
 *   ]
 * }
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import fs from "node:fs";
import path from "node:path";
import type { AnswerValidation, ExtractedAnswer } from "@contractor/shared";
import { resetEnvCache } from "../src/config/env.js";
import {
  evidenceFromExtractedAnswer,
  validateAnswer,
  type ValidatorEvidenceItem,
} from "../src/services/answer-validator.service.js";

resetEnvCache();

interface GradeEntry {
  id: string;
  question: string;
  answer?: ExtractedAnswer;
  answerText?: string;
  evidence?: ValidatorEvidenceItem[];
}

interface GradedRow extends GradeEntry {
  validation: AnswerValidation | null;
}

const evalDir = import.meta.dirname ?? __dirname;
const inputPath = path.resolve(evalDir, process.argv[2] ?? "grade-input.json");
const outputPath = path.resolve(evalDir, process.argv[3] ?? "grade-answers-report.md");

function answerTextFor(entry: GradeEntry): string {
  if (typeof entry.answerText === "string" && entry.answerText.trim().length > 0) {
    return entry.answerText;
  }
  if (entry.answer) {
    const parts = [entry.answer.title];
    if (entry.answer.summary) parts.push(entry.answer.summary);
    for (const item of entry.answer.items) {
      parts.push(`- ${item.label ? `${item.label}: ` : ""}${item.value}`);
    }
    return parts.join("\n");
  }
  return "";
}

function evidenceFor(entry: GradeEntry): ValidatorEvidenceItem[] {
  if (entry.evidence && entry.evidence.length > 0) return entry.evidence;
  if (entry.answer) return evidenceFromExtractedAnswer(entry.answer);
  return [];
}

function gradeIcon(validation: AnswerValidation | null): string {
  if (!validation) return "❔ ungraded";
  return validation.grade === "pass" ? "✅ pass" : validation.grade === "partial" ? "⚠️ partial" : "❌ fail";
}

function buildReport(rows: GradedRow[]): string {
  const graded = rows.filter((r) => r.validation);
  const counts = { pass: 0, partial: 0, fail: 0, ungraded: rows.length - graded.length };
  for (const r of graded) counts[r.validation!.grade] += 1;

  const failureCounts = new Map<string, number>();
  for (const r of graded) {
    const ft = r.validation!.failureType;
    if (ft !== "none") failureCounts.set(ft, (failureCounts.get(ft) ?? 0) + 1);
  }

  const total = rows.length;
  const pct = (n: number) => (total > 0 ? Math.round((100 * n) / total) : 0);

  let md = `# Answer Grading Report

> Validator: Answer Completeness and Grounding Validator
> Input: \`${path.basename(inputPath)}\` · Total questions: ${total}

## Summary

| Grade | Count | % |
|---|---|---|
| ✅ pass | ${counts.pass} | ${pct(counts.pass)}% |
| ⚠️ partial | ${counts.partial} | ${pct(counts.partial)}% |
| ❌ fail | ${counts.fail} | ${pct(counts.fail)}% |
| ❔ ungraded (LLM unavailable) | ${counts.ungraded} | ${pct(counts.ungraded)}% |

`;

  if (failureCounts.size > 0) {
    md += `### Failure types\n\n| Type | Count |\n|---|---|\n`;
    for (const [type, count] of [...failureCounts.entries()].sort((a, b) => b[1] - a[1])) {
      md += `| ${type} | ${count} |\n`;
    }
    md += `\n`;
  }

  md += `---\n\n## Per-question results\n\n`;
  for (const r of rows) {
    md += `### [${r.id}] ${gradeIcon(r.validation)}\n`;
    md += `**Question:** ${r.question}\n\n`;
    if (r.validation) {
      md += `**Failure type:** ${r.validation.failureType}\n\n`;
      if (r.validation.requestedFields.length > 0) {
        md += `**Requested fields:**\n`;
        for (const f of r.validation.requestedFields) {
          md += `- ${f.field} — ${f.status}\n`;
        }
        md += `\n`;
      }
      if (r.validation.unsupportedClaims.length > 0) {
        md += `**Unsupported claims:**\n`;
        for (const c of r.validation.unsupportedClaims) md += `- ${c}\n`;
        md += `\n`;
      }
      md += `**Notes:** ${r.validation.notes || "_none_"}\n\n`;
    } else {
      md += `_Not graded — the LLM transport returned no verdict (check API keys / connectivity)._\n\n`;
    }
    md += `---\n\n`;
  }
  return md;
}

async function main(): Promise<void> {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error(`Usage: pnpm tsx ./eval/grade-answers.ts [input.json] [output.md]`);
    process.exit(1);
  }

  const parsed = JSON.parse(fs.readFileSync(inputPath, "utf8")) as { entries?: GradeEntry[] };
  const entries = parsed.entries ?? [];
  console.log(`Grading ${entries.length} answers from ${path.basename(inputPath)} …`);

  const rows: GradedRow[] = [];
  for (const entry of entries) {
    const validation = await validateAnswer({
      question: entry.question,
      answerText: answerTextFor(entry),
      evidence: evidenceFor(entry),
    });
    rows.push({ ...entry, validation });
    console.log(`  [${entry.id}] ${gradeIcon(validation)}`);
  }

  fs.writeFileSync(outputPath, buildReport(rows), "utf8");
  console.log(`Report written to ${outputPath}`);
  process.exit(0);
}

void main();
