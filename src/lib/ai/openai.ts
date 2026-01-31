import OpenAI from 'openai'

export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY
  
  if (!key) {
    throw new Error('OpenAI API key is required')
  }
  
  return new OpenAI({
    apiKey: key,
  })
}

export async function streamChat(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey?: string
) {
  const openai = getOpenAIClient(apiKey)
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 4000,
  })
  
  return stream
}

export function parseCodeBlocks(content: string): { files: Record<string, string> } | null {
  const regex = /```appforge\s*([\s\S]*?)```/g
  const match = regex.exec(content)
  
  if (!match) return null
  
  try {
    const parsed = JSON.parse(match[1].trim())
    return parsed
  } catch (e) {
    console.error('Failed to parse code block:', e)
    return null
  }
}
