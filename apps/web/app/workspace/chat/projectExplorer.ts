import type { ProjectExplorerFolderResponse } from '@contractor/shared';
import type { FileTreeNode, WsFile } from './FileTree';

const EXPLORER_DB_NAME = 'contractorai-explorer';
const EXPLORER_STORE = 'projects';
const EXPLORER_DB_VERSION = 1;
const EXPLORER_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface ExplorerSessionCache {
  projectId: string;
  projectRootFolderName: string;
  lastSyncedAt: string | null;
  foldersByPath: Record<string, ProjectExplorerFolderResponse>;
  updatedAt: number;
}

export function isUsableExplorerCache(
  cache: ExplorerSessionCache | null | undefined,
  projectId: string,
  projectRootFolderName: string,
  lastSyncedAt?: string | null
): cache is ExplorerSessionCache {
  if (!cache) {
    return false;
  }
  if (cache.projectId !== projectId || cache.projectRootFolderName !== projectRootFolderName) {
    return false;
  }
  if (Date.now() - cache.updatedAt > EXPLORER_CACHE_MAX_AGE_MS) {
    return false;
  }
  if (lastSyncedAt === undefined) {
    return true;
  }
  return (cache.lastSyncedAt ?? null) === (lastSyncedAt ?? null);
}

function openExplorerDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(EXPLORER_DB_NAME, EXPLORER_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EXPLORER_STORE)) {
        db.createObjectStore(EXPLORER_STORE, { keyPath: 'projectId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open explorer cache'));
  });
}

export async function readExplorerSessionCache(
  projectId: string,
  projectRootFolderName: string,
  lastSyncedAt?: string | null
): Promise<ExplorerSessionCache | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }

  try {
    const db = await openExplorerDb();
    const cache = await new Promise<ExplorerSessionCache | null>((resolve, reject) => {
      const tx = db.transaction(EXPLORER_STORE, 'readonly');
      const request = tx.objectStore(EXPLORER_STORE).get(projectId);
      request.onsuccess = () => resolve((request.result as ExplorerSessionCache | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return isUsableExplorerCache(cache, projectId, projectRootFolderName, lastSyncedAt) ? cache : null;
  } catch {
    return null;
  }
}

export async function writeExplorerSessionCache(cache: ExplorerSessionCache): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return;
  }

  try {
    const db = await openExplorerDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(EXPLORER_STORE, 'readwrite');
      tx.objectStore(EXPLORER_STORE).put(cache);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore quota or private-mode failures.
  }
}

export async function fetchExplorerFolder(
  projectId: string,
  folderPath: string,
  projectRootFolderName?: string
): Promise<ProjectExplorerFolderResponse> {
  const params = new URLSearchParams();
  if (folderPath) {
    params.set('folderPath', folderPath);
  }
  if (projectRootFolderName?.trim()) {
    params.set('projectRootFolderName', projectRootFolderName.trim());
  }

  const query = params.toString();
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/files/explorer${query ? `?${query}` : ''}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Failed to load explorer folder (${response.status})`);
  }

  return (await response.json()) as ProjectExplorerFolderResponse;
}

function folderResponseToNode(
  folder: ProjectExplorerFolderResponse['folders'][number],
  loadedFolders: Map<string, ProjectExplorerFolderResponse>
): FileTreeNode {
  const loaded = loadedFolders.get(folder.path);
  return {
    name: folder.name,
    path: folder.path,
    files: (loaded?.files ?? []) as WsFile[],
    children: loaded ? loaded.folders.map((child) => folderResponseToNode(child, loadedFolders)) : [],
    fileCount: folder.fileCount,
    childrenLoaded: Boolean(loaded),
  };
}

export function buildExplorerTree(
  loadedFolders: Map<string, ProjectExplorerFolderResponse>
): FileTreeNode[] {
  const root = loadedFolders.get('');
  if (!root) {
    return [];
  }

  const nodes = root.folders.map((folder) => folderResponseToNode(folder, loadedFolders));

  if (root.files.length > 0) {
    nodes.unshift({
      name: 'Project Files',
      path: '__root__',
      files: root.files as WsFile[],
      children: [],
      fileCount: root.files.length,
      childrenLoaded: true,
    });
  }

  return nodes.sort((left, right) => left.name.localeCompare(right.name));
}

export function collectKnownFiles(
  loadedFolders: Map<string, ProjectExplorerFolderResponse>
): WsFile[] {
  const files: WsFile[] = [];
  for (const folder of loadedFolders.values()) {
    files.push(...(folder.files as WsFile[]));
  }
  return files;
}

export function mergeExplorerFolder(
  loadedFolders: Map<string, ProjectExplorerFolderResponse>,
  folder: ProjectExplorerFolderResponse
): Map<string, ProjectExplorerFolderResponse> {
  const next = new Map(loadedFolders);
  next.set(folder.folderPath, folder);
  return next;
}

/** Parent-folder metadata fileCount for a path, when available from a loaded ancestor listing. */
export function expectedExplorerFileCount(
  loadedFolders: Map<string, ProjectExplorerFolderResponse>,
  apiPath: string
): number | undefined {
  if (!apiPath) {
    return loadedFolders.get('')?.totalProjectFiles;
  }

  const parentPath = apiPath.includes('/') ? apiPath.slice(0, apiPath.lastIndexOf('/')) : '';
  const parent = loadedFolders.get(parentPath);
  return parent?.folders.find((folder) => folder.path === apiPath)?.fileCount;
}

/**
 * True when we should hit the network again for this path.
 * Empty cached listings that contradict parent fileCount are treated as stale
 * (common after a failed/partial expand that got written to IndexedDB).
 */
export function shouldRefetchExplorerFolder(
  loadedFolders: Map<string, ProjectExplorerFolderResponse>,
  apiPath: string
): boolean {
  const loaded = loadedFolders.get(apiPath);
  if (!loaded) {
    return true;
  }

  if (loaded.files.length > 0 || loaded.folders.length > 0) {
    return false;
  }

  const expected = expectedExplorerFileCount(loadedFolders, apiPath);
  return typeof expected === 'number' && expected > 0;
}

/** Drop empty child cache entries that disagree with parent folder counts. */
export function pruneStaleEmptyExplorerFolders(
  loadedFolders: Map<string, ProjectExplorerFolderResponse>
): Map<string, ProjectExplorerFolderResponse> {
  const next = new Map(loadedFolders);
  for (const path of [...next.keys()]) {
    if (path === '') {
      continue;
    }
    if (shouldRefetchExplorerFolder(next, path)) {
      next.delete(path);
    }
  }
  return next;
}

export function createExplorerSessionCache(
  projectId: string,
  projectRootFolderName: string,
  loadedFolders: Map<string, ProjectExplorerFolderResponse>,
  lastSyncedAt?: string | null
): ExplorerSessionCache {
  return {
    projectId,
    projectRootFolderName,
    lastSyncedAt: lastSyncedAt ?? loadedFolders.get('')?.lastSyncedAt ?? null,
    foldersByPath: Object.fromEntries(loadedFolders.entries()),
    updatedAt: Date.now(),
  };
}

export function hydrateExplorerSessionCache(
  cache: ExplorerSessionCache
): Map<string, ProjectExplorerFolderResponse> {
  return new Map(Object.entries(cache.foldersByPath));
}
