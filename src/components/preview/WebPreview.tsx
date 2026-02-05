"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  SandpackProvider, 
  SandpackPreview, 
  SandpackCodeEditor,
  useSandpack
} from '@codesandbox/sandpack-react'
import { AlertTriangle, RefreshCw, Code, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorBoundary, ErrorFallback } from '@/components/ui/error-boundary'

interface WebPreviewProps {
  files: Record<string, string>
  showCode?: boolean
}

/**
 * Sanitize file content to prevent common parsing errors
 * - Fixes broken Unicode escape sequences
 * - Removes invalid characters
 */
function sanitizeFileContent(content: string): string {
  if (typeof content !== 'string') {
    return String(content || '')
  }
  
  // Fix broken Unicode escape sequences like \uXXX (missing digit) or \u without hex
  // Replace malformed \uXXXX sequences with a placeholder or fix them
  let sanitized = content
  
  // Match \u followed by less than 4 hex digits (incomplete escape)
  sanitized = sanitized.replace(/\\u([0-9a-fA-F]{0,3})(?![0-9a-fA-F])/g, (match, hex) => {
    // Pad with zeros to make valid unicode or replace with space
    if (hex.length === 0) {
      return '\\\\u' // Escape the backslash to show literal \u
    }
    return '\\u' + hex.padStart(4, '0')
  })
  
  return sanitized
}

/**
 * Validate and normalize files for Sandpack
 */
function prepareFilesForSandpack(files: Record<string, string>): Record<string, string> {
  const prepared: Record<string, string> = {}
  
  console.log('[WebPreview] prepareFilesForSandpack input:', {
    fileCount: Object.keys(files).length,
    filePaths: Object.keys(files),
  })
  
  for (const [path, content] of Object.entries(files)) {
    // Skip empty or null content
    if (content === null || content === undefined) {
      console.log('[WebPreview] Skipping null/undefined content for:', path)
      continue
    }
    
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    
    // Sanitize content
    prepared[normalizedPath] = sanitizeFileContent(content)
  }
  
  console.log('[WebPreview] After normalization:', {
    fileCount: Object.keys(prepared).length,
    filePaths: Object.keys(prepared),
    hasAppJs: !!prepared['/App.js'],
    hasAppTsx: !!prepared['/App.tsx'],
  })
  
  // Ensure we have at least an App.js file
  if (!prepared['/App.js'] && !prepared['/App.tsx']) {
    console.warn('[WebPreview] No App.js found! Adding default template. Original files:', Object.keys(files))
    prepared['/App.js'] = `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl opacity-80">Start building something amazing!</p>
      </div>
    </div>
  )
}`
  }
  
  return prepared
}

/**
 * Inner preview component that has access to Sandpack context
 */
function SandpackPreviewInner({ showCode }: { showCode: boolean }) {
  const { sandpack } = useSandpack()
  const [hasError, setHasError] = useState(false)
  
  // Listen for Sandpack errors
  useEffect(() => {
    const checkErrors = () => {
      if (sandpack.error) {
        console.error('Sandpack error:', sandpack.error)
        setHasError(true)
      } else {
        setHasError(false)
      }
    }
    
    checkErrors()
  }, [sandpack.error])
  
  if (hasError && sandpack.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-red-50 dark:bg-red-950/20 rounded-lg">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="font-medium text-lg mb-1 text-red-700 dark:text-red-400">Preview Error</h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4 max-w-md font-mono">
          {sandpack.error.message}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setHasError(false)
            sandpack.resetAllFiles()
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset Files
        </Button>
      </div>
    )
  }

  if (showCode) {
    return (
      <SandpackCodeEditor 
        style={{ height: '100%' }}
        showLineNumbers
        showTabs
      />
    )
  }
  
  return (
    <SandpackPreview 
      style={{ height: '100%' }}
      showNavigator={false}
      showRefreshButton
    />
  )
}

/**
 * Fallback component when Sandpack completely fails to load
 */
function PreviewFallback({ 
  files, 
  error, 
  onRetry 
}: { 
  files: Record<string, string>
  error?: Error | null
  onRetry?: () => void 
}) {
  const [showRawCode, setShowRawCode] = useState(false)
  const mainFile = files['/App.js'] || files['/App.tsx'] || Object.values(files)[0]
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <h3 className="font-medium text-lg mb-1">Preview Unavailable</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {error?.message || 'The preview could not be loaded. This may be due to a syntax error in the generated code.'}
        </p>
        <div className="flex gap-2">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawCode(!showRawCode)}
          >
            {showRawCode ? (
              <><Eye className="w-4 h-4 mr-2" /> Hide Code</>
            ) : (
              <><Code className="w-4 h-4 mr-2" /> View Code</>
            )}
          </Button>
        </div>
      </div>
      
      {showRawCode && mainFile && (
        <div className="border-t max-h-[300px] overflow-auto">
          <pre className="p-4 text-xs bg-muted/50 overflow-x-auto">
            <code>{mainFile}</code>
          </pre>
        </div>
      )}
    </div>
  )
}

export function WebPreview({ files, showCode = false }: WebPreviewProps) {
  const [key, setKey] = useState(0)
  const [loadError, setLoadError] = useState<Error | null>(null)
  
  // Prepare and memoize files
  const preparedFiles = useMemo(() => {
    try {
      return prepareFilesForSandpack(files)
    } catch (err) {
      console.error('Failed to prepare files:', err)
      setLoadError(err instanceof Error ? err : new Error('Failed to prepare files'))
      return {}
    }
  }, [files])
  
  const handleRetry = useCallback(() => {
    setLoadError(null)
    setKey(k => k + 1)
  }, [])
  
  const handleError = useCallback((error: Error) => {
    console.error('WebPreview error:', error)
    setLoadError(error)
  }, [])
  
  // If files couldn't be prepared, show fallback
  if (loadError || Object.keys(preparedFiles).length === 0) {
    return (
      <PreviewFallback 
        files={files} 
        error={loadError}
        onRetry={handleRetry} 
      />
    )
  }
  
  return (
    <ErrorBoundary
      key={key}
      fallback={
        <PreviewFallback 
          files={files} 
          onRetry={handleRetry}
        />
      }
      onReset={handleRetry}
    >
      <SandpackProvider
        template="react"
        files={preparedFiles}
        theme="auto"
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
          ],
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
      >
        <SandpackPreviewInner showCode={showCode} />
      </SandpackProvider>
    </ErrorBoundary>
  )
}
