# MLJ-017 Package 6 — General (Test Clone) — v2-Simple Smoke Test Results
**Project:** MLJ-017 Package 6 - General (TEST CLONE) `145b3dcf-272e-4c45-9e19-953f20f25bb9`  
**Run date:** 2026-07-17 · **Questions:** 97 · **Hybrid retrieval:** ON · **Rerank:** OFF  
**Input file:** `eval/mlj017-pkg6-gen-batch-input.json`  
**Output file:** `eval/mlj017-v2-simple-fresh-output.txt`  
**Context:** Run after July 16 DOCX reindex (2,636 files processed)

---

## Summary Scorecard

| Grade | Count | % | vs. Jul 15 |
|---|---|---|---|
| ✅ PASS — correct source, factual answer | 21 | 22% | +3 |
| ⚠️ PARTIAL — right source found, answer vague/incomplete | 7 | 7% | -3 |
| ❌ WRONG DOC — irrelevant file retrieved | 23 | 24% | +3 |
| 🔲 NOT INDEXED — file found but 0 extractable chunks | 46 | 47% | -3 |

**Net improvement from DOCX reindex:** 2 questions upgraded to PASS (sq74, sq98), 1 NOT INDEXED resolved. The `M017_IMP_Draft Subcontract` DOCX was re-chunked (168 chunks confirmed in reindex log) but retrieval still hits the old 0-chunk record — a stale-index/dual-record issue.

---

## Detailed Results

### CHANGE ORDER

**[sq01] GEN-042R00 — subcontractor being reviewed** ❌ WRONG DOC  
*How it retrieved:* Domains routed to `contracts, documents, subcontractor`. Hybrid search: 72 vector + 0 lexical = 72 merged candidates. Vector similarity matched `A37806_Volume 05_PRDC 01 General_Rev. 1.pdf` instead of the change order. Retrieval took 108 seconds.  
*Answer:* "I could not find an exact indexed passage in a37806 volume 05 prdc 01 general rev 1." File exists; wrong doc surfaced.

---

### CONTRACT

**[sq02] Island Pavement Cutting Co — scope/pricing** ⚠️ PARTIAL  
*How it retrieved:* Routed to `contracts`. Category-restricted hybrid: 24 vector + 4 lexical = 28 merged. Top hit: `A37806_RFI-0177` which references Island Pavement in an exhibit. Actual subcontract not indexed with text.  
*Answer:* Transformer pit rehab, 80-mil Bridge Preservation System, $1,829,462, 146,356 SF — data is from RFI exhibit, not the actual subcontract.

**[sq03] Island Pavement — joint sealing work** ⚠️ PARTIAL  
*How it retrieved:* Same RFI-0177 source (cache hit).  
*Answer:* Bridge Preservation Articulous Joints, Evazote Joint systems, concrete patching, texturized skid proofing — from RFI exhibit, accuracy uncertain.

**[sq04] MTACD-MLJTC2-L-0024 — 50 States Engineering approval** 🔲 NOT INDEXED  
*How it retrieved:* Correct file `2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf` found by active-doc boost. 0 nodes extracted (scanned single-page PDF).  
*Answer:* "No evidence-backed specification text was verified."

**[sq05] GEN-001R05 Phasing Plan — major phases/milestones** ❌ WRONG DOC  
*How it retrieved:* "Phasing Plan" matched `A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx`. GEN-001R05 not retrieved.  
*Answer:* "No evidence-backed specification text was verified." Wrong file surfaced.

**[sq06] RFP Addendum 02 Pre-Proposal Slideshow** 🔲 NOT INDEXED  
*How it retrieved:* `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf` found by active-doc boost. 0 nodes (large scanned PDF).  
*Answer:* "No evidence-backed specification text was verified."

**[sq07] GEN-027R00 Crossroads JV — Contract Specific Responsibility Form** ❌ WRONG DOC  
*How it retrieved:* "GEN-027R00" matched `A37806_01 40 10_GEN-027R00 - PACKAGE 6 - PRELIMINARY PROJECT SPECIFICATION LIST.pdf`. Submittal number prefix collision. 3 nodes retrieved, chunk=2 (p. 1) rel=4.000.  
*Answer:* "The provided document is a Preliminary Project Specification List. It does not contain information about the Contract Specific Responsibility Form."

**[sq08] GEN-027R00 Crossroads JV — ownership/partners** ❌ WRONG DOC  
*How it retrieved:* Same wrong document as sq07 (cache hit, 96ms).  
*Answer:* "It does not contain information regarding the ownership percentage or partner breakdown."

**[sq09] M017_IMP Draft Subcontract — excluded payment provisions** 🔲 NOT INDEXED  
*How it retrieved:* `M017_IMP_Draft Subcontract_20251024.docx` found by active-doc boost (correct file). 0 nodes returned. **Note:** DOCX reindex on Jul 16 confirmed 168 chunks were created for this file, but retrieval still resolves to the old 0-chunk record — dual-record/stale-vector-index bug.  
*Answer:* "No evidence-backed specification text was verified." — expected to pass after index repair.

**[sq10] M017_IMP Draft Subcontract — entire agreement clause** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq09, same issue.  
*Answer:* "No evidence-backed specification text was verified."

---

### CORRESPONDENCE

**[sq11] Transmittal 0014 — items/review status** 🔲 NOT INDEXED  
*How it retrieved:* `A37806 Transmittal 0014 - MTA Personnel and PMC Supplies.pdf` found, 0 chunks (scanned PDF).

**[sq12] Myrtle Ave Reserve Service Load Letter** ❌ WRONG DOC  
*How it retrieved:* Query matched `MYR_Reserve service.HEIC` — iPhone photo file, no extractable text.  
*Answer:* "More context needed."

**[sq13] MTACD-MLJTC2-L-0017 — MASE FX $109,450** 🔲 NOT INDEXED  
**[sq14] MTACD-MLJTC2-L-0028 — Titanium Linx $** 🔲 NOT INDEXED  
**[sq15] MTACD-MLJTC2-L-0049 — McVac Environmental** 🔲 NOT INDEXED  
**[sq16] MTACD-MLJTC2-L-0083 — American Geophysics** 🔲 NOT INDEXED  
**[sq17] MTACD-MLJTC2-L-0093 — Tri-State Civil** 🔲 NOT INDEXED  
*All five:* Correct scanned PDF approval letters found by filename. Each is a 1-page letter with no OCR text layer. 0 chunks each.

---

### DRAWING

**[sq18] AVI-002R01 — rebar sizes/elevator pit mat** 🔲 NOT INDEXED  
*How it retrieved:* Resolved to R00 version (`AVI-002R00 - AAN`), not R01. That version has 0 chunks.  
*Answer:* "No evidence-backed specification text was verified."

**[sq19] AVI-002R01 — submittal number/status/spec** ⚠️ PARTIAL  
*How it retrieved:* R01 file `AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf` found; 3 chunks at pp. 4–5 retrieved (rel=1.000 each). 221ms active-doc.  
*Answer:* Raw chunk dump including the revision log — "GB 12/02/2025 0 12/02/2025 FOR APPROVAL 1 02/11/2026 AAN PER EOR MARKUPS" plus rebar schedule fragment. Submittal number (AVI-002R01) and review status (AAN) are embedded in the text but not cleanly extracted. Spec section not surfaced.

**[sq20] BUR-009R00 EL539 — glazing spec items** 🔲 NOT INDEXED  
`A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf` found, 0 chunks.

**[sq21] BUR-009R00 EL539 — NYCT review status/spec section** 🔲 NOT INDEXED  
`A37806_14 24 00_BUR-009R00 - FIO - EL539 Cab and Entrance Drawings-MTA.pdf` found, 0 chunks.

**[sq22] BUR-001R00 — review status** ❌ WRONG DOC  
*How it retrieved:* "BUR-001R00 staircase enclosure" matched `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf` (consolidated drawings package).  
*Answer:* "No evidence-backed specification text was verified."

**[sq23] BUR-001R00 — approved/comments** ✅ PASS  
*How it retrieved:* FIO version found via active-doc boost; chunk=3 (p. 2) rel=10.000 exact match. 1,832ms.  
*Answer:* **Approved as Noted (AAN)** by C. O'Neill / Arch., review date 06/15/2026. No specific comments listed beyond the AAN designation.

**[sq24] Controlled fills/excavation near elevator** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 96 lexical = 168 merged. PRDC volumes retrieved; 8 source files returned across all PRDC copies. 61 seconds.  
*Answer:* §4.11.1 defines fill/backfill requirements; §14.4.6 requires 3 compaction tests (field density, lab max dry density, lab optimum moisture). Rock Tunnel Excavation "NOT USED." No elevator-specific excavation rules found separately.

**[sq25] GEN-001R02 Elevator Walls Formwork — submittal designation** ❌ WRONG DOC  
*How it retrieved:* "GEN-001R02" matched `A37806_01 10 30_GEN-001R02 - Phasing Plan Operations Planning Comment Log.xlsx` — different document, same number prefix.  
*Answer:* "The retrieved document is a phasing plan comment log, not a submittal for formwork drawings."

---

### INVOICE

**[sq26] Invoice 11707 — pest control/locations** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 1 lexical = 72 merged; routed to `documents, contracts`. `Invoice 11707.pdf` found in top sources; chunk at p. 1. 30 seconds.  
*Answer:* Joe's Pest Control, Middletown Stations. Dates: 2/5/2026 (Order 8780), 2/12/2026 (Order 3029), 2/19/2026 (Order 3086).

**[sq27] Invoice 11830 — Middletown/April service orders** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 35 lexical = 106 merged. `Correction invoice 118350.pdf` found; chunk=2 (p. 1) rel=0.970. 57 seconds.  
*Answer:* Joe's Pest Control, Middletown Stations. April 2026 service orders: 3421 (4/2), 3488 (4/9), 3548 (4/16), 3645 (4/23), 3557 (4/26).

**[sq28] Lockton Invoice 0849812 — remittance** 🔲 NOT INDEXED  
**[sq29] Lockton Invoice 0849812 — total amount** 🔲 NOT INDEXED  
**[sq30] Backup Invoice#01 — Dec 6 T&M** 🔲 NOT INDEXED  
**[sq31] Backup Invoice#01 — Dec 7 T&M** 🔲 NOT INDEXED  
*All four:* Correct files found by name. 0 chunks each (scanned invoice PDFs).

**[sq33] Invoice#01 G703 — retainage/net payment** ❌ WRONG DOC  
*How it retrieved:* "Invoice#01 G703 retainage" matched `2025-10-21 Eagle Business Machine Inv# 129318 $43.55` — unrelated office equipment invoice. 0 nodes retrieved from it.  
*Answer:* "No evidence-backed specification text was verified."

---

### MEETING MINUTES

**[sq34] GEN-042R00 A37806 & C49321R Coordination Meeting** 🔲 NOT INDEXED  
`A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf` found, 0 nodes. "The document GEN-042R00 was not found in the retrieved context."

**[sq35] September 3, 2025 coordination meeting** ❌ WRONG DOC  
*How it retrieved:* "September 3, 2025 coordination meeting" matched `A37806_01 35 70_GEN-009R00 - FIO - Utility Coordination - September 2025.pdf` — a utility coordination report.  
*Answer:* "More context needed." Wrong file.

**[sq36] A37806 Kick Off Pre-Work Conference** 🔲 NOT INDEXED  
**[sq37] Kick Off Conference — milestones/work sequencing** 🔲 NOT INDEXED  
*Both:* `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx` found; 0 chunks. PowerPoint extraction not supported by current indexing pipeline.

**[sq38] July 24, 2025 Progress Meeting — MLJ/TC Electric attendees** 🔲 NOT INDEXED  
**[sq39] July 24, 2025 Progress Meeting — T.Y. Lin consultants** 🔲 NOT INDEXED  
*Both:* `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf` found; 0 chunks. DOCX reindex indexed `Monthly Progress Report - August 2025.docx` (31 chunks) but not July 2025.

**[sq40] May 28, 2026 Meeting — CPR-003 Rev 2 status** 🔲 NOT INDEXED  
**[sq41] May 28, 2026 Meeting — Grade Operations count** 🔲 NOT INDEXED  
*Both:* `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf` found; 0 chunks. DOCX reindex indexed `Monthly Progress Report - April 2026.docx` (49 chunks) but May 2026 not found as DOCX.

**[sq42] SDI-MLJ Dec 19 — action items/dates** ✅ PASS  
*How it retrieved:* `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx` found and well-chunked; chunks 0, 2, 4, 5 retrieved at rel=1.000 each. 3,391ms.  
*Answer:* 9 action items — OCIP approval by 12/22; SWPs/QWPs/CWPs by 01/14/2026; Quality Management Plan by 01/14/2026; Mullion sample by 01/09/2026; Roofing sample by 12/26/2025; Roofing lead times by 12/17/2025; EL541 shop drawing status by 12/22; Roofing shop drawing (elevator towers) by 12/22; signal tray detail at Avenue I by 12/19/2025.

**[sq43] SDI-MLJ Dec 19 — OCIP/surveyor status** ✅ PASS  
*How it retrieved:* Same SDI DOCX; chunks 0, 2, 5 retrieved. 2,285ms.  
*Answer:* OCIP approval pending from MTA; surveyor approval targeted December 22, 2025, SDI responsible.

---

### PERMIT

**[sq44] Burnside Ave permits** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 56 lexical = 127 merged. `4-23-26 SIG REQ NEW DOT PERMITS - Burnside Ave Station.pdf` and `BUR-024R01` in top sources. 73 seconds.  
*Answer:* Request for new DOT Permits (Occupancy of Roadway) dated 4/23/26. BUR-024R01 Comm Equipment Removal approved 04/21/2026.

**[sq45] Ave I permits** ✅ PASS  
*How it retrieved:* Active-doc found `AVI-001R00 DOT Permits Exp. 05.30.25` and `AVI-002R00 Tree Work Permits`.  
*Answer:* Two submittals: DOT Permits (exp. 05/30/25), Tree Work Permits.

**[sq46] Myrtle Ave permits** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 1 lexical. Multiple Myrtle permit PDFs retrieved with full text.  
*Answer:* MYR-006R00 DOT Permits exp. 11/07/25 & 11/21/25 (type 0112P); renewed DOT Permits exp. 3-08 & 3-13-26; amended permits exp. 11-07 & 11-21-25; new permits exp. 11-21-25.

**[sq47] Middletown Ave permits** ✅ PASS  
*How it retrieved:* Active-doc list mode returned 20 MDT permit file records including MDT-001R00 through MDT-016R00 and MDT WE1 permit.  
*Answer:* Full list of 20 MDT permit submittals (DOT permits across expiry dates 4/30/25 through current), tree work permit, WE1 permit 05/20/26.

**[sq48] Norwood Ave permits** ✅ PASS  
*How it retrieved:* `8 - DOT Permits.pdf`, `12 RENEWED PERMITS - NORWOOD AVE EXP 6-1-26.pdf`, `DOT PERMITS EXP 1-31-26 RENEWED`, and `Check Request for Dep Permits` retrieved.  
*Answer:* 1 new/amended DOT permit (9/24/2025); 12 renewed permits on Fulton St (exp. 6/1/2026, issued 3/16/2026); 1 renewed permit exp. 1/31/26; hydrant permit #H326736.

**[sq49] MDT-005R00 — nursery standards** 🔲 NOT INDEXED  
`A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf` found; 0 chunks (scanned PDF).

---

### PHOTO

**[sq54] BUR-081R00 Jan 20 northbound work** 🔲 NOT INDEXED  
**[sq55] BUR-081R00 MPT/ConEd work** 🔲 NOT INDEXED  
`A37806_01 32 10_BUR-081R00 - FIO - January 2026 Construction Photos.pdf` found; 0 chunks. "I need access to this document — please open it in the viewer."

**[sq56] BUR-080R00 — track shielding** ❌ WRONG DOC  
**[sq57] BUR-080R00 — MPT/shielding northbound** ❌ WRONG DOC  
*Both:* Query matched `Photo Apr 02 2025, 8 12 26 AM.jpg` — standalone HEIC/JPG photo, not the BUR-080R00 submittal PDF.

**[sq58] MYR-076R00 Dec 19 ADA work** 🔲 NOT INDEXED  
**[sq59] MYR-076R00 submittal designation** 🔲 NOT INDEXED  
`A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf` found; 0 chunks.

---

### REPORT

**[sq60] VECP Presentation — value engineering background** ❌ WRONG DOC  
*How it retrieved:* "Burnside Avenue VECP May 2025" matched `0050 - A-37808 EMD - Burnside Ave - 2025-05.pdf` (EMD/emergency report).

**[sq61] VECP Presentation — ADA scope/date** ❌ WRONG DOC  
*How it retrieved:* "VECP ADA scope" matched `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf`.

**[sq62] PRO 26-01 NCR flowchart roles** ❌ WRONG DOC  
*How it retrieved:* "PRO 26-01 NCR process" matched `A37806 ADA P6 - Myrtle Ave - Con Edison - New Normal and Reserve services.msg` — a ConEd email. The actual PRO 26-01 procedure was not retrieved.

**[sq63] GEN-006R01 NCR Log — required data fields** ✅ PASS  
*How it retrieved:* `A37806_01 40 10_GEN-006R01 - AEAN - NCR Template & Log.pdf` retrieved via active-doc; chunks at pp. 4–5. 2,597ms.  
*Answer:* 11 required fields — Date, NCR No., Brief Description of Non-Conformity, Raised By, Date of Issuance, Location, Responsible Party/Subcontractor, Disposition, Verification, Initial Status, Date Closed.

**[sq64] RFI-0203 Norwood J1 Track Limits — summary** ✅ PASS  
*How it retrieved:* Active-doc boost; full RFI PDF retrieved (4 pages, 220ms, cacheHit=false). Complete text extracted including MTA direction email from Jose Paredes dated 4/27/2026.  
*Answer:* MTA directed 4/27/26 that MOW Track Construction will replace Track J2 in full; MLJTC2 to extend J1 limits using procured J2 material (full platform length). AECOM/MLJ/TCE/J-Track clarifications requested on contact rail, heat trace, best-fit coordination (J1 and J2 must be coordinated), traction power at ~416+00, and Pandrol-to-F21 plate transition.

**[sq65] J-TRACK-13A-041R00 Material I&T Request** 🔲 NOT INDEXED  
`A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF` found; 0 chunks (scanned PDF).

---

### RFI

**[sq66] RFI-0115 Louver Exhaust Face Velocity** ⚠️ PARTIAL  
*How it retrieved:* `A37806_RFI-0115 - Louver Exhaust Face Velocity.pdf` retrieved via active-doc; 5 chunks at pp. 1–4, all rel=1.000. 199ms (cache warm).  
*Answer:* Core issue embedded in raw chunk text: "T.4 is to limit the velocity of exhaust air to occupied areas, and that it is acceptable to size discharge louvers on the exterior walls of the EMRs in accordance with manufacturer specifications and good engineering practice in lieu of the 400 FPM limit." LLM still wraps in "Section 5.8 Requirements Summary" header rather than directly stating the issue and direction.

**[sq67] RFI098 Ave I Conductor Board — issue/drawing** 🔲 NOT INDEXED  
**[sq68] RFI098 — figures at STA 489/490** 🔲 NOT INDEXED  
`A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf` found; 0 chunks.

**[sq69] RFI096 — NB/SB stair/exit configurations** ❌ WRONG DOC  
**[sq70] RFI096 — McDonald Ave ADA drawing** ❌ WRONG DOC  
*Both:* "RFI096 platform stair exit" / "RFI096 McDonald" matched `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Norwood ONLY.pdf`. RFI-096 was not retrieved.

**[sq71] MYR-002R00 Demo Shield Drawings** ❌ WRONG DOC  
*How it retrieved:* "MYR-002R00 Myrtle Avenue Demo Shield" matched `MLJTC2_AECOM_ATC_2_Myrtle Avenue Drawings.pdf` (consolidated package).

**[sq72] Drawing MYR-A-444A — stainless steel/signage** ❌ WRONG DOC  
*How it retrieved:* "MYR-A-444A stainless steel elevator" matched `Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf`.

**[sq73] RFI-0116 PS LAN followup** ❌ WRONG DOC  
*How it retrieved:* Matched `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Myrtle ONLY.pdf` — RFI-0042, not RFI-0116.

**[sq74] RFI-009 Myrtle UPS backup capacity** ✅ PASS _(upgraded from ⚠️ PARTIAL)_  
*How it retrieved:* `806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf` found via active-doc; chunk=2 (p. 1) rel=1.000. 156ms.  
*Answer:* "Design-Builder to replace an existing UPS power plant system to support the full load from both existing and new communications systems, plus an additional **40% or higher** of its capacity available for future use." Both existing and new systems must run at full load immediately upon loss of input power.

---

### SAFETY

**[sq75] GEN-096R04 SWP-016 cover sheet/response due date** 🔲 NOT INDEXED  
*How it retrieved:* Resolved to R02 version `GEN-096R02 - SWP-016 Elevator Steel & Enclosure (Day) 1 of 3.pdf`, not R04. That version has 0 chunks. 177ms (active-doc).

**[sq76] SWP-016 summary** ✅ PASS  
*How it retrieved:* Standalone `SWP 016 + Attachment.pdf` found and well-indexed; 8 chunks across pp. 1–8, all rel=1.000. 1,509ms.  
*Answer:* SWP-016 Rev. 4 (06/02/2026), Elevator Steel & Enclosure crane operations at Middletown, Contract A37806. MLJ is GC and performing contractor. Covers daily toolbox meetings, fall protection (6-ft rule), ROW safety with MTA flaggers, tool inspection, proper rigging.

**[sq77] GEN-041R01 SWP-011 — dust/silica controls** ✅ PASS  
*How it retrieved:* R05 version `GEN-041R05 - AEAN - SWP-011 - Platform Concrete Demo.pdf` retrieved; lexical "silica" boost surfaced chunks at pp. 21–24. chunk=33 (p. 23) rel=9.000. 4,524ms.  
*Answer:* Implement approved Dust Control Plan; wet methods (wetting, HEPA-Vac, green dust); connect water hose to demo saw before operation; IDA high-pressure spray system; stop work if visible dust outside barricaded area; N95/half-face respirators; medical clearance and fit-testing required; OSHA 1926.1153 Table 1; lead protocol if painted steel encountered.

**[sq78] SWP-011 summary** ❌ WRONG DOC  
*How it retrieved:* "Summarize SWP-011" matched `SWP-013 Installation of Platform Barrier Revision 002.pdf` — adjacent SWP number caused semantic confusion.  
*Answer:* Described SWP-013 (platform barriers at A-37135) as if it were SWP-011.

**[sq79] SWP-032 summary** ✅ PASS  
*How it retrieved:* `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf` retrieved; 8 chunks across pp. 1–8, all rel=1.000. 1,609ms.  
*Answer:* SWP-032 R4 for general formwork, rebar, and concrete pouring under A37806. Covers worksite entry, large machinery, ROW work, tool usage, material delivery, formwork/rebar tasks.

**[sq80] SWP-032 transmittal approval letter** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc found the SWP-032 working copy (SWP-032-R4.pdf), not the August 20, 2025 transmittal letter from Michael Wilson. Transmittal not indexed separately.

**[sq81] GEN-116R00 SWP-052 — work hours/combustibles/notice** ✅ PASS  
*How it retrieved:* Active-doc boost; R01 version found. chunk=14 (p. 8) rel=10.000 exact match. 2,423ms.  
*Answer:* **No material movement** 6:00 AM–9:30 AM and 3:00 PM–8:00 PM. No flammable/combustible materials inside enclosures. **Two weeks' notice** (posting signs) required before long-term staircase closure.

**[sq82] GEN-116R00 SWP-052 — worksite entry/PPE/evacuation** ✅ PASS  
*How it retrieved:* Same SWP-052 R01; chunks at pp. 6–8 retrieved (5 chunks, all rel=1.000). Full raw text extracted. 263ms (cache warm).  
*Answer:* PFAS/guardrail for falls >6 ft; NYCT zero tolerance drug/alcohol/tobacco; first aid and eyewash always on site; GFCI on all electrical tools; daily tool/ladder inspections; no solo entry; all material deliveries communicated to PMC at least 24 hours prior; 20-lb ABC fire extinguisher within 20 ft of any refueling; heat/cold stress protocols; no sharp edges on barriers, corners marked with black/yellow tape.

**[sq83] GEN-021R00 Safety Coordinator — Diego Gonzalez responsibilities** ❌ WRONG DOC  
**[sq84] GEN-021R00 Safety Coordinator summary** ❌ WRONG DOC  
*Both:* "GEN-021R00" matched `A37806_27 10 01_GEN-021R00 - RWNC - Single Mode Fiber Optic Cable and Fiber Patch Cord Test Procedure.pdf` — a different submittal with the same number prefix (spec 27 10 01, not 01 35 10).  
*Answers:* Both describe a fiber optic cable test procedure (spec 27 10 01, closed/RWNC, TCE responsible) instead of the safety coordinator submittal.

---

### SCHEDULE

**[sq85] Schedule Update 5 — Elevator 541 start/finish dates** 🔲 NOT INDEXED  
**[sq86] Schedule Update 5 — EL1121 outage/Myrtle enclosure** 🔲 NOT INDEXED  
*Both:* `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf` found; 0 chunks (large schedule PDF with no OCR text).

---

### SPEC

**[sq87] Spec 21 12 00 — pipe hanger/expansion joint requirements** ⚠️ PARTIAL  
*How it retrieved:* `21 12 00 - Fire-Suppression Standpipes REV 1.pdf` retrieved (cache hit 268ms); 7 chunks across pp. 1–6.  
*Answer:* Returns "Section 2.11 Requirements Summary" boilerplate with table of contents headings (showing §2.12 Pipe Hangers and Supports, §3.3 Installation) but does not extract the actual hanger/expansion joint clause text from those pages.

**[sq88] Spec 21 12 00 — pitch requirements/track crossings** ⚠️ PARTIAL  
*How it retrieved:* Exact cache hit (206ms). Same 7 chunks as sq87.  
*Answer:* Identical boilerplate to sq87 — does not extract pitch percentages or track-crossing installation clauses.

**[sq89] BUR-042R01 EDU07 — water leaks/lead abatement** 🔲 NOT INDEXED  
**[sq90] BUR-042R01 EDU07 — structural notes/repair standards** 🔲 NOT INDEXED  
`A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf` found; 0 chunks (large multi-sheet spec PDF).

**[sq91] Transmittal 212-NOR transfer girder** 🔲 NOT INDEXED  
`Transmittal 212-NOR Xfer Girder inspection.pdf` found; 0 nodes.

**[sq92] NOR-010R00 CCTV — NYCT review designation** 🔲 NOT INDEXED  
**[sq93] NOR-010R00 CCTV — sewer sections/NYCDEP IDs** 🔲 NOT INDEXED  
`A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf` found; 0 nodes.

**[sq94] EDU05B — cover page job number/client/coordination** ✅ PASS  
*How it retrieved:* Active-doc boost; `GEN-038R01 APP EDU05B-BB Long Lead Electrical (AVI, NOR).pdf` found; 5 chunks at pp. 2–5. 424ms.  
*Answer:* Transmittal dated 11/11/2025 from Celine Liew (AECOM Doc Controller) to Ravi Jain (MLJTC2 PM). CC: Eric Clark, Dan Ventresca, Shravan Chandramouleeswar, Janelle Ella, Aishwarya Singh (AECOM); Nicholas DiGuglielmo, Leyla Acosta, Andrew Voss (MLJTC2). Covers AVI-EL-601/602 (existing/proposed one-line diagrams) and NOR-EL-601/602 (sheets 6–9).

**[sq95] EDU05B — load schedule for spec 12 14 10 / 25 43 18 / 25 41 18** ⚠️ PARTIAL  
*How it retrieved:* Same EDU05B file; chunks at pp. 70, 73, 74, 78. 430ms.  
*Answer:* Returns generic switchboard installation requirements (sheet steel gauge, bus connections, circuit disconnect isolation) rather than the specific panel/circuit load schedule data for those three spec sections.

---

### SUBMITTAL

**[sq96] GEN-014R00 Quality Report — Ave I activities under 01 40 10** ❌ WRONG DOC  
*How it retrieved:* "GEN-014R00 Monthly Quality and Certification Report" matched `A37806_01 35 70_GEN-014R00-FIO- Utility Coordination - February 2026.pdf` — different GEN-014R00. The quality/certification report was not retrieved due to the naming collision. 269ms (cache).  
*Answer:* Returns February 2026 Utility Coordination Report content (ConEd Bronx/Brooklyn status, NYCDEP watermain work, Verizon wingback, FDNY permits).

**[sq97] GEN-014R00 — NYCT/MTA submittal designation** ❌ WRONG DOC  
*How it retrieved:* Same wrong document as sq96.  
*Answer:* "NYCT/MTA Information Only" — technically correct for the utility coordination report but wrong document entirely.

**[sq98] PRDC12-019R00 SikaGrout 212 — sun/wind/substrate restrictions** ✅ PASS _(upgraded from ⚠️ PARTIAL)_  
*How it retrieved:* `A37806_PRDC12-019R00 - SikaGrout 212.pdf` found via active-doc; 6 chunks at pp. 16–18, all rel=1.000. 266ms.  
*Answer:* From the product limitations section: **"Avoid application in direct sun and/or strong wind"**; **"Apply only to sound, prepared substrate"**; "Not to be used as a patch repair"; "An overlay in unconfined spaces only"; "Do not add additional water after application as this may cause cracking"; "Protect freshly applied grout." Product Temperature: 65–75°F; Ambient Air Temp > 45°F; Substrate Temp > 45°F; Pot Life ~15 minutes.

**[sq99] PRDC12-019R00 — USDA/packaging/ASTM C-827** 🔲 NOT INDEXED  
`A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf` (APP-stamped version) found; 0 chunks.

**[sq100] PRDC12-012R02 Lead Placard — containment class/cut-line prep** 🔲 NOT INDEXED  
`A37806_PRDC12-012R02 - ORIG - Lead Placard Package-Burnside.pdf` found; 0 chunks.

**[sq101] PRDC12-012R02 Lead Placard — cover sheet info** 🔲 NOT INDEXED  
Resolved to R00 version `PRDC12-012R00 - ORIG`; 0 chunks.

**[sq102] PRDC12-019R00 — compressive strength/flowability/working time** 🔲 NOT INDEXED  
`A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf` found; 0 chunks. (The FIO/non-stamped version at sq98 has 33 chunks covering pp. 16–18 warranty/limitations; the technical data table is on different pages not yet extracted.)

---

## Root Cause Analysis

### 1. NOT INDEXED — Scanned PDFs with no OCR text layer (~42 questions)
These files are in the index by name but the PDF has no machine-readable text. No amount of DOCX reindexing will fix these:
- All 6 subcontractor approval letters (L-0017, L-0024, L-0028, L-0049, L-0083, L-0093)
- Monthly Progress Report PDFs (GEN-007R00 July 2025, GEN-024R00 May 2026, GEN-042R00)
- Construction photo PDFs (BUR-080R00, BUR-081R00, MYR-076R00)
- Schedule PDFs (GEN-032R00 Schedule Update 5)
- Transmittal PDFs (Transmittal 0014, Transmittal 212-NOR)
- Invoice backup PDFs (Lockton 0849812, Backup for Invoice#01, G703 continuation)
- Large spec/design PDFs (BUR-042R01 EDU07, NOR-010R00 CCTV, J-TRACK-13A-041R00)
- Lead Placard PDFs (PRDC12-012R02)
- MDT-005R00 Tree Work Permit
- RFI PDFs (RFI098, Pre-Proposal Slideshow)
- **Fix:** Re-run OCR on these files before indexing, or use a vision-model extraction pass.

### 2. NOT INDEXED — DOCX reindex created new chunks but retrieval still hits old 0-chunk record (2 questions)
- `M017_IMP_Draft Subcontract_20251024.docx` — confirmed 168 chunks in reindex log (Jul 16), but sq09/sq10 still return 0 nodes. The old file record with 0 chunks takes precedence.
- **Fix:** Delete the old 0-chunk file record and re-run tier2:stream for this file, or update the file record in place so the new chunks link to the same file ID.

### 3. WRONG DOC — Submittal number prefix collision (~12 questions)
Multiple files share the same first segment of their submittal number. The retriever returns the wrong one because vector similarity matches the number prefix, not the content type:
- `GEN-014R00` exists as both Quality/Certification Report and Utility Coordination Report
- `GEN-021R00` exists as both Safety Coordinator submittal and Fiber Optic Test Procedure
- `GEN-027R00` exists as both Subcontractor Approval Forms and Preliminary Spec List
- `GEN-001R02` exists as both Elevator Walls Formwork and Phasing Plan Comment Log
- `RFI-0042` retrieved instead of `RFI-096` and `RFI-0116`
- **Fix:** Index spec section as a metadata field and filter by category (safety/drawing/contract) before returning top hits.

### 4. WRONG DOC — Generic "summarize" queries hit semantically adjacent documents (~4 questions)
- "Summarize SWP-011" → SWP-013 (adjacent number)
- "Summarize PRO 26-01" → ConEd email
- **Fix:** Force file-specific retrieval when a specific document ID is in the query.

### 5. PARTIAL — LLM returns section header boilerplate instead of extracting values (~7 questions)
Right chunks retrieved, but LLM wraps in "Section X.X Requirements Summary" template:
- sq66 (RFI-0115 louver velocity), sq87/sq88 (spec 21 12 00), sq95 (EDU05B load schedule), sq19 (AVI-002R01 raw dump)
- **Fix:** Tune system prompt to require concrete values (numbers, dates, names) when the retrieved chunk contains them, rejecting section-header wrapper responses.

### 6. NOT INDEXED — PowerPoint files (2 questions)
- `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx` — PowerPoint extraction not implemented in the pipeline.
- **Fix:** Add `pptx` to the supported extraction pipeline (e.g., using python-pptx or mammoth equivalent).
