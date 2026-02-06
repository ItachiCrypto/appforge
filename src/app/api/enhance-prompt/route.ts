/**
 * Prompt Enhancement API - BMAD Method Integration
 * 
 * Takes a user's rough app idea and creates a structured "App Brief"
 * following the BMAD (Breakthrough Method of Agile AI Driven Development) methodology.
 * 
 * The App Brief acts as a lightweight PRD that stays with the app for context.
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// BMAD-inspired App Brief generator prompt
const BMAD_BRIEF_PROMPT = `Tu es un Product Manager expert utilisant la méthodologie BMAD (Breakthrough Method of Agile AI Driven Development).

## TON RÔLE

L'utilisateur va te donner une idée d'application. Tu dois créer un **App Brief** structuré qui servira de guide pour le développement.

## FORMAT DE L'APP BRIEF

Génère EXACTEMENT ce format (en gardant les titres en français) :

---
## 📋 APP BRIEF

### 🎯 Vision
[1-2 phrases décrivant le but de l'app et le problème qu'elle résout]

### 👥 Utilisateurs Cibles
[Qui va utiliser cette app ? Quel est leur profil ?]

### ✨ Fonctionnalités MVP
[Liste numérotée des fonctionnalités essentielles - 5 max]
1. [Fonctionnalité principale]
2. [Fonctionnalité secondaire]
3. ...

### 🎨 Design & UX
- **Style**: [Dark mode premium / Light minimal / etc.]
- **Couleurs**: [Palette suggérée - gradients, accents]
- **Layout**: [Description du layout principal]
- **Animations**: [Types d'animations attendues]

### 📱 Écrans Principaux
[Liste des vues/écrans de l'app]
- [Écran 1]: [Description courte]
- [Écran 2]: [Description courte]

### 💾 Données & État
- **Persistance**: localStorage (obligatoire)
- **État principal**: [Quelles données sont gérées ?]

### ⚠️ Hors Scope (Limitations)
[Ce que l'app NE FAIT PAS - important pour gérer les attentes]
- Pas de backend réel
- Pas d'authentification réelle
- [Autres limitations spécifiques]

---

## RÈGLES

1. **Sois précis mais concis** - Pas de blabla, que du concret
2. **MVP first** - Max 5 fonctionnalités essentielles
3. **Design premium par défaut** - Dark mode, gradients, glassmorphism
4. **Réaliste** - L'app tourne côté client uniquement
5. **Actionnable** - Un dev doit pouvoir coder directement à partir de ce brief

## EXEMPLE

**Input:** "une app de budget"

**Output:**
---
## 📋 APP BRIEF

### 🎯 Vision
Application de gestion de budget personnel permettant de suivre ses dépenses et revenus, visualiser sa situation financière, et atteindre ses objectifs d'épargne.

### 👥 Utilisateurs Cibles
Particuliers souhaitant mieux gérer leur argent, suivre leurs dépenses par catégorie, et visualiser leur progression financière.

### ✨ Fonctionnalités MVP
1. Ajouter des transactions (dépenses/revenus) avec catégorie et date
2. Dashboard avec solde actuel et graphiques de répartition
3. Filtres par période (semaine/mois/année) et catégorie
4. Objectifs d'épargne avec barre de progression
5. Export des données en JSON

### 🎨 Design & UX
- **Style**: Dark mode premium avec accents verts (argent positif) et rouges (dépenses)
- **Couleurs**: Gradient slate-900 → emerald-900, accents emerald-500/red-500
- **Layout**: Sidebar gauche avec navigation, zone principale avec dashboard/liste
- **Animations**: Transitions fluides, graphiques animés, hover effects sur cards

### 📱 Écrans Principaux
- **Dashboard**: Solde, graphique camembert par catégorie, dernières transactions
- **Transactions**: Liste filtrable avec recherche, bouton d'ajout
- **Objectifs**: Cards d'objectifs avec progression
- **Paramètres**: Catégories personnalisées, export

### 💾 Données & État
- **Persistance**: localStorage pour transactions, catégories, objectifs
- **État principal**: Liste de transactions, catégories, objectifs d'épargne

### ⚠️ Hors Scope (Limitations)
- Pas de synchronisation bancaire
- Pas de multi-devises
- Pas de partage entre utilisateurs
---

Maintenant, génère l'App Brief pour l'idée de l'utilisateur. Réponds UNIQUEMENT avec le brief formaté, sans introduction.`

// Fast models for each provider
const FAST_MODELS = {
  anthropic: 'claude-3-5-haiku-20241022',
  openai: 'gpt-4o-mini',
  kimi: 'moonshot-v1-8k',
}

const KIMI_BASE_URL = 'https://api.moonshot.cn/v1'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Prompt requis (minimum 3 caractères)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userPrompt = prompt.trim()

    // Get user with preferred model (same as chat API)
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

    // Determine provider from user's preferred model
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
      if (hasKimiKey || (user.byokEnabled && user.kimiKey)) provider = 'kimi'
      else if (hasAnthropicKey || (user.byokEnabled && user.anthropicKey)) provider = 'anthropic'
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

    console.log('[Enhance/BMAD] Using provider:', provider, 'BYOK:', useBYOK)

    let appBrief: string

    try {
      if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey })
        const response = await anthropic.messages.create({
          model: FAST_MODELS.anthropic,
          max_tokens: 1500,
          system: BMAD_BRIEF_PROMPT,
          messages: [
            { role: 'user', content: `Crée un App Brief pour cette idée:\n\n${userPrompt}` }
          ],
        })
        appBrief = response.content[0].type === 'text' ? response.content[0].text : ''
      } else {
        const openai = new OpenAI({ 
          apiKey, 
          baseURL: provider === 'kimi' ? KIMI_BASE_URL : undefined 
        })
        const response = await openai.chat.completions.create({
          model: provider === 'kimi' ? FAST_MODELS.kimi : FAST_MODELS.openai,
          max_tokens: 1500,
          messages: [
            { role: 'system', content: BMAD_BRIEF_PROMPT },
            { role: 'user', content: `Crée un App Brief pour cette idée:\n\n${userPrompt}` }
          ],
        })
        appBrief = response.choices[0]?.message?.content || ''
      }
    } catch (apiError) {
      console.error('[Enhance/BMAD] API error:', apiError)
      const errorMsg = apiError instanceof Error ? apiError.message : String(apiError)
      
      if (errorMsg.includes('invalid') || errorMsg.includes('401') || errorMsg.includes('authentication')) {
        return new Response(JSON.stringify({ 
          error: `Erreur d'authentification ${provider}. Ajoutez votre propre clé API dans Paramètres.`,
          code: 'AUTH_ERROR' 
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      
      throw apiError
    }

    if (!appBrief) {
      return new Response(JSON.stringify({ error: 'Échec de la création du brief' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate a build prompt from the brief
    const buildPrompt = `${appBrief}

---

🚀 **INSTRUCTION**: Crée cette application en suivant le brief ci-dessus. 
Commence par les fonctionnalités MVP, avec le design premium décrit.
Utilise localStorage pour la persistance.`

    return new Response(JSON.stringify({ 
      originalPrompt: userPrompt,
      appBrief: appBrief.trim(),
      enhancedPrompt: buildPrompt.trim(), // For backward compatibility
      provider,
      usedBYOK: useBYOK,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Enhance/BMAD] Error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erreur interne' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
