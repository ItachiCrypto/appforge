"use client"

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-muted/30 rounded-lg">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <h3 className="font-medium text-lg mb-1">Oups, une erreur est survenue</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || 'Une erreur inattendue est survenue'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={this.handleReset}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use
interface ErrorFallbackProps {
  error?: Error | null
  message?: string
  onRetry?: () => void
}

export function ErrorFallback({ error, message, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-muted/30 rounded-lg">
      <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
      <h3 className="font-medium text-lg mb-1">Oups, une erreur est survenue</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {message || error?.message || 'Une erreur inattendue est survenue'}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      )}
    </div>
  )
}
