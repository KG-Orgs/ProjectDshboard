import type { ExtractedAnswer } from "@contractor/shared";
import { describe, expect, it } from "vitest";
import {
  buildAnswerFormatterUserMessage,
  buildFormatterSources,
  containsInternalTerminology,
  formatAnswer,
  linkCitationMarkers,
  renderSourceLine,
  sanitizeFormattedAnswer,
} from "./answer-formatter.service";

const ANSWER: ExtractedAnswer = {
  status: "partial",
  title: "Material I&T Status",
  summary: "Inspection is Not Reviewed as of March 13, 2026.",
  items: [
    {
      label: "Inspection status",
      value: "Not Reviewed as of March 13, 2026",
      citationIds: ["c2"],
    },
    {
      label: "MTA I&T status",
      value: "Approved; PMC notified DB on March 27",
      citationIds: ["c2", "c1"],
    },
  ],
  missing: ["supplier"],
  citations: [
    { id: "c1", documentId: "MTACD-MLJTC2-L-0024", documentName: "MTACD-MLJTC2-L-0024", page: 4 },
    { id: "c2", documentId: "MTACD-MLJTC2-L-0024", documentName: "MTACD-MLJTC2-L-0024", page: 1 },
  ],
};

const ANSWER_WITH_FILES: ExtractedAnswer = {
  ...ANSWER,
  citations: [
    { ...ANSWER.citations[0], fileId: "11111111-1111-4111-8111-111111111111" },
    { ...ANSWER.citations[1], fileId: "11111111-1111-4111-8111-111111111111" },
  ],
};

describe("buildFormatterSources", () => {
  it("numbers citations in order of first use, not citation array order", () => {
    const sources = buildFormatterSources(ANSWER);
    expect(sources.map((s) => [s.marker, s.citationId, s.page])).toEqual([
      [1, "c2", 1],
      [2, "c1", 4],
    ]);
  });

  it("includes citations that no item referenced, after the used ones", () => {
    const sources = buildFormatterSources({
      ...ANSWER,
      items: [{ label: "x", value: "y", citationIds: ["c1"] }],
    });
    expect(sources.map((s) => s.citationId)).toEqual(["c1", "c2"]);
  });

  it("deep-links to the cited page by default when the source file is known", () => {
    const sources = buildFormatterSources(ANSWER_WITH_FILES);
    expect(sources[0].url).toBe("#citation:11111111-1111-4111-8111-111111111111:1");
    expect(sources[1].url).toBe("#citation:11111111-1111-4111-8111-111111111111:4");
  });

  it("omits the link when the citation has no source file", () => {
    expect(buildFormatterSources(ANSWER).every((source) => source.url === undefined)).toBe(true);
  });

  it("attaches a deep link only when the caller resolves one", () => {
    const withUrl = buildFormatterSources(ANSWER, {
      sourceUrlFor: (citation) => (citation.id === "c2" ? `/doc/${citation.id}?page=${citation.page}` : undefined),
    });
    expect(withUrl[0].url).toBe("/doc/c2?page=1");
    expect(withUrl[1].url).toBeUndefined();
  });
});

describe("renderSourceLine", () => {
  it("renders a single source as one compact line", () => {
    const markdown = renderSourceLine([{ marker: 1, citationId: "c1", label: "Invoice 11830", page: 1 }]);
    expect(markdown).toBe("**Source:** Invoice 11830, p. 1");
  });

  it("links the document title to the cited page when a url is present", () => {
    const markdown = renderSourceLine([
      { marker: 1, citationId: "c1", label: "RFI-0115", page: 3, url: "/doc/f1?page=3" },
    ]);
    expect(markdown).toBe("**Source:** [RFI-0115](/doc/f1?page=3), p. 3");
  });

  it("omits the page when the citation has none", () => {
    expect(renderSourceLine([{ marker: 1, citationId: "c1", label: "RFI-0115" }])).toBe(
      "**Source:** RFI-0115"
    );
  });

  it("lists several sources with the marker used in the body", () => {
    const markdown = renderSourceLine(buildFormatterSources(ANSWER));
    expect(markdown).toBe(
      [
        "**Sources:**",
        "",
        "* [1] MTACD-MLJTC2-L-0024, p. 1",
        "* [2] MTACD-MLJTC2-L-0024, p. 4",
      ].join("\n")
    );
  });

  it("returns an empty string when there are no sources", () => {
    expect(renderSourceLine([])).toBe("");
  });
});

describe("buildAnswerFormatterUserMessage", () => {
  it("supplies facts with the markers the model must cite", () => {
    const sources = buildFormatterSources(ANSWER);
    const message = buildAnswerFormatterUserMessage(
      { question: "What is the material I&T status?", answer: ANSWER },
      sources
    );

    expect(message).toContain("Question:\nWhat is the material I&T status?");
    expect(message).toContain("Answer completeness: partial");
    expect(message).toContain("- Inspection status: Not Reviewed as of March 13, 2026 (cite [1])");
    expect(message).toContain("- MTA I&T status: Approved; PMC notified DB on March 27 (cite [1], [2])");
    expect(message).toContain("Could not be verified");
    expect(message).toContain("- supplier");
    expect(message).toContain("[1] MTACD-MLJTC2-L-0024 — p. 1");
  });

  it("omits the label prefix for unlabelled items", () => {
    const message = buildAnswerFormatterUserMessage(
      {
        question: "q",
        answer: { status: "complete", title: "T", items: [{ label: "Detail", value: "300 psi" }], citations: [] },
      },
      []
    );
    expect(message).toContain("- 300 psi");
    expect(message).not.toContain("Detail: 300 psi");
  });

  it("tells the formatter which pages were inspected, so it cannot suggest a review already done", () => {
    const message = buildAnswerFormatterUserMessage(
      {
        question: "What dimensions are shown?",
        answer: {
          status: "not_found",
          title: "Dimensions",
          items: [],
          citations: [],
          visualFallback: {
            assessment: { visualLikely: true, confidence: 0.75, reasons: [], visualTaskTypes: ["drawing"] },
            triggered: true,
            triggerReason: "likely visual",
            pagesSelected: [4, 5],
            pagesInspected: [4, 5],
            evidence: [],
            noEvidence: true,
          },
        },
      },
      []
    );

    expect(message).toContain("Visual inspection: page 4, 5");
    expect(message).toContain("did not show the requested detail");
    expect(message).toMatch(/Do not suggest reviewing them visually/);
  });

  it("tells the formatter when visual inspection could not be performed", () => {
    const message = buildAnswerFormatterUserMessage(
      {
        question: "What dimensions are shown?",
        answer: {
          status: "not_found",
          title: "Dimensions",
          items: [],
          citations: [],
          visualFallback: {
            assessment: { visualLikely: true, confidence: 0.75, reasons: [], visualTaskTypes: ["drawing"] },
            triggered: true,
            triggerReason: "likely visual",
            pagesSelected: [4],
            pagesInspected: [],
            evidence: [],
            failureReason: "page rendering is unavailable in this environment",
          },
        },
      },
      []
    );

    expect(message).toContain("could not be performed (page rendering is unavailable");
  });

  it("passes an unresolved text/image conflict through without choosing a side", () => {
    const message = buildAnswerFormatterUserMessage(
      {
        question: "Which designation is selected?",
        answer: {
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
        },
      },
      []
    );

    expect(message).toContain("Unresolved conflicts");
    expect(message).toMatch(/do not pick one/);
    expect(message).toContain('the extracted text says "Designer Approval"');
    expect(message).toContain('the page image shows "NYCT/MTA Approval"');
  });
});

describe("sanitizeFormattedAnswer", () => {
  const sources = buildFormatterSources(ANSWER);

  it("unwraps a whole-answer code fence", () => {
    const result = sanitizeFormattedAnswer("```markdown\n### Status\n\n* **Approved.** [1]\n```", sources);
    expect(result).toBe("### Status\n\n* **Approved.** [1]");
  });

  it("drops a model-written sources section and everything after it", () => {
    const raw = ["### Status", "", "* **Approved.** [1]", "", "### Sources", "", "[1] Made-up doc — p. 99"].join("\n");
    expect(sanitizeFormattedAnswer(raw, sources)).toBe("### Status\n\n* **Approved.** [1]");
  });

  it("drops a model-written compact source line, bulleted or not", () => {
    const plain = ["* **Approved.** [1]", "", "**Source:** Made-up doc, p. 99"].join("\n");
    expect(sanitizeFormattedAnswer(plain, sources)).toBe("* **Approved.** [1]");

    const bulleted = ["* **Approved.** [1]", "* **Sources:** Made-up doc, p. 99"].join("\n");
    expect(sanitizeFormattedAnswer(bulleted, sources)).toBe("* **Approved.** [1]");
  });

  it("keeps a real fact whose label merely starts with the word source", () => {
    const raw = "* **Source of water:** City main. [1]";
    expect(sanitizeFormattedAnswer(raw, sources)).toBe(raw);
  });

  it("strips citation markers outside the supplied range but keeps valid ones", () => {
    const result = sanitizeFormattedAnswer("* **Approved.** [1] [2] [7]", sources);
    expect(result).toBe("* **Approved.** [1] [2]");
  });

  it("leaves markdown links intact", () => {
    const result = sanitizeFormattedAnswer("See [1](https://example.com/doc) for detail.", sources);
    expect(result).toBe("See [1](https://example.com/doc) for detail.");
  });

  it("returns null when nothing usable remains", () => {
    expect(sanitizeFormattedAnswer("   \n\n", sources)).toBeNull();
    expect(sanitizeFormattedAnswer("## Sources\n\n[1] doc", sources)).toBeNull();
    expect(sanitizeFormattedAnswer("**Source:** doc, p. 1", sources)).toBeNull();
  });
});

describe("linkCitationMarkers", () => {
  it("makes inline markers clickable", () => {
    const sources = buildFormatterSources(ANSWER_WITH_FILES);
    const result = linkCitationMarkers("* **Approved:** March 19, 2025. [1] [2]", sources);
    expect(result).toBe(
      "* **Approved:** March 19, 2025. " +
        "[[1]](#citation:11111111-1111-4111-8111-111111111111:1) " +
        "[[2]](#citation:11111111-1111-4111-8111-111111111111:4)"
    );
  });

  it("leaves markers untouched when no source has a link", () => {
    const body = "* **Approved:** March 19, 2025. [1]";
    expect(linkCitationMarkers(body, buildFormatterSources(ANSWER))).toBe(body);
  });

  it("does not double-link an already-linked marker", () => {
    const sources = buildFormatterSources(ANSWER_WITH_FILES);
    const once = linkCitationMarkers("See [1] here.", sources);
    expect(linkCitationMarkers(once, sources)).toBe(once);
  });
});

describe("containsInternalTerminology", () => {
  it("flags leaked system vocabulary", () => {
    expect(containsInternalTerminology("I could not find an exact indexed passage.")).toBe(true);
    expect(containsInternalTerminology("Routed focus: scheduling.")).toBe(true);
    expect(containsInternalTerminology("The chunk did not contain a date.")).toBe(true);
    expect(containsInternalTerminology("Semantic search found no match.")).toBe(true);
    expect(containsInternalTerminology("Reviewed indexed evidence for the date.")).toBe(true);
  });

  it("accepts ordinary construction language", () => {
    expect(containsInternalTerminology("**Approved date:** March 19, 2025. [1]")).toBe(false);
  });
});

describe("formatAnswer", () => {
  it("skips a source mismatch without calling the model", async () => {
    await expect(
      formatAnswer({ question: "q", answer: { ...ANSWER, status: "source_mismatch" } })
    ).resolves.toBeNull();
  });

  it("skips an answer with no items and nothing missing", async () => {
    await expect(
      formatAnswer({
        question: "q",
        answer: { status: "not_found", title: "T", items: [], citations: [] },
      })
    ).resolves.toBeNull();
  });
});
