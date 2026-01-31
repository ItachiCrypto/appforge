import { create } from 'zustand';
import type { Message } from '@/types';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  previewHtml: string | null;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
  setMessages: (messages: Message[]) => void;
  setStreaming: (streaming: boolean) => void;
  setPreview: (html: string | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  previewHtml: null,
  
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        } as Message,
      ],
    })),
  
  setMessages: (messages) => set({ messages }),
  
  setStreaming: (isStreaming) => set({ isStreaming }),
  
  setPreview: (previewHtml) => set({ previewHtml }),
  
  clearChat: () => set({ messages: [], previewHtml: null }),
}));

interface UIState {
  sidebarOpen: boolean;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  activeTab: 'chat' | 'code' | 'settings';
  toggleSidebar: () => void;
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  setActiveTab: (tab: 'chat' | 'code' | 'settings') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  previewDevice: 'desktop',
  activeTab: 'chat',
  
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setPreviewDevice: (previewDevice) => set({ previewDevice }),
  
  setActiveTab: (activeTab) => set({ activeTab }),
}));
