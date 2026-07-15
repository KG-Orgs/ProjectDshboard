/**
 * Backfill document_identifiers for all indexed files in a project.
 *
 * This is a cheap, read-only-from-PDFs operation: it reads file names and
 * paths already stored in file_records, runs the deterministic
 * extractIdentifiers() + extractPathMetadata() logic, and writes the
 * resulting rows into document_identifiers. It also patches file_records.revision
 * for any file whose revision was not captured by the content-regex classifier
 * (e.g. "GEN-096R04" → R04).
 *
 * No PDF re-extraction, no embeddings, no OpenAI calls.
 *
 * Usage (from packages/backend):
 *   pnpm backfill:identifiers -- --project-id <uuid>
 *   pnpm backfill:identifiers -- --all-projects
 *   pnpm backfill:identifiers -- --project-id <uuid> --dry-run
 */

import { config } from "dotenv";
import { and, eq, isNull } from "drizzle-orm";
import { initializeDb, documentIdentifiers, fileRecords, projects } from "../src/db";
import { getEnv } from "../src/config/env";
import {
  extractIdentifiers,
  extractPathMetadata,
} from "../src/services/identifier-extraction.utils";

const BATCH_SIZE = 500;

function parseArgs(argv: string[]): {
  projectId?: string;
  allProjects: boolean;
  dryRun: boolean;
} {
  const out = { projectId: undefined as string | undefined, allProjects: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project-id" && argv[i + 1]) {
      out.projectId = argv[++i];
    } else if (argv[i] === "--all-projects") {
      out.allProjects = true;
    } else if (argv[i] === "--dry-run") {
      out.dryRun = true;
    }
  }
  return out;
}

async function backfillProject(
  db: Awaited<ReturnType<typeof initializeDb>>,
  projectId: string,
  dryRun: boolean
): Promise<void> {
  console.log(`\n[${projectId}] Loading file records...`);

  // Load all files in batches to avoid a single huge query.
  let offset = 0;
  let totalFiles = 0;
  let totalIdentifiers = 0;
  let totalRevisionPatches = 0;

  while (true) {
    const rows = await db
      .select({
        id: fileRecords.id,
        fileName: fileRecords.fileName,
        filePath: fileRecords.filePath,
        revision: fileRecords.revision,
      })
      .from(fileRecords)
      .where(eq(fileRecords.projectId, projectId))
      .limit(BATCH_SIZE)
      .offset(offset);

    if (rows.length === 0) break;
    offset += rows.length;
    totalFiles += rows.length;

    for (const file of rows) {
      const identifiers = extractIdentifiers(file.fileName, file.filePath ?? undefined);
      totalIdentifiers += identifiers.length;

      if (!dryRun && identifiers.length > 0) {
        // Replace existing rows for this file atomically.
        await db.delete(documentIdentifiers).where(eq(documentIdentifiers.fileId, file.id));
        await db.insert(documentIdentifiers).values(
          identifiers.map((id) => ({
            fileId: file.id,
            projectId,
            type: id.type,
            valueNormalized: id.valueNormalized,
            raw: id.raw,
          }))
        );
      } else if (!dryRun) {
        // Still clear any stale rows even if no identifiers extracted.
        await db.delete(documentIdentifiers).where(eq(documentIdentifiers.fileId, file.id));
      }

      // Patch revision when the classifier left it null but path metadata has it.
      if (!file.revision) {
        const pathMeta = extractPathMetadata(file.fileName, file.filePath ?? "");
        if (pathMeta.revision) {
          totalRevisionPatches++;
          if (!dryRun) {
            await db
              .update(fileRecords)
              .set({ revision: pathMeta.revision })
              .where(eq(fileRecords.id, file.id));
          }
        }
      }
    }

    process.stdout.write(
      `  processed ${totalFiles} files, ${totalIdentifiers} identifiers so far...\r`
    );
  }

  console.log(
    `[${projectId}] Done. ${totalFiles} files → ${totalIdentifiers} identifiers written` +
      (totalRevisionPatches > 0 ? `, ${totalRevisionPatches} revision patches` : "") +
      (dryRun ? " (DRY RUN — nothing written)" : "")
  );
}

async function main(): Promise<void> {
  config({ path: "../../.env" });

  const env = getEnv();
  if (!env.databaseUrl) {
    console.error("DATABASE_URL is missing from .env");
    process.exit(1);
  }

  const { projectId, allProjects, dryRun } = parseArgs(process.argv.slice(2));

  if (!projectId && !allProjects) {
    console.error(
      "Usage: pnpm backfill:identifiers -- --project-id <uuid>\n" +
        "       pnpm backfill:identifiers -- --all-projects\n" +
        "       Add --dry-run to preview without writing."
    );
    process.exit(1);
  }

  if (dryRun) console.log("DRY RUN mode — no DB writes.");

  const db = await initializeDb(env.databaseUrl);

  const targetProjects = projectId
    ? [{ id: projectId }]
    : await db.select({ id: projects.id }).from(projects);

  for (const project of targetProjects) {
    await backfillProject(db, project.id, dryRun);
  }

  console.log("\nBackfill complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
