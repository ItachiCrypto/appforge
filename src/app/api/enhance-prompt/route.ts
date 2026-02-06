/**
 * Prompt Enhancement API
 * 
 * Takes a user's rough app idea and enhances it into a detailed prompt
 * optimized for the AI builder.
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const ENHANCE_SYSTEM_PROMPT = `Tu es un expert en product design et en rédaction de prompts pour IA.

## TON RÔLE

L'utilisateur va te donner une idée d'application vague ou simple.
Tu dois transformer cette idée en un prompt détaillé et optimisé qui permettra à une IA de créer une application web exceptionnelle.

## RÈGLES

1. **Garde l'essence de l'idée** - Ne change pas le concept, améliore-le
2. **Ajoute des détails visuels** - Couleurs, layout, animations
3. **Spécifie les fonctionnalités** - CRUD, filtres, recherche, persistance
4. **Inclus le design premium** - Dark mode, gradients, glassmorphism
5. **Reste réaliste** - L'app tourne côté client uniquement (pas de backend réel)
6. **Sois concis** - 3-5 paragraphes maximum

## FORMAT DE SORTIE

Réponds UNIQUEMENT avec le prompt amélioré, sans introduction ni explication.
Le prompt doit être en français et commencer directement par la description de l'app.

## EXEMPLE

**Input utilisateur:** "une app de notes"

**Output:**
Crée une application de prise de notes style Notion avec un design dark mode premium.

**Design:**
- Background: gradient sombre (slate-900 → purple-900)
- Cards: glassmorphism avec backdrop-blur
- Boutons: gradients violet/rose avec hover effects

**Fonctionnalités:**
- Créer, éditer, supprimer des notes
- Recherche en temps réel
- Catégories/tags avec filtres
- Vue grille et liste
- Persistance localStorage
- Mode markdown basique (gras, italique, listes)

**Interactions:**
- Double-clic pour éditer
- Drag & drop pour réorganiser
- Animations fluides sur toutes les actions
- Modal de confirmation pour suppression`

export const runtime = 'nodejs'
export const maxDuration = 30

// Helper to try Anthropic
async function tryAnthropic(apiKey: string, userPrompt: string): Promise<string | null> {
  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: ENHANCE_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Améliore cette idée d'application:\n\n${userPrompt}` }
      ],
    })
    return response.content[0].type === 'text' ? response.content[0].text : null
  } catch (error) {
    console.error('[Enhance] Anthropic failed:', error instanceof Error ? error.message : error)
    return null
  }
}

// Helper to try OpenAI
async function tryOpenAI(apiKey: string, userPrompt: string, baseURL?: string): Promise<string | null> {
  try {
    const openai = new OpenAI({ apiKey, baseURL })
    const response = await openai.chat.completions.create({
      model: baseURL ? 'moonshot-v1-8k' : 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
        { role: 'user', content: `Améliore cette idée d'application:\n\n${userPrompt}` }
      ],
    })
    return response.choices[0]?.message?.content || null
  } catch (error) {
    console.error('[Enhance] OpenAI/Kimi failed:', error instanceof Error ? error.message : error)
    return null
  }
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

    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Prompt requis (minimum 3 caractères)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userPrompt = prompt.trim()

    // Get user for BYOK
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    // Collect available keys with priority
    // Priority: BYOK > Platform keys
    // Order: OpenAI > Kimi > Anthropic (since Anthropic platform key may be invalid)
    const providers: Array<{ name: string; fn: () => Promise<string | null> }> = []

    // BYOK keys first (user's own keys are more reliable)
    if (user?.byokEnabled) {
      if (user.openaiKey) {
        providers.push({ 
          name: 'OpenAI (BYOK)', 
          fn: () => tryOpenAI(user.openaiKey!, userPrompt) 
        })
      }
      if (user.kimiKey) {
        providers.push({ 
          name: 'Kimi (BYOK)', 
          fn: () => tryOpenAI(user.kimiKey!, userPrompt, 'https://api.moonshot.cn/v1') 
        })
      }
      if (user.anthropicKey) {
        providers.push({ 
          name: 'Anthropic (BYOK)', 
          fn: () => tryAnthropic(user.anthropicKey!, userPrompt) 
        })
      }
    }

    // Platform keys (OpenAI and Kimi first, Anthropic last due to potential key issues)
    if (process.env.OPENAI_API_KEY) {
      providers.push({ 
        name: 'OpenAI', 
        fn: () => tryOpenAI(process.env.OPENAI_API_KEY!, userPrompt) 
      })
    }
    if (process.env.KIMI_API_KEY) {
      providers.push({ 
        name: 'Kimi', 
        fn: () => tryOpenAI(process.env.KIMI_API_KEY!, userPrompt, 'https://api.moonshot.cn/v1') 
      })
    }
    if (process.env.ANTHROPIC_API_KEY) {
      providers.push({ 
        name: 'Anthropic', 
        fn: () => tryAnthropic(process.env.ANTHROPIC_API_KEY!, userPrompt) 
      })
    }

    if (providers.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Aucune clé API disponible. Ajoutez votre clé dans Paramètres.',
        code: 'NO_API_KEY' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Try each provider in order until one works
    let enhancedPrompt: string | null = null
    let usedProvider: string | null = null

    for (const provider of providers) {
      console.log(`[Enhance] Trying ${provider.name}...`)
      enhancedPrompt = await provider.fn()
      if (enhancedPrompt) {
        usedProvider = provider.name
        console.log(`[Enhance] Success with ${provider.name}`)
        break
      }
    }

    if (!enhancedPrompt) {
      return new Response(JSON.stringify({ 
        error: 'Tous les providers IA ont échoué. Réessayez plus tard.',
        code: 'ALL_PROVIDERS_FAILED' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      originalPrompt: userPrompt,
      enhancedPrompt: enhancedPrompt.trim(),
      provider: usedProvider,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Enhance Prompt] Error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erreur interne' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
