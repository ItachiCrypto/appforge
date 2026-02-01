# 🏗️ ARCHITECTURE SYSTÈME DE CRÉDITS - AppForge

**Version:** 1.0  
**Date:** 2025-02-01  
**Auteur:** Agent Coordinateur/Architecte  

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Logique de Facturation](#logique-de-facturation)
3. [Modèle de Pricing](#modèle-de-pricing)
4. [Schéma Base de Données](#schéma-base-de-données)
5. [API Routes](#api-routes)
6. [Composants UI](#composants-ui)
7. [Flux Stripe](#flux-stripe)
8. [Sécurité](#sécurité)
9. [Plan d'Implémentation](#plan-dimplémentation)

---

## 🎯 Vue d'Ensemble

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SYSTÈME DE CRÉDITS APPFORGE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                            COUCHE UI                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │    │
│  │  │  Header      │  │  Settings    │  │  Add Credits │  │  Usage      │  │    │
│  │  │  Balance     │  │  BYOK Toggle │  │  (Stripe)    │  │  History    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                          COUCHE API                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │    │
│  │  │  /api/       │  │  /api/       │  │  /api/       │  │  /api/      │  │    │
│  │  │  credits     │  │  credits/    │  │  billing/    │  │  chat       │  │    │
│  │  │  /balance    │  │  usage       │  │  checkout    │  │  (modifié)  │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      COUCHE SERVICE                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │    │
│  │  │                    CREDIT SERVICE                                │    │    │
│  │  │  • checkCredits(userId)                                          │    │    │
│  │  │  • deductCredits(userId, tokens, model)                         │    │    │
│  │  │  • addCredits(userId, amountEur)                                │    │    │
│  │  │  • getUsageHistory(userId)                                       │    │    │
│  │  └─────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                          │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │    │
│  │  │                    API KEY SERVICE                               │    │    │
│  │  │  • getBestKey(userId) → {key, source, shouldDeduct}             │    │    │
│  │  │  • validateUserKey(key, provider)                                │    │    │
│  │  │  • isBYOKEnabled(userId)                                         │    │    │
│  │  └─────────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      COUCHE DONNÉES                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │    │
│  │  │    User      │  │   Credit     │  │   Credit     │  │  Credit     │  │    │
│  │  │  (balance)   │  │   Usage      │  │   Purchase   │  │  Settings   │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│                              ┌──────────────┐                                    │
│                              │   STRIPE     │                                    │
│                              │   Webhooks   │                                    │
│                              └──────────────┘                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Logique de Facturation

### Arbre de Décision

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ARBRE DE DÉCISION API CALL                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                        ┌───────────────────────┐
                        │  User fait une        │
                        │  requête chat/IA      │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │  BYOK activé ?        │
                        │  (byokEnabled = true) │
                        └───────────┬───────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                  │
                   ▼ OUI                              ▼ NON
        ┌─────────────────────┐            ┌─────────────────────┐
        │ Clé user valide     │            │  Balance crédits    │
        │ avec crédits API ?  │            │  > coût estimé ?    │
        └─────────┬───────────┘            └─────────┬───────────┘
                  │                                   │
          ┌───────┴───────┐                   ┌───────┴───────┐
          │               │                   │               │
          ▼ OUI           ▼ NON               ▼ OUI           ▼ NON
  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────────┐
  │ ✅ Utilise    │ │ Fallback vers  │ │ ✅ Utilise    │ │ ❌ ERREUR      │
  │ clé user      │ │ crédits ?      │ │ clé platform  │ │ "Ajoutez des   │
  │ (0 crédit     │ │                │ │ Déduit crédits│ │  crédits ou    │
  │  déduit)      │ │                │ │ après appel   │ │  activez BYOK" │
  └───────────────┘ └───────┬────────┘ └───────────────┘ └────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
            ┌───────────────┐ ┌────────────────┐
            │ Balance > 0?  │ │ ❌ ERREUR      │
            │ → Utilise     │ │ "Ajoutez des   │
            │ platform +    │ │  crédits ou    │
            │ déduit crédits│ │  ajoutez clé"  │
            └───────────────┘ └────────────────┘
```

### Code de Décision (Pseudo-code)

```typescript
async function resolveAPIKeyAndBilling(userId: string): Promise<APIKeyResolution> {
  const user = await getUser(userId)
  
  // Cas 1: BYOK activé
  if (user.byokEnabled) {
    const userKey = await validateUserKey(user)
    if (userKey.valid && userKey.hasCredits) {
      return {
        key: userKey.key,
        provider: userKey.provider,
        source: 'USER_BYOK',
        shouldDeductCredits: false
      }
    }
    // Clé user invalide ou sans crédits → fallback
  }
  
  // Cas 2: Utilisation des crédits platform
  if (user.creditBalance > 0) {
    return {
      key: getPlatformKey(),
      provider: 'anthropic',
      source: 'PLATFORM',
      shouldDeductCredits: true
    }
  }
  
  // Cas 3: Aucune option disponible
  throw new InsufficientCreditsError(
    user.byokEnabled 
      ? "Votre clé API n'a plus de crédits. Rechargez-la ou ajoutez des crédits AppForge."
      : "Crédit insuffisant. Ajoutez des crédits ou activez BYOK avec votre propre clé API."
  )
}
```

---

## 💰 Modèle de Pricing

### Coûts de Base (Anthropic Claude Sonnet 3.5)

| Type | Coût Anthropic | Prix User (+ 5%) |
|------|----------------|------------------|
| Input tokens | $3.00 / 1M | $3.15 / 1M |
| Output tokens | $15.00 / 1M | $15.75 / 1M |

### Conversion en Crédits

**1 crédit = 0.01€ = 1 centime**

| Type | Tokens | Coût en crédits |
|------|--------|-----------------|
| Input | 1,000 tokens | 0.315 crédits (≈ 0.32) |
| Output | 1,000 tokens | 1.575 crédits (≈ 1.58) |

### Calcul Simplifié

```typescript
const PRICING = {
  'claude-sonnet-3.5': {
    inputPer1M: 3.00,   // $ par million tokens
    outputPer1M: 15.00,
    margin: 1.05,       // +5%
  },
  'claude-opus': {
    inputPer1M: 15.00,
    outputPer1M: 75.00,
    margin: 1.05,
  },
  'gpt-4o': {
    inputPer1M: 5.00,
    outputPer1M: 15.00,
    margin: 1.05,
  }
}

function calculateCreditCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = PRICING[model]
  const usdToEur = 0.92  // Taux approximatif, à mettre à jour
  
  const inputCostUsd = (inputTokens / 1_000_000) * pricing.inputPer1M * pricing.margin
  const outputCostUsd = (outputTokens / 1_000_000) * pricing.outputPer1M * pricing.margin
  const totalCostEur = (inputCostUsd + outputCostUsd) * usdToEur
  
  // Convertir en crédits (1 crédit = 0.01€)
  return Math.ceil(totalCostEur * 100)  // Arrondi supérieur
}
```

### Packages de Crédits Stripe

| Package | Prix | Crédits | Équivalent |
|---------|------|---------|------------|
| Starter | 5€ | 500 | ~30 requêtes moyennes |
| Basic | 10€ | 1,000 | ~60 requêtes moyennes |
| Pro | 25€ | 2,500 | ~150 requêtes moyennes |
| Power | 50€ | 5,000 | ~300 requêtes moyennes |
| Enterprise | 100€ | 10,500 | +5% bonus |

### Freemium

- **Inscription:** 1,000 crédits gratuits (= 10€)
- **Équivalent:** ~60 requêtes de génération
- **Rechargement:** Via Stripe Checkout

---

## 🗄️ Schéma Base de Données

### Modifications Prisma

```prisma
// ============ AJOUTS AU SCHEMA ============

// Modifications sur User existant
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
  
  // === NOUVEAUX CHAMPS CRÉDITS ===
  creditBalance   Int       @default(1000)  // 1000 crédits = 10€ freemium
  byokEnabled     Boolean   @default(false) // Toggle BYOK
  
  // BYOK - Encrypted
  openaiKey     String?
  anthropicKey  String?
  
  // Relations existantes
  apps          App[]
  conversations Conversation[]
  
  // === NOUVELLES RELATIONS ===
  creditUsages    CreditUsage[]
  creditPurchases CreditPurchase[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// === NOUVELLE TABLE: Historique d'utilisation ===
model CreditUsage {
  id            String   @id @default(cuid())
  
  // Coût
  creditsUsed   Int      // Crédits déduits
  
  // Détails de l'appel
  model         String   // claude-sonnet-3.5, gpt-4o, etc.
  inputTokens   Int
  outputTokens  Int
  
  // Source de la clé utilisée
  keySource     KeySource // PLATFORM, USER_BYOK
  
  // Contexte
  appId         String?
  app           App?     @relation(fields: [appId], references: [id], onDelete: SetNull)
  conversationId String?
  
  // User
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([userId, createdAt])
  @@index([appId])
}

enum KeySource {
  PLATFORM      // Clé AppForge, crédits déduits
  USER_BYOK     // Clé user, pas de déduction
}

// === NOUVELLE TABLE: Achats de crédits ===
model CreditPurchase {
  id            String   @id @default(cuid())
  
  // Montant
  amount        Int      // Crédits achetés
  priceEur      Int      // Prix en centimes (500 = 5€)
  
  // Stripe
  stripeSessionId     String  @unique
  stripePaymentIntent String?
  status              PurchaseStatus @default(PENDING)
  
  // User
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  
  @@index([userId])
  @@index([stripeSessionId])
}

enum PurchaseStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

// === MODIFICATION: Ajouter relation sur App ===
model App {
  // ... champs existants ...
  
  // Nouvelle relation
  creditUsages  CreditUsage[]
}
```

### Migration SQL (pour référence)

```sql
-- Ajout colonnes sur User
ALTER TABLE "User" ADD COLUMN "creditBalance" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "User" ADD COLUMN "byokEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Table CreditUsage
CREATE TABLE "CreditUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "creditsUsed" INTEGER NOT NULL,
  "model" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL,
  "outputTokens" INTEGER NOT NULL,
  "keySource" TEXT NOT NULL,
  "appId" TEXT,
  "conversationId" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE SET NULL
);

CREATE INDEX "CreditUsage_userId_idx" ON "CreditUsage"("userId");
CREATE INDEX "CreditUsage_userId_createdAt_idx" ON "CreditUsage"("userId", "createdAt");
CREATE INDEX "CreditUsage_appId_idx" ON "CreditUsage"("appId");

-- Table CreditPurchase
CREATE TABLE "CreditPurchase" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "amount" INTEGER NOT NULL,
  "priceEur" INTEGER NOT NULL,
  "stripeSessionId" TEXT NOT NULL UNIQUE,
  "stripePaymentIntent" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "CreditPurchase_userId_idx" ON "CreditPurchase"("userId");
CREATE INDEX "CreditPurchase_stripeSessionId_idx" ON "CreditPurchase"("stripeSessionId");
```

---

## 🔌 API Routes

### Structure des Routes

```
/api/
├── credits/
│   ├── balance/
│   │   └── route.ts          # GET: Récupérer le solde
│   ├── usage/
│   │   └── route.ts          # GET: Historique d'utilisation
│   └── settings/
│       └── route.ts          # GET/PUT: Paramètres BYOK
├── billing/
│   ├── checkout/
│   │   └── route.ts          # POST: Créer session Stripe
│   ├── success/
│   │   └── route.ts          # GET: Page succès (redirect)
│   └── packages/
│       └── route.ts          # GET: Liste des packages
├── webhooks/
│   └── stripe/
│       └── route.ts          # POST: Webhook Stripe (modifier existant)
└── chat/
    └── route.ts              # POST: Modifier pour intégrer crédits
```

### Détail des Routes

#### 1. GET /api/credits/balance

```typescript
// src/app/api/credits/balance/route.ts

import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      creditBalance: true,
      byokEnabled: true,
      plan: true,
    }
  })
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  return NextResponse.json({
    balance: user.creditBalance,
    balanceEur: (user.creditBalance / 100).toFixed(2),
    byokEnabled: user.byokEnabled,
    plan: user.plan,
  })
}
```

#### 2. GET /api/credits/usage

```typescript
// src/app/api/credits/usage/route.ts

import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const appId = searchParams.get('appId')
  
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true }
  })
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  const where = {
    userId: user.id,
    ...(appId && { appId }),
  }
  
  const [usages, total] = await Promise.all([
    prisma.creditUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        app: { select: { name: true } }
      }
    }),
    prisma.creditUsage.count({ where })
  ])
  
  // Agrégations
  const stats = await prisma.creditUsage.aggregate({
    where: { userId: user.id },
    _sum: { creditsUsed: true, inputTokens: true, outputTokens: true },
    _count: true,
  })
  
  return NextResponse.json({
    usages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    stats: {
      totalCreditsUsed: stats._sum.creditsUsed || 0,
      totalInputTokens: stats._sum.inputTokens || 0,
      totalOutputTokens: stats._sum.outputTokens || 0,
      totalRequests: stats._count || 0,
    }
  })
}
```

#### 3. GET/PUT /api/credits/settings

```typescript
// src/app/api/credits/settings/route.ts

import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      byokEnabled: true,
      anthropicKey: true,
      openaiKey: true,
    }
  })
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  return NextResponse.json({
    byokEnabled: user.byokEnabled,
    hasAnthropicKey: !!user.anthropicKey,
    hasOpenaiKey: !!user.openaiKey,
  })
}

const updateSchema = z.object({
  byokEnabled: z.boolean().optional(),
  anthropicKey: z.string().optional().nullable(),
  openaiKey: z.string().optional().nullable(),
})

export async function PUT(req: NextRequest) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await req.json()
  const data = updateSchema.parse(body)
  
  // Validation: si on active BYOK, il faut au moins une clé
  if (data.byokEnabled) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { anthropicKey: true, openaiKey: true }
    })
    
    const hasAnthropicKey = data.anthropicKey !== null ? !!data.anthropicKey : !!user?.anthropicKey
    const hasOpenaiKey = data.openaiKey !== null ? !!data.openaiKey : !!user?.openaiKey
    
    if (!hasAnthropicKey && !hasOpenaiKey) {
      return NextResponse.json({
        error: 'Vous devez ajouter une clé API pour activer BYOK'
      }, { status: 400 })
    }
  }
  
  const updated = await prisma.user.update({
    where: { clerkId: userId },
    data,
    select: {
      byokEnabled: true,
      hasAnthropicKey: !!data.anthropicKey,
      hasOpenaiKey: !!data.openaiKey,
    }
  })
  
  return NextResponse.json(updated)
}
```

#### 4. POST /api/billing/checkout

```typescript
// src/app/api/billing/checkout/route.ts

import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CREDIT_PACKAGES = {
  starter: { credits: 500, priceEur: 500 },      // 5€
  basic: { credits: 1000, priceEur: 1000 },      // 10€
  pro: { credits: 2500, priceEur: 2500 },        // 25€
  power: { credits: 5000, priceEur: 5000 },      // 50€
  enterprise: { credits: 10500, priceEur: 10000 }, // 100€ + 5% bonus
}

const checkoutSchema = z.object({
  package: z.enum(['starter', 'basic', 'pro', 'power', 'enterprise']),
})

export async function POST(req: NextRequest) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await req.json()
  const { package: packageId } = checkoutSchema.parse(body)
  const pkg = CREDIT_PACKAGES[packageId]
  
  // Get or create Stripe customer
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  let stripeCustomerId = user.stripeCustomerId
  
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id, clerkId: userId }
    })
    stripeCustomerId = customer.id
    
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId }
    })
  }
  
  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: pkg.priceEur,
        product_data: {
          name: `AppForge Credits - ${packageId.charAt(0).toUpperCase() + packageId.slice(1)}`,
          description: `${pkg.credits} crédits AppForge`,
        }
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?credits=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?credits=cancelled`,
    metadata: {
      userId: user.id,
      credits: pkg.credits.toString(),
      package: packageId,
    }
  })
  
  // Create pending purchase record
  await prisma.creditPurchase.create({
    data: {
      amount: pkg.credits,
      priceEur: pkg.priceEur,
      stripeSessionId: session.id,
      userId: user.id,
    }
  })
  
  return NextResponse.json({ url: session.url })
}
```

#### 5. GET /api/billing/packages

```typescript
// src/app/api/billing/packages/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
  const packages = [
    { 
      id: 'starter', 
      name: 'Starter', 
      credits: 500, 
      price: 5,
      description: '~30 requêtes de génération'
    },
    { 
      id: 'basic', 
      name: 'Basic', 
      credits: 1000, 
      price: 10,
      description: '~60 requêtes de génération',
      popular: true
    },
    { 
      id: 'pro', 
      name: 'Pro', 
      credits: 2500, 
      price: 25,
      description: '~150 requêtes de génération'
    },
    { 
      id: 'power', 
      name: 'Power', 
      credits: 5000, 
      price: 50,
      description: '~300 requêtes de génération'
    },
    { 
      id: 'enterprise', 
      name: 'Enterprise', 
      credits: 10500, 
      price: 100,
      description: '~630 requêtes + 5% bonus',
      bonus: true
    },
  ]
  
  return NextResponse.json({ packages })
}
```

#### 6. POST /api/webhooks/stripe (Modifications)

```typescript
// src/app/api/webhooks/stripe/route.ts (ajouts)

// Ajouter dans le handler existant:

case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session
  
  // Vérifier si c'est un achat de crédits
  if (session.metadata?.credits) {
    const credits = parseInt(session.metadata.credits)
    const userId = session.metadata.userId
    
    // Mettre à jour le solde user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: { increment: credits }
        }
      }),
      prisma.creditPurchase.update({
        where: { stripeSessionId: session.id },
        data: {
          status: 'COMPLETED',
          stripePaymentIntent: session.payment_intent as string,
          completedAt: new Date(),
        }
      })
    ])
  }
  break
}
```

#### 7. Modification de /api/chat/route.ts

```typescript
// Points clés à modifier dans src/app/api/chat/route.ts

import { resolveAPIKeyAndBilling, deductCredits } from '@/lib/services/credits'

// Dans la fonction POST, après récupération du user:

// 1. Résoudre la clé et le billing
const resolution = await resolveAPIKeyAndBilling(user)

// 2. Faire l'appel API avec la clé résolue
const apiKey = resolution.key
const provider = resolution.provider

// 3. Après l'appel réussi, déduire les crédits si nécessaire
if (resolution.shouldDeductCredits) {
  await deductCredits(user.id, {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    model: modelUsed,
    appId: appId || undefined,
    conversationId: app?.conversationId || undefined,
  })
}
```

---

## 🎨 Composants UI

### Structure des Composants

```
src/components/
├── credits/
│   ├── credit-balance.tsx        # Badge de solde (Header)
│   ├── credit-balance-card.tsx   # Carte de solde (Settings)
│   ├── credit-packages.tsx       # Grille de packages
│   ├── credit-usage-table.tsx    # Tableau historique
│   ├── credit-usage-chart.tsx    # Graphique d'utilisation
│   └── byok-toggle.tsx           # Toggle BYOK + input clés
├── settings/
│   └── billing-section.tsx       # Section billing dans Settings
└── shared/
    └── credit-icon.tsx           # Icône crédit stylisée
```

### 1. CreditBalance (Header)

```tsx
// src/components/credits/credit-balance.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { Coins, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Link from 'next/link'

export function CreditBalance() {
  const { data, isLoading } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const res = await fetch('/api/credits/balance')
      return res.json()
    },
    refetchInterval: 60000, // Refresh toutes les minutes
  })
  
  if (isLoading) {
    return <div className="h-8 w-20 animate-pulse bg-muted rounded" />
  }
  
  const balance = data?.balance || 0
  const isLow = balance < 100 // Moins de 1€
  const isByok = data?.byokEnabled
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/settings#billing">
          <Button 
            variant="ghost" 
            size="sm"
            className={isLow && !isByok ? 'text-orange-500' : ''}
          >
            {isByok ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded">
                  BYOK
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Coins className="h-4 w-4" />
                <span>{balance}</span>
                {isLow && <AlertTriangle className="h-3 w-3" />}
              </span>
            )}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        {isByok 
          ? "Vous utilisez votre propre clé API"
          : `${(balance / 100).toFixed(2)}€ de crédits restants`
        }
      </TooltipContent>
    </Tooltip>
  )
}
```

### 2. CreditBalanceCard (Settings)

```tsx
// src/components/credits/credit-balance-card.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { Coins, TrendingUp, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface CreditBalanceCardProps {
  onAddCredits: () => void
}

export function CreditBalanceCard({ onAddCredits }: CreditBalanceCardProps) {
  const { data } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const res = await fetch('/api/credits/balance')
      return res.json()
    },
  })
  
  const balance = data?.balance || 0
  const balanceEur = (balance / 100).toFixed(2)
  
  // Estimation des requêtes restantes (moyenne ~16 crédits/requête)
  const estimatedRequests = Math.floor(balance / 16)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          Solde de Crédits
        </CardTitle>
        <CardDescription>
          Vos crédits pour utiliser l'IA AppForge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance principale */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{balance}</span>
          <span className="text-muted-foreground">crédits</span>
          <span className="text-sm text-muted-foreground ml-2">
            ({balanceEur}€)
          </span>
        </div>
        
        {/* Estimation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" />
          <span>≈ {estimatedRequests} requêtes de génération</span>
        </div>
        
        {/* Barre de niveau */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Niveau</span>
            <span>{balance < 100 ? 'Faible' : balance < 500 ? 'Moyen' : 'OK'}</span>
          </div>
          <Progress 
            value={Math.min((balance / 1000) * 100, 100)} 
            className={balance < 100 ? 'bg-orange-100' : ''}
          />
        </div>
        
        {/* CTA */}
        <Button onClick={onAddCredits} className="w-full">
          <TrendingUp className="h-4 w-4 mr-2" />
          Ajouter des crédits
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 3. CreditPackages (Modal/Page)

```tsx
// src/components/credits/credit-packages.tsx

'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { Check, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Package {
  id: string
  name: string
  credits: number
  price: number
  description: string
  popular?: boolean
  bonus?: boolean
}

export function CreditPackages() {
  const { data } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const res = await fetch('/api/billing/packages')
      return res.json()
    },
  })
  
  const checkout = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: packageId }),
      })
      return res.json()
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: () => {
      toast.error('Erreur lors de la création du paiement')
    },
  })
  
  const packages: Package[] = data?.packages || []
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {packages.map((pkg) => (
        <Card 
          key={pkg.id}
          className={pkg.popular ? 'border-primary shadow-lg' : ''}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center gap-2">
                {pkg.name}
                {pkg.popular && (
                  <Badge variant="default">Populaire</Badge>
                )}
                {pkg.bonus && (
                  <Badge variant="secondary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    +5%
                  </Badge>
                )}
              </CardTitle>
            </div>
            <CardDescription>{pkg.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{pkg.price}€</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <Check className="h-4 w-4 inline mr-1 text-green-500" />
              {pkg.credits.toLocaleString()} crédits
            </div>
            
            <Button 
              className="w-full"
              onClick={() => checkout.mutate(pkg.id)}
              disabled={checkout.isPending}
            >
              {checkout.isPending ? 'Chargement...' : 'Acheter'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### 4. BYOKToggle

```tsx
// src/components/credits/byok-toggle.tsx

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Key, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export function BYOKToggle() {
  const queryClient = useQueryClient()
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [anthropicKey, setAnthropicKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['credit-settings'],
    queryFn: async () => {
      const res = await fetch('/api/credits/settings')
      return res.json()
    },
  })
  
  const update = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await fetch('/api/credits/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-settings'] })
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] })
      toast.success('Paramètres mis à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
  
  const handleToggleBYOK = (enabled: boolean) => {
    update.mutate({ byokEnabled: enabled })
  }
  
  const handleSaveKey = (provider: 'anthropic' | 'openai') => {
    const key = provider === 'anthropic' ? anthropicKey : openaiKey
    update.mutate({ [`${provider}Key`]: key || null })
    if (provider === 'anthropic') setAnthropicKey('')
    else setOpenaiKey('')
  }
  
  if (isLoading) {
    return <div className="h-32 animate-pulse bg-muted rounded-lg" />
  }
  
  const byokEnabled = data?.byokEnabled || false
  const hasAnthropicKey = data?.hasAnthropicKey || false
  const hasOpenaiKey = data?.hasOpenaiKey || false
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          BYOK - Apportez votre clé
        </CardTitle>
        <CardDescription>
          Utilisez vos propres clés API pour éviter d'utiliser vos crédits AppForge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="byok-toggle">Activer BYOK</Label>
            <p className="text-sm text-muted-foreground">
              Utiliser ma propre clé API au lieu des crédits
            </p>
          </div>
          <Switch
            id="byok-toggle"
            checked={byokEnabled}
            onCheckedChange={handleToggleBYOK}
            disabled={!hasAnthropicKey && !hasOpenaiKey}
          />
        </div>
        
        {byokEnabled && (
          <Alert>
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription>
              BYOK activé. Vos requêtes utilisent votre clé API et ne déduisent pas de crédits.
            </AlertDescription>
          </Alert>
        )}
        
        {!hasAnthropicKey && !hasOpenaiKey && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ajoutez au moins une clé API pour activer BYOK
            </AlertDescription>
          </Alert>
        )}
        
        {/* Clé Anthropic */}
        <div className="space-y-2">
          <Label>Clé API Anthropic</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showAnthropicKey ? 'text' : 'password'}
                placeholder={hasAnthropicKey ? '••••••••••••••••' : 'sk-ant-...'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
              >
                {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              variant="outline"
              onClick={() => handleSaveKey('anthropic')}
              disabled={!anthropicKey}
            >
              Sauvegarder
            </Button>
          </div>
          {hasAnthropicKey && (
            <p className="text-xs text-green-600">✓ Clé configurée</p>
          )}
        </div>
        
        {/* Clé OpenAI */}
        <div className="space-y-2">
          <Label>Clé API OpenAI</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showOpenaiKey ? 'text' : 'password'}
                placeholder={hasOpenaiKey ? '••••••••••••••••' : 'sk-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
              >
                {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              variant="outline"
              onClick={() => handleSaveKey('openai')}
              disabled={!openaiKey}
            >
              Sauvegarder
            </Button>
          </div>
          {hasOpenaiKey && (
            <p className="text-xs text-green-600">✓ Clé configurée</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5. CreditUsageTable

```tsx
// src/components/credits/credit-usage-table.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CreditUsageTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['credit-usage'],
    queryFn: async () => {
      const res = await fetch('/api/credits/usage?limit=10')
      return res.json()
    },
  })
  
  if (isLoading) {
    return <div className="h-48 animate-pulse bg-muted rounded-lg" />
  }
  
  const usages = data?.usages || []
  const stats = data?.stats
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique d'utilisation</CardTitle>
        {stats && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {stats.totalCreditsUsed} crédits</span>
            <span>{stats.totalRequests} requêtes</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>App</TableHead>
              <TableHead>Modèle</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Crédits</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucune utilisation pour le moment
                </TableCell>
              </TableRow>
            ) : (
              usages.map((usage: any) => (
                <TableRow key={usage.id}>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(usage.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell>{usage.app?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{usage.model}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {usage.inputTokens + usage.outputTokens}
                  </TableCell>
                  <TableCell className="font-medium">
                    {usage.creditsUsed > 0 ? `-${usage.creditsUsed}` : '0'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={usage.keySource === 'USER_BYOK' ? 'success' : 'secondary'}>
                      {usage.keySource === 'USER_BYOK' ? 'BYOK' : 'Platform'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

---

## 💳 Flux Stripe

### Diagramme de Séquence

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│  User   │     │ Frontend │     │ Backend │     │  Stripe  │
└────┬────┘     └────┬─────┘     └────┬────┘     └────┬─────┘
     │               │                │               │
     │  Click "Add   │                │               │
     │  Credits"     │                │               │
     │──────────────▶│                │               │
     │               │                │               │
     │               │ POST /api/     │               │
     │               │ billing/       │               │
     │               │ checkout       │               │
     │               │───────────────▶│               │
     │               │                │               │
     │               │                │ Create        │
     │               │                │ Checkout      │
     │               │                │ Session       │
     │               │                │──────────────▶│
     │               │                │               │
     │               │                │◀──────────────│
     │               │                │ Session URL   │
     │               │◀───────────────│               │
     │               │  { url }       │               │
     │               │                │               │
     │◀──────────────│                │               │
     │  Redirect to  │                │               │
     │  Stripe       │                │               │
     │               │                │               │
     │═══════════════════════════════════════════════▶│
     │               │                │               │
     │  Payment in   │                │               │
     │  Stripe UI    │                │               │
     │               │                │               │
     │◀═══════════════════════════════════════════════│
     │  Redirect     │                │               │
     │  /settings    │                │               │
     │  ?credits=    │                │               │
     │  success      │                │               │
     │               │                │               │
     │               │                │◀──────────────│
     │               │                │ Webhook:      │
     │               │                │ checkout.     │
     │               │                │ session.      │
     │               │                │ completed     │
     │               │                │               │
     │               │                │ Update        │
     │               │                │ creditBalance │
     │               │                │ + CreditPurch │
     │               │                │               │
     │               │                │──────────────▶│
     │               │                │ 200 OK        │
     │               │                │               │
     │               │ Refetch        │               │
     │               │ balance        │               │
     │               │───────────────▶│               │
     │               │                │               │
     │               │◀───────────────│               │
     │◀──────────────│                │               │
     │  New balance  │                │               │
     │  displayed    │                │               │
     │               │                │               │
```

---

## 🔐 Sécurité

### 1. Encryption des Clés API

```typescript
// src/lib/crypto.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### 2. Validation Webhook Stripe

```typescript
// Dans /api/webhooks/stripe/route.ts

import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed')
    return new Response('Webhook Error', { status: 400 })
  }
  
  // Process event...
}
```

### 3. Rate Limiting

```typescript
// src/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min
  analytics: true,
})

// Usage dans les routes API
const { success, remaining } = await rateLimiter.limit(userId)
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

---

## 📅 Plan d'Implémentation

### Phase 1: Foundation (Jour 1-2)

#### 1.1 Database Schema
- [ ] Modifier `schema.prisma` avec les nouveaux modèles
- [ ] Créer la migration Prisma
- [ ] Tester la migration en local
- [ ] Appliquer en production

#### 1.2 Services Core
- [ ] Créer `src/lib/services/credits.ts`
  - `resolveAPIKeyAndBilling()`
  - `deductCredits()`
  - `addCredits()`
  - `getBalance()`
- [ ] Créer `src/lib/services/pricing.ts`
  - Constantes de pricing
  - `calculateCreditCost()`

### Phase 2: API Routes (Jour 2-3)

#### 2.1 Routes Credits
- [ ] `GET /api/credits/balance`
- [ ] `GET /api/credits/usage`
- [ ] `GET/PUT /api/credits/settings`

#### 2.2 Routes Billing
- [ ] `GET /api/billing/packages`
- [ ] `POST /api/billing/checkout`
- [ ] Modifier `/api/webhooks/stripe`

#### 2.3 Modification Chat
- [ ] Intégrer le service de crédits dans `/api/chat`
- [ ] Ajouter le tracking d'usage
- [ ] Gérer le fallback BYOK → Platform

### Phase 3: UI Components (Jour 3-4)

#### 3.1 Composants Credits
- [ ] `CreditBalance` (Header)
- [ ] `CreditBalanceCard`
- [ ] `CreditPackages`
- [ ] `BYOKToggle`
- [ ] `CreditUsageTable`

#### 3.2 Intégration
- [ ] Ajouter `CreditBalance` dans le Header
- [ ] Créer section Billing dans Settings
- [ ] Modal "Add Credits"

### Phase 4: Testing & Polish (Jour 4-5)

#### 4.1 Tests
- [ ] Tests unitaires services
- [ ] Tests API routes
- [ ] Test E2E flow achat crédits
- [ ] Test E2E flow BYOK

#### 4.2 Edge Cases
- [ ] Gestion erreur Stripe
- [ ] Gestion clé API invalide
- [ ] Gestion crédits insuffisants
- [ ] Affichage messages d'erreur

### Phase 5: Déploiement (Jour 5)

- [ ] Configurer variables Stripe production
- [ ] Générer `ENCRYPTION_KEY`
- [ ] Configurer webhook Stripe
- [ ] Déployer sur Vercel
- [ ] Tester en production

---

## 📁 Fichiers à Créer/Modifier

### Nouveaux Fichiers

```
src/
├── lib/
│   └── services/
│       ├── credits.ts        # Service de gestion des crédits
│       └── pricing.ts        # Constantes et calculs de prix
├── app/
│   └── api/
│       ├── credits/
│       │   ├── balance/
│       │   │   └── route.ts
│       │   ├── usage/
│       │   │   └── route.ts
│       │   └── settings/
│       │       └── route.ts
│       └── billing/
│           ├── checkout/
│           │   └── route.ts
│           └── packages/
│               └── route.ts
└── components/
    └── credits/
        ├── credit-balance.tsx
        ├── credit-balance-card.tsx
        ├── credit-packages.tsx
        ├── credit-usage-table.tsx
        └── byok-toggle.tsx
```

### Fichiers à Modifier

```
prisma/schema.prisma           # Ajouter modèles CreditUsage, CreditPurchase
src/app/api/chat/route.ts      # Intégrer service crédits
src/app/api/webhooks/stripe/route.ts  # Gérer checkout.session.completed
src/components/layout/header.tsx       # Ajouter CreditBalance
src/app/(dashboard)/settings/page.tsx  # Ajouter section Billing
```

---

## ✅ Checklist Finale

- [ ] Schema DB validé et migré
- [ ] Services credits/pricing fonctionnels
- [ ] Toutes les API routes créées
- [ ] Tous les composants UI créés
- [ ] Intégration Stripe complète
- [ ] Webhook Stripe fonctionnel
- [ ] Tests passants
- [ ] Documentation à jour
- [ ] Variables env configurées
- [ ] Déployé en production

---

**Architecture validée.** Prêt pour l'implémentation! 🚀
