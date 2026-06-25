/**
 * Deterministic exact-identifier lookup (MVP Slice 1, 1c).
 *
 * When a query carries an exact construction identifier (e.g. "QWP-005",
 * "QWP 5", "RFI 95", "03 30 00"), we bypass ranking entirely: normalize the
 * query identifier, look it up in `document_identifiers`, then resolve the
 * revision/status near-duplicate family to the latest/approved member
 * (order: status approved-ranking → revision number → modified date — plan
 * §4a #6, §7). Returns the chosen file with structured match-reason metadata
 * and the openable deep link.
 */

import { and, eq, inArray } from "drizzle-orm";
import type { UUID } from "@contractor/shared";
import { getDbIfInitialized, documentIdentifiers, fileRecords } from "../db";
import {
  extractIdentifiers,
  revisionNumber,
  statusApprovedRank,
  type IdentifierType,
} from "./identifier-extraction.utils";

// Structured "why it matched" reasons surfaced to the API/UI (1d).
export type MatchReason =
  | { kind: "exact_id"; identifierType: IdentifierType; value: string; raw: string }
  | { kind: "name_token"; tokens: string[] }
  | { kind: "path_token"; tokens: string[] }
  | { kind: "discipline_station"; discipline?: string; station?: string }
  | { kind: "content_hit"; snippet?: string };

export interface IdentifierFamilyMember {
  fileId: UUID;
  fileName: string;
  filePath: string;
  revision?: string;
  statusCode?: string;
  deepLinkUrl?: string;
  /** True when this member is superseded by the resolved (chosen) file. */
  superseded: boolean;
}

export interface IdentifierLookupResult {
  identifier: {
    type: IdentifierType;
    valueNormalized: string;
    /** The verbatim identifier as detected in the query. */
    queryRaw: string;
  };
  fileId: UUID;
  fileName: string;
  filePath: string;
  deepLinkUrl?: string;
  docCategory?: string;
  specSection?: string;
  revision?: string;
  statusCode?: string;
  station?: string;
  extractedFields?: Record<string, unknown>;
  matchReasons: MatchReason[];
  /** The full revision/status near-duplicate family (chosen member first). */
  family: IdentifierFamilyMember[];
  totalFamilyMembers: number;
}

// Query-side routing priority: prefer the specific domain identifiers a user
// typically types over the broad SUBMITTAL-control / CSI signals.
const QUERY_PRIORITY: IdentifierType[] = [
  "QWP",
  "SWP",
  "CWP",
  "RFI",
  "DRFI",
  "NCR",
  "CO",
  "MOD",
  "SUBMITTAL",
  "PRDC",
  "TRANSMITTAL",
  "DU",
  "EDU",
  "CSI",
];

function priorityOf(type: IdentifierType): number {
  const index = QUERY_PRIORITY.indexOf(type);
  return index === -1 ? QUERY_PRIORITY.length : index;
}

/**
 * Coerce an `extracted_fields` value into a plain object, tolerating the
 * double-encoded JSON-string shape produced by some drizzle/postgres-js jsonb
 * writes.
 */
function asObject(fields: unknown): Record<string, unknown> | undefined {
  if (!fields) return undefined;
  if (typeof fields === "object") return fields as Record<string, unknown>;
  if (typeof fields === "string") {
    try {
      const parsed = JSON.parse(fields);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function readStatusCode(fields: unknown): string | undefined {
  const value = asObject(fields)?.statusCode;
  return typeof value === "string" ? value : undefined;
}

function readStation(fields: unknown): string | undefined {
  const value = asObject(fields)?.station;
  return typeof value === "string" ? value : undefined;
}

/**
 * Parse the exact identifiers a query carries, ordered by routing priority.
 */
export function parseIdentifierQuery(query: string): Array<{
  type: IdentifierType;
  valueNormalized: string;
  raw: string;
}> {
  return extractIdentifiers(query)
    .map((id) => ({ type: id.type, valueNormalized: id.valueNormalized, raw: id.raw }))
    .sort((a, b) => priorityOf(a.type) - priorityOf(b.type));
}

const NAME_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "what",
  "which",
  "does",
  "are",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "rev",
  "final",
  "copy",
]);

/** Lowercased alphabetic tokens (>=3 chars, non-stopword) from a filename or query. */
function filenameTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]{1,5}$/i, "")
    .split(/[^a-z]+/i)
    .filter((token) => token.length >= 3 && !NAME_STOPWORDS.has(token));
}

function overlapCount(queryTokens: string[], nameTokens: string[]): number {
  if (queryTokens.length === 0 || nameTokens.length === 0) return 0;
  const nameSet = new Set(nameTokens);
  return queryTokens.reduce((count, token) => (nameSet.has(token) ? count + 1 : count), 0);
}

export const identifierLookupService = {
  parseIdentifierQuery,

  /**
   * Resolve a query to a single file via exact identifier match, or null when
   * no exact identifier is present / found. DB-only (Tier 1 index lives in PG).
   */
  async lookupExactIdentifier(
    projectId: UUID,
    query: string
  ): Promise<IdentifierLookupResult | null> {
    const db = getDbIfInitialized();
    if (!db) return null;

    const candidates = parseIdentifierQuery(query);
    if (candidates.length === 0) return null;

    for (const candidate of candidates) {
      const idRows = await db
        .select({ fileId: documentIdentifiers.fileId })
        .from(documentIdentifiers)
        .where(
          and(
            eq(documentIdentifiers.projectId, projectId),
            eq(documentIdentifiers.type, candidate.type),
            eq(documentIdentifiers.valueNormalized, candidate.valueNormalized)
          )
        );

      const fileIds = Array.from(new Set(idRows.map((row) => row.fileId)));
      if (fileIds.length === 0) continue;

      const files = await db
        .select()
        .from(fileRecords)
        .where(
          and(eq(fileRecords.projectId, projectId), inArray(fileRecords.id, fileIds))
        );
      if (files.length === 0) continue;

      // Resolve the near-duplicate family to the latest/approved member.
      // Disambiguation order (most → least important):
      //   1. hasChunks  — a member with 0 indexed chunks can't answer anything,
      //      so never prefer it over a sibling that has content.
      //   2. nameOverlap — when the query carries distinctive filename words
      //      (e.g. "QWP-001 track replacement"), prefer the member whose name
      //      matches them, rather than blindly taking the latest revision.
      //   3. approvedRank → revisionNum → modifiedAt — the prior latest/approved
      //      tie-break for genuine same-document revision families.
      const queryNameTokens = filenameTokens(query).filter(
        (token) => token !== candidate.valueNormalized.toLowerCase()
      );
      const ranked = files
        .map((file) => {
          const statusCode = readStatusCode(file.extractedFields);
          return {
            file,
            statusCode,
            hasChunks: (file.chunkCount ?? 0) > 0 ? 1 : 0,
            nameOverlap: overlapCount(queryNameTokens, filenameTokens(file.fileName)),
            approvedRank: statusApprovedRank(statusCode),
            revisionNum: revisionNumber(file.revision ?? undefined),
            modifiedAt: (file.lastSynced ?? file.updatedAt ?? file.createdAt)?.getTime() ?? 0,
          };
        })
        .sort(
          (a, b) =>
            b.hasChunks - a.hasChunks ||
            b.nameOverlap - a.nameOverlap ||
            b.approvedRank - a.approvedRank ||
            b.revisionNum - a.revisionNum ||
            b.modifiedAt - a.modifiedAt
        );

      const chosen = ranked[0]!;
      const file = chosen.file;

      const family: IdentifierFamilyMember[] = ranked.map((entry) => ({
        fileId: entry.file.id as UUID,
        fileName: entry.file.fileName,
        filePath: entry.file.filePath,
        revision: entry.file.revision ?? undefined,
        statusCode: entry.statusCode,
        deepLinkUrl: entry.file.deepLinkUrl ?? undefined,
        superseded: entry.file.id !== file.id,
      }));

      const station = readStation(file.extractedFields);
      const matchReasons: MatchReason[] = [
        {
          kind: "exact_id",
          identifierType: candidate.type,
          value: candidate.valueNormalized,
          raw: candidate.raw,
        },
      ];
      if (file.specSection || station) {
        matchReasons.push({
          kind: "discipline_station",
          discipline: file.specSection ?? undefined,
          station,
        });
      }

      return {
        identifier: {
          type: candidate.type,
          valueNormalized: candidate.valueNormalized,
          queryRaw: candidate.raw,
        },
        fileId: file.id as UUID,
        fileName: file.fileName,
        filePath: file.filePath,
        deepLinkUrl: file.deepLinkUrl ?? undefined,
        docCategory: file.docCategory ?? undefined,
        specSection: file.specSection ?? undefined,
        revision: file.revision ?? undefined,
        statusCode: chosen.statusCode,
        station,
        extractedFields: asObject(file.extractedFields),
        matchReasons,
        family,
        totalFamilyMembers: family.length,
      };
    }

    return null;
  },
};
