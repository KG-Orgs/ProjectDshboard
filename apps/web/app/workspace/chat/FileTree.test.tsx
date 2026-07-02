import { describe, expect, it } from 'vitest';
import { buildNestedFolderTree } from './FileTree';

describe('buildNestedFolderTree', () => {
  it('groups files under nested folder paths from OneDrive sync', () => {
    const tree = buildNestedFolderTree([
      {
        id: '1',
        fileName: 'a.pdf',
        filePath: 'Specs/Structural/a.pdf',
        indexStatus: 'indexed',
      },
      {
        id: '2',
        fileName: 'b.pdf',
        filePath: 'Specs/Electrical/b.pdf',
        indexStatus: 'indexed',
      },
      {
        id: '3',
        fileName: 'root.pdf',
        filePath: 'root.pdf',
        indexStatus: 'indexed',
      },
    ]);

    expect(tree).toHaveLength(2);
    expect(tree[0]?.name).toBe('Project Files');
    expect(tree[0]?.files).toHaveLength(1);
    expect(tree[0]?.files[0]?.fileName).toBe('root.pdf');

    const specs = tree.find((node) => node.name === 'Specs');
    expect(specs?.children).toHaveLength(2);
    expect(specs?.children.map((child) => child.name).sort()).toEqual(['Electrical', 'Structural']);
    expect(specs?.children[0]?.files[0]?.fileName).toBeDefined();
  });

  it('keeps a single top-level folder for flat project paths', () => {
    const tree = buildNestedFolderTree([
      {
        id: '1',
        fileName: 'foundation-drawings.pdf',
        filePath: 'Project Files/foundation-drawings.pdf',
        indexStatus: 'ready',
      },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.name).toBe('Project Files');
    expect(tree[0]?.files).toHaveLength(1);
  });
});
