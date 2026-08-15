# MLJ-017 v2-Simple Smoke Test — Post-PDF Reindex Results

**Project:** MLJ-017 Package 6 - General (TEST CLONE) `145b3dcf-272e-4c45-9e19-953f20f25bb9`  
**Run date:** 2026-07-22  
**Questions tested:** 56 (from `mlj017-smoke-questions-v2-simple.md`, sq01–sq61)  
**Hybrid retrieval:** ON · **Rerank:** OFF  
**Input file:** `eval/mlj017-smoke-v2-simple-pkg6gen-batch-input.json`  
**Raw output:** `eval/mlj017-smoke-v2-reindex-fresh-utf8.txt`  
**Context:** Run after July 21–22 PDF shard reindex (10 shards, ~2,753 files processed)

---

## Summary Scorecard

| Grade | Count | % | vs. Jul 17 |
|---|---|---|---|
| ✅ PASS — correct source, grounded answer | 9 | 16% | +2 |
| ⚠️ PARTIAL — right file area, answer incomplete/indirect | 4 | 7% | ≈ same |
| ❌ WRONG DOC — wrong file retrieved | 10 | 18% | ≈ same |
| 🔲 NOT INDEXED — file found but 0 extractable chunks | 33 | 59% | -2 |

**Net improvement from PDF reindex:** sq19 (AVI-002R01 Rebar drawings) and sq42/sq43 (SDI-MLJ DOCX agenda) upgraded from NOT INDEXED to PASS. The M017_IMP Draft Subcontract (sq09, sq10) remains at 0 chunks — dual-record/stale-vector-index bug persists.

---

## Detailed Results by Category

---

### CHANGE ORDER

**[sq01] GEN-042R00 — subcontractor being reviewed** ❌ WRONG DOC  
*How it retrieved:* Domains routed to `contracts, documents, subcontractor`. Hybrid: 72 vector + 0 lexical = 72 merged. Retrieval took 276 seconds. Vector matched `A37806_Volume 05_PRDC 01 General_Rev. 1.pdf` instead of the GEN-042R00 change order.  
*Answer:* "I could not find an exact indexed passage in a37806 volume 05 prdc 01 general rev 1 that answers this question." — Wrong doc surfaced.

---

### CONTRACT

**[sq02] Island Pavement Cutting Co — scope/pricing** ⚠️ PARTIAL  
*How it retrieved:* Routed to `contracts`. Category-restricted hybrid: 24 vector + 4 lexical = 28 merged. Top hit: `A37806_RFI-0177` (Thru-Span WP PMC Response). Actual Island Pavement subcontract not directly found.  
*Answer:* Transformer pit rehab, 80-mil Bridge Preservation® System, $1,829,462, 146,356 SF at 5 Boroughs — data from RFI exhibit (p. 9), not the subcontract itself.

**[sq03] Island Pavement — joint sealing/pavement cutting** ⚠️ PARTIAL  
*How it retrieved:* Same RFI-0177 source path. Retrieved hybrid 24v+4l=28 merged.  
*Answer:* Bridge Preservation® Articulous Joints, Evazote Joint systems, transformer pit rehab, spray WP, waterproofing at Myrtle Ave and Avenue I (all from RFI-0177 p. 9, 15). Data is from the RFI exhibit — the actual subcontract scope was not found.

**[sq04] MTACD-MLJTC2-L-0024 — 50 States Engineering approval** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost correctly found `2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf`. 0 nodes extracted — scanned single-page PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq05] GEN-001R05 Phasing Plan — major phases/milestones** ❌ WRONG DOC  
*How it retrieved:* "Phasing Plan" keyword matched `A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx`. GEN-001R05 not retrieved.  
*Answer:* "No evidence-backed specification text was verified in a37806 ada p6 - communication ps lan agenda."

**[sq06] RFP Addendum 02 Pre-Proposal Slideshow — ADA scheme** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf`. 0 nodes extracted — large scanned PDF, no text layer.  
*Answer:* "No evidence-backed specification text was verified."

**[sq07] GEN-027R00 Crossroads JV — Contract Specific Responsibility Form** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found the correct file `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`. 0 nodes extracted.  
*Answer:* "No relevant information was found in the retrieved context. Please provide the document for review."

**[sq08] GEN-027R00 Crossroads JV — ownership/partner breakdown** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq07, same 0-node result.  
*Answer:* "The requested information is not available in the current project snapshot."

**[sq09] M017_IMP Draft Subcontract — excluded payment provisions** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `M017_IMP_Draft Subcontract_20251024.docx`. Still 0 nodes — dual-record/stale-vector-index bug. DOCX reindex on Jul 16 created 168 chunks but retrieval resolves to old 0-chunk record.  
*Answer:* "No evidence-backed specification text was verified in m017 imp draft subcontract 20251024."

**[sq10] M017_IMP Draft Subcontract — entire agreement clause** 🔲 NOT INDEXED  
*How it retrieved:* Same file, same stale-record issue.  
*Answer:* "No evidence-backed specification text was verified."

---

### CORRESPONDENCE

**[sq11] Transmittal 0014 — items/review status** 🔲 NOT INDEXED  
*How it retrieved:* `A37806 Transmittal 0014 - MTA Personnel and PMC Supplies.pdf` found by active-doc boost. 0 chunks — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq12] Myrtle Ave Reserve Service Load Letter** ❌ WRONG DOC  
*How it retrieved:* Query matched `MYR_Reserve service.HEIC` — an iPhone photo image file, no extractable text.  
*Answer:* "More context needed." Wrong file type surfaced.

**[sq13] MTACD-MLJTC2-L-0017 — MASE FX approval** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE FX $109,450.00.pdf`. 0 nodes — scanned single-page PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq14] MTACD-MLJTC2-L-0028 — Titanium Linx approval** 🔲 NOT INDEXED  
*How it retrieved:* Found `2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf`. 0 nodes — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq15] MTACD-MLJTC2-L-0049 — McVac Environmental approval** 🔲 NOT INDEXED  
*How it retrieved:* Found `2025-06-10 MTACD-MLJTC2-L-0049 Sub-Contractor Approval – McVac Environmental Services, Inc..pdf`. 0 nodes — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq16] MTACD-MLJTC2-L-0083 — American Geophysics approval** 🔲 NOT INDEXED  
*How it retrieved:* Found `2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval – American Geophysics Inc..pdf`. 0 nodes — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq17] MTACD-MLJTC2-L-0093 — Tri-State Civil approval** 🔲 NOT INDEXED  
*How it retrieved:* Found `2025-08-25 MTACD-MLJTC2-L-0093 - Sub-Contractor Approval – Tri-State Civil Construction LLC.pdf`. 0 nodes — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

---

### DRAWING

**[sq18] AVI-002R01 Ave I Foundation Rebar — rebar sizes/reinforcement** 🔲 NOT INDEXED  
*How it retrieved:* Retrieved `A37806_03 20 00_AVI-002R00 - AAN -...pdf` (R00 revision, scanned). The question asks about R01. 0 chunks from this file.  
*Answer:* "No evidence-backed specification text was verified." Note: See sq19 which hits the FIO (MTA-reviewed) copy of R01.

**[sq19] AVI-002R01 Ave I Foundation Rebar — submittal number/status/spec** ✅ PASS *(new after reindex)*  
*How it retrieved:* Active-doc boost found `A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf`. 3 chunks returned from p. 4 and p. 5 (rel=1.000). Fast response: 239ms.  
*Answer (grounded):* Submittal designation: **FOR INFORMATION ONLY (FIO)**, Revision 1 dated 02/11/2026. Original submission was "FOR APPROVAL" on 12/02/2025; revised per EOR markups (01/06/2026), updated set (01/23/2026), and SK-044 (02/02/2026). References epoxy coated rebar, elevator pit reinforcement details at Avenue I Station Package 6.  
*Citations:* `AVI-002R01 - FIO` chunk=11 (p. 4), chunk=15 (p. 5), chunk=16 (p. 5) — all rel=1.000.

**[sq20] BUR-009R00 EL539 cab/entrance drawings — glazing spec items** 🔲 NOT INDEXED  
*How it retrieved:* Found `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf`. No indexed text.  
*Answer:* "I do not have indexed text for a precise answer. Re-run indexing on that file."

**[sq21] BUR-009R00 — NYCT/MTA review status and spec section** 🔲 NOT INDEXED  
*How it retrieved:* Found `A37806_14 24 00_BUR-009R00 - FIO - EL539 Cab and Entrance Drawings-MTA.pdf`. No indexed text.  
*Answer:* "I do not have indexed text for a precise answer."

**[sq22] BUR-001R00 Staircase Enclosure — review status** ❌ WRONG DOC  
*How it retrieved:* Query routed to `documents` domain. Top result was `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf` (engineering drawings collection) instead of the BUR-001R00 submittal PDF.  
*Answer:* "No evidence-backed specification text was verified in mljtc2 aecom atc 1 burnside avenue drawings."

**[sq23] BUR-001R00 Staircase Enclosure — approved/comments** 🔲 NOT INDEXED  
*How it retrieved:* Hybrid: 72 vector + 96 lexical = 168 merged. Found correct file `A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Staircase Enclosure Shop Drawings.pdf` (8 sources with exact page provenance). Elapsed 63 seconds for retrieval.  
*Answer:* "The retrieved context does not contain information about its approval status or comments." — File found but answer couldn't be extracted from the chunks retrieved.

**[sq24] Spec requirements — controlled fills/excavation near elevator** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 1 lexical = 72 merged. Multiple PRDC sources retrieved. Elapsed 63 seconds.  
*Answer (grounded):* Controlled/uncontrolled fills governed by PRDC 04-Structural Section 4.11.1.A (p. 434) — applies to all project areas, defines "fill" as soil/stone/fractured rock. Three test types: field density, gradation, moisture content (PRDC 14, Section 14.4.6.A.1, p. 1063). Rock Tunnel Excavation sections 4.10 and 14.4.5 marked "NOT USED." Note: no elevator-specific fill provisions found; general project requirements apply.  
*Citations:* `EDU02 Foundations and Structural Steel-100.pdf` chunk=196 (p. 65) rel=0.997; multiple PRDC PDF sources.

**[sq25] GEN-001R02 Elevator Walls Formwork — NYCT/MTA designation** 🔲 NOT INDEXED  
*How it retrieved:* Hybrid: 72 vector + 1 lexical. Found `A37806_03 10 00_GEN-001R02 - RWC - Elevator Walls Formwork Drawing - MTA.pdf`. Elapsed 32 seconds. 7 sources with exact page provenance but the target file returned 0 useful nodes.  
*Answer:* "The retrieved context does not contain information about the NYCT/MTA submittal designation."

---

### INVOICE

**[sq26] Invoice 11707 — pest control services/locations** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 35 lexical = 106 merged. Elapsed 32 seconds. `Invoice 11707.pdf` p. 1 retrieved as top source.  
*Answer (grounded):* Joe's Pest Control, Middletown Stations. Service dates: 2/5/2026 (Order 8780), 2/12/2026 (Order 3029), 2/19/2026 (Order 3086).  
*Source:* `Invoice 11707.pdf` p. 1.

**[sq27] Invoice 11830 — Middletown services/April order numbers** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 35 lexical = 106 merged (same retrieval). `Correction invoice 118350.pdf` chunk=2 (p. 1) rel=0.970 was the grounding source.  
*Answer (grounded):* Joe's Pest Control, Middletown Stations. April 2026 orders: April 2 (3421), April 9 (3488), April 16 (3548), April 23 (3645), April 26 (3557).  
*Citation:* `Correction invoice 118350.pdf` chunk=2 (p. 1) rel=0.970. (Note: grounded in correction invoice, same data)

**[sq28] Lockton Invoice 0849812 — remittance instructions** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `2025 Lockton Invoice 0849812.pdf`. 0 chunks — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq29] Lockton Invoice 0849812 — total invoiced amount** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq28, same 0-chunk result.  
*Answer:* "No evidence-backed specification text was verified."

**[sq30] Backup for Invoice#01 — Dec 6, 2025 T&M work** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `Backup for Invoice#01.pdf`. 0 chunks — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq31] Backup for Invoice#01 — Dec 7, 2025 T&M work** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq30, same 0-chunk result.  
*Answer:* "No evidence-backed specification text was verified."

**[sq33] Invoice#01 dated Dec 31, 2025 — G703 retainage/net payment** ❌ WRONG DOC  
*How it retrieved:* Routed to `documents, cost`. Retrieved `2025-10-21 Eagle Business Machine Inv# 129318 $43.55 (M017 99-1530).pdf` — an unrelated invoice. Invoice#01 not found.  
*Answer:* "No evidence-backed specification text was verified in 2025-10-21 eagle business machine inv# 129318."

---

### MEETING MINUTES

**[sq34] GEN-042R00 A37806 & C49321R Coordination Meeting** 🔲 NOT INDEXED  
*How it retrieved:* Found `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf` via active-doc boost. 0 nodes extracted.  
*Answer:* "The requested document was not found in the retrieved context."

**[sq35] September 3, 2025 coordination meeting discussion** ❌ WRONG DOC  
*How it retrieved:* Query matched `A37806_01 35 70_GEN-009R00 - FIO - Utility Coordination - September 2025.pdf` — wrong meeting (utility coordination vs. A37806/C49321R coordination). Elapsed 2 seconds.  
*Answer:* "More context needed." Wrong file surfaced.

**[sq36] A37806 Kick Off Pre-Work Conference — document contents** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx`. 0 chunks extracted from PPTX.  
*Answer:* "No evidence-backed specification text was verified."

**[sq37] A37806 Kick Off Pre-Work Conference — milestones/work sequencing** 🔲 NOT INDEXED  
*How it retrieved:* Same PPTX as sq36, same 0-chunk result. Routed to `scheduling, communication`.  
*Answer:* "No evidence-backed specification text was verified."

**[sq38] July 24, 2025 Monthly Progress Meeting — MLJ/TC Electric attendees** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf`. 0 chunks — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq39] July 24, 2025 Monthly Progress Meeting — T.Y. Lin/external consultants** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq38, same 0-chunk result.  
*Answer:* "No evidence-backed specification text was verified."

**[sq40] May 28, 2026 Monthly Progress Meeting — CPR-003 Rev 2 / Burnside DOT** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf`. 0 chunks — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

**[sq41] May 28, 2026 Monthly Progress Meeting — Grade Operations count by station** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq40, same 0-chunk result. Routed to `documents, contracts`.  
*Answer:* "No evidence-backed specification text was verified."

**[sq42] SDI-MLJ Dec 19, 2025 Bi-weekly Meeting — open action items/target dates** ✅ PASS *(new after reindex)*  
*How it retrieved:* Hybrid: 72 vector + 56 lexical = 127 merged. Elapsed 60 seconds. `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx` — 4 chunks retrieved from the DOCX (chunks 0, 2, 4, 5), all rel=1.000.  
*Answer (grounded):* Full list of 10 open SDI action items with owners and target dates:
- OCIP/sub approval for surveyor → SDI, by 12/22/2025  
- SWPs/QWPs/CWPs → SDI/MLJ, by 01/14/2026  
- Quality Management Plan → SDI/MLJ, by 01/14/2026  
- Mullion Material Sample → SDI, by 01/09/2026  
- Roofing Material Sample → SDI, by 12/26/2025  
- Roofing Material Lead Times → SDI, by 12/17/2025  
- EL541 Enclosure Shop Drawing Status → SDI, by 12/22/2025  
- Roofing Shop Drawing Status (Elevator Towers) → SDI, by 12/22/2025  
- Roofing Shop Drawing Status (Platform Extension) → SDI, no date  
- Detail around existing signal tray at Avenue I → SDI, by 12/19/2025  
*Citations:* 4 chunks from the DOCX all at rel=1.000.

**[sq43] SDI-MLJ Dec 19, 2025 Bi-weekly Meeting — OCIP/surveyor approval status** ✅ PASS *(new after reindex)*  
*How it retrieved:* Same DOCX, chunks 0, 5, 2 (rel=1.000). Elapsed 2 seconds (cached retrieval).  
*Answer (grounded):* OCIP approval **pending from MTA** (p. 1). Surveyor subcontractor approval targeted for **December 22, 2025** — SDI is responsible for obtaining it.  
*Citations:* `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx` chunks 0 and 5 (rel=1.000).

---

### PERMIT

**[sq44] Current permits submitted for Burnside Ave** ⚠️ PARTIAL  
*How it retrieved:* Hybrid: 72 vector + 1 lexical = 73 merged. Elapsed 32 seconds. Active-doc boost found `4-23-26 SIG REQ NEW DOT PERMITS - Burnside Ave Station.pdf` (NODE 3). Context mixed with QWP/CWP documents.  
*Answer (partial):* Request for new DOT permits filed 4/23/26 — purpose: Occupancy of Roadway. Other permit submittals (BUR-series) not surfaced.

**[sq45] Current permits submitted for Ave I** ⚠️ PARTIAL  
*How it retrieved:* Active-doc boost found 2 AVI permit submittals only, elapsed 2 seconds. Routed to `documents`.  
*Answer (partial):* Two permit files on record — `AVI-001R00 - FIO - DOT Permits Exp. 05.30.25.pdf` and `AVI-002R00 - FIO - Tree Work Permits.pdf`. No detail on permit content.

**[sq46] Current permits submitted for Myrtle Ave** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 1 lexical = 73 merged. Elapsed 32 seconds. Multiple MYR permit files retrieved.  
*Answer (grounded):* DOT Permits Exp. 11.07.25 & 11.21.25 (issued 10/17/2025, permit type 0112P — Rapid Transit Construct/Alteration); DOT Permits Exp. 3-08 & 3-13-26; New DOT Permits Exp. 11/21/25 (issued 9/5/2025).  
*Sources:* `MYR-006R00 - FIO - DOT Permits Exp. 11.07.25 & 11.21.25.pdf`, `7.a DOT PERMITS EXP 3-08 & 3-13-26.pdf`, `DOT PERMITS EXP 11-21-25 NEW (Myrtle Ave Station).pdf`.

**[sq47] Current permits submitted for Middletown Ave** ✅ PASS  
*How it retrieved:* Active-doc boost (1 source, 0 nodes for the active doc) but also pulled from vector index; elapsed 2 seconds. Routed to `documents`.  
*Answer (grounded):* Full list of 22 MDT permit submittals retrieved — MDT-001R00 through MDT-017R00 (DOT permit expirations 4.30.25 through current 2026 dates), tree work permit (MDT-005R00), hydrant permits, and delay-in-submission letter (MTACD-MLJTC2-L-0117).  
*Sources:* 8 MDT permit PDFs listed.

**[sq48] Current permits submitted for Norwood Ave** ✅ PASS  
*How it retrieved:* Hybrid: 72 vector + 1 lexical = 73 merged. Elapsed 34 seconds.  
*Answer (grounded):* 1 New & Amended DOT Permit exp. 09/24/2025; 12 Renewed Permits (8 at 1 Fulton St + 4 at 2 Fulton St), issued 3/16/2026 exp. 6/01/2026; 1 Renewed DOT Permit exp. 1/31/2026; Norwood 29-day hydrant permit #H326736.  
*Sources:* `12 RENEWED PERMITS - NORWOOD AVE [26195.MLJ.DOT] EXP 6-1-26.pdf`, `DOT PERMITS EXP 1-31-26 RENEWED (Norwood Ave Station).pdf`, etc.

**[sq49] MDT-005R00 Tree Work Permit — nursery standards/rejected material** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`. 0 chunks — scanned PDF.  
*Answer:* "No evidence-backed specification text was verified."

---

### PHOTO

**[sq54] BUR-081R00 January 2026 Construction Photos — Jan 20 NB side work** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `A37806_01 32 10_BUR-081R00 - FIO - January 2026 Construction Photos.pdf`. 0 nodes — scanned/image-only PDF.  
*Answer:* "The requested document was not found in the retrieved context."

**[sq55] BUR-081R00 January 2026 Construction Photos — MPT/ConEd work** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq54, 0 nodes.  
*Answer:* "The requested document was not found in the retrieved context."

**[sq56] BUR-080R00 Burnside December 2025 Photos — track shielding** ❌ WRONG DOC  
*How it retrieved:* Retrieved `Photo Apr 02 2025, 8 12 26 AM.jpg` — a standalone photo file. BUR-080R00 PDF not surfaced.  
*Answer:* "No evidence-backed specification text was verified in photo apr 02 2025."

**[sq57] BUR-080R00 Burnside December 2025 Photos — MPT/shielding NB side** ❌ WRONG DOC  
*How it retrieved:* Same wrong source as sq56.  
*Answer:* "No evidence-backed specification text was verified."

**[sq58] MYR-076R00 Myrtle December 2025 Photos — Dec 19 ADA work** 🔲 NOT INDEXED  
*How it retrieved:* Active-doc boost found `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`. 0 nodes — image-only PDF.  
*Answer:* "I need access to the document. The document is not currently open and no information was retrieved."

**[sq59] MYR-076R00 Myrtle December 2025 Photos — submittal designation** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq58, 0 nodes.  
*Answer:* "The submittal designation is not available in the current project context."

---

### REPORT

**[sq60] May 13, 2025 Burnside VECP Presentation — value engineering background** ❌ WRONG DOC  
*How it retrieved:* Retrieved `0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07.pdf` — a different Burnside Ave contract document (A-37808, not A37806). VECP presentation not surfaced.  
*Answer:* "No evidence-backed specification text was verified in 0050 - a-37808 (76114)."

**[sq61] Burnside VECP Presentation — ADA scope being value-engineered/final delivery date** ❌ WRONG DOC  
*How it retrieved:* Retrieved `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf` — the Burnside option work volume, not the VECP presentation.  
*Answer:* "No evidence-backed specification text was verified."

---

## Improvements vs. July 17 Run

| Question | Jul 17 | Jul 22 | Change |
|---|---|---|---|
| sq19 AVI-002R01 rebar drawings | 🔲 NOT INDEXED (R00 scanned) | ✅ PASS (R01 FIO, 3 chunks) | ⬆️ Upgraded |
| sq42 SDI-MLJ Dec 19 action items | 🔲 NOT INDEXED | ✅ PASS (DOCX, 4 chunks) | ⬆️ Upgraded |
| sq43 SDI-MLJ Dec 19 OCIP/surveyor | 🔲 NOT INDEXED | ✅ PASS (DOCX, 3 chunks) | ⬆️ Upgraded |
| sq07 GEN-027R00 Crossroads JV | ❌ WRONG DOC (spec list) | 🔲 NOT INDEXED (correct file) | ⬆️ File routing improved |
| sq08 GEN-027R00 ownership | ❌ WRONG DOC | 🔲 NOT INDEXED (correct file) | ⬆️ File routing improved |
| sq09/sq10 M017_IMP Subcontract | 🔲 NOT INDEXED | 🔲 NOT INDEXED | ➡️ No change (dual-record bug) |

---

## Persistent Failure Patterns

| Pattern | Questions Affected | Root Cause |
|---|---|---|
| Scanned MTA approval letters | sq04, sq13–sq17 | Single-page scanned PDFs — no text layer, OCR not run |
| Scanned invoice PDFs | sq28–sq31 | Scanned documents — PDF indexer cannot extract text |
| Monthly progress report PDFs | sq38–sq41 | Scanned/image-only PDFs |
| Construction photo PDFs | sq54–sq55, sq58–sq59 | Photo-only PDFs, no caption text indexed |
| M017_IMP Draft Subcontract | sq09–sq10 | Dual-record/stale-vector-index: 168 DOCX chunks created but old 0-chunk record still used for retrieval |
| PPTX files (Kick Off) | sq36–sq37 | No text extracted from slide deck |
| VECP presentation | sq60–sq61 | Document not in index; A-37808/Volume 08A retrieved instead |
| GEN-042R00 change order | sq01, sq34 | Submittal number prefix "GEN-042" matches spec list; no direct chunk hit for the change order |
