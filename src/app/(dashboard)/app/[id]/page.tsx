"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  Rocket, 
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Preview, AppTypeIcon, getAppTypeLabel, DEFAULT_FILES, normalizeFilesForSandpack, type AppType } from '@/components/preview'
import { 
  ModeToggle, 
  ExpertLayout, 
  NormalLayout, 
  ChatPanel,
  useEditorStore,
  type Message 
} from '@/components/editor'

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

export default function AppEditorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const appId = params.id as string
  const initialPrompt = searchParams.get('prompt')
  
  // Editor mode from store
  const { mode } = useEditorStore()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [appType, setAppType] = useState<AppType>('WEB')
  const [files, setFiles] = useState<Record<string, string>>(DEFAULT_FILES.WEB)
  const [appName, setAppName] = useState('My App')
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  
  const hasInitialized = useRef(false)

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

    // Create placeholder for streaming response
    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
    }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          // Enable AI tools for on-demand file access (reduces token usage ~70%)
          enableTools: true,
          // Still send currentFiles for: 1) fallback mode 2) preview sync
          currentFiles: files,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        const errorMessage = data.error || 'Failed to send message'
        const actionHint = getErrorActionHint(errorMessage)
        
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: `⚠️ ${errorMessage}${actionHint ? `\n\n${actionHint}` : ''}` }
            : m
        ))
        return
      }

      // Handle streaming response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let codeOutput: { files: Record<string, string> } | null = null

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim()
              if (!jsonStr) continue
              
              try {
                // Attempt to sanitize common JSON issues before parsing
                let sanitizedJson = jsonStr
                
                // Handle truncated unicode escapes that can crash JSON.parse
                // This regex finds \u followed by less than 4 hex chars
                sanitizedJson = sanitizedJson.replace(
                  /\\u([0-9a-fA-F]{0,3})(?![0-9a-fA-F])/g,
                  (_, hex) => hex.length === 0 ? '\\\\u' : `\\u${hex.padStart(4, '0')}`
                )
                
                const data = JSON.parse(sanitizedJson)
                
                if (data.type === 'chunk') {
                  fullContent += data.content
                  setMessages(prev => prev.map(m => 
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  ))
                } else if (data.type === 'done') {
                  codeOutput = data.codeOutput
                  setMessages(prev => prev.map(m => 
                    m.id === assistantId ? { ...m, codeOutput: data.codeOutput } : m
                  ))
                } else if (data.type === 'error') {
                  const actionHint = getErrorActionHint(data.error)
                  setMessages(prev => prev.map(m => 
                    m.id === assistantId 
                      ? { ...m, content: `⚠️ ${data.error}${actionHint ? `\n\n${actionHint}` : ''}` }
                      : m
                  ))
                }
              } catch (parseError) {
                // Log but don't crash - incomplete chunks are normal during streaming
                if (jsonStr.length > 10) {
                  console.debug('SSE parse skip (may be incomplete chunk):', 
                    parseError instanceof Error ? parseError.message : 'Unknown error'
                  )
                }
              }
            }
          }
        }
      }

      // Update files if code was generated
      if (codeOutput?.files) {
        const normalizedFiles = normalizeFilesForSandpack(codeOutput.files)
        
        setFiles(prev => {
          const updated = { ...prev, ...normalizedFiles }
          
          fetch(`/api/apps/${appId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: updated }),
          }).catch(err => console.error('Failed to save files:', err))
          
          return updated
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      let displayMessage = `⚠️ Connection error: ${errorMessage}`
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        displayMessage = '⚠️ Request timed out. Please try again.'
      } else if (errorMessage.includes('Failed to fetch')) {
        displayMessage = '⚠️ Network error. Check your connection.'
      }
      
      setMessages(prev => prev.map(m => 
        m.id === assistantId ? { ...m, content: displayMessage } : m
      ))
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

  // Handle file changes from code editor
  const handleFileChange = useCallback((path: string, content: string) => {
    setFiles(prev => {
      const updated = { ...prev, [path]: content }
      
      // Debounced save to API
      fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: updated }),
      }).catch(err => console.error('Failed to save files:', err))
      
      return updated
    })
  }, [appId])

  // Reset files to default template
  const handleResetFiles = useCallback(() => {
    const defaultFiles = DEFAULT_FILES[appType] || DEFAULT_FILES.WEB
    setFiles(defaultFiles)
    
    // Save to API
    fetch(`/api/apps/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: defaultFiles }),
    }).catch(err => console.error('Failed to reset files:', err))
  }, [appId, appType])

  // Preview component (used in both modes)
  const previewComponent = (
    <Preview 
      key={JSON.stringify(files)}
      files={files}
      appType={appType}
      showCode={false}
      onResetFiles={handleResetFiles}
    />
  )

  // Chat component (used in both modes)
  const chatComponent = (
    <ChatPanel
      messages={messages}
      input={input}
      isLoading={isLoading}
      onInputChange={setInput}
      onSend={() => handleSend()}
      compact={mode === 'expert'}
    />
  )

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
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <ModeToggle />
          
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

      {/* Main Content - Conditional Layout */}
      <div className="flex-1 min-h-0 bg-background border rounded-lg overflow-hidden">
        {mode === 'expert' ? (
          <ExpertLayout
            files={files}
            onFileChange={handleFileChange}
            previewComponent={previewComponent}
            chatComponent={chatComponent}
          />
        ) : (
          <NormalLayout
            previewComponent={previewComponent}
            chatComponent={chatComponent}
          />
        )}
      </div>
    </div>
  )
}
