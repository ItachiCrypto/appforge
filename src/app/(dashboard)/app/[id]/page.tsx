"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Rocket, 
  Code, 
  Eye,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Preview, AppTypeIcon, getAppTypeLabel, DEFAULT_FILES, normalizeFilesForSandpack, type AppType } from '@/components/preview'

// Helper to provide actionable guidance for common errors
function getErrorActionHint(errorMessage: string): string | null {
  const lowerError = errorMessage.toLowerCase()
  
  if (lowerError.includes('api key') || lowerError.includes('apikey')) {
    return '💡 **Action:** Go to Settings → API Keys and add your OpenAI or Anthropic API key.'
  }
  if (lowerError.includes('unauthorized') || lowerError.includes('401')) {
    return '💡 **Action:** Please sign in again to continue.'
  }
  if (lowerError.includes('rate limit') || lowerError.includes('429')) {
    return '💡 **Action:** Too many requests. Please wait a moment and try again.'
  }
  if (lowerError.includes('quota') || lowerError.includes('billing') || lowerError.includes('credit balance')) {
    if (lowerError.includes('anthropic')) {
      return '💡 **Action:** Your Anthropic account is out of credits. Add credits at console.anthropic.com/settings/billing or switch to OpenAI in Settings.'
    }
    return '💡 **Action:** Your API account may have run out of credits. Check your billing (Anthropic: console.anthropic.com | OpenAI: platform.openai.com).'
  }
  if (lowerError.includes('invalid') && lowerError.includes('key')) {
    return '💡 **Action:** Your API key appears to be invalid. Please check it in Settings → API Keys.'
  }
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return '💡 **Action:** The request took too long. Try a shorter prompt or try again.'
  }
  
  return null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  codeOutput?: { files: Record<string, string> }
}

export default function AppEditorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const appId = params.id as string
  const initialPrompt = searchParams.get('prompt')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [appType, setAppType] = useState<AppType>('WEB')
  const [files, setFiles] = useState<Record<string, string>>(DEFAULT_FILES.WEB)
  const [showCode, setShowCode] = useState(false)
  const [appName, setAppName] = useState('My App')
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load app data and handle initial prompt
  useEffect(() => {
    const loadApp = async () => {
      try {
        const res = await fetch(`/api/apps/${appId}`)
        if (res.ok) {
          const app = await res.json()
          setAppName(app.name)
          
          // Set app type (WEB, IOS, ANDROID, DESKTOP, API)
          const type = (app.type as AppType) || 'WEB'
          setAppType(type)
          
          // Use app files or default for the type
          if (app.files && Object.keys(app.files).length > 0) {
            // Normalize files to .js for Sandpack compatibility (in case DB has .tsx)
            setFiles(normalizeFilesForSandpack(app.files))
          } else {
            setFiles(DEFAULT_FILES[type] || DEFAULT_FILES.WEB)
          }
          
          if (app.vercelUrl) {
            setDeployUrl(app.vercelUrl)
          }
          
          // Load conversation history if it exists
          if (app.conversation?.messages && app.conversation.messages.length > 0) {
            const loadedMessages: Message[] = app.conversation.messages.map((msg: { id: string; role: string; content: string; codeOutput?: unknown }) => ({
              id: msg.id,
              role: msg.role.toLowerCase() as 'user' | 'assistant',
              content: msg.content,
              codeOutput: msg.codeOutput as { files: Record<string, string> } | undefined,
            }))
            setMessages(loadedMessages)
            hasInitialized.current = true // Don't process initial prompt if we have history
          }
        }
      } catch (error) {
        console.error('Failed to load app:', error)
      }
    }
    
    loadApp()
  }, [appId])

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt && !hasInitialized.current) {
      hasInitialized.current = true
      handleSend(initialPrompt)
    }
  }, [initialPrompt])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Show actual API error message to user
        const errorMessage = data.error || 'Failed to send message'
        const actionHint = getErrorActionHint(errorMessage)
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ ${errorMessage}${actionHint ? `\n\n${actionHint}` : ''}`,
        }])
        return
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        codeOutput: data.codeOutput,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update files if code was generated
      if (data.codeOutput?.files) {
        // Normalize files: convert .tsx/.ts to .js for Sandpack compatibility
        const normalizedFiles = normalizeFilesForSandpack(data.codeOutput.files)
        
        setFiles(prev => {
          const updated = { ...prev, ...normalizedFiles }
          
          // Save to backend (async, don't await)
          fetch(`/api/apps/${appId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: updated }),
          }).catch(err => console.error('Failed to save files:', err))
          
          return updated
        })
      }
    } catch (error) {
      console.error(error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Connection error: ${errorMessage}\n\nPlease check your internet connection and try again.`,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      })
      
      const data = await res.json()
      
      if (data.url) {
        setDeployUrl(data.url)
      }
    } catch (error) {
      console.error('Deploy failed:', error)
    } finally {
      setIsDeploying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AppTypeIcon type={appType} className="w-5 h-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">{appName}</h1>
            <p className="text-xs text-muted-foreground">{getAppTypeLabel(appType)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? <Eye className="w-4 h-4 mr-2" /> : <Code className="w-4 h-4 mr-2" />}
            {showCode ? 'Preview' : 'Code'}
          </Button>
          
          {deployUrl ? (
            <Button size="sm" variant="outline" asChild>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </a>
            </Button>
          ) : null}
          
          <Button size="sm" onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4 mr-2" />
            )}
            Deploy
          </Button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Chat Panel */}
        <div className="flex flex-col bg-background border rounded-lg overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Start a conversation</p>
                  <p className="text-sm">Describe what you want to build</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-fade-in-up",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    {message.role === 'user' ? (
                      <>
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback>
                          {user?.firstName?.[0] || 'U'}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sparkles className="w-4 h-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      message.role === 'user' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.codeOutput && (
                      <p className="text-xs mt-2 opacity-70">
                        ✨ Code updated - check the preview!
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full typing-dot" />
                      <span className="w-2 h-2 bg-current rounded-full typing-dot" />
                      <span className="w-2 h-2 bg-current rounded-full typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Describe what you want to change..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Panel - key forces re-render when files change */}
        <div className="bg-background border rounded-lg overflow-hidden">
          <Preview 
            key={JSON.stringify(files)}
            files={files}
            appType={appType}
            showCode={showCode}
          />
        </div>
      </div>
    </div>
  )
}
