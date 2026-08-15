/**
 * PDF Page Renderer — Step 4 of the visual evidence fallback.
 *
 * Renders specific pages of a PDF to PNG images for a vision model. Distinct
 * from `pdf-ocr.service.ts`, which renders whole documents at OCR resolution and
 * throws the images away after reading text off them: here the image *is* the
 * evidence, so it is rendered at a higher DPI, restricted to the pages we chose,
 * and returned as base64 rather than OCR'd.
 *
 * Shares the pdftoppm dependency (poppler-utils, `PDFTOPPM_PATH` override on
 * Windows).
 */
import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { getEnv } from "../config/env";
import { logger } from "../lib/logger";

const execFileAsync = promisify(execFile);

/** Cached availability check for pdftoppm. */
let pdftoppmOk: boolean | null = null;
let pdftoppmCmd = "pdftoppm";

/**
 * Above this size a page image costs more in tokens than it adds in legibility
 * for most providers. Pages over the limit are re-rendered one DPI step down.
 */
const MAX_PAGE_IMAGE_BYTES = 4 * 1024 * 1024;

export interface RenderedPage {
  page: number;
  /** PNG bytes, base64-encoded, ready for an image content block. */
  base64: string;
  mediaType: "image/png";
  dpi: number;
  bytes: number;
}

/** Exposed for tests so a suite can force the "renderer unavailable" branch. */
export function resetPdftoppmAvailabilityCache(): void {
  pdftoppmOk = null;
  pdftoppmCmd = "pdftoppm";
}

async function isPdftoppmAvailable(): Promise<boolean> {
  if (pdftoppmOk !== null) return pdftoppmOk;
  const envPath = process.env.PDFTOPPM_PATH;
  if (envPath) pdftoppmCmd = envPath;
  try {
    await execFileAsync(pdftoppmCmd, ["-v"]).catch((error: NodeJS.ErrnoException) => {
      // pdftoppm writes its version to stderr and exits non-zero; only a missing
      // binary is fatal.
      if (error.code === "ENOENT") throw error;
    });
    pdftoppmOk = true;
  } catch {
    pdftoppmOk = false;
    logger.warn("pdf_page_render.pdftoppm.not_found", {
      hint: "Install poppler-utils (Alpine: apk add poppler-utils) or set PDFTOPPM_PATH",
    });
  }
  return pdftoppmOk;
}

/** Render one page to PNG at `dpi`, returning its base64 payload. */
async function renderSinglePage(
  pdfPath: string,
  page: number,
  dpi: number,
  tmpDir: string
): Promise<RenderedPage | null> {
  const prefix = path.join(tmpDir, `p${page}`);
  await execFileAsync(pdftoppmCmd, [
    "-png",
    "-r",
    String(dpi),
    "-f",
    String(page),
    "-l",
    String(page),
    pdfPath,
    prefix,
  ]);

  const produced = (await readdir(tmpDir)).filter(
    (name) => name.startsWith(`p${page}-`) && name.endsWith(".png")
  );
  if (produced.length === 0) return null;

  const buffer = await readFile(path.join(tmpDir, produced[0]));
  return {
    page,
    base64: buffer.toString("base64"),
    mediaType: "image/png",
    dpi,
    bytes: buffer.length,
  };
}

/**
 * Render the requested pages of a PDF.
 *
 * `source` is either a path to a PDF on disk or its bytes (the coordinator may
 * already hold the buffer after a local-corpus read). Pages that fail to render
 * are skipped rather than failing the batch — a partial set of images is still
 * useful evidence. Returns an empty array when the renderer is unavailable, so
 * callers can report `visual_fallback.failed` and refuse honestly instead of
 * guessing.
 */
export async function renderPdfPages(
  source: { pdfPath: string } | { pdfBytes: Buffer },
  pages: number[],
  options?: { dpi?: number }
): Promise<RenderedPage[]> {
  const uniquePages = Array.from(new Set(pages.filter((page) => Number.isInteger(page) && page >= 1)));
  if (uniquePages.length === 0) return [];

  if (!(await isPdftoppmAvailable())) return [];

  const env = getEnv();
  const dpi = options?.dpi ?? env.chatVisualFallbackDpi;

  const tmpDir = await mkdtemp(path.join(tmpdir(), "pdf-page-render-"));
  try {
    let pdfPath: string;
    if ("pdfPath" in source) {
      pdfPath = source.pdfPath;
    } else {
      pdfPath = path.join(tmpDir, "source.pdf");
      await writeFile(pdfPath, source.pdfBytes);
    }

    const rendered: RenderedPage[] = [];
    for (const page of uniquePages) {
      try {
        let image = await renderSinglePage(pdfPath, page, dpi, tmpDir);
        if (image && image.bytes > MAX_PAGE_IMAGE_BYTES && dpi > 120) {
          // One step down rather than a loop: two renders per page is the most
          // this stage should ever cost.
          const smaller = await renderSinglePage(pdfPath, page, 120, tmpDir);
          if (smaller) image = smaller;
        }
        if (image) rendered.push(image);
      } catch (error) {
        logger.warn("pdf_page_render.page_failed", {
          page,
          dpi,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("pdf_page_render.complete", {
      requested: uniquePages,
      rendered: rendered.map((image) => image.page),
      dpi,
      totalBytes: rendered.reduce((sum, image) => sum + image.bytes, 0),
    });

    return rendered;
  } catch (error) {
    logger.warn("pdf_page_render.failed", {
      pages: uniquePages,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Total page count of a PDF, or null when it cannot be determined. */
export async function getPdfPageCount(
  source: { pdfPath: string } | { pdfBytes: Buffer }
): Promise<number | null> {
  // `pdfinfo` ships with poppler alongside pdftoppm, but resolving a second
  // binary path doubles the configuration surface. The page count is only used
  // to bound "short document → inspect all pages", and a PDF's page tree is
  // cheap to count from the bytes.
  try {
    const bytes =
      "pdfBytes" in source ? source.pdfBytes : await readFile(source.pdfPath);
    const text = bytes.toString("latin1");
    const counts = [...text.matchAll(/\/Type\s*\/Page[^s]/g)].length;
    return counts > 0 ? counts : null;
  } catch {
    return null;
  }
}
