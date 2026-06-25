import { describe, expect, it } from "vitest";
import { isLikelyGarbageText } from "./text-ranking.utils";

describe("isLikelyGarbageText", () => {
  it("keeps ordinary readable English text", () => {
    expect(
      isLikelyGarbageText(
        "The contractor shall submit shop drawings for the expansion joint assembly prior to fabrication."
      )
    ).toBe(false);
  });

  it("keeps symbol- and number-heavy but legitimate content (spec/table rows)", () => {
    expect(
      isLikelyGarbageText(
        "01 40 10 | $1,234.56 | 2025-01-02 | Rev. R02 | (914) 777-8292 | 335 Center Ave, Mamaroneck, NY 10543"
      )
    ).toBe(false);
  });

  it("keeps short strings without judging them", () => {
    expect(isLikelyGarbageText("OK")).toBe(false);
    expect(isLikelyGarbageText("Section 3.1")).toBe(false);
  });

  it("keeps a long readable paragraph that has a single stray replacement char", () => {
    const paragraph =
      "This is a perfectly readable paragraph describing the scope of work for the project, " +
      "including submittals, warranties, and quality control requirements that the contractor must follow. \uFFFD";
    expect(isLikelyGarbageText(paragraph)).toBe(false);
  });

  it("flags dense mojibake with many replacement characters", () => {
    const mojibake = "\uFFFD\uFFFDMK1\uFFFD\uFFFD\uFFFD!\uFFFD\uFFFD;\uFFFD*\uFFFD\uFFFD^D\uFFFDMd\uFFFDC2\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD";
    expect(isLikelyGarbageText(mojibake)).toBe(true);
  });

  it("flags content that is mostly non-printable bytes", () => {
    const binary = Array.from({ length: 60 }, (_, i) => String.fromCharCode(0x80 + (i % 40))).join("");
    expect(isLikelyGarbageText(binary)).toBe(true);
  });
});
