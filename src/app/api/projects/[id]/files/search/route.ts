/**
 * Project Files Search API
 * 
 * GET /api/projects/:id/files/search?q=query - Search in files
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getFileService } from '@/lib/files'

// Minimum query length
const MIN_QUERY_LENGTH = 2

// Maximum results
const MAX_RESULTS = 50

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
    
    // Get search parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const filePattern = searchParams.get('pattern') || undefined
    
    // Validate query
    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json(
        { 
          error: `Query must be at least ${MIN_QUERY_LENGTH} characters`, 
          code: 'QUERY_TOO_SHORT' 
        },
        { status: 400 }
      )
    }
    
    // Search files
    const fileService = getFileService()
    const results = await fileService.searchFiles(projectId, query, filePattern)
    
    // Limit results
    const limitedResults = results.slice(0, MAX_RESULTS)
    
    // Calculate total matches across all files
    const totalMatches = results.reduce((sum, r) => sum + r.totalMatches, 0)
    
    return NextResponse.json({
      query,
      pattern: filePattern || null,
      results: limitedResults,
      totalFiles: results.length,
      totalMatches,
      truncated: results.length > MAX_RESULTS,
    })
    
  } catch (error) {
    console.error('[API] GET /projects/:id/files/search error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
