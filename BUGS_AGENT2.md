# 🔧 Bugs & Analyse Technique - Agent 2 (Tech Deep Dive)

**Date:** 2025-02-03
**Tests:** TT-1 (Streaming), TT-2 (Tools IA), TT-3 (Persistance), TT-6 (Performance)
**Méthode:** Analyse statique du code source (browser indisponible dans l'environnement sandbox)

---

## ✅ Bugs Déjà Fixés (vérifiés dans le code)

### FIX BUG #3 - Preview Version Counter
**Fichier:** `src/app/(dashboard)/app/[id]/page.tsx`
**Status:** ✅ CORRIGÉ
```tsx
// BUG FIX #3: Preview version counter for reliable refresh
const [previewVersion, setPreviewVersion] = useState(0)
...
<Preview key={`preview-${previewVersion}`} ... />
```
Le counter `previewVersion` force le re-render de Sandpack.

### FIX BUG #4 - Tool Call Visual Feedback  
**Fichier:** `src/app/(dashboard)/app/[id]/page.tsx` + `src/components/editor/ChatPanel.tsx`
**Status:** ✅ CORRIGÉ
```tsx
// BUG FIX #4: Tool call tracking for visual feedback
const [toolCalls, setToolCalls] = useState<ToolCallState[]>([])
```
Les tool calls sont maintenant affichés en temps réel dans le ChatPanel.

### FIX BUG #5 - App Loading Race Condition
**Fichier:** `src/app/(dashboard)/app/[id]/page.tsx`
**Status:** ✅ CORRIGÉ
```tsx
// BUG FIX #5: Track app loading state to prevent race condition
const [isAppLoaded, setIsAppLoaded] = useState(false)
```
Le prompt initial attend que l'app soit chargée.

### FIX BUG #6 - Debounce File Saving
**Fichier:** `src/app/(dashboard)/app/[id]/page.tsx`
**Status:** ✅ CORRIGÉ
```tsx
// BUG FIX #6: Debounce timer ref for file saving
const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
```
Les sauvegardes sont debounced à 1 seconde.

### FIX BUG #7 - Path Normalization & DB Source of Truth
**Fichiers:** `src/app/api/chat/route.ts` + `src/lib/ai/tools/legacy-adapter.ts`
**Status:** ✅ CORRIGÉ
- DB est toujours la source de vérité après tool use
- Les paths sont normalisés (toujours avec `/` en préfixe)
- Déduplication des fichiers `/App.tsx` vs `App.tsx`

### FIX BUG #8 & #9 - Anthropic JSON Accumulation
**Fichier:** `src/app/api/chat/route.ts`
**Status:** ✅ CORRIGÉ
```tsx
// FIX BUG #8: ALWAYS reset both variables when starting a new block
// FIX BUG #9: Only add tool block if JSON was parsed successfully
```

### FIX BUG #10 - Sequential Tool Execution
**Fichier:** `src/lib/ai/tools/executor.ts`
**Status:** ✅ CORRIGÉ
```tsx
/**
 * Execute multiple tool calls SEQUENTIALLY
 * FIX BUG #10: Sequential execution prevents race conditions
 */
export async function executeTools(calls: ToolCall[], context: ToolContext) {
  const results: ToolResult[] = []
  for (const call of calls) {
    const result = await executeTool(call, context)
    results.push(result)
  }
  return results
}
```

### FIX BUG #11 - Type Validation in write_file
**Fichier:** `src/lib/ai/tools/executor.ts`
**Status:** ✅ CORRIGÉ
```tsx
// FIX BUG #11: Validate types before casting
if (typeof rawPath !== 'string' || !rawPath.trim()) {
  return { ... error: `Invalid path: expected non-empty string` }
}
```

---

## 🔴 Bugs Potentiels Identifiés

### BUG-TECH-1: Silent SSE Parsing Errors (MEDIUM)
**Fichier:** `src/app/(dashboard)/app/[id]/page.tsx` (lignes ~170-200)
**Description:** Le parsing des chunks SSE échoue silencieusement
```tsx
} catch (parseError) {
  // Log but don't crash - incomplete chunks are normal during streaming
  if (jsonStr.length > 10) {
    console.debug('SSE parse skip (may be incomplete chunk):', ...)
  }
}
```
**Problème:** Des erreurs importantes peuvent être ignorées silencieusement si le JSON est malformé pour d'autres raisons.
**Recommandation:** Ajouter une heuristique pour distinguer les chunks incomplets des vraies erreurs.

### BUG-TECH-2: Race Condition Frontend PATCH vs DB (LOW - probablement corrigé)
**Fichier:** `src/app/(dashboard)/app/[id]/page.tsx`
**Description:** Le frontend fait un PATCH des fichiers en mode legacy (sans tools):
```tsx
} else if (codeOutput?.files) {
  // Legacy mode (no tools): merge codeOutput and save to DB
  setFiles(prev => {
    const updated = { ...prev, ...normalizedFiles }
    fetch(`/api/apps/${appId}`, { method: 'PATCH', ... })
    return updated
  })
}
```
**Status:** Probablement non-bloquant car:
1. Quand les tools sont utilisés, le code prend le path `toolsWereUsed = true`
2. Les tools écrivent directement en DB
3. Le frontend récupère ensuite l'état DB

### BUG-TECH-3: Memory Leak Potential in Debounce Timer
**Fichier:** `src/app/(dashboard)/app/[id]/page.tsx`
**Description:** Le timer de debounce est bien nettoyé au unmount mais...
```tsx
// Cleanup debounce timer on unmount
useEffect(() => {
  return () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
  }
}, [])
```
**Status:** ✅ OK - le cleanup est en place.

### BUG-TECH-4: Monaco Editor Re-render (LOW)
**Fichier:** `src/components/editor/CodeEditor.tsx`
**Description:** Le `MonacoEditor` reçoit `value={currentContent}` qui peut causer des re-renders inutiles.
**Impact:** Performance légèrement dégradée en mode Expert.
**Recommandation:** Utiliser `useMemo` ou un système de controlled/uncontrolled plus fin.

### BUG-TECH-5: Tool Call Array Not Cleared on Error
**Fichier:** `src/app/(dashboard)/app/[id]/page.tsx`
**Description:** Les toolCalls sont cleared dans `finally` mais si une exception est levée avant la création de `assistantId`, on pourrait avoir un state inconsistant.
```tsx
} finally {
  setIsLoading(false)
  setToolCalls([])  // BUG FIX #4: Clear tool calls when done
}
```
**Status:** Probablement OK car le `try` démarre après `setToolCalls([])`.

---

## 🟡 Points d'Attention (TT-1 Streaming)

### Streaming IA - Observations

1. **Anthropic Streaming:** Utilise l'accumulation manuelle des content blocks
   - Les `text_delta` sont streamés caractère par caractère ✅
   - Les `input_json_delta` pour les tools sont accumulés correctement ✅

2. **OpenAI Streaming:** Accumulation standard des tool_calls
   - Fix présent pour accumulation ID qui peut arriver dans des chunks tardifs ✅

3. **Timeout:** `maxDuration = 60` sur l'API route
   - Suffisant pour des générations complexes ✅

4. **Stop Button:** Non visible dans le code analysé
   - Le frontend n'a pas de bouton "Stop" pour interrompre le streaming
   - **Recommandation:** Ajouter un `AbortController` côté frontend

---

## 🟡 Points d'Attention (TT-2 Tools IA)

### Exécution des Tools - Observations

1. **list_files:** Implémenté ✅
2. **read_file:** Implémenté avec fallback path sans `/` ✅
3. **write_file:** Implémenté avec validation de type ✅
4. **update_file:** Implémenté (vérifie existence) ✅
5. **delete_file:** Implémenté ✅
6. **move_file:** Implémenté (read + write + delete) ✅
7. **search_files:** Implémenté avec glob support ✅
8. **get_project_info:** Implémenté ✅

### Tool Execution Loop

- **MAX_TOOL_ROUNDS = 10** - Limite de sécurité OK
- **Sequential execution** - Empêche les race conditions entre writes ✅
- **Error handling** - Distingue FileNotFoundError, InvalidPathError, etc. ✅

---

## 🟡 Points d'Attention (TT-3 Persistance DB)

### Persistance - Observations

1. **Source of Truth:** La DB Prisma est correctement utilisée comme source de vérité
2. **Sauvegarde après génération:** Les tools écrivent directement en DB
3. **Récupération après tool use:** Le frontend fetch les fichiers depuis la DB après tool use
4. **Path Normalization:** Déduplication `/App.tsx` vs `App.tsx` implémentée

### Point d'attention - Conversation History

```tsx
// Save to conversation
if (appId && app?.conversationId) {
  await prisma.message.create({
    data: {
      role: 'USER',
      content: messages[messages.length - 1].content,
      conversationId: app.conversationId,
    },
  })
  await prisma.message.create({
    data: {
      role: 'ASSISTANT',
      content: fullContent.replace(/```[\s\S]*?```/g, '').trim() || 'Code généré ✨',
      codeOutput: codeOutput || undefined,
      conversationId: app.conversationId,
    },
  })
}
```
- Le codeOutput est sauvegardé avec le message assistant ✅
- L'historique est rechargé au mount de la page ✅

---

## 🟡 Points d'Attention (TT-6 Performance)

### Optimisations Présentes

1. **Minimal Context (70-80% token reduction):**
```tsx
// Build minimal context (file list only, not content)
// This is the key optimization: ~70-80% token reduction
const fileList = Object.entries(codeFiles).map(([path, content]) => ({
  path: path.startsWith('/') ? path : '/' + path,
  sizeBytes: typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : 0,
}))
```
L'IA utilise des tools pour lire les fichiers on-demand au lieu de tout injecter.

2. **Monaco Dynamic Import:**
```tsx
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })
```
Monaco est chargé côté client seulement.

3. **Debounced Saves:** 1 seconde de délai avant sauvegarde.

### Points d'amélioration potentiels

1. Pas de cache visible pour les fichiers déjà lus par les tools
2. Pas de compression des réponses API (pourrait être géré par Vercel/CDN)

---

## 📊 Résumé Tests Techniques

| Test | Status | Notes |
|------|--------|-------|
| TT-1.1 Streaming progressif | ✅ | Implémenté pour Anthropic et OpenAI |
| TT-1.2 Pas de freeze | ⚠️ | Non testé (browser indisponible) |
| TT-1.3 Interruption possible | ❌ | Pas de bouton Stop visible |
| TT-1.4 Network EventSource | ✅ | SSE implémenté |
| TT-2.1-8 Tools IA | ✅ | Tous les tools implémentés |
| TT-2.6 Pas d'écrasement | ✅ | Sequential execution + path normalization |
| TT-3.1-5 Persistance DB | ✅ | DB source of truth implémentée |
| TT-6.1-5 Performance | ⚠️ | Optimisations présentes, non benchmarké |

---

## 🔧 Recommandations de Fix

### RECOM-1: Ajouter bouton Stop Streaming
**Priorité:** P1
**Fichiers:** `page.tsx` + `ChatPanel.tsx`
**Description:** Ajouter un `AbortController` pour permettre l'arrêt du streaming.

### RECOM-2: Améliorer l'error handling SSE
**Priorité:** P2
**Fichier:** `page.tsx`
**Description:** Distinguer les chunks SSE incomplets des vraies erreurs JSON.

### RECOM-3: Ajouter retry automatique sur erreur réseau
**Priorité:** P2
**Fichier:** `page.tsx`
**Description:** Implémenter un retry avec backoff exponentiel.

---

*Analyse effectuée par Agent 2 Tech Deep Dive - Code review statique*
