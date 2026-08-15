import { describe, expect, it } from "vitest";
import { assessVisualNeed, detectLostVisualState, isSuspiciousExtraction } from "./visual-need.utils";

describe("assessVisualNeed", () => {
  it("flags a construction-photo question as visual", () => {
    const assessment = assessVisualNeed(
      "What safety measures or MPT signage are visible in the construction photos?"
    );
    expect(assessment.visualLikely).toBe(true);
    expect(assessment.visualTaskTypes).toContain("photo");
    expect(assessment.confidence).toBeGreaterThan(0.5);
    expect(assessment.reasons.length).toBeGreaterThan(0);
  });

  it("flags a drawing-dimension question and reports the drawing task type", () => {
    const assessment = assessVisualNeed(
      "What dimensions and mounting details are shown in the drawing for EL1121?"
    );
    expect(assessment.visualLikely).toBe(true);
    expect(assessment.visualTaskTypes).toContain("drawing");
  });

  it("flags a checkbox-state question", () => {
    const assessment = assessVisualNeed("Which submittal designation is selected?");
    expect(assessment.visualLikely).toBe(true);
    expect(assessment.visualTaskTypes).toContain("checkbox");
  });

  it("flags a title-block question", () => {
    const assessment = assessVisualNeed(
      "What revision and approval information appears in the title block?"
    );
    expect(assessment.visualLikely).toBe(true);
    expect(assessment.visualTaskTypes).toContain("title_block");
  });

  it("flags a progress question phrased with 'shown'", () => {
    const assessment = assessVisualNeed("What elevator and stair progress is shown?");
    expect(assessment.visualLikely).toBe(true);
  });

  it("flags an RFI asking about a dimensional discrepancy or field condition", () => {
    const assessment = assessVisualNeed(
      "What dimensional discrepancy or field condition prompted the RFI at the McDonald Avenue station?"
    );
    expect(assessment.visualLikely).toBe(true);
    expect(assessment.visualTaskTypes).toContain("drawing");
  });

  it("does not flag a plain text lookup", () => {
    const assessment = assessVisualNeed("What is the response due date for RFI-0115?");
    expect(assessment.visualLikely).toBe(false);
    expect(assessment.confidence).toBeLessThan(0.5);
  });

  it("does not flag a question that asks for verbatim specification text", () => {
    const assessment = assessVisualNeed(
      "Quote the specification section on concrete curing word-for-word"
    );
    expect(assessment.visualLikely).toBe(false);
  });

  it("does not let a lone weak signal trip the threshold", () => {
    // "schedule" and "table" are common in text questions, so one of them alone
    // must not be enough to spend a vision call.
    expect(assessVisualNeed("What is in the submittal schedule?").visualLikely).toBe(false);
  });

  it("drops the catch-all task type once a specific one is identified", () => {
    const assessment = assessVisualNeed("What is shown in the drawing?");
    expect(assessment.visualTaskTypes).toContain("drawing");
    expect(assessment.visualTaskTypes).not.toContain("other");
  });
});

describe("detectLostVisualState", () => {
  const OCR_WITHOUT_STATE = [
    "NYCT/MTA Review & Comment",
    "NYCT/MTA Approval",
    "Designer Approval",
    "NYCT/MTA Information Only",
    "Designer Information Only",
  ].join("\n");

  it("detects option labels with no indication of which is selected", () => {
    const reason = detectLostVisualState(OCR_WITHOUT_STATE);
    expect(reason).toMatch(/mutually exclusive options/);
  });

  it("stays quiet when the selection marker survived extraction", () => {
    expect(detectLostVisualState(`${OCR_WITHOUT_STATE}\n[X] NYCT/MTA Approval`)).toBeNull();
    expect(detectLostVisualState(`☑ Designer Approval\nNYCT/MTA Approval\nInformation Only`)).toBeNull();
  });

  it("stays quiet when only one option label is present", () => {
    expect(detectLostVisualState("NYCT/MTA Approval")).toBeNull();
  });

  it("stays quiet on empty text", () => {
    expect(detectLostVisualState("   ")).toBeNull();
  });
});

describe("isSuspiciousExtraction", () => {
  it("treats empty and very short text as suspicious", () => {
    expect(isSuspiciousExtraction("")).toBe(true);
    expect(isSuspiciousExtraction("EL1121")).toBe(true);
  });

  it("treats a drawing's fragmented text layer as suspicious", () => {
    const drawingLayer = Array.from({ length: 60 }, (_, index) => (index % 3 === 0 ? "A1" : "12")).join(" ");
    expect(isSuspiciousExtraction(drawingLayer)).toBe(true);
  });

  it("accepts real prose", () => {
    const prose =
      "The contractor shall provide temporary protection for all finished surfaces during the installation " +
      "of the elevator machine room equipment, and shall coordinate the delivery schedule with the resident " +
      "engineer no less than fourteen calendar days before the planned start of work in that area.";
    expect(isSuspiciousExtraction(prose)).toBe(false);
  });
});
