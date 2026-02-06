"use client"

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sparkles,
  TrendingUp,
  Zap,
  Rocket,
  Crown,
  Target,
  Flame,
  Lightbulb,
  Wand2,
  PenLine,
  RefreshCw,
  FileText,
  Code,
  ListTodo,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SAAS_APPS,
  SAAS_TEMPLATES,
  SAAS_CATEGORIES,
  calculateYearlySavings,
  formatCurrency,
} from '@/lib/saas-data'

// Couleurs disponibles pour personnalisation
const COLORS = [
  { id: 'violet', name: 'Violet', gradient: 'from-violet-500 to-purple-600', ring: 'ring-violet-500' },
  { id: 'blue', name: 'Bleu', gradient: 'from-blue-500 to-cyan-500', ring: 'ring-blue-500' },
  { id: 'emerald', name: 'Émeraude', gradient: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-500' },
  { id: 'orange', name: 'Orange', gradient: 'from-orange-500 to-amber-500', ring: 'ring-orange-500' },
  { id: 'pink', name: 'Rose', gradient: 'from-pink-500 to-rose-500', ring: 'ring-pink-500' },
  { id: 'red', name: 'Rouge', gradient: 'from-red-500 to-orange-500', ring: 'ring-red-500' },
  { id: 'cyan', name: 'Cyan', gradient: 'from-cyan-500 to-blue-500', ring: 'ring-cyan-500' },
  { id: 'amber', name: 'Ambre', gradient: 'from-amber-500 to-yellow-500', ring: 'ring-amber-500' },
]

// Type de flow
type FlowType = 'saas' | 'custom' | null

// BMAD phases for custom flow
type BmadPhase = 'idea' | 'brief' | 'prd' | 'architecture' | 'epics' | 'customize'

// Stepper pour le flow BMAD
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
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10" />

      <div className="bg-background/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-1">
            {phases.map((phase, idx) => {
              const Icon = phase.icon
              const isActive = phase.id === currentPhase
              const isCompleted = idx < currentIndex

              return (
                <div key={phase.id} className="flex items-center">
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
                      idx < currentIndex
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : "bg-white/10"
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stepper pour SaaS flow (inchangé)
function SaaStepper({ currentStep, totalSavings }: { currentStep: number; totalSavings: number }) {
  const steps = [
    { num: 1, label: 'Sélection', icon: Target },
    { num: 2, label: 'Clone', icon: Zap },
    { num: 3, label: 'Création', icon: Rocket },
  ]

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10" />

      <div className="bg-background/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {steps.map((step, idx) => {
                const Icon = step.icon
                const isActive = currentStep === step.num
                const isCompleted = currentStep > step.num

                return (
                  <div key={step.num} className="flex items-center">
                    <div className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                      isActive && "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25",
                      isCompleted && "bg-emerald-500/20 text-emerald-400",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <Icon className={cn("w-4 h-4", isActive && "animate-pulse")} />
                      )}
                      <span className="font-medium text-sm hidden sm:block">{step.label}</span>
                    </div>

                    {idx < steps.length - 1 && (
                      <div className={cn(
                        "w-8 sm:w-16 h-0.5 mx-1 rounded-full transition-all duration-500",
                        currentStep > step.num
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : "bg-white/10"
                      )} />
                    )}
                  </div>
                )
              })}
            </div>

            {totalSavings > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full animate-in slide-in-from-right duration-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-400">{formatCurrency(totalSavings)}</span>
                <span className="text-emerald-400/70 text-sm">/an</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Header de page
function PageHeader({
  badge,
  badgeIcon: BadgeIcon,
  title,
  highlight,
  subtitle
}: {
  badge: string
  badgeIcon: React.ElementType
  title: string
  highlight: string
  subtitle: string
}) {
  return (
    <div className="text-center space-y-6 mb-12">
      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-full">
        <BadgeIcon className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-semibold text-violet-300">{badge}</span>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
        {title}{' '}
        <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {highlight}
        </span>
      </h1>

      <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  )
}

// Document viewer component with collapsible sections
function DocumentViewer({ 
  title, 
  icon: Icon, 
  content, 
  onRegenerate, 
  isRegenerating,
  defaultExpanded = true 
}: { 
  title: string
  icon: React.ElementType
  content: string
  onRegenerate?: () => void
  isRegenerating?: boolean
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-violet-400" />
          </div>
          <span className="font-semibold text-white">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-white/50" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/50" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="p-4 bg-black/20 border border-white/5 rounded-xl max-h-[400px] overflow-y-auto">
            <div className="text-white/80 text-sm leading-relaxed prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-3
              prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2
              prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1 prose-h3:text-violet-300
              prose-p:my-2 prose-ul:my-2 prose-li:my-0.5
              prose-strong:text-violet-300
              prose-code:text-pink-300 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded
              prose-table:text-sm
            ">
              {content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-xl font-bold mt-4 mb-3">{line.replace('# ', '')}</h1>
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-violet-300">{line.replace('### ', '')}</h3>
                }
                if (line.startsWith('- ')) {
                  return <p key={i} className="pl-4 my-1">• {line.replace('- ', '')}</p>
                }
                if (line.match(/^\d+\. /)) {
                  return <p key={i} className="pl-4 my-1">{line}</p>
                }
                if (line.startsWith('|')) {
                  return <p key={i} className="font-mono text-xs my-0.5 text-white/60">{line}</p>
                }
                if (line.startsWith('```')) {
                  return <p key={i} className="text-pink-300/50 text-xs">{line}</p>
                }
                if (line.trim() === '---') {
                  return <hr key={i} className="my-4 border-white/10" />
                }
                if (line.trim()) {
                  return <p key={i} className="my-2">{line}</p>
                }
                return null
              })}
            </div>
          </div>
          
          {onRegenerate && (
            <button
              onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
              disabled={isRegenerating}
              className="mt-3 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
              Régénérer
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Carte SaaS améliorée
function SaaSCard({
  saas,
  isSelected,
  onClick
}: {
  saas: typeof SAAS_APPS[0]
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative p-5 rounded-2xl text-left transition-all duration-300",
        "border-2 hover:scale-[1.02] hover:-translate-y-1",
        "bg-gradient-to-br from-white/5 to-white/[0.02]",
        isSelected
          ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20"
          : "border-white/10 hover:border-white/20 hover:bg-white/5"
      )}
    >
      <div className={cn(
        "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
        isSelected
          ? "bg-gradient-to-r from-violet-500 to-purple-500 scale-100"
          : "bg-white/10 scale-0 group-hover:scale-100"
      )}>
        <Check className={cn(
          "w-3.5 h-3.5 transition-colors",
          isSelected ? "text-white" : "text-white/50"
        )} />
      </div>

      <div className={cn(
        "text-3xl mb-3 transition-transform duration-300",
        "group-hover:scale-110 group-hover:rotate-3"
      )}>
        {saas.icon}
      </div>

      <h3 className="font-semibold text-white mb-1">{saas.name}</h3>

      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-violet-400">{formatCurrency(saas.monthlyPrice)}</span>
        <span className="text-sm text-muted-foreground">/mois</span>
      </div>

      <div className={cn(
        "absolute inset-x-3 -bottom-2 py-1.5 px-3 rounded-lg text-xs font-medium text-center transition-all duration-300",
        "bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white",
        "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
        isSelected && "opacity-100 translate-y-0"
      )}>
        {formatCurrency(calculateYearlySavings(saas.monthlyPrice))}/an économisés
      </div>
    </button>
  )
}

// Catégorie de SaaS
function SaaSCategory({
  category,
  saasApps,
  selectedSaas,
  onToggle
}: {
  category: typeof SAAS_CATEGORIES[0]
  saasApps: typeof SAAS_APPS
  selectedSaas: string[]
  onToggle: (id: string) => void
}) {
  const categorySaas = saasApps.filter(s => s.category === category.id)
  if (categorySaas.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
          <span className="text-xl">{category.icon}</span>
        </div>
        <div>
          <h3 className="font-semibold text-white">{category.name}</h3>
          <p className="text-xs text-muted-foreground">{categorySaas.length} outils disponibles</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categorySaas.map((saas) => (
          <SaaSCard
            key={saas.id}
            saas={saas}
            isSelected={selectedSaas.includes(saas.id)}
            onClick={() => onToggle(saas.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Bottom bar pour SaaS flow
function BottomBar({
  selectedCount,
  totalMonthlySavings,
  totalYearlySavings,
  onContinue,
  disabled
}: {
  selectedCount: number
  totalMonthlySavings: number
  totalYearlySavings: number
  onContinue: () => void
  disabled: boolean
}) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 transition-all duration-500",
      selectedCount > 0 ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="bg-background/80 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                    {selectedCount}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} SaaS sélectionné{selectedCount > 1 ? 's' : ''}
                  </p>
                  <p className="font-bold text-white">
                    {formatCurrency(totalMonthlySavings)}/mois gaspillés
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-10 w-px bg-white/10" />

              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Économies annuelles</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {formatCurrency(totalYearlySavings)}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={onContinue}
              disabled={disabled}
              className="w-full sm:w-auto min-w-[200px] h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-105"
            >
              <span>Récupérer mon argent</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewAppPage() {
  const router = useRouter()
  const [flowType, setFlowType] = useState<FlowType>(null)
  
  // Plan limit check
  const [checkingLimit, setCheckingLimit] = useState(true)
  const [limitReached, setLimitReached] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ current: number; max: number; plan: string } | null>(null)
  
  // SaaS flow state
  const [saasStep, setSaasStep] = useState(1)
  const [selectedSaas, setSelectedSaas] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  
  // BMAD Custom flow state
  const [bmadPhase, setBmadPhase] = useState<BmadPhase>('idea')
  const [customIdea, setCustomIdea] = useState('')
  const [bmadBrief, setBmadBrief] = useState('')
  const [bmadPrd, setBmadPrd] = useState('')
  const [bmadArchitecture, setBmadArchitecture] = useState('')
  const [bmadEpics, setBmadEpics] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [bmadError, setBmadError] = useState<string | null>(null)
  
  // Shared state
  const [appName, setAppName] = useState('')
  const [selectedColor, setSelectedColor] = useState('violet')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check plan limit on mount
  useEffect(() => {
    async function checkPlanLimit() {
      try {
        const [userRes, appsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/apps'),
        ])
        
        if (userRes.ok && appsRes.ok) {
          const user = await userRes.json()
          const apps = await appsRes.json()
          
          const plan = user.plan || 'FREE'
          const appCount = Array.isArray(apps) ? apps.length : 0
          
          // Plan limits
          const limits: Record<string, number> = {
            FREE: 3,
            STARTER: 10,
            PRO: -1, // unlimited
            TEAM: -1,
            ENTERPRISE: -1,
          }
          
          const maxApps = limits[plan] ?? 3
          
          setLimitInfo({
            current: appCount,
            max: maxApps,
            plan,
          })
          
          if (maxApps !== -1 && appCount >= maxApps) {
            setLimitReached(true)
          }
        }
      } catch (err) {
        console.error('Failed to check plan limit:', err)
      } finally {
        setCheckingLimit(false)
      }
    }
    
    checkPlanLimit()
  }, [])

  // Calculs SaaS
  const totalMonthlySavings = useMemo(() => {
    return selectedSaas.reduce((total, saasId) => {
      const saas = SAAS_APPS.find(s => s.id === saasId)
      return total + (saas?.monthlyPrice || 0)
    }, 0)
  }, [selectedSaas])

  const totalYearlySavings = calculateYearlySavings(totalMonthlySavings)

  const selectedSaasApps = useMemo(() => {
    return SAAS_APPS.filter(s => selectedSaas.includes(s.id))
  }, [selectedSaas])

  const selectedSaasForTemplate = useMemo(() => {
    return SAAS_APPS.find(s => s.id === selectedTemplate)
  }, [selectedTemplate])

  const templateData = selectedSaasForTemplate
    ? SAAS_TEMPLATES[selectedSaasForTemplate.templateId]
    : null

  const toggleSaas = (saasId: string) => {
    setSelectedSaas(prev =>
      prev.includes(saasId)
        ? prev.filter(id => id !== saasId)
        : [...prev, saasId]
    )
  }

  // BMAD API call
  const generateBmadDocument = async (phase: 'brief' | 'prd' | 'architecture' | 'epics') => {
    setIsGenerating(true)
    setBmadError(null)
    
    try {
      const body: Record<string, string> = { phase }
      
      switch (phase) {
        case 'brief':
          body.idea = customIdea
          break
        case 'prd':
          body.brief = bmadBrief
          break
        case 'architecture':
          body.prd = bmadPrd
          break
        case 'epics':
          body.prd = bmadPrd
          body.architecture = bmadArchitecture
          break
      }
      
      const res = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }
      
      // Store the document and advance to next phase
      switch (phase) {
        case 'brief':
          setBmadBrief(data.document)
          setBmadPhase('brief')
          break
        case 'prd':
          setBmadPrd(data.document)
          setBmadPhase('prd')
          break
        case 'architecture':
          setBmadArchitecture(data.document)
          setBmadPhase('architecture')
          break
        case 'epics':
          setBmadEpics(data.document)
          setBmadPhase('epics')
          break
      }
      
      return data.document
    } catch (err) {
      setBmadError(err instanceof Error ? err.message : 'Erreur inconnue')
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreate = async () => {
    const isCustomFlow = flowType === 'custom'
    
    if (!isCustomFlow && (!selectedSaasForTemplate || !templateData)) {
      setError("Erreur: template non trouvé. Retourne à l'étape 2.")
      return
    }
    
    if (isCustomFlow && !bmadBrief) {
      setError("Erreur: documents BMAD manquants.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build the initial prompt from BMAD documents
      const bmadContext = isCustomFlow ? `
# 📋 BMAD DOCUMENTATION

${bmadBrief}

---

${bmadPrd}

---

${bmadArchitecture}

---

${bmadEpics}

---

🚀 **INSTRUCTION**: Implémente cette application en suivant les documents BMAD ci-dessus.
Commence par l'Epic 1, Story 1.1. Crée l'architecture de fichiers définie.
Utilise localStorage pour la persistance. Design premium obligatoire.
` : ''

      const appData = isCustomFlow ? {
        name: appName || 'Mon App',
        description: customIdea.substring(0, 200),
        type: 'WEB',
        metadata: {
          primaryColor: selectedColor,
          customIdea: true,
          originalIdea: customIdea,
          bmad: {
            brief: bmadBrief,
            prd: bmadPrd,
            architecture: bmadArchitecture,
            epics: bmadEpics,
          },
        },
        initialPrompt: bmadContext,
      } : {
        name: appName || `Mon ${templateData!.name}`,
        description: templateData!.description,
        type: 'WEB',
        metadata: {
          replacedSaas: selectedTemplate,
          replacedSaasName: selectedSaasForTemplate!.name,
          monthlySavings: selectedSaasForTemplate!.monthlyPrice,
          primaryColor: selectedColor,
          allReplacedSaas: selectedSaas,
        },
        initialPrompt: templateData!.prompt,
      }

      console.log('[Wizard/BMAD] Creating app:', {
        name: appData.name,
        isCustom: isCustomFlow,
        hasBmad: !!appData.metadata?.bmad,
      })

      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      })

      if (!res.ok) {
        let errorData: { error?: string } = {}
        try {
          errorData = await res.json()
        } catch (parseErr) {
          console.error('[Wizard] Failed to parse error response:', parseErr)
        }
        throw new Error(errorData?.error || `Erreur serveur ${res.status}`)
      }

      let app: { id?: string } | null = null
      try {
        app = await res.json()
      } catch (parseErr) {
        console.error('[Wizard] Failed to parse success response:', parseErr)
        throw new Error('Réponse invalide du serveur')
      }

      if (!app || !app.id) {
        throw new Error('App créée mais ID manquant')
      }

      router.push(`/app/${app.id}`)
    } catch (err) {
      console.error('[Wizard] Create app error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  // Reset to flow selection
  const resetFlow = () => {
    setFlowType(null)
    setSaasStep(1)
    setBmadPhase('idea')
    setSelectedSaas([])
    setSelectedTemplate(null)
    setCustomIdea('')
    setBmadBrief('')
    setBmadPrd('')
    setBmadArchitecture('')
    setBmadEpics('')
    setAppName('')
    setError(null)
    setBmadError(null)
  }

  // Show loading while checking plan limit
  if (checkingLimit) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-muted-foreground">Vérification de ton plan...</p>
        </div>
      </div>
    )
  }

  // Show upgrade prompt if limit reached
  if (limitReached && limitInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Limite atteinte
            </h2>
            <p className="text-muted-foreground mb-6">
              Tu as atteint la limite de <span className="text-white font-semibold">{limitInfo.max} apps</span> de ton plan {limitInfo.plan}.
              <br />
              <span className="text-sm">({limitInfo.current}/{limitInfo.max} apps créées)</span>
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/settings#billing')}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Passer au plan supérieur
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Retour au dashboard
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-6">
              💡 Le plan Starter permet 10 apps, Pro illimité
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Steppers */}
      {flowType === 'custom' && <BmadStepper currentPhase={bmadPhase} />}
      {flowType === 'saas' && <SaaStepper currentStep={saasStep} totalSavings={totalYearlySavings} />}

      <div className="max-w-5xl mx-auto px-6 py-12 pb-32">
        
        {/* ============ FLOW SELECTION ============ */}
        {!flowType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Nouvelle App"
              badgeIcon={Sparkles}
              title="Comment veux-tu"
              highlight="créer ton app ?"
              subtitle="Clone un SaaS existant ou laisse l'IA planifier ton projet"
            />

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Option 1: Clone SaaS */}
              <button
                onClick={() => setFlowType('saas')}
                className="group relative p-8 rounded-3xl text-left transition-all duration-300 border-2 border-white/10 hover:border-violet-500/50 bg-gradient-to-br from-white/5 to-white/[0.02] hover:bg-violet-500/5 hover:scale-[1.02]"
              >
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                
                <div className="text-5xl mb-4">💸</div>
                <h3 className="text-xl font-bold text-white mb-2">Remplacer un SaaS</h3>
                <p className="text-muted-foreground mb-4">
                  Clone Notion, Trello, ou d'autres apps et économise des centaines d'euros par an
                </p>
                
                <div className="flex items-center gap-2 text-sm text-violet-400 group-hover:text-violet-300">
                  <span>Commencer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: BMAD Custom Flow */}
              <button
                onClick={() => setFlowType('custom')}
                className="group relative p-8 rounded-3xl text-left transition-all duration-300 border-2 border-white/10 hover:border-pink-500/50 bg-gradient-to-br from-white/5 to-white/[0.02] hover:bg-pink-500/5 hover:scale-[1.02]"
              >
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-pink-400" />
                </div>
                
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-xl font-bold text-white mb-2">Ma propre idée</h3>
                <p className="text-muted-foreground mb-4">
                  Méthode BMAD : l'IA crée Brief → PRD → Architecture → Stories, puis code ton app
                </p>
                
                <div className="flex items-center gap-2 text-sm text-pink-400 group-hover:text-pink-300">
                  <span>Planifier & Créer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ============ BMAD CUSTOM FLOW ============ */}
        
        {/* BMAD Phase 1: Idée */}
        {flowType === 'custom' && bmadPhase === 'idea' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Phase 1/6 - Ton idée"
              badgeIcon={Lightbulb}
              title="Décris ton"
              highlight="app de rêve"
              subtitle="L'IA va créer une documentation complète (Brief, PRD, Architecture, Stories)"
            />

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <PenLine className="w-4 h-4" />
                    Ton idée d'application
                  </label>
                  <textarea
                    value={customIdea}
                    onChange={(e) => setCustomIdea(e.target.value)}
                    placeholder="Ex: une app de gestion de budget avec des graphiques, un tracker de dépenses par catégorie, des objectifs d'épargne..."
                    rows={5}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {customIdea.length} caractères • Plus tu es précis, meilleur sera le résultat
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-white/50">Exemples pour t'inspirer :</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Un tracker d'habitudes avec streaks et statistiques",
                      "Un gestionnaire de projets style Notion simplifié",
                      "Une app de méditation avec timer et sons",
                      "Un tableau Kanban pour gérer mes tâches",
                      "Un journal personnel avec tags et recherche",
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setCustomIdea(example)}
                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {bmadError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {bmadError}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={resetFlow} className="hover:bg-white/5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button
                  size="lg"
                  onClick={() => generateBmadDocument('brief')}
                  disabled={customIdea.length < 10 || isGenerating}
                  className="min-w-[200px] bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 shadow-lg shadow-violet-500/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Génération du Brief...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Générer le Brief
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* BMAD Phase 2: Brief Review */}
        {flowType === 'custom' && bmadPhase === 'brief' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Phase 2/6 - Product Brief"
              badgeIcon={FileText}
              title="Voici ton"
              highlight="Product Brief ✨"
              subtitle="Ce document définit la vision stratégique de ton app"
            />

            <div className="max-w-3xl mx-auto space-y-6">
              <DocumentViewer
                title="Product Brief"
                icon={FileText}
                content={bmadBrief}
                onRegenerate={() => generateBmadDocument('brief')}
                isRegenerating={isGenerating}
              />

              {bmadError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {bmadError}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setBmadPhase('idea')} className="hover:bg-white/5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Modifier l'idée
                </Button>
                <Button
                  size="lg"
                  onClick={() => generateBmadDocument('prd')}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Génération du PRD...
                    </>
                  ) : (
                    <>
                      Générer le PRD
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* BMAD Phase 3: PRD Review */}
        {flowType === 'custom' && bmadPhase === 'prd' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Phase 3/6 - PRD"
              badgeIcon={Target}
              title="Product Requirements"
              highlight="Document 📋"
              subtitle="Fonctionnalités détaillées, user stories, et critères d'acceptation"
            />

            <div className="max-w-3xl mx-auto space-y-6">
              <DocumentViewer
                title="Product Brief"
                icon={FileText}
                content={bmadBrief}
                defaultExpanded={false}
              />
              
              <DocumentViewer
                title="PRD - Product Requirements Document"
                icon={Target}
                content={bmadPrd}
                onRegenerate={() => generateBmadDocument('prd')}
                isRegenerating={isGenerating}
              />

              {bmadError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {bmadError}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setBmadPhase('brief')} className="hover:bg-white/5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au Brief
                </Button>
                <Button
                  size="lg"
                  onClick={() => generateBmadDocument('architecture')}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Génération Architecture...
                    </>
                  ) : (
                    <>
                      Générer l'Architecture
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* BMAD Phase 4: Architecture Review */}
        {flowType === 'custom' && bmadPhase === 'architecture' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Phase 4/6 - Architecture"
              badgeIcon={Code}
              title="Architecture"
              highlight="Technique 🏗️"
              subtitle="Stack, structure des fichiers, patterns, et décisions techniques (ADRs)"
            />

            <div className="max-w-3xl mx-auto space-y-6">
              <DocumentViewer
                title="PRD"
                icon={Target}
                content={bmadPrd}
                defaultExpanded={false}
              />
              
              <DocumentViewer
                title="Architecture Technique"
                icon={Code}
                content={bmadArchitecture}
                onRegenerate={() => generateBmadDocument('architecture')}
                isRegenerating={isGenerating}
              />

              {bmadError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {bmadError}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setBmadPhase('prd')} className="hover:bg-white/5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au PRD
                </Button>
                <Button
                  size="lg"
                  onClick={() => generateBmadDocument('epics')}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Génération Stories...
                    </>
                  ) : (
                    <>
                      Générer les Stories
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* BMAD Phase 5: Epics & Stories Review */}
        {flowType === 'custom' && bmadPhase === 'epics' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Phase 5/6 - Epics & Stories"
              badgeIcon={ListTodo}
              title="Plan"
              highlight="d'Implémentation 📋"
              subtitle="Epics, stories, et ordre de développement"
            />

            <div className="max-w-3xl mx-auto space-y-6">
              <DocumentViewer
                title="Architecture"
                icon={Code}
                content={bmadArchitecture}
                defaultExpanded={false}
              />
              
              <DocumentViewer
                title="Epics & Stories"
                icon={ListTodo}
                content={bmadEpics}
                onRegenerate={() => generateBmadDocument('epics')}
                isRegenerating={isGenerating}
              />

              {bmadError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {bmadError}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setBmadPhase('architecture')} className="hover:bg-white/5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'Architecture
                </Button>
                <Button
                  size="lg"
                  onClick={() => setBmadPhase('customize')}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                >
                  Personnaliser & Créer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* BMAD Phase 6: Customize & Create */}
        {flowType === 'custom' && bmadPhase === 'customize' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Phase 6/6 - Création"
              badgeIcon={Rocket}
              title="Dernière touche"
              highlight="personnelle ✨"
              subtitle="Choisis un nom et une couleur, puis l'IA code ton app"
            />

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-8">
                {/* Recap des docs BMAD */}
                <div className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <h4 className="font-semibold text-white">Documentation BMAD complète</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span>Product Brief</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span>PRD</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span>Architecture</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span>Epics & Stories</span>
                    </div>
                  </div>
                </div>

                {/* Nom de l'app */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70">Nom de ton app</label>
                  <Input
                    placeholder="Mon App Géniale"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="h-14 text-lg bg-white/5 border-white/10 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                  />
                </div>

                {/* Couleur principale */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70">Couleur principale</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={cn(
                          "w-14 h-14 rounded-xl bg-gradient-to-br transition-all duration-300",
                          color.gradient,
                          selectedColor === color.id
                            ? `ring-4 ring-offset-4 ring-offset-[#0a0a0f] ${color.ring} scale-110`
                            : "hover:scale-110 hover:ring-2 hover:ring-white/20"
                        )}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-semibold text-white">Prêt à créer</h4>
                  </div>
                  <p className="text-sm text-white/70">
                    L'IA va générer ton application complète en suivant les 4 documents BMAD.
                    Elle commencera par l'Epic 1, Story 1.1, puis avancera progressivement.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setBmadPhase('epics')} className="hover:bg-white/5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button
                  size="lg"
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="min-w-[220px] h-14 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50 hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Créer mon app
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============ SAAS FLOW (unchanged) ============ */}

        {/* SAAS ÉTAPE 1: Sélection des SaaS */}
        {flowType === 'saas' && saasStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Étape 1/3 - Sélection"
              badgeIcon={Target}
              title="Quels SaaS veux-tu"
              highlight="abandonner ?"
              subtitle="Sélectionne les abonnements que tu paies actuellement. On va te montrer combien tu peux économiser."
            />

            <button
              onClick={resetFlow}
              className="mb-6 flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Changer de méthode
            </button>

            <div className="space-y-10">
              {SAAS_CATEGORIES.map((category) => (
                <SaaSCategory
                  key={category.id}
                  category={category}
                  saasApps={SAAS_APPS}
                  selectedSaas={selectedSaas}
                  onToggle={toggleSaas}
                />
              ))}
            </div>

            <BottomBar
              selectedCount={selectedSaas.length}
              totalMonthlySavings={totalMonthlySavings}
              totalYearlySavings={totalYearlySavings}
              onContinue={() => setSaasStep(2)}
              disabled={selectedSaas.length === 0}
            />
          </div>
        )}

        {/* SAAS ÉTAPE 2: Choix du template */}
        {flowType === 'saas' && saasStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Étape 2/3 - Clone"
              badgeIcon={Zap}
              title="Choisis ton premier"
              highlight="clone"
              subtitle="On va créer une app qui fait la même chose que le SaaS que tu paies. Sauf qu'elle sera à toi. Pour toujours."
            />

            <div className="space-y-4 mb-8">
              {selectedSaasApps.map((saas) => {
                const template = SAAS_TEMPLATES[saas.templateId]
                const isSelected = selectedTemplate === saas.id
                const yearlySaving = calculateYearlySavings(saas.monthlyPrice)

                return (
                  <button
                    key={saas.id}
                    onClick={() => setSelectedTemplate(saas.id)}
                    className={cn(
                      "w-full relative p-6 rounded-2xl text-left transition-all duration-300",
                      "border-2 hover:scale-[1.01]",
                      "bg-gradient-to-br from-white/5 to-white/[0.02]",
                      isSelected
                        ? "border-violet-500 bg-violet-500/10 shadow-xl shadow-violet-500/20"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "text-5xl p-4 rounded-2xl transition-all",
                          isSelected
                            ? "bg-gradient-to-br from-violet-500/30 to-purple-500/30"
                            : "bg-white/5"
                        )}>
                          {saas.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-white">
                              Remplacer {saas.name}
                            </h3>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground">
                            {template?.description || saas.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          +{formatCurrency(yearlySaving)}
                        </div>
                        <div className="text-sm text-muted-foreground">économisés/an</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setSaasStep(1)}
                className="hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button
                size="lg"
                onClick={() => setSaasStep(3)}
                disabled={!selectedTemplate}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
              >
                Personnaliser
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* SAAS ÉTAPE 3: Personnalisation */}
        {flowType === 'saas' && saasStep === 3 && selectedSaasForTemplate && templateData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Étape 3/3 - Création"
              badgeIcon={Sparkles}
              title="Personnalise en"
              highlight="30 secondes"
              subtitle="Juste un nom et une couleur. L'IA s'occupe du reste."
            />

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-8">
                {/* Transformation visuelle */}
                <div className="flex items-center justify-center gap-4 p-5 bg-black/30 rounded-2xl">
                  <div className="flex items-center gap-3 px-5 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <span className="text-2xl">{selectedSaasForTemplate.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-red-400 line-through">{selectedSaasForTemplate.name}</p>
                      <p className="text-sm text-red-400/60">{formatCurrency(selectedSaasForTemplate.monthlyPrice)}/mois</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                    <ArrowRight className="w-5 h-5 text-white/50" />
                  </div>

                  <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <span className="text-2xl">✨</span>
                    <div className="text-left">
                      <p className="font-medium text-emerald-400">Ton app</p>
                      <p className="text-sm text-emerald-400 font-bold">0€/mois</p>
                    </div>
                  </div>
                </div>

                {/* Nom de l'app */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70">Nom de ton app</label>
                  <Input
                    placeholder={`Mon ${templateData.name}`}
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="h-14 text-lg bg-white/5 border-white/10 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                  />
                </div>

                {/* Couleur principale */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70">Couleur principale</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={cn(
                          "w-14 h-14 rounded-xl bg-gradient-to-br transition-all duration-300",
                          color.gradient,
                          selectedColor === color.id
                            ? `ring-4 ring-offset-4 ring-offset-[#0a0a0f] ${color.ring} scale-110`
                            : "hover:scale-110 hover:ring-2 hover:ring-white/20"
                        )}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Économies futures */}
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h4 className="font-semibold text-white">Tes économies avec cette app</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[1, 5, 10].map((years) => (
                      <div key={years} className="p-4 bg-black/20 rounded-xl">
                        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          {formatCurrency(calculateYearlySavings(selectedSaasForTemplate.monthlyPrice) * years)}
                        </div>
                        <div className="text-sm text-muted-foreground">{years} an{years > 1 ? 's' : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={() => setSaasStep(2)}
                  className="hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button
                  size="lg"
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="min-w-[220px] h-14 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50 hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Créer mon app
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
