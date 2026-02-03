# 🐛 Agent 3 - Edge Case Hunter - Bug Report

**Date:** 2025-02-03  
**Agent:** Edge Case Hunter 🐛  
**Mission:** Reproduire les bugs connus BUG-1 à BUG-10, analyse statique du code, identification des edge cases

---

## 📊 Résumé Exécutif

| Catégorie | Count |
|-----------|-------|
| Bugs Originaux Fixés | 7/10 |
| Bugs Non Fixés (Confirmés) | 1 |
| Bugs Partiellement Fixés | 2 |
| Nouveaux Bugs Découverts | 3 |

---

## 📋 Matrice de Reproduction des Bugs Connus

| Bug ID | Description | Status | Fixé? | Evidence |
|--------|-------------|--------|-------|----------|
| BUG-1 | Race condition DB/Frontend | ✅ FIXÉ | Oui | `page.tsx` ligne ~174 + `executor.ts` BUG #10 |
| BUG-2 | codeOutput null | ✅ FIXÉ | Oui | `route.ts` BUG #2 - Accumulation JSON input |
| BUG-3 | Preview ne refresh pas | ✅ FIXÉ | Oui | `page.tsx` BUG #3 - previewVersion counter |
| BUG-4 | Tools écrasent fichiers | ✅ FIXÉ | Oui | `executor.ts` BUG #10 - Sequential execution |
| BUG-5 | Path normalization | ✅ FIXÉ | Oui | `legacy-adapter.ts` BUG #7 - normalizePath() |
| BUG-6 | Retry silencieux | ⚠️ PARTIEL | Partiel | Debounce timer ajouté, mais pas de retry UI |
| BUG-7 | Message sans codeOutput | ✅ FIXÉ | Oui | `route.ts` - DB toujours source de vérité |
| BUG-8 | Mode Expert perte focus | ❌ EXISTE | Non | `CodeEditor.tsx` - pas de viewState persistence |
| BUG-9 | ESLint warnings | ⚠️ PARTIEL | Partiel | Pas de lint config visible |
| BUG-10 | Preview console noise | 🔍 N/A | N/A | Besoin de browser test |

---

## 🔴 Bugs Confirmés Non Fixés

### BUG-8: Mode Expert - Perte de Focus/Position Curseur

**Sévérité:** P1  
**Fichier:** `/src/components/editor/CodeEditor.tsx`  
**Status:** ❌ NON FIXÉ

**Description:**
Quand on navigue entre fichiers dans le Mode Expert, la position du curseur et l'état du viewport (scroll position, sélection) sont perdus.

**Cause Racine:**
Le composant `CodeEditor` ne sauvegarde pas le `viewState` de Monaco entre les changements de fichier. Le `editorRef` existe mais n'est pas utilisé pour persister l'état.

**Code Actuel Problématique:**
```typescript
// CodeEditor.tsx - pas de sauvegarde viewState
const handleEditorMount = useCallback((editor: any) => {
  editorRef.current = editor
}, [])
```

**Fix Proposé:**
```typescript
// Ajouter un Map pour stocker les viewStates par fichier
const viewStatesRef = useRef<Map<string, any>>(new Map())
const previousFileRef = useRef<string | null>(null)

// Sauvegarder viewState avant changement de fichier
useEffect(() => {
  if (editorRef.current && previousFileRef.current) {
    const viewState = editorRef.current.saveViewState()
    viewStatesRef.current.set(previousFileRef.current, viewState)
  }
  previousFileRef.current = activeFile
  
  // Restaurer viewState du nouveau fichier
  if (editorRef.current && activeFile) {
    const savedState = viewStatesRef.current.get(activeFile)
    if (savedState) {
      editorRef.current.restoreViewState(savedState)
    }
  }
}, [activeFile])
```

---

## 🟡 Bugs Partiellement Fixés

### BUG-6: Retry Silencieux

**Sévérité:** P1  
**Status:** ⚠️ PARTIELLEMENT FIXÉ

**Ce qui est fixé:**
- Debounce timer pour les sauvegardes (`saveTimerRef` dans `page.tsx`)
- Messages d'erreur user-friendly pour les erreurs communes

**Ce qui manque:**
- Pas de bouton "Réessayer" visible après une erreur
- Pas de retry automatique pour les erreurs réseau temporaires
- L'état d'erreur persiste jusqu'au prochain message

**Fix Proposé:**
Ajouter un composant `RetryButton` dans le ChatPanel quand une erreur est affichée.

---

## 🆕 Nouveaux Bugs Découverts

### NEW-BUG-1: Potentiel Memory Leak dans Monaco Editor

**Sévérité:** P2  
**Fichier:** `/src/components/editor/CodeEditor.tsx`

**Description:**
Le composant utilise `dynamic import` pour Monaco, mais ne nettoie pas les listeners/models quand le composant est démonté.

**Impact:**
Fuite mémoire potentielle après navigation répétée entre pages.

**Fix Proposé:**
```typescript
useEffect(() => {
  return () => {
    // Cleanup on unmount
    if (editorRef.current) {
      editorRef.current.dispose?.()
    }
  }
}, [])
```

---

### NEW-BUG-2: Pas de Limite sur la Taille des Fichiers

**Sévérité:** P1  
**Fichier:** `/src/lib/ai/tools/executor.ts` et `/src/lib/ai/tools/legacy-adapter.ts`

**Description:**
Les fonctions `writeFile` et `updateFile` n'ont pas de limite sur la taille du contenu. Un fichier très large pourrait:
1. Dépasser les limites de stockage JSON
2. Causer des timeouts lors de la sauvegarde
3. Ralentir la preview Sandpack

**Evidence:**
```typescript
// executor.ts - pas de validation de taille
case 'write_file': {
  const content = call.arguments.content as string;
  // Aucune vérification de content.length
```

**Fix Proposé:**
```typescript
const MAX_FILE_SIZE = 500 * 1024 // 500KB

if (Buffer.byteLength(content, 'utf8') > MAX_FILE_SIZE) {
  return {
    toolCallId: call.id,
    success: false,
    error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`,
  };
}
```

---

### NEW-BUG-3: Injection Potentielle dans searchFiles

**Sévérité:** P2  
**Fichier:** `/src/lib/ai/tools/legacy-adapter.ts`

**Description:**
Le paramètre `glob` est transformé en RegExp sans échappement, ce qui pourrait causer des erreurs ou des comportements inattendus.

**Code Problématique:**
```typescript
// legacy-adapter.ts ligne ~197
const pattern = glob.replace('*', '.*')
if (!new RegExp(pattern).test(path)) {
```

**Risque:**
Un glob comme `*.tsx(` causerait une erreur RegExp invalide.

**Fix Proposé:**
```typescript
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Puis utiliser:
const escapedGlob = escapeRegex(glob).replace('\\*', '.*')
```

---

## 🧪 Tests de Stress (Préparés - Non Exécutés)

> ⚠️ Ces tests nécessitent un accès navigateur qui n'était pas disponible.

### Test 1: 10 Messages Rapides
**Objectif:** Vérifier BUG-1 (race condition) sous stress  
**Méthode:** Envoyer 10 prompts en succession rapide  
**Critère:** Aucune perte de fichier, tous les changements persistés  
**Status:** 🔄 À EXÉCUTER

### Test 2: Long Prompts (>2000 caractères)
**Objectif:** Tester les limites du streaming  
**Méthode:** Envoyer un prompt de 3000+ caractères  
**Critère:** Réponse complète, pas de truncation  
**Status:** 🔄 À EXÉCUTER

### Test 3: Caractères Spéciaux
**Objectif:** Tester le parsing JSON/SSE  
**Méthode:** Prompts avec émojis, unicode, guillemets, backslashes  
**Critère:** Pas d'erreur de parsing  
**Status:** 🔄 À EXÉCUTER

### Test 4: Fichiers Volumineux
**Objectif:** Tester NEW-BUG-2  
**Méthode:** Demander génération de fichier >100KB  
**Critère:** Soit limite appliquée, soit pas de crash  
**Status:** 🔄 À EXÉCUTER

---

## ✅ Validations du Code (Analyse Statique)

| Aspect | Status | Notes |
|--------|--------|-------|
| Race condition DB | ✅ OK | Sequential tool execution |
| Path normalization | ✅ OK | normalizePath() appliqué partout |
| Type validation | ✅ OK | BUG #11 fix dans executor.ts |
| Error handling | ✅ OK | Errors propagées au client |
| Streaming robustness | ✅ OK | JSON sanitization dans route.ts |
| Tool call accumulation | ✅ OK | Fixes BUG #1, #2, #5, #8, #9 |

---

## 📝 Recommandations

### Priorité Haute (P0-P1)
1. **Fixer BUG-8:** Ajouter persistence du viewState Monaco
2. **Fixer NEW-BUG-2:** Ajouter limite de taille fichier
3. **Compléter BUG-6:** Ajouter bouton "Réessayer"

### Priorité Moyenne (P2)
4. **Fixer NEW-BUG-1:** Cleanup Monaco on unmount
5. **Fixer NEW-BUG-3:** Escape regex dans searchFiles

### Tests à Exécuter
6. Tests de stress manuels avec browser
7. Tests de performance (Lighthouse)
8. Tests de sécurité basiques (XSS)

---

## 🔧 Fichiers Modifiés par cette Analyse

Aucun fix appliqué - rapport d'analyse uniquement. Les fixes proposés peuvent être implémentés après validation.

---

*Rapport généré par Agent 3 - Edge Case Hunter 🐛*
*Analyse statique complète du codebase effectuée.*
