# 🧠 BRAINSTORM: Intégration IA Avancée pour AppForge

> **Objectif**: Transformer AppForge d'un système "tout-en-prompt" vers une architecture intelligente avec accès fichiers on-demand, comme Claude Code/OpenClaw.

---

## 📊 Analyse du Système Actuel

### Architecture Existante

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLOW ACTUEL (Problématique)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Message                                                   │
│       │                                                          │
│       ▼                                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              SYSTEM_PROMPT (~800 tokens)                 │   │
│   │  +                                                       │   │
│   │  TOOLS_SYSTEM_PROMPT (~200 tokens)                      │   │
│   │  +                                                       │   │
│   │  ┌─────────────────────────────────────────────────┐    │   │
│   │  │         TOUS LES FICHIERS DU PROJET             │    │   │
│   │  │         (potentiellement 50KB-500KB!)           │    │   │
│   │  │                                                 │    │   │
│   │  │  /App.tsx: 500 lignes                          │    │   │
│   │  │  /components/Header.tsx: 200 lignes            │    │   │
│   │  │  /components/Sidebar.tsx: 300 lignes           │    │   │
│   │  │  /styles.css: 400 lignes                       │    │   │
│   │  │  ... etc                                        │    │   │
│   │  └─────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│                        LLM (GPT-4/Claude)                       │
│                              │                                   │
│                              ▼                                   │
│                      💸 10,000-50,000 tokens                    │
│                         PAR REQUÊTE !!!                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Code Problématique Identifié

**`/src/app/api/chat/route.ts` - Lignes 152-162:**
```typescript
// 🚨 PROBLÈME: Injection de TOUS les fichiers dans le prompt
if (Object.keys(codeFiles).length > 0) {
  systemPrompt += `\n\n## Current App Files\nThe user's app has the following files:\n`
  
  for (const [filename, content] of Object.entries(codeFiles)) {
    if (content && typeof content === 'string' && content.trim()) {
      const ext = filename.includes('.css') ? 'css' : 
                 filename.includes('.json') ? 'json' : 'tsx'
      systemPrompt += `\n### ${filename}\n\`\`\`${ext}\n${content}\n\`\`\`\n`
    }
  }
}
```

**`/src/app/(dashboard)/app/[id]/page.tsx` - Ligne 137:**
```typescript
// 🚨 Client envoie TOUS les fichiers à chaque message
body: JSON.stringify({
  appId,
  currentFiles: files, // ← TOUT LE CODE
  messages: [...],
}),
```

### Estimation Tokens - Avant Optimisation

| Scénario | Input Tokens | Output Tokens | Coût/Requête (GPT-4) |
|----------|--------------|---------------|----------------------|
| Petite app (5 fichiers, 2KB) | ~3,000 | ~1,500 | $0.07 |
| App moyenne (15 fichiers, 20KB) | ~15,000 | ~2,000 | $0.26 |
| Grande app (50 fichiers, 100KB) | ~75,000 | ~3,000 | $1.17 |
| **Conversation 10 tours (moyenne)** | **150,000** | **20,000** | **$2.60** |

### Ce Qui Existe Déjà (Non Utilisé!)

✅ **Tools définis** (`/src/lib/ai/tools/definitions.ts`):
- `list_files` - Lister les fichiers
- `read_file` - Lire un fichier
- `write_file` - Créer/écrire
- `update_file` - Modifier
- `delete_file` - Supprimer
- `move_file` - Renommer/déplacer
- `search_files` - Rechercher dans le code
- `get_project_info` - Métadonnées projet

✅ **Executor implémenté** (`/src/lib/ai/tools/executor.ts`):
- Connexion avec `FileService`
- Gestion d'erreurs
- Support OpenAI et Anthropic

❌ **Mais jamais vraiment activé!** 
- Le frontend envoie `currentFiles` au lieu de `projectId`
- Le code injecte les fichiers dans le prompt au lieu d'utiliser les tools

---

## 🎯 Architecture Cible: Accès On-Demand

### Vision

```
┌──────────────────────────────────────────────────────────────────┐
│                    NOUVEAU FLOW (Optimisé)                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Message: "Ajoute un bouton dark mode dans le Header"     │
│       │                                                          │
│       ▼                                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              SYSTEM_PROMPT (~800 tokens)                 │   │
│   │  +                                                       │   │
│   │  TOOLS_PROMPT (~300 tokens)                             │   │
│   │  +                                                       │   │
│   │  ┌─────────────────────────────────────────────────┐    │   │
│   │  │         CONTEXTE MINIMAL (~500 tokens)          │    │   │
│   │  │                                                 │    │   │
│   │  │  Project: "My SaaS Dashboard"                   │    │   │
│   │  │  Type: Web (React/TypeScript)                   │    │   │
│   │  │  Files: 12 files, 45KB total                    │    │   │
│   │  │                                                 │    │   │
│   │  │  Structure:                                     │    │   │
│   │  │  ├── /App.tsx (main, 2.1KB)                    │    │   │
│   │  │  ├── /components/                              │    │   │
│   │  │  │   ├── Header.tsx (1.2KB) ← RELEVANT        │    │   │
│   │  │  │   ├── Sidebar.tsx (0.8KB)                  │    │   │
│   │  │  │   └── Footer.tsx (0.5KB)                   │    │   │
│   │  │  └── /styles.css (3.2KB)                       │    │   │
│   │  │                                                 │    │   │
│   │  │  Recent changes: Header.tsx, App.tsx           │    │   │
│   │  └─────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│                        LLM (GPT-4/Claude)                       │
│                              │                                   │
│            ┌─────────────────┼─────────────────┐                │
│            ▼                 ▼                 ▼                │
│      [list_files]      [read_file]       [write_file]          │
│            │                 │                 │                │
│            ▼                 ▼                 ▼                │
│     "12 files..."    "Header.tsx:..."   "✓ Updated"           │
│                              │                                   │
│                              ▼                                   │
│                      💰 ~2,000-4,000 tokens                     │
│                         (10x moins!)                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Design des Tools IA

### 1. Tools Fichiers (Amélioration des Existants)

#### `list_files` - Amélioré
```typescript
interface ListFilesParams {
  path?: string;           // Défaut: "/"
  recursive?: boolean;     // Défaut: true
  includeContent?: boolean; // Défaut: false (juste metadata)
  glob?: string;           // Filtre: "*.tsx", "components/**"
}

interface ListFilesResponse {
  files: Array<{
    path: string;
    filename: string;
    extension: string;
    sizeBytes: number;
    sizeHuman: string;     // "2.1 KB"
    isDirectory: boolean;
    relevanceScore?: number; // 0-1, basé sur la query utilisateur
    lastModified: string;
    snippet?: string;       // Premiers 200 chars si demandé
  }>;
  totalFiles: number;
  totalSize: string;
  tree: string;            // ASCII tree view
}
```

**Exemple de réponse:**
```json
{
  "files": [
    { "path": "/App.tsx", "sizeHuman": "2.1 KB", "relevanceScore": 0.8 },
    { "path": "/components/Header.tsx", "sizeHuman": "1.2 KB", "relevanceScore": 0.95 }
  ],
  "totalFiles": 12,
  "totalSize": "45.2 KB",
  "tree": "├── App.tsx\n├── components/\n│   ├── Header.tsx\n│   └── ..."
}
```

#### `read_file` - Amélioré avec Chunking
```typescript
interface ReadFileParams {
  path: string;
  startLine?: number;      // Pour les gros fichiers
  endLine?: number;
  maxLines?: number;       // Défaut: 500
  includeLineNumbers?: boolean;
  searchContext?: string;  // Focus sur les parties pertinentes
}

interface ReadFileResponse {
  path: string;
  content: string;
  totalLines: number;
  returnedLines: { start: number; end: number };
  truncated: boolean;
  language: string;
  imports: string[];       // Parsed imports
  exports: string[];       // Parsed exports
  relevantSections?: Array<{
    startLine: number;
    endLine: number;
    reason: string;        // "Contains 'Header' component"
  }>;
}
```

#### `smart_read` - NOUVEAU Tool Intelligent
```typescript
// L'IA demande "montre-moi le code pertinent pour X"
interface SmartReadParams {
  query: string;           // "the dark mode toggle logic"
  maxTokens?: number;      // Budget tokens pour la réponse
  includeImports?: boolean;
}

interface SmartReadResponse {
  relevantCode: Array<{
    path: string;
    snippet: string;
    startLine: number;
    endLine: number;
    relevance: string;     // "Contains ThemeContext definition"
  }>;
  suggestedFiles: string[]; // Autres fichiers potentiellement utiles
}
```

#### `write_file` - Avec Validation
```typescript
interface WriteFileParams {
  path: string;
  content: string;
  createDirectories?: boolean;
  validate?: boolean;      // Check syntax avant d'écrire
}

interface WriteFileResponse {
  success: boolean;
  path: string;
  created: boolean;        // true si nouveau fichier
  previousSize?: number;
  newSize: number;
  validationErrors?: Array<{
    line: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
  affectedImports?: string[]; // Fichiers qui importent ce fichier
}
```

#### `edit_file` - NOUVEAU: Édition Chirurgicale
```typescript
// Comme la fonction Edit de Claude Code
interface EditFileParams {
  path: string;
  edits: Array<{
    oldText: string;       // Texte exact à remplacer
    newText: string;       // Nouveau texte
  }>;
}

interface EditFileResponse {
  success: boolean;
  path: string;
  editsApplied: number;
  editsFailed: Array<{
    oldText: string;
    reason: string;        // "Text not found" / "Ambiguous match"
  }>;
  diff: string;            // Unified diff
}
```

### 2. Tools Analyse de Code - NOUVEAUX

#### `analyze_dependencies`
```typescript
interface AnalyzeDependenciesParams {
  path?: string;           // Fichier spécifique ou tout le projet
}

interface AnalyzeDependenciesResponse {
  imports: Record<string, string[]>;  // { "/App.tsx": ["./components/Header", "react"] }
  exports: Record<string, string[]>;
  unusedFiles: string[];
  circularDeps: string[][];
  dependencyGraph: string;  // Mermaid diagram
}
```

#### `find_usages`
```typescript
interface FindUsagesParams {
  symbol: string;          // "Header", "useTheme", "handleClick"
  type?: 'component' | 'function' | 'variable' | 'type' | 'all';
}

interface FindUsagesResponse {
  definition: { path: string; line: number } | null;
  usages: Array<{
    path: string;
    line: number;
    context: string;       // Line content
    type: 'import' | 'call' | 'reference';
  }>;
}
```

#### `get_file_structure`
```typescript
// Parse un fichier et retourne sa structure
interface GetFileStructureParams {
  path: string;
}

interface GetFileStructureResponse {
  path: string;
  language: string;
  structure: {
    imports: Array<{ from: string; items: string[] }>;
    exports: Array<{ name: string; type: string; line: number }>;
    components: Array<{ name: string; line: number; props: string[] }>;
    functions: Array<{ name: string; line: number; params: string[] }>;
    types: Array<{ name: string; line: number }>;
    hooks: string[];       // useEffect, useState, custom hooks
  };
}
```

### 3. Tools Projet - NOUVEAUX

#### `get_project_context`
```typescript
// Remplace l'injection massive de code
interface GetProjectContextParams {
  includeTree?: boolean;
  includeRecentChanges?: boolean;
  maxDepth?: number;
}

interface GetProjectContextResponse {
  project: {
    id: string;
    name: string;
    type: 'WEB' | 'IOS' | 'ANDROID' | 'PYTHON' | 'API';
    framework: string;     // "react", "nextjs", "swift", etc.
    description: string;
  };
  stats: {
    totalFiles: number;
    totalSize: string;
    languages: Record<string, number>;  // { "tsx": 8, "css": 2 }
  };
  tree: string;            // ASCII tree
  entryPoints: string[];   // ["/App.tsx", "/index.tsx"]
  recentChanges: Array<{
    path: string;
    action: 'created' | 'modified' | 'deleted';
    timestamp: string;
  }>;
  keyFiles: Array<{
    path: string;
    role: string;          // "Main component", "Styles", "Types"
  }>;
}
```

#### `run_command` - Pour Exécution
```typescript
interface RunCommandParams {
  command: 'lint' | 'typecheck' | 'format' | 'test' | 'build';
  files?: string[];        // Spécifique ou tout
}

interface RunCommandResponse {
  success: boolean;
  output: string;
  errors: Array<{
    file: string;
    line: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
  duration: number;
}
```

---

## 🧠 Stratégie de Contexte Intelligent

### 1. Contexte Initial Minimal

Au lieu d'envoyer tout le code, on envoie:

```typescript
const MINIMAL_CONTEXT_PROMPT = `
## Project Context

**Name:** ${project.name}
**Type:** ${project.type} (${project.framework})
**Files:** ${stats.totalFiles} files, ${stats.totalSize}

### File Structure
${generateTree(files, { maxDepth: 3 })}

### Key Files
${keyFiles.map(f => `- ${f.path}: ${f.role}`).join('\n')}

### Recent Activity
${recentChanges.slice(0, 5).map(c => `- ${c.action}: ${c.path}`).join('\n')}

## How to Work With Files

You have tools to explore and modify files. DO NOT assume file contents.

1. **Before modifying**: Use \`read_file\` to see current content
2. **To find something**: Use \`search_files\` or \`find_usages\`
3. **To understand structure**: Use \`get_file_structure\`
4. **To make changes**: Use \`edit_file\` for small edits, \`write_file\` for full rewrites

Never guess what's in a file - always read it first.
`;
```

### 2. Chunking Intelligent pour Gros Fichiers

```typescript
const CHUNK_CONFIG = {
  maxLinesPerChunk: 200,
  overlapLines: 20,        // Contexte entre chunks
  maxChunksPerFile: 5,
  priorityZones: {
    imports: { weight: 0.3, maxLines: 30 },
    exports: { weight: 0.3, maxLines: 50 },
    targetFunction: { weight: 1.0, contextLines: 10 },
  }
};

async function smartChunk(
  content: string, 
  query: string,
  maxTokens: number
): Promise<ChunkedContent> {
  const lines = content.split('\n');
  
  // 1. Toujours inclure les imports
  const importSection = extractImports(lines);
  
  // 2. Trouver les sections pertinentes à la query
  const relevantSections = findRelevantSections(lines, query);
  
  // 3. Construire le chunk optimisé
  let chunk = importSection + '\n// ...\n';
  let tokenCount = estimateTokens(chunk);
  
  for (const section of relevantSections) {
    const sectionContent = lines.slice(section.start, section.end).join('\n');
    const sectionTokens = estimateTokens(sectionContent);
    
    if (tokenCount + sectionTokens < maxTokens) {
      chunk += `\n// Lines ${section.start}-${section.end}:\n`;
      chunk += sectionContent + '\n// ...\n';
      tokenCount += sectionTokens;
    }
  }
  
  return { chunk, totalLines: lines.length, includedRanges: relevantSections };
}
```

### 3. Cache de Fichiers Fréquents

```typescript
// Redis/In-memory cache pour fichiers souvent accédés
interface FileCache {
  projectId: string;
  path: string;
  contentHash: string;
  parsedStructure: FileStructure;
  accessCount: number;
  lastAccessed: Date;
}

class SmartFileCache {
  private cache = new LRUCache<string, FileCache>({
    max: 1000,
    maxAge: 1000 * 60 * 30, // 30 min TTL
  });

  async getOrParse(projectId: string, path: string): Promise<FileStructure> {
    const key = `${projectId}:${path}`;
    const cached = this.cache.get(key);
    
    if (cached) {
      const currentHash = await this.getFileHash(projectId, path);
      if (currentHash === cached.contentHash) {
        this.cache.set(key, { ...cached, accessCount: cached.accessCount + 1 });
        return cached.parsedStructure;
      }
    }
    
    // Parse et cache
    const content = await fileService.readFile(projectId, path);
    const structure = await parseFileStructure(content, path);
    
    this.cache.set(key, {
      projectId,
      path,
      contentHash: hashContent(content),
      parsedStructure: structure,
      accessCount: 1,
      lastAccessed: new Date(),
    });
    
    return structure;
  }
}
```

### 4. Relevance Scoring

```typescript
function calculateRelevance(file: FileInfo, query: string): number {
  let score = 0;
  
  // Nom de fichier contient des mots-clés
  const queryWords = query.toLowerCase().split(/\s+/);
  const filename = file.filename.toLowerCase();
  
  for (const word of queryWords) {
    if (filename.includes(word)) score += 0.3;
  }
  
  // Fichiers clés ont un boost
  if (file.path === '/App.tsx') score += 0.2;
  if (file.path.includes('components/')) score += 0.1;
  
  // Fichiers récemment modifiés
  const hoursSinceModified = (Date.now() - file.updatedAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceModified < 1) score += 0.2;
  else if (hoursSinceModified < 24) score += 0.1;
  
  // Fichiers souvent accédés dans la session
  const accessCount = sessionCache.getAccessCount(file.path);
  score += Math.min(accessCount * 0.05, 0.2);
  
  return Math.min(score, 1.0);
}
```

---

## 🌐 Support Multi-Type d'Apps

### Configuration par Type de Projet

```typescript
interface ProjectTypeConfig {
  type: 'WEB' | 'PYTHON' | 'IOS' | 'ANDROID' | 'API';
  framework?: string;
  
  // Fichiers clés à toujours mentionner
  keyFiles: string[];
  
  // Extensions supportées
  extensions: string[];
  
  // Entry points typiques
  entryPoints: string[];
  
  // Commandes disponibles
  commands: {
    lint?: string;
    typecheck?: string;
    test?: string;
    build?: string;
    run?: string;
  };
  
  // Runtime d'exécution
  runtime: 'sandpack' | 'webcontainer' | 'docker' | 'simulator' | 'none';
  
  // Prompt système spécialisé
  systemPromptAddition: string;
}

const PROJECT_CONFIGS: Record<string, ProjectTypeConfig> = {
  'WEB_REACT': {
    type: 'WEB',
    framework: 'react',
    keyFiles: ['/App.tsx', '/index.tsx', '/package.json'],
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'],
    entryPoints: ['/App.tsx', '/index.tsx'],
    commands: {
      lint: 'eslint . --ext .ts,.tsx',
      typecheck: 'tsc --noEmit',
      test: 'jest',
      build: 'npm run build',
    },
    runtime: 'sandpack',
    systemPromptAddition: `
## React/TypeScript Stack
- Use functional components with hooks
- Tailwind CSS for styling
- lucide-react for icons
- Strict TypeScript (no 'any')
`,
  },

  'WEB_NEXTJS': {
    type: 'WEB',
    framework: 'nextjs',
    keyFiles: ['/app/page.tsx', '/app/layout.tsx', '/next.config.js'],
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'],
    entryPoints: ['/app/page.tsx', '/app/layout.tsx'],
    commands: {
      lint: 'next lint',
      typecheck: 'tsc --noEmit',
      build: 'next build',
      run: 'next dev',
    },
    runtime: 'webcontainer',
    systemPromptAddition: `
## Next.js 14 App Router
- Use 'use client' directive for client components
- Server Components by default
- Use next/image for images
- Route handlers in /app/api/
`,
  },

  'PYTHON': {
    type: 'PYTHON',
    framework: 'python',
    keyFiles: ['/main.py', '/requirements.txt', '/pyproject.toml'],
    extensions: ['.py', '.txt', '.toml', '.yaml', '.json'],
    entryPoints: ['/main.py', '/app.py'],
    commands: {
      lint: 'ruff check .',
      typecheck: 'mypy .',
      test: 'pytest',
      run: 'python main.py',
    },
    runtime: 'docker',
    systemPromptAddition: `
## Python Stack
- Python 3.11+
- Type hints required (PEP 484)
- Use dataclasses or Pydantic for data structures
- Follow PEP 8 style guide
- requirements.txt for dependencies
`,
  },

  'IOS_SWIFT': {
    type: 'IOS',
    framework: 'swiftui',
    keyFiles: ['/App.swift', '/ContentView.swift', '/Package.swift'],
    extensions: ['.swift', '.json', '.plist'],
    entryPoints: ['/App.swift'],
    commands: {
      lint: 'swiftlint',
      build: 'swift build',
      test: 'swift test',
    },
    runtime: 'simulator',
    systemPromptAddition: `
## SwiftUI Stack
- iOS 16+ / SwiftUI
- Use @State, @Binding, @Observable
- SF Symbols for icons
- Async/await for concurrency
`,
  },

  'ANDROID_KOTLIN': {
    type: 'ANDROID',
    framework: 'compose',
    keyFiles: ['/MainActivity.kt', '/build.gradle.kts', '/AndroidManifest.xml'],
    extensions: ['.kt', '.kts', '.xml', '.json'],
    entryPoints: ['/MainActivity.kt'],
    commands: {
      lint: './gradlew lint',
      build: './gradlew build',
      test: './gradlew test',
    },
    runtime: 'simulator',
    systemPromptAddition: `
## Jetpack Compose Stack
- Kotlin with Compose UI
- Material 3 design system
- ViewModel + StateFlow for state
- Coroutines for async
`,
  },

  'API_NODEJS': {
    type: 'API',
    framework: 'express',
    keyFiles: ['/server.ts', '/routes/index.ts', '/package.json'],
    extensions: ['.ts', '.js', '.json'],
    entryPoints: ['/server.ts', '/index.ts'],
    commands: {
      lint: 'eslint .',
      typecheck: 'tsc --noEmit',
      test: 'jest',
      run: 'ts-node server.ts',
    },
    runtime: 'docker',
    systemPromptAddition: `
## Node.js API Stack
- Express.js with TypeScript
- Zod for validation
- JWT for auth
- Prisma for database
`,
  },
};
```

### Détection Automatique du Type

```typescript
async function detectProjectType(projectId: string): Promise<ProjectTypeConfig> {
  const files = await fileService.listFiles(projectId, '/');
  const filenames = files.map(f => f.filename.toLowerCase());
  
  // Next.js
  if (filenames.includes('next.config.js') || filenames.includes('next.config.ts')) {
    return PROJECT_CONFIGS['WEB_NEXTJS'];
  }
  
  // React (Vite, CRA, etc.)
  if (filenames.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) {
    return PROJECT_CONFIGS['WEB_REACT'];
  }
  
  // Python
  if (filenames.includes('requirements.txt') || filenames.includes('pyproject.toml')) {
    return PROJECT_CONFIGS['PYTHON'];
  }
  
  // iOS Swift
  if (filenames.some(f => f.endsWith('.swift'))) {
    return PROJECT_CONFIGS['IOS_SWIFT'];
  }
  
  // Android Kotlin
  if (filenames.some(f => f.endsWith('.kt'))) {
    return PROJECT_CONFIGS['ANDROID_KOTLIN'];
  }
  
  // API Node.js
  if (filenames.includes('server.ts') || filenames.includes('express')) {
    return PROJECT_CONFIGS['API_NODEJS'];
  }
  
  // Default
  return PROJECT_CONFIGS['WEB_REACT'];
}
```

---

## ⚡ Exécution & Preview

### Architecture des Runtimes

```
┌──────────────────────────────────────────────────────────────────┐
│                    RUNTIME ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │   Sandpack   │     │ WebContainer │     │    Docker    │   │
│   │   (React)    │     │   (Node.js)  │     │  (Python+)   │   │
│   └──────┬───────┘     └──────┬───────┘     └──────┬───────┘   │
│          │                    │                    │           │
│          ▼                    ▼                    ▼           │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                   RUNTIME MANAGER                        │  │
│   │                                                          │  │
│   │  - File sync bidirectionnel                             │  │
│   │  - Output streaming (logs, errors)                      │  │
│   │  - Hot reload                                           │  │
│   │  - Execution control (start, stop, restart)             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    PREVIEW IFRAME                        │  │
│   │                                                          │  │
│   │  - Sandboxed execution                                  │  │
│   │  - Console capture                                      │  │
│   │  - Error overlay                                        │  │
│   │  - Device simulation (mobile, tablet)                   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1. Sandpack pour Web Simple (Actuel)

```typescript
// Déjà implémenté - optimiser la sync
interface SandpackIntegration {
  // Sync files vers Sandpack
  syncFiles(files: Record<string, string>): void;
  
  // Écouter les changements dans l'éditeur Sandpack
  onFileChange(callback: (path: string, content: string) => void): void;
  
  // Récupérer la console
  getConsoleOutput(): ConsoleEntry[];
  
  // Récupérer les erreurs
  getErrors(): CompilationError[];
}
```

### 2. WebContainer pour Apps Complexes (À Implémenter)

```typescript
import { WebContainer } from '@webcontainer/api';

class WebContainerRuntime {
  private container: WebContainer | null = null;
  
  async initialize(projectId: string): Promise<void> {
    this.container = await WebContainer.boot();
    
    // Monter les fichiers
    const files = await fileService.getAllFiles(projectId);
    await this.container.mount(this.toWebContainerFS(files));
    
    // Installer les dépendances
    const installProcess = await this.container.spawn('npm', ['install']);
    await installProcess.exit;
    
    // Démarrer le dev server
    const devProcess = await this.container.spawn('npm', ['run', 'dev']);
    
    devProcess.output.pipeTo(new WritableStream({
      write: (data) => this.onOutput(data),
    }));
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    await this.container?.fs.writeFile(path, content);
  }
  
  getPreviewUrl(): string {
    return this.container?.getPreviewUrl() || '';
  }
}
```

### 3. Docker pour Backend/Python (À Implémenter)

```typescript
interface DockerRuntime {
  projectId: string;
  containerId?: string;
  
  // Build l'image du projet
  build(): Promise<BuildResult>;
  
  // Démarrer le container
  start(): Promise<{ url: string; containerId: string }>;
  
  // Exécuter une commande
  exec(command: string): Promise<ExecResult>;
  
  // Logs en streaming
  streamLogs(callback: (log: string) => void): void;
  
  // Arrêter
  stop(): Promise<void>;
}

// API Route pour Docker
app.post('/api/runtime/docker', async (req, res) => {
  const { projectId, action } = req.body;
  
  switch (action) {
    case 'start':
      const files = await fileService.getAllFiles(projectId);
      const containerId = await dockerService.createContainer({
        image: 'python:3.11-slim',
        files,
        command: ['python', 'main.py'],
        ports: { 8000: 'auto' },
      });
      
      const url = await dockerService.start(containerId);
      return res.json({ containerId, url });
      
    case 'exec':
      const { command } = req.body;
      const result = await dockerService.exec(containerId, command);
      return res.json(result);
      
    case 'stop':
      await dockerService.stop(containerId);
      return res.json({ success: true });
  }
});
```

### 4. Tool pour l'IA: `execute_code`

```typescript
interface ExecuteCodeParams {
  type: 'preview' | 'test' | 'lint' | 'run';
  command?: string;        // Pour 'run'
  timeout?: number;        // Max execution time (ms)
}

interface ExecuteCodeResponse {
  success: boolean;
  output: string;
  errors: Array<{
    type: 'compile' | 'runtime' | 'lint';
    file: string;
    line?: number;
    message: string;
  }>;
  previewUrl?: string;
  duration: number;
}
```

---

## 📊 Estimation Tokens - Après Optimisation

### Nouveau Flow

| Étape | Tokens | Notes |
|-------|--------|-------|
| System Prompt | ~800 | Inchangé |
| Tools Description | ~400 | 8 tools |
| Contexte Minimal | ~300 | Tree + stats seulement |
| Historique (5 msgs) | ~1,000 | Résumé des tours précédents |
| **Input Total** | **~2,500** | vs 15,000 avant! |

### Tool Calls (par interaction type)

| Interaction | Tools appelés | Tokens supplémentaires |
|-------------|---------------|------------------------|
| "Change le bouton" | read_file (1), write_file (1) | ~1,500 |
| "Refactor ce composant" | list_files, read_file (3), write_file (2) | ~4,000 |
| "Ajoute une feature" | get_project_context, read_file (2), write_file (3) | ~5,000 |

### Comparaison Coûts

| Scénario | Avant | Après | Économie |
|----------|-------|-------|----------|
| Petite app, 1 modif | $0.07 | $0.03 | **57%** |
| App moyenne, 5 modifs | $1.30 | $0.35 | **73%** |
| Grande app, 10 modifs | $11.70 | $2.50 | **79%** |
| **Conversation complète** | **$2.60** | **$0.60** | **77%** |

---

## 🗓️ Plan d'Implémentation

### Phase 1: Activation des Tools Existants (2 jours)

```typescript
// 1. Modifier le frontend pour envoyer projectId au lieu de currentFiles
// /src/app/(dashboard)/app/[id]/page.tsx

const handleSend = async (text?: string) => {
  // ...
  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      appId,
      projectId: app.projectId,  // ← NOUVEAU
      // currentFiles: files,     // ← SUPPRIMÉ
      messages: [...],
      enableTools: true,          // ← ACTIVER
    }),
  });
};
```

```typescript
// 2. Modifier le backend pour utiliser les tools au lieu d'injecter le code
// /src/app/api/chat/route.ts

// SUPPRIMER ce bloc:
// if (Object.keys(codeFiles).length > 0) {
//   systemPrompt += `\n\n## Current App Files\n...`
// }

// REMPLACER par:
systemPrompt += await buildMinimalContext(projectId);
```

### Phase 2: Contexte Intelligent (3 jours)

- [ ] Implémenter `buildMinimalContext()`
- [ ] Ajouter `smart_read` tool
- [ ] Implémenter le chunking pour gros fichiers
- [ ] Cache LRU pour fichiers parsés

### Phase 3: Tools Avancés (3 jours)

- [ ] Implémenter `edit_file` (édition chirurgicale)
- [ ] Ajouter `find_usages`
- [ ] Ajouter `get_file_structure`
- [ ] Ajouter `analyze_dependencies`

### Phase 4: Multi-Runtime (5 jours)

- [ ] Intégrer WebContainer API
- [ ] Setup Docker backend
- [ ] Unifier l'interface RuntimeManager
- [ ] Tool `execute_code` pour l'IA

### Phase 5: Polish & Monitoring (2 jours)

- [ ] Dashboard usage tokens par user
- [ ] Alertes sur dépassement budget
- [ ] Métriques de performance des tools
- [ ] Tests E2E du flow complet

---

## 🎯 Quick Wins (Faire Maintenant)

### 1. Stopper l'injection de fichiers (30 min)
```typescript
// route.ts - Commenter le bloc qui injecte les fichiers
// if (Object.keys(codeFiles).length > 0) { ... }
```

### 2. Activer les tools pour tous les projets (30 min)
```typescript
// S'assurer que projectId est toujours passé
const resolvedProjectId = projectId || await getOrCreateProjectForApp(appId);
```

### 3. Ajouter le contexte minimal (1h)
```typescript
const minimalContext = `
Project: ${project.name} (${project.type})
Files: ${files.length} files, ${totalSize}

Use list_files and read_file to explore the code.
`;
systemPrompt += minimalContext;
```

---

## 📚 Ressources & Références

- [OpenClaw Architecture](https://github.com/openclaw) - Inspiration pour le flow on-demand
- [Vercel AI SDK](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling) - Tool calling patterns
- [WebContainer API](https://webcontainers.io/guides/quickstart) - Pour runtimes complexes
- [Sandpack Docs](https://sandpack.codesandbox.io/docs) - Preview React

---

*Document créé par l'Expert Intégration IA - OpenClaw*
*Dernière mise à jour: $(date)*
