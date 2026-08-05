#!/usr/bin/env python3
"""Parse mlj017-all97-run-utf8.txt and produce a markdown results report."""
import re, json, os

eval_dir = os.path.dirname(os.path.abspath(__file__))
raw_path = os.path.join(eval_dir, "mlj017-all97-run-utf8.txt")
batch_path = os.path.join(eval_dir, "mlj017-smoke-v2-simple-pkg6gen-batch-input.json")
out_path = os.path.join(eval_dir, "mlj017-all97-results.md")

with open(raw_path, "r", encoding="utf-8") as f:
    content = f.read()

with open(batch_path, "r", encoding="utf-8") as f:
    batch = json.load(f)

q_map = {q["id"]: q["query"] for q in batch["questions"]}

# Split on separator lines (72 = signs)
SEP = "=" * 72

# Find all question blocks
results = []
# Split content into lines, filtering truly empty consecutive lines
lines = [l.rstrip() for l in content.split("\n")]

# State machine parse
i = 0
while i < len(lines):
    line = lines[i]
    # Look for separator
    if line == SEP:
        # Next non-blank line is label/id
        j = i + 1
        while j < len(lines) and lines[j].strip() == "":
            j += 1
        label_line = lines[j].strip() if j < len(lines) else ""
        id_match = re.match(r"^\[(\w+)\]", label_line)
        if not id_match:
            i += 1
            continue
        sq_id = id_match.group(1)
        query_start = j + 1
        # Skip blank lines and the next separator
        while query_start < len(lines) and (lines[query_start].strip() == "" or lines[query_start] == SEP):
            query_start += 1
        # query is the next non-blank non-sep line if it doesn't start with ---
        query = q_map.get(sq_id, label_line.replace(f"[{sq_id}]", "").strip(": ").strip())

        # Now scan for answer/sources/meta until next separator or end
        answer_lines = []
        source_lines = []
        elapsed_ms = 0
        domains = ""
        cache_hit = False
        timed_out = False

        section = None
        k = j + 1
        while k < len(lines):
            l = lines[k]
            if l == SEP and k + 1 < len(lines):
                # check if next non-blank is a new [sq...] label
                nk = k + 1
                while nk < len(lines) and lines[nk].strip() == "":
                    nk += 1
                if nk < len(lines) and re.match(r"^\[sq\d+\]", lines[nk].strip()):
                    break
            if "--- ANSWER ---" in l:
                section = "answer"
            elif "--- SOURCES ---" in l:
                section = "sources"
            elif "--- CITATIONS ---" in l:
                section = "citations"
            elif "--- META ---" in l:
                m = re.search(r"elapsed=(\d+)ms domains=(.+?) cacheHit=(\w+)", l)
                if m:
                    elapsed_ms = int(m.group(1))
                    domains = m.group(2).strip()
                    cache_hit = m.group(3) == "true"
                    timed_out = elapsed_ms >= 25000
                section = None
                k += 1
                break
            else:
                if section == "answer" and l.strip():
                    answer_lines.append(l.strip())
                elif section == "sources":
                    # Lines like "- filename.pdf"
                    sm = re.match(r"^- (.+\.(pdf|docx|xlsx|pptx))", l, re.IGNORECASE)
                    if sm:
                        source_lines.append(sm.group(1))
            k += 1

        results.append({
            "id": sq_id,
            "query": query,
            "answer": " ".join(answer_lines[:6]),
            "sources": source_lines,
            "elapsed_ms": elapsed_ms,
            "domains": domains,
            "cache_hit": cache_hit,
            "timed_out": timed_out,
        })
        i = k
    else:
        i += 1

print(f"Parsed {len(results)} results")

# Stats
total = len(results)
with_sources = sum(1 for r in results if r["sources"])
timed_out_list = [r["id"] for r in results if r["timed_out"]]
elapsed_vals = [r["elapsed_ms"] for r in results if r["elapsed_ms"] > 0]
avg_ms = sum(elapsed_vals) / len(elapsed_vals) if elapsed_vals else 0
max_ms = max(elapsed_vals) if elapsed_vals else 0
min_ms = min(elapsed_vals) if elapsed_vals else 0
total_sec = sum(elapsed_vals) // 1000

from datetime import date
today = date.today().isoformat()

lines_out = [
    "# MLJ-017 All-97 Eval Run Results",
    "",
    f"**Project:** MLJ-017 Package 6 - General `145b3dcf-272e-4c45-9e19-953f20f25bb9`",
    f"**Run date:** {today}",
    f"**Questions:** {total} (sq01–sq102, excl. sq32/sq50–sq53)",
    "**Hybrid retrieval:** ON · **Rerank:** OFF · **pgvector timeout:** 30s · **FTS timeout:** 25s",
    "**Input:** `eval/mlj017-smoke-v2-simple-pkg6gen-batch-input.json`",
    "",
    "---",
    "",
    "## Performance Summary",
    "",
    "| Metric | Value |",
    "|---|---|",
    f"| Total questions | {total} |",
    f"| Questions with sources returned | {with_sources} ({round(100*with_sources/total)}%) |",
    f"| Questions that hit DB timeout (≥25s) | {len(timed_out_list)} ({round(100*len(timed_out_list)/total)}%) |",
    f"| Min elapsed | {min_ms}ms |",
    f"| Max elapsed | {max_ms}ms |",
    f"| Avg elapsed | {round(avg_ms)}ms |",
    f"| Total wall time | {total_sec}s (~{round(total_sec/60)}min) |",
    "",
    f"**Timeout questions (fell back to keyword search):** {', '.join(timed_out_list)}",
    "",
    "---",
    "",
    "## Per-Question Results",
    "",
]

for r in results:
    elapsed_s = r["elapsed_ms"] / 1000
    if r["timed_out"]:
        timing = f"⏱️ TIMEOUT {elapsed_s:.1f}s (keyword fallback)"
    elif r["elapsed_ms"] < 1000:
        timing = f"✓ {r['elapsed_ms']}ms (exact-ID)"
    else:
        timing = f"{elapsed_s:.1f}s"

    src_display = ", ".join(f"`{s}`" for s in r["sources"][:3])
    if len(r["sources"]) > 3:
        src_display += f" +{len(r['sources'])-3} more"
    if not src_display:
        src_display = "_no sources_"

    answer_snippet = r["answer"][:400] + ("…" if len(r["answer"]) > 400 else "")

    lines_out += [
        f"### [{r['id']}] — {timing}",
        f"**Query:** {r['query']}",
        f"**Domains:** {r['domains'] or 'n/a'} | **Sources:** {src_display}",
        f"**Answer:** {answer_snippet}",
        "",
        "---",
        "",
    ]

output = "\n".join(lines_out)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(output)

print(f"Report written: {out_path}")
print(f"Timed out ({len(timed_out_list)}): {', '.join(timed_out_list)}")
