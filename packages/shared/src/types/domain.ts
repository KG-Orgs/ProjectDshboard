export type Platform = 'ios' | 'android' | 'web';

export type UserRole = 'admin' | 'pm' | 'super' | 'member';

export type ProjectStatus = 'active' | 'archived' | 'onboarding';

export type FileRecordStatus = 'pending' | 'processing' | 'indexed' | 'failed';

export type FeatureId = 'onedrive' | 'chat' | 'daily_photos' | 'daily_reports' | 'timesheets';

export interface Organization {
  id: string;
  name: string;
  oneDriveTenantId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  status: ProjectStatus;
  oneDriveFolderId?: string;
  syncStatus: 'not_connected' | 'syncing' | 'ready';
  indexedFileCount: number;
  totalFileCount: number;
  createdAt: string;
}

export interface FileRecord {
  id: string;
  projectId: string;
  oneDriveItemId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  summary?: string;
  keyTopics: string[];
  tags: string[];
  docCategory?: string;
  specSection?: string;
  sheetNumber?: string;
  revision?: string;
  oneDriveEtag?: string;
  oneDriveWebUrl?: string;
  lastSynced?: string;
  indexStatus: FileRecordStatus;
  lastIndexed?: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSource {
  fileId: string;
  fileName: string;
  chunkId: string;
  relevance: number;
  oneDriveWebUrl?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSource[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ProjectFeature {
  projectId: string;
  featureId: FeatureId;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface FeatureDefinition {
  id: FeatureId;
  name: string;
  icon: string;
  route: string;
  description: string;
  enabledByDefault: boolean;
  supportedPlatforms: Platform[];
  contributesToChat: boolean;
  sortOrder: number;
}

export interface DashboardFeature extends FeatureDefinition {
  enabled: boolean;
  statusLabel: string;
}

export interface SyncSnapshot {
  projectId: string;
  status: Project['syncStatus'];
  indexedFileCount: number;
  totalFileCount: number;
  lastSyncStartedAt?: string;
  lastSyncCompletedAt?: string;
  nextSyncEtaMinutes?: number;
}

export interface QuerySuggestion {
  id: string;
  label: string;
  prompt: string;
}