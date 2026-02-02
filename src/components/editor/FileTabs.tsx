"use client"

import { useEditorStore } from '@/stores/editor'
import { cn } from '@/lib/utils'
import { X, FileCode } from 'lucide-react'

interface FileTabsProps {
  className?: string
}

export function FileTabs({ className }: FileTabsProps) {
  const { openTabs, activeFile, setActiveFile, closeTab } = useEditorStore()
  
  if (openTabs.length === 0) {
    return null
  }
  
  return (
    <div className={cn(
      "flex items-center bg-muted/30 border-b overflow-x-auto",
      className
    )}>
      {openTabs.map(tab => {
        const isActive = tab === activeFile
        const filename = tab.split('/').pop() || tab
        
        return (
          <div
            key={tab}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm border-r cursor-pointer",
              "hover:bg-muted/50 transition-colors group",
              isActive 
                ? "bg-background text-foreground" 
                : "text-muted-foreground"
            )}
            onClick={() => setActiveFile(tab)}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{filename}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab)
              }}
              className={cn(
                "p-0.5 rounded hover:bg-muted ml-1",
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default FileTabs
