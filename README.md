# 🔥 AppForge

> Turn ideas into working apps in minutes. No coding required.

AppForge is an AI-powered platform that lets anyone create web applications through natural conversation. Just describe what you want, and watch your app come to life.

![AppForge](https://via.placeholder.com/1200x630/7C3AED/FFFFFF?text=AppForge+-+Build+Apps+with+AI)

## ✨ Features

- **🗣️ Chat-to-App** - Describe your app in plain English
- **⚡ Instant Preview** - See changes in real-time with Sandpack
- **🚀 One-Click Deploy** - Go live on Vercel instantly
- **🔑 BYOK** - Bring your own API keys and save 50%
- **🎨 Show Me Options** - Get multiple design variations
- **💳 Subscription Plans** - Flexible pricing for everyone

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma
- **Database**: PostgreSQL (Neon/Supabase)
- **Auth**: Clerk
- **Payments**: Stripe
- **AI**: OpenAI GPT-4
- **Preview**: Sandpack (CodeSandbox)
- **Deploy**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account
- Stripe account
- OpenAI API key

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/appforge.git
cd appforge

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your keys (see HUMAN_REQUIRED.md)

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📖 Configuration

See [HUMAN_REQUIRED.md](./HUMAN_REQUIRED.md) for detailed setup instructions including:

- Database setup (Neon/Supabase)
- Clerk authentication
- Stripe payments
- OpenAI API
- Environment variables

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/         # Auth pages
│   │   ├── (dashboard)/    # Dashboard pages
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...             # Feature components
│   └── lib/
│       ├── ai/             # OpenAI integration
│       ├── stripe/         # Stripe integration
│       └── ...             # Utilities
└── ...
```

## 💰 Pricing

| Plan | Price | Apps | Deploy |
|------|-------|------|--------|
| Free | $0 | 3 | ❌ |
| Starter | $19/mo | 10 | ✅ |
| Pro | $49/mo | Unlimited | ✅ |
| Team | $99/mo | Unlimited | ✅ |

**BYOK Discount**: Use your own API keys and get 50% off!

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful components
- [Sandpack](https://sandpack.codesandbox.io/) for the code preview
- [Clerk](https://clerk.com/) for authentication
- [Stripe](https://stripe.com/) for payments

---

Built with ❤️ by the AppForge Team
