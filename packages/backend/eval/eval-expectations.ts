/**
 * Benchmark expectations for the independent answer grader.
 *
 * This module owns the *reference side* of the eval: what a question's answer is
 * supposed to contain, which document it must come from, and whether the answer
 * exists in the corpus at all. It deliberately knows nothing about the
 * production pipeline's own verdicts (`complete` / `partial` / `not_found` /
 * `source_mismatch`) — those describe pipeline behaviour, not correctness, and
 * are kept strictly separate from the PASS/PARTIAL/FAIL grade.
 *
 * Everything here is pure and synchronous so it can be unit-tested without a
 * database or an LLM. Identifier normalisation and refusal detection are
 * re-implemented locally rather than imported from `src/services` on purpose: a
 * grader that shares a bug with the code under test cannot detect that bug.
 */
import fs from "node:fs";

/**
 * How much trust the headline metrics can place in an expectation.
 *
 * - `verified` — a human confirmed the facts against the source document.
 * - `draft`    — machine-drafted from the full document text (see
 *                `author-expected-facts.ts`); useful, but a text-layer draft
 *                cannot establish facts that only exist as marks on a page, so
 *                a draft "fact is absent" must not be trusted for visual
 *                questions.
 * - `missing`  — no reference facts yet. Graded as UNGRADED and excluded from
 *                PASS/PARTIAL/FAIL denominators rather than silently counted.
 */
export type GroundTruthStatus = "verified" | "draft" | "missing";

/** One requested fact the answer has to get right. */
export interface ExpectedFact {
  /** Stable key the grader reports against, e.g. `unit_price`. */
  field: string;
  /** Human-readable label for reports. Defaults to `field`. */
  label?: string;
  /** Non-essential facts may be missing without costing a PASS. Default true. */
  essential?: boolean;
  /** Literal forms that count as correct. Any one of them is enough. */
  acceptedValues?: string[];
  /** Semantic expectation for answers that cannot be matched literally. */
  expectedMeaning?: string;
}

/** The document the answer must be based on. */
export interface ExpectedDocument {
  /** Construction identifier as written, e.g. `RFI-096`, `GEN-042R00`. */
  identifier?: string | null;
  /** Revision token when the question pins one, e.g. `R02`. */
  revision?: string | null;
  /** Case-insensitive substrings that identify the file when it has no id. */
  fileNamePatterns?: string[];
}

/** Where the supporting evidence is expected to be found. */
export interface ExpectedEvidence {
  /** Case-insensitive substring of the expected source file name. */
  fileNamePattern?: string;
  /** Pages that carry the fact. A cited page outside this set is suspicious. */
  pages?: number[];
  /** Verbatim quote from the document, for human review of the benchmark. */
  quote?: string;
}

export interface QuestionExpectation {
  id: string;
  /** Copy of the query for readability; the run file remains authoritative. */
  query?: string;
  groundTruth: GroundTruthStatus;
  /** How the expectation was produced, e.g. `human`, `llm-draft-text-layer`. */
  provenance?: string;
  /**
   * The fact lives on the page as a mark, dimension, or photograph. Used to
   * attribute failures to `VISUAL_EVIDENCE_MISSED` and to warn that a
   * text-layer draft cannot prove the fact absent.
   */
  visualEvidenceExpected?: boolean;
  /**
   * The file a drafting pass read the reference facts out of.
   *
   * Provenance, not a pin. It is deliberately kept out of `expectedDocument`:
   * that pin gates the wrong-document rule and is only ever derived from
   * reviewed sources — the identifier written in the question, the active
   * document the question was asked against, or `expected-document-pins.json`.
   * A drafting pass choosing between eighteen same-identifier files is not a
   * reviewed source, and letting its choice fail answers would turn a
   * benchmark-authoring miss into a reported pipeline defect.
   */
  draftedFromFile?: string;
  expected: {
    /**
     * False when the corpus genuinely does not contain the answer. A refusal is
     * then the correct behaviour and grades PASS.
     */
    answerAvailable: boolean;
    requiredFacts: ExpectedFact[];
    /** Claims that must not appear; each one present is a material error. */
    forbiddenClaims: string[];
    notes?: string;
  };
  expectedDocument?: ExpectedDocument;
  expectedEvidence?: ExpectedEvidence[];
}

export interface ExpectationFile {
  projectId?: string;
  description?: string;
  questions: QuestionExpectation[];
}

/** A fact counts as essential unless the benchmark says otherwise. */
export function isEssential(fact: ExpectedFact): boolean {
  return fact.essential !== false;
}

export function essentialFacts(expectation: QuestionExpectation): ExpectedFact[] {
  return expectation.expected.requiredFacts.filter(isEssential);
}

/**
 * True when the expectation carries enough reference material to grade against.
 * An expectation with no required facts can still be graded if it asserts the
 * answer is unavailable — that alone defines the correct behaviour.
 */
export function isGradable(expectation: QuestionExpectation | undefined): boolean {
  if (!expectation) return false;
  if (expectation.groundTruth === "missing") return false;
  if (!expectation.expected.answerAvailable) return true;
  return expectation.expected.requiredFacts.length > 0;
}

export function loadExpectations(filePath: string): Map<string, QuestionExpectation> {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as ExpectationFile;
  const byId = new Map<string, QuestionExpectation>();
  for (const question of parsed.questions ?? []) {
    if (question?.id) byId.set(question.id, question);
  }
  return byId;
}

// ---------------------------------------------------------------------------
// Identifier matching
// ---------------------------------------------------------------------------

/** Delimiter that cannot occur inside a token, so matches respect boundaries. */
const TOKEN_SEP = "\u0001";

/**
 * Split an identifier or a file name into comparison tokens: upper-cased letter
 * runs and digit runs with leading zeros stripped.
 *
 * `RFI-096`, `RFI096`, and `RFI-0096` all give `["RFI", "96"]`, so the same
 * document written three ways still matches, while `RFI-0042` gives
 * `["RFI", "42"]` and stays distinct. Zero-padding is the most common way a
 * wrong-document answer slips past a naive string compare.
 */
export function identifierTokens(raw: string): string[] {
  const runs = raw.toUpperCase().match(/[A-Z]+|\d+/g);
  if (!runs) return [];
  return runs.map((run) => (/^\d+$/.test(run) ? String(Number.parseInt(run, 10)) : run));
}

/** Delimiter-wrapped token string, for boundary-respecting containment tests. */
export function normalizeIdentifier(raw: string): string {
  const tokens = identifierTokens(raw);
  return tokens.length > 0 ? `${TOKEN_SEP}${tokens.join(TOKEN_SEP)}${TOKEN_SEP}` : "";
}

/**
 * Does `text` (a file name, a source label, an answer) carry `identifier`?
 *
 * Compared as a contiguous run of whole tokens, which tolerates the prefixes and
 * suffixes real file names carry (`A37806_01 30 20_GEN-042R00 - FIO - ....pdf`)
 * without letting `AVI-002` match `AVI-020R00` the way a plain substring test
 * would. Single-token identifiers are rejected as too ambiguous to match on.
 */
export function identifierAppearsIn(identifier: string, text: string): boolean {
  const needle = identifierTokens(identifier);
  if (needle.length < 2) return false;
  return normalizeIdentifier(text).includes(`${TOKEN_SEP}${needle.join(TOKEN_SEP)}${TOKEN_SEP}`);
}

/**
 * Reduce a file name to the parts that identify the *document*, dropping the
 * parts that only identify a copy of it.
 *
 * Two things are removed before comparison:
 *
 * - The submittal status code (`A37806_…_GEN-042R00 - FIO - Coordination Meeting
 *   Minutes.pdf` vs `… - ORIG - …`). The same document is re-transmitted through
 *   ORIG / FIO / APP / AAN / RWC / R&R / CLO states, each a separate file record.
 *   Answering the coordination meeting question from the ORIG copy instead of the
 *   FIO copy is not a wrong-document error. Only short tokens delimited by dashes
 *   are stripped, so descriptive words survive.
 * - The extension, since the corpus carries .pdf/.docx/.xer siblings of one
 *   document.
 *
 * Separators are then levelled, because the same document reaches this check
 * under two spellings: the real file name from `sources` and the extractor's own
 * lower-cased, truncated label (`a37806 01 30 20 gen-042r00 - fio -`).
 *
 * A revision suffix (`R00` vs `R02`) is deliberately *not* removed — that is a
 * different revision of the drawing, and answering from the wrong one is exactly
 * the confusion the fidelity check exists to surface.
 */
export function documentNameKey(fileName: string): string {
  return fileName
    .replace(/\.[A-Za-z0-9]{2,5}$/, "")
    // Case-insensitive: the extractor's own label arrives lower-cased, and the
    // trailing dash it leaves behind (`… gen-042r00 - fio -`) has to strip too.
    .replace(/\s+-\s+[A-Za-z&]{2,5}(?=\s+-|\s*$)/g, " ")
    .toLowerCase()
    .replace(/[_\-\s.]+/g, " ")
    .trim();
}

/**
 * Match a file-name pattern against a source label. Containment is tested both
 * ways so the extractor's truncated label still matches a full-file-name pin.
 */
export function fileNameMatchesPattern(fileName: string, pattern: string): boolean {
  const name = documentNameKey(fileName);
  const needle = documentNameKey(pattern);
  if (needle.length < 3 || name.length < 3) return false;
  return name.includes(needle) || needle.includes(name);
}

export interface CandidateSource {
  fileName?: string;
  pages?: number[];
  page?: number | null;
}

export type DocumentFidelityStatus = "match" | "mismatch" | "unknown";

export interface DocumentFidelityResult {
  status: DocumentFidelityStatus;
  expectedIdentifier: string | null;
  /** Source file names that carry the expected document identity. */
  matchedSources: string[];
  /** Source file names that do not. */
  otherSources: string[];
  detail: string;
}

/**
 * Check the document the answer actually stands on against the benchmark,
 * independently of anything the pipeline reported.
 *
 * `unknown` means the check does not apply — either the benchmark pins no
 * document, or the answer cited no source at all (which the refusal rules
 * handle instead). `mismatch` means a source was returned and none of them is
 * the requested document: an answer built on that evidence is wrong regardless
 * of how confident it sounds.
 *
 * File-name patterns take precedence over the identifier when the benchmark
 * records both. Identifiers collide badly in this corpus — sixteen files carry
 * `RFI-096`, eleven carry `GEN-001R05` — so once the benchmark knows *which*
 * file is meant, checking the identifier as well would only re-admit the
 * near-miss siblings the pin exists to exclude.
 */
export function checkDocumentFidelity(
  expectation: QuestionExpectation,
  sources: CandidateSource[]
): DocumentFidelityResult {
  const expected = expectation.expectedDocument;
  const identifier = expected?.identifier ?? null;
  const patterns = expected?.fileNamePatterns ?? [];

  if (!expected || (!identifier && patterns.length === 0)) {
    return {
      status: "unknown",
      expectedIdentifier: identifier,
      matchedSources: [],
      otherSources: sources.map((s) => s.fileName ?? "?"),
      detail: "the benchmark pins no document for this question",
    };
  }

  const names = sources.map((s) => s.fileName ?? "").filter((n) => n.length > 0);
  if (names.length === 0) {
    return {
      status: "unknown",
      expectedIdentifier: identifier,
      matchedSources: [],
      otherSources: [],
      detail: "no source was returned, so there is no document identity to check",
    };
  }

  const usePatterns = patterns.length > 0;
  const matched: string[] = [];
  const other: string[] = [];
  for (const name of names) {
    const hit = usePatterns
      ? patterns.some((pattern) => fileNameMatchesPattern(name, pattern))
      : identifierAppearsIn(identifier as string, name);
    // A pinned revision has to be carried by the same file, not by a sibling.
    const revisionOk = !expected.revision || identifierAppearsIn(expected.revision, name);
    if (hit && revisionOk) matched.push(name);
    else other.push(name);
  }

  const pinDescription = usePatterns ? patterns.join(" / ") : (identifier as string);
  if (matched.length > 0) {
    return {
      status: "match",
      expectedIdentifier: identifier,
      matchedSources: matched,
      otherSources: other,
      detail: `${matched.length} of ${names.length} returned source(s) match the pinned document (${pinDescription})`,
    };
  }

  return {
    status: "mismatch",
    expectedIdentifier: identifier,
    matchedSources: [],
    otherSources: other,
    detail: `none of the ${names.length} returned source(s) match the pinned document (${pinDescription})`,
  };
}

export type EvidenceCheckStatus = "match" | "partial" | "mismatch" | "unknown";

export interface EvidenceCheckResult {
  status: EvidenceCheckStatus;
  detail: string;
}

/**
 * Compare the pages the answer cited against the pages the benchmark says carry
 * the fact. Only runs when the benchmark records expected evidence; a citation
 * is never assumed valid merely because it exists.
 */
export function checkExpectedEvidence(
  expectation: QuestionExpectation,
  sources: CandidateSource[]
): EvidenceCheckResult {
  const expected = expectation.expectedEvidence ?? [];
  if (expected.length === 0) {
    return { status: "unknown", detail: "the benchmark records no expected evidence location" };
  }
  if (sources.length === 0) {
    return { status: "mismatch", detail: "the answer cited no evidence at all" };
  }

  const citedPagesFor = (pattern?: string): number[] => {
    const pages: number[] = [];
    for (const source of sources) {
      const name = source.fileName ?? "";
      if (pattern && !fileNameMatchesPattern(name, pattern)) continue;
      if (typeof source.page === "number") pages.push(source.page);
      for (const page of source.pages ?? []) pages.push(page);
    }
    return pages;
  };

  let hits = 0;
  const notes: string[] = [];
  for (const entry of expected) {
    const cited = citedPagesFor(entry.fileNamePattern);
    if (cited.length === 0) {
      notes.push(`no citation in ${entry.fileNamePattern ?? "the expected file"}`);
      continue;
    }
    if (!entry.pages || entry.pages.length === 0) {
      hits += 1;
      continue;
    }
    if (entry.pages.some((page) => cited.includes(page))) {
      hits += 1;
    } else {
      notes.push(
        `expected p.${entry.pages.join("/")} in ${entry.fileNamePattern ?? "the expected file"}, cited p.${[...new Set(cited)].join("/")}`
      );
    }
  }

  if (hits === expected.length) {
    return { status: "match", detail: "every expected evidence location was cited" };
  }
  if (hits > 0) {
    return { status: "partial", detail: notes.join("; ") };
  }
  return { status: "mismatch", detail: notes.join("; ") || "no expected evidence location was cited" };
}

// ---------------------------------------------------------------------------
// Refusal detection
// ---------------------------------------------------------------------------

/**
 * Phrases that assert the absence of information rather than stating a fact.
 * Matched per line, so a multi-field answer that reports one field as
 * unverifiable is not mistaken for a whole-answer refusal.
 */
const REFUSAL_PATTERNS: RegExp[] = [
  /\bdoes not (specify|contain|include|indicate|state|mention|provide)\b/i,
  /\b(is|are|was|were) not (specified|stated|provided|available|included|present|documented|recorded)\b/i,
  /\bcould not (be )?(verif|confirm|determin|locat)/i,
  /\bunable to (verify|confirm|determine|locate|find)\b/i,
  /\bno (information|evidence|records?|documents?|sources?|details?)\b.*\b(found|available|provided|returned|retrieved|carr)/i,
  /\bnot found in (the )?(source|document|evidence|provided)/i,
  /\bthe available information does not\b/i,
  /\bno retrieved source carries\b/i,
  /\brequested\b.*\bbut no\b/i,
  /\bi (don't|do not) have\b/i,
  /\bcannot answer\b/i,
];

/**
 * Strip presentation so the refusal test looks only at claim-bearing prose:
 * citation links, the trailing Sources / Evidence block, headings, and list
 * markers all carry no factual content of their own.
 */
export function stripPresentation(content: string): string[] {
  const withoutCitations = content
    .replace(/\[\[?\d+\]?\]\([^)]*\)/g, "")
    .replace(/\[[\d,\s]+\]/g, "");
  const cut = withoutCitations.split(/\n#{2,}\s*Sources?\b/i)[0];
  return cut
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*[-*+]\s+/, "")
        .replace(/^\s*\d+[.)]\s+/, "")
        .replace(/[*_`>]/g, "")
        .trim()
    )
    .filter((line) => line.length > 0)
    .filter((line) => !/^#{1,6}\s/.test(line) && !line.startsWith("#"))
    .filter((line) => !/^Evidence:/i.test(line))
    .filter((line) => !/^Sources?:?$/i.test(line))
    .filter((line) => !/^\[\d+\]\s/.test(line));
}

export interface RefusalDetection {
  isRefusal: boolean;
  /** Lines that assert a fact rather than an absence. */
  substantiveLines: string[];
  signal: string;
}

/**
 * Does the rendered answer assert any fact, or does it only report absence?
 *
 * Derived from the answer text the user sees, not from the pipeline's status
 * label, so a `complete` answer whose rendered body says nothing is still
 * recognised as a refusal.
 */
export function detectRefusal(content: string): RefusalDetection {
  const lines = stripPresentation(content ?? "");
  if (lines.length === 0) {
    return { isRefusal: true, substantiveLines: [], signal: "rendered answer has no body text" };
  }
  const substantive = lines.filter((line) => !REFUSAL_PATTERNS.some((pattern) => pattern.test(line)));
  if (substantive.length === 0) {
    return {
      isRefusal: true,
      substantiveLines: [],
      signal: "every line of the rendered answer reports absent information",
    };
  }
  return {
    isRefusal: false,
    substantiveLines: substantive,
    signal: `${substantive.length} fact-bearing line(s) in the rendered answer`,
  };
}
