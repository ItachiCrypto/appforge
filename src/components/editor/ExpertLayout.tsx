"use client"

import { useCallback } from 'react'
import { 
  Panel, 
  PanelGroup, 
  PanelResizeHandle 
} from 'react-resizable-panels'
import { useEditorStore } from '@/stores/editor'
import { FileExplorer } from './FileExplorer'
import { FileTabs } from './FileTabs'
import { CodeEditor } from './CodeEditor'
import { cn } from '@/lib/utils'

interface ExpertLayoutProps {
  files: Record<string, string>
  onFileChange?: (path: string, content: string) => void
  previewComponent: React.ReactNode
  chatComponent: React.ReactNode
  className?: string
}

function ResizeHandle({ className }: { className?: string }) {
  return (
    <PanelResizeHandle 
      className={cn(
        "w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize",
        "relative after:absolute after:inset-y-0 after:-left-1 after:-right-1",
        className
      )}
    />
  )
}

export function ExpertLayout({
  files,
  onFileChange,
  previewComponent,
  chatComponent,
  className
}: ExpertLayoutProps) {
  const { panelSizes, setPanelSizes } = useEditorStore()
  
  const handleLayoutChange = useCallback((sizes: number[]) => {
    if (sizes.length >= 3) {
      setPanelSizes({
        fileExplorer: sizes[0],
        editor: sizes[1],
        preview: sizes[2],
      })
    }
  }, [setPanelSizes])
  
  return (
    <div className={cn("h-full flex flex-col", className)}>
      <PanelGroup 
        direction="horizontal" 
        onLayout={handleLayoutChange}
        className="flex-1"
      >
        {/* File Explorer Panel */}
        <Panel 
          defaultSize={panelSizes.fileExplorer}
          minSize={10}
          maxSize={25}
          className="bg-background border-r"
        >
          <FileExplorer files={files} className="h-full" />
        </Panel>
        
        <ResizeHandle />
        
        {/* Editor Panel */}
        <Panel 
          defaultSize={panelSizes.editor}
          minSize={20}
          className="flex flex-col bg-background"
        >
          <FileTabs className="shrink-0" />
          <div className="flex-1 min-h-0">
            <CodeEditor 
              files={files}
              onFileChange={onFileChange}
            />
          </div>
        </Panel>
        
        <ResizeHandle />
        
        {/* Preview Panel */}
        <Panel 
          defaultSize={panelSizes.preview}
          minSize={20}
          className="flex flex-col bg-background border-l"
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            {previewComponent}
          </div>
          {/* Chat at bottom of preview panel */}
          <div className="h-[250px] border-t shrink-0 overflow-hidden">
            {chatComponent}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}

export default ExpertLayout
