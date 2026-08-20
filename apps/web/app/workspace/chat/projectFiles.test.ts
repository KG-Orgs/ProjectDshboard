import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAllProjectFiles, fetchProjectFilesPage, searchProjectFiles } from './projectFiles';

function mockFiles(count: number, prefix = 'file') {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    fileName: `${prefix}-${index + 1}.pdf`,
    filePath: `Folder/${prefix}-${index + 1}.pdf`,
    indexStatus: 'indexed',
  }));
}

describe('projectFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads every page until hasMore is false', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: mockFiles(2000, 'a'),
          total: 4500,
          page: 1,
          pageSize: 2000,
          hasMore: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: mockFiles(2000, 'b'),
          total: 4500,
          page: 2,
          pageSize: 2000,
          hasMore: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: mockFiles(500, 'c'),
          total: 4500,
          page: 3,
          pageSize: 2000,
          hasMore: false,
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const progress: Array<[number, number]> = [];
    const result = await fetchAllProjectFiles('project-1', {
      onProgress: (loaded, total) => progress.push([loaded, total]),
    });

    expect(result.files).toHaveLength(4500);
    expect(result.total).toBe(4500);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(progress).toEqual([
      [2000, 4500],
      [4000, 4500],
      [4500, 4500],
    ]);
  });

  it('passes search queries to the files API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        files: mockFiles(1, 'match'),
        total: 1,
        page: 1,
        pageSize: 500,
        hasMore: false,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const files = await searchProjectFiles('project-1', 'swp-007');
    expect(files).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/project-1/files?page=1&pageSize=500&search=swp-007',
      { cache: 'no-store' }
    );
  });

  it('throws when a page request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(fetchProjectFilesPage('project-1')).rejects.toThrow('Failed to load project files (500)');
  });
});
