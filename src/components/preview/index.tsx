"use client"

// Re-export everything from Preview.tsx
export {
  Preview,
  normalizeFilesForSandpack,
  AppTypeIcon,
  getAppTypeLabel,
  DEFAULT_FILES,
  type AppType,
  type PreviewError,
} from './Preview'

// Also export as default
export { Preview as default } from './Preview'
