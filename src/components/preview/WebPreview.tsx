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
 */
function sanitizeFileContent(content: string): string {
  if (typeof content !== 'string') {
    return String(content || '')
  }
  
  let sanitized = content
  sanitized = sanitized.replace(/\\u([0-9a-fA-F]{0,3})(?![0-9a-fA-F])/g, (match, hex) => {
    if (hex.length === 0) {
      return '\\\\u'
    }
    return '\\u' + hex.padStart(4, '0')
  })
  
  return sanitized
}

/**
 * Detect if files use a /src/ structure (Vite-style)
 */
function detectProjectStructure(files: Record<string, string>): 'vite' | 'simple' {
  const paths = Object.keys(files)
  const hasSrcFolder = paths.some(p => p.startsWith('/src/') || p.startsWith('src/'))
  const hasComponents = paths.some(p => p.includes('/components/'))
  
  // If we have /src/ or /components/, use Vite structure
  if (hasSrcFolder || hasComponents) {
    return 'vite'
  }
  return 'simple'
}

/**
 * Prepare files for Vite template (with /src/ structure)
 */
function prepareViteFiles(files: Record<string, string>): Record<string, string> {
  const prepared: Record<string, string> = {}
  
  for (const [path, content] of Object.entries(files)) {
    if (content === null || content === undefined) continue
    
    let normalizedPath = path.startsWith('/') ? path : `/${path}`
    
    // Normalize .jsx/.tsx to .jsx for Sandpack compatibility
    normalizedPath = normalizedPath.replace(/\.tsx?$/, '.jsx')
    
    prepared[normalizedPath] = sanitizeFileContent(content)
  }
  
  // Ensure we have the required Vite entry files
  if (!prepared['/src/App.jsx'] && !prepared['/App.jsx']) {
    // Check if there's an App.js and move it to /src/
    if (prepared['/App.js']) {
      prepared['/src/App.jsx'] = prepared['/App.js']
      delete prepared['/App.js']
    } else {
      // Create default App
      prepared['/src/App.jsx'] = `export default function App() {
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
  }
  
  // Ensure main.jsx exists for Vite
  if (!prepared['/src/main.jsx']) {
    prepared['/src/main.jsx'] = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
  }
  
  // Ensure index.css exists
  if (!prepared['/src/index.css']) {
    prepared['/src/index.css'] = prepared['/styles.css'] || `
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
`
    delete prepared['/styles.css']
  }
  
  // Move any /components/ to /src/components/
  for (const [path, content] of Object.entries(prepared)) {
    if (path.startsWith('/components/')) {
      const newPath = `/src${path}`
      prepared[newPath] = content
      delete prepared[path]
    }
  }
  
  // Move any /hooks/ to /src/hooks/
  for (const [path, content] of Object.entries(prepared)) {
    if (path.startsWith('/hooks/')) {
      const newPath = `/src${path}`
      prepared[newPath] = content
      delete prepared[path]
    }
  }
  
  // Move any /utils/ to /src/utils/
  for (const [path, content] of Object.entries(prepared)) {
    if (path.startsWith('/utils/')) {
      const newPath = `/src${path}`
      prepared[newPath] = content
      delete prepared[path]
    }
  }
  
  console.log('[WebPreview] Vite structure prepared:', Object.keys(prepared))
  
  return prepared
}

/**
 * Prepare files for simple React template (legacy)
 */
function prepareSimpleFiles(files: Record<string, string>): Record<string, string> {
  const prepared: Record<string, string> = {}
  
  for (const [path, content] of Object.entries(files)) {
    if (content === null || content === undefined) continue
    
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    prepared[normalizedPath] = sanitizeFileContent(content)
  }
  
  // Ensure we have at least an App.js file
  if (!prepared['/App.js'] && !prepared['/App.tsx']) {
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
  
  console.log('[WebPreview] Simple structure prepared:', Object.keys(prepared))
  
  return prepared
}

/**
 * Inner preview component that has access to Sandpack context
 */
function SandpackPreviewInner({ showCode }: { showCode: boolean }) {
  const { sandpack } = useSandpack()
  const [hasError, setHasError] = useState(false)
  
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
  const mainFile = files['/src/App.jsx'] || files['/App.js'] || files['/App.tsx'] || Object.values(files)[0]
  
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
  
  // Detect structure and prepare files accordingly
  const { preparedFiles, template } = useMemo(() => {
    try {
      const structure = detectProjectStructure(files)
      console.log('[WebPreview] Detected structure:', structure)
      
      if (structure === 'vite') {
        return {
          preparedFiles: prepareViteFiles(files),
          template: 'vite-react' as const
        }
      }
      
      return {
        preparedFiles: prepareSimpleFiles(files),
        template: 'react' as const
      }
    } catch (err) {
      console.error('Failed to prepare files:', err)
      setLoadError(err instanceof Error ? err : new Error('Failed to prepare files'))
      return { preparedFiles: {}, template: 'react' as const }
    }
  }, [files])
  
  const handleRetry = useCallback(() => {
    setLoadError(null)
    setKey(k => k + 1)
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
        template={template}
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
