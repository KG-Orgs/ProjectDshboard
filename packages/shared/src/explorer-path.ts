/** Strip a redundant project root segment so explorer paths match the bound OneDrive folder. */
export function normalizeExplorerFilePath(
  filePath: string,
  projectRootFolderName?: string | null
): string {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const root = projectRootFolderName?.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!root) {
    return normalized;
  }
  if (normalized === root) {
    return "";
  }
  const rootPrefix = `${root}/`;
  if (normalized.startsWith(rootPrefix)) {
    return normalized.slice(rootPrefix.length);
  }
  return normalized;
}

/** Folder path relative to the project root that directly contains the file. */
export function getExplorerContainingFolderPath(
  filePath: string,
  fileName: string,
  projectRootFolderName?: string | null
): string {
  const normalizedPath = normalizeExplorerFilePath(filePath, projectRootFolderName);
  const parts = normalizedPath.split("/").filter(Boolean);
  if (parts.length > 0 && parts[parts.length - 1] === fileName) {
    parts.pop();
  }
  return parts.join("/");
}

export function splitExplorerFolderPath(folderPath: string | null | undefined): string[] {
  if (!folderPath?.trim()) {
    return [];
  }
  return folderPath.replace(/\\/g, "/").split("/").filter(Boolean);
}

export function pathStartsWithSegments(pathSegments: string[], prefixSegments: string[]): boolean {
  if (prefixSegments.length > pathSegments.length) {
    return false;
  }
  for (let index = 0; index < prefixSegments.length; index += 1) {
    if (pathSegments[index] !== prefixSegments[index]) {
      return false;
    }
  }
  return true;
}
