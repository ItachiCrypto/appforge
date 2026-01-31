# 📱 Plan Équipe 2 - Types d'App & Preview

## 🎯 Objectif
Permettre à l'utilisateur de choisir le type d'application lors de la création et afficher le preview approprié pour chaque type.

---

## 📊 Analyse de l'Existant

### ✅ Ce qui existe déjà
- **Schéma Prisma** : L'enum `AppType` existe avec `WEB | IOS | ANDROID | DESKTOP | API`
- **Preview Web** : Sandpack fonctionne pour React
- **Templates** : 4 templates web (Landing, Dashboard, Portfolio, E-commerce)

### ❌ Ce qui manque
- Sélection du type lors de la création
- Preview adapté à chaque type d'app
- Templates spécifiques par type
- Fichiers par défaut pour chaque type

---

## 🏗️ Architecture des Modifications

### 1️⃣ Page de Création (`/app/new/page.tsx`)

**Nouveau flux utilisateur :**
```
1. Choix du type d'app (cartes avec icônes)
2. Nom + Description 
3. Choix d'un template (filtré par type)
4. Création
```

**Nouveau composant : `AppTypeSelector`**
```tsx
const APP_TYPES = [
  { id: 'WEB', name: 'Web App', icon: Globe, description: 'React / Next.js' },
  { id: 'IOS', name: 'iOS App', icon: Apple, description: 'React Native / Swift' },
  { id: 'ANDROID', name: 'Android App', icon: Smartphone, description: 'React Native / Kotlin' },
  { id: 'DESKTOP', name: 'Desktop App', icon: Monitor, description: 'Electron' },
  { id: 'API', name: 'API / Backend', icon: Server, description: 'Node.js / Express' },
]
```

### 2️⃣ Constantes (`/lib/constants.ts`)

**Nouveaux fichiers par défaut par type :**

```typescript
export const DEFAULT_FILES_BY_TYPE = {
  WEB: { /* fichiers React existants */ },
  IOS: { /* fichiers React Native + mockup */ },
  ANDROID: { /* fichiers React Native + mockup */ },
  DESKTOP: { /* fichiers Electron */ },
  API: { /* fichiers Node.js + endpoints */ },
}

export const TEMPLATES_BY_TYPE = {
  WEB: [/* templates web actuels */],
  IOS: [/* templates mobile */],
  ANDROID: [/* templates mobile */],
  DESKTOP: [/* templates desktop */],
  API: [/* templates API */],
}
```

### 3️⃣ API Apps (`/api/apps/route.ts`)

**Modifications POST :**
```typescript
// Accepter le type
const { name, description, type = 'WEB' } = body

// Utiliser les fichiers par défaut du type
const app = await prisma.app.create({
  data: {
    name,
    description,
    type,  // <-- Nouveau
    files: DEFAULT_FILES_BY_TYPE[type],
    userId: user.id,
    conversationId: conversation.id,
  },
})
```

### 4️⃣ Éditeur (`/app/[id]/page.tsx`)

**Nouveau système de preview dynamique :**

```tsx
// Composants de preview par type
import { WebPreview } from '@/components/preview/WebPreview'
import { MobilePreview } from '@/components/preview/MobilePreview'
import { DesktopPreview } from '@/components/preview/DesktopPreview'
import { ApiPreview } from '@/components/preview/ApiPreview'

const PREVIEW_COMPONENTS = {
  WEB: WebPreview,
  IOS: MobilePreview,
  ANDROID: MobilePreview,
  DESKTOP: DesktopPreview,
  API: ApiPreview,
}

// Dans le render
const PreviewComponent = PREVIEW_COMPONENTS[app.type]
<PreviewComponent files={files} type={app.type} />
```

### 5️⃣ Nouveaux Composants de Preview

```
src/components/preview/
├── WebPreview.tsx        # Sandpack (existant, extraire)
├── MobilePreview.tsx     # Frame iPhone/Android avec iframe
├── DesktopPreview.tsx    # Frame fenêtre desktop
├── ApiPreview.tsx        # Liste endpoints + tester
└── index.ts              # Export commun
```

---

## 📁 Fichiers à Créer/Modifier

### Créer
| Fichier | Description |
|---------|-------------|
| `src/components/preview/WebPreview.tsx` | Sandpack extrait |
| `src/components/preview/MobilePreview.tsx` | Mockup mobile |
| `src/components/preview/DesktopPreview.tsx` | Mockup desktop |
| `src/components/preview/ApiPreview.tsx` | Affichage endpoints |
| `src/components/preview/index.ts` | Exports |
| `src/components/app-type-selector.tsx` | Sélecteur de type |

### Modifier
| Fichier | Modifications |
|---------|---------------|
| `src/lib/constants.ts` | Ajouter DEFAULT_FILES_BY_TYPE, TEMPLATES_BY_TYPE |
| `src/app/(dashboard)/app/new/page.tsx` | Ajouter sélection type |
| `src/app/(dashboard)/app/[id]/page.tsx` | Preview dynamique par type |
| `src/app/api/apps/route.ts` | Accepter et stocker le type |

---

## 🎨 Design des Previews

### Mobile Preview (iOS/Android)
```
┌─────────────────────────┐
│  ▄▄▄    iPhone 15     ▄▄▄│  <- Barre status
├─────────────────────────┤
│                         │
│    [iframe sandbox]     │  <- Preview React Native
│    ou mockup visuel     │
│                         │
├─────────────────────────┤
│      ●      ▬      ◀    │  <- Boutons nav
└─────────────────────────┘
```

### Desktop Preview (Electron)
```
┌─────────────────────────────────────┐
│ ● ● ●   My Desktop App         ─ □ ✕│ <- Title bar
├─────────────────────────────────────┤
│                                     │
│         [iframe sandbox]            │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### API Preview
```
┌─────────────────────────────────────┐
│ 📡 API Endpoints                    │
├─────────────────────────────────────┤
│ GET  /api/users      → 200 OK       │
│ POST /api/users      → 201 Created  │
│ GET  /api/users/:id  → 200 OK       │
├─────────────────────────────────────┤
│ [Try it] Sélectionner endpoint...   │
│ Response: { "users": [...] }        │
└─────────────────────────────────────┘
```

---

## 🔧 Implémentation par Étapes

### Phase 1: Infrastructure (30 min) ✅ TERMINÉ
1. [x] Modifier `constants.ts` - Ajouter fichiers par défaut par type
2. [x] Modifier `api/apps/route.ts` - Accepter le type

### Phase 2: Page de Création (45 min) ✅ TERMINÉ
3. [x] Créer `app-type-selector.tsx`
4. [x] Modifier `new/page.tsx` - Intégrer le sélecteur + templates par type

### Phase 3: Composants Preview (1h30) ✅ TERMINÉ
5. [x] Créer `WebPreview.tsx` (extraire de l'éditeur)
6. [x] Créer `MobilePreview.tsx` (frame iPhone/Android)
7. [x] Créer `DesktopPreview.tsx` (frame fenêtre desktop)
8. [x] Créer `ApiPreview.tsx` (liste endpoints)

### Phase 4: Intégration Éditeur (30 min) ✅ TERMINÉ
9. [x] Modifier `app/[id]/page.tsx` - Preview dynamique

### Phase 5: Tests (30 min) ⏳ À FAIRE
10. [ ] Tester création de chaque type
11. [ ] Vérifier les previews

---

## 📦 Dépendances

Aucune nouvelle dépendance requise ! 
- Sandpack déjà installé pour web
- CSS Tailwind pour les mockups mobile/desktop
- API preview = pure UI

---

## 🚀 Prêt pour l'Implémentation

**Responsabilités suggérées :**
- **Dev 1** : Phase 1 + 2 (Backend + Page création)
- **Dev 2** : Phase 3 (Composants Preview)
- **Dev 3** : Phase 4 + 5 (Intégration + Tests)

---

*Plan créé par Équipe 2 - Coordinateur*
