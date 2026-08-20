/**
 * API Request/Response Types
 * Contracts for all backend endpoints
 */

import type {
  UUID,
  User,
  Project,
  FileRecord,
  ChatSession,
  ChatMessage,
  OneDriveStatus,
  ProjectFeature,
  Feature,
  UserRole,
  ProjectMemberRole,
} from "./entities";

// ================================
// AUTH
// ================================

export interface AuthLoginRequest {
  code: string; // OAuth2 authorization code
  redirectUri: string;
  state?: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface AuthRefreshRequest {
  refreshToken: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface AuthMeResponse {
  user: User;
  organization: {
    id: UUID;
    name: string;
  };
  capabilities?: {
    isPlatformOperator: boolean;
    inviteOnlyAuth: boolean;
  };
}

export interface OnboardingCompleteResponse {
  user: User;
}

// ================================
// ONEDRIVE
// ================================

export interface OneDriveConnectRequest {
  code: string; // OAuth2 code from Microsoft
  redirectUri: string;
  state: string;
}

export interface OneDriveConnectStartResponse {
  authorizationUrl: string;
  state: string;
}

export interface OneDriveConnectResponse {
  connected: boolean;
  message: string;
}

export interface OneDriveStatusResponse extends OneDriveStatus {}

export interface OneDriveSyncRequest {
  projectId: UUID;
}

export interface OneDriveSyncResponse {
  syncStarted: boolean;
  message: string;
  jobId?: string;
  scannedFileCount?: number;
  supportedFileCount?: number;
  unsupportedFileCount?: number;
  lastSyncedAt?: Date;
}

export interface OneDriveBrowseItem {
  id: string; // OneDrive item ID
  name: string;
  isFolder: boolean;
  webUrl: string;
  lastModified?: Date;
  size?: number;
}

export interface OneDriveBrowseResponse {
  items: OneDriveBrowseItem[];
  parentId?: string;
}

// ================================
// PROJECTS
// ================================

export interface ProjectListResponse {
  projects: Project[];
}

export interface ProjectMember {
  userId: UUID;
  email: string;
  name: string;
  orgRole: UserRole;
  projectRole: ProjectMemberRole;
  createdAt: Date;
}

export interface ProjectMembersResponse {
  projectId: UUID;
  members: ProjectMember[];
  currentUserProjectRole?: ProjectMemberRole;
  canManageMembers: boolean;
  canPromoteOrgAdmin?: boolean;
}

export interface AddProjectMemberRequest {
  email: string;
  projectRole?: ProjectMemberRole;
  /** Org power users only: also grant org admin when onboarding a project lead. */
  promoteToOrgAdmin?: boolean;
}

export interface AddProjectMemberResponse {
  member: ProjectMember;
}

export interface PlatformOrganization {
  id: UUID;
  name: string;
  onedriveTenantId?: string;
  createdAt: Date;
}

export interface PlatformOrganizationsResponse {
  organizations: PlatformOrganization[];
}

export interface CreatePlatformOrganizationRequest {
  name: string;
  onedriveTenantId?: string;
}

export interface CreatePlatformOrganizationResponse {
  organization: PlatformOrganization;
}

export interface PlatformOrgUser {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface PlatformOrgUsersResponse {
  users: PlatformOrgUser[];
}

export interface AddPlatformOrgUserRequest {
  email: string;
  name?: string;
  role?: UserRole;
}

export interface AddPlatformOrgUserResponse {
  user: PlatformOrgUser & { orgId: UUID };
  organization: {
    id: UUID;
    name: string;
  };
}

export interface CreateProjectRequest {
  name: string;
  onedriveFolderId: string; // OneDrive folder the user selected
}

export interface CreateProjectResponse {
  project: Project;
}

export interface UpdateProjectFolderRequest {
  onedriveFolderId: string;
  resetIndexedData?: boolean;
}

export interface BindProjectDriveRequest {
  /** Owner's Graph driveId (e.g. 78BEF1F85B43E5D5). */
  driveId: string;
  /** Owner's root folderId for this project. */
  folderId: string;
}

export interface UpdateProjectFolderResponse {
  project: Project;
  resetPerformed: boolean;
  sync: OneDriveSyncResponse;
  message: string;
}

export interface ProjectDetailsResponse {
  project: Project;
  onedrive: OneDriveStatus;
  fileCount: number;
  lastSyncedAt?: Date;
}

export interface ProjectFilesRequest {
  projectId: UUID;
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  tags?: string[];
}

export interface ProjectFilesResponse {
  files: FileRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ProjectExplorerFolderSummary {
  name: string;
  path: string;
  fileCount: number;
}

export interface ProjectExplorerFolderResponse {
  folderPath: string;
  folders: ProjectExplorerFolderSummary[];
  files: FileRecord[];
  totalProjectFiles: number;
  lastSyncedAt?: string | null;
}

export interface GroupedIndexingFailureReason {
  stage: string;
  errorCode: string;
  count: number;
  lastMessage: string;
  lastSeenAt: string;
}

export interface IndexingAnomaly {
  type: string;
  count: number;
  message: string;
}

export interface IndexingRecentError {
  fileName: string;
  stage: string;
  errorCode: string;
  errorMessage: string;
  createdAt: string;
}

export interface ProjectIndexingProgressResponse {
  total: number;
  processableTotal: number;
  pending: number;
  processing: number;
  indexed: number;
  failed: number;
  skipped: number;
  unsupportedCount: number;
  oversizeCount: number;
  completionPercent: number;
  paused: boolean;
  pauseReasonCode?: string;
  pauseMessage?: string;
  pauseSince?: string;
  pauseUntil?: string;
  circuitOpen: boolean;
  categoryBreakdown: Record<string, number>;
  recentErrors: IndexingRecentError[];
  groupedFailureReasons: GroupedIndexingFailureReason[];
  anomalies: IndexingAnomaly[];
}

// ================================
// CHAT
// ================================

export interface CreateChatSessionRequest {
  projectId: UUID;
}

export interface CreateChatSessionResponse {
  session: ChatSession;
}

export interface ChatSessionsListResponse {
  sessions: ChatSession[];
}

export interface UpdateChatSessionRequest {
  title?: string;
  pinned?: boolean;
}

export interface UpdateChatSessionResponse {
  session: ChatSession;
}

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface OpenDocContext {
  fileName: string;
  fileId?: UUID;
  page?: number;
}

export type ChatIntentLabel =
  | "greeting"
  | "file_lookup"
  | "active_doc_qa"
  | "status_check"
  | "schedule_risk"
  | "cost_risk"
  | "contract_notice"
  | "document_summary"
  | "general_qa";

export type ClassifierUserRole =
  | "project_manager"
  | "superintendent"
  | "estimator"
  | "owner"
  | "subcontractor"
  | "architect"
  | "engineer"
  | "unknown";

export type ClassifierQuestionType =
  | "rfi"
  | "submittal"
  | "schedule"
  | "cost"
  | "document_qa"
  | "draft_request"
  | "status_check"
  | "risk_flag"
  | "file_lookup"
  | "general";

export type ClassifierRiskLevel = "low" | "medium" | "high" | "critical";

export type ClassifierProceedMode = "ask" | "assume" | "proceed";

export interface ChatInterpretation {
  intent: ChatIntentLabel;
  confidence: number;
  source: "rules" | "llm" | "fallback";
  alternatives?: Array<{
    intent: ChatIntentLabel;
    confidence: number;
  }>;
  entities?: {
    rfiNumber?: string;
    submittalNumber?: string;
    specSection?: string;
    /** Normalized construction IDs detected in the query (e.g. QWP-001, RFI-042). */
    constructionIdentifiers?: string[];
    dateHint?: "recent" | "latest";
    statusHint?: "open" | "pending" | "closed";
  };
  retrievalHints?: {
    preferredCategories?: string[];
    preferredTags?: string[];
    recencyBias?: boolean;
    /** When true, resolve named construction identifiers before fuzzy retrieval. */
    exactIdentifierFirst?: boolean;
  };
  /** Classifier routing fields (populated when LLM classifier is active) */
  userRole?: ClassifierUserRole;
  questionType?: ClassifierQuestionType;
  riskLevel?: ClassifierRiskLevel;
  proceedMode?: ClassifierProceedMode;
  requiredDocTypes?: string[];
  fallbackReason?: string;
}

export interface InterpretationFeedbackEvent {
  verdict: "accepted" | "corrected" | "irrelevant";
  correctedIntent?: ChatIntentLabel;
  note?: string;
}

// ================================
// AGENT ACTIONS
// ================================

/**
 * A write action proposed by the AI agent. Actions are proposals only —
 * they are never executed automatically. The user must confirm in the UI.
 */
export interface AgentAction {
  /** Client-generated UUID for tracking apply/dismiss state */
  id: string;
  tool: string;
  /** ID of the file this action targets */
  fileId: string;
  params: Record<string, unknown>;
  /** Human-readable description shown in the confirmation chip */
  description: string;
}

export interface SendChatMessageRequest {
  sessionId: UUID;
  message: string;
  history?: ChatHistoryTurn[];
  openDocs?: OpenDocContext[];
  activeDocFileName?: string;
  activeDocFileId?: UUID;
  feedback?: InterpretationFeedbackEvent;
}

/**
 * Structured, evidence-grounded answer produced by the Evidence-Based Answer
 * Extractor prompt. This is emitted alongside the rendered markdown `content`:
 * `content` is for display, `answer` is the machine-readable equivalent that
 * carries per-item citations, a status, and an explicit list of anything that
 * could not be verified.
 */
export interface ExtractedAnswer {
  /**
   * complete       — every material part of the question was answered.
   * partial        — some parts answered, others could not be verified.
   * not_found      — correct source located but requested info absent.
   * source_mismatch — retrieved evidence does not match the requested identifier/revision.
   */
  status: "complete" | "partial" | "not_found" | "source_mismatch";
  title: string;
  /** Optional one-sentence direct answer. */
  summary?: string;
  items: Array<{
    label: string;
    value: string;
    /** Ids referencing entries in `citations`. */
    citationIds?: string[];
  }>;
  /** Requested information that could not be verified from the evidence. */
  missing?: string[];
  citations: Array<{
    id: string;
    documentId?: string;
    documentName?: string;
    /** Source file, used to deep-link the citation into the document viewer. */
    fileId?: UUID;
    page?: number;
    /** Shortest supporting excerpt needed to verify the claim. */
    evidenceText?: string;
    /**
     * How the cited fact was observed. `text` (default) means it came from
     * extracted/OCR text; `visual` means a vision pass read it off the rendered
     * page. Both carry the same document + page provenance so the viewer can
     * deep-link either kind.
     */
    evidenceType?: "text" | "visual";
  }>;
  /**
   * Direct disagreements between extracted text and visual inspection of the
   * same page. Surfaced for review rather than silently resolved — visual
   * interpretation must not override contradictory text.
   */
  conflicts?: Array<{
    field: string;
    textValue: string;
    visualValue: string;
    /** Citation ids backing each side, when known. */
    citationIds?: string[];
  }>;
  /** Set when the visual evidence fallback stage ran for this answer. */
  visualFallback?: VisualFallbackTrace;
}

/** The kinds of visual inspection task a question can imply. */
export type VisualTaskType =
  | "drawing"
  | "photo"
  | "table"
  | "checkbox"
  | "title_block"
  | "signature"
  | "markup"
  | "scan"
  | "other";

/**
 * Whether a question is likely to require looking at the page rather than
 * reading extracted text. Produced before any rendering happens, so the
 * decision to spend a vision call is auditable.
 */
export interface VisualNeedAssessment {
  visualLikely: boolean;
  /** 0–1. How strongly the wording indicates a visual answer. */
  confidence: number;
  reasons: string[];
  visualTaskTypes: VisualTaskType[];
}

/**
 * One page-level visual observation set. Carries document + page so a visual
 * claim is citable and deep-linkable exactly like a text passage.
 */
export interface VisualEvidence {
  fileId: string;
  page: number;
  evidenceType: "visual";
  /** 0–1 confidence the vision pass reported for this page's observations. */
  confidence: number;
  observations: Array<{
    field: string;
    value: string;
    /** Where on the page the value was seen, in the model's own words. */
    boundingDescription?: string;
  }>;
}

/** What the visual fallback stage did, for tracing and for the trace report. */
export interface VisualFallbackTrace {
  assessment: VisualNeedAssessment;
  triggered: boolean;
  /** Why the stage ran, or why it declined to. */
  triggerReason: string;
  pagesSelected: number[];
  pagesInspected: number[];
  evidence: VisualEvidence[];
  /** True when the stage ran but nothing was legible on the selected pages. */
  noEvidence?: boolean;
  /** Set when rendering or the vision call failed outright. */
  failureReason?: string;
  /** True when visual evidence moved the answer off `not_found`. */
  changedAnswerStatus?: boolean;
}

/**
 * Result of grading an answer against its question and supporting evidence
 * (the Answer Completeness and Grounding Validator). Produced offline by the
 * eval harness and, optionally, at runtime as a self-check over `answer`.
 */
export interface AnswerValidation {
  grade: "pass" | "partial" | "fail";
  failureType:
    | "none"
    | "retrieval"
    | "synthesis"
    | "source_mismatch"
    | "unsupported_claim"
    | "incomplete";
  requestedFields: Array<{
    field: string;
    status: "answered" | "missing" | "unsupported";
  }>;
  unsupportedClaims: string[];
  /** One concise explanation of the result. */
  notes: string;
}

export interface SendChatMessageResponse {
  messageId: UUID;
  role: "assistant";
  content: string;
  /** Structured, machine-readable form of `content` when the answer was produced by the evidence extractor. */
  answer?: ExtractedAnswer;
  interpretation?: ChatInterpretation;
  suggestions?: string[];
  autoOpenFileName?: string;
  sources: Array<{
    fileId: UUID;
    fileName: string;
    displayName?: string;
    relevance: number;
    suggestedPages?: number[];
    bestPage?: number;
    pageOrigin?: "exact" | "fallback" | "mixed";
  }>;
  citations?: Array<{
    chunkId: string;
    fileId: UUID;
    fileName: string;
    chunkIndex: number;
    sourceType: "content" | "summary" | "metadata_stub";
    relevance: number;
    pageNumber?: number;
    sectionLabel?: string;
    metadata?: Record<string, unknown>;
    confidence: number;
  }>;
  coordinator?: {
    domains: string[];
    cacheHit: boolean;
    splitSignals: string[];
    specialistAgents: Array<{
      agent: string;
      domains: string[];
      sourceCount: number;
      nodeCount: number;
      durationMs: number;
    }>;
    estimatedContextTokens: number;
    contradictions: Array<{
      kind: string;
      severity: "info" | "warning";
      message: string;
      evidenceFileIds: UUID[];
    }>;
    telemetry: {
      routeMs: number;
      retrievalMs: number;
      mergeMs: number;
      agentMs: number;
      totalMs: number;
    };
  };
  /** AI-proposed write actions awaiting user confirmation */
  agentActions?: AgentAction[];
  createdAt: Date;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
}

// ================================
// FEATURES (Pluggable Dashboard)
// ================================

export interface ProjectFeaturesResponse {
  features: (ProjectFeature & { feature: Feature })[];
}

export interface UpdateProjectFeatureRequest {
  featureId: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface UpdateProjectFeatureResponse {
  feature: ProjectFeature;
}

export interface FeaturesRegistryResponse {
  features: Feature[];
}

// ================================
// ERROR RESPONSE
// ================================

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string>;
}
