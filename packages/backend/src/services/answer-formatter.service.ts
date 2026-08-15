import type { ExtractedAnswer } from "@contractor/shared";
import { buildCitationHref } from "@contractor/shared";
import { logger } from "../lib/logger";
import { callChatLlm } from "./llm-client";

/**
 * User-Facing Answer Formatter.
 *
 * The presentation stage that runs after the evidence extractor has produced a
 * verified `ExtractedAnswer`. The model receives only already-extracted facts
 * (labels, values, what could not be verified) plus numbered source markers,
 * and returns polished display markdown.
 *
 * Provenance is deliberately NOT the model's job: the compact `**Source:**` line
 * is appended here from the answer's real citations, and any citation marker the
 * model emits outside the supplied range is stripped. That keeps document names
 * and page numbers impossible to invent while still allowing adaptive prose.
 *
 * Returns null whenever formatting is unavailable or unusable, so callers fall
 * back to the deterministic renderer.
 */

const FORMATTER_MAX_OUTPUT_TOKENS = 900;

export const ANSWER_FORMATTER_SYSTEM_PROMPT = [
  "You are the final answer formatter for a document question-answering system.",
  "The facts below have already been extracted and verified. Your only job is to make them concise, clear, natural, and easy to scan without changing anything they say.",
  "",
  "## Core Rules",
  "* Answer the question immediately. Put the most important fact in the first sentence or first bullet.",
  "* Never open with reasoning, process, or how the answer was found.",
  "* Use the minimum text needed to fully answer. Do not repeat the question.",
  "* Avoid filler such as:",
  '  * "Based on the available evidence..."',
  '  * "The document indicates that..."',
  '  * "The retrieved source shows..."',
  '  * "Key requirements captured from the section..."',
  '  * "Reviewed indexed evidence..."',
  "* Preserve verified facts exactly. Never add or infer a fact, and never change a number, date, name, quantity, status, or technical term. Formatting may change; meaning may not.",
  "* You may reword for clarity, merge related items, and reorder for readability.",
  "",
  "## Formatting",
  "* One fact: a short sentence.",
  "* Two to five facts: bullets.",
  "* Comparisons, schedules, quantities, or several repeated fields: a compact table, but only when it genuinely improves readability.",
  "* No heading on a very short answer.",
  "* Bold important names, dates, quantities, dimensions, statuses, and conclusions.",
  "* Use short, clear labels. Prefer **Date:** March 26, 2025 over **The date on which the approval was officially issued:**.",
  "* Rewrite scanned or fragmented text into normal English, and fix capitalization and spacing in document names.",
  "* Do not dump raw source text unless the user asked for the exact wording.",
  "* Do not include information that does not help answer the question.",
  "",
  "## Citations",
  "* Cite only with the numeric markers supplied (e.g. [1]). Never invent a marker number.",
  "* Put each marker directly after the fact it supports, at the end of that sentence or bullet.",
  "* Do not attach a marker to a statement about missing information.",
  "* Do not write a Source or Sources line. The source reference is appended automatically after your output, so writing your own would duplicate it.",
  "",
  "## Complete Answers",
  "If everything requested was verified, answer directly:",
  "",
  "**Invoice 11830**",
  "",
  "* **Unit price:** $350 per pest-control visit. [1]",
  "* **Total amount due:** $1,400. [1]",
  "",
  "## Partial Answers",
  "Give everything that was found, and separate it clearly from what could not be verified:",
  "",
  "* **Verified:** Ahern was assigned to send MLJTC2 a draft agreement for access to the shielding. [1]",
  "* **Not verified:** No additional shielding-removal action items assigned to Ahern were confirmed in the available source.",
  "",
  "Never speculate about the missing information, and never turn a partial answer into a generic refusal.",
  "",
  "## Tables",
  "Use a compact markdown table when the question asks for several comparable technical values:",
  "",
  "| Item | Requirement |",
  "| ---- | ----------- |",
  "| Pipe material | Schedule 40 galvanized steel |",
  "| Working pressure | 300 psi |",
  "| Test pressure | 200 psi |",
  "",
  "Do not use a table for a simple two- or three-field answer.",
  "",
  "## Nothing Found",
  "Keep it short and helpful:",
  '* "I found the referenced document, but I couldn\'t verify any stated cost savings or schedule benefits from the available content."',
  "",
  "If the missing information is likely visual and the payload does NOT report a visual inspection, say:",
  '* "I found the correct document, but this information could not be verified from the extracted text. It may require reviewing the drawing, table, photo, markup, or scanned page visually."',
  "",
  "If the payload reports that pages WERE inspected visually and the detail still was not found, say so — never suggest a review that has already happened:",
  '* "I found the correct document, but the requested dimension could not be verified from the extracted text or from visual inspection of pages 4 and 5."',
  "",
  "If the payload reports a visual inspection that could not be performed, say:",
  '* "I found the correct document, but this information could not be verified from the extracted text, and the page could not be inspected."',
  "",
  "## Conflicts",
  "When the payload lists an unresolved conflict, report both readings and do not choose between them:",
  '* "**Conflict — selected designation:** the document text reads \\"Designer Approval\\" while the page image shows \\"NYCT/MTA Approval\\". This needs review; I have not picked a side."',
  "",
  "If the supplied facts do not actually answer the question, say so plainly instead of presenting nearby text as the answer.",
  "",
  "## Never Expose Internal Language",
  "Do not use words such as: ranked passages, indexed section evidence, retrieval candidates, deterministic answer, extractor, chunk, node, semantic search, keyword match, embeddings, reranking, context window, routing, or internal validation.",
  "",
  "Never say:",
  '* "I could not find an exact indexed passage."',
  '* "No evidence-backed specification text was verified."',
  '* "Refine with a section heading."',
  '* "Top files..."',
  '* "Routed focus..."',
  '* "NODE 4..."',
  "",
  "Instead, use plain language:",
  '* "The supplier could not be verified from the available source."',
  '* "The document does not state a next meeting date."',
  '* "The available pages do not show the requested dimension."',
  "",
  "## Length",
  "Normal factual answer: under about 100 words. Complex summary: approximately 100-200 words.",
  "Only go longer when the user explicitly asks for detailed analysis.",
  "",
  "## Before You Answer",
  "Silently check: does it answer the exact question, is the answer visible in the first few lines, can any sentence or heading be removed without losing information, are the facts clearly labeled, are markers attached to the claims they support, is all process language gone, and is anything repeated?",
  "A busy construction professional should understand it in under ten seconds.",
  "",
  "## Output",
  "Return only the polished markdown answer. No JSON, no code fence around the whole answer, no commentary about what you did.",
].join("\n");

/** A citation rendered as a numbered marker in the answer body. */
export interface AnswerFormatterSource {
  /** 1-based marker shown to the user, e.g. 1 renders as `[1]`. */
  marker: number;
  /** Extractor citation id this marker stands for, e.g. "c2". */
  citationId: string;
  /** Document identifier or short-form name shown in the source list. */
  label: string;
  page?: number;
  /** Deep link that opens the cited page in the document viewer. */
  url?: string;
}

export interface FormatAnswerInput {
  question: string;
  answer: ExtractedAnswer;
}

export interface FormatAnswerOptions {
  timeoutMs?: number;
  maxTokens?: number;
  /**
   * Override how a citation's "View source" link is built. Defaults to the
   * shared citation deep link, which the chat UI intercepts to open the document
   * viewer at the cited page.
   */
  sourceUrlFor?: (citation: ExtractedAnswer["citations"][number]) => string | undefined;
}

/** Deep-link a citation into the viewer. Undefined when the source file is unknown. */
function defaultSourceUrl(citation: ExtractedAnswer["citations"][number]): string | undefined {
  if (!citation.fileId) return undefined;
  return buildCitationHref({
    fileId: citation.fileId,
    ...(typeof citation.page === "number" ? { page: citation.page } : {}),
  });
}

/**
 * Number the answer's citations in order of first use, so marker [1] is the
 * source supporting the first fact the user reads.
 */
export function buildFormatterSources(
  answer: ExtractedAnswer,
  options?: Pick<FormatAnswerOptions, "sourceUrlFor">
): AnswerFormatterSource[] {
  const byId = new Map(answer.citations.map((citation) => [citation.id, citation]));
  const ordered: string[] = [];

  for (const item of answer.items) {
    for (const id of item.citationIds ?? []) {
      if (byId.has(id) && !ordered.includes(id)) ordered.push(id);
    }
  }
  for (const citation of answer.citations) {
    if (!ordered.includes(citation.id)) ordered.push(citation.id);
  }

  return ordered.map((id, index) => {
    const citation = byId.get(id)!;
    const label = citation.documentId ?? citation.documentName ?? "Unknown source";
    const url = options?.sourceUrlFor ? options.sourceUrlFor(citation) : defaultSourceUrl(citation);
    return {
      marker: index + 1,
      citationId: id,
      label,
      ...(typeof citation.page === "number" ? { page: citation.page } : {}),
      ...(url ? { url } : {}),
    };
  });
}

/**
 * Render the compact source reference from ground-truth citations, e.g.
 * `**Source:** [Invoice 11830](…), p. 1`. The document title carries the deep
 * link so a single-source answer stays one scannable line and still opens the
 * cited page. Several documents get one short line each, prefixed with the
 * marker used in the body so a reader can tell which fact came from which.
 */
export function renderSourceLine(sources: AnswerFormatterSource[]): string {
  if (sources.length === 0) return "";

  const entry = (source: AnswerFormatterSource): string => {
    const title = source.url ? `[${source.label}](${source.url})` : source.label;
    return typeof source.page === "number" ? `${title}, p. ${source.page}` : title;
  };

  if (sources.length === 1) return `**Source:** ${entry(sources[0])}`;

  return [
    "**Sources:**",
    "",
    sources.map((source) => `* [${source.marker}] ${entry(source)}`).join("\n"),
  ].join("\n");
}

/** Build the structured payload the formatter prompt consumes. */
export function buildAnswerFormatterUserMessage(
  input: FormatAnswerInput,
  sources: AnswerFormatterSource[]
): string {
  const markerFor = new Map(sources.map((source) => [source.citationId, source.marker]));

  const facts = input.answer.items.map((item) => {
    const markers = (item.citationIds ?? [])
      .map((id) => markerFor.get(id))
      .filter((marker): marker is number => typeof marker === "number")
      .map((marker) => `[${marker}]`);
    const label = item.label && item.label !== "Detail" ? `${item.label}: ` : "";
    const cited = markers.length > 0 ? ` (cite ${markers.join(", ")})` : "";
    return `- ${label}${item.value}${cited}`;
  });

  const sourceList = sources.map((source) => {
    const page = typeof source.page === "number" ? ` — p. ${source.page}` : "";
    return `[${source.marker}] ${source.label}${page}`;
  });

  const blocks = [
    `Question:\n${input.question.trim()}`,
    "",
    `Answer completeness: ${input.answer.status}`,
    `Suggested topic: ${input.answer.title}`,
  ];

  if (input.answer.summary) {
    blocks.push(`Direct answer: ${input.answer.summary}`);
  }

  blocks.push("", "Verified facts:", facts.length > 0 ? facts.join("\n") : "(none)");

  if (input.answer.missing && input.answer.missing.length > 0) {
    blocks.push(
      "",
      "Could not be verified (state these concisely, without a citation marker):",
      input.answer.missing.map((entry) => `- ${entry}`).join("\n")
    );
  }

  // Whether the pages were actually looked at changes what an honest refusal can
  // claim, so the formatter is told rather than left to guess.
  const visual = input.answer.visualFallback;
  if (visual?.triggered) {
    if (visual.pagesInspected.length > 0) {
      blocks.push(
        "",
        `Visual inspection: page ${visual.pagesInspected.join(", ")} of this document ${visual.evidence.length > 0 ? "was inspected visually and the facts above include what the image showed" : "was inspected visually and did not show the requested detail"}.`,
        "If information is still missing, say it could not be verified from the text or from visual inspection of those pages. Do not suggest reviewing them visually — that has already been done."
      );
    } else {
      blocks.push(
        "",
        `Visual inspection: could not be performed (${visual.failureReason ?? "unavailable"}).`,
        "If information is missing, say it could not be verified from the extracted text and that the page could not be inspected."
      );
    }
  }

  if (input.answer.conflicts && input.answer.conflicts.length > 0) {
    blocks.push(
      "",
      "Unresolved conflicts (report both sides; do not pick one, and do not present either as verified):",
      input.answer.conflicts
        .map(
          (conflict) =>
            `- ${conflict.field}: the extracted text says "${conflict.textValue}", the page image shows "${conflict.visualValue}"`
        )
        .join("\n")
    );
  }

  blocks.push("", "Available citation markers:", sourceList.length > 0 ? sourceList.join("\n") : "(none)");

  return blocks.join("\n");
}

/** Internal terminology that must never reach the user; its presence fails the format. */
const FORBIDDEN_TERMS = [
  "retrieval",
  "retrieved context",
  "indexed passage",
  "indexed evidence",
  "ranked passage",
  "chunk",
  "embedding",
  "reranker",
  "semantic search",
  "keyword match",
  "deterministic answer",
  "context window",
  "routed focus",
  "top files",
];

/**
 * A source line or section the model wrote despite instructions: a `### Sources`
 * heading or a `**Source:**` / `**Sources:**` label, with or without a leading
 * bullet. Requiring the label to close right after the word keeps a real fact
 * like `**Source of water:**` from being mistaken for provenance.
 */
const MODEL_WRITTEN_SOURCE_LINE = /^\s*(?:[-*+]\s+)?(?:#{1,6}\s*sources?\b|\*\*sources?\s*:?\*\*)/i;

/**
 * Clean the model's markdown: unwrap a whole-answer code fence, drop any source
 * line it wrote despite instructions (we append our own), and remove citation
 * markers outside the supplied range. Returns null when nothing usable is left.
 */
export function sanitizeFormattedAnswer(raw: string, sources: AnswerFormatterSource[]): string | null {
  let text = raw.trim();

  const fenced = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```$/.exec(text);
  if (fenced) {
    text = fenced[1].trim();
  }

  // Cut a model-written source reference and anything after it.
  const lines = text.split(/\r?\n/);
  const sourceLineIndex = lines.findIndex((line) => MODEL_WRITTEN_SOURCE_LINE.test(line));
  if (sourceLineIndex >= 0) {
    text = lines.slice(0, sourceLineIndex).join("\n").trim();
  }

  // Strip markers that reference a source we never supplied. `(?!\()` keeps
  // ordinary markdown links like [1](url) — and footnote-shaped links — intact.
  const maxMarker = sources.length;
  text = text.replace(/\[(\d{1,2})\](?!\()/g, (match, digits: string) => {
    const marker = Number.parseInt(digits, 10);
    return marker >= 1 && marker <= maxMarker ? match : "";
  });

  text = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.length > 0 ? text : null;
}

/**
 * Turn inline `[1]` markers into links that open the cited page in the viewer,
 * so a reader can verify a specific claim without hunting the source list.
 * Markers whose source has no resolvable file are left as plain text.
 */
export function linkCitationMarkers(text: string, sources: AnswerFormatterSource[]): string {
  const urlByMarker = new Map(
    sources.filter((source) => source.url).map((source) => [source.marker, source.url as string])
  );
  if (urlByMarker.size === 0) return text;

  // The lookbehind skips a marker that is already the label of a link
  // (`[[1]](url)`), keeping this idempotent.
  return text.replace(/(?<!\[)\[(\d{1,2})\](?!\()/g, (match, digits: string) => {
    const url = urlByMarker.get(Number.parseInt(digits, 10));
    return url ? `[${match}](${url})` : match;
  });
}

/** True when the formatted answer leaks internal system vocabulary. */
export function containsInternalTerminology(text: string): boolean {
  const lower = text.toLowerCase();
  return FORBIDDEN_TERMS.some((term) => lower.includes(term));
}

/**
 * Format a verified answer for display. Returns null when the formatter should
 * be skipped or its output is unusable — callers keep their deterministic
 * markdown in that case.
 */
export async function formatAnswer(
  input: FormatAnswerInput,
  options?: FormatAnswerOptions
): Promise<string | null> {
  const { answer } = input;

  // Nothing to present, or a provenance mismatch that the deterministic
  // renderer already states precisely. Don't spend a call on either.
  if (answer.status === "source_mismatch") return null;
  if (answer.items.length === 0 && (answer.missing?.length ?? 0) === 0) return null;

  const sources = buildFormatterSources(answer, options);

  const completion = await callChatLlm(
    [
      { role: "system", content: ANSWER_FORMATTER_SYSTEM_PROMPT },
      { role: "user", content: buildAnswerFormatterUserMessage(input, sources) },
    ],
    {
      temperature: 0.2,
      maxTokens: options?.maxTokens ?? FORMATTER_MAX_OUTPUT_TOKENS,
      ...(options?.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    }
  );

  if (!completion) return null;

  const body = sanitizeFormattedAnswer(completion, sources);
  if (!body) {
    logger.warn("answer_formatter.empty_output", { sample: completion.slice(0, 160) });
    return null;
  }

  if (containsInternalTerminology(body)) {
    logger.warn("answer_formatter.internal_terminology", { sample: body.slice(0, 160) });
    return null;
  }

  const linkedBody = linkCitationMarkers(body, sources);
  const sourceLine = renderSourceLine(sources);
  return sourceLine ? `${linkedBody}\n\n${sourceLine}` : linkedBody;
}
