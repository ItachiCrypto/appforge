# 🏗️ BRAINSTORM ARCHITECTURE - Stockage, Isolation & Multi-Type

**Version:** 1.0  
**Date:** 2025-02-02  
**Auteur:** Expert Architecture & Sécurité  

---

## 📋 Table des Matières

1. [Analyse du Code Existant](#1-analyse-du-code-existant)
2. [Stockage & Limites par Plan](#2-stockage--limites-par-plan)
3. [Isolation & Sécurité du Code](#3-isolation--sécurité-du-code)
4. [Support Multi-Type d'Apps](#4-support-multi-type-dapps)
5. [Architecture Cible](#5-architecture-cible)
6. [Risques & Mitigations](#6-risques--mitigations)
7. [Estimation de Complexité](#7-estimation-de-complexité)

---

## 1. Analyse du Code Existant

### 1.1 Schéma Prisma Actuel

Le schéma est **bien structuré** avec une architecture v2 moderne :

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MODÈLE DE DONNÉES ACTUEL                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User ──────────────────────────────────────────────────────┐           │
│    │  - clerkId, email                                      │           │
│    │  - plan: FREE | PRO | TEAM | ENTERPRISE                │           │
│    │  - creditBalance: Float                                │           │
│    │  - storageUsedBytes: BigInt ✅ (nouveau)               │           │
│    │  - storageQuotaBytes: BigInt ✅ (nouveau)              │           │
│    │  - byokEnabled, openaiKey, anthropicKey                │           │
│    │                                                         │           │
│    └──▶ Project ────────────────────────────────┐           │           │
│           │  - type: NEXTJS | REACT | VUE | etc │           │           │
│           │  - status: DRAFT | BUILDING | etc    │           │           │
│           │  - totalSizeBytes: BigInt            │           │           │
│           │  - fileCount: Int                    │           │           │
│           │                                       │           │           │
│           └──▶ File ─────────────────────────────┘           │           │
│                  - path: String (unique per project)         │           │
│                  - content: String? (inline < 100KB)         │           │
│                  - storageKey: String? (R2 > 100KB)          │           │
│                  - sizeBytes: Int                            │           │
│                  - contentHash: String?                      │           │
│                                                              │           │
│           └──▶ FileVersion ─────────────────────────────────┘           │
│                  - version: Int                                          │
│                  - changeType: CREATED | MODIFIED | DELETED              │
│                  - changeMessage: String?                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Points Forts ✅

| Aspect | Implémentation | Évaluation |
|--------|---------------|------------|
| **Quotas par Plan** | `PLAN_QUOTAS` dans `quota.ts` | ✅ Bien défini |
| **Stockage Hybride** | Inline (<100KB) + R2 (>100KB) | ✅ Intelligent |
| **Versioning** | FileVersion + ProjectVersion | ✅ Git-like |
| **Hash de Contenu** | SHA-256 pour détection de changements | ✅ Efficace |
| **API Files** | CRUD complet avec validation | ✅ Robuste |

### 1.3 Lacunes Identifiées ⚠️

| Aspect | Problème | Impact |
|--------|----------|--------|
| **Isolation Code** | Tous les fichiers dans le même bucket R2 | 🔴 Critique |
| **Sandboxing Exécution** | Pas d'isolation pour preview | 🔴 Critique |
| **Multi-Type Apps** | `ProjectType` limité à web frameworks | 🟡 Moyen |
| **Métadonnées Mobile** | Pas de champs iOS/Android spécifiques | 🟡 Moyen |
| **Row-Level Security** | Pas de RLS Postgres natif | 🟡 Moyen |
| **Encryption at Rest** | Fichiers inline en clair dans DB | 🟡 Moyen |

---

## 2. Stockage & Limites par Plan

### 2.1 Configuration Existante (quota.ts)

```typescript
// Actuel - bien défini
export const PLAN_QUOTAS = {
  FREE: {
    maxProjects: 3,
    storageBytes: 100 * 1024 * 1024,        // 100 MB
    monthlyCredits: 1000,
    maxFileSize: 5 * 1024 * 1024,           // 5 MB
    canDeploy: false,
    canCustomDomain: false,
    maxTeamMembers: 1,
  },
  PRO: {
    maxProjects: 20,
    storageBytes: 5 * 1024 * 1024 * 1024,   // 5 GB
    monthlyCredits: 10000,
    maxFileSize: 50 * 1024 * 1024,          // 50 MB
    canDeploy: true,
    canCustomDomain: true,
    maxTeamMembers: 1,
  },
  // ...
}
```

### 2.2 Proposition d'Améliorations

#### 2.2.1 Nouvelles Limites à Ajouter

```typescript
export const PLAN_QUOTAS_V2 = {
  FREE: {
    // Existant
    maxProjects: 3,
    storageBytes: 100 * 1024 * 1024,
    maxFileSize: 5 * 1024 * 1024,
    monthlyCredits: 1000,
    
    // 🆕 Nouvelles limites
    maxFilesPerProject: 100,           // Évite spam
    maxConversationsPerProject: 10,    // Limite historique
    maxPreviewMinutesPerDay: 60,       // WebContainer CPU
    maxAIRequestsPerHour: 20,          // Rate limiting AI
    maxDeployments: 0,                 // FREE = preview only
    
    // 🆕 Limites par type d'app
    allowedAppTypes: ['WEB', 'STATIC'],  // Pas de mobile en free
  },
  
  PRO: {
    maxProjects: 20,
    storageBytes: 5 * 1024 * 1024 * 1024,
    maxFileSize: 50 * 1024 * 1024,
    monthlyCredits: 10000,
    
    maxFilesPerProject: 1000,
    maxConversationsPerProject: 100,
    maxPreviewMinutesPerDay: 480,      // 8h
    maxAIRequestsPerHour: 100,
    maxDeployments: 10,
    
    allowedAppTypes: ['WEB', 'STATIC', 'API', 'REACT', 'VUE', 'SVELTE'],
  },
  
  TEAM: {
    maxProjects: 100,
    storageBytes: 50 * 1024 * 1024 * 1024,
    maxFileSize: 100 * 1024 * 1024,
    monthlyCredits: 50000,
    
    maxFilesPerProject: 5000,
    maxConversationsPerProject: 500,
    maxPreviewMinutesPerDay: Infinity,
    maxAIRequestsPerHour: 500,
    maxDeployments: Infinity,
    
    allowedAppTypes: ['*'],  // Tous types
  },
  
  ENTERPRISE: {
    // Tout illimité + fonctionnalités custom
    // ... Infinity partout
  },
}
```

#### 2.2.2 Architecture d'Enforcement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENFORCEMENT DES LIMITES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  API Request                                                                 │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────┐                                                            │
│  │  Middleware │  ◄── Rate Limiter (par user, par endpoint)                 │
│  │  Auth Check │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                    QUOTA CHECKER SERVICE                     │           │
│  │  ┌───────────────────────────────────────────────────────┐  │           │
│  │  │ checkQuota(userId, operation, params)                  │  │           │
│  │  │   ├── checkStorageQuota() ✅ (existant)                │  │           │
│  │  │   ├── checkProjectLimit() ✅ (existant)                │  │           │
│  │  │   ├── checkFileSizeLimit() ✅ (existant)               │  │           │
│  │  │   ├── checkFileCount() 🆕                              │  │           │
│  │  │   ├── checkPreviewMinutes() 🆕                         │  │           │
│  │  │   ├── checkAIRequestRate() 🆕                          │  │           │
│  │  │   └── checkDeployLimit() 🆕                            │  │           │
│  │  └───────────────────────────────────────────────────────┘  │           │
│  └────────────────────────┬────────────────────────────────────┘           │
│                           │                                                  │
│         ┌─────────────────┼─────────────────┐                               │
│         ▼                 ▼                 ▼                               │
│    ✅ ALLOWED       ⚠️ SOFT LIMIT     ❌ HARD LIMIT                         │
│    (proceed)        (warn user)       (block + error)                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.3 Soft vs Hard Limits

| Limite | Type | Comportement à 80% | Comportement à 100% |
|--------|------|-------------------|---------------------|
| Storage | Hard | ⚠️ Warning UI | ❌ Block writes |
| Projects | Hard | ⚠️ Warning | ❌ Block create |
| Files/Project | Soft | ⚠️ Warning | ⚠️ Performance warning |
| AI Requests/h | Hard | ⚠️ Slowdown | ❌ 429 Rate Limited |
| Preview Minutes | Soft | ⚠️ Warning | ❌ Preview disabled |

#### 2.2.4 Nouveau Schema Prisma

```prisma
// Ajouts au schema existant

model User {
  // ... existant ...
  
  // 🆕 Tracking d'utilisation temps réel
  aiRequestsToday     Int       @default(0)
  aiRequestsResetAt   DateTime  @default(now())
  previewMinutesToday Int       @default(0)
  previewResetAt      DateTime  @default(now())
  deploymentsThisMonth Int      @default(0)
  deploymentsResetAt  DateTime  @default(now())
}

// 🆕 Table d'audit pour tracking détaillé
model UsageLog {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  operation   UsageOperation  // AI_REQUEST, PREVIEW_START, DEPLOY, FILE_WRITE
  resourceId  String?         // projectId, fileId, etc
  
  // Métriques
  bytesUsed   Int?
  tokensUsed  Int?
  durationMs  Int?
  
  createdAt   DateTime  @default(now())
  
  @@index([userId, operation, createdAt])
}

enum UsageOperation {
  AI_REQUEST
  PREVIEW_START
  PREVIEW_STOP
  FILE_CREATE
  FILE_UPDATE
  FILE_DELETE
  DEPLOY_START
  DEPLOY_COMPLETE
}
```

---

## 3. Isolation & Sécurité du Code

### 3.1 État Actuel - Problèmes

```
⚠️ ARCHITECTURE ACTUELLE (NON SÉCURISÉE)

User A ─────┐
            │
            ▼
        ┌───────────────────────────────────────────┐
        │           R2 Bucket: appforge-files       │
        │                                           │
User B ─┼──▶  /projects/proj_abc123/files/...      │  ← Tous dans
        │     /projects/proj_def456/files/...      │    le même bucket!
        │     /projects/proj_ghi789/files/...      │
User C ─┤                                           │
        └───────────────────────────────────────────┘

Risques:
├── Bucket credentials leak = TOUT compromis
├── Path traversal attack possible
├── Pas de logging granulaire par user
└── Blast radius énorme en cas de breach
```

### 3.2 Stratégie d'Isolation Multi-Niveau

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE SÉCURISÉE PROPOSÉE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NIVEAU 1: ISOLATION LOGIQUE (Database)                                     │
│  ══════════════════════════════════════                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │                    PostgreSQL + RLS                           │           │
│  │  ┌──────────────────────────────────────────────────────┐    │           │
│  │  │ CREATE POLICY user_files ON files                     │    │           │
│  │  │   USING (project.user_id = auth.uid())               │    │           │
│  │  │                                                       │    │           │
│  │  │ CREATE POLICY user_projects ON projects               │    │           │
│  │  │   USING (user_id = auth.uid() OR                     │    │           │
│  │  │          id IN (SELECT project_id FROM members       │    │           │
│  │  │                  WHERE user_id = auth.uid()))        │    │           │
│  │  └──────────────────────────────────────────────────────┘    │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  NIVEAU 2: ISOLATION PHYSIQUE (Storage)                                     │
│  ════════════════════════════════════════                                   │
│                                                                              │
│  Option A: Préfixes par Tenant (Recommandé pour MVP)                        │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  R2 Bucket: appforge-files                                    │           │
│  │  ├── /tenant_user123/                                         │           │
│  │  │   └── project_abc/                                         │           │
│  │  │       └── files/...                                        │           │
│  │  ├── /tenant_user456/                                         │           │
│  │  │   └── project_def/                                         │           │
│  │  └── Signed URLs + Short TTL (15min)                         │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  Option B: Buckets Séparés (Enterprise)                                     │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  appforge-user123-bucket (dédié)                              │           │
│  │  appforge-user456-bucket (dédié)                              │           │
│  │  → Plus coûteux mais isolation totale                         │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  NIVEAU 3: ISOLATION EXÉCUTION (Preview/Build)                              │
│  ═════════════════════════════════════════════                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │                  Sandboxing Options                           │           │
│  │                                                                │           │
│  │  Option 1: WebContainer (StackBlitz)                         │           │
│  │  ├── ✅ Browser-based, pas de serveur                        │           │
│  │  ├── ✅ Isolation native via browser sandbox                 │           │
│  │  ├── ✅ Déjà utilisé pour les previews                       │           │
│  │  └── ⚠️ Limité en puissance, pas de native code             │           │
│  │                                                                │           │
│  │  Option 2: Firecracker microVMs (AWS)                        │           │
│  │  ├── ✅ Isolation kernel-level                               │           │
│  │  ├── ✅ Boot en < 150ms                                      │           │
│  │  ├── ⚠️ Infrastructure à gérer                               │           │
│  │  └── 💰 Coût plus élevé                                      │           │
│  │                                                                │           │
│  │  Option 3: Fly Machines (Recommandé)                         │           │
│  │  ├── ✅ microVMs managées                                    │           │
│  │  ├── ✅ Pay-per-use (stop quand pas utilisé)                │           │
│  │  ├── ✅ Isolation complète                                   │           │
│  │  └── ✅ API simple                                           │           │
│  │                                                                │           │
│  │  Option 4: Cloudflare Workers + Durable Objects              │           │
│  │  ├── ✅ Edge computing, très rapide                          │           │
│  │  ├── ✅ Isolation V8 isolate                                 │           │
│  │  ├── ⚠️ Limites de temps d'exécution                        │           │
│  │  └── ✅ Pas de cold start                                    │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Implémentation RLS Détaillée

```sql
-- Activer RLS sur les tables sensibles
ALTER TABLE "File" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectVersion" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects" ON "Project"
    FOR SELECT
    USING ("userId" = current_setting('app.current_user_id')::text);

-- Policy: Users can view projects they're members of
CREATE POLICY "Members can view shared projects" ON "Project"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "ProjectMember"
            WHERE "projectId" = "Project".id
            AND "userId" = current_setting('app.current_user_id')::text
        )
    );

-- Policy: Only owners can modify projects
CREATE POLICY "Owners can modify projects" ON "Project"
    FOR ALL
    USING ("userId" = current_setting('app.current_user_id')::text);

-- Policy: Files accessible only via project access
CREATE POLICY "Files follow project access" ON "File"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "Project"
            WHERE "Project".id = "File"."projectId"
            AND (
                "Project"."userId" = current_setting('app.current_user_id')::text
                OR EXISTS (
                    SELECT 1 FROM "ProjectMember"
                    WHERE "projectId" = "Project".id
                    AND "userId" = current_setting('app.current_user_id')::text
                )
            )
        )
    );
```

### 3.4 Service d'Accès Sécurisé aux Fichiers

```typescript
// lib/files/secure-storage.ts

import { SignJWT, jwtVerify } from 'jose'

interface SecureFileAccess {
  generateSignedUrl(
    userId: string,
    projectId: string,
    path: string,
    operation: 'read' | 'write',
    expiresInSeconds?: number
  ): Promise<string>
  
  validateAccess(
    userId: string,
    projectId: string,
    operation: 'read' | 'write'
  ): Promise<boolean>
}

export class SecureStorageService implements SecureFileAccess {
  private signingKey: Uint8Array
  
  constructor() {
    this.signingKey = new TextEncoder().encode(process.env.FILE_SIGNING_KEY!)
  }
  
  /**
   * Génère une URL signée avec vérification d'accès
   */
  async generateSignedUrl(
    userId: string,
    projectId: string,
    path: string,
    operation: 'read' | 'write',
    expiresInSeconds = 900 // 15 minutes default
  ): Promise<string> {
    // 1. Vérifier que l'utilisateur a accès au projet
    const hasAccess = await this.validateAccess(userId, projectId, operation)
    if (!hasAccess) {
      throw new UnauthorizedError(`User ${userId} cannot ${operation} project ${projectId}`)
    }
    
    // 2. Générer le token signé
    const token = await new SignJWT({
      userId,
      projectId,
      path,
      operation,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`)
      .sign(this.signingKey)
    
    // 3. Construire l'URL
    const storageKey = this.buildStorageKey(userId, projectId, path)
    
    if (operation === 'read') {
      // URL pré-signée R2 pour lecture directe
      return this.storage.getPresignedUrl(storageKey, expiresInSeconds)
    } else {
      // URL d'upload via notre API (pour validation)
      return `${process.env.API_URL}/api/files/upload?token=${token}`
    }
  }
  
  /**
   * Vérifie l'accès d'un utilisateur à un projet
   */
  async validateAccess(
    userId: string,
    projectId: string,
    operation: 'read' | 'write'
  ): Promise<boolean> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          // Propriétaire
          { userId },
          // Membre avec le bon rôle
          {
            members: {
              some: {
                userId,
                role: operation === 'write' 
                  ? { in: ['OWNER', 'EDITOR'] }
                  : { in: ['OWNER', 'EDITOR', 'VIEWER'] }
              }
            }
          }
        ]
      }
    })
    
    return !!project
  }
  
  /**
   * Construit la clé de stockage avec isolation par tenant
   */
  private buildStorageKey(userId: string, projectId: string, path: string): string {
    // Format: tenant_{userId}/projects/{projectId}/files/{path}
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    return `tenant_${userId}/projects/${projectId}/files/${normalizedPath}`
  }
}
```

### 3.5 Architecture de Sandboxing pour Preview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SANDBOXING ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Browser                                                                │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      AppForge Frontend                               │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                    Preview Component                         │    │    │
│  │  │                                                               │    │    │
│  │  │   ┌─────────────────────────────────────────────────────┐    │    │    │
│  │  │   │              Sandbox Strategy Router                 │    │    │    │
│  │  │   │                                                       │    │    │    │
│  │  │   │  if (projectType === WEB && smallProject) {          │    │    │    │
│  │  │   │    return <WebContainerPreview />  // Browser-side   │    │    │    │
│  │  │   │  }                                                    │    │    │    │
│  │  │   │                                                       │    │    │    │
│  │  │   │  if (projectType === API || needsBackend) {          │    │    │    │
│  │  │   │    return <FlyMachinePreview />    // Remote VM      │    │    │    │
│  │  │   │  }                                                    │    │    │    │
│  │  │   │                                                       │    │    │    │
│  │  │   │  if (projectType === MOBILE) {                       │    │    │    │
│  │  │   │    return <ExpoGoPreview />        // Expo Snack     │    │    │    │
│  │  │   │  }                                                    │    │    │    │
│  │  │   └─────────────────────────────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                           │                 │                 │              │
│         ┌─────────────────┼─────────────────┼─────────────────┘              │
│         ▼                 ▼                 ▼                                │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                        │
│  │ WebContainer│   │ Fly Machine │   │  Expo Go    │                        │
│  │ (Browser)   │   │  (microVM)  │   │  (Mobile)   │                        │
│  │             │   │             │   │             │                        │
│  │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │                        │
│  │ │ Node.js │ │   │ │ Docker  │ │   │ │RN Metro │ │                        │
│  │ │ in WASM │ │   │ │Container│ │   │ │ Server  │ │                        │
│  │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │                        │
│  │             │   │             │   │             │                        │
│  │ Isolation:  │   │ Isolation:  │   │ Isolation:  │                        │
│  │ Browser     │   │ Kernel +    │   │ Expo Cloud  │                        │
│  │ Sandbox     │   │ Network     │   │ Sandbox     │                        │
│  └─────────────┘   └─────────────┘   └─────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Configuration Réseau pour Fly Machines

```typescript
// lib/sandbox/fly-machine.ts

interface FlyMachineConfig {
  projectId: string
  userId: string
  projectType: ProjectType
}

export class FlyMachineSandbox {
  private readonly flyApiToken: string
  private readonly appName: string = 'appforge-previews'
  
  /**
   * Crée ou réutilise une machine pour un projet
   */
  async getOrCreateMachine(config: FlyMachineConfig): Promise<MachineInstance> {
    const machineId = `preview-${config.projectId}`
    
    // Check if machine exists and is healthy
    const existing = await this.getMachine(machineId)
    if (existing?.state === 'started') {
      return existing
    }
    
    // Create new machine with isolated network
    const machine = await this.createMachine({
      name: machineId,
      config: {
        image: this.getImageForProjectType(config.projectType),
        guest: {
          cpu_kind: 'shared',
          cpus: 1,
          memory_mb: 256,  // Petit pour FREE, scalable pour PRO
        },
        services: [{
          internal_port: 3000,
          protocol: 'tcp',
          ports: [{ port: 443, handlers: ['tls', 'http'] }],
        }],
        env: {
          PROJECT_ID: config.projectId,
          USER_ID: config.userId,
          NODE_ENV: 'preview',
        },
        // 🔒 Security: Network isolation
        dns: {
          skip_registration: true,  // No public DNS
        },
        // Auto-stop après inactivité
        auto_destroy: true,
        restart: { policy: 'on-failure', max_retries: 2 },
      },
    })
    
    return machine
  }
  
  /**
   * Injecte les fichiers du projet dans la machine
   */
  async syncFiles(machineId: string, projectId: string): Promise<void> {
    // Récupère les fichiers depuis notre storage
    const files = await fileService.listFiles(projectId)
    
    // Upload via Fly API (ou rsync over WireGuard)
    for (const file of files) {
      await this.uploadFile(machineId, file.path, file.content)
    }
    
    // Install dependencies
    await this.exec(machineId, 'npm install --production')
    
    // Start dev server
    await this.exec(machineId, 'npm run dev')
  }
  
  /**
   * Retourne l'URL de preview sécurisée
   */
  async getPreviewUrl(machineId: string, userId: string): Promise<string> {
    // URL avec token d'accès temporaire
    const token = await this.generateAccessToken(machineId, userId)
    return `https://${machineId}.fly.dev?token=${token}`
  }
  
  /**
   * Détruit la machine après timeout
   */
  async scheduleDestroy(machineId: string, delayMinutes: number = 30): Promise<void> {
    // Machine auto-stop après inactivité
    // Billing s'arrête quand la machine est stopped
  }
}
```

---

## 4. Support Multi-Type d'Apps

### 4.1 Types d'Apps à Supporter

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TYPES D'APPLICATIONS SUPPORTÉS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CATÉGORIE WEB                                                               │
│  ═══════════                                                                │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐              │
│  │   NEXTJS     │    REACT     │     VUE      │   SVELTE     │              │
│  │              │    (Vite)    │    (Vite)    │  (SvelteKit) │              │
│  │  Full-stack  │     SPA      │     SPA      │  Full-stack  │              │
│  │   SSR/SSG    │  Client-only │  Client-only │   SSR/SSG    │              │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤              │
│  │  Preview:    │  Preview:    │  Preview:    │  Preview:    │              │
│  │WebContainer  │WebContainer  │WebContainer  │WebContainer  │              │
│  │  or Vercel   │              │              │              │              │
│  └──────────────┴──────────────┴──────────────┴──────────────┘              │
│                                                                              │
│  CATÉGORIE BACKEND                                                          │
│  ════════════════                                                           │
│  ┌──────────────┬──────────────┬──────────────┐                             │
│  │   EXPRESS    │    HONO      │   FASTIFY    │                             │
│  │   Node.js    │   Edge/Node  │   Node.js    │                             │
│  │    REST      │    REST      │    REST      │                             │
│  ├──────────────┼──────────────┼──────────────┤                             │
│  │  Preview:    │  Preview:    │  Preview:    │                             │
│  │ Fly Machine  │   Workers    │ Fly Machine  │                             │
│  └──────────────┴──────────────┴──────────────┘                             │
│                                                                              │
│  CATÉGORIE MOBILE (Phase 2)                                                 │
│  ═════════════════════════                                                  │
│  ┌──────────────┬──────────────┬──────────────┐                             │
│  │  REACT       │    SWIFT     │   KOTLIN     │                             │
│  │  NATIVE      │   (iOS)      │  (Android)   │                             │
│  │  (Expo)      │   Native     │   Native     │                             │
│  ├──────────────┼──────────────┼──────────────┤                             │
│  │  Preview:    │  Preview:    │  Preview:    │                             │
│  │  Expo Go     │  Simulator   │  Emulator    │                             │
│  │  (device)    │  (cloud)     │  (cloud)     │                             │
│  └──────────────┴──────────────┴──────────────┘                             │
│                                                                              │
│  CATÉGORIE DESKTOP (Phase 3)                                                │
│  ══════════════════════════                                                 │
│  ┌──────────────┬──────────────┐                                            │
│  │   ELECTRON   │    TAURI     │                                            │
│  │  Cross-plat  │  Rust-based  │                                            │
│  ├──────────────┼──────────────┤                                            │
│  │  Preview:    │  Preview:    │                                            │
│  │  Web only    │  Web only    │                                            │
│  │  (limited)   │  (limited)   │                                            │
│  └──────────────┴──────────────┘                                            │
│                                                                              │
│  CATÉGORIE PYTHON (Phase 2)                                                 │
│  ═════════════════════════                                                  │
│  ┌──────────────┬──────────────┬──────────────┐                             │
│  │    FLASK     │   FASTAPI    │   DJANGO     │                             │
│  │   Simple     │  Async API   │  Full-stack  │                             │
│  ├──────────────┼──────────────┼──────────────┤                             │
│  │  Preview:    │  Preview:    │  Preview:    │                             │
│  │ Fly Machine  │ Fly Machine  │ Fly Machine  │                             │
│  │  (Python)    │  (Python)    │  (Python)    │                             │
│  └──────────────┴──────────────┴──────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Nouveau Schema pour Multi-Type

```prisma
// Mise à jour du schema Prisma

enum ProjectType {
  // Web Frameworks
  NEXTJS
  REACT
  VUE
  SVELTE
  STATIC
  
  // Backend
  EXPRESS
  HONO
  FASTAPI
  FLASK
  DJANGO
  
  // Mobile
  REACT_NATIVE
  SWIFT_IOS
  KOTLIN_ANDROID
  FLUTTER
  
  // Desktop
  ELECTRON
  TAURI
}

enum ProjectLanguage {
  TYPESCRIPT
  JAVASCRIPT
  PYTHON
  SWIFT
  KOTLIN
  DART
  RUST
}

model Project {
  id              String          @id @default(cuid())
  name            String
  slug            String          @unique
  description     String?
  
  // Type & Language
  type            ProjectType     @default(NEXTJS)
  language        ProjectLanguage @default(TYPESCRIPT)
  
  // 🆕 Framework metadata
  frameworkVersion String?        // "14.2.0" pour Next.js
  runtimeVersion   String?        // "node20" ou "python3.12"
  
  // 🆕 Specific configs stored as JSON
  platformConfig   Json?          // iOS bundleId, Android package, etc
  buildConfig      Json?          // Build commands, env vars
  
  // ... reste inchangé
}

// 🆕 Métadonnées spécifiques par plateforme
model ProjectPlatformConfig {
  id              String    @id @default(cuid())
  projectId       String    @unique
  project         Project   @relation(fields: [projectId], references: [id])
  
  // iOS specific
  iosBundleId     String?   // com.myapp.app
  iosTeamId       String?   // Apple Team ID
  iosVersion      String?   // Minimum iOS version
  
  // Android specific
  androidPackage  String?   // com.myapp.app
  androidMinSdk   Int?      // 21
  androidTargetSdk Int?     // 34
  
  // Python specific
  pythonVersion   String?   // "3.12"
  requirements    String?   // requirements.txt content (or path)
  
  // Build specific
  buildCommand    String?   // "npm run build"
  startCommand    String?   // "npm start"
  outputDir       String?   // "dist" or ".next"
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### 4.3 Structure de Fichiers par Type

```typescript
// lib/templates/project-templates.ts

export const PROJECT_TEMPLATES: Record<ProjectType, ProjectTemplate> = {
  NEXTJS: {
    name: 'Next.js App',
    language: 'TYPESCRIPT',
    runtime: 'node20',
    defaultFiles: {
      '/package.json': {
        name: 'my-app',
        version: '0.1.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
        },
        dependencies: {
          next: '^14.2.0',
          react: '^18.3.0',
          'react-dom': '^18.3.0',
        },
      },
      '/tsconfig.json': { /* ... */ },
      '/next.config.js': 'module.exports = {}',
      '/src/app/page.tsx': `export default function Home() {
  return <h1>Hello World</h1>
}`,
      '/src/app/layout.tsx': `export default function Layout({ children }) {
  return <html><body>{children}</body></html>
}`,
    },
    previewCommand: 'npm run dev',
    buildCommand: 'npm run build',
    sandboxType: 'webcontainer',
  },
  
  REACT_NATIVE: {
    name: 'React Native (Expo)',
    language: 'TYPESCRIPT',
    runtime: 'node20',
    defaultFiles: {
      '/package.json': {
        name: 'my-mobile-app',
        version: '1.0.0',
        main: 'expo-router/entry',
        scripts: {
          start: 'expo start',
          android: 'expo start --android',
          ios: 'expo start --ios',
        },
        dependencies: {
          expo: '~51.0.0',
          'expo-router': '~3.5.0',
          'react-native': '0.74.0',
        },
      },
      '/app.json': {
        expo: {
          name: 'my-mobile-app',
          slug: 'my-mobile-app',
          version: '1.0.0',
          platforms: ['ios', 'android'],
        },
      },
      '/app/index.tsx': `export default function Home() {
  return <Text>Hello Mobile!</Text>
}`,
    },
    previewCommand: 'expo start --tunnel',
    buildCommand: 'eas build',
    sandboxType: 'expo',
  },
  
  FASTAPI: {
    name: 'FastAPI',
    language: 'PYTHON',
    runtime: 'python3.12',
    defaultFiles: {
      '/requirements.txt': `fastapi==0.110.0
uvicorn==0.28.0
pydantic==2.6.0`,
      '/main.py': `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}
`,
      '/.python-version': '3.12',
    },
    previewCommand: 'uvicorn main:app --reload',
    buildCommand: 'pip install -r requirements.txt',
    sandboxType: 'fly-machine',
    sandboxImage: 'python:3.12-slim',
  },
  
  SWIFT_IOS: {
    name: 'iOS (Swift)',
    language: 'SWIFT',
    runtime: 'swift5.10',
    defaultFiles: {
      '/Package.swift': `// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "MyApp",
    platforms: [.iOS(.v17)],
    targets: [
        .executableTarget(name: "MyApp"),
    ]
)`,
      '/Sources/MyApp/ContentView.swift': `import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("Hello, World!")
    }
}`,
      '/Sources/MyApp/MyApp.swift': `import SwiftUI

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`,
    },
    previewCommand: null, // Needs simulator
    buildCommand: 'swift build',
    sandboxType: 'cloud-simulator',
    requiresPlan: 'TEAM', // iOS requires higher tier
  },
  
  // ... autres templates
}
```

### 4.4 Métadonnées par Type d'App

```typescript
// lib/files/metadata.ts

export interface ProjectMetadata {
  // Common
  name: string
  version: string
  description?: string
  
  // Dependencies (format dépend du type)
  dependencies: Record<string, string>
  devDependencies?: Record<string, string>
  
  // Build info
  build: {
    command: string
    outputDir: string
    env?: Record<string, string>
  }
  
  // Runtime
  runtime: {
    type: 'node' | 'python' | 'swift' | 'kotlin' | 'dart'
    version: string
  }
  
  // Platform-specific
  ios?: {
    bundleId: string
    teamId?: string
    minimumVersion: string
    capabilities: string[]
  }
  
  android?: {
    packageName: string
    minSdkVersion: number
    targetSdkVersion: number
    permissions: string[]
  }
  
  // AI Generation Context
  aiContext?: {
    primaryComponents: string[] // Principaux fichiers à modifier
    entryPoint: string          // Où ajouter le nouveau code
    styleSystem: string         // tailwind, css-modules, styled-components
  }
}

/**
 * Extract metadata from project files
 */
export async function extractProjectMetadata(
  projectId: string
): Promise<ProjectMetadata> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { files: true, platformConfig: true },
  })
  
  if (!project) throw new Error('Project not found')
  
  switch (project.type) {
    case 'NEXTJS':
    case 'REACT':
    case 'VUE':
      return extractNodeMetadata(project)
    case 'FASTAPI':
    case 'FLASK':
    case 'DJANGO':
      return extractPythonMetadata(project)
    case 'SWIFT_IOS':
      return extractSwiftMetadata(project)
    case 'KOTLIN_ANDROID':
      return extractKotlinMetadata(project)
    default:
      return extractGenericMetadata(project)
  }
}

function extractNodeMetadata(project: Project): ProjectMetadata {
  // Parse package.json
  const packageJson = project.files.find(f => f.path === '/package.json')
  const parsed = JSON.parse(packageJson?.content || '{}')
  
  return {
    name: parsed.name || project.name,
    version: parsed.version || '0.1.0',
    dependencies: parsed.dependencies || {},
    devDependencies: parsed.devDependencies || {},
    build: {
      command: parsed.scripts?.build || 'npm run build',
      outputDir: project.type === 'NEXTJS' ? '.next' : 'dist',
    },
    runtime: {
      type: 'node',
      version: project.runtimeVersion || '20',
    },
    aiContext: {
      primaryComponents: ['/src/app/page.tsx', '/src/components'],
      entryPoint: '/src/app/page.tsx',
      styleSystem: detectStyleSystem(project),
    },
  }
}
```

---

## 5. Architecture Cible

### 5.1 Vue Globale

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           APPFORGE - ARCHITECTURE CIBLE                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                               ┌─────────────────────┐                               │
│                               │    CDN / Edge       │                               │
│                               │   (Cloudflare)      │                               │
│                               └──────────┬──────────┘                               │
│                                          │                                          │
│                               ┌──────────▼──────────┐                               │
│                               │    Next.js App      │                               │
│                               │     (Vercel)        │                               │
│                               │  ┌───────────────┐  │                               │
│                               │  │ API Routes    │  │                               │
│                               │  │ /api/...      │  │                               │
│                               │  └───────┬───────┘  │                               │
│                               └──────────┼──────────┘                               │
│                                          │                                          │
│        ┌─────────────────────────────────┼─────────────────────────────────┐        │
│        │                                 │                                  │        │
│        ▼                                 ▼                                  ▼        │
│  ┌─────────────────┐         ┌─────────────────────┐          ┌─────────────────┐  │
│  │    Supabase     │         │    Cloudflare R2    │          │    AI Services  │  │
│  │   PostgreSQL    │         │   File Storage      │          │                 │  │
│  │                 │         │                     │          │  ┌───────────┐  │  │
│  │ ┌─────────────┐ │         │ tenant_xxx/         │          │  │ Anthropic │  │  │
│  │ │    RLS      │ │         │ └── projects/       │          │  │  Claude   │  │  │
│  │ │  Policies   │ │         │     └── files/      │          │  └───────────┘  │  │
│  │ └─────────────┘ │         │                     │          │  ┌───────────┐  │  │
│  │                 │         │ Signed URLs         │          │  │  OpenAI   │  │  │
│  │ Tables:        │         │ (15min TTL)         │          │  │   GPT-4   │  │  │
│  │ - User         │         └─────────────────────┘          │  └───────────┘  │  │
│  │ - Project      │                                           └─────────────────┘  │
│  │ - File         │                                                                 │
│  │ - FileVersion  │                                                                 │
│  │ - CreditUsage  │                                                                 │
│  └─────────────────┘                                                                │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                           PREVIEW / SANDBOX LAYER                             │  │
│  │                                                                                │  │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐            │  │
│  │   │  WebContainer   │   │   Fly Machines  │   │    Expo Go      │            │  │
│  │   │   (Browser)     │   │    (microVMs)   │   │   (Mobile)      │            │  │
│  │   │                 │   │                 │   │                 │            │  │
│  │   │ Web Apps:       │   │ Backend Apps:   │   │ Mobile Apps:    │            │  │
│  │   │ - Next.js       │   │ - Express       │   │ - React Native  │            │  │
│  │   │ - React         │   │ - FastAPI       │   │ - Expo          │            │  │
│  │   │ - Vue           │   │ - Flask         │   │                 │            │  │
│  │   │ - Svelte        │   │ - Django        │   │ QR Code →       │            │  │
│  │   │                 │   │                 │   │ Phone Preview   │            │  │
│  │   │ Isolation:      │   │ Isolation:      │   │                 │            │  │
│  │   │ Browser Sandbox │   │ Firecracker VM  │   │ Isolation:      │            │  │
│  │   └─────────────────┘   └─────────────────┘   │ Expo Cloud      │            │  │
│  │                                                └─────────────────┘            │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                              DEPLOY LAYER                                     │  │
│  │                                                                                │  │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐            │  │
│  │   │     Vercel      │   │   Fly.io        │   │    EAS Build    │            │  │
│  │   │   (Web Apps)    │   │  (Backends)     │   │   (Mobile)      │            │  │
│  │   │                 │   │                 │   │                 │            │  │
│  │   │ {slug}.appforge │   │ api-{slug}.fly  │   │ TestFlight /    │            │  │
│  │   │     .app        │   │     .dev        │   │ Play Console    │            │  │
│  │   └─────────────────┘   └─────────────────┘   └─────────────────┘            │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Flux de Données Sécurisé

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        FLUX SÉCURISÉ: LECTURE DE FICHIER                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  1. Client Request                                                                   │
│     GET /api/projects/{projectId}/files/{path}                                      │
│     Headers: Authorization: Bearer {jwt}                                            │
│                     │                                                                │
│                     ▼                                                                │
│  2. ┌─────────────────────────────────────────────────────────────────┐             │
│     │                    API Middleware                               │             │
│     │  ├── Verify JWT (Clerk)                                         │             │
│     │  ├── Extract userId from token                                  │             │
│     │  ├── Rate limit check (by userId)                               │             │
│     │  └── Set Postgres session: SET app.current_user_id = {userId}   │             │
│     └──────────────────────────────┬──────────────────────────────────┘             │
│                                    │                                                 │
│                                    ▼                                                 │
│  3. ┌─────────────────────────────────────────────────────────────────┐             │
│     │                    PostgreSQL with RLS                          │             │
│     │                                                                  │             │
│     │  SELECT * FROM "File"                                           │             │
│     │  WHERE "projectId" = {projectId} AND "path" = {path}           │             │
│     │                                                                  │             │
│     │  RLS Policy Auto-Applied:                                       │             │
│     │  WHERE EXISTS (                                                  │             │
│     │    SELECT 1 FROM "Project"                                      │             │
│     │    WHERE id = "File"."projectId"                                │             │
│     │    AND (userId = app.current_user_id OR ...)                   │             │
│     │  )                                                               │             │
│     └──────────────────────────────┬──────────────────────────────────┘             │
│                                    │                                                 │
│                    ┌───────────────┴───────────────┐                                │
│                    │                               │                                 │
│                    ▼                               ▼                                 │
│  4a. File.content != null              4b. File.storageKey != null                  │
│      (Inline < 100KB)                      (R2 > 100KB)                             │
│                    │                               │                                 │
│                    │                               ▼                                 │
│                    │              ┌─────────────────────────────────┐               │
│                    │              │       R2 Storage                 │               │
│                    │              │                                  │               │
│                    │              │  Generate Signed URL             │               │
│                    │              │  (15min TTL, read-only)          │               │
│                    │              │                                  │               │
│                    │              │  Key: tenant_{userId}/projects/  │               │
│                    │              │       {projectId}/files/{path}   │               │
│                    │              └────────────────┬────────────────┘               │
│                    │                               │                                 │
│                    └───────────────┬───────────────┘                                │
│                                    │                                                 │
│                                    ▼                                                 │
│  5. ┌─────────────────────────────────────────────────────────────────┐             │
│     │                        Response                                 │             │
│     │  {                                                              │             │
│     │    "path": "/src/app/page.tsx",                                │             │
│     │    "content": "..." (or null if large),                        │             │
│     │    "signedUrl": "https://r2.../..." (if large),                │             │
│     │    "sizeBytes": 1234,                                          │             │
│     │    "mimeType": "text/typescript"                               │             │
│     │  }                                                              │             │
│     └─────────────────────────────────────────────────────────────────┘             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Risques & Mitigations

### 6.1 Matrice des Risques

| # | Risque | Probabilité | Impact | Score | Mitigation |
|---|--------|-------------|--------|-------|------------|
| 1 | **Path Traversal Attack** | Moyenne | 🔴 Critique | 8 | Validation stricte des paths, normalization, chroot virtuel |
| 2 | **Bucket Credentials Leak** | Faible | 🔴 Critique | 6 | Rotation régulière, signed URLs, pas d'accès direct client |
| 3 | **Code Injection via AI** | Moyenne | 🔴 Critique | 8 | Sandbox exécution, analyse statique, CSP strict |
| 4 | **DoS via Preview** | Haute | 🟡 Moyen | 6 | Timeouts, CPU limits, auto-stop, rate limiting |
| 5 | **Data Leak entre Users** | Faible | 🔴 Critique | 7 | RLS PostgreSQL, tenant isolation, audit logs |
| 6 | **Quota Bypass** | Moyenne | 🟡 Moyen | 5 | Server-side enforcement, atomic transactions |
| 7 | **Malicious File Upload** | Moyenne | 🔴 Critique | 7 | Mime-type validation, AV scan (ClamAV), size limits |
| 8 | **Dependency Confusion** | Faible | 🟡 Moyen | 4 | Lock files, registry scoping |

### 6.2 Mitigations Détaillées

#### Risque #1: Path Traversal

```typescript
// lib/files/security.ts

const FORBIDDEN_PATTERNS = [
  /\.\./,           // Parent directory
  /^\/etc\//,       // System files
  /^\/proc\//,
  /^\/sys\//,
  /\/node_modules\//, // Dependencies
  /\/\.git\//,      // Git internals
  /\.env/,          // Environment files
]

const ALLOWED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm', '.svg',
  '.json', '.yaml', '.yml', '.toml',
  '.md', '.mdx', '.txt',
  '.py', '.pyi',
  '.swift', '.kt', '.kts',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
])

export function validateFilePath(path: string): { valid: boolean; error?: string } {
  // Normalize path
  const normalized = normalizePath(path)
  
  // Check forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) {
      return { valid: false, error: `Forbidden path pattern: ${pattern}` }
    }
  }
  
  // Check extension
  const ext = getExtension(normalized)
  if (ext && !ALLOWED_EXTENSIONS.has(ext.toLowerCase())) {
    return { valid: false, error: `Forbidden extension: ${ext}` }
  }
  
  // Check depth (prevent deeply nested attacks)
  const depth = normalized.split('/').length
  if (depth > 20) {
    return { valid: false, error: 'Path too deep' }
  }
  
  return { valid: true }
}
```

#### Risque #3: Code Injection

```typescript
// lib/sandbox/security.ts

/**
 * Content Security Policy for preview iframes
 */
export const PREVIEW_CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'"], // Nécessaire pour bundlers
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'connect-src': ["'self'", 'https://api.appforge.app'],
  'frame-ancestors': ["'self'", 'https://appforge.app'],
  'form-action': ["'none'"],
  'base-uri': ["'self'"],
}

/**
 * Sanitize AI-generated code before execution
 */
export async function sanitizeGeneratedCode(code: string): Promise<string> {
  // Remove potential XSS
  code = code.replace(/<script[^>]*>.*?<\/script>/gis, '')
  
  // Remove eval() calls
  code = code.replace(/\beval\s*\(/g, '/* eval blocked */ (')
  
  // Remove dangerous Node.js APIs
  const dangerousAPIs = [
    'child_process',
    'fs.unlink',
    'fs.rmdir',
    'fs.rm',
    'process.exit',
    'process.kill',
  ]
  
  for (const api of dangerousAPIs) {
    code = code.replace(new RegExp(`\\b${api}\\b`, 'g'), `/* ${api} blocked */`)
  }
  
  return code
}
```

#### Risque #7: Malicious File Upload

```typescript
// lib/files/validation.ts

import { createHash } from 'crypto'

const MAGIC_BYTES = {
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
}

export async function validateFileContent(
  content: Buffer,
  declaredMimeType: string
): Promise<{ valid: boolean; detectedType: string; error?: string }> {
  // Check magic bytes for binary files
  if (MAGIC_BYTES[declaredMimeType]) {
    const expected = MAGIC_BYTES[declaredMimeType]
    const actual = Array.from(content.slice(0, expected.length))
    
    if (!expected.every((byte, i) => byte === actual[i])) {
      return {
        valid: false,
        detectedType: 'unknown',
        error: 'File content does not match declared type',
      }
    }
  }
  
  // Check for embedded scripts in images (polyglot attacks)
  const contentStr = content.toString('utf-8', 0, Math.min(content.length, 1000))
  if (contentStr.includes('<script') || contentStr.includes('javascript:')) {
    return {
      valid: false,
      detectedType: 'suspicious',
      error: 'File contains potential script injection',
    }
  }
  
  return { valid: true, detectedType: declaredMimeType }
}
```

---

## 7. Estimation de Complexité

### 7.1 Roadmap par Phase

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ROADMAP IMPLÉMENTATION                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  PHASE 1: FONDATIONS (2-3 semaines)                                                 │
│  ════════════════════════════════════                                               │
│                                                                                      │
│  ☐ 1.1 Mise en place RLS PostgreSQL                           │ 3 jours │ Medium  │
│        ├── Écrire les policies SQL                                                  │
│        ├── Tester les edge cases                                                    │
│        └── Migration Prisma                                                         │
│                                                                                      │
│  ☐ 1.2 Isolation Storage R2                                    │ 2 jours │ Easy    │
│        ├── Restructurer les clés (tenant prefix)                                    │
│        ├── Migration des fichiers existants                                         │
│        └── Signed URLs implementation                                               │
│                                                                                      │
│  ☐ 1.3 Nouvelles limites de plan                               │ 2 jours │ Easy    │
│        ├── Ajouter PLAN_QUOTAS_V2                                                   │
│        ├── Implémenter les nouveaux checks                                          │
│        └── UI warnings                                                              │
│                                                                                      │
│  ☐ 1.4 Validation sécurité fichiers                            │ 3 jours │ Medium  │
│        ├── Path validation                                                          │
│        ├── Content validation                                                       │
│        └── Extension whitelist                                                      │
│                                                                                      │
│  ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                      │
│  PHASE 2: MULTI-TYPE (3-4 semaines)                                                 │
│  ════════════════════════════════════                                               │
│                                                                                      │
│  ☐ 2.1 Schema multi-type                                       │ 2 jours │ Easy    │
│        ├── Nouveaux enums ProjectType                                               │
│        ├── ProjectPlatformConfig table                                              │
│        └── Migration                                                                │
│                                                                                      │
│  ☐ 2.2 Templates par type                                      │ 4 jours │ Medium  │
│        ├── Web templates (Next, React, Vue, Svelte)                                │
│        ├── Backend templates (Express, FastAPI)                                    │
│        └── Mobile placeholder                                                       │
│                                                                                      │
│  ☐ 2.3 Metadata extraction                                     │ 3 jours │ Medium  │
│        ├── Parser package.json, requirements.txt, etc                               │
│        └── AI context generation                                                    │
│                                                                                      │
│  ☐ 2.4 UI App Type Selector                                    │ 3 jours │ Easy    │
│        ├── Refaire le sélecteur de type                                            │
│        └── Preview par type                                                         │
│                                                                                      │
│  ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                      │
│  PHASE 3: SANDBOX AVANCÉ (4-6 semaines)                                             │
│  ════════════════════════════════════════                                           │
│                                                                                      │
│  ☐ 3.1 Fly Machines integration                                │ 5 jours │ Hard    │
│        ├── API wrapper                                                              │
│        ├── Machine lifecycle management                                             │
│        └── File sync mechanism                                                      │
│                                                                                      │
│  ☐ 3.2 Preview router                                          │ 3 jours │ Medium  │
│        ├── WebContainer vs Fly Machine routing                                      │
│        └── Unified preview API                                                      │
│                                                                                      │
│  ☐ 3.3 Expo integration (mobile)                               │ 5 jours │ Hard    │
│        ├── Expo Snack API                                                           │
│        ├── QR code generation                                                       │
│        └── Live reload                                                              │
│                                                                                      │
│  ☐ 3.4 Usage tracking & auto-stop                              │ 3 jours │ Medium  │
│        ├── Preview minutes tracking                                                 │
│        └── Auto-stop inactive machines                                              │
│                                                                                      │
│  ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                      │
│  PHASE 4: MOBILE & NATIVE (6-8 semaines) - FUTURE                                   │
│  ═══════════════════════════════════════════════                                    │
│                                                                                      │
│  ☐ 4.1 React Native full support                               │ 2 sem   │ Hard    │
│  ☐ 4.2 iOS/Swift code generation                               │ 3 sem   │ Expert  │
│  ☐ 4.3 Android/Kotlin code generation                          │ 3 sem   │ Expert  │
│  ☐ 4.4 Cloud simulators (Appetize.io)                          │ 1 sem   │ Medium  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Estimation Effort

| Phase | Durée | Complexité | Ressources | Priorité |
|-------|-------|------------|------------|----------|
| **Phase 1: Fondations** | 2-3 semaines | 🟡 Medium | 1 senior dev | 🔴 P0 - Critical |
| **Phase 2: Multi-Type** | 3-4 semaines | 🟡 Medium | 1 dev + 1 UI | 🟡 P1 - High |
| **Phase 3: Sandbox** | 4-6 semaines | 🔴 Hard | 2 devs | 🟡 P1 - High |
| **Phase 4: Mobile** | 6-8 semaines | 🔴 Expert | 2 devs + mobile exp | 🟢 P2 - Future |

### 7.3 Quick Wins (< 1 semaine)

| Quick Win | Impact | Effort | ROI |
|-----------|--------|--------|-----|
| RLS Policies basiques | 🔴 High | 2 jours | ⭐⭐⭐⭐⭐ |
| Tenant prefix R2 | 🔴 High | 1 jour | ⭐⭐⭐⭐⭐ |
| Path validation | 🔴 High | 1 jour | ⭐⭐⭐⭐⭐ |
| Nouvelles limites PLAN_QUOTAS_V2 | 🟡 Medium | 2 jours | ⭐⭐⭐⭐ |
| CSP pour previews | 🟡 Medium | 0.5 jour | ⭐⭐⭐⭐ |

---

## 📝 Conclusion & Recommandations

### Actions Immédiates (Sprint 1)

1. **🔒 SÉCURITÉ CRITIQUE**
   - Implémenter RLS PostgreSQL
   - Ajouter tenant prefix au storage R2
   - Valider tous les paths de fichiers

2. **📊 LIMITES**
   - Activer les nouvelles limites de plan
   - Ajouter le tracking d'utilisation

### Actions Court Terme (Sprint 2-3)

3. **🎯 MULTI-TYPE**
   - Étendre le schema pour supporter plus de types
   - Créer les templates par framework

4. **🏃 SANDBOX**
   - Intégrer Fly Machines pour backends
   - Router les previews intelligemment

### Actions Moyen Terme (Q2)

5. **📱 MOBILE**
   - Support React Native via Expo
   - Évaluer iOS/Android natif pour TEAM/ENTERPRISE

---

**Document préparé par:** Expert Architecture & Sécurité  
**Prochaine révision:** Après Phase 1
