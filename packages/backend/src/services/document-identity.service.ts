/**
 * Document identity resolution — the stage that runs *before* retrieval.
 *
 *   query
 *     → extract document identity        (document-identity.utils)
 *     → generate candidate documents     (identifier index + file-name search)
 *     → score candidate identity         (document-identity.utils)
 *     → confirm or reject the lock       (here)
 *     → retrieve only within the locked document
 *
 * The rule this stage exists to enforce: semantic similarity may *propose* a
 * document, but it can never *confirm* one. A lock is only issued when a
 * candidate carries the identity the question asked for — identifier, revision,
 * date, title phrase, station, type — and no rival candidate is equally close.
 * Anything less returns `ambiguous` or `not_found`, and the caller falls back to
 * project-wide retrieval instead of answering from a document it guessed at.
 *
 * The Source Identity Guard (`source-identity-guard.service`) still runs after
 * retrieval. It stays the emergency brake; this stage is what should normally
 * make the brake unnecessary.
 *
 * Every decision emits a structured trace event (`document_identity.*`) carrying
 * each candidate's identifier, matched fields, conflicting fields and score, so a
 * lock or a rejection can be explained from the logs alone.
 */

import { and, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import type { UUID } from "@contractor/shared";
import { getDbIfInitialized, documentIdentifiers, fileRecords } from "../db";
import { logger } from "../lib/logger";
import {
  describeFileIdentity,
  extractRequestedIdentity,
  hasRequestedIdentity,
  identityFamilyKey,
  IDENTITY_WEIGHTS,
  scoreIdentity,
  type CandidateIdentity,
  type IdentityScore,
  type RequestedDocumentIdentity,
} from "./document-identity.utils";
import {
  revisionNumber,
  statusApprovedRank,
  type StationCode,
} from "./identifier-extraction.utils";

// ============================================================
// Tuning
// ============================================================

/**
 * Minimum identity score for a lock.
 *
 * Read against `IDENTITY_WEIGHTS`: 6 is reached by a title phrase plus a
 * document type, or a station plus a date, but not by a station alone (3), a
 * month alone (3) or a document type alone (2). An exact identifier (10) clears
 * it on its own. Raising this makes the resolver hand more questions to
 * project-wide retrieval; lowering it lets thinner evidence create a lock.
 */
export const LOCK_MIN_SCORE = 6;

/**
 * A lock also needs this many distinct identity dimensions confirmed — unless an
 * exact identifier matched, which is a document's name and stands on its own.
 */
const LOCK_MIN_MATCHED_DIMENSIONS = 2;

/**
 * The gap that makes the best candidate decisive. Every identity signal is worth
 * at least 2 points, so a gap of 2 or more means the two candidates genuinely
 * differ on an identity attribute; a gap of 0 or 1 is tie-break noise (a
 * path-only title term, a field one of them is silent about) and resolves to
 * `ambiguous` rather than a coin flip.
 */
const AMBIGUITY_MARGIN = 2;

/** Caps on candidate generation, so a broad title term cannot fan out forever. */
const CANDIDATE_LIMIT_NARROW = 200;
const CANDIDATE_LIMIT_WIDE = 500;
const MAX_CANDIDATES = 800;
/** How many candidates the result reports back (highest-scoring first). */
const REPORTED_CANDIDATES = 8;

// ============================================================
// Types
// ============================================================

export interface CandidateIdentitySummary {
  fileId: string;
  fileName: string;
  filePath: string;
  /** Normalized identifiers the candidate carries, `TYPE:VALUE`. */
  normalizedIdentifiers: string[];
  matchedFields: string[];
  conflictingFields: string[];
  identityScore: number;
  decision: "locked" | "rejected" | "runner_up" | "duplicate_of_locked";
  reason: string;
  chunkCount?: number;
}

export interface DocumentLockResult {
  status: "locked" | "ambiguous" | "not_found";
  fileId?: UUID;
  fileName?: string;
  filePath?: string;
  /** 0–1, the share of the requested identity the locked candidate confirmed. */
  confidence: number;
  matchedFields: string[];
  conflictingFields: string[];
  candidateFiles?: CandidateIdentitySummary[];
  /** The identity parsed out of the question, for logging and tests. */
  requested: RequestedDocumentIdentity;
  /** Why the status is what it is. Always present. */
  reason: string;
}

/** A file the caller already has (e.g. from semantic retrieval) to score too. */
export interface ExtraCandidate {
  fileId: string;
  fileName: string;
  filePath: string;
  docCategory?: string;
  revision?: string;
  chunkCount?: number;
}

export interface ResolveDocumentLockInput {
  projectId: UUID;
  /** The user's question, verbatim. */
  question: string;
  /**
   * The document-reference span inside the question, when the caller has already
   * isolated it ("In <reference>, what …"). Title terms are taken from this
   * alone; see `extractRequestedIdentity`.
   */
  reference?: string;
  /**
   * Candidates from other sources — semantic retrieval, the active document, an
   * upstream exact-identifier lookup. They are scored on identity like any other
   * candidate and get no head start.
   */
  extraCandidates?: ExtraCandidate[];
  /**
   * Doc categories the query interpretation has already narrowed to. Candidates
   * that declare a *different* category are dropped before scoring — a Progress
   * Report that mentions a meeting in passing must not win over the actual
   * Meeting Minutes. Candidates with no category are kept: an unclassified file
   * is not evidence against itself.
   */
  restrictToDocCategories?: readonly string[];
  /** Correlation id for the trace events. */
  traceId?: string;
}

// ============================================================
// Candidate generation
// ============================================================

/** The name fragment a station is written with in these file names. */
const STATION_SEARCH_TERMS: Record<StationCode, string[]> = {
  AVI: ["Ave I", "Avenue I", "AVI"],
  MID: ["Middletown", "MID"],
  MYR: ["Myrtle", "MYR"],
  NOR: ["Norwood", "NOR"],
  BUR: ["Burnside", "BUR"],
  GEN: ["GEN"],
};

type FileRow = {
  id: string;
  fileName: string;
  filePath: string;
  docCategory: string | null;
  revision: string | null;
  chunkCount: number | null;
  extractedFields: unknown;
};

const FILE_COLUMNS = {
  id: fileRecords.id,
  fileName: fileRecords.fileName,
  filePath: fileRecords.filePath,
  docCategory: fileRecords.docCategory,
  revision: fileRecords.revision,
  chunkCount: fileRecords.chunkCount,
  extractedFields: fileRecords.extractedFields,
};

function nameLike(term: string): SQL {
  return ilike(fileRecords.fileName, `%${term.replace(/[%_\\]/g, "\\$&")}%`);
}

/**
 * Collect the files that could be the requested document.
 *
 * Three passes, narrowest first, each only run when the previous one came back
 * thin. Narrow-first matters: the old file-lookup path searched one term at a
 * time and let a generic term ("2025") exhaust its candidate budget before the
 * distinctive term ("VECP") was ever searched, so the right document was never
 * even a candidate.
 */
async function generateCandidates(
  projectId: UUID,
  requested: RequestedDocumentIdentity
): Promise<{ rows: Map<string, FileRow>; passes: string[] }> {
  const db = getDbIfInitialized();
  const rows = new Map<string, FileRow>();
  const passes: string[] = [];
  if (!db) return { rows, passes };

  const collect = async (pass: string, where: SQL, limit: number): Promise<number> => {
    const found = await db
      .select(FILE_COLUMNS)
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, projectId), where))
      .orderBy(desc(fileRecords.chunkCount))
      .limit(limit);
    for (const row of found) {
      if (rows.size >= MAX_CANDIDATES) break;
      rows.set(row.id, row as FileRow);
    }
    passes.push(`${pass}:${found.length}`);
    return found.length;
  };

  // ---- Pass 0: the identifier index. Exact and normalized identifier matches
  // are the strongest candidate source there is, so they always run.
  if (requested.identifiers.length > 0) {
    const idRows = await db
      .select({ fileId: documentIdentifiers.fileId })
      .from(documentIdentifiers)
      .where(
        and(
          eq(documentIdentifiers.projectId, projectId),
          or(
            ...requested.identifiers.map((identifier) =>
              and(
                eq(documentIdentifiers.type, identifier.type),
                eq(documentIdentifiers.valueNormalized, identifier.valueNormalized)
              )!
            )
          )!
        )
      )
      .limit(CANDIDATE_LIMIT_WIDE);

    const fileIds = Array.from(new Set(idRows.map((row) => row.fileId)));
    if (fileIds.length > 0) {
      await collect("identifier_index", inArray(fileRecords.id, fileIds), CANDIDATE_LIMIT_WIDE);
    } else {
      passes.push("identifier_index:0");
    }

    // The identifier may be in the name without an index row (a file indexed
    // before identifier extraction existed, or a backfill still pending).
    await collect(
      "identifier_name",
      or(...requested.identifiers.map((identifier) => nameLike(identifier.raw.trim())))!,
      CANDIDATE_LIMIT_NARROW
    );
  }

  const titleTerms = requested.titleTerms.filter((term) => term.length >= 3);
  const stationTerms = requested.stationCode
    ? STATION_SEARCH_TERMS[requested.stationCode]
    : [];

  // ---- Pass 1: every title term in the file name (plus the station when named).
  if (titleTerms.length > 0) {
    const clauses: SQL[] = titleTerms.map(nameLike);
    if (stationTerms.length > 0) clauses.push(or(...stationTerms.map(nameLike))!);
    const narrow = await collect("title_and", and(...clauses)!, CANDIDATE_LIMIT_NARROW);

    // ---- Pass 2: any title term, still anchored to the station.
    if (narrow < 5 && stationTerms.length > 0) {
      await collect(
        "title_or_station",
        and(or(...titleTerms.map(nameLike))!, or(...stationTerms.map(nameLike))!)!,
        CANDIDATE_LIMIT_NARROW
      );
    }

    // ---- Pass 3: any title term. Ordered by indexed-chunk count so that, when
    // a broad term has to be truncated, the files that could actually answer are
    // the ones kept. Generation order never decides the lock — scoring does.
    if (rows.size < 5) {
      await collect("title_or", or(...titleTerms.map(nameLike))!, CANDIDATE_LIMIT_WIDE);
    }
  } else if (stationTerms.length > 0 && (requested.dateRef || requested.documentType)) {
    // ---- Pass 4: no distinctive title term — a station plus a date or a type is
    // all we have to go on. Scoring will almost certainly refuse to lock, but the
    // candidates are still logged so the trace explains why.
    await collect("station_only", or(...stationTerms.map(nameLike))!, CANDIDATE_LIMIT_WIDE);
  }

  return { rows, passes };
}

function readStatusCode(fields: unknown): string | undefined {
  const source =
    typeof fields === "string"
      ? (() => {
          try {
            return JSON.parse(fields);
          } catch {
            return undefined;
          }
        })()
      : fields;
  const value = (source as Record<string, unknown> | undefined)?.statusCode;
  return typeof value === "string" ? value : undefined;
}

function toCandidateIdentity(row: FileRow): CandidateIdentity {
  return describeFileIdentity({
    fileId: row.id,
    fileName: row.fileName,
    filePath: row.filePath,
    ...(row.docCategory ? { docCategory: row.docCategory } : {}),
    ...(row.revision ? { revision: row.revision } : {}),
    chunkCount: row.chunkCount ?? 0,
  });
}

// ============================================================
// Confidence
// ============================================================

/**
 * The score a candidate would get by confirming every field the question named.
 * Confidence is the achieved share of it, so "how much of what you asked for did
 * this file prove" — not an absolute scale that would shift as weights change.
 */
function maxIdentityScore(requested: RequestedDocumentIdentity): number {
  let max = 0;
  if (requested.identifiers.length > 0) max += IDENTITY_WEIGHTS.exactIdentifier;
  if (requested.revision) max += IDENTITY_WEIGHTS.exactRevision;
  if (requested.dateRef) {
    max += requested.dateRef.precision === "day" ? IDENTITY_WEIGHTS.exactDate : IDENTITY_WEIGHTS.monthDate;
  }
  if (requested.titleTerms.length > 0) max += IDENTITY_WEIGHTS.titlePhrase;
  if (requested.stationCode) max += IDENTITY_WEIGHTS.station;
  if (requested.documentType) max += IDENTITY_WEIGHTS.documentType;
  if (requested.contract) max += IDENTITY_WEIGHTS.contract;
  return max;
}

function confidenceOf(score: number, requested: RequestedDocumentIdentity): number {
  const max = maxIdentityScore(requested);
  if (max <= 0) return 0;
  return Number(Math.max(0, Math.min(1, score / max)).toFixed(3));
}

/** Distinct identity dimensions a candidate confirmed (`title` and `title_path` count once). */
function matchedDimensions(matchedFields: string[]): number {
  return new Set(matchedFields.map((field) => field.split(":")[0]!.replace(/_path$/, ""))).size;
}

// ============================================================
// Resolution
// ============================================================

interface ScoredCandidate {
  identity: CandidateIdentity;
  scored: IdentityScore;
  statusRank: number;
  revisionNum: number;
}

function summarize(
  candidate: ScoredCandidate,
  decision: CandidateIdentitySummary["decision"]
): CandidateIdentitySummary {
  return {
    fileId: candidate.identity.fileId,
    fileName: candidate.identity.fileName,
    filePath: candidate.identity.filePath,
    normalizedIdentifiers: candidate.identity.identifiers.map(
      (identifier) => `${identifier.type}:${identifier.valueNormalized}`
    ),
    matchedFields: candidate.scored.matchedFields,
    conflictingFields: candidate.scored.conflictingFields,
    identityScore: candidate.scored.score,
    decision,
    reason: candidate.scored.reason,
    ...(candidate.identity.chunkCount !== undefined
      ? { chunkCount: candidate.identity.chunkCount }
      : {}),
  };
}

function describeRequested(requested: RequestedDocumentIdentity): Record<string, unknown> {
  return {
    explicitIdentifiers: requested.explicitIdentifiers,
    normalizedIdentifiers: requested.identifiers.map(
      (identifier) => `${identifier.type}:${identifier.valueNormalized}`
    ),
    documentType: requested.documentType,
    station: requested.station,
    titleTerms: requested.titleTerms,
    date: requested.date,
    dateRange: requested.dateRange,
    revision: requested.revision,
    contract: requested.contract,
  };
}

export const documentIdentityService = {
  extractRequestedIdentity,
  scoreIdentity,

  /**
   * Resolve the question to at most one document.
   *
   * Returns `locked` only when a single candidate clears the identity threshold
   * and no rival is within `AMBIGUITY_MARGIN` of it; `ambiguous` when two
   * genuinely different documents are equally good; `not_found` when nothing
   * carries the requested identity. Callers must treat the non-locked statuses as
   * "do not scope retrieval" — never as "use the best guess".
   */
  async resolveDocumentLock(input: ResolveDocumentLockInput): Promise<DocumentLockResult> {
    const requested = extractRequestedIdentity(input.question, input.reference);
    const traceMeta = {
      ...(input.traceId ? { traceId: input.traceId } : {}),
      projectId: String(input.projectId),
    };

    logger.info("document_identity.extracted", {
      ...traceMeta,
      question: input.question.slice(0, 200),
      reference: input.reference,
      requested: describeRequested(requested),
    });

    if (!hasRequestedIdentity(requested)) {
      const reason = "The question names nothing that identifies a specific document.";
      logger.info("document_identity.rejected", { ...traceMeta, reason, candidates: [] });
      return {
        status: "not_found",
        confidence: 0,
        matchedFields: [],
        conflictingFields: [],
        requested,
        reason,
      };
    }

    const { rows, passes } = await generateCandidates(input.projectId, requested);
    for (const extra of input.extraCandidates ?? []) {
      if (rows.has(extra.fileId)) continue;
      rows.set(extra.fileId, {
        id: extra.fileId,
        fileName: extra.fileName,
        filePath: extra.filePath,
        docCategory: extra.docCategory ?? null,
        revision: extra.revision ?? null,
        chunkCount: extra.chunkCount ?? null,
        extractedFields: null,
      });
    }

    const allowedCategories = input.restrictToDocCategories?.map((category) =>
      category.toLowerCase()
    );
    const inScope = Array.from(rows.values()).filter(
      (row) =>
        !allowedCategories ||
        !row.docCategory ||
        allowedCategories.includes(row.docCategory.toLowerCase())
    );

    const scored: ScoredCandidate[] = inScope.map((row) => {
      const identity = toCandidateIdentity(row);
      return {
        identity,
        scored: scoreIdentity(requested, identity),
        statusRank: statusApprovedRank(readStatusCode(row.extractedFields)),
        revisionNum: revisionNumber(identity.revision),
      };
    });

    const eligible = scored
      .filter((candidate) => !candidate.scored.disqualified)
      .sort(
        (a, b) =>
          b.scored.score - a.scored.score ||
          (b.identity.chunkCount ?? 0) - (a.identity.chunkCount ?? 0) ||
          b.statusRank - a.statusRank ||
          b.revisionNum - a.revisionNum ||
          a.identity.fileName.localeCompare(b.identity.fileName)
      );
    const disqualified = scored.filter((candidate) => candidate.scored.disqualified);

    logger.info("document_identity.candidates", {
      ...traceMeta,
      generation: passes,
      generated: rows.size,
      ...(allowedCategories ? { restrictToDocCategories: allowedCategories, inScope: inScope.length } : {}),
      eligible: eligible.length,
      disqualified: disqualified.length,
      candidates: eligible
        .slice(0, REPORTED_CANDIDATES)
        .map((candidate) => summarize(candidate, "runner_up")),
      rejectedCandidates: disqualified
        .slice(0, REPORTED_CANDIDATES)
        .map((candidate) => summarize(candidate, "rejected")),
    });

    const best = eligible[0];
    const identifierConfirmed = Boolean(
      best?.scored.matchedFields.some((field) => field.startsWith("identifier:"))
    );
    const tooFewDimensions =
      !identifierConfirmed &&
      matchedDimensions(best?.scored.matchedFields ?? []) < LOCK_MIN_MATCHED_DIMENSIONS;
    const belowThreshold = !best || best.scored.score < LOCK_MIN_SCORE || tooFewDimensions;

    if (belowThreshold) {
      const reason = !best
        ? disqualified.length > 0
          ? `Every candidate contradicted the requested identity (e.g. ${disqualified[0]!.identity.fileName} — ${disqualified[0]!.scored.reason}).`
          : "No file in the project carries the requested document identity."
        : tooFewDimensions
          ? `No candidate confirmed more than one identity attribute (best: ${best.identity.fileName} — ${best.scored.reason}); a single weak attribute is not enough to lock a document.`
          : `No candidate carries enough of the requested identity to lock (best: ${best.identity.fileName} — ${best.scored.reason}, score ${best.scored.score} < ${LOCK_MIN_SCORE}).`;
      logger.info("document_identity.rejected", {
        ...traceMeta,
        reason,
        requested: describeRequested(requested),
        candidates: [...eligible, ...disqualified]
          .slice(0, REPORTED_CANDIDATES)
          .map((candidate) => summarize(candidate, "rejected")),
      });
      return {
        status: "not_found",
        confidence: best ? confidenceOf(best.scored.score, requested) : 0,
        matchedFields: best?.scored.matchedFields ?? [],
        conflictingFields: best?.scored.conflictingFields ?? [],
        candidateFiles: [...eligible, ...disqualified]
          .slice(0, REPORTED_CANDIDATES)
          .map((candidate) => summarize(candidate, "rejected")),
        requested,
        reason,
      };
    }

    // Copies of the same document — the same identity tokens in a different
    // order, format or disposition — are not an ambiguity. Collapse them and
    // keep the member that can actually be read.
    const bestFamily = identityFamilyKey(best.identity.fileName);
    const rivals = eligible
      .slice(1)
      .filter((candidate) => identityFamilyKey(candidate.identity.fileName) !== bestFamily)
      .filter(
        // An unindexed file cannot answer the question, so it does not make an
        // answerable file ambiguous. (Same rule as identifier family resolution.)
        (candidate) =>
          !((best.identity.chunkCount ?? 0) > 0 && (candidate.identity.chunkCount ?? 0) === 0)
      );

    const contender = rivals.find(
      (candidate) => best.scored.score - candidate.scored.score < AMBIGUITY_MARGIN
    );

    if (contender) {
      const reason = `Two different documents match the requested identity equally well: ${best.identity.fileName} (score ${best.scored.score}) and ${contender.identity.fileName} (score ${contender.scored.score}).`;
      const candidateFiles = [best, contender, ...rivals.filter((r) => r !== contender)]
        .slice(0, REPORTED_CANDIDATES)
        .map((candidate) => summarize(candidate, "runner_up"));
      logger.info("document_identity.ambiguous", {
        ...traceMeta,
        reason,
        requested: describeRequested(requested),
        candidates: candidateFiles,
      });
      return {
        status: "ambiguous",
        confidence: confidenceOf(best.scored.score, requested),
        matchedFields: best.scored.matchedFields,
        conflictingFields: best.scored.conflictingFields,
        candidateFiles,
        requested,
        reason,
      };
    }

    const duplicates = eligible
      .slice(1)
      .filter((candidate) => identityFamilyKey(candidate.identity.fileName) === bestFamily);
    const candidateFiles = [
      summarize(best, "locked"),
      ...duplicates.slice(0, 3).map((candidate) => summarize(candidate, "duplicate_of_locked")),
      ...rivals.slice(0, 3).map((candidate) => summarize(candidate, "runner_up")),
      ...disqualified.slice(0, 3).map((candidate) => summarize(candidate, "rejected")),
    ];

    logger.info("document_identity.locked", {
      ...traceMeta,
      fileId: best.identity.fileId,
      fileName: best.identity.fileName,
      identityScore: best.scored.score,
      confidence: confidenceOf(best.scored.score, requested),
      matchedFields: best.scored.matchedFields,
      conflictingFields: best.scored.conflictingFields,
      requested: describeRequested(requested),
      candidates: candidateFiles,
    });

    return {
      status: "locked",
      fileId: best.identity.fileId as UUID,
      fileName: best.identity.fileName,
      filePath: best.identity.filePath,
      confidence: confidenceOf(best.scored.score, requested),
      matchedFields: best.scored.matchedFields,
      conflictingFields: best.scored.conflictingFields,
      candidateFiles,
      requested,
      reason: `Locked on ${best.identity.fileName}: ${best.scored.reason}.`,
    };
  },

  /**
   * Verify that a document another stage already chose really is the requested
   * one. Used to gate the exact-identifier and filename-search lock paths so a
   * wrong identifier or revision can never reach retrieval, without re-running
   * candidate generation.
   */
  verifyLock(input: {
    question: string;
    reference?: string;
    candidate: ExtraCandidate;
    traceId?: string;
    projectId?: UUID;
  }): { accepted: boolean; scored: IdentityScore; requested: RequestedDocumentIdentity } {
    const requested = extractRequestedIdentity(input.question, input.reference);
    const identity = describeFileIdentity({
      fileId: input.candidate.fileId,
      fileName: input.candidate.fileName,
      filePath: input.candidate.filePath,
      ...(input.candidate.docCategory ? { docCategory: input.candidate.docCategory } : {}),
      ...(input.candidate.revision ? { revision: input.candidate.revision } : {}),
      ...(input.candidate.chunkCount !== undefined ? { chunkCount: input.candidate.chunkCount } : {}),
    });
    const scored = scoreIdentity(requested, identity);
    const accepted = !scored.disqualified;

    logger.info(accepted ? "document_identity.locked" : "document_identity.rejected", {
      ...(input.traceId ? { traceId: input.traceId } : {}),
      ...(input.projectId ? { projectId: String(input.projectId) } : {}),
      stage: "verify_lock",
      fileId: identity.fileId,
      fileName: identity.fileName,
      identityScore: scored.score,
      matchedFields: scored.matchedFields,
      conflictingFields: scored.conflictingFields,
      reason: scored.reason,
      requested: describeRequested(requested),
    });

    return { accepted, scored, requested };
  },
};
