"use client"

import { SandpackProvider, SandpackPreview, SandpackCodeEditor } from '@codesandbox/sandpack-react'

interface DesktopPreviewProps {
  files: Record<string, string>
  showCode?: boolean
}

export function DesktopPreview({ files, showCode = false }: DesktopPreviewProps) {
  if (showCode) {
    return (
      <SandpackProvider template="react" files={files} theme="auto">
        <SandpackCodeEditor style={{ height: '100%' }} showLineNumbers showTabs />
      </SandpackProvider>
    )
  }

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
