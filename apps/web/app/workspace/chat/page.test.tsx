import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatWorkspacePage from "./page";

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useSearchParams: () => new URLSearchParams("projectId=project-321"),
}));

vi.mock("@contractor/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@contractor/shared")>();
  return {
    ...actual,
    useAuthStore: () => ({
      user: {
        id: "user-1",
        email: "jane@contractor.ai",
        name: "Jane Contractor",
        orgId: "org-1",
        role: "member",
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock("framer-motion", () => {
  const passthrough = ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  );

  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: () => passthrough,
      }
    ),
  };
});

vi.mock("./ConstructionPdfViewer", () => ({
  default: () => null,
}));

function mockWorkspaceFetch(
  handlers: (url: string, method: string) => Response | Promise<Response> | null
) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/files/explorer") && method === "GET") {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          folderPath: "",
          folders: [],
          files: [],
          totalProjectFiles: 0,
          lastSyncedAt: null,
        }),
      } as Response);
    }

    const handled = handlers(url, method);
    if (handled) {
      return Promise.resolve(handled);
    }

    return Promise.reject(new Error(`Unexpected request: ${url} (${method})`));
  });
}

describe("Workspace chat interactions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockBack.mockReset();
    window.localStorage.clear();
  });

  it("shows file explorer and chat composer on load", async () => {
    vi.stubGlobal(
      "fetch",
      mockWorkspaceFetch((url, method) => {
        if (url.endsWith("/api/projects") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              projects: [{ id: "project-321", name: "North Tower" }],
            }),
          } as Response;
        }

        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ files: [] }),
          } as Response;
        }

        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ sessions: [] }),
          } as Response;
        }

        return null;
      })
    );

    render(<ChatWorkspacePage />);

    expect(await screen.findByPlaceholderText("Search files...")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ask about project documents, RFIs, submittals, schedules...")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "+ New Chat" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Project Files")).toBeInTheDocument();
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("opens cited PDFs from chat sources", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      mockWorkspaceFetch((url, method) => {
        if (url.endsWith("/api/projects") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              projects: [{ id: "project-321", name: "North Tower" }],
            }),
          } as Response;
        }

        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              files: [
                {
                  id: "file-123",
                  fileName: "spec.pdf",
                  filePath: "Project Files/spec.pdf",
                  indexStatus: "indexed",
                },
              ],
            }),
          } as Response;
        }

        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              sessions: [
                {
                  id: "session-1",
                  projectId: "project-321",
                  createdAt: "2026-05-05T10:00:00.000Z",
                },
              ],
            }),
          } as Response;
        }

        if (url.includes("/api/chat/sessions/session-1/messages") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ messages: [] }),
          } as Response;
        }

        if (url.includes("/api/chat/sessions/session-1/message") && method === "POST") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              content: "Found key expansion joint notes.",
              sources: [
                {
                  fileId: "file-123",
                  fileName: "spec.pdf",
                  relevance: 0.93,
                  suggestedPages: [27, 31],
                  bestPage: 27,
                  pageOrigin: "exact",
                },
              ],
            }),
          } as Response;
        }

        return null;
      })
    );

    render(<ChatWorkspacePage />);

    const promptBox = await screen.findByPlaceholderText(
      "Ask about project documents, RFIs, submittals, schedules..."
    );
    await user.type(promptBox, "Show me expansion joint requirements");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const citationChip = await screen.findByRole("button", {
      name: /spec\.pdf · p\. 27/i,
    });
    await user.click(citationChip);

    await waitFor(() => {
      expect(screen.getAllByText("spec.pdf").length).toBeGreaterThan(0);
    });
  });

  it("shows project-level suggested prompts when no file is open", async () => {
    vi.stubGlobal(
      "fetch",
      mockWorkspaceFetch((url, method) => {
        if (url.endsWith("/api/projects") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ projects: [{ id: "project-321", name: "North Tower" }] }),
          } as Response;
        }
        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ files: [] }),
          } as Response;
        }
        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ sessions: [] }),
          } as Response;
        }
        return null;
      })
    );

    render(<ChatWorkspacePage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Summarize the latest RFIs/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /What submittals are still pending/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Find schedule conflicts/i })).toBeInTheDocument();
    });
  });

  it("keeps suggested prompts available after sending a chat message", async () => {
    vi.stubGlobal(
      "fetch",
      mockWorkspaceFetch((url, method) => {
        if (url.endsWith("/api/projects") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ projects: [{ id: "project-321", name: "North Tower" }] }),
          } as Response;
        }
        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              files: [{ id: "file-123", fileName: "spec.pdf", filePath: "spec.pdf", indexStatus: "indexed" }],
            }),
          } as Response;
        }
        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              sessions: [{ id: "session-1", projectId: "project-321", createdAt: "2026-05-05T10:00:00.000Z" }],
            }),
          } as Response;
        }
        if (url.includes("/api/chat/sessions/session-1/messages") && method === "GET") {
          return { ok: true, status: 200, json: async () => ({ messages: [] }) } as Response;
        }
        if (url.includes("/api/chat/sessions/session-1/message") && method === "POST") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              content: "Here is what I found.",
              sources: [
                {
                  fileId: "file-123",
                  fileName: "spec.pdf",
                  relevance: 0.95,
                  suggestedPages: [1],
                  bestPage: 1,
                  pageOrigin: "exact",
                },
              ],
            }),
          } as Response;
        }
        return null;
      })
    );

    const user = userEvent.setup();
    render(<ChatWorkspacePage />);

    const promptBox = await screen.findByPlaceholderText(
      "Ask about project documents, RFIs, submittals, schedules..."
    );
    await user.type(promptBox, "Summarize the specs");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("Here is what I found.")).toBeInTheDocument();
    });
    // Suggested chips only show on an empty chat thread.
    expect(screen.queryByRole("button", { name: /Summarize the latest RFIs/i })).not.toBeInTheDocument();
  });
});
