"use client"

import { useState, useMemo } from 'react'
import { useEditorStore } from '@/stores/editor'
import { cn } from '@/lib/utils'
import { 
  ChevronRight, 
  ChevronDown,
  File,
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen
} from 'lucide-react'

interface FileExplorerProps {
  files: Record<string, string>
  className?: string
  onFileSelect?: (path: string) => void
}

// Build tree structure from flat file paths
interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: TreeNode[]
}

function buildFileTree(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = []
  
  Object.keys(files).sort().forEach(path => {
    const parts = path.split('/').filter(Boolean)
    let current = root
    let currentPath = ''
    
    parts.forEach((part, index) => {
      currentPath += '/' + part
      const isFile = index === parts.length - 1
      
      let node = current.find(n => n.name === part)
      
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        }
        current.push(node)
      }
      
      if (!isFile && node.children) {
        current = node.children
      }
    })
  })
  
  // Sort: folders first, then files
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    }).map(node => ({
      ...node,
      children: node.children ? sortNodes(node.children) : undefined
    }))
  }
  
  return sortNodes(root)
}

// Get icon for file type
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-yellow-500" />
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-600" />
    case 'css':
    case 'scss':
    case 'sass':
      return <FileCode className="w-4 h-4 text-blue-500" />
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-gray-500" />
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-500" />
    default:
      return <File className="w-4 h-4 text-gray-400" />
  }
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  activeFile: string | null
  expandedFolders: Set<string>
  onSelect: (path: string) => void
  onToggleFolder: (path: string) => void
}

function TreeItem({ 
  node, 
  depth, 
  activeFile, 
  expandedFolders,
  onSelect,
  onToggleFolder 
}: TreeItemProps) {
  const isExpanded = expandedFolders.has(node.path)
  const isActive = node.path === activeFile
  
  const handleClick = () => {
    if (node.type === 'folder') {
      onToggleFolder(node.path)
    } else {
      onSelect(node.path)
    }
  }
  
  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center w-full px-2 py-1 text-sm rounded-md transition-colors",
          "hover:bg-muted/50",
          isActive && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 mr-2 text-yellow-500" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-yellow-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-4 mr-1" />
            <span className="mr-2">{getFileIcon(node.name)}</span>
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              expandedFolders={expandedFolders}
              onSelect={onSelect}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileExplorer({ files, className, onFileSelect }: FileExplorerProps) {
  const { activeFile, setActiveFile, openTab, expandedFolders, toggleFolder } = useEditorStore()
  
  const tree = useMemo(() => buildFileTree(files), [files])
  
  const handleFileSelect = (path: string) => {
    setActiveFile(path)
    openTab(path)
    onFileSelect?.(path)
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
        Fichiers
      </div>
      <div className="flex-1 overflow-auto py-2">
        {tree.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            Aucun fichier
          </div>
        ) : (
          tree.map(node => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              activeFile={activeFile}
              expandedFolders={expandedFolders}
              onSelect={handleFileSelect}
              onToggleFolder={toggleFolder}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default FileExplorer
