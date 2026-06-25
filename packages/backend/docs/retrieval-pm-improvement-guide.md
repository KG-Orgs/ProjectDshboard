# Retrieval Improvement Guide (For Product Managers)

**Audience:** PMs and construction stakeholders who understand *why* search matters, but do not need to read code.

**Last updated:** June 23, 2026  
**Test project:** MLJ-017 Package 6 (TEST CLONE) — 10,721 files cataloged, ~870 with searchable text today  
**Current quality score:** **72% pass rate** on 36 real-world test questions (26 pass / 10 fail)

---

## 1. How retrieval works today (plain English)

### The librarian mental model

Imagine a construction project library with three ways to get what you need:

| Mental model | What the user does | What the system does |
|---|---|---|
| **Exact-ID lookup** | "Get me **QWP-001**" or "**RFI-063**" | Walks straight to the catalog card for that document number — like asking the librarian for a file by its control number. Fast and deterministic. |
| **Browsing shelves (search)** | "Find the **hydraulic elevator spec**" or "**April schedule update**" | Scans indexed text *and* file names/folders, ranks what looks most relevant — like browsing aisles by topic. |
| **Reading pages (RAG / Q&A)** | "What **ASME codes** apply to hydraulic elevators?" | Finds the best pages, reads them, and writes an answer with citations — like asking the librarian to read the spec and summarize. |

**Important nuance:** Exact-ID lookup finds the *right file* reliably, but today it often **does not read the pages inside**. Search and Q&A need the file's text to be **indexed** (Tier 2 — see Section 2).

### What happens when someone types a question (step by step)

No code — just the user experience:

1. **User asks a question** in chat or search (e.g., "What does QWP-001 say about concrete formwork?").

2. **The system checks for a document number.** If the question contains something like `QWP-001`, `RFI-063`, or `GEN-009R00`, it tries the **exact-ID door** first — a direct lookup in the document catalog, not a fuzzy search.

3. **If no exact ID (or ID + content question), it searches indexed text.** It runs two searches in parallel when hybrid mode is on:
   - **Meaning search** — finds passages that are *conceptually* similar (e.g., "elevator safety codes" near ASME A17.1 language).
   - **Word search** — finds exact words and phrases in file names, folder paths, and page text (e.g., "April 26 Schedule Update").

4. **Results get re-ranked.** File names, folder paths, spec section numbers, and document type hints can push some results up or down.

5. **For chat Q&A, the top pages are sent to the AI.** The AI must answer *only* from those pages and cite the source file. If the right pages were not retrieved — or were never indexed — the user gets an honest "I can't find that in the documents" message (sometimes phrased as "Need Indexed QWP").

6. **User sees an answer + source list.** Today: file name and relevance score. **Not yet:** a clickable link to open the exact page, or a quoted snippet proving the answer.

### What works well today

These are real wins from the June 2026 evaluation on the MLJ-017 test corpus:

| Example | What the user asked | What happened | Score |
|---|---|---|---|
| **Document numbers** | `QWP-001`, `RFI-063`, `DRFI-0059`, `GEN-009R00` | Correct file returned instantly, every time | **100%** (6/6 identifier tests) |
| **Topic search — structural / specs** | "Division 22 plumbing common work results" | Top result was `Division_22.pdf` | Pass |
| **Content Q&A — elevator codes** | "What ASME elevator safety codes apply to hydraulic elevators?" | Found `14 24 00 Hydraulic Elevator Equipment`, answered with ASME A17.1 | Pass |
| **Content Q&A — spec sections** | "What does Section 22 05 00 cover for plumbing?" | Found Division 22 spec, cited "Common Work Results for Plumbing" | Pass |
| **Content Q&A — submittals** | "What is Sika Backer Rod used for in expansion joints?" | Found GEN-007R01 submittal, quoted backer rod / sealant use | Pass |
| **Honest "not found"** | "Mars colony habitat standards" | Did not hallucinate; returned weak or empty matches | **100%** (4/4 not-found tests) |

**Bottom line:** When users know the document number, discovery is excellent. When indexed spec text exists and the question maps cleanly to that text, answers are strong.

### What doesn't work well yet

**Overall: 72% pass (26/36).** The gap is not uniform — it clusters in two buckets:

| Bucket | Pass rate | What it measures |
|---|---|---|
| **Find the right file** | 70% (7/10) | Did search return the correct document at #1? |
| **Answer from the file** | **50% (6/12)** | Did we find the right source *and* produce a grounded answer? |
| Document numbers only | 100% | Exact-ID lookup |
| Ambiguous queries | 75% | At least one reasonable hit in top 3 |
| Nonsense / out-of-scope | 100% | Correctly did not invent an answer |

#### Failure stories in PM terms

| Test ID | User intent | What they got instead | Why it hurts trust |
|---|---|---|---|
| **answer-02** | "What quality risks does **QWP-001** address?" | Correct file found (`QWP-001`), but answer said *"could not find an exact indexed passage"* and referenced the wrong revision (`GEN-019R00 ORIG` vs the approved `GEN-019R03 APP`) | User sees the right file name but no useful answer — feels broken |
| **answer-01 / answer-11** | "What is **RFI 063** about (UPS / data cabinet)?" | System returned a **follow-up RFI** (`RFI-0140`) or the PRDC volume instead of the original RFI-063 PDF; placeholder "Need Indexed" message | RFIs are high-stakes; wrong revision = wrong advice |
| **find-05 / answer-03 contrast** | "Hydraulic elevator **section 14 24 00**" (find) vs same topic (answer) | **Find** returned a **drawing** (`EL1118 Door & Fixture Drawings`); **Answer** correctly found the spec PDF | Same project, same section number — search confuses spec vs drawing |
| **find-08** | "Design-Build Agreement **fully executed**" | Returned Volume 02 General Provisions or RFP addenda — not the executed agreement | Contractual doc lookup fails when many "agreement-like" files exist |
| **answer-05 / answer-09** | "Burnside LOE milestone % on **April 2026 schedule**" / "**MS-20** ADA milestone" | Returned a 6-week look-ahead or baseline narrative — not the April 26 Schedule Update | Schedule questions are daily PM workflow; wrong schedule = wrong dates |
| **find-09** | "Middletown Road **fire alarm submission**" | Generic `Fire Alarm.pdf` beat the station-specific submission | Submittal discovery by location/name still weak |
| **answer-10** | "**Build America Buy America** plumbing submittals" | Wrong plumbing files; "Need Indexed" placeholder | Compliance questions need precise spec section hits |
| **ambiguous-04** | "Avenue I **comments matrix**" | Unrelated structural steel drawings | Multi-version matrix docs are hard without filters |

**Pattern:** Discovery by document number is solved. **Reading and answering** — especially for RFIs, QWPs, schedules, and submittals — is where trust breaks down.

---

## 2. The three "doors" into documents

Users don't think in "Tier 1" and "Tier 2." They think in intent. The system has three doors:

```
┌─────────────────────────────────────────────────────────────────┐
│  (A) EXACT-ID DOOR          "QWP-001"  /  "RFI-063"             │
│      → Catalog lookup         Needs: Tier 1 only                │
│      → Finds file fast          (name, path, document number)   │
│      → Often NO page text yet                                   │
├─────────────────────────────────────────────────────────────────┤
│  (B) SEARCH DOOR            "hydraulic elevator spec"           │
│      → Hybrid text search     Needs: Tier 2                     │
│      → Ranks files + snippets   (extracted text + embeddings)   │
├─────────────────────────────────────────────────────────────────┤
│  (C) RAG DOOR               "What ASME codes apply to…?"        │
│      → Search + AI answer     Needs: Tier 2 + good retrieval    │
│      → Grounded citations       (same chunks as search door)    │
└─────────────────────────────────────────────────────────────────┘
```

### Tier 1 vs Tier 2 (what data each door needs)

| Tier | Plain English | What's indexed | Covers | Today on MLJ-017 |
|---|---|---|---|---|
| **Tier 1** | **File card | Every file's name, folder path, document numbers (QWP, RFI, CSI section, etc.), revision/status | **Door A** (exact-ID) | **All 10,721 files** |
| **Tier 2** | Readable pages | Extracted text split into chunks + semantic embeddings | **Doors B & C** (search + Q&A) | **~870 files (~8%)**, ~65,000 chunks — indexing in progress |

**Key PM insight:** A user can *find* almost any document by number today (Tier 1). They can only *ask questions about the content* for files that have been Tier 2 indexed. Many submittals, RFIs, and schedules are still catalog-only.

---

## 3. Improvement backlog — PM prioritization matrix

Ranked for a **construction PM assistant MVP** — maximize daily trust, not engineering elegance.

| Rank | Name | User problem it solves | Impact | Effort | Depends on | Evidence |
|:---:|---|---|:---:|:---:|:---:|---|
| **1** | **Turn on hybrid search in production** | "When I search by exact words like 'April 26 Schedule Update' or 'fully executed', I get semantically similar but wrong files." Hybrid blends word-matching with meaning-matching. Works in demos; **off by default** in the live API. | **High** | **S** | Code / config only | find-08, find-09; plan §5 (FTS exists but gated); `RETRIEVAL_HYBRID_ENABLED=false` in production |
| **2** | **Exact-ID should include page text** | "I typed QWP-001 and it found the file, but the answer said 'could not find indexed passage' — it never read the pages." Exact-ID returns the file card only, no chunks. | **High** | **M** | Code (+ Tier 2 for that file) | answer-02; plan §13 gap "Tier 2 chunk hydration for exact-ID"; QWP-005 placeholder note in plan §13 Slice 3 |
| **3** | **Fix RFI/document family picking wrong revision** | "I asked about RFI-063 and got a *follow-up* RFI about exhaust fans instead of the original UPS question." Family resolution prefers approved status but can pick the wrong *member* when multiple files share an ID reference. | **High** | **M** | Code (+ Tier 1 metadata) | answer-11, identifier-02 (both return RFI-0140 not RFI063); plan §4a #6 revision family |
| **4** | **Use the eval harness before every release** | "We shipped a routing fix and broke schedule answers — nobody noticed until a PM tried it." Automated regression on 36 real questions already exists. | **High** | **S** | Process + existing tooling | 72% baseline in `mlj017-audit-report.json`; plan §12 gap5-eval-harness (partially done) |
| **5** | **Route content questions to Q&A, not file lists** | "I asked 'what does the spec require for concrete reinforcement' and got a list of filenames instead of an answer." Coordinator sometimes treats content questions as file-finding. Partially fixed; edge cases remain. | **High** | **S** | Code only | Plan §13 Slice 3 (done but verify); `isContentRetrievalQuery` in chat coordinator |
| **6** | **Schedule-aware search ranking** | "When I ask about Burnside milestones or MS-20 on the April schedule, I get a random look-ahead or narrative doc." Many schedule PDFs look similar to the search engine. | **Med** | **M** | Code (+ optional Tier 1 tags) | find-03 pass vs answer-05/09 fail; find-08 (executed agreement vs provisions) |
| **7** | **Spec vs drawing disambiguation** | "Section 14 24 00 returned door *drawings* when I wanted the elevator *spec*." Same CSI number appears on specs and drawings. | **Med** | **M** | Code (+ Tier 1 doc-type metadata) | find-05 fail (drawing beat spec); answer-03 pass (Q&A path ranked spec correctly) |
| **8** | **Verbatim snippet + open link in citations** | "The AI says ASME A17.1 applies — but I can't click to the page or see the exact sentence." Required by stakeholder decision D7/D8; deep links captured at ingest but not shown in citations. | **Med** | **M** | Code (+ Graph webUrl in prod) | Plan §0 D7/D8, §13 Phase 3; gap2-source-links, gap4-citation-snippet |
| **9** | **Metadata filters in search UI/API** | "Show me only **approved** submittals in **Division 22** at **Burnside**." Filters exist in data model but not exposed to users. | **Med** | **M** | Code + UI | Plan §5 metadata filters gap; §13 Phase 1 |
| **10** | **Index submittals & RFIs for content search** | "I know the submittal exists — why can't I ask what's in it?" Only ~8% of files have searchable text; submittals/RFIs lag specs. | **High** (long-term) | **L** | **Indexing** (in progress) | answer-01, answer-10, answer-11; snapshot 870/10,721 indexed; plan todo mvp-corpus-tier2-index ~80% of hydrated corpus |
| **11** | **Preview panel should use exact-ID too** | "The retrieval preview in the UI doesn't match what chat finds for QWP-001." `retrieveSources` skips the exact-ID shortcut that chat uses. | **Low** | **S** | Code only | retrieval-how-it-works.md; plan comparison table |
| **12** | **Smarter reranking (cross-encoder)** | "Top result is close but not quite — the second result was actually right." Today reranking is a simple word-overlap tweak, not a learned relevance model. | **Low–Med** | **M–L** | Code + infra | Plan §5 reranking partial; gap5-reranker |

---

## 4. Recommended priority tiers for NEXT sprint

*Focus: user trust and answer quality — **not** indexing throughput.*

### Tier A — Do first

| Item | Why now (1–2 sentences for PMs) |
|---|---|
| **#1 Hybrid search on in production** | Lowest-effort, highest-leverage fix: word-heavy construction queries (schedule names, "fully executed", station names) already pass in demos with hybrid on. Flipping a flag closes several find-bucket failures without waiting for indexing. |
| **#4 Eval harness in release process** | You already have 36 labeled questions and a 72% baseline. Running `pnpm eval:mlj017` before each release prevents silent regressions while you fix the answer bucket (50%). |
| **#5 Verify coordinator routing** | Content-vs-file-list routing was fixed once but answer failures still show "Need Indexed QWP" placeholders — confirm content questions always reach search+Q&A, not filename lists. |
| **#2 Exact-ID + page text hydration** | This is the #1 trust killer: user sees the correct file name, then gets no answer. After exact-ID finds the file, automatically pull indexed chunks from that file for Q&A. |
| **#3 RFI family revision fix** | RFIs are legally and operationally sensitive. Returning a follow-up RFI when the user asked about the original erodes confidence faster than a slow search. |

### Tier B — Do second

| Item | Why second |
|---|---|
| **#6 Schedule-aware ranking** | Schedule questions fail even when the right file is indexed (find-03 passes; answer-05/09 fail). Needs ranking logic, not just more indexing. |
| **#7 Spec vs drawing disambiguation** | Same section number on specs and drawings confuses find-mode; Q&A sometimes recovers. Hard doc-type filter is a targeted fix for daily spec lookups. |
| **#8 Snippet + deep link in citations** | Stakeholder-required (D7/D8). Doesn't fix retrieval misses but makes correct answers *verifiable* — PMs can click and confirm. |
| **#9 Metadata filters** | Unlocks "approved only," discipline, station — reduces ambiguous-04-style noise. Depends on Tier 1 metadata already extracted. |
| **#11 Preview panel exact-ID parity** | Small consistency fix; low user-visible impact unless team uses preview for debugging. |

### Tier C — Defer

| Item | Why defer |
|---|---|
| **#10 Full corpus indexing** | Critical for coverage but **already running** (~80% of hydrated files). Don't block sprint on speed — block on *what happens after* a file is indexed (items #2, #3, #6). |
| **#12 Cross-encoder reranking** | Diminishing returns until hybrid search, exact-ID hydration, and doc-type disambiguation are in place. Heuristic rerank exists; upgrade when eval plateaus. |

---

## 5. What NOT to do yet

| Idea | Why defer (brief) |
|---|---|
| **Elasticsearch / second search engine** | Decision D5/D11: Postgres handles current scale (~65K chunks). A second datastore adds ops cost before we've exhausted hybrid search, metadata filters, and Tier 2 coverage on one store. Revisit at ~1M+ chunks or heavy faceting needs. |
| **Doc-type chunking (Phase 4)** | Large engineering effort (weeks). Generic page/paragraph chunks work for specs today (answer-03, answer-06 pass). Per-type chunkers (QWP hold points, RFI Q↔A pairs, submittal comment/response) matter *after* more submittals/RFIs are indexed and exact-ID hydration works. |
| **Full 160-case eval suite** | Plan §12 targets ~160 cases (50 find / 50 answer / 20 identifier / 20 ambiguous / 20 not-found). The 36-case harness is enough to catch regressions *now*. Expand the set when Tier A fixes land and pass rate climbs — otherwise you're measuring noise. |
| **Formal abstain intent** | Stakeholder decision D9: message-based "not found" is sufficient for MVP. Don't invest in a separate abstain classifier until answer quality on indexed content is consistently good. |

---

## Appendix: Quick reference for PM conversations

| Question | Short answer |
|---|---|
| "Can it find QWP-001?" | **Yes** — document numbers work reliably (100% on eval). |
| "Can it tell me what's *in* QWP-001?" | **Sometimes** — only if that file's text is indexed *and* exact-ID path loads the chunks (gap #2). |
| "Why 72% and not higher?" | Half of answer-type questions fail — mostly missing/wrong source or unindexed content, not bad AI writing. |
| "What's indexing vs search?" | **Indexing** = reading files into searchable text (slow, ongoing). **Search/RAG** = using that text (fixable this sprint). |
| "What should we demo to executives?" | Exact-ID lookup, spec Q&A (elevator codes, plumbing scope, backer rod), honest not-found. Avoid schedule milestones and RFI content until Tier A fixes land. |

**Run the eval yourself:** from `packages/backend`, run `pnpm eval:mlj017`. Report writes to `eval/mlj017-audit-report.json`.

**Technical deep dive (for engineers):** see `retrieval-how-it-works.md` in this folder.

**Source plan:** Construction RAG plan §0 (decisions D1–D9), §5 (retrieval signals), §13 (rollout gaps).
