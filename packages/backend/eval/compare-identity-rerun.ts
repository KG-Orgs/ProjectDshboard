/**
 * Old-vs-new document-resolution comparison for the document identity resolver.
 *
 * Reads the baseline traced run (`mlj017-97-traced-run.jsonl`) and a rerun JSONL,
 * and prints, per question: the document each run selected, the identity decision
 * the resolver made (status, score, matched/conflicting fields), and the resulting
 * answer status.
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./eval/compare-identity-rerun.ts [new.jsonl] [old.jsonl]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

interface LogEvent {
  event: string;
  meta: Record<string, unknown>;
}

interface Row {
  kind?: string;
  id?: string;
  query?: string;
  error?: string;
  answer?: { status?: string } | null;
  sources?: Array<{ fileName?: string }>;
  events?: LogEvent[];
}

function readRows(file: string): Map<string, Row> {
  const rows = new Map<string, Row>();
  if (!fs.existsSync(file)) return rows;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as Row;
      if (row.kind === "result" && row.id) rows.set(row.id, row);
    } catch {
      // partially written trailing line
    }
  }
  return rows;
}

const statusOf = (row?: Row): string =>
  row?.error ? "error" : (row?.answer?.status ?? "deterministic");

const docsOf = (row?: Row): string =>
  (row?.sources ?? []).map((source) => source.fileName ?? "?").join(" | ") || "(none)";

function identityDecision(row?: Row): string {
  const events = row?.events ?? [];
  const locked = events.find((event) => event.event === "document_identity.locked");
  const ambiguous = events.find((event) => event.event === "document_identity.ambiguous");
  const rejected = events.find((event) => event.event === "document_identity.rejected");
  const chosen = locked ?? ambiguous ?? rejected;
  if (!chosen) return "(resolver not consulted on this route)";

  const status = chosen.event.replace("document_identity.", "");
  const parts = [status.toUpperCase()];
  if (typeof chosen.meta.fileName === "string") parts.push(`file=${chosen.meta.fileName}`);
  if (chosen.meta.identityScore !== undefined) parts.push(`score=${chosen.meta.identityScore}`);
  if (Array.isArray(chosen.meta.matchedFields) && chosen.meta.matchedFields.length > 0) {
    parts.push(`matched=${(chosen.meta.matchedFields as string[]).join(",")}`);
  }
  if (Array.isArray(chosen.meta.conflictingFields) && chosen.meta.conflictingFields.length > 0) {
    parts.push(`conflict=${(chosen.meta.conflictingFields as string[]).join(",")}`);
  }
  if (typeof chosen.meta.reason === "string") parts.push(`reason=${chosen.meta.reason}`);
  return parts.join(" · ");
}

function guardVerdict(row?: Row): string {
  const event = (row?.events ?? []).find((e) => e.event.includes("source_identity"));
  if (!event) return "-";
  const valid = event.meta.valid ?? (event.meta.verdict as { valid?: unknown } | undefined)?.valid;
  const reason = event.meta.reason ?? (event.meta.verdict as { reason?: unknown } | undefined)?.reason;
  return `valid=${String(valid)}${reason ? ` (${String(reason)})` : ""}`;
}

function main(): void {
  const [newArg, oldArg] = process.argv.slice(2);
  const newPath = path.resolve(scriptDir, newArg ?? "./identity-resolver-rerun.jsonl");
  const oldPath = path.resolve(scriptDir, oldArg ?? "./mlj017-97-traced-run.jsonl");

  const next = readRows(newPath);
  const prev = readRows(oldPath);

  const lines: string[] = [];
  for (const [id, row] of next) {
    const before = prev.get(id);
    lines.push("");
    lines.push(`════════ ${id} ════════`);
    lines.push(`Q                 ${row.query ?? ""}`);
    lines.push(`old document      ${docsOf(before)}`);
    lines.push(`new document      ${docsOf(row)}`);
    lines.push(`identity decision ${identityDecision(row)}`);
    lines.push(`identity guard    ${guardVerdict(row)}`);
    lines.push(`answer status     ${statusOf(before)}  ->  ${statusOf(row)}`);
  }

  // Compact summary table.
  lines.push("");
  lines.push("════════ summary ════════");
  lines.push(
    `| id | doc changed | old status | new status |`
  );
  lines.push("| --- | --- | --- | --- |");
  for (const [id, row] of next) {
    const before = prev.get(id);
    const changed = docsOf(before) !== docsOf(row) ? "yes" : "no";
    lines.push(`| ${id} | ${changed} | ${statusOf(before)} | ${statusOf(row)} |`);
  }

  console.log(lines.join("\n"));
}

main();
