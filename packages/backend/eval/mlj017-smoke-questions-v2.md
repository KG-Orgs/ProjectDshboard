# MLJ-017 Smoke Questions — Revised v2

**Project:** `731cfd5d-e647-4551-89e7-0a3cc4915115` — MLJ-017 Package 6 - General (TEST CLONE)  
**Revised:** 2026-06-27  
**Original Seed:** 20260619  
**Questions:** 110 across 63 files, 16 categories

Run with `pnpm eval:smoke` (full) or `pnpm eval:smoke-search` (retrieval only) from `packages/backend`.

> **About this revision:** Questions rewritten to reflect realistic queries from Heavy Civil GC team members. A **Role** column indicates who would typically ask each question (PM, PE, FE, Super, Scheduler, CE).
>
> ⚠️ **Binary chunks** (from .pptx/.msg/.docx embedded objects): queries simplified to "what does the document state" and flagged. The `acceptableAnswerContains` phrases in the JSON are garbage binary strings — those entries need JSON-level fixes before they can score correctly.

---

## change_order

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-69891ac7-c2` | PE | What is the scope of work in CO#15 for the Ave I water service relocation, and who is performing it? | CO#15 - Ave I Relocate Water Service (MLJ Interal) | water, relocate, service, assistant | CO#15 - Ave I Relocate Water Service (MLJ Interal).pdf (page 1) |

---

## contract

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-da0c6d56-c48` | PM | What scope of work and pricing is in Island Pavement Cutting Co's subcontract under GEN-051R00? | A37806_GEN-051R00 - APP - Subcontractor Approval Forms, A37806, 051R00 | contracting, prog, rosemar, inc. | A37806_GEN-051R00 - APP - Subcontractor Approval Forms - Island Pavement Cutting Co Inc..pdf (page 36) |
| `chunk-da0c6d56-c30` | PM | What joint sealing and pavement cutting contract work does Island Pavement Cutting Co list in their GEN-051R00 subcontractor approval forms? | A37806_GEN-051R00 - APP - Subcontractor Approval Forms, A37806, 051R00 | prog, contracting, sealing, joint | A37806_GEN-051R00 - APP - Subcontractor Approval Forms - Island Pavement Cutting Co Inc..pdf (page 32) |
| `chunk-44a66cdc-c2` | PM | What subcontractor is approved in MLJTC2-L-0022, what is their contract value, and what scope are they approved to perform under A-37806? | 2025-03-19 MTACD-MLJTC2-L-0022 Sub-Contractor Approval, MLJTC2, Contractor | sub-contractor, engineering, surveying, munoz | 2025-03-19 MTACD-MLJTC2-L-0022 Sub-Contractor Approval Munoz Engineering Land Surveying DPC $241,473.00.pdf (page 1) |
| `chunk-38b42538-c48` | PE | In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what requirements does spec section 01 10 30 include? | Pre-Proposal Slideshow_A37806_RFP_Addendum_02, A37806 | 01 10 30, information, avenue, construction | Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf (page 46) |
| `chunk-38b42538-c19` | PM | In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what ADA accessibility scheme and project information is presented? | Pre-Proposal Slideshow_A37806_RFP_Addendum_02, A37806 | information, contained, representation, presentation | Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf (page 18) |
| `chunk-1be1940a-c51` | PM | In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what does the Contract Specific Responsibility Form require of significant subcontractors? | A37806_GEN-027R00 - R&R - Subcontractor Approval Forms, A37806, 027R00 | subcontractor, contract, significant, perform | A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf (page 30) |
| `chunk-1be1940a-c26` | PM | In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what is the ownership percentage and partner breakdown for this joint venture? | A37806_GEN-027R00 - R&R - Subcontractor Approval Forms, A37806, 027R00 | percentage, ownership, partner, party | A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf (page 16) |
| `chunk-82296656-c12` | PM | In the M017_IMP Draft Subcontract, what payment provisions from the prime contract are specifically excluded from the incorporated subcontract documents? | M017_IMP_Draft Subcontract_20260227, Subcontract, 20260227 | provisions, subcontract, subcontractor, payment | M017_IMP_Draft Subcontract_20260227.docx |
| `chunk-82296656-c10` | PM | In the M017_IMP Draft Subcontract, what does the entire agreement clause say about how prior oral or written agreements between the parties are treated? | M017_IMP_Draft Subcontract_20260227, Subcontract, 20260227 | subcontract, subcontractor, documents, represents | M017_IMP_Draft Subcontract_20260227.docx |

---

## correspondence

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-6068cbdd-c2` | PE | In Transmittal 0014 for MTA Personnel and PMC Supplies, what items were submitted under spec 01 50 00 and what was their review status when returned? | A37806 Transmittal 0014 - MTA Personnel and PMC Suppli, A37806, Transmittal | 01 50 00, returned, anodized, white | A37806 Transmittal 0014 - MTA Personnel and PMC Supplies.pdf (page 1) |
| `chunk-862d3b51-c2` | PM | In the March 3, 2026 letter regarding Cary Winston, what ADA accessibility upgrade stations are referenced and what is being requested of MTA? | 2026-03-03 Cary Winston Access pass 2026 signed | construction, providence, corp., upgrades | 2026-03-03 Cary Winston Access pass 2026 signed.pdf (page 1) |
| `chunk-862d3b51-c3` | PM | In the Cary Winston 2026 access pass document, what information must contractor employees provide when requesting temporary NYC Transit access passes? | 2026-03-03 Cary Winston Access pass 2026 signed | access, pass, transportation, temporary | 2026-03-03 Cary Winston Access pass 2026 signed.pdf (page 3) |
| `chunk-fb1040ac-c2` | PE | In Transmittal 0012 dated January 9, 2026, what was submitted under spec 01 50 00 and what was the review outcome? | A37806 Transmittal 0012 - Masks KN95 01.09.2026, A37806, Transmittal | 01 50 00, returned, masks, submitted | A37806 Transmittal 0012 - Masks KN95 01.09.2026.docx |
| `chunk-3ccd72b4-c2` | PM | In the TC Electric letter to Michael Wilson dated September 5, 2025, what access is being requested for TC Electric employees on the A37806 project? | A37806 - TC Electric Letter, A37806 | access, your, employees, upgrades | A37806 - TC Electric Letter.pdf (page 1) |
| `chunk-9efaf435-c1709` ⚠️ | FE | In A37806 Test Pit MPT for Community Relations Use, what does the document state? | A37806 Test Pit MPT for Community Relations Use, A37806 | *(binary — JSON must-contain phrases need replacement)* | A37806 Test Pit MPT for Community Relations Use.msg |
| `chunk-9efaf435-c4249` ⚠️ | FE | In A37806 Test Pit MPT for Community Relations Use, what does the document state about the MPT plan and community relations approach? | A37806 Test Pit MPT for Community Relations Use, A37806 | *(binary — JSON must-contain phrases need replacement)* | A37806 Test Pit MPT for Community Relations Use.msg |

---

## drawing

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-e19299ea-c6` | FE | In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what rebar sizes and reinforcement details are shown for the elevator pit foundation mat? | A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundati, A37806, 002R01 | 8u1106, elevator, formsaver, type1 | A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf (page 4) |
| `chunk-e19299ea-c3` | PE | In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what is the submittal number, NYCT/MTA review status, and which spec section 03 20 00 does it reference? | A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundati, A37806, 002R01 | 03 20 00, contract, manager, nyct | A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf (page 2) |
| `chunk-b2f715c4-c4` | PE | In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what glazing spec section 08 80 00 items are referenced in the submittal? | A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entran, A37806, 009R00 | 08 80 00, information, submittal, contract | A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entrance Drawings-MTA.pdf (page 3) |
| `chunk-b2f715c4-c2` | PE | In BUR-009R00 for the EL539 Cab and Entrance Drawings, what is the NYCT/MTA review status and which elevator spec section 14 24 00 does this submittal cover? | A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entran, A37806, 009R00 | 14 24 00, contract, manager, nyct | A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entrance Drawings-MTA.pdf (page 1) |
| `chunk-8a793d89-c4` | FE | In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, who prepared the drawings and what professional license restrictions apply to alterations? | A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Stai, A37806, 001R00 | drawing, professional, description, prepared | A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Staircase Enclosure Shop Drawings.pdf (page 3) |
| `chunk-8a793d89-c3` | PE | In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, was the submittal approved with no exceptions taken, rejected, or returned with remarks? | A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Stai, A37806, 001R00 | information, exceptions, reviewed, rejected | A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Staircase Enclosure Shop Drawings.pdf (page 2) |
| `chunk-7ffe0fdb-c5` | FE | In GEN-001R02 Elevator Walls Formwork Drawing, what NYC Building Code and MTA specification requirements govern controlled fills and excavation near the elevator? | A37806_03 10 00_GEN-001R02 - ORIG - Elevator Walls Form, A37806, 001R02 | pilot, excavate, elevator, requirements | A37806_03 10 00_GEN-001R02 - ORIG - Elevator Walls Formwork Drawing.pdf (page 2) |
| `chunk-7ffe0fdb-c2` | PE | In GEN-001R02 Elevator Walls Formwork Drawing, what is the NYCT/MTA submittal designation — is it for approval, information only, or designer review? | A37806_03 10 00_GEN-001R02 - ORIG - Elevator Walls Form, A37806, 001R02 | nyct, information, approval, designer | A37806_03 10 00_GEN-001R02 - ORIG - Elevator Walls Formwork Drawing.pdf (page 1) |

---

## invoice

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-afe123c6-c2` | CE | What pest control services are billed in Invoice 11707, which Middletown station locations were serviced, and what are the February 2026 service order numbers? | Invoice 11707 | service, order, mljcontracting.com, business | Invoice 11707.pdf (page 1) |
| `chunk-6a8f8474-c2` | CE | What services are billed in Invoice 11830 for the Middletown station locations, and what are the April 2026 service order numbers? | Invoice 11830 | service, order, mljcontracting.com, business | Invoice 11830.pdf (page 1) |
| `chunk-ce208562-c3` | CE | In Lockton Invoice 0849812, what are the remittance instructions and how should payment be submitted? | 2025 Lockton Invoice 0849812, 0849812 | lockton, email, clientpayments, lockton.com | 2025 Lockton Invoice 0849812.pdf (page 1) |
| `chunk-ce208562-c2` | CE | In Lockton Invoice 0849812, what is the total invoiced amount, which insurance carrier is billing, and which company is being charged? | 2025 Lockton Invoice 0849812, 0849812 | invoice, remittance, upgrades, number | 2025 Lockton Invoice 0849812.pdf (page 1) |
| `chunk-5d538cd7-c3` | CE | In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 6, 2025 — what were the ticket number, labor hours, and rates? | Backup for Invoice#01 | hrs., rate, overtime, abatement | Backup for Invoice#01.pdf (page 2) |
| `chunk-5d538cd7-c5` | CE | In the Backup for Invoice#01, what lead abatement T&M work did Crossroads JV perform at Burnside Station on December 7, 2025 — what were the ticket number, labor hours, and rates? | Backup for Invoice#01 | hrs., rate, overtime, abatement | Backup for Invoice#01.pdf (page 4) |
| `chunk-ebd3b55a-c4` | CE | In Invoice#01 dated December 31, 2025, what is the architect-certified payment amount and what changes are approved on the application and continuation sheet? | Invoice#01_12-31-2025 | payment, certification, application, approved | Invoice#01_12-31-2025.pdf (page 1) |
| `chunk-ebd3b55a-c3` | CE | In Invoice#01 dated December 31, 2025, what retainage amounts and net payment due are shown on the G703 continuation sheet? | Invoice#01_12-31-2025 | line, retainage, architect, payment | Invoice#01_12-31-2025.pdf (page 1) |

---

## meeting_minutes

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-8683adfa-c2` | PE | In GEN-042R00, the A37806 & C49321R Coordination Meeting submittal cover sheet, what contract number and spec section 01 30 information is shown? | A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Co, A37806, 042R00 | 00 01 30, contract, manager, a37806 | A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf (page 1) |
| `chunk-8683adfa-c3` | PM | What was discussed in the September 3, 2025 coordination meeting? | A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Co, A37806, 042R00 | station, ahern, meeting, a37806 | A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf (page 2) |
| `chunk-83c4d024-c3646` ⚠️ | PM | In A37806 Kick Off Pre-Work Conference MASTER FILE, what does the document state? | A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10., A37806, Conference | *(binary — JSON must-contain phrases need replacement)* | A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10.25 - Rev. 3.pptx |
| `chunk-83c4d024-c3829` ⚠️ | PM | In A37806 Kick Off Pre-Work Conference MASTER FILE, what does the document state about project milestones and work sequencing? | A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10., A37806, Conference | *(binary — JSON must-contain phrases need replacement)* | A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10.25 - Rev. 3.pptx |
| `chunk-d270696a-c23` | PM | In the July 24, 2025 Monthly Job Progress Meeting, which MLJ Contracting and TC Electric staff attended and presented? | A37806 Monthly Job Progress Meeting Minutes 2025-07-24, A37806 | mljcontracting.com, presenter, tcelect.net, fkastrati | A37806 Monthly Job Progress Meeting Minutes 2025-07-24.pdf (page 9) |
| `chunk-d270696a-c28` | PM | In the July 24, 2025 Monthly Job Progress Meeting, which external consultants from firms such as T.Y. Lin attended? | A37806 Monthly Job Progress Meeting Minutes 2025-07-24, A37806 | presenter, mljcontracting.com, external, tylin.com | A37806 Monthly Job Progress Meeting Minutes 2025-07-24.pdf (page 10) |
| `chunk-46885e53-c8` | PM | In the May 28, 2026 Monthly Job Progress Meeting Minutes, what is the current status of CPR-003 Revision 2 and the open Burnside Avenue DOT Option Work item? | A37806 Monthly Job Progress Meeting Minutes 2026-05-28, A37806 | mljtc2, open, provided, ongoing | A37806 Monthly Job Progress Meeting Minutes 2026-05-28.docx |
| `chunk-46885e53-c4` | Scheduler | In the May 28, 2026 Monthly Job Progress Meeting, how many Grade Operations have been completed across the project stations, and how are they distributed across Myrtle, Burnside, and Avenue I? | A37806 Monthly Job Progress Meeting Minutes 2026-05-28, A37806 | week, approved, myrtle, middletown | A37806 Monthly Job Progress Meeting Minutes 2026-05-28.docx |
| `chunk-be4768ff-c2` | PM | In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what are the open SDI coordination action items and their target completion dates? | SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025 | package, cor-ordination, co-ordination, contract | SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx |
| `chunk-be4768ff-c5` | PM | In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what is the status of OCIP approval and subcontractor approval for the surveyor? | SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025 | general, middletown, material, roofing | SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx |

---

## permit

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-ae1aafb0-c7` | PE | In the GEN-001R00 Third Party and Agency Coordination and Permitting Implementation Plan, what agencies and topics are listed in the table of contents? | A37806_01 33 10_GEN-001R00 - APP-EAN - Third Party and, A37806, 001R00 | coordination, ................................................................................................................., upgrades, revision | A37806_01 33 10_GEN-001R00 - APP-EAN - Third Party and Agency Coordination and Permitting Implementation Plan.pdf (page 5) |
| `chunk-ae1aafb0-c19` | PE | In the GEN-001R00 Third Party and Agency Coordination and Permitting Plan, what design coordination requirements apply to third-party agencies on A37806? | A37806_01 33 10_GEN-001R00 - APP-EAN - Third Party and, A37806, 001R00 | coordination, design, third-party, agencies | A37806_01 33 10_GEN-001R00 - APP-EAN - Third Party and Agency Coordination and Permitting Implementation Plan.pdf (page 13) |
| `chunk-6235c6e0-c33` | PE | In BUR-003R00 Burnside Avenue DOT Permits, what are the issued date, validity period, permit type, and fee for the sidewalk occupancy permit? | A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10., A37806, 003R00 | permit, street, sidewalk, location | A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10.21.25-MJ-LT-x6702.pdf (page 16) |
| `chunk-6235c6e0-c71` | Super | In BUR-003R00 DOT Permits for Burnside Avenue, what noise mitigation measures and nighttime work-hour restrictions apply near schools? | A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10., A37806, 003R00 | mitigation, within, school, noise | A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10.21.25-MJ-LT-x6702.pdf (page 32) |
| `chunk-8bf2aca9-c9` | FE | In MDT-005R00 Middletown Tree Work Permit, what pruning methods are directed by the Borough Forestry Manager and what types of branches must be removed? | A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work, A37806, 005R00 | branch, branches, pruning, directed | A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf (page 4) |
| `chunk-8bf2aca9-c16` | FE | In MDT-005R00 Middletown Tree Work Permit, what nursery standards must replacement tree materials meet, and what happens to rejected material on site? | A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work, A37806, 005R00 | tree, standards, material, applying | A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf (page 4) |
| `chunk-aa934827-c2` | PM | In the FATMIR KASTRATI access pass application, what is the NYC Transit Department of Security process for applying for a non-employee access pass? | FATMIR KASTRATI | access, department, security, contract | FATMIR KASTRATI.pdf (page 1) |
| `chunk-aa934827-c3` | PM | In the FATMIR KASTRATI permit document, what procedures apply if an NYC Transit temporary transportation pass is lost or stolen? | FATMIR KASTRATI | pass, stolen, lost, administrative | FATMIR KASTRATI.pdf (page 1) |
| `chunk-29df6b3d-c2` | PM | In the WINDY KEANE access pass application, what is the NYC Transit Department of Security process for obtaining a non-employee access pass? | WINDY KEANE | access, department, security, contract | WINDY KEANE.pdf (page 1) |
| `chunk-29df6b3d-c3` | PM | In the WINDY KEANE permit document, what procedures apply if an NYC Transit temporary transportation pass is lost or stolen? | WINDY KEANE | pass, stolen, lost, administrative | WINDY KEANE.pdf (page 1) |

---

## photo

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-92056c6f-c4` | FE | In BUR-081R00 January 2026 Construction Photos, what demolition shielding work is shown in progress on the Burnside Avenue northbound side on January 20, 2026? | A37806_01 32 10_BUR-081R00 - FIO - January 2026 Constr, A37806, 081R00 | burnside, side, shielding, relocation | A37806_01 32 10_BUR-081R00 - FIO - January 2026 Construction Photos.pdf (page 2) |
| `chunk-92056c6f-c3` | FE | In BUR-081R00 January 2026 Construction Photos, what MPT setup and ConEd utility relocation work is documented at the Burnside Avenue northbound side? | A37806_01 32 10_BUR-081R00 - FIO - January 2026 Constr, A37806, 081R00 | burnside, side, relocation, protection | A37806_01 32 10_BUR-081R00 - FIO - January 2026 Construction Photos.pdf (page 2) |
| `chunk-be82ab58-c5` | Super | In BUR-080R00 Burnside December 2025 Construction Photos, what J4 track shielding preparation work was photographed on December 22, 2025? | A37806_01 32 10_BUR-080R00 - FIO - Burnside December 20, A37806, 080R00 | side, installation, preperation, shielding | A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025 Construction Photos.pdf (page 2) |
| `chunk-be82ab58-c4` | Super | In BUR-080R00 Burnside December 2025 Construction Photos, what MPT setup and shielding installation preparation is documented on the northbound side? | A37806_01 32 10_BUR-080R00 - FIO - Burnside December 20, A37806, 080R00 | area, installation, preperation, shielding | A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025 Construction Photos.pdf (page 2) |
| `chunk-3422bcbf-c3` | FE | In MYR-076R00 Myrtle December 2025 Construction Photos, what ADA accessibility upgrade work is shown in the December 19, 2025 photos at Myrtle Avenue station? | A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025, A37806, 076R00 | upgrades, accessibility, myrtle, design-build | A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf (page 3) |
| `chunk-3422bcbf-c2` | PE | In MYR-076R00 Myrtle December 2025 Construction Photos, what is the submittal designation — NYCT/MTA information only, approval, or designer review? | A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025, A37806, 076R00 | nyct, information, approval, designer | A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf (page 1) |

---

## report

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-f1878087-c4` | PM | In the May 13, 2025 Burnside Avenue VECP Presentation, what is the value engineering background — what submissions were made to MTA and what verbal approval was received from NYC DOT? | 2025-05-13 A37806 Burnside Ave VECP Presentation, A37806, Presentation | engineering, received, concept, value | 2025-05-13 A37806 Burnside Ave VECP Presentation.pdf (page 3) |
| `chunk-f1878087-c2` | PM | In the Burnside Avenue VECP Presentation, what ADA accessibility upgrade scope is being value-engineered and when was the final presentation delivered? | 2025-05-13 A37806 Burnside Ave VECP Presentation, A37806, Presentation | upgrades, accessibility, design-build, presentation | 2025-05-13 A37806 Burnside Ave VECP Presentation.pdf (page 1) |
| `chunk-f1dd6e34-c25` | PE | In PRO 26-01 Control of Project Nonconforming Items, what does the NCR process flowchart show — who are the originator, Contractor QM, PMT QM, and DOR roles? | PRO 26-01 Control of Project Nonconforming Items-JS.202, Nonconforming, 20260109 | disposition, acceptable, reviews, comments | PRO 26-01 Control of Project Nonconforming Items-JS.20260109.pdf (page 11) |
| `chunk-f1dd6e34-c23` | PE | Under spec section 01 40 10, what data does PRO 26-01 require in the NCR Log for tracking nonconforming items? | PRO 26-01 Control of Project Nonconforming Items-JS.202, Nonconforming, 20260109 | 01 40 10, quality, ncrs, inspection | PRO 26-01 Control of Project Nonconforming Items-JS.20260109.pdf (page 9) |
| `chunk-f19a9963-c2` | PM | In the A37806 MOWE Joint Survey from April 8–9, 2025, what infrastructure inspection items were identified and what lead time does MOWE require to process requests? | A37806 MOWE Joint Survey 04.08.25 04.09.25, A37806 | items, infrastructure, inspection, indicated | A37806 MOWE Joint Survey 04.08.25 04.09.25.pdf (page 1) |
| `chunk-f19a9963-c3` | PM | In the A37806 MOWE Joint Survey, what were the Burnside Station inspection findings and within how many days must results be forwarded to the MOWE Capital Contracts Office? | A37806 MOWE Joint Survey 04.08.25 04.09.25, A37806 | approved, burnside, station, gurung | A37806 MOWE Joint Survey 04.08.25 04.09.25.pdf (page 1) |

---

## rfi

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-22a58e99-c2` | FE | In DRFI-0079 for the Middletown NB Stair Foundation Rebar Interference, what is the rebar and anchor bolt conflict under spec section 05 12 00? | A37806_DRFI-0079 - MDT NB Stair Foundation Rebar Interf, A37806, Foundation | 05 12 00, anchor, rebar, bolts | A37806_DRFI-0079 - MDT NB Stair Foundation Rebar Interference.pdf (page 1) |
| `chunk-7f545dae-c2` | FE | In RFI098 for the Ave I Conductor Board at Station 489+00, what is the issue with the conductor board on the northbound platform at Track B2 and what drawing is referenced? | A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+0, A37806, RFI098 | conductor, platform, boarding, drawing | A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf (page 1) |
| `chunk-7f545dae-c4` | FE | In RFI098 for the Ave I Conductor Board, what figures are provided showing the conductor board conditions at Station 489+00 and approximately Station 490+00? | A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+0, A37806, RFI098 | conductor, figure, board, approximately | A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf (page 2) |
| `chunk-2e21cbdc-c17` | FE | In A37806 RFI096, what are the northbound and southbound platform stair and exit configurations shown on the referenced drawings? | A37806_ADA P6_RFI096, A37806, RFI096 | platform, exit, southbound, northbound | A37806_ADA P6_RFI096.pdf (page 8) |
| `chunk-2e21cbdc-c18` | FE | In A37806 RFI096, what ADA upgrade drawing and platform detail is referenced for the McDonald Avenue station? | A37806_ADA P6_RFI096, A37806, RFI096 | upgrades, mcdonald, avenue, drawing | A37806_ADA P6_RFI096.pdf (page 9) |
| `chunk-f5c380d3-c2` | FE | In drawing MYR-A-444A, what platform level construction details and accessibility upgrade information are shown in the enlarged section views? | MYR-A-444A | level, construction, upgrades, enlarged | MYR-A-444A.pdf (page 1) |
| `chunk-f5c380d3-c3` | FE | In drawing MYR-A-444A, what stainless steel panel and signage details are shown for the EL1121/EL1122 elevator enclosures at Myrtle Avenue station? | MYR-A-444A | lcd-a-525, panel, honeycomb, stainless | MYR-A-444A.pdf (page 1) |
| `chunk-21a5c069-c2` | PE | In RFI-009 for Myrtle Avenue UPS Backup Requirements, what spec section 27 33 01 requirements apply and who submitted this RFI? | 806-RFI-009 - Myrtle Avenue UPS Backup Requirements, Requirements | 27 33 01, nicholas, york, zito | 806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf (page 1) |
| `chunk-21a5c069-c3` | PE | In RFI-009 for Myrtle Avenue UPS Backup Requirements, what UPS capacity is required to support existing and new communications systems, including the future use reserve? | 806-RFI-009 - Myrtle Avenue UPS Backup Requirements, Requirements | systems, communications, existing, backup | 806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf (page 1) |

---

## safety

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-a7e7e464-c3` | PE | In GEN-096R04 SWP-016 for Elevator Steel and Enclosure, what is the submittal package response due date and what spec section 01 35 10 information is on the cover sheet? | A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator S, A37806, 096R04 | 01 35 10, submittal, associated, package | A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf (page 2) |
| `chunk-a7e7e464-c52` | Super | In GEN-096R04 SWP-016 for Elevator Steel and Enclosure, what NYC Building Code Chapter 33 and RCNY sections govern crane operations and outrigger dunnage requirements? | A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator S, A37806, 096R04 | rcny, outrigger, dunnage, option | A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf (page 28) |
| `chunk-b6b3128f-c17` | Super | In GEN-041R01 SWP-011 for Platform Concrete Demo, what dust control and silica exposure prevention measures apply to saw cutting and demolition operations? | A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform C, A37806, 041R01 | dust, control, ensure, blade | A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf (page 9) |
| `chunk-b6b3128f-c31` | Super | In GEN-041R01 SWP-011 for Platform Concrete Demo, what equipment specification and warranty requirements apply to the demolition machinery? | A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform C, A37806, 041R01 | machine, specification, notification., configuration | A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf (page 15) |
| `chunk-3157502c-c15` | Super | In GEN-055R01 SWP-032 for General Formwork, Rebar and Concrete, what electrical safety requirements apply to tools and equipment near the third rail? | A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General fo, A37806, 055R01 | tools, electrical, damage, extension | A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf (page 9) |
| `chunk-3157502c-c2` | PE | What does the August 20, 2025 transmittal letter from Michael Wilson say about the approval status of the SWP-032 safe work plan under spec 01 35 10? | A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General fo, A37806, 055R01 | 01 35 10, transmittal, approved, letter | A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf (page 1) |
| `chunk-1f653e39-c16` | Super | In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what restricted work hours apply, what combustible materials storage rules are in effect, and how much advance notice is required before closing a staircase? | A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine St, A37806, 116R00 | lifting, hearing, stored, panels | A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf (page 7) |
| `chunk-1f653e39-c5` | Super | In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what worksite entry and personnel safety requirements apply, including PPE and evacuation procedures? | A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine St, A37806, 116R00 | available, safety, evacuation, personnel | A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf (page 4) |
| `chunk-92a1d852-c11` | Super | In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what are the safety coordinator's responsibilities for PPE enforcement, SDS management, and safe work plan development? | A37806_01 35 10_GEN-021R00 - ORIG - Safety Coordinator, A37806, 021R00 | safety, hazards, ensure, employees | A37806_01 35 10_GEN-021R00 - ORIG - Safety Coordinator - Diego Gonzalez.pdf (page 5) |
| `chunk-92a1d852-c6` | Super | In GEN-021R00 Safety Coordinator submittal, what track safety and MTA flagging coordination requirements must be in place before granting track access on A37806? | A37806_01 35 10_GEN-021R00 - ORIG - Safety Coordinator, A37806, 021R00 | contract, east, manhattan, access | A37806_01 35 10_GEN-021R00 - ORIG - Safety Coordinator - Diego Gonzalez.pdf (page 3) |

---

## schedule

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-b05eba48-c8` | Scheduler | In the All Stations schedule update from April 6, 2026, what are the scheduled start and finish dates for the Elevator 541 Enclosure activities, and what activities involve rated glass installation? | Actual - ALl Station 4.6.26 - N | 11-sep-26, enclosure, rated, glass | Actual - ALl Station 4.6.26 - N.pdf (page 2) |
| `chunk-b05eba48-c7` | Scheduler | In the All Stations schedule update from April 6, 2026, what is the planned outage for EL1121 Elevator Enclosure Framing installation and what are the upcoming enclosure activities at Myrtle Avenue? | Actual - ALl Station 4.6.26 - N | enclosure, elevator, avenue, glass | Actual - ALl Station 4.6.26 - N.pdf (page 1) |

---

## spec

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-eb10b48b-c12` | PE | In spec section 21 12 00 for Fire-Suppression Standpipes, what are the pipe hanger and support design requirements, including how they must handle expansion joint forces? | 21 12 00 - Fire-Suppression Standpipes, Suppression, Standpipes | supports, hangers, provide, piping | 21 12 00 - Fire-Suppression Standpipes.pdf (page 5) |
| `chunk-eb10b48b-c19` | PE | In spec section 21 12 00 for Fire-Suppression Standpipes, what pitch requirements apply to piping and how must pipes and hose connections be installed where they cross tracks? | 21 12 00 - Fire-Suppression Standpipes, Suppression, Standpipes | 21 12 00, hose, fittings, install | 21 12 00 - Fire-Suppression Standpipes.pdf (page 9) |
| `chunk-fe353658-c275` | Super | In BUR-042R01 EDU07 SOGR at Burnside Avenue, what requirements apply to water leaks observed during painting and scraping, and where is lead abatement required? | A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100), A37806, 042R01 | water, leaks, structural, repaired | A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf (page 57) |
| `chunk-fe353658-c395` | FE | In BUR-042R01 EDU07 SOGR at Burnside Avenue, what are the general structural notes and repair standards for structural steel and reinforced concrete? | A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100), A37806, 042R01 | repair, steel, concrete, reinforcement | A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue.pdf (page 79) |
| `chunk-bca6afd2-c2` | PM | In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what did AECOM transmit to MLJTC2 Project Manager Ravi Jain on April 17, 2026? | Transmittal 212-NOR Xfer Girder inspection, Transmittal, inspection | aecom, mljtc, number, a37806 | Transmittal 212-NOR Xfer Girder inspection.pdf (page 1) |
| `chunk-c60c1183-c4` | PE | In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what NYCT review designation is shown on the cover sheet — approval, information only, or designer review? | A37806_33 14 15_NOR-010R00 - FIO - Norwood Ave CCTV Ins, A37806, 010R00 | contract, manager, nyct, information | A37806_33 14 15_NOR-010R00 - FIO - Norwood Ave CCTV Inspection Findings 11-20-2025.pdf (page 3) |
| `chunk-c60c1183-c7` | FE | In NOR-010R00 Norwood Avenue CCTV Inspection Findings, which sewer sections were inspected and what are the NYCDEP pipe inspection IDs for those segments? | A37806_33 14 15_NOR-010R00 - FIO - Norwood Ave CCTV Ins, A37806, 010R00 | m3071513, m3083356, sewer, inspected | A37806_33 14 15_NOR-010R00 - FIO - Norwood Ave CCTV Inspection Findings 11-20-2025.pdf (page 6) |
| `chunk-bf3c1064-c92` | CE | In the EDU05B Electrical Long Lead submittal for Norwood Avenue Station, what does the AECOM calculation cover page show about the project job number, client, and coordination requirements? | EDU05B-BB 100% Rev 1 - APP - Electrical Long Lead, EDU05B, Electrical | calculation, name, signature, coordination | EDU05B-BB 100% Rev 1 - APP - Electrical Long Lead.pdf (page 39) |
| `chunk-bf3c1064-c62` | PE | In the EDU05B Electrical Long Lead submittal, what panel and circuit data is shown for spec sections 12 14 10, 25 43 18, and 25 41 18 in the load schedule? | EDU05B-BB 100% Rev 1 - APP - Electrical Long Lead, EDU05B, Electrical | 12 14 10, 25 43 18, 25 41 18, used | EDU05B-BB 100% Rev 1 - APP - Electrical Long Lead.pdf (page 23) |

---

## submittal

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-639c329f-c6` | PE | In GEN-014R00 Monthly Quality and Certification Report for May 2025, what construction activities and quality survey items are documented for the Ave I station platform under spec section 01 40 10? | A37806_01 40 10_GEN-014R00 - ORIG - Monthly Quality and, A37806, 014R00 | 01 40 10, survey, platform, station | A37806_01 40 10_GEN-014R00 - ORIG - Monthly Quality and Certification Report- May 2025.pdf (page 5) |
| `chunk-639c329f-c2` | PE | In GEN-014R00 Monthly Quality and Certification Report for May 2025, what is the NYCT/MTA submittal designation — information only, approval, or designer review? | A37806_01 40 10_GEN-014R00 - ORIG - Monthly Quality and, A37806, 014R00 | nyct, information, approval, designer | A37806_01 40 10_GEN-014R00 - ORIG - Monthly Quality and Certification Report- May 2025.pdf (page 1) |
| `chunk-39a5d5d5-c10` | FE | In GEN-001R00 SikaGrout-212 product submittal, what application restrictions and surface preparation requirements apply — specifically regarding sun, wind, and substrate conditions? | A37806_03 61 00_GEN-001R00 - FIO - SikaGrout-212 - PMC, A37806, 001R00 | safety, application, methods, actual | A37806_03 61 00_GEN-001R00 - FIO - SikaGrout-212 - PMC comments.pdf (page 5) |
| `chunk-39a5d5d5-c5` | PE | In GEN-001R00 SikaGrout-212 product submittal, is SikaGrout-212 USDA certifiable and what does the product data say about packaging size and ASTM C-827 compliance? | A37806_03 61 00_GEN-001R00 - FIO - SikaGrout-212 - PMC, A37806, 001R00 | packaging, certifiable, information, accordance | A37806_03 61 00_GEN-001R00 - FIO - SikaGrout-212 - PMC comments.pdf (page 3) |
| `chunk-f50ff9f5-c100` | Super | In the PRDC12-012R02 Lead Placard Package for Burnside, what containment class and cut-line preparation requirements apply to the lead paint abatement work? | A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burns, A37806, PRDC12 | area, cutting, paint, containment | A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf (page 60) |
| `chunk-997cb89d-c4` | Super | In GEN-044R00 List of Competent Persons, which electrical and communications staff from TC Electric are listed with their roles and contact information under spec 01 35 10? | A37806_01 35 10_GEN-044R00 - ORIG - List of Competent P, A37806, 044R00 | 01 35 10, station, tcelect.net, general | A37806_01 35 10_GEN-044R00 - ORIG - List of Competent Persons.pdf (page 2) |
| `chunk-997cb89d-c3` | Super | In GEN-044R00 List of Competent Persons under spec 01 35 10, who are the listed heavy civil superintendents and project engineers from MLJ Contracting, with their roles and phone numbers? | A37806_01 35 10_GEN-044R00 - ORIG - List of Competent P, A37806, 044R00 | 01 35 10, civil, mljcontracting.com, station | A37806_01 35 10_GEN-044R00 - ORIG - List of Competent Persons.pdf (page 2) |

---

## unknown

| ID | Role | Query | Expected File Pattern(s) | Must-contain phrases | Grounding |
|----|------|-------|--------------------------|----------------------|-----------|
| `chunk-4b8950a6-c3` | PE | In the 37135_02FF_181ST_001R00 Monitoring Plan submittal, what is the date received, project code, and who reviewed it? | 37135_02FF_181ST_001R00 - (NET) - Monitoring Plan, 001R00, Monitoring | reviewed, submittal, received, york | 37135_02FF_181ST_001R00 - (NET) - Monitoring Plan.pdf (page 1) |
| `chunk-4b8950a6-c2` | PE | In the 37135_02FF_181ST_001R00 Monitoring Plan, what NYCT/MTA review designation applies to this submittal? | 37135_02FF_181ST_001R00 - (NET) - Monitoring Plan, 001R00, Monitoring | review, information, submittal, only | 37135_02FF_181ST_001R00 - (NET) - Monitoring Plan.pdf (page 1) |
| `chunk-4b1f7d74-c5` ⚠️ | PM | In MLJTC2-MTACD-XXXX MTA System Access Passes, what does the document state? | MLJTC2-MTACD-XXXX - MTA System Access Passes, MLJTC2 | *(binary — JSON must-contain phrases need replacement)* | MLJTC2-MTACD-XXXX - MTA System Access Passes.docx |
| `chunk-4b1f7d74-c21` ⚠️ | PM | In MLJTC2-MTACD-XXXX MTA System Access Passes, what does the document state about access pass procedures? | MLJTC2-MTACD-XXXX - MTA System Access Passes, MLJTC2 | *(binary — JSON must-contain phrases need replacement)* | MLJTC2-MTACD-XXXX - MTA System Access Passes.docx |
| `chunk-dd522ca1-c42` ⚠️ | PM | In the A37806 Org Chart from January 2, 2025, what does the document state? | A37806 Org Chart r1 2025-01-02, A37806 | *(binary — JSON must-contain phrases need replacement)* | A37806 Org Chart r1 2025-01-02.pptx |
| `chunk-dd522ca1-c30` ⚠️ | PM | In the A37806 Org Chart from January 2, 2025, what does the document state about the project team structure? | A37806 Org Chart r1 2025-01-02, A37806 | *(binary — JSON must-contain phrases need replacement)* | A37806 Org Chart r1 2025-01-02.pptx |
| `chunk-767ec6c6-c2` | PE | In the September 10, 2025 FedEx shipping label for Package 6 M017, what was shipped, who sent it from Iovino Enterprises, and where was it delivered? | 2025-09-10 - T12_31_26-FedEx-Shipping-Label_Xin | j253025062301uv, enterprises, department, overnight | 2025-09-10 - T12_31_26-FedEx-Shipping-Label_Xin.pdf (page 1) |
| `chunk-14c18906-c2` | PM | In Attachment 4 Blank, what information must contractor companies provide when submitting the NYC Transit Employee Access Pass Request List? | Attachment 4 Blank, Attachment | access, pass, transportation, temporary | Attachment 4 Blank.pdf (page 1) |

---

**Bucket counts:** all `answer` (110 total)

---

## ⚠️ Binary chunk fix needed (8 entries)

These JSON entries have `acceptableAnswerContains` with garbage binary strings. Query rewrites alone won't make them score correctly — the JSON must-contain phrases also need to be replaced with real document text:

| ID | File |
|----|------|
| `chunk-9efaf435-c1709` | A37806 Test Pit MPT for Community Relations Use.msg |
| `chunk-9efaf435-c4249` | A37806 Test Pit MPT for Community Relations Use.msg |
| `chunk-83c4d024-c3646` | A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10.25 - Rev. 3.pptx |
| `chunk-83c4d024-c3829` | A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10.25 - Rev. 3.pptx |
| `chunk-4b1f7d74-c5` | MLJTC2-MTACD-XXXX - MTA System Access Passes.docx |
| `chunk-4b1f7d74-c21` | MLJTC2-MTACD-XXXX - MTA System Access Passes.docx |
| `chunk-dd522ca1-c42` | A37806 Org Chart r1 2025-01-02.pptx |
| `chunk-dd522ca1-c30` | A37806 Org Chart r1 2025-01-02.pptx |
