/**
 * Exact-id lookup demo (MVP Slice 1 verification, 1c/1d/1e).
 *
 * Resolves a project by name, then runs the deterministic exact-id route for a
 * set of queries — through retrievalService.searchProject (the wired path) and
 * directly via identifierLookupService (to show the full revision/status family).
 *
 * Usage (from packages/backend):
 *   pnpm tsx ./scripts/exact-id-demo.ts "QWP-005" "QWP 5"
 */

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { initializeDb } from "../src/db";
import { getEnv } from "../src/config/env";
import { projects } from "../src/db/schema";
import { retrievalService } from "../src/services/retrieval.service";
import { identifierLookupService } from "../src/services/identifier-lookup.service";

const PROJECT_NAME = "MLJ-017 Package 6 - General (TEST CLONE)";

async function main(): Promise<void> {
  config({ path: "../../.env" });
  const queries = process.argv.slice(2);
  const toRun = queries.length > 0 ? queries : ["QWP-005", "QWP 5"];

  const db = await initializeDb(getEnv().databaseUrl!);
  const [project] = await db.select().from(projects).where(eq(projects.name, PROJECT_NAME)).limit(1);
  if (!project) throw new Error(`Project not found: ${PROJECT_NAME}`);

  for (const query of toRun) {
    console.log(`\n################ QUERY: "${query}" ################`);

    const lookup = await identifierLookupService.lookupExactIdentifier(project.id as any, query);
    if (!lookup) {
      console.log("No exact identifier resolved.");
      continue;
    }

    console.log("Resolved identifier:", JSON.stringify(lookup.identifier));
    console.log("Resolved file (latest/approved):", lookup.fileName);
    console.log("  revision:", lookup.revision, "| status:", lookup.statusCode, "| station:", lookup.station);
    console.log("  deepLink:", lookup.deepLinkUrl);
    console.log("  matchReasons:", JSON.stringify(lookup.matchReasons));
    console.log(`  revision/status family (${lookup.totalFamilyMembers} members):`);
    for (const member of lookup.family) {
      console.log(
        `   - ${member.superseded ? "[superseded]" : "[CHOSEN]    "} rev=${member.revision ?? "?"} status=${member.statusCode ?? "?"}  ${member.fileName}`
      );
    }

    // The same query through the wired retrieval search path.
    const search = await retrievalService.searchProject(project.id as any, query, { includeChunks: true });
    const top = search.results[0];
    console.log(`\n  via retrievalService.searchProject -> totalMatches=${search.totalMatches}`);
    if (top) {
      console.log("   rank-1:", top.fileName);
      console.log("   topRelevance:", top.topRelevance, "| deepLink:", top.deepLinkUrl);
      console.log("   exactIdentifier:", JSON.stringify(top.exactIdentifier));
      console.log("   matchReasons:", JSON.stringify(top.matchReasons));
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
