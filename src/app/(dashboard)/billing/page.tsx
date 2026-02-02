"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2, ExternalLink, Sparkles } from 'lucide-react'
import { PLANS } from '@/lib/constants'

const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'TEAM'] as const

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Gratuit',
  STARTER: 'Starter',
  PRO: 'Pro',
  TEAM: 'Team',
}

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ['3 apps', 'Aperçu uniquement', 'Support communautaire'],
  STARTER: ['10 apps', 'Déploiement sur Vercel', 'Domaines personnalisés', 'Support email'],
  PRO: ['Apps illimitées', 'Déploiement sur Vercel', 'Domaines personnalisés', 'Analytics', 'Support prioritaire'],
  TEAM: ['Tout de Pro', '5 membres d\'équipe', 'Collaboration', 'Projets partagés', 'Dashboard admin'],
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<string>('FREE')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [hasByok, setHasByok] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user')
      .then(res => {
        if (!res.ok) throw new Error('Échec du chargement des données')
        return res.json()
      })
      .then(data => {
        setCurrentPlan(data.plan || 'FREE')
        setHasByok(data.hasOpenaiKey || data.hasAnthropicKey)
      })
      .catch(err => {
        console.error(err)
        setError('Impossible de charger les informations de facturation. Actualise la page.')
      })
      .finally(() => setPageLoading(false))
  }, [])

  const handleUpgrade = async (plan: string) => {
    if (plan === 'FREE') return
    
    setIsLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      
      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setIsLoading('manage')
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      
      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(null)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des informations de facturation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Facturation</h1>
        <p className="text-muted-foreground mt-1">
          Gère ton abonnement et ta facturation
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plan actuel</CardTitle>
          <CardDescription>
            Tu es actuellement sur le plan{' '}
            <span className="font-semibold text-foreground">
              {PLAN_NAMES[currentPlan] || 'Gratuit'}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan !== 'FREE' && (
            <Button variant="outline" onClick={handleManageBilling}>
              {isLoading === 'manage' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Gérer la facturation
            </Button>
          )}
        </CardContent>
      </Card>

      {/* BYOK Discount Banner */}
      {hasByok && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Réduction BYOK Active !</p>
                <p className="text-sm text-muted-foreground">
                  Tu as 50% de réduction parce que tu utilises tes propres clés API.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLAN_ORDER.map((planKey) => {
          const plan = PLANS[planKey]
          const isCurrent = currentPlan === planKey
          const price = hasByok && planKey !== 'FREE' 
            ? plan.price * 0.5 
            : plan.price

          return (
            <Card 
              key={planKey}
              className={isCurrent ? 'ring-2 ring-primary' : ''}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {PLAN_NAMES[planKey]}
                  {isCurrent && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Actuel
                    </span>
                  )}
                </CardTitle>
                <div>
                  <span className="text-3xl font-bold">
                    {price}€
                  </span>
                  {planKey !== 'FREE' && (
                    <span className="text-muted-foreground">/mois</span>
                  )}
                  {hasByok && planKey !== 'FREE' && (
                    <span className="text-xs text-green-600 ml-2">
                      (50% de réduction)
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {PLAN_FEATURES[planKey].map((feature) => (
                    <li key={feature} className="text-sm flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || isLoading !== null}
                  onClick={() => handleUpgrade(planKey)}
                >
                  {isLoading === planKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    'Plan actuel'
                  ) : planKey === 'FREE' ? (
                    'Gratuit'
                  ) : (
                    'Passer au supérieur'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Questions fréquentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Je peux annuler à tout moment ?</h4>
            <p className="text-sm text-muted-foreground">
              Oui, tu peux annuler ton abonnement à tout moment. Tu garderas l'accès jusqu'à la fin de ta période de facturation.
            </p>
          </div>
          <div>
            <h4 className="font-medium">C'est quoi BYOK ?</h4>
            <p className="text-sm text-muted-foreground">
              BYOK (Bring Your Own Key) signifie que tu peux utiliser tes propres clés API OpenAI ou Anthropic. Ça te donne 50% de réduction sur ton abonnement et un contrôle total sur tes coûts IA.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Que se passe-t-il si je dépasse ma limite d'apps ?</h4>
            <p className="text-sm text-muted-foreground">
              Tu devras passer au plan supérieur ou archiver certaines apps existantes pour en créer de nouvelles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
