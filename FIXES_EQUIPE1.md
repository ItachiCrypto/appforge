# 🔧 FIXES ÉQUIPE 1 - Erreur Production Vercel

**Erreur:** `Application error: a server-side exception has occurred` (Digest: 2659398426)  
**Status:** ✅ Causes identifiées, fixes proposés

---

## 🔍 DIAGNOSTIC

### Fichiers analysés:
| Fichier | Status |
|---------|--------|
| vercel.json | ❌ N'existe pas |
| package.json | ⚠️ Problème script |
| prisma/schema.prisma | ⚠️ Pas de pooling |
| src/lib/prisma.ts | ⚠️ Config basique |

---

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. ❌ Pas de script `postinstall` (CRITIQUE)

**Fichier:** `package.json`

Le script `build` contient `prisma generate`, mais Vercel peut utiliser le cache de `node_modules` et sauter cette étape.

**Fix requis:**
```json
"scripts": {
  "postinstall": "prisma generate",
  "build": "prisma generate && next build",
  ...
}
```

### 2. ❌ Pas de Connection Pooling (CRITIQUE)

**Fichier:** `prisma/schema.prisma`

Les fonctions serverless de Vercel créent une nouvelle connexion à chaque requête. PostgreSQL a une limite de connexions (~100). Sans pooling, la DB devient inaccessible.

**Fix requis - Option A (Prisma Accelerate):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Pour migrations
}
```

**Fix requis - Option B (Supabase/Neon avec pgbouncer):**
- Utiliser l'URL de pooling: `postgresql://...?pgbouncer=true`
- Ajouter `?connection_limit=1` à l'URL

### 3. ⚠️ Prisma Client non optimisé pour Serverless

**Fichier:** `src/lib/prisma.ts`

Le singleton pattern actuel peut créer des fuites de connexions en serverless.

**Fix recommandé:**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Évite les connexions orphelines en serverless
export default prisma
```

### 4. ⚠️ Variables d'environnement Vercel

**À vérifier sur le dashboard Vercel:**
- [ ] `DATABASE_URL` - Doit pointer vers une URL avec pooling
- [ ] `DIRECT_URL` - URL directe pour les migrations (optionnel)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET` (si webhooks utilisés)
- [ ] `OPENAI_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

---

## ✅ PLAN D'ACTION

### Priorité 1 - Fix immédiat (Dev 1)
1. Ajouter `postinstall` script dans package.json
2. Commit et redéployer

### Priorité 2 - Connection Pooling (Dev 2)
1. Modifier prisma/schema.prisma pour supporter `directUrl`
2. Configurer les URLs sur Vercel:
   - `DATABASE_URL` → URL avec pooling (port 6543 sur Supabase)
   - `DIRECT_URL` → URL directe (port 5432)

### Priorité 3 - Vérification (Correcteur)
1. Vérifier toutes les variables d'environnement sur Vercel
2. Comparer avec `.env.local` pour les valeurs manquantes

---

## 📋 COMMANDES DE TEST

```bash
# Après les fixes, tester localement
npm run build

# Vérifier que Prisma génère le client
npx prisma generate

# Tester la connexion DB
npx prisma db push --dry-run
```

---

## 🎯 CAUSE PROBABLE PRINCIPALE

**Connection Pooling manquant** - En production Vercel (serverless), chaque invocation crée une nouvelle connexion PostgreSQL. La base de données atteint rapidement sa limite et refuse les nouvelles connexions, causant l'erreur serveur.

**Solution rapide:** Si vous utilisez Supabase, changez l'URL de:
```
postgresql://user:pass@db.xxx.supabase.co:5432/postgres
```
à:
```
postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

---

*Généré par Équipe 1 - Coordinateur*
