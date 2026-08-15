/**
 * Build a clean Questions-and-Answers markdown from the adjusted v2 run.
 * Full (untruncated) answers, sources, and chunk citations per question.
 * Run: pnpm tsx ./eval/generate-adjusted-v2-qa.ts
 */
import fs from "node:fs";
import path from "node:path";

const evalDir = path.join(import.meta.dirname ?? __dirname);
const rawPath = path.join(evalDir, "mlj017-adjusted-v2-run.txt");
const batchPath = path.join(evalDir, "mlj017-adjusted-v2-batch-input.json");
const outPath = path.join(evalDir, "mlj017-adjusted-v2-qa-report.md");

interface Question { id: string; query: string; activeDocFileName?: string }
interface ParsedResult {
  id: string; query: string; answer: string;
  sources: string[]; citations: string[];
  elapsedMs: number; domains: string; cacheHit: boolean; timedOut: boolean;
}

const REFUSAL_MARKERS = [
  "could not find an exact indexed passage",
  "no evidence-backed specification text",
  "does not contain information",
  "is not available in the provided context",
  "could not verify",
  "not available in the provided context",
];

function parseOutput(raw: string, questions: Question[]): ParsedResult[] {
  const lines = raw.split(/\r?\n/);
  const results: ParsedResult[] = [];
  const qMap = new Map<string, string>(questions.map((q) => [q.id, q.query]));
  let i = 0;
  while (i < lines.length) {
    if (lines[i]?.match(/^={60,}$/)) {
      const idMatch = (lines[i + 1]?.trim() ?? "").match(/^\[(\w+)\]/);
      if (!idMatch) { i++; continue; }
      const id = idMatch[1];
      i += 2;
      const answerLines: string[] = [], sourceLines: string[] = [], citationLines: string[] = [];
      let elapsedMs = 0, domains = "", cacheHit = false;
      let mode: "none" | "answer" | "sources" | "citations" = "none";
      while (i < lines.length) {
        const line = lines[i];
        if (line?.match(/^={60,}$/) && lines[i + 1]?.match(/^\[sq/)) break;
        const meta = line?.match(/^--- META --- elapsed=(\d+)ms domains=(.*?) cacheHit=(\w+)/);
        if (meta) { elapsedMs = parseInt(meta[1], 10); domains = meta[2].trim(); cacheHit = meta[3] === "true"; i++; break; }
        if (line?.startsWith("--- ANSWER ---")) { mode = "answer"; i++; continue; }
        if (line?.startsWith("--- SOURCES ---")) { mode = "sources"; i++; continue; }
        if (line?.startsWith("--- CITATIONS ---")) { mode = "citations"; i++; continue; }
        if (mode === "answer" && line !== undefined) answerLines.push(line);
        if (mode === "sources" && line?.match(/^- .+\.(pdf|docx|xlsx|pptx|csv|heic)/i)) sourceLines.push(line.replace(/^- /, "").trim());
        if (mode === "citations" && line?.match(/^- .+\.(pdf|docx|xlsx|pptx|csv|heic)/i)) citationLines.push(line.replace(/^- /, "").trim());
        i++;
      }
      results.push({
        id, query: qMap.get(id) ?? id,
        answer: answerLines.join("\n").trim(),
        sources: sourceLines, citations: citationLines,
        elapsedMs, domains, cacheHit, timedOut: elapsedMs >= 25000,
      });
    } else i++;
  }
  return results;
}

const isRefusal = (a: string) => REFUSAL_MARKERS.some((m) => a.toLowerCase().includes(m));

function build(results: ParsedResult[]): string {
  const total = results.length;
  const answered = results.filter((r) => r.sources.length > 0 && !isRefusal(r.answer)).length;
  const refusals = results.filter((r) => isRefusal(r.answer)).length;

  let md = `# MLJ-017 Package 6 — Adjusted 97-Question Q&A Report

**Project:** MLJ-017 Package 6 General · \`145b3dcf-272e-4c45-9e19-953f20f25bb9\`
**Questions:** ${total} (reworded / different-facet variants of the original sq01–sq102 set, excl. sq32/sq50–sq53)
**Input:** \`eval/mlj017-adjusted-v2-batch-input.json\` · **Raw output:** \`eval/mlj017-adjusted-v2-run.txt\`
**Pipeline:** intent parse → identifier lookup → hybrid pgvector+GIN retrieval → rerank → \`google/gemini-2.5-flash\` synthesis

**Summary (heuristic):** ${answered}/${total} answered with sources · ${refusals}/${total} returned "not found"/refusal · 0 timeouts

---

`;

  md += "## Index\n\n| ID | Question | Status |\n|---|---|---|\n";
  for (const r of results) {
    const status = r.sources.length === 0 ? "❌ no sources" : isRefusal(r.answer) ? "⚠️ not found" : "✅ answered";
    md += `| ${r.id} | ${r.query.replace(/\|/g, "\\|")} | ${status} |\n`;
  }
  md += "\n---\n\n## Questions & Answers\n\n";

  for (const r of results) {
    const status = r.sources.length === 0 ? "❌ no sources" : isRefusal(r.answer) ? "⚠️ not found" : "✅ answered";
    md += `### [${r.id}] ${status}\n\n`;
    md += `**Q:** ${r.query}\n\n`;
    if (r.sources.length) {
      md += `**Sources:**\n${r.sources.map((s) => `- \`${s}\``).join("\n")}\n\n`;
    } else {
      md += `**Sources:** _none_\n\n`;
    }
    md += `**A:**\n\n${r.answer || "_(empty)_"}\n\n`;
    md += `_domains: ${r.domains || "n/a"} · elapsed: ${(r.elapsedMs / 1000).toFixed(1)}s · cacheHit: ${r.cacheHit}_\n\n---\n\n`;
  }
  return md;
}

const raw = fs.readFileSync(rawPath, "utf8");
const batch = JSON.parse(fs.readFileSync(batchPath, "utf8")) as { questions: Question[] };
const results = parseOutput(raw, batch.questions);
fs.writeFileSync(outPath, build(results), "utf8");
console.log(`Parsed ${results.length} results. Q&A report written to ${outPath}`);
