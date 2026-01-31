import { TEMPLATES, buildPrompt } from './prompts';

export interface GenerationResult {
  success: boolean;
  code?: string;
  error?: string;
  preview?: string;
}

export interface AppSpec {
  name: string;
  type: string;
  description: string;
  entities: string[];
  pages: string[];
  features: string[];
}

/**
 * Analyze user input and determine app specification
 */
export async function analyzeIntent(userMessage: string): Promise<AppSpec> {
  const lowerMessage = userMessage.toLowerCase();
  
  // Detect app type from keywords
  let type = 'custom';
  if (lowerMessage.includes('dashboard') || lowerMessage.includes('saas')) {
    type = 'saas';
  } else if (lowerMessage.includes('landing') || lowerMessage.includes('marketing')) {
    type = 'landing';
  } else if (lowerMessage.includes('blog') || lowerMessage.includes('article')) {
    type = 'blog';
  } else if (lowerMessage.includes('shop') || lowerMessage.includes('ecommerce') || lowerMessage.includes('store')) {
    type = 'ecommerce';
  } else if (lowerMessage.includes('portfolio') || lowerMessage.includes('showcase')) {
    type = 'portfolio';
  }
  
  const template = TEMPLATES[type as keyof typeof TEMPLATES] || {
    description: 'Custom application',
    entities: ['Item'],
    pages: ['/', '/dashboard'],
  };
  
  return {
    name: extractAppName(userMessage) || 'My App',
    type,
    description: template.description,
    entities: template.entities,
    pages: template.pages,
    features: extractFeatures(userMessage),
  };
}

/**
 * Generate React component code
 */
export function generateComponent(name: string, type: 'page' | 'component', spec: AppSpec): string {
  // Base component template
  return `'use client';

import { useState } from 'react';

export default function ${name}() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">${name}</h1>
        {/* Component content */}
      </div>
    </div>
  );
}`;
}

/**
 * Generate Prisma schema for entities
 */
export function generateSchema(entities: string[]): string {
  let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

  for (const entity of entities) {
    schema += `model ${entity} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // Add fields here
}

`;
  }

  return schema;
}

/**
 * Generate API route handler
 */
export function generateApiRoute(entity: string): string {
  return `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const ${entity}Schema = z.object({
  // Define your schema here
});

export async function GET() {
  try {
    const items = await db.${entity.toLowerCase()}.findMany();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = ${entity}Schema.parse(body);
    const item = await db.${entity.toLowerCase()}.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}`;
}

// Helper functions
function extractAppName(message: string): string | null {
  const patterns = [
    /called?\s+["']?([^"']+)["']?/i,
    /named?\s+["']?([^"']+)["']?/i,
    /build\s+(?:a\s+)?["']?([^"']+)["']?\s+app/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  
  return null;
}

function extractFeatures(message: string): string[] {
  const features: string[] = [];
  const keywords = {
    'auth': 'User authentication',
    'login': 'User authentication',
    'payment': 'Payment processing',
    'stripe': 'Stripe integration',
    'email': 'Email notifications',
    'notification': 'Push notifications',
    'analytics': 'Analytics dashboard',
    'search': 'Search functionality',
    'filter': 'Filtering & sorting',
    'upload': 'File uploads',
    'image': 'Image handling',
    'api': 'REST API',
    'realtime': 'Real-time updates',
    'chat': 'Chat functionality',
    'comment': 'Comments system',
    'share': 'Social sharing',
  };
  
  const lower = message.toLowerCase();
  for (const [keyword, feature] of Object.entries(keywords)) {
    if (lower.includes(keyword) && !features.includes(feature)) {
      features.push(feature);
    }
  }
  
  return features;
}
