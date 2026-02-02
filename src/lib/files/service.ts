/**
 * FileService - Core file management service
 * 
 * Handles CRUD operations for project files with:
 * - Inline storage for small files (<100KB)
 * - External storage (R2/S3) for large files
 * - Version history tracking
 * - Quota enforcement
 */

import { prisma } from '@/lib/prisma'
import { File, ChangeType } from '@prisma/client'
import {
  FileInfo,
  FileData,
  CreateFileInput,
  UpdateFileInput,
  SearchResult,
  BulkOperation,
  BulkOperationResult,
  INLINE_STORAGE_THRESHOLD,
} from './types'
import {
  validatePath,
  normalizePath,
  getFilename,
  getExtension,
  getMimeType,
  hashContent,
  hasContentChanged,
  findMatches,
} from './utils'
import {
  checkStorageQuota,
  checkFileSizeLimit,
  updateStorageUsage,
  QuotaExceededError,
  FileSizeExceededError,
} from './quota'
import { getStorageClient, getStorageKey, getLegacyStorageKey } from './storage'

// ============ Errors ============

export class FileNotFoundError extends Error {
  path: string
  projectId: string
  
  constructor(projectId: string, path: string) {
    super(`File not found: ${path}`)
    this.name = 'FileNotFoundError'
    this.path = path
    this.projectId = projectId
  }
}

export class FileAlreadyExistsError extends Error {
  path: string
  projectId: string
  
  constructor(projectId: string, path: string) {
    super(`File already exists: ${path}`)
    this.name = 'FileAlreadyExistsError'
    this.path = path
    this.projectId = projectId
  }
}

export class InvalidPathError extends Error {
  path: string
  reason: string
  
  constructor(path: string, reason: string) {
    super(`Invalid path "${path}": ${reason}`)
    this.name = 'InvalidPathError'
    this.path = path
    this.reason = reason
  }
}

export class ProjectNotFoundError extends Error {
  projectId: string
  
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`)
    this.name = 'ProjectNotFoundError'
    this.projectId = projectId
  }
}

// ============ FileService Class ============

export class FileService {
  private storage = getStorageClient()
  
  // ============ Create ============
  
  /**
   * Create a new file in a project
   */
  async createFile(
    projectId: string,
    path: string,
    content: string,
    options: { isGenerated?: boolean } = {}
  ): Promise<FileData> {
    // Validate path
    const normalizedPath = normalizePath(path)
    const pathError = validatePath(normalizedPath)
    if (pathError) {
      throw new InvalidPathError(path, pathError)
    }
    
    // Get project and user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true },
    })
    
    if (!project) {
      throw new ProjectNotFoundError(projectId)
    }
    
    // Check if file already exists
    const existing = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedPath } },
    })
    
    if (existing) {
      throw new FileAlreadyExistsError(projectId, normalizedPath)
    }
    
    // Calculate content size
    const contentBytes = Buffer.byteLength(content, 'utf8')
    
    // Check file size limit
    const fileSizeCheck = await checkFileSizeLimit(project.userId, contentBytes)
    if (!fileSizeCheck.allowed) {
      throw new FileSizeExceededError(contentBytes, fileSizeCheck.maxSize)
    }
    
    // Check storage quota
    const quotaCheck = await checkStorageQuota(project.userId, contentBytes)
    if (!quotaCheck.allowed) {
      throw new QuotaExceededError(quotaCheck)
    }
    
    // Determine storage strategy
    const isLarge = contentBytes > INLINE_STORAGE_THRESHOLD && this.storage.isAvailable
    let storageKey: string | null = null
    let storedContent: string | null = content
    
    if (isLarge) {
      // Use userId-scoped storage key for isolation
      storageKey = getStorageKey(project.userId, projectId, normalizedPath)
      await this.storage.put(storageKey, content)
      storedContent = null
    }
    
    // Generate content hash
    const contentHash = hashContent(content)
    
    // Create file record
    const file = await prisma.file.create({
      data: {
        path: normalizedPath,
        filename: getFilename(normalizedPath),
        extension: getExtension(normalizedPath),
        mimeType: getMimeType(normalizedPath),
        content: storedContent,
        storageKey,
        sizeBytes: contentBytes,
        contentHash,
        projectId,
        isGenerated: options.isGenerated ?? true,
      },
    })
    
    // Update project stats and user storage
    await this.updateProjectStats(projectId)
    await updateStorageUsage(project.userId)
    
    return this.toFileData(file, content)
  }
  
  // ============ Read ============
  
  /**
   * Read file content
   */
  async readFile(projectId: string, path: string): Promise<string> {
    const normalizedPath = normalizePath(path)
    
    const file = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedPath } },
    })
    
    if (!file) {
      throw new FileNotFoundError(projectId, normalizedPath)
    }
    
    // If stored inline
    if (file.content) {
      return file.content
    }
    
    // If stored in R2
    if (file.storageKey && this.storage.isAvailable) {
      return await this.storage.get(file.storageKey)
    }
    
    throw new Error('File content not found')
  }
  
  /**
   * Get file metadata without content
   */
  async getFileInfo(projectId: string, path: string): Promise<FileInfo> {
    const normalizedPath = normalizePath(path)
    
    const file = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedPath } },
    })
    
    if (!file) {
      throw new FileNotFoundError(projectId, normalizedPath)
    }
    
    return this.toFileInfo(file)
  }
  
  // ============ Update ============
  
  /**
   * Update an existing file
   */
  async updateFile(
    projectId: string,
    path: string,
    content: string,
    options: UpdateFileInput = {}
  ): Promise<FileData> {
    const normalizedPath = normalizePath(path)
    
    const existing = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedPath } },
      include: { project: { include: { user: true } } },
    })
    
    if (!existing) {
      // Create if doesn't exist (upsert behavior)
      return this.createFile(projectId, path, content)
    }
    
    const newSizeBytes = Buffer.byteLength(content, 'utf8')
    const sizeDiff = newSizeBytes - existing.sizeBytes
    
    // Check quota if size increases
    if (sizeDiff > 0) {
      const quotaCheck = await checkStorageQuota(existing.project.userId, sizeDiff)
      if (!quotaCheck.allowed) {
        throw new QuotaExceededError(quotaCheck)
      }
    }
    
    // Check if content actually changed
    const newHash = hashContent(content)
    if (newHash === existing.contentHash) {
      // No change, return existing
      return this.toFileData(existing, content)
    }
    
    // Create version before update
    await this.createFileVersion(existing, ChangeType.MODIFIED, options.changeMessage)
    
    // Determine storage strategy
    const isLarge = newSizeBytes > INLINE_STORAGE_THRESHOLD && this.storage.isAvailable
    let storageKey: string | null = existing.storageKey
    let storedContent: string | null = content
    
    if (isLarge) {
      // Use userId-scoped storage key for isolation
      storageKey = storageKey || getStorageKey(existing.project.userId, projectId, normalizedPath)
      await this.storage.put(storageKey, content)
      storedContent = null
    } else if (existing.storageKey && this.storage.isAvailable) {
      // Was in R2, now small enough for inline
      await this.storage.delete(existing.storageKey)
      storageKey = null
    }
    
    // Update file
    const updated = await prisma.file.update({
      where: { id: existing.id },
      data: {
        content: storedContent,
        storageKey,
        sizeBytes: newSizeBytes,
        contentHash: newHash,
      },
    })
    
    // Update stats
    await this.updateProjectStats(projectId)
    await updateStorageUsage(existing.project.userId)
    
    return this.toFileData(updated, content)
  }
  
  /**
   * Update or create a file (upsert)
   */
  async upsertFile(
    projectId: string,
    path: string,
    content: string
  ): Promise<{ file: FileData; created: boolean }> {
    const normalizedPath = normalizePath(path)
    
    const existing = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedPath } },
    })
    
    if (existing) {
      const file = await this.updateFile(projectId, path, content)
      return { file, created: false }
    } else {
      const file = await this.createFile(projectId, path, content)
      return { file, created: true }
    }
  }
  
  // ============ Delete ============
  
  /**
   * Delete a file
   */
  async deleteFile(projectId: string, path: string): Promise<void> {
    const normalizedPath = normalizePath(path)
    
    const file = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedPath } },
      include: { project: true },
    })
    
    if (!file) {
      return // Idempotent - already deleted
    }
    
    // Create version for potential recovery
    await this.createFileVersion(file, ChangeType.DELETED)
    
    // Delete from R2 if needed
    if (file.storageKey && this.storage.isAvailable) {
      await this.storage.delete(file.storageKey)
    }
    
    // Delete file record
    await prisma.file.delete({
      where: { id: file.id },
    })
    
    // Update stats
    await this.updateProjectStats(projectId)
    await updateStorageUsage(file.project.userId)
  }
  
  // ============ List ============
  
  /**
   * List all files in a project
   */
  async listFiles(projectId: string, directory?: string): Promise<FileInfo[]> {
    const where: any = { projectId }
    
    if (directory) {
      const normalizedDir = normalizePath(directory)
      where.path = { startsWith: normalizedDir }
    }
    
    const files = await prisma.file.findMany({
      where,
      orderBy: { path: 'asc' },
    })
    
    return files.map(f => this.toFileInfo(f))
  }
  
  // ============ Search ============
  
  /**
   * Search for text in project files
   */
  async searchFiles(
    projectId: string,
    query: string,
    filePattern?: string
  ): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
      return []
    }
    
    const where: any = {
      projectId,
      content: { contains: query, mode: 'insensitive' },
    }
    
    if (filePattern) {
      // Convert glob to SQL pattern
      where.path = { endsWith: filePattern.replace('*', '') }
    }
    
    const files = await prisma.file.findMany({
      where,
      select: {
        path: true,
        filename: true,
        content: true,
      },
      take: 50, // Limit results
    })
    
    return files.map(f => ({
      path: f.path,
      filename: f.filename,
      matches: f.content ? findMatches(f.content, query) : [],
      totalMatches: f.content ? findMatches(f.content, query).length : 0,
    }))
  }
  
  // ============ Bulk Operations ============
  
  /**
   * Execute multiple file operations
   */
  async bulkOperations(
    projectId: string,
    operations: BulkOperation[]
  ): Promise<BulkOperationResult[]> {
    const results: BulkOperationResult[] = []
    
    for (const op of operations) {
      try {
        switch (op.type) {
          case 'create':
            await this.createFile(projectId, op.path, op.content)
            results.push({ operation: op, success: true })
            break
          
          case 'update':
            await this.updateFile(projectId, op.path, op.content)
            results.push({ operation: op, success: true })
            break
          
          case 'delete':
            await this.deleteFile(projectId, op.path)
            results.push({ operation: op, success: true })
            break
          
          case 'rename':
            await this.renameFile(projectId, op.from, op.to)
            results.push({ operation: op, success: true })
            break
        }
      } catch (error) {
        results.push({
          operation: op,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
    
    return results
  }
  
  // ============ Move/Rename ============
  
  /**
   * Rename or move a file
   */
  async renameFile(projectId: string, fromPath: string, toPath: string): Promise<FileData> {
    const normalizedFrom = normalizePath(fromPath)
    const normalizedTo = normalizePath(toPath)
    
    // Validate new path
    const pathError = validatePath(normalizedTo)
    if (pathError) {
      throw new InvalidPathError(toPath, pathError)
    }
    
    // Check source exists (include project for userId)
    const file = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedFrom } },
      include: { project: true },
    })
    
    if (!file) {
      throw new FileNotFoundError(projectId, normalizedFrom)
    }
    
    // Check destination doesn't exist
    const destExists = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedTo } },
    })
    
    if (destExists) {
      throw new FileAlreadyExistsError(projectId, normalizedTo)
    }
    
    // Create version before rename
    await this.createFileVersion(file, ChangeType.RENAMED)
    
    // Update storage key if in R2 (use userId-scoped key for isolation)
    let newStorageKey = file.storageKey
    if (file.storageKey && this.storage.isAvailable) {
      const content = await this.storage.get(file.storageKey)
      newStorageKey = getStorageKey(file.project.userId, projectId, normalizedTo)
      await this.storage.put(newStorageKey, content)
      await this.storage.delete(file.storageKey)
    }
    
    // Update file
    const updated = await prisma.file.update({
      where: { id: file.id },
      data: {
        path: normalizedTo,
        filename: getFilename(normalizedTo),
        extension: getExtension(normalizedTo),
        mimeType: getMimeType(normalizedTo),
        storageKey: newStorageKey,
      },
    })
    
    // Read content for return
    const content = file.content || (file.storageKey ? await this.storage.get(newStorageKey!) : '')
    
    return this.toFileData(updated, content)
  }
  
  // ============ Versions ============
  
  /**
   * Get version history for a file
   */
  async getFileVersions(projectId: string, path: string): Promise<Array<{
    version: number
    changeType: ChangeType
    changeMessage: string | null
    createdAt: Date
  }>> {
    const normalizedPath = normalizePath(path)
    
    const file = await prisma.file.findUnique({
      where: { projectId_path: { projectId, path: normalizedPath } },
    })
    
    if (!file) {
      throw new FileNotFoundError(projectId, normalizedPath)
    }
    
    return prisma.fileVersion.findMany({
      where: { fileId: file.id },
      select: {
        version: true,
        changeType: true,
        changeMessage: true,
        createdAt: true,
      },
      orderBy: { version: 'desc' },
    })
  }
  
  // ============ Helpers ============
  
  /**
   * Update project stats after file changes
   */
  private async updateProjectStats(projectId: string): Promise<void> {
    const stats = await prisma.file.aggregate({
      where: { projectId },
      _count: true,
      _sum: { sizeBytes: true },
    })
    
    await prisma.project.update({
      where: { id: projectId },
      data: {
        fileCount: stats._count,
        totalSizeBytes: BigInt(stats._sum.sizeBytes || 0),
      },
    })
  }
  
  /**
   * Create a version record before modifying a file
   */
  private async createFileVersion(
    file: File,
    changeType: ChangeType,
    message?: string
  ): Promise<void> {
    // Get next version number
    const lastVersion = await prisma.fileVersion.findFirst({
      where: { fileId: file.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    
    const nextVersion = (lastVersion?.version || 0) + 1
    
    // Get content for the version
    let content = file.content
    if (!content && file.storageKey && this.storage.isAvailable) {
      content = await this.storage.get(file.storageKey)
    }
    
    await prisma.fileVersion.create({
      data: {
        version: nextVersion,
        content,
        sizeBytes: file.sizeBytes,
        contentHash: file.contentHash || '',
        changeType,
        changeMessage: message,
        fileId: file.id,
      },
    })
  }
  
  /**
   * Convert Prisma File to FileInfo
   */
  private toFileInfo(file: File): FileInfo {
    return {
      path: file.path,
      filename: file.filename,
      extension: file.extension,
      sizeBytes: file.sizeBytes,
      isDirectory: file.isDirectory,
      updatedAt: file.updatedAt,
    }
  }
  
  /**
   * Convert Prisma File to FileData
   */
  private toFileData(file: File, content: string): FileData {
    return {
      id: file.id,
      projectId: file.projectId,
      path: file.path,
      filename: file.filename,
      extension: file.extension,
      mimeType: file.mimeType,
      content: file.content,
      storageKey: file.storageKey,
      sizeBytes: file.sizeBytes,
      contentHash: file.contentHash,
      isDirectory: file.isDirectory,
      isGenerated: file.isGenerated,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }
  }
}

// ============ Singleton Instance ============

let fileServiceInstance: FileService | null = null

export function getFileService(): FileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new FileService()
  }
  return fileServiceInstance
}

// Reset for testing
export function resetFileService(): void {
  fileServiceInstance = null
}
