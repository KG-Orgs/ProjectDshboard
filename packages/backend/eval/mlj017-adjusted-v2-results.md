# MLJ-017 Package 6 — Adjusted 97-Question Q&A Run (v2)

> **Project:** MLJ-017 Package 6 General · `145b3dcf-272e-4c45-9e19-953f20f25bb9`
> **Input:** `eval/mlj017-adjusted-v2-batch-input.json` (each question reworded / asks a different facet of the same source doc as the original sq set)
> **Raw output:** `eval/mlj017-adjusted-v2-run.txt`

---

## Automated summary (heuristic — not a graded PASS/FAIL)

| Signal | Count | % |
|---|---|---|
| Answered with sources (no refusal marker) | 80 | 82% |
| Refusal / "not found" phrasing | 17 | 18% |
| No sources returned | 0 | 0% |
| Timeouts (≥25s) | 0 | 0% |

**Avg elapsed:** 2.5s · **Max elapsed:** 12.1s · **Total:** 97

> Heuristic only: "answered with sources" means the pipeline returned sources and the answer did not contain a refusal phrase. It does **not** verify factual correctness — spot-check the flagged rows below.

### Rows needing review (refusal or no sources)

- **[sq08]** refusal phrasing — In GEN-027R00 for Crossroads JV LLC, who are the principal officers of the joint venture and when was the entity formed?
- **[sq16]** refusal phrasing — In the MTACD-MLJTC2-L-0083 subcontractor approval letter, is American Geophysics approved for labor only or does it include materials, and on what date was it approved?
- **[sq18]** refusal phrasing — In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what concrete cover requirements are specified for surfaces exposed to earth or weather?
- **[sq21]** refusal phrasing — In BUR-009R00 for the EL539 Cab and Entrance Drawings, what is the submittal revision number and who is the elevator manufacturer?
- **[sq22]** refusal phrasing — In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, which spec section does this submittal cover?
- **[sq26]** refusal phrasing — In Invoice 11707, what is the total amount billed, the invoice date, and the payment terms?
- **[sq28]** refusal phrasing — In Lockton Invoice 0849812, what coverage or bond does the invoice cover and what is the policy period?
- **[sq31]** refusal phrasing — In the Backup for Invoice#01, how many square feet of lead abatement were completed on December 7, 2025 and what was the total labor cost claimed?
- **[sq33]** refusal phrasing — In Invoice#01 dated December 31, 2025, what is the total contract sum, total completed to date, and current payment due on the G702 application?
- **[sq37]** refusal phrasing — In A37806 Kick Off Pre-Work Conference, what safety and environmental requirements are emphasized for project start-up?
- **[sq46]** refusal phrasing — Which agencies issued the current permits submitted for Myrtle Ave, and what is their approval status?
- **[sq56]** refusal phrasing — In BUR-080R00 Burnside December 2025 Construction Photos, on what dates were the photos taken and what site conditions are shown?
- **[sq57]** refusal phrasing — In BUR-080R00 Burnside December 2025 Construction Photos, what staging areas and material deliveries are documented?
- **[sq62]** refusal phrasing — In PRO 26-01 Control of Project Nonconforming Items, what are the steps for dispositioning a nonconforming item once an NCR is issued?
- **[sq65]** refusal phrasing — In J-TRACK-13A-041R00 Material I&T Request for the 100-8 6-hole joint bar, what is the inspection and test status and who is the material supplier?
- **[sq85]** refusal phrasing — In the Schedule Update 5 June 2025, what is the critical path and which activities have the least float?
- **[sq94]** refusal phrasing — In the EDU05B Electrical Long Lead submittal for Norwood Avenue Station, which long-lead electrical equipment items are identified and what are their procurement lead times?

---

## Per-question results

### [sq01] ✅ answered · 1.6s
**Query:** In GEN-042R00, what action items were recorded, who are they assigned to, and when is the next coordination meeting scheduled?

**Domains:** contracts · **cacheHit:** false

**Sources:** `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf`

**Answer:** ## Action Items and Meeting Schedule - **Action Items:**     - Ahern to send MLJTC2 draft agreement for MLJTC2 access to their shielding. (p. 4)     - Naik/TYLin to send MLJTC2 the GO forecast for Contract C34921R. (p. 4) - **Assigned To:** Ahern, Naik/TYLin (p. 4) - **Next Coordination Meeting:** Not specified in the provided document.

---

### [sq02] ✅ answered · 4.0s
**Query:** What insurance, bonding, and payment terms are set out in Island Pavement Cutting Co's subcontract?

**Domains:** contracts · **cacheHit:** false

**Sources:** `M017_MLJ_INDUSTRY SAFETY_SUBCONTRACT_DRAFT R4 20250714.docx`, `M017_MLJ_Halcyon_Agreement_Draft_06162025.pdf`, `M017_MLJ_INDUSTRY SAFETY_SUBCONTRACT_DRAFT SD 5.19.25.docx`, `M017_MLJ_Halcyon_Agreement_Draft_06162025 - Review 1.docx` +4

**Answer:** ## Subcontractor Insurance Requirements - Subcontractor must obtain and maintain insurance at its own expense, satisfactory to Contractor (p. 12). - Insurance must be from companies authorized in the project jurisdiction (p. 12). - Coverage must be maintained for the duration of the Project and as required after (p. 12). - Excess liability limits of $25,000,000 are required via umbrella or excess liability policy (p. 12). - This excess policy must follow form to Employer's Liability, Commercial …

---

### [sq03] ✅ answered · 5.0s
**Query:** Which past projects and reference contracts does Island Pavement Cutting Co cite as experience for its saw cutting and joint sealing work?

**Domains:** contracts · **cacheHit:** false

**Sources:** `A37806_GEN-051R00 - ORIG - Subcontractor Approval Forms - Island Pavement Cutting Co Inc..pdf`, `Request_for_Qualifications_Package_6_A37806.pdf`, `A37806_Request for Qualifications_Package 6_Rev 1.pdf`, `DG102_Preparing Contract Specifications Documents (2009-12-10, A.Saha).pdf` +4

**Answer:** ## Island Pavement Cutting Co. Reference Projects - **Peter Scalamandre & Sons Contracting: Job 910 Cold Spring Harbor Wall Saw**   - Work: Wall Saw Work   - Status: In Progress   - Dates: 03/14/2024 - 12/31/2024 (p. 33) - **Posillico Civil Inc.: H61145-54G 08717 Resurfacing Wantagh Ave**   - Work: Joints, SawCut, Joint Adhesive   - Status: In Progress   - Dates: 03/04/2024 - 12/31/2025 (p. 33) - **Posillico Civil Inc.: H61587-PR7 08611**   - Work: Saw Cut, Joints, Cracks/Joints   - Status: PWC …

---

### [sq04] ✅ answered · ✓ 911ms (exact-ID)
**Query:** In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, on what date was the approval issued and who signed it?

**Domains:** contracts · **cacheHit:** false

**Sources:** `25.03.19 A37806-MTACD-MLJTC2-L-0024 - Sub-Contractor Approval – 50 States Engineering, Corp.pdf`

**Answer:** ## Sub-Contractor Approval Details - **Approval Date:** March 19, 2025 - **Signed By:** Mekh Gurung (Naik/TYLin JV Sr. Project Manager) and Michael Wilson (MTA C&D Senior Director)

---

### [sq05] ✅ answered · 4.2s
**Query:** In A37806 Phasing Plan GEN-001R05, which stations are affected in each phase and what is the sequence of work?

**Domains:** contracts, field_ops · **cacheHit:** false

**Sources:** `A37806_01 10 30_GEN-001R05 - Phasing Plan_PMC Comments_11-18-25 (MYRTLE ONLY).pdf`

**Answer:** ## Affected Stations and Work Sequence - (p. 1, 9) The phasing plan details ADA accessibility upgrades for the Myrtle Avenue Station, part of a larger project for five stations. - (p. 1, 2) Phase 1 (October 2025 - January 2026) involves street work, third-party coordination, fire protection pressure testing, and platform-level work including utility relocation, standpipe relocation, J2 track asbestos abatement, and demo shield installation. - (p. 1, 2) Phases 2A-2E involve utility work on Broadw…

---

### [sq06] ✅ answered · 2.3s
**Query:** In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what are the proposal submission requirements and evaluation criteria described?

**Domains:** documents · **cacheHit:** false

**Sources:** `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf`

**Answer:** ## Section 9.06 Requirements Summary (pre-proposal slideshow a37806 rfp addendum 02) - Reviewed indexed section evidence from page(s): 39. - Key requirements captured from the section: - Systems Work Summary • Electrical • Electrical service at all five (5) stations will require upgrades include power distribution equipment upgrades • Lighting and power to all added or modified station areas including for elevators, control areas and headho... Evidence: pre-proposal slideshow a37806 rfp addendum…

---

### [sq07] ✅ answered · 1.5s
**Query:** In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what technical resources, licenses, and prior revocations must be disclosed?

**Domains:** contracts, subcontractor · **cacheHit:** false

**Sources:** `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`

**Answer:** ## Subcontractor Disclosure Requirements - **Technical Resources:** Explanation of staffing, facilities, equipment, and tools committed to the contract work (p. 30). - **Licenses, Permits, Certifications:** List all relevant licenses, permits, or certifications held by the subcontractor or employees (p. 30).   - Examples provided: AMPP QP-1 & QP-2 Certification, SSPC C-3 Lead Certification, NACE Level 2 Inspector Certification, NACE Level 1 Inspector Certification (p. 30). - **Revoked/Suspended …

---

### [sq08] ⚠️ refusal/not-found · 1.2s
**Query:** In GEN-027R00 for Crossroads JV LLC, who are the principal officers of the joint venture and when was the entity formed?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`

**Answer:** ## Answer - I could not find an exact indexed passage in a37806 gen-027r00 - r&r - subcontractor approval forms that answers this question. - No evidence-backed specification text was verified in the retrieved chunks for this request. - Refine with a section heading or exact phrase and I will search only this file again. - **Evidence:** a37806 gen-027r00 - r&r - subcontractor approval forms (p. 3, 4, 5).

---

### [sq09] ✅ answered · 4.8s
**Query:** In the M017_IMP Draft Subcontract, what conditions precedent govern subcontractor payment and change order compensation?

**Domains:** contracts, subcontractor, communication · **cacheHit:** false

**Sources:** `M017_IMP_Draft Subcontract_20251024.docx`

**Answer:** ## Conditions Precedent for Subcontractor Payment - **Receipt of Payment from Owner:** Contractor's receipt of payment from Owner for Subcontractor's Work is a condition precedent for Subcontractor to receive payment (Node 5). - **Diversity Plan Compliance:** Subcontractor must provide executed copies of purchase orders/subcontracts for diversity plan participants and fulfill other reporting requirements in Attachment B – “Diversity Plan” (Node 5). - **Strict Compliance with Article Provisions:*…

---

### [sq10] ✅ answered · 6.1s
**Query:** In the M017_IMP Draft Subcontract, what does the dispute resolution and governing law clause specify?

**Domains:** contracts, documents, communication · **cacheHit:** false

**Sources:** `M017_IMP_Draft Subcontract_20251024.docx`

**Answer:** ## Dispute Resolution and Governing Law -   **Governing Law:** The Subcontract is governed by the laws of the state where the Project is located (p. 1, 2, 6).     -   **Exception:** If the Subcontract incorporates FAR or Agency FAR Supplements, federal law governs (p. 6). -   **Venue:** Exclusive venue for any proceeding is the state and county where the Project is located (p. 1, 6).     -   **Exception:** If a federal agency is responsible for a dispute, Subcontractor follows the Subcontract's …

---

### [sq11] ✅ answered · 3.9s
**Query:** In Transmittal 0014 for MTA Personnel and PMC Supplies, who is the transmittal from and to, and on what date was it sent?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806 Transmittal 0014 -  MTA Personnel and PMC Supplies.pdf`

**Answer:** ## Transmittal 0014 Details - **From:** MLJTC2, 1010 Northern Blvd Suite 200 Great Neck NY 11021 (p. 1) - **To:** AECOM, 605 Third Avenue, 3rd Floor, New York, NY 10158, Attn: Ray Batmaz (p. 1) - **Date Sent:** April 24, 2026 (p. 1)

---

### [sq12] ✅ answered · 3.2s
**Query:** What reserve service load values or electrical capacity are described in the Myrtle Ave Reserve Service Load Letter?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `MLJTC2-MTACD-0135 - NOC-028 - Avenue I Replacement of Existing Con Edison Reserve Service.docx`, `MLJTC2-MTACD-0185 - Arbitration Notice-005 – Avenue I Replacement of Existing Con Edison Reserve Service.pdf`, `26.06.09 A37806-MTACD-MLJTC2-L-0217 - Response to MLJTC2-MTACD-0199 - Follow Up to Arbitration Notices 004 and 005.pdf`, `MLJTC2-MTACD-0185 - Arbitration Notice-005.pdf` +4

**Answer:** ## Myrtle Ave Reserve Service Load Values - The provided context mentions "load letters for the Existing and New Con Edison services at Myrtle Avenue station" (p. 4). - It also references "NOC-010 Insufficient Space in Myrtle EDR" (p. 4). - However, the specific reserve service load values or electrical capacity for Myrtle Avenue are not detailed in the retrieved documents. - The documents primarily discuss load letters for the Avenue I station. Next step: Please provide the "load letters for th…

---

### [sq13] ✅ answered · ✓ 912ms (exact-ID)
**Query:** In the MTACD-MLJTC2-L-0017 subcontractor approval letter, on what date was MASE FX approved and who authorized it?

**Domains:** contracts, subcontractor · **cacheHit:** false

**Sources:** `25.03.19 A37806-MTACD-MLJTC2-L-0017 - Subcontractor Approval MASE FX $109,450.00.pdf`

**Answer:** ## MASE FX Approval Details - MASE FX was approved on March 19, 2025. - Approval authorized by Mekh Gurung (Naik/TYLin JV Sr. Project Manager) and Michael Wilson (MTA C&D Senior Director).

---

### [sq14] ✅ answered · 1.9s
**Query:** In the MTACD-MLJTC2-L-0028 subcontractor approval letter, is Titanium Linx Consulting approved for labor only, and what is the effective date of the approval?

**Domains:** contracts, subcontractor · **cacheHit:** false

**Sources:** `2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf`

**Answer:** ## Subcontractor Approval Details - (p. 1) Titanium Linx Consulting, Inc. is approved for Public Information & Outreach services, labor only. - (p. 1) The effective date of approval for Titanium Linx Consulting, Inc. is March 26, 2025.

---

### [sq15] ✅ answered · ✓ 857ms (exact-ID)
**Query:** In the MTACD-MLJTC2-L-0049 subcontractor approval letter, what subsurface utility engineering purpose is McVac's vacuum excavation work supporting?

**Domains:** contracts, subcontractor · **cacheHit:** false

**Sources:** `25.06.10 A37806-MTACD-MLJTC2-L-0049 - Sub-Contractor Approval – McVac Environmental Services, Inc..pdf`

**Answer:** ## McVac's Vacuum Excavation Purpose - McVac's vacuum excavation work supports test pits for subsurface utility engineering (SUE). (Node 1)

---

### [sq16] ⚠️ refusal/not-found · 1.1s
**Query:** In the MTACD-MLJTC2-L-0083 subcontractor approval letter, is American Geophysics approved for labor only or does it include materials, and on what date was it approved?

**Domains:** contracts, subcontractor · **cacheHit:** false

**Sources:** `2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval – Providence Construction Corp..pdf`

**Answer:** ## American Geophysics Approval Status The provided document, "2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval – Providence Construction Corp.pdf", concerns the approval of **Providence Construction Corp.**, not American Geophysics. This document does not contain information about American Geophysics.

---

### [sq17] ✅ answered · 1.0s
**Query:** In the MTACD-MLJTC2-L-0093 subcontractor approval letter, what micropile quantity or location scope is Tri-State Civil Construction approved to install, and who signed the letter?

**Domains:** contracts, subcontractor · **cacheHit:** false

**Sources:** `25.08.25 A37806-MTACD-MLJTC2-L-0093 - Sub-Contractor Approval – Tri-State Civil Construction LLC.pdf`

**Answer:** ## Micropile Scope and Approver - Tri-State Civil Construction LLC is approved to furnish and install micropiles as part of the ADA upgrades (p. 1). - The subcontract cost for this work is $1,134,080.00 (p. 1). - The letter was signed by Michael Wilson, Senior Director, MTA C&D (p. 1).

---

### [sq18] ⚠️ refusal/not-found · 1.9s
**Query:** In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what concrete cover requirements are specified for surfaces exposed to earth or weather?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf`

**Answer:** I could not find an exact indexed passage in a37806 03 20 00 avi-002r00 - aan - that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq19] ✅ answered · 2.6s
**Query:** In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what revision history and approval dates are recorded in the title block?

**Domains:** contracts, documents · **cacheHit:** false

**Sources:** `A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf`

**Answer:** ## Revision History and Approval Dates -   **Document Date:** 02.03.26 -   **Revision Code:** AVI-002R00 (suggests initial or early revision) -   **Approval Status:** No explicit approval stamps or inspection notes are visible in the provided excerpt.

---

### [sq20] ✅ answered · 1.1s
**Query:** In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what cab dimensions and finish materials are specified?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf`

**Answer:** ## EL539 Cab Dimensions and Finish Materials - The provided document summary for 'a37806 14 24 00 bur-009r00 - aan -' does not explicitly detail cab dimensions or finish materials. - The summary indicates that full drawings likely contain this information. - Next step: Review the full drawings for detailed dimensions and materials.

---

### [sq21] ⚠️ refusal/not-found · 1.5s
**Query:** In BUR-009R00 for the EL539 Cab and Entrance Drawings, what is the submittal revision number and who is the elevator manufacturer?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf`

**Answer:** ## Submittal Revision Number - (p. 1) Could not verify submittal revision number in the retrieved passages. ## Elevator Manufacturer - (p. 1) Could not verify elevator manufacturer in the retrieved passages.

---

### [sq22] ⚠️ refusal/not-found · 1.9s
**Query:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, which spec section does this submittal cover?

**Domains:** documents · **cacheHit:** false

**Sources:** `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf`

**Answer:** I could not find an exact indexed passage in mljtc2 aecom atc 1 burnside avenue drawings that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq23] ✅ answered · 3.0s
**Query:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what structural steel members and connection details are shown for the staircase enclosure?

**Domains:** documents · **cacheHit:** false

**Sources:** `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf`

**Answer:** ## Answer - The provided document, "mljtc2 aecom atc 1 burnside avenue drawings," does not contain the "BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings." The retrieved page (p. 3) shows an overpass level plan with general accessibility upgrades and stair locations, but no structural steel member or connection details for a staircase enclosure. - **Next step:** Please provide the correct shop drawing document for the staircase enclosure.

---

### [sq24] ✅ answered · 4.8s
**Query:** What specification requirements govern compaction testing and backfill material gradation near structures?

**Domains:** documents · **cacheHit:** false

**Sources:** `PRDC.pdf`, `PRDC - Original.pdf`, `A37806_Volume_05_Project_Requirements_and_Design_Criteria (Commpressed).pdf`, `AEIS LLC_IRF_A37806_0208- Avenue I Back Fill.pdf` +4

**Answer:** ## Compaction and Backfill Requirements Near Structures -   **Compaction Density:** Uncontrolled fills must be compacted to a dry density not less than 90% of maximum dry density per ASTM D698 (Standard Proctor Method). (p. 431) -   **Subsurface Structure Support:** Subsurface structures require support to prevent settlements after compaction. (p. 431) -   **Backfill Placement Approval:** No backfill or fill can be placed in any excavation until the Project CEO approves the construction. (p. 11,…

---

### [sq25] ✅ answered · 1.2s
**Query:** In GEN-001R02 Elevator Walls Formwork Drawing, what was the AE reviewer's final disposition and were any comments issued?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_03 10 00_GEN-001R02 - RWC - Elevator Walls Formwork Drawing - MTA.pdf`

**Answer:** ## AE Reviewer's Final Disposition - (p. 1, p. 2) The final submittal disposition by AE Reviewer Elie Hantouche is "Reviewed with Comments." ## Comments Issued - (p. 2) The response from the AE Reviewer is "Please check the attachment."

---

### [sq26] ⚠️ refusal/not-found · ✓ 940ms (exact-ID)
**Query:** In Invoice 11707, what is the total amount billed, the invoice date, and the payment terms?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `Invoice 11707 revised.pdf`

**Answer:** ## Total Amount Billed - (p. 1) The total amount billed for Invoice 11707 is $1,050. ## Invoice Date - Could not verify Invoice Date in the retrieved passages. ## Payment Terms - Could not verify Payment Terms in the retrieved passages.

---

### [sq27] ✅ answered · 1.1s
**Query:** In Invoice 11830, what is the unit price per pest control visit and the total amount due for the Middletown stations?

**Domains:** contracts · **cacheHit:** false

**Sources:** `Invoice 11830.pdf`

**Answer:** ## Pest Control Unit Price - (p. 1) The unit price for monthly pest control service for 1 station (4 visits) is $350.00. ## Total Amount Due - (p. 1) The total amount due for the Middletown Stations is $1,400.00, including NYC sales tax.

---

### [sq28] ⚠️ refusal/not-found · ✓ 577ms (exact-ID)
**Query:** In Lockton Invoice 0849812, what coverage or bond does the invoice cover and what is the policy period?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `2025 Lockton Invoice 0849812.pdf`

**Answer:** I could not find an exact indexed passage in 2025 lockton invoice 0849812 that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq29] ✅ answered · 1.3s
**Query:** In Lockton Invoice 0849812, what is the invoice date and the payment due date?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `2025 Lockton Invoice 0849812.pdf`

**Answer:** ## Invoice Date - (p. 1) The invoice date is 07/21/2025. ## Payment Due Date - (p. 1) The invoice payment is due by 08/21/2025.

---

### [sq30] ✅ answered · 1.2s
**Query:** In the Backup for Invoice#01, what materials and equipment were used for the December 6, 2025 lead abatement containment at Burnside Station?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `Backup for Invoice#01.pdf`

**Answer:** ## Lead Abatement Materials and Equipment (12/06/2025) - Materials were transported to the designated work platform. (p. 2) - Lead abatement containment was built. (p. 2) - Needle-gunning was performed on top flanges and miscellaneous structural span areas. (p. 2)

---

### [sq31] ⚠️ refusal/not-found · ✓ 988ms (exact-ID)
**Query:** In the Backup for Invoice#01, how many square feet of lead abatement were completed on December 7, 2025 and what was the total labor cost claimed?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `Backup for Invoice#01.pdf`

**Answer:** ## Lead Abatement on Dec 7, 2025 - (p. 3) Abated 195.06 square feet of surface area on December 7, 2025. ## Total Labor Cost - Could not verify total labor cost in the retrieved passages.

---

### [sq33] ⚠️ refusal/not-found · 2.5s
**Query:** In Invoice#01 dated December 31, 2025, what is the total contract sum, total completed to date, and current payment due on the G702 application?

**Domains:** contracts · **cacheHit:** false

**Sources:** `2025-10-21 Eagle Business Machine Inv# 129318 $43.55 (M017 99-1530).pdf`

**Answer:** ## Invoice Details - Could not verify total contract sum in the retrieved passages. - Could not verify total completed to date in the retrieved passages. - Could not verify current payment due on the G702 application in the retrieved passages.

---

### [sq34] ✅ answered · 1.1s
**Query:** In GEN-042R00, the A37806 & C49321R Coordination Meeting, what action items were assigned to Ahern regarding shielding removal?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf`

**Answer:** ## Ahern Shielding Removal Actions - Ahern will accommodate MLJTC2 by removing shield panels and spreading support cables where increased vertical clearance is required (p. 4). - Ahern offered MLJTC2 access to shielding at Myrtle Ave Station, contingent on a signed agreement (p. 4). - Ahern to send MLJTC2 a draft agreement for access to their shielding (p. 4).

---

### [sq35] ✅ answered · 2.8s
**Query:** Who attended the September 3, 2025 coordination meeting and which contracts were being coordinated?

**Domains:** contracts, communication · **cacheHit:** false

**Sources:** `A37806_01 30 20_GEN-026R00 - FIO - C34915 Coordination Meeting 07.03.25.pdf`, `A37806 - ADA Package 6 - Meeting Minutes 1-20-2026_COMMS.pdf`, `MFM-MLJTC2 _Weekly Meeting (7.21 ~ 11.03).pdf`, `A37806_01 30 20_GEN-053R00 - FIO - Comms Kickoff Meeting Minutes_20250916.pdf` +4

**Answer:** ## September 3, 2025 Meeting Attendees and Contracts - No meeting minutes or attendance records for September 3, 2025, were found. - The closest meeting found was July 3, 2025, coordinating Contracts A-37806 and C-34915 (p. 3). - Attendees for the July 3, 2025 meeting included: Mekh Gurung (PMC), Jack Czyzewski (PMC), Jimmy Pasagelis (Ahern), Mohammed Rony (MTA), Keith Hofler (Ahern) (p. 3). - Next step: Please provide the correct date or meeting title if September 3, 2025, is incorrect.

---

### [sq36] ✅ answered · 4.9s
**Query:** In A37806 Kick Off Pre-Work Conference, what key project contacts and their roles are listed?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 30 20_GEN-002R00 - FIO - Pre-Work Conference Meeting Minutes 02.13.25.pdf`

**Answer:** ## Key Project Contacts and Roles - **Michael Wilson:** Senior Director, PCEO, NYC (p. 1) - **Mohammed Rony:** Participant (Mohammed.Rony@mtacd.org) (p. 4) - **Dominick Toscano:** Participant (Dominick.Toscano@mtacd.org) (p. 4) - **Oleg Shen:** Participant (Oleg.Shen@mtacd.org) (p. 4) - **Louis Lanfair:** Participant (Louis.Lanfair2@nyct.com) (p. 4) - **Rahul Patel:** Participant (Rahul.Patel@nyct.com) (p. 4) - **Teresa Lennon:** Participant (Teresa.Lennon@mtacd.org) (p. 4) - **Joshua Rosenberg:…

---

### [sq37] ⚠️ refusal/not-found · 2.3s
**Query:** In A37806 Kick Off Pre-Work Conference, what safety and environmental requirements are emphasized for project start-up?

**Domains:** contracts, field_ops, documents · **cacheHit:** false

**Sources:** `A37806_01 30 20_GEN-002R00 - FIO - Pre-Work Conference Meeting Minutes 02.13.25.pdf`

**Answer:** I could not find an exact indexed passage in a37806 01 30 20 gen-002r00 - fio - that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq38] ✅ answered · 4.8s
**Query:** In the July 24, 2025 Monthly Job Progress Meeting, what were the main schedule and procurement discussion points recorded in the minutes?

**Domains:** contracts, documents, communication · **cacheHit:** false

**Sources:** `A37806 Monthly Job Progress Meeting Minutes 2025-07-24.pdf`

**Answer:** ## Schedule Discussion Points - (p. 10) The Design-Build Baseline Schedule was approved. - (p. 10) The June Update Narrative was submitted on 7/3/25, and a response was received on 7/9/25; the DB is to provide monthly updates. - (p. 10) A CRR was submitted on 7/11/25, and the DB needs to modify the DCB for PMC review for the Loaded Schedule. - (p. 10) The DB is to submit the 6-Week Look Ahead Schedule weekly, and PMC distributes it to stakeholders. ## Procurement Discussion Points - (p. 3) Eleva…

---

### [sq39] ✅ answered · 3.5s
**Query:** In the July 24, 2025 Monthly Job Progress Meeting, what design and engineering coordination items involving the consultant team were discussed?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806 Monthly Job Progress Meeting Minutes 2025-07-24.pdf`

**Answer:** ## Design and Engineering Coordination Items -   **Burnside Avenue Value Engineering Meeting:** To be set up by MLJTC2/MTA by 7/31/25. (p. 4) -   **Norwood SOGR:** Revised report submitted as correspondence; MLJTC2 to determine outage requirements for SOGR. (p. 4) -   **Avenue I Utility Work:** Coordination with Con Ed MOU in final stages. (p. 4) -   **Burnside Avenue DOT Option Work:** DEP comments letter includes Option Work scope, potentially delaying design approval. (p. 4) -   **Avenue I SB…

---

### [sq40] ✅ answered · 5.0s
**Query:** In the May 28, 2026 Monthly Job Progress Meeting Minutes, what new change proposal requests (CPRs) or RFIs were opened or closed during the period?

**Domains:** documents, communication · **cacheHit:** false

**Sources:** `A37806_01 30 20_GEN-143R00 - FIO - Monthly Job Progress Meeting Minutes 05.28.26.pdf`

**Answer:** ## CPRs and RFIs Opened/Closed - **Opened RFI-033**: New PA Server Testing, due 6/11/2026 (p. 5). - **Opened RFI-209**: PA/CIS system upgrade/replacement, submitted 5/27/2026 (p. 6). - **Opened CPR-003 R2**: Norwood SOGR, issued 5/6/2026 (p. 5). - **Opened CPR**: Burnside Avenue DOT Option Work (MTA to issue) (p. 5). - **Opened CPR**: MOU for Night Work (p. 5). - **Opened CPR**: Avenue I Coordination with MTA Signals (MTA to issue) (p. 6). - **Opened CPR**: PA/CIS system - (Upgrade and Replaceme…

---

### [sq41] ✅ answered · 3.3s
**Query:** In the May 28, 2026 Monthly Job Progress Meeting, what upcoming Grade Operations (GOs) are forecast for the next reporting period across the stations?

**Domains:** contracts · **cacheHit:** false

**Sources:** `A37806 Monthly Job Progress Meeting Minutes 2026-05-28.docx`

**Answer:** ## Upcoming Grade Operations (GOs) - **Burnside:** One (1) Continuous GO for Weeks 18-38 (p. 5). - **Myrtle:** One (1) GO scheduled for Week 21 (p. 5). - **Middletown:** One (1) GO scheduled for Week 25 (p. 5). - **Middletown:** One (1) PB GO scheduled for Week 23 (p. 5). - **Myrtle:** One (1) PB GO scheduled for Week 24 (p. 5). - **Norwood:** Two (2) PB GOs scheduled for Week 25 & Week 26 (p. 5).

---

### [sq42] ✅ answered · 2.9s
**Query:** In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what survey and layout deliverables are discussed?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`

**Answer:** ## Survey and Layout Deliverables - OCIP and Sub approval for surveyor by SDI: 12/22/2025 (p. 2)

---

### [sq43] ✅ answered · 3.3s
**Query:** In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what insurance and subcontractor onboarding items remain open for the surveyor?

**Domains:** contracts, subcontractor · **cacheHit:** false

**Sources:** `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`

**Answer:** ## Surveyor Onboarding Items - OCIP and Sub approval for surveyor (p. 2) - Target date for completion: 12/22/2025 (p. 2)

---

### [sq44] ✅ answered · 4.9s
**Query:** Which agencies issued the current permits submitted for Burnside Ave, and what is their approval status?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 33 10_BUR-007R00 - FIO - DOT Permits Exp 6.11.26.pdf`, `A37806_01 30 20_GEN-013R00 - FIO - Monthly Job Progress Meeting Minutes 04.24.25.pdf`, `A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10.21.25.pdf`, `A37806 MLJTC2 Monthly Progress Report - January 2025.docx` +4

**Answer:** ## Burnside Ave Permits - **Agency:** DOT (Department of Transportation) - **Permit 1 Status:** FIO (For Information Only), Issued 4/16/2026, Expires 6/11/2026 (p. 1) - **Permit 2 Status:** FIO (For Information Only), Amended, Expires 10/21/2025 (p. 2)

---

### [sq45] ✅ answered · 1.6s
**Query:** Which agencies issued the current permits submitted for Ave I, and what is their approval status?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 33 10_AVI-001R00 - FIO - DOT Permits Exp. 05.30.25.pdf`, `A37806_01 33 10_AVI-002R00 - FIO - Tree Work Permits.pdf`

**Answer:** ## AVI Permit Submittals The following permit-related submittal files are on record for AVI: - a37806 01 33 10 avi-001r00 - fio - - a37806 01 33 10 avi-002r00 - fio -

---

### [sq46] ⚠️ refusal/not-found · 4.5s
**Query:** Which agencies issued the current permits submitted for Myrtle Ave, and what is their approval status?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_Design-Build Agreement - Fully Executed.pdf`, `A37806 Proposal MLJTC2 - Vol 2.pdf`, `Exhibit B - Technical Proposal.pdf`, `P6 RFP Schedule.pdf` +4

**Answer:** ## Myrtle Ave Permits - The provided context does not contain information about specific agencies that issued permits for Myrtle Ave or their approval status. - The documents mention a "GEN-Submit Agency Coordination and Permitting Implementation Plan" (p6 rfp schedule, p. 1), but not the permits themselves.

---

### [sq47] ✅ answered · 1.6s
**Query:** Which agencies issued the current permits submitted for Middletown, and what is their approval status?

**Domains:** documents · **cacheHit:** false

**Sources:** `25.10.28 A37806-MTACD-MLJTC2-L-0117 - Delay ins Submission of Permit doc. & the RFCD Package for EDU2B Structural & Foundation Work – MDT.pdf`, `25.10.28 MTACD-MLJTC2-L-0117 - Delay ins Submission of Permit documents & the RFCD Package for EDU2B Structural & Foundation Work – MDT.pdf`, `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`, `A37806_01 33 10_MDT-005R00 - ORIG - Middletown Tree Work Permit.pdf` +4

**Answer:** ## MDT Permit Submittals The following permit-related submittal files are on record for MDT: - 25 10 28 a37806-mtacd-mljtc2-l-0117 - delay ins submission - 25 10 28 mtacd-mljtc2-l-0117 - delay ins submission - a37806 01 33 10 mdt-005r00 - fio - - a37806 01 33 10 mdt-005r00 - orig - - a37806 01 33 10 mdt-007r00 - fio - - a37806 01 33 10 mdt-009r00 - fio - - a37806 01 33 10 mdt-010r00 - fio- dot - a37806 01 33 10 mdt-011r00 - fio - - a37806 01 33 10 mdt-014r00 - fio - - a37806 01 33 10 mdt-017r00 …

---

### [sq48] ✅ answered · 4.0s
**Query:** Which agencies issued the current permits submitted for Norwood Ave, and what is their approval status?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_Design-Build Agreement - Fully Executed.pdf`, `A37806 Proposal MLJTC2 - Vol 2.pdf`, `Exhibit B - Technical Proposal.pdf`, `P6 RFP Schedule.pdf` +4

**Answer:** ## Norwood Ave Permits - The provided context does not list specific agencies that issued permits for Norwood Ave. - The approval status of permits for Norwood Ave is not available in the provided documents. - The documents mention a "GEN-Submit Agency Coordination and Permitting Implementation Plan" (p. 1, p6 rfp schedule), but not the permits themselves. Next step: Provide the "Agency Coordination and Permitting Implementation Plan" or permit logs.

---

### [sq49] ✅ answered · 1.8s
**Query:** In MDT-005R00 Middletown Tree Work Permit, what tree protection and pruning requirements apply during construction?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`

**Answer:** ## Section 2.5 Requirements Summary (a37806 01 33 10 mdt-005r00 - fio -) - Reviewed indexed section evidence from page(s): 4. - Key requirements captured from the section: - This includes guidelines for soil protection, erosion control, overhead clearance, excavation and trenching, irrigation, and water runoff. - Stumps and all surface roots shall be removed or ground to a minimum depth of twenty four inches (24") below grade. Evidence: a37806 01 33 10 mdt-005r00 - fio - (p. 4).

---

### [sq54] ✅ answered · 1.3s
**Query:** In BUR-081R00 January 2026 Construction Photos, what safety measures and MPT signage are visible in the January 20, 2026 photos?

**Domains:** field_ops · **cacheHit:** false

**Sources:** `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf`

**Answer:** ## January 20, 2026 Photo Safety & MPT Signage - **CRITICAL:** The provided document summary for "BUR-081R00 - FIO - January 2026 Construction Photos" does not contain specific details about visible safety measures or MPT signage. - It only generally mentions "Maintenance and Protection of Traffic (MPT)" and "demolition shielding installation." - To answer this query, the actual photo content from the PDF "A37806_01 32 10_BUR-081R00 - FIO - January 2026 Construction Photos.pdf" would need to be …

---

### [sq55] ✅ answered · 1.1s
**Query:** In BUR-081R00 January 2026 Construction Photos, what excavation or foundation work is documented at the Burnside Avenue northbound side?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf`

**Answer:** ## Burnside Avenue Northbound Excavation/Foundation Work - Utility relocation trench work is documented. - Con Edison is involved in the utility relocation. - Road plate protection is in place over the trench. - Demolition shielding installation is also shown. - Photos were taken on January 20, 2026. - This work is part of accessibility upgrades under Contract A37806 Design-Build Services Package 6. - The document is for NYCT/MTA review and approval.

---

### [sq56] ⚠️ refusal/not-found · ✓ 869ms (exact-ID)
**Query:** In BUR-080R00 Burnside December 2025 Construction Photos, on what dates were the photos taken and what site conditions are shown?

**Domains:** field_ops · **cacheHit:** false

**Sources:** `A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf`

**Answer:** ## Answer - I could not find an exact indexed passage in a37806 01 32 10 bur-080r00 - fio - that answers this question. - No evidence-backed specification text was verified in the retrieved chunks for this request. - Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq57] ⚠️ refusal/not-found · 1.1s
**Query:** In BUR-080R00 Burnside December 2025 Construction Photos, what staging areas and material deliveries are documented?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf`

**Answer:** ## Answer - I could not find an exact indexed passage in a37806 01 32 10 bur-080r00 - fio - that answers this question. - No evidence-backed specification text was verified in the retrieved chunks for this request. - Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq58] ✅ answered · 1.1s
**Query:** In MYR-076R00 Myrtle December 2025 Construction Photos, what elevator or stair construction progress is shown at Myrtle Avenue station?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`

**Answer:** ## Myrtle Avenue Station Progress - The document "MYR-076R00 Myrtle December 2025 Construction Photos" shows installation of vibration monitoring equipment at Myrtle Avenue work area (p. 1). - No elevator or stair construction progress is shown in this specific photo submittal (p. 1).

---

### [sq59] ✅ answered · ✓ 860ms (exact-ID)
**Query:** In MYR-076R00 Myrtle December 2025 Construction Photos, what date range do the photos cover and who prepared the submittal?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`

**Answer:** ## Photo Submittal Details - The photo is dated December 19, 2025 (p. 1). - The submittal was prepared by Clifford Mason (dba MASE FX) for MLJ Contracting, Inc. (p. 1).

---

### [sq60] ✅ answered · 2.4s
**Query:** In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings or schedule benefits are claimed for the value engineering change proposal?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf`

**Answer:** ## VECP Cost/Schedule Benefits No cost savings or schedule benefits are claimed in the provided document. The document is an EMD Contract Compliance Work Order Request form, not a VECP presentation.

---

### [sq61] ✅ answered · 2.5s
**Query:** In the Burnside Avenue VECP Presentation, which design disciplines are affected by the proposed value engineering changes?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf`

**Answer:** ## Affected Design Disciplines - Civil (p. 1)

---

### [sq62] ⚠️ refusal/not-found · 2.0s
**Query:** In PRO 26-01 Control of Project Nonconforming Items, what are the steps for dispositioning a nonconforming item once an NCR is issued?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `MLJ Projection- Con Ed wingback T&E.xlsx`

**Answer:** I could not find an exact indexed passage in mlj projection- con ed wingback t&e that answers this question. No evidence-backed specification text was verified in the retrieved chunks for this request. Refine with a section heading or exact phrase and I will search only this file again.

---

### [sq63] ✅ answered · 1.5s
**Query:** In GEN-006R01 NCR Template & Log, what fields are included on the NCR form itself for documenting a nonconformance?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 40 10_GEN-006R01 - AEAN - NCR Template & Log.pdf`

**Answer:** ## NCR Form Fields -   NCR Number -   Project Name -   Contract Number -   Drawing Number -   Specification Section -   Location of Nonconformance -   Date NCR Occurred -   Date NCR Initiated -   Description of Nonconformance -   Proposed Disposition -   Corrective Action -   Root Cause Analysis -   Responsible Party -   Target Completion Date -   Actual Completion Date -   Verification of Corrective Action -   Re-inspection Date -   Signatures for Project Manager, Quality Manager, Designer, NYC…

---

### [sq64] ✅ answered · 1.6s
**Query:** Summarize the track limit revisions and closure disposition in A37806_RFI-0203 Norwood J1 Revised Track Limits R1.

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf`

**Answer:** ## Track Limit Revisions and RFI Disposition -   **Track J2:** MTA directed full replacement by MOW Track Construction (p. 2). -   **Track J1:** Limits extended to use procured J2 materials, maintaining contract trackwork length (p. 2). -   **Clarifications Requested:** J1 contact rail, heat trace, and track replacement limits (p. 2). -   **RFI Status:** Closed (CLO) as per document title. -   **Cost/Time Impact:** Probable increase in both cost and time due to MTA's change in direction (p. 2).

---

### [sq65] ⚠️ refusal/not-found · 3.3s
**Query:** In J-TRACK-13A-041R00 Material I&T Request for the 100-8 6-hole joint bar, what is the inspection and test status and who is the material supplier?

**Domains:** field_ops, documents · **cacheHit:** false

**Sources:** `A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF`

**Answer:** ## Inspection and Test Status - (p. 7) The material I&T request for the 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs) is "Not_Reviewed" as of 03/13/2026. - (p. 7) The request was approved by MTA I&T, and the PMC notified DB on 3/27. - (p. 12) Any drawing without an MTA approval stamp cannot be used for inspection. - (p. 17) The Design-Builder must ensure that running and guard rails, contact rail and end approaches, insulators, fiberglass materials and components, crossties and tie blocks, concre…

---

### [sq66] ✅ answered · 3.0s
**Query:** In RFI-0115 for the Myrtle Avenue Louver Exhaust Face Velocity issue, what resolution or design change was proposed to address the velocity problem?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_RFI-0115 - CLO - Louver Exhaust Face Velocity 09.04.25.pdf`

**Answer:** ## RFI-0115 Resolution - The design builder shall proceed with horizontal blade louvers to maintain consistent architectural appearance (p. 3). - The 50% free area is based on the actual louver area, not a 48" x 48" model (p. 3). - The design builder shall select a horizontal blade louver that meets most PRDC requirements (p. 3). - The design builder must explain why certain criteria cannot be met and justify performance concessions (p. 3).

---

### [sq67] ✅ answered · 1.2s
**Query:** In RFI098 for the Ave I Conductor Board at Station 489+00, what resolution or field direction was provided and who responded to the RFI?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf`

**Answer:** ## RFI 098 Resolution and Respondent - **Resolution/Field Direction:** Not provided in the retrieved context. The RFI is requesting direction/approval. - **RFI Initiator:** AECOM (p. 1) - **Action Requested:** Direction (p. 1) - **Probable Cost Effect:** Unknown (p. 1) - **Probable Time Effect:** Increase (p. 1)

---

### [sq68] ✅ answered · 1.4s
**Query:** In RFI098 for the Ave I Conductor Board, what track and platform dimensions are noted around Station 489+00 to 490+00?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf`

**Answer:** ## Track and Platform Dimensions (RFI098) - **Station 490+00:**     - Northbound platform (Track B2) has a conductor board. (p. 1)     - Drawing AVI-G-103 depicts a 40-ft long ADA boarding area centered at this station. (p. 1) - **Station 489+00:**     - Northbound platform (Track B2) has a conductor board. (p. 1)     - This conductor board appears to correspond to a 4-car train. (p. 1)     - No ADA boarding area or path is shown at this station in Drawing AVI-G-103 or AVI-G-122. (p. 1)

---

### [sq69] ✅ answered · 2.9s
**Query:** In A37806 RFI096, what question is being asked of the design team and what is the RFI status?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Norwood ONLY.pdf`

**Answer:** ## Question to Design Team - (p. 1, p. 10) MLJ Contracting Corp asks the design team to provide an updated project schedule and design/shop drawings for contract W47032 to evaluate potential equipment and wiring relocations at Norwood Ave. and Myrtle Ave. stations. ## RFI Status - (p. 1, p. 2, p. 3) The RFI status is "Closed," but coordination details are pending.

---

### [sq70] ✅ answered · 3.0s
**Query:** In A37806 RFI096, what dimensional discrepancy or field condition prompted the RFI at the McDonald Avenue station?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Norwood ONLY.pdf`

**Answer:** ## Answer - The provided RFI (A37806 RFI-0042) does not pertain to McDonald Avenue station. - It is titled "Coordination with Contract W47032 – PS LAN system _Norwood ONLY". - Therefore, no dimensional discrepancy or field condition for McDonald Avenue station is discussed within this document. - **Evidence:** a37806 rfi-0042 - clo - coordination with contract (p. 6, 7, 18).

---

### [sq71] ✅ answered · 1.3s
**Query:** In MYR-002R00 Myrtle Avenue Demo Shield Drawings, what loading criteria and design standards apply to the demolition shielding?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 10 30_MYR-002R00 - AAN - Myrtle Demo Shield Drawings.pdf`

**Answer:** ## Demolition Shielding Design Criteria -   **Loading Criteria:** Temporary loads imposed on the permanent structure (p. 1, 2). -   **Design Standards:**     -   Latest edition of the New York State Building Code (p. 2).     -   NYCTA Regulations and Design Standards (p. 2).     -   OSHA Requirements (p. 2).     -   New York State Department of Transportation Requirements (p. 2). -   **Conflict Resolution:** Where requirements conflict, the more stringent shall apply (p. 2). -   **Contractor Res…

---

### [sq72] ✅ answered · 2.7s
**Query:** In drawing MYR-A-444A, what dimensions and mounting details are shown for the EL1121/EL1122 elevator enclosure panels at Myrtle Avenue station?

**Domains:** documents · **cacheHit:** false

**Sources:** `Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf`

**Answer:** ## Elevator Enclosure Panel Details - The requested drawing MYR-A-444A is not found in the provided context. - The active document "myrtle expansion joint pages from 8 03 -" does not contain details for elevator enclosure panels. - Next step: Provide drawing MYR-A-444A for review.

---

### [sq73] ✅ answered · 4.5s
**Query:** In RFI-0116 for the Myrtle Avenue PS LAN followup, who attended the September 9, 2025 coordination meeting recorded in the attendance report?

**Domains:** contracts, documents · **cacheHit:** false

**Sources:** `A37806_RFI-0116 -Follow-up to RFI 0057 Myrtle Ave PS LAN coordination - Attendance report 9-09-25.csv`

**Answer:** ## RFI-0116 Meeting Attendees - 17 participants attended the meeting. - Participants included Tylin, MLJ Contracting, TC Electric, MTACD, NYCT, and AECOM. - Key roles were organizers and presenters.

---

### [sq74] ✅ answered · ✓ 209ms (exact-ID)
**Query:** In RFI-009 for Myrtle Avenue UPS Backup Requirements, what battery runtime or backup duration is required and what spec section governs it?

**Domains:** documents, scheduling · **cacheHit:** false

**Sources:** `806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf`

**Answer:** ## Section 7.5 (806-rfi-009 - myrtle avenue ups backup requirements) - Exact indexed section text from page(s): 1. ```text TCE, LLC 1010 Northern Blvd., Suite 203 Great Neck, New York 11021 P: +16468136400 Project: A37806 ADA Package 6 235 W 23rd st New York, New York 10011 RFI #806-RFI-009: Myrtle Avenue UPS Backup Requirements Revision 0 Status Open To Andy Lau (TCE, LLC) Jesse Deariso (TCE, LLC) Nicholas Zito (TCE, LLC) From Nicholas Zito (TCE, LLC) New York Date Initiated Sep 30, 2025 Due Da…

---

### [sq75] ✅ answered · 6.4s
**Query:** In GEN-096R04 SWP-016 for Elevator Steel and Enclosure, what safe work procedures apply to steel erection and what fall protection is required?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf`

**Answer:** ## Steel Erection Safe Work Procedures - A safety toolbox meeting will be held at the beginning of each shift concerning issues that pertain to the shift’s activities and anticipated hazards (p. 13). - SWP to be reviewed/signed with all personnel prior to start of work (p. 13). - Daily Safety Briefing/Fitness for Duty with all personnel prior to entering work site (p. 13). - Personnel will only have foul trackage, work on platforms, or enter the ROW in the direction of MTA Flaggers (p. 14). - Ma…

---

### [sq76] ✅ answered · 6.1s
**Query:** What are the main hazards and controls covered in SWP-016?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `SWP 016 + Attachment.pdf`

**Answer:** ## Main Hazards - (p. 2) Hazards include improper ID, invalid certifications, compromised site security, workers ill-equipped for tasks, worker strain, slips/trips/falls, facility damage, pedestrian injuries, struck-by, train traffic, electrical hazards, and cuts/scrapes/lacerations when entering the worksite. - (p. 3) Hazards include train traffic, electrical hazards, cuts/scrapes/lacerations, and slips/trips/falls when working along the Right of Way (ROW). - (p. 4) Hazards include electrical h…

---

### [sq77] ✅ answered · 2.2s
**Query:** In GEN-041R01 SWP-011 for Platform Concrete Demo, what PPE and respiratory protection is required for the demolition crew?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf`

**Answer:** ## Demolition Crew PPE and Respiratory Protection -   **General PPE:** Hard hats (brim forward), safety glasses, Agency Approved Tear Away Reflective Safety Vest, safety boots (min. 6" ankle height), work gloves (as necessary) (p. 6). -   **Fall Protection:** Guardrail system or OSHA-compliant PFAS with a climbing or rescue type helmet for falls greater than 6' (p. 7). -   **Hearing Protection:** Required for all workers in the vicinity of demo power tools and saws (p. 9). -   **Respiratory Prot…

---

### [sq78] ✅ answered · 5.5s
**Query:** What work activity does SWP-011 cover and what are its primary safety controls?

**Domains:** field_ops · **cacheHit:** false

**Sources:** `A37806 SWP-011 - Platform Concrete Demo - Rev 1   6.23.25.pdf`

**Answer:** ## Work Activity - (p. 1, p. 2) SWP-011 covers the demolition of platform concrete using various tools like demo saws, air chipping hammers, hand tools, ladders, power tools, and rail carts, with fire retardant tarps for containment if needed. ## Primary Safety Controls - (p. 4) Conduct a safety toolbox meeting at the beginning of each shift to discuss activities and hazards, and review the SWP with all personnel before work starts. - (p. 4) Ensure flagging arrangements are in place, and identif…

---

### [sq79] ✅ answered · ✓ 347ms (exact-ID)
**Query:** What work activity does SWP-032 cover and which spec section governs it?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf`

**Answer:** ## Section 3.01 (swp 032 - general formwork, rebar and concrete) - Exact indexed section text from page(s): 13, 14. ```text Action Plan • Catastrophes, Natural Disaster, or Human Error • Notify C&D EIC IMMEDIATELY • Follow EAP, Supervisors, and Safety Personnel directives • All incidents/accidents/Near-Misses shall be reported to NYCT C&D Safety Immediately and documentation (CIR and C2-F) is due within 24hrs. • Emergency Contact numbers (manned and available 24-hours) are posted at job sites, m…

---

### [sq80] ✅ answered · 2.3s
**Query:** In the GEN-055R01 SWP-032 submittal, what review comments or conditions of approval were noted for the general formwork, rebar, and concrete safe work plan?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf`

**Answer:** ## Section 3.01 (swp 032 - general formwork rebar and concrete) - Exact indexed section text from page(s): 15, 16, 18. ```text SAFE WORK PLAN SWP - 032 SWP – 032 – General formwork, rebar and concrete– Rev. 1 8/6/25 STEP RISK PREVENTION/MITIGATION COMMENT concrete finishing tools when crossing behind finishing workers. 12. Housekeeping /Clean-up • Slips/Trips/Falls • Excess Dust • Housekeeping will be conducted daily throughout the work shift. • Remove all unused materials from the job site • Se…

---

### [sq81] ✅ answered · ✓ 224ms (exact-ID)
**Query:** In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what barricade construction and signage requirements apply to the closed staircase?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf`

**Answer:** ## Section 3.28 (swp 052 mezzanine stair barricade) - Exact indexed section text from page(s): 5, 6, 7. ```text SAFE WORK PLAN SWP – 052 - BUR SWP 052 – Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026 2. continued be permitted in the swing radius of any equipment while the equipment is in operation  First aid kits & eyewash station will always be on site  Review of NYCT zero tolerance for Drug/alcohol & Tobacco policy  All workers shall be protected from fall…

---

### [sq82] ✅ answered · 12.1s
**Query:** In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what fire watch and hot work precautions are specified?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf`

**Answer:** ## Fire Watch and Hot Work Precautions - The document does not specify fire watch or hot work precautions. - Fire hazards are listed as a general worker protection concern (p. 5). - Fire retardant (stamped) plywood is specified for barrier construction (p. 1, 3). Next step: Request an updated SWP-052 that includes specific fire watch and hot work procedures, if applicable to the scope.

---

### [sq83] ✅ answered · 2.6s
**Query:** In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what qualifications, certifications, and experience are listed for the safety coordinator?

**Domains:** field_ops, documents · **cacheHit:** false

**Sources:** `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf`

**Answer:** ## Diego Gonzalez Safety Coordinator Qualifications - **Experience:** Over 13 years in construction and environmental safety (p. 5). - **Work Experience:** Site Safety Representative (6/2015-Present), Project Monitor, Air Technician, Safety Technician (11/2009-3/2014) (p. 5, 7). - **Education:** A.A.S. Degree from City College of New York (p. 5). - **Certifications & Training:**     - NYC DOB 40 Hr. Site Safety Manager (p. 5)     - OSHA 30 Hr. Construction (p. 5)     - Supervisor of De-leading o…

---

### [sq84] ✅ answered · 1.7s
**Query:** What role and reporting relationship does the GEN-021R00 Safety Coordinator submittal establish?

**Domains:** field_ops, documents · **cacheHit:** false

**Sources:** `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf`

**Answer:** ## Safety Coordinator Role and Reporting -   **Role:** Safety Coordinator, 100% safety-related (p. 6). -   **Responsibilities:** Review APP/EHASP, HAZCOM Program, conduct safety orientations, review SDS, ensure SWP/JHA adherence to OSHA 1926, DOB CH 33, FDNY, NYCT SPEC 1S, develop safety work plans, establish compliance, perform worksite assessments, conduct weekly safety meetings and Toolbox Talks, provide daily safety reports, conduct emergency evacuation drills, inspect PPE, conduct accident/…

---

### [sq85] ⚠️ refusal/not-found · 4.6s
**Query:** In the Schedule Update 5 June 2025, what is the critical path and which activities have the least float?

**Domains:** scheduling · **cacheHit:** false

**Sources:** `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf`

**Answer:** ## Critical Path - (p. 5) The critical path for the project is detailed in Appendix A-2. - (p. 5) For Myrtle Ave, the critical path involves communication relocation at the platform level, followed by bulletin submission, platform preparation for new steel, overpass erection with platform elevators, and elevator enclosure installation. - (p. 6) For Middletown, the critical path follows the long lead electrical design unit to the submission and fabrication of long lead panels, followed by station…

---

### [sq86] ✅ answered · 3.7s
**Query:** In the Schedule Update 5 June 2025, what are the planned start and finish dates for the Myrtle Avenue elevator enclosure activities?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf`

**Answer:** ## Myrtle Avenue Elevator Enclosure - (p. 8) The Myrtle Avenue Elevator EL 1120 activity is planned to start on May 21, 2026, and finish on September 8, 2026. - (p. 35) The EDU04 Elevator Enclosure Procurement activity is planned to start on July 1, 2025, and finish on September 18, 2025.

---

### [sq87] ✅ answered · ✓ 364ms (exact-ID)
**Query:** In spec section 21 12 00 for Fire-Suppression Standpipes, what materials and pressure ratings are required for standpipe piping and fittings?

**Domains:** documents · **cacheHit:** false

**Sources:** `21 12 00 - Fire-Suppression Standpipes REV 1.pdf`

**Answer:** ## Section 2.11 Requirements Summary (21 12 00 - fire-suppression standpipes rev 1) - Reviewed indexed section evidence from page(s): 1, 2, 3, 4, 6. - Key requirements captured from the section: - FIRE DEPARTMENT CONNECTIONS [p.6] 2.12 PIPE HANGERS AND SUPPORTS [p.6] 3.3 INSTALLATION [p.9] 3.4 CLEAN UP [p.11] 3.5 TESTING [p.12]. - Section 01 33 00 Submittal Procedures 1.3 CITED STANDARDS Unless otherwise noted, the latest edition of the following codes and standards shall govern this work. - 393…

---

### [sq88] ✅ answered · ✓ 259ms (exact-ID)
**Query:** In spec section 21 12 00 for Fire-Suppression Standpipes, what testing and flushing requirements apply before the system is placed in service?

**Domains:** documents · **cacheHit:** false

**Sources:** `21 12 00 - Fire-Suppression Standpipes REV 1.pdf`

**Answer:** ## Section 2.11 Requirements Summary (21 12 00 - fire-suppression standpipes rev 1) - Reviewed indexed section evidence from page(s): 1, 2, 3, 6. - Key requirements captured from the section: - FIRE DEPARTMENT CONNECTIONS [p.6] 2.12 PIPE HANGERS AND SUPPORTS [p.6] 3.3 INSTALLATION [p.9] 3.4 CLEAN UP [p.11] 3.5 TESTING [p.12]. - Section 01 33 00 Submittal Procedures 1.3 CITED STANDARDS Unless otherwise noted, the latest edition of the following codes and standards shall govern this work. - 393 – …

---

### [sq89] ✅ answered · 4.4s
**Query:** In BUR-042R01 EDU07 SOGR at Burnside Avenue, what surface preparation and painting system is specified for structural steel?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue_Redline.pdf`

**Answer:** ## Structural Steel Surface Preparation and Painting System - Existing corroded structural steel and/or connections exposed by new construction shall be repaired or replaced as required (p. 6). - Paint shall be scraped or wire-brushed to remove peeling and cleaned of rust to bright finish down to sound metal (p. 6). - Repair designs shall provide all requirements for complete repair of member to a state of good repair, including surface preparations, surface treatments, and protective coatings (…

---

### [sq90] ✅ answered · 3.2s
**Query:** In BUR-042R01 EDU07 SOGR at Burnside Avenue, what concrete repair materials and crack repair methods are specified?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue_Redline.pdf`

**Answer:** ## Concrete Repair Materials and Methods - **Concrete Replacement/Patching:** Includes materials, surface preparations, additional reinforcement, placement, finishing, and curing (p. 12, 52, 53, 54, 55, 56). - **Corrosion Inhibitors:** Required for concrete repairs (p. 12, 52, 53, 54, 55, 56). - **Stud Connections:** Part of concrete repair scope (p. 12, 52, 53, 54, 55, 56). - **Crack Grouting or Sealing:** Specified method for crack repair (p. 12, 52, 53, 54, 55, 56). - **Surface Sealants and P…

---

### [sq91] ✅ answered · 3.1s
**Query:** In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what documents or reports were enclosed and what response is requested?

**Domains:** documents, field_ops · **cacheHit:** false

**Sources:** `Transmittal 212-NOR Xfer Girder inspection.pdf`

**Answer:** ## Transmittal 212-NOR Enclosures and Requested Response - **Enclosed Documents:**     - A37806 ADA P6- Submittal Certification - NOR XFER GIRDER INSPECTION REPORT (p. 1)     - ADA_P6-Norwood Av_Transfer Girder Field Report dated 03/30/2026 (p. 1) - **Requested Response:** Approval (p. 1)

---

### [sq92] ✅ answered · 1.1s
**Query:** In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what defects or structural conditions were observed during the sewer inspection?

**Domains:** field_ops, documents · **cacheHit:** false

**Sources:** `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf`

**Answer:** ## Sewer Inspection Defects - The 12-inch VCP combined sewer from M3071513 to M3083356 is in poor condition with a visible void and heavy grease (p. 2). - The 12-inch VCP combined sewer from M3083356 to M3083358 is in fair condition with heavy grease (p. 2).

---

### [sq93] ✅ answered · 1.1s
**Query:** In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what remediation or repair recommendations are made for the inspected sewer segments?

**Domains:** documents, field_ops · **cacheHit:** false

**Sources:** `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf`

**Answer:** ## Sewer Remediation Recommendations - **Segment M3071513 to M3083356:** Remediation required due to poor condition, visible void, and heavy grease accumulation. - **Segment M3083356 to M3083358:** Cleaning recommended to address heavy grease accumulation.

---

### [sq94] ⚠️ refusal/not-found · 1.7s
**Query:** In the EDU05B Electrical Long Lead submittal for Norwood Avenue Station, which long-lead electrical equipment items are identified and what are their procurement lead times?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf`

**Answer:** ## Long-Lead Electrical Equipment - (p. 3, 4, 12) The EDU05B Long Lead Electrical Equipment Procurement for Myrtle Avenue Station is a submittal for Release For Construction Documents (RFCDs). - (p. 6) Long-lead electrical equipment identified for Myrtle Avenue Station includes: 800A Distribution Board, Con Ed Trans S - Combo CT + Meter + 800A Bolted Pressure Service Switch (w/ Class L Fuses), 200A Generator Connection Box, 400A Distribution Panel (DP-EMR-1), 100A Lighting Panel (LP-1,2,3), 30A …

---

### [sq95] ✅ answered · 1.5s
**Query:** In the EDU05B Electrical Long Lead submittal, what voltage and phase ratings are specified for the panels in the load schedule?

**Domains:** documents · **cacheHit:** false

**Sources:** `EDU05B RFCD - AAN - Electrical Long Lead.pdf`

**Answer:** ## Panel Voltage and Phase Ratings - **LP-1:** 120/208V, 3-phase, 4-wire (p. 19) - **DP-EMR-1:** 120/208V, 3-phase, 4-wire, 65kA (p. 19, 23) - **DBN:** 120/208V, 3-phase, 4-wire, 100kA (p. 19) - **DBN-1:** 120/208V, 3-phase, 4-wire, 100kA (p. 23)

---

### [sq96] ✅ answered · ✓ 951ms (exact-ID)
**Query:** In GEN-014R00 Monthly Quality and Certification Report for May 2025, what nonconformances or corrective actions are recorded for the reporting period?

**Domains:** contracts · **cacheHit:** false

**Sources:** `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf`

**Answer:** ## Nonconformances and Corrective Actions (May 2025) - No non-conformances recorded (p. 4). - No corrective actions recorded (p. 4).

---

### [sq97] ✅ answered · 1.0s
**Query:** In GEN-014R00 Monthly Quality and Certification Report for May 2025, who prepared and certified the report and what period does it cover?

**Domains:** documents, contracts · **cacheHit:** false

**Sources:** `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf`

**Answer:** ## Report Preparation and Certification - **Prepared By:** Nabeel Anjum, Project Quality Manager (p. 4) - **Date Prepared:** June 3, 2025 (p. 4) - **Report Period:** May 2025 (p. 4)

---

### [sq98] ✅ answered · 2.0s
**Query:** In the PRDC12-019R00 SikaGrout 212 product submittal, what mixing ratios and cure times are specified for the grout?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

**Answer:** ## SikaGrout 212 Mixing and Curing - **Mixing Ratios:**     - Water is added in recommended proportion to powder.     - Mix thoroughly for 3 minutes with a low-speed hand drill mixer (< 500 rpm) until homogenous and lump-free (p. 21).     - For deeper applications (plastic and flowable consistency only), 25 lbs. of 3/8" (9.5 mm) coarse aggregate can be added (p. 21).     - Aggregate must be non-reactive (ASTM C-1260, C-227, C-289), clean, well-graded, saturated surface dry, low absorption, high …

---

### [sq99] ✅ answered · 3.8s
**Query:** In the PRDC12-019R00 SikaGrout 212 product submittal, what shelf life and storage conditions are required for the product?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

**Answer:** ## SikaGrout 212 Shelf Life and Storage -   **Shelf Life:** 12 months from date of production (p. 19). -   **Storage Conditions:** Store dry at 40–95 °F (4–35 °C) in original, unopened, and undamaged sealed packaging (p. 19). -   **Protection:** Protect from moisture; discard if damp (p. 19). -   **General:** Keep in a well-ventilated, dry place, observe label precautions, and store in accordance with local regulations (p. 11).

---

### [sq100] ✅ answered · ✓ 456ms (exact-ID)
**Query:** In the PRDC12-012R02 Lead Placard Package for Burnside, what air monitoring and worker protection requirements apply to the lead abatement work?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf`

**Answer:** ## Section 12.18 Requirements Summary (a37806 prdc12-012r02 - r&r - lead placard package-burnside) - Reviewed indexed section evidence from page(s): 33, 34, 35, 36. - Key requirements captured from the section: - Be hazardous, the Hazardous Lead Waste label will be affixed to the drum. - HEPA vacuuming will be implemented periodically lead abatement in the enclosed area to avoid accumulation of debris. - (718) 357-4831 2 of 6 Prior to demolition activities protective covering will be established…

---

### [sq101] ✅ answered · 2.7s
**Query:** In PRDC12-012R02 Lead Placard Package for Burnside, what regulatory notifications and posting requirements apply before lead abatement begins?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf`

**Answer:** ## Section 360.8 (a37806 prdc12-012r00 - orig - lead placard package-burnside) - Exact indexed section text from page(s): 36, 37, 38, 39. ```text LEAD DISTURBANCE PLACARD PACKAGE REV # 0 BURNSIDE AVENUE STATION CONTRACT A37806 DESIGN-BUILD SERVICES FOR ADA UPGRADES PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS ITEM #5 EMERGENCY RESPONSE AND NOTIFICATION PLAN EMERGENCY RESPONSE AND CONTINGENCY PLAN REV # 1 CONTRACT A37806 DESIGN-BUILD SERVICES FOR ADA UPGRADES PACKAGE 6: ACCESSIBILITY UPGRAD…

---

### [sq102] ✅ answered · 4.8s
**Query:** In PRDC12-019R00 SikaGrout 212 product submittal, what yield per unit and application thickness range are listed in the product data?

**Domains:** documents · **cacheHit:** false

**Sources:** `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

**Answer:** ## SikaGrout 212 Product Data - **Yield per unit:** Not specified in the provided context. - **Application thickness range:** Not specified in the provided context. Evidence: a37806 prdc12-019r00 - app - sikagrout 212 (p. 1, 5, 17).

---

