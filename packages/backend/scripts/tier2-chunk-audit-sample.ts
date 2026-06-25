/**
 * Sample random indexed files, read chunk text from DB, generate grounded questions,
 * run tier2 ask, and write an eval question set + audit report.
 *
 * Usage (from packages/backend):
 *   pnpm chunk-audit:sample
 *   pnpm chunk-audit:sample -- --files 20 --chunks-per-file 2 --run-ask
 *   pnpm chunk-audit:sample -- --seed 42 --out ./eval/mlj017-chunk-sampled.json
 */

import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UUID } from "@contractor/shared";
import { and, eq, sql } from "drizzle-orm";
import { initializeDb } from "../src/db";
import { fileChunks, fileRecords } from "../src/db/schema";
import { getEnv, resetEnvCache } from "../src/config/env";
import { chatCoordinatorService } from "../src/services/chat-coordinator.service";
import { retrievalService } from "../src/services/retrieval.service";
import {
  combineAnswerResult,
  findMatchingPatterns,
  scoreAnswerPhrases,
  scoreSearchQuestion,
  type Mlj017TestQuestion,
} from "../eval/mlj017-eval.utils";
import { extractIdentifiers } from "../src/services/identifier-extraction.utils";

config({ path: "../../.env" });
process.env.RETRIEVAL_HYBRID_ENABLED = process.env.RETRIEVAL_HYBRID_ENABLED ?? "true";
resetEnvCache();

const DEFAULT_PROJECT_ID = "731cfd5d-e647-4551-89e7-0a3cc4915115";

interface SampledChunk {
  chunkId: string;
  chunkIndex: number;
  chunkText: string;
  pageNumber?: number;
  sectionLabel?: string;
  tokenCount?: number;
}

interface SampledFile {
  fileId: string;
  fileName: string;
  filePath: string;
  docCategory?: string;
  chunkCount: number;
  chunks: SampledChunk[];
}

interface GeneratedQuestion extends Mlj017TestQuestion {
  groundingChunkId: string;
  groundingChunkIndex: number;
  groundingPageNumber?: number;
  groundingSnippet: string;
  generatedQueryTemplate: string;
}

interface AuditRunResult {
  id: string;
  query: string;
  passed: boolean;
  scoreDetails: string;
  sourceFileHit: boolean;
  phraseHits: string[];
  answerSnippet?: string;
  elapsedMs: number;
  citedFileNames: string[];
}

function parseArgs(argv: string[]): {
  projectId: string;
  fileCount: number;
  chunksPerFile: number;
  minPerCategory: number;
  seed: number;
  runAsk: boolean;
  outFile: string;
  reportFile: string;
} {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const backendRoot = path.resolve(scriptDir, "..");
  let projectId = DEFAULT_PROJECT_ID;
  let fileCount = 12;
  let chunksPerFile = 2;
  let minPerCategory = 2;
  let seed = Date.now() % 1_000_000;
  let runAsk = false;
  let outFile = path.join(backendRoot, "eval/mlj017-chunk-sampled-questions.json");
  let reportFile = path.join(backendRoot, "eval/mlj017-chunk-audit-report.json");

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--smoke") {
      fileCount = 80;
      chunksPerFile = 2;
      minPerCategory = 4;
      seed = 20260619;
      outFile = path.join(backendRoot, "eval/mlj017-smoke-questions.json");
      reportFile = path.join(backendRoot, "eval/mlj017-smoke-audit-report.json");
    } else if (arg === "--project-id" && next) {
      projectId = next;
      i += 1;
    } else if ((arg === "--files" || arg === "--file-count") && next) {
      fileCount = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--chunks-per-file" && next) {
      chunksPerFile = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--min-per-category" && next) {
      minPerCategory = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--seed" && next) {
      seed = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--run-ask") {
      runAsk = true;
    } else if (arg === "--out" && next) {
      outFile = path.resolve(next);
      i += 1;
    } else if (arg === "--report" && next) {
      reportFile = path.resolve(next);
      i += 1;
    }
  }

  return { projectId, fileCount, chunksPerFile, minPerCategory, seed, runAsk, outFile, reportFile };
}

/** Simple mulberry32 PRNG for reproducible sampling. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shortFileStem(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, "").slice(0, 80);
}

function extractSalientTerms(text: string, limit = 5): string[] {
  const stop = new Set([
    "the", "and", "for", "with", "this", "that", "shall", "will", "from", "into",
    "upon", "under", "over", "such", "when", "where", "which", "their", "there",
    "been", "have", "has", "are", "was", "were", "not", "all", "any", "per",
    "section", "document", "project", "work", "contractor", "owner",
    "must", "required", "additional", "date", "page", "total", "amount",
  ]);
  const weak = /^\d+([.,]\d+)?%?$/;

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !stop.has(token) && !weak.test(token));

  const specSections = [...text.matchAll(/\b\d{2}\s\d{2}\s\d{2}\b/g)].map((m) => m[0]);
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([token]) => token);

  return [...new Set([...specSections, ...ranked])].slice(0, limit);
}

function extractQuestionTopic(chunkText: string): string {
  const lines = chunkText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 20);

  const candidate = lines.find((line) => /[a-z]/i.test(line)) ?? chunkText.trim();
  const words = candidate.split(/\s+/).slice(0, 12).join(" ");
  return words.length > 90 ? `${words.slice(0, 87)}...` : words;
}

function buildFilePatterns(fileName: string, filePath: string): string[] {
  const stem = shortFileStem(fileName);
  const patterns = new Set<string>();

  if (stem.length >= 10) {
    patterns.add(stem.slice(0, 55));
  }

  const stemTokens = stem.split(/[^a-zA-Z0-9]+/).filter((part) => part.length >= 6);
  for (const token of stemTokens.filter((part) => /\d/.test(part) || part.length >= 10)) {
    patterns.add(token);
  }

  const ids = extractIdentifiers(`${fileName} ${filePath}`);
  if (ids.length > 0 && patterns.size === 0) {
    patterns.add(ids[0].valueNormalized);
  }

  return [...patterns].slice(0, 3);
}

function generateQuestionFromChunk(file: SampledFile, chunk: SampledChunk): GeneratedQuestion | null {
  const text = chunk.chunkText.trim();
  if (text.length < 80) {
    return null;
  }

  const salient = extractSalientTerms(text);
  if (salient.length < 2) {
    return null;
  }

  const fileIds = extractIdentifiers(`${file.fileName} ${file.filePath}`);
  const pageHint = typeof chunk.pageNumber === "number" ? ` (page ${chunk.pageNumber})` : "";
  const topic = extractQuestionTopic(text);
  const primaryTerm = salient[0];
  const secondaryTerm = salient[1];
  const fileLabel = shortFileStem(file.fileName).slice(0, 55);

  let query: string;
  let template: string;
  if (fileIds.length > 0) {
    const id = fileIds[0].raw;
    template = "identifier_content";
    query = `In ${fileLabel}, what does ${id} say about ${primaryTerm} and ${secondaryTerm}?`;
  } else if (/\b\d{2}\s\d{2}\s\d{2}\b/.test(text)) {
    const spec = text.match(/\b\d{2}\s\d{2}\s\d{2}\b/)?.[0] ?? primaryTerm;
    template = "spec_section";
    query = `In ${fileLabel}, what requirements does spec section ${spec} include for ${primaryTerm}?`;
  } else {
    template = "filename_topic";
    query = `In ${fileLabel}, what does the document state about ${topic}?`;
  }

  const slug = `${file.fileId.slice(0, 8)}-c${chunk.chunkIndex}`;
  const patterns = buildFilePatterns(file.fileName, file.filePath);
  if (patterns.length === 0) {
    return null;
  }

  return {
    id: `chunk-${slug}`,
    bucket: "answer",
    query,
    expectedFilePatterns: patterns,
    expectedInTopK: 1,
    groundingFileId: file.fileId,
    groundingChunkId: chunk.chunkId,
    groundingChunkIndex: chunk.chunkIndex,
    groundingPageNumber: chunk.pageNumber,
    groundingSnippet: text.slice(0, 240),
    generatedQueryTemplate: template,
    acceptableAnswerContains: salient.slice(0, 4),
    notes: `${file.docCategory ?? "unknown"} | ${file.fileName}${pageHint}`,
  };
}

type IndexedFileRow = {
  id: string;
  fileName: string;
  filePath: string;
  docCategory: string | null;
  chunkCount: number | null;
};

function pickStratifiedFiles(
  indexedFiles: IndexedFileRow[],
  fileCount: number,
  minPerCategory: number,
  rng: () => number
): IndexedFileRow[] {
  const byCategory = new Map<string, IndexedFileRow[]>();
  for (const file of indexedFiles) {
    const cat = file.docCategory ?? "other";
    const bucket = byCategory.get(cat) ?? [];
    bucket.push(file);
    byCategory.set(cat, bucket);
  }

  const picked: IndexedFileRow[] = [];
  const pickedIds = new Set<string>();
  const categories = [...byCategory.keys()].sort();

  for (const cat of categories) {
    const pool = shuffle(byCategory.get(cat) ?? [], rng);
    let taken = 0;
    const quota = Math.min(minPerCategory, pool.length);
    for (const file of pool) {
      if (taken >= quota || picked.length >= fileCount) {
        break;
      }
      picked.push(file);
      pickedIds.add(file.id);
      taken += 1;
    }
  }

  const fillOrder = shuffle(categories, rng);
  let guard = 0;
  while (picked.length < fileCount && guard < fileCount * fillOrder.length * 4) {
    const cat = fillOrder[guard % fillOrder.length];
    const pool = shuffle(byCategory.get(cat) ?? [], rng);
    for (const file of pool) {
      if (!pickedIds.has(file.id)) {
        picked.push(file);
        pickedIds.add(file.id);
        break;
      }
    }
    guard += 1;
  }

  return picked.slice(0, fileCount);
}

async function sampleFiles(
  projectId: string,
  fileCount: number,
  chunksPerFile: number,
  minPerCategory: number,
  seed: number
): Promise<SampledFile[]> {
  const db = await initializeDb(getEnv().databaseUrl);
  const rng = createRng(seed);

  const indexedFiles = await db
    .select({
      id: fileRecords.id,
      fileName: fileRecords.fileName,
      filePath: fileRecords.filePath,
      docCategory: fileRecords.docCategory,
      chunkCount: fileRecords.chunkCount,
    })
    .from(fileRecords)
    .where(
      and(
        eq(fileRecords.projectId, projectId as UUID),
        sql`${fileRecords.chunkCount} > 0`,
        sql`${fileRecords.indexStatus} = 'indexed'`
      )
    );

  if (indexedFiles.length === 0) {
    throw new Error("No indexed files found for project");
  }

  const picked = pickStratifiedFiles(indexedFiles, fileCount, minPerCategory, rng);

  const samples: SampledFile[] = [];
  for (const file of picked) {
    const chunks = await db
      .select({
        id: fileChunks.id,
        chunkIndex: fileChunks.chunkIndex,
        chunkText: fileChunks.chunkText,
        pageNumber: fileChunks.pageNumber,
        sectionLabel: fileChunks.sectionLabel,
        tokenCount: fileChunks.tokenCount,
        sourceType: fileChunks.sourceType,
      })
      .from(fileChunks)
      .where(
        and(
          eq(fileChunks.fileId, file.id),
          sql`${fileChunks.sourceType} = 'content'`,
          sql`length(${fileChunks.chunkText}) >= 120`
        )
      );

    const substantive = chunks.filter((chunk) => chunk.chunkText.trim().length >= 120);
    const selected = shuffle(substantive, rng).slice(0, chunksPerFile);

    samples.push({
      fileId: file.id,
      fileName: file.fileName,
      filePath: file.filePath,
      docCategory: file.docCategory ?? undefined,
      chunkCount: file.chunkCount ?? 0,
      chunks: selected.map((chunk) => ({
        chunkId: String(chunk.id),
        chunkIndex: chunk.chunkIndex,
        chunkText: chunk.chunkText,
        pageNumber: chunk.pageNumber ?? undefined,
        sectionLabel: chunk.sectionLabel ?? undefined,
        tokenCount: chunk.tokenCount ?? undefined,
      })),
    });
  }

  return samples.filter((file) => file.chunks.length > 0);
}

async function runAudit(
  projectId: string,
  questions: GeneratedQuestion[]
): Promise<AuditRunResult[]> {
  const results: AuditRunResult[] = [];

  for (const question of questions) {
    const startedAt = Date.now();
    const search = await retrievalService.searchProject(projectId as UUID, question.query, {
      topK: 3,
      includeChunks: true,
    });
    const searchRows = search.results.map((row) => ({
      fileId: row.fileId,
      fileName: row.fileName,
      filePath: row.filePath,
      relevance: row.topRelevance,
    }));
    const searchScore = scoreSearchQuestion(question, searchRows, search.totalMatches, 3);

    const reply = await chatCoordinatorService.generateReply(
      projectId as UUID,
      question.query
    );
    const elapsedMs = Date.now() - startedAt;
    const phraseCheck = scoreAnswerPhrases(reply.content, question.acceptableAnswerContains);
    const citedFileNames = reply.sources.map((source) => source.fileName);
    const groundingFileHit = reply.sources.some(
      (source) => source.fileId === question.groundingFileId
    );
    const patternHit =
      findMatchingPatterns(
        reply.sources.map((source) => ({
          fileId: source.fileId,
          fileName: source.fileName,
          relevance: 1,
        })),
        question.expectedFilePatterns
      ).length > 0;

    const combined = combineAnswerResult(searchScore, phraseCheck, reply.content.slice(0, 280));
    const chunkGrounded =
      question.acceptableAnswerContains?.filter((term) => term.length >= 5).some((term) =>
        reply.content.toLowerCase().includes(term.toLowerCase())
      ) ?? false;

    results.push({
      id: question.id,
      query: question.query,
      passed: groundingFileHit && phraseCheck.passed && chunkGrounded,
      scoreDetails: [
        combined.scoreDetails,
        groundingFileHit
          ? "cited grounding file"
          : patternHit
            ? `pattern hit but wrong file: ${citedFileNames.join(" | ") || "(none)"}`
            : `cited: ${citedFileNames.join(" | ") || "(none)"}`,
        chunkGrounded ? "chunk terms in answer" : "chunk terms missing from answer",
      ].join("; "),
      sourceFileHit: groundingFileHit,
      phraseHits: phraseCheck.hits,
      answerSnippet: combined.answerSnippet,
      elapsedMs,
      citedFileNames,
    });

    console.log(
      `[chunk-audit] ${groundingFileHit && phraseCheck.passed && chunkGrounded ? "PASS" : "FAIL"} ${question.id}`
    );
  }

  return results;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  getEnv();
  await initializeDb(getEnv().databaseUrl);

  console.log(`[chunk-audit] project=${args.projectId} seed=${args.seed}`);
  console.log(
    `[chunk-audit] sampling ${args.fileCount} files, ${args.chunksPerFile} chunks each, min ${args.minPerCategory}/category`
  );

  const files = await sampleFiles(
    args.projectId,
    args.fileCount,
    args.chunksPerFile,
    args.minPerCategory,
    args.seed
  );

  const questions: GeneratedQuestion[] = [];
  for (const file of files) {
    for (const chunk of file.chunks) {
      const question = generateQuestionFromChunk(file, chunk);
      if (question) {
        questions.push(question);
      }
    }
  }

  console.log(`[chunk-audit] generated ${questions.length} questions from ${files.length} files`);

  const questionSet = {
    projectId: args.projectId,
    projectName: "MLJ-017 Package 6 - General (TEST CLONE)",
    generatedAt: new Date().toISOString(),
    seed: args.seed,
    sampleStats: {
      filesSampled: files.length,
      questionsGenerated: questions.length,
      categories: [...new Set(files.map((f) => f.docCategory ?? "other"))],
      filesPerCategory: Object.fromEntries(
        [...files.reduce((map, file) => {
          const cat = file.docCategory ?? "other";
          map.set(cat, (map.get(cat) ?? 0) + 1);
          return map;
        }, new Map<string, number>())]
      ),
    },
    questions: questions.map(({ groundingChunkId, groundingChunkIndex, groundingPageNumber, groundingSnippet, generatedQueryTemplate, ...rest }) => ({
      ...rest,
      groundingChunkId,
      groundingChunkIndex,
      groundingPageNumber,
      groundingSnippet,
      generatedQueryTemplate,
    })),
  };

  await mkdir(path.dirname(args.outFile), { recursive: true });
  await writeFile(args.outFile, `${JSON.stringify(questionSet, null, 2)}\n`, "utf8");
  console.log(`[chunk-audit] wrote ${args.outFile}`);

  let auditResults: AuditRunResult[] | undefined;
  if (args.runAsk) {
    console.log(`[chunk-audit] running ${questions.length} tier2 asks...`);
    auditResults = await runAudit(args.projectId, questions);
    const passed = auditResults.filter((row) => row.passed).length;
    const report = {
      generatedAt: new Date().toISOString(),
      projectId: args.projectId,
      seed: args.seed,
      questionsFile: args.outFile,
      sampleStats: questionSet.sampleStats,
      auditedQuestionIds: questions.map((question) => question.id),
      summary: {
        total: auditResults.length,
        passed,
        failed: auditResults.length - passed,
        passRate: auditResults.length > 0 ? Number((passed / auditResults.length).toFixed(3)) : 0,
      },
      results: auditResults,
      failures: auditResults.filter((row) => !row.passed),
    };
    await writeFile(args.reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(
      `[chunk-audit] audit ${passed}/${auditResults.length} passed → ${args.reportFile}`
    );
  } else {
    console.log("[chunk-audit] re-run with --run-ask to execute questions against chat/RAG");
  }
}

main().catch((error) => {
  console.error("[chunk-audit] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
