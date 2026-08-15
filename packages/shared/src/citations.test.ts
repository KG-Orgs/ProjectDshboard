import { describe, expect, it } from "vitest";
import { buildCitationHref, parseCitationHref } from "./citations";

describe("buildCitationHref", () => {
  it("includes the page when there is one", () => {
    expect(buildCitationHref({ fileId: "file-1", page: 12 })).toBe("#citation:file-1:12");
  });

  it("omits an absent or unusable page", () => {
    expect(buildCitationHref({ fileId: "file-1" })).toBe("#citation:file-1");
    expect(buildCitationHref({ fileId: "file-1", page: 0 })).toBe("#citation:file-1");
    expect(buildCitationHref({ fileId: "file-1", page: 1.5 })).toBe("#citation:file-1");
  });
});

describe("parseCitationHref", () => {
  it("round-trips a built href", () => {
    const target = { fileId: "11111111-1111-4111-8111-111111111111", page: 4 };
    expect(parseCitationHref(buildCitationHref(target))).toEqual(target);
  });

  it("parses a page-less citation", () => {
    expect(parseCitationHref("#citation:file-1")).toEqual({ fileId: "file-1" });
  });

  it("returns null for ordinary links and malformed citations", () => {
    expect(parseCitationHref(undefined)).toBeNull();
    expect(parseCitationHref("https://example.com/doc")).toBeNull();
    expect(parseCitationHref("#section-3")).toBeNull();
    expect(parseCitationHref("#citation:")).toBeNull();
    expect(parseCitationHref("#citation:file-1:0")).toBeNull();
    expect(parseCitationHref("#citation:file-1:2:3")).toBeNull();
  });
});
