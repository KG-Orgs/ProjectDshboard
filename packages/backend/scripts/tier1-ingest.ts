/**
 * Hydration-aware Tier 1 ingestion (MVP Slice 1, 1a/1b/1e).
 *
 * Walks a local corpus directory recursively and upserts a `file_records` row
 * for EVERY file using path + stat ONLY — it NEVER opens file contents, so
 * OneDrive Files-On-Demand placeholders are not downloaded. From the name/path
 * it derives metadata (discipline / station / doc-type / revision / status —
 * §4a), captures a `file://` deep link (1e), and populates `document_identifiers`
 * (1b). Files whose content is not extractable here (placeholders, archives,
 * videos, oversized PDFs, non-text types) are flagged content-skipped but remain
 * fully discoverable by name/path. The script is idempotent (re-runnable upsert).
 *
 * Usage (from packages/backend):
 *   pnpm tier1:ingest                       # default test corpus
 *   pnpm tier1:ingest -- --corpus "<path>"  # custom corpus
 *   pnpm tier1:ingest -- --limit 500        # ingest first N files (smoke test)
 */

import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { and, eq, sql } from "drizzle-orm";
import { initializeDb } from "../src/db";
import { getEnv } from "../src/config/env";
import {
  organizations,
  projects,
  fileRecords,
  documentIdentifiers,
} from "../src/db/schema";
import {
  extractIdentifiers,
  extractPathMetadata,
} from "../src/services/identifier-extraction.utils";

const DEFAULT_CORPUS =
  "/Users/kyle.weixu/Library/CloudStorage/OneDrive-Personal/MLJ-017 Package 6 - General (TEST CLONE)";

const TEXT_EXTENSIONS = new Set([
  "pdf", "docx", "doc", "xlsx", "xls", "xlsm", "csv", "txt", "log",
  "pptx", "ppt", "eml", "msg", "xml", "md", "rtf",
]);
const ARCHIVE_EXTENSIONS = new Set(["zip", "7z", "rar", "tar", "gz"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "avi", "mkv", "wmv", "m4v"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "heic", "gif", "bmp", "tif", "tiff", "webp"]);
const MAX_TEXT_PDF_BYTES = 100 * 1024 * 1024; // PDFs >100 MB are name/path only.

type SkipReason =
  | "placeholder"
  | "archive"
  | "video"
  | "image"
  | "oversize_pdf"
  | "non_text"
  | null;

interface WalkedFile {
  absolutePath: string;
  /** Path relative to the corpus parent (includes the corpus root folder name). */
  relativePath: string;
  fileName: string;
  ext: string;
  size: number;
  mtime: Date;
  isPlaceholder: boolean;
}

function parseArgs(argv: string[]): { corpus: string; limit?: number } {
  let corpus = DEFAULT_CORPUS;
  let limit: number | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--corpus" && argv[i + 1]) {
      corpus = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--limit" && argv[i + 1]) {
      const parsed = Number.parseInt(argv[i + 1], 10);
      if (Number.isFinite(parsed) && parsed > 0) limit = parsed;
      i += 1;
    }
  }
  return { corpus, limit };
}

function extensionOf(fileName: string): string {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
}

/**
 * Recursively enumerate files using lstat ONLY (never reads bytes). OneDrive
 * online-only placeholders are detected by comparing allocated blocks to the
 * logical size — a fully dataless file allocates ~0 blocks. Reading stat does
 * not hydrate the file.
 */
function walk(corpusRoot: string, limit?: number): WalkedFile[] {
  const corpusParent = path.dirname(corpusRoot);
  const out: WalkedFile[] = [];
  const stack: string[] = [corpusRoot];

  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const name = entry.name;
      // Skip AppleDouble + Finder metadata; never content.
      if (name.startsWith("._") || name === ".DS_Store") continue;
      const full = path.join(dir, name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;

      let stat: fs.Stats;
      try {
        stat = fs.lstatSync(full); // metadata only — no hydration.
      } catch {
        continue;
      }

      const size = Number(stat.size);
      const blockBytes = Number(stat.blocks) * 512;
      const isPlaceholder = size > 0 && blockBytes < size;

      out.push({
        absolutePath: full,
        relativePath: path.relative(corpusParent, full),
        fileName: name,
        ext: extensionOf(name),
        size,
        mtime: stat.mtime,
        isPlaceholder,
      });

      if (limit && out.length >= limit) return out;
    }
  }
  return out;
}

function classifyContentSkip(file: WalkedFile): SkipReason {
  if (file.isPlaceholder) return "placeholder";
  if (ARCHIVE_EXTENSIONS.has(file.ext)) return "archive";
  if (VIDEO_EXTENSIONS.has(file.ext)) return "video";
  if (IMAGE_EXTENSIONS.has(file.ext)) return "image";
  if (file.ext === "pdf" && file.size > MAX_TEXT_PDF_BYTES) return "oversize_pdf";
  if (!TEXT_EXTENSIONS.has(file.ext)) return "non_text";
  return null; // hydrated, in-size, text-eligible → candidate for future Tier 2.
}

async function findOrCreateOrgAndProject(
  db: Awaited<ReturnType<typeof initializeDb>>,
  projectName: string
): Promise<{ orgId: string; projectId: string }> {
  const orgName = "Test Org (Tier 1 Ingest)";
  let [org] = await db.select().from(organizations).where(eq(organizations.name, orgName)).limit(1);
  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({ id: randomUUID(), name: orgName, createdAt: new Date() })
      .returning();
  }

  let [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.orgId, org.id), eq(projects.name, projectName)))
    .limit(1);
  if (!project) {
    [project] = await db
      .insert(projects)
      .values({ id: randomUUID(), orgId: org.id, name: projectName, status: "active", createdAt: new Date() })
      .returning();
  }

  return { orgId: org.id, projectId: project.id };
}

function buildTags(meta: ReturnType<typeof extractPathMetadata>, ext: string, skip: SkipReason): string[] {
  const tags = new Set<string>();
  if (meta.docCategory) tags.add(meta.docCategory);
  if (meta.station) tags.add(`station:${meta.station}`);
  if (meta.statusCode) tags.add(`status:${meta.statusCode}`);
  if (meta.revision) tags.add(`rev:${meta.revision}`);
  if (ext) tags.add(`ext:${ext}`);
  if (skip) tags.add(`content-skipped:${skip}`);
  return Array.from(tags);
}

async function main(): Promise<void> {
  config({ path: "../../.env" });
  const { corpus, limit } = parseArgs(process.argv.slice(2));

  const env = getEnv();
  if (!env.databaseUrl) throw new Error("DATABASE_URL is missing");

  if (!fs.existsSync(corpus)) throw new Error(`Corpus not found: ${corpus}`);

  const db = await initializeDb(env.databaseUrl);
  const projectName = path.basename(corpus);
  const { projectId } = await findOrCreateOrgAndProject(db, projectName);

  console.log(`[tier1] corpus: ${corpus}`);
  console.log(`[tier1] project: ${projectName} (${projectId})`);
  console.log(`[tier1] walking (stat-only, no content reads)...`);

  const started = Date.now();
  const files = walk(corpus, limit);
  console.log(`[tier1] discovered ${files.length} files in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  const byExt = new Map<string, number>();
  const bySkipReason = new Map<string, number>();
  const byIdentifierType = new Map<string, number>();
  let contentSkippedCount = 0;
  let identifierRowCount = 0;
  let processed = 0;

  for (const file of files) {
    const meta = extractPathMetadata(file.fileName, file.relativePath);
    const skip = classifyContentSkip(file);
    const identifiers = extractIdentifiers(file.fileName, file.relativePath);
    const deepLinkUrl = pathToFileURL(file.absolutePath).href;
    const onedriveItemId = `local:${file.relativePath}`;

    byExt.set(file.ext || "(none)", (byExt.get(file.ext || "(none)") ?? 0) + 1);
    if (skip) {
      contentSkippedCount += 1;
      bySkipReason.set(skip, (bySkipReason.get(skip) ?? 0) + 1);
    }

    const extractedFields: Record<string, unknown> = {
      contractNumber: meta.contractNumber,
      docType: meta.docType,
      discipline: meta.discipline,
      station: meta.station,
      stationName: meta.stationName,
      statusCode: meta.statusCode,
      contentSkipped: Boolean(skip),
      contentSkipReason: skip ?? undefined,
      isPlaceholder: file.isPlaceholder,
      sizeBytes: file.size,
      ext: file.ext,
      identifierCount: identifiers.length,
    };

    const now = new Date();
    const baseValues = {
      projectId,
      onedriveItemId,
      fileName: file.fileName,
      filePath: file.relativePath,
      fileType: file.ext || null,
      fileSize: file.size,
      mimeType: null,
      docCategory: meta.docCategory ?? null,
      specSection: meta.specSection ?? null,
      revision: meta.revision ?? null,
      tags: buildTags(meta, file.ext, skip),
      // Bind the object directly (sql cast) so it lands as a real jsonb object;
      // drizzle's typed jsonb mapping + postgres-js otherwise double-encodes it
      // to a JSON string scalar, which would break ->> filtering and reads.
      extractedFields: sql`${extractedFields}::jsonb`,
      deepLinkUrl,
      processingMode: "metadata_only" as const,
      processingReason: skip ? `content_skipped:${skip}` : "tier1_name_path_only",
      reducedCoverage: true,
      indexStatus: "indexed" as const,
      lastSynced: file.mtime,
      lastIndexed: now,
      chunkCount: 0,
      updatedAt: now,
    };

    // Tier 1 must not clobber Tier 2 fields on re-ingest.
    const {
      chunkCount: _chunkCount,
      processingMode: _processingMode,
      processingReason: _processingReason,
      reducedCoverage: _reducedCoverage,
      lastIndexed: _lastIndexed,
      ...tier1UpdateValues
    } = baseValues;

    const [row] = await db
      .insert(fileRecords)
      .values({ id: randomUUID(), createdAt: now, ...baseValues })
      .onConflictDoUpdate({ target: fileRecords.onedriveItemId, set: tier1UpdateValues })
      .returning({ id: fileRecords.id });

    const fileId = row.id;

    // Idempotent identifier refresh: replace this file's identifier rows.
    await db.delete(documentIdentifiers).where(eq(documentIdentifiers.fileId, fileId));
    if (identifiers.length > 0) {
      await db
        .insert(documentIdentifiers)
        .values(
          identifiers.map((id) => ({
            id: randomUUID(),
            fileId,
            projectId,
            type: id.type,
            valueNormalized: id.valueNormalized,
            raw: id.raw,
            createdAt: now,
          }))
        )
        .onConflictDoNothing();
      identifierRowCount += identifiers.length;
      for (const id of identifiers) {
        byIdentifierType.set(id.type, (byIdentifierType.get(id.type) ?? 0) + 1);
      }
    }

    processed += 1;
    if (processed % 500 === 0) {
      console.log(`[tier1] ingested ${processed}/${files.length}...`);
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const sortDesc = (m: Map<string, number>) =>
    Object.fromEntries(Array.from(m.entries()).sort((a, b) => b[1] - a[1]));

  console.log("\n========== TIER 1 INGESTION SUMMARY ==========");
  console.log(JSON.stringify(
    {
      projectId,
      projectName,
      totalFilesIngested: processed,
      contentSkipped: contentSkippedCount,
      contentSkipReasons: sortDesc(bySkipReason),
      identifierRowsInserted: identifierRowCount,
      identifiersByType: sortDesc(byIdentifierType),
      countByExtension: sortDesc(byExt),
      elapsedSeconds: Number(elapsed),
    },
    null,
    2
  ));
  console.log("==============================================");

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
