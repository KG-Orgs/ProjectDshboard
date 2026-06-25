/**
 * Hydrate OneDrive placeholder files by reading bytes (triggers File Provider download).
 *
 * Usage:
 *   pnpm tier2:hydrate
 *   pnpm tier2:hydrate -- --concurrency 2
 *   pnpm tier2:hydrate -- --dry-run
 *   pnpm tier2:hydrate -- --limit 50
 */

import path from "node:path";
import { config } from "dotenv";
import {
  discoverTier2Candidates,
  hydrateFileByRead,
  prioritizeHydrationCandidates,
  sleep,
  statFile,
} from "../src/services/tier2-hydration.utils";

const DEFAULT_CORPUS =
  "/Users/kyle.weixu/Library/CloudStorage/OneDrive-Personal/MLJ-017 Package 6 - General (TEST CLONE)";

interface CliArgs {
  corpus: string;
  dir?: string;
  concurrency: number;
  dryRun: boolean;
  limit?: number;
  timeoutMinutes: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    corpus: DEFAULT_CORPUS,
    concurrency: 2,
    dryRun: false,
    timeoutMinutes: 30,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--corpus" && next) {
      args.corpus = next;
      i += 1;
    } else if (arg === "--dir" && next) {
      args.dir = next;
      i += 1;
    } else if (arg === "--concurrency" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) args.concurrency = parsed;
      i += 1;
    } else if (arg === "--limit" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) args.limit = parsed;
      i += 1;
    } else if (arg === "--timeout-minutes" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) args.timeoutMinutes = parsed;
      i += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }

  return args;
}

function isTransientHydrationError(reason?: string): boolean {
  if (!reason) return false;
  return (
    reason.includes("error -11") ||
    reason.includes("EAGAIN") ||
    reason.includes("ETIMEDOUT") ||
    reason.includes("ECONNRESET") ||
    reason.includes("resource temporarily unavailable")
  );
}

async function hydrateWithRetry(
  absolutePath: string,
  timeoutMs: number
): Promise<{ ok: boolean; reason?: string }> {
  const backoffMs = [0, 5_000, 15_000, 30_000];
  let last: { ok: boolean; reason?: string } = { ok: false, reason: "unknown" };

  for (const waitMs of backoffMs) {
    if (waitMs > 0) await sleep(waitMs);
    last = await hydrateFileByRead(absolutePath, { timeoutMs });
    if (last.ok || !isTransientHydrationError(last.reason)) return last;
  }

  return last;
}

async function runWorkerPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let nextIndex = 0;

  async function runOne(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      await worker(items[index]!, index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne());
  await Promise.all(workers);
}

async function main(): Promise<void> {
  config({ path: "../../.env" });
  const args = parseArgs(process.argv.slice(2));
  const dirRoot = args.dir ?? args.corpus;
  const corpusParent = path.dirname(args.corpus);

  console.log(`[hydrate] source: ${dirRoot}`);
  console.log(`[hydrate] concurrency: ${args.concurrency}`);
  if (args.dryRun) console.log("[hydrate] DRY RUN");

  const all = discoverTier2Candidates(dirRoot, corpusParent);
  let placeholders = all.filter((c) => c.skipReason === "placeholder");
  placeholders = prioritizeHydrationCandidates(placeholders);
  if (args.limit) placeholders = placeholders.slice(0, args.limit);

  const totalBytes = placeholders.reduce((sum, c) => sum + c.size, 0);
  console.log(
    `[hydrate] ${placeholders.length} placeholder(s); logical size ${(totalBytes / 1e9).toFixed(2)} GB`
  );

  if (placeholders.length === 0) {
    console.log("[hydrate] Nothing to hydrate.");
    return;
  }

  if (args.dryRun) {
    for (const c of placeholders.slice(0, 50)) {
      console.log(`  would hydrate: ${c.relativePath} (${(c.size / 1024).toFixed(0)} KB)`);
    }
    if (placeholders.length > 50) {
      console.log(`  ... and ${placeholders.length - 50} more`);
    }
    return;
  }

  const started = Date.now();
  let hydrated = 0;
  let failed = 0;
  let skipped = 0;
  const failures: Array<{ file: string; reason: string }> = [];

  await runWorkerPool(placeholders, args.concurrency, async (candidate, index) => {
    const progress = `[${index + 1}/${placeholders.length}]`;
    const info = statFile(candidate.absolutePath);
    if (info && !info.isPlaceholder) {
      skipped += 1;
      console.log(`[hydrate] ${progress} skip (already local): ${candidate.fileName}`);
      return;
    }

    process.stdout.write(`[hydrate] ${progress} ${candidate.fileName} ... `);
    const result = await hydrateWithRetry(candidate.absolutePath, args.timeoutMinutes * 60 * 1000);

    if (result.ok) {
      hydrated += 1;
      console.log("ok");
    } else {
      failed += 1;
      const reason = result.reason ?? "unknown";
      failures.push({ file: candidate.fileName, reason });
      console.log(`FAILED (${reason})`);
    }

    if ((index + 1) % 25 === 0) {
      const elapsedMin = ((Date.now() - started) / 60000).toFixed(1);
      console.log(
        `[hydrate] progress: ${index + 1}/${placeholders.length} | ok=${hydrated} fail=${failed} skip=${skipped} | ${elapsedMin} min`
      );
    }
  });

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log("\n========== HYDRATION SUMMARY ==========");
  console.log(
    JSON.stringify(
      {
        dir: dirRoot,
        placeholders: placeholders.length,
        hydrated,
        failed,
        skipped,
        logicalGb: Number((totalBytes / 1e9).toFixed(2)),
        elapsedSeconds: Number(elapsed),
        sampleFailures: failures.slice(0, 20),
      },
      null,
      2
    )
  );
  console.log("======================================");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
