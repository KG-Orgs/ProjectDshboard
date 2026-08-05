#!/usr/bin/env python3
"""
Parse mlj017-all97-run-utf8.txt and produce a detailed markdown report
showing each question, the full answer, all sources/citations, and how
retrieval arrived at those results.

Run: python3 ./eval/generate-all97-detailed-report.py
"""
import re, json, os
from datetime import date

eval_dir = os.path.dirname(os.path.abspath(__file__))
raw_path  = os.path.join(eval_dir, "mlj017-all97-run-utf8.txt")
batch_path = os.path.join(eval_dir, "mlj017-smoke-v2-simple-pkg6gen-batch-input.json")
out_path  = os.path.join(eval_dir, "mlj017-all97-detailed-report.md")

# ── load reference data ───────────────────────────────────────────────────────
with open(raw_path,  "r", encoding="utf-8") as f:
    raw = f.read()
with open(batch_path, "r", encoding="utf-8") as f:
    batch = json.load(f)

q_ref = {q["id"]: q for q in batch["questions"]}   # id → {query, activeDocFileName?, ...}

# ── parse output ──────────────────────────────────────────────────────────────
SEP = "=" * 72

def parse_output(text):
    lines = text.split("\n")
    results = []
    i = 0
    while i < len(lines):
        if lines[i].strip() == SEP:
            # skip blank lines after sep
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            label_line = lines[j].strip() if j < len(lines) else ""
            m = re.match(r"^\[(\w+)\]", label_line)
            if not m:
                i += 1
                continue
            sq_id = m.group(1)
            i = j + 1

            answer_lines   = []
            source_blocks  = []   # list of {file, pages}
            citation_lines = []   # raw strings
            elapsed_ms     = 0
            domains        = ""
            cache_hit      = False
            retrieval_log  = []   # hybrid metrics, warnings, etc.

            section = None
            cur_src = None

            while i < len(lines):
                l = lines[i]
                ls = l.strip()

                # Break when next separator + sq label found
                if ls == SEP:
                    nj = i + 1
                    while nj < len(lines) and not lines[nj].strip():
                        nj += 1
                    if nj < len(lines) and re.match(r"^\[sq\d+\]", lines[nj].strip()):
                        break

                if ls == "--- ANSWER ---":
                    section = "answer"; i += 1; continue
                if ls == "--- SOURCES ---":
                    section = "sources"; cur_src = None; i += 1; continue
                if ls == "--- CITATIONS ---":
                    section = "citations"; i += 1; continue
                if ls.startswith("--- META ---"):
                    mm = re.search(r"elapsed=(\d+)ms domains=(.+?) cacheHit=(\w+)", ls)
                    if mm:
                        elapsed_ms = int(mm.group(1))
                        domains    = mm.group(2).strip()
                        cache_hit  = mm.group(3) == "true"
                    section = "meta"; i += 1; continue

                # JSON log lines (hybrid metrics, warnings)
                if ls.startswith("{") and "event" in ls:
                    try:
                        obj = json.loads(ls)
                        evt = obj.get("event", "")
                        if "hybrid.metrics" in evt:
                            retrieval_log.append(
                                f"hybrid: profile={obj.get('profile','')} "
                                f"vector={obj.get('vectorCandidates',0)} "
                                f"lexical={obj.get('lexicalCandidates',0)} "
                                f"merged={obj.get('mergedCandidates',0)} "
                                f"restricted={obj.get('categoryRestricted',False)}"
                            )
                        elif "pgvector.failed" in evt or "fts.failed" in evt:
                            retrieval_log.append(f"⚠ {evt}: {obj.get('error','')}")
                        elif "route_summary" in evt:
                            tel = obj.get("telemetry", {})
                            retrieval_log.append(
                                f"route: retrieval={tel.get('retrievalMs',0)}ms "
                                f"agent={tel.get('agentMs',0)}ms "
                                f"total={tel.get('totalMs',0)}ms"
                            )
                    except Exception:
                        pass
                    i += 1; continue

                # node.exe stderr wrapper lines — extract inner JSON
                if "node.exe :" in ls or ls.startswith("At C:\\") or ls.startswith("+ ") or "CategoryInfo" in ls or "FullyQualifiedErrorId" in ls or "RemoteException" in ls:
                    # Try to grab JSON inside the line
                    jm = re.search(r'\{.+"event":".+?".*\}', l)
                    if jm:
                        try:
                            obj = json.loads(jm.group(0))
                            evt = obj.get("event", "")
                            if "pgvector.failed" in evt or "fts.failed" in evt:
                                retrieval_log.append(f"⚠ {evt}: {obj.get('error','')}")
                        except Exception:
                            pass
                    i += 1; continue

                if section == "answer" and ls:
                    answer_lines.append(ls)

                elif section == "sources":
                    if ls.startswith("- ") and re.search(r'\.(pdf|docx|xlsx|pptx)', ls, re.I):
                        fname = ls[2:].strip()
                        cur_src = {"file": fname, "pages": ""}
                        source_blocks.append(cur_src)
                    elif ls.startswith("pages:") and cur_src is not None:
                        cur_src["pages"] = ls[len("pages:"):].strip()

                elif section == "citations":
                    if ls.startswith("- ") and re.search(r'\.(pdf|docx|xlsx|pptx)', ls, re.I):
                        citation_lines.append(ls[2:].strip())

                i += 1

            # determine retrieval method
            timed_out = elapsed_ms >= 25000
            exact_id  = elapsed_ms < 1000 and elapsed_ms > 0
            has_hybrid = any("hybrid:" in rl for rl in retrieval_log)
            has_timeout_warn = any("⚠" in rl and "timeout" in rl for rl in retrieval_log)

            if exact_id:
                method = "exact-ID (<1s)"
            elif timed_out:
                method = "timeout → keyword fallback"
            elif has_hybrid:
                method = "hybrid (vector + FTS)"
            else:
                method = "keyword / FTS"

            results.append({
                "id":            sq_id,
                "query":         q_ref.get(sq_id, {}).get("query", label_line.replace(f"[{sq_id}]","").strip(": ")),
                "active_doc":    q_ref.get(sq_id, {}).get("activeDocFileName"),
                "answer":        "\n".join(answer_lines),
                "sources":       source_blocks,
                "citations":     citation_lines,
                "elapsed_ms":    elapsed_ms,
                "domains":       domains,
                "cache_hit":     cache_hit,
                "method":        method,
                "timed_out":     timed_out,
                "retrieval_log": retrieval_log,
            })
        else:
            i += 1

    return results


results = parse_output(raw)
print(f"Parsed {len(results)} results")

# ── compute stats ─────────────────────────────────────────────────────────────
total         = len(results)
with_sources  = sum(1 for r in results if r["sources"])
timed_out_ids = [r["id"] for r in results if r["timed_out"]]
exact_ids     = [r["id"] for r in results if r["elapsed_ms"] > 0 and r["elapsed_ms"] < 1000]
elapsed_vals  = [r["elapsed_ms"] for r in results if r["elapsed_ms"] > 0]
avg_ms  = int(sum(elapsed_vals) / len(elapsed_vals)) if elapsed_vals else 0
max_ms  = max(elapsed_vals) if elapsed_vals else 0
min_ms  = min(elapsed_vals) if elapsed_vals else 0
total_s = sum(elapsed_vals) // 1000

# category counts from q_ref
cat_counts = {}
for q in batch["questions"]:
    # infer category from sequential id number or just use domains
    pass

# ── build markdown ────────────────────────────────────────────────────────────
today = date.today().isoformat()

def fmt_timing(r):
    s = r["elapsed_ms"] / 1000
    if r["timed_out"]:  return f"⏱ TIMEOUT {s:.1f}s"
    if r["elapsed_ms"] < 1000: return f"⚡ {r['elapsed_ms']}ms"
    return f"⏱ {s:.1f}s"

def fmt_method(r):
    if r["timed_out"]:         return "Keyword fallback (pgvector + FTS both timed out)"
    if r["elapsed_ms"] < 1000: return "Exact-ID lookup (deterministic, bypasses ranking)"
    logs = r["retrieval_log"]
    for l in logs:
        if l.startswith("hybrid:"):
            parts = dict(kv.split("=") for kv in l[8:].split() if "=" in kv)
            v = parts.get("vector","?"); lex = parts.get("lexical","?"); mg = parts.get("merged","?")
            return f"Hybrid search — {v} vector + {lex} lexical → {mg} merged candidates"
    return "Keyword / FTS search"

lines_out = [
    "# MLJ-017 Package 6 — All-97 Questions: Detailed Answer Report",
    "",
    f"> **Project:** MLJ-017 Package 6 - General `145b3dcf-272e-4c45-9e19-953f20f25bb9`  ",
    f"> **Run date:** {today}  ",
    f"> **Questions:** {total} (sq01–sq102, excl. sq32/sq50–sq53)  ",
    f"> **Hybrid retrieval:** ON · **Rerank:** OFF  ",
    f"> **pgvector statement_timeout:** 30 s · **FTS statement_timeout:** 25 s  ",
    f"> **Raw output:** `eval/mlj017-all97-run-utf8.txt`",
    "",
    "---",
    "",
    "## Summary Statistics",
    "",
    "| Metric | Value |",
    "|---|---|",
    f"| Total questions | {total} |",
    f"| Questions with at least 1 source | {with_sources} ({round(100*with_sources/total)}%) |",
    f"| Exact-ID hits (sub-1s) | {len(exact_ids)} |",
    f"| DB timeout (≥25 s, keyword fallback) | {len(timed_out_ids)} |",
    f"| Min / Avg / Max elapsed | {min_ms} ms / {avg_ms} ms / {max_ms} ms |",
    f"| Total wall-clock time | {total_s} s (~{round(total_s/60)} min) |",
    "",
    "**Timeout questions (keyword search used instead of vector/FTS):**",
    ", ".join(timed_out_ids) if timed_out_ids else "_none_",
    "",
    "---",
    "",
    "## Retrieval Method Legend",
    "",
    "| Symbol | Meaning |",
    "|---|---|",
    "| ⚡ | Exact-ID lookup: a construction identifier (GEN-xxx, SWP-xxx, RFI-xxx …) was parsed from the query and resolved deterministically to a single file. Bypasses all vector/FTS ranking. |",
    "| 🔍 | Hybrid search: parallel pgvector ANN + FTS, merged with RRF, then keyword/trigram boost. |",
    "| ⏱ | Timeout fallback: project has 1.88 M embedded chunks; vector + FTS both hit statement_timeout, so keyword/trigram search was used instead. |",
    "",
    "---",
    "",
    "## Per-Question Answers",
    "",
]

for r in results:
    timing  = fmt_timing(r)
    method  = fmt_method(r)
    icon    = "⚡" if r["elapsed_ms"] < 1000 else ("⏱" if r["timed_out"] else "🔍")

    lines_out.append(f"### {icon} [{r['id']}] — {timing}")
    lines_out.append("")
    lines_out.append(f"**Query:**")
    lines_out.append(f"> {r['query']}")
    if r["active_doc"]:
        lines_out.append(f"")
        lines_out.append(f"*Active document context:* `{r['active_doc']}`")
    lines_out.append("")

    # --- RETRIEVAL section
    lines_out.append("**How the answer was retrieved:**")
    lines_out.append(f"- Method: {method}")
    lines_out.append(f"- Domains routed: `{r['domains'] or 'n/a'}`")
    lines_out.append(f"- Elapsed: {r['elapsed_ms']} ms")
    for rl in r["retrieval_log"]:
        lines_out.append(f"- {rl}")
    lines_out.append("")

    # --- SOURCES section
    if r["sources"]:
        lines_out.append("**Sources retrieved:**")
        for s in r["sources"]:
            pg = f" _(pages: {s['pages']})_" if s["pages"] else ""
            lines_out.append(f"- `{s['file']}`{pg}")
        lines_out.append("")
    else:
        lines_out.append("**Sources retrieved:** _none_")
        lines_out.append("")

    # --- CITATIONS section
    if r["citations"]:
        lines_out.append("**Citations (chunk-level):**")
        for c in r["citations"]:
            lines_out.append(f"- {c}")
        lines_out.append("")

    # --- ANSWER section
    lines_out.append("**Answer:**")
    lines_out.append("")
    if r["answer"]:
        lines_out.append("```")
        lines_out.append(r["answer"])
        lines_out.append("```")
    else:
        lines_out.append("_No answer text captured._")
    lines_out.append("")
    lines_out.append("---")
    lines_out.append("")

output = "\n".join(lines_out)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(output)

print(f"Report written: {out_path}")
print(f"  {len(results)} questions  |  {len(timed_out_ids)} timeouts  |  {len(exact_ids)} exact-ID hits")
