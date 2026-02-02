/**
 * R2 Storage Client
 * 
 * Handles external storage for large files (>= 100KB) via Cloudflare R2.
 * Compatible with S3 API.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import type { StorageClient as IStorageClient } from './types'

// Environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'appforge-files'

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)
}

/**
 * Create R2 client (S3-compatible)
 */
function createR2Client(): S3Client | null {
  if (!isR2Configured()) {
    console.warn('[Storage] R2 not configured - large files will be stored inline')
    return null
  }
  
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  })
}

/**
 * R2 Storage Client Implementation
 */
export class StorageClient implements IStorageClient {
  private client: S3Client | null
  private bucket: string
  
  constructor() {
    this.client = createR2Client()
    this.bucket = R2_BUCKET_NAME
  }
  
  /**
   * Check if storage is available
   */
  get isAvailable(): boolean {
    return this.client !== null
  }
  
  /**
   * Upload content to R2
   */
  async put(key: string, content: string | Buffer): Promise<void> {
    if (!this.client) {
      throw new Error('R2 storage not configured')
    }
    
    const body = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content
    
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: 'text/plain; charset=utf-8',
      })
    )
  }
  
  /**
   * Get content from R2
   */
  async get(key: string): Promise<string> {
    if (!this.client) {
      throw new Error('R2 storage not configured')
    }
    
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )
    
    if (!response.Body) {
      throw new Error(`Object not found: ${key}`)
    }
    
    return await response.Body.transformToString('utf-8')
  }
  
  /**
   * Delete content from R2
   */
  async delete(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('R2 storage not configured')
    }
    
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )
  }
  
  /**
   * Check if object exists in R2
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false
    }
    
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      return true
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false
      }
      throw error
    }
  }
  
  /**
   * Delete multiple objects
   */
  async deleteMany(keys: string[]): Promise<void> {
    if (!this.client || keys.length === 0) {
      return
    }
    
    // R2 supports batch delete, but we'll do it sequentially for simplicity
    await Promise.all(keys.map(key => this.delete(key)))
  }
}

// Singleton instance
let storageInstance: StorageClient | null = null

/**
 * Get storage client singleton
 */
export function getStorageClient(): StorageClient {
  if (!storageInstance) {
    storageInstance = new StorageClient()
  }
  return storageInstance
}

/**
 * Generate storage key for a project file
 * 
 * ISOLATION BY USER:
 * Pattern: users/{userId}/projects/{projectId}/files/{path}
 * This ensures complete isolation between users in R2 storage.
 * 
 * @param userId - The owner's user ID (required for isolation)
 * @param projectId - The project ID
 * @param path - File path within the project
 */
export function getStorageKey(userId: string, projectId: string, path: string): string {
  // Validate inputs to prevent path traversal attacks
  if (!userId || userId.includes('/') || userId.includes('..')) {
    throw new Error('Invalid userId for storage key')
  }
  if (!projectId || projectId.includes('/') || projectId.includes('..')) {
    throw new Error('Invalid projectId for storage key')
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  // Sanitize path to prevent traversal
  const sanitizedPath = normalizedPath.replace(/\.\./g, '')
  
  return `users/${userId}/projects/${projectId}/files${sanitizedPath}`
}

/**
 * Legacy storage key generator (deprecated)
 * 
 * @deprecated Use getStorageKey(userId, projectId, path) instead
 * This function is kept for backward compatibility during migration.
 */
export function getLegacyStorageKey(projectId: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `projects/${projectId}/files${normalizedPath}`
}
