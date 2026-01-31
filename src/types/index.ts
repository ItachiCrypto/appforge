import type { App, Message, User } from '@prisma/client';

// Re-export Prisma types
export type { App, Message, User };

// Extended types
export type AppWithMessages = App & {
  messages: Message[];
};

export type AppWithCount = App & {
  _count: {
    messages: number;
  };
};

// API types
export interface ChatRequest {
  appId: string;
  message: string;
  history: Message[];
}

export interface ChatResponse {
  message: string;
  preview?: string;
  model: string;
  tokens?: number;
}

export interface GenerationRequest {
  appId: string;
  type: 'component' | 'page' | 'api' | 'schema';
  prompt: string;
}

export interface GenerationResponse {
  success: boolean;
  code?: string;
  error?: string;
}

// UI types
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  preview?: string;
}

// Plan types
export type PlanType = 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';

export interface PlanLimits {
  maxApps: number;
  monthlyCredits: number;
  customDomains: boolean;
  teamMembers: number;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxApps: 3,
    monthlyCredits: 1000,
    customDomains: false,
    teamMembers: 1,
    prioritySupport: false,
  },
  PRO: {
    maxApps: 10,
    monthlyCredits: 10000,
    customDomains: true,
    teamMembers: 1,
    prioritySupport: true,
  },
  TEAM: {
    maxApps: 50,
    monthlyCredits: 50000,
    customDomains: true,
    teamMembers: 5,
    prioritySupport: true,
  },
  ENTERPRISE: {
    maxApps: Infinity,
    monthlyCredits: Infinity,
    customDomains: true,
    teamMembers: Infinity,
    prioritySupport: true,
  },
};
