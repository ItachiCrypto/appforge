"use client"

import { useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '@/stores/editor'
import { cn } from '@/lib/utils'

// Dynamic import for Monaco to avoid SSR issues
import dynamic from 'next/dynamic'
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-muted/20">
      <div className="text-sm text-muted-foreground">Loading editor...</div>
    </div>
  )
})

interface CodeEditorProps {
  files: Record<string, string>
  onFileChange?: (path: string, content: string) => void
  className?: string
  readOnly?: boolean
}

// Get language from file extension
function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'css': 'css',
    'scss': 'scss',
    'html': 'html',
    'md': 'markdown',
    'py': 'python',
    'yaml': 'yaml',
    'yml': 'yaml',
  }
  
  return languageMap[ext || ''] || 'plaintext'
}

export function CodeEditor({ files, onFileChange, className, readOnly = false }: CodeEditorProps) {
  const { activeFile, openTabs, openTab } = useEditorStore()
  const editorRef = useRef<any>(null)
  
  // Get current file content
  const currentContent = activeFile ? files[activeFile] || '' : ''
  const currentLanguage = activeFile ? getLanguage(activeFile) : 'plaintext'
  
  // Auto-open first file if no active file
  useEffect(() => {
    if (!activeFile && Object.keys(files).length > 0) {
      const firstFile = Object.keys(files)[0]
      openTab(firstFile)
    }
  }, [files, activeFile, openTab])
  
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined && onFileChange) {
      onFileChange(activeFile, value)
    }
  }, [activeFile, onFileChange])
  
  const handleEditorMount = useCallback((editor: any) => {
    editorRef.current = editor
  }, [])
  
  if (!activeFile) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full bg-muted/10 text-muted-foreground",
        className
      )}>
        <div className="text-center">
          <p className="text-sm">Select a file to edit</p>
          <p className="text-xs mt-1">or create a new one</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("h-full", className)}>
      <MonacoEditor
        height="100%"
        language={currentLanguage}
        value={currentContent}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: true },
          fontSize: 13,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          folding: true,
          foldingHighlight: true,
          showFoldingControls: 'mouseover',
          bracketPairColorization: {
            enabled: true,
          },
          padding: {
            top: 8,
            bottom: 8,
          },
        }}
      />
    </div>
  )
}

export default CodeEditor
