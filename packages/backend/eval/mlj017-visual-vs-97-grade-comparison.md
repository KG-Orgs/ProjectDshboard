# Independent-grade comparison

| | Previous (`mlj017-97-grades.jsonl`) | Current (`mlj017-visual-grades.jsonl`) |
|---|---:|---:|
| PASS | 14 | 1 |
| PARTIAL | 18 | 3 |
| FAIL | 36 | 6 |
| UNGRADED | 29 | 8 |
| Graded total | 68 | 10 |

## Independent-grade change vs the previous run

Previous: `mlj017-97-grades.jsonl` · Current: `mlj017-visual-grades.jsonl` · 12 questions in both runs.

Comparison is on the independent grade, not on "answered vs refused": a question that moved from an answer to a refusal only counts as a regression when the benchmark says the fact is present.

```text
Improved:
  FAIL → PASS           1
  FAIL → PARTIAL        1

Regressed:
  PARTIAL → FAIL        1

Unchanged:
  FAIL → FAIL           5
  PARTIAL → PARTIAL     2

Not comparable (ungraded on one side):
  UNGRADED → UNGRADED   2
```

Only in the current run: vf01, vf02, vf03, vf04, vf05, vf06 · only in the previous run: sq01, sq02, sq03, sq04, sq05, sq06, sq07, sq08, sq09, sq10, sq11, sq12, sq13, sq14, sq15, sq16, sq17, sq18, sq21, sq22, sq24, sq26, sq27, sq28, sq29, sq30, sq31, sq33, sq34, sq35, sq36, sq37, sq38, sq39, sq40, sq41, sq42, sq43, sq44, sq45, sq46, sq47, sq48, sq49, sq59, sq60, sq61, sq62, sq63, sq64, sq65, sq66, sq67, sq69, sq71, sq73, sq74, sq75, sq76, sq77, sq78, sq79, sq80, sq81, sq82, sq83, sq84, sq85, sq86, sq87, sq88, sq89, sq90, sq91, sq92, sq93, sq94, sq95, sq96, sq97, sq98, sq99, sq100, sq101, sq102

### Regressions (1)

#### sq54 — PARTIAL → FAIL

**Question:** In BUR-081R00 January 2026 Construction Photos, what safety measures and MPT signage are visible in the January 20, 2026 photos?

**Expected facts:**

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

**Previous grade:** 🟡 PARTIAL — The citation supports the claim that specific MPT signage is not detailed, but it does not support the claim that specific safety measures are not detailed.

**Current grade:** 🔴 FAIL — The claim about 'shielding' is supported by the citation. However, the claim about 'MFM' signage is not supported as MPT signage, and the document does not specify MPT signage. [rubric aggregation returned FAIL where the grader said PARTIAL]

**Likely failure category:** `WRONG_FACT`

<details><summary>Previous answer</summary>

```text
The available information for BUR-081R00 does not detail specific safety measures or MPT signage visible in the January 20, 2026 photos. [[1]](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff)

### Sources

[1] **a37806 01 32 10 bur-081r00 - fio -** — [View source](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff)
```

</details>

<details><summary>Current answer</summary>

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

### Improvements (2)

- **sq57** FAIL → PASS — The answer correctly identifies one of the staging areas and correctly states that no material deliveries are documented. However, it includes additional staging areas that are not explicitly listed as 'staging areas' in the document, even though they might be related to construction activities. The prompt specifically asks for 'staging areas documented', implying explicit mentions or clear designations. The additional items are descriptions of work areas or equipment rather than designated staging areas. [rubric aggregation returned PASS where the grader said PARTIAL]
- **sq72** FAIL → PARTIAL — All claims made in the answer are supported by the provided citations.

