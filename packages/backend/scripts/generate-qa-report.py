"""
Parse mlj017-final-run.txt (UTF-16) into a full markdown Q&A report.
Includes: question, retrieval method, elapsed time, sources, citations, answer.
"""

import re, json, pathlib

BASE = pathlib.Path("C:/Users/georg/ProjectDshboard/packages/backend")
RUN_FILE  = BASE / "eval" / "mlj017-final-run.txt"
INPUT_FILE = BASE / "eval" / "mlj017-smoke-v2-simple-pkg6gen-batch-input.json"
OUT_FILE  = BASE / "eval" / "mlj017-final-qa-report.md"

# ── load raw file (UTF-16 LE – PowerShell redirect default)
raw = open(RUN_FILE, encoding="utf-16").read()

# ── load question text from batch input
batch = json.load(open(INPUT_FILE, encoding="utf-8"))
questions = batch if isinstance(batch, list) else batch.get("questions", [])
id_to_q = {q.get("id", ""): q.get("question", q.get("query", "")) for q in questions}

# ── split into per-question blocks
blocks = re.split(r"(?=={72}\n\[sq\d+\])", raw)

def extract_block(block: str) -> dict | None:
    header = re.match(
        r"={72}\n\[sq(\d+)\](?::\s*(.*?))?\n((?:  .*\n)*)?={1,72}\n",
        block, re.DOTALL
    )
    if not header:
        return None

    sqnum     = header.group(1)
    inline_q  = (header.group(2) or "").strip()
    multi_q   = (header.group(3) or "").strip()
    body      = block[header.end():]
    sqid      = f"sq{sqnum}"
    q_text    = id_to_q.get(sqid) or inline_q or multi_q

    def section(name: str, stop: str = r"---\s*\w") -> str:
        m = re.search(rf"---\s*{name}\s*---\n(.*?)(?:---\s*\w|\Z)", body, re.DOTALL | re.IGNORECASE)
        return m.group(1).strip() if m else ""

    answer   = section("ANSWER")
    sources  = section("SOURCES")
    cites    = section("CITATIONS")

    meta_m   = re.search(r"---\s*META\s*---\s*(.*)", body)
    meta_raw = meta_m.group(1).strip() if meta_m else ""

    elapsed_m  = re.search(r"elapsed=(\d+)ms", meta_raw)
    domains_m  = re.search(r"domains=([^\s]+)", meta_raw)
    cache_m    = re.search(r"cacheHit=(\S+)", meta_raw)

    elapsed = int(elapsed_m.group(1)) if elapsed_m else -1
    domains = domains_m.group(1) if domains_m else "?"
    cache   = cache_m.group(1) if cache_m else "?"

    return {
        "id":      sqid,
        "q":       q_text,
        "answer":  answer,
        "sources": sources,
        "cites":   cites,
        "elapsed": elapsed,
        "domains": domains,
        "cache":   cache,
        "meta":    meta_raw,
    }

records = [r for b in blocks[1:] if (r := extract_block(b))]
print(f"Parsed {len(records)} questions")

# ── score helper — 7-rule grading logic ──────────────────────────────────────
#
# A PASS requires ALL of the following:
#   1. Exact requested document ID matches (when one is supplied).
#   2. Exact requested revision matches.
#   3. Every requested field is answered.
#   4. The answer is supported by retrieved evidence.
#   5. Citations come from the correct document.
#   6. The response does not say the requested information could not be found.
#   7. For multiple-choice / status fields, the answer identifies the selected
#      value rather than merely listing all available options.
#
def score_label(r: dict) -> str:
    ans_raw = r["answer"]
    ans     = ans_raw.lower()
    srcs    = r["sources"].strip()
    q_text  = r.get("q", "")

    # ── Rule 4: No evidence retrieved → FAIL ─────────────────────────────────
    if not srcs or "(none)" in srcs:
        return "❌ FAIL — no sources"

    # ── Rules 1+2+5: Exact document ID / revision match ──────────────────────
    # Extract submittal-style IDs from question: CODE-NNNRxx (e.g. AVI-002R01)
    ids_in_q = re.findall(r'\b([A-Z]{2,8}-\d{3,4}R\d{2})\b', q_text)
    # Extract plain RFI numbers: RFI-NNNN (e.g. RFI-0116)
    rfis_in_q = re.findall(r'\bRFI-(\d{3,4})\b', q_text, re.IGNORECASE)

    src_upper = srcs.upper()
    for doc_id in ids_in_q:
        if doc_id.upper() not in src_upper:
            return "❌ FAIL — wrong document"
    for rfi_num in rfis_in_q:
        if f"RFI-{rfi_num}" not in src_upper:
            return "❌ FAIL — wrong document"

    # ── Rules 3+6: Answer admits it cannot answer the question ────────────────
    cannot_answer = [
        # plural/singular verb variants the old scorer missed
        "do not contain information",
        "does not contain information",
        # document wrong / missing
        "does not contain",
        "is not available in the provided context",
        # field-level "cannot answer" phrases
        "it does not specify",
        "does not specify which",
        "it does not detail",
        "does not detail which",
        "cannot be identified",
        "not fully visible in excerpt",
        # explicit refusal phrases
        "i need access to",
        "please provide the correct",
        "would be needed",
        "not found in the retrieved",
        "cannot find information",
        "information is not present",
        "could not be found",
    ]
    if any(p in ans for p in cannot_answer):
        return "❌ FAIL — answer says info not found"

    # ── Rule 7: Multiple-choice enumeration without identifying selection ──────
    # Triggered when the question explicitly asks for a single selected value
    # (designation, status, etc.) but the answer just lists all available options
    # from the same page without indicating which one is checked/selected.
    is_selection_q = bool(re.search(
        r'\bwhat is the.{0,50}(?:designation|status|type)\b'
        r'|\bwhich.{0,30}(?:designation|applies|option)\b'
        r'|\binformation only.{0,40}(?:approval|designer review)'
        r'|(?:approval|designer review).{0,40}information only',
        q_text, re.IGNORECASE
    ))
    if is_selection_q:
        bullet_lines = [l for l in ans_raw.splitlines()
                        if re.match(r'^\s*[-•*]\s+', l)]
        pages_cited  = re.findall(r'\(p\.\s*(\d+)\)', ans_raw)
        # Listing ≥4 items all from the same page with no selection indicator
        has_selection = bool(re.search(
            r'\b(?:select\w*|check\w*|mark\w*|chosen|applied|appli[eo]|identified as)\b',
            ans
        ))
        if (len(bullet_lines) >= 4 and len(pages_cited) >= 4
                and len(set(pages_cited)) == 1 and not has_selection):
            return "❌ FAIL — enumerates options instead of identifying selected value"

    # ── Existing PARTIAL patterns (LLM refusal / partial retrieval) ───────────
    if any(x in ans for x in [
        "could not find an exact indexed passage",
        "could not verify", "no evidence-backed",
        "refine with a section heading",
        "re-run indexing", "do not have indexed text",
        "please provide", "i need access",
    ]):
        return "⚠️ PARTIAL / REFUSAL"

    return "✅ PASS"

# ── write markdown
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write("# MLJ-017 Package 6 — 97-Question Q&A Report\n\n")
    f.write("> **Project:** MLJ-017 Package 6 General · `145b3dcf-272e-4c45-9e19-953f20f25bb9`  \n")
    f.write("> **Run:** `mlj017-final-run.txt` (all DB indexes valid · GIN CTE FTS fix active)  \n")
    f.write("> **Date:** 2026-08-09\n\n")
    f.write("---\n\n")
    f.write("## How retrieval works\n\n")
    f.write("Each question goes through the following pipeline:\n\n")
    f.write("1. **Intent parsing** — domain tags extracted (contracts, documents, field_ops, …)\n")
    f.write("2. **Identifier lookup** — if a code like `GEN-042R00`, `MTACD-MLJTC2-L-0024`, `Invoice 11707` is detected, a deterministic exact-match is tried first\n")
    f.write("3. **Hybrid retrieval** — parallel pgvector HNSW ANN + GIN FTS (MATERIALIZED CTE approach), merged with RRF ranking\n")
    f.write("4. **Reranking** — keyword/trigram boost, graph-neighbour expansion\n")
    f.write("5. **LLM synthesis** — `google/gemini-2.5-flash` via OpenRouter drafts the answer, citing chunk page numbers\n\n")
    f.write("---\n\n")
    f.write("## Questions and Answers\n\n")

    # Count scores for summary
    scored = [(r, score_label(r)) for r in records]
    passes   = sum(1 for _,s in scored if s.startswith("✅"))
    partials = sum(1 for _,s in scored if s.startswith("⚠️"))
    fails    = sum(1 for _,s in scored if s.startswith("❌"))
    elaps    = [r["elapsed"] for r in records if r["elapsed"] >= 0]
    avg_s    = sum(elaps)/len(elaps)/1000 if elaps else 0
    max_s    = max(elaps)/1000 if elaps else 0
    f.write(f"| Grade | Count | % |\n|---|---|---|\n")
    f.write(f"| ✅ PASS | {passes} | {passes*100//97}% |\n")
    f.write(f"| ⚠️ PARTIAL | {partials} | {partials*100//97}% |\n")
    f.write(f"| ❌ FAIL | {fails} | {fails*100//97}% |\n\n")
    f.write(f"**Avg elapsed:** {avg_s:.1f}s &nbsp; **Max elapsed:** {max_s:.1f}s &nbsp; **Timeouts (≥25s):** {sum(1 for r in records if r['elapsed'] >= 25000)}\n\n")
    f.write("---\n\n")

    for r, label in scored:
        f.write(f"### {label} [{r['id']}]\n\n")
        f.write(f"**Question:** {r['q']}\n\n")

        # Retrieval metadata
        elapsed_s = f"{r['elapsed']/1000:.1f}s" if r["elapsed"] >= 0 else "—"
        f.write(f"**Retrieval:** domains=`{r['domains']}` · elapsed=`{elapsed_s}` · cacheHit=`{r['cache']}`\n\n")

        # Sources — strip bullet prefix, skip "pages:" lines
        if r["sources"]:
            f.write("**Sources retrieved:**\n\n")
            for line in r["sources"].splitlines():
                line = line.strip().lstrip("- ").strip()
                if line and not line.startswith("pages:"):
                    f.write(f"- `{line}`\n")
            f.write("\n")

        # Citations (chunk-level)
        if r["cites"]:
            f.write("<details><summary>Chunk-level citations</summary>\n\n")
            for line in r["cites"].splitlines():
                line = line.strip().lstrip("- ").strip()
                if line:
                    f.write(f"- {line}\n")
            f.write("\n</details>\n\n")

        # Answer
        f.write("**Answer:**\n\n")
        f.write(r["answer"])
        f.write("\n\n---\n\n")

print(f"Written: {OUT_FILE}")
