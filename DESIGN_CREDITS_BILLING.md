# 💳 Design: Système de Crédits & Billing

> **Document de design technique pour le système de crédits AppForge**
> 
> Auteur: Expert Billing/Stripe  
> Date: 2025-01-XX

---

## 📋 Table des matières

1. [Analyse du code existant](#1-analyse-du-code-existant)
2. [Architecture proposée](#2-architecture-proposée)
3. [Schéma Prisma](#3-schéma-prisma)
4. [API Routes](#4-api-routes)
5. [Intégration Chat](#5-intégration-chat)
6. [Composants UI](#6-composants-ui)
7. [Configuration Stripe](#7-configuration-stripe)
8. [Checklist d'implémentation](#8-checklist-dimplémentation)

---

## 1. Analyse du code existant

### 1.1 Structure actuelle

```
src/
├── app/api/
│   ├── stripe/
│   │   ├── checkout/route.ts    # Création session Stripe (subscriptions)
│   │   └── portal/route.ts      # Portail client Stripe
│   ├── webhooks/
│   │   └── stripe/route.ts      # Webhooks Stripe (subscription events)
│   └── chat/route.ts            # Route chat avec fallback BYOK → Platform
├── lib/
│   ├── stripe/
│   │   ├── client.ts            # Client Stripe + helpers
│   │   └── plans.ts             # Définition des plans (STARTER, PRO, TEAM)
│   └── ai/
│       ├── openai.ts            # Client OpenAI (gpt-4o)
│       └── anthropic.ts         # Client Anthropic (claude-sonnet-4-20250514)
```

### 1.2 Flux actuel du chat

```typescript
// src/app/api/chat/route.ts - Logique simplifiée
1. Vérifie si l'user a BYOK (anthropicKey ou openaiKey)
2. Si BYOK → utilise la clé user
3. Si pas BYOK → fallback sur les clés plateforme
4. ⚠️ AUCUNE facturation quand on utilise les clés plateforme!
```

### 1.3 Modèle User actuel

```prisma
model User {
  id                    String   @id @default(cuid())
  clerkId               String   @unique
  email                 String   @unique
  name                  String?
  imageUrl              String?
  
  plan                  Plan     @default(FREE)
  stripeCustomerId      String?  @unique
  stripeSubscriptionId  String?
  
  // BYOK - Encrypted
  openaiKey             String?
  anthropicKey          String?
  
  // ... relations
}
```

### 1.4 Points d'intégration identifiés

| Composant | Modification nécessaire |
|-----------|------------------------|
| `schema.prisma` | Ajouter CreditBalance, CreditTransaction, CreditUsage |
| `chat/route.ts` | Vérifier solde avant appel AI, déduire après |
| `stripe/client.ts` | Ajouter fonction pour paiement one-time |
| `webhooks/stripe/route.ts` | Gérer `checkout.session.completed` pour credits |
| Page `/billing` | Ajouter section crédits + recharge |

---

## 2. Architecture proposée

### 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────────┐     ┌─────────────────┐
  │  User    │────▶│ Has BYOK?    │────▶│ Use user's key  │
  │  Chat    │     │              │ YES │ (no charge)     │
  └──────────┘     └──────────────┘     └─────────────────┘
                          │ NO
                          ▼
                   ┌──────────────┐     ┌─────────────────┐
                   │Has credits?  │────▶│  Block request  │
                   │              │ NO  │  Show top-up    │
                   └──────────────┘     └─────────────────┘
                          │ YES
                          ▼
                   ┌──────────────┐
                   │ Use platform │
                   │ key + deduct │
                   │ credits      │
                   └──────────────┘
```

### 2.2 Modèle de données

```
┌─────────────────┐       ┌───────────────────────┐
│      User       │       │    CreditBalance      │
├─────────────────┤       ├───────────────────────┤
│ id              │───────│ userId (1:1)          │
│ ...             │       │ balance (en cents)    │
└─────────────────┘       │ lastUpdatedAt         │
                          └───────────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                ┌─────────▼──────────┐ ┌───────▼────────────┐
                │ CreditTransaction  │ │   CreditUsage      │
                ├────────────────────┤ ├────────────────────┤
                │ TOP_UP / BONUS     │ │ Usage AI (chat)    │
                │ amount (+)         │ │ inputTokens        │
                │ stripeSessionId    │ │ outputTokens       │
                └────────────────────┘ │ cost (-)           │
                                       │ model              │
                                       └────────────────────┘
```

### 2.3 Pricing détaillé

#### Coûts réels des providers (2024-2025)

| Provider | Model | Input $/1M | Output $/1M |
|----------|-------|------------|-------------|
| Anthropic | claude-sonnet-4-20250514 | $3.00 | $15.00 |
| OpenAI | gpt-4o | $2.50 | $10.00 |

#### Prix utilisateur (coût + 5% marge)

| Provider | Model | Input $/1M | Output $/1M |
|----------|-------|------------|-------------|
| Anthropic | claude-sonnet-4-20250514 | $3.15 | $15.75 |
| OpenAI | gpt-4o | $2.625 | $10.50 |

#### En euros (taux ~1.08)

| Type | Prix/1M tokens |
|------|----------------|
| Input (Claude) | ~2.92€ |
| Output (Claude) | ~14.58€ |
| Input (GPT-4o) | ~2.43€ |
| Output (GPT-4o) | ~9.72€ |

### 2.4 Constantes de pricing

```typescript
// src/lib/credits/pricing.ts

export const CREDIT_PRICING = {
  // Freemium bonus en cents (1000 cents = 10€)
  SIGNUP_BONUS_CENTS: 1000, // 10€
  
  // Minimum recharge en cents
  MIN_TOPUP_CENTS: 500, // 5€
  
  // Marge appliquée
  MARGIN: 1.05, // 5%
  
  // Prix par million de tokens (en micro-euros pour précision)
  MODELS: {
    'claude-sonnet-4-20250514': {
      inputPer1M: 315_000,  // $3.15 = 315000 micro-cents
      outputPer1M: 1575_000, // $15.75
    },
    'gpt-4o': {
      inputPer1M: 262_500,  // $2.625
      outputPer1M: 1050_000, // $10.50
    },
  },
} as const

// Helper: calculer le coût d'une requête
export function calculateCost(
  model: keyof typeof CREDIT_PRICING.MODELS,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = CREDIT_PRICING.MODELS[model]
  
  // Coût en micro-cents
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M
  
  // Convertir en cents (arrondi supérieur pour notre bénéfice)
  return Math.ceil((inputCost + outputCost) / 1000)
}
```

---

## 3. Schéma Prisma

### 3.1 Nouveaux modèles à ajouter

```prisma
// Ajouter à prisma/schema.prisma

// ============ CREDITS ============

model CreditBalance {
  id            String   @id @default(cuid())
  
  // Balance en cents (100 = 1€)
  balance       Int      @default(0)
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  transactions  CreditTransaction[]
  usages        CreditUsage[]
}

model CreditTransaction {
  id            String   @id @default(cuid())
  
  // Type de transaction
  type          CreditTransactionType
  
  // Montant en cents (toujours positif)
  amount        Int
  
  // Description
  description   String?
  
  // Stripe reference pour les top-ups
  stripeSessionId    String?
  stripePaymentId    String?
  
  // Balance avant/après pour audit
  balanceBefore Int
  balanceAfter  Int
  
  // Metadata JSON
  metadata      Json?
  
  createdAt     DateTime @default(now())
  
  // Relations
  creditBalanceId String
  creditBalance   CreditBalance @relation(fields: [creditBalanceId], references: [id], onDelete: Cascade)
  
  @@index([creditBalanceId])
  @@index([stripeSessionId])
  @@index([createdAt])
}

enum CreditTransactionType {
  SIGNUP_BONUS    // 10€ gratuits à l'inscription
  TOP_UP          // Recharge via Stripe
  PROMO_BONUS     // Code promo, parrainage, etc.
  REFUND          // Remboursement
  ADJUSTMENT      // Ajustement manuel admin
}

model CreditUsage {
  id            String   @id @default(cuid())
  
  // Tokens utilisés
  inputTokens   Int
  outputTokens  Int
  totalTokens   Int
  
  // Coût en cents
  cost          Int
  
  // Modèle utilisé
  model         String
  
  // Référence optionnelle au message/conversation
  conversationId String?
  messageId      String?
  
  createdAt     DateTime @default(now())
  
  // Relations
  creditBalanceId String
  creditBalance   CreditBalance @relation(fields: [creditBalanceId], references: [id], onDelete: Cascade)
  
  @@index([creditBalanceId])
  @@index([createdAt])
}
```

### 3.2 Modification du modèle User

```prisma
model User {
  id            String    @id @default(cuid())
  clerkId       String    @unique
  email         String    @unique
  name          String?
  imageUrl      String?
  
  // Subscription
  plan          Plan      @default(FREE)
  stripeCustomerId String? @unique
  stripeSubscriptionId String?
  
  // BYOK - Encrypted
  openaiKey     String?
  anthropicKey  String?
  
  // Relations existantes
  apps          App[]
  conversations Conversation[]
  
  // ✅ NOUVELLE RELATION
  creditBalance CreditBalance?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## 4. API Routes

### 4.1 GET `/api/credits` - Récupérer le solde

```typescript
// src/app/api/credits/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        creditBalance: {
          include: {
            // Dernières transactions pour l'historique
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            // Derniers usages
            usages: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Si pas de balance, en créer une (lazy init)
    let creditBalance = user.creditBalance
    if (!creditBalance) {
      creditBalance = await prisma.creditBalance.create({
        data: {
          userId: user.id,
          balance: 0,
        },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
          usages: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      })
    }

    return NextResponse.json({
      balance: creditBalance.balance,
      balanceFormatted: (creditBalance.balance / 100).toFixed(2) + '€',
      transactions: creditBalance.transactions,
      usages: creditBalance.usages,
      hasByok: !!(user.openaiKey || user.anthropicKey),
    })
  } catch (error) {
    console.error('Credits GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}
```

### 4.2 POST `/api/credits/topup` - Créer session Stripe

```typescript
// src/app/api/credits/topup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { stripe, createCustomer } from '@/lib/stripe/client'
import { absoluteUrl } from '@/lib/utils'
import { CREDIT_PRICING } from '@/lib/credits/pricing'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { amount } = await req.json()
    
    // Validation du montant (en cents)
    const amountCents = parseInt(amount)
    if (isNaN(amountCents) || amountCents < CREDIT_PRICING.MIN_TOPUP_CENTS) {
      return NextResponse.json({ 
        error: `Minimum top-up is ${CREDIT_PRICING.MIN_TOPUP_CENTS / 100}€` 
      }, { status: 400 })
    }

    // Max 1000€
    if (amountCents > 100000) {
      return NextResponse.json({ 
        error: 'Maximum top-up is 1000€' 
      }, { status: 400 })
    }

    // Créer/récupérer Stripe customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await createCustomer(user.email, user.name || undefined)
      customerId = customer.id
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Créer Stripe Checkout Session (payment mode, pas subscription)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountCents,
            product_data: {
              name: 'AppForge Credits',
              description: `${(amountCents / 100).toFixed(2)}€ de crédits AI`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'credit_topup',
        userId: user.id,
        amountCents: amountCents.toString(),
      },
      success_url: absoluteUrl('/billing?topup=success'),
      cancel_url: absoluteUrl('/billing?topup=canceled'),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Top-up error:', error)
    return NextResponse.json({ error: 'Failed to create top-up session' }, { status: 500 })
  }
}
```

### 4.3 Webhook Stripe modifié

```typescript
// src/app/api/webhooks/stripe/route.ts (modifications)

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/prisma'
import { getPlanFromPriceId } from '@/lib/stripe/plans'
import { creditUser } from '@/lib/credits/service'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // ✅ NOUVEAU: Gérer les top-ups de crédits
        if (session.metadata?.type === 'credit_topup') {
          const userId = session.metadata.userId
          const amountCents = parseInt(session.metadata.amountCents || '0')
          
          if (userId && amountCents > 0) {
            await creditUser({
              userId,
              amount: amountCents,
              type: 'TOP_UP',
              description: `Recharge de ${(amountCents / 100).toFixed(2)}€`,
              stripeSessionId: session.id,
              stripePaymentId: session.payment_intent as string,
            })
            console.log(`✅ Credited ${amountCents} cents to user ${userId}`)
          }
          break
        }
        
        // Gérer les subscriptions (code existant)
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const priceId = subscription.items.data[0]?.price?.id
          const plan = getPlanFromPriceId(priceId || '')

          await prisma.user.update({
            where: { stripeCustomerId: session.customer as string },
            data: {
              plan,
              stripeSubscriptionId: subscription.id,
            },
          })
        }
        break
      }

      // ... reste du code existant pour subscriptions
      case 'customer.subscription.updated': {
        // ... code existant
        break
      }

      case 'customer.subscription.deleted': {
        // ... code existant
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

### 4.4 Service de crédits

```typescript
// src/lib/credits/service.ts

import { prisma } from '@/lib/prisma'
import { CreditTransactionType } from '@prisma/client'
import { CREDIT_PRICING, calculateCost } from './pricing'

interface CreditUserParams {
  userId: string
  amount: number
  type: CreditTransactionType
  description?: string
  stripeSessionId?: string
  stripePaymentId?: string
  metadata?: Record<string, unknown>
}

/**
 * Créditer un utilisateur (top-up, bonus, etc.)
 */
export async function creditUser(params: CreditUserParams) {
  const { userId, amount, type, description, stripeSessionId, stripePaymentId, metadata } = params
  
  return prisma.$transaction(async (tx) => {
    // Récupérer ou créer le balance
    let balance = await tx.creditBalance.findUnique({
      where: { userId },
    })
    
    if (!balance) {
      balance = await tx.creditBalance.create({
        data: { userId, balance: 0 },
      })
    }
    
    const balanceBefore = balance.balance
    const balanceAfter = balanceBefore + amount
    
    // Mettre à jour le solde
    await tx.creditBalance.update({
      where: { id: balance.id },
      data: { balance: balanceAfter },
    })
    
    // Créer la transaction
    const transaction = await tx.creditTransaction.create({
      data: {
        creditBalanceId: balance.id,
        type,
        amount,
        description,
        stripeSessionId,
        stripePaymentId,
        balanceBefore,
        balanceAfter,
        metadata: metadata as any,
      },
    })
    
    return { balance: balanceAfter, transaction }
  })
}

/**
 * Donner le bonus d'inscription (10€)
 */
export async function giveSignupBonus(userId: string) {
  return creditUser({
    userId,
    amount: CREDIT_PRICING.SIGNUP_BONUS_CENTS,
    type: 'SIGNUP_BONUS',
    description: 'Bonus de bienvenue - 10€ de crédits gratuits',
  })
}

/**
 * Vérifier si l'utilisateur a assez de crédits
 */
export async function hasEnoughCredits(userId: string, estimatedCost: number): Promise<boolean> {
  const balance = await prisma.creditBalance.findUnique({
    where: { userId },
    select: { balance: true },
  })
  
  return (balance?.balance ?? 0) >= estimatedCost
}

/**
 * Déduire les crédits après un appel AI
 */
export async function deductCredits(params: {
  userId: string
  model: string
  inputTokens: number
  outputTokens: number
  conversationId?: string
  messageId?: string
}): Promise<{ cost: number; newBalance: number }> {
  const { userId, model, inputTokens, outputTokens, conversationId, messageId } = params
  
  // Calculer le coût
  const modelKey = model as keyof typeof CREDIT_PRICING.MODELS
  const cost = calculateCost(
    modelKey in CREDIT_PRICING.MODELS ? modelKey : 'claude-sonnet-4-20250514',
    inputTokens,
    outputTokens
  )
  
  return prisma.$transaction(async (tx) => {
    const balance = await tx.creditBalance.findUnique({
      where: { userId },
    })
    
    if (!balance) {
      throw new Error('No credit balance found')
    }
    
    if (balance.balance < cost) {
      throw new Error('Insufficient credits')
    }
    
    const newBalance = balance.balance - cost
    
    // Mettre à jour le solde
    await tx.creditBalance.update({
      where: { id: balance.id },
      data: { balance: newBalance },
    })
    
    // Enregistrer l'usage
    await tx.creditUsage.create({
      data: {
        creditBalanceId: balance.id,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost,
        model,
        conversationId,
        messageId,
      },
    })
    
    return { cost, newBalance }
  })
}

/**
 * Estimer le coût avant un appel (pour le pre-check)
 * On estime ~500 input tokens et ~2000 output tokens pour une requête typique
 */
export function estimateCost(model: string = 'claude-sonnet-4-20250514'): number {
  const modelKey = model as keyof typeof CREDIT_PRICING.MODELS
  return calculateCost(
    modelKey in CREDIT_PRICING.MODELS ? modelKey : 'claude-sonnet-4-20250514',
    500,   // Input tokens estimés
    2000   // Output tokens estimés
  )
}
```

---

## 5. Intégration Chat

### 5.1 Modification de `/api/chat/route.ts`

```typescript
// src/app/api/chat/route.ts - VERSION MODIFIÉE

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { streamChat, parseCodeBlocks } from '@/lib/ai/openai'
import { streamChatAnthropic } from '@/lib/ai/anthropic'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { hasEnoughCredits, deductCredits, estimateCost } from '@/lib/credits/service'
import { countTokens } from '@/lib/credits/tokens'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ... parsing du body (code existant) ...

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { creditBalance: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ... code existant pour app context ...

    // API Key hierarchy
    const userAnthropicKey = user.anthropicKey
    const userOpenaiKey = user.openaiKey
    const platformAnthropicKey = process.env.ANTHROPIC_API_KEY
    const platformOpenaiKey = process.env.OPENAI_API_KEY
    
    const hasByok = !!(userAnthropicKey || userOpenaiKey)
    const hasPlatformKey = !!(platformAnthropicKey || platformOpenaiKey)
    
    // ✅ NOUVEAU: Vérifier les crédits si pas de BYOK
    let usePlatformKey = false
    let modelUsed = 'claude-sonnet-4-20250514'
    
    if (!hasByok) {
      if (!hasPlatformKey) {
        return NextResponse.json({ 
          error: 'No API key configured. Please add your OpenAI or Anthropic API key in settings.' 
        }, { status: 400 })
      }
      
      // Estimer le coût et vérifier les crédits
      const estimatedCost = estimateCost(modelUsed)
      const hasCredits = await hasEnoughCredits(user.id, estimatedCost)
      
      if (!hasCredits) {
        return NextResponse.json({ 
          error: 'INSUFFICIENT_CREDITS',
          message: 'Not enough credits. Please top up or add your own API key.',
          balance: user.creditBalance?.balance ?? 0,
          estimatedCost,
        }, { status: 402 }) // 402 Payment Required
      }
      
      usePlatformKey = true
    }

    // ... code existant pour générer la réponse ...
    
    let fullContent = ''
    let inputTokens = 0
    let outputTokens = 0

    const tryGenerate = async (
      anthropicKey: string | null | undefined, 
      openaiKey: string | null | undefined
    ): Promise<{ content: string; inputTokens: number; outputTokens: number }> => {
      if (anthropicKey) {
        modelUsed = 'claude-sonnet-4-20250514'
        const result = await streamChatAnthropicWithUsage(chatMessages, anthropicKey)
        return result
      } else if (openaiKey) {
        modelUsed = 'gpt-4o'
        const result = await streamChatWithUsage(chatMessages, openaiKey)
        return result
      }
      throw new Error('No API key available')
    }

    try {
      if (hasByok) {
        const result = await tryGenerate(userAnthropicKey, userOpenaiKey)
        fullContent = result.content
        inputTokens = result.inputTokens
        outputTokens = result.outputTokens
      } else {
        // Utiliser les clés plateforme
        const result = await tryGenerate(platformAnthropicKey, platformOpenaiKey)
        fullContent = result.content
        inputTokens = result.inputTokens
        outputTokens = result.outputTokens
      }
    } catch (error) {
      // ... gestion d'erreur existante ...
    }

    // ✅ NOUVEAU: Déduire les crédits si on a utilisé les clés plateforme
    let creditsDeducted = 0
    let newBalance = 0
    
    if (usePlatformKey && inputTokens > 0) {
      try {
        const deduction = await deductCredits({
          userId: user.id,
          model: modelUsed,
          inputTokens,
          outputTokens,
          conversationId: app?.conversationId,
        })
        creditsDeducted = deduction.cost
        newBalance = deduction.newBalance
      } catch (deductError) {
        console.error('Failed to deduct credits:', deductError)
        // On ne bloque pas la réponse, mais on log l'erreur
      }
    }

    // ... code existant pour parser et sauvegarder ...

    return NextResponse.json({
      content: cleanContent || 'Code generated successfully.',
      codeOutput,
      success: true,
      // ✅ NOUVEAU: Info sur les crédits
      credits: usePlatformKey ? {
        used: creditsDeducted,
        balance: newBalance,
        inputTokens,
        outputTokens,
      } : undefined,
    })
  } catch (error) {
    // ... gestion d'erreur existante ...
  }
}

// Helper modifié pour retourner les tokens
async function streamChatAnthropicWithUsage(
  messages: any[],
  apiKey: string
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const anthropic = new Anthropic({ apiKey })
  
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages.filter(m => m.role !== 'system')
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemMessage,
    messages: chatMessages,
  })
  
  const textContent = response.content.find(block => block.type === 'text')
  
  return {
    content: textContent?.type === 'text' ? textContent.text : '',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}
```

---

## 6. Composants UI

### 6.1 Composant CreditBalance

```typescript
// src/components/credits/credit-balance.tsx

'use client'

import { useState, useEffect } from 'react'
import { Coins, TrendingDown, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TopUpModal } from './topup-modal'

interface CreditBalanceProps {
  variant?: 'compact' | 'full'
  showTopUp?: boolean
}

export function CreditBalance({ variant = 'compact', showTopUp = true }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [hasByok, setHasByok] = useState(false)

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/credits')
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
        setHasByok(data.hasByok)
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (hasByok) {
    // Ne pas afficher si BYOK
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    )
  }

  const formattedBalance = (balance / 100).toFixed(2)
  const isLow = balance < 200 // Moins de 2€

  if (variant === 'compact') {
    return (
      <>
        <Button
          variant={isLow ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setShowModal(true)}
          className="gap-2"
        >
          <Coins className="w-4 h-4" />
          {formattedBalance}€
          {isLow && <TrendingDown className="w-3 h-3" />}
        </Button>
        
        <TopUpModal 
          open={showModal} 
          onClose={() => setShowModal(false)}
          onSuccess={fetchBalance}
        />
      </>
    )
  }

  return (
    <Card className={isLow ? 'border-destructive' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isLow ? 'bg-destructive/10' : 'bg-primary/10'
            }`}>
              <Coins className={`w-5 h-5 ${isLow ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Crédits AI</p>
              <p className="text-2xl font-bold">{formattedBalance}€</p>
            </div>
          </div>
          
          {showTopUp && (
            <Button onClick={() => setShowModal(true)}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Recharger
            </Button>
          )}
        </div>
        
        {isLow && (
          <p className="text-sm text-destructive mt-4">
            ⚠️ Solde faible. Rechargez pour continuer à utiliser l'IA.
          </p>
        )}
      </CardContent>
      
      <TopUpModal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        onSuccess={fetchBalance}
      />
    </Card>
  )
}
```

### 6.2 Modal de recharge

```typescript
// src/components/credits/topup-modal.tsx

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, Zap } from 'lucide-react'

const TOPUP_OPTIONS = [
  { amount: 500, label: '5€', popular: false },
  { amount: 1000, label: '10€', popular: true },
  { amount: 2500, label: '25€', popular: false },
  { amount: 5000, label: '50€', popular: false },
]

interface TopUpModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function TopUpModal({ open, onClose, onSuccess }: TopUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(1000)
  const [customAmount, setCustomAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTopUp = async () => {
    const amount = customAmount ? parseInt(customAmount) * 100 : selectedAmount
    
    if (amount < 500) {
      setError('Minimum 5€')
      return
    }
    if (amount > 100000) {
      setError('Maximum 1000€')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/credits/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create checkout')
      }
      
      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recharger vos crédits
          </DialogTitle>
          <DialogDescription>
            Ajoutez des crédits pour utiliser l'IA sans vos propres clés API.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Options prédéfinies */}
          <div className="grid grid-cols-2 gap-2">
            {TOPUP_OPTIONS.map(({ amount, label, popular }) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? 'default' : 'outline'}
                className={`relative ${popular ? 'ring-2 ring-primary' : ''}`}
                onClick={() => {
                  setSelectedAmount(amount)
                  setCustomAmount('')
                }}
              >
                {label}
                {popular && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 inline" />
                  </span>
                )}
              </Button>
            ))}
          </div>
          
          {/* Montant personnalisé */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Ou montant personnalisé
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="€"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setSelectedAmount(0)
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                min="5"
                max="1000"
              />
              <span className="text-muted-foreground">€</span>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          {/* Info pricing */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">💡 Comment ça marche ?</p>
            <ul className="space-y-1">
              <li>• ~1000 messages avec Claude pour 10€</li>
              <li>• Facturation au token réel utilisé</li>
              <li>• Pas d'expiration des crédits</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleTopUp} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Payer {customAmount ? `${customAmount}€` : `${selectedAmount / 100}€`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 6.3 Historique des transactions

```typescript
// src/components/credits/credit-history.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowUpCircle, ArrowDownCircle, Gift, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Transaction {
  id: string
  type: string
  amount: number
  description?: string
  createdAt: string
  balanceAfter: number
}

interface Usage {
  id: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  createdAt: string
}

export function CreditHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [usages, setUsages] = useState<Usage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/credits')
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setUsages(data.usages || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TOP_UP':
        return <ArrowUpCircle className="w-4 h-4 text-green-500" />
      case 'SIGNUP_BONUS':
      case 'PROMO_BONUS':
        return <Gift className="w-4 h-4 text-purple-500" />
      default:
        return <ArrowUpCircle className="w-4 h-4 text-blue-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TOP_UP':
        return <Badge variant="outline" className="text-green-600">Recharge</Badge>
      case 'SIGNUP_BONUS':
        return <Badge variant="outline" className="text-purple-600">Bonus</Badge>
      case 'PROMO_BONUS':
        return <Badge variant="outline" className="text-purple-600">Promo</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="transactions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="usage">Utilisation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="mt-4">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune transaction
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(tx.type)}
                      <div>
                        <p className="text-sm font-medium">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.createdAt), { 
                            addSuffix: true,
                            locale: fr 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        +{(tx.amount / 100).toFixed(2)}€
                      </p>
                      {getTypeBadge(tx.type)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="usage" className="mt-4">
            {usages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune utilisation
              </p>
            ) : (
              <div className="space-y-3">
                {usages.map((usage) => (
                  <div key={usage.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <ArrowDownCircle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {usage.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {usage.inputTokens.toLocaleString()} in / {usage.outputTokens.toLocaleString()} out
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        -{(usage.cost / 100).toFixed(4)}€
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(usage.createdAt), { 
                          addSuffix: true,
                          locale: fr 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
```

---

## 7. Configuration Stripe

### 7.1 Variables d'environnement

```bash
# .env.local - Ajouter:

# Stripe existant
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Plans existants
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_TEAM_PRICE_ID=price_xxx

# Pas besoin de nouveaux price IDs pour les crédits
# On utilise price_data dynamique dans le checkout
```

### 7.2 Webhook Stripe - Events à écouter

Dans le dashboard Stripe → Webhooks, ajouter:
- `checkout.session.completed` ✅ (déjà configuré)

Le webhook existant gère déjà cet event, on a juste ajouté la logique pour `credit_topup`.

---

## 8. Checklist d'implémentation

### Phase 1: Database & Backend ✏️

- [ ] Ajouter les modèles Prisma (CreditBalance, CreditTransaction, CreditUsage)
- [ ] `npx prisma migrate dev --name add_credits`
- [ ] Créer `/lib/credits/pricing.ts`
- [ ] Créer `/lib/credits/service.ts`
- [ ] Créer `/api/credits/route.ts` (GET)
- [ ] Créer `/api/credits/topup/route.ts` (POST)
- [ ] Modifier `/api/webhooks/stripe/route.ts`

### Phase 2: Intégration Chat ✏️

- [ ] Modifier `/api/chat/route.ts` pour vérifier/déduire crédits
- [ ] Modifier les fonctions AI pour retourner les token counts
- [ ] Tester le flow complet (BYOK vs Platform)

### Phase 3: UI Components ✏️

- [ ] Créer `CreditBalance` component
- [ ] Créer `TopUpModal` component
- [ ] Créer `CreditHistory` component
- [ ] Modifier la page `/billing` pour intégrer les crédits
- [ ] Ajouter indicateur de crédits dans le header/sidebar

### Phase 4: Bonus d'inscription ✏️

- [ ] Modifier le webhook Clerk pour donner 10€ à l'inscription
- [ ] Ou créer une route `/api/credits/claim-bonus`

### Phase 5: Tests & Monitoring ✏️

- [ ] Tests unitaires pour le calcul des coûts
- [ ] Tests E2E pour le flow de recharge
- [ ] Ajouter logs/metrics pour le suivi des crédits
- [ ] Dashboard admin (optionnel)

---

## 📝 Notes additionnelles

### Sécurité

1. **Atomic transactions**: Utiliser `prisma.$transaction` pour garantir la cohérence
2. **Race conditions**: Le solde est vérifié ET déduit dans la même transaction
3. **Idempotence**: Le webhook Stripe vérifie `stripeSessionId` pour éviter les doubles crédits

### Performance

1. **Lazy init**: Le CreditBalance est créé à la première requête GET
2. **Indexes**: Les indexes sur `createdAt` permettent des requêtes efficaces
3. **Pagination**: L'historique devrait être paginé pour les gros volumes

### Future improvements

1. **Alertes**: Email quand le solde passe sous 2€
2. **Auto-recharge**: Option pour recharger automatiquement
3. **Quotas**: Limites de dépense journalière/mensuelle
4. **Parrainage**: Crédits bonus pour les referrals
5. **Factures**: Génération de factures PDF via Stripe

---

*Document généré par l'Expert Billing/Stripe*
