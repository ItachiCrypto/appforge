import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { MODEL_PRICING } from '@/lib/credits/pricing'

/**
 * GET /api/user/preferences
 * Get user's preferences (BYOK enabled, preferred model)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        byokEnabled: true,
        preferredModelId: true,
        preferredModel: {
          select: {
            modelId: true,
            displayName: true,
          },
        },
        openaiKey: true,
        anthropicKey: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has API keys configured
    const hasOpenaiKey = !!user.openaiKey
    const hasAnthropicKey = !!user.anthropicKey

    return NextResponse.json({
      byokEnabled: user.byokEnabled,
      preferredModel: user.preferredModel?.modelId || 'claude-sonnet-4',
      preferredModelName: user.preferredModel?.displayName || 'Claude Sonnet 4',
      hasOpenaiKey,
      hasAnthropicKey,
      canUseBYOK: hasOpenaiKey || hasAnthropicKey,
    })
  } catch (error) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/preferences
 * Update user's preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body
    let body: { byokEnabled?: boolean; preferredModel?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { byokEnabled, preferredModel } = body

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, openaiKey: true, anthropicKey: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If enabling BYOK, check user has at least one key
    if (byokEnabled === true && !user.openaiKey && !user.anthropicKey) {
      return NextResponse.json(
        {
          error:
            'Cannot enable BYOK without API keys. Add your OpenAI or Anthropic key first.',
        },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: { byokEnabled?: boolean; preferredModelId?: string } = {}
    
    if (byokEnabled !== undefined) {
      updateData.byokEnabled = byokEnabled
    }
    
    // Validate and set preferred model
    if (preferredModel !== undefined) {
      // Check if model exists in pricing (valid model)
      if (!MODEL_PRICING[preferredModel]) {
        return NextResponse.json(
          { error: `Invalid model: ${preferredModel}` },
          { status: 400 }
        )
      }
      
      // Get or create AIModel record
      let aiModel = await prisma.aIModel.findUnique({
        where: { modelId: preferredModel },
      })
      
      if (!aiModel) {
        // Create the model record
        const provider = preferredModel.startsWith('claude') ? 'ANTHROPIC' : 'OPENAI'
        const pricing = MODEL_PRICING[preferredModel]
        
        aiModel = await prisma.aIModel.create({
          data: {
            modelId: preferredModel,
            provider,
            displayName: preferredModel,
            inputCostPer1M: pricing.input,
            outputCostPer1M: pricing.output,
            isAvailable: true,
          },
        })
      }
      
      updateData.preferredModelId = aiModel.id
    }

    // Update user
    const updated = await prisma.user.update({
      where: { clerkId },
      data: updateData,
      select: {
        byokEnabled: true,
        preferredModel: {
          select: {
            modelId: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({
      byokEnabled: updated.byokEnabled,
      preferredModel: updated.preferredModel?.modelId || 'claude-sonnet-4',
      preferredModelName: updated.preferredModel?.displayName || 'Claude Sonnet 4',
      message: 'Preferences updated successfully',
    })
  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
