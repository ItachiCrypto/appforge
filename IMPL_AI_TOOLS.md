# 🛠️ IMPL_AI_TOOLS - Activation des Tools IA

> **Agent**: IMPL-AI-TOOLS  
> **Statut**: ✅ COMPLÉTÉ

---

## 📋 Résumé

Activation des tools IA pour l'accès fichiers **on-demand** au lieu d'injecter tout le code dans le prompt.

**Avant**: System Prompt + TOUT LE CODE (~15,000+ tokens)  
**Après**: System Prompt + Liste des fichiers (~1,500 tokens) + Tools à la demande

**Économie estimée**: **70-80% de tokens en moins**

---

## 📁 Fichiers Modifiés

### 1. `/src/lib/ai/prompts.ts`

#### Ajouts :

```typescript
// Instructions pour l'IA sur comment utiliser les tools
export const TOOLS_SYSTEM_PROMPT = `
## 🛠️ File Manipulation Tools

You have access to powerful tools for reading and manipulating project files directly.
**IMPORTANT**: Do NOT assume you know the file contents. Use the tools to read files before modifying them.

### Available Tools:
1. **list_files** - See all files in the project
2. **read_file** - Read a file's content (ALWAYS use before modifying)
3. **write_file** - Create new files or replace existing ones
4. **update_file** - Update an existing file
5. **delete_file** - Remove a file
6. **move_file** - Rename or move files
7. **search_files** - Find text across files
8. **get_project_info** - Get project metadata

### ⚠️ Critical Rules:
1. **NEVER guess file contents** - Always read_file first
2. **Provide COMPLETE content** - Never use "// rest of code..." placeholders
3. **One change at a time** - Make atomic, logical changes
...
`;

// Génère un contexte minimal (liste de fichiers, pas le contenu)
export function buildMinimalContext(context: {
  name: string;
  type: string;
  files: Array<{ path: string; sizeBytes: number }>;
  totalSizeBytes: number;
}): string { ... }

// Format de sortie quand les tools sont désactivés
export const FALLBACK_CODE_OUTPUT_PROMPT = `...`;

// Injection de code legacy (fallback)
export function buildLegacyContext(files: Record<string, string>): string { ... }
```

---

### 2. `/src/app/api/chat/route.ts`

#### Imports ajoutés :

```typescript
import { 
  SYSTEM_PROMPT, 
  TOOLS_SYSTEM_PROMPT,           // ← NOUVEAU
  FALLBACK_CODE_OUTPUT_PROMPT,   // ← NOUVEAU
  buildMinimalContext,            // ← NOUVEAU
  buildLegacyContext,             // ← NOUVEAU
} from '@/lib/ai/prompts'

import {
  // ... existants ...
  ToolContext,           // ← NOUVEAU
  createAppContext,      // ← NOUVEAU
  createProjectContext,  // ← NOUVEAU
} from '@/lib/ai/tools/executor'
```

#### Changements dans POST() :

**Avant** (injectait tout le code) :
```typescript
// ❌ ANCIEN CODE SUPPRIMÉ
if (Object.keys(codeFiles).length > 0) {
  systemPrompt += `\n\n## Current App Files\n...`
  for (const [filename, content] of Object.entries(codeFiles)) {
    systemPrompt += `\n### ${filename}\n\`\`\`${ext}\n${content}\n\`\`\`\n`
  }
}
```

**Après** (contexte minimal + tools) :
```typescript
// ✅ NOUVEAU CODE
let toolContext: ToolContext | null = null

if (appId && app && enableTools) {
  toolContext = createAppContext(appId)
}
if (resolvedProjectId) {
  toolContext = createProjectContext(resolvedProjectId)
}

const toolsEnabled = enableTools && toolContext !== null

if (toolsEnabled) {
  // Ajouter les instructions tools
  systemPrompt += TOOLS_SYSTEM_PROMPT
  
  // Contexte minimal (liste de fichiers seulement, pas le contenu!)
  const fileList = Object.entries(codeFiles).map(([path, content]) => ({
    path: path.startsWith('/') ? path : '/' + path,
    sizeBytes: Buffer.byteLength(content || '', 'utf8'),
  }))
  
  systemPrompt += buildMinimalContext({
    name: app?.name || 'Untitled Project',
    type: app?.type || 'WEB',
    files: fileList,
    totalSizeBytes: fileList.reduce((sum, f) => sum + f.sizeBytes, 0),
  })
} else {
  // Fallback: injecter le code (ancien comportement)
  systemPrompt += FALLBACK_CODE_OUTPUT_PROMPT
  systemPrompt += buildLegacyContext(codeFiles)
}
```

#### Changements dans les fonctions de streaming :

```typescript
// Interface mise à jour
interface StreamOptions {
  toolContext: ToolContext | null  // ← Remplace projectId
  // ...
}

// Appel executeTools avec le contexte
const results = await executeTools(toolCalls, toolContext)  // ← toolContext au lieu de projectId
```

---

### 3. `/src/lib/ai/tools/executor.ts`

#### Ajouts :

```typescript
// Type pour supporter Apps legacy ET Projects v2
export type ToolContext = 
  | { type: 'project'; projectId: string }
  | { type: 'app'; appId: string }

// Helpers
export function createProjectContext(projectId: string): ToolContext
export function createAppContext(appId: string): ToolContext

// executeTool accepte maintenant ToolContext
export async function executeTool(call: ToolCall, context: ToolContext): Promise<ToolResult>
```

---

### 4. `/src/lib/ai/tools/legacy-adapter.ts` (NOUVEAU)

Permet aux tools de fonctionner avec les Apps legacy (stockage JSON).

```typescript
export class LegacyFileAdapter {
  async listFiles(appId: string, directory?: string): Promise<LegacyFileInfo[]>
  async readFile(appId: string, path: string): Promise<string>
  async writeFile(appId: string, path: string, content: string): Promise<{ created: boolean }>
  async updateFile(appId: string, path: string, content: string): Promise<void>
  async deleteFile(appId: string, path: string): Promise<void>
  async renameFile(appId: string, fromPath: string, toPath: string): Promise<void>
  async searchFiles(appId: string, query: string, glob?: string): Promise<LegacySearchResult[]>
  async getAppInfo(appId: string): Promise<AppInfo>
}
```

---

## 📊 Estimation des Gains

| Métrique | Avant | Après | Économie |
|----------|-------|-------|----------|
| Tokens par requête (app 20KB) | ~16,000 | ~3,000 | **81%** |
| Coût conversation 10 tours | ~$2.60 | ~$0.70 | **73%** |

### Comment ça marche maintenant :

```
1. User: "Ajoute un bouton dark mode"
2. AI reçoit: System Prompt + Liste fichiers (PAS le contenu)
3. AI appelle: list_files() → voit la structure
4. AI appelle: read_file("/App.tsx") → lit le fichier nécessaire
5. AI appelle: write_file("/App.tsx", newCode) → modifie
6. AI répond: "J'ai ajouté le bouton..."
```

L'IA ne lit que les fichiers dont elle a besoin, au lieu de recevoir tout le code à chaque requête.

---

## ✅ Build vérifié

```
npm run build → ✅ Succès
```

---

*Généré par IMPL-AI-TOOLS*
