/**
 * Parse mlj017-all97-run.txt and produce a markdown results report.
 * Run: pnpm tsx ./eval/generate-all97-report.ts
 */
import fs from "node:fs";
import path from "node:path";

const evalDir = path.join(import.meta.dirname ?? __dirname);
const rawPath = path.join(evalDir, "mlj017-all97-run-utf8.txt");
const batchPath = path.join(evalDir, "mlj017-smoke-v2-simple-pkg6gen-batch-input.json");
const outPath = path.join(evalDir, "mlj017-all97-results.md");

interface Question {
  id: string;
  query: string;
  activeDocFileName?: string;
}

interface ParsedResult {
  id: string;
  query: string;
  answer: string;
  sources: string[];
  citations: string[];
  elapsedMs: number;
  domains: string;
  cacheHit: boolean;
  timedOut: boolean;
}

function parseOutput(raw: string, questions: Question[]): ParsedResult[] {
  // The UTF-16→UTF-8 conversion inserts blank lines between every real line; collapse them.
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "" || l === "");
  const results: ParsedResult[] = [];

  const questionMap = new Map<string, string>(questions.map((q) => [q.id, q.query]));

  let i = 0;
  while (i < lines.length) {
    // Look for separator lines (===)
    if (lines[i]?.match(/^={60,}$/)) {
      const labelLine = lines[i + 1]?.trim() ?? "";
      const queryLine = lines[i + 2]?.trim() ?? "";
      i += 3;

      // Extract id from label like "[sq01]" or "[sq12]: query text"
      const idMatch = labelLine.match(/^\[(\w+)\]/);
      if (!idMatch) continue;
      const id = idMatch[1];

      // If query is the next separator, we got label=id, query=labelLine content
      let query = queryLine;
      if (!query || query.match(/^={60,}$/)) {
        query = labelLine.replace(/^\[\w+\]:\s*/, "").replace(/^\[\w+\]/, "").trim();
      }
      if (!query) query = questionMap.get(id) ?? id;

      // Read answer section
      const answerLines: string[] = [];
      const sourceLines: string[] = [];
      const citationLines: string[] = [];
      let elapsedMs = 0;
      let domains = "";
      let cacheHit = false;
      let inAnswer = false, inSources = false, inCitations = false;

      while (i < lines.length) {
        const line = lines[i];
        if (line?.match(/^={60,}$/) && lines[i + 1]?.match(/^\[sq/)) break; // next question

        if (line?.startsWith("--- ANSWER ---")) { inAnswer = true; inSources = false; inCitations = false; i++; continue; }
        if (line?.startsWith("--- SOURCES ---")) { inAnswer = false; inSources = true; inCitations = false; i++; continue; }
        if (line?.startsWith("--- CITATIONS ---")) { inAnswer = false; inSources = false; inCitations = true; i++; continue; }
        if (line?.match(/^--- META --- elapsed=(\d+)ms domains=(.+?) cacheHit=(\w+)/)) {
          const m = line.match(/^--- META --- elapsed=(\d+)ms domains=(.+?) cacheHit=(\w+)/);
          if (m) { elapsedMs = parseInt(m[1]); domains = m[2].trim(); cacheHit = m[3] === "true"; }
          i++; break;
        }

        if (inAnswer && line !== undefined) answerLines.push(line);
        if (inSources && line?.match(/^- .+\.(pdf|docx|xlsx|pptx)/i)) sourceLines.push(line.replace(/^- /, "").trim());
        if (inCitations && line?.match(/^- .+\.(pdf|docx|xlsx|pptx)/i)) citationLines.push(line.replace(/^- /, "").trim());
        i++;
      }

      results.push({
        id,
        query,
        answer: answerLines.join("\n").trim(),
        sources: sourceLines,
        citations: citationLines,
        elapsedMs,
        domains,
        cacheHit,
        timedOut: elapsedMs >= 25000,
      });
    } else {
      i++;
    }
  }

  return results;
}

function buildReport(results: ParsedResult[], questions: Question[]): string {
  const now = new Date().toISOString().slice(0, 10);
  const total = results.length;
  const timedOut = results.filter((r) => r.timedOut).length;
  const cacheHits = results.filter((r) => r.cacheHit).length;
  const elapsedTimes = results.map((r) => r.elapsedMs).filter((t) => t > 0);
  const avgMs = elapsedTimes.reduce((a, b) => a + b, 0) / elapsedTimes.length;
  const maxMs = Math.max(...elapsedTimes);
  const minMs = Math.min(...elapsedTimes);
  const totalSec = Math.round(elapsedTimes.reduce((a, b) => a + b, 0) / 1000);

  const withSources = results.filter((r) => r.sources.length > 0).length;

  let md = `# MLJ-017 All-97 Eval Run Results

**Project:** MLJ-017 Package 6 - General \`145b3dcf-272e-4c45-9e19-953f20f25bb9\`
**Run date:** ${now}
**Questions:** ${total} (sq01–sq102, excl. sq32/sq50–sq53)
**Hybrid retrieval:** ON · **Rerank:** OFF
**Input:** \`eval/mlj017-smoke-v2-simple-pkg6gen-batch-input.json\`
**Raw output:** \`eval/mlj017-all97-run.txt\`

---

## Performance Summary

| Metric | Value |
|---|---|
| Total questions | ${total} |
| Questions with sources returned | ${withSources} (${Math.round(100*withSources/total)}%) |
| Questions that hit DB timeout (≥25s) | ${timedOut} (${Math.round(100*timedOut/total)}%) |
| Cache hits | ${cacheHits} |
| Min elapsed | ${minMs}ms |
| Max elapsed | ${maxMs}ms |
| Avg elapsed | ${Math.round(avgMs)}ms |
| Total wall time | ${totalSec}s (~${Math.round(totalSec/60)}m) |

---

## Per-Question Results

`;

  // Group by category from the batch questions
  // Build a map of id -> question
  const qMap = new Map<string, Question>(questions.map((q) => [q.id, q]));

  for (const r of results) {
    const elapsedLabel = r.timedOut ? ` ⏱️ TIMEOUT (${(r.elapsedMs/1000).toFixed(1)}s)` :
      r.elapsedMs < 1000 ? ` ✓ ${r.elapsedMs}ms (exact-ID)` :
      ` ${(r.elapsedMs/1000).toFixed(1)}s`;

    const sourcesLabel = r.sources.length > 0
      ? r.sources.slice(0, 3).map((s) => `\`${s}\``).join(", ") + (r.sources.length > 3 ? ` +${r.sources.length-3} more` : "")
      : "_no sources_";

    md += `### [${r.id}]${elapsedLabel}\n`;
    md += `**Query:** ${r.query}\n\n`;
    md += `**Domains:** ${r.domains || "n/a"}\n\n`;
    md += `**Sources:** ${sourcesLabel}\n\n`;

    // Truncate answer to first 400 chars
    const answerSnippet = r.answer.replace(/\n+/g, " ").slice(0, 400);
    if (answerSnippet) md += `**Answer snippet:** ${answerSnippet}${r.answer.length > 400 ? "…" : ""}\n\n`;

    md += `---\n\n`;
  }

  return md;
}

async function main() {
  const raw = fs.readFileSync(rawPath, "utf8");
  const batchJson = JSON.parse(fs.readFileSync(batchPath, "utf8")) as { questions: Question[] };
  const questions = batchJson.questions;

  console.log(`Parsing ${raw.split("\n").length} lines, ${questions.length} questions...`);
  const results = parseOutput(raw, questions);
  console.log(`Parsed ${results.length} results`);

  const timedOut = results.filter((r) => r.timedOut);
  console.log(`Timed out: ${timedOut.map((r) => r.id).join(", ")}`);

  const report = buildReport(results, questions);
  fs.writeFileSync(outPath, report, "utf8");
  console.log(`Report written to ${outPath}`);
}

main().catch(console.error);
