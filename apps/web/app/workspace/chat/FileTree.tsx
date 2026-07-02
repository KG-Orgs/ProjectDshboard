'use client';

import { ReactNode, useMemo } from 'react';
import { ChevronDown, ChevronRight, File, FileImage, FileSpreadsheet, FileText, Folder, FolderOpen } from 'lucide-react';

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

function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      files: [...node.files].sort((a, b) => a.fileName.localeCompare(b.fileName)),
      children: sortTree(node.children),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Build a nested folder tree from file_records paths (OneDrive-relative paths). */
export function buildNestedFolderTree(files: WsFile[]): FileTreeNode[] {
  const root: FileTreeNode = { name: '', path: '', files: [], children: [] };

  for (const file of files) {
    const parts = file.filePath.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length > 0 && parts[parts.length - 1] === file.fileName) {
      parts.pop();
    }

    let current = root;
    let pathSoFar = '';

    for (const segment of parts) {
      pathSoFar = pathSoFar ? `${pathSoFar}/${segment}` : segment;
      let child = current.children.find((node) => node.name === segment);
      if (!child) {
        child = { name: segment, path: pathSoFar, files: [], children: [] };
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
    });
  }

  return topLevel;
}

function countFiles(node: FileTreeNode): number {
  return node.files.length + node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

interface FolderSectionProps {
  node: FileTreeNode;
  depth: number;
  isExpanded: boolean;
  expandedFolders: Set<string>;
  activeFileId: string | undefined;
  onToggle: (path: string) => void;
  onFileClick: (file: WsFile) => void;
}

function FolderSection({
  node,
  depth,
  isExpanded,
  expandedFolders,
  activeFileId,
  onToggle,
  onFileClick,
}: FolderSectionProps) {
  const fileCount = countFiles(node);
  const indent = 10 + depth * 12;

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
          {node.children.map((child) => (
            <FolderSection
              key={child.path}
              node={child}
              depth={depth + 1}
              isExpanded={expandedFolders.has(child.path)}
              expandedFolders={expandedFolders}
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
  files: WsFile[];
  expandedFolders: Set<string>;
  activeFileId: string | undefined;
  onToggleFolder: (path: string) => void;
  onFileClick: (file: WsFile) => void;
}

export default function FileTree({
  files,
  expandedFolders,
  activeFileId,
  onToggleFolder,
  onFileClick,
}: FileTreeProps) {
  const tree = useMemo(() => buildNestedFolderTree(files), [files]);

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
          activeFileId={activeFileId}
          onToggle={onToggleFolder}
          onFileClick={onFileClick}
        />
      ))}
    </>
  );
}
