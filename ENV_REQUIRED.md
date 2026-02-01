# ENV_REQUIRED.md - Variables d'Environnement Requises

## Variables Obligatoires

### Base de données
| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL (Supabase) | `postgresql://user:pass@host:5432/db` |
| `DIRECT_URL` | URL directe pour Prisma migrations | Même format |

### Authentification (Clerk)
| Variable | Description |
|----------|-------------|
| `CLERK_SECRET_KEY` | Clé secrète Clerk (commence par `sk_`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk (commence par `pk_`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | URL de connexion (ex: `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | URL d'inscription (ex: `/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirection après connexion (ex: `/dashboard`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirection après inscription (ex: `/dashboard`) |

### Application
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL de l'application |

---

## Variables Optionnelles (mais importantes)

### IA / OpenAI
| Variable | Description | Notes |
|----------|-------------|-------|
| `OPENAI_API_KEY` | Clé API OpenAI | **Optionnelle si BYOK activé** |

**Modèle BYOK (Bring Your Own Key):**
- Si `OPENAI_API_KEY` n'est pas définie, les utilisateurs doivent fournir leur propre clé dans Settings
- La clé utilisateur est stockée en DB (`user.openaiKey`)
- Priorité: `user.openaiKey` > `process.env.OPENAI_API_KEY`

---

## Comment Ajouter les Variables

### Développement Local

1. Créer/modifier `.env.local` à la racine:
```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
```

2. Redémarrer le serveur dev

### Production (Vercel)

```bash
# Ajouter une variable
vercel env add OPENAI_API_KEY

# Lister les variables
vercel env ls

# Supprimer une variable
vercel env rm OPENAI_API_KEY
```

Après modification, redéployer:
```bash
vercel --prod
```

### Via Dashboard Vercel

1. Aller sur https://vercel.com/[team]/[project]/settings/environment-variables
2. Ajouter la variable
3. Sélectionner les environnements (Production, Preview, Development)
4. Redéployer

---

## Obtenir une Clé OpenAI

1. Créer un compte sur https://platform.openai.com
2. Aller dans API Keys: https://platform.openai.com/api-keys
3. Créer une nouvelle clé
4. **Important:** La clé commence par `sk-`

---

## Sécurité

⚠️ **Ne jamais committer les clés dans le code!**

- `.env.local` est dans `.gitignore`
- Utiliser Vercel pour les variables de production
- Les clés BYOK des utilisateurs sont chiffrées en DB
