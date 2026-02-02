"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Rocket, 
  ExternalLink,
  PiggyBank,
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
import { formatCurrency, SAAS_APPS } from '@/lib/saas-data'

// Type for tool call tracking (BUG FIX #1 & #4)
export interface ToolCallState {
  id: string
  name: string
  status: 'running' | 'success' | 'error'
  arguments?: Record<string, unknown>
  result?: string
  error?: string
}

// Helper to provide actionable guidance for common errors
function getErrorActionHint(errorMessage: string): string | null {
  const lowerError = errorMessage.toLowerCase()
  
  if (lowerError.includes('api key') || lowerError.includes('apikey')) {
    return '💡 **Action:** Va dans Paramètres → Clés API et ajoute ta clé OpenAI ou Anthropic.'
  }
  if (lowerError.includes('unauthorized') || lowerError.includes('401')) {
    return '💡 **Action:** Reconnecte-toi pour continuer.'
  }
  if (lowerError.includes('rate limit') || lowerError.includes('429')) {
    return '💡 **Action:** Trop de requêtes. Attends un moment et réessaie.'
  }
  if (lowerError.includes('quota') || lowerError.includes('billing') || lowerError.includes('credit balance')) {
    if (lowerError.includes('anthropic')) {
      return '💡 **Action:** Ton compte Anthropic n\'a plus de crédits. Ajoute des crédits sur console.anthropic.com/settings/billing ou passe à OpenAI dans les Paramètres.'
    }
    return '💡 **Action:** Ton compte API n\'a peut-être plus de crédits. Vérifie ta facturation (Anthropic: console.anthropic.com | OpenAI: platform.openai.com).'
  }
  if (lowerError.includes('invalid') && lowerError.includes('key')) {
    return '💡 **Action:** Ta clé API semble invalide. Vérifie-la dans Paramètres → Clés API.'
  }
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return '💡 **Action:** La requête a pris trop de temps. Essaie un prompt plus court ou réessaie.'
  }
  
  return null
}

// Fonction pour obtenir l'icône d'un SaaS
function getSaasIcon(saasName: string): string {
  const saas = SAAS_APPS.find(s => 
    s.name.toLowerCase() === saasName.toLowerCase()
  )
  return saas?.icon || '📦'
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
  const [appName, setAppName] = useState('Mon App')
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  
  // BUG FIX #4: Tool call tracking for visual feedback
  const [toolCalls, setToolCalls] = useState<ToolCallState[]>([])
  
  // BUG FIX #3: Preview version counter for reliable refresh
  const [previewVersion, setPreviewVersion] = useState(0)
  
  // BUG FIX #5: Track app loading state to prevent race condition
  const [isAppLoaded, setIsAppLoaded] = useState(false)
  
  // BUG FIX #6: Debounce timer ref for file saving
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Métadonnées pour les économies
  const [appMetadata, setAppMetadata] = useState<{
    replacedSaas?: string
    replacedSaasName?: string
    monthlySavings?: number
  } | null>(null)
  
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
          
          // Charger les métadonnées (économies)
          if (app.metadata) {
            setAppMetadata(app.metadata)
          }
          
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
      } finally {
        // BUG FIX #5: Mark app as loaded
        setIsAppLoaded(true)
      }
    }
    
    loadApp()
  }, [appId])

  // BUG FIX #5: Handle initial prompt only after app is loaded
  useEffect(() => {
    if (initialPrompt && !hasInitialized.current && isAppLoaded) {
      hasInitialized.current = true
      void handleSend(initialPrompt)
    }
  }, [initialPrompt, isAppLoaded])

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
    
    // BUG FIX #4: Reset tool calls at start of new message
    setToolCalls([])

    // Create placeholder for streaming response
    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
    }])

    // BUG FIX #2: Track if tools were used for file sync
    let toolsWereUsed = false

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
        const errorMessage = data.error || 'Échec de l\'envoi du message'
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
                
                if (data.type === 'debug') {
                  // Debug info from backend
                  console.log('[Frontend] Debug from API:', data)
                } else if (data.type === 'chunk') {
                  fullContent += data.content
                  setMessages(prev => prev.map(m => 
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  ))
                } else if (data.type === 'tool_call') {
                  console.log('[Frontend] Tool call received:', data)
                  // BUG FIX #1: Handle tool_call events
                  toolsWereUsed = true
                  setToolCalls(prev => [...prev, {
                    id: data.id || `tool-${Date.now()}`,
                    name: data.name,
                    status: 'running',
                    arguments: data.arguments,
                  }])
                } else if (data.type === 'tool_result') {
                  // BUG FIX #1: Handle tool_result events
                  setToolCalls(prev => prev.map(tc =>
                    tc.id === data.toolCallId 
                      ? { 
                          ...tc, 
                          status: data.success ? 'success' : 'error', 
                          result: data.output, 
                          error: data.error 
                        }
                      : tc
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

      // FIX BUG #7: Handle file updates based on whether tools were used
      // If tools were used, DB is source of truth - DON'T overwrite with local state
      // If no tools, use codeOutput from parseCodeBlocks (legacy fallback mode)
      if (toolsWereUsed) {
        // Tools wrote directly to DB - just use codeOutput from backend (which is now always DB state)
        if (codeOutput?.files) {
          const normalizedFiles = normalizeFilesForSandpack(codeOutput.files)
          setFiles(normalizedFiles) // Replace entirely with DB state, don't merge
          setPreviewVersion(v => v + 1)
        } else {
          // Fallback: refresh from API if codeOutput is somehow null
          try {
            const appRes = await fetch(`/api/apps/${appId}`)
            if (appRes.ok) {
              const app = await appRes.json()
              if (app.files && Object.keys(app.files).length > 0) {
                setFiles(normalizeFilesForSandpack(app.files))
                setPreviewVersion(v => v + 1)
              }
            }
          } catch (err) {
            console.error('Failed to refresh files after tool use:', err)
          }
        }
      } else if (codeOutput?.files) {
        // Legacy mode (no tools): merge codeOutput and save to DB
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
        
        setPreviewVersion(v => v + 1)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      let displayMessage = `⚠️ Erreur de connexion: ${errorMessage}`
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        displayMessage = '⚠️ La requête a expiré. Réessaie.'
      } else if (errorMessage.includes('Failed to fetch')) {
        displayMessage = '⚠️ Erreur réseau. Vérifie ta connexion.'
      }
      
      setMessages(prev => prev.map(m => 
        m.id === assistantId ? { ...m, content: displayMessage } : m
      ))
    } finally {
      setIsLoading(false)
      // BUG FIX #4: Clear tool calls when done
      setToolCalls([])
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

  // BUG FIX #6: Handle file changes with debounce
  const handleFileChange = useCallback((path: string, content: string) => {
    setFiles(prev => {
      const updated = { ...prev, [path]: content }
      
      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      
      // Debounce save to API (1 second delay)
      saveTimerRef.current = setTimeout(() => {
        fetch(`/api/apps/${appId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: updated }),
        }).catch(err => console.error('Failed to save files:', err))
      }, 1000)
      
      return updated
    })
    
    // BUG FIX #3: Update preview version when files change manually
    setPreviewVersion(v => v + 1)
  }, [appId])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  // Reset files to default template
  const handleResetFiles = useCallback(() => {
    const defaultFiles = DEFAULT_FILES[appType] || DEFAULT_FILES.WEB
    setFiles(defaultFiles)
    
    // BUG FIX #3: Update preview version
    setPreviewVersion(v => v + 1)
    
    // Save to API
    fetch(`/api/apps/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: defaultFiles }),
    }).catch(err => console.error('Failed to reset files:', err))
  }, [appId, appType])

  // Calcul des économies
  const yearlySavings = appMetadata?.monthlySavings ? appMetadata.monthlySavings * 12 : 0

  // BUG FIX #3: Preview component with version-based key for reliable refresh
  const previewComponent = (
    <Preview 
      key={`preview-${previewVersion}`}
      files={files}
      appType={appType}
      showCode={false}
      onResetFiles={handleResetFiles}
    />
  )

  // BUG FIX #4: Chat component with tool calls for visual feedback
  const chatComponent = (
    <ChatPanel
      messages={messages}
      input={input}
      isLoading={isLoading}
      toolCalls={toolCalls}
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
          
          {/* Badge économies */}
          {appMetadata?.replacedSaasName && yearlySavings > 0 && (
            <Badge 
              variant="outline" 
              className="ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5"
            >
              <span>{getSaasIcon(appMetadata.replacedSaasName)}</span>
              <span className="line-through text-muted-foreground text-xs">
                {appMetadata.replacedSaasName}
              </span>
              <PiggyBank className="w-3 h-3" />
              <span className="font-semibold">+{formatCurrency(yearlySavings)}/an</span>
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <ModeToggle />
          
          {deployUrl ? (
            <Button size="sm" variant="outline" asChild>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir en ligne
              </a>
            </Button>
          ) : null}
          
          <Button size="sm" onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4 mr-2" />
            )}
            Déployer
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
