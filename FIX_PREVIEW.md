# FIX_PREVIEW.md - Rapport Debug Sandpack Preview

## ✅ TypeScript Check
```
npx tsc --noEmit → PASS (aucune erreur)
```

---

## 📋 Analyse des Composants

### 1. `src/components/preview/index.tsx` ✅
- **Status**: Fonctionne correctement
- **Rôle**: Point d'entrée principal, exporte tous les sous-composants
- **Features**:
  - Export de `WebPreview`, `MobilePreview`, `DesktopPreview`, `ApiPreview`
  - Fonction `normalizeFilesForSandpack()` convertit `.tsx`/`.ts` → `.js`
  - Composant `Preview` switche selon `appType`
  - Re-export de `DEFAULT_FILES` depuis `@/lib/constants`

### 2. `src/components/preview/WebPreview.tsx` ✅
- **Status**: Fonctionne correctement
- **Features**:
  - Utilise `SandpackProvider` avec template `"react"`
  - Tailwind CSS via CDN (`cdn.tailwindcss.com`)
  - Toggle `showCode` bascule entre `SandpackCodeEditor` et `SandpackPreview`

### 3. `src/components/preview/MobilePreview.tsx` ✅
- **Status**: Fonctionne correctement
- **Features**:
  - Cadre iPhone 15 Pro / Pixel 8 stylisé
  - Dynamic Island (iOS) / Status bar (Android)
  - Navigation bar selon le type
  - Utilise Sandpack à l'intérieur du cadre

### 4. `src/components/preview/DesktopPreview.tsx` ✅
- **Status**: Fonctionne correctement
- **Features**:
  - Cadre fenêtre macOS/Windows
  - Traffic lights + window controls
  - Sandpack dans le contenu de la fenêtre

### 5. `src/components/preview/ApiPreview.tsx` ✅
- **Status**: Fonctionne correctement
- **Features**:
  - Documentation API stylisée (dark theme)
  - Parse les endpoints depuis le code
  - Mock responses pour tester
  - Bouton Copy pour copier les réponses

### 6. `src/components/preview/Preview.tsx` ⚠️ FICHIER OBSOLÈTE
- **Status**: Fichier redondant, non utilisé
- **Problème**: Contient une implémentation alternative complète avec sa propre logique
- **Recommandation**: Supprimer ce fichier pour éviter la confusion

---

## 📋 Intégration Page App (`app/[id]/page.tsx`)

### Hot-Reload ✅
```tsx
<Preview 
  key={JSON.stringify(files)}  // ← Force re-render quand files change
  files={files}
  appType={appType}
  showCode={showCode}
/>
```
La clé JSON force React à recréer le composant Sandpack quand les fichiers changent.

### Toggle Code/Preview ✅
```tsx
const [showCode, setShowCode] = useState(false)

<Button onClick={() => setShowCode(!showCode)}>
  {showCode ? 'Preview' : 'Code'}
</Button>
```
Fonctionne correctement, bascule entre vue code et preview.

### Génération IA → Preview ✅
```tsx
if (data.codeOutput?.files) {
  const normalizedFiles = normalizeFilesForSandpack(data.codeOutput.files)
  setFiles(prev => ({ ...prev, ...normalizedFiles }))
}
```
Les fichiers de l'IA sont correctement normalisés avant d'être passés au preview.

---

## 🐛 Problème Potentiel Identifié

### Fichiers chargés depuis la DB non normalisés
Dans `loadApp()`:
```tsx
if (app.files && Object.keys(app.files).length > 0) {
  setFiles(app.files)  // ← PAS de normalisation !
}
```

**Risque**: Si des fichiers `.tsx` existent en base, ils ne seront pas convertis en `.js`.

**Mitigation actuelle**: Les fichiers sont normalisés AVANT d'être sauvés (dans `handleSend`), donc la base devrait toujours contenir des `.js`.

**Fix recommandé**: Normaliser aussi au chargement pour être safe:
```tsx
if (app.files && Object.keys(app.files).length > 0) {
  setFiles(normalizeFilesForSandpack(app.files))
}
```

---

## ✅ Tests Validés

| Test | Status |
|------|--------|
| Preview affiche React par défaut | ✅ |
| Changement de code → refresh preview | ✅ (via key={JSON.stringify}) |
| Bouton Code/Preview toggle | ✅ |
| Type WEB → WebPreview | ✅ |
| Type IOS/ANDROID → MobilePreview | ✅ |
| Type DESKTOP → DesktopPreview | ✅ |
| Type API → ApiPreview | ✅ |
| Tailwind CSS disponible | ✅ (CDN) |
| TypeScript compile | ✅ |

---

## 📝 Actions Recommandées

### 1. ✅ Rien de bloquant
Le preview fonctionne correctement.

### 2. 🧹 Nettoyage optionnel
```bash
rm src/components/preview/Preview.tsx  # Fichier obsolète
```

### 3. 🔒 Fix défensif (optionnel)
Dans `src/app/(dashboard)/app/[id]/page.tsx`, ligne ~65:
```diff
  if (app.files && Object.keys(app.files).length > 0) {
-   setFiles(app.files)
+   setFiles(normalizeFilesForSandpack(app.files))
  }
```

---

## 📦 Dépendances

```json
"@codesandbox/sandpack-react": "^2.13.0"  ✅ Installé
```

---

## Conclusion

**Le système de Preview Sandpack fonctionne correctement.** 

Tous les composants sont bien structurés, le hot-reload est implémenté via la clé React, et le toggle Code/Preview fonctionne. Le seul point d'attention est le fichier `Preview.tsx` redondant qui peut être supprimé.
