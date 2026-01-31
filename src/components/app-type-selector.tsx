"use client"

import { Globe, Smartphone, Monitor, Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_TYPES, type AppTypeId } from '@/lib/constants'

interface AppTypeSelectorProps {
  value: AppTypeId
  onChange: (type: AppTypeId) => void
}

const ICONS: Record<string, React.ElementType> = {
  Globe,
  Smartphone,
  Monitor,
  Server,
}

export function AppTypeSelector({ value, onChange }: AppTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {APP_TYPES.map((type) => {
        const Icon = ICONS[type.icon] || Globe
        const isSelected = value === type.id
        
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={cn(
              "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all",
              "hover:scale-105 hover:shadow-lg",
              isSelected 
                ? "border-primary bg-primary/10 shadow-md" 
                : "border-muted hover:border-primary/50"
            )}
          >
            {/* Gradient Background on Selected */}
            {isSelected && (
              <div 
                className={cn(
                  "absolute inset-0 rounded-xl opacity-10 bg-gradient-to-br",
                  type.color
                )}
              />
            )}
            
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-gradient-to-br",
              type.color,
              "text-white"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            
            {/* Name */}
            <span className={cn(
              "font-medium text-sm",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {type.name}
            </span>
            
            {/* Description */}
            <span className="text-xs text-muted-foreground mt-0.5">
              {type.description}
            </span>
            
            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
