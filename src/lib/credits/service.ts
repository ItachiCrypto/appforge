import { prisma } from '@/lib/prisma'
import {
  MODEL_PRICING,
  MARGIN,
  CREDITS_PER_EURO,
  SIGNUP_BONUS_CREDITS,
  USD_TO_EUR,
} from './pricing'

// Types
export interface CreditUsage {
  id: string
  userId: string
  modelId: string
  inputTokens: number
  outputTokens: number
  creditsUsed: number
  usedByok: boolean
  createdAt: Date
}

/**
 * Calculer le coût en crédits pour une génération AI
 * @param modelKey - Clé du modèle (ex: 'claude-sonnet-4')
 * @param inputTokens - Nombre de tokens en entrée
 * @param outputTokens - Nombre de tokens en sortie
 * @returns Nombre de crédits (arrondi au supérieur)
 */
export function calculateCreditCost(
  modelKey: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[modelKey]
  
  if (!pricing) {
    // Modèle inconnu: utiliser un pricing par défaut (celui de gpt-4o)
    console.warn(`Unknown model pricing for: ${modelKey}, using default pricing`)
    const defaultPricing = MODEL_PRICING['gpt-4o']
    return calculateCreditCostWithPricing(defaultPricing, inputTokens, outputTokens)
  }
  
  return calculateCreditCostWithPricing(pricing, inputTokens, outputTokens)
}

function calculateCreditCostWithPricing(
  pricing: { input: number; output: number },
  inputTokens: number,
  outputTokens: number
): number {
  // Coût en $ (pricing est par 1M tokens)
  const inputCostUsd = (inputTokens / 1_000_000) * pricing.input
  const outputCostUsd = (outputTokens / 1_000_000) * pricing.output
  const totalCostUsd = inputCostUsd + outputCostUsd
  
  // Convertir en € 
  const totalCostEur = totalCostUsd * USD_TO_EUR
  
  // Appliquer la marge de 10%
  const totalWithMargin = totalCostEur * (1 + MARGIN)
  
  // Convertir en crédits (1 crédit = 0.01€)
  const credits = totalWithMargin * CREDITS_PER_EURO
  
  // Arrondir au supérieur (minimum 1 crédit)
  return Math.max(1, Math.ceil(credits))
}

/**
 * Get or create AIModel record
 */
async function getOrCreateAIModel(modelKey: string) {
  // Try to find existing model
  let model = await prisma.aIModel.findUnique({
    where: { modelId: modelKey },
  })
  
  if (model) return model
  
  // Determine provider from model key
  const provider = modelKey.startsWith('claude') || modelKey.startsWith('claude-')
    ? 'ANTHROPIC'
    : 'OPENAI'
  
  // Get pricing
  const pricing = MODEL_PRICING[modelKey] || { input: 2.5, output: 10 }
  
  // Create the model
  model = await prisma.aIModel.create({
    data: {
      modelId: modelKey,
      provider: provider,
      displayName: modelKey,
      inputCostPer1M: pricing.input,
      outputCostPer1M: pricing.output,
      isAvailable: true,
    },
  })
  
  return model
}

/**
 * Vérifier si l'utilisateur a assez de crédits
 * @param userId - ID de l'utilisateur
 * @param estimatedCredits - Crédits estimés nécessaires
 * @returns true si l'utilisateur a assez de crédits
 */
export async function hasEnoughCredits(
  userId: string,
  estimatedCredits: number
): Promise<boolean> {
  const balance = await getBalance(userId)
  return balance >= estimatedCredits
}

/**
 * Déduire des crédits après usage
 * @param userId - ID de l'utilisateur
 * @param modelKey - Clé du modèle utilisé
 * @param inputTokens - Tokens en entrée
 * @param outputTokens - Tokens en sortie
 * @param usedByok - Si true, l'utilisateur a utilisé sa propre clé API
 */
export async function deductCredits(
  userId: string,
  modelKey: string,
  inputTokens: number,
  outputTokens: number,
  usedByok: boolean
): Promise<void> {
  // Get or create the AIModel record
  const model = await getOrCreateAIModel(modelKey)
  
  // Si l'utilisateur utilise sa propre clé API, pas de déduction
  if (usedByok) {
    // Logger quand même l'usage pour les stats (avec 0 crédits)
    await prisma.creditUsage.create({
      data: {
        userId,
        modelId: model.id,
        inputTokens,
        outputTokens,
        creditsUsed: 0,
        usedByok: true,
      },
    })
    return
  }
  
  const creditsToDeduct = calculateCreditCost(modelKey, inputTokens, outputTokens)
  
  // Transaction pour garantir la cohérence
  await prisma.$transaction(async (tx) => {
    // Récupérer le solde actuel
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    })
    
    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }
    
    if (user.creditBalance < creditsToDeduct) {
      throw new Error(`Insufficient credits: ${user.creditBalance} < ${creditsToDeduct}`)
    }
    
    // Déduire les crédits
    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: creditsToDeduct } },
    })
    
    // Logger l'usage
    await tx.creditUsage.create({
      data: {
        userId,
        modelId: model.id,
        inputTokens,
        outputTokens,
        creditsUsed: creditsToDeduct,
        usedByok: false,
      },
    })
  })
}

/**
 * Ajouter des crédits après un achat Stripe
 * @param userId - ID de l'utilisateur
 * @param amountEuros - Montant en euros
 * @param stripeSessionId - ID de la session Stripe pour traçabilité
 */
export async function addCredits(
  userId: string,
  amountEuros: number,
  stripeSessionId: string
): Promise<void> {
  const creditsToAdd = Math.floor(amountEuros * CREDITS_PER_EURO)
  
  await prisma.$transaction(async (tx) => {
    // Ajouter les crédits
    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: creditsToAdd } },
    })
    
    // Logger la transaction (use CreditPurchase)
    await tx.creditPurchase.create({
      data: {
        userId,
        amountEuros,
        creditsAdded: creditsToAdd,
        stripeSessionId,
        status: 'COMPLETED',
      },
    })
  })
}

/**
 * Donner le bonus d'inscription (10€ = 1000 crédits)
 * @param userId - ID du nouvel utilisateur
 */
export async function giveSignupBonus(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Vérifier que l'utilisateur n'a pas déjà reçu le bonus
    // Check if creditBalance is still default (1000)
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, createdAt: true },
    })
    
    if (!user) return
    
    // Si l'utilisateur a déjà des crédits différents de la valeur par défaut, skip
    if (user.creditBalance !== 1000) {
      console.warn(`User ${userId} already has modified credit balance`)
      return
    }
    
    // Les crédits sont déjà à 1000 par défaut dans le schema
    // On n'a pas besoin de les ajouter
  })
}

/**
 * Récupérer le solde de crédits d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Nombre de crédits
 */
export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  })
  
  return user?.creditBalance ?? 0
}

/**
 * Récupérer l'historique d'utilisation des crédits
 * @param userId - ID de l'utilisateur
 * @param limit - Nombre max de résultats (défaut: 50)
 * @returns Liste des usages
 */
export async function getUsageHistory(
  userId: string,
  limit: number = 50
): Promise<CreditUsage[]> {
  const usages = await prisma.creditUsage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      model: true,
    },
  })
  
  // Transform to flat structure
  return usages.map((u) => ({
    id: u.id,
    userId: u.userId,
    modelId: u.model.modelId,
    inputTokens: u.inputTokens,
    outputTokens: u.outputTokens,
    creditsUsed: u.creditsUsed,
    usedByok: u.usedByok,
    createdAt: u.createdAt,
  }))
}

/**
 * Estimer le coût en crédits avant génération (pour affichage UI)
 * @param modelKey - Clé du modèle
 * @param estimatedInputTokens - Estimation tokens entrée
 * @param estimatedOutputTokens - Estimation tokens sortie (défaut: 1000)
 * @returns Estimation en crédits
 */
export function estimateCreditCost(
  modelKey: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number = 1000
): number {
  return calculateCreditCost(modelKey, estimatedInputTokens, estimatedOutputTokens)
}

/**
 * Convertir des crédits en euros (pour affichage)
 * @param credits - Nombre de crédits
 * @returns Montant en euros
 */
export function creditsToEuros(credits: number): number {
  return credits / CREDITS_PER_EURO
}

/**
 * Convertir des euros en crédits
 * @param euros - Montant en euros
 * @returns Nombre de crédits
 */
export function eurosToCredits(euros: number): number {
  return Math.floor(euros * CREDITS_PER_EURO)
}
