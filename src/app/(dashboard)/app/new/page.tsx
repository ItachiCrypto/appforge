"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowRight, Loader2, AlertCircle, Globe, Smartphone, Monitor, Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_TYPES, TEMPLATES_BY_TYPE, type AppTypeId } from '@/lib/constants'

const ICONS: Record<string, React.ElementType> = {
  Globe,
  Smartphone,
  Monitor,
  Server,
}

// App types with icons for the selector
const appTypes = APP_TYPES.map(t => ({
  id: t.id,
  name: t.name,
  desc: t.description,
  icon: ICONS[t.icon] || Globe,
}))

// Default templates (WEB type)
const TEMPLATES = TEMPLATES_BY_TYPE.WEB

export default function NewAppPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [appType, setAppType] = useState<AppTypeId>('WEB')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get templates for the selected app type
  const templates = TEMPLATES_BY_TYPE[appType] || []

  const handleCreate = async (initialPrompt?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'New App',
          description: description || initialPrompt,
          type: appType,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create app')
      }
      
      const app = await res.json()
      
      // Redirect to app editor with initial prompt if provided
      const url = initialPrompt 
        ? `/app/${app.id}?prompt=${encodeURIComponent(initialPrompt)}`
        : `/app/${app.id}`
      
      router.push(url)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to create app. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create New App</h1>
        <p className="text-muted-foreground mt-1">
          Start from scratch or choose a template
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Give your app a name and describe what you want to build
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">App Name</label>
            <Input
              placeholder="My Awesome App"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          {/* App Type Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">App Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {APP_TYPES.map((type) => {
                const Icon = ICONS[type.icon] || Globe
                const isSelected = appType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAppType(type.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all overflow-hidden",
                      "hover:border-primary/50 hover:bg-primary/5",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border bg-background"
                    )}
                  >
                    {/* Gradient accent on selected */}
                    {isSelected && (
                      <div className={cn(
                        "absolute inset-0 opacity-10 bg-gradient-to-br",
                        type.color
                      )} />
                    )}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br text-white",
                      type.color
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium relative z-10",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {type.name}
                    </span>
                    <span className="text-xs text-muted-foreground text-center relative z-10">
                      {type.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              What do you want to build?
            </label>
            <Textarea
              placeholder="Describe your app... e.g., A recipe app with a search feature and saved favorites"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => handleCreate(description)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Start Building
          </Button>
        </CardContent>
      </Card>

      {/* Templates for selected type */}
      {templates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Or start with a template
            <span className="text-sm font-normal text-muted-foreground ml-2">
              for {APP_TYPES.find(t => t.id === appType)?.name}
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card 
                key={template.id}
                className="cursor-pointer hover:border-primary transition-colors group"
                onClick={() => {
                  setName(template.name)
                  handleCreate(template.prompt)
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto text-primary">
                    Use template
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
