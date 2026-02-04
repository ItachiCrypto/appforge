# RULES.md - Règles Strictes de Génération de Code

## 🚫 INTERDICTIONS ABSOLUES

### 1. NE JAMAIS utiliser prompt(), alert(), confirm()
```jsx
// ❌ INTERDIT
const name = prompt('Entrez votre nom');
alert('Tâche ajoutée!');
if (confirm('Supprimer?')) { ... }

// ✅ OBLIGATOIRE - Utiliser des modals/toasts
const [showModal, setShowModal] = useState(false);
const [showToast, setShowToast] = useState(false);
```

### 2. NE JAMAIS démarrer avec des données vides
```jsx
// ❌ INTERDIT
const [tasks, setTasks] = useState([]);
const [items, setItems] = useState([]);

// ✅ OBLIGATOIRE - Pré-remplir avec des exemples réalistes
const [tasks, setTasks] = useState([
  { id: '1', title: 'Finaliser le design', priority: 'high', done: false },
  { id: '2', title: 'Préparer la démo', priority: 'medium', done: true },
  { id: '3', title: 'Envoyer le rapport', priority: 'low', done: false },
]);
```

### 3. NE JAMAIS utiliser de fonds unis ennuyeux
```jsx
// ❌ INTERDIT
className="bg-white"
className="bg-gray-100"
style={{ background: '#fff' }}

// ✅ OBLIGATOIRE - Utiliser des gradients ou du glassmorphism
className="bg-gradient-to-br from-indigo-500 to-purple-600"
className="bg-white/10 backdrop-blur-lg"
```

### 4. NE JAMAIS oublier les états hover/focus/active
```jsx
// ❌ INTERDIT
className="bg-blue-500"

// ✅ OBLIGATOIRE
className="bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all"
```

### 5. NE JAMAIS faire d'input inline basique pour les actions principales
```jsx
// ❌ INTERDIT
<input 
  onKeyDown={(e) => e.key === 'Enter' && addTask(e.target.value)}
/>

// ✅ OBLIGATOIRE - Form complet avec bouton visible
<form onSubmit={handleSubmit} className="flex gap-2">
  <input 
    value={newTask}
    onChange={(e) => setNewTask(e.target.value)}
    placeholder="Nouvelle tâche..."
    className="flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"
  />
  <button 
    type="submit"
    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
  >
    Ajouter
  </button>
</form>
```

---

## ✅ OBLIGATIONS

### 1. Toujours inclure Dark Mode
```jsx
const [isDarkMode, setIsDarkMode] = useState(false);

// Toggle dans le header
<button onClick={() => setIsDarkMode(!isDarkMode)}>
  {isDarkMode ? '☀️' : '🌙'}
</button>

// Wrapper racine
<div className={isDarkMode ? 'dark' : ''}>
  <div className="bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
```

### 2. Toujours persister avec localStorage
```jsx
const STORAGE_KEY = 'appforge-{nom-app}';

useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) setData(JSON.parse(saved));
}, []);

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}, [data]);
```

### 3. Toujours avoir des empty states engageants
```jsx
{items.length === 0 && (
  <div className="text-center py-16 animate-fade-in">
    <div className="text-8xl mb-6">🎉</div>
    <h3 className="text-2xl font-bold mb-2">Tout est fait!</h3>
    <p className="text-gray-500 dark:text-gray-400 mb-6">
      Profite de ton temps libre ou ajoute de nouvelles tâches
    </p>
    <button 
      onClick={() => setShowAddModal(true)}
      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
    >
      + Nouvelle tâche
    </button>
  </div>
)}
```

### 4. Toujours animer les listes
```jsx
// Animation d'entrée pour chaque item
{items.map((item, index) => (
  <div 
    key={item.id}
    style={{ animationDelay: `${index * 50}ms` }}
    className="animate-slide-in"
  >
    {/* ... */}
  </div>
))}

// CSS
@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
```

### 5. Toujours utiliser des icônes/emojis
```jsx
// Headers avec icônes
<h1>📋 Mon Kanban</h1>
<h1>✅ Mes Tâches</h1>
<h1>📝 Mes Notes</h1>

// Boutons avec icônes
<button>🗑️ Supprimer</button>
<button>✏️ Éditer</button>
<button>➕ Ajouter</button>

// Badges de priorité
<span className="text-red-500">🔴 Urgent</span>
<span className="text-yellow-500">🟡 Normal</span>
<span className="text-green-500">🟢 Basse</span>
```

---

## 📏 Règles de Style

### Espacement Minimum
```jsx
// Padding des conteneurs
padding: '1.5rem' // p-6 minimum
padding: '2rem'   // p-8 pour les sections principales

// Gap entre éléments
gap: '1rem'  // gap-4 minimum entre éléments de liste
gap: '1.5rem' // gap-6 entre sections

// Marges
marginBottom: '1.5rem' // mb-6 minimum entre sections
```

### Border Radius Standard
```jsx
// Boutons
borderRadius: '0.5rem' // rounded-lg

// Cards
borderRadius: '1rem' // rounded-xl

// Modals
borderRadius: '1.5rem' // rounded-2xl

// Pills/Badges
borderRadius: '9999px' // rounded-full
```

### Transitions Obligatoires
```jsx
// Sur TOUS les éléments interactifs
className="transition-all duration-200"
className="transition-colors duration-200"
className="transition-transform duration-200"
```

---

## 🎨 Palette de Couleurs Recommandées

### Primaires (Indigo/Purple)
```jsx
// Boutons primaires
'bg-indigo-600 hover:bg-indigo-700'
'bg-purple-600 hover:bg-purple-700'

// Gradients
'bg-gradient-to-r from-indigo-500 to-purple-600'
```

### Succès (Vert)
```jsx
'bg-emerald-500 hover:bg-emerald-600'
'text-emerald-500'
```

### Danger (Rouge)
```jsx
'bg-red-500 hover:bg-red-600'
'text-red-500'
```

### Warning (Jaune)
```jsx
'bg-amber-500 hover:bg-amber-600'
'text-amber-500'
```

### Fonds Dark Mode
```jsx
'bg-slate-900'  // Fond principal
'bg-slate-800'  // Cards/sections
'bg-slate-700'  // Hover states
'text-gray-100' // Texte principal
'text-gray-400' // Texte secondaire
```

---

## 📱 Responsive Obligatoire

### Breakpoints
```jsx
// Mobile first (par défaut)
className="w-full"

// Tablet (md: 768px)
className="md:w-1/2"

// Desktop (lg: 1024px)
className="lg:w-1/3"

// Exemple complet
className="w-full md:w-1/2 lg:w-1/4"
```

### Grid Responsive
```jsx
// Cards grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"

// Sidebar layout
className="flex flex-col md:flex-row"
```

### Sidebar Collapse
```jsx
// Sur mobile: sidebar cachée ou drawer
// Sur desktop: sidebar visible
<aside className="hidden md:block w-64">
  {/* Sidebar content */}
</aside>

// Mobile menu button
<button className="md:hidden">
  ☰
</button>
```

---

## 🔢 Code Minimum

| Type d'App | Lignes Minimum |
|------------|----------------|
| Todo simple | 200+ |
| Kanban | 450+ |
| Notes/Notion | 400+ |
| Dashboard | 350+ |
| CRM | 400+ |
| Chat | 300+ |

---

## ⚡ Performance

### Éviter les re-renders inutiles
```jsx
// ✅ Utiliser useCallback pour les handlers
const handleDelete = useCallback((id) => {
  setItems(prev => prev.filter(item => item.id !== id));
}, []);

// ✅ Utiliser des keys stables
{items.map(item => (
  <Item key={item.id} {...item} />
))}
```

### Lazy state initialization
```jsx
// ✅ Pour les données coûteuses à calculer
const [items, setItems] = useState(() => {
  const saved = localStorage.getItem('items');
  return saved ? JSON.parse(saved) : INITIAL_DATA;
});
```

---

## 🧪 Checklist Avant Livraison

- [ ] Pas de prompt()/alert()/confirm()
- [ ] Données pré-remplies
- [ ] Dark mode fonctionnel
- [ ] localStorage persistence
- [ ] Animations/transitions
- [ ] Hover effects
- [ ] Empty states
- [ ] Mobile responsive
- [ ] Minimum de lignes respecté
- [ ] Gradients/Glassmorphism
- [ ] Icônes/Emojis
- [ ] Modals pour édition
