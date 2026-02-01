'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Eye, EyeOff, Key, CreditCard, User, Shield, Loader2, Sparkles } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string | null
  plan: string
  openaiKey: boolean
  anthropicKey: boolean
}

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
  
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/user')
        if (res.ok) {
          const data = await res.json()
          setUserData(data)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
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
      }
    } catch (error) {
      console.error('Failed to save keys:', error)
    } finally {
      setSaving(false)
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
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
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
            API Keys (BYOK)
          </CardTitle>
          <CardDescription>
            Bring your own API keys and save 50% on your subscription! Your keys are encrypted and never logged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* BYOK Benefits Banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Why use BYOK?</p>
              <p className="text-sm text-muted-foreground">
                Use your own OpenAI API key to get unlimited AI generations at your own cost. No credits needed!
              </p>
            </div>
          </div>
          
          <ApiKeyInput
            label="OpenAI API Key"
            placeholder="sk-..."
            value={keys.openai}
            onChange={(v) => setKeys({ ...keys, openai: v })}
            hasExisting={userData?.openaiKey || false}
            show={showKeys.openai}
            onToggleShow={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
          />
          
          <ApiKeyInput
            label="Anthropic API Key"
            placeholder="sk-ant-..."
            value={keys.anthropic}
            onChange={(v) => setKeys({ ...keys, anthropic: v })}
            hasExisting={userData?.anthropicKey || false}
            show={showKeys.anthropic}
            onToggleShow={() => setShowKeys({ ...showKeys, anthropic: !showKeys.anthropic })}
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
              {saved ? 'Saved!' : 'Save API Keys'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Keys are encrypted with AES-256
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Billing Section */}
      <Card className="mb-6" id="billing">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing & Plan
          </CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted mb-6">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Current Plan</p>
                  <Badge variant={userData?.plan === 'FREE' ? 'secondary' : 'default'}>
                    {userData?.plan || 'FREE'}
                  </Badge>
                  {(userData?.openaiKey || userData?.anthropicKey) && (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      BYOK Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {userData?.plan === 'FREE' ? '3 apps, preview only' : 'Unlimited apps, deployments enabled'}
                </p>
              </div>
            </div>
            <Button>Upgrade Plan</Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <PlanCard
              name="Free"
              price="$0"
              features={['3 apps', 'Preview only', 'BYOK supported']}
              current={userData?.plan === 'FREE'}
            />
            <PlanCard
              name="Starter"
              price="$19"
              features={['10 apps', 'Deploy to web', 'Custom domains']}
              current={userData?.plan === 'STARTER'}
              highlighted
            />
            <PlanCard
              name="Pro"
              price="$49"
              features={['Unlimited apps', 'Analytics', 'Priority support']}
              current={userData?.plan === 'PRO'}
            />
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            💡 Get 50% off any plan when you use BYOK!
          </p>
        </CardContent>
      </Card>
      
      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Managed through Clerk - enable in your profile
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/user/security" target="_blank">Manage 2FA</a>
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">Delete Account</Button>
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
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  hasExisting: boolean
  show: boolean
  onToggleShow: () => void
}) {
  const hasValue = value.length > 0
  
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
        {label}
        {hasExisting && (
          <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs font-normal">
            <Check className="h-3 w-3 mr-1" /> Configured
          </Badge>
        )}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? 'text' : 'password'}
            placeholder={hasExisting ? 'Enter new key to replace...' : placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onToggleShow}
          disabled={!hasValue}
          title={hasValue ? (show ? 'Hide key' : 'Show key') : 'Type a key to preview'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      {hasExisting && !hasValue && (
        <p className="text-xs text-muted-foreground mt-1">
          Key is saved securely. Enter a new key to replace it.
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
        {price !== '$0' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
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
        <p className="text-xs text-primary mt-3 font-medium">Current plan</p>
      )}
    </div>
  )
}
