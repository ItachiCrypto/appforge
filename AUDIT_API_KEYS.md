# 🔐 AUDIT SYSTÈME API KEYS & SÉCURITÉ

**Date:** 2025-02-01  
**Auditeur:** Expert Systèmes API Keys & Sécurité  
**Scope:** Système BYOK (Bring Your Own Key) d'AppForge

---

## 📋 RÉSUMÉ EXÉCUTIF

| Aspect | Status | Risque |
|--------|--------|--------|
| Chiffrement des clés | ⚠️ **NON IMPLÉMENTÉ** | 🔴 CRITIQUE |
| Logique de fallback | ✅ Fonctionnelle | 🟢 Faible |
| Gestion erreurs billing | ✅ Correcte | 🟢 Faible |
| Tracking BYOK vs Platform | ❌ Absent | 🟡 Moyen |
| Toggle BYOK | ❌ Absent | 🟡 Moyen |

---

## 1️⃣ STOCKAGE DES CLÉS

### 1.1 Emplacement dans la DB

**Fichier:** `prisma/schema.prisma`

```prisma
model User {
  // ...
  openaiKey     String?
  anthropicKey  String?
  // ...
}
```

Les clés sont stockées directement dans la table `User` comme des `String` nullable.

### 1.2 Chiffrement: ⚠️ **MENSONGE DANS L'UI**

**Problème CRITIQUE découvert:**

L'interface utilisateur (`src/app/(dashboard)/settings/page.tsx` ligne 175) affiche:

```tsx
<p className="text-sm text-muted-foreground">
  Keys are encrypted with AES-256
</p>
```

**MAIS** dans le code API (`src/app/api/user/route.ts` ligne 82-83):

```typescript
// In production, encrypt these keys before storing
// For MVP, we'll store them as-is (not recommended for production!)
const updatedUser = await prisma.user.update({
  where: { id: user.id },
  data: {
    ...(openaiKey !== undefined && { openaiKey }),
    ...(anthropicKey !== undefined && { anthropicKey }),
  },
})
```

**Les clés sont stockées EN CLAIR** dans la base de données PostgreSQL!

### 1.3 Risques de Sécurité

| Risque | Gravité | Description |
|--------|---------|-------------|
| Fuite DB | 🔴 CRITIQUE | Si la DB est compromise, toutes les clés API sont exposées en clair |
| Backup non chiffré | 🔴 CRITIQUE | Les backups de DB contiennent les clés en clair |
| Logs Prisma | 🟡 MOYEN | En mode debug, Prisma pourrait logger les clés |
| Accès admin | 🟡 MOYEN | Tout admin DB peut voir les clés |
| Mensonge UX | 🟡 MOYEN | L'UI prétend un chiffrement inexistant (confiance utilisateur) |

---

## 2️⃣ UTILISATION DES CLÉS

### 2.1 Récupération des clés

**Fichier:** `src/app/api/chat/route.ts` (lignes 94-101)

```typescript
// API Key hierarchy:
// 1. User's Anthropic key (BYOK)
// 2. User's OpenAI key (BYOK)
// 3. Platform's Anthropic key (fallback)
// 4. Platform's OpenAI key (fallback)
const userAnthropicKey = user.anthropicKey
const userOpenaiKey = user.openaiKey
const platformAnthropicKey = process.env.ANTHROPIC_API_KEY
const platformOpenaiKey = process.env.OPENAI_API_KEY
```

La hiérarchie est claire et bien documentée.

### 2.2 Logique de Fallback ✅

**Fonctionne correctement:**

```typescript
try {
  // First try: User's keys
  if (userAnthropicKey || userOpenaiKey) {
    fullContent = await tryGenerate(userAnthropicKey, userOpenaiKey)
  } else {
    throw new Error('No user key, try platform fallback')
  }
} catch (userKeyError: unknown) {
  // Fallback to platform keys
  if (platformAnthropicKey || platformOpenaiKey) {
    fullContent = await tryGenerate(platformAnthropicKey, platformOpenaiKey)
    usedFallback = true
  } else {
    throw userKeyError
  }
}
```

**Points positifs:**
- Fallback automatique si la clé user échoue
- Variable `usedFallback` trackée (mais jamais utilisée!)

### 2.3 Gestion Erreurs de Billing ✅

```typescript
const isBillingError = errorMsg.toLowerCase().includes('credit') || 
                      errorMsg.toLowerCase().includes('billing') ||
                      errorMsg.toLowerCase().includes('quota') ||
                      errorMsg.toLowerCase().includes('insufficient')
```

La détection des erreurs de billing est correcte pour les messages classiques d'Anthropic/OpenAI.

### 2.4 Problème: `usedFallback` non exploité

La variable `usedFallback = true` est définie mais **jamais retournée dans la réponse API**!

```typescript
return NextResponse.json({
  content: cleanContent || 'Code generated successfully.',
  codeOutput,
  success: true,
  // ❌ usedFallback n'est PAS retourné!
})
```

---

## 3️⃣ RECOMMANDATIONS

### 3.1 Sécurité - URGENT 🔴

#### A) Implémenter le chiffrement AES-256

Créer `src/lib/crypto.ts`:

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY! // 32 bytes hex

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
}

const KEY = Buffer.from(ENCRYPTION_KEY, 'hex')

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decryptApiKey(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

#### B) Modifier l'API user pour chiffrer

```typescript
import { encryptApiKey, decryptApiKey } from '@/lib/crypto'

// Lors du PATCH:
const encryptedOpenai = openaiKey ? encryptApiKey(openaiKey) : null
const encryptedAnthropic = anthropicKey ? encryptApiKey(anthropicKey) : null

// Lors du GET/usage:
const decryptedKey = user.openaiKey ? decryptApiKey(user.openaiKey) : null
```

### 3.2 Toggle BYOK on/off

#### Modification Prisma:

```prisma
model User {
  // ... existing fields
  
  // BYOK Toggle
  byokEnabled   Boolean @default(true)  // Allow user to disable BYOK temporarily
}
```

#### Modification API chat:

```typescript
// Dans chat/route.ts:
const shouldUseBYOK = user.byokEnabled && (userAnthropicKey || userOpenaiKey)

if (shouldUseBYOK) {
  // Use user keys
} else {
  // Use platform keys, track credits
}
```

### 3.3 Tracking BYOK vs Platform

#### Modification Prisma - Nouveau modèle:

```prisma
model UsageLog {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // What was used
  provider      Provider // ANTHROPIC or OPENAI
  model         String   // claude-sonnet-4-20250514, gpt-4o, etc.
  mode          UsageMode // BYOK or PLATFORM
  
  // Token tracking
  inputTokens   Int
  outputTokens  Int
  totalTokens   Int
  
  // Cost estimation (en millièmes de centimes pour précision)
  estimatedCostMicros Int @default(0)
  
  // Context
  conversationId String?
  appId          String?
  
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
  @@index([mode])
}

enum Provider {
  ANTHROPIC
  OPENAI
}

enum UsageMode {
  BYOK
  PLATFORM
}
```

---

## 4️⃣ MODIFICATIONS POUR SYSTÈME DE CRÉDITS

### 4.1 Schéma Prisma Complet

Ajouter dans `schema.prisma`:

```prisma
// ============ USERS - MODIFICATIONS ============

model User {
  // ... existing fields
  
  // BYOK Control
  byokEnabled       Boolean @default(true)
  byokPreference    BYOKPreference @default(PREFER_BYOK)
  
  // Credits System
  creditsBalance    Int     @default(0)  // Current balance
  creditsLifetime   Int     @default(0)  // Total ever purchased
  
  // Relations
  usageLogs         UsageLog[]
  creditTransactions CreditTransaction[]
}

enum BYOKPreference {
  PREFER_BYOK      // Use BYOK first, fallback to platform
  BYOK_ONLY        // Never use platform credits
  PLATFORM_ONLY    // Never use BYOK
}

// ============ USAGE TRACKING ============

model UsageLog {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  provider      Provider
  model         String
  mode          UsageMode
  
  inputTokens   Int
  outputTokens  Int
  totalTokens   Int
  
  // Credits consumed (only for PLATFORM mode)
  creditsUsed   Int       @default(0)
  
  // For debugging/analytics
  conversationId String?
  appId          String?
  errorOccurred  Boolean   @default(false)
  errorMessage   String?
  
  createdAt     DateTime  @default(now())
  
  @@index([userId, createdAt])
  @@index([mode])
}

enum Provider {
  ANTHROPIC
  OPENAI
}

enum UsageMode {
  BYOK
  PLATFORM
}

// ============ CREDITS ============

model CreditTransaction {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        CreditType
  amount      Int         // Positive = add, Negative = subtract
  balance     Int         // Balance AFTER transaction
  
  // Reference
  description String?
  stripePaymentId String?
  usageLogId  String?     // If consumed by AI usage
  
  createdAt   DateTime  @default(now())
  
  @@index([userId, createdAt])
}

enum CreditType {
  PURCHASE        // User bought credits
  BONUS           // Free credits (promo, signup, etc.)
  CONSUMPTION     // Used for AI generation
  REFUND          // Refunded
  EXPIRY          // Credits expired
}
```

### 4.2 Modifications API Chat

```typescript
// src/app/api/chat/route.ts - VERSION MODIFIÉE

import { prisma } from '@/lib/prisma'
import { decryptApiKey } from '@/lib/crypto'
import { estimateTokens, calculateCredits } from '@/lib/credits'

export async function POST(req: NextRequest) {
  // ... auth & validation ...

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      openaiKey: true,
      anthropicKey: true,
      byokEnabled: true,
      byokPreference: true,
      creditsBalance: true,
    }
  })

  // Decrypt BYOK keys if present and enabled
  const decryptedOpenaiKey = user.byokEnabled && user.openaiKey 
    ? decryptApiKey(user.openaiKey) 
    : null
  const decryptedAnthropicKey = user.byokEnabled && user.anthropicKey 
    ? decryptApiKey(user.anthropicKey) 
    : null

  // Determine which keys to use based on preference
  let useMode: 'BYOK' | 'PLATFORM' = 'PLATFORM'
  let selectedProvider: 'ANTHROPIC' | 'OPENAI' = 'ANTHROPIC'
  let selectedApiKey: string | null = null

  switch (user.byokPreference) {
    case 'BYOK_ONLY':
      if (!decryptedAnthropicKey && !decryptedOpenaiKey) {
        return NextResponse.json({ 
          error: 'BYOK mode requires API keys. Add keys in Settings.' 
        }, { status: 400 })
      }
      useMode = 'BYOK'
      selectedApiKey = decryptedAnthropicKey || decryptedOpenaiKey
      selectedProvider = decryptedAnthropicKey ? 'ANTHROPIC' : 'OPENAI'
      break

    case 'PLATFORM_ONLY':
      if (user.creditsBalance <= 0) {
        return NextResponse.json({ 
          error: 'Insufficient credits. Purchase more or enable BYOK.' 
        }, { status: 402 })
      }
      useMode = 'PLATFORM'
      selectedApiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY
      selectedProvider = process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC' : 'OPENAI'
      break

    case 'PREFER_BYOK':
    default:
      if (decryptedAnthropicKey || decryptedOpenaiKey) {
        useMode = 'BYOK'
        selectedApiKey = decryptedAnthropicKey || decryptedOpenaiKey
        selectedProvider = decryptedAnthropicKey ? 'ANTHROPIC' : 'OPENAI'
      } else if (user.creditsBalance > 0) {
        useMode = 'PLATFORM'
        selectedApiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY
        selectedProvider = process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC' : 'OPENAI'
      } else {
        return NextResponse.json({ 
          error: 'No API keys and no credits. Add BYOK keys or purchase credits.' 
        }, { status: 402 })
      }
  }

  // Estimate input tokens BEFORE calling API
  const estimatedInputTokens = estimateTokens(JSON.stringify(chatMessages))

  // Check credits if using platform
  if (useMode === 'PLATFORM') {
    const estimatedCredits = calculateCredits(
      selectedProvider, 
      estimatedInputTokens, 
      4096 // max output
    )
    if (user.creditsBalance < estimatedCredits) {
      return NextResponse.json({ 
        error: 'Insufficient credits for this request.',
        creditsNeeded: estimatedCredits,
        creditsBalance: user.creditsBalance,
      }, { status: 402 })
    }
  }

  let fullContent = ''
  let actualInputTokens = 0
  let actualOutputTokens = 0
  const modelUsed = selectedProvider === 'ANTHROPIC' 
    ? 'claude-sonnet-4-20250514' 
    : 'gpt-4o'

  try {
    if (selectedProvider === 'ANTHROPIC') {
      const response = await generateWithAnthropic(chatMessages, selectedApiKey!)
      fullContent = response.content
      actualInputTokens = response.usage.input_tokens
      actualOutputTokens = response.usage.output_tokens
    } else {
      const response = await generateWithOpenAI(chatMessages, selectedApiKey!)
      fullContent = response.content
      actualInputTokens = response.usage.prompt_tokens
      actualOutputTokens = response.usage.completion_tokens
    }
  } catch (error) {
    // Log failed attempt
    await prisma.usageLog.create({
      data: {
        userId: user.id,
        provider: selectedProvider,
        model: modelUsed,
        mode: useMode,
        inputTokens: estimatedInputTokens,
        outputTokens: 0,
        totalTokens: estimatedInputTokens,
        creditsUsed: 0,
        errorOccurred: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    })
    throw error
  }

  // Calculate and deduct credits if platform mode
  let creditsUsed = 0
  if (useMode === 'PLATFORM') {
    creditsUsed = calculateCredits(
      selectedProvider, 
      actualInputTokens, 
      actualOutputTokens
    )
    
    // Atomic credit deduction with transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { creditsBalance: { decrement: creditsUsed } }
      }),
      prisma.creditTransaction.create({
        data: {
          userId: user.id,
          type: 'CONSUMPTION',
          amount: -creditsUsed,
          balance: user.creditsBalance - creditsUsed,
          description: `AI generation: ${modelUsed}`,
        }
      })
    ])
  }

  // Log successful usage
  await prisma.usageLog.create({
    data: {
      userId: user.id,
      provider: selectedProvider,
      model: modelUsed,
      mode: useMode,
      inputTokens: actualInputTokens,
      outputTokens: actualOutputTokens,
      totalTokens: actualInputTokens + actualOutputTokens,
      creditsUsed,
      conversationId: app?.conversationId,
      appId,
    }
  })

  return NextResponse.json({
    content: cleanContent || 'Code generated successfully.',
    codeOutput,
    success: true,
    usage: {
      mode: useMode,
      provider: selectedProvider,
      model: modelUsed,
      tokens: {
        input: actualInputTokens,
        output: actualOutputTokens,
        total: actualInputTokens + actualOutputTokens,
      },
      creditsUsed,
      creditsRemaining: useMode === 'PLATFORM' 
        ? user.creditsBalance - creditsUsed 
        : user.creditsBalance,
    }
  })
}
```

### 4.3 Estimation des Tokens

Créer `src/lib/credits.ts`:

```typescript
// Rough token estimation (4 chars ≈ 1 token for English)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Pricing in credits (1 credit = $0.001)
const PRICING = {
  ANTHROPIC: {
    'claude-sonnet-4-20250514': {
      inputPer1M: 3000,   // $3 per 1M input tokens = 3000 credits
      outputPer1M: 15000, // $15 per 1M output tokens = 15000 credits
    }
  },
  OPENAI: {
    'gpt-4o': {
      inputPer1M: 2500,   // $2.50 per 1M input
      outputPer1M: 10000, // $10 per 1M output
    }
  }
}

export function calculateCredits(
  provider: 'ANTHROPIC' | 'OPENAI',
  inputTokens: number,
  outputTokens: number,
  model?: string
): number {
  const modelKey = model || (provider === 'ANTHROPIC' ? 'claude-sonnet-4-20250514' : 'gpt-4o')
  const pricing = PRICING[provider][modelKey as keyof typeof PRICING[typeof provider]]
  
  if (!pricing) {
    // Fallback: use most expensive pricing
    return Math.ceil((inputTokens * 3000 + outputTokens * 15000) / 1000000)
  }
  
  const inputCost = (inputTokens * pricing.inputPer1M) / 1000000
  const outputCost = (outputTokens * pricing.outputPer1M) / 1000000
  
  // Round up to ensure we never undercharge
  return Math.ceil(inputCost + outputCost)
}

// Helper for UI
export function creditsToUSD(credits: number): string {
  return `$${(credits / 1000).toFixed(3)}`
}
```

### 4.4 Estimation Tokens par Requête

| Composant | Tokens Estimés |
|-----------|----------------|
| System Prompt | ~2,000-3,000 |
| Context Code (si présent) | ~500-2,000 |
| Message User | ~50-500 |
| **Total Input** | **~2,500-5,500** |
| **Output Généré** | **~1,000-4,000** |

**Estimation coût par requête:**
- Mode Claude Sonnet: ~0.03-0.10$ par requête
- Mode GPT-4o: ~0.02-0.06$ par requête

---

## 5️⃣ MIGRATION À EFFECTUER

### 5.1 Commandes Prisma

```bash
# Générer la migration
npx prisma migrate dev --name add_credits_and_usage_tracking

# Appliquer en prod
npx prisma migrate deploy
```

### 5.2 Variables d'environnement à ajouter

```env
# .env
ENCRYPTION_KEY=your-64-char-hex-key-here  # Generate: openssl rand -hex 32
```

---

## 6️⃣ CHECKLIST IMPLÉMENTATION

- [ ] 🔴 Implémenter `src/lib/crypto.ts` (chiffrement AES-256-GCM)
- [ ] 🔴 Modifier `PATCH /api/user` pour chiffrer les clés
- [ ] 🔴 Modifier `GET /api/user` pour ne JAMAIS retourner les clés
- [ ] 🔴 Modifier chat route pour déchiffrer avant usage
- [ ] 🟡 Ajouter champs Prisma: `byokEnabled`, `byokPreference`
- [ ] 🟡 Ajouter modèles Prisma: `UsageLog`, `CreditTransaction`
- [ ] 🟡 Créer `src/lib/credits.ts`
- [ ] 🟡 Modifier chat route pour tracker l'usage
- [ ] 🟢 Migrer les clés existantes (script one-time)
- [ ] 🟢 Ajouter UI toggle BYOK dans Settings
- [ ] 🟢 Ajouter page Usage/Analytics pour l'utilisateur

---

## 7️⃣ CONCLUSION

**État actuel: ⚠️ NON PRODUCTION-READY**

Le système BYOK fonctionne côté logique (fallback, détection erreurs) mais présente une **faille de sécurité critique**: les clés API sont stockées en clair malgré ce que l'UI prétend.

**Priorité immédiate:**
1. Implémenter le chiffrement réel des clés
2. Ou retirer le mensonge de l'UI ("encrypted with AES-256")

Le système de crédits proposé permet de tracker précisément BYOK vs Platform et d'implémenter une facturation équitable.
