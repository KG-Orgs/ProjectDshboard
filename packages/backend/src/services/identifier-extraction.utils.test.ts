import { describe, expect, it } from "vitest";
import {
  documentFamilyKey,
  extractIdentifiers,
  extractPathMetadata,
  normalizeIdentifier,
  revisionNumber,
  statusApprovedRank,
} from "./identifier-extraction.utils";

describe("normalizeIdentifier", () => {
  it("collapses leading zeros + separators for QWP (the exact-match priority)", () => {
    // Real §4a variants for the same plan all collapse to one key.
    expect(normalizeIdentifier("QWP", "QWP-005")).toBe("QWP5");
    expect(normalizeIdentifier("QWP", "QWP 5")).toBe("QWP5");
    expect(normalizeIdentifier("QWP", "QWP05")).toBe("QWP5");
    expect(normalizeIdentifier("QWP", "QWP-35")).toBe("QWP35");
    expect(normalizeIdentifier("QWP", "QWP-012")).toBe("QWP12");
  });

  it("collapses leading zeros for SWP / CWP / RFI / DRFI / PRDC", () => {
    expect(normalizeIdentifier("SWP", "SWP-026")).toBe("SWP26");
    expect(normalizeIdentifier("CWP", "CWP-022")).toBe("CWP22");
    // RFI padding is inconsistent in the corpus (RFI095 vs RFI-0102).
    expect(normalizeIdentifier("RFI", "RFI095")).toBe("RFI95");
    expect(normalizeIdentifier("RFI", "RFI-0102")).toBe("RFI102");
    expect(normalizeIdentifier("RFI", "RFI006")).toBe("RFI6");
    expect(normalizeIdentifier("DRFI", "DRFI-0041")).toBe("DRFI41");
    expect(normalizeIdentifier("PRDC", "PRDC06")).toBe("PRDC6");
  });

  it("keeps all six digits for CSI / spec sections", () => {
    expect(normalizeIdentifier("CSI", "03 30 00")).toBe("033000");
    expect(normalizeIdentifier("CSI", "033000")).toBe("033000");
    expect(normalizeIdentifier("CSI", "01 40 10")).toBe("014010");
    expect(normalizeIdentifier("CSI", "051200")).toBe("051200");
    expect(normalizeIdentifier("CSI", "Section 03 30 00")).toBe("033000");
  });

  it("keeps zeros + status suffixes for submittal control / CO / NCR", () => {
    expect(normalizeIdentifier("SUBMITTAL", "GEN-023R00")).toBe("GEN023R00");
    expect(normalizeIdentifier("SUBMITTAL", "MYR-013R01")).toBe("MYR013R01");
    expect(normalizeIdentifier("CO", "CO-002E")).toBe("CO002E");
    expect(normalizeIdentifier("CO", "CO-005N")).toBe("CO005N");
    expect(normalizeIdentifier("NCR", "NCR-006")).toBe("NCR006");
    expect(normalizeIdentifier("NCR", "NCR-A37806-2025-001")).toBe("NCRA378062025001");
  });

  it("handles design units, transmittals and mods", () => {
    expect(normalizeIdentifier("DU", "DU04")).toBe("DU4");
    expect(normalizeIdentifier("EDU", "EDU01D")).toBe("EDU1D");
    expect(normalizeIdentifier("TRANSMITTAL", "Transmittal 0009")).toBe("TRANSMITTAL9");
    expect(normalizeIdentifier("MOD", "MOD-03")).toBe("MOD3");
  });
});

describe("extractIdentifiers", () => {
  it("extracts multiple identifiers from a submittal filename (whole-name scan)", () => {
    // Real example from §4a: control number + CSI section + secondary QWP.
    const ids = extractIdentifiers(
      "A37806_01 40 10_GEN-023R00 - R&R - QWP-005- Excavation.pdf",
      "05 - SUBMITTALS/01 40 10 Quality Management/A37806_01 40 10_GEN-023R00 - R&R - QWP-005- Excavation.pdf"
    );
    const byType = new Map(ids.map((id) => [id.type, id.valueNormalized]));
    expect(byType.get("SUBMITTAL")).toBe("GEN023R00");
    expect(byType.get("CSI")).toBe("014010");
    expect(byType.get("QWP")).toBe("QWP5");
  });

  it("extracts CWP and the submittal control number together", () => {
    const ids = extractIdentifiers(
      "A37806_GEN-059R00 - AEAN - CWP-022 - State of Good Repairs.pdf"
    );
    const byType = new Map(ids.map((id) => [id.type, id.valueNormalized]));
    expect(byType.get("SUBMITTAL")).toBe("GEN059R00");
    expect(byType.get("CWP")).toBe("CWP22");
  });

  it("extracts PRDC-prefixed control numbers and the procurement package", () => {
    const ids = extractIdentifiers("A37806_PRDC04_AVI-002R00 - ORIG - Service Load Letter.pdf");
    const byType = new Map(ids.map((id) => [id.type, id.valueNormalized]));
    expect(byType.get("SUBMITTAL")).toBe("AVI002R00");
    expect(byType.get("PRDC")).toBe("PRDC4");
  });

  it("distinguishes DRFI from RFI", () => {
    const drfi = extractIdentifiers("A37806 DRFI-0041 to AECOM.pdf");
    expect(drfi.some((id) => id.type === "DRFI" && id.valueNormalized === "DRFI41")).toBe(true);
    expect(drfi.some((id) => id.type === "RFI")).toBe(false);

    const rfi = extractIdentifiers("A37806 RFI095 response.pdf");
    expect(rfi.some((id) => id.type === "RFI" && id.valueNormalized === "RFI95")).toBe(true);
  });

  it("does not match identifier prefixes embedded in words", () => {
    // "CO" in CONCRETE/CORRESPONDENCE, "DU" in SCHEDULE must not match.
    const ids = extractIdentifiers("03 - CONCRETE schedule correspondence.pdf");
    expect(ids.some((id) => id.type === "CO")).toBe(false);
    expect(ids.some((id) => id.type === "DU")).toBe(false);
  });

  it("matches the same plan across format variants to one normalized key", () => {
    const a = extractIdentifiers("QWP-005 plan.pdf").find((id) => id.type === "QWP");
    const b = extractIdentifiers("Quality Work Plan QWP 5.pdf").find((id) => id.type === "QWP");
    expect(a?.valueNormalized).toBe("QWP5");
    expect(b?.valueNormalized).toBe("QWP5");
  });
});

describe("extractPathMetadata", () => {
  it("derives contract, doc type, discipline, station, revision and status", () => {
    const meta = extractPathMetadata(
      "A37806_01 40 10_GEN-023R00 - R&R - QWP-005- Excavation.pdf",
      "MLJ-017 Package 6/05 - SUBMITTALS/01 40 10 Quality Management/A37806_01 40 10_GEN-023R00 - R&R - QWP-005- Excavation.pdf"
    );
    expect(meta.contractNumber).toBe("A37806");
    expect(meta.docType).toBe("05 - SUBMITTALS");
    expect(meta.docCategory).toBe("submittal");
    expect(meta.station).toBe("GEN");
    expect(meta.stationName).toBe("General");
    expect(meta.revision).toBe("R00");
    expect(meta.statusCode).toBe("R&R");
    expect(meta.specSection).toBe("01 40 10");
  });

  it("maps the RFI top-level folder to the rfi category", () => {
    const meta = extractPathMetadata(
      "A37806 RFI095 response.pdf",
      "MLJ-017/24 - RFI'S/A37806 RFI TO MTA/A37806 RFI095 response.pdf"
    );
    expect(meta.docCategory).toBe("rfi");
  });

  it("derives station + revision for a Myrtle Ave submittal", () => {
    const meta = extractPathMetadata(
      "A37806_051200_MYR-013R01-ORIG-Myrtle Ave Work Train Manlift Plan-AAN.pdf",
      "05 - SUBMITTALS/05 - METALS/A37806_051200_MYR-013R01-ORIG-Myrtle Ave Work Train Manlift Plan-AAN.pdf"
    );
    expect(meta.station).toBe("MYR");
    expect(meta.revision).toBe("R01");
    expect(meta.specSection).toBe("05 12 00");
  });
});

describe("family resolution ranking", () => {
  it("ranks approved/closed statuses above revise-and-resubmit", () => {
    expect(statusApprovedRank("APP")).toBeGreaterThan(statusApprovedRank("R&R"));
    expect(statusApprovedRank("NET")).toBeGreaterThan(statusApprovedRank("ORIG"));
    expect(statusApprovedRank("CLO")).toBeGreaterThan(statusApprovedRank("APP"));
  });

  it("parses revision numbers for ordering", () => {
    expect(revisionNumber("R04")).toBe(4);
    expect(revisionNumber("R00")).toBe(0);
    expect(revisionNumber(undefined)).toBe(-1);
  });
});

describe("documentFamilyKey", () => {
  it("collapses format + disposition + copy variants of the same document", () => {
    const a = documentFamilyKey("A37806_DRFI-0078 - CLO - Follow up to DRFI-0046 Myrtle Ave Platform EL Entrance.pdf");
    const b = documentFamilyKey("A37806_DRFI-0078 - Follow up to DRFI-0046 Myrtle Ave Platform EL Entrance.docx");
    const c = documentFamilyKey("A37806_DRFI-0078 - Follow up to DRFI-0046 Myrtle Ave Platform EL Entrance.pdf");
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a.length).toBeGreaterThan(0);
  });

  it("collapses trailing dash-run and '- Copy' duplicate markers", () => {
    expect(documentFamilyKey("2026-03-03 Cary Winston Access pass 2026 signed.pdf")).toBe(
      documentFamilyKey("2026-03-03 Cary Winston Access pass 2026 signed--.pdf")
    );
    expect(documentFamilyKey("A37806_01 33 10_GEN001R00_.docx")).toBe(
      documentFamilyKey("A37806_01 33 10_GEN001R00_ - Copy.docx")
    );
  });

  it("keeps genuinely different revisions distinct (no over-collapse)", () => {
    const r00 = documentFamilyKey("A37806_01 40 10_GEN-003R00 - R&R - Design Project Specific Quality Management Plan.pdf");
    const r02 = documentFamilyKey("A37806_01 40 10_GEN-003R02 - ORIG - Design Project Specific Quality Management Plan.pdf");
    expect(r00).not.toBe(r02);
  });

  it("returns empty for names too short to be a safe family discriminator", () => {
    expect(documentFamilyKey("A1.pdf")).toBe("");
  });
});
