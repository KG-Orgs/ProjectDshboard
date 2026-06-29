export interface MarkupExportRow {
  projectName: string;
  fileName: string;
  pageNumber: number;
  markupType: string;
  category: string;
  comment: string;
  stampLabel: string;
  status: string;
  assignedTo: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  measurementValue: string;
  measurementUnit: string;
}

export function stampLabelFromMarkup(markup: {
  type: string;
  comment?: string;
  coordinates?: Record<string, unknown>;
}): string {
  if (markup.type !== "stamp") return "";
  const fromCoords =
    typeof markup.coordinates?.stampLabel === "string" ? markup.coordinates.stampLabel : "";
  return fromCoords || markup.comment || "";
}

export function toMarkupExportRows(
  projectName: string,
  fileName: string,
  markups: Array<{
    pageNumber: number;
    type: string;
    coordinates?: Record<string, unknown>;
    category: string;
    comment?: string;
    status: string;
    assignedTo?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    measurement?: { value?: number; unit?: string };
  }>,
): MarkupExportRow[] {
  return markups.map((markup) => ({
    projectName,
    fileName,
    pageNumber: markup.pageNumber,
    markupType: markup.type,
    category: markup.category,
    comment: markup.comment ?? "",
    stampLabel: stampLabelFromMarkup(markup),
    status: markup.status,
    assignedTo: markup.assignedTo ?? "",
    createdBy: markup.createdBy,
    createdDate: markup.createdAt.toISOString(),
    updatedDate: markup.updatedAt.toISOString(),
    measurementValue:
      typeof markup.measurement?.value === "number" ? String(markup.measurement.value) : "",
    measurementUnit: markup.measurement?.unit ?? "",
  }));
}
