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
    let body: { appId?: string; message?: string; messages?: Array<{ role: string; content: string }> }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { appId, message } = body
    let { messages } = body

    // Support both single message and messages array
    if (message && !messages) {
      messages = [{ role: 'user', content: message }]
    }

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array or message is required' }, { status: 400 })
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
        // Get the main App.tsx or first file as context
        currentCode = files['/App.tsx'] || files['App.tsx'] || Object.values(files)[0] || ''
      }
    }

    // Build enhanced system prompt with current code context
    let enhancedSystemPrompt = SYSTEM_PROMPT
    if (currentCode) {
      enhancedSystemPrompt += `\n\n## Current App Code\nThe user is modifying an existing app. Here's the current code:\n\n\`\`\`tsx\n${currentCode}\n\`\`\`\n\nWhen making changes, generate the COMPLETE updated code, not just the changes.`
    }

    // Prepare messages with system prompt
    const chatMessages = [
      { role: 'system' as const, content: enhancedSystemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Use user's BYOK key if available, fallback to env
    const apiKey = user.openaiKey || process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No API key configured. Please add your OpenAI API key in settings.' 
      }, { status: 400 })
    }

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
    const cleanContent = fullContent
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

    return NextResponse.json({
      content: cleanContent || 'Code generated successfully.',
      codeOutput,
      success: true,
    })
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat'
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    )
  }
}
