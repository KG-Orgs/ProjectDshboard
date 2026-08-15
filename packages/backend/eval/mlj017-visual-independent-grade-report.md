# Independent Answer Grading — 18 questions

**Run under test:** `eval/mlj017-visual-run.jsonl`
**Benchmark:** `eval/mlj017-97-expected.json`

This grade is produced outside the answer pipeline. It measures whether the final
user-visible answer is actually correct against benchmark reference facts, and is kept
strictly separate from the pipeline's own status (`complete`, `partial`, `not_found`,
`source_mismatch`, `deterministic`), which describes pipeline behaviour rather than
correctness. A `complete` answer can grade FAIL; a `not_found` answer can grade PASS.

## Summary

### Independent Quality Grade

```text
PASS        1/10    10.0%
PARTIAL     3/10    30.0%
FAIL        6/10    60.0%
```

Denominator is the 10 questions that have benchmark reference facts. 8 of 18 questions are **UNGRADED** — no reference facts recorded yet, or the grader was unavailable. Graded rows by ground truth: 0 human-verified · 10 machine-drafted · 0 other.

> On 2 questions the fixed rubric aggregated the per-field results to a different grade than the grader's own overall label. The rubric wins; each case notes the disagreement.

### Production status × independent grade

| Production status | PASS | PARTIAL | FAIL | UNGRADED | Total |
|---|---:|---:|---:|---:|---:|
| complete | 0 | 3 | 2 | 4 | 9 |
| partial | 1 | 0 | 2 | 1 | 4 |
| deterministic | 0 | 0 | 0 | 2 | 2 |
| not_found | 0 | 0 | 2 | 1 | 3 |
| **all** | 1 | 3 | 6 | 8 | 18 |

- **2 `complete` → FAIL** — the pipeline reported the question fully answered and the answer is wrong. This is false confidence, the most expensive failure mode here.
- **2 `not_found` → FAIL** — the pipeline declined but the benchmark says the fact is in the corpus. These are retrieval or synthesis regressions, not safety.

### Failures by root cause

```text
Visual evidence missed  5
Missing fact            4
Wrong fact              3
Citation mismatch       3
False not-found         2
```

A question may carry more than one category, so the column does not sum to the FAIL count.

| Category | Questions |
|---|---|
| Visual evidence missed | [sq55](#sq55), [sq56](#sq56), [sq20](#sq20), [sq19](#sq19), [sq25](#sq25) |
| Missing fact | [sq55](#sq55), [sq72](#sq72), [sq20](#sq20), [sq68](#sq68) |
| Wrong fact | [sq54](#sq54), [sq23](#sq23), [sq25](#sq25) |
| Citation mismatch | [sq23](#sq23), [sq20](#sq20), [sq25](#sq25) |
| False not-found | [sq56](#sq56), [sq19](#sq19) |

---

## Per-question grades

<a id="sq54"></a>

### sq54 — 🔴 FAIL

**Q:** In BUR-081R00 January 2026 Construction Photos, what safety measures and MPT signage are visible in the January 20, 2026 photos?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf)</summary>

```text
- field: safety_measures_jan_20_2026
  essential: yes
  asks for: Safety Measures on January 20, 2026
  accepted values (any one is correct): "road plate protection plates" | "shielding"
  expected meaning: The document lists specific safety measures visible in the photos.
- field: mpt_signage_jan_20_2026
  essential: yes
  asks for: MPT Signage on January 20, 2026
  expected meaning: The document does not explicitly mention any MPT signage, only 'MPT' in general descriptions.
- notes: The document lists 'MPT' multiple times, but does not specify what kind of signage is visible. It only mentions 'MPT lead storage container' and 'MPT' in general descriptions of the location. 2 files carry this identifier; drafted from "A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf". Others: A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Video.zip.
```

</details>

**Independent grade:** 🔴 FAIL · production status `partial` · citations partially_supported · ground truth `draft`

- **Why:** The claim about 'shielding' is supported by the citation. However, the claim about 'MFM' signage is not supported as MPT signage, and the document does not specify MPT signage. [rubric aggregation returned FAIL where the grader said PARTIAL]
- **Decided by:** independent grader + rubric aggregation
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (BUR-081R00)
- **Expected evidence:** mismatch — expected p.2 in A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf, cited p.10/19; expected p.2 in A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf, cited p.10/19
- **Root cause:** `WRONG_FACT`

| Requested field | Essential | Result | Grader's note |
|---|---|---|---|
| Safety Measures on January 20, 2026 | yes | ✅ correct | The answer correctly identifies 'shielding' as a safety measure, which is an accepted value. |
| MPT Signage on January 20, 2026 | yes | ❌ incorrect | The document does not mention any specific MPT signage, only 'MPT' in general descriptions. The answer incorrectly states 'A sign with the letters "MFM" is visible on a chain-link fence' and attributes it to MPT signage. |

<details><summary>Graded answer text</summary>

```text
The January 20, 2026 photos in **BUR-081R00** show the following safety measures and MPT signage:

*   **Safety Measures:** Orange and white striped barriers, chain-link fences, a flashing yellow light on top of a pole, orange and red traffic cones, and a wooden platform or shielding installed beneath an elevated structure. [1, 2]
*   **MPT Signage:** A sign with the letters "**MFM**" is visible on a chain-link fence. [[2]](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff:19)

**Sources:**

* [1] [a37806 01 32 10 bur-081r00 - fio -](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff:10), p. 10
* [2] [a37806 01 32 10 bur-081r00 - fio -](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff:19), p. 19
* [3] [a37806 01 32 10 bur-081r00 - fio -](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff)
```

</details>

---

<a id="sq55"></a>

### sq55 — 🟡 PARTIAL

**Q:** In BUR-081R00 January 2026 Construction Photos, what excavation or foundation work is documented at the Burnside Avenue northbound side?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf)</summary>

```text
- field: coned_utility_relocation_work_trench_with_road_plate_protection_plates
  essential: yes
  asks for: Coned utility relocation work trench with road plate protection plates
  accepted values (any one is correct): "Coned utility relocation work trench with road plate protection plates"
- field: demo_shielding_installation_in_progress
  essential: yes
  asks for: Demo shielding installation in progress
  accepted values (any one is correct): "demo shielding installation in progress"
- field: coned_utility_relocation_work_trench_with_road_plate_protection_and_shielding
  essential: yes
  asks for: Coned utility relocation work trench with road plate protection & shielding
  accepted values (any one is correct): "Coned utility relocation work trench with road plate protection & shielding"
- notes: The document lists several items related to 'Burnside Ave NB side'. I have extracted the ones that describe excavation or foundation work. 2 files carry this identifier; drafted from "A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf". Others: A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Video.zip.
```

</details>

**Independent grade:** 🟡 PARTIAL · production status `complete` · citations supported · ground truth `draft`

- **Why:** The provided citations support the claims made in the answer.
- **Decided by:** independent grader + rubric aggregation
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (BUR-081R00)
- **Expected evidence:** mismatch — no citation in A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf; no citation in A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf; no citation in A37806_01 32 10_BUR-081R00 - FIO - January 2026  Construction Photos.pdf
- **Root cause:** `MISSING_FACT`, `VISUAL_EVIDENCE_MISSED`

| Requested field | Essential | Result | Grader's note |
|---|---|---|---|
| Coned utility relocation work trench with road plate protection plates | yes | ✅ correct | The answer mentions 'utility relocation trench work with road plate protection'. |
| Demo shielding installation in progress | yes | ✅ correct | The answer mentions 'demolition shielding installation'. |
| Coned utility relocation work trench with road plate protection & shielding | yes | ➖ missing | The answer does not explicitly mention 'Coned utility relocation work trench with road plate protection & shielding' as a single item, but rather separates the utility work and shielding. |

<details><summary>Graded answer text</summary>

```text
On the **Burnside Avenue northbound side**, the **January 2026** construction photos for **BUR-081R00** document **utility relocation trench work with road plate protection** and **demolition shielding installation** [[1]](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff).

**Source:** [a37806 01 32 10 bur-081r00 - fio -](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff)
```

</details>

---

<a id="sq56"></a>

### sq56 — 🔴 FAIL

**Q:** In BUR-080R00 Burnside December 2025 Construction Photos, on what dates were the photos taken and what site conditions are shown?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf)</summary>

```text
- field: photo_dates
  essential: yes
  asks for: Dates photos were taken
  accepted values (any one is correct): "12/22/2025"
- field: site_conditions
  essential: yes
  asks for: Site conditions shown
  accepted values (any one is correct): "NB side MPT area and preperation for J4 shielding installation" | "Underside of J4 NB side" | "Underside of J4 NB side preperation for shielding." | "SB side general view of existing conditions head of utility work" | "JM track girder flange and web abatement"
- notes: 2 files carry this identifier; drafted from "A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf". Others: A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Video.zip.
```

</details>

**Independent grade:** 🔴 FAIL · production status `complete` · citations unavailable · ground truth `draft`

- **Why:** the benchmark records the requested fact as present, but the answer reports it as unavailable (every line of the rendered answer reports absent information)
- **Decided by:** deterministic rule (no grader call needed)
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (BUR-080R00)
- **Expected evidence:** mismatch — no citation in A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf; no citation in A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf
- **Root cause:** `FALSE_NOT_FOUND`, `VISUAL_EVIDENCE_MISSED`
<details><summary>Graded answer text</summary>

```text
I found a37806 01 32 10 bur-080r00 - fio -, but the requested information could not be verified from the extracted text or available visual inspection.
This looks like a question the page image would answer; visual inspection was not available for this document.
```

</details>

---

<a id="sq57"></a>

### sq57 — 🟢 PASS

**Q:** In BUR-080R00 Burnside December 2025 Construction Photos, what staging areas and material deliveries are documented?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf)</summary>

```text
- field: staging_areas_documented
  essential: yes
  asks for: Staging Areas Documented
  accepted values (any one is correct): "NB side MPT area"
- field: material_deliveries_documented
  essential: yes
  asks for: Material Deliveries Documented
  expected meaning: The document does not mention any material deliveries.
- notes: The document lists 'NB side MPT area' as a documented staging area. It does not mention any material deliveries. 2 files carry this identifier; drafted from "A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf". Others: A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Video.zip.
```

</details>

**Independent grade:** 🟢 PASS · production status `partial` · citations supported · ground truth `draft`

- **Why:** The answer correctly identifies one of the staging areas and correctly states that no material deliveries are documented. However, it includes additional staging areas that are not explicitly listed as 'staging areas' in the document, even though they might be related to construction activities. The prompt specifically asks for 'staging areas documented', implying explicit mentions or clear designations. The additional items are descriptions of work areas or equipment rather than designated staging areas. [rubric aggregation returned PASS where the grader said PARTIAL]
- **Decided by:** independent grader + rubric aggregation
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (BUR-080R00)
- **Expected evidence:** partial — expected p.-1 in A37806_01 32 10_BUR-080R00 - FIO - Burnside December 2025  Construction Photos.pdf, cited p.2/25

| Requested field | Essential | Result | Grader's note |
|---|---|---|---|
| Staging Areas Documented | yes | ✅ correct | The answer correctly identifies "NB side MPT area" as a documented staging area. |
| Material Deliveries Documented | yes | ✅ correct | The answer correctly states that no explicit material deliveries are visible in the act of being delivered, which aligns with the expected meaning that the document does not mention any material deliveries. |

<details><summary>Graded answer text</summary>

```text
The document BUR-080R00 shows the following staging areas:
*   **Northbound (NB) side Maintenance and Protection of Traffic (MPT) area** [[1]](#citation:9a5683cb-0459-4692-9be0-c68655d972fb)
*   **Preparation for J4 shielding installation** [[1]](#citation:9a5683cb-0459-4692-9be0-c68655d972fb)
*   **Underside of J4 NB side** [[1]](#citation:9a5683cb-0459-4692-9be0-c68655d972fb)
*   A construction staging area with various materials and equipment, including a stack of orange safety cones, enclosed by orange and white striped barriers and chain-link fencing [[3]](#citation:9a5683cb-0459-4692-9be0-c68655d972fb:25).

No explicit material deliveries are visible in the act of being delivered [[3]](#citation:9a5683cb-0459-4692-9be0-c68655d972fb:25).

**Sources:**

* [1] [a37806 01 32 10 bur-080r00 - fio -](#citation:9a5683cb-0459-4692-9be0-c68655d972fb)
* [2] [a37806 01 32 10 bur-080r00 - fio -](#citation:9a5683cb-0459-4692-9be0-c68655d972fb:2), p. 2
* [3] [a37806 01 32 10 bur-080r00 - fio -](#citation:9a5683cb-0459-4692-9be0-c68655d972fb:25), p. 25
```

</details>

---

<a id="sq58"></a>

### sq58 — ⚪ UNGRADED

**Q:** In MYR-076R00 Myrtle December 2025 Construction Photos, what elevator or stair construction progress is shown at Myrtle Avenue station?

<details><summary>Expected facts (missing, llm-draft-text-layer:A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf)</summary>

```text
- notes: The document is a cover sheet and a photo log entry. The photo log entry mentions "Myrtle Ave work area vibration monitoring equipment installation" but does not describe any elevator or stair construction progress at Myrtle Avenue station. 2 files carry this identifier; drafted from "A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Photos.pdf". Others: A37806_01 32 10_MYR-076R00 - FIO - Myrtle December 2025 Construction Video.zip. The drafting pass found no answer in this document's text layer. Left UNGRADED: only a human may record a fact as genuinely absent, because a wrong sibling document, a lost text layer, or truncation would each look identical here.
```

</details>

**Independent grade:** ⚪ UNGRADED · production status `partial` · citations unavailable · ground truth `missing`

- **Why:** the benchmark has no reference facts for this question yet
- **Decided by:** not graded
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (MYR-076R00)
<details><summary>Graded answer text</summary>

```text
At **Myrtle Avenue station** in December 2025, **excavation** and **Support of Excavation (SOE)** were in progress at **Melrose Street** for elevator or stair construction [1, 2]. No further details about the elevator or stair construction were verified from the available text or visual inspection of pages 2, 6, and 10.

**Sources:**

* [1] [a37806 01 32 10 myr-076r00 - fio -](#citation:5dd5ad85-395c-4cef-ab77-98b907bd22dc:2), p. 2
* [2] [a37806 01 32 10 myr-076r00 - fio -](#citation:5dd5ad85-395c-4cef-ab77-98b907bd22dc:6), p. 6
```

</details>

---

<a id="sq72"></a>

### sq72 — 🟡 PARTIAL

**Q:** In drawing MYR-A-444A, what dimensions and mounting details are shown for the EL1121/EL1122 elevator enclosure panels at Myrtle Avenue station?

<details><summary>Expected facts (draft, llm-draft-text-layer:MYR-A-444A.pdf)</summary>

```text
- field: panel_material_1
  essential: yes
  asks for: Material of EL1121/EL1122 elevator enclosure panels (type 1)
  accepted values (any one is correct): "STAINLESS STEEL HONEYCOMB PANEL INFILL" | "HONEYCOMB PANEL INFILL STAINLESS STEEL"
- field: panel_material_2
  essential: yes
  asks for: Material of EL1121/EL1122 elevator enclosure panels (type 2)
  accepted values (any one is correct): "SST HONEYCOMB INFILL PANEL"
- field: panel_material_3
  essential: yes
  asks for: Material of EL1121/EL1122 elevator enclosure panels (type 3)
  accepted values (any one is correct): "STAINLESS STEEL PANEL"
- field: door_height
  essential: yes
  asks for: Door height for EL1121/EL1122 elevator enclosure panels
  accepted values (any one is correct): "7'-0""
- field: mounting_details_signage
  essential: yes
  asks for: Mounting details for signage on EL1121/EL1122 elevator enclosure panels
  accepted values (any one is correct): "SST PANEL FOR SIGNAGE"
- field: mounting_details_fascia
  essential: yes
  asks for: Mounting details for fascia on EL1121/EL1122 elevator enclosure panels
  accepted values (any one is correct): "PERFORATED FASCIA" | "FASCIA PERFORATED"
```

</details>

**Independent grade:** 🟡 PARTIAL · production status `complete` · citations supported · ground truth `draft`

- **Why:** All claims made in the answer are supported by the provided citations.
- **Decided by:** independent grader + rubric aggregation
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (MYR-A-444A.pdf)
- **Expected evidence:** match — every expected evidence location was cited
- **Root cause:** `MISSING_FACT`

| Requested field | Essential | Result | Grader's note |
|---|---|---|---|
| Material of EL1121/EL1122 elevator enclosure panels (type 1) | yes | ✅ correct | The answer correctly identifies 'Stainless steel honeycomb panel infills' as a material. |
| Material of EL1121/EL1122 elevator enclosure panels (type 2) | yes | ➖ missing | The answer does not mention 'SST HONEYCOMB INFILL PANEL'. |
| Material of EL1121/EL1122 elevator enclosure panels (type 3) | yes | ➖ missing | The answer does not mention 'STAINLESS STEEL PANEL'. |
| Door height for EL1121/EL1122 elevator enclosure panels | yes | ✅ correct | The answer correctly states the door height as '7'-0"'. |
| Mounting details for signage on EL1121/EL1122 elevator enclosure panels | yes | ✅ correct | The answer correctly identifies 'SST panels for signage' as a mounting detail. |
| Mounting details for fascia on EL1121/EL1122 elevator enclosure panels | yes | ✅ correct | The answer correctly identifies 'Perforated fascia' as a mounting detail. |

<details><summary>Graded answer text</summary>

```text
The **EL1121/EL1122 elevator enclosure panels** at Myrtle Avenue station have a **door height of 7'-0"** [1, 2]. Mounting details include:

*   **Stainless steel honeycomb panel infills** [[2]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)
*   **SST panels for signage** [[2]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)
*   **Elevator door frames** [[2]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)
*   **8" concrete base curb with granite clad finish** [[2]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)
*   **Laminated glazing GL-10** [[2]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)
*   **Perforated fascia** [[2]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)

**Sources:**

* [1] [myr-a-444a](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c)
* [2] [myr-a-444a](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1), p. 1
```

</details>

---

<a id="sq23"></a>

### sq23 — 🔴 FAIL

**Q:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what structural steel members and connection details are shown for the staircase enclosure?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf)</summary>

```text
- field: structural_steel_members
  essential: yes
  asks for: Structural Steel Members
  expected meaning: The document does not specify any structural steel members for the staircase enclosure.
- field: connection_details
  essential: yes
  asks for: Connection Details
  expected meaning: The document does not specify any connection details for the staircase enclosure.
- notes: The document provides shop drawings for the Burnside Avenue Staircase Enclosure, but it focuses on architectural details such as panels, moldings, windows, doors, and concrete curbs. It does not contain information about structural steel members or their connection details. The drawings are labeled 'ARCHITECTURAL' and show elevations, plans, and sections of the enclosure walls, but not the underlying structural frame.
```

</details>

**Independent grade:** 🔴 FAIL · production status `partial` · citations unsupported · ground truth `draft`

- **Why:** The candidate answer incorrectly identifies architectural elements as structural steel members and architectural panel spacing as connection details. The cited source does not support these claims as structural information.
- **Decided by:** independent grader + rubric aggregation
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf)
- **Expected evidence:** mismatch — expected p.-1 in A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf, cited p.3/4/5; expected p.-1 in A37806_08 45 25_BUR-001R00 - FIO - Burnside Ave Staircase Enclosure Shop Drawings.pdf, cited p.3/4/5
- **Root cause:** `WRONG_FACT`, `CITATION_MISMATCH`

| Requested field | Essential | Result | Grader's note |
|---|---|---|---|
| Structural Steel Members | yes | ❌ incorrect | The document does not specify any structural steel members for the staircase enclosure. The answer incorrectly identifies '1"x6" molding and Nudo Ceramicsteel panels' as structural steel members. These are architectural finishes, not structural steel. |
| Connection Details | yes | ❌ incorrect | The document does not specify any connection details for the staircase enclosure. The answer incorrectly states 'Joints should be coordinated and spaced equally off-center' as connection details. This refers to the spacing of architectural panels, not structural connections. |

<details><summary>Graded answer text</summary>

```text
The **Burnside Avenue Staircase Enclosure Shop Drawings** show the following:

*   **Structural Steel Members:** 1"x6" molding and Nudo Ceramicsteel panels. [[1]](#citation:7b0f086a-0507-4097-b50d-cfa1f6525e45:5)
*   **Connection Details:** Joints should be coordinated and spaced equally off-center. [[1]](#citation:7b0f086a-0507-4097-b50d-cfa1f6525e45:5)

**Source:** [a37806 08 45 25 bur-001r00 - fio -](#citation:7b0f086a-0507-4097-b50d-cfa1f6525e45:5), p. 5
```

</details>

---

<a id="sq20"></a>

### sq20 — 🔴 FAIL

**Q:** In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what cab dimensions and finish materials are specified?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf)</summary>

```text
- field: inside_cab_width
  essential: yes
  asks for: Inside Cab Width
  accepted values (any one is correct): "54 inches" | "54"" | "54 1/4""
- field: inside_cab_depth
  essential: yes
  asks for: Inside Cab Depth
  accepted values (any one is correct): "80 inches" | "80""
- field: under_canopy_height
  essential: yes
  asks for: Under Canopy Height
  accepted values (any one is correct): "92 inches" | "92""
- field: overall_cab_height
  essential: yes
  asks for: Overall Cab Height
  accepted values (any one is correct): "96 inches" | "96""
- field: clear_inside_cab_width
  essential: yes
  asks for: Clear Inside Cab Width
  accepted values (any one is correct): "54 1/4 inches" | "54 1/4""
- field: clear_inside_cab_depth
  essential: yes
  asks for: Clear Inside Cab Depth
  accepted values (any one is correct): "80 inches" | "80""
- field: clear_inside_cab_height
  essential: yes
  asks for: Clear Inside Cab Height
  accepted values (any one is correct): "92 inches" | "92""
- field: finish_material_mt1
  essential: yes
  asks for: Finish Material MT-1
  accepted values (any one is correct): "STAINLESS STEEL #4 SATIN FINISH"
- field: finish_material_mt2
  essential: yes
  asks for: Finish Material MT-2
  accepted values (any one is correct): "RIGIDIZED METAL, PATTERN = 5WL, SATIN FINISH, 304 STAINLESS STEEL"
- field: finish_material_gl1
  essential: yes
  asks for: Finish Material GL-1
  accepted values (any one is correct): "9/16" THK CLEAR LOW IRON LAMINATED SAFETY GLASS (COMPLYING w/ ANSI Z97.1) w/ 3M VANDAL RESISTANT PROTECT"
- notes: 8 files carry this identifier; drafted from "A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf". Others: A37806_01 33 10_BUR-009R00 - FIO - DOT Permits Exp 6.09.26 & 6.07.26 & 6.12.26.pdf; A37806_05 12 00_BUR-009R00 - AAR - Temporary Shoring for Top Flange Replacement.pdf; A37806_05 12 00_BUR-009R00 - ORIG - Temporary Shoring for Top Flange Replacement, J4 JM Trks-MTA.pdf; A37806_05 12 00_BUR-009R00 - ORIG - Temporary Shoring for Top Flange Replacement.pdf; A37806_14 24 00_BUR-009R00 - FIO - EL539 Cab and Entrance Drawings-MTA.pdf.
```

</details>

**Independent grade:** 🔴 FAIL · production status `not_found` · citations unsupported · ground truth `draft`

- **Why:** The candidate answer states that the information could not be verified, which is incorrect as the information is present in the document. The document is cited, but the answer claims the information is not there.
- **Decided by:** independent grader + rubric aggregation
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (BUR-009R00)
- **Expected evidence:** mismatch — no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf; no citation in A37806_14 24 00_BUR-009R00 - ORIG - EL539 Cab and Entrance Drawings.pdf
- **Root cause:** `MISSING_FACT`, `CITATION_MISMATCH`, `VISUAL_EVIDENCE_MISSED`

| Requested field | Essential | Result | Grader's note |
|---|---|---|---|
| Inside Cab Width | yes | ➖ missing | The answer states that the information could not be verified. |
| Inside Cab Depth | yes | ➖ missing | The answer states that the information could not be verified. |
| Under Canopy Height | yes | ➖ missing | The answer states that the information could not be verified. |
| Overall Cab Height | yes | ➖ missing | The answer states that the information could not be verified. |
| Clear Inside Cab Width | yes | ➖ missing | The answer states that the information could not be verified. |
| Clear Inside Cab Depth | yes | ➖ missing | The answer states that the information could not be verified. |
| Clear Inside Cab Height | yes | ➖ missing | The answer states that the information could not be verified. |
| Finish Material MT-1 | yes | ➖ missing | The answer states that the information could not be verified. |
| Finish Material MT-2 | yes | ➖ missing | The answer states that the information could not be verified. |
| Finish Material GL-1 | yes | ➖ missing | The answer states that the information could not be verified. |

<details><summary>Graded answer text</summary>

```text
I found the correct document, but this information could not be verified from the extracted text, and the page could not be inspected.

**Source:** [a37806 14 24 00 bur-009r00 - aan -](#citation:3059d65f-590d-441a-9d14-e1288bd4452b)
```

</details>

---

<a id="sq19"></a>

### sq19 — 🔴 FAIL

**Q:** In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what revision history and approval dates are recorded in the title block?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_01 10 30_AVI-002R00 - Avenue I Temp Platform Drawings.pdf)</summary>

```text
- field: revision_history
  essential: yes
  asks for: Revision History
  expected meaning: The document does not contain a revision history table or section in the title block or elsewhere.
- field: approval_dates
  essential: yes
  asks for: Approval Dates
  expected meaning: The document does not contain specific approval dates in the title block or elsewhere.
- notes: The document contains a title block on page 1, but it does not include a revision history or approval dates. It has fields for 'Date', 'MLJTC2 PM's Review', and 'MLJTC2 Quality Manager', but these are blank or do not contain dates. 10 files carry this identifier; drafted from "A37806_01 10 30_AVI-002R00 - Avenue I Temp Platform Drawings.pdf". Others: A37806_01 33 10_AVI-002R00 - FIO - Tree Work Permits.pdf; A37806_01 10 00_AVI-002R01 - Avenue I ATC Comments Matrix.xlsx; A37806_05 50 00_AVI-002R00 - Elevator Pit Ladder Shop Drawings.pdf; A37806_05 12 00_AVI-002R00 - Ave I NB Stair Anchor Bolt Drawings.pdf; A37806_01 10 30_AVI-002R00 - Avenue I Temp Platform Drawings-AAN.pdf.
```

</details>

**Independent grade:** 🔴 FAIL · production status `not_found` · citations unavailable · ground truth `draft`

- **Why:** the benchmark records the requested fact as present, but the answer reports it as unavailable (every line of the rendered answer reports absent information)
- **Decided by:** deterministic rule (no grader call needed)
- **Document fidelity:** match — 5 of 8 returned source(s) match the pinned document (AVI-002)
- **Expected evidence:** mismatch — no citation in A37806_01 10 30_AVI-002R00 - Avenue I Temp Platform Drawings.pdf; no citation in A37806_01 10 30_AVI-002R00 - Avenue I Temp Platform Drawings.pdf
- **Root cause:** `FALSE_NOT_FOUND`, `VISUAL_EVIDENCE_MISSED`
<details><summary>Graded answer text</summary>

```text
I found the referenced document, but the revision history and approval dates recorded in the title block for **AVI-002 Ave I North Foundation Rebar Shop Drawings** could not be verified from the extracted text. This information may require reviewing the drawing visually.
```

</details>

---

<a id="sq25"></a>

### sq25 — 🔴 FAIL

**Q:** In GEN-001R02 Elevator Walls Formwork Drawing, what was the AE reviewer's final disposition and were any comments issued?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_03 10 00_GEN-001R02 - AAN - Elevator Walls Formwork Drawing.pdf)</summary>

```text
- field: ae_reviewer_final_disposition
  essential: yes
  asks for: AE reviewer's final disposition
  accepted values (any one is correct): "Approved as Noted" | "AAN"
- field: comments_issued
  essential: yes
  asks for: comments issued
  accepted values (any one is correct): "Yes"
  expected meaning: The document contains comments from the AE reviewer.
- notes: The document explicitly states 'AAN = Approved as Noted' and then provides specific review comments, indicating that comments were indeed issued. 18 files carry this identifier; drafted from "A37806_03 10 00_GEN-001R02 - AAN - Elevator Walls Formwork Drawing.pdf". Others: A37806_08 11 13_GEN-001R02 - AAN - D&D Door and Frame Shop Drawings.pdf; A37806_05 12 00_GEN-001R02 - FIO - McMahon's Welding Procedure-MTA.pdf; A37806_05 12 00_GEN-001R02 - RWC - McMahon's Welding Procedure-MTA.pdf; A37806_03 10 00_GEN-001R02 - RWC - Elevator Walls Formwork Drawing - MTA.pdf; A37806_05 12 00_GEN-001R02 - McMahon's Welding Procedure.pdf.
```

</details>

**Independent grade:** 🔴 FAIL · production status `complete` · citations unsupported · ground truth `draft`

- **Why:** The candidate answer incorrectly identifies the final disposition as 'Reviewed with Comments' based on a document that is not the correct one for the 'Elevator Walls Formwork Drawing' with an 'AAN' disposition. The provided citations refer to a document with 'RWC' in its title, which stands for 'Reviewed with Comments', leading to the incorrect disposition. The question specifically asks about the 'AAN' disposition for this drawing, which implies a different document.
- **Decided by:** independent grader + rubric aggregation
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (GEN-001R02)
- **Expected evidence:** match — every expected evidence location was cited
- **Root cause:** `WRONG_FACT`, `CITATION_MISMATCH`, `VISUAL_EVIDENCE_MISSED`

| Requested field | Essential | Result | Grader's note |
|---|---|---|---|
| AE reviewer's final disposition | yes | ❌ incorrect | The candidate states "Reviewed with Comments" but the expected disposition is "Approved as Noted" or "AAN". |
| comments issued | yes | ✅ correct | The candidate correctly states that comments were issued. |

<details><summary>Graded answer text</summary>

```text
The AE reviewer's final disposition for the **Elevator Walls Formwork Drawing (GEN-001R02)** was **"Reviewed with Comments"** [1, 2]. Comments were issued, instructing the submitter to **"Please check the attachment"** [1, 2].

**Sources:**

* [1] [a37806 03 10 00 gen-001r02 - rwc -](#citation:4967005e-c653-4721-b139-7a618e88411c)
* [2] [a37806 03 10 00 gen-001r02 - rwc -](#citation:4967005e-c653-4721-b139-7a618e88411c:2), p. 2
```

</details>

---

<a id="sq68"></a>

### sq68 — 🟡 PARTIAL

**Q:** In RFI098 for the Ave I Conductor Board, what track and platform dimensions are noted around Station 489+00 to 490+00?

<details><summary>Expected facts (draft, llm-draft-text-layer:A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf)</summary>

```text
- field: track_dimensions_489_490
  essential: yes
  asks for: track dimensions around Station 489+00 to 490+00
  expected meaning: The document does not provide specific track dimensions (e.g., width, length, gauge) around Station 489+00 to 490+00. It only mentions the presence of conductor boards and ADA boarding areas.
- field: platform_dimensions_489_490
  essential: yes
  asks for: platform dimensions around Station 489+00 to 490+00
  accepted values (any one is correct): "40-ft long"
- notes: The document mentions a '4-car train' in relation to the conductor board at Sta 489+00, but this refers to the train length the board corresponds to, not a dimension of the track or platform itself. The document also states that the 4-car conductor board area at Sta 489+00 does not include an ADA boarding area, and asks for confirmation if it can be disregarded, but this is not a dimension. 15 files carry this identifier; drafted from "A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf". Others: IMG_3130.JPEG; A37806_PRDC02_BUR-001R00 - FIO - Test Pit Report.pdf; A37806_RFI-0096 - Burnside NYCT Test Pit Confirmation.pdf; IMG_3114.JPEG; IMG_3117.JPEG.
```

</details>

**Independent grade:** 🟡 PARTIAL · production status `complete` · citations supported · ground truth `draft`

- **Why:** The answer correctly identifies the 40-ft long ADA boarding area, which is a platform dimension. However, it fails to state that no specific track dimensions are provided in the document for the specified area.
- **Decided by:** independent grader + rubric aggregation
- **Document fidelity:** match — 2 of 2 returned source(s) match the pinned document (RFI098)
- **Expected evidence:** partial — expected p.-1 in A37806_ADA P6_RFI098 Ave I Conductor Board at STA 489+00.pdf, cited p.1
- **Root cause:** `MISSING_FACT`

| Requested field | Essential | Result | Grader's note |
|---|---|---|---|
| track dimensions around Station 489+00 to 490+00 | yes | ➖ missing | The answer does not state that there are no specific track dimensions mentioned in the document for this area. |
| platform dimensions around Station 489+00 to 490+00 | yes | ✅ correct | The answer correctly identifies the 40-ft long ADA boarding area as a platform dimension. |

<details><summary>Graded answer text</summary>

```text
At **Avenue I station**, the following track and platform dimensions are noted around Station 489+00 to 490+00 in **RFI098**:

*   At **Station 490+00**, a **40-ft long ADA boarding area** is centered on the conductor board on the **northbound platform (Track B2)**. [1, 2]
*   At **Station 489+00**, which corresponds to a **4-car train conductor board**, no ADA boarding area or path of travel is shown. [[1]](#citation:44748099-b4af-413c-a572-6cb21936ad5c:1)

**Sources:**

* [1] [a37806 ada p6 rfi098 ave i conductor board](#citation:44748099-b4af-413c-a572-6cb21936ad5c:1), p. 1
* [2] [a37806 ada p6 rfi098 ave i conductor board](#citation:44748099-b4af-413c-a572-6cb21936ad5c:1), p. 1
```

</details>

---

<a id="sq70"></a>

### sq70 — ⚪ UNGRADED

**Q:** In A37806 RFI096, what dimensional discrepancy or field condition prompted the RFI at the McDonald Avenue station?

<details><summary>Expected facts (missing, llm-draft-text-layer:A37806_ADA P6_RFI096.pdf)</summary>

```text
- notes: The document is a Request For Information (RFI) related to ADA Upgrades Package 6, but it does not contain any information about a dimensional discrepancy or field condition at the McDonald Avenue station. The RFI itself is about HVAC controls and fire alarm shutdown requirements for Elevator Machine Rooms (EMRs) and refers to RFI-119. The document mentions several stations (Middletown Road, Avenue I, Myrtle Avenue, Burnside Avenue, Norwood Avenue) but not McDonald Avenue. The drafting pass found no answer in this document's text layer. Left UNGRADED: only a human may record a fact as genuinely absent, because a wrong sibling document, a lost text layer, or truncation would each look identical here.
```

</details>

**Independent grade:** ⚪ UNGRADED · production status `not_found` · citations unavailable · ground truth `missing`

- **Why:** the benchmark has no reference facts for this question yet
- **Decided by:** not graded
- **Document fidelity:** match — 1 of 1 returned source(s) match the pinned document (A37806_ADA P6_RFI096.pdf)
<details><summary>Graded answer text</summary>

```text
I found the correct document, but the requested dimensional discrepancy or field condition that prompted the RFI at the **McDonald Avenue station** could not be verified from the extracted text or from visual inspection of pages **23, 24, and 28**.

Evidence: a37806 ada p6 rfi096 (p. 9, 23, 24).
```

</details>

---

<a id="vf01"></a>

### vf01 — ⚪ UNGRADED

**Q:** In the MTACD-MLJTC2-L-0024 letter, which submittal designation checkbox is selected?

**Independent grade:** ⚪ UNGRADED · production status `deterministic` · citations unavailable

- **Why:** no benchmark entry exists for this question id
- **Decided by:** not graded
<details><summary>Graded answer text</summary>

```text
I found 25 03 19 a37806-mtacd-mljtc2-l-0024 - sub-contractor approval –, but the requested information could not be verified from the extracted text or from visual inspection of page 1.
Nothing on those pages showed the requested detail clearly enough to report it.
Point me at a specific page or detail callout and I will inspect that page.
```

</details>

---

<a id="vf02"></a>

### vf02 — ⚪ UNGRADED

**Q:** In Transmittal 0014 for MTA Personnel and PMC Supplies, which review/approval designation is marked on the transmittal?

**Independent grade:** ⚪ UNGRADED · production status `complete` · citations unavailable

- **Why:** no benchmark entry exists for this question id
- **Decided by:** not graded
<details><summary>Graded answer text</summary>

```text
The review/approval designation marked on **Transmittal 0014** for MTA Personnel and PMC Supplies is **"Review and Comment"** [[1]](#citation:831e1eb6-9300-41a2-bcf5-268ca4ceb497:1).

**Source:** [a37806 transmittal 0014 - mta personnel and pmc](#citation:831e1eb6-9300-41a2-bcf5-268ca4ceb497:1), p. 1
```

</details>

---

<a id="vf03"></a>

### vf03 — ⚪ UNGRADED

**Q:** In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, is a signature visible on the letter and what printed name and title appear beside it?

**Independent grade:** ⚪ UNGRADED · production status `complete` · citations unavailable

- **Why:** no benchmark entry exists for this question id
- **Decided by:** not graded
<details><summary>Graded answer text</summary>

```text
Yes, the **MTACD-MLJTC2-L-0024 sub-contractor approval letter** includes two signature lines [[1]](#citation:947e03ed-ffc4-40c6-b785-334779281ea2:1).

The printed names and titles are:
*   **Mekh Gurung, CCM**, Naik/TYLin JV, Sr. Project Manager [[1]](#citation:947e03ed-ffc4-40c6-b785-334779281ea2:1)
*   **Michael Wilson, MBA, CCM**, MTA C&D, Senior Director, PCEO [[1]](#citation:947e03ed-ffc4-40c6-b785-334779281ea2:1)

**Source:** [25 03 19 a37806-mtacd-mljtc2-l-0024 - sub-contractor approval –](#citation:947e03ed-ffc4-40c6-b785-334779281ea2:1), p. 1
```

</details>

---

<a id="vf04"></a>

### vf04 — ⚪ UNGRADED

**Q:** What sheet number and revision are shown in the title block of drawing MYR-A-444A?

**Independent grade:** ⚪ UNGRADED · production status `complete` · citations unavailable

- **Why:** no benchmark entry exists for this question id
- **Decided by:** not graded
<details><summary>Graded answer text</summary>

```text
The title block of drawing **MYR-A-444A** shows:

*   **Sheet Number:** MYR-A-444A [[1]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)
*   **Revision:** — [[1]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)

**Source:** [myr-a-444a](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1), p. 1
```

</details>

---

<a id="vf05"></a>

### vf05 — ⚪ UNGRADED

**Q:** In the MTACD-MLJTC2-L-0017 subcontractor approval letter, on what date was MASE FX approved?

**Independent grade:** ⚪ UNGRADED · production status `complete` · citations unavailable

- **Why:** no benchmark entry exists for this question id
- **Decided by:** not graded
<details><summary>Graded answer text</summary>

```text
**MASE FX** was approved on **March 19, 2025**. [[1]](#citation:f8cb1aab-16ff-4366-9fad-8f054bf90124)

**Source:** [25 03 19 a37806-mtacd-mljtc2-l-0017 - subcontractor approval mase](#citation:f8cb1aab-16ff-4366-9fad-8f054bf90124)
```

</details>

---

<a id="vf06"></a>

### vf06 — ⚪ UNGRADED

**Q:** In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what concrete cover requirements are specified for surfaces exposed to earth or weather?

**Independent grade:** ⚪ UNGRADED · production status `deterministic` · citations unavailable

- **Why:** no benchmark entry exists for this question id
- **Decided by:** not graded
<details><summary>Graded answer text</summary>

```text
## Section 6.3 Requirements Summary (a37806 03 20 00 avi-002r02 - fio -)
- Reviewed indexed section evidence from page(s): 2.
- Key requirements captured from the section:
- 43'-6 1/2" T/ OPNG 3 3 COATED REBAR EPOXY U.O.N.
- REP01ELEVATOR PIT REINFORCEMENT DETAILS (NORTH) AVENUE I STATION PACKAGE 6 BROOKLYN KM#25-067 - - GB 12/02/2025 0 12/02/2025 FOR APPROVAL 1 02/11/2026 AAN PER EOR MARKUPS (DTD.01.06.2026) & REVISED PER UPDATED SET (DTD.01.23.2026) & SK-044 (DTD.02.02.2026)...

Evidence: a37806 03 20 00 avi-002r02 - fio - (p. 2).
```

</details>

---

