# 🏗️ ARCHITECTURE - AppForge

## Vue d'Ensemble

```
┌────────────────────────────────────────────────────────────────────┐
│                           APPFORGE                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│   │   LANDING   │    │    AUTH     │    │  DASHBOARD  │           │
│   │    PAGE     │───▶│   FLOW      │───▶│             │           │
│   └─────────────┘    └─────────────┘    └──────┬──────┘           │
│                                                 │                   │
│                                                 ▼                   │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    APP BUILDER                               │  │
│   │  ┌──────────────────┐    ┌──────────────────────────────┐   │  │
│   │  │   CHAT PANEL     │    │      PREVIEW PANEL           │   │  │
│   │  │                  │    │                              │   │  │
│   │  │  User Input      │    │   ┌────────────────────┐     │   │  │
│   │  │  AI Response     │◄──▶│   │   Live Preview     │     │   │  │
│   │  │  History         │    │   │   (iframe)         │     │   │  │
│   │  │                  │    │   └────────────────────┘     │   │  │
│   │  └──────────────────┘    └──────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES                            │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│   AI Engine  │  Build Svc   │  Deploy Svc  │   Storage Svc         │
│   (LLM)      │  (bundler)   │  (container) │   (R2/S3)             │
└──────────────┴──────────────┴──────────────┴───────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                             │
│                    PostgreSQL (Supabase)                            │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du Projet

```
/root/.openclaw/workspace/startup/src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Dashboard routes group
│   │   ├── dashboard/page.tsx
│   │   ├── apps/
│   │   │   ├── page.tsx          # List apps
│   │   │   ├── new/page.tsx      # Create new app
│   │   │   └── [id]/             # Single app
│   │   │       ├── page.tsx      # App builder
│   │   │       ├── settings/page.tsx
│   │   │       └── analytics/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── ai/
│   │   │   ├── chat/route.ts     # Streaming chat
│   │   │   └── generate/route.ts # Code generation
│   │   └── webhooks/
│   │       └── stripe/route.ts
│   ├── layout.tsx
│   ├── page.tsx                  # Landing page
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── landing/                  # Landing page components
│   ├── dashboard/                # Dashboard components
│   ├── builder/                  # App builder components
│   │   ├── chat-panel.tsx
│   │   ├── preview-panel.tsx
│   │   ├── code-viewer.tsx
│   │   └── toolbar.tsx
│   └── shared/                   # Shared components
├── lib/
│   ├── ai/                       # AI utilities
│   │   ├── providers.ts          # LLM provider configs
│   │   ├── prompts.ts            # System prompts
│   │   └── generator.ts          # Code generation logic
│   ├── db/
│   │   └── index.ts              # Prisma client
│   ├── auth/
│   │   └── index.ts              # Auth config
│   ├── trpc/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── routers/
│   │       ├── app.ts
│   │       ├── user.ts
│   │       └── index.ts
│   └── utils.ts
├── hooks/                        # Custom React hooks
├── stores/                       # Zustand stores
├── types/                        # TypeScript types
├── prisma/
│   └── schema.prisma
├── public/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗄️ Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  
  // Subscription
  plan          Plan      @default(FREE)
  credits       Int       @default(1000)
  stripeId      String?
  
  // API Keys (encrypted)
  openaiKey     String?
  anthropicKey  String?
  groqKey       String?
  
  // Relations
  apps          App[]
  accounts      Account[]
  sessions      Session[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Plan {
  FREE
  PRO
  TEAM
  ENTERPRISE
}

model App {
  id          String   @id @default(cuid())
  name        String
  description String?
  slug        String   @unique  // for subdomain
  
  // Status
  status      AppStatus @default(DRAFT)
  
  // Generated code (stored in R2, ref here)
  codeUrl     String?
  previewUrl  String?
  deployedUrl String?
  
  // Metadata
  framework   String   @default("nextjs")
  version     Int      @default(1)
  
  // Chat history
  messages    Message[]
  
  // Owner
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum AppStatus {
  DRAFT
  BUILDING
  PREVIEW
  DEPLOYED
  ERROR
}

model Message {
  id        String   @id @default(cuid())
  role      Role
  content   String
  
  // Metadata
  tokens    Int?
  model     String?
  
  // App relation
  appId     String
  app       App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ASSISTANT
  SYSTEM
}

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}
```

---

## 🔌 API Architecture (tRPC)

```typescript
// lib/trpc/routers/index.ts
import { router } from '../server';
import { appRouter } from './app';
import { userRouter } from './user';

export const trpcRouter = router({
  app: appRouter,
  user: userRouter,
});

export type AppRouter = typeof trpcRouter;
```

```typescript
// lib/trpc/routers/app.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../server';

export const appRouter = router({
  // List user's apps
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.app.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: 'desc' },
    });
  }),
  
  // Create new app
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const slug = generateSlug(input.name);
      return ctx.db.app.create({
        data: {
          name: input.name,
          slug,
          userId: ctx.session.user.id,
        },
      });
    }),
  
  // Get single app
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.app.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { messages: true },
      });
    }),
  
  // Delete app
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.app.delete({
        where: { id: input.id },
      });
    }),
});
```

---

## 🤖 AI Generation Pipeline

```typescript
// lib/ai/generator.ts

export async function generateApp(prompt: string, context: AppContext) {
  // 1. Analyze intent
  const intent = await analyzeIntent(prompt);
  
  // 2. Generate schema
  const schema = await generateSchema(intent);
  
  // 3. Generate components
  const components = await generateComponents(intent, schema);
  
  // 4. Generate API routes
  const apiRoutes = await generateApiRoutes(schema);
  
  // 5. Assemble project
  const project = assembleProject({
    schema,
    components,
    apiRoutes,
  });
  
  // 6. Validate
  await validateProject(project);
  
  return project;
}
```

---

## 🔐 Auth Flow

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│   Client   │───▶│  NextAuth  │───▶│  Provider  │
│            │◀───│            │◀───│ (Google/   │
└────────────┘    └────────────┘    │  GitHub)   │
                        │           └────────────┘
                        ▼
                  ┌────────────┐
                  │  Database  │
                  │ (User/Acc) │
                  └────────────┘
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.15.0",
    "@trpc/client": "^10.45.0",
    "@trpc/server": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@tanstack/react-query": "^5.40.0",
    "next-auth": "^5.0.0-beta.19",
    "@auth/prisma-adapter": "^2.4.0",
    "ai": "^3.1.0",
    "openai": "^4.52.0",
    "@anthropic-ai/sdk": "^0.24.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.395.0",
    "framer-motion": "^11.2.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "prisma": "^5.15.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

---

## 🚀 Deployment

### Platform (AppForge itself)
- **Vercel**: Next.js hosting, edge functions, automatic HTTPS
- **Supabase**: PostgreSQL database, auth backup
- **Cloudflare R2**: Asset storage (no egress fees)

### User Apps
- **Railway** ou **Fly.io**: Container deployment
- **Subdomain**: `{slug}.appforge.app`
- **Custom domains**: Via Cloudflare DNS API

---

## 🔧 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."

# AI (platform defaults, users can BYOK)
OPENAI_API_KEY="..."
ANTHROPIC_API_KEY="..."

# Storage
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="appforge-assets"
R2_ENDPOINT="..."

# Stripe
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."

# Deployment
RAILWAY_TOKEN="..."
```

---

## ✅ Architecture Validée

Cette architecture est:
- **Scalable**: Peut grandir avec la demande
- **Maintenable**: Code propre et typé
- **Sécurisée**: Isolation, encryption, RBAC
- **Extensible**: Facile d'ajouter features

**NEXT: Implémentation!** 🚀
