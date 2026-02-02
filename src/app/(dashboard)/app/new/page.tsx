"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Check, 
  Sparkles,
  Skull,
  TrendingUp,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  SAAS_APPS, 
  SAAS_TEMPLATES, 
  SAAS_CATEGORIES,
  calculateYearlySavings,
  formatCurrency,
  type SaaSApp 
} from '@/lib/saas-data'

// Couleurs disponibles pour personnalisation
const COLORS = [
  { id: 'violet', name: 'Violet', class: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 'blue', name: 'Bleu', class: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'emerald', name: 'Émeraude', class: 'bg-emerald-500', hex: '#10b981' },
  { id: 'orange', name: 'Orange', class: 'bg-orange-500', hex: '#f97316' },
  { id: 'pink', name: 'Rose', class: 'bg-pink-500', hex: '#ec4899' },
  { id: 'red', name: 'Rouge', class: 'bg-red-500', hex: '#ef4444' },
  { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500', hex: '#06b6d4' },
  { id: 'amber', name: 'Ambre', class: 'bg-amber-500', hex: '#f59e0b' },
]

export default function NewAppPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedSaas, setSelectedSaas] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [appName, setAppName] = useState('')
  const [selectedColor, setSelectedColor] = useState('violet')
  const [isLoading, setIsLoading] = useState(false)

  // Calcul des économies totales
  const totalMonthlySavings = useMemo(() => {
    return selectedSaas.reduce((total, saasId) => {
      const saas = SAAS_APPS.find(s => s.id === saasId)
      return total + (saas?.monthlyPrice || 0)
    }, 0)
  }, [selectedSaas])

  const totalYearlySavings = calculateYearlySavings(totalMonthlySavings)

  // SaaS sélectionnés
  const selectedSaasApps = useMemo(() => {
    return SAAS_APPS.filter(s => selectedSaas.includes(s.id))
  }, [selectedSaas])

  // Template sélectionné
  const selectedSaasForTemplate = useMemo(() => {
    return SAAS_APPS.find(s => s.id === selectedTemplate)
  }, [selectedTemplate])

  const templateData = selectedSaasForTemplate 
    ? SAAS_TEMPLATES[selectedSaasForTemplate.templateId]
    : null

  // Toggle SaaS selection
  const toggleSaas = (saasId: string) => {
    setSelectedSaas(prev => 
      prev.includes(saasId) 
        ? prev.filter(id => id !== saasId)
        : [...prev, saasId]
    )
  }

  // Création de l'app
  const [error, setError] = useState<string | null>(null)
  
  const handleCreate = async () => {
    if (!selectedSaasForTemplate || !templateData) {
      setError("Erreur: template non trouvé. Retourne à l'étape 2.")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: appName || `Mon ${templateData.name}`,
          description: templateData.description,
          type: 'WEB',
          // Métadonnées pour le tracking des économies
          metadata: {
            replacedSaas: selectedTemplate,
            replacedSaasName: selectedSaasForTemplate.name,
            monthlySavings: selectedSaasForTemplate.monthlyPrice,
            primaryColor: selectedColor,
            allReplacedSaas: selectedSaas,
          }
        }),
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erreur ${res.status}`)
      }
      
      const app = await res.json()
      
      // Rediriger vers l'éditeur avec le prompt du template
      router.push(`/app/${app.id}?prompt=${encodeURIComponent(templateData.prompt)}`)
    } catch (err) {
      console.error('Create app error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/30">
      {/* Progress indicator */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    step >= s 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={cn(
                      "w-12 h-0.5 mx-2 transition-all",
                      step > s ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Économies en temps réel */}
            {totalYearlySavings > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">{formatCurrency(totalYearlySavings)}/an</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ÉTAPE 1: Sélection des SaaS */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Skull className="w-4 h-4" />
                Étape 1/3
              </div>
              <h1 className="text-4xl font-bold">
                Quels SaaS veux-tu{' '}
                <span className="text-primary">abandonner</span> ?
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Sélectionne les abonnements que tu paies actuellement. 
                On va te montrer combien tu peux économiser.
              </p>
            </div>

            {/* Grille par catégories */}
            <div className="space-y-8">
              {SAAS_CATEGORIES.map((category) => {
                const categorySaas = SAAS_APPS.filter(s => s.category === category.id)
                if (categorySaas.length === 0) return null

                return (
                  <div key={category.id}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {categorySaas.map((saas) => {
                        const isSelected = selectedSaas.includes(saas.id)
                        return (
                          <button
                            key={saas.id}
                            onClick={() => toggleSaas(saas.id)}
                            className={cn(
                              "relative p-4 rounded-xl border-2 text-left transition-all",
                              "hover:border-primary/50 hover:bg-muted/50",
                              isSelected 
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                : "border-border"
                            )}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                            <div className="text-2xl mb-2">{saas.icon}</div>
                            <div className="font-medium">{saas.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(saas.monthlyPrice)}/mois
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Résumé et CTA */}
            <Card className={cn(
              "transition-all",
              selectedSaas.length > 0 ? "border-primary" : ""
            )}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    {selectedSaas.length === 0 ? (
                      <p className="text-muted-foreground">
                        Sélectionne au moins un SaaS pour continuer
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedSaas.length} SaaS sélectionné{selectedSaas.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600">
                          Tu paies {formatCurrency(totalYearlySavings)}/an
                        </p>
                        <p className="text-sm text-muted-foreground">
                          C'est {formatCurrency(totalMonthlySavings)} par mois qui s'évaporent
                        </p>
                      </div>
                    )}
                  </div>
                  <Button 
                    size="lg" 
                    onClick={() => setStep(2)}
                    disabled={selectedSaas.length === 0}
                    className="min-w-[200px]"
                  >
                    Récupérer mon argent
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ÉTAPE 2: Choix du template */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                Étape 2/3
              </div>
              <h1 className="text-4xl font-bold">
                Choisis ton premier{' '}
                <span className="text-primary">clone</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                On va créer une app qui fait la même chose que le SaaS que tu paies.
                Sauf qu'elle sera à toi. Pour toujours.
              </p>
            </div>

            {/* Liste des SaaS sélectionnés comme options de clonage */}
            <div className="grid gap-4">
              {selectedSaasApps.map((saas) => {
                const template = SAAS_TEMPLATES[saas.templateId]
                const isSelected = selectedTemplate === saas.id
                const yearlySaving = calculateYearlySavings(saas.monthlyPrice)

                return (
                  <button
                    key={saas.id}
                    onClick={() => setSelectedTemplate(saas.id)}
                    className={cn(
                      "relative p-6 rounded-xl border-2 text-left transition-all",
                      "hover:border-primary/50",
                      isSelected 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{saas.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold">
                              Remplacer {saas.name}
                            </h3>
                            {isSelected && (
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-1">
                            {template?.description || saas.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-emerald-600">
                          +{formatCurrency(yearlySaving)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          économisés/an
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                size="lg" 
                onClick={() => setStep(3)}
                disabled={!selectedTemplate}
              >
                Personnaliser
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Personnalisation */}
        {step === 3 && selectedSaasForTemplate && templateData && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Étape 3/3
              </div>
              <h1 className="text-4xl font-bold">
                Personnalise en{' '}
                <span className="text-primary">30 secondes</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Juste un nom et une couleur. L'IA s'occupe du reste.
              </p>
            </div>

            <Card>
              <CardContent className="p-8 space-y-8">
                {/* Aperçu du SaaS remplacé */}
                <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg line-through opacity-60">
                    <span className="text-xl">{selectedSaasForTemplate.icon}</span>
                    <span>{selectedSaasForTemplate.name}</span>
                    <span className="font-semibold">{formatCurrency(selectedSaasForTemplate.monthlyPrice)}/mois</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-lg font-medium">
                    <span className="text-xl">✨</span>
                    <span>Ton app</span>
                    <span className="font-semibold">0€/mois</span>
                  </div>
                </div>

                {/* Nom de l'app */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Nom de ton app</label>
                  <Input
                    placeholder={`Mon ${templateData.name}`}
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>

                {/* Couleur principale */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Couleur principale</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={cn(
                          "w-12 h-12 rounded-xl transition-all",
                          color.class,
                          selectedColor === color.id 
                            ? "ring-4 ring-offset-2 ring-offset-background ring-primary scale-110" 
                            : "hover:scale-105"
                        )}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Économies futures */}
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
                  <h4 className="font-semibold text-lg mb-4">💰 Tes économies avec cette app</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(calculateYearlySavings(selectedSaasForTemplate.monthlyPrice))}
                      </div>
                      <div className="text-sm text-muted-foreground">1 an</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(calculateYearlySavings(selectedSaasForTemplate.monthlyPrice) * 5)}
                      </div>
                      <div className="text-sm text-muted-foreground">5 ans</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(calculateYearlySavings(selectedSaasForTemplate.monthlyPrice) * 10)}
                      </div>
                      <div className="text-sm text-muted-foreground">10 ans</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message d'erreur */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Navigation et CTA */}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                size="lg" 
                onClick={handleCreate}
                disabled={isLoading}
                className="min-w-[200px] bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Créer mon app
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
