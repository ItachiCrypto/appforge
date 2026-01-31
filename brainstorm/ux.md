# AppForge - UX/Flow Utilisateur

## 🎯 Philosophie UX
**"De l'idée à l'app en 5 minutes"** - Zéro friction, maximum magic.

---

## 📱 Parcours Utilisateur Principal

### 1. Landing & Onboarding (30 sec)
```
[Landing Page] → [Sign Up (Google/GitHub/Email)] → [Onboarding Quiz]
```
- **Onboarding Quiz** (3 questions):
  1. "Quel type d'app veux-tu créer?" (SaaS, Tool, Portfolio, E-commerce, Custom)
  2. "Pour qui?" (Perso, Startup, Entreprise)
  3. "Budget API?" (BYOK gratuit / Crédits inclus)

### 2. Création d'App - Le Chat Magic ✨
```
[Dashboard] → [+ Nouvelle App] → [Chat Interface]
```

**Interface Chat:**
```
┌─────────────────────────────────────────────────────────┐
│  🤖 AppForge AI                                         │
│  ─────────────────────────────────────────────────────  │
│  "Décris-moi l'app de tes rêves..."                    │
│                                                         │
│  User: "Je veux une app de gestion de tâches avec      │
│         des deadlines et des notifications"             │
│                                                         │
│  🤖: "Super! Je vais créer ça. Quelques questions:     │
│       - Combien d'utilisateurs max?                     │
│       - Tu veux des équipes/collaboration?              │
│       - Intégrations (Slack, Email)?"                   │
│                                                         │
│  [Preview en temps réel à droite] ──────────────────►  │
└─────────────────────────────────────────────────────────┘
```

### 3. Preview Live & Itération
```
┌──────────────────────┬──────────────────────────────────┐
│      CHAT            │         PREVIEW                  │
│                      │    ┌────────────────────┐        │
│  🤖 "Voici ta v1..." │    │   [App Preview]    │        │
│                      │    │   Live Reload      │        │
│  User: "Change le    │    │                    │        │
│  header en bleu"     │    └────────────────────┘        │
│                      │                                  │
│  🤖 "C'est fait! ✓"  │    [Desktop] [Tablet] [Mobile]  │
└──────────────────────┴──────────────────────────────────┘
```

### 4. Déploiement One-Click
```
[App Ready] → [🚀 Deploy] → [Choose Domain] → [LIVE!]
```
- Sous-domaine gratuit: `monapp.appforge.app`
- Custom domain: Configuration DNS guidée

### 5. Dashboard de Gestion
```
┌─────────────────────────────────────────────────────────┐
│  📊 Mes Apps                                    [+ New] │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │ TaskPro │  │ InvoiceX│  │ Portfolio│                │
│  │ ●Online │  │ ●Online │  │ ○Draft  │                 │
│  │ 234 usr │  │ 89 usr  │  │ --      │                 │
│  └─────────┘  └─────────┘  └─────────┘                 │
│                                                         │
│  📈 Analytics | 💰 Billing | ⚙️ Settings               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Flows Secondaires

### Modification d'App Existante
```
[Dashboard] → [Select App] → [💬 Chat] ou [📝 Editor]
```
- **Chat**: Pour changements majeurs ("Ajoute un système de paiement")
- **Editor**: Pour tweaks mineurs (couleurs, textes)

### Gestion des Clés API (BYOK)
```
[Settings] → [API Keys] → [Add Key] → [Test Connection] → [Save]
```
- Support: OpenAI, Anthropic, Groq, OpenRouter
- Validation automatique des clés
- Estimation des coûts

### Templates & Marketplace
```
[Templates] → [Browse/Search] → [Preview] → [Clone to My Apps]
```
- Templates communautaires
- Templates premium
- "Remix" d'apps publiques

---

## 🎨 Design System

### Couleurs
- **Primary**: `#6366F1` (Indigo)
- **Success**: `#10B981` (Emerald)
- **Background**: `#0F172A` (Slate 900) - Dark mode default
- **Surface**: `#1E293B` (Slate 800)

### Composants Clés
- **Chat bubbles**: Arrondis, avec animations typing
- **Preview frame**: Border gradient animé pendant génération
- **Cards**: Glass morphism subtil
- **Buttons**: Glow effect on hover

### Micro-interactions
- ✨ Particules lors du déploiement réussi
- 🔄 Skeleton loaders pendant génération
- ✅ Checkmarks animés pour les étapes complétées
- 🎉 Confetti pour première app déployée

---

## 📱 Responsive Strategy

| Breakpoint | Comportement |
|------------|--------------|
| Desktop | Chat + Preview côte à côte |
| Tablet | Tabs switch Chat/Preview |
| Mobile | Chat fullscreen, Preview in modal |

---

## 🚀 Moments de Délice

1. **First Deploy**: Confetti + "Ta première app est LIVE! 🎉"
2. **100 Users**: Badge + notification célébration
3. **Streak**: "7 jours de création consécutifs!"
4. **Share**: Easy social share cards auto-générées
