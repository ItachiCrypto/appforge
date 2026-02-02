# 🗄️ Diagnostic: Persistance des Fichiers AppForge

**Date:** 2025-02-02  
**Agent:** Subagent Database/Persistence  
**Statut:** 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

---

## 📊 Résumé Exécutif

L'analyse révèle plusieurs problèmes de **race condition** et de **synchronisation** entre:
1. Les **AI Tools** qui écrivent directement en DB
2. Le **Frontend** qui fait des PATCH avec ses fichiers locaux
3. Le **Backend** qui retourne `codeOutput` potentiellement incomplet

**Impact:** Les fichiers générés par l'IA peuvent être écrasés par les fichiers "stales" du frontend.

---

## 🏗️ Architecture Actuelle

### Modèle de Données (Prisma Schema)

```prisma
// LEGACY: Apps - Fichiers stockés en JSON (PROBLÉMATIQUE)
model App {
  files       Json     @default("{}")  // ← Tout le code dans un champ JSON
  // ...
}

// NEW v2: Projects - Système de fichiers propre (OK)
model Project {
  files       File[]   // ← Relation 1:N avec table File
}

model File {
  path        String
  content     String?  @db.Text
  projectId   String
  project     Project  @relation(...)
  @@unique([projectId, path])  // ← Contrainte d'unicité
}
```

### Flux de Données

```
┌─────────────┐     1. Message + currentFiles      ┌─────────────┐
│   Frontend  │ ─────────────────────────────────► │  /api/chat  │
│   (React)   │                                    │   (Route)   │
└─────────────┘                                    └──────┬──────┘
      ▲                                                   │
      │                                                   │ 2. Tool calls
      │                                                   ▼
      │                                          ┌─────────────────┐
      │                                          │  AI Tools       │
      │                                          │  (executor.ts)  │
      │                                          └────────┬────────┘
      │                                                   │
      │                                                   │ 3. write_file
      │                                                   ▼
      │                                          ┌─────────────────┐
      │  5. PATCH (files locaux)                 │ LegacyAdapter   │
      │ ──────────────────────────────────────►  │ saveAppFiles()  │
      │                                          └────────┬────────┘
      │                                                   │
      │  4. codeOutput (peut être incomplet)              │ 4. prisma.app.update
      │ ◄──────────────────────────────────────          ▼
      │                                          ┌─────────────────┐
      └──────────────────────────────────────────│    Database     │
                                                 │   (PostgreSQL)  │
                                                 └─────────────────┘
```

---

## 🐛 Problèmes Identifiés

### 🔴 CRITIQUE #1: Race Condition - Double Écriture

**Localisation:** `page.tsx` lignes 324-345 + `legacy-adapter.ts`

**Description:**
1. Les AI Tools écrivent en DB via `LegacyFileAdapter.saveAppFiles()`
2. Le frontend reçoit `codeOutput` et fait un merge local: `{ ...prev, ...normalizedFiles }`
3. Le frontend fait un PATCH vers `/api/apps/{id}` avec ses fichiers mergés

**Problème:** Si `codeOutput` est incomplet ou ne contient pas tous les fichiers écrits par les tools, le PATCH écrase les fichiers en DB avec une version incomplète.

```typescript
// page.tsx - Le code problématique
if (codeOutput?.files) {
  setFiles(prev => {
    const updated = { ...prev, ...normalizedFiles }  // ⚠️ Merge local
    
    fetch(`/api/apps/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify({ files: updated }),  // ⚠️ Peut écraser les fichiers des tools!
    })
    
    return updated
  })
}
```

---

### 🔴 CRITIQUE #2: codeOutput peut être null/incomplet

**Localisation:** `/api/chat/route.ts` lignes 288-311

**Description:**
Le backend essaie de récupérer les fichiers de la DB après l'exécution des tools, mais la logique de comparaison peut échouer.

```typescript
// route.ts - Logique de récupération
const originalFiles = codeFiles as Record<string, string>  // ⚠️ Fichiers AVANT génération
const hasChanges = Object.keys(dbFiles).some(key => 
  dbFiles[key] !== originalFiles[key]
)

if (hasChanges) {
  codeOutput = { files: dbFiles }  // ✅ OK si détecté
} else if (!codeOutput && Object.keys(dbFiles).length > 0) {
  codeOutput = { files: dbFiles }  // ✅ Fallback
}
```

**Problème:** `codeFiles` = `currentFiles` (du frontend) ou `app?.files` (de la DB au début).
Si `currentFiles` est vide ou partial, la comparaison ne fonctionne pas correctement.

---

### 🟡 IMPORTANT #3: Pas de Transactions pour les Tools Parallèles

**Localisation:** `executor.ts` ligne ~300

```typescript
export async function executeTools(
  calls: ToolCall[],
  context: ToolContext
): Promise<ToolResult[]> {
  return Promise.all(  // ⚠️ Exécution parallèle sans transaction!
    calls.map(call => executeTool(call, context))
  );
}
```

**Description:**
Si l'IA appelle plusieurs `write_file` en parallèle (par exemple pour créer 3 fichiers), chaque appel fait un `prisma.app.update()` séparé. 

```typescript
// legacy-adapter.ts
private async saveAppFiles(appId: string, files: Record<string, string>): Promise<void> {
  await prisma.app.update({  // ⚠️ Pas de transaction
    where: { id: appId },
    data: { files: normalizedFiles },
  })
}
```

**Impact:** Race condition possible entre les écritures parallèles. Le dernier `update` gagne et peut écraser les fichiers des autres.

---

### 🟡 IMPORTANT #4: Le Frontend envoie les fichiers "stales"

**Localisation:** `page.tsx` ligne 188-192

```typescript
const res = await fetch('/api/chat', {
  body: JSON.stringify({
    currentFiles: files,  // ⚠️ Fichiers AVANT génération!
    // ...
  }),
})
```

**Description:**
Le frontend envoie `currentFiles` qui sont les fichiers d'état local AVANT que l'IA génère du nouveau code. Ces fichiers sont utilisés par le backend pour la comparaison.

---

### 🟢 MINEUR #5: Normalisation des Paths

**Localisation:** `legacy-adapter.ts`

Le code normalise les paths (ajout de `/` au début), mais il y a eu des bugs historiques de duplication (`/path` vs `path`). Le fix BUG #7 a été implémenté mais pourrait causer des problèmes de migration.

---

## ✅ Ce qui fonctionne bien

1. **Prisma Schema v2 (Projects/Files):** Architecture propre avec relations 1:N
2. **FileService:** CRUD complet avec versioning et quotas
3. **Legacy Adapter:** Bonne abstraction pour les Apps legacy
4. **Normalisation des paths:** Bug #7 fixé correctement

---

## 🔧 Solutions Recommandées

### Solution 1: Supprimer le PATCH du frontend quand tools utilisés

```typescript
// page.tsx - NE PAS faire de PATCH si toolsWereUsed
if (codeOutput?.files) {
  const normalizedFiles = normalizeFilesForSandpack(codeOutput.files)
  setFiles(normalizedFiles)  // Mise à jour locale seulement
  setPreviewVersion(v => v + 1)
  
  // ❌ NE PAS faire: fetch PATCH
  // Les tools ont déjà écrit en DB
}
```

### Solution 2: Toujours récupérer les fichiers de la DB

```typescript
// page.tsx - Après la génération, TOUJOURS récupérer de la DB
} finally {
  // Récupérer l'état autoritatif de la DB
  const appRes = await fetch(`/api/apps/${appId}`)
  if (appRes.ok) {
    const app = await appRes.json()
    if (app.files) {
      setFiles(normalizeFilesForSandpack(app.files))
    }
  }
  setIsLoading(false)
}
```

### Solution 3: Utiliser des transactions pour les tools

```typescript
// executor.ts - Exécution séquentielle ou transaction
export async function executeTools(
  calls: ToolCall[],
  context: ToolContext
): Promise<ToolResult[]> {
  // Option A: Exécution séquentielle
  const results: ToolResult[] = []
  for (const call of calls) {
    results.push(await executeTool(call, context))
  }
  return results
  
  // Option B: Transaction Prisma (nécessite refactoring)
}
```

### Solution 4: Le backend retourne TOUJOURS les fichiers de la DB

```typescript
// route.ts - Fin du streaming
// TOUJOURS récupérer les fichiers de la DB, pas de comparaison
if (appId) {
  const finalApp = await prisma.app.findUnique({
    where: { id: appId },
    select: { files: true },
  })
  if (finalApp?.files) {
    codeOutput = { files: finalApp.files as Record<string, string> }
  }
}
```

---

## 📋 Actions Prioritaires

| Priorité | Action | Fichier | Impact |
|----------|--------|---------|--------|
| 🔴 P0 | Supprimer PATCH frontend après tools | `page.tsx` | Évite écrasement |
| 🔴 P0 | Backend retourne toujours DB files | `route.ts` | Source de vérité unique |
| 🟡 P1 | Exécution séquentielle des tools | `executor.ts` | Évite race condition |
| 🟡 P1 | Refresh depuis DB après génération | `page.tsx` | Sync fiable |
| 🟢 P2 | Migration vers Projects/Files v2 | Architecture | Long terme |

---

## 📁 Fichiers Analysés

- `prisma/schema.prisma` - Modèle de données
- `src/lib/files/service.ts` - FileService (v2)
- `src/lib/ai/tools/executor.ts` - Exécution des tools
- `src/lib/ai/tools/legacy-adapter.ts` - Adapter pour Apps legacy
- `src/app/api/chat/route.ts` - API Chat avec streaming
- `src/app/api/apps/[id]/route.ts` - CRUD Apps
- `src/app/(dashboard)/app/[id]/page.tsx` - Frontend éditeur

---

**Conclusion:** Le problème principal est une **race condition** entre les tools qui écrivent en DB et le frontend qui fait un PATCH avec des fichiers potentiellement stales. La solution la plus simple est de supprimer le PATCH du frontend quand les tools ont été utilisés, et de toujours récupérer les fichiers depuis la DB.
