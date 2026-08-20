/**
 * bind-project-drive.ts
 * Bind a project to a specific Graph driveId + folderId.
 *
 * Usage:
 *   pnpm tsx ./scripts/bind-project-drive.ts -- --project-id 145b3dcf-272e-4c45-9e19-953f20f25bb9 --drive-id 78BEF1F85B43E5D5 --folder-id "78BEF1F85B43E5D5!s977a63e28a1d46a28b415a8a0a20ae0d"
 *   pnpm tsx ./scripts/bind-project-drive.ts -- ... --connected-by-email georgegao1997@gmail.com
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { eq, ilike } from "drizzle-orm";
import { initializeDb, onedriveConnections, projects, users } from "../src/db/index.js";
import { getEnv } from "../src/config/env.js";

function parseArgs(argv: string[]): {
  projectId?: string;
  driveId?: string;
  folderId?: string;
  connectedByEmail?: string;
} {
  const r: {
    projectId?: string;
    driveId?: string;
    folderId?: string;
    connectedByEmail?: string;
  } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project-id" && argv[i + 1]) { r.projectId = argv[i + 1]; i++; }
    else if (argv[i] === "--drive-id" && argv[i + 1]) { r.driveId = argv[i + 1]; i++; }
    else if (argv[i] === "--folder-id" && argv[i + 1]) { r.folderId = argv[i + 1]; i++; }
    else if (argv[i] === "--connected-by-email" && argv[i + 1]) {
      r.connectedByEmail = argv[i + 1].toLowerCase().trim();
      i++;
    }
  }
  return r;
}

async function resolveConnectedByUserId(
  db: Awaited<ReturnType<typeof initializeDb>>,
  driveId: string,
  email?: string
): Promise<string | undefined> {
  if (email) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(ilike(users.email, email))
      .limit(1);
    return user?.id;
  }

  const [connection] = await db
    .select({ userId: onedriveConnections.userId })
    .from(onedriveConnections)
    .where(eq(onedriveConnections.driveId, driveId))
    .limit(1);
  return connection?.userId;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.projectId || !args.driveId || !args.folderId) {
    console.error(
      "Usage: pnpm tsx ./scripts/bind-project-drive.ts -- --project-id <uuid> --drive-id <id> --folder-id <id> [--connected-by-email <email>]"
    );
    process.exit(1);
  }

  const env = getEnv();
  const db = await initializeDb(env.databaseUrl!);
  const connectedByUserId = await resolveConnectedByUserId(db, args.driveId, args.connectedByEmail);

  const [updated] = await db
    .update(projects)
    .set({
      onedriveDriveId: args.driveId,
      onedriveFolderId: args.folderId,
      ...(connectedByUserId ? { onedriveConnectedByUserId: connectedByUserId } : {}),
    })
    .where(eq(projects.id, args.projectId))
    .returning({
      id: projects.id,
      name: projects.name,
      onedriveDriveId: projects.onedriveDriveId,
      onedriveFolderId: projects.onedriveFolderId,
      onedriveConnectedByUserId: projects.onedriveConnectedByUserId,
    });

  if (!updated) {
    console.error(`Project ${args.projectId} not found`);
    process.exit(1);
  }

  console.log("Project drive binding updated:");
  console.log(JSON.stringify(updated, null, 2));
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
