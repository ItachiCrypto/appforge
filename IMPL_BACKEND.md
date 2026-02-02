# IMPL_BACKEND.md - Isolation du Stockage R2

**Agent:** IMPL-BACKEND  
**Date:** 2025-02-02  
**Focus:** Isolation du code par userId dans R2

---

## 🎯 Objectif

Sécuriser le stockage des fichiers en isolant chaque utilisateur dans son propre namespace R2.

**Avant:** `projects/{projectId}/files/{path}` → Risque si projectId deviné  
**Après:** `users/{userId}/projects/{projectId}/files/{path}` → Isolation complète

---

## 📁 Fichiers Modifiés

### 1. `src/lib/files/storage.ts`

#### Changement Principal

```typescript
// ══════════════════════════════════════════════════════════════
// AVANT - Pattern non sécurisé (global)
// ══════════════════════════════════════════════════════════════
export function getStorageKey(projectId: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `projects/${projectId}/files${normalizedPath}`
}

// ══════════════════════════════════════════════════════════════
// APRÈS - Isolation par userId avec validation
// ══════════════════════════════════════════════════════════════
export function getStorageKey(userId: string, projectId: string, path: string): string {
  // Validation contre path traversal attacks
  if (!userId || userId.includes('/') || userId.includes('..')) {
    throw new Error('Invalid userId for storage key')
  }
  if (!projectId || projectId.includes('/') || projectId.includes('..')) {
    throw new Error('Invalid projectId for storage key')
  }
  
  // Normaliser et sanitizer le path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const sanitizedPath = normalizedPath.replace(/\.\./g, '')
  
  return `users/${userId}/projects/${projectId}/files${sanitizedPath}`
}
```

#### Fonction Legacy (Backward Compatibility)

```typescript
/**
 * @deprecated Use getStorageKey(userId, projectId, path) instead
 * Kept for migration of existing files
 */
export function getLegacyStorageKey(projectId: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `projects/${projectId}/files${normalizedPath}`
}
```

---

### 2. `src/lib/files/service.ts`

#### Import Mis à Jour

```typescript
// Ajout de getLegacyStorageKey pour migration
import { getStorageClient, getStorageKey, getLegacyStorageKey } from './storage'
```

#### Méthode `createFile()` - Ligne ~154

```typescript
// AVANT
if (isLarge) {
  storageKey = getStorageKey(projectId, normalizedPath)
  await this.storage.put(storageKey, content)
}

// APRÈS - Utilise userId du projet
if (isLarge) {
  storageKey = getStorageKey(project.userId, projectId, normalizedPath)
  await this.storage.put(storageKey, content)
}
```

#### Méthode `updateFile()` - Ligne ~282

```typescript
// AVANT
if (isLarge) {
  storageKey = storageKey || getStorageKey(projectId, normalizedPath)
  await this.storage.put(storageKey, content)
}

// APRÈS - Utilise userId via existing.project
if (isLarge) {
  storageKey = storageKey || getStorageKey(existing.project.userId, projectId, normalizedPath)
  await this.storage.put(storageKey, content)
}
```

#### Méthode `renameFile()` - Lignes ~495-517

```typescript
// AVANT - Query sans include project
const file = await prisma.file.findUnique({
  where: { projectId_path: { projectId, path: normalizedFrom } },
})

// Update storage key
if (file.storageKey && this.storage.isAvailable) {
  const content = await this.storage.get(file.storageKey)
  newStorageKey = getStorageKey(projectId, normalizedTo)  // ❌ Manque userId
  await this.storage.put(newStorageKey, content)
}

// APRÈS - Include project pour accéder à userId
const file = await prisma.file.findUnique({
  where: { projectId_path: { projectId, path: normalizedFrom } },
  include: { project: true },  // ✅ Ajouté
})

// Update storage key avec userId
if (file.storageKey && this.storage.isAvailable) {
  const content = await this.storage.get(file.storageKey)
  newStorageKey = getStorageKey(file.project.userId, projectId, normalizedTo)  // ✅ Avec userId
  await this.storage.put(newStorageKey, content)
}
```

---

### 3. `src/lib/files/index.ts`

#### Export Mis à Jour

```typescript
// AVANT
export { StorageClient, getStorageClient, getStorageKey, isR2Configured } from './storage'

// APRÈS - Ajout de getLegacyStorageKey
export { 
  StorageClient, 
  getStorageClient, 
  getStorageKey, 
  getLegacyStorageKey,  // ✅ Pour migration
  isR2Configured,
} from './storage'
```

---

## 🔒 Sécurité Ajoutée

### Protection Path Traversal

| Attaque | Validation | Résultat |
|---------|------------|----------|
| `userId = "../admin"` | `includes('..')` | ❌ Rejeté |
| `userId = "user/../../"` | `includes('/')` | ❌ Rejeté |
| `path = "/../../../etc/passwd"` | `.replace(/\.\./g, '')` | ✅ Sanitisé |

### Exemple de Protection

```typescript
// Tentative d'attaque
getStorageKey('../admin', 'proj123', '/secret.txt')
// → Error: Invalid userId for storage key

// Tentative path traversal
getStorageKey('user1', 'proj1', '/../../../etc/passwd')
// → "users/user1/projects/proj1/files///etc/passwd" (.. supprimés)
```

---

## 📊 Structure R2 Avant/Après

```
# AVANT (risque de sécurité)
appforge-files/
├── projects/
│   ├── proj_abc123/
│   │   └── files/
│   │       ├── src/App.tsx
│   │       └── package.json
│   └── proj_def456/
│       └── files/...

# APRÈS (isolation par utilisateur)
appforge-files/
├── users/
│   ├── user_alice/
│   │   └── projects/
│   │       └── proj_abc123/
│   │           └── files/
│   │               ├── src/App.tsx
│   │               └── package.json
│   └── user_bob/
│       └── projects/
│           └── proj_def456/
│               └── files/...
```

---

## 🔄 Migration des Fichiers Existants

### Script de Migration (à exécuter)

```typescript
// scripts/migrate-r2-isolation.ts
import { prisma } from '@/lib/prisma'
import { getStorageClient, getStorageKey, getLegacyStorageKey } from '@/lib/files/storage'

async function migrateR2Isolation() {
  const storage = getStorageClient()
  
  // 1. Récupérer tous les fichiers avec storageKey
  const files = await prisma.file.findMany({
    where: { storageKey: { not: null } },
    include: { project: true },
  })
  
  console.log(`Found ${files.length} files to migrate`)
  
  for (const file of files) {
    const oldKey = file.storageKey!
    const newKey = getStorageKey(file.project.userId, file.projectId, file.path)
    
    // Skip si déjà migré
    if (oldKey === newKey || oldKey.startsWith('users/')) {
      continue
    }
    
    try {
      // 2. Lire le contenu depuis l'ancien key
      const content = await storage.get(oldKey)
      
      // 3. Écrire vers le nouveau key
      await storage.put(newKey, content)
      
      // 4. Mettre à jour la base de données
      await prisma.file.update({
        where: { id: file.id },
        data: { storageKey: newKey },
      })
      
      // 5. Supprimer l'ancien fichier
      await storage.delete(oldKey)
      
      console.log(`✅ Migrated: ${oldKey} → ${newKey}`)
    } catch (error) {
      console.error(`❌ Failed: ${file.path}`, error)
    }
  }
  
  console.log('Migration complete!')
}

migrateR2Isolation()
```

### Commande d'Exécution

```bash
npx ts-node scripts/migrate-r2-isolation.ts
```

---

## 🧪 Tests de Validation

```typescript
// tests/storage-isolation.test.ts
import { getStorageKey, getLegacyStorageKey } from '@/lib/files/storage'

describe('R2 Storage Isolation', () => {
  describe('getStorageKey', () => {
    it('should include userId in the path', () => {
      const key = getStorageKey('user123', 'proj456', '/src/app.tsx')
      expect(key).toBe('users/user123/projects/proj456/files/src/app.tsx')
    })

    it('should normalize path without leading slash', () => {
      const key = getStorageKey('user1', 'proj1', 'file.txt')
      expect(key).toBe('users/user1/projects/proj1/files/file.txt')
    })

    it('should reject userId with path traversal', () => {
      expect(() => getStorageKey('../admin', 'proj', '/file'))
        .toThrow('Invalid userId')
    })

    it('should reject userId with slash', () => {
      expect(() => getStorageKey('user/other', 'proj', '/file'))
        .toThrow('Invalid userId')
    })

    it('should reject projectId with path traversal', () => {
      expect(() => getStorageKey('user', '../proj', '/file'))
        .toThrow('Invalid projectId')
    })

    it('should sanitize path traversal in file path', () => {
      const key = getStorageKey('user', 'proj', '/../../../etc/passwd')
      expect(key).not.toContain('..')
      expect(key).toBe('users/user/projects/proj/files///etc/passwd')
    })
  })

  describe('getLegacyStorageKey', () => {
    it('should return old format for migration', () => {
      const key = getLegacyStorageKey('proj456', '/src/app.tsx')
      expect(key).toBe('projects/proj456/files/src/app.tsx')
    })
  })
})
```

---

## ✅ Checklist

- [x] `storage.ts` - Nouvelle signature `getStorageKey(userId, projectId, path)`
- [x] `storage.ts` - Validation path traversal sur userId et projectId
- [x] `storage.ts` - Sanitization du path (suppression `..`)
- [x] `storage.ts` - Fonction legacy `getLegacyStorageKey()` pour migration
- [x] `service.ts` - `createFile()` utilise `project.userId`
- [x] `service.ts` - `updateFile()` utilise `existing.project.userId`
- [x] `service.ts` - `renameFile()` inclut project et utilise `file.project.userId`
- [x] `index.ts` - Export de `getLegacyStorageKey`
- [x] Build validé ✅
- [ ] Script de migration R2 à exécuter
- [ ] Tests unitaires à ajouter

---

## 📈 Impact

| Aspect | Avant | Après |
|--------|-------|-------|
| Isolation | ❌ Globale | ✅ Par utilisateur |
| Path Traversal | ❌ Vulnérable | ✅ Protégé |
| Blast Radius (breach) | 🔴 Tous les users | 🟢 Un seul user |
| Audit/Logging | Difficile | Facile (par userId) |

---

*IMPL-BACKEND Agent - Modifications d'isolation R2 terminées*
