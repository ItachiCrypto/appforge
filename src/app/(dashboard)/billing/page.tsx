"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2, ExternalLink, Sparkles } from 'lucide-react'
import { PLANS } from '@/lib/constants'

const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'TEAM'] as const

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<string>('FREE')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [hasByok, setHasByok] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load user data')
        return res.json()
      })
      .then(data => {
        setCurrentPlan(data.plan || 'FREE')
        setHasByok(data.hasOpenaiKey || data.hasAnthropicKey)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load billing information. Please refresh.')
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
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the{' '}
            <span className="font-semibold text-foreground">
              {PLANS[currentPlan as keyof typeof PLANS]?.name || 'Free'}
            </span>{' '}
            plan
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
              Manage Billing
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
                <p className="font-semibold">BYOK Discount Active!</p>
                <p className="text-sm text-muted-foreground">
                  You get 50% off because you're using your own API keys.
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
                  {plan.name}
                  {isCurrent && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </CardTitle>
                <div>
                  <span className="text-3xl font-bold">
                    ${price}
                  </span>
                  {planKey !== 'FREE' && (
                    <span className="text-muted-foreground">/mo</span>
                  )}
                  {hasByok && planKey !== 'FREE' && (
                    <span className="text-xs text-green-600 ml-2">
                      (50% off)
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
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
                    'Current Plan'
                  ) : planKey === 'FREE' ? (
                    'Free'
                  ) : (
                    'Upgrade'
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
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What is BYOK?</h4>
            <p className="text-sm text-muted-foreground">
              BYOK (Bring Your Own Key) means you can use your own OpenAI or Anthropic API keys. This gives you 50% off your subscription and full control over your AI costs.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What happens if I exceed my app limit?</h4>
            <p className="text-sm text-muted-foreground">
              You'll need to upgrade to a higher plan or archive some existing apps to create new ones.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
