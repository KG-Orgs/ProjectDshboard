# MLJ-017 All-97 Eval Run Results

**Project:** MLJ-017 Package 6 - General `145b3dcf-272e-4c45-9e19-953f20f25bb9`
**Run date:** 2026-08-03
**Questions:** 97 (sq01–sq102, excl. sq32/sq50–sq53)
**Hybrid retrieval:** ON · **Rerank:** OFF · **pgvector timeout:** 30s · **FTS timeout:** 25s
**Input:** `eval/mlj017-smoke-v2-simple-pkg6gen-batch-input.json`

---

## Performance Summary

| Metric | Value |
|---|---|
| Total questions | 97 |
| Questions with sources returned | 94 (97%) |
| Questions that hit DB timeout (≥25s) | 8 (8%) |
| Min elapsed | 178ms |
| Max elapsed | 31989ms |
| Avg elapsed | 3810ms |
| Total wall time | 369s (~6min) |

**Timeout questions (fell back to keyword search):** sq02, sq03, sq24, sq26, sq27, sq44, sq46, sq48

---

## Per-Question Results

### [sq01] — 1.9s
**Query:** In GEN-042R00, what subcontractor is being reviewed for approval, what type of work experience do they describe in their application, and are any active contracts listed?
**Domains:** contracts, documents, subcontractor | **Sources:** `A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-042R00, what subcontractor is being reviewed for approval, what type of work experience do they describe in their application, and are any active contracts listed?". Routed focus: contracts, documents, subcontractor. Top files: a37806 01 30 20 gen-164r00 - fio -. Evidence snippets: - a37806 01 30 20 gen-164r00 - fio -: D…

---

### [sq02] — ⏱️ TIMEOUT 30.8s (keyword fallback)
**Query:** What scope of work and pricing is in Island Pavement Cutting Co's subcontract
**Domains:** contracts | **Sources:** `37135_02FF_QBP_001R00 - (NET) - GEI QBP Instrumentation Work PlanDMC.pdf`, `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf`, `8.2- 25.11.19 A37806-MTACD-MLJTC2-L-0125 - Sub-Contractor Approval  SD Industries LLC.pdf` +5 more
**Answer:** Based on indexed project context, this is the strongest evidence for: "What scope of work and pricing is in Island Pavement Cutting Co's subcontract". Routed focus: contracts. Top files: 37135 02ff qbp 001r00 - (net) - gei, m017 mlj dstar subcontract attachment b 20250815. Evidence snippets: - 37135 02ff qbp 001r00 - (net) - gei (p. 5): Instrumentation Work Plan Queensboro Plaza Station Long Islan…

---

### [sq03] — ⏱️ TIMEOUT 25.4s (keyword fallback)
**Query:** What joint sealing and pavement cutting contract work does Island Pavement Cutting Co list?
**Domains:** contracts | **Sources:** `A37806_GEN-051R00 - APP - Subcontractor Approval Forms - Island Pavement Cutting Co Inc..pdf`, `Subcontract DRAFT ISLAND 8-28-25.docx`, `Subcontract DRAFT ISLAND 8-12-25 proposed changes.docx` +5 more
**Answer:** Based on indexed project context, this is the strongest evidence for: "What joint sealing and pavement cutting contract work does Island Pavement Cutting Co list?". Routed focus: contracts. Top files: subcontract draft island 8-28-25, subcontract draft island 8-12-25 proposed changes, subcontract draft island 7-14-25. Evidence snippets: - subcontract draft island 8-28-25: SUBCONTRACTOR Name: ISLAN…

---

### [sq04] — 2.9s
**Query:** In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, what subcontractor is approved, what is their contract value, and what scope are they approved to perform?
**Domains:** contracts, subcontractor | **Sources:** `2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf`
**Answer:** ## Detailed Matches (2025-03-19 mtacd-mljtc2-l-0024 sub-contractor approval 50 states engineering, corp) - Query focus: In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, what subcontractor is approved, what is their contract value, and what scope are they approved to perform? - Matched indexed passages: - ΓÇªONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-03-19 MTACD-MLJTC2-L-0024 Sub-Co…

---

### [sq05] — 1.8s
**Query:** In A37806 Phasing Plan GEN-001R05, what are the major project phases described and their key milestones or constraints?
**Domains:** contracts, scheduling, documents | **Sources:** `A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx`
**Answer:** ## Detailed Matches (a37806 ada p6 - communication ps lan agenda) - Query focus: In A37806 Phasing Plan GEN-001R05, what are the major project phases described and their key milestones or constraints? - Matched indexed passages: - ΓÇª/ 00 Systems / 01 Comms / 08 Workshops / 03 Comms PS LAN extension / A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx Category: meeting_minutes Key topics: A…

---

### [sq06] — 1.6s
**Query:** In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what ADA accessibility scheme and project information is presented?
**Domains:** documents | **Sources:** `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what ADA accessibility scheme and project information is presented?". Routed focus: documents. Top files: pre-proposal slideshow a37806 rfp addendum 02. Evidence snippets: - pre-proposal slideshow a37806 rfp addendum 02: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - …

---

### [sq07] — 2.0s
**Query:** In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what does the Contract Specific Responsibility Form require of significant subcontractors?
**Domains:** contracts, documents, subcontractor | **Sources:** `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what does the Contract Specific Responsibility Form require of significant subcontractors?". Routed focus: contracts, documents, subcontractor. Top files: a37806 gen-027r00 - r&r - subcontractor approval forms. Evidence snippets: - a37806 gen-027r00 - r&r - subco…

---

### [sq08] — 1.5s
**Query:** In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what is the ownership percentage and partner breakdown for this joint venture?
**Domains:** contracts, subcontractor | **Sources:** `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what is the ownership percentage and partner breakdown for this joint venture?". Routed focus: contracts, subcontractor. Top files: a37806 gen-027r00 - r&r - subcontractor approval forms. Evidence snippets: - a37806 gen-027r00 - r&r - subcontractor approval forms…

---

### [sq09] — 2.1s
**Query:** In the M017_IMP Draft Subcontract, what payment provisions from the prime contract are specifically excluded from the incorporated subcontract documents?
**Domains:** contracts, documents, communication | **Sources:** `M017_IMP_Draft Subcontract_20251024.docx`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the M017_IMP Draft Subcontract, what payment provisions from the prime contract are specifically excluded from the incorporated subcontract documents?". Routed focus: contracts, documents, communication. Top files: m017 imp draft subcontract 20251024. Evidence snippets: - m017 imp draft subcontract 20251024: liable under the…

---

### [sq10] — 2.0s
**Query:** In the M017_IMP Draft Subcontract, what does the entire agreement clause say about how prior oral or written agreements between the parties are treated?
**Domains:** contracts, documents, communication | **Sources:** `M017_IMP_Draft Subcontract_20251024.docx`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the M017_IMP Draft Subcontract, what does the entire agreement clause say about how prior oral or written agreements between the parties are treated?". Routed focus: contracts, documents, communication. Top files: m017 imp draft subcontract 20251024. Evidence snippets: - m017 imp draft subcontract 20251024: NO MODIFICATIONS …

---

### [sq11] — 3.2s
**Query:** In Transmittal 0014 for MTA Personnel and PMC Supplies, what items were submitted and what was their review status when returned?
**Domains:** documents, contracts | **Sources:** `A37806 Transmittal 0014 -  MTA Personnel and PMC Supplies.pdf`
**Answer:** I could not find an exact indexed passage in a37806 transmittal 0014 - mta personnel and pmc that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq12] — 1.9s
**Query:** What is in the Myrtle Ave Reserve Service Load Letter?
**Domains:** documents | **Sources:** _no sources_
**Answer:** ## More context needed - Your question asks what is mentioned in that document but doesn't specify a topic. - To answer precisely, tell me what you're looking for ΓÇö for example: parties involved, dates, costs, scope, action items, approvals, or a specific subject. **Possible matching file:** myr reserve service heic - Try asking: _In the myr reserve service heic, what [specific topic]?_

---

### [sq13] — 1.8s
**Query:** In the MTACD-MLJTC2-L-0017 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
**Domains:** contracts, subcontractor | **Sources:** `2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE FX $109,450.00.pdf`
**Answer:** ## Detailed Matches (2025-03-19 mtacd-mljtc2-l-0017 subcontractor approval mase fx $109,450 00) - Query focus: In the MTACD-MLJTC2-L-0017 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value? - Matched indexed passages: - ΓÇªONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE …

---

### [sq14] — 1.8s
**Query:** In the MTACD-MLJTC2-L-0028 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
**Domains:** contracts, subcontractor | **Sources:** `2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf`
**Answer:** ## Detailed Matches (2025-03-26 mtacd-mljtc2-l-0028 sub-contractor approval titanium linx consulting, inc) - Query focus: In the MTACD-MLJTC2-L-0028 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value? - Matched indexed passages: - ΓÇªALS / PRDC SUBCONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-03-26 MTACD-MLJTC2-L-0028 Su…

---

### [sq15] — 1.9s
**Query:** In the MTACD-MLJTC2-L-0049 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
**Domains:** contracts, subcontractor | **Sources:** `2025-06-10 MTACD-MLJTC2-L-0049 Sub-Contractor Approval ΓÇô McVac Environmental Services, Inc..pdf`
**Answer:** ## Detailed Matches (2025-06-10 mtacd-mljtc2-l-0049 sub-contractor approval ΓÇô mcvac environmental services,) - Query focus: In the MTACD-MLJTC2-L-0049 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value? - Matched indexed passages: - ΓÇª010 Northern Blvd, Suite 200, Great Neck, NY. - Key Quantity/Cost: Subcontract value is …

---

### [sq16] — 1.9s
**Query:** In the MTACD-MLJTC2-L-0083 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
**Domains:** contracts, subcontractor | **Sources:** `2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval ΓÇô American Geophysics Inc..pdf`
**Answer:** ## Detailed Matches (2025-08-08 mtacd-mljtc2-l-0083 - sub-contractor approval ΓÇô american geophysics) - Query focus: In the MTACD-MLJTC2-L-0083 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value? - Matched indexed passages: - ΓÇªALS / PRDC SUBCONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-08-08 MTACD-MLJTC2-L-0083 - Sub-…

---

### [sq17] — 1.8s
**Query:** In the MTACD-MLJTC2-L-0093 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
**Domains:** contracts, subcontractor | **Sources:** `2025-08-25 MTACD-MLJTC2-L-0093 - Sub-Contractor Approval ΓÇô Tri-State Civil Construction LLC.pdf`
**Answer:** ## Detailed Matches (2025-08-25 mtacd-mljtc2-l-0093 - sub-contractor approval ΓÇô tri-state civil) - Query focus: In the MTACD-MLJTC2-L-0093 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value? - Matched indexed passages: - ΓÇªALS / PRDC SUBCONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-08-25 MTACD-MLJTC2-L-0093 - Sub-Cont…

---

### [sq18] — 2.2s
**Query:** In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what rebar sizes and reinforcement details are shown for the elevator pit foundation mat?
**Domains:** documents | **Sources:** `A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what rebar sizes and reinforcement details are shown for the elevator pit foundation mat?". Routed focus: documents. Top files: a37806 03 20 00 avi-002r00 - aan -. Evidence snippets: - a37806 03 20 00 avi-002r00 - aan -: DOCUMENT SUMMARY File / Location: MLJ-017 Pack…

---

### [sq19] — ✓ 264ms (exact-ID)
**Query:** In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what is the submittal number, NYCT/MTA review status, and which spec section does it reference?
**Domains:** documents | **Sources:** `A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf`
**Answer:** ## Section 6.3 Requirements Summary (a37806 03 20 00 avi-002r01 - fio -) - Reviewed indexed section evidence from page(s): 4, 5. - Key requirements captured from the section: - 43'-8 1/2" T/ OPNG 1 1 1 COATED REBAR EPOXY U.O.N. - REP01ELEVATOR PIT REINFORCEMENT DETAILS (NORTH) AVENUE I STATION PACKAGE 6 BROOKLYN KM#25-067 - - GB 12/02/2025 0 12/02/2025 FOR APPROVAL 1 02/11/2026 AAN PER EOR MARKUPS…

---

### [sq20] — ✓ 208ms (exact-ID)
**Query:** In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what glazing spec items are referenced in the submittal?
**Domains:** documents | **Sources:** `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf`
**Answer:** I could not find an exact indexed passage in a37806 14 24 00 bur-009r00 - aan - that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq21] — ✓ 178ms (exact-ID)
**Query:** In BUR-009R00 for the EL539 Cab and Entrance Drawings, what is the NYCT/MTA review status and which spec section does this submittal cover?
**Domains:** documents | **Sources:** `A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entrance Drawings-MTA.pdf`
**Answer:** I could not find an exact indexed passage in a37806 14 24 00 bur-009r00 - r&r - that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq22] — 1.4s
**Query:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what is the review status of this submittal.
**Domains:** documents | **Sources:** `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf`
**Answer:** I could not find an exact indexed passage in mljtc2 aecom atc 1 burnside avenue drawings that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq23] — ✓ 178ms (exact-ID)
**Query:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, was the submittal approved and were there any comments?
**Domains:** documents | **Sources:** `A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf`
**Answer:** ## Answer - I could not find an exact indexed passage in a37806 08 45 25 bur-001r00 - fio - that answers this question. - No evidence-backed specification text was verified in the retrieved chunks for this request. - Refine with a section heading or exact phrase and I will search only this file again. - **Evidence:** a37806 08 45 25 bur-001r00 - fio - (p. 3).

---

### [sq24] — ⏱️ TIMEOUT 30.7s (keyword fallback)
**Query:** What specification requirements govern controlled fills and excavation near the elevator?
**Domains:** documents | **Sources:** `A37806_01 35 10_GEN-052R02 - APP - SWP-026 - Support of Excavation.pdf`, `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf`, `SWP 063 Installation of work platform underneath the elevated structure at WSQ Rev 3.pdf` +5 more
**Answer:** Based on indexed project context, this is the strongest evidence for: "What specification requirements govern controlled fills and excavation near the elevator?". Routed focus: documents. Top files: swp 026 - support of excavation, aeis llc irf a37806 0006 - middletown back, swp 063 installation of work platform underneath the. Evidence snippets: - swp 026 - support of excavation (p. 17): CAVATION…

---

### [sq25] — 2.1s
**Query:** In GEN-001R02 Elevator Walls Formwork Drawing, what is the NYCT/MTA submittal designation — is it for approval, information only, or designer review?
**Domains:** documents | **Sources:** `A37806_03 10 00_GEN-001R02 - RWC - Elevator Walls Formwork Drawing - MTA.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-001R02 Elevator Walls Formwork Drawing, what is the NYCT/MTA submittal designation ΓÇö is it for approval, information only, or designer review?". Routed focus: documents. Top files: a37806 03 10 00 gen-001r02 - rwc -. Evidence snippets: - a37806 03 10 00 gen-001r02 - rwc -: DOCUMENT SUMMARY File / Location: MLJ-017 Pack…

---

### [sq26] — ⏱️ TIMEOUT 30.6s (keyword fallback)
**Query:** What pest control services are billed in Invoice 11707, which locations were serviced?
**Domains:** documents, contracts | **Sources:** `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf`, `A37806_01 35 10_GEN-052R02 - APP - SWP-026 - Support of Excavation.pdf`, `A37806 CWP-061 - Architectural Wall Installation.docx` +5 more
**Answer:** Based on indexed project context, this is the strongest evidence for: "What pest control services are billed in Invoice 11707, which locations were serviced?". Routed focus: documents, contracts. Top files: 8 2- 25 11 19 a37806-mtacd-mljtc2-l-0125 - sub-contractor, no. Evidence snippets: - 8 2- 25 11 19 a37806-mtacd-mljtc2-l-0125 - sub-contractor: DOCUMENT SUMMARY File / Location: MLJ-017 Package …

---

### [sq27] — ⏱️ TIMEOUT 30.6s (keyword fallback)
**Query:** What services are billed in Invoice 11830 for the Middletown station locations, and what are the April 2026 service order numbers?
**Domains:** documents, contracts | **Sources:** `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf`, `the next 3 months 9.16.25.pdf`, `SWP-047 Train Gantry-Steel Girder Removal and Installation Rev 03.docx` +5 more
**Answer:** Based on indexed project context, this is the strongest evidence for: "What services are billed in Invoice 11830 for the Middletown station locations, and what are the April 2026 service order numbers?". Routed focus: documents, contracts. Top files: m017-0650 cmf, swp 026 - support of excavation. Evidence snippets: - m017-0650 cmf (p. 2): o be bound by the specification sections and drawings note…

---

### [sq28] — 2.4s
**Query:** In Lockton Invoice 0849812, what are the remittance instructions and how should payment be submitted?
**Domains:** documents, contracts | **Sources:** `2025 Lockton Invoice 0849812.pdf`
**Answer:** ## Detailed Matches (2025 lockton invoice 0849812) - Query focus: In Lockton Invoice 0849812, what are the remittance instructions and how should payment be submitted? - Matched indexed passages: - ΓÇªckage 6 - General / 13 - SUBCONTRACTS / TRI STATE CIVIL / Bond / 2025 Lockton Invoice 0849812.pdf Category: invoice Key topics: INVOICE, 0849812, 06/09/2025, 45 Whitney Avenue, 33705293, 07/21/2025, …

---

### [sq29] — 2.3s
**Query:** In Lockton Invoice 0849812, what is the total invoiced amount?
**Domains:** documents, contracts | **Sources:** `2025 Lockton Invoice 0849812.pdf`
**Answer:** ## Detailed Matches (2025 lockton invoice 0849812) - Query focus: In Lockton Invoice 0849812, what is the total invoiced amount? - Matched indexed passages: - (p. 1) ΓÇªvoices: INV 123456/234445/344555* Email remittance to: clientpayments@lockton.com c/o Bank of America PO Box 3207 Boston, MA 02241-3207 Northeast Series of - ΓÇªckage 6 - General / 13 - SUBCONTRACTS / TRI STATE CIVIL / Bond / 2025 …

---

### [sq30] — 2.0s
**Query:** In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 6, 2025 — what were the ticket number, labor hours, and rates?
**Domains:** documents, contracts | **Sources:** `Backup for Invoice#01.pdf`
**Answer:** ## Detailed Matches (backup for invoice#01) - Query focus: In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 6, 2025 ΓÇö what were the ticket number, labor hours, and rates? - Matched indexed passages: - ΓÇªCrewdays = # of Hours, 0.00 0.00 171 10.69, 25 Cain Drive, KEY WORDS: LEAD ABATEMENT, 806 Foreman, 5 PT OT, DESCRIPTION OF WOR…

---

### [sq31] — 1.8s
**Query:** In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 7, 2025 — what were the ticket number, labor hours, and rates?
**Domains:** documents, contracts | **Sources:** `Backup for Invoice#01.pdf`
**Answer:** ## Detailed Matches (backup for invoice#01) - Query focus: In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 7, 2025 ΓÇö what were the ticket number, labor hours, and rates? - Matched indexed passages: - ΓÇªCrewdays = # of Hours, 0.00 0.00 171 10.69, 25 Cain Drive, KEY WORDS: LEAD ABATEMENT, 806 Foreman, 5 PT OT, DESCRIPTION OF WOR…

---

### [sq33] — 2.1s
**Query:** In Invoice#01 dated December 31, 2025, what retainage amounts and net payment due are shown on the G703 continuation sheet?
**Domains:** documents, cost | **Sources:** `2025-10-21 Eagle Business Machine Inv# 129318 $43.55 (M017 99-1530).pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In Invoice#01 dated December 31, 2025, what retainage amounts and net payment due are shown on the G703 continuation sheet?". Routed focus: documents, cost. Top files: 2025-10-21 eagle business machine inv# 129318 $43 55. Evidence snippets: - 2025-10-21 eagle business machine inv# 129318 $43 55: DOCUMENT SUMMARY File / Location…

---

### [sq34] — ✓ 531ms (exact-ID)
**Query:** In GEN-042R00, the A37806 & C49321R Coordination Meeting what was discussed?
**Domains:** documents, contracts | **Sources:** `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-042R00, the A37806 & C49321R Coordination Meeting what was discussed?". Routed focus: documents, contracts. Top files: a37806 01 30 20 gen-042r00 - fio -. Evidence snippets: - a37806 01 30 20 gen-042r00 - fio -: DOCUMENT SUMMARY File / Location: 01 30 20 Project Meetings / a37806 01 30 20 gen-042r00 - fio - Cate - a37806…

---

### [sq35] — 2.5s
**Query:** What was discussed in the September 3, 2025 coordination meeting?
**Domains:** documents | **Sources:** `09 A37806 Utility Coordination_September 2025.docx`
**Answer:** ## More context needed - Your question asks what is mentioned in that document but doesn't specify a topic. - To answer precisely, tell me what you're looking for ΓÇö for example: parties involved, dates, costs, scope, action items, approvals, or a specific subject. **Possible matching file:** 09 a37806 utility coordination september 2025 - Try asking: _In the 09 a37806 utility coordination septem…

---

### [sq36] — 1.4s
**Query:** In A37806 Kick Off Pre-Work Conference, what does the document state?
**Domains:** documents, contracts | **Sources:** `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx`
**Answer:** I could not find an exact indexed passage in a37806 presentation comm kick-off 09 16 2025 r2 that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq37] — 1.4s
**Query:** In A37806 Kick Off Pre-Work Conference, what does the document state about project milestones and work sequencing?
**Domains:** scheduling, communication | **Sources:** `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx`
**Answer:** I could not find an exact indexed passage in a37806 presentation comm kick-off 09 16 2025 r2 that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq38] — 2.2s
**Query:** In the July 24, 2025 Monthly Job Progress Meeting, which MLJ Contracting and TC Electric staff attended and presented?
**Domains:** contracts | **Sources:** `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the July 24, 2025 Monthly Job Progress Meeting, which MLJ Contracting and TC Electric staff attended and presented?". Routed focus: contracts. Top files: a37806 01 31 30 gen-007r00 - fio -. Evidence snippets: - a37806 01 31 30 gen-007r00 - fio - (p. 7): July 2025 MLJTC2 Page 5 of 13 Printed: 8/1/2025 SUBMITTAL NUMBER DESCRIP…

---

### [sq39] — 2.2s
**Query:** In the July 24, 2025 Monthly Job Progress Meeting, which external consultants from firms such as T.Y. Lin attended?
**Domains:** documents | **Sources:** `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the July 24, 2025 Monthly Job Progress Meeting, which external consultants from firms such as T.Y. Lin attended?". Routed focus: documents. Top files: a37806 01 31 30 gen-007r00 - fio -. Evidence snippets: - a37806 01 31 30 gen-007r00 - fio - (p. 7): July 2025 MLJTC2 Page 5 of 13 Printed: 8/1/2025 SUBMITTAL NUMBER DESCRIPTIO…

---

### [sq40] — 2.3s
**Query:** In the May 28, 2026 Monthly Job Progress Meeting Minutes, what is the current status of CPR-003 Revision 2 and the open Burnside Avenue DOT Option Work item?
**Domains:** communication | **Sources:** `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf`
**Answer:** ## Detailed Matches (a37806 01 31 30 gen-024r00 - fio -) - Query focus: In the May 28, 2026 Monthly Job Progress Meeting Minutes, what is the current status of CPR-003 Revision 2 and the open Burnside Avenue DOT Option Work item? - Matched indexed passages: - (p. 3) ΓÇªd NTP is required by end of August to perform the work. 4. Additional DOT Option Work at Burnside (Not in contract) ΓÇô DOT/DEP to…

---

### [sq41] — 2.3s
**Query:** In the May 28, 2026 Monthly Job Progress Meeting, how many Grade Operations have been completed across the project stations, and how are they distributed across Myrtle, Burnside, and Avenue I?
**Domains:** documents, contracts | **Sources:** `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the May 28, 2026 Monthly Job Progress Meeting, how many Grade Operations have been completed across the project stations, and how are they distributed across Myrtle, Burnside, and Avenue I?". Routed focus: documents, contracts. Top files: a37806 01 31 30 gen-024r00 - fio -. Evidence snippets: - a37806 01 31 30 gen-024r00 - f…

---

### [sq42] — 2.0s
**Query:** In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what are the open SDI coordination action items and their target completion dates?
**Domains:** documents, contracts | **Sources:** `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`
**Answer:** ## Detailed Matches (sdi - mlj bi-weekly meeting draft agenda -) - Query focus: In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what are the open SDI coordination action items and their target completion dates? - Matched indexed passages: - ΓÇª5 - MISC ADMIN / MEETINGS / SDI Weekly Status Meetings / SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx Category: meeting_minute…

---

### [sq43] — 1.6s
**Query:** In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what is the status of OCIP approval and subcontractor approval for the surveyor?
**Domains:** contracts, subcontractor | **Sources:** `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`
**Answer:** ## Detailed Matches (sdi - mlj bi-weekly meeting draft agenda -) - Query focus: In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what is the status of OCIP approval and subcontractor approval for the surveyor? - Matched indexed passages: - ΓÇª5 - MISC ADMIN / MEETINGS / SDI Weekly Status Meetings / SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx Category: meeting_minutes …

---

### [sq44] — ⏱️ TIMEOUT 31.8s (keyword fallback)
**Query:** What current permits are submitted for Burnside Ave.
**Domains:** documents | **Sources:** `Trans No.51_Steel Rep.Bent 226-227-J4_Burnside.pdf`, `A37806 CWP-061 - Architectural Wall Installation.docx`, `A37806_PRDC11-026R00 - AAN - Burnside Temporary Airline Support Drawing Package.pdf` +5 more
**Answer:** Based on indexed project context, this is the strongest evidence for: "What current permits are submitted for Burnside Ave.". Routed focus: documents. Top files: trans no 51 steel rep bent 226-227-j4 burnside, no. Evidence snippets: - trans no 51 steel rep bent 226-227-j4 burnside: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 30 - ENGINEERING / Burnside Ave / Shop Drawings / Sei…

---

### [sq45] — 2.0s
**Query:** What current permits are submitted for Ave I.
**Domains:** documents | **Sources:** `A37806_01 33 10_AVI-001R00 - FIO - DOT Permits Exp. 05.30.25.pdf`, `A37806_01 33 10_AVI-002R00 - FIO - Tree Work Permits.pdf`
**Answer:** ## AVI Permit Submittals The following permit-related submittal files are on record for AVI: - a37806 01 33 10 avi-001r00 - fio - - a37806 01 33 10 avi-002r00 - fio -

---

### [sq46] — ⏱️ TIMEOUT 32.0s (keyword fallback)
**Query:** What current permits are submitted for Myrtle Ave.
**Domains:** documents | **Sources:** `A37806_05 12 00_MYR-002R00 - Myrtle Canopy Demo Minicrane Plan.pdf`, `A37806_01 10 20_GEN-028R00 - ORIG - EDU05A - (FINAL 100) - Communications and Fire Alarm Long Lead Procurement.pdf`, `A37806 CWP-061 - Architectural Wall Installation.docx` +5 more
**Answer:** Based on indexed project context, this is the strongest evidence for: "What current permits are submitted for Myrtle Ave.". Routed focus: documents. Top files: no, rfi 066. Evidence snippets: - no (p. 2): PROJECT: ATTN: REF: DATE: No. Seiko Iron Works, Inc. 79-45 77th Avenue Glendale, New York 11385 718-456-2297 19 Fax: Phone: 718-386-1286 Bailey MC6 Minicrane - - rfi 066 (p. 1): Request For Infor…

---

### [sq47] — 2.2s
**Query:** What current permits are submitted for Middletown Ave.
**Domains:** documents | **Sources:** `25.10.28 A37806-MTACD-MLJTC2-L-0117 - Delay ins Submission of Permit doc. & the RFCD Package for EDU2B Structural & Foundation Work ΓÇô MDT.pdf`, `25.10.28 MTACD-MLJTC2-L-0117 - Delay ins Submission of Permit documents & the RFCD Package for EDU2B Structural & Foundation Work ΓÇô MDT.pdf`, `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf` +5 more
**Answer:** ## MDT Permit Submittals The following permit-related submittal files are on record for MDT: - 25 10 28 a37806-mtacd-mljtc2-l-0117 - delay ins submission - 25 10 28 mtacd-mljtc2-l-0117 - delay ins submission - a37806 01 33 10 mdt-005r00 - fio - - a37806 01 33 10 mdt-005r00 - orig -

---

### [sq48] — ⏱️ TIMEOUT 26.8s (keyword fallback)
**Query:** What current permits are submitted for Norwood Ave.
**Domains:** documents | **Sources:** `A37806_01 33 00_GEN-013R00 - Submittal Register January 2026.pdf`, `A37806_01 33 00_GEN-005R00 - FIO - Submittal Register May 2025.pdf`, `A37806_01 33 10_NOR-002R00 - FIO - DOT Permits Arlington Ave Expiring 05.23.25.pdf` +5 more
**Answer:** Based on indexed project context, this is the strongest evidence for: "What current permits are submitted for Norwood Ave.". Routed focus: documents. Top files: 12 renewed permits - norwood ave [26195 mlj, permit filings estimating - norwood 2252025, no. Evidence snippets: - 12 renewed permits - norwood ave [26195 mlj: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 22 - PERMITS & …

---

### [sq49] — 2.2s
**Query:** In MDT-005R00 Middletown Tree Work Permit, what nursery standards must replacement tree materials meet, and what happens to rejected material on site?
**Domains:** field_ops | **Sources:** `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In MDT-005R00 Middletown Tree Work Permit, what nursery standards must replacement tree materials meet, and what happens to rejected material on site?". Routed focus: field_ops. Top files: a37806 01 33 10 mdt-005r00 - fio -. Evidence snippets: - a37806 01 33 10 mdt-005r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Packa…

---

### [sq54] — 1.9s
**Query:** In BUR-081R00 January 2026 Construction Photos, what work is shown in progress on the Burnside Avenue northbound side on January 20, 2026?
**Domains:** documents, contracts | **Sources:** `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In BUR-081R00 January 2026 Construction Photos, what work is shown in progress on the Burnside Avenue northbound side on January 20, 2026?". Routed focus: documents, contracts. Top files: a37806 01 32 10 bur-081r00 - fio -. Evidence snippets: - a37806 01 32 10 bur-081r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Packag…

---

### [sq55] — 1.6s
**Query:** In BUR-081R00 January 2026 Construction Photos, what MPT setup and ConEd utility relocation work is documented at the Burnside Avenue northbound side?
**Domains:** documents, contracts | **Sources:** `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In BUR-081R00 January 2026 Construction Photos, what MPT setup and ConEd utility relocation work is documented at the Burnside Avenue northbound side?". Routed focus: documents, contracts. Top files: a37806 01 32 10 bur-081r00 - fio -. Evidence snippets: - a37806 01 32 10 bur-081r00 - fio -: DOCUMENT SUMMARY File / Location: ML…

---

### [sq56] — 1.5s
**Query:** In BUR-080R00 Burnside December 2025 Construction Photos, what track shielding work was shown?
**Domains:** documents, contracts | **Sources:** _no sources_
**Answer:** I could not find an exact indexed passage in photo apr 02 2025, 8 12 26 am that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq57] — 1.5s
**Query:** In BUR-080R00 Burnside December 2025 Construction Photos, what MPT setup and shielding installation preparation is documented on the northbound side?
**Domains:** documents, contracts | **Sources:** _no sources_
**Answer:** I could not find an exact indexed passage in photo apr 02 2025, 8 12 26 am that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq58] — 1.5s
**Query:** In MYR-076R00 Myrtle December 2025 Construction Photos, what ADA accessibility upgrade work is shown in the December 19, 2025 photos at Myrtle Avenue station?
**Domains:** documents, contracts | **Sources:** `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In MYR-076R00 Myrtle December 2025 Construction Photos, what ADA accessibility upgrade work is shown in the December 19, 2025 photos at Myrtle Avenue station?". Routed focus: documents, contracts. Top files: a37806 01 32 10 myr-076r00 - fio -. Evidence snippets: - a37806 01 32 10 myr-076r00 - fio -: DOCUMENT SUMMARY File / Loca…

---

### [sq59] — 1.5s
**Query:** In MYR-076R00 Myrtle December 2025 Construction Photos, what is the submittal designation — NYCT/MTA information only, approval, or designer review?
**Domains:** documents | **Sources:** `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In MYR-076R00 Myrtle December 2025 Construction Photos, what is the submittal designation ΓÇö NYCT/MTA information only, approval, or designer review?". Routed focus: documents. Top files: a37806 01 32 10 myr-076r00 - fio -. Evidence snippets: - a37806 01 32 10 myr-076r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Packa…

---

### [sq60] — 1.8s
**Query:** In the May 13, 2025 Burnside Avenue VECP Presentation, what is the value engineering background — what submissions were made to MTA and what verbal approval was received from NYC DOT?
**Domains:** documents, contracts | **Sources:** `0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf`
**Answer:** ## Detailed Matches (0050 - a-37808 (76114) - emd - burnside) - Query focus: In the May 13, 2025 Burnside Avenue VECP Presentation, what is the value engineering background ΓÇö what submissions were made to MTA and what verbal approval was received from NYC DOT? - Matched indexed passages: - ΓÇªation: MLJ-017 Package 6 - General / 10 - TA SERVICES / A&P Request / 2025 / 05 - May 2025 / 0050 - A-37…

---

### [sq61] — 1.4s
**Query:** In the Burnside Avenue VECP Presentation, what ADA accessibility upgrade scope is being value-engineered and when was the final presentation delivered?
**Domains:** documents, contracts | **Sources:** `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the Burnside Avenue VECP Presentation, what ADA accessibility upgrade scope is being value-engineered and when was the final presentation delivered?". Routed focus: documents, contracts. Top files: ak a37806 volume 08a bx burnside ave option. Evidence snippets: - ak a37806 volume 08a bx burnside ave option: DOCUMENT SUMMARY …

---

### [sq62] — 1.5s
**Query:** In PRO 26-01 Control of Project Nonconforming Items, what does the NCR process flowchart show — who are the originator, Contractor QM, PMT QM, and DOR roles?
**Domains:** contracts | **Sources:** `MLJ Projection- Con Ed wingback T&E.xlsx`
**Answer:** I could not find an exact indexed passage in mlj projection- con ed wingback t&e that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq63] — 1.4s
**Query:** In GEN-006R01 NCR Template & Log, what data does PRO 26-01 require in the NCR Log for tracking nonconforming items?
**Domains:** documents, contracts | **Sources:** `A37806_01 40 10_GEN-006R01 - AEAN - NCR Template & Log.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-006R01 NCR Template & Log, what data does PRO 26-01 require in the NCR Log for tracking nonconforming items?". Routed focus: documents, contracts. Top files: a37806 01 40 10 gen-006r01 - aean -. Evidence snippets: - a37806 01 40 10 gen-006r01 - aean -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - …

---

### [sq64] — ✓ 191ms (exact-ID)
**Query:** Summarize what is in A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf
**Domains:** documents | **Sources:** `A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf`
**Answer:** ## Section 51.56 (a37806 rfi-0203 - clo - norwood j1 revised) - Exact indexed section text from page(s): 1, 2, 3, 4. ```text DOCUMENT SECTION INDEX (heading ΓåÆ page numbers): A37806 ADA PACKAGE 6 [p.3] 1 Iden╞ƒfied Jamaica (BMT) GOs [pp.4-5]

---

### [sq65] — 1.8s
**Query:** In J-TRACK-13A-041R00 Material I&T Request for 100-8 6-hole joint bar, what is the inspection item description, what quantity is requested, and what ASTM standard governs the material?
**Domains:** field_ops, documents | **Sources:** `A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF`
**Answer:** ## Detailed Matches (a-37806 j-track-13a-041r00 - app - material i&t request) - Query focus: In J-TRACK-13A-041R00 Material I&T Request for 100-8 6-hole joint bar, what is the inspection item description, what quantity is requested, and what ASTM standard governs the material? - Matched indexed passages: - ΓÇª/ 13A TRACK GENERAL / A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Ho…

---

### [sq66] — 2.0s
**Query:** In RFI-0115 for the Myrtle Avenue Louver Exhaust Face Velocity issue, what exhaust velocity problem is described and what spec section or direction is referenced?
**Domains:** documents | **Sources:** `A37806_RFI-0115 - CLO - Louver Exhaust Face Velocity 09.04.25.pdf`
**Answer:** I could not find an exact indexed passage in a37806 rfi-0115 - clo - louver exhaust face that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq67] — 1.8s
**Query:** In RFI098 for the Ave I Conductor Board at Station 489+00, what is the issue with the conductor board on the northbound platform at Track B2 and what drawing is referenced?
**Domains:** documents | **Sources:** `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf`
**Answer:** ## Detailed Matches (a37806 ada p6 rfi098 ave i conductor board) - Query focus: In RFI098 for the Ave I Conductor Board at Station 489+00, what is the issue with the conductor board on the northbound platform at Track B2 and what drawing is referenced? - Matched indexed passages: - (p. 1) ΓÇªUpgrades Package 6 Page 1 of 3 Rev. 0 12/29/2022 Subject: Avenue I ΓÇô Conductor Board at Station 489+00 (N…

---

### [sq68] — 1.7s
**Query:** In RFI098 for the Ave I Conductor Board, what figures are provided showing the conductor board conditions at Station 489+00 and approximately Station 490+00?
**Domains:** documents | **Sources:** `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In RFI098 for the Ave I Conductor Board, what figures are provided showing the conductor board conditions at Station 489+00 and approximately Station 490+00?". Routed focus: documents. Top files: a37806 ada p6 rfi098 ave i conductor board. Evidence snippets: - a37806 ada p6 rfi098 ave i conductor board: DOCUMENT SUMMARY File / …

---

### [sq69] — 1.5s
**Query:** In A37806 RFI096, what are the northbound and southbound platform stair and exit configurations shown on the referenced drawings?
**Domains:** documents | **Sources:** `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf`
**Answer:** ## Detailed Matches (a37806 rfi-0042 - clo - coordination with contract) - Query focus: In A37806 RFI096, what are the northbound and southbound platform stair and exit configurations shown on the referenced drawings? - Matched indexed passages: - (p. 23) ΓÇªI I I I I I I.JJ -J l I I I I I I I I I I I I / I I I NORTHBOUND AND SOUTHBOUND PLATFORM PLAN SCALE: 1"= 50'-0" ft CONSTRUCTION w & DEVELOPME…

---

### [sq70] — 1.3s
**Query:** In A37806 RFI096, what ADA upgrade drawing and platform detail is referenced for the McDonald Avenue station?
**Domains:** documents | **Sources:** `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf`
**Answer:** ## Detailed Matches (a37806 rfi-0042 - clo - coordination with contract) - Query focus: In A37806 RFI096, what ADA upgrade drawing and platform detail is referenced for the McDonald Avenue station? - Matched indexed passages: - ΓÇªFolder / 00 Systems / 01 Comms / 03 Comm Drawings / 01 Norwood Ave / A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf Catego…

---

### [sq71] — 1.3s
**Query:** In MYR-002R00 Myrtle Avenue Demo Shield Drawings, what construction details and shielding elements are shown in the enlarged section views, and what platform-level steel connections are specified?
**Domains:** documents | **Sources:** `A37806 Platf Edge Myrtle Ave 20241113.pdf`
**Answer:** ## Detailed Matches (a37806 platf edge myrtle ave 20241113) - Query focus: In MYR-002R00 Myrtle Avenue Demo Shield Drawings, what construction details and shielding elements are shown in the enlarged section views, and what platform-level steel connections are specified? - Matched indexed passages: - ΓÇª- Document Purpose: Topographic survey drawing for platform edge at Myrtle Avenue station, part…

---

### [sq72] — 1.6s
**Query:** In drawing MYR-A-444A, what stainless steel panel and signage details are shown for the EL1121/EL1122 elevator enclosures at Myrtle Avenue station?
**Domains:** documents | **Sources:** `Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In drawing MYR-A-444A, what stainless steel panel and signage details are shown for the EL1121/EL1122 elevator enclosures at Myrtle Avenue station?". Routed focus: documents. Top files: myrtle expansion joint pages from 8 03 -. Evidence snippets: - myrtle expansion joint pages from 8 03 -: DOCUMENT SUMMARY File / Location: MLJ-…

---

### [sq73] — 1.7s
**Query:** In RFI-0116 for the Myrtle Avenue PS LAN followup, what telecommunications coordination issue is addressed and what direction was given to the contractor?
**Domains:** contracts, documents | **Sources:** `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In RFI-0116 for the Myrtle Avenue PS LAN followup, what telecommunications coordination issue is addressed and what direction was given to the contractor?". Routed focus: contracts, documents. Top files: a37806 rfi-0042 - clo - coordination with contract. Evidence snippets: - a37806 rfi-0042 - clo - coordination with contract (…

---

### [sq74] — ✓ 201ms (exact-ID)
**Query:** In RFI-009 for Myrtle Avenue UPS Backup Requirements, what UPS capacity is required to support existing and new communications systems, including the future use reserve?
**Domains:** documents | **Sources:** `806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf`
**Answer:** ## Section 7.5 (806-rfi-009 - myrtle avenue ups backup requirements) - Exact indexed section text from page(s): 1. ```text TCE, LLC 1010 Northern Blvd., Suite 203 Great Neck, New York 11021

---

### [sq75] — 1.4s
**Query:** In GEN-096R04 SWP-016 for Elevator Steel and Enclosure, what is the submittal package response due date and what spec section 01 35 10 information is on the cover sheet?
**Domains:** documents | **Sources:** `A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf`
**Answer:** ## Section 3.1 Requirements Summary (swp 016 - elevator steel & enclosure) - Reviewed indexed section evidence from page(s): 13, 14, 16. - Key requirements captured from the section: - Submittal Response Sheet A-37806 ADA Package 6. - SAFE WORK PLAN SWP ΓÇô 016 ΓÇô MID (Day) SWP-016 Elevator Steel & Enclosure Rev.3 03/10/26 ΓÇô Day with Crane - Middletown STEP RISK PREVENTION/MITIGATION COMMENT 1.…

---

### [sq76] — ✓ 207ms (exact-ID)
**Query:** Summarize SWP-016
**Domains:** documents, contracts | **Sources:** `SWP 016 + Attachment.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "Summarize SWP-016". Routed focus: documents, contracts. Top files: swp 016 + attachment. Evidence snippets: - swp 016 + attachment: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / Ahmed Murshed / swp 016 + attachment Category: safety Key topics: ST - swp 016 + attachment (p. 1): SAFE WORK…

---

### [sq77] — 1.6s
**Query:** In GEN-041R01 SWP-011 for Platform Concrete Demo, what dust control and silica exposure prevention measures apply to saw cutting and demolition operations?
**Domains:** contracts | **Sources:** `A37806_01 35 10_GEN-041R05 - AEAN - SWP-011 - Platform Concrete Demo.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-041R01 SWP-011 for Platform Concrete Demo, what dust control and silica exposure prevention measures apply to saw cutting and demolition operations?". Routed focus: contracts. Top files: swp 011 - platform concrete demo. Evidence snippets: - swp 011 - platform concrete demo (p. 22): SAFE WORK PLAN SWP - 011 SWP-011-Platf…

---

### [sq78] — ✓ 259ms (exact-ID)
**Query:** Summarize SWP-011
**Domains:** documents, contracts | **Sources:** `SWP-013 Installation of Platform Barrier Revision 002.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "Summarize SWP-011". Routed focus: documents, contracts. Top files: swp 013 installation of platform barrier revision 002. Evidence snippets: - swp 013 installation of platform barrier revision 002: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / George Gao / P2 SWPs / SWP 011 Asbestos Aba…

---

### [sq79] — ✓ 273ms (exact-ID)
**Query:** Summarize SWP-032
**Domains:** documents, contracts | **Sources:** `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "Summarize SWP-032". Routed focus: documents, contracts. Top files: swp 032 - general formwork, rebar and concrete. Evidence snippets: - swp 032 - general formwork, rebar and concrete: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / MYRTLE AVE / Safety / Draft SWP / SWP 032 - General formw…

---

### [sq80] — ✓ 216ms (exact-ID)
**Query:** What does the August 20, 2025 transmittal letter from Michael Wilson say about the approval status of the SWP-032 safe work plan under spec 01 35 10?
**Domains:** documents | **Sources:** `A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf`
**Answer:** ## Section 3.01 Requirements Summary (swp 032 - general formwork rebar and concrete) - Reviewed indexed section evidence from page(s): 15, 16, 18. - Key requirements captured from the section: - SAFE WORK PLAN SWP - 032 SWP ΓÇô 032 ΓÇô General formwork, rebar and concreteΓÇô Rev. - ΓÇóDo not operate power tools in explosive atmo- spheres, such as in the presence of flammable liquids, gases or dust…

---

### [sq81] — 1.4s
**Query:** In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what restricted work hours apply, what combustible materials storage rules are in effect, and how much advance notice is required before closing a staircase?
**Domains:** contracts | **Sources:** `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what restricted work hours apply, what combustible materials storage rules are in effect, and how much advance notice is required before closing a staircase?". Routed focus: contracts. Top files: swp 052 mezzanine stair barricade. Evidence snippets: - swp 052 mezz…

---

### [sq82] — ✓ 184ms (exact-ID)
**Query:** In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what worksite entry and personnel safety requirements apply, including PPE and evacuation procedures?
**Domains:** field_ops, documents | **Sources:** `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf`
**Answer:** ## Section 3.28 (swp 052 mezzanine stair barricade) - Exact indexed section text from page(s): 5, 6, 7. ```text SAFE WORK PLAN SWP ΓÇô 052 - BUR SWP 052 ΓÇô Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026 2. continued be permitted in the swing radius of any equipment

---

### [sq83] — 1.4s
**Query:** In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what are the safety coordinator's responsibilities for PPE enforcement, SDS management, and safe work plan development?
**Domains:** field_ops, documents | **Sources:** `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what are the safety coordinator's responsibilities for PPE enforcement, SDS management, and safe work plan development?". Routed focus: field_ops, documents. Top files: a37806 01 35 10 gen-021r00 - r&r -. Evidence snippets: - a37806 01 35 10 gen-021r00 - r&r - (p. 6…

---

### [sq84] — ✓ 182ms (exact-ID)
**Query:** Summarize GEN-021R00 Safety Coordinator submittal
**Domains:** field_ops, documents | **Sources:** `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "Summarize GEN-021R00 Safety Coordinator submittal". Routed focus: field_ops, documents. Top files: a37806 01 35 10 gen-021r00 - r&r -. Evidence snippets: - a37806 01 35 10 gen-021r00 - r&r -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 35 10 Construction Safety Requirements / A37806_01 3…

---

### [sq85] — 2.1s
**Query:** In the Schedule Update 5 June 2025, what are the scheduled start and finish dates for the Elevator 541 Enclosure activities, and what activities involve rated glass installation?
**Domains:** documents, contracts | **Sources:** `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf`
**Answer:** ## Detailed Matches (a37806 01 32 10 gen-032r00 - orig -) - Query focus: In the Schedule Update 5 June 2025, what are the scheduled start and finish dates for the Elevator 541 Enclosure activities, and what activities involve rated glass installation? - Matched indexed passages: - (p. 18) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete BA-P-1220 BA-Prepare …

---

### [sq86] — 2.1s
**Query:** In the Schedule Update 5 June 2025, what is the planned outage for EL1121 Elevator Enclosure Framing installation and what are the upcoming enclosure activities at Myrtle Avenue?
**Domains:** contracts | **Sources:** `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf`
**Answer:** ## Detailed Matches (a37806 01 32 10 gen-032r00 - orig -) - Query focus: In the Schedule Update 5 June 2025, what is the planned outage for EL1121 Elevator Enclosure Framing installation and what are the upcoming enclosure activities at Myrtle Avenue? - Matched indexed passages: - (p. 53) ΓÇªfication survey 20-Jan-28, Elevator 1121-Enclosure MA-EL1121- Install Elevator Enclosure Framing ( Outage) …

---

### [sq87] — ✓ 326ms (exact-ID)
**Query:** In spec section 21 12 00 for Fire-Suppression Standpipes, what are the pipe hanger and support design requirements, including how they must handle expansion joint forces?
**Domains:** documents | **Sources:** `21 12 00 - Fire-Suppression Standpipes REV 1.pdf`
**Answer:** ## Section 2.11 Requirements Summary (21 12 00 - fire-suppression standpipes rev 1) - Reviewed indexed section evidence from page(s): 1, 2, 3, 4, 6. - Key requirements captured from the section: - FIRE DEPARTMENT CONNECTIONS [p.6] 2.12 PIPE HANGERS AND SUPPORTS [p.6] 3.3 INSTALLATION [p.9] 3.4 CLEAN UP [p.11] 3.5 TESTING [p.12]. - Section 01 33 00 Submittal Procedures 1.3 CITED STANDARDS Unless ot…

---

### [sq88] — ✓ 247ms (exact-ID)
**Query:** In spec section 21 12 00 for Fire-Suppression Standpipes, what pitch requirements apply to piping and how must pipes and hose connections be installed where they cross tracks?
**Domains:** documents | **Sources:** `21 12 00 - Fire-Suppression Standpipes REV 1.pdf`
**Answer:** ## Section 2.11 Requirements Summary (21 12 00 - fire-suppression standpipes rev 1) - Reviewed indexed section evidence from page(s): 1, 2, 3, 4, 6. - Key requirements captured from the section: - FIRE DEPARTMENT CONNECTIONS [p.6] 2.12 PIPE HANGERS AND SUPPORTS [p.6] 3.3 INSTALLATION [p.9] 3.4 CLEAN UP [p.11] 3.5 TESTING [p.12]. - Section 01 33 00 Submittal Procedures 1.3 CITED STANDARDS Unless ot…

---

### [sq89] — ✓ 770ms (exact-ID)
**Query:** In BUR-042R01 EDU07 SOGR at Burnside Avenue, what requirements apply to water leaks observed during painting and scraping, and where is lead abatement required?
**Domains:** documents | **Sources:** `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf`
**Answer:** ## Section 4.4 Requirements Summary (a37806 01 10 20 bur-042r01 - aan -) - Reviewed indexed section evidence from page(s): 42. - Key requirements captured from the section: - PLAN SOUTH PLATFORM LEVEL BURNSIDE AVENUE F F.5 E C B A C.5 8 7 6 5 4 3 2 1 228 229 230 231 1 BURNSIDE STATION SOGR PROPOSED REPAIR DETAILS J1 TRACK BENTS 225 THRU 226BUR-J1-200 PLATFORM GIRDER NORTH SIDE ELEVATION VIEW, TRAC…

---

### [sq90] — ✓ 726ms (exact-ID)
**Query:** In BUR-042R01 EDU07 SOGR at Burnside Avenue, what are the general structural notes and repair standards for structural steel and reinforced concrete?
**Domains:** documents, contracts | **Sources:** `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf`
**Answer:** ## Detailed Matches (a37806 01 10 20 bur-042r01 - aan -) - Query focus: In BUR-042R01 EDU07 SOGR at Burnside Avenue, what are the general structural notes and repair standards for structural steel and reinforced concrete? - Matched indexed passages: - (p. 38) ΓÇªCANOPY CANOPY COLUMN BEAM TO BRIGHT METAL. BEAM REQUIRED, INSTALL PER STRUCTURAL NOTES, ELSE CLEAN STEEL SURFACE OF 5. REVIEW BUR-CS-710 …

---

### [sq91] — 1.9s
**Query:** In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what did AECOM transmit to MLJTC2 Project Manager Ravi Jain on April 17, 2026?
**Domains:** field_ops, documents | **Sources:** `Transmittal 212-NOR Xfer Girder inspection.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what did AECOM transmit to MLJTC2 Project Manager Ravi Jain on April 17, 2026?". Routed focus: field_ops, documents. Top files: transmittal 212-nor xfer girder inspection. Evidence snippets: - transmittal 212-nor xfer girder inspection: DOCUMENT SUMMARY F…

---

### [sq92] — 1.3s
**Query:** In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what NYCT review designation is shown on the cover sheet — approval, information only, or designer review?
**Domains:** documents, field_ops | **Sources:** `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what NYCT review designation is shown on the cover sheet ΓÇö approval, information only, or designer review?". Routed focus: documents, field_ops. Top files: a37806 33 14 15 nor-010r00 - rwnc -. Evidence snippets: - a37806 33 14 15 nor-010r00 - rwnc -: DOCUMENT SUMMARY File…

---

### [sq93] — 1.3s
**Query:** In NOR-010R00 Norwood Avenue CCTV Inspection Findings, which sewer sections were inspected and what are the NYCDEP pipe inspection IDs for those segments?
**Domains:** documents, field_ops | **Sources:** `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In NOR-010R00 Norwood Avenue CCTV Inspection Findings, which sewer sections were inspected and what are the NYCDEP pipe inspection IDs for those segments?". Routed focus: documents, field_ops. Top files: a37806 33 14 15 nor-010r00 - rwnc -. Evidence snippets: - a37806 33 14 15 nor-010r00 - rwnc -: DOCUMENT SUMMARY File / Locati…

---

### [sq94] — ✓ 273ms (exact-ID)
**Query:** In the EDU05B Electrical Long Lead submittal for Norwood Avenue Station, what does the AECOM calculation cover page show about the project job number, client, and coordination requirements?
**Domains:** documents | **Sources:** `A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf`
**Answer:** ## Section 06.03 Requirements Summary (a37806 01 10 20 myr-082r00 - aean -) - Reviewed indexed section evidence from page(s): 3, 4, 5, 7. - Key requirements captured from the section: - O Approved Electrical Short Circuit & Device Coordination Study o Technical Specifications The documents associated with this submission include. - 20_GEN-004R01 04/16/2025 Design Statement, Design Criteria Report …

---

### [sq95] — ✓ 192ms (exact-ID)
**Query:** In the EDU05B Electrical Long Lead submittal, what panel and circuit data is shown for spec sections 12 14 10, 25 43 18, and 25 41 18 in the load schedule?
**Domains:** documents | **Sources:** `A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf`
**Answer:** ## Section 06.03 Requirements Summary (a37806 01 10 20 myr-082r00 - aean -) - Reviewed indexed section evidence from page(s): 4. - Key requirements captured from the section: - O Approved Electrical Short Circuit & Device Coordination Study o Technical Specifications The documents associated with this submission include. - 20_GEN-004R01 04/16/2025 Design Statement, Design Criteria Report Yes A3780…

---

### [sq96] — ✓ 217ms (exact-ID)
**Query:** In GEN-014R00 Monthly Quality and Certification Report for May 2025, what construction activities and quality survey items are documented for the Ave I station platform under spec section 01 40 10?
**Domains:** documents | **Sources:** `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf`
**Answer:** ## Section 3.03 Requirements Summary (a37806 01 40 10 gen-014r00 - r&r -) - Reviewed indexed section evidence from page(s): 4, 5, 6, 7, 8, 9. - Key requirements captured from the section: - Material Submittal d. - EDU02 B&C Foundations, Structural Steel & Demolition. - ΓÇó Setup/support for weekend PBGO ΓÇó Lidar scan of track B1 ΓÇó Survey platform B1/B2 + Track B1 ΓÇó Survey Track B1 Middletown …

---

### [sq97] — 1.7s
**Query:** In GEN-014R00 Monthly Quality and Certification Report for May 2025, what is the NYCT/MTA submittal designation — information only, approval, or designer review?
**Domains:** documents | **Sources:** `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In GEN-014R00 Monthly Quality and Certification Report for May 2025, what is the NYCT/MTA submittal designation ΓÇö information only, approval, or designer review?". Routed focus: documents. Top files: no. Evidence snippets: - no: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 40 10 Quality…

---

### [sq98] — ✓ 204ms (exact-ID)
**Query:** In the PRDC12-019R00 SikaGrout 212 product submittal, what application restrictions and surface preparation requirements apply — specifically regarding sun, wind, and substrate conditions?
**Domains:** documents | **Sources:** `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`
**Answer:** ## Section 9.5 Requirements Summary (a37806 prdc12-019r00 - app - sikagrout 212) - Reviewed indexed section evidence from page(s): 20, 21, 22. - Key requirements captured from the section: - 100ΓÇô124 % 124ΓÇô145 % 20ΓÇô40 sec (ASTM C-14371 ASTM C-9392) Product Temperature 65ΓÇô75 ┬░F (18ΓÇô24 ┬░C) Ambient Air Temperature > 45 ┬░F (7 ┬░C) Substrate Temperature > 45 ┬░F (7 ┬░C) Pot Life ~15 minutes…

---

### [sq99] — 2.3s
**Query:** In the PRDC12-019R00 SikaGrout 212 product submittal, is SikaGrout-212 USDA certifiable and what does the product data say about packaging size and ASTM C-827 compliance?
**Domains:** documents | **Sources:** `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`
**Answer:** Based on indexed project context, this is the strongest evidence for: "In the PRDC12-019R00 SikaGrout 212 product submittal, is SikaGrout-212 USDA certifiable and what does the product data say about packaging size and ASTM C-827 compliance?". Routed focus: documents. Top files: a37806 prdc12-019r00 - app - sikagrout 212. Evidence snippets: - a37806 prdc12-019r00 - app - sikagrout 212: DOCUMENT SU…

---

### [sq100] — ✓ 330ms (exact-ID)
**Query:** In the PRDC12-012R02 Lead Placard Package for Burnside, what containment class and cut-line preparation requirements apply to the lead paint abatement work?
**Domains:** documents | **Sources:** `A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf`
**Answer:** ## Section 12.18 Requirements Summary (a37806 prdc12-012r02 - r&r - lead placard package-burnside) - Reviewed indexed section evidence from page(s): 33, 34, 35, 36. - Key requirements captured from the section: - Be hazardous, the Hazardous Lead Waste label will be affixed to the drum. - HEPA vacuuming will be implemented periodically lead abatement in the enclosed area to avoid accumulation of de…

---

### [sq101] — 2.4s
**Query:** In PRDC12-012R02 Lead Placard Package for Burnside, what is the lead paint abatement classification, the project description, and the abatement contractor shown on the cover sheet?
**Domains:** contracts, documents | **Sources:** `A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf`
**Answer:** ## Detailed Matches (a37806 prdc12-012r00 - orig - lead placard package-burnside) - Query focus: In PRDC12-012R02 Lead Placard Package for Burnside, what is the lead paint abatement classification, the project description, and the abatement contractor shown on the cover sheet? - Matched indexed passages: - (p. 1) ΓÇªLJTC2 PM's Review: MLJTC2 Quality Manager: Number of Pages (Including Cover Sheet)…

---

### [sq102] — 2.2s
**Query:** In PRDC12-019R00 SikaGrout 212 product submittal, what are the compressive strength values, flowability, and extended working time listed in the product technical data table?
**Domains:** documents | **Sources:** `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`
**Answer:** ## Detailed Matches (a37806 prdc12-019r00 - app - sikagrout 212) - Query focus: In PRDC12-019R00 SikaGrout 212 product submittal, what are the compressive strength values, flowability, and extended working time listed in the product technical data table? - Matched indexed passages: - ΓÇª6 - General / 05 - SUBMITTALS / PRDC12 / A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf Category: submittal Key …

---
