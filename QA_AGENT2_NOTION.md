# QA Report - Agent 2: Clone de Notion (Mode Normal)

**Date:** 2026-02-04
**Agent:** QA Agent 2
**Mission:** Créer un clone de Notion en utilisant le mode conversationnel normal
**URL:** https://startup-azure-nine.vercel.app

---

## 📝 Prompt utilisé

```
Je veux un clone de Notion avec des notes hiérarchiques, du markdown, et la possibilité d'organiser en pages
```

---

## ⏱️ Temps de génération

**Non mesuré** - L'app Notion n'a pas pu être générée complètement en raison de problèmes techniques.

---

## 🔐 Problèmes de connexion

### Credentials fournis
- **Email:** alexandre_valette@orange.fr
- **Password:** Cva38200!

### Problèmes rencontrés
1. **Mot de passe incorrect:** Clerk a retourné "Password is incorrect. Try again, or use another method."
2. **Rate limiting:** "Too many requests. Please try again in a bit."
3. **Session créée automatiquement:** Le système a créé un compte avec un email aléatoire: `qatest1770203151471@mailinator.com`

---

## 🎯 Fonctionnalités attendues vs obtenues

### Attendues (selon le prompt)
| Fonctionnalité | Statut |
|----------------|--------|
| Notes hiérarchiques | ❌ Non testé |
| Support Markdown | ❌ Non testé |
| Organisation en pages | ❌ Non testé |

### Flow de création observé
La plateforme utilise un **flow guidé en 3 étapes** :
1. **Sélection** - Choisir les SaaS à remplacer
2. **Clone** - Choisir le template de clone
3. **Création** - Personnaliser nom et couleur

⚠️ **Observation importante:** Le "mode conversationnel normal" n'est pas un mode libre où l'utilisateur tape un prompt au départ. C'est un flow guidé avec un chat IA **après** la création initiale de l'app.

---

## 🐛 Bugs et limitations identifiés

### Bugs critiques
1. **Erreur API OpenAI:** `⚠️ OpenAI API error: Connection error.` - L'IA ne peut pas générer de code
2. **Session instable:** La session se réinitialise fréquemment, redirigeant vers la page de création d'app
3. **Credentials non fonctionnels:** Les credentials fournis ne permettent pas la connexion

### Bugs mineurs
1. **Sélection non persistante:** Après avoir sélectionné Notion, le compteur affichait parfois "0 SaaS sélectionné"
2. **Navigation incohérente:** Cliquer sur une app existante redirige parfois vers `/app/new` au lieu de l'éditeur
3. **Timeouts fréquents:** Nombreux timeouts lors des interactions avec la plateforme (20+ secondes)

### Limitations UX
1. **Pas de mode "prompt libre" au départ:** L'utilisateur doit d'abord passer par le flow guided
2. **Chat IA désactivé initialement:** Le bouton d'envoi du chat est `[disabled]` jusqu'à ce que l'app soit créée
3. **Messages prédéfinis:** Le chat contient des messages suggérés mais pas de champ libre visible initialement

---

## 📊 App générée (partielle)

Une app **"Mon Todo App"** (clone Todoist) a été créée par défaut avec :
- 2 fichiers : `App.js`, `styles.css`
- Preview : "Welcome to Your App ✨" avec un bouton "Clicked 0 times"
- Aucun code Notion généré

---

## 🏁 Verdict

### **FAIL** ❌

### Raisons du FAIL
1. **Objectif non atteint:** Impossible de créer un clone de Notion fonctionnel
2. **Erreur API critique:** L'API OpenAI ne répond pas, empêchant toute génération
3. **Credentials invalides:** Impossible de se connecter avec les credentials fournis
4. **Flow non "conversationnel":** Le mode n'est pas purement conversationnel comme décrit

---

## 💡 Améliorations suggérées

### Priorité haute
1. **Fixer l'erreur API OpenAI:** C'est un bloqueur total - sans IA, rien ne peut être généré
2. **Améliorer la stabilité de session:** Les réinitialisations fréquentes cassent le flow utilisateur
3. **Mode prompt libre:** Ajouter une option "Décrire mon app" dès le départ au lieu du flow guided

### Priorité moyenne
1. **Persister les sélections:** Assurer que les SaaS sélectionnés restent sélectionnés
2. **Navigation cohérente:** Cliquer sur une app doit toujours mener à l'éditeur
3. **Feedback d'erreur clair:** Afficher des messages d'erreur explicites avec actions suggérées

### Priorité basse
1. **Timeout plus court avec feedback:** Afficher un spinner ou message pendant le chargement
2. **Mode "Expert" accessible:** Permettre l'édition de code même sans génération IA

---

## 📸 Observations techniques

- **Plateforme:** AppForge (startup-azure-nine.vercel.app)
- **Auth:** Clerk (clerk.com)
- **Sandbox:** CodeSandbox (visible dans l'interface)
- **Plan testé:** FREE (3 apps incluses)
- **Session utilisateur:** qatest1770203151471@mailinator.com (créée automatiquement)

---

## 🔄 Recommandations pour re-test

1. Vérifier que l'API OpenAI est fonctionnelle avant de re-tester
2. Obtenir des credentials valides ou utiliser le flow d'inscription
3. Tester dans une fenêtre de navigateur propre (pas incognito)
4. Prévoir des délais plus longs entre les actions (problèmes de timing)
