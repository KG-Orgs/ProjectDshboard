/**
 * Visual Information Need — Step 1 of the visual evidence fallback.
 *
 * Decides, from the question wording alone, whether the answer is likely to live
 * on the page as a mark, a dimension, a photograph, or a layout rather than in
 * extracted text. Deterministic on purpose: the decision to spend a render + a
 * vision call has to be auditable and reproducible in the eval harness, and this
 * runs on every question, so it must be free.
 *
 * Also decides (Step 2) whether the *evidence* looks like it lost visual state —
 * the classic case being OCR that captured a list of checkbox labels but not
 * which box is ticked.
 */
import type { VisualNeedAssessment, VisualTaskType } from "@contractor/shared";

/**
 * Trigger vocabulary, grouped by the visual task each group implies.
 *
 * `weight` is the evidence a single hit contributes. "Strong" wording names the
 * act of seeing (`shown`, `visible`, `depicted`) or a mark that only exists
 * visually (`checkbox`, `signature`, `revision cloud`). "Supporting" wording
 * (`schedule`, `table`, `plan`) is common in text questions too, so on its own
 * it is not enough.
 */
interface TriggerGroup {
  taskType: VisualTaskType;
  weight: number;
  /** Matched case-insensitively against the raw query as whole words/phrases. */
  patterns: RegExp[];
}

const TRIGGER_GROUPS: TriggerGroup[] = [
  {
    taskType: "other",
    weight: 3,
    patterns: [
      /\bshown\b/i,
      /\bshow(?:s|ing)?\b/i,
      /\bvisible\b/i,
      /\bvisibly\b/i,
      /\bdepict(?:ed|s|ing)?\b/i,
      /\bappears?\s+(?:in|on)\b/i,
      /\bfield\s+conditions?\s+visible\b/i,
      /\bwhat\s+(?:can\s+be|is)\s+seen\b/i,
    ],
  },
  {
    taskType: "photo",
    weight: 3,
    patterns: [
      /\bphotograph(?:s|ed)?\b/i,
      /\bphotos?\b/i,
      /\bimages?\b/i,
      /\bpictures?\b/i,
      /\bsite\s+conditions?\b/i,
      /\bfield\s+conditions?\b/i,
      /\bprogress\s+(?:photo|picture|image)s?\b/i,
    ],
  },
  {
    taskType: "drawing",
    weight: 3,
    patterns: [
      /\bdrawings?\b/i,
      /\bdetails?\b/i,
      // `dimensional` covers "dimensional discrepancy", which is the wording an
      // RFI uses for exactly the kind of thing only the drawing shows.
      /\bdimension(?:s|ed|ing|al)?\b/i,
      /\bmounting\b/i,
      /\blayouts?\b/i,
      /\belevations?\b/i,
      /\bsections?\s+view\b/i,
      /\bdiagrams?\b/i,
      /\bsymbols?\b/i,
      /\bcallouts?\b/i,
      /\bplan\s+view\b/i,
    ],
  },
  {
    taskType: "checkbox",
    weight: 4,
    patterns: [
      /\bcheck\s?box(?:es)?\b/i,
      /\bcheck\s?marks?\b/i,
      /\bticked\b/i,
      /\bwhich\s+(?:box|option|designation)\s+is\s+(?:selected|checked|marked)\b/i,
      /\bis\s+(?:selected|checked|marked)\b/i,
      /\bselected\b/i,
      /\bmarked\b/i,
    ],
  },
  {
    taskType: "title_block",
    weight: 4,
    patterns: [
      /\btitle\s?block\b/i,
      /\brevision\s+(?:cloud|block|triangle)s?\b/i,
      /\bstamps?\b/i,
      /\bapproval\s+stamp\b/i,
      /\bseal(?:ed)?\b/i,
    ],
  },
  {
    taskType: "signature",
    weight: 4,
    patterns: [/\bsignatures?\b/i, /\bsigned\b/i, /\binitial(?:s|ed)\b/i, /\bhandwrit(?:ten|ing)\b/i],
  },
  {
    taskType: "markup",
    weight: 3,
    patterns: [
      /\bannotat(?:ion|ions|ed)\b/i,
      /\bmark(?:ed)?[-\s]?up\b/i,
      /\bredlin(?:e|es|ed)\b/i,
      /\bhighlight(?:ed|s)?\b/i,
      /\bclouded\b/i,
    ],
  },
  {
    taskType: "table",
    weight: 1,
    patterns: [/\bschedules?\b/i, /\btables?\b/i, /\bmatrix\b/i, /\bcolumns?\b/i, /\brows?\b/i, /\blegend\b/i],
  },
  {
    taskType: "scan",
    weight: 2,
    patterns: [/\bscann?ed\b/i, /\bfaxed?\b/i, /\bhard\s?copy\b/i],
  },
  {
    taskType: "other",
    weight: 1,
    patterns: [/\bcolors?\b/i, /\bcolours?\b/i, /\bfinish(?:es)?\s+shown\b/i, /\bplans?\b/i],
  },
];

/**
 * Wording that names a purely textual artefact. A question that asks for a
 * paragraph, clause, or spec section wants text, so visual inspection would only
 * add cost and hallucination surface — even if it also happens to say "shown".
 */
const TEXT_ONLY_PATTERNS: RegExp[] = [
  /\bparagraph\b/i,
  /\bclause\b/i,
  /\bspec(?:ification)?\s+section\b/i,
  /\bword[-\s]for[-\s]word\b/i,
  /\bverbatim\b/i,
  /\bemail\s+(?:address|thread)\b/i,
  /\bphone\s+number\b/i,
];

/** Above this total weight the question is treated as visual. */
const VISUAL_SCORE_THRESHOLD = 3;

/** Weight at which we stop scaling confidence — a saturated visual question. */
const CONFIDENCE_SATURATION = 8;

/**
 * Assess whether a question is likely to need visual inspection.
 *
 * Never throws and never calls out. A `visualLikely: false` result still carries
 * whatever weak signals were found, so the trace can show *why* vision was not
 * attempted.
 */
export function assessVisualNeed(query: string): VisualNeedAssessment {
  const reasons: string[] = [];
  const taskTypes = new Set<VisualTaskType>();
  let score = 0;

  for (const group of TRIGGER_GROUPS) {
    for (const pattern of group.patterns) {
      const match = pattern.exec(query);
      if (!match) continue;
      score += group.weight;
      taskTypes.add(group.taskType);
      reasons.push(`matched "${match[0].toLowerCase()}" (${group.taskType}, +${group.weight})`);
      // One hit per group is enough; further synonyms in the same group say the
      // same thing and would inflate the score.
      break;
    }
  }

  const textOnly = TEXT_ONLY_PATTERNS.find((pattern) => pattern.test(query));
  if (textOnly) {
    score -= 3;
    reasons.push(`question asks for textual content ("${(textOnly.exec(query) ?? [""])[0].toLowerCase()}", -3)`);
  }

  const visualLikely = score >= VISUAL_SCORE_THRESHOLD;

  // "other" is a catch-all; drop it once a specific task type was identified so
  // the prompt selector picks the specific instruction set.
  const visualTaskTypes = Array.from(taskTypes);
  const specific = visualTaskTypes.filter((type) => type !== "other");
  const resolvedTaskTypes = specific.length > 0 ? specific : visualTaskTypes;

  return {
    visualLikely,
    confidence: Math.max(0, Math.min(1, score / CONFIDENCE_SATURATION)),
    reasons,
    visualTaskTypes: visualLikely && resolvedTaskTypes.length === 0 ? ["other"] : resolvedTaskTypes,
  };
}

/**
 * Option-style labels whose *printed presence* in OCR text says nothing about
 * which one is selected. When the text contains two or more of these and no
 * selection marker, the visual state was lost in extraction.
 */
const SELECTION_LABEL_PATTERNS: RegExp[] = [
  /\breview\s*(?:&|and)\s*comment\b/i,
  /\bapprovals?\b/i,
  /\binformation\s+only\b/i,
  /\bas\s+noted\b/i,
  /\brejected\b/i,
  /\brevise\s+and\s+resubmit\b/i,
  /\bno\s+exceptions?\s+taken\b/i,
  /\byes\b\s*\/?\s*\bno\b/i,
];

/** Text that would indicate the selection *was* preserved (a rendered mark). */
const SELECTION_STATE_PATTERNS: RegExp[] = [
  /\[\s*[xX✓✔]\s*\]/,
  /\(\s*[xX✓✔]\s*\)/,
  /[☑☒✅✔✓]/,
  /\bchecked\b/i,
  /\bselected\b/i,
  /\bmarked\s+with\s+an?\s+[xX]\b/i,
];

/**
 * Step 2's "labels present but visual state lost" heuristic.
 *
 * Returns a reason string when the extracted text lists mutually exclusive
 * options without indicating which is active — a strong visual-fallback case
 * even when the question itself reads as a plain text lookup.
 */
export function detectLostVisualState(evidenceText: string): string | null {
  if (evidenceText.trim().length === 0) return null;

  const matchedLabels = SELECTION_LABEL_PATTERNS.filter((pattern) => pattern.test(evidenceText)).length;
  if (matchedLabels < 2) return null;

  if (SELECTION_STATE_PATTERNS.some((pattern) => pattern.test(evidenceText))) {
    return null;
  }

  return `extracted text lists ${matchedLabels} mutually exclusive options with no indication of which is selected`;
}

/**
 * Does the extracted text look like a failed/degraded extraction rather than
 * real prose? Drawings and scans commonly yield a soup of short fragments,
 * coordinates, and sheet codes. Used as one of the "text is suspicious" inputs
 * to the trigger decision.
 */
export function isSuspiciousExtraction(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  // Very little text for a whole page is itself the signal.
  if (trimmed.length < 200) return true;

  const words = trimmed.split(/\s+/);
  if (words.length < 40) return true;

  const shortFragments = words.filter((word) => word.replace(/[^A-Za-z0-9]/g, "").length <= 2).length;
  const alphaWords = words.filter((word) => /[A-Za-z]{3,}/.test(word)).length;

  // Mostly numbers, symbols, and 1–2 character tokens — typical of a drawing's
  // stray text layer or a bad OCR pass.
  return shortFragments / words.length > 0.4 || alphaWords / words.length < 0.35;
}
