/**
 * MLJ-017 Package 6 retrieval + RAG eval harness.
 *
 * Usage (from packages/backend):
 *   pnpm eval:mlj017
 *   pnpm eval:mlj017 -- --search-only        # skip tier2-ask LLM calls
 *   pnpm eval:mlj017 -- --topK 5
 *   pnpm eval:mlj017 -- --ids answer-02,answer-05
 */

import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UUID } from "@contractor/shared";
import { sql } from "drizzle-orm";
import { initializeDb, getDbIfInitialized } from "../src/db";
import { fileRecords } from "../src/db/schema";
import { getEnv, resetEnvCache } from "../src/config/env";
import { retrievalService } from "../src/services/retrieval.service";
import { chatCoordinatorService } from "../src/services/chat-coordinator.service";
import {
  combineAnswerResult,
  scoreAnswerPhrases,
  scoreSearchQuestion,
  type Mlj017TestQuestion,
  type QuestionEvalResult,
} from "../eval/mlj017-eval.utils";

config({ path: "../../.env" });
process.env.RETRIEVAL_HYBRID_ENABLED = process.env.RETRIEVAL_HYBRID_ENABLED ?? "true";
resetEnvCache();

interface QuestionSet {
  projectId: string;
  projectName?: string;
  defaultTopK?: number;
  questions: Mlj017TestQuestion[];
}

interface CorpusSnapshot {
  snapshotAt: string;
  totalFiles: number;
  indexedFiles: number;
  totalChunks: number;
}

function parseArgs(argv: string[]): {
  questionsFile: string;
  reportFile: string;
  topK?: number;
  searchOnly: boolean;
  idFilter?: Set<string>;
} {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const backendRoot = path.resolve(scriptDir, "..");
  let questionsFile = path.join(backendRoot, "eval/mlj017-test-questions.json");
  let reportFile = path.join(backendRoot, "eval/mlj017-audit-report.json");
  let topK: number | undefined;
  let searchOnly = false;
  let idFilter: Set<string> | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--" || arg === "") {
      continue;
    }
    if ((arg === "--questions" || arg === "--file") && next) {
      questionsFile = path.resolve(next.startsWith("/") ? next : path.join(backendRoot, next));
      i += 1;
    } else if (arg === "--report" && next) {
      reportFile = path.resolve(next);
      i += 1;
    } else if (arg === "--topK" && next) {
      topK = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--ids" && next) {
      idFilter = new Set(next.split(",").map((value) => value.trim()).filter(Boolean));
      i += 1;
    } else if (arg === "--search-only") {
      searchOnly = true;
    }
  }

  return { questionsFile, reportFile, topK, searchOnly, idFilter };
}

async function loadQuestionSet(filePath: string): Promise<QuestionSet> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as QuestionSet;
}

async function loadCorpusSnapshot(projectId: string): Promise<CorpusSnapshot> {
  const db = getDbIfInitialized();
  if (!db) {
    return { snapshotAt: new Date().toISOString(), totalFiles: 0, indexedFiles: 0, totalChunks: 0 };
  }

  const [row] = await db
    .select({
      totalFiles: sql<number>`COUNT(*)::int`,
      indexedFiles: sql<number>`COUNT(*) FILTER (WHERE ${fileRecords.chunkCount} > 0)::int`,
      totalChunks: sql<number>`COALESCE(SUM(${fileRecords.chunkCount}), 0)::int`,
    })
    .from(fileRecords)
    .where(sql`${fileRecords.projectId} = ${projectId}::uuid`);

  return {
    snapshotAt: new Date().toISOString(),
    totalFiles: row.totalFiles,
    indexedFiles: row.indexedFiles,
    totalChunks: row.totalChunks,
  };
}

function printSummaryTable(
  results: QuestionEvalResult[],
  bucketSummary: Record<string, { pass: number; total: number }>
): void {
  console.log("\n========== MLJ-017 EVAL SUMMARY ==========\n");
  console.log("Bucket          Pass/Total  Rate");
  console.log("--------------  ----------  ----");
  for (const [bucket, stats] of Object.entries(bucketSummary)) {
    const rate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(0) : "0";
    console.log(
      `${bucket.padEnd(15)} ${String(stats.pass).padStart(2)}/${String(stats.total).padEnd(8)} ${rate}%`
    );
  }
  const totalPass = results.filter((r) => r.passed).length;
  console.log("--------------  ----------  ----");
  console.log(
    `${"OVERALL".padEnd(15)} ${String(totalPass).padStart(2)}/${String(results.length).padEnd(8)} ${((totalPass / results.length) * 100).toFixed(0)}%`
  );

  const failures = results.filter((r) => !r.passed);
  console.log(`\nFailures (${failures.length}):`);
  for (const fail of failures.slice(0, 10)) {
    console.log(`  [${fail.id}] ${fail.query}`);
    console.log(`    ${fail.scoreDetails}`);
    console.log(`    top: ${fail.topFileNames.join(" | ") || "(empty)"}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const questionSet = await loadQuestionSet(args.questionsFile);
  const questions =
    args.idFilter && args.idFilter.size > 0
      ? questionSet.questions.filter((question) => args.idFilter!.has(question.id))
      : questionSet.questions;
  const topKDefault = args.topK ?? questionSet.defaultTopK ?? 3;

  const env = getEnv();
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  await initializeDb(env.databaseUrl);
  const snapshot = await loadCorpusSnapshot(questionSet.projectId);

  console.log(`[eval] project: ${questionSet.projectId}`);
  console.log(
    `[eval] corpus snapshot: ${snapshot.indexedFiles} indexed files, ${snapshot.totalChunks} chunks (${snapshot.snapshotAt})`
  );
  console.log(`[eval] questions: ${questions.length}, topK=${topKDefault}, searchOnly=${args.searchOnly}`);

  const results: QuestionEvalResult[] = [];

  for (const question of questions) {
    const searchTopK = args.topK ?? questionSet.defaultTopK ?? 3;
    const rankCutoff = question.expectedInTopK ?? searchTopK;
    process.stdout.write(`[eval] ${question.id} (${question.bucket})... `);

    const search = await retrievalService.searchProject(
      questionSet.projectId as UUID,
      question.query,
      { topK: searchTopK, includeChunks: true }
    );

    const rows = search.results.map((row) => ({
      fileId: row.fileId,
      fileName: row.fileName,
      filePath: row.filePath,
      relevance: row.topRelevance,
    }));

    const searchScore = scoreSearchQuestion(
      question,
      rows,
      search.totalMatches,
      searchTopK,
      rankCutoff
    );

    let passed = searchScore.passed;
    let scoreDetails = searchScore.scoreDetails;
    let answerPhraseHits: string[] | undefined;
    let answerSnippet: string | undefined;
    // Retrieval metric is independent of generation: did the expected source
    // appear within the rank cutoff?
    const sourceAt3 = searchScore.expectedPatternHit;
    let groundedAnswer: boolean | undefined;

    if (question.bucket === "answer" && !args.searchOnly) {
      try {
        const reply = await chatCoordinatorService.generateReply(
          questionSet.projectId as UUID,
          question.query
        );
        const phraseCheck = scoreAnswerPhrases(reply.content, question.acceptableAnswerContains);
        const combined = combineAnswerResult(searchScore, phraseCheck, reply.content.slice(0, 280));
        passed = combined.passed;
        scoreDetails = combined.scoreDetails;
        answerPhraseHits = combined.answerPhraseHits;
        answerSnippet = combined.answerSnippet;
        groundedAnswer = phraseCheck.passed;
      } catch (error) {
        passed = false;
        scoreDetails = `${searchScore.scoreDetails}; ask error: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    }

    const result: QuestionEvalResult = {
      id: question.id,
      bucket: question.bucket,
      query: question.query,
      passed,
      scoreDetails,
      topK: searchTopK,
      rankCutoff,
      topFileNames: searchScore.topFileNames,
      topRelevances: searchScore.topRelevances,
      totalMatches: search.totalMatches,
      expectedPatternHit: searchScore.expectedPatternHit,
      matchedPatterns: searchScore.matchedPatterns,
      answerPhraseHits,
      answerSnippet,
      sourceAt3,
      groundedAnswer,
    };

    results.push(result);
    console.log(passed ? "PASS" : "FAIL");
  }

  const bucketSummary: Record<string, { pass: number; total: number }> = {};
  for (const result of results) {
    bucketSummary[result.bucket] ??= { pass: 0, total: 0 };
    bucketSummary[result.bucket].total += 1;
    if (result.passed) bucketSummary[result.bucket].pass += 1;
  }

  // Split metrics: retrieval (source@cutoff) vs generation (grounded answer).
  const answerResults = results.filter((r) => r.bucket === "answer");
  const sourceAtKHits = results.filter((r) => r.sourceAt3).length;
  const groundedScored = answerResults.filter((r) => typeof r.groundedAnswer === "boolean");
  const groundedHits = groundedScored.filter((r) => r.groundedAnswer).length;
  const sourceAtKRate = results.length > 0 ? Number((sourceAtKHits / results.length).toFixed(3)) : 0;
  const groundedRate =
    groundedScored.length > 0 ? Number((groundedHits / groundedScored.length).toFixed(3)) : 0;

  const report = {
    snapshot,
    projectId: questionSet.projectId,
    projectName: questionSet.projectName,
    evaluatedAt: new Date().toISOString(),
    topKDefault,
    searchOnly: args.searchOnly,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      passRate: Number((results.filter((r) => r.passed).length / results.length).toFixed(3)),
      sourceAtK: { hits: sourceAtKHits, total: results.length, rate: sourceAtKRate },
      groundedAnswer: { hits: groundedHits, total: groundedScored.length, rate: groundedRate },
      byBucket: Object.fromEntries(
        Object.entries(bucketSummary).map(([bucket, stats]) => [
          bucket,
          {
            ...stats,
            passRate: Number((stats.pass / stats.total).toFixed(3)),
          },
        ])
      ),
    },
    results,
  };

  await writeFile(args.reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  printSummaryTable(results, bucketSummary);
  console.log("\n---------- SPLIT METRICS ----------");
  console.log(
    `source@${topKDefault} (retrieval): ${sourceAtKHits}/${results.length} (${(sourceAtKRate * 100).toFixed(0)}%)`
  );
  console.log(
    `grounded answer (generation): ${groundedHits}/${groundedScored.length} (${(groundedRate * 100).toFixed(0)}%)`
  );
  console.log(`\nReport written to ${args.reportFile}`);
}

main()
  // The pg pool keeps the event loop alive, so exit explicitly once done.
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
