'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Eye, EyeOff, Key, CreditCard, User, Shield, Loader2, Sparkles, Bot, Zap, Coins, TrendingUp } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string | null
  plan: string
  openaiKey: boolean
  anthropicKey: boolean
  creditBalance: number
}

interface ModelOption {
  value: string
  label: string
  description: string
  provider: 'anthropic' | 'openai'
}

const AI_MODELS: ModelOption[] = [
  // Anthropic
  { value: 'claude-opus-4', label: 'Claude Opus 4', description: 'Le plus puissant', provider: 'anthropic' },
  { value: 'claude-sonnet-4', label: 'Claude Sonnet 4', description: 'Meilleur équilibre', provider: 'anthropic' },
  { value: 'claude-haiku-3.5', label: 'Claude Haiku 3.5', description: 'Rapide et économique', provider: 'anthropic' },
  // OpenAI
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Rapide, intelligent', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Abordable', provider: 'openai' },
  { value: 'o1', label: 'o1', description: 'Raisonnement avancé', provider: 'openai' },
  { value: 'o1-mini', label: 'o1 Mini', description: 'Raisonnement rapide', provider: 'openai' },
]

export default function SettingsPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [keys, setKeys] = useState({
    openai: '',
    anthropic: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Model preferences
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4')
  const [savingModel, setSavingModel] = useState(false)
  const [modelSaved, setModelSaved] = useState(false)
  
  // API key status
  const [keyStatus, setKeyStatus] = useState<{
    openai: { configured: boolean; balance?: number; error?: string; checking?: boolean }
    anthropic: { configured: boolean; balance?: number; error?: string; checking?: boolean }
  }>({
    openai: { configured: false },
    anthropic: { configured: false },
  })
  
  const checkKeyBalances = async () => {
    setKeyStatus(prev => ({
      openai: { ...prev.openai, checking: true },
      anthropic: { ...prev.anthropic, checking: true },
    }))
    
    try {
      const res = await fetch('/api/keys/balance')
      if (res.ok) {
        const data = await res.json()
        setKeyStatus(data)
      }
    } catch (error) {
      console.error('Échec de la vérification des clés:', error)
    }
  }
  
  useEffect(() => {
    async function loadUser() {
      try {
        // Load user data and preferences in parallel
        const [userRes, prefsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/user/preferences'),
        ])
        
        if (userRes.ok) {
          const data = await userRes.json()
          setUserData(data)
          
          // Check key balances if user has keys
          if (data.openaiKey || data.anthropicKey) {
            checkKeyBalances()
          }
        }
        
        if (prefsRes.ok) {
          const prefs = await prefsRes.json()
          if (prefs.preferredModel) {
            setSelectedModel(prefs.preferredModel)
          }
        }
      } catch (error) {
        console.error('Échec du chargement utilisateur:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (isLoaded) {
      loadUser()
    }
  }, [isLoaded])
  
  const handleSaveKeys = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiKey: keys.openai || undefined,
          anthropicKey: keys.anthropic || undefined,
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setUserData(data)
        setKeys({ openai: '', anthropic: '' })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        
        // Re-check key balances after saving
        if (data.openaiKey || data.anthropicKey) {
          setTimeout(() => checkKeyBalances(), 500)
        }
      }
    } catch (error) {
      console.error('Échec de la sauvegarde des clés:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId)
    setSavingModel(true)
    
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredModel: modelId }),
      })
      
      if (res.ok) {
        setModelSaved(true)
        setTimeout(() => setModelSaved(false), 2000)
      }
    } catch (error) {
      console.error('Échec de la sauvegarde du modèle:', error)
    } finally {
      setSavingModel(false)
    }
  }
  
  if (!isLoaded || loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Paramètres</h1>
      
      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
          <CardDescription>Informations de ton compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom</label>
              <Input value={clerkUser?.fullName || userData?.name || ''} disabled />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input value={clerkUser?.primaryEmailAddress?.emailAddress || userData?.email || ''} disabled />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* API Keys Section */}
      <Card className="mb-6" id="api-keys">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Clés API (BYOK)
          </CardTitle>
          <CardDescription>
            Utilise tes propres clés API et économise 50% sur ton abonnement ! Tes clés sont chiffrées et jamais enregistrées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* BYOK Benefits Banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Pourquoi utiliser BYOK ?</p>
              <p className="text-sm text-muted-foreground">
                Utilise ta propre clé OpenAI pour des générations IA illimitées à ton propre coût. Pas de crédits nécessaires !
              </p>
            </div>
          </div>
          
          <ApiKeyInput
            label="Clé API OpenAI"
            placeholder="sk-..."
            value={keys.openai}
            onChange={(v) => setKeys({ ...keys, openai: v })}
            hasExisting={userData?.openaiKey || false}
            show={showKeys.openai}
            onToggleShow={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
            status={keyStatus.openai}
          />
          
          <ApiKeyInput
            label="Clé API Anthropic"
            placeholder="sk-ant-..."
            value={keys.anthropic}
            onChange={(v) => setKeys({ ...keys, anthropic: v })}
            hasExisting={userData?.anthropicKey || false}
            show={showKeys.anthropic}
            onToggleShow={() => setShowKeys({ ...showKeys, anthropic: !showKeys.anthropic })}
            status={keyStatus.anthropic}
          />
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSaveKeys} 
              disabled={saving || (!keys.openai && !keys.anthropic)}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : null}
              {saved ? 'Enregistré !' : 'Enregistrer les clés API'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Clés chiffrées en AES-256
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* AI Model Selection */}
      <Card className="mb-6" id="model">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Modèle IA
          </CardTitle>
          <CardDescription>
            Choisis le modèle IA pour la génération de code. Les modèles nécessitent la clé API correspondante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Anthropic Models */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center">
                  <span className="text-orange-500 text-xs font-bold">A</span>
                </div>
                <span className="font-medium">Anthropic (Claude)</span>
                {!userData?.anthropicKey && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Pas de clé API
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {AI_MODELS.filter(m => m.provider === 'anthropic').map(model => (
                  <ModelButton
                    key={model.value}
                    model={model}
                    selected={selectedModel === model.value}
                    disabled={!userData?.anthropicKey}
                    onClick={() => handleModelChange(model.value)}
                  />
                ))}
              </div>
            </div>
            
            {/* OpenAI Models */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-500 text-xs font-bold">O</span>
                </div>
                <span className="font-medium">OpenAI (GPT)</span>
                {!userData?.openaiKey && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Pas de clé API
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {AI_MODELS.filter(m => m.provider === 'openai').map(model => (
                  <ModelButton
                    key={model.value}
                    model={model}
                    selected={selectedModel === model.value}
                    disabled={!userData?.openaiKey}
                    onClick={() => handleModelChange(model.value)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {savingModel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </div>
          )}
          {modelSaved && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <Check className="h-4 w-4" />
              Préférence de modèle enregistrée !
            </div>
          )}
          
          {!userData?.openaiKey && !userData?.anthropicKey && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <Zap className="h-4 w-4 inline mr-1" />
                Ajoute une clé API ci-dessus pour débloquer la sélection de modèle IA.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Forge Credits Section */}
      <Card className="mb-6" id="credits">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Crédits Forge
          </CardTitle>
          <CardDescription>
            Les crédits sont utilisés quand tu n'as pas ta propre clé API, ou comme secours si ta clé est épuisée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Crédits disponibles</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{Math.floor(userData?.creditBalance || 0)}</span>
                <span className="text-muted-foreground">crédits</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ {((userData?.creditBalance || 0) / 100).toFixed(2)}€ de valeur
              </p>
            </div>
            <div className="text-right">
              <Button variant="outline" className="mb-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                Acheter des crédits
              </Button>
              <p className="text-xs text-muted-foreground">
                100 crédits = 1€
              </p>
            </div>
          </div>
          
          {/* Credit usage info */}
          <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">Bonus gratuit</p>
              <p className="text-muted-foreground">1000 crédits (10€) à l'inscription</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">Comment ça marche</p>
              <p className="text-muted-foreground">Utilisés par génération IA selon les tokens</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">Économise avec BYOK</p>
              <p className="text-muted-foreground">Tes clés API = 0 crédits utilisés</p>
            </div>
          </div>
          
          {(userData?.openaiKey || userData?.anthropicKey) && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4 inline mr-1" />
                BYOK Actif — Tes clés API sont utilisées en priorité. Les crédits servent de secours si ton quota est épuisé.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Billing Section */}
      <Card className="mb-6" id="billing">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Facturation & Plan
          </CardTitle>
          <CardDescription>Gère ton abonnement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted mb-6">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Plan actuel</p>
                  <Badge variant={userData?.plan === 'FREE' ? 'secondary' : 'default'}>
                    {userData?.plan || 'FREE'}
                  </Badge>
                  {(userData?.openaiKey || userData?.anthropicKey) && (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      BYOK Actif
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {userData?.plan === 'FREE' ? '3 apps, aperçu uniquement' : 'Apps illimitées, déploiements activés'}
                </p>
              </div>
            </div>
            <Button>Passer au supérieur</Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <PlanCard
              name="Gratuit"
              price="0€"
              features={['3 apps', 'Aperçu uniquement', 'BYOK supporté']}
              current={userData?.plan === 'FREE'}
            />
            <PlanCard
              name="Starter"
              price="19€"
              features={['10 apps', 'Déploiement web', 'Domaines personnalisés']}
              current={userData?.plan === 'STARTER'}
              highlighted
            />
            <PlanCard
              name="Pro"
              price="49€"
              features={['Apps illimitées', 'Analytics', 'Support prioritaire']}
              current={userData?.plan === 'PRO'}
            />
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            💡 Obtiens 50% de réduction sur tous les plans avec BYOK !
          </p>
        </CardContent>
      </Card>
      
      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>Gère la sécurité de ton compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Authentification à deux facteurs</p>
              <p className="text-sm text-muted-foreground">
                Gérée via Clerk - active-la dans ton profil
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/user/security" target="_blank">Gérer 2FA</a>
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-destructive">Supprimer le compte</p>
              <p className="text-sm text-muted-foreground">
                Supprime définitivement ton compte et toutes tes données
              </p>
            </div>
            <Button variant="destructive" size="sm">Supprimer le compte</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ApiKeyInput({
  label,
  placeholder,
  value,
  onChange,
  hasExisting,
  show,
  onToggleShow,
  status,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  hasExisting: boolean
  show: boolean
  onToggleShow: () => void
  status?: { configured: boolean; balance?: number; error?: string; checking?: boolean }
}) {
  const hasValue = value.length > 0
  
  // Determine status display
  const getStatusBadge = () => {
    if (!hasExisting || !status?.configured) return null
    
    if (status.checking) {
      return (
        <Badge variant="outline" className="text-muted-foreground border-muted text-xs font-normal">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Vérification...
        </Badge>
      )
    }
    
    if (status.error) {
      if (status.balance === 0) {
        return (
          <Badge variant="outline" className="text-red-500 border-red-500/30 text-xs font-normal">
            ⚠️ {status.error}
          </Badge>
        )
      }
      return (
        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs font-normal">
          ⚠️ {status.error}
        </Badge>
      )
    }
    
    if (status.balance === -1) {
      return (
        <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs font-normal">
          <Check className="h-3 w-3 mr-1" /> Valide
        </Badge>
      )
    }
    
    return (
      <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs font-normal">
        <Check className="h-3 w-3 mr-1" /> Configurée
      </Badge>
    )
  }
  
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
        {label}
        {getStatusBadge()}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? 'text' : 'password'}
            placeholder={hasExisting ? 'Entrer une nouvelle clé pour remplacer...' : placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onToggleShow}
          disabled={!hasValue}
          title={hasValue ? (show ? 'Cacher la clé' : 'Afficher la clé') : 'Tape une clé pour prévisualiser'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      {hasExisting && !hasValue && (
        <p className="text-xs text-muted-foreground mt-1">
          {status?.error 
            ? `Statut : ${status.error}. Entre une nouvelle clé pour remplacer.`
            : 'Clé sauvegardée en sécurité. Entre une nouvelle clé pour la remplacer.'}
        </p>
      )}
    </div>
  )
}

function PlanCard({
  name,
  price,
  features,
  current,
  highlighted,
}: {
  name: string
  price: string
  features: string[]
  current?: boolean
  highlighted?: boolean
}) {
  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        highlighted ? 'border-primary bg-primary/5' : ''
      } ${current ? 'ring-2 ring-primary' : ''}`}
    >
      <h4 className="font-medium">{name}</h4>
      <p className="text-2xl font-bold my-2">
        {price}
        {price !== '0€' && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
      </p>
      <ul className="text-sm text-muted-foreground space-y-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" />
            {f}
          </li>
        ))}
      </ul>
      {current && (
        <p className="text-xs text-primary mt-3 font-medium">Plan actuel</p>
      )}
    </div>
  )
}

function ModelButton({
  model,
  selected,
  disabled,
  onClick,
}: {
  model: ModelOption
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? 'border-primary bg-primary/10 ring-2 ring-primary'
          : disabled
          ? 'border-muted bg-muted/50 opacity-50 cursor-not-allowed'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{model.label}</span>
        {selected && <Check className="h-4 w-4 text-primary" />}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
    </button>
  )
}
