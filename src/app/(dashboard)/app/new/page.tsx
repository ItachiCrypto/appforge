"use client"

import { useState, useMemo } from 'react'
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

// Stepper amélioré
function Stepper({ currentStep, totalSavings, flowType }: { currentStep: number; totalSavings: number; flowType: FlowType }) {
  const saasSteps = [
    { num: 1, label: 'Sélection', icon: Target },
    { num: 2, label: 'Clone', icon: Zap },
    { num: 3, label: 'Création', icon: Rocket },
  ]
  
  const customSteps = [
    { num: 1, label: 'Ton idée', icon: Lightbulb },
    { num: 2, label: 'Magie IA', icon: Wand2 },
    { num: 3, label: 'Création', icon: Rocket },
  ]
  
  const steps = flowType === 'custom' ? customSteps : saasSteps

  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10" />

      <div className="bg-background/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Steps */}
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

            {/* Économies badge (only for SaaS flow) */}
            {flowType === 'saas' && totalSavings > 0 && (
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
      {/* Selection indicator */}
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

      {/* Icon */}
      <div className={cn(
        "text-3xl mb-3 transition-transform duration-300",
        "group-hover:scale-110 group-hover:rotate-3"
      )}>
        {saas.icon}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-white mb-1">{saas.name}</h3>

      {/* Price */}
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-violet-400">{formatCurrency(saas.monthlyPrice)}</span>
        <span className="text-sm text-muted-foreground">/mois</span>
      </div>

      {/* Yearly savings on hover */}
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

// Bottom bar avec CTA
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
  const [step, setStep] = useState(1)
  
  // SaaS flow state
  const [selectedSaas, setSelectedSaas] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  
  // Custom flow state
  const [customPrompt, setCustomPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  
  // Shared state
  const [appName, setAppName] = useState('')
  const [selectedColor, setSelectedColor] = useState('violet')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculs
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

  // Enhance prompt with AI
  const handleEnhancePrompt = async () => {
    if (!customPrompt.trim() || customPrompt.length < 3) return
    
    setIsEnhancing(true)
    setEnhanceError(null)
    
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'amélioration')
      }
      
      setEnhancedPrompt(data.enhancedPrompt)
      setStep(2) // Move to enhanced prompt view
    } catch (err) {
      setEnhanceError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleCreate = async () => {
    const isCustomFlow = flowType === 'custom'
    
    if (!isCustomFlow && (!selectedSaasForTemplate || !templateData)) {
      setError("Erreur: template non trouvé. Retourne à l'étape 2.")
      return
    }
    
    if (isCustomFlow && !enhancedPrompt) {
      setError("Erreur: prompt non amélioré. Retourne à l'étape 1.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const appData = isCustomFlow ? {
        name: appName || 'Mon App',
        description: customPrompt.substring(0, 200),
        type: 'WEB',
        metadata: {
          primaryColor: selectedColor,
          customIdea: true,
          originalPrompt: customPrompt,
        },
        initialPrompt: enhancedPrompt,
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

      console.log('[Wizard] Creating app:', {
        name: appData.name,
        isCustom: isCustomFlow,
        hasPrompt: !!appData.initialPrompt,
        promptLength: appData.initialPrompt?.length,
      })

      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      })

      console.log('[Wizard] API response status:', res.status)

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
        console.error('[Wizard] Invalid app response:', app)
        throw new Error('App créée mais ID manquant')
      }

      console.log('[Wizard] App created:', app.id)
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
    setStep(1)
    setSelectedSaas([])
    setSelectedTemplate(null)
    setCustomPrompt('')
    setEnhancedPrompt('')
    setAppName('')
    setError(null)
    setEnhanceError(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Stepper (only show after flow selection) */}
      {flowType && <Stepper currentStep={step} totalSavings={totalYearlySavings} flowType={flowType} />}

      <div className="max-w-5xl mx-auto px-6 py-12 pb-32">
        
        {/* ÉTAPE 0: Choix du flow */}
        {!flowType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Nouvelle App"
              badgeIcon={Sparkles}
              title="Comment veux-tu"
              highlight="créer ton app ?"
              subtitle="Clone un SaaS existant ou laisse libre cours à ton imagination"
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

              {/* Option 2: Custom Idea */}
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
                  Décris ton app en quelques mots, l'IA améliore ton idée et la construit pour toi
                </p>
                
                <div className="flex items-center gap-2 text-sm text-pink-400 group-hover:text-pink-300">
                  <span>Créer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ============ CUSTOM FLOW ============ */}
        
        {/* CUSTOM STEP 1: Écrire son idée */}
        {flowType === 'custom' && step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Étape 1/3 - Ton idée"
              badgeIcon={Lightbulb}
              title="Décris ton"
              highlight="app de rêve"
              subtitle="Pas besoin d'être précis, l'IA va améliorer ton idée"
            />

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-6">
                {/* Textarea */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <PenLine className="w-4 h-4" />
                    Ton idée d'application
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ex: une app de gestion de budget avec des graphiques, un tracker de dépenses par catégorie..."
                    rows={5}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {customPrompt.length} caractères • Minimum 10 recommandé
                  </p>
                </div>

                {/* Exemples d'idées */}
                <div className="space-y-3">
                  <p className="text-sm text-white/50">Exemples pour t'inspirer :</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Un tracker d'habitudes avec streaks",
                      "Un portfolio interactif",
                      "Un gestionnaire de mots de passe",
                      "Une app de méditation",
                      "Un tableau Kanban personnel",
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setCustomPrompt(example)}
                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {enhanceError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {enhanceError}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={resetFlow}
                  className="hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button
                  size="lg"
                  onClick={handleEnhancePrompt}
                  disabled={customPrompt.length < 3 || isEnhancing}
                  className="min-w-[200px] bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 shadow-lg shadow-violet-500/25"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      L'IA réfléchit...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Améliorer avec l'IA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM STEP 2: Voir le prompt amélioré */}
        {flowType === 'custom' && step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Étape 2/3 - Magie IA"
              badgeIcon={Wand2}
              title="Voici ton idée"
              highlight="améliorée ✨"
              subtitle="L'IA a enrichi ton concept avec des détails design et fonctionnels"
            />

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-6">
                {/* Original prompt */}
                <div className="space-y-2">
                  <p className="text-sm text-white/50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white/30" />
                    Ton idée originale
                  </p>
                  <p className="text-white/70 text-sm italic pl-4 border-l-2 border-white/10">
                    "{customPrompt}"
                  </p>
                </div>

                {/* Enhanced prompt */}
                <div className="space-y-3">
                  <p className="text-sm text-white/70 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Version améliorée par l'IA
                  </p>
                  <div className="p-5 bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-xl">
                    <p className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                      {enhancedPrompt}
                    </p>
                  </div>
                </div>

                {/* Regenerate button */}
                <button
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing}
                  className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <RefreshCw className={cn("w-4 h-4", isEnhancing && "animate-spin")} />
                  Régénérer une autre version
                </button>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Modifier mon idée
                </Button>
                <Button
                  size="lg"
                  onClick={() => setStep(3)}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                >
                  Personnaliser
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM STEP 3: Personnalisation (name + color) */}
        {flowType === 'custom' && step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Étape 3/3 - Création"
              badgeIcon={Sparkles}
              title="Dernière touche"
              highlight="personnelle"
              subtitle="Choisis un nom et une couleur pour ton app"
            />

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-8">
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

                {/* Recap */}
                <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-semibold text-white">Prêt à créer</h4>
                  </div>
                  <p className="text-sm text-white/70">
                    L'IA va générer ton application complète avec design premium, animations, et persistance locale.
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
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

        {/* ============ SAAS FLOW ============ */}

        {/* SAAS ÉTAPE 1: Sélection des SaaS */}
        {flowType === 'saas' && step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
              badge="Étape 1/3 - Sélection"
              badgeIcon={Target}
              title="Quels SaaS veux-tu"
              highlight="abandonner ?"
              subtitle="Sélectionne les abonnements que tu paies actuellement. On va te montrer combien tu peux économiser."
            />

            {/* Back to flow selection */}
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
              onContinue={() => setStep(2)}
              disabled={selectedSaas.length === 0}
            />
          </div>
        )}

        {/* SAAS ÉTAPE 2: Choix du template */}
        {flowType === 'saas' && step === 2 && (
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
                onClick={() => setStep(1)}
                className="hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button
                size="lg"
                onClick={() => setStep(3)}
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
        {flowType === 'saas' && step === 3 && selectedSaasForTemplate && templateData && (
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

              {/* Message d'erreur */}
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation et CTA */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
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
