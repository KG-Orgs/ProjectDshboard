# Project Domain Context

## Purpose

This file provides standing domain knowledge the AI assistant should apply across all capabilities. It covers project identity, document identifier types, approval statuses and workflows, CSI MasterFormat structure, party roles, construction abbreviations, common PM question patterns, file naming conventions, and specification/drawing disambiguation.

**This file is scoped to a single active project.**

Load this file whenever the user asks a question involving a document identifier, document type, specification section, project role, or construction workflow.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Contract Number** | A37806 |
| **Project Name** | Design-Build Services for Accessibility Upgrades — Package 6 |
| **Owner** | MTA (Metropolitan Transportation Authority) |
| **Project Type** | ADA accessibility upgrades at five subway / rail stations |
| **Delivery Method** | Design-Build |

### Stations in Scope

Each station has a two- or three-letter prefix used in document numbers and filenames. Always match a station prefix to the correct station name.

| Prefix | Station Name | Notes |
|--------|-------------|-------|
| **BUR** | Burnside Ave Station | |
| **MYR** | Myrtle Ave Station | |
| **AVI** | Avenue I Station | |
| **MDT** | Middletown Rd. Station | |
| **NOR** | Norwood Ave Station | |

**Platform direction abbreviations:**
- **NB** = Northbound Platform
- **SB** = Southbound Platform

When a user asks about a station, resolve the abbreviated prefix to the full station name and vice versa (e.g., "the MDT submittal" = "the Middletown Rd. Station submittal").

---

## 2. Document Identifier Types (Project Control Numbers)

These prefixes are used to number all controlled project documents. Users will reference them directly in questions (e.g., "What does QWP-005 say?" or "Is DRFI-0047 still open?").

### Work Plan and Quality Documents

| Prefix | Full Name | Description | Approval Chain |
|--------|-----------|-------------|----------------|
| **QWP** | Quality Work Plan | Activity-specific quality plans defining hold points, inspection requirements, and acceptance criteria for a defined work scope | Contractor QM → CM / MTA |
| **SWP** | Safety Work Plan | Activity-level safety plans addressing hazards, required controls, and PPE | Contractor QM → CM / MTA |
| **CWP** | Construction Work Plan | Method statements describing planned construction approach, sequence, equipment, and resources | Contractor QM → CM / MTA |

### Design and Contract Documents

| Prefix | Full Name | Description | Approval Chain |
|--------|-----------|-------------|----------------|
| **RFI** | Request for Information | Contractor-originated request to EOR/AECOM or MTA for clarification, interpretation, or direction on the contract documents | Contractor → EOR (AECOM) → CM / MTA receives as FIO |
| **DRFI** | Design Request for Information | Designer/EOR-originated (AECOM) clarification or supplemental instruction issued to the contractor; direction flows from designer to contractor | EOR (AECOM) → Contractor |
| **NCR** | Non-Conformance Report | Formal record of work or material that does not meet contract requirements; triggers a corrective action response | Contractor QM → CM / MTA |
| **CO** | Change Order | Fully executed contract modification changing scope, price, or schedule; signed by both parties | Executed — no further routing needed |
| **MOD** | Modification | Contract modification; used interchangeably with CO on this project | Executed |
| **PCO** | Potential Change Order | Unpriced or unapproved change event being tracked before formal CO execution | Under negotiation |

### Submittal Documents

| Prefix | Full Name | Description | Approval Chain |
|--------|-----------|-------------|----------------|
| **GEN** | General Submittal | Product data, shop drawings, certifications, and other submittals not under a station-specific prefix | Contractor QM → EOR (AECOM) reviews → CM / MTA receives as FIO |
| **BUR** | Burnside Ave Submittal | Station-specific submittals for Burnside Ave Station | Same as GEN |
| **MYR** | Myrtle Ave Submittal | Station-specific submittals for Myrtle Ave Station | Same as GEN |
| **AVI** | Avenue I Submittal | Station-specific submittals for Avenue I Station | Same as GEN |
| **MDT** | Middletown Rd. Submittal | Station-specific submittals for Middletown Rd. Station | Same as GEN |
| **NOR** | Norwood Ave Submittal | Station-specific submittals for Norwood Ave Station | Same as GEN |

### Design and Reference Documents

| Prefix | Full Name | Description |
|--------|-----------|-------------|
| **PRDC** | Project Requirements and Design Criteria | Owner-issued design criteria and project-specific technical requirements; governs conflicts with the specification |
| **DU** | Drawing Update | Revised drawing issued after contract award to clarify or correct the original design |
| **EDU** | Engineering Drawing Update | AECOM-issued engineering drawing revision carrying a higher engineering review level than a DU |

### Identifier Normalization

When a user writes an identifier, these variations all refer to the same document:
- `QWP-005`, `QWP 5`, `QWP05` → canonical: `QWP5`
- `RFI-063`, `RFI 63`, `RFI063` → canonical: `RFI63`
- `GEN-023R00` → canonical: `GEN023R00`
- `BUR-012R01` → canonical: `BUR012R01`
- `03 30 00`, `033000` → same CSI section

---

## 3. Document Approval Statuses and Workflow

### Approval Chains by Document Type

**Standard Submittals (GEN, BUR, MYR, AVI, MDT, NOR, RFI, NCR):**
```
Contractor prepares → Contractor QM stamps → EOR / AECOM reviews and assigns status → CM / MTA receives (as FIO)
```

**Work Plans (QWP, SWP, CWP):**
```
Contractor prepares → Contractor QM stamps → CM / MTA Capital Construction reviews and assigns status
```

> **Key distinction:** QWPs, SWPs, and CWPs bypass the EOR and go directly to the CM/Owner for approval. All other submittals are reviewed by AECOM (EOR) first; MTA then receives the approved document for information only (FIO).

### Status Codes Used on This Project

| Code | Full Name | Meaning |
|------|-----------|---------|
| **APP** | Approved | Contractor may proceed; no changes required |
| **NET** | No Exception Taken | Equivalent to Approved; commonly used by AECOM for shop drawings and product data |
| **AAN** | Approved As Noted | Approved with reviewer comments; contractor must incorporate reviewer's notes before or during construction |
| **RWC** | Reviewed with Comments | Reviewed; contractor should address comments; resubmittal may not be required — confirm with reviewer |
| **R&R** | Revise and Resubmit | Not approved; contractor must revise and resubmit before using the document for construction |
| **FIO** | For Information Only | Document received by CM / MTA for their records; no approval action taken by MTA on this transmittal |

**Status authority hierarchy (most authoritative first):**
APP / NET > AAN > RWC > R&R > FIO

When multiple revisions of a document exist, always reference the highest-status, highest-revision version unless the user specifies otherwise.

### Revision Numbering

| On Cover Page | In Filename | Meaning |
|---|---|---|
| `0` | `R00` | Original submission |
| `1` | `R01` | First resubmittal |
| `2` | `R02` | Second resubmittal |

---

## 4. Project Parties

| Role | Organization | Abbreviation | Responsibilities |
|------|-------------|-------------|-----------------|
| **Owner** | Metropolitan Transportation Authority | MTA | Funds project; receives documents as FIO after EOR review; approves QWPs/SWPs/CWPs directly |
| **Construction Manager** | MTA Capital Construction | MTACC or CM | Owner's field representative; manages day-to-day contract; reviews and approves work plans; receives all submittals as FIO |
| **General Contractor / Prime** | MLJTC2 JV (Joint Venture) | MLJTC2 | Prime contractor; responsible for all construction means, methods, subcontractor coordination, and submittal preparation |
| **Program Management Consultant** | TyLin International / NAIK Consultants | PMC or TyLin/NAIK | Owner's program management support; may review technical documents alongside AECOM |
| **Engineer of Record / Designer** | AECOM | EOR | Design team; issues drawings, specs, DUs, DRFIs; reviews and stamps submittals; responds to RFIs |
| **Quality Manager** | MLJTC2 JV (in-house) | QM | Stamps all outgoing submittals; issues QWPs, SWPs, CWPs; manages NCR process |

**When a document references "the designer," "the engineer," or "EOR," that is AECOM.**
**When a document references "the owner," "the authority," or "MTA," that is the Metropolitan Transportation Authority.**
**"CM" on this project refers to MTA Capital Construction, not a separate CM firm.**

---

## 5. Common Construction Abbreviations and Terms

### Contract and Financial
| Abbreviation | Meaning |
|---|---|
| **NTP** | Notice to Proceed — MTA's written authorization for the contractor to start work |
| **GMP** | Guaranteed Maximum Price — contract type where the contractor bears overrun risk above the cap |
| **LD** | Liquidated Damages — pre-agreed damages per calendar day for exceeding the contract completion date |
| **Retainage** | Percentage withheld from each pay application until substantial completion |
| **Pay App** | Application for Payment — periodic billing submittal |
| **SOV** | Schedule of Values — itemized cost breakdown used for progress billing |
| **COR** | Change Order Request — contractor-submitted pricing for a change event |
| **T&M** | Time and Materials — cost-reimbursable billing method |

### Schedule
| Abbreviation | Meaning |
|---|---|
| **CPM** | Critical Path Method — scheduling methodology showing the longest chain of dependent activities |
| **TIA** | Time Impact Analysis — formal schedule analysis demonstrating the delay impact of a change event |
| **LOE** | Level of Effort — schedule activity type for ongoing work without a discrete deliverable (e.g., project management, QA/QC oversight) |
| **Float** | Slack time on a non-critical activity; zero float = critical path |
| **Baseline** | Original approved project schedule |
| **Look-Ahead** | Short-interval (typically 3–6 week) field planning schedule |
| **Milestone** | Key contractual date (e.g., platform turnover, substantial completion per station) |
| **Substantial Completion** | Point at which a station or the overall project is sufficiently complete for MTA to accept or use |

### Quality and Safety
| Abbreviation | Meaning |
|---|---|
| **QA/QC** | Quality Assurance / Quality Control |
| **ITP** | Inspection and Test Plan — schedule of hold points and witness points keyed to a QWP |
| **Hold Point** | Mandatory stop in the work requiring the CM's or MTA's written sign-off before proceeding |
| **Witness Point** | Inspection offered to the CM/MTA; work may proceed if the inspector declines to attend |
| **CAR** | Corrective Action Report — response to an NCR |
| **JHA** | Job Hazard Analysis — pre-task safety analysis |
| **SDS** | Safety Data Sheet — chemical/material hazard information (replaced MSDS) |
| **PPE** | Personal Protective Equipment |
| **HASP** | Health and Safety Plan — site-wide safety program |
| **MOT** | Maintenance of Traffic — plan for managing pedestrians, buses, or vehicles through the work zone |
| **RGP** | Restoration and General Provisions (check project-specific use) |

### Design and Engineering
| Abbreviation | Meaning |
|---|---|
| **IFC** | Issued for Construction — drawings bearing this status are approved for field use |
| **IFR** | Issued for Review — preliminary drawings submitted for design review only |
| **ASI** | Architect's Supplemental Instruction — minor design direction with no cost change; issued by AECOM |
| **BIM** | Building Information Modeling — 3D design coordination model |
| **MEP** | Mechanical, Electrical, and Plumbing trades |
| **Conformed** | Documents updated after contract award to incorporate all bid addenda |
| **Record Drawings** | Final as-built drawings reflecting what was actually constructed |

### Transit / ADA / MTA Specific
| Abbreviation | Meaning |
|---|---|
| **ADA** | Americans with Disabilities Act — the federal law driving this project's accessibility upgrade scope |
| **BABA / Buy America** | Build America, Buy America / Buy America — federal domestic content requirement for federally funded transit work |
| **FTA** | Federal Transit Administration — federal agency that partially funds MTA capital projects |
| **MTACC** | MTA Capital Construction — the MTA division acting as Construction Manager on this contract |
| **NB** | Northbound Platform |
| **SB** | Southbound Platform |
| **ROW** | Right of Way — MTA-controlled land corridor |
| **OAC** | Owner–Architect–Contractor meeting — regular project coordination meeting attended by MTA, AECOM, and MLJTC2 |
| **PRDC** | Project Requirements and Design Criteria — owner-issued document that governs design; supersedes the spec in cases of conflict |

---

## 6. Common Question Patterns from GCs and PMs

These are the typical ways a PM or superintendent from MLJTC2 will phrase questions.

### Identifier-Based Lookups (most reliable — use exact-ID search)
- "What does **QWP-005** say about the concrete pour sequence?"
- "Is **RFI-063** still open?"
- "Show me **DRFI-0047**."
- "What is the latest revision of **GEN-023**?"
- "Pull up the approved version of **SWP-013** for platform demolition."
- "What is the status of **BUR-007**?"

→ Include the identifier exactly as the user writes it. The system resolves `QWP 5`, `QWP-005`, and `QWP05` to the same document.

### Station-Specific Lookups
- "What submittals have been approved for **Middletown Rd.**?"
- "Find the shop drawing for the **Burnside Ave** elevator."
- "Is there an approved **SWP for the NB platform at Myrtle Ave**?"
- "What RFIs are open at **Avenue I**?"

→ Match the station name to its prefix: Burnside Ave = BUR, Myrtle Ave = MYR, Avenue I = AVI, Middletown Rd. = MDT, Norwood Ave = NOR.

### Document Discovery (topic or trade)
- "Do we have a **concrete mix design submittal**?"
- "Find the **fire alarm shop drawing** for Middletown Rd."
- "What is the latest **look-ahead schedule**?"
- "Is there a **Buy America certification** for the elevator equipment?"

→ These require topic + document-type search. Include station name and/or spec section for best results.

### Status and Compliance Checks
- "Which **submittals are still pending** AECOM review?"
- "What is the approval status of **GEN-019**?"
- "Are all **QWPs for Division 14** approved?"
- "Which **NCRs** are still open?"
- "Is the **Buy America cert** in the file for the steel?"

### Content / Q&A Questions
- "What **ASME codes** apply to the hydraulic elevator?"
- "What does **Section 03 30 00** require for curing time?"
- "What **hold points** are in QWP-001?"
- "What did **AECOM** comment on GEN-019R01?"
- "What does the contract say about **liquidated damages**?"

→ Answers come from indexed document text. If the file is not text-indexed (Tier 2), the system will say so.

### Schedule Questions
- "What is the **critical path** right now?"
- "When is the **milestone for Norwood Ave ADA completion**?"
- "What does the **April schedule update** show for the Burnside platform?"
- "Is there **float** on the elevator installation at MDT?"

→ Always specify a date or milestone name when asking about schedules. "Latest" returns the most recently synced schedule file.

### Cost and Change Order Questions
- "What is the **total CO value** to date?"
- "Is **PCO-007** still unresolved?"
- "What change orders affect the **elevator work at Myrtle Ave**?"

### Meeting Minutes and Correspondence
- "What was decided at the **last OAC meeting** about the ADA ramp?"
- "Has **MTACC** responded to the claim letter?"
- "Find the **meeting minutes** where the concrete mix deviation was discussed."

---

## 7. File Naming Convention

All project files follow this pattern:

```
{ContractNo}_{CSI Section}_{DocPrefix-Number}{Revision} - {Status} - {Description}.pdf
```

### Example
```
A37806_06 60 00_GEN-001R00 - ORIG - Rubbing Board for Burnside Ave and Middletown Road.pdf
```

| Field | Example | Rules |
|-------|---------|-------|
| Contract Number | `A37806` | Always `A37806` on this project |
| CSI Section | `06 60 00` | Six-digit MasterFormat with spaces (not `066000`) |
| Document Prefix + Number | `GEN-001` | Prefix hyphen sequential number; leading zeros to match project convention |
| Revision | `R00` | `R00` = original; `R01`, `R02` = resubmittals |
| Status | `ORIG` | First submission uses `ORIG`; subsequent use the assigned status code (e.g., `AAN`, `APP`) |
| Description | Human-readable product name, scope, and station | Keep the original description; do not truncate |

**Cover page vs. filename revision format:**
- Cover page field: `0`, `1`, `2` (single digit)
- Filename: `R00`, `R01`, `R02`

### Submittal Numbering Rules
- Each destination folder (spec section) has its own sequential counter.
- GEN submittals are numbered `GEN-001`, `GEN-002`, etc. across the whole project.
- Station-specific submittals use the station prefix: `BUR-001`, `MDT-001`, etc.
- Resubmittals keep the original base number and increment only the revision: `GEN-023R00` → `GEN-023R01`.
- Never reuse a number. Check the folder for the highest existing number before assigning the next.

---

## 8. Specification / Drawing Disambiguation

One of the most common retrieval errors is returning a **drawing sheet** when the user wants a **specification section**, or vice versa. Both document types are indexed under the same CSI section number (e.g., `14 24 00` can match both the spec PDF and the elevator drawing sheets).

---

### What each document type answers

| Document Type | What it contains | Answer these questions |
|---|---|---|
| **Specification section (spec)** | Written requirements: materials, workmanship standards, testing, submittals required, referenced codes (ASME, ASTM, NFPA), warranty | "What code applies?" / "What are the requirements for...?" / "What submittals are required?" / "What testing is specified?" |
| **Drawing sheet** | Graphical: dimensions, elevations, sections, details, equipment layout, schedules | "Where is it located?" / "What are the dimensions?" / "What detail shows the connection?" / "How many are there?" |
| **PRDC** | Owner's project-specific design criteria; governs conflicts with spec | "What does the owner require for...?" / "Does the PRDC override the spec on...?" |
| **Submittal (shop drawing / product data)** | Vendor-supplied info reviewed against the spec: fabricator dimensions, product data sheets, certifications | "What was submitted and approved for this product?" / "What model / manufacturer is being used?" |

---

### How to identify document type from filename or folder

| Clue | Likely type |
|---|---|
| Sheet number in filename: `A101`, `S-201`, `EL1118`, `E301` | Drawing |
| Division word + section number: `Division_14.pdf`, `14 24 00 Hydraulic Elevator Equipment.pdf` | Spec section |
| Folder named `Drawings`, `Plans`, `DWGs`, `CAD` | Drawing |
| Folder named `Specs`, `Specifications`, `Project Manual` | Spec |
| Folder named `Submittals`, `Shop Drawings`, `Product Data` | Submittal |
| Filename includes `GEN-` or station prefix + revision (`BUR-007R01`) | Submittal |
| Filename includes `PRDC` | Project Requirements and Design Criteria |
| Filename includes `Conformed` | Post-bid updated spec — use this version for construction |

---

### Drawing sheet prefix conventions

| Prefix | Discipline | Typical Contents |
|--------|-----------|-----------------|
| **G** | General | Cover sheet, drawing index, abbreviations, project notes |
| **C** or **CV** | Civil | Site plan, grading, paving, utilities |
| **A** | Architectural | Floor plans, elevations, sections, interior details, finish schedule |
| **S** or **ST** | Structural | Foundation, framing, connection details, structural notes |
| **M** or **MECH** | Mechanical / HVAC | Equipment layout, ductwork, mechanical schedules |
| **P** or **PLMB** | Plumbing | Piping, fixture schedules, plumbing plans |
| **FP** | Fire Protection | Sprinkler layout, riser diagrams |
| **E** or **ELEC** | Electrical | Power, lighting, panel schedules, single-line diagrams |
| **FA** | Fire Alarm | Detector / device layout, riser diagram, equipment schedule |
| **EL** | Elevator / Vertical Transportation | Pit / hoistway details, door and fixture drawings, machine room layout |
| **L** | Landscape | Planting plan, hardscape, site furnishings |
| **DM** or **DEMO** | Demolition | Existing conditions, demo scope, salvage notes |

---

### Spec vs. PRDC vs. Conformed Specs

| Document | Issued by | Purpose | Authority |
|---|---|---|---|
| **Specification section** | AECOM (design team) | Written requirements for a specific scope | Contractual — contractor must comply |
| **PRDC** | MTA (owner) | Owner's design intent, performance criteria, project-specific technical standards | Governs conflicts — supersedes the spec |
| **Conformed specs** | AECOM (post-award) | Specs updated to incorporate all bid addenda | Supersede original issued-for-bid specs; always use conformed for construction |

---

### Disambiguation logic

When a query mentions a CSI section number and intent is ambiguous:

1. **Read the verb:**
   - "What does `14 24 00` *require*?" → spec
   - "What does `14 24 00` *show*?" → drawing
   - "What *dimensions / location / detail*?" → drawing
   - "What *codes / standards / testing / submittals required*?" → spec

2. **Check the open document:** If the user has a drawing open, "this section" means the drawing. If a spec is open, "this section" means written requirements.

3. **When genuinely ambiguous:** Return the spec section first (more common for Q&A) and note that drawing sheets for the same section are also available.

4. **Never mix sources:** An answer sourced from a drawing should not cite written requirements, and an answer sourced from a spec should not cite dimensions or locations.

---

## 1. Document Identifier Types (Project Control Numbers)

These are the prefix codes used to number controlled project documents. Users will reference them directly in questions (e.g., "What does QWP-005 say?" or "Is DRFI-0047 still open?").

| Prefix | Full Name | Description |
|--------|-----------|-------------|
| **QWP** | Quality Work Plan | Work-specific quality plans describing hold points, inspection requirements, and acceptance criteria for a defined scope of work |
| **SWP** | Safety Work Plan | Activity-level safety plans addressing hazards, controls, and PPE for a specific work task or area |
| **CWP** | Construction Work Plan | Construction method statements describing planned approach, sequence, equipment, and resources |
| **RFI** | Request for Information | Formal request from the contractor to the designer or owner seeking clarification, interpretation, or direction on the contract documents |
| **DRFI** | Design Request for Information | Designer-originated clarification or supplemental instruction issued to the contractor (direction flows from designer to contractor) |
| **NCR** | Non-Conformance Report | Formal record of work or material that does not meet contract requirements; triggers corrective action |
| **CO** | Change Order | Executed contract modification changing scope, price, or schedule; signed by both parties |
| **MOD** | Modification | Contract modification (may be used interchangeably with CO on some projects; check project-specific convention) |
| **PCO** | Potential Change Order | Unpriced or unapproved change event being tracked before formal CO execution |
| **GEN** | General Submittal | Submittals that do not fall under a trade-specific prefix; common for product data, shop drawings, and certifications on transit/infrastructure projects |
| **PRDC** | Project Requirements and Design Criteria | Owner-issued design criteria and project-specific technical requirements; functions like project-specific specifications |
| **DU** | Drawing Update | Revised drawing issued after contract award to clarify or correct the original design |
| **EDU** | Engineering Drawing Update | Designer-issued engineering drawing revision, typically carrying a higher engineering review level than a DU |
| **CSI** | CSI Specification Section | A submittal or document keyed to a specific CSI MasterFormat section (e.g., CSI 03 30 00) |

### Identifier Normalization

When a user writes an identifier, these variations all refer to the same document:
- `QWP-005`, `QWP 5`, `QWP05` → canonical: `QWP5`
- `RFI-063`, `RFI 63`, `RFI063` → canonical: `RFI63`
- `GEN-023R00` → canonical: `GEN023R00`
- `03 30 00`, `033000` → same CSI section

---

## 2. Document Approval Statuses

Documents cycle through these statuses. Status affects which revision is authoritative.

| Code | Full Name | Meaning |
|------|-----------|---------|
| **APP** | Approved | Contractor may proceed; no changes required |
| **NET** | No Exception Taken | Equivalent to Approved on many transit projects |
| **AAN** | Approved As Noted | Approved with comments; contractor must incorporate notes before or during construction |
| **RWC** | Reviewed with Comments | Reviewed; contractor should address comments; may not require formal resubmittal |
| **R&R** | Revise and Resubmit | Not approved; contractor must revise and submit again |
| **RES** | Reviewed, Engineering Stamp Required | Reviewed but a professional engineer's seal is still required before use |
| **ORIG** | Original | First submission; not yet reviewed |
| **VOID** | Void / Superseded | Replaced by a newer revision; do not use for construction |
| **FYI** | For Your Information | Submitted for record only; no approval action required |
| **FFC** | For Field Coordination | Issued to coordinate with other trades; not a record submittal |

**Revision hierarchy (most authoritative first):** APP / NET / AAN > RWC / RES > ORIG > R&R > VOID

When a user asks about a document and multiple revisions exist, always reference the highest-status, highest-revision version unless the user specifies otherwise.

---

## 3. CSI MasterFormat — Division Overview

Construction specifications are organized by **CSI MasterFormat** using a six-digit section number (e.g., `03 30 00`). The first two digits are the Division.

| Division | Title | Common Contents |
|----------|-------|-----------------|
| **01** | General Requirements | Submittal procedures, schedule requirements, temporary facilities, testing, closeout |
| **02** | Existing Conditions | Demolition, site investigation, subsurface conditions |
| **03** | Concrete | Cast-in-place concrete, reinforcing, precast, grout |
| **04** | Masonry | Unit masonry, stone, brick |
| **05** | Metals | Structural steel, metal fabrications, steel decking, handrails |
| **06** | Wood, Plastics, and Composites | Rough carpentry, finish carpentry, millwork |
| **07** | Thermal and Moisture Protection | Roofing, waterproofing, insulation, firestopping |
| **08** | Openings | Doors, frames, hardware, glazing, curtain wall |
| **09** | Finishes | Drywall, tile, flooring, painting, acoustic ceilings |
| **10** | Specialties | Signage, lockers, fire extinguishers, toilet accessories |
| **11** | Equipment | Loading dock, food service, lab equipment |
| **12** | Furnishings | Casework, window treatments, furniture |
| **13** | Special Construction | Prefabricated structures, special facilities |
| **14** | Conveying Equipment | Elevators, escalators, lifts, dumbwaiters |
| **21** | Fire Suppression | Sprinklers, fire protection piping |
| **22** | Plumbing | Piping, fixtures, plumbing equipment |
| **23** | HVAC | Ductwork, mechanical equipment, controls |
| **25** | Integrated Automation | Building automation, integrated systems |
| **26** | Electrical | Wiring, panels, lighting, grounding |
| **27** | Communications | Data, voice, AV systems |
| **28** | Electronic Safety and Security | Fire alarm, access control, CCTV |
| **31** | Earthwork | Grading, excavation, fill, dewatering |
| **32** | Exterior Improvements | Paving, curbs, fencing, site concrete |
| **33** | Utilities | Site water, sewer, storm drain, utilities |
| **34** | Transportation | Trackwork, signals, fare collection (transit-specific) |
| **35** | Waterway and Marine | Waterfront structures, dredging |
| **40–49** | Process and Industrial | Mechanical process equipment |

### Common Section Numbers (Transit / Infrastructure Projects)

| Section | Title |
|---------|-------|
| 01 33 00 | Submittal Procedures |
| 01 45 00 | Quality Control |
| 03 30 00 | Cast-in-Place Concrete |
| 05 12 00 | Structural Steel Framing |
| 05 50 00 | Metal Fabrications |
| 06 20 00 | Finish Carpentry |
| 06 60 00 | Fiber-Reinforced Composites (also used for FRP and specialty boards) |
| 07 19 00 | Water Repellents |
| 07 92 00 | Joint Sealants |
| 08 11 13 | Hollow Metal Doors and Frames |
| 08 71 00 | Door Hardware |
| 09 29 00 | Gypsum Board |
| 09 90 00 | Paints and Coatings |
| 10 14 00 | Signage |
| 14 21 00 | Electric Traction Elevators |
| 14 24 00 | Hydraulic Elevators |
| 22 05 00 | Common Work Results for Plumbing |
| 26 05 00 | Common Work Results for Electrical |
| 28 31 00 | Fire Detection and Alarm |
| 31 00 00 | Earthwork |
| 32 12 16 | Asphalt Paving |
| 32 16 13 | Concrete Curbs and Gutters |

---

## 4. Project Roles and Parties

| Abbreviation | Full Title | Typical Responsibilities |
|---|---|---|
| **Owner** | Project Owner / Authority | Funds project; approves changes and major submittals; issues NTP |
| **CM** | Construction Manager | Owner's representative in the field; reviews submittals, manages RFIs, oversees quality |
| **GC** | General Contractor | Prime contractor responsible for all construction means, methods, and subcontractor coordination |
| **A/E** | Architect / Engineer | Design team; issues drawings and specs; responds to RFIs; approves submittals |
| **DB** | Design-Builder | Single entity holding both design and construction responsibility under a design-build contract |
| **PM** | Project Manager | Day-to-day management of schedule, cost, and scope on behalf of the GC or Owner |
| **QM** | Quality Manager | Responsible for QA/QC program, QWP review, NCR issuance, and hold-point inspections |
| **Super** | Superintendent | Field operations lead; manages daily work, subcontractors, and crew deployment |
| **Sub** | Subcontractor | Specialty contractor hired by the GC for a defined scope (electrical, mechanical, structural steel, etc.) |
| **AHJ** | Authority Having Jurisdiction | The regulatory body (fire marshal, building department, DOT, etc.) whose approval governs the work |
| **IOR** | Inspector of Record | Third-party or agency inspector assigned to verify compliance with plans, specs, and code |

---

## 5. Common Construction Abbreviations and Terms

### Contract and Financial
| Abbreviation | Meaning |
|---|---|
| **NTP** | Notice to Proceed — owner's written authorization to start work |
| **GMP** | Guaranteed Maximum Price — contract type where the contractor bears overrun risk above the cap |
| **ATS** | Agreement to Start — early authorization to procure or mobilize before full contract execution |
| **T&M** | Time and Materials — cost-reimbursable billing method |
| **LD** | Liquidated Damages — pre-agreed damages per day for contract delay |
| **Retainage** | Percentage withheld from each pay application until substantial completion |
| **Pay App** | Application for Payment — periodic billing submittal |
| **SOV** | Schedule of Values — itemized cost breakdown attached to contract and used for billing |
| **COR** | Change Order Request — contractor-submitted pricing for a change event |

### Schedule
| Abbreviation | Meaning |
|---|---|
| **CPM** | Critical Path Method — scheduling methodology showing the longest sequence of dependent activities |
| **TIA** | Time Impact Analysis — formal schedule analysis demonstrating delay impact of a change event |
| **LOE** | Level of Effort — schedule activity type representing ongoing work without a discrete deliverable |
| **Float** | Slack time between early and late dates on a non-critical activity |
| **Baseline** | Original approved project schedule |
| **Look-Ahead** | Short-interval schedule (typically 3–6 week window) for near-term field planning |
| **Milestone** | Key contractual date (e.g., substantial completion, turnover of a work area) |
| **Substantial Completion** | Point at which the work is sufficiently complete for the owner to occupy or use |

### Quality and Safety
| Abbreviation | Meaning |
|---|---|
| **QA/QC** | Quality Assurance / Quality Control — program for verifying work meets requirements |
| **ITP** | Inspection and Test Plan — schedule of inspections keyed to QWP hold and witness points |
| **Hold Point** | Mandatory stop requiring inspector sign-off before work continues |
| **Witness Point** | Inspection that must be offered to the inspector but may proceed if inspector declines |
| **NCR** | Non-Conformance Report — documents work that fails to meet requirements |
| **CAR** | Corrective Action Report — response to an NCR defining the fix and root cause |
| **JHA** | Job Hazard Analysis — pre-task safety analysis |
| **SDS/MSDS** | Safety Data Sheet / Material Safety Data Sheet — chemical hazard information |
| **PPE** | Personal Protective Equipment |
| **HASP** | Health and Safety Plan — site-wide safety program document |
| **MOT** | Maintenance of Traffic — plan for managing vehicles and pedestrians through a construction zone |

### Design and Engineering
| Abbreviation | Meaning |
|---|---|
| **IFC** | Issued for Construction — drawings approved for use in the field |
| **IFR** | Issued for Review — preliminary drawings submitted for design review |
| **IFB** | Issued for Bid — drawings used to solicit bids |
| **ASI** | Architect's Supplemental Instruction — minor design change issued without a cost change |
| **SK** | Sketch — informal design clarification drawing |
| **BIM** | Building Information Modeling — 3D model-based design and coordination |
| **MEP** | Mechanical, Electrical, and Plumbing — the three primary building systems trades |
| **Conformed** | Drawings or specs updated after award to incorporate all addenda |
| **Record Drawings** | As-built drawings capturing what was actually constructed |

### Transit / Infrastructure Specific
| Abbreviation | Meaning |
|---|---|
| **PRDC** | Project Requirements and Design Criteria — owner-issued technical criteria document |
| **ADA** | Americans with Disabilities Act — federal accessibility law; ADA upgrades are a common project type |
| **BABA** | Build America, Buy America — federal domestic content requirement for federally funded projects |
| **Buy America** | Domestic content compliance requirement (iron/steel/manufactured products must be produced in the USA) |
| **FTA** | Federal Transit Administration — federal agency funding and overseeing transit projects |
| **DOT** | Department of Transportation — state or federal transportation agency |
| **MTA** | Metropolitan Transportation Authority — transit authority (New York context) |
| **Station** | A passenger boarding location; submittals and drawings are often keyed to station name |
| **Platform** | The boarding surface at a station |
| **ROW** | Right of Way — land corridor controlled by the transit agency or DOT |
| **OCS** | Overhead Contact System — the electrified wire above rail lines |

---

## 6. Common Question Patterns from GCs and PMs

Understanding these patterns helps route queries to the right document type and intent.

### Identifier-Based Lookups (Highest-confidence queries)
- "What does **QWP-005** say about the concrete pour sequence?"
- "Is **RFI-063** still open?"
- "Show me **DRFI-0047**."
- "What is the latest revision of **GEN-023**?"
- "Pull up the approved version of **SWP-013** for platform demolition."

→ These should trigger exact-ID lookup. The system finds the document instantly regardless of topic.

### Document Discovery (Activity or topic-based)
- "Find the **shop drawing for the hydraulic elevator**."
- "Do we have a **concrete mix design submittal** for the Burnside Ave platform?"
- "What is the **fire alarm submittal** for Middletown Road station?"
- "Is there a **safety plan** for the overhead work at the elevated station?"

→ These require topic + document-type search. Include station names or spec sections when possible for best results.

### Status and Compliance Checks
- "Are there any **open RFIs** related to the structural steel?"
- "Which **submittals** are still pending approval?"
- "Is the **Buy America certification** in place for the elevator equipment?"
- "What is the **approval status** of GEN-019?"

→ These work best when the user can also name a spec section, trade, or station.

### Content / Q&A Questions
- "What **ASME codes** apply to hydraulic elevators on this project?"
- "What does **Section 03 30 00** require for concrete curing time?"
- "What **hold points** are listed in QWP-001?"
- "What is the **schedule impact** of Change Order 14?"
- "What does the contract say about **liquidated damages**?"

→ These require indexed document text. Quality of answers depends on whether the file is indexed at the text (Tier 2) level.

### Schedule Questions
- "What is the **current critical path**?"
- "What is the **milestone date** for Middletown Road ADA completion?"
- "What does the **April schedule update** show for the Burnside platform?"
- "Is there **float** on the elevator installation activity?"

→ Specify the schedule update date or milestone name when possible. "Latest" or "most recent" triggers recency-biased retrieval.

### Cost and Change Order Questions
- "What is the **total value of approved change orders** to date?"
- "What change orders affect **Division 14** elevator work?"
- "Is **PCO-007** still unresolved?"
- "What is the budget status of the **ADA platform work**?"

### Meeting Minutes and Correspondence
- "What was decided at the **last OAC meeting** about the elevator access?"
- "Has the owner **responded** to the claim letter from March?"
- "Are there any **meeting minutes** documenting the decision on the concrete mix?"

---

## 7. File Naming Conventions (Example Project: A37806)

When the project follows the **A37806** contract convention, file names follow this pattern:

```
{ContractNo}_{CSI Section}_{DocPrefix-Number}{Revision} - {Status} - {Description}.pdf
```

Example:
```
A37806_06 60 00_GEN-001R00 - ORIG - Rubbing Board for Burnside Ave and Middletown Road.pdf
```

| Field | Example | Notes |
|-------|---------|-------|
| Contract Number | `A37806` | Assigned by the owner at award |
| CSI Section | `06 60 00` | Six-digit MasterFormat section with spaces |
| Document ID | `GEN-001` | Prefix + sequential number |
| Revision | `R00` | R00 = first submission; R01, R02 = resubmittals |
| Status | `ORIG` | See status codes in Section 2 |
| Description | `Rubbing Board for Burnside Ave and Middletown Road` | Human-readable description of product or scope |

**On the cover page**, revision appears as a single digit (`0`, `1`, `2`), while the filename uses `R00`, `R01`, `R02`.

---

## 8. Specification / Drawing Disambiguation

One of the most common retrieval errors is returning a **drawing sheet** when the user wants a **specification section**, or vice versa. Both document types are indexed under the same CSI section number, so a query like "14 24 00 hydraulic elevator" can match either the Division 14 spec PDF or the EL-series drawing sheets.

---

### What each document type answers

| Document Type | What it contains | Answer these questions |
|---|---|---|
| **Specification section (spec)** | Written requirements: materials, workmanship standards, testing, submittals required, referenced standards (ASME, ASTM, NFPA, etc.), warranty terms | "What code applies?" / "What are the requirements for...?" / "What submittals are required?" / "What testing is specified?" |
| **Drawing sheet** | Graphical: dimensions, elevations, sections, details, equipment layout, schedules (door/window/finish), coordination notes | "Where is it located?" / "What are the dimensions?" / "What detail shows the connection?" / "How many are there?" |
| **Submittal (shop drawing or product data)** | Vendor-supplied information reviewed against the spec: dimensions confirmed by fabricator, product data sheets, installation instructions, certifications | "What was submitted and approved for this product?" / "What model/manufacturer is specified?" |

---

### How to tell them apart from a filename or folder path

| Clue | Likely document type |
|---|---|
| Filename contains a sheet number like `A101`, `S-201`, `EL1118`, `E301` | Drawing |
| Filename contains a Division word + section number, e.g., `Division_14.pdf`, `14 24 00 Hydraulic Elevator Equipment.pdf` | Specification section |
| File is in a folder named `Drawings`, `Plans`, `DWGs`, `CAD` | Drawing |
| File is in a folder named `Specs`, `Specifications`, `Project Manual`, `Technical Specifications` | Specification |
| File is in a folder named `Submittals`, `Shop Drawings`, `Product Data` | Submittal |
| Filename includes a GEN/submittal number + revision (e.g., `GEN-045R02`) | Submittal |
| Filename includes a CSI section + "PRDC" | Project Requirements and Design Criteria (owner criteria, not spec) |

---

### Drawing sheet number conventions

Drawing sheet numbers typically follow a **prefix + number** format. The prefix identifies the engineering discipline.

| Prefix | Discipline | Typical Contents |
|--------|-----------|-----------------|
| **G** | General | Cover sheet, drawing index, vicinity map, project notes, abbreviation legend |
| **C** or **CV** | Civil | Site plan, grading, paving, utilities, erosion control |
| **A** | Architectural | Floor plans, elevations, sections, interior details, finishes |
| **S** or **ST** | Structural | Foundation plans, framing plans, connection details, structural notes |
| **M** or **MECH** | Mechanical (HVAC) | Equipment layout, ductwork, mechanical schedules, details |
| **P** or **PLMB** | Plumbing | Piping isometrics, fixture schedules, plumbing plans |
| **FP** | Fire Protection | Sprinkler layout, riser diagrams, fire protection notes |
| **E** or **ELEC** | Electrical | Power plans, lighting plans, panel schedules, single-line diagrams |
| **T** or **COMM** | Communications / Technology | Low-voltage, data, AV, security layout |
| **FA** | Fire Alarm | Detector/device layout, riser diagram, equipment schedule |
| **EL** | Elevator / Vertical Transportation | Elevator pit/hoistway details, door and fixture drawings, machine room layout |
| **L** | Landscape | Planting plan, hardscape, site furnishings |
| **DM** or **DEMO** | Demolition | Existing conditions, demo scope, salvage notes |

**Number format:** The digits after the prefix typically encode the floor or area (e.g., `A-101` = Architectural sheet 1 on floor 1; `S-201` = Structural sheet 1 on floor 2). Transit projects sometimes use sequential numbering without floor encoding (e.g., `EL1118`).

---

### Spec vs. PRDC vs. Conformed Specs

On transit and design-build projects, three similar-looking documents can cause confusion:

| Document | Issued by | Purpose | Authority |
|---|---|---|---|
| **Specification section** (e.g., `14 24 00 Hydraulic Elevator Equipment.pdf`) | Design team (A/E) | Written requirements for a specific work scope; bidders price against these | Contractual — contractor must comply |
| **PRDC** (Project Requirements and Design Criteria) | Owner | Owner's design intent, performance criteria, and project-specific technical standards that the A/E must design to | Contractual — sits above the spec; governs conflicts |
| **Conformed specs** | A/E (post-award) | Specifications updated after contract award to incorporate all addenda issued during bidding | Supersede original issued-for-bid specs; always use conformed version for construction |

**When a user asks for "the spec" for a section:** return the **conformed** specification section if available; otherwise return the latest issued version and note that a conformed version should be confirmed.

---

### Disambiguation logic for the AI assistant

When a user query mentions a CSI section number and the intent is ambiguous:

1. **Check the verb or question type:**
   - "What does `14 24 00` *require*?" → spec
   - "What does `14 24 00` *show*?" → drawing
   - "What *dimensions* / *location* / *detail*?" → drawing
   - "What *codes* / *standards* / *testing* / *submittals required*?" → spec
   - "What was *submitted* / *approved* for?" → submittal

2. **Check what is open (active doc):** If the user has a drawing open, "this section" means the drawing. If a spec is open, "this section" means the written requirements.

3. **When genuinely ambiguous,** return the spec section first (it is the more commonly needed document for Q&A) and note that drawing sheets for the same section are also available.

4. **Never conflate the two in an answer.** An answer sourced from a drawing should not cite written requirements, and an answer sourced from a spec should not cite dimensions or locations unless the spec explicitly states them.
