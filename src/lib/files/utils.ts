/**
 * File Utilities
 * 
 * Helper functions for path validation, MIME types, hashing, etc.
 */

import { createHash } from 'crypto'
import { SearchMatch } from './types'

// ============ Path Validation ============

/**
 * Dangerous path patterns that could escape project directory
 */
const DANGEROUS_PATTERNS = [
  /\.\./,           // Parent directory traversal
  /^\/\//,          // Protocol-like paths
  /\0/,             // Null bytes
  /^~\//,           // Home directory
  /\\/,             // Backslashes (Windows paths)
]

/**
 * Reserved filenames (case-insensitive)
 */
const RESERVED_NAMES = [
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]

/**
 * Validate a file path
 * Returns null if valid, error message if invalid
 */
export function validatePath(path: string): string | null {
  // Must start with /
  if (!path.startsWith('/')) {
    return 'Path must start with /'
  }
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(path)) {
      return 'Invalid path: contains dangerous pattern'
    }
  }
  
  // Check path length
  if (path.length > 500) {
    return 'Path too long (max 500 characters)'
  }
  
  // Check each segment
  const segments = path.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return 'Path cannot be root only'
  }
  
  for (const segment of segments) {
    // Check segment length
    if (segment.length > 255) {
      return `Segment too long: ${segment.substring(0, 20)}...`
    }
    
    // Check for reserved names
    if (RESERVED_NAMES.includes(segment.toLowerCase())) {
      return `Reserved filename: ${segment}`
    }
    
    // Check for invalid characters
    if (!/^[a-zA-Z0-9._\-\[\]()@#$%&+=]+$/.test(segment)) {
      return `Invalid characters in: ${segment}`
    }
    
    // No hidden files starting with multiple dots
    if (segment.startsWith('..')) {
      return 'Invalid segment starting with ..'
    }
  }
  
  return null
}

/**
 * Check if a path is valid (boolean version)
 */
export function isValidPath(path: string): boolean {
  return validatePath(path) === null
}

/**
 * Normalize a path (remove trailing slashes, collapse multiple slashes)
 */
export function normalizePath(path: string): string {
  return '/' + path
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
}

/**
 * Get the parent directory of a path
 */
export function getParentPath(path: string): string {
  const normalized = normalizePath(path)
  const lastSlash = normalized.lastIndexOf('/')
  return lastSlash <= 0 ? '/' : normalized.substring(0, lastSlash)
}

/**
 * Get the filename from a path
 */
export function getFilename(path: string): string {
  const normalized = normalizePath(path)
  const lastSlash = normalized.lastIndexOf('/')
  return normalized.substring(lastSlash + 1)
}

/**
 * Get the extension from a path (including dot)
 */
export function getExtension(path: string): string | null {
  const filename = getFilename(path)
  const lastDot = filename.lastIndexOf('.')
  
  // No extension or hidden file with no extension
  if (lastDot <= 0) {
    return null
  }
  
  return filename.substring(lastDot)
}

// ============ MIME Types ============

/**
 * Common MIME types by extension
 */
const MIME_TYPES: Record<string, string> = {
  // JavaScript/TypeScript
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.cjs': 'application/javascript',
  '.jsx': 'text/jsx',
  '.ts': 'application/typescript',
  '.tsx': 'text/tsx',
  
  // Web
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.scss': 'text/x-scss',
  '.sass': 'text/x-sass',
  '.less': 'text/x-less',
  
  // Data
  '.json': 'application/json',
  '.jsonc': 'application/json',
  '.json5': 'application/json5',
  '.xml': 'application/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.toml': 'text/x-toml',
  
  // Markdown
  '.md': 'text/markdown',
  '.mdx': 'text/mdx',
  
  // Config
  '.env': 'text/plain',
  '.gitignore': 'text/plain',
  '.npmrc': 'text/plain',
  '.prettierrc': 'application/json',
  '.eslintrc': 'application/json',
  
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  
  // Other
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.sh': 'application/x-sh',
  '.sql': 'application/sql',
  '.graphql': 'application/graphql',
  '.prisma': 'text/x-prisma',
}

/**
 * Get MIME type for a path
 */
export function getMimeType(path: string): string {
  const ext = getExtension(path)?.toLowerCase()
  
  if (!ext) {
    return 'application/octet-stream'
  }
  
  return MIME_TYPES[ext] || 'application/octet-stream'
}

/**
 * Check if a file is text-based (can be stored inline)
 */
export function isTextFile(path: string): boolean {
  const mimeType = getMimeType(path)
  
  return (
    mimeType.startsWith('text/') ||
    mimeType.startsWith('application/javascript') ||
    mimeType.startsWith('application/typescript') ||
    mimeType.startsWith('application/json') ||
    mimeType.startsWith('application/xml') ||
    mimeType.startsWith('application/sql') ||
    mimeType.startsWith('application/graphql')
  )
}

/**
 * Get language identifier for syntax highlighting
 */
export function getLanguage(path: string): string | null {
  const ext = getExtension(path)?.toLowerCase()
  
  const LANGUAGES: Record<string, string> = {
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'javascriptreact',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.json': 'json',
    '.jsonc': 'jsonc',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.md': 'markdown',
    '.mdx': 'mdx',
    '.xml': 'xml',
    '.svg': 'xml',
    '.sh': 'shellscript',
    '.bash': 'shellscript',
    '.zsh': 'shellscript',
    '.sql': 'sql',
    '.graphql': 'graphql',
    '.gql': 'graphql',
    '.prisma': 'prisma',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.php': 'php',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
  }
  
  return ext ? LANGUAGES[ext] || null : null
}

// ============ Content Hashing ============

/**
 * Generate SHA-256 hash of content
 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Check if content has changed based on hash
 */
export function hasContentChanged(content: string, existingHash: string | null): boolean {
  if (!existingHash) {
    return true
  }
  return hashContent(content) !== existingHash
}

// ============ Content Search ============

/**
 * Find all occurrences of a query in content
 */
export function findMatches(content: string, query: string): SearchMatch[] {
  const matches: SearchMatch[] = []
  const lines = content.split('\n')
  const queryLower = query.toLowerCase()
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    const lineLower = line.toLowerCase()
    
    let searchStart = 0
    let matchIndex: number
    
    while ((matchIndex = lineLower.indexOf(queryLower, searchStart)) !== -1) {
      matches.push({
        line: lineIndex + 1,  // 1-indexed
        column: matchIndex + 1,  // 1-indexed
        lineContent: line.substring(
          Math.max(0, matchIndex - 30),
          Math.min(line.length, matchIndex + query.length + 30)
        ),
        matchStart: matchIndex,
        matchEnd: matchIndex + query.length,
      })
      
      searchStart = matchIndex + 1
    }
  }
  
  return matches
}

// ============ Size Formatting ============

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 0) return '-' + formatBytes(-bytes)
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * Parse human-readable size to bytes
 */
export function parseBytes(size: string): number {
  const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i)
  
  if (!match) {
    throw new Error(`Invalid size format: ${size}`)
  }
  
  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  
  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024,
  }
  
  return Math.floor(value * multipliers[unit])
}

// ============ Tree Building ============

/**
 * File tree node for UI rendering
 */
export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
  size?: number
  extension?: string | null
}

/**
 * Build a file tree from a flat list of paths
 */
export function buildFileTree(files: Array<{ path: string; sizeBytes: number }>): FileTreeNode {
  const root: FileTreeNode = {
    name: '/',
    path: '/',
    type: 'directory',
    children: [],
  }
  
  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean)
    let current = root
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const isLast = i === segments.length - 1
      const currentPath = '/' + segments.slice(0, i + 1).join('/')
      
      let child = current.children?.find(c => c.name === segment)
      
      if (!child) {
        child = {
          name: segment,
          path: currentPath,
          type: isLast ? 'file' : 'directory',
          children: isLast ? undefined : [],
          size: isLast ? file.sizeBytes : undefined,
          extension: isLast ? getExtension(file.path) : undefined,
        }
        current.children?.push(child)
      }
      
      current = child
    }
  }
  
  // Sort children: directories first, then alphabetically
  const sortNodes = (nodes?: FileTreeNode[]): void => {
    if (!nodes) return
    
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
    
    for (const node of nodes) {
      sortNodes(node.children)
    }
  }
  
  sortNodes(root.children)
  
  return root
}
