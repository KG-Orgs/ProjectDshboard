/**
 * Grant project membership and optionally org admin role.
 *
 * Usage:
 *   pnpm grant:project-access -- --email kyle.xu4@gmail.com --project-id <uuid> --role admin --org-admin
 *   pnpm grant:project-access -- --email user@example.com --project-id <uuid> --role member
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { getEnv } from "../src/config/env";
import { initializeDb, projects, users } from "../src/db";
import { projectAccessService } from "../src/services/project-access.service";

const DEFAULT_MLJ017_PROJECT_ID = "731cfd5d-e647-4551-89e7-0a3cc4915115";

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = "true";
      }
    }
  }
  return out;
}

async function main() {
  config({ path: "../../.env" });

  const env = getEnv();
  if (!env.databaseUrl) {
    console.error("DATABASE_URL is missing from .env");
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const email = args.email?.trim().toLowerCase();
  const projectId = args["project-id"]?.trim() ?? DEFAULT_MLJ017_PROJECT_ID;
  const role = (args.role ?? "member") as "admin" | "member";
  const orgRole = args["org-role"]?.trim() as "super" | "admin" | undefined;
  const orgAdmin = args["org-admin"] === "true" || orgRole === "admin" || orgRole === "super";

  if (!email) {
    console.error(
      "Usage: pnpm grant:project-access -- --email <email> [--project-id <uuid>] [--role admin|member] [--org-admin]"
    );
    process.exit(1);
  }

  if (role !== "admin" && role !== "member") {
    console.error("--role must be admin or member");
    process.exit(1);
  }

  const db = await initializeDb(env.databaseUrl);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    console.error(`No user found with email ${email}. They must sign in once first.`);
    process.exit(1);
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    console.error(`No project found with id ${projectId}`);
    process.exit(1);
  }

  if (user.orgId !== project.orgId) {
    console.error(`User org (${user.orgId}) does not match project org (${project.orgId})`);
    console.error("Run grant:org-access first to move the user into the project's org.");
    process.exit(1);
  }

  if (orgAdmin && user.role !== "admin" && user.role !== "super") {
    const nextOrgRole = orgRole === "super" ? "super" : "admin";
    await db.update(users).set({ role: nextOrgRole }).where(eq(users.id, user.id));
    console.log(`Set org role to ${nextOrgRole} for ${email}`);
  } else if (orgRole === "super" && user.role !== "super") {
    await db.update(users).set({ role: "super" }).where(eq(users.id, user.id));
    console.log(`Set org role to super for ${email}`);
  }

  await projectAccessService.grantMembership(projectId, user.id, role);
  console.log(`Granted ${role} on project "${project.name}" (${projectId}) to ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
