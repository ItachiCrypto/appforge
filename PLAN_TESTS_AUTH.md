# 🧪 PLAN D'ACTION: Tests Automatisés avec Authentification Clerk

**Date:** 2026-02-07  
**Auteur:** Chef de Projet AppForge  
**Priorité:** CRITIQUE  

---

## 📋 Contexte du Problème

Les tests automatisés Playwright ne peuvent pas accéder à `/app/new` et autres routes protégées car :
1. Le middleware Clerk bloque toutes les routes non-publiques
2. Les tests n'ont pas de session authentifiée
3. Le flow BMAD ("Ma propre idée") est donc impossible à tester

### Routes Publiques Actuelles (middleware.ts)
```typescript
publicRoutes: [
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/debug',
]
```

---

## 🎯 Solutions Proposées (3 options)

| Option | Complexité | Réalisme | Recommandation |
|--------|------------|----------|----------------|
| A) Route `/app/demo` publique | ⭐ Facile | ⭐⭐ Moyen | ✅ Rapide pour tester UI |
| B) E2E Bypass Auth Mode | ⭐⭐ Moyen | ⭐ Faible | ⚠️ Risque sécurité |
| C) Authentication Playwright | ⭐⭐⭐ Complexe | ⭐⭐⭐ Excellent | 🏆 Recommandé long terme |

---

## 📁 SOLUTION A: Route `/app/demo` (Quick Fix)

### Description
Créer une page démo publique qui simule le wizard sans authentification.

### Fichiers à créer/modifier

#### 1. Créer `src/app/(marketing)/demo/page.tsx`

```tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Lightbulb, FileText, Target, Code, ListTodo, Rocket, Wand2, Check, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// BMAD phases
type BmadPhase = 'idea' | 'brief' | 'prd' | 'architecture' | 'epics' | 'customize' | 'complete'

// Simple stepper component
function BmadStepper({ currentPhase }: { currentPhase: BmadPhase }) {
  const phases = [
    { id: 'idea', label: 'Idée', icon: Lightbulb, num: 1 },
    { id: 'brief', label: 'Brief', icon: FileText, num: 2 },
    { id: 'prd', label: 'PRD', icon: Target, num: 3 },
    { id: 'architecture', label: 'Archi', icon: Code, num: 4 },
    { id: 'epics', label: 'Stories', icon: ListTodo, num: 5 },
    { id: 'customize', label: 'Créer', icon: Rocket, num: 6 },
  ]

  const currentIndex = phases.findIndex(p => p.id === currentPhase)

  return (
    <div className="bg-background/60 backdrop-blur-xl border-b border-white/10 py-4" data-testid="bmad-stepper">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-center gap-1">
          {phases.map((phase, idx) => {
            const Icon = phase.icon
            const isActive = phase.id === currentPhase
            const isCompleted = idx < currentIndex

            return (
              <div key={phase.id} className="flex items-center" data-testid={`step-${phase.id}`}>
                <div className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300",
                  isActive && "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
                  isCompleted && "bg-emerald-500/20 text-emerald-400",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : (
                    <Icon className={cn("w-3.5 h-3.5", isActive && "animate-pulse")} />
                  )}
                  <span className="font-medium text-xs">{phase.label}</span>
                </div>
                {idx < phases.length - 1 && (
                  <div className={cn(
                    "w-4 sm:w-8 h-0.5 mx-0.5 rounded-full",
                    idx < currentIndex ? "bg-emerald-500" : "bg-white/10"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function DemoPage() {
  const [phase, setPhase] = useState<BmadPhase>('idea')
  const [idea, setIdea] = useState('')
  const [appName, setAppName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock documents (in real flow, these come from /api/bmad)
  const mockBrief = `# Product Brief: ${idea || 'Mon App'}

## Vision
Application moderne pour ${idea || 'votre idée'}.

## Objectifs
- Objectif 1: Simplicité d'utilisation
- Objectif 2: Performance optimale
- Objectif 3: Design élégant`

  const mockPrd = `# PRD - ${idea || 'Mon App'}

## User Stories
- En tant qu'utilisateur, je peux...
- En tant qu'admin, je peux...

## Critères d'acceptation
- [ ] Critère 1
- [ ] Critère 2`

  const mockArch = `# Architecture Technique

## Stack
- Frontend: React + TailwindCSS
- State: Zustand
- Storage: localStorage`

  const mockEpics = `# Epics & Stories

## Epic 1: Setup
- Story 1.1: Initialisation projet
- Story 1.2: Configuration UI`

  const handleNextPhase = async () => {
    setIsGenerating(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsGenerating(false)

    const phaseOrder: BmadPhase[] = ['idea', 'brief', 'prd', 'architecture', 'epics', 'customize', 'complete']
    const currentIdx = phaseOrder.indexOf(phase)
    if (currentIdx < phaseOrder.length - 1) {
      setPhase(phaseOrder[currentIdx + 1])
    }
  }

  const handleGoBack = () => {
    const phaseOrder: BmadPhase[] = ['idea', 'brief', 'prd', 'architecture', 'epics', 'customize']
    const currentIdx = phaseOrder.indexOf(phase)
    if (currentIdx > 0) {
      setPhase(phaseOrder[currentIdx - 1])
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
      </div>

      {/* Demo Banner */}
      <div className="bg-amber-500/20 border-b border-amber-500/30 py-2 text-center">
        <span className="text-amber-300 text-sm font-medium">
          🔬 Mode Démo - Les données ne sont pas sauvegardées. <a href="/sign-up" className="underline">Créer un compte</a> pour utiliser AppForge.
        </span>
      </div>

      {/* Stepper */}
      <BmadStepper currentPhase={phase} />

      <div className="max-w-3xl mx-auto px-6 py-12">
        
        {/* Phase: Idea */}
        {phase === 'idea' && (
          <div className="space-y-8" data-testid="phase-idea">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full">
                <Wand2 className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-semibold text-pink-300">Ma propre idée</span>
              </div>
              <h1 className="text-4xl font-bold text-white">
                Décris ton <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">app de rêve</span>
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                L'IA va créer une documentation complète (Brief, PRD, Architecture, Stories)
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Ton idée d'application
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ex: une app de gestion de budget avec des graphiques..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                data-testid="idea-input"
              />
              <p className="text-xs text-muted-foreground">
                {idea.length} caractères • Minimum 10 caractères requis
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleNextPhase}
                disabled={idea.length < 10 || isGenerating}
                className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600"
                data-testid="generate-brief-btn"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Génération...</>
                ) : (
                  <><Wand2 className="w-5 h-5 mr-2" /> Générer le Brief</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Brief */}
        {phase === 'brief' && (
          <div className="space-y-6" data-testid="phase-brief">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Voici ton Product Brief ✨</h2>
              <p className="text-muted-foreground">Ce document définit la vision stratégique de ton app</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="prose prose-invert prose-sm max-w-none" data-testid="brief-document">
                {mockBrief.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('#') ? 'font-bold text-lg' : ''}>{line}</p>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack}>← Modifier l'idée</Button>
              <Button size="lg" onClick={handleNextPhase} disabled={isGenerating} data-testid="generate-prd-btn">
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : null}
                Générer le PRD →
              </Button>
            </div>
          </div>
        )}

        {/* Phase: PRD */}
        {phase === 'prd' && (
          <div className="space-y-6" data-testid="phase-prd">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Product Requirements Document 📋</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="prose prose-invert prose-sm max-w-none" data-testid="prd-document">
                {mockPrd.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack}>← Retour</Button>
              <Button size="lg" onClick={handleNextPhase} disabled={isGenerating} data-testid="generate-arch-btn">
                Générer l'Architecture →
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Architecture */}
        {phase === 'architecture' && (
          <div className="space-y-6" data-testid="phase-architecture">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Architecture Technique 🏗️</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="prose prose-invert prose-sm max-w-none" data-testid="arch-document">
                {mockArch.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack}>← Retour</Button>
              <Button size="lg" onClick={handleNextPhase} disabled={isGenerating} data-testid="generate-epics-btn">
                Générer les Stories →
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Epics */}
        {phase === 'epics' && (
          <div className="space-y-6" data-testid="phase-epics">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Epics & Stories 📋</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="prose prose-invert prose-sm max-w-none" data-testid="epics-document">
                {mockEpics.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack}>← Retour</Button>
              <Button size="lg" onClick={handleNextPhase} data-testid="customize-btn">
                Personnaliser & Créer →
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Customize */}
        {phase === 'customize' && (
          <div className="space-y-6" data-testid="phase-customize">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Dernière touche personnelle ✨</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70">Nom de ton app</label>
                <Input
                  placeholder="Mon App Géniale"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="app-name-input"
                />
              </div>
              
              {/* Demo info */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold text-white">Documentation BMAD complète</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-emerald-400">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Brief</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> PRD</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Architecture</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Stories</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack}>← Retour</Button>
              <Button 
                size="lg" 
                onClick={handleNextPhase}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="create-app-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Créer mon app
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Complete */}
        {phase === 'complete' && (
          <div className="space-y-6 text-center" data-testid="phase-complete">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">Flow BMAD Terminé ! 🎉</h2>
            <p className="text-muted-foreground">
              En mode réel, ton app serait maintenant en cours de génération.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setPhase('idea')} data-testid="restart-btn">
                Recommencer
              </Button>
              <Button asChild className="bg-gradient-to-r from-violet-500 to-purple-600">
                <a href="/sign-up">Créer un compte</a>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
```

#### 2. Modifier `src/middleware.ts` - Ajouter route publique

```typescript
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/pricing',
    '/demo',           // ← AJOUTER CETTE LIGNE
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/api/debug',
    '/api/health',     // ← Aussi utile pour monitoring
  ],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

#### 3. Créer `tests/demo-flow.spec.ts` - Tests du flow BMAD

```typescript
/**
 * Tests du flow BMAD via la page démo publique
 * Pas d'authentification requise
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Flow BMAD - Page Démo', () => {
  
  test('BMAD-1: La page démo charge sans erreur', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo`);
    await page.waitForLoadState('networkidle');
    
    // Vérifier le stepper
    const stepper = page.locator('[data-testid="bmad-stepper"]');
    await expect(stepper).toBeVisible();
    
    // Vérifier phase initiale
    const ideaPhase = page.locator('[data-testid="phase-idea"]');
    await expect(ideaPhase).toBeVisible();
  });

  test('BMAD-2: Flow complet "Ma propre idée"', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo`);
    await page.waitForLoadState('networkidle');
    
    // Phase 1: Entrer une idée
    const ideaInput = page.locator('[data-testid="idea-input"]');
    await ideaInput.fill('Une application de gestion de tâches avec timer pomodoro');
    
    const generateBriefBtn = page.locator('[data-testid="generate-brief-btn"]');
    await expect(generateBriefBtn).toBeEnabled();
    await generateBriefBtn.click();
    
    // Phase 2: Brief
    await page.waitForSelector('[data-testid="phase-brief"]', { timeout: 5000 });
    const briefDoc = page.locator('[data-testid="brief-document"]');
    await expect(briefDoc).toBeVisible();
    
    await page.locator('[data-testid="generate-prd-btn"]').click();
    
    // Phase 3: PRD
    await page.waitForSelector('[data-testid="phase-prd"]', { timeout: 5000 });
    await page.locator('[data-testid="generate-arch-btn"]').click();
    
    // Phase 4: Architecture
    await page.waitForSelector('[data-testid="phase-architecture"]', { timeout: 5000 });
    await page.locator('[data-testid="generate-epics-btn"]').click();
    
    // Phase 5: Epics
    await page.waitForSelector('[data-testid="phase-epics"]', { timeout: 5000 });
    await page.locator('[data-testid="customize-btn"]').click();
    
    // Phase 6: Customize
    await page.waitForSelector('[data-testid="phase-customize"]', { timeout: 5000 });
    const appNameInput = page.locator('[data-testid="app-name-input"]');
    await appNameInput.fill('Mon App Pomodoro');
    
    await page.locator('[data-testid="create-app-btn"]').click();
    
    // Phase finale: Complete
    await page.waitForSelector('[data-testid="phase-complete"]', { timeout: 5000 });
    await expect(page.getByText('Flow BMAD Terminé')).toBeVisible();
  });

  test('BMAD-3: Les indicateurs d\'étapes sont visibles', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo`);
    await page.waitForLoadState('networkidle');
    
    // Vérifier que le stepper affiche les 6 étapes
    for (const step of ['idea', 'brief', 'prd', 'architecture', 'epics', 'customize']) {
      const stepIndicator = page.locator(`[data-testid="step-${step}"]`);
      await expect(stepIndicator).toBeVisible();
    }
  });

  test('BMAD-4: Bouton désactivé si idée < 10 caractères', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo`);
    await page.waitForLoadState('networkidle');
    
    const generateBtn = page.locator('[data-testid="generate-brief-btn"]');
    await expect(generateBtn).toBeDisabled();
    
    // Taper moins de 10 caractères
    await page.locator('[data-testid="idea-input"]').fill('test');
    await expect(generateBtn).toBeDisabled();
    
    // Taper plus de 10 caractères
    await page.locator('[data-testid="idea-input"]').fill('une idée longue');
    await expect(generateBtn).toBeEnabled();
  });
});
```

---

## 📁 SOLUTION B: E2E Bypass Auth Mode (⚠️ Dev Only)

### Description
Variable d'environnement pour désactiver l'auth en mode test.

### ⚠️ ATTENTION: Ne JAMAIS activer en production!

#### 1. Modifier `src/middleware.ts`

```typescript
import { authMiddleware } from '@clerk/nextjs'

// ATTENTION: E2E_BYPASS_AUTH uniquement en développement/test!
const isTestMode = process.env.E2E_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production'

export default authMiddleware({
  publicRoutes: isTestMode 
    ? ['(.*)'] // Tout public en mode test
    : [
        '/',
        '/pricing',
        '/demo',
        '/sign-in(.*)',
        '/sign-up(.*)',
        '/api/webhooks(.*)',
        '/api/debug',
        '/api/health',
      ],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

#### 2. Modifier `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Définir l'env pour le serveur de test
  webServer: {
    command: 'E2E_BYPASS_AUTH=true npm run dev -- -p 3001',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    env: {
      E2E_BYPASS_AUTH: 'true',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],
});
```

#### 3. Créer un mock user pour les API routes

Créer `src/lib/test-auth.ts`:

```typescript
import { auth } from '@clerk/nextjs'

// Mock user pour les tests E2E
const MOCK_USER = {
  userId: 'test_user_e2e_123',
  sessionId: 'test_session_e2e',
}

export function getAuthForTest() {
  if (process.env.E2E_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    return MOCK_USER
  }
  return auth()
}
```

---

## 📁 SOLUTION C: Authentication Playwright (🏆 Recommandé)

### Description
Configuration Playwright pour authentification réelle avec Clerk.

### Prérequis
- Compte test Clerk dédié
- Email: `e2e-test@appforge.dev`
- Password: stocké dans `.env.test.local`

#### 1. Créer `.env.test.local` (⚠️ NE PAS COMMIT)

```bash
# Credentials de test E2E - NE PAS COMMIT
E2E_TEST_EMAIL=e2e-test@appforge.dev
E2E_TEST_PASSWORD=SecureTestPassword123!
```

#### 2. Créer `tests/auth.setup.ts`

```typescript
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  
  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set');
  }

  // Aller à la page de login
  await page.goto('http://localhost:3001/sign-in');
  await page.waitForLoadState('networkidle');
  
  // Attendre que Clerk charge
  await page.waitForSelector('[class*="cl-"]', { timeout: 10000 });
  
  // Remplir email
  const emailInput = page.locator('input[name="identifier"]');
  await emailInput.fill(email);
  
  // Cliquer "Continue"
  await page.locator('button:has-text("Continue")').click();
  
  // Attendre le champ password
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  
  // Remplir password
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);
  
  // Submit
  await page.locator('button:has-text("Continue")').click();
  
  // Attendre la redirection vers dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  
  // Vérifier qu'on est authentifié
  await expect(page.locator('text=Tableau de bord')).toBeVisible();
  
  // Sauvegarder la session
  await page.context().storageState({ path: authFile });
});
```

#### 3. Modifier `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables de test
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Projet setup pour l'auth
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Tests qui nécessitent l'auth
    {
      name: 'authenticated',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*authenticated.*\.spec\.ts/,
    },
    // Tests publics (sans auth)
    {
      name: 'public',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
      },
      testMatch: /.*public.*\.spec\.ts|.*demo.*\.spec\.ts/,
    },
  ],
});
```

#### 4. Créer `tests/authenticated-bmad.spec.ts`

```typescript
/**
 * Tests BMAD avec authentification réelle
 * Dépend du setup d'authentification
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Flow BMAD Authentifié', () => {
  
  test('La page /app/new est accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/new`);
    await page.waitForLoadState('networkidle');
    
    // On ne devrait PAS être redirigé vers sign-in
    expect(page.url()).not.toContain('/sign-in');
    
    // Le choix du flow doit être visible
    await expect(page.getByText('Comment veux-tu')).toBeVisible();
  });

  test('Option "Ma propre idée" existe', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Attendre animations
    
    // Chercher le bouton "Ma propre idée"
    const customIdeaBtn = page.getByText('Ma propre idée');
    await expect(customIdeaBtn).toBeVisible();
  });

  test('Flow BMAD complet avec création app', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Cliquer "Ma propre idée"
    await page.getByText('Ma propre idée').click();
    
    // Phase 1: Idée
    const ideaInput = page.locator('textarea').first();
    await ideaInput.fill('Une application de notes avec markdown et tags');
    
    // Générer Brief
    await page.getByRole('button', { name: /générer le brief/i }).click();
    
    // Attendre génération (peut prendre du temps)
    await page.waitForSelector('text=Product Brief', { timeout: 60000 });
    
    // Continuer le flow...
    // (Tests plus détaillés selon besoin)
  });
});
```

---

## 🚀 Plan d'Implémentation Recommandé

### Phase 1: Quick Win (30 min)
1. ✅ Créer la page `/demo` (Solution A)
2. ✅ Ajouter `/demo` aux routes publiques
3. ✅ Créer les tests `demo-flow.spec.ts`

### Phase 2: Tests Authentifiés (1-2h)
1. Créer le compte test Clerk
2. Configurer `.env.test.local`
3. Implémenter `auth.setup.ts`
4. Créer les tests authentifiés

### Phase 3: CI/CD (optionnel)
1. Ajouter les secrets Clerk au CI
2. Configurer le pipeline de tests

---

## 📝 Commandes de Test

```bash
# Démarrer le serveur de dev
npm run dev -- -p 3001

# Lancer les tests publics (page démo)
npx playwright test tests/demo-flow.spec.ts

# Lancer tous les tests
npx playwright test

# Avec UI
npx playwright test --ui

# Voir le rapport
npx playwright show-report
```

---

## ✅ Checklist de Validation

- [ ] La page `/demo` charge sans authentification
- [ ] Le stepper BMAD affiche les 6 étapes
- [ ] Le bouton "Ma propre idée" est visible et cliquable
- [ ] Le flow complet fonctionne (idée → création)
- [ ] Les tests passent sans erreur
- [ ] Pas de régression sur les routes existantes

---

**Prochaines étapes:** Implémenter la Solution A en priorité, puis la Solution C pour les tests E2E complets.
