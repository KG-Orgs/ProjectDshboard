/**
 * Tier 2 local content indexing (MVP Slice 2).
 *
 * Indexes hydrated local files from a small directory: extract text, chunk,
 * embed, and persist vectors via the existing indexing pipeline — without
 * OneDrive Graph download.
 *
 * Usage (from packages/backend):
 *   pnpm tier2:index
 *   pnpm tier2:index -- --limit 3
 *   pnpm tier2:index -- --dir "<absolute path>"
 *   pnpm tier2:index -- --preset specs|submittals|all-hydrated-in-dir|corpus
 *   pnpm tier2:index -- --preset submittals --limit 5
 *   pnpm tier2:index -- --file "<absolute path>"
 *   pnpm tier2:index -- --project-id <uuid> --dry-run
 *   pnpm tier2:index -- --preset corpus --concurrency 2
 *   pnpm tier2:index -- --preset corpus --shard 0/3   # run 0/3, 1/3, 2/3 in separate terminals
 *   pnpm tier2:index -- --preset corpus --watch-seconds 300   # rescan every 5 min for newly hydrated files
 *
 * Presets (relative to corpus root):
 *   specs                 — ADA6 NYCT spec PDFs (Slice 2 default)
 *   submittals            — 05 - SUBMITTALS/01 40 10 Quality Management (QWP area)
 *   all-hydrated-in-dir   — walk preset/--dir tree; index hydrated PDFs/office files only
 *   corpus                — walk entire corpus root (all hydrated eligible files)
 *
 *   --skip-indexed        — skip file_records with chunkCount > 0 (default: on)
 *   --force-reindex       — re-index even when chunkCount > 0
 *   --concurrency N       — index up to N files in parallel within this process (default: 1)
 *   --shard K/N           — only index files where hash(relativePath) % N === K (0-indexed)
 *   --watch-seconds N     — after each pass, wait N seconds and rescan (for OneDrive hydration)
 */

import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { initializeDb } from "../src/db";
import { getEnv } from "../src/config/env";
import { fileChunks, fileRecords, projects } from "../src/db/schema";
import { indexingPipelineService } from "../src/services/indexing-pipeline.service";
import { embeddingsService } from "../src/services/embeddings.service";
import { projectService } from "../src/services/project.service";
import { featureService } from "../src/services/feature.service";
import {
  classifyContentSkip,
  discoverTier2Candidates,
  filterIndexableCandidates,
  prioritizeTier2Candidates,
  statFile,
  tagsWithoutContentSkip,
  type Tier2Candidate,
} from "../src/services/tier2-hydration.utils";

const DEFAULT_CORPUS =
  "/Users/kyle.weixu/Library/CloudStorage/OneDrive-Personal/MLJ-017 Package 6 - General (TEST CLONE)";

const DEFAULT_TIER2_DIR = path.join(
  DEFAULT_CORPUS,
  "02 - DESIGN",
  "01 Specifications",
  "ADA6 NYCT Specification Final"
);

const DEFAULT_SUBMITTALS_DIR = path.join(DEFAULT_CORPUS, "05 - SUBMITTALS");

type Tier2IndexPreset = "specs" | "submittals" | "all-hydrated-in-dir" | "corpus";

const PROJECT_NAME = "MLJ-017 Package 6 - General (TEST CLONE)";
const EMBEDDING_BATCH_SIZE = 50;

interface CliArgs {
  projectId?: string;
  dir: string;
  corpus: string;
  preset?: Tier2IndexPreset;
  file?: string;
  limit?: number;
  dryRun: boolean;
  skipIndexed: boolean;
  concurrency: number;
  shard?: { k: number; n: number };
  watchSeconds?: number;
}

function parseShard(value: string): { k: number; n: number } {
  const match = /^(\d+)\/(\d+)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid --shard "${value}" (use K/N, e.g. 0/3)`);
  }
  const k = Number.parseInt(match[1]!, 10);
  const n = Number.parseInt(match[2]!, 10);
  if (!Number.isFinite(k) || !Number.isFinite(n) || n < 1 || k < 0 || k >= n) {
    throw new Error(`Invalid --shard "${value}" (K must be 0..N-1, N >= 1)`);
  }
  return { k, n };
}

function shardBucket(relativePath: string, shardCount: number): number {
  const hash = createHash("sha256").update(relativePath).digest();
  return hash.readUInt32BE(0) % shardCount;
}

function filterByShard(candidates: Tier2Candidate[], shard: { k: number; n: number }): Tier2Candidate[] {
  return candidates.filter((candidate) => shardBucket(candidate.relativePath, shard.n) === shard.k);
}

async function runWorkerPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      await worker(items[index]!, index);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
}

function resolvePresetDir(preset: Tier2IndexPreset, corpus: string): string {
  switch (preset) {
    case "specs":
      return path.join(corpus, "02 - DESIGN", "01 Specifications", "ADA6 NYCT Specification Final");
    case "submittals":
      return path.join(corpus, "05 - SUBMITTALS", "01 40 10 Quality Management");
    case "all-hydrated-in-dir":
      return path.join(corpus, "05 - SUBMITTALS");
    case "corpus":
      return corpus;
    default:
      throw new Error(`Unknown preset: ${preset satisfies never}`);
  }
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dir: DEFAULT_TIER2_DIR,
    corpus: DEFAULT_CORPUS,
    dryRun: false,
    skipIndexed: true,
    concurrency: 1,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--project-id" && next) {
      args.projectId = next;
      i += 1;
    } else if (arg === "--dir" && next) {
      args.dir = next;
      i += 1;
    } else if (arg === "--preset" && next) {
      if (next === "specs" || next === "submittals" || next === "all-hydrated-in-dir" || next === "corpus") {
        args.preset = next;
      } else {
        throw new Error(`Unknown --preset "${next}" (use specs|submittals|all-hydrated-in-dir|corpus)`);
      }
      i += 1;
    } else if (arg === "--corpus" && next) {
      args.corpus = next;
      i += 1;
    } else if (arg === "--file" && next) {
      args.file = next;
      i += 1;
    } else if (arg === "--limit" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) args.limit = parsed;
      i += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--skip-indexed") {
      args.skipIndexed = true;
    } else if (arg === "--force-reindex") {
      args.skipIndexed = false;
    } else if (arg === "--concurrency" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) args.concurrency = parsed;
      i += 1;
    } else if (arg === "--shard" && next) {
      args.shard = parseShard(next);
      i += 1;
    } else if (arg === "--watch-seconds" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) args.watchSeconds = parsed;
      i += 1;
    }
  }

  return args;
}

async function resolveProjectId(
  db: Awaited<ReturnType<typeof initializeDb>>,
  projectId?: string
): Promise<string> {
  if (projectId) {
    const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!row) throw new Error(`Project not found: ${projectId}`);
    return row.id;
  }

  const [row] = await db.select().from(projects).where(eq(projects.name, PROJECT_NAME)).limit(1);
  if (!row) {
    throw new Error(
      `Project "${PROJECT_NAME}" not found. Run pnpm tier1:ingest first, or pass --project-id.`
    );
  }
  return row.id;
}

function buildCandidates(args: CliArgs): Tier2Candidate[] {
  const corpusParent = path.dirname(args.corpus);

  if (args.file) {
    const absolutePath = path.resolve(args.file);
    const info = statFile(absolutePath);
    if (!info) throw new Error(`Cannot stat file: ${absolutePath}`);
    return [
      {
        absolutePath,
        relativePath: path.relative(corpusParent, absolutePath),
        fileName: info.fileName,
        ext: info.ext,
        size: info.size,
        skipReason: classifyContentSkip(info),
      },
    ];
  }

  if (!fs.existsSync(args.dir)) {
    throw new Error(`Directory not found: ${args.dir}`);
  }

  return discoverTier2Candidates(args.dir, corpusParent);
}

async function embedChunksInBatches(
  chunks: Array<{ chunkText: string }>,
  fileName: string
): Promise<Array<Awaited<ReturnType<typeof embeddingsService.embedBatch>>[number] | null>> {
  const results: Array<Awaited<ReturnType<typeof embeddingsService.embedBatch>>[number] | null> =
    [];

  for (let index = 0; index < chunks.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(index, index + EMBEDDING_BATCH_SIZE);
    const texts = batch.map((c) => c.chunkText);

    try {
      const batchResults = await embeddingsService.embedBatch(texts);
      results.push(...batchResults);
      continue;
    } catch (batchError) {
      const batchMessage = batchError instanceof Error ? batchError.message : String(batchError);
      console.warn(
        `[tier2] batch embed failed for ${fileName} (${texts.length} chunks): ${batchMessage}; retrying individually`
      );
    }

    for (let chunkOffset = 0; chunkOffset < texts.length; chunkOffset += 1) {
      const text = texts[chunkOffset]!;
      try {
        const [singleResult] = await embeddingsService.embedBatch([text]);
        results.push(singleResult);
      } catch (chunkError) {
        const chunkMessage = chunkError instanceof Error ? chunkError.message : String(chunkError);
        console.warn(
          `[tier2] skipping chunk ${index + chunkOffset + 1}/${chunks.length} in ${fileName}: ${chunkMessage}`
        );
        results.push(null);
      }
    }
  }

  return results;
}

async function findOrCreateFileRecord(
  db: Awaited<ReturnType<typeof initializeDb>>,
  projectId: string,
  candidate: Tier2Candidate
): Promise<{ id: string; onedriveItemId: string; tags: string[] | null }> {
  const onedriveItemId = `local:${candidate.relativePath}`;
  const deepLinkUrl = pathToFileURL(candidate.absolutePath).href;
  const now = new Date();

  const [existing] = await db
    .select()
    .from(fileRecords)
    .where(
      and(
        eq(fileRecords.projectId, projectId),
        eq(fileRecords.onedriveItemId, onedriveItemId)
      )
    )
    .limit(1);

  if (existing) {
    return { id: existing.id, onedriveItemId, tags: existing.tags };
  }

  const [row] = await db
    .insert(fileRecords)
    .values({
      id: randomUUID(),
      projectId,
      onedriveItemId,
      fileName: candidate.fileName,
      filePath: candidate.relativePath,
      fileType: candidate.ext || null,
      fileSize: candidate.size,
      deepLinkUrl,
      processingMode: "metadata_only",
      processingReason: "tier2_created_missing_tier1_row",
      reducedCoverage: true,
      indexStatus: "pending",
      chunkCount: 0,
      createdAt: now,
      updatedAt: now,
      lastSynced: now,
    })
    .returning({ id: fileRecords.id, tags: fileRecords.tags });

  return { id: row.id, onedriveItemId, tags: row.tags };
}

async function loadAlreadyIndexedPaths(
  db: Awaited<ReturnType<typeof initializeDb>>,
  projectId: string
): Promise<Set<string>> {
  const rows = await db
    .select({ onedriveItemId: fileRecords.onedriveItemId })
    .from(fileRecords)
    .where(
      and(
        eq(fileRecords.projectId, projectId),
        or(
          gt(fileRecords.chunkCount, 0),
          sql`EXISTS (SELECT 1 FROM ${fileChunks} fc WHERE fc.file_id = ${fileRecords.id})`
        )
      )
    );

  return new Set(rows.map((row) => row.onedriveItemId));
}

function summarizeSkipReasons(candidates: Tier2Candidate[]): Record<string, number> {
  const byReason = new Map<string, number>();
  for (const candidate of candidates) {
    const reason = candidate.skipReason ?? "eligible";
    byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
  }
  return Object.fromEntries(byReason);
}

async function indexOneFile(
  projectId: string,
  db: Awaited<ReturnType<typeof initializeDb>>,
  candidate: Tier2Candidate
): Promise<{
  status: "indexed" | "skipped";
  reason?: string;
  chunkCount?: number;
  embedDims?: number;
  embedModel?: string;
}> {
  if (candidate.skipReason) {
    return { status: "skipped", reason: candidate.skipReason };
  }

  const file = await findOrCreateFileRecord(db, projectId, candidate);
  const extractorV2Enabled = featureService.isRolloutFlagEnabledForProject(
    projectId as any,
    "INDEXING_EXTRACTOR_PIPELINE_V2_ENABLED"
  );

  const insights = await indexingPipelineService.indexTempFile({
    tempFilePath: candidate.absolutePath,
    fileName: candidate.fileName,
    filePath: candidate.relativePath,
    projectId,
    rollout: { extractorV2Enabled },
  });

  if (insights.chunks.length === 0) {
    return { status: "skipped", reason: "no_extractable_chunks" };
  }

  const embeddingResults = await embedChunksInBatches(insights.chunks, candidate.fileName);
  const indexedChunks = insights.chunks.flatMap((chunk, index) => {
    const embedding = embeddingResults[index];
    if (!embedding) {
      return [];
    }

    return [
      {
        chunk,
        embedding,
      },
    ];
  });

  if (indexedChunks.length === 0) {
    return { status: "skipped", reason: "all_chunks_embed_failed" };
  }

  const skippedEmbedCount = insights.chunks.length - indexedChunks.length;
  if (skippedEmbedCount > 0) {
    console.warn(
      `[tier2] ${candidate.fileName}: indexed ${indexedChunks.length}/${insights.chunks.length} chunks (${skippedEmbedCount} embed failures skipped)`
    );
  }

  await projectService.replaceFileChunks(
    projectId as any,
    file.id as any,
    file.onedriveItemId,
    candidate.fileName,
    indexedChunks.map(({ chunk, embedding }) => ({
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText,
      tokenCount: chunk.tokenCount,
      embeddingModel: embedding.model,
      embedding: embedding.vector,
      sourceType: chunk.sourceType,
      pageNumber: chunk.pageNumber,
      sectionLabel: chunk.sectionLabel,
      metadata: chunk.metadata,
      confidence: chunk.confidence,
    })),
    insights.links
  );

  const cls = insights.classification;
  const mergedTags = Array.from(
    new Set([...tagsWithoutContentSkip(file.tags), ...cls.tags])
  );

  const extractedFields = {
    ...(typeof cls.extractedFields === "object" && cls.extractedFields ? cls.extractedFields : {}),
    contentSkipped: false,
    contentSkipReason: undefined,
    tier2Indexed: true,
  };

  await projectService.updateFileIndexingResult(projectId as any, file.onedriveItemId, {
    indexStatus: "indexed",
    summary: insights.summary,
    keyTopics: insights.keyTopics,
    chunkCount: indexedChunks.length,
    extractionProvenance: insights.extractionProvenance as Record<string, unknown> | undefined,
    lastIndexed: new Date(),
    processingMode: "full",
    processingReason: "tier2_local_index",
    reducedCoverage: false,
    docCategory: cls.category,
    tags: mergedTags,
    extractedFields,
    specSection: cls.extractedFields.specSection,
    sheetNumber: cls.extractedFields.sheetNumber,
    revision: cls.extractedFields.revision,
  });

  return {
    status: "indexed",
    chunkCount: indexedChunks.length,
    embedDims: indexedChunks[0]?.embedding.vector.length,
    embedModel: indexedChunks[0]?.embedding.model,
  };
}

function printHelpfulNoHydratedError(args: CliArgs, candidates: Tier2Candidate[]): void {
  const skipped = candidates.filter((c) => c.skipReason !== null);
  const byReason = new Map<string, number>();
  for (const c of skipped) {
    const reason = c.skipReason ?? "unknown";
    byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
  }

  console.error(`\n[tier2] No indexable hydrated files found in: ${args.dir}`);
  console.error(`[tier2] Scanned ${candidates.length} files; skip reasons:`, Object.fromEntries(byReason));
  console.error("\nTry:");
  console.error("  pnpm tier2:index -- --dir \"<path with hydrated PDFs>\"");
  console.error("  pnpm tier2:index -- --file \"<absolute path to one hydrated file>\"");
  console.error(`\nDefault dirs:`);
  console.error(`  specs:      ${DEFAULT_TIER2_DIR}`);
  console.error(
    `  submittals: ${path.join(args.corpus, "05 - SUBMITTALS", "01 40 10 Quality Management")}`
  );
  console.error(`  all-hydrated-in-dir walks: ${path.join(args.corpus, "05 - SUBMITTALS")}`);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  config({ path: "../../.env" });
  const args = parseArgs(process.argv.slice(2));

  if (args.preset) {
    args.dir = resolvePresetDir(args.preset, args.corpus);
  }

  const env = getEnv();
  if (!env.databaseUrl) throw new Error("DATABASE_URL is missing");

  const db = await initializeDb(env.databaseUrl);
  const projectId = await resolveProjectId(db, args.projectId);

  console.log(`[tier2] corpus parent: ${path.dirname(args.corpus)}`);
  console.log(`[tier2] project: ${projectId}`);
  if (args.preset) console.log(`[tier2] preset: ${args.preset}`);
  console.log(`[tier2] source: ${args.file ?? args.dir}`);
  if (args.watchSeconds) console.log(`[tier2] watch: rescan every ${args.watchSeconds}s`);
  if (args.dryRun) console.log("[tier2] DRY RUN — no extraction or embeddings");

  let pass = 0;
  while (true) {
    pass += 1;
    if (args.watchSeconds && pass > 1) {
      console.log(`\n[tier2] watch pass #${pass}`);
    }

    const exitCode = await runIndexingPass(args, db, projectId);
    if (!args.watchSeconds || args.dryRun || args.file) {
      process.exit(exitCode);
    }
    if (exitCode !== 0) {
      console.log(`[tier2] watch: pass failed (exit ${exitCode}); retry in ${args.watchSeconds}s`);
    } else {
      console.log(`[tier2] watch: pass complete; rescan in ${args.watchSeconds}s`);
    }
    await sleep(args.watchSeconds! * 1000);
  }
}

async function runIndexingPass(
  args: CliArgs,
  db: Awaited<ReturnType<typeof initializeDb>>,
  projectId: string
): Promise<number> {
  const allCandidates = buildCandidates(args);
  const skipBreakdown = summarizeSkipReasons(allCandidates);
  const indexable = prioritizeTier2Candidates(filterIndexableCandidates(allCandidates));

  if (indexable.length === 0) {
    if (args.watchSeconds) {
      console.log(
        `[tier2] watch: no hydrated eligible files yet; placeholders=${skipBreakdown.placeholder ?? 0}`
      );
      return 0;
    }
    printHelpfulNoHydratedError(args, allCandidates);
    return 1;
  }

  let alreadyIndexed = 0;
  let targets = indexable;
  if (args.skipIndexed && !args.file) {
    const indexedPaths = await loadAlreadyIndexedPaths(db, projectId);
    const pending = indexable.filter((candidate) => {
      const key = `local:${candidate.relativePath}`;
      if (indexedPaths.has(key)) {
        alreadyIndexed += 1;
        return false;
      }
      return true;
    });
    targets = pending;
    if (alreadyIndexed > 0) {
      console.log(`[tier2] skipping ${alreadyIndexed} file(s) already indexed (chunkCount > 0)`);
    }
  }

  let shardExcluded = 0;
  if (args.shard) {
    const beforeShard = targets.length;
    targets = filterByShard(targets, args.shard);
    shardExcluded = beforeShard - targets.length;
    console.log(
      `[tier2] shard ${args.shard.k}/${args.shard.n}: ${targets.length} file(s) in shard (${shardExcluded} excluded by partition)`
    );
  }

  if (args.limit) targets = targets.slice(0, args.limit);

  console.log(`[tier2] skip breakdown: ${JSON.stringify(skipBreakdown)}`);
  console.log(
    `[tier2] ${targets.length} file(s) to index (${allCandidates.length} scanned, ${indexable.length} hydrated+eligible${alreadyIndexed ? `, ${alreadyIndexed} already indexed` : ""}${shardExcluded ? `, ${shardExcluded} outside shard` : ""})`
  );
  if (args.concurrency > 1) {
    console.log(`[tier2] concurrency: ${args.concurrency}`);
  }

  if (args.dryRun) {
    for (const c of targets) {
      console.log(`  would index: ${c.fileName} (${(c.size / 1024).toFixed(0)} KB)`);
    }
    return 0;
  }

  if (targets.length === 0) {
    const placeholders = skipBreakdown.placeholder ?? 0;
    console.log(
      `[tier2] Nothing to index — all hydrated eligible files already have chunks.${placeholders > 0 ? ` (${placeholders} placeholders awaiting hydration)` : ""}`
    );
    return 0;
  }

  const preflight = await embeddingsService.preflight();
  if (!preflight.ok) {
    throw new Error(`Embedding preflight failed: ${preflight.message ?? preflight.code}`);
  }

  const started = Date.now();
  let indexed = 0;
  let skipped = 0;
  let totalChunks = 0;
  const perFile: Array<Record<string, unknown>> = [];
  const totalTargets = targets.length;

  await runWorkerPool(targets, args.concurrency, async (candidate, fileIndex) => {
    const progress = `[${fileIndex + 1}/${totalTargets}]`;
    process.stdout.write(`[tier2] ${progress} ${candidate.fileName} ... `);
    try {
      const result = await indexOneFile(projectId, db, candidate);
      if (result.status === "indexed") {
        indexed += 1;
        totalChunks += result.chunkCount ?? 0;
        console.log(
          `indexed chunks=${result.chunkCount} dims=${result.embedDims} model=${result.embedModel}`
        );
        perFile.push({
          file: candidate.fileName,
          chunks: result.chunkCount,
          embedDims: result.embedDims,
          embedModel: result.embedModel,
        });
      } else {
        skipped += 1;
        console.log(`skipped (${result.reason})`);
        perFile.push({ file: candidate.fileName, skipped: result.reason });
      }
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAILED: ${message}`);
      perFile.push({ file: candidate.fileName, error: message });
    }
  });

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log("\n========== TIER 2 INDEXING SUMMARY ==========");
  console.log(
    JSON.stringify(
      {
        projectId,
        dir: args.file ?? args.dir,
        preset: args.preset,
        concurrency: args.concurrency,
        shard: args.shard ? `${args.shard.k}/${args.shard.n}` : undefined,
        filesIndexed: indexed,
        filesSkipped: skipped,
        filesAlreadyIndexed: alreadyIndexed,
        totalChunks,
        skipBreakdown,
        perFile,
        elapsedSeconds: Number(elapsed),
      },
      null,
      2
    )
  );
  console.log("=============================================");

  return skipped > 0 && indexed === 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
