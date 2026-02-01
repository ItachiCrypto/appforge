# 🔴 DIAGNOSTIC RUNTIME - ERREUR EXACTE TROUVÉE

## ❌ L'ERREUR EXACTE

```
PrismaClientInitializationError: 
Can't reach database server at `db.qhryajgvznisorlyewtm.supabase.co:6543`
Please make sure your database server is running at `db.qhryajgvznisorlyewtm.supabase.co:6543`.
```

## 📊 Résultat du Diagnostic API `/api/debug`

```json
{
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL_SET": true,
    "DIRECT_URL_SET": true,
    "DATABASE_URL_START": "postgresql://postgres:PwGqfoe3...",
    "DIRECT_URL_START": "postgresql://postgres:PwGqfoe3..."
  },
  "prisma": {
    "status": "error",
    "clientLoaded": true,
    "error": {
      "name": "PrismaClientInitializationError",
      "message": "Can't reach database server at db.qhryajgvznisorlyewtm.supabase.co:6543"
    }
  }
}
```

## 🔍 ANALYSE DU PROBLÈME - CAUSE RACINE IDENTIFIÉE

### 🚨 PROBLÈME: IPv6 UNIQUEMENT - Vercel ne peut pas se connecter!

**Tests effectués:**
- ✅ Connexion directe depuis notre serveur → **FONCTIONNE**
- ✅ Port 5432 (direct) → **ACCESSIBLE**
- ✅ Port 6543 (pooler) → **ACCESSIBLE**
- ✅ Authentification → **VALIDE** (testé avec psql)

**MAIS:**
```bash
$ dig db.qhryajgvznisorlyewtm.supabase.co A +short
# AUCUN RÉSULTAT - Pas d'IPv4!

$ dig db.qhryajgvznisorlyewtm.supabase.co AAAA +short
2a05:d018:135e:1695:2b51:7db9:7ef6:6844  # IPv6 UNIQUEMENT
```

**Le hostname `db.PROJECT_REF.supabase.co` n'a QUE des adresses IPv6!**

Les serverless functions de Vercel ont des problèmes de connectivité IPv6 → échec de connexion.

## ✅ SOLUTION - Utiliser le NOUVEAU format de pooler Supabase

Supabase a un nouveau format de pooler avec support IPv4:

### Format ACTUEL (problématique):
```
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:6543/postgres"
```
→ Résout en IPv6 uniquement → **ÉCHOUE sur Vercel**

### Format NOUVEAU (avec IPv4):
```
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```
→ Résout en IPv4 → **FONCTIONNE sur Vercel**

## 🔧 ÉTAPES DE CORRECTION

### 1. Obtenir le nouveau connection string
1. Va sur https://supabase.com/dashboard
2. Ouvre ton projet
3. **Settings → Database → Connection String**
4. Sélectionne **"Supavisor (NEW)"** ou **"Pooler"**
5. Copie la **Transaction pooling** connection string

Le format devrait ressembler à:
```
postgresql://postgres.qhryajgvznisorlyewtm:[PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
```

### 2. Mettre à jour les variables sur Vercel
```bash
# Nouvelle DATABASE_URL avec le nouveau pooler
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# Colle: postgresql://postgres.qhryajgvznisorlyewtm:PwGqfoe3lAjavmHt@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# DIRECT_URL reste pareil (mais sans le \n à la fin!)
vercel env rm DIRECT_URL production
vercel env add DIRECT_URL production
# Colle: postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres
```

### 3. Redéployer
```bash
cd /root/.openclaw/workspace/startup
vercel --prod
```

### 4. Tester
```bash
curl https://startup-azure-nine.vercel.app/api/debug | jq .
```

## 📋 RÉSUMÉ

| Check | Status | Notes |
|-------|--------|-------|
| DATABASE_URL configuré | ✅ | Mais utilise ancien format IPv6 |
| DIRECT_URL configuré | ✅ | A un `\n` à la fin (bug mineur) |
| Prisma Client généré | ✅ | OK |
| Connexion DB locale | ✅ | Fonctionne avec psql |
| Connexion depuis Vercel | ❌ | **IPv6 non supporté** |

## 🎯 CAUSE RACINE

**L'ancien format Supabase `db.PROJECT_REF.supabase.co` ne résout qu'en IPv6.**
**Vercel serverless functions ne peuvent pas se connecter en IPv6.**

**Solution:** Utiliser le nouveau format pooler `aws-0-REGION.pooler.supabase.com` qui a des adresses IPv4.

---

**Prochain fichier:** Une fois les env vars corrigées, supprimer `/api/debug` (contient des infos sensibles).
