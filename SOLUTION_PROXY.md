# Solutions Proxy IPv4 pour Vercel → Supabase

## 🎯 Problème

Vercel ne supporte **pas IPv6**. Par défaut, la connexion directe Supabase utilise IPv6.  
**Résultat**: Erreur de connexion depuis les fonctions serverless Vercel.

---

## ✅ SOLUTION RECOMMANDÉE: Supavisor (Gratuit, déjà inclus!)

### 🏆 Bonne nouvelle: Supabase a DÉJÀ la solution!

Supabase inclut **Supavisor**, un pooler de connexions qui supporte **IPv4 nativement** - et c'est **GRATUIT** sur tous les plans, y compris le Free tier!

### Configuration

Au lieu d'utiliser la connexion directe:
```
# ❌ NE PAS UTILISER - IPv6 uniquement
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

Utiliser le **pooler Supavisor en mode transaction** (port 6543):
```
# ✅ UTILISER CECI - IPv4 supporté
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Ou le **pooler en mode session** (port 5432):
```
# ✅ UTILISER CECI - IPv4 supporté
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Où trouver les strings de connexion

Dashboard Supabase → **Connect** (bouton en haut) → Sélectionner "Transaction" ou "Session"

### Mode Transaction vs Session

| Mode | Port | Cas d'usage |
|------|------|-------------|
| **Transaction** | 6543 | Serverless/Edge functions (Vercel) ✅ |
| **Session** | 5432 | Applications persistantes |

**Pour Vercel, utiliser le mode Transaction (6543).**

### Mise à jour dans Vercel

1. Aller dans les settings du projet Vercel
2. Variables d'environnement
3. Mettre à jour `DATABASE_URL` avec le string pooler
4. Redéployer

---

## 📊 Autres Solutions Explorées

### 1. Cloudflare Hyperdrive ⭐⭐⭐⭐

**Viabilité: EXCELLENTE**

| Critère | Détail |
|---------|--------|
| **Prix** | GRATUIT (100K requêtes/jour) |
| **IPv4** | ✅ Supporte IPv4 et IPv6 |
| **Setup** | Moyen (nécessite migration vers Cloudflare Workers) |

**Avantages:**
- Connection pooling intégré
- Cache de requêtes
- Latence réduite globalement

**Inconvénients:**
- Nécessite d'être sur Cloudflare Workers (pas Vercel)
- Limite de 100K requêtes/jour en gratuit

**Conclusion:** Excellente option si tu migres de Vercel vers Cloudflare.

---

### 2. Prisma Accelerate ⭐⭐⭐

**Viabilité: BONNE**

| Critère | Détail |
|---------|--------|
| **Prix** | GRATUIT (100K opérations/mois) |
| **IPv4** | ✅ Supporte IPv4 |
| **Setup** | Facile si tu utilises déjà Prisma |

**Comment ça marche:**
1. Créer un compte Prisma Data Platform
2. Connecter ta DB Supabase
3. Obtenir un nouveau connection string Prisma
4. Utiliser ce string dans ton app

**Limites gratuites:**
- 100,000 opérations/mois
- Alertes avant dépassement
- Peut définir des spending limits

**Code:**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Prisma Accelerate URL
}
```

**Conclusion:** Bonne option si tu utilises Prisma ORM et as <100K queries/mois.

---

### 3. Fly.io Proxy ⭐⭐

**Viabilité: POSSIBLE MAIS COMPLEXE**

| Critère | Détail |
|---------|--------|
| **Prix** | ~$2/mois minimum (shared-cpu-1x, 256MB) |
| **IPv4** | ✅ Allocation IPv4 possible |
| **Setup** | Complexe |

**Comment:**
1. Déployer un container avec PgBouncer ou HAProxy sur Fly.io
2. Configurer comme proxy vers Supabase
3. Allouer une IPv4 ($2/mois supplémentaire pour IPv4 dédiée)

**Coût estimé:**
- Machine: ~$2/mois
- IPv4 dédiée: variable

**Conclusion:** Trop complexe quand Supavisor est gratuit et intégré.

---

### 4. Oracle Cloud Free Tier + PgBouncer ⭐⭐

**Viabilité: POSSIBLE MAIS OVERKILL**

| Critère | Détail |
|---------|--------|
| **Prix** | GRATUIT (Always Free ARM instances) |
| **IPv4** | ✅ IPv4 inclus |
| **Setup** | Très complexe |

**Ressources Always Free:**
- 2 VMs ARM Ampere A1 (4 OCPUs, 24GB RAM total)
- 200GB storage
- IP publique

**Setup requis:**
1. Créer compte Oracle Cloud
2. Provisionner une VM ARM
3. Installer PgBouncer
4. Configurer comme proxy vers Supabase
5. Gérer la maintenance/sécurité

**Conclusion:** Overkill pour un simple proxy. Complexité inutile.

---

### 5. Upstash ⭐

**Viabilité: NON APPLICABLE**

Upstash propose Redis serverless, pas PostgreSQL. Ils n'ont pas de solution de proxy PostgreSQL.

---

### 6. Cloudflare Workers comme Proxy REST ⭐⭐

**Viabilité: PARTIELLE**

On pourrait créer un Worker qui fait proxy vers l'API REST de Supabase (pas la connexion directe):

```javascript
// worker.js
export default {
  async fetch(request, env) {
    // Proxy vers Supabase REST API
    const supabaseUrl = 'https://xxx.supabase.co/rest/v1/'
    // ...
  }
}
```

**Mais:** Supabase a déjà une API REST. Pas besoin d'intermédiaire.

---

## 🎯 Recommandation Finale

### Ordre de priorité:

1. **🥇 Supavisor (mode transaction)** - GRATUIT, zéro config, déjà inclus
2. **🥈 Prisma Accelerate** - Si tu utilises Prisma et veux du caching
3. **🥉 Cloudflare Hyperdrive** - Si tu migres vers Cloudflare Workers

### Action immédiate:

```bash
# 1. Récupérer le connection string pooler depuis Supabase Dashboard
#    Dashboard → Connect → Transaction mode

# 2. Mettre à jour dans Vercel
#    Settings → Environment Variables → DATABASE_URL

# 3. Redéployer
vercel --prod
```

### Si tu utilises Prisma:

```typescript
// Ajouter dans schema.prisma pour le pooler
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Pour les migrations
}
```

Variables:
- `DATABASE_URL`: Le string pooler (port 6543)
- `DIRECT_URL`: Le string direct (pour `prisma migrate` en local)

---

## 📝 Notes Techniques

### Pourquoi Supavisor fonctionne avec Vercel?

Le pooler Supavisor est hébergé sur des serveurs séparés (`pooler.supabase.com`) qui ont des adresses IPv4. Vercel se connecte au pooler, le pooler se connecte à ta DB.

```
Vercel (IPv4) → Supavisor (IPv4/IPv6) → Supabase DB (IPv6)
```

### Limites du pooler gratuit

- **Shared pooler**: Mutualisé entre projets
- **Dedicated pooler**: Disponible sur plans payants (meilleure perf)

Pour un MVP/startup early-stage, le shared pooler est largement suffisant.

---

*Dernière mise à jour: 2025-02-01*
