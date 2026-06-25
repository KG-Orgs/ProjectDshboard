/**
 * Reassign the MLJ-017 tier1/tier2 test project to the org your Microsoft login uses,
 * so it appears in the web dashboard and chat workspace after sign-in.
 *
 * Usage:
 *   pnpm link:mlj017-org
 *   pnpm link:mlj017-org -- --org-id <uuid-from-/api/auth/me>
 *   pnpm link:mlj017-org -- --tenant-id <azure-tenant-guid>
 */
import { createHash } from "node:crypto";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { getEnv } from "../src/config/env";
import { initializeDb, organizations, projects } from "../src/db";

const MLJ017_PROJECT_ID = "731cfd5d-e647-4551-89e7-0a3cc4915115";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toDeterministicUuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  const base = hash.slice(0, 32).split("");
  base[12] = "4";
  const variantNibble = Number.parseInt(base[16], 10);
  base[16] = ((variantNibble & 0x3) | 0x8).toString(16);
  const compact = base.join("");

  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20, 32),
  ].join("-");
}

function normalizeUuidClaim(claim: string | undefined, fallbackSeed: string): string {
  if (claim && UUID_PATTERN.test(claim)) {
    return claim;
  }

  const source = claim && claim.length > 0 ? claim : fallbackSeed;
  return toDeterministicUuid(source);
}

function parseArgs(argv: string[]): { orgId?: string; tenantId?: string } {
  const result: { orgId?: string; tenantId?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--org-id" && argv[i + 1]) {
      result.orgId = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--tenant-id" && argv[i + 1]) {
      result.tenantId = argv[i + 1];
      i += 1;
    }
  }
  return result;
}

async function main(): Promise<void> {
  config({ path: "../../.env" });

  const env = getEnv();
  if (!env.databaseUrl) {
    console.error("DATABASE_URL is missing from .env");
    process.exit(1);
  }

  const { orgId: orgIdArg, tenantId: tenantIdArg } = parseArgs(process.argv.slice(2));
  const tenantId = tenantIdArg ?? process.env.MICROSOFT_TENANT_ID;
  const targetOrgId =
    orgIdArg ??
    (tenantId
      ? normalizeUuidClaim(tenantId, `tenant:${tenantId}`)
      : undefined);

  if (!targetOrgId) {
    console.error(
      "Missing org. Pass --org-id <uuid> (from GET /api/auth/me after login) or set MICROSOFT_TENANT_ID in .env."
    );
    process.exit(1);
  }

  const db = await initializeDb(env.databaseUrl);
  const [project] = await db
    .select({ id: projects.id, name: projects.name, orgId: projects.orgId })
    .from(projects)
    .where(eq(projects.id, MLJ017_PROJECT_ID))
    .limit(1);

  if (!project) {
    console.error(`Project ${MLJ017_PROJECT_ID} not found. Run tier1:ingest first.`);
    process.exit(1);
  }

  const orgName =
    tenantId && !orgIdArg
      ? `Microsoft Tenant (${tenantId.slice(0, 8)}…)`
      : "Linked Test Org";

  await db
    .insert(organizations)
    .values({ id: targetOrgId, name: orgName, createdAt: new Date() })
    .onConflictDoUpdate({
      target: organizations.id,
      set: { name: orgName },
    });

  await db
    .update(projects)
    .set({ orgId: targetOrgId })
    .where(eq(projects.id, MLJ017_PROJECT_ID));

  console.log("MLJ-017 project linked for web chat testing:");
  console.log(`  project: ${project.name}`);
  console.log(`  projectId: ${MLJ017_PROJECT_ID}`);
  console.log(`  orgId: ${targetOrgId} (was ${project.orgId})`);
  console.log("");
  console.log("Next:");
  console.log("  1. Ensure RETRIEVAL_HYBRID_ENABLED=true in .env (restart backend)");
  console.log("  2. pnpm dev");
  console.log(`  3. Open http://localhost:3000/workspace/chat?projectId=${MLJ017_PROJECT_ID}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
