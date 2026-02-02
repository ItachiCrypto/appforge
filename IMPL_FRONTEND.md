# IMPL_FRONTEND.md - Mode Expert Implementation

**Date:** 2025-02-02  
**Agent:** IMPL-FRONTEND  
**Status:** ✅ Implémentation complète

---

## 📋 Résumé

Implémentation d'un système bi-modal (Normal/Expert) pour l'éditeur d'apps AppForge :
- **Mode Normal** : Preview plein écran + chat en sidebar drawer
- **Mode Expert** : IDE complet avec file explorer, Monaco Editor, preview et chat

---

## 📦 Dépendances NPM Ajoutées

```json
{
  "@monaco-editor/react": "^4.6.0",
  "react-resizable-panels": "^2.0.0"
}
```

### Installation

```bash
npm install @monaco-editor/react@^4.6.0 react-resizable-panels@^2.0.0
```

---

## 📁 Fichiers Créés (9 fichiers)

### Store Zustand

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/stores/editor.ts` | ~80 | Store pour mode, tabs, panels avec persistence localStorage |

### Composants Editor

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/components/editor/index.tsx` | ~20 | Exports centralisés de tous les composants |
| `src/components/editor/ModeToggle.tsx` | ~60 | Toggle switch Normal ↔ Expert |
| `src/components/editor/FileExplorer.tsx` | ~180 | Arborescence fichiers avec icônes par type |
| `src/components/editor/FileTabs.tsx` | ~60 | Onglets des fichiers ouverts |
| `src/components/editor/CodeEditor.tsx` | ~100 | Wrapper Monaco Editor multi-langages |
| `src/components/editor/ChatPanel.tsx` | ~150 | Chat réutilisable (mode normal & compact) |
| `src/components/editor/ExpertLayout.tsx` | ~90 | Layout 3 panels redimensionnables |
| `src/components/editor/NormalLayout.tsx` | ~80 | Layout preview + chat drawer |

---

## 📝 Fichiers Modifiés (2 fichiers)

### `src/app/(dashboard)/app/[id]/page.tsx`

**Changements :**
- Ajout import `ModeToggle`, `ExpertLayout`, `NormalLayout`, `ChatPanel`, `useEditorStore`
- Ajout du `ModeToggle` dans le header
- Rendu conditionnel basé sur `mode` (normal/expert)
- Nouvelle fonction `handleFileChange` pour l'édition de code
- Suppression de l'ancien toggle Code/Preview
- Refactorisation du chat en composant `ChatPanel` réutilisable

### `package.json`

**Changements :**
```diff
  "dependencies": {
+   "@monaco-editor/react": "^4.6.0",
    "@anthropic-ai/sdk": "^0.72.1",
    ...
    "react-markdown": "^9.0.1",
+   "react-resizable-panels": "^2.0.0",
    ...
  }
```

---

## 🏗️ Architecture

```
src/
├── stores/
│   └── editor.ts                    # NEW: Store Zustand pour l'éditeur
│
├── components/
│   └── editor/                      # NEW: Dossier complet
│       ├── index.tsx                # Exports
│       ├── ModeToggle.tsx           # Toggle Normal/Expert
│       ├── FileExplorer.tsx         # Arborescence fichiers
│       ├── FileTabs.tsx             # Onglets
│       ├── CodeEditor.tsx           # Monaco Editor
│       ├── ChatPanel.tsx            # Chat réutilisable
│       ├── ExpertLayout.tsx         # Layout IDE
│       └── NormalLayout.tsx         # Layout immersif
│
└── app/(dashboard)/app/[id]/
    └── page.tsx                     # MODIFIED: Intégration modes
```

---

## 🔄 Store Editor (`useEditorStore`)

```typescript
interface EditorState {
  // Mode (persisté)
  mode: 'normal' | 'expert'
  setMode: (mode) => void
  toggleMode: () => void
  
  // Fichiers
  activeFile: string | null
  openTabs: string[]
  expandedFolders: Set<string>
  
  // Panels (persisté)
  panelSizes: { fileExplorer: number, editor: number, preview: number }
}
```

**Persistence localStorage :** `appforge-editor-storage`

---

## 🖼️ Wireframes

### Mode Normal
```
┌─────────────────────────────────────────────────────────────┐
│  [🌐] App Name        [Normal ● Expert]   [Live] [Deploy]   │
├─────────────────────────────────────────────────────────────┤
│                                               ┌────────────┐│
│                                               │ 💬 Chat    ││
│           ┌─────────────────────┐             │            ││
│           │                     │             │ Messages   ││
│           │   PREVIEW           │             │   ...      ││
│           │   (plein écran)     │             │            ││
│           │                     │             │ [Input ↵]  ││
│           └─────────────────────┘             └────────────┘│
│                                               [×] [⤢]       │
└─────────────────────────────────────────────────────────────┘
```

### Mode Expert
```
┌─────────────────────────────────────────────────────────────┐
│  [🌐] App Name        [Normal ● Expert]   [Live] [Deploy]   │
├────────┬────────────────────────────┬───────────────────────┤
│ FILES  │ [App.js] [styles.css] [×]  │      PREVIEW          │
│────────│────────────────────────────│                       │
│ 📁 src │ 1│ import React...         │   ┌───────────────┐   │
│   📄 Ap│ 2│                         │   │               │   │
│   📄 st│ 3│ export default () => {  │   │  [Live App]   │   │
│ 📁 comp│ 4│   return (              │   │               │   │
│        │ 5│     <div>Hello</div>    │   └───────────────┘   │
│        │ 6│   )                     │───────────────────────│
│        │ 7│ }                       │ 💬 Chat (compact)     │
│        │  │         [Monaco]        │ [Type message...  ↵]  │
└────────┴────────────────────────────┴───────────────────────┘
          ↔️            ↔️              (panels redimensionnables)
```

---

## ✅ Features Implémentées

| Feature | Status | Details |
|---------|--------|---------|
| Toggle Mode | ✅ | Switch visuel Normal ↔ Expert |
| Persistence Mode | ✅ | localStorage via Zustand persist |
| Preview Plein Écran | ✅ | Mode Normal avec chat drawer |
| Chat Drawer | ✅ | Collapsible, expandable, responsive |
| File Explorer | ✅ | Tree view, icônes par type, expand/collapse |
| Monaco Editor | ✅ | Syntax highlight, minimap, multi-langages |
| File Tabs | ✅ | Ouvrir/fermer, indicateur actif |
| Resizable Panels | ✅ | 3 panels avec drag handles |
| Panel Persistence | ✅ | Tailles sauvegardées en localStorage |
| Code Editing | ✅ | Modification et sauvegarde auto vers API |

---

## ❌ Non Implémenté (Scope Futur)

- Terminal intégré (xterm.js)
- Diff viewer pour changements IA
- Version history (git-like)
- Python runtime (Pyodide)
- Keyboard shortcuts (Cmd+S, Cmd+P)
- Create/rename/delete files dans FileExplorer
- Search in files (Cmd+Shift+F)

---

## 🧪 Comment Tester

```bash
# 1. Installer les dépendances
cd /root/.openclaw/workspace/startup
npm install

# 2. Lancer le serveur
npm run dev

# 3. Ouvrir dans le navigateur
# http://localhost:3000/app/[id]

# 4. Tester les features:
#    - Cliquer sur le toggle Normal/Expert
#    - En Expert: naviguer dans les fichiers, éditer le code
#    - Redimensionner les panels
#    - Refresh: vérifier que le mode persiste
```

---

## 📌 Notes Techniques

### Monaco Editor
- Import dynamique avec `next/dynamic` (évite erreurs SSR)
- Theme: `vs-dark`
- Options: minimap, line numbers, word wrap, bracket colorization

### React Resizable Panels
- `PanelGroup` avec direction="horizontal"
- `PanelResizeHandle` stylé avec hover effect
- Min/max sizes configurés pour éviter panels trop petits

### Zustand Persist
- Middleware `persist` avec `partialize` pour sélectionner les champs
- Clé localStorage: `appforge-editor-storage`

### Compatibilité
- Tous les composants existants (Preview, etc.) restent inchangés
- Le mode Normal garde le comportement original amélioré
- Pas de breaking changes sur l'API ou le store existant

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| Fichiers créés | 9 |
| Fichiers modifiés | 2 |
| Lignes de code ajoutées | ~900 |
| Dépendances ajoutées | 2 |
| Tests TypeScript | ✅ Pas d'erreurs dans les nouveaux fichiers |

---

**Agent IMPL-FRONTEND** - Mission accomplie ✅
