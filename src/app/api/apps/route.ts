import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { DEFAULT_APP_FILES, APP_LIMITS } from '@/lib/constants'
import { generateAppName } from '@/lib/utils'

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
    let body: { name?: string; description?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, description } = body

    // Validate inputs
    if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
      return NextResponse.json({ error: 'Name must be a string with max 100 characters' }, { status: 400 })
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json({ error: 'Description must be a string with max 500 characters' }, { status: 400 })
    }

    // Create conversation first
    const conversation = await prisma.conversation.create({
      data: {
        title: name || generateAppName(),
        userId: user.id,
      },
    })

    // Create app with conversation
    const app = await prisma.app.create({
      data: {
        name: name || generateAppName(),
        description,
        files: DEFAULT_APP_FILES,
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
