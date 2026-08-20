import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "../config/env.js";
import type { RequestUserContext } from "./service-types.js";
import { onedriveService } from "./onedrive.service.js";

function testUser(id: string, email: string): RequestUserContext {
  return {
    id,
    email,
    name: email.split("@")[0] ?? "User",
    orgId: "org-1",
    orgName: "Test Org",
    role: "admin",
    onboardingCompleted: true,
  };
}

describe("onedriveService project-owner file access", () => {
  beforeEach(() => {
    onedriveService.resetForTests();
    resetEnvCache();
    vi.restoreAllMocks();
    vi.stubEnv("MICROSOFT_CLIENT_ID", "test-client");
    vi.stubEnv("MICROSOFT_CLIENT_SECRET", "test-secret");
  });

  it("uses the project owner OneDrive token when the viewer is not connected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/oauth2/v2.0/token")) {
          return new Response(
            JSON.stringify({
              access_token: "graph-access-token",
              refresh_token: "graph-refresh-token",
              expires_in: 3600,
              token_type: "Bearer",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (url.endsWith("/v1.0/me/drive?$select=id,driveType,webUrl")) {
          return new Response(
            JSON.stringify({
              id: "owner-drive-id",
              driveType: "business",
              webUrl: "https://example.sharepoint.com/drive",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (url.includes("/drives/owner-drive-id/root:/MLJ-017%20Package%206%20-%20General/QWP-001.pdf:/content")) {
          return new Response("project-owner-pdf", {
            status: 200,
            headers: { "Content-Type": "application/pdf" },
          });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      })
    );

    const owner = testUser("owner-user-id", "owner@test.com");
    const connectStart = onedriveService.getConnectUrl(owner, "http://localhost/onedrive/callback");
    await onedriveService.connect(
      {
        code: "onedrive-code",
        state: connectStart.state,
        redirectUri: "http://localhost/onedrive/callback",
      },
      owner
    );

    const viewer = testUser("viewer-user-id", "viewer@test.com");
    const content = await onedriveService.tryDownloadIndexedFileFromGraph(viewer, {
      driveId: "owner-drive-id",
      folderId: null,
      filePath: "MLJ-017 Package 6 - General/QWP-001.pdf",
      projectOwnerUserId: owner.id,
    });

    expect(content).not.toBeNull();
    expect(content?.buffer.toString()).toBe("project-owner-pdf");
    expect(content?.contentType).toBe("application/pdf");
  });

  it("returns null when neither the project owner nor viewer has OneDrive connected", async () => {
    const viewer = testUser("viewer-user-id", "viewer@test.com");
    const content = await onedriveService.tryDownloadIndexedFileFromGraph(viewer, {
      driveId: "owner-drive-id",
      folderId: null,
      filePath: "MLJ-017 Package 6 - General/QWP-001.pdf",
      projectOwnerUserId: "missing-owner-id",
    });

    expect(content).toBeNull();
  });

  it("downloads when the indexed path is missing the project folder prefix", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/oauth2/v2.0/token")) {
          return new Response(
            JSON.stringify({
              access_token: "graph-access-token",
              refresh_token: "graph-refresh-token",
              expires_in: 3600,
              token_type: "Bearer",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (url.endsWith("/v1.0/me/drive?$select=id,driveType,webUrl")) {
          return new Response(
            JSON.stringify({
              id: "owner-drive-id",
              driveType: "business",
              webUrl: "https://example.sharepoint.com/drive",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (
          url.includes(
            "/drives/owner-drive-id/root:/MLJ-017%20Package%206%20-%20General/01%2035%2010%20Construction%20Safety%20Requirements/SWP-007.pdf:/content"
          )
        ) {
          return new Response("normalized-path-pdf", {
            status: 200,
            headers: { "Content-Type": "application/pdf" },
          });
        }

        return new Response("not found", { status: 404 });
      })
    );

    const owner = testUser("owner-user-id", "owner@test.com");
    const connectStart = onedriveService.getConnectUrl(owner, "http://localhost/onedrive/callback");
    await onedriveService.connect(
      {
        code: "onedrive-code",
        state: connectStart.state,
        redirectUri: "http://localhost/onedrive/callback",
      },
      owner
    );

    const content = await onedriveService.tryDownloadIndexedFileFromGraph(undefined, {
      driveId: "owner-drive-id",
      folderId: "folder-id",
      filePath: "01 35 10 Construction Safety Requirements\\SWP-007.pdf",
      projectOwnerUserId: owner.id,
      projectRootFolderName: "MLJ-017 Package 6 - General",
    });

    expect(content?.buffer.toString()).toBe("normalized-path-pdf");
  });
});
