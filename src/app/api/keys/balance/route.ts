import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/keys/balance
 * Check the credit balance for user's API keys
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
        openaiKey: true,
        anthropicKey: true,
        kimiKey: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const result: {
      openai: { configured: boolean; balance?: number; error?: string }
      anthropic: { configured: boolean; balance?: number; error?: string }
      kimi: { configured: boolean; balance?: number; error?: string }
    } = {
      openai: { configured: false },
      anthropic: { configured: false },
      kimi: { configured: false },
    }

    // Check OpenAI balance
    if (user.openaiKey) {
      result.openai.configured = true
      try {
        // OpenAI doesn't have a direct balance API for API keys
        // We'll do a minimal API call to check if the key works
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.openaiKey}`,
          },
        })

        if (response.ok) {
          result.openai.balance = -1 // -1 means "valid but balance unknown"
        } else {
          const error = await response.json().catch(() => ({}))
          if (response.status === 429 || error?.error?.code === 'insufficient_quota') {
            result.openai.balance = 0
            result.openai.error = 'Quota exceeded'
          } else if (response.status === 401) {
            result.openai.error = 'Invalid API key'
          } else {
            result.openai.error = error?.error?.message || 'Unknown error'
          }
        }
      } catch (e) {
        result.openai.error = 'Failed to check'
      }
    }

    // Check Anthropic balance
    if (user.anthropicKey) {
      result.anthropic.configured = true
      try {
        // Anthropic doesn't have a balance API either
        // Do a minimal request to check if key is valid
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': user.anthropicKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        })

        if (response.ok) {
          result.anthropic.balance = -1 // Valid but balance unknown
        } else {
          const error = await response.json().catch(() => ({}))
          if (response.status === 429 || error?.error?.type === 'rate_limit_error') {
            result.anthropic.balance = 0
            result.anthropic.error = 'Rate limited'
          } else if (response.status === 401 || error?.error?.type === 'authentication_error') {
            result.anthropic.error = 'Invalid API key'
          } else if (error?.error?.type === 'invalid_request_error' && 
                     error?.error?.message?.includes('credit')) {
            result.anthropic.balance = 0
            result.anthropic.error = 'No credits'
          } else {
            // If we get a different error but the request went through, key is probably valid
            result.anthropic.balance = -1
          }
        }
      } catch (e) {
        result.anthropic.error = 'Failed to check'
      }
    }

    // Check Kimi (Moonshot AI) balance
    if (user.kimiKey) {
      result.kimi.configured = true
      try {
        // Kimi uses OpenAI-compatible API
        const response = await fetch('https://api.moonshot.cn/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.kimiKey}`,
          },
        })

        if (response.ok) {
          result.kimi.balance = -1 // Valid but balance unknown
        } else {
          const error = await response.json().catch(() => ({}))
          if (response.status === 429) {
            result.kimi.balance = 0
            result.kimi.error = 'Rate limited'
          } else if (response.status === 401) {
            result.kimi.error = 'Invalid API key'
          } else {
            result.kimi.error = error?.error?.message || 'Unknown error'
          }
        }
      } catch (e) {
        result.kimi.error = 'Failed to check'
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Keys balance check error:', error)
    return NextResponse.json(
      { error: 'Failed to check key balances' },
      { status: 500 }
    )
  }
}
