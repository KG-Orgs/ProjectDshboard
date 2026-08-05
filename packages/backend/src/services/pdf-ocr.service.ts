/**
 * PDF OCR Service
 *
 * Converts scanned PDF pages to images using pdftoppm (poppler-utils),
 * then extracts text with tesseract.js (WASM OCR engine).
 *
 * Requirements:
 *   - System: poppler-utils (provides pdftoppm)
 *             Alpine: apk add poppler-utils
 *             Debian: apt-get install poppler-utils
 *   - npm:    tesseract.js (already in dependencies)
 *
 * Gated by env var INDEXING_OCR_ENABLED=true (default: false).
 */

import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { logger } from "../lib/logger.js";

const execFileAsync = promisify(execFile);

/** Render up to this many pages per scanned PDF (prevents runaway OCR). */
const MAX_OCR_PAGES = 20;

/** Resolution for rendering PDF pages to PNG before OCR. */
const OCR_DPI = 200;

/** Cached availability check for pdftoppm. */
let pdftoppmOk: boolean | null = null;
/** Resolved pdftoppm command (plain name or full path). */
let pdftoppmCmd = "pdftoppm";

async function isPdftoppmAvailable(): Promise<boolean> {
  if (pdftoppmOk !== null) return pdftoppmOk;
  // Allow an explicit path override for environments (e.g. Windows) where the
  // binary is installed but not on PATH.
  const envPath = process.env.PDFTOPPM_PATH;
  if (envPath) pdftoppmCmd = envPath;
  try {
    await execFileAsync(pdftoppmCmd, ["-v"]).catch((e: NodeJS.ErrnoException) => {
      // pdftoppm writes to stderr and exits non-zero on -v; that's OK.
      if (e.code === "ENOENT") throw e;
    });
    pdftoppmOk = true;
  } catch {
    pdftoppmOk = false;
    logger.warn("pdf-ocr.pdftoppm.not-found", {
      hint: "Install poppler-utils (Alpine: apk add poppler-utils) or set PDFTOPPM_PATH",
    });
  }
  return pdftoppmOk;
}

/**
 * OCR a PDF file.
 *
 * Returns `{ text, pageTexts }` where `text` is all pages joined by double
 * newline.  Returns empty strings if OCR is unavailable or the PDF yields no
 * recognisable text.
 */
export async function ocrPdfPages(
  pdfPath: string
): Promise<{ text: string; pageTexts: string[] }> {
  if (!(await isPdftoppmAvailable())) {
    return { text: "", pageTexts: [] };
  }

  const tmpDir = await mkdtemp(path.join(tmpdir(), "pdf-ocr-"));
  try {
    const pagePrefix = path.join(tmpDir, "pg");

    // Convert PDF pages to PNG images (-l caps pages, -r sets DPI).
    await execFileAsync(pdftoppmCmd, [
      "-png",
      "-r", String(OCR_DPI),
      "-l", String(MAX_OCR_PAGES),
      pdfPath,
      pagePrefix,
    ]);

    const pngFiles = (await readdir(tmpDir))
      .filter((f) => f.endsWith(".png"))
      .sort()
      .map((f) => path.join(tmpDir, f));

    if (pngFiles.length === 0) {
      return { text: "", pageTexts: [] };
    }

    // Lazy-import tesseract.js so the WASM engine is only loaded when OCR is
    // actually needed — saves startup time when OCR is disabled.
    const { createWorker } = await import("tesseract.js");

    // If TESSERACT_LANG_PATH is set (e.g. in Docker), use pre-downloaded
    // traineddata instead of fetching from CDN at runtime.
    const langPath = process.env.TESSERACT_LANG_PATH;
    const worker = await createWorker("eng", undefined, {
      logger: () => {},
      ...(langPath ? { langPath } : {}),
    });

    const pageTexts: string[] = [];
    for (const pngPath of pngFiles) {
      try {
        const { data } = await worker.recognize(pngPath);
        pageTexts.push((data.text ?? "").trim());
      } catch (err) {
        logger.warn("pdf-ocr.page.failed", {
          pngPath,
          error: err instanceof Error ? err.message : String(err),
        });
        pageTexts.push("");
      }
    }

    await worker.terminate();

    const text = pageTexts.filter((t) => t.length > 0).join("\n\n");
    logger.info("pdf-ocr.complete", {
      pdfPath: path.basename(pdfPath),
      pages: pngFiles.length,
      chars: text.length,
    });
    return { text, pageTexts };
  } catch (err) {
    logger.warn("pdf-ocr.failed", {
      pdfPath: path.basename(pdfPath),
      error: err instanceof Error ? err.message : String(err),
    });
    return { text: "", pageTexts: [] };
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
