'use client';

import { Bookmark, ChevronDown, ChevronRight, ChevronUp, LayoutGrid, PanelLeft, PanelLeftClose, Search, StickyNote } from 'lucide-react';
import { MouseEvent as ReactMouseEvent, ReactNode, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './workspace.css';
import PdfMarkupToolbar from './PdfMarkupToolbar';
import {
  DEFAULT_TEXT_BOX_SIZE,
  MARKUP_SVG_LAYER_STYLE,
  MARKUP_SVG_VIEWBOX,
  isEditableKeyboardTarget,
  normalizedLineEndpoints,
  normalizedPolylinePoints,
  percentRectStyle,
  resolveRectSize,
} from './pdf-markup-render';
import {
  areaDisplayUnit,
  calibratedAreaFromPoints,
  calibratedLengthFromLineCoords,
  formatMeasurementValue,
  LENGTH_UNITS,
  loadDocumentScale,
  pageDimensionsFromRotation,
  pageSpaceDistance,
  saveDocumentScale,
  scaleFromCalibrateMarkup,
  type DocumentScale,
  type LengthUnit,
} from './pdf-scale';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type SidebarTab = 'thumbnails' | 'bookmarks' | 'markups';
type FitMode = 'manual' | 'width' | 'page';
type Tool = 'select' | 'pan' | 'cloud' | 'arrow' | 'callout' | 'stamp' | 'text' | 'highlight' | 'line' | 'rectangle' | 'calibrate' | 'length' | 'area' | 'count';
type MarkupType = Exclude<Tool, 'select' | 'pan'>;

const CATEGORIES = ['RFI', 'Design Conflict', 'QC Issue', 'Field Verify', 'Change Order Potential', 'Submittal Comment', 'Safety Issue', 'General Comment'] as const;
const CONSTRUCTION_STAMPS = [
  'APPROVED',
  'REVISE & RESUBMIT',
  'REJECTED',
  'RFI',
  'FOR CONSTRUCTION',
  'VOID',
  'REVIEWED',
  'NOT APPROVED',
  'APPROVED AS NOTED',
  'RECORD COPY',
] as const;
type ConstructionStampLabel = (typeof CONSTRUCTION_STAMPS)[number];
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
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = Boolean(item.items && item.items.length > 0);
  return (
    <div>
      <div className="pdf-bookmark-row" style={{ paddingLeft: depth * 12 }}>
        {hasChildren ? (
          <button
            type="button"
            className="pdf-bookmark-chevron-btn"
            onClick={() => setIsExpanded((e) => !e)}
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? <ChevronDown size={12} aria-hidden /> : <ChevronRight size={12} aria-hidden />}
          </button>
        ) : (
          <span className="pdf-bookmark-chevron-spacer" aria-hidden />
        )}
        <button
          type="button"
          className="pdf-bookmark-link"
          onClick={() => onJump(item.dest ?? null)}
          style={{ fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? 'italic' : undefined }}
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
const ZOOM_MIN = 40;
const ZOOM_MAX = 300;
const WHEEL_ZOOM_SENSITIVITY = 0.01;

function touchSpan(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function touchCenter(touches: TouchList): { x: number; y: number } {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function wheelZoomPercent(currentZoom: number, deltaY: number): number {
  const factor = Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY);
  return clamp(Math.round(currentZoom * factor), ZOOM_MIN, ZOOM_MAX);
}
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
function isCalloutCoords(c: Record<string, unknown>): boolean {
  return typeof c.anchorX === 'number' || typeof c.anchorY === 'number';
}
const DEFAULT_STAMP_SIZE = { width: 0.22, height: 0.08 } as const;

function stampLabelFromMarkup(markup: Pick<Markup, 'coordinates' | 'comment'>): string {
  const fromCoords = markup.coordinates.stampLabel;
  if (typeof fromCoords === 'string' && fromCoords.trim()) return fromCoords;
  if (typeof markup.comment === 'string' && markup.comment.trim()) return markup.comment;
  return 'STAMP';
}

function stampVariantClass(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function NormalizedLineSvg({
  x1,
  y1,
  x2,
  y2,
  stroke,
  strokeWidth,
  markerId,
  showArrow,
  strokeDasharray,
  interactive,
  onSelect,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  markerId?: string;
  showArrow?: boolean;
  strokeDasharray?: string;
  interactive?: boolean;
  onSelect?: (event: ReactMouseEvent<SVGSVGElement>) => void;
}) {
  const pts = normalizedLineEndpoints(x1, y1, x2, y2);
  return (
    <svg
      viewBox={MARKUP_SVG_VIEWBOX}
      preserveAspectRatio="none"
      style={{ ...MARKUP_SVG_LAYER_STYLE, pointerEvents: interactive ? 'auto' : 'none' }}
      onClick={onSelect}
    >
      {showArrow && markerId ? (
        <defs>
          <marker id={markerId} markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={stroke} />
          </marker>
        </defs>
      ) : null}
      <line
        x1={pts.x1}
        y1={pts.y1}
        x2={pts.x2}
        y2={pts.y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
        strokeDasharray={strokeDasharray}
        markerEnd={showArrow && markerId ? `url(#${markerId})` : undefined}
      />
    </svg>
  );
}

function calloutLeaderStart(box: { x: number; y: number; width: number; height: number }, anchor: Point): Point {
  const cx = clamp(anchor.x, box.x, box.x + box.width);
  const cy = clamp(anchor.y, box.y, box.y + box.height);
  const inside = anchor.x >= box.x && anchor.x <= box.x + box.width && anchor.y >= box.y && anchor.y <= box.y + box.height;
  if (inside) {
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  return { x: cx, y: cy };
}

function pageDimensions(rotation: number): { width: number; height: number } {
  return pageDimensionsFromRotation(rotation);
}

function highlightSearchInText(str: string, term: string): string {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'ig');
  return str.replace(regex, '<mark class="pdf-search-highlight">$1</mark>');
}

/** Memoized react-pdf Page — keeps canvases mounted when only the active-page highlight changes. */
const StablePdfPage = memo(function StablePdfPage({
  pageNumber,
  scale,
  rotation,
  slotWidth,
  slotHeight,
  highlightSearchTerm,
  textSelectionEnabled = true,
}: {
  pageNumber: number;
  scale: number;
  rotation: number;
  slotWidth: number;
  slotHeight: number;
  highlightSearchTerm?: string;
  textSelectionEnabled?: boolean;
}) {
  return (
    <Page
      pageNumber={pageNumber}
      scale={scale}
      rotate={rotation}
      renderAnnotationLayer={false}
      renderTextLayer
      customTextRenderer={highlightSearchTerm ? ({ str }) => highlightSearchInText(str, highlightSearchTerm) : undefined}
      loading={<div style={{ width: slotWidth, height: slotHeight, background: '#e5e7eb' }} />}
      className={textSelectionEnabled ? 'pdf-page--text-selectable' : 'pdf-page--text-blocked'}
    />
  );
});

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
  const viewerRootRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const documentHostRef = useRef<HTMLDivElement | null>(null);
  const pageHostRef = useRef<HTMLDivElement | null>(null);
  const previousToolRef = useRef<Tool>('pan');
  const pdfRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const textCacheRef = useRef<Map<number, string>>(new Map());
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const continuousScrollRef = useRef<HTMLDivElement | null>(null);
  const navScrollPageRef = useRef<number | null>(null);
  const suppressIntersectionRef = useRef(false);
  const markupDragRef = useRef<{ markupId: string; handle: string; startPoint: Point; startCoords: Record<string, unknown> } | null>(null);
  const latestMarkupsRef = useRef<Markup[]>([]);
  const markupResizeDragRef = useRef<{ startY: number; startH: number } | null>(null);
  const draftStartRef = useRef<Point | null>(null);
  const draftCurrentRef = useRef<Point | null>(null);
  const markupPageRef = useRef<number>(1);
  const draftPageNumberRef = useRef<number | null>(null);
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const pendingZoomScrollRef = useRef<{ el: HTMLElement; scrollLeft: number; scrollTop: number } | null>(null);
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const scrollModeRef = useRef<'single' | 'continuous'>('continuous');
  const zoomRef = useRef(120);
  const fitModeRef = useRef<FitMode>('manual');
  const scaleRef = useRef(1.2);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage ?? 1);
  const [zoom, setZoom] = useState(120);
  const [fitMode, setFitMode] = useState<FitMode>('manual');
  const [rotation, setRotation] = useState(0);
  const [tab, setTab] = useState<SidebarTab>('thumbnails');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showMarkupTools, setShowMarkupTools] = useState(false);
  const [tool, setTool] = useState<Tool>('pan');
  const [selectedStampLabel, setSelectedStampLabel] = useState<ConstructionStampLabel>(CONSTRUCTION_STAMPS[0]);
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
  const [draftPageNumber, setDraftPageNumber] = useState<number | null>(null);
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
  const [markupPanelCollapsed, setMarkupPanelCollapsed] = useState(true);

  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [documentRetryKey, setDocumentRetryKey] = useState(0);

  const [documentScale, setDocumentScale] = useState<DocumentScale | null>(null);
  const [pendingCalibration, setPendingCalibration] = useState<{
    pageNumber: number;
    coords: { x1: number; y1: number; x2: number; y2: number };
    pageSpaceCalibrationDistance: number;
    normalizedDistance: number;
  } | null>(null);
  const [calibrationInputValue, setCalibrationInputValue] = useState('');
  const [calibrationInputUnit, setCalibrationInputUnit] = useState<LengthUnit>('ft');

  const scale = useMemo(() => {
    const host = viewerRef.current ?? continuousScrollRef.current;
    if (!host) return zoom / 100;
    if (fitMode === 'manual') return zoom / 100;
    const w = host.clientWidth - 40;
    const h = host.clientHeight - 40;
    const { width: baseW, height: baseH } = pageDimensions(rotation);
    if (fitMode === 'width') return Math.max(0.3, w / baseW);
    return Math.max(0.3, Math.min(w / baseW, h / baseH));
  }, [zoom, fitMode, rotation]);

  useEffect(() => {
    scrollModeRef.current = scrollMode;
    zoomRef.current = zoom;
    fitModeRef.current = fitMode;
    scaleRef.current = scale;
  }, [scrollMode, zoom, fitMode, scale]);

  const applyZoomAtFocalPoint = useCallback((clientX: number, clientY: number, newZoomPercent: number) => {
    const scrollEl = scrollModeRef.current === 'single' ? viewerRef.current : continuousScrollRef.current;
    if (!scrollEl) return;

    const rect = scrollEl.getBoundingClientRect();
    const focalX = clientX - rect.left;
    const focalY = clientY - rect.top;

    const currentZoom = fitModeRef.current === 'manual'
      ? zoomRef.current
      : Math.round(scaleRef.current * 100);
    const clampedZoom = clamp(Math.round(newZoomPercent), ZOOM_MIN, ZOOM_MAX);
    if (clampedZoom === currentZoom && fitModeRef.current === 'manual') return;

    const ratio = clampedZoom / currentZoom;
    pendingZoomScrollRef.current = {
      el: scrollEl,
      scrollLeft: (scrollEl.scrollLeft + focalX) * ratio - focalX,
      scrollTop: (scrollEl.scrollTop + focalY) * ratio - focalY,
    };

    setFitMode('manual');
    setZoom(clampedZoom);
  }, []);

  useLayoutEffect(() => {
    const pending = pendingZoomScrollRef.current;
    if (!pending) return;
    pendingZoomScrollRef.current = null;
    pending.el.scrollLeft = pending.scrollLeft;
    pending.el.scrollTop = pending.scrollTop;
  }, [zoom, fitMode]);

  useEffect(() => {
    const host = documentHostRef.current;
    if (!host) return;

    const resolveScrollEl = () => (
      scrollModeRef.current === 'single' ? viewerRef.current : continuousScrollRef.current
    );

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (isEditableKeyboardTarget(event.target)) return;
      const scrollEl = resolveScrollEl();
      if (!scrollEl) return;
      event.preventDefault();
      const currentZoom = fitModeRef.current === 'manual'
        ? zoomRef.current
        : Math.round(scaleRef.current * 100);
      applyZoomAtFocalPoint(event.clientX, event.clientY, wheelZoomPercent(currentZoom, event.deltaY));
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      if (isEditableKeyboardTarget(event.target)) return;
      const scrollEl = resolveScrollEl();
      if (!scrollEl) return;
      pinchStateRef.current = {
        distance: touchSpan(event.touches),
        zoom: fitModeRef.current === 'manual'
          ? zoomRef.current
          : Math.round(scaleRef.current * 100),
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || !pinchStateRef.current) return;
      const scrollEl = resolveScrollEl();
      if (!scrollEl) return;
      event.preventDefault();
      const distance = touchSpan(event.touches);
      const center = touchCenter(event.touches);
      const ratio = distance / pinchStateRef.current.distance;
      const newZoom = clamp(
        Math.round(pinchStateRef.current.zoom * ratio),
        ZOOM_MIN,
        ZOOM_MAX,
      );
      applyZoomAtFocalPoint(center.x, center.y, newZoom);
    };

    const clearPinch = (event: TouchEvent) => {
      if (event.touches.length < 2) pinchStateRef.current = null;
    };

    host.addEventListener('wheel', onWheel, { passive: false });
    host.addEventListener('touchstart', onTouchStart, { passive: true });
    host.addEventListener('touchmove', onTouchMove, { passive: false });
    host.addEventListener('touchend', clearPinch);
    host.addEventListener('touchcancel', clearPinch);

    return () => {
      host.removeEventListener('wheel', onWheel);
      host.removeEventListener('touchstart', onTouchStart);
      host.removeEventListener('touchmove', onTouchMove);
      host.removeEventListener('touchend', clearPinch);
      host.removeEventListener('touchcancel', clearPinch);
    };
  }, [applyZoomAtFocalPoint]);

  const pageSpaceDims = useMemo(() => pageDimensions(rotation), [rotation]);

  const buildLengthMeasurement = useCallback((
    coords: { x1: number; y1: number; x2: number; y2: number },
    scale: DocumentScale | null,
  ): Markup['measurement'] | undefined => {
    if (!scale) return { kind: 'length', unit };
    const value = formatMeasurementValue(
      calibratedLengthFromLineCoords(coords, scale, pageSpaceDims.width, pageSpaceDims.height),
    );
    return { kind: 'length', value, unit: scale.unit };
  }, [pageSpaceDims.height, pageSpaceDims.width, unit]);

  const buildAreaMeasurement = useCallback((
    points: Point[],
    scale: DocumentScale | null,
  ): Markup['measurement'] | undefined => {
    if (!scale) return { kind: 'area', unit: areaDisplayUnit(unit) };
    const value = formatMeasurementValue(
      calibratedAreaFromPoints(points, scale, pageSpaceDims.width, pageSpaceDims.height),
    );
    return { kind: 'area', value, unit: areaDisplayUnit(scale.unit) };
  }, [pageSpaceDims.height, pageSpaceDims.width, unit]);

  const applyDocumentScale = useCallback((scale: DocumentScale | null) => {
    setDocumentScale(scale);
    if (fileId && scale) saveDocumentScale(fileId, scale);
  }, [fileId]);

  const retryDocumentLoad = useCallback(() => {
    setLoadProgress(null);
    setNumPages(0);
    setOutline(null);
    pdfRef.current = null;
    textCacheRef.current.clear();
    setDocumentRetryKey((key) => key + 1);
  }, []);

  const documentLoading = (
    <div className="pdf-viewer-stage-state" role="status" aria-live="polite" aria-busy="true">
      <div className="pdf-viewer-stage-state__spinner" aria-hidden />
      <p className="pdf-viewer-stage-state__label">Loading PDF…</p>
      {loadProgress != null && loadProgress > 0 && loadProgress < 100 ? (
        <>
          <div
            className="pdf-viewer-stage-state__progress"
            role="progressbar"
            aria-valuenow={loadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="PDF load progress"
          >
            <div className="pdf-viewer-stage-state__progress-bar" style={{ width: `${loadProgress}%` }} />
          </div>
          <p className="pdf-viewer-stage-state__progress-label">{loadProgress}%</p>
        </>
      ) : null}
    </div>
  );

  const renderDocumentError = useCallback(({ error }: { error: Error }) => (
    <div className="pdf-viewer-stage-state pdf-viewer-stage-state--error" role="alert">
      <p className="pdf-viewer-stage-state__label">{error.message || 'Failed to load PDF.'}</p>
      <button type="button" className="pdf-viewer-stage-state__retry" onClick={retryDocumentLoad}>
        Retry
      </button>
    </div>
  ), [retryDocumentLoad]);

  const continuousPageSlotSize = useMemo(() => {
    const { width: baseW, height: baseH } = pageDimensions(rotation);
    return { width: Math.round(baseW * scale), height: Math.round(baseH * scale) };
  }, [scale, rotation]);

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

  const isDrawingTool = (t: Tool): t is MarkupType => t !== 'select' && t !== 'pan';

  /** Drawing tools attach pointer handlers to the page; pan/select leave the text layer selectable. */
  const isMarkupDrawingActive = showMarkupTools && isDrawingTool(tool);

  const markupOverlayInteractive = isMarkupDrawingActive;

  const handleToolChange = useCallback((nextTool: Tool) => {
    if (isDrawingTool(nextTool)) {
      setShowMarkupTools(true);
    }
    setTool(nextTool);
  }, []);

  const revealMarkupPanels = useCallback((opts?: { tools?: boolean; table?: boolean }) => {
    if (opts?.tools !== false) setShowMarkupTools(true);
    if (opts?.table !== false) setMarkupPanelCollapsed(false);
  }, []);

  const loadMarkups = useCallback(async () => {
    if (!projectId || !fileId) { setMarkups([]); return; }
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/markups`, { method: 'GET', cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json()) as { markups?: Markup[] };
      const loaded = payload.markups ?? [];
      setMarkups(loaded);

      const storedScale = loadDocumentScale(fileId);
      if (storedScale) {
        setDocumentScale(storedScale);
        return;
      }

      const calibrateMarkups = loaded
        .filter((m) => m.type === 'calibrate')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const latestCalibrate = calibrateMarkups[0];
      if (latestCalibrate) {
        const derived = scaleFromCalibrateMarkup(
          latestCalibrate.coordinates,
          latestCalibrate.measurement,
          pageSpaceDims.width,
          pageSpaceDims.height,
        );
        if (derived) {
          applyDocumentScale(derived);
        }
      }
    } catch {
      setMarkups([]);
    }
  }, [projectId, fileId, pageSpaceDims.height, pageSpaceDims.width, applyDocumentScale]);

  const goToPage = useCallback((nextPage: number) => {
    navScrollPageRef.current = nextPage;
    setPage(nextPage);
  }, []);

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
        goToPage(clamp(pageIndex + 1, 1, Math.max(1, numPages)));
      }
    } catch {
      // ignore invalid destinations
    }
  }, [goToPage, numPages]);

  useEffect(() => {
    if (scrollMode !== 'continuous' || numPages === 0) return;

    const root = continuousScrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressIntersectionRef.current) return;
        let maxRatio = 0;
        let mostVisible = 0;
        for (const entry of entries) {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const p = Number((entry.target as HTMLElement).dataset.page);
            if (p > 0) mostVisible = p;
          }
        }
        if (mostVisible > 0) {
          setPage((curr) => (curr === mostVisible ? curr : mostVisible));
        }
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    root.querySelectorAll<HTMLElement>('[data-page]').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [scrollMode, numPages]);

  useEffect(() => {
    if (scrollMode !== 'continuous') return;
    if (navScrollPageRef.current !== page) return;
    navScrollPageRef.current = null;
    const el = continuousScrollRef.current?.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if (el) {
      suppressIntersectionRef.current = true;
      el.scrollIntoView?.({ behavior: 'auto', block: 'nearest' });
      window.setTimeout(() => {
        suppressIntersectionRef.current = false;
      }, 150);
    }
  }, [page, scrollMode]);

  useEffect(() => {
    navScrollPageRef.current = initialPage ?? 1;
    setPage(initialPage ?? 1);
    setNumPages(0);
    setSearchApplied('');
    setHits([]);
    setHitIndex(-1);
    setCitationFlash(null);
    setPendingCalibration(null);
    setLoadProgress(null);
    setDocumentRetryKey(0);
    textCacheRef.current.clear();
    pdfRef.current = null;
    setDocumentScale(fileId ? loadDocumentScale(fileId) : null);
    setShowMarkupTools(false);
    setMarkupPanelCollapsed(true);
  }, [url, fileId]);

  useEffect(() => {
    void loadMarkups();
  }, [loadMarkups]);

  useEffect(() => {
    if (initialPage == null) return;
    navScrollPageRef.current = initialPage;
    setPage((curr) => (curr === initialPage ? curr : initialPage));
  }, [initialPage]);

  useEffect(() => { onVisiblePageChange?.(page); }, [page, onVisiblePageChange]);
  useEffect(() => { latestMarkupsRef.current = markups; }, [markups]);

  useEffect(() => {
    if (!citationRequest || citationRequest.fileId !== fileId) return;
    const nextPage = clamp(toPositiveInt(citationRequest.pageNumber), 1, Math.max(1, numPages || toPositiveInt(citationRequest.pageNumber)));
    goToPage(nextPage);
    setCitationFlash({
      ...citationRequest,
      pageNumber: nextPage,
      boundingBox: clampBoundingBox(citationRequest.boundingBox),
    });
    const timer = window.setTimeout(() => setCitationFlash(null), 5000);
    onCitationHandled?.();
    return () => window.clearTimeout(timer);
  }, [citationRequest, fileId, goToPage, numPages, onCitationHandled]);

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

  const createMarkup = useCallback(async (input: { pageNumber: number; type: MarkupType; coordinates: Record<string, unknown>; measurement?: Markup['measurement']; comment?: string }) => {
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
        comment: input.comment,
        createdBy: 'You',
        createdAt: now,
        updatedAt: now,
      };
      setMarkups((curr) => [...curr, localMarkup]);
      setSelectedMarkupId(localMarkup.id);
      revealMarkupPanels();
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
      revealMarkupPanels();
    } catch {
      appendLocalMarkup();
    }
  }, [projectId, fileId, revealMarkupPanels]);

  const removeMarkup = useCallback(async (markupId: string) => {
    if (!projectId || !fileId) {
      setMarkups((curr) => curr.filter((m) => m.id !== markupId));
      if (selectedMarkupId === markupId) setSelectedMarkupId(null);
      return;
    }
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
      if (nextHits.length > 0) { setHitIndex(0); goToPage(nextHits[0].pageNumber); }
      else setHitIndex(-1);
    } finally {
      setSearchBusy(false);
    }
  }, [goToPage, searchTerm]);

  const moveHit = useCallback((dir: 1 | -1) => {
    if (hits.length === 0) return;
    const next = dir === 1 ? (hitIndex + 1) % hits.length : (hitIndex - 1 + hits.length) % hits.length;
    setHitIndex(next);
    goToPage(hits[next].pageNumber);
  }, [goToPage, hitIndex, hits]);

  const activeHit = hitIndex >= 0 ? hits[hitIndex] : null;
  const activeSearchHighlightPage = activeHit?.pageNumber;

  const cancelDraw = useCallback(() => {
    setDraftStart(null);
    setDraftCurrent(null);
    setDraftPageNumber(null);
    draftStartRef.current = null;
    draftCurrentRef.current = null;
    draftPageNumberRef.current = null;
    setDraftAreaPoints([]);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        findInputRef.current?.focus();
        findInputRef.current?.select();
        return;
      }

      if (isEditableKeyboardTarget(event.target)) return;

      const viewerFocused = viewerRootRef.current?.contains(document.activeElement)
        || document.activeElement === document.body
        || document.activeElement === documentHostRef.current;
      if (!viewerFocused) return;

      const key = event.key;
      const mod = event.metaKey || event.ctrlKey;

      if (key === 'Escape') {
        if (draftStartRef.current || draftAreaPoints.length > 0 || pendingCalibration) {
          event.preventDefault();
          cancelDraw();
          if (pendingCalibration) {
            setPendingCalibration(null);
            setCalibrationInputValue('');
          }
          return;
        }
        if (selectedMarkupId) {
          event.preventDefault();
          setSelectedMarkupId(null);
          return;
        }
        if (tool !== 'pan') {
          event.preventDefault();
          setTool('pan');
        }
        return;
      }

      if ((key === 'Delete' || key === 'Backspace') && selectedMarkupId) {
        event.preventDefault();
        void removeMarkup(selectedMarkupId);
        return;
      }

      if (mod && key.toLowerCase() === 'z') {
        // Undo stack not implemented — documented as P1 in markup-keyboard-shortcuts.md
        return;
      }

      if (!mod && !event.altKey && key.length === 1) {
        const lower = key.toLowerCase();
        if (lower === 'v') {
          event.preventDefault();
          handleToolChange('select');
          return;
        }
        if (lower === 'h') {
          event.preventDefault();
          previousToolRef.current = tool === 'pan' ? 'select' : tool;
          setTool('pan');
          return;
        }
      }

      if (key === '+' || key === '=') {
        event.preventDefault();
        setFitMode('manual');
        setZoom((z) => Math.min(300, z + 10));
        return;
      }
      if (key === '-' || key === '_') {
        event.preventDefault();
        setFitMode('manual');
        setZoom((z) => Math.max(40, z - 10));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    cancelDraw,
    draftAreaPoints.length,
    handleToolChange,
    pendingCalibration,
    removeMarkup,
    selectedMarkupId,
    tool,
  ]);

  useEffect(() => {
    if (!citationRequest || citationRequest.fileId !== fileId) return;
    const snippet = citationRequest.textSnippet?.trim();
    if (!snippet) return;
    void runSearch(snippet);
  }, [citationRequest, fileId, runSearch]);

  const pagePointFromEvent = (event: ReactMouseEvent<HTMLDivElement>, host?: HTMLElement | null): Point | null => {
    const el = host ?? pageHostRef.current ?? (event.currentTarget instanceof HTMLElement ? event.currentTarget : null);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) };
  };

  const pageHostFromEvent = (event: ReactMouseEvent<HTMLDivElement>): HTMLElement | null => {
    const pageContainer = (event.target as HTMLElement).closest('[data-page]');
    if (pageContainer instanceof HTMLElement) return pageContainer;
    const layer = (event.target as HTMLElement).closest('[data-markup-layer]');
    if (layer instanceof HTMLElement) return layer;
    return pageHostRef.current;
  };

  const beginMarkupDrag = useCallback((markup: Markup, handle: string, event: ReactMouseEvent<HTMLElement>) => {
    event.stopPropagation();
    markupPageRef.current = markup.pageNumber;
    const p = pagePointFromEvent(event, pageHostFromEvent(event));
    if (!p) return;
    markupDragRef.current = { markupId: markup.id, handle, startPoint: p, startCoords: { ...markup.coordinates } };
  }, []);

  const activeMarkupPage = () => markupPageRef.current || page;

  const onPointerDown = (event: ReactMouseEvent<HTMLDivElement>, pageNumber?: number) => {
    const host = event.currentTarget as HTMLElement;
    const p = pagePointFromEvent(event, host);
    if (!p) return;

    const targetPage = pageNumber ?? page;
    markupPageRef.current = targetPage;

    if (tool === 'count') {
      void createMarkup({ pageNumber: targetPage, type: 'count', coordinates: { x: p.x, y: p.y }, measurement: { kind: 'count', value: 1, unit: 'count' } });
      return;
    }

    if (tool === 'area') {
      if (draftAreaPoints.length === 0) {
        draftPageNumberRef.current = targetPage;
        setDraftPageNumber(targetPage);
      }
      setDraftAreaPoints((curr) => [...curr, p]);
      return;
    }

    if (tool === 'select' || tool === 'pan') return;

    draftPageNumberRef.current = targetPage;
    setDraftPageNumber(targetPage);
    setDraftStart(p);
    setDraftCurrent(p);
    draftStartRef.current = p;
    draftCurrentRef.current = p;
  };

  const onPointerMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const host = event.currentTarget as HTMLElement;
    const drag = markupDragRef.current;
    if (drag) {
      const p = pagePointFromEvent(event, pageHostFromEvent(event) ?? host);
      if (!p) return;
      const dx = p.x - drag.startPoint.x;
      const dy = p.y - drag.startPoint.y;
      setMarkups((curr) =>
        curr.map((m) => {
          if (m.id !== drag.markupId) return m;
          const c = drag.startCoords;
          if (drag.handle === 'move') {
            if (isCalloutCoords(c)) {
              return {
                ...m,
                coordinates: {
                  ...c,
                  anchorX: clamp(toNum(c.anchorX) + dx, 0, 1),
                  anchorY: clamp(toNum(c.anchorY) + dy, 0, 1),
                  x: clamp(toNum(c.x) + dx, 0, 1 - toNum(c.width)),
                  y: clamp(toNum(c.y) + dy, 0, 1 - toNum(c.height)),
                },
              };
            }
            if ('width' in c && 'height' in c) {
              return { ...m, coordinates: { ...c, x: clamp(toNum(c.x) + dx, 0, 1 - toNum(c.width)), y: clamp(toNum(c.y) + dy, 0, 1 - toNum(c.height)) } };
            }
            if ('x1' in c) {
              return { ...m, coordinates: { x1: clamp(toNum(c.x1) + dx, 0, 1), y1: clamp(toNum(c.y1) + dy, 0, 1), x2: clamp(toNum(c.x2) + dx, 0, 1), y2: clamp(toNum(c.y2) + dy, 0, 1) } };
            }
            return { ...m, coordinates: { ...c, x: clamp(toNum(c.x) + dx, 0, 1), y: clamp(toNum(c.y) + dy, 0, 1) } };
          }
          if (drag.handle === 'anchor') {
            return { ...m, coordinates: { ...c, anchorX: clamp(toNum(c.anchorX) + dx, 0, 1), anchorY: clamp(toNum(c.anchorY) + dy, 0, 1) } };
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
    const p = pagePointFromEvent(event, host);
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
      if (updated) {
        const patch: Partial<Markup> = { coordinates: updated.coordinates };
        if (updated.type === 'length') {
          patch.measurement = buildLengthMeasurement(
            updated.coordinates as { x1: number; y1: number; x2: number; y2: number },
            documentScale,
          );
        }
        if (updated.type === 'calibrate' && updated.measurement?.calibration?.realValue) {
          const coords = updated.coordinates as { x1: number; y1: number; x2: number; y2: number };
          const pageSpaceCalibrationDistance = pageSpaceDistance(
            { x: coords.x1, y: coords.y1 },
            { x: coords.x2, y: coords.y2 },
            pageSpaceDims.width,
            pageSpaceDims.height,
          );
          const realValue = updated.measurement.calibration.realValue;
          const calUnit = updated.measurement.calibration.unit ?? updated.measurement.unit ?? 'ft';
          const nextScale: DocumentScale = { realValue, unit: calUnit, pageSpaceCalibrationDistance };
          applyDocumentScale(nextScale);
          patch.measurement = {
            kind: 'calibration',
            value: realValue,
            unit: calUnit,
            calibration: {
              pixels: pointDistance({ x: coords.x1, y: coords.y1 }, { x: coords.x2, y: coords.y2 }),
              realValue,
              unit: calUnit,
            },
          };
        }
        await saveMarkup(updated.id, patch);
        if (patch.measurement) {
          setMarkups((curr) => curr.map((m) => (m.id === updated.id ? { ...m, ...patch } : m)));
        }
      }
      return;
    }
    if (!(draftStartRef.current ?? draftStart) || !(draftCurrentRef.current ?? draftCurrent)) return;
    const startPos = draftStartRef.current ?? draftStart!;
    const endPos = draftCurrentRef.current ?? draftCurrent!;
    const targetPage = activeMarkupPage();
    if (tool === 'rectangle' || tool === 'highlight' || tool === 'cloud' || tool === 'text') {
      let rect = rectFrom(startPos, endPos);
      if (tool === 'text' && rect.width < 0.005 && rect.height < 0.005) {
        const { width: defaultW, height: defaultH } = DEFAULT_TEXT_BOX_SIZE;
        rect = {
          x: clamp(startPos.x, 0, 1 - defaultW),
          y: clamp(startPos.y, 0, 1 - defaultH),
          width: defaultW,
          height: defaultH,
        };
      }
      if (rect.width > 0.002 && rect.height > 0.002) {
        await createMarkup({
          pageNumber: targetPage,
          type: tool,
          coordinates: rect,
          comment: tool === 'text' ? '' : undefined,
        });
      }
    }

    if (tool === 'callout') {
      const rect = rectFrom(startPos, endPos);
      if (rect.width > 0.02 && rect.height > 0.02) {
        await createMarkup({
          pageNumber: targetPage,
          type: 'callout',
          coordinates: { anchorX: startPos.x, anchorY: startPos.y, ...rect },
          comment: '',
        });
      }
    }

    if (tool === 'stamp') {
      let rect = rectFrom(startPos, endPos);
      if (rect.width < 0.005 && rect.height < 0.005) {
        const { width: defaultW, height: defaultH } = DEFAULT_STAMP_SIZE;
        rect = {
          x: clamp(startPos.x - defaultW / 2, 0, 1 - defaultW),
          y: clamp(startPos.y - defaultH / 2, 0, 1 - defaultH),
          width: defaultW,
          height: defaultH,
        };
      }
      if (rect.width >= 0.02 && rect.height >= 0.02) {
        await createMarkup({
          pageNumber: targetPage,
          type: 'stamp',
          coordinates: { ...rect, stampLabel: selectedStampLabel },
          comment: selectedStampLabel,
        });
      }
    }

    if (tool === 'arrow' || tool === 'line') {
      const coords = { x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
      await createMarkup({ pageNumber: targetPage, type: tool, coordinates: coords });
    }

    if (tool === 'length') {
      const coords = { x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
      if (pointDistance(startPos, endPos) > 0.002) {
        await createMarkup({
          pageNumber: targetPage,
          type: 'length',
          coordinates: coords,
          measurement: buildLengthMeasurement(coords, documentScale),
        });
      }
    }

    if (tool === 'calibrate') {
      const coords = { x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
      const normalizedDistance = pointDistance(startPos, endPos);
      const pageSpaceCalibrationDistance = pageSpaceDistance(startPos, endPos, pageSpaceDims.width, pageSpaceDims.height);
      if (normalizedDistance > 0.002 && pageSpaceCalibrationDistance > 0) {
        setPendingCalibration({ pageNumber: targetPage, coords, pageSpaceCalibrationDistance, normalizedDistance });
        setCalibrationInputValue('');
        setCalibrationInputUnit(unit === 'sf' || unit === 'cy' ? 'ft' : (LENGTH_UNITS.includes(unit as LengthUnit) ? unit as LengthUnit : 'ft'));
      }
    }

    setDraftStart(null);
    setDraftCurrent(null);
    setDraftPageNumber(null);
    draftStartRef.current = null;
    draftCurrentRef.current = null;
    draftPageNumberRef.current = null;
  };

  const confirmCalibration = async () => {
    if (!pendingCalibration) return;
    const realValue = Number(calibrationInputValue);
    if (!Number.isFinite(realValue) || realValue <= 0) return;

    const { pageNumber, coords, pageSpaceCalibrationDistance, normalizedDistance } = pendingCalibration;
    const nextScale: DocumentScale = {
      realValue,
      unit: calibrationInputUnit,
      pageSpaceCalibrationDistance,
    };
    applyDocumentScale(nextScale);

    await createMarkup({
      pageNumber,
      type: 'calibrate',
      coordinates: coords,
      measurement: {
        kind: 'calibration',
        value: realValue,
        unit: calibrationInputUnit,
        calibration: {
          pixels: normalizedDistance,
          realValue,
          unit: calibrationInputUnit,
        },
      },
    });

    setPendingCalibration(null);
    setCalibrationInputValue('');
  };

  const cancelCalibration = () => {
    setPendingCalibration(null);
    setCalibrationInputValue('');
  };

  const finishArea = async () => {
    if (draftAreaPoints.length < 3) return;
    const targetPage = draftPageNumberRef.current ?? draftPageNumber ?? activeMarkupPage();
    await createMarkup({
      pageNumber: targetPage,
      type: 'area',
      coordinates: { points: draftAreaPoints },
      measurement: buildAreaMeasurement(draftAreaPoints, documentScale),
    });
    setDraftAreaPoints([]);
    setDraftPageNumber(null);
    draftPageNumberRef.current = null;
  };

  const renderPageOverlayContent = (pageNum: number) => {
    const draftPage = draftPageNumber ?? page;
    return (
      <>
        {markups.filter((m) => m.pageNumber === pageNum).map((m) => renderMarkup(m, pageNum))}
        {selectedMarkup && selectedMarkup.pageNumber === pageNum ? renderHandles(selectedMarkup) : null}

        {draftStart && draftCurrent && draftPage === pageNum && (tool === 'rectangle' || tool === 'highlight' || tool === 'cloud' || tool === 'text') ? (() => {
          const r = rectFrom(draftStart, draftCurrent);
          return <div style={{ position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%`, border: '2px dashed #2563eb', background: tool === 'highlight' ? 'rgba(250,204,21,.35)' : 'transparent' }} />;
        })() : null}

        {draftStart && draftCurrent && draftPage === pageNum && tool === 'callout' ? (() => {
          const r = rectFrom(draftStart, draftCurrent);
          const leaderStart = calloutLeaderStart(r, draftStart);
          const leader = normalizedLineEndpoints(leaderStart.x, leaderStart.y, draftStart.x, draftStart.y);
          return (
            <>
              <svg viewBox={MARKUP_SVG_VIEWBOX} preserveAspectRatio="none" style={{ ...MARKUP_SVG_LAYER_STYLE, pointerEvents: 'none' }}>
                <line x1={leader.x1} y1={leader.y1} x2={leader.x2} y2={leader.y2} stroke="#f97316" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                <circle cx={draftStart.x * 100} cy={draftStart.y * 100} r={1.2} fill="#f97316" vectorEffect="non-scaling-stroke" />
              </svg>
              <div style={{ ...percentRectStyle(r.x, r.y, r.width, r.height), border: '2px dashed #f97316', background: 'rgba(255,255,255,.85)' }} />
            </>
          );
        })() : null}

        {draftStart && draftCurrent && draftPage === pageNum && tool === 'stamp' ? (() => {
          const r = rectFrom(draftStart, draftCurrent);
          const preview = r.width < 0.005 && r.height < 0.005
            ? {
                x: clamp(draftStart.x - DEFAULT_STAMP_SIZE.width / 2, 0, 1 - DEFAULT_STAMP_SIZE.width),
                y: clamp(draftStart.y - DEFAULT_STAMP_SIZE.height / 2, 0, 1 - DEFAULT_STAMP_SIZE.height),
                width: DEFAULT_STAMP_SIZE.width,
                height: DEFAULT_STAMP_SIZE.height,
              }
            : r;
          return (
            <div
              className={`pdf-markup-stamp pdf-markup-stamp--draft pdf-markup-stamp--${stampVariantClass(selectedStampLabel)}`}
              style={{ position: 'absolute', left: `${preview.x * 100}%`, top: `${preview.y * 100}%`, width: `${preview.width * 100}%`, height: `${preview.height * 100}%` }}
            >
              <span className="pdf-markup-stamp__label">{selectedStampLabel}</span>
            </div>
          );
        })() : null}

        {draftStart && draftCurrent && draftPage === pageNum && (tool === 'arrow' || tool === 'line' || tool === 'length' || tool === 'calibrate') ? (
          <>
            <NormalizedLineSvg
              x1={draftStart.x}
              y1={draftStart.y}
              x2={draftCurrent.x}
              y2={draftCurrent.y}
              stroke={tool === 'calibrate' ? '#8b5cf6' : tool === 'line' ? '#0ea5e9' : '#ef4444'}
              strokeWidth={3}
              markerId="draft-arrow"
              showArrow={tool === 'arrow'}
              strokeDasharray={tool === 'calibrate' ? '5 4' : undefined}
            />
            {tool === 'length' && documentScale ? (
              <svg viewBox={MARKUP_SVG_VIEWBOX} preserveAspectRatio="none" style={{ ...MARKUP_SVG_LAYER_STYLE, pointerEvents: 'none' }}>
                <text
                  x={((draftStart.x + draftCurrent.x) / 2) * 100}
                  y={((draftStart.y + draftCurrent.y) / 2) * 100}
                  fontSize="3"
                  fill="#111827"
                  textAnchor="middle"
                  vectorEffect="non-scaling-stroke"
                >
                  {formatMeasurementValue(calibratedLengthFromLineCoords(
                    { x1: draftStart.x, y1: draftStart.y, x2: draftCurrent.x, y2: draftCurrent.y },
                    documentScale,
                    pageSpaceDims.width,
                    pageSpaceDims.height,
                  ))} {documentScale.unit}
                </text>
              </svg>
            ) : null}
          </>
        ) : null}

        {tool === 'area' && draftPage === pageNum && draftAreaPoints.length > 0 ? (
          <svg viewBox={MARKUP_SVG_VIEWBOX} preserveAspectRatio="none" style={{ ...MARKUP_SVG_LAYER_STYLE, pointerEvents: 'none' }}>
            <polyline points={normalizedPolylinePoints(draftAreaPoints)} fill="rgba(16,185,129,.2)" stroke="#10b981" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
          </svg>
        ) : null}

        {citationFlash?.pageNumber === pageNum && citationFlash.boundingBox ? (
          <div style={{ position: 'absolute', left: `${citationFlash.boundingBox.x * 100}%`, top: `${citationFlash.boundingBox.y * 100}%`, width: `${citationFlash.boundingBox.width * 100}%`, height: `${citationFlash.boundingBox.height * 100}%`, border: '2px solid #f97316', background: 'rgba(249,115,22,.2)', boxShadow: '0 0 0 1px rgba(255,255,255,.8) inset' }} />
        ) : null}
      </>
    );
  };

  const markupLayerDragHandlers = {
    onMouseMove: onPointerMove,
    onMouseUp: () => { void finishDraw(); },
    onMouseLeave: () => { void finishDraw(); },
  };

  const markupLayerDrawingHandlers = (pageNum: number, interactive: boolean) => (
    interactive ? {
      onMouseDown: (e: ReactMouseEvent<HTMLDivElement>) => onPointerDown(e, pageNum),
      onDoubleClick: () => { if (tool === 'area' && draftAreaPoints.length >= 3) { void finishArea(); } },
      onClick: () => { if (tool === 'select') setSelectedMarkupId(null); },
    } : {}
  );

  const markupLayerPointerHandlers = (pageNum: number, interactive: boolean) => ({
    ...markupLayerDragHandlers,
    ...markupLayerDrawingHandlers(pageNum, interactive),
  });

  const renderMarkupLayer = (pageNum: number, interactive: boolean, attachHandlers: boolean) => (
    <div
      data-markup-layer
      data-markup-page={pageNum}
      className="pdf-markup-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: attachHandlers && interactive ? 'auto' : 'none',
        cursor: interactive && attachHandlers ? 'crosshair' : undefined,
      }}
      {...(attachHandlers ? markupLayerPointerHandlers(pageNum, interactive) : markupLayerDragHandlers)}
    >
      {renderPageOverlayContent(pageNum)}
    </div>
  );

  const renderMarkup = (markup: Markup, forPage = page) => {
    if (markup.pageNumber !== forPage) return null;
    const selected = selectedMarkupId === markup.id;

    if (markup.type === 'rectangle' || markup.type === 'highlight' || markup.type === 'cloud' || markup.type === 'text') {
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      const { width: w, height: h } = resolveRectSize(
        markup.coordinates,
        markup.type === 'text' ? DEFAULT_TEXT_BOX_SIZE : { width: 0.1, height: 0.06 },
      );
      const borderColor = selected ? '#2563eb' : markup.type === 'cloud' ? '#fb923c' : '#06b6d4';
      return (
        <div
          key={markup.id}
          style={{
            ...percentRectStyle(x, y, w, h),
            border: markup.type === 'cloud' ? `2px dashed ${borderColor}` : `2px solid ${borderColor}`,
            borderRadius: markup.type === 'cloud' ? 16 : 4,
            background: markup.type === 'highlight' ? 'rgba(250,204,21,.35)' : markup.type === 'text' ? 'rgba(255,255,255,.92)' : 'transparent',
            pointerEvents: 'auto',
            zIndex: selected && markup.type === 'text' ? 20 : undefined,
            cursor: selected && tool === 'select' ? 'move' : undefined,
          }}
          onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}
          onMouseDown={(e) => {
            if (markup.type !== 'text' || !selected || tool !== 'select') return;
            if ((e.target as HTMLElement).closest('textarea')) return;
            beginMarkupDrag(markup, 'move', e);
          }}
        >
          {markup.type === 'text' ? (
            selected ? (
              <textarea
                autoFocus
                value={markup.comment ?? ''}
                placeholder="Text"
                onChange={(e) => setMarkups((curr) => curr.map((item) => (item.id === markup.id ? { ...item, comment: e.target.value } : item)))}
                onBlur={(e) => void saveMarkup(markup.id, { comment: e.target.value })}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fontSize: 11,
                  color: '#111827',
                  padding: '4px 6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{ fontSize: 11, color: '#111827', padding: '4px 6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', height: '100%' }}>
                {markup.comment?.trim() ? markup.comment : 'Text'}
              </div>
            )
          ) : null}
        </div>
      );
    }

    if (markup.type === 'callout') {
      const anchorX = toNum(markup.coordinates.anchorX);
      const anchorY = toNum(markup.coordinates.anchorY);
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      const { width: w, height: h } = resolveRectSize(markup.coordinates, { width: 0.15, height: 0.08 });
      const box = { x, y, width: w, height: h };
      const leaderStart = calloutLeaderStart(box, { x: anchorX, y: anchorY });
      const strokeColor = selected ? '#ea580c' : '#f97316';
      const leader = normalizedLineEndpoints(leaderStart.x, leaderStart.y, anchorX, anchorY);
      return (
        <div key={markup.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <svg
            viewBox={MARKUP_SVG_VIEWBOX}
            preserveAspectRatio="none"
            style={{ ...MARKUP_SVG_LAYER_STYLE, pointerEvents: 'auto' }}
            onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}
          >
            <line x1={leader.x1} y1={leader.y1} x2={leader.x2} y2={leader.y2} stroke={strokeColor} strokeWidth={selected ? 3 : 2} vectorEffect="non-scaling-stroke" />
            <circle cx={anchorX * 100} cy={anchorY * 100} r={selected ? 1.5 : 1.2} fill={strokeColor} vectorEffect="non-scaling-stroke" />
          </svg>
          <div
            style={{
              ...percentRectStyle(x, y, w, h),
              border: `2px solid ${strokeColor}`,
              borderRadius: 4,
              background: 'rgba(255,255,255,.92)',
              pointerEvents: 'auto',
              zIndex: selected ? 20 : undefined,
              cursor: selected && tool === 'select' ? 'move' : undefined,
            }}
            onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}
            onMouseDown={(e) => {
              if (!selected || tool !== 'select') return;
              if ((e.target as HTMLElement).closest('textarea')) return;
              beginMarkupDrag(markup, 'move', e);
            }}
          >
            {selected ? (
              <textarea
                autoFocus
                value={markup.comment ?? ''}
                placeholder="Callout text"
                onChange={(e) => setMarkups((curr) => curr.map((item) => (item.id === markup.id ? { ...item, comment: e.target.value } : item)))}
                onBlur={(e) => void saveMarkup(markup.id, { comment: e.target.value })}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fontSize: 11,
                  color: '#111827',
                  padding: '4px 6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{ fontSize: 11, color: '#111827', padding: '4px 6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', height: '100%' }}>
                {markup.comment?.trim() ? markup.comment : 'Callout'}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (markup.type === 'stamp') {
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      const { width: w, height: h } = resolveRectSize(markup.coordinates, DEFAULT_STAMP_SIZE);
      const label = stampLabelFromMarkup(markup);
      return (
        <div
          key={markup.id}
          className={`pdf-markup-stamp pdf-markup-stamp--${stampVariantClass(label)}${selected ? ' pdf-markup-stamp--selected' : ''}`}
          style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
          onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}
        >
          <span className="pdf-markup-stamp__label">{label}</span>
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
        <div key={markup.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <NormalizedLineSvg
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={selected ? 4 : 3}
            markerId={markerId}
            showArrow={isArrow}
            strokeDasharray={markup.type === 'calibrate' ? '5 4' : undefined}
            interactive
            onSelect={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}
          />
          {markup.measurement?.value != null ? (
            <svg viewBox={MARKUP_SVG_VIEWBOX} preserveAspectRatio="none" style={{ ...MARKUP_SVG_LAYER_STYLE, pointerEvents: 'none' }}>
              <text
                x={((x1 + x2) / 2) * 100}
                y={((y1 + y2) / 2) * 100}
                fontSize="3"
                fill="#111827"
                textAnchor="middle"
                vectorEffect="non-scaling-stroke"
              >
                {markup.measurement.value} {markup.measurement.unit ?? ''}
              </text>
            </svg>
          ) : null}
        </div>
      );
    }

    if (markup.type === 'area') {
      const points = (Array.isArray(markup.coordinates.points) ? markup.coordinates.points : []) as Point[];
      if (points.length < 3) return null;
      const centroid = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      const cx = centroid.x / points.length;
      const cy = centroid.y / points.length;
      return (
        <svg
          key={markup.id}
          viewBox={MARKUP_SVG_VIEWBOX}
          preserveAspectRatio="none"
          style={{ ...MARKUP_SVG_LAYER_STYLE, pointerEvents: 'auto' }}
          onClick={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); }}
        >
          <polygon
            points={normalizedPolylinePoints(points)}
            fill="rgba(16,185,129,.25)"
            stroke={selected ? '#059669' : '#34d399'}
            strokeWidth={selected ? 0.5 : 0.35}
            vectorEffect="non-scaling-stroke"
          />
          {markup.measurement?.value != null ? (
            <text x={cx * 100} y={cy * 100} fontSize="3" fill="#111827" textAnchor="middle" vectorEffect="non-scaling-stroke">
              {markup.measurement.value} {markup.measurement.unit ?? ''}
            </text>
          ) : null}
        </svg>
      );
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
      beginMarkupDrag(markup, handle, e);
    };

    const skipMoveOverlay = markup.type === 'text' || markup.type === 'callout';

    if (markup.type === 'rectangle' || markup.type === 'highlight' || markup.type === 'cloud' || markup.type === 'text' || markup.type === 'stamp') {
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      const { width: w, height: h } = resolveRectSize(
        markup.coordinates,
        markup.type === 'text' ? DEFAULT_TEXT_BOX_SIZE : markup.type === 'stamp' ? DEFAULT_STAMP_SIZE : { width: 0.1, height: 0.06 },
      );
      const corners: Array<[string, number, number]> = [['nw', x, y], ['ne', x + w, y], ['sw', x, y + h], ['se', x + w, y + h]];
      return (
        <>
          {!skipMoveOverlay ? (
            <div
              data-handle="move"
              style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, cursor: 'move', pointerEvents: 'auto', zIndex: 10 }}
              onMouseDown={startDrag('move')}
            />
          ) : null}
          {corners.map(([corner, cx, cy]) => (
            <div
              key={corner}
              data-handle={corner}
              style={{ position: 'absolute', left: `calc(${cx * 100}% - ${HS}px)`, top: `calc(${cy * 100}% - ${HS}px)`, width: HANDLE, height: HANDLE, background: '#2563eb', border: '2px solid #fff', borderRadius: 2, cursor: `${corner}-resize`, pointerEvents: 'auto', zIndex: 21 }}
              onMouseDown={startDrag(corner)}
            />
          ))}
        </>
      );
    }

    if (markup.type === 'callout') {
      const anchorX = toNum(markup.coordinates.anchorX);
      const anchorY = toNum(markup.coordinates.anchorY);
      const x = toNum(markup.coordinates.x);
      const y = toNum(markup.coordinates.y);
      const { width: w, height: h } = resolveRectSize(markup.coordinates, { width: 0.15, height: 0.08 });
      const corners: Array<[string, number, number]> = [['nw', x, y], ['ne', x + w, y], ['sw', x, y + h], ['se', x + w, y + h]];
      return (
        <>
          <div
            data-handle="anchor"
            style={{ position: 'absolute', left: `calc(${anchorX * 100}% - 6px)`, top: `calc(${anchorY * 100}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: '#f97316', border: '2px solid #fff', cursor: 'crosshair', pointerEvents: 'auto', zIndex: 21 }}
            onMouseDown={startDrag('anchor')}
          />
          {corners.map(([corner, cx, cy]) => (
            <div
              key={corner}
              data-handle={corner}
              style={{ position: 'absolute', left: `calc(${cx * 100}% - ${HS}px)`, top: `calc(${cy * 100}% - ${HS}px)`, width: HANDLE, height: HANDLE, background: '#2563eb', border: '2px solid #fff', borderRadius: 2, cursor: `${corner}-resize`, pointerEvents: 'auto', zIndex: 21 }}
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

  const activeToggleStyle = { background: '#e0f2fe' } as const;
  const activeHandStyle = { background: '#dbeafe' } as const;

  const compactControlClass = (active?: boolean, variant?: 'hand' | 'toggle') => {
    const classes = ['pdf-toolbar-btn'];
    if (active) {
      classes.push(variant === 'hand' ? 'pdf-toolbar-btn--hand-active' : 'pdf-toolbar-btn--toggle-active');
    }
    return classes.join(' ');
  };

  return (
    <div ref={viewerRootRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div className="pdf-viewer-toolbar">
        <div className="pdf-viewer-toolbar-row">
          <button type="button" onClick={() => goToPage(Math.max(1, page - 1))} className="pdf-toolbar-btn">Prev</button>
          <input type="number" min={1} max={Math.max(1, numPages)} value={page} onChange={(e) => goToPage(clamp(toPositiveInt(e.target.value, page), 1, Math.max(1, numPages || 1)))} className="pdf-toolbar-control pdf-toolbar-control--page" />
          <span className="pdf-toolbar-page-label">of {numPages || '--'}</span>
          <button type="button" onClick={() => goToPage(Math.min(Math.max(1, numPages), page + 1))} className="pdf-toolbar-btn">Next</button>
          <button type="button" onClick={() => { setFitMode('manual'); setZoom((z) => Math.max(40, z - 10)); }} className="pdf-toolbar-btn" aria-label="-">-</button>
          <span className="pdf-toolbar-zoom-label">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => { setFitMode('manual'); setZoom((z) => Math.min(300, z + 10)); }} className="pdf-toolbar-btn" aria-label="+">+</button>
          <button type="button" onClick={() => setFitMode('width')} className={compactControlClass(fitMode === 'width', 'toggle')} style={fitMode === 'width' ? activeToggleStyle : undefined}>Fit Width</button>
          <button type="button" onClick={() => setFitMode('page')} className={compactControlClass(fitMode === 'page', 'toggle')} style={fitMode === 'page' ? activeToggleStyle : undefined}>Fit Page</button>
          <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)} className="pdf-toolbar-btn">Rotate</button>
          <button
            type="button"
            onClick={() => setTool((t) => (t === 'pan' ? 'select' : 'pan'))}
            className={compactControlClass(tool === 'pan', 'hand')}
            style={tool === 'pan' ? activeHandStyle : undefined}
            aria-label="Hand"
          >
            Hand
          </button>
          <button
            type="button"
            onClick={() => setScrollMode((m) => (m === 'single' ? 'continuous' : 'single'))}
            className={compactControlClass(scrollMode === 'continuous', 'toggle')}
            style={scrollMode === 'continuous' ? activeToggleStyle : undefined}
            title="Toggle continuous scroll"
            aria-label="Scroll"
          >
            Scroll
          </button>
          <button
            type="button"
            onClick={() => setShowMarkupTools((v) => !v)}
            className={`pdf-toolbar-btn pdf-toolbar-markups-btn${showMarkupTools ? ' pdf-toolbar-btn--toggle-active' : ''}`}
            style={showMarkupTools ? activeToggleStyle : undefined}
            aria-label="Markups"
          >
            Markups
            {markups.length > 0 ? (
              <span className="pdf-toolbar-badge" aria-hidden>{markups.length}</span>
            ) : null}
          </button>
          <div className="pdf-toolbar-divider" aria-hidden />
          <div className="pdf-find-bar" role="search">
            <Search size={14} strokeWidth={2} className="pdf-find-bar__icon" aria-hidden />
            <input
              ref={findInputRef}
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void runSearch();
                }
                if (e.key === 'Escape') {
                  setSearchTerm('');
                  setSearchApplied('');
                  setHits([]);
                  setHitIndex(-1);
                  setSearchMsg(null);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Search this PDF"
              className="pdf-find-bar__input"
              aria-label="Find in document"
              disabled={searchBusy}
            />
            <div className="pdf-toolbar-group" role="group" aria-label="Search matches">
              <button
                type="button"
                className="pdf-toolbar-btn"
                aria-label="Previous match"
                title="Previous match"
                onClick={() => moveHit(-1)}
                disabled={hits.length === 0}
              >
                <ChevronUp size={15} strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                className="pdf-toolbar-btn"
                aria-label="Next match"
                title="Next match"
                onClick={() => moveHit(1)}
                disabled={hits.length === 0}
              >
                <ChevronDown size={15} strokeWidth={2} aria-hidden />
              </button>
            </div>
            <span className="pdf-find-bar__counter" aria-live="polite">
              {hits.length > 0 ? `${hitIndex + 1} of ${hits.length}` : searchApplied ? '0 of 0' : ''}
            </span>
          </div>
          <div className="pdf-toolbar-spacer" />
          <button type="button" onClick={downloadOriginalPdf} className="pdf-toolbar-btn" title="Download PDF" aria-label="Save">Save</button>
        </div>

        {searchMsg ? (
          <div className="pdf-find-message" role="status">{searchMsg}</div>
        ) : null}

        {showMarkupTools ? (
          <PdfMarkupToolbar
            tool={tool}
            onToolChange={handleToolChange}
            stampLabels={CONSTRUCTION_STAMPS}
            selectedStampLabel={selectedStampLabel}
            onStampLabelChange={(label) => setSelectedStampLabel(label as ConstructionStampLabel)}
            unit={unit}
            onUnitChange={setUnit}
            documentScale={documentScale}
            showFinishArea={tool === 'area' && draftAreaPoints.length >= 3}
            onFinishArea={() => { void finishArea(); }}
            selectedMarkupId={selectedMarkup?.id ?? null}
            onDeleteSelected={() => { if (selectedMarkup) void removeMarkup(selectedMarkup.id); }}
            onExportCsv={() => { void exportComments('csv'); }}
            onExportExcel={() => { void exportComments('xlsx'); }}
          />
        ) : null}
      </div>

      <div className="pdf-viewer-main">
        <aside className={`pdf-viewer-sidebar ${sidebarCollapsed ? 'pdf-viewer-sidebar--collapsed' : ''}`}>
          {sidebarCollapsed ? (
            <button
              type="button"
              className="pdf-viewer-sidebar-expand"
              onClick={() => setSidebarCollapsed(false)}
              title="Show page sidebar"
              aria-label="Show page sidebar"
            >
              <PanelLeft size={16} aria-hidden />
              <span>Pages</span>
            </button>
          ) : (
            <>
              <div className="pdf-viewer-sidebar-tabs">
                <button
                  type="button"
                  className={`pdf-viewer-sidebar-tab${tab === 'thumbnails' ? ' pdf-viewer-sidebar-tab--active' : ''}`}
                  onClick={() => setTab('thumbnails')}
                  title="Thumbnails"
                  aria-label="Thumbnails"
                >
                  <LayoutGrid size={14} aria-hidden />
                  <span>Thumbnails</span>
                </button>
                <button
                  type="button"
                  className={`pdf-viewer-sidebar-tab${tab === 'bookmarks' ? ' pdf-viewer-sidebar-tab--active' : ''}`}
                  onClick={() => setTab('bookmarks')}
                  title="Bookmarks"
                  aria-label="Bookmarks"
                >
                  <Bookmark size={14} aria-hidden />
                  <span>Bookmarks</span>
                </button>
                <button
                  type="button"
                  className={`pdf-viewer-sidebar-tab${tab === 'markups' ? ' pdf-viewer-sidebar-tab--active' : ''}`}
                  onClick={() => setTab('markups')}
                  title="Markups"
                  aria-label="Markups"
                >
                  <StickyNote size={14} aria-hidden />
                  <span>Markups</span>
                </button>
                <button
                  type="button"
                  className="pdf-viewer-sidebar-collapse"
                  onClick={() => setSidebarCollapsed(true)}
                  title="Hide page sidebar"
                  aria-label="Hide page sidebar"
                >
                  <PanelLeftClose size={16} aria-hidden />
                </button>
              </div>

              <div className="pdf-viewer-sidebar-body">
              {tab === 'thumbnails' ? (
                <div className="pdf-thumbnail-list">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                    <button key={`thumb-${p}`} type="button" className={`pdf-thumbnail-btn${p === page ? ' pdf-thumbnail-btn--active' : ''}`} onClick={() => goToPage(p)}>
                      <div className="pdf-thumbnail-label">Page {p}</div>
                      <div className="pdf-thumbnail-frame">
                        {pdfRef.current ? (
                          <Page
                            pdf={pdfRef.current}
                            pageNumber={p}
                            width={160}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            loading={<div className="pdf-thumbnail-placeholder" />}
                          />
                        ) : (
                          <div className="pdf-thumbnail-placeholder" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {tab === 'bookmarks' ? (
                outline ? (
                  <div className="pdf-bookmark-tree">
                    {outline.map((item, idx) => (
                      <BookmarkItem key={`${item.title}-${idx}`} item={item} depth={0} onJump={(dest) => void jumpToOutlineItem(dest)} />
                    ))}
                  </div>
                ) : (
                  <div className="pdf-sidebar-empty">No bookmarks found in this PDF.</div>
                )
              ) : null}

              {tab === 'markups' ? (
                <div className="pdf-markup-sidebar-list">
                  {markups.map((m) => (
                    <button key={`m-${m.id}`} type="button" className={`pdf-markup-sidebar-item${m.id === selectedMarkupId ? ' pdf-markup-sidebar-item--active' : ''}`} onClick={() => { setSelectedMarkupId(m.id); goToPage(m.pageNumber); }}>
                      <div className="pdf-markup-sidebar-item-title">{m.type} · p.{m.pageNumber}</div>
                      <div className="pdf-markup-sidebar-item-comment">{m.comment || 'No comment'}</div>
                    </button>
                  ))}
                  {markups.length === 0 ? (
                    <div className="pdf-sidebar-empty">No markups on this document.</div>
                  ) : null}
                </div>
              ) : null}
              </div>
            </>
          )}
        </aside>

        <div
          ref={documentHostRef}
          className="pdf-viewer-document-host"
          tabIndex={-1}
          onMouseDown={() => documentHostRef.current?.focus({ preventScroll: true })}
        >
          <Document
            key={`${url}-${documentRetryKey}`}
            file={url}
            loading={documentLoading}
            error={renderDocumentError}
            onLoadProgress={({ loaded, total }) => {
              if (total > 0) {
                setLoadProgress(Math.min(100, Math.round((loaded / total) * 100)));
              }
            }}
            onLoadSuccess={async (doc) => {
              setLoadProgress(null);
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
              <div ref={viewerRef} className="pdf-viewer-scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 12, background: '#f3f4f6', cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : tool === 'select' ? 'default' : 'crosshair' }} onMouseDown={onViewerMouseDown} onMouseMove={onViewerMouseMove} onMouseUp={onViewerMouseUp} onMouseLeave={onViewerMouseUp}>
                <div ref={pageHostRef} style={{ position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}>
                  <Page
                    pageNumber={page}
                    scale={scale}
                    rotate={rotation}
                    renderAnnotationLayer={false}
                    renderTextLayer
                    customTextRenderer={searchApplied ? ({ str }) => highlightSearchInText(str, searchApplied) : undefined}
                    className={markupOverlayInteractive ? 'pdf-page--text-blocked' : 'pdf-page--text-selectable'}
                    loading={<div style={{ width: Math.round(612 * scale), height: Math.round(792 * scale), background: '#e5e7eb' }} />}
                  />

                  {renderMarkupLayer(page, markupOverlayInteractive, true)}
                </div>
              </div>
            ) : (
              <div ref={continuousScrollRef} className="pdf-continuous-scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: '12px 0', background: '#f3f4f6', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                  <div
                    key={`cont-${p}`}
                    data-page={p}
                    className="pdf-continuous-page"
                    data-text-selectable={isMarkupDrawingActive ? 'false' : 'true'}
                    style={{
                      position: 'relative',
                      minWidth: continuousPageSlotSize.width,
                      minHeight: continuousPageSlotSize.height,
                      cursor: isMarkupDrawingActive ? 'crosshair' : undefined,
                    }}
                    {...markupLayerPointerHandlers(p, isMarkupDrawingActive)}
                  >
                    <StablePdfPage
                      pageNumber={p}
                      scale={scale}
                      rotation={rotation}
                      slotWidth={continuousPageSlotSize.width}
                      slotHeight={continuousPageSlotSize.height}
                      textSelectionEnabled={!isMarkupDrawingActive}
                      highlightSearchTerm={
                        searchApplied && p === activeSearchHighlightPage ? searchApplied : undefined
                      }
                    />
                    {renderMarkupLayer(p, isMarkupDrawingActive, false)}
                  </div>
                ))}
              </div>
            )}
          </Document>
        </div>
      </div>

      <div style={{ flex: '0 0 auto', height: markupPanelCollapsed ? 24 : markupPanelHeight, display: 'flex', flexDirection: 'column', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        {/* Drag-resize handle + collapse toggle */}
        <div className={markupPanelCollapsed && markups.length > 0 ? 'pdf-markup-panel-header pdf-markup-panel-header--hint' : 'pdf-markup-panel-header'} style={{ flex: '0 0 24px', background: '#f1f5f9', display: 'flex', alignItems: 'center', userSelect: 'none', borderBottom: markupPanelCollapsed ? 'none' : '1px solid #e2e8f0' }}>
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
              ? (
                <span className="pdf-markup-panel-header-label">
                  Markup Table
                  {markups.length > 0 ? (
                    <span className="pdf-markup-panel-badge" aria-label={`${markups.length} markups`}>{markups.length}</span>
                  ) : null}
                </span>
              )
              : <div style={{ width: 32, height: 3, background: '#9ca3af', borderRadius: 2 }} />}
          </div>
          <button
            type="button"
            className="pdf-markup-panel-toggle"
            onClick={() => setMarkupPanelCollapsed((c) => !c)}
            title={markupPanelCollapsed ? 'Expand markup panel' : 'Collapse markup panel'}
            aria-label={markupPanelCollapsed ? 'Expand markup panel' : 'Collapse markup panel'}
          >
            {markupPanelCollapsed ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
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
              <tr key={`row-${m.id}`} style={{ background: m.id === selectedMarkupId ? '#eff6ff' : '#fff' }} onClick={() => { setSelectedMarkupId(m.id); goToPage(m.pageNumber); }}>
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

      {pendingCalibration ? (
        <div className="pdf-calibration-dialog-backdrop" role="presentation" onClick={cancelCalibration}>
          <div
            className="pdf-calibration-dialog"
            role="dialog"
            aria-labelledby="calibration-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="calibration-dialog-title" className="pdf-calibration-dialog-title">Set drawing scale</h3>
            <p className="pdf-calibration-dialog-hint">This reference line represents:</p>
            <div className="pdf-calibration-dialog-row">
              <input
                type="number"
                min="0"
                step="any"
                value={calibrationInputValue}
                onChange={(e) => setCalibrationInputValue(e.target.value)}
                placeholder="Length"
                className="pdf-calibration-dialog-input"
                autoFocus
              />
              <select
                value={calibrationInputUnit}
                onChange={(e) => setCalibrationInputUnit(e.target.value as LengthUnit)}
                className="pdf-calibration-dialog-select"
              >
                {LENGTH_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="pdf-calibration-dialog-actions">
              <button type="button" className="pdf-calibration-dialog-btn" onClick={cancelCalibration}>Cancel</button>
              <button
                type="button"
                className="pdf-calibration-dialog-btn pdf-calibration-dialog-btn--primary"
                disabled={!calibrationInputValue || Number(calibrationInputValue) <= 0}
                onClick={() => void confirmCalibration()}
              >
                Apply scale
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
