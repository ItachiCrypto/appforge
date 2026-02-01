import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { streamChat, parseCodeBlocks } from '@/lib/ai/openai'
import { streamChatAnthropic } from '@/lib/ai/anthropic'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { MODEL_PRICING } from '@/lib/credits/pricing'
import {
  hasEnoughCredits,
  deductCredits,
  calculateCreditCost,
  estimateCreditCost,
  getBalance,
} from '@/lib/credits/service'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface GenerationResult {
  content: string
  inputTokens: number
  outputTokens: number
}

// Map our model keys to API model names
const MODEL_API_NAMES: Record<string, string> = {
  'claude-opus-4': 'claude-opus-4-20250514',
  'claude-sonnet-4': 'claude-sonnet-4-20250514',
  'claude-haiku-3.5': 'claude-3-5-haiku-20241022',
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
  'o1': 'o1',
  'o1-mini': 'o1-mini',
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    let body: {
      appId?: string
      message?: string
      messages?: Array<{ role: string; content: string }>
      model?: string
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { appId, message, model: requestedModel } = body
    let { messages } = body

    // Support both single message and messages array
    if (message && !messages) {
      messages = [{ role: 'user', content: message }]
    }

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array or message is required' },
        { status: 400 }
      )
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return NextResponse.json(
          { error: 'Each message must have role and content' },
          { status: 400 }
        )
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return NextResponse.json(
          { error: 'Message role must be "user" or "assistant"' },
          { status: 400 }
        )
      }
    }

    // Get user with preferences and keys
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        preferredModel: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine which model to use
    const modelKey = requestedModel || user.preferredModel?.modelId || 'claude-sonnet-4'
    
    // Validate model
    if (!MODEL_PRICING[modelKey]) {
      return NextResponse.json(
        { error: `Invalid model: ${modelKey}` },
        { status: 400 }
      )
    }

    // Determine provider from model key
    const isAnthropicModel = modelKey.startsWith('claude')

    // Determine if using BYOK or platform credits
    const userAnthropicKey = user.anthropicKey
    const userOpenaiKey = user.openaiKey
    const platformAnthropicKey = process.env.ANTHROPIC_API_KEY
    const platformOpenaiKey = process.env.OPENAI_API_KEY

    // Check if BYOK is enabled and user has appropriate key for the model
    const canUseBYOK = Boolean(
      user.byokEnabled &&
      ((isAnthropicModel && userAnthropicKey) ||
        (!isAnthropicModel && userOpenaiKey))
    )

    let useBYOK = canUseBYOK

    // If not using BYOK, check credits
    if (!useBYOK) {
      // Estimate tokens (rough: ~4 chars per token)
      const inputChars = messages.reduce((sum, m) => sum + m.content.length, 0)
      const estimatedInputTokens = Math.ceil(inputChars / 4) + 500 // +500 for system prompt
      const estimatedCredits = estimateCreditCost(
        modelKey,
        estimatedInputTokens,
        2000
      )

      const hasCredits = await hasEnoughCredits(user.id, estimatedCredits)

      if (!hasCredits) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS',
            creditsNeeded: estimatedCredits,
            currentBalance: user.creditBalance,
          },
          { status: 402 }
        )
      }
    }

    // Get current app context if appId provided
    let currentCode = ''
    let app = null
    if (appId) {
      app = await prisma.app.findFirst({
        where: {
          id: appId,
          userId: user.id,
        },
      })

      if (app?.files) {
        const files = app.files as Record<string, string>
        currentCode =
          files['/App.tsx'] || files['App.tsx'] || Object.values(files)[0] || ''
      }
    }

    // Build enhanced system prompt with current code context
    let enhancedSystemPrompt = SYSTEM_PROMPT
    if (currentCode) {
      enhancedSystemPrompt += `\n\n## Current App Code\nThe user is modifying an existing app. Here's the current code:\n\n\`\`\`tsx\n${currentCode}\n\`\`\`\n\nWhen making changes, generate the COMPLETE updated code, not just the changes.`
    }

    // Prepare messages with system prompt
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: enhancedSystemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Determine API key to use
    let apiKey: string
    if (useBYOK) {
      apiKey = isAnthropicModel
        ? (userAnthropicKey as string)
        : (userOpenaiKey as string)
    } else {
      // Use platform keys
      if (isAnthropicModel && platformAnthropicKey) {
        apiKey = platformAnthropicKey
      } else if (!isAnthropicModel && platformOpenaiKey) {
        apiKey = platformOpenaiKey
      } else {
        return NextResponse.json(
          {
            error:
              'No API key available for this model. Please configure BYOK or contact support.',
          },
          { status: 500 }
        )
      }
    }

    // Generate with the selected model
    let result: GenerationResult
    const apiModelName = MODEL_API_NAMES[modelKey] || modelKey

    try {
      if (isAnthropicModel) {
        const response = await streamChatAnthropic(
          chatMessages,
          apiKey,
          apiModelName
        )
        // Estimate tokens (Anthropic SDK should return usage but we estimate here)
        result = {
          content: response,
          inputTokens: Math.ceil(
            chatMessages.reduce((sum, m) => sum + m.content.length, 0) / 4
          ),
          outputTokens: Math.ceil(response.length / 4),
        }
      } else {
        // OpenAI
        const stream = await streamChat(chatMessages, apiKey, apiModelName)
        let content = ''
        let inputTokens = 0
        let outputTokens = 0

        for await (const chunk of stream) {
          content += chunk.choices[0]?.delta?.content || ''
          // OpenAI returns usage in the final chunk
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens || 0
            outputTokens = chunk.usage.completion_tokens || 0
          }
        }

        result = {
          content,
          inputTokens:
            inputTokens ||
            Math.ceil(
              chatMessages.reduce((sum, m) => sum + m.content.length, 0) / 4
            ),
          outputTokens: outputTokens || Math.ceil(content.length / 4),
        }
      }
    } catch (error) {
      console.error('AI generation error:', error)

      // If BYOK failed, don't charge credits
      if (useBYOK) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
          {
            error: `Your API key error: ${errorMsg}`,
            code: 'BYOK_ERROR',
          },
          { status: 400 }
        )
      }

      throw error
    }

    // Deduct credits if not using BYOK
    const creditsUsed = calculateCreditCost(
      modelKey,
      result.inputTokens,
      result.outputTokens
    )

    await deductCredits(
      user.id,
      modelKey,
      result.inputTokens,
      result.outputTokens,
      useBYOK
    )

    // Parse code blocks if present
    const codeOutput = parseCodeBlocks(result.content)

    // Clean content (remove code blocks for display)
    const cleanContent = result.content
      .replace(/```appforge[\s\S]*?```/g, '')
      .replace(/```(?:tsx|jsx|typescript|javascript|ts|js)?[\s\S]*?```/g, '')
      .trim()

    // Save message to conversation if appId provided
    if (appId && app?.conversationId) {
      // Save user message
      await prisma.message.create({
        data: {
          role: 'USER',
          content: messages[messages.length - 1].content,
          conversationId: app.conversationId,
        },
      })

      // Save assistant message
      await prisma.message.create({
        data: {
          role: 'ASSISTANT',
          content: cleanContent || 'Code generated successfully.',
          codeOutput: codeOutput ? codeOutput : undefined,
          conversationId: app.conversationId,
        },
      })

      // Update app files if code was generated
      if (codeOutput?.files) {
        await prisma.app.update({
          where: { id: appId },
          data: {
            files: { ...(app.files as object), ...codeOutput.files },
            status: 'PREVIEW',
          },
        })
      }
    }

    // Get updated credit balance
    const newBalance = await getBalance(user.id)

    return NextResponse.json({
      content: cleanContent || 'Code generated successfully.',
      codeOutput,
      success: true,
      usage: {
        model: modelKey,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        creditsUsed: useBYOK ? 0 : creditsUsed,
        usedBYOK: useBYOK,
      },
      creditBalance: newBalance,
    })
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process chat'
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    )
  }
}
