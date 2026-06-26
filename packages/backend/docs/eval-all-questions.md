# Eval Question Banks — Complete Reference

**Total questions:** 210 across 6 banks

Generated reference of every question currently in `packages/backend/eval/`. Full query text is included (not truncated).

## Table of Contents

- [MLJ-017 Test Questions (Regression)](#mlj017-test-questions) — **36** questions
- [MLJ-017 Smoke Questions](#mlj017-smoke-questions) — **110** questions
- [MLJ-017 Realistic Questions](#mlj017-realistic-questions) — **35** questions
- [MLJ-017 Chunk-Sampled Questions](#mlj017-chunk-sampled-questions) — **20** questions
- [MLJ-017 Chunk-Curated Questions](#mlj017-chunk-curated-questions) — **5** questions
- [QWP-001 Depth Questions](#qwp001-depth-questions) — **4** questions

## NPM Script → Bank Mapping

| npm script | Question bank | Notes |
|------------|---------------|-------|
| `pnpm eval:mlj017` | `mlj017-test-questions.json` | Default when no `--file` flag |
| `pnpm eval:smoke` | `mlj017-smoke-questions.json` | Full eval (search + answer) |
| `pnpm eval:smoke-search` | `mlj017-smoke-questions.json` | Search-only mode |
| `pnpm eval:realistic` | `mlj017-realistic-questions.json` | Full eval |
| `pnpm eval:realistic-search` | `mlj017-realistic-questions.json` | Search-only mode |
| `pnpm eval:chunk-curated` | `mlj017-chunk-curated-questions.json` | Hand-curated chunk questions |
| `pnpm eval:qwp` | `qwp001-depth-questions.json` | QWP-001 depth probes |
| `pnpm chunk-audit:sample` | `mlj017-chunk-sampled-questions.json` | Generates (and optionally runs) sampled questions |
| `pnpm chunk-audit:smoke` | `mlj017-smoke-questions.json` | Generates smoke question bank |
| `pnpm chunk-audit:smoke-run` | `mlj017-smoke-questions.json` | Generates + runs ask on smoke set |

> **Note:** `mlj017-chunk-sampled-questions.json` has no dedicated npm eval alias. Run with `pnpm eval:mlj017 -- --file ./eval/mlj017-chunk-sampled-questions.json --report ./eval/mlj017-chunk-sampled-report.json`.

---

<a id="mlj017-test-questions"></a>

## MLJ-017 Test Questions (Regression)

**File:** `eval/mlj017-test-questions.json` · **Count:** 36

**npm scripts:** `eval:mlj017` (default file)

Mixed-bucket regression harness — find, answer, identifier, ambiguous, not_found.


**Buckets:** find (10), answer (12), identifier (6), ambiguous (4), not_found (4)

#### 1. `find-01` (find)

**Query:** Volume 06 Track Specifications A37806

**Expected file patterns:** `Volume_06_Track_Specifications`
**Expected in top-K:** 1

#### 2. `find-02` (find)

**Query:** Volume 05 Project Requirements and Design Criteria PRDC

**Expected file patterns:** `Volume_05_Project_Requirements`
**Expected in top-K:** 1

#### 3. `find-03` (find)

**Query:** April 26 schedule update station schedules

**Expected file patterns:** `April 26 Schedule Update`
**Expected in top-K:** 1

#### 4. `find-04` (find)

**Query:** Design Build Baseline Schedule 01 32 01

**Expected file patterns:** `01_32_01-002R00`, `Design Build Baseline Schedule`, `01 32 01`
**Expected in top-K:** 1

#### 5. `find-05` (find)

**Query:** Hydraulic Elevator Equipment section 14 24 00

**Expected file patterns:** `14 24 00 Hydraulic Elevator`
**Expected in top-K:** 1

#### 6. `find-06` (find)

**Query:** Division 22 plumbing common work results specifications

**Expected file patterns:** `Division_22`
**Expected in top-K:** 1

#### 7. `find-07` (find)

**Query:** Burnside SOGR full report B225 B236

**Expected file patterns:** `B225 TO B236 WEB SOGR`
**Expected in top-K:** 1

#### 8. `find-08` (find)

**Query:** Design-Build Agreement fully executed A37806

**Expected file patterns:** `Design-Build Agreement - Fully Executed`
**Expected in top-K:** 1

#### 9. `find-09` (find)

**Query:** Middletown Road fire alarm system submission

**Expected file patterns:** `Middletown Rd_FA system`
**Expected in top-K:** 1

#### 10. `find-10` (find)

**Query:** Concrete Repair Procedures MTA submittal GEN-009

**Expected file patterns:** `GEN-009R00`, `Concrete Repair Procedures`
**Expected in top-K:** 1

#### 11. `answer-01` (answer)

**Query:** What UPS backup duration is required for communications systems per PRDC 07?

**Expected file patterns:** `RFI063`, `Data Cabinet AC on UPS`, `PRDC 07 Communications`
**Expected in top-K:** 1
**Acceptable answer contains:** `UPS`, `hour`, `communications`

#### 12. `answer-02` (answer)

**Query:** What quality risks does QWP-001 address for concrete formwork and reinforcement?

**Expected file patterns:** `QWP-001`, `Concretre, Reinforcement, Formwork`
**Expected in top-K:** 1
**Acceptable answer contains:** `concrete`, `formwork`, `reinforcement`, `quality`

#### 13. `answer-03` (answer)

**Query:** What ASME elevator safety codes apply to hydraulic elevator equipment on this project?

**Expected file patterns:** `14 24 00 Hydraulic Elevator`
**Expected in top-K:** 1
**Acceptable answer contains:** `ASME`, `A17`, `elevator`

#### 14. `answer-04` (answer)

**Query:** What is DRFI-0059 about regarding stairs roof deck details?

**Expected file patterns:** `DRFI-0059`, `Stairs Roof Deck`
**Expected in top-K:** 1
**Acceptable answer contains:** `roof deck`, `stair`, `DRFI`

#### 15. `answer-05` (answer)

**Query:** What is the LOE milestone percent complete for Burnside Avenue station on the April 2026 schedule?

**Expected file patterns:** `April 26 Schedule Update`
**Expected in top-K:** 1
**Acceptable answer contains:** `Burnside`, `11.16`, `milestone`

#### 16. `answer-06` (answer)

**Query:** What does Section 22 05 00 cover for plumbing work on Package 6?

**Expected file patterns:** `Division_22`, `22 05 00`
**Expected in top-K:** 1
**Acceptable answer contains:** `plumbing`, `common work`, `22 05 00`

#### 17. `answer-07` (answer)

**Query:** What are the car clearance requirements for track work in Volume 06?

**Expected file patterns:** `Volume_06_Track`, `Track_Specifications`
**Expected in top-K:** 1
**Acceptable answer contains:** `clearance`, `track`

#### 18. `answer-08` (answer)

**Query:** What is Sika Backer Rod used for in expansion joints?

**Expected file patterns:** `Expansion Joints Backer Rod`, `GEN-007R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `backer rod`, `expansion joint`, `sealant`

#### 19. `answer-09` (answer)

**Query:** What contractual milestone MS-20 requires for ADA work completion?

**Expected file patterns:** `April 26 Schedule Update`, `Baseline Schedule`
**Expected in top-K:** 1
**Acceptable answer contains:** `MS-20`, `ADA`

#### 20. `answer-10` (answer)

**Query:** What Build America Buy America requirements apply to plumbing submittals?

**Expected file patterns:** `Division_22`, `22 05 00`
**Expected in top-K:** 1
**Acceptable answer contains:** `Build America`, `Buy America`, `submittal`

#### 21. `answer-11` (answer)

**Query:** What is the subject of RFI 063 regarding data cabinet AC on UPS?

**Expected file patterns:** `RFI063`, `Data Cabinet AC on UPS`
**Expected in top-K:** 1
**Acceptable answer contains:** `data cabinet`, `UPS`, `AC`

#### 22. `answer-12` (answer)

**Query:** What stations are included in ADA Upgrades Package 6 per the track specifications volume?

**Expected file patterns:** `Volume_06_Track_Specifications`
**Expected in top-K:** 1
**Acceptable answer contains:** `five stations`, `Package 6`, `ADA`

#### 23. `identifier-01` (identifier)

**Query:** QWP-001

**Expected file patterns:** `QWP-001`, `GEN-019R00`
**Expected in top-K:** 1

#### 24. `identifier-02` (identifier)

**Query:** RFI-063

**Expected file patterns:** `RFI063`, `RFI-063`
**Expected in top-K:** 1

#### 25. `identifier-03` (identifier)

**Query:** GEN-009R00 concrete repair

**Expected file patterns:** `GEN-009R00`, `Concrete Repair Procedures`
**Expected in top-K:** 1

#### 26. `identifier-04` (identifier)

**Query:** BUR-042R01 SOGR Burnside

**Expected file patterns:** `BUR-042R01`, `SOGR at Burnside`
**Expected in top-K:** 1

#### 27. `identifier-05` (identifier)

**Query:** DRFI-0059

**Expected file patterns:** `DRFI-0059`, `Stairs Roof Deck`
**Expected in top-K:** 1

#### 28. `identifier-06` (identifier)

**Query:** CSI 01 40 10 QWP concrete

**Expected file patterns:** `01 40 10`, `QWP-001`
**Expected in top-K:** 1

#### 29. `ambiguous-01` (ambiguous)

**Query:** Burnside station construction schedule

**Expected file patterns:** `Burnside`, `Schedule`
**Expected in top-K:** 3

#### 30. `ambiguous-02` (ambiguous)

**Query:** EDU06 track traction power and signals drawings

**Expected file patterns:** `EDU06`, `Track Traction Power`
**Expected in top-K:** 3

#### 31. `ambiguous-03` (ambiguous)

**Query:** expansion joint specifications and submittals

**Expected file patterns:** `Expansion Joint`, `expansion joint`, `Backer Rod`, `Volume_05`, `PRDC`
**Expected in top-K:** 3

#### 32. `ambiguous-04` (ambiguous)

**Query:** Avenue I comments matrix design review

**Expected file patterns:** `Avenue I`, `Comments Matrix`
**Expected in top-K:** 3

#### 33. `not_found-01` (not_found)

**Query:** offshore wind farm turbine foundation specifications

**Expected file patterns:** —
**Max top relevance:** 0.65

#### 34. `not_found-02` (not_found)

**Query:** cryptocurrency mining facility electrical requirements

**Expected file patterns:** —
**Max top relevance:** 0.65

#### 35. `not_found-03` (not_found)

**Query:** Mars colony habitat construction standards

**Expected file patterns:** —
**Max top relevance:** 0.65

#### 36. `not_found-04` (not_found)

**Query:** nuclear fusion reactor installation procedures

**Expected file patterns:** —
**Max top relevance:** 0.65

---

<a id="mlj017-smoke-questions"></a>

## MLJ-017 Smoke Questions

**File:** `eval/mlj017-smoke-questions.json` · **Count:** 110

**npm scripts:** `eval:smoke`, `eval:smoke-search` (search-only)

Large chunk-audit smoke set (80 files × 2 chunks). Generated via `chunk-audit:sample -- --smoke` or `chunk-audit:smoke`.

> Generated: 2026-06-25T17:15:32.307Z
> Seed: 20260619

**Buckets:** answer (110)

#### 1. `chunk-69891ac7-c2` (answer)

**Query:** In CO#15 - Ave I Relocate Water Service (MLJ Interal), what does the document state about 335 Center Avenue, Mamaroneck, NY 10543 (914) 777 – 8292 ♦ (914)?

**Expected file patterns:** `CO#15 - Ave I Relocate Water Service (MLJ Interal)`
**Expected in top-K:** 1
**Acceptable answer contains:** `water`, `relocate`, `service`, `assistant`

#### 2. `chunk-da0c6d56-c48` (answer)

**Query:** In A37806_GEN-051R00 - APP - Subcontractor Approval Forms , what does GEN-051R00 say about contracting and prog?

**Expected file patterns:** `A37806_GEN-051R00 - APP - Subcontractor Approval Forms `, `A37806`, `051R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `contracting`, `prog`, `rosemar`, `inc.`

#### 3. `chunk-da0c6d56-c30` (answer)

**Query:** In A37806_GEN-051R00 - APP - Subcontractor Approval Forms , what does GEN-051R00 say about prog and contracting?

**Expected file patterns:** `A37806_GEN-051R00 - APP - Subcontractor Approval Forms `, `A37806`, `051R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `prog`, `contracting`, `sealing`, `joint`

#### 4. `chunk-44a66cdc-c2` (answer)

**Query:** In 2025-03-19 MTACD-MLJTC2-L-0022 Sub-Contractor Approval , what does the document state about 2 Broadway, 8th Floor?

**Expected file patterns:** `2025-03-19 MTACD-MLJTC2-L-0022 Sub-Contractor Approval `, `MLJTC2`, `Contractor`
**Expected in top-K:** 1
**Acceptable answer contains:** `sub-contractor`, `engineering`, `surveying`, `munoz`

#### 5. `chunk-38b42538-c48` (answer)

**Query:** In Pre-Proposal Slideshow_A37806_RFP_Addendum_02, what requirements does spec section 01 10 30 include for 01 10 30?

**Expected file patterns:** `Pre-Proposal Slideshow_A37806_RFP_Addendum_02`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 10 30`, `information`, `avenue`, `construction`

#### 6. `chunk-38b42538-c19` (answer)

**Query:** In Pre-Proposal Slideshow_A37806_RFP_Addendum_02, what does the document state about Disclaimer: This presentation and the information contained herein is provided for info...?

**Expected file patterns:** `Pre-Proposal Slideshow_A37806_RFP_Addendum_02`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `information`, `contained`, `representation`, `presentation`

#### 7. `chunk-1be1940a-c51` (answer)

**Query:** In A37806_GEN-027R00 - R&R - Subcontractor Approval Forms , what does GEN-027R00 say about subcontractor and contract?

**Expected file patterns:** `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms `, `A37806`, `027R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `subcontractor`, `contract`, `significant`, `perform`

#### 8. `chunk-1be1940a-c26` (answer)

**Query:** In A37806_GEN-027R00 - R&R - Subcontractor Approval Forms , what does GEN-027R00 say about percentage and ownership?

**Expected file patterns:** `A37806_GEN-027R00 - R&R - Subcontractor Approval Forms `, `A37806`, `027R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `percentage`, `ownership`, `partner`, `party`

#### 9. `chunk-6068cbdd-c2` (answer)

**Query:** In A37806 Transmittal 0014 -  MTA Personnel and PMC Suppli, what does Transmittal 0014 say about 01 50 00 and returned?

**Expected file patterns:** `A37806 Transmittal 0014 -  MTA Personnel and PMC Suppli`, `A37806`, `Transmittal`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 50 00`, `returned`, `anodized`, `white`

#### 10. `chunk-862d3b51-c2` (answer)

**Query:** In 2026-03-03 Cary Winston Access pass 2026 signed, what does the document state about 1010 Northern Blvd Suite 200 Great Neck NY 11021 | (929) 800-1972?

**Expected file patterns:** `2026-03-03 Cary Winston Access pass 2026 signed`
**Expected in top-K:** 1
**Acceptable answer contains:** `construction`, `providence`, `corp.`, `upgrades`

#### 11. `chunk-862d3b51-c3` (answer)

**Query:** In 2026-03-03 Cary Winston Access pass 2026 signed, what does the document state about Attachment 4. List of Contractor Company Employees Requesting Access Passes?

**Expected file patterns:** `2026-03-03 Cary Winston Access pass 2026 signed`
**Expected in top-K:** 1
**Acceptable answer contains:** `access`, `pass`, `transportation`, `temporary`

#### 12. `chunk-fb1040ac-c2` (answer)

**Query:** In A37806 Transmittal 0012 -  Masks KN95 01.09.2026, what does Transmittal 0012 say about 01 50 00 and returned?

**Expected file patterns:** `A37806 Transmittal 0012 -  Masks KN95 01.09.2026`, `A37806`, `Transmittal`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 50 00`, `returned`, `masks`, `submitted`

#### 13. `chunk-3ccd72b4-c2` (answer)

**Query:** In A37806 - TC Electric Letter, what does the document state about Attn: Michael Wilson, Program CEO?

**Expected file patterns:** `A37806 - TC Electric Letter`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `access`, `your`, `employees`, `upgrades`

#### 14. `chunk-e19299ea-c6` (answer)

**Query:** In A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundati, what does AVI-002R01 say about 8u1106 and elevator?

**Expected file patterns:** `A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundati`, `A37806`, `002R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `8u1106`, `elevator`, `formsaver`, `type1`

#### 15. `chunk-e19299ea-c3` (answer)

**Query:** In A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundati, what does AVI-002R01 say about 03 20 00 and contract?

**Expected file patterns:** `A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundati`, `A37806`, `002R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `03 20 00`, `contract`, `manager`, `nyct`

#### 16. `chunk-b2f715c4-c4` (answer)

**Query:** In A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entran, what does BUR-009R00 say about 08 80 00 and information?

**Expected file patterns:** `A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entran`, `A37806`, `009R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `08 80 00`, `information`, `submittal`, `contract`

#### 17. `chunk-b2f715c4-c2` (answer)

**Query:** In A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entran, what does BUR-009R00 say about 14 24 00 and contract?

**Expected file patterns:** `A37806_14 24 00_BUR-009R00 - R&R - EL539 Cab and Entran`, `A37806`, `009R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `14 24 00`, `contract`, `manager`, `nyct`

#### 18. `chunk-8a793d89-c4` (answer)

**Query:** In A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Stai, what does BUR-001R00 say about drawing and professional?

**Expected file patterns:** `A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Stai`, `A37806`, `001R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `drawing`, `professional`, `description`, `prepared`

#### 19. `chunk-8a793d89-c3` (answer)

**Query:** In A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Stai, what does BUR-001R00 say about information and exceptions?

**Expected file patterns:** `A37806_08 45 25_BUR-001R00 - AAR - Burnside Avenue Stai`, `A37806`, `001R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `information`, `exceptions`, `reviewed`, `rejected`

#### 20. `chunk-afe123c6-c2` (answer)

**Query:** In Invoice 11707, what does the document state about Service Locations: Middletown?

**Expected file patterns:** `Invoice 11707`
**Expected in top-K:** 1
**Acceptable answer contains:** `service`, `order`, `mljcontracting.com`, `business`

#### 21. `chunk-6a8f8474-c2` (answer)

**Query:** In Invoice 11830, what does the document state about Service Locations: Middletown?

**Expected file patterns:** `Invoice 11830`
**Expected in top-K:** 1
**Acceptable answer contains:** `service`, `order`, `mljcontracting.com`, `business`

#### 22. `chunk-ce208562-c3` (answer)

**Query:** In 2025 Lockton Invoice 0849812, what does the document state about Single Invoice: INV 123456*?

**Expected file patterns:** `2025 Lockton Invoice 0849812`, `0849812`
**Expected in top-K:** 1
**Acceptable answer contains:** `lockton`, `email`, `clientpayments`, `lockton.com`

#### 23. `chunk-ce208562-c2` (answer)

**Query:** In 2025 Lockton Invoice 0849812, what does the document state about Harco National Insurance Company?

**Expected file patterns:** `2025 Lockton Invoice 0849812`, `0849812`
**Expected in top-K:** 1
**Acceptable answer contains:** `invoice`, `remittance`, `upgrades`, `number`

#### 24. `chunk-5d538cd7-c3` (answer)

**Query:** In Backup for Invoice#01, what does the document state about TIME AND MATERIAL (T&M) LOG SHEET Office: 516-605-1122?

**Expected file patterns:** `Backup for Invoice#01`
**Expected in top-K:** 1
**Acceptable answer contains:** `hrs.`, `rate`, `overtime`, `abatement`

#### 25. `chunk-5d538cd7-c5` (answer)

**Query:** In Backup for Invoice#01, what does the document state about TIME AND MATERIAL (T&M) LOG SHEET Office: 516-605-1122?

**Expected file patterns:** `Backup for Invoice#01`
**Expected in top-K:** 1
**Acceptable answer contains:** `hrs.`, `rate`, `overtime`, `abatement`

#### 26. `chunk-8683adfa-c2` (answer)

**Query:** In A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Co, what does GEN-042R00 say about 00
01 30 and contract?

**Expected file patterns:** `A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Co`, `A37806`, `042R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `00
01 30`, `contract`, `manager`, `a37806`

#### 27. `chunk-8683adfa-c3` (answer)

**Query:** In A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Co, what does GEN-042R00 say about station and ahern?

**Expected file patterns:** `A37806_01 30 20_GEN-042R00 - ORIG - A37806 & C49321R Co`, `A37806`, `042R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `station`, `ahern`, `meeting`, `a37806`

#### 28. `chunk-83c4d024-c3646` (answer)

**Query:** In A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10., what does the document state about q��faX1�E_f�Xǰ"�/����P�8w���$a<R��v`p`�u =��a R�u�v3��P�i�<4/��߱'�Gȓ������...?

**Expected file patterns:** `A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10.`, `A37806`, `Conference`
**Expected in top-K:** 1
**Acceptable answer contains:** `fax1`, `lmsc`, `sc-u`, `jrlk`

#### 29. `chunk-83c4d024-c3829` (answer)

**Query:** In A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10., what does the document state about X��u?:O½��m�f���Ʒ_�g� �y,�M�?

**Expected file patterns:** `A37806 Kick Off Pre-Work Conference MASTER FILE - 2.10.`, `A37806`, `Conference`
**Expected in top-K:** 1
**Acceptable answer contains:** `psnp`, `22f3`, `o-xb`

#### 30. `chunk-d270696a-c23` (answer)

**Query:** In A37806 Monthly Job Progress Meeting Minutes 2025-07-24, what does the document state about /25, 11:33:11 AM 1h 21m 13s bjiang@mljcontracting.com bjiang@mljcontracting.com Presenter?

**Expected file patterns:** `A37806 Monthly Job Progress Meeting Minutes 2025-07-24`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `mljcontracting.com`, `presenter`, `tcelect.net`, `fkastrati`

#### 31. `chunk-d270696a-c28` (answer)

**Query:** In A37806 Monthly Job Progress Meeting Minutes 2025-07-24, what does the document state about Emmanuel Olagbaiye 7/24/25, 10:03:48 AM 7/24/25, 11:33:23 AM 1h 29m 34s EOlagbaiye@mljc...?

**Expected file patterns:** `A37806 Monthly Job Progress Meeting Minutes 2025-07-24`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `presenter`, `mljcontracting.com`, `external`, `tylin.com`

#### 32. `chunk-46885e53-c8` (answer)

**Query:** In A37806 Monthly Job Progress Meeting Minutes 2026-05-28, what does the document state about CPR-003 R2 issued on 5/6/26.?

**Expected file patterns:** `A37806 Monthly Job Progress Meeting Minutes 2026-05-28`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `mljtc2`, `open`, `provided`, `ongoing`

#### 33. `chunk-46885e53-c4` (answer)

**Query:** In A37806 Monthly Job Progress Meeting Minutes 2026-05-28, what does the document state about ace from 3/2-9/20/26 on Track J4?

**Expected file patterns:** `A37806 Monthly Job Progress Meeting Minutes 2026-05-28`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `week`, `approved`, `myrtle`, `middletown`

#### 34. `chunk-4b8950a6-c3` (answer)

**Query:** In 37135_02FF_181ST_001R00 - (NET) - Monitoring Plan, what does the document state about Date Received Reviewed By?

**Expected file patterns:** `37135_02FF_181ST_001R00 - (NET) - Monitoring Plan`, `001R00`, `Monitoring`
**Expected in top-K:** 1
**Acceptable answer contains:** `reviewed`, `submittal`, `received`, `york`

#### 35. `chunk-4b8950a6-c2` (answer)

**Query:** In 37135_02FF_181ST_001R00 - (NET) - Monitoring Plan, what does the document state about For NYCT/MTA Review & Comment?

**Expected file patterns:** `37135_02FF_181ST_001R00 - (NET) - Monitoring Plan`, `001R00`, `Monitoring`
**Expected in top-K:** 1
**Acceptable answer contains:** `review`, `information`, `submittal`, `only`

#### 36. `chunk-ae1aafb0-c7` (answer)

**Query:** In A37806_01 33 10_GEN-001R00 - APP-EAN - Third Party and , what does GEN-001R00 say about coordination and .................................................................................................................?

**Expected file patterns:** `A37806_01 33 10_GEN-001R00 - APP-EAN - Third Party and `, `A37806`, `001R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `coordination`, `.................................................................................................................`, `upgrades`, `revision`

#### 37. `chunk-ae1aafb0-c19` (answer)

**Query:** In A37806_01 33 10_GEN-001R00 - APP-EAN - Third Party and , what does GEN-001R00 say about coordination and design?

**Expected file patterns:** `A37806_01 33 10_GEN-001R00 - APP-EAN - Third Party and `, `A37806`, `001R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `coordination`, `design`, `third-party`, `agencies`

#### 38. `chunk-6235c6e0-c33` (answer)

**Query:** In A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10., what does BUR-003R00 say about permit and street?

**Expected file patterns:** `A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10.`, `A37806`, `003R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `permit`, `street`, `sidewalk`, `location`

#### 39. `chunk-6235c6e0-c71` (answer)

**Query:** In A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10., what does BUR-003R00 say about mitigation and within?

**Expected file patterns:** `A37806_01 33 10_BUR-003R00 - FIO - DOT Permits Exp. 10.`, `A37806`, `003R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `mitigation`, `within`, `school`, `noise`

#### 40. `chunk-8bf2aca9-c9` (answer)

**Query:** In A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work, what does 01 33 10 say about branch and branches?

**Expected file patterns:** `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work`, `A37806`, `005R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `branch`, `branches`, `pruning`, `directed`

#### 41. `chunk-8bf2aca9-c16` (answer)

**Query:** In A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work, what does 01 33 10 say about tree and standards?

**Expected file patterns:** `A37806_01 33 10_MDT-005R00 - FIO - Middletown Tree Work`, `A37806`, `005R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `tree`, `standards`, `material`, `applying`

#### 42. `chunk-aa934827-c2` (answer)

**Query:** In FATMIR KASTRATI, what does the document state about Attachment 8. Access Pass Application?

**Expected file patterns:** `FATMIR KASTRATI`
**Expected in top-K:** 1
**Acceptable answer contains:** `access`, `department`, `security`, `contract`

#### 43. `chunk-aa934827-c3` (answer)

**Query:** In FATMIR KASTRATI, what does the document state about ntract to New York City Transit, cannot be performed without the use?

**Expected file patterns:** `FATMIR KASTRATI`
**Expected in top-K:** 1
**Acceptable answer contains:** `pass`, `stolen`, `lost`, `administrative`

#### 44. `chunk-92056c6f-c4` (answer)

**Query:** In A37806_01 32 10_BUR-081R00 - FIO - January 2026  Constr, what does BUR-081R00 say about burnside and side?

**Expected file patterns:** `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Constr`, `A37806`, `081R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `burnside`, `side`, `shielding`, `relocation`

#### 45. `chunk-92056c6f-c3` (answer)

**Query:** In A37806_01 32 10_BUR-081R00 - FIO - January 2026  Constr, what does BUR-081R00 say about burnside and side?

**Expected file patterns:** `A37806_01 32 10_BUR-081R00 - FIO - January 2026  Constr`, `A37806`, `081R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `burnside`, `side`, `relocation`, `protection`

#### 46. `chunk-be82ab58-c5` (answer)

**Query:** In A37806_01 32 10_BUR-080R00 - FIO - Burnside December 20, what does BUR-080R00 say about side and installation?

**Expected file patterns:** `A37806_01 32 10_BUR-080R00 - FIO - Burnside December 20`, `A37806`, `080R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `side`, `installation`, `preperation`, `shielding`

#### 47. `chunk-be82ab58-c4` (answer)

**Query:** In A37806_01 32 10_BUR-080R00 - FIO - Burnside December 20, what does BUR-080R00 say about area and installation?

**Expected file patterns:** `A37806_01 32 10_BUR-080R00 - FIO - Burnside December 20`, `A37806`, `080R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `area`, `installation`, `preperation`, `shielding`

#### 48. `chunk-f1878087-c4` (answer)

**Query:** In 2025-05-13 A37806 Burnside Ave VECP Presentation, what does the document state about VALUE ENGINEERING BACKGROUND?

**Expected file patterns:** `2025-05-13 A37806 Burnside Ave VECP Presentation`, `A37806`, `Presentation`
**Expected in top-K:** 1
**Acceptable answer contains:** `engineering`, `received`, `concept`, `value`

#### 49. `chunk-f1878087-c2` (answer)

**Query:** In 2025-05-13 A37806 Burnside Ave VECP Presentation, what does the document state about May 13, 2025| 12:00 PM?

**Expected file patterns:** `2025-05-13 A37806 Burnside Ave VECP Presentation`, `A37806`, `Presentation`
**Expected in top-K:** 1
**Acceptable answer contains:** `upgrades`, `accessibility`, `design-build`, `presentation`

#### 50. `chunk-f1dd6e34-c25` (answer)

**Query:** In PRO 26-01 Control of Project Nonconforming Items-JS.202, what does the document state about NONCONFORMING ITEMS PROCEDURE?

**Expected file patterns:** `PRO 26-01 Control of Project Nonconforming Items-JS.202`, `Nonconforming`, `20260109`
**Expected in top-K:** 1
**Acceptable answer contains:** `disposition`, `acceptable`, `reviews`, `comments`

#### 51. `chunk-f1dd6e34-c23` (answer)

**Query:** In PRO 26-01 Control of Project Nonconforming Items-JS.202, what requirements does spec section 01 40 10 include for 01 40 10?

**Expected file patterns:** `PRO 26-01 Control of Project Nonconforming Items-JS.202`, `Nonconforming`, `20260109`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 40 10`, `quality`, `ncrs`, `inspection`

#### 52. `chunk-22a58e99-c2` (answer)

**Query:** In A37806_DRFI-0079 - MDT NB Stair Foundation Rebar Interf, what does DRFI-0079 say about 05 12 00 and anchor?

**Expected file patterns:** `A37806_DRFI-0079 - MDT NB Stair Foundation Rebar Interf`, `A37806`, `Foundation`
**Expected in top-K:** 1
**Acceptable answer contains:** `05 12 00`, `anchor`, `rebar`, `bolts`

#### 53. `chunk-7f545dae-c2` (answer)

**Query:** In A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+0, what does RFI098 say about conductor and platform?

**Expected file patterns:** `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+0`, `A37806`, `RFI098`
**Expected in top-K:** 1
**Acceptable answer contains:** `conductor`, `platform`, `boarding`, `drawing`

#### 54. `chunk-7f545dae-c4` (answer)

**Query:** In A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+0, what does RFI098 say about conductor and figure?

**Expected file patterns:** `A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+0`, `A37806`, `RFI098`
**Expected in top-K:** 1
**Acceptable answer contains:** `conductor`, `figure`, `board`, `approximately`

#### 55. `chunk-2e21cbdc-c17` (answer)

**Query:** In A37806_ADA P6_RFI096, what does RFI096 say about platform and exit?

**Expected file patterns:** `A37806_ADA P6_RFI096`, `A37806`, `RFI096`
**Expected in top-K:** 1
**Acceptable answer contains:** `platform`, `exit`, `southbound`, `northbound`

#### 56. `chunk-2e21cbdc-c18` (answer)

**Query:** In A37806_ADA P6_RFI096, what does RFI096 say about upgrades and mcdonald?

**Expected file patterns:** `A37806_ADA P6_RFI096`, `A37806`, `RFI096`
**Expected in top-K:** 1
**Acceptable answer contains:** `upgrades`, `mcdonald`, `avenue`, `drawing`

#### 57. `chunk-f5c380d3-c2` (answer)

**Query:** In MYR-A-444A, what does DRFI-0078 say about level and construction?

**Expected file patterns:** `MYR-A-444A`
**Expected in top-K:** 1
**Acceptable answer contains:** `level`, `construction`, `upgrades`, `enlarged`

#### 58. `chunk-f5c380d3-c3` (answer)

**Query:** In MYR-A-444A, what does DRFI-0078 say about lcd-a-525 and panel?

**Expected file patterns:** `MYR-A-444A`
**Expected in top-K:** 1
**Acceptable answer contains:** `lcd-a-525`, `panel`, `honeycomb`, `stainless`

#### 59. `chunk-a7e7e464-c3` (answer)

**Query:** In A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator S, what does GEN-096R04 say about 01 35 10 and submittal?

**Expected file patterns:** `A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator S`, `A37806`, `096R04`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 35 10`, `submittal`, `associated`, `package`

#### 60. `chunk-a7e7e464-c52` (answer)

**Query:** In A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator S, what does GEN-096R04 say about rcny and outrigger?

**Expected file patterns:** `A37806_01 35 10_GEN-096R04 - APP - SWP-016 - Elevator S`, `A37806`, `096R04`
**Expected in top-K:** 1
**Acceptable answer contains:** `rcny`, `outrigger`, `dunnage`, `option`

#### 61. `chunk-b6b3128f-c17` (answer)

**Query:** In A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform C, what does GEN-041R01 say about dust and control?

**Expected file patterns:** `A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform C`, `A37806`, `041R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `dust`, `control`, `ensure`, `blade`

#### 62. `chunk-b6b3128f-c31` (answer)

**Query:** In A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform C, what does GEN-041R01 say about machine and specification?

**Expected file patterns:** `A37806_01 35 10_GEN-041R01 - R&R - SWP-011 - Platform C`, `A37806`, `041R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `machine`, `specification`, `notification.`, `configuration`

#### 63. `chunk-3157502c-c15` (answer)

**Query:** In A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General fo, what does GEN-055R01 say about tools and electrical?

**Expected file patterns:** `A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General fo`, `A37806`, `055R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `tools`, `electrical`, `damage`, `extension`

#### 64. `chunk-3157502c-c2` (answer)

**Query:** In A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General fo, what does GEN-055R01 say about 01 35 10 and transmittal?

**Expected file patterns:** `A37806_01 35 10_GEN-055R01 - APP - SWP-032 - General fo`, `A37806`, `055R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 35 10`, `transmittal`, `approved`, `letter`

#### 65. `chunk-1f653e39-c16` (answer)

**Query:** In A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine St, what does GEN-116R00 say about lifting and hearing?

**Expected file patterns:** `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine St`, `A37806`, `116R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `lifting`, `hearing`, `stored`, `panels`

#### 66. `chunk-1f653e39-c5` (answer)

**Query:** In A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine St, what does GEN-116R00 say about available and safety?

**Expected file patterns:** `A37806_01 35 10_GEN-116R00 - R&R - SWP-052 Mezzanine St`, `A37806`, `116R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `available`, `safety`, `evacuation`, `personnel`

#### 67. `chunk-eb10b48b-c12` (answer)

**Query:** In 21 12 00 - Fire-Suppression Standpipes, what does EDU02 say about supports and hangers?

**Expected file patterns:** `21 12 00 - Fire-Suppression Standpipes`, `Suppression`, `Standpipes`
**Expected in top-K:** 1
**Acceptable answer contains:** `supports`, `hangers`, `provide`, `piping`

#### 68. `chunk-eb10b48b-c19` (answer)

**Query:** In 21 12 00 - Fire-Suppression Standpipes, what does EDU02 say about 21 12 00 and hose?

**Expected file patterns:** `21 12 00 - Fire-Suppression Standpipes`, `Suppression`, `Standpipes`
**Expected in top-K:** 1
**Acceptable answer contains:** `21 12 00`, `hose`, `fittings`, `install`

#### 69. `chunk-fe353658-c275` (answer)

**Query:** In A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) , what does BUR-042R01 say about water and leaks?

**Expected file patterns:** `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) `, `A37806`, `042R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `water`, `leaks`, `structural`, `repaired`

#### 70. `chunk-fe353658-c395` (answer)

**Query:** In A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) , what does BUR-042R01 say about repair and steel?

**Expected file patterns:** `A37806_01 10 20_BUR-042R01 - AAN - EDU07 - (FINAL 100) `, `A37806`, `042R01`
**Expected in top-K:** 1
**Acceptable answer contains:** `repair`, `steel`, `concrete`, `reinforcement`

#### 71. `chunk-bca6afd2-c2` (answer)

**Query:** In Transmittal 212-NOR Xfer Girder inspection, what does Transmittal 212-NOR say about aecom and mljtc?

**Expected file patterns:** `Transmittal 212-NOR Xfer Girder inspection`, `Transmittal`, `inspection`
**Expected in top-K:** 1
**Acceptable answer contains:** `aecom`, `mljtc`, `number`, `a37806`

#### 72. `chunk-c60c1183-c4` (answer)

**Query:** In A37806_33 14 15_NOR-010R00 - FIO - Norwood Ave CCTV Ins, what does NOR-010R00 say about contract and manager?

**Expected file patterns:** `A37806_33 14 15_NOR-010R00 - FIO - Norwood Ave CCTV Ins`, `A37806`, `010R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `contract`, `manager`, `nyct`, `information`

#### 73. `chunk-c60c1183-c7` (answer)

**Query:** In A37806_33 14 15_NOR-010R00 - FIO - Norwood Ave CCTV Ins, what does NOR-010R00 say about m3071513 and m3083356?

**Expected file patterns:** `A37806_33 14 15_NOR-010R00 - FIO - Norwood Ave CCTV Ins`, `A37806`, `010R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `m3071513`, `m3083356`, `sewer`, `inspected`

#### 74. `chunk-639c329f-c6` (answer)

**Query:** In A37806_01 40 10_GEN-014R00 - ORIG - Monthly Quality and, what does GEN-014R00 say about 01 40 10 and survey?

**Expected file patterns:** `A37806_01 40 10_GEN-014R00 - ORIG - Monthly Quality and`, `A37806`, `014R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 40 10`, `survey`, `platform`, `station`

#### 75. `chunk-639c329f-c2` (answer)

**Query:** In A37806_01 40 10_GEN-014R00 - ORIG - Monthly Quality and, what does GEN-014R00 say about nyct and information?

**Expected file patterns:** `A37806_01 40 10_GEN-014R00 - ORIG - Monthly Quality and`, `A37806`, `014R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `nyct`, `information`, `approval`, `designer`

#### 76. `chunk-39a5d5d5-c10` (answer)

**Query:** In A37806_03 61 00_GEN-001R00 - FIO -  SikaGrout-212 - PMC, what does GEN-001R00 say about safety and application?

**Expected file patterns:** `A37806_03 61 00_GEN-001R00 - FIO -  SikaGrout-212 - PMC`, `A37806`, `001R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `safety`, `application`, `methods`, `actual`

#### 77. `chunk-39a5d5d5-c5` (answer)

**Query:** In A37806_03 61 00_GEN-001R00 - FIO -  SikaGrout-212 - PMC, what does GEN-001R00 say about packaging and certifiable?

**Expected file patterns:** `A37806_03 61 00_GEN-001R00 - FIO -  SikaGrout-212 - PMC`, `A37806`, `001R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `packaging`, `certifiable`, `information`, `accordance`

#### 78. `chunk-f50ff9f5-c100` (answer)

**Query:** In A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burns, what does PRDC12-012R02 say about area and cutting?

**Expected file patterns:** `A37806_PRDC12-012R02 - R&R - Lead Placard Package-Burns`, `A37806`, `PRDC12`
**Expected in top-K:** 1
**Acceptable answer contains:** `area`, `cutting`, `paint`, `containment`

#### 79. `chunk-4b1f7d74-c5` (answer)

**Query:** In MLJTC2-MTACD-XXXX - MTA System Access Passes, what does the document state about �r�������: f����@����1nLg)��xs+ʍmWm��Q݋b�o�f}��?

**Expected file patterns:** `MLJTC2-MTACD-XXXX - MTA System Access Passes`, `MLJTC2`
**Expected in top-K:** 1
**Acceptable answer contains:** `1nlg`, `.9lt`

#### 80. `chunk-4b1f7d74-c21` (answer)

**Query:** In MLJTC2-MTACD-XXXX - MTA System Access Passes, what does the document state about �&��{D!�8�~49l��&��A��?

**Expected file patterns:** `MLJTC2-MTACD-XXXX - MTA System Access Passes`, `MLJTC2`
**Expected in top-K:** 1
**Acceptable answer contains:** `g.h8`, `8gba`, `won8`, `.tp8`

#### 81. `chunk-dd522ca1-c42` (answer)

**Query:** In A37806 Org Chart r1 2025-01-02, what does the document state about �Y��N��O]��b�^nUw�O���%�#�I.�s�Q���;�p�|b5?

**Expected file patterns:** `A37806 Org Chart r1 2025-01-02`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `rels`, `customxml`, `slidemaster1.xml.rels`, `notesmaster1.xml.rels`

#### 82. `chunk-dd522ca1-c30` (answer)

**Query:** In A37806 Org Chart r1 2025-01-02, what does the document state about �k�i��fI�X���H�F2O8�5_�Z|��Z2MS��鬷�mhz�����jk+�{ԏL�_2�E�)2�2�*/���7������,j��...?

**Expected file patterns:** `A37806 Org Chart r1 2025-01-02`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `f2o8`, `z2ms`, `jx2l`, `xyvj`

#### 83. `chunk-767ec6c6-c2` (answer)

**Query:** In 2025-09-10 - T12_31_26-FedEx-Shipping-Label_Xin, what does the document state about ORIGIN ID:RMEA (718) 571-9596?

**Expected file patterns:** `2025-09-10 - T12_31_26-FedEx-Shipping-Label_Xin`
**Expected in top-K:** 1
**Acceptable answer contains:** `j253025062301uv`, `enterprises`, `department`, `overnight`

#### 84. `chunk-92a1d852-c11` (answer)

**Query:** In A37806_01 35 10_GEN-021R00 - ORIG - Safety Coordinator , what does GEN-021R00 say about safety and hazards?

**Expected file patterns:** `A37806_01 35 10_GEN-021R00 - ORIG - Safety Coordinator `, `A37806`, `021R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `safety`, `hazards`, `ensure`, `employees`

#### 85. `chunk-92a1d852-c6` (answer)

**Query:** In A37806_01 35 10_GEN-021R00 - ORIG - Safety Coordinator , what does GEN-021R00 say about contract and east?

**Expected file patterns:** `A37806_01 35 10_GEN-021R00 - ORIG - Safety Coordinator `, `A37806`, `021R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `contract`, `east`, `manhattan`, `access`

#### 86. `chunk-9efaf435-c1709` (answer)

**Query:** In A37806 Test Pit MPT for Community Relations Use, what does the document state about ��l�Dt�q����Hj[�:3/��^W�b=���~�\���'�����~��~W�a����ײ�^��)A�k���~^�7�c[��N�...?

**Expected file patterns:** `A37806 Test Pit MPT for Community Relations Use`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `zc9a9`, `uxbw`

#### 87. `chunk-9efaf435-c4249` (answer)

**Query:** In A37806 Test Pit MPT for Community Relations Use, what does the document state about �s�_��s���\�/�)Ԧ�7K}����?!���[̜�V��t�ߒ:z���K��������(�b��Q���|;�;K$ã�'$�簄��Z���g�...?

**Expected file patterns:** `A37806 Test Pit MPT for Community Relations Use`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `asms`, `z0cm`, `yrsx`

#### 88. `chunk-bf3c1064-c92` (answer)

**Query:** In EDU05B-BB 100% Rev 1 - APP - Electrical Long Lead, what does EDU05B say about calculation and name?

**Expected file patterns:** `EDU05B-BB 100% Rev 1 - APP - Electrical Long Lead`, `EDU05B`, `Electrical`
**Expected in top-K:** 1
**Acceptable answer contains:** `calculation`, `name`, `signature`, `coordination`

#### 89. `chunk-bf3c1064-c62` (answer)

**Query:** In EDU05B-BB 100% Rev 1 - APP - Electrical Long Lead, what does EDU05B say about 12 14 10 and 25 43 18?

**Expected file patterns:** `EDU05B-BB 100% Rev 1 - APP - Electrical Long Lead`, `EDU05B`, `Electrical`
**Expected in top-K:** 1
**Acceptable answer contains:** `12 14 10`, `25 43 18`, `25 41 18`, `used`

#### 90. `chunk-14c18906-c2` (answer)

**Query:** In Attachment 4 Blank, what does the document state about Attachment 4. List of Contractor Company Employees Requesting Access Passes?

**Expected file patterns:** `Attachment 4 Blank`, `Attachment`
**Expected in top-K:** 1
**Acceptable answer contains:** `access`, `pass`, `transportation`, `temporary`

#### 91. `chunk-21a5c069-c2` (answer)

**Query:** In 806-RFI-009 - Myrtle Avenue UPS Backup Requirements, what does RFI-009 say about 27 33 01 and nicholas?

**Expected file patterns:** `806-RFI-009 - Myrtle Avenue UPS Backup Requirements`, `Requirements`
**Expected in top-K:** 1
**Acceptable answer contains:** `27 33 01`, `nicholas`, `york`, `zito`

#### 92. `chunk-21a5c069-c3` (answer)

**Query:** In 806-RFI-009 - Myrtle Avenue UPS Backup Requirements, what does RFI-009 say about systems and communications?

**Expected file patterns:** `806-RFI-009 - Myrtle Avenue UPS Backup Requirements`, `Requirements`
**Expected in top-K:** 1
**Acceptable answer contains:** `systems`, `communications`, `existing`, `backup`

#### 93. `chunk-3422bcbf-c3` (answer)

**Query:** In A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025, what does MYR-076R00 say about upgrades and accessibility?

**Expected file patterns:** `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025`, `A37806`, `076R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `upgrades`, `accessibility`, `myrtle`, `design-build`

#### 94. `chunk-3422bcbf-c2` (answer)

**Query:** In A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025, what does MYR-076R00 say about nyct and information?

**Expected file patterns:** `A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025`, `A37806`, `076R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `nyct`, `information`, `approval`, `designer`

#### 95. `chunk-f19a9963-c2` (answer)

**Query:** In A37806 MOWE Joint Survey 04.08.25  04.09.25, what does the document state about REQUEST FOR INFRASTRUCTURE INSPECTIONS?

**Expected file patterns:** `A37806 MOWE Joint Survey 04.08.25  04.09.25`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `items`, `infrastructure`, `inspection`, `indicated`

#### 96. `chunk-f19a9963-c3` (answer)

**Query:** In A37806 MOWE Joint Survey 04.08.25  04.09.25, what does the document state about forwarded to the MOWE Capital Contracts Office within five (5) working days?

**Expected file patterns:** `A37806 MOWE Joint Survey 04.08.25  04.09.25`, `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `approved`, `burnside`, `station`, `gurung`

#### 97. `chunk-b05eba48-c8` (answer)

**Query:** In Actual - ALl Station 4.6.26 - N, what does the document state about Activity ID Activity Name Original?

**Expected file patterns:** `Actual - ALl Station 4.6.26 - N`
**Expected in top-K:** 1
**Acceptable answer contains:** `11-sep-26`, `enclosure`, `rated`, `glass`

#### 98. `chunk-b05eba48-c7` (answer)

**Query:** In Actual - ALl Station 4.6.26 - N, what does the document state about EL1121- Install Elevator Enclosure Framing ( Outage)?

**Expected file patterns:** `Actual - ALl Station 4.6.26 - N`
**Expected in top-K:** 1
**Acceptable answer contains:** `enclosure`, `elevator`, `avenue`, `glass`

#### 99. `chunk-82296656-c12` (answer)

**Query:** In M017_IMP_Draft Subcontract_20260227, what does the document state about re applicable, the incorporation specifically excludes any payment provisions contained...?

**Expected file patterns:** `M017_IMP_Draft Subcontract_20260227`, `Subcontract`, `20260227`
**Expected in top-K:** 1
**Acceptable answer contains:** `provisions`, `subcontract`, `subcontractor`, `payment`

#### 100. `chunk-82296656-c10` (answer)

**Query:** In M017_IMP_Draft Subcontract_20260227, what does the document state about ontract represents the entire Subcontract between the parties and supersedes all prior?

**Expected file patterns:** `M017_IMP_Draft Subcontract_20260227`, `Subcontract`, `20260227`
**Expected in top-K:** 1
**Acceptable answer contains:** `subcontract`, `subcontractor`, `documents`, `represents`

#### 101. `chunk-be4768ff-c2` (answer)

**Query:** In SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025, what does the document state about ACTION ITEMS -SDI Co-ordination?

**Expected file patterns:** `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025`
**Expected in top-K:** 1
**Acceptable answer contains:** `package`, `cor-ordination`, `co-ordination`, `contract`

#### 102. `chunk-be4768ff-c5` (answer)

**Query:** In SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025, what does the document state about OCIP and Sub approval for surveyor?

**Expected file patterns:** `SDI - MLJ Bi-weekly Meeting Draft Agenda - 12.19.2025`
**Expected in top-K:** 1
**Acceptable answer contains:** `general`, `middletown`, `material`, `roofing`

#### 103. `chunk-7ffe0fdb-c5` (answer)

**Query:** In A37806_03 10 00_GEN-001R02 - ORIG - Elevator Walls Form, what does GEN-001R02 say about pilot and excavate?

**Expected file patterns:** `A37806_03 10 00_GEN-001R02 - ORIG - Elevator Walls Form`, `A37806`, `001R02`
**Expected in top-K:** 1
**Acceptable answer contains:** `pilot`, `excavate`, `elevator`, `requirements`

#### 104. `chunk-7ffe0fdb-c2` (answer)

**Query:** In A37806_03 10 00_GEN-001R02 - ORIG - Elevator Walls Form, what does GEN-001R02 say about nyct and information?

**Expected file patterns:** `A37806_03 10 00_GEN-001R02 - ORIG - Elevator Walls Form`, `A37806`, `001R02`
**Expected in top-K:** 1
**Acceptable answer contains:** `nyct`, `information`, `approval`, `designer`

#### 105. `chunk-997cb89d-c4` (answer)

**Query:** In A37806_01 35 10_GEN-044R00 - ORIG - List of Competent P, what does GEN-044R00 say about 01 35 10 and station?

**Expected file patterns:** `A37806_01 35 10_GEN-044R00 - ORIG - List of Competent P`, `A37806`, `044R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 35 10`, `station`, `tcelect.net`, `general`

#### 106. `chunk-997cb89d-c3` (answer)

**Query:** In A37806_01 35 10_GEN-044R00 - ORIG - List of Competent P, what does GEN-044R00 say about 01 35 10 and civil?

**Expected file patterns:** `A37806_01 35 10_GEN-044R00 - ORIG - List of Competent P`, `A37806`, `044R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 35 10`, `civil`, `mljcontracting.com`, `station`

#### 107. `chunk-29df6b3d-c3` (answer)

**Query:** In WINDY KEANE, what does the document state about ntract to New York City Transit, cannot be performed without the use?

**Expected file patterns:** `WINDY KEANE`
**Expected in top-K:** 1
**Acceptable answer contains:** `pass`, `stolen`, `lost`, `administrative`

#### 108. `chunk-29df6b3d-c2` (answer)

**Query:** In WINDY KEANE, what does the document state about Attachment 8. Access Pass Application?

**Expected file patterns:** `WINDY KEANE`
**Expected in top-K:** 1
**Acceptable answer contains:** `access`, `department`, `security`, `contract`

#### 109. `chunk-ebd3b55a-c4` (answer)

**Query:** In Invoice#01_12-31-2025, what does the document state about Total changes approved Application and onthe Continuation Sheet that are changed to?

**Expected file patterns:** `Invoice#01_12-31-2025`
**Expected in top-K:** 1
**Acceptable answer contains:** `payment`, `certification`, `application`, `approved`

#### 110. `chunk-ebd3b55a-c3` (answer)

**Query:** In Invoice#01_12-31-2025, what does the document state about G on G703) By: Date:?

**Expected file patterns:** `Invoice#01_12-31-2025`
**Expected in top-K:** 1
**Acceptable answer contains:** `line`, `retainage`, `architect`, `payment`

---

<a id="mlj017-realistic-questions"></a>

## MLJ-017 Realistic Questions

**File:** `eval/mlj017-realistic-questions.json` · **Count:** 35

**npm scripts:** `eval:realistic`, `eval:realistic-search` (search-only)

PM-style queries without embedded filenames — real-01..real-35.

> Realistic PM-style queries without embedded filenames — requires retrieval to find the right source document. Expanded set: real-01..real-35.
> Generated: 2026-06-25T21:45:00.000Z

**Buckets:** answer (14), find (21)

#### 1. `real-01` (answer)

**Query:** What hold points does QWP-001 require before concrete placement?

**Expected file patterns:** `QWP-001`, `Formwork Rebar`
**Expected in top-K:** 3
**Acceptable answer contains:** `hold`, `concrete`, `inspection`, `rebar`

#### 2. `real-02` (answer)

**Query:** What specs do I have to follow for salvaging during selective demolition?

**Expected file patterns:** `02 41 19 Selective Demolition`, `Selective Demolition`
**Expected in top-K:** 3
**Acceptable answer contains:** `salvage`, `demolition`, `owner`, `MTA`

#### 3. `real-03` (answer)

**Query:** Based on the volume 5 conformed PRDC, what are the expansion joint specifications?

**Expected file patterns:** `Volume 05_PRDC 03`, `Volume_05_Project_Requirements`, `PRDC 03`
**Expected in top-K:** 3
**Acceptable answer contains:** `expansion joint`, `sealant`, `joint`

#### 4. `real-04` (find)

**Query:** Find the conformed PRDC volume for Package 6

**Expected file patterns:** `Volume_05_Project_Requirements_and_Design_Criteria_CONFORMED`, `CONFORMED 821`
**Expected in top-K:** 3

#### 5. `real-05` (answer)

**Query:** What materials satisfy the expansion joint backer rod specification?

**Expected file patterns:** `Expansion Joints Backer Rod`, `GEN-007`
**Expected in top-K:** 3
**Acceptable answer contains:** `backer rod`, `Sika`, `expansion joint`

#### 6. `real-06` (find)

**Query:** What comments came back on the Burnside MDT submittal package?

**Expected file patterns:** `Submittal Package comments`, `Burnside MDT`
**Expected in top-K:** 3

#### 7. `real-07` (find)

**Query:** Show me the platform structural drawings for Burnside

**Expected file patterns:** `Structural Steel Foundations`, `Burnside Ave`, `EDU02D`
**Expected in top-K:** 3

#### 8. `real-08` (find)

**Query:** Pull up the SWP for platform concrete demolition

**Expected file patterns:** `SWP-011`, `Platform Concrete Demo`
**Expected in top-K:** 3

#### 9. `real-09` (find)

**Query:** Where is the design build baseline schedule?

**Expected file patterns:** `Design Build Baseline Schedule`, `01 32 10`
**Expected in top-K:** 3

#### 10. `real-10` (find)

**Query:** Pull up the detailed cost breakdown for the project

**Expected file patterns:** `Detailed Cost Breakdown`, `GEN-004`, `Contract Schedule Requirements`
**Expected in top-K:** 3

#### 11. `real-11` (find)

**Query:** Where are the Package 6 conformed specifications

**Expected file patterns:** `Conformed Specifications`, `DU07`, `GEN-063`
**Expected in top-K:** 3

#### 12. `real-12` (answer)

**Query:** What quality requirements does QWP-002 cover for drilled grouted piles?

**Expected file patterns:** `QWP-002`, `Drilled Grouted Piles`
**Expected in top-K:** 3
**Acceptable answer contains:** `pile`, `drill`, `grout`, `quality`

#### 13. `real-13` (find)

**Query:** Pull up the SWP for tactile and rubbing board

**Expected file patterns:** `SWP-013`, `Tactile and Rubbing Board`
**Expected in top-K:** 3

#### 14. `real-14` (answer)

**Query:** What is the LOE percent complete for Burnside on the April schedule update?

**Expected file patterns:** `April 26 Schedule Update`, `April 26 Schedule`
**Expected in top-K:** 3
**Acceptable answer contains:** `Burnside`, `milestone`, `LOE`

#### 15. `real-15` (answer)

**Query:** What track clearance requirements are in Volume 06?

**Expected file patterns:** `Volume_06_Track`, `Track_Specifications`
**Expected in top-K:** 3
**Acceptable answer contains:** `clearance`, `track`

#### 16. `real-16` (find)

**Query:** Show me Burnside platform rebar shop drawings

**Expected file patterns:** `Burnside Ave`, `Rebar Shop Drawings`, `BUR-001`
**Expected in top-K:** 3

#### 17. `real-17` (answer)

**Query:** What is DRFI-0078 about regarding the Myrtle platform elevator entrance?

**Expected file patterns:** `DRFI-0078`, `Myrtle Ave Platform`
**Expected in top-K:** 3
**Acceptable answer contains:** `Myrtle`, `platform`, `entrance`, `elevator`

#### 18. `real-18` (find)

**Query:** Find the monthly progress report from April 2026

**Expected file patterns:** `Monthly Progress Report - April 2026`
**Expected in top-K:** 3

#### 19. `real-19` (find)

**Query:** Show me the Burnside MDT submittal package comments

**Expected file patterns:** `Submittal Package comments`, `Burnside MDT`
**Expected in top-K:** 3

#### 20. `real-20` (answer)

**Query:** What division 22 plumbing requirements apply to escutcheons?

**Expected file patterns:** `Division_22`, `22 05 18 Escutcheons`
**Expected in top-K:** 3
**Acceptable answer contains:** `escutcheon`, `plumbing`, `22 05`

#### 21. `real-21` (answer)

**Query:** What hold points does QWP-003 require before selective demolition work?

**Expected file patterns:** `QWP-003`, `Selective Demolition`
**Expected in top-K:** 3
**Acceptable answer contains:** `hold`, `demolition`, `inspection`

#### 22. `real-22` (find)

**Query:** Pull up the quality work plan for excavation

**Expected file patterns:** `QWP-005`, `Excavation`
**Expected in top-K:** 3

#### 23. `real-23` (answer)

**Query:** What quality requirements does QWP-006 cover for controlled and uncontrolled fills?

**Expected file patterns:** `QWP-006`, `Controlled and Uncontrolled Fills`
**Expected in top-K:** 3
**Acceptable answer contains:** `fill`, `controlled`, `compaction`, `quality`

#### 24. `real-24` (find)

**Query:** Where is the safe work plan for platform formwork and concrete?

**Expected file patterns:** `SWP-015`, `Platform Formwork`, `Rebar and Concrete`
**Expected in top-K:** 3

#### 25. `real-25` (find)

**Query:** Show me the SWP for steel installation repair and modification

**Expected file patterns:** `SWP-012`, `Steel Installation Repair`
**Expected in top-K:** 3

#### 26. `real-26` (answer)

**Query:** What does DRFI-0099 say about galvanized versus galvalume gauge?

**Expected file patterns:** `DRFI-0099`, `Galvanized`, `Galvalume`
**Expected in top-K:** 3
**Acceptable answer contains:** `galvanized`, `galvalume`, `gauge`, `20-GA`

#### 27. `real-27` (find)

**Query:** Find DRFI-0047 about the Burnside catch basin interference

**Expected file patterns:** `DRFI-0047`, `Burnside Catch Basin`
**Expected in top-K:** 3

#### 28. `real-28` (find)

**Query:** Where is the Burnside station night differential breakdown?

**Expected file patterns:** `CO-05`, `Night Differential`, `Burnside Station`
**Expected in top-K:** 3

#### 29. `real-29` (find)

**Query:** Pull up the project health and safety plan

**Expected file patterns:** `HASP`
**Expected in top-K:** 3

#### 30. `real-30` (answer)

**Query:** What quality work plan covers membrane waterproofing?

**Expected file patterns:** `QWP-007`, `Membrane Waterproofing`
**Expected in top-K:** 3
**Acceptable answer contains:** `waterproofing`, `membrane`, `quality`

#### 31. `real-31` (find)

**Query:** Where is the six week look ahead for early March 2025?

**Expected file patterns:** `6 Week Look Ahead`, `2025-03-10`, `GEN-007`
**Expected in top-K:** 3

#### 32. `real-32` (find)

**Query:** Show me the utility coordination report from September 2025

**Expected file patterns:** `Utility Coordination`, `September 2025`, `GEN-010`
**Expected in top-K:** 3

#### 33. `real-33` (answer)

**Query:** What does DRFI-0129 address regarding the MDT stair S3 top connection?

**Expected file patterns:** `DRFI-0129`, `MDT Stair`, `S3 Top Connection`
**Expected in top-K:** 3
**Acceptable answer contains:** `stair`, `connection`, `MDT`, `S3`

#### 34. `real-34` (find)

**Query:** Pull up the submittal register from March 2025

**Expected file patterns:** `Submittal Register`, `March 2025`, `GEN-003`
**Expected in top-K:** 3

#### 35. `real-35` (find)

**Query:** Show me the Norwood structural steel and foundations drawing package

**Expected file patterns:** `GEN-025`, `EDU02A`, `Structural Steel`, `NOR`
**Expected in top-K:** 3

---

<a id="mlj017-chunk-sampled-questions"></a>

## MLJ-017 Chunk-Sampled Questions

**File:** `eval/mlj017-chunk-sampled-questions.json` · **Count:** 20

**npm scripts:** `chunk-audit:sample` (default output file), `chunk-audit:sample -- --out ./eval/mlj017-chunk-sampled-questions.json`

Auto-generated from random chunk sampling (default: 12 files × 2 chunks). Run eval manually: `pnpm eval:mlj017 -- --file ./eval/mlj017-chunk-sampled-questions.json`.

> Generated: 2026-06-25T15:53:43.100Z
> Seed: 20260619

**Buckets:** answer (20)

#### 1. `chunk-15faa289-c2` (answer)

**Query:** In Letter_A37806_RFP_Addendum_02, what is required for changes?

**Expected file patterns:** `Letter`
**Expected in top-K:** 1
**Acceptable answer contains:** `changes`, `upgrades`, `part`, `addendum`

#### 2. `chunk-15faa289-c5` (answer)

**Query:** What requirements does spec section 01 10 00 include regarding 01 10 00?

**Expected file patterns:** `Letter`
**Expected in top-K:** 1
**Acceptable answer contains:** `01 10 00`, `question`, `burnside`, `alarm`

#### 3. `chunk-a1ccc93c-c4` (answer)

**Query:** What does AVI-082R00 state about installation and shielding?

**Expected file patterns:** `AVI082R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `installation`, `shielding`, `platform`, `side`

#### 4. `chunk-a1ccc93c-c2` (answer)

**Query:** What does AVI-082R00 state about nyct and information?

**Expected file patterns:** `AVI082R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `nyct`, `information`, `approval`, `designer`

#### 5. `chunk-0f70c896-c36` (answer)

**Query:** What does GEN-045R00 state about cutting and slitting?

**Expected file patterns:** `GEN045R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `cutting`, `slitting`, `clamping`, `concrete`

#### 6. `chunk-0f70c896-c28` (answer)

**Query:** What does GEN-045R00 state about cutting and grinding?

**Expected file patterns:** `GEN045R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `cutting`, `grinding`, `materials`, `grinder`

#### 7. `chunk-f19a9963-c2` (answer)

**Query:** In A37806 MOWE Joint Survey 04.08.25  04.09.25, what is required for must?

**Expected file patterns:** `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `must`, `items`, `infrastructure`, `inspection`

#### 8. `chunk-f19a9963-c3` (answer)

**Query:** In A37806 MOWE Joint Survey 04.08.25  04.09.25, what is required for approved?

**Expected file patterns:** `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `approved`, `burnside`, `station`, `gurung`

#### 9. `chunk-dfe2cba5-c2` (answer)

**Query:** What does AVI-008R00 state about nyct and information?

**Expected file patterns:** `AVI008R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `nyct`, `information`, `approval`, `designer`

#### 10. `chunk-ebd3b55a-c8` (answer)

**Query:** In Invoice#01_12-31-2025, what is required for 000.00?

**Expected file patterns:** `Invoice`
**Expected in top-K:** 1
**Acceptable answer contains:** `000.00`, `0.00`, `overtime`, `local`

#### 11. `chunk-ebd3b55a-c5` (answer)

**Query:** In Invoice#01_12-31-2025, what is required for 000.00?

**Expected file patterns:** `Invoice`
**Expected in top-K:** 1
**Acceptable answer contains:** `000.00`, `0.00`, `application`, `painting`

#### 12. `chunk-5757b59b-c2` (answer)

**Query:** In CO#06.1 - Burnside Approved Design Changes (MLJ In, what is required for additional?

**Expected file patterns:** `Burnside`
**Expected in top-K:** 1
**Acceptable answer contains:** `additional`, `jerome`, `assistant`, `alternate`

#### 13. `chunk-e158549b-c571` (answer)

**Query:** What does MYR-006R00 state about permittee and devices?

**Expected file patterns:** `MYR006R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `permittee`, `devices`, `comply`, `york`

#### 14. `chunk-e158549b-c516` (answer)

**Query:** What does MYR-006R00 state about construction and stipulated?

**Expected file patterns:** `MYR006R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `construction`, `stipulated`, `parking`, `within`

#### 15. `chunk-38e5d12a-c9` (answer)

**Query:** What does RFI-0183 state about 90.43 and 90.45?

**Expected file patterns:** `RFI183`
**Expected in top-K:** 1
**Acceptable answer contains:** `90.43`, `90.45`, `90.46`, `90.44`

#### 16. `chunk-38e5d12a-c3` (answer)

**Query:** What does RFI-0183 state about record and description?

**Expected file patterns:** `RFI183`
**Expected in top-K:** 1
**Acceptable answer contains:** `record`, `description`, `utc-5`, `2026`

#### 17. `chunk-d3eff039-c3` (answer)

**Query:** What does GEN-026R00 state about nyct and information?

**Expected file patterns:** `GEN026R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `nyct`, `information`, `approval`, `designer`

#### 18. `chunk-d3eff039-c6` (answer)

**Query:** What does GEN-026R00 state about subcontractor and environmental?

**Expected file patterns:** `GEN026R00`
**Expected in top-K:** 1
**Acceptable answer contains:** `subcontractor`, `environmental`, `principal`, `services`

#### 19. `chunk-46885e53-c7` (answer)

**Query:** In A37806 Monthly Job Progress Meeting Minutes 2026-0, what is required for 2026?

**Expected file patterns:** `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `2026`, `track`, `power`, `platform`

#### 20. `chunk-46885e53-c2` (answer)

**Query:** In A37806 Monthly Job Progress Meeting Minutes 2026-0, what is required for date?

**Expected file patterns:** `A37806`
**Expected in top-K:** 1
**Acceptable answer contains:** `date`, `meeting`, `safety`, `contract`

---

<a id="mlj017-chunk-curated-questions"></a>

## MLJ-017 Chunk-Curated Questions

**File:** `eval/mlj017-chunk-curated-questions.json` · **Count:** 5

**npm scripts:** `eval:chunk-curated`

Hand-curated chunk-grounded questions from chunk audit spot-checks.

> Hand-curated chunk-grounded questions from chunk audit spot-checks

**Buckets:** answer (5)

#### 1. `curated-rfi-0183-signals` (answer)

**Query:** Who answered RFI-0183 about Burnside Avenue signal light heights, and what was the answer?

**Expected file patterns:** `RFI-0183`, `Burnside Avenue Platform-Level Overhead Clearances`
**Acceptable answer contains:** `Neha Modak`, `signal`, `heights`, `remain`

#### 2. `curated-avi-082-shielding` (answer)

**Query:** What work was performed on 2026-03-25 related to platform shielding at Ave I per the construction photos?

**Expected file patterns:** `AVI-082R00`, `Construction Photos`
**Acceptable answer contains:** `shielding`, `platform`, `2026-03-25`, `installation`

#### 3. `curated-mowe-inspection-lead` (answer)

**Query:** How many business days does MOWE need to process infrastructure inspection requests?

**Expected file patterns:** `MOWE Joint Survey`, `REQUEST FOR INFRASTRUCTURE INSPECTIONS`
**Acceptable answer contains:** `5`, `business days`, `MOWE`, `process`

#### 4. `curated-myr-006-permittee` (answer)

**Query:** What must the permittee comply with per the MYR-006R00 DOT permit?

**Expected file patterns:** `MYR-006R00`, `DOT Permits`
**Acceptable answer contains:** `permittee`, `comply`, `DOT`, `revocation`

#### 5. `curated-gen-045-grinder` (answer)

**Query:** What are the rated power and disc diameter specs for the DCG 125-S angle grinder in GEN-045R00 SWP-027?

**Expected file patterns:** `GEN-045R00`, `SWP-027`, `Steel Demolition`
**Acceptable answer contains:** `125`, `1400`, `grinder`, `DCG`

---

<a id="qwp001-depth-questions"></a>

## QWP-001 Depth Questions

**File:** `eval/qwp001-depth-questions.json` · **Count:** 4

**npm scripts:** `eval:qwp`

Focused answer-bucket questions on QWP-001 concrete/formwork quality work plan.


**Buckets:** answer (4)

#### 1. `qwp-holdpoints` (answer)

**Query:** What hold points does QWP-001 require before concrete placement?

**Expected file patterns:** `QWP-001`
**Acceptable answer contains:** `hold`, `concrete`, `rebar`, `sign`

#### 2. `qwp-rebar-risks` (answer)

**Query:** What rebar inspection risks does QWP-001 list for formwork installation?

**Expected file patterns:** `QWP-001`
**Acceptable answer contains:** `rebar`, `formwork`, `ACI`, `inspection`

#### 3. `qwp-ambient-temp` (answer)

**Query:** What ambient temperature checks are required before placing concrete per QWP-001?

**Expected file patterns:** `QWP-001`
**Acceptable answer contains:** `temperature`, `ambient`, `concrete`, `cold`, `hot`

#### 4. `qwp-quality-risks` (answer)

**Query:** What quality risks does QWP-001 address for concrete formwork and reinforcement?

**Expected file patterns:** `QWP-001`
**Acceptable answer contains:** `concrete`, `formwork`, `reinforcement`, `quality`
