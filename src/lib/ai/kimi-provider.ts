/**
 * Kimi AI Provider (Moonshot AI)
 * Uses OpenAI-compatible API with custom base URL
 */

import OpenAI from 'openai'

// Kimi API endpoint (international)
const KIMI_BASE_URL = 'https://api.moonshot.cn/v1'

export function getKimiClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.KIMI_API_KEY
  
  if (!key) {
    throw new Error(
      'Kimi API key required. Either set KIMI_API_KEY in environment variables, ' +
      'or pass it directly to the function.'
    )
  }
  
  return new OpenAI({
    apiKey: key,
    baseURL: KIMI_BASE_URL,
  })
}

export interface KimiGenerateOptions {
  maxTokens?: number
  temperature?: number
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[]
  toolChoice?: 'none' | 'auto' | 'any' | { type: 'function'; function: { name: string } }
}

export interface KimiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface KimiGenerateResult {
  content: string
  inputTokens: number
  outputTokens: number
  toolCalls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
}

/**
 * Generate a response using Kimi models
 */
export async function generateKimi(
  model: string,
  messages: KimiMessage[],
  apiKey?: string,
  options: KimiGenerateOptions = {}
): Promise<KimiGenerateResult> {
  const kimi = getKimiClient(apiKey)
  
  const { maxTokens = 4096, temperature = 0.7, tools, toolChoice } = options
  
  // Convert tool_choice format for Kimi
  let finalToolChoice: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption | undefined
  if (toolChoice === 'any') {
    finalToolChoice = 'auto' // Kimi uses 'auto' instead of 'any'
  } else if (toolChoice && typeof toolChoice === 'object') {
    finalToolChoice = toolChoice
  } else if (toolChoice) {
    finalToolChoice = toolChoice as 'none' | 'auto'
  }
  
  const completion = await kimi.chat.completions.create({
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: maxTokens,
    temperature,
    ...(tools && { tools }),
    ...(finalToolChoice && { tool_choice: finalToolChoice }),
  })
  
  const choice = completion.choices[0]
  const message = choice?.message
  
  return {
    content: message?.content || '',
    inputTokens: completion.usage?.prompt_tokens || 0,
    outputTokens: completion.usage?.completion_tokens || 0,
    toolCalls: message?.tool_calls,
  }
}
