Implement the smallest fixes for sq38 and sq39 only.

## Fix A — Tie-break duplicate meeting files

In `tryInTheDocumentAnswer`, when candidate files have the same filename/document-match score, use `chunkCount` only as a secondary tie-breaker.

Prefer the candidate with more chunks when:

* the primary filename score is equal, and
* both candidates are otherwise equally valid matches.

Do not make chunk count a primary ranking factor.

This should cause:

`A37806 Monthly Job Progress Meeting Minutes 2025-07-24.pdf`

to outrank the `.docx` version because both have the same filename score but the PDF contains 30 chunks versus 13.

## Fix B — Increase active-document chunk budget only for meeting attendee queries

Do not change the global `MAX_GRAPH_NODES`.

When the selected document is `meeting_minutes` and the query is asking about:

* attendees
* participants
* presenters
* who attended
* staff present
* external consultants

allow up to 14 ranked chunks from that active document to reach the LLM.

Keep the existing lower limit for unrelated document questions.

The goal is to surface the appended attendance-table rows on pages 8–10.

## Validation

Rerun only:

* sq38
* sq39

For each report:

1. Selected file
2. Whether PDF or DOCX was chosen
3. Chunks passed to the LLM
4. Whether TC Electric names are present in context
5. Whether T.Y. Lin / TYLin names are present in context
6. Final answer
7. PASS / PARTIAL / FAIL

Do not mark PASS unless the requested attendee information is actually answered.

If sq39 still misses T.Y. Lin after 14 chunks, report the exact rank of the T.Y. Lin chunk and stop. Do not increase the budget further without showing why.

Run tests and type-check after the change.

Do not modify unrelated retrieval, OCR, identifier, or prompt logic.
# MLJ-017 Package 6 — 97-Question Q&A Report

> **Project:** MLJ-017 Package 6 General · `145b3dcf-272e-4c45-9e19-953f20f25bb9`  
> **Run:** `mlj017-final-run.txt` (all DB indexes valid · GIN CTE FTS fix active)  
> **Date:** 2026-08-09

---

## How retrieval works

Each question goes through the following pipeline:

1. **Intent parsing** — domain tags extracted (contracts, documents, field_ops, …)
2. **Identifier lookup** — if a code like `GEN-042R00`, `MTACD-MLJTC2-L-0024`, `Invoice 11707` is detected, a deterministic exact-match is tried first
3. **Hybrid retrieval** — parallel pgvector HNSW ANN + GIN FTS (MATERIALIZED CTE approach), merged with RRF ranking
4. **Reranking** — keyword/trigram boost, graph-neighbour expansion
5. **LLM synthesis** — `google/gemini-2.5-flash` via OpenRouter drafts the answer, citing chunk page numbers

---

## Questions and Answers

| Grade | Count | % |
|---|---|---|
| ✅ PASS | 63 | 64% |
| ⚠️ PARTIAL | 18 | 18% |
| ❌ FAIL | 16 | 16% |

**Avg elapsed:** 2.5s &nbsp; **Max elapsed:** 8.9s &nbsp; **Timeouts (≥25s):** 0

---

### ❌ FAIL — wrong document [sq01]

**Question:** In GEN-042R00, what subcontractor is being reviewed for approval, what type of work experience do they describe in their application, and are any active contracts listed?

**Retrieval:** domains=`contracts,` · elapsed=`5.0s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=48 (p. 14) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=17 (p. 6) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=51 (p. 14) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=57 (p. 16) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=7 (p. 3) rel=1.000
- A37806_01 30 20_GEN-164R00 - FIO - Monthly Job Progress Meeting Minutes 07.23.26.pdf chunk=40 (p. 13) rel=1.000

</details>

**Answer:**

## Answer
- The document `a37806 01 30 20 gen-164r00 - fio -` does not contain information about a subcontractor being reviewed for approval, their work experience, or active contracts.
- The document is meeting minutes.
- **Evidence:** a37806 01 30 20 gen-164r00 - fio - (p. 3, 6, 14).

---

### ✅ PASS [sq02]

**Question:** What scope of work and pricing is in Island Pavement Cutting Co's subcontract

**Retrieval:** domains=`contracts` · elapsed=`5.2s` · cacheHit=`false`

**Sources retrieved:**

- `M017_CitywidePaving_DraftSubcontract_251118.docx`
- `A37806_GEN-051R00 - ORIG - Subcontractor Approval Forms - Island Pavement Cutting Co Inc..pdf`
- `Island Pavement Proposal - A-37806 - ADA Upgrades Package 6 NYCT - FE.pdf`
- `Subcontract Template Paving 251118.docx`
- `M017_MLJ_Halcyon_Agreement_Draft_06162025 - Review 1.docx`
- `M017_MLJ_Island Pavement and Cutting Co_Subcontract_For Signature_20250922.pdf`
- `DRAFT Pile Subcontract.docx`
- `Subcontract DRAFT ISLAND 7-14-25.docx`

<details><summary>Chunk-level citations</summary>

- Island Pavement Proposal - A-37806 - ADA Upgrades Package 6 NYCT - FE.pdf chunk=4 (p. 2) rel=0.829

</details>

**Answer:**

## Island Pavement Cutting Co. Subcontract Scope and Pricing

- **Scope of Work:** Furnish and install asphalt, tack coat, and reflective membrane; mill existing pavement at Norwood Avenue, Burnside Avenue, Myrtle Avenue, Avenue I, and Middletown Rd Stations (p. 5, 7).
- **Pricing Basis:** $27.82 per square foot for GCP Applied Technologies Preprufe 300R Plus LT, for approximately 1,485 SF per location (p. 3).
- **Clarifications:** Pricing is based on OCIP insurance and tax-exempt status; changes apply if conditions differ (p. 4).
- **Project:** A-37806 - ADA Upgrades Package 6 NYCT ΓÇô All 5 Locations (p. 3, 4).

---

### ✅ PASS [sq03]

**Question:** What joint sealing and pavement cutting contract work does Island Pavement Cutting Co list?

**Retrieval:** domains=`contracts` · elapsed=`3.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_GEN-051R00 - APP - Subcontractor Approval Forms - Island Pavement Cutting Co Inc..pdf`
- `DU-05 Myrtle Avenue 60% Submission.pdf`
- `A37806_RFP_Addendum_02.pdf`

**Answer:**

## Island Pavement Cutting Co. Contract Work

- **Joint Adhesive, Saw Cutting:** For H & L Contracting LLC:D265027 Suffolk Drainage (p. 33).
- **Joint Adh, Saw Cut, Joint:** For H & L Contracting LLC:D265031 Concrete Pavement Repairs (p. 33).
- **Saw & Seal:** For Stasi Industries, Inc:2 Park Lane Mill - RVC (p. 37).
- **Saw Cut:** For Steven Dubner Landscaping Inc.:NYULH RadOnc Relocation (p. 37).

---

### ✅ PASS [sq04]

**Question:** In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, what subcontractor is approved, what is their contract value, and what scope are they approved to perform?

**Retrieval:** domains=`contracts,` · elapsed=`1.3s` · cacheHit=`false`

**Sources retrieved:**

- `2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf`

<details><summary>Chunk-level citations</summary>

- 2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Approved Subcontractor
- (p. 1) The approved subcontractor is 50 States Engineering, Corp.

## Contract Value
- (p. 1) The subcontract cost for 50 States Engineering, Corp. is $632,640.00.

## Approved Scope
- (p. 1) 50 States Engineering, Corp. is approved to perform land surveying services.

---

### ❌ FAIL — wrong document [sq05]

**Question:** In A37806 Phasing Plan GEN-001R05, what are the major project phases described and their key milestones or constraints?

**Retrieval:** domains=`contracts,` · elapsed=`2.5s` · cacheHit=`false`

**Sources retrieved:**

- `A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx`

<details><summary>Chunk-level citations</summary>

- A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx chunk=0 (p. ?) rel=1.000
- A37806 ADA P6 - Communication PS LAN Agenda_20250930.docx chunk=3 (p. ?) rel=1.000

</details>

**Answer:**

## Project Phases and Milestones
- Could not verify major project phases or their key milestones/constraints in the retrieved passages.

---

### ✅ PASS [sq06]

**Question:** In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what ADA accessibility scheme and project information is presented?

**Retrieval:** domains=`documents` · elapsed=`3.3s` · cacheHit=`false`

**Sources retrieved:**

- `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf`

<details><summary>Chunk-level citations</summary>

- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=2 (p. 1) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=4 (p. 3) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=5 (p. 4) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=6 (p. 5) rel=1.000
- Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf chunk=8 (p. 7) rel=1.000

</details>

**Answer:**

## ADA Accessibility Scheme and Project Information

-   **Project Focus:** A37806 Design-Build Services for ADA Upgrades, Package 6 (p. 1).
-   **Scope:** Accessibility upgrades at five NYC subway stations, with component upgrades at one additional station (p. 1).
-   **Meeting Date:** Pre-proposal informational meeting held September 18, 2024 (p. 1).
-   **RFP Questions Deadline:** October 29, 2024 (p. 4).
-   **Proposal Due Date:** November 8, 2024, at 2:00 PM (p. 7).
-   **Anticipated Award:** December 2024 (p. 7).
-   **Contact:** Lisa Rigatti (MTA C&D Contracts Representative) for all RFP questions (p. 4).
-   **Procurement Process:** Includes RFP advertisement, question submission, one-on-one meetings (design, risk, schedule, alternative technical concept), proposal evaluation, possible presentations, negotiations, and award recommendation (p. 3, 4, 5).
-   **Stipends:** Offered to unsuccessful proposers who submit an executed stipend agreement (Appendix D of ITP) (p. 5).

---

### ✅ PASS [sq07]

**Question:** In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what does the Contract Specific Responsibility Form require of significant subcontractors?

**Retrieval:** domains=`contracts,` · elapsed=`3.1s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`

**Answer:**

## Contract Specific Responsibility Form Requirements

-   **Technical Resources:** Attach an explanation detailing staffing, facilities, equipment, and tools committed to the contract work (p. 30).
-   **Licenses:** List all relevant licenses, permits, or certifications held by the subcontractor or employees, noting any revocations or suspensions (p. 30).
-   **Prior Revocations/Suspensions:** Disclose if any officers, partners, owners, managers, or employees had licenses, permits, or certifications revoked or suspended in the past three years (p. 31).

---

### ✅ PASS [sq08]

**Question:** In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what is the ownership percentage and partner breakdown for this joint venture?

**Retrieval:** domains=`contracts,` · elapsed=`3.0s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf chunk=26 (p. 16) rel=5.000

</details>

**Answer:**

## Crossroads JV LLC Ownership

The provided document, "a37806 gen-027r00 - r&r - subcontractor approval forms," does not specify the ownership percentages or the full partner breakdown for Crossroads JV, LLC.

*   The form on page 16, "PART I. IDENTITY OF CONTRACTOR," includes blank fields for "Partner/Party name" and "Percentage of Ownership" for up to three partners, but these are not filled out for Crossroads JV, LLC (p. 16).
*   Node 1 and Node 3 state that Crossroads JV, LLC was formed in 2013 and lists Sheetal Pipada (President) and Neeraj Pipada (Vice President) as principals (p. 3).
*   The document does not provide the ownership percentages for these principals or any other potential partners.

---

### ✅ PASS [sq09]

**Question:** In the M017_IMP Draft Subcontract, what payment provisions from the prime contract are specifically excluded from the incorporated subcontract documents?

**Retrieval:** domains=`contracts,` · elapsed=`3.3s` · cacheHit=`false`

**Sources retrieved:**

- `M017_IMP_Draft Subcontract_20251024.docx`

<details><summary>Chunk-level citations</summary>

- M017_IMP_Draft Subcontract_20251024.docx chunk=11 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=122 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=10 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=80 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=81 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=100 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=44 (p. ?) rel=1.000

</details>

**Answer:**

## Excluded Payment Provisions

-   Payment provisions from the Prime Contract are specifically excluded from incorporation into the Subcontract (p. 1).
-   Contingent payment provisions of the Subcontract take precedence over any conflicting Prime Contract provisions (p. 1).
-   Receipt of payment by Contractor from Owner is a condition precedent for Subcontractor payment (p. 1, 2, 4, 5).
-   No funds are owed to Subcontractor until Contractor is paid by Owner for Subcontractor's Work (p. 2, 5).
-   Receipt of payment from Owner is a condition precedent for claims against Contractor's surety bond (p. 2, 5).
-   No compensation for Change Orders is due to Subcontractor until Contractor receives payment from Owner (p. 7).

---

### ✅ PASS [sq10]

**Question:** In the M017_IMP Draft Subcontract, what does the entire agreement clause say about how prior oral or written agreements between the parties are treated?

**Retrieval:** domains=`contracts,` · elapsed=`2.7s` · cacheHit=`false`

**Sources retrieved:**

- `M017_IMP_Draft Subcontract_20251024.docx`

<details><summary>Chunk-level citations</summary>

- M017_IMP_Draft Subcontract_20251024.docx chunk=9 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=109 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=134 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=148 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=11 (p. ?) rel=1.000
- M017_IMP_Draft Subcontract_20251024.docx chunk=33 (p. ?) rel=1.000

</details>

**Answer:**

## Entire Agreement Clause

- This Subcontract represents the entire agreement between the parties. (Node 1)
- It supersedes all prior agreements, whether written or oral. (Node 1)
- It supersedes all prior negotiations, representations, or agreements. (Node 2)
- Subcontractor agrees that only statements expressly contained in this Subcontract have been relied upon. (Node 2)

---

### ⚠️ PARTIAL / REFUSAL [sq11]

**Question:** In Transmittal 0014 for MTA Personnel and PMC Supplies, what items were submitted and what was their review status when returned?

**Retrieval:** domains=`documents,` · elapsed=`2.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806 Transmittal 0014 -  MTA Personnel and PMC Supplies.pdf`

**Answer:**

I could not find an exact indexed passage in a37806 transmittal 0014 - mta personnel and pmc that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ⚠️ PARTIAL / REFUSAL [sq12]

**Question:** What is in the Myrtle Ave Reserve Service Load Letter?

**Retrieval:** domains=`documents,` · elapsed=`1.6s` · cacheHit=`false`

**Sources retrieved:**

- `MYR_Reserve service.HEIC`

**Answer:**

I could not find an exact indexed passage in myr reserve service heic that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ✅ PASS [sq13]

**Question:** In the MTACD-MLJTC2-L-0017 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**Retrieval:** domains=`contracts,` · elapsed=`1.4s` · cacheHit=`false`

**Sources retrieved:**

- `2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE FX $109,450.00.pdf`

<details><summary>Chunk-level citations</summary>

- 2025-03-19 MTACD-MLJTC2-L-0017 Subcontractor Approval MASE FX $109,450.00.pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Approved Subcontractor
- (p. 1) The approved subcontractor is MASE FX.

## Scope of Work
- (p. 1) MASE FX is approved for Progress Photography and Video services.

## Contract Value
- (p. 1) The subcontract cost for MASE FX is set at $109,450.00.

---

### ✅ PASS [sq14]

**Question:** In the MTACD-MLJTC2-L-0028 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**Retrieval:** domains=`contracts,` · elapsed=`1.2s` · cacheHit=`false`

**Sources retrieved:**

- `2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf`

<details><summary>Chunk-level citations</summary>

- 2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Approved Subcontractor
- (p. 1) The approved subcontractor is Titanium Linx Consulting, Inc.

## Scope of Work
- (p. 1) The scope of work is Public Information & Outreach services, labor only.

## Contract Value
- (p. 1) The subcontract cost is valued at $213,840.00.

---

### ✅ PASS [sq15]

**Question:** In the MTACD-MLJTC2-L-0049 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**Retrieval:** domains=`contracts,` · elapsed=`3.1s` · cacheHit=`false`

**Sources retrieved:**

- `2025-06-10 MTACD-MLJTC2-L-0049 Sub-Contractor Approval ΓÇô McVac Environmental Services, Inc..pdf`

<details><summary>Chunk-level citations</summary>

- 2025-06-10 MTACD-MLJTC2-L-0049 Sub-Contractor Approval ΓÇô McVac Environmental Services, Inc..pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Approved Subcontractor
- (p. 1) McVac Environmental Services, Inc. is approved as the subcontractor.

## Scope of Work
- (p. 1) The subcontractor is responsible for vacuum excavation of test pits for subsurface utility engineering.

## Contract Value
- (p. 1) The subcontract cost is $142,638.73.

---

### ✅ PASS [sq16]

**Question:** In the MTACD-MLJTC2-L-0083 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**Retrieval:** domains=`contracts,` · elapsed=`1.3s` · cacheHit=`false`

**Sources retrieved:**

- `2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval ΓÇô American Geophysics Inc..pdf`

<details><summary>Chunk-level citations</summary>

- 2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval ΓÇô American Geophysics Inc..pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Approved Subcontractor
- (p. 1) The approved subcontractor is American Geophysics Inc.

## Scope of Work
- (p. 1) The scope of work for American Geophysics Inc. is underground subsurface investigation, limited to labor only with no material provided.

## Contract Value
- (p. 1) The subcontract cost for American Geophysics Inc. is $5,000.00.

---

### ✅ PASS [sq17]

**Question:** In the MTACD-MLJTC2-L-0093 subcontractor approval letter, what subcontractor is approved, what is their scope of work, and what is their contract value?

**Retrieval:** domains=`contracts,` · elapsed=`1.2s` · cacheHit=`false`

**Sources retrieved:**

- `2025-08-25 MTACD-MLJTC2-L-0093 - Sub-Contractor Approval ΓÇô Tri-State Civil Construction LLC.pdf`

<details><summary>Chunk-level citations</summary>

- 2025-08-25 MTACD-MLJTC2-L-0093 - Sub-Contractor Approval ΓÇô Tri-State Civil Construction LLC.pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Approved Subcontractor
- (p. 1) The approved subcontractor is Tri-State Civil Construction, LLC.

## Scope of Work
- (p. 1) The subcontractor's scope of work is to furnish and install micropiles.

## Contract Value
- (p. 1) The approved subcontract cost is $1,134,080.00.

---

### ❌ FAIL — wrong document [sq18]

**Question:** In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what rebar sizes and reinforcement details are shown for the elevator pit foundation mat?

**Retrieval:** domains=`documents` · elapsed=`3.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf chunk=0 (p. ?) rel=1.000

</details>

**Answer:**

## Answer
- The provided document summary for "a37806 03 20 00 avi-002r00 - aan -" indicates that it details "rebar sizes, spacing, lengths, and bending details" for concrete foundations.
- However, the specific rebar sizes and reinforcement details for the elevator pit foundation mat are "not fully visible in excerpt" (NODE 1).
- **Next step:** Open the document "a37806 03 20 00 avi-002r00 - aan -" and navigate to the relevant sheets detailing the elevator pit foundation mat.

---

### ✅ PASS [sq19]

**Question:** In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what is the submittal number, NYCT/MTA review status, and which spec section does it reference?

**Retrieval:** domains=`documents` · elapsed=`0.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf chunk=11 (p. 4) rel=1.000
- A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf chunk=15 (p. 5) rel=1.000
- A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf chunk=16 (p. 5) rel=1.000

</details>

**Answer:**

## Section 6.3 Requirements Summary (a37806 03 20 00 avi-002r01 - fio -)
- Reviewed indexed section evidence from page(s): 4, 5.
- Key requirements captured from the section:
- 43'-8 1/2" T/ OPNG 1 1 1 COATED REBAR EPOXY U.O.N.
- REP01ELEVATOR PIT REINFORCEMENT DETAILS (NORTH) AVENUE I STATION PACKAGE 6 BROOKLYN KM#25-067 - - GB 12/02/2025 0 12/02/2025 FOR APPROVAL 1 02/11/2026 AAN PER EOR MARKUPS (DTD.01.06.2026) & REVISED PER UPDATED SET (DTD.01.23.2026) & SK-044 (DTD.02.02.2026)...
- GB 12/02/2025 0 12/02/2025 FOR APPROVAL 1 02/11/2026 AAN PER EOR MARKUPS (DTD.01.06.2026) & REVISED PER UPDATED SET (DTD.01.23.2026) & SK-044 (DTD.02.02.2026) REV_1 ATLANTIC REINFORCING CONCRETE FOR FIELD USE PLEASE READ THIS DRAWING IN CONJUNCTION WITH FOU...
- AVI-CS-601 (DTD.01.23.2026) SEE DETAIL A MF2 12'-0" X 12'-0" X 3'-0" 1 CONCRETE EXPOSED TO EARTH OR WEATHER = 2" CONCRETE CAST AGAINST AND PERMANENTLY - EXPOSED TO EARTH = 3" 2.
- ENCASEMENT (TYP) FOR REINF REFER DWG REP01 (TYP) W14X90 W14X90 W14X90 W14X90 W14X90 W14X90 W14X90 W14X90 2x3 #4T3820 @10" TIES 2x2x3 #4T1220 @10" TIES COLUMN MARK SIZE (L X W) CP2 42" X 24" CONCRETE PILASTER SCHEDULE:- REF.

Evidence: a37806 03 20 00 avi-002r01 - fio - (p. 4, 5).

---

### ⚠️ PARTIAL / REFUSAL [sq20]

**Question:** In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what glazing spec items are referenced in the submittal?

**Retrieval:** domains=`documents` · elapsed=`0.2s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf`

**Answer:**

I could not find an exact indexed passage in a37806 14 24 00 bur-009r00 - aan - that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ⚠️ PARTIAL / REFUSAL [sq21]

**Question:** In BUR-009R00 for the EL539 Cab and Entrance Drawings, what is the NYCT/MTA review status and which spec section does this submittal cover?

**Retrieval:** domains=`documents` · elapsed=`0.2s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entrance Drawings-MTA.pdf`

**Answer:**

I could not find an exact indexed passage in a37806 14 24 00 bur-009r00 - r&r - that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ❌ FAIL — wrong document [sq22]

**Question:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what is the review status of this submittal.

**Retrieval:** domains=`documents` · elapsed=`1.4s` · cacheHit=`false`

**Sources retrieved:**

- `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf`

**Answer:**

I could not find an exact indexed passage in mljtc2 aecom atc 1 burnside avenue drawings that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ⚠️ PARTIAL / REFUSAL [sq23]

**Question:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, was the submittal approved and were there any comments?

**Retrieval:** domains=`documents` · elapsed=`1.1s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf`

**Answer:**

## Answer
- I could not find an exact indexed passage in a37806 08 45 25 bur-001r00 - fio - that answers this question.
- No evidence-backed specification text was verified in the retrieved chunks for this request.
- Refine with a section heading or exact phrase and I will search only this file again.
- **Evidence:** a37806 08 45 25 bur-001r00 - fio - (p. 3).

---

### ❌ FAIL — answer says info not found [sq24]

**Question:** What specification requirements govern controlled fills and excavation near the elevator?

**Retrieval:** domains=`documents` · elapsed=`8.9s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 10 20_GEN-001R02 - R&R - Requirements Compliance Table.pdf`
- `A37806_Volume_05 PRDC CONFORMED.pdf`
- `A37806_Volume_05_Project_Requirements_and_Design_Criteria_CONFORMED (25.01.09).pdf`
- `A-37806 PRDC CONFORMED 25.01.09.pdf`
- `20250109 A37806 - PRDC Conformed.pdf`
- `A-37806 PRDC CONFORMED 25.01.09 - Starting Submittals.pdf`
- `A37806 PRDC CONFORMED 25.01.09.pdf`
- `MarkedUp Volume_05_PRDC_CONFORMED.pdf`

**Answer:**

## Controlled and Uncontrolled Fills

- Section 4.11.1.A describes requirements for filling and backfilling under controlled and uncontrolled conditions (p. 434).
- "Fill" or "filling" refers to placement of soil, stone, or fractured rock materials (p. 434).
- This section applies to all project areas requiring such filling and backfilling (p. 434).
- The provided context does not contain specific requirements for excavation near the elevator, nor does it detail specific controlled fill requirements beyond the general description.

---

### ✅ PASS [sq25]

**Question:** In GEN-001R02 Elevator Walls Formwork Drawing, what is the NYCT/MTA submittal designation — is it for approval, information only, or designer review?

**Retrieval:** domains=`documents` · elapsed=`2.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_03 10 00_GEN-001R02 - RWC - Elevator Walls Formwork Drawing - MTA.pdf`

**Answer:**

## NYCT/MTA Submittal Designation

-   The submittal for GEN-001R02 Elevator Walls Formwork Drawing is designated "For Information Only" (FIO). (p. 4)
-   The submittal record explicitly states "Submittal Review Type: For Information" and "Detailed Description: A37806_03 10 00_GEN-001R02 - FIO - Elevator Walls Formwork Drawing - MTA". (p. 4)
-   The final disposition was "Reviewed with Comments" by the AE Reviewer. (p. 2)

---

### ✅ PASS [sq26]

**Question:** What pest control services are billed in Invoice 11707, which locations were serviced?

**Retrieval:** domains=`documents,` · elapsed=`1.4s` · cacheHit=`false`

**Sources retrieved:**

- `Invoice 11707 revised.pdf`

<details><summary>Chunk-level citations</summary>

- Invoice 11707 revised.pdf chunk=0 (p. ?) rel=1.000

</details>

**Answer:**

## Pest Control Services and Locations

-   **Services Billed:** Monthly pest control service (3 units at $350 each).
-   **Service Dates:** 2/5/2026, 2/12/2026, and 2/19/2026.
-   **Serviced Locations:** Middletown Stations.
-   **Billing Address:** MLJTC2 at 1010 Northern Blvd, Suite 200, Great Neck, NY.

---

### ✅ PASS [sq27]

**Question:** What services are billed in Invoice 11830 for the Middletown station locations, and what are the April 2026 service order numbers?

**Retrieval:** domains=`documents,` · elapsed=`1.5s` · cacheHit=`false`

**Sources retrieved:**

- `Invoice 11830.pdf`

<details><summary>Chunk-level citations</summary>

- Invoice 11830.pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Services Billed
- (p. 1) Invoice 11830 bills for monthly pest control service for one bait station over four visits, including reports, at Middletown Stations.

## April 2026 Service Order Numbers
- (p. 1) The April 2026 service order numbers are 3421 for 4/2/2026, 3488 for 4/9/2026, 3548 for 4/16/2026, and 3645 for 4/23/2026.

---

### ✅ PASS [sq28]

**Question:** In Lockton Invoice 0849812, what are the remittance instructions and how should payment be submitted?

**Retrieval:** domains=`documents,` · elapsed=`1.8s` · cacheHit=`false`

**Sources retrieved:**

- `2025 Lockton Invoice 0849812.pdf`

<details><summary>Chunk-level citations</summary>

- 2025 Lockton Invoice 0849812.pdf chunk=2 (p. 1) rel=1.000
- 2025 Lockton Invoice 0849812.pdf chunk=3 (p. 1) rel=1.000

</details>

**Answer:**

## Remittance Instructions
- (p. 1) For ACH or wire transfer, include an addenda record starting with "INV", followed by a space, then the invoice number, and ending with an asterisk.
- (p. 1) Email remittance details to clientpayments@lockton.com.

## Payment Method
- (p. 1) Submit payment via ACH or wire transfer to Bank of America, using SWIFT BOFAUS3N, Wire Account #004832042517, Wire Routing #026009593, ACH Account #004832042517, and ACH Routing #021000322.
- (p. 1) Submit payment via check to Lockton Companies, LLC c/o Bank of America, PO Box 3207, Boston, MA 02241-3207.
- (p. 1) All payments must be made in USD.

---

### ✅ PASS [sq29]

**Question:** In Lockton Invoice 0849812, what is the total invoiced amount?

**Retrieval:** domains=`documents,` · elapsed=`1.1s` · cacheHit=`false`

**Sources retrieved:**

- `2025 Lockton Invoice 0849812.pdf`

<details><summary>Chunk-level citations</summary>

- 2025 Lockton Invoice 0849812.pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Total Invoiced Amount
- (p. 1) The total invoiced amount for Invoice 0849812 is $14,990.00, which is the premium for a Performance and Payment Bond.

---

### ✅ PASS [sq30]

**Question:** In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 6, 2025 — what were the ticket number, labor hours, and rates?

**Retrieval:** domains=`documents,` · elapsed=`2.1s` · cacheHit=`false`

**Sources retrieved:**

- `Backup for Invoice#01.pdf`

<details><summary>Chunk-level citations</summary>

- Backup for Invoice#01.pdf chunk=5 (p. 4) rel=1.000
- Backup for Invoice#01.pdf chunk=2 (p. 1) rel=1.000
- Backup for Invoice#01.pdf chunk=3 (p. 2) rel=1.000
- Backup for Invoice#01.pdf chunk=4 (p. 3) rel=1.000
- Backup for Invoice#01.pdf chunk=6 (p. 5) rel=1.000

</details>

**Answer:**

## Lead Abatement T&M Work
- (p. 4) Crossroads JV performed lead abatement work at Burnside Street Station on December 6, 2025, under ticket number 6198.
- (p. 4) The work involved mobilizing to the job site, off-loading materials, building lead abatement containment, and needle-gunning structural span areas.
- (p. 4) Crossroads JV employees worked a total of 88 overtime hours on December 6, 2025.
- (p. 4) The individual labor hours for December 6, 2025, were: Gregorio Almonte (10 hrs OT), Mark Miller (8 hrs OT), Siam Jamerson (10 hrs OT), Ilias Sioutos (5 hrs OT, 5 PT OT), Soamdatt Hansraj (5 hrs OT, 5 hrs PT OT), Shaquan Huey (5 hrs OT, 5 hrs PT OT), Kerem Gas (5 hrs OT, 5 hrs PT OT), Christopher Broomes (5 hrs OT, 5 hrs PT OT), and Robert Hemberger (5 hrs OT, 5 hrs PT OT).
- (p. 1) The overtime crewday rate for the lead abatement work was $4,200.

---

### ✅ PASS [sq31]

**Question:** In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 7, 2025 — what were the ticket number, labor hours, and rates?

**Retrieval:** domains=`documents,` · elapsed=`5.3s` · cacheHit=`false`

**Sources retrieved:**

- `Backup for Invoice#01.pdf`

<details><summary>Chunk-level citations</summary>

- Backup for Invoice#01.pdf chunk=5 (p. 4) rel=1.000
- Backup for Invoice#01.pdf chunk=2 (p. 1) rel=1.000
- Backup for Invoice#01.pdf chunk=3 (p. 2) rel=1.000
- Backup for Invoice#01.pdf chunk=4 (p. 3) rel=1.000
- Backup for Invoice#01.pdf chunk=6 (p. 5) rel=1.000

</details>

**Answer:**

## Lead Abatement T&M Work
- (p. 4) Crossroads JV performed lead abatement work at Burnside Street Station on December 7, 2025, under ticket number 6199.
- (p. 4) The work involved re-mobilizing materials, reconstructing lead abatement containment, and needle-gunning operations, abating 195.06 square feet.
- (p. 4) The total overtime hours for December 7, 2025, were 83 hours.
- (p. 4) The individual labor hours and rate types for December 7, 2025, were: Gregorio Almonte (11 hrs OT, 806 Foreman), Siam Jamerson (6 hrs OT, 806), Ilias Sioutos (5 hrs OT, 806; 6 hrs PT OT), Soamdatt Hansraj (5 hrs OT, 806; 6 hrs PT OT), Shaquan Huey (5 hrs OT, 806; 6 hrs PT OT), Kerem Gas (5 hrs OT, 806; 6 hrs PT OT), Christopher Broomes (5 hrs OT, 806; 6 hrs PT OT), and Robert Hemberger (5 hrs OT, 806; 6 hrs PT OT).
- (p. 1, p. 3) The overtime crewday rate for lead abatement work is $4,200.

---

### ❌ FAIL — answer says info not found [sq33]

**Question:** In Invoice#01 dated December 31, 2025, what retainage amounts and net payment due are shown on the G703 continuation sheet?

**Retrieval:** domains=`documents,` · elapsed=`4.7s` · cacheHit=`false`

**Sources retrieved:**

- `2025-10-21 Eagle Business Machine Inv# 129318 $43.55 (M017 99-1530).pdf`

**Answer:**

## Answer
- The requested Invoice#01 dated December 31, 2025, is not available in the provided context.
- The only invoice found is "2025-10-21 Eagle Business Machine Inv# 129318 $43.55" (NODE 1).
- **Next step:** Provide the correct invoice document for analysis.

---

### ✅ PASS [sq34]

**Question:** In GEN-042R00, the A37806 & C49321R Coordination Meeting what was discussed?

**Retrieval:** domains=`documents,` · elapsed=`3.7s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf chunk=5 (p. 4) rel=6.000
- A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf chunk=6 (p. 4) rel=6.000

</details>

**Answer:**

## A37806 & C49321R Coordination Meeting Discussion

-   **Previous Meeting:** Discussion included the meeting held on April 9, 2025 (p. 4).
-   **Safe-Span Shielding Removal:** Ahern stated the "Safe-Span" shielding removal, previously scheduled for October 2025, is now scheduled for January 2026 (p. 4).
-   **Shielding Removal Constraint:** Shielding at Myrtle Ave Station cannot be removed until Ahern's contract work is completed all the way to Flushing Ave Station due to continuous cables (p. 4).
-   **Street Occupancy:** Ahern confirmed they will not be occupying the street by MLJTC2's mobilization date; water barriers, column encasements, and equipment will be removed (p. 4).
-   **Impacted MLJTC2 Activities:** MLJTC2 discussed potential impacts on Sewer CCTV Survey, sewer installation, survey, and installation of MLJTC2's own demo shielding due to the existing shielding (p. 4).
-   **Shielding Modification Accommodation:** Ahern offered to remove shield panels and spread support cables for increased vertical clearance, requesting 1+ weeks' notice from MLJTC2 (p. 4).
-   **Access to Shielding:** Ahern offered MLJTC2 access to the shielding for work while installed, contingent on a signed agreement (p. 4).
-   **Schedule Impact Review:** MLJTC2 will review their GO forecast and schedule to determine impacts from Ahern's shield presence (p. 4).
-   **General Orders (GOs):** Ahern and WSP noted GOs for contract C24921R in 2026, including Myrtle Ave Station. MLJTC2 stated the same for Contract A37806 (p. 4).
-   **Requested GO Forecast:** MLJTC2 requested a copy of the GO forecast for Contract C34921R, including tracks, limits, and dates (p. 4).
-   **Action Items:**
    -   Ahern to send MLJTC2 a draft agreement for shielding access (Open) (p. 4).
    -   Naik/TYLin to send MLJTC2 the GO forecast for Contract C34921R (Open) (p. 4).
    -   MLJTC2 to notify Ahern (p. 4).

---

### ❌ FAIL — answer says info not found [sq35]

**Question:** What was discussed in the September 3, 2025 coordination meeting?

**Retrieval:** domains=`documents,` · elapsed=`3.6s` · cacheHit=`false`

**Sources retrieved:**

- `17 A37806 Utility Coordination_May 2026.docx`
- `37135_02FF_QBP_001R00 - (NET) - GEI QBP Instrumentation Work PlanDMC.pdf`
- `A37806_PRDC14-004R02 - APP-EAN - Elevator Inspection and Testing Plan (I&TP).pdf`
- `2025-07-21 EnrollmentOnly.pdf`
- `20250626_EDU02C_NOR_100%_Drawings_Struct-AECOM_CR - 06192025R2.pdf`
- `AEIS LLC_IRF_A37806_0006 - Middletown Back Fill-091725 & 091825.pdf`
- `Copy of A37806_01 10 30_GEN-001R01 - Phasing Plan (ADA Package 6) - Operations Planning Comment Log (003).xlsx`
- `20252710_DU03_100%_Dwgs_Civil_QA_AECOM.pdf`

<details><summary>Chunk-level citations</summary>

- 17 A37806 Utility Coordination_May 2026.docx chunk=7 (p. ?) rel=0.981

</details>

**Answer:**

The provided documents do not contain information about a coordination meeting on September 3, 2025. The closest relevant dates are:

- **November 7, 2025:** Transmittal letter for Elevator Inspection and Testing Plan (I&TP) (p. 1).
- **July 20, 2025:** Date of an enrollment-only report (p. 1).
- **May 2026:** Date of a utility coordination report.

To answer your query, a meeting minute log or specific coordination meeting agenda for September 2025 would be needed.

---

### ⚠️ PARTIAL / REFUSAL [sq36]

**Question:** In A37806 Kick Off Pre-Work Conference, what does the document state?

**Retrieval:** domains=`documents,` · elapsed=`1.4s` · cacheHit=`false`

**Sources retrieved:**

- `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx`

**Answer:**

I could not find an exact indexed passage in a37806 presentation comm kick-off 09 16 2025 r2 that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ⚠️ PARTIAL / REFUSAL [sq37]

**Question:** In A37806 Kick Off Pre-Work Conference, what does the document state about project milestones and work sequencing?

**Retrieval:** domains=`scheduling,` · elapsed=`1.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx`

**Answer:**

I could not find an exact indexed passage in a37806 presentation comm kick-off 09 16 2025 r2 that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ❌ FAIL — answer says info not found [sq38]

**Question:** In the July 24, 2025 Monthly Job Progress Meeting, which MLJ Contracting and TC Electric staff attended and presented?

**Retrieval:** domains=`contracts` · elapsed=`3.1s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=9 (p. 5) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=13 (p. 7) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=25 (p. 12) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=26 (p. 12) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=2 (p. 1) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=4 (p. 3) rel=1.000

</details>

**Answer:**

## July 24, 2025 Monthly Job Progress Meeting Attendees

The provided document lists the "Monthly Job Progress Meeting" on July 24, 2025 (p. 12). However, it does not specify which MLJ Contracting or TC Electric staff attended or presented at this meeting.

Next step: Review the meeting minutes for the "Monthly Job Progress Meeting Minutes 07.24.25" (p. 7) to identify attendees and presenters.

---

### ❌ FAIL — answer says info not found [sq39]

**Question:** In the July 24, 2025 Monthly Job Progress Meeting, which external consultants from firms such as T.Y. Lin attended?

**Retrieval:** domains=`documents` · elapsed=`3.5s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=26 (p. 12) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=9 (p. 5) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=13 (p. 7) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=16 (p. 8) rel=1.000
- A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025.pdf chunk=27 (p. 12) rel=1.000

</details>

**Answer:**

## Monthly Job Progress Meeting Attendees

The provided document, "A37806_01 31 30_GEN-007R00 - FIO - Monthly Progress Report - July 2025," lists the "Monthly Job Progress Meeting" on July 24, 2025 (p. 12). However, it does not detail which external consultants from firms such as T.Y. Lin attended this meeting.

Next step: Review the meeting minutes for the "Monthly Job Progress Meeting 07.24.25" (A37806_01 30 20_GEN-029R00) for attendee information.

---

### ✅ PASS [sq40]

**Question:** In the May 28, 2026 Monthly Job Progress Meeting Minutes, what is the current status of CPR-003 Revision 2 and the open Burnside Avenue DOT Option Work item?

**Retrieval:** domains=`communication` · elapsed=`3.9s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=8 (p. 3) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=23 (p. 8) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=24 (p. 8) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=39 (p. 14) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=41 (p. 15) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=42 (p. 15) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=43 (p. 16) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=4 (p. 2) rel=1.000

</details>

**Answer:**

## CPR-003 Revision 2 Status
- (p. 8) MLJTC2 is providing a proposal for the revised CPR-003, which was received on March 26, 2026.
- (p. 8) This work is delaying the job because girder repairs are needed before canopy framing and platform slab can be installed.
- (p. 8) The change will require escalation to the BUCC and ECC before a notice-to-proceed can be issued.
- (p. 6) CPR-003 R1 Norwood Avenue SOGR (Unilateral received) is a cost proposal pending submission.

## Burnside Avenue DOT Option Work Status
- (p. 1) DOT/DEP needs to provide clarifications, and PMC needs to issue a formal CPR for additional DOT Option Work at Burnside.
- (p. 6) A CPR is awaited for the Burnside Ave ΓÇô Additional Option Work Scope.
- (p. 14) PMC is to provide a date for a meeting with DOT regarding Burnside Avenue.

---

### ❌ FAIL — answer says info not found [sq41]

**Question:** In the May 28, 2026 Monthly Job Progress Meeting, how many Grade Operations have been completed across the project stations, and how are they distributed across Myrtle, Burnside, and Avenue I?

**Retrieval:** domains=`documents,` · elapsed=`3.5s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=44 (p. 16) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=23 (p. 8) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=30 (p. 10) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=34 (p. 12) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=39 (p. 14) rel=1.000
- A37806_01 31 30_GEN-024R00 - FIO - Monthly Progress Report - May 2026.pdf chunk=582 (p. 110) rel=1.000

</details>

**Answer:**

## Answer
- The provided document, "a37806 01 31 30 gen-024r00 - fio -", does not contain a summary or breakdown of completed Grade Operations (GO) across project stations.
- It mentions "Weekly Weekend GO De-Brief on Tuesdays" (p. 16) and "ConEdΓÇÖs delays are currently threatening the WE GO work scheduled for July 18, 2026" (p. 4), but does not quantify completed GOs.
- To answer this question, a document specifically detailing the status or completion of Grade Operations would be needed.

---

### ✅ PASS [sq42]

**Question:** In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what are the open SDI coordination action items and their target completion dates?

**Retrieval:** domains=`documents,` · elapsed=`3.7s` · cacheHit=`false`

**Sources retrieved:**

- `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`

<details><summary>Chunk-level citations</summary>

- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=0 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=2 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=4 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=5 (p. ?) rel=1.000

</details>

**Answer:**

## Open SDI Coordination Action Items
- (p. 4) SDI must provide general subcontract coordination by December 19, 2025.
- (p. 4) SDI must obtain general OCIP and sub approval for the surveyor by December 22, 2025.
- (p. 4) SDI/MLJ must complete general SWPs and QWPs/CWPs by January 14, 2026.
- (p. 4) SDI/MLJ must complete the general Quality Management Plan by January 14, 2026.
- (p. 4) SDI/MLJ must track general training needs.
- (p. 4) SDI must provide the general mullion material sample by January 9, 2026.
- (p. 4) SDI must provide the general roofing material sample by December 26, 2025.
- (p. 4) SDI must address general roofing material lead times by December 17, 2025.
- (p. 4) SDI must provide the Middletown Rd Elevator EL541 Enclosure Shop Drawing Status by December 22, 2025.
- (p. 4) MLJ/SDI must discuss Middletown Rd glass material release.
- (p. 4) SDI must provide the Middletown Rd Roofing Shop Drawing Status for Elevator Towers by December 22, 2025.
- (p. 4) SDI must provide the Middletown Rd Roofing Shop Drawing Status for Platform Extension.
- (p. 4) SDI must detail around the existing signal tray at Avenue I by December 19, 2025.

---

### ✅ PASS [sq43]

**Question:** In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what is the status of OCIP approval and subcontractor approval for the surveyor?

**Retrieval:** domains=`contracts,` · elapsed=`2.7s` · cacheHit=`false`

**Sources retrieved:**

- `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`

<details><summary>Chunk-level citations</summary>

- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=0 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=5 (p. ?) rel=1.000
- SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx chunk=2 (p. ?) rel=1.000

</details>

**Answer:**

## OCIP Approval Status
- (p. 1) OCIP approval is pending from MTA.
- (p. 2) The general OCIP approval is due from MTA on 12/19/2025.

## Surveyor Subcontractor Approval Status
- (p. 1) Surveyor approval is targeted for 12/22/2025.
- (p. 2) SDI is responsible for the general OCIP and sub approval for the surveyor, due on 12/22/2025.

---

### ✅ PASS [sq44]

**Question:** What current permits are submitted for Burnside Ave.

**Retrieval:** domains=`documents` · elapsed=`5.4s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 33 00_GEN-019R00 - Submittal Register July 2026.pdf`
- `3.1 -A37806_01 33 00_GEN-018R00 - Submittal Register June 2026.pdf`
- `A37806_01 33 00_GEN-018R00 - Submittal Register June 2026.pdf`
- `A37806_01 33 00_GEN-017R00 - Submittal Register May 2026.pdf`
- `A37806_01 33 00_GEN-013R00 - Submittal Register January 2026.pdf`
- `A37806_01 33 00_GEN-014R00 - RWC - Submittal Register February 2026.pdf`
- `A37806_01 33 00_GEN-015R00 - Submittal Register March 2026.pdf`
- `A37806_01 40 30_BUR-006R01 - RES - Variance Application Package - Burnside Ave Station.pdf`

**Answer:**

## Burnside Ave Permits

- **Variance Application Package**: A37806_01 40 30_BUR-006R01, status RES (p. 1)
- **Structural Steel Foundations and Fire Standpipe Relocation**: A37806_01 10 20_BUR-043R01, submitted for approval 10/6/2025, Revise & Resubmit (p. 2)
- **Structural Steel Foundations and Fire Standpipe Relocation**: A37806_01 10 20_BUR-043R02, submitted for approval 2/3/2026, Revise & Resubmit (p. 2)
- **Burnside Avenue Review and Comment**: A37806_01 10 20_BUR-044R00, approved 3/23/2026 (p. 2)
- **Utility Relocations at Burnside Avenue**: A37806_01 10 20_BUR-056R00, submitted for approval 10/29/2025, Approved Except as Noted (p. 2)
- **Burnside Ave (FINAL - 100)**: A37806_01 10 20_BUR-061R00, submitted for information 12/4/2025, Approved (p. 2)

---

### ✅ PASS [sq45]

**Question:** What current permits are submitted for Ave I.

**Retrieval:** domains=`documents` · elapsed=`1.7s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 33 10_AVI-001R00 - FIO - DOT Permits Exp. 05.30.25.pdf`
- `A37806_01 33 10_AVI-002R00 - FIO - Tree Work Permits.pdf`

**Answer:**

## AVI Permit Submittals
The following permit-related submittal files are on record for AVI:

- a37806 01 33 10 avi-001r00 - fio -
- a37806 01 33 10 avi-002r00 - fio -

---

### ✅ PASS [sq46]

**Question:** What current permits are submitted for Myrtle Ave.

**Retrieval:** domains=`documents` · elapsed=`5.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 33 10_MYR-001R00 - FIO - DOT Permits Exp. 05.23.25.pdf`
- `A37806_01 35 10_GEN-070R07 - R&R - SWP-007 - Installation of Platform Barricade.pdf`
- `A37806_01 33 10_MYR-004R01 - FIO - Myrtle Ave MPT Plans.pdf`
- `2025.11.07 DOT PERMITS EXP 11-07 & 11-21-25 AMENDED (Myrtle Ave Station).pdf`
- `3.1- A37806_01 33 00_GEN-016R00 - Submittal Register April 2026.pdf`
- `A37806_01 33 10_MYR-003R00 - FIO - DOT Permits Exp. 11.07.25.pdf`
- `2026.02.01 DOT PERMITS EXP 2-01-26 NEW (Myrtle Ave Station).pdf`
- `7.a DOT PERMITS EXP 3-08 & 3-13-26.pdf`

**Answer:**

## Current Myrtle Ave Permits

- **Myrtle Ave MPT Plans (A37806_01 33 10_MYR-004R01)**: Submittal status FIO, dated 12/05/2025 (NODE 2).
- **NYC DEP Watermain Relocation Permit (A37806_01 33 10_MYR-008R00)**: For Information, dated 11/25/2025 (NODE 3, p. 5).
- **DOT Master Lease (A37806_01 33 10_MYR-009R00)**: For Information, dated 4/30/2026 (NODE 3, p. 5).
- **DOT Permits Expiring 11/21/2025 (Amended)**: Issued 10/17/2025, valid 10/17/2025 to 11/21/2025 (NODE 4).
- **DOT Permits Expiring 2/1/2026 (New)**: Issued 1/21/2026, valid 1/21/2026 to 2/1/2026 (NODE 5).
- **DOT Permits Expiring 3/8/2026 & 3/13/2026 (New & Renewed)** (NODE 6).
- **DOT Permits Expiring 05/23/2025 (A37806_01 33 10_MYR-001R00)**: Submittal status FIO, reviewed 04/09/2025 (NODE 7).

---

### ✅ PASS [sq47]

**Question:** What current permits are submitted for Middletown Ave.

**Retrieval:** domains=`documents` · elapsed=`1.6s` · cacheHit=`false`

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

---

### ✅ PASS [sq48]

**Question:** What current permits are submitted for Norwood Ave.

**Retrieval:** domains=`documents` · elapsed=`5.1s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 33 00_GEN-013R00 - Submittal Register January 2026.pdf`
- `A37806_01 33 00_GEN-005R00 - FIO - Submittal Register May 2025.pdf`
- `A37806_01 33 10_NOR-002R00 - FIO - DOT Permits Arlington Ave Expiring 05.23.25.pdf`
- `A37806_01 40 30_NOR-005R01 - RES - Variance Application Package - Norwood Ave Station.pdf`
- `A37806_01 33 10_NOR-010R00 - FIO - Norwood DOT Road Closure Permits Expiring 12.31.2025.pdf`
- `norwood 2272025 - GO Markup.pdf`
- `12 RENEWED PERMITS - NORWOOD AVE [26195.MLJ.DOT] EXP 6-1-26.pdf`
- `Permit Filings Estimating - Norwood 2252025.xlsx`

**Answer:**

## Current Norwood Ave Permits

- **DOT Permits Arlington Ave**: Expiring 05/23/2025 (a37806 01 33 10 nor-002r00 - fio -)
- **Norwood DOT Road Closure Permits**: Expiring 12/31/2025 (a37806 01 33 10 nor-010r00 - fio -)
- **12 Renewed Permits - Fulton St (btw Hale Ave & Norwood Ave)**: Expiring 06/01/2026 (12 renewed permits - norwood ave [26195 mlj)
- **Variance Application Package - Norwood Ave Station**: Expiring 06/23/2025 (s)
- **DOT Permit for Norwood**: Status Open, For Information (no, p. 4)

---

### ✅ PASS [sq49]

**Question:** In MDT-005R00 Middletown Tree Work Permit, what nursery standards must replacement tree materials meet, and what happens to rejected material on site?

**Retrieval:** domains=`field_ops` · elapsed=`5.4s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=15 (p. 4) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=16 (p. 4) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=11 (p. 4) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=2 (p. 1) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=14 (p. 4) rel=1.000
- A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf chunk=13 (p. 4) rel=1.000

</details>

**Answer:**

## Replacement Tree Material Standards

-   **Nursery Standards:** Materials must conform to the most recent American Association of Nurserymen Standards (p. 4).
-   **Tree Diameter:** At least 2.5 inches measured 6 inches from the ground, and no larger than 3.5 inches, unless authorized by Parks (p. 4).
-   **Quality:** Normal, well-developed branches, fibrous root system, sound, healthy, vigorous, and free from defects (p. 4).
-   **Root Ball:** Balled and burlapped with a solid earth ball of minimum specified size, secured by burlap and sisal twine (p. 4). No nylon burlap or rope permitted (p. 4).
-   **Trunk:** No tree trunks shall be wrapped (p. 4).
-   **Crowns:** Crowns of young trees shall not be cut back to compensate for root loss (p. 4).

## Rejected Material On-Site

-   All rejected material must be immediately removed from the site (p. 4).
-   Rejected material must be replaced with acceptable material at no additional cost to Parks (p. 4).

---

### ✅ PASS [sq54]

**Question:** In BUR-081R00 January 2026 Construction Photos, what work is shown in progress on the Burnside Avenue northbound side on January 20, 2026?

**Retrieval:** domains=`documents,` · elapsed=`2.5s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf`

**Answer:**

## Burnside Avenue Northbound Work - January 20, 2026

- Maintenance and Protection of Traffic (MPT) (p. 2)
- Con Edison utility relocation work trench with road plate protection (p. 2)
- Demolition shielding installation in progress (p. 2)
- MPT lead storage container (p. 3)

---

### ✅ PASS [sq55]

**Question:** In BUR-081R00 January 2026 Construction Photos, what MPT setup and ConEd utility relocation work is documented at the Burnside Avenue northbound side?

**Retrieval:** domains=`documents,` · elapsed=`2.6s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf`

**Answer:**

## Burnside Avenue NB MPT and ConEd Relocation Work

- MPT setup is documented in images 1-4. (p. 2)
- Con Edison utility relocation trench work with road plate protection is shown in images 5-11, 21-25. (p. 2)
- MPT lead storage container is documented in image 20. (p. 2)
- Demolition shielding installation is in progress in images 12-19, 23-25. (p. 2)
- All photos were taken on January 20, 2026. (p. 2)

---

### ❌ FAIL — wrong document [sq56]

**Question:** In BUR-080R00 Burnside December 2025 Construction Photos, what track shielding work was shown?

**Retrieval:** domains=`documents,` · elapsed=`1.4s` · cacheHit=`false`

**Sources retrieved:**

- `Photo Apr 02 2025, 8 12 26 AM.jpg`

**Answer:**

I could not find an exact indexed passage in photo apr 02 2025, 8 12 26 am that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ❌ FAIL — wrong document [sq57]

**Question:** In BUR-080R00 Burnside December 2025 Construction Photos, what MPT setup and shielding installation preparation is documented on the northbound side?

**Retrieval:** domains=`documents,` · elapsed=`1.3s` · cacheHit=`false`

**Sources retrieved:**

- `Photo Apr 02 2025, 8 12 26 AM.jpg`

**Answer:**

I could not find an exact indexed passage in photo apr 02 2025, 8 12 26 am that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ✅ PASS [sq58]

**Question:** In MYR-076R00 Myrtle December 2025 Construction Photos, what ADA accessibility upgrade work is shown in the December 19, 2025 photos at Myrtle Avenue station?

**Retrieval:** domains=`documents,` · elapsed=`2.7s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`

**Answer:**

## ADA Accessibility Work - Myrtle Avenue Station

- The December 19, 2025 photos show installation of vibration monitoring equipment. (p. 3)
- This work is part of Contract A-37806, "Design-Build Services for Accessibility Upgrades - Package 6." (p. 1, 3)
- Package 6 includes accessibility upgrades at five stations and component upgrades at one station. (p. 3)

---

### ❌ FAIL — enumerates options instead of identifying selected value [sq59]

**Question:** In MYR-076R00 Myrtle December 2025 Construction Photos, what is the submittal designation — NYCT/MTA information only, approval, or designer review?

**Retrieval:** domains=`documents` · elapsed=`2.5s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`

**Answer:**

## Submittal Designation for MYR-076R00

-   NYCT/MTA Review & Comment (p. 1)
-   NYCT/MTA Approval (p. 1)
-   Designer Approval (p. 1)
-   NYCT/MTA Information Only (p. 1)
-   Designer Information Only (p. 1)

---

### ⚠️ PARTIAL / REFUSAL [sq60]

**Question:** In the May 13, 2025 Burnside Avenue VECP Presentation, what is the value engineering background — what submissions were made to MTA and what verbal approval was received from NYC DOT?

**Retrieval:** domains=`documents,` · elapsed=`2.3s` · cacheHit=`false`

**Sources retrieved:**

- `0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf`

<details><summary>Chunk-level citations</summary>

- 0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf chunk=2 (p. 1) rel=1.000
- 0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf chunk=3 (p. 1) rel=1.000

</details>

**Answer:**

## Value Engineering Background
- Could not verify value engineering background in the retrieved passages.
- Could not verify submissions made to MTA in the retrieved passages.
- Could not verify verbal approval received from NYC DOT in the retrieved passages.

---

### ⚠️ PARTIAL / REFUSAL [sq61]

**Question:** In the Burnside Avenue VECP Presentation, what ADA accessibility upgrade scope is being value-engineered and when was the final presentation delivered?

**Retrieval:** domains=`documents,` · elapsed=`1.3s` · cacheHit=`false`

**Sources retrieved:**

- `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf`

**Answer:**

I could not find an exact indexed passage in ak a37806 volume 08a bx burnside ave option that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ⚠️ PARTIAL / REFUSAL [sq62]

**Question:** In PRO 26-01 Control of Project Nonconforming Items, what does the NCR process flowchart show — who are the originator, Contractor QM, PMT QM, and DOR roles?

**Retrieval:** domains=`contracts` · elapsed=`1.3s` · cacheHit=`false`

**Sources retrieved:**

- `MLJ Projection- Con Ed wingback T&E.xlsx`

**Answer:**

I could not find an exact indexed passage in mlj projection- con ed wingback t&e that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ✅ PASS [sq63]

**Question:** In GEN-006R01 NCR Template & Log, what data does PRO 26-01 require in the NCR Log for tracking nonconforming items?

**Retrieval:** domains=`documents,` · elapsed=`2.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 40 10_GEN-006R01 - AEAN - NCR Template & Log.pdf`

**Answer:**

## NCR Log Required Data

-   Date (p. 4, 5)
-   NCR No. (p. 4, 5)
-   Brief Description of Non-Conformity (p. 4, 5)
-   Raised By (p. 4, 5)
-   Date of Issuance (p. 4, 5)
-   Location (p. 4, 5)
-   Responsible Party / Subcontractor (p. 4, 5)
-   Disposition (p. 4, 5)
-   Verification (p. 4, 5)
-   Initial Status (p. 4, 5)
-   Date Closed (p. 4, 5)

---

### ⚠️ PARTIAL / REFUSAL [sq64]

**Question:** Summarize what is in A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf

**Retrieval:** domains=`documents` · elapsed=`0.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf`

**Answer:**

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

---

### ⚠️ PARTIAL / REFUSAL [sq65]

**Question:** In J-TRACK-13A-041R00 Material I&T Request for 100-8 6-hole joint bar, what is the inspection item description, what quantity is requested, and what ASTM standard governs the material?

**Retrieval:** domains=`field_ops,` · elapsed=`2.9s` · cacheHit=`false`

**Sources retrieved:**

- `A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF`

<details><summary>Chunk-level citations</summary>

- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=26 (p. 18) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=2 (p. 1) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=5 (p. 4) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=8 (p. 7) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=9 (p. 8) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=11 (p. 10) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=12 (p. 11) rel=1.000
- A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF chunk=10 (p. 9) rel=1.000

</details>

**Answer:**

## Inspection Item Description
- (p. 1, 3, 5, 6) The inspection item is a Material I&T Request for a 100-8 (6 Hole) Joint Bar, 36 inches long.

## Quantity Requested
- (p. 1, 3, 5, 6) The quantity requested for the 100-8 (6 Hole) Joint Bar is 59 pairs.

## ASTM Standard
- Could not verify ASTM standard in the retrieved passages.

---

### ⚠️ PARTIAL / REFUSAL [sq66]

**Question:** In RFI-0115 for the Myrtle Avenue Louver Exhaust Face Velocity issue, what exhaust velocity problem is described and what spec section or direction is referenced?

**Retrieval:** domains=`documents` · elapsed=`1.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_RFI-0115 - CLO - Louver Exhaust Face Velocity 09.04.25.pdf`

**Answer:**

I could not find an exact indexed passage in a37806 rfi-0115 - clo - louver exhaust face that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

---

### ✅ PASS [sq67]

**Question:** In RFI098 for the Ave I Conductor Board at Station 489+00, what is the issue with the conductor board on the northbound platform at Track B2 and what drawing is referenced?

**Retrieval:** domains=`documents` · elapsed=`3.1s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=2 (p. 1) rel=1.000
- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=3 (p. 1) rel=1.000
- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=4 (p. 2) rel=1.000
- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=5 (p. 3) rel=1.000

</details>

**Answer:**

## Conductor Board Issue
- (p. 1) The conductor board at Sta. 489+00 on the northbound platform (Track B2) appears to correspond to a 4-car train, but the drawing does not include an ADA boarding area there.
- (p. 1, p. 3) The ADA Path of Travel drawing (AVI-G-122) does not show a boarding area or ADA Path of Travel at Sta 489+00.

## Referenced Drawing
- (p. 1) Drawing AVI-G-103 in Volume 8.01 depicts a 40-ft long boarding area on the northbound platform (track B2) centered on the conductor board at Sta 490+00.
- (p. 1) The ADA Path of Travel drawing (AVI-G-122) from Volume 8.10 shows an ADA boarding area and ADA Path of Travel to it at STA 490+00.

---

### ✅ PASS [sq68]

**Question:** In RFI098 for the Ave I Conductor Board, what figures are provided showing the conductor board conditions at Station 489+00 and approximately Station 490+00?

**Retrieval:** domains=`documents` · elapsed=`2.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Conductor Board Figures in RFI098

- **Station 490+00:** Figure 1 (p. 1) depicts the conductor board.
- **Station 489+00:** Figure 2 (p. 1) depicts the conductor board.
- **4-Car Train Conductor Board:** Figure 3 (p. 1) also relates to the 4-car train conductor board at Sta 489+00.

---

### ✅ PASS [sq69]

**Question:** In A37806 RFI096, what are the northbound and southbound platform stair and exit configurations shown on the referenced drawings?

**Retrieval:** domains=`documents` · elapsed=`2.6s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=68 (p. 23) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=2 (p. 1) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=19 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=26 (p. 7) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=3 (p. 1) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=14 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=15 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=23 (p. 7) rel=1.000

</details>

**Answer:**

## Platform Configurations
- (p. 23) The drawing shows a northbound and southbound platform plan at a scale of 1" = 50'-0".
- (p. 1, 7) New stairs and elevator shafts will be constructed at the platform level at Myrtle Ave. station under contract A37806.

---

### ⚠️ PARTIAL / REFUSAL [sq70]

**Question:** In A37806 RFI096, what ADA upgrade drawing and platform detail is referenced for the McDonald Avenue station?

**Retrieval:** domains=`documents` · elapsed=`2.5s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=2 (p. 1) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=17 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=4 (p. 2) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=15 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=16 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=23 (p. 7) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=20 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Norwood ONLY.pdf chunk=27 (p. 7) rel=1.000

</details>

**Answer:**

## ADA Upgrade Drawing
- Could not verify ADA upgrade drawing in the retrieved passages.

## Platform Detail
- (p. 1, p. 12) Provide design and/or shop drawings for contract W47032 to evaluate potential equipment and wiring relocations at Norwood Ave. and Myrtle Ave. stations, where cable troughs will be impacted by new stairs and elevator shaft construction.

---

### ❌ FAIL — wrong document [sq71]

**Question:** In MYR-002R00 Myrtle Avenue Demo Shield Drawings, what construction details and shielding elements are shown in the enlarged section views, and what platform-level steel connections are specified?

**Retrieval:** domains=`documents` · elapsed=`2.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806 Platf Edge Myrtle Ave 20241113.pdf`

<details><summary>Chunk-level citations</summary>

- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=2 (p. 1) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=3 (p. 1) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=7 (p. 2) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=8 (p. 2) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=6 (p. 1) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=4 (p. 1) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=5 (p. 1) rel=1.000
- A37806 Platf Edge Myrtle Ave 20241113.pdf chunk=9 (p. 2) rel=1.000

</details>

**Answer:**

## Construction Details and Shielding Elements
- (p. 1, p. 2) The document is a draft topographic survey drawing for the platform edge at Myrtle Avenue station, not for construction.
- (p. 1, p. 2) The drawing shows the platform edge, track layout, concrete platform, rubbing board edge, and tactile warning strip.
- (p. 1, p. 2) The drawing indicates the centerline of the rail and track, and typical steel columns.

## Platform-Level Steel Connections
- Could not verify platform-level steel connections in the retrieved passages.

---

### ❌ FAIL — answer says info not found [sq72]

**Question:** In drawing MYR-A-444A, what stainless steel panel and signage details are shown for the EL1121/EL1122 elevator enclosures at Myrtle Avenue station?

**Retrieval:** domains=`documents` · elapsed=`2.6s` · cacheHit=`false`

**Sources retrieved:**

- `Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf`

<details><summary>Chunk-level citations</summary>

- Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf chunk=0 (p. ?) rel=1.000

</details>

**Answer:**

## Answer
- I need access to drawing MYR-A-444A to answer your question.
- The currently retrieved document, "myrtle expansion joint pages from 8 03 -," does not contain this information.

---

### ❌ FAIL — wrong document [sq73]

**Question:** In RFI-0116 for the Myrtle Avenue PS LAN followup, what telecommunications coordination issue is addressed and what direction was given to the contractor?

**Retrieval:** domains=`contracts,` · elapsed=`3.6s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=18 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=4 (p. 2) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=17 (p. 6) rel=1.000
- A37806_RFI-0042 - CLO - Coordination with Contract W47032 ΓÇô PS LAN system _Myrtle ONLY.pdf chunk=66 (p. 22) rel=1.000

</details>

**Answer:**

## Telecommunications Coordination and Direction

-   **Issue:** MTA personnel were installing wiring for new PS LAN access nodes at Myrtle Ave. platform level, where cable trough will be impacted by new stairs and elevator shafts under contract A37806 (p. 1).
-   **Direction:** ICC (Integrated Communications Corp) is to survey the conduit run and submit any alternative run for approval (p. 6).
-   **Further Direction:** ICC shall utilize the cable ladder system along the ceiling for data and copper cables; use conduit where ceiling height is low (p. 6).
-   **Power Conductors:** All A.C. power conductors must run in separate conduits within communications rooms, regardless of ceiling height (p. 6).
-   **Installation:** ICC shall furnish and install all wiring and cabling for LAN connections as per contract and field conditions (p. 6).
-   **Schedule:** ICC is working at both stations and expects to finish most work within 1-2 months, with a bulletin remaining (p. 2).

---

### ✅ PASS [sq74]

**Question:** In RFI-009 for Myrtle Avenue UPS Backup Requirements, what UPS capacity is required to support existing and new communications systems, including the future use reserve?

**Retrieval:** domains=`documents` · elapsed=`0.8s` · cacheHit=`false`

**Sources retrieved:**

- `806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf`

<details><summary>Chunk-level citations</summary>

- 806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf chunk=2 (p. 1) rel=1.000
- 806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf chunk=4 (p. 1) rel=1.000

</details>

**Answer:**

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

---

### ✅ PASS [sq75]

**Question:** In GEN-096R04 SWP-016 for Elevator Steel and Enclosure, what is the submittal package response due date and what spec section 01 35 10 information is on the cover sheet?

**Retrieval:** domains=`documents` · elapsed=`2.5s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=14 (p. 13) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=15 (p. 13) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=18 (p. 14) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=19 (p. 14) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=20 (p. 14) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=24 (p. 16) rel=1.000
- A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf chunk=26 (p. 16) rel=1.000

</details>

**Answer:**

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

---

### ✅ PASS [sq76]

**Question:** Summarize SWP-016

**Retrieval:** domains=`documents,` · elapsed=`1.6s` · cacheHit=`false`

**Sources retrieved:**

- `SWP 016 + Attachment.pdf`

<details><summary>Chunk-level citations</summary>

- SWP 016 + Attachment.pdf chunk=2 (p. 1) rel=1.000
- SWP 016 + Attachment.pdf chunk=3 (p. 2) rel=1.000
- SWP 016 + Attachment.pdf chunk=7 (p. 3) rel=1.000
- SWP 016 + Attachment.pdf chunk=10 (p. 4) rel=1.000
- SWP 016 + Attachment.pdf chunk=13 (p. 5) rel=1.000
- SWP 016 + Attachment.pdf chunk=16 (p. 6) rel=1.000

</details>

**Answer:**

## SWP-016 Summary

- **Purpose:** Safe Work Plan for Elevator Steel & Enclosure construction, focusing on crane operations. (p. 1)
- **Project:** ADA Upgrades Package 6 (Contract A37806) at the Middletown site. (p. 1)
- **Contractor:** MLJ is both the General Contractor and performing contractor. (p. 1)
- **Key Equipment:** Liebherr cranes, work train crane, boom truck, telehandler, demo saws, manlift. (p. 1)
- **Safety Measures:** Daily toolbox meetings, 2-hour new hire orientation, mandatory SWP review, flagging, first aid, eyewash stations, fire extinguishers. (p. 2)
- **Revision:** Revision 4, dated 06/02/2026. (p. 1)

---

### ✅ PASS [sq77]

**Question:** In GEN-041R01 SWP-011 for Platform Concrete Demo, what dust control and silica exposure prevention measures apply to saw cutting and demolition operations?

**Retrieval:** domains=`contracts` · elapsed=`4.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf chunk=18 (p. 9) rel=9.000
- A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf chunk=17 (p. 9) rel=9.000
- A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf chunk=16 (p. 9) rel=9.000
- A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf chunk=13 (p. 8) rel=9.000

</details>

**Answer:**

## Dust and Silica Control for Concrete Demolition

- **Wet Methods:** Use wet methods to control airborne dust emissions (p. 9).
- **Vacuuming:** Utilize vacuuming methods if practicable, as per 1926.1153 Table 1 (p. 9).
- **Approved Dust Control Plan:** Follow the approved Dust Control Plan for respiratory protection and dust mitigation (p. 8, 9).
- **Visible Dust:** Stop work and correct the source if any visible dust is observed outside the barricaded area (p. 9).
- **Respiratory Protection:**
    - Employees shall comply with site-specific APP respiratory protection plans (p. 9).
    - Employees will use N95 dust masks or ┬╜-face respirators as needed (p. 8).
    - All employees using respirators must be trained, medically cleared, and fit-tested (p. 8, 9).
- **OSHA Silica Fact Sheet:** Follow OSHA Silica Fact Sheet Attachment #1-2 (p. 9).
- **Equipment Setup:** CSM/CSC/CP shall ensure equipment is set up and used per manufacturer recommendations, especially water supply (p. 9).
- **Containment:** Fire retardant tarp and/or fire-rated plywood will be utilized to contain debris (p. 8).
- **Public Exposure:** If the station/platform is open to the public, establish a work area with rigid barriers to prevent exposure (p. 9).
- **Lead Protocol:** All painted surfaces are considered to contain lead; implement lead placard protocols (e.g., 3P containment, respiratory protection) (p. 8).

---

### ✅ PASS [sq78]

**Question:** Summarize SWP-011

**Retrieval:** domains=`documents,` · elapsed=`1.9s` · cacheHit=`false`

**Sources retrieved:**

- `A37806 SWP-011 - Platform Concrete Demo - Rev 1   6.23.25.pdf`

<details><summary>Chunk-level citations</summary>

- A37806 SWP-011 - Platform Concrete Demo - Rev 1   6.23.25.pdf chunk=2 (p. 1) rel=1.000
- A37806 SWP-011 - Platform Concrete Demo - Rev 1   6.23.25.pdf chunk=3 (p. 2) rel=1.000
- A37806 SWP-011 - Platform Concrete Demo - Rev 1   6.23.25.pdf chunk=6 (p. 3) rel=1.000
- A37806 SWP-011 - Platform Concrete Demo - Rev 1   6.23.25.pdf chunk=9 (p. 4) rel=1.000
- A37806 SWP-011 - Platform Concrete Demo - Rev 1   6.23.25.pdf chunk=12 (p. 5) rel=1.000

</details>

**Answer:**

## SWP-011 Summary

-   **Document:** Safe Work Plan (SWP-011) for Platform Concrete Demolition, Rev. 1, dated 6/23/25 (p. 1).
-   **Project:** A37806 - Design-Build Services for ADA Upgrades Package 6 (p. 1).
-   **Scope:** Demolition of platform concrete using various tools including demo saws, air chipping hammers, and hand tools (p. 1).
-   **Location:** Platform area within a rail station environment (p. 2).
-   **Key Risks:** Train traffic, pedestrian injuries, electrical hazards, falls, struck-by incidents (p. 2, 3, 4).
-   **Safety Measures:** Daily toolbox meetings, SWP review with all personnel, flagging arrangements, onsite first aid/eyewash, fire extinguishers, and specific PPE requirements (p. 2, 3, 4, 5).
-   **Competent Person:** To be determined (p. 1).

---

### ✅ PASS [sq79]

**Question:** Summarize SWP-032

**Retrieval:** domains=`documents,` · elapsed=`1.7s` · cacheHit=`false`

**Sources retrieved:**

- `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf`

<details><summary>Chunk-level citations</summary>

- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=2 (p. 1) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=4 (p. 2) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=5 (p. 3) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=8 (p. 4) rel=1.000
- A37806 SWP-032- General formwork, rebar and concrete -R4.pdf chunk=11 (p. 5) rel=1.000

</details>

**Answer:**

## SWP-032 Summary

-   **Purpose:** Safe Work Plan (SWP-032, Rev. 4) for general formwork installation, rebar placement, and concrete pouring. (p. 1)
-   **Project:** A37806 - Design-Build Services for ADA Upgrades Package 6. (p. 1)
-   **Key Safety Measures:** Daily toolbox meetings, SWP review with all personnel, PPE use, fall protection, and site-specific hazard mitigation. (p. 3-4)
-   **Risk Mitigation:** Addresses risks like electrical hazards, falls, train traffic, and proper tool usage. (p. 3-5)

---

### ✅ PASS [sq80]

**Question:** What does the August 20, 2025 transmittal letter from Michael Wilson say about the approval status of the SWP-032 safe work plan under spec 01 35 10?

**Retrieval:** domains=`documents` · elapsed=`0.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=29 (p. 15) rel=1.000
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=30 (p. 15) rel=1.000
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=31 (p. 16) rel=1.000
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=33 (p. 18) rel=1.000
- A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf chunk=34 (p. 18) rel=1.000

</details>

**Answer:**

## Section 3.01 Requirements Summary (swp 032 - general formwork rebar and concrete)
- Reviewed indexed section evidence from page(s): 15, 16, 18.
- Key requirements captured from the section:
- SAFE WORK PLAN SWP - 032 SWP ΓÇô 032 ΓÇô General formwork, rebar and concreteΓÇô Rev.
- ΓÇóDo not operate power tools in explosive atmo- spheres, such as in the presence of flammable liquids, gases or dust.
- ΓÇóIf operating a power tool in a damp location is unavoidable, use a ground fault circuit interrupter (GFCI) protected supply.
- ΓÇóIf devices are provided for the connection of dust extraction and collection facilities, ensure these are connected and properly used.

Evidence: swp 032 - general formwork rebar and concrete (p. 15, 16, 18).

---

### ✅ PASS [sq81]

**Question:** In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what restricted work hours apply, what combustible materials storage rules are in effect, and how much advance notice is required before closing a staircase?

**Retrieval:** domains=`contracts` · elapsed=`2.4s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=8 (p. 5) rel=8.000

</details>

**Answer:**

## Restricted Work Hours

- Work is restricted between 6:00 AM and 9:30 AM. (p. 4)
- Work is restricted between 3:00 PM and 8:00 PM. (p. 4)

## Combustible Materials Storage

- No flammable/combustible materials shall be stored inside enclosures. (p. 4)

## Staircase Closure Notice

- Two weeks' notice (posting signs) must be given before long-term closure of a staircase. (p. 4)

---

### ✅ PASS [sq82]

**Question:** In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what worksite entry and personnel safety requirements apply, including PPE and evacuation procedures?

**Retrieval:** domains=`field_ops,` · elapsed=`0.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=8 (p. 5) rel=1.000
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=9 (p. 5) rel=1.000
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=11 (p. 6) rel=1.000
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=12 (p. 6) rel=1.000
- A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf chunk=14 (p. 7) rel=1.000

</details>

**Answer:**

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

---

### ✅ PASS [sq83]

**Question:** In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what are the safety coordinator's responsibilities for PPE enforcement, SDS management, and safe work plan development?

**Retrieval:** domains=`field_ops,` · elapsed=`2.7s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=9 (p. 6) rel=9.000
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=14 (p. 8) rel=9.000
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=13 (p. 7) rel=9.000

</details>

**Answer:**

## Safety Coordinator Responsibilities

- **PPE Enforcement:**
    - Inspect workers' PPE daily (p. 6, 8).
    - Ensure all employees wear appropriate PPE for the work (p. 8).

- **SDS Management:**
    - Review SDS prior to work (p. 6, 8).
    - Maintain SDS documents onsite, readily available for review (p. 6, 8).

- **Safe Work Plan Development:**
    - Develop safety work plans detailing hazards and corrective actions (p. 6, 8).
    - Ensure SWPs/JHAs adhere to OSHA 1926, DOB CH 33, FDNY, NYCT SPEC 1S (p. 6, 8).
    - Establish compliance with safety work plans using communication procedures (p. 6).
    - Perform worksite assessments in accordance with safety work plans (p. 6, 8).

---

### ✅ PASS [sq84]

**Question:** Summarize GEN-021R00 Safety Coordinator submittal

**Retrieval:** domains=`field_ops,` · elapsed=`1.1s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=2 (p. 1) rel=1.000
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=5 (p. 3) rel=1.000
- A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf chunk=6 (p. 4) rel=1.000

</details>

**Answer:**

## Safety Coordinator Submittal Summary

- **Status:** Revise and Resubmit (p. 1, 3)
- **Reason:** Missing updated certifications for ASP and NYS DOL Asbestos (p. 1, 3)
- **Coordinator:** Diego Gonzalez (p. 1, 3)
- **Next Step:** Submit revised documentation with required certifications. (p. 1)

---

### ⚠️ PARTIAL / REFUSAL [sq85]

**Question:** In the Schedule Update 5 June 2025, what are the scheduled start and finish dates for the Elevator 541 Enclosure activities, and what activities involve rated glass installation?

**Retrieval:** domains=`documents,` · elapsed=`3.4s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=62 (p. 18) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=152 (p. 31) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=234 (p. 44) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=245 (p. 46) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=289 (p. 53) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=295 (p. 54) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=308 (p. 56) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=314 (p. 57) rel=1.000

</details>

**Answer:**

## Elevator 541 Enclosure Dates
- Could not verify Elevator 541 Enclosure in the retrieved passages.

## Rated Glass Installation
- (p. 10) Install Overpass-Window Frames with Laminated Glass Art Work x3 from July 7, 2027, to August 4, 2027.

---

### ✅ PASS [sq86]

**Question:** In the Schedule Update 5 June 2025, what is the planned outage for EL1121 Elevator Enclosure Framing installation and what are the upcoming enclosure activities at Myrtle Avenue?

**Retrieval:** domains=`contracts` · elapsed=`3.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=292 (p. 53) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=289 (p. 53) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=293 (p. 53) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=567 (p. 101) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=571 (p. 101) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=6 (p. 4) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=9 (p. 6) rel=1.000
- A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf chunk=107 (p. 24) rel=1.000

</details>

**Answer:**

## EL1121 Elevator Enclosure Framing Installation
- (p. 2, p. 1) Install Elevator Enclosure Framing (Outage) for EL1121 is scheduled from January 18, 2027, to February 8, 2027, with a duration of 15 days.

## Upcoming Enclosure Activities at Myrtle Avenue
- (p. 2, p. 3) Upcoming enclosure activities for EL1121 at Myrtle Avenue include installing elevator enclosure framing (outage), glass panels & glaze (outage), caulking frames, and installing metal panels at entrances.

---

### ✅ PASS [sq87]

**Question:** In spec section 21 12 00 for Fire-Suppression Standpipes, what are the pipe hanger and support design requirements, including how they must handle expansion joint forces?

**Retrieval:** domains=`documents` · elapsed=`0.4s` · cacheHit=`false`

**Sources retrieved:**

- `21 12 00 - Fire-Suppression Standpipes REV 1.pdf`

**Answer:**

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

---

### ✅ PASS [sq88]

**Question:** In spec section 21 12 00 for Fire-Suppression Standpipes, what pitch requirements apply to piping and how must pipes and hose connections be installed where they cross tracks?

**Retrieval:** domains=`documents` · elapsed=`0.2s` · cacheHit=`false`

**Sources retrieved:**

- `21 12 00 - Fire-Suppression Standpipes REV 1.pdf`

<details><summary>Chunk-level citations</summary>

- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=2 (p. 1) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=4 (p. 2) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=5 (p. 2) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=6 (p. 3) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=7 (p. 3) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=8 (p. 4) rel=1.000
- 21 12 00 - Fire-Suppression Standpipes REV 1.pdf chunk=12 (p. 6) rel=1.000

</details>

**Answer:**

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

---

### ✅ PASS [sq89]

**Question:** In BUR-042R01 EDU07 SOGR at Burnside Avenue, what requirements apply to water leaks observed during painting and scraping, and where is lead abatement required?

**Retrieval:** domains=`documents` · elapsed=`0.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=182 (p. 42) rel=1.000

</details>

**Answer:**

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

---

### ✅ PASS [sq90]

**Question:** In BUR-042R01 EDU07 SOGR at Burnside Avenue, what are the general structural notes and repair standards for structural steel and reinforced concrete?

**Retrieval:** domains=`documents,` · elapsed=`4.6s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=171 (p. 38) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=60 (p. 12) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=230 (p. 52) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=239 (p. 53) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=247 (p. 54) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=255 (p. 55) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=264 (p. 56) rel=1.000
- A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf chunk=272 (p. 57) rel=1.000

</details>

**Answer:**

## General Structural Notes
- (p. 38) Refer to BUR-CS-00X series for general notes.
- (p. 38) Refer to BUR-CS-00X series for steel notes.
- (p. 38) Refer to DWG BUR-CS-011 for girder repair/replacement.

## Structural Steel Repair Standards
- (p. 12, p. 52, p. 53, p. 54, p. 55, p. 56, p. 57, p. 58) The contractor shall ensure steel repair work returns the element to a state of good repair.
- (p. 12, p. 52, p. 53, p. 54, p. 55, p. 56, p. 57, p. 58) "Steel repair" includes replacement, restoration, reinforcement, or protection finishes of existing steel structures.
- (p. 52, p. 53, p. 54) If existing structural steel is severely corroded, the contractor shall notify the Engineer of Record (EOR) to determine if repair or replacement is required and issue the final design.
- (p. 52, p. 53, p. 54) All remedial work shall restore full structural capacity in accordance with project requirements.
- (p. 52, p. 53, p. 54) For column base or beam repairs, the contractor shall remove and replace damaged or corroded steel, including flanges and webs, extending beyond the platform floor level to sound material.
- (p. 52, p. 53, p. 54) The contractor shall include anticipated repair quantities in the contract to avoid additional work orders.
- (p. 52, p. 53, p. 54) Lead abatement is required for all areas where paint is to be scraped and removed.

## Reinforced Concrete Repair Standards
- (p. 12, p. 52, p. 53, p. 54, p. 55, p. 56, p. 57, p. 58) The completed concrete repair scope shall meet requirements for a state of good repair, including extent of removal, concrete replacement or patching, materials, surface preparations, additional reinforcement, stud connections, crack grouting or sealing, corrosion inhibitors, placement finishing and curing, and surface sealants and protective coatings.
- (p. 12, p. 52, p. 53, p. 54, p. 55, p. 56, p. 57, p. 58) For repairs where rebar is exposed, the contractor shall remove concrete to 1 inch minimum behind reinforcement.
- (p. 12, p. 52, p. 53, p. 54, p. 55, p. 56, p. 57, p. 58) The contractor shall provide the repair methodology and sequence of steps, including temporary shoring of existing structures.
- (p. 12, p. 52, p. 53, p. 54, p. 55, p. 56, p. 57, p. 58) All grouting injection or access holes shall be repaired by the contractor.
- (p. 12, p. 52, p. 53, p. 54, p. 55, p. 56, p. 57, p. 58) The contractor shall repair all locations where saw-cutting of concrete exposes reinforcement to provide the minimum cover required to the rebars.

---

### ✅ PASS [sq91]

**Question:** In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what did AECOM transmit to MLJTC2 Project Manager Ravi Jain on April 17, 2026?

**Retrieval:** domains=`field_ops,` · elapsed=`2.8s` · cacheHit=`false`

**Sources retrieved:**

- `Transmittal 212-NOR Xfer Girder inspection.pdf`

<details><summary>Chunk-level citations</summary>

- Transmittal 212-NOR Xfer Girder inspection.pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## Transmitted Items to Ravi Jain

- A37806 ADA P6-Submittal Certification - NOR XFER GIRDER INSPECTION REPORT (p. 1)
- ADA_P6-Norwood Av_Transfer Girder Field Report dated 03/30/2026 (p. 1)

---

### ✅ PASS [sq92]

**Question:** In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what NYCT review designation is shown on the cover sheet — approval, information only, or designer review?

**Retrieval:** domains=`documents,` · elapsed=`2.8s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf chunk=2 (p. 1) rel=9.000

</details>

**Answer:**

## NYCT Review Designation

- The cover sheet indicates "For NYCT/MTA Review & Comment" and "For NYCT/MTA Approval" (p. 1).
- It also includes "For Designer Approval" and "For NYCT/MTA Information Only" (p. 1).

---

### ✅ PASS [sq93]

**Question:** In NOR-010R00 Norwood Avenue CCTV Inspection Findings, which sewer sections were inspected and what are the NYCDEP pipe inspection IDs for those segments?

**Retrieval:** domains=`documents,` · elapsed=`2.6s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf`

**Answer:**

## Inspected Sewer Sections and NYCDEP IDs

- **Segment 1:** M3071513 to M3083356 (p. 2)
- **Segment 2:** M3083356 to M3083358 (p. 2)

---

### ✅ PASS [sq94]

**Question:** In the EDU05B Electrical Long Lead submittal for Norwood Avenue Station, what does the AECOM calculation cover page show about the project job number, client, and coordination requirements?

**Retrieval:** domains=`documents` · elapsed=`0.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=4 (p. 3) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=5 (p. 4) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=6 (p. 4) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=7 (p. 5) rel=1.000
- A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf chunk=10 (p. 7) rel=1.000

</details>

**Answer:**

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

---

### ⚠️ PARTIAL / REFUSAL [sq95]

**Question:** In the EDU05B Electrical Long Lead submittal, what panel and circuit data is shown for spec sections 12 14 10, 25 43 18, and 25 41 18 in the load schedule?

**Retrieval:** domains=`documents` · elapsed=`0.2s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 10 20_GEN-055R00 - EDU05B-BX Comment Log -final Long Lead Electrical 12.10.25 (1).xlsx`

**Answer:**

## EDU5B
- I found a37806 01 10 20 gen-055r00 - edu05b-bx comment, but I do not have indexed text for a precise answer.
- Re-run indexing on that file, then ask again.

---

### ✅ PASS [sq96]

**Question:** In GEN-014R00 Monthly Quality and Certification Report for May 2025, what construction activities and quality survey items are documented for the Ave I station platform under spec section 01 40 10?

**Retrieval:** domains=`documents` · elapsed=`0.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=5 (p. 4) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=6 (p. 5) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=7 (p. 6) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=8 (p. 7) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=9 (p. 8) rel=1.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=10 (p. 9) rel=1.000

</details>

**Answer:**

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

---

### ✅ PASS [sq97]

**Question:** In GEN-014R00 Monthly Quality and Certification Report for May 2025, what is the NYCT/MTA submittal designation — information only, approval, or designer review?

**Retrieval:** domains=`documents` · elapsed=`2.5s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=2 (p. 1) rel=8.000
- A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf chunk=3 (p. 2) rel=8.000

</details>

**Answer:**

## NYCT/MTA Submittal Designation

- The Monthly Quality and Certification Report for May 2025 is designated for "Revise & Resubmit" by the reviewer (p. 1).
- The transmittal form includes options for "For NYCT/MTA Review & Comment", "For NYCT/MTA Approval", and "For NYCT/MTA Information Only" (p. 2).
- The current disposition indicates it requires revisions before approval (Node 1).

---

### ✅ PASS [sq98]

**Question:** In the PRDC12-019R00 SikaGrout 212 product submittal, what application restrictions and surface preparation requirements apply — specifically regarding sun, wind, and substrate conditions?

**Retrieval:** domains=`documents` · elapsed=`0.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=30 (p. 20) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=31 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=32 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=33 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=34 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=35 (p. 22) rel=1.000

</details>

**Answer:**

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

---

### ✅ PASS [sq99]

**Question:** In the PRDC12-019R00 SikaGrout 212 product submittal, is SikaGrout-212 USDA certifiable and what does the product data say about packaging size and ASTM C-827 compliance?

**Retrieval:** domains=`documents` · elapsed=`3.1s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=28 (p. 19) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=27 (p. 19) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=32 (p. 21) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=2 (p. 1) rel=1.000

</details>

**Answer:**

## SikaGrout-212 Product Details

- SikaGrout-212 is USDA certifiable (p. 19).
- The product is packaged in 50 lb (22.7 kg) bags (p. 19).
- SikaGrout-212 shows positive expansion when tested in accordance with ASTM C-827 (p. 19).

---

### ✅ PASS [sq100]

**Question:** In the PRDC12-012R02 Lead Placard Package for Burnside, what containment class and cut-line preparation requirements apply to the lead paint abatement work?

**Retrieval:** domains=`documents` · elapsed=`0.4s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=52 (p. 33) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=53 (p. 33) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=54 (p. 34) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=55 (p. 34) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=56 (p. 34) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=57 (p. 35) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=58 (p. 35) rel=1.000
- A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf chunk=59 (p. 36) rel=1.000

</details>

**Answer:**

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

---

### ⚠️ PARTIAL / REFUSAL [sq101]

**Question:** In PRDC12-012R02 Lead Placard Package for Burnside, what is the lead paint abatement classification, the project description, and the abatement contractor shown on the cover sheet?

**Retrieval:** domains=`contracts,` · elapsed=`4.6s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=2 (p. 1) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=10 (p. 8) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=40 (p. 21) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=52 (p. 26) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=64 (p. 31) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=127 (p. 140) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=128 (p. 141) rel=1.000
- A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf chunk=129 (p. 142) rel=1.000

</details>

**Answer:**

## Lead Paint Abatement Classification
- (p. 2, 11, 12) The lead paint abatement classification is SSPC Class 3P containment, which may be downgraded to a ground tarp with MTA/C&DES approval if minimal debris is generated.

## Project Description
- (p. 1, 10) The project is "Design-Build Services for Accessibility Upgrades - Package 6" and "Accessibility Upgrades at Five Stations" for Contract A37806.

## Abatement Contractor
- Could not verify abatement contractor in the retrieved passages.

---

### ⚠️ PARTIAL / REFUSAL [sq102]

**Question:** In PRDC12-019R00 SikaGrout 212 product submittal, what are the compressive strength values, flowability, and extended working time listed in the product technical data table?

**Retrieval:** domains=`documents` · elapsed=`4.3s` · cacheHit=`false`

**Sources retrieved:**

- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

<details><summary>Chunk-level citations</summary>

- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=25 (p. 18) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=29 (p. 20) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=17 (p. 13) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=23 (p. 17) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=8 (p. 8) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=12 (p. 10) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=16 (p. 12) rel=1.000
- A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf chunk=32 (p. 21) rel=1.000

</details>

**Answer:**

## Compressive Strength Values
- (p. 20) The compressive strength for plastic consistency is 4,500 psi (31 MPa) at 1 day, 6,100 psi (42 MPa) at 7 days, and 7,500 psi (51.7 MPa) at 28 days.
- (p. 20) The compressive strength for flowable consistency is 3,500 psi (24.1 MPa) at 1 day, 5,700 psi (39.3 MPa) at 7 days, and 6,200 psi (42.7 MPa) at 28 days.
- (p. 20) The compressive strength for fluid consistency is 2,700 psi (18.6 MPa) at 1 day, 5,500 psi (37.9 MPa) at 7 days, and 5,800 psi (40 MPa) at 28 days.

## Flowability
- (p. 20) The flowability for plastic consistency is 100ΓÇô124% (ASTM C-1437).
- (p. 20) The flowability for flowable consistency is 124ΓÇô145% (ASTM C-1437).
- (p. 20) The flowability for fluid consistency is 20ΓÇô40 seconds (ASTM C-939).

## Extended Working Time
- Could not verify extended working time in the retrieved passages.

---

