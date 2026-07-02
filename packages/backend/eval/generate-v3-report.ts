/**
 * Parses mlj017-smoke-v3-raw-output.txt + mlj017-smoke-questions-v3.json
 * and writes mlj017-smoke-questions-v3-results.md
 *
 * Run: tsx ./eval/generate-v3-report.ts
 */

import fs from 'fs';
import path from 'path';

const evalDir  = path.join(__dirname);
const rawPath  = path.join(evalDir, 'mlj017-smoke-v3-raw-output.txt');
const jsonPath = path.join(evalDir, 'mlj017-smoke-questions-v3.json');
const outPath  = path.join(evalDir, 'mlj017-smoke-questions-v3-results.md');

// ── Types ─────────────────────────────────────────────────────────────────────
interface SuiteEntry {
  id: string;
  questionNumber: number;
  category: string;
  bucket: string;
  query: string;
  expectedFilePatterns: string[];
  acceptableAnswerContains: string[];
  groundingFileId?: string;
  groundingPageNumber?: number;
}

interface ParsedResult {
  id: string;
  query: string;
  answer: string;
  sources: string[];
  citations: string[];
  elapsed: string;
  domains: string;
  cacheHit: string;
}

interface EvalResult {
  verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'MANUAL';
  reason: string;
}

// ── Load inputs ───────────────────────────────────────────────────────────────
const rawText   = fs.readFileSync(rawPath, 'utf16le');
const suiteRaw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const suite: SuiteEntry[] = Array.isArray(suiteRaw) ? suiteRaw : (suiteRaw.questions ?? []);
const lookup = new Map(suite.map((q: SuiteEntry) => [q.id, q]));

// ── Normalize line endings ─────────────────────────────────────────────────────
const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// ── Split into blocks ─────────────────────────────────────────────────────────
// The format uses TWO separator lines per question:
//   SEP\n[id]\n  query\nSEP\n\n--- ANSWER ---\n...\n--- META ---\n
// So we collect all segments between SEP lines, then merge even/odd pairs:
// odd segment = header (id + query), even segment = body (answer/sources/meta)
const SEP = '='.repeat(72);
const segments: string[] = [];
let current: string[] = [];
for (const line of normalizedText.split('\n')) {
  if (line.trim() === SEP) {
    if (current.length > 0) segments.push(current.join('\n'));
    current = [];
  } else {
    current.push(line);
  }
}
if (current.length > 0) segments.push(current.join('\n'));

// Merge header+body pairs into full question blocks
const rawBlocks: string[] = [];
for (let i = 0; i < segments.length - 1; i++) {
  const seg = segments[i];
  if (/\[v3-/.test(seg)) {
    // This is a header segment; the next segment is the body
    rawBlocks.push(seg + '\n' + segments[i + 1]);
    i++; // skip body segment
  }
}

// Only blocks that contain a question id
const questionBlocks = rawBlocks.filter(b => /\[v3-/.test(b));

// ── Parse a block ─────────────────────────────────────────────────────────────
function parseBlock(block: string): ParsedResult {
  const lines = block.split('\n');

  // ID and query
  let id   = '';
  let query = '';
  const idLine = lines.find(l => /\[v3-/.test(l));
  if (idLine) {
    const m = idLine.match(/\[([^\]]+)\]/);
    if (m) id = m[1];
    // query may be on same line after ]: or on next non-empty line
    const sameLineMatch = idLine.match(/\[[^\]]+\]:\s*(.+)/);
    if (sameLineMatch) {
      query = sameLineMatch[1].trim();
    } else {
      const idx = lines.indexOf(idLine);
      for (let i = idx + 1; i < lines.length; i++) {
        const t = lines[i].trim();
        if (t && !t.startsWith('{') && !t.startsWith('[') && !t.startsWith('-')) { query = t; break; }
      }
    }
  }

  // Helper to extract a section
  function extractSection(startMarker: string, endMarkers: string[]): string {
    const startIdx = lines.findIndex(l => l.trim() === startMarker);
    if (startIdx < 0) return '';
    let endIdx = lines.length;
    for (const em of endMarkers) {
      const idx = lines.findIndex((l, i) => i > startIdx && l.trim() === em);
      if (idx >= 0 && idx < endIdx) endIdx = idx;
    }
    return lines.slice(startIdx + 1, endIdx).join('\n');
  }

  // Answer
  const answerRaw = extractSection('--- ANSWER ---', ['--- SOURCES ---', '--- CITATIONS ---', '--- META ---']);
  const answer = answerRaw
    .split('\n')
    .filter(l => !l.trim().startsWith('{"timestamp"'))
    .join('\n')
    .trim();

  // Sources
  const sourcesRaw = extractSection('--- SOURCES ---', ['--- CITATIONS ---', '--- META ---']);
  const sources: string[] = [];
  for (const line of sourcesRaw.split('\n')) {
    const m = line.match(/^\s{0,4}-\s+(.+)/);
    if (m && !m[1].trim().startsWith('pages:') && !m[1].trim().startsWith('{"timestamp"')) {
      sources.push(m[1].trim());
    }
  }

  // Citations
  const citationsRaw = extractSection('--- CITATIONS ---', ['--- META ---']);
  const citations: string[] = [];
  for (const line of citationsRaw.split('\n')) {
    const m = line.match(/^\s*-\s+(.+)/);
    if (m && !m[1].trim().startsWith('{"timestamp"')) {
      citations.push(m[1].trim());
    }
  }

  // META
  let elapsed = '', domains = '', cacheHit = '';
  const metaLine = lines.find(l => l.includes('--- META ---'));
  if (metaLine) {
    const mElapsed = metaLine.match(/elapsed=(\d+)ms/);
    const mDomains = metaLine.match(/domains=([^ ]+)/);
    const mCache   = metaLine.match(/cacheHit=(\w+)/);
    if (mElapsed) elapsed  = mElapsed[1];
    if (mDomains) domains  = mDomains[1];
    if (mCache)   cacheHit = mCache[1];
  }

  return { id, query, answer, sources, citations, elapsed, domains, cacheHit };
}

// ── Evaluate pass/fail ────────────────────────────────────────────────────────
function evaluate(parsed: ParsedResult, entry: SuiteEntry): EvalResult {
  // Manual/binary chunk
  if (entry.acceptableAnswerContains.length === 0 && entry.expectedFilePatterns.length === 0) {
    return { verdict: 'MANUAL', reason: 'Binary-chunk content — manual validation required' };
  }

  const firstSource = parsed.sources[0] ?? '';

  // Check source patterns
  let topSourceHit = false;
  let anySourceHit = false;
  for (const pat of entry.expectedFilePatterns) {
    const regex = new RegExp(pat.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
    if (regex.test(firstSource)) topSourceHit = true;
    if (parsed.sources.some(s => regex.test(s))) anySourceHit = true;
  }

  // Check answer content
  let answerHit = entry.acceptableAnswerContains.length === 0;
  for (const phrase of entry.acceptableAnswerContains) {
    if (parsed.answer.toLowerCase().includes(phrase.toLowerCase())) {
      answerHit = true;
      break;
    }
  }

  if (topSourceHit && answerHit) {
    return { verdict: 'PASS', reason: 'Correct source at top rank; answer contains expected content.' };
  } else if (anySourceHit && answerHit) {
    return { verdict: 'PARTIAL', reason: 'Correct source retrieved but not ranked first; answer content found.' };
  } else if (topSourceHit && !answerHit) {
    return { verdict: 'PARTIAL', reason: 'Correct source at top rank but answer did not contain expected phrases.' };
  } else if (anySourceHit && !answerHit) {
    return { verdict: 'PARTIAL', reason: 'Expected source retrieved but not ranked first; answer content missing.' };
  } else {
    const topLabel = firstSource || '(no sources)';
    const noAnswer = entry.acceptableAnswerContains.length > 0 && !answerHit
      ? ` Answer missing expected phrases.`
      : '';
    return { verdict: 'FAIL', reason: `Expected source not in retrieved set. Top source: "${topLabel}".${noAnswer}` };
  }
}

// ── Parse all ─────────────────────────────────────────────────────────────────
interface FullResult extends ParsedResult, EvalResult {
  category: string;
  questionNum: number;
  bucket: string;
  expectedFilePatterns: string[];
  acceptableAnswerContains: string[];
  groundingFileId?: string;
  groundingPageNumber?: number;
}

const results: FullResult[] = [];
for (const block of questionBlocks) {
  const p = parseBlock(block);
  if (!p.id) continue;
  const entry = lookup.get(p.id);
  if (!entry) { console.warn(`No suite entry for id=${p.id}`); continue; }
  const ev = evaluate(p, entry);
  results.push({
    ...p,
    ...ev,
    category:    entry.category,
    questionNum: entry.questionNumber,
    bucket:      entry.bucket,
    expectedFilePatterns:    entry.expectedFilePatterns,
    acceptableAnswerContains: entry.acceptableAnswerContains,
    groundingFileId:    entry.groundingFileId,
    groundingPageNumber: entry.groundingPageNumber,
  });
}

console.log(`Parsed ${results.length} results`);

// ── Summary stats ─────────────────────────────────────────────────────────────
const countBy = (v: string) => results.filter(r => r.verdict === v).length;
const pass    = countBy('PASS');
const partial = countBy('PARTIAL');
const fail    = countBy('FAIL');
const manual  = countBy('MANUAL');
const total   = results.length;

const pct = (n: number) => Math.round(n / total * 100) + '%';

// Group by category
const catMap = new Map<string, FullResult[]>();
for (const r of results) {
  if (!catMap.has(r.category)) catMap.set(r.category, []);
  catMap.get(r.category)!.push(r);
}
const categories = [...catMap.keys()].sort();

function verdictLabel(v: string): string {
  switch (v) {
    case 'PASS':    return '✅ PASS';
    case 'PARTIAL': return '⚠️ PARTIAL';
    case 'FAIL':    return '❌ FAIL';
    case 'MANUAL':  return '🔍 MANUAL';
    default:        return v;
  }
}

// ── Build markdown ────────────────────────────────────────────────────────────
const lines: string[] = [];

const push = (...ls: string[]) => lines.push(...ls);

push(
  '# MLJ-017 Smoke Test v3 — Results Report',
  '',
  '**Project:** MLJ-017 Package 6 - General (TEST CLONE)',
  '**Project ID:** `731cfd5d-e647-4551-89e7-0a3cc4915115`',
  `**Run date:** ${new Date().toISOString().split('T')[0]}`,
  '**Total questions:** 54 | **Retrieval mode:** Hybrid (RETRIEVAL_HYBRID_ENABLED=true) | **Reranking:** Disabled',
  '',
);

// Summary table
push(
  '## Summary',
  '',
  '| Verdict | Count | % |',
  '|---------|-------|---|',
  `| ✅ PASS    | ${pass}    | ${pct(pass)} |`,
  `| ⚠️ PARTIAL | ${partial} | ${pct(partial)} |`,
  `| ❌ FAIL    | ${fail}    | ${pct(fail)} |`,
  `| 🔍 MANUAL  | ${manual}  | ${pct(manual)} |`,
  `| **Total** | **${total}** | **100%** |`,
  '',
);

// Category breakdown
push(
  '## Results by Category',
  '',
  '| Category | Total | ✅ PASS | ⚠️ PARTIAL | ❌ FAIL | 🔍 MANUAL |',
  '|----------|-------|---------|-----------|--------|----------|',
);
for (const cat of categories) {
  const items = catMap.get(cat)!;
  const cP = items.filter(r => r.verdict === 'PASS').length;
  const cPa = items.filter(r => r.verdict === 'PARTIAL').length;
  const cF = items.filter(r => r.verdict === 'FAIL').length;
  const cM = items.filter(r => r.verdict === 'MANUAL').length;
  push(`| ${cat.replace(/_/g, ' ')} | ${items.length} | ${cP} | ${cPa} | ${cF} | ${cM} |`);
}
push('');

// Failures list
const failPartial = results.filter(r => r.verdict === 'FAIL' || r.verdict === 'PARTIAL');
if (failPartial.length > 0) {
  push(
    '## Failures & Partials',
    '',
    '| ID | Category | Verdict | Issue |',
    '|----|----------|---------|-------|',
  );
  for (const r of failPartial) {
    const short = r.reason.length > 120 ? r.reason.slice(0, 117) + '...' : r.reason;
    push(`| ${r.id} | ${r.category.replace(/_/g, ' ')} | ${verdictLabel(r.verdict)} | ${short} |`);
  }
  push('');
}

push('---', '', '## Detailed Results', '');

// Per question
for (const cat of categories) {
  const catLabel = cat.replace(/_/g, ' ').toUpperCase();
  push(`### Category: ${catLabel}`, '');

  const catResults = catMap.get(cat)!.sort((a, b) => a.questionNum - b.questionNum);
  for (const r of catResults) {
    push(
      `#### Q${r.questionNum} — \`${r.id}\` — ${verdictLabel(r.verdict)}`,
      '',
      `**Question:** ${r.query}`,
      '',
      '**Answer:**',
      '',
    );

    // Clean answer
    const cleanAnswer = r.answer
      .split('\n')
      .map(l => l.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
    push(cleanAnswer, '');

    // How the agent got there
    push('**How the agent got there:**', '');
    if (r.sources.length > 0) {
      push('Retrieved sources (in retrieval order):', '');
      for (const src of r.sources) push(`- \`${src}\``);
      push('');
    }
    if (r.citations.length > 0) {
      push('Top-ranked citations:', '');
      for (const cit of r.citations) push(`- ${cit}`);
      push('');
    }

    const meta: string[] = [];
    if (r.domains)  meta.push(`Domain routing: **${r.domains}**`);
    if (r.elapsed)  meta.push(`Elapsed: **${r.elapsed} ms**`);
    if (r.cacheHit) meta.push(`Cache hit: **${r.cacheHit}**`);
    if (meta.length) push(meta.join(' | '), '');

    push(`**Verdict:** ${verdictLabel(r.verdict)} — ${r.reason}`, '');

    if (r.expectedFilePatterns.length > 0) {
      push(`*Expected file patterns:* ${r.expectedFilePatterns.join(', ')}`, '');
    }
    if (r.acceptableAnswerContains.length > 0) {
      push(`*Expected answer to contain:* ${r.acceptableAnswerContains.join(', ')}`, '');
    }
    if (r.groundingFileId) {
      push(`*Ground truth source:* \`${r.groundingFileId}\`${r.groundingPageNumber ? ` p.${r.groundingPageNumber}` : ''}`, '');
    }

    push('---', '');
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Report written to: ${outPath}`);
console.log(`PASS=${pass} PARTIAL=${partial} FAIL=${fail} MANUAL=${manual}`);
