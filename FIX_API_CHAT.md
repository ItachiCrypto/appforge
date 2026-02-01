# FIX_API_CHAT.md - Debug Report

## 🔍 Findings

### 1. OPENAI_API_KEY Status

| Location | Status |
|----------|--------|
| `.env.local` | ❌ **MISSING** |
| Vercel (Production) | ❌ **MISSING** |
| Vercel (Dev/Preview) | ❌ **MISSING** |

**Conclusion:** Aucune clé API OpenAI configurée nulle part.

---

### 2. Code Analysis

#### `src/app/api/chat/route.ts`
✅ **Bonne gestion des erreurs:**
```typescript
const apiKey = user.openaiKey || process.env.OPENAI_API_KEY

if (!apiKey) {
  return NextResponse.json({ 
    error: 'No API key configured. Please add your OpenAI API key in settings.' 
  }, { status: 400 })
}
```

L'API vérifie correctement:
1. D'abord la clé BYOK de l'utilisateur (`user.openaiKey`)
2. Puis la variable d'environnement `OPENAI_API_KEY`
3. Renvoie une erreur claire si aucune clé n'est trouvée

#### `src/lib/ai/openai.ts`
✅ **Bonne gestion également:**
```typescript
if (!key) {
  throw new Error(
    'OpenAI API key required. Either set OPENAI_API_KEY in environment variables, ' +
    'or configure your own key (BYOK) in Settings → API Keys.'
  )
}
```

---

### 3. Test API (curl)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

**Résultat attendu sans auth:**
```json
{"error": "Unauthorized", "status": 401}
```

**Résultat attendu avec auth mais sans API key:**
```json
{"error": "No API key configured. Please add your OpenAI API key in settings.", "status": 400}
```

---

## ✅ Corrections Nécessaires

### Option A: Ajouter OPENAI_API_KEY sur Vercel (recommandé pour prod)

```bash
cd /root/.openclaw/workspace/startup
vercel env add OPENAI_API_KEY
# Entrer la clé: sk-...
# Sélectionner: Production, Preview, Development
```

Puis redéployer:
```bash
vercel --prod
```

### Option B: Ajouter dans .env.local (dev uniquement)

Ajouter cette ligne à `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
```

### Option C: BYOK (Bring Your Own Key)

L'application supporte déjà le BYOK. Les utilisateurs peuvent ajouter leur propre clé dans les paramètres. Vérifier que la page Settings existe et fonctionne.

---

## 🔒 Modèle BYOK

L'architecture actuelle est **correcte pour un modèle freemium**:

1. **Sans clé globale:** Les utilisateurs doivent fournir leur propre clé OpenAI
2. **Avec clé globale:** L'app peut offrir des crédits gratuits, puis demander aux utilisateurs de passer en BYOK

**Recommandation:** Si vous ne voulez pas exposer une clé maître:
- Ne pas mettre `OPENAI_API_KEY` en env
- Guider les utilisateurs vers Settings pour ajouter leur clé
- Le message d'erreur actuel est déjà clair

---

## ⚠️ Points d'attention

1. **Auth requise:** L'API nécessite Clerk auth - le curl simple ne fonctionnera pas
2. **User lookup:** Requiert un user en DB avec `clerkId` correspondant
3. **Error handling:** Bon - les erreurs sont catchées et renvoyées proprement

---

## 📋 Checklist

- [x] Vérifié `.env.local` - pas de OPENAI_API_KEY
- [x] Vérifié Vercel env - pas de OPENAI_API_KEY  
- [x] Analysé route.ts - gestion d'erreur correcte
- [x] Analysé openai.ts - gestion d'erreur correcte
- [x] Documenté les solutions

**Status:** Le code est correct. Il manque juste la configuration de l'API key.
