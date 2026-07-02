'use client';

import { useAuthStore } from '@contractor/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OnboardingModal from '../components/OnboardingModal';
import { shouldAutoShowOnboarding } from '../lib/onboarding';
import './page.css';

interface HomeProject {
  id: string;
  name: string;
  onedriveFolderId?: string;
}

interface OneDriveBrowseItem {
  id: string;
  name: string;
  isFolder: boolean;
  webUrl: string;
}

interface OneDriveBrowseResponse {
  items: OneDriveBrowseItem[];
  parentId?: string;
}

interface UpdateProjectFolderResponse {
  project: HomeProject;
  resetPerformed: boolean;
  sync: SyncResponse;
  message: string;
}

interface OneDriveStatus {
  connected: boolean;
  syncInProgress: boolean;
  fileCount?: number;
  accountEmail?: string;
  tenantId?: string;
  driveId?: string;
  driveType?: string;
}

interface FileInventoryItem {
  id: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  indexStatus: 'pending' | 'processing' | 'indexed' | 'failed';
  tags?: string[];
}

interface ProjectFilesResponse {
  files: FileInventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface CreateProjectResponse {
  project: HomeProject;
}

interface SyncResponse {
  syncStarted: boolean;
  message: string;
  scannedFileCount?: number;
  supportedFileCount?: number;
  unsupportedFileCount?: number;
}

interface SyncProgressResponse {
  inProgress: boolean;
  downloadedFileCount: number;
  completionPercent: number;
  scannedFileCount?: number;
  supportedFileCount?: number;
  unsupportedFileCount?: number;
  message?: string;
}

interface IndexingProgressResponse {
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
  groupedFailureReasons?: Array<{
    stage: string;
    errorCode: string;
    count: number;
    lastMessage: string;
    lastSeenAt: string;
  }>;
  anomalies?: Array<{
    type: string;
    count: number;
    message: string;
  }>;
}

interface ProjectChunkItem {
  id: string;
  fileId: string;
  fileName: string;
  chunkIndex: number;
  chunkText: string;
  tokenCount: number;
}

interface ProjectChunksResponse {
  chunks: ProjectChunkItem[];
}

interface RetrievalSource {
  fileId: string;
  fileName: string;
  relevance: number;
}

interface RetrievalPreviewResponse {
  sources: RetrievalSource[];
}

interface ChatSessionResponse {
  session: {
    id: string;
  };
}

interface ChatSendResponse {
  content: string;
  sources?: RetrievalSource[];
  coordinator?: {
    domains?: string[];
    splitSignals?: string[];
  };
}

const PROJECT_STATUS_POLL_INTERVAL_MS = 4000;

export default function Home() {
  const { isAuthenticated, user, hydrate, logout, isLoading, error } = useAuthStore();
  const router = useRouter();
  const oneDriveMessageFromUrl =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('onedriveMessage');
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [productTourOpen, setProductTourOpen] = useState(false);
  const [oneDriveStatus, setOneDriveStatus] = useState<OneDriveStatus | null>(null);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [projectName, setProjectName] = useState('');
  const [folderId, setFolderId] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [projectFiles, setProjectFiles] = useState<FileInventoryItem[]>([]);
  const [projectFilesTotal, setProjectFilesTotal] = useState(0);
  const [isProjectFilesLoading, setIsProjectFilesLoading] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgressResponse | null>(null);
  const [isIndexingProgressLoading, setIsIndexingProgressLoading] = useState(false);
  const [projectChunks, setProjectChunks] = useState<ProjectChunkItem[]>([]);
  const [isChunksLoading, setIsChunksLoading] = useState(false);
  const [retrievalQuery, setRetrievalQuery] = useState('project update status');
  const [retrievalSources, setRetrievalSources] = useState<RetrievalSource[]>([]);
  const [isRetrievalLoading, setIsRetrievalLoading] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatPrompt, setChatPrompt] = useState('Summarize key risks from the latest synced files.');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatSources, setChatSources] = useState<RetrievalSource[]>([]);
  const [chatRouteSummary, setChatRouteSummary] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSummary, setLastSyncSummary] = useState<string | null>(null);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncElapsedSeconds, setSyncElapsedSeconds] = useState(0);
  const [syncProgress, setSyncProgress] = useState<SyncProgressResponse | null>(null);
  const [isSyncProgressLoading, setIsSyncProgressLoading] = useState(false);
  const [oneDriveFolders, setOneDriveFolders] = useState<OneDriveBrowseItem[]>([]);
  const [isOneDriveFoldersLoading, setIsOneDriveFoldersLoading] = useState(false);
  const [oneDriveFolderError, setOneDriveFolderError] = useState<string | null>(null);
  const [selectedMainFolderId, setSelectedMainFolderId] = useState('');
  const [isUpdatingMainFolder, setIsUpdatingMainFolder] = useState(false);
  const lastProjectSelectionRef = useRef<string | undefined>(undefined);
  const wasPollingProjectStatusRef = useRef(false);
  const projectFilesInFlightRef = useRef(false);
  const indexingProgressInFlightRef = useRef(false);
  const syncProgressInFlightRef = useRef(false);

  // Restore the last successful app session from persisted auth state.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const extractFolderId = useCallback((value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = new URL(trimmed);
      const idFromQuery = parsed.searchParams.get('id');
      if (idFromQuery) {
        return idFromQuery;
      }

      const decodedPath = decodeURIComponent(parsed.pathname);
      const itemsMatch = decodedPath.match(/\/items\/([^/]+)/i);
      if (itemsMatch?.[1]) {
        return itemsMatch[1];
      }
    } catch {
      return trimmed;
    }

    return trimmed;
  }, []);

  const buildOneDriveFolderUrl = useCallback((folderRef?: string): string => {
    const parsedFolderId = folderRef ? extractFolderId(folderRef) : null;
    if (!parsedFolderId) {
      return 'https://onedrive.live.com/';
    }

    return `https://onedrive.live.com/?id=${encodeURIComponent(parsedFolderId)}`;
  }, [extractFolderId]);

  const loadOnboardingData = useCallback(async (options?: { background?: boolean }) => {
    const isBackgroundRefresh = options?.background === true;

    if (!isBackgroundRefresh) {
      setOnboardingLoading(true);
      setOnboardingError(null);
    }

    try {
      const [statusResponse, projectsResponse] = await Promise.all([
        fetch('/api/onedrive/status', { method: 'GET' }),
        fetch('/api/projects', { method: 'GET' }),
      ]);

      if (!statusResponse.ok || !projectsResponse.ok) {
        throw new Error('Unable to load onboarding status. Refresh and try again.');
      }

      const statusData = (await statusResponse.json()) as OneDriveStatus;
      const projectsData = (await projectsResponse.json()) as { projects: HomeProject[] };
      const nextProjects = projectsData.projects ?? [];

      setOneDriveStatus(statusData);
      setProjects(nextProjects);
      setSelectedProjectId((current) => {
        if (current && nextProjects.some((project) => project.id === current)) {
          return current;
        }

        return nextProjects[0]?.id;
      });

    } catch (requestError) {
      if (!isBackgroundRefresh) {
        setOnboardingError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load onboarding status. Refresh and try again.'
        );
      }
    } finally {
      if (!isBackgroundRefresh) {
        setOnboardingLoading(false);
      }
    }
  }, []);

  const loadProjectFiles = useCallback(async (projectId: string, options?: { background?: boolean }) => {
    const isBackgroundRefresh = options?.background === true;
    if (projectFilesInFlightRef.current) {
      return;
    }

    projectFilesInFlightRef.current = true;
    if (!isBackgroundRefresh) {
      setIsProjectFilesLoading(true);
    }

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/files?page=1&pageSize=50`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Unable to load project file inventory.');
      }

      const data = (await response.json()) as ProjectFilesResponse;
      setProjectFiles(data.files ?? []);
      setProjectFilesTotal(data.total ?? 0);
    } catch (filesError) {
      if (!isBackgroundRefresh) {
        setOnboardingError(
          filesError instanceof Error
            ? filesError.message
            : 'Unable to load project file inventory.'
        );
      }
    } finally {
      projectFilesInFlightRef.current = false;
      if (!isBackgroundRefresh) {
        setIsProjectFilesLoading(false);
      }
    }
  }, []);

  const loadIndexingProgress = useCallback(async (projectId: string, options?: { background?: boolean }) => {
    const isBackgroundRefresh = options?.background === true;
    if (indexingProgressInFlightRef.current) {
      return;
    }

    indexingProgressInFlightRef.current = true;
    if (!isBackgroundRefresh) {
      setIsIndexingProgressLoading(true);
    }

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/indexing/progress`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Unable to load indexing progress.');
      }

      const data = (await response.json()) as IndexingProgressResponse;
      setIndexingProgress(data);
    } catch (progressError) {
      if (!isBackgroundRefresh) {
        setOnboardingError(
          progressError instanceof Error
            ? progressError.message
            : 'Unable to load indexing progress.'
        );
      }
    } finally {
      indexingProgressInFlightRef.current = false;
      if (!isBackgroundRefresh) {
        setIsIndexingProgressLoading(false);
      }
    }
  }, []);

  const loadProjectChunks = useCallback(async (projectId: string) => {
    setIsChunksLoading(true);
    setDiagnosticsError(null);

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/chunks`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Unable to load indexed chunks.');
      }

      const data = (await response.json()) as ProjectChunksResponse;
      setProjectChunks(data.chunks ?? []);
    } catch (chunksError) {
      const message = chunksError instanceof Error ? chunksError.message : 'Unable to load indexed chunks.';
      setDiagnosticsError(message);
    } finally {
      setIsChunksLoading(false);
    }
  }, []);

  const loadSyncProgress = useCallback(async (projectId: string, options?: { background?: boolean }) => {
    const isBackgroundRefresh = options?.background === true;
    if (syncProgressInFlightRef.current) {
      return;
    }

    syncProgressInFlightRef.current = true;
    if (!isBackgroundRefresh) {
      setIsSyncProgressLoading(true);
    }

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/sync/progress`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Unable to load sync progress.');
      }

      const data = (await response.json()) as SyncProgressResponse;
      setSyncProgress(data);
      setIsSyncing(data.inProgress);
    } catch {
      // Sync progress is best-effort UI feedback and should not block the page.
    } finally {
      syncProgressInFlightRef.current = false;
      if (!isBackgroundRefresh) {
        setIsSyncProgressLoading(false);
      }
    }
  }, []);

  const runRetrievalPreview = useCallback(async (projectId: string, query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setDiagnosticsError('Enter a retrieval query before previewing sources.');
      return;
    }

    setIsRetrievalLoading(true);
    setDiagnosticsError(null);

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/retrieval/preview?q=${encodeURIComponent(normalizedQuery)}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Unable to run retrieval preview.');
      }

      const data = (await response.json()) as RetrievalPreviewResponse;
      setRetrievalSources(data.sources ?? []);
    } catch (previewError) {
      const message = previewError instanceof Error ? previewError.message : 'Unable to run retrieval preview.';
      setDiagnosticsError(message);
    } finally {
      setIsRetrievalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadOnboardingData();
    }
  }, [isAuthenticated, loadOnboardingData]);

  useEffect(() => {
    if (selectedProjectId) {
      void loadProjectFiles(selectedProjectId);
      void loadIndexingProgress(selectedProjectId);
      void loadSyncProgress(selectedProjectId);
      return;
    }

    setProjectFiles([]);
    setProjectFilesTotal(0);
    setIndexingProgress(null);
    setProjectChunks([]);
    setRetrievalSources([]);
    setDiagnosticsError(null);
    setChatSessionId(null);
    setChatAnswer(null);
    setChatSources([]);
    setChatRouteSummary(null);
    setChatError(null);
    setSyncProgress(null);
    setSelectedMainFolderId('');
  }, [selectedProjectId, loadProjectFiles, loadIndexingProgress, loadSyncProgress]);

  useEffect(() => {
    if (!selectedProjectId) {
      lastProjectSelectionRef.current = undefined;
      setSelectedMainFolderId('');
      return;
    }

    // Only initialize folder selection when the selected project changes.
    if (lastProjectSelectionRef.current !== selectedProjectId) {
      const selectedProject = projects.find((project) => project.id === selectedProjectId);
      setSelectedMainFolderId(selectedProject?.onedriveFolderId ?? '');
      lastProjectSelectionRef.current = selectedProjectId;
    }
  }, [selectedProjectId, projects]);

  useEffect(() => {
    setChatSessionId(null);
    setChatAnswer(null);
    setChatSources([]);
    setChatRouteSummary(null);
    setChatError(null);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!isSyncing) {
      setSyncElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timerId = window.setInterval(() => {
      setSyncElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isSyncing]);

  const shouldPollProjectStatus = useMemo(() => {
    if (!selectedProjectId) {
      return false;
    }

    if (isSyncing || syncProgress?.inProgress || oneDriveStatus?.syncInProgress) {
      return true;
    }

    if (!indexingProgress) {
      return false;
    }

    return indexingProgress.pending > 0 || indexingProgress.processing > 0;
  }, [selectedProjectId, isSyncing, syncProgress, oneDriveStatus, indexingProgress]);

  useEffect(() => {
    if (!selectedProjectId) {
      wasPollingProjectStatusRef.current = false;
      return;
    }

    if (wasPollingProjectStatusRef.current && !shouldPollProjectStatus) {
      void loadProjectFiles(selectedProjectId, { background: true });
    }

    wasPollingProjectStatusRef.current = shouldPollProjectStatus;
  }, [selectedProjectId, shouldPollProjectStatus, loadProjectFiles]);

  useEffect(() => {
    if (!selectedProjectId || !shouldPollProjectStatus) {
      return;
    }

    const pollProjectStatus = () => {
      void loadIndexingProgress(selectedProjectId, { background: true });

      if (isSyncing || syncProgress?.inProgress || oneDriveStatus?.syncInProgress) {
        void loadSyncProgress(selectedProjectId, { background: true });
      }
    };

    pollProjectStatus();
    const pollId = window.setInterval(pollProjectStatus, PROJECT_STATUS_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
    };
  }, [
    selectedProjectId,
    shouldPollProjectStatus,
    isSyncing,
    syncProgress,
    oneDriveStatus,
    loadIndexingProgress,
    loadSyncProgress,
  ]);

  useEffect(() => {
    const query = selectedProjectId
      ? `?projectId=${encodeURIComponent(selectedProjectId)}`
      : '';

    // Warm the chat route bundle/data to reduce delay after clicking AI Chat.
    router.prefetch(`/workspace/chat${query}`);
  }, [router, selectedProjectId]);

  const handleOpenOneDrive = () => {
    const activeProjectFolderId = projects.find((project) => project.id === selectedProjectId)?.onedriveFolderId;
    const targetUrl = buildOneDriveFolderUrl(activeProjectFolderId ?? folderId);
    const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.href = targetUrl;
    }
  };

  const handleStartOneDriveConnect = () => {
    const redirectUri = `${window.location.origin}/onedrive/callback`;
    window.location.href = `/api/onedrive/connect?redirectUri=${encodeURIComponent(redirectUri)}`;
  };

  const handleOpenAiChat = () => {
    const query = selectedProjectId
      ? `?projectId=${encodeURIComponent(selectedProjectId)}`
      : '';
    router.push(`/workspace/chat${query}`);
  };

  const loadOneDriveFolders = useCallback(async () => {
    if (!oneDriveStatus?.connected) {
      setOneDriveFolderError('Connect OneDrive first to browse folders.');
      return;
    }

    setIsOneDriveFoldersLoading(true);
    setOneDriveFolderError(null);

    try {
      const response = await fetch('/api/onedrive/browse', { method: 'GET' });
      if (!response.ok) {
        throw new Error('Unable to load OneDrive folders.');
      }

      const payload = (await response.json()) as OneDriveBrowseResponse;
      const folders = (payload.items ?? []).filter((item) => item.isFolder);
      setOneDriveFolders(folders);

      const selectedProject = projects.find((project) => project.id === selectedProjectId);
      if (selectedProject?.onedriveFolderId) {
        setSelectedMainFolderId(selectedProject.onedriveFolderId);
      } else if (folders[0]?.id) {
        setSelectedMainFolderId(folders[0].id);
      }
    } catch (browseError) {
      setOneDriveFolderError(
        browseError instanceof Error ? browseError.message : 'Unable to load OneDrive folders.'
      );
    } finally {
      setIsOneDriveFoldersLoading(false);
    }
  }, [oneDriveStatus?.connected, projects, selectedProjectId]);

  const ensureChatSession = useCallback(async (projectId: string): Promise<string> => {
    if (chatSessionId) {
      return chatSessionId;
    }

    const response = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
      throw new Error('Unable to create chat session for this project.');
    }

    const payload = (await response.json()) as ChatSessionResponse;
    const nextSessionId = payload.session?.id;
    if (!nextSessionId) {
      throw new Error('Chat session creation returned an invalid response.');
    }

    setChatSessionId(nextSessionId);
    return nextSessionId;
  }, [chatSessionId]);

  const handleRunAiChat = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const projectId = selectedProjectId;
    const prompt = chatPrompt.trim();

    if (!projectId) {
      setChatError('Select a project before sending an AI chat message.');
      return;
    }

    if (!prompt) {
      setChatError('Enter a message before sending.');
      return;
    }

    setIsChatLoading(true);
    setChatError(null);

    try {
      const sessionId = await ensureChatSession(projectId);
      const response = await fetch(`/api/chat/sessions/${encodeURIComponent(sessionId)}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: prompt,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => undefined) as
          | { message?: string }
          | undefined;
        throw new Error(errorPayload?.message ?? 'AI chat request failed.');
      }

      const payload = (await response.json()) as ChatSendResponse;
      setChatAnswer(payload.content ?? 'No response content returned.');
      setChatSources(payload.sources ?? []);

      const domainSummary = payload.coordinator?.domains?.length
        ? `Domains: ${payload.coordinator.domains.join(', ')}`
        : null;
      const splitSummary = payload.coordinator?.splitSignals?.length
        ? `Split signals: ${payload.coordinator.splitSignals.join(', ')}`
        : null;

      setChatRouteSummary([domainSummary, splitSummary].filter(Boolean).join(' | ') || null);
    } catch (requestError) {
      setChatError(
        requestError instanceof Error ? requestError.message : 'AI chat request failed.'
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedFolderId = extractFolderId(folderId) ?? '';

    if (!projectName.trim() || !parsedFolderId.trim()) {
      setOnboardingError('Project name and OneDrive folder URL or ID are required.');
      return;
    }

    setIsCreatingProject(true);
    setOnboardingError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName.trim(),
          onedriveFolderId: parsedFolderId.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Project creation failed. Verify inputs and try again.');
      }

      setProjectName('');
      setFolderId('');
      await loadOnboardingData();
    } catch (createError) {
      setOnboardingError(
        createError instanceof Error
          ? createError.message
          : 'Project creation failed. Verify inputs and try again.'
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleRunManualSync = async (projectIdOverride?: string) => {
    const projectIdToSync = projectIdOverride ?? selectedProjectId;

    if (!projectIdToSync) {
      setSyncError('Create or select a project before running sync.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncStatusMessage('Starting sync. This can take a bit for larger folders.');
    setOnboardingError(null);

    try {
      const response = await fetch('/api/onedrive/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: projectIdToSync }),
      });

      const payload = (await response.json().catch(() => undefined)) as SyncResponse | undefined;
      if (!response.ok) {
        throw new Error(payload?.message ?? 'Manual sync failed.');
      }

      const scanned = payload?.scannedFileCount ?? 0;
      const supported = payload?.supportedFileCount ?? 0;
      const unsupported = payload?.unsupportedFileCount ?? 0;
      setLastSyncSummary(`${payload?.message ?? 'Sync completed.'} Scanned ${scanned}, supported ${supported}, unsupported ${unsupported}.`);
      setSyncStatusMessage('Sync completed successfully.');
      await loadSyncProgress(projectIdToSync);

      await Promise.all([
        loadOnboardingData(),
        loadProjectFiles(projectIdToSync),
        loadIndexingProgress(projectIdToSync),
      ]);
    } catch (syncError) {
      const message =
        syncError instanceof Error
            ? syncError.message
            : 'Manual sync failed.';
      setSyncError(message);
      setOnboardingError(
        message
      );
      setSyncStatusMessage(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyMainProjectFolder = useCallback(async () => {
    if (!selectedProjectId) {
      setOneDriveFolderError('Select a project first.');
      return;
    }

    const nextFolderId = selectedMainFolderId.trim();
    if (!nextFolderId) {
      setOneDriveFolderError('Select a OneDrive folder before applying.');
      return;
    }

    setIsUpdatingMainFolder(true);
    setOneDriveFolderError(null);
    setOnboardingError(null);
    setProjectFiles([]);
    setProjectFilesTotal(0);
    setProjectChunks([]);
    setRetrievalSources([]);
    setDiagnosticsError(null);
    setChatAnswer(null);
    setChatSources([]);
    setChatRouteSummary(null);
    setSyncProgress(null);
    setSyncStatusMessage('Updating project folder, clearing old index, and starting a fresh sync...');
    setIsSyncing(true);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(selectedProjectId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onedriveFolderId: nextFolderId,
          resetIndexedData: true,
        }),
      });

      const payload = (await response.json().catch(() => undefined)) as
        | UpdateProjectFolderResponse
        | { message?: string; error?: string }
        | undefined;

      if (!response.ok) {
        const payloadMessage = payload && 'message' in payload ? payload.message : undefined;
        const payloadError = payload && 'error' in payload ? payload.error : undefined;
        const fallback = response.statusText
          ? `Unable to update project folder (${response.status}: ${response.statusText}).`
          : `Unable to update project folder (${response.status}).`;
        throw new Error(payloadMessage || payloadError || fallback);
      }

      setLastSyncSummary(
        payload && 'sync' in payload && payload.sync?.message
          ? payload.sync.message
          : payload && 'message' in payload && payload.message
            ? payload.message
            : 'Project folder updated.'
      );
      setSyncStatusMessage(
        payload && 'sync' in payload && payload.sync?.syncStarted
          ? 'Fresh sync started for selected main folder.'
          : 'Project folder updated. Sync did not start because there were no supported files.'
      );

      // Do not block the Apply button on potentially heavy refresh calls.
      // Refresh data in the background so the user can continue interacting immediately.
      void Promise.allSettled([
        loadOnboardingData(),
        loadProjectFiles(selectedProjectId),
        loadIndexingProgress(selectedProjectId),
        loadSyncProgress(selectedProjectId),
      ]);
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update project folder.';
      setOneDriveFolderError(message);
      setOnboardingError(message);
      setSyncStatusMessage(null);
      setIsSyncing(false);
    } finally {
      setIsUpdatingMainFolder(false);
    }
  }, [loadIndexingProgress, loadOnboardingData, loadProjectFiles, loadSyncProgress, selectedMainFolderId, selectedProjectId]);

  const handleSelectProject = (projectId: string) => {
    const isNewSelection = selectedProjectId !== projectId;
    setSelectedProjectId(projectId);

    setSyncStatusMessage(
      isNewSelection
        ? 'Folder selected. Starting sync automatically...'
        : 'Project re-selected. Starting sync automatically...'
    );
    void handleRunManualSync(projectId);
  };

  const handleOnboardingCreateProject = useCallback(async () => {
    const selectedFolder = oneDriveFolders.find((f) => f.id === selectedMainFolderId);
    if (!selectedFolder) {
      setOneDriveFolderError('Select a folder first.');
      return;
    }
    setIsCreatingProject(true);
    setOnboardingError(null);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedFolder.name, onedriveFolderId: selectedFolder.id }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => undefined) as { message?: string } | undefined;
        throw new Error(payload?.message ?? 'Project creation failed. Try again.');
      }
      const payload = (await response.json()) as CreateProjectResponse;
      const createdProjectId = payload.project?.id;

      if (!createdProjectId) {
        throw new Error('Project creation succeeded but no project was returned.');
      }

      setSelectedProjectId(createdProjectId);
      await loadOnboardingData();
      await handleRunManualSync(createdProjectId);
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : 'Failed to set up project.');
    } finally {
      setIsCreatingProject(false);
    }
  }, [loadOnboardingData, oneDriveFolders, selectedMainFolderId, handleRunManualSync]);

  const activeProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const needsOneDrive = !onboardingLoading && oneDriveStatus !== null && !oneDriveStatus.connected;
  const needsProject = !onboardingLoading && oneDriveStatus?.connected === true && projects.length === 0;
  const onboardingStep = needsOneDrive ? 1 : needsProject ? 2 : 0;
  const isOnboarding = onboardingStep > 0;

  useEffect(() => {
    if (!isAuthenticated || isLoading || onboardingLoading || isOnboarding) return;
    if (shouldAutoShowOnboarding(user)) {
      setProductTourOpen(true);
    }
  }, [isAuthenticated, isLoading, onboardingLoading, isOnboarding, user]);

  const sty = {
    card: {
      background: '#fff', borderRadius: '12px', padding: '24px',
      border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    } as React.CSSProperties,
    label: {
      fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px',
      textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block',
    } as React.CSSProperties,
    input: {
      width: '100%', padding: '9px 12px', borderRadius: '8px',
      border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', color: '#111827',
      background: '#fff',
    } as React.CSSProperties,
    btnPrimary: {
      background: '#0078d4', color: '#fff', border: 'none', borderRadius: '10px',
      padding: '11px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    } as React.CSSProperties,
    btnSecondary: {
      background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px',
      padding: '8px 14px', fontSize: '13px', cursor: 'pointer', color: '#374151',
    } as React.CSSProperties,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>

      {/* â"€â"€ Top Bar â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb', height: '56px',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#0078d4', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '13px', fontWeight: 700,
          }}>AI</div>
          <span style={{ fontWeight: 700, color: '#111827', fontSize: '15px' }}>ContractorAI</span>
        </div>
        {activeProject && !isOnboarding ? (
          <>
            <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 2px' }} />
            <span style={{ fontSize: '14px', color: '#6b7280', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject.name}
            </span>
          </>
        ) : null}
        <div style={{ flex: 1 }} />
        {!isOnboarding ? (
          <button
            type="button"
            onClick={() => setProductTourOpen(true)}
            style={{ ...sty.btnSecondary, fontSize: '12px', padding: '7px 12px' }}
          >
            Take tour
          </button>
        ) : null}
        {!isOnboarding && selectedProjectId ? (
          <button type="button" onClick={handleOpenAiChat} style={sty.btnPrimary}>
            Open Workspace
          </button>
        ) : null}
        <button type="button" onClick={() => void logout()} style={{ ...sty.btnSecondary, color: '#6b7280' }}>
          Sign Out
        </button>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#1d4ed8', flexShrink: 0,
        }}>
          {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
            {isOnboarding
              ? `Welcome, ${user?.name?.split(' ')[0] || 'there'}`
              : `Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            {isLoading
              ? 'Restoring your session...'
              : isOnboarding
                ? "Let's get your project set up. It only takes a minute."
                : activeProject
                  ? `Project: ${activeProject.name}`
                  : 'Select a project to continue.'}
          </p>
        </div>

        {/* â"€â"€ Loading skeleton â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
        {(isLoading || (onboardingLoading && !oneDriveStatus)) ? (
          <div style={{ ...sty.card, textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>
            Loading...
          </div>
        ) : null}

        {/* â"€â"€ Not authenticated fallback â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
        {!isAuthenticated && !isLoading ? (
          <div style={{ ...sty.card, textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>[?]</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>ContractorAI</h2>
            <p style={{ color: '#6b7280', marginBottom: '28px', fontSize: '14px' }}>
              {error ?? 'Sign in to access your project workspace.'}
            </p>
            <Link href="/login" style={{
              background: '#0078d4', color: '#fff', textDecoration: 'none',
              borderRadius: '10px', padding: '13px 32px', fontSize: '14px', fontWeight: 600,
            }}>
              Sign In with Microsoft
            </Link>
          </div>
        ) : null}

        {/* Onboarding Wizard */}
        {isAuthenticated && !isLoading && !onboardingLoading && isOnboarding ? (
          <div style={{ ...sty.card, padding: '40px', maxWidth: '580px' }}>
            {/* Step indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '36px' }}>
              {[
                { n: 1, label: 'Connect OneDrive' },
                { n: 2, label: 'Select Folder' },
              ].map((step, i) => (
                <div key={step.n} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: onboardingStep > step.n ? '#107c10' : onboardingStep === step.n ? '#0078d4' : '#e5e7eb',
                      color: onboardingStep >= step.n ? '#fff' : '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700,
                    }}>
                      {onboardingStep > step.n ? 'OK' : step.n}
                    </div>
                    <span style={{
                      fontSize: '12px', fontWeight: onboardingStep === step.n ? 600 : 400,
                      color: onboardingStep === step.n ? '#111827' : '#9ca3af',
                      whiteSpace: 'nowrap',
                    }}>{step.label}</span>
                  </div>
                  {i < 1 ? <div style={{ flex: 1, height: '1px', background: '#e5e7eb', margin: '0 8px' }} /> : null}
                </div>
              ))}
            </div>

            {/* Step 1: Connect OneDrive */}
            {onboardingStep === 1 ? (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                  Connect Microsoft OneDrive
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.7' }}>
                  Connect your OneDrive account to browse and select your project folder. Your files stay in OneDrive. We only read and index them to power AI search.
                </p>
                <button type="button" onClick={handleStartOneDriveConnect} style={sty.btnPrimary}>
                  Connect OneDrive
                </button>
              </div>
            ) : null}

            {/* Step 2: Select Folder */}
            {onboardingStep === 2 ? (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                  What project are you working on?
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.7' }}>
                  Browse and select the OneDrive folder for your project.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => void loadOneDriveFolders()}
                    disabled={isOneDriveFoldersLoading}
                    style={sty.btnSecondary}
                  >
                    {isOneDriveFoldersLoading ? 'Loading...' : 'Browse OneDrive'}
                  </button>
                </div>
                {oneDriveFolders.length > 0 ? (
                  <>
                    <select
                      value={selectedMainFolderId}
                      onChange={(e) => setSelectedMainFolderId(e.target.value)}
                      style={{ ...sty.input, marginBottom: '12px' }}
                    >
                      <option value="">Select a project folder...</option>
                      {oneDriveFolders.map((folder) => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                    {selectedMainFolderId ? (
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
                        Folder: /OneDrive/{oneDriveFolders.find((f) => f.id === selectedMainFolderId)?.name ?? selectedMainFolderId}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleOnboardingCreateProject()}
                      disabled={!selectedMainFolderId || isCreatingProject}
                      style={{
                        ...sty.btnPrimary,
                        opacity: !selectedMainFolderId || isCreatingProject ? 0.5 : 1,
                        cursor: !selectedMainFolderId || isCreatingProject ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isCreatingProject ? 'Setting up...' : 'Use this folder'}
                    </button>
                  </>
                ) : null}
                {oneDriveFolderError ? (
                  <p style={{ marginTop: '12px', fontSize: '13px', color: '#d83b01' }}>{oneDriveFolderError}</p>
                ) : null}
              </div>
            ) : null}

            {onboardingError ? (
              <div style={{
                marginTop: '20px', padding: '12px 16px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#b91c1c',
              }}>
                {onboardingError}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* â"€â"€ Dashboard (authenticated, set up) â"€â"€â"€â"€â"€â"€ */}
        {isAuthenticated && !isLoading && !onboardingLoading && !isOnboarding ? (
          <div>
            {/* Quick action cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px', marginBottom: '24px',
            }}>
              {/* Open Workspace */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleOpenAiChat}
                onKeyDown={(e) => { if (e.key === 'Enter') handleOpenAiChat(); }}
                style={{
                  background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
                  borderRadius: '12px', padding: '24px', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,120,212,0.28)', outline: 'none',
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {activeProject?.name ?? 'Project'}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Open Project Workspace</h3>
                <p style={{ fontSize: '13px', opacity: 0.85, margin: 0, lineHeight: '1.5' }}>
                  File explorer, PDF viewer, and AI assistant in a three-panel workspace.
                </p>
              </div>

              {/* OneDrive */}
              <div style={sty.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0, flex: 1 }}>OneDrive</h3>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                    background: oneDriveStatus?.connected ? '#dcfce7' : '#fef9c3',
                    color: oneDriveStatus?.connected ? '#166534' : '#92400e',
                  }}>
                    {oneDriveStatus?.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                {oneDriveStatus?.accountEmail ? (
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>{oneDriveStatus.accountEmail}</p>
                ) : null}
                {(oneDriveStatus?.fileCount ?? 0) > 0 ? (
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>{oneDriveStatus?.fileCount} files detected</p>
                ) : (
                  <div style={{ height: '16px' }} />
                )}
                {oneDriveStatus?.connected ? (
                  <button type="button" onClick={handleOpenOneDrive} style={sty.btnSecondary}>
                    Open OneDrive
                  </button>
                ) : (
                  <button type="button" onClick={handleStartOneDriveConnect} style={sty.btnPrimary}>
                    Connect OneDrive
                  </button>
                )}
              </div>

              {/* Sync & Index */}
              <div style={sty.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Sync & Index</h3>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Indexing progress</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                      {indexingProgress ? `${indexingProgress.completionPercent}%` : '--'}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: '#0078d4', borderRadius: '3px',
                      width: `${indexingProgress?.completionPercent ?? 0}%`, transition: 'width 0.3s',
                    }} />
                  </div>
                  {indexingProgress ? (
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>
                      {indexingProgress.indexed} indexed | {indexingProgress.pending} pending | {indexingProgress.failed} failed
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleRunManualSync()}
                  disabled={!selectedProjectId || isSyncing}
                  style={{
                    ...sty.btnSecondary,
                    opacity: !selectedProjectId ? 0.5 : 1,
                    cursor: !selectedProjectId || isSyncing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSyncing ? `Syncing... (${syncElapsedSeconds}s)` : 'Run Sync'}
                </button>
                {syncStatusMessage ? (
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', lineHeight: '1.5' }}>{syncStatusMessage}</p>
                ) : null}
                {syncError ? (
                  <p style={{ fontSize: '12px', color: '#d83b01', marginTop: '8px' }}>{syncError}</p>
                ) : null}
              </div>
            </div>

            {/* Project Settings */}
            <div style={{ ...sty.card, marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>
                Project Setup
              </h3>

              {/* Projects list */}
              {projects.length > 0 ? (
                <div style={{ marginBottom: '24px' }}>
                  <span style={sty.label}>Your Projects</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleSelectProject(project.id)}
                        style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '11px 14px', borderRadius: '10px',
                        border: `1.5px solid ${selectedProjectId === project.id ? '#0078d4' : '#e5e7eb'}`,
                        background: selectedProjectId === project.id ? '#eff6ff' : '#f9fafb',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{project.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Change folder */}
              <div style={{ marginBottom: '20px' }}>
                <span style={sty.label}>Change Project Folder</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => void loadOneDriveFolders()}
                    disabled={!oneDriveStatus?.connected || isOneDriveFoldersLoading}
                    style={{ ...sty.btnSecondary, opacity: !oneDriveStatus?.connected ? 0.5 : 1 }}
                  >
                    {isOneDriveFoldersLoading ? 'Loading...' : 'Browse Folders'}
                  </button>
                  {oneDriveFolders.length > 0 ? (
                    <>
                      <select
                        value={selectedMainFolderId}
                        onChange={(e) => setSelectedMainFolderId(e.target.value)}
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                          fontSize: '13px', color: '#111827', outline: 'none', background: '#fff', minWidth: '180px',
                        }}
                      >
                        <option value="">Select folder...</option>
                        {oneDriveFolders.map((folder) => (
                          <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleApplyMainProjectFolder()}
                        disabled={!selectedProjectId || !selectedMainFolderId || isUpdatingMainFolder}
                        style={{
                          ...sty.btnPrimary,
                          opacity: !selectedProjectId || !selectedMainFolderId ? 0.5 : 1,
                          cursor: !selectedProjectId || !selectedMainFolderId ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isUpdatingMainFolder ? 'Applying...' : 'Apply & Re-index'}
                      </button>
                    </>
                  ) : null}
                </div>
                {oneDriveFolderError ? (
                  <p style={{ fontSize: '12px', color: '#d83b01', marginTop: '8px' }}>{oneDriveFolderError}</p>
                ) : null}
              </div>

              {/* Add project */}
              <details>
                <summary style={{ fontSize: '13px', color: '#6b7280', cursor: 'pointer', fontWeight: 500, userSelect: 'none' }}>
                  + Add another project
                </summary>
                <form onSubmit={handleCreateProject} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Project name"
                    style={sty.input}
                  />
                  <input
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    placeholder="OneDrive folder URL or ID"
                    style={sty.input}
                  />
                  <button type="submit" disabled={isCreatingProject} style={{ ...sty.btnPrimary, alignSelf: 'flex-start' }}>
                    {isCreatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                </form>
              </details>
            </div>

            {/* Project Files */}
            {projectFilesTotal > 0 ? (
              <div style={sty.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>
                    Project Files
                    <span style={{
                      marginLeft: '8px', fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                      borderRadius: '12px', background: '#f3f4f6', color: '#6b7280',
                    }}>{projectFilesTotal}</span>
                  </h3>
                  <button type="button" onClick={handleOpenAiChat} style={{
                    background: 'none', border: 'none', fontSize: '13px',
                    color: '#0078d4', cursor: 'pointer', fontWeight: 600,
                  }}>
                    Open in Workspace &rarr;
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {projectFiles.slice(0, 6).map((file) => {
                    const ext = file.fileName.toLowerCase().split('.').pop() ?? '';
                    const icon = ext === 'pdf' ? '[PDF]' : ['doc', 'docx'].includes(ext) ? '[DOC]' : ['xls', 'xlsx'].includes(ext) ? '[XLS]' : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? '[IMG]' : '[DOC]';
                    return (
                      <div key={file.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', background: '#f9fafb',
                        borderRadius: '8px', border: '1px solid #e5e7eb',
                      }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.fileName}
                          </p>
                          <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filePath}</p>
                        </div>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, flexShrink: 0,
                          background: file.indexStatus === 'indexed' ? '#dcfce7' : file.indexStatus === 'failed' ? '#fef2f2' : '#fef9c3',
                          color: file.indexStatus === 'indexed' ? '#166534' : file.indexStatus === 'failed' ? '#b91c1c' : '#92400e',
                        }}>
                          {file.indexStatus}
                        </span>
                      </div>
                    );
                  })}
                  {projectFilesTotal > 6 ? (
                    <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '6px' }}>
                      +{projectFilesTotal - 6} more files -- open workspace to see all
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {onboardingError || oneDriveMessageFromUrl ? (
              <div style={{
                marginTop: '16px', padding: '12px 16px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: '#b91c1c',
              }}>
                {onboardingError ?? oneDriveMessageFromUrl}
              </div>
            ) : null}
          </div>
        ) : null}

      </main>

      <OnboardingModal
        open={productTourOpen}
        onOpenChange={setProductTourOpen}
        projectName={activeProject?.name}
      />
    </div>
  );
}
