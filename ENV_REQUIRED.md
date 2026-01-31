# 🔐 Variables d'Environnement Requises

Toutes ces variables doivent être configurées sur **Vercel Dashboard** :
https://vercel.com/itachicryptos-projects/startup/settings/environment-variables

---

## 🔴 CRITIQUES (App ne fonctionne pas sans)

### Base de données
```
DATABASE_URL=postgresql://user:password@host:6543/database?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/database
```

**Note Supabase:** 
- `DATABASE_URL` → Port `6543` (pooler/transaction mode)
- `DIRECT_URL` → Port `5432` (connexion directe)

### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### OpenAI (pour la génération de code IA)
```
OPENAI_API_KEY=sk-xxxxx
```

---

## 🟡 OPTIONNELLES (certaines features)

### Stripe (paiements)
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Clerk Webhooks
```
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

### App URLs
```
NEXT_PUBLIC_APP_URL=https://startup-azure-nine.vercel.app
```

---

## 📋 Checklist Vercel

Sur le dashboard Vercel, vérifier que ces variables existent :

- [ ] `DATABASE_URL` ← **CRITIQUE** (avec `?pgbouncer=true` si Supabase)
- [ ] `DIRECT_URL` ← Pour les migrations Prisma
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ← **CRITIQUE**
- [ ] `CLERK_SECRET_KEY` ← **CRITIQUE**
- [ ] `OPENAI_API_KEY` ← **CRITIQUE** (sinon l'IA ne génère pas de code)
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`

---

## 🚨 Erreurs courantes

### "Application error: server-side exception"
→ `DATABASE_URL` manquante ou mauvais format

### "OpenAI API key is required"
→ `OPENAI_API_KEY` manquante

### "Unauthorized" sur /dashboard
→ `CLERK_SECRET_KEY` manquante

### Redirections vers /login au lieu de /sign-in
→ `NEXT_PUBLIC_CLERK_SIGN_IN_URL` mal configurée

---

*Généré par l'équipe AppForge*
