# 🧪 QA Test Plan - AppForge

**Version:** 2.0  
**Date:** 2025-02-03  
**URL:** https://startup-azure-nine.vercel.app/  
**Rédigé par:** QA Lead Agent

---

## 📋 Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Configuration de test](#2-configuration-de-test)
3. [Tests User Journey](#3-tests-user-journey)
4. [Tests Techniques](#4-tests-techniques)
5. [Bugs Connus à Surveiller](#5-bugs-connus-à-surveiller)
6. [Répartition Agents](#6-répartition-agents)
7. [Critères de Succès Globaux](#7-critères-de-succès-globaux)

---

## 1. Vue d'ensemble

### 1.1 Contexte Technique

| Stack | Technologies |
|-------|-------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Zustand |
| Auth | Clerk (Google OAuth) |
| Database | PostgreSQL via Prisma (Supabase) |
| AI | OpenAI (GPT-4o) / Anthropic (Claude) |
| Preview | Sandpack (CodeSandbox) |
| Storage | Cloudflare R2 |

### 1.2 Fonctionnalités Principales

- **Authentification** via Clerk (Google, Email)
- **Dashboard** avec liste des apps
- **App Builder** avec chat IA + preview live
- **Mode Normal** : Preview + Chat drawer
- **Mode Expert** : Monaco Editor + File Explorer + Chat

### 1.3 Historique des Bugs Récents

Les tests doivent porter une attention particulière aux zones problématiques :
- 🔴 Race conditions entre AI Tools et Frontend State
- 🔴 Streaming des réponses IA avec interruptions
- 🔴 Persistance des fichiers (DB ↔ Frontend)
- 🟡 Comparaison des paths (avec/sans `/`)
- 🟡 Preview Sandpack qui ne refresh pas

---

## 2. Configuration de Test

### 2.1 Environnements

| Env | URL | Notes |
|-----|-----|-------|
| Production | https://startup-azure-nine.vercel.app/ | Test principal |
| Preview | Branches Vercel | Si disponible |

### 2.2 Comptes de Test

Chaque agent doit utiliser un compte Google différent pour éviter les conflits.

| Agent | Email de test | Rôle |
|-------|--------------|------|
| Agent 1 | qa-agent1@[domain] | User Journey complet |
| Agent 2 | qa-agent2@[domain] | Tests techniques API |
| Agent 3 | qa-agent3@[domain] | Tests Edge Cases |

### 2.3 Outils Requis

- Chrome/Firefox (DevTools ouvert, Console + Network)
- Extension Lighthouse (optionnel)
- Screen recording pour les bugs

---

## 3. Tests User Journey

### 🎯 UJ-1: Onboarding Complet

**Objectif:** Vérifier le parcours d'un nouvel utilisateur

#### UJ-1.1: Landing Page

| ID | Action | Critère de Succès | Priorité |
|----|--------|-------------------|----------|
| UJ-1.1.1 | Accéder à https://startup-azure-nine.vercel.app/ | Page charge en < 3s, pas d'erreurs console | P0 |
| UJ-1.1.2 | Vérifier le contenu | Hero section, CTA "Get Started", features visibles | P1 |
| UJ-1.1.3 | Cliquer sur "Get Started" | Redirection vers /sign-in ou /dashboard | P0 |
| UJ-1.1.4 | Test responsive (Mobile 375px) | Layout adapté, pas de scroll horizontal | P1 |
| UJ-1.1.5 | Test responsive (Tablet 768px) | Layout adapté correctement | P2 |

#### UJ-1.2: Authentification Google

| ID | Action | Critère de Succès | Priorité |
|----|--------|-------------------|----------|
| UJ-1.2.1 | Cliquer sur "Continue with Google" | Popup/redirect Google OAuth | P0 |
| UJ-1.2.2 | Se connecter avec compte Google | Auth réussie, redirection vers /dashboard | P0 |
| UJ-1.2.3 | Vérifier création user en DB | User visible dans dashboard, pas d'erreur | P0 |
| UJ-1.2.4 | Vérifier session persistante | Refresh page = toujours connecté | P1 |
| UJ-1.2.5 | Sign out et sign in | Session gérée correctement | P1 |

### 🎯 UJ-2: Création d'une Nouvelle App

**Objectif:** Créer une app vide et accéder au builder

| ID | Action | Critère de Succès | Priorité |
|----|--------|-------------------|----------|
| UJ-2.1 | Cliquer "New App" / "+" sur dashboard | Modal ou page de création | P0 |
| UJ-2.2 | Entrer nom "Mon App Test" | Validation input, pas d'erreur | P0 |
| UJ-2.3 | Confirmer création | App créée, redirection vers /app/[id] | P0 |
| UJ-2.4 | Vérifier URL | Format /app/[uuid] valide | P1 |
| UJ-2.5 | Vérifier state initial | Chat vide, preview vide ou template de base | P0 |
| UJ-2.6 | Vérifier console | ❌ Aucune erreur JS | P0 |

### 🎯 UJ-3: Génération d'un "Fork de Notion" 

**Objectif:** Test intensif de génération IA multi-fichiers

#### UJ-3.1: Prompt Initial

| ID | Action | Critère de Succès | Priorité |
|----|--------|-------------------|----------|
| UJ-3.1.1 | Entrer prompt complet (voir ci-dessous) | Message envoyé, indicateur de chargement | P0 |
| UJ-3.1.2 | Observer le streaming | Réponse apparaît progressivement, pas de freeze | P0 |
| UJ-3.1.3 | Attendre la fin de génération | Message complet, indicateur disparaît | P0 |
| UJ-3.1.4 | Vérifier les fichiers générés | Minimum 3+ fichiers dans le code | P0 |
| UJ-3.1.5 | Vérifier la preview | App Notion-like visible, pas d'erreur Sandpack | P0 |

**Prompt de test (copier exactement):**
```
Crée un clone de Notion avec les fonctionnalités suivantes :
1. Une sidebar de navigation sur la gauche avec une liste de pages
2. Un éditeur de notes avec rich text (bold, italic, headers)
3. La possibilité d'ajouter de nouvelles pages
4. Un design moderne avec Tailwind CSS

Structure multi-fichiers :
- App.tsx (composant principal)
- components/Sidebar.tsx
- components/Editor.tsx
- components/PageList.tsx
- styles/theme.ts

Utilise React hooks pour l'état local.
```

#### UJ-3.2: Vérification des Fichiers Générés

| ID | Check | Critère de Succès | Priorité |
|----|-------|-------------------|----------|
| UJ-3.2.1 | App.tsx existe | Fichier présent avec composant React valide | P0 |
| UJ-3.2.2 | Sidebar.tsx existe | Composant avec props et structure | P0 |
| UJ-3.2.3 | Editor.tsx existe | Composant éditeur avec logique | P0 |
| UJ-3.2.4 | PageList.tsx existe | Liste des pages avec mapping | P1 |
| UJ-3.2.5 | Imports corrects | Pas de "Module not found" dans console | P0 |
| UJ-3.2.6 | Styles appliqués | Tailwind classes visibles dans preview | P1 |

#### UJ-3.3: Preview Live

| ID | Check | Critère de Succès | Priorité |
|----|-------|-------------------|----------|
| UJ-3.3.1 | Preview se charge | Iframe Sandpack visible avec contenu | P0 |
| UJ-3.3.2 | Pas d'erreurs Sandpack | Pas de "bundling error" ou écran rouge | P0 |
| UJ-3.3.3 | Sidebar visible | Composant sidebar rendu à gauche | P1 |
| UJ-3.3.4 | Éditeur fonctionnel | Zone de texte éditable | P1 |
| UJ-3.3.5 | Interaction | Cliquer sur éléments = réaction | P2 |

### 🎯 UJ-4: Modification via l'IA

**Objectif:** Tester les itérations et les tools IA

| ID | Action | Critère de Succès | Priorité |
|----|--------|-------------------|----------|
| UJ-4.1 | Envoyer "Ajoute un bouton dark mode dans la sidebar" | Message accepté | P0 |
| UJ-4.2 | Observer tool calls (si visible) | L'IA lit puis modifie les fichiers | P1 |
| UJ-4.3 | Vérifier que Sidebar.tsx est modifié | Nouveau code avec bouton dark mode | P0 |
| UJ-4.4 | Preview mise à jour | Bouton visible dans la preview | P0 |
| UJ-4.5 | ⚠️ Vérifier pas d'écrasement | Les autres fichiers sont intacts | P0 |

**Prompt supplémentaire:**
```
Modifie la Sidebar pour ajouter un bouton de toggle dark mode en bas. 
Le bouton doit changer une variable d'état isDark.
```

| ID | Action | Critère de Succès | Priorité |
|----|--------|-------------------|----------|
| UJ-4.6 | Envoyer "Change la couleur du header en bleu" | Modification appliquée | P1 |
| UJ-4.7 | Vérifier cohérence | Pas de régression sur les autres éléments | P0 |
| UJ-4.8 | Refresh page | Les fichiers sont toujours là (persistance) | P0 |

### 🎯 UJ-5: Mode Expert

**Objectif:** Tester l'interface avancée avec Monaco Editor

| ID | Action | Critère de Succès | Priorité |
|----|--------|-------------------|----------|
| UJ-5.1 | Trouver le toggle Mode (Normal/Expert) | Toggle visible dans le header | P0 |
| UJ-5.2 | Activer Mode Expert | Interface change : 3 panels apparaissent | P0 |
| UJ-5.3 | Vérifier File Explorer | Liste des fichiers visible à gauche | P0 |
| UJ-5.4 | Cliquer sur un fichier | Contenu s'affiche dans Monaco Editor | P0 |
| UJ-5.5 | Modifier le code manuellement | Edition possible dans Monaco | P0 |
| UJ-5.6 | Sauvegarder (Ctrl+S ou auto) | Preview se met à jour | P0 |
| UJ-5.7 | Vérifier preview | Changements reflétés en live | P0 |
| UJ-5.8 | Chat toujours accessible | Panel chat compact fonctionnel | P1 |
| UJ-5.9 | Revenir en Mode Normal | Interface revient à Preview + Chat | P1 |

### 🎯 UJ-6: Persistance et Reload

**Objectif:** Vérifier que tout persiste après refresh

| ID | Action | Critère de Succès | Priorité |
|----|--------|-------------------|----------|
| UJ-6.1 | Refresh la page (F5) | App se recharge sans erreur | P0 |
| UJ-6.2 | Vérifier les fichiers | Tous les fichiers générés sont présents | P0 |
| UJ-6.3 | Vérifier la preview | Preview affiche le même état | P0 |
| UJ-6.4 | Vérifier l'historique chat | Messages précédents visibles | P0 |
| UJ-6.5 | Fermer onglet, rouvrir | Tout est restauré | P0 |
| UJ-6.6 | Tester depuis dashboard | L'app est listée et accessible | P1 |

---

## 4. Tests Techniques

### 🔧 TT-1: Streaming IA

**Objectif:** Vérifier la qualité du streaming des réponses

| ID | Test | Comment vérifier | Critère de Succès | Priorité |
|----|------|------------------|-------------------|----------|
| TT-1.1 | Streaming progressif | Observer le texte | Caractères apparaissent un par un | P0 |
| TT-1.2 | Pas de freeze | UI réactive | Peut scroller/cliquer pendant streaming | P0 |
| TT-1.3 | Interruption possible | Bouton Stop si dispo | Stream s'arrête proprement | P1 |
| TT-1.4 | Network tab | DevTools > Network | EventSource ou fetch stream visible | P1 |
| TT-1.5 | Erreur réseau | Simuler offline | Message d'erreur user-friendly | P2 |
| TT-1.6 | Token long | Prompt complexe | Génération complète sans timeout (60s max) | P0 |

### 🔧 TT-2: Exécution des Tools IA

**Objectif:** Vérifier que les tools fonctionnent correctement

| ID | Test | Comment vérifier | Critère de Succès | Priorité |
|----|------|------------------|-------------------|----------|
| TT-2.1 | list_files | Logs console/network | L'IA liste les fichiers avant de modifier | P1 |
| TT-2.2 | read_file | Prompt "lis le fichier X" | L'IA lit et cite le contenu | P0 |
| TT-2.3 | write_file | Créer nouveau fichier | Fichier créé et visible | P0 |
| TT-2.4 | update_file | Modifier fichier existant | Modification partielle fonctionne | P0 |
| TT-2.5 | delete_file | Demander suppression | Fichier supprimé | P1 |
| TT-2.6 | ⚠️ Pas d'écrasement | Créer fichier A, modifier B | A n'est pas affecté | P0 |
| TT-2.7 | Multi-fichiers | "Crée 3 composants" | Tous les 3 sont créés correctement | P0 |
| TT-2.8 | Tool loop | Modification complexe | L'IA peut faire plusieurs tool calls successifs | P1 |

**Prompt de test pour TT-2.6 (bug critique):**
```
Ajoute uniquement un commentaire "// Test" au début du fichier Editor.tsx.
Ne modifie AUCUN autre fichier.
```
➡️ Vérifier que SEUL Editor.tsx est modifié.

### 🔧 TT-3: Persistance en Database

**Objectif:** Vérifier que les fichiers sont correctement sauvés

| ID | Test | Comment vérifier | Critère de Succès | Priorité |
|----|------|------------------|-------------------|----------|
| TT-3.1 | Sauvegarde après génération | Refresh page | Fichiers toujours là | P0 |
| TT-3.2 | Sauvegarde après edit manuel | Mode Expert > Edit > Refresh | Modification persistée | P0 |
| TT-3.3 | Pas de perte sur erreur IA | Erreur API > Refresh | Fichiers précédents intacts | P0 |
| TT-3.4 | API /api/apps/[id] | Network tab | GET retourne les fichiers | P1 |
| TT-3.5 | ⚠️ Race condition | Génération rapide successive | Pas de fichiers écrasés | P0 |

**Test de race condition (TT-3.5):**
1. Envoyer un premier prompt de génération
2. IMMÉDIATEMENT après (pendant le streaming), envoyer un 2ème prompt
3. Attendre la fin des deux
4. Vérifier que les fichiers des deux générations sont présents

### 🔧 TT-4: Preview Sandpack

**Objectif:** Vérifier le bon fonctionnement de la preview

| ID | Test | Comment vérifier | Critère de Succès | Priorité |
|----|------|------------------|-------------------|----------|
| TT-4.1 | Chargement initial | Observer l'iframe | Preview charge sans erreur | P0 |
| TT-4.2 | Hot reload | Modifier code | Preview se met à jour automatiquement | P0 |
| TT-4.3 | Erreur de syntaxe | Introduire erreur volontaire | Message d'erreur clair dans preview | P1 |
| TT-4.4 | Console Sandpack | Ouvrir console Sandpack si dispo | Pas d'erreurs runtime | P0 |
| TT-4.5 | Imports tiers | Utiliser lodash, date-fns | Packages résolus correctement | P2 |
| TT-4.6 | CSS/Tailwind | Classes Tailwind | Styles appliqués correctement | P1 |

### 🔧 TT-5: Responsive Design

**Objectif:** Vérifier l'adaptation mobile/tablet/desktop

| ID | Test | Viewport | Critère de Succès | Priorité |
|----|------|----------|-------------------|----------|
| TT-5.1 | Dashboard mobile | 375x667 | Liste apps lisible, navigation ok | P1 |
| TT-5.2 | App Builder mobile | 375x667 | Chat accessible, preview peut être tab | P1 |
| TT-5.3 | Mode Expert tablet | 768x1024 | 3 panels visibles ou collapsibles | P2 |
| TT-5.4 | Desktop large | 1920x1080 | Layout utilise l'espace | P1 |
| TT-5.5 | Resize dynamique | Changer taille | Layout s'adapte sans refresh | P2 |

### 🔧 TT-6: Performance

**Objectif:** Mesurer les performances critiques

| ID | Test | Méthode | Critère de Succès | Priorité |
|----|------|---------|-------------------|----------|
| TT-6.1 | FCP Landing | Lighthouse | < 2s | P2 |
| TT-6.2 | TTI Dashboard | Lighthouse | < 4s | P2 |
| TT-6.3 | Temps réponse IA | Chrono manuel | < 5s pour début streaming | P1 |
| TT-6.4 | Preview refresh | Chrono manuel | < 1s après modif code | P1 |
| TT-6.5 | Memory leaks | DevTools > Memory | Pas de fuite après 10 messages | P2 |

---

## 5. Bugs Connus à Surveiller

### 🔴 Bugs Critiques (P0)

| ID | Bug | Description | Comment tester | Fichier concerné |
|----|-----|-------------|----------------|------------------|
| BUG-1 | Race condition DB/Frontend | Les tools écrivent en DB mais le frontend PATCH avec des fichiers stales | Test TT-3.5 | `page.tsx`, `route.ts` |
| BUG-2 | codeOutput null | L'IA utilise tools mais ne retourne pas les fichiers au frontend | Observer Network: event `done` sans `codeOutput` | `route.ts` lignes 280-320 |
| BUG-3 | Preview ne refresh pas | Fichiers changés mais preview identique | `previewVersion` pas incrémenté | `page.tsx` |
| BUG-4 | Tools écrasent fichiers | `write_file` sur un fichier écrase les autres | Test TT-2.6 | `legacy-adapter.ts` |
| BUG-5 | Path normalization | `/App.tsx` vs `App.tsx` causent des doublons | Vérifier les clés dans files | `legacy-adapter.ts` |

### 🟡 Bugs Importants (P1)

| ID | Bug | Description | Comment tester | Fichier concerné |
|----|-----|-------------|----------------|------------------|
| BUG-6 | Retry silencieux | Échec refresh n'affiche pas d'erreur | Simuler erreur réseau pendant refresh | `page.tsx` |
| BUG-7 | Message sans codeOutput | Message ASSISTANT sauvé sans code associé | Recharger page, vérifier historique | `route.ts` |
| BUG-8 | Mode Expert - perte focus | Tab entre fichiers perd la position curseur | Cliquer plusieurs fichiers | `CodeEditor.tsx` |

### 🟢 Bugs Mineurs (P2)

| ID | Bug | Description | Comment tester | Fichier concerné |
|----|-----|-------------|----------------|------------------|
| BUG-9 | ESLint warnings | Pas d'ESLint installé | Build logs | `package.json` |
| BUG-10 | Preview console noise | Warnings React dans console Sandpack | Observer console preview | N/A |

---

## 6. Répartition Agents

### Agent 1: User Journey Master 🎯

**Focus:** Parcours utilisateur complet, tests fonctionnels

**Tests assignés:**
- ✅ Tous les tests UJ-1 à UJ-6
- ✅ TT-4 (Preview Sandpack)
- ✅ TT-5 (Responsive)

**Temps estimé:** 2-3 heures

**Livrables:**
- Screenshot de chaque étape clé
- Video du parcours complet
- Liste des bugs trouvés avec reproduction

### Agent 2: Tech Deep Dive 🔧

**Focus:** Tests techniques, API, tools IA

**Tests assignés:**
- ✅ TT-1 (Streaming IA)
- ✅ TT-2 (Tools IA)
- ✅ TT-3 (Persistance DB)
- ✅ TT-6 (Performance)

**Temps estimé:** 2-3 heures

**Livrables:**
- Logs réseau des appels API
- Traces des tool calls
- Métriques de performance
- Liste des bugs avec stack traces

### Agent 3: Edge Case Hunter 🐛

**Focus:** Bugs connus, edge cases, stress tests

**Tests assignés:**
- ✅ Reproduction des bugs BUG-1 à BUG-10
- ✅ Tests de stress (10 messages rapides)
- ✅ Tests d'erreur (offline, timeout, invalid input)
- ✅ Tests de sécurité basiques (XSS dans prompt, accès app autre user)

**Temps estimé:** 2-3 heures

**Livrables:**
- Matrice de reproduction des bugs connus
- Nouveaux bugs découverts
- Rapport de sécurité basique

---

## 7. Critères de Succès Globaux

### 7.1 Critères de Release (Must Pass)

| Critère | Seuil | Test associé |
|---------|-------|--------------|
| Auth fonctionne | 100% | UJ-1.2.1 à UJ-1.2.5 |
| Création app fonctionne | 100% | UJ-2.1 à UJ-2.6 |
| Génération IA fonctionne | 100% | UJ-3.1.1 à UJ-3.3.5 |
| Persistance fonctionne | 100% | UJ-6.1 à UJ-6.6, TT-3 |
| Pas de data loss | 100% | BUG-1, BUG-4, TT-2.6 |
| Pas d'erreurs console bloquantes | < 5 erreurs | Tous les tests |

### 7.2 Critères de Qualité (Should Pass)

| Critère | Seuil | Test associé |
|---------|-------|--------------|
| Mode Expert fonctionne | 100% | UJ-5 |
| Responsive mobile | 90%+ | TT-5 |
| Performance | FCP < 3s | TT-6 |
| Bugs P1 résolus | 80%+ | Bugs connus |

### 7.3 Métriques de Test

| Métrique | Cible |
|----------|-------|
| Tests exécutés | 100% de ce plan |
| Tests passés | > 90% |
| Bugs critiques ouverts | 0 |
| Temps total de test | < 8h (3 agents) |

---

## 📝 Template de Rapport de Bug

```markdown
## Bug Report

**ID:** BUG-XXX
**Titre:** [Description courte]
**Sévérité:** P0/P1/P2
**Test:** [ID du test échoué]

### Étapes de reproduction
1. 
2. 
3. 

### Résultat attendu
[Ce qui devrait se passer]

### Résultat obtenu
[Ce qui s'est passé]

### Environnement
- Browser: 
- OS: 
- URL: 
- User ID: 

### Captures
[Screenshots/Videos]

### Logs console
```
[Erreurs JS]
```

### Logs réseau
[Requêtes échouées]
```

---

## 📊 Checklist de Fin de Test

- [ ] Tous les tests UJ exécutés
- [ ] Tous les tests TT exécutés
- [ ] Tous les bugs connus vérifiés
- [ ] Screenshots collectés
- [ ] Bugs rapportés avec template
- [ ] Métriques de performance notées
- [ ] Rapport final rédigé

---

*Document généré par QA Lead Agent - Prêt pour exécution par 3 agents en parallèle*
