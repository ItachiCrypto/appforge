# 🎯 BRAINSTORM PM - AppForge

**Date**: 31 janvier 2025  
**Auteur**: Product Manager Senior  
**Statut**: Analyse complète de l'application

---

## 📋 PARTIE 1: AUDIT RAPIDE

### 1.1 Vue d'ensemble

**AppForge** est un SaaS de type "AI App Builder" qui permet aux utilisateurs de créer des applications React via une interface conversationnelle avec l'IA. L'app génère du code, offre un preview live via Sandpack, et permet le déploiement sur Vercel.

### 1.2 Features actuelles identifiées

| Feature | Statut | Fichier(s) clé(s) |
|---------|--------|-------------------|
| **Landing Page Marketing** | ✅ Complet | `(marketing)/page.tsx` |
| **Auth Clerk (Email/OAuth)** | ✅ Complet | `(auth)/sign-in/`, `sign-up/` |
| **Dashboard utilisateur** | ✅ Complet | `(dashboard)/dashboard/page.tsx` |
| **Création d'app via chat** | ✅ Complet | `(dashboard)/app/new/page.tsx` |
| **Éditeur Chat + Preview** | ✅ Complet | `(dashboard)/app/[id]/page.tsx` |
| **Preview Sandpack** | ✅ Complet | Intégré dans l'éditeur |
| **Templates prédéfinis** | ✅ Basic | 4 templates (landing, dashboard, portfolio, ecommerce) |
| **BYOK (Bring Your Own Key)** | ✅ Complet | `settings/page.tsx`, `/api/user` |
| **Gestion facturation** | ✅ UI Ready | `billing/page.tsx`, Stripe checkout |
| **Deploy (simulé)** | ⚠️ Simulé | `/api/deploy/route.ts` |
| **Plans tarifaires** | ✅ Complet | Free / Starter ($19) / Pro ($49) / Team ($99) |

### 1.3 Architecture technique

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Auth**: Clerk (avec OAuth Google/GitHub)
- **Database**: PostgreSQL via Prisma
- **AI**: OpenAI GPT-4-turbo
- **Preview**: Sandpack (CodeSandbox)
- **Paiements**: Stripe

### 1.4 Modèle de données

```
User → Apps (1:N)
User → Conversations (1:N)
App → Conversation (1:1)
Conversation → Messages (1:N)
App → AppVersions (1:N) [non implémenté côté UI]
```

---

## 🚀 PARTIE 2: BRAINSTORM - FEATURES À AJOUTER

### Feature 1: Historique de Versions avec Rollback
| Attribut | Valeur |
|----------|--------|
| **Priorité** | P1 - Critique |
| **Effort** | M (3-5 jours) |
| **Impact** | 🔺 Rétention |

**Description**: 
Le modèle `AppVersion` existe en DB mais n'est pas exploité. Ajouter:
- Timeline visuelle des versions dans l'éditeur
- Bouton "Rollback" pour restaurer une version précédente
- Diff visuel entre versions (optionnel)

**Pourquoi**: Les utilisateurs vont faire des erreurs ou vouloir revenir en arrière. Sans ça, ils perdent confiance et abandonnent.

---

### Feature 2: Export de Code
| Attribut | Valeur |
|----------|--------|
| **Priorité** | P1 - Critique |
| **Effort** | S (1-2 jours) |
| **Impact** | 🔺 Conversion / Réduction du churn |

**Description**:
- Bouton "Download ZIP" dans l'éditeur
- Exporter le projet React complet (App.js, styles.css, package.json)
- Optionnel: export vers GitHub

**Pourquoi**: C'est une promesse de la landing ("Export Anytime. No lock-in.") mais pas implémenté. Les power users veulent sortir leur code.

---

### Feature 3: Onboarding Interactif (Product Tour)
| Attribut | Valeur |
|----------|--------|
| **Priorité** | P1 - Critique |
| **Effort** | M (2-3 jours) |
| **Impact** | 🔺 Conversion / Activation |

**Description**:
- Tour guidé au premier lancement (tooltips sur Chat, Preview, Deploy)
- "Getting Started" checklist: 1) Créer une app, 2) Modifier via chat, 3) Preview, 4) Deploy
- Badge/confetti au premier deploy réussi

**Pourquoi**: Le flow actuel est self-service mais les nouveaux utilisateurs peuvent être perdus. Un bon onboarding = meilleure activation.

---

### Feature 4: Templates Marketplace
| Attribut | Valeur |
|----------|--------|
| **Priorité** | P2 - Important |
| **Effort** | L (1-2 semaines) |
| **Impact** | 🔺 Acquisition / Conversion |

**Description**:
- Galerie de templates avec preview
- Catégories: SaaS, E-commerce, Portfolio, Blog, etc.
- Templates "Pro" réservés aux plans payants
- Permettre aux utilisateurs de soumettre des templates

**Pourquoi**: Les 4 templates actuels sont limités. Une marketplace riche attire plus d'utilisateurs et crée un effet réseau.

---

### Feature 5: Mode Collaboration (Real-time)
| Attribut | Valeur |
|----------|--------|
| **Priorité** | P2 - Important |
| **Effort** | XL (3-4 semaines) |
| **Impact** | 🔺 Monétisation (plan Team) / Rétention |

**Description**:
- Inviter des collaborateurs sur un projet
- Curseurs en temps réel (style Figma)
- Chat d'équipe intégré
- Gestion des permissions (view/edit/admin)

**Pourquoi**: Le plan Team ($99) promet "Collaboration" et "5 team members" mais ce n'est pas implémenté. C'est un upsell majeur pour les agences/équipes.

---

### Feature 6: Analytics Dashboard pour les Apps Déployées
| Attribut | Valeur |
|----------|--------|
| **Priorité** | P2 - Important |
| **Effort** | M (3-5 jours) |
| **Impact** | 🔺 Rétention / Valeur perçue |

**Description**:
- Intégration Plausible/Vercel Analytics
- Dashboard: vues, visiteurs uniques, pays, devices
- Alertes si trafic inhabituel

**Pourquoi**: Le plan Pro promet "Analytics" mais ce n'est pas implémenté. Les utilisateurs veulent voir l'impact de leurs apps.

---

### Feature 7: Input Vocal / Speech-to-Text
| Attribut | Valeur |
|----------|--------|
| **Priorité** | P3 - Nice to have |
| **Effort** | S (1-2 jours) |
| **Impact** | 🔺 UX / Différenciation |

**Description**:
- Bouton micro dans le chat
- Transcription via Whisper API
- Idéal pour les utilisateurs mobiles

**Pourquoi**: Différenciateur UX. Le brainstorm vocal est plus naturel pour beaucoup d'utilisateurs. Mentionné comme "Future Improvement" mais facile à implémenter.

---

## 📊 Matrice de Priorisation

| Feature | Impact | Effort | Priorité | Quick Win? |
|---------|--------|--------|----------|------------|
| Export de Code | 🔺🔺🔺 | S | P1 | ✅ |
| Historique/Rollback | 🔺🔺🔺 | M | P1 | |
| Onboarding | 🔺🔺🔺 | M | P1 | |
| Templates Marketplace | 🔺🔺 | L | P2 | |
| Analytics | 🔺🔺 | M | P2 | |
| Collaboration | 🔺🔺🔺 | XL | P2 | |
| Input Vocal | 🔺 | S | P3 | ✅ |

**Recommandation**: Commencer par **Export de Code** (promesse non tenue) puis **Onboarding** (activation) puis **Historique** (rétention).

---

## 🐛 PARTIE 3: BUGS POTENTIELS À VÉRIFIER

### 3.1 Routes et Navigation

| Issue | Risque | Fichier |
|-------|--------|---------|
| ⚠️ **Route `/apps` n'existe pas** | Medium | Dashboard link "View all" pointe vers `/apps` mais la page n'existe pas |
| ⚠️ **Route `/user/security` n'existe pas** | Low | Settings page link vers `/user/security` pour 2FA |
| ⚠️ **Route `/privacy` et `/terms` manquantes** | Medium | Footer links sans pages correspondantes |
| ⚠️ **Docs link externe** | Low | `https://docs.appforge.dev` - domaine probablement pas configuré |

### 3.2 Auth Flow

| Issue | Risque | Détails |
|-------|--------|---------|
| ✅ Middleware OK | - | Routes publiques bien configurées (`/sign-in`, `/sign-up`) |
| ⚠️ **Pas de `/login` alias** | Low | Certains utilisateurs tapent `/login` par habitude |
| ⚠️ **Redirection après login** | Medium | Vérifier que `afterSignIn` redirige vers `/dashboard` |
| ⚠️ **Clerk non configuré** | Critique | Si `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` manque, le middleware bypass l'auth |

### 3.3 Billing et Stripe

| Issue | Risque | Détails |
|-------|--------|---------|
| ⚠️ **Webhook Stripe non testé** | Critique | `/api/webhooks/stripe/route.ts` - doit être vérifié avec Stripe CLI |
| ⚠️ **Price IDs hardcodés** | Medium | `STRIPE_STARTER_PRICE_ID`, etc. doivent être configurés |
| ⚠️ **BYOK discount côté Stripe** | High | Le discount 50% est affiché côté UI mais pas forcément appliqué dans Stripe |

### 3.4 Sécurité

| Issue | Risque | Détails |
|-------|--------|---------|
| 🔴 **API Keys non chiffrées** | Critique | `openaiKey`/`anthropicKey` stockées en clair en DB (mentionné dans PROJECT_STATUS) |
| ⚠️ **Pas de rate limiting** | High | Les API routes sont vulnérables aux abus |
| ⚠️ **CORS non configuré** | Medium | Vérifier les headers CORS pour les API |

### 3.5 UX Bugs

| Issue | Risque | Détails |
|-------|--------|---------|
| ⚠️ **Delete Account non fonctionnel** | High | Bouton présent dans Settings mais probablement sans handler |
| ⚠️ **Upgrade button sans action** | High | Dans Settings, le bouton "Upgrade Plan" n'a pas de `onClick` |
| ⚠️ **Email user non récupéré** | Low | User créé avec `email: ''` dans dashboard - devrait récupérer depuis Clerk |

---

## 🎯 ACTIONS RECOMMANDÉES (Sprint 1)

### Bugs critiques à fixer immédiatement:

1. **Chiffrer les API keys** - AES-256 avant stockage
2. **Ajouter les pages manquantes** - `/apps`, `/privacy`, `/terms`
3. **Implémenter rate limiting** - `@upstash/ratelimit` ou similaire
4. **Vérifier le webhook Stripe** - Tester avec `stripe listen`

### Features Quick Wins (1 semaine):

1. **Export ZIP** - 1-2 jours
2. **Page /apps (liste complète)** - 0.5 jour
3. **Input vocal** - 1 jour
4. **Onboarding tooltips** - 2 jours

---

## 📈 KPIs À SUIVRE

| Métrique | Cible | Pourquoi |
|----------|-------|----------|
| **Activation Rate** | >40% | % users qui créent leur 1ère app |
| **Free → Paid Conversion** | >5% | Santé du funnel |
| **DAU/MAU** | >20% | Engagement/Stickiness |
| **Churn Rate** | <8% mensuel | Rétention |
| **ARPU** | >$25 | Revenu moyen par user payant |

---

## 💡 NOTES FINALES

L'application est **techniquement solide** pour un MVP. Le code est propre, l'architecture est bonne, et les features core fonctionnent.

**Points forts:**
- UX moderne et épurée
- Stack technique moderne (Next.js 14, Clerk, Prisma)
- BYOK est un différenciateur intéressant
- Pricing clair et transparent

**Points à améliorer:**
- Promesses non tenues (export, analytics, collaboration)
- Sécurité à renforcer (encryption, rate limiting)
- Onboarding inexistant

**Verdict**: Prêt pour un soft launch avec early adopters. Fixer les bugs de sécurité, ajouter l'export, puis itérer rapidement sur le feedback.

---

*Rapport généré par PM Senior - Session de brainstorm*
