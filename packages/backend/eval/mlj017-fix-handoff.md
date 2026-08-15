# MLJ-017 NOT INDEXED Fix — Handoff

**Project:** MLJ-017 Package 6 - General (TEST CLONE)  
**Project ID:** `145b3dcf-272e-4c45-9e19-953f20f25bb9`  
**Corpus:** `C:\Users\georg\Iovino Enterprises, LLC\MLJ-017 Package 6 - General`  
**All commands run from:** `packages/backend`

---

## Context

3 of the last smoke test's 33 NOT INDEXED failures were caused by a **dual-record bug**: the original OneDrive sync stored files with `onedriveItemId = local:MLJ-017 Package 6 - General\...` (corpus one level up). Subsequent reindexes using the project folder as corpus root created shadow records with `onedriveItemId = local:13 - SUBCONTRACTS\...`. Chunks landed on the shadow record; the UI's `activeDocFileId` always resolved to the original 0-chunk record.

**Fixes already committed:**
- `scripts/tier2-stream-index.ts` — `findOrCreateFileRecord` now falls back by `fileName` before creating a new record (prevents recurrence)
- `scripts/dedup-file-records.ts` — maintenance script to merge existing shadow records
- `scripts/diagnose-file-chunks.ts` — diagnostic script

---

## Step 1 — Dedup (COMPLETED ✅)

Merged **3,051** shadow `file_records` into their canonical counterparts and re-parented chunks.

```powershell
# Already applied — do NOT re-run unless the DB is reset
pnpm db:dedup-records -- --project 145b3dcf-272e-4c45-9e19-953f20f25bb9 --apply
```

Output saved to: `eval/dedup-apply-output.txt`

---

## Step 2 — DOCX Reindex (IN PROGRESS 🔄 as of ~9:10 PM Jul 23)

Re-indexes all 2,750 zero-chunk DOCX files. With the fixed `findOrCreateFileRecord`, chunks now land on the canonical (UI-visible) record.

**Last known progress:** 141 / 2,750 files at 9:15 PM

```powershell
# Check if still running — look at the output file
Get-Content "C:\Users\georg\ProjectDshboard\packages\backend\eval\reindex-docx-post-dedup.txt" | Select-Object -Last 5
```

**If it has NOT completed yet — wait for it or re-run:**
```powershell
Push-Location "C:\Users\georg\ProjectDshboard\packages\backend"
pnpm tier2:stream -- `
  --corpus "C:\Users\georg\Iovino Enterprises, LLC\MLJ-017 Package 6 - General" `
  --project-id 145b3dcf-272e-4c45-9e19-953f20f25bb9 `
  --reindex-zero-chunks --filter-ext docx --concurrency 5 `
  > .\eval\reindex-docx-post-dedup.txt 2>&1
Pop-Location
```

**Verify M017_IMP fixed after reindex:**
```powershell
Push-Location "C:\Users\georg\ProjectDshboard\packages\backend"
pnpm tsx scripts/diagnose-file-chunks.ts
# Expected: actual_chunks=168, with_embedding=168
Pop-Location
```

---

## Step 3 — Re-run Smoke Test

After Step 2 completes, re-run the full 97-question smoke batch to measure improvement.

```powershell
Push-Location "C:\Users\georg\ProjectDshboard\packages\backend"
pnpm tier2:ask-batch -- --file "C:\Users\georg\ProjectDshboard\packages\backend\eval\mlj017-smoke-v2-simple-pkg6gen-batch-input.json" `
  > "C:\Users\georg\ProjectDshboard\packages\backend\eval\mlj017-smoke-v2-post-docx-dedup-output.txt" 2>&1
Pop-Location
```

Then convert and analyse:
```powershell
$c = Get-Content -Path ".\eval\mlj017-smoke-v2-post-docx-dedup-output.txt" -Encoding Unicode
$c | Out-File ".\eval\mlj017-smoke-v2-post-docx-dedup-utf8.txt" -Encoding utf8
```

Ask Copilot to parse `eval/mlj017-smoke-v2-post-docx-dedup-utf8.txt` and generate results, comparing against `eval/mlj017-smoke-v2-reindex-fresh-results.md` (the Jul 22 baseline).

---

## Expected Improvements After Steps 1–2

| Question | Was | Expected |
|---|---|---|
| sq09 M017_IMP Draft Subcontract — excluded payment provisions | 🔲 NOT INDEXED | ✅ PASS |
| sq10 M017_IMP Draft Subcontract — entire agreement clause | 🔲 NOT INDEXED | ✅ PASS |
| sq34 GEN-042R00 coordination meeting | 🔲 NOT INDEXED | ✅ PASS |
| sq36–sq37 Kick Off Pre-Work Conference (PPTX) | 🔲 NOT INDEXED | ⚠️ still 0 (PPTX, no text layer) |
| sq38–sq41 Monthly Progress Reports (PDF) | 🔲 NOT INDEXED | ⚠️ still 0 (scanned PDF) |
| sq44–sq48 Permit submittals | ⚠️/✅ | Improved detail |

**Remaining wall:** ~20 scanned PDFs (approval letters, invoices, photo PDFs) require OCR — separate feature track, not addressed by this fix.
