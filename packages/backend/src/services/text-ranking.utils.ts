/**
 * Common English stop words that appear in virtually every document chunk and
 * are useless for keyword-hit scoring. Filtering these prevents false-positive
 * chunk matches where every chunk appears to "match" a query.
 */
const QUERY_STOP_WORDS = new Set([
  // Articles / determiners
  "the", "a", "an", "this", "that", "these", "those",
  // Prepositions
  "of", "in", "on", "at", "to", "for", "with", "by", "from", "off",
  "into", "onto", "about", "above", "below", "between", "through",
  "per", "as", "based",
  // Conjunctions
  "and", "or", "but", "nor", "so", "yet",
  // Pronouns
  "i", "we", "you", "he", "she", "it", "they", "me", "us", "him", "her", "them",
  "my", "our", "your", "his", "its", "their",
  // Question words used as framing (not content)
  "what", "which", "who", "when", "where", "why", "how",
  // Common verbs / auxiliaries
  "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "have", "has", "had",
  "can", "could", "will", "would", "shall", "should", "may", "might", "must",
  "get", "give", "make", "take", "use",
  // Common filler words
  "any", "all", "not", "no", "yes", "also", "too", "just", "only",
  "then", "than", "more", "most", "some", "such", "each",
  "tell", "show", "list", "give", "provide", "describe",
  "there", "here", "now", "please",
]);

export function tokenizeQuery(
  query: string,
  minLength = 3,
  maxTokens?: number
): string[] {
  const tokens = Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= minLength)
        .filter((token) => !QUERY_STOP_WORDS.has(token))
    )
  );

  if (typeof maxTokens === "number") {
    return tokens.slice(0, maxTokens);
  }

  return tokens;
}

export function keywordHitScore(tokens: string[], text: string): number {
  const lower = text.toLowerCase();
  return tokens.reduce((score, token) => score + (lower.includes(token) ? 1 : 0), 0);
}

/**
 * Detects chunk text that is extraction garbage rather than readable content.
 *
 * Binary/zip-based formats (.pptx, .docx, .msg) whose raw bytes were extracted
 * instead of their text produce mojibake: dense Unicode replacement characters
 * (U+FFFD) and a low ratio of printable ASCII. In the live corpus ~18% of all
 * chunks matched this profile, and 98% of those contained U+FFFD — so it is a
 * highly reliable signal. Embedding/retrieving these chunks wastes candidate
 * slots and pollutes results, so we gate them at index time and filter them at
 * retrieval time.
 *
 * Thresholds are deliberately conservative to avoid dropping legitimate
 * symbol-heavy or non-English text: a stray replacement char in an otherwise
 * readable paragraph (ratio well under 5%) is kept.
 */
export function isLikelyGarbageText(text: string): boolean {
  const len = text.length;
  // Too short to judge reliably (e.g. "OK", section anchors); keep it.
  if (len < 16) return false;

  let replacement = 0;
  let printable = 0;
  for (let index = 0; index < len; index += 1) {
    const code = text.charCodeAt(index);
    if (code === 0xfffd) {
      replacement += 1;
    }
    // Printable ASCII plus tab/newline/carriage-return.
    if ((code >= 0x20 && code <= 0x7e) || code === 0x09 || code === 0x0a || code === 0x0d) {
      printable += 1;
    }
  }

  const replacementRatio = replacement / len;
  const printableRatio = printable / len;

  // Either dense mojibake, or mostly non-printable bytes => garbage extraction.
  return replacementRatio > 0.05 || printableRatio < 0.55;
}

/**
 * A file's name and the segments of its folder path are first-class retrieval
 * signals: users routinely refer to documents by their name or location
 * ("the structural submittal log", "the Division 03 spec"). FileIdentity packages
 * a human-readable identity string (for embedding into the summary chunk) plus a
 * normalized token set (for lexical/identity scoring).
 */
export interface FileIdentity {
  fileName: string;
  filePath?: string;
  /** Human-readable "Folder / Sub / file.pdf" string for embedding into summaries. */
  identityText: string;
  /** Normalized, de-duplicated tokens from the filename (sans extension) + path segments. */
  tokens: string[];
}

function splitIdentityTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function deriveFileIdentity(fileName: string, filePath?: string): FileIdentity {
  const cleanName = (fileName ?? "").trim();
  const cleanPath = (filePath ?? "").trim();

  const segments = cleanPath
    ? cleanPath
        .split(/[\\/]+/)
        .map((segment) => segment.trim())
        .filter(Boolean)
    : [];

  // The path frequently ends with the filename itself; drop it so we only keep folders.
  const dirSegments =
    segments.length > 0 && segments[segments.length - 1] === cleanName
      ? segments.slice(0, -1)
      : segments;

  const nameWithoutExt = cleanName.replace(/\.[a-z0-9]+$/i, "");

  const identityParts: string[] = [];
  if (dirSegments.length > 0) identityParts.push(dirSegments.join(" / "));
  if (cleanName) identityParts.push(cleanName);
  const identityText = identityParts.join(" / ");

  const tokenSet = new Set<string>();
  for (const token of splitIdentityTokens(nameWithoutExt)) tokenSet.add(token);
  for (const segment of dirSegments) {
    for (const token of splitIdentityTokens(segment)) tokenSet.add(token);
  }

  return {
    fileName: cleanName,
    filePath: cleanPath || undefined,
    identityText,
    tokens: Array.from(tokenSet),
  };
}

/**
 * Returns a normalized [0,1] overlap between query tokens and a file's identity
 * tokens. Exact token hits count fully; partial/compound hits (e.g. query "submittal"
 * vs identity token "submittal01") count as a half so packed filenames still register.
 */
export function identityMatchScore(queryTokens: string[], identity: FileIdentity): number {
  if (queryTokens.length === 0 || identity.tokens.length === 0) return 0;

  const identitySet = new Set(identity.tokens);
  let hits = 0;

  for (const queryToken of queryTokens) {
    if (identitySet.has(queryToken)) {
      hits += 1;
      continue;
    }
    for (const identityToken of identitySet) {
      if (
        identityToken.length >= 4 &&
        (identityToken.includes(queryToken) || queryToken.includes(identityToken))
      ) {
        hits += 0.5;
        break;
      }
    }
  }

  return Math.min(1, hits / queryTokens.length);
}
