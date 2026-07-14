import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOCAL_ITEM_PREFIX = "local:";

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export function isLocalCorpusItemId(onedriveItemId?: string | null): boolean {
  return typeof onedriveItemId === "string" && onedriveItemId.startsWith(LOCAL_ITEM_PREFIX);
}

export function resolveLocalCorpusAbsolutePath(input: {
  onedriveItemId?: string | null;
  filePath?: string;
  deepLinkUrl?: string | null;
  corpusParent?: string;
}): string | null {
  if (input.deepLinkUrl?.startsWith("file://")) {
    try {
      const candidate = fileURLToPath(input.deepLinkUrl);
      // Only use the deepLinkUrl path if the file actually exists there.
      // This allows graceful fallback when the OneDrive folder has moved to a
      // different local sync path (different account, machine, or user).
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Fall through to path-based resolution.
    }
  }

  const corpusParent = input.corpusParent?.trim();
  if (!corpusParent) {
    return null;
  }

  if (isLocalCorpusItemId(input.onedriveItemId)) {
    const relative = input.onedriveItemId!.slice(LOCAL_ITEM_PREFIX.length);
    return path.join(corpusParent, relative);
  }

  if (input.filePath) {
    return path.join(corpusParent, input.filePath);
  }

  return null;
}

export function guessMimeType(fileName: string, fallback?: string): string {
  const ext = path.extname(fileName).replace(/^\./, "").toLowerCase();
  return MIME_BY_EXT[ext] ?? fallback ?? "application/octet-stream";
}

export function readLocalCorpusFile(absolutePath: string): Buffer {
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`local_corpus_file_missing:${absolutePath}`);
  }

  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    throw new Error(`local_corpus_not_a_file:${absolutePath}`);
  }

  return fs.readFileSync(absolutePath);
}
