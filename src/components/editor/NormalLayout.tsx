"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react'

interface NormalLayoutProps {
  previewComponent: React.ReactNode
  chatComponent: React.ReactNode
  className?: string
}

export function NormalLayout({
  previewComponent,
  chatComponent,
  className
}: NormalLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  
  return (
    <div className={cn("h-full relative overflow-hidden", className)}>
      {/* Full-screen Preview */}
      <div className="h-full">
        {previewComponent}
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
