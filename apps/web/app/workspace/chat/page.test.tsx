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

describe("Workspace chat interactions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockBack.mockReset();
    window.localStorage.clear();
  });

  it("opens cited PDFs with panels collapsed by default", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.endsWith("/api/projects") && method === "GET") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            projects: [{ id: "project-321", name: "North Tower" }],
          }),
        });
      }

      if (url.includes("/api/projects/project-321/files") && method === "GET") {
        return Promise.resolve({
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
        });
      }

      if (url.endsWith("/api/chat/sessions") && method === "GET") {
        return Promise.resolve({
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
        });
      }

      if (url.includes("/api/chat/sessions/session-1/messages") && method === "GET") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ messages: [] }),
        });
      }

      if (url.includes("/api/chat/sessions/session-1/message") && method === "POST") {
        return Promise.resolve({
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
        });
      }

      return Promise.reject(new Error(`Unexpected request: ${url} (${method})`));
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ChatWorkspacePage />);

    expect(screen.queryByPlaceholderText("Search in document")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tour/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Files" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Chat" }).length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText("Ask about drawings, specs, RFIs...")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Chat" })[0]);

    const promptBox = await screen.findByPlaceholderText("Ask about drawings, specs, RFIs...");
    await user.type(promptBox, "Show me expansion joint requirements");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const citationChip = await screen.findByRole("button", {
      name: /spec\.pdf · p\. 27/i,
    });
    await user.click(citationChip);

    await waitFor(() => {
      expect(screen.getAllByText("spec.pdf").length).toBeGreaterThan(0);
    });
  });

  it("keeps conversation controls in the header, not inside the chat panel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.endsWith("/api/projects") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              projects: [{ id: "project-321", name: "North Tower" }],
            }),
          });
        }

        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ files: [] }),
          });
        }

        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              sessions: [
                {
                  id: "session-1",
                  projectId: "project-321",
                  title: "RFI follow-up",
                  pinned: false,
                  createdAt: "2026-05-05T10:00:00.000Z",
                  updatedAt: "2026-05-05T12:00:00.000Z",
                },
              ],
            }),
          });
        }

        if (url.includes("/api/chat/sessions/session-1/messages") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ messages: [] }),
          });
        }

        return Promise.reject(new Error(`Unexpected request: ${url} (${method})`));
      })
    );

    const user = userEvent.setup();
    render(<ChatWorkspacePage />);

    expect(screen.getByRole("button", { name: "Chat history" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New chat" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open conversation history" })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Chat" })[0]);

    expect(screen.getByPlaceholderText("Ask about drawings, specs, RFIs...")).toBeInTheDocument();
    expect(screen.queryByText("Conversations")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search (Ctrl+/)")).not.toBeInTheDocument();
  });

  it("expands the files panel when the vertical Files control is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.endsWith("/api/projects") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              projects: [{ id: "project-321", name: "North Tower" }],
            }),
          });
        }

        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ files: [] }),
          });
        }

        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ sessions: [] }),
          });
        }

        return Promise.reject(new Error(`Unexpected request: ${url} (${method})`));
      })
    );

    const user = userEvent.setup();
    render(<ChatWorkspacePage />);

    await user.click(screen.getAllByRole("button", { name: "Files" })[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Filter files...")).toBeInTheDocument();
    });
  });

  it("shows project-level suggested prompts when no file is open", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.endsWith("/api/projects") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ projects: [{ id: "project-321", name: "North Tower" }] }),
          });
        }
        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ files: [] }),
          });
        }
        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ sessions: [] }),
          });
        }

        return Promise.reject(new Error(`Unexpected request: ${url} (${method})`));
      })
    );

    const user = userEvent.setup();
    render(<ChatWorkspacePage />);
    await user.click(screen.getAllByRole("button", { name: "Chat" })[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "View Open Issues Matrix" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Review Latest Schedule Update" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "View Latest Cost Report" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create a Submittal Cover Page" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Summarize This File" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask Questions About This File" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Edits to This File" })).not.toBeInTheDocument();
  });

  it("switches to file-specific prompts when a document is opened via AI response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.endsWith("/api/projects") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ projects: [{ id: "project-321", name: "North Tower" }] }),
          });
        }
        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              files: [{ id: "file-123", fileName: "spec.pdf", filePath: "spec.pdf", indexStatus: "indexed" }],
            }),
          });
        }
        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              sessions: [{ id: "session-1", projectId: "project-321", createdAt: "2026-05-05T10:00:00.000Z" }],
            }),
          });
        }
        if (url.includes("/api/chat/sessions/session-1/messages") && method === "GET") {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ messages: [] }) });
        }
        if (url.includes("/api/chat/sessions/session-1/message") && method === "POST") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              content: "Here is what I found.",
              sources: [
                { fileId: "file-123", fileName: "spec.pdf", relevance: 0.95, suggestedPages: [1], bestPage: 1, pageOrigin: "exact" },
              ],
            }),
          });
        }

        return Promise.reject(new Error(`Unexpected request: ${url} (${method})`));
      })
    );

    const user = userEvent.setup();
    render(<ChatWorkspacePage />);
    await user.click(screen.getAllByRole("button", { name: "Chat" })[0]);

    // Project prompts are visible before any file opens
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "View Open Issues Matrix" })).toBeInTheDocument();
    });

    // Send a message; AI response includes a source which auto-opens the file
    const promptBox = screen.getByPlaceholderText("Ask about drawings, specs, RFIs...");
    await user.type(promptBox, "Summarize the specs");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    // File-specific prompts should replace the project prompts
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Summarize This File" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ask Questions About This File" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Make Edits to This File" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "View Open Issues Matrix" })).not.toBeInTheDocument();
  });

  it("reverts to project prompts when the active file tab is closed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.endsWith("/api/projects") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ projects: [{ id: "project-321", name: "North Tower" }] }),
          });
        }
        if (url.includes("/api/projects/project-321/files") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              files: [{ id: "file-123", fileName: "spec.pdf", filePath: "spec.pdf", indexStatus: "indexed" }],
            }),
          });
        }
        if (url.endsWith("/api/chat/sessions") && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              sessions: [{ id: "session-1", projectId: "project-321", createdAt: "2026-05-05T10:00:00.000Z" }],
            }),
          });
        }
        if (url.includes("/api/chat/sessions/session-1/messages") && method === "GET") {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ messages: [] }) });
        }
        if (url.includes("/api/chat/sessions/session-1/message") && method === "POST") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              content: "Here is what I found.",
              sources: [
                { fileId: "file-123", fileName: "spec.pdf", relevance: 0.95, suggestedPages: [1], bestPage: 1, pageOrigin: "exact" },
              ],
            }),
          });
        }

        return Promise.reject(new Error(`Unexpected request: ${url} (${method})`));
      })
    );

    const user = userEvent.setup();
    render(<ChatWorkspacePage />);
    await user.click(screen.getAllByRole("button", { name: "Chat" })[0]);

    // Send a message to open a file
    const promptBox = screen.getByPlaceholderText("Ask about drawings, specs, RFIs...");
    await user.type(promptBox, "Summarize the specs");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    // Wait for file-specific prompts to appear
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Summarize This File" })).toBeInTheDocument();
    });

    // Close the open file tab
    await user.click(screen.getByRole("button", { name: "Close spec.pdf" }));

    // Project prompts should be restored
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "View Open Issues Matrix" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Summarize This File" })).not.toBeInTheDocument();
    });
  });
});
