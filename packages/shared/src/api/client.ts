import {
  demoChatSessions,
  demoDashboardFeatures,
  demoFiles,
  demoOrganization,
  demoProjects,
  demoQuerySuggestions,
  demoSyncSnapshot,
  demoUser,
} from '../mock/mvp-data';
import type {
  ChatSession,
  DashboardFeature,
  FileRecord,
  Organization,
  Project,
  QuerySuggestion,
  SyncSnapshot,
  User,
} from '../types/domain';

export interface SessionContext {
  user: User;
  organization: Organization;
}

export interface ProjectOverview {
  project: Project;
  sync: SyncSnapshot;
  features: DashboardFeature[];
  recentFiles: FileRecord[];
  suggestedQueries: QuerySuggestion[];
  activeChatSession?: ChatSession;
}

export class ContractorApiClient {
  async getSessionContext(): Promise<SessionContext> {
    return {
      user: demoUser,
      organization: demoOrganization,
    };
  }

  async getProjects(): Promise<Project[]> {
    return demoProjects;
  }

  async getProjectOverview(projectId: string): Promise<ProjectOverview> {
    const project = demoProjects.find((entry) => entry.id === projectId);

    if (!project) {
      throw new Error(`Unknown project: ${projectId}`);
    }

    return {
      project,
      sync: demoSyncSnapshot,
      features: demoDashboardFeatures,
      recentFiles: demoFiles.filter((file) => file.projectId === projectId),
      suggestedQueries: demoQuerySuggestions,
      activeChatSession: demoChatSessions.find((session) => session.projectId === projectId),
    };
  }
}

export const apiClient = new ContractorApiClient();