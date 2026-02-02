"use client"

import { 
  SandpackProvider, 
  SandpackPreview, 
  SandpackCodeEditor,
  SandpackLayout 
} from '@codesandbox/sandpack-react'
import { Smartphone, Monitor, Server, Globe, Apple } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    let normalizedContent = content
    
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
      // Remove tailwind CSS imports
      .replace(/^import\s+['"]tailwindcss\/.*['"];?\s*$/gm, '// Tailwind loaded via CDN')
      .replace(/^import\s+['"]\.\/.*\.css['"];?\s*$/gm, '') // Remove local CSS imports (optional)
      // Remove React import (Sandpack provides it globally)
      .replace(/^import\s+React\s+from\s+['"]react['"];?\s*$/gm, '')
      .replace(/^import\s+\{\s*\}\s+from\s+['"]react['"];?\s*$/gm, '')
    
    normalized[normalizedPath] = normalizedContent
  }
  
  return normalized
}

interface PreviewProps {
  files: Record<string, string>
  appType: AppType
  showCode?: boolean
  className?: string
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

// Sandpack dark theme
const darkTheme = {
  colors: {
    surface1: '#1e1e2e',
    surface2: '#313244',
    surface3: '#45475a',
    clickable: '#cdd6f4',
    base: '#cdd6f4',
    disabled: '#6c7086',
    hover: '#f5e0dc',
    accent: '#cba6f7',
    error: '#f38ba8',
    errorSurface: '#45475a',
  },
  syntax: {
    plain: '#cdd6f4',
    comment: { color: '#6c7086', fontStyle: 'italic' },
    keyword: '#cba6f7',
    tag: '#f38ba8',
    punctuation: '#9399b2',
    definition: '#89b4fa',
    property: '#89dceb',
    static: '#fab387',
    string: '#a6e3a1',
  },
  font: {
    body: 'system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    size: '13px',
    lineHeight: '1.6',
  },
}

// Composant Preview principal
export function Preview({ files, appType, showCode = false, className }: PreviewProps) {
  // Normalize TypeScript files to JS for Sandpack
  const normalizedFiles = normalizeFilesForSandpack(files)
  
  // Merge with default files for the type
  const defaultFiles = DEFAULT_FILES[appType] || DEFAULT_FILES.WEB
  const mergedFiles = { ...defaultFiles, ...normalizedFiles }

  // Common Sandpack setup with Tailwind CSS via CDN
  const sandpackSetup = {
    dependencies: {},
    // Load Tailwind CSS via CDN - no npm install needed
    externalResources: [
      'https://cdn.tailwindcss.com',
    ],
  }

  // Rendu du preview selon le type
  const renderPreview = () => {
    if (showCode) {
      return (
        <SandpackProvider
          template="react"
          files={mergedFiles}
          theme={darkTheme}
          customSetup={sandpackSetup}
          options={{
            externalResources: sandpackSetup.externalResources,
          }}
        >
          <SandpackLayout>
            <SandpackCodeEditor 
              showTabs 
              showLineNumbers 
              style={{ height: '100%', minHeight: '400px' }}
            />
            <SandpackPreview 
              showNavigator={false}
              style={{ height: '100%', minHeight: '400px' }}
            />
          </SandpackLayout>
        </SandpackProvider>
      )
    }

    return (
      <SandpackProvider
        template="react"
        files={mergedFiles}
        theme={darkTheme}
        customSetup={sandpackSetup}
        options={{
          externalResources: sandpackSetup.externalResources,
        }}
      >
        <SandpackPreview 
          showNavigator={false}
          showRefreshButton={false}
          style={{ height: '100%', minHeight: '400px' }}
        />
      </SandpackProvider>
    )
  }

  return (
    <div className={cn("h-full min-h-[400px] rounded-lg overflow-hidden", className)}>
      {renderPreview()}
    </div>
  )
}
