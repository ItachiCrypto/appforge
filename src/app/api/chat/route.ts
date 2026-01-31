import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { streamChat, parseCodeBlocks } from '@/lib/ai/openai'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    let body: { appId?: string; messages?: Array<{ role: string; content: string }> }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { appId, messages } = body

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required and cannot be empty' }, { status: 400 })
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return NextResponse.json({ error: 'Each message must have role and content' }, { status: 400 })
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return NextResponse.json({ error: 'Message role must be "user" or "assistant"' }, { status: 400 })
      }
    }

    // Get user with BYOK key
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare messages with system prompt
    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Use user's BYOK key if available
    const apiKey = user.openaiKey || undefined

    // Stream the response
    const stream = await streamChat(chatMessages, apiKey)
    
    // Collect the full response
    let fullContent = ''
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      fullContent += content
    }

    // Parse code blocks if present
    const codeOutput = parseCodeBlocks(fullContent)

    // Clean content (remove code blocks for display)
    const cleanContent = fullContent.replace(/```appforge[\s\S]*?```/g, '').trim()

    // Save message to conversation if appId provided
    if (appId) {
      // Verify user owns this app
      const app = await prisma.app.findFirst({
        where: { 
          id: appId,
          userId: user.id,
        },
      })

      if (app && app.conversationId) {
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
            content: cleanContent,
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
    }

    return NextResponse.json({
      content: cleanContent || fullContent,
      codeOutput,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}
