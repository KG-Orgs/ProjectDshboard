/**
 * Smoke test: verifies pageSize=10000 is no longer capped at 200.
 * Run with:  pnpm tsx scripts/test-pagsize-fix.ts
 *
 * Uses the in-memory path (no DB required).
 */
import type { UUID } from "@contractor/shared";
import { randomUUID } from "node:crypto";
import { projectService } from "../src/services/project.service";

function asUuid(s: string): UUID { return s as UUID; }

async function main() {
  projectService.resetForTests();

  const projectId = asUuid(randomUUID());

  const fakeFiles = Array.from({ length: 300 }, (_, i) => ({
    id: asUuid(randomUUID()),
    projectId,
    onedriveItemId: randomUUID(),
    onedriveEtag: null as string | null,
    fileName: `file-${String(i).padStart(4, "0")}.pdf`,
    filePath: `${String(Math.floor(i / 50)).padStart(2, "0")} - Folder/file-${i}.pdf`,
    indexStatus: "indexed" as const,
    chunkCount: 1,
    docCategory: null as string | null,
    tags: [] as string[],
    lastModified: null as string | null,
    fileSizeBytes: null as number | null,
    mimeType: null as string | null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  await projectService.setProjectFiles(projectId, fakeFiles);

  console.log("\n=== pageSize cap fix test ===");

  const result10k = await projectService.listProjectFiles(projectId, { page: 1, pageSize: 10000 });
  const pass1 = result10k.files.length === 300 && result10k.pageSize === 10000;
  console.log(`  [1] pageSize=10000 -> returned ${result10k.files.length}/300  pageSize echo=${result10k.pageSize}  ${pass1 ? "PASS" : "FAIL"}`);

  const result300 = await projectService.listProjectFiles(projectId, { page: 1, pageSize: 300 });
  const pass2 = result300.files.length === 300 && result300.pageSize === 300;
  console.log(`  [2] pageSize=300  -> returned ${result300.files.length}/300  pageSize echo=${result300.pageSize}  ${pass2 ? "PASS" : "FAIL"}`);

  const result50 = await projectService.listProjectFiles(projectId, { page: 1, pageSize: 50 });
  const pass3 = result50.files.length === 50 && result50.hasMore === true;
  console.log(`  [3] pageSize=50   -> returned ${result50.files.length}/50    hasMore=${result50.hasMore}     ${pass3 ? "PASS" : "FAIL"}`);

  const folders = new Set(result10k.files.map((f: {filePath: string}) => f.filePath.split("/")[0]));
  const pass4 = folders.size === 6;
  console.log(`  [4] distinct folders visible: ${folders.size}/6  ${pass4 ? "PASS" : "FAIL"}`);

  const allPassed = pass1 && pass2 && pass3 && pass4;
  console.log(`\n${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
