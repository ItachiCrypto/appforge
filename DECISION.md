# 🎯 DECISION.md - AppForge

## Décisions Finales pour le MVP

---

## 🏷️ NOM DU PRODUIT
**AppForge** - "Forge your app with AI"

---

## 🎯 VISION PRODUIT

### One-liner
"Create your own apps by just describing them. No code, no complexity, no limits."

### Tagline
"From idea to live app in minutes."

---

## ✅ DÉCISIONS MVP

### 1. Core Experience
| Décision | Choix | Pourquoi |
|----------|-------|----------|
| Interface principale | Chat-first | Plus accessible que UI complexe |
| Langage de l'agent | Français + English | Marché initial |
| Type d'apps générées | Next.js static/SSG | Simple à deployer, performant |
| Preview method | Sandpack (in-browser) | Pas de serveur, instantané |
| Deploy target | Vercel | API simple, free tier, fiable |

### 2. Features MVP
| Feature | Inclus | Raison |
|---------|--------|--------|
| Chat conversationnel | ✅ | Core |
| Preview live | ✅ | Core |
| Deploy Vercel | ✅ | Core |
| Dashboard apps | ✅ | Core |
| BYOK (API keys) | ✅ | Différenciation |
| Auth (Clerk) | ✅ | Requis |
| Version history | ✅ | Safety net |
| Templates | ✅ | Accélération |
| Collaboration | ❌ | V2 |
| Voice input | ❌ | V2 |
| Analytics | ❌ | V2 |

### 3. Technical Stack
| Layer | Choix | Alternative considérée |
|-------|-------|------------------------|
| Framework | Next.js 14 | Remix, Nuxt |
| Styling | Tailwind + shadcn/ui | MUI, Chakra |
| State | Zustand | Redux, Jotai |
| API | tRPC | REST, GraphQL |
| DB | PostgreSQL (Supabase) | PlanetScale, Neon |
| Auth | Clerk | NextAuth, Auth0 |
| AI | OpenAI GPT-4 / Claude | Gemini, Llama |
| Sandbox | Sandpack | WebContainers, E2B |
| Deploy | Vercel API | Cloudflare, Netlify |

### 4. Business Model
| Plan | Prix | Limite |
|------|------|--------|
| Free | $0 | 3 apps, preview only |
| Starter | $19/mois | 10 apps, deploy |
| Pro | $49/mois | Unlimited |

**BYOK Discount**: -50% si user apporte sa clé API

### 5. Security Decisions
| Aspect | Décision |
|--------|----------|
| Sandbox | Sandpack (client-side isolation) |
| API Keys | AES-256-GCM encryption |
| Auth | Clerk (enterprise-grade) |
| Rate Limiting | 100 req/min par user |
| Code Scanning | Patterns dangereux bloqués |

---

## ❌ HORS SCOPE MVP

Ces features sont explicitement **reportées**:

1. **Collaboration real-time** → V2
2. **Mobile app output** → V2
3. **Backend/database pour apps** → V1.1
4. **Marketplace templates** → V2
5. **Custom domains** → V1.1
6. **CLI tool** → V2
7. **API publique** → V2
8. **Self-hosting** → Enterprise
9. **White-label** → Enterprise

---

## 🎨 DESIGN DECISIONS

### UI/UX
- **Color scheme**: Dark mode par défaut, light mode option
- **Primary color**: Blue (#3B82F6)
- **Font**: Inter (clean, moderne)
- **Layout**: Split-screen (chat gauche, preview droite)
- **Mobile**: Chat only, preview modal

### Tone of Voice (Agent)
- Friendly mais professionnel
- Jamais de jargon technique
- Propose des options plutôt qu'imposer
- Admet ses erreurs ("Oops, laisse-moi corriger ça")

---

## 📊 SUCCESS METRICS (MVP)

### Launch Goals (1 mois post-launch)
- [ ] 1,000 signups
- [ ] 500 apps créées
- [ ] 50 apps déployées
- [ ] 10 paying customers
- [ ] NPS > 40

### Quality Gates
- [ ] Time to First App < 5 min
- [ ] Deploy success rate > 95%
- [ ] Error rate < 5%
- [ ] No security incidents

---

## 🚀 GO/NO-GO CRITERIA

Le MVP est prêt à lancer quand:

1. ✅ Un user peut créer une app en 5 minutes
2. ✅ L'app peut être déployée sur Vercel
3. ✅ L'URL fonctionne et est partageable
4. ✅ Auth fonctionne (signup, login)
5. ✅ BYOK fonctionne avec OpenAI
6. ✅ Dashboard liste les apps
7. ✅ Version history permet rollback
8. ✅ Landing page explique le produit
9. ✅ Pas de bugs critiques
10. ✅ Performance acceptable (< 3s load)

---

## 📅 MILESTONES

| Milestone | Deadline | Critères |
|-----------|----------|----------|
| Backend Ready | +1 semaine | Auth, DB, API base |
| Agent Working | +1.5 semaine | Chat → Code generation |
| Preview Working | +2 semaines | Sandpack integration |
| Deploy Working | +2.5 semaines | Vercel integration |
| Dashboard Done | +3 semaines | Full user flow |
| Polish & Test | +3.5 semaines | Bug fixes, QA |
| Launch Ready | +4 semaines | Go live! |

---

## 🔥 FINAL WORD

**Focus absolu sur le core loop:**

```
DESCRIBE → PREVIEW → DEPLOY
```

Tout ce qui ne sert pas ce loop = V2.

Le MVP doit prouver que "chat → live app" fonctionne. Le reste viendra.

**Ship fast, iterate faster.**
