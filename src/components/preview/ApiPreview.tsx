"use client"

import { useState } from 'react'
import { SandpackProvider, SandpackCodeEditor } from '@codesandbox/sandpack-react'
import { Button } from '@/components/ui/button'
import { Play, Copy, Check } from 'lucide-react'

interface ApiPreviewProps {
  files: Record<string, string>
  showCode?: boolean
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description?: string
}

// Parse endpoints from the code (simple regex-based extraction)
function parseEndpoints(code: string): Endpoint[] {
  const endpoints: Endpoint[] = []
  
  // Look for common patterns like { method: 'GET', path: '/api/...' }
  const patterns = [
    /method:\s*['"](\w+)['"]\s*,\s*path:\s*['"]([^'"]+)['"]/gi,
    /['"](\w+)['"]\s*,\s*['"]([/\w:]+)['"]/gi,
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(code)) !== null) {
      const method = match[1].toUpperCase() as Endpoint['method']
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        endpoints.push({ method, path: match[2] })
      }
    }
  }
  
  // Default endpoints if none found
  if (endpoints.length === 0) {
    return [
      { method: 'GET', path: '/api/users', description: 'List all users' },
      { method: 'POST', path: '/api/users', description: 'Create user' },
      { method: 'GET', path: '/api/users/:id', description: 'Get user by ID' },
      { method: 'PUT', path: '/api/users/:id', description: 'Update user' },
      { method: 'DELETE', path: '/api/users/:id', description: 'Delete user' },
    ]
  }
  
  return endpoints
}

const METHOD_COLORS = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-yellow-500',
  DELETE: 'bg-red-500',
  PATCH: 'bg-purple-500',
}

export function ApiPreview({ files, showCode = false }: ApiPreviewProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const code = Object.values(files).join('\n')
  const endpoints = parseEndpoints(code)

  if (showCode) {
    return (
      <SandpackProvider template="react" files={files} theme="auto">
        <SandpackCodeEditor style={{ height: '100%' }} showLineNumbers showTabs />
      </SandpackProvider>
    )
  }

  const handleTest = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint)
    // Simulate API response
    const mockResponses: Record<string, unknown> = {
      GET: { success: true, data: [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }] },
      POST: { success: true, data: { id: 3, name: 'New User' }, message: 'Created' },
      PUT: { success: true, data: { id: 1, name: 'Updated User' }, message: 'Updated' },
      DELETE: { success: true, message: 'Deleted' },
      PATCH: { success: true, data: { id: 1, name: 'Patched User' }, message: 'Patched' },
    }
    setResponse(JSON.stringify(mockResponses[endpoint.method], null, 2))
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          📡 API Documentation
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {endpoints.length} endpoints available
        </p>
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {endpoints.map((endpoint, i) => (
            <div 
              key={i}
              className={`
                bg-gray-800 rounded-lg p-4 border transition-colors cursor-pointer
                ${selectedEndpoint === endpoint 
                  ? 'border-blue-500' 
                  : 'border-gray-700 hover:border-gray-600'}
              `}
              onClick={() => handleTest(endpoint)}
            >
              <div className="flex items-center gap-3">
                <span className={`${METHOD_COLORS[endpoint.method]} text-xs font-bold px-2 py-1 rounded`}>
                  {endpoint.method}
                </span>
                <code className="text-green-400 flex-1 font-mono text-sm">
                  {endpoint.path}
                </code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-gray-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTest(endpoint)
                  }}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Test
                </Button>
              </div>
              {endpoint.description && (
                <p className="text-gray-500 text-sm mt-2">{endpoint.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Response Panel */}
      {response && (
        <div className="border-t border-gray-700 p-4 bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">
              Response {selectedEndpoint && `• ${selectedEndpoint.method} ${selectedEndpoint.path}`}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => handleCopy(response)}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <pre className="bg-gray-900 rounded-lg p-3 text-sm font-mono text-green-400 overflow-auto max-h-40">
            {response}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 text-center text-xs text-gray-500">
        🚀 Deploy to get real API endpoints
      </div>
    </div>
  )
}
