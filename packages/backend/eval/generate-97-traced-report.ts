/**
 * Build the Q&A + reasoning-trace markdown report from a traced run.
 *
 * Reads the JSONL produced by `run-97-traced.ts` and renders, per question:
 * the question, the full answer as the user would see it, the sources, and a
 * step-by-step account of how the pipeline reached that answer (intent, route,
 * retrieval counts, evidence ranking, identity guard, extractor verdict,
 * formatter, timing) plus the verbatim passages the model cited.
 *
 * When a grade file from `grade-independent.ts` is available, the independent
 * PASS/PARTIAL/FAIL grade is folded in alongside — as a separate axis from the
 * pipeline's own status, never as a replacement for it.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/generate-97-traced-report.ts [in.jsonl] [out.md] [prev-report.md]
 *   pnpm tsx ./eval/generate-97-traced-report.ts --grades ./eval/mlj017-97-grades.jsonl \
 *     --prev-grades ./eval/mlj017-97-grades-baseline.jsonl
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadExpectations, type QuestionExpectation } from "./eval-expectations";
import { formatExpectedFacts, type GradeRecord } from "./independent-grader";
import {
  GRADE_ICON,
  compareGradeRuns,
  renderComparison,
  renderCrossTab,
  renderGradeDetail,
  renderGradeTotals,
  renderRootCauses,
  summarizeGrades,
} from "./independent-grade-report";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

interface Citation {
  id: string;
  documentName?: string;
  fileName?: string;
  page?: number;
  evidenceText?: string;
  evidenceType?: "text" | "visual";
}

interface VisualFallbackLike {
  assessment: {
    visualLikely: boolean;
    confidence: number;
    reasons: string[];
    visualTaskTypes: string[];
  };
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

interface ExtractedAnswerLike {
  status: "complete" | "partial" | "not_found" | "source_mismatch";
  title: string;
  summary?: string;
  items: Array<{ label: string; value: string; citationIds?: string[] }>;
  missing?: string[];
  citations: Citation[];
  conflicts?: Array<{ field: string; textValue: string; visualValue: string }>;
  visualFallback?: VisualFallbackLike;
}

interface LogEvent {
  event: string;
  level: string;
  meta: Record<string, unknown>;
}

interface ResultRow {
  kind: "result";
  id: string;
  query: string;
  elapsedMs: number;
  error?: string;
  content?: string;
  answer?: ExtractedAnswerLike | null;
  sources?: Array<{ fileName?: string; pages?: number[]; pageOrigin?: string | null }>;
  citations?: Array<{ fileName: string; chunkIndex: number; page: number | null; relevance: number }>;
  domains?: string[];
  interpretation?: {
    intent?: string;
    confidence?: number;
    source?: string;
    fallbackReason?: string;
    entities?: Record<string, unknown>;
    retrievalHints?: Record<string, unknown>;
  } | null;
  coordinator?: {
    telemetry?: { routeMs?: number; retrievalMs?: number; mergeMs?: number; agentMs?: number; totalMs?: number };
    specialistAgents?: Array<{ agent: string; sourceCount: number; nodeCount: number }>;
    estimatedContextTokens?: number;
    contradictions?: unknown[];
    splitSignals?: string[];
  };
  cacheHit?: boolean;
  events: LogEvent[];
}

interface HeaderRow {
  kind: "header";
  startedAt: string;
  projectId: string;
  questionFile: string;
  questionCount: number;
  flags: Record<string, unknown>;
}

const STATUS_ICON: Record<string, string> = {
  complete: "✅ complete",
  partial: "⚠️ partial",
  not_found: "🚫 not found in source",
  source_mismatch: "⛔ source mismatch",
  deterministic: "📄 deterministic answer",
  error: "💥 error",
};

function statusOf(row: ResultRow): string {
  if (row.error) return "error";
  return row.answer?.status ?? "deterministic";
}

function esc(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function firstEvent(row: ResultRow, event: string): LogEvent | undefined {
  return row.events.find((e) => e.event === event);
}

function allEvents(row: ResultRow, event: string): LogEvent[] {
  return row.events.filter((e) => e.event === event);
}

/**
 * Which of the coordinator's answer paths served this question.
 * `active_doc_trace` is only emitted by the single-document deep-read path;
 * `route_summary` only by the project-wide retrieval path. Neither means the
 * question was served by a short-circuit path (file lookup, recency, greeting).
 */
function routeLabel(row: ResultRow): { label: string; detail: string } {
  const docTrace = firstEvent(row, "chat.coordinator.active_doc_trace");
  const routeSummary = firstEvent(row, "chat.coordinator.route_summary");
  if (docTrace) {
    return {
      label: "single-document deep read",
      detail: `the identifier in the question resolved to one file (\`${String(docTrace.meta.fileName ?? "?")}\`), so retrieval was scoped to that document's chunks instead of the whole project`,
    };
  }
  if (routeSummary) {
    return {
      label: "project-wide hybrid retrieval",
      detail: "no single document was resolved from the question, so the query went to project-wide hybrid search and the specialist-agent merge",
    };
  }
  return {
    label: "short-circuit path",
    detail: "answered without the LLM synthesis path (file lookup / recency / greeting resolver)",
  };
}

function fmtMs(ms?: number): string {
  if (typeof ms !== "number") return "n/a";
  return `${(ms / 1000).toFixed(1)}s`;
}

function bulletList(items: string[]): string {
  return items.map((item) => `${item}`).join("\n");
}

/** The numbered "how the agent got there" walk-through for one question. */
function buildTrace(row: ResultRow): string {
  const steps: string[] = [];
  const interp = row.interpretation ?? undefined;
  const route = routeLabel(row);

  // 1 — intent + identifier extraction
  if (interp) {
    const ids = (interp.entities as { constructionIdentifiers?: string[] } | undefined)?.constructionIdentifiers ?? [];
    const hints = (interp.retrievalHints ?? {}) as {
      exactIdentifierFirst?: boolean;
      preferredCategories?: string[];
    };
    const bits = [
      `intent \`${interp.intent ?? "?"}\``,
      `confidence ${typeof interp.confidence === "number" ? interp.confidence.toFixed(2) : "n/a"}`,
      `classifier \`${interp.source ?? "?"}\`${interp.fallbackReason ? ` (${interp.fallbackReason})` : ""}`,
    ];
    let step = `1. **Understood the question** — ${bits.join(", ")}.`;
    if (ids.length > 0) step += ` Identifiers extracted: ${ids.map((i) => `\`${i}\``).join(", ")}.`;
    if (hints.exactIdentifierFirst) step += ` Exact-identifier lookup requested before semantic search.`;
    if (hints.preferredCategories?.length) {
      step += ` Retrieval steered to categories: ${hints.preferredCategories.map((c) => `\`${c}\``).join(", ")}.`;
    }
    steps.push(step);
  } else {
    steps.push(`1. **Understood the question** — no interpretation recorded (short-circuit path).`);
  }

  // 2 — route
  let routeStep = `2. **Chose a route** — ${route.label}: ${route.detail}.`;
  if (firstEvent(row, "chat.coordinator.filename_id_fallback")) {
    routeStep += ` The document was matched by filename-identifier fallback after the exact-id lookup missed.`;
  }
  if (firstEvent(row, "chat.coordinator.filename_designation")) {
    routeStep += ` The designation was read off the filename itself.`;
  }
  const agents = row.coordinator?.specialistAgents ?? [];
  if (agents.length > 0) {
    routeStep += ` Specialists consulted: ${agents.map((a) => `\`${a.agent}\` (${a.nodeCount} nodes)`).join(", ")}.`;
  }
  steps.push(routeStep);

  // 3 — retrieval
  const hybrid = firstEvent(row, "retrieval.hybrid.metrics");
  const docTrace = firstEvent(row, "chat.coordinator.active_doc_trace");
  if (hybrid) {
    const m = hybrid.meta as {
      profile?: string;
      categoryRestricted?: boolean;
      categories?: string[];
      vectorCandidates?: number;
      lexicalCandidates?: number;
      mergedCandidates?: number;
    };
    steps.push(
      `3. **Retrieved candidates** — hybrid \`${m.profile}\` profile: ${m.vectorCandidates ?? 0} pgvector + ${m.lexicalCandidates ?? 0} lexical/GIN → ${m.mergedCandidates ?? 0} merged candidate chunks` +
        (m.categoryRestricted ? `, restricted to ${(m.categories ?? []).map((c) => `\`${c}\``).join(", ")}` : `, no category restriction`) +
        `.`
    );
  } else if (docTrace) {
    const m = docTrace.meta as {
      evidenceTokens?: string[];
      rankedPreview?: Array<{ chunkIndex: number; pageNumber?: number; score: number; keywordHits?: number; strongEvidence?: boolean }>;
    };
    const top = (m.rankedPreview ?? []).slice(0, 4);
    steps.push(
      `3. **Ranked that document's chunks** — scored on evidence terms ${(m.evidenceTokens ?? []).slice(0, 8).map((t) => `\`${t}\``).join(", ")}. Top chunks: ` +
        (top.length > 0
          ? top
              .map(
                (c) =>
                  `#${c.chunkIndex}${typeof c.pageNumber === "number" ? ` (p.${c.pageNumber})` : ""} score ${c.score.toFixed(2)}${c.strongEvidence ? " ★" : ""}`
              )
              .join(", ")
          : "none") +
        `.`
    );
  } else {
    steps.push(`3. **Retrieved candidates** — no retrieval metrics recorded for this path.`);
  }

  // 4 — identity guard
  const guardReject = firstEvent(row, "chat.source_identity_guard.retry_retrieval");
  const guardFilter = firstEvent(row, "chat.source_identity_guard.filtered");
  if (guardReject) {
    const m = guardReject.meta as { reason?: string; rejected?: unknown };
    const reason = String(m.reason ?? "retrieved source is not the requested document").replace(/\.$/, "");
    steps.push(
      `4. **Source Identity Guard blocked the answer** — ${reason}. No extraction call was made and nothing was synthesized from the mismatched evidence.`
    );
  } else if (guardFilter) {
    const m = guardFilter.meta as { keptEvidence?: number; droppedEvidence?: number; rejected?: string[] };
    steps.push(
      `4. **Source Identity Guard filtered evidence** — kept ${m.keptEvidence ?? 0}, dropped ${m.droppedEvidence ?? 0}` +
        (m.rejected?.length ? `: ${m.rejected.map((r) => `\`${r}\``).join("; ")}` : "") +
        `.`
    );
  } else {
    steps.push(`4. **Source Identity Guard** — every retrieved source matched the identifier/revision the question asked for; nothing rejected.`);
  }

  // 5 — extraction
  if (row.answer?.status === "source_mismatch") {
    steps.push(
      `5. **Refused instead of extracting** — the pipeline returned a \`source_mismatch\` notice built in code, stating which identifier was asked for and which was retrieved.`
    );
  } else if (row.answer) {
    const a = row.answer;
    const cited = a.citations.length;
    const itemCitations = a.items.flatMap((i) => i.citationIds ?? []).length;
    steps.push(
      `5. **Extracted the answer** — the evidence extractor returned \`status: ${a.status}\` with ${a.items.length} field${a.items.length === 1 ? "" : "s"}, ${itemCitations} per-field citation${itemCitations === 1 ? "" : "s"} against ${cited} evidence passage${cited === 1 ? "" : "s"}.` +
        (a.missing?.length
          ? ` It explicitly reported as unverifiable: ${a.missing.map((m) => `_${m}_`).join("; ")}.`
          : ``)
    );
  } else if (!row.error) {
    // No structured answer: say *why* the extractor did not produce one, since
    // "deterministic" covers three quite different situations.
    const noJson = firstEvent(row, "chat.coordinator.extractor_no_json");
    const parseError = firstEvent(row, "chat.coordinator.extractor_parse_error");
    const llmFailure = row.events.find((e) => e.event.startsWith("llm_client."));
    if (noJson || parseError) {
      steps.push(
        `5. **Extraction fell back** — the extractor was called but its output was unusable (\`${(noJson ?? parseError)!.event}\`), so the deterministic renderer produced the answer above from the ranked passages.`
      );
    } else if (llmFailure) {
      steps.push(
        `5. **Extraction fell back** — the LLM transport failed (\`${llmFailure.event}\`${llmFailure.meta.reason ? `: ${String(llmFailure.meta.reason).slice(0, 120)}` : ""}), so the answer was built deterministically from the ranked passages.`
      );
    } else {
      steps.push(
        `5. **Composed the answer without an LLM** — a deterministic content builder (exact section review / keyword-match extract) answered directly from the ranked passages; no extraction call was made.`
      );
    }
  }

  // 6 — visual evidence fallback
  steps.push(buildVisualFallbackStep(row));

  // 7 — formatting
  const formatterWarn = row.events.find((e) => e.event.startsWith("answer_formatter."));
  if (row.answer?.status === "source_mismatch") {
    steps.push(
      `7. **Formatted for display** — skipped; the formatter is not run on \`source_mismatch\`, so the refusal wording is code-owned.`
    );
  } else if (row.answer) {
    steps.push(
      formatterWarn
        ? `7. **Formatted for display** — the answer formatter output was rejected (\`${formatterWarn.event}\`); the deterministic renderer was used instead.`
        : `7. **Formatted for display** — the answer formatter rewrote the verified fields into display markdown; the source list was appended from real citations, not model output.`
    );
  }

  // 8 — timing
  const t = row.coordinator?.telemetry;
  if (t) {
    steps.push(
      `8. **Cost** — retrieval ${fmtMs(t.retrievalMs)}, synthesis ${fmtMs(t.agentMs)}, total ${fmtMs(t.totalMs ?? row.elapsedMs)}${row.cacheHit ? " (cache hit)" : ""}.`
    );
  } else {
    steps.push(`8. **Cost** — total ${fmtMs(row.elapsedMs)}.`);
  }

  return bulletList(steps);
}

/**
 * Step 6: what the visual evidence fallback did.
 *
 * The trace is read from the answer when present (it carries the full record) and
 * from the log events otherwise, so a question whose visual stage ran on a
 * deterministic refusal path is still accounted for.
 */
function buildVisualFallbackStep(row: ResultRow): string {
  const trace = row.answer?.visualFallback;
  const assessed = firstEvent(row, "visual_fallback.assessed");
  const failed = allEvents(row, "visual_fallback.failed");
  const noEvidence = firstEvent(row, "visual_fallback.no_evidence");
  const completed = firstEvent(row, "visual_fallback.completed");
  const pagesSelected = firstEvent(row, "visual_fallback.pages_selected");

  if (!trace && !assessed) {
    return `6. **Visual evidence fallback** — not reached on this path (no single document was locked, or the flag is off).`;
  }

  const assessment =
    trace?.assessment ??
    ({
      visualLikely: Boolean(assessed?.meta.visualLikely),
      confidence: Number(assessed?.meta.confidence ?? 0),
      reasons: (assessed?.meta.reasons as string[] | undefined) ?? [],
      visualTaskTypes: (assessed?.meta.visualTaskTypes as string[] | undefined) ?? [],
    } satisfies VisualFallbackLike["assessment"]);

  const assessmentBits =
    `question assessed as ${assessment.visualLikely ? "**likely visual**" : "not visual"}` +
    ` (confidence ${assessment.confidence.toFixed(2)}` +
    (assessment.visualTaskTypes.length > 0 ? `, task ${assessment.visualTaskTypes.map((t) => `\`${t}\``).join(", ")}` : "") +
    `)`;

  const triggered = trace?.triggered ?? Boolean(pagesSelected);
  if (!triggered) {
    const reason = trace?.triggerReason ?? "text evidence was sufficient";
    return `6. **Visual evidence fallback** — ${assessmentBits}; not triggered: ${reason}.`;
  }

  const selected = trace?.pagesSelected ?? ((pagesSelected?.meta.pages as number[] | undefined) ?? []);
  const inspected = trace?.pagesInspected ?? ((completed?.meta.pagesInspected as number[] | undefined) ?? []);
  const selectionReasons = (pagesSelected?.meta.reasons as string[] | undefined) ?? [];

  let step =
    `6. **Visual evidence fallback ran** — ${assessmentBits}. Triggered because ${trace?.triggerReason ?? "text evidence did not answer the question"}.` +
    (selected.length > 0 ? ` Pages selected: ${selected.map((p) => `p.${p}`).join(", ")}` : ` No page could be selected`) +
    (selectionReasons.length > 0 ? ` (${selectionReasons.join("; ")})` : "") +
    `.`;

  const failure = trace?.failureReason ?? (failed[0]?.meta.reason as string | undefined);
  if (failure && (trace?.evidence.length ?? 0) === 0) {
    return `${step} The stage could not complete: ${failure}. The answer says the information could not be verified rather than guessing.`;
  }

  if (inspected.length > 0) {
    step += ` Rendered and inspected ${inspected.map((p) => `p.${p}`).join(", ")}.`;
  }

  const evidence = trace?.evidence ?? [];
  if (evidence.length === 0 || trace?.noEvidence || noEvidence) {
    return `${step} Nothing on those pages answered the question (\`visual_fallback.no_evidence\`), so the answer states it could not be verified.`;
  }

  const observations = evidence.flatMap((entry) =>
    entry.observations.map(
      (observation) =>
        `p.${entry.page} — **${observation.field}:** ${observation.value}` +
        (observation.boundingDescription ? ` _(${observation.boundingDescription})_` : "") +
        ` [confidence ${entry.confidence.toFixed(2)}]`
    )
  );

  step += ` Read from the page image: ${observations.join("; ")}.`;

  if (trace?.changedAnswerStatus) {
    step += ` This changed the answer status — the question would otherwise have been refused on the text layer alone.`;
  }

  const visualCitations = (row.answer?.citations ?? []).filter((c) => c.evidenceType === "visual").length;
  if (visualCitations > 0) {
    step += ` ${visualCitations} citation${visualCitations === 1 ? "" : "s"} in the answer are visual, carrying the same document + page deep link as text citations.`;
  }

  if ((row.answer?.conflicts?.length ?? 0) > 0) {
    step += ` The text and the image disagreed on ${row.answer!.conflicts!.map((c) => `\`${c.field}\``).join(", ")}; the conflict was reported for review rather than resolved.`;
  }

  return step;
}

function buildEvidenceBlock(row: ResultRow): string {
  const citations = row.answer?.citations ?? [];
  if (citations.length === 0) return "";
  const lines = citations.map((c) => {
    const where = [c.fileName ?? c.documentName ?? "unknown document", typeof c.page === "number" ? `p. ${c.page}` : null]
      .filter(Boolean)
      .join(" · ");
    // Visual citations are marked so a reader can tell a page observation from a
    // text passage; both deep-link the same way.
    const kind = c.evidenceType === "visual" ? " · 👁 read from the page image" : "";
    const excerpt = (c.evidenceText ?? "").replace(/\s+/g, " ").trim();
    return `- **[${c.id}]** ${where}${kind}${excerpt ? `\n  > ${excerpt}` : ""}`;
  });
  return `**Evidence the model cited:**\n\n${lines.join("\n")}\n\n`;
}

/**
 * Parse the Index table of a previous run's Q&A report into id → status.
 * Used only for a coarse regression check: did each question produce a sourced
 * answer, or a refusal? The old report's status is a keyword heuristic, so it is
 * never compared against the new extractor verdict directly.
 */
function parsePreviousReport(reportPath: string): Map<string, string> {
  const prev = new Map<string, string>();
  if (!fs.existsSync(reportPath)) return prev;
  for (const line of fs.readFileSync(reportPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\|\s*(sq\d+)\s*\|.*\|\s*([^|]+?)\s*\|\s*$/);
    if (match) prev.set(match[1], match[2]);
  }
  return prev;
}

/** Coarse "did this question get a sourced answer" test, comparable across runs. */
function producedSourcedAnswer(row: ResultRow): boolean {
  if (row.error) return false;
  if ((row.sources?.length ?? 0) === 0) return false;
  const status = statusOf(row);
  return status !== "not_found" && status !== "source_mismatch";
}

/** Everything the independent grader contributes to this report. */
interface GradeContext {
  /** Grades for this run, by question id. Empty when no grade file was given. */
  grades: Map<string, GradeRecord>;
  /** Grades for the baseline run, for the grade-based comparison. */
  previousGrades: Map<string, GradeRecord>;
  expectations: Map<string, QuestionExpectation>;
  gradeFileName: string;
  previousGradeFileName: string;
}

function buildReport(
  header: HeaderRow | undefined,
  rows: ResultRow[],
  inputName: string,
  prev: Map<string, string>,
  gradeContext: GradeContext
): string {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(statusOf(row), (counts.get(statusOf(row)) ?? 0) + 1);

  const total = rows.length;
  const pct = (n: number) => (total > 0 ? Math.round((100 * n) / total) : 0);
  const latencies = rows.map((r) => r.elapsedMs).sort((a, b) => a - b);
  const median = latencies.length > 0 ? latencies[Math.floor(latencies.length / 2)] : 0;
  const withSources = rows.filter((r) => (r.sources?.length ?? 0) > 0).length;
  const guardBlocked = rows.filter((r) => firstEvent(r, "chat.source_identity_guard.retry_retrieval")).length;
  const guardFiltered = rows.filter((r) => firstEvent(r, "chat.source_identity_guard.filtered")).length;
  const visualAssessed = rows.filter((r) => firstEvent(r, "visual_fallback.assessed")).length;
  const visualLikely = rows.filter(
    (r) => r.answer?.visualFallback?.assessment.visualLikely || firstEvent(r, "visual_fallback.assessed")?.meta.visualLikely === true
  ).length;
  const visualTriggered = rows.filter(
    (r) => r.answer?.visualFallback?.triggered || firstEvent(r, "visual_fallback.triggered")
  ).length;
  const visualFound = rows.filter((r) => (r.answer?.visualFallback?.evidence.length ?? 0) > 0).length;
  const visualChanged = rows.filter((r) => r.answer?.visualFallback?.changedAnswerStatus).length;
  const visualFailed = rows.filter(
    (r) => r.answer?.visualFallback?.failureReason || firstEvent(r, "visual_fallback.failed")
  ).length;
  const visualConflicts = rows.filter((r) => (r.answer?.conflicts?.length ?? 0) > 0).length;
  const docRoute = rows.filter((r) => firstEvent(r, "chat.coordinator.active_doc_trace")).length;
  const hybridRoute = rows.filter(
    (r) => !firstEvent(r, "chat.coordinator.active_doc_trace") && firstEvent(r, "chat.coordinator.route_summary")
  ).length;
  const shortCircuit = total - docRoute - hybridRoute;

  let md = `# MLJ-017 Package 6 — 97-Question Rerun (current working tree)

**Project:** MLJ-017 Package 6 General · \`${header?.projectId ?? "n/a"}\`
**Run started:** ${header?.startedAt ?? "n/a"}
**Questions:** ${total} (from \`eval/${header?.questionFile ?? "?"}\`)
**Raw run data:** \`eval/${inputName}\` (one JSON record per question, including the full trace)
**Answer model:** \`${String(header?.flags?.chatModel ?? "?")}\` via \`${String(header?.flags?.llmProvider ?? "?")}\`

## Pipeline under test

\`\`\`
question
  → interpretation.service      intent + identifier extraction + retrieval hints
  → identifier lookup           exact-id first when the question names a document
  → retrieval.service           hybrid pgvector + GIN lexical (or single-document chunk ranking)
  → source identity guard       is the retrieved document actually the one asked about?
  → evidence extractor          strict-JSON ExtractedAnswer with per-field citations
  → visual evidence fallback    when text is insufficient and the question is visual:
                                select pages → render → vision → merge text + visual
  → answer formatter            presentation only; sources appended from real citations
\`\`\`

**Flags for this run:** ${Object.entries(header?.flags ?? {})
    .map(([k, v]) => `\`${k}=${String(v)}\``)
    .join(" · ")}

> \`chatAnswerFormatterEnabled\` and \`chatSourceIdentityGuardEnabled\` default to **off** in \`env.ts\`.
> They were switched **on** for this run so the two new stages are actually exercised.

## Summary

| Outcome | Count | % |
|---|---|---|
| ${STATUS_ICON.complete} | ${counts.get("complete") ?? 0} | ${pct(counts.get("complete") ?? 0)}% |
| ${STATUS_ICON.partial} | ${counts.get("partial") ?? 0} | ${pct(counts.get("partial") ?? 0)}% |
| ${STATUS_ICON.not_found} | ${counts.get("not_found") ?? 0} | ${pct(counts.get("not_found") ?? 0)}% |
| ${STATUS_ICON.source_mismatch} | ${counts.get("source_mismatch") ?? 0} | ${pct(counts.get("source_mismatch") ?? 0)}% |
| ${STATUS_ICON.deterministic} | ${counts.get("deterministic") ?? 0} | ${pct(counts.get("deterministic") ?? 0)}% |
| ${STATUS_ICON.error} | ${counts.get("error") ?? 0} | ${pct(counts.get("error") ?? 0)}% |

- **Answers carrying at least one source:** ${withSources}/${total}
- **Median latency:** ${fmtMs(median)} · **slowest:** ${fmtMs(latencies[latencies.length - 1])} · **fastest:** ${fmtMs(latencies[0])}
- **Route split:** ${docRoute} single-document deep read · ${hybridRoute} project-wide hybrid retrieval · ${shortCircuit} short-circuit
- **Source Identity Guard:** blocked ${guardBlocked} answer${guardBlocked === 1 ? "" : "s"} outright, pruned evidence on ${guardFiltered}
- **Visual evidence fallback:** ${visualAssessed} question${visualAssessed === 1 ? "" : "s"} assessed · ${visualLikely} judged likely visual · ${visualTriggered} triggered · ${visualFound} returned page observations · ${visualChanged} changed answer status · ${visualFailed} could not run · ${visualConflicts} reported a text/image conflict

> Status is the extractor's own verdict, not an external grade. \`complete\` means every part of the
> question was answered from cited evidence; \`partial\` means some fields were answered and the rest
> were explicitly listed as unverifiable; \`not_found\` means the right document was located but the
> requested fact was not in it; \`source_mismatch\` means the identity guard refused the evidence.
> \`deterministic\` is not an extractor verdict — it means no structured answer was produced for that
> question (either a deterministic content builder answered it directly, or the extractor's output was
> unusable and the renderer took over). Each such question's step 5 says which.

---
`;

  // The independent grade is a second, unrelated axis: the table above says what
  // the pipeline believes it did, this section says whether the answer was right.
  const gradeRecords = rows
    .map((row) => gradeContext.grades.get(row.id))
    .filter((record): record is GradeRecord => Boolean(record));

  if (gradeRecords.length > 0) {
    const gradeSummary = summarizeGrades(gradeRecords);
    md += `
## Independent answer quality

Graded outside the pipeline by \`eval/grade-independent.ts\` against the reference facts in
\`eval/${path.basename(gradeContext.gradeFileName)}\`. This is a different question from the one the
table above answers. The status column is what the pipeline believes happened; the grade below is
whether the user-visible answer is actually correct. The two are deliberately never merged: an answer
can be \`complete\` and still be FAIL, and it can be \`not_found\` and still be PASS.

`;
    md += renderGradeTotals(gradeSummary);
    md += renderCrossTab(gradeSummary);
    md += renderRootCauses(gradeSummary, gradeRecords);
    md += `---\n`;

    // Grade-based comparison, which replaces the answered/refused heuristic below
    // for any question that has a grade on both sides.
    if (gradeContext.previousGrades.size > 0) {
      const previousRecords = rows
        .map((row) => gradeContext.previousGrades.get(row.id))
        .filter((record): record is GradeRecord => Boolean(record));
      md += `\n${renderComparison(compareGradeRuns(previousRecords, gradeRecords), {
        previousLabel: gradeContext.previousGradeFileName,
        currentLabel: gradeContext.gradeFileName,
        expectedFactsFor: (id) => {
          const expectation = gradeContext.expectations.get(id);
          return expectation ? formatExpectedFacts(expectation) : undefined;
        },
      })}---\n`;
    }
  }

  // Coarse comparison against the previous run of the same 97 questions. Skipped
  // once graded baselines exist on both sides — "answered vs refused" cannot tell
  // a fixed answer from a confidently wrong one, and the grade comparison can.
  if (prev.size > 0 && gradeContext.previousGrades.size === 0) {
    const comparable = rows.filter((r) => prev.has(r.id));
    const nowAnswered = comparable.filter(producedSourcedAnswer);
    const prevAnswered = comparable.filter((r) => (prev.get(r.id) ?? "").includes("answered"));
    const regressions = comparable.filter(
      (r) => (prev.get(r.id) ?? "").includes("answered") && !producedSourcedAnswer(r)
    );
    const improvements = comparable.filter(
      (r) => !(prev.get(r.id) ?? "").includes("answered") && producedSourcedAnswer(r)
    );

    md += `
## Change vs the previous run of the same 97 questions

Previous run: \`eval/mlj017-adjusted-v2-qa-report.md\`. The only metric comparable across the two runs is
"did the question come back with a sourced answer rather than a refusal" — the old report had no
extractor status to compare against.

A question that moved from "answered" to "not found" is **not automatically a regression**: the old
pipeline had no way to say a fact was absent, so an answer assembled from loosely related passages
counted as answered. The new extractor and identity guard refuse in exactly that case. Read each
question's step 4 and 5 before judging the direction of a move.

| | Previous run | This run |
|---|---|---|
| Sourced answer | ${prevAnswered.length}/${comparable.length} | ${nowAnswered.length}/${comparable.length} |
| Refusal / no sources | ${comparable.length - prevAnswered.length}/${comparable.length} | ${comparable.length - nowAnswered.length}/${comparable.length} |

`;
    if (regressions.length > 0) {
      md += `**Now refusing where the previous run answered (${regressions.length}):**\n\n${regressions
        .map((r) => `- [${r.id}](#${r.id}) — ${STATUS_ICON[statusOf(r)]} — ${esc(r.query)}`)
        .join("\n")}\n\n`;
    }
    if (improvements.length > 0) {
      md += `**Now answering where the previous run refused (${improvements.length}):**\n\n${improvements
        .map((r) => `- [${r.id}](#${r.id}) — ${STATUS_ICON[statusOf(r)]} — ${esc(r.query)}`)
        .join("\n")}\n\n`;
    }
    md += `---\n`;
  }

  const hasGrades = gradeRecords.length > 0;
  md += `
## Index

Two independent columns: **Production status** is the pipeline's own verdict, **Grade** is the
external correctness grade. Rows where they disagree are the ones worth reading.

| ID | Question | Production status |${hasGrades ? " Grade | Root cause |" : ""} Sources | Time |${prev.size > 0 ? " Previous run |" : ""}
|---|---|---|${hasGrades ? "---|---|" : ""}---|---|${prev.size > 0 ? "---|" : ""}
`;

  for (const row of rows) {
    const grade = gradeContext.grades.get(row.id);
    const gradeCells = hasGrades
      ? ` ${grade ? GRADE_ICON[grade.grade] : "—"} | ${grade?.categories.length ? grade.categories.map((c) => `\`${c}\``).join(" ") : "—"} |`
      : "";
    md += `| [${row.id}](#${row.id}) | ${esc(row.query)} | ${STATUS_ICON[statusOf(row)]} |${gradeCells} ${row.sources?.length ?? 0} | ${fmtMs(row.elapsedMs)} |${prev.size > 0 ? ` ${prev.get(row.id) ?? "—"} |` : ""}\n`;
  }

  md += `\n---\n\n## Questions, answers, and how each answer was reached\n\n`;

  for (const row of rows) {
    const grade = gradeContext.grades.get(row.id);
    md += `<a id="${row.id}"></a>\n\n### ${row.id} — ${STATUS_ICON[statusOf(row)]}${grade ? ` · ${GRADE_ICON[grade.grade]}` : ""}\n\n`;
    md += `**Q:** ${row.query}\n\n`;

    if (row.error) {
      md += `**A:** _run error_ — \`${row.error}\`\n\n`;
      if (grade) md += `${renderGradeDetail(grade)}`;
      md += `**How the agent got there:**\n\n${buildTrace(row)}\n\n---\n\n`;
      continue;
    }

    md += `**A:**\n\n${(row.content ?? "_(empty)_").trim()}\n\n`;

    if (row.sources?.length) {
      md += `**Sources returned:**\n\n${row.sources
        .map(
          (s) =>
            `- \`${s.fileName ?? "?"}\`${s.pages?.length ? ` — pages ${s.pages.join(", ")}` : ""}${s.pageOrigin ? ` (page provenance: ${s.pageOrigin})` : ""}`
        )
        .join("\n")}\n\n`;
    } else {
      md += `**Sources returned:** _none_\n\n`;
    }

    if (grade) {
      const expectation = gradeContext.expectations.get(row.id);
      md += renderGradeDetail(grade);
      if (expectation) {
        md += `<details><summary>Benchmark reference facts (${expectation.groundTruth}${expectation.provenance ? `, ${expectation.provenance}` : ""})</summary>\n\n\`\`\`text\n${formatExpectedFacts(expectation)}\n\`\`\`\n\n</details>\n\n`;
      }
    }

    md += `**How the agent got there:**\n\n${buildTrace(row)}\n\n`;
    md += buildEvidenceBlock(row);
    md += `---\n\n`;
  }

  return md;
}

/** Paths are resolved against `packages/backend`, matching `run-97-traced.ts`. */
function resolvePath(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(scriptDir, "..", value));
}

/** Read a grades JSONL written by `grade-independent.ts`, keyed by question id. */
function loadGrades(filePath: string): Map<string, GradeRecord> {
  const grades = new Map<string, GradeRecord>();
  if (!filePath || !fs.existsSync(filePath)) return grades;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line) as GradeRecord;
      if (record.id) grades.set(record.id, record);
    } catch {
      // partially written trailing line
    }
  }
  return grades;
}

// Positional args stay as they were; the grader inputs are flags. The grade file
// is picked up automatically when it exists, so the default invocation includes
// the independent grade without needing to be told about it.
const positional: string[] = [];
const flags: Record<string, string> = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (arg.startsWith("--") && argv[i + 1] && !argv[i + 1].startsWith("--")) {
    flags[arg.slice(2)] = argv[i + 1];
    i += 1;
  } else if (!arg.startsWith("--")) {
    positional.push(arg);
  }
}

const inputPath = resolvePath(positional[0] ?? "./eval/mlj017-97-traced-run.jsonl");
const outputPath = resolvePath(positional[1] ?? "./eval/mlj017-97-traced-report.md");
const prevPath = resolvePath(positional[2] ?? "./eval/mlj017-adjusted-v2-qa-report.md");
const gradesPath = resolvePath(flags.grades ?? "./eval/mlj017-97-grades.jsonl");
const prevGradesPath = flags["prev-grades"] ? resolvePath(flags["prev-grades"]) : "";
const expectedPath = resolvePath(flags.expected ?? "./eval/mlj017-97-expected.json");

const lines = fs.readFileSync(inputPath, "utf8").split(/\r?\n/).filter((l) => l.trim().length > 0);
let header: HeaderRow | undefined;
const rows: ResultRow[] = [];
for (const line of lines) {
  const parsed = JSON.parse(line) as HeaderRow | ResultRow;
  if (parsed.kind === "header") header = parsed;
  else rows.push(parsed);
}

const gradeContext: GradeContext = {
  grades: loadGrades(gradesPath),
  previousGrades: loadGrades(prevGradesPath),
  expectations: fs.existsSync(expectedPath) ? loadExpectations(expectedPath) : new Map(),
  gradeFileName: path.basename(gradesPath),
  previousGradeFileName: prevGradesPath ? path.basename(prevGradesPath) : "",
};

fs.writeFileSync(
  outputPath,
  buildReport(header, rows, path.basename(inputPath), parsePreviousReport(prevPath), gradeContext),
  "utf8"
);
console.log(
  `Wrote ${rows.length} questions to ${outputPath}` +
    (gradeContext.grades.size > 0
      ? ` (with ${gradeContext.grades.size} independent grade${gradeContext.grades.size === 1 ? "" : "s"} from ${gradeContext.gradeFileName})`
      : ` (no grade file at ${gradesPath} — run eval/grade-independent.ts to add the independent quality grade)`)
);
