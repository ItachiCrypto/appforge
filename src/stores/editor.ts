import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EditorMode = 'normal' | 'expert'

interface EditorState {
  // Mode (persisted to localStorage)
  mode: EditorMode
  setMode: (mode: EditorMode) => void
  toggleMode: () => void
  
  // Current file being edited
  activeFile: string | null
  setActiveFile: (file: string | null) => void
  
  // Open tabs
  openTabs: string[]
  openTab: (file: string) => void
  closeTab: (file: string) => void
  
  // File explorer state
  expandedFolders: Set<string>
  toggleFolder: (folder: string) => void
  
  // Panel sizes (persisted)
  panelSizes: {
    fileExplorer: number
    editor: number
    preview: number
  }
  setPanelSizes: (sizes: { fileExplorer?: number; editor?: number; preview?: number }) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Mode defaults to 'normal'
      mode: 'normal',
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ 
        mode: state.mode === 'normal' ? 'expert' : 'normal' 
      })),
      
      // Active file
      activeFile: null,
      setActiveFile: (file) => set({ activeFile: file }),
      
      // Tabs
      openTabs: [],
      openTab: (file) => set((state) => {
        if (!state.openTabs.includes(file)) {
          return { 
            openTabs: [...state.openTabs, file],
            activeFile: file 
          }
        }
        return { activeFile: file }
      }),
      closeTab: (file) => set((state) => {
        const newTabs = state.openTabs.filter(t => t !== file)
        const newActive = state.activeFile === file 
          ? newTabs[newTabs.length - 1] || null 
          : state.activeFile
        return { openTabs: newTabs, activeFile: newActive }
      }),
      
      // Folders
      expandedFolders: new Set<string>(),
      toggleFolder: (folder) => set((state) => {
        const newSet = new Set(state.expandedFolders)
        if (newSet.has(folder)) {
          newSet.delete(folder)
        } else {
          newSet.add(folder)
        }
        return { expandedFolders: newSet }
      }),
      
      // Panel sizes
      panelSizes: {
        fileExplorer: 15,
        editor: 45,
        preview: 40,
      },
      setPanelSizes: (sizes) => set((state) => ({
        panelSizes: { ...state.panelSizes, ...sizes }
      })),
    }),
    {
      name: 'appforge-editor-storage',
      partialize: (state) => ({ 
        mode: state.mode,
        panelSizes: state.panelSizes,
      }),
    }
  )
)
