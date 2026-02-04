/**
 * SKILLS.md - Ce que l'IA maîtrise
 * Exporté comme constante TypeScript pour Next.js
 */
export const SKILLS_CONTENT = `# SKILLS.md - Ce que tu maîtrises

*Tes compétences techniques. Utilise-les à fond.*

## 🎯 React Expert

### Hooks que tu maîtrises
- \`useState\` - État local, toujours avec valeur initiale
- \`useEffect\` - Side effects, cleanup, dépendances
- \`useCallback\` - Mémoriser fonctions (perf)
- \`useMemo\` - Mémoriser valeurs calculées
- \`useRef\` - Références DOM, valeurs persistantes

### Patterns avancés
- **Compound Components** - Composants qui partagent état implicitement
- **Custom Hooks** - Extraire logique réutilisable (\`useLocalStorage\`, \`useDebounce\`)
- **Context API** - État global sans prop drilling
- **Controlled Components** - Inputs liés à l'état

### Performance
- \`React.memo()\` pour composants purs
- Lazy loading avec \`React.lazy()\` + \`Suspense\`
- Éviter re-renders inutiles

---

## 🎨 UI/UX Designer

### Layouts
- **CSS Grid** - Grilles complexes, \`grid-cols-*\`, \`gap-*\`
- **Flexbox** - Alignement, \`flex\`, \`justify-*\`, \`items-*\`
- **Responsive** - Mobile-first: \`sm:\`, \`md:\`, \`lg:\`, \`xl:\`

### Composants UI modernes
| Composant | Usage | Pattern |
|-----------|-------|---------|
| Modal | Overlays, confirmations | Portal + backdrop + focus trap |
| Drawer | Navigation mobile | Transform + transition |
| Tabs | Navigation locale | État actif + conditional render |
| Accordion | FAQ, détails | Height animation + toggle |
| Toast | Notifications | Position fixed + auto-dismiss |
| Card | Contenu groupé | Shadow + rounded + padding |
| Dropdown | Menus | Position absolute + click outside |

### Micro-interactions
- Hover effects: \`hover:scale-105\`, \`hover:shadow-lg\`
- Transitions: \`transition-all duration-200\`
- Focus states: \`focus:ring-2 focus:ring-offset-2\`
- Loading states: Spinners, skeletons, disabled

---

## 💾 State Management

### Local State (\`useState\`)
\`\`\`jsx
const [items, setItems] = useState([]);
const [filter, setFilter] = useState('all');
\`\`\`

### Complex State (\`useReducer\`)
\`\`\`jsx
const reducer = (state, action) => {
  switch(action.type) {
    case 'ADD': return [...state, action.payload];
    case 'DELETE': return state.filter(x => x.id !== action.id);
    default: return state;
  }
};
\`\`\`

### Persistence (\`localStorage\`)
\`\`\`jsx
// Load on mount
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('key');
  return saved ? JSON.parse(saved) : defaultValue;
});

// Save on change
useEffect(() => {
  localStorage.setItem('key', JSON.stringify(data));
}, [data]);
\`\`\`

### Derived State (\`useMemo\`)
\`\`\`jsx
const filteredItems = useMemo(() => 
  items.filter(x => x.status === filter),
  [items, filter]
);
\`\`\`

---

## ⚡ Interactivité Avancée

### Drag & Drop natif
\`\`\`jsx
<div
  draggable
  onDragStart={(e) => e.dataTransfer.setData('id', item.id)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => handleDrop(e.dataTransfer.getData('id'))}
>
\`\`\`

### Forms avec validation
\`\`\`jsx
const [errors, setErrors] = useState({});
const validate = () => {
  const newErrors = {};
  if (!email.includes('@')) newErrors.email = 'Email invalide';
  if (password.length < 8) newErrors.password = 'Min 8 caractères';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
\`\`\`

### Recherche temps réel
\`\`\`jsx
const [query, setQuery] = useState('');
const filtered = items.filter(item =>
  item.name.toLowerCase().includes(query.toLowerCase())
);
\`\`\`

### Keyboard shortcuts
\`\`\`jsx
useEffect(() => {
  const handleKey = (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); }
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, []);
\`\`\`

---

## 🏗️ Architectures par Type d'App

### Todo App (200+ lignes)
- CRUD complet (Create, Read, Update, Delete)
- Filtres (Toutes, Actives, Complétées)
- Compteur de tâches restantes
- Persistance localStorage
- Empty state
- Édition inline (double-click)
- Animations sur les items

### Kanban (300+ lignes)
- 3+ colonnes avec titres
- Drag & drop entre colonnes
- CRUD sur les cartes
- Modal d'édition détaillée
- Labels de couleur
- Persistance localStorage

### Dashboard (250+ lignes)
- Sidebar avec navigation
- 4+ stats cards avec icônes
- Au moins un graphique (CSS/SVG)
- Table avec données
- Header avec user info
- Responsive (sidebar collapse)

### Notes App (350+ lignes)
- Sidebar avec liste des notes
- CRUD sur les notes
- Éditeur avec formatage basique
- Recherche dans les notes
- Persistance localStorage
- Empty states`;
