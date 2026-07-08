/**
 * Express Server Entry Point
 * Initializes the backend API server with middleware and routes
 */

import { randomUUID } from "node:crypto";
import path from "node:path";
import { writeFile as fsWriteFile } from "node:fs/promises";
import express, { type Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { eq, and } from "drizzle-orm";
import { initializeDb, getDbIfInitialized, fileRecords } from "./db";
import type {
  AuthLoginRequest,
  ChatIntentLabel,
  AddProjectMemberRequest,
  AddPlatformOrgUserRequest,
  CreatePlatformOrganizationRequest,
  CreateChatSessionRequest,
  CreateProjectRequest,
  OneDriveConnectRequest,
  OneDriveSyncRequest,
  SendChatMessageRequest,
  UpdateChatSessionRequest,
  UpdateProjectFolderRequest,
  UpdateProjectFeatureRequest,
} from "@contractor/shared";
import { isOrgPowerUser } from "@contractor/shared";
import { getEnv, hasMicrosoftOAuthConfig } from "./config/env";
import { AppError, asyncHandler, isAppError } from "./lib/errors";
import { logger } from "./lib/logger";
import {
  guessMimeType,
  isLocalCorpusItemId,
  readLocalCorpusFile,
  resolveLocalCorpusAbsolutePath,
} from "./services/local-corpus.utils";
import {
  authService,
  chatService,
  documentRelationshipService,
  excelEditorService,
  featureService,
  healthService,
  indexingService,
  onedriveService,
  pdfMarkupService,
  projectService,
  projectAccessService,
  platformAdminService,
  assertPlatformOperator,
  retrievalService,
  startIndexingWorker,
  syncService,
} from "./services";
import { toMarkupExportRows } from "./services/markup-export.utils";
import { toUuid } from "./services/service-types";
import type { ProjectAccessContext } from "./services/project-access.service";

// Load environment variables from both package and workspace root locations.
const dotenvCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

for (const envPath of [...new Set(dotenvCandidates)]) {
  dotenv.config({ path: envPath, override: false });
}

// ================================
// Types
// ================================

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        email: string;
        name: string;
        orgId: string;
        orgName: string;
        role: "super" | "admin" | "pm" | "member";
      };
      orgId?: string;
    }
  }
}

// ================================
// MIDDLEWARE
// ================================

/**
 * Auth middleware for bearer session tokens issued by authService.
 */
function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  void (async () => {
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const user = await authService.getRequestUser(token);

      if (user) {
        req.user = user;
        req.orgId = user.orgId;
        logger.info("auth.token.received", {
          requestId: req.requestId,
          tokenPreview: `${token.slice(0, 8)}...`,
        });
      }
    }

    next();
  })().catch(next);
}

function requireAuthenticatedRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.orgId) {
    next(new AppError(401, "unauthorized", "Unauthorized"));
    return;
  }

  next();
}

function requirePlatformOperator(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new AppError(401, "unauthorized", "Unauthorized"));
    return;
  }

  try {
    assertPlatformOperator(req.user.email);
    next();
  } catch (error) {
    next(error);
  }
}

function projectAccessFromRequest(req: Request): ProjectAccessContext {
  return {
    userId: toUuid(req.user!.id),
    orgId: toUuid(req.orgId!),
    orgRole: req.user!.role,
    userEmail: req.user!.email,
  };
}

const ALLOWED_CHAT_INTENTS = new Set<ChatIntentLabel>([
  "greeting",
  "file_lookup",
  "active_doc_qa",
  "status_check",
  "schedule_risk",
  "cost_risk",
  "contract_notice",
  "document_summary",
  "general_qa",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseSendChatMessageRequest(body: unknown): Omit<SendChatMessageRequest, "sessionId"> {
  if (!isRecord(body)) {
    throw new AppError(400, "invalid_request", "Request body must be an object");
  }

  const message = body.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new AppError(400, "invalid_message", "message is required");
  }
  if (message.length > 4000) {
    throw new AppError(400, "invalid_message", "message must be 4000 characters or fewer");
  }

  const feedbackRaw = body.feedback;
  let parsedFeedback: SendChatMessageRequest["feedback"];
  if (feedbackRaw !== undefined) {
    if (!isRecord(feedbackRaw)) {
      throw new AppError(400, "invalid_feedback", "feedback must be an object");
    }

    const verdict = feedbackRaw.verdict;
    if (verdict !== "accepted" && verdict !== "corrected" && verdict !== "irrelevant") {
      throw new AppError(400, "invalid_feedback", "feedback.verdict is invalid");
    }

    const correctedIntent = feedbackRaw.correctedIntent;
    if (correctedIntent !== undefined) {
      if (typeof correctedIntent !== "string" || !ALLOWED_CHAT_INTENTS.has(correctedIntent as ChatIntentLabel)) {
        throw new AppError(400, "invalid_feedback", "feedback.correctedIntent is invalid");
      }
    }

    if (verdict === "corrected" && correctedIntent === undefined) {
      throw new AppError(400, "invalid_feedback", "feedback.correctedIntent is required when verdict is corrected");
    }

    const note = feedbackRaw.note;
    if (note !== undefined) {
      if (typeof note !== "string") {
        throw new AppError(400, "invalid_feedback", "feedback.note must be a string");
      }
      if (note.length > 1000) {
        throw new AppError(400, "invalid_feedback", "feedback.note must be 1000 characters or fewer");
      }
    }

    const parsedCorrectedIntent =
      typeof correctedIntent === "string"
        ? (correctedIntent as ChatIntentLabel)
        : undefined;

    parsedFeedback = {
      verdict,
      correctedIntent: parsedCorrectedIntent,
      note: typeof note === "string" ? note : undefined,
    };
  }

  return {
    message,
    history: Array.isArray(body.history)
      ? (body.history as SendChatMessageRequest["history"])
      : undefined,
    openDocs: Array.isArray(body.openDocs)
      ? (body.openDocs as SendChatMessageRequest["openDocs"])
      : undefined,
    activeDocFileName:
      typeof body.activeDocFileName === "string" ? body.activeDocFileName : undefined,
    activeDocFileId:
      typeof body.activeDocFileId === "string"
        ? (body.activeDocFileId as SendChatMessageRequest["activeDocFileId"])
        : undefined,
    feedback: parsedFeedback,
  };
}

// ================================
// ROUTE HANDLERS (Stubs for Phase 1)
// ================================
const handleAuthLogin = asyncHandler(async (req, res) => {
  const response = await authService.login(req.body as AuthLoginRequest);
  res.json(response);
});

const handleAuthMe = asyncHandler(async (req, res) => {
  const response = await authService.getCurrentUser(req.user);
  res.json(response);
});

const handleAuthOnboardingComplete = asyncHandler(async (req, res) => {
  const jobRole =
    typeof (req.body as { jobRole?: unknown }).jobRole === "string"
      ? (req.body as { jobRole: string }).jobRole.trim()
      : undefined;
  const response = await authService.completeOnboarding(req.user, jobRole);
  res.json(response);
});

const handleOneDriveConnect = asyncHandler(async (req, res) => {
  const response = await onedriveService.connect(
    req.body as OneDriveConnectRequest,
    req.user
  );
  res.json(response);
});

const handleOneDriveConnectStart = asyncHandler(async (req, res) => {
  const redirectUri =
    typeof req.query.redirectUri === "string" ? req.query.redirectUri : undefined;
  res.json(onedriveService.getConnectUrl(req.user, redirectUri));
});

const handleOneDriveStatus = asyncHandler(async (req, res) => {
  res.json(await onedriveService.getStatus(req.user));
});

const handleOneDriveSync = asyncHandler(async (req, res) => {
  const body = req.body as OneDriveSyncRequest;
  res.json(await syncService.syncProjectMetadata(body.projectId, req.user, req.orgId));
});

const handleGetProjects = asyncHandler(async (req, res) => {
  res.json(
    await projectService.listProjects(req.orgId, projectAccessFromRequest(req))
  );
});

const handleCreateProject = asyncHandler(async (req, res) => {
  if (!isOrgPowerUser(req.user?.role)) {
    throw new AppError(
      403,
      "forbidden",
      "Only org operators can create projects. Ask your administrator for access."
    );
  }

  const response = await projectService.createProject(
    req.body as CreateProjectRequest,
    req.orgId,
    toUuid(req.user!.id)
  );
  res.json(response);
});

const handleGetProjectMembers = asyncHandler(async (req, res) => {
  res.json(
    await projectAccessService.listMembers(
      toUuid(req.params.id),
      projectAccessFromRequest(req)
    )
  );
});

const handleAddProjectMember = asyncHandler(async (req, res) => {
  const body = req.body as AddProjectMemberRequest;
  res.json(
    await projectAccessService.addMember(
      toUuid(req.params.id),
      body.email,
      body.projectRole ?? "member",
      projectAccessFromRequest(req),
      { promoteToOrgAdmin: body.promoteToOrgAdmin === true }
    )
  );
});

const handleRemoveProjectMember = asyncHandler(async (req, res) => {
  await projectAccessService.removeMember(
    toUuid(req.params.id),
    toUuid(req.params.userId),
    projectAccessFromRequest(req)
  );
  res.status(204).send();
});

const handleListPlatformOrganizations = asyncHandler(async (_req, res) => {
  res.json(await platformAdminService.listOrganizations());
});

const handleCreatePlatformOrganization = asyncHandler(async (req, res) => {
  const body = req.body as CreatePlatformOrganizationRequest;
  res.json(await platformAdminService.createOrganization(body.name, body.onedriveTenantId));
});

const handleListPlatformOrgUsers = asyncHandler(async (req, res) => {
  res.json(await platformAdminService.listOrganizationUsers(toUuid(req.params.orgId)));
});

const handleAddPlatformOrgUser = asyncHandler(async (req, res) => {
  const body = req.body as AddPlatformOrgUserRequest;
  res.json(
    await platformAdminService.addUserToOrganization(toUuid(req.params.orgId), body.email, {
      name: body.name,
      role: body.role,
    })
  );
});

const handleCreateChatSession = asyncHandler(async (req, res) => {
  const body = req.body as CreateChatSessionRequest;
  await projectAccessService.assertCanAccessProject(
    body.projectId,
    projectAccessFromRequest(req)
  );
  res.json(await chatService.createSession(body.projectId, req.user));
});

const handleSendChatMessage = asyncHandler(async (req, res) => {
  const body = parseSendChatMessageRequest(req.body);
  res.json(
    await chatService.sendMessage(
      toUuid(req.params.id),
      body.message,
      body.history,
      body.openDocs,
      body.activeDocFileName,
      body.activeDocFileId,
      body.feedback,
      req.user
    )
  );
});

const handleGetProjectFeatures = asyncHandler(async (req, res) => {
  res.json(await featureService.getProjectFeatures(toUuid(req.params.id)));
});

const handleUpdateProjectFeature = asyncHandler(async (req, res) => {
  const body = req.body as UpdateProjectFeatureRequest;
  res.json(
    await featureService.updateProjectFeature(
      toUuid(req.params.id),
      req.params.fid,
      body.enabled,
      body.config
    )
  );
});

const handleGetFeatureRegistry = asyncHandler(async (_req, res) => {
  res.json(await featureService.getRegistry());
});

// ================================
// APP INITIALIZATION
// ================================

async function createApp(): Promise<Express> {
  const app = express();
  const env = getEnv();

  // Middleware
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader("x-request-id", req.requestId);

    const startedAt = Date.now();
    logger.info("http.request.started", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
    });

    res.on("finish", () => {
      logger.info("http.request.completed", {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  });

  if (env.webOrigins.length > 0) {
    app.use((req, res, next) => {
      const requestOrigin = req.headers.origin;
      const allowedOrigin =
        requestOrigin && env.webOrigins.includes(requestOrigin)
          ? requestOrigin
          : env.webOrigins[0];

      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type, X-Requested-With"
      );
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }

      next();
    });
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auth middleware (optional for routes that don't require it)
  app.use(authMiddleware);

  // Health check
  app.get("/health", asyncHandler(async (_req, res) => {
    const health = await healthService.getSystemHealth();
    const statusCode = health.status === "error" ? 503 : 200;
    res.status(statusCode).json(health);
  }));
  app.get("/health/api", asyncHandler(async (_req, res) => {
    res.json(await healthService.getApiHealth());
  }));
  app.get("/health/db", asyncHandler(async (_req, res) => {
    const health = await healthService.getDatabaseHealth();
    res.status(health.status === "error" ? 503 : 200).json(health);
  }));
  app.get("/health/queue", asyncHandler(async (_req, res) => {
    const health = await healthService.getQueueHealth();
    res.status(health.status === "error" ? 503 : 200).json(health);
  }));

  // ================================
  // API ROUTES
  // ================================

  // Auth
  app.get("/api/auth/login", asyncHandler(async (req, res) => {
    const redirectUri = typeof req.query.redirectUri === "string"
      ? req.query.redirectUri
      : undefined;
    const prompt = typeof req.query.prompt === "string"
      ? req.query.prompt
      : undefined;
    const allowedPrompt =
      prompt === "select_account" || prompt === "login" || prompt === "consent"
        ? prompt
        : undefined;
    const { authorizationUrl } = authService.getLoginUrl(redirectUri, allowedPrompt);
    res.redirect(302, authorizationUrl);
  }));
  app.post("/api/auth/login", handleAuthLogin);
  app.post("/api/auth/refresh", asyncHandler(async (req, res) => {
    const refreshToken = (req.body as { refreshToken?: string }).refreshToken ?? "";
    res.json(await authService.refresh(refreshToken));
  }));
  app.post("/api/auth/logout", asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;
    const refreshToken = (req.body as { refreshToken?: string }).refreshToken;

    await authService.logout(accessToken, refreshToken);
    res.status(204).send();
  }));
  app.get("/api/auth/me", handleAuthMe);
  app.post(
    "/api/auth/onboarding-complete",
    requireAuthenticatedRequest,
    handleAuthOnboardingComplete
  );

  app.get(
    "/api/platform/organizations",
    requireAuthenticatedRequest,
    requirePlatformOperator,
    handleListPlatformOrganizations
  );
  app.post(
    "/api/platform/organizations",
    requireAuthenticatedRequest,
    requirePlatformOperator,
    handleCreatePlatformOrganization
  );
  app.get(
    "/api/platform/organizations/:orgId/users",
    requireAuthenticatedRequest,
    requirePlatformOperator,
    handleListPlatformOrgUsers
  );
  app.post(
    "/api/platform/organizations/:orgId/users",
    requireAuthenticatedRequest,
    requirePlatformOperator,
    handleAddPlatformOrgUser
  );

  // OneDrive
  app.get(
    "/api/onedrive/connect/start",
    requireAuthenticatedRequest,
    handleOneDriveConnectStart
  );
  app.post("/api/onedrive/connect", requireAuthenticatedRequest, handleOneDriveConnect);
  app.get("/api/onedrive/status", requireAuthenticatedRequest, handleOneDriveStatus);
  app.post("/api/onedrive/sync", requireAuthenticatedRequest, handleOneDriveSync);
  app.get("/api/onedrive/browse", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const folderId = typeof req.query.folderId === "string" ? req.query.folderId : undefined;
    res.json(await onedriveService.browse(req.user, folderId));
  }));

  // Projects
  app.get("/api/projects", requireAuthenticatedRequest, handleGetProjects);
  app.post("/api/projects", requireAuthenticatedRequest, handleCreateProject);
  app.get(
    "/api/projects/:id/members",
    requireAuthenticatedRequest,
    handleGetProjectMembers
  );
  app.post(
    "/api/projects/:id/members",
    requireAuthenticatedRequest,
    handleAddProjectMember
  );
  app.delete(
    "/api/projects/:id/members/:userId",
    requireAuthenticatedRequest,
    handleRemoveProjectMember
  );
  app.patch("/api/projects/:id", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectAccessService.assertCanManageMembers(projectId, projectAccessFromRequest(req));

    const body = req.body as UpdateProjectFolderRequest;
    const nextFolderId = body.onedriveFolderId?.trim();
    if (!nextFolderId) {
      throw new AppError(400, "invalid_folder", "onedriveFolderId is required");
    }

    const project = await projectService.updateProjectFolderBinding(projectId, nextFolderId, {
      clearIndexedData: body.resetIndexedData === true,
    });

    // Reset any stale progress snapshot immediately so polling never sees old-folder data.
    // inProgress:true avoids a false "idle" flash before the async sync begins.
    syncService.resetProjectSyncProgress(
      projectId,
      "Project folder updated. Sync starting in background."
    );

    // Fire sync without awaiting — syncProjectMetadata can take minutes for large folders.
    // Always handle rejections so an indexing startup failure cannot crash the process.
    void syncService
      .syncProjectMetadata(projectId, req.user, req.orgId)
      .catch((error) => {
        logger.error("projects.folder-update.sync-start.failed", error, {
          requestId: req.requestId,
          projectId,
        });
      });

    res.json({
      project,
      resetPerformed: body.resetIndexedData === true,
      sync: {
        syncStarted: true,
        message: "Sync started in background. Poll /sync/progress for updates.",
      },
      message:
        body.resetIndexedData === true
          ? "Project folder updated and previous indexed data cleared."
          : "Project folder updated.",
    });
  }));
  app.get("/api/projects/:id", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    res.json(await projectService.getProjectDetails(toUuid(req.params.id)));
  }));
  app.get("/api/projects/:id/files", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 50);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const tags = typeof req.query.tags === "string"
      ? req.query.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      : undefined;

    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));

    const response = await projectService.listProjectFiles(projectId, {
      page,
      pageSize,
      search,
      category,
      tags,
    });
    res.json(response);
  }));
  app.get("/api/projects/:id/files/:fileId/content", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    const fileId = toUuid(req.params.fileId);

    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));

    const file = await projectService.getProjectFileById(projectId, fileId);
    if (!file) {
      res.status(404).json({ error: "file_not_found", message: "Project file not found" });
      return;
    }

    if (!file.onedriveItemId) {
      res.status(400).json({ error: "file_source_missing", message: "File source identifier is missing" });
      return;
    }

    const safeName = file.fileName.replace(/\"/g, "");

    if (isLocalCorpusItemId(file.onedriveItemId)) {
      const env = getEnv();
      let deepLinkUrl: string | null | undefined;
      const db = getDbIfInitialized();
      if (db) {
        const [row] = await db
          .select({ deepLinkUrl: fileRecords.deepLinkUrl })
          .from(fileRecords)
          .where(and(eq(fileRecords.projectId, projectId), eq(fileRecords.id, fileId)))
          .limit(1);
        deepLinkUrl = row?.deepLinkUrl;
      }

      const absolutePath = resolveLocalCorpusAbsolutePath({
        onedriveItemId: file.onedriveItemId,
        filePath: file.filePath,
        deepLinkUrl,
        corpusParent: env.localCorpusParent,
      });

      if (!absolutePath) {
        res.status(400).json({
          error: "local_corpus_not_configured",
          message:
            "LOCAL_CORPUS_PARENT is not configured. Set it to the OneDrive parent folder that contains the indexed corpus.",
        });
        return;
      }

      try {
        const buffer = readLocalCorpusFile(absolutePath);
        res.setHeader("Content-Type", guessMimeType(file.fileName, file.mimeType ?? undefined));
        res.setHeader("Content-Disposition", `inline; filename=\"${safeName}\"`);
        res.send(buffer);
        return;
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        logger.warn("project.file_content.local_read_failed", {
          projectId,
          fileId,
          absolutePath,
          details,
        });
        res.status(404).json({
          error: "local_corpus_file_missing",
          message: "Indexed file is not available on disk at the expected local path.",
          details: { path: absolutePath },
        });
        return;
      }
    }

    const fileContent = await onedriveService.downloadFileContent(req.user, file.onedriveItemId);
    const contentType = fileContent.contentType ?? file.mimeType ?? "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename=\"${safeName}\"`);
    res.send(fileContent.buffer);
  }));
  app.get("/api/projects/:id/files/:fileId/markups", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    const fileId = toUuid(req.params.fileId);
    const pageNumberRaw = typeof req.query.page === "string" ? Number(req.query.page) : undefined;
    const pageNumber = Number.isFinite(pageNumberRaw) && Number(pageNumberRaw) > 0
      ? Math.floor(Number(pageNumberRaw))
      : undefined;

    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const file = await projectService.getProjectFileById(projectId, fileId);
    if (!file) {
      res.status(404).json({ error: "file_not_found", message: "Project file not found" });
      return;
    }

    const markups = await pdfMarkupService.list(projectId, fileId, pageNumber);
    res.json({ markups });
  }));
  app.post("/api/projects/:id/files/:fileId/markups", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    const fileId = toUuid(req.params.fileId);

    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const file = await projectService.getProjectFileById(projectId, fileId);
    if (!file) {
      res.status(404).json({ error: "file_not_found", message: "Project file not found" });
      return;
    }

    const body = req.body as {
      pageNumber?: number;
      type?: string;
      coordinates?: Record<string, unknown>;
      measurement?: { kind?: "calibration" | "length" | "area" | "count"; value?: number; unit?: string };
      category?: string;
      status?: string;
      comment?: string;
      assignedTo?: string;
    };

    if (!body || typeof body !== "object" || typeof body.type !== "string" || !body.type.trim()) {
      res.status(400).json({ error: "invalid_request", message: "type is required" });
      return;
    }

    const markup = await pdfMarkupService.create(projectId, fileId, req.user?.name ?? "Unknown", {
      pageNumber: Number(body.pageNumber ?? 1),
      type: body.type,
      coordinates: body.coordinates,
      measurement: body.measurement,
      category: body.category,
      status: body.status,
      comment: body.comment,
      assignedTo: body.assignedTo,
    });

    res.status(201).json({ markup });
  }));
  app.patch("/api/projects/:id/files/:fileId/markups/:markupId", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    const fileId = toUuid(req.params.fileId);
    const markupId = toUuid(req.params.markupId);

    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const file = await projectService.getProjectFileById(projectId, fileId);
    if (!file) {
      res.status(404).json({ error: "file_not_found", message: "Project file not found" });
      return;
    }

    const body = req.body as {
      pageNumber?: number;
      type?: string;
      coordinates?: Record<string, unknown>;
      measurement?: { kind?: "calibration" | "length" | "area" | "count"; value?: number; unit?: string };
      category?: string;
      status?: string;
      comment?: string;
      assignedTo?: string;
    };

    const markup = await pdfMarkupService.update(projectId, fileId, markupId, {
      pageNumber: body?.pageNumber,
      type: body?.type,
      coordinates: body?.coordinates,
      measurement: body?.measurement,
      category: body?.category,
      status: body?.status,
      comment: body?.comment,
      assignedTo: body?.assignedTo,
    });

    if (!markup) {
      res.status(404).json({ error: "markup_not_found", message: "Markup not found" });
      return;
    }

    res.json({ markup });
  }));
  app.delete("/api/projects/:id/files/:fileId/markups/:markupId", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    const fileId = toUuid(req.params.fileId);
    const markupId = toUuid(req.params.markupId);

    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const file = await projectService.getProjectFileById(projectId, fileId);
    if (!file) {
      res.status(404).json({ error: "file_not_found", message: "Project file not found" });
      return;
    }

    const removed = await pdfMarkupService.remove(projectId, fileId, markupId);
    if (!removed) {
      res.status(404).json({ error: "markup_not_found", message: "Markup not found" });
      return;
    }

    res.status(204).send();
  }));
  app.get("/api/projects/:id/files/:fileId/markups/export", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    const fileId = toUuid(req.params.fileId);
    const format = typeof req.query.format === "string" ? req.query.format.toLowerCase() : "csv";

    const project = await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const file = await projectService.getProjectFileById(projectId, fileId);
    if (!file) {
      res.status(404).json({ error: "file_not_found", message: "Project file not found" });
      return;
    }

    const markups = await pdfMarkupService.list(projectId, fileId);
    const rows = toMarkupExportRows(project.name, file.fileName, markups);

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Markups");
      const workbookBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=\"${file.fileName.replace(/\"/g, "")}-markups.xlsx\"`);
      res.send(workbookBuffer);
      return;
    }

    const csv = Papa.unparse(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${file.fileName.replace(/\"/g, "")}-markups.csv\"`);
    res.send(csv);
  }));
  // --------------------------------
  // AI-proposed Excel cell edits
  // Only local-corpus files are supported; OneDrive files are read-only
  // until the OAuth scope is upgraded to Files.ReadWrite.
  // TODO (OneDrive write): call onedriveService.uploadFileContent() here
  //   after the scope upgrade and re-auth migration are complete.
  // --------------------------------
  app.post("/api/projects/:id/files/:fileId/excel-edit", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    const fileId = toUuid(req.params.fileId);

    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const file = await projectService.getProjectFileById(projectId, fileId);
    if (!file) {
      res.status(404).json({ error: "file_not_found", message: "Project file not found" });
      return;
    }

    if (!isLocalCorpusItemId(file.onedriveItemId)) {
      res.status(400).json({
        error: "onedrive_file_readonly",
        message: "Excel edits are only supported for local-corpus files. OneDrive files are read-only until write scope is enabled.",
      });
      return;
    }

    const body = req.body as { sheetName?: unknown; edits?: unknown };
    if (typeof body.sheetName !== "string" || !body.sheetName.trim()) {
      res.status(400).json({ error: "invalid_request", message: "sheetName is required" });
      return;
    }
    if (!Array.isArray(body.edits) || body.edits.length === 0) {
      res.status(400).json({ error: "invalid_request", message: "edits must be a non-empty array" });
      return;
    }
    if (body.edits.length > 500) {
      res.status(400).json({ error: "invalid_request", message: "edits must not exceed 500 cells per request" });
      return;
    }

    const env = getEnv();
    const db = getDbIfInitialized();

    const [fileRow] = db
      ? await db.select({ deepLinkUrl: fileRecords.deepLinkUrl }).from(fileRecords)
          .where(and(eq(fileRecords.projectId, projectId), eq(fileRecords.id, fileId))).limit(1)
      : [];

    const absolutePath = resolveLocalCorpusAbsolutePath({
      onedriveItemId: file.onedriveItemId,
      filePath: file.filePath,
      deepLinkUrl: fileRow?.deepLinkUrl,
      corpusParent: env.localCorpusParent,
    });

    if (!absolutePath) {
      res.status(400).json({ error: "local_corpus_not_configured", message: "LOCAL_CORPUS_PARENT is not configured." });
      return;
    }

    const fileBuffer = readLocalCorpusFile(absolutePath);

    // Validate sheet exists before attempting edits
    const sheetNames = excelEditorService.getSheetNames(fileBuffer);
    if (!sheetNames.includes(body.sheetName)) {
      res.status(404).json({
        error: "sheet_not_found",
        message: `Sheet "${body.sheetName}" not found. Available: ${sheetNames.join(", ")}`,
      });
      return;
    }

    const edits = (body.edits as Array<{ cell?: unknown; value?: unknown }>)
      .filter((e) => typeof e.cell === "string" && (typeof e.value === "string" || typeof e.value === "number"))
      .map((e) => ({ cell: e.cell as string, value: e.value as string | number }));

    const modifiedBuffer = excelEditorService.applyExcelEdits(fileBuffer, body.sheetName, edits);
    await fsWriteFile(absolutePath, modifiedBuffer);

    // Mark file as pending re-index so next sync picks up the changes
    if (db) {
      await db.update(fileRecords)
        .set({ indexStatus: "pending", lastIndexed: null, updatedAt: new Date() })
        .where(and(eq(fileRecords.projectId, projectId), eq(fileRecords.id, fileId)));
    }

    logger.info("excel-edit.applied", { projectId, fileId, sheetName: body.sheetName, editCount: edits.length, user: req.user?.name });

    res.json({ success: true, editsApplied: edits.length });
  }));

  app.get("/api/projects/:id/indexing/progress", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    res.json(await indexingService.getProjectIndexingProgress(projectId));
  }));
  app.get("/api/projects/:id/sync/progress", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    res.json(syncService.getProjectSyncProgress(projectId));
  }));
  app.get("/api/projects/:id/chunks", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    res.json({ chunks: await projectService.listProjectChunks(projectId) });
  }));
  app.get("/api/projects/:id/retrieval/preview", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const query = typeof req.query.q === "string" ? req.query.q : "";

    const topK = typeof req.query.topK === "string" ? Number(req.query.topK) : undefined;
    const minRelevance =
      typeof req.query.minRelevance === "string" ? Number(req.query.minRelevance) : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const tags =
      typeof req.query.tags === "string"
        ? req.query.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : undefined;

    res.json({
      sources: await retrievalService.retrieveSources(projectId, query, {
        topK,
        minRelevance,
        category,
        tags,
      }),
    });
  }));

  // ---- Indexing Branch: Context & Search API (consumed by AI Chat Branch) ----

  // Semantic search: POST /api/projects/:id/search
  // Body: { query, topK?, minRelevance?, category?, tags?, includeChunks? }
  app.post("/api/projects/:id/search", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const body = req.body as {
      query?: string;
      topK?: number;
      minRelevance?: number;
      category?: string;
      tags?: string[];
      includeChunks?: boolean;
    };
    if (!body.query?.trim()) {
      res.status(400).json({ error: "query is required" });
      return;
    }
    res.json(
      await retrievalService.searchProject(projectId, body.query, {
        topK: body.topK,
        minRelevance: body.minRelevance,
        category: body.category,
        tags: body.tags,
        includeChunks: body.includeChunks,
      })
    );
  }));

  // Project context snapshot: GET /api/projects/:id/context
  app.get("/api/projects/:id/context", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    res.json(await retrievalService.getProjectContext(projectId));
  }));

  // Suggestions: GET /api/projects/:id/suggestions?q=optional_current_query
  app.get("/api/projects/:id/suggestions", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const currentQuery = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json({ suggestions: await retrievalService.getSuggestions(projectId, currentQuery) });
  }));

  // Document detail: GET /api/files/:fileId?projectId=...
  app.get("/api/files/:fileId", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const fileId = toUuid(req.params.fileId);
    const projectId = typeof req.query.projectId === "string"
      ? toUuid(req.query.projectId)
      : undefined;
    if (!projectId) {
      res.status(400).json({ error: "projectId query param is required" });
      return;
    }
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const doc = await retrievalService.getDocumentDetail(fileId, projectId);
    if (!doc) {
      res.status(404).json({ error: "document_not_found" });
      return;
    }
    res.json(doc);
  }));

  // Document relationships: POST /api/projects/:id/relationships/build
  app.post("/api/projects/:id/relationships/build", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const projectId = toUuid(req.params.id);
    await projectService.getProjectOrThrow(projectId, req.orgId, projectAccessFromRequest(req));
    const result = await documentRelationshipService.buildRelationships(projectId);
    res.json(result);
  }));

  // Chat
  app.post("/api/chat/sessions", requireAuthenticatedRequest, handleCreateChatSession);
  app.get("/api/chat/sessions", requireAuthenticatedRequest, asyncHandler(async (_req, res) => {
    res.json(await chatService.listSessionsForUser(_req.user));
  }));
  app.patch("/api/chat/sessions/:id", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    const sessionId = toUuid(req.params.id);
    const { title, pinned } = req.body as { title?: string; pinned?: boolean };
    res.json(await chatService.updateSession(sessionId, { title, pinned }, req.user));
  }));
  app.delete("/api/chat/sessions/:id", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    await chatService.deleteSession(toUuid(req.params.id), req.user);
    res.status(204).end();
  }));
  app.post("/api/chat/sessions/:id/message", requireAuthenticatedRequest, handleSendChatMessage);
  app.get("/api/chat/sessions/:id/messages", requireAuthenticatedRequest, asyncHandler(async (req, res) => {
    res.json(await chatService.getHistoryForUser(toUuid(req.params.id), req.user));
  }));

  // Features
  app.get("/api/projects/:id/features", handleGetProjectFeatures);
  app.put("/api/projects/:id/features/:fid", handleUpdateProjectFeature);
  app.get("/api/features/registry", handleGetFeatureRegistry);

  app.use((req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: `No route registered for ${req.method} ${req.path}`,
      requestId: req.requestId,
    });
  });

  // Default error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = isAppError(err) ? err.statusCode : 500;
    logger.error("http.request.failed", err, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
    });

    if (isAppError(err)) {
      res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
        details: err.details,
        requestId: req.requestId,
      });
      return;
    }

    const isProduction = process.env.NODE_ENV === "production";
    res.status(500).json({
      error: "internal_server_error",
      message: isProduction ? "Internal Server Error" : err.message || "Internal Server Error",
      requestId: req.requestId,
    });
  });

  return app;
}

// ================================
// SERVER START
// ================================

function formatListenError(error: NodeJS.ErrnoException, port: number): string {
  if (error.code === "EADDRINUSE") {
    return `Port ${port} is already in use. Stop the existing process or set a different PORT before starting the backend.`;
  }

  if (error.code === "EACCES") {
    return `Insufficient permissions to bind to port ${port}.`;
  }

  return error.message || "Failed to bind backend server port.";
}

async function startServer() {
  try {
    const env = getEnv();

    if (hasMicrosoftOAuthConfig(env)) {
      logger.info("auth.oauth.config.loaded", {
        redirectUri: env.oauthRedirectUri,
      });
    } else {
      logger.warn("auth.oauth.config.missing", {
        message: "Microsoft OAuth is not configured yet. Auth routes remain stubbed.",
      });
    }

    // Initialize database when configured; otherwise continue in in-memory mode.
    if (env.databaseUrl) {
      await initializeDb(env.databaseUrl);
      logger.info("database.initialized", {
        hasRedisConfig: Boolean(env.redisUrl),
      });
    } else {
      logger.warn("database.config.missing", {
        message:
          "DATABASE_URL is not configured. Starting backend with in-memory fallbacks for local testing.",
      });
    }

    const indexingWorkerRuntime = startIndexingWorker();

    // Create and start Express app
    const app = await createApp();

    const server = app.listen(env.port);

    server.once("listening", () => {
      logger.info("server.started", {
        port: env.port,
        baseUrl: env.apiBaseUrl,
        healthUrl: `${env.apiBaseUrl}/health`,
      });
    });

    server.once("error", (error: NodeJS.ErrnoException) => {
      void (async () => {
        logger.error("server.listen.failed", {
          code: error.code,
          port: env.port,
          message: formatListenError(error, env.port),
        });

        if (indexingWorkerRuntime) {
          try {
            await indexingWorkerRuntime.close();
          } catch (workerError) {
            logger.warn("server.listen.failed.worker-close", {
              message: workerError instanceof Error ? workerError.message : String(workerError),
            });
          }
        }

        process.exit(1);
      })();
    });

    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
      logger.info("server.shutdown.started", { signal });

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      if (indexingWorkerRuntime) {
        await indexingWorkerRuntime.close();
      }

      logger.info("server.shutdown.completed", { signal });
      process.exit(0);
    };

    process.once("SIGINT", () => {
      void shutdown("SIGINT").catch((error) => {
        logger.error("server.shutdown.failed", error, { signal: "SIGINT" });
        process.exit(1);
      });
    });
    process.once("SIGTERM", () => {
      void shutdown("SIGTERM").catch((error) => {
        logger.error("server.shutdown.failed", error, { signal: "SIGTERM" });
        process.exit(1);
      });
    });
  } catch (error) {
    logger.error("server.start.failed", error);
    process.exit(1);
  }
}

// Start if this is the main module
if (require.main === module) {
  startServer();
}

export { createApp };
