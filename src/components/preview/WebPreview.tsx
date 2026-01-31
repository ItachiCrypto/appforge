"use client"

import { SandpackProvider, SandpackPreview, SandpackCodeEditor } from '@codesandbox/sandpack-react'

interface WebPreviewProps {
  files: Record<string, string>
  showCode?: boolean
}

export function WebPreview({ files, showCode = false }: WebPreviewProps) {
  return (
    <SandpackProvider
      template="react"
      files={files}
      theme="auto"
      options={{
        externalResources: [
          "https://cdn.tailwindcss.com",
        ],
      }}
    >
      {showCode ? (
        <SandpackCodeEditor 
          style={{ height: '100%' }}
          showLineNumbers
          showTabs
        />
      ) : (
        <SandpackPreview 
          style={{ height: '100%' }}
          showNavigator={false}
          showRefreshButton
        />
      )}
    </SandpackProvider>
  )
}
