# 🐛 QA User Findings - AppForge

**Date:** 2026-02-04  
**Status:** 🔴 BUGS CRITIQUES TROUVÉS

---

## 🚨 P0 - Bloquant

### BUG-001: API IA ne fonctionne pas
**Symptôme:**
```
⚠️ OpenAI API error: Connection error.
```

**Impact:** 100% des utilisateurs - La génération IA est impossible

**Cause racine:** Les clés API (OPENAI_API_KEY / ANTHROPIC_API_KEY) ne sont PAS configurées sur Vercel en production.

**Note:** Les fichiers `.env.prod` locaux contiennent les clés mais :
1. Ils ont un `\n` à la fin qui corrompt les clés
2. Vercel ne lit pas les fichiers `.env` locaux - il faut les configurer dans le Dashboard

**Fix requis (ACTION HUMAINE):**
1. Aller sur Vercel Dashboard → Project "startup"
2. Settings → Environment Variables
3. Ajouter pour **Production** :
   - `OPENAI_API_KEY` = `sk-proj-...` (SANS le `\n` à la fin!)
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (SANS le `\n` à la fin!)
4. **Redéployer** le projet

---

## 🟡 P1 - Majeur

### BUG-002: Message d'erreur pas clair
**Symptôme:** "OpenAI API error: Connection error" ne dit pas au user quoi faire

**Fix:** ✅ CORRIGÉ - Meilleur message d'erreur ajouté dans le code

---

## ✅ P2 - Mineur

### BUG-003: Copyright daté
**Localisation:** Footer
**Détail:** "© 2024 AppForge" → Devrait être dynamique

---

## 📊 Résumé Tests QA

| Fonctionnalité | Status |
|----------------|--------|
| Landing Page | ✅ OK |
| Auth/Clerk | ✅ OK |
| Dashboard | ✅ OK |
| Création App (wizard) | ✅ OK |
| Mode Normal (UI) | ✅ OK |
| Mode Expert (UI) | ✅ OK |
| **Génération IA** | ❌ BLOQUÉ |
| Preview | ⚠️ Non testé (dépend IA) |
| Déploiement | ⚠️ Non testé |

---

## 🔧 Fixes Appliqués

- [ ] **BUG-001**: ⏳ En attente action humaine (Vercel Dashboard)
- [x] **BUG-002**: ✅ Meilleur message d'erreur

---

*Dernière mise à jour: 2026-02-04 12:55 CET*
