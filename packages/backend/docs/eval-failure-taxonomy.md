# Eval Failure Taxonomy & Generalized Question Framework

**Audience:** PMs, eval authors, and engineers improving retrieval + answer quality  
**Last updated:** June 25, 2026  
**Corpus:** MLJ-017 Package 6 (TEST CLONE) — ~10.7K files, ~10K indexed, ~965K chunks  
**Companion docs:** [retrieval-pm-improvement-guide.md](./retrieval-pm-improvement-guide.md), [retrieval-how-it-works.md](./retrieval-how-it-works.md)

---

## Executive summary — top systemic issues

1. **Retrieval–generation gap (right file, no answer).** Exact-ID and top-3 retrieval often succeed while generation fails with verifier refusals (`"could not verify exact section"`), `"Need Indexed"` placeholders, or section-suggestion templates. **DRFI-0099** is the canonical case: retrieval pass, generation fail (`mlj017-realistic-report.json`). QWP hold-point questions pass end-to-end when the file is indexed and chunks hydrate.

2. **Document-family and doc-type confusion.** Similar filenames, revisions, and bundles collide: PRDC volume vs conformed specs (`real-03`, `real-04`), RFI follow-up vs original (`answer-11`, `identifier-02`), spec vs drawing for the same CSI section (`find-05` vs `answer-03`), schedule variant vs schedule update (`real-14`, `answer-05`), HASP vs environmental health programs (`real-29`).

3. **Activity-based find without identifier is brittle.** PM queries like “SWP for platform concrete demolition” or “design build baseline schedule” fail when the corpus has many semantically adjacent docs (meeting minutes, RFP addenda, look-aheads). Identifier-backed finds (QWP-001, DRFI-0047, SWP-013) pass at much higher rates.

4. **Overspecific vs underspecific answer shape mismatch.** The system answers a **narrow chunk** when users want a **file overview** (QWP quality risks, full RFI narrative), or gives **shallow bullets / partial facts** when users want a **specific extracted value** (LOE %, grinder specs, who answered RFI-0183). Strict verification amplifies underspecific refusals; loose synthesis risks inaccuracy (MOWE “10 work days” cited from Division 1, not the joint survey).

5. **Smoke eval overfits filename-embedded queries.** The 110 chunk-grounded questions (82% top-1 retrieval) measure “can search find the file you already named?” — not realistic PM behavior. Filename-topic failures (17/20 smoke fails) cluster on boilerplate addresses, access-pass templates, invoices, and schedule XML noise. The 35 realistic PM queries (80% top-3) better reflect production pain.

**No RAG audit canvases** exist under `packages/backend/canvases/` at time of writing.

---

## Eval asset inventory

| Asset | Count | Scoring | Latest pass rate | Purpose |
|-------|------:|---------|----------------:|---------|
| `mlj017-test-questions.json` | 36 | top-1 find / top-1 source + phrases | **72%** overall (PM guide; 50% answer bucket) | Regression harness — mixed buckets |
| `mlj017-realistic-questions.json` | 35 | top-3 source | **80%** retrieval (`mlj017-realistic-search-report.json`) | PM-style queries **without** embedded filenames |
| `mlj017-realistic-report.json` | 5 (sample) | top-3 + answer phrases | **80%** E2E (4/5) | Full Q&A spot-check on realistic set |
| `mlj017-smoke-questions.json` | 110 | top-1 source | **82%** retrieval (`mlj017-smoke-search-report.json`) | Chunk-grounded; filename embedded |
| `mlj017-chunk-audit-report.json` | 20 | source + phrases + chunk terms | **15%** | Full pipeline on sampled chunks |
| `mlj017-chunk-curated-report.json` | 5 | top-3 + phrases | **40%** | Hand-picked hard cases |
| `mlj017-postpurge-baseline.json` | 110 smoke | top-1 | 87% | Post-garbage-chunk purge retrieval |
| `mlj017-rerank-llm.json` | 110 smoke | top-1 | 89% | LLM rerank experiment |

**Smoke question generation:** 63 files sampled → 110 questions. Templates: `identifier_content` (63), `filename_topic` (45), `spec_section` (2). Categories span change orders, contracts, RFIs, schedules, permits, invoices, photos, etc.

**Realistic question mix:** 21 find · 14 answer. All use `expectedInTopK: 3`.

---

## Failure taxonomy

### Retrieval failures

| Category | Description | Example (eval ID) | Approx. rate |
|----------|-------------|-------------------|-------------|
| **R-01 Wrong file (similar name)** | Semantically or lexically similar doc wins | `find-08` (executed DBA → RFP provisions), `real-08` (SWP → meeting minutes) | realistic 3/7 fails; smoke ~10% |
| **R-02 Right file, wrong rank** | Expected file in corpus but not top-1 (smoke) or top-3 | Smoke: subcontractor approval L-0022 vs L-0024; post-rerank fixes many | smoke 20/110 @ top-1; fewer @ top-3 |
| **R-03 Doc-type / bundle confusion** | PRDC vs conformed specs, spec list vs spec section, agreement vs addenda | `real-03`, `real-04`, `real-20`, `real-09` | 4/7 realistic fails |
| **R-04 Revision / family collision** | Follow-up RFI, duplicate EDU drawing sets, multiple GEN-063 revs | `answer-11`, `identifier-02`, smoke DRFI chunks | PM harness: 2/6 identifier-adjacent |
| **R-05 Schedule / date disambiguation** | Wrong month, look-ahead vs update vs baseline XML | `real-14`, `answer-05`, `answer-09`, smoke schedule XML | 3+ in PM harness |
| **R-06 Spec vs drawing (CSI collision)** | Same section number on spec PDF and drawing set | `find-05` (drawing) vs `answer-03` (spec) | 1 find fail; Q&A recovers |
| **R-07 Location / station noise** | Station name pulls unrelated station package | `find-09` (generic Fire Alarm.pdf), `ambiguous-04` | 2 PM harness |
| **R-08 Boilerplate / address retrieval noise** | Letterhead, phone numbers, addresses match unrelated DOT permits | smoke `chunk-69891ac7-c2`, 7 `address_or_boilerplate` theme fails | 7/110 smoke |
| **R-09 Template / form family** | Blank access-pass template outranks named person | smoke access_pass (3 noise cases) | 4/110 smoke |
| **R-10 Identifier prefix collision** | GEN-001 invoice vs GEN-001 product data | smoke invoice_doc (4) | 4/110 smoke |
| **R-11 Acronym / keyword collision** | “Health and safety” → environmental boring program | `real-29` | 1 realistic |
| **R-12 Unindexed / wrong media type** | ZIP/video/attachment with catalog hit but no text | chunk-audit AVI-082 zip | chunk-audit common |

### Generation / answer-quality failures

| Category | Description | Example | Retrieval? |
|----------|-------------|---------|------------|
| **G-01 Verifier refusal (has context)** | Strict section verification blocks answer despite correct file in context | `real-26` DRFI-0099; chunk-audit GEN-045 | **Pass** |
| **G-02 Need Indexed / no hydration** | Exact-ID finds file; Q&A never loads chunks | `answer-02` QWP-001 (PM harness) | **Pass** |
| **G-03 Underspecific / partial** | Topic-level summary missing requested fact (%, person, gauge) | curated RFI-0183 (who answered); `real-26` | Mixed |
| **G-04 Overspecific narrow passage** | Answers one section/chunk when user wanted doc overview or full list | QWP-006 answer dumps form header (realistic-report snippet); user asking “quality risks” gets one hold point | **Pass** |
| **G-05 Inaccuracy / wrong source synthesis** | Plausible answer from wrong retrieved doc | curated MOWE 10 days from Vol 04 not joint survey | **Fail** |
| **G-06 Wrong scope / wrong section** | Answers about adjacent identifier in query | RFI-0140 when asked RFI-063 | **Wrong file** |
| **G-07 Refusal template despite citations** | Lists citations then says “context does not contain” | chunk-audit MOWE survey; curated MYR-006 permit | **Partial** |
| **G-08 Confident wrong revision** | Names wrong GEN revision in answer | `answer-02` GEN-019R00 vs R03 | **Pass** |
| **G-09 List not exhaustive** | User expects all hold points / all comments; gets top chunk only | Implicit in QWP/RFI archetypes | **Pass** |
| **G-10 Ambiguity not surfaced** | Should present 2–3 candidates; picks one silently | `ambiguous-01`–`04` acceptable if top-3; fails when single wrong pick | top-3 design |

### Retrieval-only vs full-answer gaps

| Pattern | Retrieval | Generation | Eval IDs |
|---------|-----------|------------|----------|
| Hydration gap | Pass | Fail (placeholder) | `answer-02`, chunk-audit indexed-file refusals |
| Verifier gap | Pass | Fail (section suggestions) | `real-26`, curated GEN-045 |
| Wrong file cascade | Fail | Fail or hallucinate | `real-14`, curated MOWE |
| Both pass | Pass | Pass | `real-01`, `real-21`, `real-33`, PM `answer-03`, `answer-06`, `answer-08` |

**Quantified snapshot (June 25, 2026 reports):**

| Set | Retrieval pass | Est. generation pass (where measured) | Dominant failure layer |
|-----|---------------:|--------------------------------------:|------------------------|
| PM harness (36) | find 70%, id 100% | answer **50%** | Generation + wrong source |
| Realistic (35) | **80%** top-3 | **80%** on 5-sample E2E | Retrieval on PRDC/schedule/SWP |
| Smoke (110) | **82%** top-1 | not run at scale | Noisy micro-queries |
| Chunk audit (20) | low | **15%** combined | Both |
| Curated hard (5) | 60% | **40%** | Verifier + wrong synthesis |

---

## Generalized question archetypes (~26)

Use these instead of 110 filename-embedded chunk questions. Each archetype should have 1–3 **instances** in the eval bank, not 1 per chunk.

### Lookup & discovery

| # | Archetype | Query template | Good answer | Failure mode | Maps from |
|---|-----------|----------------|-------------|--------------|-----------|
| A1 | **Bare identifier** | `{QWP\|RFI\|DRFI\|GEN}-###` | Correct file card + revision status | Wrong family member | `identifier-01`–`06` |
| A2 | **Identifier + open** | “Pull up {ID}” | File link; offer to summarize | Lists unrelated files | `real-22`, `real-27` |
| A3 | **Activity doc find** | “SWP for {activity}” / “QWP for {activity}” | Correct SWP/QWP PDF | Meeting minutes, wrong SWP | `real-08`, `real-24`, `real-25` |
| A4 | **Contract / volume find** | “Conformed {PRDC\|specs} for Package 6” | Master conformed volume | Station drawing package | `real-04`, `real-11`, `find-02` |
| A5 | **Dated artifact find** | “{Month YYYY} {progress report\|register\|look-ahead}” | Dated file matching period | Adjacent month / wrong year | `real-18`, `real-31`, `real-34` |
| A6 | **Station drawing find** | “{Station} {discipline} drawings” | Station-specific EDU/BUR package | Wrong station copy | `real-07`, `real-16`, `real-35` |
| A7 | **Executed / legal doc** | “Fully executed {agreement\|DBA}” | Executed contract PDF | RFP volume or addenda | `find-08` |
| A8 | **Submittal / comments find** | “Comments on {station} {system} submittal” | Designer comment package | Generic system PDF | `real-06`, `real-19`, `find-09` |

### Content extraction

| # | Archetype | Query template | Good answer | Failure mode | Maps from |
|---|-----------|----------------|-------------|--------------|-----------|
| B1 | **Single fact from ID** | “What does {DRFI-###} say about {topic}?” | RFI subject + disposition on topic | Verifier refusal | `real-17`, `real-26`, `real-33`, `answer-04` |
| B2 | **Spec section scope** | “What does Section {CSI} cover?” | PART scope summary from spec | Drawing set or wrong division | `answer-06`, `real-20`, `find-05` |
| B3 | **PRDC / volume requirement** | “Per Volume {N}, what are {requirement}?” | Requirements from correct PRDC section | Conformed specs bundle instead | `real-03`, `answer-07`, `real-15` |
| B4 | **QWP hold points** | “Hold points before {activity} per {QWP-###}” | Enumerated hold points w/ pages | One bullet; header dump; Need Indexed | `real-01`, `real-21`, `answer-02` |
| B5 | **Material / submittal compliance** | “What satisfies {spec item}?” / “BABA for {division}” | Product + spec citation | Wrong division file | `real-05`, `answer-10`, `answer-08` |
| B6 | **Schedule metric** | “{Milestone\|LOE} % for {station} on {schedule name}” | Numeric % + milestone ID | Wrong schedule doc | `real-14`, `answer-05`, `answer-09` |
| B7 | **RFI narrative** | “What is {RFI} about regarding {topic}?” | Q + A summary | Follow-up RFI; PRDC not PDF | `answer-01`, `answer-11` |
| B8 | **Compare / versus** | “{Option A} vs {Option B} per {doc}” | Both sides + ruling | Section suggestions only | `real-26` |
| B9 | **Who / when procedural** | “Who answered {RFI} about {topic}?” | Named responder + date | Layout description only | curated RFI-0183 |

### Synthesis & shape

| # | Archetype | Query template | Good answer | Failure mode | Maps from |
|---|-----------|----------------|-------------|--------------|-----------|
| C1 | **File overview** | “Summarize {ID}” / “What quality risks does {QWP} address?” | Section-level overview or “open file” | Single hold point; refusal | `answer-02` |
| C2 | **Exhaustive list** | “List all hold points in {QWP}” | Complete enumerated list | Top-1 chunk only | extends B4 |
| C3 | **Cross-doc topic** | “{Topic} in specs and submittals” | PRDC + submittal, or asks clarifier | Single doc overspecific | `ambiguous-03`, `real-03`+`real-05` |
| C4 | **Photo / field evidence** | “What work on {date} per construction photos?” | Dated activities from photo log | Unindexed zip | curated AVI-082 |
| C5 | **Administrative boilerplate** | Fact buried in letterhead / form | Exact field value | DOT permit noise | smoke address queries |

### Negative & ambiguous

| # | Archetype | Query template | Good answer | Failure mode | Maps from |
|---|-----------|----------------|-------------|--------------|-----------|
| D1 | **Honest not-found** | Out-of-domain topic | Low relevance; no hallucination | Invented spec | `not_found-01`–`04` |
| D2 | **Ambiguous scope** | “{Station} schedule” / “Avenue I comments matrix” | Top-3 diverse candidates + disambiguation | Single wrong doc | `ambiguous-01`, `04` |
| D3 | **Multi-revision disambiguation** | Query without rev when many exist | Prefer APP/FINAL; show alternates | Wrong revision | `real-09`, GEN-063 family |

### When full-file vs narrow passage is correct

| User intent | Good shape | Overspecific failure | Underspecific failure |
|-------------|------------|----------------------|------------------------|
| “Pull up / find {doc}” | File card + optional snippet | N/A (no prose answer) | File list without the right one |
| “What is {RFI} about?” | 3–5 sentence Q/A summary | One sentence from attachment | “Could not verify section” |
| “Hold points in {QWP}” | Bulleted list across sections | Single pre-pour bullet | Form header / TOC only |
| “LOE % on April schedule” | Number + milestone ID + source | Narrative about schedule process | Missing % |
| “Section {CSI} scope” | PART 1–2 summary | One unrelated subsection | Refusal with section guesses |
| Ambiguous topic | 2–3 files + “which do you mean?” | Pick wrong file confidently | Random single file |

---

## Recommended eval scoring changes

### Split metrics (always report separately)

1. **source@K** — expected pattern in top K (K=3 default for PM; K=1 only for identifier smoke).
2. **groundedAnswer** — key phrases OR structured rubric (not substring games alone).
3. **answerShape** — `overview` | `single_fact` | `list` | `file_pointer` — pass/fail per shape rubric.
4. **abstainQuality** — for `not_found` and low-confidence: penalize hallucination, reward honest gap.

### Scoring policy by bucket

| Bucket | Current | Recommended |
|--------|---------|-------------|
| find | top-1 only in PM harness | **top-3 pass**; top-1 as secondary metric |
| identifier | top-1 | top-1 (keep strict) |
| ambiguous | any pattern in top-3 | top-3 **plus** require ≥2 distinct files OR disambiguation phrase in answer |
| answer | source@1 + phrase hits | source@3 + phrase hits + **no verifier-refusal if source@1** |
| not_found | max relevance | unchanged |

### Question bank structure (target ~30–40 cases)

| Archetype group | Target count | Source |
|-----------------|-------------:|--------|
| A1–A8 Lookup | 12–14 | realistic + PM find |
| B1–B9 Extract | 12–14 | realistic answer + PM answer |
| C1–C5 Synthesis | 4–6 | curated + QWP depth |
| D1–D3 Negative/ambiguous | 6–8 | PM ambiguous + not_found |

**Deprioritize:** 110 smoke filename-embedded questions for regression (keep ~20 as indexing smoke). **Prioritize:** 35 realistic set + 36 PM harness, merged and deduped to archetype instances.

### Generation rubric additions

- **Fail** if correct `source@1` but answer contains: “could not verify”, “Need Indexed”, “section suggestions” without content.
- **Fail** if user asked for **number/list** and answer has no number/list.
- **Pass with note** if user asked for overview and answer gives 2+ distinct sections (even if not exhaustive).
- **Fail** if answer cites file A but states facts clearly from file B (cross-doc leakage).

---

## Priority fixes mapped to failure categories

| Priority | Fix | Failure categories | Evidence |
|:--------:|-----|-------------------|----------|
| P0 | Exact-ID + chunk hydration for Q&A | G-02, G-04 | `answer-02`, PM guide #2 |
| P0 | Relax verifier when `source@1` + quoted chunk text | G-01, G-03 | `real-26`, chunk-audit |
| P0 | RFI/DRFI family resolver (original vs follow-up) | R-04, G-06 | `answer-11`, smoke DRFI |
| P1 | Hybrid search in production | R-01, R-05, R-07 | PM guide #1; `find-08`, `real-14` |
| P1 | Schedule-aware ranking (date + doc-type) | R-05, R-03 | `real-14`, `real-09`, `answer-05` |
| P1 | PRDC vs conformed-spec disambiguation | R-03 | `real-03`, `real-04` |
| P1 | Spec vs drawing doc-type filter | R-06 | `find-05` |
| P2 | SWP/QWP activity → identifier catalog boost | R-01, A3 | `real-08` |
| P2 | Acronym / HASP keyword rules | R-11 | `real-29` |
| P2 | Answer routing: content vs file list | G-07 | PM guide #5 |
| P2 | Ambiguity response template (top-3 candidates) | D2, G-10 | `ambiguous-04` |
| P3 | Deprecate boilerplate chunk questions in CI | R-08 | smoke 7/20 fails |
| P3 | xlsx/zip indexing or explicit unsupported messaging | R-12, G-02 | chunk-audit AVI, GEN-045 |

---

## Appendix: realistic set failures (retrieval, June 25)

| ID | Query (short) | Got instead | Category |
|----|---------------|-------------|----------|
| real-03 | PRDC vol 5 expansion joints | GEN-063 conformed specs | R-03 |
| real-04 | Conformed PRDC volume | Burnside EDU02D structural | R-03 |
| real-08 | SWP platform concrete demo | Monthly progress / meeting docs | R-01 |
| real-09 | Design-build baseline schedule | RFP addenda / Vol 04 | R-03 |
| real-14 | Burnside LOE % April schedule | `a1.pdf`, BA schedule variants | R-05 |
| real-20 | Division 22 escutcheons | Spec list / Myrtle spec sheets | R-03 |
| real-29 | Project HASP | Environmental boring PRDC12 | R-11 |

## Appendix: smoke failure themes (top-1, June 25)

| Theme | Count | Category |
|-------|------:|----------|
| `filename_topic` misses | 17 | R-08, R-01 |
| `address_or_boilerplate_query` | 7 | R-08 |
| `access_pass` / template noise | 4 | R-09 |
| `invoice_doc` / GEN prefix | 4 | R-10 |
| `identifier_content` misses | 2 | R-02 |
| `spec_section` mismatch | 1 | R-06 |

**Run evals:** from `packages/backend`, `pnpm eval:mlj017` (36-case), plus project scripts for realistic/smoke sets per `package.json`.
