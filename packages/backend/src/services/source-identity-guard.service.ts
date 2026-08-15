/**
 * Source Identity Guard.
 *
 * Runs after retrieval and before answering: verifies that the retrieved source
 * actually *is* the document the user asked about. The guard extracts the
 * requested identity from the question — document identifier, revision,
 * station/location, document type — and compares each of those against the
 * identity carried by every retrieved candidate.
 *
 * Rules enforced here:
 *   * Exact identifier match is mandatory when the question carries an identifier.
 *     `RFI096` is never answered from `RFI-0042`.
 *   * A specified revision is never silently substituted:
 *     `PRDC12-012R02` is never answered from `PRDC12-012R00`.
 *   * A station-specific question is not answered from another station's document
 *     unless that document explicitly contains the requested station's information
 *     (a Burnside submittal may answer a Norwood question only if it names Norwood).
 *   * Conflicting documents are rejected rather than synthesised from. When no
 *     acceptable source survives, the verdict is `retry_retrieval`.
 *
 * Deliberately deterministic — no LLM call. Document identity is a string-equality
 * question over normalized identifiers, and the normalizer already lives in
 * `identifier-extraction.utils`. Sending it to a model would add latency, cost, and
 * a way for `RFI-0042` to be talked into passing for `RFI096`.
 */

import {
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

export type SourceIdentityAction = "continue" | "retry_retrieval";

/** A revision reference, kept with its verbatim form for use in reason strings. */
export interface RevisionRef {
  raw: string;
  number: number;
}

/** The document identity the question asks for. */
export interface RequestedIdentity {
  identifiers: ExtractedIdentifier[];
  revision?: RevisionRef;
  station?: { code: StationCode; name: string };
  docCategory?: string;
}

/** A retrieved candidate whose identity is being checked. */
export interface CandidateSource {
  /** Stable key the caller uses to filter evidence — the file id when known. */
  key: string;
  fileName: string;
  filePath?: string;
  /**
   * Text retrieved from this source. Used only for the station exception: a
   * document from another station may answer the question when it explicitly
   * contains the requested station's information.
   */
  text?: string;
  docCategory?: string;
  revision?: string;
}

export interface SourceIdentityVerdict {
  valid: boolean;
  action: SourceIdentityAction;
  /** Present when the verdict is invalid; names the requested vs retrieved identity. */
  reason?: string;
  /** Keys of the candidates that may be answered from. */
  acceptedKeys: string[];
  rejected: Array<{ key: string; fileName: string; reason: string }>;
  /** The identity parsed out of the question, exposed for logging and tests. */
  requested: RequestedIdentity;
}

export interface VerifySourceIdentityInput {
  question: string;
  sources: CandidateSource[];
  /**
   * True when the requested identifier is known to exist in the project index
   * (e.g. `lookupExactIdentifier` resolved it). Sharpens the rejection reason:
   * the right document is retrievable, so a conflicting one must not be used.
   */
  exactMatchInCorpus?: boolean;
  /** Pre-parsed requested identity; parsed from `question` when omitted. */
  requested?: RequestedIdentity;
}

// ============================================================
// Parsing the requested identity out of the question
// ============================================================

// Non-alphanumeric boundaries: `\b` treats `_` as a word char, and we must not
// match a revision token inside a control number ("GEN-023R00" -> not "R00").
const REVISION_TOKEN_RE = /(?<![A-Za-z0-9])R(\d{1,2})(?![A-Za-z0-9])/;
const REVISION_WORD_RE = /\brev(?:ision)?\.?\s*#?\s*(\d{1,2})(?![A-Za-z0-9])/i;

/**
 * Station references as a user writes them. Codes are matched case-sensitively
 * (`\bnor\b` would otherwise fire on "neither X nor Y"), and `GEN` / "General"
 * is excluded because it is the catch-all origin, not a station.
 */
const STATION_QUESTION_PATTERNS: Array<{ code: StationCode; namePattern: RegExp }> = [
  { code: "NOR", namePattern: /\bnorwood\b/i },
  { code: "BUR", namePattern: /\bburnside\b/i },
  { code: "MYR", namePattern: /\bmyrtle\b/i },
  { code: "MID", namePattern: /\bmiddletown\b/i },
  { code: "AVI", namePattern: /\bavenue\s+i\b/i },
];

/** Document types a question can name, mapped to the corpus category vocabulary. */
const DOC_TYPE_QUESTION_PATTERNS: Array<{ category: string; pattern: RegExp }> = [
  { category: "rfi", pattern: /\brfis?\b/i },
  { category: "submittal", pattern: /\bsubmittals?\b/i },
  { category: "change_order", pattern: /\bchange\s+orders?\b|\bpco\b/i },
  { category: "meeting_minutes", pattern: /\bmeeting\s+minutes\b/i },
  { category: "schedule", pattern: /\bschedules?\b/i },
  { category: "spec", pattern: /\bspecifications?\b|\bspecs?\b/i },
  { category: "permit", pattern: /\bpermits?\b/i },
  { category: "invoice", pattern: /\binvoices?\b|\bpay\s+app(?:lication)?s?\b/i },
  { category: "drawing", pattern: /\bdrawings?\b|\bdwgs?\b/i },
  { category: "safety", pattern: /\bsafety\b/i },
  { category: "contract", pattern: /\bcontracts?\b/i },
  { category: "correspondence", pattern: /\bletters?\b|\btransmittals?\b/i },
];

function parseRevisionRef(text: string): RevisionRef | undefined {
  const token = REVISION_TOKEN_RE.exec(text);
  if (token) {
    return { raw: token[0], number: Number.parseInt(token[1], 10) };
  }
  const word = REVISION_WORD_RE.exec(text);
  if (word) {
    return { raw: word[0].trim(), number: Number.parseInt(word[1], 10) };
  }
  return undefined;
}

function parseStationRef(question: string): RequestedIdentity["station"] {
  for (const { code, namePattern } of STATION_QUESTION_PATTERNS) {
    const codePattern = new RegExp(`(?<![A-Za-z0-9])${code}(?![A-Za-z0-9])`);
    if (namePattern.test(question) || codePattern.test(question)) {
      return { code, name: STATION_NAMES[code] };
    }
  }
  return undefined;
}

/**
 * Extract the document identity a question asks for. Everything is optional: a
 * question with none of these carries no identity to guard.
 */
export function parseRequestedIdentity(question: string): RequestedIdentity {
  const identifiers = extractIdentifiers(question);

  // A revision named outside an identifier ("revision 2 of the QWP plan"). When
  // the revision is part of a control number the identifier check already covers
  // it, and the boundary rules above keep it from being double-counted.
  const revision = parseRevisionRef(question);

  const station = parseStationRef(question);

  const docCategory = DOC_TYPE_QUESTION_PATTERNS.find((entry) =>
    entry.pattern.test(question)
  )?.category;

  return {
    identifiers,
    ...(revision ? { revision } : {}),
    ...(station ? { station } : {}),
    ...(docCategory ? { docCategory } : {}),
  };
}

/** True when the question specifies nothing that could identify a document. */
export function hasRequestedIdentity(requested: RequestedIdentity): boolean {
  return (
    requested.identifiers.length > 0 ||
    requested.revision !== undefined ||
    requested.station !== undefined ||
    requested.docCategory !== undefined
  );
}

// ============================================================
// Describing a candidate's identity
// ============================================================

export interface SourceIdentity {
  identifiers: ExtractedIdentifier[];
  revision?: RevisionRef;
  station?: StationCode;
  docCategory?: string;
}

/**
 * Read a candidate's identity from its filename and path. Name and path are the
 * authoritative identity carriers in this corpus (see identifier-extraction.utils),
 * so this never needs the document body.
 */
export function describeSourceIdentity(source: CandidateSource): SourceIdentity {
  const filePath = source.filePath ?? "";
  const meta = extractPathMetadata(source.fileName, filePath);
  const revisionRaw = source.revision ?? meta.revision;

  return {
    identifiers: extractIdentifiers(source.fileName, filePath),
    ...(revisionRaw ? { revision: { raw: revisionRaw, number: revisionNumber(revisionRaw) } } : {}),
    ...(meta.station ? { station: meta.station } : {}),
    ...(source.docCategory ?? meta.docCategory
      ? { docCategory: source.docCategory ?? meta.docCategory }
      : {}),
  };
}

/**
 * True when a source's text explicitly contains the requested station's
 * information — the one case where another station's document may answer a
 * station-specific question.
 */
function mentionsStation(text: string | undefined, station: { code: StationCode; name: string }): boolean {
  if (!text) return false;
  const namePattern = STATION_QUESTION_PATTERNS.find((entry) => entry.code === station.code)?.namePattern;
  if (namePattern?.test(text)) return true;
  return new RegExp(`(?<![A-Za-z0-9])${station.code}(?![A-Za-z0-9])`).test(text);
}

// ============================================================
// Per-candidate comparison
// ============================================================

type IdentityOutcome = "match" | "conflict" | "silent";

interface CandidateVerdict {
  source: CandidateSource;
  outcome: IdentityOutcome;
  /** Set when the outcome is a conflict. */
  reason?: string;
}

function groupByType(identifiers: ExtractedIdentifier[]): Map<IdentifierType, ExtractedIdentifier[]> {
  const grouped = new Map<IdentifierType, ExtractedIdentifier[]>();
  for (const identifier of identifiers) {
    const existing = grouped.get(identifier.type);
    if (existing) existing.push(identifier);
    else grouped.set(identifier.type, [identifier]);
  }
  return grouped;
}

function formatRaws(identifiers: ExtractedIdentifier[]): string {
  return identifiers.map((identifier) => identifier.raw).join(" / ");
}

/**
 * Compare one candidate against the requested identity.
 *
 * Identifiers are compared per type over the whole requested set, so a question
 * naming two RFIs accepts a source carrying either, while a source carrying a
 * *different* value of a requested type is a conflict. A source that carries no
 * identifier of the requested type is `silent`: it cannot be confirmed as the
 * requested document, but it does not contradict it either.
 */
function checkCandidate(
  source: CandidateSource,
  requested: RequestedIdentity
): CandidateVerdict {
  const identity = describeSourceIdentity(source);
  const requestedByType = groupByType(requested.identifiers);
  const sourceByType = groupByType(identity.identifiers);

  let matched = false;

  for (const [type, wanted] of requestedByType) {
    const carried = sourceByType.get(type);
    if (!carried || carried.length === 0) continue; // silent for this type

    const wantedValues = new Set(wanted.map((identifier) => identifier.valueNormalized));
    const hit = carried.find((identifier) => wantedValues.has(identifier.valueNormalized));
    if (hit) {
      matched = true;
      continue;
    }

    return {
      source,
      outcome: "conflict",
      reason: `Requested ${formatRaws(wanted)} but retrieved ${formatRaws(carried)}.`,
    };
  }

  // An explicitly requested revision must not be silently substituted.
  if (
    requested.revision &&
    identity.revision &&
    identity.revision.number >= 0 &&
    identity.revision.number !== requested.revision.number
  ) {
    return {
      source,
      outcome: "conflict",
      reason: `Requested revision ${requested.revision.raw} but retrieved ${identity.revision.raw}.`,
    };
  }

  // Another station's document may only answer a station-specific question when
  // it explicitly contains the requested station's information.
  if (
    requested.station &&
    identity.station &&
    identity.station !== requested.station.code &&
    !mentionsStation(source.text, requested.station)
  ) {
    return {
      source,
      outcome: "conflict",
      reason: `Requested ${requested.station.name} but retrieved a ${STATION_NAMES[identity.station]} document that does not mention ${requested.station.name}.`,
    };
  }

  return { source, outcome: matched ? "match" : "silent" };
}

// ============================================================
// Public API
// ============================================================

/**
 * Verify that at least one retrieved candidate is the document the question asks
 * about, and report which candidates may be answered from.
 *
 * `action: "continue"` means `acceptedKeys` is safe to answer from — note that it
 * can be a strict subset of the input, so callers must filter their evidence by it
 * rather than treating a valid verdict as blanket approval.
 */
export function verifySourceIdentity(input: VerifySourceIdentityInput): SourceIdentityVerdict {
  const requested = input.requested ?? parseRequestedIdentity(input.question);

  // Nothing in the question identifies a document, so there is nothing to guard.
  if (!hasRequestedIdentity(requested) || input.sources.length === 0) {
    return {
      valid: true,
      action: "continue",
      acceptedKeys: input.sources.map((source) => source.key),
      rejected: [],
      requested,
    };
  }

  const verdicts = input.sources.map((source) => checkCandidate(source, requested));

  // With an identifier in the question, an exact match is mandatory: a source
  // that never carries the identifier cannot be confirmed as the requested
  // document. Without one, any source that does not contradict the requested
  // attributes is acceptable.
  const identifierRequested = requested.identifiers.length > 0;
  const isAccepted = (verdict: CandidateVerdict): boolean =>
    identifierRequested ? verdict.outcome === "match" : verdict.outcome !== "conflict";

  let accepted = verdicts.filter(isAccepted);
  const rejected = verdicts
    .filter((verdict) => !isAccepted(verdict))
    .map((verdict) => ({
      key: verdict.source.key,
      fileName: verdict.source.fileName,
      reason:
        verdict.reason ??
        `${verdict.source.fileName} does not carry ${formatRaws(requested.identifiers)}.`,
    }));

  // Document type is a weak signal: it only narrows an already-acceptable set,
  // and never empties it. A question naming a type prefers sources of that type
  // when any exist, but a type mismatch alone never triggers retry_retrieval —
  // the requested information often lives in an attached letter or transmittal.
  if (requested.docCategory && accepted.length > 1) {
    const onType = accepted.filter(
      (verdict) => describeSourceIdentity(verdict.source).docCategory === requested.docCategory
    );
    if (onType.length > 0 && onType.length < accepted.length) {
      for (const verdict of accepted) {
        if (onType.includes(verdict)) continue;
        rejected.push({
          key: verdict.source.key,
          fileName: verdict.source.fileName,
          reason: `Question asks for a ${requested.docCategory} document; this source is not one.`,
        });
      }
      accepted = onType;
    }
  }

  if (accepted.length > 0) {
    return {
      valid: true,
      action: "continue",
      acceptedKeys: accepted.map((verdict) => verdict.source.key),
      rejected,
      requested,
    };
  }

  // Nothing acceptable survived. Lead with a real conflict when we have one —
  // it is the most actionable explanation — otherwise report the absent identifier.
  const conflict = verdicts.find((verdict) => verdict.outcome === "conflict");
  const baseReason =
    conflict?.reason ??
    (identifierRequested
      ? `Requested ${formatRaws(requested.identifiers)} but no retrieved source carries that identifier.`
      : "No retrieved source matches the document identity requested in the question.");

  const reason = input.exactMatchInCorpus
    ? `${baseReason} The requested document exists in the project index and should be retrieved instead.`
    : baseReason;

  return {
    valid: false,
    action: "retry_retrieval",
    reason,
    acceptedKeys: [],
    rejected,
    requested,
  };
}

/**
 * Reduce a verdict to the guard's wire shape — `{valid, action}` on success,
 * plus `reason` on failure. Used for logging and for eval parity with the
 * Source Identity Guard spec.
 */
export function toGuardJson(verdict: SourceIdentityVerdict): {
  valid: boolean;
  action: SourceIdentityAction;
  reason?: string;
} {
  return {
    valid: verdict.valid,
    action: verdict.action,
    ...(verdict.reason ? { reason: verdict.reason } : {}),
  };
}
