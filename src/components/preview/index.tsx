"use client"

import React from 'react'

// Import components for local use in Preview component
import { WebPreview } from './WebPreview'
import { MobilePreview } from './MobilePreview'
import { DesktopPreview } from './DesktopPreview'
import { ApiPreview } from './ApiPreview'

// Re-export for external use
export { WebPreview, MobilePreview, DesktopPreview, ApiPreview }

// Types
export type AppType = 'WEB' | 'IOS' | 'ANDROID' | 'DESKTOP' | 'API'

/**
 * Normalize files for Sandpack: convert .tsx/.ts to .js
 * This ensures compatibility with Sandpack's react template
 */
export function normalizeFilesForSandpack(files: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {}
  
  for (const [path, content] of Object.entries(files)) {
    let normalizedPath = path
    
    // Convert TypeScript extensions to JS for Sandpack compatibility
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

// Default files for each type
import { DEFAULT_FILES_BY_TYPE } from '@/lib/constants'
export const DEFAULT_FILES = DEFAULT_FILES_BY_TYPE

// Icons and utilities
import { Globe, Smartphone, Monitor, Server } from 'lucide-react'

const APP_TYPE_CONFIG: Record<AppType, { icon: React.ElementType; label: string }> = {
  WEB: { icon: Globe, label: 'Web App' },
  IOS: { icon: Smartphone, label: 'iOS App' },
  ANDROID: { icon: Smartphone, label: 'Android App' },
  DESKTOP: { icon: Monitor, label: 'Desktop App' },
  API: { icon: Server, label: 'API / Backend' },
}

export function AppTypeIcon({ type, className }: { type: AppType; className?: string }) {
  const config = APP_TYPE_CONFIG[type] || APP_TYPE_CONFIG.WEB
  const Icon = config.icon
  return <Icon className={className} />
}

export function getAppTypeLabel(type: AppType): string {
  return APP_TYPE_CONFIG[type]?.label || 'Web App'
}

// Main Preview component that switches based on app type
interface PreviewProps {
  files: Record<string, string>
  appType: AppType
  showCode?: boolean
}

export function Preview({ files, appType, showCode = false }: PreviewProps) {
  switch (appType) {
    case 'IOS':
      return <MobilePreview files={files} showCode={showCode} type="IOS" />
    case 'ANDROID':
      return <MobilePreview files={files} showCode={showCode} type="ANDROID" />
    case 'DESKTOP':
      return <DesktopPreview files={files} showCode={showCode} />
    case 'API':
      return <ApiPreview files={files} showCode={showCode} />
    case 'WEB':
    default:
      return <WebPreview files={files} showCode={showCode} />
  }
}

export default Preview
