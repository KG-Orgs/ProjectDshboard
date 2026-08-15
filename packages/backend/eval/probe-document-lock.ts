/**
 * Run the document identity resolver against the real project index for a set of
 * questions and print the lock decision — status, chosen file, identity score,
 * matched/conflicting fields, and the runners-up that were rejected.
 *
 * This is the resolver in isolation: no retrieval, no LLM. Use it to see *why* a
 * question locks (or does not) before spending a full traced eval run.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/probe-document-lock.ts                 # the built-in set
 *   pnpm tsx ./eval/probe-document-lock.ts "In the ..., what ...?"
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import type { UUID } from "@contractor/shared";
import { initializeDb } from "../src/db";
import { getEnv } from "../src/config/env";
import { documentIdentityService } from "../src/services/document-identity.service";
import { extractDocumentReference } from "../src/services/document-identity.utils";

const PROJECT_ID = "145b3dcf-272e-4c45-9e19-953f20f25bb9" as UUID;

const DEFAULT_QUESTIONS: Array<{ id: string; query: string }> = [
  {
    id: "sq60",
    query:
      "In the May 13, 2025 Burnside Avenue VECP Presentation, what cost savings or schedule benefits are claimed for the value engineering change proposal?",
  },
  {
    id: "sq61",
    query:
      "In the Burnside Avenue VECP Presentation, which design disciplines are affected by the proposed value engineering changes?",
  },
  {
    id: "sq69",
    query: "In A37806 RFI096, what question is being asked of the design team and what is the RFI status?",
  },
  {
    id: "sq01",
    query:
      "In GEN-042R00, what action items were recorded, who are they assigned to, and when is the next coordination meeting scheduled?",
  },
  {
    id: "nl-minutes",
    query:
      "In the September 3, 2025 A37806 & C49321R Coordination Meeting Minutes, what action items were recorded?",
  },
  {
    id: "nl-photos",
    query:
      "In the Myrtle December 2025 Construction Photos, on what dates were the photos taken and what site conditions are shown?",
  },
  {
    id: "sq56",
    query:
      "In BUR-080R00 Burnside December 2025 Construction Photos, on what dates were the photos taken and what site conditions are shown?",
  },
  {
    id: "sq23",
    query:
      "In BUR-001R00 Burnside Avenue Staircase Enclosure Shop Drawings, what structural steel members and connection details are shown for the staircase enclosure?",
  },
  {
    id: "sq100",
    query:
      "In the PRDC12-012R02 Lead Placard Package for Burnside, what air monitoring and worker protection requirements apply to the lead abatement work?",
  },
  {
    id: "wrong-revision",
    query: "In GEN-042R01, what action items were recorded?",
  },
];

async function main(): Promise<void> {
  const argQueries = process.argv.slice(2);
  const questions =
    argQueries.length > 0
      ? argQueries.map((query, index) => ({ id: `arg${index + 1}`, query }))
      : DEFAULT_QUESTIONS;

  const env = getEnv();
  if (!env.databaseUrl) throw new Error("DATABASE_URL is missing");
  await initializeDb(env.databaseUrl);

  // The resolver emits its trace events through the logger (console.log); mute
  // them so the summary below is readable, and print the structured summary.
  const originalLog = console.log;
  console.log = () => {};

  const lines: string[] = [];
  for (const { id, query } of questions) {
    const reference = extractDocumentReference(query);
    const lock = await documentIdentityService.resolveDocumentLock({
      projectId: PROJECT_ID,
      question: query,
      ...(reference ? { reference } : {}),
    });

    lines.push("");
    lines.push(`──────── ${id} ────────`);
    lines.push(`Q            ${query}`);
    lines.push(`reference    ${reference ?? "(none isolated)"}`);
    lines.push(
      `requested    ids=[${lock.requested.explicitIdentifiers.join(", ")}] type=${lock.requested.documentType ?? "-"} station=${lock.requested.station ?? "-"} date=${lock.requested.date ?? lock.requested.dateRange?.start?.slice(0, 7) ?? "-"} rev=${lock.requested.revision ?? "-"} contract=${lock.requested.contract ?? "-"} title=[${lock.requested.titleTerms.join(", ")}]`
    );
    lines.push(`STATUS       ${lock.status.toUpperCase()}  confidence=${lock.confidence}`);
    if (lock.fileName) lines.push(`locked file  ${lock.fileName}`);
    lines.push(`matched      ${lock.matchedFields.join(", ") || "-"}`);
    lines.push(`conflicting  ${lock.conflictingFields.join(", ") || "-"}`);
    lines.push(`reason       ${lock.reason}`);
    for (const candidate of lock.candidateFiles ?? []) {
      lines.push(
        `  [${candidate.decision.padEnd(19)}] ${String(candidate.identityScore).padStart(3)} | ${candidate.chunkCount ?? 0} chunks | ${candidate.fileName}`
      );
      lines.push(`      matched=${candidate.matchedFields.join(",") || "-"}`);
      lines.push(`      conflict=${candidate.conflictingFields.join(",") || "-"}`);
    }
  }

  console.log = originalLog;
  console.log(lines.join("\n"));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
