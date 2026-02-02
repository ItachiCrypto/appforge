// Template Files for AppForge Clone Apps
// Ces templates sont des apps complètes fonctionnant dans Sandpack

import notemasterCode from './notemaster.js?raw'
import monitortrackerCode from './moneytracker.js?raw'
import taskflowCode from './taskflow.js?raw'
import meetbookCode from './meetbook.js?raw'
import habitforgeCode from './habitforge.js?raw'

export const CLONE_TEMPLATES: Record<string, {
  code: string
  name: string
  savings: number
  original: string
}> = {
  notemaster: {
    code: notemasterCode,
    name: 'NoteMaster',
    savings: 96,
    original: 'Notion',
  },
  moneytracker: {
    code: monitortrackerCode,
    name: 'MoneyTracker',
    savings: 100,
    original: 'Finary',
  },
  taskflow: {
    code: taskflowCode,
    name: 'TaskFlow',
    savings: 48,
    original: 'Todoist',
  },
  meetbook: {
    code: meetbookCode,
    name: 'MeetBook',
    savings: 144,
    original: 'Calendly',
  },
  habitforge: {
    code: habitforgeCode,
    name: 'HabitForge',
    savings: 60,
    original: 'Habit Tracker Apps',
  },
}

export function getTemplateCode(templateId: string): string | null {
  return CLONE_TEMPLATES[templateId]?.code || null
}

export function isCloneTemplate(prompt: string): boolean {
  return prompt.startsWith('TEMPLATE_FILE:')
}

export function getCloneTemplateId(prompt: string): string | null {
  if (!isCloneTemplate(prompt)) return null
  return prompt.replace('TEMPLATE_FILE:', '')
}

// Total savings if user uses all clone templates
export const TOTAL_YEARLY_SAVINGS = Object.values(CLONE_TEMPLATES)
  .reduce((sum, t) => sum + t.savings, 0)
// = 448€/an!
