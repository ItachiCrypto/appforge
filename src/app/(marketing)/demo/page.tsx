"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, ArrowLeft, Lightbulb, FileText, Target, Code, ListTodo, Rocket, Wand2, Check, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
                  isActive && "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25",
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
                  <span className="font-medium text-xs hidden sm:block">{phase.label}</span>
                </div>
                {idx < phases.length - 1 && (
                  <div className={cn(
                    "w-4 sm:w-8 h-0.5 mx-0.5 rounded-full transition-all duration-500",
                    idx < currentIndex ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-white/10"
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
  const getMockBrief = () => `# Product Brief: ${appName || idea.slice(0, 30) || 'Mon App'}

## 🎯 Vision
${idea || 'Votre application idéale'}.

## 🎪 Public Cible
- Utilisateurs cherchant une solution moderne
- Professionnels voulant gagner du temps
- Équipes souhaitant collaborer efficacement

## 💡 Proposition de Valeur
- Simplicité d'utilisation exceptionnelle
- Performance et rapidité
- Design élégant et intuitif
- Données sécurisées en local

## 🏆 Objectifs Business
1. Remplacer les solutions coûteuses existantes
2. Offrir une expérience utilisateur premium
3. Permettre une personnalisation totale`

  const getMockPrd = () => `# PRD - Product Requirements Document

## 📋 Fonctionnalités Principales

### Feature 1: Interface Utilisateur
- Dashboard intuitif
- Navigation fluide
- Thème sombre par défaut

### Feature 2: Gestion des Données
- Création, édition, suppression
- Recherche et filtres
- Export des données

## 👤 User Stories

**US-1**: En tant qu'utilisateur, je peux créer un nouvel élément rapidement
- Critère: Formulaire simple et validation instantanée

**US-2**: En tant qu'utilisateur, je peux organiser mes éléments par catégorie
- Critère: Drag & drop et tags

**US-3**: En tant qu'utilisateur, je peux voir mes statistiques
- Critère: Graphiques et métriques clés`

  const getMockArch = () => `# Architecture Technique

## 🛠️ Stack Technologique
- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State**: Zustand (léger et performant)
- **Storage**: localStorage (données locales)
- **Icons**: Lucide React

## 📁 Structure des Fichiers
\`\`\`
src/
├── components/
│   ├── ui/           # Composants shadcn
│   ├── layout/       # Header, Sidebar
│   └── features/     # Composants métier
├── lib/
│   ├── store.ts      # State Zustand
│   └── utils.ts      # Helpers
└── app/
    └── page.tsx      # Page principale
\`\`\`

## 🔧 Patterns
- Composition over inheritance
- Custom hooks pour la logique
- Optimistic updates`

  const getMockEpics = () => `# Epics & Stories

## Epic 1: Foundation (Setup)
- **Story 1.1**: Initialiser la structure du projet
- **Story 1.2**: Configurer le store Zustand
- **Story 1.3**: Créer les composants UI de base

## Epic 2: Core Features
- **Story 2.1**: Implémenter le dashboard principal
- **Story 2.2**: Créer le formulaire d'ajout
- **Story 2.3**: Ajouter la liste avec filtres

## Epic 3: Polish
- **Story 3.1**: Animations et transitions
- **Story 3.2**: Responsive design
- **Story 3.3**: Dark/Light mode

## 📊 Estimation
- Total: ~15 stories
- Durée estimée: 2-3 heures de génération AI`

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

  const renderMarkdown = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-xl font-bold mt-4 mb-2 text-white">{line.replace('# ', '')}</h1>
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-lg font-semibold mt-4 mb-2 text-violet-300">{line.replace('## ', '')}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-base font-medium mt-3 mb-1 text-pink-300">{line.replace('### ', '')}</h3>
      }
      if (line.startsWith('- ')) {
        return <p key={i} className="pl-4 my-1 text-white/80">• {line.replace('- ', '')}</p>
      }
      if (line.match(/^\d+\./)) {
        return <p key={i} className="pl-4 my-1 text-white/80">{line}</p>
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-white my-2">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.startsWith('```')) {
        return <p key={i} className="text-pink-400/50 text-xs font-mono">{line}</p>
      }
      if (line.trim()) {
        return <p key={i} className="my-1.5 text-white/70">{line}</p>
      }
      return null
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 py-3 text-center">
        <span className="text-amber-200 text-sm font-medium">
          🔬 <strong>Mode Démo</strong> — Les données ne sont pas sauvegardées.{' '}
          <Link href="/sign-up" className="underline hover:text-white transition-colors">
            Créer un compte gratuit
          </Link>{' '}
          pour utiliser AppForge.
        </span>
      </div>

      {/* Stepper */}
      {phase !== 'complete' && <BmadStepper currentPhase={phase} />}

      <div className="max-w-3xl mx-auto px-6 py-12">
        
        {/* Phase: Idea */}
        {phase === 'idea' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="phase-idea">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-violet-500/20 border border-pink-500/30 rounded-full">
                <Wand2 className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-semibold text-pink-300">Ma propre idée</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white">
                Décris ton{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400">
                  app de rêve
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                L'IA va créer une documentation complète : Brief → PRD → Architecture → Stories
              </p>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
              <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Ton idée d'application
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ex: une app de gestion de budget avec des graphiques, un tracker de dépenses par catégorie, des objectifs d'épargne..."
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all resize-none"
                data-testid="idea-input"
              />
              <p className="text-xs text-muted-foreground">
                {idea.length} caractères • Minimum 10 caractères requis
              </p>

              {/* Examples */}
              <div className="pt-2 space-y-2">
                <p className="text-xs text-white/40">Exemples pour t'inspirer :</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Un tracker d'habitudes avec streaks",
                    "Un gestionnaire de projets Kanban",
                    "Un journal personnel avec tags",
                    "Une app de méditation avec timer",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setIdea(example)}
                      className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleNextPhase}
                disabled={idea.length < 10 || isGenerating}
                className="min-w-[200px] bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="phase-brief">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Voici ton Product Brief ✨</h2>
              <p className="text-muted-foreground">Ce document définit la vision stratégique de ton app</p>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
              <div data-testid="brief-document">
                {renderMarkdown(getMockBrief())}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack} className="hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Modifier l'idée
              </Button>
              <Button 
                size="lg" 
                onClick={handleNextPhase} 
                disabled={isGenerating}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="generate-prd-btn"
              >
                {isGenerating ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : null}
                Générer le PRD
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Phase: PRD */}
        {phase === 'prd' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="phase-prd">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Product Requirements Document 📋</h2>
              <p className="text-muted-foreground">Fonctionnalités et user stories détaillées</p>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
              <div data-testid="prd-document">
                {renderMarkdown(getMockPrd())}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack} className="hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                size="lg" 
                onClick={handleNextPhase} 
                disabled={isGenerating}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="generate-arch-btn"
              >
                {isGenerating ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : null}
                Générer l'Architecture
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Architecture */}
        {phase === 'architecture' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="phase-architecture">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Architecture Technique 🏗️</h2>
              <p className="text-muted-foreground">Stack, structure et patterns de développement</p>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
              <div data-testid="arch-document">
                {renderMarkdown(getMockArch())}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack} className="hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                size="lg" 
                onClick={handleNextPhase} 
                disabled={isGenerating}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="generate-epics-btn"
              >
                {isGenerating ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : null}
                Générer les Stories
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Epics */}
        {phase === 'epics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="phase-epics">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Epics & Stories 📋</h2>
              <p className="text-muted-foreground">Plan d'implémentation détaillé</p>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
              <div data-testid="epics-document">
                {renderMarkdown(getMockEpics())}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack} className="hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                size="lg" 
                onClick={handleNextPhase}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="customize-btn"
              >
                Personnaliser & Créer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Customize */}
        {phase === 'customize' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="phase-customize">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Dernière touche personnelle ✨</h2>
              <p className="text-muted-foreground">Choisis un nom et l'IA code ton app</p>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70">Nom de ton app</label>
                <Input
                  placeholder="Mon App Géniale"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="h-14 text-lg bg-white/5 border-white/10 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                  data-testid="app-name-input"
                />
              </div>
              
              {/* BMAD Summary */}
              <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold text-white">Documentation BMAD complète</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4" /> Product Brief
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4" /> PRD
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4" /> Architecture
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4" /> Epics & Stories
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleGoBack} className="hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                size="lg" 
                onClick={handleNextPhase}
                className="min-w-[180px] bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
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
          <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-500" data-testid="phase-complete">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-emerald-400" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white">Flow BMAD Terminé ! 🎉</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                En mode réel, ton app <strong className="text-white">{appName || 'géniale'}</strong> serait maintenant en cours de génération par l'IA.
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl max-w-md mx-auto">
              <p className="text-sm text-white/70 mb-4">
                Prêt à créer de vraies applications avec AppForge ?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPhase('idea')
                    setIdea('')
                    setAppName('')
                  }} 
                  data-testid="restart-btn"
                  className="border-white/20 hover:bg-white/5"
                >
                  Recommencer la démo
                </Button>
                <Button 
                  asChild 
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  <Link href="/sign-up">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Créer un compte gratuit
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
