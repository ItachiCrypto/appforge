/**
 * BMAD Method API - Multi-Phase Document Generation
 * 
 * Implements the full BMAD (Breakthrough Method of Agile AI Driven Development) workflow:
 * 
 * Phase 1: BRIEF - Product Brief (vision, users, constraints)
 * Phase 2: PRD - Product Requirements Document (FRs, NFRs, personas, metrics)
 * Phase 3: ARCHITECTURE - Technical Architecture (stack, schema, ADRs)
 * Phase 4: EPICS - Epics & Stories (implementation breakdown)
 * 
 * Each phase takes the previous phase's output as context.
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

// ============================================================================
// BMAD PHASE PROMPTS
// ============================================================================

const PROMPTS = {
  /**
   * Phase 1: Product Brief
   * Input: User's raw idea
   * Output: Strategic vision document
   */
  brief: `Tu es un Product Manager expert utilisant la méthodologie BMAD.

## TON RÔLE
L'utilisateur te donne une idée d'application. Tu dois créer un **Product Brief** structuré.

## FORMAT DU PRODUCT BRIEF

\`\`\`markdown
# 📋 PRODUCT BRIEF

## 🎯 Vision
[2-3 phrases: Quel problème résout cette app ? Pourquoi elle doit exister ?]

## 👥 Utilisateurs Cibles
### Persona Principal
- **Qui**: [Profil démographique]
- **Besoin**: [Leur problème principal]
- **Comportement actuel**: [Comment ils résolvent ce problème aujourd'hui]

### Persona Secondaire (optionnel)
[Si pertinent]

## 🎯 Objectifs Business
1. [Objectif mesurable 1]
2. [Objectif mesurable 2]
3. [Objectif mesurable 3]

## ⚡ Proposition de Valeur
[1 phrase percutante qui résume pourquoi les users choisiraient cette app]

## 🚧 Contraintes Techniques
- **Plateforme**: Web (React SPA)
- **Persistance**: localStorage uniquement (pas de backend)
- **APIs**: Aucune API externe (CORS)
- **Auth**: Simulation UI seulement

## 📊 Métriques de Succès
- [Métrique 1 - ex: Temps passé dans l'app]
- [Métrique 2 - ex: Taux de complétion des tâches]
- [Métrique 3 - ex: Rétention jour 7]

## ⚠️ Risques & Hypothèses
### Hypothèses
- [Ce qu'on suppose vrai]

### Risques
- [Ce qui pourrait mal tourner]
\`\`\`

## RÈGLES
1. **Sois stratégique** - Ce brief guide tout le développement
2. **Sois réaliste** - Rappelle les contraintes techniques (client-side only)
3. **Sois concis** - Chaque section doit tenir en quelques lignes
4. **Pense utilisateur** - Tout part du besoin utilisateur

Génère UNIQUEMENT le brief formaté, sans introduction.`,

  /**
   * Phase 2: PRD (Product Requirements Document)
   * Input: Product Brief
   * Output: Detailed requirements
   */
  prd: `Tu es un Product Manager expert utilisant la méthodologie BMAD.

## TON RÔLE
Tu as reçu un Product Brief. Tu dois créer un **PRD** (Product Requirements Document) détaillé.

## FORMAT DU PRD

\`\`\`markdown
# 📄 PRD - [Nom de l'App]

## 1. Résumé Exécutif
[Reprise condensée de la vision du brief - 2-3 phrases]

## 2. Fonctionnalités (Functional Requirements)

### FR-001: [Nom de la fonctionnalité]
- **Description**: [Ce que fait cette feature]
- **User Story**: En tant que [persona], je veux [action] pour [bénéfice]
- **Critères d'acceptation**:
  - [ ] [Critère 1]
  - [ ] [Critère 2]
  - [ ] [Critère 3]
- **Priorité**: P0 (Must have) | P1 (Should have) | P2 (Nice to have)

### FR-002: [Fonctionnalité 2]
[Même format...]

### FR-003: [Fonctionnalité 3]
[...]

### FR-004: [Fonctionnalité 4]
[...]

### FR-005: [Fonctionnalité 5]
[Maximum 5 pour MVP]

## 3. Exigences Non-Fonctionnelles (NFRs)

### NFR-001: Performance
- Temps de chargement initial < 2s
- Interactions < 100ms

### NFR-002: Persistance
- Données sauvegardées en localStorage
- Pas de perte de données au refresh

### NFR-003: Responsive Design
- Mobile-first (320px minimum)
- Desktop optimisé (1920px max)

### NFR-004: Accessibilité
- Navigation clavier
- Contraste suffisant
- Labels ARIA

## 4. Écrans & Navigation

### 4.1 Sitemap
\`\`\`
[Écran Principal]
├── [Sous-écran 1]
├── [Sous-écran 2]
└── [Sous-écran 3]
\`\`\`

### 4.2 Détail des Écrans

#### Écran: [Nom]
- **But**: [Objectif de cet écran]
- **Composants principaux**: [Liste des composants UI]
- **Actions utilisateur**: [Ce que l'user peut faire]
- **États**: [Empty, Loading, Error, Success]

## 5. Modèle de Données

### Entité: [Nom]
\`\`\`typescript
interface [Entité] {
  id: string;
  // ... propriétés
  createdAt: number;
  updatedAt: number;
}
\`\`\`

## 6. Hors Scope (v1)
- ❌ [Feature explicitement exclue]
- ❌ [Autre feature exclue]
- ❌ [...]

## 7. Questions Ouvertes
- [ ] [Question à clarifier]
- [ ] [Autre question]
\`\`\`

## RÈGLES
1. **Max 5 FR pour MVP** - Focus sur l'essentiel
2. **User Stories claires** - Format "En tant que... je veux... pour..."
3. **Critères testables** - Chaque critère peut être vérifié
4. **Priorisé** - P0 = bloquant, P1 = important, P2 = bonus
5. **Réaliste** - Client-side only, localStorage, pas d'API

Génère UNIQUEMENT le PRD formaté. Utilise le Product Brief fourni comme contexte.`,

  /**
   * Phase 3: Architecture
   * Input: PRD
   * Output: Technical architecture with ADRs
   */
  architecture: `Tu es un Architecte Logiciel expert utilisant la méthodologie BMAD.

## TON RÔLE
Tu as reçu un PRD. Tu dois créer un document d'**Architecture Technique** avec des ADRs (Architecture Decision Records).

## FORMAT DE L'ARCHITECTURE

\`\`\`markdown
# 🏗️ ARCHITECTURE - [Nom de l'App]

## 1. Vue d'Ensemble

### Stack Technique
| Layer | Technologie | Justification |
|-------|-------------|---------------|
| UI Framework | React 18 | Composants réutilisables, hooks |
| Styling | Tailwind CSS | Utility-first, responsive |
| State | useState + useEffect | Simple, suffisant pour SPA |
| Persistance | localStorage | Contrainte: pas de backend |
| Build | Vite (via AppForge) | Fast HMR, ESM native |

### Diagramme de Composants
\`\`\`
App
├── Layout
│   ├── Header
│   ├── Sidebar (si applicable)
│   └── Main
├── Pages/Views
│   ├── [Page1]
│   ├── [Page2]
│   └── [Page3]
├── Components
│   ├── [Component1]
│   ├── [Component2]
│   └── [Component3]
└── Hooks
    ├── useLocalStorage
    └── [autres hooks custom]
\`\`\`

## 2. Structure des Fichiers

\`\`\`
/App.js                    # Point d'entrée, routing, layout global
/components/
  ├── Header.js            # Navigation, titre
  ├── Sidebar.js           # Navigation latérale (si applicable)
  ├── [Component1].js      # [Description]
  ├── [Component2].js      # [Description]
  └── [Component3].js      # [Description]
/hooks/
  └── useLocalStorage.js   # Hook de persistance
\`\`\`

## 3. Modèle de Données

### Schéma localStorage
\`\`\`typescript
// Clé: "[app-name]-data"
interface AppState {
  version: number;  // Pour migrations futures
  [entity1]: Entity1[];
  [entity2]: Entity2[];
  settings: Settings;
}

interface Entity1 {
  id: string;        // nanoid ou Date.now()
  [champs...];
  createdAt: number;
  updatedAt: number;
}
\`\`\`

### Opérations CRUD
| Opération | Implémentation |
|-----------|----------------|
| Create | \`setItems([...items, newItem])\` |
| Read | \`items.filter()\` / \`items.find()\` |
| Update | \`items.map(i => i.id === id ? {...i, ...updates} : i)\` |
| Delete | \`items.filter(i => i.id !== id)\` |

## 4. Patterns & Conventions

### Naming Conventions
- **Composants**: PascalCase (\`TaskCard.js\`)
- **Hooks**: camelCase avec préfixe \`use\` (\`useLocalStorage.js\`)
- **Handlers**: \`handle[Event]\` (\`handleSubmit\`, \`handleDelete\`)
- **State**: descriptif (\`isLoading\`, \`selectedItem\`, \`items\`)

### Component Pattern
\`\`\`jsx
// Pattern standard pour chaque composant
import React, { useState } from 'react';

export default function ComponentName({ prop1, prop2, onAction }) {
  const [localState, setLocalState] = useState(initialValue);

  const handleAction = () => {
    // logic
    onAction?.(result);
  };

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
\`\`\`

### State Management Pattern
\`\`\`jsx
// Dans App.js - État global avec persistence
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('app-data');
  return saved ? JSON.parse(saved) : defaultState;
});

useEffect(() => {
  localStorage.setItem('app-data', JSON.stringify(data));
}, [data]);
\`\`\`

## 5. ADRs (Architecture Decision Records)

### ADR-001: Single Page Application
- **Contexte**: App client-side sans backend
- **Décision**: SPA React avec routing via état (pas de react-router)
- **Conséquences**: Simple, pas d'URLs bookmarkables pour les sous-pages

### ADR-002: State Management
- **Contexte**: Besoin de gérer l'état de l'app
- **Décision**: useState + Context si nécessaire (pas de Redux)
- **Conséquences**: Code simple, suffisant pour app moyenne

### ADR-003: Styling Approach
- **Contexte**: Besoin de design premium et responsive
- **Décision**: Tailwind CSS utility classes
- **Conséquences**: Pas de fichiers CSS séparés, classes dans le JSX

### ADR-004: Persistence Strategy
- **Contexte**: Données doivent survivre au refresh
- **Décision**: localStorage avec JSON serialization
- **Conséquences**: Limité à ~5MB, pas de sync entre onglets

### ADR-005: Component Granularity
- **Contexte**: Quand créer un nouveau composant ?
- **Décision**: Nouveau fichier si >100 lignes OU réutilisable
- **Conséquences**: App.js reste lisible, composants focused

## 6. Design System

### Couleurs (Tailwind)
| Usage | Classes |
|-------|---------|
| Background | \`bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900\` |
| Card | \`bg-white/10 backdrop-blur-xl border border-white/20\` |
| Primary Button | \`bg-gradient-to-r from-purple-500 to-pink-500\` |
| Text Primary | \`text-white\` |
| Text Secondary | \`text-white/60\` |

### Spacing Scale
- \`p-2\` (8px) - Dense UI
- \`p-4\` (16px) - Standard
- \`p-6\` (24px) - Cards
- \`p-8\` (32px) - Sections

### Animation Classes
- Hover: \`hover:scale-105 transition-all duration-300\`
- Card: \`hover:shadow-lg hover:bg-white/15\`
- Button: \`hover:shadow-purple-500/40\`

## 7. Points d'Attention

### Performance
- [ ] Mémoiser les filtres/calculs lourds avec useMemo
- [ ] Éviter les re-renders inutiles (keys stables)

### Accessibilité
- [ ] aria-label sur les boutons icône
- [ ] Rôles ARIA sur les composants custom
- [ ] Focus visible sur tous les interactifs

### Edge Cases
- [ ] État vide (first use)
- [ ] Données corrompues dans localStorage
- [ ] Très grande quantité de données
\`\`\`

## RÈGLES
1. **Pragmatique** - Solutions simples qui marchent
2. **Cohérent** - Mêmes patterns partout
3. **Documenté** - Chaque décision a une raison
4. **Réaliste** - Client-side only, pas d'over-engineering

Génère UNIQUEMENT le document d'architecture. Utilise le PRD fourni comme contexte.`,

  /**
   * Phase 4: Epics & Stories
   * Input: PRD + Architecture
   * Output: Implementation breakdown
   */
  epics: `Tu es un Scrum Master expert utilisant la méthodologie BMAD.

## TON RÔLE
Tu as reçu un PRD et une Architecture. Tu dois créer les **Epics & Stories** pour l'implémentation.

## FORMAT DES EPICS & STORIES

\`\`\`markdown
# 📋 EPICS & STORIES - [Nom de l'App]

## Vue d'Ensemble

| Epic | Stories | Priorité | Estimation |
|------|---------|----------|------------|
| Epic 1: [Nom] | X stories | P0 | ~Xh |
| Epic 2: [Nom] | X stories | P0 | ~Xh |
| Epic 3: [Nom] | X stories | P1 | ~Xh |

---

## 🎯 Epic 1: [Nom - ex: "Setup & Layout de Base"]

**Objectif**: [Ce que cet epic accomplit]
**Dépendances**: Aucune (premier epic) | Epic X
**FR associés**: FR-001, FR-002

### Story 1.1: [Titre court]
- **Description**: [Ce qui doit être fait]
- **Critères d'acceptation**:
  - [ ] [Critère vérifiable 1]
  - [ ] [Critère vérifiable 2]
  - [ ] [Critère vérifiable 3]
- **Fichiers à créer/modifier**:
  - \`/App.js\` - [Ce qu'on y fait]
  - \`/components/Header.js\` - [Ce qu'on y fait]
- **Notes techniques**: [Détails d'implémentation si nécessaire]

### Story 1.2: [Titre court]
[Même format...]

---

## 🎯 Epic 2: [Nom - ex: "Gestion des Données"]

**Objectif**: [Ce que cet epic accomplit]
**Dépendances**: Epic 1
**FR associés**: FR-003

### Story 2.1: [Titre court]
[...]

### Story 2.2: [Titre court]
[...]

---

## 🎯 Epic 3: [Nom - ex: "Fonctionnalités Avancées"]

**Objectif**: [Ce que cet epic accomplit]
**Dépendances**: Epic 1, Epic 2
**FR associés**: FR-004, FR-005

### Story 3.1: [Titre court]
[...]

---

## 📊 Ordre d'Implémentation Recommandé

1. **Sprint 1** (Epic 1):
   - Story 1.1 → Story 1.2 → Story 1.3
   - Résultat: App qui s'affiche avec layout de base

2. **Sprint 2** (Epic 2):
   - Story 2.1 → Story 2.2
   - Résultat: CRUD fonctionnel avec persistence

3. **Sprint 3** (Epic 3):
   - Story 3.1 → Story 3.2
   - Résultat: App MVP complète

---

## ⚠️ Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| [Risque 1] | Moyen | [Comment l'éviter] |
| [Risque 2] | Faible | [Comment l'éviter] |

---

## 📝 Definition of Done (DoD)

Chaque story est "Done" quand:
- [ ] Code implémenté et fonctionnel
- [ ] Pas d'erreurs console
- [ ] Responsive (mobile + desktop)
- [ ] Persistence localStorage fonctionne
- [ ] États vides/erreur gérés
\`\`\`

## RÈGLES
1. **Granularité correcte** - Une story = 1-2h de travail max
2. **Indépendant dans l'epic** - Stories peuvent être faites dans l'ordre
3. **Testable** - Critères d'acceptation vérifiables
4. **Fichiers précis** - Liste exacte des fichiers à créer/modifier
5. **Ordre logique** - Epics dépendent des précédents

## IMPORTANT
- Les stories doivent correspondre à l'architecture définie
- Chaque FR du PRD doit être couvert par au moins une story
- Maximum 3-4 epics pour un MVP

Génère UNIQUEMENT les epics & stories. Utilise le PRD et l'Architecture fournis comme contexte.`,
}

// Map user model IDs to actual API model names
const MODEL_API_NAMES: Record<string, string> = {
  'claude-opus-4': 'claude-opus-4-20250514',
  'claude-sonnet-4': 'claude-sonnet-4-20250514',
  'claude-haiku-3.5': 'claude-3-5-haiku-20241022',
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
  'o1': 'o1',
  'o1-mini': 'o1-mini',
  // Kimi models - use native model IDs directly
  'kimi-k2.5': 'kimi-k2.5',
}

const KIMI_BASE_URL = 'https://api.moonshot.ai/v1'

type BmadPhase = 'brief' | 'prd' | 'architecture' | 'epics'

interface BmadRequest {
  phase: BmadPhase
  idea?: string           // For phase 1
  brief?: string          // For phase 2+
  prd?: string            // For phase 3+
  architecture?: string   // For phase 4
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body: BmadRequest = await req.json()
    const { phase, idea, brief, prd, architecture } = body

    // Validate phase
    if (!phase || !['brief', 'prd', 'architecture', 'epics'].includes(phase)) {
      return new Response(JSON.stringify({ error: 'Phase invalide. Valeurs: brief, prd, architecture, epics' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate required context for each phase
    if (phase === 'brief' && (!idea || idea.trim().length < 3)) {
      return new Response(JSON.stringify({ error: 'Idée requise pour la phase brief (min 3 caractères)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (phase === 'prd' && !brief) {
      return new Response(JSON.stringify({ error: 'Product Brief requis pour la phase PRD' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (phase === 'architecture' && !prd) {
      return new Response(JSON.stringify({ error: 'PRD requis pour la phase architecture' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (phase === 'epics' && (!prd || !architecture)) {
      return new Response(JSON.stringify({ error: 'PRD et Architecture requis pour la phase epics' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get user with preferred model
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { preferredModel: true },
    })

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Determine provider
    const preferredModelKey = user.preferredModel?.modelId || 'gpt-4o'
    
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasKimiKey = !!process.env.KIMI_API_KEY
    
    let provider: 'anthropic' | 'openai' | 'kimi'
    if (preferredModelKey.startsWith('kimi')) {
      provider = 'kimi'
    } else if (preferredModelKey.startsWith('claude')) {
      provider = 'anthropic'
    } else {
      provider = 'openai'
    }
    
    // Smart fallback
    if (provider === 'anthropic' && !hasAnthropicKey && !(user.byokEnabled && user.anthropicKey)) {
      if (hasOpenAIKey || (user.byokEnabled && user.openaiKey)) provider = 'openai'
      else if (hasKimiKey || (user.byokEnabled && user.kimiKey)) provider = 'kimi'
    } else if (provider === 'openai' && !hasOpenAIKey && !(user.byokEnabled && user.openaiKey)) {
      if (hasAnthropicKey || (user.byokEnabled && user.anthropicKey)) provider = 'anthropic'
      else if (hasKimiKey || (user.byokEnabled && user.kimiKey)) provider = 'kimi'
    } else if (provider === 'kimi' && !hasKimiKey && !(user.byokEnabled && user.kimiKey)) {
      if (hasOpenAIKey || (user.byokEnabled && user.openaiKey)) provider = 'openai'
      else if (hasAnthropicKey || (user.byokEnabled && user.anthropicKey)) provider = 'anthropic'
    }

    // Get API key
    let apiKey: string | null = null
    let useBYOK = false

    if (provider === 'anthropic') {
      if (user.byokEnabled && user.anthropicKey) {
        apiKey = user.anthropicKey
        useBYOK = true
      } else if (hasAnthropicKey) {
        apiKey = process.env.ANTHROPIC_API_KEY!
      }
    } else if (provider === 'openai') {
      if (user.byokEnabled && user.openaiKey) {
        apiKey = user.openaiKey
        useBYOK = true
      } else if (hasOpenAIKey) {
        apiKey = process.env.OPENAI_API_KEY!
      }
    } else if (provider === 'kimi') {
      if (user.byokEnabled && user.kimiKey) {
        apiKey = user.kimiKey
        useBYOK = true
      } else if (hasKimiKey) {
        apiKey = process.env.KIMI_API_KEY!
      }
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Aucune clé API disponible. Ajoutez votre clé dans Paramètres.',
        code: 'NO_API_KEY' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get the actual API model name from user's preferred model
    const apiModelName = MODEL_API_NAMES[preferredModelKey] || preferredModelKey
    
    console.log(`[BMAD/${phase}] Using provider:`, provider, 'model:', apiModelName, 'BYOK:', useBYOK)

    // Build the user message based on phase
    let userMessage: string
    switch (phase) {
      case 'brief':
        userMessage = `Crée un Product Brief pour cette idée d'application:\n\n${idea}`
        break
      case 'prd':
        userMessage = `Voici le Product Brief:\n\n${brief}\n\n---\n\nCrée maintenant le PRD complet basé sur ce brief.`
        break
      case 'architecture':
        userMessage = `Voici le PRD:\n\n${prd}\n\n---\n\nCrée maintenant le document d'Architecture technique basé sur ce PRD.`
        break
      case 'epics':
        userMessage = `Voici le PRD:\n\n${prd}\n\n---\n\nVoici l'Architecture:\n\n${architecture}\n\n---\n\nCrée maintenant les Epics & Stories basés sur ces documents.`
        break
      default:
        throw new Error('Invalid phase')
    }

    let result: string

    try {
      if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey })
        const response = await anthropic.messages.create({
          model: apiModelName,
          max_tokens: 4000,
          system: PROMPTS[phase],
          messages: [
            { role: 'user', content: userMessage }
          ],
        })
        result = response.content[0].type === 'text' ? response.content[0].text : ''
      } else {
        // OpenAI and Kimi both use OpenAI-compatible API
        const openai = new OpenAI({ 
          apiKey, 
          baseURL: provider === 'kimi' ? KIMI_BASE_URL : undefined 
        })
        const response = await openai.chat.completions.create({
          model: apiModelName,
          max_tokens: 4000,
          messages: [
            { role: 'system', content: PROMPTS[phase] },
            { role: 'user', content: userMessage }
          ],
        })
        result = response.choices[0]?.message?.content || ''
      }
    } catch (apiError: any) {
      console.error(`[BMAD/${phase}] API error:`, apiError)
      const errorMsg = apiError instanceof Error ? apiError.message : String(apiError)
      const statusCode = apiError?.status || apiError?.response?.status || 500
      
      if (errorMsg.includes('invalid') || errorMsg.includes('401') || errorMsg.includes('authentication')) {
        return new Response(JSON.stringify({ 
          error: `Erreur d'authentification ${provider}. Ajoutez votre propre clé API dans Paramètres.`,
          code: 'AUTH_ERROR' 
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      
      // Handle Kimi-specific errors (rate limit, content filter, etc.)
      if (provider === 'kimi') {
        console.error(`[BMAD/${phase}] Kimi error details:`, {
          status: statusCode,
          message: errorMsg,
          body: apiError?.error || apiError?.response?.body,
        })
        return new Response(JSON.stringify({ 
          error: `Erreur Kimi API: ${errorMsg.substring(0, 200)}`,
          code: 'PROVIDER_ERROR',
          provider: 'kimi',
        }), {
          status: statusCode >= 400 ? statusCode : 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      
      throw apiError
    }

    if (!result) {
      return new Response(JSON.stringify({ error: `Échec de la génération du ${phase}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[BMAD/${phase}] Generated ${result.length} chars`)

    return new Response(JSON.stringify({ 
      phase,
      document: result.trim(),
      provider,
      usedBYOK: useBYOK,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[BMAD] Error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erreur interne' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
