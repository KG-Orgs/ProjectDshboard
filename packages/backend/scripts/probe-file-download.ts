/**
 * Probe Graph file download for indexed local-corpus paths.
 *
 * Usage:
 *   pnpm tsx ./scripts/probe-file-download.ts -- --file-id <uuid>
 *   pnpm tsx ./scripts/probe-file-download.ts -- --file-id fcff623a-a420-48b2-aa96-8745eba1be1d
 */
import path from "node:path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), "../../.env") });

import { eq } from "drizzle-orm";
import { initializeDb, fileRecords, projects } from "../src/db/index.js";
import { getEnv } from "../src/config/env.js";
import { onedriveService } from "../src/services/onedrive.service.js";

function parseArgs(argv: string[]): { fileId?: string } {
  const r: { fileId?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file-id" && argv[i + 1]) {
      r.fileId = argv[i + 1];
      i++;
    }
  }
  return r;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.fileId) {
    console.error("Usage: pnpm tsx ./scripts/probe-file-download.ts -- --file-id <uuid>");
    process.exit(1);
  }

  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);

  const [file] = await db
    .select()
    .from(fileRecords)
    .where(eq(fileRecords.id, args.fileId))
    .limit(1);

  if (!file) {
    console.error(`File ${args.fileId} not found`);
    process.exit(1);
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, file.projectId))
    .limit(1);

  if (!project) {
    console.error(`Project ${file.projectId} not found`);
    process.exit(1);
  }

  console.log("File:", file.fileName);
  console.log("filePath:", file.filePath);
  console.log("onedriveItemId:", file.onedriveItemId);
  console.log("driveId:", project.onedriveDriveId);
  console.log("folderId:", project.onedriveFolderId);
  console.log("ownerUserId:", project.onedriveConnectedByUserId);
  console.log("");

  const content = await onedriveService.tryDownloadIndexedFileFromGraph(undefined, {
    driveId: project.onedriveDriveId,
    folderId: project.onedriveFolderId,
    filePath: file.filePath ?? "",
    projectOwnerUserId: project.onedriveConnectedByUserId,
    projectRootFolderName: project.name,
  });

  if (content) {
    console.log("SUCCESS");
    console.log("bytes:", content.buffer.length);
    console.log("contentType:", content.contentType);
    console.log("magic:", content.buffer.subarray(0, 8).toString("utf8"));
  } else {
    console.log("FAILED — tryDownloadIndexedFileFromGraph returned null");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
