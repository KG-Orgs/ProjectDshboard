/**
 * probe-graph-cross-user.ts
 *
 * Phase 0 validation: probe whether each user with a stored OneDrive refresh
 * token can access the owner's drive + folder via the /drives/{id}/... endpoint.
 *
 * Also checks /me/drive/sharedWithMe to see whether the folder appears as a
 * remoteItem (personal OneDrive sharing) and documents the correct IDs to use.
 *
 * Usage:
 *   pnpm probe:graph-cross-user
 *   pnpm probe:graph-cross-user -- --drive-id 78BEF1F85B43E5D5 --folder-id "78BEF1F85B43E5D5!s977a63e28a1d46a28b415a8a0a20ae0d"
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { initializeDb, onedriveConnections } from "../src/db/index.js";
import { refreshAccessToken } from "../src/auth/oauth.js";
import { getEnv } from "../src/config/env.js";

// ──────────────────────────────────────────────────────────────
// Defaults (confirmed owner IDs for MLJ-017 Package 6 - General)
// ──────────────────────────────────────────────────────────────
const DEFAULT_DRIVE_ID = "78BEF1F85B43E5D5";
const DEFAULT_FOLDER_ID = "78BEF1F85B43E5D5!s977a63e28a1d46a28b415a8a0a20ae0d";

function parseArgs(argv: string[]): { driveId: string; folderId: string } {
  let driveId = DEFAULT_DRIVE_ID;
  let folderId = DEFAULT_FOLDER_ID;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--drive-id" && argv[i + 1]) {
      driveId = argv[i + 1];
      i++;
    } else if (argv[i] === "--folder-id" && argv[i + 1]) {
      folderId = argv[i + 1];
      i++;
    }
  }
  return { driveId, folderId };
}

interface ProbeResult {
  email: string;
  driveItemStatus: number;
  driveItemError?: string;
  sharedWithMeMatch?: {
    name: string;
    remoteItemId: string;
    remoteDriveId: string;
  };
  notes: string[];
}

async function probeUser(
  graphBase: string,
  refreshToken: string,
  email: string,
  driveId: string,
  folderId: string
): Promise<ProbeResult> {
  const result: ProbeResult = { email, driveItemStatus: 0, notes: [] };

  // 1. Refresh access token
  let accessToken: string;
  try {
    const tokens = await refreshAccessToken(refreshToken, ["offline_access", "Files.Read"]);
    accessToken = tokens.accessToken;
  } catch (err) {
    result.driveItemStatus = -1;
    result.driveItemError = `Token refresh failed: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }

  // 2. Probe GET /drives/{driveId}/items/{folderId}
  const probeUrl = `${graphBase}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}?$select=id,name,webUrl`;
  const probeResp = await fetch(probeUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  result.driveItemStatus = probeResp.status;

  if (!probeResp.ok) {
    const body = await probeResp.text();
    result.driveItemError = body.slice(0, 300);

    if (probeResp.status === 403) {
      result.notes.push(
        "403 Forbidden — user is authenticated but has no permission on this drive item. " +
        "Share the folder with this Microsoft account (not just a sharing link) and retry."
      );
    } else if (probeResp.status === 404) {
      result.notes.push(
        "404 Not Found — the driveId/itemId is not accessible with this token. " +
        "For personal OneDrive, the recipient must be explicitly granted access. " +
        "Check /me/drive/sharedWithMe below for the remoteItem IDs to use instead."
      );
    }
  } else {
    const data = (await probeResp.json()) as { name?: string; webUrl?: string };
    result.notes.push(`200 OK — folder name="${data.name}" webUrl="${data.webUrl}"`);
  }

  // 3. Check /me/drive/sharedWithMe for the folder
  const sharedUrl =
    `${graphBase}/me/drive/sharedWithMe?` +
    "$select=id,name,remoteItem,parentReference&$top=100";
  const sharedResp = await fetch(sharedUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });

  if (sharedResp.ok) {
    const sharedData = (await sharedResp.json()) as {
      value?: Array<{
        id: string;
        name: string;
        remoteItem?: {
          id: string;
          name: string;
          parentReference?: { driveId?: string };
          webUrl?: string;
        };
      }>;
    };

    const items = sharedData.value ?? [];
    // Look for items whose remoteItem.parentReference.driveId matches the owner's drive.
    const match = items.find(
      (item) =>
        item.remoteItem?.parentReference?.driveId?.toUpperCase() === driveId.toUpperCase() ||
        item.name.toLowerCase().includes("mlj-017") ||
        item.name.toLowerCase().includes("package 6")
    );

    if (match?.remoteItem) {
      result.sharedWithMeMatch = {
        name: match.name,
        remoteItemId: match.remoteItem.id,
        remoteDriveId: match.remoteItem.parentReference?.driveId ?? "(unknown)",
      };
      result.notes.push(
        `Found in sharedWithMe: "${match.name}" ` +
        `remoteItem.id=${match.remoteItem.id} ` +
        `driveId=${match.remoteItem.parentReference?.driveId ?? "?"}`
      );
    } else if (items.length === 0) {
      result.notes.push("sharedWithMe: no shared items found for this user.");
    } else {
      result.notes.push(
        `sharedWithMe: ${items.length} item(s) found, none matched the owner's drive. ` +
        `Items: ${items.map((i) => i.name).slice(0, 5).join(", ")}`
      );
    }
  } else {
    result.notes.push(`sharedWithMe probe failed: HTTP ${sharedResp.status}`);
  }

  return result;
}

async function main(): Promise<void> {
  const { driveId, folderId } = parseArgs(process.argv.slice(2));

  const env = getEnv();
  const graphBase = env.onedriveApiEndpoint.replace(/\/$/, "");

  const db = await initializeDb(env.databaseUrl ?? "");

  const connections = await db
    .select({
      accountEmail: onedriveConnections.accountEmail,
      refreshToken: onedriveConnections.refreshToken,
    })
    .from(onedriveConnections);

  if (connections.length === 0) {
    console.log("No OneDrive connections found in the database.");
    process.exit(0);
  }

  console.log(`\n=== Graph cross-user probe ===`);
  console.log(`  Target driveId : ${driveId}`);
  console.log(`  Target folderId: ${folderId}`);
  console.log(`  Users to probe : ${connections.length}\n`);

  const findings: ProbeResult[] = [];

  for (const conn of connections) {
    const email = conn.accountEmail ?? "(unknown)";
    process.stdout.write(`Probing ${email} ... `);
    const result = await probeUser(graphBase, conn.refreshToken, email, driveId, folderId);
    findings.push(result);
    console.log(`HTTP ${result.driveItemStatus}`);
  }

  console.log("\n=== Results ===\n");
  for (const r of findings) {
    const statusLabel =
      r.driveItemStatus === 200
        ? "✓ ACCESS OK"
        : r.driveItemStatus === 403
          ? "✗ FORBIDDEN (403)"
          : r.driveItemStatus === 404
            ? "✗ NOT FOUND (404)"
            : r.driveItemStatus === -1
              ? "✗ TOKEN ERROR"
              : `✗ HTTP ${r.driveItemStatus}`;

    console.log(`[${statusLabel}] ${r.email}`);
    for (const note of r.notes) {
      console.log(`    ${note}`);
    }
    if (r.driveItemError) {
      console.log(`    Error detail: ${r.driveItemError}`);
    }
    if (r.sharedWithMeMatch) {
      console.log(`    sharedWithMe match:`);
      console.log(`      name     : ${r.sharedWithMeMatch.name}`);
      console.log(`      driveId  : ${r.sharedWithMeMatch.remoteDriveId}`);
      console.log(`      itemId   : ${r.sharedWithMeMatch.remoteItemId}`);
    }
    console.log();
  }

  // Summary recommendation
  const allOk = findings.every((r) => r.driveItemStatus === 200);
  const anyForbidden = findings.some((r) => r.driveItemStatus === 403);
  const anyNotFound = findings.some((r) => r.driveItemStatus === 404);

  console.log("=== Recommendation ===\n");
  if (allOk) {
    console.log("All users can access the folder. Safe to implement Phase 1.");
    console.log(`  driveId : ${driveId}`);
    console.log(`  folderId: ${folderId}`);
    console.log("\nBind the project:");
    console.log(`  POST /api/projects/{projectId}/drive`);
    console.log(`  { "driveId": "${driveId}", "folderId": "${folderId}" }`);
  } else if (anyForbidden) {
    console.log("One or more users got 403. Steps to fix:");
    console.log("  1. In OneDrive (web), right-click 'MLJ-017 Package 6 - General'.");
    console.log("  2. Share → 'Specific people' → enter each teammate's Microsoft account email.");
    console.log("  3. Grant 'Can view' (read-only is sufficient for the app).");
    console.log("  4. Have each teammate accept the share invitation.");
    console.log("  5. Re-run this probe: pnpm probe:graph-cross-user");
  } else if (anyNotFound) {
    console.log("One or more users got 404. Possible causes:");
    console.log("  - The folder has never been shared with those accounts.");
    console.log("  - Personal OneDrive 404 can mean 'no permission' (same as 403 effectively).");
    console.log("  - Check sharedWithMe results above for alternative IDs.");
    console.log("");
    console.log("If sharedWithMeMatch shows different IDs, use those instead:");
    for (const r of findings.filter((x) => x.sharedWithMeMatch)) {
      console.log(`    ${r.email}: driveId=${r.sharedWithMeMatch!.remoteDriveId} itemId=${r.sharedWithMeMatch!.remoteItemId}`);
    }
  }

  console.log();
  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
