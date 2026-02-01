import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { AI_MODELS, MODEL_OPTIONS, DEFAULT_MODEL } from '@/lib/ai/models'
import { MODEL_PRICING, MARGIN, USD_TO_EUR, CREDITS_PER_EURO } from '@/lib/credits/pricing'

/**
 * GET /api/models
 * List available AI models with their pricing
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build models list with pricing
    const models = Object.entries(AI_MODELS).map(([key, config]) => {
      const pricing = MODEL_PRICING[key] || { input: 0, output: 0 }
      
      // Calculate estimated credits for a typical request (1k input, 2k output)
      const inputCostUsd = (1000 / 1_000_000) * pricing.input
      const outputCostUsd = (2000 / 1_000_000) * pricing.output
      const totalCostEur = (inputCostUsd + outputCostUsd) * USD_TO_EUR * (1 + MARGIN)
      const estimatedCredits = Math.max(1, Math.ceil(totalCostEur * CREDITS_PER_EURO))
      
      return {
        id: key,
        name: config.displayName,
        provider: config.provider,
        description: config.description,
        contextWindow: config.contextWindow,
        maxOutput: config.maxTokens,
        pricing: {
          inputPer1M: pricing.input,
          outputPer1M: pricing.output,
          // Estimated credits for typical request
          estimatedPerRequest: estimatedCredits,
        },
        recommended: key === DEFAULT_MODEL,
      }
    })

    return NextResponse.json({
      models,
      defaultModelId: DEFAULT_MODEL,
    })
  } catch (error) {
    console.error('Models fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}
