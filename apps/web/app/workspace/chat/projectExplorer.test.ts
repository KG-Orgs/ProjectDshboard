import { describe, expect, it } from 'vitest';
import type { ProjectExplorerFolderResponse } from '@contractor/shared';
import { buildExplorerTree, isUsableExplorerCache, mergeExplorerFolder } from './projectExplorer';

describe('projectExplorer', () => {
  it('builds top-level folders from the root explorer response', () => {
    const loaded = mergeExplorerFolder(new Map(), {
      folderPath: '',
      totalProjectFiles: 3,
      folders: [
        { name: '05 - SUBMITTALS', path: '05 - SUBMITTALS', fileCount: 2 },
        { name: '06 - DRAWINGS', path: '06 - DRAWINGS', fileCount: 1 },
      ],
      files: [],
    });

    expect(buildExplorerTree(loaded).map((node) => node.name)).toEqual([
      '05 - SUBMITTALS',
      '06 - DRAWINGS',
    ]);
  });

  it('includes nested folders after a child folder is loaded', () => {
    let loaded = mergeExplorerFolder(new Map(), {
      folderPath: '',
      totalProjectFiles: 2,
      folders: [{ name: '05 - SUBMITTALS', path: '05 - SUBMITTALS', fileCount: 2 }],
      files: [],
    });

    loaded = mergeExplorerFolder(loaded, {
      folderPath: '05 - SUBMITTALS',
      totalProjectFiles: 2,
      folders: [{ name: 'Safety', path: '05 - SUBMITTALS/Safety', fileCount: 1 }],
      files: [
        {
          id: '1',
          fileName: 'cover.pdf',
          filePath: '05 - SUBMITTALS/cover.pdf',
          indexStatus: 'indexed',
        },
      ],
    } as ProjectExplorerFolderResponse);

    const tree = buildExplorerTree(loaded);
    expect(tree[0]?.children.map((node) => node.name)).toEqual(['Safety']);
    expect(tree[0]?.files.map((file) => file.fileName)).toEqual(['cover.pdf']);
  });

  it('keeps cached folders only when lastSyncedAt matches', () => {
    const cache = {
      projectId: 'project-1',
      projectRootFolderName: 'MLJ-017 Package 6 - General',
      lastSyncedAt: '2026-08-19T00:00:00.000Z',
      foldersByPath: {},
      updatedAt: Date.now(),
    };

    expect(
      isUsableExplorerCache(cache, 'project-1', 'MLJ-017 Package 6 - General', '2026-08-19T00:00:00.000Z')
    ).toBe(true);
    expect(
      isUsableExplorerCache(cache, 'project-1', 'MLJ-017 Package 6 - General', '2026-08-20T00:00:00.000Z')
    ).toBe(false);
  });
});


describe('projectExplorer', () => {
  it('builds top-level folders from the root explorer response', () => {
    const loaded = mergeExplorerFolder(new Map(), {
      folderPath: '',
      totalProjectFiles: 3,
      folders: [
        { name: '05 - SUBMITTALS', path: '05 - SUBMITTALS', fileCount: 2 },
        { name: '06 - DRAWINGS', path: '06 - DRAWINGS', fileCount: 1 },
      ],
      files: [],
    });

    expect(buildExplorerTree(loaded).map((node) => node.name)).toEqual([
      '05 - SUBMITTALS',
      '06 - DRAWINGS',
    ]);
  });

  it('includes nested folders after a child folder is loaded', () => {
    let loaded = mergeExplorerFolder(new Map(), {
      folderPath: '',
      totalProjectFiles: 2,
      folders: [{ name: '05 - SUBMITTALS', path: '05 - SUBMITTALS', fileCount: 2 }],
      files: [],
    });

    loaded = mergeExplorerFolder(loaded, {
      folderPath: '05 - SUBMITTALS',
      totalProjectFiles: 2,
      folders: [{ name: 'Safety', path: '05 - SUBMITTALS/Safety', fileCount: 1 }],
      files: [
        {
          id: '1',
          fileName: 'cover.pdf',
          filePath: '05 - SUBMITTALS/cover.pdf',
          indexStatus: 'indexed',
        },
      ],
    } as ProjectExplorerFolderResponse);

    const tree = buildExplorerTree(loaded);
    expect(tree[0]?.children.map((node) => node.name)).toEqual(['Safety']);
    expect(tree[0]?.files.map((file) => file.fileName)).toEqual(['cover.pdf']);
  });
});
