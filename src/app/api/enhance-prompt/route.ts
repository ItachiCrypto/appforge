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

    // Get user for BYOK
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    // Determine which API to use
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY || (user?.byokEnabled && user?.anthropicKey)
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY || (user?.byokEnabled && user?.openaiKey)
    const hasKimiKey = !!process.env.KIMI_API_KEY || (user?.byokEnabled && user?.kimiKey)

    let enhancedPrompt: string

    if (hasAnthropicKey) {
      const apiKey = (user?.byokEnabled && user?.anthropicKey) || process.env.ANTHROPIC_API_KEY!
      const anthropic = new Anthropic({ apiKey })
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Fast and cheap for this task
        max_tokens: 1024,
        system: ENHANCE_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Améliore cette idée d'application:\n\n${prompt.trim()}` }
        ],
      })
      
      enhancedPrompt = response.content[0].type === 'text' 
        ? response.content[0].text 
        : ''
    } else if (hasOpenAIKey) {
      const apiKey = (user?.byokEnabled && user?.openaiKey) || process.env.OPENAI_API_KEY!
      const openai = new OpenAI({ apiKey })
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cheap
        max_tokens: 1024,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
          { role: 'user', content: `Améliore cette idée d'application:\n\n${prompt.trim()}` }
        ],
      })
      
      enhancedPrompt = response.choices[0]?.message?.content || ''
    } else if (hasKimiKey) {
      const apiKey = (user?.byokEnabled && user?.kimiKey) || process.env.KIMI_API_KEY!
      const openai = new OpenAI({ 
        apiKey, 
        baseURL: 'https://api.moonshot.cn/v1' 
      })
      
      const response = await openai.chat.completions.create({
        model: 'moonshot-v1-8k', // Kimi's fast model
        max_tokens: 1024,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
          { role: 'user', content: `Améliore cette idée d'application:\n\n${prompt.trim()}` }
        ],
      })
      
      enhancedPrompt = response.choices[0]?.message?.content || ''
    } else {
      return new Response(JSON.stringify({ 
        error: 'Aucune clé API disponible. Ajoutez votre clé dans Paramètres.',
        code: 'NO_API_KEY' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!enhancedPrompt) {
      return new Response(JSON.stringify({ error: 'Échec de l\'amélioration du prompt' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      originalPrompt: prompt.trim(),
      enhancedPrompt: enhancedPrompt.trim(),
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
