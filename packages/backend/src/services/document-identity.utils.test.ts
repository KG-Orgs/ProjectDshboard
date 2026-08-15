import { describe, expect, it } from "vitest";
import {
  describeFileIdentity,
  extractDates,
  extractDocumentReference,
  extractRequestedIdentity,
  identityFamilyKey,
  scoreIdentity,
  titleTermQuorum,
  type FileIdentityInput,
} from "./document-identity.utils";

// Real corpus paths — the resolver's whole job is to tell these apart.
const CORPUS: Record<string, FileIdentityInput> = {
  vecpMay13: {
    fileId: "f-vecp-0513",
    fileName: "2025-05-13 A37806 Burnside Ave VECP Presentation.pdf",
    filePath: "MLJ-017 Package 6 - General\\25 - MISC ADMIN\\VECP Minutes\\2025-05-13 A37806 Burnside Ave VECP Presentation.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 10,
  },
  vecpMay13Pptx: {
    fileId: "f-vecp-0513-pptx",
    fileName: "A37806 Burnside Ave VECP Presentation 2025-05-13.pptx",
    filePath: "MLJ-017 Package 6 - General\\25 - MISC ADMIN\\MEETINGS\\Burnside Ave FINAL VECP Presentation 25.05.13\\A37806 Burnside Ave VECP Presentation 2025-05-13.pptx",
    chunkCount: 0,
  },
  burnsideEmdMay5: {
    fileId: "f-emd",
    fileName: "0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf",
    filePath: "MLJ-017 Package 6 - General\\13 - FLAGGING\\0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf",
    chunkCount: 4,
  },
  vecpMarch6Minutes: {
    fileId: "f-vecp-0306",
    fileName: "2025-03-06 Burnside Ave VECP Presentation Meeting Minutes.pdf",
    filePath: "MLJ-017 Package 6 - General\\25 - MISC ADMIN\\VECP Minutes\\2025-03-06 Burnside Ave VECP Presentation Meeting Minutes.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 28,
  },
  vecpBaseMarkups: {
    fileId: "f-base-markups",
    fileName: "Base markups.pdf",
    filePath: "MLJ-017 Package 6 - General\\25 - MISC ADMIN\\MEETINGS\\Burnside Ave VECP Presentation 25.03.05\\Base markups.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 19,
  },
  rfi096: {
    fileId: "f-rfi096",
    fileName: "A37806_ADA P6_RFI096.pdf",
    filePath: "MLJ-017 Package 6 - General\\24 - RFI'S\\RFIs FROM AECOM\\A37806_ADA P6_RFI096.pdf",
    docCategory: "rfi",
    chunkCount: 60,
  },
  rfi0042: {
    fileId: "f-rfi0042",
    fileName: "A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Norwood ONLY.pdf",
    filePath: "MLJ-017 Package 6 - General\\24 - RFI'S\\A37806 RFI TO MTA\\A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Norwood ONLY.pdf",
    docCategory: "rfi",
    chunkCount: 81,
  },
  gen042r00Minutes: {
    fileId: "f-gen042-minutes",
    fileName: "A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf",
    filePath: "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\01 30 20 Project Meetings\\A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 8,
  },
  gen042r00MinutesOrig: {
    fileId: "f-gen042-minutes-orig",
    fileName: "A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf",
    filePath: "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\01 30 20 Project Meetings\\A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 6,
  },
  gen042r00Schedule: {
    fileId: "f-gen042-schedule",
    fileName: "A37806_01 32 10_GEN-042R00 - ORIG - Cost Loaded Resource Loaded Schedule.pdf",
    filePath: "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\01 32 10 Contract Schedule Requirements\\A37806_01 32 10_GEN-042R00 - ORIG - Cost Loaded Resource Loaded Schedule.pdf",
    docCategory: "schedule",
    chunkCount: 3,
  },
  gen042r01Minutes: {
    fileId: "f-gen042r01-minutes",
    fileName: "A37806_01 30 20_GEN-042R01 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf",
    filePath: "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\01 30 20 Project Meetings\\A37806_01 30 20_GEN-042R01 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf",
    docCategory: "meeting_minutes",
    chunkCount: 8,
  },
  myrtleDec2025Photos: {
    fileId: "f-myr-076",
    fileName: "A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf",
    filePath: "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\01 32 10 Contract Schedule Requirements\\MYR\\A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf",
    docCategory: "photo",
    chunkCount: 4,
  },
  burnsideDec2025Photos: {
    fileId: "f-bur-080",
    fileName: "A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025 Construction Photos.pdf",
    filePath: "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\01 32 10 Contract Schedule Requirements\\BUR\\A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025 Construction Photos.pdf",
    docCategory: "photo",
    chunkCount: 6,
  },
  myrtleMarch2026Photos: {
    fileId: "f-myr-079",
    fileName: "A37806_01 32 10_MYR-079R00 - FIO - Myrtle March 2026 Construction Photos.pdf",
    filePath: "MLJ-017 Package 6 - General\\05 - SUBMITTALS\\01 32 10 Contract Schedule Requirements\\MYR\\A37806_01 32 10_MYR-079R00 - FIO - Myrtle March 2026 Construction Photos.pdf",
    docCategory: "photo",
    chunkCount: 3,
  },
};

/** Score `question` (with its reference auto-isolated) against one corpus file. */
function score(question: string, key: keyof typeof CORPUS) {
  const requested = extractRequestedIdentity(question, extractDocumentReference(question));
  return scoreIdentity(requested, describeFileIdentity(CORPUS[key]!));
}

// ============================================================
// Step 1 — extraction
// ============================================================

describe("extractRequestedIdentity", () => {
  it("extracts the natural-language identity of the Burnside VECP presentation", () => {
    const question =
      "In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings or schedule benefits are claimed for the value engineering change proposal?";
    const requested = extractRequestedIdentity(question, extractDocumentReference(question));

    expect(requested.explicitIdentifiers).toEqual([]);
    expect(requested.documentType).toBe("presentation");
    expect(requested.station).toBe("Burnside Ave");
    expect(requested.date).toBe("2025-05-13");
    expect(requested.titleTerms).toEqual(["vecp"]);
  });

  it("keeps the words of the *question* out of the title terms", () => {
    // "cost savings" / "schedule benefits" are what is being asked for, not part
    // of the document's name; treating them as title terms would disqualify the
    // right document for not having them in its file name.
    const question =
      "In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings or schedule benefits are claimed?";
    const requested = extractRequestedIdentity(question, extractDocumentReference(question));
    expect(requested.titleTerms).not.toContain("cost");
    expect(requested.titleTerms).not.toContain("savings");
    expect(requested.titleTerms).not.toContain("benefits");
  });

  it("reads a month-precision reference as a range, not a day", () => {
    const requested = extractRequestedIdentity(
      "In the Myrtle December 2025 Construction Photos, what work is shown?",
      "Myrtle December 2025 Construction Photos"
    );
    expect(requested.date).toBeUndefined();
    expect(requested.dateRange).toEqual({ start: "2025-12-01", end: "2025-12-31" });
    expect(requested.station).toBe("Myrtle Ave");
    expect(requested.documentType).toBe("photo");
    expect(requested.titleTerms).toEqual(["construction"]);
  });

  it("extracts identifier, contract, date and type from a mixed reference", () => {
    const requested = extractRequestedIdentity(
      "In GEN-042R00 September 3, 2025 A37806 & C49321R Coordination Meeting Minutes, what action items were recorded?",
      "GEN-042R00 September 3, 2025 A37806 & C49321R Coordination Meeting Minutes"
    );
    expect(requested.explicitIdentifiers).toContain("GEN-042R00");
    expect(requested.date).toBe("2025-09-03");
    expect(requested.contract).toBe("A37806");
    expect(requested.documentType).toBe("meeting_minutes");
    expect(requested.titleTerms).toEqual(expect.arrayContaining(["c49321r", "coordination"]));
  });

  it("normalizes every spelling of an explicit identifier to one key", () => {
    for (const raw of ["RFI096", "RFI-096", "RFI 096", "RFI-0096"]) {
      const requested = extractRequestedIdentity(`In A37806 ${raw}, what is the status?`);
      expect(requested.identifiers.map((id) => id.valueNormalized)).toContain("RFI96");
    }
  });

  it("keeps a revision suffix distinct while collapsing separators", () => {
    const withHyphen = extractRequestedIdentity("In GEN-042R00, what changed?");
    const without = extractRequestedIdentity("In GEN042R00, what changed?");
    expect(without.identifiers.map((id) => id.valueNormalized)).toEqual(
      withHyphen.identifiers.map((id) => id.valueNormalized)
    );
    expect(withHyphen.identifiers.map((id) => id.valueNormalized)).toContain("GEN042R00");

    const r01 = extractRequestedIdentity("In GEN-042R01, what changed?");
    expect(r01.identifiers.map((id) => id.valueNormalized)).toContain("GEN042R01");
    expect(r01.identifiers.map((id) => id.valueNormalized)).not.toContain("GEN042R00");
  });
});

describe("extractDocumentReference", () => {
  it("isolates a reference that contains its own comma", () => {
    expect(
      extractDocumentReference(
        "In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings are claimed?"
      )
    ).toBe("May 13, 2025 Burnside Avenue VECP Presentation");
  });

  it("handles the 'what is in' and 'summarize' phrasings", () => {
    expect(extractDocumentReference("What is in the Norwood CCTV Inspection Findings?")).toBe(
      "Norwood CCTV Inspection Findings"
    );
    expect(extractDocumentReference("Summarize the Myrtle December 2025 Construction Photos")).toBe(
      "Myrtle December 2025 Construction Photos"
    );
  });

  it("returns undefined when the question does not name a document", () => {
    expect(extractDocumentReference("Which agencies issued the current permits?")).toBeUndefined();
  });
});

describe("extractDates", () => {
  it("reads the date spellings this corpus actually uses", () => {
    expect(extractDates("May 13, 2025").map((d) => d.iso)).toContain("2025-05-13");
    expect(extractDates("2025-05-13 A37806 Burnside").map((d) => d.iso)).toContain("2025-05-13");
    expect(extractDates("VECP Presentation 25.05.13").map((d) => d.iso)).toContain("2025-05-13");
    expect(extractDates("Meeting Minutes 09.03.25").map((d) => d.iso)).toContain("2025-09-03");
    expect(extractDates("Myrtle December 2025 Construction Photos").map((d) => d.iso)).toEqual([
      "2025-12",
    ]);
  });

  it("keeps every plausible reading of an ambiguous date rather than guessing", () => {
    // "03.06.25" is March 6 2025 read US-style and June 3 2009 read yy.mm.dd.
    // Both are kept so a conflict is only declared when no reading agrees.
    expect(extractDates("03.06.25").map((d) => d.iso)).toEqual(["2025-03-06", "2003-06-25"]);
  });
});

// ============================================================
// Step 2/4 — identifier fidelity
// ============================================================

describe("scoreIdentity — explicit identifiers", () => {
  it("locks RFI096 onto the RFI096 document", () => {
    const result = score("In A37806 RFI096, what is the RFI status?", "rfi096");
    expect(result.disqualified).toBe(false);
    expect(result.matchedFields).toContain("identifier:RFI96");
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("disqualifies RFI-0042 for an RFI096 question", () => {
    const result = score("In A37806 RFI096, what is the RFI status?", "rfi0042");
    expect(result.disqualified).toBe(true);
    expect(result.conflictingFields.some((field) => field.startsWith("identifier:"))).toBe(true);
    expect(result.reason).toMatch(/RFI96.*RFI42/);
  });

  it("accepts GEN042R00 written without its separator", () => {
    const result = score("In GEN042R00 Coordination Meeting Minutes, what was decided?", "gen042r00Minutes");
    expect(result.disqualified).toBe(false);
    expect(result.matchedFields).toContain("identifier:GEN042R00");
  });

  it("disqualifies GEN-042R01 for a GEN-042R00 question", () => {
    const result = score("In GEN-042R00 Coordination Meeting Minutes, what was decided?", "gen042r01Minutes");
    expect(result.disqualified).toBe(true);
    expect(result.reason).toMatch(/GEN042R00.*GEN042R01/);
  });

  it("ranks the document that *is* the identifier above one that references it", () => {
    // `RFI-0163 - AECOM-RFI-096 follow Up to RFI-119` carries RFI-096 in its name
    // but is RFI-0163; `A37806_ADA P6_RFI096` carries nothing else.
    const question = "In A37806 RFI096, what is the RFI status?";
    const isTheRfi = score(question, "rfi096");
    const referencesTheRfi = scoreIdentity(
      extractRequestedIdentity(question, extractDocumentReference(question)),
      describeFileIdentity({
        fileId: "f-rfi0163",
        fileName: "A37806_RFI-0163 - CLO - AECOM-RFI-096 follow Up to RFI-119.pdf",
        filePath: "P6\\24 - RFI'S\\A37806 RFI TO MTA\\A37806_RFI-0163 - CLO - AECOM-RFI-096 follow Up to RFI-119.pdf",
        docCategory: "rfi",
        chunkCount: 72,
      })
    );

    expect(referencesTheRfi.disqualified).toBe(false);
    expect(referencesTheRfi.conflictingFields.join()).toMatch(/identifier_extra:/);
    expect(referencesTheRfi.score).toBeLessThan(isTheRfi.score - 1);
  });

  it("never accepts a substitute revision when one was requested", () => {
    const requested = extractRequestedIdentity("What does revision 1 of the coordination minutes say?");
    expect(requested.revision).toBe("R01");
    const result = scoreIdentity(requested, describeFileIdentity(CORPUS.gen042r00Minutes!));
    expect(result.disqualified).toBe(true);
    expect(result.conflictingFields).toContain("revision:R00");
  });
});

// ============================================================
// Step 4 — natural-language identity
// ============================================================

describe("scoreIdentity — natural-language references", () => {
  const question =
    "In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings or schedule benefits are claimed?";

  it("locks the May 13 2025 Burnside VECP presentation", () => {
    const result = score(question, "vecpMay13");
    expect(result.disqualified).toBe(false);
    expect(result.matchedFields).toEqual(
      expect.arrayContaining(["date:2025-05-13", "title:vecp", "station:BUR", "type:presentation"])
    );
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("rejects the generic May 5–7 Burnside work document that shares only the station", () => {
    // The regression this stage exists for: the old file-name scorer locked this
    // file because it matched "Burnside", "Ave", "2025" and a "5".
    const result = score(question, "burnsideEmdMay5");
    expect(result.disqualified).toBe(true);
    expect(result.conflictingFields).toContain("title:missing:vecp");
    expect(result.score).toBeLessThan(score(question, "vecpMay13").score);
  });

  it("scores the March 6 VECP minutes below the May 13 presentation", () => {
    const march = score(question, "vecpMarch6Minutes");
    expect(march.conflictingFields.some((field) => field.startsWith("date:"))).toBe(true);
    expect(march.score).toBeLessThan(score(question, "vecpMay13").score);
  });

  it("does not let a file inherit its folder's subject", () => {
    // "Base markups.pdf" sits inside a "Burnside Ave VECP Presentation" folder.
    // A path match supports a candidate but can never confirm the title quorum.
    const result = score(question, "vecpBaseMarkups");
    expect(result.disqualified).toBe(true);
    expect(result.conflictingFields).toContain("title:missing:vecp");
  });

  it("keeps stations apart for a month-precision photo reference", () => {
    const photos = "In the Myrtle December 2025 Construction Photos, what work is documented?";
    const myrtle = score(photos, "myrtleDec2025Photos");
    const burnside = score(photos, "burnsideDec2025Photos");
    const wrongMonth = score(photos, "myrtleMarch2026Photos");

    expect(myrtle.disqualified).toBe(false);
    expect(myrtle.matchedFields).toEqual(
      expect.arrayContaining(["date:2025-12", "station:MYR", "type:photo"])
    );
    expect(burnside.conflictingFields).toContain("station:BUR");
    expect(burnside.score).toBeLessThan(myrtle.score);
    expect(wrongMonth.conflictingFields.some((field) => field.startsWith("date:"))).toBe(true);
    expect(wrongMonth.score).toBeLessThan(myrtle.score);
  });

  it("locks the September 3 2025 coordination meeting minutes", () => {
    const result = score(
      "In the September 3, 2025 A37806 & C49321R Coordination Meeting Minutes, what action items were recorded?",
      "gen042r00Minutes"
    );
    expect(result.disqualified).toBe(false);
    expect(result.matchedFields).toEqual(
      expect.arrayContaining(["date:2025-09-03", "contract:A37806", "type:meeting_minutes"])
    );
  });

  it("rejects a same-identifier document with a different subject", () => {
    // GEN-042R00 is reused across spec sections, so the identifier alone cannot
    // disambiguate — the title terms must.
    const result = score(
      "In the September 3, 2025 A37806 & C49321R Coordination Meeting Minutes, what action items were recorded?",
      "gen042r00Schedule"
    );
    expect(result.disqualified).toBe(true);
  });
});

describe("titleTermQuorum", () => {
  it("requires at least half the requested title terms, and never zero of them", () => {
    expect(titleTermQuorum(0)).toBe(0);
    expect(titleTermQuorum(1)).toBe(1);
    expect(titleTermQuorum(2)).toBe(1);
    expect(titleTermQuorum(3)).toBe(2);
    expect(titleTermQuorum(4)).toBe(2);
  });
});

// ============================================================
// Same-document collapsing
// ============================================================

describe("identityFamilyKey", () => {
  it("collapses the same document across formats and token order", () => {
    expect(identityFamilyKey(CORPUS.vecpMay13!.fileName)).toBe(
      identityFamilyKey(CORPUS.vecpMay13Pptx!.fileName)
    );
  });

  it("collapses dispositions of the same submittal", () => {
    expect(identityFamilyKey(CORPUS.gen042r00Minutes!.fileName)).toBe(
      identityFamilyKey(CORPUS.gen042r00MinutesOrig!.fileName)
    );
  });

  it("keeps different revisions and different documents apart", () => {
    expect(identityFamilyKey(CORPUS.gen042r00Minutes!.fileName)).not.toBe(
      identityFamilyKey(CORPUS.gen042r01Minutes!.fileName)
    );
    expect(identityFamilyKey(CORPUS.vecpMay13!.fileName)).not.toBe(
      identityFamilyKey(CORPUS.vecpMarch6Minutes!.fileName)
    );
  });
});

describe("describeFileIdentity", () => {
  it("reads identity from the file name and path", () => {
    const identity = describeFileIdentity(CORPUS.myrtleDec2025Photos!);
    expect(identity.stationCode).toBe("MYR");
    expect(identity.revision).toBe("R00");
    expect(identity.contract).toBe("A37806");
    expect(identity.documentTypes).toContain("photo");
    expect(identity.dates.map((d) => d.iso)).toContain("2025-12");
    expect(identity.identifiers.map((id) => id.valueNormalized)).toContain("MYR076R00");
  });

  it("does not let the folder claim a document type for the file", () => {
    // "Base markups.pdf" lives under a "…VECP Presentation…" folder but is not one.
    const identity = describeFileIdentity(CORPUS.vecpBaseMarkups!);
    expect(identity.documentTypes).not.toContain("presentation");
  });
});
