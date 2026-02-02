/**
 * FileService Module
 * 
 * Central export for all file management functionality.
 */

// Service
export { FileService, getFileService, resetFileService } from './service'
export {
  FileNotFoundError,
  FileAlreadyExistsError,
  InvalidPathError,
  ProjectNotFoundError,
} from './service'

// Quota
export {
  PLAN_QUOTAS,
  getPlanQuota,
  checkStorageQuota,
  checkFileSizeLimit,
  checkProjectLimit,
  checkProjectTypeAllowed,
  checkFileCountLimit,
  updateStorageUsage,
  getStorageBreakdown,
  syncUserQuotaWithPlan,
  UserNotFoundError,
  QuotaExceededError,
  FileSizeExceededError,
  ProjectLimitExceededError,
  ProjectTypeNotAllowedError,
} from './quota'
export type { Plan, PlanQuota, QuotaCheckResult } from './quota'

// Storage
export { 
  StorageClient, 
  getStorageClient, 
  getStorageKey, 
  getLegacyStorageKey,
  isR2Configured,
} from './storage'

// Types
export type {
  ChangeType,
  FileInfo,
  FileData,
  CreateFileInput,
  UpdateFileInput,
  SearchMatch,
  SearchResult,
  BulkOperation,
  BulkOperationResult,
  ProjectType,
  ProjectStatus,
  FileVersionInfo,
  ProjectVersionInfo,
  StorageStrategy,
  StorageClient as IStorageClient,
  ListFilesResponse,
  FileContentResponse,
  FileMutationResponse,
  AIListFilesResult,
  AIReadFileResult,
  AIWriteFileResult,
  AIDeleteFileResult,
  AIMoveFileResult,
  AISearchFilesResult,
} from './types'
export { INLINE_STORAGE_THRESHOLD } from './types'

// Utils
export {
  validatePath,
  isValidPath,
  normalizePath,
  getParentPath,
  getFilename,
  getExtension,
  getMimeType,
  isTextFile,
  getLanguage,
  hashContent,
  hasContentChanged,
  findMatches,
  formatBytes,
  parseBytes,
  buildFileTree,
} from './utils'
export type { FileTreeNode } from './utils'
