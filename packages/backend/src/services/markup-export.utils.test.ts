import { describe, expect, it } from "vitest";
import { stampLabelFromMarkup, toMarkupExportRows } from "./markup-export.utils";

describe("markup-export.utils", () => {
  const baseMarkup = {
    pageNumber: 2,
    type: "stamp",
    coordinates: { x: 0.1, y: 0.2, width: 0.2, height: 0.08, stampLabel: "APPROVED" },
    category: "General Comment",
    comment: "APPROVED",
    status: "Open",
    createdBy: "Tester",
    createdAt: new Date("2026-06-29T12:00:00.000Z"),
    updatedAt: new Date("2026-06-29T12:00:00.000Z"),
  };

  it("extracts stamp label from coordinates", () => {
    expect(
      stampLabelFromMarkup({
        type: "stamp",
        coordinates: { stampLabel: "FOR CONSTRUCTION" },
        comment: "APPROVED",
      }),
    ).toBe("FOR CONSTRUCTION");
  });

  it("falls back to comment when coordinates stampLabel is missing", () => {
    expect(
      stampLabelFromMarkup({
        type: "stamp",
        coordinates: {},
        comment: "VOID",
      }),
    ).toBe("VOID");
  });

  it("returns empty stamp label for non-stamp markups", () => {
    expect(
      stampLabelFromMarkup({
        type: "rectangle",
        coordinates: { stampLabel: "APPROVED" },
        comment: "note",
      }),
    ).toBe("");
  });

  it("includes stampLabel column in export rows", () => {
    const [row] = toMarkupExportRows("Demo Project", "A-101.pdf", [baseMarkup]);
    expect(row.stampLabel).toBe("APPROVED");
    expect(row.markupType).toBe("stamp");
    expect(row.pageNumber).toBe(2);
  });
});
