/**
 * Chat API Route with AI Tools Integration
 * 
 * Supports both OpenAI and Anthropic with tool calling for file manipulation.
 * Implements the tool_use → execute → continue loop for multi-turn tool use.
 * 
 * OPTIMIZED: Uses minimal context (file list only) instead of injecting all code.
 * The AI uses tools to read files on-demand, reducing token usage by ~70-80%.
 * 
 * @author DEV-C (AI Integration)
 * @updated IMPL-AI-TOOLS Agent - On-demand file access optimization
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { parseCodeBlocks } from '@/lib/ai/openai'
import { 
  SYSTEM_PROMPT, 
  TOOLS_SYSTEM_PROMPT, 
  FALLBACK_CODE_OUTPUT_PROMPT,
  buildMinimalContext,
  buildLegacyContext,
} from '@/lib/ai/prompts'
import { MODEL_PRICING } from '@/lib/credits/pricing'
import {
  hasEnoughCredits,
  deductCredits,
  calculateCreditCost,
  estimateCreditCost,
} from '@/lib/credits/service'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// AI Tools imports
import { toOpenAITools, toAnthropicTools } from '@/lib/ai/tools/definitions'
import {
  executeTool,
  executeTools,
  parseAnthropicToolCalls,
  formatAnthropicToolResults,
  formatOpenAIToolResults,
  ToolCall,
  ToolResult,
  ToolContext,
  createAppContext,
  createProjectContext,
} from '@/lib/ai/tools/executor'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
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

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse request
    const body = await req.json()
    const { 
      appId, 
      projectId, // New: for tool operations
      message, 
      model: requestedModel, 
      currentFiles,
      enableTools = true, // New: opt-in/out of tools
    } = body
    let { messages } = body

    if (message && !messages) {
      messages = [{ role: 'user', content: message }]
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { preferredModel: true },
    })

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Determine model (default to Claude Sonnet if no preference)
    let modelKey = requestedModel || user.preferredModel?.modelId || 'claude-sonnet-4'
    
    // Check available platform keys
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    
    // Smart fallback: if requested provider has no key, try the other
    const isRequestedAnthropic = modelKey.startsWith('claude')
    if (isRequestedAnthropic && !hasAnthropicKey && hasOpenAIKey && !user.byokEnabled) {
      // Fallback to OpenAI
      modelKey = 'gpt-4o'
    } else if (!isRequestedAnthropic && !hasOpenAIKey && hasAnthropicKey && !user.byokEnabled) {
      // Fallback to Anthropic
      modelKey = 'claude-sonnet-4'
    }
    
    const isAnthropicModel = modelKey.startsWith('claude')
    const apiModelName = MODEL_API_NAMES[modelKey] || modelKey

    // Get keys
    const userKey = isAnthropicModel ? user.anthropicKey : user.openaiKey
    const platformKey = isAnthropicModel 
      ? process.env.ANTHROPIC_API_KEY 
      : process.env.OPENAI_API_KEY

    // Determine which key to use
    // Priority: 1) BYOK if enabled and key exists, 2) Platform API with credits
    let apiKey: string | null = null
    let useBYOK = false

    // Estimate credits needed for this request
    const inputChars = messages.reduce((sum: number, m: {content: string}) => sum + m.content.length, 0)
    const estimatedCredits = estimateCreditCost(modelKey, Math.ceil(inputChars / 4) + 500, 2000)

    // Try BYOK first if enabled and key exists
    if (user.byokEnabled && userKey) {
      apiKey = userKey
      useBYOK = true
    } 
    // Fall back to platform API with user's plan credits
    else if (platformKey) {
      const hasCredits = await hasEnoughCredits(user.id, estimatedCredits)
      if (hasCredits) {
        apiKey = platformKey
        useBYOK = false
      }
    }

    // No valid option found
    if (!apiKey) {
      // Determine the best error message
      const hasByokKey = user.byokEnabled && userKey
      
      if (!hasByokKey && user.creditBalance <= 0) {
        return new Response(JSON.stringify({
          error: 'Plus de crédits disponibles. Ajoutez votre propre clé API ou achetez des crédits.',
          code: 'INSUFFICIENT_CREDITS',
          currentBalance: user.creditBalance,
        }), {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      
      if (!hasByokKey && !platformKey) {
        return new Response(JSON.stringify({
          error: 'Service temporarily unavailable. Please add your own API key.',
          code: 'NO_PLATFORM_KEY',
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        error: 'No API key available. Please add your API key in Settings or ensure you have credits.',
        code: 'NO_API_KEY',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get app/project context
    let app = null
    let resolvedProjectId = projectId
    let toolContext: ToolContext | null = null
    
    if (appId) {
      app = await prisma.app.findFirst({
        where: { id: appId, userId: user.id },
      })
      
      // For legacy Apps, we can use tools via the LegacyFileAdapter
      if (app && enableTools) {
        toolContext = createAppContext(appId)
      }
    }
    
    // If projectId provided, verify user owns it and prefer it over appId
    if (resolvedProjectId) {
      const project = await prisma.project.findFirst({
        where: { id: resolvedProjectId, userId: user.id },
        select: { id: true },
      })
      if (project) {
        toolContext = createProjectContext(resolvedProjectId)
      } else {
        resolvedProjectId = undefined
      }
    }
    
    // Determine if tools are truly enabled (need valid context)
    const toolsEnabled = enableTools && toolContext !== null
    
    // Use currentFiles from frontend if provided, otherwise use database
    const codeFiles = currentFiles || (app?.files as Record<string, string>) || {}

    // Build system prompt with context + tools
    let systemPrompt = SYSTEM_PROMPT
    
    // Add tools prompt and minimal context if tools are enabled
    if (toolsEnabled) {
      systemPrompt += TOOLS_SYSTEM_PROMPT
      
      // Build minimal context (file list only, not content)
      // This is the key optimization: ~70-80% token reduction
      const fileList = Object.entries(codeFiles).map(([path, content]) => ({
        path: path.startsWith('/') ? path : '/' + path,
        sizeBytes: typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : 0,
      }))
      
      const totalSize = fileList.reduce((sum, f) => sum + f.sizeBytes, 0)
      
      systemPrompt += buildMinimalContext({
        name: app?.name || 'Untitled Project',
        type: app?.type || 'WEB',
        files: fileList,
        totalSizeBytes: totalSize,
      })
    } else {
      // FALLBACK: No tools available, inject full code (legacy behavior)
      systemPrompt += FALLBACK_CODE_OUTPUT_PROMPT
      
      if (Object.keys(codeFiles).length > 0) {
        systemPrompt += buildLegacyContext(codeFiles)
      }
    }

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: {role: string, content: string}) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Create streaming response
    const encoder = new TextEncoder()
    let fullContent = ''
    let inputTokens = 0
    let outputTokens = 0

    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`))
        }

        // DEBUG: Log tools status
        console.log('[Chat API] Starting stream:', {
          isAnthropicModel,
          toolsEnabled,
          hasToolContext: toolContext !== null,
          appId,
          modelKey,
        })
        
        // Send debug info to frontend
        send('debug', {
          toolsEnabled,
          hasToolContext: toolContext !== null,
          model: modelKey,
        })

        try {
          if (isAnthropicModel) {
            await streamAnthropicWithTools({
              apiKey,
              apiModelName,
              systemPrompt,
              chatMessages,
              toolContext,
              enableTools: toolsEnabled,
              send,
              onTokens: (input, output) => {
                inputTokens += input
                outputTokens += output
              },
              onContent: (text) => {
                fullContent += text
              },
            })
          } else {
            await streamOpenAIWithTools({
              apiKey,
              apiModelName,
              chatMessages,
              toolContext,
              enableTools: toolsEnabled,
              send,
              onTokens: (input, output) => {
                inputTokens += input
                outputTokens += output
              },
              onContent: (text) => {
                fullContent += text
              },
            })
          }

          // Parse code from text OR fetch from DB if tools were used
          let codeOutput = parseCodeBlocks(fullContent)
          
          // FIX BUG #6: ALWAYS fetch files from DB before saving the message
          // Tools may have written files directly to DB, regardless of what parseCodeBlocks found
          // This ensures we never save with null codeOutput when files exist
          if (appId) {
            const updatedApp = await prisma.app.findUnique({
              where: { id: appId },
              select: { files: true },
            })
            if (updatedApp?.files && typeof updatedApp.files === 'object') {
              const dbFiles = updatedApp.files as Record<string, string>
              // Check if files changed compared to original
              const originalFiles = codeFiles as Record<string, string>
              const hasChanges = Object.keys(dbFiles).some(key => 
                dbFiles[key] !== originalFiles[key]
              ) || Object.keys(dbFiles).length !== Object.keys(originalFiles).length
              
              if (hasChanges) {
                // DB files take priority over parseCodeBlocks when files changed
                codeOutput = { files: dbFiles }
              } else if (!codeOutput && Object.keys(dbFiles).length > 0) {
                // If no codeOutput from parsing but we have files in DB, use them
                codeOutput = { files: dbFiles }
              }
            }
          }
          
          const creditsUsed = useBYOK ? 0 : calculateCreditCost(modelKey, inputTokens || 1000, outputTokens || 1000)

          // Deduct credits
          if (!useBYOK) {
            await deductCredits(user.id, modelKey, inputTokens || 1000, outputTokens || 1000, false)
          }

          // Save to conversation
          if (appId && app?.conversationId) {
            await prisma.message.create({
              data: {
                role: 'USER',
                content: messages[messages.length - 1].content,
                conversationId: app.conversationId,
              },
            })
            await prisma.message.create({
              data: {
                role: 'ASSISTANT',
                content: fullContent.replace(/```[\s\S]*?```/g, '').trim() || 'Code généré ✨',
                codeOutput: codeOutput || undefined,
                conversationId: app.conversationId,
              },
            })
            // Update status if code was generated
            if (codeOutput?.files) {
              await prisma.app.update({
                where: { id: appId },
                data: {
                  status: 'PREVIEW',
                },
              })
            }
          }

          // Send final message with metadata
          send('done', {
            codeOutput,
            usage: { 
              model: modelKey, 
              creditsUsed, 
              usedBYOK: useBYOK,
              inputTokens,
              outputTokens,
            },
          })

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          send('error', { error: errorMsg })
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to process chat',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ============ Anthropic Streaming with Tools ============

interface StreamOptions {
  apiKey: string
  apiModelName: string
  systemPrompt: string
  chatMessages: ChatMessage[]
  toolContext: ToolContext | null
  enableTools: boolean
  send: (type: string, data: any) => void
  onTokens: (input: number, output: number) => void
  onContent: (text: string) => void
}

async function streamAnthropicWithTools(options: StreamOptions) {
  const { 
    apiKey, 
    apiModelName, 
    systemPrompt, 
    chatMessages, 
    toolContext, 
    enableTools, 
    send, 
    onTokens, 
    onContent 
  } = options

  const anthropic = new Anthropic({ apiKey })
  const tools = enableTools ? toAnthropicTools() : undefined
  
  // Build conversation messages
  let conversationMessages: Anthropic.MessageParam[] = chatMessages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  // Loop for multi-turn tool use
  let continueLoop = true
  const MAX_TOOL_ROUNDS = 10 // Safety limit
  let roundCount = 0

  while (continueLoop && roundCount < MAX_TOOL_ROUNDS) {
    roundCount++
    
    // ============ FIX BUG #1 & #2: Accumulate content blocks manually ============
    const contentBlocks: Map<number, Anthropic.ContentBlock> = new Map()
    let currentBlockIndex = -1
    let currentTextContent = ''
    let currentToolUse: { id: string; name: string; inputJson: string } | null = null
    
    const response = await anthropic.messages.create({
      model: apiModelName,
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversationMessages,
      tools,
      stream: true,
    })

    let stopReason: string | null = null

    for await (const event of response) {
      // Handle content_block_start - initialize block tracking
      if (event.type === 'content_block_start') {
        currentBlockIndex = event.index
        
        if (event.content_block.type === 'text') {
          currentTextContent = event.content_block.text || ''
        } else if (event.content_block.type === 'tool_use') {
          currentToolUse = {
            id: event.content_block.id,
            name: event.content_block.name,
            inputJson: ''
          }
        }
      }
      
      // Handle content_block_delta - accumulate content
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          currentTextContent += event.delta.text
          onContent(event.delta.text)
          send('chunk', { content: event.delta.text })
        } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
          // FIX BUG #2: Accumulate tool input JSON fragments
          currentToolUse.inputJson += event.delta.partial_json
        }
      }
      
      // Handle content_block_stop - finalize the block
      if (event.type === 'content_block_stop') {
        if (currentTextContent && currentBlockIndex >= 0) {
          contentBlocks.set(currentBlockIndex, {
            type: 'text',
            text: currentTextContent
          } as Anthropic.TextBlock)
        }
        
        if (currentToolUse) {
          let parsedInput = {}
          try {
            if (currentToolUse.inputJson) {
              parsedInput = JSON.parse(currentToolUse.inputJson)
            }
          } catch (e) {
            console.error('[Anthropic] Failed to parse tool input JSON:', e)
          }
          
          contentBlocks.set(currentBlockIndex, {
            type: 'tool_use',
            id: currentToolUse.id,
            name: currentToolUse.name,
            input: parsedInput
          } as Anthropic.ToolUseBlock)
          
          currentToolUse = null
        }
        
        currentTextContent = ''
        currentBlockIndex = -1
      }
      
      if (event.type === 'message_delta') {
        stopReason = event.delta.stop_reason
      }
      
      if (event.type === 'message_start' && event.message.usage) {
        onTokens(event.message.usage.input_tokens, 0)
      }
      
      if (event.type === 'message_delta' && event.usage) {
        onTokens(0, event.usage.output_tokens)
      }
    }

    // Build assistantContent from accumulated blocks (sorted by index)
    const assistantContent = Array.from(contentBlocks.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, block]) => block)

    // Add assistant message to conversation
    if (assistantContent.length > 0) {
      conversationMessages.push({
        role: 'assistant',
        content: assistantContent,
      })
    }

    // Check if we should continue (tool use)
    console.log('[Chat API] Stop reason:', stopReason, 'enableTools:', enableTools, 'hasContext:', !!toolContext)
    if (stopReason !== 'tool_use' || !enableTools || !toolContext) {
      continueLoop = false
      continue
    }

    // Extract and execute tool calls
    const toolUseBlocks = assistantContent.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )

    if (toolUseBlocks.length === 0) {
      continueLoop = false
      continue
    }

    // Send tool calls to client
    console.log('[Chat API] Tool calls detected:', toolUseBlocks.length, toolUseBlocks.map(t => t.name))
    for (const toolUse of toolUseBlocks) {
      send('tool_call', {
        id: toolUse.id,
        name: toolUse.name,
        arguments: toolUse.input,
      })
    }

    // Execute tools
    const toolCalls: ToolCall[] = toolUseBlocks.map(t => ({
      id: t.id,
      name: t.name,
      arguments: t.input as Record<string, unknown>,
    }))

    const results = await executeTools(toolCalls, toolContext)

    // Send results to client
    for (const result of results) {
      send('tool_result', {
        toolCallId: result.toolCallId,
        success: result.success,
        output: result.output,
        error: result.error,
      })
    }

    // Format results for API
    const formattedResults = formatAnthropicToolResults(results)

    // Add tool results to conversation
    conversationMessages.push({
      role: 'user',
      content: formattedResults,
    })
  }
}

// ============ OpenAI Streaming with Tools ============

interface OpenAIStreamOptions {
  apiKey: string
  apiModelName: string
  chatMessages: ChatMessage[]
  toolContext: ToolContext | null
  enableTools: boolean
  send: (type: string, data: any) => void
  onTokens: (input: number, output: number) => void
  onContent: (text: string) => void
}

async function streamOpenAIWithTools(options: OpenAIStreamOptions) {
  const { 
    apiKey, 
    apiModelName, 
    chatMessages, 
    toolContext, 
    enableTools, 
    send, 
    onTokens, 
    onContent 
  } = options

  const openai = new OpenAI({ apiKey })
  const tools = enableTools ? toOpenAITools() : undefined

  // Build conversation
  let conversationMessages: OpenAI.ChatCompletionMessageParam[] = chatMessages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  // Loop for multi-turn tool use
  let continueLoop = true
  const MAX_TOOL_ROUNDS = 10
  let roundCount = 0

  while (continueLoop && roundCount < MAX_TOOL_ROUNDS) {
    roundCount++

    const response = await openai.chat.completions.create({
      model: apiModelName,
      messages: conversationMessages,
      tools,
      tool_choice: enableTools ? 'auto' : undefined,
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.7,
      max_tokens: 4096,
    })

    let assistantContent = ''
    let toolCalls: OpenAI.ChatCompletionMessageToolCall[] = []
    let currentToolCallIndex = -1

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta

      // Handle text content
      if (delta?.content) {
        assistantContent += delta.content
        onContent(delta.content)
        send('chunk', { content: delta.content })
      }

      // Handle tool calls
      // FIX BUG #5: Accumulate tool_call.id when it arrives (may come in later chunks)
      if (delta?.tool_calls) {
        for (const tcDelta of delta.tool_calls) {
          const tcIndex = tcDelta.index
          
          // Initialize tool call entry if not exists
          if (!toolCalls[tcIndex]) {
            toolCalls[tcIndex] = {
              id: '',
              type: 'function',
              function: {
                name: '',
                arguments: '',
              },
            }
          }
          
          // Accumulate ID when it arrives (may be in first chunk or later)
          if (tcDelta.id) {
            toolCalls[tcIndex].id = tcDelta.id
          }
          
          // Accumulate function name when it arrives
          if (tcDelta.function?.name) {
            toolCalls[tcIndex].function.name = tcDelta.function.name
          }
          
          // Accumulate function arguments
          if (tcDelta.function?.arguments) {
            toolCalls[tcIndex].function.arguments += tcDelta.function.arguments
          }
          
          currentToolCallIndex = tcIndex
        }
      }

      // Handle usage
      if (chunk.usage) {
        onTokens(chunk.usage.prompt_tokens || 0, chunk.usage.completion_tokens || 0)
      }
    }

    // Add assistant message to conversation
    const assistantMessage: OpenAI.ChatCompletionAssistantMessageParam = {
      role: 'assistant',
      content: assistantContent || null,
    }
    if (toolCalls.length > 0) {
      assistantMessage.tool_calls = toolCalls
    }
    conversationMessages.push(assistantMessage)

    // If no tool calls, we're done
    if (toolCalls.length === 0 || !enableTools || !toolContext) {
      continueLoop = false
      continue
    }

    // Send tool calls to client
    for (const tc of toolCalls) {
      let parsedArgs = {}
      try {
        parsedArgs = JSON.parse(tc.function.arguments)
      } catch {}
      
      send('tool_call', {
        id: tc.id,
        name: tc.function.name,
        arguments: parsedArgs,
      })
    }

    // Execute tools
    const parsedToolCalls: ToolCall[] = toolCalls.map(tc => {
      let args = {}
      try {
        args = JSON.parse(tc.function.arguments)
      } catch {}
      return {
        id: tc.id,
        name: tc.function.name,
        arguments: args,
      }
    })

    const results = await executeTools(parsedToolCalls, toolContext)

    // Send results to client
    for (const result of results) {
      send('tool_result', {
        toolCallId: result.toolCallId,
        success: result.success,
        output: result.output,
        error: result.error,
      })
    }

    // Add tool results to conversation
    const formattedResults = formatOpenAIToolResults(results)
    for (const result of formattedResults) {
      conversationMessages.push(result as OpenAI.ChatCompletionToolMessageParam)
    }
  }
}
