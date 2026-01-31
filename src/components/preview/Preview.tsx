"use client"

import { 
  SandpackProvider, 
  SandpackPreview, 
  SandpackCodeEditor,
  SandpackLayout 
} from '@codesandbox/sandpack-react'
import { Smartphone, Monitor, Server, Globe, Apple, Code, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AppType = 'WEB' | 'IOS' | 'ANDROID' | 'DESKTOP' | 'API'

/**
 * Normalize file paths: convert .tsx/.ts to .js for Sandpack compatibility
 */
export function normalizeFilesForSandpack(files: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {}
  
  for (const [path, content] of Object.entries(files)) {
    let normalizedPath = path
    
    // Convert TypeScript extensions to JS for Sandpack react template
    if (path === '/App.tsx' || path === '/App.ts') {
      normalizedPath = '/App.js'
    } else if (path.endsWith('.tsx')) {
      normalizedPath = path.replace(/\.tsx$/, '.js')
    } else if (path.endsWith('.ts') && !path.endsWith('.d.ts')) {
      normalizedPath = path.replace(/\.ts$/, '.js')
    }
    
    normalized[normalizedPath] = content
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
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl opacity-80">Start building something amazing!</p>
      </div>
    </div>
  )
}`,
    '/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; }`,
  },
  IOS: {
    '/App.js': `import React from 'react';

// iOS-style App Simulation
export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.statusBar}>
        <span>9:41</span>
        <span>📶 🔋</span>
      </div>
      <div style={styles.content}>
        <h1 style={styles.title}>My iOS App</h1>
        <p style={styles.subtitle}>Built with React Native</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    height: '100vh',
    backgroundColor: '#f2f2f7'
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600'
  },
  content: {
    padding: '20px',
    textAlign: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '17px',
    color: '#8e8e93'
  }
}`,
  },
  ANDROID: {
    '/App.js': `import React from 'react';

// Android Material Design Style
export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.appBar}>
        <span style={styles.appTitle}>My Android App</span>
      </div>
      <div style={styles.content}>
        <h1 style={styles.headline}>Hello Android!</h1>
        <p style={styles.body}>Built with React Native</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: 'Roboto, sans-serif',
    height: '100vh',
    backgroundColor: '#fafafa'
  },
  appBar: {
    backgroundColor: '#6200ee',
    padding: '16px',
    color: 'white'
  },
  appTitle: {
    fontSize: '20px',
    fontWeight: '500'
  },
  content: {
    padding: '16px',
    textAlign: 'center'
  },
  headline: {
    fontSize: '24px',
    fontWeight: '400',
    marginBottom: '8px'
  },
  body: {
    fontSize: '14px',
    color: '#757575'
  }
}`,
  },
  DESKTOP: {
    '/App.js': `import React from 'react';

// Desktop App Style (Electron-like)
export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.titleBar}>
        <span style={styles.title}>My Desktop App</span>
        <div style={styles.windowControls}>
          <span style={styles.control}>—</span>
          <span style={styles.control}>□</span>
          <span style={{...styles.control, backgroundColor: '#ff5f57'}}>×</span>
        </div>
      </div>
      <div style={styles.content}>
        <h1>Desktop Application</h1>
        <p>Built with Electron</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#1e1e1e',
    color: 'white',
    fontFamily: 'system-ui'
  },
  titleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#323232',
    borderBottom: '1px solid #404040'
  },
  title: {
    fontSize: '13px'
  },
  windowControls: {
    display: 'flex',
    gap: '8px'
  },
  control: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#3a3a3a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    cursor: 'pointer'
  },
  content: {
    padding: '40px',
    textAlign: 'center'
  }
}`,
  },
  API: {
    '/App.js': `import React from 'react';

// API Documentation Style
export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>API Documentation</h1>
      </div>
      <div style={styles.content}>
        <div style={styles.endpoint}>
          <span style={styles.method}>GET</span>
          <code style={styles.path}>/api/users</code>
        </div>
        <p style={styles.description}>Returns a list of users</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: 'monospace',
    height: '100vh',
    backgroundColor: '#0d1117',
    color: '#c9d1d9'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #30363d'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600'
  },
  content: {
    padding: '20px'
  },
  endpoint: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  method: {
    backgroundColor: '#238636',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600'
  },
  path: {
    fontSize: '14px'
  },
  description: {
    fontSize: '14px',
    color: '#8b949e'
  }
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

// Composant Preview principal
export function Preview({ files, appType, showCode = false, className }: PreviewProps) {
  // Normalize TypeScript files to JS for Sandpack
  const normalizedFiles = normalizeFilesForSandpack(files)
  
  // Merge with default files for the type
  const defaultFiles = DEFAULT_FILES[appType] || DEFAULT_FILES.WEB
  const mergedFiles = { ...defaultFiles, ...normalizedFiles }

  // Rendu du preview selon le type
  const renderPreview = () => {
    if (showCode) {
      return (
        <SandpackProvider
          template="react"
          files={mergedFiles}
          theme="auto"
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
        theme="auto"
      >
        <SandpackPreview 
          showNavigator={false}
          style={{ height: '100%', minHeight: '400px' }}
        />
      </SandpackProvider>
    )
  }

  return (
    <div className={cn("h-full min-h-[400px]", className)}>
      {renderPreview()}
    </div>
  )
}
