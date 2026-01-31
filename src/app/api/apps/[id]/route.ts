import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { AppStatus } from '@prisma/client'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const app = await prisma.app.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    return NextResponse.json(app)
  } catch (error) {
    console.error('Get app error:', error)
    return NextResponse.json({ error: 'Failed to get app' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Parse and validate request body
    let body: { name?: string; description?: string; files?: object; status?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, description, files, status } = body

    // Validate inputs
    if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
      return NextResponse.json({ error: 'Name must be a string with max 100 characters' }, { status: 400 })
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json({ error: 'Description must be a string with max 500 characters' }, { status: 400 })
    }
    if (files !== undefined && (typeof files !== 'object' || files === null)) {
      return NextResponse.json({ error: 'Files must be an object' }, { status: 400 })
    }
    const validStatuses: AppStatus[] = ['DRAFT', 'PREVIEW', 'DEPLOYED', 'ARCHIVED']
    if (status !== undefined && !validStatuses.includes(status as AppStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    const app = await prisma.app.updateMany({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(files && { files }),
        ...(status && { status: status as AppStatus }),
        updatedAt: new Date(),
      },
    })

    if (app.count === 0) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update app error:', error)
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.app.deleteMany({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete app error:', error)
    return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 })
  }
}
