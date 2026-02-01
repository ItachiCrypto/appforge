import Anthropic from '@anthropic-ai/sdk'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface GenerateResult {
  content: string
  inputTokens: number
  outputTokens: number
}

export function getAnthropicClient(apiKey?: string): Anthropic {
  const key = apiKey || process.env.ANTHROPIC_API_KEY
  
  if (!key) {
    throw new Error(
      'Anthropic API key required. Either set ANTHROPIC_API_KEY in environment variables, ' +
      'or configure your own key (BYOK) in Settings → API Keys.'
    )
  }
  
  return new Anthropic({
    apiKey: key,
  })
}

/**
 * Generate a response using Anthropic's Claude models
 * Supports all Claude models and returns token usage for billing
 */
export async function generateAnthropic(
  model: string,
  messages: Message[],
  apiKey?: string,
  maxTokens: number = 4096
): Promise<GenerateResult> {
  const anthropic = getAnthropicClient(apiKey)
  
  // Extract system message
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  
  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemMessage,
      messages: chatMessages,
    })
    
    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text')
    const content = textContent?.type === 'text' ? textContent.text : ''
    
    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }
  } catch (error: unknown) {
    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      const status = error.status
      
      if (status === 401) {
        throw new Error('Invalid Anthropic API key. Please check your API key in Settings.')
      }
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.')
      }
      if (status === 402 || error.message?.includes('billing')) {
        throw new Error('Anthropic billing issue. Please check your Anthropic account.')
      }
      if (status === 529) {
        throw new Error('Anthropic API is overloaded. Please try again later.')
      }
      
      throw new Error(`Anthropic API error: ${error.message}`)
    }
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Unknown Anthropic API error')
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateAnthropic instead
 */
export async function streamChatAnthropic(
  messages: Message[],
  apiKey?: string,
  model: string = 'claude-sonnet-4-20250514'
): Promise<string> {
  const result = await generateAnthropic(
    model,
    messages,
    apiKey
  )
  return result.content
}
