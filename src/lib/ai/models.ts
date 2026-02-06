/**
 * AI Models Configuration
 * Defines all available models with their providers and pricing
 */

export const AI_MODELS = {
  // Anthropic Models
  'claude-opus-4': {
    provider: 'anthropic',
    modelId: 'claude-opus-4-20250514',
    displayName: 'Claude Opus 4',
    description: 'Most powerful model for complex tasks',
    inputCostPer1M: 15,
    outputCostPer1M: 75,
    maxTokens: 4096,
    contextWindow: 200000,
  },
  'claude-sonnet-4': {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    description: 'Best balance of speed and capability',
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    maxTokens: 4096,
    contextWindow: 200000,
  },
  'claude-haiku-3.5': {
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    displayName: 'Claude Haiku 3.5',
    description: 'Fastest, most cost-effective',
    inputCostPer1M: 0.8,
    outputCostPer1M: 4,
    maxTokens: 4096,
    contextWindow: 200000,
  },
  
  // OpenAI Models
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'Fast, intelligent, multimodal',
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
    maxTokens: 4096,
    contextWindow: 128000,
  },
  'gpt-4o-mini': {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    description: 'Affordable small model',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    maxTokens: 4096,
    contextWindow: 128000,
  },
  'gpt-4-turbo': {
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    description: 'Previous generation, still powerful',
    inputCostPer1M: 10,
    outputCostPer1M: 30,
    maxTokens: 4096,
    contextWindow: 128000,
  },
  'o1': {
    provider: 'openai',
    modelId: 'o1',
    displayName: 'o1',
    description: 'Advanced reasoning model',
    inputCostPer1M: 15,
    outputCostPer1M: 60,
    maxTokens: 32768,
    contextWindow: 200000,
  },
  'o1-mini': {
    provider: 'openai',
    modelId: 'o1-mini',
    displayName: 'o1 Mini',
    description: 'Fast reasoning model',
    inputCostPer1M: 3,
    outputCostPer1M: 12,
    maxTokens: 16384,
    contextWindow: 128000,
  },
  'o3-mini': {
    provider: 'openai',
    modelId: 'o3-mini',
    displayName: 'o3 Mini',
    description: 'Latest compact reasoning',
    inputCostPer1M: 1.1,
    outputCostPer1M: 4.4,
    maxTokens: 16384,
    contextWindow: 128000,
  },
  
  // Kimi Models (Moonshot AI)
  'kimi-k2.5': {
    provider: 'kimi',
    modelId: 'kimi-k2.5',
    displayName: 'Kimi K2.5',
    description: 'Powerful multimodal reasoning model',
    inputCostPer1M: 2,
    outputCostPer1M: 8,
    maxTokens: 8192,
    contextWindow: 262144,
  },
} as const

export type ModelKey = keyof typeof AI_MODELS
export type ModelConfig = (typeof AI_MODELS)[ModelKey]
export type Provider = 'anthropic' | 'openai' | 'kimi'

/**
 * Get model configuration by key
 */
export function getModel(modelKey: string): ModelConfig | undefined {
  return AI_MODELS[modelKey as ModelKey]
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: Provider): Record<string, ModelConfig> {
  return Object.fromEntries(
    Object.entries(AI_MODELS).filter(([_, config]) => config.provider === provider)
  ) as Record<string, ModelConfig>
}

/**
 * Calculate cost for a generation
 */
export function calculateCost(
  modelKey: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModel(modelKey)
  if (!model) return 0
  
  const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M
  
  return inputCost + outputCost
}

/**
 * Get default model
 */
export const DEFAULT_MODEL: ModelKey = 'kimi-k2.5'

/**
 * List of model keys for UI selection
 */
export const MODEL_OPTIONS = Object.entries(AI_MODELS).map(([key, config]) => ({
  value: key,
  label: config.displayName,
  description: config.description,
  provider: config.provider,
}))
