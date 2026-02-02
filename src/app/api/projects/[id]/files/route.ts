/**
 * Project Files API - List & Create
 * 
 * GET  /api/projects/:id/files - List all files
 * POST /api/projects/:id/files - Create a new file
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import {
  getFileService,
  InvalidPathError,
  FileAlreadyExistsError,
  QuotaExceededError,
  FileSizeExceededError,
  ProjectNotFoundError,
  buildFileTree,
} from '@/lib/files'

// ============ GET - List Files ============

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const directory = searchParams.get('directory') || undefined
    const format = searchParams.get('format') // 'tree' for tree structure
    
    // List files
    const fileService = getFileService()
    const files = await fileService.listFiles(projectId, directory)
    
    // Return tree format if requested
    if (format === 'tree') {
      const tree = buildFileTree(files.map(f => ({ path: f.path, sizeBytes: f.sizeBytes })))
      return NextResponse.json({ tree })
    }
    
    // Calculate total size
    const totalSizeBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0)
    
    return NextResponse.json({
      files,
      totalCount: files.length,
      totalSizeBytes,
    })
    
  } catch (error) {
    console.error('[API] GET /projects/:id/files error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============ POST - Create File ============

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { path, content } = body
    
    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { error: 'Path is required', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }
    
    if (content === undefined || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }
    
    // Create file
    const fileService = getFileService()
    const file = await fileService.createFile(projectId, path, content, {
      isGenerated: body.isGenerated ?? true,
    })
    
    return NextResponse.json({
      id: file.id,
      path: file.path,
      sizeBytes: file.sizeBytes,
      contentHash: file.contentHash,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }, { status: 201 })
    
  } catch (error) {
    console.error('[API] POST /projects/:id/files error:', error)
    
    // Handle specific errors
    if (error instanceof InvalidPathError) {
      return NextResponse.json(
        { error: error.message, code: 'INVALID_PATH', details: { reason: error.reason } },
        { status: 400 }
      )
    }
    
    if (error instanceof FileAlreadyExistsError) {
      return NextResponse.json(
        { error: error.message, code: 'FILE_EXISTS', path: error.path },
        { status: 409 }
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
