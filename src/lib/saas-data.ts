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

// Templates correspondants avec leurs prompts
// IMPORTANT: Les prompts doivent être TRÈS détaillés pour obtenir des apps de qualité
export const SAAS_TEMPLATES: Record<string, {
  name: string
  prompt: string
  description: string
}> = {
  'notion-clone': {
    name: 'Clone Notion',
    prompt: `Crée une app de notes complète style Notion avec TOUTES ces fonctionnalités (350+ lignes de code minimum):

STRUCTURE:
- Layout flex avec sidebar à gauche (w-64) et contenu principal à droite
- Sidebar avec: titre "📝 Mes Notes", barre de recherche, liste des pages, bouton "+ Nouvelle page"
- Zone principale avec: header (titre de la page éditable), zone d'édition

FONCTIONNALITÉS OBLIGATOIRES:
1. CRUD pages: créer, renommer (double-clic), supprimer (bouton 🗑️ au hover)
2. Éditeur de texte: textarea avec placeholder, sauvegarde auto
3. Recherche temps réel: filtre les pages par titre
4. Dark mode: toggle ☀️/🌙 qui change le thème
5. localStorage: persister pages et contenu
6. Page active: highlight dans la sidebar
7. Empty states: "Aucune note" si vide

STYLE:
- Fond sombre pour sidebar (bg-gray-900), fond clair pour contenu (bg-white)
- Transitions douces (transition-all duration-200)
- Hover states sur tous les éléments cliquables
- Design moderne avec rounded-lg et shadow`,
    description: 'Notes et docs avec édition riche'
  },
  'kanban': {
    name: 'Tableau Kanban',
    prompt: `Crée un tableau Kanban PROFESSIONNEL style Trello avec TOUTES ces fonctionnalités (400+ lignes minimum):

STRUCTURE:
- Header gradient (from-violet-600 to-purple-700) avec titre "📋 Mon Kanban", bouton dark mode toggle (☀️/🌙)
- 3 colonnes FLEXIBLES côte à côte: "📋 À faire", "🔄 En cours", "✅ Terminé"
- Chaque colonne: header avec titre + compteur badges, zone scrollable de cartes, bouton "+ Ajouter une tâche"

DONNÉES INITIALES (pré-remplies au démarrage):
- À faire: "Finaliser le design", "Écrire la doc"
- En cours: "Développer l'API"
- Terminé: "Setup du projet"

FONCTIONNALITÉS OBLIGATOIRES:
1. DRAG & DROP COMPLET: onDragStart (opacity-50, scale-105), onDragOver (preventDefault, highlight colonne), onDrop (déplacer carte). AJOUTER draggable="true" sur les cartes!
2. MODAL D'ÉDITION VISIBLE: au clic sur carte, afficher un vrai modal overlay (position fixed, bg-black/50) avec form pour éditer titre/description/label
3. CRUD CARTES: créer via input inline (pas prompt!), supprimer avec bouton 🗑️ visible au hover
4. LABELS COLORÉS VISIBLES: chaque carte a un badge coloré (🔴 rouge = urgent, 🟡 jaune = normal, 🟢 vert = low) affiché en haut de la carte
5. localStorage: JSON.stringify/parse pour persister tasks au changement
6. Compteurs dynamiques: badge avec nombre de cartes sur chaque titre de colonne

STYLE PREMIUM (important!):
- Fond général: bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
- Colonnes: bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[300px]
- Cartes: bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 cursor-grab hover:shadow-xl transition-all
- Labels: w-full h-2 rounded-full en haut de chaque carte (bg-red-500/bg-yellow-500/bg-green-500)
- Boutons: bg-violet-500 hover:bg-violet-600 text-white rounded-lg
- Animation drag: transform scale-105 shadow-2xl
- Responsive: flex-col sur mobile (md:flex-row)
- Scrollbar custom: webkit-scrollbar stylé

IMPORTANT: Le résultat doit ressembler à une vraie app production, pas un prototype basique!`,
    description: 'Gestion de projets en colonnes'
  },
  'task-manager': {
    name: 'Gestionnaire de tâches',
    prompt: `Crée un gestionnaire de tâches complet avec TOUTES ces fonctionnalités (250+ lignes minimum):

STRUCTURE:
- Header avec titre, compteur de tâches, filtres
- Liste de tâches avec checkbox, titre, priorité, date, actions
- Footer avec stats

FONCTIONNALITÉS OBLIGATOIRES:
1. CRUD: ajouter tâche avec titre + priorité + date
2. Priorités: haute (rouge), moyenne (jaune), basse (vert)
3. Filtres: Toutes / Actives / Complétées / Par priorité
4. Tri: par date ou priorité
5. Complétion: checkbox qui barre le texte
6. localStorage: persister
7. Dates limites: affichage et warning si passée

STYLE:
- Tâches en cartes avec padding et hover
- Badges de priorité colorés
- Date en rouge si dépassée`,
    description: 'Suivi des tâches et projets'
  },
  'project-dashboard': {
    name: 'Dashboard Projet',
    prompt: `Crée un dashboard projet pro avec TOUTES ces fonctionnalités (250+ lignes minimum):

STRUCTURE:
- Sidebar avec navigation: Dashboard, Projets, Équipe, Paramètres
- Header avec titre de page et avatar utilisateur
- Contenu: 4 stat cards + tableau de projets

FONCTIONNALITÉS OBLIGATOIRES:
1. Stats cards: Projets actifs, Tâches complétées, Heures cette semaine, Équipe
2. Tableau projets: nom, statut, progression (barre), équipe (avatars), actions
3. Filtres par statut: Tous / En cours / Terminés / En pause
4. Responsive: sidebar collapse sur mobile

STYLE:
- Sidebar sombre, contenu clair
- Progress bars colorées selon %
- Avatars empilés pour l'équipe
- Hover sur les lignes du tableau`,
    description: 'Vue d\'ensemble des projets'
  },
  'todo-app': {
    name: 'Todo App',
    prompt: `Crée une Todo App complète et belle avec TOUTES ces fonctionnalités (200+ lignes minimum):

STRUCTURE:
- Container centré avec max-w-md
- Header avec titre et compteur
- Input + bouton ajouter
- Filtres: Toutes / Actives / Complétées
- Liste des tâches
- Footer avec actions

FONCTIONNALITÉS OBLIGATOIRES:
1. Ajouter tâche: input + bouton avec onClick={() => addTodo()}
2. Supprimer: bouton 🗑️ avec onClick={() => deleteTodo(id)}
3. Toggle complété: checkbox qui barre le texte
4. Édition: double-clic pour éditer inline
5. Filtres fonctionnels
6. localStorage: persister
7. "Supprimer terminées": vider les complétées

STYLE:
- Fond gradient (from-purple-500 to-pink-500)
- Carte blanche avec shadow-xl
- Animations sur les items
- Hover states partout`,
    description: 'Liste de tâches simple'
  },
  'chat-app': {
    name: 'Chat d\'équipe',
    prompt: 'Create a Slack-like team chat with: channel sidebar, message list with avatars, message input with emoji, and channel creation. Modern chat UI.',
    description: 'Messagerie instantanée'
  },
  'support-chat': {
    name: 'Support Client',
    prompt: 'Create a customer support chat widget and dashboard with: visitor list, conversation view, canned responses, and status indicators.',
    description: 'Widget de chat support'
  },
  'live-chat': {
    name: 'Chat en direct',
    prompt: 'Create a live chat widget for websites with: chat bubble, conversation interface, typing indicators, and agent availability status.',
    description: 'Chat widget pour site'
  },
  'email-sender': {
    name: 'Email Marketing',
    prompt: 'Create an email marketing dashboard with: campaign list, email composer with templates, subscriber management, and basic analytics.',
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
    prompt: 'Create a Linktree-style link in bio page with: customizable profile, link list with icons, theme customization, and mobile preview.',
    description: 'Page de liens personnalisée'
  },
  'analytics-dashboard': {
    name: 'Dashboard Analytics',
    prompt: 'Create an analytics dashboard with: visitor charts, heatmap visualization mockup, session recordings list, and key metrics cards.',
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
    prompt: 'Create a CRM dashboard with: contacts list, deal pipeline, activity timeline, and key sales metrics. Professional B2B design.',
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
    prompt: 'Create a booking calendar app with: availability settings, calendar view, booking form, and appointments list. Clean scheduling UX.',
    description: 'Prise de rendez-vous'
  },
  'invoice-app': {
    name: 'Facturation',
    prompt: 'Create an invoice app with: invoice list, invoice creator with line items, client management, and payment status tracking.',
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
