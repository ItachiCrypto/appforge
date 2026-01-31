# 🔍 Audit Technique Backend - AppForge

**Date:** 31 Janvier 2025  
**Auditeur:** Backend/DevOps Engineer Senior  
**Scope:** API Routes, Prisma, Sécurité, Performance

---

## 📊 Résumé Exécutif

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Validation des inputs | 2/5 | 🔴 Critique |
| Gestion des erreurs | 3/5 | 🟡 À améliorer |
| Rate limiting | 0/5 | 🔴 Absent |
| Auth middleware | 4/5 | 🟢 Bon |
| Performance DB | 3/5 | 🟡 À améliorer |
| Variables d'environnement | 3/5 | 🟡 À améliorer |
| **Score Global** | **15/30** | **⚠️ MVP acceptable, non production-ready** |

---

## 1. 🔐 Analyse de l'Authentification

### Ce qui fonctionne ✅
- Clerk correctement intégré via `auth()` sur toutes les routes protégées
- Pattern consistant: auth → user lookup → authorization
- Middleware avec routes publiques bien définies

### Problèmes identifiés 🔴

#### 1.1 Bypass du middleware dangereux
```typescript
// src/middleware.ts - PROBLÈME
export default function middleware(request: NextRequest) {
  if (!isClerkConfigured()) {
    return NextResponse.next() // ⚠️ Bypass total si Clerk non configuré!
  }
  // ...
}
```
**Impact:** Si `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` manque ou est mal formé, TOUTES les routes sont accessibles sans auth.

**Fix recommandé:**
```typescript
if (!isClerkConfigured()) {
  // En dev: warning, en prod: bloquer
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
  }
  console.warn('⚠️ Clerk not configured - auth bypassed')
}
```

#### 1.2 Pas de vérification d'ownership avant update/delete
```typescript
// src/app/api/apps/[id]/route.ts - Pattern actuel
const app = await prisma.app.findFirst({
  where: {
    id: params.id,
    userId: user.id, // ✅ Correct
  },
})
```
**Status:** ✅ OK - La vérification userId est présente

#### 1.3 Auth handler vide
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```
**Problème:** `handlers` n'existe pas dans `/lib/auth.ts` → Ce fichier va crasher!

---

## 2. 📝 Validation des Inputs

### État actuel: 🔴 CRITIQUE

Zod est installé (`"zod": "^3.22.4"`) mais **JAMAIS utilisé** dans les routes API!

#### Exemple problématique - `/api/chat/route.ts`
```typescript
const { appId, messages } = await req.json() // ❌ Aucune validation!

// Risques:
// - messages peut être null/undefined → crash
// - messages[].role peut être n'importe quoi
// - Injection de prompts malicieux possible
```

#### Exemple problématique - `/api/apps/route.ts`
```typescript
const { name, description } = await req.json() // ❌ Aucune validation!

// Risques:
// - name peut être vide, trop long, contenir du XSS
// - description sans limite de longueur
```

### Fix recommandé: Créer `/lib/validations.ts`
```typescript
import { z } from 'zod';

export const createAppSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
});

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50000),
});

export const chatRequestSchema = z.object({
  appId: z.string().cuid().optional(),
  messages: z.array(chatMessageSchema).min(1).max(100),
});

export const updateAppSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  files: z.record(z.string()).optional(),
  status: z.enum(['DRAFT', 'PREVIEW', 'DEPLOYED', 'ARCHIVED']).optional(),
});
```

### Routes à corriger en priorité:
1. `POST /api/chat` - Injection de prompts possible
2. `PATCH /api/apps/[id]` - Files JSON non validé
3. `POST /api/stripe/checkout` - Plan non validé correctement

---

## 3. ⚡ Rate Limiting

### État actuel: 🔴 ABSENT

**Aucun rate limiting** sur aucune route. Vulnérabilités:

| Route | Risque | Impact |
|-------|--------|--------|
| `/api/chat` | DoS, coût OpenAI explosif | 🔴 Critique |
| `/api/apps` | Création massive d'apps | 🟡 Moyen |
| `/api/stripe/checkout` | Abuse de sessions | 🟡 Moyen |
| Webhooks | Replay attacks | 🟡 Moyen |

### Fix recommandé: Upstash Rate Limiter
```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const rateLimiters = {
  chat: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1m'), // 10 req/min
    analytics: true,
  }),
  apps: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1m'),
  }),
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1h'), // 5 checkouts/heure
  }),
};

export async function rateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const { success, remaining } = await limiter.limit(identifier);
  return { success, remaining };
}
```

**Usage dans les routes:**
```typescript
const { success, remaining } = await rateLimit(rateLimiters.chat, user.id);
if (!success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', retryAfter: 60 },
    { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
```

---

## 4. 🗄️ Performance Database (Prisma)

### Ce qui fonctionne ✅
- Singleton pattern pour PrismaClient
- Index sur `userId` pour `App` et `Conversation`
- Index sur `conversationId` pour `Message`
- Cascade delete configuré

### Problèmes identifiés 🟡

#### 4.1 N+1 Query potentiel
```typescript
// /api/apps/route.ts - GET
const apps = await prisma.app.findMany({
  where: { userId: user.id },
  orderBy: { updatedAt: 'desc' },
}); // ⚠️ Pas de pagination!
```

**Fix:**
```typescript
const { page = 1, limit = 20 } = Object.fromEntries(req.nextUrl.searchParams);
const apps = await prisma.app.findMany({
  where: { userId: user.id },
  orderBy: { updatedAt: 'desc' },
  skip: (Number(page) - 1) * Number(limit),
  take: Math.min(Number(limit), 50), // Max 50
  select: { id: true, name: true, status: true, updatedAt: true }, // Select explicite
});
```

#### 4.2 Messages sans pagination
```typescript
// /api/apps/[id]/route.ts
include: {
  messages: {
    orderBy: { createdAt: 'asc' },
  }, // ⚠️ Charge TOUS les messages!
}
```

**Fix:** Ajouter `take: 100` et implémenter la pagination côté client.

#### 4.3 Transactions manquantes
```typescript
// /api/chat/route.ts - Devrait être une transaction
await prisma.message.create({ ... }) // Message user
await prisma.message.create({ ... }) // Message assistant
await prisma.app.update({ ... })    // Update app files
// ⚠️ Si le 3ème échoue, état incohérent!
```

**Fix:**
```typescript
await prisma.$transaction([
  prisma.message.create({ data: userMessage }),
  prisma.message.create({ data: assistantMessage }),
  prisma.app.update({ where: { id: appId }, data: { files: newFiles } }),
]);
```

#### 4.4 Index manquants suggérés
```prisma
// Ajouter dans schema.prisma
model App {
  // ...
  @@index([userId, status]) // Pour filtrer les apps par status
  @@index([userId, updatedAt]) // Pour le tri
}

model User {
  // ...
  @@index([plan]) // Pour analytics
}
```

---

## 5. 🔐 Sécurité des API Keys (BYOK)

### État actuel: 🔴 CRITIQUE

```typescript
// src/app/api/user/route.ts - PATCH
const { openaiKey, anthropicKey } = await req.json()

// In production, encrypt these keys before storing
// For MVP, we'll store them as-is (not recommended for production!)
await prisma.user.update({
  data: {
    ...(openaiKey !== undefined && { openaiKey }),
    // ⚠️ STOCKÉ EN CLAIR DANS LA DB!
  },
})
```

### Fix obligatoire: Chiffrement AES-256
```typescript
// src/lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes hex
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## 6. 🌐 Variables d'Environnement

### Audit de `.env.example`

| Variable | Status | Note |
|----------|--------|------|
| `DATABASE_URL` | ✅ | OK |
| `CLERK_SECRET_KEY` | ✅ | OK |
| `OPENAI_API_KEY` | ✅ | OK |
| `STRIPE_SECRET_KEY` | ✅ | OK |
| `STRIPE_WEBHOOK_SECRET` | ✅ | OK |
| `ENCRYPTION_KEY` | ⚠️ | Défini mais NON UTILISÉ |
| `VERCEL_TOKEN` | ⚠️ | Optional non marqué |
| `NEXT_PUBLIC_APP_URL` | ✅ | OK |

### Problèmes identifiés

#### 6.1 `absoluteUrl` et `generateAppName` manquants dans utils.ts
```typescript
// Ces fonctions sont importées mais n'existent pas dans src/lib/utils.ts!
import { absoluteUrl } from '@/lib/utils' // ❌ N'existe pas
import { generateAppName } from '@/lib/utils' // ❌ N'existe pas
```

**Fix:** Ajouter dans `src/lib/utils.ts`:
```typescript
export function absoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

const adjectives = ['Swift', 'Bright', 'Smart', 'Quick', 'Bold'];
const nouns = ['App', 'Project', 'Tool', 'Hub', 'Space'];

export function generateAppName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
}
```

#### 6.2 Validation des env vars au démarrage
```typescript
// src/lib/env.ts (à créer)
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes en hex
});

export const env = envSchema.parse(process.env);
```

---

## 7. 🚨 Gestion des Erreurs

### Ce qui fonctionne ✅
- Try/catch sur toutes les routes
- Logging des erreurs avec `console.error`
- Responses HTTP appropriées (401, 404, 500)

### À améliorer 🟡

#### 7.1 Erreurs non typées
```typescript
catch (error) {
  console.error('Chat error:', error) // ⚠️ Peut logger des infos sensibles
  return NextResponse.json(
    { error: 'Failed to process chat' }, // Message générique OK
    { status: 500 }
  )
}
```

**Fix:** Logging structuré
```typescript
import { logger } from '@/lib/logger'; // Pino ou Winston

catch (error) {
  const errorId = crypto.randomUUID();
  logger.error({
    errorId,
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    route: '/api/chat',
    userId: user?.id,
  });
  return NextResponse.json(
    { error: 'Failed to process chat', errorId },
    { status: 500 }
  );
}
```

#### 7.2 Pas de distinction erreurs métier vs techniques
```typescript
// Recommandé:
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

throw new AppError(403, 'APP_LIMIT_REACHED', 'App limit reached. Please upgrade.');
```

---

## 8. 🐛 Bugs et Edge Cases

### 8.1 Race condition sur création d'app
```typescript
// /api/apps/route.ts
const limit = APP_LIMITS[user.plan]
if (limit !== Infinity && user.apps.length >= limit) { // Check
  return NextResponse.json({ error: 'App limit reached' })
}
// ⚠️ Race: si 2 requêtes simultanées passent le check...
const app = await prisma.app.create({ ... }) // Création
```

**Fix:** Transaction avec count
```typescript
const result = await prisma.$transaction(async (tx) => {
  const count = await tx.app.count({ where: { userId: user.id } });
  if (limit !== Infinity && count >= limit) {
    throw new AppError(403, 'APP_LIMIT_REACHED', 'Limit reached');
  }
  return tx.app.create({ data: { ... } });
});
```

### 8.2 Webhook Stripe sans idempotence
```typescript
// /api/webhooks/stripe/route.ts
case 'checkout.session.completed': {
  await prisma.user.update({ ... }) // ⚠️ Pas de check si déjà traité
}
```

**Fix:** Stocker les event IDs
```prisma
model ProcessedWebhook {
  id        String   @id
  type      String
  createdAt DateTime @default(now())
}
```

### 8.3 `updateMany` ne retourne pas les données
```typescript
// /api/apps/[id]/route.ts
const app = await prisma.app.updateMany({ ... })
if (app.count === 0) {
  return NextResponse.json({ error: 'App not found' }) // ✅ OK
}
return NextResponse.json({ success: true }) // ⚠️ Pas de données retournées
```

---

## 9. 📋 Plan d'Action Prioritaire

### 🔴 P0 - Avant production (Bloquant)
1. [ ] Ajouter validation Zod sur TOUTES les routes
2. [ ] Implémenter le chiffrement des API keys BYOK
3. [ ] Ajouter rate limiting sur `/api/chat` et `/api/apps`
4. [ ] Corriger le bypass du middleware en production
5. [ ] Ajouter les fonctions manquantes (`absoluteUrl`, `generateAppName`)
6. [ ] Fixer la route `/api/auth/[...nextauth]` (handlers inexistants)

### 🟡 P1 - Semaine 1 post-launch
7. [ ] Ajouter pagination sur les listes (apps, messages)
8. [ ] Implémenter les transactions Prisma pour les opérations multi-tables
9. [ ] Ajouter idempotence sur les webhooks
10. [ ] Logging structuré avec correlation IDs

### 🟢 P2 - Mois 1
11. [ ] Index DB supplémentaires basés sur les query patterns réels
12. [ ] Monitoring des slow queries
13. [ ] Tests d'intégration pour les routes API
14. [ ] Documentation OpenAPI/Swagger

---

## 10. 📁 Fichiers à Créer

```
src/lib/
├── validations.ts     # Schémas Zod
├── encryption.ts      # AES-256-GCM
├── rate-limit.ts      # Upstash wrapper
├── errors.ts          # AppError class
├── logger.ts          # Logging structuré
└── env.ts             # Validation env vars
```

---

## 🎯 Conclusion

L'application AppForge est un **MVP fonctionnel** mais présente des vulnérabilités critiques qui **bloquent un déploiement production**:

1. **Aucune validation des inputs** → Risque d'injection et de crash
2. **Aucun rate limiting** → Risque de DoS et de factures OpenAI explosives
3. **API keys stockées en clair** → Violation RGPD et risque de fuite

Les 6 actions P0 sont **impératives** avant tout beta test public. Temps estimé: **2-3 jours** pour un dev senior.

Le reste de l'architecture est solide (Clerk, Prisma, Stripe) et bien structuré pour un MVP.

---

*Rapport généré automatiquement - Backend Audit v1.0*
