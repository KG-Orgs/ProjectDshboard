/**
 * Streaming batch indexer for large OneDrive/SharePoint corpora.
 *
 * Downloads → indexes → frees local copy for each file so disk usage stays
 * bounded. Uses a concurrent worker pool so download + extract + embed run in
 * parallel across N files at a time.  Safe to kill and re-run.
 *
 * Usage (from packages/backend):
 *   pnpm tier2:stream -- --corpus "<path>" --project-id <uuid>
 *   pnpm tier2:stream -- --corpus "<path>" --project-id <uuid> --concurrency 5
 *   pnpm tier2:stream -- --corpus "<path>" --project-id <uuid> --limit 200
 *   pnpm tier2:stream -- --corpus "<path>" --project-id <uuid> --dry-run
 *
 * Run multiple shards in separate terminals for maximum throughput:
 *   terminal 1: pnpm tier2:stream -- ... --shard 0/3
 *   terminal 2: pnpm tier2:stream -- ... --shard 1/3
 *   terminal 3: pnpm tier2:stream -- ... --shard 2/3
 */

import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { getEnv } from "../src/config/env";
import { fileChunks, fileRecords } from "../src/db/schema";
import { indexingPipelineService } from "../src/services/indexing-pipeline.service";
import { embeddingsService } from "../src/services/embeddings.service";
import { projectService } from "../src/services/project.service";
import { featureService } from "../src/services/feature.service";
import {
  tagsWithoutContentSkip,
  TEXT_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  MAX_TEXT_PDF_BYTES,
  extensionOf,
} from "../src/services/tier2-hydration.utils";

const EMBEDDING_BATCH_SIZE = 50;

// ─── CLI ─────────────────────────────────────────────────────────────────────

interface CliArgs {
  corpus: string;
  projectId: string;
  concurrency: number;
  limit?: number;
  shard?: { k: number; n: number };
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  let corpus = "";
  let projectId = "";
  let concurrency = 3;
  let limit: number | undefined;
  let shard: { k: number; n: number } | undefined;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--corpus" && next) { corpus = next; i++; }
    else if (arg === "--project-id" && next) { projectId = next; i++; }
    else if (arg === "--concurrency" && next) { concurrency = Math.max(1, Number.parseInt(next, 10)); i++; }
    else if (arg === "--limit" && next) { limit = Number.parseInt(next, 10); i++; }
    else if (arg === "--shard" && next) {
      const [k, n] = next.split("/").map(Number);
      if (Number.isFinite(k) && Number.isFinite(n) && n > 0) shard = { k, n };
      i++;
    }
    else if (arg === "--dry-run") { dryRun = true; }
  }

  if (!corpus) throw new Error("--corpus <path> is required");
  if (!projectId) throw new Error("--project-id <uuid> is required");
  return { corpus, projectId, concurrency, limit, shard, dryRun };
}

// ─── File discovery ───────────────────────────────────────────────────────────

interface WalkEntry {
  absolutePath: string;
  relativePath: string;
  fileName: string;
  ext: string;
  size: number;
}

function isEligibleExt(ext: string, size: number): boolean {
  if (ARCHIVE_EXTENSIONS.has(ext)) return false;
  if (VIDEO_EXTENSIONS.has(ext)) return false;
  if (IMAGE_EXTENSIONS.has(ext)) return false;
  if (ext === "pdf" && size > MAX_TEXT_PDF_BYTES) return false;
  return TEXT_EXTENSIONS.has(ext);
}

function shardBucket(relativePath: string, n: number): number {
  return createHash("sha256").update(relativePath).digest().readUInt32BE(0) % n;
}

function walkCorpus(corpus: string, corpusParent: string, args: CliArgs): WalkEntry[] {
  const out: WalkEntry[] = [];
  const stack: string[] = [corpus];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (entry.name.startsWith("._") || entry.name === ".DS_Store") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(full); continue; }
      if (!entry.isFile()) continue;
      let stat: fs.Stats;
      try { stat = fs.lstatSync(full); } catch { continue; }
      const size = Number(stat.size);
      const ext = extensionOf(entry.name);
      if (!isEligibleExt(ext, size)) continue;
      const relativePath = path.relative(corpusParent, full);
      if (args.shard && shardBucket(relativePath, args.shard.n) !== args.shard.k) continue;
      out.push({ absolutePath: full, relativePath, fileName: entry.name, ext, size });
      if (args.limit && out.length >= args.limit) return out;
    }
  }
  return out;
}

// ─── Hydration ────────────────────────────────────────────────────────────────

function isHydrated(absolutePath: string): boolean {
  try {
    const stat = fs.lstatSync(absolutePath);
    const size = Number(stat.size);
    if (size === 0) return true;
    return Number(stat.blocks) * 512 >= size;
  } catch { return false; }
}

async function hydrateFile(absolutePath: string, maxWaitMs = 120_000): Promise<boolean> {
  if (isHydrated(absolutePath)) return true;
  // Reading a byte triggers OneDrive Files On Demand download
  try {
    const fd = fs.openSync(absolutePath, "r");
    const buf = Buffer.alloc(1);
    fs.readSync(fd, buf, 0, 1, 0);
    fs.closeSync(fd);
  } catch { /* will poll below */ }

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (isHydrated(absolutePath)) return true;
    await new Promise((r) => setTimeout(r, 2_000));
  }
  return isHydrated(absolutePath);
}

/** Invoke OneDrive "Free up space" shell verb — same as right-click in Explorer. */
function freeLocalCopy(absolutePath: string): void {
  try {
    const dir = path.dirname(absolutePath).replace(/'/g, "''");
    const name = path.basename(absolutePath).replace(/'/g, "''");
    const ps = `$s=New-Object -ComObject Shell.Application;$f=$s.Namespace('${dir}');if($f){$i=$f.ParseName('${name}');if($i){$i.InvokeVerb('unpintocloudfile')}}`;
    execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { timeout: 10_000, stdio: "pipe" });
  } catch { /* non-fatal */ }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

// Cap pool to 3 per shard so N shards × 3 stays within Neon's connection limit.
function initShardDb(databaseUrl: string) {
  const needsSsl = /\.neon\.tech/i.test(databaseUrl);
  const client = postgres(databaseUrl, {
    ssl: needsSsl ? "require" : false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 30,
  });
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof initShardDb>;

async function loadIndexedIds(databaseUrl: string, projectId: string): Promise<Set<string>> {
  // Recreate the DB on each retry — postgres.js reuses the dead socket otherwise.
  // Neon cold-start + simultaneous shard startup causes repeated ECONNRESET.
  for (let attempt = 1; attempt <= 15; attempt++) {
    const db = initShardDb(databaseUrl);
    try {
      const rows = await db
        .select({ onedriveItemId: fileRecords.onedriveItemId })
        .from(fileRecords)
        .where(and(
          eq(fileRecords.projectId, projectId),
          gt(fileRecords.chunkCount, 0)
        ));
      return new Set(rows.map((r) => r.onedriveItemId));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      const msg = (err as Error).message ?? '';
      const isRetryable = code === 'ECONNRESET' || code === 'ENOTFOUND' || code === 'ETIMEDOUT'
        || msg.includes('CONNECT_TIMEOUT') || msg.includes('CONNECTION_CLOSED');
      if (isRetryable && attempt < 15) {
        const jitter = Math.floor(Math.random() * 5000);
        const wait = Math.min(attempt * 5000 + jitter, 60000);
        console.log(`[stream] DB warm-up attempt ${attempt}/15 failed (${code ?? msg.slice(0, 40)}), retrying in ${Math.round(wait / 1000)}s...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  return new Set();
}

async function findOrCreateFileRecord(
  db: Db, projectId: string, entry: WalkEntry
): Promise<{ id: string; onedriveItemId: string; tags: string[] | null }> {
  const onedriveItemId = `local:${entry.relativePath}`;
  const now = new Date();
  const [existing] = await db
    .select().from(fileRecords)
    .where(and(eq(fileRecords.projectId, projectId), eq(fileRecords.onedriveItemId, onedriveItemId)))
    .limit(1);
  if (existing) return { id: existing.id, onedriveItemId, tags: existing.tags };
  const [row] = await db.insert(fileRecords).values({
    id: randomUUID(), projectId, onedriveItemId,
    fileName: entry.fileName, filePath: entry.relativePath,
    fileType: entry.ext || null, fileSize: entry.size,
    deepLinkUrl: pathToFileURL(entry.absolutePath).href,
    processingMode: "metadata_only", processingReason: "tier2_stream_created",
    reducedCoverage: true, indexStatus: "pending", chunkCount: 0,
    createdAt: now, updatedAt: now, lastSynced: now,
  }).returning({ id: fileRecords.id, tags: fileRecords.tags });
  return { id: row.id, onedriveItemId, tags: row.tags };
}

// ─── Embedding ────────────────────────────────────────────────────────────────

async function embedChunks(
  chunks: Array<{ chunkText: string }>
): Promise<Array<Awaited<ReturnType<typeof embeddingsService.embedBatch>>[number] | null>> {
  const results: Array<Awaited<ReturnType<typeof embeddingsService.embedBatch>>[number] | null> = [];
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    try { results.push(...await embeddingsService.embedBatch(batch.map((c) => c.chunkText))); continue; }
    catch { /* retry individually */ }
    for (const c of batch) {
      try { results.push(...await embeddingsService.embedBatch([c.chunkText])); }
      catch { results.push(null); }
    }
  }
  return results;
}

// ─── Index one file ───────────────────────────────────────────────────────────

async function indexOneFile(
  db: Db, projectId: string, entry: WalkEntry, dryRun: boolean
): Promise<{ status: "indexed" | "skipped" | "error"; reason?: string; chunks?: number }> {
  if (dryRun) return { status: "indexed", chunks: 0 };
  try {
    const file = await findOrCreateFileRecord(db, projectId, entry);
    const extractorV2Enabled = featureService.isRolloutFlagEnabledForProject(
      projectId as any, "INDEXING_EXTRACTOR_PIPELINE_V2_ENABLED"
    );
    const insights = await indexingPipelineService.indexTempFile({
      tempFilePath: entry.absolutePath, fileName: entry.fileName,
      filePath: entry.relativePath, projectId,
      rollout: { extractorV2Enabled },
    });
    if (insights.chunks.length === 0) return { status: "skipped", reason: "no_chunks" };

    const embeddingResults = await embedChunks(insights.chunks);
    const indexedChunks = insights.chunks.flatMap((chunk, i) => {
      const emb = embeddingResults[i];
      return emb ? [{ chunk, embedding: emb }] : [];
    });
    if (indexedChunks.length === 0) return { status: "skipped", reason: "embed_failed" };

    await projectService.replaceFileChunks(
      projectId as any, file.id as any, file.onedriveItemId, entry.fileName,
      indexedChunks.map(({ chunk, embedding }) => ({
        chunkIndex: chunk.chunkIndex, chunkText: chunk.chunkText, tokenCount: chunk.tokenCount,
        embeddingModel: embedding.model, embedding: embedding.vector,
        sourceType: chunk.sourceType, pageNumber: chunk.pageNumber,
        sectionLabel: chunk.sectionLabel, metadata: chunk.metadata, confidence: chunk.confidence,
      })),
      insights.links
    );

    const cls = insights.classification;
    const mergedTags = Array.from(new Set([...tagsWithoutContentSkip(file.tags), ...cls.tags]));
    await projectService.updateFileIndexingResult(projectId as any, file.onedriveItemId, {
      indexStatus: "indexed", summary: insights.summary, keyTopics: insights.keyTopics,
      chunkCount: indexedChunks.length,
      extractionProvenance: insights.extractionProvenance as Record<string, unknown> | undefined,
      lastIndexed: new Date(), processingMode: "full", processingReason: "tier2_stream_index",
      reducedCoverage: false, docCategory: cls.category, tags: mergedTags,
      extractedFields: {
        ...(typeof cls.extractedFields === "object" && cls.extractedFields ? cls.extractedFields : {}),
        contentSkipped: false, tier2Indexed: true,
      },
      specSection: cls.extractedFields.specSection,
      sheetNumber: cls.extractedFields.sheetNumber,
      revision: cls.extractedFields.revision,
    });

    return { status: "indexed", chunks: indexedChunks.length };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Concurrent worker pool ───────────────────────────────────────────────────

interface Stats { indexed: number; skipped: number; errors: number; startTime: number; }

async function runWorkerPool(targets: WalkEntry[], db: Db, args: CliArgs, stats: Stats): Promise<void> {
  let nextIndex = 0;
  const total = targets.length;

  async function worker(workerId: number): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= total) return;
      const entry = targets[i]!;
      const pos = `[w${workerId} ${i + 1}/${total}]`;

      // 1. Hydrate
      if (!args.dryRun && !isHydrated(entry.absolutePath)) {
        process.stdout.write(`${pos} ↓ ${entry.fileName}...\n`);
        const ok = await hydrateFile(entry.absolutePath);
        if (!ok) {
          process.stdout.write(`${pos} TIMEOUT — skipping\n`);
          stats.skipped++;
          continue;
        }
      }

      // 2. Index
      const result = await indexOneFile(db, args.projectId, entry, args.dryRun);
      if (result.status === "indexed") {
        stats.indexed++;
        process.stdout.write(`${pos} ✓ ${entry.fileName} chunks=${result.chunks}\n`);
      } else if (result.status === "skipped") {
        stats.skipped++;
        process.stdout.write(`${pos} ~ ${entry.fileName} (${result.reason})\n`);
      } else {
        stats.errors++;
        process.stdout.write(`${pos} ✗ ${entry.fileName} ERROR: ${result.reason}\n`);
      }

      // 3. Free local copy
      if (!args.dryRun) freeLocalCopy(entry.absolutePath);

      // Progress line every 25 completions
      const done = stats.indexed + stats.skipped + stats.errors;
      if (done % 25 === 0) {
        const elapsed = (Date.now() - stats.startTime) / 1000;
        const rate = stats.indexed / Math.max(1, elapsed);
        const eta = rate > 0 ? ((total - done) / rate / 3600).toFixed(1) : "?";
        process.stdout.write(
          `\n── ${done}/${total} | ✓${stats.indexed} ~${stats.skipped} ✗${stats.errors} ` +
          `| ${rate.toFixed(2)} files/s | eta≈${eta}h ──\n\n`
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(args.concurrency, total) }, (_, id) => worker(id + 1))
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  config({ path: "../../.env" });
  const args = parseArgs(process.argv.slice(2));

  const env = getEnv();
  if (!env.databaseUrl) throw new Error("DATABASE_URL missing");
  if (!fs.existsSync(args.corpus)) throw new Error(`Corpus not found: ${args.corpus}`);

  const db = initShardDb(env.databaseUrl);
  const corpusParent = path.dirname(args.corpus);

  console.log(`[stream] corpus:      ${args.corpus}`);
  console.log(`[stream] project-id:  ${args.projectId}`);
  console.log(`[stream] concurrency: ${args.concurrency}`);
  if (args.shard) console.log(`[stream] shard:       ${args.shard.k}/${args.shard.n}`);
  if (args.limit) console.log(`[stream] limit:       ${args.limit}`);
  if (args.dryRun) console.log("[stream] DRY RUN");

  console.log("[stream] walking corpus...");
  const allFiles = walkCorpus(args.corpus, corpusParent, args);
  console.log(`[stream] ${allFiles.length} text-eligible files in scope`);

  console.log("[stream] checking already-indexed...");
  const alreadyIndexed = await loadIndexedIds(env.databaseUrl, args.projectId);
  const targets = allFiles.filter((f) => !alreadyIndexed.has(`local:${f.relativePath}`));
  console.log(`[stream] ${targets.length} to index | ${alreadyIndexed.size} already done\n`);

  if (targets.length === 0) { console.log("[stream] Nothing to do."); process.exit(0); }

  const stats: Stats = { indexed: 0, skipped: 0, errors: 0, startTime: Date.now() };
  await runWorkerPool(targets, db, args, stats);

  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  console.log("\n========== STREAM INDEX SUMMARY ==========");
  console.log(JSON.stringify({
    projectId: args.projectId,
    shard: args.shard ?? "all",
    concurrency: args.concurrency,
    totalTargets: targets.length,
    indexed: stats.indexed,
    skipped: stats.skipped,
    errors: stats.errors,
    elapsedSeconds: Number(elapsed),
  }, null, 2));
  console.log("==========================================");
  process.exit(stats.errors > 0 ? 1 : 0);
}

main().catch((err) => { console.error("[stream] fatal:", err); process.exit(1); });
