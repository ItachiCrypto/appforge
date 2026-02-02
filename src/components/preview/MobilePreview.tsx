"use client"

import { useState, useMemo, useCallback } from 'react'
import { SandpackProvider, SandpackPreview, SandpackCodeEditor } from '@codesandbox/sandpack-react'
import { cn } from '@/lib/utils'
import { ErrorBoundary, ErrorFallback } from '@/components/ui/error-boundary'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobilePreviewProps {
  files: Record<string, string>
  showCode?: boolean
  type: 'IOS' | 'ANDROID'
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

function MobileFrame({ 
  children, 
  isIOS 
}: { 
  children: React.ReactNode
  isIOS: boolean 
}) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-4">
      {/* Phone Frame */}
      <div className={cn(
        "relative bg-black rounded-[3rem] p-3 shadow-2xl",
        "w-[320px] h-[650px]",
        isIOS ? "rounded-[3rem]" : "rounded-[2rem]"
      )}>
        {/* Status Bar */}
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 z-10",
          isIOS 
            ? "w-[120px] h-[30px] bg-black rounded-b-2xl"
            : "w-full h-[24px] bg-black/80"
        )}>
          {!isIOS && (
            <div className="flex justify-end items-center h-full px-4 text-white text-xs gap-2">
              <span>📶</span>
              <span>🔋</span>
              <span>12:00</span>
            </div>
          )}
        </div>

        {/* Screen */}
        <div className={cn(
          "w-full h-full bg-white overflow-hidden",
          isIOS ? "rounded-[2.5rem]" : "rounded-[1.5rem]"
        )}>
          {children}
        </div>

        {/* Home Indicator / Navigation Bar */}
        {isIOS ? (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[140px] h-[5px] bg-white rounded-full" />
        ) : (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-8">
            <div className="w-4 h-4 border-2 border-white/50 rounded-sm" />
            <div className="w-4 h-4 border-2 border-white/50 rounded-full" />
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white/50" />
          </div>
        )}
      </div>

      {/* Device Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {isIOS ? '📱 iPhone 15 Pro' : '🤖 Pixel 8'}
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
      <p className="text-sm text-muted-foreground mb-3">Could not render the mobile preview</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function MobilePreview({ files, showCode = false, type }: MobilePreviewProps) {
  const isIOS = type === 'IOS'
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
        <MobileFrame isIOS={isIOS}>
          <PreviewFallback onRetry={handleRetry} />
        </MobileFrame>
      }
      onReset={handleRetry}
    >
      <MobileFrame isIOS={isIOS}>
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
      </MobileFrame>
    </ErrorBoundary>
  )
}
