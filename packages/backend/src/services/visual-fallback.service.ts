/**
 * Visual Evidence Fallback.
 *
 * Runs after the document is locked and text evidence has been extracted, when
 * the requested information cannot be answered from text but may exist visually
 * on the page: engineering drawings, construction photos, title blocks,
 * checkboxes, marked-up sheets, schedules, and scans.
 *
 * The stage is deliberately narrow at every step:
 *   Step 2  trigger only when the document is locked, text is insufficient, and
 *           the question (or the shape of the text) points at something visual.
 *   Step 3  select a handful of candidate pages from real signals, never the
 *           whole document.
 *   Step 4  render those pages at a resolution that keeps dimension callouts and
 *           checkboxes legible; the vision model sees the page, not OCR of it.
 *   Step 5  ask one narrow extraction question, with the option set spelled out.
 *   Step 6  return page-scoped structured evidence so a visual claim cites and
 *           deep-links exactly like a text passage.
 *
 * Hallucination safety is the same standard as text extraction: no guessing, no
 * estimating dimensions from scale, no inferring construction activity, and
 * `not_visible` whenever confidence is insufficient.
 *
 * Identity resolution is *not* this stage's concern — it consumes the already
 * locked document.
 */
import type { UUID, VisualEvidence, VisualFallbackTrace, VisualNeedAssessment, VisualTaskType } from "@contractor/shared";
import { getEnv } from "../config/env";
import { logger } from "../lib/logger";
import { callVisionLlm, extractFirstJsonObject } from "./llm-client";
import { isLocalCorpusItemId } from "./local-corpus.utils";
import { onedriveService } from "./onedrive.service";
import { getPdfPageCount, renderPdfPages } from "./pdf-page-render.service";
import { projectService } from "./project.service";
import type { RequestUserContext } from "./service-types";
import { detectLostVisualState, isSuspiciousExtraction } from "./visual-need.utils";

const VISION_MAX_OUTPUT_TOKENS = 1_024;

/** Inspect every page of a document no larger than this when no page hint exists. */
const SHORT_DOCUMENT_PAGE_LIMIT = 4;

/**
 * Evenly spaced pages across `[start, pageCount]`, at most `count` of them.
 *
 * A 27-page photo log has no page hints and no useful text layer, so consecutive
 * pages 2–4 would judge the whole submittal by its first three photos. Spreading
 * the picks covers the document instead.
 */
function spreadPages(start: number, pageCount: number, count: number): number[] {
  const span = pageCount - start + 1;
  if (span <= 0) return [];
  if (span <= count) {
    return Array.from({ length: span }, (_, index) => start + index);
  }
  const step = span / count;
  const pages: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const page = start + Math.floor(index * step);
    if (!pages.includes(page)) pages.push(page);
  }
  return pages;
}

/** A page-ranked text chunk from the locked document, as the coordinator holds it. */
export interface VisualCandidateChunk {
  page?: number;
  text: string;
  score?: number;
  /** True when the chunk cleared the retrieval evidence bar. */
  strongEvidence?: boolean;
}

export interface VisualFallbackRequest {
  question: string;
  projectId: UUID;
  /** The locked document. */
  fileId: UUID;
  fileName: string;
  filePath?: string;
  mimeType?: string;
  /** Display alias used in prompts and citations. */
  documentAlias: string;
  assessment: VisualNeedAssessment;
  /** Ranked text chunks that survived retrieval for this document. */
  textEvidence: VisualCandidateChunk[];
  /** Pages the text answer already cited, when any. */
  citedPages?: number[];
  /** Authenticated user — required to fetch file bytes via Microsoft Graph. */
  user?: RequestUserContext;
}

/** An `ExtractorEvidenceItem`-shaped view of a visual observation set. */
export interface VisualEvidenceItem {
  id: string;
  documentId: string;
  documentName: string;
  fileId?: string;
  fileName?: string;
  page?: number;
  text: string;
  evidenceType: "visual";
  confidence: number;
}

// ---------- Step 2: trigger decision ----------

export interface TriggerDecision {
  trigger: boolean;
  reason: string;
}

/**
 * Decide whether to spend a render + vision call.
 *
 * Requires all three of: a locked document, text evidence that is insufficient /
 * partial / suspicious, and a question that is likely visual — or, independently,
 * text that clearly lists option labels while having lost which one is selected
 * (`detectLostVisualState`), which is a strong visual case even when the question
 * itself reads as a plain lookup.
 */
export function shouldTriggerVisualFallback(input: {
  assessment: VisualNeedAssessment;
  /** The status the text-only pipeline arrived at. */
  textStatus: "complete" | "partial" | "not_found" | "source_mismatch" | "no_evidence";
  textEvidence: VisualCandidateChunk[];
  /** False when the document was not confidently locked. */
  documentLocked: boolean;
  /** PDFs are the only renderable source today. */
  renderable: boolean;
}): TriggerDecision {
  if (!input.documentLocked) {
    return { trigger: false, reason: "document not locked; identity must be resolved before inspecting pages" };
  }
  if (input.textStatus === "source_mismatch") {
    return { trigger: false, reason: "source mismatch; inspecting the wrong document's pages would not help" };
  }
  if (!input.renderable) {
    return { trigger: false, reason: "locked document is not a renderable PDF" };
  }

  const combinedText = input.textEvidence.map((chunk) => chunk.text).join("\n");
  const lostState = detectLostVisualState(combinedText);
  if (lostState && input.textStatus !== "complete") {
    return { trigger: true, reason: `visual state lost in extraction — ${lostState}` };
  }

  if (input.textStatus === "complete") {
    return { trigger: false, reason: "text evidence already answered every requested part" };
  }

  if (!input.assessment.visualLikely) {
    return {
      trigger: false,
      reason: `question is not likely visual (confidence ${input.assessment.confidence.toFixed(2)})`,
    };
  }

  const textInsufficient =
    input.textStatus === "not_found" ||
    input.textStatus === "no_evidence" ||
    input.textStatus === "partial" ||
    input.textEvidence.length === 0 ||
    isSuspiciousExtraction(combinedText);

  if (!textInsufficient) {
    return { trigger: false, reason: "text evidence was sufficient" };
  }

  return {
    trigger: true,
    reason: `text evidence ${input.textStatus === "partial" ? "was incomplete" : "did not contain the answer"} and the question is likely visual (${input.assessment.visualTaskTypes.join(", ")})`,
  };
}

// ---------- Step 3: candidate page selection ----------

export interface PageSelection {
  pages: number[];
  reasons: string[];
}

/**
 * Choose a small candidate page set from whatever signals exist, in priority
 * order: pages the text answer already cited, pages of the top-ranked chunks,
 * then task-shaped defaults (a title block lives on the title page; a scan of a
 * short document can be inspected end to end).
 *
 * Never returns more than `maxPages`. Returns an empty array when there is no
 * defensible page to look at, so the caller can say so rather than rendering a
 * drawing set at random.
 */
export function selectCandidatePages(input: {
  textEvidence: VisualCandidateChunk[];
  citedPages?: number[];
  visualTaskTypes: VisualTaskType[];
  /** Total pages, when known. */
  pageCount?: number | null;
  maxPages: number;
}): PageSelection {
  const reasons: string[] = [];
  const ordered: number[] = [];

  const push = (page: number | undefined, reason: string): void => {
    if (typeof page !== "number" || !Number.isInteger(page) || page < 1) return;
    if (typeof input.pageCount === "number" && page > input.pageCount) return;
    if (ordered.includes(page)) return;
    if (ordered.length >= input.maxPages) return;
    ordered.push(page);
    reasons.push(`p.${page}: ${reason}`);
  };

  for (const page of input.citedPages ?? []) {
    push(page, "cited by the text answer");
  }

  const rankedPages = [...input.textEvidence]
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
    .map((chunk) => chunk.page)
    .filter((page): page is number => typeof page === "number");
  for (const page of rankedPages) {
    push(page, "page of a top-ranked chunk");
  }

  const wantsTitleBlock =
    input.visualTaskTypes.includes("title_block") ||
    input.visualTaskTypes.includes("checkbox") ||
    input.visualTaskTypes.includes("signature");
  if (wantsTitleBlock) {
    push(1, "title block / transmittal marks are on the first page");
  }

  // No page hints at all: a short document can be inspected in full; a long one
  // cannot, and guessing pages in a drawing set is worse than declining.
  if (ordered.length === 0) {
    const pageCount = input.pageCount ?? undefined;
    if (typeof pageCount === "number" && pageCount <= SHORT_DOCUMENT_PAGE_LIMIT) {
      for (let page = 1; page <= pageCount; page += 1) {
        push(page, `short document (${pageCount} pages) — inspecting all pages`);
      }
    } else if (wantsTitleBlock) {
      push(1, "no page signals available; the requested marks are on the first page");
    } else if (typeof pageCount === "number") {
      // Construction submittals lead with a transmittal cover sheet, so page 1 is
      // the least likely page to hold a photograph or a drawing detail. Sample
      // from page 2 onward, spread across the document.
      for (const page of spreadPages(2, pageCount, input.maxPages)) {
        push(page, `no page signals available; sampling past the cover sheet of a ${pageCount}-page document`);
      }
    } else {
      push(1, "no page signals and no page count available; inspecting the first page only");
    }
  }

  return { pages: ordered, reasons };
}

// ---------- Step 5: narrow vision prompts ----------

const VISION_SYSTEM_PROMPT = [
  "You are reading a single rendered page from a construction project document in order to answer one narrow question.",
  "",
  "## Evidence standard",
  "* Report only what is visibly present on the page image.",
  "* Do not guess. Do not infer. Do not complete partially legible text.",
  "* Do not estimate dimensions by measuring or scaling the drawing. Report a dimension only when it is written on the page.",
  "* Do not infer construction activity, progress, or intent that is not visible.",
  "* Do not read a blurry or ambiguous mark as definite text or as a definite selection.",
  "* Do not use the document's filename, title, or your own knowledge as a substitute for what the page shows.",
  "* Preserve units, spellings, and identifiers exactly as printed.",
  "* When the requested information cannot be determined from the image, return NOT_VISIBLE rather than a best guess.",
  "",
  "## Output",
  "Return valid JSON only, with this exact shape:",
  "{",
  '  "visible": true,',
  '  "confidence": 0.0,',
  '  "observations": [ { "field": "What was read", "value": "Exactly what the page shows", "where": "Where on the page it appears" } ],',
  '  "not_visible_reason": "Only when visible is false: what prevented a determination"',
  "}",
  "",
  'Set "visible": false with an empty observations array when the answer is not determinable from this page.',
  '"confidence" is your confidence that the observations are read correctly, from 0.0 to 1.0. Use a value below 0.5 when any part is uncertain.',
].join("\n");

/** Task-specific instruction blocks. Keep each one an extraction task, not a summary task. */
function taskInstructions(taskTypes: VisualTaskType[]): string[] {
  const lines: string[] = [];

  if (taskTypes.includes("photo")) {
    lines.push(
      "This page is (or contains) a photograph.",
      "Describe only the construction conditions relevant to the question that are visibly present in the image.",
      "Do not infer work that is not visible. Do not state what stage the work has reached unless the image shows it."
    );
  }
  if (taskTypes.includes("drawing")) {
    lines.push(
      "This page is a drawing.",
      "Extract only dimensions, labels, notes, and mounting details that are visibly written on the drawing and associated with the subject of the question.",
      "Preserve units exactly as printed. Do not estimate any dimension from the drawing scale."
    );
  }
  if (taskTypes.includes("checkbox")) {
    lines.push(
      "The question is about a selection state.",
      "Distinguish the printed list of options from the option that is visibly selected (a tick, cross, filled box, circle, or handwritten mark).",
      "Identify ONLY the option that is visibly selected. If no mark is visible, or the mark is ambiguous, return NOT_VISIBLE.",
      "Do not infer the selection from the document filename or from which option is listed first."
    );
  }
  if (taskTypes.includes("title_block")) {
    lines.push(
      "Read the title block / stamp region.",
      "Report revision, date, sheet number, drawn/checked/approved names, and stamp text exactly as printed, and only the fields the question asks for."
    );
  }
  if (taskTypes.includes("signature")) {
    lines.push(
      "Report whether a signature or initials are visibly present, and any printed name or date beside them.",
      "Do not attempt to read a signature's handwriting as a name unless it is legibly printed."
    );
  }
  if (taskTypes.includes("markup")) {
    lines.push(
      "Report annotations, redlines, revision clouds, and handwritten notes that are visibly on the page, quoting the annotation text where legible."
    );
  }
  if (taskTypes.includes("table") || taskTypes.includes("scan")) {
    lines.push(
      "Read the relevant rows and columns as laid out on the page, keeping each value with its row and column heading."
    );
  }

  if (lines.length === 0) {
    lines.push(
      "Extract only the information the question asks for, exactly as it appears on the page."
    );
  }

  return lines;
}

/**
 * Options a selection-state question is choosing between, harvested from the
 * extracted text. Giving the model the printed option set is what turns "what
 * does this page say" into a narrow "which of these is marked" task.
 */
export function extractOptionSet(textEvidence: VisualCandidateChunk[]): string[] {
  const combined = textEvidence.map((chunk) => chunk.text).join("\n");
  const options = new Set<string>();

  // Lines that read as a standalone option label: short, no sentence
  // punctuation, and not a page/sheet artefact.
  for (const rawLine of combined.split(/\r?\n/)) {
    const line = rawLine.replace(/^[\s\-•*□☐()[\]]+/, "").replace(/[\s:.]+$/, "").trim();
    if (line.length < 4 || line.length > 60) continue;
    if (/[.;!?]/.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    if (/\b(page|sheet|rev|date|of)\b\s*\d/i.test(line)) continue;
    if (!/[A-Za-z]{3,}/.test(line)) continue;
    if (
      /\b(review|comment|approval|approved|information only|as noted|rejected|resubmit|no exceptions?|yes|no)\b/i.test(
        line
      )
    ) {
      options.add(line);
    }
  }

  return Array.from(options).slice(0, 12);
}

/** Build the narrow per-page user prompt (Step 5). */
export function buildVisionPrompt(input: {
  question: string;
  documentAlias: string;
  fileName: string;
  page: number;
  visualTaskTypes: VisualTaskType[];
  textEvidence: VisualCandidateChunk[];
}): string {
  const sections: string[] = [
    `Question:\n${input.question}`,
    "",
    `Locked document: ${input.documentAlias} (file: ${input.fileName})`,
    `Page: ${input.page}`,
    "",
    "Inspect the rendered page image visually and answer only the question above.",
    "",
    ...taskInstructions(input.visualTaskTypes),
  ];

  const options = input.visualTaskTypes.includes("checkbox")
    ? extractOptionSet(input.textEvidence)
    : [];
  if (options.length > 0) {
    sections.push(
      "",
      "Options printed on this document (from its extracted text — presence in this list does NOT mean an option is selected):",
      ...options.map((option) => `- ${option}`),
      "",
      "Identify ONLY the option that is visibly selected. If the selected state cannot be determined, return NOT_VISIBLE."
    );
  }

  const pageText = input.textEvidence
    .filter((chunk) => chunk.page === input.page)
    .map((chunk) => chunk.text.replace(/\s+/g, " ").trim())
    .join(" ")
    .slice(0, 900);
  if (pageText.length > 0 && options.length === 0) {
    sections.push(
      "",
      "Text already extracted from this page (context only — do not repeat it as an observation unless the image confirms it):",
      pageText
    );
  }

  return sections.join("\n");
}

// ---------- Step 6: structured visual evidence ----------

/**
 * Parse a vision completion into page-scoped `VisualEvidence`. Returns null on
 * `NOT_VISIBLE`, unparseable output, or an empty observation set — all of which
 * mean "this page did not answer the question", never "guess".
 */
export function parseVisualEvidence(
  raw: string,
  context: { fileId: string; page: number }
): VisualEvidence | null {
  if (/^\s*NOT_VISIBLE\s*$/i.test(raw)) return null;

  const jsonText = extractFirstJsonObject(raw);
  if (!jsonText) return null;

  let parsed: Record<string, unknown>;
  try {
    const value = JSON.parse(jsonText) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    parsed = value as Record<string, unknown>;
  } catch {
    return null;
  }

  if (parsed.visible === false) return null;

  const rawObservations = Array.isArray(parsed.observations) ? parsed.observations : [];
  const observations = rawObservations
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const obj = entry as Record<string, unknown>;
      const field = typeof obj.field === "string" ? obj.field.trim() : "";
      const value = typeof obj.value === "string" ? obj.value.trim() : "";
      if (!value) return null;
      // A model that emits the sentinel inside an observation is still saying
      // "not visible"; do not let it through as a finding.
      if (/^not[_\s]?visible$/i.test(value)) return null;
      const where = typeof obj.where === "string" ? obj.where.trim() : "";
      return {
        field: field || "Observation",
        value,
        ...(where ? { boundingDescription: where } : {}),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (observations.length === 0) return null;

  const rawConfidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
  const confidence = Math.max(0, Math.min(1, rawConfidence));

  return {
    fileId: context.fileId,
    page: context.page,
    evidenceType: "visual",
    confidence,
    observations,
  };
}

/** Render visual evidence as extractor-consumable evidence items. */
export function visualEvidenceToEvidenceItems(
  evidence: VisualEvidence[],
  context: { documentAlias: string; fileName: string; startIndex: number }
): VisualEvidenceItem[] {
  return evidence.map((entry, index) => ({
    id: `v${context.startIndex + index + 1}`,
    documentId: context.documentAlias,
    documentName: context.documentAlias,
    fileId: entry.fileId,
    fileName: context.fileName,
    page: entry.page,
    evidenceType: "visual" as const,
    confidence: entry.confidence,
    text: entry.observations
      .map((observation) => {
        const where = observation.boundingDescription ? ` [seen: ${observation.boundingDescription}]` : "";
        return `${observation.field}: ${observation.value}${where}`;
      })
      .join("\n"),
  }));
}

/**
 * Deterministic conflict check for the selection case (Step 7).
 *
 * When the extracted text *did* preserve a selection marker naming one option and
 * the visual pass reports a different option as selected, that is a direct
 * contradiction. Visual interpretation must not silently win, so it is reported
 * for review.
 */
export function detectSelectionConflicts(
  textEvidence: VisualCandidateChunk[],
  visualEvidence: VisualEvidence[]
): Array<{ field: string; textValue: string; visualValue: string }> {
  const conflicts: Array<{ field: string; textValue: string; visualValue: string }> = [];
  const combined = textEvidence.map((chunk) => chunk.text).join("\n");

  // A preserved marker looks like "[X] NYCT/MTA Approval" or "☑ Designer Approval".
  const markerPattern = /(?:\[\s*[xX✓✔]\s*\]|\(\s*[xX✓✔]\s*\)|[☑☒✅✔✓])\s*([A-Za-z][A-Za-z0-9/&,'.\- ]{3,60})/g;
  const textSelected = [...combined.matchAll(markerPattern)].map((match) => match[1].trim());
  if (textSelected.length === 0) return conflicts;

  const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  for (const evidence of visualEvidence) {
    for (const observation of evidence.observations) {
      if (!/select|check|mark|designation|option/i.test(`${observation.field} ${observation.value}`)) {
        continue;
      }
      const visualValue = normalize(observation.value);
      if (!visualValue) continue;
      const agrees = textSelected.some((candidate) => {
        const textValue = normalize(candidate);
        return textValue.includes(visualValue) || visualValue.includes(textValue);
      });
      if (!agrees) {
        conflicts.push({
          field: observation.field,
          textValue: textSelected.join("; "),
          visualValue: observation.value,
        });
      }
    }
  }

  return conflicts;
}

// ---------- Source resolution ----------

/**
 * Resolve the locked document's PDF bytes via Microsoft Graph.
 *
 * Requires `user` context to obtain an access token. When no user is provided
 * (e.g. in test scenarios without OneDrive), the stage reports
 * `source_unavailable` instead of pretending it looked.
 */
async function resolvePdfBytes(
  input: {
    projectId: UUID;
    fileId: UUID;
    filePath?: string;
    mimeType?: string;
    fileName: string;
  },
  user: RequestUserContext | undefined
): Promise<{ pdfBytes: Buffer } | { error: string }> {
  const isPdf =
    (input.mimeType ?? "").toLowerCase().includes("pdf") || /\.pdf$/i.test(input.fileName);
  if (!isPdf) {
    return { error: "locked document is not a PDF" };
  }

  if (!user) {
    return { error: "source_unavailable: user context required to fetch file via Microsoft Graph" };
  }

  const file = await projectService.getProjectFileById(input.projectId, input.fileId).catch(() => null);
  const onedriveItemId = file?.onedriveItemId;
  const filePath = file?.filePath ?? input.filePath;

  try {
    if (isLocalCorpusItemId(onedriveItemId)) {
      if (!filePath) {
        return { error: "source_unavailable: file path is missing for local corpus item" };
      }
      const content = await onedriveService.downloadFileContentByPath(user, filePath);
      if (!content) {
        return { error: "source_unavailable: file not found in connected OneDrive" };
      }
      return { pdfBytes: content.buffer };
    }

    if (!onedriveItemId) {
      return { error: "source_unavailable: no OneDrive item ID" };
    }

    const project = await projectService.getProjectOrThrow(input.projectId).catch(() => null);
    const graphDriveId = project?.onedriveDriveId;
    const content = graphDriveId
      ? await onedriveService.downloadFileContentByDriveItem(user, graphDriveId, onedriveItemId)
      : await onedriveService.downloadFileContent(user, onedriveItemId);
    return { pdfBytes: content.buffer };
  } catch (error) {
    return { error: `source_unavailable: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// ---------- Orchestration ----------

/**
 * Run the visual fallback end to end and return a trace of what it did.
 *
 * Always resolves — never throws — so the caller can fold the trace into its
 * answer whether the stage found evidence, found nothing, or could not run.
 */
export async function runVisualFallback(
  request: VisualFallbackRequest,
  trigger: TriggerDecision
): Promise<VisualFallbackTrace> {
  const base: VisualFallbackTrace = {
    assessment: request.assessment,
    triggered: trigger.trigger,
    triggerReason: trigger.reason,
    pagesSelected: [],
    pagesInspected: [],
    evidence: [],
  };

  if (!trigger.trigger) {
    return base;
  }

  logger.info("visual_fallback.triggered", {
    fileId: request.fileId,
    fileName: request.fileName,
    reason: trigger.reason,
    visualTaskTypes: request.assessment.visualTaskTypes,
    confidence: Number(request.assessment.confidence.toFixed(2)),
  });

  const source = await resolvePdfBytes({
    projectId: request.projectId,
    fileId: request.fileId,
    ...(request.filePath ? { filePath: request.filePath } : {}),
    ...(request.mimeType ? { mimeType: request.mimeType } : {}),
    fileName: request.fileName,
  }, request.user);
  if ("error" in source) {
    logger.warn("visual_fallback.failed", {
      fileId: request.fileId,
      fileName: request.fileName,
      stage: "source_resolution",
      reason: source.error,
    });
    return { ...base, failureReason: source.error };
  }

  const env = getEnv();
  const pageCount = await getPdfPageCount({ pdfBytes: source.pdfBytes });
  const selection = selectCandidatePages({
    textEvidence: request.textEvidence,
    ...(request.citedPages ? { citedPages: request.citedPages } : {}),
    visualTaskTypes: request.assessment.visualTaskTypes,
    pageCount,
    maxPages: env.chatVisualFallbackMaxPages,
  });

  logger.info("visual_fallback.pages_selected", {
    fileId: request.fileId,
    fileName: request.fileName,
    pages: selection.pages,
    reasons: selection.reasons,
    pageCount,
    maxPages: env.chatVisualFallbackMaxPages,
  });

  if (selection.pages.length === 0) {
    return { ...base, failureReason: "no defensible candidate page could be selected" };
  }

  const rendered = await renderPdfPages({ pdfBytes: source.pdfBytes }, selection.pages, {
    dpi: env.chatVisualFallbackDpi,
  });

  if (rendered.length === 0) {
    logger.warn("visual_fallback.failed", {
      fileId: request.fileId,
      fileName: request.fileName,
      stage: "render",
      reason: "no page could be rendered (is poppler-utils / PDFTOPPM_PATH available?)",
      pages: selection.pages,
    });
    return {
      ...base,
      pagesSelected: selection.pages,
      failureReason: "page rendering is unavailable in this environment",
    };
  }

  const evidence: VisualEvidence[] = [];
  const inspected: number[] = [];

  for (const image of rendered) {
    inspected.push(image.page);
    const prompt = buildVisionPrompt({
      question: request.question,
      documentAlias: request.documentAlias,
      fileName: request.fileName,
      page: image.page,
      visualTaskTypes: request.assessment.visualTaskTypes,
      textEvidence: request.textEvidence,
    });

    const completion = await callVisionLlm(
      {
        system: VISION_SYSTEM_PROMPT,
        prompt,
        images: [{ base64: image.base64, mediaType: image.mediaType }],
      },
      {
        temperature: 0,
        maxTokens: VISION_MAX_OUTPUT_TOKENS,
        timeoutMs: env.chatVisualFallbackTimeoutMs,
      }
    );

    if (!completion) {
      logger.warn("visual_fallback.failed", {
        fileId: request.fileId,
        fileName: request.fileName,
        stage: "vision_call",
        page: image.page,
        reason: "vision model returned no completion",
      });
      continue;
    }

    const pageEvidence = parseVisualEvidence(completion, {
      fileId: request.fileId,
      page: image.page,
    });
    if (pageEvidence) {
      evidence.push(pageEvidence);
    }
  }

  if (evidence.length === 0) {
    logger.info("visual_fallback.no_evidence", {
      fileId: request.fileId,
      fileName: request.fileName,
      pagesInspected: inspected,
      visualTaskTypes: request.assessment.visualTaskTypes,
    });
    return {
      ...base,
      pagesSelected: selection.pages,
      pagesInspected: inspected,
      noEvidence: true,
    };
  }

  logger.info("visual_fallback.completed", {
    fileId: request.fileId,
    fileName: request.fileName,
    pagesInspected: inspected,
    visualTaskTypes: request.assessment.visualTaskTypes,
    observations: evidence.flatMap((entry) =>
      entry.observations.map((observation) => ({
        page: entry.page,
        field: observation.field,
        value: observation.value.slice(0, 160),
      }))
    ),
    confidence: evidence.map((entry) => Number(entry.confidence.toFixed(2))),
  });

  return {
    ...base,
    pagesSelected: selection.pages,
    pagesInspected: inspected,
    evidence,
  };
}

/** Log the Step 1 assessment for every question, answered visually or not. */
export function logVisualNeedAssessment(
  question: string,
  assessment: VisualNeedAssessment,
  context: { fileId?: string; fileName?: string }
): void {
  logger.info("visual_fallback.assessed", {
    ...context,
    queryPreview: question.slice(0, 180),
    visualLikely: assessment.visualLikely,
    confidence: Number(assessment.confidence.toFixed(2)),
    visualTaskTypes: assessment.visualTaskTypes,
    reasons: assessment.reasons,
  });
}
