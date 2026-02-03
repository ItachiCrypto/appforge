/**
 * Legacy File Adapter
 * 
 * Allows AI tools to work with legacy App model (JSON files storage)
 * instead of requiring the new Project model.
 * 
 * This enables gradual migration from Apps to Projects while
 * still benefiting from tool-based file access.
 * 
 * @author IMPL-AI-TOOLS Agent
 */

import { prisma } from '@/lib/prisma'

// ============ Types ============

export interface LegacyFileInfo {
  path: string
  filename: string
  extension: string | null
  sizeBytes: number
  isDirectory: boolean
}

export interface LegacySearchResult {
  path: string
  filename: string
  matches: Array<{ line: number; content: string }>
  totalMatches: number
}

// ============ Errors ============

export class LegacyFileNotFoundError extends Error {
  path: string
  appId: string
  
  constructor(appId: string, path: string) {
    super(`File not found: ${path}`)
    this.name = 'LegacyFileNotFoundError'
    this.path = path
    this.appId = appId
  }
}

export class LegacyAppNotFoundError extends Error {
  appId: string
  
  constructor(appId: string) {
    super(`App not found: ${appId}`)
    this.name = 'LegacyAppNotFoundError'
    this.appId = appId
  }
}

// ============ Legacy File Adapter ============

export class LegacyFileAdapter {
  
  /**
   * Get all files from an App as a Record<string, string>
   * FIX BUG #7: Returns normalized and deduplicated files
   */
  private async getAppFiles(appId: string): Promise<Record<string, string>> {
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { files: true },
    })
    
    if (!app) {
      throw new LegacyAppNotFoundError(appId)
    }
    
    const rawFiles = (app.files as Record<string, string>) || {}
    
    // FIX BUG #7: Normalize all paths on read and deduplicate
    return this.normalizeAllPaths(rawFiles)
  }
  
  /**
   * Save files back to the App
   * FIX BUG #7: Always normalize paths before saving
   */
  private async saveAppFiles(appId: string, files: Record<string, string>): Promise<void> {
    // FIX BUG #7: Normalize all paths before saving to prevent duplicates
    const normalizedFiles = this.normalizeAllPaths(files)
    
    await prisma.app.update({
      where: { id: appId },
      data: { files: normalizedFiles },
    })
  }
  
  /**
   * Normalize path to always start with /
   */
  private normalizePath(path: string): string {
    // Trim whitespace
    let normalized = path.trim()
    // Ensure leading /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized
    }
    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/')
    // Remove trailing slash (except for root)
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }
    return normalized
  }
  
  /**
   * FIX BUG #7: Normalize all paths in a files object and remove duplicates
   * If both /path and path exist, prefer the one with content (or /path)
   */
  private normalizeAllPaths(files: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {}
    
    for (const [path, content] of Object.entries(files)) {
      const normalizedPath = this.normalizePath(path)
      
      // If path already exists, prefer the one with content
      if (normalized[normalizedPath] !== undefined) {
        // Keep existing if it has content and new one doesn't
        if (normalized[normalizedPath] && !content) {
          continue
        }
      }
      
      normalized[normalizedPath] = content
    }
    
    return normalized
  }
  
  /**
   * Get filename from path
   */
  private getFilename(path: string): string {
    const parts = path.split('/')
    return parts[parts.length - 1]
  }
  
  /**
   * Get extension from filename
   */
  private getExtension(filename: string): string | null {
    const parts = filename.split('.')
    return parts.length > 1 ? '.' + parts[parts.length - 1] : null
  }
  
  // ============ File Operations ============
  
  /**
   * List all files in the app
   */
  async listFiles(appId: string, directory?: string): Promise<LegacyFileInfo[]> {
    const files = await this.getAppFiles(appId)
    
    let filteredPaths = Object.keys(files)
    
    // Filter by directory if specified
    if (directory) {
      const normalizedDir = this.normalizePath(directory)
      filteredPaths = filteredPaths.filter(p => {
        const normalized = this.normalizePath(p)
        return normalized.startsWith(normalizedDir)
      })
    }
    
    return filteredPaths.map(path => {
      const normalizedPath = this.normalizePath(path)
      const filename = this.getFilename(normalizedPath)
      const content = files[path] || ''
      
      return {
        path: normalizedPath,
        filename,
        extension: this.getExtension(filename),
        sizeBytes: Buffer.byteLength(content, 'utf8'),
        isDirectory: false,
      }
    })
  }
  
  /**
   * Read a file's content
   */
  async readFile(appId: string, path: string): Promise<string> {
    const files = await this.getAppFiles(appId)
    const normalizedPath = this.normalizePath(path)
    
    // Try exact path first
    if (files[normalizedPath] !== undefined) {
      return files[normalizedPath]
    }
    
    // Try without leading /
    const pathWithoutSlash = normalizedPath.slice(1)
    if (files[pathWithoutSlash] !== undefined) {
      return files[pathWithoutSlash]
    }
    
    throw new LegacyFileNotFoundError(appId, path)
  }
  
  /**
   * Write/create a file
   */
  async writeFile(appId: string, path: string, content: string): Promise<{ created: boolean }> {
    const files = await this.getAppFiles(appId)
    const normalizedPath = this.normalizePath(path)
    
    const existed = files[normalizedPath] !== undefined || files[normalizedPath.slice(1)] !== undefined
    
    // Always use normalized path with /
    files[normalizedPath] = content
    
    // Remove the non-normalized version if it exists
    const pathWithoutSlash = normalizedPath.slice(1)
    if (files[pathWithoutSlash] !== undefined) {
      delete files[pathWithoutSlash]
    }
    
    await this.saveAppFiles(appId, files)
    
    return { created: !existed }
  }
  
  /**
   * Update an existing file
   */
  async updateFile(appId: string, path: string, content: string): Promise<void> {
    const files = await this.getAppFiles(appId)
    const normalizedPath = this.normalizePath(path)
    
    // Check if file exists
    const exists = files[normalizedPath] !== undefined || files[normalizedPath.slice(1)] !== undefined
    
    if (!exists) {
      throw new LegacyFileNotFoundError(appId, path)
    }
    
    // Update with normalized path
    files[normalizedPath] = content
    
    // Clean up non-normalized version
    const pathWithoutSlash = normalizedPath.slice(1)
    if (files[pathWithoutSlash] !== undefined) {
      delete files[pathWithoutSlash]
    }
    
    await this.saveAppFiles(appId, files)
  }
  
  /**
   * Delete a file
   */
  async deleteFile(appId: string, path: string): Promise<void> {
    const files = await this.getAppFiles(appId)
    const normalizedPath = this.normalizePath(path)
    
    delete files[normalizedPath]
    delete files[normalizedPath.slice(1)] // Also try without /
    
    await this.saveAppFiles(appId, files)
  }
  
  /**
   * Rename/move a file
   */
  async renameFile(appId: string, fromPath: string, toPath: string): Promise<void> {
    const content = await this.readFile(appId, fromPath)
    await this.writeFile(appId, toPath, content)
    await this.deleteFile(appId, fromPath)
  }
  
  /**
   * FIX NEW-BUG-3: Escape special regex characters before glob conversion
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  }
  
  /**
   * Search for text in files
   */
  async searchFiles(appId: string, query: string, glob?: string): Promise<LegacySearchResult[]> {
    const files = await this.getAppFiles(appId)
    const results: LegacySearchResult[] = []
    
    for (const [path, content] of Object.entries(files)) {
      if (!content) continue
      
      // Apply glob filter if specified
      if (glob) {
        // FIX NEW-BUG-3: Escape regex special chars, then convert * to .*
        const escapedGlob = this.escapeRegex(glob).replace(/\\\*/g, '.*')
        try {
          if (!new RegExp(escapedGlob).test(path)) {
            continue
          }
        } catch (e) {
          // Invalid regex pattern, skip filtering
          console.warn('[searchFiles] Invalid glob pattern:', glob, e)
        }
      }
      
      // Search for matches
      const lines = content.split('\n')
      const matches: Array<{ line: number; content: string }> = []
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          matches.push({
            line: index + 1,
            content: line.trim(),
          })
        }
      })
      
      if (matches.length > 0) {
        const normalizedPath = this.normalizePath(path)
        results.push({
          path: normalizedPath,
          filename: this.getFilename(normalizedPath),
          matches,
          totalMatches: matches.length,
        })
      }
    }
    
    return results
  }
  
  /**
   * Get app/project info
   */
  async getAppInfo(appId: string): Promise<{
    id: string
    name: string
    description: string | null
    type: string
    fileCount: number
    totalSizeBytes: number
  }> {
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        files: true,
      },
    })
    
    if (!app) {
      throw new LegacyAppNotFoundError(appId)
    }
    
    const files = (app.files as Record<string, string>) || {}
    const filePaths = Object.keys(files)
    
    let totalSize = 0
    for (const content of Object.values(files)) {
      if (content) {
        totalSize += Buffer.byteLength(content, 'utf8')
      }
    }
    
    return {
      id: app.id,
      name: app.name,
      description: app.description,
      type: app.type,
      fileCount: filePaths.length,
      totalSizeBytes: totalSize,
    }
  }
}

// ============ Singleton ============

let adapterInstance: LegacyFileAdapter | null = null

export function getLegacyFileAdapter(): LegacyFileAdapter {
  if (!adapterInstance) {
    adapterInstance = new LegacyFileAdapter()
  }
  return adapterInstance
}
