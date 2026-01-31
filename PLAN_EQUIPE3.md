# 🤖 PLAN ÉQUIPE 3 - IA GÉNÉRATION DE CODE

## 📊 DIAGNOSTIC COMPLET

### Flux Actuel Analysé
```
[User Input] → [Frontend page.tsx] → [POST /api/chat] → [OpenAI streamChat]
     ↓                                      ↓
[Parse codeOutput]  ←  [parseCodeBlocks()]  ←  [Response IA]
     ↓
[setFiles()] → [Sandpack re-render] → [Preview mis à jour]
     ↓
[PATCH /api/apps/:id] → [DB update]
```

---

## 🚨 PROBLÈMES IDENTIFIÉS

### ❌ PROBLÈME 1 (CRITIQUE): PAS DE CLÉ OPENAI!
**Fichier**: `.env.local`
**Constat**: `OPENAI_API_KEY` N'EST PAS CONFIGURÉE!
```
# .env.local actuel - MANQUE:
OPENAI_API_KEY=sk-xxx  ← ABSENT!
```
**Impact**: L'API échoue immédiatement si l'utilisateur n'a pas BYOK

### ❌ PROBLÈME 2: Modèle OpenAI obsolète
**Fichier**: `src/lib/ai/openai.ts` (ligne 18)
```typescript
model: 'gpt-4-turbo-preview'  // ← Modèle ancien/déprécié!
```
**Solution**: Utiliser `gpt-4o` ou `gpt-4-turbo`

### ❌ PROBLÈME 3: Conflit de fichier (JS vs TSX)
**Fichier**: `src/lib/constants.ts`
```typescript
export const DEFAULT_APP_FILES = {
  '/App.js': `...`  // ← Le fichier par défaut est .js
}
```
**Mais le prompt génère**: `/App.tsx`  
**Impact**: Le fichier généré peut ne pas remplacer le défaut

### ⚠️ PROBLÈME 4: Pas de DATABASE_URL
**Fichier**: `.env.local`
**Constat**: `DATABASE_URL` non définie
**Impact**: Prisma ne peut pas sauvegarder les conversations/fichiers

---

## ✅ SOLUTIONS À IMPLÉMENTER

### SOLUTION 1: Configurer les variables d'environnement
```bash
# Ajouter dans .env.local:
OPENAI_API_KEY=sk-proj-xxx  # Clé OpenAI valide
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### SOLUTION 2: Mettre à jour le modèle OpenAI
**Fichier**: `src/lib/ai/openai.ts`
```typescript
// AVANT:
model: 'gpt-4-turbo-preview'

// APRÈS:
model: 'gpt-4o'  // Plus récent, plus rapide, moins cher
```

### SOLUTION 3: Aligner les fichiers (JS → TSX)
**Fichier**: `src/lib/constants.ts`
```typescript
// AVANT:
export const DEFAULT_APP_FILES = {
  '/App.js': `...`
}

// APRÈS:
export const DEFAULT_APP_FILES = {
  '/App.tsx': `...`
}
```

### SOLUTION 4: Améliorer la gestion d'erreur
**Fichier**: `src/lib/ai/openai.ts`
```typescript
export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY
  
  if (!key) {
    // Meilleur message d'erreur
    throw new Error(
      'OpenAI API key required. Set OPENAI_API_KEY in .env.local or configure BYOK in settings.'
    )
  }
  // ...
}
```

---

## 🔄 ORDRE D'EXÉCUTION

| # | Action | Fichier | Priorité |
|---|--------|---------|----------|
| 1 | Ajouter OPENAI_API_KEY | `.env.local` | 🔴 CRITIQUE |
| 2 | Ajouter DATABASE_URL | `.env.local` | 🔴 CRITIQUE |
| 3 | Changer modèle → gpt-4o | `src/lib/ai/openai.ts` | 🟡 HAUTE |
| 4 | Changer App.js → App.tsx | `src/lib/constants.ts` | 🟡 HAUTE |
| 5 | Améliorer erreurs | `src/lib/ai/openai.ts` | 🟢 MOYENNE |

---

## 🧪 TESTS À EFFECTUER

### Test 1: Vérifier l'API Chat
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Create a button"}]}'
```

### Test 2: Vérifier le parsing du code
```typescript
// Test parseCodeBlocks
const content = `Here's your code:
\`\`\`appforge
{"files": {"/App.tsx": "export default function App() { return <div>Test</div> }"}}
\`\`\`
`
const result = parseCodeBlocks(content)
console.log(result) // Doit retourner { files: { "/App.tsx": "..." } }
```

### Test 3: Flow complet
1. Ouvrir une app dans l'éditeur
2. Taper "create a red button"
3. Vérifier que le code apparaît dans la réponse
4. Vérifier que le preview se met à jour

---

## 📁 FICHIERS CLÉS

| Fichier | Rôle |
|---------|------|
| `src/app/api/chat/route.ts` | API endpoint du chat |
| `src/lib/ai/openai.ts` | Client OpenAI + parsing |
| `src/lib/ai/prompts.ts` | System prompt |
| `src/app/(dashboard)/app/[id]/page.tsx` | Frontend éditeur |
| `src/lib/constants.ts` | Fichiers par défaut |
| `.env.local` | Variables d'environnement |

---

## ✅ STATUS

- [x] Analyse du flux
- [x] Identification des problèmes
- [ ] 🔴 Fix OPENAI_API_KEY (REQUIERT ACTION MANUELLE)
- [ ] 🔴 Fix DATABASE_URL (REQUIERT ACTION MANUELLE)
- [x] ✅ Mise à jour modèle → gpt-4o
- [x] ✅ Alignement fichiers App.js → App.tsx
- [x] ✅ Amélioration messages d'erreur
- [ ] Tests

---

## 🎯 ACTION REQUISE

**⚠️ BLOQUANT: L'équipe doit ajouter dans `.env.local`:**

```bash
# OBLIGATOIRE pour que le chat fonctionne
OPENAI_API_KEY=sk-proj-votre-cle-openai

# OBLIGATOIRE pour sauvegarder dans la DB
DATABASE_URL=postgresql://user:pass@host:5432/appforge
```

**Coordinateur**: Équipe 3  
**Date**: Analyse complétée
