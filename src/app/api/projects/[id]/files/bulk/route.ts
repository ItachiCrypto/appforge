/**
 * Project Files Bulk Operations API
 * 
 * POST /api/projects/:id/files/bulk - Execute multiple file operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import {
  getFileService,
  BulkOperation,
  QuotaExceededError,
} from '@/lib/files'

// Maximum operations in a single bulk request
const MAX_BULK_OPERATIONS = 50

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
    const { operations } = body
    
    if (!Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'Operations must be an array', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }
    
    if (operations.length === 0) {
      return NextResponse.json(
        { error: 'At least one operation required', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }
    
    if (operations.length > MAX_BULK_OPERATIONS) {
      return NextResponse.json(
        { 
          error: `Maximum ${MAX_BULK_OPERATIONS} operations allowed`, 
          code: 'TOO_MANY_OPERATIONS' 
        },
        { status: 400 }
      )
    }
    
    // Validate and normalize operations
    const validatedOps: BulkOperation[] = []
    
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i]
      
      // Check type field (support both 'type' and 'operation')
      const opType = op.type || op.operation
      if (!opType || !['create', 'update', 'delete', 'rename'].includes(opType)) {
        return NextResponse.json(
          { 
            error: `Invalid operation type at index ${i}`, 
            code: 'INVALID_OPERATION' 
          },
          { status: 400 }
        )
      }
      
      // Validate required fields based on type
      switch (opType) {
        case 'create':
        case 'update':
          if (!op.path || typeof op.content !== 'string') {
            return NextResponse.json(
              { 
                error: `Missing path or content at index ${i}`, 
                code: 'INVALID_OPERATION' 
              },
              { status: 400 }
            )
          }
          validatedOps.push({ type: opType, path: op.path, content: op.content })
          break
          
        case 'delete':
          if (!op.path) {
            return NextResponse.json(
              { error: `Missing path at index ${i}`, code: 'INVALID_OPERATION' },
              { status: 400 }
            )
          }
          validatedOps.push({ type: 'delete', path: op.path })
          break
          
        case 'rename':
          if (!op.from || !op.to) {
            return NextResponse.json(
              { error: `Missing from or to at index ${i}`, code: 'INVALID_OPERATION' },
              { status: 400 }
            )
          }
          validatedOps.push({ type: 'rename', from: op.from, to: op.to })
          break
      }
    }
    
    // Execute bulk operations
    const fileService = getFileService()
    const results = await fileService.bulkOperations(projectId, validatedOps)
    
    // Calculate summary
    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        succeeded,
        failed,
      },
    })
    
  } catch (error) {
    console.error('[API] POST /projects/:id/files/bulk error:', error)
    
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
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
