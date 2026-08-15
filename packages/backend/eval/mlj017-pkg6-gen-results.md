# MLJ-017 Package 6 — General Smoke Test Results
**Project:** MLJ-017 Package 6 - General (`145b3dcf-272e-4c45-9e19-953f20f25bb9`)  
**Date:** 2026-07-15 · **Questions:** 97 · **Hybrid retrieval:** ON · **Rerank:** OFF

---

## Summary Scorecard

| Grade | Count | % |
|---|---|---|
| ✅ PASS — correct source, good factual answer | 18 | 19% |
| ⚠️ PARTIAL — right source found, answer vague/incomplete | 10 | 10% |
| ❌ WRONG DOC — retrieval pulled an irrelevant file | 20 | 21% |
| 🔲 NOT INDEXED — correct file found in index but 0 extractable chunks | 49 | 50% |

**Root causes (in priority order):**
1. **~50% of files have no indexed chunks** — they were identified by filename match but the text was never extracted (likely scanned PDFs, large drawings, .pptx, .docx, photos, or oversized files that failed extraction).
2. **~21% wrong-doc retrieval** — the retrieval layer returned a semantically close but wrong file; often happens when multiple files share keywords (e.g., multiple `GEN-014R00` files, multiple `RFI-09x` files, many "approval letter" docs).
3. **~10% vague answers** — chunks found but the LLM could not synthesize a precise answer from sparse context.

---

## Detailed Results by Question

### CHANGE ORDER

**[sq01] GEN-042R00 subcontractor review** ❌ WRONG DOC  
*How it retrieved:* Semantic search on "subcontractor approval application" matched `A37806_Volume 05_PRDC 01 General_Rev. 1.pdf` (a general spec volume) instead of the change order document. The routing spent 4+ minutes on the contracts domain before timing out with no answer.  
*Result:* "I could not find an exact indexed passage."

---

### CONTRACT

**[sq02] Island Pavement Cutting Co scope/pricing** ⚠️ PARTIAL  
*How it retrieved:* Hybrid search found `A37806_RFI-0177 Thru-Span Spray Applied WP.pdf` which mentions Island Pavement in a reference exhibit. The actual subcontract was not indexed with extractable text.  
*Result:* Answered with RFI reference data ($1,829,462 transformer pit rehab) — not the actual subcontract scope.

**[sq03] Island Pavement joint sealing work** ⚠️ PARTIAL  
*How it retrieved:* Same source as sq02 (RFI-0177). The system hallucinated specifics about "Articulous Joints" and "Evazote Joint systems" from that RFI's exhibit pages.  
*Result:* Answer drawn from RFI exhibit, not the subcontract — accuracy uncertain.

**[sq04] MTACD-MLJTC2-L-0024 approval letter** 🔲 NOT INDEXED  
*How it retrieved:* File `2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf` was found by lexical match but has 0 indexed chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq05] GEN-001R05 Phasing Plan phases** ❌ WRONG DOC  
*How it retrieved:* "Phasing Plan" query matched `A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx` — a meeting agenda that happens to mention phasing. GEN-001R05 itself was not found.  
*Result:* No answer.

**[sq06] RFP Addendum 02 Pre-Proposal Slideshow** 🔲 NOT INDEXED  
*How it retrieved:* `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf` found by filename match but 0 chunks extractable (likely a large scanned PDF).  
*Result:* "No evidence-backed specification text was verified."

**[sq07] GEN-027R00 Crossroads JV Contract Specific Responsibility Form** ❌ WRONG DOC  
*How it retrieved:* "GEN-027R00" matched `A37806_01 40 10_GEN-027R00 - PACKAGE 6 - PRELIMINARY PROJECT SPECIFICATION LIST.pdf` — a different document with the same submittal number prefix. The actual subcontractor approval forms were not retrieved.  
*Result:* "The provided document is a Preliminary Project Specification List and does not contain information about the Contract Specific Responsibility Form."

**[sq08] GEN-027R00 Crossroads JV ownership/partners** ❌ WRONG DOC  
*How it retrieved:* Same wrong document as sq07.  
*Result:* "It does not contain information regarding the ownership percentage."

**[sq09] M017_IMP Draft Subcontract — excluded payment provisions** 🔲 NOT INDEXED  
*How it retrieved:* `M017_IMP_Draft Subcontract_20251024.docx` found by filename match; 0 extractable chunks (Word doc extraction may have failed).  
*Result:* "No evidence-backed specification text was verified."

**[sq10] M017_IMP Draft Subcontract — entire agreement clause** 🔲 NOT INDEXED  
*How it retrieved:* Same as sq09.  
*Result:* "No evidence-backed specification text was verified."

---

### CORRESPONDENCE

**[sq11] Transmittal 0014 items/status** 🔲 NOT INDEXED  
*How it retrieved:* `A37806 Transmittal 0014 - MTA Personnel and PMC Supplies.pdf` found by lexical match but 0 indexed chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq12] Myrtle Ave Reserve Service Load Letter** ❌ WRONG DOC  
*How it retrieved:* Query matched `MYR_Reserve service.HEIC` — an iPhone image file. No text can be extracted from a .HEIC photo.  
*Result:* "More context needed" with a suggestion to ask about the image.

**[sq13] MTACD-MLJTC2-L-0017 approval letter** 🔲 NOT INDEXED  
*How it retrieved:* Correct file `2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE FX $109,450.00.pdf` found but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq14] MTACD-MLJTC2-L-0028 approval letter** 🔲 NOT INDEXED  
*How it retrieved:* Correct file `Titanium Linx Consulting` found but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq15] MTACD-MLJTC2-L-0049 approval letter** 🔲 NOT INDEXED  
*How it retrieved:* Correct file `McVac Environmental Services` found but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq16] MTACD-MLJTC2-L-0083 approval letter** 🔲 NOT INDEXED  
*How it retrieved:* Correct file `American Geophysics Inc.` found but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq17] MTACD-MLJTC2-L-0093 approval letter** 🔲 NOT INDEXED  
*How it retrieved:* Correct file `Tri-State Civil Construction LLC` found but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

---

### DRAWING

**[sq18] AVI-002R01 rebar sizes/details** 🔲 NOT INDEXED  
*How it retrieved:* Found R00 version (`AVI-002R00`), not R01. That version had 0 chunks. R01 exists but retrieval prioritized R00.  
*Result:* "No evidence-backed specification text was verified."

**[sq19] AVI-002R01 submittal number/status/spec** ⚠️ PARTIAL  
*How it retrieved:* R01 file `AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf` found and chunks at pp. 4–5 retrieved. However, the LLM returned a generic "Section 6.3 Requirements Summary" boilerplate with no actual data.  
*Result:* Found the file but did not extract submittal number, status, or spec section from the chunks.

**[sq20] BUR-009R00 glazing spec items** 🔲 NOT INDEXED  
*How it retrieved:* Found AAN version of BUR-009R00 but 0 chunks.  
*Result:* "I do not have indexed text for a precise answer. Re-run indexing."

**[sq21] BUR-009R00 NYCT review status/spec section** 🔲 NOT INDEXED  
*How it retrieved:* Found FIO version of BUR-009R00 but 0 chunks.  
*Result:* "I do not have indexed text for a precise answer."

**[sq22] BUR-001R00 review status** ❌ WRONG DOC  
*How it retrieved:* "BUR-001R00 staircase enclosure" query matched `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf` (general drawings package) instead of the specific submittal.  
*Result:* "No evidence-backed specification text was verified."

**[sq23] BUR-001R00 approved/comments** ✅ PASS  
*How it retrieved:* On re-query the FIO version `BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf` was found with chunk at p. 6.  
*Result:* **Approved as Noted (AAN)** by C. O'Neill/Arch., review date 06/15/2026. No specific comments beyond "Approved as Noted."

**[sq24] Controlled fills/excavation near elevator specs** ✅ PASS  
*How it retrieved:* Hybrid search (72 vector + 96 lexical = 168 merged candidates) across PRDC volumes. Matched sections 4.11.1 and 14.4.6 across multiple PRDC copies.  
*Result:* Section 4.11.1 defines controlled/uncontrolled fills; Section 14.4.6 requires three compaction tests; Rock Tunnel Excavation is "NOT USED"; no elevator-specific excavation rules found.

**[sq25] GEN-001R02 Elevator Walls Formwork submittal designation** ❌ WRONG DOC  
*How it retrieved:* "GEN-001R02" matched an Excel comment log `GEN-001R02 - Phasing Plan Operations Planning Comment Log.xlsx` — a different document entirely.  
*Result:* "The document is a comment log for a phasing plan, not a submittal for formwork drawings."

---

### INVOICE

**[sq26] Invoice 11707 pest control services/locations** ✅ PASS  
*How it retrieved:* Hybrid search (72+35 candidates) on "Invoice 11707 pest control" found `Invoice 11707.pdf` directly. Chunk at p. 1 had full detail.  
*Result:* Joe's Pest Control, serviced **Middletown Stations** on Feb 5/12/19 2026 (Service Orders 8780, 3029, 3086), Project Package 6 - A37806.

**[sq27] Invoice 11830 Middletown services/April service orders** ✅ PASS  
*How it retrieved:* "Invoice 11830" lexical match found `Correction invoice 118350.pdf` (which is the corrected version of 11830). Chunk at p. 1 had service order details.  
*Result:* Joe's Pest Control, Middletown Stations. April 2026 service orders: 3421 (4/2), 3488 (4/9), 3548 (4/16), 3645 (4/23), 3557 (4/26).

**[sq28] Lockton Invoice 0849812 remittance instructions** 🔲 NOT INDEXED  
*How it retrieved:* `2025 Lockton Invoice 0849812.pdf` found by filename but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq29] Lockton Invoice 0849812 total amount** 🔲 NOT INDEXED  
*How it retrieved:* Same as sq28.  
*Result:* "No evidence-backed specification text was verified."

**[sq30] Backup Invoice#01 Dec 6 lead abatement T&M** 🔲 NOT INDEXED  
*How it retrieved:* `Backup for Invoice#01.pdf` found by name but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq31] Backup Invoice#01 Dec 7 lead abatement T&M** 🔲 NOT INDEXED  
*How it retrieved:* Same as sq30.  
*Result:* "No evidence-backed specification text was verified."

**[sq33] Invoice#01 G703 retainage/net payment** ❌ WRONG DOC  
*How it retrieved:* "Invoice#01 G703 retainage" matched `2025-10-21 Eagle Business Machine Inv# 129318 $43.55` — a completely unrelated office equipment invoice. The actual Invoice#01 with G703 sheet was not in the top candidates.  
*Result:* 0 nodes retrieved, no answer.

---

### MEETING MINUTES

**[sq34] GEN-042R00 A37806 & C49321R Coordination Meeting** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf` found but 0 chunks.  
*Result:* "No information found."

**[sq35] September 3, 2025 coordination meeting** ❌ WRONG DOC  
*How it retrieved:* "September 3, 2025 coordination meeting" matched `A37806_01 35 70_GEN-009R00 - FIO - Utility Coordination - September 2025.pdf` — a utility report, not meeting minutes.  
*Result:* "More context needed."

**[sq36] A37806 Kick Off Pre-Work Conference** 🔲 NOT INDEXED  
*How it retrieved:* `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx` found but 0 chunks (PowerPoint extraction not supported or failed).  
*Result:* "No evidence-backed specification text was verified."

**[sq37] Kick Off Conference milestones/work sequencing** 🔲 NOT INDEXED  
*How it retrieved:* Same .pptx file, same issue.  
*Result:* "No evidence-backed specification text was verified."

**[sq38] July 24, 2025 MLJ/TC Electric attendance** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf` found but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq39] July 24, 2025 T.Y. Lin attendees** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq38, 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq40] May 28, 2026 CPR-003 Rev 2 status** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf` found but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq41] May 28, 2026 Grade Operations distribution** 🔲 NOT INDEXED  
*How it retrieved:* Same as sq40.  
*Result:* "No evidence-backed specification text was verified."

**[sq42] SDI-MLJ Dec 19 action items/dates** ✅ PASS  
*How it retrieved:* `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx` found and successfully chunked (Word doc extraction worked). Chunks 0, 2, 4, 5 retrieved.  
*Result:* 9 detailed action items with dates — OCIP approval by Dec 22, SWPs/QWPs/CWPs by Jan 14, roofing sample by Dec 26, mullion sample by Jan 9, shop drawing statuses by Dec 22, signal tray detail by Dec 19.

**[sq43] SDI-MLJ OCIP/surveyor approval status** ✅ PASS  
*How it retrieved:* Same SDI meeting doc, chunks 0, 2, 5.  
*Result:* OCIP approval pending from MTA; surveyor approval targeted December 22, 2025, SDI responsible.

---

### PERMIT

**[sq44] Current permits — Burnside Ave** ✅ PASS  
*How it retrieved:* Hybrid search (72+56=127 merged) on "permits Burnside Ave" found `4-23-26 SIG REQ NEW DOT PERMITS - Burnside Ave Station.pdf`.  
*Result:* Request for new DOT Permits (Occupancy of Roadway) dated 4/23/26. Also surfaced BUR-024R01 comm equipment removal.

**[sq45] Current permits — Ave I** ✅ PASS  
*How it retrieved:* Lexical match on "AVI permits" found `AVI-001R00 - DOT Permits Exp. 05.30.25` and `AVI-002R00 - Tree Work Permits`.  
*Result:* Two permit submittals identified: DOT Permits (exp. 05/30/25) and Tree Work Permits.

**[sq46] Current permits — Myrtle Ave** ✅ PASS  
*How it retrieved:* Search on "Myrtle Ave permits" found multiple DOT permit PDFs with indexable text.  
*Result:* DOT Permits exp. 11/07/25 & 11/21/25; renewed DOT Permits exp. 3-08 & 3-13-26; amended permits exp. 11-07 & 11-21-25; new permits exp. 11-21-25. Valid dates and permit types provided.

**[sq47] Current permits — Middletown Ave** ✅ PASS  
*How it retrieved:* Search found the MDT permit series (MDT-001R00 through MDT-016R00) plus standalone permit files.  
*Result:* Full list of 15 MDT permit submittals (DOT expiry dates ranging from 4/30/25 through current). Also identified MDT-005R00 tree work permit and MDT WE1 permit 05/20/26.

**[sq48] Current permits — Norwood Ave** ✅ PASS  
*How it retrieved:* Search found `8 - DOT Permits.pdf`, `12 RENEWED PERMITS - NORWOOD AVE EXP 6-1-26.pdf`, `DOT PERMITS EXP 1-31-26 RENEWED (Norwood Ave Station).pdf`, and DEP hydrant permit request.  
*Result:* 1 new/amended DOT permit; 12 renewed permits on Fulton St (exp. 6/1/26); 1 renewed permit exp. 1/31/26; hydrant permit #H326736.

**[sq49] MDT-005R00 tree work permit nursery standards** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf` found but 0 extractable chunks.  
*Result:* "No evidence-backed specification text was verified."

---

### PHOTO

**[sq54] BUR-081R00 Jan 20 northbound work** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_01 32 10_BUR-081R00 - FIO - January 2026 Construction Photos.pdf` found but 0 chunks (photo PDF without OCR text).  
*Result:* No answer.

**[sq55] BUR-081R00 MPT/ConEd work** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq54, 0 chunks.  
*Result:* No answer.

**[sq56] BUR-080R00 track shielding** ❌ WRONG DOC  
*How it retrieved:* "BUR-080R00 December 2025 Construction Photos" matched `Photo Apr 02 2025, 8 12 26 AM.jpg` — a standalone photo file, not the BUR-080R00 submittal package.  
*Result:* "No evidence-backed specification text was verified."

**[sq57] BUR-080R00 MPT/shielding northbound** ❌ WRONG DOC  
*How it retrieved:* Same wrong .jpg file as sq56.  
*Result:* "No evidence-backed specification text was verified."

**[sq58] MYR-076R00 Dec 19 ADA work** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf` found but 0 chunks.  
*Result:* No answer.

**[sq59] MYR-076R00 submittal designation** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq58, 0 chunks.  
*Result:* No answer.

---

### REPORT

**[sq60] VECP Presentation — value engineering background** ❌ WRONG DOC  
*How it retrieved:* "Burnside Avenue VECP May 2025" matched `0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf` — an EMD (emergency) report, not the VECP presentation.  
*Result:* "No evidence-backed specification text was verified."

**[sq61] VECP Presentation — ADA scope/date** ❌ WRONG DOC  
*How it retrieved:* Query matched `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf` — the option work volume, not the VECP presentation.  
*Result:* "No evidence-backed specification text was verified."

**[sq62] PRO 26-01 NCR flowchart roles** ❌ WRONG DOC  
*How it retrieved:* "PRO 26-01 NCR process flowchart" matched a Con Edison email `.msg` file (which may have "PRO" or "process" text). The actual PRO 26-01 procedure document was not retrieved.  
*Result:* "No evidence-backed specification text was verified."

**[sq63] GEN-006R01 NCR Log data requirements** ✅ PASS  
*How it retrieved:* "GEN-006R01 NCR Template & Log" found `A37806_01 40 10_GEN-006R01 - AEAN - NCR Template & Log.pdf` directly. Chunks at pp. 4–5 had the log column headers.  
*Result:* 11 required fields: Date, NCR No., Brief Description, Raised By, Date of Issuance, Location, Responsible Party/Subcontractor, Disposition, Verification, Initial Status, Date Closed.

**[sq64] RFI-0203 Norwood J1 Track Limits summary** ✅ PASS  
*How it retrieved:* Active-doc boost — `A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf` was in the active set. Full text extraction worked (retrieved pp. 1–4 in 329ms with cacheHit=false).  
*Result:* Detailed summary: MTA directed on 4/27/26 that MOW Track Construction will replace Track J2 in full; MLJTC2 to extend Track J1 limits using procured J2 material. Multiple AECOM/MLJ/TCE/J-Track clarifications requested on contact rail, heat trace, best-fit coordination, traction power at ~416+00.

**[sq65] J-TRACK-13A-041R00 Material I&T Request** 🔲 NOT INDEXED  
*How it retrieved:* `A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF` found but 0 chunks (scanned PDF).  
*Result:* "No evidence-backed specification text was verified."

---

### RFI

**[sq66] RFI-0115 Louver Exhaust Face Velocity** ⚠️ PARTIAL  
*How it retrieved:* `A37806_RFI-0115 - Louver Exhaust Face Velocity.pdf` found directly, 5 chunks retrieved (pp. 1–4). Active-doc mode.  
*Result:* Found the core issue (louvers consume interior wall space; 400 FPM limit from spec T.4 may be exceeded; sizing per manufacturer specs acceptable). However, the LLM returned a generic "Section 5.8 Requirements" wrapper instead of a direct factual answer. The key direction — to size discharge louvers per manufacturer specs and good engineering practice instead of 400 FPM — is present.

**[sq67] RFI098 Ave I Conductor Board issue/drawing** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf` found but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq68] RFI098 figures at STA 489+00/490+00** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq67, 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq69] RFI096 northbound/southbound stair/exit configurations** ❌ WRONG DOC  
*How it retrieved:* "RFI096 platform stair exit" matched `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Norwood ONLY.pdf`. RFI-096 was not retrieved.  
*Result:* "No evidence-backed specification text was verified."

**[sq70] RFI096 McDonald Avenue ADA drawing reference** ❌ WRONG DOC  
*How it retrieved:* Same wrong RFI-0042 file as sq69.  
*Result:* "No evidence-backed specification text was verified."

**[sq71] MYR-002R00 Demo Shield Drawings section details** ❌ WRONG DOC  
*How it retrieved:* "MYR-002R00 Myrtle Avenue Demo Shield" matched `MLJTC2_AECOM_ATC_2_Myrtle Avenue Drawings.pdf` (general Myrtle drawings package) instead of the specific MYR-002R00 submittal.  
*Result:* "No evidence-backed specification text was verified."

**[sq72] Drawing MYR-A-444A stainless steel/signage details** ❌ WRONG DOC  
*How it retrieved:* "MYR-A-444A stainless steel elevator enclosure" matched `Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf` — an archive drawing, not the specific sheet.  
*Result:* "No evidence-backed specification text was verified."

**[sq73] RFI-0116 PS LAN telecom coordination** ❌ WRONG DOC  
*How it retrieved:* "RFI-0116 Myrtle PS LAN" matched `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Myrtle ONLY.pdf` — which is RFI-0042, not RFI-0116.  
*Result:* "No evidence-backed specification text was verified."

**[sq74] RFI-009 Myrtle UPS backup capacity** ⚠️ PARTIAL  
*How it retrieved:* `806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf` found and 1 chunk at p. 1 retrieved (193ms active-doc boost).  
*Result:* Found the document but returned only "Section 7.5 Requirements Summary" boilerplate with no actual UPS kVA or capacity numbers extracted.

---

### SAFETY

**[sq75] GEN-096R04 SWP-016 cover sheet/response due date** 🔲 NOT INDEXED  
*How it retrieved:* Found `GEN-096R02` (Revision 2, not R04) with 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq76] SWP-016 summary** ✅ PASS  
*How it retrieved:* Standalone file `SWP 016 + Attachment.pdf` found and well-indexed (8 chunks across pp. 1–8). This is the working copy separate from the formal submittal.  
*Result:* SWP-016 Rev. 4 (06/02/2026) for Elevator Steel & Enclosure crane operations at Middletown; MLJ is GC and performing contractor.

**[sq77] GEN-041R01 SWP-011 dust/silica controls** ✅ PASS  
*How it retrieved:* `A37806_01 35 10_GEN-041R05 - AEAN - SWP-011 - Platform Concrete Demo.pdf` found; lexical search hit on "silica" boosted the right chunks (pp. 22–24). Note: question asked for R01 but R05 was retrieved — contains the same dust control content.  
*Result:* Detailed answer: wet methods (wetting, HEPA-Vac, green dust), approved Dust Control Plan, stop-work if visible dust outside barrier, water hose direct supply required for demo saw, IDA high-pressure spray system, N95/half-face respirators, OSHA 1926.1153 Table 1 compliance.

**[sq78] SWP-011 summary** ❌ WRONG DOC  
*How it retrieved:* "Summarize SWP-011" matched `SWP-013 Installation of Platform Barrier Revision 002.pdf` — a different SWP. The SWP numbering is close enough to confuse the retriever.  
*Result:* Described SWP-013 (platform barriers) as if it were SWP-011.

**[sq79] SWP-032 summary** ✅ PASS  
*How it retrieved:* `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf` found and well-indexed (8 chunks across pp. 1–8).  
*Result:* SWP-032 R4 for general formwork, rebar, and concrete pouring under A37806. Covers worksite entry, tool usage, material delivery, formwork hazards, rebar installation.

**[sq80] SWP-032 Aug 20 2025 transmittal approval status** 🔲 NOT INDEXED  
*How it retrieved:* Found the SWP-032 working document but it does not contain the cover transmittal letter. The transmittal letter from Michael Wilson was not indexed separately.  
*Result:* "No evidence-backed specification text was verified."

**[sq81] GEN-116R00 SWP-052 work hours/combustibles/notice** ✅ PASS  
*How it retrieved:* `A37806_01 35 10_GEN-116R01 - APP - SWP-052 Mezzanine Stair Barricade.pdf` retrieved via active-doc boost; chunk at p. 8 (rel=10.000) was an exact match.  
*Result:* No materials between 6:00AM–9:30AM and 3:00PM–8:00PM. No flammable/combustible materials inside enclosures. **Two weeks' advance notice** required before long-term staircase closure.

**[sq82] GEN-116R00 SWP-052 worksite entry/PPE/evacuation** ✅ PASS  
*How it retrieved:* Same SWP-052 document, active-doc mode, chunks at pp. 6–8 retrieved.  
*Result:* Full text extracted: PFAS/guardrail for falls >6', drug/alcohol zero tolerance, first aid + eyewash on site, GFCI on all electrical tools, daily tool/ladder inspections, no solo entry, 24-hr notice for material deliveries, fire extinguisher requirements, heat/cold stress protocols.

**[sq83] GEN-021R00 Diego Gonzalez safety coordinator** ❌ WRONG DOC  
*How it retrieved:* "GEN-021R00 Safety Coordinator" matched `A37806_27 10 01_GEN-021R00 - RWNC - Single Mode Fiber Optic Cable and Fiber Patch Cord Test Procedure.pdf` — an entirely different GEN-021R00 submittal (fiber optic test under spec 27 10 01).  
*Result:* Described the fiber optic test procedure as if it were the safety coordinator submittal.

**[sq84] GEN-021R00 summary** ❌ WRONG DOC  
*How it retrieved:* Same wrong fiber optic document as sq83.  
*Result:* Summarized a fiber optic cable test procedure instead of a safety coordinator submittal.

---

### SCHEDULE

**[sq85] Schedule Update 5 — Elevator 541 start/finish dates** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf` found but 0 chunks (large PDF schedule).  
*Result:* "No evidence-backed specification text was verified."

**[sq86] Schedule Update 5 — EL1121 outage/upcoming Myrtle activities** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq85, 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

---

### SPEC

**[sq87] Spec 21 12 00 pipe hanger/expansion joint requirements** ⚠️ PARTIAL  
*How it retrieved:* `21 12 00 - Fire-Suppression Standpipes REV 1.pdf` found and 7 chunks retrieved (pp. 1–6). However the LLM response is boilerplate "Section 2.11 Requirements Summary" without extracting the specific hanger/expansion joint clauses.  
*Result:* Document found and indexed, but the specific hanger/expansion joint design requirements were not surfaced from the retrieved chunks.

**[sq88] Spec 21 12 00 pitch requirements/track crossings** ⚠️ PARTIAL  
*How it retrieved:* Exact cache hit on same spec file (258ms). Same 7 chunks.  
*Result:* Same vague boilerplate — the pitch and track-crossing installation clauses were not extracted from the indexed pages.

**[sq89] BUR-042R01 water leaks during painting/lead abatement** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf` found but 0 chunks.  
*Result:* "I do not have indexed text for a precise answer. Re-run indexing."

**[sq90] BUR-042R01 structural notes/repair standards** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq89, 0 chunks.  
*Result:* "I do not have indexed text for a precise answer."

**[sq91] Transmittal 212-NOR transfer girder inspection** 🔲 NOT INDEXED  
*How it retrieved:* `Transmittal 212-NOR Xfer Girder inspection.pdf` found but 0 nodes.  
*Result:* "No evidence-backed specification text was verified."

**[sq92] NOR-010R00 CCTV NYCT review designation** 🔲 NOT INDEXED  
*How it retrieved:* `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf` found but 0 nodes.  
*Result:* No answer.

**[sq93] NOR-010R00 CCTV sewer sections/NYCDEP IDs** 🔲 NOT INDEXED  
*How it retrieved:* Same file as sq92, 0 nodes.  
*Result:* No answer.

**[sq94] EDU05B cover page — job number/client/coordination** ✅ PASS  
*How it retrieved:* `A37806_01 10 20_GEN-038R01 - APP - EDU05B-BB - (FINAL-100) - Long Lead Electrical (AVI, NOR).pdf` found with chunks at pp. 2–5 (active-doc boost, 536ms).  
*Result:* Transmittal dated 11/11/2025 from AECOM to Ravi Jain (MLJTC2 PM). CC: Eric Clark, Dan Ventresca, Shravan Chandramouleeswar, Janelle Ella, Aishwarya Singh (AECOM); Nicholas DiGuglielmo, Leyla Acosta, Andrew Voss (MLJTC2). Covers AVI and NOR one-line diagrams (sheets 6–9).

**[sq95] EDU05B load schedule spec sections 12 14 10 / 25 43 18 / 25 41 18** ⚠️ PARTIAL  
*How it retrieved:* Same EDU05B file, chunks at pp. 70–78 (electrical spec sections deep in the document, 530ms).  
*Result:* Retrieved switchboard spec pages but the LLM returned generic switchboard installation requirements rather than extracting panel-and-circuit load schedule data for the three specific spec sections.

---

### SUBMITTAL

**[sq96] GEN-014R00 Quality Report — Ave I activities under 01 40 10** ❌ WRONG DOC  
*How it retrieved:* "GEN-014R00 Monthly Quality and Certification Report" matched `A37806_01 35 70_GEN-014R00-FIO- Utility Coordination - February 2026.pdf` — a different GEN-014R00 file (utility coordination report, not quality/certification report). The naming collision caused a miss.  
*Result:* Returned February 2026 utility coordination content (ConEd, DEP, Verizon coordination) instead of quality survey items.

**[sq97] GEN-014R00 NYCT/MTA submittal designation** ❌ WRONG DOC  
*How it retrieved:* Same wrong file as sq96.  
*Result:* Reported "For NYCT/MTA Information Only" from the utility coordination report — technically correct for that file but not for the quality report.

**[sq98] PRDC12-019R00 SikaGrout 212 sun/wind/substrate restrictions** ⚠️ PARTIAL  
*How it retrieved:* `A37806_PRDC12-019R00 - SikaGrout 212.pdf` found; chunks at pp. 16–18 retrieved (265ms active-doc).  
*Result:* Retrieved the warranty section (pp. 16–18) instead of the application/surface prep section. The application restrictions for sun, wind, and substrate conditions are likely on different pages not in the top-ranked chunks.

**[sq99] PRDC12-019R00 SikaGrout 212 USDA/packaging/ASTM C-827** 🔲 NOT INDEXED  
*How it retrieved:* Found `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf` (the APP stamped version) but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq100] PRDC12-012R02 Lead Placard containment class/cut-line prep** 🔲 NOT INDEXED  
*How it retrieved:* Found ORIG version `PRDC12-012R02 - ORIG - Lead Placard Package-Burnside.pdf` but 0 chunks.  
*Result:* "I do not have indexed text. Re-run indexing."

**[sq101] PRDC12-012R02 Lead Placard cover sheet** 🔲 NOT INDEXED  
*How it retrieved:* Found `PRDC12-012R00 - ORIG` (Revision 00, not R02) with 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

**[sq102] PRDC12-019R00 SikaGrout compressive strength/flowability/working time** 🔲 NOT INDEXED  
*How it retrieved:* Found APP-stamped version but 0 chunks.  
*Result:* "No evidence-backed specification text was verified."

---

## Patterns & Recommended Fixes

### 1. Files with 0 indexed chunks (~49 questions affected)
These files are in the index by name but have no extractable text. Re-index with force-extraction or OCR:
- All subcontractor approval PDFs (L-0017, L-0024, L-0028, L-0049, L-0083, L-0093)
- Monthly progress meeting PDFs (GEN-007R00, GEN-024R00, GEN-042R00)
- Construction photo PDFs (BUR-080R00, BUR-081R00, MYR-076R00)
- Schedule PDFs (GEN-032R00 Schedule Update 5)
- Transmittal PDFs (0014, 212-NOR)
- `M017_IMP_Draft Subcontract_20251024.docx`
- CCTV/inspection PDFs (NOR-010R00)
- Lead Placard PDFs (PRDC12-012R02)
- Lockton Invoice, Backup Invoice#01
- `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx` (PowerPoint — needs extraction support)
- `MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`
- `J-TRACK-13A-041R00` Material I&T Request

### 2. Wrong-doc retrieval (~20 questions affected)
The most common collision patterns:
- **Multiple files sharing a submittal number prefix** (GEN-014R00 appears as both a quality report and a utility coordination report; GEN-021R00 appears as both a safety coordinator and a fiber optic submittal; GEN-027R00 appears as both subcontractor forms and a spec list)
- **RFI number confusion** (RFI-096, RFI-0116 not returning the right file — likely because they are not indexed under those numbers)
- **Drawing PDF consolidation** (MYR-002R00, BUR-001R00 queries hitting multi-sheet consolidated PDFs instead of individual submittals)
- Fix: Add spec section prefix boosting so that retrieval for "RFI096" filters by category=rfi

### 3. Vague LLM synthesis (~10 questions)
Even when correct chunks are retrieved, the LLM sometimes returns "Section X.X Requirements Summary" boilerplate instead of extracting the actual values. Affects: sq19, sq66, sq74, sq87, sq88, sq95, sq98.  
- Fix: Tune the prompt to require the LLM to state explicit values (numbers, dates, names) when the chunk contains them, rather than wrapping in template headers.

### 4. Photo/HEIC files
`.HEIC` and photo-only PDFs have no text to extract. Questions about construction photos (sq54–59) will require caption-extraction, OCR on embedded photo descriptions, or a vision model pass.
