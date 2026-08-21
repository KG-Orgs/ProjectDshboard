import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/oauth", () => ({
  getAuthorizationUrl: (
    state: string,
    _scopes: unknown,
    redirectUri: string
  ) =>
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
  exchangeCodeForTokens: vi.fn(async () => ({
    idToken:
      "header." +
      Buffer.from(
        JSON.stringify({
          oid: "00000000-0000-4000-8000-000000000001",
          preferred_username: "georgegao1997@gmail.com",
          name: "George Gao",
          tid: "9188040d-6c67-4c5b-b112-36a304b66dad",
        })
      ).toString("base64url") +
      ".sig",
    refreshToken: "ms-refresh",
    expiresIn: 3600,
  })),
  refreshAccessToken: vi.fn(),
  decodeIdToken: (token: string) => {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));
  },
}));

vi.mock("../config/env", () => ({
  getEnv: () => ({
    microsoftClientId: "test-client-id",
    microsoftClientSecret: "test-client-secret",
    oauthRedirectUri: "https://contractorai-web.onrender.com/auth/callback",
  }),
  hasMicrosoftOAuthConfig: () => true,
}));

vi.mock("../db", () => ({
  getDbIfInitialized: () => null,
  authSessions: {},
  organizations: {},
  users: {},
}));

describe("authService signed OAuth state", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("survives an in-memory state wipe between login start and callback", async () => {
    const { authService } = await import("./auth.service");
    authService.resetForTests();

    const { authorizationUrl, state } = authService.getLoginUrl(
      "https://contractorai-web.onrender.com/auth/callback",
      "select_account"
    );

    expect(authorizationUrl).toContain("login.microsoftonline.com");
    expect(state).toContain(".");

    // Simulate Render free-tier restart wiping process memory.
    authService.resetForTests();

    const result = await authService.login({
      code: "oauth-code",
      state,
      redirectUri: "https://contractorai-web.onrender.com/auth/callback",
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe("georgegao1997@gmail.com");
  });
});
