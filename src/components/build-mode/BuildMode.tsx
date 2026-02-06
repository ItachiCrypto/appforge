"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Loader2, 
  Check, 
  AlertCircle, 
  Pause, 
  Play, 
  ChevronDown, 
  ChevronUp,
  Rocket,
  Code,
  FileText,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  parseEpicsMarkdown, 
  getAllStories, 
  buildStoryPrompt,
  countStoriesByStatus,
  type Story, 
  type Epic 
} from '@/lib/bmad/parser'
import { Preview, normalizeFilesForSandpack, DEFAULT_FILES, type AppType, type PreviewError } from '@/components/preview'

// Max attempts to fix errors before moving on
const MAX_FIX_ATTEMPTS = 3

interface BuildModeProps {
  appId: string
  appName: string
  appType: AppType
  bmadDocs: {
    brief?: string
    prd?: string
    architecture?: string
    epics?: string
  }
  onComplete: () => void
  onFilesUpdate: (files: Record<string, string>) => void
}

interface BuildLog {
  timestamp: Date
  type: 'info' | 'success' | 'error' | 'tool'
  message: string
  storyId?: string
}

export function BuildMode({ 
  appId, 
  appName, 
  appType, 
  bmadDocs, 
  onComplete,
  onFilesUpdate,
}: BuildModeProps) {
  const [epics, setEpics] = useState<Epic[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'building' | 'paused' | 'done' | 'error'>('idle')
  const [logs, setLogs] = useState<BuildLog[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [files, setFiles] = useState<Record<string, string>>(DEFAULT_FILES[appType] || DEFAULT_FILES.WEB)
  const [previewVersion, setPreviewVersion] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<PreviewError | null>(null)
  const [fixAttempts, setFixAttempts] = useState(0)
  const [isFixingError, setIsFixingError] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const isRunningRef = useRef(false)
  const storiesRef = useRef<Story[]>([])
  const currentIndexRef = useRef(0)
  const previewErrorRef = useRef<PreviewError | null>(null)
  const waitingForPreviewRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => {
    storiesRef.current = stories
  }, [stories])

  useEffect(() => {
    currentIndexRef.current = currentStoryIndex
  }, [currentStoryIndex])

  // Keep preview error ref in sync
  useEffect(() => {
    previewErrorRef.current = previewError
  }, [previewError])

  // Handle preview error callback
  const handlePreviewError = useCallback((error: PreviewError) => {
    console.log('[BuildMode] Preview error detected:', error.message)
    setPreviewError(error)
    previewErrorRef.current = error
  }, [])

  // Clear error when preview is successful
  const handlePreviewSuccess = useCallback(() => {
    if (previewErrorRef.current) {
      console.log('[BuildMode] Preview success - clearing error')
      setPreviewError(null)
      previewErrorRef.current = null
    }
  }, [])

  // Parse epics on mount
  useEffect(() => {
    if (bmadDocs.epics) {
      console.log('[BuildMode] Parsing epics markdown...')
      const parsedEpics = parseEpicsMarkdown(bmadDocs.epics)
      console.log('[BuildMode] Parsed epics:', parsedEpics.length)
      setEpics(parsedEpics)
      const allStories = getAllStories(parsedEpics)
      console.log('[BuildMode] Total stories:', allStories.length)
      setStories(allStories)
      storiesRef.current = allStories
      
      addLog('info', `📋 ${allStories.length} stories détectées dans ${parsedEpics.length} epics`)
      
      // Auto-start building after a short delay
      if (allStories.length > 0) {
        console.log('[BuildMode] Starting build in 1s...')
        setTimeout(() => {
          console.log('[BuildMode] Starting build now')
          startBuilding()
        }, 1000)
      } else {
        console.warn('[BuildMode] No stories found to build!')
        addLog('error', '❌ Aucune story trouvée dans le document epics')
      }
    }
  }, [bmadDocs.epics])

  const addLog = useCallback((type: BuildLog['type'], message: string, storyId?: string) => {
    setLogs(prev => [...prev, { 
      timestamp: new Date(), 
      type, 
      message,
      storyId,
    }])
  }, [])

  const updateStoryStatus = useCallback((index: number, newStatus: Story['status']) => {
    setStories(prev => {
      const updated = prev.map((s, i) => 
        i === index ? { ...s, status: newStatus } : s
      )
      // Also update ref to avoid stale closure
      storiesRef.current = updated
      return updated
    })
  }, [])

  const startBuilding = useCallback(() => {
    if (isRunningRef.current) return
    setStatus('building')
    isRunningRef.current = true
    buildNextStory()
  }, [])

  const pauseBuilding = useCallback(() => {
    setStatus('paused')
    isRunningRef.current = false
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    addLog('info', '⏸️ Build mis en pause')
  }, [addLog])

  const resumeBuilding = useCallback(() => {
    if (status === 'paused') {
      setStatus('building')
      isRunningRef.current = true
      buildNextStory()
      addLog('info', '▶️ Build repris')
    }
  }, [status, addLog])

  // Fix preview errors by sending them to the AI
  const fixPreviewError = useCallback(async (error: PreviewError, storyId: string): Promise<boolean> => {
    console.log('[BuildMode] Attempting to fix error:', error.message)
    addLog('info', `🔧 Correction de l'erreur: ${error.message.substring(0, 50)}...`, storyId)
    setIsFixingError(true)
    
    try {
      abortControllerRef.current = new AbortController()
      
      const fixPrompt = `🔴 **Erreur de prévisualisation détectée:**

\`\`\`
${error.message}
\`\`\`

${error.file ? `📁 Fichier: \`${error.file}\`` : ''}
${error.line ? `📍 Ligne: ${error.line}${error.column ? `, Colonne: ${error.column}` : ''}` : ''}

**Corrige cette erreur immédiatement.** 
- Analyse le message d'erreur
- Trouve la cause (import manquant, syntaxe, variable undefined, etc.)
- Corrige le fichier concerné avec \`write_file\`

Ne fais QUE corriger l'erreur, pas d'autres modifications.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          messages: [{ role: 'user', content: fixPrompt }],
          enableTools: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'tool_call') {
                addLog('tool', `🔧 ${data.name}: ${data.arguments?.path || ''}`, storyId)
              }
              
              if (data.type === 'tool_result' && data.success) {
                // File was updated, refresh preview
                const updatedApp = await fetch(`/api/apps/${appId}`).then(r => r.json())
                if (updatedApp.files) {
                  const normalized = normalizeFilesForSandpack(updatedApp.files)
                  setFiles(normalized)
                  onFilesUpdate(normalized)
                  setPreviewVersion(v => v + 1)
                }
              }
            } catch (parseErr) {
              // Ignore
            }
          }
        }
      }

      addLog('success', `✅ Correction appliquée`, storyId)
      setIsFixingError(false)
      return true
      
    } catch (err) {
      console.error('[BuildMode] Fix error failed:', err)
      addLog('error', `❌ Échec de la correction: ${(err as Error).message}`, storyId)
      setIsFixingError(false)
      return false
    }
  }, [appId, addLog, onFilesUpdate])

  // Check for preview errors and fix them
  const checkAndFixPreviewErrors = useCallback(async (storyId: string) => {
    let attempts = 0
    
    while (attempts < MAX_FIX_ATTEMPTS) {
      // Wait a bit for preview to settle
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const currentError = previewErrorRef.current
      
      if (!currentError) {
        console.log('[BuildMode] No preview errors detected')
        addLog('success', `✅ Preview OK - pas d'erreurs`, storyId)
        return
      }
      
      attempts++
      setFixAttempts(attempts)
      console.log(`[BuildMode] Preview error detected, fix attempt ${attempts}/${MAX_FIX_ATTEMPTS}`)
      addLog('info', `🔄 Tentative de correction ${attempts}/${MAX_FIX_ATTEMPTS}`, storyId)
      
      // Clear error before fixing (to detect new errors)
      setPreviewError(null)
      previewErrorRef.current = null
      
      // Try to fix the error
      const fixed = await fixPreviewError(currentError, storyId)
      
      if (!fixed) {
        console.log('[BuildMode] Fix attempt failed')
        continue
      }
      
      // Wait for preview to re-render after fix
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Max attempts reached
    if (previewErrorRef.current) {
      addLog('error', `⚠️ Erreurs persistantes après ${MAX_FIX_ATTEMPTS} tentatives - passage à la story suivante`, storyId)
    }
  }, [addLog, fixPreviewError])

  const buildNextStory = useCallback(async () => {
    console.log('[BuildMode] buildNextStory called, isRunning:', isRunningRef.current)
    if (!isRunningRef.current) return
    
    // Use refs to get current values (avoid stale closure)
    const currentStories = storiesRef.current
    const currentIdx = currentIndexRef.current
    
    console.log('[BuildMode] Looking for next story, currentIdx:', currentIdx, 'total:', currentStories.length)
    
    // Find next pending story
    const nextIndex = currentStories.findIndex((s, i) => i >= currentIdx && s.status === 'pending')
    
    console.log('[BuildMode] Next pending story index:', nextIndex)
    
    if (nextIndex === -1) {
      // All stories done
      console.log('[BuildMode] All stories done!')
      setStatus('done')
      isRunningRef.current = false
      addLog('success', '🎉 Toutes les stories ont été implémentées!')
      onComplete()
      return
    }

    setCurrentStoryIndex(nextIndex)
    currentIndexRef.current = nextIndex
    const story = currentStories[nextIndex]
    
    console.log('[BuildMode] Building story:', story.storyId, story.title)
    
    // Update status
    updateStoryStatus(nextIndex, 'building')
    addLog('info', `🔨 Building Story ${story.storyId}: ${story.title}`, story.storyId)

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()
      
      // Build the prompt
      const isFirstStory = nextIndex === 0
      const prompt = buildStoryPrompt(story, isFirstStory)
      
      console.log('[BuildMode] Sending prompt to API:', prompt.substring(0, 200) + '...')
      
      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          messages: [{ role: 'user', content: prompt }],
          enableTools: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      console.log('[BuildMode] API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BuildMode] API error response:', errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      // Process streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'tool_call') {
                addLog('tool', `🔧 ${data.name}: ${data.arguments?.path || ''}`, story.storyId)
              }
              
              if (data.type === 'tool_result' && data.success) {
                // File was written, update preview
                const updatedApp = await fetch(`/api/apps/${appId}`).then(r => r.json())
                if (updatedApp.files) {
                  const normalized = normalizeFilesForSandpack(updatedApp.files)
                  setFiles(normalized)
                  onFilesUpdate(normalized)
                  setPreviewVersion(v => v + 1)
                }
              }
              
              if (data.type === 'error') {
                throw new Error(data.error)
              }
              
              if (data.type === 'done') {
                // Story completed successfully
                updateStoryStatus(nextIndex, 'done')
                addLog('success', `✅ Story ${story.storyId} terminée`, story.storyId)
                
                // Update files from response
                if (data.codeOutput?.files) {
                  const normalized = normalizeFilesForSandpack(data.codeOutput.files)
                  setFiles(normalized)
                  onFilesUpdate(normalized)
                  setPreviewVersion(v => v + 1)
                }
              }
            } catch (parseErr) {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
      }

      // Wait for preview to update and check for errors
      if (isRunningRef.current) {
        // Give preview time to render and detect errors
        addLog('info', `⏳ Vérification de la preview...`, story.storyId)
        waitingForPreviewRef.current = true
        setFixAttempts(0)
        
        // Wait 3 seconds for preview to render
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Check for preview errors and fix if needed
        await checkAndFixPreviewErrors(story.storyId)
        
        waitingForPreviewRef.current = false
        
        // Move to next story
        if (isRunningRef.current) {
          setTimeout(() => buildNextStory(), 500)
        }
      }

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Request was aborted (paused)
        updateStoryStatus(nextIndex, 'pending')
        return
      }
      
      console.error('Build error:', err)
      updateStoryStatus(nextIndex, 'error')
      setErrorMessage((err as Error).message)
      addLog('error', `❌ Erreur: ${(err as Error).message}`, story.storyId)
      
      // Try to continue with next story after error
      if (isRunningRef.current) {
        setTimeout(() => {
          setCurrentStoryIndex(nextIndex + 1)
          buildNextStory()
        }, 2000)
      }
    }
  }, [appId, addLog, updateStoryStatus, onComplete, onFilesUpdate, checkAndFixPreviewErrors])

  // Note: Build is triggered from parseEpics useEffect, not from state changes
  // This avoids race conditions with stale closures

  const stats = countStoriesByStatus(stories)
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left Panel - Build Progress */}
      <div className="w-[400px] border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{appName}</h1>
              <p className="text-sm text-white/50">Construction automatique</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">{stats.done}/{stats.total} stories</span>
              <span className="text-violet-400 font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-4 flex items-center gap-2">
            {status === 'building' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-sm text-violet-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                En cours...
              </div>
            )}
            {status === 'paused' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-sm text-amber-300">
                <Pause className="w-4 h-4" />
                En pause
              </div>
            )}
            {status === 'done' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm text-emerald-300">
                <Check className="w-4 h-4" />
                Terminé!
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full text-sm text-red-300">
                <AlertCircle className="w-4 h-4" />
                Erreur
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex gap-2">
            {status === 'building' && (
              <Button
                variant="outline"
                size="sm"
                onClick={pauseBuilding}
                className="border-white/10 hover:bg-white/5"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            {status === 'paused' && (
              <Button
                size="sm"
                onClick={resumeBuilding}
                className="bg-violet-500 hover:bg-violet-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Reprendre
              </Button>
            )}
            {status === 'done' && (
              <Button
                size="sm"
                onClick={onComplete}
                className="bg-gradient-to-r from-violet-500 to-purple-600"
              >
                <Zap className="w-4 h-4 mr-2" />
                Utiliser l'app
              </Button>
            )}
          </div>
        </div>

        {/* Stories list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {epics.map((epic) => (
            <div key={epic.id} className="space-y-2">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Epic {epic.id}: {epic.title}
              </h3>
              <div className="space-y-1 pl-4">
                {epic.stories.map((story, idx) => {
                  const globalIdx = stories.findIndex(s => s.storyId === story.storyId)
                  const isActive = globalIdx === currentStoryIndex && status === 'building'
                  
                  return (
                    <div 
                      key={story.storyId}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-sm transition-all",
                        isActive && "bg-violet-500/20 border border-violet-500/30",
                        story.status === 'done' && "text-emerald-400",
                        story.status === 'error' && "text-red-400",
                        story.status === 'pending' && "text-white/50",
                      )}
                    >
                      {story.status === 'building' && (
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      )}
                      {story.status === 'done' && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                      {story.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      {story.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border border-white/20" />
                      )}
                      <span className="flex-1 truncate">
                        {story.storyId}: {story.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logs toggle */}
        <div className="border-t border-white/10">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full p-3 flex items-center justify-between text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Logs ({logs.length})
            </span>
            {showLogs ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          
          {showLogs && (
            <div className="max-h-48 overflow-y-auto p-3 bg-black/30 border-t border-white/5">
              {logs.slice(-20).map((log, i) => (
                <div 
                  key={i}
                  className={cn(
                    "text-xs font-mono py-0.5",
                    log.type === 'success' && "text-emerald-400",
                    log.type === 'error' && "text-red-400",
                    log.type === 'tool' && "text-blue-400",
                    log.type === 'info' && "text-white/50",
                  )}
                >
                  <span className="text-white/30">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  {' '}{log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="flex-1 p-6">
        <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-black/30">
          <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <span className="ml-4 text-xs text-white/30">Live Preview</span>
          </div>
          <div className="h-[calc(100%-40px)]">
            <Preview
              key={`preview-${previewVersion}`}
              files={files}
              appType={appType}
              onError={handlePreviewError}
            />
          </div>
          
          {/* Error indicator */}
          {previewError && (
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span className="truncate">{previewError.message.substring(0, 100)}</span>
                {isFixingError && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
              </div>
              {fixAttempts > 0 && (
                <div className="text-xs text-red-400/70 mt-1">
                  Tentative de correction {fixAttempts}/{MAX_FIX_ATTEMPTS}...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildMode
