/**
 * Multi-Provider AI Service
 * Routes requests to the appropriate provider (Anthropic/OpenAI)
 * based on the selected model
 */

import { AI_MODELS, getModel, calculateCost, type ModelKey } from './models'
import { generateAnthropic, type Message } from './anthropic'
import { generateOpenAI } from './openai-provider'
import { generateKimi } from './kimi-provider'

export interface GenerateResult {
  content: string
  inputTokens: number
  outputTokens: number
  model: string
  provider: string
  cost: number
}

export interface GenerateOptions {
  maxTokens?: number
  /** User's own API key (BYOK) */
  userApiKey?: string
  /** Platform API key (for credit-based usage) */
  platformApiKey?: string
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_MODEL' | 'NO_API_KEY' | 'PROVIDER_ERROR' | 'RATE_LIMIT' | 'BILLING_ERROR',
    public provider?: string
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

/**
 * Generate a response using the specified model
 * Automatically routes to the correct provider
 * 
 * @param modelKey - The model key (e.g., 'claude-sonnet-4', 'gpt-4o')
 * @param messages - Array of messages in the conversation
 * @param options - Generation options including API keys
 * @returns Generation result with content and token usage
 */
export async function generateWithModel(
  modelKey: string,
  messages: Message[],
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  // Validate model
  const model = getModel(modelKey)
  if (!model) {
    throw new AIServiceError(
      `Unknown model: ${modelKey}. Available models: ${Object.keys(AI_MODELS).join(', ')}`,
      'INVALID_MODEL'
    )
  }
  
  // Determine which API key to use (BYOK takes priority)
  const apiKey = options.userApiKey || options.platformApiKey
  
  if (!apiKey) {
    throw new AIServiceError(
      `No API key available for ${model.provider}. Please add your API key in Settings.`,
      'NO_API_KEY',
      model.provider
    )
  }
  
  const maxTokens = options.maxTokens || model.maxTokens
  
  try {
    let result: { content: string; inputTokens: number; outputTokens: number }
    
    const provider = model.provider as 'anthropic' | 'openai' | 'kimi'
    
    if (provider === 'anthropic') {
      result = await generateAnthropic(
        model.modelId,
        messages,
        apiKey,
        maxTokens
      )
    } else if (provider === 'openai') {
      result = await generateOpenAI(
        model.modelId,
        messages,
        apiKey,
        maxTokens
      )
    } else if (provider === 'kimi') {
      result = await generateKimi(
        model.modelId,
        messages,
        apiKey,
        { maxTokens }
      )
    } else {
      throw new AIServiceError(
        `Unknown provider: ${provider}`,
        'INVALID_MODEL'
      )
    }
    
    // Calculate cost for this generation
    const cost = calculateCost(modelKey, result.inputTokens, result.outputTokens)
    
    return {
      ...result,
      model: modelKey,
      provider: model.provider,
      cost,
    }
  } catch (error) {
    // Re-throw AIServiceErrors as-is
    if (error instanceof AIServiceError) {
      throw error
    }
    
    // Wrap other errors
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Rate limit') || error.message.includes('rate limit')) {
        throw new AIServiceError(error.message, 'RATE_LIMIT', model.provider)
      }
      if (error.message.includes('billing') || error.message.includes('Billing')) {
        throw new AIServiceError(error.message, 'BILLING_ERROR', model.provider)
      }
      if (error.message.includes('API key') || error.message.includes('api key')) {
        throw new AIServiceError(error.message, 'NO_API_KEY', model.provider)
      }
      
      throw new AIServiceError(
        `${model.provider} error: ${error.message}`,
        'PROVIDER_ERROR',
        model.provider
      )
    }
    
    throw new AIServiceError(
      `Unknown error with ${model.provider}`,
      'PROVIDER_ERROR',
      model.provider
    )
  }
}

/**
 * Check if a model key is valid
 */
export function isValidModel(modelKey: string): modelKey is ModelKey {
  return modelKey in AI_MODELS
}

/**
 * Get the provider for a model
 */
export function getProviderForModel(modelKey: string): 'anthropic' | 'openai' | 'kimi' | null {
  const model = getModel(modelKey)
  return model?.provider as 'anthropic' | 'openai' | 'kimi' | null
}

// Re-export types and utilities
export type { Message } from './anthropic'
export { AI_MODELS, MODEL_OPTIONS, DEFAULT_MODEL, calculateCost } from './models'
export type { ModelKey, ModelConfig } from './models'
