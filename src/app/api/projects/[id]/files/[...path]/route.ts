/**
 * Project File API - Read, Update, Delete
 * 
 * GET    /api/projects/:id/files/*path - Read file content
 * PUT    /api/projects/:id/files/*path - Update file
 * DELETE /api/projects/:id/files/*path - Delete file
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import {
  getFileService,
  FileNotFoundError,
  InvalidPathError,
  QuotaExceededError,
  FileSizeExceededError,
  getMimeType,
} from '@/lib/files'

type RouteParams = {
  params: {
    id: string
    path: string[]
  }
}

/**
 * Reconstruct file path from catch-all segments
 */
function getFilePath(pathSegments: string[]): string {
  return '/' + pathSegments.join('/')
}

// ============ GET - Read File ============

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    const projectId = params.id
    const filePath = getFilePath(params.path)
    
    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user: { clerkId },
      },
      select: {
        id: true,
        userId: true,
      },
    })
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }
    
    const fileService = getFileService()
    
    // Check if raw content requested
    const { searchParams } = new URL(request.url)
    const raw = searchParams.get('raw') === 'true'
    
    // Read file
    const content = await fileService.readFile(projectId, filePath)
    
    // Return raw content with appropriate content-type
    if (raw) {
      const mimeType = getMimeType(filePath)
      return new NextResponse(content, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'no-cache',
        },
      })
    }
    
    // Return JSON response with metadata
    const fileInfo = await fileService.getFileInfo(projectId, filePath)
    
    return NextResponse.json({
      path: filePath,
      content,
      sizeBytes: fileInfo.sizeBytes,
      mimeType: getMimeType(filePath),
      updatedAt: fileInfo.updatedAt,
    })
    
  } catch (error) {
    console.error('[API] GET /projects/:id/files/*path error:', error)
    
    if (error instanceof FileNotFoundError) {
      return NextResponse.json(
        { error: 'File not found', code: 'FILE_NOT_FOUND', path: error.path },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============ PUT - Update File ============

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    const projectId = params.id
    const filePath = getFilePath(params.path)
    
    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user: { clerkId },
      },
      select: {
        id: true,
        userId: true,
      },
    })
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { content, changeMessage } = body
    
    if (content === undefined || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }
    
    // Update file (creates if doesn't exist)
    const fileService = getFileService()
    const file = await fileService.updateFile(projectId, filePath, content, {
      changeMessage,
    })
    
    return NextResponse.json({
      id: file.id,
      path: file.path,
      sizeBytes: file.sizeBytes,
      contentHash: file.contentHash,
      updatedAt: file.updatedAt,
    })
    
  } catch (error) {
    console.error('[API] PUT /projects/:id/files/*path error:', error)
    
    if (error instanceof InvalidPathError) {
      return NextResponse.json(
        { error: error.message, code: 'INVALID_PATH' },
        { status: 400 }
      )
    }
    
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { 
          error: error.message, 
          code: 'QUOTA_EXCEEDED',
          details: {
            currentUsage: error.result.currentUsage.toString(),
            quota: error.result.quota.toString(),
            percentUsed: error.result.percentUsed,
          }
        },
        { status: 402 }
      )
    }
    
    if (error instanceof FileSizeExceededError) {
      return NextResponse.json(
        { 
          error: error.message, 
          code: 'FILE_TOO_LARGE',
          details: {
            fileSize: error.fileSize,
            maxSize: error.maxSize,
          }
        },
        { status: 413 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============ DELETE - Delete File ============

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    const projectId = params.id
    const filePath = getFilePath(params.path)
    
    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user: { clerkId },
      },
      select: {
        id: true,
        userId: true,
      },
    })
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Delete file (idempotent)
    const fileService = getFileService()
    await fileService.deleteFile(projectId, filePath)
    
    return NextResponse.json({
      deleted: true,
      path: filePath,
    })
    
  } catch (error) {
    console.error('[API] DELETE /projects/:id/files/*path error:', error)
    
    // DELETE is idempotent - return success even if not found
    if (error instanceof FileNotFoundError) {
      return NextResponse.json({
        deleted: true,
        path: error.path,
      })
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
