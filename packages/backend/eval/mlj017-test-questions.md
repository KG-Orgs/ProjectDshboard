# MLJ-017 Package 6 Eval Test Questions

**Project:** `731cfd5d-e647-4551-89e7-0a3cc4915115` — MLJ-017 Package 6 - General (TEST CLONE)

Grounded in live indexed corpus (Tier 2). Run with `pnpm eval:mlj017` from `packages/backend`.

| ID | Bucket | Query | Expected file pattern(s) | Grounding |
|----|--------|-------|--------------------------|-----------|
| find-01 | find | Volume 06 Track Specifications A37806 | `Volume_06_Track_Specifications` | Bid RFP Vol 06 (1849 chunks) |
| find-02 | find | Volume 05 Project Requirements and Design Criteria PRDC | `Volume_05_Project_Requirements` | Bid RFP Vol 05 (2778 chunks) |
| find-03 | find | April 26 schedule update station schedules | `April 26 Schedule Update` | 07 - SCHEDULE (436 chunks) |
| find-04 | find | Design Build Baseline Schedule 01 32 01 | `01_32_01-002R00` | Baseline schedule docx (138 chunks) |
| find-05 | find | Hydraulic Elevator Equipment section 14 24 00 | `14 24 00 Hydraulic Elevator` | 02 - DESIGN spec (101 chunks) |
| find-06 | find | Division 22 plumbing common work results | `Division_22` | Conformed spec (353 chunks) |
| find-07 | find | Burnside SOGR full report B225 B236 | `B225 TO B236 WEB SOGR` | SOGR inspection (63 chunks) |
| find-08 | find | Design-Build Agreement fully executed | `Design-Build Agreement - Fully Executed` | Executed DBA (1378 chunks) |
| find-09 | find | Middletown Road fire alarm system submission | `Middletown Rd_FA system` | FA workshop (632 chunks) |
| find-10 | find | Concrete Repair Procedures MTA GEN-009 | `GEN-009R00` | Submittal (34 chunks) |
| answer-01 | answer | UPS backup duration for communications per PRDC 07 | `RFI063` | RFI-063 (5 chunks) |
| answer-02 | answer | QWP-001 quality risks for concrete formwork | `QWP-001` | QWP-001 (22 chunks) |
| answer-03 | answer | ASME elevator codes for hydraulic elevators | `14 24 00 Hydraulic Elevator` | Spec 14 24 00 |
| answer-04 | answer | DRFI-0059 stairs roof deck details | `DRFI-0059` | DRFI-0059 (14 chunks) |
| answer-05 | answer | Burnside LOE milestone % on April 2026 schedule | `April 26 Schedule Update` | Schedule milestone data |
| answer-06 | answer | Section 22 05 00 plumbing scope | `Division_22` | Division 22 spec |
| answer-07 | answer | Car clearance requirements in Volume 06 track specs | `Volume_06_Track` | Track specifications |
| answer-08 | answer | Sika Backer Rod use in expansion joints | `Expansion Joints Backer Rod` | GEN-007R01 submittal |
| answer-09 | answer | MS-20 contractual ADA milestone | `April 26 Schedule Update` | Schedule milestones |
| answer-10 | answer | Build America Buy America plumbing submittals | `Division_22` | Division 22 §1.05 |
| answer-11 | answer | RFI 063 data cabinet AC on UPS subject | `RFI063` | RFI-063 |
| answer-12 | answer | Stations in ADA Package 6 per track volume | `Volume_06_Track_Specifications` | Vol 06 cover |
| identifier-01 | identifier | QWP-001 | `QWP-001` | document_identifiers QWP1 |
| identifier-02 | identifier | RFI-063 | `RFI063` | document_identifiers RFI63 |
| identifier-03 | identifier | GEN-009R00 concrete repair | `GEN-009R00` | SUBMITTAL GEN009R00 |
| identifier-04 | identifier | BUR-042R01 SOGR Burnside | `BUR-042R01` | SUBMITTAL BUR042R01 |
| identifier-05 | identifier | DRFI-0059 | `DRFI-0059` | DRFI in 24 - RFI'S |
| identifier-06 | identifier | CSI 01 40 10 QWP concrete | `01 40 10` / `QWP-001` | QWP file CSI tag |
| ambiguous-01 | ambiguous | Burnside station construction schedule | `Burnside` + `Schedule` | Multiple schedule files |
| ambiguous-02 | ambiguous | EDU06 track traction power drawings | `EDU06` | Copies per station |
| ambiguous-03 | ambiguous | expansion joint specs and submittals | `Expansion Joint` / `Backer Rod` | PRDC + submittal |
| ambiguous-04 | ambiguous | Avenue I comments matrix | `Avenue I` + `Comments Matrix` | Many matrix versions |
| not_found-01 | not_found | offshore wind farm turbine foundations | (none — low relevance) | 0 chunk hits |
| not_found-02 | not_found | cryptocurrency mining electrical | (none) | 0 chunk hits |
| not_found-03 | not_found | Mars colony habitat standards | (none) | 0 chunk hits |
| not_found-04 | not_found | nuclear fusion reactor installation | (none) | 0 chunk hits |

**Bucket counts:** find 10 · answer 12 · identifier 6 · ambiguous 4 · not_found 4 · **total 36**
