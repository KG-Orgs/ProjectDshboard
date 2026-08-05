/**
 * discover-onedrive-folder.ts
 *
 * Discovers the Graph driveId + itemId for a named OneDrive folder using
 * the owner's stored refresh token from the database.
 *
 * Usage:
 *   pnpm discover:onedrive-folder -- --name "MLJ-017 Package 6 - General"
 *   pnpm discover:onedrive-folder -- --name "MLJ-017" --email georgegao1997@gmail.com
 *
 * Output: prints driveId and itemId(s) for matching folders, plus a direct
 * GET probe of the known hardcoded IDs as a sanity check.
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { eq, ilike } from "drizzle-orm";
import { initializeDb, onedriveConnections } from "../src/db/index.js";
import { refreshAccessToken } from "../src/auth/oauth.js";
import { getEnv } from "../src/config/env.js";

function parseArgs(argv: string[]): { name?: string; email?: string } {
  const result: { name?: string; email?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--name" && argv[i + 1]) {
      result.name = argv[i + 1];
      i++;
    } else if (argv[i] === "--email" && argv[i + 1]) {
      result.email = argv[i + 1].toLowerCase().trim();
      i++;
    }
  }
  return result;
}

interface DriveItem {
  id: string;
  name: string;
  webUrl?: string;
  parentReference?: { driveId?: string; path?: string };
  folder?: Record<string, unknown>;
  remoteItem?: {
    id: string;
    name: string;
    parentReference?: { driveId?: string };
    webUrl?: string;
  };
}

async function searchFoldersByName(
  graphBase: string,
  accessToken: string,
  name: string
): Promise<DriveItem[]> {
  const url =
    `${graphBase}/me/drive/root/search(q='${encodeURIComponent(name)}')?` +
    "$select=id,name,webUrl,parentReference,folder,remoteItem&$top=50";

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Graph search failed (${resp.status}): ${body}`);
  }
  const data = (await resp.json()) as { value?: DriveItem[] };
  return (data.value ?? []).filter(
    (item) => item.folder !== undefined || item.remoteItem !== undefined
  );
}

async function probeItem(
  graphBase: string,
  accessToken: string,
  driveId: string,
  itemId: string
): Promise<{ status: number; name?: string; webUrl?: string }> {
  const url = `${graphBase}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}?$select=id,name,webUrl`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!resp.ok) return { status: resp.status };
  const data = (await resp.json()) as { name?: string; webUrl?: string };
  return { status: 200, name: data.name, webUrl: data.webUrl };
}

async function getOwnDriveId(
  graphBase: string,
  accessToken: string
): Promise<string | undefined> {
  const resp = await fetch(`${graphBase}/me/drive?$select=id`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!resp.ok) return undefined;
  const data = (await resp.json()) as { id?: string };
  return data.id;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.name) {
    console.error("Usage: pnpm discover:onedrive-folder -- --name <folder-name>");
    process.exit(1);
  }

  const env = getEnv();
  const graphBase = env.onedriveApiEndpoint.replace(/\/$/, "");

  const db = await initializeDb(env.databaseUrl ?? "");

  // Load connection — by email if supplied, otherwise the first available.
  let connectionRow:
    | { refreshToken: string; accountEmail: string | null; driveId: string }
    | undefined;

  if (args.email) {
    const rows = await db
      .select({
        refreshToken: onedriveConnections.refreshToken,
        accountEmail: onedriveConnections.accountEmail,
        driveId: onedriveConnections.driveId,
      })
      .from(onedriveConnections)
      .where(ilike(onedriveConnections.accountEmail, args.email))
      .limit(1);
    connectionRow = rows[0];
  } else {
    const rows = await db
      .select({
        refreshToken: onedriveConnections.refreshToken,
        accountEmail: onedriveConnections.accountEmail,
        driveId: onedriveConnections.driveId,
      })
      .from(onedriveConnections)
      .limit(1);
    connectionRow = rows[0];
  }

  if (!connectionRow) {
    console.error(
      args.email
        ? `No OneDrive connection found for ${args.email}. Run the app and connect OneDrive first.`
        : "No OneDrive connections found in the database."
    );
    process.exit(1);
  }

  console.log(`\nUsing connection: ${connectionRow.accountEmail ?? "(unknown)"}`);

  // Refresh the access token.
  let tokenSet: Awaited<ReturnType<typeof refreshAccessToken>>;
  try {
    tokenSet = await refreshAccessToken(connectionRow.refreshToken, ["offline_access", "Files.Read"]);
  } catch (err) {
    console.error("Failed to refresh access token:", err);
    process.exit(1);
  }

  const { accessToken } = tokenSet;

  // Resolve own driveId to cross-reference.
  const ownDriveId = await getOwnDriveId(graphBase, accessToken);
  console.log(`Own driveId from /me/drive: ${ownDriveId ?? "(not found)"}`);

  // --- Search for the named folder ---
  console.log(`\nSearching for folders matching: "${args.name}" ...`);
  const results = await searchFoldersByName(graphBase, accessToken, args.name);

  if (results.length === 0) {
    console.log("No matching folders found in /me/drive search.");
  } else {
    console.log(`\nFound ${results.length} result(s):\n`);
    for (const item of results) {
      const effectiveDriveId =
        item.remoteItem?.parentReference?.driveId ??
        item.parentReference?.driveId ??
        ownDriveId ??
        "(unknown)";
      const effectiveItemId = item.remoteItem?.id ?? item.id;
      const isRemote = Boolean(item.remoteItem);

      console.log(`  Name   : ${item.name}`);
      console.log(`  Type   : ${isRemote ? "remoteItem (shared from another drive)" : "local folder"}`);
      console.log(`  driveId: ${effectiveDriveId}`);
      console.log(`  itemId : ${effectiveItemId}`);
      console.log(`  webUrl : ${item.remoteItem?.webUrl ?? item.webUrl ?? "(none)"}`);
      console.log(`  Path   : ${item.parentReference?.path ?? "(none)"}`);
      console.log();
    }
  }

  // --- Probe the hardcoded known IDs ---
  const KNOWN_DRIVE_ID = "78BEF1F85B43E5D5";
  const KNOWN_FOLDER_ID = "78BEF1F85B43E5D5!s977a63e28a1d46a28b415a8a0a20ae0d";

  console.log("--- Probing known hardcoded IDs ---");
  console.log(`  driveId : ${KNOWN_DRIVE_ID}`);
  console.log(`  folderId: ${KNOWN_FOLDER_ID}`);

  const probe = await probeItem(graphBase, accessToken, KNOWN_DRIVE_ID, KNOWN_FOLDER_ID);
  if (probe.status === 200) {
    console.log(`  Result  : 200 OK — name="${probe.name}" webUrl="${probe.webUrl}"`);
    console.log("\n  IDs are valid. Use these to bind the project:");
    console.log(`    driveId : ${KNOWN_DRIVE_ID}`);
    console.log(`    folderId: ${KNOWN_FOLDER_ID}`);
  } else {
    console.log(`  Result  : HTTP ${probe.status} — item not accessible with this token`);
    if (probe.status === 404) {
      console.log("  Possible causes:");
      console.log("    1. The folder has been deleted or moved.");
      console.log("    2. The IDs belong to a different user's drive — use the search results above.");
      console.log("    3. Personal OneDrive IDs are case-sensitive — verify exact casing.");
    }
  }

  console.log();
  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
