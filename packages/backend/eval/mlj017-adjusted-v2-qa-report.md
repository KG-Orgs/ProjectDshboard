# MLJ-017 Package 6 — Adjusted 97-Question Q&A Report

**Project:** MLJ-017 Package 6 General · `145b3dcf-272e-4c45-9e19-953f20f25bb9`
**Questions:** 97 (reworded / different-facet variants of the original sq01–sq102 set, excl. sq32/sq50–sq53)
**Input:** `eval/mlj017-adjusted-v2-batch-input.json` · **Raw output:** `eval/mlj017-adjusted-v2-run.txt`
**Pipeline:** intent parse → identifier lookup → hybrid pgvector+GIN retrieval → rerank → `google/gemini-2.5-flash` synthesis

**Summary (heuristic):** 80/97 answered with sources · 17/97 returned "not found"/refusal · 0 timeouts

---

## Index

| ID | Question | Status |
|---|---|---|
| sq01 | In GEN-042R00, what action items were recorded, who are they assigned to, and when is the next coordination meeting scheduled? | ✅ answered |
| sq02 | What insurance, bonding, and payment terms are set out in Island Pavement Cutting Co's subcontract? | ✅ answered |
| sq03 | Which past projects and reference contracts does Island Pavement Cutting Co cite as experience for its saw cutting and joint sealing work? | ✅ answered |
| sq04 | In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, on what date was the approval issued and who signed it? | ✅ answered |
| sq05 | In A37806 Phasing Plan GEN-001R05, which stations are affected in each phase and what is the sequence of work? | ✅ answered |
| sq06 | In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what are the proposal submission requirements and evaluation criteria described? | ✅ answered |
| sq07 | In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what technical resources, licenses, and prior revocations must be disclosed? | ✅ answered |
| sq08 | In GEN-027R00 for Crossroads JV LLC, who are the principal officers of the joint venture and when was the entity formed? | ⚠️ not found |
| sq09 | In the M017_IMP Draft Subcontract, what conditions precedent govern subcontractor payment and change order compensation? | ✅ answered |
| sq10 | In the M017_IMP Draft Subcontract, what does the dispute resolution and governing law clause specify? | ✅ answered |
| sq11 | In Transmittal 0014 for MTA Personnel and PMC Supplies, who is the transmittal from and to, and on what date was it sent? | ✅ answered |
| sq12 | What reserve service load values or electrical capacity are described in the Myrtle Ave Reserve Service Load Letter? | ✅ answered |
| sq13 | In the MTACD-MLJTC2-L-0017 subcontractor approval letter, on what date was MASE FX approved and who authorized it? | ✅ answered |
| sq14 | In the MTACD-MLJTC2-L-0028 subcontractor approval letter, is Titanium Linx Consulting approved for labor only, and what is the effective date of the approval? | ✅ answered |
| sq15 | In the MTACD-MLJTC2-L-0049 subcontractor approval letter, what subsurface utility engineering purpose is McVac's vacuum excavation work supporting? | ✅ answered |
| sq16 | In the MTACD-MLJTC2-L-0083 subcontractor approval letter, is American Geophysics approved for labor only or does it include materials, and on what date was it approved? | ⚠️ not found |
| sq17 | In the MTACD-MLJTC2-L-0093 subcontractor approval letter, what micropile quantity or location scope is Tri-State Civil Construction approved to install, and who signed the letter? | ✅ answered |
| sq18 | In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what concrete cover requirements are specified for surfaces exposed to earth or weather? | ⚠️ not found |
| sq19 | In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what revision history and approval dates are recorded in the title block? | ✅ answered |
| sq20 | In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what cab dimensions and finish materials are specified? | ✅ answered |
| sq21 | In BUR-009R00 for the EL539 Cab and Entrance Drawings, what is the submittal revision number and who is the elevator manufacturer? | ⚠️ not found |
| sq22 | In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, which spec section does this submittal cover? | ⚠️ not found |
| sq23 | In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what structural steel members and connection details are shown for the staircase enclosure? | ✅ answered |
| sq24 | What specification requirements govern compaction testing and backfill material gradation near structures? | ✅ answered |
| sq25 | In GEN-001R02 Elevator Walls Formwork Drawing, what was the AE reviewer's final disposition and were any comments issued? | ✅ answered |
| sq26 | In Invoice 11707, what is the total amount billed, the invoice date, and the payment terms? | ⚠️ not found |
| sq27 | In Invoice 11830, what is the unit price per pest control visit and the total amount due for the Middletown stations? | ✅ answered |
| sq28 | In Lockton Invoice 0849812, what coverage or bond does the invoice cover and what is the policy period? | ⚠️ not found |
| sq29 | In Lockton Invoice 0849812, what is the invoice date and the payment due date? | ✅ answered |
| sq30 | In the Backup for Invoice#01, what materials and equipment were used for the December 6, 2025 lead abatement containment at Burnside Station? | ✅ answered |
| sq31 | In the Backup for Invoice#01, how many square feet of lead abatement were completed on December 7, 2025 and what was the total labor cost claimed? | ⚠️ not found |
| sq33 | In Invoice#01 dated December 31, 2025, what is the total contract sum, total completed to date, and current payment due on the G702 application? | ⚠️ not found |
| sq34 | In GEN-042R00, the A37806 & C49321R Coordination Meeting, what action items were assigned to Ahern regarding shielding removal? | ✅ answered |
| sq35 | Who attended the September 3, 2025 coordination meeting and which contracts were being coordinated? | ✅ answered |
| sq36 | In A37806 Kick Off Pre-Work Conference, what key project contacts and their roles are listed? | ✅ answered |
| sq37 | In A37806 Kick Off Pre-Work Conference, what safety and environmental requirements are emphasized for project start-up? | ⚠️ not found |
| sq38 | In the July 24, 2025 Monthly Job Progress Meeting, what were the main schedule and procurement discussion points recorded in the minutes? | ✅ answered |
| sq39 | In the July 24, 2025 Monthly Job Progress Meeting, what design and engineering coordination items involving the consultant team were discussed? | ✅ answered |
| sq40 | In the May 28, 2026 Monthly Job Progress Meeting Minutes, what new change proposal requests (CPRs) or RFIs were opened or closed during the period? | ✅ answered |
| sq41 | In the May 28, 2026 Monthly Job Progress Meeting, what upcoming Grade Operations (GOs) are forecast for the next reporting period across the stations? | ✅ answered |
| sq42 | In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what survey and layout deliverables are discussed? | ✅ answered |
| sq43 | In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what insurance and subcontractor onboarding items remain open for the surveyor? | ✅ answered |
| sq44 | Which agencies issued the current permits submitted for Burnside Ave, and what is their approval status? | ✅ answered |
| sq45 | Which agencies issued the current permits submitted for Ave I, and what is their approval status? | ✅ answered |
| sq46 | Which agencies issued the current permits submitted for Myrtle Ave, and what is their approval status? | ⚠️ not found |
| sq47 | Which agencies issued the current permits submitted for Middletown, and what is their approval status? | ✅ answered |
| sq48 | Which agencies issued the current permits submitted for Norwood Ave, and what is their approval status? | ✅ answered |
| sq49 | In MDT-005R00 Middletown Tree Work Permit, what tree protection and pruning requirements apply during construction? | ✅ answered |
| sq54 | In BUR-081R00 January 2026 Construction Photos, what safety measures and MPT signage are visible in the January 20, 2026 photos? | ✅ answered |
| sq55 | In BUR-081R00 January 2026 Construction Photos, what excavation or foundation work is documented at the Burnside Avenue northbound side? | ✅ answered |
| sq56 | In BUR-080R00 Burnside December 2025 Construction Photos, on what dates were the photos taken and what site conditions are shown? | ⚠️ not found |
| sq57 | In BUR-080R00 Burnside December 2025 Construction Photos, what staging areas and material deliveries are documented? | ⚠️ not found |
| sq58 | In MYR-076R00 Myrtle December 2025 Construction Photos, what elevator or stair construction progress is shown at Myrtle Avenue station? | ✅ answered |
| sq59 | In MYR-076R00 Myrtle December 2025 Construction Photos, what date range do the photos cover and who prepared the submittal? | ✅ answered |
| sq60 | In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings or schedule benefits are claimed for the value engineering change proposal? | ✅ answered |
| sq61 | In the Burnside Avenue VECP Presentation, which design disciplines are affected by the proposed value engineering changes? | ✅ answered |
| sq62 | In PRO 26-01 Control of Project Nonconforming Items, what are the steps for dispositioning a nonconforming item once an NCR is issued? | ⚠️ not found |
| sq63 | In GEN-006R01 NCR Template & Log, what fields are included on the NCR form itself for documenting a nonconformance? | ✅ answered |
| sq64 | Summarize the track limit revisions and closure disposition in A37806_RFI-0203 Norwood J1 Revised Track Limits R1. | ✅ answered |
| sq65 | In J-TRACK-13A-041R00 Material I&T Request for the 100-8 6-hole joint bar, what is the inspection and test status and who is the material supplier? | ⚠️ not found |
| sq66 | In RFI-0115 for the Myrtle Avenue Louver Exhaust Face Velocity issue, what resolution or design change was proposed to address the velocity problem? | ✅ answered |
| sq67 | In RFI098 for the Ave I Conductor Board at Station 489+00, what resolution or field direction was provided and who responded to the RFI? | ✅ answered |
| sq68 | In RFI098 for the Ave I Conductor Board, what track and platform dimensions are noted around Station 489+00 to 490+00? | ✅ answered |
| sq69 | In A37806 RFI096, what question is being asked of the design team and what is the RFI status? | ✅ answered |
| sq70 | In A37806 RFI096, what dimensional discrepancy or field condition prompted the RFI at the McDonald Avenue station? | ✅ answered |
| sq71 | In MYR-002R00 Myrtle Avenue Demo Shield Drawings, what loading criteria and design standards apply to the demolition shielding? | ✅ answered |
| sq72 | In drawing MYR-A-444A, what dimensions and mounting details are shown for the EL1121/EL1122 elevator enclosure panels at Myrtle Avenue station? | ✅ answered |
| sq73 | In RFI-0116 for the Myrtle Avenue PS LAN followup, who attended the September 9, 2025 coordination meeting recorded in the attendance report? | ✅ answered |
| sq74 | In RFI-009 for Myrtle Avenue UPS Backup Requirements, what battery runtime or backup duration is required and what spec section governs it? | ✅ answered |
| sq75 | In GEN-096R04 SWP-016 for Elevator Steel and Enclosure, what safe work procedures apply to steel erection and what fall protection is required? | ✅ answered |
| sq76 | What are the main hazards and controls covered in SWP-016? | ✅ answered |
| sq77 | In GEN-041R01 SWP-011 for Platform Concrete Demo, what PPE and respiratory protection is required for the demolition crew? | ✅ answered |
| sq78 | What work activity does SWP-011 cover and what are its primary safety controls? | ✅ answered |
| sq79 | What work activity does SWP-032 cover and which spec section governs it? | ✅ answered |
| sq80 | In the GEN-055R01 SWP-032 submittal, what review comments or conditions of approval were noted for the general formwork, rebar, and concrete safe work plan? | ✅ answered |
| sq81 | In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what barricade construction and signage requirements apply to the closed staircase? | ✅ answered |
| sq82 | In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what fire watch and hot work precautions are specified? | ✅ answered |
| sq83 | In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what qualifications, certifications, and experience are listed for the safety coordinator? | ✅ answered |
| sq84 | What role and reporting relationship does the GEN-021R00 Safety Coordinator submittal establish? | ✅ answered |
| sq85 | In the Schedule Update 5 June 2025, what is the critical path and which activities have the least float? | ⚠️ not found |
| sq86 | In the Schedule Update 5 June 2025, what are the planned start and finish dates for the Myrtle Avenue elevator enclosure activities? | ✅ answered |
| sq87 | In spec section 21 12 00 for Fire-Suppression Standpipes, what materials and pressure ratings are required for standpipe piping and fittings? | ✅ answered |
| sq88 | In spec section 21 12 00 for Fire-Suppression Standpipes, what testing and flushing requirements apply before the system is placed in service? | ✅ answered |
| sq89 | In BUR-042R01 EDU07 SOGR at Burnside Avenue, what surface preparation and painting system is specified for structural steel? | ✅ answered |
| sq90 | In BUR-042R01 EDU07 SOGR at Burnside Avenue, what concrete repair materials and crack repair methods are specified? | ✅ answered |
| sq91 | In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what documents or reports were enclosed and what response is requested? | ✅ answered |
| sq92 | In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what defects or structural conditions were observed during the sewer inspection? | ✅ answered |
| sq93 | In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what remediation or repair recommendations are made for the inspected sewer segments? | ✅ answered |
| sq94 | In the EDU05B Electrical Long Lead submittal for Norwood Avenue Station, which long-lead electrical equipment items are identified and what are their procurement lead times? | ⚠️ not found |
| sq95 | In the EDU05B Electrical Long Lead submittal, what voltage and phase ratings are specified for the panels in the load schedule? | ✅ answered |
| sq96 | In GEN-014R00 Monthly Quality and Certification Report for May 2025, what nonconformances or corrective actions are recorded for the reporting period? | ✅ answered |
| sq97 | In GEN-014R00 Monthly Quality and Certification Report for May 2025, who prepared and certified the report and what period does it cover? | ✅ answered |
| sq98 | In the PRDC12-019R00 SikaGrout 212 product submittal, what mixing ratios and cure times are specified for the grout? | ✅ answered |
| sq99 | In the PRDC12-019R00 SikaGrout 212 product submittal, what shelf life and storage conditions are required for the product? | ✅ answered |
| sq100 | In the PRDC12-012R02 Lead Placard Package for Burnside, what air monitoring and worker protection requirements apply to the lead abatement work? | ✅ answered |
| sq101 | In PRDC12-012R02 Lead Placard Package for Burnside, what regulatory notifications and posting requirements apply before lead abatement begins? | ✅ answered |
| sq102 | In PRDC12-019R00 SikaGrout 212 product submittal, what yield per unit and application thickness range are listed in the product data? | ✅ answered |

---

## Questions & Answers

### [sq01] ✅ answered

**Q:** In GEN-042R00, what action items were recorded, who are they assigned to, and when is the next coordination meeting scheduled?

**Sources:**
- `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf`

**A:**

## Action Items and Meeting Schedule

- **Action Items:**
    - Ahern to send MLJTC2 draft agreement for MLJTC2 access to their shielding. (p. 4)
    - Naik/TYLin to send MLJTC2 the GO forecast for Contract C34921R. (p. 4)
- **Assigned To:** Ahern, Naik/TYLin (p. 4)
- **Next Coordination Meeting:** Not specified in the provided document.

_domains: contracts · elapsed: 1.6s · cacheHit: false_

---

### [sq02] ✅ answered

**Q:** What insurance, bonding, and payment terms are set out in Island Pavement Cutting Co's subcontract?

**Sources:**
- `M017_MLJ_INDUSTRY SAFETY_SUBCONTRACT_DRAFT R4 20250714.docx`
- `M017_MLJ_Halcyon_Agreement_Draft_06162025.pdf`
- `M017_MLJ_INDUSTRY SAFETY_SUBCONTRACT_DRAFT SD 5.19.25.docx`
- `M017_MLJ_Halcyon_Agreement_Draft_06162025 - Review 1.docx`
- `M017_MLJ_INDUSTRY SAFETY_SUBCONTRACT_DRAFT R3 20250528.docx`
- `50 States - Subcontract - NOT EXECUTED (DRAFT).docx`
- `2025.05.29 Atlantic Signed Contract.pdf`
- `Subcontract Template - Safe Spect Corp Rev 1 SD.docx`

**A:**

## Subcontractor Insurance Requirements
- Subcontractor must obtain and maintain insurance at its own expense, satisfactory to Contractor (p. 12).
- Insurance must be from companies authorized in the project jurisdiction (p. 12).
- Coverage must be maintained for the duration of the Project and as required after (p. 12).
- Excess liability limits of $25,000,000 are required via umbrella or excess liability policy (p. 12).
- This excess policy must follow form to Employer's Liability, Commercial General Liability, and Automobile Liability (p. 12).
- It must "drop down" for defense and indemnity if underlying insurance is exhausted (p. 12).
- Subcontractor is strictly liable for claims if entering the site before OCIP enrollment approval (NODE 4).

## Bonding and Payment Terms
- Context is insufficient to determine bonding and payment terms.
- Next step: Provide the full subcontract document for Island Pavement Cutting Co.

_domains: contracts · elapsed: 4.0s · cacheHit: false_

---

### [sq03] ✅ answered

**Q:** Which past projects and reference contracts does Island Pavement Cutting Co cite as experience for its saw cutting and joint sealing work?

**Sources:**
- `A37806_GEN-051R00 - ORIG - Subcontractor Approval Forms - Island Pavement Cutting Co Inc..pdf`
- `Request_for_Qualifications_Package_6_A37806.pdf`
- `A37806_Request for Qualifications_Package 6_Rev 1.pdf`
- `DG102_Preparing Contract Specifications Documents (2009-12-10, A.Saha).pdf`
- `M017_MLJ_Island Pavement and Cutting Co_Subcontract_For Signature_20250922.pdf`
- `Attachment 3_Island Pavement Cutting Co. Resume.pdf`
- `A37806_Addendum No 1_Letter.pdf`
- `A37806_01 35 10_GEN-127R01 - ORIG - Safety Engineer - James Lipari Resume Package.pdf`

**A:**

## Island Pavement Cutting Co. Reference Projects

- **Peter Scalamandre & Sons Contracting: Job 910 Cold Spring Harbor Wall Saw**
  - Work: Wall Saw Work
  - Status: In Progress
  - Dates: 03/14/2024 - 12/31/2024 (p. 33)
- **Posillico Civil Inc.: H61145-54G 08717 Resurfacing Wantagh Ave**
  - Work: Joints, SawCut, Joint Adhesive
  - Status: In Progress
  - Dates: 03/04/2024 - 12/31/2025 (p. 33)
- **Posillico Civil Inc.: H61587-PR7 08611**
  - Work: Saw Cut, Joints, Cracks/Joints
  - Status: PWC
  - Dates: 09/07/2022 - 12/31/2024 (p. 33)
- **Posillico Civil Inc.: 08843 Lido Blvd Rehab Phase 71**
  - Work: Cracks/Joints, Saw Cut
  - Status: Awarded
  - Dates: 05/20/2025 - 12/31/2026 (p. 33)
- **Posillico Civil Inc.: 08853 D265497 NY RT 101 Middle Neck**
  - Work: joint adh, slurry, sa (saw cut)
  - Status: Awarded
  - Dates: 08/07/2025 - 12/31/2026 (p. 33)

_domains: contracts · elapsed: 5.0s · cacheHit: false_

---

### [sq04] ✅ answered

**Q:** In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, on what date was the approval issued and who signed it?

**Sources:**
- `25.03.19 A37806-MTACD-MLJTC2-L-0024 - Sub-Contractor Approval – 50 States Engineering, Corp.pdf`

**A:**

## Sub-Contractor Approval Details

- **Approval Date:** March 19, 2025
- **Signed By:** Mekh Gurung (Naik/TYLin JV Sr. Project Manager) and Michael Wilson (MTA C&D Senior Director)

_domains: contracts · elapsed: 0.9s · cacheHit: false_

---

### [sq05] ✅ answered

**Q:** In A37806 Phasing Plan GEN-001R05, which stations are affected in each phase and what is the sequence of work?

**Sources:**
- `A37806_01 10 30_GEN-001R05 - Phasing Plan_PMC Comments_11-18-25 (MYRTLE ONLY).pdf`

**A:**

## Affected Stations and Work Sequence
- (p. 1, 9) The phasing plan details ADA accessibility upgrades for the Myrtle Avenue Station, part of a larger project for five stations.
- (p. 1, 2) Phase 1 (October 2025 - January 2026) involves street work, third-party coordination, fire protection pressure testing, and platform-level work including utility relocation, standpipe relocation, J2 track asbestos abatement, and demo shield installation.
- (p. 1, 2) Phases 2A-2E involve utility work on Broadway.
- (p. 1, 2) Phases 3A & 3B involve utility work on Melrose (excluding sewer), platform level demolition, and canopy removal.
- (p. 1, 2) Phase 4 involves foundation work for the overpass.
- (p. 1, 2) Phase 5 involves platform level work, including asbestos abatement on the J2 track, relocation of utilities and standpipe at elevators, and installation of a demo shield.
- (p. 5) Phase 1 (October 2025 - January 2026) requires relocation of existing platform level utilities, relocation of existing standpipe, asbestos abatement on J2 track (GO#1), station furniture and artwork removal, EDR upgrades, installation of demo shielding, and utility relocation.
- (p. 6) Phase 2A (January 2026 - February 2026) requires lead abatement and platform slab demolition on J2 track (GO#2), installation of temporary platform, and demolition of existing standing seam roofing on J2 track (GO#2).
- (p. 7) Phase 2B (February 2026) requires lead abatement and platform slab demolition on J1 track (GO#3), installation of temporary platform, and demolition of existing standing seam roofing on J1 track (GO#3).
- (p. 8) Phase 2C (February 2026) requires demolition of existing canopy and columns on J1 track (GO#4).
- (p. 10) Phase 2D (March 2026) requires demolition of existing canopy and columns on J2 track (GO#5).
- (p. 3, 4) Phase 3A & 3B (Platform Level) requires shop drawings, fabrication, and delivery of overpass steel, installation of overpass steel and truss (All Track GO #1), installation of platform and canopy steel (All Track GO #2&3), installation of formwork and temporary walkway for overpass level (All Track GO #2&3), installation of stairs PL5 & PL6, and enclosure installation from local tracks J1 and J2.
- (p. 4) Phase 3 & 4 (Street Level) requires full street closure on Melrose Street for foundation, steel & slab work, stairs, railings, canopy, exterior walls, overpass roof, exterior finishes, overpass lighting, fiber, and small power, and flat work.
- (p. 3, 4) Phase 4 (Platform Level) requires a long-term outage for J3/J4 track work, survey/submit/approve edge, traction power replacement (3rd rail), installation of elevator enclosure along center tracks J3/J4, installation of overpass roofing, ADA boarding area for J3/J4, restoration of platform edge and topping at elevator location, and MEP upgrades and communication.
- (p. 3) Phase 5 (Platform, Elevator & Existing Systems) requires ADA boarding area for local tracks, restoration of platform around elevator & stairs, upgrade of EDR rooms, and elevator installation.

_domains: contracts, field_ops · elapsed: 4.2s · cacheHit: false_

---

### [sq06] ✅ answered

**Q:** In the A37806 RFP Addendum 02 Pre-Proposal Slideshow, what are the proposal submission requirements and evaluation criteria described?

**Sources:**
- `Pre-Proposal Slideshow_A37806_RFP_Addendum_02.pdf`

**A:**

## Section 9.06 Requirements Summary (pre-proposal slideshow a37806 rfp addendum 02)
- Reviewed indexed section evidence from page(s): 39.
- Key requirements captured from the section:
- Systems Work Summary • Electrical • Electrical service at all five (5) stations will require upgrades include power distribution equipment upgrades • Lighting and power to all added or modified station areas including for elevators, control areas and headho...

Evidence: pre-proposal slideshow a37806 rfp addendum 02 (p. 39).

_domains: documents · elapsed: 2.3s · cacheHit: false_

---

### [sq07] ✅ answered

**Q:** In GEN-027R00 Subcontractor Approval Forms for Crossroads JV LLC, what technical resources, licenses, and prior revocations must be disclosed?

**Sources:**
- `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`

**A:**

## Subcontractor Disclosure Requirements

- **Technical Resources:** Explanation of staffing, facilities, equipment, and tools committed to the contract work (p. 30).
- **Licenses, Permits, Certifications:** List all relevant licenses, permits, or certifications held by the subcontractor or employees (p. 30).
  - Examples provided: AMPP QP-1 & QP-2 Certification, SSPC C-3 Lead Certification, NACE Level 2 Inspector Certification, NACE Level 1 Inspector Certification (p. 30).
- **Revoked/Suspended Licenses:** Disclosure of any revoked or suspended licenses, permits, or certifications, with detailed explanations (p. 30).

_domains: contracts, subcontractor · elapsed: 1.5s · cacheHit: false_

---

### [sq08] ⚠️ not found

**Q:** In GEN-027R00 for Crossroads JV LLC, who are the principal officers of the joint venture and when was the entity formed?

**Sources:**
- `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms - Crossroads JV, LLC.pdf`

**A:**

## Answer
- I could not find an exact indexed passage in a37806 gen-027r00 - r&r - subcontractor approval forms that answers this question.
- No evidence-backed specification text was verified in the retrieved chunks for this request.
- Refine with a section heading or exact phrase and I will search only this file again.
- **Evidence:** a37806 gen-027r00 - r&r - subcontractor approval forms (p. 3, 4, 5).

_domains: documents, contracts · elapsed: 1.2s · cacheHit: false_

---

### [sq09] ✅ answered

**Q:** In the M017_IMP Draft Subcontract, what conditions precedent govern subcontractor payment and change order compensation?

**Sources:**
- `M017_IMP_Draft Subcontract_20251024.docx`

**A:**

## Conditions Precedent for Subcontractor Payment

- **Receipt of Payment from Owner:** Contractor's receipt of payment from Owner for Subcontractor's Work is a condition precedent for Subcontractor to receive payment (Node 5).
- **Diversity Plan Compliance:** Subcontractor must provide executed copies of purchase orders/subcontracts for diversity plan participants and fulfill other reporting requirements in Attachment B – “Diversity Plan” (Node 5).
- **Strict Compliance with Article Provisions:** Strict compliance by Subcontractor with the provisions of this Article is a condition precedent to payments (Node 5).
- **Final Payment & Retainage:** Made within seven (7) days after final payment is received by Contractor from Owner and all conditions to payment are satisfied (Node 6).

## Conditions Precedent for Change Order Compensation

- **Receipt of Payment from Owner:** Contractor's receipt of payment from Owner for the Change Order is a condition precedent for Subcontractor to receive payment for that Change Order (Node 3).
- **Written Acknowledgment and Approval:** No increase in Subcontract Price unless the amount and liability are acknowledged and approved in writing (Node 4).
- **Timely Claim Submission:** Claims affecting or becoming part of a Contractor's claim under the Prime Contract must be made in sufficient time for Contractor to satisfy Prime Contract requirements, at least two working days preceding Contractor's claim deadline (Node 3).
- **Written Request for Time Extension:** Any extension of time due to a proposed Change Order must be requested in writing by Subcontractor prior to the Change Order's issuance and incorporated therein (Node 2).
- **A/E and Owner Approval:** For additional work requested by the Owner, no Change Order will be issued unless approved by the A/E and Owner prior to its issuance (Node 2).

_domains: contracts, subcontractor, communication · elapsed: 4.8s · cacheHit: false_

---

### [sq10] ✅ answered

**Q:** In the M017_IMP Draft Subcontract, what does the dispute resolution and governing law clause specify?

**Sources:**
- `M017_IMP_Draft Subcontract_20251024.docx`

**A:**

## Dispute Resolution and Governing Law

-   **Governing Law:** The Subcontract is governed by the laws of the state where the Project is located (p. 1, 2, 6).
    -   **Exception:** If the Subcontract incorporates FAR or Agency FAR Supplements, federal law governs (p. 6).
-   **Venue:** Exclusive venue for any proceeding is the state and county where the Project is located (p. 1, 6).
    -   **Exception:** If a federal agency is responsible for a dispute, Subcontractor follows the Subcontract's Disputes Clause and cannot file an action against Contractor in state or federal court (p. 6).
-   **Arbitration Option:** Contractor, at its sole option, can require Subcontractor to arbitrate any claims, disputes, and controversies (p. 1).
    -   Arbitrator's determination is final and binding (p. 1).
    -   Arbitration procedure follows the Prime Contract; if not specified, it follows the Construction Industry Arbitration Rules of the American Arbitration Association (p. 1).
-   **Disputes with Owner Responsibility:** Disputes for which the Owner is responsible are resolved per the Prime Contract's dispute clause (p. 6, 7).
    -   Subcontractor must submit a written claim within six (6) months of accrual, but no later than final payment (p. 7).
    -   Subcontractor must cooperate with Contractor in prosecuting the dispute and is bound by the outcome, unless specific conditions are met (p. 7).
    -   For claims exceeding the Contract Disputes Act of 1978 threshold, Subcontractor must submit a certified claim to Contractor for transmission to the Contracting Officer (p. 7).
-   **Continuity of Work:** Subcontractor must continue work during a dispute as if no dispute arose (p. 3).
    -   Payment for disputed items is deferred until final resolution (p. 3).
    -   Subcontractor cannot stop work for any reason, except if Contractor fails to pay undisputed sums (received from Owner) for more than thirty (30) days after due date (p. 3).
    -   In such a case, Subcontractor may stop work fifteen (15) days after written notice to Contractor (p. 3).

_domains: contracts, documents, communication · elapsed: 6.1s · cacheHit: false_

---

### [sq11] ✅ answered

**Q:** In Transmittal 0014 for MTA Personnel and PMC Supplies, who is the transmittal from and to, and on what date was it sent?

**Sources:**
- `A37806 Transmittal 0014 -  MTA Personnel and PMC Supplies.pdf`

**A:**

## Transmittal 0014 Details

- **From:** MLJTC2, 1010 Northern Blvd Suite 200 Great Neck NY 11021 (p. 1)
- **To:** AECOM, 605 Third Avenue, 3rd Floor, New York, NY 10158, Attn: Ray Batmaz (p. 1)
- **Date Sent:** April 24, 2026 (p. 1)

_domains: documents, contracts · elapsed: 3.9s · cacheHit: false_

---

### [sq12] ✅ answered

**Q:** What reserve service load values or electrical capacity are described in the Myrtle Ave Reserve Service Load Letter?

**Sources:**
- `MLJTC2-MTACD-0135 - NOC-028 - Avenue I Replacement of Existing Con Edison Reserve Service.docx`
- `MLJTC2-MTACD-0185 - Arbitration Notice-005 – Avenue I Replacement of Existing Con Edison Reserve Service.pdf`
- `26.06.09 A37806-MTACD-MLJTC2-L-0217 - Response to MLJTC2-MTACD-0199 - Follow Up to Arbitration Notices 004 and 005.pdf`
- `MLJTC2-MTACD-0185 - Arbitration Notice-005.pdf`
- `MLJTC2-MTACD-0218 - Arbitration Notice-007 – Avenue I and Myrtle Ave Replacement of Existing Con Edison Services.pdf`
- `26.03.12 A37806-MTACD-MLJTC2-L-0179 - Response to MLJTC2-MTACD-0135 – NOC-028 – Avenue I Replacement of Existing Con Edison Service.pdf`
- `MLJTC2-MTACD-0199 - Follow Up to Arbitration Notices 004 and 005.pdf`
- `MLJTC2-MTACD-018XX - Arbitration Notice-005 – Attachments.pdf`

**A:**

## Myrtle Ave Reserve Service Load Values

- The provided context mentions "load letters for the Existing and New Con Edison services at Myrtle Avenue station" (p. 4).
- It also references "NOC-010 Insufficient Space in Myrtle EDR" (p. 4).
- However, the specific reserve service load values or electrical capacity for Myrtle Avenue are not detailed in the retrieved documents.
- The documents primarily discuss load letters for the Avenue I station.

Next step: Please provide the "load letters for the Existing and New Con Edison services at Myrtle Avenue station" or "NOC-010 Insufficient Space in Myrtle EDR" for specific values.

_domains: documents, contracts · elapsed: 3.2s · cacheHit: false_

---

### [sq13] ✅ answered

**Q:** In the MTACD-MLJTC2-L-0017 subcontractor approval letter, on what date was MASE FX approved and who authorized it?

**Sources:**
- `25.03.19 A37806-MTACD-MLJTC2-L-0017 - Subcontractor Approval MASE FX $109,450.00.pdf`

**A:**

## MASE FX Approval Details

- MASE FX was approved on March 19, 2025.
- Approval authorized by Mekh Gurung (Naik/TYLin JV Sr. Project Manager) and Michael Wilson (MTA C&D Senior Director).

_domains: contracts, subcontractor · elapsed: 0.9s · cacheHit: false_

---

### [sq14] ✅ answered

**Q:** In the MTACD-MLJTC2-L-0028 subcontractor approval letter, is Titanium Linx Consulting approved for labor only, and what is the effective date of the approval?

**Sources:**
- `2025-03-26 MTACD-MLJTC2-L-0028 Sub-Contractor Approval Titanium Linx Consulting, Inc..pdf`

**A:**

## Subcontractor Approval Details
- (p. 1) Titanium Linx Consulting, Inc. is approved for Public Information & Outreach services, labor only.
- (p. 1) The effective date of approval for Titanium Linx Consulting, Inc. is March 26, 2025.

_domains: contracts, subcontractor · elapsed: 1.9s · cacheHit: false_

---

### [sq15] ✅ answered

**Q:** In the MTACD-MLJTC2-L-0049 subcontractor approval letter, what subsurface utility engineering purpose is McVac's vacuum excavation work supporting?

**Sources:**
- `25.06.10 A37806-MTACD-MLJTC2-L-0049 - Sub-Contractor Approval – McVac Environmental Services, Inc..pdf`

**A:**

## McVac's Vacuum Excavation Purpose
- McVac's vacuum excavation work supports test pits for subsurface utility engineering (SUE). (Node 1)

_domains: contracts, subcontractor · elapsed: 0.9s · cacheHit: false_

---

### [sq16] ⚠️ not found

**Q:** In the MTACD-MLJTC2-L-0083 subcontractor approval letter, is American Geophysics approved for labor only or does it include materials, and on what date was it approved?

**Sources:**
- `2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval – Providence Construction Corp..pdf`

**A:**

## American Geophysics Approval Status

The provided document, "2025-08-08 MTACD-MLJTC2-L-0083 - Sub-Contractor Approval – Providence Construction Corp.pdf", concerns the approval of **Providence Construction Corp.**, not American Geophysics.

This document does not contain information about American Geophysics.

_domains: contracts, subcontractor · elapsed: 1.1s · cacheHit: false_

---

### [sq17] ✅ answered

**Q:** In the MTACD-MLJTC2-L-0093 subcontractor approval letter, what micropile quantity or location scope is Tri-State Civil Construction approved to install, and who signed the letter?

**Sources:**
- `25.08.25 A37806-MTACD-MLJTC2-L-0093 - Sub-Contractor Approval – Tri-State Civil Construction LLC.pdf`

**A:**

## Micropile Scope and Approver

- Tri-State Civil Construction LLC is approved to furnish and install micropiles as part of the ADA upgrades (p. 1).
- The subcontract cost for this work is $1,134,080.00 (p. 1).
- The letter was signed by Michael Wilson, Senior Director, MTA C&D (p. 1).

_domains: contracts, subcontractor · elapsed: 1.0s · cacheHit: false_

---

### [sq18] ⚠️ not found

**Q:** In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what concrete cover requirements are specified for surfaces exposed to earth or weather?

**Sources:**
- `A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf`

**A:**

I could not find an exact indexed passage in a37806 03 20 00 avi-002r00 - aan - that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

_domains: documents · elapsed: 1.9s · cacheHit: false_

---

### [sq19] ✅ answered

**Q:** In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what revision history and approval dates are recorded in the title block?

**Sources:**
- `A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf`

**A:**

## Revision History and Approval Dates

-   **Document Date:** 02.03.26
-   **Revision Code:** AVI-002R00 (suggests initial or early revision)
-   **Approval Status:** No explicit approval stamps or inspection notes are visible in the provided excerpt.

_domains: contracts, documents · elapsed: 2.6s · cacheHit: false_

---

### [sq20] ✅ answered

**Q:** In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what cab dimensions and finish materials are specified?

**Sources:**
- `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf`

**A:**

## EL539 Cab Dimensions and Finish Materials
- The provided document summary for 'a37806 14 24 00 bur-009r00 - aan -' does not explicitly detail cab dimensions or finish materials.
- The summary indicates that full drawings likely contain this information.
- Next step: Review the full drawings for detailed dimensions and materials.

_domains: documents · elapsed: 1.1s · cacheHit: false_

---

### [sq21] ⚠️ not found

**Q:** In BUR-009R00 for the EL539 Cab and Entrance Drawings, what is the submittal revision number and who is the elevator manufacturer?

**Sources:**
- `A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf`

**A:**

## Submittal Revision Number
- (p. 1) Could not verify submittal revision number in the retrieved passages.

## Elevator Manufacturer
- (p. 1) Could not verify elevator manufacturer in the retrieved passages.

_domains: documents · elapsed: 1.5s · cacheHit: false_

---

### [sq22] ⚠️ not found

**Q:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, which spec section does this submittal cover?

**Sources:**
- `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf`

**A:**

I could not find an exact indexed passage in mljtc2 aecom atc 1 burnside avenue drawings that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

_domains: documents · elapsed: 1.9s · cacheHit: false_

---

### [sq23] ✅ answered

**Q:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what structural steel members and connection details are shown for the staircase enclosure?

**Sources:**
- `MLJTC2_AECOM_ATC_1_Burnside Avenue Drawings.pdf`

**A:**

## Answer
- The provided document, "mljtc2 aecom atc 1 burnside avenue drawings," does not contain the "BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings." The retrieved page (p. 3) shows an overpass level plan with general accessibility upgrades and stair locations, but no structural steel member or connection details for a staircase enclosure.
- **Next step:** Please provide the correct shop drawing document for the staircase enclosure.

_domains: documents · elapsed: 3.0s · cacheHit: false_

---

### [sq24] ✅ answered

**Q:** What specification requirements govern compaction testing and backfill material gradation near structures?

**Sources:**
- `PRDC.pdf`
- `PRDC - Original.pdf`
- `A37806_Volume_05_Project_Requirements_and_Design_Criteria (Commpressed).pdf`
- `AEIS LLC_IRF_A37806_0208- Avenue I Back Fill.pdf`
- `A37806_Volume_05_Project_Requirements_and_Design_Criteria (1).pdf`
- `A37806_01 10 20_NOR-035R01 - RSR - EDU02C (FINAL - 100) Structural Steel, Foundations at NOR.pdf`
- `Spec Sheets.pdf`
- `A37806 Project Requirements Design Criteria.pdf`

**A:**

## Compaction and Backfill Requirements Near Structures

-   **Compaction Density:** Uncontrolled fills must be compacted to a dry density not less than 90% of maximum dry density per ASTM D698 (Standard Proctor Method). (p. 431)
-   **Subsurface Structure Support:** Subsurface structures require support to prevent settlements after compaction. (p. 431)
-   **Backfill Placement Approval:** No backfill or fill can be placed in any excavation until the Project CEO approves the construction. (p. 11, 4807)
-   **Moisture Content Control:** Compaction of fills or backfills must adhere to specified gradation moisture content controls. (p. 11, 4807)

_domains: documents · elapsed: 4.8s · cacheHit: false_

---

### [sq25] ✅ answered

**Q:** In GEN-001R02 Elevator Walls Formwork Drawing, what was the AE reviewer's final disposition and were any comments issued?

**Sources:**
- `A37806_03 10 00_GEN-001R02 - RWC - Elevator Walls Formwork Drawing - MTA.pdf`

**A:**

## AE Reviewer's Final Disposition
- (p. 1, p. 2) The final submittal disposition by AE Reviewer Elie Hantouche is "Reviewed with Comments."

## Comments Issued
- (p. 2) The response from the AE Reviewer is "Please check the attachment."

_domains: documents · elapsed: 1.2s · cacheHit: false_

---

### [sq26] ⚠️ not found

**Q:** In Invoice 11707, what is the total amount billed, the invoice date, and the payment terms?

**Sources:**
- `Invoice 11707 revised.pdf`

**A:**

## Total Amount Billed
- (p. 1) The total amount billed for Invoice 11707 is $1,050.

## Invoice Date
- Could not verify Invoice Date in the retrieved passages.

## Payment Terms
- Could not verify Payment Terms in the retrieved passages.

_domains: documents, contracts · elapsed: 0.9s · cacheHit: false_

---

### [sq27] ✅ answered

**Q:** In Invoice 11830, what is the unit price per pest control visit and the total amount due for the Middletown stations?

**Sources:**
- `Invoice 11830.pdf`

**A:**

## Pest Control Unit Price
- (p. 1) The unit price for monthly pest control service for 1 station (4 visits) is $350.00.

## Total Amount Due
- (p. 1) The total amount due for the Middletown Stations is $1,400.00, including NYC sales tax.

_domains: contracts · elapsed: 1.1s · cacheHit: false_

---

### [sq28] ⚠️ not found

**Q:** In Lockton Invoice 0849812, what coverage or bond does the invoice cover and what is the policy period?

**Sources:**
- `2025 Lockton Invoice 0849812.pdf`

**A:**

I could not find an exact indexed passage in 2025 lockton invoice 0849812 that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

_domains: documents, contracts · elapsed: 0.6s · cacheHit: false_

---

### [sq29] ✅ answered

**Q:** In Lockton Invoice 0849812, what is the invoice date and the payment due date?

**Sources:**
- `2025 Lockton Invoice 0849812.pdf`

**A:**

## Invoice Date
- (p. 1) The invoice date is 07/21/2025.

## Payment Due Date
- (p. 1) The invoice payment is due by 08/21/2025.

_domains: documents, contracts · elapsed: 1.3s · cacheHit: false_

---

### [sq30] ✅ answered

**Q:** In the Backup for Invoice#01, what materials and equipment were used for the December 6, 2025 lead abatement containment at Burnside Station?

**Sources:**
- `Backup for Invoice#01.pdf`

**A:**

## Lead Abatement Materials and Equipment (12/06/2025)

- Materials were transported to the designated work platform. (p. 2)
- Lead abatement containment was built. (p. 2)
- Needle-gunning was performed on top flanges and miscellaneous structural span areas. (p. 2)

_domains: documents, contracts · elapsed: 1.2s · cacheHit: false_

---

### [sq31] ⚠️ not found

**Q:** In the Backup for Invoice#01, how many square feet of lead abatement were completed on December 7, 2025 and what was the total labor cost claimed?

**Sources:**
- `Backup for Invoice#01.pdf`

**A:**

## Lead Abatement on Dec 7, 2025
- (p. 3) Abated 195.06 square feet of surface area on December 7, 2025.

## Total Labor Cost
- Could not verify total labor cost in the retrieved passages.

_domains: documents, contracts · elapsed: 1.0s · cacheHit: false_

---

### [sq33] ⚠️ not found

**Q:** In Invoice#01 dated December 31, 2025, what is the total contract sum, total completed to date, and current payment due on the G702 application?

**Sources:**
- `2025-10-21 Eagle Business Machine Inv# 129318 $43.55 (M017 99-1530).pdf`

**A:**

## Invoice Details
- Could not verify total contract sum in the retrieved passages.
- Could not verify total completed to date in the retrieved passages.
- Could not verify current payment due on the G702 application in the retrieved passages.

_domains: contracts · elapsed: 2.5s · cacheHit: false_

---

### [sq34] ✅ answered

**Q:** In GEN-042R00, the A37806 & C49321R Coordination Meeting, what action items were assigned to Ahern regarding shielding removal?

**Sources:**
- `A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf`

**A:**

## Ahern Shielding Removal Actions

- Ahern will accommodate MLJTC2 by removing shield panels and spreading support cables where increased vertical clearance is required (p. 4).
- Ahern offered MLJTC2 access to shielding at Myrtle Ave Station, contingent on a signed agreement (p. 4).
- Ahern to send MLJTC2 a draft agreement for access to their shielding (p. 4).

_domains: documents, contracts · elapsed: 1.1s · cacheHit: false_

---

### [sq35] ✅ answered

**Q:** Who attended the September 3, 2025 coordination meeting and which contracts were being coordinated?

**Sources:**
- `A37806_01 30 20_GEN-026R00 - FIO - C34915 Coordination Meeting 07.03.25.pdf`
- `A37806 - ADA Package 6 - Meeting Minutes 1-20-2026_COMMS.pdf`
- `MFM-MLJTC2 _Weekly Meeting (7.21 ~ 11.03).pdf`
- `A37806_01 30 20_GEN-053R00 - FIO - Comms Kickoff Meeting Minutes_20250916.pdf`
- `Attendance Report.pdf`
- `A37806 - ADA P6 Coordination meeting  A-37806 & R-50767 - FOC Relocation Burnside Ave. station 20250729.docx`
- `A37806 - ADA P6 Coordination meeting  A-37806 & R-50767 - Relocation of Fiber Optic cable at Burnside Ave. station 20250729.docx`
- `A37806 - ADA Package 6 - Brooklyn ConEd Coordination Meeting 06.12.25.docx`

**A:**

## September 3, 2025 Meeting Attendees and Contracts

- No meeting minutes or attendance records for September 3, 2025, were found.
- The closest meeting found was July 3, 2025, coordinating Contracts A-37806 and C-34915 (p. 3).
- Attendees for the July 3, 2025 meeting included: Mekh Gurung (PMC), Jack Czyzewski (PMC), Jimmy Pasagelis (Ahern), Mohammed Rony (MTA), Keith Hofler (Ahern) (p. 3).
- Next step: Please provide the correct date or meeting title if September 3, 2025, is incorrect.

_domains: contracts, communication · elapsed: 2.8s · cacheHit: false_

---

### [sq36] ✅ answered

**Q:** In A37806 Kick Off Pre-Work Conference, what key project contacts and their roles are listed?

**Sources:**
- `A37806_01 30 20_GEN-002R00 - FIO - Pre-Work Conference Meeting Minutes 02.13.25.pdf`

**A:**

## Key Project Contacts and Roles

- **Michael Wilson:** Senior Director, PCEO, NYC (p. 1)
- **Mohammed Rony:** Participant (Mohammed.Rony@mtacd.org) (p. 4)
- **Dominick Toscano:** Participant (Dominick.Toscano@mtacd.org) (p. 4)
- **Oleg Shen:** Participant (Oleg.Shen@mtacd.org) (p. 4)
- **Louis Lanfair:** Participant (Louis.Lanfair2@nyct.com) (p. 4)
- **Rahul Patel:** Participant (Rahul.Patel@nyct.com) (p. 4)
- **Teresa Lennon:** Participant (Teresa.Lennon@mtacd.org) (p. 4)
- **Joshua Rosenberg:** Participant (Joshua.Rosenberg@nyct.com) (p. 4)
- **Kennis Baptiste:** Participant (Kennis.Baptiste@mtacd.org) (p. 4)
- **Roy Chelagiri:** Participant (Roy.Chelagiri@mtacd.org) (p. 4)
- **Xin Yuan:** External Participant (xyuan@tcelect.net) (p. 4)
- **Robert Ayzin:** Participant (Robert.Ayzin@nyct.com) (p. 4)
- **Alexander Timber:** External Participant (p. 4)
- **Rakesh Talwar:** MTA Quality (p. 15)
- **Nabeel Anjum:** Quality Manager (p. 15)
- **Luminita Marinescu:** MTA Environmental (p. 15)
- **Katrina Patouri:** To be invited to Public Communications and Outreach Kickoff (p. 15)
- **Anthony Drummond:** To be invited to Public Communications and Outreach Kickoff (p. 15)
- **Jonathan Flynn:** To be invited to Public Communications and Outreach Kickoff (p. 15)
- **Luke Depalma:** To be invited to Public Communications and Outreach Kickoff (p. 15)
- **Matt Best:** To schedule meeting with DOT (p. 15)

_domains: documents, contracts · elapsed: 4.9s · cacheHit: false_

---

### [sq37] ⚠️ not found

**Q:** In A37806 Kick Off Pre-Work Conference, what safety and environmental requirements are emphasized for project start-up?

**Sources:**
- `A37806_01 30 20_GEN-002R00 - FIO - Pre-Work Conference Meeting Minutes 02.13.25.pdf`

**A:**

I could not find an exact indexed passage in a37806 01 30 20 gen-002r00 - fio - that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

_domains: contracts, field_ops, documents · elapsed: 2.3s · cacheHit: false_

---

### [sq38] ✅ answered

**Q:** In the July 24, 2025 Monthly Job Progress Meeting, what were the main schedule and procurement discussion points recorded in the minutes?

**Sources:**
- `A37806 Monthly Job Progress Meeting Minutes 2025-07-24.pdf`

**A:**

## Schedule Discussion Points
- (p. 10) The Design-Build Baseline Schedule was approved.
- (p. 10) The June Update Narrative was submitted on 7/3/25, and a response was received on 7/9/25; the DB is to provide monthly updates.
- (p. 10) A CRR was submitted on 7/11/25, and the DB needs to modify the DCB for PMC review for the Loaded Schedule.
- (p. 10) The DB is to submit the 6-Week Look Ahead Schedule weekly, and PMC distributes it to stakeholders.

## Procurement Discussion Points
- (p. 3) Elevator Procurement (EDU-03) is 100% complete, with Revision 1 submitted, and PMC/MTA is to revise and resubmit by 7/22/25.
- (p. 3) Elevator Enclosures Procurement (EDU-04) is 90% complete, with comments received, and PMC/MTA is reviewing it as of 7/14/25.
- (p. 3) Long Lead Communication, Fire Alarm Procurement (EDU-05A) is 100% complete, with specification packages for Myrtle, Norwood, and Middletown resubmitted; Burnside and Avenue I packages are to be resubmitted after 60% comments are resolved by 7/30/25.
- (p. 3) Long Lead Electrical Procurement (EDU-05B) is 100% complete, with the specification package pending Load Letter Concurrence from MTA Energy Management and Con Edison, and may be split by station.
- (p. 3) Track, Traction Power & Signals (EDU-06) is 100% complete, with AECOM/MLJTC2 ongoing as of 8/1/25.
- (p. 11) MLJTC2 is to resubmit the Long Lead Items Log.

_domains: contracts, documents, communication · elapsed: 4.8s · cacheHit: false_

---

### [sq39] ✅ answered

**Q:** In the July 24, 2025 Monthly Job Progress Meeting, what design and engineering coordination items involving the consultant team were discussed?

**Sources:**
- `A37806 Monthly Job Progress Meeting Minutes 2025-07-24.pdf`

**A:**

## Design and Engineering Coordination Items

-   **Burnside Avenue Value Engineering Meeting:** To be set up by MLJTC2/MTA by 7/31/25. (p. 4)
-   **Norwood SOGR:** Revised report submitted as correspondence; MLJTC2 to determine outage requirements for SOGR. (p. 4)
-   **Avenue I Utility Work:** Coordination with Con Ed MOU in final stages. (p. 4)
-   **Burnside Avenue DOT Option Work:** DEP comments letter includes Option Work scope, potentially delaying design approval. (p. 4)
-   **Avenue I SB/NB Design:** In progress, awaiting Con-Ed layout drawings for duct bank relocation. (p. 4)
-   **Myrtle - Field Verification:** Retired utilities (Con Ed) verification by MLJTC2. (p. 4)

_domains: documents, contracts · elapsed: 3.5s · cacheHit: false_

---

### [sq40] ✅ answered

**Q:** In the May 28, 2026 Monthly Job Progress Meeting Minutes, what new change proposal requests (CPRs) or RFIs were opened or closed during the period?

**Sources:**
- `A37806_01 30 20_GEN-143R00 - FIO - Monthly Job Progress Meeting Minutes 05.28.26.pdf`

**A:**

## CPRs and RFIs Opened/Closed

- **Opened RFI-033**: New PA Server Testing, due 6/11/2026 (p. 5).
- **Opened RFI-209**: PA/CIS system upgrade/replacement, submitted 5/27/2026 (p. 6).
- **Opened CPR-003 R2**: Norwood SOGR, issued 5/6/2026 (p. 5).
- **Opened CPR**: Burnside Avenue DOT Option Work (MTA to issue) (p. 5).
- **Opened CPR**: MOU for Night Work (p. 5).
- **Opened CPR**: Avenue I Coordination with MTA Signals (MTA to issue) (p. 6).
- **Opened CPR**: PA/CIS system - (Upgrade and Replacement)/ Access to the RCC lab (PMC/MTA to issue) (p. 6).
- **Closed**: No CPRs or RFIs were explicitly marked as "Closed" in the provided context for this period.

_domains: documents, communication · elapsed: 5.0s · cacheHit: false_

---

### [sq41] ✅ answered

**Q:** In the May 28, 2026 Monthly Job Progress Meeting, what upcoming Grade Operations (GOs) are forecast for the next reporting period across the stations?

**Sources:**
- `A37806 Monthly Job Progress Meeting Minutes 2026-05-28.docx`

**A:**

## Upcoming Grade Operations (GOs)

- **Burnside:** One (1) Continuous GO for Weeks 18-38 (p. 5).
- **Myrtle:** One (1) GO scheduled for Week 21 (p. 5).
- **Middletown:** One (1) GO scheduled for Week 25 (p. 5).
- **Middletown:** One (1) PB GO scheduled for Week 23 (p. 5).
- **Myrtle:** One (1) PB GO scheduled for Week 24 (p. 5).
- **Norwood:** Two (2) PB GOs scheduled for Week 25 & Week 26 (p. 5).

_domains: contracts · elapsed: 3.3s · cacheHit: false_

---

### [sq42] ✅ answered

**Q:** In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what survey and layout deliverables are discussed?

**Sources:**
- `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`

**A:**

## Survey and Layout Deliverables

- OCIP and Sub approval for surveyor by SDI: 12/22/2025 (p. 2)

_domains: documents, contracts · elapsed: 2.9s · cacheHit: false_

---

### [sq43] ✅ answered

**Q:** In the SDI-MLJ Bi-weekly Meeting Agenda from December 19, 2025, what insurance and subcontractor onboarding items remain open for the surveyor?

**Sources:**
- `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025.docx`

**A:**

## Surveyor Onboarding Items

- OCIP and Sub approval for surveyor (p. 2)
- Target date for completion: 12/22/2025 (p. 2)

_domains: contracts, subcontractor · elapsed: 3.3s · cacheHit: false_

---

### [sq44] ✅ answered

**Q:** Which agencies issued the current permits submitted for Burnside Ave, and what is their approval status?

**Sources:**
- `A37806_01 33 10_BUR-007R00 - FIO - DOT Permits Exp 6.11.26.pdf`
- `A37806_01 30 20_GEN-013R00 - FIO - Monthly Job Progress Meeting Minutes 04.24.25.pdf`
- `A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10.21.25.pdf`
- `A37806 MLJTC2 Monthly Progress Report - January 2025.docx`
- `A37806 MLJTC2 Monthly Progress Report - February 2025.docx`
- `A37806_01 31 30_GEN-001R00 - FIO - Monthly Progress Report - January 2025.pdf`
- `A37806_27 10 01_BUR-026R00 - APP - Burnside Ave NBP Comm Equipment Disconnection and Removal Bulletin Signed.pdf`
- `A37806_01 31 30_GEN-002R00 - FIO - Monthly Progress Report - February 2025.pdf`

**A:**

## Burnside Ave Permits

- **Agency:** DOT (Department of Transportation)
- **Permit 1 Status:** FIO (For Information Only), Issued 4/16/2026, Expires 6/11/2026 (p. 1)
- **Permit 2 Status:** FIO (For Information Only), Amended, Expires 10/21/2025 (p. 2)

_domains: documents · elapsed: 4.9s · cacheHit: false_

---

### [sq45] ✅ answered

**Q:** Which agencies issued the current permits submitted for Ave I, and what is their approval status?

**Sources:**
- `A37806_01 33 10_AVI-001R00 - FIO - DOT Permits Exp. 05.30.25.pdf`
- `A37806_01 33 10_AVI-002R00 - FIO - Tree Work Permits.pdf`

**A:**

## AVI Permit Submittals
The following permit-related submittal files are on record for AVI:

- a37806 01 33 10 avi-001r00 - fio -
- a37806 01 33 10 avi-002r00 - fio -

_domains: documents · elapsed: 1.6s · cacheHit: false_

---

### [sq46] ⚠️ not found

**Q:** Which agencies issued the current permits submitted for Myrtle Ave, and what is their approval status?

**Sources:**
- `A37806_Design-Build Agreement - Fully Executed.pdf`
- `A37806 Proposal MLJTC2 - Vol 2.pdf`
- `Exhibit B - Technical Proposal.pdf`
- `P6 RFP Schedule.pdf`
- `A37806 ADA Package 6 - Vol. 2 - Technical Proposal.pdf`
- `Proposal for Contract A37806  - ADA Package 6 - SIGNED ORIGINAL- MLJTC2.pdf`
- `MLJTC2-MTA-006-A37806 Final Oral Q&A- 20241126 complete.pdf`
- `A37806 Proposal MLJTC2 - Vol 2 - Section 2E.pdf`

**A:**

## Myrtle Ave Permits

- The provided context does not contain information about specific agencies that issued permits for Myrtle Ave or their approval status.
- The documents mention a "GEN-Submit Agency Coordination and Permitting Implementation Plan" (p6 rfp schedule, p. 1), but not the permits themselves.

_domains: documents · elapsed: 4.5s · cacheHit: false_

---

### [sq47] ✅ answered

**Q:** Which agencies issued the current permits submitted for Middletown, and what is their approval status?

**Sources:**
- `25.10.28 A37806-MTACD-MLJTC2-L-0117 - Delay ins Submission of Permit doc. & the RFCD Package for EDU2B Structural & Foundation Work – MDT.pdf`
- `25.10.28 MTACD-MLJTC2-L-0117 - Delay ins Submission of Permit documents & the RFCD Package for EDU2B Structural & Foundation Work – MDT.pdf`
- `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`
- `A37806_01 33 10_MDT-005R00 - ORIG - Middletown Tree Work Permit.pdf`
- `A37806_01 33 10_MDT-007R00 - FIO - DOT Permits Exp. 10.21.25.pdf`
- `A37806_01 33 10_MDT-009R00 - FIO - DOT Permits Exp. 11.30.25.pdf`
- `A37806_01 33 10_MDT-010R00 - FIO- DOT PERMITS EXP 12-31-25.pdf`
- `A37806_01 33 10_MDT-011R00 - FIO - DOT PERMITS EXP 03-13-26.pdf`

**A:**

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

_domains: documents · elapsed: 1.6s · cacheHit: false_

---

### [sq48] ✅ answered

**Q:** Which agencies issued the current permits submitted for Norwood Ave, and what is their approval status?

**Sources:**
- `A37806_Design-Build Agreement - Fully Executed.pdf`
- `A37806 Proposal MLJTC2 - Vol 2.pdf`
- `Exhibit B - Technical Proposal.pdf`
- `P6 RFP Schedule.pdf`
- `A37806 ADA Package 6 - Vol. 2 - Technical Proposal.pdf`
- `Proposal for Contract A37806  - ADA Package 6 - SIGNED ORIGINAL- MLJTC2.pdf`
- `MLJTC2-MTA-006-A37806 Final Oral Q&A- 20241126 complete.pdf`
- `A37806 Proposal MLJTC2 - Vol 2 - Section 2E.pdf`

**A:**

## Norwood Ave Permits

- The provided context does not list specific agencies that issued permits for Norwood Ave.
- The approval status of permits for Norwood Ave is not available in the provided documents.
- The documents mention a "GEN-Submit Agency Coordination and Permitting Implementation Plan" (p. 1, p6 rfp schedule), but not the permits themselves.

Next step: Provide the "Agency Coordination and Permitting Implementation Plan" or permit logs.

_domains: documents · elapsed: 4.0s · cacheHit: false_

---

### [sq49] ✅ answered

**Q:** In MDT-005R00 Middletown Tree Work Permit, what tree protection and pruning requirements apply during construction?

**Sources:**
- `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work Permit.pdf`

**A:**

## Section 2.5 Requirements Summary (a37806 01 33 10 mdt-005r00 - fio -)
- Reviewed indexed section evidence from page(s): 4.
- Key requirements captured from the section:
- This includes guidelines for soil protection, erosion control, overhead clearance, excavation and trenching, irrigation, and water runoff.
- Stumps and all surface roots shall be removed or ground to a minimum depth of twenty four inches (24") below grade.

Evidence: a37806 01 33 10 mdt-005r00 - fio - (p. 4).

_domains: documents · elapsed: 1.8s · cacheHit: false_

---

### [sq54] ✅ answered

**Q:** In BUR-081R00 January 2026 Construction Photos, what safety measures and MPT signage are visible in the January 20, 2026 photos?

**Sources:**
- `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf`

**A:**

## January 20, 2026 Photo Safety & MPT Signage

- **CRITICAL:** The provided document summary for "BUR-081R00 - FIO - January 2026 Construction Photos" does not contain specific details about visible safety measures or MPT signage.
- It only generally mentions "Maintenance and Protection of Traffic (MPT)" and "demolition shielding installation."
- To answer this query, the actual photo content from the PDF "A37806_01 32 10_BUR-081R00 - FIO - January 2026 Construction Photos.pdf" would need to be reviewed.

_domains: field_ops · elapsed: 1.3s · cacheHit: false_

---

### [sq55] ✅ answered

**Q:** In BUR-081R00 January 2026 Construction Photos, what excavation or foundation work is documented at the Burnside Avenue northbound side?

**Sources:**
- `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf`

**A:**

## Burnside Avenue Northbound Excavation/Foundation Work

- Utility relocation trench work is documented.
- Con Edison is involved in the utility relocation.
- Road plate protection is in place over the trench.
- Demolition shielding installation is also shown.
- Photos were taken on January 20, 2026.
- This work is part of accessibility upgrades under Contract A37806 Design-Build Services Package 6.
- The document is for NYCT/MTA review and approval.

_domains: documents, contracts · elapsed: 1.1s · cacheHit: false_

---

### [sq56] ⚠️ not found

**Q:** In BUR-080R00 Burnside December 2025 Construction Photos, on what dates were the photos taken and what site conditions are shown?

**Sources:**
- `A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf`

**A:**

## Answer
- I could not find an exact indexed passage in a37806 01 32 10 bur-080r00 - fio - that answers this question.
- No evidence-backed specification text was verified in the retrieved chunks for this request.
- Refine with a section heading or exact phrase and I will search only this file again.

_domains: field_ops · elapsed: 0.9s · cacheHit: false_

---

### [sq57] ⚠️ not found

**Q:** In BUR-080R00 Burnside December 2025 Construction Photos, what staging areas and material deliveries are documented?

**Sources:**
- `A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf`

**A:**

## Answer
- I could not find an exact indexed passage in a37806 01 32 10 bur-080r00 - fio - that answers this question.
- No evidence-backed specification text was verified in the retrieved chunks for this request.
- Refine with a section heading or exact phrase and I will search only this file again.

_domains: documents, contracts · elapsed: 1.1s · cacheHit: false_

---

### [sq58] ✅ answered

**Q:** In MYR-076R00 Myrtle December 2025 Construction Photos, what elevator or stair construction progress is shown at Myrtle Avenue station?

**Sources:**
- `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`

**A:**

## Myrtle Avenue Station Progress

- The document "MYR-076R00 Myrtle December 2025 Construction Photos" shows installation of vibration monitoring equipment at Myrtle Avenue work area (p. 1).
- No elevator or stair construction progress is shown in this specific photo submittal (p. 1).

_domains: documents, contracts · elapsed: 1.1s · cacheHit: false_

---

### [sq59] ✅ answered

**Q:** In MYR-076R00 Myrtle December 2025 Construction Photos, what date range do the photos cover and who prepared the submittal?

**Sources:**
- `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf`

**A:**

## Photo Submittal Details

- The photo is dated December 19, 2025 (p. 1).
- The submittal was prepared by Clifford Mason (dba MASE FX) for MLJ Contracting, Inc. (p. 1).

_domains: documents · elapsed: 0.9s · cacheHit: false_

---

### [sq60] ✅ answered

**Q:** In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings or schedule benefits are claimed for the value engineering change proposal?

**Sources:**
- `0050 - A-37808 (76114) - EMD - Burnside Ave - 2025-05.05 & 05.07 (7a-3p).pdf`

**A:**

## VECP Cost/Schedule Benefits

No cost savings or schedule benefits are claimed in the provided document.

The document is an EMD Contract Compliance Work Order Request form, not a VECP presentation.

_domains: documents, contracts · elapsed: 2.4s · cacheHit: false_

---

### [sq61] ✅ answered

**Q:** In the Burnside Avenue VECP Presentation, which design disciplines are affected by the proposed value engineering changes?

**Sources:**
- `AK_A37806_Volume_08A_BX_Burnside_Ave_Option_Work.pdf`

**A:**

## Affected Design Disciplines
- Civil (p. 1)

_domains: documents, contracts · elapsed: 2.5s · cacheHit: false_

---

### [sq62] ⚠️ not found

**Q:** In PRO 26-01 Control of Project Nonconforming Items, what are the steps for dispositioning a nonconforming item once an NCR is issued?

**Sources:**
- `MLJ Projection- Con Ed wingback T&E.xlsx`

**A:**

I could not find an exact indexed passage in mlj projection- con ed wingback t&e that answers this question.
No evidence-backed specification text was verified in the retrieved chunks for this request.
Refine with a section heading or exact phrase and I will search only this file again.

_domains: documents, contracts · elapsed: 2.0s · cacheHit: false_

---

### [sq63] ✅ answered

**Q:** In GEN-006R01 NCR Template & Log, what fields are included on the NCR form itself for documenting a nonconformance?

**Sources:**
- `A37806_01 40 10_GEN-006R01 - AEAN - NCR Template & Log.pdf`

**A:**

## NCR Form Fields

-   NCR Number
-   Project Name
-   Contract Number
-   Drawing Number
-   Specification Section
-   Location of Nonconformance
-   Date NCR Occurred
-   Date NCR Initiated
-   Description of Nonconformance
-   Proposed Disposition
-   Corrective Action
-   Root Cause Analysis
-   Responsible Party
-   Target Completion Date
-   Actual Completion Date
-   Verification of Corrective Action
-   Re-inspection Date
-   Signatures for Project Manager, Quality Manager, Designer, NYCT/MTA
-   Approval Status (NYCT/MTA Review & Comment, Approval, Information Only)

_domains: documents, contracts · elapsed: 1.5s · cacheHit: false_

---

### [sq64] ✅ answered

**Q:** Summarize the track limit revisions and closure disposition in A37806_RFI-0203 Norwood J1 Revised Track Limits R1.

**Sources:**
- `A37806_RFI-0203 - CLO - Norwood J1 Revised Track Limits R1.pdf`

**A:**

## Track Limit Revisions and RFI Disposition

-   **Track J2:** MTA directed full replacement by MOW Track Construction (p. 2).
-   **Track J1:** Limits extended to use procured J2 materials, maintaining contract trackwork length (p. 2).
-   **Clarifications Requested:** J1 contact rail, heat trace, and track replacement limits (p. 2).
-   **RFI Status:** Closed (CLO) as per document title.
-   **Cost/Time Impact:** Probable increase in both cost and time due to MTA's change in direction (p. 2).

_domains: documents · elapsed: 1.6s · cacheHit: false_

---

### [sq65] ⚠️ not found

**Q:** In J-TRACK-13A-041R00 Material I&T Request for the 100-8 6-hole joint bar, what is the inspection and test status and who is the material supplier?

**Sources:**
- `A-37806_J-TRACK-13A-041R00 - APP - Material I&T Request 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs).PDF`

**A:**

## Inspection and Test Status
- (p. 7) The material I&T request for the 100-8 (6 Hole) Joint Bar 36'' (Qty.59 Pairs) is "Not_Reviewed" as of 03/13/2026.
- (p. 7) The request was approved by MTA I&T, and the PMC notified DB on 3/27.
- (p. 12) Any drawing without an MTA approval stamp cannot be used for inspection.
- (p. 17) The Design-Builder must ensure that running and guard rails, contact rail and end approaches, insulators, fiberglass materials and components, crossties and tie blocks, concrete ties and blocks, insulated joints, rail fastener plates, and special work materials are fully inspected by the PCEO and MTA-NYCT’s Inspection and Testing Division.

## Material Supplier
- Could not verify material supplier in the retrieved passages.

_domains: field_ops, documents · elapsed: 3.3s · cacheHit: false_

---

### [sq66] ✅ answered

**Q:** In RFI-0115 for the Myrtle Avenue Louver Exhaust Face Velocity issue, what resolution or design change was proposed to address the velocity problem?

**Sources:**
- `A37806_RFI-0115 - CLO - Louver Exhaust Face Velocity 09.04.25.pdf`

**A:**

## RFI-0115 Resolution

- The design builder shall proceed with horizontal blade louvers to maintain consistent architectural appearance (p. 3).
- The 50% free area is based on the actual louver area, not a 48" x 48" model (p. 3).
- The design builder shall select a horizontal blade louver that meets most PRDC requirements (p. 3).
- The design builder must explain why certain criteria cannot be met and justify performance concessions (p. 3).

_domains: documents · elapsed: 3.0s · cacheHit: false_

---

### [sq67] ✅ answered

**Q:** In RFI098 for the Ave I Conductor Board at Station 489+00, what resolution or field direction was provided and who responded to the RFI?

**Sources:**
- `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf`

**A:**

## RFI 098 Resolution and Respondent

- **Resolution/Field Direction:** Not provided in the retrieved context. The RFI is requesting direction/approval.
- **RFI Initiator:** AECOM (p. 1)
- **Action Requested:** Direction (p. 1)
- **Probable Cost Effect:** Unknown (p. 1)
- **Probable Time Effect:** Increase (p. 1)

_domains: documents · elapsed: 1.2s · cacheHit: false_

---

### [sq68] ✅ answered

**Q:** In RFI098 for the Ave I Conductor Board, what track and platform dimensions are noted around Station 489+00 to 490+00?

**Sources:**
- `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf`

**A:**

## Track and Platform Dimensions (RFI098)

- **Station 490+00:**
    - Northbound platform (Track B2) has a conductor board. (p. 1)
    - Drawing AVI-G-103 depicts a 40-ft long ADA boarding area centered at this station. (p. 1)
- **Station 489+00:**
    - Northbound platform (Track B2) has a conductor board. (p. 1)
    - This conductor board appears to correspond to a 4-car train. (p. 1)
    - No ADA boarding area or path is shown at this station in Drawing AVI-G-103 or AVI-G-122. (p. 1)

_domains: documents · elapsed: 1.4s · cacheHit: false_

---

### [sq69] ✅ answered

**Q:** In A37806 RFI096, what question is being asked of the design team and what is the RFI status?

**Sources:**
- `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Norwood ONLY.pdf`

**A:**

## Question to Design Team
- (p. 1, p. 10) MLJ Contracting Corp asks the design team to provide an updated project schedule and design/shop drawings for contract W47032 to evaluate potential equipment and wiring relocations at Norwood Ave. and Myrtle Ave. stations.

## RFI Status
- (p. 1, p. 2, p. 3) The RFI status is "Closed," but coordination details are pending.

_domains: documents · elapsed: 2.9s · cacheHit: false_

---

### [sq70] ✅ answered

**Q:** In A37806 RFI096, what dimensional discrepancy or field condition prompted the RFI at the McDonald Avenue station?

**Sources:**
- `A37806_RFI-0042 - CLO - Coordination with Contract W47032 – PS LAN system _Norwood ONLY.pdf`

**A:**

## Answer
- The provided RFI (A37806 RFI-0042) does not pertain to McDonald Avenue station.
- It is titled "Coordination with Contract W47032 – PS LAN system _Norwood ONLY".
- Therefore, no dimensional discrepancy or field condition for McDonald Avenue station is discussed within this document.
- **Evidence:** a37806 rfi-0042 - clo - coordination with contract (p. 6, 7, 18).

_domains: documents · elapsed: 3.0s · cacheHit: false_

---

### [sq71] ✅ answered

**Q:** In MYR-002R00 Myrtle Avenue Demo Shield Drawings, what loading criteria and design standards apply to the demolition shielding?

**Sources:**
- `A37806_01 10 30_MYR-002R00 - AAN - Myrtle Demo Shield Drawings.pdf`

**A:**

## Demolition Shielding Design Criteria

-   **Loading Criteria:** Temporary loads imposed on the permanent structure (p. 1, 2).
-   **Design Standards:**
    -   Latest edition of the New York State Building Code (p. 2).
    -   NYCTA Regulations and Design Standards (p. 2).
    -   OSHA Requirements (p. 2).
    -   New York State Department of Transportation Requirements (p. 2).
-   **Conflict Resolution:** Where requirements conflict, the more stringent shall apply (p. 2).
-   **Contractor Responsibility:** Contractor is responsible for the design of temporary structures and field verification of existing conditions (p. 1, 2).

_domains: documents · elapsed: 1.3s · cacheHit: false_

---

### [sq72] ✅ answered

**Q:** In drawing MYR-A-444A, what dimensions and mounting details are shown for the EL1121/EL1122 elevator enclosure panels at Myrtle Avenue station?

**Sources:**
- `Myrtle Expansion Joint Pages from 8.03 - Archive Drawings.pdf`

**A:**

## Elevator Enclosure Panel Details
- The requested drawing MYR-A-444A is not found in the provided context.
- The active document "myrtle expansion joint pages from 8 03 -" does not contain details for elevator enclosure panels.
- Next step: Provide drawing MYR-A-444A for review.

_domains: documents · elapsed: 2.7s · cacheHit: false_

---

### [sq73] ✅ answered

**Q:** In RFI-0116 for the Myrtle Avenue PS LAN followup, who attended the September 9, 2025 coordination meeting recorded in the attendance report?

**Sources:**
- `A37806_RFI-0116 -Follow-up to RFI 0057 Myrtle Ave PS LAN coordination - Attendance report 9-09-25.csv`

**A:**

## RFI-0116 Meeting Attendees

- 17 participants attended the meeting.
- Participants included Tylin, MLJ Contracting, TC Electric, MTACD, NYCT, and AECOM.
- Key roles were organizers and presenters.

_domains: contracts, documents · elapsed: 4.5s · cacheHit: false_

---

### [sq74] ✅ answered

**Q:** In RFI-009 for Myrtle Avenue UPS Backup Requirements, what battery runtime or backup duration is required and what spec section governs it?

**Sources:**
- `806-RFI-009 - Myrtle Avenue UPS Backup Requirements.pdf`

**A:**

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
in the room to 7. This would bring the total electrolyte gallons for the room to be over 50 gallons, exceeding NFPA 1 §608.1
requirements, now requiring a hydrogen detection tied to the communication room's existing exhaust fan per IFC 1207.6.1
requirements.
Please advise if the Design-Builder is to follow PRDC requirements or to provide a 4-Hour back up to this communication
room's UPS.
Awaiting an Official Response
TCE, LLC Page 1 of 1 Printed On: Sep 30, 2025 03:27 PM EDT
```

_domains: documents, scheduling · elapsed: 0.2s · cacheHit: false_

---

### [sq75] ✅ answered

**Q:** In GEN-096R04 SWP-016 for Elevator Steel and Enclosure, what safe work procedures apply to steel erection and what fall protection is required?

**Sources:**
- `A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator Steel & Enclosure..pdf`

**A:**

## Steel Erection Safe Work Procedures

- A safety toolbox meeting will be held at the beginning of each shift concerning issues that pertain to the shift’s activities and anticipated hazards (p. 13).
- SWP to be reviewed/signed with all personnel prior to start of work (p. 13).
- Daily Safety Briefing/Fitness for Duty with all personnel prior to entering work site (p. 13).
- Personnel will only have foul trackage, work on platforms, or enter the ROW in the direction of MTA Flaggers (p. 14).
- Maintain Stable Footing, be mindful of foot placement while walking (p. 14).
- Personnel will always treat 3rd rails as LIVE (p. 14).
- No standing/sitting on 3rd rail cover boards (p. 14).
- Personnel will be within gauge of running rails (p. 14).
- All personnel are required to attend Right of Way (ROW) Safety Briefing (p. 14).
- Cell Phones and Electronic Devices are PROHIBITED from being used while working on the ROW (p. 14).
- No Hoods may be worn while working on the ROW (p. 14).
- Non-Conductive instruments/tools must be used (p. 14).
- Tools must have proper insulation and be inspected daily for damage; damaged tools shall be removed from service immediately and tagged Do Not Use (p. 15).
- Extension cords must be inspected daily for damage, and have a proper grounding plug (p. 15).
- GFCI'S will be used with all electrical tools to prevent electrical shocks, burns, or electrocution (p. 15).
- All machine guards shall be installed and in use as required (p. 15).
- Inspect hand & power tools before use to ensure safe operation (p. 15).
- Wooden handles of tools kept free of splinters or cracks (p. 15).
- All ladders will be inspected for damage prior to use (p. 15).
- Three points of contact at all times while ladders are in use (p. 15).
- All ladders over 6' will be footed or lashed (p. 15).
- Ladder permit and ladder inspection tag, as per the ladder permitting program (3.28), to be used in compliance with Division 1 01 35 10 Construction Safety Requirements (p. 15).
- A trained, qualified person will hold certification to operate scissors & Boom lifts (p. 19).
- A competent person will survey the work area for any obstructions the lift could encounter while being used (p. 19).
- Inspect the lift before use, and check if backup alarms & all components are working correctly (p. 19).
- Lift apparatus to not exceed the maximum intended load as per the manufacturer (p. 19).
- The lift must be lowered when moved & must be on level ground (p. 19).
- Escort the direct operator when moving & lowering the lift (p. 19).
- Proper body positioning when working in the lift, do not stand on rails or outside the lift under no circumstances (p. 19).
- Work area to be cautioned off with safety cones & retractable safety bars (p. 19).
- Escort & lift operators communicate with each other when moving the lift (p. 19).
- Keep work clear from tools, extension cords & materials to avoid trip hazards (p. 19).
- Use two hands when entering & leaving the lift. No jumping out of the lift (p. 19).
- Ensure loads are safely landed & secured adequately (p. 20).
- Visual/Audio contact with the operator is to be made by a Competent person (p. 20).
- Use tagline to control and guide load where necessary (p. 20).
- Housekeeping will be conducted daily throughout the work shift (p. 20).
- Remove all unused materials from the job site (p. 20).
- Wet methods used to sweep (green dust or water) to mitigate dust clouds (p. 20).

## Fall Protection Requirements

- All workers shall be protected from falls greater than 6' by a guardrail system (fall prevention) or an OSHA-compliant PFAS (Personal Fall Arrest System for Fall Protection with a climbing or rescue type helmet with chin strap and side impact protection) (p. 14).
- Proper use of portable ladders and any work done over 6' or the potential to fall more than 6' will be done with a fall arrest system in place tied off to the proper anchor (p. 15).
- Workers will wear PFAS & tie off to the dedicated anchorage point inside the lift (p. 19).
- Inspect fall protection for defects before use when being used (p. 19).

_domains: documents, contracts · elapsed: 6.4s · cacheHit: false_

---

### [sq76] ✅ answered

**Q:** What are the main hazards and controls covered in SWP-016?

**Sources:**
- `SWP 016 + Attachment.pdf`

**A:**

## Main Hazards
- (p. 2) Hazards include improper ID, invalid certifications, compromised site security, workers ill-equipped for tasks, worker strain, slips/trips/falls, facility damage, pedestrian injuries, struck-by, train traffic, electrical hazards, and cuts/scrapes/lacerations when entering the worksite.
- (p. 3) Hazards include train traffic, electrical hazards, cuts/scrapes/lacerations, and slips/trips/falls when working along the Right of Way (ROW).
- (p. 4) Hazards include electrical hazards, defective tools, eye injuries, worker strain, fall hazards, fire, spills, and slips/trips/falls when using tools, hand, and power generators, extension cords, electrical drills, and ladders.
- (p. 5) Hazards include lack of training, struck-by, caught-between, slips/trips, and non-working alarms when using an articulated boom lift.
- (p. 7) Hazards include pedestrian/employee struck-by, slips/trips/falls, cuts/scrapes/lacerations, eye injuries, worker strain, other injuries, running over materials, material falling, caught in-between, and back injury during delivery of materials, tools, and equipment unloading.
- (p. 8) Hazards include lack of communication, high winds, pinch points, caught-between, and unauthorized personnel during hoisting and lifting of the elevator enclosure.
- (p. 9) Hazards include fire, sparks, burns, exposure to welding fumes, and tool malfunction during grinding, welding, bolting, and drilling.
- (p. 11, p. 12) Hazards include hearing loss from noise exposure, slips/trips/falls, struck-by, ergonomic hazards, muscle strain, fire hazards, falls from heights, and electrical hazards.

## Main Controls
- (p. 2) Controls include daily toolbox safety meetings, 2-hour safety orientation for new hires, SWP review/sign-off, flagging arrangements, evacuation routes, onsite first aid and eyewash stations, and fire extinguishers.
- (p. 3) Controls include personnel only having foul trackage, working on platforms, or entering the ROW in the direction of MTA Flaggers, maintaining stable footing, treating 3rd rails as LIVE, attending ROW Safety Briefing, carrying non-conductive flashlights at night, taking directions from MTA Flaggers, and prohibiting cell phones/electronic devices and hoods on the ROW.
- (p. 4) Controls include inspecting tools and extension cords daily, using GFCI's with electrical tools, installing machine guards, inspecting hand/power tools before use, keeping wooden tool handles free of splinters, inspecting ladders, using three points of contact on ladders, footing or lashing ladders over 6', and using a fall arrest system for work over 6' or with potential to fall more than 6'.
- (p. 5) Controls include having a trained/qualified person operate lifts, a competent person surveying the work area, inspecting the lift before use, not exceeding maximum load, lowering the lift when moved, proper body positioning, workers wearing PFAS and tying off, cautioning off the work area, communication between escort and operator, keeping the work area clear of trip hazards, and using two hands when entering/leaving the lift.
- (p. 7) Controls include delivering materials via motor vehicle or work train, establishing a separate area for equipment with cones, using proper lifting techniques, and restricting material delivery times.
- (p. 8) Controls include the crane not moving until directed by a qualified signal person, visual/audio contact with the operator, no train service, stopping crane operations in winds exceeding 20 mph, removing deficient wire rope slings, not welding/substituting shackle pins, and checking latches, swivel bearings, locking devices, clips, and wedge sockets.
- (p. 9, p. 10) Controls include completing a hot work permit, having a fireguard present with a certificate of Fitness and fire extinguisher, inspecting ground conditions, keeping combustibles 35 ft away or covering them, certified welders wearing correct PPE, establishing a CAZ when welding at heights, positioning welding machines appropriately, and welders avoiding breathing fumes.
- (p. 11, p. 12) Controls include appropriate PPE (hard hats, safety glasses, reflective vests, safety toe boots, work gloves), specific PPE for tasks (earplugs, earmuffs, face shields, respirators), GFCI use for electrical equipment, fire extinguishers, addressing ergonomic hazards, cautioning employees about struck-by/caught-between situations, establishing work zones around machinery, having first aid kits and eyewash stations, and training for respiratory and hearing protection.

_domains: documents, contracts · elapsed: 6.1s · cacheHit: false_

---

### [sq77] ✅ answered

**Q:** In GEN-041R01 SWP-011 for Platform Concrete Demo, what PPE and respiratory protection is required for the demolition crew?

**Sources:**
- `A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform Concrete Demo.pdf`

**A:**

## Demolition Crew PPE and Respiratory Protection

-   **General PPE:** Hard hats (brim forward), safety glasses, Agency Approved Tear Away Reflective Safety Vest, safety boots (min. 6" ankle height), work gloves (as necessary) (p. 6).
-   **Fall Protection:** Guardrail system or OSHA-compliant PFAS with a climbing or rescue type helmet for falls greater than 6' (p. 7).
-   **Hearing Protection:** Required for all workers in the vicinity of demo power tools and saws (p. 9).
-   **Respiratory Protection:**
    -   Follow the approved Dust Control Plan (p. 9).
    -   Comply with site-specific APP respiratory protection plans (p. 9).
    -   Employees shall be fit-tested and trained in the use, cleaning, and storing of respirators (p. 9).
    -   All workers conducting demolition will be medically cleared and fit-tested for respiratory protection (p. 8).
    -   For painted surfaces considered to contain lead, respiratory protection is required as per lead placard protocols (p. 8).
-   **Additional PPE (as needed):** Earplugs, earmuffs, face shields, and respirators (fit test as necessary) for specific tasks (p. 6).

_domains: documents, contracts · elapsed: 2.2s · cacheHit: false_

---

### [sq78] ✅ answered

**Q:** What work activity does SWP-011 cover and what are its primary safety controls?

**Sources:**
- `A37806 SWP-011 - Platform Concrete Demo - Rev 1   6.23.25.pdf`

**A:**

## Work Activity
- (p. 1, p. 2) SWP-011 covers the demolition of platform concrete using various tools like demo saws, air chipping hammers, hand tools, ladders, power tools, and rail carts, with fire retardant tarps for containment if needed.

## Primary Safety Controls
- (p. 4) Conduct a safety toolbox meeting at the beginning of each shift to discuss activities and hazards, and review the SWP with all personnel before work starts.
- (p. 4) Ensure flagging arrangements are in place, and identify evacuation routes and muster points.
- (p. 4) Maintain an onsite first aid kit, eyewash station, and a 20lb ABC dry chemical fire extinguisher within 25 feet of the work area and 20 feet of refueling operations.
- (p. 3) Protect workers from falls greater than 6 feet with a guardrail system or an OSHA-compliant Personal Fall Arrest System (PFAS) with a climbing or rescue-type helmet.
- (p. 3) Personnel will only work along the Right of Way (ROW) or on platforms under the direction of MTA Flaggers, always treating the 3rd rail as LIVE, and maintaining stable footing.
- (p. 3) All personnel working on the ROW must attend a ROW Safety Briefing, use non-conductive instruments/tools, and are prohibited from using cell phones or wearing hoods.
- (p. 9) For work under G.O., confirm power off with the CMTA C&D Representative, and MTA flaggers will set up on track with bumper blocks and 3rd rail alarm boxes, using appropriate PPE.
- (p. 5) Use GFCI's with all electrical tools/cords, ensure machine guards are installed, and inspect hand/power tools and ladders before use.
- (p. 5) For work over 6 feet or with potential to fall more than 6 feet, use a fall arrest system tied off to a proper anchor point, and ensure trained employees wear personal fall arrest devices.
- (p. 5) All workers involved in refueling operations must have the required FDNY CoF (S93/S-94).
- (p. 6) Cordon off the area beneath the work area and have spotters/flaggers at street level for pedestrian and motor vehicle safety.
- (p. 6, p. 11) Employees must use N95 dust masks or ½-face respirators as needed, be trained, medically cleared, and fit-tested for respirators, and follow the approved Dust Control Plan.
- (p. 6, p. 11) Wear safety glasses and face shields during chopping, chipping, and grinding, and use hearing protection in the vicinity of demo power tools.
- (p. 6, p. 12) Conduct daily housekeeping throughout the work shift, and ensure all material and equipment are stored securely when no one is on site.
- (p. 7) Only trained and qualified personnel with certification can operate scissors and boom lifts, and a competent person must survey the work area for obstructions.
- (p. 7) Inspect lifts before use, ensure backup alarms and components are working, and complete daily inspection reports.
- (p. 7) Do not exceed the maximum intended load of the lift, lower the lift when moved, and ensure it is on level ground.
- (p. 7) Maintain proper body positioning in the lift, do not stand on rails or outside, and workers must wear PFAS and tie off to the dedicated anchorage point inside the lift.
- (p. 7) Caution off the work area with safety cones and retractable safety bars, and ensure escort and lift operators communicate when moving the lift.
- (p. 7) Keep the work area clear of tools, extension cords, and materials to avoid trip hazards, and use two hands when entering and leaving the lift.
- (p. 11) If visible dust is observed outside the barricaded area, stop work and correct the source of dust generation.
- (p. 11) Cut any encountered steel using a grinder, and if painted, follow lead removal procedures before cutting.
- (p. 11) In locations open to the public, establish the work area with rigid barriers to prevent exposure and separate the work area from the public.

_domains: field_ops · elapsed: 5.5s · cacheHit: false_

---

### [sq79] ✅ answered

**Q:** What work activity does SWP-032 cover and which spec section governs it?

**Sources:**
- `A37806 SWP-032- General formwork, rebar and concrete -R4.pdf`

**A:**

## Section 3.01 (swp 032 - general formwork, rebar and concrete)
- Exact indexed section text from page(s): 13, 14.

```text
Action Plan • Catastrophes, Natural
Disaster, or Human Error
• Notify C&D EIC IMMEDIATELY
• Follow EAP, Supervisors, and Safety Personnel
directives
• All incidents/accidents/Near-Misses shall be
reported to NYCT C&D Safety Immediately and
documentation (CIR and C2-F) is due within 24hrs.
• Emergency Contact numbers (manned and available 24-hours) are
posted at job sites, meeting areas, and throughout work areas
• Evacuation route identifying muster point(s)will be posted onsite (also
attached).
• Adhere to Pro -23-02 MTA C&D Notification Procedure for Significant
Unusual Events

SAFE WORK PLAN SWP - 032
SWP – 032 – General formwork, rebar and concrete– Rev. 4 6/26/26
Attachments:
1. Telehandler
2. Manlift
3. Manlift on work train. (Myrtle Ave Station plan only)
4. Fall Arrest System
NOTES:
• SWP to be amended if changes in conditions and activities occur.
• Each shift will be covered by approved CSM or CSC.
• “Per Section 01 35 10 – Construction Safety Requirements 3.01 K ‘At a minimum, the Design-Builder’s Safety Manager or its Safety Coordinators shall be present at all Work Sites
whenever physical Work is being performed.’”
• Adhere to MTA C&D policies and comply with recommendations and instructions by MTA staff.

SAFE WORK PLAN SWP - 032
SWP – 032 – General formwork, rebar and concrete– Rev. 4 6/26/26
Print Signature Date
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
13.
14.
15.
16.
17.
18.
```

_domains: documents · elapsed: 0.3s · cacheHit: false_

---

### [sq80] ✅ answered

**Q:** In the GEN-055R01 SWP-032 submittal, what review comments or conditions of approval were noted for the general formwork, rebar, and concrete safe work plan?

**Sources:**
- `A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General formwork rebar and concrete.pdf`

**A:**

## Section 3.01 (swp 032 - general formwork rebar and concrete)
- Exact indexed section text from page(s): 15, 16, 18.

```text
SAFE WORK PLAN SWP - 032
SWP – 032 – General formwork, rebar and concrete– Rev. 1 8/6/25
STEP RISK PREVENTION/MITIGATION COMMENT
concrete finishing tools when crossing behind
finishing workers.
12. Housekeeping /Clean-up • Slips/Trips/Falls
• Excess Dust
• Housekeeping will be conducted daily throughout the
work shift.
• Remove all unused materials from the job site
• See Step #1 for site access requirements.
• Wet methods used to sweep (green dust or water) to mitigate dust clouds.
13. Emergency Action Plan • Catastrophes, Natural
Disaster, or Human Error
• Notify C&D EIC IMMEDIATELY
• Follow EAP, Supervisors, and Safety Personnel
directives
• All incidents/accidents/Near-Misses shall be
reported to NYCT C&D Safety Immediately and
documentation (CIR and C2-F) is due within 24hrs.
• Emergency Contact numbers (manned and available 24-hours) are
posted at job sites, meeting areas, and throughout work areas
• Evacuation route identifying muster point(s)will be posted onsite (also
attached).
• Adhere to Pro -23-02 MTA C&D Notification Procedure for Significant
Unusual Events
NOTES:
• SWP to be amended if changes in conditions and activities occur.
• Each shift will be covered by approved CSM or CSC.
• “Per Section 01 35 10 – Construction Safety Requirements 3.01 K ‘At a minimum, the Design-Builder’s Safety Manager or its Safety Coordinators shall be present at all Work Sites
whenev

ed CSM or CSC.
• “Per Section 01 35 10 – Construction Safety Requirements 3.01 K ‘At a minimum, the Design-Builder’s Safety Manager or its Safety Coordinators shall be present at all Work Sites
whenever physical Work is being performed.’”
• Adhere to MTA C&D policies and comply with recommendations and instructions by MTA staff.

SAFE WORK PLAN SWP - 032
SWP – 032 – General formwork, rebar and concrete– Rev. 1 8/6/25
Print Signature Date
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
13.
14.
15.
16.
17.
18.

Cat. No. / No de cat.
2717-20
M18 FUEL™ 1-9/16" ROTARY HAMMERS
MARTEAU ROTATIF 40 mm (1-9/16") M18 FUEL™
40 mm (1-9/16") ROTOMARTILLOS M18 FUEL™
OPERATOR'S MANUAL
MANUEL de L'UTILISATEUR
MANUAL del OPERADOR
WARNING To reduce the risk of injury, user must read and understand operator's manual.
AVERTISSEMENT Afin de réduire le risque de blessures, l'utilisateur doit lire et bien
comprendre le manuel.
ADVERTENCIA Para reducir el riesgo de lesiones, el usuario debe leer y entender el manual.

2
GENERAL POWER TOOL
SAFETY WARNINGS
WARNING Read all safety warnings, instruc-
tions, illustrations and specifica-
tions provided with this power tool. Failure to
follow all instructions listed below may result in
electric shock, fire and/or serious injury. Save all
warnings and instructions for future reference.
The term "power tool" in the warnings refers to your
mains-operated (corded) power tool or battery-oper-
ated (cordless) power tool.
WORK AREA SAFETY
•Keep work area clean and well lit. Cluttered or dark
areas invite accidents.
•Do not operate power tools in explosive atmo-
spheres, such as in the presence of flammable
liquids, gases or dust. Power tools create sparks
which may ignite the dust or fumes.
•Keep children and bystanders away while operat-
ing a power tool. Distractions can cause you to lose
control.
ELECTRICAL SAFETY
•Power tool plugs must match the outlet. Never
modify the plug in any way. Do not use any
adapter plugs with earthed (grounded) power
tools. Unmodified plugs and matching outlets will
reduce risk of electric shock.
•Avoid body contact with earthed or grounded
surfaces, such as pipes, radiators, ranges and
refrigerators. There is an increased risk of electric
shock if your body is earthed or grounded.
•Do not expose power tools to rain or wet condi-
tions. Water entering a power tool will increase the
risk of electric shock.
•Do not abuse the

of electric
shock if your body is earthed or grounded.
•Do not expose power tools to rain or wet condi-
tions. Water entering a power tool will increase the
risk of electric shock.
•Do not abuse the cord. Never use the cord for
carrying, pulling or unplugging the power tool.
Keep cord away from heat, oil, sharp edges or
moving parts. Damaged or entangled cords increase
the risk of electric shock.
•When operating a power tool outdoors, use an
extension cord suitable for outdoor use. Use of
a cord suitable for outdoor use reduces the risk of
electric shock.
•If operating a power tool in a damp location is
unavoidable, use a ground fault circuit interrupter
(GFCI) protected supply. Use of an GFCI reduces
the risk of electric shock.
PERSONAL SAFETY
•Stay alert, watch what you are doing and use
common sense when operating a power tool. Do
not use a power tool while you are tired or under
the influence of drugs, alcohol or medication. A
moment of inattention while operating power tools
may result in serious personal injury.
•Use personal protective equipment. Always wear
eye protection. Protective equipment such as a dust
mask, non-skid safety shoes, hard hat or hearing
protection used for appropriate conditions will reduce
personal injuries.
•Prevent unintentional starting. Ensure the switch
is in the off-position before connecting to power
source and/or battery pack, picking up or

for appropriate conditions will reduce
personal injuries.
•Prevent unintentional starting. Ensure the switch
is in the off-position before connecting to power
source and/or battery pack, picking up or carrying
the tool. Carrying power tools with your finger on the
switch or energizing power tools that have the switch
on invites accidents.
•Remove any adjusting key or wrench before
turning the power tool on. A wrench or a key left
attached to a rotating part of the power tool may result
in personal injury.
•Do not overreach. Keep proper footing and bal-
ance at all times. This enables better control of the
power tool in unexpected situations.
•Dress properly. Do not wear loose clothing or
jewelry. Keep your hair and clothing away from
moving parts. Loose clothes, jewelry or long hair
can be caught in moving parts.
•If devices are provided for the connection of dust
extraction and collection facilities, ensure these
are connected and properly used. Use of dust
collection can reduce dust-related hazards.
•Do not let familiarity gained from frequent use
of tools allow you to become complacent and
ignore tool safety principles. A careless action
can cause severe injury within a fraction of a second.
POWER TOOL USE AND CARE
•Do not force the power tool. Use the correct
power tool for your application. The correct power
tool will do the job better and safer at the rate for
which it wa
```

_domains: documents · elapsed: 2.3s · cacheHit: false_

---

### [sq81] ✅ answered

**Q:** In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what barricade construction and signage requirements apply to the closed staircase?

**Sources:**
- `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf`

**A:**

## Section 3.28 (swp 052 mezzanine stair barricade)
- Exact indexed section text from page(s): 5, 6, 7.

```text
SAFE WORK PLAN SWP – 052 - BUR
SWP 052 – Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026
2. continued be permitted in the swing radius of any equipment
while the equipment is in operation
 First aid kits & eyewash station will always be
on site
 Review of NYCT zero tolerance for Drug/alcohol
& Tobacco policy
 All workers shall be protected from falls greater
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
 Electrical Hazards
 Defective tools
 Eye injuries
 Worker Strain
 Fall Hazards
 Fire
 Spills
 Slips/Trips/Falls
 Tools must have proper insulation and be inspected
daily for damage – damage tools shall be removed
from service immediately and tagged Do Not Use
 Extension cords must be inspected daily for damage,
and a proper grounding plug
 GFCI'S will be used with all electrical tools to prevent
electrical shocks, burns, or electrocution
 All machine guards shall be installed and in use as
required.
 Inspect hand & power tools before use to ensure safe
operation.
 Wooden handles of tools kept free of splinters or
cracks
 All ladders will be inspected for damage prior

ed and in use as
required.
 Inspect hand & power tools before use to ensure safe
operation.
 Wooden handles of tools kept free of splinters or
cracks
 All ladders will be inspected for damage prior to use.
Three points of contact always while ladders are in
use. All ladders over 6' will be footed or lashed. Ladder
permit and ladder inspection tag, as per the ladder
permitting program (3.28), to be used in compliance
with Division 1 01 35 10 Construction Safety
Requirements.
 Proper use of portable ladders and any work done over
6' or the potential to fall more than 6' will be done with
a fall arrest system in place tied off to the proper
anchor point. Any employee required to wear a
personal fall arrest device will have fall protection
training
 At above ground stations, Gas Placard is not required- only GPE
inspection. All GPE inspections will be performed as per the OSS GPE
Guidelines.
 20-lb (type 10A120BC) ABC fire extinguisher to be within 20-feet of any
refueling operation.
 Refueling only to be done by personnel with the FDNY CoF S93/S94
certifications.
 All handles and guards for tools will be in place.
 All tools and equipment shall be used according to manufacturers
recommendations.
6. Use of Ladders  Slip / Trips / Falls  Obtain ladder permit before start of work. (ROW
only)
- Do not use metal ladders on tracks Safety Bulletin 2005-4.- (fiberglass
Ladder

ers
recommendations.
6. Use of Ladders  Slip / Trips / Falls  Obtain ladder permit before start of work. (ROW
only)
- Do not use metal ladders on tracks Safety Bulletin 2005-4.- (fiberglass
Ladders)

SAFE WORK PLAN SWP – 052 - BUR
SWP 052 – Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026
 Use non-conductive ladder to access track from
platform
 Secure ladder with functioning rubber feet and
extends 3 feet past landing platform. For other
ladder use: fully open A frame ladders. Ensure
ladders are set up on a level and firm surface.
 Ladders will be used in accordance with
manufacturers’ labels as it relates to allowable
weights and working heights
 Face ladders when climbing and descending.
 Do not climb with materials; use hauling line. Set up
straight ladders at 4:1 ratio.
 Do not separate sections of extension ladders.
 Ladders must have manufacturers rating label
clearly legible and visible.
 Ladders to be clearly marked with company name.
- Safety Advisory 19-02: Ladder Safety
 - Ladder Inspections Logs will be available as per request
7. Working in Hot
Weather/Cold Weather
iojopko
 Heat Stress, Heat
Exhaustion, Heat
Stroke
 Hypothermia, Frostbite
 Cold water shall be provided. Loose-fitting and light-
colored clothing is recommended. Workers shall
take breaks throughout the day as necessary in
extreme temperatures
 Select proper clothing for cold, wet, and windy
conditions. Layer clothing to adjust to changing
environmental temperatures. Wear a hat and
gloves, in addition to underwear that will keep
water away from the sk

per clothing for cold, wet, and windy
conditions. Layer clothing to adjust to changing
environmental temperatures. Wear a hat and
gloves, in addition to underwear that will keep
water away from the skin (polypropylene).
 Drink warm, sweet beverages (sugar water, sports-
type drinks). Avoid drinks with caffeine (coffee, tea,
 or hot chocolate).
 Heat Stroke is a true medical emergency, call 911.
 Hypothermia is a true medical emergency, call 911
8. Delivery of materials,
tools, and equipment
unloading.
 Pedestrian/Employee Struck-
By
 Slips, Trips & Falls
 Cuts, Scrapes, Lacerations
 Eye injuries
 Worker Strain
 Other injuries
 Running over materials
 Material falling
 Caught in-between
 Back Injury
 All materials will be delivered to the site via motor
vehicle at the station Entrance or work train. NYCT
SAFETY BULLETIN 2000-2- Movement cable reels
and other large items via station stairways during
deliveries onto transit property.
 Before starting work, a separate area will be
established to place equipment, which will not be
placed in an area that will impede the safety of
pedestrians or workers at the site. This will be done
with the use of lollipop/safety cones and cone toppers.
- All employees use proper lifting techniques to avoid
 See step #1 above regarding PPE requirements.
 MPT set-ups will be in place prior to any movement of equipment.
 All mater

and cone toppers.
- All employees use proper lifting techniques to avoid
 See step #1 above regarding PPE requirements.
 MPT set-ups will be in place prior to any movement of equipment.
 All material deliveries will be communicated to the PMC at least 24-hours
prior.

SAFE WORK PLAN SWP – 052 - BUR
SWP 052 – Installation & Removal of Mezzanine Stair Barricades - Burnside Rev. 0 02/12/2026
muscle strains. Sensible lifting anything over 50 pounds,
use the buddy system.
9. Installation of Platform
Barrier
9. continued
 See Item #’s 1 & 2
 Laceration
 Property Damage
 Struck By/Flying Objects
 Ladder Safety
 Improper construction of
platform barriers
● See attached Stair Barricade Plans
● Barriers will be constructed in accordance with
OSS guidelines for temporary subway barriers
latest revision. The barrier will be inspected daily
before and after work takes place. Lockable,
inward swinging doors will be installed if
applicable. The door must be self- closing via
spring hinge.
● All ladders will be inspected for damage prior to
use. Three points of contact at all times while
ladders are in use. All ladders over 6’ will be
footed or lashed.
● Proper use of portable ladders and any work done over
6’ or the potential to fall more than 6’ will be done with
a fall arrest system in place tied off to the proper anchor
point.
● Use proper lifting techniques
 Work zones with materials shall be delineated so as
to protect the public and all other personnel.
● See Item #’s 1 & 2
● Plywood used will be fire retardant. Fire retardant stamp to remain
visible (will be kept on inside of the barrier) and will not be painted over
so stamp remains visible
```

_domains: documents · elapsed: 0.2s · cacheHit: false_

---

### [sq82] ✅ answered

**Q:** In GEN-116R00 SWP-052 for Mezzanine Stair Barricade at Burnside, what fire watch and hot work precautions are specified?

**Sources:**
- `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine Stair Barricade.pdf`

**A:**

## Fire Watch and Hot Work Precautions

- The document does not specify fire watch or hot work precautions.
- Fire hazards are listed as a general worker protection concern (p. 5).
- Fire retardant (stamped) plywood is specified for barrier construction (p. 1, 3).

Next step: Request an updated SWP-052 that includes specific fire watch and hot work procedures, if applicable to the scope.

_domains: documents · elapsed: 12.1s · cacheHit: false_

---

### [sq83] ✅ answered

**Q:** In GEN-021R00 Safety Coordinator submittal for Diego Gonzalez, what qualifications, certifications, and experience are listed for the safety coordinator?

**Sources:**
- `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf`

**A:**

## Diego Gonzalez Safety Coordinator Qualifications

- **Experience:** Over 13 years in construction and environmental safety (p. 5).
- **Work Experience:** Site Safety Representative (6/2015-Present), Project Monitor, Air Technician, Safety Technician (11/2009-3/2014) (p. 5, 7).
- **Education:** A.A.S. Degree from City College of New York (p. 5).
- **Certifications & Training:**
    - NYC DOB 40 Hr. Site Safety Manager (p. 5)
    - OSHA 30 Hr. Construction (p. 5)
    - Supervisor of De-leading of Industrial Structure (C-5) (p. 5)
    - 32-hour Scaffolding (NYCDOB) (p. 5)
    - 32-Hour Suspended Scaffold Supervisor (p. 5)
    - Construction Site Fire Safety Manager (p. 5)
    - Track Safety Training (p. 5)
    - CPR/First Aid (p. 5)
    - OSHA 40 Hr. HAZWOPER (p. 5)
    - Confined Space Entry Training (p. 5)
    - Metro North Track Training (p. 5)
    - Staten Island Railroad (p. 5)
    - Asbestos Inspector (p. 5)
- **Missing Certifications (Revise and Resubmit):**
    - American Society of Safety Professionals certification (p. 1, 6)
    - State of New York Department of Labor Asbestos Certificate (p. 1, 6)

_domains: field_ops, documents · elapsed: 2.6s · cacheHit: false_

---

### [sq84] ✅ answered

**Q:** What role and reporting relationship does the GEN-021R00 Safety Coordinator submittal establish?

**Sources:**
- `A37806_01 35 10_GEN-021R00 - R&R - Safety Coordinator - Diego Gonzalez.pdf`

**A:**

## Safety Coordinator Role and Reporting

-   **Role:** Safety Coordinator, 100% safety-related (p. 6).
-   **Responsibilities:** Review APP/EHASP, HAZCOM Program, conduct safety orientations, review SDS, ensure SWP/JHA adherence to OSHA 1926, DOB CH 33, FDNY, NYCT SPEC 1S, develop safety work plans, establish compliance, perform worksite assessments, conduct weekly safety meetings and Toolbox Talks, provide daily safety reports, conduct emergency evacuation drills, inspect PPE, conduct accident/incident investigations, ensure track safety regulations (p. 6).
-   **Reporting Relationship:** Provides daily safety reports to the on-site project manager (p. 6).
-   **Oversight:** This submittal was reviewed by the Project Manager, Quality Manager, and Safety Manager (Michael Colletti) to certify contract requirements (p. 4).

_domains: field_ops, documents · elapsed: 1.7s · cacheHit: false_

---

### [sq85] ⚠️ not found

**Q:** In the Schedule Update 5 June 2025, what is the critical path and which activities have the least float?

**Sources:**
- `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf`

**A:**

## Critical Path
- (p. 5) The critical path for the project is detailed in Appendix A-2.
- (p. 5) For Myrtle Ave, the critical path involves communication relocation at the platform level, followed by bulletin submission, platform preparation for new steel, overpass erection with platform elevators, and elevator enclosure installation.
- (p. 6) For Middletown, the critical path follows the long lead electrical design unit to the submission and fabrication of long lead panels, followed by station and EDR room upgrades and elevator commissioning.
- (p. 7) For Burnside, the critical path starts with extensive relocation of trunk mains conflicting with the north headhouse, then utilities at the south side of the street, sewer, and south water main, allowing for south headhouse and J4 bypass to begin.
- (p. 7) For Norwood Ave, the critical path begins with utility relocations at the street that conflict with the headhouse, followed by headhouse structure construction, and then elevator construction and commissioning.
- (p. 7) For Avenue I, the critical path starts with utility relocations at McDonald Ave, then 20th Ave, followed by structure construction, standing seam roof and enclosures, and then elevator and EMR room installation.

## Least Float Activities
- Could not verify least float activities in the retrieved passages.

_domains: scheduling · elapsed: 4.6s · cacheHit: false_

---

### [sq86] ✅ answered

**Q:** In the Schedule Update 5 June 2025, what are the planned start and finish dates for the Myrtle Avenue elevator enclosure activities?

**Sources:**
- `A37806_01 32 10_GEN-032R00 - ORIG - Schedule Update 5 - June 2025.pdf`

**A:**

## Myrtle Avenue Elevator Enclosure
- (p. 8) The Myrtle Avenue Elevator EL 1120 activity is planned to start on May 21, 2026, and finish on September 8, 2026.
- (p. 35) The EDU04 Elevator Enclosure Procurement activity is planned to start on July 1, 2025, and finish on September 18, 2025.

_domains: documents, contracts · elapsed: 3.7s · cacheHit: false_

---

### [sq87] ✅ answered

**Q:** In spec section 21 12 00 for Fire-Suppression Standpipes, what materials and pressure ratings are required for standpipe piping and fittings?

**Sources:**
- `21 12 00 - Fire-Suppression Standpipes REV 1.pdf`

**A:**

## Section 2.11 Requirements Summary (21 12 00 - fire-suppression standpipes rev 1)
- Reviewed indexed section evidence from page(s): 1, 2, 3, 4, 6.
- Key requirements captured from the section:
- FIRE DEPARTMENT CONNECTIONS [p.6] 2.12 PIPE HANGERS AND SUPPORTS [p.6] 3.3 INSTALLATION [p.9] 3.4 CLEAN UP [p.11] 3.5 TESTING [p.12].
- Section 01 33 00 Submittal Procedures 1.3 CITED STANDARDS Unless otherwise noted, the latest edition of the following codes and standards shall govern this work.
- 393 – Standard Specification Indicating Pressure Gauges for Fire- Protection Service 7.
- ANSI/ AWWA A21.51/ C151 – Ductile-Iron Pipe, Centrifugally Cast for Water 4.
- A865 – Standard Specification for Threaded Couplings, Steel, Black or Zinc-Coated (Galvanized) Welded or Seamless G.
- E list of all components, make, manufacturer, telephone number of local vendor H.
- Lugged swivel connection and drop clappers for each hose connection inlet.

### 2.11.1. Submittals
- ADA UPGRADES PACKAGE 6 21 12 00 – 1 CONTRACT NO: A37806 FINAL SUBMISSION REV 1 January 14, 2026 SECTION – 21 12 00 FIRE-SUPPRESSION STANDPIPES PART 1 – GENERAL 1.1 SUMMARY The Contractor shall furnish all labor, materials, tools and equipment, and perform a...
- The Work shall include but not be limited to the following: A.
- Addition of new standpipe piping and fire hose valves for new control areas.
- B.
- Modification of existing standpipe system to avoid new structures.
- C.
- Underwriters Laboratories (UL) 3.
- SECTION – 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 – 2 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 3.
- Ction Use 10.
- SECTION – 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 – 3 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 1.4 SUBMITTALS A.
- E list of all components, make, manufacturer, telephone number of local vendor H.
- SECTION – 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 – 4 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 THIS SPACE IS LEFT BLANK INTENTIONALLY.
- Gregate, and four parts of approved coarse aggregate.

Evidence: 21 12 00 - fire-suppression standpipes rev 1 (p. 1, 2, 3).

_domains: documents · elapsed: 0.4s · cacheHit: false_

---

### [sq88] ✅ answered

**Q:** In spec section 21 12 00 for Fire-Suppression Standpipes, what testing and flushing requirements apply before the system is placed in service?

**Sources:**
- `21 12 00 - Fire-Suppression Standpipes REV 1.pdf`

**A:**

## Section 2.11 Requirements Summary (21 12 00 - fire-suppression standpipes rev 1)
- Reviewed indexed section evidence from page(s): 1, 2, 3, 6.
- Key requirements captured from the section:
- FIRE DEPARTMENT CONNECTIONS [p.6] 2.12 PIPE HANGERS AND SUPPORTS [p.6] 3.3 INSTALLATION [p.9] 3.4 CLEAN UP [p.11] 3.5 TESTING [p.12].
- Section 01 33 00 Submittal Procedures 1.3 CITED STANDARDS Unless otherwise noted, the latest edition of the following codes and standards shall govern this work.
- 393 – Standard Specification Indicating Pressure Gauges for Fire- Protection Service 7.
- ANSI/ AWWA A21.51/ C151 – Ductile-Iron Pipe, Centrifugally Cast for Water 4.
- A865 – Standard Specification for Threaded Couplings, Steel, Black or Zinc-Coated (Galvanized) Welded or Seamless G.
- E list of all components, make, manufacturer, telephone number of local vendor H.
- Lugged swivel connection and drop clappers for each hose connection inlet.

### 2.11.1. Submittals
- ADA UPGRADES PACKAGE 6 21 12 00 – 1 CONTRACT NO: A37806 FINAL SUBMISSION REV 1 January 14, 2026 SECTION – 21 12 00 FIRE-SUPPRESSION STANDPIPES PART 1 – GENERAL 1.1 SUMMARY The Contractor shall furnish all labor, materials, tools and equipment, and perform a...
- The Work shall include but not be limited to the following: A.
- Addition of new standpipe piping and fire hose valves for new control areas.
- B.
- Modification of existing standpipe system to avoid new structures.
- C.
- Underwriters Laboratories (UL) 3.
- SECTION – 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 – 2 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 3.
- Ction Use 10.
- SECTION – 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 – 3 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 1.4 SUBMITTALS A.
- E list of all components, make, manufacturer, telephone number of local vendor H.
- SECTION – 21 12 00 FIRE-SUPPRESSION STANDPIPES ADA UPGRADES PACKAGE 6 21 12 00 – 4 CONTRACT NOTE: A37806 FINAL SUBMISSION REV 1 January 14, 2026 THIS SPACE IS LEFT BLANK INTENTIONALLY.
- Gregate, and four parts of approved coarse aggregate.

Evidence: 21 12 00 - fire-suppression standpipes rev 1 (p. 1, 2, 3).

_domains: documents · elapsed: 0.3s · cacheHit: false_

---

### [sq89] ✅ answered

**Q:** In BUR-042R01 EDU07 SOGR at Burnside Avenue, what surface preparation and painting system is specified for structural steel?

**Sources:**
- `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue_Redline.pdf`

**A:**

## Structural Steel Surface Preparation and Painting System

- Existing corroded structural steel and/or connections exposed by new construction shall be repaired or replaced as required (p. 6).
- Paint shall be scraped or wire-brushed to remove peeling and cleaned of rust to bright finish down to sound metal (p. 6).
- Repair designs shall provide all requirements for complete repair of member to a state of good repair, including surface preparations, surface treatments, and protective coatings (p. 6).
- The completed repair scope shall meet requirements of member to a state of good repair, including surface preparations and surface sealants and protective coatings (p. 12, 52, 53, 54).

_domains: documents · elapsed: 4.4s · cacheHit: false_

---

### [sq90] ✅ answered

**Q:** In BUR-042R01 EDU07 SOGR at Burnside Avenue, what concrete repair materials and crack repair methods are specified?

**Sources:**
- `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) - SOGR at Burnside Avenue_Redline.pdf`

**A:**

## Concrete Repair Materials and Methods

- **Concrete Replacement/Patching:** Includes materials, surface preparations, additional reinforcement, placement, finishing, and curing (p. 12, 52, 53, 54, 55, 56).
- **Corrosion Inhibitors:** Required for concrete repairs (p. 12, 52, 53, 54, 55, 56).
- **Stud Connections:** Part of concrete repair scope (p. 12, 52, 53, 54, 55, 56).
- **Crack Grouting or Sealing:** Specified method for crack repair (p. 12, 52, 53, 54, 55, 56).
- **Surface Sealants and Protective Coatings:** Required for each location (p. 12, 52, 53, 54, 55, 56).
- **Grouting Injection or Access Holes:** Shall be repaired as part of the work (p. 12, 52, 53, 54, 55, 56).
- **Rebar Exposure Repair:** Contractor shall remove concrete to 1" minimum behind reinforcement (p. 12, 52, 53, 54, 55, 56).
- **Minimum Cover:** Repairs must provide the minimum cover required to the rebars (p. 12, 52, 53, 54, 55, 56).
- **Repair Methodology:** Contractor to provide repair methodology and sequence of steps, including temporary shoring (p. 12, 52, 53, 54, 55, 56).

_domains: documents · elapsed: 3.2s · cacheHit: false_

---

### [sq91] ✅ answered

**Q:** In Transmittal 212-NOR for the Norwood Avenue transfer girder inspection, what documents or reports were enclosed and what response is requested?

**Sources:**
- `Transmittal 212-NOR Xfer Girder inspection.pdf`

**A:**

## Transmittal 212-NOR Enclosures and Requested Response

- **Enclosed Documents:**
    - A37806 ADA P6- Submittal Certification - NOR XFER GIRDER INSPECTION REPORT (p. 1)
    - ADA_P6-Norwood Av_Transfer Girder Field Report dated 03/30/2026 (p. 1)
- **Requested Response:** Approval (p. 1)

_domains: documents, field_ops · elapsed: 3.1s · cacheHit: false_

---

### [sq92] ✅ answered

**Q:** In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what defects or structural conditions were observed during the sewer inspection?

**Sources:**
- `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf`

**A:**

## Sewer Inspection Defects

- The 12-inch VCP combined sewer from M3071513 to M3083356 is in poor condition with a visible void and heavy grease (p. 2).
- The 12-inch VCP combined sewer from M3083356 to M3083358 is in fair condition with heavy grease (p. 2).

_domains: field_ops, documents · elapsed: 1.1s · cacheHit: false_

---

### [sq93] ✅ answered

**Q:** In NOR-010R00 Norwood Avenue CCTV Inspection Findings, what remediation or repair recommendations are made for the inspected sewer segments?

**Sources:**
- `A37806_33 14 15_NOR-010R00 - RWNC - Norwood Ave CCTV Inspection Findings 11-20-2025 PMC REVIEW.pdf`

**A:**

## Sewer Remediation Recommendations

- **Segment M3071513 to M3083356:** Remediation required due to poor condition, visible void, and heavy grease accumulation.
- **Segment M3083356 to M3083358:** Cleaning recommended to address heavy grease accumulation.

_domains: documents, field_ops · elapsed: 1.1s · cacheHit: false_

---

### [sq94] ⚠️ not found

**Q:** In the EDU05B Electrical Long Lead submittal for Norwood Avenue Station, which long-lead electrical equipment items are identified and what are their procurement lead times?

**Sources:**
- `A37806_01 10 20_MYR-082R00 - AEAN - EDU05B (RFCD) - Long Lead Electrical for Myrtle Avenue.pdf`

**A:**

## Long-Lead Electrical Equipment
- (p. 3, 4, 12) The EDU05B Long Lead Electrical Equipment Procurement for Myrtle Avenue Station is a submittal for Release For Construction Documents (RFCDs).
- (p. 6) Long-lead electrical equipment identified for Myrtle Avenue Station includes: 800A Distribution Board, Con Ed Trans S - Combo CT + Meter + 800A Bolted Pressure Service Switch (w/ Class L Fuses), 200A Generator Connection Box, 400A Distribution Panel (DP-EMR-1), 100A Lighting Panel (LP-1,2,3), 30A Fire Alarm Fused Disconnect Switch, and Light fixtures.

## Procurement Lead Times
- Could not verify procurement lead times in the retrieved passages.

_domains: documents · elapsed: 1.7s · cacheHit: false_

---

### [sq95] ✅ answered

**Q:** In the EDU05B Electrical Long Lead submittal, what voltage and phase ratings are specified for the panels in the load schedule?

**Sources:**
- `EDU05B RFCD - AAN - Electrical Long Lead.pdf`

**A:**

## Panel Voltage and Phase Ratings

- **LP-1:** 120/208V, 3-phase, 4-wire (p. 19)
- **DP-EMR-1:** 120/208V, 3-phase, 4-wire, 65kA (p. 19, 23)
- **DBN:** 120/208V, 3-phase, 4-wire, 100kA (p. 19)
- **DBN-1:** 120/208V, 3-phase, 4-wire, 100kA (p. 23)

_domains: documents · elapsed: 1.5s · cacheHit: false_

---

### [sq96] ✅ answered

**Q:** In GEN-014R00 Monthly Quality and Certification Report for May 2025, what nonconformances or corrective actions are recorded for the reporting period?

**Sources:**
- `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf`

**A:**

## Nonconformances and Corrective Actions (May 2025)
- No non-conformances recorded (p. 4).
- No corrective actions recorded (p. 4).

_domains: contracts · elapsed: 1.0s · cacheHit: false_

---

### [sq97] ✅ answered

**Q:** In GEN-014R00 Monthly Quality and Certification Report for May 2025, who prepared and certified the report and what period does it cover?

**Sources:**
- `A37806_01 40 10_GEN-014R00 - R&R - Monthly Quality and Certification Report- May 2025.pdf`

**A:**

## Report Preparation and Certification

- **Prepared By:** Nabeel Anjum, Project Quality Manager (p. 4)
- **Date Prepared:** June 3, 2025 (p. 4)
- **Report Period:** May 2025 (p. 4)

_domains: documents, contracts · elapsed: 1.0s · cacheHit: false_

---

### [sq98] ✅ answered

**Q:** In the PRDC12-019R00 SikaGrout 212 product submittal, what mixing ratios and cure times are specified for the grout?

**Sources:**
- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

**A:**

## SikaGrout 212 Mixing and Curing

- **Mixing Ratios:**
    - Water is added in recommended proportion to powder.
    - Mix thoroughly for 3 minutes with a low-speed hand drill mixer (< 500 rpm) until homogenous and lump-free (p. 21).
    - For deeper applications (plastic and flowable consistency only), 25 lbs. of 3/8" (9.5 mm) coarse aggregate can be added (p. 21).
    - Aggregate must be non-reactive (ASTM C-1260, C-227, C-289), clean, well-graded, saturated surface dry, low absorption, high density, and comply with ASTM C-33 size number 8 (p. 21).
    - Add pea gravel after water and SikaGrout-212 (p. 21).
- **Cure Times:**
    - Wet cure for a minimum of 3 days (p. 21).
    - Alternatively, apply a curing compound complying with ASTM C-309 on exposed surfaces (p. 21).

_domains: documents · elapsed: 2.0s · cacheHit: false_

---

### [sq99] ✅ answered

**Q:** In the PRDC12-019R00 SikaGrout 212 product submittal, what shelf life and storage conditions are required for the product?

**Sources:**
- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

**A:**

## SikaGrout 212 Shelf Life and Storage

-   **Shelf Life:** 12 months from date of production (p. 19).
-   **Storage Conditions:** Store dry at 40–95 °F (4–35 °C) in original, unopened, and undamaged sealed packaging (p. 19).
-   **Protection:** Protect from moisture; discard if damp (p. 19).
-   **General:** Keep in a well-ventilated, dry place, observe label precautions, and store in accordance with local regulations (p. 11).

_domains: documents · elapsed: 3.8s · cacheHit: false_

---

### [sq100] ✅ answered

**Q:** In the PRDC12-012R02 Lead Placard Package for Burnside, what air monitoring and worker protection requirements apply to the lead abatement work?

**Sources:**
- `A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burnside.pdf`

**A:**

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

_domains: documents · elapsed: 0.5s · cacheHit: false_

---

### [sq101] ✅ answered

**Q:** In PRDC12-012R02 Lead Placard Package for Burnside, what regulatory notifications and posting requirements apply before lead abatement begins?

**Sources:**
- `A37806_PRDC12-012R00 - ORIG - Lead Placard Package-Burnside.pdf`

**A:**

## Section 360.8 (a37806 prdc12-012r00 - orig - lead placard package-burnside)
- Exact indexed section text from page(s): 36, 37, 38, 39.

```text
LEAD DISTURBANCE PLACARD PACKAGE REV #
0
BURNSIDE AVENUE STATION
CONTRACT A37806 DESIGN-BUILD SERVICES FOR ADA UPGRADES
PACKAGE 6: ACCESSIBILITY UPGRADES AT FIVE STATIONS
ITEM #5
EMERGENCY RESPONSE AND
NOTIFICATION PLAN

EMERGENCY RESPONSE AND CONTINGENCY PLAN REV #
1
CONTRACT A37806
DESIGN-BUILD SERVICES FOR ADA UPGRADES PACKAGE 6:
ACCESSIBILITY UPGRADES AT FIVE STATIONS
1
EMERGENCY RESPONSE AND CONTINGENCY PLAN
Overview
The purpose of this contingency plan is to minimize hazards to human health or the environment
resulting from fires, explosions, or releases of hazardous waste to air, soil or surface water, in
accordance with New York State regulations contained in NYCRR, Part 360.8 (c)(3).
This section describes contingencies and emergency planning procedures to be implemented at the
site. This plan is compatible with local, State and federal disaster and emergency management plans
as appropriate and will be coordinated with local authorities. In addition, a meeting or other
communication with local hospital will occur so as to advise the emergency room of the nature and
type of contaminants victims may have been exposed to while on site, in the event they are transported
to the hospital. Directions to the hospital will be posted on site and a copy will be placed in all site
vehicles when this contingency plan is in effect. Emergency procedures will be posted.
This project involves the removal/disturbance of hazardous, nonhazardous, and/or universal wastes
(including but not limited to existing paint, soil) at the following locations:
Station Trains Division Borough Type
1 Norwood Av

disturbance of hazardous, nonhazardous, and/or universal wastes
(including but not limited to existing paint, soil) at the following locations:
Station Trains Division Borough Type
1 Norwood Av J, Z BMT-Jamaica Brooklyn Elevated
2 Myrtle Av J, M, Z BMT-Jamaica Brooklyn Elevated
3 Avenue I F IND-Culver Line Brooklyn Elevated
4 Burnside Av 4 IRT-Jerome Ave Bronx Elevated
5 Middletown Road 6 IRT-Pelham Line Bronx Elevated
Pre-Emergency Planning
The Safety Engineer/Emergency Coordinator (identified as MLJTC2 Safety Manager Thomas Buchta,
phone # 929-969-7651), or a designated representative, will establish a line of communications with
local hospitals, government agencies and other emergency response organizations prior to site
activities. During the site briefings held periodically, all employees will be trained in and remained of
provisions of the emergency response plan, communication systems and evacuation routes. The plan
will be reviewed and revised, if necessary, on a regular basis by the Safety Engineer. This will ensure
that the plan is adequate and consistent with prevailing site conditions.
Lines of Authority

EMERGENCY RESPONSE AND CONTINGENCY PLAN REV #
1
CONTRACT A37806
DESIGN-BUILD SERVICES FOR ADA UPGRADES PACKAGE 6:
ACCESSIBILITY UPGRADES AT FIVE STATIONS
2
The Safety Engineer will have primary responsibility for responding to and correcting emergency
situations. This includes taking appropriate measures to ensure the safety of site personnel and the
public. Possible actions may involve evacuation of adjacent personnel. Additionally, he is responsible
for ensuring that corrective measures have been implemented, appropriate authorities notified, and
follow up reports completed.
Emergency Prevention
Personnel will be familiar with techniques of hazard recognition from pre-assignment training and
site-specific briefings. The Safety Engineer is responsible for ensuring that prevention devices or
equipment (two-way radio, mobile phone, emergency vehicles, directions to hospital, emergency
phone numbers, etc.) are available to personnel.
Evacuation Routes and Procedures
If a worker discovers a fire, chemical spill or release, or other process upset necessitating emergency
action, he or she will immediately notify the Safety Engineer, or his or her supervisor. An immediate
decision will be made as to whether to evacuate the site or other actions to be taken. The Safety
Engineer is primarily responsible for this decision.
The primary response to any emergency will be to protect the he

be made as to whether to evacuate the site or other actions to be taken. The Safety
Engineer is primarily responsible for this decision.
The primary response to any emergency will be to protect the health and safety of employees,
contractors, subcontractors and visitors on-site, as well as the community and environment. Steps will
be taken to identify, contain, treat, and properly dispose of the materials involved as a secondary
response.
In the event of an emergency, which necessitates an evacuation of the site, the following alarm
procedures will be implemented:
When notified to evacuate, all personnel will be expected to proceed to the closest site exit and
mobilize to the safe distance area associated with the evacuation route. Personnel will remain at that
area until instructions are received from the Safety Engineer or an authorized individual (member of
Emergency response agency), provides further instructions.
In general, employees should proceed to a designated location that is upwind and uphill from the site
or location of the incident, unless otherwise instructed by supervisory personnel.
At the time of an emergency egress from the site, all workers and other site personnel will be directed
to an upwind assembly point for a head count by the Safety Engineer and/or Project Manager.

EMERGENCY RESPONSE AND CONTINGENCY PLAN REV #
1
CONTRACT A37806
DESIGN-BUILD SERVICES FOR ADA UPGRADES PACKAGE 6:
ACCESSIBILITY UPGRADES AT FIVE STATIONS
3
In case of an emergency while working in the containment, the employees will use box cutters and cut
a hole through the containment tarps. The box cutters will be distributed before entering the
containment.
Emergency Contracts/Notification System
Emergency Contact List
Fire/Police/Ambulance 911
NYSDEC Spill Hotline 800-457-7362
Poison Control (212) 764-7667
One Call Before You Dig 811
Rail Control Center (212) 712-4111/4211/4311
Power Control Center (212) 424-4700
Homeland Security (202) 282-8000
NYCT DOS Command Center (718) 243-4211
NYCDEP (718) 337-4357
CHEMTREC – Chemical
Transportation for Spills/Fire (800) 424-9300
Mayor’s Office of Emergency
Management (888) 663-6692
National Response Center
(Chemical Release) (800) 424-8802
USEPA (212) 637-4106
FDNY Brooklyn 718-999-4444
Avenue I – FDNY Battalion 43 (718) 616-5551 2698 E 6th St, Brooklyn, NY
Mrytle – FDNY Battalion 57 (718) 999-2000 206 Monroe St, Brooklyn, NY
Norwood – FDNY Battalion 39 (718) 385-7345 799 Lincoln Ave, Brooklyn, NY
FDNY Bronx 718-999-3333
Middletown Road – FDNY
Battalion 20 (718) 918-3918 1518 Williamsbridge Rd, Bronx, NY
Burnside – FDNY Battalion 19 (718) 933-1974 2285 Jerome Ave, Bronx, NY
Mount Sinai Hospital Brooklyn
(Avenue

3333
Middletown Road – FDNY
Battalion 20 (718) 918-3918 1518 Williamsbridge Rd, Bronx, NY
Burnside – FDNY Battalion 19 (718) 933-1974 2285 Jerome Ave, Bronx, NY
Mount Sinai Hospital Brooklyn
(Avenue I) (718) 252-3000 3201 Kings Hwy, Brooklyn, NY
NYC Health + Hospitals/Woodhull
(Myrtle) (718) 963-8000 760 Broadway, Brooklyn, NY
Queens Hospital Center
(Norwood) (718) 883-3000 82-68 164th St, Jamaica, NY
```

_domains: documents · elapsed: 2.7s · cacheHit: false_

---

### [sq102] ✅ answered

**Q:** In PRDC12-019R00 SikaGrout 212 product submittal, what yield per unit and application thickness range are listed in the product data?

**Sources:**
- `A37806_PRDC12-019R00 - APP - SikaGrout 212.pdf`

**A:**

## SikaGrout 212 Product Data

- **Yield per unit:** Not specified in the provided context.
- **Application thickness range:** Not specified in the provided context.

Evidence: a37806 prdc12-019r00 - app - sikagrout 212 (p. 1, 5, 17).

_domains: documents · elapsed: 4.8s · cacheHit: false_

---

