import { describe, expect, it } from "vitest";
import { isOrgPowerUser } from "./roles";

describe("isOrgPowerUser", () => {
  it("returns true for super and admin", () => {
    expect(isOrgPowerUser("super")).toBe(true);
    expect(isOrgPowerUser("admin")).toBe(true);
  });

  it("returns false for pm and member", () => {
    expect(isOrgPowerUser("pm")).toBe(false);
    expect(isOrgPowerUser("member")).toBe(false);
    expect(isOrgPowerUser(undefined)).toBe(false);
  });
});
