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
      <div className="text-sm text-muted-foreground">Chargement de l'éditeur...</div>
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
  
  // BUG FIX #8: Store viewStates per file to preserve cursor/scroll position
  const viewStatesRef = useRef<Map<string, any>>(new Map())
  const previousFileRef = useRef<string | null>(null)
  
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
  
  // BUG FIX #8: Save viewState when switching files, restore when coming back
  useEffect(() => {
    if (!editorRef.current) return
    
    // Save the viewState of the previous file
    if (previousFileRef.current && previousFileRef.current !== activeFile) {
      try {
        const viewState = editorRef.current.saveViewState()
        if (viewState) {
          viewStatesRef.current.set(previousFileRef.current, viewState)
        }
      } catch (e) {
        // Editor might be disposed, ignore
      }
    }
    
    // Restore viewState of the new file (after Monaco updates content)
    if (activeFile) {
      // Use setTimeout to ensure Monaco has updated the model first
      setTimeout(() => {
        if (editorRef.current && activeFile) {
          const savedState = viewStatesRef.current.get(activeFile)
          if (savedState) {
            try {
              editorRef.current.restoreViewState(savedState)
            } catch (e) {
              // Ignore if state is stale
            }
          }
        }
      }, 0)
    }
    
    previousFileRef.current = activeFile
  }, [activeFile])
  
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined && onFileChange) {
      onFileChange(activeFile, value)
    }
  }, [activeFile, onFileChange])
  
  const handleEditorMount = useCallback((editor: any) => {
    editorRef.current = editor
    
    // BUG FIX #8: Restore viewState on mount if we have one
    if (activeFile) {
      const savedState = viewStatesRef.current.get(activeFile)
      if (savedState) {
        try {
          editor.restoreViewState(savedState)
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [activeFile])
  
  if (!activeFile) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full bg-muted/10 text-muted-foreground",
        className
      )}>
        <div className="text-center">
          <p className="text-sm">Sélectionne un fichier à éditer</p>
          <p className="text-xs mt-1">ou crée-en un nouveau</p>
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
