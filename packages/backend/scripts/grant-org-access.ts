/**
 * Grant a user access to an organization (and its projects) by email.
 *
 * Projects are scoped by org_id — all users in the same org see the same projects
 * and indexed files. Run after the user has signed in at least once, or pre-create
 * is unnecessary (first login creates the row with their Microsoft tenant org).
 *
 * For personal Microsoft accounts (gmail.com via Microsoft), org_id is usually
 * 9188040d-6c67-4c5b-b112-36a304b66dad (MSA consumer tenant) and matches the
 * MLJ-017 test project after `pnpm link:mlj017-org` — no grant needed.
 *
 * Usage:
 *   pnpm grant:org-access -- --email georgegao1997@gmail.com
 *   pnpm grant:org-access -- --email user@example.com --org-id <uuid>
 *   pnpm grant:org-access -- --email user@example.com --project-id 731cfd5d-e647-4551-89e7-0a3cc4915115
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { getEnv } from "../src/config/env";
import { initializeDb, organizations, projects, users } from "../src/db";

const DEFAULT_MLJ017_PROJECT_ID = "731cfd5d-e647-4551-89e7-0a3cc4915115";

function parseArgs(argv: string[]): {
  email?: string;
  orgId?: string;
  projectId?: string;
} {
  const result: { email?: string; orgId?: string; projectId?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--email" && argv[i + 1]) {
      result.email = argv[i + 1].trim().toLowerCase();
      i += 1;
    } else if (argv[i] === "--org-id" && argv[i + 1]) {
      result.orgId = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--project-id" && argv[i + 1]) {
      result.projectId = argv[i + 1];
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

  const { email, orgId: orgIdArg, projectId: projectIdArg } = parseArgs(
    process.argv.slice(2)
  );

  if (!email) {
    console.error("Missing --email. Example: pnpm grant:org-access -- --email user@example.com");
    process.exit(1);
  }

  const db = await initializeDb(env.databaseUrl);

  const projectId = projectIdArg ?? DEFAULT_MLJ017_PROJECT_ID;
  let targetOrgId = orgIdArg;

  if (!targetOrgId) {
    const [project] = await db
      .select({ orgId: projects.orgId, name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      console.error(`Project ${projectId} not found.`);
      process.exit(1);
    }

    targetOrgId = project.orgId;
    console.log(`Using org from project "${project.name}": ${targetOrgId}`);
  }

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, targetOrgId))
    .limit(1);

  if (!org) {
    console.error(`Organization ${targetOrgId} not found.`);
    process.exit(1);
  }

  const [existing] = await db
    .select({
      id: users.id,
      email: users.email,
      orgId: users.orgId,
      name: users.name,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existing) {
    console.error(
      `User ${email} not found. They must sign in with Microsoft once so a users row is created, then re-run this script.`
    );
    process.exit(1);
  }

  if (existing.orgId === targetOrgId) {
    console.log(`User ${email} already belongs to org "${org.name}" (${targetOrgId}).`);
    console.log("");
    console.log("Next: open the app and select the project in the dashboard or chat workspace.");
    return;
  }

  await db
    .update(users)
    .set({ orgId: targetOrgId })
    .where(eq(users.email, email));

  console.log("Organization access granted:");
  console.log(`  user: ${existing.name} <${email}>`);
  console.log(`  org: ${org.name} (${targetOrgId})`);
  console.log(`  was: ${existing.orgId}`);
  console.log("");
  console.log("Next:");
  console.log("  1. User signs in at /login (Microsoft OAuth)");
  console.log(`  2. Open /workspace/chat?projectId=${projectId} or pick the project on the dashboard`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
