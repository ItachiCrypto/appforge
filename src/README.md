# 🚀 AppForge

**Build apps with conversations, not code.**

AppForge is an AI-powered platform that transforms your ideas into functional web applications through natural language conversations.

## ✨ Features

- **Chat-to-App**: Describe what you want, AI builds it
- **Live Preview**: See changes in real-time as you chat
- **BYOK Support**: Bring your own API keys for unlimited usage
- **Code Export**: Download clean, maintainable Next.js code
- **One-Click Deploy**: Ship to production instantly

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, tRPC
- **Database**: PostgreSQL with Prisma
- **Auth**: NextAuth.js (Auth.js v5)
- **AI**: Vercel AI SDK, OpenAI/Anthropic

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys (OpenAI or Anthropic)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd src
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utilities and configs
│   ├── ai/               # AI generation logic
│   ├── auth.ts           # Auth configuration
│   ├── db.ts             # Prisma client
│   └── trpc/             # tRPC setup
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

# AI (Platform defaults)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

## 🎯 Roadmap

- [x] Core chat-to-app functionality
- [x] User authentication
- [x] BYOK support
- [x] Live preview
- [ ] Custom domains
- [ ] Team collaboration
- [ ] Template marketplace
- [ ] Mobile app builder
- [ ] Voice-to-app

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ by the AppForge team
