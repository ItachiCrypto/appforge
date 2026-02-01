# 🚨 Solution: PostgreSQL gratuit pour Vercel (problème IPv6)

## Le Problème

Vercel serverless ne supporte que **IPv4**, mais:
- La connexion directe Supabase utilise **IPv6** par défaut
- L'add-on IPv4 Supabase est payant ($4/mois)

## 🎯 SOLUTION RAPIDE: Utiliser Supavisor (GRATUIT!)

**AVANT de migrer, essaye ceci!** Supabase offre un pooler (Supavisor) qui utilise **toujours IPv4**:

```
# ❌ Connexion directe (IPv6) - NE FONCTIONNE PAS sur Vercel
postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres

# ✅ Supavisor Transaction Mode (IPv4) - FONCTIONNE!
postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# ✅ Supavisor Session Mode (IPv4) - FONCTIONNE!
postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Configuration Prisma avec Supavisor:

```prisma
// schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // Pooler URL
  directUrl = env("DIRECT_DATABASE_URL") // Pour migrations locales
}
```

```env
# .env (production - Vercel)
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# .env.local (développement - si IPv6 supporté localement)
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres"
```

**Si ça marche → problème résolu sans migration!**

---

## Alternatives si migration nécessaire

### 1. 🏆 **NEON** - MEILLEURE OPTION

| Critère | Détails |
|---------|---------|
| **Prix** | GRATUIT |
| **Storage** | 0.5 GB/projet |
| **Compute** | 100 CU-hours/mois (≈400h à 0.25 CU) |
| **Projets** | 100 projets gratuits |
| **IPv4** | ✅ Oui, natif |
| **Prisma** | ✅ Adapter officiel `@prisma/adapter-neon` |
| **Vercel** | ✅ Intégration native dans Vercel Marketplace |
| **PostgreSQL** | ✅ 100% compatible |

**Pourquoi Neon gagne:**
- **Serverless natif** - scale to zero automatique
- **Intégration Vercel** - un clic dans le dashboard Vercel
- **Branching** - branches de dev/preview automatiques
- **PostgreSQL pur** - pas de migration de schéma
- **Suffisant pour MVP** - 0.5GB = ~500k lignes typiques

**Limites Free Tier:**
- 0.5 GB storage (augmentable sur plan payant)
- 5 GB egress/mois
- Scale to zero après 5 min inactivité
- Cold start ~500ms-2s

---

### 2. **CockroachDB Serverless**

| Critère | Détails |
|---------|---------|
| **Prix** | GRATUIT |
| **Storage** | 10 GB gratuit |
| **Compute** | 50M Request Units/mois |
| **IPv4** | ✅ Oui |
| **Prisma** | ✅ Compatible (avec quelques différences) |
| **PostgreSQL** | ⚠️ Compatible PostgreSQL mais PAS PostgreSQL |

**Avantages:**
- Plus de storage gratuit (10GB vs 0.5GB)
- Distribué et résilient
- 99.99% SLA

**Inconvénients:**
- Pas du vrai PostgreSQL (différences subtiles)
- Certaines fonctions PostgreSQL non supportées
- Migrations peuvent nécessiter ajustements

---

### 3. **Railway** ❌ PAS VRAIMENT GRATUIT

| Critère | Détails |
|---------|---------|
| **Prix** | 30 jours d'essai avec $5 crédits, puis $5/mois minimum |
| **Après essai** | Plan gratuit très limité (0.5GB RAM, 1 service) |

**Verdict:** Pas adapté pour un MVP gratuit long terme.

---

### 4. **Render PostgreSQL** ❌ EXPIRE APRÈS 30 JOURS

| Critère | Détails |
|---------|---------|
| **Prix** | GRATUIT mais... |
| **Expiration** | ⚠️ **SUPPRIMÉ après 30 jours!** |
| **Storage** | 1 GB |

**Verdict:** Inutilisable pour production. Juste pour tests.

---

### 5. **ElephantSQL** ❌ FERMÉ

Service **discontinué** en 2024. Ne plus utiliser.

---

### 6. **Xata** ⚠️ PAS DE FREE TIER

- Trial 14 jours avec $100 crédits
- Ensuite payant ($0.012/hr minimum = ~$9/mois)

---

## 📊 Tableau Comparatif Final

| Service | Gratuit | Storage | IPv4 | PostgreSQL | Vercel | Recommandation |
|---------|---------|---------|------|------------|--------|----------------|
| **Supavisor** | ✅ | Existant | ✅ | ✅ | ✅ | **Essayer d'abord!** |
| **Neon** | ✅ | 0.5GB | ✅ | ✅ | ✅ | **#1 Alternative** |
| **CockroachDB** | ✅ | 10GB | ✅ | ⚠️ | ✅ | Si besoin + storage |
| Railway | ❌ | - | ✅ | ✅ | ✅ | Pas gratuit |
| Render | ❌ | 1GB | ✅ | ✅ | ✅ | Expire 30j |
| ElephantSQL | ❌ | - | - | - | - | Fermé |

---

## 🚀 PLAN D'ACTION RECOMMANDÉ

### Option A: Rester sur Supabase (le plus simple)

1. **Récupérer l'URL Supavisor** dans le dashboard Supabase:
   - Settings → Database → Connection String → "Connection Pooling"
   - Copier l'URL avec port `6543` (transaction mode)

2. **Mettre à jour `.env` sur Vercel:**
   ```
   DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

3. **Vérifier le schema Prisma:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Redéployer** sur Vercel

---

### Option B: Migrer vers Neon

#### Étape 1: Créer un compte Neon
```bash
# Via Vercel (recommandé):
# Dashboard Vercel → Storage → Create Database → Neon

# Ou directement sur neon.tech
```

#### Étape 2: Exporter les données Supabase
```bash
# Dans le terminal Supabase ou localement
pg_dump -h db.xxxx.supabase.co -U postgres -d postgres -F c -f backup.dump
```

#### Étape 3: Importer dans Neon
```bash
pg_restore -h ep-xxxx.us-east-2.aws.neon.tech -U neondb_owner -d neondb backup.dump
```

#### Étape 4: Mettre à jour Prisma
```bash
npm install @prisma/adapter-neon
```

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })
```

#### Étape 5: Mettre à jour les variables d'environnement
```env
# Neon pooled connection (pour Prisma Client)
DATABASE_URL="postgresql://neondb_owner:xxx@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Neon direct connection (pour migrations)
DIRECT_URL="postgresql://neondb_owner:xxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

#### Étape 6: Tester et déployer
```bash
npx prisma db push  # Vérifier le schéma
npm run build       # Test local
# Puis déployer sur Vercel
```

---

## ✅ RECOMMANDATION FINALE

1. **Essaie d'abord Supavisor** (5 minutes) - Peut résoudre le problème sans rien changer

2. **Si ça ne marche pas → Neon** (30 minutes de migration):
   - Gratuit
   - PostgreSQL pur (pas de changement de schéma)
   - Intégration Vercel native
   - Suffisant pour MVP

3. **CockroachDB** seulement si tu as besoin de >0.5GB de données gratuites

---

*Document créé le 2026-02-01 - Basé sur les tarifs actuels des providers*
