// Base de données des SaaS qu'on peut remplacer
export interface SaaSApp {
  id: string
  name: string
  icon: string
  monthlyPrice: number
  category: string
  templateId: string
  description: string
}

export const SAAS_APPS: SaaSApp[] = [
  // Productivité
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    monthlyPrice: 10,
    category: 'productivité',
    templateId: 'notion-clone',
    description: 'Notes et documentation'
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: '📋',
    monthlyPrice: 10,
    category: 'productivité',
    templateId: 'kanban',
    description: 'Gestion de projets Kanban'
  },
  {
    id: 'asana',
    name: 'Asana',
    icon: '✅',
    monthlyPrice: 11,
    category: 'productivité',
    templateId: 'task-manager',
    description: 'Gestion des tâches'
  },
  {
    id: 'monday',
    name: 'Monday.com',
    icon: '📊',
    monthlyPrice: 9,
    category: 'productivité',
    templateId: 'project-dashboard',
    description: 'Gestion de projets'
  },
  {
    id: 'todoist',
    name: 'Todoist',
    icon: '☑️',
    monthlyPrice: 5,
    category: 'productivité',
    templateId: 'todo-app',
    description: 'Liste de tâches'
  },
  
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    monthlyPrice: 8,
    category: 'communication',
    templateId: 'chat-app',
    description: 'Messagerie d\'équipe'
  },
  {
    id: 'intercom',
    name: 'Intercom',
    icon: '🗨️',
    monthlyPrice: 74,
    category: 'communication',
    templateId: 'support-chat',
    description: 'Support client'
  },
  {
    id: 'crisp',
    name: 'Crisp',
    icon: '💭',
    monthlyPrice: 25,
    category: 'communication',
    templateId: 'live-chat',
    description: 'Chat en direct'
  },
  
  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    icon: '📧',
    monthlyPrice: 13,
    category: 'marketing',
    templateId: 'email-sender',
    description: 'Email marketing'
  },
  {
    id: 'convertkit',
    name: 'ConvertKit',
    icon: '✉️',
    monthlyPrice: 15,
    category: 'marketing',
    templateId: 'newsletter',
    description: 'Newsletter'
  },
  {
    id: 'buffer',
    name: 'Buffer',
    icon: '📱',
    monthlyPrice: 6,
    category: 'marketing',
    templateId: 'social-scheduler',
    description: 'Planification réseaux sociaux'
  },
  {
    id: 'linktree',
    name: 'Linktree',
    icon: '🌳',
    monthlyPrice: 5,
    category: 'marketing',
    templateId: 'link-in-bio',
    description: 'Page de liens'
  },
  
  // Analytics
  {
    id: 'hotjar',
    name: 'Hotjar',
    icon: '🔥',
    monthlyPrice: 32,
    category: 'analytics',
    templateId: 'analytics-dashboard',
    description: 'Heatmaps et analytics'
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    icon: '📈',
    monthlyPrice: 25,
    category: 'analytics',
    templateId: 'event-analytics',
    description: 'Analytics produit'
  },
  
  // Design
  {
    id: 'canva',
    name: 'Canva Pro',
    icon: '🎨',
    monthlyPrice: 13,
    category: 'design',
    templateId: 'image-editor',
    description: 'Design graphique'
  },
  {
    id: 'loom',
    name: 'Loom',
    icon: '🎥',
    monthlyPrice: 15,
    category: 'communication',
    templateId: 'video-recorder',
    description: 'Enregistrement vidéo'
  },
  
  // CRM
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🧲',
    monthlyPrice: 45,
    category: 'crm',
    templateId: 'crm-dashboard',
    description: 'CRM et ventes'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    icon: '🎯',
    monthlyPrice: 15,
    category: 'crm',
    templateId: 'sales-pipeline',
    description: 'Pipeline de ventes'
  },
  
  // Formulaires
  {
    id: 'typeform',
    name: 'Typeform',
    icon: '📝',
    monthlyPrice: 25,
    category: 'formulaires',
    templateId: 'form-builder',
    description: 'Formulaires interactifs'
  },
  {
    id: 'calendly',
    name: 'Calendly',
    icon: '📅',
    monthlyPrice: 12,
    category: 'productivité',
    templateId: 'booking-calendar',
    description: 'Prise de rendez-vous'
  },
  
  // Facturation
  {
    id: 'freshbooks',
    name: 'FreshBooks',
    icon: '💰',
    monthlyPrice: 17,
    category: 'facturation',
    templateId: 'invoice-app',
    description: 'Facturation'
  },
  {
    id: 'wave',
    name: 'Wave',
    icon: '🌊',
    monthlyPrice: 16,
    category: 'facturation',
    templateId: 'accounting',
    description: 'Comptabilité'
  },
]

// ============================================================================
// TEMPLATES AVEC PROMPTS ULTRA-DÉTAILLÉS POUR APPS DE QUALITÉ PRODUCTION
// ============================================================================
// RÈGLE D'OR: Plus le prompt est détaillé, meilleure sera l'app générée.
// Chaque prompt doit spécifier: structure, composants, états, interactions,
// styles, animations, données initiales, et edge cases.
// ============================================================================

export const SAAS_TEMPLATES: Record<string, {
  name: string
  prompt: string
  description: string
}> = {
  // ════════════════════════════════════════════════════════════════════════════
  // 📝 NOTION CLONE - App de notes professionnelle
  // ════════════════════════════════════════════════════════════════════════════
  'notion-clone': {
    name: 'Clone Notion',
    prompt: `Tu es un développeur senior React. Crée une app de notes PROFESSIONNELLE style Notion.

## ARCHITECTURE OBLIGATOIRE

### Structure des composants (dans App.js)
\`\`\`
App
├── Sidebar (w-64, fixed left)
│   ├── Logo + Titre "Mes Notes"
│   ├── SearchBar (filtre temps réel)
│   ├── PageList (pages avec nested children)
│   │   └── PageItem (récursif pour nested)
│   ├── NewPageButton
│   └── DarkModeToggle
├── MainContent (flex-1, ml-64)
│   ├── PageHeader
│   │   ├── BreadcrumbNav
│   │   ├── EditableTitle (contentEditable)
│   │   ├── PageActions (export, delete)
│   │   └── LastModified timestamp
│   └── Editor
│       ├── BlockToolbar (format buttons)
│       └── BlockList
│           └── Block (text, heading, list, code, quote)
\`\`\`

### État global (useState au top level)
\`\`\`javascript
const [pages, setPages] = useState([
  {
    id: '1',
    title: 'Bienvenue',
    content: [
      { id: 'b1', type: 'heading', content: 'Bienvenue dans tes Notes!' },
      { id: 'b2', type: 'text', content: 'Ceci est ton espace personnel pour organiser tes idées.' },
      { id: 'b3', type: 'list', content: ['Creer des pages', 'Organiser en sous-pages', 'Rechercher rapidement'] },
    ],
    parentId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    icon: 'page',
    isExpanded: true,
  },
  {
    id: '2',
    title: 'Projets',
    content: [{ id: 'b4', type: 'text', content: 'Liste de mes projets en cours...' }],
    parentId: null,
    icon: 'folder',
    isExpanded: true,
  },
  {
    id: '3',
    title: 'Projet Alpha',
    content: [{ id: 'b5', type: 'text', content: 'Details du projet Alpha' }],
    parentId: '2', // NESTED sous "Projets"
    icon: 'rocket',
  },
])
const [selectedPageId, setSelectedPageId] = useState('1')
const [searchQuery, setSearchQuery] = useState('')
const [isDarkMode, setIsDarkMode] = useState(false)
\`\`\`

### localStorage Persistence
\`\`\`javascript
// Charger au mount
useEffect(() => {
  const saved = localStorage.getItem('notion-pages')
  if (saved) setPages(JSON.parse(saved))
  const darkMode = localStorage.getItem('notion-dark') === 'true'
  setIsDarkMode(darkMode)
}, [])

// Sauvegarder à chaque changement
useEffect(() => {
  localStorage.setItem('notion-pages', JSON.stringify(pages))
}, [pages])
\`\`\`

## FONCTIONNALITÉS DÉTAILLÉES

### 1. Sidebar Navigation
- Logo animé avec hover scale
- Barre de recherche avec icône 🔍, placeholder "Rechercher...", filtre en temps réel
- Liste des pages avec indentation pour nested (padding-left: level * 16px)
- Chaque page affiche: icône + titre (tronqué si trop long)
- Hover: fond légèrement plus clair + boutons ➕ (add child) et 🗑️ (delete)
- Clic: sélectionne la page
- Double-clic: mode édition inline du titre
- Bouton "+ Nouvelle page" sticky en bas

### 2. Page Items (récursif)
\`\`\`javascript
function PageItem({ page, level = 0, pages, onSelect, onDelete, onAddChild }) {
  const [isEditing, setIsEditing] = useState(false)
  const children = pages.filter(p => p.parentId === page.id)
  
  return (
    <div style={{ paddingLeft: level * 16 }}>
      <div className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
        {children.length > 0 && (
          <button onClick={() => toggleExpand(page.id)}>
            {page.isExpanded ? '▼' : '▶'}
          </button>
        )}
        <span>{page.icon}</span>
        {isEditing ? (
          <input autoFocus value={page.title} onBlur={() => setIsEditing(false)} />
        ) : (
          <span onDoubleClick={() => setIsEditing(true)}>{page.title}</span>
        )}
        <div className="ml-auto opacity-0 group-hover:opacity-100 flex gap-1">
          <button onClick={() => onAddChild(page.id)}>➕</button>
          <button onClick={() => onDelete(page.id)}>🗑️</button>
        </div>
      </div>
      {page.isExpanded && children.map(child => (
        <PageItem key={child.id} page={child} level={level + 1} {...props} />
      ))}
    </div>
  )
}
\`\`\`

### 3. Éditeur de Blocs
Types de blocs supportés:
- **text**: paragraphe simple, placeholder "Tapez '/' pour les commandes..."
- **heading**: h1/h2/h3 avec style bold et taille différente
- **list**: ul avec bullets, chaque item éditable
- **code**: fond gris, font-mono, padding
- **quote**: bordure gauche colorée, italique

Chaque bloc:
- Hover: toolbar flottante avec actions (type, move up/down, delete)
- Enter: crée nouveau bloc en dessous
- Backspace sur bloc vide: supprime le bloc
- Slash command "/" : affiche menu de types

### 4. Raccourcis Clavier (event handlers)
\`\`\`javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'n') { e.preventDefault(); createNewPage() }
      if (e.key === 's') { e.preventDefault(); /* auto-saved */ }
      if (e.key === 'f') { e.preventDefault(); focusSearch() }
      if (e.key === 'd') { e.preventDefault(); toggleDarkMode() }
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
\`\`\`

### 5. Dark Mode
Toggle ☀️/🌙 dans la sidebar
Classes conditionnelles sur le conteneur racine:
- Light: bg-white text-gray-900
- Dark: bg-gray-900 text-gray-100

## STYLES CSS OBLIGATOIRES

\`\`\`css
/* Container principal */
.app { display: flex; min-height: 100vh; }

/* Sidebar */
.sidebar {
  width: 16rem; /* w-64 */
  background: #f7f7f5;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}
.dark .sidebar { background: #1f1f1f; border-color: #333; }

/* Page item */
.page-item {
  transition: all 0.15s ease;
  border-radius: 4px;
}
.page-item:hover { background: rgba(0,0,0,0.04); }
.dark .page-item:hover { background: rgba(255,255,255,0.04); }
.page-item.active { background: rgba(0,0,0,0.08); }

/* Main content */
.main { flex: 1; margin-left: 16rem; padding: 2rem 4rem; max-width: 900px; }

/* Editor blocks */
.block { padding: 0.25rem 0; position: relative; }
.block:hover .block-toolbar { opacity: 1; }
.block-toolbar { position: absolute; left: -40px; opacity: 0; transition: opacity 0.2s; }

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; } }
.animate-fade-in { animation: fadeIn 0.2s ease; }
\`\`\`

## DÉTAILS UX

1. Empty state: "Aucune note trouvée" avec illustration ou emoji
2. Confirmation avant suppression d'une page avec enfants
3. Breadcrumb navigation pour pages nested
4. Indicateur de sauvegarde "Sauvegardé ✓" qui apparaît/disparaît
5. Smooth scroll au changement de page
6. Focus auto sur le titre quand on crée une nouvelle page

## CODE MINIMUM: 400+ lignes
Le code DOIT être complet, fonctionnel, et impressionnant visuellement.`,
    description: 'Notes et docs avec édition riche'
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 📋 KANBAN BOARD - Gestion de projets style Trello
  // ════════════════════════════════════════════════════════════════════════════
  'kanban': {
    name: 'Tableau Kanban',
    prompt: `Tu es un développeur senior React. Crée un tableau Kanban PROFESSIONNEL style Trello.

## ARCHITECTURE OBLIGATOIRE

### Structure des composants
\`\`\`
App
├── Header
│   ├── Logo "📋 Mon Kanban"
│   ├── BoardTitle (éditable)
│   └── DarkModeToggle ☀️/🌙
├── Board (horizontal scroll)
│   ├── Column (répété pour chaque colonne)
│   │   ├── ColumnHeader
│   │   │   ├── Icon + Title (éditable)
│   │   │   ├── CardCount badge
│   │   │   └── ColumnMenu (rename, delete)
│   │   ├── CardList (drop zone)
│   │   │   └── Card (draggable)
│   │   │       ├── ColorLabel (top bar)
│   │   │       ├── CardTitle
│   │   │       ├── CardDescription (preview)
│   │   │       ├── Tags/Labels
│   │   │       └── CardFooter (due date, assignee)
│   │   └── AddCardButton
│   └── AddColumnButton
└── CardModal (overlay quand carte sélectionnée)
    ├── ModalHeader (title, close)
    ├── ModalBody
    │   ├── DescriptionEditor
    │   ├── LabelSelector
    │   ├── DueDatePicker
    │   └── ChecklistSection
    └── ModalFooter (delete, archive)
\`\`\`

### État global
\`\`\`javascript
const [columns, setColumns] = useState([
  {
    id: 'todo',
    title: 'A faire',
    color: '#6366f1', // indigo
    cards: [
      {
        id: 'card-1',
        title: 'Finaliser le design',
        description: 'Revoir les maquettes Figma et valider avec l\\'équipe',
        label: 'red', // red, yellow, green, blue, purple
        dueDate: '2024-02-15',
        checklist: [
          { id: 'c1', text: 'Maquette mobile', done: true },
          { id: 'c2', text: 'Maquette desktop', done: false },
        ],
        createdAt: Date.now(),
      },
      {
        id: 'card-2',
        title: 'Écrire la documentation',
        description: 'Documenter l\\'API et les composants',
        label: 'yellow',
        dueDate: null,
        checklist: [],
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'En cours',
    color: '#f59e0b', // amber
    cards: [
      {
        id: 'card-3',
        title: 'Développer l\\'API',
        description: 'Endpoints REST pour le CRUD',
        label: 'blue',
        dueDate: '2024-02-10',
        checklist: [
          { id: 'c3', text: 'GET /tasks', done: true },
          { id: 'c4', text: 'POST /tasks', done: true },
          { id: 'c5', text: 'DELETE /tasks', done: false },
        ],
      },
    ],
  },
  {
    id: 'done',
    title: 'Termine',
    color: '#10b981', // emerald
    cards: [
      {
        id: 'card-4',
        title: 'Setup du projet',
        description: 'Init React + Tailwind + tests',
        label: 'green',
        dueDate: '2024-02-01',
        checklist: [],
      },
    ],
  },
])
const [selectedCard, setSelectedCard] = useState(null) // Pour le modal
const [draggedCard, setDraggedCard] = useState(null)
const [dragOverColumn, setDragOverColumn] = useState(null)
const [isDarkMode, setIsDarkMode] = useState(false)
\`\`\`

## DRAG & DROP NATIF (CRITIQUE!)

\`\`\`javascript
// Sur la carte (draggable)
<div
  draggable="true"
  onDragStart={(e) => {
    setDraggedCard({ cardId: card.id, sourceColumnId: column.id })
    e.dataTransfer.effectAllowed = 'move'
    // Animation: réduire l'opacité
    e.currentTarget.style.opacity = '0.5'
  }}
  onDragEnd={(e) => {
    e.currentTarget.style.opacity = '1'
    setDraggedCard(null)
    setDragOverColumn(null)
  }}
  className={cn(
    "bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md cursor-grab",
    "hover:shadow-lg transition-all duration-200",
    "active:cursor-grabbing active:scale-105"
  )}
>

// Sur la colonne (drop zone)
<div
  onDragOver={(e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(column.id)
  }}
  onDragLeave={() => setDragOverColumn(null)}
  onDrop={(e) => {
    e.preventDefault()
    if (draggedCard && draggedCard.sourceColumnId !== column.id) {
      moveCard(draggedCard.cardId, draggedCard.sourceColumnId, column.id)
    }
    setDragOverColumn(null)
  }}
  className={cn(
    "min-h-[200px] p-2 rounded-lg transition-colors",
    dragOverColumn === column.id && "bg-indigo-100 dark:bg-indigo-900/30"
  )}
>
\`\`\`

### Fonction moveCard
\`\`\`javascript
const moveCard = (cardId, sourceColId, targetColId) => {
  setColumns(prev => {
    const newColumns = [...prev]
    const sourceCol = newColumns.find(c => c.id === sourceColId)
    const targetCol = newColumns.find(c => c.id === targetColId)
    
    const cardIndex = sourceCol.cards.findIndex(c => c.id === cardId)
    const [card] = sourceCol.cards.splice(cardIndex, 1)
    targetCol.cards.push(card)
    
    return newColumns
  })
}
\`\`\`

## MODAL D'ÉDITION (CRITIQUE!)

\`\`\`javascript
{selectedCard && (
  <div 
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    onClick={() => setSelectedCard(null)}
  >
    <div 
      className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-6 border-b dark:border-slate-700">
        <input
          type="text"
          value={selectedCard.title}
          onChange={(e) => updateCard(selectedCard.id, { title: e.target.value })}
          className="text-xl font-bold bg-transparent border-none focus:outline-none w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          Dans la colonne: {getColumnForCard(selectedCard.id)?.title}
        </p>
      </div>
      
      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Labels */}
        <div>
          <h3 className="font-semibold mb-2">🏷️ Label</h3>
          <div className="flex gap-2">
            {['red', 'yellow', 'green', 'blue', 'purple'].map(color => (
              <button
                key={color}
                onClick={() => updateCard(selectedCard.id, { label: color })}
                className={cn(
                  "w-8 h-8 rounded-full transition-transform",
                  selectedCard.label === color && "ring-2 ring-offset-2 scale-110",
                  color === 'red' && "bg-red-500",
                  color === 'yellow' && "bg-yellow-500",
                  color === 'green' && "bg-green-500",
                  color === 'blue' && "bg-blue-500",
                  color === 'purple' && "bg-purple-500"
                )}
              />
            ))}
          </div>
        </div>
        
        {/* Description */}
        <div>
          <h3 className="font-semibold mb-2">📝 Description</h3>
          <textarea
            value={selectedCard.description}
            onChange={(e) => updateCard(selectedCard.id, { description: e.target.value })}
            placeholder="Ajouter une description..."
            className="w-full p-3 border rounded-lg resize-none h-24 dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
        
        {/* Due Date */}
        <div>
          <h3 className="font-semibold mb-2">📅 Date limite</h3>
          <input
            type="date"
            value={selectedCard.dueDate || ''}
            onChange={(e) => updateCard(selectedCard.id, { dueDate: e.target.value })}
            className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
        
        {/* Checklist */}
        <div>
          <h3 className="font-semibold mb-2">☑️ Checklist</h3>
          {selectedCard.checklist.map(item => (
            <div key={item.id} className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleChecklistItem(selectedCard.id, item.id)}
              />
              <span className={item.done ? 'line-through text-gray-400' : ''}>
                {item.text}
              </span>
            </div>
          ))}
          <button 
            onClick={() => addChecklistItem(selectedCard.id)}
            className="text-sm text-indigo-500 hover:underline"
          >
            + Ajouter un item
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-6 border-t dark:border-slate-700 flex justify-between">
        <button
          onClick={() => deleteCard(selectedCard.id)}
          className="text-red-500 hover:text-red-600"
        >
          🗑️ Supprimer
        </button>
        <button
          onClick={() => setSelectedCard(null)}
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
)}
\`\`\`

## STYLES PREMIUM

\`\`\`css
/* Fond dégradé sombre style Trello/Linear */
.board-bg {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  min-height: 100vh;
}

/* Colonnes glassmorphism */
.column {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  min-width: 300px;
  max-width: 300px;
}

/* Cartes avec micro-interactions */
.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
.card:active {
  transform: scale(1.02);
  cursor: grabbing;
}

/* Label bar en haut de carte */
.card-label {
  height: 6px;
  border-radius: 6px 6px 0 0;
}

/* Animation d'entrée des cartes */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.card { animation: slideIn 0.2s ease; }

/* Drop zone highlight */
.drop-zone-active {
  background: rgba(99, 102, 241, 0.2);
  border: 2px dashed #6366f1;
}
\`\`\`

## FONCTIONNALITÉS BONUS

1. **Compteur de cartes** sur chaque colonne header
2. **Progression checklist** (2/5 items) affichée sur la carte
3. **Tri des cartes** par date ou priorité
4. **Recherche/filtre** des cartes
5. **Ajout de colonne** avec "+ Ajouter une colonne"
6. **Renommer colonne** en double-cliquant

## localStorage Persistence
\`\`\`javascript
useEffect(() => {
  const saved = localStorage.getItem('kanban-columns')
  if (saved) setColumns(JSON.parse(saved))
}, [])

useEffect(() => {
  localStorage.setItem('kanban-columns', JSON.stringify(columns))
}, [columns])
\`\`\`

## CODE MINIMUM: 500+ lignes
Le résultat doit être IMPRESSIONNANT. Un débutant doit dire "WOW c'est une vraie app!"`,
    description: 'Gestion de projets en colonnes'
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ✅ TASK MANAGER - Gestionnaire de tâches avancé
  // ════════════════════════════════════════════════════════════════════════════
  'task-manager': {
    name: 'Gestionnaire de tâches',
    prompt: `Tu es un développeur senior React. Crée un gestionnaire de tâches PROFESSIONNEL.

## ARCHITECTURE

### Structure
\`\`\`
App
├── Header
│   ├── Title "✅ Mes Tâches"
│   ├── Stats (total, completed, pending)
│   └── DarkModeToggle
├── FilterBar
│   ├── FilterTabs (Toutes | Actives | Terminées)
│   ├── PriorityFilter (Dropdown: Toutes, Haute, Moyenne, Basse)
│   ├── SortButton (Date | Priorité)
│   └── SearchInput
├── AddTaskForm
│   ├── TitleInput
│   ├── PrioritySelect
│   ├── DatePicker
│   └── AddButton
└── TaskList
    └── TaskItem
        ├── Checkbox
        ├── PriorityBadge (🔴/🟡/🟢)
        ├── Title (barré si done)
        ├── DueDate (rouge si passée)
        ├── EditButton
        └── DeleteButton
\`\`\`

### État
\`\`\`javascript
const [tasks, setTasks] = useState([
  { id: '1', title: 'Préparer la présentation', priority: 'high', dueDate: '2024-02-10', done: false },
  { id: '2', title: 'Répondre aux emails', priority: 'medium', dueDate: '2024-02-08', done: true },
  { id: '3', title: 'Faire les courses', priority: 'low', dueDate: null, done: false },
  { id: '4', title: 'Appeler le client', priority: 'high', dueDate: '2024-02-05', done: false },
])
const [filter, setFilter] = useState('all') // all, active, completed
const [priorityFilter, setPriorityFilter] = useState('all')
const [sortBy, setSortBy] = useState('date') // date, priority
const [search, setSearch] = useState('')
\`\`\`

## FONCTIONNALITÉS

1. **CRUD complet** avec animations
2. **Filtres combinables** (statut + priorité + recherche)
3. **Tri** par date ou priorité
4. **Date limite** avec warning visuel si passée
5. **Badges priorité**: 🔴 Haute, 🟡 Moyenne, 🟢 Basse
6. **Statistiques en temps réel**
7. **localStorage** persistence

## STYLES
- Cards avec shadow et hover effect
- Animations slide-in pour nouvelles tâches
- Transition strikethrough sur completion
- Fond gradient subtil
- Responsive mobile-first

CODE MINIMUM: 300+ lignes`,
    description: 'Suivi des tâches et projets'
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 📊 PROJECT DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  'project-dashboard': {
    name: 'Dashboard Projet',
    prompt: `Crée un dashboard projet professionnel avec:

## STRUCTURE
- Sidebar navigation (Dashboard, Projets, Équipe, Paramètres)
- Header avec avatar utilisateur et notifications
- 4 stat cards animées (Projets actifs, Tâches terminées, Heures, Membres)
- Tableau de projets avec progress bars
- Graphique de progression (barres simples en CSS)

## DONNÉES INITIALES
\`\`\`javascript
const [projects] = useState([
  { id: '1', name: 'Refonte Site Web', status: 'active', progress: 75, team: ['JD', 'ML'], dueDate: '2024-03-01' },
  { id: '2', name: 'App Mobile', status: 'active', progress: 45, team: ['JD', 'SL', 'PT'], dueDate: '2024-04-15' },
  { id: '3', name: 'API Backend', status: 'completed', progress: 100, team: ['AC'], dueDate: '2024-01-20' },
])
\`\`\`

## STYLE
- Sidebar sombre, contenu clair
- Progress bars avec gradients
- Avatars empilés avec overlap
- Hover effects sur les lignes
- Responsive avec sidebar collapse

CODE MINIMUM: 350+ lignes`,
    description: 'Vue d\'ensemble des projets'
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ☑️ TODO APP - Simple mais élégante
  // ════════════════════════════════════════════════════════════════════════════
  'todo-app': {
    name: 'Todo App',
    prompt: `Crée une Todo App MAGNIFIQUE et complète.

## STRUCTURE
\`\`\`
App (max-w-md mx-auto, fond gradient)
├── Header
│   ├── Title "☑️ Ma Todo List"
│   ├── Date du jour
│   └── Compteur (X tâches restantes)
├── AddTodo
│   ├── Input (placeholder: "Ajouter une tâche...")
│   └── Button "+" (cercle, hover animation)
├── FilterTabs
│   ├── Toutes (badge count)
│   ├── Actives (badge count)
│   └── Terminées (badge count)
├── TodoList
│   └── TodoItem
│       ├── Checkbox (cercle custom)
│       ├── Text (strikethrough si done)
│       ├── EditButton (✏️)
│       └── DeleteButton (🗑️)
└── Footer
    ├── "X items restants"
    └── "Supprimer terminées" (si > 0 done)
\`\`\`

## DONNÉES
\`\`\`javascript
const [todos, setTodos] = useState([
  { id: '1', text: 'Apprendre React', done: true },
  { id: '2', text: 'Créer une super app', done: false },
  { id: '3', text: 'Devenir un pro', done: false },
])
\`\`\`

## ANIMATIONS
- Slide-in pour nouvelles tâches
- Fade-out pour suppression
- Bounce sur checkbox
- Strikethrough animé

## STYLE
\`\`\`css
.app-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 2rem; }
.card { background: white; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.checkbox { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #ddd; transition: all 0.2s; }
.checkbox.checked { background: linear-gradient(135deg, #667eea, #764ba2); border-color: transparent; }
\`\`\`

CODE MINIMUM: 250+ lignes`,
    description: 'Liste de tâches simple'
  },

  // Autres templates avec prompts améliorés
  'chat-app': {
    name: 'Chat d\'équipe',
    prompt: `Crée un chat d'équipe style Slack avec:

## STRUCTURE
- Sidebar avec liste des channels (#général, #random, #dev)
- Zone de messages avec avatars, timestamps, réactions
- Input avec bouton emoji et envoi
- Header avec nom du channel et membres en ligne

## DONNÉES INITIALES
Pré-remplis avec des messages de démonstration entre utilisateurs fictifs.

## STYLE
- Messages groupés par utilisateur
- Hover pour afficher actions (réagir, répondre)
- Indicateur "typing..."
- Scroll auto en bas
- Dark mode support

CODE MINIMUM: 300+ lignes`,
    description: 'Messagerie instantanée'
  },
  'support-chat': {
    name: 'Support Client',
    prompt: 'Create a customer support chat widget and dashboard with: visitor list, conversation view, canned responses, and status indicators. Include mock conversations.',
    description: 'Widget de chat support'
  },
  'live-chat': {
    name: 'Chat en direct',
    prompt: 'Create a live chat widget for websites with: chat bubble, conversation interface, typing indicators, and agent availability status.',
    description: 'Chat widget pour site'
  },
  'email-sender': {
    name: 'Email Marketing',
    prompt: `Crée un dashboard email marketing avec:

## FONCTIONNALITÉS
- Liste des campagnes (draft, sent, scheduled)
- Éditeur d'email avec preview
- Statistiques (opens, clicks, bounces)
- Liste de contacts avec tags

## DONNÉES
Pré-remplir avec 3 campagnes et stats fictives.

CODE MINIMUM: 300+ lignes`,
    description: 'Campagnes email'
  },
  'newsletter': {
    name: 'Newsletter',
    prompt: 'Create a newsletter management app with: subscriber list, email composer, send history, and subscription form preview.',
    description: 'Gestion de newsletter'
  },
  'social-scheduler': {
    name: 'Planificateur Social',
    prompt: 'Create a social media scheduler with: calendar view, post composer, platform selection (Twitter, LinkedIn, Instagram mockups), and scheduled posts list.',
    description: 'Planification des posts'
  },
  'link-in-bio': {
    name: 'Page de liens',
    prompt: `Crée une page Linktree avec:

## FONCTIONNALITÉS
- Profile header (photo, nom, bio)
- Liste de liens personnalisables avec icônes
- Thèmes (couleurs, fonts)
- Preview mobile en temps réel
- Analytics (clicks par lien)

## STYLE
- Centré, mobile-first
- Boutons arrondis avec hover
- Animations subtiles

CODE MINIMUM: 250+ lignes`,
    description: 'Page de liens personnalisée'
  },
  'analytics-dashboard': {
    name: 'Dashboard Analytics',
    prompt: `Crée un dashboard analytics avec:

## WIDGETS
- Stat cards (visiteurs, sessions, bounce rate, durée moyenne)
- Graphique de visiteurs (derniers 7 jours, barres CSS)
- Top pages tableau
- Sources de trafic (pie chart en CSS)
- Heatmap grid (mockup)

## DONNÉES
\`\`\`javascript
const [stats] = useState({
  visitors: 12847,
  sessions: 18293,
  bounceRate: 42.3,
  avgDuration: '2m 34s',
  dailyVisitors: [320, 450, 380, 520, 490, 610, 580],
  topPages: [
    { path: '/', views: 4521 },
    { path: '/pricing', views: 2341 },
    { path: '/features', views: 1876 },
  ]
})
\`\`\`

CODE MINIMUM: 300+ lignes`,
    description: 'Visualisation des données'
  },
  'event-analytics': {
    name: 'Analytics Événements',
    prompt: 'Create a product analytics dashboard with: event tracking table, funnel visualization, user segments, and retention charts.',
    description: 'Suivi des événements'
  },
  'image-editor': {
    name: 'Éditeur d\'images',
    prompt: 'Create an image editor UI with: canvas area, toolbar with basic tools, layer panel, and template gallery. Focus on clean design.',
    description: 'Création graphique simple'
  },
  'video-recorder': {
    name: 'Enregistreur Vidéo',
    prompt: 'Create a video recording app UI with: recording controls, video preview, recording list, and share options.',
    description: 'Enregistrement et partage'
  },
  'crm-dashboard': {
    name: 'CRM Dashboard',
    prompt: `Crée un CRM dashboard avec:

## STRUCTURE
- Sidebar navigation
- Stats cards (Contacts, Deals, Revenue, Tasks)
- Pipeline visuel (colonnes: Lead → Qualified → Proposal → Won)
- Tableau contacts récents
- Activity timeline

## DONNÉES INITIALES
\`\`\`javascript
const [contacts] = useState([
  { id: '1', name: 'Marie Dupont', company: 'TechCorp', status: 'qualified', value: 15000 },
  { id: '2', name: 'Jean Martin', company: 'StartupX', status: 'lead', value: 8000 },
])
\`\`\`

CODE MINIMUM: 350+ lignes`,
    description: 'Gestion des contacts'
  },
  'sales-pipeline': {
    name: 'Pipeline de Ventes',
    prompt: 'Create a sales pipeline view with: deal stages as columns, draggable deal cards, deal value totals, and win probability.',
    description: 'Suivi des opportunités'
  },
  'form-builder': {
    name: 'Créateur de Formulaires',
    prompt: 'Create a form builder with: drag-and-drop questions, question types (text, choice, rating), preview mode, and responses view.',
    description: 'Formulaires personnalisés'
  },
  'booking-calendar': {
    name: 'Calendrier RDV',
    prompt: `Crée un système de booking style Calendly avec:

## STRUCTURE
- Vue semaine avec créneaux disponibles
- Formulaire de configuration (durée RDV, horaires)
- Page de réservation publique
- Liste des RDV à venir

## DONNÉES
\`\`\`javascript
const [availability] = useState({
  monday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  tuesday: ['09:00', '10:00', '14:00', '15:00'],
  // ...
})
const [bookings] = useState([
  { id: '1', date: '2024-02-10', time: '10:00', name: 'Jean', email: 'jean@mail.com' },
])
\`\`\`

CODE MINIMUM: 300+ lignes`,
    description: 'Prise de rendez-vous'
  },
  'invoice-app': {
    name: 'Facturation',
    prompt: `Crée une app de facturation avec:

## FONCTIONNALITÉS
- Liste des factures (draft, sent, paid, overdue)
- Créateur de facture avec ligne items
- Calcul automatique (sous-total, TVA, total)
- PDF preview
- Gestion clients

## DONNÉES
\`\`\`javascript
const [invoices] = useState([
  {
    id: 'INV-001',
    client: 'TechCorp',
    items: [
      { description: 'Développement web', qty: 10, price: 500 },
      { description: 'Design UI/UX', qty: 5, price: 400 },
    ],
    status: 'paid',
    date: '2024-01-15',
  },
])
\`\`\`

CODE MINIMUM: 350+ lignes`,
    description: 'Création de factures'
  },
  'accounting': {
    name: 'Comptabilité',
    prompt: 'Create a simple accounting dashboard with: income/expenses tracking, transaction list, category breakdown chart, and monthly summary.',
    description: 'Suivi financier'
  },
}

// Catégories pour le regroupement
export const SAAS_CATEGORIES = [
  { id: 'productivité', name: 'Productivité', icon: '⚡' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'marketing', name: 'Marketing', icon: '📣' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
  { id: 'design', name: 'Design', icon: '🎨' },
  { id: 'crm', name: 'CRM & Ventes', icon: '🎯' },
  { id: 'formulaires', name: 'Formulaires', icon: '📝' },
  { id: 'facturation', name: 'Facturation', icon: '💰' },
]

// Fonction utilitaire pour calculer les économies
export function calculateYearlySavings(monthlyPrice: number): number {
  return monthlyPrice * 12
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
