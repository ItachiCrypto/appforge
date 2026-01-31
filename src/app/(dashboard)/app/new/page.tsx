"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

const TEMPLATES = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'A beautiful landing page for your product or service',
    prompt: 'Create a modern landing page with a hero section, features grid, and call-to-action',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'An admin dashboard with charts and metrics',
    prompt: 'Create a dashboard with sidebar navigation, stat cards, and a data table',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase your work with a personal portfolio',
    prompt: 'Create a creative portfolio page with project gallery and about section',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'A product page for your online store',
    prompt: 'Create a product listing page with filters and product cards',
  },
]

export default function NewAppPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">App Name</label>
            <Input
              placeholder="My Awesome App"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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

      {/* Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Or start with a template</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {TEMPLATES.map((template) => (
            <Card 
              key={template.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setName(template.name)
                handleCreate(template.prompt)
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0 h-auto text-primary">
                  Use template
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
