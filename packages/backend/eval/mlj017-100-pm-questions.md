# 100 Project Manager Questions — MLJ-017 Package 6 General

**Project:** MLJ-017 Package 6 General (Contract A-37806, ADA Upgrades Package 6)
**Question set:** `eval/mlj017-100-pm-batch-input.json`
**Ids:** `pm001`–`pm100`

## What this set is for

The existing 97-question set (`eval/mlj017-97-variant-batch-input.json`) is built from
multi-part analytical questions — "list the action items *and* give the next meeting date",
"what are the insurance requirements, the bonding requirements, *and* the payment terms".
Those stress long-form synthesis.

This set covers the other half of real usage: a project manager at a general contracting
company trying to **find a file** or **find one piece of information**. Every question here
has a short answer — a file name, a date, a name, a dollar amount, a status, a single spec
value, or one short list. Average question length is 9 words; none exceeds 16.

Phrasing is deliberately how a PM actually talks: *"where is"*, *"do we have"*, *"pull up"*,
*"who signed"*, *"what's the status"*, *"which sub is doing"*.

Same corpus, same `projectId` as the 97 set, so results are directly comparable.

## Coverage

| Category | Count | Ids |
|---|---|---|
| Locate a file | 30 | pm001–pm030 |
| Date lookup | 12 | pm031–pm042 |
| Dollar amount / quantity | 6 | pm043–pm048 |
| Who — signer, role, preparer, attendee | 12 | pm049–pm060 |
| Status lookup | 10 | pm061–pm070 |
| Which sub / spec section / SWP / scope | 15 | pm071–pm085 |
| Single spec value | 12 | pm086–pm097 |
| Short list | 3 | pm098–pm100 |

Documents touched span the whole corpus: submittals (GEN-, BUR-, AVI-, MYR-, MDT-, NOR-,
PRDC12-, J-TRACK-), subcontractor approval letters (MTACD-MLJTC2-L-####), RFIs, transmittals,
invoices and G702 applications, meeting minutes, permits, safe work plans, schedule updates,
construction photos, drawings, and spec sections.

Some questions target the same underlying fact as a question in the 97 set (e.g. pm031 vs
sq04, pm086 vs sq18). That is intentional — it isolates whether a miss on the 97 set came
from the retrieval or from the multi-part phrasing.

---

## Locate a file

| Id | Question |
|---|---|
| pm001 | Where is the phasing plan for A37806? |
| pm002 | Do we have a subcontract on file for Island Pavement Cutting Co? |
| pm003 | Pull up the subcontractor approval letter for Tri-State Civil Construction. |
| pm004 | Which file has the Burnside Avenue staircase enclosure shop drawings? |
| pm005 | Where are the December 2025 construction photos for Burnside? |
| pm006 | Do we have the Middletown tree work permit on file? |
| pm007 | Find the SikaGrout 212 product submittal. |
| pm008 | Where is the NCR template and log? |
| pm009 | Which document is the lead placard package for Burnside? |
| pm010 | Find the Norwood Avenue CCTV sewer inspection report. |
| pm011 | Where is the transmittal for the Norwood transfer girder inspection? |
| pm012 | Do we have the A37806 kick off pre-work conference presentation? |
| pm013 | Find the Burnside Avenue VECP presentation. |
| pm014 | Where is the June 2025 schedule update? |
| pm015 | Which file holds the Myrtle Avenue demo shield drawings? |
| pm016 | Do we have spec section 21 12 00 for fire-suppression standpipes in the project files? |
| pm017 | Where can I find the safety coordinator submittal? |
| pm018 | Find the monthly quality and certification report for May 2025. |
| pm019 | Which document covers the EDU05B electrical long lead items for Norwood Avenue? |
| pm020 | Where is the material inspection and test request for the 100-8 joint bars? |
| pm021 | Do we have drawing MYR-A-444A on file? |
| pm022 | Where are the Myrtle Avenue December 2025 progress photos? |
| pm023 | Find the Ave I north foundation rebar shop drawings. |
| pm024 | Which file is the elevator walls formwork drawing submittal? |
| pm025 | Where is the A37806 RFP Addendum 02 pre-proposal slideshow? |
| pm026 | Pull up Lockton invoice 0849812. |
| pm027 | Where is the backup for Invoice#01? |
| pm028 | Do we have minutes for the May 28, 2026 monthly job progress meeting? |
| pm029 | Where is RFI-0203 for the Norwood J1 revised track limits? |
| pm030 | Find procedure PRO 26-01 on control of project nonconforming items. |

## Date lookup

| Id | Question |
|---|---|
| pm031 | What date was subcontractor approval letter MTACD-MLJTC2-L-0024 issued? |
| pm032 | When was Titanium Linx Consulting approved as a subcontractor? |
| pm033 | What is the invoice date on Lockton invoice 0849812? |
| pm034 | When is payment due on Lockton invoice 0849812? |
| pm035 | What date was Transmittal 0014 sent? |
| pm036 | What date is on the Burnside Avenue VECP presentation? |
| pm037 | When was MASE FX approved as a subcontractor? |
| pm038 | What date was RFI-0115 on the Myrtle Avenue louver exhaust face velocity closed? |
| pm039 | What is the date of the SDI-MLJ bi-weekly meeting agenda? |
| pm040 | What is the revision date shown on drawing BUR-EN-02? |
| pm041 | When was the June update narrative submitted? |
| pm042 | What is the proposal due date in the A37806 RFP Addendum 02? |

## Dollar amount / quantity

| Id | Question |
|---|---|
| pm043 | What is the subcontract value for Tri-State Civil Construction's micropile work? |
| pm044 | What is the total contract sum on the G702 in Invoice#01? |
| pm045 | How much is the current payment due on Invoice#01? |
| pm046 | What is the total completed to date on Invoice#01? |
| pm047 | What is the total amount billed on invoice 11707? |
| pm048 | How many square feet of lead abatement were completed on December 7, 2025 at Burnside? |

## Who

| Id | Question |
|---|---|
| pm049 | Who signed the subcontractor approval letter for MASE FX? |
| pm050 | Who signed the Tri-State Civil Construction approval letter? |
| pm051 | Who is the safety coordinator on this project? |
| pm052 | Who was the AE reviewer on GEN-001R02? |
| pm053 | Who prepared the May 2025 monthly quality and certification report? |
| pm054 | Who is the MTA C&D senior director signing our subcontractor approvals? |
| pm055 | Who is the PMC on contract A37806? |
| pm056 | Who sent Transmittal 0014 and who was it sent to? |
| pm057 | Who attended the September 9, 2025 Myrtle Avenue PS LAN coordination meeting? |
| pm058 | Who is the design-builder on contract A37806? |
| pm059 | Who answered RFI098 on the Ave I conductor board? |
| pm060 | Who drew the Burnside stair enclosure shop drawings? |

## Status lookup

| Id | Question |
|---|---|
| pm061 | Is the design-build baseline schedule approved? |
| pm062 | What is the status of RFI096? |
| pm063 | Was the SWP-032 submittal GEN-055R01 approved? |
| pm064 | What disposition did GEN-001R02 elevator walls formwork drawing receive? |
| pm065 | Has American Geophysics been approved as a subcontractor? |
| pm066 | Is the Island Pavement Cutting Co subcontract still in draft? |
| pm067 | What is the inspection and test status of the 100-8 6-hole joint bar? |
| pm068 | Was RFI-0203 for the Norwood J1 revised track limits closed? |
| pm069 | What is still open for the surveyor on the SDI-MLJ onboarding? |
| pm070 | Is the Con Ed MOU for the Avenue I utility work finalized? |

## Which sub / spec section / SWP / scope

| Id | Question |
|---|---|
| pm071 | Which subcontractor is doing our micropiles? |
| pm072 | Who is doing the saw cutting and joint sealing? |
| pm073 | Which subcontractor is doing the vacuum excavation for test pits? |
| pm074 | Which subcontractor handles public information and outreach? |
| pm075 | Which subcontractor is our surveyor? |
| pm076 | Which spec section does the Burnside Avenue staircase enclosure submittal fall under? |
| pm077 | Which spec section governs SWP-032? |
| pm078 | Which safe work plan covers platform concrete demolition? |
| pm079 | Which safe work plan covers elevator steel and enclosure work? |
| pm080 | Which safe work plan covers the mezzanine stair barricade at Burnside? |
| pm081 | Which stations are in Package 6? |
| pm082 | What is the contract number for the ADA upgrades Package 6 work? |
| pm083 | Which elevator numbers are at Myrtle Avenue station? |
| pm084 | Which elevator does the BUR-009R00 cab and entrance submittal cover? |
| pm085 | Which agency issues the street permits for Burnside Avenue? |

## Single spec value

| Id | Question |
|---|---|
| pm086 | How much concrete cover is required for surfaces exposed to earth or weather at Ave I? |
| pm087 | What compaction percentage is required for uncontrolled fills? |
| pm088 | What is the cure time for SikaGrout 212? |
| pm089 | What is the shelf life of SikaGrout 212? |
| pm090 | What is the mixing ratio for SikaGrout 212? |
| pm091 | What backup runtime is required for the Myrtle Avenue UPS? |
| pm092 | What voltage and phase are the Norwood Avenue panels? |
| pm093 | What panel product is specified for the Burnside stair enclosure walls? |
| pm094 | What size concrete curb is called for at the Burnside stair enclosure? |
| pm095 | What clearance path width has to be maintained at the Burnside stair enclosure? |
| pm096 | What fall protection is required for elevator steel erection under SWP-016? |
| pm097 | What respiratory protection is required for the platform concrete demo crew? |

## Short list

| Id | Question |
|---|---|
| pm098 | What GOs are forecast at Burnside Avenue for the next reporting period? |
| pm099 | Which CPRs have been issued on this project? |
| pm100 | What is the next coordination meeting date in GEN-042R00? |
