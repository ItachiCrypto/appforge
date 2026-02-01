# 🔴 DIAGNOSTIC CRITIQUE - Prisma/Supabase sur Vercel

**Date:** 2025-02-02  
**Expert:** Prisma/Supabase Specialist  
**Problème:** Dashboard fonctionne en LOCAL mais PAS sur Vercel  

---

## 🎯 RÉSUMÉ EXÉCUTIF

| Problème | Gravité | Statut |
|----------|---------|--------|
| `\n` dans DIRECT_URL | 🔴 CRITIQUE | À corriger |
| SSL mode manquant | 🔴 CRITIQUE | À corriger |
| Connection limit serverless | 🟡 IMPORTANT | À ajouter |
| IPv6 Supabase | 🟡 PEUT-ÊTRE | À vérifier |
| Prisma postinstall | 🟢 OK | Correct |

---

## 🚨 PROBLÈME #1: NEWLINE DANS DIRECT_URL (CRITIQUE!)

### Découverte
Dans `.env.vercel.production`:
```bash
DIRECT_URL="postgresql://...5432/postgres\n"
                                        ^^
                                        NEWLINE!
```

### Impact
PostgreSQL reçoit une URL avec un retour à la ligne → **Connexion impossible**

### Fix immédiat
```bash
# Sur Vercel Dashboard ou CLI, s'assurer que DIRECT_URL est:
postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres
# SANS \n à la fin!
```

---

## 🚨 PROBLÈME #2: SSL MODE MANQUANT (CRITIQUE!)

### Contexte Supabase
Supabase **EXIGE SSL** pour toutes les connexions depuis l'extérieur de leur réseau. En local, ça peut fonctionner car c'est souvent plus permissif, mais Vercel est externe.

### Votre configuration actuelle
```bash
DATABASE_URL="postgresql://...6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...5432/postgres"
```

### Configuration requise
```bash
DATABASE_URL="postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres?sslmode=require"
```

### Pourquoi ça marche en local?
- En local, vous êtes peut-être sur un réseau autorisé
- Ou votre client local négocie SSL automatiquement
- Vercel serverless est plus strict: il utilise des connexions éphémères qui nécessitent SSL explicite

---

## 🟡 PROBLÈME #3: CONNECTION LIMIT POUR SERVERLESS

### Le problème
Chaque serverless function peut ouvrir plusieurs connexions. Avec cold starts répétés, vous pouvez épuiser le pool Supabase (max 60 connexions sur free tier).

### Solution
Ajouter `connection_limit=1` à DATABASE_URL:
```bash
DATABASE_URL="postgresql://...?pgbouncer=true&sslmode=require&connection_limit=1"
```

### Prisma Client déjà optimisé ✅
Votre `src/lib/prisma.ts` utilise le singleton pattern - c'est correct:
```typescript
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
```

---

## 🟡 PROBLÈME #4: IPv6 SUPABASE

### Contexte
Supabase utilise IPv6 par défaut. Certains environnements Vercel peuvent avoir des problèmes avec IPv6.

### Comment vérifier
1. Aller sur Supabase Dashboard → Settings → Database
2. Chercher "Connection Pooling" ou "IPv4 Add-on"
3. Si disponible, activer IPv4

### Solution alternative
Utiliser le hostname direct avec IPv4 forcé si disponible, ou utiliser l'option "Use connection pooler host" dans Supabase.

---

## ✅ VÉRIFICATION #1: PRISMA POSTINSTALL (OK!)

### package.json
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"  // ✅ PRÉSENT
  }
}
```

### vercel.json
```json
{
  "buildCommand": "prisma generate && next build"  // ✅ REDONDANT MAIS OK
}
```

**Verdict:** Prisma Client EST généré au deploy. Ce n'est PAS le problème.

---

## ✅ VÉRIFICATION #2: SCHEMA PRISMA (OK!)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // ✅ CORRECT
}
```

**Verdict:** Configuration correcte pour Supabase pooler.

---

## ❌ VÉRIFICATION #3: SUPABASE FIREWALL/RESTRICTIONS

### Vérifier sur Supabase Dashboard:
1. **Settings → Database → Connection Pooling**
   - Mode: `Transaction` (recommandé pour serverless)
   - Pool size: au moins 15

2. **Settings → Database → Network Restrictions**
   - ⚠️ Si "Allow connections from specific IPs only" est activé
   - Vercel utilise des IPs dynamiques → IMPOSSIBLE à whitelister
   - **Solution:** Désactiver les restrictions IP ou utiliser Supabase "Allow all IPs"

3. **Settings → API → Service role key**
   - Pas utilisé ici (connexion directe DB)

### Vérification CLI
```bash
# Tester la connexion depuis une IP externe
psql "postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres?sslmode=require"
```

---

## 🔧 CORRECTIONS À APPLIQUER

### Étape 1: Nouvelles valeurs pour Vercel

```bash
# DATABASE_URL (avec pgbouncer + SSL + connection limit)
DATABASE_URL="postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=1"

# DIRECT_URL (sans pgbouncer, avec SSL, SANS \n!)
DIRECT_URL="postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres?sslmode=require"
```

### Étape 2: Mettre à jour sur Vercel

```bash
cd /root/.openclaw/workspace/startup

# Supprimer les anciennes variables
vercel env rm DATABASE_URL production -y
vercel env rm DIRECT_URL production -y

# Ajouter les nouvelles (attention: pas de \n!)
vercel env add DATABASE_URL production
# Coller: postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=1

vercel env add DIRECT_URL production
# Coller: postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres?sslmode=require
```

### Étape 3: Vérifier les variables

```bash
# Lister pour confirmer
vercel env ls

# Tirer les variables pour vérifier (créera .env.local)
vercel env pull .env.vercel-check
cat .env.vercel-check | grep -E "DATABASE|DIRECT"
```

### Étape 4: Redéployer

```bash
vercel --prod --force
```

### Étape 5: Tester

```bash
# L'endpoint health que j'ai créé
curl https://startup-azure-nine.vercel.app/api/health
```

Réponse attendue:
```json
{
  "status": "healthy",
  "database": "connected",
  "env": {
    "DATABASE_URL": "SET (hidden)",
    "DIRECT_URL": "SET (hidden)"
  }
}
```

---

## 🔬 POURQUOI ÇA MARCHE EN LOCAL MAIS PAS SUR VERCEL?

### Différences Local vs Vercel

| Aspect | Local | Vercel Serverless |
|--------|-------|-------------------|
| **Connexion** | Persistante | Éphémère (cold start) |
| **SSL** | Auto-négocié | Doit être explicite |
| **IP** | Fixe ou réseau local | Dynamique, datacenter |
| **Timeout** | Illimité | 10-30 secondes |
| **Connexions DB** | 1 client | N instances parallèles |
| **Env parsing** | Shell standard | Peut garder `\n` |

### La combinaison mortelle
1. `\n` dans DIRECT_URL → URL invalide
2. Pas de `sslmode=require` → Supabase rejette
3. IP dynamique Vercel → Peut être bloquée si restrictions

### En local, tout est pardonné
- Le shell nettoie souvent les `\n`
- SSL peut être négocié automatiquement
- Pas de restrictions IP sur localhost
- Connexion persistante → pas de cold start

---

## 📊 CHECKLIST FINALE

- [ ] Supprimer le `\n` de DIRECT_URL sur Vercel
- [ ] Ajouter `?sslmode=require` aux deux URLs
- [ ] Ajouter `&connection_limit=1` à DATABASE_URL
- [ ] Vérifier Supabase: pas de restrictions IP
- [ ] Vérifier Supabase: connection pooling mode = Transaction
- [ ] Redéployer avec `vercel --prod --force`
- [ ] Tester `/api/health`
- [ ] Tester `/dashboard` après login

---

## 🆘 SI ÇA NE MARCHE TOUJOURS PAS

### Debug avancé

1. **Voir les vrais logs Vercel:**
```bash
vercel logs https://startup-azure-nine.vercel.app --output=raw
```

2. **Ajouter un log temporaire dans prisma.ts:**
```typescript
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 50))
console.log('DATABASE_URL ends with:', process.env.DATABASE_URL?.slice(-20))
```

3. **Vérifier si c'est un problème IPv6:**
   - Aller sur Supabase Dashboard
   - Settings → Add-ons → IPv4 (si disponible)
   - Activer IPv4 pour avoir un fallback

4. **Nuclear option - utiliser la connection string Supabase pooler:**
   - Supabase Dashboard → Settings → Database
   - Section "Connection string" → URI
   - Copier celle avec `[YOUR-PASSWORD]` et remplacer

---

## 📝 FICHIERS .env CORRIGÉS

### .env.production.local (pour référence locale)
```bash
DATABASE_URL="postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=1"
DIRECT_URL="postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres?sslmode=require"
```

---

**Diagnostic complété. La cause principale est le `\n` dans DIRECT_URL combiné avec l'absence de `sslmode=require`. Ces deux fixes devraient résoudre le problème.**
