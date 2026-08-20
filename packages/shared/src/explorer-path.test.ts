import { describe, expect, it } from "vitest";
import {
  getExplorerContainingFolderPath,
  normalizeExplorerFilePath,
  pathStartsWithSegments,
} from "./explorer-path";

describe("explorer-path", () => {
  it("strips a redundant project root segment", () => {
    expect(
      normalizeExplorerFilePath(
        "MLJ-017 Package 6 - General/05 - SUBMITTALS/Safety/swp.pdf",
        "MLJ-017 Package 6 - General"
      )
    ).toBe("05 - SUBMITTALS/Safety/swp.pdf");
  });

  it("returns the containing folder path relative to the project root", () => {
    expect(
      getExplorerContainingFolderPath(
        "MLJ-017 Package 6 - General/05 - SUBMITTALS/Safety/swp.pdf",
        "swp.pdf",
        "MLJ-017 Package 6 - General"
      )
    ).toBe("05 - SUBMITTALS/Safety");
  });

  it("matches folder prefixes segment by segment", () => {
    expect(pathStartsWithSegments(["05 - SUBMITTALS", "Safety"], ["05 - SUBMITTALS"])).toBe(true);
    expect(pathStartsWithSegments(["05 - SUBMITTALS"], ["05 - SUBMITTALS", "Safety"])).toBe(false);
  });
});
