export type EvalBucket = "find" | "answer" | "identifier" | "ambiguous" | "not_found";

export interface Mlj017TestQuestion {
  id: string;
  bucket: EvalBucket;
  query: string;
  expectedFilePatterns: string[];
  expectedInTopK?: number;
  notes?: string;
  groundingFileId?: string;
  acceptableAnswerContains?: string[];
  /** For not_found: pass when top hit relevance stays below this threshold. */
  maxTopRelevance?: number;
}

export interface SearchHitRow {
  fileId: string;
  fileName: string;
  filePath?: string;
  relevance: number;
}

export interface QuestionEvalResult {
  id: string;
  bucket: EvalBucket;
  query: string;
  passed: boolean;
  scoreDetails: string;
  rankCutoff?: number;
  topK: number;
  topFileNames: string[];
  topRelevances: number[];
  totalMatches: number;
  expectedPatternHit: boolean;
  matchedPatterns: string[];
  answerPhraseHits?: string[];
  answerSnippet?: string;
  /** Retrieval metric: expected source file appeared within the rank cutoff. */
  sourceAt3?: boolean;
  /** Generation metric: answer contained at least one acceptable phrase. */
  groundedAnswer?: boolean;
}

function matchesPattern(row: SearchHitRow, pattern: string): boolean {
  const needle = pattern.toLowerCase();
  return (
    row.fileName.toLowerCase().includes(needle) ||
    (row.filePath?.toLowerCase().includes(needle) ?? false)
  );
}

export function findMatchingPatterns(rows: SearchHitRow[], patterns: string[]): string[] {
  const matched = new Set<string>();
  for (const row of rows) {
    for (const pattern of patterns) {
      if (matchesPattern(row, pattern)) {
        matched.add(pattern);
      }
    }
  }
  return Array.from(matched);
}

export function scoreSearchQuestion(
  question: Mlj017TestQuestion,
  rows: SearchHitRow[],
  totalMatches: number,
  searchTopK = 3,
  rankCutoff?: number
): Pick<
  QuestionEvalResult,
  "passed" | "scoreDetails" | "expectedPatternHit" | "matchedPatterns" | "topFileNames" | "topRelevances"
> {
  const cutoff = rankCutoff ?? searchTopK;
  const slice = rows.slice(0, searchTopK);
  const ranked = rows.slice(0, cutoff);
  const topFileNames = slice.map((row) => row.fileName);
  const topRelevances = slice.map((row) => Number(row.relevance.toFixed(3)));
  const matchedPatterns = findMatchingPatterns(ranked, question.expectedFilePatterns);
  const expectedPatternHit = matchedPatterns.length > 0;
  const topRelevance = slice[0]?.relevance ?? 0;

  switch (question.bucket) {
    case "find":
    case "identifier": {
      const passed = expectedPatternHit;
      return {
        passed,
        scoreDetails: passed
          ? `Expected pattern in top-${cutoff}: ${matchedPatterns.join(", ")}`
          : `No expected pattern in top-${cutoff}. Got: ${slice.map((r) => r.fileName).join(" | ") || "(empty)"}`,
        expectedPatternHit,
        matchedPatterns,
        topFileNames,
        topRelevances,
      };
    }
    case "answer": {
      const passed = expectedPatternHit;
      return {
        passed,
        scoreDetails: passed
          ? `Source file in top-${cutoff}: ${matchedPatterns.join(", ")}`
          : `Missing expected source in top-${cutoff}. Got: ${topFileNames.join(" | ") || "(empty)"}`,
        expectedPatternHit,
        matchedPatterns,
        topFileNames,
        topRelevances,
      };
    }
    case "ambiguous": {
      const passed = expectedPatternHit;
      return {
        passed,
        scoreDetails: passed
          ? `At least one relevant hit: ${matchedPatterns.join(", ")}`
          : `No relevant ambiguous hit in top-${cutoff}`,
        expectedPatternHit,
        matchedPatterns,
        topFileNames,
        topRelevances,
      };
    }
    case "not_found": {
      const maxRelevance = question.maxTopRelevance ?? 0.65;
      const lowRelevance = slice.length === 0 || topRelevance < maxRelevance;
      const passed = lowRelevance && !expectedPatternHit;
      return {
        passed,
        scoreDetails: passed
          ? `Low/empty retrieval (top rel=${topRelevance.toFixed(3)}, matches=${totalMatches})`
          : `Possible false positive (top rel=${topRelevance.toFixed(3)}, patterns=${matchedPatterns.join(", ") || "none"})`,
        expectedPatternHit,
        matchedPatterns,
        topFileNames,
        topRelevances,
      };
    }
    default:
      return {
        passed: false,
        scoreDetails: `Unknown bucket: ${question.bucket}`,
        expectedPatternHit,
        matchedPatterns,
        topFileNames,
        topRelevances,
      };
  }
}

export function scoreAnswerPhrases(
  answerText: string,
  phrases?: string[]
): { passed: boolean; hits: string[] } {
  if (!phrases || phrases.length === 0) {
    return { passed: true, hits: [] };
  }
  const lower = answerText.toLowerCase();
  const hits = phrases.filter((phrase) => lower.includes(phrase.toLowerCase()));
  return { passed: hits.length > 0, hits };
}

export function combineAnswerResult(
  search: Pick<QuestionEvalResult, "passed" | "scoreDetails">,
  phraseCheck: { passed: boolean; hits: string[] },
  answerSnippet?: string
): { passed: boolean; scoreDetails: string; answerPhraseHits: string[]; answerSnippet?: string } {
  const passed = search.passed && phraseCheck.passed;
  const parts = [search.scoreDetails];
  if (phraseCheck.hits.length > 0) {
    parts.push(`answer phrases: ${phraseCheck.hits.join(", ")}`);
  } else if (!phraseCheck.passed) {
    parts.push("answer missing expected key phrases");
  }
  return {
    passed,
    scoreDetails: parts.join("; "),
    answerPhraseHits: phraseCheck.hits,
    answerSnippet,
  };
}
