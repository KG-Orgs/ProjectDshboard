import type { WsFile } from './FileTree';

export interface ProjectFilesPage {
  files: WsFile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 2000;
const MAX_PAGE_SIZE = 10000;

export async function fetchProjectFilesPage(
  projectId: string,
  options: { page?: number; pageSize?: number; search?: string } = {}
): Promise<ProjectFilesPage> {
  const page = options.page ?? 1;
  const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (options.search?.trim()) {
    params.set('search', options.search.trim());
  }

  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/files?${params.toString()}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Failed to load project files (${response.status})`);
  }

  const data = (await response.json()) as ProjectFilesPage;
  return {
    files: data.files ?? [],
    total: data.total ?? data.files?.length ?? 0,
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    hasMore: Boolean(data.hasMore),
  };
}

/** Load every indexed file for a project, paging until the API reports no more results. */
export async function fetchAllProjectFiles(
  projectId: string,
  options: {
    pageSize?: number;
    onProgress?: (loaded: number, total: number, files: WsFile[]) => void;
    signal?: AbortSignal;
  } = {}
): Promise<{ files: WsFile[]; total: number }> {
  const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  let page = 1;
  let total = 0;
  const files: WsFile[] = [];

  while (true) {
    if (options.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const result = await fetchProjectFilesPage(projectId, { page, pageSize });
    total = result.total;
    files.push(...result.files);
    options.onProgress?.(files.length, total, files);

    if (!result.hasMore || result.files.length === 0) {
      break;
    }

    page += 1;
  }

  return { files, total };
}

export async function searchProjectFiles(
  projectId: string,
  query: string,
  options: { pageSize?: number; signal?: AbortSignal } = {}
): Promise<WsFile[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const pageSize = Math.min(options.pageSize ?? 500, MAX_PAGE_SIZE);
  const result = await fetchProjectFilesPage(projectId, {
    page: 1,
    pageSize,
    search: trimmed,
  });

  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  return result.files;
}
