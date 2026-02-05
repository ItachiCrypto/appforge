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
 * Detect if files use a /src/ structure (Vite-style) or need external dependencies
 */
function detectProjectStructure(files: Record<string, string>): 'vite' | 'simple' {
  const paths = Object.keys(files)
  const contents = Object.values(files).join('\n')
  
  const hasSrcFolder = paths.some(p => p.startsWith('/src/') || p.startsWith('src/'))
  const hasComponents = paths.some(p => p.includes('/components/'))
  const hasPages = paths.some(p => p.includes('/pages/'))
  const hasHooks = paths.some(p => p.includes('/hooks/'))
  const hasUtils = paths.some(p => p.includes('/utils/'))
  
  // Check if code imports external npm packages that require bundler support
  const needsExternalDeps = 
    contents.includes("from 'react-router-dom'") ||
    contents.includes('from "react-router-dom"') ||
    contents.includes("from 'ethers'") ||
    contents.includes('from "ethers"') ||
    contents.includes("from '@ethersproject") ||
    contents.includes("from 'wagmi'")
  
  // Force Vite structure for external deps, /src/, or multi-file structures
  if (hasSrcFolder || hasComponents || hasPages || hasHooks || hasUtils || needsExternalDeps) {
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
  
  // Move all subfolders to /src/ for Vite structure
  const foldersToMove = ['/components/', '/hooks/', '/utils/', '/pages/', '/lib/', '/services/', '/context/']
  
  for (const folder of foldersToMove) {
    for (const [path, content] of Object.entries(prepared)) {
      if (path.startsWith(folder)) {
        const newPath = `/src${path}`
        prepared[newPath] = content
        delete prepared[path]
      }
    }
  }
  
  // Also move standalone files (like /App.js) to /src/ if not already there
  if (prepared['/App.js'] && !prepared['/src/App.jsx']) {
    prepared['/src/App.jsx'] = prepared['/App.js']
    delete prepared['/App.js']
  }
  
  // Fix imports in all files to use correct relative paths
  // Since everything is now under /src/, imports should work
  for (const [path, content] of Object.entries(prepared)) {
    if (path.endsWith('.jsx') || path.endsWith('.js')) {
      // Update imports to use .jsx extension if needed
      let updatedContent = content
      // No need to change paths since everything is at same level under /src/
      prepared[path] = updatedContent
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
        <p className="text-sm text-red-600/80 dark:text-red-400/80 max-w-md font-mono">
          {sandpack.error.message}
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Utilisez le chat pour corriger cette erreur
        </p>
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
  const { preparedFiles, template, needsExternalDeps } = useMemo(() => {
    try {
      const structure = detectProjectStructure(files)
      const contents = Object.values(files).join('\n')
      const hasExternalDeps = 
        contents.includes("from 'react-router-dom'") ||
        contents.includes('from "react-router-dom"') ||
        contents.includes("from 'ethers'") ||
        contents.includes('from "ethers"')
      
      console.log('[WebPreview] v2 Detected structure:', structure, 'needsExternalDeps:', hasExternalDeps)
      console.log('[WebPreview] v2 Input file paths:', Object.keys(files))
      
      if (structure === 'vite') {
        const prepared = prepareViteFiles(files)
        console.log('[WebPreview] v2 Prepared Vite files:', Object.keys(prepared))
        return {
          preparedFiles: prepared,
          template: 'vite-react' as const,
          needsExternalDeps: hasExternalDeps
        }
      }
      
      const prepared = prepareSimpleFiles(files)
      console.log('[WebPreview] v2 Prepared simple files:', Object.keys(prepared))
      return {
        preparedFiles: prepared,
        template: 'react' as const,
        needsExternalDeps: hasExternalDeps
      }
    } catch (err) {
      console.error('Failed to prepare files:', err)
      setLoadError(err instanceof Error ? err : new Error('Failed to prepare files'))
      return { preparedFiles: {}, template: 'react' as const, needsExternalDeps: false }
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
  
  // Build dependencies based on what's actually needed
  const dependencies: Record<string, string> = {}
  if (needsExternalDeps) {
    const contents = Object.values(files).join('\n')
    if (contents.includes('react-router-dom')) {
      dependencies['react-router-dom'] = '^6.20.0'
    }
    if (contents.includes('ethers')) {
      dependencies['ethers'] = '^5.7.2'
    }
  }
  
  console.log('[WebPreview] v2 Rendering with:', {
    template,
    fileCount: Object.keys(preparedFiles).length,
    filePaths: Object.keys(preparedFiles),
    dependencies,
    needsExternalDeps
  })
  
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
        customSetup={needsExternalDeps ? { dependencies } : undefined}
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
// WebPreview v2 - External deps support - Thu Feb 5 13:45 CET 2026
