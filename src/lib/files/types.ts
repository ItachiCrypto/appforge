/**
 * Types and Interfaces for FileService
 * 
 * Central type definitions for the file management system.
 */

// ============ File Types ============

/**
 * Change type for file versions
 */
export type ChangeType = 'CREATED' | 'MODIFIED' | 'DELETED' | 'RENAMED'

/**
 * Minimal file info for listings
 */
export interface FileInfo {
  path: string
  filename: string
  extension: string | null
  sizeBytes: number
  isDirectory: boolean
  updatedAt: Date
}

/**
 * Full file data including content
 */
export interface FileData extends FileInfo {
  id: string
  projectId: string
  content: string | null
  storageKey: string | null
  mimeType: string | null
  contentHash: string | null
  isGenerated: boolean
  createdAt: Date
}

/**
 * Input for creating a file
 */
export interface CreateFileInput {
  path: string
  content: string
  isGenerated?: boolean
}

/**
 * Input for updating a file
 * Note: content is passed as a separate parameter in the service method
 */
export interface UpdateFileInput {
  content?: string  // Optional - passed separately in service method
  changeMessage?: string
}

/**
 * Search result with match context
 */
export interface SearchMatch {
  line: number
  column: number
  lineContent: string
  matchStart: number
  matchEnd: number
}

export interface SearchResult {
  path: string
  filename: string
  matches: SearchMatch[]
  totalMatches: number
}

/**
 * Bulk operation types
 */
export type BulkOperation = 
  | { type: 'create'; path: string; content: string }
  | { type: 'update'; path: string; content: string }
  | { type: 'delete'; path: string }
  | { type: 'rename'; from: string; to: string }

export interface BulkOperationResult {
  operation: BulkOperation
  success: boolean
  error?: string
}

// ============ Project Types ============

/**
 * Project type enum (matches Prisma enum)
 */
export type ProjectType = 
  | 'NEXTJS'
  | 'REACT'
  | 'VUE'
  | 'SVELTE'
  | 'STATIC'
  | 'EXPRESS'
  | 'API'

/**
 * Project status enum (matches Prisma enum)
 */
export type ProjectStatus = 
  | 'DRAFT'
  | 'BUILDING'
  | 'PREVIEW'
  | 'DEPLOYED'
  | 'ARCHIVED'
  | 'ERROR'

// ============ Version Types ============

/**
 * File version info
 */
export interface FileVersionInfo {
  id: string
  version: number
  changeType: ChangeType
  changeMessage: string | null
  sizeBytes: number
  contentHash: string
  createdAt: Date
}

/**
 * Project snapshot (like git commit)
 */
export interface ProjectVersionInfo {
  id: string
  version: number
  message: string | null
  totalFiles: number
  totalSizeBytes: bigint
  createdAt: Date
}

// ============ Storage Types ============

/**
 * Storage strategy based on file size
 */
export type StorageStrategy = 'inline' | 'external'

/**
 * Threshold for inline vs external storage (100KB)
 */
export const INLINE_STORAGE_THRESHOLD = 100 * 1024

/**
 * Storage client interface (for R2/S3)
 */
export interface StorageClient {
  put(key: string, content: string | Buffer): Promise<void>
  get(key: string): Promise<string>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

// ============ API Types ============

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string
  code: string
  details?: Record<string, unknown>
}

/**
 * List files response
 */
export interface ListFilesResponse {
  files: FileInfo[]
  totalCount: number
  totalSizeBytes: number
}

/**
 * File content response
 */
export interface FileContentResponse {
  path: string
  content: string
  sizeBytes: number
  mimeType: string | null
  contentHash: string | null
  updatedAt: Date
}

/**
 * Create/Update file response
 */
export interface FileMutationResponse {
  id: string
  path: string
  sizeBytes: number
  contentHash: string
  createdAt: Date
  updatedAt: Date
}

// ============ AI Tool Types ============

/**
 * AI tool result types for function calling
 */
export interface AIListFilesResult {
  files: Array<{
    path: string
    size: string  // Human-readable
    type: 'file' | 'directory'
  }>
  summary: string
}

export interface AIReadFileResult {
  path: string
  content: string
  language: string | null
}

export interface AIWriteFileResult {
  path: string
  created: boolean  // true if new file, false if updated
  sizeBytes: number
}

export interface AIDeleteFileResult {
  path: string
  deleted: boolean
}

export interface AIMoveFileResult {
  from: string
  to: string
  moved: boolean
}

export interface AISearchFilesResult {
  query: string
  results: Array<{
    path: string
    matches: number
    preview: string
  }>
  totalMatches: number
}
