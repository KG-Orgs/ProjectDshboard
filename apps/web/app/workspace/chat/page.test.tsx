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
});
