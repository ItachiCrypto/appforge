# 🔍 AUDIT AGENT 2 - Analyse Vercel/Déploiement

**Date:** 2025-01-31
**Erreur rapportée:** `TypeError: Cannot read properties of undefined (reading 'value')`
**Statut:** ❌ L'app fonctionne en localhost mais pas sur Vercel

---

## 📋 Résumé Exécutif

J'ai identifié **4 problèmes critiques** qui expliquent pourquoi l'app marche en localhost mais échoue sur Vercel. L'erreur `Cannot read properties of undefined (reading 'value')` est très probablement causée par le **middleware Clerk mal configuré**.

---

## 🚨 PROBLÈME #1 (CRITIQUE): Middleware Clerk avec syntaxe incorrecte

**Fichier:** `src/middleware.ts`

**Code problématique:**
```typescript
return authMiddleware({
  publicRoutes: [...],
})(request, {} as any)  // ❌ ERREUR ICI!
```

**Explication:**
- Le `authMiddleware` de Clerk v4.x retourne un middleware qui attend `(request: NextRequest, event: NextFetchEvent)`.
- Le code passe `{} as any` comme deuxième argument au lieu d'un vrai `NextFetchEvent`.
- En **localhost**, Next.js est plus permissif et peut ignorer certaines erreurs.
- Sur **Vercel (Edge Runtime)**, le code s'exécute dans un environnement strict où l'accès à `event.value` (ou une propriété similaire interne) échoue car l'objet est vide.

**Pourquoi ça cause l'erreur:**
Le middleware Clerk essaie probablement d'accéder à `event.waitUntil` ou une propriété interne, et comme `{}` est passé, il obtient `undefined` puis essaie d'accéder à `.value`.

---

## 🚨 PROBLÈME #2 (CRITIQUE): Variables d'environnement corrompues

**Fichier:** `.env.production`

**Contenu observé:**
```env
CLERK_SECRET_KEY="sk_test_hXdPpfcQOKKNNVHrfxUS6RYSqMSDIDJti8FqnV4v6V\n"  # ❌ \n en trop
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard\n"  # ❌ \n en trop
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard\n"  # ❌ \n en trop
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_...JA\n"  # ❌ \n en trop
```

**Impact:**
- Les clés API contiennent des caractères `\n` littéraux à la fin.
- Sur Vercel, quand ces variables sont utilisées, les URLs de redirection deviennent `/dashboard\n` au lieu de `/dashboard`.
- Cela peut causer des erreurs silencieuses ou des comportements inattendus.

---

## 🚨 PROBLÈME #3 (CRITIQUE): DATABASE_URL manquant

**Fichiers vérifiés:** `.env.local`, `.env.vercel`, `.env.production`

**Constatation:**
- `DATABASE_URL` **n'est défini dans AUCUN de ces fichiers**.
- Seul `.env.example` contient un placeholder.

**Impact:**
- Sur Vercel, Prisma ne peut pas se connecter à la base de données.
- Le `DashboardLayout` appelle `prisma.user.findUnique()` au render.
- Si la DB est inaccessible, l'erreur peut remonter et causer des crashes.

**Note:** Il est possible que `DATABASE_URL` soit configuré directement dans les paramètres Vercel (via l'UI), mais cela doit être vérifié.

---

## ⚠️ PROBLÈME #4 (MOYEN): Incohérence des URLs Clerk

**`.env.local`:**
```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"    # ❌ Mauvaise URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/register"  # ❌ Mauvaise URL
```

**Middleware (`src/middleware.ts`):**
```typescript
const ROUTE_REDIRECTS: Record<string, string> = {
  '/login': '/sign-in',
  '/register': '/sign-up',
  // ...
}
```

**Impact:**
1. Clerk pense que la page de connexion est `/login`.
2. Quand un utilisateur non-authentifié accède au dashboard, Clerk redirige vers `/login`.
3. Le middleware intercepte `/login` et redirige vers `/sign-in`.
4. Cela fonctionne mais crée une redirection inutile.
5. Sur Vercel avec le middleware buggé, cette chaîne de redirections peut causer des problèmes.

---

## 📊 Comparaison Localhost vs Vercel

| Aspect | Localhost | Vercel |
|--------|-----------|--------|
| Runtime Middleware | Node.js (flexible) | Edge Runtime (strict) |
| Env loading | `.env.local` direct | Variables Vercel UI |
| Erreurs silencieuses | Souvent ignorées | Crash immédiat |
| Base de données | Accessible via localhost | Nécessite URL publique |
| Cookies Clerk | Fonctionnent | Peuvent nécessiter config CORS |

---

## 🔧 Vérifications additionnelles recommandées

### 1. Vérifier les variables Vercel
```bash
cd /root/.openclaw/workspace/startup
vercel env ls
```

Doit contenir:
- `DATABASE_URL` (PostgreSQL accessible depuis internet)
- `CLERK_SECRET_KEY` (sans `\n`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (sans `\n`)
- `STRIPE_*` variables si billing activé

### 2. Vérifier les logs de build Vercel
L'erreur exacte devrait apparaître dans les logs de déploiement Vercel.

### 3. Vérifier la version de Next.js
**Package.json:** `"next": "14.2.25"`

Cette version est récente et compatible avec Clerk 4.x, donc pas de problème ici.

---

## 📝 Configuration Actuelle

### next.config.js
```javascript
const nextConfig = {
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
}
```
✅ Configuration basique OK.

### package.json (dépendances clés)
```json
{
  "@clerk/nextjs": "^4.27.0",  // v4.31.8 installée
  "next": "14.2.25",
  "@prisma/client": "^5.8.0"
}
```
✅ Versions compatibles.

---

## 🏁 SOLUTION PROPOSÉE

### Fix immédiat (ordre de priorité):

**1. Corriger le middleware (URGENT):**
```typescript
// src/middleware.ts - AVANT
export default function middleware(request: NextRequest) {
  // ...
  return authMiddleware({...})(request, {} as any)  // ❌
}

// src/middleware.ts - APRÈS
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/pricing',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
  ],
  beforeAuth: (request) => {
    // Handle legacy redirects BEFORE auth
    const { pathname } = request.nextUrl
    const redirects: Record<string, string> = {
      '/login': '/sign-in',
      '/register': '/sign-up',
    }
    if (redirects[pathname]) {
      const url = request.nextUrl.clone()
      url.pathname = redirects[pathname]
      return NextResponse.redirect(url)
    }
  },
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

**2. Corriger les variables d'environnement sur Vercel:**
Via la dashboard Vercel (Settings > Environment Variables):
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` → `/sign-in` (pas `/login`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` → `/sign-up` (pas `/register`)
- Supprimer tout caractère `\n` des valeurs
- Ajouter `DATABASE_URL` si manquant

**3. Vérifier DATABASE_URL:**
```bash
vercel env pull .env.vercel-check
grep DATABASE_URL .env.vercel-check
```
Si absent, ajouter la connexion PostgreSQL (ex: Neon, Supabase, Vercel Postgres).

**4. Redéployer:**
```bash
vercel --prod
```

---

## 🎯 Cause Racine Probable

L'erreur `TypeError: Cannot read properties of undefined (reading 'value')` est causée par:

**→ Le middleware qui passe `{} as any` au lieu d'un `NextFetchEvent` valide.**

Sur l'Edge Runtime de Vercel, le code Clerk essaie d'accéder à une propriété d'un objet vide, ce qui cause l'erreur. En localhost (Node.js runtime), ce comportement est soit ignoré, soit géré différemment.

---

**SOLUTION PROPOSÉE:** Réécrire le middleware pour utiliser la syntaxe standard de `authMiddleware` de Clerk v4, en supprimant complètement le wrapper personnalisé qui passe `{} as any`. Les redirections de routes legacy doivent utiliser le hook `beforeAuth` fourni par Clerk.
