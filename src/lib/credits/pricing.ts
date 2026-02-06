// Pricing des modèles (coût plateforme en $ par 1M tokens)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-opus-4': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-haiku-3.5': { input: 0.25, output: 1.25 },
  // OpenAI
  'gpt-4o': { input: 2.50, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'o1': { input: 15, output: 60 },
  'o1-mini': { input: 3, output: 12 },
  // Kimi (Moonshot)
  'kimi-k2.5': { input: 2, output: 8 },
}

// Marge appliquée sur le coût réel
export const MARGIN = 0.10 // 10%

// Conversion crédits <-> euros
export const CREDITS_PER_EURO = 100 // 1€ = 100 crédits (donc 1 crédit = 0.01€)

// Bonus d'inscription freemium
export const SIGNUP_BONUS_CREDITS = 1000 // 10€

// Taux de change USD -> EUR (approximatif, à ajuster)
export const USD_TO_EUR = 0.92
