/**
 * BMAD Story Parser
 * 
 * Parses the Epics & Stories markdown document to extract
 * structured story data for the automated build pipeline.
 */

export interface Story {
  epicId: string
  epicTitle: string
  storyId: string
  title: string
  description: string
  acceptanceCriteria: string[]
  files: string[]
  status: 'pending' | 'building' | 'done' | 'error'
}

export interface Epic {
  id: string
  title: string
  objective: string
  stories: Story[]
}

// Helper to get all matches from a regex
function getAllMatches(str: string, regex: RegExp): RegExpExecArray[] {
  const matches: RegExpExecArray[] = []
  let match: RegExpExecArray | null
  // Reset regex
  const re = new RegExp(regex.source, regex.flags)
  while ((match = re.exec(str)) !== null) {
    matches.push(match)
  }
  return matches
}

/**
 * Parse the Epics & Stories markdown into structured data
 */
export function parseEpicsMarkdown(markdown: string): Epic[] {
  const epics: Epic[] = []
  
  if (!markdown) return epics
  
  // Split by Epic headers (## 🎯 Epic X: or ## Epic X:)
  const epicRegex = /##\s*(?:🎯\s*)?Epic\s*(\d+)\s*:\s*(.+?)(?=\n)/gi
  const epicMatches = getAllMatches(markdown, epicRegex)
  
  for (let i = 0; i < epicMatches.length; i++) {
    const match = epicMatches[i]
    const epicNum = match[1]
    const epicTitle = match[2].trim()
    const startIndex = match.index! + match[0].length
    const endIndex = epicMatches[i + 1]?.index ?? markdown.length
    const epicContent = markdown.slice(startIndex, endIndex)
    
    // Extract objective
    const objectiveMatch = epicContent.match(/\*\*Objectif\*\*\s*:\s*(.+?)(?=\n)/i)
    const objective = objectiveMatch?.[1]?.trim() || ''
    
    // Parse stories within this epic
    const stories = parseStoriesFromEpicContent(epicContent, epicNum, epicTitle)
    
    epics.push({
      id: epicNum,
      title: epicTitle,
      objective,
      stories,
    })
  }
  
  return epics
}

/**
 * Parse stories from an epic's content
 */
function parseStoriesFromEpicContent(content: string, epicId: string, epicTitle: string): Story[] {
  const stories: Story[] = []
  
  // Match story headers: ### Story X.Y: Title or ### Story X.Y - Title
  const storyRegex = /###\s*Story\s*(\d+\.\d+)\s*[:\-]\s*(.+?)(?=\n)/gi
  const storyMatches = getAllMatches(content, storyRegex)
  
  for (let i = 0; i < storyMatches.length; i++) {
    const match = storyMatches[i]
    const storyId = match[1]
    const title = match[2].trim()
    const startIndex = match.index! + match[0].length
    const endIndex = storyMatches[i + 1]?.index ?? content.length
    const storyContent = content.slice(startIndex, endIndex)
    
    // Extract description (use [\s\S] instead of 's' flag for cross-line matching)
    const descMatch = storyContent.match(/\*\*Description\*\*\s*:\s*([\s\S]+?)(?=\n\s*\*\*|\n\s*-\s*\[)/i)
    const description = descMatch?.[1]?.trim() || ''
    
    // Extract acceptance criteria (checkboxes or bullet points)
    const criteriaMatches = getAllMatches(storyContent, /-\s*\[[\sx]\]\s*(.+?)(?=\n|$)/gi)
    const acceptanceCriteria = criteriaMatches.map(m => m[1].trim())
    
    // If no checkboxes, try regular bullets under "Critères d'acceptation"
    if (acceptanceCriteria.length === 0) {
      const criteriaSection = storyContent.match(/critères?\s*d['']acceptation[^:]*:\s*([\s\S]*?)(?=\n\s*\*\*|\n\s*###|$)/i)
      if (criteriaSection) {
        const bullets = getAllMatches(criteriaSection[1], /-\s*(.+?)(?=\n|$)/gi)
        acceptanceCriteria.push(...bullets.map(m => m[1].trim()))
      }
    }
    
    // Extract files to create/modify
    const filesSection = storyContent.match(/fichiers?\s*(?:à\s*)?(?:créer|modifier)[^:]*:\s*([\s\S]*?)(?=\n\s*\*\*|\n\s*###|$)/i)
    let files: string[] = []
    if (filesSection) {
      const fileMatches = getAllMatches(filesSection[1], /`([^`]+)`/g)
      files = fileMatches.map(m => m[1])
      
      // Also try bullet points with file paths
      if (files.length === 0) {
        const bulletFiles = getAllMatches(filesSection[1], /-\s*(.+?)(?=\n|$)/gi)
        files = bulletFiles.map(m => m[1].trim().replace(/`/g, ''))
      }
    }
    
    // Fallback: look for any file paths mentioned
    if (files.length === 0) {
      const anyFiles = getAllMatches(storyContent, /`(\/[^`]+\.(?:js|jsx|ts|tsx|css|json))`/g)
      files = anyFiles.map(m => m[1])
    }
    
    stories.push({
      epicId,
      epicTitle,
      storyId,
      title,
      description,
      acceptanceCriteria,
      files,
      status: 'pending',
    })
  }
  
  return stories
}

/**
 * Get all stories from epics as a flat array
 */
export function getAllStories(epics: Epic[]): Story[] {
  return epics.flatMap(epic => epic.stories)
}

/**
 * Get the next pending story
 */
export function getNextPendingStory(stories: Story[]): Story | null {
  return stories.find(s => s.status === 'pending') || null
}

/**
 * Build prompt for implementing a specific story
 */
export function buildStoryPrompt(story: Story, isFirstStory: boolean): string {
  const criteriaList = story.acceptanceCriteria.length > 0
    ? story.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')
    : '- [ ] Fonctionnalité implémentée et fonctionnelle'
  
  const filesList = story.files.length > 0
    ? story.files.map(f => `- \`${f}\``).join('\n')
    : '- Fichiers selon l\'architecture définie'
  
  const firstStoryNote = isFirstStory
    ? `\n\n⚠️ C'est la PREMIÈRE story. Crée d'abord la structure de fichiers de base selon l'Architecture, puis implémente cette story.`
    : ''
  
  return `## 🎯 Implémente UNIQUEMENT: Story ${story.storyId}

**Epic**: ${story.epicId} - ${story.epicTitle}
**Story**: ${story.storyId} - ${story.title}

### Description
${story.description || 'Voir les critères d\'acceptation ci-dessous.'}

### Critères d'acceptation
${criteriaList}

### Fichiers à créer/modifier
${filesList}

---

**RÈGLES STRICTES:**
1. Implémente UNIQUEMENT cette story, pas les suivantes
2. Vérifie chaque critère d'acceptation
3. Le code doit être complet et fonctionnel
4. Utilise les patterns définis dans l'Architecture
5. Appelle \`write_file\` pour chaque fichier${firstStoryNote}

Commence maintenant.`
}

/**
 * Count stories by status
 */
export function countStoriesByStatus(stories: Story[]): {
  total: number
  pending: number
  building: number
  done: number
  error: number
} {
  return {
    total: stories.length,
    pending: stories.filter(s => s.status === 'pending').length,
    building: stories.filter(s => s.status === 'building').length,
    done: stories.filter(s => s.status === 'done').length,
    error: stories.filter(s => s.status === 'error').length,
  }
}
