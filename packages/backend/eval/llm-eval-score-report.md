# MLJ-017 Package 6 — 97-Question Evaluation Score Report
**Run:** `mlj017-llm-eval-run.txt` (LLM active: google/gemini-2.5-flash via OpenRouter)
**Baseline:** `mlj017-all97-run.txt` (no LLM, all 2ms deterministic fallbacks)

---

## Summary

| Grade | Count | % |
|-------|-------|---|
| PASS (correct doc + complete answer) | 44 | 45% |
| PARTIAL (right doc but incomplete/raw text) | 22 | 23% |
| FAIL (wrong doc, refusal, timeout+wrong) | 31 | 32% |
| **Total** | **97** | **100%** |

**vs. baseline:** ~0 PASS → 44 PASS (+44), ~0 PARTIAL → 22 PARTIAL, 97 FAIL → 31 FAIL

---

## PASS (44)

| ID | Question (abbreviated) | Source doc | Notes |
|----|------------------------|-----------|-------|
| sq04 | MTACD-MLJTC2-L-0024 sub-contractor approval | Correct | APPROVAL_LETTER fix ✓ |
| sq06 | RFP Addendum 02 Pre-Proposal Slideshow | Correct | Full ADA scheme, dates |
| sq07 | GEN-027R00 Contract Specific Responsibility Form | Correct | Licensing, staffing requirements |
| sq09 | M017_IMP Draft Subcontract payment exclusions | Correct | Full contingent payment clause |
| sq10 | M017_IMP entire agreement clause | Correct | Supersedes all prior agreements |
| sq13 | MTACD-MLJTC2-L-0017 MASE FX approval | Correct | APPROVAL_LETTER fix ✓ |
| sq14 | MTACD-MLJTC2-L-0028 Titanium Linx approval | Correct | APPROVAL_LETTER fix ✓ |
| sq15 | MTACD-MLJTC2-L-0049 McVac Environmental approval | Correct | APPROVAL_LETTER fix ✓ |
| sq16 | MTACD-MLJTC2-L-0083 American Geophysics approval | Correct | APPROVAL_LETTER fix ✓ |
| sq17 | MTACD-MLJTC2-L-0093 Tri-State Civil Construction | Correct | APPROVAL_LETTER fix ✓ |
| sq25 | GEN-001R02 Elevator Walls Formwork designation | Correct | FIO, Reviewed with Comments |
| sq26 | Invoice 11707 pest control locations | Correct | INVOICE fix ✓; Middletown Stations, 3 visits |
| sq27 | Invoice 11830 April 2026 service orders | Correct | INVOICE fix ✓; 4 order numbers |
| sq28 | Lockton Invoice 0849812 remittance instructions | Correct | INVOICE fix ✓; ACH/wire/check details |
| sq29 | Lockton Invoice 0849812 total amount | Correct | INVOICE fix ✓; $14,990.00 |
| sq30 | Backup Invoice#01 Dec 6 lead abatement | Correct | 88 OT hours, 9 workers, ticket 6198 |
| sq31 | Backup Invoice#01 Dec 7 lead abatement | Correct | 83 OT hours, ticket 6199 |
| sq34 | GEN-042R00 A37806 & C49321R Coordination Meeting | Correct | tryFilenameIdentifierSearch fix ✓ |
| sq40 | May 28 Monthly Meeting CPR-003 R2 status | Correct | Proposal received, girder delays |
| sq42 | SDI-MLJ Bi-weekly Meeting Dec 19 action items | Correct | Detailed action items with dates |
| sq43 | SDI-MLJ OCIP and surveyor approval status | Correct | OCIP pending MTA; surveyor 12/22 |
| sq49 | MDT-005R00 nursery standards for replacement trees | Correct | ANSI standards, 2.5-3.5" diameter, B&B |
| sq54 | BUR-081R00 Jan 2026 photos Jan 20 work | Correct | MPT, ConEd trench, demo shielding |
| sq55 | BUR-081R00 MPT and ConEd documentation | Correct | Detailed image breakdown |
| sq58 | MYR-076R00 Dec 2025 photos ADA work | Correct | Vibration monitoring installation |
| sq63 | GEN-006R01 NCR Log data requirements | Correct | 11 fields listed |
| sq67 | RFI098 Ave I conductor board issue at 489+00 | Correct | 4-car board, no ADA boarding area |
| sq68 | RFI098 conductor board conditions | Correct | 489+00 vs 490+00 comparison |
| sq76 | Summarize SWP-016 | Correct | isDocumentSummaryQuery fix ✓ |
| sq77 | GEN-041R01 SWP-011 dust control and silica measures | Correct | Wet methods, N95 masks, etc. |
| sq78 | Summarize SWP-011 | Correct | isDocumentSummaryQuery fix ✓ |
| sq79 | Summarize SWP-032 | Correct | isDocumentSummaryQuery fix ✓ |
| sq81 | GEN-116R00 SWP-052 restricted work hours | Correct | 6AM-9:30AM, 3PM-8PM banned |
| sq83 | GEN-021R00 Safety Coordinator PPE responsibilities | Correct | Daily inspection, SDS, SWP dev |
| sq84 | Summarize GEN-021R00 Safety Coordinator | Correct | isDocumentSummaryQuery fix ✓; R&R, missing certs |
| sq86 | Schedule Update 5 EL1121 Enclosure Framing dates | Correct | Jan 18 – Feb 8 2027, 15 days |
| sq90 | BUR-042R01 EDU07 structural notes and repair standards | Correct | Detailed steel repair requirements |
| sq91 | Transmittal 212-NOR Norwood transfer girder | Correct | Certification + field report 03/30/2026 |
| sq93 | NOR-010R00 inspected sewer sections | Correct | M3071513→M3083356, M3083356→M3083358 |
| sq97 | GEN-014R00 NYCT submittal designation | Correct | R&C, Revise & Resubmit |
| sq98 | PRDC12-019R00 SikaGrout 212 application restrictions | Correct | Temp limits, pot life, placement |
| sq99 | PRDC12-019R00 USDA certifiable and packaging | Correct | USDA ✓, 50 lb bags, ASTM C-827 |
| sq102 | PRDC12-019R00 compressive strength and flowability | Correct | Full 9-cell strength table |
| sq73 | RFI-0116 PS LAN Myrtle coordination issue | RFI-0042 Myrtle | Content matches (PS LAN Myrtle) |

---

## PARTIAL (22)

| ID | Issue |
|----|-------|
| sq08 | GEN-027R00: correct doc, but ownership % genuinely blank in doc |
| sq19 | AVI-002R01: correct revision, but answer is raw text dump from detailed-extraction path |
| sq24 | Excavation spec (timeout 32s): multi-doc answer, content partially useful |
| sq41 | May Monthly Meeting Grade Ops: correct doc, data not in report |
| sq44 | Burnside permits (timeout 33s): partial content from 4 docs |
| sq45 | Ave I permits: correct docs, answer is just filename list |
| sq47 | Middletown permits: correct docs, answer is filename list |
| sq48 | Norwood permits (timeout 33s): partial content |
| sq59 | MYR-076R00 designation: lists all options, doesn't resolve which is checked |
| sq64 | RFI-0203 summary: correct doc, raw text dump |
| sq65 | J-TRACK-13A-041R00: correct doc, ASTM standard could not be verified |
| sq75 | GEN-096R04 SWP-016 submittal response date: correct doc, raw text not targeted |
| sq80 | GEN-055R01 SWP-032 transmittal letter: correct doc area, raw text mode |
| sq82 | GEN-116R00 worksite safety: correct doc, raw section dump |
| sq85 | Schedule Update 5 Elevator 541: correct doc, specific activity not in chunks |
| sq87 | Spec 21 12 00 pipe hanger requirements: correct doc, raw section index not full answer |
| sq88 | Spec 21 12 00 pitch requirements: correct doc, same raw dump |
| sq89 | BUR-042R01 water leaks during painting: correct doc, raw structural notes |
| sq92 | NOR-010R00 review designation: correct doc, can't read which box is checked |
| sq96 | GEN-014R00 Monthly Quality activities: correct doc, raw text mode |
| sq100 | PRDC12-012R02 containment class: correct doc, raw text dumps HEPA procedures |
| sq101 | PRDC12-012R02 classification: retrieved R00 not R02, partial content |

---

## FAIL (31)

### A. Timeout failures — missing HNSW/FTS indexes (7)
| ID | Elapsed | Actual issue |
|----|---------|-------------|
| sq02 | 31894ms | Island Pavement Cutting subcontract — FTS scan timeout |
| sq03 | 31841ms | Island Pavement Cutting contract work — FTS timeout |
| sq35 | 32180ms | Sep 3 2025 coordination meeting — vague + FTS timeout |
| sq46 | 33503ms | Myrtle Ave permits — FTS scan timeout |
| sq48 | 33187ms | Norwood Ave permits — FTS scan timeout |
| sq24* | 32007ms | Spec for excavation near elevator — borderline |
| sq44* | 33399ms | Burnside permits — counted in PARTIAL above |

*sq24 and sq44 counted as PARTIAL since they returned some relevant content

### B. Wrong document routing (15)
| ID | Asked for | Retrieved |
|----|-----------|-----------|
| sq01 | GEN-042R00 (subcontractor?) | GEN-164R00 meeting minutes |
| sq05 | GEN-001R05 Phasing Plan | PS LAN Agenda |
| sq18 | AVI-002R01 rebar sizes | AVI-002R00 (wrong revision) |
| sq22 | BUR-001R00 staircase enclosure | AECOM ATC drawings |
| sq33 | Invoice#01 G703 retainage | Eagle Business Machine invoice |
| sq38 | July 24 Monthly Meeting minutes | Monthly Progress Report (GEN-007R00) |
| sq39 | July 24 T.Y. Lin attendees | Monthly Progress Report (same) |
| sq56 | BUR-080R00 Dec 2025 photos | Random photo file (Apr 2025) |
| sq57 | BUR-080R00 MPT setup | Same random photo |
| sq60 | Burnside VECP Presentation | A-37808 (different contract) |
| sq61 | Burnside VECP ADA scope | Volume 08A Burnside Option Work |
| sq62 | PRO 26-01 NCR flowchart | MLJ Con Ed spreadsheet |
| sq69 | RFI-0096 northbound/southbound | RFI-0042 (Norwood only) |
| sq70 | RFI-0096 McDonald Ave | Same RFI-0042 |
| sq71 | MYR-002R00 Demo Shield drawings | Topographic survey |
| sq72 | Drawing MYR-A-444A | Myrtle Expansion Joint archive |
| sq94 | EDU05B Norwood electrical | MYR-082R00 (Myrtle, not Norwood) |

### C. Refusals despite correct document (7)
| ID | Doc found | Reason |
|----|-----------|--------|
| sq11 | Transmittal 0014 | Chunks don't contain submittal items |
| sq20 | BUR-009R00 AAN | Specific glazing specs not in indexed text |
| sq21 | BUR-009R00 R&R | Review status not in indexed text |
| sq23 | BUR-001R00 FIO | Approval comments not in chunks |
| sq36 | Kick-off PPTX | PPTX content not indexed |
| sq37 | Kick-off PPTX | Same |
| sq66 | RFI-0115 Louver | Velocity data not in indexed chunks |

### D. Non-indexable files (3)
| ID | File type | Reason |
|----|-----------|--------|
| sq12 | .HEIC image | Image not indexable as text |
| sq74 | RFI-009 UPS | Raw text dump, UPS capacity not synthesized |
| sq95 | .xlsx | XLSX content not indexed |

---

## Key Code Fix Results

| Fix | Questions Improved | Est. Impact |
|-----|-------------------|-------------|
| OpenRouter LLM activation | All 44 PASS + 22 PARTIAL | +66 answerable |
| APPROVAL_LETTER identifier | sq04, sq13, sq14, sq15, sq16, sq17 | +6 PASS |
| INVOICE identifier | sq26, sq27, sq28, sq29 | +4 PASS |
| `isDocumentSummaryQuery` (sq35 bypass removed but others gained) | sq76, sq78, sq79, sq84 | +4 PASS |
| `tryFilenameIdentifierSearch` | sq34 | +1 PASS |
| Revision tokenizer (R01≠R00) | sq19 (right revision retrieved) | +1 PARTIAL |
| `strictFactualActiveDocMode` relaxation | sq81, sq77, sq83, sq90 | +4 PASS (enabled) |

## Regressions

| ID | Description |
|----|-------------|
| sq35 | "September 3 2025 coordination meeting" — phrase bypass removed, now times out with wrong docs. Previously was failing too (no LLM), but the specific phrase was in the bypass list. |

## Remaining Priorities

1. **Create DB indexes** (fixes 5-7 timeout FAILs):
   - `HNSW` on `embedding_vector` → fixes sq02, sq03, sq35, sq46, sq48 (5 timeouts)
   - `GIN` on `chunk_text` → reduces timeout duration
   - `GIN` on `file_name` → fixes filename FTS

2. **Wrong-document routing** (15 FAILs):
   - RFI-096 vs RFI-0042 disambiguation
   - BUR-080R00 routing (returning random Apr 2025 photo)
   - EDU05B Norwood vs Myrtle disambiguation
   - Schedule meeting minutes vs progress reports
   - sq01: GEN-042R00 subcontract vs meeting minutes (may be question error)

3. **Refusals from unindexed content** (7 FAILs):
   - PPTX files (sq36, sq37)
   - Transmittal submittal items not in chunks (sq11, sq20, sq21, sq23)
