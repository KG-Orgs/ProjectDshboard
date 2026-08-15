import { describe, expect, it } from "vitest";
import {
  describeSourceIdentity,
  hasRequestedIdentity,
  parseRequestedIdentity,
  toGuardJson,
  verifySourceIdentity,
  type CandidateSource,
} from "./source-identity-guard.service";

function source(fileName: string, overrides: Partial<CandidateSource> = {}): CandidateSource {
  return { key: fileName, fileName, ...overrides };
}

describe("parseRequestedIdentity", () => {
  it("extracts the identifier a question names", () => {
    const requested = parseRequestedIdentity("What is the response to RFI096?");
    expect(requested.identifiers.map((id) => [id.type, id.valueNormalized])).toEqual([["RFI", "RFI96"]]);
  });

  it("does not read a control number's revision as a standalone revision request", () => {
    // "R02" here belongs to PRDC12-012R02, which the identifier check already covers.
    expect(parseRequestedIdentity("Summarize PRDC12-012R02").revision).toBeUndefined();
  });

  it("reads a standalone revision in both token and word form", () => {
    expect(parseRequestedIdentity("the QWP plan, R02")?.revision?.number).toBe(2);
    expect(parseRequestedIdentity("the QWP plan, revision 2")?.revision?.number).toBe(2);
  });

  it("resolves a station from its name", () => {
    expect(parseRequestedIdentity("What is the Norwood waterproofing detail?").station).toEqual({
      code: "NOR",
      name: "Norwood Ave",
    });
  });

  it("does not read the conjunction 'nor' as the Norwood station code", () => {
    expect(parseRequestedIdentity("neither the plan nor the spec covers this").station).toBeUndefined();
  });

  it("reports no identity for a question that names no document", () => {
    expect(hasRequestedIdentity(parseRequestedIdentity("What is the project status?"))).toBe(false);
  });
});

describe("describeSourceIdentity", () => {
  it("reads identifier, revision and station from the file name", () => {
    const identity = describeSourceIdentity(source("A37806_NOR-013R01 - APP - Waterproofing.pdf"));
    expect(identity.identifiers.map((id) => id.valueNormalized)).toContain("NOR013R01");
    expect(identity.revision).toEqual({ raw: "R01", number: 1 });
    expect(identity.station).toBe("NOR");
  });
});

describe("verifySourceIdentity — identifier match", () => {
  it("continues when the retrieved source carries the requested identifier", () => {
    const verdict = verifySourceIdentity({
      question: "What is the response to RFI096?",
      sources: [source("A37806 RFI-096 Track Drainage - CLO.pdf")],
    });
    expect(toGuardJson(verdict)).toEqual({ valid: true, action: "continue" });
  });

  it("rejects RFI-0042 for a question about RFI096", () => {
    const verdict = verifySourceIdentity({
      question: "What is the response to RFI096?",
      sources: [source("A37806 RFI-0042 Conduit Routing.pdf")],
    });
    expect(verdict.valid).toBe(false);
    expect(verdict.action).toBe("retry_retrieval");
    expect(verdict.reason).toBe("Requested RFI096 but retrieved RFI-0042.");
    expect(verdict.acceptedKeys).toEqual([]);
  });

  it("does not silently substitute PRDC12-012R00 for PRDC12-012R02", () => {
    const verdict = verifySourceIdentity({
      question: "What does PRDC12-012R02 require for grout?",
      sources: [source("PRDC12-012R00 Grout Requirements.pdf")],
    });
    expect(verdict.valid).toBe(false);
    expect(verdict.reason).toContain("PRDC12-012R02");
    expect(verdict.reason).toContain("PRDC12-012R00");
  });

  it("rejects a source that carries no identifier of the requested type", () => {
    const verdict = verifySourceIdentity({
      question: "What is the response to RFI096?",
      sources: [source("Monthly Progress Report March 2026.pdf")],
    });
    expect(verdict.action).toBe("retry_retrieval");
    expect(verdict.reason).toBe("Requested RFI096 but no retrieved source carries that identifier.");
  });

  it("notes that the requested document is in the corpus when it is known to exist", () => {
    const verdict = verifySourceIdentity({
      question: "What is the response to RFI096?",
      sources: [source("A37806 RFI-0042 Conduit Routing.pdf")],
      exactMatchInCorpus: true,
    });
    expect(verdict.reason).toContain("exists in the project index");
  });

  it("keeps only the matching source when the results are mixed", () => {
    const verdict = verifySourceIdentity({
      question: "What is the response to RFI096?",
      sources: [
        source("A37806 RFI-0042 Conduit Routing.pdf"),
        source("A37806 RFI-096 Track Drainage - CLO.pdf"),
      ],
    });
    expect(verdict.valid).toBe(true);
    expect(verdict.acceptedKeys).toEqual(["A37806 RFI-096 Track Drainage - CLO.pdf"]);
    expect(verdict.rejected).toHaveLength(1);
  });

  it("accepts either identifier when the question names two", () => {
    const verdict = verifySourceIdentity({
      question: "Compare RFI096 and RFI097.",
      sources: [source("A37806 RFI-096 Track Drainage.pdf"), source("A37806 RFI-097 Ballast.pdf")],
    });
    expect(verdict.valid).toBe(true);
    expect(verdict.acceptedKeys).toHaveLength(2);
  });

  it("rejects a conflicting revision even when a broader identifier matches", () => {
    // PRDC12-012R00 shares the PRDC12 package identifier with the request; the
    // submittal control number is the specific one and it conflicts.
    const verdict = verifySourceIdentity({
      question: "What does PRDC12-012R02 say about curing?",
      sources: [source("PRDC12-012R00 Curing.pdf")],
    });
    expect(verdict.valid).toBe(false);
  });
});

describe("verifySourceIdentity — station scoping", () => {
  it("rejects a Burnside document for a Norwood question", () => {
    const verdict = verifySourceIdentity({
      question: "What is the Norwood platform edge treatment?",
      sources: [source("BUR-009R00 Platform Edge.pdf", { text: "Burnside Ave platform edge detail." })],
    });
    expect(verdict.valid).toBe(false);
    expect(verdict.reason).toBe(
      "Requested Norwood Ave but retrieved a Burnside Ave document that does not mention Norwood Ave."
    );
  });

  it("accepts another station's document when it explicitly contains the requested information", () => {
    const verdict = verifySourceIdentity({
      question: "What is the Norwood platform edge treatment?",
      sources: [
        source("BUR-009R00 Platform Edge.pdf", {
          text: "Platform edge treatment at Burnside Ave and Norwood Ave stations shall use cast-in-place rubbing strip.",
        }),
      ],
    });
    expect(verdict.valid).toBe(true);
  });

  it("does not reject a source with no station of its own", () => {
    const verdict = verifySourceIdentity({
      question: "What is the Norwood platform edge treatment?",
      sources: [source("Contract Drawings Platform Details.pdf", { text: "Typical platform detail." })],
    });
    expect(verdict.valid).toBe(true);
  });
});

describe("verifySourceIdentity — revision scoping", () => {
  it("rejects a source whose revision differs from the requested one", () => {
    const verdict = verifySourceIdentity({
      question: "What changed in revision 2 of the waterproofing submittal?",
      sources: [source("NOR-013R00 Waterproofing.pdf")],
    });
    expect(verdict.valid).toBe(false);
    expect(verdict.reason).toContain("R00");
  });

  it("treats R2 and R02 as the same revision", () => {
    const verdict = verifySourceIdentity({
      question: "What changed in R2 of the waterproofing submittal?",
      sources: [source("NOR-013R02 Waterproofing.pdf")],
    });
    expect(verdict.valid).toBe(true);
  });
});

describe("verifySourceIdentity — document type", () => {
  it("narrows to the requested type when both types were retrieved", () => {
    const verdict = verifySourceIdentity({
      question: "What do the meeting minutes say about the crane pick?",
      sources: [
        source("Monthly Job Progress Meeting Minutes 2026-03-04.pdf", { docCategory: "meeting_minutes" }),
        source("Monthly Progress Report March 2026.pdf", { docCategory: "report" }),
      ],
    });
    expect(verdict.valid).toBe(true);
    expect(verdict.acceptedKeys).toEqual(["Monthly Job Progress Meeting Minutes 2026-03-04.pdf"]);
  });

  it("never empties the result set on a type mismatch alone", () => {
    const verdict = verifySourceIdentity({
      question: "What do the meeting minutes say about the crane pick?",
      sources: [source("Monthly Progress Report March 2026.pdf", { docCategory: "report" })],
    });
    expect(verdict.valid).toBe(true);
    expect(verdict.action).toBe("continue");
  });
});

describe("verifySourceIdentity — nothing to guard", () => {
  it("continues when the question names no document identity", () => {
    const verdict = verifySourceIdentity({
      question: "What is the current project status?",
      sources: [source("Monthly Progress Report March 2026.pdf")],
    });
    expect(verdict.valid).toBe(true);
    expect(verdict.acceptedKeys).toEqual(["Monthly Progress Report March 2026.pdf"]);
  });

  it("continues when there are no sources to check", () => {
    const verdict = verifySourceIdentity({ question: "What is in RFI096?", sources: [] });
    expect(verdict.valid).toBe(true);
  });
});
