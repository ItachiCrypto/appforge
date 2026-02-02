"use client"

import { useEditorStore, type EditorMode } from '@/stores/editor'
import { cn } from '@/lib/utils'
import { Code2, Eye } from 'lucide-react'

interface ModeToggleProps {
  className?: string
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { mode, setMode } = useEditorStore()

  return (
    <div className={cn(
      "inline-flex items-center rounded-lg bg-muted p-1",
      className
    )}>
      <ModeButton
        mode="normal"
        currentMode={mode}
        onClick={() => setMode('normal')}
        icon={<Eye className="w-4 h-4" />}
        label="Normal"
      />
      <ModeButton
        mode="expert"
        currentMode={mode}
        onClick={() => setMode('expert')}
        icon={<Code2 className="w-4 h-4" />}
        label="Expert"
      />
    </div>
  )
}

interface ModeButtonProps {
  mode: EditorMode
  currentMode: EditorMode
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function ModeButton({ mode, currentMode, onClick, icon, label }: ModeButtonProps) {
  const isActive = mode === currentMode

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  )
}

export default ModeToggle
