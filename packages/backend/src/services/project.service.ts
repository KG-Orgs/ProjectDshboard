import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  FileRecord,
  ProjectExplorerFolderResponse,
  ProjectFilesResponse,
  ProjectDetailsResponse,
  ProjectListResponse,
  UUID,
} from "@contractor/shared";
import {
  getExplorerContainingFolderPath,
  pathStartsWithSegments,
  splitExplorerFolderPath,
} from "@contractor/shared";
import {
  chunkLinks,
  documentIdentifiers,
  fileChunks,
  fileRecords,
  getDbIfInitialized,
  projectExplorerSnapshots,
  projectMembers,
  projects,
  syncRuns,
} from "../db";
import { AppError } from "../lib/errors";
import { toUuid } from "./service-types";
import {
  isOrgWideProjectAdmin,
  projectAccessService,
  type ProjectAccessContext,
} from "./project-access.service";

const projectsByOrg = new Map<string, CreateProjectResponse["project"][]>();
const filesByProject = new Map<string, FileRecord[]>();
const syncTimesByProject = new Map<string, Date>();
const IN_CLAUSE_BATCH_SIZE = 250;
const CHUNK_INSERT_BATCH_SIZE = 200;

function toBatches<T>(input: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < input.length; index += batchSize) {
    batches.push(input.slice(index, index + batchSize));
  }
  return batches;
}

const chunksByProject = new Map<string, Array<{
  id: UUID;
  projectId: UUID;
  fileId: UUID;
  onedriveItemId: string;
  fileName: string;
  chunkIndex: number;
  chunkText: string;
  sourceType: "content" | "summary" | "metadata_stub";
  pageNumber?: number;
  sectionLabel?: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
  tokenCount: number;
  embeddingModel: string;
  embedding: number[];
  createdAt: Date;
}>>();
const chunkLinksByProject = new Map<string, Array<{
  id: UUID;
  projectId: UUID;
  fileId: UUID;
  sourceChunkId: UUID;
  targetChunkId: UUID;
  relation: string;
  weight: number;
  createdAt: Date;
}>>();

interface SyncPersistenceInput {
  files: FileRecord[];
  scannedFileCount: number;
  supportedFileCount: number;
  unsupportedFileCount: number;
  status: "success" | "failed";
  errorMessage?: string;
  startedAt: Date;
  finishedAt: Date;
}

function toProjectResponseProject(record: {
  id: string;
  orgId: string;
  name: string;
  onedriveFolderId: string | null;
  onedriveDriveId?: string | null;
  onedriveConnectedByUserId?: string | null;
  status: "active" | "archived";
  createdAt: Date;
}): CreateProjectResponse["project"] {
  return {
    id: toUuid(record.id),
    orgId: toUuid(record.orgId),
    name: record.name,
    onedriveFolderId: record.onedriveFolderId ?? undefined,
    onedriveDriveId: record.onedriveDriveId ?? undefined,
    onedriveConnectedByUserId: record.onedriveConnectedByUserId
      ? toUuid(record.onedriveConnectedByUserId)
      : undefined,
    status: record.status,
    createdAt: record.createdAt,
  };
}

function toFileRecord(record: {
  id: string;
  projectId: string;
  onedriveItemId: string | null;
  fileName: string;
  filePath: string;
  fileType: string | null;
  fileSize: number | null;
  mimeType: string | null;
  summary: string | null;
  keyTopics: string[] | null;
  tags: string[] | null;
  docCategory: string | null;
  specSection: string | null;
  sheetNumber: string | null;
  revision: string | null;
  processingMode: "full" | "reduced" | "metadata_only";
  processingReason: string | null;
  reducedCoverage: boolean;
  extractedContentPercent: number | null;
  normalizedTextObjectKey: string | null;
  normalizedTextChecksum: string | null;
  normalizedTextLength: number | null;
  normalizedTextStoredAt: Date | null;
  encryptionKeyVersion: number | null;
  onedriveEtag: string | null;
  versionHash: string | null;
  lastSynced: Date | null;
  indexStatus: "pending" | "processing" | "indexed" | "failed";
  lastIndexed: Date | null;
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
  extractedFields?: unknown;
  priorityScore?: number | null;
}): FileRecord {
  return {
    id: toUuid(record.id),
    projectId: toUuid(record.projectId),
    onedriveItemId: record.onedriveItemId ?? "",
    fileName: record.fileName,
    filePath: record.filePath,
    fileType: record.fileType ?? undefined,
    fileSize: record.fileSize ?? undefined,
    mimeType: record.mimeType ?? undefined,
    summary: record.summary ?? undefined,
    keyTopics: record.keyTopics ?? undefined,
    tags: record.tags ?? undefined,
    docCategory: (record.docCategory ?? undefined) as import("@contractor/shared").DocumentCategory | undefined,
    specSection: record.specSection ?? undefined,
    sheetNumber: record.sheetNumber ?? undefined,
    revision: record.revision ?? undefined,
    processingMode: record.processingMode,
    processingReason: record.processingReason ?? undefined,
    reducedCoverage: record.reducedCoverage,
    extractedContentPercent: record.extractedContentPercent ?? undefined,
    normalizedTextObjectKey: record.normalizedTextObjectKey ?? undefined,
    normalizedTextChecksum: record.normalizedTextChecksum ?? undefined,
    normalizedTextLength: record.normalizedTextLength ?? undefined,
    normalizedTextStoredAt: record.normalizedTextStoredAt ?? undefined,
    encryptionKeyVersion: record.encryptionKeyVersion ?? undefined,
    onedriveEtag: record.onedriveEtag ?? undefined,
    versionHash: record.versionHash ?? undefined,
    lastSynced: record.lastSynced ?? undefined,
    indexStatus: record.indexStatus,
    lastIndexed: record.lastIndexed ?? undefined,
    chunkCount: record.chunkCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    extractedFields: record.extractedFields as Record<string, string | undefined> | undefined,
    priorityScore: record.priorityScore ?? undefined,
  };
}

type ProjectFilesQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  tags?: string[];
};

function normalizeProjectFilesQuery(query: ProjectFilesQuery): {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  tags?: string[];
} {
  const page = Number.isFinite(query.page) && (query.page ?? 1) > 0 ? Number(query.page) : 1;
  const pageSize =
    Number.isFinite(query.pageSize) && (query.pageSize ?? 50) > 0
      ? Math.min(Number(query.pageSize), 10000)
      : 50;
  const search = query.search?.trim();
  const category = query.category?.trim();
  const tags = query.tags?.map((tag) => tag.trim()).filter(Boolean);

  return {
    page,
    pageSize,
    search: search || undefined,
    category: category || undefined,
    tags: tags && tags.length > 0 ? tags : undefined,
  };
}

function buildProjectFilesWhere(
  projectId: UUID,
  query: ReturnType<typeof normalizeProjectFilesQuery>
): SQL {
  const conditions: SQL[] = [eq(fileRecords.projectId, projectId)];

  if (query.search) {
    const pattern = `%${query.search.replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(fileRecords.fileName, pattern),
        ilike(fileRecords.filePath, pattern)
      )!
    );
  }

  if (query.category) {
    conditions.push(eq(fileRecords.docCategory, query.category));
  }

  if (query.tags) {
    conditions.push(
      sql`${fileRecords.tags} && ARRAY[${sql.join(
        query.tags.map((tag) => sql`${tag}`),
        sql`, `
      )}]::text[]`
    );
  }

  return and(...conditions)!;
}

type ExplorerIndexEntry = {
  id: UUID;
  fileName: string;
  filePath: string;
  indexStatus: FileRecord["indexStatus"];
  containingFolderPath: string;
  containingFolderSegments: string[];
};

type ExplorerIndexCacheEntry = {
  expiresAt: number;
  entries: ExplorerIndexEntry[];
};

const explorerIndexCache = new Map<string, ExplorerIndexCacheEntry>();

type ExplorerSnapshotRecord = {
  id: UUID;
  fileName: string;
  filePath: string;
  indexStatus: FileRecord["indexStatus"];
};

function toSyncFingerprint(value?: Date | string | null): string {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString();
}

async function getLatestSyncFingerprint(projectId: UUID): Promise<{ fingerprint: string; lastSyncedAt: Date | null }> {
  const db = getDbIfInitialized();
  if (db) {
    const [latestRun] = await db
      .select({ finishedAt: syncRuns.finishedAt })
      .from(syncRuns)
      .where(eq(syncRuns.projectId, projectId))
      .orderBy(desc(syncRuns.finishedAt))
      .limit(1);
    return {
      fingerprint: toSyncFingerprint(latestRun?.finishedAt),
      lastSyncedAt: latestRun?.finishedAt ?? null,
    };
  }

  const lastSyncedAt = syncTimesByProject.get(projectId) ?? null;
  return { fingerprint: toSyncFingerprint(lastSyncedAt), lastSyncedAt };
}

async function invalidateExplorerSnapshots(projectId: UUID): Promise<void> {
  for (const key of [...explorerIndexCache.keys()]) {
    if (key.startsWith(`${projectId}:`)) {
      explorerIndexCache.delete(key);
    }
  }

  const db = getDbIfInitialized();
  if (!db) {
    return;
  }

  try {
    await db.delete(projectExplorerSnapshots).where(eq(projectExplorerSnapshots.projectId, projectId));
  } catch {
    // Table may not exist until migration 0024 is applied.
  }
}

async function persistExplorerSnapshot(
  projectId: UUID,
  projectRootFolderName: string,
  fingerprint: string,
  entries: ExplorerIndexEntry[]
): Promise<void> {
  const db = getDbIfInitialized();
  if (!db) {
    return;
  }

  const records: ExplorerSnapshotRecord[] = entries.map((entry) => ({
    id: entry.id,
    fileName: entry.fileName,
    filePath: entry.filePath,
    indexStatus: entry.indexStatus,
  }));

  try {
    await db
      .insert(projectExplorerSnapshots)
      .values({
        projectId,
        projectRootFolderName,
        syncFingerprint: fingerprint,
        totalFiles: records.length,
        entries: records,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: projectExplorerSnapshots.projectId,
        set: {
          projectRootFolderName,
          syncFingerprint: fingerprint,
          totalFiles: records.length,
          entries: records,
          updatedAt: new Date(),
        },
      });
  } catch {
    // Snapshot persistence is optional; explorer can still scan file_records.
  }
}

async function readExplorerSnapshot(
  projectId: UUID,
  projectRootFolderName: string,
  fingerprint: string
): Promise<ExplorerIndexEntry[] | null> {
  const db = getDbIfInitialized();
  if (!db) {
    return null;
  }

  try {
    const [row] = await db
      .select()
      .from(projectExplorerSnapshots)
      .where(eq(projectExplorerSnapshots.projectId, projectId))
      .limit(1);

    if (
      !row ||
      row.syncFingerprint !== fingerprint ||
      row.projectRootFolderName !== projectRootFolderName
    ) {
      return null;
    }

    return (row.entries ?? []).map((record) =>
      buildExplorerIndexEntry(
        {
          id: record.id as UUID,
          fileName: record.fileName,
          filePath: record.filePath,
          indexStatus: record.indexStatus as FileRecord["indexStatus"],
        },
        projectRootFolderName
      )
    );
  } catch {
    return null;
  }
}

function toExplorerWsFile(record: Pick<FileRecord, "id" | "fileName" | "filePath" | "indexStatus">): Pick<
  FileRecord,
  "id" | "fileName" | "filePath" | "indexStatus"
> {
  return {
    id: record.id,
    fileName: record.fileName,
    filePath: record.filePath,
    indexStatus: record.indexStatus,
  };
}

function buildExplorerIndexEntry(
  record: Pick<FileRecord, "id" | "fileName" | "filePath" | "indexStatus">,
  projectRootFolderName?: string | null
): ExplorerIndexEntry {
  const containingFolderPath = getExplorerContainingFolderPath(
    record.filePath,
    record.fileName,
    projectRootFolderName
  );

  return {
    id: record.id,
    fileName: record.fileName,
    filePath: record.filePath,
    indexStatus: record.indexStatus,
    containingFolderPath,
    containingFolderSegments: splitExplorerFolderPath(containingFolderPath),
  };
}

async function getProjectExplorerIndex(
  projectId: UUID,
  projectRootFolderName?: string | null
): Promise<{ entries: ExplorerIndexEntry[]; lastSyncedAt: Date | null }> {
  const rootName = projectRootFolderName ?? "";
  const { fingerprint, lastSyncedAt } = await getLatestSyncFingerprint(projectId);
  const cacheKey = `${projectId}:${rootName}:${fingerprint}`;
  const cached = explorerIndexCache.get(cacheKey);
  if (cached) {
    return { entries: cached.entries, lastSyncedAt };
  }

  const snapshot = await readExplorerSnapshot(projectId, rootName, fingerprint);
  if (snapshot) {
    explorerIndexCache.set(cacheKey, { expiresAt: Number.MAX_SAFE_INTEGER, entries: snapshot });
    return { entries: snapshot, lastSyncedAt };
  }

  const db = getDbIfInitialized();
  let records: Array<Pick<FileRecord, "id" | "fileName" | "filePath" | "indexStatus">> = [];

  if (db) {
    records = await db
      .select({
        id: fileRecords.id,
        fileName: fileRecords.fileName,
        filePath: fileRecords.filePath,
        indexStatus: fileRecords.indexStatus,
      })
      .from(fileRecords)
      .where(eq(fileRecords.projectId, projectId))
      .orderBy(asc(fileRecords.filePath), asc(fileRecords.fileName));
  } else {
    records = (filesByProject.get(projectId) ?? []).map((file) => ({
      id: file.id,
      fileName: file.fileName,
      filePath: file.filePath,
      indexStatus: file.indexStatus,
    }));
  }

  const entries = records.map((record) => buildExplorerIndexEntry(record, projectRootFolderName));
  explorerIndexCache.set(cacheKey, { expiresAt: Number.MAX_SAFE_INTEGER, entries });
  void persistExplorerSnapshot(projectId, rootName, fingerprint, entries);
  return { entries, lastSyncedAt };
}

function buildProjectExplorerFolderResponse(
  entries: ExplorerIndexEntry[],
  folderPath: string
): ProjectExplorerFolderResponse {
  const parentSegments = splitExplorerFolderPath(folderPath);
  const folderCounts = new Map<string, number>();
  const directFiles: ProjectExplorerFolderResponse["files"] = [];

  for (const entry of entries) {
    if (!pathStartsWithSegments(entry.containingFolderSegments, parentSegments)) {
      continue;
    }

    const relativeSegments = entry.containingFolderSegments.slice(parentSegments.length);
    if (relativeSegments.length === 0) {
      directFiles.push(toExplorerWsFile(entry) as FileRecord);
      continue;
    }

    const childSegments = [...parentSegments, relativeSegments[0]!];
    const childPath = childSegments.join("/");
    folderCounts.set(childPath, (folderCounts.get(childPath) ?? 0) + 1);
  }

  const folders = [...folderCounts.entries()]
    .map(([path, fileCount]) => ({
      name: path.split("/").pop() ?? path,
      path,
      fileCount,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  directFiles.sort((left, right) => left.fileName.localeCompare(right.fileName));

  return {
    folderPath,
    folders,
    files: directFiles,
    totalProjectFiles: entries.length,
  };
}

function withExplorerSyncMeta(
  response: ProjectExplorerFolderResponse,
  lastSyncedAt: Date | null
): ProjectExplorerFolderResponse {
  return {
    ...response,
    lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
  };
}

type ExplorerSqlRow = Record<string, unknown>;

function asExplorerSqlRows(result: unknown): ExplorerSqlRow[] {
  if (Array.isArray(result)) {
    return result as ExplorerSqlRow[];
  }
  if (result && typeof result === "object" && "rows" in result) {
    const rows = (result as { rows?: unknown }).rows;
    if (Array.isArray(rows)) {
      return rows as ExplorerSqlRow[];
    }
  }
  return [];
}

function normalizeExplorerRootName(projectRootFolderName?: string | null): string {
  return (projectRootFolderName ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

/** List one folder level via SQL so large projects never load all file rows into memory. */
async function listExplorerFolderFromDb(
  projectId: UUID,
  folderPath: string,
  projectRootFolderName?: string | null
): Promise<ProjectExplorerFolderResponse> {
  const db = getDbIfInitialized();
  if (!db) {
    throw new Error("Database is required for SQL explorer listing");
  }

  const root = normalizeExplorerRootName(projectRootFolderName);
  const parent = folderPath;
  const backslash = "\\";
  const rootPrefix = root ? `${root}/%` : "";
  const parentPrefix = parent ? `${parent}/%` : "";

  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(fileRecords)
    .where(eq(fileRecords.projectId, projectId));

  const folderRows = asExplorerSqlRows(
    await db.execute(sql`
      WITH base AS (
        SELECT replace(file_path, ${backslash}, '/') AS norm_path
        FROM file_records
        WHERE project_id = ${projectId}
      ),
      rel AS (
        SELECT
          CASE
            WHEN ${root} = '' THEN norm_path
            WHEN norm_path = ${root} THEN ''
            WHEN ${root} <> '' AND norm_path LIKE ${rootPrefix} THEN substr(norm_path, length(${root}) + 2)
            ELSE norm_path
          END AS rel_path
        FROM base
      ),
      cf AS (
        SELECT
          CASE
            WHEN rel_path = '' THEN ''
            WHEN rel_path NOT LIKE '%/%' THEN ''
            ELSE regexp_replace(rel_path, '/[^/]+$', '')
          END AS containing_folder
        FROM rel
      ),
      children AS (
        SELECT
          CASE
            WHEN ${parent} = '' THEN split_part(containing_folder, '/', 1)
            ELSE split_part(substr(containing_folder, length(${parent}) + 2), '/', 1)
          END AS child_name
        FROM cf
        WHERE
          (${parent} = '' AND containing_folder <> '')
          OR (${parent} <> '' AND containing_folder LIKE ${parentPrefix})
      )
      SELECT child_name AS name, count(*)::int AS file_count
      FROM children
      WHERE child_name <> ''
      GROUP BY child_name
      ORDER BY child_name
    `)
  );

  const fileRows = asExplorerSqlRows(
    await db.execute(sql`
      WITH base AS (
        SELECT
          id,
          file_name,
          file_path,
          index_status,
          replace(file_path, ${backslash}, '/') AS norm_path
        FROM file_records
        WHERE project_id = ${projectId}
      ),
      rel AS (
        SELECT
          id,
          file_name,
          file_path,
          index_status,
          CASE
            WHEN ${root} = '' THEN norm_path
            WHEN norm_path = ${root} THEN ''
            WHEN ${root} <> '' AND norm_path LIKE ${rootPrefix} THEN substr(norm_path, length(${root}) + 2)
            ELSE norm_path
          END AS rel_path
        FROM base
      ),
      cf AS (
        SELECT
          id,
          file_name,
          file_path,
          index_status,
          CASE
            WHEN rel_path = '' THEN ''
            WHEN rel_path NOT LIKE '%/%' THEN ''
            ELSE regexp_replace(rel_path, '/[^/]+$', '')
          END AS containing_folder
        FROM rel
      )
      SELECT id, file_name, file_path, index_status
      FROM cf
      WHERE containing_folder = ${parent}
      ORDER BY file_name
    `)
  );

  const folders = folderRows.map((row) => {
    const name = String(row.name ?? "");
    return {
      name,
      path: parent ? `${parent}/${name}` : name,
      fileCount: Number(row.file_count ?? 0),
    };
  });

  const files = fileRows.map((row) =>
    toExplorerWsFile({
      id: String(row.id) as UUID,
      fileName: String(row.file_name ?? ""),
      filePath: String(row.file_path ?? ""),
      indexStatus: String(row.index_status ?? "pending") as FileRecord["indexStatus"],
    }) as FileRecord
  );

  return {
    folderPath: parent,
    folders,
    files,
    totalProjectFiles: Number(totalRow?.total ?? 0),
  };
}

function filterInMemoryProjectFiles(
  records: FileRecord[],
  query: ReturnType<typeof normalizeProjectFilesQuery>
): FileRecord[] {
  const normalizedSearch = query.search?.toLowerCase();

  return records.filter((file) => {
    if (normalizedSearch) {
      const haystack = `${file.fileName} ${file.filePath}`.toLowerCase();
      if (!haystack.includes(normalizedSearch)) {
        return false;
      }
    }

    if (query.category && file.docCategory !== query.category) {
      return false;
    }

    if (query.tags && query.tags.length > 0) {
      const tags = file.tags ?? [];
      const hasAnyTag = query.tags.some((tag) => tags.includes(tag));
      if (!hasAnyTag) {
        return false;
      }
    }

    return true;
  });
}

function getProjectsForOrg(orgId: string): CreateProjectResponse["project"][] {
  const projects = projectsByOrg.get(orgId);

  if (projects) {
    return projects;
  }

  const nextProjects: CreateProjectResponse["project"][] = [];
  projectsByOrg.set(orgId, nextProjects);
  return nextProjects;
}

export const projectService = {
  async listProjects(
    orgId?: string,
    access?: ProjectAccessContext
  ): Promise<ProjectListResponse> {
    if (!orgId) {
      return { projects: [] };
    }

    const db = getDbIfInitialized();
    if (db && access) {
      if (isOrgWideProjectAdmin(access.orgRole)) {
        const records = await db
          .select()
          .from(projects)
          .where(eq(projects.orgId, toUuid(orgId)))
          .orderBy(desc(projects.createdAt));

        const memberships = await db
          .select({
            projectId: projectMembers.projectId,
            role: projectMembers.role,
          })
          .from(projectMembers)
          .where(eq(projectMembers.userId, access.userId));

        const roleByProject = new Map(
          memberships.map((row) => [row.projectId, row.role as "admin" | "member"])
        );

        return {
          projects: records.map((record) => ({
            ...toProjectResponseProject(record),
            projectRole: roleByProject.get(record.id) ?? "admin",
          })),
        };
      }

      const rows = await db
        .select({
          project: projects,
          projectRole: projectMembers.role,
        })
        .from(projectMembers)
        .innerJoin(projects, eq(projects.id, projectMembers.projectId))
        .where(
          and(eq(projectMembers.userId, access.userId), eq(projects.orgId, toUuid(orgId)))
        )
        .orderBy(desc(projects.createdAt));

      return {
        projects: rows.map((row) => ({
          ...toProjectResponseProject(row.project),
          projectRole: row.projectRole as "admin" | "member",
        })),
      };
    }

    if (db) {
      const records = await db
        .select()
        .from(projects)
        .where(eq(projects.orgId, toUuid(orgId)))
        .orderBy(desc(projects.createdAt));

      return {
        projects: records.map(toProjectResponseProject),
      };
    }

    return { projects: [...getProjectsForOrg(orgId)] };
  },

  async createProject(
    request: CreateProjectRequest,
    orgId?: string,
    creatorUserId?: UUID
  ): Promise<CreateProjectResponse> {
    const resolvedOrgId = orgId ?? "org-123";
    const db = getDbIfInitialized();

    if (db) {
      const [record] = await db
        .insert(projects)
        .values({
          id: toUuid(randomUUID()),
          orgId: toUuid(resolvedOrgId),
          name: request.name,
          onedriveFolderId: request.onedriveFolderId,
          status: "active",
          createdAt: new Date(),
        })
        .returning();

      if (creatorUserId) {
        await projectAccessService.addCreatorAsAdmin(toUuid(record.id), creatorUserId);
      }

      return { project: toProjectResponseProject(record) };
    }

    const project = {
      id: toUuid(randomUUID()),
      orgId: toUuid(resolvedOrgId),
      name: request.name,
      onedriveFolderId: request.onedriveFolderId,
      onedriveDriveId: undefined as string | undefined,
      status: "active" as const,
      createdAt: new Date(),
    };

    getProjectsForOrg(resolvedOrgId).push(project);

    return { project };
  },

  async updateProjectFolderBinding(
    projectId: UUID,
    onedriveFolderId: string,
    options?: {
      clearIndexedData?: boolean;
      connectedByUserId?: UUID;
    }
  ): Promise<CreateProjectResponse["project"]> {
    const db = getDbIfInitialized();
    const clearIndexedData = options?.clearIndexedData === true;

    if (db) {
      const [updated] = await db
        .update(projects)
        .set({
          onedriveFolderId,
          ...(options?.connectedByUserId
            ? { onedriveConnectedByUserId: options.connectedByUserId }
            : {}),
        })
        .where(eq(projects.id, projectId))
        .returning();

      if (!updated) {
        throw new AppError(404, "project_not_found", "Project not found");
      }

      if (clearIndexedData) {
        await this.setProjectFiles(projectId, []);
        await db.delete(syncRuns).where(eq(syncRuns.projectId, projectId));
        syncTimesByProject.delete(projectId);
      }

      return toProjectResponseProject(updated);
    }

    const allProjects = Array.from(projectsByOrg.values());
    let updatedProject: CreateProjectResponse["project"] | undefined;

    for (const orgProjects of allProjects) {
      const project = orgProjects.find((entry) => entry.id === projectId);
      if (!project) {
        continue;
      }

      project.onedriveFolderId = onedriveFolderId;
      if (options?.connectedByUserId) {
        project.onedriveConnectedByUserId = options.connectedByUserId;
      }
      updatedProject = project;
      break;
    }

    if (!updatedProject) {
      throw new AppError(404, "project_not_found", "Project not found");
    }

    if (clearIndexedData) {
      filesByProject.set(projectId, []);
      chunksByProject.set(projectId, []);
      chunkLinksByProject.set(projectId, []);
      syncTimesByProject.delete(projectId);
    }

    return updatedProject;
  },

  /**
   * Bind a project to a specific Graph driveId + folderId (owner's IDs).
   * Stores connectedByUserId so file reads use that user's OneDrive token for
   * all project members (no per-member OneDrive connect required).
   */
  async bindProjectDrive(
    projectId: UUID,
    driveId: string,
    folderId: string,
    connectedByUserId: UUID
  ): Promise<CreateProjectResponse["project"]> {
    const db = getDbIfInitialized();

    if (db) {
      const [updated] = await db
        .update(projects)
        .set({
          onedriveDriveId: driveId,
          onedriveFolderId: folderId,
          onedriveConnectedByUserId: connectedByUserId,
        })
        .where(eq(projects.id, projectId))
        .returning();

      if (!updated) {
        throw new AppError(404, "project_not_found", "Project not found");
      }

      return toProjectResponseProject(updated);
    }

    // in-memory fallback
    const allProjects = Array.from(projectsByOrg.values()).flat();
    const project = allProjects.find((entry) => entry.id === projectId);
    if (!project) {
      throw new AppError(404, "project_not_found", "Project not found");
    }
    project.onedriveDriveId = driveId;
    project.onedriveFolderId = folderId;
    project.onedriveConnectedByUserId = connectedByUserId;
    return project;
  },

  async getProjectDetails(projectId: UUID): Promise<ProjectDetailsResponse> {
    const db = getDbIfInitialized();

    if (db) {
      const [record] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!record) {
        throw new AppError(404, "project_not_found", "Project not found");
      }

      const [latestRun] = await db
        .select()
        .from(syncRuns)
        .where(eq(syncRuns.projectId, projectId))
        .orderBy(desc(syncRuns.finishedAt))
        .limit(1);

      const records = await db
        .select()
        .from(fileRecords)
        .where(eq(fileRecords.projectId, projectId));

      return {
        project: toProjectResponseProject(record),
        onedrive: {
          connected: Boolean(record.onedriveFolderId),
          syncInProgress: false,
          lastSyncedAt: latestRun?.finishedAt,
        },
        fileCount: records.length,
        lastSyncedAt: latestRun?.finishedAt,
      };
    }

    const project = Array.from(projectsByOrg.values()).flat().find((entry) => entry.id === projectId);

    if (!project) {
      throw new AppError(404, "project_not_found", "Project not found");
    }

    const files = filesByProject.get(projectId) ?? [];
    const lastSyncedAt = syncTimesByProject.get(projectId);

    return {
      project,
      onedrive: {
        connected: false,
        syncInProgress: false,
        lastSyncedAt,
      },
      fileCount: files.length,
      lastSyncedAt,
    };
  },

  async getProjectOrThrow(
    projectId: UUID,
    orgId?: string,
    access?: ProjectAccessContext
  ): Promise<CreateProjectResponse["project"]> {
    const db = getDbIfInitialized();
    if (db) {
      const [record] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!record) {
        throw new AppError(404, "project_not_found", "Project not found");
      }

      if (orgId && record.orgId !== toUuid(orgId)) {
        throw new AppError(403, "forbidden", "Project does not belong to current organization");
      }

      if (access) {
        const projectRole = await projectAccessService.assertCanAccessProject(projectId, access);
        return {
          ...toProjectResponseProject(record),
          projectRole,
        };
      }

      return toProjectResponseProject(record);
    }

    const project = Array.from(projectsByOrg.values())
      .flat()
      .find((entry) => entry.id === projectId);

    if (!project) {
      throw new AppError(404, "project_not_found", "Project not found");
    }

    if (orgId && project.orgId !== toUuid(orgId)) {
      throw new AppError(403, "forbidden", "Project does not belong to current organization");
    }

    return project;
  },

  async setProjectFiles(projectId: UUID, files: FileRecord[]): Promise<void> {
    const db = getDbIfInitialized();
    if (db) {
      const existingRecords = await db
        .select()
        .from(fileRecords)
        .where(eq(fileRecords.projectId, projectId));
      const existingByItemId = new Map(
        existingRecords
          .filter((entry) => Boolean(entry.onedriveItemId))
          .map((entry) => [entry.onedriveItemId as string, entry])
      );

      for (const file of files) {
        const existing = existingByItemId.get(file.onedriveItemId);
        const isUnchanged =
          Boolean(existing?.onedriveEtag) &&
          Boolean(file.onedriveEtag) &&
          existing?.onedriveEtag === file.onedriveEtag;

        await db
          .insert(fileRecords)
          .values({
            id: file.id,
            projectId,
            onedriveItemId: file.onedriveItemId,
            fileName: file.fileName,
            filePath: file.filePath,
            fileType: file.fileType,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            summary: isUnchanged ? existing?.summary : file.summary,
            keyTopics: isUnchanged ? existing?.keyTopics : file.keyTopics,
            tags: isUnchanged ? existing?.tags : file.tags,
            docCategory: isUnchanged ? existing?.docCategory : file.docCategory,
            specSection: isUnchanged ? existing?.specSection : file.specSection,
            sheetNumber: isUnchanged ? existing?.sheetNumber : file.sheetNumber,
            revision: isUnchanged ? existing?.revision : file.revision,
            processingMode: isUnchanged
              ? existing?.processingMode ?? file.processingMode ?? "full"
              : file.processingMode ?? "full",
            processingReason: isUnchanged ? existing?.processingReason : file.processingReason,
            reducedCoverage: isUnchanged
              ? existing?.reducedCoverage ?? file.reducedCoverage ?? false
              : file.reducedCoverage ?? false,
            extractedContentPercent: isUnchanged
              ? existing?.extractedContentPercent ?? file.extractedContentPercent
              : file.extractedContentPercent,
            normalizedTextObjectKey: isUnchanged
              ? existing?.normalizedTextObjectKey ?? file.normalizedTextObjectKey
              : file.normalizedTextObjectKey,
            normalizedTextChecksum: isUnchanged
              ? existing?.normalizedTextChecksum ?? file.normalizedTextChecksum
              : file.normalizedTextChecksum,
            normalizedTextLength: isUnchanged
              ? existing?.normalizedTextLength ?? file.normalizedTextLength
              : file.normalizedTextLength,
            normalizedTextStoredAt: isUnchanged
              ? existing?.normalizedTextStoredAt ?? file.normalizedTextStoredAt
              : file.normalizedTextStoredAt,
            encryptionKeyVersion: isUnchanged
              ? existing?.encryptionKeyVersion ?? file.encryptionKeyVersion
              : file.encryptionKeyVersion,
            onedriveEtag: file.onedriveEtag,
            versionHash: file.versionHash,
            lastSynced: file.lastSynced,
            indexStatus: isUnchanged ? existing?.indexStatus ?? file.indexStatus : file.indexStatus,
            lastIndexed: isUnchanged ? existing?.lastIndexed : file.lastIndexed,
            chunkCount: isUnchanged ? existing?.chunkCount ?? file.chunkCount : file.chunkCount,
            createdAt: isUnchanged ? existing?.createdAt ?? file.createdAt : file.createdAt,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: fileRecords.onedriveItemId,
            set: {
              projectId,
              fileName: file.fileName,
              filePath: file.filePath,
              fileType: file.fileType,
              fileSize: file.fileSize,
              mimeType: file.mimeType,
              summary: isUnchanged ? existing?.summary : file.summary,
              keyTopics: isUnchanged ? existing?.keyTopics : file.keyTopics,
              tags: isUnchanged ? existing?.tags : file.tags,
              docCategory: isUnchanged ? existing?.docCategory : file.docCategory,
              specSection: isUnchanged ? existing?.specSection : file.specSection,
              sheetNumber: isUnchanged ? existing?.sheetNumber : file.sheetNumber,
              revision: isUnchanged ? existing?.revision : file.revision,
              processingMode: isUnchanged
                ? existing?.processingMode ?? file.processingMode ?? "full"
                : file.processingMode ?? "full",
              processingReason: isUnchanged ? existing?.processingReason : file.processingReason,
              reducedCoverage: isUnchanged
                ? existing?.reducedCoverage ?? file.reducedCoverage ?? false
                : file.reducedCoverage ?? false,
              extractedContentPercent: isUnchanged
                ? existing?.extractedContentPercent ?? file.extractedContentPercent
                : file.extractedContentPercent,
              normalizedTextObjectKey: isUnchanged
                ? existing?.normalizedTextObjectKey ?? file.normalizedTextObjectKey
                : file.normalizedTextObjectKey,
              normalizedTextChecksum: isUnchanged
                ? existing?.normalizedTextChecksum ?? file.normalizedTextChecksum
                : file.normalizedTextChecksum,
              normalizedTextLength: isUnchanged
                ? existing?.normalizedTextLength ?? file.normalizedTextLength
                : file.normalizedTextLength,
              normalizedTextStoredAt: isUnchanged
                ? existing?.normalizedTextStoredAt ?? file.normalizedTextStoredAt
                : file.normalizedTextStoredAt,
              encryptionKeyVersion: isUnchanged
                ? existing?.encryptionKeyVersion ?? file.encryptionKeyVersion
                : file.encryptionKeyVersion,
              onedriveEtag: file.onedriveEtag,
              versionHash: file.versionHash,
              lastSynced: file.lastSynced,
              indexStatus: isUnchanged ? existing?.indexStatus ?? file.indexStatus : file.indexStatus,
              lastIndexed: isUnchanged ? existing?.lastIndexed : file.lastIndexed,
              chunkCount: isUnchanged ? existing?.chunkCount ?? file.chunkCount : file.chunkCount,
              updatedAt: new Date(),
            },
          });
      }

      const syncedItemIds = files.map((entry) => entry.onedriveItemId).filter(Boolean);
      if (syncedItemIds.length > 0) {
        const staleRecords = existingRecords.filter(
          (entry) => Boolean(entry.onedriveItemId) && !syncedItemIds.includes(entry.onedriveItemId as string)
        );
        if (staleRecords.length > 0) {
          const staleFileIds = staleRecords.map((entry) => entry.id);
          const staleChunkIds: string[] = [];
          for (const fileIdBatch of toBatches(staleFileIds, IN_CLAUSE_BATCH_SIZE)) {
            const staleChunkRows = await db
              .select({ id: fileChunks.id })
              .from(fileChunks)
              .where(
                and(
                  eq(fileChunks.projectId, projectId),
                  inArray(fileChunks.fileId, fileIdBatch)
                )
              );
            staleChunkIds.push(...staleChunkRows.map((entry) => entry.id));
          }

          if (staleChunkIds.length > 0) {
            for (const chunkIdBatch of toBatches(staleChunkIds, IN_CLAUSE_BATCH_SIZE)) {
              await db
                .delete(chunkLinks)
                .where(
                  and(
                    eq(chunkLinks.projectId, projectId),
                    inArray(chunkLinks.sourceChunkId, chunkIdBatch)
                  )
                );

              await db
                .delete(chunkLinks)
                .where(
                  and(
                    eq(chunkLinks.projectId, projectId),
                    inArray(chunkLinks.targetChunkId, chunkIdBatch)
                  )
                );
            }
          }

          for (const fileIdBatch of toBatches(staleFileIds, IN_CLAUSE_BATCH_SIZE)) {
            await db
              .delete(fileChunks)
              .where(
                and(
                  eq(fileChunks.projectId, projectId),
                  inArray(fileChunks.fileId, fileIdBatch)
                )
              );
          }

          const staleItemIds = staleRecords.map((entry) => entry.onedriveItemId as string);
          for (const itemIdBatch of toBatches(staleItemIds, IN_CLAUSE_BATCH_SIZE)) {
            await db
              .delete(fileRecords)
              .where(
                and(
                  eq(fileRecords.projectId, projectId),
                  inArray(fileRecords.onedriveItemId, itemIdBatch)
                )
              );
          }
        }
      } else {
        const existingChunkRows = await db
          .select({ id: fileChunks.id })
          .from(fileChunks)
          .where(eq(fileChunks.projectId, projectId));
        const existingChunkIds = existingChunkRows.map((entry) => entry.id);

        if (existingChunkIds.length > 0) {
          for (const chunkIdBatch of toBatches(existingChunkIds, IN_CLAUSE_BATCH_SIZE)) {
            await db
              .delete(chunkLinks)
              .where(
                and(
                  eq(chunkLinks.projectId, projectId),
                  inArray(chunkLinks.sourceChunkId, chunkIdBatch)
                )
              );

            await db
              .delete(chunkLinks)
              .where(
                and(
                  eq(chunkLinks.projectId, projectId),
                  inArray(chunkLinks.targetChunkId, chunkIdBatch)
                )
              );
          }
        }

        await db.delete(fileChunks).where(eq(fileChunks.projectId, projectId));
        await db.delete(fileRecords).where(eq(fileRecords.projectId, projectId));
      }

      await invalidateExplorerSnapshots(projectId);
      return;
    }

    filesByProject.set(projectId, files);
    syncTimesByProject.set(projectId, new Date());
    await invalidateExplorerSnapshots(projectId);
  },

  async updateFileIndexingResult(
    projectId: UUID,
    onedriveItemId: string,
    update: {
      indexStatus: "pending" | "processing" | "indexed" | "failed";
      summary?: string;
      keyTopics?: string[];
      chunkCount?: number;
      lastIndexed?: Date;
      docCategory?: string;
      tags?: string[];
      extractedFields?: Record<string, unknown>;
      extractionProvenance?: Record<string, unknown>;
      specSection?: string;
      sheetNumber?: string;
      revision?: string;
      processingMode?: "full" | "reduced" | "metadata_only";
      processingReason?: string;
      reducedCoverage?: boolean;
      extractedContentPercent?: number;
      normalizedTextObjectKey?: string;
      normalizedTextChecksum?: string;
      normalizedTextLength?: number;
      normalizedTextStoredAt?: Date;
      encryptionKeyVersion?: number;
    }
  ): Promise<void> {
    const db = getDbIfInitialized();
    if (db) {
      await db
        .update(fileRecords)
        .set({
          indexStatus: update.indexStatus,
          summary: update.summary,
          keyTopics: update.keyTopics,
          chunkCount: update.chunkCount,
          lastIndexed: update.lastIndexed,
          docCategory: update.docCategory,
          tags: update.tags,
          ...(update.extractedFields !== undefined
            ? { extractedFields: sql`${update.extractedFields}::jsonb` }
            : {}),
          ...(update.extractionProvenance !== undefined
            ? { extractionProvenance: sql`${update.extractionProvenance}::jsonb` }
            : {}),
          specSection: update.specSection,
          sheetNumber: update.sheetNumber,
          revision: update.revision,
          processingMode: update.processingMode,
          processingReason: update.processingReason,
          reducedCoverage: update.reducedCoverage,
          extractedContentPercent: update.extractedContentPercent,
          normalizedTextObjectKey: update.normalizedTextObjectKey,
          normalizedTextChecksum: update.normalizedTextChecksum,
          normalizedTextLength: update.normalizedTextLength,
          normalizedTextStoredAt: update.normalizedTextStoredAt,
          encryptionKeyVersion: update.encryptionKeyVersion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(fileRecords.projectId, projectId),
            eq(fileRecords.onedriveItemId, onedriveItemId)
          )
        );
      return;
    }

    const files = filesByProject.get(projectId) ?? [];
    const file = files.find((entry) => entry.onedriveItemId === onedriveItemId);
    if (!file) {
      return;
    }

    file.indexStatus = update.indexStatus;
    file.summary = update.summary;
    file.keyTopics = update.keyTopics;
    file.docCategory = (update.docCategory as import("@contractor/shared").DocumentCategory | undefined) ?? file.docCategory;
    file.tags = update.tags;
    file.extractedFields = update.extractedFields as Record<string, string | undefined> | undefined;
    file.specSection = update.specSection;
    file.sheetNumber = update.sheetNumber;
    file.revision = update.revision;
    file.processingMode = update.processingMode ?? file.processingMode;
    file.processingReason = update.processingReason;
    file.reducedCoverage = update.reducedCoverage ?? file.reducedCoverage;
    file.extractedContentPercent = update.extractedContentPercent ?? file.extractedContentPercent;
    file.normalizedTextObjectKey = update.normalizedTextObjectKey ?? file.normalizedTextObjectKey;
    file.normalizedTextChecksum = update.normalizedTextChecksum ?? file.normalizedTextChecksum;
    file.normalizedTextLength = update.normalizedTextLength ?? file.normalizedTextLength;
    file.normalizedTextStoredAt = update.normalizedTextStoredAt ?? file.normalizedTextStoredAt;
    file.encryptionKeyVersion = update.encryptionKeyVersion ?? file.encryptionKeyVersion;
    file.chunkCount = update.chunkCount ?? file.chunkCount;
    file.lastIndexed = update.lastIndexed;
    file.updatedAt = new Date();
  },

  async replaceFileIdentifiers(
    projectId: UUID,
    fileId: UUID,
    identifiers: Array<{ type: string; valueNormalized: string; raw: string }>
  ): Promise<void> {
    const db = getDbIfInitialized();
    if (!db) return;
    await db.delete(documentIdentifiers).where(eq(documentIdentifiers.fileId, fileId));
    if (identifiers.length === 0) return;
    await db.insert(documentIdentifiers).values(
      identifiers.map((identifier) => ({
        fileId,
        projectId,
        type: identifier.type,
        valueNormalized: identifier.valueNormalized,
        raw: identifier.raw,
      }))
    );
  },

  async replaceFileChunks(
    projectId: UUID,
    fileId: UUID,
    onedriveItemId: string,
    fileName: string,
    chunks: Array<{
      chunkIndex: number;
      chunkText: string;
      tokenCount: number;
      embeddingModel: string;
      embedding: number[];
      sourceType?: "content" | "summary" | "metadata_stub";
      pageNumber?: number;
      sectionLabel?: string;
      metadata?: Record<string, unknown>;
      confidence?: number;
    }>,
    links: Array<{
      sourceChunkIndex: number;
      targetChunkIndex: number;
      relation: string;
      weight: number;
    }>
  ): Promise<void> {
    const db = getDbIfInitialized();
    if (db) {
      await db.transaction(async (tx) => {
        const existing = await tx
          .select()
          .from(fileChunks)
          .where(
            and(
              eq(fileChunks.projectId, projectId),
              eq(fileChunks.fileId, fileId)
            )
          );

        if (existing.length > 0) {
          await tx
            .delete(chunkLinks)
            .where(
              and(
                eq(chunkLinks.projectId, projectId),
                inArray(
                  chunkLinks.sourceChunkId,
                  existing.map((entry) => entry.id)
                )
              )
            );

          await tx
            .delete(fileChunks)
            .where(
              and(
                eq(fileChunks.projectId, projectId),
                eq(fileChunks.fileId, fileId)
              )
            );
        }

        const inserted: Array<{
          id: UUID;
          chunkIndex: number;
        }> = [];
        const now = new Date();

        // Native pgvector `embedding_vector` is the single source of truth for vectors.
        const chunkRows = chunks.map((chunk) => ({
          id: toUuid(randomUUID()),
          projectId,
          fileId,
          onedriveItemId,
          fileName,
          chunkIndex: chunk.chunkIndex,
          chunkText: chunk.chunkText,
          sourceType: chunk.sourceType ?? "content",
          pageNumber: chunk.pageNumber,
          sectionLabel: chunk.sectionLabel,
          metadata: chunk.metadata ?? {},
          confidence: chunk.confidence,
          tokenCount: chunk.tokenCount,
          embeddingModel: chunk.embeddingModel,
          embeddingVector: chunk.embedding,
          createdAt: now,
        }));

        for (const rowBatch of toBatches(chunkRows, CHUNK_INSERT_BATCH_SIZE)) {
          const created = await tx
            .insert(fileChunks)
            .values(rowBatch)
            .returning({
              id: fileChunks.id,
              chunkIndex: fileChunks.chunkIndex,
            });
          for (const entry of created) {
            inserted.push({ id: toUuid(entry.id), chunkIndex: entry.chunkIndex });
          }
        }

        const byIndex = new Map(inserted.map((entry) => [entry.chunkIndex, entry.id]));

        const linkRows = links
          .map((link) => {
            const sourceChunkId = byIndex.get(link.sourceChunkIndex);
            const targetChunkId = byIndex.get(link.targetChunkIndex);
            if (!sourceChunkId || !targetChunkId) return undefined;
            return {
              id: toUuid(randomUUID()),
              projectId,
              fileId,
              sourceChunkId,
              targetChunkId,
              relation: link.relation,
              weight: link.weight,
              createdAt: now,
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== undefined);

        for (const linkBatch of toBatches(linkRows, CHUNK_INSERT_BATCH_SIZE)) {
          await tx.insert(chunkLinks).values(linkBatch);
        }

        // Update chunkCount atomically inside this transaction so that if the
        // process crashes after replaceFileChunks but before updateFileIndexingResult,
        // the next run's loadIndexedIds (which filters on chunkCount > 0) correctly
        // skips this file rather than re-processing it.
        await tx
          .update(fileRecords)
          .set({ chunkCount: inserted.length, updatedAt: now })
          .where(and(eq(fileRecords.projectId, projectId), eq(fileRecords.id, fileId)));
      });

      return;
    }

    const projectChunks = chunksByProject.get(projectId) ?? [];
    const keptChunks = projectChunks.filter((entry) => entry.fileId !== fileId);
    const nextChunks = chunks.map((chunk) => ({
      id: toUuid(randomUUID()),
      projectId,
      fileId,
      onedriveItemId,
      fileName,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText,
      sourceType: chunk.sourceType ?? "content",
      pageNumber: chunk.pageNumber,
      sectionLabel: chunk.sectionLabel,
      metadata: chunk.metadata ?? {},
      confidence: chunk.confidence,
      tokenCount: chunk.tokenCount,
      embeddingModel: chunk.embeddingModel,
      embedding: chunk.embedding,
      createdAt: new Date(),
    }));
    chunksByProject.set(projectId, [...keptChunks, ...nextChunks]);

    const byChunkIndex = new Map(nextChunks.map((entry) => [entry.chunkIndex, entry.id]));
    const projectLinks = chunkLinksByProject.get(projectId) ?? [];
    const keptLinks = projectLinks.filter((entry) => entry.fileId !== fileId);
    const nextLinks = links
      .map((link) => {
        const sourceChunkId = byChunkIndex.get(link.sourceChunkIndex);
        const targetChunkId = byChunkIndex.get(link.targetChunkIndex);

        if (!sourceChunkId || !targetChunkId) {
          return undefined;
        }

        return {
          id: toUuid(randomUUID()),
          projectId,
          fileId,
          sourceChunkId,
          targetChunkId,
          relation: link.relation,
          weight: link.weight,
          createdAt: new Date(),
        };
      })
      .filter(Boolean) as Array<{
      id: UUID;
      projectId: UUID;
      fileId: UUID;
      sourceChunkId: UUID;
      targetChunkId: UUID;
      relation: string;
      weight: number;
      createdAt: Date;
    }>;
    chunkLinksByProject.set(projectId, [...keptLinks, ...nextLinks]);
  },

  async listProjectChunks(projectId: UUID): Promise<Array<{
    id: UUID;
    projectId: UUID;
    fileId: UUID;
    fileName: string;
    chunkIndex: number;
    chunkText: string;
    sourceType: "content" | "summary" | "metadata_stub";
    pageNumber?: number;
    sectionLabel?: string;
    metadata?: Record<string, unknown>;
    tokenCount: number;
    embeddingModel: string;
    embedding: number[];
    docCategory?: string;
    tags?: string[];
  }>> {
    const db = getDbIfInitialized();
    if (db) {
      const rows = await db
        .select()
        .from(fileChunks)
        .where(eq(fileChunks.projectId, projectId));

      return rows.map((row) => ({
        id: toUuid(row.id),
        projectId: toUuid(row.projectId),
        fileId: toUuid(row.fileId),
        fileName: row.fileName,
        chunkIndex: row.chunkIndex,
        chunkText: row.chunkText,
        sourceType: row.sourceType,
        pageNumber: row.pageNumber ?? undefined,
        sectionLabel: row.sectionLabel ?? undefined,
        metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
        tokenCount: row.tokenCount,
        embeddingModel: row.embeddingModel,
        embedding: Array.isArray(row.embeddingVector) ? (row.embeddingVector as number[]) : [],
      }));
    }

    const inMemory = chunksByProject.get(projectId) ?? [];
    return inMemory.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      fileId: row.fileId,
      fileName: row.fileName,
      chunkIndex: row.chunkIndex,
      chunkText: row.chunkText,
      sourceType: row.sourceType,
      pageNumber: row.pageNumber,
      sectionLabel: row.sectionLabel,
      metadata: row.metadata,
      tokenCount: row.tokenCount,
      embeddingModel: row.embeddingModel,
      embedding: row.embedding,
    }));
  },

  async recordSyncRun(projectId: UUID, input: SyncPersistenceInput): Promise<void> {
    const db = getDbIfInitialized();
    if (db) {
      await db.insert(syncRuns).values({
        projectId,
        status: input.status,
        scannedFileCount: input.scannedFileCount,
        supportedFileCount: input.supportedFileCount,
        unsupportedFileCount: input.unsupportedFileCount,
        errorMessage: input.errorMessage,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
        createdAt: new Date(),
      });
      syncTimesByProject.set(projectId, input.finishedAt);
      await invalidateExplorerSnapshots(projectId);
      return;
    }

    syncTimesByProject.set(projectId, input.finishedAt);
    await invalidateExplorerSnapshots(projectId);
  },

  async listProjectFiles(
    projectId: UUID,
    query: ProjectFilesQuery
  ): Promise<ProjectFilesResponse> {
    const normalizedQuery = normalizeProjectFilesQuery(query);
    const { page, pageSize } = normalizedQuery;
    const startIndex = (page - 1) * pageSize;

    const db = getDbIfInitialized();
    if (db) {
      const whereClause = buildProjectFilesWhere(projectId, normalizedQuery);

      const [countRow] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(fileRecords)
        .where(whereClause);

      const records = await db
        .select()
        .from(fileRecords)
        .where(whereClause)
        .orderBy(asc(fileRecords.filePath), asc(fileRecords.fileName))
        .limit(pageSize)
        .offset(startIndex);

      const files = records.map(toFileRecord);
      const total = countRow?.total ?? 0;

      return {
        files,
        total,
        page,
        pageSize,
        hasMore: startIndex + files.length < total,
      };
    }

    const records = filesByProject.get(projectId) ?? [];
    const filtered = filterInMemoryProjectFiles(records, normalizedQuery);
    const files = filtered.slice(startIndex, startIndex + pageSize);

    return {
      files,
      total: filtered.length,
      page,
      pageSize,
      hasMore: startIndex + files.length < filtered.length,
    };
  },

  async listProjectExplorerFolder(
    projectId: UUID,
    folderPath?: string | null,
    projectRootFolderName?: string | null
  ): Promise<ProjectExplorerFolderResponse> {
    const normalizedFolderPath = splitExplorerFolderPath(folderPath ?? "").join("/");
    const { lastSyncedAt } = await getLatestSyncFingerprint(projectId);
    const db = getDbIfInitialized();

    // SQL folder listing whenever Postgres is available (local + Render).
    // In-memory index is only for unit tests without a database.
    if (db) {
      return withExplorerSyncMeta(
        await listExplorerFolderFromDb(projectId, normalizedFolderPath, projectRootFolderName),
        lastSyncedAt
      );
    }

    const { entries } = await getProjectExplorerIndex(projectId, projectRootFolderName);
    return withExplorerSyncMeta(
      buildProjectExplorerFolderResponse(entries, normalizedFolderPath),
      lastSyncedAt
    );
  },

  async getProjectFileById(projectId: UUID, fileId: UUID): Promise<FileRecord | null> {
    const db = getDbIfInitialized();
    if (db) {
      const [record] = await db
        .select()
        .from(fileRecords)
        .where(
          and(
            eq(fileRecords.projectId, projectId),
            eq(fileRecords.id, fileId)
          )
        )
        .limit(1);

      return record ? toFileRecord(record) : null;
    }

    const records = filesByProject.get(projectId) ?? [];
    return records.find((file) => file.id === fileId) ?? null;
  },

  resetForTests(): void {
    projectsByOrg.clear();
    filesByProject.clear();
    syncTimesByProject.clear();
    chunksByProject.clear();
    chunkLinksByProject.clear();
    explorerIndexCache.clear();
  },
};
