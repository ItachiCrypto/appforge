# 🔍 AppForge - Rapport d'Audit UX Complet

**Date:** 4 février 2026  
**Testeur:** UX Bot  
**URL:** https://startup-azure-nine.vercel.app  
**Compte:** infos.zetsu@gmail.com

---

## 📊 Résumé Exécutif

| Catégorie | Nombre | Status |
|-----------|--------|--------|
| P0 - Bugs bloquants | 1 | 🔴 CRITIQUE |
| P1 - Problèmes majeurs | 4 | 🟠 À CORRIGER |
| P2 - Améliorations UX | 6 | 🟡 À AMÉLIORER |
| P3 - Polish | 5 | 🟢 NICE TO HAVE |

**Verdict global:** L'application a une excellente base UX (design moderne, flow intuitif) mais souffre d'un bug critique qui empêche l'utilisation des apps générées.

---

## 🔴 P0 - Bugs Bloquants

### 1. Le bouton "Ajouter" de l'app générée ne fonctionne pas

**Description:**  
Après génération d'une app "Todo App" (clone Todoist), le bouton "Ajouter" ne fonctionne pas. Le texte reste dans l'input et la tâche n'est jamais ajoutée à la liste.

**Steps to reproduce:**
1. Créer une nouvelle app (clone Todoist)
2. Attendre la génération du code
3. En mode Normal, saisir "Faire 30 min de sport" dans le champ
4. Cliquer sur "Ajouter"
5. Observer : le texte reste, la liste "Tâches" reste vide

**Impact:** L'utilisateur ne peut pas utiliser l'app qu'il vient de créer → **CRITIQUE**

**Cause probable:** Erreur dans le code React généré (onClick handler non fonctionnel ou state non mis à jour)

**Screenshot:** Le texte "Faire 30 min de sport" reste dans l'input après multiple clics sur "Ajouter"

---

## 🟠 P1 - Problèmes Majeurs

### 1. Mode Expert par défaut au lieu de la Preview

**Description:**  
Après la génération de l'app, l'utilisateur arrive sur le mode **Expert** (éditeur de code) au lieu du mode **Normal** (preview).

**Impact:** Un utilisateur non-technique veut voir son app, pas le code. Friction importante.

**Recommandation:** Rediriger vers le mode Normal par défaut après génération.

---

### 2. Titre de l'app généré incorrect

**Description:**  
J'ai nommé l'app "Mon Fitness Tracker", mais l'app générée affiche "Todo App" comme titre.

**Impact:** Perte de personnalisation, confusion utilisateur.

**Recommandation:** Utiliser le nom saisi par l'utilisateur dans le code généré (passer le nom comme paramètre au prompt IA).

---

### 3. Le chat AI masque la preview en mode Normal

**Description:**  
Le panneau "Chat with AI" en superposition couvre une partie significative de la preview de l'app.

**Impact:** L'utilisateur ne peut pas voir/tester son app correctement.

**Recommandation:** 
- Mettre le chat en panneau latéral (non superposé)
- Ou ajouter un bouton pour le fermer/réduire plus visible

---

### 4. Pas d'option pour créer une app custom

**Description:**  
À l'étape 1 "Quels SaaS veux-tu abandonner ?", il est **obligatoire** de sélectionner un SaaS existant. Impossible de créer une app custom sans "remplacer" quelque chose.

**Impact:** Un utilisateur qui veut créer un "Fitness Tracker" (pas un SaaS classique) est bloqué.

**Recommandation:** 
- Ajouter une option "Créer une app custom" 
- Ou permettre de passer l'étape de sélection

---

## 🟡 P2 - Améliorations UX

### 1. Pas de notification toast après suppression d'app

**Description:**  
Après suppression d'une app, la liste se met à jour mais aucun feedback visuel (toast) ne confirme l'action.

**Recommandation:** Ajouter un toast "App supprimée avec succès ✓"

---

### 2. Bouton "Personnaliser" désactivé sans explication

**Description:**  
À l'étape 2/3 (Clone), le bouton "Personnaliser" est désactivé tant que l'option n'est pas cliquée. Aucun message n'explique pourquoi.

**Recommandation:** 
- Tooltip "Sélectionne un clone pour continuer"
- Ou activer le bouton par défaut si une seule option

---

### 3. Message "0 restantes sur le plan gratuit" peu clair

**Description:**  
Sur le dashboard, "0 restantes sur le plan gratuit" pourrait être mal compris (0 quoi ? apps ? requêtes ?).

**Recommandation:** "3/3 apps utilisées sur le plan gratuit" ou "Limite atteinte (3 apps)"

---

### 4. Placeholder du champ nom incohérent

**Description:**  
Le placeholder du champ nom affiche "Mon Todo App" même quand on a sélectionné un autre SaaS à remplacer.

**Recommandation:** Adapter dynamiquement ("Mon Clone Finary", "Mon Calendrier", etc.)

---

### 5. Les économies sidebar ne se mettent pas à jour

**Description:**  
Les "300 €/an économisés" dans la sidebar ne changent pas après suppression d'une app.

**Recommandation:** Recalculer dynamiquement ou refresh après modification.

---

### 6. Pas de state empty explicite pour la liste de tâches

**Description:**  
La section "Tâches" est vide sans message "Aucune tâche pour le moment".

**Recommandation:** Afficher un état vide informatif avec CTA.

---

## 🟢 P3 - Suggestions Polish

### 1. Animation de génération de code
L'animation "Je construis..." est bien, mais pourrait montrer une barre de progression ou les étapes (Analyse → Génération → Compilation).

### 2. Preview responsive
Ajouter des boutons pour simuler différentes tailles d'écran (mobile/tablette/desktop) dans la preview.

### 3. Icônes de fichiers
Dans la liste "FILES", ajouter des icônes différentes pour .js et .css pour une meilleure distinction visuelle.

### 4. Raccourcis clavier
- `Cmd+S` pour sauvegarder
- `Cmd+Enter` pour générer/exécuter

### 5. Historique des versions
Permettre de revenir à une version précédente du code après une modification IA.

---

## ✅ Points Positifs (à conserver)

1. **Design moderne et cohérent** - Dark theme agréable, couleurs bien choisies
2. **Flow de création en 3 étapes** - Progression claire (Sélection → Clone → Création)
3. **Feedback économies** - Les économies affichées motivent l'utilisateur
4. **Confirmation de suppression** - Bon pattern avec dialog explicite
5. **Toggle Normal/Expert** - Bonne séparation pour différents profils
6. **Code sans lucide-react** ✅ - Le code généré utilise uniquement React/useState
7. **Génération rapide** - ~10-15 secondes pour générer une app complète
8. **Stepper visuel** - Progression bien indiquée avec check marks

---

## 🔧 Vérifications techniques

### ✅ Code généré - PAS de `lucide-react`
```javascript
import React, { useState } from 'react';
// Aucun import lucide-react détecté ✓
```

### ⚠️ App compile mais bug fonctionnel
- L'app s'affiche correctement dans la preview
- Le formulaire est rendu (inputs, bouton)
- **MAIS** le onClick du bouton ne fonctionne pas

---

## 📋 Prochaines Actions Recommandées

1. **URGENT** 🔴 - Investiguer et corriger le bug du bouton "Ajouter"
2. **HIGH** 🟠 - Changer le mode par défaut après génération (Expert → Normal)
3. **HIGH** 🟠 - Passer le nom de l'app au prompt de génération
4. **MEDIUM** 🟡 - Repositionner le chat AI (non superposé)
5. **LOW** 🟢 - Ajouter toasts de confirmation

---

*Rapport généré le 4 février 2026 à 14:XX*
