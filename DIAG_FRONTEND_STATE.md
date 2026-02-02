# 🔍 Diagnostic Frontend/State - AppForge

**Agent:** AGENT FRONTEND/STATE  
**Date:** 2025-02-02  
**Focus:** Flux client de réception réponse IA → mise à jour state → affichage/sauvegarde

---

## 📊 Résumé Exécutif

L'investigation révèle **plusieurs problèmes de synchronisation** entre le backend (écriture DB via tools) et le frontend (state React). Le flux actuel présente des conditions de course qui peuvent empêcher les fichiers générés par l'IA d'être correctement sauvegardés et affichés.

---

## 🔴 Problème Principal: Désynchronisation DB ↔ Frontend State

### Description

Quand l'IA utilise les tools (`write_file`, `update_file`) pour écrire du code:

1. **Backend** écrit directement en DB via `legacyAdapter.saveAppFiles()`
2. **Backend** essaie de renvoyer les fichiers via `codeOutput` dans l'event SSE `done`
3. **MAIS** si l'IA n'écrit pas de code blocs formatés dans le texte, `parseCodeBlocks()` retourne `null`
4. **Le frontend ne reçoit pas les fichiers** et ne met pas à jour son state

### Fichiers concernés

- `src/app/api/chat/route.ts` (lignes ~280-320)
- `src/app/(dashboard)/app/[id]/page.tsx` (lignes ~180-220)
- `src/lib/ai/tools/legacy-adapter.ts`

### Code problématique

**Backend (route.ts):**
```typescript
// Le parsing peut retourner null si l'IA n'a pas écrit de blocs ```tsx
let codeOutput = parseCodeBlocks(fullContent)

// FIX BUG #6 essaie de récupérer de la DB, mais...
if (appId) {
  const updatedApp = await prisma.app.findUnique({...})
  if (updatedApp?.files) {
    const dbFiles = updatedApp.files as Record<string, string>
    const originalFiles = codeFiles as Record<string, string>
    
    // ⚠️ PROBLÈME: Cette comparaison peut échouer si les paths sont différents
    // Ex: "/App.js" vs "App.js" ou après normalisation
    const hasChanges = Object.keys(dbFiles).some(key => 
      dbFiles[key] !== originalFiles[key]
    ) || Object.keys(dbFiles).length !== Object.keys(originalFiles).length
    
    if (hasChanges) {
      codeOutput = { files: dbFiles }
    }
  }
}
```

**Frontend (page.tsx):**
```typescript
// Si codeOutput est null, les fichiers ne sont pas mis à jour
if (codeOutput?.files) {
  const normalizedFiles = normalizeFilesForSandpack(codeOutput.files)
  setFiles(prev => {
    const updated = { ...prev, ...normalizedFiles }
    // Save to API...
    return updated
  })
}
```

---

## 🔴 Problème #2: Comparaison de fichiers incorrecte

### Description

Le "BUG FIX #6" compare les fichiers DB avec les fichiers originaux, mais:
- Les paths peuvent être normalisés différemment (`/App.js` vs `App.js`)
- Le frontend envoie `currentFiles` qui peut avoir des paths non-normalisés
- `legacyAdapter` normalise les paths avant sauvegarde

### Conséquence

La comparaison `dbFiles[key] !== originalFiles[key]` peut retourner `false` même si le contenu a changé, car les clés (paths) ne matchent pas.

### Solution proposée

```typescript
// Normaliser les deux côtés avant comparaison
const normalizePath = (p: string) => p.startsWith('/') ? p : '/' + p

const hasChanges = Object.entries(dbFiles).some(([key, content]) => {
  const normalizedKey = normalizePath(key)
  const originalContent = originalFiles[normalizedKey] || originalFiles[key] || originalFiles[key.slice(1)]
  return content !== originalContent
}) || Object.keys(dbFiles).length !== Object.keys(originalFiles).length
```

---

## 🔴 Problème #3: Message sauvé sans codeOutput

### Description

Dans route.ts, le message ASSISTANT est sauvé avec `codeOutput: codeOutput || undefined`. Si `codeOutput` est null après toutes les vérifications, le message est sauvé **SANS le code généré**.

### Conséquence

Au rechargement de la page:
1. L'utilisateur voit les messages de conversation
2. MAIS les fichiers associés à chaque message ne sont pas là
3. Le dernier état des fichiers est bien en DB (`App.files`), mais pas associé au message

### Fichier concerné

`src/app/api/chat/route.ts` (lignes ~325-340)

### Code problématique

```typescript
await prisma.message.create({
  data: {
    role: 'ASSISTANT',
    content: fullContent.replace(/```[\s\S]*?```/g, '').trim() || 'Code généré ✨',
    codeOutput: codeOutput || undefined,  // ⚠️ Peut être undefined!
    conversationId: app.conversationId,
  },
})
```

### Solution proposée

Toujours récupérer les fichiers de la DB avant de sauvegarder le message:

```typescript
// Toujours fetch les fichiers actuels de la DB
const currentApp = await prisma.app.findUnique({
  where: { id: appId },
  select: { files: true },
})

const finalCodeOutput = codeOutput || 
  (currentApp?.files && Object.keys(currentApp.files as object).length > 0 
    ? { files: currentApp.files as Record<string, string> } 
    : undefined)

await prisma.message.create({
  data: {
    role: 'ASSISTANT',
    content: fullContent.replace(/```[\s\S]*?```/g, '').trim() || 'Code généré ✨',
    codeOutput: finalCodeOutput,
    conversationId: app.conversationId,
  },
})
```

---

## 🟡 Problème #4: Refresh des fichiers peut échouer silencieusement

### Description

Dans page.tsx, si les tools ont été utilisés mais pas de `codeOutput`, un fetch est fait pour récupérer les fichiers. Mais:
- Aucun retry en cas d'échec
- Aucune notification à l'utilisateur
- Le state React reste avec les anciens fichiers

### Fichier concerné

`src/app/(dashboard)/app/[id]/page.tsx` (lignes ~220-235)

### Code problématique

```typescript
} else if (toolsWereUsed) {
  try {
    const appRes = await fetch(`/api/apps/${appId}`)
    if (appRes.ok) {
      const app = await appRes.json()
      if (app.files) {
        setFiles(normalizeFilesForSandpack(app.files))
        setPreviewVersion(v => v + 1)
      }
    }
  } catch (err) {
    console.error('Failed to refresh files after tool use:', err)
    // ⚠️ Aucune action de recovery!
  }
}
```

### Solution proposée

```typescript
} else if (toolsWereUsed) {
  let retries = 3
  while (retries > 0) {
    try {
      const appRes = await fetch(`/api/apps/${appId}`)
      if (appRes.ok) {
        const app = await appRes.json()
        if (app.files && Object.keys(app.files).length > 0) {
          setFiles(normalizeFilesForSandpack(app.files))
          setPreviewVersion(v => v + 1)
          break
        }
      }
    } catch (err) {
      console.error(`Retry ${4 - retries}/3 failed:`, err)
    }
    retries--
    if (retries > 0) await new Promise(r => setTimeout(r, 500))
  }
  
  if (retries === 0) {
    // Notifier l'utilisateur
    setMessages(prev => prev.map(m => 
      m.id === assistantId 
        ? { ...m, content: m.content + '\n\n⚠️ Impossible de synchroniser les fichiers. Rafraîchis la page.' }
        : m
    ))
  }
}
```

---

## 🟡 Problème #5: Preview ne se rafraîchit pas toujours

### Description

Le composant `Preview` utilise une `key` basée sur `previewVersion` pour forcer le remount. Mais:
- Le `previewVersion` n'est incrémenté que si `codeOutput?.files` existe
- Si les fichiers viennent du refresh DB, le preview peut ne pas se mettre à jour

### Fichier concerné

`src/app/(dashboard)/app/[id]/page.tsx`

### Vérification

Le code semble correct grâce au BUG FIX #3, mais vérifier que `setPreviewVersion(v => v + 1)` est bien appelé dans TOUS les cas où les fichiers changent.

---

## 📋 Actions Recommandées

### Priorité Haute

1. **[ ] Fixer la comparaison de fichiers** - Normaliser les paths des deux côtés avant comparaison
2. **[ ] Toujours sauver les fichiers dans le message** - Fetch DB avant sauvegarde du message ASSISTANT
3. **[ ] Ajouter retry + notification** - Ne pas échouer silencieusement sur le refresh

### Priorité Moyenne

4. **[ ] Ajouter logging détaillé** - Tracer le flux complet pour debug
5. **[ ] Unifier la normalisation des paths** - Une seule fonction utilisée partout

### Priorité Basse

6. **[ ] Optimiser le refresh** - Utiliser WebSocket/SSE pour push les changements au lieu de polling

---

## 🔬 Tests de Validation

Pour valider les fixes:

1. **Test: Génération via tools uniquement**
   - Envoyer un prompt qui déclenche `write_file` 
   - Vérifier que le preview affiche le nouveau code
   - Recharger la page et vérifier que le code persiste

2. **Test: Message sans code blocs**
   - L'IA répond avec du texte + utilise tools
   - Vérifier que `codeOutput` est sauvé dans le message

3. **Test: Paths avec/sans slash**
   - Créer un fichier `/App.js`
   - Le modifier
   - Vérifier que la comparaison détecte le changement

---

## 📁 Fichiers à Modifier

| Fichier | Changements |
|---------|-------------|
| `src/app/api/chat/route.ts` | Fix comparaison, toujours sauver codeOutput |
| `src/app/(dashboard)/app/[id]/page.tsx` | Retry + notification sur refresh |
| `src/lib/ai/tools/legacy-adapter.ts` | Déjà OK (normalise les paths) |
| `src/components/preview/Preview.tsx` | OK |

---

*Rapport généré par Agent Frontend/State - 2025-02-02*
