import OpenAI from 'openai'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface GenerateResult {
  content: string
  inputTokens: number
  outputTokens: number
}

export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY
  
  if (!key) {
    throw new Error(
      'OpenAI API key required. Either set OPENAI_API_KEY in environment variables, ' +
      'or configure your own key (BYOK) in Settings → API Keys.'
    )
  }
  
  return new OpenAI({
    apiKey: key,
  })
}

/**
 * Check if model is a reasoning model (o1, o3 series)
 * These models don't support system messages and have different parameters
 */
function isReasoningModel(model: string): boolean {
  return model.startsWith('o1') || model.startsWith('o3')
}

/**
 * Generate a response using OpenAI models
 * Supports GPT-4, GPT-4o, o1, o3 series and returns token usage for billing
 */
export async function generateOpenAI(
  model: string,
  messages: Message[],
  apiKey?: string,
  maxTokens: number = 4096
): Promise<GenerateResult> {
  const openai = getOpenAIClient(apiKey)
  
  let formattedMessages: OpenAI.ChatCompletionMessageParam[]
  
  if (isReasoningModel(model)) {
    // Reasoning models (o1, o3) don't support system messages
    // Convert system message to user message with context
    const systemMessage = messages.find(m => m.role === 'system')?.content
    const otherMessages = messages.filter(m => m.role !== 'system')
    
    formattedMessages = []
    
    if (systemMessage) {
      // Prepend system context as part of the first user message
      const firstUserIdx = otherMessages.findIndex(m => m.role === 'user')
      if (firstUserIdx !== -1) {
        otherMessages[firstUserIdx] = {
          ...otherMessages[firstUserIdx],
          content: `Context: ${systemMessage}\n\n${otherMessages[firstUserIdx].content}`
        }
      }
    }
    
    formattedMessages = otherMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  } else {
    // Standard models support system messages
    formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }))
  }
  
  try {
    const params: OpenAI.ChatCompletionCreateParams = {
      model,
      messages: formattedMessages,
    }
    
    // Reasoning models use max_completion_tokens instead of max_tokens
    if (isReasoningModel(model)) {
      params.max_completion_tokens = maxTokens
    } else {
      params.max_tokens = maxTokens
      params.temperature = 0.7
    }
    
    const response = await openai.chat.completions.create(params)
    
    const content = response.choices[0]?.message?.content || ''
    const usage = response.usage
    
    return {
      content,
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
    }
  } catch (error: unknown) {
    // Handle specific error types
    if (error instanceof OpenAI.APIError) {
      const status = error.status
      
      if (status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key in Settings.')
      }
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.')
      }
      if (status === 402 || error.message?.includes('billing')) {
        throw new Error('OpenAI billing issue. Please check your OpenAI account.')
      }
      if (status === 503) {
        throw new Error('OpenAI API is unavailable. Please try again later.')
      }
      
      throw new Error(`OpenAI API error: ${error.message}`)
    }
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Unknown OpenAI API error')
  }
}
