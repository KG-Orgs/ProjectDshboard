/**
 * Identifier & metadata extraction from construction document names + paths.
 *
 * MVP Slice 1 (see construction_rag_plan.plan.md §4a): identifiers and metadata
 * live overwhelmingly in file names + folder paths. This module turns a
 * filename/path into:
 *   - a normalized, deterministic identifier key (`normalizeIdentifier`) so an
 *     exact-id query (e.g. "QWP-005", "QWP 5") resolves to a single document, and
 *   - the set of identifiers carried by a file (`extractIdentifiers`), plus
 *   - name/path-derived metadata (`extractPathMetadata`): discipline, station,
 *     doc type, revision, status code, contract number.
 *
 * Everything here is pure (name/path string in, structured data out). It never
 * opens or reads file contents — Slice 1 is hydration-safe by construction.
 */

// ============================================================
// Identifier types
// ============================================================

export const IDENTIFIER_TYPES = [
  "QWP",
  "SWP",
  "CWP",
  "RFI",
  "DRFI",
  "PRDC",
  "DU",
  "EDU",
  "TRANSMITTAL",
  "MOD",
  "CSI",
  "SUBMITTAL",
  "CO",
  "NCR",
] as const;

export type IdentifierType = (typeof IDENTIFIER_TYPES)[number];

export interface ExtractedIdentifier {
  type: IdentifierType;
  /** The verbatim substring matched in the name/path. */
  raw: string;
  /** Deterministic normalized lookup key (see `normalizeIdentifier`). */
  valueNormalized: string;
}

// `prefix + integer` identifiers collapse separators AND leading zeros, so
// QWP-005 == QWP 5 == QWP05 -> "QWP5".
const PREFIX_INT_TYPES = new Set<IdentifierType>([
  "QWP",
  "SWP",
  "CWP",
  "RFI",
  "DRFI",
  "PRDC",
  "DU",
  "EDU",
  "TRANSMITTAL",
  "MOD",
]);

// These keep zeros and status suffixes (semantically significant) — only
// separators are stripped.
const KEEP_ZEROS_TYPES = new Set<IdentifierType>(["SUBMITTAL", "CO", "NCR"]);

// ============================================================
// Normalization (D2 — formats are equivalent + unique)
// ============================================================

/**
 * Normalize a raw identifier string into a deterministic lookup key.
 *
 * Rule of thumb (plan §4a): global = uppercase + strip `[space . _ -]`; then
 *   - sequence-numbered IDs (QWP/SWP/CWP/RFI/DRFI/PRDC/DU/EDU/TRANSMITTAL/MOD)
 *     collapse leading zeros: `QWP-005` -> `QWP5`.
 *   - CSI/spec sections keep all six digits: `03 30 00` -> `033000`.
 *   - submittal control numbers, CO and NCR keep their zeros/status suffixes:
 *     `GEN-023R00` -> `GEN023R00`, `CO-002E` -> `CO002E`.
 */
export function normalizeIdentifier(type: IdentifierType, raw: string): string {
  // Strip spaces, dots and underscores first (hyphens handled per-type).
  const s = raw.toUpperCase().replace(/[\s._]+/g, "");

  if (PREFIX_INT_TYPES.has(type)) {
    // PREFIX + integer: drop separators & leading zeros, keep any trailing
    // suffix (e.g. design-unit letter, transmittal DU code) sans hyphens.
    const m = s.match(/^([A-Z]+)\D*0*(\d+)(.*)$/);
    if (m) {
      const [, prefix, digits, rest] = m;
      return `${prefix}${Number.parseInt(digits, 10)}${rest.replace(/-/g, "")}`;
    }
    return s;
  }

  if (type === "CSI") {
    // Keep all six digits, separators stripped.
    return s.replace(/\D/g, "").slice(0, 6);
  }

  if (KEEP_ZEROS_TYPES.has(type)) {
    // Zeros and status suffixes are meaningful — only drop the hyphen.
    return s.replace(/-/g, "");
  }

  return s;
}

// ============================================================
// Extraction patterns (plan §4a)
// ============================================================

// Site/station codes that appear in the submittal control number.
const STATION_CODES = ["AVI", "MID", "MYR", "NOR", "BUR", "GEN"] as const;
export type StationCode = (typeof STATION_CODES)[number];

export const STATION_NAMES: Record<StationCode, string> = {
  AVI: "Avenue I",
  MID: "Middletown Rd",
  MYR: "Myrtle Ave",
  NOR: "Norwood Ave",
  BUR: "Burnside Ave",
  GEN: "General",
};

const STATION_ALTERNATION = STATION_CODES.join("|");

// `\b` treats `_` as a word char, but in these filenames `_` is a separator
// (e.g. "A37806_GEN-023R00"), so we use explicit non-alphanumeric boundaries.
const LB = "(?<![A-Za-z0-9])"; // left boundary
const RB = "(?![A-Za-z0-9])"; // right boundary

// Each pattern must be global; the captured `raw` is `match[0]`.
interface IdentifierPattern {
  type: IdentifierType;
  regex: RegExp;
}

// Ordering matters: DRFI before RFI, submittal-control before bare CSI, so the
// more specific identifier wins (and dedup keeps both where legitimately
// distinct).
const IDENTIFIER_PATTERNS: IdentifierPattern[] = [
  // Submittal control number: GEN-023R00, AVI-082R00, MYR-013R01 (the station
  // code is the origin; a PRDC package prefix is captured separately below).
  { type: "SUBMITTAL", regex: new RegExp(`${LB}(?:${STATION_ALTERNATION})-\\d+R\\d+`, "gi") },
  // PRDC-as-origin control number: PRDC04-040R00.
  { type: "SUBMITTAL", regex: new RegExp(`${LB}PRDC\\d+-\\d+R\\d+`, "gi") },
  // Secondary domain identifiers (live in the description segment).
  { type: "QWP", regex: new RegExp(`${LB}QWP[\\s\\-]*0*\\d+`, "gi") },
  { type: "SWP", regex: new RegExp(`${LB}SWP[\\s\\-]*0*\\d+`, "gi") },
  { type: "CWP", regex: new RegExp(`${LB}CWP[\\s\\-]*0*\\d+`, "gi") },
  // DRFI must precede RFI.
  { type: "DRFI", regex: new RegExp(`${LB}DRFI[\\s\\-]*0*\\d+`, "gi") },
  { type: "RFI", regex: new RegExp(`${LB}RFI[\\s\\-]*0*\\d+`, "gi") },
  // Non-conformance: short seq + full project-year-seq forms.
  { type: "NCR", regex: new RegExp(`${LB}NCR-(?:A37806-\\d{4}-)?\\d+`, "gi") },
  // Procurement package grouping: PRDC04, PRDC06.
  { type: "PRDC", regex: new RegExp(`${LB}PRDC0*\\d+`, "gi") },
  // Change order / modification (folder names + some file names). Require a
  // hyphen separator to avoid matching "CO" inside words like CONCRETE.
  { type: "CO", regex: new RegExp(`${LB}CO-0*\\d+[OSNE]?`, "gi") },
  { type: "MOD", regex: new RegExp(`${LB}MOD-0*\\d+`, "gi") },
  // Transmittals: "Transmittal 0009", "Transmittal 079-DU04".
  { type: "TRANSMITTAL", regex: new RegExp(`${LB}transmittal[\\s#]*0*\\d+(?:-[A-Z0-9]+)?`, "gi") },
  // Design units: DU01, EDU01D.
  { type: "EDU", regex: new RegExp(`${LB}EDU0*\\d+[A-Z]?`, "gi") },
  { type: "DU", regex: new RegExp(`${LB}DU0*\\d+[A-Z]?`, "gi") },
  // CSI / spec section: 6 digits, optionally space-separated in two pairs.
  { type: "CSI", regex: new RegExp(`${LB}\\d{2}\\s?\\d{2}\\s?\\d{2}${RB}`, "g") },
];

/**
 * Extract every identifier carried by a file's name (+ optional path). One file
 * may attach several identifiers (submittal no. + QWP no. + CSI section), so the
 * whole string is scanned and results are de-duplicated by (type, normalized).
 */
export function extractIdentifiers(fileName: string, filePath?: string): ExtractedIdentifier[] {
  // Scan the filename first; fall back to the full path so folder-encoded
  // identifiers (PRDC packages, CO folders, CSI subfolders) are captured too.
  const haystacks = [fileName, filePath ?? ""].filter(Boolean);

  const seen = new Set<string>();
  const results: ExtractedIdentifier[] = [];

  for (const haystack of haystacks) {
    for (const { type, regex } of IDENTIFIER_PATTERNS) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(haystack)) !== null) {
        const raw = match[0].trim();
        if (!raw) continue;
        const valueNormalized = normalizeIdentifier(type, raw);
        if (!valueNormalized) continue;
        const dedupeKey = `${type}:${valueNormalized}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        results.push({ type, raw, valueNormalized });
      }
    }
  }

  return results;
}

// ============================================================
// Name/path metadata (plan §4a — drives D4 parsers)
// ============================================================

export interface PathMetadata {
  /** Contract number from the filename prefix, e.g. "A37806". */
  contractNumber?: string;
  /** Top-level workflow folder, e.g. "05 - SUBMITTALS". */
  docType?: string;
  /** Mapped construction category for the doc type (matches ConstructionCategory where possible). */
  docCategory?: string;
  /** CSI division/section subfolder or token, display form e.g. "03 30 00". */
  specSection?: string;
  /** Discipline derived from the CSI division subfolder, e.g. "03 - CONCRETE". */
  discipline?: string;
  /** Station/area code, e.g. "AVI". */
  station?: StationCode;
  /** Human station name, e.g. "Avenue I". */
  stationName?: string;
  /** Revision token, e.g. "R00". */
  revision?: string;
  /** Status/disposition code, e.g. "R&R", "APP", "ORIG". */
  statusCode?: string;
}

// Top-level `NN - NAME` folder -> construction category.
const DOC_TYPE_CATEGORY: Array<{ test: RegExp; category: string }> = [
  { test: /submittal/i, category: "submittal" },
  { test: /rfi/i, category: "rfi" },
  { test: /change\s*order|claims/i, category: "change_order" },
  { test: /schedule/i, category: "schedule" },
  { test: /safety/i, category: "safety" },
  { test: /quality/i, category: "report" },
  { test: /correspondence/i, category: "correspondence" },
  { test: /plans?\s*&?\s*specs?|design/i, category: "spec" },
  { test: /permit/i, category: "permit" },
  { test: /insurance|invoice|purchase|subcontract/i, category: "invoice" },
  { test: /bid\s*docs?|contract/i, category: "contract" },
];

// Known status/disposition codes that appear as a ` - XXX - ` segment.
const STATUS_CODES = new Set([
  "ORIG",
  "ORG",
  "R&R",
  "APP",
  "NET",
  "AAN",
  "AAR",
  "AEAN",
  "RWC",
  "RES",
  "FIO",
  "CLO",
  "VOID",
]);

function splitPathSegments(filePath: string): string[] {
  return filePath
    .split(/[\\/]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function extractPathMetadata(fileName: string, filePath: string): PathMetadata {
  const meta: PathMetadata = {};
  const segments = splitPathSegments(filePath);
  const nameWithoutExt = fileName.replace(/\.[a-z0-9]+$/i, "");

  // Contract number: filename prefix like "A37806_..." or "A37806 RFI ...".
  const contractRe = /(?<![A-Za-z0-9])(A\d{5,6})(?![A-Za-z0-9])/i;
  const contractMatch = nameWithoutExt.match(contractRe) ?? filePath.match(contractRe);
  if (contractMatch) {
    meta.contractNumber = contractMatch[1].toUpperCase();
  }

  // Doc type: the top-level "NN - NAME" folder.
  const topLevel = segments.find((segment) => /^\d{2}\s*-\s*.+/.test(segment));
  if (topLevel) {
    meta.docType = topLevel;
    const mapped = DOC_TYPE_CATEGORY.find((entry) => entry.test.test(topLevel));
    if (mapped) {
      meta.docCategory = mapped.category;
    }
  }

  // Discipline: CSI division subfolder, e.g. "03 - CONCRETE", "16 - ELECTRICAL",
  // "01 40 10 Quality Management".
  const disciplineSegment = segments.find((segment) =>
    /^\d{2}\s*-\s*[A-Z]/i.test(segment) && segment !== topLevel
  );
  if (disciplineSegment) {
    meta.discipline = disciplineSegment;
  }

  // CSI / spec section (display form with spaces): first 6-digit token in name or path.
  const csiRe = /(?<![A-Za-z0-9])(\d{2})\s?(\d{2})\s?(\d{2})(?![A-Za-z0-9])/;
  const csiMatch = nameWithoutExt.match(csiRe) ?? filePath.match(csiRe);
  if (csiMatch) {
    meta.specSection = `${csiMatch[1]} ${csiMatch[2]} ${csiMatch[3]}`;
  }

  // Station/area + revision: from the submittal control number in the name.
  const controlMatch = nameWithoutExt.match(
    new RegExp(`(?<![A-Za-z0-9])(${STATION_ALTERNATION})-(\\d+)R(\\d+)`, "i")
  );
  if (controlMatch) {
    const station = controlMatch[1].toUpperCase() as StationCode;
    meta.station = station;
    meta.stationName = STATION_NAMES[station];
    meta.revision = `R${controlMatch[3]}`;
  } else {
    const revMatch = nameWithoutExt.match(/(?<![A-Za-z0-9])R(\d{2})(?![A-Za-z0-9])/);
    if (revMatch) {
      meta.revision = `R${revMatch[1]}`;
    }
  }

  // Status/disposition code: scan ` - XXX - ` style segments in the filename.
  const nameSegments = nameWithoutExt.split(/\s-\s|_/).map((segment) => segment.trim());
  for (const segment of nameSegments) {
    const candidate = segment.toUpperCase();
    if (STATUS_CODES.has(candidate)) {
      meta.statusCode = candidate;
      break;
    }
  }

  return meta;
}

// ============================================================
// Status / revision ranking (resolve a near-duplicate family)
// ============================================================

// Higher = more "final/approved". Used to resolve a revision/status family to
// the latest/approved member (plan §4a #6, §7).
const STATUS_APPROVED_RANK: Record<string, number> = {
  CLO: 4, // closed (RFI) — final
  APP: 3,
  NET: 3, // no exceptions taken
  AAN: 3, // approved as noted
  AAR: 3,
  AEAN: 3,
  RWC: 2, // revise with comments
  RES: 2, // resolved
  ORIG: 1,
  ORG: 1,
  FIO: 1, // for information only
  "R&R": 0, // revise & resubmit
  VOID: -1,
};

export function statusApprovedRank(statusCode?: string): number {
  if (!statusCode) return 1;
  return STATUS_APPROVED_RANK[statusCode.toUpperCase()] ?? 1;
}

export function revisionNumber(revision?: string): number {
  if (!revision) return -1;
  const match = revision.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : -1;
}

// ============================================================
// Document family key (collapse format / status / copy variants)
// ============================================================

const STATUS_CODE_ALTERNATION = Array.from(STATUS_CODES)
  .map((code) => code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

/**
 * Derive a key that is shared by near-duplicate copies of the *same* document:
 * the same descriptive name carried in different file formats (.pdf/.docx),
 * dispositions (`- CLO -`, `- R&R -`), or "- Copy" / trailing "--" markers.
 *
 * Deliberately conservative: revision tokens (R00, R01, …) are preserved, so
 * genuinely different revisions of a submittal keep distinct keys and are never
 * collapsed together. The descriptive remainder is specific enough that two
 * unrelated documents are very unlikely to collide.
 *
 * Returns an empty string when the residual name is too short to safely treat
 * as a family key (caller should then not collapse).
 */
export function documentFamilyKey(fileName: string): string {
  let base = fileName.toLowerCase().replace(/\.[a-z0-9]+$/i, "");
  // "- Copy" duplication markers and trailing dash runs ("signed--").
  base = base.replace(/\s*-\s*copy\b/g, " ");
  base = base.replace(/-+\s*$/g, " ");
  // "printed to pdf" style export markers.
  base = base.replace(/-\s*printed to pdf\b/g, " ");
  // Status/disposition segments delimited by separators ("- CLO -", "_FIO_").
  base = base.replace(
    new RegExp(`(^|[\\s_-])(${STATUS_CODE_ALTERNATION})(?=[\\s_-]|$)`, "gi"),
    " "
  );
  // Collapse all separators/whitespace to single spaces.
  base = base.replace(/[\s._-]+/g, " ").trim();

  // Too short to be a safe family discriminator.
  if (base.replace(/\s/g, "").length < 8) return "";
  return base;
}
