# MLJ-017 Package 6 — All-97 Questions: Detailed Answer Report

> **Project:** MLJ-017 Package 6 - General `145b3dcf-272e-4c45-9e19-953f20f25bb9`  
> **Run date:** 2026-08-03  
> **Questions:** 97 (sq01–sq102, excl. sq32/sq50–sq53)  
> **Hybrid retrieval:** ON · **Rerank:** OFF  
> **pgvector statement_timeout:** 30 s · **FTS statement_timeout:** 25 s  
> **Raw output:** `eval/mlj017-all97-run-utf8.txt`

---

## Summary Statistics

| Metric | Value |
|---|---|
| Total questions | 97 |
| Questions with at least 1 source | 94 (97%) |
| Exact-ID hits (sub-1s) | 22 |
| DB timeout (≥25 s, keyword fallback) | 8 |
| Min / Avg / Max elapsed | 178 ms / 3810 ms / 31989 ms |
| Total wall-clock time | 369 s (~6 min) |

**Timeout questions (keyword search used instead of vector/FTS):**
sq02, sq03, sq24, sq26, sq27, sq44, sq46, sq48

---

## Retrieval Method Legend

| Symbol | Meaning |
|---|---|
| ⚡ | Exact-ID lookup: a construction identifier (GEN-xxx, SWP-xxx, RFI-xxx …) was parsed from the query and resolved deterministically to a single file. Bypasses all vector/FTS ranking. |
| 🔍 | Hybrid search: parallel pgvector ANN + FTS, merged with RRF, then keyword/trigram boost. |
| ⏱ | Timeout fallback: project has 1.88 M embedded chunks; vector + FTS both hit statement_timeout, so keyword/trigram search was used instead. |

---

## Per-Question Answers

### 🔍 [sq01] — ⏱ 1.9s

**Query:**
> In GEN-042R00, what subcontractor is being reviewed for approval, what type of work experience do they describe in their application, and are any active contracts listed?

**How the answer was retrieved:**
- Method: Hybrid search — 0 vector + 0 lexical → 0 merged candidates
- Domains routed: `contracts, documents, subcontractor`
- Elapsed: 1913 ms
- hybrid: profile=balanced vector=0 lexical=0 merged=0 restricted=False
- route: retrieval=30829ms agent=2ms total=30836ms

**Sources retrieved:**
- `A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf` _(pages: 14, 6, 16, 3)_

**Citations (chunk-level):**
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=48 (p. 14) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=17 (p. 6) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=51 (p. 14) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=57 (p. 16) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=7 (p. 3) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=40 (p. 13) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=41 (p. 13) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=29 (p. 10) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-042R00, what subcontractor is being reviewed for approval, what type of work experience do they describe in their application, and are any active contracts listed?".
Routed focus: contracts, documents, subcontractor.
Top files: a37806 01 30 20 gen-164r00 - fio -.
Evidence snippets:
- a37806 01 30 20 gen-164r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 30 20 Project Meetings / A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Pro
- a37806 01 30 20 gen-164r00 - fio - (p. 14): STREET LEVEL EL542 Clean, Prime Torqued Connections at SB Steel Crossroads Surface Prep D D D Elevator Piston Mobilization & Drilling United/MAE D D D SB EMR 54
- a37806 01 30 20 gen-164r00 - fio - (p. 16): 0 0 10 10 4/27/2026 8 389 0 10 0 0 10 10 4/28/2026 8 389 0 10 0 0 10 10 4/29/2026 8 389 0 10 0 0 10 10 4/30/2026 8 389 0 10 0 0 10 10 0 8 71 389 0 0 0 10 0 0 0
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⏱ [sq02] — ⏱ TIMEOUT 30.8s

**Query:**
> What scope of work and pricing is in Island Pavement Cutting Co's subcontract

**How the answer was retrieved:**
- Method: Keyword fallback (pgvector + FTS both timed out)
- Domains routed: `contracts`
- Elapsed: 30836 ms
- hybrid: profile=balanced vector=24 lexical=0 merged=24 restricted=True
- route: retrieval=25371ms agent=2ms total=25375ms

**Sources retrieved:**
- `37135_02FF_QBP_001R00 - (NET) - GEI QBP Instrumentation Work PlanDMC.pdf` _(pages: 5, 2, 3)_
- `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf` _(pages: 12, 4, 8)_
- `8.2- 25.11.19 A37806-MTACD-MLJTC2-L-0125 - Sub-Contractor Approval  SD Industries LLC.pdf` _(pages: 1)_
- `M017_MLJ_DSTAR_Subcontract_Attachment B_20250815.pdf` _(pages: 1)_
- `A37806_PRDC11-026R00 - AAN - Burnside Temporary Airline Support Drawing Package.pdf` _(pages: 6, 3)_
- `A37806_PRDC14-004R02 - APP-EAN - Elevator Inspection and Testing Plan (I&TP).pdf` _(pages: 1)_
- `A37806_01 35 10_GEN-052R02 - APP - SWP-026 - Support of Excavation.pdf` _(pages: 1, 8, 11)_
- `Week 11 2026 Approved Service Plans.pdf` _(pages: 18, 55, 77)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "What scope of work and pricing is in Island Pavement Cutting Co's subcontract".
Routed focus: contracts.
Top files: 37135 02ff qbp 001r00 - (net) - gei, m017 mlj dstar subcontract attachment b 20250815.
Evidence snippets:
- 37135 02ff qbp 001r00 - (net) - gei (p. 5): Instrumentation Work Plan Queensboro Plaza Station Long Island City, New York Revision 0 September 30, 2022 GEI Consultants, Inc., P.C. 1 1. Introduction 1.1 Ov
- 37135 02ff qbp 001r00 - (net) - gei (p. 3): Instrumentation Work Plan Queensboro Plaza Station Long Island City, New York Revision 0 September 30, 2022 GEI Consultants, Inc., P.C. i Table of Contents 1. I
- m017 mlj dstar subcontract attachment b 20250815: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 13 - SUBCONTRACTS / D-STAR / m017 mlj dstar subcontract attachment b 20250815 Category: cont
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⏱ [sq03] — ⏱ TIMEOUT 25.4s

**Query:**
> What joint sealing and pavement cutting contract work does Island Pavement Cutting Co list?

**How the answer was retrieved:**
- Method: Keyword fallback (pgvector + FTS both timed out)
- Domains routed: `contracts`
- Elapsed: 25376 ms

**Sources retrieved:**
- `A37806_GEN-051R00 - APP - Subcontractor Approval Forms - Island Pavement Cutting Co Inc..pdf` _(pages: 35)_
- `Subcontract DRAFT ISLAND 8-28-25.docx`
- `Subcontract DRAFT ISLAND 8-12-25 proposed changes.docx`
- `Subcontract DRAFT ISLAND 7-14-25.docx`
- `Subcontract DRAFT ISLAND 7-18-25.docx`
- `Subcontract CLEAN DRAFT ISLAND 8-29-25.docx`
- `Subcontract CLEAN DRAFT ISLAND 9-16-25 nd final.docx`
- `Subcontract CLEAN DRAFT ISLAND 8-29-25 Sd final.docx`

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "What joint sealing and pavement cutting contract work does Island Pavement Cutting Co list?".
Routed focus: contracts.
Top files: subcontract draft island 8-28-25, subcontract draft island 8-12-25 proposed changes, subcontract draft island 7-14-25.
Evidence snippets:
- subcontract draft island 8-28-25: SUBCONTRACTOR Name: ISLAND PAVEMENT CUTTING CO., INC. Address: 31 Cleveland Ave, Bay Shore, NY 11706 Phone/Email: P: 631-567-2711 On or about the 31st da
- subcontract draft island 8-12-25 proposed changes: SUBCONTRACTOR Name: ISLAND PAVEMENT CUTTING CO., INC. Address: 31 Cleveland Ave, Bay Shore, NY 11706 Phone/Email: P: 631-567-2711 On or about the 31st da
- subcontract draft island 7-14-25: SUBCONTRACTOR Name: ISLAND PAVEMENT CUTTING CO., INC. Address: 31 Cleveland Ave, Bay Shore, NY 11706 Phone/Email: P: 631-567-2711 On or about the 31st da
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq04] — ⏱ 2.9s

**Query:**
> In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, what subcontractor is approved, what is their contract value, and what scope are they approved to perform?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, subcontractor`
- Elapsed: 2912 ms

**Sources retrieved:**
- `2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf` _(pages: 1)_

**Citations (chunk-level):**
- 2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (2025-03-19 mtacd-mljtc2-l-0024 sub-contractor approval 50 states engineering, corp)
- Query focus: In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, what subcontractor is approved, what is their contract value, and what scope are they approved to perform?
- Matched indexed passages:
- ΓÇªONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf Category: contract Key topics: 2 Broadway, 8th Floor, MLJ-TC2 JV, 1010 Northern Blvd, Suite 200, MTACD-MLJTC2-L-0024, contractor, york,ΓÇª
- (p. 1) ΓÇªntract A-37806 Design-Build Services for ADA Upgrades - Package 6 Sub-Contractor Approval ΓÇô 50 States Engineering, Corp. Dear Mr. Jain, We are pleased to inform that the following Sub-Contractor is hereby approved. Sub-Contractor must be enrolled in OCIP prior to the start of anyΓÇª
```

---

### 🔍 [sq05] — ⏱ 1.8s

**Query:**
> In A37806 Phasing Plan GEN-001R05, what are the major project phases described and their key milestones or constraints?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, scheduling, documents`
- Elapsed: 1767 ms

**Sources retrieved:**
- `A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx`

**Citations (chunk-level):**
- A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx chunk=0 (p. ?) rel=1.000
- A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx chunk=3 (p. ?) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 ada p6 - communication ps lan agenda)
- Query focus: In A37806 Phasing Plan GEN-001R05, what are the major project phases described and their key milestones or constraints?
- Matched indexed passages:
- ΓÇª/ 00 Systems / 01 Comms / 08 Workshops / 03 Comms PS LAN extension / A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx Category: meeting_minutes Key topics: AGENDA, a37806, meeting, communication, workshop, contract, package, date, location, teams, agenda - Document PurΓÇª
- AGENDA PS LAN System Design approach ΓÇô Layouts Norwood Ave. Middletown Rd. Myrtle Ave Avenue I Burnside Ave. Q&A Open discussion
```

---

### 🔍 [sq06] — ⏱ 1.6s

**Query:**
> In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what ADA accessibility scheme and project information is presented?

*Active document context:* `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1581 ms
- route: retrieval=108ms agent=1ms total=2044ms

**Sources retrieved:**
- `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf` _(pages: 1, 3, 4, 5)_

**Citations (chunk-level):**
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=2 (p. 1) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=4 (p. 3) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=5 (p. 4) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=6 (p. 5) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=8 (p. 7) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=9 (p. 8) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=13 (p. 12) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what ADA accessibility scheme and project information is presented?".
Routed focus: documents.
Top files: pre-proposal slideshow a37806 rfp addendum 02.
Evidence snippets:
- pre-proposal slideshow a37806 rfp addendum 02: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 00 - Bid Docs (Do Not Modify) / RFP / Addendum 2 / Pre-Proposal Slideshow_A37806_RFP_Addendum_02
- pre-proposal slideshow a37806 rfp addendum 02 (p. 53): MTA C D Contract No. A37806 Pre-Proposal Informational Meeting Project: A37806: Design-Build Services for ADA Upgrades Package 6: Accessibility Upgrades at Five
- pre-proposal slideshow a37806 rfp addendum 02 (p. 1): PACKAGE 5 Disclaimer: This presentation and the information contained herein is provided for information only. MTA Construction and Development makes no represe
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq07] — ⏱ 2.0s

**Query:**
> In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what does the Contract Specific Responsibility Form require of significant subcontractors?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, documents, subcontractor`
- Elapsed: 2045 ms
- route: retrieval=104ms agent=1ms total=1548ms

**Sources retrieved:**
- `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf` _(pages: 3, 14, 30, 31)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what does the Contract Specific Responsibility Form require of significant subcontractors?".
Routed focus: contracts, documents, subcontractor.
Top files: a37806 gen-027r00 - r&r - subcontractor approval forms.
Evidence snippets:
- a37806 gen-027r00 - r&r - subcontractor approval forms: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / PRDC SUBCONTRACTORS / A37806_GEN-027R00 - R&R - Subcontractor Approval Forms -
- a37806 gen-027r00 - r&r - subcontractor approval forms (p. 30): CONTRACT SPECIFIC RESPONSIBILTY FORM This form is to be submitted after Contractor is notified that it is the low bidder, or has otherwise been selected for a c
- a37806 gen-027r00 - r&r - subcontractor approval forms (p. 3): Schedule F 2 9/2020 POTENTIAL SUBCONTRACTOR QUESTIONNAIRE Schedule F is to be completed by potential subcontractors. Subcontractors that plan to pursue subcontr
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq08] — ⏱ 1.5s

**Query:**
> In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what is the ownership percentage and partner breakdown for this joint venture?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, subcontractor`
- Elapsed: 1549 ms

**Sources retrieved:**
- `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf` _(pages: 16, 3, 4, 5)_

**Citations (chunk-level):**
- A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf chunk=26 (p. 16) rel=5.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what is the ownership percentage and partner breakdown for this joint venture?".
Routed focus: contracts, subcontractor.
Top files: a37806 gen-027r00 - r&r - subcontractor approval forms.
Evidence snippets:
- a37806 gen-027r00 - r&r - subcontractor approval forms: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / PRDC SUBCONTRACTORS / A37806_GEN-027R00 - R&R - Subcontractor Approval Forms -
- a37806 gen-027r00 - r&r - subcontractor approval forms (p. 16): ______________________________________________________________ ________________________________________________________________________ If the Contractor is a j
- a37806 gen-027r00 - r&r - subcontractor approval forms (p. 4): 6. List area or areas of construction work that you seek to perform on MTA jobs: _______________________________________________________ II. EXPERIENCE 7. How m
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq09] — ⏱ 2.1s

**Query:**
> In the M017_IMP Draft Subcontract, what payment provisions from the prime contract are specifically excluded from the incorporated subcontract documents?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, documents, communication`
- Elapsed: 2109 ms

**Sources retrieved:**
- `M017_IMP_Draft Subcontract_20251024.docx`

**Citations (chunk-level):**
- M017_IMP_Draft Subcontract_20251024.docx chunk=11 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=122 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=10 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=80 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=81 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=100 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=44 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=0 (p. ?) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the M017_IMP Draft Subcontract, what payment provisions from the prime contract are specifically excluded from the incorporated subcontract documents?".
Routed focus: contracts, documents, communication.
Top files: m017 imp draft subcontract 20251024.
Evidence snippets:
- m017 imp draft subcontract 20251024: liable under the Prime Contract to Owner. In no event shall Subcontractor have greater or more rights against Contractor than Contractor shall have against Own
- m017 imp draft subcontract 20251024: and complete performance and acceptance of the Work as described in the Prime Contractor reasonably inferable therefrom, which is incorporated into this Subcont
- m017 imp draft subcontract 20251024: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 13 - SUBCONTRACTS / IMP PLUMBING / SS / m017 imp draft subcontract 20251024 Category: contr
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq10] — ⏱ 2.0s

**Query:**
> In the M017_IMP Draft Subcontract, what does the entire agreement clause say about how prior oral or written agreements between the parties are treated?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, documents, communication`
- Elapsed: 1963 ms

**Sources retrieved:**
- `M017_IMP_Draft Subcontract_20251024.docx`

**Citations (chunk-level):**
- M017_IMP_Draft Subcontract_20251024.docx chunk=9 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=109 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=134 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=148 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=11 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=33 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=74 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=98 (p. ?) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the M017_IMP Draft Subcontract, what does the entire agreement clause say about how prior oral or written agreements between the parties are treated?".
Routed focus: contracts, documents, communication.
Top files: m017 imp draft subcontract 20251024.
Evidence snippets:
- m017 imp draft subcontract 20251024: NO MODIFICATIONS This Subcontract represents the entire agreement between Contractor and Subcontractor and supersedes all prior negotiations, representations
- m017 imp draft subcontract 20251024: SUBCONTRACT DOCUMENTS The Subcontract Documents consist of: (1) this Subcontract including its Attachments; (2) the Prime Contract, which consists of the contr
- m017 imp draft subcontract 20251024: roposed sub-subcontracts, purchase orders, equipment leases and other agreements with third parties where the use of such third parties is inconsistent with thi
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq11] — ⏱ 3.2s

**Query:**
> In Transmittal 0014 for MTA Personnel and PMC Supplies, what items were submitted and what was their review status when returned?

*Active document context:* `A37806 Transmittal 0014 -  MTA Personnel and PMC Supplies.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 3232 ms

**Sources retrieved:**
- `A37806 Transmittal 0014 -  MTA Personnel and PMC Supplies.pdf`

**Answer:**

```
I could not find an exact indexed passage in a37806 transmittal 0014 - mta personnel and pmc that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### 🔍 [sq12] — ⏱ 1.9s

**Query:**
> What is in the Myrtle Ave Reserve Service Load Letter?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1939 ms

**Sources retrieved:** _none_

**Answer:**

```
## More context needed
- Your question asks what is mentioned in that document but doesn't specify a topic.
- To answer precisely, tell me what you're looking for ΓÇö for example: parties involved, dates, costs, scope, action items, approvals, or a specific subject.
**Possible matching file:** myr reserve service heic
- Try asking: _In the myr reserve service heic, what [specific topic]?_
```

---

### 🔍 [sq13] — ⏱ 1.8s

**Query:**
> In the MTACD-MLJTC2-L-0017 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, subcontractor`
- Elapsed: 1771 ms

**Sources retrieved:**
- `2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE FX $109,450.00.pdf` _(pages: 1)_

**Citations (chunk-level):**
- 2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE FX $109,450.00.pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (2025-03-19 mtacd-mljtc2-l-0017 subcontractor approval mase fx $109,450 00)
- Query focus: In the MTACD-MLJTC2-L-0017 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
- Matched indexed passages:
- ΓÇªONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE FX $109,450.00.pdf Category: contract Key topics: 2 Broadway, 8th Floor, MLJ-TC2 JV, 1010 Northern Blvd, Suite 200, MTACD-MLJTC2-L-0017, contractor, york, jain, mase, work, broaΓÇª
- (p. 1) ΓÇªn MLJ-TC2 JV 1010 Northern Blvd, Suite 200 Great Neck, New York 11021 MTACD-MLJTC2-L-0017 Re: Subject: Contract A-37806 Design-Build Services for ADA Upgrades - Package 6 Sub-Contractor Approval ΓÇô MASE FX Dear Mr. Jain, We are pleased to inform that the following Sub-Contractor iΓÇª
```

---

### 🔍 [sq14] — ⏱ 1.8s

**Query:**
> In the MTACD-MLJTC2-L-0028 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, subcontractor`
- Elapsed: 1849 ms

**Sources retrieved:**
- `2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf` _(pages: 1)_

**Citations (chunk-level):**
- 2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (2025-03-26 mtacd-mljtc2-l-0028 sub-contractor approval titanium linx consulting, inc)
- Query focus: In the MTACD-MLJTC2-L-0028 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
- Matched indexed passages:
- ΓÇªALS / PRDC SUBCONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf Category: contract Key topics: 2 Broadway, 8th Floor, MLJ-TC2 JV, 1010 Northern Blvd, Suite 200, MTACD-MLJTC2-L-0028, contractor, yΓÇª
- (p. 1) ΓÇªn MLJ-TC2 JV 1010 Northern Blvd, Suite 200 Great Neck, New York 11021 MTACD-MLJTC2-L-0028 Re: Subject: Contract A-37806 Design-Build Services for ADA Upgrades - Package 6 Sub-Contractor Approval ΓÇô Titanium Linx Consulting, Inc. Dear Mr. Jain, We are pleased to inform that the folΓÇª
```

---

### 🔍 [sq15] — ⏱ 1.9s

**Query:**
> In the MTACD-MLJTC2-L-0049 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, subcontractor`
- Elapsed: 1895 ms

**Sources retrieved:**
- `2025-06-10 MTACD-MLJTC2-L-0049 Sub-Contractor Approval ΓÇô McVac Environmental Services, Inc..pdf` _(pages: 1)_

**Citations (chunk-level):**
- 2025-06-10 MTACD-MLJTC2-L-0049 Sub-Contractor Approval ΓÇô McVac Environmental Services, Inc..pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (2025-06-10 mtacd-mljtc2-l-0049 sub-contractor approval ΓÇô mcvac environmental services,)
- Query focus: In the MTACD-MLJTC2-L-0049 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
- Matched indexed passages:
- ΓÇª010 Northern Blvd, Suite 200, Great Neck, NY. - Key Quantity/Cost: Subcontract value is $142,638.73. - Date: Issued June 10, 2025. - Approval Status: Officially approved by Mekh Gurung (Naik/TYLin JV Sr. Project Manager) and Michael Wilson (MTA C&D Senior Director). - Conditions:ΓÇª
- (p. 1) ΓÇªn MLJ-TC2 JV 1010 Northern Blvd, Suite 200 Great Neck, New York 11021 MTACD-MLJTC2-L-0049 Re: Subject: Contract A-37806 Design-Build Services for ADA Upgrades - Package 6 Sub-Contractor Approval ΓÇô McVac Environmental Services, Inc. Dear Mr. Jain, We are pleased to inform that theΓÇª
```

---

### 🔍 [sq16] — ⏱ 1.9s

**Query:**
> In the MTACD-MLJTC2-L-0083 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, subcontractor`
- Elapsed: 1940 ms

**Sources retrieved:**
- `2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval ΓÇô American Geophysics Inc..pdf` _(pages: 1)_

**Citations (chunk-level):**
- 2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval ΓÇô American Geophysics Inc..pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (2025-08-08 mtacd-mljtc2-l-0083 - sub-contractor approval ΓÇô american geophysics)
- Query focus: In the MTACD-MLJTC2-L-0083 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
- Matched indexed passages:
- ΓÇªALS / PRDC SUBCONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval ΓÇô American Geophysics Inc..pdf Category: contract Key topics: 2 Broadway, 8th Floor, MLJ-TC2 JV, 1010 Northern Blvd, Suite 200, MTACD-MLJTC2-L-0083, contractor, yorΓÇª
- (p. 1) ΓÇªn MLJ-TC2 JV 1010 Northern Blvd, Suite 200 Great Neck, New York 11021 MTACD-MLJTC2-L-0083 Re: Subject: Contract A-37806 Design-Build Services for ADA Upgrades - Package 6 Sub-Contractor Approval ΓÇô American Geophysics Inc. Dear Mr. Jain, We are pleased to inform you that the folloΓÇª
```

---

### 🔍 [sq17] — ⏱ 1.8s

**Query:**
> In the MTACD-MLJTC2-L-0093 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, subcontractor`
- Elapsed: 1774 ms

**Sources retrieved:**
- `2025-08-25 MTACD-MLJTC2-L-0093 - Sub-Contractor Approval ΓÇô Tri-State Civil Construction LLC.pdf` _(pages: 1)_

**Citations (chunk-level):**
- 2025-08-25 MTACD-MLJTC2-L-0093 - Sub-Contractor Approval ΓÇô Tri-State Civil Construction LLC.pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (2025-08-25 mtacd-mljtc2-l-0093 - sub-contractor approval ΓÇô tri-state civil)
- Query focus: In the MTACD-MLJTC2-L-0093 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?
- Matched indexed passages:
- ΓÇªALS / PRDC SUBCONTRACTORS / 00 SUBCONTRACTOR APP LETTERS / 2025-08-25 MTACD-MLJTC2-L-0093 - Sub-Contractor Approval ΓÇô Tri-State Civil Construction LLC.pdf Category: contract Key topics: 2 Broadway, 8th Floor, MLJ-TC2 JV, 1010 Northern Blvd, Suite 200, MTACD-MLJTC2-L-0093, contracΓÇª
- (p. 1) ΓÇªn MLJ-TC2 JV 1010 Northern Blvd, Suite 200 Great Neck, New York 11021 MTACD-MLJTC2-L-0093 Re: Subject: Contract A-37806 Design-Build Services for ADA Upgrades - Package 6 Sub-Contractor Approval ΓÇô Tri-State Civil Construction, LLC Dear Mr. Jain, We are pleased to inform you thatΓÇª
```

---

### 🔍 [sq18] — ⏱ 2.2s

**Query:**
> In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what rebar sizes and reinforcement details are shown for the elevator pit foundation mat?

*Active document context:* `A37806_03 20 00_AVI-002R02 - FIO - Ave I North Foundation Rebar Shop Drawings.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 2151 ms

**Sources retrieved:**
- `A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf`

**Citations (chunk-level):**
- A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf chunk=0 (p. ?) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what rebar sizes and reinforcement details are shown for the elevator pit foundation mat?".
Routed focus: documents.
Top files: a37806 03 20 00 avi-002r00 - aan -.
Evidence snippets:
- a37806 03 20 00 avi-002r00 - aan -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 03 - CONCRETE / 03 20 00 - Concrete Reinforcing / AVE I / A37806_03 20 00_AVI-
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq19] — ⚡ 264ms

**Query:**
> In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what is the submittal number, NYCT/MTA review status, and which spec section does it reference?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 264 ms

**Sources retrieved:**
- `A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf` _(pages: 4, 5)_

**Citations (chunk-level):**
- A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf chunk=11 (p. 4) rel=1.000
- A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf chunk=15 (p. 5) rel=1.000
- A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf chunk=16 (p. 5) rel=1.000

**Answer:**

```
## Section 6.3 Requirements Summary (a37806 03 20 00 avi-002r01 - fio -)
- Reviewed indexed section evidence from page(s): 4, 5.
- Key requirements captured from the section:
- 43'-8 1/2" T/ OPNG 1 1 1 COATED REBAR EPOXY U.O.N.
- REP01ELEVATOR PIT REINFORCEMENT DETAILS (NORTH) AVENUE I STATION PACKAGE 6 BROOKLYN KM#25-067 - - GB 12/02/2025 0 12/02/2025 FOR APPROVAL 1 02/11/2026 AAN PER EOR MARKUPS (DTD.01.06.2026) & REVISED PER UPDATED SET (DTD.01.23.2026) & SK-044 (DTD.02.02.2026)...
- GB 12/02/2025 0 12/02/2025 FOR APPROVAL 1 02/11/2026 AAN PER EOR MARKUPS (DTD.01.06.2026) & REVISED PER UPDATED SET (DTD.01.23.2026) & SK-044 (DTD.02.02.2026) REV_1 ATLANTIC REINFORCING CONCRETE FOR FIELD USE PLEASE READ THIS DRAWING IN CONJUNCTION WITH FOU...
- AVI-CS-601 (DTD.01.23.2026) SEE DETAIL A MF2 12'-0" X 12'-0" X 3'-0" 1 CONCRETE EXPOSED TO EARTH OR WEATHER = 2" CONCRETE CAST AGAINST AND PERMANENTLY - EXPOSED TO EARTH = 3" 2.
- ENCASEMENT (TYP) FOR REINF REFER DWG REP01 (TYP) W14X90 W14X90 W14X90 W14X90 W14X90 W14X90 W14X90 W14X90 2x3 #4T3820 @10" TIES 2x2x3 #4T1220 @10" TIES COLUMN MARK SIZE (L X W) CP2 42" X 24" CONCRETE PILASTER SCHEDULE:- REF.
Evidence: a37806 03 20 00 avi-002r01 - fio - (p. 4, 5).
```

---

### ⚡ [sq20] — ⚡ 208ms

**Query:**
> In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what glazing spec items are referenced in the submittal?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 208 ms

**Sources retrieved:**
- `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf`

**Answer:**

```
I could not find an exact indexed passage in a37806 14 24 00 bur-009r00 - aan - that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### ⚡ [sq21] — ⚡ 178ms

**Query:**
> In BUR-009R00 for the EL539 Cab and Entrance Drawings, what is the NYCT/MTA review status and which spec section does this submittal cover?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 178 ms

**Sources retrieved:**
- `A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entrance Drawings-MTA.pdf`

**Answer:**

```
I could not find an exact indexed passage in a37806 14 24 00 bur-009r00 - r&r - that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### 🔍 [sq22] — ⏱ 1.4s

**Query:**
> In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what is the review status of this submittal.

*Active document context:* `A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1380 ms

**Sources retrieved:**
- `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf`

**Answer:**

```
I could not find an exact indexed passage in mljtc2 aecom atc 1 burnside avenue drawings that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### ⚡ [sq23] — ⚡ 178ms

**Query:**
> In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, was the submittal approved and were there any comments?

*Active document context:* `A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf`

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 178 ms
- hybrid: profile=balanced vector=0 lexical=0 merged=0 restricted=False
- route: retrieval=30690ms agent=0ms total=30693ms

**Sources retrieved:**
- `A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf` _(pages: 3)_

**Answer:**

```
## Answer
- I could not find an exact indexed passage in a37806 08 45 25 bur-001r00 - fio - that answers this question.
- No evidence-backed specification text was verified in the retrieved chunks for this request.
- Refine with a section heading or exact phrase and I will search only this file again.
- **Evidence:** a37806 08 45 25 bur-001r00 - fio - (p. 3).
```

---

### ⏱ [sq24] — ⏱ TIMEOUT 30.7s

**Query:**
> What specification requirements govern controlled fills and excavation near the elevator?

**How the answer was retrieved:**
- Method: Keyword fallback (pgvector + FTS both timed out)
- Domains routed: `documents`
- Elapsed: 30693 ms
- route: retrieval=102ms agent=2ms total=2134ms

**Sources retrieved:**
- `A37806_01 35 10_GEN-052R02 - APP - SWP-026 - Support of Excavation.pdf` _(pages: 17)_
- `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf` _(pages: 4, 10, 11)_
- `SWP 063 Installation of work platform underneath the elevated structure at WSQ Rev 3.pdf` _(pages: 78, 13, 71)_
- `37135_02FF_QBP_001R00 - (NET) - GEI QBP Instrumentation Work PlanDMC.pdf` _(pages: 1, 15, 28)_
- `SWP-047 Train Gantry-Steel Girder Removal and Installation Rev 03.docx`
- `A37806_PRDC14-004R02 - APP-EAN - Elevator Inspection and Testing Plan (I&TP).pdf` _(pages: 1)_
- `A37806_PRDC11-026R00 - AAN - Burnside Temporary Airline Support Drawing Package.pdf` _(pages: 1, 2, 7)_
- `M017-0650 CMF.pdf` _(pages: 2)_

**Citations (chunk-level):**
- A37806_01 35 10_GEN-052R02 - APP - SWP-026 - Support of Excavation.pdf chunk=38 (p. 17) rel=0.852
- AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf chunk=15 (p. 11) rel=0.491
- 37135_02FF_QBP_001R00 - (NET) - GEI QBP Instrumentation Work PlanDMC.pdf chunk=22 (p. 15) rel=0.466

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "What specification requirements govern controlled fills and excavation near the elevator?".
Routed focus: documents.
Top files: swp 026 - support of excavation, aeis llc irf a37806 0006 - middletown back, swp 063 installation of work platform underneath the.
Evidence snippets:
- swp 026 - support of excavation (p. 17): CAVATION UNLESS OTHERWISE APPROVED BY THE ENGINEER. 8.) CONTROLLED FILLS MUST BE COMPLIANT WITH SECTION BC 1804.2.2 OF THE NEW YORK CITY BUILDING CODE OR MTA
- aeis llc irf a37806 0006 - middletown back (p. 11): GENERAL NOTES: EXCAVATION SUPPORT REQUIREMENTS: TO MEET THE REQUIREMENTS OF THE PRDC AND THE PROJECT SPECIFICATIONS. 3. EXCAVATION SUPPORT SYSTEMS SHALL BE DESI
- swp 063 installation of work platform underneath the (p. 13): NT-TREATED (FRT) PLYWOOD CONFORMING TO THE REQUIREMENTS OF AWPA U1. OTHER TIMBER MEMBER SHALL BE FIRE-RETARDANT-TREATED CONFORMING TO THE REQUIREMENTS OF AWPA U
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq25] — ⏱ 2.1s

**Query:**
> In GEN-001R02 Elevator Walls Formwork Drawing, what is the NYCT/MTA submittal designation — is it for approval, information only, or designer review?

**How the answer was retrieved:**
- Method: Hybrid search — 0 vector + 0 lexical → 0 merged candidates
- Domains routed: `documents`
- Elapsed: 2135 ms
- hybrid: profile=balanced vector=0 lexical=0 merged=0 restricted=False
- route: retrieval=30589ms agent=1ms total=30591ms

**Sources retrieved:**
- `A37806_03 10 00_GEN-001R02 - RWC - Elevator Walls Formwork Drawing - MTA.pdf` _(pages: 3, 1, 2, 4)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-001R02 Elevator Walls Formwork Drawing, what is the NYCT/MTA submittal designation ΓÇö is it for approval, information only, or designer review?".
Routed focus: documents.
Top files: a37806 03 10 00 gen-001r02 - rwc -.
Evidence snippets:
- a37806 03 10 00 gen-001r02 - rwc -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / Nahon Torres / Carpentry / Formwork / A37806_03 10 00_GEN-001R02 - RWC -
- a37806 03 10 00 gen-001r02 - rwc - (p. 1): Submittal Record Submittal Use the Submittal form for the Architect/Engineer to verify that the correct products will be installed on the project. Project Infor
- a37806 03 10 00 gen-001r02 - rwc - (p. 3): For NYCT/MTA Review & Comment For NYCT/MTA Approval For Designer Approval For NYCT/MTA Information Only For Designer Information Only Date: Contract Number: Con
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⏱ [sq26] — ⏱ TIMEOUT 30.6s

**Query:**
> What pest control services are billed in Invoice 11707, which locations were serviced?

**How the answer was retrieved:**
- Method: Keyword fallback (pgvector + FTS both timed out)
- Domains routed: `documents, contracts`
- Elapsed: 30592 ms
- hybrid: profile=balanced vector=0 lexical=0 merged=0 restricted=False
- route: retrieval=30571ms agent=1ms total=30572ms

**Sources retrieved:**
- `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf` _(pages: 8, 11)_
- `A37806_01 35 10_GEN-052R02 - APP - SWP-026 - Support of Excavation.pdf` _(pages: 2, 3, 6)_
- `A37806 CWP-061 - Architectural Wall Installation.docx`
- `A37806_01 35 10_GEN-061R01 - APP - SWP-020 - Painting.pdf` _(pages: 4, 6, 25)_
- `A37806_DQR_260315_MDT.pdf` _(pages: 1, 2)_
- `A37806_DQR_260203_AVI.pdf` _(pages: 1, 2)_
- `A37806_DQR_260312_NOR.pdf` _(pages: 1, 2)_
- `8.2- 25.11.19 A37806-MTACD-MLJTC2-L-0125 - Sub-Contractor Approval  SD Industries LLC.pdf` _(pages: 1)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "What pest control services are billed in Invoice 11707, which locations were serviced?".
Routed focus: documents, contracts.
Top files: 8 2- 25 11 19 a37806-mtacd-mljtc2-l-0125 - sub-contractor, no.
Evidence snippets:
- 8 2- 25 11 19 a37806-mtacd-mljtc2-l-0125 - sub-contractor: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 19 - QUALITY CONTROL / 14 QUALITY AUDITS / MTA / New folder (2) / Element - 8 / 8.2- 25.11.19 A3
- no: Γ£ö Buy America Compliant For NYCT/MTA Review & Comment Γ£ö For NYCT/MTA Approval For Designer Approval For NYCT/MTA Information Only For Designer Informatio
- no (p. 1): Main Office: 1010 Northern Boulevard, Suite 200, Great Neck, NY 11021 CONTRACTOR'S DAILY QUALITY REPORT Contract A37806, Design- Build Services for Accessibilit
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⏱ [sq27] — ⏱ TIMEOUT 30.6s

**Query:**
> What services are billed in Invoice 11830 for the Middletown station locations, and what are the April 2026 service order numbers?

**How the answer was retrieved:**
- Method: Keyword fallback (pgvector + FTS both timed out)
- Domains routed: `documents, contracts`
- Elapsed: 30573 ms

**Sources retrieved:**
- `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf` _(pages: 8, 11)_
- `the next 3 months 9.16.25.pdf` _(pages: 2)_
- `SWP-047 Train Gantry-Steel Girder Removal and Installation Rev 03.docx`
- `SWP-088 Elevator Glass and Glazing Enclosure.docx`
- `1018628470-001.pdf` _(pages: 1)_
- `M017-0650 CMF.pdf` _(pages: 1, 2)_
- `A37806_01 35 10_GEN-052R02 - APP - SWP-026 - Support of Excavation.pdf` _(pages: 3, 16, 17)_
- `A37806 CWP-061 - Architectural Wall Installation.docx`

**Citations (chunk-level):**
- AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf chunk=6 (p. 8) rel=0.554
- 1018628470-001.pdf chunk=2 (p. 1) rel=0.411
- M017-0650 CMF.pdf chunk=2 (p. 1) rel=0.398
- M017-0650 CMF.pdf chunk=4 (p. 2) rel=0.398

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "What services are billed in Invoice 11830 for the Middletown station locations, and what are the April 2026 service order numbers?".
Routed focus: documents, contracts.
Top files: m017-0650 cmf, swp 026 - support of excavation.
Evidence snippets:
- m017-0650 cmf (p. 2): o be bound by the specification sections and drawings noted on the face of this Purchase Order. 2. INVOICING (a) Invoices shall be provided for each and every s
- m017-0650 cmf (p. 1): MLJ Contracting Corp 1010 Northern Blvd, Suite 200 Great Neck, NY, 11021 US P.O. No : M017-0650 Account # Date: Jun 03, 2026 PURCHASE ORDER Ship to: LONG ISLAND
- swp 026 - support of excavation (p. 3): SAFE WORK PLAN SWP ΓÇô 026 - MID SWP 026 ΓÇô Support of Excavation ΓÇô MID - Rev. 2 ΓÇô 08/ 13/25 SECTION 1 ΓÇô General Information Contract / Project Descripti
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq28] — ⏱ 2.4s

**Query:**
> In Lockton Invoice 0849812, what are the remittance instructions and how should payment be submitted?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 2419 ms

**Sources retrieved:**
- `2025 Lockton Invoice 0849812.pdf` _(pages: 1)_

**Citations (chunk-level):**
- 2025 Lockton Invoice 0849812.pdf chunk=2 (p. 1) rel=1.000
- 2025 Lockton Invoice 0849812.pdf chunk=3 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (2025 lockton invoice 0849812)
- Query focus: In Lockton Invoice 0849812, what are the remittance instructions and how should payment be submitted?
- Matched indexed passages:
- ΓÇªckage 6 - General / 13 - SUBCONTRACTS / TRI STATE CIVIL / Bond / 2025 Lockton Invoice 0849812.pdf Category: invoice Key topics: INVOICE, 0849812, 06/09/2025, 45 Whitney Avenue, 33705293, 07/21/2025, BOFAUS3N SWIFT :, 004832042517 Wire Account #: 026009593 Wire Routing #:, invoiceΓÇª
- (p. 1) ΓÇªvoices: INV 123456/234445/344555* Email remittance to: clientpayments@lockton.com c/o Bank of America PO Box 3207 Boston, MA 02241-3207 Northeast Series of
- (p. 1) ΓÇªvoices: INV 123456/234445/344555* Email remittance to: clientpayments@lockton.com c/o Bank of America PO Box 3207 Boston, MA 02241-3207 Northeast Series of Lockton Companies, LLC Avoid email scams. Call your Lockton account team if you receive a request to change payment details.
```

---

### 🔍 [sq29] — ⏱ 2.3s

**Query:**
> In Lockton Invoice 0849812, what is the total invoiced amount?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 2343 ms

**Sources retrieved:**
- `2025 Lockton Invoice 0849812.pdf` _(pages: 1)_

**Citations (chunk-level):**
- 2025 Lockton Invoice 0849812.pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (2025 lockton invoice 0849812)
- Query focus: In Lockton Invoice 0849812, what is the total invoiced amount?
- Matched indexed passages:
- (p. 1) ΓÇªvoices: INV 123456/234445/344555* Email remittance to: clientpayments@lockton.com c/o Bank of America PO Box 3207 Boston, MA 02241-3207 Northeast Series of
- ΓÇªckage 6 - General / 13 - SUBCONTRACTS / TRI STATE CIVIL / Bond / 2025 Lockton Invoice 0849812.pdf Category: invoice Key topics: INVOICE, 0849812, 06/09/2025, 45 Whitney Avenue, 33705293, 07/21/2025, BOFAUS3N SWIFT :, 004832042517 Wire Account #: 026009593 Wire Routing #:, invoiceΓÇª
```

---

### 🔍 [sq30] — ⏱ 2.0s

**Query:**
> In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 6, 2025 — what were the ticket number, labor hours, and rates?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1960 ms

**Sources retrieved:**
- `Backup for Invoice#01.pdf` _(pages: 4, 1, 2, 3, 5)_

**Citations (chunk-level):**
- Backup for Invoice#01.pdf chunk=5 (p. 4) rel=1.000
- Backup for Invoice#01.pdf chunk=2 (p. 1) rel=1.000
- Backup for Invoice#01.pdf chunk=3 (p. 2) rel=1.000
- Backup for Invoice#01.pdf chunk=4 (p. 3) rel=1.000
- Backup for Invoice#01.pdf chunk=6 (p. 5) rel=1.000

**Answer:**

```
## Detailed Matches (backup for invoice#01)
- Query focus: In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 6, 2025 ΓÇö what were the ticket number, labor hours, and rates?
- Matched indexed passages:
- ΓÇªCrewdays = # of Hours, 0.00 0.00 171 10.69, 25 Cain Drive, KEY WORDS: LEAD ABATEMENT, 806 Foreman, 5 PT OT, DESCRIPTION OF WORK:, rate, work, overtime, hours - Document Purpose: Backup documentation supporting Invoice #01 for Contract #A-37806, covering design-build ADA upgradesΓÇª
- (p. 4) ΓÇªMBER: Burnside Street Station WORK LOCATION: Express track KEY WORDS: LEAD ABATEMENT DATE OF WORK: 12/07/25 DAY OF WORK: Sunday ΓÿÉ CONTRACT ΓÿÉ EXTRA ΓÿÉ T&M Rate Types (F) Foreman Rate (SP) Spray Rate (S) Shift Rate (806) 806 Rate (806PT) 806 Power tool Rate Other (mention): EmployeeΓÇª
- (p. 1) ΓÇª12/6/2025 Sat 88 5.50 6199 12/7/2025 Sun 83 5.19 0.00 0.00 171 10.69 Lead Abatement Work at Burnside Avenue Station Regulartime Overtime Subtotal: Daily Rate Per Crewday: $3,500 $4,200 Subtotal: $0.00 $44,898.00 Total Amount: $44,898.00
- (p. 2) ΓÇªMBER: Burnside Street Station WORK LOCATION: Express track KEY WORDS: LEAD ABATEMENT DATE OF WORK: 12/06/25 DAY OF WORK: Saturday ΓÿÉ CONTRACT ΓÿÉ EXTRA ΓÿÉ T&M Rate Types (F) Foreman Rate (SP) Spray Rate (S) Shift Rate (806) 806 Rate (806PT) 806 Power tool Rate Other (mention): EmployΓÇª
- ΓÇªX (heading ΓåÆ page numbers): of Crewdays = # of Hours [p.1] KEY WORDS: LEAD ABATEMENT [pp.2-4] GENERAL CONTRACTOR: [pp.3-5]
- (p. 3) ΓÇªAND MATERIAL (T&M) LOG SHEET Office: 516-605-1122 GENERAL CONTRACTOR: Work Authorized By (Name): Signature: Date:
```

---

### 🔍 [sq31] — ⏱ 1.8s

**Query:**
> In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 7, 2025 — what were the ticket number, labor hours, and rates?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1801 ms

**Sources retrieved:**
- `Backup for Invoice#01.pdf` _(pages: 4, 1, 2, 3, 5)_

**Citations (chunk-level):**
- Backup for Invoice#01.pdf chunk=5 (p. 4) rel=1.000
- Backup for Invoice#01.pdf chunk=2 (p. 1) rel=1.000
- Backup for Invoice#01.pdf chunk=3 (p. 2) rel=1.000
- Backup for Invoice#01.pdf chunk=4 (p. 3) rel=1.000
- Backup for Invoice#01.pdf chunk=6 (p. 5) rel=1.000

**Answer:**

```
## Detailed Matches (backup for invoice#01)
- Query focus: In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 7, 2025 ΓÇö what were the ticket number, labor hours, and rates?
- Matched indexed passages:
- ΓÇªCrewdays = # of Hours, 0.00 0.00 171 10.69, 25 Cain Drive, KEY WORDS: LEAD ABATEMENT, 806 Foreman, 5 PT OT, DESCRIPTION OF WORK:, rate, work, overtime, hours - Document Purpose: Backup documentation supporting Invoice #01 for Contract #A-37806, covering design-build ADA upgradesΓÇª
- (p. 4) ΓÇªMBER: Burnside Street Station WORK LOCATION: Express track KEY WORDS: LEAD ABATEMENT DATE OF WORK: 12/07/25 DAY OF WORK: Sunday ΓÿÉ CONTRACT ΓÿÉ EXTRA ΓÿÉ T&M Rate Types (F) Foreman Rate (SP) Spray Rate (S) Shift Rate (806) 806 Rate (806PT) 806 Power tool Rate Other (mention): EmployeeΓÇª
- (p. 1) ΓÇª12/6/2025 Sat 88 5.50 6199 12/7/2025 Sun 83 5.19 0.00 0.00 171 10.69 Lead Abatement Work at Burnside Avenue Station Regulartime Overtime Subtotal: Daily Rate Per Crewday: $3,500 $4,200 Subtotal: $0.00 $44,898.00 Total Amount: $44,898.00
- (p. 2) ΓÇªMBER: Burnside Street Station WORK LOCATION: Express track KEY WORDS: LEAD ABATEMENT DATE OF WORK: 12/06/25 DAY OF WORK: Saturday ΓÿÉ CONTRACT ΓÿÉ EXTRA ΓÿÉ T&M Rate Types (F) Foreman Rate (SP) Spray Rate (S) Shift Rate (806) 806 Rate (806PT) 806 Power tool Rate Other (mention): EmployΓÇª
- ΓÇªX (heading ΓåÆ page numbers): of Crewdays = # of Hours [p.1] KEY WORDS: LEAD ABATEMENT [pp.2-4] GENERAL CONTRACTOR: [pp.3-5]
- (p. 3) ΓÇªAND MATERIAL (T&M) LOG SHEET Office: 516-605-1122 GENERAL CONTRACTOR: Work Authorized By (Name): Signature: Date:
```

---

### 🔍 [sq33] — ⏱ 2.1s

**Query:**
> In Invoice#01 dated December 31, 2025, what retainage amounts and net payment due are shown on the G703 continuation sheet?

*Active document context:* `Invoice#01_12-31-2025.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, cost`
- Elapsed: 2054 ms
- route: retrieval=98ms agent=1ms total=531ms

**Sources retrieved:**
- `2025-10-21 Eagle Business Machine Inv# 129318 $43.55 (M017 99-1530).pdf`

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In Invoice#01 dated December 31, 2025, what retainage amounts and net payment due are shown on the G703 continuation sheet?".
Routed focus: documents, cost.
Top files: 2025-10-21 eagle business machine inv# 129318 $43 55.
Evidence snippets:
- 2025-10-21 eagle business machine inv# 129318 $43 55: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 12 - PURCHASE ORDERS / 03 - INVOICES / EAGLE BUSINESS MACHINES / 2025-10-21 Eagle Business Machi
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq34] — ⚡ 531ms

**Query:**
> In GEN-042R00, the A37806 & C49321R Coordination Meeting what was discussed?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents, contracts`
- Elapsed: 531 ms

**Sources retrieved:**
- `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf` _(pages: 1, 2, 3, 4)_

**Citations (chunk-level):**
- A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf chunk=5 (p. 4) rel=6.000
- A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf chunk=6 (p. 4) rel=6.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-042R00, the A37806 & C49321R Coordination Meeting what was discussed?".
Routed focus: documents, contracts.
Top files: a37806 01 30 20 gen-042r00 - fio -.
Evidence snippets:
- a37806 01 30 20 gen-042r00 - fio -: DOCUMENT SUMMARY File / Location: 01 30 20 Project Meetings / a37806 01 30 20 gen-042r00 - fio - Cate
- a37806 01 30 20 gen-042r00 - fio - (p. 1): Workspace Name: A37806-ADA Package 6 Client: Metropolitan Transportation Authority Workspace Status: Open Purpose of Issue: In Review - For Information Only Doc
- a37806 01 30 20 gen-042r00 - fio - (p. 2): 2 Broadway, 8th Floor New York, NY 10004-2207 LETTER OF TRANSMITTAL FROM: MICHAEL WILSON, MBA, CCM Senior Director, PCEO 2 Broadway, B6.131 New York, NY 10004 D
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq35] — ⏱ 2.5s

**Query:**
> What was discussed in the September 3, 2025 coordination meeting?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 2547 ms

**Sources retrieved:**
- `09 A37806 Utility Coordination_September 2025.docx`

**Answer:**

```
## More context needed
- Your question asks what is mentioned in that document but doesn't specify a topic.
- To answer precisely, tell me what you're looking for ΓÇö for example: parties involved, dates, costs, scope, action items, approvals, or a specific subject.
**Possible matching file:** 09 a37806 utility coordination september 2025
- Try asking: _In the 09 a37806 utility coordination september 2025, what [specific topic]?_
```

---

### 🔍 [sq36] — ⏱ 1.4s

**Query:**
> In A37806 Kick Off Pre-Work Conference, what does the document state?

*Active document context:* `A37806 Kick Off Pre-Work Conference MASTER FILE - Final.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1431 ms

**Sources retrieved:**
- `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx`

**Answer:**

```
I could not find an exact indexed passage in a37806 presentation comm kick-off 09 16 2025 r2 that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### 🔍 [sq37] — ⏱ 1.4s

**Query:**
> In A37806 Kick Off Pre-Work Conference, what does the document state about project milestones and work sequencing?

*Active document context:* `A37806 Kick Off Pre-Work Conference MASTER FILE - Final.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `scheduling, communication`
- Elapsed: 1431 ms

**Sources retrieved:**
- `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx`

**Answer:**

```
I could not find an exact indexed passage in a37806 presentation comm kick-off 09 16 2025 r2 that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### 🔍 [sq38] — ⏱ 2.2s

**Query:**
> In the July 24, 2025 Monthly Job Progress Meeting, which MLJ Contracting and TC Electric staff attended and presented?

*Active document context:* `A37806_01 30 20_GEN-029R00 - FIO - Monthly Job Progress Meeting Minutes 07.24.25.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts`
- Elapsed: 2250 ms

**Sources retrieved:**
- `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf` _(pages: 5, 7, 12, 1)_

**Citations (chunk-level):**
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=9 (p. 5) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=13 (p. 7) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=25 (p. 12) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=26 (p. 12) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=2 (p. 1) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=4 (p. 3) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=11 (p. 6) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=14 (p. 7) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the July 24, 2025 Monthly Job Progress Meeting, which MLJ Contracting and TC Electric staff attended and presented?".
Routed focus: contracts.
Top files: a37806 01 31 30 gen-007r00 - fio -.
Evidence snippets:
- a37806 01 31 30 gen-007r00 - fio - (p. 7): July 2025 MLJTC2 Page 5 of 13 Printed: 8/1/2025 SUBMITTAL NUMBER DESCRIPTION DATE SUBMITTED A37806_01 30 20_AVEI-028R00 MTA Signals Avenue I Site Visit 07.16.25
- a37806 01 31 30 gen-007r00 - fio - (p. 12): une 2025 DCB Review 15. July 10, 2025 ΓÇô Community Outreach Canvassing at Middletown Road 16. July 10, 2025 ΓÇô Design Quality Audit Report Discussion 17. July 11,
- a37806 01 31 30 gen-007r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 31 30 Progress Reports / A37806_01 31 30_GEN-007R00 - FIO - Monthly Progres
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq39] — ⏱ 2.2s

**Query:**
> In the July 24, 2025 Monthly Job Progress Meeting, which external consultants from firms such as T.Y. Lin attended?

*Active document context:* `A37806_01 30 20_GEN-029R00 - FIO - Monthly Job Progress Meeting Minutes 07.24.25.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 2239 ms

**Sources retrieved:**
- `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf` _(pages: 12, 5, 7, 8)_

**Citations (chunk-level):**
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=26 (p. 12) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=9 (p. 5) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=13 (p. 7) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=16 (p. 8) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=27 (p. 12) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the July 24, 2025 Monthly Job Progress Meeting, which external consultants from firms such as T.Y. Lin attended?".
Routed focus: documents.
Top files: a37806 01 31 30 gen-007r00 - fio -.
Evidence snippets:
- a37806 01 31 30 gen-007r00 - fio - (p. 7): July 2025 MLJTC2 Page 5 of 13 Printed: 8/1/2025 SUBMITTAL NUMBER DESCRIPTION DATE SUBMITTED A37806_01 30 20_AVEI-028R00 MTA Signals Avenue I Site Visit 07.16.25
- a37806 01 31 30 gen-007r00 - fio - (p. 12): une 2025 DCB Review 15. July 10, 2025 ΓÇô Community Outreach Canvassing at Middletown Road 16. July 10, 2025 ΓÇô Design Quality Audit Report Discussion 17. July 11,
- a37806 01 31 30 gen-007r00 - fio - (p. 12): Con Edison (MC- 846227 Normal / MC- 846237 Reserve) 32. July 24, 2025 ΓÇô Monthly Job Progress Meeting 33. July 28, 2025 ΓÇô Visual Quality Meeting 34. July 28, 202
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq40] — ⏱ 2.3s

**Query:**
> In the May 28, 2026 Monthly Job Progress Meeting Minutes, what is the current status of CPR-003 Revision 2 and the open Burnside Avenue DOT Option Work item?

*Active document context:* `A37806_01 30 20_GEN-143R00 - FIO - Monthly Job Progress Meeting Minutes 05.28.26.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `communication`
- Elapsed: 2324 ms

**Sources retrieved:**
- `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf` _(pages: 3, 8, 14, 15, 16, 2, 12)_

**Citations (chunk-level):**
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=8 (p. 3) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=23 (p. 8) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=24 (p. 8) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=39 (p. 14) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=41 (p. 15) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=42 (p. 15) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=43 (p. 16) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=4 (p. 2) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 01 31 30 gen-024r00 - fio -)
- Query focus: In the May 28, 2026 Monthly Job Progress Meeting Minutes, what is the current status of CPR-003 Revision 2 and the open Burnside Avenue DOT Option Work item?
- Matched indexed passages:
- (p. 3) ΓÇªd NTP is required by end of August to perform the work. 4. Additional DOT Option Work at Burnside (Not in contract) ΓÇô DOT/DEP to provide clarifications and PMC to issue formal CPR. 5. Avenue I Signal Tray Resolution ΓÇô Awaiting MTA direction based on re-route around control area oΓÇª
- (p. 8) ΓÇª20_GEN-142R00 PPM Fire Standpipe 5/28/2026 A37806_01 30 20_GEN-143R00 Monthly Job Progress Meeting Minutes 05.28.26 5/28/2026 A37806_01 32 10_MYR-081R00 Myrtle May 202
- (p. 8) ΓÇª20_GEN-142R00 PPM Fire Standpipe 5/28/2026 A37806_01 30 20_GEN-143R00 Monthly Job Progress Meeting Minutes 05.28.26 5/28/2026 A37806_01 32 10_MYR-081R00 Myrtle May 2026 Construction Photos 5/28/2026 A37806_26 01 00_MYR-015R01 MYR - Normal ConEdison Service Equipment Package 5/28/ΓÇª
- (p. 14) ΓÇªstrian signal relocation pending Master lease comment resolution. ii. Burnside Avenue: PMC to provide date for meeting with DOT. Resubmission emailed to PMC 5/18. iii. Middletown Road: The master lease package is currently being circulated with the DOT Street Lighting Division, aΓÇª
- (p. 15) ΓÇªPage 14 of 24 Printed: 6/1/2026 Item Bid Quantity Current Quantities BURNSIDE AVENUE Remove and replace platform girder top flange angles and secondary members. 15 Tons 19 tons Remove and replace platform girder bottom flange angles and secondary members. 25 Tons 28 tons RepairΓÇª
- (p. 15) ΓÇªLeak & Floor Repairs Awaiting CPRs for: 1. Burnside Ave ΓÇô Additional Option Work Scope 2. Ave I ΓÇô SOGR (Unilateral received) 3. PA Cabinet IPPA Server 4. Norwood Avenue Track Re-design and re-survey
- (p. 16) May 2026 MLJTC2 Page 15 of 24 Printed: 6/1/2026 5. Myrtle Avenue NYCT Duct Bank Interference q. Status of Work Requiring Coordination or Approval of AHJΓÇÖs: Refer to Utility Report (A37806_01 35 70_GEN-017R00 - Utility Coordination ΓÇô May 2026) r. Quality Certifications: a. QualityΓÇª
- (p. 2) ΓÇªer a separate contract. MLJTC2 submitted such recommendation on 01/16/2026. MLJTC2 received revised CPR-003 on 03/26/2026 and is in the process of providing a proposal. This work is adversely delaying the job since AECOMΓÇÖs recommendation is to repair these girders and only afterΓÇª
- (p. 3) 2026. 3. Issues adversely impacting the progress of Work: 1. MOU for Night Work ΓÇô All SWPΓÇÖs approved or in PMCΓÇÖs court for review. Temp Lighting Install in Progress. Ave I, Myrtle & Burnside Approved. Approval for J1 at Norwood is required. 2. Norwood Avenue SOGR (Not in contractΓÇª
- (p. 12) ΓÇªnnections to underground infrastructure and removed OH cable runs. 4. Burnside Avenue ΓÇô ConEdison gas cutover comple
- (p. 16) ΓÇªtation Lead Work Deficiencies from the Weekend Work v. May 28, 2026 ΓÇô Monthly Job Progress Meeting w. May 28, 2026 ΓÇô Quality Meeting x. May 29, 2026 ΓÇô CO #11, #10 & #14 Negotiation Meeting y. Weekly PMC/MLJTC2 Coordination Meeting on Mondays z. Bi-Weekly Visual Quality Meeting onΓÇª
- ΓÇª, NY 10017 [p.2] SUBMITTED [pp.2-18] RECEIVED [p.3] 05/29/2026. [p.3] BURNSIDE AVENUE [pp.4-114] SUBMITTAL NUMBER DESCRIPTION [pp.6-10] A-37806_J-TRACK-13MM- [p.6] MYRTLE [pp.8-116] 06/08/2026. [p.10] AVENUE [pp.12-114] 1/21/2026. [p.13] 6. FDNY: [p.13] ESTIMATED [p.14] DELIVERYΓÇª
```

---

### 🔍 [sq41] — ⏱ 2.3s

**Query:**
> In the May 28, 2026 Monthly Job Progress Meeting, how many Grade Operations have been completed across the project stations, and how are they distributed across Myrtle, Burnside, and Avenue I?

*Active document context:* `A37806_01 30 20_GEN-143R00 - FIO - Monthly Job Progress Meeting Minutes 05.28.26.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 2279 ms

**Sources retrieved:**
- `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf` _(pages: 16, 8, 10, 12)_

**Citations (chunk-level):**
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=44 (p. 16) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=23 (p. 8) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=30 (p. 10) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=34 (p. 12) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=39 (p. 14) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=582 (p. 110) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=38 (p. 13) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=6 (p. 3) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the May 28, 2026 Monthly Job Progress Meeting, how many Grade Operations have been completed across the project stations, and how are they distributed across Myrtle, Burnside, and Avenue I?".
Routed focus: documents, contracts.
Top files: a37806 01 31 30 gen-024r00 - fio -.
Evidence snippets:
- a37806 01 31 30 gen-024r00 - fio - (p. 16): mment Resolution g. May 7, 2026 ΓÇô Burnside Best Fit Comments Meeting h. May 8, 2026 ΓÇô Burnside SOGR Discussion i. May 11, 2026 ΓÇô Prep Phase Meeting #015 ΓÇô Fire
- a37806 01 31 30 gen-024r00 - fio - (p. 8): May 2026 MLJTC2 Page 7 of 24 Printed: 6/1/2026 SUBMITTAL NUMBER DESCRIPTION DATE SUBMITTED A37806_01 35 10_GEN-137R00 SWP-067-Metal Deck Q-Deck Installation 5/2
- a37806 01 31 30 gen-024r00 - fio - (p. 10): lding under SB and NB platforms ~ 90 LF 9. Ennovate - Noise and Vibration monitoring. iii. Norwood Avenue: 1. MFM as of 05/29/2026 is 100% complete with the sew
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq42] — ⏱ 2.0s

**Query:**
> In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what are the open SDI coordination action items and their target completion dates?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1987 ms

**Sources retrieved:**
- `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`

**Citations (chunk-level):**
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=0 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=2 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=4 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=5 (p. ?) rel=1.000

**Answer:**

```
## Detailed Matches (sdi - mlj bi-weekly meeting draft agenda -)
- Query focus: In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what are the open SDI coordination action items and their target completion dates?
- Matched indexed passages:
- ΓÇª5 - MISC ADMIN / MEETINGS / SDI Weekly Status Meetings / SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx Category: meeting_minutes Key topics: DATE: 12/19/2025, ACTION ITEMS, TARGET DATES, 12/19/2025, 12/22/2025, SDI/MLJ, 01/14/2026, 01/09/2026, general, 2025, middletoΓÇª
- ACTION ITEMS -SDI Co-ordination Meeting: SDI Cor-ordination Contract: ADA Upgrades package 6 (A37806- Package 6) Date: 12/19/2025 DATE: 12/19/2025
- ACTION ITEMS Ball In Court
- TARGET DATES General Subcontract SDI 12/19/2025 General OCIP Approval MTA General OCIP and Sub approval for surveyor SDI 12/22/2025 General SWPs and QWPs/CWPs SDI/MLJ 01/14/2026 General Quality Management Plan SDI/MLJ 01/14/2026 General Track TrainingΓÇª
```

---

### 🔍 [sq43] — ⏱ 1.6s

**Query:**
> In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what is the status of OCIP approval and subcontractor approval for the surveyor?

**How the answer was retrieved:**
- Method: Hybrid search — 0 vector + 0 lexical → 0 merged candidates
- Domains routed: `contracts, subcontractor`
- Elapsed: 1633 ms
- hybrid: profile=balanced vector=0 lexical=0 merged=0 restricted=False
- route: retrieval=30669ms agent=0ms total=31818ms

**Sources retrieved:**
- `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`

**Citations (chunk-level):**
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=0 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=5 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=2 (p. ?) rel=1.000

**Answer:**

```
## Detailed Matches (sdi - mlj bi-weekly meeting draft agenda -)
- Query focus: In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what is the status of OCIP approval and subcontractor approval for the surveyor?
- Matched indexed passages:
- ΓÇª5 - MISC ADMIN / MEETINGS / SDI Weekly Status Meetings / SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx Category: meeting_minutes Key topics: DATE: 12/19/2025, ACTION ITEMS, TARGET DATES, 12/19/2025, 12/22/2025, SDI/MLJ, 01/14/2026, 01/09/2026, general, 2025, middletoΓÇª
- TARGET DATES General Subcontract SDI 12/19/2025 General OCIP Approval MTA General OCIP and Sub approval for surveyor SDI 12/22/2025 General SWPs and QWPs/CWPs SDI/MLJ 01/14/2026 General Quality Management Plan SDI/MLJ 01/14/2026 General Track TrainingΓÇª
- ACTION ITEMS -SDI Co-ordination Meeting: SDI Cor-ordination Contract: ADA Upgrades package 6 (A37806- Package 6) Date: 12/19/2025 DATE: 12/19/2025
```

---

### ⏱ [sq44] — ⏱ TIMEOUT 31.8s

**Query:**
> What current permits are submitted for Burnside Ave.

**How the answer was retrieved:**
- Method: Keyword fallback (pgvector + FTS both timed out)
- Domains routed: `documents`
- Elapsed: 31819 ms

**Sources retrieved:**
- `Trans No.51_Steel Rep.Bent 226-227-J4_Burnside.pdf` _(pages: 1, 2)_
- `A37806 CWP-061 - Architectural Wall Installation.docx`
- `A37806_PRDC11-026R00 - AAN - Burnside Temporary Airline Support Drawing Package.pdf` _(pages: 1, 2, 3)_
- `A37806_01 35 10_GEN-056R00 - R&R - SWP-038- Roadway Restoration.pdf` _(pages: 8, 1, 9)_
- `A37806 DSR - 25-06-30 AVI.pdf` _(pages: 2, 1)_
- `A37806 ADA Package 6 - 6 Week Look Ahead 2025-06-02 to 2025-07-13.pdf` _(pages: 1)_
- `SWP 033-WLS Knuckle Boom Use and Rigging Rev0.pdf` _(pages: 2)_
- `A37806_05 12 00_MYR-002R00 - Myrtle Canopy Demo Minicrane Plan.pdf` _(pages: 1, 2, 3)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "What current permits are submitted for Burnside Ave.".
Routed focus: documents.
Top files: trans no 51 steel rep bent 226-227-j4 burnside, no.
Evidence snippets:
- trans no 51 steel rep bent 226-227-j4 burnside: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 30 - ENGINEERING / Burnside Ave / Shop Drawings / Seiko - SOGR and Structural / _superseded / Tr
- no: 23- BURNSIDE AVENUE ENLARGED PLAN DETAILS BUR-A-530- BURNSIDE AVENUE PARTITION TYPES BUR-A-602- BURNSIDE AVENUE LIST OF FINISHES ΓÇô MATERIAL SCHEDULE MYR-A-50
- trans no 51 steel rep bent 226-227-j4 burnside (p. 1): PROJECT: ATTN: REF: DATE: No. Seiko Iron Works, Inc. 79-45 77th Avenue Glendale, New York 11385 718-456-2297 51 Fax: Phone: 718-386-1286 BR2,BR2A,BR2B&BR2C_Stee
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq45] — ⏱ 2.0s

**Query:**
> What current permits are submitted for Ave I.

**How the answer was retrieved:**
- Method: Hybrid search — 0 vector + 0 lexical → 0 merged candidates
- Domains routed: `documents`
- Elapsed: 1956 ms
- hybrid: profile=balanced vector=0 lexical=0 merged=0 restricted=False
- route: retrieval=30637ms agent=0ms total=31988ms

**Sources retrieved:**
- `A37806_01 33 10_AVI-001R00 - FIO - DOT Permits Exp. 05.30.25.pdf`
- `A37806_01 33 10_AVI-002R00 - FIO - Tree Work Permits.pdf`

**Answer:**

```
## AVI Permit Submittals
The following permit-related submittal files are on record for AVI:
- a37806 01 33 10 avi-001r00 - fio -
- a37806 01 33 10 avi-002r00 - fio -
```

---

### ⏱ [sq46] — ⏱ TIMEOUT 32.0s

**Query:**
> What current permits are submitted for Myrtle Ave.

**How the answer was retrieved:**
- Method: Keyword fallback (pgvector + FTS both timed out)
- Domains routed: `documents`
- Elapsed: 31989 ms

**Sources retrieved:**
- `A37806_05 12 00_MYR-002R00 - Myrtle Canopy Demo Minicrane Plan.pdf` _(pages: 1, 2, 3)_
- `A37806_01 10 20_GEN-028R00 - ORIG - EDU05A - (FINAL 100) - Communications and Fire Alarm Long Lead Procurement.pdf` _(pages: 7, 6)_
- `A37806 CWP-061 - Architectural Wall Installation.docx`
- `A37806_01 35 10_GEN-056R00 - R&R - SWP-038- Roadway Restoration.pdf` _(pages: 8, 1, 9)_
- `A37806 DSR - 25-06-30 AVI.pdf` _(pages: 2, 1)_
- `A37806 ADA Package 6 - 6 Week Look Ahead 2025-06-02 to 2025-07-13.pdf` _(pages: 1)_
- `SWP 033-WLS Knuckle Boom Use and Rigging Rev0.pdf` _(pages: 2)_
- `A37806_RFI-0066 - AECOM-RFI036 - PACIS - Clarification for Audio Zones at Myrtle Ave Station.pdf` _(pages: 1, 2)_

**Citations (chunk-level):**
- SWP 033-WLS Knuckle Boom Use and Rigging Rev0.pdf chunk=5 (p. 2) rel=0.600

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "What current permits are submitted for Myrtle Ave.".
Routed focus: documents.
Top files: no, rfi 066.
Evidence snippets:
- no (p. 2): PROJECT: ATTN: REF: DATE: No. Seiko Iron Works, Inc. 79-45 77th Avenue Glendale, New York 11385 718-456-2297 19 Fax: Phone: 718-386-1286 Bailey MC6 Minicrane -
- rfi 066 (p. 1): Request For Information - RFI A37806 ΓÇô Design-Build Services for ADA Upgrades Package 6 Page 1 of 2 Rev. 0 4/21/2025 Subject: PACIS ΓÇô Clarification for Audio Zo
- no (p. 7): Equipment Avenue I Middletown Road Myrtle Ave Norwood Ave Burnside Ave Fire Alarm Control Panel Yes - 1pc (New fire alarm system) Yes - 1pc (Full replacement) Y
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq47] — ⏱ 2.2s

**Query:**
> What current permits are submitted for Middletown Ave.

**How the answer was retrieved:**
- Method: Hybrid search — 72 vector + 0 lexical → 72 merged candidates
- Domains routed: `documents`
- Elapsed: 2153 ms
- hybrid: profile=balanced vector=72 lexical=0 merged=72 restricted=False
- route: retrieval=25403ms agent=1ms total=26806ms

**Sources retrieved:**
- `25.10.28 A37806-MTACD-MLJTC2-L-0117 - Delay ins Submission of Permit doc. & the RFCD Package for EDU2B Structural & Foundation Work ΓÇô MDT.pdf`
- `25.10.28 MTACD-MLJTC2-L-0117 - Delay ins Submission of Permit documents & the RFCD Package for EDU2B Structural & Foundation Work ΓÇô MDT.pdf`
- `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`
- `A37806_01 33 10_MDT-005R00 - ORIG - Middletown Tree Work Permit.pdf`
- `A37806_01 33 10_MDT-007R00 - FIO - DOT Permits Exp. 10.21.25.pdf`
- `A37806_01 33 10_MDT-009R00 - FIO - DOT Permits Exp. 11.30.25.pdf`
- `A37806_01 33 10_MDT-010R00 - FIO- DOT PERMITS EXP 12-31-25.pdf`
- `A37806_01 33 10_MDT-011R00 - FIO - DOT PERMITS EXP 03-13-26.pdf`

**Answer:**

```
## MDT Permit Submittals
The following permit-related submittal files are on record for MDT:
- 25 10 28 a37806-mtacd-mljtc2-l-0117 - delay ins submission
- 25 10 28 mtacd-mljtc2-l-0117 - delay ins submission
- a37806 01 33 10 mdt-005r00 - fio -
- a37806 01 33 10 mdt-005r00 - orig -
- a37806 01 33 10 mdt-007r00 - fio -
- a37806 01 33 10 mdt-009r00 - fio -
- a37806 01 33 10 mdt-010r00 - fio- dot
- a37806 01 33 10 mdt-011r00 - fio -
- a37806 01 33 10 mdt-014r00 - fio -
- a37806 01 33 10 mdt-017r00 - fio -
- a37806 01 33 10 mdt-017r00 - fio -
- mdt we1 permit 05 20 26 1
```

---

### ⏱ [sq48] — ⏱ TIMEOUT 26.8s

**Query:**
> What current permits are submitted for Norwood Ave.

**How the answer was retrieved:**
- Method: Keyword fallback (pgvector + FTS both timed out)
- Domains routed: `documents`
- Elapsed: 26807 ms

**Sources retrieved:**
- `A37806_01 33 00_GEN-013R00 - Submittal Register January 2026.pdf` _(pages: 4)_
- `A37806_01 33 00_GEN-005R00 - FIO - Submittal Register May 2025.pdf` _(pages: 2)_
- `A37806_01 33 10_NOR-002R00 - FIO - DOT Permits Arlington Ave Expiring 05.23.25.pdf`
- `A37806_01 33 10_NOR-010R00 - FIO - Norwood DOT Road Closure Permits Expiring 12.31.2025.pdf`
- `12 RENEWED PERMITS - NORWOOD AVE [26195.MLJ.DOT] EXP 6-1-26.pdf`
- `Permit Filings Estimating - Norwood 2252025.xlsx`
- `A37806_01 33 00_GEN-011R00 - ORIG - Submittal Register November 2025.pdf` _(pages: 5)_
- `A37806_01 33 10_NOR-001R00 - DOT Permits Exp. 05.02.25.pdf`

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "What current permits are submitted for Norwood Ave.".
Routed focus: documents.
Top files: 12 renewed permits - norwood ave [26195 mlj, permit filings estimating - norwood 2252025, no.
Evidence snippets:
- 12 renewed permits - norwood ave [26195 mlj: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 22 - PERMITS & RIGHT OF ENTRY / NYCDOT / Norwood / 12 RENEWED PERMITS - NORWOOD AVE [26195.MLJ.D
- permit filings estimating - norwood 2252025: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / NORWOOD AVE / 6. Permits / DOT / Permit DWGs / Permit Filings Estimating
- no (p. 5): 00 0 Permits and Agency Coordination Norwood Avenue -DOT Master Lease For Information X X Open 1 01 33 10 A37806_01 33 10_NOR-014R00 0 Permits and Agency Coordi
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq49] — ⏱ 2.2s

**Query:**
> In MDT-005R00 Middletown Tree Work Permit, what nursery standards must replacement tree materials meet, and what happens to rejected material on site?

*Active document context:* `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `field_ops`
- Elapsed: 2212 ms
- route: retrieval=141ms agent=1ms total=1932ms

**Sources retrieved:**
- `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf` _(pages: 4, 1)_

**Citations (chunk-level):**
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=15 (p. 4) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=16 (p. 4) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=11 (p. 4) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=2 (p. 1) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=14 (p. 4) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=13 (p. 4) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In MDT-005R00 Middletown Tree Work Permit, what nursery standards must replacement tree materials meet, and what happens to rejected material on site?".
Routed focus: field_ops.
Top files: a37806 01 33 10 mdt-005r00 - fio -.
Evidence snippets:
- a37806 01 33 10 mdt-005r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 33 10 Permits and Agency Coordination / MID STN / A37806_01 33 10_MDT-005R0
- a37806 01 33 10 mdt-005r00 - fio - (p. 4): en disturbed by tree removal must be cleared of fallen branches and restored to original condition. Due to the Asian longhorned beetle (ALB) infestation, the co
- a37806 01 33 10 mdt-005r00 - fio - (p. 1): For NYCT/MTA Review & Comment For NYCT/MTA Approval For Designer Approval For NYCT/MTA Information Only For Designer Information Only Date: Contract Number: Con
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq54] — ⏱ 1.9s

**Query:**
> In BUR-081R00 January 2026 Construction Photos, what work is shown in progress on the Burnside Avenue northbound side on January 20, 2026?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1933 ms
- route: retrieval=102ms agent=0ms total=1605ms

**Sources retrieved:**
- `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf` _(pages: 2)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In BUR-081R00 January 2026 Construction Photos, what work is shown in progress on the Burnside Avenue northbound side on January 20, 2026?".
Routed focus: documents, contracts.
Top files: a37806 01 32 10 bur-081r00 - fio -.
Evidence snippets:
- a37806 01 32 10 bur-081r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 32 10 Contract Schedule Requirements / BUR / A37806_01 32 10_BUR-081R00 - F
- a37806 01 32 10 bur-081r00 - fio - (p. 2): Date Image Number Description 1/20/2026 1 Burnside Ave NB side MPT 1/20/2026 2 Burnside Ave NB side MPT 1/20/2026 3 Burnside Ave NB side MPT 1/20/2026 4 Burnsid
- a37806 01 32 10 bur-081r00 - fio - (p. 2): ess 1/20/2026 16 Burnside Ave NB side demo shielding installation in progress 1/20/2026 17 Burnside Ave NB side demo shielding installation in progress 1/20/202
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq55] — ⏱ 1.6s

**Query:**
> In BUR-081R00 January 2026 Construction Photos, what MPT setup and ConEd utility relocation work is documented at the Burnside Avenue northbound side?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1606 ms

**Sources retrieved:**
- `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf` _(pages: 2)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In BUR-081R00 January 2026 Construction Photos, what MPT setup and ConEd utility relocation work is documented at the Burnside Avenue northbound side?".
Routed focus: documents, contracts.
Top files: a37806 01 32 10 bur-081r00 - fio -.
Evidence snippets:
- a37806 01 32 10 bur-081r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 32 10 Contract Schedule Requirements / BUR / A37806_01 32 10_BUR-081R00 - F
- a37806 01 32 10 bur-081r00 - fio - (p. 2): Date Image Number Description 1/20/2026 1 Burnside Ave NB side MPT 1/20/2026 2 Burnside Ave NB side MPT 1/20/2026 3 Burnside Ave NB side MPT 1/20/2026 4 Burnsid
- a37806 01 32 10 bur-081r00 - fio - (p. 2): ess 1/20/2026 16 Burnside Ave NB side demo shielding installation in progress 1/20/2026 17 Burnside Ave NB side demo shielding installation in progress 1/20/202
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq56] — ⏱ 1.5s

**Query:**
> In BUR-080R00 Burnside December 2025 Construction Photos, what track shielding work was shown?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1507 ms

**Sources retrieved:** _none_

**Answer:**

```
I could not find an exact indexed passage in photo apr 02 2025, 8 12 26 am that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### 🔍 [sq57] — ⏱ 1.5s

**Query:**
> In BUR-080R00 Burnside December 2025 Construction Photos, what MPT setup and shielding installation preparation is documented on the northbound side?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1505 ms
- route: retrieval=138ms agent=0ms total=1538ms

**Sources retrieved:** _none_

**Answer:**

```
I could not find an exact indexed passage in photo apr 02 2025, 8 12 26 am that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### 🔍 [sq58] — ⏱ 1.5s

**Query:**
> In MYR-076R00 Myrtle December 2025 Construction Photos, what ADA accessibility upgrade work is shown in the December 19, 2025 photos at Myrtle Avenue station?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1538 ms
- route: retrieval=95ms agent=1ms total=1532ms

**Sources retrieved:**
- `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf` _(pages: 3, 1)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In MYR-076R00 Myrtle December 2025 Construction Photos, what ADA accessibility upgrade work is shown in the December 19, 2025 photos at Myrtle Avenue station?".
Routed focus: documents, contracts.
Top files: a37806 01 32 10 myr-076r00 - fio -.
Evidence snippets:
- a37806 01 32 10 myr-076r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 32 10 Contract Schedule Requirements / MYR / A37806_01 32 10_MYR-076R00 - F
- a37806 01 32 10 myr-076r00 - fio - (p. 3): 001_MG_0752 - December 19, 2025 09:16:34 MTA C&D Contract A-37806: Design-Build Services for Accessibility Upgrades Package 6: Accessibility Upgrades at Five St
- a37806 01 32 10 myr-076r00 - fio - (p. 1): For NYCT/MTA Review & Comment For NYCT/MTA Approval For Designer Approval For NYCT/MTA Information Only For Designer Information Only Date: Contract Number: Con
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq59] — ⏱ 1.5s

**Query:**
> In MYR-076R00 Myrtle December 2025 Construction Photos, what is the submittal designation — NYCT/MTA information only, approval, or designer review?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1532 ms

**Sources retrieved:**
- `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf` _(pages: 1, 3)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In MYR-076R00 Myrtle December 2025 Construction Photos, what is the submittal designation ΓÇö NYCT/MTA information only, approval, or designer review?".
Routed focus: documents.
Top files: a37806 01 32 10 myr-076r00 - fio -.
Evidence snippets:
- a37806 01 32 10 myr-076r00 - fio -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 32 10 Contract Schedule Requirements / MYR / A37806_01 32 10_MYR-076R00 - F
- a37806 01 32 10 myr-076r00 - fio - (p. 1): For NYCT/MTA Review & Comment For NYCT/MTA Approval For Designer Approval For NYCT/MTA Information Only For Designer Information Only Date: Contract Number: Con
- a37806 01 32 10 myr-076r00 - fio - (p. 3): 001_MG_0752 - December 19, 2025 09:16:34 MTA C&D Contract A-37806: Design-Build Services for Accessibility Upgrades Package 6: Accessibility Upgrades at Five St
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq60] — ⏱ 1.8s

**Query:**
> In the May 13, 2025 Burnside Avenue VECP Presentation, what is the value engineering background — what submissions were made to MTA and what verbal approval was received from NYC DOT?

*Active document context:* `2025-05-13 A37806 Burnside Ave VECP Presentation.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1819 ms

**Sources retrieved:**
- `0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf` _(pages: 1)_

**Citations (chunk-level):**
- 0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf chunk=2 (p. 1) rel=1.000
- 0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf chunk=3 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (0050 - a-37808 (76114) - emd - burnside)
- Query focus: In the May 13, 2025 Burnside Avenue VECP Presentation, what is the value engineering background ΓÇö what submissions were made to MTA and what verbal approval was received from NYC DOT?
- Matched indexed passages:
- ΓÇªation: MLJ-017 Package 6 - General / 10 - TA SERVICES / A&P Request / 2025 / 05 - May 2025 / 0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf Category: correspondence Key topics: 2 Broadway, 26 th Fl. Telephone Number: (646)252-4832/4886/4861/4775, CUSΓÇª
- (p. 1) ΓÇª/4886/4861/4775 New York, NY 10004 EMDContractComplianceWorkOrderMail@Nyct.com CUSTOMER REQUEST INFORMATION ∩é╖ All requests require at least one week advanced notice. Deadline for submitting is before close of business Monday of preceding week. A & P Coverage cannot be guaranteedΓÇª
- (p. 1) ΓÇª_________________________ TO BE COMPLETED BY CONTRACT COMPLIANCE Date Received: ____________________ Assigned to: ___________________________ Date Completed: __________________ Completed by: _________________________ Tracking # ____________________ENT. In Database: ____________ CΓÇª
```

---

### 🔍 [sq61] — ⏱ 1.4s

**Query:**
> In the Burnside Avenue VECP Presentation, what ADA accessibility upgrade scope is being value-engineered and when was the final presentation delivered?

*Active document context:* `2025-05-13 A37806 Burnside Ave VECP Presentation.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1387 ms

**Sources retrieved:**
- `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf` _(pages: 1)_

**Citations (chunk-level):**
- AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf chunk=2 (p. 1) rel=1.000
- AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf chunk=3 (p. 1) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the Burnside Avenue VECP Presentation, what ADA accessibility upgrade scope is being value-engineered and when was the final presentation delivered?".
Routed focus: documents, contracts.
Top files: ak a37806 volume 08a bx burnside ave option.
Evidence snippets:
- ak a37806 volume 08a bx burnside ave option: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 01 - PRE-AWARD PKG / ESTIMATING / 11 Personal / AK / AK_A37806_Volume_08A_BX_Burnside_Ave_Option
- ak a37806 volume 08a bx burnside ave option (p. 1): BUS PAD CURB EXTENSIONS CURB EXTENSION SIDEWALK PEDESTRIAN RAMP (TYP.) BUS PAD LIMIT OF SIDEWALK CONTRUCTION (TYP.) LIMIT OF RESURFACING (TYP.) BASE BID WORK SE
- ak a37806 volume 08a bx burnside ave option (p. 1): AT FIVE STATIONS WITH COMPONENT UPGRADES AT ONE STATION IN THE CITY OF NEW YORK BURNSIDE AVENUE PROPOSED SITE PLAN OPTION ---- M. WEEKS M. QUINN A. FALCONE S. S
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq62] — ⏱ 1.5s

**Query:**
> In PRO 26-01 Control of Project Nonconforming Items, what does the NCR process flowchart show — who are the originator, Contractor QM, PMT QM, and DOR roles?

*Active document context:* `PRO 26-01 Control of Project Nonconforming Items-JS.20260109.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts`
- Elapsed: 1455 ms
- route: retrieval=99ms agent=1ms total=1446ms

**Sources retrieved:**
- `MLJ Projection- Con Ed wingback T&E.xlsx`

**Answer:**

```
I could not find an exact indexed passage in mlj projection- con ed wingback t&e that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### 🔍 [sq63] — ⏱ 1.4s

**Query:**
> In GEN-006R01 NCR Template & Log, what data does PRO 26-01 require in the NCR Log for tracking nonconforming items?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 1446 ms

**Sources retrieved:**
- `A37806_01 40 10_GEN-006R01 - AEAN - NCR Template & Log.pdf` _(pages: 4, 2, 3, 5)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-006R01 NCR Template & Log, what data does PRO 26-01 require in the NCR Log for tracking nonconforming items?".
Routed focus: documents, contracts.
Top files: a37806 01 40 10 gen-006r01 - aean -.
Evidence snippets:
- a37806 01 40 10 gen-006r01 - aean -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / Emmanuel Olagbaiye / STATION BINDER / QWP / A37806_01 40 10_GEN-006R01 -
- a37806 01 40 10 gen-006r01 - aean - (p. 4): Workspace Name: A37806-ADA Package 6 Client: Metropolitan Transportation Authority Workspace Status: Open Purpose of Issue: In Review - For Review & Approval Do
- a37806 01 40 10 gen-006r01 - aean - (p. 5): 2 Broadway, 8th Floor New York, NY 10004-2207 LETTER OF TRANSMITTAL FROM: MICHAEL WILSON, MBA, CCM Senior Director, PCEO 2 Broadway, B6.131 New York, NY 10004 D
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq64] — ⚡ 191ms

**Query:**
> Summarize what is in A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 191 ms

**Sources retrieved:**
- `A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf` _(pages: 1, 2, 3, 4)_

**Answer:**

```
## Section 51.56 (a37806 rfi-0203 - clo - norwood j1 revised)
- Exact indexed section text from page(s): 1, 2, 3, 4.
```text
DOCUMENT SECTION INDEX (heading ΓåÆ page numbers):
A37806 ADA PACKAGE 6 [p.3]
1 Iden╞ƒfied Jamaica (BMT) GOs [pp.4-5]
3 Ac╞ƒon Items [p.5]
Request For Information - RFI
A37806 ΓÇô DESIGN BUILD SERVICES FOR ACCESSIBILITY UPGRADES ΓÇô PACKAGE 6
Page 1 of 2 Rev. 0 5/4/2026
Subject: Norwood J1 Revised Track Limits RFI # 0203
Date: 5/4/2026 From: MLJTC2
Reason for request: ΓÿÆInsufficient Information ΓÿÉEngineering Conflict ΓÿÉAlternate Proposal
ΓÿÆOther: MTA Change in Direction (Change Proposal Request pending)
Probable Cost Effect: ΓÿÆIncrease ΓÿÉDecrease ΓÿÉUnknown
Action Requested: ΓÿÉClarification ΓÿÆDirection ΓÿÉApproval
Probable Time Effect: ΓÿÆIncrease ΓÿÉDecrease ΓÿÉUnknown
Priority ΓÿÆHigh ΓÿÉMedium ΓÿÉLow
Drawing Number: N/A
Detail Number: N/A
CSI Code:
Info. Requested:
Per direction from MTA on 04/27/2026 MOW Track Construction will be performing the replacement
of track J2 on its entirety within the Norwood Avenue Station (See attached email). Also, since the
material for the contractual track J2 work was already procured and delivered, MTA directed MLJTC2
to extend the limits of track replacement on J1 and use the said material to maintain the overall
length of trackwork in the contract. Based on this direction, MLJTC2, AECOM and J-Track require the
following clarifications:
AECOM
Track J1
1. Is there any change to contact rail replacement? Current design shows replacement from Sta
411+04 to Sta 420+04.
2. Confirm limits of heat trace to be installed on J1.
3. Define limits of track J1 replacement. Platform limits are from Sta. 411+51.56 to
rent design shows replacement from Sta
411+04 to Sta 420+04.
2. Confirm limits of heat trace to be installed on J1.
3. Define limits of track J1 replacement. Platform limits are from Sta. 411+51.56 to Sta.
416+50.68, please confirm these limits can be followed for the track replacement.
4. Track J1 best fit needs to be prepared in conjunction with Track J2 best fit(to be designed by
MTA) to ensure top of structural slab at platform is consistent across the length of the
platform. This also needs to be coordinated with elevator and stair landings and door
openings.
a. We request a schedule on when Track J2 best fit will be complete so it can be
coordinated with the current design.
Track J2
1. Confirm MTA will design the contact rail replacement based on track limits.
2. Confirm heat trace will be design by MTA.
3. Confirm best fit of J2 will be done by MTA.
MLJ Notes
1. Can the work within the Norwood Avenue Station happen first? Currently we are scheduled
to perform SOGR/Trackwork on J1/Platform Replacement between June and October, any
Request For Information - RFI
A37806 ΓÇô DESIGN BUILD SERVICES FOR ACCESSIBILITY UPGRADES ΓÇô PACKAGE 6
Page 2 of 2 Rev. 0 5/4/2026
track replacement performed by MTA on J2 within the Norwood Avenue Station will directly
interfere with our work.
2. The existing traction power on tract J2 at approximately 416+00 has already been tempted
out and new jumpers installed. Is this work part of the MTA track replacement or a separate
contract?
TCE
1. Please clarify if Traction power work at Track J2 is removed from ADA Package 6 contract.
2. Please provide limit for traction power scope on Track J1. Current design shows replacement
from Sta. 411+04 to Sta. 420+04.
J-Track
During the survey of the J1 track, it was identified that existing Pandrol plates extend to
approximately Sta. 417+55 (approximately 105 track feet towards Jamaica Center on the J1 platform)
and beyond this point, F21 plates are already in place however it is feasible to terminate the
trackwork at the end of the platform, but due to the 7/8ΓÇ¥ thickness difference between the proposed
F21 plates (1.75ΓÇ¥) and the existing Pandrol plates (0.93ΓÇ¥), a shimmed runoff would be required to
achieve a smooth elevation transition if work is terminated at the platform.
Please note that at this point in time the extend of the delay or cost implications with the extension
beyond the end of the platform are not known. Due to the significan
s terminated at the platform.
Please note that at this point in time the extend of the delay or cost implications with the extension
beyond the end of the platform are not known. Due to the significant schedule impact, MLJTC2
recommends NYCT Track Engineering address any scope beyond contractual limits.
Recommendations
Disclaimer:
Notes:
Attachments Provided ΓÿÆYes ΓÿÉNo
1
Ksenofon Gjerko
From: Jose Paredes <jose.paredes@tylin.com>
Sent: Monday, April 27, 2026 1:46 PM
To: Ksenofon Gjerko; Ravi Jain; Andrew Voss
Cc: Wilson, Michael; Afua.Safo-Asante; Rony, Mohammed; Jack Czyzewski; Mekh Gurung;
Dorra Kridis
Subject: RE: A37806 Norwood Avenue (BMT) Survey Limits Week Of 4/20/26
Good afternoon, Ksenofon.
Please see below official direction from MOW Track Engineering. We will obtain better dates for the Track
J2 in-house trackwork and get back to you.
A37806 ADA Package 6 - Norwood Avenue BMT Track J1 and Track J2 Replacement Limits
Update on Trackwork Limits at A-37806 Norwood Avenue Station ΓÇô Jamaica Line (BMT) Trks J1 & J2
Track J1 (Jamaica-bound):
Due to trackwork on Track J2 being reassigned to in-house forces, the limits previously specified
for Track J2 in the Draft Scope of Required Trackwork , will be realigned to Track J1. As a result, Track J1
will now undergo trackwork /panel replacement on the entire length of the platform.
Track J2 (Manhattan-bound):
Trackwork will be performed by in-house forces and is currently scheduled to take place from May
through October 2026
Jose Paredes, P.E.
CONSTRUCTION COMPLIANCE MANAGER
A37806 ADA PACKAGE 6
From: Ksenofon Gjerko <kgjerko@mljcontracting.com>
Sent: Thursday, April 23, 2026 2:41 PM
To: Jose Paredes <jose.paredes@tylin.com>; rjain <rjain@mljcontracting.com>; Andrew Voss
<AVoss@mljcontracting.
rom: Ksenofon Gjerko <kgjerko@mljcontracting.com>
Sent: Thursday, April 23, 2026 2:41 PM
To: Jose Paredes <jose.paredes@tylin.com>; rjain <rjain@mljcontracting.com>; Andrew Voss
<AVoss@mljcontracting.com>
Cc: Wilson, Michael <michael.wilson@mtacd.org>; Afua.Safo-Asante <afua.safo-asante@mtacd.org>; Rony, Mohammed
<mohammed.rony@mtacd.org>; Jack Czyzewski <jczyzewski@naikgroup.com>; Mekh Gurung
<mgurung@naikgroup.com>; Dorra Kridis <dorra.kridis@tylin.com>
Subject: RE: A37806 Norwood Avenue (BMT) Survey Limits Week Of 4/20/26
Jose,
Today we finished the survey based on the two scenarios you provided us on Friday.
Our first track GO is on 6/20/2026 which is now 7 weeks away. We need a direction on this to properly
prepare and coordinate our work.
ATTACHMENT 1
1
Contract: A37806 ADA Package 6
MTA C&D PCEO: Michael Wilson, Senior Director, Program CEO, MTA C&D ΓÇô Sta╞ƒons Business Unit
Program Management Consultant: Naik TYLin Joint Venture
Design-Builder: MLJTC2 (Design-Builder) and AECOM (Designer-of-Record)
Field Mee╞ƒng: A37806 ADA Package 6 Norwood Avenue (BMT) ΓÇô MOW Track Construc╞ƒon Days
Walkthrough
Prepared By: Jose Paredes
Field Mee╞ƒng Date: May 12, 2026
Field Mee╞ƒng A╞⌐endees: See A╞⌐ached A╞⌐endance Sheet
Field Mee╞ƒng Notes
Item
No Discussion
1 Iden╞ƒfied Jamaica (BMT) GOs
1. Week 20 5/16/2026
2. Week 25 6/20/2026
3. Week 26 6/27/2026
4. Week 28 7/11/2026
5. Week 30 7/25/2026
6. Week 32 8/8/2026
7. Week 33 8/15/2026
8. Week 36 9/5/2026
9. Week 37 9/12/2026
10. Week 40 10/3/2023
∩é╖ MOW Track Construc╞ƒon Days stated that they own Week 20 (5/16/26); Week 26 (6/27/26);
Week 30 (7/25/26); Week 32 (8/8/26) and Week 33 (8/15/16)
∩é╖ Project Team to find out who owns Week 25, 28, 36, 37 and 40.
2 General Discussion
∩é╖ MOW defined the scope as ΓÇ£81 track panel replacementΓÇ¥, N/O Crescent Sta╞ƒon to N/O
Cleveland Sta╞ƒon.
∩é╖ MOW will allow the Project to PB on Week 20.
∩é╖ During Week 20, MOW will be working on the Jamaica side of Track J2; therefore, Project will
only be allowed to install MOU lights on both sides of Track J1, and the Manha╞⌐an side of Track
J2. Project Team will also be allowed to perform the Track J1 and J2 50 States survey within t
```
```

---

### 🔍 [sq65] — ⏱ 1.8s

**Query:**
> In J-TRACK-13A-041R00 Material I&T Request for 100-8 6-hole joint bar, what is the inspection item description, what quantity is requested, and what ASTM standard governs the material?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `field_ops, documents`
- Elapsed: 1840 ms

**Sources retrieved:**
- `A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF` _(pages: 18, 1, 4, 7, 8, 10, 11, 9)_

**Citations (chunk-level):**
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=26 (p. 18) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=2 (p. 1) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=5 (p. 4) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=8 (p. 7) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=9 (p. 8) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=11 (p. 10) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=12 (p. 11) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=10 (p. 9) rel=1.000

**Answer:**

```
## Detailed Matches (a-37806 j-track-13a-041r00 - app - material i&t request)
- Query focus: In J-TRACK-13A-041R00 Material I&T Request for 100-8 6-hole joint bar, what is the inspection item description, what quantity is requested, and what ASTM standard governs the material?
- Matched indexed passages:
- ΓÇª/ 13A TRACK GENERAL / A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF Category: submittal Key topics: 13A-041R00, 0 Manual Submittal, 15 Respo, 03/28/2026, 03/16/2026 01:22 PM, URL: MRN:, 03:15 PM, 03/16/2026, shall, track,ΓÇª
- (p. 18) ΓÇªlows: ΓÇó Track Switch Components ΓÇó Running Rails ΓÇó Ties ΓÇó Tie Plates ΓÇó Joint Bars ΓÇó Bumping Posts ΓÇó Wheel Stops ΓÇó Centering Cups ΓÇó Fiberglass Insulators ΓÇó Insulator Cap
- (p. 1) ΓÇªTA Construction & Development Title & Description Title: Material I&T Request 100-8 (6 Hole) Joint Bar 36'' Detailed Description: A-37806_J-TRACK-13A-041R00 - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs) Submittal Location: Key Information Key information assΓÇª
- (p. 4) ΓÇªpublished. Publish Path: Business Process Docs/Submittal/Material I&T Request 100-8 (6 Hole) Joint Bar 36''/SUBM-000716 Project Team Project CEO: Project Managem ent Consulta nt: Consulta nt Contract Manager: Project Description Description: Record Information Record Number: SUBMΓÇª
- (p. 7) ΓÇªtion Document Type Discipline Issue Date Item Status 001 Material I&T Request 100- 8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs) A-37806_J- TRACK-13A- 041R00 - Material I&T Request 100- 8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs) Other Other 03/13/2026 Not_Review ed Review Response 0 IteΓÇª
- (p. 8) ΓÇª06_J-TRACK-13A-041R00 System Document Type: Other Title: Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs) Revision No.: 0 Description: A-37806_J-TRACK-13A-041R00 - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs) Issue Date: 03/13/2026 03:15 PM (ΓÇª
- (p. 10) ΓÇªFor Designer Information Only Date: Contract Number: Contract Title: Item Description: Submittal No.: Rev.: Spec./ PRDC Ref.: Location (where used): Drawing No.: MLJTC2 PM's Review: MLJTC2 Quality Manager: Number of Pages (Including Cover Sheet): Notes: A37806 Design-Build ServiΓÇª
- (p. 11) C&D REQUEST FOR INSPECTION OF TRACK MATERIALS ALL REQUESTS FOR INSPECTION ARE TO BE SUBMITTED THROUGH, AND SIGNED BY, THE C&D PCEO / CONSTRUCTION MANAGER CONTACT INFORMATION RFI REQUEST: NEW REVISED ( Related RFI No. _____________) ( RC Code No. _____________) PROJECT / CONTRACTΓÇª
- ΓÇªe [p.29] 3.5 Gauge and Flangeway [p.30] 3.7 Superelevation [p.30] 3.9 Joint Bars and Bolts [p.31] FOR TRACKS IN SUBWAY [p.31] 3.11 Rails [p.33] 3.13 Curving Rails [pp.33-34] LOCATION OF [pp.34-35] 3.16 Insulated Track Rail Joints [pp.35-36] 3.17 Adjustable Rail Braces and SeparatΓÇª
- (p. 9) ΓÇªvision No. Size Issue Date A-37806_J-TRACK- 13A-041R00 - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).pdf 3 MB Comment Text Attachments Attachments (0) Linked Records (0) Linked Mail (0) Page 9 of9
- (p. 23) ΓÇªrd Specifications. b. Modified ΓÇ£eΓÇ¥ elastic clips shall be used at all joint bars in 100-8 rail installations. Type ΓÇ£jΓÇ¥ elastic clips shall be used at all joint bars in 115 RE rail installations. 2.16 Under Tie Pads a. Under tie pads (UTPs) shall be CDM-USP-1-07d by Pandrol or appΓÇª
- (p. 37) ΓÇªs, where they will not be installed on two consecutive ties under the joint bar, and will be installed on the next two adjacent ties. The adjustable rail braces shall be fully spiked and secured to the plate with type ΓÇ£eΓÇ¥ elastic clips as shown on the Track Drawings. 3.18 Guard RΓÇª
```

---

### 🔍 [sq66] — ⏱ 2.0s

**Query:**
> In RFI-0115 for the Myrtle Avenue Louver Exhaust Face Velocity issue, what exhaust velocity problem is described and what spec section or direction is referenced?

*Active document context:* `A37806_RFI-0115 - CLO - Louver Exhaust Face Velocity 09.04.25.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1984 ms

**Sources retrieved:**
- `A37806_RFI-0115 - CLO - Louver Exhaust Face Velocity 09.04.25.pdf`

**Answer:**

```
I could not find an exact indexed passage in a37806 rfi-0115 - clo - louver exhaust face that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.
```

---

### 🔍 [sq67] — ⏱ 1.8s

**Query:**
> In RFI098 for the Ave I Conductor Board at Station 489+00, what is the issue with the conductor board on the northbound platform at Track B2 and what drawing is referenced?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1755 ms

**Sources retrieved:**
- `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf` _(pages: 1, 2)_

**Citations (chunk-level):**
- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=2 (p. 1) rel=1.000
- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=3 (p. 1) rel=1.000
- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=4 (p. 2) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 ada p6 rfi098 ave i conductor board)
- Query focus: In RFI098 for the Ave I Conductor Board at Station 489+00, what is the issue with the conductor board on the northbound platform at Track B2 and what drawing is referenced?
- Matched indexed passages:
- (p. 1) ΓÇªUpgrades Package 6 Page 1 of 3 Rev. 0 12/29/2022 Subject: Avenue I ΓÇô Conductor Board at Station 489+00 (Northbound Platform / Track B2) RFI # 098 Date: 12.04.2025 From: AECOM Reason for request: ΓÿÆInsufficient Information ΓÿÉEngineering Conflict ΓÿÉAlternate Proposal ΓÿÉOther: ProbableΓÇª
- ΓÇª17 Package 6 - General / 24 - RFI'S / RFIs FROM AECOM / A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf Category: rfi Key topics: conductor, board, figure, boarding, area, information, request, platform, drawing, a37806 - Document Purpose: Request for Information (RΓÇª
- (p. 1) does not include an ADA boarding area at the ΓÇ£4 CarΓÇ¥ conductor board at Sta 489+00. The ADA Path of Travel drawing (AVI-G-122) from Volume 8.10 similarly shows an ADA boarding area and ADA Path of Travel to it at STA 490+00, but does not show a boarding area, or an ADA Path of TrΓÇª
- (p. 2) ΓÇªes for ADA Upgrades Package 6 Page 2 of 3 Rev. 0 12/29/2022 Figure 1: Conductor board at approximately Sta 490+00 Figure 2: Conductor board at Sta 489+00 Figure 3: Conductor board for 4 car train at Sta 489+00 Disclaimer:
```

---

### 🔍 [sq68] — ⏱ 1.7s

**Query:**
> In RFI098 for the Ave I Conductor Board, what figures are provided showing the conductor board conditions at Station 489+00 and approximately Station 490+00?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1735 ms

**Sources retrieved:**
- `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf` _(pages: 1)_

**Citations (chunk-level):**
- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In RFI098 for the Ave I Conductor Board, what figures are provided showing the conductor board conditions at Station 489+00 and approximately Station 490+00?".
Routed focus: documents.
Top files: a37806 ada p6 rfi098 ave i conductor board.
Evidence snippets:
- a37806 ada p6 rfi098 ave i conductor board: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 24 - RFI'S / RFIs FROM AECOM / a37806 ada p6 rfi098 ave i conductor board Cate
- a37806 ada p6 rfi098 ave i conductor board (p. 1): Request For Information - RFI A37806 ΓÇô Design-Build Services for ADA Upgrades Package 6 Page 1 of 3 Rev. 0 12/29/2022 Subject: Avenue I ΓÇô Conductor Board at Sta
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq69] — ⏱ 1.5s

**Query:**
> In A37806 RFI096, what are the northbound and southbound platform stair and exit configurations shown on the referenced drawings?

*Active document context:* `A37806_ADA P6_RFI096.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1511 ms

**Sources retrieved:**
- `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf` _(pages: 23, 1, 6, 7)_

**Citations (chunk-level):**
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=68 (p. 23) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=2 (p. 1) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=19 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=26 (p. 7) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=3 (p. 1) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=14 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=16 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=18 (p. 6) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 rfi-0042 - clo - coordination with contract)
- Query focus: In A37806 RFI096, what are the northbound and southbound platform stair and exit configurations shown on the referenced drawings?
- Matched indexed passages:
- (p. 23) ΓÇªI I I I I I I.JJ -J l I I I I I I I I I I I I / I I I NORTHBOUND AND SOUTHBOUND PLATFORM PLAN SCALE: 1"= 50'-0" ft CONSTRUCTION w & DEVELOPMENT 0 25 50 FT CONTRACT W-4 7032 PS LA NEXPAND PARTIAL TO FULL PSLAN EQUIPMENT & CONDUIT LAYOUT AT NORWOOD AVE. DRAWN BY I I I I I I I A. CΓÇª
- ΓÇªFolder / 00 Systems / 01 Comms / 03 Comm Drawings / 01 Norwood Ave / A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf Category: contract Key topics: QUEENS, CLEVELAND ST, KOSCLUSKO AV, NO T TO SC ALE, DRAWING INDEX, GENERAL FIBER OPTICSΓÇª
- ΓÇªBATTERY [p.22] 8 CONSTRUCTION CHE CKED BY M. IVKOVJC [p.22] UNDER THE PLATFORM [p.23] DESIG NED BY O.VIONG P.E. [p.23] 12-STRANO SMF BREAKOUT CABLE IN [p.24] PLATFORM ME ZZ ANINE COMM ROOM MR-088 [p.25] REVISION D ESCR I PT ION DATE APPROVED [p.26] DE VI CE NA MIN G CONVE NTION :ΓÇª
- (p. 1) ΓÇª9522 Project Manager: Safo-Asante, Afua / (929) 371-6077 Project PSE: A37806 Program Director: Shah, Jaymin / (516) 732-1707 PCEO: Wilson, Michael / (646) 279- 1741 Construction Manager: Safo-Asante, Afua / (929) 371-6077 Project Status: Active Project Phase: Design/Definition (0ΓÇª
- (p. 6) ΓÇªNGS TO COMBINE CABLE RUNS. NO PULL BOXES SHALL BE INSTALLED UNDER THE PLATFORM AND ALL CABLE RUNS SHALL BE CONTINUOUS WITHOUT SPLICES. 33. ALL EQUIPMENT SHALL BE INSTALLED TO PERMIT EASY ACCESS FOR OPERATION AND MAINTENANCE. 34 . A MINIMUM HEIGHT CLEARANCE OF 80 INCHES MUST B
- (p. 7) ΓÇªS TO COMBINE CABLE RUNS . NO PULL BOX ES SHALL BE INSTALLED UNDER THE PLATFORM AND ALL CABLE RUNS SHALL BE CONTINUOUS WITHOUT SPLICES . 29. ALL EQUIPMENT SHALL BE INSTALLED TO PERMIT EASY ACCESS FOR OPERATION AND MAINTENAN CE . 30. A MINIMUM HEIGHT CLEARANCE OF 80 INCHES MUST BEΓÇª
- (p. 1) ΓÇªtion of new stairs and elevator shafts to be performed under contract A37806. In order to evaluate any potential equipment and wiring relocations, please provide the following information for contract W47032 for Norwood Ave. (MR-088) and Myrtle Ave. (MR-097) stations: 1. UpdatedΓÇª
- (p. 6) ΓÇªSION LIMITS. WHENEVER COMMUNICATIONS EQUIPMENT CANNOT BE INSTALLED AS SHOWN ON THE CONTRACT DRAWINGS, THE CONTRACTOR SHALL SUBMIT FOR APPROVAL AN ALTERNATE WAY OF INSTALLING THEM, 5. ALL CONDUITS AND HARDWARE SHALL BE PAINTED SAME COLOR OF SURROUNDING SURFACES. 6. UNLESS OTHERWISΓÇª
- (p. 6) ΓÇªHERWISE STATED, ALL CABLE AND CONDUIT INSTALLATIONS IN PROXIMITY OF A PLATFORM AREA SHALL BE DONE ON THE TRACK SIDE OF THE PLATFORM LIGHT FIXTURE. 13. ALL EQUIPMENT AND SURFACES DAMAGED IN THE COURSE OF WORK SHALL BE RESTORED TO A STATE OF GOOD REPAIR BY THE CONTRACTOR, A
- (p. 6) ΓÇªLL" IS IMPLICIT IN ALL DRAWINGS WHERE NEW EQUIPMENT AND/OR CABLING IS SHOWN. 21. THE APPROXIMATE LOCATION OF THE ACCESS NODES/APPLICATION NODES ARE SHOWN ON THE DRAWINGS. THE CONTRACTOR SHALL NOT CHANGE THE GENERAL LOCATION OF THE UNIT WITHOUT APPROVAL. 22 . !_CC SHALL SURVEY THEΓÇª
- (p. 7) ΓÇªSION LIMITS. WHENEVER COMMUNICATIONS EQUIPMENT CANNOT BE INSTALLED AS SHOWN ON THE CONTRACT DRAWINGS, ICC SHALL SUBMIT FOR APPROVAL AN ALTERNATE WAY OF INSTALLING THEM. 6. ALL CONDUITS AND HARDWARE SHALL BE PAINTED SAME COLOR OF SURROUNDING SURFACES. 7. UNLESS OTHERWISE STATED, IΓÇª
- (p. 7) ΓÇªERWISE STATED, ALL CABLE AND CONDUIT INSTALLATIONS IN PRO XIMITY OF A PLATFORM AREA SHALL BE DONE ON THE TRACK SIDE OF THE PLATFORM LIGHT FIXTURE. 14 . ALL EQUIPMENT AND SURFACES DAMAGED IN THE COURSE OF WORK SHALL BE RESTORED TO A STATE OF GOOD REPAIR BY ICC, AT NO ADDITIONAL EXΓÇª
```

---

### 🔍 [sq70] — ⏱ 1.3s

**Query:**
> In A37806 RFI096, what ADA upgrade drawing and platform detail is referenced for the McDonald Avenue station?

*Active document context:* `A37806_ADA P6_RFI096.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1280 ms

**Sources retrieved:**
- `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf` _(pages: 1, 6, 2, 7, 14, 16)_

**Citations (chunk-level):**
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=2 (p. 1) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=17 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=4 (p. 2) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=15 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=16 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=23 (p. 7) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=24 (p. 7) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=47 (p. 14) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 rfi-0042 - clo - coordination with contract)
- Query focus: In A37806 RFI096, what ADA upgrade drawing and platform detail is referenced for the McDonald Avenue station?
- Matched indexed passages:
- ΓÇªFolder / 00 Systems / 01 Comms / 03 Comm Drawings / 01 Norwood Ave / A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf Category: contract Key topics: QUEENS, CLEVELAND ST, KOSCLUSKO AV, NO T TO SC ALE, DRAWING INDEX, GENERAL FIBER OPTICSΓÇª
- (p. 1) ΓÇª9522 Project Manager: Safo-Asante, Afua / (929) 371-6077 Project PSE: A37806 Program Director: Shah, Jaymin / (516) 732-1707 PCEO: Wilson, Michael / (646) 279- 1741 Construction Manager: Safo-Asante, Afua / (929) 371-6077 Project Status: Active Project Phase: Design/Definition (0ΓÇª
- ΓÇªINDEX (heading ΓåÆ page numbers): REVISION [pp.1-21] NORWOOD AVE. [p.1] DRAWING NO. [p.2] NO T TO SC ALE [p.3] 53 091-TN-101 PSLAN EQUIPMENT AND CONDUIT P.F. LAYOUT AT ALABAMA AVE [p.4] 6 LCD-TN-601 TYPICAL CONNECTION DETAILS PSLAN ACCESS NODES 66 094-TN-102 PSLAN EQUIPMENT AND CONΓÇª
- (p. 6) ΓÇªICC SHALL COMPLY WITH ALL GUIDELINES IN LANDMARK STATIONS. 16. AS PER ADA REQUIREMENTS, A MINIMUM HEADROOM OF BO INCHES SHALL BE MAINTAINED ABOVE ALL WALKING SURFACE. INCLUDING WALLS, CORRIDORS, AISLES AND PASSAGEWAYS. 17. ALL THROUGH PENETRATIONS SHALL BE PROTECTED BY AN APPROVEΓÇª
- (p. 2) ΓÇªmate Cost Initial Estimate Time days Due Date 04/15/2025 Priority Low Drawing No. NA Detail No. NA CSI Code 00 None Location Non Location Specific Other Ref. Recommendati on Notes Sub Ref# Response By Neha Modak, T. Y. Lin International Response On 04/10/2025 Response 1. UpdatedΓÇª
- (p. 6) ΓÇªWHEN ENTERING THE COMMUNICATIONS ROOM. UNLESS OTHERWISE STATED, WHERE DRAWINGS SHOW CONDUIT R
- (p. 6) ΓÇªWHEN ENTERING THE COMMUNICATIONS ROOM. UNLESS OTHERWISE STATED, WHERE DRAWINGS SHOW CONDUIT RUN INTO COMMUNICATIONS ROOM, CONTRACTOR SHALL CORE DRILL INTO COMMUNICATIONS ROOM FROM STATION AREA FOR ALL CONDUITS. 11. CORE DRILL WALLS AND FLOORS AS REQUIRED AND AS APPROVED TO PERMITΓÇª
- (p. 7) ΓÇªWHEN ENTERING THE COMMUNICATIONS ROOM. UNLESS OTHERWISE STATED, WHERE DRAWINGS SHOW CONDUIT RUN INTO COMMUNICATIONS ROOM, ICC SHALL CORE DRILL INTO COMMUNICATIONS ROOM FROM STATION AREA FOR ALL CONDUITS
- (p. 7) EN ENTERING THE COMMUNICATIONS ROOM. UNLESS OTHERWISE STATED, WHERE DRAWINGS SHOW CONDUIT RUN INTO COMMUNICATIONS ROOM, ICC SHALL CORE DRILL INTO COMMUNICATIONS ROOM FROM STATION AREA FOR ALL CONDUITS. 12. CORE DRILL WALLS AND FLOORS AS REQUIRED AND AS APPROVED TO PER MIT PASSAGΓÇª
- (p. 14) ΓÇªF PORTS DEVICE TYPE - SM FIBER CABLE --- CAT6 PATCH CORD f-- BULKHEAD ADAPTOR ----( FO PATCH CORD Fn,m FIBER STRANDS ΓÇón,m FPP FIBER PA T CH PANEL M<gl"'-'-""[r "''"' ues-m, A - FIRS T SW ITCH B - SEC ON D SWITCH WD - IT WATCHDOG UPS - UPS APN NUMBER AN NUMBER .________ APPLI CATIΓÇª
- (p. 16) ΓÇª.91..0C. / ./ 1 /toC ECf" PLATr. !E'lo<S LOCAL TRACI< TO CONEY ISL┬╗ID PLATFORM LEVEL SCALE 0 25 50 DATE APPROVED ft CONSTRUCTION w & DEVELOPMENT MTA ProjectWise -> W47032-D\Locatlon Common Details\Modeis & Oraw i ngs\com\fo\Sheets\W74032-LCD-TN -61 0 100 FT CONTRACT W-47032 PSLANΓÇª
- (p. 1) ΓÇªtion of new stairs and elevator shafts to be performed under contract A37806. In order to evaluate any potential equipment and wiring relocations, please provide the following information for contract W47032 for Norwood Ave. (MR-088) and Myrtle Ave. (MR-097) stations: 1. UpdatedΓÇª
```

---

### 🔍 [sq71] — ⏱ 1.3s

**Query:**
> In MYR-002R00 Myrtle Avenue Demo Shield Drawings, what construction details and shielding elements are shown in the enlarged section views, and what platform-level steel connections are specified?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1310 ms

**Sources retrieved:**
- `A37806 Platf Edge Myrtle Ave 20241113.pdf` _(pages: 1, 2)_

**Citations (chunk-level):**
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=2 (p. 1) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=3 (p. 1) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=7 (p. 2) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=8 (p. 2) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=6 (p. 1) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 platf edge myrtle ave 20241113)
- Query focus: In MYR-002R00 Myrtle Avenue Demo Shield Drawings, what construction details and shielding elements are shown in the enlarged section views, and what platform-level steel connections are specified?
- Matched indexed passages:
- ΓÇª- Document Purpose: Topographic survey drawing for platform edge at Myrtle Avenue station, part of Package 6 for ADA accessibility upgrades at 5 NYC subway stations under Contract A-37806. - Location: Borough of Brooklyn, Myrtle Avenue station, track level; references matchlineΓÇª
- (p. 1) ΓÇªT FOR CONSTRUCTION BOROUGH OF BROOKLYN TRACK LEVEL TOPOGRAPHIC SURVEY MYRTLE AVENUE V - 005 6 DRAFT $DA PRINT AS OF DRAWN BY
- (p. 1) ΓÇªT FOR CONSTRUCTION BOROUGH OF BROOKLYN TRACK LEVEL TOPOGRAPHIC SURVEY MYRTLE AVENUE V - 005 6 DRAFT $DA PRINT AS OF DRAWN BY APPROVED BY DESIGNED BY CHECKED BY $DESIGN$FILE$EXPANDED$SPEC$ REVISION APPROVED DATE DESCRIPTION REVISIONS ENGINEER/ARCHITECT SHALL AFFIX TO THE DRAWINΓÇª
- (p. 2) ΓÇªT FOR CONSTRUCTION BOROUGH OF BROOKLYN TRACK LEVEL TOPOGRAPHIC SURVEY MYRTLE AVENUE V - 005 6 DRAFT DRAFT ΓÇô NOT FOR CONSTRUC
- (p. 2) ΓÇªT FOR CONSTRUCTION BOROUGH OF BROOKLYN TRACK LEVEL TOPOGRAPHIC SURVEY MYRTLE AVENUE V - 005 6 DRAFT DRAFT ΓÇô NOT FOR CONSTRUCTION T O Q U EE N S B O A RD N A M E B O A RD N A M E B O A RD N A M E B O A RD N A M E B O A RD N A M E B O A RD N A M E B O A RD N A M E B O A RD N AΓÇª
- (p. 1) ΓÇªTE SEE SHEET V-005 FOR TRACK SURVEY PLATFORM LEVEL TOPOGRAPHIC SURVEY MYRTLE AVENUE DRAFT PLATFORM IMPROVEMENT AREA
- ΓÇª: REVISION APPROVED DATE DESCRIPTION [pp.1-2] SEE DWG NO. V - 004 FOR PLATFORM LEVEL SURVEY [pp.1-2] BOROUGH OF BROOKLYN [p.1] SEE SHEET V-005 FOR TRACK SURVEY [p.1]
```

---

### 🔍 [sq72] — ⏱ 1.6s

**Query:**
> In drawing MYR-A-444A, what stainless steel panel and signage details are shown for the EL1121/EL1122 elevator enclosures at Myrtle Avenue station?

*Active document context:* `MYR-A-444A.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1632 ms

**Sources retrieved:**
- `Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf`

**Citations (chunk-level):**
- Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf chunk=0 (p. ?) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In drawing MYR-A-444A, what stainless steel panel and signage details are shown for the EL1121/EL1122 elevator enclosures at Myrtle Avenue station?".
Routed focus: documents.
Top files: myrtle expansion joint pages from 8 03 -.
Evidence snippets:
- myrtle expansion joint pages from 8 03 -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 01 - PRE-AWARD PKG / ESTIMATING / 11 Personal / AK / Specs / Myrtle Expansion Joint Pages from 8
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq73] — ⏱ 1.7s

**Query:**
> In RFI-0116 for the Myrtle Avenue PS LAN followup, what telecommunications coordination issue is addressed and what direction was given to the contractor?

*Active document context:* `A37806_RFI-0116 -Follow-up to RFI 0057 Myrtle Ave PS LAN coordination - Attendance report 9-09-25.csv`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, documents`
- Elapsed: 1713 ms

**Sources retrieved:**
- `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf` _(pages: 6, 2, 22, 21)_

**Citations (chunk-level):**
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=18 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=4 (p. 2) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=17 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=66 (p. 22) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=63 (p. 21) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=20 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=71 (p. 24) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In RFI-0116 for the Myrtle Avenue PS LAN followup, what telecommunications coordination issue is addressed and what direction was given to the contractor?".
Routed focus: contracts, documents.
Top files: a37806 rfi-0042 - clo - coordination with contract.
Evidence snippets:
- a37806 rfi-0042 - clo - coordination with contract (p. 1): Project Details Planning Number: BL01-9522 Project Manager: Safo-Asante, Afua / (929) 371-6077 Project PSE: A37806 Program Director: Shah, Jaymin / (516) 732-17
- a37806 rfi-0042 - clo - coordination with contract: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 02 - DESIGN / AECOM-MLJ Shared Folder / 00 Systems / 01 Comms / 03 Comm Drawings / 03 Myrtle Ave
- a37806 rfi-0042 - clo - coordination with contract (p. 6): ATFORM AREA SHALL BE DONE ON THE TRACK SIDE OF THE PLATFORM LIGHT FIXTURE. 13. ALL EQUIPMENT AND SURFACES DAMAGED IN THE COURSE OF WORK SHALL BE RESTORED TO A S
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq74] — ⚡ 201ms

**Query:**
> In RFI-009 for Myrtle Avenue UPS Backup Requirements, what UPS capacity is required to support existing and new communications systems, including the future use reserve?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 201 ms

**Sources retrieved:**
- `806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf` _(pages: 1)_

**Citations (chunk-level):**
- 806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf chunk=2 (p. 1) rel=1.000
- 806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf chunk=4 (p. 1) rel=1.000

**Answer:**

```
## Section 7.5 (806-rfi-009 - myrtle avenue ups backup requirements)
- Exact indexed section text from page(s): 1.
```text
TCE, LLC
1010 Northern Blvd., Suite 203
Great Neck, New York 11021
P: +16468136400
Project: A37806 ADA Package 6
235 W 23rd st
New York, New York 10011
RFI #806-RFI-009: Myrtle Avenue UPS Backup Requirements
Revision 0 Status Open
To Andy Lau (TCE, LLC)
Jesse Deariso (TCE, LLC)
Nicholas Zito (TCE, LLC)
From Nicholas Zito (TCE, LLC)
New York
Date Initiated Sep 30, 2025 Due Date Oct 15, 2025
Location (MR-097) Myrtle Ave
Schedule Impact TBD
Spec Section 27 33 01 - Equipping Communications Rooms for
Network Applications(19CR)
Drawing Number
Linked Drawings
Copies To Chaka Berthe (TCE, LLC), Aridia Cruz (TCE, LLC),
Arash Hashemkhani (TCE, LLC), Nicholas Zito
(TCE, LLC)
Reason For
Request
Engineering Conflict Probable Cost
Effect
Increase
Action Requested Direction RFI Priority High
Send To (A058) MTA
Activity
Question Question from Nicholas Zito TCE, LLC on Tuesday, Sep 30, 2025 at 12:41 PM EDT
During the UPS replacement workshop held with MTA C&D on 9/23/2025, MTA requested to provide 4-hour backup power for
Comm Room MR097, instead of the 2-hour backup power as requested in the PRDC.
PRDC01 - 1.7.15.5 states: "Design-Builder to replace an existing UPS power plant system to support the full load from both
existing and new communications systems, plus an additional 40% or higher of its capacity available for future use. Ensure
that the existing and the new communicat
m to support the full load from both
existing and new communications systems, plus an additional 40% or higher of its capacity available for future use. Ensure
that the existing and the new communications systems and supporting systems can operate at full load for two (2) hours. The
UPS shall provide backup at full load for both the communications systems and the HVAC systems for the cabinets that the
communications equipment is located two (2) of the HVAC units on each of the Data and PA cabinets. Refer to station specific
sections for more information regarding existing system."
PRDC01 - 1.23.7.B.1 states: "Replace existing Benning Power Plant (UPS backup) system with new power plant (UPS
backup) system."
PRDC07 - 7.5.2.C.1 states: "The communications systems require UPS backup so that both the existing and new systems
can operate at full load (IMMEDIATELY UPON LOSS OF INPUT POWER TO UPS) or the following duration:
1. Two hours (120 minutes) in communications rooms unless otherwise noted.
Please note that 4-hour backup is not required or noted in the above PRDC sections above regarding UPS backup
requirements for Myrtle Avenue station.
Finally, backing up the communication room UPS for 4-hours, rather than 2-hours, would increase the final number of battery
strings in the room by 1 string which, due to the existing VHF UPS cabinet, brings the total amount of lead-acid battery
PS for 4-hours, rather than 2-hours, would increase the final number of battery
strings in the room by 1 string which, due to the existing VHF UPS cabinet, brings the total amount of lead-acid battery strings
in the room to 7. This would bring the total electrolyte gallons for the room to be over 50 gallons, exceeding NFPA 1 ┬º608.1
requirements, now requiring a hydrogen detection tied to the communication room's existing exhaust fan per IFC 1207.6.1
requirements.
Please advise if the Design-Builder is to follow PRDC requirements or to provide a 4-Hour back up to this communication
room's UPS.
Awaiting an Official Response
TCE, LLC Page 1 of 1 Printed On: Sep 30, 2025 03:27 PM EDT
```
```

---

### 🔍 [sq75] — ⏱ 1.4s

**Query:**
> In GEN-096R04 SWP-016 for Elevator Steel and Enclosure, what is the submittal package response due date and what spec section 01 35 10 information is on the cover sheet?

*Active document context:* `A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1414 ms

**Sources retrieved:**
- `A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf` _(pages: 13, 14, 16)_

**Citations (chunk-level):**
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=14 (p. 13) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=15 (p. 13) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=18 (p. 14) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=19 (p. 14) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=20 (p. 14) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=24 (p. 16) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=26 (p. 16) rel=1.000

**Answer:**

```
## Section 3.1 Requirements Summary (swp 016 - elevator steel & enclosure)
- Reviewed indexed section evidence from page(s): 13, 14, 16.
- Key requirements captured from the section:
- Submittal Response Sheet A-37806 ADA Package 6.
- SAFE WORK PLAN SWP ΓÇô 016 ΓÇô MID (Day) SWP-016 Elevator Steel & Enclosure Rev.3 03/10/26 ΓÇô Day with Crane - Middletown STEP RISK PREVENTION/MITIGATION COMMENT 1.
- ΓÇó Photo I.D required on MTA property ΓÇó PPE.
- Ye Injuries ΓÇó For specific tasks, workers will also use other PPE as needed, such as safety glasses, earplugs, earmuffs, gloves, face shields, and respirators (medically cleared and fit tested) ΓÇó Appropriate work attire, including work gloves and footwear (...
- SAFE WORK PLAN SWP ΓÇô 016 ΓÇô MID (Day) SWP-016 Elevator Steel & Enclosure Rev.3 03/10/26 ΓÇô Day with Crane - Middletown STEP RISK PREVENTION/MITIGATION COMMENT 2.
- MTA flaggers will set up on track before the workers access tracks and install bumper blocks and 3rd rail alarm boxes, with appropriate PPE consisting of proper rated rubber gloves and leather gloves).
- ΓÇó Refer to Step #1 above for PPE and ID requirements.
- ΓÇó Proper use of portable ladders and any work done over 6' or the potential to fall more than 6' will be done with a fall arrest system in place tied off to the proper anchor point.
### 3.1.1. Submittals
- Response Sheet A-37806 ADA Package 6: Accessibility Upgrades at Five Stations Submittal No.: A37806_01 35 10_GEN-096 Revision No.: 4 Date: 06/04/26 Status: FOR APPROVAL MLJTC2 Response to PMC Comments:.
- SAFE WORK PLAN SWP ΓÇô 016 ΓÇô MID (Day) SWP-016 Elevator Steel & Enclosure Rev.4 06/02/26 ΓÇô Day with Crane - Middletown SECTION 1 ΓÇô General Information Contract / Project Description: A37806 - Design-Build Services for ADA Upgrades Package 6 SWP No.: 016 Gener...
- Equipment will be listed in SWP for respective work.
- Liebherr 1350-6.1/1050-3.1 Liebherr ΓÇô 1055-3.1 Work Train, Work Train Crane, Boom Truck, Crane & Telehandler, Demo Saw, Walk behind Saw, Manlift, Hand tools, Ladder, power tools and rail carts can be expected.
- SECTION 2 ΓÇô Development Team Prepared By: Position/Title Date Reviewed By: Position/Title Date Thomas Buchta CSM 06/02/26 Michael Colletti Safety Director 06/02/26 SECTION 3 ΓÇô Competent Person(s) Assigned Competent Person Discipline Competent Person Discipl...
- SAFE WORK PLAN SWP ΓÇô 016 ΓÇô MID (Day) SWP-016 Elevator Steel & Enclosure Rev.3 03/10/26 ΓÇô Day with Crane - Middletown STEP RISK PREVENTION/MITIGATION COMMENT 1.
- Areas.
- Ye Injuries ΓÇó For specific tasks, workers will also use other PPE as needed, such as safety glasses, earplugs, earmuffs, gloves, face shields, and respirators (medically cleared and fit tested) ΓÇó Appropriate work attire, including work gloves and footwear (...
- N of five (5) feet or more.) ΓÇó All workers prior to wearing respiratory and hearing protection will be trained in the proper wearing/use of respirators and hearing protection.
- SAFE WORK PLAN SWP ΓÇô 016 ΓÇô MID (Day) SWP-016 Elevator Steel & Enclosure Rev.3 03/10/26 ΓÇô Day with Crane - Middletown STEP RISK PREVENTION/MITIGATION COMMENT 2.
- Ctions from MTA Flaggers ΓÇó Cell Phones and Electronic Devices are PROHIBITED from being used while working on the ROW.
- Rolling Nolan carts shall be utilized to carry smaller items.
- Tion Safety Requirements.
Evidence: swp 016 - elevator steel & enclosure (p. 13, 14, 16).
```

---

### ⚡ [sq76] — ⚡ 207ms

**Query:**
> Summarize SWP-016

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents, contracts`
- Elapsed: 207 ms
- route: retrieval=117ms agent=1ms total=1640ms

**Sources retrieved:**
- `SWP 016 + Attachment.pdf` _(pages: 1, 2, 3, 4)_

**Citations (chunk-level):**
- SWP 016 + Attachment.pdf chunk=2 (p. 1) rel=1.000
- SWP 016 + Attachment.pdf chunk=3 (p. 2) rel=1.000
- SWP 016 + Attachment.pdf chunk=7 (p. 3) rel=1.000
- SWP 016 + Attachment.pdf chunk=10 (p. 4) rel=1.000
- SWP 016 + Attachment.pdf chunk=13 (p. 5) rel=1.000
- SWP 016 + Attachment.pdf chunk=16 (p. 6) rel=1.000
- SWP 016 + Attachment.pdf chunk=20 (p. 7) rel=1.000
- SWP 016 + Attachment.pdf chunk=24 (p. 8) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "Summarize SWP-016".
Routed focus: documents, contracts.
Top files: swp 016 + attachment.
Evidence snippets:
- swp 016 + attachment: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / Ahmed Murshed / swp 016 + attachment Category: safety Key topics: ST
- swp 016 + attachment (p. 1): SAFE WORK PLAN SWP ΓÇô 016 ΓÇô MID (Day) SWP-016 Elevator Steel & Enclosure Rev.4 06/02/26 ΓÇô Day with Crane - Middletown SECTION 1 ΓÇô General Information Contract /
- swp 016 + attachment (p. 2): SAFE WORK PLAN SWP ΓÇô 016 ΓÇô MID (Day) SWP-016 Elevator Steel & Enclosure Rev.3 03/10/26 ΓÇô Day with Crane - Middletown STEP RISK PREVENTION/MITIGATION COMMENT 1.
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq77] — ⏱ 1.6s

**Query:**
> In GEN-041R01 SWP-011 for Platform Concrete Demo, what dust control and silica exposure prevention measures apply to saw cutting and demolition operations?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts`
- Elapsed: 1641 ms

**Sources retrieved:**
- `A37806_01 35 10_GEN-041R05 - AEAN - SWP-011 - Platform Concrete Demo.pdf` _(pages: 22, 21, 23, 24)_

**Citations (chunk-level):**
- A37806_01 35 10_GEN-041R05 - AEAN - SWP-011 - Platform Concrete Demo.pdf chunk=33 (p. 23) rel=9.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-041R01 SWP-011 for Platform Concrete Demo, what dust control and silica exposure prevention measures apply to saw cutting and demolition operations?".
Routed focus: contracts.
Top files: swp 011 - platform concrete demo.
Evidence snippets:
- swp 011 - platform concrete demo (p. 22): SAFE WORK PLAN SWP - 011 SWP-011-Platform Concrete Demo ΓÇô Rev.1 ΓÇô 07/10/25 [Approved] ΓÇô Updated with Brokk 180 addition STEP RISK PREVENTION/MITIGATION COMMENT
- swp 011 - platform concrete demo (p. 23): SAFE WORK PLAN SWP - 011 SWP-011-Platform Concrete Demo ΓÇô Rev.1 ΓÇô 07/10/25 [Approved] ΓÇô Updated with Brokk 180 addition STEP RISK PREVENTION/MITIGATION COMMENT
- swp 011 - platform concrete demo (p. 22): cks will be used to transfer debris to the Lull. ΓÇó Lull will lower debris to street level. ΓÇó Ensure that no material will fold the ROW. Competent Person to insp
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq78] — ⚡ 259ms

**Query:**
> Summarize SWP-011

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents, contracts`
- Elapsed: 259 ms

**Sources retrieved:**
- `SWP-013 Installation of Platform Barrier Revision 002.pdf`

**Citations (chunk-level):**
- SWP-013 Installation of Platform Barrier Revision 002.pdf chunk=0 (p. ?) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "Summarize SWP-011".
Routed focus: documents, contracts.
Top files: swp 013 installation of platform barrier revision 002.
Evidence snippets:
- swp 013 installation of platform barrier revision 002: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / George Gao / P2 SWPs / SWP 011 Asbestos Abatement / SWP 013 Installation
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq79] — ⚡ 273ms

**Query:**
> Summarize SWP-032

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents, contracts`
- Elapsed: 273 ms

**Sources retrieved:**
- `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf` _(pages: 1, 2, 3, 4)_

**Citations (chunk-level):**
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=2 (p. 1) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=4 (p. 2) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=5 (p. 3) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=8 (p. 4) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=11 (p. 5) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=13 (p. 6) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=15 (p. 7) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=17 (p. 8) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "Summarize SWP-032".
Routed focus: documents, contracts.
Top files: swp 032 - general formwork, rebar and concrete.
Evidence snippets:
- swp 032 - general formwork, rebar and concrete: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 27 - PERSONAL FOLDERS / MYRTLE AVE / Safety / Draft SWP / SWP 032 - General formwork rebar & con
- swp 032 - general formwork, rebar and concrete: DOCUMENT SECTION INDEX (heading ΓåÆ page numbers): SAFE WORK PLAN SWP - 032 [pp.1-14] STEP RISK PREVENTION/MITIGATION COMMENT [pp.3-12]
- swp 032 - general formwork, rebar and concrete (p. 1): SAFE WORK PLAN SWP - 032 SWP ΓÇô 032 ΓÇô General formwork, rebar and concreteΓÇô Rev. 4 6/26/26 SECTION 1 ΓÇô General Information Contract / Project Description: A37806
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq80] — ⚡ 216ms

**Query:**
> What does the August 20, 2025 transmittal letter from Michael Wilson say about the approval status of the SWP-032 safe work plan under spec 01 35 10?

*Active document context:* `A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf`

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 216 ms
- route: retrieval=107ms agent=0ms total=1363ms

**Sources retrieved:**
- `A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf` _(pages: 15, 16, 18)_

**Citations (chunk-level):**
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=29 (p. 15) rel=1.000
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=30 (p. 15) rel=1.000
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=31 (p. 16) rel=1.000
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=33 (p. 18) rel=1.000
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=34 (p. 18) rel=1.000

**Answer:**

```
## Section 3.01 Requirements Summary (swp 032 - general formwork rebar and concrete)
- Reviewed indexed section evidence from page(s): 15, 16, 18.
- Key requirements captured from the section:
- SAFE WORK PLAN SWP - 032 SWP ΓÇô 032 ΓÇô General formwork, rebar and concreteΓÇô Rev.
- ΓÇóDo not operate power tools in explosive atmo- spheres, such as in the presence of flammable liquids, gases or dust.
- ΓÇóIf operating a power tool in a damp location is unavoidable, use a ground fault circuit interrupter (GFCI) protected supply.
- ΓÇóIf devices are provided for the connection of dust extraction and collection facilities, ensure these are connected and properly used.
Evidence: swp 032 - general formwork rebar and concrete (p. 15, 16, 18).
```

---

### 🔍 [sq81] — ⏱ 1.4s

**Query:**
> In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what restricted work hours apply, what combustible materials storage rules are in effect, and how much advance notice is required before closing a staircase?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts`
- Elapsed: 1363 ms

**Sources retrieved:**
- `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf` _(pages: 7, 4, 5, 6)_

**Citations (chunk-level):**
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=8 (p. 5) rel=8.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what restricted work hours apply, what combustible materials storage rules are in effect, and how much advance notice is required before closing a staircase?".
Routed focus: contracts.
Top files: swp 052 mezzanine stair barricade.
Evidence snippets:
- swp 052 mezzanine stair barricade: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 35 10 Construction Safety Requirements / A37806_01 35 10_GEN-116R00 - R&R -
- swp 052 mezzanine stair barricade (p. 7): SAFE WORK PLAN SWP ΓÇô 052 - BUR SWP 052 ΓÇô Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026 muscle strains. Sensible lifting anyt
- swp 052 mezzanine stair barricade (p. 5): SAFE WORK PLAN SWP ΓÇô 052 - BUR SWP 052 ΓÇô Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026 2. continued be permitted in the swin
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq82] — ⚡ 184ms

**Query:**
> In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what worksite entry and personnel safety requirements apply, including PPE and evacuation procedures?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `field_ops, documents`
- Elapsed: 184 ms
- route: retrieval=102ms agent=1ms total=1382ms

**Sources retrieved:**
- `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf` _(pages: 5, 6, 7)_

**Citations (chunk-level):**
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=8 (p. 5) rel=1.000
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=9 (p. 5) rel=1.000
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=11 (p. 6) rel=1.000
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=12 (p. 6) rel=1.000
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=14 (p. 7) rel=1.000

**Answer:**

```
## Section 3.28 (swp 052 mezzanine stair barricade)
- Exact indexed section text from page(s): 5, 6, 7.
```text
SAFE WORK PLAN SWP ΓÇô 052 - BUR
SWP 052 ΓÇô Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026
2. continued be permitted in the swing radius of any equipment
while the equipment is in operation
∩é╖ First aid kits & eyewash station will always be
on site
∩é╖ Review of NYCT zero tolerance for Drug/alcohol
& Tobacco policy
∩é╖ All workers shall be protected from falls greater
than 6' by a guardrail system (fall prevention) or
an OSHA- compliant PFAS (Personal Fall Arrest
System for Fall Protection with a climbing or
rescue type helmet with chin strap and side
impact protection.)
5. Usage of Tools, Hand,
& Power Generator,
Extension Cords,
Electrical Drills, Sawzall
and Table Saw
∩é╖ Electrical Hazards
∩é╖ Defective tools
∩é╖ Eye injuries
∩é╖ Worker Strain
∩é╖ Fall Hazards
∩é╖ Fire
∩é╖ Spills
∩é╖ Slips/Trips/Falls
∩é╖ Tools must have proper insulation and be inspected
daily for damage ΓÇô damage tools shall be removed
from service immediately and tagged Do Not Use
∩é╖ Extension cords must be inspected daily for damage,
and a proper grounding plug
∩é╖ GFCI'S will be used with all electrical tools to prevent
electrical shocks, burns, or electrocution
∩é╖ All machine guards shall be installed and in use as
required.
∩é╖ Inspect hand & power tools before use to ensure safe
operation.
∩é╖ Wooden handles of tools kept free of splinters or
cracks
∩é╖ All ladders will be inspected for damage prior
ed and in use as
required.
∩é╖ Inspect hand & power tools before use to ensure safe
operation.
∩é╖ Wooden handles of tools kept free of splinters or
cracks
∩é╖ All ladders will be inspected for damage prior to use.
Three points of contact always while ladders are in
use. All ladders over 6' will be footed or lashed. Ladder
permit and ladder inspection tag, as per the ladder
permitting program (3.28), to be used in compliance
with Division 1 01 35 10 Construction Safety
Requirements.
∩é╖ Proper use of portable ladders and any work done over
6' or the potential to fall more than 6' will be done with
a fall arrest system in place tied off to the proper
anchor point. Any employee required to wear a
personal fall arrest device will have fall protection
training
∩é╖ At above ground stations, Gas Placard is not required- only GPE
inspection. All GPE inspections will be performed as per the OSS GPE
Guidelines.
∩é╖ 20-lb (type 10A120BC) ABC fire extinguisher to be within 20-feet of any
refueling operation.
∩é╖ Refueling only to be done by personnel with the FDNY CoF S93/S94
certifications.
∩é╖ All handles and guards for tools will be in place.
∩é╖ All tools and equipment shall be used according to manufacturers
recommendations.
6. Use of Ladders ∩é╖ Slip / Trips / Falls ∩é╖ Obtain ladder permit before start of work. (ROW
only)
- Do not use metal ladders on tracks Safety Bulletin 2005-4.- (fiberglass
Ladder
ers
recommendations.
6. Use of Ladders ∩é╖ Slip / Trips / Falls ∩é╖ Obtain ladder permit before start of work. (ROW
only)
- Do not use metal ladders on tracks Safety Bulletin 2005-4.- (fiberglass
Ladders)
SAFE WORK PLAN SWP ΓÇô 052 - BUR
SWP 052 ΓÇô Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026
∩é╖ Use non-conductive ladder to access track from
platform
∩é╖ Secure ladder with functioning rubber feet and
extends 3 feet past landing platform. For other
ladder use: fully open A frame ladders. Ensure
ladders are set up on a level and firm surface.
∩é╖ Ladders will be used in accordance with
manufacturersΓÇÖ labels as it relates to allowable
weights and working heights
∩é╖ Face ladders when climbing and descending.
∩é╖ Do not climb with materials; use hauling line. Set up
straight ladders at 4:1 ratio.
∩é╖ Do not separate sections of extension ladders.
∩é╖ Ladders must have manufacturers rating label
clearly legible and visible.
∩é╖ Ladders to be clearly marked with company name.
- Safety Advisory 19-02: Ladder Safety
∩é╖ - Ladder Inspections Logs will be available as per request
7. Working in Hot
Weather/Cold Weather
iojopko
∩é╖ Heat Stress, Heat
Exhaustion, Heat
Stroke
∩é╖ Hypothermia, Frostbite
∩é╖ Cold water shall be provided. Loose-fitting and light-
colored clothing is recommended. Workers shall
take breaks throughout the day as necessary in
extreme temperatures
∩é╖ Select proper clothing for cold, wet, and windy
conditions. Layer clothing to adjust to changing
environmental temperatures. Wear a hat and
gloves, in addition to underwear that will keep
water away from the sk
per clothing for cold, wet, and windy
conditions. Layer clothing to adjust to changing
environmental temperatures. Wear a hat and
gloves, in addition to underwear that will keep
water away from the skin (polypropylene).
∩é╖ Drink warm, sweet beverages (sugar water, sports-
type drinks). Avoid drinks with caffeine (coffee, tea,
∩é╖ or hot chocolate).
∩é╖ Heat Stroke is a true medical emergency, call 911.
∩é╖ Hypothermia is a true medical emergency, call 911
8. Delivery of materials,
tools, and equipment
unloading.
∩é╖ Pedestrian/Employee Struck-
By
∩é╖ Slips, Trips & Falls
∩é╖ Cuts, Scrapes, Lacerations
∩é╖ Eye injuries
∩é╖ Worker Strain
∩é╖ Other injuries
∩é╖ Running over materials
∩é╖ Material falling
∩é╖ Caught in-between
∩é╖ Back Injury
∩é╖ All materials will be delivered to the site via motor
vehicle at the station Entrance or work train. NYCT
SAFETY BULLETIN 2000-2- Movement cable reels
and other large items via station stairways during
deliveries onto transit property.
∩é╖ Before starting work, a separate area will be
established to place equipment, which will not be
placed in an area that will impede the safety of
pedestrians or workers at the site. This will be done
with the use of lollipop/safety cones and cone toppers.
- All employees use proper lifting techniques to avoid
∩é╖ See step #1 above regarding PPE requirements.
∩é╖ MPT set-ups will be in place prior to any movement of equipment.
∩é╖ All mater
and cone toppers.
- All employees use proper lifting techniques to avoid
∩é╖ See step #1 above regarding PPE requirements.
∩é╖ MPT set-ups will be in place prior to any movement of equipment.
∩é╖ All material deliveries will be communicated to the PMC at least 24-hours
prior.
SAFE WORK PLAN SWP ΓÇô 052 - BUR
SWP 052 ΓÇô Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026
muscle strains. Sensible lifting anything over 50 pounds,
use the buddy system.
9. Installation of Platform
Barrier
9. continued
∩é╖ See Item #ΓÇÖs 1 & 2
∩é╖ Laceration
∩é╖ Property Damage
∩é╖ Struck By/Flying Objects
∩é╖ Ladder Safety
∩é╖ Improper construction of
platform barriers
ΓùÅ See attached Stair Barricade Plans
ΓùÅ Barriers will be constructed in accordance with
OSS guidelines for temporary subway barriers
latest revision. The barrier will be inspected daily
before and after work takes place. Lockable,
inward swinging doors will be installed if
applicable. The door must be self- closing via
spring hinge.
ΓùÅ All ladders will be inspected for damage prior to
use. Three points of contact at all times while
ladders are in use. All ladders over 6ΓÇÖ will be
footed or lashed.
ΓùÅ Proper use of portable ladders and any work done over
6ΓÇÖ or the potential to fall more than 6ΓÇÖ will be done with
a fall arrest system in place tied off to the proper anchor
point.
ΓùÅ Use proper lifting techniques
∩é╖ Work zones with materials shall be delineated so as
to protect the public and all other personnel.
ΓùÅ See Item #ΓÇÖs 1 & 2
ΓùÅ Plywood used will be fire retardant. Fire retardant stamp to remain
visible (will be kept on inside of the barrier) and will not be painted over
so stamp remains visible
```
```

---

### 🔍 [sq83] — ⏱ 1.4s

**Query:**
> In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what are the safety coordinator's responsibilities for PPE enforcement, SDS management, and safe work plan development?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `field_ops, documents`
- Elapsed: 1382 ms

**Sources retrieved:**
- `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf` _(pages: 6, 1, 7, 8)_

**Citations (chunk-level):**
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=9 (p. 6) rel=9.000
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=14 (p. 8) rel=9.000
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=13 (p. 7) rel=9.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what are the safety coordinator's responsibilities for PPE enforcement, SDS management, and safe work plan development?".
Routed focus: field_ops, documents.
Top files: a37806 01 35 10 gen-021r00 - r&r -.
Evidence snippets:
- a37806 01 35 10 gen-021r00 - r&r - (p. 6): Diego Gonzalez RESUME JTrack, NYCT Bedford park C-48705 Line structure component repair project, Bronx NY Safety coordinator, 100% safety related, (11/22- prese
- a37806 01 35 10 gen-021r00 - r&r -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 35 10 Construction Safety Requirements / A37806_01 35 10_GEN-021R00 - R&R -
- a37806 01 35 10 gen-021r00 - r&r - (p. 8): Diego Gonzalez RESUME safety equipment to be used and verifying that the contractor(s) were performing work in compliance with the specifications and regulatory
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq84] — ⚡ 182ms

**Query:**
> Summarize GEN-021R00 Safety Coordinator submittal

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `field_ops, documents`
- Elapsed: 182 ms

**Sources retrieved:**
- `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf` _(pages: 1, 3, 4)_

**Citations (chunk-level):**
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=2 (p. 1) rel=1.000
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=5 (p. 3) rel=1.000
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=6 (p. 4) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "Summarize GEN-021R00 Safety Coordinator submittal".
Routed focus: field_ops, documents.
Top files: a37806 01 35 10 gen-021r00 - r&r -.
Evidence snippets:
- a37806 01 35 10 gen-021r00 - r&r -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 35 10 Construction Safety Requirements / A37806_01 35 10_GEN-021R00 - R&R -
- a37806 01 35 10 gen-021r00 - r&r - (p. 3): 2 Broadway, 8th Floor New York, NY 10004-2207 LETTER OF TRANSMITTAL FROM: MICHAEL WILSON, MBA, CCM Senior Director, PCEO 2 Broadway, B6.131 New York, NY 10004 D
- a37806 01 35 10 gen-021r00 - r&r - (p. 4): For NYCT/MTA Review & Comment For NYCT/MTA Approval For Designer Approval For NYCT/MTA Information Only For Designer Information Only Date: Contract Number: Con
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq85] — ⏱ 2.1s

**Query:**
> In the Schedule Update 5 June 2025, what are the scheduled start and finish dates for the Elevator 541 Enclosure activities, and what activities involve rated glass installation?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, contracts`
- Elapsed: 2144 ms

**Sources retrieved:**
- `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf` _(pages: 18, 31, 44, 46, 53, 54, 56, 57)_

**Citations (chunk-level):**
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=62 (p. 18) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=152 (p. 31) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=234 (p. 44) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=245 (p. 46) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=289 (p. 53) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=295 (p. 54) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=308 (p. 56) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=314 (p. 57) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 01 32 10 gen-032r00 - orig -)
- Query focus: In the Schedule Update 5 June 2025, what are the scheduled start and finish dates for the Elevator 541 Enclosure activities, and what activities involve rated glass installation?
- Matched indexed passages:
- (p. 18) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete BA-P-1220 BA-Prepare & Submit Sewer Temp 30 11-Aug-25 23-Sep-25 55 0% BA-P-1515 BA-Review & Approve Micropile Plan 15 25-Aug-25 16-Sep-25 52 0% BA-P-1225 BA-Review & Approve Sewer Temp 20 24-ΓÇª
- (p. 31) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete MR-P-1210 MR-Prepare & Submit Glass and Glazing 20 19-Sep-25 20-Oct-25 129 0% MR-P-1285 MR-Review & Approve Glass and Glazing 15 21-Oct-25 11-Nov-25 129 0% MR-P-1430 MR-Prepare & Submit GraniΓÇª
- (p. 44) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete BA-C-2430 BA-SH-Install Slop Sink/ Eye Wash w/ piping 5 03-Feb-27 09-Feb-27 317 0% Burnside - Elevato Burnside - Elevator 539 404 10-Aug-26 14-Apr-28 33 Burnside - Enc Burnside - Enclosure 23ΓÇª
- (p. 46) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete BA-C-2820 BA-S1/M1-Furnish and Install Metal Treads 10 26-Apr-27 10-May-27 223 0% BA-C-2850 BA-S1/M1-Paint stair 3 28-Apr-27 03-May-27 244 0% BA-C-2860 BA-S1/M1-Form & pour concrete at landinΓÇª
- (p. 53) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete MA-C-17 MA-EL1121-Hold Point - Torque Test-All Track GO8 2 05-Sep-26 06-Sep-26 10 0% MA-C-18 MA-EL1121-Install hoist beam top of shaft (Outage) 5 14-Sep-26 18-Sep-26 230 0% MA-C-43 MA-EL1121-ΓÇª
- (p. 54) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete Elevator 112 Elevator 1122-Structure 41 09-Aug-26 08-Oct-26 203 MA-C-17 MA-EL1122-Install Elevator 3 Shaft ( All Track GO ) -All Track GO8 2 09-Aug-26 13-Sep-26 0 0% MA-C-17 MA-EL1122-Hold PoΓÇª
- (p. 56) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete MA-C-19 MA-S3/S6-Install Standing Seam Roof 10 16-Jun-27 29-Jun-27 211 0% MA-C-20 MA-S3/S6-Install Stair Windscreen 5 01-Jul-27 08-Jul-27 211 0% MA-C-51 MA-S3/S4/S5/S6-Install Leader Lines 5ΓÇª
- (p. 57) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete MA-C-47 MA-EL1119-Remove barricades place in service 1 22-Jun-28 23-Jun-28 72 0% Myrtle- Elevato Myrtle- Elevator 1120 319 12-Feb-27 09-Jun-28 82 Elevator 112 Elevator 1120 Enclosure 39 12-FeΓÇª
- (p. 63) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete AI-C-2000 AI-McDonald Av-Install Roof Drainage/Snow Guards/ Bird Deterant 20 28-Dec-26 26-Jan-27 108 0% AI-C-2020 AI-McDonald Av- Install Windscreens 20 28-Dec-26 26-Jan-27 85 0% Avenue I-EleΓÇª
- (p. 73) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete Elevator 542 Elevator 542-Enclosure 53 21-May-26 10-Aug-26 58 MR-C-22 MR-EL542 -Install Standing Seam Roof 10 21-May-26 05-Jun-26 61 0% MR-C-31 MR-EL542 -Install Enclosure Framing 20 08-Jun-2ΓÇª
- (p. 123) Activity ID Activity Name Original Duration Start Finish Total Float MR-P-1210 MR-Prepare & Submit Glass and Glazing 20 19-Sep-25 20-Oct-25 129 MR-P-215 MR-Prepare & Submit AFAS/AOG Gate / Rail 5 22-Oct-25 28-Oct-25 211 MR-P-1430 MR-Prepare & Submit Granite base 10 22-Oct-25 05-NΓÇª
- (p. 27) Activity ID Activity Name Original Duration Start Finish Total Float Activity % Complete AI-P-1590 AI-Prepare & Submit Elevator Enclosure Shop Drawings EL1/2 20 16-Jul-25 13-Aug-25 266 0% AI-P-1585 AI-Review & Approve Elevator Enclosure Shop Drawings EL1/2 15 14-Aug-25 05-Sep-25ΓÇª
```

---

### 🔍 [sq86] — ⏱ 2.1s

**Query:**
> In the Schedule Update 5 June 2025, what is the planned outage for EL1121 Elevator Enclosure Framing installation and what are the upcoming enclosure activities at Myrtle Avenue?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts`
- Elapsed: 2107 ms

**Sources retrieved:**
- `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf` _(pages: 53, 101, 4, 6, 24, 56, 57)_

**Citations (chunk-level):**
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=292 (p. 53) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=289 (p. 53) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=293 (p. 53) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=567 (p. 101) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=571 (p. 101) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=6 (p. 4) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=9 (p. 6) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=107 (p. 24) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 01 32 10 gen-032r00 - orig -)
- Query focus: In the Schedule Update 5 June 2025, what is the planned outage for EL1121 Elevator Enclosure Framing installation and what are the upcoming enclosure activities at Myrtle Avenue?
- Matched indexed passages:
- (p. 53) ΓÇªfication survey 20-Jan-28, Elevator 1121-Enclosure MA-EL1121- Install Elevator Enclosure Framing ( Outage) MA-EL1121-Glas
- (p. 53) ΓÇª1121-Enclosure 243 18-Jan-27 20-Jan-28 88 MA-C-17 MA-EL1121- Install Elevator Enclosure Framing ( Outage) 15 18-Jan-27 08-Feb-27 68 0% MA-C-18 MA-EL1121-Glass Panels & Glaze (Outage) 15 09-Feb-27 03-Mar-27 68 0% MA-C-50 MA-EL1121-Caulk Frames 4 04-Mar-27 09-Mar-27 175 0% MA-C-26ΓÇª
- (p. 53) ΓÇªfication survey 20-Jan-28, Elevator 1121-Enclosure MA-EL1121- Install Elevator Enclosure Framing ( Outage) MA-EL1121-Glass Panels & Glaze (Outage) MA-EL1121-Caulk Frames MA-EL1121-Install metal panels at entrances 29-Dec-27, Elevator 1121-Mechanical MA-EL1121-Install Elevator raiΓÇª
- (p. 101) ΓÇªrement EDU03 Elevator Procurement 133 21-Jan-25 A 29-Jul-25 162 EDU04 Elevator Enclosure Procurement EDU04 Elevator Enclosure Procurement 167 21-Jan-25 A 18-Sep-25 55 EDU05 Long Lead Electrical, Comm, Fire Alarm Procurement EDU05 Long Lead Electrical, Comm, Fire Alarm ProcurementΓÇª
- (p. 101) ΓÇªue I, Burnside 29-Jul-25, EDU03 Elevator Procurement 18-Sep-25, EDU04 Elevator Enclosure Procurement 29-Jul-25, EDU05 Long Lead Electrical, Comm, Fire Alarm Procurement 20-Oct-25, EDU06 Track & Traction Power 03-Apr-26, EDU07 State of Good Repair at Burnside 09-Mar-26, DU01: AvenΓÇª
- (p. 4) MONTHLY SCHEDULE UPDATE JUNE 24 REV # 0 CONTRACT A37806 DESIGN-BUILD SERVICES FOR ADA UPGRADES PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS Revision # 0 Page 3 of 13 1.0 PROJECT OVERVIEW The work to be performed under Contract A37806 includes making the Norwood Avenue, BurnΓÇª
- (p. 6) MONTHLY SCHEDULE UPDATE JUNE 24 REV # 0 CONTRACT A37806 DESIGN-BUILD SERVICES FOR ADA UPGRADES PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS Revision # 0 Page 5 of 13 3.0 PROGRESS In the month of June 2025: - General Requirement submittals continue to be resubmitted. - TestΓÇª
- (p. 24) ΓÇªt LED Fixtures (Lighting Fixtures) MA-Prepare & Submit Shop Drawing - Myrtle Avenue Station Electrical MA-Prepare & Submit Shop Drawing - Myrtle Avenue Station Lighting MA-Review & Approve - Myrtle Avenue Station Electrical Shop Drawing MA-Review & Approve - Myrtle Avenue StationΓÇª
- (p. 56) ΓÇªclosure 44 24-Aug-27 28-Oct-27 211 MA-C-29 MA-EL1119-Overpass-Install Enclosure Framing 20 24-Aug-27 22-Sep-27 25 0% MA-C-30 MA-EL1119-Overpass-Install Enclosure Glass 20 23-Sep-27 22-Oct-27 25 0% MA-C-51 MA-EL1119-Street-Install Granite Coping 4 25-Oct-27 28-Oct-27 211 0% MA-C-5ΓÇª
- (p. 56) ΓÇªrtle- Elevato 28-Oct-27, Myrtle- Enclosure MA-EL1119-Overpass-Install Enclosure Framing MA-EL1119-Overpass-Install Enclosure Glass MA-EL1119-Street-Install Granite Coping MA-EL1119-Street-Install Ledge Guards 23-Feb-28, Myrtle- Mechanical MA-EL1119-Install Elevator motor and railΓÇª
- (p. 57) ΓÇªclosure 39 12-Feb-27 12-Apr-27 344 MA-C-31 MA-EL1120-Overpass-Install Enclosure Framing 20 12-Feb-27 15-Mar-27 183 0% MA-C-31 MA-EL1120-Overpass-Install Enclosure Glass 20 12-Feb-27 15-Mar-27 183 0% MA-C-32 MA-EL1120-Overpass-Caulking / Finishes for Enclosure 15 16-Mar-27 06-Apr-ΓÇª
- (p. 57) ΓÇªvator 1 12-Apr-27, Elevator 1120 Enclosure MA-EL1120-Overpass-Install Enclosure Framing MA-EL1120-Overpass-Install Enclosure Glass MA-EL1120-Overpass-Caulking / Finishes for Enclosu
```

---

### ⚡ [sq87] — ⚡ 326ms

**Query:**
> In spec section 21 12 00 for Fire-Suppression Standpipes, what are the pipe hanger and support design requirements, including how they must handle expansion joint forces?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 326 ms

**Sources retrieved:**
- `21 12 00 - Fire-Suppression Standpipes REV 1.pdf` _(pages: 1, 2, 3, 4, 6)_

**Answer:**

```
## Section 2.11 Requirements Summary (21 12 00 - fire-suppression standpipes rev 1)
- Reviewed indexed section evidence from page(s): 1, 2, 3, 4, 6.
- Key requirements captured from the section:
- FIRE DEPARTMENT CONNECTIONS [p.6] 2.12 PIPE HANGERS AND SUPPORTS [p.6] 3.3 INSTALLATION [p.9] 3.4 CLEAN UP [p.11] 3.5 TESTING [p.12].
- Section 01 33 00 Submittal Procedures 1.3 CITED STANDARDS Unless otherwise noted, the latest edition of the following codes and standards shall govern this work.
- 393 ΓÇô Standard Specification Indicating Pressure Gauges for Fire- Protection Service 7.
- ANSI/ AWWA A21.51/ C151 ΓÇô Ductile-Iron Pipe, Centrifugally Cast for Water 4.
- A865 ΓÇô Standard Specification for Threaded Couplings, Steel, Black or Zinc-Coated (Galvanized) Welded or Seamless G.
- E list of all components, make, manufacturer, telephone number of local vendor H.
- Lugged swivel connection and drop clappers for each hose connection inlet.
### 2.11.1. Submittals
- ADA UPGRADES PACKAGE 6 21 12 00 ΓÇô 1 CONTRACT NO: A37806 FINAL SUBMISSION REV 1 January 14, 2026 SECTION ΓÇô 21 12 00 FIRE-SUPPRESSION STANDPIPES PART 1 ΓÇô GENERAL 1.1 SUMMARY The Contractor shall furnish all labor, materials, tools and equipment, and perform a...
- The Work shall include but not be limited to the following: A.
- Addition of new standpipe piping and fire hose valves for new control areas.
- B.
- Modification of existing standpipe system to avoid new structures.
- C.
- Underwriters Laboratories (UL) 3.
- SECTION ΓÇô 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 ΓÇô 2 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 3.
- Ction Use 10.
- SECTION ΓÇô 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 ΓÇô 3 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 1.4 SUBMITTALS A.
- E list of all components, make, manufacturer, telephone number of local vendor H.
- SECTION ΓÇô 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 ΓÇô 4 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 THIS SPACE IS LEFT BLANK INTENTIONALLY.
- Gregate, and four parts of approved coarse aggregate.
Evidence: 21 12 00 - fire-suppression standpipes rev 1 (p. 1, 2, 3).
```

---

### ⚡ [sq88] — ⚡ 247ms

**Query:**
> In spec section 21 12 00 for Fire-Suppression Standpipes, what pitch requirements apply to piping and how must pipes and hose connections be installed where they cross tracks?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 247 ms

**Sources retrieved:**
- `21 12 00 - Fire-Suppression Standpipes REV 1.pdf` _(pages: 1, 2, 3, 4, 6)_

**Citations (chunk-level):**
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=2 (p. 1) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=4 (p. 2) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=5 (p. 2) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=6 (p. 3) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=7 (p. 3) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=8 (p. 4) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=12 (p. 6) rel=1.000

**Answer:**

```
## Section 2.11 Requirements Summary (21 12 00 - fire-suppression standpipes rev 1)
- Reviewed indexed section evidence from page(s): 1, 2, 3, 4, 6.
- Key requirements captured from the section:
- FIRE DEPARTMENT CONNECTIONS [p.6] 2.12 PIPE HANGERS AND SUPPORTS [p.6] 3.3 INSTALLATION [p.9] 3.4 CLEAN UP [p.11] 3.5 TESTING [p.12].
- Section 01 33 00 Submittal Procedures 1.3 CITED STANDARDS Unless otherwise noted, the latest edition of the following codes and standards shall govern this work.
- 393 ΓÇô Standard Specification Indicating Pressure Gauges for Fire- Protection Service 7.
- ANSI/ AWWA A21.51/ C151 ΓÇô Ductile-Iron Pipe, Centrifugally Cast for Water 4.
- A865 ΓÇô Standard Specification for Threaded Couplings, Steel, Black or Zinc-Coated (Galvanized) Welded or Seamless G.
- E list of all components, make, manufacturer, telephone number of local vendor H.
- Lugged swivel connection and drop clappers for each hose connection inlet.
### 2.11.1. Submittals
- ADA UPGRADES PACKAGE 6 21 12 00 ΓÇô 1 CONTRACT NO: A37806 FINAL SUBMISSION REV 1 January 14, 2026 SECTION ΓÇô 21 12 00 FIRE-SUPPRESSION STANDPIPES PART 1 ΓÇô GENERAL 1.1 SUMMARY The Contractor shall furnish all labor, materials, tools and equipment, and perform a...
- The Work shall include but not be limited to the following: A.
- Addition of new standpipe piping and fire hose valves for new control areas.
- B.
- Modification of existing standpipe system to avoid new structures.
- C.
- Underwriters Laboratories (UL) 3.
- SECTION ΓÇô 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 ΓÇô 2 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 3.
- Ction Use 10.
- SECTION ΓÇô 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 ΓÇô 3 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 1.4 SUBMITTALS A.
- E list of all components, make, manufacturer, telephone number of local vendor H.
- SECTION ΓÇô 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 ΓÇô 4 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 THIS SPACE IS LEFT BLANK INTENTIONALLY.
- Gregate, and four parts of approved coarse aggregate.
Evidence: 21 12 00 - fire-suppression standpipes rev 1 (p. 1, 2, 3).
```

---

### ⚡ [sq89] — ⚡ 770ms

**Query:**
> In BUR-042R01 EDU07 SOGR at Burnside Avenue, what requirements apply to water leaks observed during painting and scraping, and where is lead abatement required?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 770 ms

**Sources retrieved:**
- `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf` _(pages: 42)_

**Citations (chunk-level):**
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=182 (p. 42) rel=1.000

**Answer:**

```
## Section 4.4 Requirements Summary (a37806 01 10 20 bur-042r01 - aan -)
- Reviewed indexed section evidence from page(s): 42.
- Key requirements captured from the section:
- PLAN SOUTH PLATFORM LEVEL BURNSIDE AVENUE F F.5 E C B A C.5 8 7 6 5 4 3 2 1 228 229 230 231 1 BURNSIDE STATION SOGR PROPOSED REPAIR DETAILS J1 TRACK BENTS 225 THRU 226BUR-J1-200 PLATFORM GIRDER NORTH SIDE ELEVATION VIEW, TRACK J1 BENTS 225/2261 2PLATFORM GI...
- SECTION 4.33.14.A - STRUCTURAL STEEL REPAIR REQUIREMENT b.
- ALL SECONDARY FRAMING ELEMENTS WHICH REQUIRE MODIFICATION TO FACILITATE STEEL FRAMING REPAIR AND/ OR PLATFORM GIRDER REPLACEMENT SHALL BE REMOVED AND REPLACED IN-KIND WITH NEW STEEL MEMBERS/ ELEMENTS.
- DESIGNED BY CHECKED BY .../ADA Upgrades P6 DB/A37806-DB/Burnside Avenue/Models & Drawings/str/str/Sheets/A37806-BUR-CS-134.dgn PROJECT 12750 CONTRACT A-37806 ACCESSIBILITY UPGRADES AT FIVE STATIONS WITH COMPONENT UPGRADES AT ONE DESIGN-BUILD SERVICES FOR AD...
- PLAN SOUTH PLATFORM LEVEL BURNSIDE AVENUE F F.5 E C B A C.5 8 7 6 5 4 3 2 1 228 229 230 231 1 BURNSIDE STATION SOGR PROPOSED REPAIR DETAILS J1 TRACK BENTS 226 THRU 227BUR-J1-201 PLATFORM GIRDER NORTH SIDE ELEVATION VIEW, TRACK J1 BENTS 226/2271 2PLATFORM GI...
- PLAN SOUTH PLATFORM LEVEL BURNSIDE AVENUE F F.5 E C B A C.5 8 7 6 5 4 3 2 1 228 229 230 231 1 BURNSIDE STATION SOGR PROPOSED REPAIR DETAILS J1 TRACK BENTS 227 THRU 228BUR-J1-202 PLATFORM GIRDER NORTH SIDE ELEVATION VIEW, TRACK J1 BENTS 227/2281 2PLATFORM GI...
Evidence: a37806 01 10 20 bur-042r01 - aan - (p. 42).
```

---

### ⚡ [sq90] — ⚡ 726ms

**Query:**
> In BUR-042R01 EDU07 SOGR at Burnside Avenue, what are the general structural notes and repair standards for structural steel and reinforced concrete?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents, contracts`
- Elapsed: 726 ms

**Sources retrieved:**
- `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf` _(pages: 38, 12, 52, 53, 54, 55, 56, 57)_

**Citations (chunk-level):**
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=171 (p. 38) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=60 (p. 12) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=230 (p. 52) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=239 (p. 53) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=247 (p. 54) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=255 (p. 55) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=264 (p. 56) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=272 (p. 57) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 01 10 20 bur-042r01 - aan -)
- Query focus: In BUR-042R01 EDU07 SOGR at Burnside Avenue, what are the general structural notes and repair standards for structural steel and reinforced concrete?
- Matched indexed passages:
- (p. 38) ΓÇªCANOPY CANOPY COLUMN BEAM TO BRIGHT METAL. BEAM REQUIRED, INSTALL PER STRUCTURAL NOTES, ELSE CLEAN STEEL SURFACE OF 5. REVIEW BUR-CS-710 SERIES FOR TBR REQUIREMENTS. WHERE NEW CANOPY COLUMN 4. REMOVE EXISTING 2-12 ][ 20.5 OR W8X23 CANOPY COLUMNS & GUSSET PLATES. CANOPY TRUSS & LAΓÇª
- (p. 12) ΓÇªT. SYKU, P.E. D. MOSCOSO M. ELMORSI, P.E. GENERAL NOTES - STRUCTURAL REINFORCED CONCRETE STRUCTURAL STEEL STATE OF GOOD REPAIR (SOGR) LEGEND ABBREVIATIONS THE RETURN OF THE ELEMENT TO A STATE OF GOOD REPAIR. STEEL REPAIR WORK BY THE CONTRACTOR SHALL BE MADE TO ENSURE 11. STEEL SΓÇª
```

---

### 🔍 [sq91] — ⏱ 1.9s

**Query:**
> In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what did AECOM transmit to MLJTC2 Project Manager Ravi Jain on April 17, 2026?

*Active document context:* `Transmittal 212-NOR Xfer Girder inspection.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `field_ops, documents`
- Elapsed: 1853 ms
- route: retrieval=132ms agent=1ms total=1345ms

**Sources retrieved:**
- `Transmittal 212-NOR Xfer Girder inspection.pdf` _(pages: 1)_

**Citations (chunk-level):**
- Transmittal 212-NOR Xfer Girder inspection.pdf chunk=2 (p. 1) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what did AECOM transmit to MLJTC2 Project Manager Ravi Jain on April 17, 2026?".
Routed focus: field_ops, documents.
Top files: transmittal 212-nor xfer girder inspection.
Evidence snippets:
- transmittal 212-nor xfer girder inspection: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 02 - DESIGN / NOR Xfer Girder inspection / transmittal 212-nor xfer girder inspection Catego
- transmittal 212-nor xfer girder inspection (p. 1): Letter of Transmittal To: Ravi Jain Project Manager MLJTC 2 1010 Northern Boulevard Suite 202 Great Neck, NY 10021 Date: 04/17/2026 Contract Number: A37806 Re:
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq92] — ⏱ 1.3s

**Query:**
> In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what NYCT review designation is shown on the cover sheet — approval, information only, or designer review?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, field_ops`
- Elapsed: 1345 ms
- route: retrieval=99ms agent=0ms total=1314ms

**Sources retrieved:**
- `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf` _(pages: 1, 2, 4)_

**Citations (chunk-level):**
- A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf chunk=2 (p. 1) rel=9.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what NYCT review designation is shown on the cover sheet ΓÇö approval, information only, or designer review?".
Routed focus: documents, field_ops.
Top files: a37806 33 14 15 nor-010r00 - rwnc -.
Evidence snippets:
- a37806 33 14 15 nor-010r00 - rwnc -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 33 - UTILITIES / 33 14 15 Sewer and Water Main Work / A37806_33 14 15_NOR-010R
- a37806 33 14 15 nor-010r00 - rwnc - (p. 1): For NYCT/MTA Review & Comment For NYCT/MTA Approval For Designer Approval For NYCT/MTA Information Only For Designer Information Only Date: Contract Number: Con
- a37806 33 14 15 nor-010r00 - rwnc - (p. 2): NYC Environmental Protection Page 1 of 1 Fulton St (3118) bt Hale Av and Arlington Av K 25-408 NS SK MDS DSM 12/30/2025 December 29, 2025 Gabriel Ojo MLJ Contra
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### 🔍 [sq93] — ⏱ 1.3s

**Query:**
> In NOR-010R00 Norwood Avenue CCTV Inspection Findings, which sewer sections were inspected and what are the NYCDEP pipe inspection IDs for those segments?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents, field_ops`
- Elapsed: 1315 ms

**Sources retrieved:**
- `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf` _(pages: 4, 2)_

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In NOR-010R00 Norwood Avenue CCTV Inspection Findings, which sewer sections were inspected and what are the NYCDEP pipe inspection IDs for those segments?".
Routed focus: documents, field_ops.
Top files: a37806 33 14 15 nor-010r00 - rwnc -.
Evidence snippets:
- a37806 33 14 15 nor-010r00 - rwnc -: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 33 - UTILITIES / 33 14 15 Sewer and Water Main Work / A37806_33 14 15_NOR-010R
- a37806 33 14 15 nor-010r00 - rwnc - (p. 2): NYC Environmental Protection Page 1 of 1 Fulton St (3118) bt Hale Av and Arlington Av K 25-408 NS SK MDS DSM 12/30/2025 December 29, 2025 Gabriel Ojo MLJ Contra
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq94] — ⚡ 273ms

**Query:**
> In the EDU05B Electrical Long Lead submittal for Norwood Avenue Station, what does the AECOM calculation cover page show about the project job number, client, and coordination requirements?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 273 ms

**Sources retrieved:**
- `A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf` _(pages: 3, 4, 5, 7)_

**Citations (chunk-level):**
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=4 (p. 3) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=5 (p. 4) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=6 (p. 4) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=7 (p. 5) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=10 (p. 7) rel=1.000

**Answer:**

```
## Section 06.03 Requirements Summary (a37806 01 10 20 myr-082r00 - aean -)
- Reviewed indexed section evidence from page(s): 3, 4, 5, 7.
- Key requirements captured from the section:
- O Approved Electrical Short Circuit & Device Coordination Study o Technical Specifications The documents associated with this submission include.
- 20_GEN-004R01 04/16/2025 Design Statement, Design Criteria Report Yes A37806_01 10 20_GEN-002R01 04/17/2025 Design Documents No Not Applicable Technical Specifications Yes DU-07, most recent submission 3/30/26 Various List of Special Inspections No Not Appl...
- EDU-05BB Station 100PC Design Submission AECOM 2/2 Note that all related comments from previous submissions were resolved with the short circuit & device coordination study.
- Equipment Avenue I Middletown Road Myrtle Ave Norwood Ave Burnside Ave 1,200A Distribution Board DBN - - - - - 800A Distribution Board DBN (1) (Normal EDR) (1) (Normal EDR) - (1) (Normal EDR) (1) (Normal EDR) CT Cabinet and 1,200A Main Service Bolted Pressu...
- H 1 1 0 (See note 1) 1 1 Light fixtures Yes Yes Yes Yes Yes 800A ATS - - (1) (EL.E.E.Room2) - - 100A Lighting Panel (PP-1) - - (1) (Vestibule) - - 100A AFC Panel (CA) (2) (CA-N551A & CA-N551B) (2) (CA-R421A & CA-R421B) (1) (Vestibule) 1 1 800A FDS for 800A...
- THE METROPOLITAN TRANSPORTATION AUTHORITY ACTING BY MTA CONSTRUCTION & DEVELOPMENT CONTRACT A-37806 6/1/2026 ChandramouleeswarS PRINT AS OF .../ADA Upgrades P6 DB/A37806-DB/Location Common Details/Models & Drawings/_General/Sheets/A37806-GEN-G-000-EDU05.dgn...
### 06.03.1. Submittals
- Letter of Transmittal To: Ravi Jain Project Manager MLJTC 2 1010 Northern Boulevard Suite 202 Great Neck, NY 10021 Date: 06/04/2026 Contract Number: A37806 Re: MTA Contract A37806 Design-Build Services for Accessibility Upgrades ΓÇô Package 6 Submittal / RFI...
- 1/2 To: Ravi Jain, PE MLJTC2 1010 Northern Blvd.
- Great Neck, NY 11201 CC: Nick DiGuglielmo (MLJTC2) Andrew Voss (MLJTC2) Leyla Acosta (MLJTC2) Eric Clark (AECOM) Shravan Chandramouleeswar (AECOM) Ray Batmaz (AECOM) Janelle Ella (AECOM) File AECOM 605 Third Avenue New York, NY 10158 aecom.com Project name:...
- 20_GEN-004R01 04/16/2025 Design Statement, Design Criteria Report Yes A37806_01 10 20_GEN-002R01 04/17/2025 Design Documents No Not Applicable Technical Specifications Yes DU-07, most recent submission 3/30/26 Various List of Special Inspections No Not Appl...
- Memo Design-Build Services for ADA Upgrades at Various Stations - Package 46: EDU-05BB Station 100PC Design Submission AECOM 2/2 Note that all related comments from previous submissions were resolved with the short circuit & device coordination study.
- Equipment Avenue I Middletown Road Myrtle Ave Norwood Ave Burnside Ave 1,200A Distribution Board DBN - - - - - 800A Distribution Board DBN (1) (Normal EDR) (1) (Normal EDR) - (1) (Normal EDR) (1) (Normal EDR) CT Cabinet and 1,200A Main Service Bolted Pressu...
- H 1 1 0 (See note 1) 1 1 Light fixtures Yes Yes Yes Yes Yes 800A ATS - - (1) (EL.E.E.Room2) - - 100A Lighting Panel (PP-1) - - (1) (Vestibule) - - 100A AFC Panel (CA) (2) (CA-N551A & CA-N551B) (2) (CA-R421A & CA-R421B) (1) (Vestibule) 1 1 800A FDS for 800A...
- THE METROPOLITAN TRANSPORTATION AUTHORITY ACTING BY MTA CONSTRUCTION & DEVELOPMENT CONTRACT A-37806 6/1/2026 ChandramouleeswarS PRINT AS OF .../ADA Upgrades P6 DB/A37806-DB/Location Common Details/Models & Drawings/_General/Sheets/A37806-GEN-G-000-EDU05.dgn...
Evidence: a37806 01 10 20 myr-082r00 - aean - (p. 3, 4, 5).
```

---

### ⚡ [sq95] — ⚡ 192ms

**Query:**
> In the EDU05B Electrical Long Lead submittal, what panel and circuit data is shown for spec sections 12 14 10, 25 43 18, and 25 41 18 in the load schedule?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 192 ms

**Sources retrieved:**
- `A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf` _(pages: 4)_

**Citations (chunk-level):**
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=5 (p. 4) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=6 (p. 4) rel=1.000

**Answer:**

```
## Section 06.03 Requirements Summary (a37806 01 10 20 myr-082r00 - aean -)
- Reviewed indexed section evidence from page(s): 4.
- Key requirements captured from the section:
- O Approved Electrical Short Circuit & Device Coordination Study o Technical Specifications The documents associated with this submission include.
- 20_GEN-004R01 04/16/2025 Design Statement, Design Criteria Report Yes A37806_01 10 20_GEN-002R01 04/17/2025 Design Documents No Not Applicable Technical Specifications Yes DU-07, most recent submission 3/30/26 Various List of Special Inspections No Not Appl...
- EDU-05BB Station 100PC Design Submission AECOM 2/2 Note that all related comments from previous submissions were resolved with the short circuit & device coordination study.
- Equipment Avenue I Middletown Road Myrtle Ave Norwood Ave Burnside Ave 1,200A Distribution Board DBN - - - - - 800A Distribution Board DBN (1) (Normal EDR) (1) (Normal EDR) - (1) (Normal EDR) (1) (Normal EDR) CT Cabinet and 1,200A Main Service Bolted Pressu...
- H 1 1 0 (See note 1) 1 1 Light fixtures Yes Yes Yes Yes Yes 800A ATS - - (1) (EL.E.E.Room2) - - 100A Lighting Panel (PP-1) - - (1) (Vestibule) - - 100A AFC Panel (CA) (2) (CA-N551A & CA-N551B) (2) (CA-R421A & CA-R421B) (1) (Vestibule) 1 1 800A FDS for 800A...
- THE METROPOLITAN TRANSPORTATION AUTHORITY ACTING BY MTA CONSTRUCTION & DEVELOPMENT CONTRACT A-37806 6/1/2026 ChandramouleeswarS PRINT AS OF .../ADA Upgrades P6 DB/A37806-DB/Location Common Details/Models & Drawings/_General/Sheets/A37806-GEN-G-000-EDU05.dgn...
### 06.03.1. Submittals
- Letter of Transmittal To: Ravi Jain Project Manager MLJTC 2 1010 Northern Boulevard Suite 202 Great Neck, NY 10021 Date: 06/04/2026 Contract Number: A37806 Re: MTA Contract A37806 Design-Build Services for Accessibility Upgrades ΓÇô Package 6 Submittal / RFI...
- 1/2 To: Ravi Jain, PE MLJTC2 1010 Northern Blvd.
- Great Neck, NY 11201 CC: Nick DiGuglielmo (MLJTC2) Andrew Voss (MLJTC2) Leyla Acosta (MLJTC2) Eric Clark (AECOM) Shravan Chandramouleeswar (AECOM) Ray Batmaz (AECOM) Janelle Ella (AECOM) File AECOM 605 Third Avenue New York, NY 10158 aecom.com Project name:...
- 20_GEN-004R01 04/16/2025 Design Statement, Design Criteria Report Yes A37806_01 10 20_GEN-002R01 04/17/2025 Design Documents No Not Applicable Technical Specifications Yes DU-07, most recent submission 3/30/26 Various List of Special Inspections No Not Appl...
- Memo Design-Build Services for ADA Upgrades at Various Stations - Package 46: EDU-05BB Station 100PC Design Submission AECOM 2/2 Note that all related comments from previous submissions were resolved with the short circuit & device coordination study.
- Equipment Avenue I Middletown Road Myrtle Ave Norwood Ave Burnside Ave 1,200A Distribution Board DBN - - - - - 800A Distribution Board DBN (1) (Normal EDR) (1) (Normal EDR) - (1) (Normal EDR) (1) (Normal EDR) CT Cabinet and 1,200A Main Service Bolted Pressu...
- H 1 1 0 (See note 1) 1 1 Light fixtures Yes Yes Yes Yes Yes 800A ATS - - (1) (EL.E.E.Room2) - - 100A Lighting Panel (PP-1) - - (1) (Vestibule) - - 100A AFC Panel (CA) (2) (CA-N551A & CA-N551B) (2) (CA-R421A & CA-R421B) (1) (Vestibule) 1 1 800A FDS for 800A...
- THE METROPOLITAN TRANSPORTATION AUTHORITY ACTING BY MTA CONSTRUCTION & DEVELOPMENT CONTRACT A-37806 6/1/2026 ChandramouleeswarS PRINT AS OF .../ADA Upgrades P6 DB/A37806-DB/Location Common Details/Models & Drawings/_General/Sheets/A37806-GEN-G-000-EDU05.dgn...
Evidence: a37806 01 10 20 myr-082r00 - aean - (p. 4).
```

---

### ⚡ [sq96] — ⚡ 217ms

**Query:**
> In GEN-014R00 Monthly Quality and Certification Report for May 2025, what construction activities and quality survey items are documented for the Ave I station platform under spec section 01 40 10?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 217 ms
- route: retrieval=109ms agent=0ms total=1662ms

**Sources retrieved:**
- `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf` _(pages: 4, 5, 6, 7, 8, 9)_

**Citations (chunk-level):**
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=5 (p. 4) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=6 (p. 5) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=7 (p. 6) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=8 (p. 7) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=9 (p. 8) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=10 (p. 9) rel=1.000

**Answer:**

```
## Section 3.03 Requirements Summary (a37806 01 40 10 gen-014r00 - r&r -)
- Reviewed indexed section evidence from page(s): 4, 5, 6, 7, 8, 9.
- Key requirements captured from the section:
- Material Submittal d.
- EDU02 B&C Foundations, Structural Steel & Demolition.
- ΓÇó Setup/support for weekend PBGO ΓÇó Lidar scan of track B1 ΓÇó Survey platform B1/B2 + Track B1 ΓÇó Survey Track B1 Middletown Road.
- Middletown Road and Norwood Ave EDU-02 Advanced 5/7/2025 Middletown Road Station DU-02 Preliminary 5/9/2025 Middletown Road Station_ Supplementary DU-02 Preliminary 5/12/2025 Track, Traction Power & Signals_ Supplementary EDU-06 Advanced 5/16/2025 Norwood A...
### 3.03.1. Submittals
- MONTHLY QUALITY REPORT (May, 2025) General Requirements: Section 01 40 10, Quality Management QMP Element No.
- 3.03.A: Monthly Quality Report MLJTC2/A-37135/QMP/F24, REV.
- 03 Updated:4/23/2025 PROJECT QUALITY MANAGER: Nabeel Anjum DATE PREPARED: 06/03/2025 Project: Contract A37806, Design- Build Services for Accessibility Upgrades - Package 6 Target/Objective Performed Provide a.
- Hold Point/ Inspection Request b.
- NCR c.
- Material Submittal d.
- 03 Updated:4/23/2025 1.
- 03 Updated:4/23/2025 3.0 Construction Activities Summary Ave I: ΓÇó Dug test pit to locate ConEd duct bank under west sidewalk on McDonald Avenue.
- Aecom.com Sheet 1/1 06/03/2025 Mr.
- 1/1 To: Mr.
- Nabeel Anjum Quality Manager MLJTC2 1010 Northern Boulevard Suite 200 Great Neck, NY 11021 CC: Ravi Jain, PE, DBIA, MLJTC2 Eric Clark, RA, Assoc.
Evidence: a37806 01 40 10 gen-014r00 - r&r - (p. 4, 5, 6).
```

---

### 🔍 [sq97] — ⏱ 1.7s

**Query:**
> In GEN-014R00 Monthly Quality and Certification Report for May 2025, what is the NYCT/MTA submittal designation — information only, approval, or designer review?

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 1662 ms

**Sources retrieved:**
- `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf` _(pages: 1, 2, 3, 7)_

**Citations (chunk-level):**
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=2 (p. 1) rel=8.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=3 (p. 2) rel=8.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In GEN-014R00 Monthly Quality and Certification Report for May 2025, what is the NYCT/MTA submittal designation ΓÇö information only, approval, or designer review?".
Routed focus: documents.
Top files: no.
Evidence snippets:
- no: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / 01 40 10 Quality Management / A37806_01 40 10_GEN-014R00 - R&R - Monthly Quali
- no (p. 1): 2 Broadway, 8th Floor New York, NY 10004-2207 LETTER OF TRANSMITTAL FROM: MICHAEL WILSON, MBA, CCM Senior Director, PCEO 2 Broadway, B6.131 New York, NY 10004 D
- no (p. 3): Main Office: 1010 Northern Boulevard, Suite 200, Great Neck, NY 11021 Field Office: 228 E45th Street, 15N, New York, NY 10017 MTA Contract A37806 - Design- Buil
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq98] — ⚡ 204ms

**Query:**
> In the PRDC12-019R00 SikaGrout 212 product submittal, what application restrictions and surface preparation requirements apply — specifically regarding sun, wind, and substrate conditions?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 204 ms

**Sources retrieved:**
- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf` _(pages: 20, 21, 22)_

**Citations (chunk-level):**
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=30 (p. 20) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=31 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=32 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=33 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=34 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=35 (p. 22) rel=1.000

**Answer:**

```
## Section 9.5 Requirements Summary (a37806 prdc12-019r00 - app - sikagrout 212)
- Reviewed indexed section evidence from page(s): 20, 21, 22.
- Key requirements captured from the section:
- 100ΓÇô124 % 124ΓÇô145 % 20ΓÇô40 sec (ASTM C-14371 ASTM C-9392) Product Temperature 65ΓÇô75 ┬░F (18ΓÇô24 ┬░C) Ambient Air Temperature > 45 ┬░F (7 ┬░C) Substrate Temperature > 45 ┬░F (7 ┬░C) Pot Life ~15 minutes As the temperature will affect the pot life, application temper...
- Γû¬ APPLICATION Within 15 minutes after mixing, place grout into forms in normal manner to avoid air entrapment.
- An overlay in unconfined spaces Γû¬ Not to be used as a patch repair Γû¬ Avoid application in direct sun and/or strong wind Γû¬ Apply only to sound, prepared substrate Γû¬ Do not add additional water after application as this may cause cracking Γû¬ Protect freshly ap...
- NO OTHER WARRANTIES EXPRESS OR IMPLIED SHALL APPLY INCLUDING ANY WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
### 9.5.2. Warranty
- KEEP OUT OF REACH OF CHILDREN ΓÇó NOT FOR INTERNAL CONSUMPTION ΓÇó FOR INDUSTRIAL USE ONLY ΓÇó FOR PROFESSIONAL USE ONLY Prior to each use of any product of Sika Corporation, its subsidiaries or affiliates (ΓÇ£SIKAΓÇ¥), the user must always read and follow the warnin...
- Nothing contained in any SIKA literature or materials relieves the user of the obligation to read and follow the warnings and instructions for each SIKA product as set forth in the current product label, Product Data Sheet and Safety Data Sheet prior to use...
- SIKA warrants this product for one year from date of installation to be free from manufacturing defects and to meet the technical properties on the current Product Data Sheet if used as directed within the productΓÇÖs shelf life.
- User determines suitability of product for intended use and assumes all risks.
- UserΓÇÖs and/or buyerΓÇÖs sole remedy shall be limited to the purchase price or replacement of this product exclusive of any labor costs.
- NO OTHER WARRANTIES EXPRESS OR IMPLIED SHALL APPLY INCLUDING ANY WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
Evidence: a37806 prdc12-019r00 - app - sikagrout 212 (p. 20, 21, 22).
```

---

### 🔍 [sq99] — ⏱ 2.3s

**Query:**
> In the PRDC12-019R00 SikaGrout 212 product submittal, is SikaGrout-212 USDA certifiable and what does the product data say about packaging size and ASTM C-827 compliance?

*Active document context:* `A37806_PRDC12-019R00 - SikaGrout 212.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 2337 ms

**Sources retrieved:**
- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf` _(pages: 19, 21, 1, 17)_

**Citations (chunk-level):**
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=28 (p. 19) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=27 (p. 19) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=32 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=2 (p. 1) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=23 (p. 17) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=30 (p. 20) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=4 (p. 5) rel=1.000

**Answer:**

```
Based on indexed project context, this is the strongest evidence for: "In the PRDC12-019R00 SikaGrout 212 product submittal, is SikaGrout-212 USDA certifiable and what does the product data say about packaging size and ASTM C-827 compliance?".
Routed focus: documents.
Top files: a37806 prdc12-019r00 - app - sikagrout 212.
Evidence snippets:
- a37806 prdc12-019r00 - app - sikagrout 212: DOCUMENT SUMMARY File / Location: MLJ-017 Package 6 - General / 05 - SUBMITTALS / PRDC12 / a37806 prdc12-019r00 - app - sikagrout 212 Category: submittal Ke
- a37806 prdc12-019r00 - app - sikagrout 212 (p. 19): C-1107 (Grade C) Γû¬ Shows positive expansion when tested in accordance with ASTM C-827 Γû¬ SikaGrout┬«-212 is USDA certifiable Γû¬ PRODUCT INFORMATION Chemical Base C
- a37806 prdc12-019r00 - app - sikagrout 212 (p. 19): Product Data Sheet SikaGrout┬«-212 August 2018, Version 01.02 020201010010000002 PRODUCT DATA SHEET SikaGrout┬«-212 General Purpose cementitious grout PRODUCT DES
I can draft this as an owner notice, RFI, or meeting-minute action list if needed.
I can flag contract exposure, but this is not legal advice.
```

---

### ⚡ [sq100] — ⚡ 330ms

**Query:**
> In the PRDC12-012R02 Lead Placard Package for Burnside, what containment class and cut-line preparation requirements apply to the lead paint abatement work?

**How the answer was retrieved:**
- Method: Exact-ID lookup (deterministic, bypasses ranking)
- Domains routed: `documents`
- Elapsed: 330 ms

**Sources retrieved:**
- `A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf` _(pages: 33, 34, 35, 36)_

**Citations (chunk-level):**
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=52 (p. 33) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=53 (p. 33) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=54 (p. 34) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=55 (p. 34) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=56 (p. 34) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=57 (p. 35) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=58 (p. 35) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=59 (p. 36) rel=1.000

**Answer:**

```
## Section 12.18 Requirements Summary (a37806 prdc12-012r02 - r&r - lead placard package-burnside)
- Reviewed indexed section evidence from page(s): 33, 34, 35, 36.
- Key requirements captured from the section:
- Be hazardous, the Hazardous Lead Waste label will be affixed to the drum.
- HEPA vacuuming will be implemented periodically lead abatement in the enclosed area to avoid accumulation of debris.
- (718) 357-4831 2 of 6 Prior to demolition activities protective covering will be established specific to the work zone and maintained throughout the operation to contain potential lead debris.
- Upon completion of the task the protective covering used to collect lead debris shall be thoroughly cleaned of loose paint debris using the HEPA vacuum and/or wet methods.
- As work progresses, if it is determined that the ground tarp is not sufficient to contain paint chips/dust/debris generated the 3P containment will be reestablished where needed.
- As work progresses, if it is determined that the ground tarp is not sufficient to contain paint chips/dust/debris generated the 3P containment will be re-established where needed.
- Drills shall be equipped with a HEPA rated vacuum attachment to contain dust at the surface.
- MLJTC2 will provide hygiene facilities and ensure that workers comply with hygiene practices to reduce lead absorption that accumulates on a worker's body clothes.
Evidence: a37806 prdc12-012r02 - r&r - lead placard package-burnside (p. 33, 34, 35).
```

---

### 🔍 [sq101] — ⏱ 2.4s

**Query:**
> In PRDC12-012R02 Lead Placard Package for Burnside, what is the lead paint abatement classification, the project description, and the abatement contractor shown on the cover sheet?

*Active document context:* `Lead Placard - Burnside Ave 6-30-26.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `contracts, documents`
- Elapsed: 2395 ms

**Sources retrieved:**
- `A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf` _(pages: 1, 8, 21, 26, 31, 140, 141, 142)_

**Citations (chunk-level):**
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=2 (p. 1) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=10 (p. 8) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=40 (p. 21) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=52 (p. 26) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=64 (p. 31) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=127 (p. 140) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=128 (p. 141) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=129 (p. 142) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 prdc12-012r00 - orig - lead placard package-burnside)
- Query focus: In PRDC12-012R02 Lead Placard Package for Burnside, what is the lead paint abatement classification, the project description, and the abatement contractor shown on the cover sheet?
- Matched indexed passages:
- (p. 1) ΓÇªLJTC2 PM's Review: MLJTC2 Quality Manager: Number of Pages (Including Cover Sheet): Notes: A37806 Design-Build Services for Accessibility Upgrades - Package 6 Buy America Compliant
- (p. 8) ΓÇªtally and vertically; HEPA vacuuming will be implemented periodically lead abatement in the enclosed area to avoid accumulation of debris. 2. Power Tools with HEPA-Vacuum Attached: We will use Needle Guns and/or angle grinders with HEPA-vacuum shroud attachments as removal methodΓÇª
- (p. 21) ΓÇªyees shall be notified of the existence of OSHA regulations regarding lead. All employees who will potentially be exposed to lead will be properly trained before that exposure begins will be repeated annually. Training will cover the following items: ΓÇó The content of OSHA 29 CFRΓÇª
- (p. 140) ΓÇªS PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS LEAD DISTURBANCE PLACARD PACKAGE BURNSIDE AVENUE STATION SCHEDULES WEEKLY LEAD ABATEMENT WORK SCHEDULE CONTRACTOR DATE START TIME END TIME STATION WORK DESCRIPTION MLJ Contracting 05/15/25ΓÇô 05/15/26 7:00:00 AM 4:00:00 PM BurnsiΓÇª
- (p. 141) ΓÇªS PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS LEAD DISTURBANCE PLACARD PACKAGE BURNSIDE AVENUE STATION SCHEDULES WEEKLY LEAD ABATEMENT WORK SCHEDULE CONTRACTOR DATE START TIME END TIME STATION WORK DESCRIPTION TC Electric 05/15/25ΓÇô 05/15/26 7:00:00 AM 4:00:00 PM Burnside AΓÇª
- (p. 142) ΓÇªS PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS LEAD DISTURBANCE PLACARD PACKAGE BURNSIDE AVENUE STATION SCHEDULES WEEKLY LEAD ABATEMENT WORK SCHEDULE CONTRACTOR DATE START TIME END TIME STATION WORK DESCRIPTION J-Track 05/15/25ΓÇô 05/15/26 7:00:00 AM 4:00:00 PM Burnside Ave LΓÇª
- ΓÇªILITY OF RESPIRATOR [pp.24-34] DESIGN-BUILD SERVICES FOR ADA UPGRADES PACKAGE 6: [pp.37-52] 5 Middletown Road 6 IRT-Pelham Line Bronx Elevated [p.37] CONTRACTORS [p.38] HAZARDOUS MATERIALS [p.42] AUTHORIZED REPRESENTATIVE [p.67] DEFINITIONS AS USED IN THIS ENDORSEMENT [p.68] INSUΓÇª
- (p. 9) ΓÇª. Upon completion of the task the protective covering used to collect lead debris shall be thoroughly cleaned of loose paint debris using the HEPA vacuum and/or wet methods. All canvas polyethylene sheathing or other materials used shall be taken down, folded, removed, and may beΓÇª
- (p. 14) ΓÇªS PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS LEAD DISTURBANCE PLACARD PACKAGE CONTRACT AND SITE-SPECIFIC PROCEDURES BURNSIDE AVENUE STATION The procedures described in this manual will be used by TC Electric when disturbing any painted surfaces on this project. Lead AbateΓÇª
- (p. 17) ΓÇªS PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS LEAD DISTURBANCE PLACARD PACKAGE CONTRACT AND SITE-SPECIFIC PROCEDURES BURNSIDE AVENUE STATION The procedures described in this manual will be used by J-Track when disturbing any painted surfaces on this project. Lead AbatementΓÇª
```

---

### 🔍 [sq102] — ⏱ 2.2s

**Query:**
> In PRDC12-019R00 SikaGrout 212 product submittal, what are the compressive strength values, flowability, and extended working time listed in the product technical data table?

*Active document context:* `A37806_PRDC12-019R00 - SikaGrout 212.pdf`

**How the answer was retrieved:**
- Method: Keyword / FTS search
- Domains routed: `documents`
- Elapsed: 2180 ms

**Sources retrieved:**
- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf` _(pages: 18, 20, 13, 17, 8, 10, 12, 14)_

**Citations (chunk-level):**
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=25 (p. 18) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=29 (p. 20) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=17 (p. 13) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=23 (p. 17) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=8 (p. 8) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=12 (p. 10) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=16 (p. 12) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=19 (p. 14) rel=1.000

**Answer:**

```
## Detailed Matches (a37806 prdc12-019r00 - app - sikagrout 212)
- Query focus: In PRDC12-019R00 SikaGrout 212 product submittal, what are the compressive strength values, flowability, and extended working time listed in the product technical data table?
- Matched indexed passages:
- ΓÇª6 - General / 05 - SUBMITTALS / PRDC12 / A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf Category: submittal Key topics: 2 Broadway, 8th Floor, LETTER OF TRANSMITTAL, 2 Broadway, B6.131, DATE: 06/09/2025, MLJ CONTRACTING CORP., 1010 Northern Blvd, SUBJECT: DRAWINGS PARTS LIST CATAΓÇª
- (p. 18) ΓÇªoduct or process. All of the information set forth herein is based on technical data re- garding the identified product that Sika believes to be reliable as of the date hereof. Prior to each use of any Sika product, the user must always read and follow the warnings and instructioΓÇª
- (p. 20) TECHNICAL INFORMATION Compressive Strength Plastic Flowable Fluid 1 day 4,500 psi (31 MPa) 3,500 psi (24.1 MPa) 2,700 psi (18.6 MPa) 7 days 6,100 psi (42 MPa) 5,700 psi (39.3 MPa) 5,500 psi (37.9 MPa) 28 days 7,500 psi (51.7 MPa) 6,200 psi (42.7 MPa) 5,800 psi (40 MPa) (ASTM C-94ΓÇª
- (p. 13) Safety Data Sheet SikaGrout┬«-212 Revision Date 02/27/2023 Print Date 02/27/2023 7 / 12 Engineering measures : Use of adequate ventilation should be sufficient to control worker exposure to airborne contaminants. If the use of this product generates dust, fumes, gas, vapor or mistΓÇª
- (p. 17) Safety Data Sheet SikaGrout┬«-212 Revision Date 02/27/2023 Print Date 02/27/2023 11 / 12 Not regulated as a dangerous good SECTION 15. REGULATORY INFORMATION TSCA list : All chemical substances in this product are either listed on the TSCA Inventory or are in compliance with a TSCΓÇª
- (p. 8) Safety Data Sheet SikaGrout┬«-212 Revision Date 02/27/2023 Print Date 02/27/2023 2 / 12 H317 May cause an allergic skin reaction. H335 May cause respiratory irritation. H350 May cause cancer by inhalation. H372 Causes damage to organs (Lungs) through prolonged or repeated exposureΓÇª
- (p. 10) Safety Data Sheet SikaGrout┬«-212 Revision Date 02/27/2023 Print Date 02/27/2023 4 / 12 Cough Respiratory disorder Allergic reactions Dermatitis May cause an allergic skin reaction. Causes serious eye damage. May cause respiratory irritation. May cause cancer by inhalation. CausesΓÇª
- (p. 12) Safety Data Sheet SikaGrout┬«-212 Revision Date 02/27/2023 Print Date 02/27/2023 6 / 12 TWA (respir- able dust fraction) 0.1 mg/m3 OSHA P0 TWA (Res- pirable par- ticulate mat- ter) 0.025 mg/m3 ACGIH TWA (Res- pirable par- ticulate mat- ter) 0.025 mg/m3 (Silica) ACGIH Portland CemeΓÇª
- (p. 14) Safety Data Sheet SikaGrout┬«-212 Revision Date 02/27/2023 Print Date 02/27/2023 8 / 12 Boiling point/boiling range : No data available Flash point : Not applicable Evaporation rate : No data available Flammability (solid, gas) : No data available Upper explosion limit / Upper flaΓÇª
- (p. 16) Safety Data Sheet SikaGrout┬«-212 Revision Date 02/27/2023 Print Date 02/27/2023 10 / 12 Further information Product: Quartz (14808-60-7): This classification is relevant when ex- posed to Quartz (silicon dioxide) in dust or powder form only, including cured product that is subjecΓÇª
- (p. 17) ection 112 (40 CFR 61). California Prop. 65 WARNING: This product can expose you to chemicals including Quartz (SiO2) >5╬╝m, which is known to the State of California to cause cancer, and Portland Cement, which is known to the State of Cali- fornia to cause birth defects or otherΓÇª
- (p. 20) ΓÇª.5 h 6.0ΓÇô8.0 h (ASTM C-266) 73 ┬░F (23 ┬░C) 50 % R.H Product Data Sheet SikaGrout┬«-212 August 2018, Version 01.02 020201010010000002 2 /4
```

---
