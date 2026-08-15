# Independent Answer Grading (PASS / PARTIAL / FAIL)

**Audience:** engineers and eval authors working on answer quality
**Companion docs:** [eval-failure-taxonomy.md](./eval-failure-taxonomy.md), [system-overview-and-failure-modes.md](./system-overview-and-failure-modes.md)

---

## Why this exists

The answer pipeline reports its own status on every question:

```text
complete | partial | not_found | source_mismatch | deterministic
```

That status describes **pipeline behaviour** — what the extractor believes it did with the
evidence it was given. It is not a measure of whether the answer is right. An answer can be
`complete` and wrong: built from the wrong revision of the right document, answering the wrong
section, or confidently restating a passage that does not address the question. It can equally be
`not_found` and correct, when the fact genuinely is not in the corpus.

This framework adds a second, unrelated axis:

```text
PASS | PARTIAL | FAIL        (plus UNGRADED where no reference facts exist)
```

The two are never merged. The report prints them side by side and cross-tabulates them, because
the interesting rows are the disagreements:

| Cell | What it means |
|---|---|
| `complete` → FAIL | False confidence. The pipeline thinks it answered; the answer is wrong. The most expensive failure mode. |
| `not_found` → PASS | Correct conservative refusal. Not a regression — this is the behaviour we want when evidence is absent. |
| `not_found` → FAIL | A real retrieval or synthesis regression: the fact is in the corpus and the pipeline said it was not. |
| `deterministic` → FAIL | The extractor produced nothing usable and the fallback renderer answered the wrong thing. |

The production answer model never grades itself, and nothing in the grader treats the pipeline's
status as evidence of correctness. The status is carried through for cross-tabulation only.

---

## The pieces

| File | Role |
|---|---|
| `eval/eval-expectations.ts` | The reference side: benchmark types, identifier matching, document-fidelity and expected-evidence checks, refusal detection. Pure. |
| `eval/independent-grader.ts` | Deterministic rules, the judge prompt, verdict parsing, grade aggregation, root-cause attribution. |
| `eval/independent-grade-report.ts` | Totals, the status × grade matrix, root-cause roll-up, run-to-run comparison. Pure. |
| `eval/grade-independent.ts` | CLI: grade a finished traced run, write grades JSONL + a standalone report. |
| `eval/compare-independent-grades.ts` | CLI: compare two graded runs by grade. |
| `eval/sync-expected-questions.ts` | CLI: keep the benchmark in step with the question set. |
| `eval/author-expected-facts.ts` | CLI: draft reference facts from full document text. |
| `eval/mlj017-97-expected.json` | The benchmark itself. |
| `eval/expected-document-pins.json` | Hand-reviewed document pins and visual flags, applied by the sync script. |

Nothing here imports the answer pipeline. `generate-97-traced-report.ts` reads the grades file
when it exists and adds the grade sections; without it the report renders exactly as before.

Identifier normalisation and refusal detection are re-implemented in `eval-expectations.ts`
rather than imported from `src/services`. A grader that shares a bug with the code under test
cannot detect that bug.

---

## Running it

```bash
# from packages/backend

# 1. keep the benchmark in step with the question set (idempotent, never drops facts)
pnpm eval:expected-sync

# 2. draft reference facts for questions that have none
pnpm eval:expected-draft -- --missing-only
pnpm eval:expected-draft -- --ids sq26,sq27 --dry-run     # inspect before writing

# 3. grade a finished traced run
pnpm eval:grade                                            # defaults below
pnpm eval:grade -- --ids sq26,sq27 --concurrency 2
pnpm eval:grade -- --resume                                # skip already-graded ids

# 4. fold the grades into the Q&A + trace report
pnpm eval:traced-report

# 5. compare two graded runs
pnpm eval:grade-compare -- ./eval/grades-baseline.jsonl ./eval/mlj017-97-grades.jsonl
```

Defaults: run `eval/mlj017-97-traced-run.jsonl`, benchmark `eval/mlj017-97-expected.json`,
grades `eval/mlj017-97-grades.jsonl`, report `eval/mlj017-97-independent-grade-report.md`.

---

## The benchmark format

```jsonc
{
  "id": "sq27",
  "query": "In Invoice 11830, what is the unit price per pest control visit and total amount due?",
  "groundTruth": "verified",              // verified | draft | missing
  "provenance": "human",
  "visualEvidenceExpected": false,
  "expected": {
    "answerAvailable": true,              // false => a refusal is the correct answer
    "requiredFacts": [
      { "field": "unit_price",   "label": "unit price per visit", "acceptedValues": ["$350", "$350.00"] },
      { "field": "total_amount", "label": "total amount due",     "acceptedValues": ["$1,400", "$1,400.00"] }
    ],
    "forbiddenClaims": [],
    "notes": ""
  },
  "expectedDocument": { "identifier": null, "revision": null, "fileNamePatterns": ["11830"] },
  "expectedEvidence": [{ "fileNamePattern": "Invoice 11830.pdf", "pages": [1] }]
}
```

- **`acceptedValues`** are surface forms, any one of which counts. Exact wording is never required.
- **`expectedMeaning`** replaces them for facts that are an explanation or a decision rather than
  a value ("the design response directed …").
- **`essential: false`** marks a cosmetic fact that may be missing without costing a PASS.
- **`answerAvailable: false`** is the only reference value that turns a refusal into a PASS. It is
  reserved for human authors — see the drafting limits below.
- **`groundTruth: "missing"`** means the question is reported UNGRADED and excluded from the
  PASS/PARTIAL/FAIL denominator, rather than silently scored against nothing.

### Document pins

Identifiers are not unique in this corpus: eleven files carry `GEN-001R05` (a Quality Management
Plan, a Phasing Plan, and a fire-alarm submittal among them) and sixteen carry `RFI-096`. So when
a benchmark entry records `fileNamePatterns`, the fidelity check uses **only** those and ignores
the identifier — otherwise the near-miss siblings the pin exists to exclude would be re-admitted.
An identifier pin is the fallback for questions where the specific file has not been established.

Identifier comparison is token-based: `RFI-096`, `RFI096`, and `RFI-0096` all match, while
`RFI-0042` does not, and `AVI-002` does not match `AVI-020R00` the way a substring test would.

File-name patterns are compared with separators levelled and containment tested both ways,
because the same document arrives under two spellings — the real file name from `sources`
(`A37806_01 30 20_GEN-042R00 - FIO - ….pdf`) and the extractor's truncated lower-cased label
(`a37806 01 30 20 gen-042r00 - fio -`).

---

## How a grade is decided

**What gets graded is `reply.content`** — the final rendered markdown the user reads, not the
structured `reply.answer` behind it. That is what catches a renderer that drops fields, or a
deterministic fallback that answers a different section of the right document.

Deterministic rules run first and settle the cases that need no judgement:

| Condition | Grade | Category |
|---|---|---|
| the run threw | FAIL | `OTHER` |
| no reference facts on file | UNGRADED | — |
| rendered answer is empty | FAIL | `ANSWER_FORMAT_FAILURE` |
| benchmark says absent, answer declines | **PASS** | — |
| benchmark says absent, answer asserts it anyway | FAIL | `UNSUPPORTED_INFERENCE` |
| benchmark says present, answer declines | FAIL | `FALSE_NOT_FOUND` (+ `RETRIEVAL_FAILURE`, `VISUAL_EVIDENCE_MISSED`) |
| answer asserts facts off a document that is not the pinned one | FAIL | `WRONG_DOCUMENT` |

A refusal is detected from the answer text, not from the status label: citation links and the
Sources block are stripped, and the answer counts as a refusal only when *every* remaining line
reports absent information. A multi-field answer that reports one field as unverifiable is not a
refusal.

Everything else goes to an LLM judge (`INDEPENDENT_GRADER_SYSTEM_PROMPT`), which receives the
question, the reference facts, the pinned document, the rendered answer, and the cited sources —
and is told to ignore confidence, formatting, verbosity, citations, and the candidate's own
status labels. The prompt never mentions the production status.

The judge returns per-field results. The **overall grade is then computed by code**, not taken
from the judge, so the headline number follows one fixed rubric:

```text
no essential field correct                              → FAIL
an essential field wrong, and wrong ≥ right             → FAIL
an essential field wrong, but right outweighs wrong     → PARTIAL
some essential fields right, the rest missing           → PARTIAL
all essential fields right, material errors present     → PARTIAL
all essential fields right, no material errors          → PASS
```

The benchmark owns the field set: a required fact the judge forgot to report counts as `missing`
rather than disappearing from the score. When the rubric and the judge disagree, the rubric wins
and the disagreement is recorded in the reason and counted in the summary.

Citation support is graded separately (`supported | partially_supported | unsupported |
unavailable`) and is never assumed valid just because a citation exists. Where the benchmark
records expected evidence, cited pages are compared against it in code.

Root-cause categories are attached to PARTIAL and FAIL rows only, and a row may carry several:

```text
WRONG_DOCUMENT  WRONG_FACT  MISSING_FACT  FALSE_NOT_FOUND  UNSUPPORTED_INFERENCE
VISUAL_EVIDENCE_MISSED  RETRIEVAL_FAILURE  ANSWER_FORMAT_FAILURE  CITATION_MISMATCH  OTHER
```

---

## Authoring reference facts

`author-expected-facts.ts` resolves the pinned document, dumps its **entire** indexed text in
page order, and asks a model what the document says about the question. Retrieval, ranking, the
identity guard, the extractor, and the formatter are all bypassed, so a draft cannot inherit a
retrieval or synthesis bug from the pipeline it will be used to grade. When several files carry
the pinned identifier, the choice among them is made explicitly against the question text and
recorded in the entry's notes along with the files that were rejected.

Three limits are load-bearing:

1. **A draft may never record a fact as absent.** "Absent" is the one reference value that turns a
   pipeline refusal into a PASS, and a text-layer draft has three ways to be wrong about it: the
   wrong same-identifier sibling, a text layer that lost what the page shows, or a truncated
   document. Any of those would score a real retrieval failure as correct behaviour. So a draft
   that finds no answer parks the question as `missing` — UNGRADED, with the reason recorded — and
   a human decides.
2. **A draft reads the text layer only.** Facts that exist as a mark, a dimension, a stamp, or a
   photograph are invisible to it. Those questions are flagged `visualEvidenceExpected` in
   `expected-document-pins.json` and need human authoring against the page images.
3. **Drafts are counted but never conflated with verified facts.** The summary always reports the
   split, so a headline number never quietly rests on machine-generated ground truth. Promote an
   entry to `"verified"` by hand once its facts have been checked against the source document.

The file a draft was read from is recorded as `draftedFromFile`, deliberately **not** merged into
`expectedDocument`. The pin gates the wrong-document rule and stays reviewed; a drafting pass
choosing between eighteen same-identifier files is a guess, and a wrong guess written into the pin
would turn a benchmark-authoring miss into a reported pipeline defect. `sq78` is the cautionary
case: the question asks about SWP-011, the pipeline answered from the Platform Concrete Demo copy
the question means, and the drafting pass had read the Asbestos Abatement copy.

### Reviewing a draft: what to look for

- **Was the right sibling read?** Compare `draftedFromFile` against what the question describes.
  Where the drafting pass chose between same-identifier files, the notes list the ones it rejected.
- **Is the question about the transmittal state itself?** The fidelity check ignores status codes
  (`ORIG` / `FIO` / `AAN` / `RWC`), because they mark copies of one document — but a question like
  `sq25` ("what was the AE reviewer's final disposition") is *about* that code. Its draft was read
  from the `AAN` copy while the pipeline answered from the `RWC` copy, so the FAIL reflects two
  different review rounds rather than a wrong answer. Verify these against the specific copy the
  question means.
- **Is it a visual question?** A drafted fact list for a drawing or photo log is only as good as
  the text layer under it.

---

## What the report shows

`generate-97-traced-report.ts` gains, when a grades file is present:

- **Independent Quality Grade** — PASS/PARTIAL/FAIL counts and percentages over the graded
  denominator, with the UNGRADED count and the verified/draft split stated explicitly.
- **Production status × independent grade** — the matrix, with the notable cells called out.
- **Failures by root cause** — ranked, with the question ids behind each category.
- **Index** — a Grade column and a Root cause column beside the production status column.
- **Per question** — the grade, why, what decided it (rule or judge), document fidelity, the
  expected-evidence check, a field-by-field table, and the reference facts in a collapsed block.

Run-to-run comparison uses the grade, not "answered vs refused". That distinction matters in both
directions: a question that moved from an answer to a refusal is only a regression when the
benchmark says the fact is there, and a question that moved from a confident wrong answer to an
honest refusal is an improvement. Each regression is reported with the question, both answers,
both grades, the reference facts, and the likely failure category. When graded baselines exist on
both sides, the older answered/refused comparison section is suppressed as superseded.
