/**
 * Parse mlj017-adjusted-v2-run.txt and produce a markdown results report.
 * Run: pnpm tsx ./eval/generate-adjusted-v2-report.ts
 */
import fs from "node:fs";
import path from "node:path";

const evalDir = path.join(import.meta.dirname ?? __dirname);
const rawPath = path.join(evalDir, "mlj017-adjusted-v2-run.txt");
const batchPath = path.join(evalDir, "mlj017-adjusted-v2-batch-input.json");
const outPath = path.join(evalDir, "mlj017-adjusted-v2-results.md");

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
  const questionMap = new Map<string, string>(questions.map((q) => [q.id, q.query]));

  let i = 0;
  while (i < lines.length) {
    if (lines[i]?.match(/^={60,}$/)) {
      const labelLine = lines[i + 1]?.trim() ?? "";
      const idMatch = labelLine.match(/^\[(\w+)\]/);
      if (!idMatch) { i++; continue; }
      const id = idMatch[1];
      i += 2; // skip separator + label; query line(s) follow but we use the map

      const answerLines: string[] = [];
      const sourceLines: string[] = [];
      const citationLines: string[] = [];
      let elapsedMs = 0;
      let domains = "";
      let cacheHit = false;
      let mode: "none" | "answer" | "sources" | "citations" = "none";

      while (i < lines.length) {
        const line = lines[i];
        if (line?.match(/^={60,}$/) && lines[i + 1]?.match(/^\[sq/)) break;

        const meta = line?.match(/^--- META --- elapsed=(\d+)ms domains=(.*?) cacheHit=(\w+)/);
        if (meta) {
          elapsedMs = parseInt(meta[1], 10);
          domains = meta[2].trim();
          cacheHit = meta[3] === "true";
          i++;
          break;
        }
        if (line?.startsWith("--- ANSWER ---")) { mode = "answer"; i++; continue; }
        if (line?.startsWith("--- SOURCES ---")) { mode = "sources"; i++; continue; }
        if (line?.startsWith("--- CITATIONS ---")) { mode = "citations"; i++; continue; }

        if (mode === "answer" && line !== undefined) answerLines.push(line);
        if (mode === "sources" && line?.match(/^- .+\.(pdf|docx|xlsx|pptx|csv|heic)/i)) {
          sourceLines.push(line.replace(/^- /, "").trim());
        }
        if (mode === "citations" && line?.match(/^- .+\.(pdf|docx|xlsx|pptx|csv|heic)/i)) {
          citationLines.push(line.replace(/^- /, "").trim());
        }
        i++;
      }

      results.push({
        id,
        query: questionMap.get(id) ?? id,
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

function isRefusal(answer: string): boolean {
  const low = answer.toLowerCase();
  return REFUSAL_MARKERS.some((m) => low.includes(m));
}

function buildReport(results: ParsedResult[]): string {
  const total = results.length;
  const noSources = results.filter((r) => r.sources.length === 0);
  const refusals = results.filter((r) => isRefusal(r.answer));
  const answered = results.filter((r) => r.sources.length > 0 && !isRefusal(r.answer));
  const timedOut = results.filter((r) => r.timedOut);
  const elapsed = results.map((r) => r.elapsedMs).filter((t) => t > 0);
  const avg = Math.round(elapsed.reduce((a, b) => a + b, 0) / elapsed.length);
  const max = Math.max(...elapsed);

  let md = `# MLJ-017 Package 6 — Adjusted 97-Question Q&A Run (v2)

> **Project:** MLJ-017 Package 6 General · \`145b3dcf-272e-4c45-9e19-953f20f25bb9\`
> **Input:** \`eval/mlj017-adjusted-v2-batch-input.json\` (each question reworded / asks a different facet of the same source doc as the original sq set)
> **Raw output:** \`eval/mlj017-adjusted-v2-run.txt\`

---

## Automated summary (heuristic — not a graded PASS/FAIL)

| Signal | Count | % |
|---|---|---|
| Answered with sources (no refusal marker) | ${answered.length} | ${Math.round(100 * answered.length / total)}% |
| Refusal / "not found" phrasing | ${refusals.length} | ${Math.round(100 * refusals.length / total)}% |
| No sources returned | ${noSources.length} | ${Math.round(100 * noSources.length / total)}% |
| Timeouts (≥25s) | ${timedOut.length} | ${Math.round(100 * timedOut.length / total)}% |

**Avg elapsed:** ${(avg / 1000).toFixed(1)}s · **Max elapsed:** ${(max / 1000).toFixed(1)}s · **Total:** ${total}

> Heuristic only: "answered with sources" means the pipeline returned sources and the answer did not contain a refusal phrase. It does **not** verify factual correctness — spot-check the flagged rows below.

### Rows needing review (refusal or no sources)

${[...new Set([...refusals, ...noSources])].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })).map((r) => `- **[${r.id}]** ${r.sources.length === 0 ? "no sources" : "refusal phrasing"} — ${r.query}`).join("\n") || "_none_"}

---

## Per-question results

`;

  for (const r of results) {
    const flag = r.sources.length === 0 ? "❌ no sources"
      : isRefusal(r.answer) ? "⚠️ refusal/not-found"
      : "✅ answered";
    const el = r.timedOut ? `⏱️ ${(r.elapsedMs / 1000).toFixed(1)}s`
      : r.elapsedMs < 1000 ? `✓ ${r.elapsedMs}ms (exact-ID)`
      : `${(r.elapsedMs / 1000).toFixed(1)}s`;
    md += `### [${r.id}] ${flag} · ${el}\n`;
    md += `**Query:** ${r.query}\n\n`;
    md += `**Domains:** ${r.domains || "n/a"} · **cacheHit:** ${r.cacheHit}\n\n`;
    md += `**Sources:** ${r.sources.length ? r.sources.slice(0, 4).map((s) => `\`${s}\``).join(", ") + (r.sources.length > 4 ? ` +${r.sources.length - 4}` : "") : "_none_"}\n\n`;
    const snippet = r.answer.replace(/\n+/g, " ").slice(0, 500);
    md += `**Answer:** ${snippet}${r.answer.length > 500 ? "…" : ""}\n\n---\n\n`;
  }
  return md;
}

function main(): void {
  const raw = fs.readFileSync(rawPath, "utf8");
  const batch = JSON.parse(fs.readFileSync(batchPath, "utf8")) as { questions: Question[] };
  const results = parseOutput(raw, batch.questions);
  console.log(`Parsed ${results.length} results (of ${batch.questions.length} questions).`);
  fs.writeFileSync(outPath, buildReport(results), "utf8");
  console.log(`Report written to ${outPath}`);
}

main();
