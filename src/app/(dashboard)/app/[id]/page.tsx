"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { 
  Sandpack, 
  SandpackPreview, 
  SandpackProvider,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react'
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
import { DEFAULT_APP_FILES } from '@/lib/constants'

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
  const [files, setFiles] = useState<Record<string, string>>(DEFAULT_APP_FILES)
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
          if (app.files && Object.keys(app.files).length > 0) {
            setFiles(app.files)
          }
          if (app.vercelUrl) {
            setDeployUrl(app.vercelUrl)
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

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        codeOutput: data.codeOutput,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update files if code was generated
      if (data.codeOutput?.files) {
        setFiles(prev => ({ ...prev, ...data.codeOutput.files }))
        
        // Save to backend
        await fetch(`/api/apps/${appId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: { ...files, ...data.codeOutput.files } }),
        })
      }
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
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
        <div>
          <h1 className="text-xl font-semibold">{appName}</h1>
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

        {/* Preview Panel */}
        <div className="bg-background border rounded-lg overflow-hidden">
          <SandpackProvider
            template="react"
            files={files}
            theme="auto"
            options={{
              externalResources: [
                "https://cdn.tailwindcss.com",
              ],
            }}
          >
            {showCode ? (
              <SandpackCodeEditor 
                style={{ height: '100%' }}
                showLineNumbers
                showTabs
              />
            ) : (
              <SandpackPreview 
                style={{ height: '100%' }}
                showNavigator={false}
                showRefreshButton
              />
            )}
          </SandpackProvider>
        </div>
      </div>
    </div>
  )
}
