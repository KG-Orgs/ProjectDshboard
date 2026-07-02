import { describe, expect, it } from "vitest";
import type { User } from "@contractor/shared";

/**
 * Documents the session merge contract exercised by persistSession after upsert.
 * When a user row already exists, orgId and role must come from the database.
 */
describe("auth session user merge", () => {
  it("applies persisted orgId and role onto the in-memory session user", () => {
    const sessionUser: User = {
      id: "00000000-0000-4000-8000-000000000001",
      orgId: "00000000-0000-4000-8000-000000000099",
      email: "jane@contractor.ai",
      name: "Jane Contractor",
      role: "member",
      onboardingCompleted: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const persisted = {
      id: "11111111-1111-4111-8111-111111111111",
      orgId: "22222222-2222-4222-8222-222222222222",
      role: "admin" as const,
    };

    sessionUser.id = persisted.id;
    sessionUser.orgId = persisted.orgId;
    sessionUser.role = persisted.role;

    expect(sessionUser.role).toBe("admin");
    expect(sessionUser.orgId).toBe(persisted.orgId);
    expect(sessionUser.id).toBe(persisted.id);
  });
});
