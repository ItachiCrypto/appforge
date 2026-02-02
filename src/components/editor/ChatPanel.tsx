"use client"

import { useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2, Sparkles, Hammer } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  codeOutput?: { files: Record<string, string> }
}

interface ChatPanelProps {
  messages: Message[]
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSend: () => void
  className?: string
  compact?: boolean
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
  className,
  compact = false
}: ChatPanelProps) {
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className={cn(
                "mx-auto mb-3 opacity-50",
                compact ? "w-8 h-8" : "w-10 h-10"
              )} />
              <p className={cn("font-medium", compact && "text-sm")}>
                Décris ton app
              </p>
              <p className={cn("text-sm", compact && "text-xs")}>
                Je la construis pour toi ✨
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 animate-fade-in-up",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <Avatar className={cn(compact ? "w-6 h-6" : "w-7 h-7", "shrink-0")}>
                {message.role === 'user' ? (
                  <>
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="text-xs">
                      {user?.firstName?.[0] || 'U'}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Sparkles className="w-3 h-3" />
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div
                className={cn(
                  "rounded-lg px-3 py-2 max-w-[85%]",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}
              >
                <p className={cn(
                  "whitespace-pre-wrap",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {message.content}
                </p>
                {message.codeOutput && (
                  <div className={cn(
                    "mt-2 flex items-center gap-1.5 text-green-600 dark:text-green-400",
                    compact ? "text-[10px]" : "text-xs"
                  )}>
                    <Sparkles className="w-3 h-3" />
                    <span>Code mis à jour !</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2">
              <Avatar className={cn(compact ? "w-6 h-6" : "w-7 h-7")}>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Hammer className={cn(
                    "text-primary",
                    compact ? "w-4 h-4" : "w-5 h-5",
                    "animate-bounce"
                  )} />
                  <span className={cn(
                    "text-muted-foreground",
                    compact ? "text-xs" : "text-sm"
                  )}>
                    Je construis...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className={cn("border-t shrink-0", compact ? "p-2" : "p-3")}>
        <div className="flex gap-2">
          <Input
            placeholder="Décris ce que tu veux..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className={compact ? "text-sm h-8" : ""}
          />
          <Button 
            size={compact ? "sm" : "icon"}
            onClick={onSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className={cn(compact ? "w-3 h-3" : "w-4 h-4", "animate-spin")} />
            ) : (
              <Send className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
