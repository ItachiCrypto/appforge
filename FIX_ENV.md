# FIX ENV VARS - Vercel Production

**Date:** 2025-07-01
**Status:** ✅ CORRIGÉ

## Problème initial
- L'app fonctionnait en local mais pas sur Vercel (TypeError, pages noires)
- Suspicion de caractères parasites (`\n`) dans les variables d'environnement

## Actions effectuées

### 1. Suppression des anciennes variables
Variables supprimées de production:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `DATABASE_URL`

### 2. Recréation propre avec `printf`
Méthode utilisée (évite les `\n` parasites):
```bash
printf 'valeur' | vercel env add NOM_VAR production
```

Variables recréées:
| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_ZnVubnktYW50ZWF0ZXItOTUuY2xlcmsuYWNjb3VudHMuZGV2JA` |
| `CLERK_SECRET_KEY` | `sk_test_hXdPpfcQOKKNNVHrfxUS6RYSqMSDIDJti8FqnV4v6V` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` |
| `DATABASE_URL` | `postgresql://postgres:***@db.qhryajgvznisorlyewtm.supabase.co:5432/postgres` |

### 3. Vérification
`vercel env pull` confirme que toutes les valeurs sont propres (pas de `\n` ou caractères parasites).

## Prochaine étape
Redéployer l'application sur Vercel pour appliquer les nouvelles variables:
```bash
vercel --prod
```

---
*Fix appliqué par subagent DevOps*
