import { beforeEach, describe, expect, it } from "vitest";
import type { FileRecord, UUID } from "@contractor/shared";
import { projectService } from "./project.service";

describe("projectService.listProjectExplorerFolder", () => {
  const projectId = "00000000-0000-4000-8000-000000000101" as UUID;

  beforeEach(async () => {
    projectService.resetForTests();
    await projectService.setProjectFiles(projectId, [
      {
        id: "00000000-0000-4000-8000-000000000201",
        projectId,
        fileName: "cover.pdf",
        filePath: "MLJ-017 Package 6 - General/05 - SUBMITTALS/cover.pdf",
        indexStatus: "indexed",
      },
      {
        id: "00000000-0000-4000-8000-000000000202",
        projectId,
        fileName: "swp.pdf",
        filePath: "MLJ-017 Package 6 - General/05 - SUBMITTALS/Safety/swp.pdf",
        indexStatus: "indexed",
      },
      {
        id: "00000000-0000-4000-8000-000000000203",
        projectId,
        fileName: "drawing.pdf",
        filePath: "MLJ-017 Package 6 - General/06 - DRAWINGS/drawing.pdf",
        indexStatus: "indexed",
      },
    ] as FileRecord[]);
  });

  it("returns all top-level folders from the full project index", async () => {
    const root = await projectService.listProjectExplorerFolder(
      projectId,
      "",
      "MLJ-017 Package 6 - General"
    );

    expect(root.totalProjectFiles).toBe(3);
    expect(root.folders.map((folder) => folder.name).sort()).toEqual([
      "05 - SUBMITTALS",
      "06 - DRAWINGS",
    ]);
    expect(root.folders.find((folder) => folder.name === "05 - SUBMITTALS")?.fileCount).toBe(2);
    expect(root.lastSyncedAt === null || typeof root.lastSyncedAt === "string").toBe(true);
  });

  it("returns direct files and child folders when a folder is opened", async () => {
    const folder = await projectService.listProjectExplorerFolder(
      projectId,
      "05 - SUBMITTALS",
      "MLJ-017 Package 6 - General"
    );

    expect(folder.files.map((file) => file.fileName)).toEqual(["cover.pdf"]);
    expect(folder.folders.map((child) => child.name)).toEqual(["Safety"]);
    expect(folder.folders[0]?.fileCount).toBe(1);
  });
});
