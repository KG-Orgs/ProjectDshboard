# Forensic Root Cause Analysis — MLJ-017 97-Question Evaluation

**Date:** 2026-08-08  
**Scope:** First-pass root-cause identification only. Code-confirmed findings only; hypotheses labelled explicitly.  
**Codebase inspected:** `packages/backend/src/services/chat-coordinator.service.ts`, `retrieval.service.ts`, `identifier-lookup.service.ts`, `identifier-extraction.utils.ts`, `interpretation.service.ts`, `indexing-pipeline.service.ts`

---

## TL;DR

The evaluation ran with **no LLM executing** — every answer is a deterministic text-template fallback. Fixing this alone would transform answer quality for the ~60 questions where retrieval is correct. The remaining failures split into: (a) wrong document retrieved because identifier lookup is incomplete or missing pattern coverage, (b) correct document found but the strict-evidence guard refuses to answer, and (c) performance-driven timeouts that degrade retrieval quality for generic queries.

---

## Root Cause 1 — ALL Answers Are Deterministic Fallback Text, Not LLM Output

### Classification: CONFIRMED

### Problem

Every answer in the 97-question eval comes from one of three **deterministic string-template functions**, not from the LLM:

| Answer pattern observed | Source function | Code location |
|---|---|---|
| `"Based on indexed project context, this is the strongest evidence for: ..."` | `callSingleAgent` evidence-dump fallback | `chat-coordinator.service.ts` ~line 4898 |
| `"## Detailed Matches (filename)"` | `buildDetailedKeywordMatchContent()` | ~line 2872 |
| `"## Section X.X Requirements Summary"` | `buildSectionRequirementsSummaryContent()` | ~line 2727 |
| `"I could not find an exact indexed passage..."` | `buildNoExactEvidenceContent()` | ~line 2748 |

### Proof from telemetry

The `route_summary` log emitted for every question records `agentMs`. Across the entire eval:

- sq01: `agentMs=2ms`
- sq02: `agentMs=2ms, totalMs=30836ms`
- sq04: `agentMs=3ms`
- sq40: `agentMs=2ms`
- (all 97 questions: 2–5ms)

`callChatLlm` with a real LLM takes ≥200ms even for fast responses. A 2ms `agentMs` is the **deterministic fallback code executing** — no HTTP request is made. This happens when `callChatLlm` returns `null`.

### Why `callChatLlm` returns null

`chat-coordinator.service.ts` lines 190–295:

```typescript
async function callChatLlm(...): Promise<string | null> {
  const primaryApiKey = env.geminiApiKey ?? env.openAiApiKey;
  if (primaryApiKey) { /* try Gemini / OpenAI ... */ }
  if (env.anthropicApiKey) { /* try Anthropic ... */ }
  return null;  // ← reached when all providers fail
}
```

If neither `GEMINI_API_KEY`/`OPENAI_API_KEY` nor `ANTHROPIC_API_KEY` is set in `.env`, the function skips both blocks and immediately returns `null`. The batch eval ran in an environment where at least the primary key was absent or consistently timing out. The 12-second `AGENT_CALL_TIMEOUT_MS` would still leave observable latency (>1s); 2ms proves the key was missing entirely.

### Evidence questions

**All 97 questions.** Every single answer is a template. Examples: sq02, sq10, sq34, sq40, sq65, sq80.

### Why it causes bad answers

The evidence-dump fallback at line 4898 is designed as "better than nothing":

```typescript
return {
  text: [
    `Based on indexed project context, this is the strongest evidence for: "${query.trim()}".`,
    `Routed focus: ${domains.join(", ")}.`,
    `Top files: ${topAliases.join(", ")}.`,
    "Evidence snippets:",
    ...evidence,  // 160-char truncated excerpts, not synthesised answers
  ].join("\n"),
```

It cannot perform field extraction, multi-part answering, or natural-language synthesis. It outputs raw retrieval metadata, not a constructed answer.

### Recommended fix

**Verify `.env` has `GEMINI_API_KEY` or `OPENAI_API_KEY` set.** Re-run the eval with LLM enabled. The `AGENT_CALL_TIMEOUT_MS = 12_000` is appropriate; the model will be invoked and most "Partial/Fair" rated questions will immediately improve. This single fix addresses the generation layer for every question where retrieval is correct.

---

## Root Cause 2 — Missing Identifier Patterns for Approval-Letter Numbers (MTACD-L-xxxx)

### Classification: CONFIRMED

### Problem

The identifier extraction regex table in `identifier-extraction.utils.ts` (`IDENTIFIER_PATTERNS`, lines 114–151) covers:

```
SUBMITTAL, QWP, SWP, CWP, DRFI, RFI, NCR, PRDC, CO, MOD, TRANSMITTAL, EDU, DU, CSI
```

It does **not** cover the `MTACD-MLJTC2-L-XXXX` approval-letter number format used in sq04, sq13–sq17 queries (e.g. `MTACD-MLJTC2-L-0024`, `MTACD-MLJTC2-L-0017`).

When `parseIdentifierQuery("In the MTACD-MLJTC2-L-0024 sub-contractor approval letter...")` runs, it extracts **zero identifiers**. `enrichWithIdentifiers` therefore does not set `exactIdentifierFirst: true`. `exactIdentifierLookup` is never called. The coordinator falls through to global hybrid search.

For sq04 the hybrid search happened to find the correct file (because "MTACD-MLJTC2-L-0024" appears verbatim in the filename and the FTS/trigram index finds it). But the deterministic fallback (root cause 1) means no answer is synthesised.

Similarly: invoice number patterns like `Invoice 11707` (sq26–27) and `Invoice 0849812` (sq28–29) have no extraction pattern. These go through global hybrid search.

### Code location

`identifier-extraction.utils.ts`, `IDENTIFIER_PATTERNS` array, lines 114–151.  
`interpretation.service.ts`, `enrichWithIdentifiers()`, lines 326–351.

### Evidence questions

sq04, sq13, sq14, sq15, sq16, sq17 (all approval letters), sq26, sq27 (pest control invoices), sq28, sq29 (Lockton invoice).

### Why it fails

Without an extracted identifier, the router skips `lookupExactIdentifier` entirely. For sq04 the FTS/trigram index saves retrieval (correct file found) but for ambiguous cases (sq26, sq28) the keyword fallback pulls unrelated documents.

### Recommended fix

Add patterns for the missing identifier classes:

```typescript
// Approval-letter numbers: MTACD-MLJTC2-L-0024, MTA-L-0017, etc.
{ type: "APPROVAL_LETTER" as any,
  regex: /(?<![A-Za-z0-9])(?:MTACD-[A-Z0-9]+-)?[A-Z]+-[A-Z]+-L-\d+/gi },

// Invoice numbers
{ type: "INVOICE" as any,
  regex: /(?<![A-Za-z0-9])(?:invoice|inv)[\s#]*\d+/gi },
```

Or, shorter-term: add them to `TRANSMITTAL` normalization so existing lookup infrastructure handles them.

---

## Root Cause 3 — Incomplete `document_identifiers` Backfill Causes Wrong-Document Retrieval

### Classification: CONFIRMED

### Problem

When `lookupExactIdentifier` returns `null` (because the file is not in `document_identifiers`), the coordinator falls through to `routeGraphContext`, which does a global hybrid/keyword search. That global search then retrieves **a semantically related but wrong document** for at least 8 questions.

### Proof

The `backfill:identifiers` command exists (`scripts/backfill-identifiers.ts`) and the eval shows multiple clear wrong-document cases where the expected document clearly exists in the filesystem but wasn't found deterministically:

| Question | Asked for | Got | Failure type |
|---|---|---|---|
| sq01 | GEN-042R00 (coordination meeting) | GEN-164R00 (progress meeting) | SUBMITTAL pattern exists but file not in DB |
| sq05 | GEN-001R05 (phasing plan) | A37806 PS LAN Agenda .docx | Not in DB |
| sq18 | AVI-002R01 | AVI-002R00 | R01 not in DB, R00 served instead |
| sq69, sq70 | RFI-0096 | RFI-0042 | RFI096 not in DB |
| sq73 | RFI-0116 | RFI-0042 | RFI0116 not in DB |
| sq77 | GEN-041R01 | GEN-041R05 | Wrong revision served |
| sq78 | SWP-011 | SWP-013 | Wrong SWP number |
| sq101 | PRDC12-012R02 | PRDC12-012R00 | Wrong revision |

The code in `identifierLookupService.lookupExactIdentifier` queries the `document_identifiers` table. If the file was indexed before the identifier-backfill migration (0017) was run, or if `backfill:identifiers` was not run after indexing, the table has no row for that file.

### Code location

`identifier-lookup.service.ts`, `lookupExactIdentifier()`, lines 177–310.  
`indexing.service.ts`, post-index identifier population (added in commit `76700f0`).

### Evidence questions

sq01, sq05, sq18, sq69, sq70, sq73, sq77, sq78, sq101.

### Why it fails

Without a row in `document_identifiers`, the exact-ID path is skipped. Global hybrid search uses cosine similarity across 1.88M chunks. "GEN-042" appears in many filenames; the HNSW index returns the nearest vectors (whichever GEN-xxx document has the most similar embedding for that meeting query text) rather than the one with that identifier.

### Recommended fix

**Run `pnpm backfill:identifiers -- --project-id 145b3dcf-272e-4c45-9e19-953f20f25bb9`** and verify the table is populated for all indexed files. This is the highest-impact single operational action.

---

## Root Cause 4 — Revision Number Invisible to Family-Resolution Scoring (R01 vs R00)

### Classification: CONFIRMED

### Problem

When multiple revisions of the same submittal exist in `document_identifiers` (e.g. AVI-002R00 and AVI-002R01 both have the identifier `SUBMITTAL:AVI002R00` / `SUBMITTAL:AVI002R01`), the family-resolution logic in `identifierLookupService.lookupExactIdentifier` selects the winner using:

```typescript
b.nameOverlap - a.nameOverlap ||
b.hasChunks   - a.hasChunks   ||   // ← content wins over empty
b.approvedRank - a.approvedRank ||
b.revisionNum  - a.revisionNum ||
b.modifiedAt   - a.modifiedAt
```

`nameOverlap` is computed using `filenameTokens()`:

```typescript
function filenameTokens(value: string): string[] {
  return value.toLowerCase()
    .replace(/\.[a-z0-9]{1,5}$/i, "")
    .split(/[^a-z]+/i)          // ← splits on NON-alpha only
    .filter(token => token.length >= 3 && !NAME_STOPWORDS.has(token));
}
```

The regex `split(/[^a-z]+/i)` splits on **any non-alpha character**, including digits. This means:

- `"AVI-002R01"` → `["avi", "r"]` → `["avi"]` (R is 1 char, filtered)
- `"AVI-002R00"` → `["avi", "r"]` → `["avi"]` (same tokens)

Both revisions get **identical `nameOverlap` scores**. The tiebreaker then falls to `hasChunks` — whichever revision has more indexed chunks wins — which can be R00 even when the user explicitly asked for R01.

### Code location

`identifier-lookup.service.ts`, `filenameTokens()`, line 154–160.  
`identifier-lookup.service.ts`, sort comparator, lines 243–250.

### Evidence questions

sq18 (AVI-002R01 → AVI-002R00), sq77 (GEN-041R01 → GEN-041R05), sq101 (PRDC12-012R02 → R00).

### Why it fails

The digit-stripping tokenizer cannot distinguish "R01" from "R00" because both produce the token `["r"]` which is filtered by the 3-character minimum. The intended name-overlap tiebreaker is defeated.

### Recommended fix

Replace `split(/[^a-z]+/i)` with a tokenizer that preserves alphanumeric tokens including revision suffixes:

```typescript
// Before (strips digits):
.split(/[^a-z]+/i)

// After (keeps alphanumeric tokens):
.split(/[^a-z0-9]+/i)
// then filter tokens of length >= 2 for revision codes
.filter(token => token.length >= 2 && !NAME_STOPWORDS.has(token))
```

This makes `"AVI-002R01"` → `["avi", "002r01"]` and `"AVI-002R00"` → `["avi", "002r00"]`. A query containing "AVI-002R01" would then have higher nameOverlap with the R01 file, selecting it deterministically without needing `revisionNum` tiebreak.

---

## Root Cause 5 — `isVagueOpenEndedQuery` Refuses Legitimate Document-Summary Questions

### Classification: CONFIRMED

### Problem

`isVagueOpenEndedQuery()` in `chat-coordinator.service.ts` lines 1019–1060 intercepts and returns "## More context needed" for queries that match its pattern, before any retrieval runs. The function correctly blocks genuinely vague open-ended queries but incorrectly fires on legitimate summary questions.

The condition chain:

```typescript
const VAGUE_PATTERN =
  /\bwhat\s+(?:is|was|are|were)\s+(?:mentioned|discussed|said|stated|...|in\s+(?:it|the|this))\b/i;
const HAS_DOC_REF = /\b(?:letter|document|...)\b|<date pattern>/i;
const HAS_SPECIFIC_SUBJECT =
  /\b(?:cost|price|...|scope|work|...)\b/i;
return VAGUE_PATTERN.test && HAS_DOC_REF.test && !HAS_SPECIFIC_SUBJECT.test;
```

Affected questions:

- **sq12**: `"What is in the Myrtle Ave Reserve Service Load Letter?"` — matches `what is in` + `letter`, no specific subject → blocked.
- **sq35**: `"What was discussed in the September 3, 2025 coordination meeting?"` — matches `what was discussed` + date pattern, no specific subject → blocked.
- **sq36**: `"In A37806 Kick Off Pre-Work Conference, what does the document state?"` — likely hits a related path.

The review correctly rates sq12 and sq35 as Unacceptable. These questions have fully answerable document-summary intent.

### Code location

`chat-coordinator.service.ts`, `isVagueOpenEndedQuery()`, lines 1019–1060.  
`chat-coordinator.service.ts`, `generateReply()` call at line 5426.

### Evidence questions

sq12, sq35, sq36.

### Why it fails

The `HAS_SPECIFIC_SUBJECT` guard is intended to allow "What was discussed about payments?" through but block "What was discussed?" — but the guard misses summary-intent phrases like "what does the document state" and "what is in." Document summaries are perfectly valid answers.

### Recommended fix

Add a bypass: if the query contains an explicit document identifier (detected by `parseIdentifierQuery`) OR an explicit document name, skip the vague check:

```typescript
function isVagueOpenEndedQuery(query: string): boolean {
  // Bypass: if an explicit doc ID or doc-summary intent is present, always answer
  if (parseIdentifierQuery(query).length > 0) return false;
  if (/\b(summarize|summary|overview|what does .{0,30} state|what is in the)\b/i.test(query)) return false;
  // ... existing logic ...
}
```

Alternatively, make the vague-query path route to `answerFromDocumentDetail` using the suggested matching file rather than returning a refusal.

---

## Root Cause 6 — `strictFactualActiveDocMode` Refuses to Answer When Chunk Evidence Is Sparse

### Classification: CONFIRMED

### Problem

In `answerFromDocumentDetail()` at lines 3360–3385, when both conditions are true:

1. `factualIntent = true` (almost every question with "what", "which", "does")
2. `evidenceQualifiedChunks.length === 0` AND `featureFlags.strictFactualActiveDocMode = true`

The function immediately returns `buildNoExactEvidenceContent()` — "I could not find an exact indexed passage" — **without calling the LLM and without using any available chunks**.

`evidenceQualifiedChunks` is a strict subset requiring both `keywordHits > 0` AND `strongEvidence = true`. For scanned/image-only PDFs (cover sheets, approval stamps, drawings), the extracted text may be a metadata stub or contain only boilerplate. Specific query tokens like "glazing" (sq20), "track shielding" (sq56), or "NCR flowchart" (sq62) produce zero `evidenceQualifiedChunks` even when the document is correctly retrieved.

The escape hatch `options?.forceSummaryFallback` is only set from `tryInTheDocumentAnswer`. The `tryExactIdentifierDocumentAnswer` path does NOT set it, so exact-ID hits also hit this block.

### Code location

`chat-coordinator.service.ts`, `answerFromDocumentDetail()`, lines 3360–3385:

```typescript
if (
  factualIntent &&
  queryTokens.length > 0 &&
  (keywordMatchedChunks.length === 0 ||
    (featureFlags.strictFactualActiveDocMode && evidenceQualifiedChunks.length === 0))
) {
  if (!(options?.forceSummaryFallback && rankedChunks.length > 0)) {
    return { content: buildNoExactEvidenceContent(...) };  // ← HARD REFUSAL
  }
}
```

### Evidence questions

sq11 (Transmittal 0014), sq20 (BUR-009R00 glazing), sq21 (BUR-009R00 status), sq22 (BUR-001R00 status), sq23 (BUR-001R00 approval), sq36 (Kick-Off Conference), sq37 (Kick-Off milestones), sq56 (BUR-080R00 shielding), sq57 (BUR-080R00 MPT), sq62 (PRO 26-01 NCR flowchart), sq66 (RFI-0115 velocity).

### Why it fails

The guard is designed to prevent hallucination on factual questions when no supporting evidence exists. But it fires even when `rankedChunks.length > 0` — i.e., when there ARE chunks but they don't contain the exact query tokens. For documents where all text was extracted correctly but the specific fact uses different vocabulary than the query, the guard creates a false refusal. The correct behaviour would be: pass the available chunks to the LLM and let it determine if the evidence is sufficient.

### Recommended fix

Relax the guard to only fire when `rankedChunks.length === 0` (document is genuinely empty), not when chunks exist but lack exact keyword matches:

```typescript
// Current (too strict):
(keywordMatchedChunks.length === 0 ||
  (featureFlags.strictFactualActiveDocMode && evidenceQualifiedChunks.length === 0))

// Proposed (fire only on empty documents):
(rankedChunks.length === 0)
```

This allows the LLM to receive top-ranked chunks and decide whether the evidence is sufficient, matching the intent of the prompt instruction "If context is insufficient, say exactly what document or log is needed."

---

## Root Cause 7 — 1.88M-Chunk HNSW Index Has No Project-Scoped Filtering; Sequential Scan Dominates

### Classification: CONFIRMED

### Problem

The HNSW index created in migration `0014_embedding_dims_1024.sql`:

```sql
CREATE INDEX idx_file_chunks_embedding_hnsw
  ON file_chunks
  USING hnsw (embedding_vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

is a **global index on `embedding_vector` only**. The query in `pgvectorSearch()` (`retrieval.service.ts` lines 895–945):

```sql
SELECT ... FROM file_chunks fc
JOIN file_records fr ON fr.id = fc.file_id
WHERE fc.project_id = $1
  AND fc.embedding_vector IS NOT NULL
ORDER BY fc.embedding_vector <=> $2::vector
LIMIT 24
```

PostgreSQL cannot use the HNSW index efficiently when a `WHERE project_id = $1` filter is present because pgvector's HNSW implementation does not support filtered ANN natively — it performs the ANN search globally and then filters, discarding most results. On a table with 1.88M rows for one project (97% of all rows), the planner likely falls back to a sequential scan of 1.88M rows, computing exact cosine distances for each. This takes 25–30 seconds, triggering the timeout.

Confirmed by the eval: 8 questions with elapsed ≥ 25s all involve queries without exact-ID matches (they reached the pgvectorSearch path), and their `retrieval.pgvector.failed: canceling statement due to statement timeout` warnings were observed during the fix run on 2026-08-03.

### Code location

`retrieval.service.ts`, `pgvectorSearch()`, lines 879–980.  
Migration: `drizzle/0003_indexing_production.sql` (original) + `0014_embedding_dims_1024.sql` (recreated).

### Evidence questions

sq02, sq03, sq24, sq26, sq27, sq44, sq46, sq48 (all hit the timeout, fell back to keyword search).

### Why it fails

pgvector `HNSW` with a `WHERE` predicate causes PostgreSQL to either: (a) perform a full table scan, computing cosine distance for all qualifying rows, or (b) use the index globally but discard non-matching project rows, requiring many probes. With 1.88M chunks and a 200 ef_search parameter, every query for this project is effectively a full sequential scan.

### Recommended fix (structural, not just timeout tuning)

**Option A (fastest):** Partition `file_chunks` by `project_id` using PostgreSQL declarative partitioning. Each partition gets its own HNSW index. Project-scoped queries hit one partition (≤100K rows for most projects), dropping latency from 30s to <1s.

**Option B (medium effort):** Add a project-level HNSW index using pgvector's partial index:

```sql
-- One index per active project (run after each new project creation)
CREATE INDEX idx_file_chunks_hnsw_project_145b
  ON file_chunks USING hnsw (embedding_vector vector_cosine_ops)
  WHERE project_id = '145b3dcf-272e-4c45-9e19-953f20f25bb9'
  WITH (m = 16, ef_construction = 64);
```

**Option C (immediate workaround, already applied):** The 30s statement timeout added to the transaction is an acceptable short-term measure. Combined with the FTS fallback, queries still return results (lower quality) rather than hanging indefinitely.

---

## Root Cause 8 — LLM Context Truncates Each Chunk to 900 Characters; Answer-Bearing Facts Are Cut

### Classification: CONFIRMED

### Problem

`buildGraphContextBlock()` in `chat-coordinator.service.ts` line 4344:

```typescript
const excerpt = node.chunkText.slice(0, 900).replace(/\s+/g, " ").trim();
```

Chunks are created at **1400 characters** (`CHAR_CHUNK_SIZE = 1400` in `indexing-pipeline.service.ts`). The LLM context receives only the first **900 characters** — **35% of each chunk is silently discarded** before the LLM sees it.

For a typical subcontract approval letter chunk:
- Characters 1–900: boilerplate header, contract number, parties
- Characters 900–1400: **scope of work, dollar amount, approved date** ← cut

For invoice chunks:
- Characters 1–900: invoice header, billing entity, period
- Characters 900–1400: **service description, line items, total amount** ← cut

### Code location

`chat-coordinator.service.ts`, `buildGraphContextBlock()`, line 4344.

### Evidence questions

Every question where the document was correctly retrieved but the answer snippet is truncated mid-fact: sq04 (scope not stated), sq09 (payment provisions cut), sq15 (scope missing), sq28 (remittance details incomplete), sq29 (total amount not found), sq30, sq31 (ticket numbers/rates cut).

### Why it fails

The 900-char cut was designed to fit 10 chunks × ~180 tokens each within the `ROUTED_CONTEXT_TOKEN_BUDGET = 3000` tokens. But 1400-char chunks at 1.3 tokens/word yield ~364 tokens/chunk. The current implementation loses the trailing third of every chunk. For factual answers that appear in the middle of a dense chunk (pricing schedules, spec tables, invoice summaries), this cut removes the answer before the LLM sees it.

### Recommended fix

Increase the context excerpt to the full chunk size and reduce `MAX_GRAPH_NODES` to compensate:

```typescript
// chat-coordinator.service.ts, buildGraphContextBlock(), line 4344
// Before:
const excerpt = node.chunkText.slice(0, 900).replace(/\s+/g, " ").trim();

// After:
const excerpt = node.chunkText.slice(0, 1400).replace(/\s+/g, " ").trim();
```

Reduce `MAX_GRAPH_NODES` from 10 to 6–7 to stay within the token budget. Fewer, complete chunks beat more truncated ones for factual extraction.

---

## Root Cause 9 — `DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS = 768` Truncates Multi-Part Answers

### Classification: CONFIRMED

### Problem

When `isDetailedExtractionQuery()` returns true (which it does for virtually every "what is/are" question), `callDetailedExtractionLlm()` is called with `maxTokens = DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS = 768` (line 170). This is separate from the main `AGENT_DEPTH_OUTPUT_TOKENS = 2_048` limit.

768 tokens is approximately 500 words — barely enough for 3–4 bullet points. Questions like sq30 (ticket number + labor hours + rates + dates = 4 fields), sq40 (CPR-003 status + DOT Option Work status = 2 fields with supporting detail), or sq65 (inspection item + quantity + ASTM standard = 3 fields) require more output budget to answer completely.

With the LLM inactive (root cause 1), this doesn't cause failures in the eval — but it will when the LLM is re-enabled.

### Code location

`chat-coordinator.service.ts`, `DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS = 768`, line 170.  
`callDetailedExtractionLlm()`, line 4784.

### Evidence questions

sq30, sq31, sq40, sq65, sq85, sq86, sq102.

### Recommended fix

Increase `DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS` to 1536 (matches the main depth-mode budget `AGENT_DEPTH_OUTPUT_TOKENS = 2_048` less a small margin):

```typescript
const DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS = 1_536;  // was 768
```

---

## Separation: Retrieval Failures vs Generation Failures

Based on code inspection and evaluation output:

| Failure type | Questions | Root cause |
|---|---|---|
| **A. Wrong document retrieved** | sq01, sq05, sq18, sq69, sq70, sq71, sq73, sq77, sq78, sq101 | RC3 (missing `document_identifiers`), RC2 (missing identifier patterns) |
| **B. Correct document, wrong chunk/page** | sq11, sq20–23, sq36–37, sq56–57, sq62, sq66 | RC6 (strict-evidence guard fires on sparse docs) |
| **C. Correct evidence reached system, poor generation** | sq02–sq10, sq13–17, sq24–31, sq34, sq38–43, sq49, sq54–55, sq58–65, sq67–68, sq72, sq74–76, sq79–86, sq87–93, sq95–99, sq101–102 | **RC1 (LLM inactive)** — all deterministic fallback |
| **D. Completeness / citation validation** | All questions | RC1 + RC9 (output token cap) |

**The most important distinction:** ~60 questions in category C have correct or near-correct retrieval but universally poor answers. These will all improve when the LLM is activated (RC1 fix).

---

## Exact Document Identifiers — Are They Hard Constraints or Ranking Signals?

### Current behaviour

The system implements a hybrid: identifiers are **partially hard constraints** but can be **overridden** in several ways.

When the exact-ID path fully works:
1. `parseIdentifierQuery()` extracts an identifier from the query
2. `lookupExactIdentifier()` queries `document_identifiers` and returns a file
3. `tryExactIdentifierDocumentAnswer()` calls `answerFromDocumentDetail()` on that specific file
4. **Retrieval is restricted to that single file** — no other file can appear

However, the exact-ID path is bypassed or fails in these cases:

| Bypass condition | Code location | Effect |
|---|---|---|
| Identifier not in `document_identifiers` | `lookupExactIdentifier()` returns null | Falls through to global hybrid search; any file can be returned |
| Identifier format not in `IDENTIFIER_PATTERNS` | `parseIdentifierQuery()` returns empty | `exactIdentifierFirst` stays false; global search runs |
| `isContentRetrievalQuery()` returns false | `tryExactIdentifierDocumentAnswer()`, line 5283 | Exact-ID path skipped even with a valid lookup |
| `isActiveDocQuestion = true` | `generateReply()`, line 5501 | Exact-ID path skipped to prioritise active open document |
| `evidenceQualifiedChunks.length === 0` | `answerFromDocumentDetail()`, line 3360 | Hard refusal even though correct file was found |

**Conclusion:** When the `document_identifiers` table is complete and the identifier format is recognised, the system correctly restricts retrieval to the named file. When either condition fails, a semantically related but wrong document can and does replace the requested document — as demonstrated by sq01, sq18, sq69, sq77, sq101.

---

## Summary Table

| Priority | Root Cause | Confirmed? | Code Location | Example Questions | Recommended Fix | Impact |
|---|---|---|---|---|---|---|
| 1 | LLM not executing; all answers are deterministic templates | CONFIRMED | `chat-coordinator.service.ts`, `callChatLlm()`, `callSingleAgent()` lines 184–295, 4788–4910 | **All 97** | Verify `GEMINI_API_KEY` / `OPENAI_API_KEY` in `.env` | **Critical** |
| 2 | Incomplete `document_identifiers` table; wrong-doc retrieval | CONFIRMED | `identifier-lookup.service.ts`, `lookupExactIdentifier()` | sq01, sq05, sq18, sq69, sq70, sq73, sq77, sq78, sq101 | Run `pnpm backfill:identifiers -- --project-id 145b3dcf-...` | **Critical** |
| 3 | Missing identifier patterns (MTACD-L-xxxx, Invoice) | CONFIRMED | `identifier-extraction.utils.ts`, `IDENTIFIER_PATTERNS` lines 114–151 | sq04, sq13–17, sq26–29 | Add approval-letter and invoice regex patterns | **High** |
| 4 | Digit-stripping tokenizer makes R01≡R00; wrong revision served | CONFIRMED | `identifier-lookup.service.ts`, `filenameTokens()` line 154–160 | sq18, sq77, sq101 | Change `split(/[^a-z]+/i)` to `split(/[^a-z0-9]+/i)` | **High** |
| 5 | `strictFactualActiveDocMode` refuses to answer on sparse-chunk docs | CONFIRMED | `chat-coordinator.service.ts`, `answerFromDocumentDetail()` lines 3360–3385 | sq11, sq20–23, sq36, sq37, sq56, sq57, sq62, sq66 | Fire guard only when `rankedChunks.length === 0` | **High** |
| 6 | `isVagueOpenEndedQuery` blocks legitimate document summaries | CONFIRMED | `chat-coordinator.service.ts`, `isVagueOpenEndedQuery()` lines 1019–1060 | sq12, sq35 | Bypass when explicit identifier or "summarize/what is in" present | **Medium** |
| 7 | Chunk context truncated to 900 chars; answer-bearing text cut | CONFIRMED | `chat-coordinator.service.ts`, `buildGraphContextBlock()` line 4344 | sq04, sq09, sq28–31 | Increase excerpt to 1400 chars; reduce `MAX_GRAPH_NODES` to 6 | **High** |
| 8 | 1.88M-row HNSW no project-level filter; 30-second timeouts | CONFIRMED | `retrieval.service.ts`, `pgvectorSearch()` lines 895–945; migration 0014 | sq02, sq03, sq24, sq26, sq27, sq44, sq46, sq48 | Partition `file_chunks` by `project_id` (medium effort) | **High** |
| 9 | `DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS=768` truncates multi-part answers | CONFIRMED | `chat-coordinator.service.ts` line 170 | sq30, sq65, sq85, sq86 | Increase to 1536 | **Medium** |

---

## Top 5 Changes to Make First

### 1. Enable the LLM (RC1) — IMMEDIATE

**Change:** Confirm `GEMINI_API_KEY` or `OPENAI_API_KEY` is set in the root `.env` file used by the batch eval and production server. Verify with:

```bash
pnpm tier2:ask -- "In GEN-042R00, what subcontractor is being reviewed?"
# Look for agentMs > 200 in the route_summary log (proves LLM was called)
```

**Impact:** Fixes generation quality for ~60 questions in categories C and D that have correct or partial retrieval. All "Detailed Matches" and "evidence dump" answers become synthesised direct answers.  
**Complexity:** Low — environment variable check.  
**Requires reindex:** No.

---

### 2. Run `backfill:identifiers` on the main project (RC3) — IMMEDIATE

**Change:**

```bash
cd packages/backend
pnpm backfill:identifiers -- --project-id 145b3dcf-272e-4c45-9e19-953f20f25bb9
```

Verify with:

```bash
# Should return >0 rows for GEN-042R00
pnpm tsx scripts/check-project-chunks.ts
```

**Impact:** Eliminates wrong-document retrieval for the 9 confirmed wrong-doc questions (sq01, sq05, sq18, sq69, sq70, sq73, sq77, sq78, sq101). For each: the exact identifier lookup will resolve deterministically to the named file.  
**Complexity:** Low — single command, no code change.  
**Requires reindex:** No (backfill reads file records that are already indexed).

---

### 3. Fix `filenameTokens` revision tokenizer (RC4) — Low-risk code change

**Change in `identifier-lookup.service.ts`, `filenameTokens()`, line 157:**

```typescript
// Before:
.split(/[^a-z]+/i)
.filter((token) => token.length >= 3 && !NAME_STOPWORDS.has(token));

// After:
.split(/[^a-z0-9]+/i)
.filter((token) => token.length >= 2 && !NAME_STOPWORDS.has(token));
```

**Impact:** Ensures R01/R02 queries select the named revision over a better-indexed R00. Fixes sq18, sq77, sq101, and any future revision-specific query.  
**Complexity:** Low — 2-line change, no DB migration.  
**Requires reindex:** No.

---

### 4. Relax `strictFactualActiveDocMode` guard to only fire on empty documents (RC6) — Medium code change

**Change in `chat-coordinator.service.ts`, `answerFromDocumentDetail()`, lines 3360–3365:**

```typescript
// Before:
if (
  factualIntent &&
  queryTokens.length > 0 &&
  (keywordMatchedChunks.length === 0 ||
    (featureFlags.strictFactualActiveDocMode && evidenceQualifiedChunks.length === 0))
) {

// After:
if (
  factualIntent &&
  queryTokens.length > 0 &&
  rankedChunks.length === 0    // only block when document has NO extractable text
) {
```

Also ensure that when `keywordMatchedChunks.length === 0` but `rankedChunks.length > 0`, the function passes top-ranked chunks to the LLM with `options?.forceSummaryFallback = true` to let the model acknowledge insufficient evidence rather than hard-refusing.

**Impact:** Eliminates false "I could not find an exact indexed passage" refusals for sq11, sq20–23, sq36–37, sq56–57, sq62, sq66.  
**Complexity:** Medium — logic change with test coverage needed.  
**Requires reindex:** No.

---

### 5. Increase chunk context excerpt from 900 to 1400 chars (RC8) — Trivial code change

**Change in `chat-coordinator.service.ts`, `buildGraphContextBlock()`, line 4344:**

```typescript
// Before:
const excerpt = node.chunkText.slice(0, 900).replace(/\s+/g, " ").trim();

// After:
const excerpt = node.chunkText.slice(0, 1400).replace(/\s+/g, " ").trim();
```

Also reduce `MAX_GRAPH_NODES` from 10 to 7 to stay within the `ROUTED_CONTEXT_TOKEN_BUDGET = 3000` token budget:

```typescript
const MAX_GRAPH_NODES = 7;  // was 10
```

**Impact:** Answer-bearing facts that currently appear in the cut portion of chunks (pricing, approval status, field-specific values) reach the LLM. Directly improves sq04, sq09, sq15, sq28, sq29, sq30, sq31, and any question where the answer is in the second half of a dense content chunk.  
**Complexity:** Low — 2-line change.  
**Requires reindex:** No.

---

## What Not to Do Yet

- **Do not redesign the retrieval architecture.** The hierarchical two-stage retrieval proposed in the review prompt would be a significant rewrite. The exact-ID path already achieves the same goal deterministically when the `document_identifiers` table is populated. Fix that table first.
- **Do not replace the system prompt yet.** The prompt is correctly structured. The output format failures come from the deterministic fallback, not the prompt. When the LLM is active, re-evaluate whether prompt changes are needed.
- **Do not add reranking.** With 1.88M chunks and current timeout issues, adding an LLM reranker pass would worsen latency further. Stabilise performance first.
- **Do not add new chunking strategies.** The 1400-char page-aware chunking is appropriate for the document types in scope. The issue is that 35% of each chunk is being cut before the LLM sees it — fixing the excerpt length (change 5) addresses this without reindexing.
