# How Retrieval Works Today

This document describes the current retrieval pipeline in `packages/backend` as implemented in `retrieval.service.ts` and its supporting services. It reflects **today's behavior**, not aspirational design.

---

## Overview

Retrieval turns a user query string into ranked document results (`SearchResult[]` or lightweight `sources[]` for chat citations). Two public entry points exist:

| Function | Used by | Exact-ID short-circuit | Output shape |
|----------|---------|------------------------|--------------|
| `searchProject()` | Chat (`routeGraphContext`), `POST /api/projects/:id/search`, `tier2-search-demo` | **Yes** (DB only) | Rich `SearchResult[]` with chunks, metadata, `matchReasons` |
| `retrieveSources()` | `GET /api/projects/:id/retrieval/preview` | **No** | Slim `{ fileId, fileName, relevance }[]` — one best chunk per file |

Both paths share the same candidate generation, boosting, and reranking logic after the exact-ID gate (which only `searchProject` applies).

---

## End-to-end flow

```mermaid
flowchart TD
  Q[User query string] --> SP{Entry point}

  SP -->|searchProject| EID{DB available?}
  SP -->|retrieveSources| CAND

  EID -->|yes| LOOKUP[lookupExactIdentifier]
  LOOKUP -->|match found| EXACT[Return 1 SearchResult<br/>topRelevance=1, no chunks]
  LOOKUP -->|no match| CAND

  EID -->|no DB| MEM[inMemorySearch]

  CAND{Hybrid enabled<br/>RETRIEVAL_HYBRID_ENABLED?}
  CAND -->|yes| HYBRID[Parallel: pgvectorSearch + ftsSearch]
  HYBRID --> MERGE[mergeHybridCandidates<br/>by blend profile]
  MERGE -->|empty| KWFB[keywordSearch fallback]
  MERGE -->|has results| POST
  KWFB --> POST

  CAND -->|no| VEC[pgvectorSearch]
  VEC -->|empty| KW[keywordSearch]
  VEC -->|results| POST
  KW --> POST

  MEM --> POST

  POST[Post-processing pipeline] --> ST[applySourceTypePolicy]
  ST --> IB[applyInterpretationBoost]
  IB --> FI[applyFileIdentityBoost]
  FI --> SB[applySpecificationChunkBoost]
  SB --> RR[maybeApplyRerank]
  RR --> GROUP{searchProject or retrieveSources?}

  GROUP -->|searchProject| BYFILE[Group by fileId<br/>up to 3 chunks/file]
  GROUP -->|retrieveSources| DEDUP[Dedupe 1 chunk/file<br/>confidence tie-break]

  BYFILE --> MR[computeRankedMatchReasons]
  MR --> OUT[SearchResult[] capped at topK]
  DEDUP --> OUT2[sources[] capped at topK]
```

---

## Chat integration

Before RAG, the chat coordinator calls retrieval via `routeGraphContext()` in `chat-coordinator.service.ts`:

```typescript
retrievalService.searchProject(projectId, query, {
  topK: 8,
  minRelevance: 0.1,
  tags: mergedRouteTags,        // domain-derived tag hints
  interpretation: retrievalInterpretation,  // only if confidence ≥ 0.65
  includeChunks: true,
});
```

Key details:

- **Function:** `searchProject` (not `retrieveSources`), so exact-ID queries like `"QWP-005"` short-circuit to a single deterministic file.
- **topK:** 8 files for chat context (vs default 5 elsewhere).
- **minRelevance:** 0.1 floor filters weak matches.
- **tags:** Built from query domain classification (`buildRetrievalTags`) — passed as a filter to FTS/keyword legs only.
- **interpretation:** Passed when the chat interpreter confidence is ≥ 0.65; drives blend profile overrides and interpretation boosts.
- **Active doc scope:** When a document is open and scope is enforced, results are filtered to that `preferredFileId` after search.

Results are converted to citation sources and graph nodes via `sourcesFromSearchResults` / `buildNodesFromSearchResults`.

---

## Exact-ID short-circuit

**When triggered:** Only in `searchProject()`, when a Postgres DB is available. `retrieveSources()` does **not** perform exact-ID lookup.

**How it works** (`identifier-lookup.service.ts`):

1. **Parse** — `parseIdentifierQuery(query)` runs `extractIdentifiers()` on the query string, then sorts by routing priority:

   `QWP → SWP → CWP → RFI → DRFI → NCR → CO → MOD → SUBMITTAL → PRDC → TRANSMITTAL → DU → EDU → CSI`

2. **Normalize** — Each identifier type has deterministic normalization (`identifier-extraction.utils.ts`):
   - **Prefix+integer types** (QWP, RFI, etc.): uppercase, strip separators, collapse leading zeros.
     - `"QWP-005"`, `"QWP 5"`, `"QWP05"` → `"QWP5"`
   - **RFI** follows the same rule: `"RFI 95"` → `"RFI95"`
   - **CSI**: keep six digits — `"03 30 00"` → `"033000"`
   - **SUBMITTAL / CO / NCR**: keep zeros and status suffixes — `"GEN-023R00"` → `"GEN023R00"`

3. **Lookup** — For each parsed candidate (in priority order), query `document_identifiers` on `(projectId, type, valueNormalized)`.

4. **Revision family resolution** — When multiple files share the identifier, rank by:
   1. `statusApprovedRank(statusCode)` — e.g. APP/NET/AAN (3) > RWC/RES (2) > ORIG (1) > R&R (0) > VOID (-1)
   2. `revisionNumber(revision)` — higher revision wins
   3. `lastSynced ?? updatedAt ?? createdAt` — most recently modified wins

5. **Return** — Single `SearchResult` with `topRelevance: 1`, **no matched chunks** (Tier 1 name/path index), `exactIdentifier` metadata, `matchReasons: [{ kind: "exact_id", ... }]`, optional `discipline_station` reason, and the full `family[]` of superseded members.

---

## Hybrid vs vector-only paths

Controlled by rollout flag `RETRIEVAL_HYBRID_ENABLED` (env + optional `CANARY_PROJECT_IDS` scoping via `featureService.isRolloutFlagEnabledForProject`).

### Hybrid enabled (default in `tier2-search-demo`)

Runs **in parallel**:

- **Semantic leg:** `pgvectorSearch` — cosine distance ANN on `file_chunks.embedding_vector`
- **Lexical leg:** `ftsSearch` — PostgreSQL full-text search

Results are merged by `mergeHybridCandidates`. If the merge is empty, falls back to `keywordSearch` (trigram ILIKE).

### Hybrid disabled (legacy path)

1. `pgvectorSearch` only
2. If zero results → `keywordSearch` fallback

### Blend profiles

Profile selection (`resolveBlendProfile`):

| Condition | Profile | Semantic weight | Lexical weight |
|-----------|---------|-----------------|----------------|
| `interpretation.intent === "file_lookup"` or `"active_doc_qa"` | `lexical_heavy` | 0.35 | 0.65 |
| `interpretation.intent === "document_summary"` | `semantic_heavy` | 0.70 | 0.30 |
| Otherwise | `RETRIEVAL_BLEND_PROFILE` env (default `balanced`) | 0.50 | 0.50 |

Merge formula per chunk (keyed by `chunkId`):

```
relevance = vectorScore × semanticWeight + lexicalScore × lexicalWeight
```

Chunks appearing in only one leg get the other score as 0.

---

## Search legs in detail

### 1. pgvector ANN (`pgvectorSearch`)

- **Distance:** Cosine via `<=>` operator; similarity = `1 - distance`
- **Scope:** `file_chunks.project_id = projectId` AND `embedding_vector IS NOT NULL`
- **Join:** `file_records` for metadata (path, category, tags, priority, extracted fields)
- **Filter:** `doc_category = categoryFilter` when `category` option is set
- **Tags filter:** **Not applied** on the vector leg
- **Limit:** `topK × 3` candidates
- **Failure handling:** If pgvector extension/type is missing, sets module flag `pgvectorAvailable = false` and returns `[]` (subsequent calls skip vector entirely)

### 2. Keyword / trigram (`keywordSearch`)

- **Tokenization:** `tokenizeQuery(query, minLength=3, maxTokens=8)` — stop-word filtered
- **Matching:** ILIKE `%token%` on `chunk_text`, `file_name`, `file_path` (pg_trgm GIN indexes from migration 0014)
- **Scoring:** `keywordHitScore(tokens, chunkText + fileName + filePath) / tokenCount`
- **Token pruning:** `deriveEffectiveTokens` drops tokens appearing in >60% of candidate rows (reduces generic-term noise)
- **Filters:** `category` AND `tags` (tag must be in `file_records.tags`)
- **Limit:** `max(topK × 20, 100)`
- **Role in hybrid:** Fallback only when vector+FTS merge is empty; **not** the primary lexical leg

### 3. Full-text search (`ftsSearch`)

- **Query parser:** `websearch_to_tsquery('english', query)` — supports quoted phrases, OR, negation
- **Ranked columns** (summed `ts_rank_cd`):
  - `file_chunks.chunk_text`
  - `file_chunks.file_name`
  - `file_records.file_path`
- **Match predicate:** tsvector of any of the above columns `@@` the tsquery
- **Score normalization:** Clamped to `[0, 1]`
- **Filters:** `category` AND `tags` (same as keyword)
- **Limit:** `max(topK × 5, 50)`
- **Failure:** Logs warning, returns `[]` (non-fatal)

---

## Post-merge boosts and policies

Applied in order after candidate generation:

### Source type policy (`applySourceTypePolicy`)

- **Filters out** `metadata_stub` chunks unless query hints at drawings (`drawing`, `sheet`, `plan`, etc.)
- **Overview queries** (`summarize`, `overview`, …): boost `summary` (+0.12), penalize `metadata_stub`
- **Content queries** (default): boost `content` (+0.10), penalize `summary` (-0.08) and `metadata_stub` (-0.12)

### Interpretation boost (`applyInterpretationBoost`)

Only when `interpretation.confidence ≥ 0.6`:

| Signal | Boost (× confidence) |
|--------|---------------------|
| Preferred category match | +0.08 |
| Preferred tag match | +0.06 |
| Recency bias (`retrievalHints.recencyBias`) | up to +0.05 |
| File `priorityScore` | up to +0.04 |
| Status hint matches `extractedFields.approvalStatus/status` | +0.04 |
| Spec section hint matches `extractedFields.specSection` | +0.05 |

### File identity boost (`applyFileIdentityBoost`)

- Tokenizes query (min length 2, max 12 tokens)
- `deriveFileIdentity(fileName, filePath)` → folder + filename tokens
- `identityMatchScore` → overlap in `[0, 1]` (partial token matches count as 0.5)
- Adds `0.3 × overlap` to relevance

### Specification chunk boost (`applySpecificationChunkBoost`)

Triggers when query contains spec intent words (`spec`, `requirement`, …) **or** CSI-style section numbers (`\d{1,2}(?:[.\s]\d{2}){1,3}`):

| Match | Boost |
|-------|-------|
| Section number in `sectionLabel` | +0.20 |
| Section number in chunk text | +0.08 |
| Spec intent + submittal/warranty/sample in text | +0.08 |

### Confidence tie-break

In `retrieveSources` deduplication only: when two chunks from the same file have equal relevance, the chunk with higher `confidence` (indexing-time chunk confidence) wins.

---

## Reranker

Gated by `RETRIEVAL_RERANK_ENABLED` rollout flag. Provider from `RETRIEVAL_RERANK_PROVIDER` env.

| Provider | Behavior |
|----------|----------|
| `none` (default) | Passthrough — no reordering |
| `heuristic` | Re-scores top `RETRIEVAL_RERANK_TOP_N` (default 20) candidates: `0.65 × relevance + 0.35 × lexicalHitRatio`, reorders head, appends unchanged tail |
| Other | Throws `unsupported_rerank_provider` — caught, falls back to pre-rerank order |

There is **no cross-encoder or LLM reranker** today.

---

## matchReasons generation

### Exact-ID results

From `identifier-lookup.service.ts`:

- `{ kind: "exact_id", identifierType, value, raw }`
- Optional `{ kind: "discipline_station", discipline, station }` when spec section or station metadata exists

### Ranked (content) results

From `computeRankedMatchReasons()` in `searchProject`:

- `{ kind: "name_token", tokens }` — query tokens found in filename (extension stripped)
- `{ kind: "path_token", tokens }` — query tokens in file path but not filename
- `{ kind: "content_hit", snippet }` — first 160 chars of top content chunk

Note: `discipline_station` is defined in the type union but only populated by exact-ID lookup today.

---

## Metadata filters: what works today

| Filter | pgvector | keywordSearch | ftsSearch | inMemorySearch | Exact-ID |
|--------|----------|---------------|-----------|----------------|----------|
| `projectId` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `category` | ✅ | ✅ | ✅ | ✅ | — |
| `tags` | ❌ | ✅ (must have tag) | ✅ (must have tag) | ✅ | — |
| `minRelevance` | post-filter | post-filter | post-filter | post-filter | — |
| `interpretation` boosts | post-score | post-score | post-score | post-score | — |
| `docCategory` from chat domains | post-filter (specialist lanes) | — | — | — | — |
| Date range | ❌ | ❌ | ❌ | ❌ | ❌ |
| `specSection` column filter | ❌ | ❌ | ❌ | ❌ | — |
| Sheet number | ❌ | ❌ | ❌ | ❌ | ❌ |
| Identifier type filter | ❌ | ❌ | ❌ | ❌ | implicit in exact-ID |

---

## In-memory fallback (tests / no DB)

When `getDbIfInitialized()` returns `null`:

- Loads all chunks via `projectService.listProjectChunks(projectId)`
- Applies category/tag filters in memory
- Scores each chunk: `max(cosineSimilarity(queryEmbedding, chunk.embedding), keywordHitRatio)`
- Returns top `max(topK × 3, 20)` candidates
- Skips exact-ID, FTS, pgvector, and rerank DB dependencies
- Used heavily in unit tests (`retrieval.service.test.ts`)

Query embeddings are cached in-memory for 2 minutes (`QUERY_EMBEDDING_CACHE_TTL_MS`).

---

## Limits and result shape

| Parameter | Value |
|-----------|-------|
| `topK` | Clamped to `[1, 20]`, default 5 |
| Internal candidate pool | `searchProject` uses 50; `retrieveSources` uses normalized `topK` |
| pgvector fetch | `topK × 3` |
| keyword fetch | `max(topK × 20, 100)` |
| FTS fetch | `max(topK × 5, 50)` |
| Chunks per file in `searchProject` | Up to 3 (truncated to 400 chars each) |
| Chunks per file in `retrieveSources` | 1 (best chunk) |
| Project scoping | All queries filter `file_chunks.project_id` |

Results are **file-level** in output (grouped by `fileId`), even though retrieval operates on **chunks** internally.

---

## Environment flags

| Variable | Default | Effect |
|----------|---------|--------|
| `RETRIEVAL_HYBRID_ENABLED` | `false` | Enables vector + FTS parallel merge (vs vector-only + keyword fallback) |
| `RETRIEVAL_BLEND_PROFILE` | `balanced` | Default semantic/lexical weights when intent doesn't override |
| `RETRIEVAL_RERANK_ENABLED` | `false` | Enables rerank stage |
| `RETRIEVAL_RERANK_PROVIDER` | `none` | `none` or `heuristic` |
| `RETRIEVAL_RERANK_TOP_N` | `20` | Head size for heuristic rerank |
| `CANARY_PROJECT_IDS` | (empty) | When set, rollout flags only apply to listed project IDs |
| `CHAT_RETRIEVAL_TRACE_ENABLED` | `false` | Logs retrieval timing in chat coordinator |

`tier2-search-demo.ts` forces `RETRIEVAL_HYBRID_ENABLED=true` if unset.

---

## Worked examples

### Example 1: `"QWP-005"` (exact-ID)

```
Query → searchProject()
  → parseIdentifierQuery: [{ type: "QWP", valueNormalized: "QWP5", raw: "QWP-005" }]
  → document_identifiers lookup (projectId, QWP, QWP5)
  → 3 files found (Rev 0, Rev 1 APP, Rev 1 RWC)
  → Family ranked: Rev 1 APP wins (statusApprovedRank=3)
  → Return 1 result:
      topRelevance: 1.0
      matchedChunks: []
      exactIdentifier: { type: "QWP", value: "QWP5", raw: "QWP-005", totalFamilyMembers: 3 }
      matchReasons: [{ kind: "exact_id", ... }]
```

No embedding, no hybrid merge, no boosts. Chat gets a single authoritative file with deep link.

### Example 2: `"structural steel foundations"` (hybrid content)

```
Query → searchProject() → exact-ID parse finds nothing
  → embed query (cached 2 min) → pgvectorSearch: top ~150 chunks by cosine similarity
  → ftsSearch (parallel): chunks matching "structural" & "steel" & "foundations" in text/name/path
  → mergeHybridCandidates (balanced 50/50):
      chunk A: vector=0.82, fts=0.15 → 0.485
      chunk B: vector=0.71, fts=0.45 → 0.58  ← wins
  → applySourceTypePolicy: content chunks +0.10
  → applyFileIdentityBoost: "structural" in path "Structural/Foundations/..." → +0.15
  → maybeApplyRerank: heuristic may reorder top 20
  → group by file, top 3 chunks each, computeRankedMatchReasons
      matchReasons: [{ kind: "path_token", tokens: ["structural"] }, { kind: "content_hit", snippet: "..." }]
```

With `RETRIEVAL_HYBRID_ENABLED=false`: vector-only, keyword fallback if vector returns nothing.

### Example 3: `"concrete reinforcement ACI 315"` (content + spec boost)

```
Query → no exact-ID (ACI is not an indexed identifier type)
  → hybrid merge produces candidates from spec PDFs and submittals
  → applySpecificationChunkBoost:
      - No CSI section number pattern in query (ACI 315 doesn't match \d{1,2}[.\s]\d{2}...)
      - No spec intent words ("spec", "requirement") → boost may not fire
      - If query were "concrete reinforcement spec 03 30 00":
          sectionLabel "03 30 00" match → +0.20
          "submittals" in chunk text with spec intent → +0.08
  → applyFileIdentityBoost: "concrete" overlap with filename tokens
  → Results ranked, grouped by file
```

For stronger spec targeting, the chat interpreter can pass `entities.specSection` in the interpretation, triggering +0.05 when `extractedFields.specSection` matches.

---

## Comparison to plan intent

Based on code comments referencing the construction RAG plan (MVP Slices 1–3):

| Plan intent | Current state |
|-------------|---------------|
| **Identifiers first-class** | ✅ Implemented for `searchProject` via `document_identifiers` table + family resolution. Not wired into `retrieveSources`. |
| **Hybrid retrieval (vector + lexical)** | ✅ Implemented behind `RETRIEVAL_HYBRID_ENABLED` flag (off by default globally; on in tier2 demo). Lexical leg is FTS, not keyword/trigram. |
| **Name/path as retrieval signals** | ✅ File identity boost, FTS on name/path, keyword ILIKE on name/path. |
| **Revision/status family resolution** | ✅ Exact-ID path only. |
| **Structured match reasons** | ✅ `exact_id`, `name_token`, `path_token`, `content_hit`. |
| **Cross-encoder / LLM rerank** | ❌ Only heuristic rerank exists. |
| **Tag filter on vector leg** | ❌ Tags only filter FTS/keyword legs. |
| **Tier 2 chunk hydration for exact-ID** | ❌ Exact-ID returns file metadata only, no chunks. |

---

## Quick reference: demo invocation

```bash
# From packages/backend — hybrid enabled by default in script
pnpm tier2:search "structural steel foundations"
pnpm tier2:search -- --project-id <uuid> --top 5 "QWP-005"
```

Calls `retrievalService.searchProject(projectId, query, { includeChunks: true, topK })`.

---

## Source files

| File | Role |
|------|------|
| `retrieval.service.ts` | Main pipeline: search legs, merge, boosts, public API |
| `identifier-lookup.service.ts` | Exact-ID lookup + family resolution |
| `identifier-extraction.utils.ts` | Normalization, regex extraction, status/revision ranking |
| `text-ranking.utils.ts` | Tokenization, keyword scoring, file identity |
| `retrieval-reranker.service.ts` | Heuristic rerank |
| `feature.service.ts` | Rollout flag gating |
| `config/env.ts` | Env defaults |
| `chat-coordinator.service.ts` | `routeGraphContext` → `searchProject` before RAG |
| `scripts/tier2-search-demo.ts` | CLI demo |
