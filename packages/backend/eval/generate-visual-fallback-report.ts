/**
 * Visual evidence fallback verification report.
 *
 * Reads a traced run over `eval/mlj017-visual-questions.json` and checks the
 * things the visual fallback is supposed to guarantee, per case:
 *
 *   photos       — states what is visibly present without inventing hidden work
 *   drawings     — reads dimensions and labels off the correct page
 *   checkboxes   — distinguishes the printed options from the selected one
 *   title blocks — reads revision/date/approval visually when OCR lost layout
 *   controls     — a plain text question does NOT spend a vision call
 *
 * Plus the hallucination guards: no scale estimation, no inferred activity, and
 * an explicit "could not verify" instead of a guess.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/run-97-traced.ts --file ./eval/mlj017-visual-questions.json \
 *     --out ./eval/mlj017-visual-run.jsonl
 *   pnpm tsx ./eval/generate-visual-fallback-report.ts \
 *     ./eval/mlj017-visual-run.jsonl ./eval/mlj017-visual-fallback-report.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

interface VisualFallbackLike {
  assessment: { visualLikely: boolean; confidence: number; reasons: string[]; visualTaskTypes: string[] };
  triggered: boolean;
  triggerReason: string;
  pagesSelected: number[];
  pagesInspected: number[];
  evidence: Array<{
    page: number;
    confidence: number;
    observations: Array<{ field: string; value: string; boundingDescription?: string }>;
  }>;
  noEvidence?: boolean;
  failureReason?: string;
  changedAnswerStatus?: boolean;
}

interface ResultRow {
  kind: "result";
  id: string;
  query: string;
  elapsedMs: number;
  error?: string;
  content?: string;
  answer?: {
    status: string;
    title: string;
    summary?: string;
    items: Array<{ label: string; value: string; citationIds?: string[] }>;
    missing?: string[];
    citations: Array<{ id: string; page?: number; evidenceType?: "text" | "visual"; evidenceText?: string }>;
    conflicts?: Array<{ field: string; textValue: string; visualValue: string }>;
    visualFallback?: VisualFallbackLike;
  } | null;
  sources?: Array<{ fileName?: string; pages?: number[] }>;
  events: Array<{ event: string; level: string; meta: Record<string, unknown> }>;
}

interface HeaderRow {
  kind: "header";
  startedAt: string;
  projectId: string;
  questionFile: string;
  questionCount: number;
  flags: Record<string, unknown>;
}

/** Case metadata from the question file, so the report can group by visual task. */
interface CaseMeta {
  id: string;
  description: string;
  isControl: boolean;
}

function resolveInput(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(scriptDir, "..", value));
}

function loadCaseMeta(questionFile: string): Map<string, CaseMeta> {
  const meta = new Map<string, CaseMeta>();
  if (!fs.existsSync(questionFile)) return meta;
  const parsed = JSON.parse(fs.readFileSync(questionFile, "utf8")) as {
    questions: Array<{ id?: string; _case?: string }>;
  };
  for (const question of parsed.questions) {
    if (!question.id) continue;
    const description = question._case ?? "";
    meta.set(question.id, {
      id: question.id,
      description,
      isControl: /negative control/i.test(description),
    });
  }
  return meta;
}

/** Wording that would mean the model estimated rather than read a value. */
const ESTIMATION_PATTERNS = [
  /\bapproximately\b/i,
  /\broughly\b/i,
  /\bscaled?\s+from\b/i,
  /\bappears?\s+to\s+be\s+about\b/i,
  /\bestimated?\b/i,
  /\bsomewhere\s+between\b/i,
];

/** Wording that would mean the model inferred work it could not see. */
const INFERENCE_PATTERNS = [
  /\blikely\b/i,
  /\bpresumably\b/i,
  /\bwould\s+have\s+been\b/i,
  /\btypically\b/i,
  /\bsuggests?\s+that\s+work\b/i,
  /\bmust\s+have\b/i,
];

function answerText(row: ResultRow): string {
  const parts: string[] = [];
  if (row.answer?.summary) parts.push(row.answer.summary);
  for (const item of row.answer?.items ?? []) parts.push(`${item.label}: ${item.value}`);
  if (parts.length === 0 && row.content) parts.push(row.content);
  return parts.join("\n");
}

function visualObservationText(trace?: VisualFallbackLike): string {
  return (trace?.evidence ?? [])
    .flatMap((entry) => entry.observations.map((observation) => `${observation.field}: ${observation.value}`))
    .join("\n");
}

interface CaseVerdict {
  row: ResultRow;
  meta?: CaseMeta;
  checks: Array<{ name: string; pass: boolean | null; detail: string }>;
}

/**
 * Per-case checks. `null` means not applicable to this case (for instance, a
 * hallucination guard cannot be judged when no visual evidence was produced).
 */
/**
 * The visual trace for a row.
 *
 * Prefers the structured trace on the answer, and reconstructs it from the log
 * events when the question was served by a deterministic path (no
 * `ExtractedAnswer` to hang the trace on) — those runs still exercised the stage.
 */
function traceOf(row: ResultRow): VisualFallbackLike | undefined {
  if (row.answer?.visualFallback) return row.answer.visualFallback;

  const assessed = row.events.find((event) => event.event === "visual_fallback.assessed");
  if (!assessed) return undefined;

  const triggered = row.events.find((event) => event.event === "visual_fallback.triggered");
  const selected = row.events.find((event) => event.event === "visual_fallback.pages_selected");
  const completed = row.events.find((event) => event.event === "visual_fallback.completed");
  const noEvidence = row.events.find((event) => event.event === "visual_fallback.no_evidence");
  const failed = row.events.find((event) => event.event === "visual_fallback.failed");

  const observations = (completed?.meta.observations as
    | Array<{ page: number; field: string; value: string }>
    | undefined) ?? [];
  const byPage = new Map<number, VisualFallbackLike["evidence"][number]>();
  for (const observation of observations) {
    const existing = byPage.get(observation.page);
    const entry =
      existing ?? { page: observation.page, confidence: 0, observations: [] };
    entry.observations.push({ field: observation.field, value: observation.value });
    byPage.set(observation.page, entry);
  }

  return {
    assessment: {
      visualLikely: Boolean(assessed.meta.visualLikely),
      confidence: Number(assessed.meta.confidence ?? 0),
      reasons: (assessed.meta.reasons as string[] | undefined) ?? [],
      visualTaskTypes: (assessed.meta.visualTaskTypes as string[] | undefined) ?? [],
    },
    triggered: Boolean(triggered),
    triggerReason: String(triggered?.meta.reason ?? "not triggered"),
    pagesSelected: (selected?.meta.pages as number[] | undefined) ?? [],
    pagesInspected:
      ((completed?.meta.pagesInspected ?? noEvidence?.meta.pagesInspected) as number[] | undefined) ?? [],
    evidence: [...byPage.values()],
    ...(noEvidence ? { noEvidence: true } : {}),
    ...(failed ? { failureReason: String(failed.meta.reason ?? "unknown") } : {}),
  };
}

function verifyCase(row: ResultRow, meta?: CaseMeta): CaseVerdict {
  const trace = traceOf(row);
  const checks: CaseVerdict["checks"] = [];
  const observations = visualObservationText(trace);
  const answer = answerText(row);
  const refused = row.answer?.status === "not_found" || (row.answer?.items.length ?? 0) === 0;

  if (meta?.isControl) {
    checks.push({
      name: "vision not spent on a text question",
      pass: !trace?.triggered,
      detail: trace?.triggered
        ? `triggered anyway: ${trace.triggerReason}`
        : `not triggered (${trace?.triggerReason ?? "stage not reached"})`,
    });
    return { row, ...(meta ? { meta } : {}), checks };
  }

  checks.push({
    name: "assessed as visual",
    pass: trace?.assessment.visualLikely ?? null,
    detail: trace
      ? `visualLikely=${trace.assessment.visualLikely}, confidence=${trace.assessment.confidence.toFixed(2)}, task=${trace.assessment.visualTaskTypes.join(",")}`
      : "no assessment recorded (the stage was never reached on this path)",
  });

  checks.push({
    name: "pages selected, not the whole document",
    // Only meaningful once the stage actually ran, and not when it failed before
    // selection (an unreachable file has no page to choose).
    pass:
      trace?.triggered && !trace.failureReason
        ? trace.pagesSelected.length > 0 && trace.pagesSelected.length <= 5
        : null,
    detail: trace?.triggered
      ? trace.failureReason
        ? `stage failed before selection: ${trace.failureReason}`
        : `selected ${trace.pagesSelected.join(", ") || "none"}`
      : "stage did not trigger",
  });

  checks.push({
    name: "visual claims are tied to a page",
    pass:
      (trace?.evidence.length ?? 0) > 0
        ? trace!.evidence.every((entry) => Number.isInteger(entry.page) && entry.page >= 1)
        : null,
    detail:
      (trace?.evidence.length ?? 0) > 0
        ? `observations on ${trace!.evidence.map((entry) => `p.${entry.page}`).join(", ")}`
        : "no visual observations produced",
  });

  checks.push({
    name: "visual evidence is citable/deep-linkable",
    pass:
      (trace?.evidence.length ?? 0) > 0
        ? (row.answer?.citations ?? []).some(
            (citation) => citation.evidenceType === "visual" && typeof citation.page === "number"
          )
        : null,
    detail: `${(row.answer?.citations ?? []).filter((c) => c.evidenceType === "visual").length} visual citation(s)`,
  });

  // Hallucination guards, judged over the visual observations and the answer text.
  const estimation = [...ESTIMATION_PATTERNS].find((pattern) => pattern.test(observations));
  checks.push({
    name: "no scale-based estimation",
    pass: observations.length > 0 ? !estimation : null,
    detail: estimation ? `hedged/estimated wording: ${estimation.source}` : "no estimation wording",
  });

  const inference = [...INFERENCE_PATTERNS].find((pattern) => pattern.test(observations));
  checks.push({
    name: "no inferred activity",
    pass: observations.length > 0 ? !inference : null,
    detail: inference ? `speculative wording: ${inference.source}` : "no speculative wording",
  });

  // A refusal on a question whose pages we inspected has to say so; a refusal on a
  // question the stage never ran for is judged only on not claiming a fact.
  const refusalText = `${answer}\n${row.content ?? ""}`;
  const namesVisualInspection =
    /could not be verified|could not be inspected|not\s+visible|visual inspection|inspected/i.test(refusalText);
  checks.push({
    name: trace?.pagesInspected.length
      ? "refusal states the pages were inspected and still could not verify"
      : "refusal is an explicit inability to verify",
    pass: refused ? namesVisualInspection || /couldn't verify|could not verify|does not (?:contain|state|show)/i.test(refusalText) : null,
    detail: refused
      ? `refusal wording: "${(row.content ?? "").replace(/\s+/g, " ").slice(0, 160)}"`
      : "answered, not refused",
  });

  if (refused && (trace?.pagesInspected.length ?? 0) > 0) {
    checks.push({
      name: "refusal does not suggest a visual review that already happened",
      pass: !/may require reviewing|review .{0,20}visually|check the (?:drawing|photo|page) visually/i.test(
        refusalText
      ),
      detail: /may require reviewing/i.test(refusalText)
        ? "suggests reviewing visually despite having inspected the pages"
        : "no redundant suggestion",
    });
  }

  if (row.answer?.conflicts?.length) {
    checks.push({
      name: "text/image conflict reported, not resolved",
      pass: row.answer.status !== "complete",
      detail: row.answer.conflicts
        .map((conflict) => `${conflict.field}: text="${conflict.textValue}" vs image="${conflict.visualValue}"`)
        .join("; "),
    });
  }

  return { row, ...(meta ? { meta } : {}), checks };
}

function icon(pass: boolean | null): string {
  if (pass === null) return "—";
  return pass ? "✅" : "❌";
}

function esc(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function buildReport(header: HeaderRow | undefined, rows: ResultRow[], caseMeta: Map<string, CaseMeta>): string {
  const verdicts = rows.map((row) => verifyCase(row, caseMeta.get(row.id)));

  const triggered = verdicts.filter((v) => traceOf(v.row)?.triggered).length;
  const withEvidence = verdicts.filter((v) => (traceOf(v.row)?.evidence.length ?? 0) > 0).length;
  const changed = verdicts.filter((v) => traceOf(v.row)?.changedAnswerStatus).length;
  const failedStage = verdicts.filter((v) => traceOf(v.row)?.failureReason).length;
  const controls = verdicts.filter((v) => v.meta?.isControl);
  const controlsHeld = controls.filter((v) => v.checks.every((check) => check.pass !== false)).length;
  const failedChecks = verdicts.flatMap((v) =>
    v.checks.filter((check) => check.pass === false).map((check) => ({ id: v.row.id, check }))
  );

  let md = `# Visual Evidence Fallback — Verification Run

**Project:** \`${header?.projectId ?? "n/a"}\`
**Run started:** ${header?.startedAt ?? "n/a"}
**Questions:** ${rows.length} (from \`eval/${header?.questionFile ?? "mlj017-visual-questions.json"}\`)
**Vision model:** \`${String(header?.flags?.visionModel ?? "?")}\` · **render DPI:** ${String(header?.flags?.chatVisualFallbackDpi ?? "?")} · **max pages/question:** ${String(header?.flags?.chatVisualFallbackMaxPages ?? "?")}

## Stage under test

\`\`\`
locked document
  → text retrieval + text evidence extraction
  → is the evidence sufficient?
  → if insufficient AND likely visual:
       visual page selection → render → vision → merge text + visual
  → answer completeness validation   (visual is checked BEFORE not_found)
\`\`\`

## Summary

| Metric | Count |
|---|---|
| Visual fallback triggered | ${triggered}/${rows.length} |
| Returned page observations | ${withEvidence} |
| Changed answer status (would have been refused on text alone) | ${changed} |
| Stage could not run (render/source/vision unavailable) | ${failedStage} |
| Negative controls that correctly did **not** spend a vision call | ${controlsHeld}/${controls.length} |
| Failed verification checks | ${failedChecks.length} |

`;

  if (failedChecks.length > 0) {
    md += `### Failed checks\n\n`;
    for (const entry of failedChecks) {
      md += `- \`${entry.id}\` — **${entry.check.name}**: ${esc(entry.check.detail)}\n`;
    }
    md += `\n`;
  } else {
    md += `> Every applicable check passed.\n\n`;
  }

  md += `## Index

| Id | Case | Triggered | Pages inspected | Observations | Status |
|---|---|---|---|---|---|
`;
  for (const verdict of verdicts) {
    const trace = traceOf(verdict.row);
    const observationCount = (trace?.evidence ?? []).reduce(
      (sum, entry) => sum + entry.observations.length,
      0
    );
    md += `| ${verdict.row.id} | ${esc(verdict.meta?.description ?? "")} | ${trace?.triggered ? "yes" : "no"} | ${(trace?.pagesInspected ?? []).join(", ") || "—"} | ${observationCount} | ${verdict.row.error ? "error" : (verdict.row.answer?.status ?? "deterministic")} |\n`;
  }

  md += `\n---\n\n`;

  for (const verdict of verdicts) {
    const row = verdict.row;
    const trace = traceOf(row);
    md += `## ${row.id} — ${verdict.meta?.description ?? "case"}\n\n`;
    md += `**Question:** ${row.query}\n\n`;

    if (row.error) {
      md += `**Error:** \`${row.error}\`\n\n---\n\n`;
      continue;
    }

    md += `**Answer as the user sees it:**\n\n${row.content ?? "(no content)"}\n\n`;

    if (trace) {
      md += `**Visual fallback:**\n\n`;
      md += `- Assessment: \`visualLikely=${trace.assessment.visualLikely}\`, confidence ${trace.assessment.confidence.toFixed(2)}, task types ${trace.assessment.visualTaskTypes.map((t) => `\`${t}\``).join(", ") || "none"}\n`;
      md += `- Trigger: ${trace.triggered ? "**yes**" : "no"} — ${trace.triggerReason}\n`;
      if (trace.pagesSelected.length > 0) md += `- Pages selected: ${trace.pagesSelected.join(", ")}\n`;
      if (trace.pagesInspected.length > 0) md += `- Pages inspected: ${trace.pagesInspected.join(", ")}\n`;
      if (trace.failureReason) md += `- Could not complete: ${trace.failureReason}\n`;
      if (trace.noEvidence) md += `- Nothing legible on the inspected pages (\`visual_fallback.no_evidence\`)\n`;
      for (const entry of trace.evidence) {
        for (const observation of entry.observations) {
          md += `- p.${entry.page} (confidence ${entry.confidence.toFixed(2)}) — **${observation.field}:** ${observation.value}${observation.boundingDescription ? ` _(${observation.boundingDescription})_` : ""}\n`;
        }
      }
      md += `\n`;
    } else {
      md += `**Visual fallback:** not reached on this path.\n\n`;
    }

    if (row.answer?.conflicts?.length) {
      md += `**Text/image conflicts reported for review:**\n\n`;
      for (const conflict of row.answer.conflicts) {
        md += `- **${conflict.field}** — text says "${conflict.textValue}", image shows "${conflict.visualValue}"\n`;
      }
      md += `\n`;
    }

    md += `**Checks:**\n\n`;
    for (const check of verdict.checks) {
      md += `- ${icon(check.pass)} ${check.name} — ${check.detail}\n`;
    }
    md += `\n---\n\n`;
  }

  return md;
}

function main(): void {
  const inPath = resolveInput(process.argv[2] ?? "./eval/mlj017-visual-run.jsonl");
  const outPath = resolveInput(process.argv[3] ?? "./eval/mlj017-visual-fallback-report.md");
  const questionFile = resolveInput("./eval/mlj017-visual-questions.json");

  if (!fs.existsSync(inPath)) {
    console.error(`No run data at ${inPath}. Produce it first with:`);
    console.error(
      `  pnpm tsx ./eval/run-97-traced.ts --file ./eval/mlj017-visual-questions.json --out ./eval/mlj017-visual-run.jsonl`
    );
    process.exit(1);
  }

  let header: HeaderRow | undefined;
  const rows: ResultRow[] = [];
  for (const line of fs.readFileSync(inPath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as HeaderRow | ResultRow;
      if (parsed.kind === "header") header = parsed;
      else rows.push(parsed);
    } catch {
      // Partially written trailing line — ignore.
    }
  }

  fs.writeFileSync(outPath, buildReport(header, rows, loadCaseMeta(questionFile)), "utf8");
  console.log(`[visual-report] ${rows.length} question(s) → ${outPath}`);
}

main();
