"use client"

import { 
  SandpackProvider, 
  SandpackPreview, 
  SandpackCodeEditor,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { Smartphone, Monitor, Server, Globe, Apple, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type AppType = 'WEB' | 'IOS' | 'ANDROID' | 'DESKTOP' | 'API'

/**
 * Clean up code for Sandpack compatibility:
 * - Convert .tsx/.ts to .js
 * - Remove problematic imports (tailwind css files, etc.)
 */
export function normalizeFilesForSandpack(files: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {}
  
  for (const [path, content] of Object.entries(files)) {
    let normalizedPath = path
    let normalizedContent = content || ''
    
    // Convert TypeScript extensions to JS for Sandpack react template
    if (path === '/App.tsx' || path === '/App.ts') {
      normalizedPath = '/App.js'
    } else if (path.endsWith('.tsx')) {
      normalizedPath = path.replace(/\.tsx$/, '.js')
    } else if (path.endsWith('.ts') && !path.endsWith('.d.ts')) {
      normalizedPath = path.replace(/\.ts$/, '.js')
    }
    
    // Remove problematic imports that Sandpack can't resolve
    // Tailwind is loaded via CDN, so we don't need these imports
    normalizedContent = normalizedContent
      // Remove ALL tailwind CSS imports (various formats)
      .replace(/^import\s+['"`]tailwindcss[^'"`]*['"`];?\s*$/gm, '')
      .replace(/^import\s+['"`]@tailwindcss[^'"`]*['"`];?\s*$/gm, '')
      .replace(/^import\s+['"`]\.\/tailwind[^'"`]*['"`];?\s*$/gm, '')
      .replace(/^import\s+['"`]\.\/styles\.css['"`];?\s*$/gm, '')
      .replace(/^import\s+['"`]\.\/index\.css['"`];?\s*$/gm, '')
      .replace(/^import\s+['"`]\.\/globals\.css['"`];?\s*$/gm, '')
      // Remove React imports (Sandpack provides React globally)
      .replace(/^import\s+React\s*,?\s*\{[^}]*\}\s+from\s+['"`]react['"`];?\s*$/gm, '')
      .replace(/^import\s+React\s+from\s+['"`]react['"`];?\s*$/gm, '')
      .replace(/^import\s+\{[^}]*\}\s+from\s+['"`]react['"`];?\s*$/gm, '')
      // Remove empty lines left by import removal
      .replace(/^\s*\n/gm, '\n')
      .replace(/^\n+/, '')
    
    normalized[normalizedPath] = normalizedContent
  }
  
  return normalized
}

interface PreviewProps {
  files: Record<string, string>
  appType: AppType
  showCode?: boolean
  className?: string
  onResetFiles?: () => void
}

// Templates par défaut pour chaque type
export const DEFAULT_FILES: Record<AppType, Record<string, string>> = {
  WEB: {
    '/App.js': `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Your App ✨
          </h1>
          <p className="text-xl text-white/80 mb-6">
            Start building something amazing!
          </p>
          <button className="bg-white text-purple-600 font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-all transform hover:scale-105">
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}`,
  },
  IOS: {
    '/App.js': `export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Status Bar */}
      <div className="bg-gray-100 px-6 py-2 flex justify-between items-center text-sm font-semibold">
        <span>9:41</span>
        <div className="flex gap-1">
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My iOS App</h1>
        <p className="text-gray-500 mb-8">Built with React Native</p>
        
        {/* Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
              📱
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Welcome</h3>
              <p className="text-gray-500 text-sm">Tap to continue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}`,
  },
  ANDROID: {
    '/App.js': `export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* App Bar */}
      <div className="bg-indigo-600 px-4 py-4 shadow-lg">
        <h1 className="text-xl font-medium text-white">My Android App</h1>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Hello Android!</h2>
          <p className="text-gray-600">Built with React Native</p>
        </div>
        
        {/* FAB */}
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-indigo-700 transition-colors">
          +
        </button>
      </div>
    </div>
  )
}`,
  },
  DESKTOP: {
    '/App.js': `export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Title Bar */}
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
        <span className="text-sm text-gray-300">My Desktop App</span>
        <div className="flex gap-2">
          <button className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400" />
          <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400" />
          <button className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Desktop Application</h1>
        <p className="text-gray-400 mb-6">Built with Electron</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-2">Feature 1</h3>
            <p className="text-sm text-gray-400">Description here</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-2">Feature 2</h3>
            <p className="text-sm text-gray-400">Description here</p>
          </div>
        </div>
      </div>
    </div>
  )
}`,
  },
  API: {
    '/App.js': `export default function App() {
  const endpoints = [
    { method: 'GET', path: '/api/users', desc: 'List all users' },
    { method: 'POST', path: '/api/users', desc: 'Create a user' },
    { method: 'GET', path: '/api/users/:id', desc: 'Get user by ID' },
    { method: 'DELETE', path: '/api/users/:id', desc: 'Delete user' },
  ]
  
  const methodColors = {
    GET: 'bg-green-500',
    POST: 'bg-blue-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="text-gray-500 text-sm">v1.0.0</p>
      </div>
      
      {/* Endpoints */}
      <div className="p-6 space-y-3">
        {endpoints.map((ep, i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <span className={\`\${methodColors[ep.method]} text-white text-xs font-bold px-2 py-1 rounded\`}>
                {ep.method}
              </span>
              <code className="text-gray-300">{ep.path}</code>
            </div>
            <p className="text-gray-500 text-sm">{ep.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}`,
  },
}

// Icônes par type d'app
export function AppTypeIcon({ type, className }: { type: AppType; className?: string }) {
  const icons = {
    WEB: Globe,
    IOS: Apple,
    ANDROID: Smartphone,
    DESKTOP: Monitor,
    API: Server,
  }
  const Icon = icons[type] || Globe
  return <Icon className={className} />
}

// Labels par type
export function getAppTypeLabel(type: AppType): string {
  const labels: Record<AppType, string> = {
    WEB: 'Web App',
    IOS: 'iOS App',
    ANDROID: 'Android App',
    DESKTOP: 'Desktop App',
    API: 'API Backend',
  }
  return labels[type] || 'App'
}

// Custom error screen component
function ErrorOverlay({ onReset }: { onReset?: () => void }) {
  const { sandpack } = useSandpack()
  const error = sandpack.error
  
  if (!error) return null
  
  return (
    <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center p-6 z-10">
      <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Preview Error</h3>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4 mb-4 max-h-40 overflow-auto">
          <code className="text-sm text-red-300 whitespace-pre-wrap break-words">
            {error.message || 'An error occurred while rendering the preview'}
          </code>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          The AI will automatically try to fix this error. You can also reset to the default template.
        </p>
        
        {onReset && (
          <Button 
            onClick={onReset}
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Files
          </Button>
        )}
      </div>
    </div>
  )
}

// Wrapper component that includes error handling
function PreviewWithErrorHandling({ onReset }: { onReset?: () => void }) {
  return (
    <div className="relative h-full">
      <ErrorOverlay onReset={onReset} />
      <SandpackPreview 
        showNavigator={false}
        showRefreshButton={false}
        showOpenInCodeSandbox={false}
        style={{ height: '100%', minHeight: '400px' }}
      />
    </div>
  )
}

// Composant Preview principal
export function Preview({ files, appType, showCode = false, className, onResetFiles }: PreviewProps) {
  // Normalize TypeScript files to JS for Sandpack AND clean imports
  const normalizedFiles = normalizeFilesForSandpack(files)
  
  // Merge with default files for the type (normalized files override defaults)
  const defaultFiles = DEFAULT_FILES[appType] || DEFAULT_FILES.WEB
  const mergedFiles = { ...defaultFiles, ...normalizedFiles }

  // Common Sandpack setup with Tailwind CSS via CDN
  const sandpackSetup = {
    dependencies: {},
  }

  // Rendu du preview selon le type
  const renderPreview = () => {
    if (showCode) {
      return (
        <SandpackProvider
          template="react"
          files={mergedFiles}
          theme="dark"
          customSetup={sandpackSetup}
          options={{
            externalResources: ['https://cdn.tailwindcss.com'],
          }}
        >
          <SandpackLayout>
            <SandpackCodeEditor 
              showTabs 
              showLineNumbers 
              style={{ height: '100%', minHeight: '400px' }}
            />
            <PreviewWithErrorHandling onReset={onResetFiles} />
          </SandpackLayout>
        </SandpackProvider>
      )
    }

    return (
      <SandpackProvider
        template="react"
        files={mergedFiles}
        theme="dark"
        customSetup={sandpackSetup}
        options={{
          externalResources: ['https://cdn.tailwindcss.com'],
        }}
      >
        <PreviewWithErrorHandling onReset={onResetFiles} />
      </SandpackProvider>
    )
  }

  return (
    <div className={cn("h-full min-h-[400px] rounded-lg overflow-hidden", className)}>
      {renderPreview()}
    </div>
  )
}
