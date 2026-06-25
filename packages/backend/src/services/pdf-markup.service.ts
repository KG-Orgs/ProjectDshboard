import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDbIfInitialized, pdfMarkups } from "../db";
import { toUuid } from "./service-types";

export interface MarkupMeasurement {
  kind?: "calibration" | "length" | "area" | "count";
  value?: number;
  unit?: string;
  calibration?: {
    pixels?: number;
    realValue?: number;
    unit?: string;
  };
}

export interface PdfMarkupRecord {
  id: string;
  projectId: string;
  fileId: string;
  pageNumber: number;
  type: string;
  coordinates: Record<string, unknown>;
  measurement?: MarkupMeasurement;
  category: string;
  status: string;
  comment?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePdfMarkupInput {
  pageNumber: number;
  type: string;
  coordinates?: Record<string, unknown>;
  measurement?: MarkupMeasurement;
  category?: string;
  status?: string;
  comment?: string;
  assignedTo?: string;
}

export interface UpdatePdfMarkupInput {
  pageNumber?: number;
  type?: string;
  coordinates?: Record<string, unknown>;
  measurement?: MarkupMeasurement;
  category?: string;
  status?: string;
  comment?: string;
  assignedTo?: string;
}

const markupsFallback = new Map<string, PdfMarkupRecord[]>();

function getFallbackKey(projectId: string, fileId: string): string {
  return `${projectId}:${fileId}`;
}

function normalizeMarkup(record: {
  id: string;
  projectId: string;
  fileId: string;
  pageNumber: number;
  type: string;
  coordinates: unknown;
  measurement: unknown;
  category: string;
  status: string;
  comment: string | null;
  assignedTo: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}): PdfMarkupRecord {
  return {
    id: record.id,
    projectId: record.projectId,
    fileId: record.fileId,
    pageNumber: record.pageNumber,
    type: record.type,
    coordinates: (record.coordinates ?? {}) as Record<string, unknown>,
    measurement: record.measurement as MarkupMeasurement | undefined,
    category: record.category,
    status: record.status,
    comment: record.comment ?? undefined,
    assignedTo: record.assignedTo ?? undefined,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const pdfMarkupService = {
  async list(projectId: string, fileId: string, pageNumber?: number): Promise<PdfMarkupRecord[]> {
    const db = getDbIfInitialized();

    if (db) {
      const whereClause = pageNumber
        ? and(
            eq(pdfMarkups.projectId, toUuid(projectId)),
            eq(pdfMarkups.fileId, toUuid(fileId)),
            eq(pdfMarkups.pageNumber, pageNumber)
          )
        : and(eq(pdfMarkups.projectId, toUuid(projectId)), eq(pdfMarkups.fileId, toUuid(fileId)));

      const records = await db
        .select()
        .from(pdfMarkups)
        .where(whereClause)
        .orderBy(asc(pdfMarkups.pageNumber), desc(pdfMarkups.updatedAt));

      return records.map(normalizeMarkup);
    }

    const key = getFallbackKey(projectId, fileId);
    const records = markupsFallback.get(key) ?? [];
    const filtered = pageNumber ? records.filter((item) => item.pageNumber === pageNumber) : records;
    return [...filtered].sort((a, b) => {
      if (a.pageNumber === b.pageNumber) {
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
      return a.pageNumber - b.pageNumber;
    });
  },

  async create(projectId: string, fileId: string, createdBy: string, input: CreatePdfMarkupInput): Promise<PdfMarkupRecord> {
    const now = new Date();
    const db = getDbIfInitialized();
    const normalizedInput: PdfMarkupRecord = {
      id: toUuid(randomUUID()),
      projectId: toUuid(projectId),
      fileId: toUuid(fileId),
      pageNumber: Math.max(1, Math.floor(input.pageNumber || 1)),
      type: input.type,
      coordinates: input.coordinates ?? {},
      measurement: input.measurement,
      category: input.category ?? "General Comment",
      status: input.status ?? "Open",
      comment: input.comment,
      assignedTo: input.assignedTo,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      const [record] = await db
        .insert(pdfMarkups)
        .values({
          id: normalizedInput.id,
          projectId: normalizedInput.projectId,
          fileId: normalizedInput.fileId,
          pageNumber: normalizedInput.pageNumber,
          type: normalizedInput.type,
          coordinates: normalizedInput.coordinates,
          measurement: normalizedInput.measurement,
          category: normalizedInput.category,
          status: normalizedInput.status,
          comment: normalizedInput.comment,
          assignedTo: normalizedInput.assignedTo,
          createdBy: normalizedInput.createdBy,
          createdAt: normalizedInput.createdAt,
          updatedAt: normalizedInput.updatedAt,
        })
        .returning();

      return normalizeMarkup(record);
    }

    const key = getFallbackKey(projectId, fileId);
    const existing = markupsFallback.get(key) ?? [];
    const next = [...existing, normalizedInput];
    markupsFallback.set(key, next);
    return normalizedInput;
  },

  async update(projectId: string, fileId: string, markupId: string, input: UpdatePdfMarkupInput): Promise<PdfMarkupRecord | null> {
    const db = getDbIfInitialized();
    const updateValues = {
      ...(input.pageNumber ? { pageNumber: Math.max(1, Math.floor(input.pageNumber)) } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.coordinates ? { coordinates: input.coordinates } : {}),
      ...(input.measurement ? { measurement: input.measurement } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
      ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
      updatedAt: new Date(),
    };

    if (db) {
      const [updated] = await db
        .update(pdfMarkups)
        .set(updateValues)
        .where(
          and(
            eq(pdfMarkups.id, toUuid(markupId)),
            eq(pdfMarkups.projectId, toUuid(projectId)),
            eq(pdfMarkups.fileId, toUuid(fileId))
          )
        )
        .returning();

      return updated ? normalizeMarkup(updated) : null;
    }

    const key = getFallbackKey(projectId, fileId);
    const current = markupsFallback.get(key) ?? [];
    const index = current.findIndex((item) => item.id === markupId);
    if (index === -1) {
      return null;
    }

    const target = current[index];
    const updated: PdfMarkupRecord = {
      ...target,
      ...(input.pageNumber ? { pageNumber: Math.max(1, Math.floor(input.pageNumber)) } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.coordinates ? { coordinates: input.coordinates } : {}),
      ...(input.measurement ? { measurement: input.measurement } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
      ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
      updatedAt: new Date(),
    };

    const next = [...current];
    next[index] = updated;
    markupsFallback.set(key, next);
    return updated;
  },

  async remove(projectId: string, fileId: string, markupId: string): Promise<boolean> {
    const db = getDbIfInitialized();

    if (db) {
      const deleted = await db
        .delete(pdfMarkups)
        .where(
          and(
            eq(pdfMarkups.id, toUuid(markupId)),
            eq(pdfMarkups.projectId, toUuid(projectId)),
            eq(pdfMarkups.fileId, toUuid(fileId))
          )
        )
        .returning({ id: pdfMarkups.id });

      return deleted.length > 0;
    }

    const key = getFallbackKey(projectId, fileId);
    const current = markupsFallback.get(key) ?? [];
    const next = current.filter((item) => item.id !== markupId);
    markupsFallback.set(key, next);
    return next.length !== current.length;
  },

  resetForTests(): void {
    markupsFallback.clear();
  },
};
