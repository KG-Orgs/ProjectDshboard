import { describe, expect, it } from "vitest";
import {
  classifyContentSkip,
  filterIndexableCandidates,
  isHydratedFromStat,
  prioritizeTier2Candidates,
  tagsWithoutContentSkip,
  type Tier2Candidate,
} from "./tier2-hydration.utils";

describe("tier2-hydration.utils", () => {
  it("detects OneDrive placeholders via block allocation", () => {
    expect(isHydratedFromStat(1_000_000, 0)).toBe(false);
    expect(isHydratedFromStat(1_000_000, 1_000)).toBe(false);
    expect(isHydratedFromStat(1_000_000, 2_000)).toBe(true);
    expect(isHydratedFromStat(0, 0)).toBe(false);
  });

  it("classifies skip reasons for non-indexable files", () => {
    expect(
      classifyContentSkip({
        absolutePath: "/x/file.pdf",
        fileName: "file.pdf",
        ext: "pdf",
        size: 100,
        mtime: new Date(),
        isPlaceholder: true,
      })
    ).toBe("placeholder");

    expect(
      classifyContentSkip({
        absolutePath: "/x/drawing.zip",
        fileName: "drawing.zip",
        ext: "zip",
        size: 100,
        mtime: new Date(),
        isPlaceholder: false,
      })
    ).toBe("archive");
  });

  it("filters indexable hydrated candidates", () => {
    const candidates: Tier2Candidate[] = [
      {
        absolutePath: "/a/spec.pdf",
        relativePath: "proj/spec.pdf",
        fileName: "spec.pdf",
        ext: "pdf",
        size: 50_000,
        skipReason: null,
      },
      {
        absolutePath: "/a/placeholder.pdf",
        relativePath: "proj/placeholder.pdf",
        fileName: "placeholder.pdf",
        ext: "pdf",
        size: 50_000,
        skipReason: "placeholder",
      },
    ];

    expect(filterIndexableCandidates(candidates)).toHaveLength(1);
    expect(filterIndexableCandidates(candidates)[0].fileName).toBe("spec.pdf");
  });

  it("prioritizes QWP filenames before other submittals", () => {
    const candidates: Tier2Candidate[] = [
      {
        absolutePath: "/a/cwp.pdf",
        relativePath: "proj/cwp.pdf",
        fileName: "GEN-059 CWP-022.pdf",
        ext: "pdf",
        size: 50_000,
        skipReason: null,
      },
      {
        absolutePath: "/a/qwp001.pdf",
        relativePath: "proj/qwp001.pdf",
        fileName: "GEN-019 QWP-001 Concrete.pdf",
        ext: "pdf",
        size: 50_000,
        skipReason: null,
      },
      {
        absolutePath: "/a/swp.pdf",
        relativePath: "proj/swp.pdf",
        fileName: "GEN-022 SWP-044.pdf",
        ext: "pdf",
        size: 50_000,
        skipReason: null,
      },
    ];

    expect(prioritizeTier2Candidates(candidates).map((c) => c.fileName)).toEqual([
      "GEN-019 QWP-001 Concrete.pdf",
      "GEN-022 SWP-044.pdf",
      "GEN-059 CWP-022.pdf",
    ]);
  });

  it("strips content-skipped tags on re-index", () => {
    expect(
      tagsWithoutContentSkip(["spec", "content-skipped:placeholder", "station:GEN"])
    ).toEqual(["spec", "station:GEN"]);
  });
});
