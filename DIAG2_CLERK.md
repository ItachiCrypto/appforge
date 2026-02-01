# 🔍 DIAGNOSTIC CLERK/AUTH - AppForge

**Date:** 2026-01-31  
**Problème:** "Unable to load dashboard - There was an error connecting to the database"

---

## ✅ CE QUI FONCTIONNE

### 1. Base de données Supabase
```sql
-- Connexion OK sur port 5432 (direct) et 6543 (pgbouncer)
SELECT * FROM "User";
```
**Résultat:** 2 utilisateurs existent:
| ID | clerkId | email | name |
|---|---|---|---|
| cml2g3pkl0000gt1pvh7dx4b5 | user_391maTAs1axyEB1WmS8dPdqtnyM | alexandrevalette98@gmail.com | Alex VALETTE |
| cml2ocwqf0000st9h3ipophop | user_392DqRNLFV9NH2yBCcwsufmpldw | (vide) | (vide) |

**→ L'utilisateur Alex EXISTE dans la DB!** Le webhook a fonctionné.

### 2. Configuration Prisma
- `schema.prisma` correctement configuré avec `directUrl` pour migrations
- Singleton pattern pour serverless ✅

### 3. Code auth.ts
- Fallback de création user si non trouvé ✅
- Récupère le clerkId et cherche dans la DB ✅

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### PROBLÈME #1: DATABASE_URL manquante en Dev/Preview
```bash
$ vercel env ls
DATABASE_URL    Encrypted    Production    ← SEULEMENT Production!
DIRECT_URL      Encrypted    Production    ← SEULEMENT Production!
```

**❌ DATABASE_URL n'existe PAS pour Development et Preview!**

Si vous testez sur une URL preview (`startup-xxx-itachicryptos.vercel.app`), la DB ne sera pas accessible.

**FIX:**
```bash
vercel env add DATABASE_URL development
vercel env add DATABASE_URL preview
vercel env add DIRECT_URL development
vercel env add DIRECT_URL preview
```
Valeur:
```
postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true
```

---

### PROBLÈME #2: Clé Clerk de TEST en Production
```env
CLERK_SECRET_KEY="sk_test_hXdPpfcQOKKNNVHrfxUS6RYSqMSDIDJti8FqnV4v6V"
```

**❌ `sk_test_` = Environnement de développement Clerk!**

En production, vous devez utiliser `sk_live_...` avec les vraies clés.

**FIX:**
1. Aller sur https://dashboard.clerk.com
2. Passer en mode **Production** (pas Development)
3. Récupérer `CLERK_SECRET_KEY` = `sk_live_...`
4. Récupérer `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
5. Mettre à jour sur Vercel:
```bash
vercel env rm CLERK_SECRET_KEY production
vercel env add CLERK_SECRET_KEY production  # avec sk_live_...
```

---

### PROBLÈME #3: User #2 sans email
```sql
cml2ocwqf0000st9h3ipophop | user_392DqRNLFV9NH2yBCcwsufmpldw | "" | ""
```

Un utilisateur a été créé avec un email vide → Problème dans le webhook ou fallback.

Le code `dashboard/page.tsx` crée un user avec `email: ''` si le fallback est appelé:
```typescript
user = await prisma.user.create({
  data: {
    clerkId: userId,
    email: '',  // ← PROBLÈME! Email vide
  },
})
```

**FIX dans `(dashboard)/dashboard/page.tsx`:**
```typescript
if (!user) {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect('/sign-in')
  }
  user = await prisma.user.create({
    data: {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null,
      imageUrl: clerkUser.imageUrl,
    },
  })
}
```

---

### PROBLÈME #4: Webhook Clerk - Configuration Dashboard

Vérifiez que le webhook est configuré sur Clerk Dashboard:
1. https://dashboard.clerk.com → Webhooks
2. Endpoint: `https://votre-app.vercel.app/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. `CLERK_WEBHOOK_SECRET` doit être dans Vercel env

**⚠️ Je ne vois PAS `CLERK_WEBHOOK_SECRET` dans `vercel env ls`!**

```bash
vercel env add CLERK_WEBHOOK_SECRET production
# Valeur: whsec_... depuis Clerk Dashboard
```

---

## 🔧 CHECKLIST DE RÉSOLUTION

### Immédiat (Production)
- [ ] Ajouter `DATABASE_URL` pour tous les environnements Vercel
- [ ] Ajouter `DIRECT_URL` pour tous les environnements Vercel
- [ ] Configurer `CLERK_WEBHOOK_SECRET` sur Vercel
- [ ] Vérifier que le webhook Clerk pointe vers la bonne URL

### Si passage en production réel
- [ ] Remplacer `sk_test_` par `sk_live_` 
- [ ] Remplacer `pk_test_` par `pk_live_`
- [ ] Créer l'app Clerk en mode Production

### Code fix
- [ ] Améliorer le fallback dans dashboard/page.tsx pour récupérer l'email

---

## 📊 COMMANDES DE DIAGNOSTIC

```bash
# Vérifier les users en DB
PGPASSWORD='PwGqfoe3lAjavmHt' psql -h db.qhryajgvznisorlyewtm.supabase.co -U postgres -d postgres -c 'SELECT id, "clerkId", email, name FROM "User";'

# Vérifier la connexion pgbouncer
PGPASSWORD='PwGqfoe3lAjavmHt' psql -h db.qhryajgvznisorlyewtm.supabase.co -U postgres -d postgres -p 6543 -c "SELECT 1"

# Lister les env Vercel
vercel env ls
```

---

## 🎯 CAUSE PROBABLE PRINCIPALE

**Le problème est très probablement que `DATABASE_URL` n'est pas disponible dans l'environnement où l'app tourne.**

1. Si vous testez sur une URL de preview → DATABASE_URL manquante
2. Si vous testez en local sans `.env.local` configuré → DATABASE_URL manquante
3. Sur production → devrait fonctionner

**Test immédiat:** Allez sur l'URL de PRODUCTION exacte et testez. Si ça marche là mais pas ailleurs, c'est confirmé.

---

## 🚀 ACTION IMMÉDIATE

```bash
# Ajouter DATABASE_URL à tous les environnements
cd /root/.openclaw/workspace/startup

vercel env add DATABASE_URL development
# Entrer: postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true

vercel env add DATABASE_URL preview
# Entrer: postgresql://postgres:PwGqfoe3lAjavmHt@db.qhryajgvznisorlyewtm.supabase.co:6543/postgres?pgbouncer=true

# Redéployer
vercel --prod
```
