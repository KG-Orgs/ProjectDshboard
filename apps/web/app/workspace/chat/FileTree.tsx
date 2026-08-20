import { ReactNode } from 'react';
import { ChevronDown, ChevronRight, File, FileImage, FileSpreadsheet, FileText, Folder, FolderOpen } from 'lucide-react';
import { normalizeExplorerFilePath } from '@contractor/shared';

export { normalizeExplorerFilePath };

export interface WsFile {
  id: string;
  fileName: string;
  filePath: string;
  indexStatus: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  files: WsFile[];
  children: FileTreeNode[];
  fileCount?: number;
  childrenLoaded?: boolean;
}

function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      files: [...node.files].sort((a, b) => a.fileName.localeCompare(b.fileName)),
      children: sortTree(node.children),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Build a nested folder tree from flat search results. */
export function buildNestedFolderTree(
  files: WsFile[],
  projectRootFolderName?: string | null
): FileTreeNode[] {
  const root: FileTreeNode = { name: '', path: '', files: [], children: [] };

  for (const file of files) {
    const normalizedPath = normalizeExplorerFilePath(file.filePath, projectRootFolderName);
    const parts = normalizedPath.split('/').filter(Boolean);
    if (parts.length > 0 && parts[parts.length - 1] === file.fileName) {
      parts.pop();
    }

    let current = root;
    let pathSoFar = '';

    for (const segment of parts) {
      pathSoFar = pathSoFar ? `${pathSoFar}/${segment}` : segment;
      let child = current.children.find((node) => node.name === segment);
      if (!child) {
        child = { name: segment, path: pathSoFar, files: [], children: [], childrenLoaded: true };
        current.children.push(child);
      }
      current = child;
    }

    current.files.push(file);
  }

  const topLevel: FileTreeNode[] = [...sortTree(root.children)];
  if (root.files.length > 0) {
    topLevel.unshift({
      name: 'Project Files',
      path: '__root__',
      files: [...root.files].sort((a, b) => a.fileName.localeCompare(b.fileName)),
      children: [],
      childrenLoaded: true,
      fileCount: root.files.length,
    });
  }

  return topLevel;
}

function getFileIcon(fileName: string): ReactNode {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const iconClass = 'ws-file-icon';
  if (ext === 'pdf') return <FileText className={iconClass} aria-hidden />;
  if (['doc', 'docx'].includes(ext)) return <FileText className={iconClass} aria-hidden />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className={iconClass} aria-hidden />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage className={iconClass} aria-hidden />;
  return <File className={iconClass} aria-hidden />;
}

function countFiles(node: FileTreeNode): number {
  return node.files.length + node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

function getDisplayFileCount(node: FileTreeNode): number {
  if (typeof node.fileCount === 'number') {
    return node.fileCount;
  }
  return countFiles(node);
}

interface FolderSectionProps {
  node: FileTreeNode;
  depth: number;
  isExpanded: boolean;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  activeFileId: string | undefined;
  onToggle: (path: string) => void;
  onFileClick: (file: WsFile) => void;
}

function FolderSection({
  node,
  depth,
  isExpanded,
  expandedFolders,
  loadingFolders,
  activeFileId,
  onToggle,
  onFileClick,
}: FolderSectionProps) {
  const fileCount = getDisplayFileCount(node);
  const indent = 10 + depth * 12;
  const isLoading = loadingFolders.has(node.path);

  return (
    <div>
      <button
        type="button"
        className="folder-header-btn"
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => onToggle(node.path)}
        aria-expanded={isExpanded}
        aria-label={`${node.name}, ${fileCount} files`}
      >
        <span className={`folder-chevron ${isExpanded ? 'open' : ''}`}>
          {isExpanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
        </span>
        {isExpanded ? <FolderOpen size={14} className="ws-folder-icon" aria-hidden /> : <Folder size={14} className="ws-folder-icon" aria-hidden />}
        <span className="file-name-text">{node.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9ca3af', flexShrink: 0, paddingLeft: '4px' }}>
          {fileCount}
        </span>
      </button>
      {isExpanded ? (
        <div>
          {isLoading ? (
            <div style={{ padding: '6px 12px 6px', paddingLeft: `${indent + 16}px`, fontSize: '11px', color: '#9ca3af' }}>
              Loading folder...
            </div>
          ) : null}
          {node.children.map((child) => (
            <FolderSection
              key={child.path}
              node={child}
              depth={depth + 1}
              isExpanded={expandedFolders.has(child.path)}
              expandedFolders={expandedFolders}
              loadingFolders={loadingFolders}
              activeFileId={activeFileId}
              onToggle={onToggle}
              onFileClick={onFileClick}
            />
          ))}
          {node.files.map((file) => (
            <button
              key={file.id}
              type="button"
              className={`file-row-btn ${activeFileId === file.id ? 'active' : ''}`}
              style={{ paddingLeft: `${indent + 16}px` }}
              onClick={() => onFileClick(file)}
              title={file.fileName}
            >
              <span className="ws-file-icon-wrap">{getFileIcon(file.fileName)}</span>
              <span className="file-name-text">{file.fileName}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface FileTreeProps {
  tree: FileTreeNode[];
  expandedFolders: Set<string>;
  loadingFolders?: Set<string>;
  activeFileId: string | undefined;
  onToggleFolder: (path: string) => void;
  onFileClick: (file: WsFile) => void;
}

export default function FileTree({
  tree,
  expandedFolders,
  loadingFolders = new Set<string>(),
  activeFileId,
  onToggleFolder,
  onFileClick,
}: FileTreeProps) {
  if (tree.length === 0) {
    return null;
  }

  return (
    <>
      {tree.map((node) => (
        <FolderSection
          key={node.path}
          node={node}
          depth={0}
          isExpanded={expandedFolders.has(node.path)}
          expandedFolders={expandedFolders}
          loadingFolders={loadingFolders}
          activeFileId={activeFileId}
          onToggle={onToggleFolder}
          onFileClick={onFileClick}
        />
      ))}
    </>
  );
}
