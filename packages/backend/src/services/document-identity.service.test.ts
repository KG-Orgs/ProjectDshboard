import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UUID } from "@contractor/shared";

// The lock/ambiguity/not-found decision is what these tests are about, so DB
// candidate generation is switched off (no initialized db) and candidates are fed
// in through `extraCandidates` — the same path semantic retrieval uses. That also
// pins the rule that a semantically-supplied candidate gets no head start.
vi.mock("../db", () => ({
  getDbIfInitialized: () => null,
  documentIdentifiers: {},
  fileRecords: {},
}));

const { documentIdentityService } = await import("./document-identity.service");
const { LOCK_MIN_SCORE } = await import("./document-identity.service");

const PROJECT_ID = "11111111-1111-1111-1111-111111111111" as UUID;

const FILES = {
  vecpMay13: {
    fileId: "f-vecp-0513",
    fileName: "2025-05-13 A37806 Burnside Ave VECP Presentation.pdf",
    filePath: "P6\\25 - MISC ADMIN\\VECP Minutes\\2025-05-13 A37806 Burnside Ave VECP Presentation.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 10,
  },
  vecpMay13Pptx: {
    fileId: "f-vecp-0513-pptx",
    fileName: "A37806 Burnside Ave VECP Presentation 2025-05-13.pptx",
    filePath: "P6\\25 - MISC ADMIN\\MEETINGS\\Burnside Ave FINAL VECP Presentation 25.05.13\\A37806 Burnside Ave VECP Presentation 2025-05-13.pptx",
    chunkCount: 0,
  },
  burnsideEmdMay5: {
    fileId: "f-emd",
    fileName: "0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf",
    filePath: "P6\\13 - FLAGGING\\0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf",
    chunkCount: 4,
  },
  rfi096: {
    fileId: "f-rfi096",
    fileName: "A37806_ADA P6_RFI096.pdf",
    filePath: "P6\\24 - RFI'S\\RFIs FROM AECOM\\A37806_ADA P6_RFI096.pdf",
    docCategory: "rfi",
    chunkCount: 60,
  },
  rfi0042: {
    fileId: "f-rfi0042",
    fileName: "A37806_RFI-0042 - CLO - Coordination with Contract W47032 - PS LAN system _Norwood ONLY.pdf",
    filePath: "P6\\24 - RFI'S\\A37806 RFI TO MTA\\A37806_RFI-0042 - CLO - Coordination with Contract W47032 - PS LAN system _Norwood ONLY.pdf",
    docCategory: "rfi",
    chunkCount: 81,
  },
  norwoodCctv: {
    fileId: "f-nor-cctv",
    fileName: "A37806 Norwood CCTV Inspection Findings 2025-07-08.pdf",
    filePath: "P6\\33 - INSPECTION\\A37806 Norwood CCTV Inspection Findings 2025-07-08.pdf",
    docCategory: "inspection",
    chunkCount: 12,
  },
  burnsideCctv: {
    fileId: "f-bur-cctv",
    fileName: "A37806 Burnside CCTV Inspection Findings 2025-06-20.pdf",
    filePath: "P6\\33 - INSPECTION\\A37806 Burnside CCTV Inspection Findings 2025-06-20.pdf",
    docCategory: "inspection",
    chunkCount: 9,
  },
  // Two genuinely different documents with identical requested identity.
  minutesA: {
    fileId: "f-minutes-a",
    fileName: "2025-09-03 A37806 Coordination Meeting Minutes - Track.pdf",
    filePath: "P6\\05 - SUBMITTALS\\01 30 20 Project Meetings\\2025-09-03 A37806 Coordination Meeting Minutes - Track.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 12,
  },
  minutesB: {
    fileId: "f-minutes-b",
    fileName: "2025-09-03 A37806 Coordination Meeting Minutes - Signals.pdf",
    filePath: "P6\\05 - SUBMITTALS\\01 30 20 Project Meetings\\2025-09-03 A37806 Coordination Meeting Minutes - Signals.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 11,
  },
};

const VECP_QUESTION =
  "In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings or schedule benefits are claimed for the value engineering change proposal?";

beforeEach(() => {
  vi.restoreAllMocks();
  // The resolver logs a trace event per decision; keep the test output readable.
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("resolveDocumentLock — natural-language references", () => {
  it("locks the requested VECP presentation and rejects the same-station decoy", async () => {
    const result = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question: VECP_QUESTION,
      reference: "May 13, 2025 Burnside Avenue VECP Presentation",
      extraCandidates: [FILES.burnsideEmdMay5, FILES.vecpMay13, FILES.vecpMay13Pptx],
    });

    expect(result.status).toBe("locked");
    expect(result.fileName).toBe(FILES.vecpMay13.fileName);
    expect(result.matchedFields).toEqual(
      expect.arrayContaining(["date:2025-05-13", "title:vecp", "station:BUR", "type:presentation"])
    );
    expect(result.confidence).toBeGreaterThan(0.9);

    const decoy = result.candidateFiles?.find((c) => c.fileId === FILES.burnsideEmdMay5.fileId);
    expect(decoy?.decision).toBe("rejected");
    expect(decoy?.conflictingFields).toContain("title:missing:vecp");
  });

  it("treats the pptx of the same presentation as a duplicate, not an ambiguity", async () => {
    const result = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question: VECP_QUESTION,
      reference: "May 13, 2025 Burnside Avenue VECP Presentation",
      extraCandidates: [FILES.vecpMay13Pptx, FILES.vecpMay13],
    });

    expect(result.status).toBe("locked");
    // The indexed member of the pair wins; an unreadable file cannot answer.
    expect(result.fileName).toBe(FILES.vecpMay13.fileName);
    expect(
      result.candidateFiles?.find((c) => c.fileId === FILES.vecpMay13Pptx.fileId)?.decision
    ).toBe("duplicate_of_locked");
  });

  it("will not lock on a station document that shares nothing else", async () => {
    const result = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question: VECP_QUESTION,
      reference: "May 13, 2025 Burnside Avenue VECP Presentation",
      extraCandidates: [FILES.burnsideEmdMay5],
    });

    expect(result.status).toBe("not_found");
    expect(result.fileId).toBeUndefined();
    expect(result.reason).toMatch(/contradicted the requested identity/);
  });

  it("keeps the requested station when two stations have the same document", async () => {
    const result = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question: "In the Norwood CCTV Inspection Findings, what defects were recorded?",
      reference: "Norwood CCTV Inspection Findings",
      extraCandidates: [FILES.burnsideCctv, FILES.norwoodCctv],
    });

    expect(result.status).toBe("locked");
    expect(result.fileName).toBe(FILES.norwoodCctv.fileName);
  });
});

describe("resolveDocumentLock — explicit identifiers", () => {
  it("locks RFI096 on the RFI096 document even when a bigger RFI is a candidate", async () => {
    const result = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question: "In A37806 RFI096, what question is being asked of the design team?",
      extraCandidates: [FILES.rfi0042, FILES.rfi096],
    });

    expect(result.status).toBe("locked");
    expect(result.fileName).toBe(FILES.rfi096.fileName);
    expect(result.matchedFields).toContain("identifier:RFI96");
  });

  it("returns not_found rather than the nearest RFI when RFI096 is absent", async () => {
    const result = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question: "In A37806 RFI096, what question is being asked of the design team?",
      extraCandidates: [FILES.rfi0042],
    });

    expect(result.status).toBe("not_found");
    expect(result.fileId).toBeUndefined();
    expect(result.candidateFiles?.[0]?.conflictingFields.join()).toMatch(/identifier:RFI42/);
  });
});

describe("resolveDocumentLock — ambiguity", () => {
  it("returns ambiguous when two different documents match equally well", async () => {
    const result = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question:
        "In the September 3, 2025 A37806 Coordination Meeting Minutes, what action items were recorded?",
      reference: "September 3, 2025 A37806 Coordination Meeting Minutes",
      extraCandidates: [FILES.minutesA, FILES.minutesB],
    });

    expect(result.status).toBe("ambiguous");
    expect(result.fileId).toBeUndefined();
    expect(result.candidateFiles?.map((c) => c.fileId)).toEqual(
      expect.arrayContaining([FILES.minutesA.fileId, FILES.minutesB.fileId])
    );
    expect(result.reason).toMatch(/equally well/);
  });

  it("returns not_found when the question identifies no document at all", async () => {
    const result = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question: "What is the project status?",
      extraCandidates: [FILES.minutesA],
    });

    expect(result.status).toBe("not_found");
    expect(result.reason).toMatch(/names nothing that identifies/);
  });
});

describe("verifyLock", () => {
  it("accepts a candidate that carries the requested identifier", () => {
    const { accepted } = documentIdentityService.verifyLock({
      question: "In A37806 RFI096, what is the RFI status?",
      candidate: FILES.rfi096,
    });
    expect(accepted).toBe(true);
  });

  it("rejects a candidate carrying a different identifier", () => {
    const { accepted, scored } = documentIdentityService.verifyLock({
      question: "In A37806 RFI096, what is the RFI status?",
      candidate: FILES.rfi0042,
    });
    expect(accepted).toBe(false);
    expect(scored.reason).toMatch(/RFI96.*RFI42/);
  });

  it("rejects a candidate carrying a different revision", () => {
    const { accepted, scored } = documentIdentityService.verifyLock({
      question: "In PRDC12-012R02 Lead Placard Package, what monitoring applies?",
      reference: "PRDC12-012R02 Lead Placard Package",
      candidate: {
        fileId: "f-prdc-r00",
        fileName: "A37806_PRDC12-012R00 - Lead Placard Package.pdf",
        filePath: "P6\\05 - SUBMITTALS\\A37806_PRDC12-012R00 - Lead Placard Package.pdf",
        chunkCount: 20,
      },
    });
    expect(accepted).toBe(false);
    expect(scored.conflictingFields.join()).toMatch(/PRDC12012R00|revision/);
  });
});

describe("lock threshold", () => {
  it("is documented in terms of the identity weights", () => {
    // A station (3) or a document type (2) alone must not reach it; an exact
    // identifier (10) must.
    expect(LOCK_MIN_SCORE).toBeGreaterThan(3);
    expect(LOCK_MIN_SCORE).toBeLessThanOrEqual(10);
  });
});
