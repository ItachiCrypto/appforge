# 🔍 DIAGNOSTIC DATABASE - AppForge

**Date:** 2025-02-01  
**Problème:** "Unable to load dashboard - There was an error connecting to the database"  
**URL:** https://startup-azure-nine.vercel.app

---

## ✅ CE QUI FONCTIONNE

| Test | Résultat |
|------|----------|
| Connexion PostgreSQL port 5432 (direct) | ✅ OK |
| Connexion PostgreSQL port 6543 (pgbouncer) | ✅ OK |
| Tables Prisma créées | ✅ 5 tables (User, App, AppVersion, Conversation, Message) |
| Prisma Client généré | ✅ v5.22.0 |
| Test Node.js local avec Prisma | ✅ 2 users trouvés |
| API Vercel répond | ✅ 401 (auth required = Clerk fonctionne) |

---

## ❌ PROBLÈME IDENTIFIÉ

### Cause Racine: **Variables d'environnement NON déployées sur Vercel**

Les fichiers `.env*.local` et `.env` sont dans `.gitignore` → Ils ne sont **JAMAIS** envoyés à Vercel.

**Fichiers locaux ignorés:**
```
.env*.local  ← .env.production.local IGNORÉ
.env         ← IGNORÉ
```

**Conséquence sur Vercel:**
- `DATABASE_URL` = **undefined** ou mal configuré
- `DIRECT_URL` = **undefined**
- Prisma ne peut pas se connecter → Dashboard affiche l'erreur

### Preuve
Le fichier `.env.production` local ne contient **PAS** `DATABASE_URL`:
```bash
grep DATABASE_URL .env.production
# Résultat: RIEN
```

---

## 🔧 SOLUTIONS

### Solution A: Via Dashboard Vercel (RECOMMANDÉ)

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet **startup**
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter ces 2 variables pour **Production** + **Preview** + **Development**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres` |

5. **Redeploy** le projet

### Solution B: Via Vercel CLI

```bash
cd /root/.openclaw/workspace/startup

# Ajouter DATABASE_URL
vercel env add DATABASE_URL production
# Coller: postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true

# Ajouter DIRECT_URL  
vercel env add DIRECT_URL production
# Coller: postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres

# Redeploy
vercel --prod
```

---

## 📋 VÉRIFICATION APRÈS FIX

J'ai créé un endpoint de diagnostic: `/api/health`

Après le redéploiement, tester:
```bash
curl https://startup-azure-nine.vercel.app/api/health
```

**Réponse attendue (si OK):**
```json
{
  "status": "healthy",
  "env": {
    "DATABASE_URL": "SET (hidden)",
    "DIRECT_URL": "SET (hidden)"
  },
  "database": "connected",
  "userCount": 2
}
```

---

## 🎯 COMMANDES EXACTES À EXÉCUTER

```bash
# 1. Login Vercel (si pas déjà fait)
cd /root/.openclaw/workspace/startup
vercel login

# 2. Lier le projet (si pas déjà fait)
vercel link

# 3. Ajouter les variables d'environnement
vercel env add DATABASE_URL production << 'EOF'
postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true
EOF

vercel env add DIRECT_URL production << 'EOF'
postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres
EOF

# 4. Redéployer
vercel --prod

# 5. Vérifier
curl https://startup-azure-nine.vercel.app/api/health
```

---

## ⚠️ NOTES IMPORTANTES

1. **Les fichiers .env locaux ne sont PAS déployés** - C'est voulu pour la sécurité
2. **Vercel utilise ses propres Environment Variables** - Configurées via dashboard ou CLI
3. **DIRECT_URL est requis** par le schema Prisma (`directUrl = env("DIRECT_URL")`)
4. **pgbouncer=true** est nécessaire sur le port 6543 pour Supabase

---

## 📊 RÉSUMÉ

| Élément | Status |
|---------|--------|
| Base de données | ✅ Fonctionne |
| Schema Prisma | ✅ Correct |
| Code application | ✅ Correct |
| Migrations | ✅ Appliquées |
| **Variables Vercel** | ❌ **MANQUANTES** |

**La solution est de configurer DATABASE_URL et DIRECT_URL dans Vercel Environment Variables, puis redéployer.**
