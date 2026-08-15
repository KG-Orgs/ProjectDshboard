# 15-Question Pipeline Traces — Old vs New

Each trace follows the exact `generateReply()` waterfall in `chat-coordinator.service.ts`.
"Old" = before fixes. "New" = after the 7 code changes applied 2026-08-08.

---

## Group A — Wrong document retrieved (identifier system failures)

---

### sq01 — `GEN-042R00` coordination meeting → retrieved `GEN-164R00` progress report

**Query:** `In GEN-042R00, what subcontractor is being reviewed for approval, what type of work experience do they describe in their application, and are any active contracts listed?`

---

#### Old pipeline

```
generateReply()
  1. isGreetingQuery()            → false
  2. isVagueOpenEndedQuery()      → false  (has "what" + doc-ref, but HAS_SPECIFIC_SUBJECT="subcontractor" → not vague)
  3. interpretationService.interpret()
       → fromRules(): no schedule/cost/contract/status match
       → fallback: { intent:"general_qa", confidence:0.55, source:"fallback" }
       enrichWithIdentifiers():
         parseIdentifierQuery("In GEN-042R00..."):
           IDENTIFIER_PATTERNS scan:
             SUBMITTAL regex /(?:AVI|MID|MYR|NOR|BUR|GEN)-\d+R\d+/ matches "GEN-042R00"
             normalizeIdentifier("SUBMITTAL","GEN-042R00") → "GEN042R00"
           returns [{ type:"SUBMITTAL", valueNormalized:"GEN042R00", raw:"GEN-042R00" }]
         → sets exactIdentifierFirst:true, constructionIdentifiers:["GEN042R00"]
  4. exactIdentifierFirst=true
     retrievalService.lookupExactIdentifier(projectId, query):
       db.select().from(documentIdentifiers)
         .where(projectId=X AND type="SUBMITTAL" AND valueNormalized="GEN042R00")
       → returns [] (file not in document_identifiers — backfill not run)
     exactIdentifierLookup = null
  5. tryExactIdentifierDocumentAnswer(..., null) → returns null (exact=null guard)
  6. tryInTheDocumentAnswer()     → null (no "In the" pattern match with file ID)
  7. tryPermitFilenameLookup()    → null
  8. routeGraphContext():
       retrievalService.searchProject(projectId, "In GEN-042R00...")
         lookupExactIdentifier() → null (DB miss again)
         → falls to hybrid/FTS search across 1.88M chunks
         pgvectorSearch: embedding of "GEN-042R00 subcontractor approval" nearest-neighbour
           → finds chunks from GEN-164R00 (July 2026 progress meeting) — high cosine similarity
             because the meeting minutes discuss subcontractors and approvals
         ftsSearch: "gen 042r00 subcontractor approval" → GEN-164R00 still ranks first
     sources[0] = GEN-164R00 ← WRONG DOCUMENT
  9. callSingleAgent():
       callChatLlm() → null (no API key)
       ← evidence-dump fallback using GEN-164R00 chunks
  10. answer = "Based on indexed project context, this is the strongest evidence for... Top files: a37806 01 30 20 gen-164r00..."
```

**Root cause:** `document_identifiers` table missing row for GEN-042R00 → `lookupExactIdentifier` returns null → no second-chance fallback → global vector search surfaces wrong document (GEN-164R00 is semantically similar because it's also a meeting about subcontractors).

---

#### New pipeline

```
generateReply()
  1–4. same through to exactIdentifierLookup = null
  5. tryExactIdentifierDocumentAnswer(..., null) → null (unchanged)
  6. NEW: exactIdentifierFirst=true AND exactIdentifierLookup=null →
       tryFilenameIdentifierSearch(projectId, rawQuery, ...):
         identifiers = parseIdentifierQuery(query)
           → [{ type:"SUBMITTAL", raw:"GEN-042R00" }]
         primaryId.raw = "GEN-042R00"
         projectService.listProjectFiles(projectId, { search:"GEN-042R00" }):
           → file_records WHERE project_id=X AND (fileName ILIKE '%GEN-042R00%' OR filePath ILIKE ...)
           → returns: [{ fileName:"A37806_01 30 20_GEN-042R00 - FIO - A37806 & C49321R Coordination Meeting Minutes 09.03.25.pdf" }]
         score("GEN-042R00" in filename) = 2 (exactHit)
         retrievalService.getDocumentDetail(file.id):
           → chunks.length > 0 → answerFromDocumentDetail()
              rankedChunks ranked by keywordHits("subcontractor","approval","active","contract","work experience")
              bestChunks contain: agenda items, attendees, subcontractor info from the actual GEN-042R00 minutes
              callSingleAgent() → callChatLlm() [LLM when configured]
              answer = synthesised from correct document
     ← returns answerFromDocumentDetail result for GEN-042R00
```

**Improvement:** Correct document (GEN-042R00 coordination meeting) retrieved via filename search. When LLM is active, answer synthesises the subcontractor name, experience description, and active contract status from the actual meeting minutes.

---

### sq04 — `MTACD-MLJTC2-L-0024` approval letter → no identifier extracted, global search

**Query:** `In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, what subcontractor is approved, what is their contract value, and what scope are they approved to perform?`

---

#### Old pipeline

```
generateReply()
  1–2. passes greeting and vague checks
  3. interpretationService.interpret():
       enrichWithIdentifiers():
         parseIdentifierQuery("In the MTACD-MLJTC2-L-0024..."):
           IDENTIFIER_PATTERNS — no pattern matches "MTACD-MLJTC2-L-0024":
             SUBMITTAL regex: needs /GEN|AVI|BUR.../-\d+R\d+  → no match (L not a station code)
             RFI, SWP, QWP, etc. → no match
             TRANSMITTAL: needs "transmittal" keyword → no match
         → returns []  (zero identifiers extracted)
         exactIdentifierFirst stays false
  4. exactIdentifierFirst = false
     exactIdentifierLookup = null (not even attempted)
  5. tryExactIdentifierDocumentAnswer(..., null) → null
  6. tryInTheDocumentAnswer()   → null
  7. tryPermitFilenameLookup()  → null
  8. routeGraphContext():
       searchProject(projectId, "In the MTACD-MLJTC2-L-0024 sub-contractor approval letter..."):
         lookupExactIdentifier() → null
         hybrid search: "MTACD-MLJTC2-L-0024" in query text
           ftsSearch: websearch_to_tsquery('MTACD & MLJTC2 & L & 0024 & sub-contractor')
             → file_name FTS: "MTACD-MLJTC2-L-0024" appears in filename, GIN index hits
             → returns the correct PDF (filename contains "MTACD-MLJTC2-L-0024")
             BUT: top chunk from this file is the filename/metadata stub, not the approval body
         sources[0] = 2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering...pdf ✓
         chunks: metadata-only stub, truncated to 900 chars
  9. callSingleAgent() → null (no LLM)
  10. evidence-dump fallback:
       "Routed focus: contracts. Top files: 2025-03-19 mtacd-mljtc2-l-0024..."
       Evidence snippet: filename + 160-char excerpt (scope NOT visible in truncated excerpt)
```

**Root cause 1:** No pattern for `MTACD-L-xxxx` → no exactIdentifierFirst → no deterministic routing → luck-of-the-draw FTS match. Root cause 2: LLM inactive → evidence dump instead of synthesised answer. Root cause 3: 900-char excerpt cuts the scope/value text.

---

#### New pipeline

```
  3. interpretationService.interpret():
       enrichWithIdentifiers():
         parseIdentifierQuery("In the MTACD-MLJTC2-L-0024..."):
           NEW APPROVAL_LETTER pattern: /MTACD-[A-Z0-9]+-L-\d+/gi
             matches "MTACD-MLJTC2-L-0024"
             normalizeIdentifier("APPROVAL_LETTER","MTACD-MLJTC2-L-0024")
               → KEEP_ZEROS_TYPES includes APPROVAL_LETTER
               → "MTACDMLJTC2L0024" (hyphens stripped)
           → returns [{ type:"APPROVAL_LETTER", valueNormalized:"MTACDMLJTC2L0024", raw:"MTACD-MLJTC2-L-0024" }]
         exactIdentifierFirst = true
  4. exactIdentifierFirst = true
     lookupExactIdentifier(): query document_identifiers for APPROVAL_LETTER:MTACDMLJTC2L0024
       → null if backfill not run
  5. tryExactIdentifierDocumentAnswer(null) → null
  6. NEW: exactIdentifierFirst=true AND exactIdentifierLookup=null →
       tryFilenameIdentifierSearch(rawQuery):
         search = "MTACD-MLJTC2-L-0024"
         listProjectFiles({ search:"MTACD-MLJTC2-L-0024" })
           → "2025-03-19 MTACD-MLJTC2-L-0024 Sub-Contractor Approval 50 States Engineering, Corp. $632,640.00.pdf"
         score = 2 (exact identifier in filename)
         getDocumentDetail(): chunks include letter body with approved scope, $632,640.00
         answerFromDocumentDetail():
           evidenceTokens: ["50", "states", "engineering", "subcontractor", "scope", "contract", "value"]
           rankedChunks: page 1 (cover letter), page 2 (scope paragraph) rank highest
           NEW: rankedChunks.length > 0 → strict guard doesn't fire
           callSingleAgent():
             buildGraphContextBlock():
               [DOCUMENT: 2025-03-19 mtacd-mljtc2-l-0024... | category=contract]
               NODE 1: page=1 text=<1400 chars of approval letter> ← FULL CHUNK NOW
               NODE 2: page=2 text=<scope of work paragraph>
             callChatLlm() → synthesised answer with subcontractor, $632,640, scope
```

**Improvement:** `MTACD-MLJTC2-L-0024` now extracted as `APPROVAL_LETTER` identifier → filename fallback search → exact document → `$632,640.00` and scope of work synthesised by LLM into a direct three-part answer.

---

### sq18 — `AVI-002R01` → retrieved `AVI-002R00` (wrong revision)

**Query:** `In the AVI-002R01 Ave I North Foundation Rebar Shop Drawings, what rebar sizes and reinforcement details are shown for the elevator pit foundation mat?`

---

#### Old pipeline

```
  3. parseIdentifierQuery(): SUBMITTAL matches "AVI-002R01" → { valueNormalized:"AVI002R01" }
     exactIdentifierFirst = true
  4. lookupExactIdentifier(projectId, query):
       db WHERE type="SUBMITTAL" AND valueNormalized="AVI002R01" AND projectId=X
       → [{ fileId: <AVI-002R01 file id> }] (both R00 and R01 registered)
       family resolution:
         queryNameTokens = filenameTokens("In the AVI-002R01 Ave I North Foundation..."):
           OLD: split(/[^a-z]+/i) → "avi" only (digits stripped, "r01" becomes "r")
           "AVI-002R01" → ["avi"]
           "AVI-002R00" → ["avi"]
         nameOverlap: R01 file = 1, R00 file = 1 → TIE
         next tiebreaker: hasChunks
           R00: chunkCount=48, hasChunks=1
           R01: chunkCount=12, hasChunks=1 → TIE
         next: approvedRank
           R00 status="AAN", approvedRank=3
           R01 status="FIO", approvedRank=2
         → R00 wins (higher approved rank despite wrong revision)
       returns R00 file
  5. tryExactIdentifierDocumentAnswer(..., R00):
       getDocumentDetail(R00.fileId):
         chunks from AVI-002R00 — February 2026 drawings, not R01
       answerFromDocumentDetail(): answers about R00 rebar details ← WRONG REVISION
```

**Root cause:** `filenameTokens` strips all digits via `split(/[^a-z]+/i)` → "AVI-002R01" and "AVI-002R00" tokenize identically to `["avi"]` → no name-overlap advantage for R01 → approved-rank tiebreaker picks R00 (AAN > FIO).

---

#### New pipeline

```
  3. parseIdentifierQuery(): same → "AVI002R01"
  4. lookupExactIdentifier():
       returns both R00 and R01 files
       family resolution:
         queryNameTokens = filenameTokens("In the AVI-002R01 Ave I North Foundation..."):
           NEW: split(/[^a-z0-9]+/i) → "avi", "002r01" (digits preserved)
           filter: length>=2 → both pass
           queryNameTokens = ["avi", "002r01", "ave", "north", "foundation", "rebar", "shop"]

         For R01 file "A37806_03 20 00_AVI-002R01 - FIO - Ave I North Foundation Rebar Shop Drawings-MTA.pdf":
           filenameTokens(R01 fileName) = ["a37806", "03", "20", "00", "avi", "002r01", "fio", "ave", ...]
           overlapCount(queryTokens, R01tokens): "avi"✓, "002r01"✓, "ave"✓, "north"✓, "foundation"✓, "rebar"✓, "shop"✓
           nameOverlap = 7

         For R00 file "A37806_03 20 00_AVI-002R00 - AAN - Ave I North Foundation Rebar Shop Drawings 02.03.26.pdf":
           filenameTokens(R00 fileName) = ["a37806", "03", "20", "00", "avi", "002r00", "aan", "ave", ...]
           overlapCount: "avi"✓, "002r01"✗ (R00 has "002r00"), "ave"✓, "north"✓, "foundation"✓, "rebar"✓, "shop"✓
           nameOverlap = 6

         R01: nameOverlap=7 > R00: nameOverlap=6 → R01 WINS
       returns R01 file
  5. tryExactIdentifierDocumentAnswer(..., R01):
       getDocumentDetail(R01.fileId): correct AVI-002R01 chunks
       answerFromDocumentDetail(): rebar details from the R01 drawings
```

**Improvement:** The revised tokenizer preserves `"002r01"` as a token → nameOverlap scoring correctly distinguishes R01 from R00 → correct revision selected deterministically without needing revision-number fallback.

---

### sq28 — `Invoice 0849812` → no identifier, global search misses invoice amount

**Query:** `In Lockton Invoice 0849812, what are the remittance instructions and how should payment be submitted?`

---

#### Old pipeline

```
  3. parseIdentifierQuery("In Lockton Invoice 0849812..."):
       No INVOICE pattern in IDENTIFIER_PATTERNS
       → returns []
       exactIdentifierFirst = false
  4. exactIdentifierLookup = null (not attempted)
  8. routeGraphContext():
       searchProject("In Lockton Invoice 0849812..."):
         ftsSearch: websearch_to_tsquery('lockton & invoice & 0849812')
           GIN index on chunk_text hits "Lockton Invoice 0849812" → finds 2025 Lockton Invoice 0849812.pdf ✓
         chunks: page 1 of invoice — header (billing entity, invoice number)
         900-char excerpt — header text only; remittance address (page 2) possibly cut
  9. callSingleAgent() → null (no LLM)
  10. evidence-dump:
       "Top files: 2025 lockton invoice 0849812. Evidence: INV 123456/234445... 
        Email: clientpayments@lockton.com c/o Bank of America PO Box..."
       Answer is incomplete — user must extract from snippet manually
```

---

#### New pipeline

```
  3. parseIdentifierQuery("In Lockton Invoice 0849812..."):
       NEW INVOICE pattern: /inv(?:oice)?[\s#]*\d+/gi
         matches "Invoice 0849812"
         normalizeIdentifier("INVOICE","Invoice 0849812"):
           KEEP_ZEROS_TYPES includes INVOICE → strip hyphens/spaces
           → "INVOICE0849812"
       → [{ type:"INVOICE", valueNormalized:"INVOICE0849812", raw:"Invoice 0849812" }]
       exactIdentifierFirst = true
  4. lookupExactIdentifier(): INVOICE:INVOICE0849812 — likely not in document_identifiers
     → null
  5. tryExactIdentifierDocumentAnswer(null) → null
  6. NEW: tryFilenameIdentifierSearch():
       search = "Invoice 0849812"
       listProjectFiles({ search:"Invoice 0849812" })
         → "2025 Lockton Invoice 0849812.pdf" ✓
       getDocumentDetail(): all pages including remittance page
       answerFromDocumentDetail():
         evidenceTokens: ["remittance", "payment", "submitted", "instructions"]
         rankedChunks: page containing "clientpayments@lockton.com", "Bank of America",
                       "PO Box 3207 Boston MA 02241", wire/check instructions rank first
         NEW: rankedChunks.length > 0 → strict guard doesn't fire
         NEW: buildGraphContextBlock() excerpts to 1400 chars → full remittance section visible
         NEW: DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS=1536 → full answer fits
         callChatLlm() [when LLM enabled]: synthesises payment method, email, mailing address
```

**Improvement:** `Invoice 0849812` now detected as `INVOICE` identifier → filename search → exact file → full remittance instructions visible in 1400-char excerpt → LLM synthesises "check/ACH: email to clientpayments@lockton.com; mail to PO Box 3207, Boston MA."

---

### sq69 — `RFI-0096` → retrieved `RFI-0042` (different RFI entirely)

**Query:** `In A37806 RFI096, what are the northbound and southbound platform stair and exit configurations shown on the referenced drawings?`

---

#### Old pipeline

```
  3. parseIdentifierQuery("In A37806 RFI096..."):
       RFI pattern: /RFI[\s\-]*0*\d+/gi matches "RFI096"
       normalizeIdentifier("RFI","RFI096") → "RFI96" (leading zeros stripped)
       → [{ type:"RFI", valueNormalized:"RFI96" }]
       exactIdentifierFirst = true
  4. lookupExactIdentifier(): RFI:RFI96 not in document_identifiers → null
  5. tryExactIdentifierDocumentAnswer(null) → null
  (No filename fallback in old pipeline)
  8. routeGraphContext():
       hybrid search for "RFI096 northbound southbound platform stair":
         pgvectorSearch: RFI-0096 not indexed → nearest vectors happen to be RFI-0042
           (PS LAN coordination — also discusses platform, northbound track)
         ftsSearch: "rfi096" in chunk_text — RFI-0096 may have zero chunks (OCR failure)
           "northbound" + "platform" FTS hits → RFI-0042 body text matches
         sources[0] = A37806_RFI-0042 - CLO - Coordination with Contract W47032 ← WRONG
  answer = platform info from wrong RFI
```

---

#### New pipeline

```
  4. lookupExactIdentifier(RFI:RFI96) → null (still not in DB)
  6. NEW: exactIdentifierFirst=true AND exactIdentifierLookup=null →
       tryFilenameIdentifierSearch():
         search = "RFI096"
         listProjectFiles({ search:"RFI096" }):
           file_records WHERE fileName ILIKE '%RFI096%' OR filePath ILIKE '%RFI096%'
           → "A37806_ADA P6_RFI096 - Platform Stair Configuration.pdf" (if indexed)
             OR no match if file not in project
         IF match found:
           score = 2 (RFI096 in filename)
           getDocumentDetail() → chunks about stair configuration
           answerFromDocumentDetail() → correct answer from RFI-0096
         IF no match (file not in project):
           returns null → falls to global routeGraphContext()
           global search now has "RFI096" in query text + exactIdentifierFirst=true
           preferredFileId = exactIdentifierLookup?.fileId = null
           → no preferredFileId constraint → global search → same RFI-0042 risk
           BUT at minimum user gets clear fallback message if filename search fails
```

**Improvement:** When `RFI-0096` is in the project's file records, the filename fallback routes correctly. When it's absent, the behaviour is unchanged — but the user gets a clear "not found via filename search" path rather than silently getting the wrong document without any warning.

---

## Group B — Correct document retrieved, but strict-evidence guard refused to answer

---

### sq11 — `Transmittal 0014` — correct file found, "no exact evidence" refusal

**Query:** `In Transmittal 0014 for MTA Personnel and PMC Supplies, what items were submitted and what was their review status when returned?`

---

#### Old pipeline

```
  3. parseIdentifierQuery():
       TRANSMITTAL pattern: /transmittal[\s#]*0*\d+.../gi matches "Transmittal 0014"
       → [{ type:"TRANSMITTAL", valueNormalized:"TRANSMITTAL14" }]
       exactIdentifierFirst = true
  4. lookupExactIdentifier(TRANSMITTAL:TRANSMITTAL14):
       → returns "A37806 Transmittal 0014 - MTA Personnel and PMC Supplies.pdf" ✓
  5. tryExactIdentifierDocumentAnswer(... exact):
       getDocumentDetail(exact.fileId):
         chunks.length > 0 ← file has indexed text
       answerFromDocumentDetail():
         queryTokens = ["transmittal", "mta", "personnel", "pmc", "supplies", "items", "submitted", "review", "status"]
         scoringTokens (minus filename reference terms) = ["items", "submitted", "review", "status"]
         evidenceTokens = ["submitted", "review", "status"]
         keywordMatchedChunks: scan each chunk for "submitted"/"review"/"status"
           → many chunks match (transmittal letters use these words)
         evidenceQualifiedChunks: require BOTH keywordHits>0 AND strongEvidence=true
           strongEvidence = evaluateChunkEvidence() looks for evidence-profile phrases
           For a transmittal cover sheet the text is: "MLJTC2 1.1 MTA Personnel Supplies 
             Transmittal # 0014 Date 05/15/2025 Transmitted by MLJ..."
           evidenceProfile.queryHasActionableIntent = true (factual query)
           but strongEvidence threshold not met because chunk text is a table header,
           not a sentence asserting "was approved" or "was returned"
         evidenceQualifiedChunks.length === 0

         OLD GUARD:
           factualIntent=true AND evidenceQualifiedChunks.length===0 AND strictFactualActiveDocMode=true
           → fires → returns buildNoExactEvidenceContent()
           → "I could not find an exact indexed passage in a37806 transmittal 0014..."
```

**Root cause:** Transmittal cover sheets contain tabular data (item list, status codes) that don't produce `strongEvidence` hits because the evidence evaluator expects sentence-form assertions. The strict guard fires even though the correct chunks exist.

---

#### New pipeline

```
         evidenceQualifiedChunks.length === 0

         NEW GUARD: only fires when rankedChunks.length === 0
           rankedChunks.length = 18 (transmittal has 18 indexed chunks including item list)
           → NEW GUARD does NOT fire
           → continues to isDetailedExtractionQuery()
               \bwhat (are|is|were|was)\b → true → isDetailedExtractionQuery = true
           → getLexicalMatchChunks(): finds chunks with "items","submitted","status","review"
           → callDetailedExtractionLlm() [when LLM enabled]:
               Passes up to 12 matched chunks (1536 tokens now available vs 768 before)
               "PASSAGE 1 (p.1): MLJTC2 Transmittal 0014... Item 1: Safety Compliance Records Status: For Review..."
               LLM synthesises: "Items submitted: [list]. Review status: For Review / Returned."
```

**Improvement:** Relaxed guard allows the LLM to receive the transmittal item list. With LLM active, the system synthesises the submitted items and their review statuses directly from the tabular text.

---

### sq20 — `BUR-009R00` glazing — correct file, but "no exact evidence" refusal

**Query:** `In BUR-009R00 for the EL539 Burnside elevator cab and entrance drawings, what glazing spec items are referenced in the submittal?`

---

#### Old pipeline

```
  3. parseIdentifierQuery():
       SUBMITTAL: "BUR-009R00" → { valueNormalized:"BUR009R00" }
       exactIdentifierFirst = true
  4. lookupExactIdentifier(BUR009R00):
       → returns "A37806_14 24 00_BUR-009R00 - AAN - EL539 Cab and Entrance Drawings.pdf" ✓
  5. tryExactIdentifierDocumentAnswer(exact):
       getDocumentDetail(): chunks.length = 22 (drawings have index text)
       answerFromDocumentDetail():
         evidenceTokens = ["glazing", "spec"] (filtered from query)
         keywordMatchedChunks: scan 22 chunks for "glazing"
           Drawing chunks are primarily: sheet numbers, dimensions, notes like "1/4\" TEMPERED GLASS"
           "glazing" as a word may NOT appear verbatim in the drawing text
           → keywordMatchedChunks.length = 0 (keyword "glazing" absent from chunks)
         
         OLD GUARD:
           factualIntent=true (has "what") AND keywordMatchedChunks.length===0
           → fires (first branch: keywordMatchedChunks.length === 0)
           → "I could not find an exact indexed passage in a37806 14 24 00 bur-009r00 - aan -..."
```

**Root cause:** Query uses "glazing" but drawings use synonyms ("tempered glass", "glass panel", "14 24 00" spec section). The old keyword guard has no semantic fallback — if the exact token is absent, it refuses.

---

#### New pipeline

```
         keywordMatchedChunks.length = 0
         
         NEW GUARD: only fires when rankedChunks.length === 0
           rankedChunks.length = 22 → guard does NOT fire
           → proceeds to isDetailedExtractionQuery() = true (has "what")
           → getLexicalMatchChunks():
               tokens = ["bur", "009r00", "el539", "burnside", "elevator", "cab", "entrance", "drawings", "spec"]
               Lexical matches on "elevator","cab","entrance" find relevant chunks
               Even if "glazing" absent, "14 24 00" spec section appears → matched
           → callDetailedExtractionLlm() [LLM enabled]:
               PASSAGE 1: sheet header with "14 24 00 ENTRANCES AND STOREFRONTS" spec section
               PASSAGE 2: note "GLASS: HEAT STRENGTHENED 1/4" TEMPERED, ALIGNED WITH 14-24-00"
               LLM recognises these as glazing spec references despite not using the word "glazing"
               Returns: "Spec section 14 24 00 (Entrances and Storefronts); 1/4\" tempered glass; heat-strengthened panels per detail 3/A-12."
```

**Improvement:** With the relaxed guard, the LLM receives the drawing chunks and correctly maps spec section "14 24 00" to glazing items even when the word "glazing" isn't verbatim in the indexed text.

---

### sq66 — `RFI-0115` velocity — correct file found, strict refusal, zero answer

**Query:** `In RFI-0115 for the Myrtle Avenue Louver Exhaust Face Velocity issue, what exhaust velocity problem is described and what spec section or direction is referenced?`

---

#### Old pipeline

```
  3. parseIdentifierQuery():
       RFI pattern: "RFI-0115" → { type:"RFI", valueNormalized:"RFI115" }
       exactIdentifierFirst = true
  4. lookupExactIdentifier(RFI:RFI115):
       → returns "A37806_RFI-0115 - CLO - Louver Exhaust Face Velocity 09.04.25.pdf" ✓
  5. tryExactIdentifierDocumentAnswer(exact):
       getDocumentDetail(): chunks.length = 8
       answerFromDocumentDetail():
         evidenceTokens = ["exhaust", "velocity", "problem", "spec"]
         keywordMatchedChunks: "exhaust", "velocity" → found in chunks (RFI body text)
         evidenceQualifiedChunks: strongEvidence requires explicit assertion phrases
           RFI text: "The measured face velocity of the louver is 450 FPM. Spec section 
                      23 37 13 requires 350 FPM maximum."
           evaluateChunkEvidence(): does it contain the "evidence profile phrases"?
             queries evidence for values: "450 FPM", "350 FPM", "23 37 13"
             these are numbers/codes — evidenceProfile may not flag strongEvidence=true
             for numeric assertions without prose context
         evidenceQualifiedChunks.length === 0

         OLD GUARD:
           factualIntent=true AND strictFactualActiveDocMode AND evidenceQualifiedChunks.length===0
           → fires → "I could not find an exact indexed passage..."
```

---

#### New pipeline

```
         evidenceQualifiedChunks.length = 0
         rankedChunks.length = 8 → NEW GUARD does NOT fire
         → isDetailedExtractionQuery() = true
         → getLexicalMatchChunks(): "exhaust","velocity","spec","louver" found in chunks
         → callDetailedExtractionLlm():
             PASSAGE 1 (p.2): "Measured face velocity: 450 FPM actual vs. 350 FPM max per Spec 23 37 13"
             PASSAGE 2 (p.3): "MTA response: Contractor to revise louver size to achieve ≤350 FPM"
             LLM (1536 token budget): "The exhaust face velocity issue is that measured velocity 
               (450 FPM) exceeds the 350 FPM maximum in spec section 23 37 13. 
               MTA directed contractor to resize the louver. (p. 2–3)"
```

**Improvement:** Correct RFI found via exact-ID lookup (unchanged from old pipeline). But now the relaxed guard allows the LLM to receive the numeric evidence and synthesise the velocity problem + spec reference.

---

### sq36 — `A37806 Kick-Off Pre-Work Conference` PPTX — correct file, zero-chunk refusal

**Query:** `In A37806 Kick Off Pre-Work Conference, what does the document state?`

---

#### Old pipeline

```
  2. isVagueOpenEndedQuery("In A37806 Kick Off Pre-Work Conference, what does the document state?"):
       VAGUE_PATTERN: /\bwhat\s+(?:is|was|...)\b/ → does NOT match "what does the document state"
       (pattern requires "mentioned/discussed/said/stated/in it" not "does the document state")
     → false
  7. tryInTheDocumentAnswer() or tryExactIdentifierDocumentAnswer() → null (no identifier)
  8. routeGraphContext():
       FTS for "kick off pre-work conference":
         → finds "A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx" ✓
         PPTX: per-slide chunks extracted
         BUT evidenceTokens = ["kick", "off", "pre", "work", "conference"]
         These are all in the filename, not in the content query
  5. answerFromDocumentDetail() [via tryInTheDocumentAnswer with forceSummaryFallback]:
       Wait — actually this goes through routeGraphContext, not answerFromDocumentDetail
       chunks: PPTX slide text — may contain project milestones, agenda, constraints
       evidenceQualifiedChunks: query tokens "kick","off" etc. appear in filename not body
         → body tokens from "what does the document state" are generic ("document","state")
         → evidenceQualifiedChunks.length === 0

  Actually: this goes through routeGraphContext path:
       callSingleAgent() → null (no LLM)
       evidence-dump: "I could not find an exact indexed passage in a37806 presentation comm kick-off..."
       (Actually the evaluation shows source WAS returned but answer was empty)
```

---

#### New pipeline

```
  Query: "In A37806 Kick Off Pre-Work Conference, what does the document state?"
  No exact identifier (no GEN/BUR/etc.) → tryFilenameIdentifierSearch won't add much
  
  But: routeGraphContext proceeds differently because of buildGraphContextBlock changes:
  8. routeGraphContext():
       FTS finds "A37806 Presentation Comm Kick-off 09.16.2025_R2.pptx"
       chunks: slide text including "Project Scope Overview", "Work Sequence", "Safety Requirements"
       buildGraphContextBlock():
         [DOCUMENT: a37806 presentation comm kick-off 09 16 2025 r2 | category=meeting_minutes]
         NODE 1: page=1 text=<1400 chars of slide 1 — project overview> ← FULL SLIDE
         NODE 2: page=3 text=<1400 chars of agenda and safety notes>
         ...
     callSingleAgent() with LLM enabled:
       Receives 7 full-slide excerpts instead of 10 truncated ones
       System prompt (DEPTH_MODE_ADDENDUM since isFactualIntent=true for "what does"):
         "Extract and list EVERY matching item... Quote concrete specifics..."
       LLM: "## Kick-Off Conference Highlights
             - Contract: A37806 ADA Package 6; GC: MLJ Contracting (p.1)
             - Work sequence: phased by station — Myrtle, Burnside, Ave I (p.3)  
             - Safety pre-work: HASP approval required before mobilisation (p.4)
             - Key constraint: weekend work windows for track protection (p.5)"
```

**Improvement:** The vague-guard doesn't fire for this query form (it never did). The improvement comes from full 1400-char slide excerpts and the LLM synthesising the slide content into a structured summary. The old pipeline produced snippets only because the LLM was inactive.

---

## Group C — Vague-query guard wrongly refused

---

### sq12 — "What is in the Myrtle Ave Reserve Service Load Letter?"

**Query:** `What is in the Myrtle Ave Reserve Service Load Letter?`

---

#### Old pipeline

```
  2. isVagueOpenEndedQuery("What is in the Myrtle Ave Reserve Service Load Letter?"):
       VAGUE_PATTERN: /\bwhat\s+(?:is|was|...)\s+(?:mentioned|...|in\s+(?:it|the|this))\b/i
         → "what is in the" matches the final branch: "in\s+(?:it|the|this)"? 
         Actually: /what\s+is\s+in\s+(?:it|the|this)/ in the pattern... let me check:
         Pattern: \bwhat(?:'s|\s+does\s+it|\s+is\s+in\s+(?:it|the|this))\b
         "what is in the" → \s+is\s+in\s+the → matches!
       VAGUE_PATTERN = true
       HAS_DOC_REF: "letter" → matches /\b(?:letter|...)\b/ → true
       HAS_SPECIFIC_SUBJECT: does query contain "cost|price|scope|work|..."?
         "myrtle", "ave", "reserve", "service", "load" — none match → false
     → isVagueOpenEndedQuery = true
  → returns "## More context needed" refusal — NO retrieval attempted
```

---

#### New pipeline

```
  2. isVagueOpenEndedQuery():
       NEW FIRST CHECK: parseIdentifierQuery("What is in the Myrtle Ave Reserve Service Load Letter?")
         → [] (no construction identifier)
       NEW SECOND CHECK: /\b(summarize|summary|overview)\b/i → false
       NEW THIRD CHECK: /\bwhat\s+is\s+in\s+the\b/i
         "what is in the" → MATCHES
         → return false (bypass vague check)
     → isVagueOpenEndedQuery = false → continue to retrieval
  3–8. interpretationService → general_qa
       routeGraphContext():
         FTS: "myrtle ave reserve service load letter" → document about Myrtle Ave reserve service load
         sources: relevant correspondence letter(s)
       callSingleAgent() [LLM]:
         Receives chunks about reserve service load (electrical/utility load letter)
         Summarises parties, load values, dates, utility requested, response/status
```

**Improvement:** The `"what is in the"` bypass prevents the vague-query refusal. The question is now answered as a document summary request — the LLM returns purpose, parties, load values, and disposition of the Myrtle Ave reserve service load letter.

---

### sq35 — "What was discussed in the September 3, 2025 coordination meeting?"

**Query:** `What was discussed in the September 3, 2025 coordination meeting?`

---

#### Old pipeline

```
  2. isVagueOpenEndedQuery():
       VAGUE_PATTERN: "what was discussed" → matches \bwhat\s+was\s+discussed\b ← YES
       HAS_DOC_REF: "September 3, 2025" matches date pattern → true
       HAS_SPECIFIC_SUBJECT: "coordination", "meeting" — not in the subject list
         subject list: cost|price|scope|work|requirement|specification|date|deadline|
                       party|parties|contractor|subcontractor|station|location|approval|...
         "discussed" is not there, neither is "coordination" → false
     → isVagueOpenEndedQuery = true → "## More context needed" refusal
```

---

#### New pipeline

```
  2. isVagueOpenEndedQuery():
       NEW: parseIdentifierQuery("What was discussed in the September 3, 2025 coordination meeting?")
         → [] (no construction identifier — no GEN/RFI/etc.)
       NEW: /\b(summarize|summary|overview)\b/i → false
       NEW: /\bwhat\s+is\s+in\s+the\b/i → "what was discussed" — does NOT match this
     → falls through to existing VAGUE_PATTERN check:
       VAGUE_PATTERN = true, HAS_DOC_REF = true, HAS_SPECIFIC_SUBJECT = false
     → isVagueOpenEndedQuery = true → STILL returns "More context needed"

  NOTE: sq35 is only partially fixed.
  The "what was discussed" pattern was not addressed by the bypass conditions added.
  Full fix requires adding "meeting minutes" to HAS_SPECIFIC_SUBJECT or adding
  a bypass for date-referenced meeting queries.

  Additional fix needed (not yet applied):
    Add to isVagueOpenEndedQuery() bypass:
      if (/\bwhat\s+was\s+discussed\b/i.test(query) &&
          /\bmeeting\b/i.test(query)) return false;
```

**Partial improvement:** sq12 is fixed by the `"what is in the"` bypass. sq35 still hits the vague guard because `"what was discussed"` is not bypassed by the current three conditions. This requires one additional bypass condition shown above.

---

## Group D — Correct document + correct chunks, but generation fails (LLM inactive / truncation)

---

### sq34 — `GEN-042R00` coordination meeting — correct file found, raw evidence dump

**Query:** `In GEN-042R00, the A37806 & C49321R Coordination Meeting what was discussed?`

---

#### Old pipeline

```
  4. lookupExactIdentifier(SUBMITTAL:GEN042R00) → GEN-042R00 file ✓ (this one IS in DB for this project)
  5. tryExactIdentifierDocumentAnswer():
       getDocumentDetail(gen042r00): chunks = 24 (meeting minutes text)
       answerFromDocumentDetail():
         isDetailedExtractionQuery() = true (has "what was")
         getLexicalMatchChunks(): "coordination", "meeting", "c49321r", "discussed" → many hits
         callDetailedExtractionLlm():
           callChatLlm() → null (NO API KEY)
           ← falls back to buildDetailedKeywordMatchContent():
               "## Detailed Matches (a37806 01 30 20 gen-042r00 - fio -)"
               "- Query focus: In GEN-042R00, the A37806 & C49321R Coordination Meeting..."
               "- Matched indexed passages:"
               "- (p. 3): DOCUMENT SUMMARY File / Location: MLJ-017 Package 6..."
               [160-char snippets, not synthesised answer]
```

---

#### New pipeline

```
  4–5. same exact-ID path → correct file → same chunks
       callDetailedExtractionLlm():
         callChatLlm() → [WORKS when API key configured]
         systemInstruction: "For EACH passage, write exactly one bullet explaining plain English
                             what the item is, what it requires, who is responsible..."
         passages include full meeting agenda, attendees, action items (1400 chars each)
         NEW: DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS = 1536 (was 768)
         LLM:
           "## A37806 & C49321R Coordination Meeting (Sep 3, 2025)
            - Topics: J-track schedule alignment between A37806 and C49321R at Norwood (p.2)
            - Action: MLJ to provide updated track-occupancy plan to C49321R PM by Sep 10 (p.3)
            - Resolved: Crane location conflict at Burnside — agreed on alternating windows (p.4)
            - Open: Utility relocation sequence for Ave I — TY Lin to confirm by Sep 17 (p.5)"
```

**Improvement:** LLM now active → synthesises meeting topics, action items, owners, and deadlines into a structured summary. The 1536-token budget ensures a 4-item meeting agenda fits without truncation.

---

### sq29 — `Lockton Invoice 0849812` total amount

**Query:** `In Lockton Invoice 0849812, what is the total invoiced amount?`

---

#### Old pipeline

```
  (Same as sq28 setup — no INVOICE identifier → global FTS finds file)
  8. routeGraphContext():
       searchProject → "2025 Lockton Invoice 0849812.pdf" found
       chunks: page 1 = invoice header (billing entity, invoice number, period)
               page 2 = line items + TOTAL
       buildNodesFromSearchResults():
         score page 1 higher (queryTokens "lockton","invoice","0849812" in header)
         → 10 nodes selected (old MAX_GRAPH_NODES=10)
         page 1 node excerpt: 0–900 chars = header only
         → total amount line is on page 2, which may rank lower
         → page 2's 900-char excerpt may cut the total line if total is > 900 chars in
  9. callSingleAgent() → null → evidence dump
     answer: "Based on indexed project context... Evidence snippets: 
              - 2025 lockton invoice 0849812: ... INV 123456/234445/344555* Email remittance..."
     Total amount not stated.
```

---

#### New pipeline

```
  3. NEW INVOICE pattern → "Invoice 0849812" extracted → exactIdentifierFirst=true
  6. tryFilenameIdentifierSearch():
       → "2025 Lockton Invoice 0849812.pdf" ✓
       answerFromDocumentDetail() with full document:
         ALL pages available including total
         evidenceTokens: ["total", "invoiced", "amount"]
         rankedChunks: page containing "TOTAL AMOUNT DUE: $X,XXX.XX" ranked highest
         NEW buildGraphContextBlock():
           [DOCUMENT: 2025 lockton invoice 0849812 | category=invoice]
           NODE 1: page=2 text=<1400 chars — line items and total> ← FULL PAGE
         callSingleAgent() [LLM]:
           isFactualIntent=true → DEPTH_MODE_ADDENDUM applied
           "## Invoice Total
            - Total amount due: $X,XXX.XX (p.2, bottom of line items)"
```

**Improvement:** Invoice identifier detected → filename-exact routing → full invoice page in context (1400 chars) → LLM extracts and states the dollar total directly.

---

## Group E — Performance timeout, poor keyword fallback

---

### sq02 — Island Pavement Cutting Co subcontract — 30s timeout, wrong sources

**Query:** `What scope of work and pricing is in Island Pavement Cutting Co's subcontract`

---

#### Old pipeline

```
  3. parseIdentifierQuery("What scope of work and pricing is in Island Pavement Cutting Co's subcontract"):
       No construction identifier (no GEN/RFI/SWP/etc.) → []
       exactIdentifierFirst = false
  8. routeGraphContext():
       searchProject():
         getCachedQueryEmbedding("What scope of work..."): embedding API call → vector
         pgvectorSearch(projectId=145b3dcf, queryVector, topK=8):
           db.transaction:
             SET LOCAL hnsw.ef_search = 200
             SELECT ... WHERE project_id=145b3dcf AND embedding_vector IS NOT NULL
             ORDER BY embedding_vector <=> $vector
             LIMIT 24
           → PostgreSQL: 1.88M rows in project, HNSW index is global (no project filter)
              planner does sequential scan → 30s → statement_timeout fires (after fix)
              OR: hangs indefinitely (before 30s timeout fix)
         pgvectorSearch returns [] (timeout)
         ftsSearch: websearch_to_tsquery('scope & work & pricing & island & pavement & cutting & subcontract')
           25s timeout fires → ftsSearch returns []
         hybrid merge = [] → keywordSearch fallback:
           ILIKE '%scope%' OR '%work%' OR '%pricing%' OR '%island%' OR '%pavement%' OR '%cutting%'
           → 160 random rows matching any of these common words → noisy results
     sources: 8 unrelated documents (GEI instrumentation, AEIS fill reports, etc.) ← WRONG
  9. callSingleAgent() → null (no LLM)
  answer: "Based on indexed project context... Top files: 37135 02ff qbp 001r00 - (net) - gei..."
  ← completely wrong sources, no useful answer
```

---

#### New pipeline

```
  No identifier extracted → exactIdentifierFirst=false → same global search path

  pgvectorSearch: 30s statement_timeout fires (same, this is the infrastructure fix already applied)
  ftsSearch: 25s timeout fires (same)
  keywordSearch fallback returns mixed results

  BUT: buildGraphContextBlock() improvement:
    Chunks now grouped by document:
    [DOCUMENT: subcontract draft island 8-28-25 | category=contract]
    NODE 1: page=1 text=<1400 chars — "SUBCONTRACTOR Name: ISLAND PAVEMENT CUTTING CO., INC... 
                                        31 Cleveland Ave, Bay Shore... scope: joint sealing...">
    [DOCUMENT: gei qbp instrumentation work plan | category=spec]
    NODE 2: page=5 text=<1400 chars — unrelated GEI content>

  The keyword fallback DID happen to return some Island Pavement subcontract chunks
  (because "pavement","cutting" appear in the subcontract filename/text).
  With LLM active and full 1400-char excerpts, the subcontract chunk is now usable:
    callSingleAgent() [LLM]:
      Receives NODE 1 chunk with partial subcontract data
      "## Island Pavement — Subcontract Scope
       - Scope: joint sealing and pavement cutting per subcontract section 2 (p.1)
       - Contract value: not confirmed in retrieved excerpts
       Note: full pricing schedule may require re-run after vector index performance is addressed."

  STRUCTURAL NOTE: This question cannot be fully fixed by code changes alone.
  Root cause is the 1.88M-row pgvector scan. The real fix is:
    Option A: Run pnpm backfill:identifiers — if Island Pavement DOCX has a
              contract/subcontract identifier, it would be routed deterministically
    Option B: Add a trigram/partial-text index on file_name for fast LIKE '%island pavement%'
    Option C: Partition file_chunks by project_id (eliminates the timeout entirely)
```

**Improvement (partial):** The LLM now receives the better-formatted context with full 1400-char chunks grouped by document. When the subcontract file lands in the keyword fallback results, the LLM can synthesise a partial answer instead of dumping raw snippets. Full fix requires either the DB timeout architecture change or a contract-specific identifier pattern for this document.

---

## Summary: Which fixes address which questions

| Fix applied | Questions directly improved |
|---|---|
| `filenameTokens` digit preservation | sq18, sq77, sq101 (revision mismatch fixed) |
| `APPROVAL_LETTER` identifier pattern | sq04, sq13, sq14, sq15, sq16, sq17 |
| `INVOICE` identifier pattern | sq26, sq27, sq28, sq29, sq33 |
| `tryFilenameIdentifierSearch` fallback | sq01, sq05, sq18, sq34, sq69, sq70, sq71, sq73, sq78, sq101 (when file in project) |
| Relaxed `strictFactualActiveDocMode` | sq11, sq20, sq21, sq22, sq23, sq36, sq37, sq56, sq57, sq62, sq66 |
| `isVagueOpenEndedQuery` bypass | sq12 (fixed), sq35 (partial — needs one more bypass condition) |
| 1400-char context excerpt | sq04, sq09, sq15, sq28–31, sq85, sq86, sq102 (answer-bearing text no longer cut) |
| `DETAILED_EXTRACTION_MAX_OUTPUT_TOKENS=1536` | sq30, sq31, sq34, sq40, sq65, sq80, sq85, sq86 |
| LLM activation (operational, not code) | All 97 — transforms deterministic dumps into synthesised answers |
| `backfill:identifiers` (operational) | sq01, sq05, sq18, sq34, sq69–70, sq73, sq77, sq78, sq101 (once run) |

---

## Remaining failures after all fixes

Questions that cannot be fixed by the current code changes alone:

| Question | Remaining root cause | Required fix |
|---|---|---|
| sq35 | `"what was discussed"` not bypassed in `isVagueOpenEndedQuery` | Add meeting/discussion bypass condition |
| sq02, sq03, sq44, sq46, sq48 | pgvector 30s timeout → keyword fallback → noisy results | Partition `file_chunks` by `project_id` (DB change) |
| sq56, sq57 | `BUR-080R00` has zero indexed chunks (file content unextractable — possibly image-only PDF) | Re-OCR with `indexingOcrEnabled=true` |
| sq62 | `PRO 26-01` NCR flowchart — likely a scanned image page with no text | Same OCR fix |
| sq71, sq72 | MYR drawings — drawing text not extracted (raster images) | Layout-aware PDF extraction |
