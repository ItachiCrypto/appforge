# RULES.md - Règles Non-Négociables

*Ces règles sont absolues. Les enfreindre = app cassée.*

---

## 🚨 Rule 0: Event Handlers - LA PLUS IMPORTANTE

**Un onClick mal écrit = app cassée. Pas d'exception.**

### ✅ CORRECT
```jsx
// Fonction sans paramètre → référence directe OK
<button onClick={handleClick}>Click</button>

// Fonction AVEC paramètre → TOUJOURS arrow function
<button onClick={() => handleDelete(item.id)}>Supprimer</button>
<button onClick={() => setCount(count + 1)}>+1</button>
<button onClick={() => addTodo(newTodo)}>Ajouter</button>

// Événement nécessaire → arrow function avec e
<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
<input onChange={(e) => setName(e.target.value)} />
```

### ❌ INTERDIT (app cassée au render)
```jsx
// S'exécute IMMÉDIATEMENT au render, pas au click !
<button onClick={handleDelete(item.id)}>❌ CASSÉ</button>
<button onClick={setCount(count + 1)}>❌ CASSÉ</button>

// Oubli de l'arrow function
<button onClick={addTodo}>❌ Si addTodo prend des params</button>
```

---

## 📦 Rule 1: Import React OBLIGATOIRE

**TOUJOURS en première ligne de chaque fichier React :**

```jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
```

### ❌ INTERDIT
```jsx
const { useState } = React;  // ❌ Ne fonctionne pas
// Fichier sans import React  // ❌ Rien ne marche
```

---

## 🚫 Rule 2: Zéro Dépendances Externes

**Le sandbox n'a PAS ces packages. Ne les importe JAMAIS.**

### ❌ INTERDIT
```jsx
import axios from 'axios';           // ❌
import _ from 'lodash';              // ❌
import moment from 'moment';         // ❌
import { format } from 'date-fns';   // ❌
import { X, Plus } from 'lucide-react'; // ❌
```

### ✅ ALTERNATIVES
```jsx
// HTTP → fetch natif
const data = await fetch(url).then(r => r.json());

// Lodash → méthodes JS natives
items.filter(x => x.active).map(x => x.name);

// Moment/date-fns → Date native ou Intl
new Date().toLocaleDateString('fr-FR');
```

---

## 🎭 Rule 2b: Icônes = Emojis/Unicode

**`lucide-react` n'existe PAS dans le sandbox.**

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
```jsx
<div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
```

---

## 🎨 Rule 3: Tailwind CSS Uniquement

### ✅ CORRECT
```jsx
<div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-lg">
```

### ❌ INTERDIT
```jsx
// Inline styles
<div style={{ display: 'flex', padding: '24px' }}>  // ❌

// Fichiers CSS
import './styles.css';  // ❌

// Import Tailwind (déjà chargé via CDN)
import 'tailwindcss';  // ❌
```

---

## ♿ Rule 4: Accessibilité Obligatoire

```jsx
// Boutons sans texte → aria-label
<button aria-label="Fermer" onClick={close}>✕</button>

// Inputs → label associé
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Focus visible
<button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

// Images → alt
<img src={url} alt="Description de l'image" />
```

---

## 📱 Rule 5: Responsive par Défaut

### Mobile-first
```jsx
// Base = mobile, puis breakpoints pour plus grand
<div className="flex flex-col md:flex-row">
<div className="w-full lg:w-1/2">
<div className="text-sm md:text-base lg:text-lg">
```

### Touch-friendly
```jsx
// Zones cliquables min 44x44px
<button className="min-h-11 min-w-11 p-3">
```

### Breakpoints Tailwind
| Prefix | Min-width |
|--------|-----------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

---

## ⏳ Rule 6: États de Chargement

```jsx
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
```

---

## 🛡️ Rule 7: Gestion d'Erreurs

```jsx
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
```

---

## 📝 Rule 8: Structure de Code

### Export obligatoire
```jsx
export default function App() {
  // ...
}
```

### Ordre dans le composant
1. Imports
2. Types/interfaces (si TypeScript)
3. Constantes
4. Composant principal
5. Sous-composants (si inline)

### Nommage
- Composants: `PascalCase` → `TodoItem`, `UserCard`
- Fonctions: `camelCase` → `handleClick`, `fetchData`
- Constantes: `UPPER_SNAKE` → `MAX_ITEMS`, `API_URL`

---

## 🎯 Rule 9: Code Complet

**JAMAIS de code partiel ou placeholder.**

### ❌ INTERDIT
```jsx
// TODO: implement later
// ... rest of the code
// Add more features here
```

### ✅ OBLIGATOIRE
- Code complet et fonctionnel
- Toutes les fonctionnalités demandées
- Pas de "coming soon" ou placeholders

---

## 💾 Rule 10: Persistance localStorage

**Toute app avec données = localStorage obligatoire.**

```jsx
// Pattern standard
const [data, setData] = useState(() => {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem('app-data');
  return saved ? JSON.parse(saved) : defaultValue;
});

useEffect(() => {
  localStorage.setItem('app-data', JSON.stringify(data));
}, [data]);
```

---

*Ces règles ne sont pas des suggestions. Les suivre = apps qui marchent. Les ignorer = bugs garantis.*
