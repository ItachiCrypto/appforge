// Auto-generated from RULES.md - DO NOT EDIT DIRECTLY
// Edit RULES.md and run: npm run build:prompts

export const RULES_MD = `# RULES.md - Règles Non-Négociables

*Ces règles sont absolues. Les enfreindre = app cassée.*

---

## 🚨 Rule 0: Event Handlers - LA PLUS IMPORTANTE

**Un onClick mal écrit = app cassée. Pas d'exception.**

### ✅ CORRECT
\`\`\`jsx
// Fonction sans paramètre → référence directe OK
<button onClick={handleClick}>Click</button>

// Fonction AVEC paramètre → TOUJOURS arrow function
<button onClick={() => handleDelete(item.id)}>Supprimer</button>
<button onClick={() => setCount(count + 1)}>+1</button>
<button onClick={() => addTodo(newTodo)}>Ajouter</button>

// Événement nécessaire → arrow function avec e
<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
<input onChange={(e) => setName(e.target.value)} />
\`\`\`

### ❌ INTERDIT (app cassée au render)
\`\`\`jsx
// S'exécute IMMÉDIATEMENT au render, pas au click !
<button onClick={handleDelete(item.id)}>❌ CASSÉ</button>
<button onClick={setCount(count + 1)}>❌ CASSÉ</button>

// Oubli de l'arrow function
<button onClick={addTodo}>❌ Si addTodo prend des params</button>
\`\`\`

---

## 📦 Rule 1: Import React OBLIGATOIRE

**TOUJOURS en première ligne de chaque fichier React :**

\`\`\`jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
\`\`\`

### ❌ INTERDIT
\`\`\`jsx
const { useState } = React;  // ❌ Ne fonctionne pas
// Fichier sans import React  // ❌ Rien ne marche
\`\`\`

---

## 🚫 Rule 2: Zéro Dépendances Externes

**Le sandbox n'a PAS ces packages. Ne les importe JAMAIS.**

### ❌ INTERDIT
\`\`\`jsx
import axios from 'axios';           // ❌
import _ from 'lodash';              // ❌
import moment from 'moment';         // ❌
import { format } from 'date-fns';   // ❌
import { X, Plus } from 'lucide-react'; // ❌
\`\`\`

### ✅ ALTERNATIVES
\`\`\`jsx
// HTTP → fetch natif
const data = await fetch(url).then(r => r.json());

// Lodash → méthodes JS natives
items.filter(x => x.active).map(x => x.name);

// Moment/date-fns → Date native ou Intl
new Date().toLocaleDateString('fr-FR');
\`\`\`

---

## 🎭 Rule 2b: Icônes = Emojis/Unicode

**\`lucide-react\` n'existe PAS dans le sandbox.**

### Mapping des icônes
| Besoin | Emoji/Unicode |
|--------|---------------|
| Fermer/X | ✕ × ✖ |
| Check | ✓ ✔ |
| Plus | + ➕ |
| Moins | − ➖ |
| Corbeille | 🗑️ |
| Loupe | 🔍 |
| Settings | ⚙️ |
| Edit | ✏️ |
| Star | ⭐ ★ |
| Cœur | ❤️ ♥ |
| Flèches | → ← ↑ ↓ ➡️ ⬅️ |
| Menu | ☰ |
| User | 👤 |
| Home | 🏠 |
| Mail | ✉️ 📧 |
| Bell | 🔔 |
| Warning | ⚠️ |
| Info | ℹ️ |
| Success | ✅ |
| Error | ❌ |

### Spinner (animation CSS)
\`\`\`jsx
<div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
\`\`\`

---

## 🎨 Rule 3: Tailwind CSS Uniquement

### ✅ CORRECT
\`\`\`jsx
<div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-lg">
\`\`\`

### ❌ INTERDIT
\`\`\`jsx
// Inline styles
<div style={{ display: 'flex', padding: '24px' }}>  // ❌

// Fichiers CSS
import './styles.css';  // ❌

// Import Tailwind (déjà chargé via CDN)
import 'tailwindcss';  // ❌
\`\`\`

---

## ♿ Rule 4: Accessibilité Obligatoire

\`\`\`jsx
// Boutons sans texte → aria-label
<button aria-label="Fermer" onClick={close}>✕</button>

// Inputs → label associé
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Focus visible
<button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

// Images → alt
<img src={url} alt="Description de l'image" />
\`\`\`

---

## 📱 Rule 5: Responsive par Défaut

### Mobile-first
\`\`\`jsx
// Base = mobile, puis breakpoints pour plus grand
<div className="flex flex-col md:flex-row">
<div className="w-full lg:w-1/2">
<div className="text-sm md:text-base lg:text-lg">
\`\`\`

### Touch-friendly
\`\`\`jsx
// Zones cliquables min 44x44px
<button className="min-h-11 min-w-11 p-3">
\`\`\`

### Breakpoints Tailwind
| Prefix | Min-width |
|--------|-----------|
| \`sm:\` | 640px |
| \`md:\` | 768px |
| \`lg:\` | 1024px |
| \`xl:\` | 1280px |

---

## ⏳ Rule 6: États de Chargement

\`\`\`jsx
// Bouton avec loading
<button disabled={loading} className="disabled:opacity-50">
  {loading ? (
    <span className="animate-spin">⏳</span>
  ) : (
    'Envoyer'
  )}
</button>

// Skeleton loader
<div className="animate-pulse bg-gray-200 rounded h-4 w-32" />
\`\`\`

---

## 🛡️ Rule 7: Gestion d'Erreurs

\`\`\`jsx
// Try/catch sur async
const fetchData = async () => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur réseau');
    setData(await res.json());
  } catch (err) {
    setError('Impossible de charger les données');
  }
};

// Optional chaining pour éviter crashes
{user?.profile?.name ?? 'Anonyme'}

// Valeurs par défaut
const items = data?.items || [];
\`\`\`

---

## 📝 Rule 8: Structure de Code

### Export obligatoire
\`\`\`jsx
export default function App() {
  // ...
}
\`\`\`

### Ordre dans le composant
1. Imports
2. Types/interfaces (si TypeScript)
3. Constantes
4. Composant principal
5. Sous-composants (si inline)

### Nommage
- Composants: \`PascalCase\` → \`TodoItem\`, \`UserCard\`
- Fonctions: \`camelCase\` → \`handleClick\`, \`fetchData\`
- Constantes: \`UPPER_SNAKE\` → \`MAX_ITEMS\`, \`API_URL\`

---

## 🎯 Rule 9: Code Complet

**JAMAIS de code partiel ou placeholder.**

### ❌ INTERDIT
\`\`\`jsx
// TODO: implement later
// ... rest of the code
// Add more features here
\`\`\`

### ✅ OBLIGATOIRE
- Code complet et fonctionnel
- Toutes les fonctionnalités demandées
- Pas de "coming soon" ou placeholders

---

## 💾 Rule 10: Persistance localStorage

**Toute app avec données = localStorage obligatoire.**

\`\`\`jsx
// Pattern standard
const [data, setData] = useState(() => {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem('app-data');
  return saved ? JSON.parse(saved) : defaultValue;
});

useEffect(() => {
  localStorage.setItem('app-data', JSON.stringify(data));
}, [data]);
\`\`\`

---

*Ces règles ne sont pas des suggestions. Les suivre = apps qui marchent. Les ignorer = bugs garantis.*

---

## 🎨 Rule 11: Design Excellence - OBLIGATOIRE

**Chaque app doit être visuellement impressionnante. Pas de design "basique".**

### 🌈 Backgrounds OBLIGATOIRES
\`\`\`jsx
// TOUJOURS un gradient moderne - JAMAIS juste bg-white ou bg-gray-100
className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 to-indigo-900"
\`\`\`

### ✨ Glassmorphism sur les cards
\`\`\`jsx
// Cards avec effet glass - OBLIGATOIRE
className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl"
\`\`\`

### 🎭 Animations OBLIGATOIRES
\`\`\`jsx
// Hover effects sur TOUS les éléments interactifs
className="hover:scale-105 hover:shadow-2xl transition-all duration-300"
className="hover:bg-white/20 hover:-translate-y-1 transition-all duration-200"

// Entrée des éléments
className="animate-fade-in" // ou transition au mount
\`\`\`

### 🔘 Boutons modernes
\`\`\`jsx
// Boutons avec gradients et effets
className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"

// Boutons outline glass
className="border-2 border-white/30 bg-white/5 backdrop-blur hover:bg-white/10 text-white font-medium py-2 px-4 rounded-lg transition-all"
\`\`\`

### 📊 Stats/Cards design
\`\`\`jsx
// Card avec glow effect
<div className="relative group">
  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
  <div className="relative bg-slate-900 rounded-2xl p-6">
    {/* contenu */}
  </div>
</div>
\`\`\`

### 🎯 Typographie moderne
\`\`\`jsx
// Titres avec gradient
<h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">

// Sous-titres lisibles
<p className="text-lg text-white/70">
\`\`\`

### 🚫 INTERDIT (design pauvre)
\`\`\`jsx
// ❌ Backgrounds plats ennuyeux
className="bg-white" // ❌
className="bg-gray-100" // ❌
className="bg-slate-50" // ❌

// ❌ Cards sans effet
className="bg-white rounded shadow" // ❌ Trop basique

// ❌ Boutons sans style
className="bg-blue-500 text-white px-4 py-2" // ❌ Trop simple

// ❌ Pas d'animations
<button>Click</button> // ❌ Manque transition/hover
\`\`\`

### ✅ Checklist Design (VÉRIFIER CHAQUE APP)
- [ ] Background = gradient (pas de couleur plate)
- [ ] Cards = glassmorphism avec backdrop-blur
- [ ] Boutons = gradient + shadow + hover effect
- [ ] Textes = contrastes forts, titres en gradient si possible
- [ ] Animations = hover sur tout, transitions smooth
- [ ] Spacing = généreux (p-6, gap-6, margins larges)
- [ ] Rounded = toujours xl ou 2xl (pas de coins carrés)

---

## ⚡ Rule 12: Interactivité Complète

**Chaque élément cliquable DOIT avoir une action qui fonctionne.**

### Boutons de navigation
\`\`\`jsx
// Navigation avec useState - PATTERN OBLIGATOIRE
const [currentPage, setCurrentPage] = useState('home');

<button 
  onClick={() => setCurrentPage('settings')}
  className={currentPage === 'settings' ? 'bg-white/20' : 'hover:bg-white/10'}
>
  Settings
</button>

// Rendu conditionnel
{currentPage === 'home' && <HomePage />}
{currentPage === 'settings' && <SettingsPage />}
\`\`\`

### Boutons d'action
\`\`\`jsx
// CHAQUE bouton = une fonction qui fait quelque chose
<button onClick={() => setItems([...items, newItem])}>Ajouter</button>
<button onClick={() => setShowModal(true)}>Détails</button>
<button onClick={() => deleteItem(id)}>Supprimer</button>
\`\`\`

### ❌ INTERDIT - Boutons décoratifs
\`\`\`jsx
// ❌ Bouton sans onClick
<button className="...">Action</button>

// ❌ Bouton avec onClick vide ou commenté
<button onClick={() => {}}>Fake Button</button>
<button onClick={() => console.log('todo')}>Coming Soon</button>
\`\`\`

---`;
