/**
 * Excel Editor Service
 *
 * Applies AI-proposed cell edits to an in-memory Excel workbook buffer
 * using SheetJS (already a backend dependency). Keeps file I/O out of
 * this service — callers are responsible for reading and writing the
 * file on disk.
 *
 * TODO (Phase 3): add createWorkbook() for AI-generated Excel files.
 * TODO (OneDrive write support): wire in onedriveService.uploadFileContent()
 *   once the OAuth scope is upgraded from Files.Read → Files.ReadWrite.
 */
import * as XLSX from "xlsx";
import type { ExcelCellEdit } from "@contractor/ai-actions";

/** Only accept standard A1-notation cell references (e.g. "B3", "AA12"). */
const CELL_REF_RE = /^[A-Z]{1,3}[1-9][0-9]{0,6}$/;

/**
 * Applies a list of cell edits to an Excel workbook buffer.
 *
 * @param fileBuffer - Raw .xlsx file bytes (not mutated).
 * @param sheetName  - Name of the worksheet to edit.
 * @param edits      - Cell address / value pairs in A1 notation.
 * @returns Modified workbook as a Buffer.
 * @throws Error if the named sheet does not exist.
 */
export function applyExcelEdits(
  fileBuffer: Buffer,
  sheetName: string,
  edits: ExcelCellEdit[]
): Buffer {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    const available = workbook.SheetNames.join(", ") || "(none)";
    throw new Error(
      `Sheet "${sheetName}" not found in workbook. Available sheets: ${available}`
    );
  }

  for (const { cell, value } of edits) {
    // Security: reject any cell reference that doesn't match strict A1 notation
    if (!CELL_REF_RE.test(cell)) continue;

    sheet[cell] = {
      v: value,
      t: typeof value === "number" ? "n" : "s",
    };

    // Expand the sheet's range declaration if the new cell falls outside it
    const currentRef = sheet["!ref"] ?? "A1:A1";
    const range = XLSX.utils.decode_range(currentRef);
    const addr = XLSX.utils.decode_cell(cell);
    if (addr.r > range.e.r) range.e.r = addr.r;
    if (addr.c > range.e.c) range.e.c = addr.c;
    sheet["!ref"] = XLSX.utils.encode_range(range);
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/**
 * Returns the sheet names present in a workbook buffer.
 * Used by the API to validate sheetName before attempting edits.
 */
export function getSheetNames(fileBuffer: Buffer): string[] {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  return workbook.SheetNames;
}

export const excelEditorService = { applyExcelEdits, getSheetNames };
