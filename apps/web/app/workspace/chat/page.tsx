'use client';

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, Suspense, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConversationStore } from './useConversationStore';
import './workspace.css';

const ConstructionPdfViewer = dynamic(() => import('./ConstructionPdfViewer'), { ssr: false, loading: () => null });

type DocKind = 'pdf' | 'txt' | 'docx' | 'xlsx' | 'image';

interface WorkspaceDoc {
  id: string;
  title: string;
  kind: DocKind;
  fileId?: string;
  url?: string;
  text?: string;
  page?: number;
  searchTerm?: string;
  source: 'library' | 'dropped';
}

interface ChatReference {
  fileName: string;
  displayName?: string;
  fileId?: string;
  suggestedPages?: number[];
  bestPage?: number;
  pageOrigin?: 'exact' | 'fallback' | 'mixed';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: ChatReference[];
  suggestions?: string[];
  isStreaming?: boolean;
}

interface ChatSessionRecord {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt?: string;
}

interface ChatSessionsListResponse {
  sessions: ChatSessionRecord[];
}

interface CreateChatSessionResponse {
  session?: ChatSessionRecord;
}

interface ChatSource {
  fileId: string;
  fileName: string;
  displayName?: string;
  relevance: number;
  suggestedPages?: number[];
  bestPage?: number;
  pageOrigin?: 'exact' | 'fallback' | 'mixed';
}

interface SendChatMessageResponse {
  content: string;
  sources?: ChatSource[];
  suggestions?: string[];
  autoOpenFileName?: string;
}

interface ProjectFilesListResponse {
  files: Array<{
    id: string;
    fileName: string;
  }>;
}

interface ProjectsListResponse {
  projects: Array<{
    id: string;
    name: string;
  }>;
}

interface DocumentDetailChunk {
  chunkIndex: number;
  chunkText: string;
  pageNumber?: number;
}

interface DocumentDetailResponse {
  fileId: string;
  fileName: string;
  chunks: DocumentDetailChunk[];
}

interface ViewerSearchHit {
  id: string;
  chunkIndex: number;
  pageNumber?: number;
  excerpt: string;
}

interface PdfCitationRequest {
  fileId: string;
  pageNumber: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  textSnippet?: string;
}

interface OpenPdfCitationArgs {
  fileId: string;
  pageNumber: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  textSnippet?: string;
}

declare global {
  interface Window {
    openPdfCitation?: (args: OpenPdfCitationArgs) => Promise<void>;
  }
}

const DOC_LIBRARY: WorkspaceDoc[] = [
  {
    id: 'doc-structural-report',
    title: 'structural-report.pdf',
    kind: 'pdf',
    url: '/sample.pdf',
    source: 'library',
  },
  {
    id: 'doc-site-notes',
    title: 'site-notes.txt',
    kind: 'txt',
    source: 'library',
    text: [
      'Project: North Tower Retrofit',
      'Safety status: clear',
      'Critical path risk: steel delivery slips by 4 days',
      'Action: coordinate alternate supplier quote by Wednesday',
      'Page 12 summary: concrete curing variance requires timeline adjustment',
    ].join('\n'),
  },
  {
    id: 'doc-contract-scope',
    title: 'contract-scope.docx',
    kind: 'docx',
    source: 'library',
  },
  {
    id: 'doc-cost-tracker',
    title: 'cost-tracker.xlsx',
    kind: 'xlsx',
    source: 'library',
  },
  {
    id: 'doc-crane-photo',
    title: 'crane-inspection.jpg',
    kind: 'image',
    source: 'library',
    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80',
  },
];

const SUGGESTED_PROMPTS = [
  'Open structural-report.pdf and summarize page 12',
  'Compare cost-tracker.xlsx with contract-scope.docx for overruns',
  'List unresolved risks in site-notes.txt',
  'Open crane-inspection.jpg and draft a safety observation',
];

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`;
}

function detectDocKind(fileName: string, mimeType?: string): DocKind | null {
  const lower = fileName.toLowerCase();

  if (mimeType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(lower)) {
    return 'image';
  }

  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    return 'pdf';
  }

  if (mimeType?.includes('word') || lower.endsWith('.docx')) {
    return 'docx';
  }

  if (mimeType?.includes('sheet') || lower.endsWith('.xlsx')) {
    return 'xlsx';
  }

  if (mimeType?.startsWith('text/') || lower.endsWith('.txt')) {
    return 'txt';
  }

  return null;
}

function buildProjectFileContentUrl(projectId: string, fileId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/content`;
}

function createDocFromFileName(
  fileName: string,
  options?: { projectId?: string; fileId?: string }
): WorkspaceDoc {
  const kind = detectDocKind(fileName) ?? 'txt';
  const id = `doc-runtime-${fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const projectFileUrl =
    kind === 'pdf' && options?.projectId && options?.fileId
      ? buildProjectFileContentUrl(options.projectId, options.fileId)
      : undefined;

  const baseDoc: WorkspaceDoc = {
    id,
    title: fileName,
    kind,
    fileId: options?.fileId,
    source: 'library',
  };

  if (kind === 'txt') {
    return {
      ...baseDoc,
      text: `Preview for ${fileName} is linked from AI citations.`,
    };
  }

  return {
    ...baseDoc,
    url: projectFileUrl,
  };
}

function highlightText(content: string, query: string): Array<string | JSX.Element> {
  if (!query.trim()) {
    return [content];
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'ig');
  const parts = content.split(regex);

  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <mark key={`hit-${idx}`} className="rounded bg-yellow-300 px-0.5 font-semibold text-slate-950">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function buildChunkExcerpt(text: string, query: string): string {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedText = text.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return text.slice(0, 180).trim();
  }

  const start = Math.max(0, matchIndex - 60);
  const end = Math.min(text.length, matchIndex + normalizedQuery.length + 90);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}

function extractNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractNodeText(child)).join(' ');
  }

  if (isValidElement(node)) {
    return extractNodeText(node.props.children as ReactNode);
  }

  return '';
}

function hasRenderableListItemText(node: ReactNode): boolean {
  const normalized = extractNodeText(node)
    .replace(/^[\s\-*+\u2022\u2023\u2043\u2219\u25E6\u2027\u00B7\uF0B7]+/g, '')
    .replace(/[\s.,:;!?()[\]{}'"`~_-]+/g, '')
    .trim();

  return normalized.length > 0;
}

function sanitizeAssistantMarkdown(content: string): string {
  return content
    .split('\n')
    .filter((line) => !/^\s*(?:[-*+]\s*)?(?:[\u2022\u2023\u2043\u2219\u25E6\u2027\u00B7\uF0B7]\s*)+$/.test(line))
    .join('\n');
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="absolute right-2 top-2 rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-600 opacity-0 transition group-hover:opacity-100"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-gray-700">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// --- File explorer types & helpers -------------------------------------------

interface WsFile {
  id: string;
  fileName: string;
  filePath: string;
  indexStatus: string;
}

interface FolderNode {
  path: string;
  name: string;
  files: WsFile[];
}

function getFileIcon(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return '[PDF]';
  if (['doc', 'docx'].includes(ext)) return '[DOC]';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '[XLS]';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '[IMG]';
  if (['dwg', 'dxf'].includes(ext)) return '[DWG]';
  if (['mpp'].includes(ext)) return '[SCH]';
  if (['rfi'].includes(ext) || fileName.toLowerCase().includes('rfi')) return '[RFI]';
  return '[DOC]';
}

function buildFolderTree(files: WsFile[]): FolderNode[] {
  const map = new Map<string, WsFile[]>();
  for (const file of files) {
    const parts = file.filePath.replace(/\\/g, '/').split('/');
    parts.pop();
    const folder = parts.filter(Boolean).join('/') || 'Project Files';
    if (!map.has(folder)) map.set(folder, []);
    map.get(folder)!.push(file);
  }
  return Array.from(map.entries()).map(([path, nodeFiles]) => ({
    path,
    name: path.split('/').filter(Boolean).pop() ?? path,
    files: nodeFiles,
  }));
}

interface FolderSectionProps {
  folder: FolderNode;
  isExpanded: boolean;
  activeFileId: string | undefined;
  onToggle: () => void;
  onFileClick: (file: WsFile) => void;
}

function FolderSection({ folder, isExpanded, activeFileId, onToggle, onFileClick }: FolderSectionProps) {
  return (
    <div>
      <button type="button" className="folder-header-btn" onClick={onToggle}>
        <span className={`folder-chevron ${isExpanded ? 'open' : ''}`}>&rsaquo;</span>
        <span>[DIR]</span>
        <span className="file-name-text">{folder.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9ca3af', flexShrink: 0, paddingLeft: '4px' }}>
          {folder.files.length}
        </span>
      </button>
      {isExpanded ? (
        <div>
          {folder.files.map((file) => (
            <button
              key={file.id}
              type="button"
              className={`file-row-btn ${activeFileId === file.id ? 'active' : ''}`}
              onClick={() => onFileClick(file)}
              title={file.fileName}
            >
              <span style={{ flexShrink: 0 }}>{getFileIcon(file.fileName)}</span>
              <span className="file-name-text">{file.fileName}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}




function ChatWorkspacePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProjectId = searchParams?.get('projectId') ?? null;
  const [inferredProjectId, setInferredProjectId] = useState<string | null>(null);
  const projectId = queryProjectId ?? inferredProjectId;
  const dashboardHref = projectId
    ? `/?projectId=${encodeURIComponent(projectId)}`
    : '/';

  const [openDocs, setOpenDocs] = useState<WorkspaceDoc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerSearchResults, setViewerSearchResults] = useState<ViewerSearchHit[]>([]);
  const [viewerSearchError, setViewerSearchError] = useState<string | null>(null);
  const [viewerSearchBusy, setViewerSearchBusy] = useState(false);
  const [viewerSearchAppliedTerm, setViewerSearchAppliedTerm] = useState('');
  const [activePdfPage, setActivePdfPage] = useState<number | undefined>(undefined);
  // Tracks the page currently visible in the viewer (scroll-driven). Never fed back into targetPage.
  const [displayedPdfPage, setDisplayedPdfPage] = useState<number | undefined>(undefined);
  const [citationRequest, setCitationRequest] = useState<PdfCitationRequest | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const [isTyping, setIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const {
    createSession: storeCreateSession,
    setActiveSession: storeSetActiveSession,
    fetchSessions: storeFetchSessions,
  } = useConversationStore();

  const [workspaceSearch, setWorkspaceSearch] = useState('');

  // -- File explorer state ----------------------------------------------------
  const [wsFiles, setWsFiles] = useState<WsFile[]>([]);
  const [wsFilesLoading, setWsFilesLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [fileSearch, setFileSearch] = useState('');

  // -- Panel widths (px) ------------------------------------------------------
  const [leftPanelWidth, setLeftPanelWidth] = useState(248);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [projectDisplayName, setProjectDisplayName] = useState<string>('');

  const panelRootRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const viewerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const docDetailCacheRef = useRef<Map<string, DocumentDetailResponse>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const resolveProjectFromApi = async () => {
      try {
        const response = await fetch('/api/projects', { method: 'GET', cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ProjectsListResponse;
        const projectList = payload.projects ?? [];
        const selectedProjectId = queryProjectId ?? projectId;

        if (selectedProjectId) {
          const selectedProject = projectList.find((project) => project.id === selectedProjectId);
          if (!cancelled) {
            setProjectDisplayName(selectedProject?.name ?? '');
          }
        }

        if (!queryProjectId) {
          const fallbackProjectId = projectList[0]?.id;
          if (!fallbackProjectId || cancelled) {
            return;
          }

          setInferredProjectId(fallbackProjectId);
          if (!projectDisplayName) {
            setProjectDisplayName(projectList[0]?.name ?? '');
          }
          router.replace(`/workspace/chat?projectId=${encodeURIComponent(fallbackProjectId)}`);
        } else if (!cancelled) {
          setInferredProjectId(null);
        }
      } catch {
        // Keep current state when project lookup fails; send handler will surface a clear error.
      }
    };

    void resolveProjectFromApi();

    return () => {
      cancelled = true;
    };
  }, [projectId, projectDisplayName, queryProjectId, router]);

  const activeDoc = useMemo(
    () => openDocs.find((doc) => doc.id === activeDocId) ?? null,
    [openDocs, activeDocId]
  );

  const openDoc = useCallback((doc: WorkspaceDoc) => {
    const existingMatch = openDocs.find(
      (item) => item.id === doc.id || (Boolean(doc.fileId) && item.fileId === doc.fileId)
    );
    const isSameActiveDoc = Boolean(
      activeDoc && (activeDoc.id === doc.id || (Boolean(doc.fileId) && activeDoc.fileId === doc.fileId))
    );
    const nextUrl = doc.url ?? existingMatch?.url;
    const shouldShowPdfLoading = doc.kind === 'pdf' && (!isSameActiveDoc || nextUrl !== activeDoc?.url);
    setViewerLoading(shouldShowPdfLoading);

    setOpenDocs((current) => {
      const existingIndex = current.findIndex(
        (item) => item.id === doc.id || (Boolean(doc.fileId) && item.fileId === doc.fileId)
      );
      if (existingIndex === -1) {
        return [...current, doc];
      }

      const next = [...current];
      const existing = next[existingIndex];
      next[existingIndex] = {
        ...existing,
        ...doc,
        url: doc.url ?? existing.url,
      };
      return next;
    });

    setActiveDocId(doc.id);
  }, [activeDoc, openDocs]);

  useEffect(() => {
    if (!activeDoc || activeDoc.kind !== 'pdf') {
      setViewerLoading(false);
      setActivePdfPage(undefined);
      setDisplayedPdfPage(undefined);
      return;
    }

    setActivePdfPage(activeDoc.page);
  }, [activeDoc]);

  const jumpToPdfPage = useCallback((page?: number) => {
    if (typeof page !== 'number') {
      return;
    }

    setActivePdfPage((current) => (current === page ? current : page));
  }, []);

  const runViewerSearch = useCallback(async (rawTerm?: string) => {
    const term = (rawTerm ?? viewerSearchInputRef.current?.value ?? '').trim();
    if (!term) {
      setViewerSearchAppliedTerm('');
      setViewerSearchResults([]);
      setViewerSearchError(null);
      return;
    }

    if (!activeDoc) {
      setViewerSearchResults([]);
      setViewerSearchError('Open a document first, then run search.');
      return;
    }

    setViewerSearchBusy(true);
    setViewerSearchAppliedTerm(term);
    setViewerSearchError(null);

    try {
      if (activeDoc.kind === 'txt') {
        const text = activeDoc.text ?? '';
        const lowered = text.toLowerCase();
        const loweredTerm = term.toLowerCase();
        const hits: ViewerSearchHit[] = [];
        let cursor = 0;

        while (cursor < lowered.length && hits.length < 25) {
          const next = lowered.indexOf(loweredTerm, cursor);
          if (next === -1) {
            break;
          }
          const start = Math.max(0, next - 60);
          const end = Math.min(text.length, next + loweredTerm.length + 90);
          const excerpt = `${start > 0 ? '...' : ''}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${end < text.length ? '...' : ''}`;
          hits.push({
            id: `txt-hit-${next}`,
            chunkIndex: hits.length + 1,
            excerpt,
          });
          cursor = next + loweredTerm.length;
        }

        setViewerSearchResults(hits);
        if (hits.length === 0) {
          setViewerSearchError(`No matches found for "${term}" in this document.`);
        }
        return;
      }

      if (!activeDoc.fileId || !projectId) {
        setViewerSearchResults([]);
        setViewerSearchError('Indexed search is unavailable for this document.');
        return;
      }

      const activeFileId = activeDoc.fileId;

      const cached = docDetailCacheRef.current.get(activeFileId);
      const detail = cached
        ? cached
        : await (async () => {
            const response = await fetch(
              `/api/files/${encodeURIComponent(activeFileId)}?projectId=${encodeURIComponent(projectId)}`,
              { method: 'GET', cache: 'no-store' }
            );

            if (!response.ok) {
              throw new Error(`Document search failed (${response.status}).`);
            }

            const payload = (await response.json()) as DocumentDetailResponse;
            docDetailCacheRef.current.set(activeFileId, payload);
            return payload;
          })();
      const loweredTerm = term.toLowerCase();
      const hits = (detail.chunks ?? [])
        .filter((chunk) => chunk.chunkText.toLowerCase().includes(loweredTerm))
        .slice(0, 25)
        .map((chunk) => ({
          id: `${chunk.chunkIndex}-${chunk.pageNumber ?? 'na'}`,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          excerpt: buildChunkExcerpt(chunk.chunkText, term),
        }));

      setViewerSearchResults(hits);
      if (hits.length === 0) {
        setViewerSearchError(`No matches found for "${term}" in indexed text.`);
      }

      const firstPageHit = hits.find((hit) => typeof hit.pageNumber === 'number');
      if (firstPageHit && activeDoc.kind === 'pdf') {
        jumpToPdfPage(firstPageHit.pageNumber);
      }
    } catch (error) {
      setViewerSearchResults([]);
      setViewerSearchError(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      setViewerSearchBusy(false);
    }
  }, [activeDoc, jumpToPdfPage, projectId]);

  const resolveProjectFileIdByName = useCallback(async (fileName: string): Promise<string | undefined> => {
    if (!projectId) {
      return undefined;
    }

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/files?search=${encodeURIComponent(fileName)}&page=1&pageSize=50`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        return undefined;
      }

      const payload = (await response.json()) as ProjectFilesListResponse;
      const exact = payload.files.find((file) => file.fileName.toLowerCase() === fileName.toLowerCase());
      if (exact) {
        return exact.id;
      }

      return payload.files[0]?.id;
    } catch {
      return undefined;
    }
  }, [projectId]);

  const openOrCreateDoc = useCallback(async (fileName: string, page?: number, fileId?: string) => {
    let resolvedFileId = fileId;
    if (!resolvedFileId && detectDocKind(fileName) === 'pdf') {
      resolvedFileId = await resolveProjectFileIdByName(fileName);
    }

    const existing = openDocs.find((doc) =>
      (resolvedFileId && doc.fileId === resolvedFileId) || doc.title.toLowerCase() === fileName.toLowerCase()
    )
      ?? DOC_LIBRARY.find((doc) => doc.title.toLowerCase() === fileName.toLowerCase());

    const previewUrl = resolvedFileId && projectId ? buildProjectFileContentUrl(projectId, resolvedFileId) : undefined;

    const doc = existing
      ? {
          ...existing,
          fileId: resolvedFileId ?? existing.fileId,
          page: page ?? existing.page,
            searchTerm: existing.searchTerm,
          url: previewUrl ?? existing.url,
        }
      : { ...createDocFromFileName(fileName, { projectId: projectId ?? undefined, fileId: resolvedFileId }), ...(page != null ? { page } : {}) };

    openDoc(doc);
  }, [openDoc, openDocs, projectId, resolveProjectFileIdByName]);

  useEffect(() => {
    document.body.classList.add('workspace-mode');

    return () => {
      document.body.classList.remove('workspace-mode');
    };
  }, []);

  useEffect(() => {
    // Only restore from localStorage for the active session; skip if we
    // already have messages (e.g. loaded from DB via loadSessionHistory).
    if (!chatSessionId || messages.length > 0) return;
    const cached = window.localStorage.getItem(`workspace-chat-session-${chatSessionId}`);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as Array<ChatMessage & { references?: Array<ChatReference | string> }>;
      const normalized = parsed.map((message) => ({
        ...message,
        references: Array.isArray(message.references)
          ? message.references.map((reference) =>
              typeof reference === 'string'
                ? { fileName: reference }
                : reference
            )
          : undefined,
      }));
      if (normalized.length > 0) setMessages(normalized);
    } catch {
      // ignore corrupted cache
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSessionId]);

  useEffect(() => {
    if (chatSessionId && messages.length > 0) {
      window.localStorage.setItem(`workspace-chat-session-${chatSessionId}`, JSON.stringify(messages));
    }
  }, [messages, chatSessionId]);

  // -- Load history for a previous session ---------------------------------
  // Defined here so it can be referenced by the loadSession startup effect below.
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    setChatError(null);
    setIsTyping(false);
    setMessages([]);

    try {
      const response = await fetch(
        `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
        { method: 'GET', cache: 'no-store' }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        setChatError(`Failed to load conversation history (${response.status}).`);
        setChatSessionId(null);
        return;
      }

      const payload = (await response.json()) as { messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; sources?: unknown[]; createdAt: string }> };
      const restored: ChatMessage[] = (payload.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        references: Array.isArray(m.sources)
          ? (m.sources as Array<{ fileName?: string; fileId?: string; displayName?: string }>)
              .filter((s) => s.fileName)
              .map((s) => ({
                fileName: s.fileName ?? '',
                displayName: s.displayName,
                fileId: s.fileId,
              }))
          : undefined,
      }));

      setChatSessionId(sessionId);
      setMessages(
        restored.length > 0
          ? restored
          : [
              {
                id: uid('m'),
                role: 'assistant',
                content: 'Session loaded. Continue the conversation below.',
              },
            ]
      );
    } catch {
      setChatError('Failed to load conversation history.');
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      setChatError(null);

      try {
        const response = await fetch('/api/chat/sessions', { method: 'GET' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ChatSessionsListResponse;
        const matching = (payload.sessions ?? [])
          .filter((session) => session.projectId === projectId)
          .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime());

        const latestId = matching[0]?.id ?? null;
        setChatSessionId(latestId);
        if (latestId) {
          storeSetActiveSession(latestId);
          // Auto-load the most recent session's messages on page open
          await loadSessionHistory(latestId);
        }
      } catch {
        setChatSessionId(null);
      }
    };

    void loadSession();
  }, [projectId, storeSetActiveSession, loadSessionHistory]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleBackToDashboard = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();

      // If there is no in-app history entry, fall back to the dashboard route.
      window.setTimeout(() => {
        if (window.location.pathname.startsWith('/workspace/chat')) {
          router.push(dashboardHref);
        }
      }, 140);
      return;
    }

    router.push(dashboardHref);
  }, [dashboardHref, router]);

  // Cycle status messages while waiting for AI response
  useEffect(() => {
    if (!isTyping) {
      setStatusMessage('');
      return;
    }
    const steps = [
      'Searching project files\u2026',
      'Reading indexed context\u2026',
      'Analyzing document graph\u2026',
      'Composing response\u2026',
    ];
    let idx = 0;
    setStatusMessage(steps[0]);
    const interval = window.setInterval(() => {
      idx = (idx + 1) % steps.length;
      setStatusMessage(steps[idx]);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!panelRootRef.current) return;
      const rect = panelRootRef.current.getBoundingClientRect();
      const totalWidth = rect.width;

      if (isDraggingLeft) {
        const newLeft = event.clientX - rect.left - 4;
        setLeftPanelWidth(Math.max(160, Math.min(400, newLeft)));
      }
      if (isDraggingRight) {
        const newRight = rect.right - event.clientX - 4;
        setRightPanelWidth(Math.max(280, Math.min(Math.round(totalWidth * 0.45), newRight)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  const handleCloseTab = (docId: string) => {
    setOpenDocs((current) => {
      const next = current.filter((doc) => doc.id !== docId);

      if (activeDocId === docId) {
        const lastDoc = next.length > 0 ? next[next.length - 1] : null;
        setActiveDocId(lastDoc?.id ?? null);
      }

      return next;
    });
  };

  const resolveReferencedDocs = (prompt: string): WorkspaceDoc[] => {
    const lowered = prompt.toLowerCase();
    return DOC_LIBRARY.filter((doc) => lowered.includes(doc.title.toLowerCase()));
  };

  // Detect whether the user wants to open/show a document
  const isOpenIntent = (prompt: string): boolean => {
    return /\b(open|show|pull up|display|bring up|view|load|launch|see|look at|find|get)\b/i.test(prompt);
  };

  const parseRequestedPage = (prompt: string): number | undefined => {
    const match = prompt.match(/\bpage\s+(\d+)\b|\bp\.?\s*(\d+)\b|\bslide\s+(\d+)\b/i);
    return match ? Number(match[1] ?? match[2] ?? match[3]) : undefined;
  };

  const ensureChatSession = useCallback(async (): Promise<string> => {
    if (chatSessionId) {
      return chatSessionId;
    }

    if (!projectId) {
      throw new Error('No project selected. Please open a project to start chatting.');
    }

    const response = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Session expired after backend restart -- redirect to re-login
        window.location.href = '/login';
        throw new Error('Your session has expired. Redirecting to login...');
      }
      const errBody = await response.json().catch(() => undefined) as { message?: string; error?: string } | undefined;
      throw new Error(errBody?.message ?? errBody?.error ?? `Unable to create a chat session (${response.status}).`);
    }

    const payload = (await response.json()) as CreateChatSessionResponse;
    const sessionId = payload.session?.id;

    if (!sessionId) {
      throw new Error('Chat session setup returned an invalid response.');
    }

    setChatSessionId(sessionId);
    storeSetActiveSession(sessionId);
    // Refresh sidebar history so the new session appears immediately
    void storeFetchSessions();
    return sessionId;
  }, [chatSessionId, projectId, storeFetchSessions, storeSetActiveSession]);

  // -- Sidebar: create a brand-new chat -------------------------------------
  const handleSidebarNewChat = useCallback(async (): Promise<string | null> => {
    if (!projectId) return null;
    // Clear current message window and viewer state (optimistic)
    setMessages([]);
    setChatSessionId(null);
    setChatError(null);
    setIsTyping(false);
    setOpenDocs([]);
    setActiveDocId(null);
    setViewerLoading(false);
    setActivePdfPage(undefined);
    setDisplayedPdfPage(undefined);

    try {
      const newId = await storeCreateSession(projectId);
      setChatSessionId(newId);
      storeSetActiveSession(newId);
      setMessages([
        {
          id: uid('m'),
          role: 'assistant',
          content: 'New conversation started. How can I help you today?',
        },
      ]);
      return newId;
    } catch {
      return null;
    }
  }, [projectId, storeCreateSession, storeSetActiveSession]);

  const streamAssistantMessage = useCallback(async (fullText: string, references: ChatReference[], suggestions?: string[]) => {
    setMessages((current) => [
      ...current,
      {
        id: uid('m'),
        role: 'assistant',
        content: fullText,
        references,
        suggestions,
        isStreaming: false,
      },
    ]);
  }, []);

  const handleSendPrompt = useCallback(async (rawPrompt?: string) => {
    const prompt = (rawPrompt ?? promptInputRef.current?.value ?? '').trim();
    if (!prompt) {
      return;
    }

    if (!rawPrompt && promptInputRef.current) {
      promptInputRef.current.value = '';
    }
    setChatError(null);
    setMessages((current) => [
      ...current,
      {
        id: uid('m'),
        role: 'user',
        content: prompt,
      },
    ]);

    setIsTyping(true);

    const referencedDocs = resolveReferencedDocs(prompt);
    const requestedPage = parseRequestedPage(prompt);
    const wantsOpen = isOpenIntent(prompt);

    // Immediately open any directly-named doc from the library
    if (wantsOpen && referencedDocs.length > 0) {
      openDoc({ ...referencedDocs[0], page: requestedPage });
    }

    try {
      const sessionId = await ensureChatSession();

      // Pass current workspace state as context
      const currentOpenDocs = openDocs.map((d) => ({ fileName: d.title, fileId: d.fileId, page: d.page }));
      const currentActiveDoc = activeDoc?.title;
      const currentActiveDocFileId = activeDoc?.fileId;

      const response = await fetch(`/api/chat/sessions/${encodeURIComponent(sessionId)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: prompt,
          history: messagesRef.current
            .filter((m) => !m.isStreaming)
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content })),
          openDocs: currentOpenDocs,
          activeDocFileName: currentActiveDoc,
          activeDocFileId: currentActiveDocFileId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          throw new Error('Your session has expired. Redirecting to login...');
        }
        const errorPayload = (await response.json().catch(() => undefined)) as
          | { message?: string; error?: string }
          | undefined;
        throw new Error(errorPayload?.message ?? errorPayload?.error ?? 'AI chat request failed.');
      }

      const payload = (await response.json()) as SendChatMessageResponse;
      const responseText = payload.content?.trim() || 'No response content returned.';
      const referencesMap = new Map<string, ChatReference>();

      for (const doc of referencedDocs) {
        referencesMap.set(doc.title.toLowerCase(), {
          fileName: doc.title,
          displayName: doc.title,
          fileId: doc.fileId,
        });
      }
      for (const source of payload.sources ?? []) {
        referencesMap.set(source.fileName.toLowerCase(), {
          fileName: source.fileName,
          displayName: source.displayName,
          fileId: source.fileId,
          suggestedPages: source.suggestedPages,
          bestPage: source.bestPage,
          pageOrigin: source.pageOrigin,
        });
      }
      const references = Array.from(referencesMap.values());

      // The primary source's best page (from AI citation evidence)
      const primaryBestPage = references[0]?.bestPage ?? references[0]?.suggestedPages?.[0];

      // Auto-open best source if open intent or no doc is open
      const shouldAutoOpen = wantsOpen || (!activeDoc && references.length > 0);
      if (shouldAutoOpen && references.length > 0) {
        await openOrCreateDoc(references[0].fileName, requestedPage ?? primaryBestPage, references[0].fileId);
      } else if (payload.autoOpenFileName && !wantsOpen && references.length > 0) {
        // Proactively open the top source when AI finds strong evidence.
        await openOrCreateDoc(references[0].fileName, primaryBestPage, references[0].fileId);
      }

      // If the active doc is already open and the AI cited a specific page, jump to it.
      if (
        !shouldAutoOpen &&
        primaryBestPage &&
        activeDoc?.kind === 'pdf' &&
        references.length > 0 &&
        (activeDoc.fileId === references[0].fileId ||
          activeDoc.title.toLowerCase() === references[0].fileName.toLowerCase())
      ) {
        jumpToPdfPage(primaryBestPage);
      }

      setIsTyping(false);
      await streamAssistantMessage(responseText, references, payload.suggestions);
    } catch (error) {
      setIsTyping(false);
      setChatError(error instanceof Error ? error.message : 'AI chat request failed.');
    }
  }, [activeDoc, ensureChatSession, isOpenIntent, jumpToPdfPage, openDoc, openDocs, openOrCreateDoc, parseRequestedPage, resolveReferencedDocs, streamAssistantMessage]);

  const handlePromptKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      void handleSendPrompt();
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void handleSendPrompt();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        void handleSendPrompt();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleSendPrompt]);

  const filteredLibrary = useMemo(() => {
    if (!workspaceSearch.trim()) {
      return DOC_LIBRARY;
    }

    const lowered = workspaceSearch.toLowerCase();
    return DOC_LIBRARY.filter((doc) => doc.title.toLowerCase().includes(lowered));
  }, [workspaceSearch]);

  // -- Fetch project files for the left panel explorer -----------------------
  useEffect(() => {
    if (!projectId) {
      setWsFiles([]);
      return;
    }

    let cancelled = false;
    setWsFilesLoading(true);

    fetch(`/api/projects/${encodeURIComponent(projectId)}/files?page=1&pageSize=300`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`${r.status}`)))
      .then((data: { files: WsFile[] }) => {
        if (cancelled) return;
        const files = data.files ?? [];
        setWsFiles(files);
        // Auto-expand first folder
        const tree = buildFolderTree(files);
        if (tree[0]) {
          setExpandedFolders(new Set([tree[0].path]));
        }
      })
      .catch(() => { if (!cancelled) setWsFiles([]); })
      .finally(() => { if (!cancelled) setWsFilesLoading(false); });

    return () => { cancelled = true; };
  }, [projectId]);

  const folderTree = useMemo(() => {
    const filtered = fileSearch.trim()
      ? wsFiles.filter((f) => f.fileName.toLowerCase().includes(fileSearch.toLowerCase()))
      : wsFiles;
    return buildFolderTree(filtered);
  }, [wsFiles, fileSearch]);

  const handleExplorerFileClick = useCallback(
    (file: WsFile) => {
      void openOrCreateDoc(file.fileName, undefined, file.id);
    },
    [openOrCreateDoc]
  );

  useEffect(() => {
    window.openPdfCitation = async (args: OpenPdfCitationArgs) => {
      const candidate = wsFiles.find((file) => file.id === args.fileId);
      if (!candidate) {
        return;
      }

      await openOrCreateDoc(candidate.fileName, args.pageNumber, args.fileId);
      setCitationRequest({
        fileId: args.fileId,
        pageNumber: args.pageNumber,
        boundingBox: args.boundingBox,
        textSnippet: args.textSnippet,
      });
      setActivePdfPage(args.pageNumber);
    };

    return () => {
      if (window.openPdfCitation) {
        delete window.openPdfCitation;
      }
    };
  }, [openOrCreateDoc, wsFiles]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleDropFiles = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropActive(false);

    const droppedFiles = Array.from(event.dataTransfer.files);
    for (const file of droppedFiles) {
      const kind = detectDocKind(file.name, file.type);
      if (!kind) {
        continue;
      }

      const objectUrl = URL.createObjectURL(file);
      const nextDoc: WorkspaceDoc = {
        id: uid('d'),
        title: file.name,
        kind,
        url: objectUrl,
        source: 'dropped',
      };

      if (kind === 'txt') {
        nextDoc.text = await file.text();
      }

      openDoc(nextDoc);
    }
  };

  const renderDocumentBody = () => {
    if (!activeDoc) {
      return (
        <div className="viewer-empty">
          <div className="viewer-empty-icon">[ ]</div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Select a document to preview it here</p>
          <p style={{ fontSize: '12px', lineHeight: '1.6', maxWidth: '200px' }}>
            Supported: PDFs, drawings, specifications, RFIs, submittals, schedules, and photos.
          </p>
        </div>
      );
    }

    if (viewerLoading && activeDoc.kind !== 'pdf') {
      return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '200px', background: '#f3f4f6', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        </div>
      );
    }

    if (activeDoc.kind === 'pdf') {
      if (!activeDoc.url) {
        return (
          <div style={{ padding: '24px', color: '#6b7280' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>PDF Preview Unavailable</h4>
            <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
              This PDF was opened from a citation, but no preview URL is available yet.
            </p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              File: <strong style={{ color: '#111827' }}>{activeDoc.title}</strong>
            </p>
          </div>
        );
      }
      return (
        <ConstructionPdfViewer
          projectId={projectId}
          fileId={activeDoc.fileId}
          fileName={activeDoc.title}
          url={activeDoc.url}
          initialPage={activePdfPage ?? activeDoc.page ?? 1}
          citationRequest={
            citationRequest && activeDoc.fileId && citationRequest.fileId === activeDoc.fileId
              ? citationRequest
              : null
          }
          onCitationHandled={() => {
            setCitationRequest(null);
          }}
          onVisiblePageChange={(page) => {
            setDisplayedPdfPage(page);
            setActivePdfPage(page);
          }}
        />
      );
    }

    if (activeDoc.kind === 'txt') {
      return (
        <div style={{ height: '100%', overflow: 'auto', padding: '16px', fontFamily: 'Consolas, monospace', fontSize: '13px', lineHeight: '1.7', color: '#374151', background: '#fafafa', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          {highlightText(activeDoc.text ?? 'No text available.', viewerSearchAppliedTerm)}
        </div>
      );
    }

    if (activeDoc.kind === 'image') {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '12px' }}>
          <img
            src={activeDoc.url}
            alt={activeDoc.title}
            style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }}
          />
        </div>
      );
    }

    return (
      <div style={{ padding: '24px', color: '#6b7280' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Preview Ready</h4>
        <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
          {activeDoc.kind === 'docx'
            ? 'DOCX rendering will be available in a future update. AI can still read and cite this file.'
            : 'Excel preview is coming soon. AI can still read and cite this file.'}
        </p>
      </div>
    );
  };

  const markdownComponents = useMemo(() => ({
    h1({ children }: { children?: ReactNode }) {
      return <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px', marginTop: '4px' }}>{children}</h1>;
    },
    h2({ children }: { children?: ReactNode }) {
      return <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '6px', marginTop: '4px' }}>{children}</h2>;
    },
    h3({ children }: { children?: ReactNode }) {
      return <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: '#374151', marginBottom: '4px', marginTop: '4px' }}>{children}</h3>;
    },
    ul({ children }: { children?: ReactNode }) {
      return <ul style={{ paddingLeft: '16px', marginBottom: '6px', marginTop: '4px' }}>{children}</ul>;
    },
    ol({ children }: { children?: ReactNode }) {
      return <ol style={{ paddingLeft: '18px', marginBottom: '6px', marginTop: '4px', listStyleType: 'decimal' }}>{children}</ol>;
    },
    li({ children }: { children?: ReactNode }) {
      if (!hasRenderableListItemText(children)) return null;
      return <li style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#374151', marginBottom: '3px' }}>{children}</li>;
    },
    p({ children }: { children?: ReactNode }) {
      return <p style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#374151', marginBottom: '6px' }}>{children}</p>;
    },
    strong({ children }: { children?: ReactNode }) {
      return <strong style={{ fontWeight: 600, color: '#111827' }}>{children}</strong>;
    },
    code({ className, children }: { className?: string; children?: ReactNode }) {
      const codeText = String(children).replace(/\n$/, '');
      if (className && className.includes('language-')) {
        return <CodeBlock code={codeText} />;
      }
      return <code style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1px 5px', fontSize: '12px', fontFamily: 'Consolas, monospace' }}>{children}</code>;
    },
  }), []);

  const renderedChatMessages = useMemo(() => messages.map((message) => {
    const isAssistant = message.role === 'assistant';
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: isAssistant ? 'flex-start' : 'flex-end' }}
      >
        <div className={isAssistant ? 'chat-bubble-assistant' : 'chat-bubble-user'}>
          {isAssistant ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {sanitizeAssistantMarkdown(message.content)}
            </ReactMarkdown>
          ) : (
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px', lineHeight: '1.55', margin: 0 }}>{message.content}</p>
          )}

          {message.references?.length ? (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {message.references.map((reference) => (
                <button
                  key={`${message.id}-${reference.fileId ?? reference.fileName}`}
                  type="button"
                  className="source-chip"
                  onClick={() => {
                    const trustedSuggestedPages = reference.pageOrigin === 'exact' ? reference.suggestedPages : undefined;
                    void openOrCreateDoc(
                      reference.fileName,
                      reference.pageOrigin === 'exact' ? (reference.bestPage ?? trustedSuggestedPages?.[0]) : undefined,
                      reference.fileId
                    );
                  }}
                >
                  [DOC] {reference.displayName ?? reference.fileName}
                  {reference.pageOrigin === 'exact' && reference.suggestedPages && reference.suggestedPages.length > 0
                    ? ` · p. ${reference.suggestedPages.join(', ')}`
                    : ''}
                </button>
              ))}
            </div>
          ) : null}

          {!message.isStreaming && message.suggestions?.length ? (
            <div style={{ marginTop: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: '6px' }}>Follow-up</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {message.suggestions.map((suggestion) => (
                  <button
                    key={`${message.id}-sug-${suggestion}`}
                    type="button"
                    className="ws-chip"
                    onClick={() => void handleSendPrompt(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {message.isStreaming ? (
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0078d4', marginTop: '6px', animation: 'pulse 1s infinite' }} />
          ) : null}
        </div>
      </motion.div>
    );
  }), [handleSendPrompt, markdownComponents, messages, openOrCreateDoc]);

  return (
    <div className="workspace-root">
      {/* Top Bar */}
      <header className="ws-topbar">
        <button
          type="button"
          onClick={handleBackToDashboard}
          style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', color: '#374151', fontFamily: 'inherit', flexShrink: 0 }}
        >
           Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div style={{ width: '28px', height: '28px', background: '#0078d4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }}>AI</div>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>ContractorAI</span>
        </div>
        {projectId ? (
          <>
            <div style={{ width: '1px', height: '16px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '13px', color: '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {projectDisplayName || `Project ${projectId.slice(0, 8)}...`}
            </span>
          </>
        ) : null}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <input
            ref={searchInputRef}
            value={workspaceSearch}
            onChange={(e) => setWorkspaceSearch(e.target.value)}
            placeholder="Search (Ctrl+K)"
            style={{ height: '32px', width: '180px', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0 12px', fontSize: '12px', outline: 'none', background: '#f9fafb' }}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSidebarNewChat()}
          style={{ background: '#0078d4', color: '#fff', border: 'none', borderRadius: '7px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        >
          + New Chat
        </button>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1d4ed8', flexShrink: 0 }}>
          GK
        </div>
      </header>

      {/* Three Panels */}
      <div className="ws-panels" ref={panelRootRef}>

        {/* Panel 1: File Explorer */}
        <section className="ws-panel" style={{ width: leftPanelCollapsed ? 28 : leftPanelWidth, flexShrink: 0, overflow: 'hidden' }}>
          <div className="ws-panel-header" style={{ justifyContent: 'space-between' }}>
            {!leftPanelCollapsed ? <span className="ws-panel-title">Project Files</span> : <span />}
            <button
              type="button"
              onClick={() => setLeftPanelCollapsed((c) => !c)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}
              title={leftPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {leftPanelCollapsed ? '\u25b6' : '\u25c4'}
            </button>
          </div>
          <div style={{ display: leftPanelCollapsed ? 'none' : 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* File search */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
            <input
              type="text"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="Search files..."
              style={{ width: '100%', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none', background: '#f9fafb' }}
            />
          </div>
          {/* Tree */}
          <div className="file-explorer-body">
            {wsFilesLoading ? (
              <div style={{ padding: '14px 12px', fontSize: '12px', color: '#9ca3af' }}>Loading project files...</div>
            ) : folderTree.length > 0 ? (
              folderTree.map((folder) => (
                <FolderSection
                  key={folder.path}
                  folder={folder}
                  isExpanded={expandedFolders.has(folder.path)}
                  activeFileId={activeDoc?.fileId}
                  onToggle={() => toggleFolder(folder.path)}
                  onFileClick={handleExplorerFileClick}
                />
              ))
            ) : (
              <div style={{ padding: '14px 12px', fontSize: '12px', color: '#9ca3af', lineHeight: '1.6' }}>
                {fileSearch.trim()
                  ? 'No matching files'
                  : !projectId
                    ? 'Open a project from the dashboard.'
                    : 'No project files yet. Run a sync from the dashboard.'}
              </div>
            )}
            {/* DOC_LIBRARY sample files */}
            {filteredLibrary.length > 0 ? (
              <div style={{ borderTop: '1px solid #f3f4f6', padding: '8px 0 4px' }}>
                <p style={{ fontSize: '10px', color: '#9ca3af', padding: '0 10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Sample Files
                </p>
                {filteredLibrary.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className={`file-row-btn ${activeDoc?.id === doc.id ? 'active' : ''}`}
                    onClick={() => openDoc(doc)}
                  >
                    <span style={{ flexShrink: 0 }}>
                      {doc.kind === 'pdf' ? 'DOC' : doc.kind === 'image' ? 'DOC' : doc.kind === 'xlsx' ? 'DOC' : doc.kind === 'docx' ? 'DOC' : 'DOC'}
                    </span>
                    <span className="file-name-text">{doc.title}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          </div>
        </section>

        {/* Divider 1 */}
        <div className="ws-divider" onMouseDown={() => setIsDraggingLeft(true)}>
          <div className="ws-divider-handle" />
        </div>

        {/* Panel 2: Document Viewer */}
        <section
          className="ws-panel"
          style={{ flex: 1, minWidth: 200, overflow: 'hidden' }}
          onDragOver={(e) => { e.preventDefault(); setIsDropActive(true); }}
          onDragLeave={() => setIsDropActive(false)}
          onDrop={handleDropFiles}
        >
          {/* Viewer toolbar */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            {/* Doc tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', overflowX: 'auto', minHeight: '40px' }}>
              {openDocs.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>No documents open -- select a file from the left panel</span>
              ) : (
                openDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className={`doc-tab ${doc.id === activeDocId ? 'active' : ''}`}
                    onClick={() => setActiveDocId(doc.id)}
                  >
                    <span>
                      {doc.kind === 'pdf' ? 'DOC' : doc.kind === 'image' ? 'DOC' : doc.kind === 'xlsx' ? 'DOC' : doc.kind === 'docx' ? 'DOC' : 'DOC'}
                    </span>
                    <span>{doc.title}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      style={{ fontSize: '11px', color: '#9ca3af', padding: '0 2px', cursor: 'pointer', lineHeight: 1 }}
                      onClick={(e) => { e.stopPropagation(); handleCloseTab(doc.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleCloseTab(doc.id); } }}
                    >
                      x
                    </span>
                  </button>
                ))
              )}
            </div>
            {/* Search + zoom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px 7px', flexWrap: 'wrap' }}>
              <input
                ref={viewerSearchInputRef}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void runViewerSearch(e.currentTarget.value); } }}
                placeholder="Search in document"
                style={{ flex: 1, minWidth: '120px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none', background: '#fff' }}
                disabled={activeDoc?.kind === 'pdf'}
              />
              <button
                type="button"
                onClick={() => void runViewerSearch()}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', cursor: 'pointer' }}
                disabled={activeDoc?.kind === 'pdf'}
              >
                {viewerSearchBusy ? '...' : 'Find'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (viewerSearchInputRef.current) viewerSearchInputRef.current.value = '';
                  setViewerSearchAppliedTerm('');
                  setViewerSearchResults([]);
                  setViewerSearchError(null);
                }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#6b7280' }}
              >
                Clear
              </button>
              {activeDoc?.kind === 'pdf' ? (
                <p style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
                  PDF search and navigation are available in the viewer toolbar below.
                </p>
              ) : null}
            </div>
          </div>
          {/* Search results */}
          {(activeDoc?.kind !== 'pdf' && (viewerSearchAppliedTerm || viewerSearchError)) ? (
            <div style={{ maxHeight: '110px', overflowY: 'auto', borderBottom: '1px solid #e5e7eb', background: '#fafafa', padding: '7px 10px', flexShrink: 0 }}>
              {viewerSearchError ? <p style={{ fontSize: '12px', color: '#d83b01' }}>{viewerSearchError}</p> : null}
              {!viewerSearchError && viewerSearchResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                    {viewerSearchResults.length} match{viewerSearchResults.length === 1 ? '' : 'es'} for &ldquo;{viewerSearchAppliedTerm}&rdquo;
                  </p>
                  {viewerSearchResults.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      className="search-result-btn"
                      onClick={() => { if (typeof hit.pageNumber === 'number') jumpToPdfPage(hit.pageNumber); }}
                    >
                      <span style={{ color: '#0078d4', marginRight: '6px', fontSize: '11px' }}>
                        {typeof hit.pageNumber === 'number' ? `p.${hit.pageNumber}` : `chunk ${hit.chunkIndex}`}
                      </span>
                      {hit.excerpt}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {/* Viewer body */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {isDropActive ? (
              <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,246,255,0.92)', border: '2px dashed #0078d4', margin: '8px', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0078d4' }}>Drop files to open in viewer</p>
              </div>
            ) : null}
            <div style={{ height: '100%', overflow: 'hidden', padding: '8px' }}>
              {renderDocumentBody()}
            </div>
          </div>
        </section>

        {/* Divider 2 */}
        <div className="ws-divider" onMouseDown={() => setIsDraggingRight(true)}>
          <div className="ws-divider-handle" />
        </div>

        {/* Panel 3: AI Chat */}
        <section className="ws-panel" style={{ width: rightPanelCollapsed ? 28 : rightPanelWidth, flexShrink: 0, minWidth: rightPanelCollapsed ? 28 : 280 }}>
          <div className="ws-panel-header" style={{ justifyContent: 'space-between' }}>
            {!rightPanelCollapsed ? <span className="ws-panel-title">AI Assistant</span> : <span />}
            {!rightPanelCollapsed ? (
              <button
                type="button"
                onClick={() => void handleSidebarNewChat()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#0078d4', fontWeight: 600, fontFamily: 'inherit', padding: '2px 0' }}
              >
                + New Chat
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setRightPanelCollapsed((c) => !c)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}
              title={rightPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {rightPanelCollapsed ? '\u25c4' : '\u25b6'}
            </button>
          </div>
          <div style={{ display: rightPanelCollapsed ? 'none' : 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* Messages */}
          <div ref={chatScrollRef} className="chat-messages-scroll">
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>[ ]</div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Ask about your project</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', maxWidth: '200px' }}>
                  Questions about documents, RFIs, submittals, schedules, and field coordination.
                </p>
              </div>
            ) : renderedChatMessages}
            {isTyping ? (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px 18px 18px 18px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="typing-dots"><span /><span /><span /></div>
                  {statusMessage ? <span style={{ fontSize: '11px', color: '#9ca3af' }}>{statusMessage}</span> : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Input */}
          <div className="chat-input-area">
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ws-chip"
                    onClick={() => {
                      if (promptInputRef.current) promptInputRef.current.value = prompt;
                      promptInputRef.current?.focus();
                    }}
                  >
                    {prompt.length > 36 ? `${prompt.slice(0, 36)}...` : prompt}
                  </button>
                ))}
              </div>
            ) : null}
            <form
              onSubmit={(e: FormEvent) => { e.preventDefault(); void handleSendPrompt(); }}
              className="chat-input-box"
            >
              {chatError ? <p style={{ padding: '8px 14px 0', fontSize: '12px', color: '#d83b01', lineHeight: '1.5' }}>{chatError}</p> : null}
              <textarea
                ref={promptInputRef}
                onKeyDown={handlePromptKeyDown}
                className="chat-textarea"
                placeholder="Ask about project documents, RFIs, submittals, schedules..."
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 10px 8px', gap: '6px' }}>
                <button
                  type="submit"
                  style={{ background: '#0078d4', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default function ChatWorkspacePage() {
  return (
    <Suspense fallback={null}>
      <ChatWorkspacePageContent />
    </Suspense>
  );
}

