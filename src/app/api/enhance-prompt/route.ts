/**
 * Prompt Enhancement API
 * 
 * Takes a user's rough app idea and enhances it into a detailed prompt
 * optimized for the AI builder.
 * 
 * Uses the same model/key logic as the chat API but with faster models.
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

// Fast models for each provider (cheap and quick for prompt enhancement)
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

    // Determine provider from user's preferred model (same logic as chat API)
    const preferredModelKey = user.preferredModel?.modelId || 'gpt-4o'
    
    // Check available platform keys
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasKimiKey = !!process.env.KIMI_API_KEY
    
    // Detect provider from preferred model
    let provider: 'anthropic' | 'openai' | 'kimi'
    if (preferredModelKey.startsWith('kimi')) {
      provider = 'kimi'
    } else if (preferredModelKey.startsWith('claude')) {
      provider = 'anthropic'
    } else {
      provider = 'openai'
    }
    
    // Smart fallback: if preferred provider has no key (and no BYOK), switch to another
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

    // Get the appropriate API key (BYOK takes priority, same as chat API)
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

    console.log('[Enhance] Using provider:', provider, 'BYOK:', useBYOK)

    let enhancedPrompt: string

    try {
      if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey })
        const response = await anthropic.messages.create({
          model: FAST_MODELS.anthropic,
          max_tokens: 1024,
          system: ENHANCE_SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: `Améliore cette idée d'application:\n\n${userPrompt}` }
          ],
        })
        enhancedPrompt = response.content[0].type === 'text' ? response.content[0].text : ''
      } else {
        // OpenAI and Kimi use the same API
        const openai = new OpenAI({ 
          apiKey, 
          baseURL: provider === 'kimi' ? KIMI_BASE_URL : undefined 
        })
        const response = await openai.chat.completions.create({
          model: provider === 'kimi' ? FAST_MODELS.kimi : FAST_MODELS.openai,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
            { role: 'user', content: `Améliore cette idée d'application:\n\n${userPrompt}` }
          ],
        })
        enhancedPrompt = response.choices[0]?.message?.content || ''
      }
    } catch (apiError) {
      console.error('[Enhance] API error:', apiError)
      const errorMsg = apiError instanceof Error ? apiError.message : String(apiError)
      
      // If it's an auth error and using platform key, suggest BYOK
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

    if (!enhancedPrompt) {
      return new Response(JSON.stringify({ error: 'Échec de l\'amélioration du prompt' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      originalPrompt: userPrompt,
      enhancedPrompt: enhancedPrompt.trim(),
      provider,
      usedBYOK: useBYOK,
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
