# 🎨 BRAINSTORM UX/FRONTEND - AppForge

> **Objectif:** Concevoir une expérience bi-modale (Normal/Expert) pour la création d'apps via IA

---

## 📊 ANALYSE DE L'UI ACTUELLE

### Architecture des Pages

```
src/app/
├── (dashboard)/
│   ├── layout.tsx          # Sidebar avec nav (Dashboard, New App, Billing, Settings)
│   ├── dashboard/page.tsx  # Liste des apps avec stats
│   ├── app/
│   │   ├── [id]/page.tsx   # ⭐ PAGE PRINCIPALE - Chat + Preview
│   │   └── new/page.tsx    # Création d'app (choix type + prompt initial)
│   ├── billing/page.tsx    # Gestion facturation
│   └── settings/page.tsx   # Paramètres utilisateur + API keys
```

### Composants de Preview Existants

```
src/components/preview/
├── index.tsx           # Router vers le bon type de preview
├── Preview.tsx         # Composant principal avec Sandpack
├── WebPreview.tsx      # Preview web simple (iframe Sandpack)
├── MobilePreview.tsx   # Mockup iPhone/Android avec preview
├── DesktopPreview.tsx  # Mockup fenêtre macOS/Windows
└── ApiPreview.tsx      # Documentation API interactive
```

### État Actuel de `/app/[id]/page.tsx`

**Layout actuel:**
```
┌────────────────────────────────────────────────────────────┐
│ [Icon] App Name          [Code/Preview] [View Live] [Deploy] │
├────────────────────────────────────────────────────────────┤
│                    │                                        │
│    💬 CHAT         │           📱 PREVIEW                   │
│                    │                                        │
│  Messages list     │   Sandpack iframe                     │
│  avec streaming    │   (ou mockup device)                  │
│                    │                                        │
│  ┌──────────────┐  │                                        │
│  │ Input + Send │  │                                        │
│  └──────────────┘  │                                        │
│                    │                                        │
└────────────────────────────────────────────────────────────┘
```

**Points forts ✅:**
- Streaming des réponses IA
- Support multi-type (Web, iOS, Android, Desktop, API)
- Mockups de devices pour mobile
- Toggle Code/Preview basique
- Deploy Vercel intégré

**Points faibles ❌:**
- Pas de file explorer
- Pas d'édition de code directe par l'utilisateur
- Mode Code = juste un éditeur Sandpack basique
- Pas de terminal
- Pas de diff/highlighting des changements IA
- Pas d'historique des versions
- Preview pas vraiment "immersif"
- Même UI pour débutants et experts

### Technologies Actuelles
- **Preview:** `@codesandbox/sandpack-react` (v2.13.0)
- **State:** Zustand
- **UI:** Radix + Tailwind + shadcn/ui
- **Animation:** Framer Motion

---

## 🎯 DESIGN PROPOSÉ

### Vision Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPFORGE APP EDITOR                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   [MODE NORMAL]                      [MODE EXPERT]                   │
│   Pour créateurs                     Pour développeurs               │
│   ────────────────                   ────────────────                │
│   • Preview ONLY                     • IDE complet                   │
│   • Chat flottant                    • File explorer                 │
│   • Interface épurée                 • Éditeur Monaco                │
│   • "Magic mode"                     • Terminal intégré              │
│                                      • Git-like history              │
│                                                                      │
│              ┌─────────────────────────────────┐                     │
│              │  🔄 TOGGLE: Normal ←→ Expert   │                     │
│              └─────────────────────────────────┘                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 MODE NORMAL (Non-Expert)

### Concept
> L'utilisateur voit et utilise son app comme s'il était un vrai utilisateur.
> Le code est invisible. L'IA est un assistant magique.

### Wireframe ASCII

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back    My Todo App                    👁️ Preview  [🚀 Deploy]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│                  ┌────────────────────────────────┐                 │
│                  │                                │                 │
│                  │                                │                 │
│                  │      🌐 WEB APP PREVIEW        │                 │
│                  │                                │                 │
│                  │   (iframe en plein écran       │                 │
│                  │    ou mockup device            │                 │
│                  │    selon le type)              │                 │
│                  │                                │                 │
│                  │                                │                 │
│                  └────────────────────────────────┘                 │
│                                                                     │
│                  📱 iPhone  |  🖥️ Desktop  |  📐 Responsive         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 💬 "Add a dark mode toggle to the header"              [Send]│  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│       ✨ AI is updating your app...  [████████░░] 80%              │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Features Mode Normal

#### 1. Preview Immersif Multi-Type

```typescript
// Concept: Preview adaptatif selon le type d'app

interface PreviewModes {
  WEB: {
    // iframe responsive avec contrôles de viewport
    viewports: ['mobile', 'tablet', 'desktop', 'fullscreen']
    features: ['hot-reload', 'zoom', 'responsive-ruler']
  },
  IOS: {
    // Simulateur visuel iPhone avec notch/dynamic island
    devices: ['iPhone 15 Pro', 'iPhone SE', 'iPad Pro']
    features: ['status-bar', 'home-indicator', 'safe-areas']
  },
  ANDROID: {
    // Simulateur Pixel/Samsung
    devices: ['Pixel 8', 'Galaxy S24', 'Tablet']
    features: ['nav-bar', 'status-bar', 'material-you']
  },
  PYTHON: {
    // Terminal intégré pour scripts Python
    view: 'terminal-output'
    features: ['run-button', 'output-console', 'variable-inspector']
  },
  API: {
    // Documentation interactive type Swagger
    view: 'api-explorer'
    features: ['endpoint-list', 'try-it', 'response-viewer']
  }
}
```

#### 2. Chat Flottant/Collapsible

```
┌────────────────────────────────────────────┐
│ PREVIEW PLEIN ÉCRAN                        │
│                                            │
│                                            │
│                                            │
│                                            │
│            [Mon app ici]                   │
│                                            │
│                                            │
│                                            │
│    ┌──────────────────────────┐           │
│    │ 💬 Chat avec IA          │  ← Drawer │
│    │                          │    flottant│
│    │ [Conversation...]        │    ou modal│
│    │                          │            │
│    │ ┌────────────────────┐   │            │
│    │ │ Type here...  [↵] │   │            │
│    │ └────────────────────┘   │            │
│    └──────────────────────────┘           │
└────────────────────────────────────────────┘
```

#### 3. Feedback Temps Réel

```typescript
// L'IA fait des changements = animation visuelle sur le preview

interface AIFeedback {
  // Pendant que l'IA travaille
  working: {
    overlay: 'subtle-shimmer'  // Effet shimmer léger sur la preview
    indicator: 'progress-bar'  // Barre de progression en bas
    chat: 'typing-animation'   // L'IA "tape"
  },
  
  // Quand un changement est appliqué
  applied: {
    highlight: 'pulse-animation'  // Zone modifiée pulse brièvement
    toast: 'success-message'      // "✨ Dark mode added!"
    sound: 'subtle-chime'         // Son optionnel (désactivable)
  }
}
```

#### 4. Actions Rapides

```
┌─────────────────────────────────────────┐
│ 🎨 Quick Actions (suggestions IA)       │
├─────────────────────────────────────────┤
│                                         │
│  [🌙 Add dark mode]  [📱 Make responsive] │
│                                         │
│  [🔐 Add login]      [💾 Add database]  │
│                                         │
│  [⚡ Improve speed]  [🎨 Change colors]  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🛠️ MODE EXPERT (Toggle)

### Concept
> IDE complet dans le browser. Le développeur a le contrôle total.
> Il peut modifier le code directement OU demander à l'IA.

### Wireframe ASCII - Layout Principal

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back   My App   [Normal 🔘 Expert]   [▶️ Run]  [💾 Save]  [🚀 Deploy]  │
├────────┬─────────────────────────────────────────┬───────────────────────┤
│        │                                          │                      │
│ FILES  │            CODE EDITOR                   │      PREVIEW         │
│        │                                          │                      │
│ 📁 src │  ┌─ App.tsx ─┬─ index.css ─┬─ + ─┐     │  ┌────────────────┐  │
│  📄 App│  │                                │     │  │                │  │
│  📄 idx│  │ import React from 'react'      │     │  │  [Live Preview]│  │
│ 📁 comp│  │                                │     │  │                │  │
│  📄 But│  │ export default function App() {│     │  │                │  │
│  📄 Hea│  │   return (                     │     │  │                │  │
│ 📁 lib │  │     <div className="app">      │     │  └────────────────┘  │
│  📄 uti│  │ +     <h1>Hello World</h1>    │← AI │                      │
│        │  │ +     <DarkModeToggle />      │diff │  📱 Mobile | 🖥️ Desktop│
│        │  │     </div>                     │     │                      │
│        │  │   )                            │     │                      │
│        │  │ }                              │     │                      │
│        │  └────────────────────────────────┘     │                      │
│        │                                          │                      │
├────────┴──────────────────────────────────┬──────┴───────────────────────┤
│                  💬 AI CHAT               │         ⬛ TERMINAL           │
│                                           │                              │
│ 👤 "Add a dark mode toggle"               │ $ npm run dev                │
│                                           │ ready - started server on    │
│ 🤖 "I'll add a DarkModeToggle component"  │ localhost:3000               │
│    "Here's what I changed: [show diff]"   │                              │
│                                           │ $ _                          │
│ ┌─────────────────────────────────────┐   │                              │
│ │ Ask AI to help...              [↵] │   │                              │
│ └─────────────────────────────────────┘   │                              │
└───────────────────────────────────────────┴──────────────────────────────┘
```

### Layout Variants

```typescript
// Layouts configurables par l'utilisateur

type ExpertLayout = 
  | 'classic'      // Files | Editor | Preview (horizontal)
  | 'ide'          // Files | Editor+Terminal | Preview
  | 'focus-code'   // Files | Editor (full width) | Chat overlay
  | 'focus-preview'// Chat | Preview (full width)
  | 'side-by-side' // Editor | Preview (50/50)
```

### Features Mode Expert

#### 1. File Explorer Complet

```typescript
interface FileExplorer {
  features: {
    tree: true,              // Vue arborescence
    search: true,            // Recherche fichiers (Cmd+P)
    createFile: true,        // Nouveau fichier/dossier
    rename: true,            // Renommer
    delete: true,            // Supprimer
    dragDrop: true,          // Réorganiser
    contextMenu: true,       // Clic droit
    gitStatus: true,         // Indicateurs modifié/ajouté
  },
  
  // Icons par type de fichier
  icons: {
    '.tsx': 'react-icon',
    '.ts': 'typescript-icon',
    '.css': 'css-icon',
    '.json': 'json-icon',
    // etc.
  }
}
```

**Composant suggéré:** Utiliser une lib légère ou custom avec `react-arborist` ou similaire.

#### 2. Éditeur de Code Avancé

```typescript
interface CodeEditor {
  engine: 'monaco-editor',  // Même éditeur que VS Code
  
  features: {
    // Basiques
    syntaxHighlight: true,
    autoComplete: true,
    multiCursor: true,
    minimap: true,
    
    // Avancés
    inlineErrors: true,       // TypeScript errors inline
    formatOnSave: true,       // Prettier auto
    emmet: true,              // Raccourcis HTML/CSS
    multiTab: true,           // Plusieurs fichiers ouverts
    splitView: true,          // Diviser l'éditeur
    
    // AI-specific
    aiDiffHighlight: true,    // Voir les changements IA
    aiInlineEdit: true,       // "Edit this" sur sélection
    copilotStyle: true,       // Suggestions inline
  }
}
```

**Composants suggérés:**
- `@monaco-editor/react` pour l'éditeur principal
- Ou garder Sandpack mais en mode "full IDE" avec `SandpackFileExplorer`

#### 3. Diff Highlighting (Changements IA)

```
┌─────────────────────────────────────────────────────────────┐
│  App.tsx                                    [Accept] [Reject]│
├─────────────────────────────────────────────────────────────┤
│   1 │ import React from 'react'                             │
│   2 │ + import { DarkModeToggle } from './components'       │ ← Ajout
│   3 │                                                        │
│   4 │ export default function App() {                        │
│   5 │   return (                                             │
│   6 │     <div className="app">                              │
│   7 │ -     <h1>Hello World</h1>                            │ ← Supprimé
│   8 │ +     <h1 className="text-2xl font-bold">             │ ← Modifié
│   9 │ +       Hello World                                    │
│  10 │ +     </h1>                                            │
│  11 │ +     <DarkModeToggle />                               │ ← Ajout
│  12 │     </div>                                             │
│  13 │   )                                                    │
│  14 │ }                                                      │
└─────────────────────────────────────────────────────────────┘
```

```typescript
interface AIDiffView {
  // Options d'affichage
  display: 'inline' | 'side-by-side' | 'unified',
  
  // Actions
  actions: {
    acceptAll: () => void,
    rejectAll: () => void,
    acceptChunk: (chunkId: string) => void,
    rejectChunk: (chunkId: string) => void,
  },
  
  // Styling
  colors: {
    added: '#22c55e20',     // Vert transparent
    removed: '#ef444420',   // Rouge transparent
    modified: '#3b82f620',  // Bleu transparent
  }
}
```

#### 4. Terminal Intégré

```typescript
interface Terminal {
  engine: 'xterm.js',
  
  features: {
    multiTab: true,           // Plusieurs terminaux
    split: true,              // Split horizontal/vertical
    customCommands: true,     // npm run dev, etc.
    output: true,             // Voir les logs
    input: true,              // Taper des commandes
  },
  
  presets: [
    { name: 'Dev Server', command: 'npm run dev' },
    { name: 'Build', command: 'npm run build' },
    { name: 'Test', command: 'npm test' },
    { name: 'Lint', command: 'npm run lint' },
  ]
}
```

**Note:** Pour un vrai terminal, il faudra un backend (WebContainer de StackBlitz ou serveur).

#### 5. Historique des Versions (Git-like)

```
┌─────────────────────────────────────────────────────────────┐
│  📜 Version History                                [Close]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ● v12 - Now                                                 │
│  │  "Added dark mode toggle" - AI                           │
│  │  2 files changed                                         │
│  │  [View] [Restore]                                        │
│  │                                                          │
│  ● v11 - 5 min ago                                          │
│  │  "Fixed responsive layout" - AI                          │
│  │  1 file changed                                          │
│  │  [View] [Restore]                                        │
│  │                                                          │
│  ● v10 - 12 min ago                                         │
│  │  "Manual edit: updated colors" - You                     │
│  │  1 file changed                                          │
│  │  [View] [Restore]                                        │
│  │                                                          │
│  ● v9 - 20 min ago                                          │
│     "Added header component" - AI                           │
│     3 files changed                                         │
│     [View] [Restore]                                        │
│                                                              │
│  [Load more...]                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```typescript
interface VersionHistory {
  // Chaque version
  version: {
    id: string,
    timestamp: Date,
    author: 'ai' | 'user',
    description: string,
    files: {
      path: string,
      action: 'added' | 'modified' | 'deleted',
      diff?: string,
    }[],
  },
  
  // Actions
  actions: {
    view: (versionId: string) => void,      // Voir le code à cette version
    restore: (versionId: string) => void,   // Restaurer cette version
    compare: (v1: string, v2: string) => void, // Comparer 2 versions
    branch: (versionId: string) => void,    // Créer une branche
  }
}
```

---

## 🎨 VISUALISATION MULTI-TYPE

### Stratégie Unifiée

```typescript
// Un seul composant Preview intelligent

interface UnifiedPreview {
  // Detection automatique ou manuelle
  type: 'WEB' | 'PYTHON' | 'IOS' | 'ANDROID' | 'DESKTOP' | 'API' | 'CLI',
  
  // Rendu adaptatif
  render: () => {
    switch(type) {
      case 'WEB':
        return <SandpackPreview /> // ou iframe custom
      case 'PYTHON':
        return <PythonRunner />    // Pyodide ou backend
      case 'IOS':
        return <DeviceMockup device="iphone" />
      case 'ANDROID':
        return <DeviceMockup device="pixel" />
      case 'DESKTOP':
        return <WindowMockup os="macos" />
      case 'API':
        return <ApiExplorer />
      case 'CLI':
        return <TerminalOutput />
    }
  }
}
```

### 1. Web Apps

```typescript
// Options de preview web

interface WebPreviewOptions {
  // Modes de rendu
  renderer: 'sandpack' | 'iframe' | 'webcontainer',
  
  // Contrôles de viewport
  viewport: {
    presets: [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 15', width: 393, height: 852 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 },
    ],
    custom: true,  // Dimensions custom
    responsive: true, // Mode responsive (drag to resize)
  },
  
  // Features
  hotReload: true,
  devTools: false,  // Console du navigateur
  zoom: [50, 75, 100, 125, 150],
}
```

### 2. Python Apps

```typescript
// Exécution Python dans le browser

interface PythonPreview {
  // Engine
  runtime: 'pyodide' | 'skulpt' | 'backend-sandbox',
  
  // UI
  layout: {
    codeInput: true,      // Zone de code
    runButton: true,      // Bouton exécuter
    output: true,         // Console output
    variables: true,      // Inspecteur de variables
    plots: true,          // Matplotlib/Plotly
  },
  
  // Packages supportés
  packages: ['numpy', 'pandas', 'matplotlib', 'requests'],
}
```

**Wireframe Python:**
```
┌────────────────────────────────────────────────────────────┐
│  🐍 Python Script                              [▶️ Run]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  # main.py                                                 │
│  import pandas as pd                                       │
│                                                            │
│  data = pd.DataFrame({                                     │
│      'name': ['Alice', 'Bob'],                            │
│      'age': [25, 30]                                       │
│  })                                                        │
│                                                            │
│  print(data)                                               │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  📤 Output                                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │     name  age                                         │ │
│  │ 0  Alice   25                                         │ │
│  │ 1    Bob   30                                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  📊 Variables: data (DataFrame), ...                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 3. Mobile Apps (iOS/Android)

```typescript
// Simulateur visuel mobile

interface MobilePreview {
  // Device frames
  devices: {
    ios: ['iPhone 15 Pro', 'iPhone 15', 'iPhone SE', 'iPad Pro'],
    android: ['Pixel 8', 'Galaxy S24', 'Pixel Tablet'],
  },
  
  // Features du simulateur
  features: {
    statusBar: true,       // Heure, batterie, signal
    navigationBar: true,   // Home indicator / nav buttons
    notch: true,          // Dynamic Island / Notch
    safeAreas: true,      // Guides visuels
    rotate: true,         // Portrait/Landscape
    darkMode: true,       // Simuler dark/light
  },
  
  // Interactions
  interactions: {
    touch: true,          // Simuler touch
    gestures: false,      // Swipe, pinch (limité dans browser)
    keyboard: true,       // Clavier virtuel
  }
}
```

**Wireframe Mobile amélioré:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   📱 Device: [iPhone 15 Pro ▼]    🔄 Rotate   🌙 Dark     │
│                                                            │
│          ┌─────────────────────────────┐                   │
│          │  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  │ ← Dynamic Island  │
│          │ ┌───────────────────────┐  │                   │
│          │ │    9:41          📶🔋│  │ ← Status bar      │
│          │ ├───────────────────────┤  │                   │
│          │ │                       │  │                   │
│          │ │                       │  │                   │
│          │ │     [App Content]     │  │                   │
│          │ │                       │  │                   │
│          │ │                       │  │                   │
│          │ │                       │  │                   │
│          │ │                       │  │                   │
│          │ ├───────────────────────┤  │                   │
│          │ │    ═══════════════    │  │ ← Home indicator  │
│          │ └───────────────────────┘  │                   │
│          └─────────────────────────────┘                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4. API/Backend

```typescript
// Documentation API interactive (style Swagger/Postman)

interface ApiPreview {
  // Parsing automatique des endpoints
  parser: 'openapi' | 'code-analysis',
  
  // Features
  features: {
    endpointList: true,    // Liste des routes
    tryIt: true,           // Tester les endpoints
    requestBuilder: true,  // Construire requêtes
    responseViewer: true,  // Voir réponses
    codeGen: true,         // Générer code client
    documentation: true,   // Docs auto-générées
  },
  
  // Mock ou réel
  mode: 'mock' | 'sandbox' | 'production',
}
```

---

## 💬 UX DU CHAT + CODE

### Intégration Chat/Editor

```typescript
// Le chat est contextuellement conscient

interface SmartChat {
  // Contexte automatique
  context: {
    currentFile: string,          // Fichier ouvert
    selection: string | null,     // Code sélectionné
    errors: Error[],              // Erreurs TypeScript
    recentChanges: Diff[],        // Changements récents
  },
  
  // Actions rapides
  quickActions: [
    { trigger: '/fix', action: 'Fix errors in current file' },
    { trigger: '/explain', action: 'Explain selected code' },
    { trigger: '/refactor', action: 'Refactor selection' },
    { trigger: '/test', action: 'Generate tests' },
    { trigger: '/doc', action: 'Add documentation' },
  ],
  
  // Références inline
  mentions: {
    files: '@filename',     // Référencer un fichier
    functions: '#function', // Référencer une fonction
    lines: 'L10-20',       // Référencer des lignes
  }
}
```

### Changements IA en Temps Réel

```typescript
// Flow de mise à jour

interface AIUpdateFlow {
  // 1. L'user envoie un message
  userMessage: string,
  
  // 2. L'IA stream sa réponse
  streaming: {
    explanation: true,     // Texte explicatif
    codeBlocks: true,     // Blocs de code
    progressIndicator: true,
  },
  
  // 3. Diff appliqué progressivement
  diffApplication: {
    mode: 'progressive',   // Ligne par ligne avec animation
    highlight: true,       // Mettre en évidence les changements
    preview: true,         // Voir avant/après
  },
  
  // 4. Actions post-changement
  postChange: {
    autoSave: true,
    hotReload: true,
    versionSnapshot: true,
    toast: 'Changes applied successfully',
  }
}
```

**Animation de diff en temps réel:**
```
┌─────────────────────────────────────────────────────────────┐
│  App.tsx                                     🔄 AI editing...│
├─────────────────────────────────────────────────────────────┤
│   1 │ import React from 'react'                             │
│   2 │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Typing
│   3 │                                                        │
│   4 │ export default function App() {                        │
│   5 │   return (                                             │
│   6 │     <div>                                              │
│   7 │ ▓▓▓ <DarkModeToggle /> ▓▓▓                            │ ← Nouveau
│   8 │     </div>                                             │
│   9 │   )                                                    │
│  10 │ }                                                      │
└─────────────────────────────────────────────────────────────┘

Legend:
░░░ = AI is typing here
▓▓▓ = Newly added code (highlighted)
```

### Historique des Versions Accessible

```
┌──────────────────────────────────────────────────────────────────────┐
│ 💬 Chat                                              📜 History ▼    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  👤 Add a dark mode toggle to the app                                │
│                                                                       │
│  🤖 I'll add a dark mode toggle. Here's what I'll do:                │
│                                                                       │
│     1. Create DarkModeToggle component                               │
│     2. Add it to the header                                          │
│     3. Update CSS for dark mode                                      │
│                                                                       │
│     ┌─────────────────────────────────────────────┐                  │
│     │ 📝 Changes made:                            │                  │
│     │  • Created /components/DarkModeToggle.tsx   │                  │
│     │  • Modified /App.tsx (+5 lines)             │                  │
│     │  • Modified /styles.css (+12 lines)         │                  │
│     │                                             │                  │
│     │  [View Diff]  [Undo Changes]  [Restore v11] │                  │
│     └─────────────────────────────────────────────┘                  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 COMPOSANTS À CRÉER/MODIFIER

### Nouveaux Composants

```
src/components/
├── editor/
│   ├── CodeEditor.tsx           # Monaco editor wrapper
│   ├── FileExplorer.tsx         # Arborescence de fichiers
│   ├── FileTabs.tsx             # Onglets de fichiers ouverts
│   ├── DiffViewer.tsx           # Affichage des diffs
│   ├── Terminal.tsx             # Terminal xterm.js
│   └── MiniMap.tsx              # Mini-carte du code
│
├── preview/
│   ├── PreviewContainer.tsx     # Container unifié
│   ├── ViewportControls.tsx     # Contrôles responsive
│   ├── DeviceMockup.tsx         # Frame de device (amélioration)
│   ├── PythonRunner.tsx         # Exécution Python
│   └── TerminalOutput.tsx       # Output console
│
├── chat/
│   ├── ChatPanel.tsx            # Panel de chat (existe, à améliorer)
│   ├── ChatDrawer.tsx           # Version drawer/overlay
│   ├── MessageBubble.tsx        # Bulles de messages améliorées
│   ├── CodeChangeCard.tsx       # Carte des changements
│   └── QuickActions.tsx         # Suggestions rapides
│
├── history/
│   ├── VersionHistory.tsx       # Timeline des versions
│   ├── VersionCard.tsx          # Carte d'une version
│   └── DiffModal.tsx            # Modal de comparaison
│
├── layout/
│   ├── EditorLayout.tsx         # Layout du mode expert
│   ├── ImmersiveLayout.tsx      # Layout du mode normal
│   ├── ResizablePanes.tsx       # Panneaux redimensionnables
│   └── ModeToggle.tsx           # Switch Normal/Expert
│
└── ui/
    ├── ProgressBar.tsx          # Pour l'IA qui travaille
    └── ShimmerOverlay.tsx       # Effet shimmer sur preview
```

### Composants à Modifier

| Composant | Modification |
|-----------|-------------|
| `page.tsx` (`/app/[id]`) | Ajouter le toggle Mode Normal/Expert, refactorer en layouts |
| `Preview.tsx` | Extraire la logique, ajouter les contrôles |
| `MobilePreview.tsx` | Améliorer les mockups, ajouter plus de devices |
| `ApiPreview.tsx` | Améliorer l'interactivité |
| `providers.tsx` | Ajouter context pour le mode (normal/expert) |
| `app.ts` (store) | Ajouter état pour editor, history, mode |

---

## 📚 LIBRAIRIES RECOMMANDÉES

### Éditeur de Code

| Librairie | Usage | Recommandation |
|-----------|-------|----------------|
| `@monaco-editor/react` | Éditeur Monaco (VS Code) | ⭐⭐⭐ **Recommandé** pour mode Expert |
| `@codesandbox/sandpack-react` | Preview + éditeur simple | ✅ Garder pour mode Normal |
| `@uiw/react-codemirror` | Alternative plus légère | Option si Monaco trop lourd |

### Terminal

| Librairie | Usage | Recommandation |
|-----------|-------|----------------|
| `xterm.js` + `@xterm/xterm` | Terminal complet | ⭐⭐⭐ **Standard de l'industrie** |
| `@xterm/addon-fit` | Auto-resize terminal | Addon requis |
| `@xterm/addon-web-links` | Liens cliquables | Nice to have |

### File Explorer

| Librairie | Usage | Recommandation |
|-----------|-------|----------------|
| `react-arborist` | Tree view performant | ⭐⭐⭐ Simple et efficace |
| Custom + Radix | Plus de contrôle | Option pour customisation totale |

### Diff View

| Librairie | Usage | Recommandation |
|-----------|-------|----------------|
| `react-diff-viewer-continued` | Diff side-by-side | ⭐⭐ Simple |
| Monaco diff editor | Diff intégré Monaco | ⭐⭐⭐ **Meilleur si Monaco utilisé** |

### Python Runtime

| Librairie | Usage | Recommandation |
|-----------|-------|----------------|
| `pyodide` | Python dans le browser | ⭐⭐⭐ **Le plus complet** |
| `skulpt` | Python léger | Alternative plus simple |

### Layout Resizable

| Librairie | Usage | Recommandation |
|-----------|-------|----------------|
| `react-resizable-panels` | Panneaux redimensionnables | ⭐⭐⭐ **Parfait pour IDE layout** |
| `allotment` | Alternative | Aussi très bien |

### Animation

| Librairie | Usage | Recommandation |
|-----------|-------|----------------|
| `framer-motion` | Animations (déjà installé) | ✅ Garder |

---

## 📋 PLAN D'IMPLÉMENTATION

### Phase 1: Fondations (1-2 semaines)

```
Week 1:
├── [ ] Créer le contexte Mode (Normal/Expert)
├── [ ] Créer ModeToggle component
├── [ ] Créer les 2 layouts de base (Immersive/Editor)
├── [ ] Refactorer page.tsx pour utiliser les layouts
└── [ ] Tests de base

Week 2:
├── [ ] Améliorer le chat (drawer mode pour Normal)
├── [ ] Ajouter contrôles de viewport au preview
├── [ ] Améliorer les device mockups
└── [ ] Feedback temps réel basique (shimmer, progress)
```

### Phase 2: Mode Expert (2-3 semaines)

```
Week 3:
├── [ ] Intégrer Monaco Editor
├── [ ] Créer FileExplorer component
├── [ ] Créer FileTabs component
├── [ ] Layout resizable avec react-resizable-panels
└── [ ] Sync entre editor et preview

Week 4:
├── [ ] Intégrer xterm.js pour terminal
├── [ ] Commands presets (npm run dev, etc.)
├── [ ] Multi-tab terminal
└── [ ] Backend pour exécution si nécessaire

Week 5:
├── [ ] DiffViewer pour changements IA
├── [ ] Accept/Reject changes UI
├── [ ] Animation diff en temps réel
└── [ ] Inline AI suggestions (style Copilot)
```

### Phase 3: Historique & Polish (1-2 semaines)

```
Week 6:
├── [ ] Version History component
├── [ ] Stockage des versions (DB schema update)
├── [ ] Restore/compare versions
├── [ ] Timeline UI
└── [ ] Git-like branching (optionnel)

Week 7:
├── [ ] Python runtime avec Pyodide
├── [ ] Améliorer API preview
├── [ ] Quick Actions intelligentes
├── [ ] Keyboard shortcuts
└── [ ] Accessibility
└── [ ] Performance optimization
```

### Phase 4: Polish & Testing (1 semaine)

```
Week 8:
├── [ ] Tests E2E
├── [ ] Responsive design
├── [ ] Dark mode complet
├── [ ] Documentation utilisateur
└── [ ] Beta testing
```

---

## 🎯 PRIORITÉS (MVP)

Si temps limité, focus sur:

1. **🥇 Toggle Normal/Expert** - La feature principale
2. **🥈 Monaco Editor** - L'upgrade clé pour Expert mode
3. **🥉 File Explorer** - Essentiel pour l'IDE
4. **4️⃣ Diff Highlighting** - Voir les changements IA
5. **5️⃣ Chat Drawer** - Pour mode Normal immersif

Le terminal et Python peuvent venir après le MVP.

---

## 📐 SCHEMA DB UPDATES (si nécessaire)

```prisma
// Ajouts au schema.prisma

model AppVersion {
  id          String   @id @default(cuid())
  appId       String
  app         App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  
  version     Int      // Numéro de version
  files       Json     // Snapshot des fichiers
  description String?  // Description du changement
  author      String   // 'ai' | 'user'
  
  createdAt   DateTime @default(now())
  
  @@index([appId])
}

model App {
  // ... existing fields ...
  versions    AppVersion[]
  
  // Préférences de l'éditeur
  editorMode  String    @default("normal") // 'normal' | 'expert'
  editorLayout String?  // Layout préféré
}
```

---

## 🔗 RÉFÉRENCES

- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)
- [Sandpack](https://sandpack.codesandbox.io/)
- [xterm.js](https://xtermjs.org/)
- [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
- [react-arborist](https://github.com/brimdata/react-arborist)
- [Pyodide](https://pyodide.org/)
- [VS Code Web](https://github.com/nicedoc/vscode-web) (inspiration)
- [StackBlitz WebContainer](https://webcontainers.io/)

---

> **Document créé:** $(date)
> **Auteur:** Expert UX/Frontend Agent
> **Status:** BRAINSTORM - À valider avec l'équipe
