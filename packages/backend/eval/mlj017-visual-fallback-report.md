# Visual Evidence Fallback — Verification Run

**Project:** `145b3dcf-272e-4c45-9e19-953f20f25bb9`
**Run started:** 2026-08-14T04:23:46.921Z
**Questions:** 18 (from `eval/mlj017-visual-questions.json`)
**Vision model:** `(chat model)` · **render DPI:** 200 · **max pages/question:** 3

## Stage under test

```
locked document
  → text retrieval + text evidence extraction
  → is the evidence sufficient?
  → if insufficient AND likely visual:
       visual page selection → render → vision → merge text + visual
  → answer completeness validation   (visual is checked BEFORE not_found)
```

## Summary

| Metric | Count |
|---|---|
| Visual fallback triggered | 11/18 |
| Returned page observations | 8 |
| Changed answer status (would have been refused on text alone) | 8 |
| Stage could not run (render/source/vision unavailable) | 1 |
| Negative controls that correctly did **not** spend a vision call | 2/2 |
| Failed verification checks | 0 |

> Every applicable check passed.

## Index

| Id | Case | Triggered | Pages inspected | Observations | Status |
|---|---|---|---|---|---|
| sq54 | photo — visible safety measures and signage | yes | 2, 10, 19 | 3 | partial |
| sq55 | photo — documented excavation work | no | — | 0 | complete |
| sq56 | photo — site conditions shown | no | — | 0 | complete |
| sq57 | photo — staging areas and deliveries | yes | 2, 25, 49 | 3 | partial |
| sq58 | photo — elevator/stair progress shown | yes | 2, 6, 10 | 2 | partial |
| sq72 | drawing — dimensions and mounting details | yes | 1 | 9 | complete |
| sq23 | drawing — members and connection details shown | yes | 3, 4, 5 | 3 | partial |
| sq20 | drawing — cab dimensions and finishes | yes | — | 0 | not_found |
| sq19 | title block — revision history and approval dates | no | — | 0 | not_found |
| sq25 | title block / stamp — reviewer disposition | no | — | 0 | complete |
| sq68 | drawing — dimensions noted at stationing | yes | 1 | 1 | complete |
| sq70 | drawing/markup — field condition that prompted the RFI | yes | 23, 24, 28 | 0 | not_found |
| vf01 | checkbox — which submittal designation is selected (the flagship lost-visual-state case) | yes | 1 | 0 | deterministic |
| vf02 | checkbox — printed options vs the marked one | yes | 1 | 1 | complete |
| vf03 | signature — is a signature visibly present | no | — | 0 | complete |
| vf04 | title block — sheet number and revision read visually | yes | 1 | 2 | complete |
| vf05 | negative control — a plain text lookup that must NOT trigger vision | no | — | 0 | complete |
| vf06 | negative control — a specification text question that must NOT trigger vision | no | — | 0 | deterministic |

---

## sq54 — photo — visible safety measures and signage

**Question:** In BUR-081R00 January 2026 Construction Photos, what safety measures and MPT signage are visible in the January 20, 2026 photos?

**Answer as the user sees it:**

The January 20, 2026 photos in **BUR-081R00** show the following safety measures and MPT signage:

*   **Safety Measures:** Orange and white striped barriers, chain-link fences, a flashing yellow light on top of a pole, orange and red traffic cones, and a wooden platform or shielding installed beneath an elevated structure. [1, 2]
*   **MPT Signage:** A sign with the letters "**MFM**" is visible on a chain-link fence. [[2]](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff:19)

**Sources:**

* [1] [a37806 01 32 10 bur-081r00 - fio -](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff:10), p. 10
* [2] [a37806 01 32 10 bur-081r00 - fio -](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff:19), p. 19
* [3] [a37806 01 32 10 bur-081r00 - fio -](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff)

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.75, task types `photo`
- Trigger: **yes** — text evidence did not contain the answer and the question is likely visual (photo)
- Pages selected: 2, 10, 19
- Pages inspected: 2, 10, 19
- p.10 (confidence 0.90) — **safety measures:** Orange and white striped barriers, chain link fence, flashing yellow light on top of a pole, orange traffic cones, and a red traffic cone. _(Left side of the image, and in the middle of the road.)_
- p.19 (confidence 0.90) — **safety measures:** A chain-link fence is visible in the foreground, acting as a barrier. Above the fence, there appears to be a wooden platform or shielding installed beneath the elevated structure. _(Foreground and beneath the elevated structure)_
- p.19 (confidence 0.90) — **MPT signage:** A sign with the letters "MFM" is visible on the chain-link fence. _(On the chain-link fence in the foreground)_

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.75, task=photo
- ✅ pages selected, not the whole document — selected 2, 10, 19
- ✅ visual claims are tied to a page — observations on p.10, p.19
- ✅ visual evidence is citable/deep-linkable — 2 visual citation(s)
- ✅ no scale-based estimation — no estimation wording
- ✅ no inferred activity — no speculative wording
- — refusal states the pages were inspected and still could not verify — answered, not refused

---

## sq55 — photo — documented excavation work

**Question:** In BUR-081R00 January 2026 Construction Photos, what excavation or foundation work is documented at the Burnside Avenue northbound side?

**Answer as the user sees it:**

On the **Burnside Avenue northbound side**, the **January 2026** construction photos for **BUR-081R00** document **utility relocation trench work with road plate protection** and **demolition shielding installation** [[1]](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff).

**Source:** [a37806 01 32 10 bur-081r00 - fio -](#citation:4ba1a68d-6820-430b-bb8b-57c164029fff)

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.38, task types `photo`
- Trigger: no — text evidence already answered every requested part

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.38, task=photo
- — pages selected, not the whole document — stage did not trigger
- — visual claims are tied to a page — no visual observations produced
- — visual evidence is citable/deep-linkable — 0 visual citation(s)
- — no scale-based estimation — no estimation wording
- — no inferred activity — no speculative wording
- — refusal is an explicit inability to verify — answered, not refused

---

## sq56 — photo — site conditions shown

**Question:** In BUR-080R00 Burnside December 2025 Construction Photos, on what dates were the photos taken and what site conditions are shown?

**Answer as the user sees it:**

I found a37806 01 32 10 bur-080r00 - fio -, but the requested information could not be verified from the extracted text or available visual inspection.
This looks like a question the page image would answer; visual inspection was not available for this document.

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.75, task types `photo`
- Trigger: no — text evidence already answered every requested part

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.75, task=photo
- — pages selected, not the whole document — stage did not trigger
- — visual claims are tied to a page — no visual observations produced
- — visual evidence is citable/deep-linkable — 0 visual citation(s)
- — no scale-based estimation — no estimation wording
- — no inferred activity — no speculative wording
- — refusal is an explicit inability to verify — answered, not refused

---

## sq57 — photo — staging areas and deliveries

**Question:** In BUR-080R00 Burnside December 2025 Construction Photos, what staging areas and material deliveries are documented?

**Answer as the user sees it:**

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

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.38, task types `photo`
- Trigger: **yes** — text evidence did not contain the answer and the question is likely visual (photo)
- Pages selected: 2, 25, 49
- Pages inspected: 2, 25, 49
- p.2 (confidence 0.99) — **staging areas and material deliveries:** NB side MPT area and preperation for J4 shielding installation _(Rows 1-41 in the 'Description' column)_
- p.2 (confidence 0.99) — **staging areas and material deliveries:** Underside of J4 NB side _(Row 42 in the 'Description' column)_
- p.25 (confidence 0.90) — **staging areas and material deliveries:** The image shows a construction staging area enclosed by orange and white striped barriers and chain-link fencing. Within the fenced area, there are various construction materials and equipment, including what appears to be a stack of orange safety cones or similar items, and other unidentified materials. A dark-colored vehicle is parked within or adjacent to the fenced area on the right side of the image. There are no explicit material deliveries visible in the act of being delivered. _(The entire fenced-off area in the middle ground of the image.)_

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.38, task=photo
- ✅ pages selected, not the whole document — selected 2, 25, 49
- ✅ visual claims are tied to a page — observations on p.2, p.25
- ✅ visual evidence is citable/deep-linkable — 2 visual citation(s)
- ✅ no scale-based estimation — no estimation wording
- ✅ no inferred activity — no speculative wording
- — refusal states the pages were inspected and still could not verify — answered, not refused

---

## sq58 — photo — elevator/stair progress shown

**Question:** In MYR-076R00 Myrtle December 2025 Construction Photos, what elevator or stair construction progress is shown at Myrtle Avenue station?

**Answer as the user sees it:**

At **Myrtle Avenue station** in December 2025, **excavation** and **Support of Excavation (SOE)** were in progress at **Melrose Street** for elevator or stair construction [1, 2]. No further details about the elevator or stair construction were verified from the available text or visual inspection of pages 2, 6, and 10.

**Sources:**

* [1] [a37806 01 32 10 myr-076r00 - fio -](#citation:5dd5ad85-395c-4cef-ab77-98b907bd22dc:2), p. 2
* [2] [a37806 01 32 10 myr-076r00 - fio -](#citation:5dd5ad85-395c-4cef-ab77-98b907bd22dc:6), p. 6

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.75, task types `photo`
- Trigger: **yes** — visual state lost in extraction — extracted text lists 2 mutually exclusive options with no indication of which is selected
- Pages selected: 2, 6, 10
- Pages inspected: 2, 6, 10
- p.2 (confidence 1.00) — **elevator or stair construction progress:** 2025-12-19 Myrtle Ave excavation and SOE at Melrose St in progress _(Rows 4, 5, 7, 8, 9, 10, 11, 12 of the table under 'Description')_
- p.6 (confidence 0.90) — **elevator or stair construction progress:** The image shows orange construction barriers, traffic cones, and what appears to be excavation work on Myrtle Avenue. A backhoe is visible in the background. The caption states "Myrtle Ave excavation and SOE at Melrose St in progress". No specific elevator or stair construction is visibly present. _(The entire image and the caption at the bottom)_

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.75, task=photo
- ✅ pages selected, not the whole document — selected 2, 6, 10
- ✅ visual claims are tied to a page — observations on p.2, p.6
- ✅ visual evidence is citable/deep-linkable — 2 visual citation(s)
- ✅ no scale-based estimation — no estimation wording
- ✅ no inferred activity — no speculative wording
- — refusal states the pages were inspected and still could not verify — answered, not refused

---

## sq72 — drawing — dimensions and mounting details

**Question:** In drawing MYR-A-444A, what dimensions and mounting details are shown for the EL1121/EL1122 elevator enclosure panels at Myrtle Avenue station?

**Answer as the user sees it:**

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

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.75, task types `drawing`
- Trigger: **yes** — text evidence did not contain the answer and the question is likely visual (drawing)
- Pages selected: 1
- Pages inspected: 1
- p.1 (confidence 0.90) — **dimensions:** 7'-0" DOOR HEIGHT _(Left section, near the middle, pointing to the elevator door opening)_
- p.1 (confidence 0.90) — **mounting details:** STAINLESS STEEL HONEYCOMB PANEL INFILL _(Left section, top part of the elevator enclosure)_
- p.1 (confidence 0.90) — **mounting details:** SST HONEYCOMB INFILL PANEL _(Left section, middle part of the elevator enclosure)_
- p.1 (confidence 0.90) — **mounting details:** SST PANEL FOR SIGNAGE _(Left section, middle part of the elevator enclosure)_
- p.1 (confidence 0.90) — **mounting details:** ELEVATOR DOOR FRAMES _(Left section, middle part of the elevator enclosure)_
- p.1 (confidence 0.90) — **mounting details:** 8" CONCRETE BASE CURB W/ GRANITE CLAD FINISH _(Right section, bottom part of the elevator enclosure)_
- p.1 (confidence 0.90) — **mounting details:** LAMINATED GLAZING GL-10 _(Right section, middle part of the elevator enclosure)_
- p.1 (confidence 0.90) — **mounting details:** PERFORATED FASCIA _(Right section, top part of the elevator enclosure)_
- p.1 (confidence 0.90) — **mounting details:** STAINLESS STEEL HONEYCOMB PANEL INFILL _(Right section, top part of the elevator enclosure)_

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.75, task=drawing
- ✅ pages selected, not the whole document — selected 1
- ✅ visual claims are tied to a page — observations on p.1
- ✅ visual evidence is citable/deep-linkable — 1 visual citation(s)
- ✅ no scale-based estimation — no estimation wording
- ✅ no inferred activity — no speculative wording
- — refusal states the pages were inspected and still could not verify — answered, not refused

---

## sq23 — drawing — members and connection details shown

**Question:** In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what structural steel members and connection details are shown for the staircase enclosure?

**Answer as the user sees it:**

The **Burnside Avenue Staircase Enclosure Shop Drawings** show the following:

*   **Structural Steel Members:** 1"x6" molding and Nudo Ceramicsteel panels. [[1]](#citation:7b0f086a-0507-4097-b50d-cfa1f6525e45:5)
*   **Connection Details:** Joints should be coordinated and spaced equally off-center. [[1]](#citation:7b0f086a-0507-4097-b50d-cfa1f6525e45:5)

**Source:** [a37806 08 45 25 bur-001r00 - fio -](#citation:7b0f086a-0507-4097-b50d-cfa1f6525e45:5), p. 5

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.75, task types `drawing`
- Trigger: **yes** — text evidence did not contain the answer and the question is likely visual (drawing)
- Pages selected: 3, 4, 5
- Pages inspected: 3, 4, 5
- p.5 (confidence 0.90) — **structural steel members:** 1"x6" MOLDING _(Left view, top left, pointing to a horizontal member; Right view, top left, pointing to a horizontal member)_
- p.5 (confidence 0.90) — **structural steel members:** NUDO CERAMICSTEEL PANEL _(Left view, top center, pointing to a panel; Left view, bottom right, pointing to a panel; Right view, top center, pointing to a panel)_
- p.5 (confidence 0.90) — **connection details:** coordinate and make sure joints are spaced equally off the center _(Left view, top center, pointing to the joint of the NUDO CERAMICSTEEL PANEL; Right view, top center, pointing to the joint of the NUDO CERAMICSTEEL PANEL)_

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.75, task=drawing
- ✅ pages selected, not the whole document — selected 3, 4, 5
- ✅ visual claims are tied to a page — observations on p.5
- ✅ visual evidence is citable/deep-linkable — 1 visual citation(s)
- ✅ no scale-based estimation — no estimation wording
- ✅ no inferred activity — no speculative wording
- — refusal states the pages were inspected and still could not verify — answered, not refused

---

## sq20 — drawing — cab dimensions and finishes

**Question:** In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what cab dimensions and finish materials are specified?

**Answer as the user sees it:**

I found the correct document, but this information could not be verified from the extracted text, and the page could not be inspected.

**Source:** [a37806 14 24 00 bur-009r00 - aan -](#citation:3059d65f-590d-441a-9d14-e1288bd4452b)

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.38, task types `drawing`
- Trigger: **yes** — text evidence did not contain the answer and the question is likely visual (drawing)
- Could not complete: source_unavailable: local_corpus_file_missing:C:\Users\georg\Iovino Enterprises, LLC\MLJ-017 Package 6 - General\05 - SUBMITTALS\14 - CONVEYING EQUIPMENT\14 24 00\A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.38, task=drawing
- — pages selected, not the whole document — stage failed before selection: source_unavailable: local_corpus_file_missing:C:\Users\georg\Iovino Enterprises, LLC\MLJ-017 Package 6 - General\05 - SUBMITTALS\14 - CONVEYING EQUIPMENT\14 24 00\A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf
- — visual claims are tied to a page — no visual observations produced
- — visual evidence is citable/deep-linkable — 0 visual citation(s)
- — no scale-based estimation — no estimation wording
- — no inferred activity — no speculative wording
- ✅ refusal is an explicit inability to verify — refusal wording: "I found the correct document, but this information could not be verified from the extracted text, and the page could not be inspected. **Source:** [a37806 14 24"

---

## sq19 — title block — revision history and approval dates

**Question:** In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what revision history and approval dates are recorded in the title block?

**Answer as the user sees it:**

I found the referenced document, but the revision history and approval dates recorded in the title block for **AVI-002 Ave I North Foundation Rebar Shop Drawings** could not be verified from the extracted text. This information may require reviewing the drawing visually.

**Visual fallback:** not reached on this path.

**Checks:**

- — assessed as visual — no assessment recorded (the stage was never reached on this path)
- — pages selected, not the whole document — stage did not trigger
- — visual claims are tied to a page — no visual observations produced
- — visual evidence is citable/deep-linkable — 0 visual citation(s)
- — no scale-based estimation — no estimation wording
- — no inferred activity — no speculative wording
- ✅ refusal is an explicit inability to verify — refusal wording: "I found the referenced document, but the revision history and approval dates recorded in the title block for **AVI-002 Ave I North Foundation Rebar Shop Drawing"

---

## sq25 — title block / stamp — reviewer disposition

**Question:** In GEN-001R02 Elevator Walls Formwork Drawing, what was the AE reviewer's final disposition and were any comments issued?

**Answer as the user sees it:**

The AE reviewer's final disposition for the **Elevator Walls Formwork Drawing (GEN-001R02)** was **"Reviewed with Comments"** [1, 2]. Comments were issued, instructing the submitter to **"Please check the attachment"** [1, 2].

**Sources:**

* [1] [a37806 03 10 00 gen-001r02 - rwc -](#citation:4967005e-c653-4721-b139-7a618e88411c)
* [2] [a37806 03 10 00 gen-001r02 - rwc -](#citation:4967005e-c653-4721-b139-7a618e88411c:2), p. 2

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.38, task types `drawing`
- Trigger: no — text evidence already answered every requested part

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.38, task=drawing
- — pages selected, not the whole document — stage did not trigger
- — visual claims are tied to a page — no visual observations produced
- — visual evidence is citable/deep-linkable — 0 visual citation(s)
- — no scale-based estimation — no estimation wording
- — no inferred activity — no speculative wording
- — refusal is an explicit inability to verify — answered, not refused

---

## sq68 — drawing — dimensions noted at stationing

**Question:** In RFI098 for the Ave I Conductor Board, what track and platform dimensions are noted around Station 489+00 to 490+00?

**Answer as the user sees it:**

At **Avenue I station**, the following track and platform dimensions are noted around Station 489+00 to 490+00 in **RFI098**:

*   At **Station 490+00**, a **40-ft long ADA boarding area** is centered on the conductor board on the **northbound platform (Track B2)**. [1, 2]
*   At **Station 489+00**, which corresponds to a **4-car train conductor board**, no ADA boarding area or path of travel is shown. [[1]](#citation:44748099-b4af-413c-a572-6cb21936ad5c:1)

**Sources:**

* [1] [a37806 ada p6 rfi098 ave i conductor board](#citation:44748099-b4af-413c-a572-6cb21936ad5c:1), p. 1
* [2] [a37806 ada p6 rfi098 ave i conductor board](#citation:44748099-b4af-413c-a572-6cb21936ad5c:1), p. 1

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.38, task types `drawing`
- Trigger: **yes** — text evidence was incomplete and the question is likely visual (drawing)
- Pages selected: 1
- Pages inspected: 1
- p.1 (confidence 1.00) — **track and platform dimensions:** 40-ft long boarding area on the northbound platform (track B2) centered on the conductor board at Sta 490+00. _(Information Requested section, third paragraph)_

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.38, task=drawing
- ✅ pages selected, not the whole document — selected 1
- ✅ visual claims are tied to a page — observations on p.1
- ✅ visual evidence is citable/deep-linkable — 1 visual citation(s)
- ✅ no scale-based estimation — no estimation wording
- ✅ no inferred activity — no speculative wording
- — refusal states the pages were inspected and still could not verify — answered, not refused

---

## sq70 — drawing/markup — field condition that prompted the RFI

**Question:** In A37806 RFI096, what dimensional discrepancy or field condition prompted the RFI at the McDonald Avenue station?

**Answer as the user sees it:**

I found the correct document, but the requested dimensional discrepancy or field condition that prompted the RFI at the **McDonald Avenue station** could not be verified from the extracted text or from visual inspection of pages **23, 24, and 28**.

Evidence: a37806 ada p6 rfi096 (p. 9, 23, 24).

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.75, task types `photo`, `drawing`
- Trigger: **yes** — text evidence did not contain the answer and the question is likely visual (photo, drawing)
- Pages selected: 23, 24, 28
- Pages inspected: 23, 24, 28
- Nothing legible on the inspected pages (`visual_fallback.no_evidence`)

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.75, task=photo,drawing
- ✅ pages selected, not the whole document — selected 23, 24, 28
- — visual claims are tied to a page — no visual observations produced
- — visual evidence is citable/deep-linkable — 0 visual citation(s)
- — no scale-based estimation — no estimation wording
- — no inferred activity — no speculative wording
- ✅ refusal states the pages were inspected and still could not verify — refusal wording: "I found the correct document, but the requested dimensional discrepancy or field condition that prompted the RFI at the **McDonald Avenue station** could not be"
- ✅ refusal does not suggest a visual review that already happened — no redundant suggestion

---

## vf01 — checkbox — which submittal designation is selected (the flagship lost-visual-state case)

**Question:** In the MTACD-MLJTC2-L-0024 letter, which submittal designation checkbox is selected?

**Answer as the user sees it:**

I found 25 03 19 a37806-mtacd-mljtc2-l-0024 - sub-contractor approval –, but the requested information could not be verified from the extracted text or from visual inspection of page 1.
Nothing on those pages showed the requested detail clearly enough to report it.
Point me at a specific page or detail callout and I will inspect that page.

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.50, task types `checkbox`
- Trigger: **yes** — text evidence did not contain the answer and the question is likely visual (checkbox)
- Pages selected: 1
- Pages inspected: 1
- Nothing legible on the inspected pages (`visual_fallback.no_evidence`)

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.50, task=checkbox
- ✅ pages selected, not the whole document — selected 1
- — visual claims are tied to a page — no visual observations produced
- — visual evidence is citable/deep-linkable — 0 visual citation(s)
- — no scale-based estimation — no estimation wording
- — no inferred activity — no speculative wording
- ✅ refusal states the pages were inspected and still could not verify — refusal wording: "I found 25 03 19 a37806-mtacd-mljtc2-l-0024 - sub-contractor approval –, but the requested information could not be verified from the extracted text or from vis"
- ✅ refusal does not suggest a visual review that already happened — no redundant suggestion

---

## vf02 — checkbox — printed options vs the marked one

**Question:** In Transmittal 0014 for MTA Personnel and PMC Supplies, which review/approval designation is marked on the transmittal?

**Answer as the user sees it:**

The review/approval designation marked on **Transmittal 0014** for MTA Personnel and PMC Supplies is **"Review and Comment"** [[1]](#citation:831e1eb6-9300-41a2-bcf5-268ca4ceb497:1).

**Source:** [a37806 transmittal 0014 - mta personnel and pmc](#citation:831e1eb6-9300-41a2-bcf5-268ca4ceb497:1), p. 1

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.50, task types `checkbox`
- Trigger: **yes** — visual state lost in extraction — extracted text lists 3 mutually exclusive options with no indication of which is selected
- Pages selected: 1
- Pages inspected: 1
- p.1 (confidence 0.90) — **In Transmittal 0014 for MTA Personnel and PMC Supplies, which review/approval designation is marked on the transmittal?:** Review and Comment _(The checkbox next to 'Review and Comment' under 'SUBMITTED FOR:' is checked.)_

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.50, task=checkbox
- ✅ pages selected, not the whole document — selected 1
- ✅ visual claims are tied to a page — observations on p.1
- ✅ visual evidence is citable/deep-linkable — 1 visual citation(s)
- ✅ no scale-based estimation — no estimation wording
- ✅ no inferred activity — no speculative wording
- — refusal states the pages were inspected and still could not verify — answered, not refused

---

## vf03 — signature — is a signature visibly present

**Question:** In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, is a signature visible on the letter and what printed name and title appear beside it?

**Answer as the user sees it:**

Yes, the **MTACD-MLJTC2-L-0024 sub-contractor approval letter** includes two signature lines [[1]](#citation:947e03ed-ffc4-40c6-b785-334779281ea2:1).

The printed names and titles are:
*   **Mekh Gurung, CCM**, Naik/TYLin JV, Sr. Project Manager [[1]](#citation:947e03ed-ffc4-40c6-b785-334779281ea2:1)
*   **Michael Wilson, MBA, CCM**, MTA C&D, Senior Director, PCEO [[1]](#citation:947e03ed-ffc4-40c6-b785-334779281ea2:1)

**Source:** [25 03 19 a37806-mtacd-mljtc2-l-0024 - sub-contractor approval –](#citation:947e03ed-ffc4-40c6-b785-334779281ea2:1), p. 1

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 0.88, task types `signature`
- Trigger: no — text evidence already answered every requested part

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=0.88, task=signature
- — pages selected, not the whole document — stage did not trigger
- — visual claims are tied to a page — no visual observations produced
- — visual evidence is citable/deep-linkable — 0 visual citation(s)
- — no scale-based estimation — no estimation wording
- — no inferred activity — no speculative wording
- — refusal is an explicit inability to verify — answered, not refused

---

## vf04 — title block — sheet number and revision read visually

**Question:** What sheet number and revision are shown in the title block of drawing MYR-A-444A?

**Answer as the user sees it:**

The title block of drawing **MYR-A-444A** shows:

*   **Sheet Number:** MYR-A-444A [[1]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)
*   **Revision:** — [[1]](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1)

**Source:** [myr-a-444a](#citation:da6ece14-bc2d-41de-9ecb-ee75e3c16a8c:1), p. 1

**Visual fallback:**

- Assessment: `visualLikely=true`, confidence 1.00, task types `drawing`, `title_block`
- Trigger: **yes** — text evidence did not contain the answer and the question is likely visual (drawing, title_block)
- Pages selected: 1
- Pages inspected: 1
- p.1 (confidence 0.90) — **sheet number:** MYR-A-444A _(In the title block, under 'DRAWING NO.')_
- p.1 (confidence 0.90) — **revision:** — _(In the title block, under 'REVISION')_

**Checks:**

- ✅ assessed as visual — visualLikely=true, confidence=1.00, task=drawing,title_block
- ✅ pages selected, not the whole document — selected 1
- ✅ visual claims are tied to a page — observations on p.1
- ✅ visual evidence is citable/deep-linkable — 1 visual citation(s)
- ✅ no scale-based estimation — no estimation wording
- ✅ no inferred activity — no speculative wording
- — refusal states the pages were inspected and still could not verify — answered, not refused

---

## vf05 — negative control — a plain text lookup that must NOT trigger vision

**Question:** In the MTACD-MLJTC2-L-0017 subcontractor approval letter, on what date was MASE FX approved?

**Answer as the user sees it:**

**MASE FX** was approved on **March 19, 2025**. [[1]](#citation:f8cb1aab-16ff-4366-9fad-8f054bf90124)

**Source:** [25 03 19 a37806-mtacd-mljtc2-l-0017 - subcontractor approval mase](#citation:f8cb1aab-16ff-4366-9fad-8f054bf90124)

**Visual fallback:**

- Assessment: `visualLikely=false`, confidence 0.00, task types none
- Trigger: no — text evidence already answered every requested part

**Checks:**

- ✅ vision not spent on a text question — not triggered (text evidence already answered every requested part)

---

## vf06 — negative control — a specification text question that must NOT trigger vision

**Question:** In the AVI-002 Ave I North Foundation Rebar Shop Drawings, what concrete cover requirements are specified for surfaces exposed to earth or weather?

**Answer as the user sees it:**

## Section 6.3 Requirements Summary (a37806 03 20 00 avi-002r02 - fio -)
- Reviewed indexed section evidence from page(s): 2.
- Key requirements captured from the section:
- 43'-6 1/2" T/ OPNG 3 3 COATED REBAR EPOXY U.O.N.
- REP01ELEVATOR PIT REINFORCEMENT DETAILS (NORTH) AVENUE I STATION PACKAGE 6 BROOKLYN KM#25-067 - - GB 12/02/2025 0 12/02/2025 FOR APPROVAL 1 02/11/2026 AAN PER EOR MARKUPS (DTD.01.06.2026) & REVISED PER UPDATED SET (DTD.01.23.2026) & SK-044 (DTD.02.02.2026)...

Evidence: a37806 03 20 00 avi-002r02 - fio - (p. 2).

**Visual fallback:** not reached on this path.

**Checks:**

- ✅ vision not spent on a text question — not triggered (stage not reached)

---

