import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { DEFAULT_APP_FILES, APP_LIMITS, DEFAULT_FILES_BY_TYPE, APP_TYPES, type AppTypeId } from '@/lib/constants'
import { generateAppName } from '@/lib/utils'
import { AppType } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const apps = await prisma.app.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(apps)
  } catch (error) {
    console.error('Get apps error:', error)
    return NextResponse.json({ error: 'Failed to get apps' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { apps: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check app limit
    const limit = APP_LIMITS[user.plan]
    if (limit !== Infinity && user.apps.length >= limit) {
      return NextResponse.json(
        { error: 'App limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body: { name?: string; description?: string; type?: string; metadata?: object; initialPrompt?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, description, type, metadata, initialPrompt } = body

    // Validate inputs
    if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
      return NextResponse.json({ error: 'Name must be a string with max 100 characters' }, { status: 400 })
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json({ error: 'Description must be a string with max 500 characters' }, { status: 400 })
    }
    if (metadata !== undefined && (typeof metadata !== 'object' || metadata === null)) {
      return NextResponse.json({ error: 'Metadata must be an object' }, { status: 400 })
    }
    
    // Validate app type
    const validTypes = APP_TYPES.map(t => t.id)
    const appType = (type && validTypes.includes(type as AppTypeId) ? type : 'WEB') as AppTypeId

    // Get default files for this type
    let appFiles = { ...DEFAULT_FILES_BY_TYPE[appType] }

    // BMAD: If metadata contains BMAD docs, also save them as files
    // This makes them visible in the file explorer and editable
    const bmadMetadata = metadata as { bmad?: { brief?: string; prd?: string; architecture?: string; epics?: string } } | undefined
    if (bmadMetadata?.bmad) {
      const { brief, prd, architecture, epics } = bmadMetadata.bmad
      if (brief) {
        appFiles['/docs/01-product-brief.md'] = brief
      }
      if (prd) {
        appFiles['/docs/02-prd.md'] = prd
      }
      if (architecture) {
        appFiles['/docs/03-architecture.md'] = architecture
      }
      if (epics) {
        appFiles['/docs/04-epics-stories.md'] = epics
      }
    }

    // Create conversation first
    const conversation = await prisma.conversation.create({
      data: {
        title: name || generateAppName(),
        userId: user.id,
      },
    })

    // Merge initialPrompt into metadata if provided
    // This avoids URL encoding issues with long prompts containing emojis
    const appMetadata = {
      ...(metadata || {}),
      ...(initialPrompt ? { initialPrompt } : {}),
    }

    // Create app with conversation and type
    const app = await prisma.app.create({
      data: {
        name: name || generateAppName(),
        description,
        type: appType as AppType,
        files: appFiles,
        metadata: Object.keys(appMetadata).length > 0 ? appMetadata : undefined,
        userId: user.id,
        conversationId: conversation.id,
      },
    })

    return NextResponse.json(app)
  } catch (error) {
    console.error('Create app error:', error)
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 })
  }
}
