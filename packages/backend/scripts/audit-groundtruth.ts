/**
 * One-off: validate whether smoke-audit FAILURES reference a real, indexed
 * source of truth. For each failing query we parse the expected file + topic
 * from the query text, then check the actual corpus:
 *   - does a file matching that name/identifier exist?
 *   - is it indexed (chunkCount > 0)?
 *   - do its chunks actually contain the asked-about topic term(s)?
 *
 * This tells us if a failure is a genuine retrieval/answer miss (valid ground
 * truth) or a broken test (missing / unindexed / off-topic ground truth).
 *
 * Usage: pnpm tsx ./scripts/audit-groundtruth.ts
 */
import { config } from "dotenv";

config({ path: "/Users/kyle.weixu/src/ai-assistant/.env" });
process.env.RETRIEVAL_HYBRID_ENABLED = process.env.RETRIEVAL_HYBRID_ENABLED ?? "true";

import { readFileSync } from "node:fs";
import { and, eq, ilike } from "drizzle-orm";

type Result = {
  id: string;
  query: string;
  passed: boolean;
  sourceFileHit?: boolean;
  answerSnippet?: string;
};
type Report = { projectId: string; results: Result[] };

type Parsed = { file: string; topics: string[]; template: string } | null;

function parseQuery(q: string): Parsed {
  let m = q.match(/^In (.+?), what is required for (.+)\?$/i);
  if (m) return { file: m[1], topics: [m[2]], template: "requiredFor" };
  m = q.match(/^In (.+?), what does the document state about (.+)\?$/i);
  if (m) return { file: m[1], topics: splitTopics(m[2]), template: "filenameTopic" };
  m = q.match(/^What does (.+?) state about (.+)\?$/i);
  if (m) return { file: m[1], topics: splitTopics(m[2]), template: "stateAB" };
  return null;
}

function splitTopics(s: string): string[] {
  return s
    .split(/\s+and\s+/i)
    .map((t) => t.trim())
    .filter(Boolean);
}

// Pick a distinctive substring of the file label for ILIKE matching: drop the
// trailing parenthetical and use the most distinctive leading chunk.
// Distinctive substring for ILIKE. Keep underscores: in ILIKE `_` is a
// single-char wildcard, so it still matches both "Stirling_NDA" and
// "Stirling NDA". Only escape `%` (multi-char wildcard).
function fileNeedle(file: string): string {
  return file
    .replace(/\s*\(.*$/, "")
    .replace(/%/g, " ")
    .trim()
    .slice(0, 48);
}

async function main() {
  const report: Report = JSON.parse(
    readFileSync("./eval/mlj017-smoke-audit-report.json", "utf8")
  );
  const projectId = report.projectId;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");
  const { initializeDb } = await import("../src/db");
  const { fileRecords, fileChunks } = await import("../src/db/schema");
  const db = await initializeDb(databaseUrl);
  const failures = report.results.filter((r) => !r.passed);

  const verdicts: Record<string, number> = {};
  const rows: string[] = [];
  const isRefusal = (s?: string) =>
    /cannot|could not|not contain|does not (contain|appear)|no (indexed|relevant|evidence)|unable/i.test(
      s ?? ""
    );
  // Cross-tab: what is actually broken among VALID-TRUTH failures?
  const xtab = {
    retrievalMiss: 0, // valid truth, expected file NOT in top-3
    generationRefusal: 0, // valid truth, file retrieved, but refused
    generationOther: 0, // valid truth, file retrieved, answered but ungrounded
    badQuestion: 0, // topic not in source / missing
  };

  for (const f of failures) {
    const parsed = parseQuery(f.query);
    if (!parsed) {
      verdicts.unparseable = (verdicts.unparseable ?? 0) + 1;
      rows.push(`UNPARSEABLE | ${f.query}`);
      continue;
    }
    const needle = fileNeedle(parsed.file);
    const files = await db
      .select({
        id: fileRecords.id,
        fileName: fileRecords.fileName,
        chunkCount: fileRecords.chunkCount,
      })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, projectId), ilike(fileRecords.fileName, `%${needle}%`)))
      .limit(5);

    if (files.length === 0) {
      verdicts.missingSource = (verdicts.missingSource ?? 0) + 1;
      xtab.badQuestion += 1;
      rows.push(`NO-FILE       | needle="${needle}" | ${f.query.slice(0, 70)}`);
      continue;
    }
    // Prefer an indexed match.
    const best = files.sort((a, b) => (b.chunkCount ?? 0) - (a.chunkCount ?? 0))[0];
    if ((best.chunkCount ?? 0) === 0) {
      verdicts.unindexedSource = (verdicts.unindexedSource ?? 0) + 1;
      xtab.badQuestion += 1;
      rows.push(`UNINDEXED     | ${best.fileName.slice(0, 50)} (0 chunks) | ${parsed.file}`);
      continue;
    }

    // Answerable-from-a-passage test: does any SINGLE chunk contain ALL topic
    // terms? (terms merely scattered across the file = not a coherent answer).
    // Check across ALL same-needle files, since identifiers can collide.
    const allFiles = files.filter((x) => (x.chunkCount ?? 0) > 0);
    const topicsLc = parsed.topics.map((t) => t.toLowerCase());
    let coLocated = false;
    let scatteredAll = false;
    for (const cand of allFiles) {
      const chunks = await db
        .select({ chunkText: fileChunks.chunkText })
        .from(fileChunks)
        .where(eq(fileChunks.fileId, cand.id));
      const lows = chunks.map((c) => c.chunkText.toLowerCase());
      if (lows.some((tx) => topicsLc.every((t) => tx.includes(t)))) {
        coLocated = true;
        break;
      }
      const blob = lows.join("\n");
      if (topicsLc.every((t) => blob.includes(t))) scatteredAll = true;
    }
    const topicHits = topicsLc;
    const anyTopic = coLocated;

    if (!coLocated && scatteredAll) {
      verdicts.scatteredTruth = (verdicts.scatteredTruth ?? 0) + 1;
      xtab.badQuestion += 1;
      rows.push(
        `SCATTERED     | ${best.fileName.slice(0, 45)} terms[${parsed.topics.join("/")}] in file but never same chunk | ${parsed.template}`
      );
      continue;
    }

    if (anyTopic) {
      verdicts.validTruth = (verdicts.validTruth ?? 0) + 1;
      let broke: string;
      if (!f.sourceFileHit) {
        xtab.retrievalMiss += 1;
        broke = "RETRIEVAL-MISS";
      } else if (isRefusal(f.answerSnippet)) {
        xtab.generationRefusal += 1;
        broke = "GEN-REFUSAL";
      } else {
        xtab.generationOther += 1;
        broke = "GEN-UNGROUNDED";
      }
      rows.push(
        `VALID-TRUTH/${broke.padEnd(14)} | ${best.fileName.slice(0, 42)} (${best.chunkCount} ch) topic[${topicHits.join(",")}] | ${parsed.template}`
      );
    } else {
      verdicts.topicNotInSource = (verdicts.topicNotInSource ?? 0) + 1;
      xtab.badQuestion += 1;
      rows.push(
        `TOPIC-ABSENT  | ${best.fileName.slice(0, 45)} (${best.chunkCount} ch) topic="${parsed.topics.join("/")}" not in chunks | ${parsed.template}`
      );
    }
  }

  console.log("\n================ WHAT IS ACTUALLY BROKEN (n=" + failures.length + ") ================");
  console.log("  RETRIEVAL-MISS (valid truth, file not in top-3):  ", xtab.retrievalMiss);
  console.log("  GEN-REFUSAL    (valid truth, retrieved, refused): ", xtab.generationRefusal);
  console.log("  GEN-UNGROUNDED (valid truth, retrieved, weak ans):", xtab.generationOther);
  console.log("  BAD-QUESTION   (topic absent / no source):        ", xtab.badQuestion);

  console.log("\n================ GROUND-TRUTH VERDICTS (failures) ================");
  console.log("total failures:", failures.length);
  for (const [k, v] of Object.entries(verdicts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(18)} ${v}`);
  }
  console.log("\n---- legend ----");
  console.log("VALID-TRUTH    file exists, indexed, topic present  -> real retrieval/answer failure");
  console.log("TOPIC-ABSENT   file exists+indexed but topic not in chunks -> questionable question");
  console.log("UNINDEXED      file exists but 0 chunks              -> cannot answer; bad test target");
  console.log("NO-FILE        no file matches the named source      -> broken ground truth");
  console.log("\n================ PER-FAILURE ================");
  rows.forEach((r) => console.log(r));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
