# 🔧 HUMAN_REQUIRED.md - Configuration Manuelle

Ce document liste tout ce que vous devez configurer pour faire fonctionner AppForge.

---

## 📋 Checklist Rapide

- [ ] Créer une base de données PostgreSQL
- [ ] Configurer Clerk (Auth)
- [ ] Configurer Stripe (Payments)
- [ ] Configurer OpenAI (AI)
- [ ] (Optionnel) Configurer Vercel pour le déploiement automatique

---

## 1. 🗄️ Base de Données (PostgreSQL)

### Option A: Neon (Recommandé - Gratuit)
1. Créez un compte sur [neon.tech](https://neon.tech)
2. Créez un nouveau projet
3. Copiez l'URL de connexion

### Option B: Supabase
1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans Settings > Database > Connection string

### Configuration
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

Puis exécutez:
```bash
npx prisma db push
```

---

## 2. 🔐 Clerk (Authentification)

1. Créez un compte sur [clerk.com](https://clerk.com)
2. Créez une nouvelle application
3. Allez dans "API Keys"

### Configuration
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Webhook (Important!)
1. Dans Clerk Dashboard → Webhooks
2. Ajoutez un endpoint: `https://votre-domaine.com/api/webhooks/clerk`
3. Sélectionnez les événements: `user.created`, `user.updated`, `user.deleted`
4. Copiez le webhook secret

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 3. 💳 Stripe (Paiements)

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Allez dans Developers → API Keys

### Configuration de base
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Créer les produits/prix
1. Dashboard Stripe → Products → Add Product
2. Créez 3 produits:
   - **Starter** - $19/mois (récurrent)
   - **Pro** - $49/mois (récurrent)
   - **Team** - $99/mois (récurrent)
3. Pour chaque produit, copiez le Price ID (commence par `price_`)

```env
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_TEAM_PRICE_ID=price_xxxxx
```

### Webhook Stripe
1. Developers → Webhooks → Add endpoint
2. URL: `https://votre-domaine.com/api/webhooks/stripe`
3. Événements à sélectionner:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiez le webhook secret

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 4. 🤖 OpenAI (IA)

1. Créez un compte sur [platform.openai.com](https://platform.openai.com)
2. Allez dans API Keys → Create new secret key

```env
OPENAI_API_KEY=sk-xxxxx
```

**Note**: Cette clé est utilisée par défaut. Les utilisateurs peuvent configurer leur propre clé via BYOK.

---

## 5. 🚀 Vercel (Déploiement - Optionnel)

Pour le déploiement automatique des apps utilisateurs:

1. Créez un compte sur [vercel.com](https://vercel.com)
2. Settings → Tokens → Create

```env
VERCEL_TOKEN=xxxxx
VERCEL_TEAM_ID=team_xxxxx  # Si vous avez une équipe
```

---

## 6. 🔒 Clé de Chiffrement (Sécurité)

Pour chiffrer les clés API BYOK des utilisateurs:

```bash
# Générer une clé aléatoire de 32 bytes en hex
openssl rand -hex 32
```

```env
ENCRYPTION_KEY=votre-cle-hex-de-64-caracteres
```

---

## 7. 📍 URL de l'Application

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Dev
# ou
NEXT_PUBLIC_APP_URL=https://votre-domaine.com  # Prod
```

---

## 📝 Fichier .env.local Complet

Créez un fichier `.env.local` à la racine du projet:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_TEAM_PRICE_ID=price_xxxxx

# Vercel (optionnel)
VERCEL_TOKEN=xxxxx
VERCEL_TEAM_ID=team_xxxxx

# Security
ENCRYPTION_KEY=votre-cle-hex

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Démarrage

Une fois tout configuré:

```bash
# Installer les dépendances
npm install

# Configurer la base de données
npx prisma generate
npx prisma db push

# Lancer en dev
npm run dev

# Build pour production
npm run build
npm start
```

---

## ⚠️ Notes Importantes

### En développement
- Utilisez les clés **test** de Stripe (`sk_test_`, `pk_test_`)
- Les webhooks locaux nécessitent [Stripe CLI](https://stripe.com/docs/stripe-cli) ou ngrok

### En production
- Passez aux clés **live** de Stripe
- Assurez-vous que tous les webhooks pointent vers votre domaine
- Activez HTTPS
- Vérifiez que `ENCRYPTION_KEY` est bien configuré

### BYOK Security
Le code actuel stocke les clés en clair dans la base de données.
Pour la production, implémentez le chiffrement AES-256-GCM avec la `ENCRYPTION_KEY`.

---

## ✅ Checklist Pré-Launch

- [ ] Toutes les variables d'environnement configurées
- [ ] Base de données migrée (`npx prisma db push`)
- [ ] Webhooks Clerk et Stripe configurés
- [ ] Auth flow testé (signup, signin, signout)
- [ ] Flow de création d'app testé
- [ ] Preview Sandpack fonctionnel
- [ ] Paiements Stripe testés
- [ ] Version mobile responsive testée

---

## 🆘 Besoin d'aide?

- [Documentation Clerk](https://clerk.com/docs)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation OpenAI](https://platform.openai.com/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Next.js](https://nextjs.org/docs)

---

**Temps estimé**: ~30 minutes pour tout configurer et déployer.

Bonne chance! 🚀
