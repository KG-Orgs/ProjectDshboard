/**
 * Keep the grader's benchmark file in step with the question set.
 *
 * Adds an expectation stub for every question id in a batch-input file that the
 * benchmark does not know about yet, and drops nothing: existing entries —
 * including hand-verified facts — are left exactly as they are. The stub records
 * the query text and a *candidate* document pin derived from identifiers written
 * in the question itself, which is the one part of the reference side that can be
 * derived mechanically. Reference facts still have to be authored (by hand, or
 * drafted with `author-expected-facts.ts`).
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/sync-expected-questions.ts
 *   pnpm tsx ./eval/sync-expected-questions.ts --file ./eval/mlj017-visual-questions.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExpectationFile, QuestionExpectation } from "./eval-expectations";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");

function resolvePath(value: string): string {
  const isAbsolute = value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value);
  return path.resolve(isAbsolute ? value : path.join(backendRoot, value));
}

/**
 * Construction identifiers as they are written in these questions:
 * `GEN-042R00`, `MTACD-MLJTC2-L-0024`, `RFI-0115`, `RFI096`, `PRDC12-019R00`,
 * `J-TRACK-13A-041R00`, `MYR-A-444A`, `212-NOR`.
 */
const IDENTIFIER_PATTERN =
  /\b(?:[A-Z]{2,}(?:-[A-Z0-9]+)*-\d{2,}[A-Z]?\d*|[A-Z]{2,3}\d{2,}(?:-\d+)?[A-Z]?\d*|[A-Z]{3,}-\d{3,}R\d{2}|\d{3}-[A-Z]{3})\b/g;

function candidateIdentifier(query: string): string | null {
  const matches = query.match(IDENTIFIER_PATTERN) ?? [];
  // The contract number A37806 prefixes most file names and pins nothing.
  const useful = matches.filter((match) => !/^A\d{5}$/.test(match));
  return useful[0] ?? null;
}

/** Hand-authored pins and flags, applied on top of what can be derived. */
interface PinFile {
  pins?: Record<string, { identifier?: string; fileNamePatterns?: string[] }>;
  unpinned?: { ids?: string[] };
  visualEvidenceExpected?: { ids?: string[] };
}

let batchPath = "./eval/mlj017-adjusted-v2-batch-input.json";
let expectedPath = "./eval/mlj017-97-expected.json";
let pinPath = "./eval/expected-document-pins.json";
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--file" && argv[i + 1]) (batchPath = argv[i + 1]), (i += 1);
  else if (argv[i] === "--expected" && argv[i + 1]) (expectedPath = argv[i + 1]), (i += 1);
  else if (argv[i] === "--pins" && argv[i + 1]) (pinPath = argv[i + 1]), (i += 1);
}
batchPath = resolvePath(batchPath);
expectedPath = resolvePath(expectedPath);
pinPath = resolvePath(pinPath);

const batch = JSON.parse(fs.readFileSync(batchPath, "utf8")) as {
  projectId?: string;
  questions: Array<{ id?: string; query: string; activeDocFileName?: string }>;
};

const file: ExpectationFile = fs.existsSync(expectedPath)
  ? (JSON.parse(fs.readFileSync(expectedPath, "utf8")) as ExpectationFile)
  : {
      projectId: batch.projectId,
      description: "Benchmark reference facts for the independent PASS/PARTIAL/FAIL grader.",
      questions: [],
    };

const known = new Set(file.questions.map((q) => q.id));
let added = 0;
let requeried = 0;

for (const question of batch.questions) {
  if (!question.id) continue;
  const existing = file.questions.find((q) => q.id === question.id);
  if (existing) {
    // The batch input is the authority on which document the question was asked
    // against, so its active document is re-asserted as a pin on every sync.
    if (question.activeDocFileName) {
      const document = existing.expectedDocument ?? {
        identifier: null,
        revision: null,
        fileNamePatterns: [],
      };
      document.fileNamePatterns = [
        ...new Set([...(document.fileNamePatterns ?? []), question.activeDocFileName]),
      ];
      existing.expectedDocument = document;
    }
    if (existing.query !== question.query) {
      // The question was reworded: the facts on file may no longer match it.
      existing.query = question.query;
      existing.expected.notes = [
        existing.expected.notes,
        "Question text changed after these facts were authored — re-verify.",
      ]
        .filter(Boolean)
        .join(" ");
      requeried += 1;
    }
    continue;
  }

  const identifier = candidateIdentifier(question.query);
  const stub: QuestionExpectation = {
    id: question.id,
    query: question.query,
    groundTruth: "missing",
    expected: { answerAvailable: true, requiredFacts: [], forbiddenClaims: [], notes: "" },
    expectedDocument: {
      identifier,
      revision: null,
      fileNamePatterns: question.activeDocFileName ? [question.activeDocFileName] : [],
    },
  };
  file.questions.push(stub);
  known.add(question.id);
  added += 1;
}

// Hand pins are applied to every entry, new or existing, because they are the
// reviewed answer to "which document should this question be answered from" —
// but only the pin is touched, never the reference facts.
const pinFile: PinFile = fs.existsSync(pinPath)
  ? (JSON.parse(fs.readFileSync(pinPath, "utf8")) as PinFile)
  : {};
const unpinned = new Set(pinFile.unpinned?.ids ?? []);
const visual = new Set(pinFile.visualEvidenceExpected?.ids ?? []);
let pinned = 0;

for (const question of file.questions) {
  const pin = pinFile.pins?.[question.id];
  if (pin) {
    const document = question.expectedDocument ?? { identifier: null, revision: null, fileNamePatterns: [] };
    if (pin.identifier) document.identifier = pin.identifier;
    if (pin.fileNamePatterns) {
      document.fileNamePatterns = [
        ...new Set([...(document.fileNamePatterns ?? []), ...pin.fileNamePatterns]),
      ];
    }
    question.expectedDocument = document;
    pinned += 1;
  }
  if (unpinned.has(question.id) && !question.expected.notes) {
    question.expected.notes =
      "The question names no document, so document fidelity is not checked for it.";
  }
  if (visual.has(question.id)) question.visualEvidenceExpected = true;
}

fs.writeFileSync(expectedPath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
console.log(
  `[sync] ${path.basename(expectedPath)}: ${file.questions.length} expectation(s) — added ${added}, re-queried ${requeried}, hand pins applied ${pinned}`
);
const stillUnpinned = file.questions.filter(
  (q) =>
    !unpinned.has(q.id) &&
    !q.expectedDocument?.identifier &&
    !(q.expectedDocument?.fileNamePatterns ?? []).length
);
if (stillUnpinned.length > 0) {
  console.log(
    `[sync] no document pin for: ${stillUnpinned.map((q) => q.id).join(", ")} — add one to ${path.basename(pinPath)} so wrong-document answers can be caught, or list the id under "unpinned" if the question names no document`
  );
}
const withoutFacts = file.questions.filter((q) => q.groundTruth === "missing");
if (withoutFacts.length > 0) {
  console.log(`[sync] ${withoutFacts.length} expectation(s) still have no reference facts (graded UNGRADED)`);
}
