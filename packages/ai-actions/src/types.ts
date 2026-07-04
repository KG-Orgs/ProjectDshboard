// ============================================================
// Agent action tool names
// ============================================================

export type AgentActionTool =
  | "add_pdf_markup"
  | "update_pdf_markup"
  | "delete_pdf_markup"
  | "edit_excel_cells"
  | "create_excel_file"
  | "create_pdf_file";

// ============================================================
// Per-tool parameter shapes
// ============================================================

export interface PdfMarkupParams {
  [key: string]: unknown;
  pageNumber?: number;
  /** Phase 1: only "comment" is AI-proposable; other types require coordinates */
  type?: "comment" | "highlight" | "rectangle" | "stamp";
  comment?: string;
  category?: string;
  assignedTo?: string;
  status?: string;
  /** Required for update_pdf_markup / delete_pdf_markup */
  markupId?: string;
}

export interface ExcelCellEdit {
  [key: string]: unknown;
  /** A1 notation, e.g. "B3", "AA12" */
  cell: string;
  value: string | number;
}

export interface ExcelEditParams {
  [key: string]: unknown;
  sheetName: string;
  edits: ExcelCellEdit[];
}

export interface CreateExcelSheet {
  [key: string]: unknown;
  name: string;
  rows: Array<Record<string, string | number>>;
}

export interface CreateExcelParams {
  [key: string]: unknown;
  fileName: string;
  sheets: CreateExcelSheet[];
}

export interface CreatePdfParams {
  [key: string]: unknown;
  fileName: string;
  title?: string;
  /** Plain-text body content for simple generated PDFs */
  body: string;
}

// ============================================================
// Core AgentAction type
// ============================================================

export interface AgentAction {
  /** Unique ID generated at parse time (nanoid-style UUID) */
  id: string;
  tool: AgentActionTool;
  /** ID of the file the action targets */
  fileId: string;
  params: PdfMarkupParams | ExcelEditParams | CreateExcelParams | CreatePdfParams;
  /** Human-readable description shown in the confirmation chip */
  description: string;
}

// ============================================================
// Parser output
// ============================================================

export interface ExtractActionsResult {
  /** LLM response text with all agent-action blocks removed */
  text: string;
  /** Parsed, validated actions (capped at 1 per response) */
  actions: AgentAction[];
}
