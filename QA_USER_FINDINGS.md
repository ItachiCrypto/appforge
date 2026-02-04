# QA User Findings - AppForge

**Date:** 2026-02-04
**Tester:** QA Agent (User Simulation)
**Environment:** https://startup-azure-nine.vercel.app
**Account:** infos.zetsu@gmail.com (Alexandre)

---

## Session 1: Todo App (Todoist Clone)

### Test Summary
- **App Created:** "Ma Super Todo" (Todoist replacement)
- **Result:** App works after AI auto-fix ✅

---

## BUG-001: AI generates code with unavailable dependencies

- **Où:** Editor / AI Generation
- **Quoi:** L'IA génère du code qui importe `lucide-react` mais cette dépendance n'est pas disponible dans le sandbox CodeSandbox
- **Attendu:** Le code généré devrait utiliser uniquement des dépendances disponibles dans le sandbox, ou l'import devrait être fonctionnel
- **Actuel:** Erreur de compilation immédiate: `Could not find dependency: 'lucide-react' relative to '/App.js'`
- **Screenshot:** Capture d'erreur Preview Error avec le message d'erreur complet
- **Priorité:** **P1** - Bug critique, l'app ne fonctionne pas sans intervention manuelle

### Impact
- Nouvel utilisateur voit une erreur dès la première génération
- Nécessite un clic sur "Corriger avec l'IA" pour résoudre
- Mauvaise première impression

### Suggestion de fix
Option 1: Inclure lucide-react dans les dépendances du sandbox
Option 2: Modifier le prompt système pour éviter d'utiliser lucide-react
Option 3: Utiliser des emojis/SVG inline à la place des icônes externes

---

## BUG-002: ✅ RÉSOLU - "Corriger avec l'IA" fonctionne correctement

- **Où:** Preview Error Overlay
- **Quoi:** Le bouton "Corriger avec l'IA" fonctionne bien
- **Résultat:** L'IA supprime l'import problématique et remplace les icônes par des emojis
- **Status:** Fonctionnel ✅

---

## OBSERVATION-001: Flow de création excellent

- **Où:** /app/new (3 étapes)
- **Quoi:** Le flow Sélection → Clone → Création est très intuitif
- **Points positifs:**
  - Affichage des économies en temps réel
  - Design moderne et engageant
  - Messages motivants ("Récupérer mon argent")
  - Génération IA automatique avec prompt pré-rempli

---

## OBSERVATION-002: Preview App fonctionne bien après fix

- **Où:** Editor Preview (iframe)
- **Test effectué:**
  1. ✅ Ajout d'une tâche "Tester AppForge"
  2. ✅ Sélection de catégorie (General/Work/Personal)
  3. ✅ Date (2026-02-04)
  4. ✅ Toggle completion (⭕ → ✔️)
  5. ✅ Vue quotidienne/hebdomadaire
- **Résultat:** Toutes les fonctionnalités de base marchent

---

## OBSERVATION-003: Chat IA bien intégré

- **Où:** Panel droit de l'éditeur
- **Quoi:** Le chat IA permet de modifier l'app en français naturel
- **Points positifs:**
  - Réponses en français
  - Badge "Code mis à jour !" visible
  - Historique des messages conservé

---

## Tests à faire ensuite

- [ ] Créer un clone Notion
- [ ] Tester le déploiement
- [ ] Tester le mode "Expert"
- [ ] Tester avec un projet plus complexe
- [ ] Tester la persistance des données (refresh)

---

## Résumé

| ID | Bug | Priorité | Status |
|---|---|---|---|
| BUG-001 | lucide-react indisponible | P1 | 🔴 À corriger |

**Verdict global:** L'app est utilisable mais la génération IA a besoin d'être ajustée pour éviter les dépendances non disponibles.

---

## Session 2: Clone Notion Test

### BUG-001 CONFIRMÉ - Le bug est SYSTÉMATIQUE

**Test:** Création d'un clone Notion
**Résultat:** Même erreur de dépendance !

```
/App.js: Could not find dependency: 'lucide-react' relative to '/App.js' (2:0)
> 2 | import { Plus, Sun, Moon } from 'lucide-react';
```

### Analyse du problème

L'IA génère systématiquement du code qui utilise `lucide-react` pour les icônes :
- **Clone Todoist:** `import { Calendar, CheckCircle, PlusCircle } from 'lucide-react'`
- **Clone Notion:** `import { Plus, Sun, Moon } from 'lucide-react'`

Ce n'est pas un cas isolé - **toutes les apps générées** auront ce problème !

### Impact business

1. **Première impression horrible** - L'utilisateur voit une erreur dès sa première app
2. **Friction utilisateur** - Doit cliquer "Corriger avec l'IA" à chaque création
3. **Perte de confiance** - Le message "C'est fait ! ✨" apparaît alors que ça ne marche pas

### Solution recommandée (PRIORITÉ HAUTE)

**Option A (Quick fix):** Modifier le prompt système pour dire à l'IA de NE PAS utiliser lucide-react mais des emojis ou des SVG inline

**Option B (Proper fix):** Ajouter lucide-react aux dépendances du sandbox CodeSandbox

**Option C (Validation):** Ajouter une étape de validation post-génération qui détecte les imports problématiques et les corrige automatiquement AVANT d'afficher "C'est fait !"

---

## BUG-002: "Corriger avec l'IA" ne corrige pas vraiment le code

- **Où:** Editor / Bouton "Corriger avec l'IA"
- **Quoi:** Le bouton "Corriger avec l'IA" affirme avoir corrigé mais ne modifie pas le code
- **Attendu:** Après clic sur "Corriger", l'import lucide-react devrait être supprimé du code
- **Actuel:** L'IA répond "Corrigé ! ✨ J'ai retiré l'import..." mais le code montre toujours `import { Plus, Sun, Moon } from 'lucide-react';`
- **Priorité:** **P0** - Bug critique ! La fonctionnalité de correction automatique est cassée pour certaines apps

### Observation

Pour l'app **Todoist**, la correction a fonctionné après 1 clic.
Pour l'app **Notion**, la correction ne fonctionne PAS même après 2+ clics.

Hypothèses possibles:
1. Race condition entre la mise à jour du code et la réponse IA
2. Problème de parsing avec des fichiers plus complexes
3. Le code Notion utilise les icônes à plusieurs endroits et l'IA ne corrige qu'un seul

---

## Tests additionnels effectués

- [x] Clone Todoist → Bug lucide-react ❌ → Correction IA ✅
- [x] Clone Notion → Bug lucide-react ❌ → Correction IA ❌ (ne marche pas !!)
- [ ] Clone Calendly (prévu)
- [ ] Clone Finary (prévu)

---

## RÉSUMÉ DES BUGS - À CORRIGER EN PRIORITÉ

| ID | Bug | Priorité | Impact |
|---|---|---|---|
| BUG-001 | AI génère code avec lucide-react non disponible | P1 | 100% des apps |
| BUG-002 | "Corriger avec l'IA" ne corrige pas vraiment | P0 | Apps complexes |

### Actions recommandées URGENTES

1. **IMMÉDIAT:** Modifier le prompt IA pour ne pas utiliser lucide-react
2. **COURT TERME:** Ajouter lucide-react aux dépendances du sandbox
3. **DEBUG:** Investiguer pourquoi la correction IA ne modifie pas le code pour Notion

---

*Rapport généré le 2026-02-04 12:53 GMT+1*
