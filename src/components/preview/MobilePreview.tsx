"use client"

import { SandpackProvider, SandpackPreview, SandpackCodeEditor } from '@codesandbox/sandpack-react'
import { cn } from '@/lib/utils'

interface MobilePreviewProps {
  files: Record<string, string>
  showCode?: boolean
  type: 'IOS' | 'ANDROID'
}

export function MobilePreview({ files, showCode = false, type }: MobilePreviewProps) {
  const isIOS = type === 'IOS'
  
  if (showCode) {
    return (
      <SandpackProvider template="react" files={files} theme="auto">
        <SandpackCodeEditor style={{ height: '100%' }} showLineNumbers showTabs />
      </SandpackProvider>
    )
  }

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
            ? "w-[120px] h-[30px] bg-black rounded-b-2xl" // Dynamic Island
            : "w-full h-[24px] bg-black/80" // Android status
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
          <SandpackProvider
            template="react"
            files={files}
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
        </div>

        {/* Home Indicator (iOS) / Navigation Bar (Android) */}
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
