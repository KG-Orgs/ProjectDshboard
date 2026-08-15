import { describe, expect, it } from "vitest";
import {
  coerceExtractedAnswer,
  extractFirstJsonObject,
  renderExtractedAnswerMarkdown,
  type ExtractorEvidenceItem,
} from "./chat-coordinator.service";

const EVIDENCE: ExtractorEvidenceItem[] = [
  { id: "c1", documentId: "RFI-0115", documentName: "RFI-0115", page: 3, text: "Response due by 2026-02-01." },
  { id: "c2", documentId: "RFI-0115", documentName: "RFI-0115", page: 4, text: "Ball-in-court: Architect." },
];

function evidenceMap(items: ExtractorEvidenceItem[] = EVIDENCE): Map<string, ExtractorEvidenceItem> {
  return new Map(items.map((item) => [item.id, item]));
}

describe("extractFirstJsonObject", () => {
  it("extracts a balanced object wrapped in code fences and prose", () => {
    const raw = 'Here is the answer:\n```json\n{"status":"complete","nested":{"a":1}}\n```\nDone.';
    expect(extractFirstJsonObject(raw)).toBe('{"status":"complete","nested":{"a":1}}');
  });

  it("ignores braces inside strings", () => {
    const raw = '{"title":"a } b","x":1}';
    expect(extractFirstJsonObject(raw)).toBe('{"title":"a } b","x":1}');
  });

  it("returns null when no object is present", () => {
    expect(extractFirstJsonObject("no json here")).toBeNull();
  });
});

describe("coerceExtractedAnswer", () => {
  it("maps snake_case fields to camelCase and keeps supported statuses", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "partial",
        title: "RFI Response",
        summary: "Response is due 2026-02-01.",
        items: [{ label: "Due date", value: "2026-02-01", citation_ids: ["c1"] }],
        missing: ["reviewer name"],
        citations: [{ id: "c1", evidence_text: "Response due by 2026-02-01." }],
      },
      evidenceMap()
    );

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("partial");
    expect(answer!.items[0]).toMatchObject({ label: "Due date", value: "2026-02-01", citationIds: ["c1"] });
    expect(answer!.missing).toEqual(["reviewer name"]);
    expect(answer!.citations[0]).toMatchObject({ id: "c1", documentName: "RFI-0115", page: 3 });
  });

  it("overwrites model-supplied provenance with ground-truth evidence (hallucination guard)", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "complete",
        title: "T",
        items: [{ label: "x", value: "y", citation_ids: ["c1"] }],
        citations: [
          { id: "c1", document_name: "FAKE-DOC", document_id: "FAKE", page: 999, evidence_text: "short excerpt" },
        ],
      },
      evidenceMap()
    );

    const citation = answer!.citations.find((c) => c.id === "c1")!;
    expect(citation.documentName).toBe("RFI-0115");
    expect(citation.documentId).toBe("RFI-0115");
    expect(citation.page).toBe(3);
    // The model's short excerpt text is preserved.
    expect(citation.evidenceText).toBe("short excerpt");
  });

  it("drops citation ids that do not exist in the supplied evidence", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "complete",
        title: "T",
        items: [{ label: "x", value: "y", citation_ids: ["c1", "c99"] }],
        citations: [{ id: "c99", evidence_text: "ghost" }],
      },
      evidenceMap()
    );

    expect(answer!.items[0]!.citationIds).toEqual(["c1"]);
    expect(answer!.citations.map((c) => c.id)).toEqual(["c1"]);
  });

  it("falls back to a default status/title and drops empty-value items", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "bogus",
        items: [{ label: "x", value: "" }, { label: "keep", value: "real" }],
      },
      evidenceMap()
    );

    expect(answer!.status).toBe("complete");
    expect(answer!.title).toBe("Answer");
    expect(answer!.items).toHaveLength(1);
    expect(answer!.items[0]!.value).toBe("real");
  });
});

describe("renderExtractedAnswerMarkdown", () => {
  it("renders heading, summary, bulleted items with page refs, and missing notes", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "partial",
        title: "RFI Response",
        summary: "Response is due 2026-02-01.",
        items: [
          { label: "Due date", value: "2026-02-01", citation_ids: ["c1"] },
          { label: "Ball in court", value: "Architect", citation_ids: ["c2"] },
        ],
        missing: ["reviewer name"],
        citations: [{ id: "c1" }, { id: "c2" }],
      },
      evidenceMap()
    )!;

    const md = renderExtractedAnswerMarkdown(answer);
    expect(md).toContain("## RFI Response");
    expect(md).toContain("Response is due 2026-02-01.");
    expect(md).toContain("- **Due date:** 2026-02-01 (p. 3)");
    expect(md).toContain("- **Ball in court:** Architect (p. 4)");
    expect(md).toContain("- Could not verify: reviewer name.");
  });

  it("renders a clear note for source_mismatch without leaking items", () => {
    const answer = coerceExtractedAnswer(
      {
        status: "source_mismatch",
        title: "Identifier mismatch",
        items: [{ label: "x", value: "should not appear" }],
      },
      evidenceMap()
    )!;

    const md = renderExtractedAnswerMarkdown(answer);
    expect(md).toContain("## Identifier mismatch");
    expect(md).not.toContain("should not appear");
  });
});
