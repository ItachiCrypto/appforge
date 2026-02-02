import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

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

    // Return user info without exposing actual keys
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      openaiKey: !!user.openaiKey,
      anthropicKey: !!user.anthropicKey,
      creditBalance: user.creditBalance,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
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
    let body: { openaiKey?: string | null; anthropicKey?: string | null }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { openaiKey, anthropicKey } = body

    // Validate API key formats (basic validation)
    if (openaiKey !== undefined && openaiKey !== null) {
      if (typeof openaiKey !== 'string') {
        return NextResponse.json({ error: 'openaiKey must be a string' }, { status: 400 })
      }
      if (openaiKey.length > 0 && !openaiKey.startsWith('sk-')) {
        return NextResponse.json({ error: 'Invalid OpenAI API key format' }, { status: 400 })
      }
    }

    if (anthropicKey !== undefined && anthropicKey !== null) {
      if (typeof anthropicKey !== 'string') {
        return NextResponse.json({ error: 'anthropicKey must be a string' }, { status: 400 })
      }
      if (anthropicKey.length > 0 && !anthropicKey.startsWith('sk-ant-')) {
        return NextResponse.json({ error: 'Invalid Anthropic API key format' }, { status: 400 })
      }
    }

    // In production, encrypt these keys before storing
    // For MVP, we'll store them as-is (not recommended for production!)
    
    // Determine if BYOK should be enabled (auto-enable when adding a key)
    const willHaveOpenai = openaiKey !== undefined ? !!openaiKey : !!user.openaiKey
    const willHaveAnthropic = anthropicKey !== undefined ? !!anthropicKey : !!user.anthropicKey
    const shouldEnableByok = willHaveOpenai || willHaveAnthropic
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(openaiKey !== undefined && { openaiKey }),
        ...(anthropicKey !== undefined && { anthropicKey }),
        byokEnabled: shouldEnableByok,
      },
    })

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      plan: updatedUser.plan,
      openaiKey: !!updatedUser.openaiKey,
      anthropicKey: !!updatedUser.anthropicKey,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
