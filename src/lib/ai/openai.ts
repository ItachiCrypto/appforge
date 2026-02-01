import OpenAI from 'openai'

export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY
  
  if (!key) {
    throw new Error(
      'OpenAI API key required. Either set OPENAI_API_KEY in environment variables, ' +
      'or configure your own key (BYOK) in Settings → API Keys.'
    )
  }
  
  return new OpenAI({
    apiKey: key,
  })
}

export async function streamChat(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey?: string,
  model: string = 'gpt-4o'
) {
  const openai = getOpenAIClient(apiKey)
  
  const stream = await openai.chat.completions.create({
    model,
    messages,
    stream: true,
    stream_options: { include_usage: true },
    temperature: 0.7,
    max_tokens: 4000,
  })
  
  return stream
}

export function parseCodeBlocks(content: string): { files: Record<string, string> } | null {
  // Try appforge JSON format first
  const appforgeRegex = /```appforge\s*([\s\S]*?)```/g
  const appforgeMatch = appforgeRegex.exec(content)
  
  if (appforgeMatch) {
    try {
      const parsed = JSON.parse(appforgeMatch[1].trim())
      return parsed
    } catch (e) {
      console.error('Failed to parse appforge block:', e)
    }
  }
  
  // Fallback: parse tsx/jsx/javascript code blocks
  const codeBlockRegex = /```(?:tsx|jsx|typescript|javascript|ts|js)?\s*([\s\S]*?)```/g
  const files: Record<string, string> = {}
  let match
  let index = 0
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const code = match[1].trim()
    // Skip empty or very short blocks
    if (code.length < 20) continue
    
    // Check if it looks like a React component
    if (code.includes('export') || code.includes('function') || code.includes('const')) {
      // Use /App.tsx as default for the main component
      const fileName = index === 0 ? '/App.tsx' : `/Component${index}.tsx`
      files[fileName] = code
      index++
    }
  }
  
  if (Object.keys(files).length > 0) {
    return { files }
  }
  
  return null
}
