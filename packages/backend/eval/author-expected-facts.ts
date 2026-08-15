/**
 * Draft benchmark reference facts for the independent grader.
 *
 * The grader is only as good as its reference side, and hand-authoring expected
 * facts for a hundred questions against a hundred documents is the slow part.
 * This tool does the mechanical half: for each question it resolves the expected
 * document, dumps that document's **entire** indexed text in page order, and
 * asks a model to state what the document says about the question.
 *
 * The whole document is used deliberately. Retrieval, ranking, the identity
 * guard, the extractor, and the formatter are all bypassed, so a draft produced
 * here cannot inherit a retrieval or synthesis bug from the pipeline it will be
 * used to grade.
 *
 * Two limits are worth knowing before trusting a draft:
 *
 * 1. It reads the *text layer*. A fact that exists only as a mark, a dimension,
 *    or a photograph on the page is invisible here, so a draft that says the
 *    fact is absent proves nothing for a visual question. Those entries are
 *    written with `answerAvailable: true` and left for human review.
 * 2. Drafts land as `groundTruth: "draft"`. Reports count them, and separate
 *    them from human-verified rows, so a headline number is never quietly
 *    resting on machine-generated ground truth. Promote to `"verified"` by hand
 *    once the facts have been checked against the source document.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/author-expected-facts.ts --ids sq26,sq27
 *   pnpm tsx ./eval/author-expected-facts.ts --missing-only --limit 20
 *   pnpm tsx ./eval/author-expected-facts.ts --dry-run --ids sq26
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb, initializeDb } from "../src/db";
import { documentIdentifiers, fileChunks, fileRecords } from "../src/db/schema";
import { getEnv } from "../src/config/env";
import { callChatLlm, extractFirstJsonObject } from "../src/services/llm-client";
import type { ExpectationFile, ExpectedFact, QuestionExpectation } from "./eval-expectations";

config({ path: "../../.env" });

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");

/** Cap on the document text handed to the drafting model, in characters. */
const MAX_DOCUMENT_CHARS = 120_000;

function resolvePath(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(backendRoot, value));
}

function parseArgs(argv: string[]) {
  let expectedPath = "./eval/mlj017-97-expected.json";
  let ids: Set<string> | undefined;
  let limit: number | undefined;
  let missingOnly = false;
  let dryRun = false;
  let redraft = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--expected" && next) (expectedPath = next), (i += 1);
    else if (arg === "--ids" && next) {
      ids = new Set(next.split(",").map((v) => v.trim()).filter(Boolean));
      i += 1;
    } else if (arg === "--limit" && next) {
      limit = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--missing-only") missingOnly = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--redraft") redraft = true;
  }

  return { expectedPath: resolvePath(expectedPath), ids, limit, missingOnly, dryRun, redraft };
}

interface ResolvedDocument {
  fileId: string;
  fileName: string;
  text: string;
  pageCount: number;
  chunkCount: number;
  truncated: boolean;
  /** How many files carried the pinned identifier before one was chosen. */
  candidateCount: number;
  /** The other file names that carried it, for the reviewer's benefit. */
  rejectedCandidates: string[];
}

interface DocumentCandidate {
  fileId: string;
  fileName: string;
}

/**
 * Pick which of several same-identifier files the question is actually about.
 *
 * Identifiers are not unique in this corpus: eleven files carry `GEN-001R05`
 * (a Quality Management Plan, a Phasing Plan, and a fire-alarm submittal among
 * them) and sixteen carry `RFI-096`. Drafting from the wrong one produces
 * reference facts that would fail a correct answer, so the choice is made
 * explicitly and recorded rather than left to "first row wins".
 *
 * Falls back to the first candidate when the model is unavailable; the caller
 * records the ambiguity either way.
 */
async function selectCandidate(
  query: string,
  candidates: DocumentCandidate[]
): Promise<DocumentCandidate> {
  if (candidates.length === 1) return candidates[0];

  const numbered = candidates.map((candidate, index) => `${index + 1}. ${candidate.fileName}`).join("\n");
  const completion = await callChatLlm(
    [
      {
        role: "system",
        content: [
          "Several files in a construction project carry the same document identifier.",
          "Given a question, choose which file the question is about.",
          "",
          "Ranked signals:",
          "1. The descriptive title in the file name against the words the question uses. Questions usually name the document they mean (\"Ave I North Foundation Rebar Shop Drawings\", \"Phasing Plan\", \"Coordination Meeting\") — match that first, ahead of everything else.",
          "2. The CSI section number in the file name (01 10 30 = phasing, 01 30 20 = project meetings, 01 40 10 = quality requirements, 03 20 00 = concrete reinforcing, 14 24 00 = elevators).",
          "3. The revision suffix (R00, R02) when the question pins one.",
          "",
          'Return strict JSON only: {"choice": <1-based number>, "reason": "..."}',
        ].join("\n"),
      },
      { role: "user", content: `QUESTION:\n${query}\n\nCANDIDATE FILES:\n${numbered}` },
    ],
    { temperature: 0, maxTokens: 300, timeoutMs: 60_000 }
  );

  const jsonText = completion ? extractFirstJsonObject(completion) : null;
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText) as { choice?: unknown };
      const choice = typeof parsed.choice === "number" ? parsed.choice : Number.NaN;
      if (Number.isInteger(choice) && choice >= 1 && choice <= candidates.length) {
        return candidates[choice - 1];
      }
    } catch {
      // fall through to the first candidate
    }
  }
  return candidates[0];
}

/**
 * Candidate `document_identifiers.value_normalized` keys for an identifier.
 *
 * The indexer normalises differently per identifier type — some types collapse
 * leading zeros (`QWP-005` → `QWP5`), others keep them (`MTACD-MLJTC2-L-0024` →
 * `MTACDMLJTC2L0024`). Rather than reimplement that table, both forms are tried;
 * a file-name match is the final fallback.
 */
function identifierLookupKeys(identifier: string): string[] {
  const runs = identifier.toUpperCase().match(/[A-Z]+|\d+/g) ?? [];
  const keepZeros = runs.join("");
  const stripZeros = runs.map((run) => (/^\d+$/.test(run) ? String(Number.parseInt(run, 10)) : run)).join("");
  return [...new Set([keepZeros, stripZeros])].filter((key) => key.length > 0);
}

/**
 * Find the document the benchmark pins.
 *
 * A file-name pattern is the tighter pin, so it is tried first; the identifier is
 * the fallback and its candidates are disambiguated against the question. Returns
 * null when nothing matches — a question whose expected document is not in the
 * index cannot get a text-layer draft.
 */
async function resolveDocument(
  projectId: string,
  expectation: QuestionExpectation
): Promise<ResolvedDocument | null> {
  const db = getDb();
  const identifier = expectation.expectedDocument?.identifier ?? null;
  const patterns = expectation.expectedDocument?.fileNamePatterns ?? [];

  let candidates: DocumentCandidate[] = [];

  for (const pattern of patterns) {
    const rows = await db
      .select({ fileId: fileRecords.id, fileName: fileRecords.fileName })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, projectId), ilike(fileRecords.fileName, `%${pattern}%`)))
      .orderBy(sql`length(${fileRecords.fileName}) asc`)
      .limit(10);
    candidates.push(...rows);
    if (candidates.length > 0) break;
  }

  if (candidates.length === 0 && identifier) {
    const rows = await db
      .select({ fileId: documentIdentifiers.fileId, fileName: fileRecords.fileName })
      .from(documentIdentifiers)
      .innerJoin(fileRecords, eq(fileRecords.id, documentIdentifiers.fileId))
      .where(
        and(
          eq(documentIdentifiers.projectId, projectId),
          or(
            inArray(documentIdentifiers.valueNormalized, identifierLookupKeys(identifier)),
            ilike(documentIdentifiers.raw, identifier)
          )
        )
      )
      .limit(20);
    candidates.push(...rows);
  }

  if (candidates.length === 0 && identifier) {
    const rows = await db
      .select({ fileId: fileRecords.id, fileName: fileRecords.fileName })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, projectId), ilike(fileRecords.fileName, `%${identifier}%`)))
      .orderBy(sql`length(${fileRecords.fileName}) asc`)
      .limit(10);
    candidates.push(...rows);
  }

  // The same document is often indexed several times (.pdf/.docx/.zip siblings,
  // duplicate records). Deduplicate by name so the choice below is meaningful.
  const seen = new Set<string>();
  candidates = candidates.filter((candidate) => {
    const key = candidate.fileName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (candidates.length === 0) return null;

  const chosen = await selectCandidate(expectation.query ?? "", candidates);
  const fileId = chosen.fileId;
  const fileName = chosen.fileName;
  const rejectedCandidates = candidates
    .filter((candidate) => candidate.fileId !== fileId)
    .map((candidate) => candidate.fileName);

  const chunks = await db
    .select({
      chunkIndex: fileChunks.chunkIndex,
      pageNumber: fileChunks.pageNumber,
      chunkText: fileChunks.chunkText,
    })
    .from(fileChunks)
    .where(and(eq(fileChunks.fileId, fileId), eq(fileChunks.sourceType, "content")))
    .orderBy(asc(fileChunks.chunkIndex));

  const pages = new Set<number>();
  const parts: string[] = [];
  let length = 0;
  let truncated = false;
  for (const chunk of chunks) {
    if (typeof chunk.pageNumber === "number") pages.add(chunk.pageNumber);
    const header = `\n--- chunk ${chunk.chunkIndex}${typeof chunk.pageNumber === "number" ? ` · page ${chunk.pageNumber}` : ""} ---\n`;
    const body = chunk.chunkText.trim();
    if (length + header.length + body.length > MAX_DOCUMENT_CHARS) {
      truncated = true;
      break;
    }
    parts.push(header, body);
    length += header.length + body.length;
  }

  return {
    fileId,
    fileName,
    text: parts.join(""),
    pageCount: pages.size,
    chunkCount: chunks.length,
    truncated,
    candidateCount: candidates.length,
    rejectedCandidates,
  };
}

const DRAFT_SYSTEM_PROMPT = [
  "You are building the reference answer key for a document-QA benchmark.",
  "",
  "You are given a question and the COMPLETE indexed text of the one document the question is about.",
  "State what this document actually says. You are not answering for a user and you are not grading anything.",
  "",
  "Rules:",
  "- Use only the supplied document text. Never infer, never fill gaps from general knowledge.",
  "- Break the question into the individual facts it requests. One entry per requested fact.",
  "- Give each fact a short snake_case key, a human label, and the accepted values as they appear in the document.",
  "- List every reasonable surface form of a value (e.g. \"$1,400\" and \"$1,400.00\"), because the answer under test may word it differently.",
  "- When a fact is a explanation or a decision rather than a value, give expectedMeaning instead of acceptedValues, and describe the substance without demanding exact wording.",
  '- Mark a fact essential:false only when it is genuinely cosmetic.',
  "- Record the page each fact is on, and a short verbatim quote, so a human can check your work.",
  "- If the document text does not contain a requested fact at all, set answerAvailable false and explain in notes.",
  "- If the document is clearly a drawing, photo log, or scan whose text layer looks empty or garbled, say so in notes and set textLayerAdequate false.",
  "",
  "Return strict JSON only, no prose and no code fences:",
  "{",
  '  "answerAvailable": true,',
  '  "textLayerAdequate": true,',
  '  "requiredFacts": [',
  "    {",
  '      "field": "unit_price",',
  '      "label": "unit price per pest control visit",',
  '      "essential": true,',
  '      "acceptedValues": ["$350", "$350.00"],',
  '      "expectedMeaning": "",',
  '      "page": 2,',
  '      "quote": "verbatim text from the document"',
  "    }",
  "  ],",
  '  "forbiddenClaims": [],',
  '  "notes": "anything a human reviewer should know"',
  "}",
].join("\n");

/** A drafted fact carries its page and quote so a reviewer can check it. */
type DraftedFact = ExpectedFact & { page?: number; quote?: string };

interface DraftedFacts {
  answerAvailable: boolean;
  textLayerAdequate: boolean;
  requiredFacts: DraftedFact[];
  forbiddenClaims: string[];
  notes: string;
}

function parseDraftedFact(entry: unknown): DraftedFact | null {
  if (!entry || typeof entry !== "object") return null;
  const obj = entry as Record<string, unknown>;
  const field = typeof obj.field === "string" ? obj.field.trim() : "";
  if (!field) return null;
  const acceptedValues = Array.isArray(obj.acceptedValues)
    ? (obj.acceptedValues as unknown[]).filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];
  const expectedMeaning = typeof obj.expectedMeaning === "string" ? obj.expectedMeaning.trim() : "";
  return {
    field,
    label: typeof obj.label === "string" && obj.label.trim() ? obj.label.trim() : field,
    essential: obj.essential !== false,
    ...(acceptedValues.length > 0 ? { acceptedValues } : {}),
    ...(expectedMeaning ? { expectedMeaning } : {}),
    ...(typeof obj.page === "number" ? { page: obj.page } : {}),
    ...(typeof obj.quote === "string" && obj.quote.trim() ? { quote: obj.quote.trim() } : {}),
  };
}

function parseDraft(raw: string): DraftedFacts | null {
  const jsonText = extractFirstJsonObject(raw);
  if (!jsonText) return null;
  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const facts = Array.isArray(parsed.requiredFacts) ? (parsed.requiredFacts as unknown[]) : [];
    return {
      answerAvailable: parsed.answerAvailable !== false,
      textLayerAdequate: parsed.textLayerAdequate !== false,
      requiredFacts: facts
        .map(parseDraftedFact)
        .filter((entry): entry is DraftedFact => entry !== null),
      forbiddenClaims: Array.isArray(parsed.forbiddenClaims)
        ? (parsed.forbiddenClaims as unknown[]).filter(
            (v): v is string => typeof v === "string" && v.trim().length > 0
          )
        : [],
      notes: typeof parsed.notes === "string" ? parsed.notes.trim() : "",
    };
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const file = JSON.parse(fs.readFileSync(args.expectedPath, "utf8")) as ExpectationFile;
  const projectId = file.projectId;
  if (!projectId) throw new Error(`${path.basename(args.expectedPath)} has no projectId`);

  const env = getEnv();
  if (!env.databaseUrl) throw new Error("DATABASE_URL is missing");
  await initializeDb(env.databaseUrl);

  let targets = file.questions;
  if (args.ids) targets = targets.filter((q) => args.ids!.has(q.id));
  if (args.missingOnly) targets = targets.filter((q) => q.groundTruth === "missing");
  if (args.limit !== undefined && !Number.isNaN(args.limit)) targets = targets.slice(0, args.limit);

  console.log(`[author] ${targets.length} question(s) to draft, project ${projectId}`);

  let drafted = 0;
  let skipped = 0;

  for (const [index, expectation] of targets.entries()) {
    const label = `[author] (${index + 1}/${targets.length}) ${expectation.id}`;
    if (expectation.groundTruth === "verified") {
      console.log(`${label} — skipped, already human-verified`);
      skipped += 1;
      continue;
    }
    // A question this tool has already looked at is not retried by default —
    // including one it parked as `missing`, which a rerun would only park again.
    if (!args.redraft && expectation.provenance?.startsWith("llm-draft")) {
      console.log(`${label} — skipped, already drafted (pass --redraft to redo it)`);
      skipped += 1;
      continue;
    }

    const document = await resolveDocument(projectId, expectation);
    if (!document) {
      console.log(
        `${label} — could not resolve the expected document (${expectation.expectedDocument?.identifier ?? expectation.expectedDocument?.fileNamePatterns?.join(", ") ?? "no pin"})`
      );
      skipped += 1;
      continue;
    }
    if (document.text.trim().length < 200) {
      console.log(
        `${label} — ${document.fileName}: text layer is ${document.text.trim().length} chars; too thin to draft from, needs human review`
      );
      skipped += 1;
      continue;
    }

    const completion = await callChatLlm(
      [
        { role: "system", content: DRAFT_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `QUESTION:\n${expectation.query ?? ""}`,
            "",
            `DOCUMENT: ${document.fileName} (${document.chunkCount} chunks, ${document.pageCount} pages${document.truncated ? ", truncated" : ""})`,
            "",
            "COMPLETE DOCUMENT TEXT:",
            document.text,
          ].join("\n"),
        },
      ],
      { temperature: 0, maxTokens: 2_500, timeoutMs: 120_000 }
    );

    const draft = completion ? parseDraft(completion) : null;
    if (!draft) {
      console.log(`${label} — drafting model returned no usable JSON`);
      skipped += 1;
      continue;
    }

    if (args.dryRun) {
      console.log(`${label} — ${document.fileName}\n${JSON.stringify(draft, null, 2)}`);
      drafted += 1;
      continue;
    }

    // A draft may never assert that a fact is absent.
    //
    // "Absent" is the one reference value that turns a pipeline refusal into a
    // PASS, and a text-layer draft has three ways to be wrong about it: it may
    // have been handed the wrong same-identifier sibling, the text layer may have
    // lost what the page shows, or the document may have been truncated. Any of
    // those would mint a reference that scores a real retrieval failure as
    // correct behaviour. So an absence claim parks the question as `missing`
    // (UNGRADED, excluded from the headline rates) with the reason recorded, and a
    // human decides.
    const claimsAbsent = !draft.answerAvailable || draft.requiredFacts.length === 0;

    const notes = [
      draft.notes,
      document.truncated ? `Document text was truncated at ${MAX_DOCUMENT_CHARS} chars when drafting.` : "",
      !draft.textLayerAdequate
        ? "Drafting model reported the text layer as inadequate — verify against the page images before trusting this entry."
        : "",
      document.candidateCount > 1
        ? `${document.candidateCount} files carry this identifier; drafted from "${document.fileName}". Others: ${document.rejectedCandidates.slice(0, 5).join("; ")}.`
        : "",
      claimsAbsent
        ? "The drafting pass found no answer in this document's text layer. Left UNGRADED: only a human may record a fact as genuinely absent, because a wrong sibling document, a lost text layer, or truncation would each look identical here."
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    expectation.groundTruth = claimsAbsent ? "missing" : "draft";
    expectation.provenance = `llm-draft-text-layer:${document.fileName}`;
    expectation.expected = {
      answerAvailable: true,
      requiredFacts: draft.requiredFacts.map(({ page: _page, quote: _quote, ...fact }) => fact),
      forbiddenClaims: draft.forbiddenClaims,
      notes,
    };
    // Recorded as provenance, never merged into `expectedDocument`. The pin gates
    // the wrong-document rule and must stay reviewed; this tool's choice among
    // same-identifier siblings is a guess, and a wrong guess written into the pin
    // would fail correct answers. `sq78` is the cautionary case: the question asks
    // about SWP-011, the pipeline answered from the Platform Concrete Demo copy the
    // question means, and this tool had read the Asbestos Abatement copy.
    expectation.draftedFromFile = document.fileName;
    expectation.expectedEvidence = draft.requiredFacts
      .filter((fact) => typeof fact.page === "number" || fact.quote)
      .map((fact) => ({
        fileNamePattern: document.fileName,
        ...(typeof fact.page === "number" ? { pages: [fact.page] } : {}),
        ...(fact.quote ? { quote: fact.quote } : {}),
      }));

    drafted += 1;
    console.log(
      `${label} — ${document.fileName}: ${draft.requiredFacts.length} fact(s)` +
        (claimsAbsent ? ", NO ANSWER FOUND — left ungraded for human review" : "") +
        (draft.textLayerAdequate ? "" : ", text layer flagged") +
        (document.candidateCount > 1 ? `, chosen from ${document.candidateCount} same-id files` : "")
    );
    // Written after every question so a long run never loses completed drafts.
    fs.writeFileSync(args.expectedPath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  }

  console.log(`[author] drafted ${drafted}, skipped ${skipped}`);
  if (!args.dryRun && drafted > 0) console.log(`[author] wrote ${args.expectedPath}`);
  console.log(`[author] review each draft and set groundTruth to "verified" once checked.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
