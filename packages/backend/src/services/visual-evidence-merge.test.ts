/**
 * Steps 6–8: how visual evidence reaches the extractor, how a visual claim is
 * cited, and how the completeness logic refuses when it could not be verified.
 */
import { describe, expect, it } from "vitest";
import type { VisualFallbackTrace } from "@contractor/shared";
import {
  buildEvidenceExtractorUserMessage,
  buildNoExactEvidenceContent,
  coerceExtractedAnswer,
  renderExtractedAnswerMarkdown,
  type ExtractorEvidenceItem,
} from "./chat-coordinator.service";
import { assessVisualNeed } from "./visual-need.utils";

const TEXT_ITEM: ExtractorEvidenceItem = {
  id: "c1",
  documentId: "MTACD-MLJTC2-L-0024",
  documentName: "MTACD-MLJTC2-L-0024",
  fileId: "11111111-1111-1111-1111-111111111111",
  fileName: "MTACD-MLJTC2-L-0024R00.pdf",
  page: 1,
  text: "NYCT/MTA Review & Comment\nNYCT/MTA Approval\nDesigner Approval",
};

const VISUAL_ITEM: ExtractorEvidenceItem = {
  id: "v1",
  documentId: "MTACD-MLJTC2-L-0024",
  documentName: "MTACD-MLJTC2-L-0024",
  fileId: "11111111-1111-1111-1111-111111111111",
  fileName: "MTACD-MLJTC2-L-0024R00.pdf",
  page: 1,
  text: "Selected designation: NYCT/MTA Approval [seen: ticked box, upper right]",
  evidenceType: "visual",
  confidence: 0.92,
};

function evidenceMap(items: ExtractorEvidenceItem[]): Map<string, ExtractorEvidenceItem> {
  return new Map(items.map((item) => [item.id, item]));
}

describe("buildEvidenceExtractorUserMessage", () => {
  it("keeps a single Evidence block when there is no visual evidence", () => {
    const message = buildEvidenceExtractorUserMessage("Which designation applies?", [TEXT_ITEM]);
    expect(message).toContain("Evidence:");
    expect(message).not.toContain("VISUAL EVIDENCE");
  });

  it("splits text and visual evidence into labelled blocks", () => {
    const message = buildEvidenceExtractorUserMessage("Which designation is selected?", [
      TEXT_ITEM,
      VISUAL_ITEM,
    ]);
    expect(message).toContain("TEXT EVIDENCE");
    expect(message).toContain("VISUAL EVIDENCE");
    expect(message.indexOf("TEXT EVIDENCE")).toBeLessThan(message.indexOf("VISUAL EVIDENCE"));
    // Visual items keep page provenance and carry their reported confidence.
    expect(message).toContain("[v1]");
    expect(message).toContain("page=1");
    expect(message).toContain("confidence=0.92");
  });

  it("says so explicitly when only visual evidence survived", () => {
    const message = buildEvidenceExtractorUserMessage("What is shown?", [VISUAL_ITEM]);
    expect(message).toContain("(no text passage contained the requested information)");
    expect(message).toContain("VISUAL EVIDENCE");
  });
});

describe("coerceExtractedAnswer with visual evidence", () => {
  it("tags each citation with the provenance kind of the evidence we supplied", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "complete",
        title: "Submittal designation",
        items: [{ label: "Selected", value: "NYCT/MTA Approval", citation_ids: ["v1"] }],
        citations: [
          { id: "v1", evidence_text: "ticked box beside NYCT/MTA Approval" },
          { id: "c1", evidence_text: "printed option list" },
        ],
      },
      evidenceMap([TEXT_ITEM, VISUAL_ITEM])
    );

    const visual = answer!.citations.find((citation) => citation.id === "v1")!;
    const text = answer!.citations.find((citation) => citation.id === "c1")!;
    expect(visual.evidenceType).toBe("visual");
    expect(text.evidenceType).toBe("text");
    // Visual claims keep document + page so they deep-link like any other citation.
    expect(visual.fileId).toBe("11111111-1111-1111-1111-111111111111");
    expect(visual.page).toBe(1);
  });

  it("cannot be told by the model that a text passage was visual", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "complete",
        title: "T",
        items: [{ label: "x", value: "y", citation_ids: ["c1"] }],
        citations: [{ id: "c1", evidence_text: "e", evidence_type: "visual" }],
      },
      evidenceMap([TEXT_ITEM])
    );
    expect(answer!.citations[0].evidenceType).toBe("text");
  });

  it("carries reported text-vs-visual conflicts through", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "partial",
        title: "Submittal designation",
        items: [],
        citations: [],
        conflicts: [
          {
            field: "Selected designation",
            text_value: "Designer Approval",
            visual_value: "NYCT/MTA Approval",
            citation_ids: ["c1", "v1"],
          },
        ],
      },
      evidenceMap([TEXT_ITEM, VISUAL_ITEM])
    );

    expect(answer!.conflicts).toHaveLength(1);
    expect(answer!.conflicts![0]).toMatchObject({
      field: "Selected designation",
      textValue: "Designer Approval",
      visualValue: "NYCT/MTA Approval",
      citationIds: ["c1", "v1"],
    });
  });

  it("drops malformed conflicts and unknown citation ids inside them", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "partial",
        title: "T",
        items: [],
        citations: [],
        conflicts: [
          { field: "Missing sides" },
          { field: "Real", text_value: "a", visual_value: "b", citation_ids: ["ghost"] },
        ],
      },
      evidenceMap([TEXT_ITEM, VISUAL_ITEM])
    );

    expect(answer!.conflicts).toHaveLength(1);
    expect(answer!.conflicts![0].field).toBe("Real");
    expect(answer!.conflicts![0].citationIds).toBeUndefined();
  });
});

describe("renderExtractedAnswerMarkdown with visual evidence", () => {
  it("states a conflict rather than picking a side", () => {
    const markdown = renderExtractedAnswerMarkdown({
      status: "partial",
      title: "Submittal designation",
      items: [],
      citations: [],
      conflicts: [
        {
          field: "Selected designation",
          textValue: "Designer Approval",
          visualValue: "NYCT/MTA Approval",
        },
      ],
    });

    expect(markdown).toContain("Conflict — Selected designation");
    expect(markdown).toContain("Designer Approval");
    expect(markdown).toContain("NYCT/MTA Approval");
    expect(markdown).toMatch(/have not picked a side/);
  });

  it("says which pages were inspected when a visual not_found is returned", () => {
    const markdown = renderExtractedAnswerMarkdown({
      status: "not_found",
      title: "Dimensions",
      items: [],
      citations: [],
      visualFallback: {
        assessment: assessVisualNeed("What dimensions are shown in the drawing?"),
        triggered: true,
        triggerReason: "text did not contain the answer and the question is likely visual (drawing)",
        pagesSelected: [4, 5],
        pagesInspected: [4, 5],
        evidence: [],
        noEvidence: true,
      },
    });

    expect(markdown).toMatch(/p\. 4, p\. 5/);
    expect(markdown).toMatch(/could not be verified/);
  });

  it("says inspection was unavailable when rendering failed", () => {
    const markdown = renderExtractedAnswerMarkdown({
      status: "not_found",
      title: "Dimensions",
      items: [],
      citations: [],
      visualFallback: {
        assessment: assessVisualNeed("What dimensions are shown in the drawing?"),
        triggered: true,
        triggerReason: "likely visual",
        pagesSelected: [4],
        pagesInspected: [],
        evidence: [],
        failureReason: "page rendering is unavailable in this environment",
      },
    });

    expect(markdown).toMatch(/could not be inspected visually/);
    expect(markdown).toContain("page rendering is unavailable in this environment");
  });

  it("keeps the plain refusal for a question that is not visual", () => {
    const markdown = renderExtractedAnswerMarkdown({
      status: "not_found",
      title: "Due date",
      items: [],
      citations: [],
      visualFallback: {
        assessment: assessVisualNeed("What is the response due date?"),
        triggered: false,
        triggerReason: "question is not likely visual (confidence 0.00)",
        pagesSelected: [],
        pagesInspected: [],
        evidence: [],
      },
    });

    expect(markdown).toContain("not present in the available evidence");
  });
});

describe("buildNoExactEvidenceContent completeness logic", () => {
  const visualAssessment = assessVisualNeed(
    "What safety measures are visible in the construction photos?"
  );

  function trace(overrides: Partial<VisualFallbackTrace>): VisualFallbackTrace {
    return {
      assessment: visualAssessment,
      triggered: false,
      triggerReason: "",
      pagesSelected: [],
      pagesInspected: [],
      evidence: [],
      ...overrides,
    };
  }

  it("never blames OCR alone on a visual question — it names the pages inspected", () => {
    const content = buildNoExactEvidenceContent(
      "daily-report.pdf",
      trace({ triggered: true, pagesSelected: [2, 3], pagesInspected: [2, 3] })
    );
    expect(content).toMatch(/page 2, page 3/);
    expect(content).not.toMatch(/exact indexed passage/);
  });

  it("reports that visual inspection was unavailable when the stage could not run", () => {
    const content = buildNoExactEvidenceContent(
      "daily-report.pdf",
      trace({ triggered: true, failureReason: "source_unavailable: file bytes not reachable" })
    );
    expect(content).toMatch(/could not be inspected visually/);
    expect(content).toContain("source_unavailable: file bytes not reachable");
  });

  it("still acknowledges a visual question when the stage never triggered", () => {
    const content = buildNoExactEvidenceContent("daily-report.pdf", trace({ triggered: false }));
    expect(content).toMatch(/available visual inspection/);
  });

  it("keeps the original refusal wording when no visual trace exists", () => {
    expect(buildNoExactEvidenceContent("spec-033000.pdf")).toMatch(/exact indexed passage/);
  });
});
