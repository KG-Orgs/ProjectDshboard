/**
 * Test suite 1: Open PDF from Project File Tree
 *
 * Verifies that a PDF can be found, clicked, and opened from the left panel
 * file tree, resulting in a tab + viewer being shown in the center panel.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatWorkspacePage from './page';

// ─── ConstructionPdfViewer mock ───────────────────────────────────────────────
// Prevent react-pdf / pdfjs from loading in jsdom and expose props for assertions.
vi.mock('./ConstructionPdfViewer', () => ({
  default: ({
    fileName,
    url,
    projectId,
    fileId,
  }: {
    fileName: string;
    url: string;
    projectId?: string | null;
    fileId?: string;
  }) => (
    <div
      data-testid="pdf-viewer"
      data-filename={fileName}
      data-url={url}
      data-projectid={projectId ?? ''}
      data-fileid={fileId ?? ''}
    >
      PDF Viewer: {fileName}
    </div>
  ),
}));

// ─── Next.js navigation mocks ─────────────────────────────────────────────────
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams('projectId=proj-tree-test'),
}));

// ─── Framer-motion mock ───────────────────────────────────────────────────────
vi.mock('framer-motion', () => {
  const passthrough = ({
    children,
    ...props
  }: {
    children?: ReactNode;
    [key: string]: unknown;
  }) => <div {...props}>{children}</div>;
  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    motion: new Proxy({}, { get: () => passthrough }),
  };
});

vi.mock('@contractor/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@contractor/shared')>();
  return {
    ...actual,
    useAuthStore: () => ({
      user: {
        id: 'user-1',
        email: 'jane@contractor.ai',
        name: 'Jane Contractor',
        orgId: 'org-1',
        role: 'member',
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }),
  };
});

async function revealFileTree(user: ReturnType<typeof userEvent.setup>) {
  const expandFiles =
    screen.getAllByRole('button', { name: 'Files' }).find((btn) => btn.classList.contains('ws-panel-expand-btn'))
    ?? screen.getAllByRole('button', { name: 'Files' })[0];
  await user.click(expandFiles);
  const folderBtn = await screen.findByRole('button', { name: /Project Files/i });
  await user.click(folderBtn);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PROJECT_ID = 'proj-tree-test';

// All files share one folder; expand Files panel and folder before interacting.
const PROJECT_FILES = [
  {
    id: 'file-pdf-001',
    fileName: 'foundation-drawings.pdf',
    filePath: 'Project Files/foundation-drawings.pdf',
    indexStatus: 'ready',
  },
  {
    id: 'file-pdf-002',
    fileName: 'structural-report.pdf',
    filePath: 'Project Files/structural-report.pdf',
    indexStatus: 'ready',
  },
  {
    id: 'file-spec-003',
    fileName: 'specifications.docx',
    filePath: 'Project Files/specifications.docx',
    indexStatus: 'ready',
  },
];

// ─── Fetch helper ─────────────────────────────────────────────────────────────
function makeFetch(extraRoutes: Record<string, object> = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';

    for (const [pattern, body] of Object.entries(extraRoutes)) {
      if (url.includes(pattern)) {
        return { ok: true, status: 200, json: async () => body } as Response;
      }
    }

    // File list for the left panel
    if (
      url.includes(`/api/projects/${PROJECT_ID}/files`) &&
      url.includes('pageSize=300') &&
      method === 'GET'
    ) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ files: PROJECT_FILES }),
      } as Response;
    }

    // Project list (for name resolution + inferredProjectId)
    if (url.endsWith('/api/projects') && method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          projects: [{ id: PROJECT_ID, name: 'North Tower Retrofit' }],
        }),
      } as Response;
    }

    // Chat sessions (empty – not under test)
    if (url.includes('/api/chat/sessions') && method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ sessions: [] }),
      } as Response;
    }

    return { ok: true, status: 200, json: async () => ({}) } as Response;
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Open PDF from project file tree', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockBack.mockReset();
    window.localStorage.clear();
  });

  it('lists PDF files from the project in the left file explorer panel', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', makeFetch());

    render(<ChatWorkspacePage />);
    await revealFileTree(user);

    await waitFor(() => {
      expect(screen.getByText('foundation-drawings.pdf')).toBeInTheDocument();
      expect(screen.getByText('structural-report.pdf')).toBeInTheDocument();
    });
  });

  it('also lists non-PDF project files alongside PDFs', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', makeFetch());

    render(<ChatWorkspacePage />);
    await revealFileTree(user);

    await waitFor(() => {
      expect(screen.getByText('specifications.docx')).toBeInTheDocument();
    });
  });

  it('opens a viewer tab when a PDF file is clicked', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', makeFetch());

    render(<ChatWorkspacePage />);
    await revealFileTree(user);

    // Wait for file tree to load
    const fileBtn = await screen.findByRole('button', { name: /foundation-drawings\.pdf/i });
    await user.click(fileBtn);

    // The center panel tab strip should contain the file name
    await waitFor(() => {
      const tabs = screen.getAllByText('foundation-drawings.pdf');
      // At least two occurrences: one in the tree, one in the doc tab
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders ConstructionPdfViewer with the selected file name', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', makeFetch());

    render(<ChatWorkspacePage />);
    await revealFileTree(user);

    await screen.findByText('foundation-drawings.pdf');
    await user.click(screen.getByRole('button', { name: /foundation-drawings\.pdf/i }));

    await waitFor(() => {
      const viewer = screen.getByTestId('pdf-viewer');
      expect(viewer).toBeInTheDocument();
      expect(viewer).toHaveAttribute('data-filename', 'foundation-drawings.pdf');
    });
  });

  it('passes the correct content URL (projectId + fileId) to the viewer', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', makeFetch());

    render(<ChatWorkspacePage />);
    await revealFileTree(user);

    await screen.findByText('foundation-drawings.pdf');
    await user.click(screen.getByRole('button', { name: /foundation-drawings\.pdf/i }));

    await waitFor(() => {
      const viewer = screen.getByTestId('pdf-viewer');
      expect(viewer).toHaveAttribute(
        'data-url',
        `/api/projects/${PROJECT_ID}/files/file-pdf-001/content`,
      );
    });
  });

  it('marks the clicked file row as active in the file tree', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', makeFetch());

    render(<ChatWorkspacePage />);
    await revealFileTree(user);

    const fileBtn = await screen.findByRole('button', { name: /foundation-drawings\.pdf/i });
    await user.click(fileBtn);

    await waitFor(() => {
      expect(fileBtn).toHaveClass('active');
    });
  });

  it('switching between PDF files updates the active tab and viewer', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', makeFetch());

    render(<ChatWorkspacePage />);
    await revealFileTree(user);

    // Open first PDF via the file tree button
    const btn1 = await screen.findByRole('button', { name: /foundation-drawings\.pdf/i });
    await user.click(btn1);
    await waitFor(() =>
      expect(screen.getByTestId('pdf-viewer')).toHaveAttribute(
        'data-filename',
        'foundation-drawings.pdf',
      ),
    );

    // Open second PDF — after the first open there may be a tab button too;
    // use getAllByRole and pick the file-tree entry (class file-row-btn).
    const allBtn2 = screen.getAllByRole('button', { name: /structural-report\.pdf/i });
    const treeBtn2 = allBtn2.find((b) => b.classList.contains('file-row-btn')) ?? allBtn2[0]!;
    await user.click(treeBtn2);
    await waitFor(() =>
      expect(screen.getByTestId('pdf-viewer')).toHaveAttribute(
        'data-filename',
        'structural-report.pdf',
      ),
    );
  });
});
