/**
 * Tier 2 local indexing helpers — hydration detection and file eligibility.
 * Shared by tier2-index script and unit tests.
 */

import fs from "node:fs";
import path from "node:path";

export const TEXT_EXTENSIONS = new Set([
  "pdf", "docx", "doc", "xlsx", "xls", "xlsm", "csv", "txt", "log",
  "pptx", "ppt", "eml", "msg", "xml", "md", "rtf",
]);
export const ARCHIVE_EXTENSIONS = new Set(["zip", "7z", "rar", "tar", "gz"]);
export const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "avi", "mkv", "wmv", "m4v"]);
export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "heic", "gif", "bmp", "tif", "tiff", "webp"]);
export const MAX_TEXT_PDF_BYTES = 100 * 1024 * 1024;

export type ContentSkipReason =
  | "placeholder"
  | "archive"
  | "video"
  | "image"
  | "oversize_pdf"
  | "non_text";

export interface FileStatInfo {
  absolutePath: string;
  fileName: string;
  ext: string;
  size: number;
  mtime: Date;
  isPlaceholder: boolean;
}

export function extensionOf(fileName: string): string {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
}

/** OneDrive placeholder: logical size > 0 but allocated blocks * 512 < size. */
export function isHydratedFromStat(size: number, blocks: number): boolean {
  if (size <= 0) return false;
  return blocks * 512 >= size;
}

export function isFileHydrated(absolutePath: string): boolean {
  const stat = fs.lstatSync(absolutePath);
  return isHydratedFromStat(Number(stat.size), Number(stat.blocks));
}

export function classifyContentSkip(file: FileStatInfo): ContentSkipReason | null {
  if (file.isPlaceholder) return "placeholder";
  if (ARCHIVE_EXTENSIONS.has(file.ext)) return "archive";
  if (VIDEO_EXTENSIONS.has(file.ext)) return "video";
  if (IMAGE_EXTENSIONS.has(file.ext)) return "image";
  if (file.ext === "pdf" && file.size > MAX_TEXT_PDF_BYTES) return "oversize_pdf";
  if (!TEXT_EXTENSIONS.has(file.ext)) return "non_text";
  return null;
}

export function statFile(absolutePath: string): FileStatInfo | null {
  try {
    const stat = fs.lstatSync(absolutePath);
    const size = Number(stat.size);
    const blockBytes = Number(stat.blocks) * 512;
    const fileName = path.basename(absolutePath);
    return {
      absolutePath,
      fileName,
      ext: extensionOf(fileName),
      size,
      mtime: stat.mtime,
      isPlaceholder: size > 0 && blockBytes < size,
    };
  } catch {
    return null;
  }
}

export interface Tier2Candidate {
  absolutePath: string;
  relativePath: string;
  fileName: string;
  ext: string;
  size: number;
  skipReason: ContentSkipReason | null;
}

/**
 * Walk a directory tree (lstat only) and return tier-2 candidates with skip reasons.
 */
export function discoverTier2Candidates(
  dirRoot: string,
  corpusParent: string,
  limit?: number
): Tier2Candidate[] {
  const out: Tier2Candidate[] = [];
  const stack: string[] = [dirRoot];

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
      if (name.startsWith("._") || name === ".DS_Store") continue;
      const full = path.join(dir, name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;

      const info = statFile(full);
      if (!info) continue;

      out.push({
        absolutePath: full,
        relativePath: path.relative(corpusParent, full),
        fileName: info.fileName,
        ext: info.ext,
        size: info.size,
        skipReason: classifyContentSkip(info),
      });

      if (limit && out.length >= limit) return out;
    }
  }

  return out;
}

export function filterIndexableCandidates(candidates: Tier2Candidate[]): Tier2Candidate[] {
  return candidates.filter((c) => c.skipReason === null);
}

/** Prefer QWP/SWP/CWP filenames when selecting a limited indexing batch. */
export function prioritizeTier2Candidates(candidates: Tier2Candidate[]): Tier2Candidate[] {
  const rank = (fileName: string): number => {
    const upper = fileName.toUpperCase();
    if (/\bQWP[\s\-]*0*5\b/.test(upper)) return 0;
    if (/\bQWP\b/.test(upper)) return 1;
    if (/\bSWP\b/.test(upper)) return 2;
    if (/\bCWP\b/.test(upper)) return 3;
    return 10;
  };

  return [...candidates].sort(
    (left, right) => rank(left.fileName) - rank(right.fileName) || left.fileName.localeCompare(right.fileName)
  );
}

export function tagsWithoutContentSkip(tags: string[] | null | undefined): string[] {
  return (tags ?? []).filter((tag) => !tag.startsWith("content-skipped:"));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Read file bytes to trigger OneDrive / File Provider hydration. */
export async function hydrateFileByRead(
  absolutePath: string,
  options?: { timeoutMs?: number; pollMs?: number }
): Promise<{ ok: boolean; reason?: string }> {
  const timeoutMs = options?.timeoutMs ?? 30 * 60 * 1000;
  const pollMs = options?.pollMs ?? 1000;

  if (isFileHydrated(absolutePath)) {
    return { ok: true };
  }

  const started = Date.now();

  try {
    await new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(absolutePath, { highWaterMark: 1024 * 1024 });
      let settled = false;

      const finish = (err?: Error) => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };

      stream.on("data", () => {
        if (isFileHydrated(absolutePath)) {
          stream.destroy();
          finish();
        } else if (Date.now() - started > timeoutMs) {
          stream.destroy();
          finish(new Error("hydration read timeout"));
        }
      });
      stream.on("end", () => finish());
      stream.on("close", () => finish());
      stream.on("error", (err) => finish(err instanceof Error ? err : new Error(String(err))));
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isFileHydrated(absolutePath)) {
      return { ok: false, reason: message };
    }
  }

  while (Date.now() - started < timeoutMs) {
    if (isFileHydrated(absolutePath)) return { ok: true };
    await sleep(pollMs);
  }

  return isFileHydrated(absolutePath)
    ? { ok: true }
    : { ok: false, reason: "hydration timeout" };
}

/** Prefer submittals / RFIs / QWP paths when hydrating large backlogs. */
export function prioritizeHydrationCandidates(candidates: Tier2Candidate[]): Tier2Candidate[] {
  const folderRank = (relativePath: string): number => {
    if (relativePath.includes("/05 - SUBMITTALS/")) return 0;
    if (relativePath.includes("/24 - RFI")) return 1;
    if (relativePath.includes("/06 - CORRESPONDENCE/")) return 2;
    if (relativePath.includes("/02 - DESIGN/")) return 3;
    if (relativePath.includes("/04 - PLANS & SPECS/")) return 4;
    return 10;
  };

  return [...candidates].sort(
    (left, right) =>
      folderRank(left.relativePath) - folderRank(right.relativePath) ||
      left.relativePath.localeCompare(right.relativePath)
  );
}
