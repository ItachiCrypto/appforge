"use client"

import { useState, useMemo, useCallback } from 'react'
import { SandpackProvider, SandpackPreview, SandpackCodeEditor } from '@codesandbox/sandpack-react'
import { ErrorBoundary, ErrorFallback } from '@/components/ui/error-boundary'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DesktopPreviewProps {
  files: Record<string, string>
  showCode?: boolean
}

/**
 * Sanitize and prepare files for Sandpack
 */
function prepareFiles(files: Record<string, string>): Record<string, string> {
  const prepared: Record<string, string> = {}
  
  for (const [path, content] of Object.entries(files)) {
    if (content === null || content === undefined) continue
    
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    
    // Fix broken Unicode escapes
    let sanitized = typeof content === 'string' ? content : String(content || '')
    sanitized = sanitized.replace(/\\u([0-9a-fA-F]{0,3})(?![0-9a-fA-F])/g, (_, hex) => {
      return hex.length === 0 ? '\\\\u' : `\\u${hex.padStart(4, '0')}`
    })
    
    prepared[normalizedPath] = sanitized
  }
  
  return prepared
}

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-900/30 p-8">
      {/* Desktop Window Frame */}
      <div className="w-full max-w-4xl h-[500px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Title Bar */}
        <div className="h-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
          {/* Traffic Lights (macOS style) */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer" />
          </div>
          
          {/* Title */}
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              🖥️ Desktop App
            </span>
          </div>
          
          {/* Window Controls (Windows style) */}
          <div className="flex gap-1 text-gray-500">
            <button className="px-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">─</button>
            <button className="px-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">□</button>
            <button className="px-2 hover:bg-red-500 hover:text-white rounded">✕</button>
          </div>
        </div>

        {/* Window Content */}
        <div className="h-[calc(100%-2.5rem)]">
          {children}
        </div>
      </div>

      {/* Platform Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Electron • macOS / Windows / Linux
        </span>
      </div>
    </div>
  )
}

function PreviewFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
      <h3 className="font-medium mb-1">Preview Error</h3>
      <p className="text-sm text-muted-foreground mb-3">Could not render the desktop preview</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function DesktopPreview({ files, showCode = false }: DesktopPreviewProps) {
  const [key, setKey] = useState(0)
  
  const preparedFiles = useMemo(() => prepareFiles(files), [files])
  const handleRetry = useCallback(() => setKey(k => k + 1), [])
  
  if (showCode) {
    return (
      <ErrorBoundary fallback={<ErrorFallback onRetry={handleRetry} />}>
        <SandpackProvider template="react" files={preparedFiles} theme="auto">
          <SandpackCodeEditor style={{ height: '100%' }} showLineNumbers showTabs />
        </SandpackProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary 
      key={key}
      fallback={
        <DesktopFrame>
          <PreviewFallback onRetry={handleRetry} />
        </DesktopFrame>
      }
      onReset={handleRetry}
    >
      <DesktopFrame>
        <SandpackProvider
          template="react"
          files={preparedFiles}
          theme="auto"
          options={{
            externalResources: ["https://cdn.tailwindcss.com"],
          }}
        >
          <SandpackPreview 
            style={{ height: '100%', width: '100%' }}
            showNavigator={false}
            showRefreshButton={false}
          />
        </SandpackProvider>
      </DesktopFrame>
    </ErrorBoundary>
  )
}
