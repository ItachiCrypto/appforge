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
  
  // FIX BUG #4: Enhanced regex to capture more formats
  // Matches: ```tsx, ```tsx filename="App.tsx", ```react, with optional leading whitespace
  const codeBlockRegex = /^[ \t]*```(tsx|jsx|typescript|javascript|ts|js|react)?(?:\s+filename=["']([^"']+)["'])?\s*([\s\S]*?)^[ \t]*```/gm
  const files: Record<string, string> = {}
  let match
  let index = 0
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = match[1] || ''
    const explicitFilename = match[2]
    let code = match[3].trim()
    
    // Skip empty or very short blocks
    if (code.length < 20) continue
    
    // FIX BUG #4: Check for // filename: comment at the start of code
    let fileName: string | null = null
    
    if (explicitFilename) {
      // Explicit filename from ```tsx filename="App.tsx"
      fileName = explicitFilename.startsWith('/') ? explicitFilename : '/' + explicitFilename
    } else {
      // Try to extract filename from comment
      const filenameCommentMatch = code.match(/^\/\/\s*(?:filename|file|path):\s*([^\n]+)/i)
      if (filenameCommentMatch) {
        const extractedName = filenameCommentMatch[1].trim()
        fileName = extractedName.startsWith('/') ? extractedName : '/' + extractedName
        // Remove the comment from code
        code = code.replace(/^\/\/\s*(?:filename|file|path):\s*[^\n]+\n?/i, '').trim()
      }
    }
    
    // Check if it looks like a React component or valid code
    if (code.includes('export') || code.includes('function') || code.includes('const') || code.includes('import')) {
      // Determine extension based on language if no explicit filename
      if (!fileName) {
        let ext = '.tsx'
        if (lang === 'js' || lang === 'javascript') {
          ext = '.js'
        } else if (lang === 'ts' || lang === 'typescript') {
          ext = '.ts'
        } else if (lang === 'jsx') {
          ext = '.jsx'
        }
        fileName = index === 0 ? `/App${ext}` : `/Component${index}${ext}`
      }
      
      files[fileName] = code
      index++
    }
  }
  
  if (Object.keys(files).length > 0) {
    return { files }
  }
  
  return null
}
