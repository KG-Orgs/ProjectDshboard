import { describe, expect, it } from "vitest";
import { isInviteOnlyAuth, isPlatformOperatorEmail, parsePlatformOperatorEmails } from "./platform";

describe("platform operator helpers", () => {
  it("parses operator emails", () => {
    expect(parsePlatformOperatorEmails("Kyle@Example.com, other@test.com")).toEqual([
      "kyle@example.com",
      "other@test.com",
    ]);
  });

  it("detects platform operators", () => {
    const operators = ["kyle.xu4@gmail.com"];
    expect(isPlatformOperatorEmail("kyle.xu4@gmail.com", operators)).toBe(true);
    expect(isPlatformOperatorEmail("other@example.com", operators)).toBe(false);
  });

  it("treats empty operator list as open auth", () => {
    expect(isInviteOnlyAuth([])).toBe(false);
    expect(isInviteOnlyAuth(["kyle.xu4@gmail.com"])).toBe(true);
  });
});
