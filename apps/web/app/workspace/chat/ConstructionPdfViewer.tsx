'use client';

import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type SidebarTab = 'thumbnails' | 'bookmarks' | 'markups';
type FitMode = 'manual' | 'width' | 'page';
type Tool = 'select' | 'pan' | 'cloud' | 'arrow' | 'text' | 'highlight' | 'line' | 'rectangle' | 'calibrate' | 'length' | 'area' | 'count';
type MarkupType = Exclude<Tool, 'select' | 'pan'>;

const CATEGORIES = ['RFI', 'Design Conflict', 'QC Issue', 'Field Verify', 'Change Order Potential', 'Submittal Comment', 'Safety Issue', 'General Comment'] as const;
const STATUSES = ['Open', 'In Review', 'Answered', 'Closed', 'Void'] as const;
const UNITS = ['ft', 'in', 'yd', 'sf', 'cy', 'm', 'mm'] as const;

interface Point { x: number; y: number; }
interface CitationRequest { fileId: string; pageNumber: number; boundingBox?: { x: number; y: number; width: number; height: number }; textSnippet?: string; }
interface SearchHit { id: string; pageNumber: number; snippet: string; }
interface Markup {
  id: string;
  projectId: string;
  fileId: string;
  pageNumber: number;
  type: MarkupType;
  coordinates: Record<string, unknown>;
  measurement?: { kind?: 'calibration' | 'length' | 'area' | 'count'; value?: number; unit?: string; calibration?: { pixels?: number; realValue?: number; unit?: string } };
  category: string;
  status: string;
  comment?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  projectId?: string | null;
  fileId?: string;
  fileName: string;
  url: string;
  initialPage?: number;
  citationRequest?: CitationRequest | null;
  onCitationHandled?: () => void;
  onVisiblePageChange?: (page: number) => void;
}

type OutlineItem = {
  title: string;
  bold?: boolean;
  italic?: boolean;
  dest?: string | unknown[] | null;
  url?: string | null;
  items?: OutlineItem[];
};

function BookmarkItem({ item, depth, onJump }: { item: OutlineItem; depth: number; onJump: (dest: string | unknown[] | null) => void }) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasChildren = Boolean(item.items && item.items.length > 0);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: depth * 12 }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded((e) => !e)}
            style={{ border: 'none', background: 'none', padding: '1px 4px', cursor: 'pointer', color: '#6b7280', fontSize: 10, lineHeight: 1, flexShrink: 0 }}
          >
            {isExpanded ? '\u25be' : '\u25b8'}
          </button>
        ) : (
          <span style={{ display: 'inline-block', width: 20, flexShrink: 0 }} />
        )}
        <button
          type="button"
          onClick={() => onJump(item.dest ?? null)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', padding: '3px 4px', flex: 1, fontSize: 12, color: '#1e40af', fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? 'italic' : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {item.title}
        </button>
      </div>
      {isExpanded && hasChildren
        ? item.items!.map((child, idx) => (
            <BookmarkItem key={`${child.title}-${idx}`} item={child} depth={depth + 1} onJump={onJump} />
          ))
        : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
function toNum(v: unknown, fallback = 0): number { return typeof v === 'number' && Number.isFinite(v) ? v : fallback; }
function toPositiveInt(value: unknown, fallback = 1): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}
function clampBoundingBox(box?: { x: number; y: number; width: number; height: number }): { x: number; y: number; width: number; height: number } | undefined {
  if (!box) return undefined;
  const x = clamp(toNum(box.x), 0, 1);
  const y = clamp(toNum(box.y), 0, 1);
  const maxWidth = Math.max(0, 1 - x);
  const maxHeight = Math.max(0, 1 - y);
  const width = clamp(toNum(box.width), 0, maxWidth);
  const height = clamp(toNum(box.height), 0, maxHeight);
  if (width <= 0 || height <= 0) return undefined;
  return { x, y, width, height };
}
function rectFrom(a: Point, b: Point): { x: number; y: number; width: number; height: number } { return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) }; }
function pointDistance(a: Point, b: Point): number { const dx = a.x - b.x; const dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
function polygonArea(points: Point[]): number { if (points.length < 3) return 0; let acc = 0; for (let i = 0; i < points.length; i += 1) { const j = (i + 1) % points.length; acc += points[i].x * points[j].y - points[j].x * points[i].y; } return Math.abs(acc / 2); }

function triggerDownloadFromResponse(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export default function ConstructionPdfViewer({ projectId, fileId, fileName, url, initialPage, citationRequest, onCitationHandled, onVisiblePageChange }: Props) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const pageHostRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const textCacheRef = useRef<Map<number, string>>(new Map());
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const continuousScrollRef = useRef<HTMLDivElement | null>(null);
  const markupDragRef = useRef<{ markupId: string; handle: string; startPoint: Point; startCoords: Record<string, unknown> } | null>(null);
  const latestMarkupsRef = useRef<Markup[]>([]);
  const markupResizeDragRef = useRef<{ startY: number; startH: number } | null>(null);
  const draftStartRef = useRef<Point | null>(null);
  const draftCurrentRef = useRef<Point | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage ?? 1);
  const [zoom, setZoom] = useState(120);
  const [fitMode, setFitMode] = useState<FitMode>('manual');
  const [rotation, setRotation] = useState(0);
  const [tab, setTab] = useState<SidebarTab>('thumbnails');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tool, setTool] = useState<Tool>('pan');
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('ft');
  const [isPanning, setIsPanning] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [hitIndex, setHitIndex] = useState(-1);

  const [markups, setMarkups] = useState<Markup[]>([]);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState<Point | null>(null);
  const [draftCurrent, setDraftCurrent] = useState<Point | null>(null);
  const [draftAreaPoints, setDraftAreaPoints] = useState<Point[]>([]);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPage, setFilterPage] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [sortBy, setSortBy] = useState<'page' | 'date' | 'status' | 'category'>('page');

  const [citationFlash, setCitationFlash] = useState<CitationRequest | null>(null);
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [scrollMode, setScrollMode] = useState<'single' | 'continuous'>('continuous');
  const [markupPanelHeight, setMarkupPanelHeight] = useState(200);
  const [markupPanelCollapsed, setMarkupPanelCollapsed] = useState(false);

  const scale = useMemo(() => {
    const host = viewerRef.current;
    if (!host) return zoom / 100;
    if (fitMode === 'manual') return zoom / 100;
    const w = host.clientWidth - 40;
    const h = host.clientHeight - 40;
    const baseW = rotation % 180 === 0 ? 612 : 792;
    const baseH = rotation % 180 === 0 ? 792 : 612;
    if (fitMode === 'width') return Math.max(0.3, w / baseW);
    return Math.max(0.3, Math.min(w / baseW, h / baseH));
  }, [zoom, fitMode, rotation]);

  const filteredMarkups = useMemo(() => {
    const assigned = filterAssigned.trim().toLowerCase();
    const next = markups.filter((m) => {
      if (filterStatus && m.status !== filterStatus) return false;
      if (filterCategory && m.category !== filterCategory) return false;
      if (filterPage && String(m.pageNumber) !== filterPage) return false;
      if (assigned && !(m.assignedTo ?? '').toLowerCase().includes(assigned)) return false;
      return true;
    });
    next.sort((a, b) => {
      if (sortBy === 'page') return a.pageNumber - b.pageNumber;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return next;
  }, [markups, filterStatus, filterCategory, filterPage, filterAssigned, sortBy]);

  const selectedMarkup = useMemo(() => markups.find((m) => m.id === selectedMarkupId) ?? null, [markups, selectedMarkupId]);

  const loadMarkups = useCallback(async () => {
    if (!projectId || !fileId) { setMarkups([]); return; }
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/markups`, { method: 'GET', cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json()) as { markups?: Markup[] };
      setMarkups(payload.markups ?? []);
    } catch {
      setMarkups([]);
    }
  }, [projectId, fileId]);

  const jumpToOutlineItem = useCallback(async (dest: string | unknown[] | null) => {
    const doc = pdfRef.current;
    if (!doc || !dest) return;
    try {
      let explicitDest: unknown = dest;
      if (typeof dest === 'string') {
        explicitDest = await doc.getDestination(dest);
      }
      if (!Array.isArray(explicitDest) || explicitDest.length === 0) return;
      const ref = explicitDest[0];
      if (ref && typeof ref === 'object' && 'num' in ref) {
        const pageIndex = await doc.getPageIndex(ref as { num: number; gen: number });
        setPage(clamp(pageIndex + 1, 1, Math.max(1, numPages)));
      }
    } catch {
      // ignore invalid destinations
    }
  }, [numPages]);

  useEffect(() => {
    if (scrollMode !== 'continuous' || !continuousScrollRef.current || numPages === 0) return;
    const root = continuousScrollRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let mostVisible = 0;
        for (const entry of entries) {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const p = Number((entry.target as HTMLElement).dataset.page);
            if (p > 0) mostVisible = p;
          }
        }
        if (mostVisible > 0) setPage(mostVisible);
      },
      { root, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );
      const snap = new Map(pageRefs.current);
    for (const [, el] of snap) observer.observe(el);
    return () => observer.disconnect();
  }, [scrollMode, numPages]);

  useEffect(() => {
    if (scrollMode !== 'continuous') return;
    const el = pageRefs.current.get(page);
    if (el) el.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [page, scrollMode]);

  useEffect(() => {
    setPage(initialPage ?? 1);
    setNumPages(0);
    setSearchApplied('');
    setHits([]);
    setHitIndex(-1);
    setCitationFlash(null);
    textCacheRef.current.clear();
    pdfRef.current = null;
    void loadMarkups();
  }, [url, fileId, initialPage, loadMarkups]);

  useEffect(() => { onVisiblePageChange?.(page); }, [page, onVisiblePageChange]);
  useEffect(() => { latestMarkupsRef.current = markups; }, [markups]);

  useEffect(() => {
    if (!citationRequest || citationRequest.fileId !== fileId) return;
    const nextPage = clamp(toPositiveInt(citationRequest.pageNumber), 1, Math.max(1, numPages || toPositiveInt(citationRequest.pageNumber)));
    setPage(nextPage);
    setCitationFlash({
      ...citationRequest,
      pageNumber: nextPage,
      boundingBox: clampBoundingBox(citationRequest.boundingBox),
    });
    const timer = window.setTimeout(() => setCitationFlash(null), 5000);
    onCitationHandled?.();
    return () => window.clearTimeout(timer);
  }, [citationRequest, fileId, numPages, onCitationHandled]);

  const saveMarkup = useCallback(async (markupId: string, patch: Partial<Markup>) => {
    if (!projectId || !fileId) return;
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/markups/${encodeURIComponent(markupId)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { markup?: Markup };
    if (!payload.markup) return;
    setMarkups((curr) => curr.map((m) => m.id === markupId ? payload.markup! : m));
  }, [projectId, fileId]);

  const createMarkup = useCallback(async (input: { pageNumber: number; type: MarkupType; coordinates: Record<string, unknown>; measurement?: Markup['measurement'] }) => {
    const appendLocalMarkup = () => {
      const now = new Date().toISOString();
      const localMarkup: Markup = {
        id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        projectId: projectId ?? 'local-project',
        fileId: fileId ?? 'local-file',
        pageNumber: input.pageNumber,
        type: input.type,
        coordinates: input.coordinates,
        measurement: input.measurement,
        category: 'General Comment',
        status: 'Open',
        createdBy: 'You',
        createdAt: now,
        updatedAt: now,
      };
      setMarkups((curr) => [...curr, localMarkup]);
      setSelectedMarkupId(localMarkup.id);
    };

    if (!projectId || !fileId) {
      appendLocalMarkup();
      return;
    }

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/markups`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, category: 'General Comment', status: 'Open' }),
      });

      if (!response.ok) {
        appendLocalMarkup();
        return;
      }

      const payload = (await response.json()) as { markup?: Markup };
      if (!payload.markup) {
        appendLocalMarkup();
        return;
      }

      setMarkups((curr) => [...curr, payload.markup!]);
      setSelectedMarkupId(payload.markup.id);
    } catch {
      appendLocalMarkup();
    }
  }, [projectId, fileId]);

  const removeMarkup = useCallback(async (markupId: string) => {
    if (!projectId || !fileId) return;
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/markups/${encodeURIComponent(markupId)}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) return;
    setMarkups((curr) => curr.filter((m) => m.id !== markupId));
    if (selectedMarkupId === markupId) setSelectedMarkupId(null);
  }, [projectId, fileId, selectedMarkupId]);

  const runSearch = useCallback(async (forcedTerm?: string) => {
    const term = (forcedTerm ?? searchTerm).trim();
    if (!term) { setSearchApplied(''); setHits([]); setHitIndex(-1); setSearchMsg(null); return; }
    const doc = pdfRef.current;
    if (!doc) return;

    setSearchBusy(true);
    setSearchApplied(term);
    setSearchMsg(null);

    try {
      const lowTerm = term.toLowerCase();
      const nextHits: SearchHit[] = [];
      let hasText = false;

      for (let p = 1; p <= doc.numPages; p += 1) {
        let text = textCacheRef.current.get(p);
        if (text == null) {
          const pageObj = await doc.getPage(p);
          const textContent = await pageObj.getTextContent();
          text = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ').replace(/\s+/g, ' ').trim();
          textCacheRef.current.set(p, text);
        }

        if (text.length > 0) hasText = true;

        const lowText = text.toLowerCase();
        let idx = lowText.indexOf(lowTerm);
        while (idx !== -1) {
          const start = Math.max(0, idx - 55);
          const end = Math.min(text.length, idx + term.length + 75);
          const snippet = `${start > 0 ? '...' : ''}${text.slice(start, end).trim()}${end < text.length ? '...' : ''}`;
          nextHits.push({ id: `${p}-${idx}`, pageNumber: p, snippet });
          if (nextHits.length >= 400) break;
          idx = lowText.indexOf(lowTerm, idx + lowTerm.length);
        }
        if (nextHits.length >= 400) break;
      }

      if (!hasText) setSearchMsg('No searchable text found. This PDF may be scanned and OCR may be required later.');
      else if (nextHits.length === 0) setSearchMsg(`No matches found for "${term}".`);

      setHits(nextHits);
      if (nextHits.length > 0) { setHitIndex(0); setPage(nextHits[0].pageNumber); }
      else setHitIndex(-1);
    } finally {
      setSearchBusy(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!citationRequest || citationRequest.fileId !== fileId) return;
    const snippet = citationRequest.textSnippet?.trim();
    if (!snippet) return;
    void runSearch(snippet);
  }, [citationRequest, fileId, runSearch]);

  const moveHit = (dir: 1 | -1) => {
    if (hits.length === 0) return;
    const next = dir === 1 ? (hitIndex + 1) % hits.length : (hitIndex - 1 + hits.length) % hits.length;
    setHitIndex(next);
    setPage(hits[next].pageNumber);
  };

  const pagePointFromEvent = (event: ReactMouseEvent<HTMLDivElement>): Point | null => {
    const host = pageHostRef.current;
    if (!host) return null;
    const rect = host.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) };
  };

  const onPointerDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const p = pagePointFromEvent(event);
    if (!p) return;

    if (tool === 'count') {
      void createMarkup({ pageNumber: page, type: 'count', coordinates: { x: p.x, y: p.y }, measurement: { kind: 'count', value: 1, unit: 'count' } });
      return;
    }

    if (tool === 'area') {
      setDraftAreaPoints((curr) => [...curr, p]);
      return;
    }

    if (tool === 'select' || tool === 'pan') return;

    setDraftStart(p);
    setDraftCurrent(p);
    draftStartRef.current = p;
    draftCurrentRef.current = p;
  };

  const onPointerMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const drag = markupDragRef.current;
    if (drag) {
      const p = pagePointFromEvent(event);
      if (!p) return;
      const dx = p.x - drag.startPoint.x;
      const dy = p.y - drag.startPoint.y;
      setMarkups((curr) =>
        curr.map((m) => {
          if (m.id !== drag.markupId) return m;
          const c = drag.startCoords;
          if (drag.handle === 'move') {
            if ('width' in c && 'height' in c) {
              return { ...m, coordinates: { ...c, x: clamp(toNum(c.x) + dx, 0, 1 - toNum(c.width)), y: clamp(toNum(c.y) + dy, 0, 1 - toNum(c.height)) } };
            }
            if ('x1' in c) {
              return { ...m, coordinates: { x1: clamp(toNum(c.x1) + dx, 0, 1), y1: clamp(toNum(c.y1) + dy, 0, 1), x2: clamp(toNum(c.x2) + dx, 0, 1), y2: clamp(toNum(c.y2) + dy, 0, 1) } };
            }
            return { ...m, coordinates: { ...c, x: clamp(toNum(c.x) + dx, 0, 1), y: clamp(toNum(c.y) + dy, 0, 1) } };
          }
          if (drag.handle === 'nw') {
            const nx = clamp(toNum(c.x) + dx, 0, toNum(c.x) + toNum(c.width) - 0.005);
            const ny = clamp(toNum(c.y) + dy, 0, toNum(c.y) + toNum(c.height) - 0.005);
            return { ...m, coordinates: { ...c, x: nx, y: ny, width: toNum(c.x) + toNum(c.width) - nx, height: toNum(c.y) + toNum(c.height) - ny } };
          }
          if (drag.handle === 'ne') {
            const ny = clamp(toNum(c.y) + dy, 0, toNum(c.y) + toNum(c.height) - 0.005);
            return { ...m, coordinates: { ...c, y: ny, width: clamp(toNum(c.width) + dx, 0.005, 1 - toNum(c.x)), height: toNum(c.y) + toNum(c.height) - ny } };
          }
          if (drag.handle === 'sw') {
            const nx = clamp(toNum(c.x) + dx, 0, toNum(c.x) + toNum(c.width) - 0.005);
            return { ...m, coordinates: { ...c, x: nx, width: toNum(c.x) + toNum(c.width) - nx, height: clamp(toNum(c.height) + dy, 0.005, 1 - toNum(c.y)) } };
          }
          if (drag.handle === 'se') {
            return { ...m, coordinates: { ...c, width: clamp(toNum(c.width) + dx, 0.005, 1 - toNum(c.x)), height: clamp(toNum(c.height) + dy, 0.005, 1 - toNum(c.y)) } };
          }
          if (drag.handle === 'p1') {
            return { ...m, coordinates: { ...c, x1: clamp(toNum(c.x1) + dx, 0, 1), y1: clamp(toNum(c.y1) + dy, 0, 1) } };
          }
          if (drag.handle === 'p2') {
            return { ...m, coordinates: { ...c, x2: clamp(toNum(c.x2) + dx, 0, 1), y2: clamp(toNum(c.y2) + dy, 0, 1) } };
          }
          return m;
        }),
      );
      return;
    }
    if (!draftStartRef.current) return;
    const p = pagePointFromEvent(event);
    if (!p) return;
    draftCurrentRef.current = p;
    setDraftCurrent(p);
  };

  const onViewerMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (tool !== 'pan' || !viewerRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewerRef.current.scrollLeft,
      scrollTop: viewerRef.current.scrollTop,
    };
  };

  const onViewerMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (tool !== 'pan' || !viewerRef.current || !panStartRef.current) return;
    const dx = event.clientX - panStartRef.current.x;
    const dy = event.clientY - panStartRef.current.y;
    viewerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    viewerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const onViewerMouseUp = () => {
    if (tool !== 'pan') return;
    panStartRef.current = null;
    setIsPanning(false);
  };

  const finishDraw = async () => {
    const drag = markupDragRef.current;
    if (drag) {
      markupDragRef.current = null;
      const updated = latestMarkupsRef.current.find((m) => m.id === drag.markupId);
      if (updated) await saveMarkup(updated.id, { coordinates: updated.coordinates });
      return;
    }
    if (!(draftStartRef.current ?? draftStart) || !(draftCurrentRef.current ?? draftCurrent)) return;
    const startPos = draftStartRef.current ?? draftStart!;
    const endPos = draftCurrentRef.current ?? draftCurrent!;
    if (tool === 'rectangle' || tool === 'highlight' || tool === 'cloud' || tool === 'text') {
      const rect = rectFrom(startPos, endPos);
      if (rect.width > 0.002 && rect.height > 0.002) {
        await createMarkup({ pageNumber: page, type: tool, coordinates: rect });
      }
    }

    if (tool === 'arrow' || tool === 'line' || tool === 'length' || tool === 'calibrate') {
      const coords = { x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
      const len = pointDistance(startPos, endPos);
      await createMarkup({
        pageNumber: page,
        type: tool,
        coordinates: coords,
        measurement: tool === 'length' ? { kind: 'length', value: Number((len * 100).toFixed(2)), unit } : tool === 'calibrate' ? { kind: 'calibration', value: 10, unit, calibration: { pixels: len, realValue: 10, unit } } : undefined,
      });
    }

    setDraftStart(null);
    setDraftCurrent(null);
    draftStartRef.current = null;
    draftCurrentRef.current = null;
  };

  const finishArea = async () => {
    if (draftAreaPoints.length < 3) return;
    const area = polygonArea(draftAreaPoints);
    await createMarkup({ pageNumber: page, type: 'area', coordinates: { points: draftAreaPoints }, measurement: { kind: 'area', value: Number((area * 10000).toFixed(2)), unit } });
    setDraftAreaPoints([]);
  };

  const renderMarkup = (markup: Markup, forPage = page) => {
    if (markup.pageNumber !== forPage) return null;
    const selected = selectedMarkupId === markup.id;

    if (markup.type === 'rectangle' || markup.type === 'highlight' || markup.type === 'cloud' || markup.type === 'text') {
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      const w = Math.max(0.002, toNum(markup.coordinates.width, 0.1));
      const h = Math.max(0.002, toNum(markup.coordinates.height, 0.06));
      return (
        <div key={markup.id} style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, border: markup.type === 'cloud' ? `2px dashed ${selected ? '#dc2626' : '#fb923c'}` : `2px solid ${selected ? '#2563eb' : '#06b6d4'}`, borderRadius: markup.type === 'cloud' ? 16 : 4, background: markup.type === 'highlight' ? 'rgba(250,204,21,.35)' : 'transparent', pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}>
          {markup.type === 'text' ? <div style={{ fontSize: 11, color: '#111827', background: 'rgba(255,255,255,.8)', padding: '2px 4px' }}>{markup.comment || 'Text'}</div> : null}
        </div>
      );
    }

    if (markup.type === 'arrow' || markup.type === 'line' || markup.type === 'length' || markup.type === 'calibrate') {
      const x1 = toNum(markup.coordinates.x1);
      const y1 = toNum(markup.coordinates.y1);
      const x2 = toNum(markup.coordinates.x2);
      const y2 = toNum(markup.coordinates.y2);
      const isArrow = markup.type === 'arrow';
      const strokeColor = markup.type === 'calibrate' ? '#8b5cf6' : markup.type === 'length' ? '#10b981' : markup.type === 'line' ? '#0ea5e9' : '#ef4444';
      const markerId = `arrow-${markup.id}`;
      return (
        <svg key={markup.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', overflow: 'visible' }} onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}>
          {isArrow ? (
            <defs>
              <marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
              </marker>
            </defs>
          ) : null}
          <line x1={`${x1 * 100}%`} y1={`${y1 * 100}%`} x2={`${x2 * 100}%`} y2={`${y2 * 100}%`} stroke={strokeColor} strokeWidth={selected ? 4 : 3} strokeDasharray={markup.type === 'calibrate' ? '5 4' : undefined} markerEnd={isArrow ? `url(#${markerId})` : undefined} />
          {markup.measurement?.value != null ? <text x={`${((x1 + x2) / 2) * 100}%`} y={`${((y1 + y2) / 2) * 100}%`} fontSize="11" fill="#111827" textAnchor="middle">{markup.measurement.value} {markup.measurement.unit ?? ''}</text> : null}
        </svg>
      );
    }

    if (markup.type === 'area') {
      const points = (Array.isArray(markup.coordinates.points) ? markup.coordinates.points : []) as Point[];
      if (points.length < 3) return null;
      return <svg key={markup.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}><polygon points={points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')} fill="rgba(16,185,129,.25)" stroke={selected ? '#059669' : '#34d399'} strokeWidth={selected ? 3 : 2} /></svg>;
    }

    if (markup.type === 'count') {
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      return <div key={markup.id} style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: 16, height: 16, borderRadius: '50%', transform: 'translate(-50%,-50%)', background: selected ? '#dc2626' : '#ef4444', pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }} />;
    }

    return null;
  };

  const renderHandles = (markup: Markup) => {
    if (selectedMarkupId !== markup.id) return null;
    const HANDLE = 8;
    const HS = HANDLE / 2;
    const startDrag = (handle: string) => (e: ReactMouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const p = pagePointFromEvent(e);
      if (!p) return;
      markupDragRef.current = { markupId: markup.id, handle, startPoint: p, startCoords: { ...markup.coordinates } };
    };

    if (markup.type === 'rectangle' || markup.type === 'highlight' || markup.type === 'cloud' || markup.type === 'text') {
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      const w = Math.max(0.002, toNum(markup.coordinates.width, 0.1));
      const h = Math.max(0.002, toNum(markup.coordinates.height, 0.06));
      const corners: Array<[string, number, number]> = [['nw', x, y], ['ne', x + w, y], ['sw', x, y + h], ['se', x + w, y + h]];
      return (
        <>
          <div
            data-handle="move"
            style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, cursor: 'move', pointerEvents: 'auto', zIndex: 10 }}
            onMouseDown={startDrag('move')}
          />
          {corners.map(([corner, cx, cy]) => (
            <div
              key={corner}
              data-handle={corner}
              style={{ position: 'absolute', left: `calc(${cx * 100}% - ${HS}px)`, top: `calc(${cy * 100}% - ${HS}px)`, width: HANDLE, height: HANDLE, background: '#2563eb', border: '2px solid #fff', borderRadius: 2, cursor: `${corner}-resize`, pointerEvents: 'auto', zIndex: 11 }}
              onMouseDown={startDrag(corner)}
            />
          ))}
        </>
      );
    }

    if (markup.type === 'arrow' || markup.type === 'line' || markup.type === 'length' || markup.type === 'calibrate') {
      const x1 = toNum(markup.coordinates.x1);
      const y1 = toNum(markup.coordinates.y1);
      const x2 = toNum(markup.coordinates.x2);
      const y2 = toNum(markup.coordinates.y2);
      return (
        <>
          <div data-handle="p1" style={{ position: 'absolute', left: `calc(${x1 * 100}% - 6px)`, top: `calc(${y1 * 100}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: '#2563eb', border: '2px solid #fff', cursor: 'crosshair', pointerEvents: 'auto', zIndex: 11 }} onMouseDown={startDrag('p1')} />
          <div data-handle="p2" style={{ position: 'absolute', left: `calc(${x2 * 100}% - 6px)`, top: `calc(${y2 * 100}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: '#2563eb', border: '2px solid #fff', cursor: 'crosshair', pointerEvents: 'auto', zIndex: 11 }} onMouseDown={startDrag('p2')} />
        </>
      );
    }

    if (markup.type === 'count') {
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      return <div data-handle="move" style={{ position: 'absolute', left: `calc(${x * 100}% - 10px)`, top: `calc(${y * 100}% - 10px)`, width: 20, height: 20, borderRadius: '50%', cursor: 'move', pointerEvents: 'auto', zIndex: 10, background: 'transparent', border: '2px solid #2563eb' }} onMouseDown={startDrag('move')} />;
    }

    return null;
  };

  const exportComments = async (format: 'csv' | 'xlsx') => {
    if (!projectId || !fileId) return;
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/markups/export?format=${format}`, { method: 'GET' });
    if (!response.ok) return;
    const blob = await response.blob();
    const fallback = `${fileName.replace(/\.pdf$/i, '')}-markups.${format}`;
    const disposition = response.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    triggerDownloadFromResponse(blob, match?.[1] ?? fallback);
  };

  const downloadOriginalPdf = () => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const currentHit = hitIndex >= 0 ? hits[hitIndex] : null;
  const compactControlBase = {
    border: '1px solid #d1d5db',
    borderRadius: 4,
    padding: '2px 4px',
    fontSize: 11,
    lineHeight: 1.2,
    background: '#fff',
    color: '#0f172a',
  } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ flex: '0 0 auto', zIndex: 30, borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', flexWrap: 'nowrap', overflowX: 'auto' }}>
          <strong style={{ fontSize: 11, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fileName}>{fileName}</strong>
          <button type="button" onClick={() => setPage((c) => Math.max(1, c - 1))} style={compactControlBase}>Prev</button>
          <input type="number" min={1} max={Math.max(1, numPages)} value={page} onChange={(e) => setPage(clamp(toPositiveInt(e.target.value, page), 1, Math.max(1, numPages || 1)))} style={{ ...compactControlBase, width: 46 }} />
          <span style={{ fontSize: 10, color: '#6b7280' }}>of {numPages || '--'}</span>
          <button type="button" onClick={() => setPage((c) => Math.min(Math.max(1, numPages), c + 1))} style={compactControlBase}>Next</button>
          <button type="button" onClick={() => { setFitMode('manual'); setZoom((z) => Math.max(40, z - 10)); }} style={compactControlBase}>-</button>
          <span style={{ minWidth: 36, textAlign: 'center', fontSize: 10 }}>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => { setFitMode('manual'); setZoom((z) => Math.min(300, z + 10)); }} style={compactControlBase}>+</button>
          <button type="button" onClick={() => setFitMode('width')} style={{ ...compactControlBase, background: fitMode === 'width' ? '#e0f2fe' : '#fff' }}>Fit Width</button>
          <button type="button" onClick={() => setFitMode('page')} style={{ ...compactControlBase, background: fitMode === 'page' ? '#e0f2fe' : '#fff' }}>Fit Page</button>
          <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)} style={compactControlBase}>Rotate</button>
          <button type="button" onClick={() => setTool((t) => t === 'pan' ? 'select' : 'pan')} style={{ ...compactControlBase, background: tool === 'pan' ? '#dbeafe' : '#fff' }}>Hand</button>
          <button type="button" onClick={() => setScrollMode((m) => (m === 'single' ? 'continuous' : 'single'))} style={{ ...compactControlBase, background: scrollMode === 'continuous' ? '#e0f2fe' : '#fff' }}>Continuous</button>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={downloadOriginalPdf} style={compactControlBase}>Download PDF</button>
          <button type="button" onClick={() => void exportComments('csv')} style={compactControlBase}>Export CSV</button>
          <button type="button" onClick={() => void exportComments('xlsx')} style={compactControlBase}>Export Excel</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', background: '#fff', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {(['select', 'cloud', 'arrow', 'text', 'highlight', 'line', 'rectangle', 'calibrate', 'length', 'area', 'count'] as Tool[]).map((t) => (
            <button key={t} type="button" onClick={() => setTool(t)} style={{ ...compactControlBase, background: tool === t ? '#dbeafe' : '#fff', textTransform: 'capitalize' }}>{t}</button>
          ))}
          <select value={unit} onChange={(e) => setUnit(e.target.value as (typeof UNITS)[number])} style={compactControlBase}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
          {tool === 'area' && draftAreaPoints.length >= 3 ? <button type="button" onClick={() => void finishArea()} style={{ ...compactControlBase, border: '1px solid #10b981', background: '#dcfce7' }}>Finish Area</button> : null}
          {selectedMarkup ? <button type="button" onClick={() => void removeMarkup(selectedMarkup.id)} style={{ ...compactControlBase, border: '1px solid #fecaca', background: '#fff1f2', color: '#b91c1c' }}>Delete Selected</button> : null}
          <div style={{ flex: 1 }} />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void runSearch(); } }} placeholder="Search this PDF" style={{ ...compactControlBase, width: 170 }} />
          <button type="button" onClick={() => void runSearch()} style={compactControlBase}>{searchBusy ? '...' : 'Find'}</button>
          <button type="button" onClick={() => moveHit(-1)} style={compactControlBase}>Prev Hit</button>
          <button type="button" onClick={() => moveHit(1)} style={compactControlBase}>Next Hit</button>
          <span style={{ fontSize: 10, color: '#6b7280' }}>{hits.length > 0 ? `${hitIndex + 1}/${hits.length}` : '0'}</span>
        </div>
      </div>

      {searchMsg ? <div style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#fffbeb', color: '#92400e', fontSize: 12 }}>{searchMsg}</div> : null}
      {currentHit ? <div style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', color: '#334155', fontSize: 12 }}>p.{currentHit.pageNumber}: {currentHit.snippet}</div> : null}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: sidebarCollapsed ? 40 : 250, borderRight: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {!sidebarCollapsed ? (
              <>
                <button type="button" onClick={() => setTab('thumbnails')} style={{ flex: 1, border: 'none', background: tab === 'thumbnails' ? '#eff6ff' : '#fff', padding: 8, fontSize: 12 }}>Thumbnails</button>
                <button type="button" onClick={() => setTab('bookmarks')} style={{ flex: 1, border: 'none', background: tab === 'bookmarks' ? '#eff6ff' : '#fff', padding: 8, fontSize: 12 }}>Bookmarks</button>
                <button type="button" onClick={() => setTab('markups')} style={{ flex: 1, border: 'none', background: tab === 'markups' ? '#eff6ff' : '#fff', padding: 8, fontSize: 12 }}>Markups</button>
              </>
            ) : null}
            <button type="button" onClick={() => setSidebarCollapsed((c) => !c)} style={{ width: 40, border: 'none', background: '#fff' }}>{sidebarCollapsed ? '>' : '<'}</button>
          </div>

          {!sidebarCollapsed ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
              {tab === 'thumbnails' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                    <button key={`thumb-${p}`} type="button" onClick={() => setPage(p)} style={{ border: p === page ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 6, background: '#fff', padding: 6, textAlign: 'left' }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Page {p}</div>
                      <div style={{ border: '1px solid #f1f5f9' }}>
                        {pdfRef.current ? (
                          <Page
                            pdf={pdfRef.current}
                            pageNumber={p}
                            width={160}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            loading={<div style={{ height: 210, background: '#f8fafc' }} />}
                          />
                        ) : (
                          <div style={{ height: 210, background: '#f8fafc' }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {tab === 'bookmarks' ? (
                outline ? (
                  <div style={{ fontSize: 12 }}>
                    {outline.map((item, idx) => (
                      <BookmarkItem key={`${item.title}-${idx}`} item={item} depth={0} onJump={(dest) => void jumpToOutlineItem(dest)} />
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>No bookmarks found in this PDF.</div>
                )
              ) : null}

              {tab === 'markups' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {markups.map((m) => (
                    <button key={`m-${m.id}`} type="button" onClick={() => { setSelectedMarkupId(m.id); setPage(m.pageNumber); }} style={{ border: m.id === selectedMarkupId ? '1px solid #93c5fd' : '1px solid #e5e7eb', background: m.id === selectedMarkupId ? '#eff6ff' : '#fff', borderRadius: 6, padding: 6, textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{m.type} · p.{m.pageNumber}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{m.comment || 'No comment'}</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Document
            key={url}
            file={url}
            loading={null}
            onLoadSuccess={async (doc) => {
              pdfRef.current = doc;
              setNumPages(doc.numPages);
              setPage((curr) => clamp(curr, 1, doc.numPages));
              try {
                const outlineData = await doc.getOutline();
                setOutline(outlineData && outlineData.length > 0 ? (outlineData as OutlineItem[]) : null);
              } catch {
                setOutline(null);
              }
            }}
          >
            {scrollMode === 'single' ? (
              <div ref={viewerRef} style={{ position: 'absolute', inset: 0, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 12, background: '#f3f4f6', cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : tool === 'select' ? 'default' : 'crosshair' }} onMouseDown={onViewerMouseDown} onMouseMove={onViewerMouseMove} onMouseUp={onViewerMouseUp} onMouseLeave={onViewerMouseUp}>
                <div ref={pageHostRef} style={{ position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={() => { void finishDraw(); }} onMouseLeave={() => { void finishDraw(); }} onDoubleClick={() => { if (tool === 'area' && draftAreaPoints.length >= 3) { void finishArea(); } }} onClick={() => { if (tool === 'select') setSelectedMarkupId(null); }}>
                  <Page
                    pageNumber={page}
                    scale={scale}
                    rotate={rotation}
                    renderAnnotationLayer={false}
                    renderTextLayer={Boolean(searchApplied)}
                    customTextRenderer={({ str }) => {
                      if (!searchApplied) return str;
                      const escaped = searchApplied.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      const regex = new RegExp(`(${escaped})`, 'ig');
                      return str.replace(regex, '<mark style="background:#fde68a;padding:0 1px;border-radius:2px;">$1</mark>');
                    }}
                    loading={<div style={{ width: Math.round(612 * scale), height: Math.round(792 * scale), background: '#e5e7eb' }} />}
                  />

                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {markups.map((m) => renderMarkup(m))}
                    {selectedMarkup && selectedMarkup.pageNumber === page ? renderHandles(selectedMarkup) : null}

                    {draftStart && draftCurrent && (tool === 'rectangle' || tool === 'highlight' || tool === 'cloud' || tool === 'text') ? (() => {
                      const r = rectFrom(draftStart, draftCurrent);
                      return <div style={{ position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%`, border: '2px dashed #2563eb', background: tool === 'highlight' ? 'rgba(250,204,21,.35)' : 'transparent' }} />;
                    })() : null}

                    {draftStart && draftCurrent && (tool === 'arrow' || tool === 'line' || tool === 'length' || tool === 'calibrate') ? (
                      <svg style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                        {tool === 'arrow' ? (
                          <defs>
                            <marker id="draft-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                            </marker>
                          </defs>
                        ) : null}
                        <line x1={`${draftStart.x * 100}%`} y1={`${draftStart.y * 100}%`} x2={`${draftCurrent.x * 100}%`} y2={`${draftCurrent.y * 100}%`} stroke={tool === 'calibrate' ? '#8b5cf6' : tool === 'line' ? '#0ea5e9' : '#ef4444'} strokeWidth={3} strokeDasharray={tool === 'calibrate' ? '5 4' : undefined} markerEnd={tool === 'arrow' ? 'url(#draft-arrow)' : undefined} />
                      </svg>
                    ) : null}

                    {tool === 'area' && draftAreaPoints.length > 0 ? (
                      <svg style={{ position: 'absolute', inset: 0 }}>
                        <polyline points={draftAreaPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')} fill="rgba(16,185,129,.2)" stroke="#10b981" strokeWidth={2} />
                      </svg>
                    ) : null}

                    {citationFlash?.pageNumber === page && citationFlash.boundingBox ? (
                      <div style={{ position: 'absolute', left: `${citationFlash.boundingBox.x * 100}%`, top: `${citationFlash.boundingBox.y * 100}%`, width: `${citationFlash.boundingBox.width * 100}%`, height: `${citationFlash.boundingBox.height * 100}%`, border: '2px solid #f97316', background: 'rgba(249,115,22,.2)', boxShadow: '0 0 0 1px rgba(255,255,255,.8) inset' }} />
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div ref={continuousScrollRef} style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: '12px 0', background: '#f3f4f6', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                  <div
                    key={`cont-${p}`}
                    data-page={p}
                    ref={(el) => { if (el) pageRefs.current.set(p, el as HTMLDivElement); else pageRefs.current.delete(p); }}
                    style={{ position: 'relative', boxShadow: p === page ? '0 0 0 2px #2563eb, 0 1px 4px rgba(0,0,0,.15)' : '0 1px 4px rgba(0,0,0,.15)' }}
                  >
                    <Page
                      pageNumber={p}
                      scale={scale}
                      rotate={rotation}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      loading={<div style={{ width: Math.round(612 * scale), height: Math.round(792 * scale), background: '#e5e7eb' }} />}
                    />
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                      {markups.filter((m) => m.pageNumber === p).map((m) => renderMarkup(m, p))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Document>
        </div>
      </div>

      <div style={{ flex: '0 0 auto', height: markupPanelCollapsed ? 24 : markupPanelHeight, display: 'flex', flexDirection: 'column', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        {/* Drag-resize handle + collapse toggle */}
        <div style={{ flex: '0 0 24px', background: '#f1f5f9', display: 'flex', alignItems: 'center', userSelect: 'none', borderBottom: markupPanelCollapsed ? 'none' : '1px solid #e2e8f0' }}>
          <div
            style={{ flex: 1, height: 24, cursor: markupPanelCollapsed ? 'default' : 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseDown={markupPanelCollapsed ? undefined : (e) => {
              markupResizeDragRef.current = { startY: e.clientY, startH: markupPanelHeight };
              const onMove = (ev: MouseEvent) => {
                if (!markupResizeDragRef.current) return;
                const dy = markupResizeDragRef.current.startY - ev.clientY;
                setMarkupPanelHeight(Math.max(80, Math.min(600, markupResizeDragRef.current.startH + dy)));
              };
              const onUp = () => {
                markupResizeDragRef.current = null;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
          >
            {markupPanelCollapsed
              ? <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Markup Table</span>
              : <div style={{ width: 32, height: 3, background: '#9ca3af', borderRadius: 2 }} />}
          </div>
          <button
            type="button"
            onClick={() => setMarkupPanelCollapsed((c) => !c)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#6b7280', padding: '0 8px', height: 24, display: 'flex', alignItems: 'center' }}
            title={markupPanelCollapsed ? 'Expand markup panel' : 'Collapse markup panel'}
          >
            {markupPanelCollapsed ? '▲' : '▼'}
          </button>
        </div>
        {!markupPanelCollapsed ? <>
        {/* Filters */}
        <div style={{ flex: '0 0 auto', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8 }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '5px 6px', fontSize: 12 }}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '5px 6px', fontSize: 12 }}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <input value={filterPage} onChange={(e) => setFilterPage(e.target.value)} placeholder="Page" style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '5px 6px', fontSize: 12 }} />
        <input value={filterAssigned} onChange={(e) => setFilterAssigned(e.target.value)} placeholder="Assigned to" style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '5px 6px', fontSize: 12 }} />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'page' | 'date' | 'status' | 'category')} style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '5px 6px', fontSize: 12 }}>
          <option value="page">Sort by page</option><option value="date">Sort by date</option><option value="status">Sort by status</option><option value="category">Sort by category</option>
        </select>
        <button type="button" onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterPage(''); setFilterAssigned(''); setSortBy('page'); }} style={{ border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', fontSize: 12 }}>Reset</button>
        </div>
        {/* Scrollable markup table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
            <tr>{['page', 'type', 'category', 'comment', 'status', 'assigned to', 'created by', 'created date', 'last updated date', 'measurement'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontWeight: 600 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filteredMarkups.map((m) => (
              <tr key={`row-${m.id}`} style={{ background: m.id === selectedMarkupId ? '#eff6ff' : '#fff' }} onClick={() => { setSelectedMarkupId(m.id); setPage(m.pageNumber); }}>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{m.pageNumber}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{m.type}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}><select value={m.category} onChange={(e) => void saveMarkup(m.id, { category: e.target.value })} style={{ border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}><input value={m.comment ?? ''} onChange={(e) => setMarkups((curr) => curr.map((x) => x.id === m.id ? { ...x, comment: e.target.value } : x))} onBlur={(e) => void saveMarkup(m.id, { comment: e.target.value })} style={{ width: 170, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, padding: '2px 4px' }} /></td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}><select value={m.status} onChange={(e) => void saveMarkup(m.id, { status: e.target.value })} style={{ border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}><input value={m.assignedTo ?? ''} onChange={(e) => setMarkups((curr) => curr.map((x) => x.id === m.id ? { ...x, assignedTo: e.target.value } : x))} onBlur={(e) => void saveMarkup(m.id, { assignedTo: e.target.value })} style={{ width: 120, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, padding: '2px 4px' }} /></td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{m.createdBy}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{new Date(m.createdAt).toLocaleString()}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{new Date(m.updatedAt).toLocaleString()}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{m.measurement?.value != null ? `${m.measurement.value} ${m.measurement.unit ?? ''}` : ''}</td>
              </tr>
            ))}
            {filteredMarkups.length === 0 ? <tr><td colSpan={10} style={{ padding: '14px 8px', textAlign: 'center', color: '#6b7280' }}>No markups found for the current filters.</td></tr> : null}
          </tbody>
        </table>
        </div>
        </> : null}
      </div>
    </div>
  );
}
