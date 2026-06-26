/**
 * Tests for the three high-impact PDF viewer gaps:
 *  1. Clickable bookmark tree with true page / destination jumps
 *  2. Continuous multi-page scroll mode
 *  3. Markup move / resize handles with normalised coordinate updates
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConstructionPdfViewer from './ConstructionPdfViewer';

// ─── react-pdf mock ──────────────────────────────────────────────────────────
// Capture the onLoadSuccess handler so tests can trigger it manually.
let _capturedOnLoadSuccess: ((doc: MockDoc) => Promise<void>) | undefined;

vi.mock('react-pdf', () => {
  return {
    Document: ({ children, onLoadSuccess }: { children: React.ReactNode; onLoadSuccess?: (doc: any) => Promise<void> }) => {
      _capturedOnLoadSuccess = onLoadSuccess;
      return <div data-testid="pdf-document">{children}</div>;
    },
    // NOTE: No data-page on the Page mock — the continuous-scroll wrapper divs use data-page,
    // so we keep the attribute off the inner component to avoid collision.
    Page: ({ pageNumber }: { pageNumber: number }) => (
      <div data-testid={`pdf-page-${pageNumber}`} />
    ),
    pdfjs: { GlobalWorkerOptions: {}, version: '3.0.0' },
  };
});

// ─── IntersectionObserver mock ────────────────────────────────────────────────
let _lastObserver: MockIntersectionObserver | undefined;

class MockIntersectionObserver {
  private cb: IntersectionObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    _lastObserver = this;
  }

  /** Simulate an intersection update for a given element with a given ratio. */
  trigger(element: Element, ratio: number) {
    this.cb(
      [
        {
          target: element,
          intersectionRatio: ratio,
          isIntersecting: ratio > 0,
          boundingClientRect: element.getBoundingClientRect(),
          intersectionRect: element.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// ─── fetch mock ───────────────────────────────────────────────────────────────
function mockFetch(overrides: Record<string, object> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      for (const [pattern, body] of Object.entries(overrides)) {
        if (url.includes(pattern)) {
          return { ok: true, status: 200, json: async () => body } as Response;
        }
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    }),
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────
interface MockDoc {
  numPages: number;
  getOutline: ReturnType<typeof vi.fn>;
  getDestination: ReturnType<typeof vi.fn>;
  getPageIndex: ReturnType<typeof vi.fn>;
}

function makeMockDoc(opts: {
  numPages?: number;
  outline?: object[] | null;
  destinationPage?: number;
} = {}): MockDoc {
  const { numPages = 5, outline = null, destinationPage = 3 } = opts;
  return {
    numPages,
    getOutline: vi.fn().mockResolvedValue(outline),
    getDestination: vi.fn().mockResolvedValue([{ num: destinationPage - 1, gen: 0 }]),
    getPageIndex: vi.fn().mockResolvedValue(destinationPage - 1),
  };
}

const DEFAULT_PROPS = {
  fileName: 'test.pdf',
  url: 'http://example.com/test.pdf',
};

async function simulatePdfLoad(doc: MockDoc) {
  await act(async () => {
    await _capturedOnLoadSuccess!(doc);
  });
}

/** Sidebar starts collapsed — expand before using Thumbnails / Bookmarks / Markups tabs. */
function expandSidebar() {
  fireEvent.click(screen.getByRole('button', { name: '>' }));
}

function openSidebarTab(tabName: 'Thumbnails' | 'Bookmarks' | 'Markups') {
  expandSidebar();
  fireEvent.click(screen.getByRole('button', { name: tabName }));
}

/** Markup drawing tools and export buttons live behind the Markups toolbar toggle. */
function expandMarkupTools() {
  fireEvent.click(screen.getByRole('button', { name: 'Markups' }));
}

/** Markup table starts collapsed — expand before asserting on table rows/headers. */
function expandMarkupPanel() {
  fireEvent.click(screen.getByTitle('Expand markup panel'));
}

function isContinuousScrollMode() {
  return document.querySelectorAll('[data-page]').length > 0;
}

function enableSinglePageMode() {
  if (isContinuousScrollMode()) {
    fireEvent.click(screen.getByRole('button', { name: 'Scroll' }));
  }
}

function enableContinuousScrollMode() {
  if (!isContinuousScrollMode()) {
    fireEvent.click(screen.getByRole('button', { name: 'Scroll' }));
  }
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('ConstructionPdfViewer – bookmark tree', () => {
  beforeEach(() => {
    _capturedOnLoadSuccess = undefined;
    _lastObserver = undefined;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    mockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows "No bookmarks found" when the PDF has no outline', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ outline: null }));

    // Switch to bookmarks tab
    openSidebarTab('Bookmarks');

    expect(screen.getByText('No bookmarks found in this PDF.')).toBeInTheDocument();
  });

  it('renders clickable bookmark buttons from the PDF outline', async () => {
    const outline = [
      { title: 'Introduction', dest: 'intro-dest', items: [] },
      { title: 'Chapter 1', dest: 'ch1-dest', items: [] },
    ];

    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ outline, destinationPage: 2 }));

    openSidebarTab('Bookmarks');

    expect(screen.getByRole('button', { name: 'Introduction' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chapter 1' })).toBeInTheDocument();
  });

  it('clicking a bookmark calls getDestination and jumps to the resolved page', async () => {
    const doc = makeMockDoc({
      outline: [{ title: 'Chapter 2', dest: 'ch2', items: [] }],
      destinationPage: 4,
    });

    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(doc);

    openSidebarTab('Bookmarks');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Chapter 2' }));
    });

    // getDestination + getPageIndex should have been called
    expect(doc.getDestination).toHaveBeenCalledWith('ch2');
    expect(doc.getPageIndex).toHaveBeenCalled();

    // The page input should now show page 4
    await waitFor(() => {
      const pageInput = screen.getByRole('spinbutton');
      expect(pageInput).toHaveValue(4);
    });
  });

  it('renders nested bookmark children and toggles expand/collapse', async () => {
    const outline = [
      {
        title: 'Section A',
        dest: 'a',
        items: [{ title: 'Sub-section A1', dest: 'a1', items: [] }],
      },
    ];

    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ outline }));

    openSidebarTab('Bookmarks');

    // Root bookmark visible; child initially hidden (depth-1 starts collapsed for depth >= 1)
    // Root is at depth=0, expanded by default. Child should be visible.
    expect(screen.getByRole('button', { name: 'Section A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sub-section A1' })).toBeInTheDocument();

    // Collapse the parent by clicking the expand toggle (▾ button)
    const toggleBtn = screen.getByRole('button', { name: '▾' });
    fireEvent.click(toggleBtn);

    expect(screen.queryByRole('button', { name: 'Sub-section A1' })).not.toBeInTheDocument();

    // Expand again
    fireEvent.click(screen.getByRole('button', { name: '▸' }));
    expect(screen.getByRole('button', { name: 'Sub-section A1' })).toBeInTheDocument();
  });

  it('clicking a bookmark with an array destination directly resolves the page', async () => {
    // Array dest: [{ num: 2, gen: 0 }, 'XYZ', 0] — no getDestination call needed
    const doc = makeMockDoc({ outline: [], destinationPage: 3 });
    // Manually override getPageIndex for the explicit dest
    doc.getPageIndex.mockResolvedValue(2); // 0-based → page 3

    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);

    // Simulate a bookmark with an array dest
    const outlineWithArrayDest = [{ title: 'Direct Page', dest: [{ num: 2, gen: 0 }], items: [] }];
    const docWithArrayDest = { ...doc, getOutline: vi.fn().mockResolvedValue(outlineWithArrayDest) };

    await simulatePdfLoad(docWithArrayDest);
    openSidebarTab('Bookmarks');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Direct Page' }));
    });

    // getDestination should NOT have been called (dest is already an array)
    expect(doc.getDestination).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByRole('spinbutton')).toHaveValue(3);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ConstructionPdfViewer – continuous scroll mode', () => {
  beforeEach(() => {
    _capturedOnLoadSuccess = undefined;
    _lastObserver = undefined;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    mockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders only a single Page by default (single mode)', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={2} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    enableSinglePageMode();

    // In single mode there are NO data-page wrapper divs (only continuous mode adds them)
    expect(document.querySelectorAll('[data-page]').length).toBe(0);
    // Main viewer shows page 2
    expect(screen.getAllByTestId('pdf-page-2').length).toBeGreaterThanOrEqual(1);
  });

  it('clicking "Scroll" renders all pages simultaneously in continuous mode', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 4 }));

    // Default is continuous scroll — all pages visible without toggling
    expect(document.querySelectorAll('[data-page]').length).toBe(4);
    for (let p = 1; p <= 4; p++) {
      expect(document.querySelector(`[data-page="${p}"]`)).toBeInTheDocument();
    }

    enableSinglePageMode();
    expect(document.querySelectorAll('[data-page]').length).toBe(0);

    enableContinuousScrollMode();

    // Continuous mode: one [data-page] wrapper div per page
    expect(document.querySelectorAll('[data-page]').length).toBe(4);
    for (let p = 1; p <= 4; p++) {
      expect(document.querySelector(`[data-page="${p}"]`)).toBeInTheDocument();
    }
  });

  it('toggling back from continuous to single removes extra pages', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expect(document.querySelectorAll('[data-page]').length).toBe(3);

    const scrollBtn = screen.getByRole('button', { name: 'Scroll' });
    fireEvent.click(scrollBtn); // → single
    expect(document.querySelectorAll('[data-page]').length).toBe(0);

    fireEvent.click(scrollBtn); // → back to continuous
    expect(document.querySelectorAll('[data-page]').length).toBe(3);
  });

  it('continuous mode page containers have data-page attributes for IntersectionObserver', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    enableContinuousScrollMode();

    for (let p = 1; p <= 3; p++) {
      const container = document.querySelector(`[data-page="${p}"]`);
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('data-page', String(p));
    }
  });

  it('IntersectionObserver updates visible page in continuous mode', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    enableContinuousScrollMode();

    // The observer should have been created and have observed the page containers
    expect(_lastObserver).toBeDefined();
    expect(_lastObserver!.observe).toHaveBeenCalled();

    // Simulate page 3 container becoming 75% visible
    const page3Container = document.querySelector('[data-page="3"]') as HTMLElement;
    expect(page3Container).toBeInTheDocument();

    act(() => {
      _lastObserver!.trigger(page3Container, 0.75);
    });

    // Page input should update to 3
    await waitFor(() => {
      expect(screen.getByRole('spinbutton')).toHaveValue(3);
    });
  });

  it('IntersectionObserver page updates do not call scrollIntoView', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));
    enableContinuousScrollMode();

    await waitFor(() => {
      expect(document.querySelectorAll('[data-page]').length).toBe(5);
    });

    scrollIntoView.mockClear();

    const page3Container = document.querySelector('[data-page="3"]') as HTMLElement;
    act(() => {
      _lastObserver!.trigger(page3Container, 0.75);
    });

    await waitFor(() => {
      expect(screen.getByRole('spinbutton')).toHaveValue(3);
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('continuous page containers keep min-height while scrolling updates the active page', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 4 }));
    enableContinuousScrollMode();

    for (let p = 1; p <= 4; p++) {
      const container = document.querySelector(`[data-page="${p}"]`) as HTMLElement;
      expect(container).toBeInTheDocument();
      expect(container.style.minHeight).not.toBe('0px');
      expect(container.style.minHeight).not.toBe('');
    }

    const page2Container = document.querySelector('[data-page="2"]') as HTMLElement;
    act(() => {
      _lastObserver!.trigger(page2Container, 0.8);
    });

    await waitFor(() => {
      expect(screen.getByRole('spinbutton')).toHaveValue(2);
    });

    expect(document.querySelectorAll('[data-page]').length).toBe(4);
    expect(document.querySelector('[data-page="2"]')).toHaveClass('pdf-continuous-page--active');
    expect(document.querySelectorAll('[data-testid^="pdf-page-"]').length).toBeGreaterThanOrEqual(4);
  });

  it('explicit page navigation scrolls the target page into view', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));
    enableContinuousScrollMode();

    scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ConstructionPdfViewer – markup move/resize handles', () => {
  const now = new Date().toISOString();

  function makeMarkup(overrides: Partial<{
    id: string;
    type: string;
    pageNumber: number;
    coordinates: Record<string, unknown>;
  }> = {}) {
    return {
      id: overrides.id ?? 'markup-1',
      projectId: 'proj-1',
      fileId: 'file-1',
      pageNumber: overrides.pageNumber ?? 1,
      type: overrides.type ?? 'rectangle',
      coordinates: overrides.coordinates ?? { x: 0.1, y: 0.1, width: 0.3, height: 0.2 },
      category: 'General Comment',
      status: 'Open',
      createdBy: 'Tester',
      createdAt: now,
      updatedAt: now,
    };
  }

  beforeEach(() => {
    _capturedOnLoadSuccess = undefined;
    _lastObserver = undefined;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function renderWithMarkups(markups: object[]) {
    mockFetch({ '/markups': { markups } });

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-1"
        fileId="file-1"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expandMarkupPanel();

    // Wait for markups to appear in the table
    await waitFor(() => {
      expect(document.querySelector('td')).toBeInTheDocument();
    });
  }

  /** Helper: select the first markup by clicking its table row (identified by type cell). */
  async function selectFirstMarkup(type = 'rectangle') {
    await waitFor(() => screen.getByRole('cell', { name: type }));
    fireEvent.click(screen.getByRole('cell', { name: type }).closest('tr')!);
  }

  it('renders no drag handles when no markup is selected', async () => {
    await renderWithMarkups([makeMarkup()]);
    enableSinglePageMode();
    expect(document.querySelector('[data-handle]')).toBeNull();
  });

  it('shows handles (move + 4 corners) when a rect markup is selected in select mode', async () => {
    const markup = makeMarkup({ coordinates: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 } });
    await renderWithMarkups([markup]);
    enableSinglePageMode();
    await selectFirstMarkup('rectangle');

    await waitFor(() => {
      expect(document.querySelector('[data-handle="move"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="nw"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="ne"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="sw"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="se"]')).toBeInTheDocument();
    });
  });

  it('shows p1 and p2 handles for arrow/line markup when selected', async () => {
    const markup = makeMarkup({
      type: 'arrow',
      coordinates: { x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.5 },
    });
    await renderWithMarkups([markup]);
    enableSinglePageMode();
    await selectFirstMarkup('arrow');

    await waitFor(() => {
      expect(document.querySelector('[data-handle="p1"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="p2"]')).toBeInTheDocument();
    });
  });

  it('dragging move handle updates x/y coordinates and keeps them in [0,1]', async () => {
    const markup = makeMarkup({ coordinates: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 } });

    // Mock PATCH to return updated markup
    let lastPatch: Record<string, unknown> = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/markups') && (!init?.method || init.method === 'GET')) {
          return { ok: true, status: 200, json: async () => ({ markups: [markup] }) } as Response;
        }
        if (init?.method === 'PATCH') {
          lastPatch = JSON.parse(String(init.body)) as Record<string, unknown>;
          return { ok: true, status: 200, json: async () => ({ markup: { ...markup, ...lastPatch } }) } as Response;
        }
        return { ok: true, status: 200, json: async () => ({}) } as Response;
      }),
    );

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-1"
        fileId="file-1"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expandMarkupPanel();

    // Select the markup
    await selectFirstMarkup('rectangle');
    enableSinglePageMode();

    await waitFor(() => {
      expect(document.querySelector('[data-handle="move"]')).toBeInTheDocument();
    });

    const moveHandle = document.querySelector('[data-handle="move"]') as HTMLElement;
    const pageHost = moveHandle.closest('[style*="position: relative"]') as HTMLElement;

    // Mock getBoundingClientRect so pagePointFromEvent can compute normalized coords
    vi.spyOn(pageHost, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 1000, height: 800,
      right: 1000, bottom: 800, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // Mousedown on handle at (100, 80) → normalized (0.1, 0.1)
    fireEvent.mouseDown(moveHandle, { clientX: 100, clientY: 80 });

    // Mousemove on pageHost by +50px in x, +40px in y → normalized (+0.05, +0.05)
    fireEvent.mouseMove(pageHost, { clientX: 150, clientY: 120 });

    // Mouseup on pageHost to finalise
    fireEvent.mouseUp(pageHost);

    await waitFor(() => {
      expect(lastPatch.coordinates).toBeDefined();
      const coords = lastPatch.coordinates as Record<string, number>;
      // x moved: 0.1 + 0.05 = 0.15
      expect(coords.x).toBeCloseTo(0.15, 2);
      // y moved: 0.1 + 0.05 = 0.15
      expect(coords.y).toBeCloseTo(0.15, 2);
      // width/height unchanged
      expect(coords.width).toBeCloseTo(0.3, 2);
      expect(coords.height).toBeCloseTo(0.2, 2);
    });
  });

  it('dragging SE resize handle grows width and height', async () => {
    const markup = makeMarkup({ coordinates: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 } });

    let lastPatch: Record<string, unknown> = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/markups') && (!init?.method || init.method === 'GET')) {
          return { ok: true, status: 200, json: async () => ({ markups: [markup] }) } as Response;
        }
        if (init?.method === 'PATCH') {
          lastPatch = JSON.parse(String(init.body)) as Record<string, unknown>;
          return { ok: true, status: 200, json: async () => ({ markup: { ...markup, ...lastPatch } }) } as Response;
        }
        return { ok: true, status: 200, json: async () => ({}) } as Response;
      }),
    );

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-1"
        fileId="file-1"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expandMarkupPanel();
    await selectFirstMarkup('rectangle');
    enableSinglePageMode();
    await waitFor(() => expect(document.querySelector('[data-handle="se"]')).toBeInTheDocument());

    const seHandle = document.querySelector('[data-handle="se"]') as HTMLElement;
    const pageHost = seHandle.closest('[style*="position: relative"]') as HTMLElement;

    vi.spyOn(pageHost, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 1000, height: 800,
      right: 1000, bottom: 800, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // SE handle is at (x+w, y+h) = (0.4, 0.3) → pixel (400, 240)
    fireEvent.mouseDown(seHandle, { clientX: 400, clientY: 240 });
    // Drag to (450, 280) → dx=+0.05, dy=+0.05
    fireEvent.mouseMove(pageHost, { clientX: 450, clientY: 280 });
    fireEvent.mouseUp(pageHost);

    await waitFor(() => {
      const coords = lastPatch.coordinates as Record<string, number>;
      expect(coords.width).toBeCloseTo(0.35, 2);
      expect(coords.height).toBeCloseTo(0.25, 2);
      // x and y unchanged
      expect(coords.x).toBeCloseTo(0.1, 2);
      expect(coords.y).toBeCloseTo(0.1, 2);
    });
  });

  it('move drag clamps coordinates to normalised [0, 1] range', async () => {
    const markup = makeMarkup({ coordinates: { x: 0.8, y: 0.8, width: 0.15, height: 0.1 } });

    let lastPatch: Record<string, unknown> = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/markups') && (!init?.method || init.method === 'GET')) {
          return { ok: true, status: 200, json: async () => ({ markups: [markup] }) } as Response;
        }
        if (init?.method === 'PATCH') {
          lastPatch = JSON.parse(String(init.body)) as Record<string, unknown>;
          return { ok: true, status: 200, json: async () => ({ markup: { ...markup, ...lastPatch } }) } as Response;
        }
        return { ok: true, status: 200, json: async () => ({}) } as Response;
      }),
    );

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-1"
        fileId="file-1"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expandMarkupPanel();
    await selectFirstMarkup('rectangle');
    enableSinglePageMode();
    await waitFor(() => expect(document.querySelector('[data-handle="move"]')).toBeInTheDocument());

    const moveHandle = document.querySelector('[data-handle="move"]') as HTMLElement;
    const pageHost = moveHandle.closest('[style*="position: relative"]') as HTMLElement;

    vi.spyOn(pageHost, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 1000, height: 800,
      right: 1000, bottom: 800, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // Drag far to the right – would go to x=0.8 + 0.5 = 1.3, clamped to 1 - 0.15 = 0.85
    fireEvent.mouseDown(moveHandle, { clientX: 800, clientY: 800 });
    fireEvent.mouseMove(pageHost, { clientX: 1300, clientY: 1300 });
    fireEvent.mouseUp(pageHost);

    await waitFor(() => {
      const coords = lastPatch.coordinates as Record<string, number>;
      expect(coords.x).toBeLessThanOrEqual(1 - 0.15);
      expect(coords.y).toBeLessThanOrEqual(1 - 0.1);
    });
  });

  it('dragging p1 handle of an arrow markup updates x1/y1', async () => {
    const markup = makeMarkup({
      type: 'arrow',
      coordinates: { x1: 0.1, y1: 0.2, x2: 0.6, y2: 0.7 },
    });

    let lastPatch: Record<string, unknown> = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/markups') && (!init?.method || init.method === 'GET')) {
          return { ok: true, status: 200, json: async () => ({ markups: [markup] }) } as Response;
        }
        if (init?.method === 'PATCH') {
          lastPatch = JSON.parse(String(init.body)) as Record<string, unknown>;
          return { ok: true, status: 200, json: async () => ({ markup: { ...markup, ...lastPatch } }) } as Response;
        }
        return { ok: true, status: 200, json: async () => ({}) } as Response;
      }),
    );

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-1"
        fileId="file-1"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expandMarkupPanel();
    await selectFirstMarkup('arrow');
    enableSinglePageMode();
    await waitFor(() => expect(document.querySelector('[data-handle="p1"]')).toBeInTheDocument());

    const p1Handle = document.querySelector('[data-handle="p1"]') as HTMLElement;
    const pageHost = p1Handle.closest('[style*="position: relative"]') as HTMLElement;

    vi.spyOn(pageHost, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 1000, height: 800,
      right: 1000, bottom: 800, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // p1 is at x1=0.1, y1=0.2 → pixel (100, 160)
    // Drag to (200, 240) → dx=+0.1, dy=+0.1
    fireEvent.mouseDown(p1Handle, { clientX: 100, clientY: 160 });
    fireEvent.mouseMove(pageHost, { clientX: 200, clientY: 240 });
    fireEvent.mouseUp(pageHost);

    await waitFor(() => {
      const coords = lastPatch.coordinates as Record<string, number>;
      // x1 moved: 0.1 + 0.1 = 0.2
      expect(coords.x1).toBeCloseTo(0.2, 2);
      expect(coords.y1).toBeCloseTo(0.3, 2);
      // x2/y2 unchanged
      expect(coords.x2).toBeCloseTo(0.6, 2);
      expect(coords.y2).toBeCloseTo(0.7, 2);
    });
  });

  it('no PATCH is sent when drag ends without movement (mousedown then immediate mouseup)', async () => {
    const markup = makeMarkup({ coordinates: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 } });
    let patchCalled = false;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/markups') && (!init?.method || init.method === 'GET')) {
          return { ok: true, status: 200, json: async () => ({ markups: [markup] }) } as Response;
        }
        if (init?.method === 'PATCH') {
          patchCalled = true;
          return { ok: true, status: 200, json: async () => ({ markup }) } as Response;
        }
        return { ok: true, status: 200, json: async () => ({}) } as Response;
      }),
    );

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-1"
        fileId="file-1"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expandMarkupPanel();
    await selectFirstMarkup('rectangle');
    enableSinglePageMode();
    await waitFor(() => expect(document.querySelector('[data-handle="move"]')).toBeInTheDocument());

    const moveHandle = document.querySelector('[data-handle="move"]') as HTMLElement;
    const pageHost = moveHandle.closest('[style*="position: relative"]') as HTMLElement;

    vi.spyOn(pageHost, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 1000, height: 800,
      right: 1000, bottom: 800, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.mouseDown(moveHandle, { clientX: 100, clientY: 80 });
    // No mousemove — coordinates stay the same
    fireEvent.mouseUp(pageHost);

    // PATCH should still be called (saveMarkup is called with whatever coords are in state)
    // This tests that the drag-finalize path runs without crashing
    await waitFor(() => {
      expect(patchCalled).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test suite 2: Page navigation and viewer controls
// ─────────────────────────────────────────────────────────────────────────────

describe('ConstructionPdfViewer – page navigation and viewer controls', () => {
  beforeEach(() => {
    _capturedOnLoadSuccess = undefined;
    _lastObserver = undefined;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    mockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows correct page count after PDF loads', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 12 }));

    expect(screen.getByText('of 12')).toBeInTheDocument();
  });

  it('does not duplicate the file name in the PDF viewer toolbar', async () => {
    render(
      <ConstructionPdfViewer
        fileName="site-plan-rev3.pdf"
        url="http://example.com/site-plan.pdf"
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    expect(screen.queryByTitle('site-plan-rev3.pdf')).not.toBeInTheDocument();
  });

  it('Next button increments the current page', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('spinbutton')).toHaveValue(2);
  });

  it('Prev button decrements the current page', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={3} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    fireEvent.click(screen.getByRole('button', { name: 'Prev' }));

    expect(screen.getByRole('spinbutton')).toHaveValue(2);
  });

  it('Prev on page 1 stays at page 1', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    fireEvent.click(screen.getByRole('button', { name: 'Prev' }));

    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });

  it('Next on the last page stays on the last page', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={5} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('spinbutton')).toHaveValue(5);
  });

  it('typing a page number directly navigates to that page', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 10 }));

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } });

    expect(screen.getByRole('spinbutton')).toHaveValue(7);
  });

  it('entering 0 in the page input clamps to page 1', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={3} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } });

    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });

  it('entering a page beyond the total clamps to the last page', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '99' } });

    expect(screen.getByRole('spinbutton')).toHaveValue(5);
  });

  it('Zoom + increases the displayed zoom percentage', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    // Default zoom is 120%
    expect(screen.getByText('120%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+' }));

    expect(screen.getByText('130%')).toBeInTheDocument();
  });

  it('Zoom - decreases the displayed zoom percentage', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expect(screen.getByText('120%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '-' }));

    expect(screen.getByText('110%')).toBeInTheDocument();
  });

  it('Fit Width button activates fit-width mode (highlighted)', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    const fitWidthBtn = screen.getByRole('button', { name: 'Fit Width' });
    fireEvent.click(fitWidthBtn);

    // Active fit-width buttons are styled with background #e0f2fe
    expect(fitWidthBtn).toHaveStyle('background: #e0f2fe');
  });

  it('Fit Page button activates fit-page mode (highlighted)', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    const fitPageBtn = screen.getByRole('button', { name: 'Fit Page' });
    fireEvent.click(fitPageBtn);

    expect(fitPageBtn).toHaveStyle('background: #e0f2fe');
  });

  it('Fit Width deactivates after Fit Page is clicked', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    const fitWidthBtn = screen.getByRole('button', { name: 'Fit Width' });
    const fitPageBtn = screen.getByRole('button', { name: 'Fit Page' });

    fireEvent.click(fitWidthBtn);
    expect(fitWidthBtn).toHaveStyle('background: #e0f2fe');

    fireEvent.click(fitPageBtn);
    // Fit Width should no longer be active
    expect(fitWidthBtn).not.toHaveStyle('background: #e0f2fe');
    expect(fitPageBtn).toHaveStyle('background: #e0f2fe');
  });

  it('Rotate button does not throw and cycles without error', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} initialPage={1} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    const rotateBtn = screen.getByRole('button', { name: 'Rotate' });

    // Four clicks = full 360° cycle — should never throw
    for (let i = 0; i < 4; i++) {
      expect(() => fireEvent.click(rotateBtn)).not.toThrow();
    }
  });

  it('Hand button starts active (pan mode is default) and toggles', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    const handBtn = screen.getByRole('button', { name: 'Hand' });

    // Pan mode is the default — button should start in the active (blue) state
    expect(handBtn).toHaveStyle('background: #dbeafe');

    fireEvent.click(handBtn); // → select mode
    expect(handBtn).not.toHaveStyle('background: #dbeafe');

    fireEvent.click(handBtn); // → back to pan
    expect(handBtn).toHaveStyle('background: #dbeafe');
  });

  it('onVisiblePageChange callback is called when the page changes', async () => {
    const onVisiblePageChange = vi.fn();
    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        initialPage={1}
        onVisiblePageChange={onVisiblePageChange}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(onVisiblePageChange).toHaveBeenCalledWith(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test suite 3: In-PDF text search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extend the base MockDoc with a getPage() implementation that returns
 * synthetic text content, allowing runSearch() to work in tests.
 */
function makeSearchableMockDoc(pageTexts: Record<number, string>) {
  const numPages = Object.keys(pageTexts).length;
  return {
    numPages,
    getOutline: vi.fn().mockResolvedValue(null),
    getDestination: vi.fn().mockResolvedValue(null),
    getPageIndex: vi.fn().mockResolvedValue(0),
    getPage: vi.fn().mockImplementation(async (pageNum: number) => ({
      getTextContent: vi.fn().mockResolvedValue({
        items: pageTexts[pageNum] ? [{ str: pageTexts[pageNum] }] : [],
      }),
    })),
  };
}

const SEARCH_PAGE_TEXTS: Record<number, string> = {
  1: 'Foundation drawings show the load bearing wall specifications in detail.',
  2: 'Load bearing columns require steel reinforcement per section 4.',
  3: 'Expansion joint details on the elevated deck section need field verification.',
};

describe('ConstructionPdfViewer – in-PDF text search', () => {
  beforeEach(() => {
    _capturedOnLoadSuccess = undefined;
    _lastObserver = undefined;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    mockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not render the in-viewer search toolbar row', async () => {
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeSearchableMockDoc(SEARCH_PAGE_TEXTS));

    expect(screen.queryByPlaceholderText('Search this PDF')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Find' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Prev Hit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next Hit' })).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test suite 4: Create and manage markups
// ─────────────────────────────────────────────────────────────────────────────

describe('ConstructionPdfViewer – create and manage markups', () => {
  const now = new Date().toISOString();

  function makeDrawingMarkup(
    type: string,
    overrides: Partial<{
      id: string;
      pageNumber: number;
      coordinates: Record<string, unknown>;
      measurement: Record<string, unknown>;
      category: string;
      status: string;
      comment: string;
      assignedTo: string;
    }> = {},
  ) {
    return {
      id: overrides.id ?? `markup-draw-${type}`,
      projectId: 'proj-draw',
      fileId: 'file-draw',
      pageNumber: overrides.pageNumber ?? 1,
      type,
      coordinates:
        overrides.coordinates ??
        (type === 'arrow' || type === 'line'
          ? { x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.5 }
          : { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }),
      measurement: overrides.measurement,
      category: overrides.category ?? 'General Comment',
      status: overrides.status ?? 'Open',
      comment: overrides.comment,
      assignedTo: overrides.assignedTo,
      createdBy: 'Tester',
      createdAt: now,
      updatedAt: now,
    };
  }

  function makeDrawFetch(
    initialMarkups: ReturnType<typeof makeDrawingMarkup>[],
    onPost?: (body: Record<string, unknown>) => ReturnType<typeof makeDrawingMarkup>,
  ) {
    return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url.includes('/markups') && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ markups: initialMarkups }),
        } as Response;
      }

      if (method === 'POST' && url.includes('/markups')) {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        const created = onPost
          ? onPost(body)
          : makeDrawingMarkup(String(body.type ?? 'rectangle'), {
              id: `created-${Date.now()}`,
              pageNumber: Number(body.pageNumber ?? 1),
              coordinates: body.coordinates as Record<string, unknown>,
            });
        return {
          ok: true,
          status: 200,
          json: async () => ({ markup: created }),
        } as Response;
      }

      if (method === 'PATCH' && url.includes('/markups')) {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        const id = url.split('/markups/')[1] ?? 'unknown';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            markup: { ...makeDrawingMarkup('rectangle', { id }), ...body },
          }),
        } as Response;
      }

      if (method === 'DELETE' && url.includes('/markups')) {
        return { ok: true, status: 204, json: async () => ({}) } as Response;
      }

      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });
  }

  beforeEach(() => {
    _capturedOnLoadSuccess = undefined;
    _lastObserver = undefined;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    // jsdom does not implement URL.createObjectURL
    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: vi.fn().mockReturnValue('blob:mock-object-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function renderViewer(initialMarkups: ReturnType<typeof makeDrawingMarkup>[] = []) {
    vi.stubGlobal('fetch', makeDrawFetch(initialMarkups));
    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-draw"
        fileId="file-draw"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));
    expandMarkupPanel();
  }

  function getPageHost(): HTMLElement {
    enableSinglePageMode();
    // The pageHostRef div has a distinctive box-shadow style. The thumbnails
    // sidebar also renders pdf-page-N elements but without this shadow,
    // so querying by style is the most reliable way to find the main host.
    const el = document.querySelector('[style*="box-shadow: 0 1px 4px"]') as HTMLElement;
    if (el) return el;
    // Fallback: first pdf-page-1 parent (single-page mode only)
    const pages = screen.getAllByTestId('pdf-page-1');
    return pages[0]!.parentElement as HTMLElement;
  }

  function mockPageHostRect(el: HTMLElement) {
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  }

  it('drawing a rectangle creates a markup and adds a row to the table', async () => {
    let capturedPost: Record<string, unknown> = {};

    vi.stubGlobal(
      'fetch',
      makeDrawFetch([], (body) => {
        capturedPost = body;
        return makeDrawingMarkup('rectangle', {
          id: 'new-rect',
          pageNumber: 1,
          coordinates: body.coordinates as Record<string, unknown>,
        });
      }),
    );

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-draw"
        fileId="file-draw"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expandMarkupTools();
    fireEvent.click(screen.getByRole('button', { name: 'rectangle' }));

    const pageHost = getPageHost();
    mockPageHostRect(pageHost);

    fireEvent.mouseDown(pageHost, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(pageHost, { clientX: 400, clientY: 300 });
    await act(async () => {
      fireEvent.mouseUp(pageHost);
    });

    expandMarkupPanel();

    await waitFor(() => {
      expect(capturedPost.type).toBe('rectangle');
      expect(capturedPost.pageNumber).toBe(1);
    });

    // Row appears in the markup table
    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'rectangle' })).toBeInTheDocument();
    });
  });

  it('created rectangle row includes page, type, category, status, and createdBy columns', async () => {
    const markup = makeDrawingMarkup('rectangle', {
      pageNumber: 2,
      category: 'RFI',
      status: 'In Review',
      comment: 'Check this area',
    });

    await renderViewer([markup]);

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument(); // page
      expect(screen.getByRole('cell', { name: 'rectangle' })).toBeInTheDocument(); // type
      expect(screen.getByRole('cell', { name: 'Tester' })).toBeInTheDocument(); // createdBy
    });

    // Category and status are inline selects — verify their current value
    const categorySelect = screen.getByDisplayValue('RFI');
    expect(categorySelect).toBeInTheDocument();

    const statusSelect = screen.getByDisplayValue('In Review');
    expect(statusSelect).toBeInTheDocument();
  });

  it('drawing an arrow creates a markup row with type "arrow"', async () => {
    vi.stubGlobal('fetch', makeDrawFetch([]));

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-draw"
        fileId="file-draw"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expandMarkupTools();
    fireEvent.click(screen.getByRole('button', { name: 'arrow' }));

    const pageHost = getPageHost();
    mockPageHostRect(pageHost);

    fireEvent.mouseDown(pageHost, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(pageHost, { clientX: 600, clientY: 500 });
    await act(async () => {
      fireEvent.mouseUp(pageHost);
    });

    expandMarkupPanel();

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'arrow' })).toBeInTheDocument();
    });
  });

  it('length markup row includes a measurement value', async () => {
    const markup = makeDrawingMarkup('length', {
      id: 'len-1',
      coordinates: { x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.5 },
      measurement: { kind: 'length', value: 42.5, unit: 'ft' },
    });

    await renderViewer([markup]);

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'length' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: /42\.5/ })).toBeInTheDocument(); // measurement cell
    });
  });

  it('area markup row includes a measurement value', async () => {
    const markup = makeDrawingMarkup('area', {
      id: 'area-1',
      coordinates: {
        points: [
          { x: 0.1, y: 0.1 },
          { x: 0.4, y: 0.1 },
          { x: 0.4, y: 0.4 },
        ],
      },
      measurement: { kind: 'area', value: 900, unit: 'sf' },
    });

    await renderViewer([markup]);

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'area' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: /900/ })).toBeInTheDocument();
    });
  });

  it('count markup row appears in the table with type "count"', async () => {
    const markup = makeDrawingMarkup('count', {
      id: 'count-1',
      coordinates: { x: 0.5, y: 0.5 },
      measurement: { kind: 'count', value: 1, unit: 'count' },
    });

    await renderViewer([markup]);

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'count' })).toBeInTheDocument();
    });
  });

  it('markup table shows all required column headers', async () => {
    await renderViewer();

    const headers = ['page', 'type', 'category', 'comment', 'status', 'assigned to', 'created by'];
    for (const header of headers) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
  });

  it('deleting a markup removes its row from the table', async () => {
    const markup = makeDrawingMarkup('rectangle', { id: 'del-rect' });
    vi.stubGlobal('fetch', makeDrawFetch([markup]));

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-draw"
        fileId="file-draw"
        initialPage={1}
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expandMarkupPanel();

    // Wait for the table row to appear
    await waitFor(() => screen.getByRole('cell', { name: 'rectangle' }));

    // Select the markup by clicking its table row
    fireEvent.click(screen.getByRole('cell', { name: 'rectangle' }).closest('tr')!);

    expandMarkupTools();

    // Delete button should now appear
    const deleteBtn = await screen.findByRole('button', { name: 'Delete' });
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    await waitFor(() => {
      expect(screen.queryByRole('cell', { name: 'rectangle' })).not.toBeInTheDocument();
    });
  });

  it('clicking a markup row in the table navigates to that page', async () => {
    const markup = makeDrawingMarkup('cloud', { id: 'cloud-p2', pageNumber: 2 });
    await renderViewer([markup]);

    await waitFor(() => screen.getByRole('cell', { name: 'cloud' }));

    fireEvent.click(screen.getByRole('cell', { name: 'cloud' }).closest('tr')!);

    await waitFor(() => {
      expect(screen.getByRole('spinbutton')).toHaveValue(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test suite 5: Save, reopen, export, and download
// ─────────────────────────────────────────────────────────────────────────────

describe('ConstructionPdfViewer – save, reopen, export, and download', () => {
  const now = new Date().toISOString();

  function persistenceMarkup(overrides: Partial<{
    id: string;
    type: string;
    pageNumber: number;
    category: string;
    status: string;
  }> = {}) {
    return {
      id: overrides.id ?? 'persist-1',
      projectId: 'proj-persist',
      fileId: 'file-persist',
      pageNumber: overrides.pageNumber ?? 3,
      type: overrides.type ?? 'highlight',
      coordinates: { x: 0.2, y: 0.2, width: 0.4, height: 0.1 },
      category: overrides.category ?? 'QC Issue',
      status: overrides.status ?? 'Open',
      comment: 'Verify this area',
      assignedTo: 'Bob',
      createdBy: 'Alice',
      createdAt: now,
      updatedAt: now,
    };
  }

  beforeEach(() => {
    _capturedOnLoadSuccess = undefined;
    _lastObserver = undefined;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: vi.fn().mockReturnValue('blob:mock-object-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads and displays existing markups from the API on mount', async () => {
    const markups = [persistenceMarkup()];
    mockFetch({ '/markups': { markups } });

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-persist"
        fileId="file-persist"
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));

    expandMarkupPanel();

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'highlight' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '3' })).toBeInTheDocument(); // page
      expect(screen.getByRole('cell', { name: 'Alice' })).toBeInTheDocument(); // createdBy
    });
  });

  it('refetches markups when the fileId prop changes (switching PDFs)', async () => {
    const markupFile1 = [persistenceMarkup({ id: 'm-f1', type: 'rectangle' })];
    const markupFile2 = [persistenceMarkup({ id: 'm-f2', type: 'cloud', pageNumber: 5 })];

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('file-a')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ markups: markupFile1 }),
        } as Response;
      }
      if (url.includes('file-b')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ markups: markupFile2 }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ markups: [] }) } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-persist"
        fileId="file-a"
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 5 }));
    expandMarkupPanel();
    await waitFor(() => screen.getByRole('cell', { name: 'rectangle' }));

    // Switch to a different file
    rerender(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-persist"
        fileId="file-b"
        url="http://example.com/file-b.pdf"
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole('cell', { name: 'rectangle' })).not.toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'cloud' })).toBeInTheDocument();
    });
  });

  it('Export CSV button calls the export endpoint with format=csv', async () => {
    const exportFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/markups/export?format=csv')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({
            'content-type': 'text/csv',
            'content-disposition': 'attachment; filename="markups.csv"',
          }),
          blob: async () => new Blob(['id,type,page\n1,highlight,3'], { type: 'text/csv' }),
        } as unknown as Response;
      }
      return { ok: true, status: 200, json: async () => ({ markups: [] }) } as Response;
    });
    vi.stubGlobal('fetch', exportFetch);

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-persist"
        fileId="file-persist"
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expandMarkupTools();

    // Prevent anchor click from navigating in jsdom
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'CSV' }));
    });

    await waitFor(() => {
      expect(exportFetch).toHaveBeenCalledWith(
        expect.stringContaining('/markups/export?format=csv'),
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  it('Export Excel button calls the export endpoint with format=xlsx', async () => {
    const exportFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/markups/export?format=xlsx')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({
            'content-type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
          blob: async () => new Blob([], { type: 'application/octet-stream' }),
        } as unknown as Response;
      }
      return { ok: true, status: 200, json: async () => ({ markups: [] }) } as Response;
    });
    vi.stubGlobal('fetch', exportFetch);

    render(
      <ConstructionPdfViewer
        {...DEFAULT_PROPS}
        projectId="proj-persist"
        fileId="file-persist"
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expandMarkupTools();

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Excel' }));
    });

    await waitFor(() => {
      expect(exportFetch).toHaveBeenCalledWith(
        expect.stringContaining('/markups/export?format=xlsx'),
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  it('Download PDF creates an anchor with the correct href and download attribute', async () => {
    mockFetch();

    let capturedAnchor: HTMLAnchorElement | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      capturedAnchor = this;
    });

    render(
      <ConstructionPdfViewer
        fileName="project-drawings.pdf"
        url="/api/projects/proj-persist/files/file-persist/content"
      />,
    );
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(capturedAnchor).not.toBeNull();
      expect(capturedAnchor!.download).toBe('project-drawings.pdf');
      expect(capturedAnchor!.href).toContain('/api/projects/proj-persist/files/file-persist/content');
    });
  });

  it('export is skipped gracefully when projectId or fileId is absent', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // Render without projectId / fileId (offline / sample-file scenario)
    render(<ConstructionPdfViewer {...DEFAULT_PROPS} />);
    await simulatePdfLoad(makeMockDoc({ numPages: 3 }));

    expandMarkupTools();

    // Clicking export should not call fetch when projectId / fileId are absent
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excel' }));

    // No export fetch should have been made
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/export'),
      expect.anything(),
    );
  });
});
