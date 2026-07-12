/**
 * Backfill project_members for projects that have no members (or a specific project).
 * Uses the same rules as migration 0020: org admins → project admin, others → member.
 *
 * Usage:
 *   pnpm backfill:project-access
 *   pnpm backfill:project-access -- --project-id <uuid>
 */
import { config } from "dotenv";
import { eq, notExists, sql } from "drizzle-orm";
import { getEnv } from "../src/config/env";
import { initializeDb, projectMembers, projects } from "../src/db";
import { projectAccessService } from "../src/services/project-access.service";

function parseArgs(argv: string[]): { projectId?: string } {
  const out: { projectId?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project-id" && argv[i + 1]) {
      out.projectId = argv[i + 1];
      i++;
    }
  }
  return out;
}

async function main(): Promise<void> {
  config({ path: "../../.env" });

  const env = getEnv();
  if (!env.databaseUrl) {
    console.error("DATABASE_URL is missing from .env");
    process.exit(1);
  }

  const { projectId: projectIdArg } = parseArgs(process.argv.slice(2));
  const db = await initializeDb(env.databaseUrl);

  const targetProjects = projectIdArg
    ? await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(eq(projects.id, projectIdArg))
    : await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(
          notExists(
            db
              .select({ one: sql`1` })
              .from(projectMembers)
              .where(eq(projectMembers.projectId, projects.id))
          )
        )
        .orderBy(projects.createdAt);

  if (targetProjects.length === 0) {
    console.log("No projects need membership backfill.");
    return;
  }

  let totalInserted = 0;
  for (const project of targetProjects) {
    const inserted = await projectAccessService.backfillOrgMembersForProject(project.id);
    totalInserted += inserted;
    console.log(
      `${project.name} (${project.id}): ${inserted} member row(s) added`
    );
  }

  console.log(`Done. ${totalInserted} total membership row(s) inserted.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
