/**
 * Document identity extraction + scoring (pure).
 *
 * This is the deterministic half of the document-resolution stage that runs
 * *before* retrieval: it turns a question into the identity of the document the
 * user asked for (`extractRequestedIdentity`), turns a corpus file into the
 * identity it carries (`describeFileIdentity`), and scores one against the other
 * (`scoreIdentity`).
 *
 * The point of the stage is that semantic similarity must never be able to
 * create a document lock on its own. A file is the requested document because it
 * *carries the requested identity* — identifier, revision, date, title phrase,
 * station, type, contract — not because it is about the same topic, station or
 * month. So:
 *
 *   * A contradicting explicit identifier or revision disqualifies a candidate
 *     outright; the score is never consulted.
 *   * When the request names title terms, a candidate must carry a quorum of
 *     them *in its file name* — the file name is the document's name, and a path
 *     match would let every file in a folder impersonate the folder's subject.
 *   * Positive signals accumulate, conflicts subtract, and the caller applies a
 *     conservative threshold (see `document-identity.service`).
 *
 * Everything here is name/path in, structured data out — no DB, no LLM, no file
 * reads. Identifier normalization is delegated to `identifier-extraction.utils`
 * so the resolver, the indexer and the Source Identity Guard all agree on what
 * `RFI096` means.
 */

import {
  documentFamilyKey,
  extractIdentifiers,
  extractPathMetadata,
  revisionNumber,
  STATION_NAMES,
  type ExtractedIdentifier,
  type IdentifierType,
  type StationCode,
} from "./identifier-extraction.utils";

// ============================================================
// Types
// ============================================================

/** A date reference, at day or month precision. */
export interface DateRef {
  /** ISO `yyyy-mm-dd` when the day is known, else `yyyy-mm`. */
  iso: string;
  precision: "day" | "month";
}

/**
 * The identity of the document a question asks for.
 *
 * `explicitIdentifiers` holds the identifiers verbatim as the user wrote them
 * (that is what reason strings and traces should show); `identifiers` holds the
 * same set normalized, which is what comparisons use.
 */
export interface RequestedDocumentIdentity {
  explicitIdentifiers: string[];
  documentType?: string;
  station?: string;
  titleTerms: string[];
  /** ISO `yyyy-mm-dd` when the question named a specific day. */
  date?: string;
  /** Set when the question named a month or a span rather than a day. */
  dateRange?: { start?: string; end?: string };
  revision?: string;
  contract?: string;

  // ---- Comparison-side detail, derived from the fields above ----
  /** Normalized form of `explicitIdentifiers`. */
  identifiers: ExtractedIdentifier[];
  /** Station code behind `station`. */
  stationCode?: StationCode;
  /** Parsed form of `date` / `dateRange`. */
  dateRef?: DateRef;
}

/** The identity a corpus file carries, read from its name and path. */
export interface CandidateIdentity {
  fileId: string;
  fileName: string;
  filePath: string;
  identifiers: ExtractedIdentifier[];
  /**
   * Every document type the *file name* claims — a name can claim more than one
   * ("VECP Presentation Meeting Minutes"). The indexer's `docCategory` is kept
   * separate: it can confirm a requested type but, not being part of the
   * document's name, it never argues against one.
   */
  documentTypes: string[];
  station?: string;
  stationCode?: StationCode;
  /** Every date the name/path carries, in any precision. */
  dates: DateRef[];
  revision?: string;
  contract?: string;
  docCategory?: string;
  chunkCount?: number;
  /** Lowercased alphanumeric tokens of the file name (no extension). */
  nameTokens: string[];
  /** Lowercased alphanumeric tokens of the containing folders. */
  pathTokens: string[];
}

/** How well one candidate satisfies the requested identity. */
export interface IdentityScore {
  score: number;
  matchedFields: string[];
  conflictingFields: string[];
  /**
   * Set when the candidate is contradicted outright (wrong identifier, wrong
   * revision, or it fails a mandatory requested field). A disqualified candidate
   * can never be locked, whatever its score.
   */
  disqualified: boolean;
  /** Human-readable explanation, always present. */
  reason: string;
}

// ============================================================
// Scoring weights
// ============================================================

/**
 * Weights for the identity signals. Exported so the threshold in
 * `document-identity.service` can be read against them rather than guessed at.
 */
export const IDENTITY_WEIGHTS = {
  exactIdentifier: 10,
  exactRevision: 5,
  exactDate: 4,
  /** Month-precision agreement when the request was month-precision too. */
  monthDate: 3,
  /** Every requested title term present in the file name. */
  titlePhrase: 4,
  /** Per title term present in the file name, when not all of them are. */
  titleTerm: 2,
  /** A title term that only appears in the path — supporting, never confirming. */
  titleTermPath: 1,
  station: 3,
  documentType: 2,
  contract: 2,
  // Conflicts.
  stationConflict: -6,
  dateConflict: -5,
  documentTypeConflict: -4,
  /** The candidate also claims a document type the request did not ask for. */
  documentTypeExtra: -2,
  /**
   * Per *additional* identifier of a requested type that the candidate carries.
   * `A37806_RFI-0163 - AECOM-RFI-096 follow Up to RFI-119` mentions RFI-096 but
   * *is* RFI-0163; `A37806_ADA P6_RFI096` carries nothing else and is the RFI-096
   * the question asked for.
   */
  identifierExtra: -2,
  /** Floor on the accumulated `identifierExtra` penalty. */
  identifierExtraFloor: -4,
  /** A requested field the candidate is simply silent about. */
  missingField: -1,
} as const;

// ============================================================
// Vocabulary
// ============================================================

/**
 * Document types a request or a file name can name. Order matters: the first
 * pattern that hits wins for the request side, so more specific types
 * ("meeting minutes", "photos") must precede the generic ones ("report").
 *
 * Slugs reuse the corpus `doc_category` vocabulary where one exists so a
 * candidate's DB category can be compared directly.
 *
 * `words` lists the tokens the type is recognised by. They are consumed by the
 * documentType field, so they never survive into `titleTerms` — "presentation"
 * must not be scored twice, once as a type and once as a word in the title. Terms
 * that genuinely discriminate between documents of the same type ("CCTV", "shop")
 * are deliberately left out of `words` so they stay title terms.
 */
const DOCUMENT_TYPE_PATTERNS: Array<{ type: string; pattern: RegExp; words: string[] }> = [
  {
    type: "meeting_minutes",
    pattern: /\b(?:meeting\s+minutes|minutes\s+of\s+meeting|minutes)\b/i,
    words: ["meeting", "meetings", "minutes"],
  },
  {
    type: "presentation",
    pattern: /\b(?:presentations?|slide\s*decks?|pptx?)\b/i,
    words: ["presentation", "presentations", "slide", "slides", "deck", "decks", "ppt", "pptx"],
  },
  {
    type: "photo",
    pattern: /\b(?:photos?|photographs?|photo\s*log)\b/i,
    words: ["photo", "photos", "photograph", "photographs"],
  },
  {
    type: "inspection",
    pattern: /\b(?:inspections?|inspection\s+findings?)\b/i,
    words: ["inspection", "inspections"],
  },
  { type: "rfi", pattern: /\brfis?\b/i, words: ["rfi", "rfis"] },
  { type: "submittal", pattern: /\bsubmittals?\b/i, words: ["submittal", "submittals"] },
  {
    type: "change_order",
    pattern: /\b(?:change\s+orders?|pco)\b/i,
    words: ["change", "order", "orders", "pco"],
  },
  {
    type: "schedule",
    pattern: /\b(?:schedules?|lookaheads?|baselines?)\b/i,
    words: ["schedule", "schedules", "lookahead", "lookaheads", "baseline", "baselines"],
  },
  {
    type: "spec",
    pattern: /\b(?:specifications?|specs?)\b/i,
    words: ["specification", "specifications", "spec", "specs"],
  },
  { type: "permit", pattern: /\bpermits?\b/i, words: ["permit", "permits"] },
  {
    type: "invoice",
    pattern: /\b(?:invoices?|inv#|pay\s+app(?:lication)?s?)\b/i,
    words: ["invoice", "invoices", "inv"],
  },
  {
    type: "drawing",
    pattern: /\b(?:drawings?|dwgs?)\b/i,
    words: ["drawing", "drawings", "dwg", "dwgs"],
  },
  { type: "safety", pattern: /\b(?:safety|swp)\b/i, words: ["safety"] },
  {
    type: "contract",
    pattern: /\b(?:contracts?|subcontracts?)\b/i,
    words: ["contract", "contracts", "subcontract", "subcontracts"],
  },
  {
    type: "correspondence",
    pattern: /\b(?:letters?|transmittals?|correspondence)\b/i,
    words: ["letter", "letters", "transmittal", "transmittals", "correspondence"],
  },
  { type: "report", pattern: /\breports?\b/i, words: ["report", "reports"] },
];

/**
 * Station references as a user writes them. Codes are matched case-sensitively
 * (`\bnor\b` would otherwise fire on "neither X nor Y"), and `GEN` / "General"
 * is excluded because it is the catch-all origin, not a station. Kept in step
 * with `source-identity-guard.service`, which guards the same vocabulary.
 */
const STATION_PATTERNS: Array<{ code: StationCode; namePattern: RegExp }> = [
  { code: "NOR", namePattern: /\bnorwood\b/i },
  { code: "BUR", namePattern: /\bburnside\b/i },
  { code: "MYR", namePattern: /\bmyrtle\b/i },
  { code: "MID", namePattern: /\bmiddletown\b/i },
  { code: "AVI", namePattern: /\b(?:avenue\s+i|ave\s+i|avenue\s+1)\b/i },
];

const MONTH_NAMES: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

const MONTH_ALTERNATION = Object.keys(MONTH_NAMES).join("|");

/**
 * Words that never identify a document: question scaffolding, generic document
 * nouns, and the connector words a reference is phrased with. Anything left over
 * after this filter (and after the identifier / station / date / type fields have
 * claimed their tokens) is a title term.
 */
const TITLE_STOP_WORDS = new Set([
  // question scaffolding
  "in", "the", "a", "an", "of", "for", "on", "at", "to", "and", "or", "with", "from", "by",
  "what", "which", "when", "where", "who", "whom", "whose", "how", "why", "is", "are", "was",
  "were", "does", "do", "did", "has", "have", "had", "can", "could", "should", "would", "will",
  "this", "that", "these", "those", "it", "its", "there", "their", "any", "some", "all", "both",
  "please", "tell", "show", "list", "describe", "give", "find", "summarize", "explain", "provide",
  "me", "us", "i", "we", "you", "about",
  // generic document nouns — carried by the documentType field instead
  "document", "documents", "file", "files", "pdf", "doc", "docx", "xls", "xlsx", "pptx", "zip",
  "copy", "final", "draft", "version", "ver", "rev",
  // corpus-wide boilerplate that identifies nothing
  "mlj", "mlj017", "package", "general", "station", "stations", "ave", "avenue", "avenues", "st",
]);

// ============================================================
// Tokenizing
// ============================================================

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]{1,5}$/i, "");
}

/** Lowercased alphanumeric tokens, punctuation and separators dropped. */
export function identityTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

// ============================================================
// Date parsing
// ============================================================

function iso(year: number, month: number, day?: number): DateRef {
  const mm = String(month).padStart(2, "0");
  if (day === undefined) return { iso: `${year}-${mm}`, precision: "month" };
  return { iso: `${year}-${mm}-${String(day).padStart(2, "0")}`, precision: "day" };
}

function fullYear(value: number): number {
  // Two-digit years in this corpus are always 20xx ("25.05.13", "09.03.25").
  return value < 100 ? 2000 + value : value;
}

const plausibleMonth = (value: number): boolean => value >= 1 && value <= 12;
const plausibleDay = (value: number): boolean => value >= 1 && value <= 31;
const plausibleYear = (value: number): boolean => value >= 2000 && value <= 2099;

/**
 * Every date the text plausibly carries.
 *
 * Construction file names spell dates a dozen ways and some are genuinely
 * ambiguous ("03.06.25" is both March 6 2025 and, read as yy.mm.dd, June 3
 * 2025). Rather than guess, every plausible reading is returned: a candidate
 * matches when *any* of its readings agrees with the request, and conflicts only
 * when it carries dates and *none* of them agree. Guessing wrong would either
 * hide the right document or manufacture a conflict; over-generating only makes
 * the conflict test more conservative.
 */
export function extractDates(text: string): DateRef[] {
  const found: DateRef[] = [];
  const push = (ref: DateRef | undefined): void => {
    if (ref && !found.some((existing) => existing.iso === ref.iso)) found.push(ref);
  };

  // "May 13, 2025", "13 May 2025", "May 2025". The left boundary on the leading
  // day keeps a preceding identifier from donating its digits ("GEN-042R00
  // September 3, 2025" must not read "00" as the day).
  const monthNameRe = new RegExp(
    `(?:(?<![A-Za-z0-9])(\\d{1,2})\\s+)?(${MONTH_ALTERNATION})\\.?\\s*(\\d{1,2})?(?:st|nd|rd|th)?,?\\s*(\\d{4})`,
    "gi"
  );
  for (const match of text.matchAll(monthNameRe)) {
    const [, dayBefore, monthName, dayAfter, year] = match;
    const month = MONTH_NAMES[monthName.toLowerCase()]!;
    // The trailing day wins: "May 13, 2025" is unambiguous, a leading number is
    // only a day when nothing follows the month name.
    const dayRaw = dayAfter ?? dayBefore;
    const day = dayRaw ? Number.parseInt(dayRaw, 10) : undefined;
    const yearNum = Number.parseInt(year, 10);
    if (!plausibleYear(yearNum)) continue;
    push(day !== undefined && plausibleDay(day) ? iso(yearNum, month, day) : iso(yearNum, month));
  }

  // "20250513" / "2025.05.13" / "2025-05-13" / "2025_05_13".
  for (const match of text.matchAll(/(?<![0-9])(20\d{2})[.\-_/]?(\d{2})[.\-_/]?(\d{2})(?![0-9])/g)) {
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    if (plausibleMonth(month) && plausibleDay(day)) push(iso(year, month, day));
  }

  // "2025-05" / "2025.05" — month precision.
  for (const match of text.matchAll(/(?<![0-9])(20\d{2})[.\-_/](\d{2})(?![0-9.\-_/])/g)) {
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    if (plausibleMonth(month)) push(iso(year, month));
  }

  // Three 1-2 digit groups: "05.13.2025", "5/13/25", "25.05.13", "09.03.25".
  for (const match of text.matchAll(
    /(?<![0-9])(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})(?![0-9])/g
  )) {
    const a = Number.parseInt(match[1], 10);
    const b = Number.parseInt(match[2], 10);
    const c = Number.parseInt(match[3], 10);
    // mm.dd.yy(yy) — the US form these file names mostly use.
    if (plausibleMonth(a) && plausibleDay(b) && plausibleYear(fullYear(c))) {
      push(iso(fullYear(c), a, b));
    }
    // yy.mm.dd — used by the "25.05.13" folder convention.
    if (
      match[3].length === 2 &&
      plausibleMonth(b) &&
      plausibleDay(c) &&
      plausibleYear(fullYear(a))
    ) {
      push(iso(fullYear(a), b, c));
    }
  }

  return found;
}

/** True when two date references can refer to the same date. */
function datesAgree(requested: DateRef, candidate: DateRef): boolean {
  if (requested.precision === "day" && candidate.precision === "day") {
    return requested.iso === candidate.iso;
  }
  // One side is month-precision: agreement is agreement on the month.
  return candidate.iso.slice(0, 7) === requested.iso.slice(0, 7);
}

// ============================================================
// Requested identity
// ============================================================

function parseStation(text: string): StationCode | undefined {
  for (const { code, namePattern } of STATION_PATTERNS) {
    const codePattern = new RegExp(`(?<![A-Za-z0-9])${code}(?![A-Za-z0-9])`);
    if (namePattern.test(text) || codePattern.test(text)) return code;
  }
  return undefined;
}

/**
 * Revision named on its own ("revision 2", "R01"). A revision inside a control
 * number (`GEN-042R00`) belongs to the identifier and is deliberately not picked
 * up here — the boundary rules keep it from being counted twice.
 */
function parseRevision(text: string): string | undefined {
  const token = /(?<![A-Za-z0-9])R(\d{1,2})(?![A-Za-z0-9])/.exec(text);
  if (token) return `R${token[1].padStart(2, "0")}`;
  const word = /\brev(?:ision)?\.?\s*#?\s*(\d{1,2})(?![A-Za-z0-9])/i.exec(text);
  if (word) return `R${word[1].padStart(2, "0")}`;
  return undefined;
}

function parseContract(text: string): string | undefined {
  const match = /(?<![A-Za-z0-9])(A[\s-]?\d{5,6})(?![A-Za-z0-9])/i.exec(text);
  return match ? match[1].toUpperCase().replace(/[\s-]/g, "") : undefined;
}

/**
 * Tokens already accounted for by another identity field, so they must not be
 * double-counted as title terms.
 */
function claimedTokens(
  identifiers: ExtractedIdentifier[],
  stationCode: StationCode | undefined,
  dates: DateRef[],
  revision: string | undefined,
  contract: string | undefined,
  documentType: string | undefined
): Set<string> {
  const claimed = new Set<string>();
  for (const identifier of identifiers) {
    for (const token of identityTokens(identifier.raw)) claimed.add(token);
    claimed.add(identifier.valueNormalized.toLowerCase());
  }
  if (stationCode) {
    claimed.add(stationCode.toLowerCase());
    for (const token of identityTokens(STATION_NAMES[stationCode])) claimed.add(token);
  }
  for (const date of dates) {
    for (const token of identityTokens(date.iso)) claimed.add(token);
    const month = Number.parseInt(date.iso.slice(5, 7), 10);
    for (const [name, num] of Object.entries(MONTH_NAMES)) {
      if (num === month) claimed.add(name);
    }
    // "2025" and "25" both stand in for the year.
    claimed.add(date.iso.slice(0, 4));
    claimed.add(date.iso.slice(2, 4));
    if (date.precision === "day") claimed.add(String(Number.parseInt(date.iso.slice(8, 10), 10)));
    claimed.add(String(month));
  }
  if (revision) claimed.add(revision.toLowerCase());
  if (contract) claimed.add(contract.toLowerCase());
  if (documentType) {
    for (const token of documentType.split("_")) claimed.add(token);
    const entry = DOCUMENT_TYPE_PATTERNS.find((candidate) => candidate.type === documentType);
    for (const word of entry?.words ?? []) claimed.add(word);
  }
  return claimed;
}

/**
 * Extract the identity of the document a question asks for.
 *
 * `reference` is the document-reference span inside the question ("In
 * <reference>, what …"); when omitted it is isolated with
 * `extractDocumentReference`.
 *
 * Title terms come from that reference **and only from it**. They are the one
 * free-text signal that can disqualify a candidate, so they must never be taken
 * from the whole question: the words of the *information* being asked for ("cost
 * savings", "what question is being asked of the design team") would then have to
 * appear in the file name, and every candidate would be disqualified. When no
 * reference can be isolated, the request simply carries no title terms and is
 * judged on its identifier, date, station, revision and type alone.
 */
export function extractRequestedIdentity(
  question: string,
  reference?: string
): RequestedDocumentIdentity {
  const resolvedReference = reference?.trim() || extractDocumentReference(question);
  // Date and type only ever add or subtract points, never disqualify, so they may
  // safely fall back to the whole question when no reference was isolated.
  const weakSource = resolvedReference ?? question;

  const identifiers = extractIdentifiers(question);
  const stationCode = parseStation(question);
  const dates = extractDates(weakSource);
  const revision = parseRevision(question);
  const contract = parseContract(question);
  const documentType = DOCUMENT_TYPE_PATTERNS.find((entry) => entry.pattern.test(weakSource))?.type;

  const claimed = claimedTokens(identifiers, stationCode, dates, revision, contract, documentType);
  const titleTerms = resolvedReference
    ? Array.from(
        new Set(
          identityTokens(resolvedReference).filter(
            (token) =>
              token.length >= 2 &&
              !TITLE_STOP_WORDS.has(token) &&
              !claimed.has(token) &&
              // Bare numbers left over after the date/identifier fields have taken
              // theirs are almost always noise ("P6", "2", "01 30 20" fragments).
              !/^\d{1,2}$/.test(token)
          )
        )
      )
    : [];

  // The most specific date wins as *the* requested date; a month-precision
  // reference becomes a range instead so callers can see it is not a day.
  const dayDate = dates.find((date) => date.precision === "day");
  const monthDate = dates.find((date) => date.precision === "month");
  const dateRef = dayDate ?? monthDate;

  return {
    explicitIdentifiers: identifiers.map((identifier) => identifier.raw),
    ...(documentType ? { documentType } : {}),
    ...(stationCode ? { station: STATION_NAMES[stationCode] } : {}),
    titleTerms,
    ...(dayDate ? { date: dayDate.iso } : {}),
    ...(!dayDate && monthDate ? { dateRange: monthRange(monthDate.iso) } : {}),
    ...(revision ? { revision } : {}),
    ...(contract ? { contract } : {}),
    identifiers,
    ...(stationCode ? { stationCode } : {}),
    ...(dateRef ? { dateRef } : {}),
  };
}

/** First and last day of a `yyyy-mm` month, for `dateRange`. */
function monthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split("-").map((part) => Number.parseInt(part, 10));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${yearMonth}-01`,
    end: `${yearMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

/**
 * Patterns a user names a document with. Group 1 is the reference span.
 *
 * The lazy `(.+?)` in the first pattern is what lets a reference contain its own
 * comma: in "In the May 13, 2025 Burnside Avenue VECP Presentation, what cost
 * savings …" the engine tries the comma after "13" first, fails to find a
 * question word behind it, and expands to the right one.
 */
const DOCUMENT_REFERENCE_PATTERNS: RegExp[] = [
  /^(?:in|per|from|within|inside|under)\s+(?:the\s+)?(.+?)\s*,\s*(?:what|which|when|where|who|whom|whose|how|why|list|describe|tell|show|give|is|are|does|did|do|has|have|were|was)\b/i,
  /^(?:what|which)\s+(?:is|are)\s+(?:in|inside)\s+(?:the\s+)?(.+?)[?.!]*$/i,
  /^summarize\s+(?:what\s+is\s+in\s+)?(?:the\s+)?(.+?)[?.!]*$/i,
  /^(?:in|per|from)\s+(?:the\s+)?([^,?.!]{4,120})\s*,/i,
];

/**
 * Isolate the document-reference span in a question, or undefined when the
 * question does not name a document in a recognised way.
 *
 * Callers pass the result to `extractRequestedIdentity` as `reference`. Returning
 * undefined rather than guessing matters: title terms taken from a whole question
 * would include the words of the *information* being asked for, and a candidate
 * would then be disqualified for not having "cost savings" in its file name.
 */
export function extractDocumentReference(question: string): string | undefined {
  const trimmed = question.trim();
  for (const pattern of DOCUMENT_REFERENCE_PATTERNS) {
    const match = trimmed.match(pattern);
    const reference = match?.[1]?.trim();
    if (reference && reference.length >= 3) return reference;
  }
  return undefined;
}

/** True when the question specifies nothing that could identify a document. */
export function hasRequestedIdentity(requested: RequestedDocumentIdentity): boolean {
  return (
    requested.identifiers.length > 0 ||
    requested.titleTerms.length > 0 ||
    requested.dateRef !== undefined ||
    requested.stationCode !== undefined ||
    requested.revision !== undefined
  );
}

// ============================================================
// Candidate identity
// ============================================================

export interface FileIdentityInput {
  fileId: string;
  fileName: string;
  filePath: string;
  docCategory?: string;
  revision?: string;
  chunkCount?: number;
}

/**
 * Read the identity a file carries from its name and path.
 *
 * Document types are collected from the *file name* only. A file's folder says
 * what workflow it belongs to, not what kind of document it is, and letting the
 * path contribute types would make every file in `05 - SUBMITTALS` claim to be a
 * submittal. The DB `doc_category` is included because indexing derived it from
 * the file's own content/metadata.
 */
export function describeFileIdentity(input: FileIdentityInput): CandidateIdentity {
  const meta = extractPathMetadata(input.fileName, input.filePath);
  const nameWithoutExt = stripExtension(input.fileName);
  const folders = input.filePath.replace(/[\\/]+[^\\/]*$/, "");

  const documentTypes = new Set<string>();
  for (const { type, pattern } of DOCUMENT_TYPE_PATTERNS) {
    if (pattern.test(nameWithoutExt)) documentTypes.add(type);
  }

  const stationCode = meta.station ?? parseStation(nameWithoutExt);

  return {
    fileId: input.fileId,
    fileName: input.fileName,
    filePath: input.filePath,
    identifiers: extractIdentifiers(input.fileName, input.filePath),
    documentTypes: Array.from(documentTypes),
    ...(stationCode && stationCode !== "GEN"
      ? { station: STATION_NAMES[stationCode], stationCode }
      : {}),
    dates: extractDates(`${nameWithoutExt} ${folders}`),
    ...(input.revision ?? meta.revision ? { revision: input.revision ?? meta.revision } : {}),
    ...(meta.contractNumber ? { contract: meta.contractNumber } : {}),
    ...(input.docCategory ? { docCategory: input.docCategory } : {}),
    ...(input.chunkCount !== undefined ? { chunkCount: input.chunkCount } : {}),
    nameTokens: identityTokens(nameWithoutExt),
    pathTokens: identityTokens(folders),
  };
}

/**
 * Key shared by copies of the *same* document — the same identity-bearing tokens
 * in a different order, format or copy marker.
 *
 * Deliberately order-insensitive, unlike `documentFamilyKey`: the resolver has
 * to recognise `2025-05-13 A37806 Burnside Ave VECP Presentation.pdf` and
 * `A37806 Burnside Ave VECP Presentation 2025-05-13.pptx` as one document so a
 * format pair is not reported as an ambiguity. Two genuinely different documents
 * would have to carry the identical multiset of name tokens to collide.
 */
export function identityFamilyKey(fileName: string): string {
  // documentFamilyKey already strips extensions, "- Copy" markers and the
  // status/disposition segments ("- FIO -", "- ORIG -") while preserving revision
  // tokens; all that is missing for this use is order-insensitivity and the
  // street-suffix spellings the same document is filed under
  // ("Burnside Ave …" / "Burnside Avenue …").
  const base = documentFamilyKey(fileName) || stripExtension(fileName);
  return identityTokens(base)
    .filter((token) => !/^(ver|v|pmc|signed)\d*$/.test(token))
    .map((token) => FAMILY_TOKEN_ALIASES[token] ?? token)
    .sort()
    .join(" ");
}

/** Spellings that never distinguish two documents. */
const FAMILY_TOKEN_ALIASES: Record<string, string> = {
  avenue: "ave",
  street: "st",
  road: "rd",
  drawing: "drawings",
  photo: "photos",
  minute: "minutes",
};

// ============================================================
// Scoring
// ============================================================

function groupByType(
  identifiers: ExtractedIdentifier[]
): Map<IdentifierType, Set<string>> {
  const grouped = new Map<IdentifierType, Set<string>>();
  for (const identifier of identifiers) {
    const existing = grouped.get(identifier.type);
    if (existing) existing.add(identifier.valueNormalized);
    else grouped.set(identifier.type, new Set([identifier.valueNormalized]));
  }
  return grouped;
}

/** Title terms a candidate carries in its file name / in its path. */
function matchTitleTerms(
  titleTerms: string[],
  candidate: CandidateIdentity
): { inName: string[]; inPath: string[] } {
  const nameSet = new Set(candidate.nameTokens);
  const pathSet = new Set(candidate.pathTokens);
  const inName: string[] = [];
  const inPath: string[] = [];

  for (const term of titleTerms) {
    if (nameSet.has(term) || candidate.nameTokens.some((token) => tokenCoversTerm(token, term))) {
      inName.push(term);
    } else if (pathSet.has(term) || candidate.pathTokens.some((token) => tokenCoversTerm(token, term))) {
      inPath.push(term);
    }
  }

  return { inName, inPath };
}

/**
 * Whether a file-name token stands for a requested term. Only prefix growth is
 * accepted ("inspect" → "inspections"), never arbitrary substring containment:
 * `scoreFileMatch`-style loose matching is what let a May 5–7 Burnside work
 * document pass for a May 13 VECP presentation.
 */
function tokenCoversTerm(token: string, term: string): boolean {
  if (token === term) return true;
  if (term.length < 4 || token.length < 4) return false;
  return token.startsWith(term) || term.startsWith(token);
}

/** Minimum number of requested title terms a candidate must carry to be lockable. */
export function titleTermQuorum(titleTermCount: number): number {
  if (titleTermCount === 0) return 0;
  return Math.max(1, Math.ceil(titleTermCount / 2));
}

/**
 * Score one candidate against the requested identity.
 *
 * Positive signals are additive, conflicts subtract, and three things
 * disqualify outright regardless of score:
 *   1. the candidate carries a *different* value of a requested identifier type;
 *   2. the candidate carries a different revision than the one requested;
 *   3. the request named identifiers or title terms and the candidate cannot
 *      confirm them (no identifier match / below the title-term quorum).
 */
export function scoreIdentity(
  requested: RequestedDocumentIdentity,
  candidate: CandidateIdentity
): IdentityScore {
  const matchedFields: string[] = [];
  const conflictingFields: string[] = [];
  const notes: string[] = [];
  let score = 0;
  let disqualified = false;

  // ---- Explicit identifiers -------------------------------------------------
  if (requested.identifiers.length > 0) {
    const wanted = groupByType(requested.identifiers);
    const carried = groupByType(candidate.identifiers);
    let identifierMatched = false;

    for (const [type, wantedValues] of wanted) {
      const carriedValues = carried.get(type);
      if (!carriedValues || carriedValues.size === 0) continue; // silent on this type

      const hit = Array.from(wantedValues).find((value) => carriedValues.has(value));
      if (hit) {
        identifierMatched = true;
        score += IDENTITY_WEIGHTS.exactIdentifier;
        matchedFields.push(`identifier:${hit}`);

        // Carrying other identifiers of the same type makes this a document
        // *referencing* the requested one rather than being it. Penalised, not
        // disqualified — a transmittal legitimately names several.
        const extras = Array.from(carriedValues).filter((value) => !wantedValues.has(value));
        if (extras.length > 0) {
          score += Math.max(
            IDENTITY_WEIGHTS.identifierExtraFloor,
            extras.length * IDENTITY_WEIGHTS.identifierExtra
          );
          conflictingFields.push(`identifier_extra:${extras.join(",")}`);
          notes.push(`candidate also carries ${type} ${extras.join(", ")}`);
        }
        continue;
      }

      // A different value of a requested identifier type is a contradiction, not
      // a weak signal: RFI096 is never answered from RFI-0042.
      disqualified = true;
      conflictingFields.push(`identifier:${Array.from(carriedValues).join("/")}`);
      notes.push(
        `requested ${Array.from(wantedValues).join("/")} but candidate carries ${Array.from(carriedValues).join("/")}`
      );
    }

    if (!identifierMatched && !disqualified) {
      disqualified = true;
      notes.push(
        `candidate does not carry ${requested.explicitIdentifiers.join("/") || "the requested identifier"}`
      );
      conflictingFields.push("identifier:absent");
    }
  }

  // ---- Revision -------------------------------------------------------------
  if (requested.revision) {
    const candidateRevision = candidate.revision;
    if (!candidateRevision) {
      score += IDENTITY_WEIGHTS.missingField;
      notes.push(`candidate does not state a revision (requested ${requested.revision})`);
    } else if (revisionNumber(candidateRevision) === revisionNumber(requested.revision)) {
      score += IDENTITY_WEIGHTS.exactRevision;
      matchedFields.push(`revision:${requested.revision}`);
    } else {
      // A requested revision is never silently substituted.
      disqualified = true;
      conflictingFields.push(`revision:${candidateRevision}`);
      notes.push(`requested revision ${requested.revision} but candidate is ${candidateRevision}`);
    }
  }

  // ---- Date -----------------------------------------------------------------
  if (requested.dateRef) {
    const agreeing = candidate.dates.find((date) => datesAgree(requested.dateRef!, date));
    if (agreeing) {
      const exact =
        requested.dateRef.precision === "day" && agreeing.precision === "day";
      score += exact ? IDENTITY_WEIGHTS.exactDate : IDENTITY_WEIGHTS.monthDate;
      matchedFields.push(`date:${agreeing.iso}`);
    } else if (candidate.dates.length > 0) {
      score += IDENTITY_WEIGHTS.dateConflict;
      conflictingFields.push(`date:${candidate.dates.map((date) => date.iso).join(",")}`);
      notes.push(
        `requested ${requested.dateRef.iso} but candidate is dated ${candidate.dates.map((date) => date.iso).join(", ")}`
      );
    } else {
      score += IDENTITY_WEIGHTS.missingField;
      notes.push(`candidate carries no date (requested ${requested.dateRef.iso})`);
    }
  }

  // ---- Title terms ----------------------------------------------------------
  if (requested.titleTerms.length > 0) {
    const { inName, inPath } = matchTitleTerms(requested.titleTerms, candidate);
    const quorum = titleTermQuorum(requested.titleTerms.length);

    if (inName.length >= requested.titleTerms.length) {
      score += IDENTITY_WEIGHTS.titlePhrase;
      matchedFields.push(`title:${inName.join("+")}`);
    } else if (inName.length > 0) {
      score += inName.length * IDENTITY_WEIGHTS.titleTerm;
      matchedFields.push(`title:${inName.join("+")}`);
    }
    score += inPath.length * IDENTITY_WEIGHTS.titleTermPath;
    if (inPath.length > 0) matchedFields.push(`title_path:${inPath.join("+")}`);

    // The quorum must be met in the file name. The file name *is* the document's
    // name; accepting path matches would let every file in a folder impersonate
    // the folder's subject.
    if (inName.length < quorum) {
      disqualified = true;
      const missing = requested.titleTerms.filter((term) => !inName.includes(term));
      conflictingFields.push(`title:missing:${missing.join(",")}`);
      notes.push(
        `file name carries ${inName.length}/${requested.titleTerms.length} requested title term(s), below the quorum of ${quorum} (missing ${missing.join(", ")})`
      );
    }
  }

  // ---- Station --------------------------------------------------------------
  if (requested.stationCode) {
    if (candidate.stationCode === requested.stationCode) {
      score += IDENTITY_WEIGHTS.station;
      matchedFields.push(`station:${requested.stationCode}`);
    } else if (candidate.stationCode) {
      score += IDENTITY_WEIGHTS.stationConflict;
      conflictingFields.push(`station:${candidate.stationCode}`);
      notes.push(`requested ${requested.station} but candidate is a ${candidate.station} document`);
    } else {
      score += IDENTITY_WEIGHTS.missingField;
      notes.push(`candidate does not name a station (requested ${requested.station})`);
    }
  }

  // ---- Document type --------------------------------------------------------
  if (requested.documentType) {
    const confirmingTypes = candidate.docCategory
      ? [...candidate.documentTypes, candidate.docCategory.toLowerCase()]
      : candidate.documentTypes;

    if (confirmingTypes.includes(requested.documentType)) {
      score += IDENTITY_WEIGHTS.documentType;
      matchedFields.push(`type:${requested.documentType}`);
      // A *name* that claims an extra type describes a different kind of
      // document: minutes *of* a presentation are not the presentation. The
      // indexer's category is excluded here — it is a classification of the file,
      // not something the document calls itself.
      const extras = candidate.documentTypes.filter(
        (type) => type !== requested.documentType && isDiscriminatingType(type)
      );
      if (extras.length > 0) {
        score += IDENTITY_WEIGHTS.documentTypeExtra;
        conflictingFields.push(`type_extra:${extras.join(",")}`);
        notes.push(`candidate also claims to be a ${extras.join("/")} document`);
      }
    } else if (candidate.documentTypes.some(isDiscriminatingType)) {
      score += IDENTITY_WEIGHTS.documentTypeConflict;
      conflictingFields.push(`type:${candidate.documentTypes.join(",")}`);
      notes.push(
        `requested a ${requested.documentType} but candidate is a ${candidate.documentTypes.join("/")} document`
      );
    } else {
      score += IDENTITY_WEIGHTS.missingField;
      notes.push(`candidate does not state a document type (requested ${requested.documentType})`);
    }
  }

  // ---- Contract -------------------------------------------------------------
  if (requested.contract) {
    if (candidate.contract === requested.contract) {
      score += IDENTITY_WEIGHTS.contract;
      matchedFields.push(`contract:${requested.contract}`);
    } else if (candidate.contract) {
      conflictingFields.push(`contract:${candidate.contract}`);
      notes.push(`requested contract ${requested.contract} but candidate is ${candidate.contract}`);
    }
  }

  const reason =
    notes.length > 0
      ? notes.join("; ")
      : matchedFields.length > 0
        ? `matched ${matchedFields.join(", ")}`
        : "no requested identity field could be confirmed";

  return { score, matchedFields, conflictingFields, disqualified, reason };
}

/**
 * Types specific enough that carrying one *instead of* the requested type is
 * evidence against a candidate. `submittal`, `report` and `correspondence` are
 * workflow buckets almost every document in this corpus sits in, so they never
 * argue against anything.
 */
function isDiscriminatingType(type: string): boolean {
  return !["submittal", "report", "correspondence", "contract", "safety"].includes(type);
}
