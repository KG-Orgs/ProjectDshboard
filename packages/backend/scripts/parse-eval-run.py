"""
Parse mlj017-llm-eval-run.txt and score each question against the original batch input.
Outputs a scored TSV to eval/llm-eval-scored.tsv.
"""
import re, json, pathlib

BASE = pathlib.Path(__file__).parent
RUN_FILE = BASE / "eval" / "mlj017-llm-eval-run.txt"
INPUT_FILE = BASE / "eval" / "mlj017-smoke-v2-simple-pkg6gen-batch-input.json"
OUT_FILE = BASE / "eval" / "llm-eval-scored.txt"

with open(RUN_FILE, encoding="latin-1") as f:
    raw = f.read()

with open(INPUT_FILE, encoding="utf-8") as f:
    batch_input = json.load(f)

# Build id->question map
id_to_q: dict[str, str] = {}
for item in batch_input.get("questions", batch_input if isinstance(batch_input, list) else []):
    qid = item.get("id", "")
    qtext = item.get("question", item.get("query", ""))
    id_to_q[qid] = qtext

# Split into per-question blocks
blocks = re.split(r"\n(?=\[sq\d+\])", raw)
results: list[dict] = []

for block in blocks:
    m = re.match(r"\[sq(\d+)\](?::\s*(.*?))?(?:\n|$)", block, re.DOTALL)
    if not m:
        continue
    sqnum = m.group(1)
    sqid = f"sq{sqnum}"
    
    answer_m = re.search(r"={3,} ANSWER ={3,}\n(.*?)(?:={3,} SOURCES ={3,}|$)", block, re.DOTALL)
    sources_m = re.search(r"={3,} SOURCES ={3,}\n(.*?)(?:={3,} META ={3,}|$)", block, re.DOTALL)
    meta_m = re.search(r"={3,} META ={3,}\n(.*?)$", block, re.DOTALL)
    
    answer = answer_m.group(1).strip() if answer_m else ""
    sources_raw = sources_m.group(1).strip() if sources_m else ""
    meta_raw = meta_m.group(1).strip() if meta_m else ""
    
    sources = [s.strip("- ").strip() for s in sources_raw.splitlines() if s.strip().startswith("-") or (s.strip() and not s.strip().startswith("pages:"))]
    sources = [s for s in sources if s and not s.startswith("pages:")]
    
    elapsed_m = re.search(r"elapsedMs:\s*(\d+)", meta_raw)
    agent_m = re.search(r"agent=(\d+)ms", meta_raw)
    intent_m = re.search(r"intent:\s*(\S+)", meta_raw)
    
    elapsed = int(elapsed_m.group(1)) if elapsed_m else -1
    agent_ms = int(agent_m.group(1)) if agent_m else 0
    intent = intent_m.group(1) if intent_m else "unknown"
    
    question = id_to_q.get(sqid, m.group(2) or "")
    
    results.append({
        "id": sqid,
        "question": question,
        "answer": answer,
        "sources": sources,
        "elapsed_ms": elapsed,
        "agent_ms": agent_ms,
        "intent": intent,
    })

print(f"Parsed {len(results)} questions")

# Write structured output
with open(OUT_FILE, "w", encoding="utf-8") as f:
    for r in results:
        f.write(f"\n{'='*72}\n")
        f.write(f"[{r['id']}] {r['question'][:100]}\n")
        f.write(f"Intent: {r['intent']} | Agent: {r['agent_ms']}ms | Total: {r['elapsed_ms']}ms\n")
        f.write(f"Sources: {'; '.join(r['sources'][:3]) if r['sources'] else '(none)'}\n")
        f.write(f"ANSWER:\n{r['answer'][:600]}\n")

print(f"Written {OUT_FILE}")
