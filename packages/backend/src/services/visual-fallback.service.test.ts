import { describe, expect, it } from "vitest";
import type { VisualEvidence } from "@contractor/shared";
import {
  buildVisionPrompt,
  detectSelectionConflicts,
  extractOptionSet,
  parseVisualEvidence,
  selectCandidatePages,
  shouldTriggerVisualFallback,
  visualEvidenceToEvidenceItems,
  type VisualCandidateChunk,
} from "./visual-fallback.service";
import { assessVisualNeed } from "./visual-need.utils";

const VISUAL_ASSESSMENT = assessVisualNeed("What dimensions are shown in the drawing?");
const TEXT_ASSESSMENT = assessVisualNeed("What is the response due date?");

const SPARSE_DRAWING_TEXT: VisualCandidateChunk[] = [
  { page: 4, text: "EL1121 EL1122 A1 12 3 4 SHEET", score: 2 },
];

const RICH_TEXT: VisualCandidateChunk[] = [
  {
    page: 2,
    text:
      "The contractor shall submit shop drawings for the elevator machine room within thirty calendar days " +
      "of notice to proceed, and shall include mounting details, anchor schedules, and coordination drawings " +
      "for review by the engineer before fabrication begins on any component of the assembly.",
    score: 8,
  },
];

describe("shouldTriggerVisualFallback", () => {
  it("triggers when the document is locked, text lacks the answer, and the question is visual", () => {
    const decision = shouldTriggerVisualFallback({
      assessment: VISUAL_ASSESSMENT,
      textStatus: "not_found",
      textEvidence: SPARSE_DRAWING_TEXT,
      documentLocked: true,
      renderable: true,
    });
    expect(decision.trigger).toBe(true);
    expect(decision.reason).toMatch(/likely visual/);
  });

  it("triggers on a partial text answer for a visual question", () => {
    expect(
      shouldTriggerVisualFallback({
        assessment: VISUAL_ASSESSMENT,
        textStatus: "partial",
        textEvidence: RICH_TEXT,
        documentLocked: true,
        renderable: true,
      }).trigger
    ).toBe(true);
  });

  it("does not trigger before the document is locked", () => {
    const decision = shouldTriggerVisualFallback({
      assessment: VISUAL_ASSESSMENT,
      textStatus: "not_found",
      textEvidence: SPARSE_DRAWING_TEXT,
      documentLocked: false,
      renderable: true,
    });
    expect(decision.trigger).toBe(false);
    expect(decision.reason).toMatch(/not locked/);
  });

  it("does not trigger on a source mismatch", () => {
    expect(
      shouldTriggerVisualFallback({
        assessment: VISUAL_ASSESSMENT,
        textStatus: "source_mismatch",
        textEvidence: SPARSE_DRAWING_TEXT,
        documentLocked: true,
        renderable: true,
      }).trigger
    ).toBe(false);
  });

  it("does not trigger when the text answer is already complete", () => {
    const decision = shouldTriggerVisualFallback({
      assessment: VISUAL_ASSESSMENT,
      textStatus: "complete",
      textEvidence: RICH_TEXT,
      documentLocked: true,
      renderable: true,
    });
    expect(decision.trigger).toBe(false);
    expect(decision.reason).toMatch(/already answered/);
  });

  it("does not trigger for a non-visual question even when text is missing", () => {
    const decision = shouldTriggerVisualFallback({
      assessment: TEXT_ASSESSMENT,
      textStatus: "not_found",
      textEvidence: SPARSE_DRAWING_TEXT,
      documentLocked: true,
      renderable: true,
    });
    expect(decision.trigger).toBe(false);
    expect(decision.reason).toMatch(/not likely visual/);
  });

  it("does not trigger when the locked document cannot be rendered", () => {
    expect(
      shouldTriggerVisualFallback({
        assessment: VISUAL_ASSESSMENT,
        textStatus: "not_found",
        textEvidence: SPARSE_DRAWING_TEXT,
        documentLocked: true,
        renderable: false,
      }).trigger
    ).toBe(false);
  });

  it("triggers on lost visual state even when the question reads as a text lookup", () => {
    const decision = shouldTriggerVisualFallback({
      assessment: assessVisualNeed("Which submittal designation applies to this transmittal?"),
      textStatus: "not_found",
      textEvidence: [
        {
          page: 1,
          text: [
            "NYCT/MTA Review & Comment",
            "NYCT/MTA Approval",
            "Designer Approval",
            "NYCT/MTA Information Only",
          ].join("\n"),
        },
      ],
      documentLocked: true,
      renderable: true,
    });
    expect(decision.trigger).toBe(true);
    expect(decision.reason).toMatch(/visual state lost/);
  });
});

describe("selectCandidatePages", () => {
  it("prefers pages the text answer already cited", () => {
    const selection = selectCandidatePages({
      textEvidence: [{ page: 9, text: "x", score: 10 }],
      citedPages: [4],
      visualTaskTypes: ["drawing"],
      pageCount: 20,
      maxPages: 3,
    });
    expect(selection.pages[0]).toBe(4);
    expect(selection.reasons[0]).toMatch(/cited by the text answer/);
  });

  it("falls back to the pages of the top-ranked chunks, highest score first", () => {
    const selection = selectCandidatePages({
      textEvidence: [
        { page: 12, text: "x", score: 1 },
        { page: 7, text: "x", score: 9 },
      ],
      visualTaskTypes: ["drawing"],
      pageCount: 20,
      maxPages: 2,
    });
    expect(selection.pages).toEqual([7, 12]);
  });

  it("adds page 1 for a title-block or checkbox task", () => {
    const selection = selectCandidatePages({
      textEvidence: [{ page: 5, text: "x", score: 3 }],
      visualTaskTypes: ["checkbox"],
      pageCount: 10,
      maxPages: 3,
    });
    expect(selection.pages).toContain(1);
  });

  it("never exceeds maxPages", () => {
    const selection = selectCandidatePages({
      textEvidence: [1, 2, 3, 4, 5, 6, 7].map((page) => ({ page, text: "x", score: page })),
      visualTaskTypes: ["drawing"],
      pageCount: 40,
      maxPages: 3,
    });
    expect(selection.pages).toHaveLength(3);
  });

  it("inspects every page of a short document when no page signal exists", () => {
    const selection = selectCandidatePages({
      textEvidence: [{ text: "no page metadata", score: 1 }],
      visualTaskTypes: ["photo"],
      pageCount: 3,
      maxPages: 5,
    });
    expect(selection.pages).toEqual([1, 2, 3]);
  });

  it("samples past the cover sheet of a long photo log, spread across the document", () => {
    const selection = selectCandidatePages({
      textEvidence: [{ text: "no page metadata", score: 1 }],
      visualTaskTypes: ["photo"],
      pageCount: 27,
      maxPages: 3,
    });
    // Page 1 of a construction submittal is the transmittal cover, never a photo.
    expect(selection.pages).not.toContain(1);
    expect(selection.pages).toHaveLength(3);
    expect(selection.pages[0]).toBe(2);
    // Spread, not three consecutive pages off the front.
    expect(selection.pages[2]).toBeGreaterThan(10);
    expect(selection.reasons[0]).toMatch(/past the cover sheet/);
  });

  it("still starts at page 1 for a title-block task, where the cover IS the target", () => {
    const selection = selectCandidatePages({
      textEvidence: [{ text: "no page metadata", score: 1 }],
      visualTaskTypes: ["title_block"],
      pageCount: 27,
      maxPages: 3,
    });
    expect(selection.pages).toEqual([1]);
  });

  it("falls back to page 1 when even the page count is unknown", () => {
    const selection = selectCandidatePages({
      textEvidence: [{ text: "no page metadata", score: 1 }],
      visualTaskTypes: ["photo"],
      pageCount: null,
      maxPages: 3,
    });
    expect(selection.pages).toEqual([1]);
  });

  it("drops page hints beyond the document's page count", () => {
    const selection = selectCandidatePages({
      textEvidence: [{ page: 99, text: "x", score: 5 }],
      visualTaskTypes: ["drawing"],
      pageCount: 4,
      maxPages: 3,
    });
    expect(selection.pages).not.toContain(99);
  });
});

describe("buildVisionPrompt", () => {
  const OCR_OPTIONS = [
    "NYCT/MTA Review & Comment",
    "NYCT/MTA Approval",
    "Designer Approval",
    "NYCT/MTA Information Only",
  ].join("\n");

  it("gives the model the question, document identity, page, and the option set for a checkbox task", () => {
    const prompt = buildVisionPrompt({
      question: "Which submittal designation is selected?",
      documentAlias: "MTACD-MLJTC2-L-0024",
      fileName: "MTACD-MLJTC2-L-0024R00.pdf",
      page: 1,
      visualTaskTypes: ["checkbox"],
      textEvidence: [{ page: 1, text: OCR_OPTIONS }],
    });

    expect(prompt).toContain("Which submittal designation is selected?");
    expect(prompt).toContain("MTACD-MLJTC2-L-0024");
    expect(prompt).toContain("Page: 1");
    expect(prompt).toContain("NYCT/MTA Approval");
    expect(prompt).toContain("visibly selected");
    expect(prompt).toContain("NOT_VISIBLE");
    expect(prompt).toMatch(/does NOT mean an option is selected/);
    expect(prompt).toMatch(/Do not infer the selection from the document filename/);
  });

  it("tells a photo task not to infer invisible work", () => {
    const prompt = buildVisionPrompt({
      question: "What safety measures are visible in the construction photos?",
      documentAlias: "Daily Report 2026-01-14",
      fileName: "daily-report-2026-01-14.pdf",
      page: 2,
      visualTaskTypes: ["photo"],
      textEvidence: [],
    });
    expect(prompt).toMatch(/Do not infer work that is not visible/);
  });

  it("forbids scale-based estimation on a drawing task", () => {
    const prompt = buildVisionPrompt({
      question: "What dimensions are shown for EL1121?",
      documentAlias: "EL-1121",
      fileName: "EL1121.pdf",
      page: 4,
      visualTaskTypes: ["drawing"],
      textEvidence: [],
    });
    expect(prompt).toMatch(/Preserve units exactly/);
    expect(prompt).toMatch(/Do not estimate any dimension from the drawing scale/);
  });
});

describe("extractOptionSet", () => {
  it("harvests submittal designation options from OCR text", () => {
    const options = extractOptionSet([
      {
        page: 1,
        text: [
          "TRANSMITTAL",
          "NYCT/MTA Review & Comment",
          "NYCT/MTA Approval",
          "Designer Approval",
          "NYCT/MTA Information Only",
          "Page 1 of 3",
        ].join("\n"),
      },
    ]);
    expect(options).toContain("NYCT/MTA Approval");
    expect(options).toContain("Designer Approval");
    expect(options).not.toContain("TRANSMITTAL");
    expect(options.some((option) => option.startsWith("Page 1"))).toBe(false);
  });
});

describe("parseVisualEvidence", () => {
  const context = { fileId: "file-1", page: 4 };

  it("parses observations and clamps confidence", () => {
    const evidence = parseVisualEvidence(
      JSON.stringify({
        visible: true,
        confidence: 1.7,
        observations: [
          { field: "Mounting height", value: "4'-6\" AFF", where: "dimension string left of the car door" },
        ],
      }),
      context
    );
    expect(evidence).not.toBeNull();
    expect(evidence!.evidenceType).toBe("visual");
    expect(evidence!.page).toBe(4);
    expect(evidence!.fileId).toBe("file-1");
    expect(evidence!.confidence).toBe(1);
    expect(evidence!.observations[0].value).toBe("4'-6\" AFF");
    expect(evidence!.observations[0].boundingDescription).toMatch(/car door/);
  });

  it("returns null on the bare NOT_VISIBLE sentinel", () => {
    expect(parseVisualEvidence("NOT_VISIBLE", context)).toBeNull();
  });

  it("returns null when the model reports visible: false", () => {
    expect(
      parseVisualEvidence(
        JSON.stringify({ visible: false, confidence: 0.1, observations: [], not_visible_reason: "blurry" }),
        context
      )
    ).toBeNull();
  });

  it("returns null when observations carry the sentinel as a value", () => {
    expect(
      parseVisualEvidence(
        JSON.stringify({
          visible: true,
          confidence: 0.4,
          observations: [{ field: "Selected designation", value: "NOT_VISIBLE" }],
        }),
        context
      )
    ).toBeNull();
  });

  it("returns null on unparseable output", () => {
    expect(parseVisualEvidence("the page appears to show something", context)).toBeNull();
  });

  it("tolerates code fences and surrounding prose", () => {
    const evidence = parseVisualEvidence(
      'Looking at the page:\n```json\n{"visible":true,"confidence":0.8,"observations":[{"field":"Revision","value":"R02"}]}\n```',
      context
    );
    expect(evidence!.observations[0].value).toBe("R02");
  });
});

describe("visualEvidenceToEvidenceItems", () => {
  it("renders observations as extractor evidence with visual provenance", () => {
    const items = visualEvidenceToEvidenceItems(
      [
        {
          fileId: "file-1",
          page: 1,
          evidenceType: "visual",
          confidence: 0.9,
          observations: [
            { field: "Selected designation", value: "NYCT/MTA Approval", boundingDescription: "checked box" },
          ],
        },
      ],
      { documentAlias: "MTACD-MLJTC2-L-0024", fileName: "MTACD-MLJTC2-L-0024R00.pdf", startIndex: 0 }
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("v1");
    expect(items[0].evidenceType).toBe("visual");
    expect(items[0].page).toBe(1);
    expect(items[0].fileId).toBe("file-1");
    expect(items[0].confidence).toBe(0.9);
    expect(items[0].text).toContain("Selected designation: NYCT/MTA Approval");
    expect(items[0].text).toContain("checked box");
  });
});

describe("detectSelectionConflicts", () => {
  const visualEvidence: VisualEvidence[] = [
    {
      fileId: "file-1",
      page: 1,
      evidenceType: "visual",
      confidence: 0.9,
      observations: [{ field: "Selected designation", value: "Designer Approval" }],
    },
  ];

  it("reports a conflict when the text's preserved marker names a different option", () => {
    const conflicts = detectSelectionConflicts(
      [{ page: 1, text: "[X] NYCT/MTA Approval\nDesigner Approval" }],
      visualEvidence
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].textValue).toContain("NYCT/MTA Approval");
    expect(conflicts[0].visualValue).toBe("Designer Approval");
  });

  it("reports nothing when text and image agree", () => {
    expect(
      detectSelectionConflicts([{ page: 1, text: "[X] Designer Approval" }], visualEvidence)
    ).toHaveLength(0);
  });

  it("reports nothing when the text never preserved a selection marker", () => {
    expect(
      detectSelectionConflicts(
        [{ page: 1, text: "NYCT/MTA Approval\nDesigner Approval" }],
        visualEvidence
      )
    ).toHaveLength(0);
  });
});
