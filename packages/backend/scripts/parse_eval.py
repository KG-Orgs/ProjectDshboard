import re, json, pathlib

BASE = pathlib.Path("C:/Users/georg/ProjectDshboard/packages/backend")
RUN_FILE = BASE / "eval" / "mlj017-final-run.txt"
INPUT_FILE = BASE / "eval" / "mlj017-smoke-v2-simple-pkg6gen-batch-input.json"
OUT_FILE = BASE / "eval" / "mlj017-final-scored.txt"

# File is UTF-16 (PowerShell redirect default on Windows)
raw = open(RUN_FILE, encoding="utf-16").read()
batch = json.load(open(INPUT_FILE, encoding="utf-8"))
questions = batch if isinstance(batch, list) else batch.get("questions", [])
id_to_q = {q.get("id", ""): q.get("question", q.get("query", "")) for q in questions}

# Format:
# =====================...
# [sqNN]
#   question text
# =====================...
#
# --- ANSWER ---
# answer
# --- SOURCES ---
# - filename
#   pages: X
# --- CITATIONS ---
# - filename chunk=N (p. X)
# --- META --- elapsed=Xms domains=... cacheHit=...

SEP = "=" * 72

# Split on the separator+sqNN pattern
blocks = re.split(r"(?=={72}\n\[sq\d+\])", raw)
# Each block starts with the opening separator then [sqNN] then question then closing separator

results = []
for block in blocks[1:]:  # skip preamble
    # Match either:
    # ====\n[sqNN]\n  question on next lines\n====
    # ====\n[sqNN]: question on same line\n====
    header_m = re.match(
        r"={72}\n\[sq(\d+)\](?::\s*(.*?))?\n((?:  .*\n)*)?={1,72}\n",
        block,
        re.DOTALL,
    )
    if not header_m:
        continue
    sqnum = header_m.group(1)
    inline_q = header_m.group(2) or ""
    multiline_q = header_m.group(3) or ""
    qtext = inline_q.strip() or multiline_q.strip()
    body = block[header_m.end():]
    sqid = f"sq{sqnum}"

    ans_m = re.search(r"---\s*ANSWER\s*---\n(.*?)(?:---\s*SOURCES|\Z)", body, re.DOTALL)
    src_m = re.search(r"---\s*SOURCES\s*---\n(.*?)(?:---\s*CITATIONS|---\s*META|\Z)", body, re.DOTALL)
    meta_m = re.search(r"---\s*META\s*---\s*(.*)", body)

    answer = ans_m.group(1).strip() if ans_m else ""
    sources_raw = src_m.group(1).strip() if src_m else ""
    sources = []
    for line in sources_raw.splitlines():
        line = line.strip()
        if line.startswith("- "):
            sources.append(line[2:].strip())

    meta_line = meta_m.group(1).strip() if meta_m else ""
    elapsed_m = re.search(r"elapsed=(\d+)ms", meta_line)
    domains_m = re.search(r"domains=([^\s]+)", meta_line)
    cache_m = re.search(r"cacheHit=(\S+)", meta_line)

    results.append({
        "id": sqid,
        "q": id_to_q.get(sqid, qtext),
        "answer": answer,
        "sources": sources,
        "elapsed": int(elapsed_m.group(1)) if elapsed_m else -1,
        "domains": domains_m.group(1) if domains_m else "?",
        "cache": cache_m.group(1) if cache_m else "?",
    })

print(f"Parsed {len(results)} results")
with open(OUT_FILE, "w", encoding="utf-8") as f:
    for r in results:
        sep = "=" * 72
        src_str = "\n    ".join(r["sources"][:4]) if r["sources"] else "(none)"
        f.write(f"\n{sep}\n")
        f.write(f"[{r['id']}] {r['q'][:120]}\n")
        f.write(f"Domains:{r['domains']} Total:{r['elapsed']}ms Cache:{r['cache']}\n")
        f.write(f"Sources:\n    {src_str}\n")
        f.write(f"Answer:\n{r['answer'][:700]}\n")
print(f"Written {OUT_FILE}")
