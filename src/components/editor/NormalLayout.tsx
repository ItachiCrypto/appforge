"use client"

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  X,
  Maximize2,
  Minimize2,
  FolderOpen,
  FileCode,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface NormalLayoutProps {
  files?: Record<string, string>
  previewComponent: React.ReactNode
  chatComponent: React.ReactNode
  className?: string
}

// Simple file icon based on extension
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const colorMap: Record<string, string> = {
    js: 'text-yellow-500',
    jsx: 'text-yellow-500',
    ts: 'text-blue-500',
    tsx: 'text-blue-500',
    css: 'text-purple-500',
    json: 'text-yellow-600',
    html: 'text-orange-500',
  }
  return <FileCode className={cn("w-4 h-4", colorMap[ext || ''] || 'text-gray-400')} />
}

export function NormalLayout({
  files = {},
  previewComponent,
  chatComponent,
  className
}: NormalLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [isFilesOpen, setIsFilesOpen] = useState(false)

  // Get list of files
  const fileList = useMemo(() => {
    return Object.keys(files)
      .map(path => ({
        path,
        name: path.split('/').pop() || path,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [files])

  const fileCount = fileList.length

  return (
    <div className={cn("h-full relative overflow-hidden", className)}>
      {/* Full-screen Preview */}
      <div className="h-full">
        {previewComponent}
      </div>

      {/* Files Toggle Button (left side) */}
      {fileCount > 0 && !isFilesOpen && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-4 left-4 shadow-lg gap-2"
          onClick={() => setIsFilesOpen(true)}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-xs font-medium">{fileCount} fichiers</span>
          <ChevronRight className="w-3 h-3" />
        </Button>
      )}

      {/* Files Drawer (left side) */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[220px] bg-background/95 backdrop-blur-sm border-r shadow-xl",
          "transition-all duration-300 ease-in-out flex flex-col",
          isFilesOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Files Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">Fichiers</span>
            <span className="text-xs text-muted-foreground">({fileCount})</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsFilesOpen(false)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-auto py-2">
          {fileList.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Aucun fichier
            </div>
          ) : (
            <div className="space-y-0.5">
              {fileList.map(file => (
                <div
                  key={file.path}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 cursor-default"
                  title={file.path}
                >
                  {getFileIcon(file.name)}
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hint to switch to Expert mode */}
        <div className="px-3 py-2 border-t bg-muted/30">
          <p className="text-[10px] text-muted-foreground">
            Mode Expert pour éditer le code
          </p>
        </div>
      </div>

      {/* Chat Toggle Button (when chat is closed) */}
      {!isChatOpen && (
        <Button
          size="icon"
          className="absolute bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
      )}

      {/* Chat Drawer/Sidebar */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 bg-background border-l shadow-xl",
          "transition-all duration-300 ease-in-out flex flex-col",
          isChatOpen ? "translate-x-0" : "translate-x-full",
          isChatExpanded ? "w-[600px]" : "w-[380px]"
        )}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <span className="font-medium text-sm">Chat with AI</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsChatExpanded(!isChatExpanded)}
            >
              {isChatExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsChatOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {chatComponent}
        </div>
      </div>
    </div>
  )
}

export default NormalLayout
