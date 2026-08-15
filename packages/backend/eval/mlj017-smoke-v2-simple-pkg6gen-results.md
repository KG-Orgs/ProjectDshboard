# MLJ-017 Smoke Questions v2 — Eval Results
**Project:** MLJ-017 Package 6 - General (`145b3dcf-272e-4c45-9e19-953f20f25bb9`)  
**Run date:** 2026-07-17  
**Questions:** 97  
**Source file:** `mlj017-smoke-v2-simple-pkg6gen-batch-input.json`  
**Raw output:** `mlj017-smoke-v2-simple-pkg6gen-output.txt`

---

## Summary Scorecard

| Verdict | Count | % |
|---|---|---|
| ✅ PASS — correct, grounded answer | 17 | 17.5% |
| 🟡 PARTIAL — right file, incomplete answer | 12 | 12.4% |
| ❌ WRONG FILE — retrieved wrong document | 21 | 21.6% |
| ⬜ ZERO CHUNKS — file found, no indexed content | 47 | 48.5% |

**Effective answer rate (PASS + PARTIAL): ~30%**

---

## How the System Gets Its Answers

Each question goes through this pipeline:
1. **Intent classification** — The coordinator classifies the query (e.g., `contract_notice`, `general_qa`) and assigns a confidence score. High-confidence rules (e.g., `contract_notice` at 0.78) restrict retrieval to relevant document categories (contracts, correspondence). `general_qa` fallback (0.55) searches all categories.
2. **Hybrid retrieval** — Combines vector similarity (semantic, up to 72–168 candidates) with BM25 lexical matching. Merged candidates ranked by reciprocal rank fusion.
3. **Source selection** — Top-8 sources passed to specialist agents (`doc_agent`, `sched_agent`, `cost_agent`).
4. **Answer generation** — Agents synthesize an answer, cite chunk-level evidence with relevance scores, and indicate page provenance. A `rel` score of 1.000 = vector match; higher scores (e.g., 10.000) = lexical/exact match boosted.

---

## Per-Question Results

### CHANGE ORDER (sq01)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq01 | GEN-042R00 subcontractor review | ⬜ ZERO CHUNKS | Found Volume 05 PRDC; no indexed passage for GEN-042R00 change order content | `A37806_Volume 05_PRDC 01 General_Rev. 1.pdf` |

**Issue:** File found but no text chunks indexed for this file.

---

### CONTRACT (sq02–sq10)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq02 | Island Pavement subcontract scope/pricing | 🟡 PARTIAL | Retrieved info from RFI-0177 (resume page) showing $1,829,462 contract value and spray waterproofing scope — pulled from a subcontractor resume attachment, not the actual subcontract. Hybrid: 28 candidates (4 lexical hits on "Island Pavement"). | `A37806_RFI-0177`, `M017_MLJ_IslandPavement_Subcontract_Executed_20250923.pdf` (zero chunks) |
| sq03 | Island Pavement joint sealing work | 🟡 PARTIAL | Retrieved Articulous Joints, Evazote Joint systems, Bridge Preservation® spray — again from RFI-0177, not the subcontract itself. Right general topic, wrong source document. | Same as sq02 |
| sq04 | MTACD-MLJTC2-L-0024 subcontractor approval | ⬜ ZERO CHUNKS | Right file found but no indexed content | `2025-03-19 MTACD-MLJTC2-L-0024...pdf` |
| sq05 | GEN-001R05 Phasing Plan | ❌ WRONG FILE | Retrieved PS LAN meeting agenda instead of the phasing plan. Intent classified as `scheduling/documents` — retrieval anchored on "GEN-001" but matched wrong document. | `A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx` |
| sq06 | RFP Addendum 02 Pre-Proposal Slideshow | ⬜ ZERO CHUNKS | Right file found but no indexed content (likely scanned PDF or image-heavy PPT) | `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf` |
| sq07 | GEN-027R00 Contract Specific Responsibility Form | ❌ WRONG FILE | **Document number collision:** GEN-027R00 exists as both "Subcontractor Approval Forms for Crossroads JV" AND a "Preliminary Project Specification List." System retrieved the Spec List version. Answer correctly identified the mismatch. | `A37806_01 40 10_GEN-027R00 - PACKAGE 6 - PRELIMINARY PROJECT SPECIFICATION LIST.pdf` |
| sq08 | GEN-027R00 JV ownership percentage | ❌ WRONG FILE | Same collision as sq07 | Same wrong file |
| sq09 | M017_IMP Draft Subcontract payment exclusions | ⬜ ZERO CHUNKS | Right file found but no indexed content | `M017_IMP_Draft Subcontract_20251024.docx` |
| sq10 | M017_IMP entire agreement clause | ⬜ ZERO CHUNKS | Same file, same issue | Same |

**Root cause for sq04, sq13–sq17:** All MTACD subcontractor approval letters are PDFs with zero indexed chunks — the files need re-indexing.

---

### CORRESPONDENCE (sq11–sq17)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq11 | Transmittal 0014 items/status | ⬜ ZERO CHUNKS | Right file found but no indexed content | `A37806 Transmittal 0014 - MTA Personnel and PMC Supplies.pdf` |
| sq12 | Myrtle Ave Reserve Service Load Letter | ❌ WRONG FILE | Retrieved a `.HEIC` photo file (image format — unindexable). Asked clarifying question about topic. | `MYR_Reserve service.HEIC` |
| sq13 | MTACD-MLJTC2-L-0017 approval | ⬜ ZERO CHUNKS | Right file found, no content | `...L-0017 Subcontractor Approval MASE FX $109,450.pdf` |
| sq14 | MTACD-MLJTC2-L-0028 approval | ⬜ ZERO CHUNKS | Right file found, no content | `...L-0028 Sub-Contractor Approval Titanium Linx Consulting.pdf` |
| sq15 | MTACD-MLJTC2-L-0049 approval | ⬜ ZERO CHUNKS | Right file found, no content | `...L-0049 Sub-Contractor Approval McVac Environmental.pdf` |
| sq16 | MTACD-MLJTC2-L-0083 approval | ⬜ ZERO CHUNKS | Right file found, no content | `...L-0083 Sub-Contractor Approval American Geophysics.pdf` |
| sq17 | MTACD-MLJTC2-L-0093 approval | ⬜ ZERO CHUNKS | Right file found, no content | `...L-0093 Sub-Contractor Approval Tri-State Civil.pdf` |

**Pattern:** All MTA subcontractor approval letters (L-xxxx series PDFs) returned zero chunks. These need targeted re-indexing.

---

### DRAWING (sq18–sq25)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq18 | AVI-002R01 rebar sizes/elevator pit mat | ⬜ ZERO CHUNKS | Retrieved R00 version, not R01; no indexed content | `A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings.pdf` |
| sq19 | AVI-002R01 submittal number/review status/spec section | ✅ PASS | Found AVI-002R01 FIO version. Answer: Submittal shows "FOR APPROVAL Rev 1 02/11/2026, AAN per EOR Markups." Spec section 03 20 00. Citation rel=1.000 from pages 4–5. | `A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf` |
| sq20 | BUR-009R00 glazing spec items | ⬜ ZERO CHUNKS | Right file found (AAN version), no indexed text | `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf` |
| sq21 | BUR-009R00 NYCT/MTA review status | ⬜ ZERO CHUNKS | Right file found (FIO version), no indexed text | `A37806_14 24 00_BUR-009R00 - FIO - EL539 Cab and Entrance Drawings-MTA.pdf` |
| sq22 | BUR-001R00 review status | ❌ WRONG FILE | Retrieved MLJTC2_AECOM_ATC Burnside drawings instead of BUR-001R00 enclosure shop drawings | `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf` |
| sq23 | BUR-001R00 approval/comments | ✅ PASS | Retrieved BUR-001R00 FIO version. Answer: **Approved as Noted** (AAN) by C. O'Neill/Arch., review date 06/15/2026. No specific markups beyond AAN status. Citation rel=10.000 (exact match from lexical). | `A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf` |
| sq24 | Spec requirements for controlled fills near elevator | 🟡 PARTIAL | Found controlled fills requirements from PRDC Volume 05 (p. 434): fill types, three compaction tests required, field density testing. General spec, not elevator-specific. Hybrid pulled 168 merged candidates. | Multiple PRDC volumes (all cross-reference p.434, 1063) |
| sq25 | GEN-001R02 Elevator Walls Formwork submittal designation | ❌ WRONG FILE | Pulled phasing plan comment log (GEN-001R02 Phasing Plan) instead of elevator walls formwork drawing — same submittal number assigned to different document. | `A37806_01 10 30_GEN-001R02 - Phasing Plan Operations Planning Comment Log.xlsx` |

---

### INVOICE (sq26–sq33)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq26 | Invoice 11707 pest control locations | ✅ PASS | Joe's Pest Control, Middletown Stations. 3 service orders: Feb 5 (SO 8780), Feb 12 (SO 3029), Feb 19 (SO 3086). Hybrid: 72 vector + 1 lexical. | `Invoice 11707.pdf` p.1 |
| sq27 | Invoice 11830 Middletown April service orders | ✅ PASS | 5 service orders: SO 3421 (4/2), SO 3488 (4/9), SO 3548 (4/16), SO 3645 (4/23), SO 3557 (4/26). Citation rel=0.970. | `Correction invoice 118350.pdf` p.1 |
| sq28 | Lockton Invoice 0849812 remittance | ⬜ ZERO CHUNKS | Right file found, no indexed content | `2025 Lockton Invoice 0849812.pdf` |
| sq29 | Lockton Invoice 0849812 total amount | ⬜ ZERO CHUNKS | Same file, same issue | Same |
| sq30 | Backup Invoice#01 Dec 6 lead abatement | ⬜ ZERO CHUNKS | Right file found, no indexed content | `Backup for Invoice#01.pdf` |
| sq31 | Backup Invoice#01 Dec 7 lead abatement | ⬜ ZERO CHUNKS | Same | Same |
| sq33 | Invoice#01 G703 retainage | ❌ WRONG FILE | Retrieved Eagle Business Machine invoice instead of Invoice#01. Intent `cost` domain — hit lexical match on "invoice" but wrong document. | `2025-10-21 Eagle Business Machine Inv# 129318.pdf` |

---

### MEETING MINUTES (sq34–sq43)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq34 | GEN-042R00 A37806 & C49321R Coordination Meeting | ⬜ ZERO CHUNKS | Right file found but answer says "document not found" — file found with no chunks | `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf` |
| sq35 | September 3, 2025 coordination meeting | ❌ WRONG FILE | Retrieved utility coordination report (GEN-009R00 Utility Coordination September 2025) instead of A37806 & C49321R meeting minutes | `A37806_01 35 70_GEN-009R00 - FIO - Utility Coordination - September 2025.pdf` |
| sq36 | Kick Off Pre-Work Conference content | ⬜ ZERO CHUNKS | Right file (PPTX) found but no indexed content | `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx` |
| sq37 | Kick Off milestones/work sequencing | ⬜ ZERO CHUNKS | Same PPTX, same issue | Same |
| sq38 | July 24 2025 meeting MLJ/TC Electric attendees | ⬜ ZERO CHUNKS | Right file found, no indexed content | `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf` |
| sq39 | July 24 2025 meeting external consultants | ⬜ ZERO CHUNKS | Same file | Same |
| sq40 | May 28 2026 meeting CPR-003 Rev 2 status | ⬜ ZERO CHUNKS | Right file found, no indexed content | `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf` |
| sq41 | May 28 2026 Grade Operations distribution | ⬜ ZERO CHUNKS | Same file | Same |
| sq42 | SDI-MLJ Dec 19 2025 action items | ✅ PASS | Full action item list with target dates: OCIP/surveyor by 12/22, SWPs/QWPs by 01/14, QMP by 01/14, mullion sample by 01/09, roofing sample by 12/26, shop drawing statuses. Citations rel=1.000 (4 chunks). | `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx` |
| sq43 | SDI-MLJ OCIP/surveyor approval status | ✅ PASS | OCIP pending from MTA; surveyor approval target 12/22/2025, SDI responsible. | Same file |

**Pattern:** Monthly Progress Reports (PDF) universally returned zero chunks. SDI agenda (DOCX) worked well — DOCX parsing is more reliable than scanned PDF.

---

### PERMIT (sq44–sq49)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq44 | Burnside Ave current permits | 🟡 PARTIAL | Found DOT permit request reference (4-23-26 new DOT permits Burnside) and permit file reference. Hybrid pulled 127 mixed candidates. Answer partial — identifies permit request but limited detail. | `4-23-26 SIG REQ NEW DOT PERMITS - Burnside Ave Station.pdf` |
| sq45 | Ave I current permits | 🟡 PARTIAL | Listed permit submittal files: AVI-001R00 DOT Permits exp 05.30.25 and AVI-002R00 Tree Work Permits. No permit content detail. | `A37806_01 33 10_AVI-001R00`, `AVI-002R00` |
| sq46 | Myrtle Ave current permits | ✅ PASS | Multiple permits with dates: DOT permits exp 11/07 & 11/21/25 (issued 10/17/25), amended versions, new permits exp 11/21/25 (issued 9/5/25), and newer permits exp 3/08 & 3/13/26. Permit type: 0112P (Rapid Transit Construct/Alteration). | Multiple Myrtle DOT permit PDFs |
| sq47 | Middletown Ave current permits | 🟡 PARTIAL | Listed all 14+ MDT permit submittal file names (MDT-001R00 through MDT-016R00, plus WE1 permit). No content from within files. | File listing only |
| sq48 | Norwood Ave current permits | ✅ PASS | Detailed: 1 new/amended DOT permit (exp 9/24/25), 12 renewed permits at Fulton St (exp 6/1/26, issued 3/16/26), 1 renewed permit exp 1/31/26, hydrant permit #H326736. | Multiple NOR permit files |
| sq49 | MDT-005R00 Middletown Tree Work Permit nursery standards | ⬜ ZERO CHUNKS | Right file found, no indexed content | `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf` |

---

### PHOTO (sq54–sq59)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq54 | BUR-081R00 January 2026 NB work Jan 20 | ⬜ ZERO CHUNKS | Right file found, zero chunks (photos PDF has image content only) | `A37806_01 32 10_BUR-081R00 - FIO - January 2026 Construction Photos.pdf` |
| sq55 | BUR-081R00 MPT setup/ConEd relocation | ⬜ ZERO CHUNKS | Same file | Same |
| sq56 | BUR-080R00 December 2025 track shielding | ❌ WRONG FILE | Retrieved a `.jpg` photo file instead of BUR-080R00 | `Photo Apr 02 2025, 8 12 26 AM.jpg` |
| sq57 | BUR-080R00 MPT setup northbound | ❌ WRONG FILE | Same wrong jpg file | Same |
| sq58 | MYR-076R00 December 2025 ADA work | ⬜ ZERO CHUNKS | Right file found, zero chunks | `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf` |
| sq59 | MYR-076R00 submittal designation | ⬜ ZERO CHUNKS | Same file | Same |

**Note:** Construction photo PDFs universally fail — scanned image content cannot be chunked/indexed without OCR or caption extraction.

---

### REPORT (sq60–sq65)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq60 | Burnside VECP Presentation value engineering background | ❌ WRONG FILE | Retrieved EMD inspection report for Burnside instead of the May 13 2025 VECP presentation | `0050 - A-37808 (76114) - EMD - Burnside Ave.pdf` |
| sq61 | Burnside VECP ADA scope/final presentation date | ❌ WRONG FILE | Retrieved Volume 08A BX Burnside Option Work document | `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf` |
| sq62 | PRO 26-01 NCR flowchart roles | ❌ WRONG FILE | Retrieved Con Edison email msg file instead of PRO 26-01 document. Intent `contracts` — email semantically matched "nonconforming" keyword path. | `A37806 ADA P6 - Myrtle Ave - Con Edison - New Normal and Reserve services.msg` |
| sq63 | GEN-006R01 NCR Template & Log data fields | ✅ PASS | Found the NCR log with all required fields: Date, NCR No., Brief Description, Raised By, Date of Issuance, Location, Responsible Party, Disposition, Verification, Initial Status, Date Closed. Sourced from pages 4–5. | `A37806_01 40 10_GEN-006R01 - AEAN - NCR Template & Log.pdf` |
| sq64 | Summarize RFI-0203 Norwood J1 Track Limits | ✅ PASS | Comprehensive summary: Track J2 reassigned to MTA in-house forces; MLJTC2 directed to extend J1 track limits using already-procured material. Includes AECOM/MLJ/J-Track/TCE questions on contact rail, heat trace, traction power limits, best-fit coordination. April 27 email from TYLin (Jose Paredes) as official direction. Attached meeting notes from May 12 GO walkthrough. Citation from pages 1–4. | `A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf` |
| sq65 | J-TRACK-13A-041R00 Material I&T Request | ⬜ ZERO CHUNKS | Right file found, no indexed content | `A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar.PDF` |

---

### RFI (sq66–sq74)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq66 | RFI-0115 Louver Exhaust Face Velocity problem | 🟡 PARTIAL | Found the right file, extracted the key regulatory direction: velocity limit 400 FPM, oversized discharge louvers per manufacturer specs acceptable in lieu of 400 FPM limit on exterior EMR walls. Answer buried in section index dump rather than a clean narrative. Citations rel=1.000 from pages 1–4. | `A37806_RFI-0115 - Louver Exhaust Face Velocity.pdf` |
| sq67 | RFI098 Ave I Conductor Board issue | ⬜ ZERO CHUNKS | Right file found, no indexed content | `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf` |
| sq68 | RFI098 conductor board figures | ⬜ ZERO CHUNKS | Same file | Same |
| sq69 | A37806 RFI096 platform stair configurations | ❌ WRONG FILE | Retrieved RFI-0042 (PS LAN Norwood) — the number "096" semantically close to "0042" or "042" in vector space on this corpus | `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system_Norwood ONLY.pdf` |
| sq70 | A37806 RFI096 McDonald Avenue platform detail | ❌ WRONG FILE | Same wrong RFI | Same |
| sq71 | MYR-002R00 Demo Shield Drawing construction details | ❌ WRONG FILE | Retrieved MLJTC2_AECOM_ATC Myrtle drawings (archive drawings) instead of MYR-002R00 | `MLJTC2_AECOM_ATC_2_Myrtle Avenue Drawings.pdf` |
| sq72 | MYR-A-444A stainless steel panel/signage details | ❌ WRONG FILE | Retrieved "Myrtle Expansion Joint Pages from Archive Drawings" — old drawing file semantically related to station expansion/stainless panels | `Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf` |
| sq73 | RFI-0116 PS LAN followup direction | ❌ WRONG FILE | Retrieved RFI-0042 CLO Myrtle (PS LAN system) — close in content to RFI-0116. Number mismatch: 0116 vs 0042. | `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system_Myrtle ONLY.pdf` |
| sq74 | RFI-009 UPS Backup capacity | ✅ PASS | **"Replace existing UPS to support full load from both existing and new communications systems, plus an additional 40% or higher of capacity available for future use."** Systems must operate immediately upon loss of input power. Citation rel=1.000. | `806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf` p.1 |

---

### SAFETY (sq75–sq84)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq75 | GEN-096R04 SWP-016 cover sheet / response due date | ⬜ ZERO CHUNKS | Retrieved GEN-096**R02** version; "I do not have indexed text for a precise answer" | `A37806_01 35 10_GEN-096R02 - SWP-016- Elevator Steel & Enclosure (Day) 1 of 3.pdf` |
| sq76 | Summarize SWP-016 | ✅ PASS | Found standalone `SWP 016 + Attachment.pdf`. Summary: Safe Work Plan for Elevator Steel & Enclosure, crane operations focus, Middletown site, Contract A37806, MLJ as GC, Revision 4 dated 06/02/2026. Full content pages 1–8. Citations rel=1.000. | `SWP 016 + Attachment.pdf` |
| sq77 | GEN-041R01 SWP-011 dust control for saw cutting | ✅ PASS | Comprehensive answer: wet methods (HEPA-Vac, green dust, water hose direct to demo saw), Dust Control Plan, stop work if visible dust outside barricade, N95/½-face respirators, medical clearance required, 1926.1153 Table 1 compliance, lead painted steel protocols, rigid barriers. GEN-041R**05** (latest revision) used. Citation rel=9.000. | `A37806_01 35 10_GEN-041R05 - AEAN - SWP-011 - Platform Concrete Demo.pdf` p.22–24 |
| sq78 | Summarize SWP-011 | ❌ WRONG FILE | Retrieved **SWP-013** (Platform Barrier Installation, Contract A-37135) instead of SWP-011. Semantic overlap: both are safe work plans for platform work. | `SWP-013 Installation of Platform Barrier Revision 002.pdf` |
| sq79 | Summarize SWP-032 | ✅ PASS | Found standalone `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf`. Summary: formwork/rebar/concrete SWP, ADA Package 6, hazards for worksite entry, tools, delivery, formwork, rebar. R4. Citations rel=1.000 from pages 1–8. | `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf` |
| sq80 | Michael Wilson Aug 20 2025 letter on SWP-032 approval | ⬜ ZERO CHUNKS | System found SWP-032 file but the transmittal letter itself has no indexed content | Same SWP-032 file (no letter content) |
| sq81 | GEN-116R00 SWP-052 work hours/combustibles/notice | ✅ PASS | **Restricted hours:** no material movement 6:00–9:30 AM and 3:00–8:00 PM. **Combustibles:** no flammable materials inside enclosures, fire-rated wood with stamps visible. **Staircase closure:** two weeks' notice required. GEN-116R**01** (Rev 1) used. Citation rel=10.000 (exact lexical match). | `A37806_01 35 10_GEN-116R01 - APP - SWP-052 Mezzanine Stair Barricade.pdf` p.8 |
| sq82 | GEN-116R00 SWP-052 worksite entry/PPE | ✅ PASS | Full PPE requirements from pages 6–8: fall protection (PFAS) for >6', GFCI required for all electrical tools, daily tool inspection, 3-point ladder contact, heat/cold weather protocols, 24-hour notice for material deliveries, NYCT zero tolerance for drug/alcohol. | Same file |
| sq83 | GEN-021R00 Safety Coordinator responsibilities | ❌ WRONG FILE | **Document number collision:** GEN-021R00 exists as both "Safety Coordinator Submittal" AND "Single Mode Fiber Optic Cable Test Procedure" (spec 27 10 01). Retrieved the fiber optic version. | `A37806_27 10 01_GEN-021R00 - RWNC - Single Mode Fiber Optic Cable and Fiber Patch Cord Test Procedure.pdf` |
| sq84 | Summarize GEN-021R00 Safety Coordinator submittal | ❌ WRONG FILE | Same collision — summarized fiber optic test procedure as the "safety coordinator submittal." Confidence score was low (rel=1.000 but wrong document entirely). | Same wrong file |

---

### SCHEDULE (sq85–sq86)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq85 | Schedule Update 5 June 2025 Elevator 541 dates | ⬜ ZERO CHUNKS | Right file found, no indexed content | `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf` |
| sq86 | Schedule Update 5 EL1121 outage/Myrtle activities | ⬜ ZERO CHUNKS | Same file | Same |

---

### SPEC (sq87–sq95)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq87 | Spec 21 12 00 pipe hanger/expansion joint forces | 🟡 PARTIAL | Found the right spec document. Answer gave section index (headers: "2.12 PIPE HANGERS AND SUPPORTS [p.6]") and standards references (ANSI/AWWA, NFPA) rather than actual content of section 2.12. Spec text was in chunked form but specific hanger/expansion language not surfaced. | `21 12 00 - Fire-Suppression Standpipes REV 1.pdf` p.1–6 |
| sq88 | Spec 21 12 00 pitch requirements / track crossing | 🟡 PARTIAL | Same document, same limitation — returned section index dump again without specific pitch/track crossing language from section 3.3. Both sq87 and sq88 got identical answers. | Same |
| sq89 | BUR-042R01 EDU07 water leak requirements/lead abatement | ⬜ ZERO CHUNKS | Right file found (AAN version), no indexed content | `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf` |
| sq90 | BUR-042R01 structural notes/repair standards | ⬜ ZERO CHUNKS | Same file | Same |
| sq91 | Transmittal 212-NOR Norwood transfer girder | ⬜ ZERO CHUNKS | Right file found, no indexed content | `Transmittal 212-NOR Xfer Girder inspection.pdf` |
| sq92 | NOR-010R00 CCTV cover sheet designation | ⬜ ZERO CHUNKS | Right file found, no indexed content | `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings.pdf` |
| sq93 | NOR-010R00 sewer sections/NYCDEP IDs | ⬜ ZERO CHUNKS | Same file | Same |
| sq94 | EDU05B Electrical Long Lead cover page | 🟡 PARTIAL | Found GEN-038R01 EDU05B-BB. Retrieved transmittal letter details: To Ravi Jain (MLJTC2), from AECOM (Celine Liew), dated 11/11/2025, Contract A37806. Coordination with MTA C&D for Review and Approval. Also extracted drawing project number 12750, contract A-37806. Citations rel=1.000. Partial — calculation cover page details not surfaced separately. | `A37806_01 10 20_GEN-038R01 - APP - EDU05B-BB - (FINAL-100) - Long Lead Electrical (AVI, NOR).pdf` p.2–5 |
| sq95 | EDU05B panel/circuit data for spec secs 12 14 10, 25 43 18, 25 41 18 | 🟡 PARTIAL | Found pages 70, 73–74, 78 of the submittal. Retrieved switchboard specs (10 gauge steel, compartment isolation, bus tap connections) but did not surface the specific load schedule table rows for those three spec sections by name. | Same file p.70, 73, 74, 78 |

---

### SUBMITTAL (sq96–sq102)

| # | Question | Verdict | How it answered | Source |
|---|---|---|---|---|
| sq96 | GEN-014R00 Monthly Quality Report May 2025 activities | ❌ WRONG FILE | **Document number collision:** GEN-014R00 exists as both "Monthly Quality and Certification Report" (spec 01 40 10) AND "Utility Coordination Monthly Report" (spec 01 35 70). Retrieved the Utility Coordination version (February 2026). Answered with utility coordination content — wrong document entirely. | `A37806_01 35 70_GEN-014R00-FIO- Utility Coordination - February 2026.pdf` |
| sq97 | GEN-014R00 Monthly Quality Report submittal designation | 🟡 PARTIAL | Same wrong file, but correctly identified "For NYCT/MTA Information Only" designation from cover sheet (which happens to match FIO for both documents). | Same wrong file |
| sq98 | PRDC12-019R00 SikaGrout 212 application restrictions | ✅ PASS | **"Avoid application in direct sun and/or strong wind. Apply only to sound, prepared substrate. Do not add additional water after application as this may cause cracking. Protect freshly applied grout."** Temp restrictions: product 65–75°F, ambient >45°F, substrate >45°F. Pot life ~15 min. Retrieved from FIO (MTA-stamped) version. Citations rel=1.000 from p.16–18. | `A37806_PRDC12-019R00 - SikaGrout 212.pdf` (FIO version) |
| sq99 | PRDC12-019R00 USDA certifiable/packaging/ASTM C-827 | ⬜ ZERO CHUNKS | Retrieved APP (contractor) version — no indexed text. FIO version (retrieved for sq98) had content; APP version did not. | `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf` |
| sq100 | PRDC12-012R02 Lead Placard containment class | ⬜ ZERO CHUNKS | Right file found (ORIG version), no indexed content | `A37806_PRDC12-012R02 - ORIG - Lead Placard Package-Burnside.pdf` |
| sq101 | PRDC12-012R02 cover sheet abatement contractor | ⬜ ZERO CHUNKS | Retrieved R00 version (not R02), no indexed content. Version mismatch. | `A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf` |
| sq102 | PRDC12-019R00 compressive strength / flowability / working time | ⬜ ZERO CHUNKS | APP version retrieved again, no indexed content | Same as sq99 |

---

## Failure Analysis by Root Cause

### 1. Zero Chunks (47 questions — 48.5%) — BIGGEST ISSUE
Files are indexed in the project (file metadata visible) but no text chunks were extracted. Causes:
- **Scanned-image PDFs** (photos, some submittals, approval letters) — OCR not applied
- **DOCX/PPTX files that weren't processed** — some were (SDI agenda, SWPs), others weren't (Kick-Off PPTX, Monthly Reports)
- **Large multi-page drawing PDFs** — image-based drawing content (BUR-009, AVI-002R00)
- **Specific file-type gaps** — `.HEIC` image, `.jpg` photos

Files confirmed to need re-indexing:
| File pattern | Category |
|---|---|
| All `MTACD-MLJTC2-L-xxxx` approval letters | Correspondence |
| `Backup for Invoice#01.pdf` | Invoice |
| `2025 Lockton Invoice 0849812.pdf` | Invoice |
| All `GEN-0xxR00 FIO Monthly Progress Report` PDFs | Meeting Minutes |
| `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx` | Meeting |
| `A37806_01 32 10_GEN-032R00 Schedule Update 5.pdf` | Schedule |
| All construction photo PDFs (BUR-080, BUR-081, MYR-076) | Photo |
| `A37806_01 33 10_MDT-005R00 Tree Work Permit.pdf` | Permit |
| `J-TRACK-13A-041R00 Material I&T Request.PDF` | Report |
| `A37806_ADA P6_RFI098 Ave I Conductor Board.pdf` | RFI |
| `A37806_01 10 20_BUR-042R01 AAN EDU07 SOGR.pdf` | Spec |
| `A37806_33 14 15_NOR-010R00 CCTV Inspection.pdf` | Spec |
| `Transmittal 212-NOR Xfer Girder inspection.pdf` | Spec |

### 2. Document Number Collisions (5 questions — sq07/08, sq25, sq83/84, sq96)
The same submittal number is assigned to two different documents in the corpus. The retrieval picks the wrong one:
| Collision | Expected | Retrieved |
|---|---|---|
| GEN-027R00 | Subcontractor Approval Forms (Crossroads JV) | Preliminary Project Specification List |
| GEN-001R02 | Elevator Walls Formwork Drawing | Phasing Plan Comment Log |
| GEN-021R00 | Safety Coordinator Submittal | Fiber Optic Cable Test Procedure |
| GEN-014R00 | Monthly Quality Report (01 40 10) | Utility Coordination Report (01 35 70) |

### 3. Wrong File — Close Semantic Match (12 questions)
Retrieval found semantically similar content but wrong document:
- RFI096 questions retrieved RFI-0042 (both are PS LAN coordination RFIs)
- BUR-080R00 retrieved a `.jpg` instead of the photo submittal PDF
- SWP-011 summary retrieved SWP-013 (both are platform-related safe work plans)
- Burnside VECP retrieved EMD inspection report (both are Burnside analysis documents)
- GEN-042R00 meeting retrieved utility coordination report (same date, same "September 2025" prefix)

### 4. File Version Mismatch (4 questions)
- sq18 asked for AVI-002R01 but retrieved R00
- sq101 asked for PRDC12-012R02 but retrieved R00
- sq75 asked for GEN-096R04 but retrieved R02
- sq99/sq102 retrieved APP (contractor copy) vs FIO (MTA stamped) of PRDC12-019R00 — only the FIO had indexed content

---

## Key Findings

### What Works Well
- **DOCX files** (SDI agenda, SWP-032, SWP-011, SWP-052) — fully chunked and answerable
- **RFI PDFs** (RFI-0203, RFI-0115, RFI-009) — well indexed, high-relevance citations
- **Invoice PDFs with text content** (Invoice 11707, Invoice 11830) — answerable
- **Spec documents** (21 12 00 Standpipes, PRDC volumes) — found and partially answerable
- **Submittal cover sheets** (AVI-002R01 FIO, BUR-001R00 FIO) — FIO versions answered correctly
- **PRDC12-019R00 SikaGrout 212 (FIO version)** — sq98 answered correctly with all key restrictions

### What Needs Attention
1. **Re-index zero-chunk files** — Use `--reindex-zero-chunks` flag targeting the file categories listed above
2. **Resolve document number collisions** — GEN-027R00, GEN-001R02, GEN-021R00, GEN-014R00 each have duplicate number assignments in the corpus; disambiguate by spec section prefix or filename
3. **OCR pipeline for scanned PDFs** — Subcontractor approval letters, photo submittals, and some drawing PDFs need OCR extraction before chunking
4. **Photo PDF handling** — Construction photo PDFs (sq54–59) cannot be answered from text chunks; would require image captioning
5. **PPTX extraction** — Kick-off presentation PPTX was not indexed; check tier2 parser support for .pptx
6. **Improve RFI number matching** — RFI096 routing was confused with RFI-0042 in two questions (sq69, sq70); exact RFI number should be a stronger retrieval signal
