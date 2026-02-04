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
    prompt: `Crée une app de notes complète style Notion avec architecture MULTI-FICHIERS.

⚠️ IMPORTANT: Utilise write_file pour créer CHAQUE fichier séparément:

FICHIERS À CRÉER (dans cet ordre):

1. **/components/Sidebar.js** - Sidebar de navigation
   - Liste des pages avec titre
   - Barre de recherche
   - Bouton "+ Nouvelle page"
   - Page active highlightée
   - Bouton supprimer 🗑️ au hover
   - Props: pages, activePage, onSelect, onDelete, onCreate, searchQuery, onSearch

2. **/components/Editor.js** - Éditeur de contenu
   - Titre éditable (input)
   - Zone de texte (textarea)
   - Sauvegarde auto (onChange)
   - Empty state si pas de page sélectionnée
   - Props: page, onUpdate

3. **/components/Header.js** - Header avec actions
   - Toggle dark mode ☀️/🌙
   - Titre de l'app "📝 Mes Notes"
   - Props: darkMode, onToggleDark

4. **/App.js** - Composant principal
   - Importe Sidebar, Editor, Header
   - State: pages[], activePage, darkMode, searchQuery
   - localStorage: persister pages
   - Layout: flex avec sidebar (w-64) et contenu

FONCTIONNALITÉS:
- CRUD pages: créer, renommer, supprimer
- Recherche temps réel: filtre les pages par titre
- Dark mode: toggle global
- localStorage: persister pages et contenu
- Empty states partout

STYLE:
- Sidebar: bg-gray-900 (dark) ou bg-gray-100 (light)
- Contenu: bg-white (dark: bg-gray-800)
- Transitions: transition-all duration-200
- Hover states sur tous les éléments cliquables`,
    description: 'Notes et docs avec édition riche'
  },
  'kanban': {
    name: 'Tableau Kanban',
    prompt: `Crée un tableau Kanban PROFESSIONNEL style Trello avec architecture MULTI-FICHIERS.

⚠️ IMPORTANT: Utilise write_file pour créer CHAQUE fichier séparément:

FICHIERS À CRÉER (dans cet ordre):

1. **/components/Card.js** - Carte de tâche draggable
   - Affiche titre, description courte, label coloré
   - draggable="true" avec onDragStart
   - Bouton 🗑️ au hover pour supprimer
   - Clic pour ouvrir modal édition
   - Props: card, onDragStart, onDelete, onClick

2. **/components/Column.js** - Colonne du Kanban
   - Header avec titre + emoji + compteur badge
   - Zone scrollable de cartes (utilise Card)
   - Bouton "+ Ajouter" avec input inline
   - onDragOver, onDrop pour recevoir cartes
   - Props: title, emoji, cards, onDrop, onAddCard, onDeleteCard, onCardClick, onDragStart

3. **/components/Modal.js** - Modal d'édition de carte
   - Overlay bg-black/50 position fixed
   - Form: titre, description, sélecteur label (🔴🟡🟢)
   - Boutons Sauvegarder / Annuler
   - Props: card, onSave, onClose

4. **/components/Header.js** - Header de l'app
   - Titre "📋 Mon Kanban" gradient
   - Toggle dark mode ☀️/🌙
   - Props: darkMode, onToggleDark

5. **/App.js** - Composant principal
   - Importe Card, Column, Modal, Header
   - State: tasks[], editingCard, darkMode
   - 3 colonnes: "À faire", "En cours", "Terminé"
   - localStorage: persister tasks
   - Gestion drag & drop entre colonnes

DONNÉES INITIALES:
- À faire: "Finaliser le design", "Écrire la doc"
- En cours: "Développer l'API"
- Terminé: "Setup du projet"

FONCTIONNALITÉS:
- Drag & drop complet entre colonnes
- CRUD cartes: créer, éditer (modal), supprimer
- Labels: 🔴 urgent, 🟡 normal, 🟢 low
- localStorage persistence
- Compteurs par colonne

STYLE PREMIUM:
- Fond: bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
- Colonnes: bg-white/10 backdrop-blur-sm rounded-2xl
- Cartes: bg-white rounded-xl shadow-lg cursor-grab
- Animation drag: opacity-50 scale-105`,
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
    prompt: `Crée un dashboard projet pro avec architecture MULTI-FICHIERS.

⚠️ IMPORTANT: Utilise write_file pour créer CHAQUE fichier séparément:

FICHIERS À CRÉER (dans cet ordre):

1. **/components/Sidebar.js** - Navigation latérale
   - Logo/titre de l'app
   - Menu: Dashboard, Projets, Équipe, Paramètres
   - Item actif highlighté
   - Collapse sur mobile (hamburger)
   - Props: activeItem, onNavigate, collapsed, onToggle

2. **/components/StatCard.js** - Carte de statistique
   - Icône emoji, titre, valeur, variation
   - Couleur selon type (vert/rouge/bleu)
   - Props: icon, title, value, change, color

3. **/components/ProjectTable.js** - Tableau des projets
   - Colonnes: nom, statut, progression, équipe, actions
   - Barre de progression colorée
   - Avatars empilés pour l'équipe
   - Actions: voir, éditer, supprimer
   - Props: projects, onAction

4. **/components/Header.js** - Header de page
   - Titre de la page courante
   - Avatar utilisateur avec dropdown
   - Bouton notifications 🔔
   - Props: title, user

5. **/App.js** - Layout principal
   - Importe tous les composants
   - State: activePage, projects[], collapsed
   - Layout: sidebar + main content
   - 4 StatCards en grid
   - ProjectTable avec données

DONNÉES INITIALES:
- Projets: "Site e-commerce" (75%), "App Mobile" (40%), "API Backend" (100%)
- Stats: 12 projets actifs, 48 tâches, 32h cette semaine, 8 membres

STYLE:
- Sidebar: bg-gray-900 text-white w-64
- Contenu: bg-gray-50
- Cards: bg-white shadow-md rounded-xl
- Table: hover sur les lignes`,
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
    prompt: `Crée un CRM dashboard professionnel avec architecture MULTI-FICHIERS.

⚠️ IMPORTANT: Utilise write_file pour créer CHAQUE fichier séparément:

FICHIERS À CRÉER (dans cet ordre):

1. **/components/Sidebar.js** - Navigation CRM
   - Menu: Dashboard, Contacts, Deals, Activités
   - Badge avec compteurs
   - Props: activeItem, onNavigate, counts

2. **/components/ContactList.js** - Liste des contacts
   - Avatar, nom, email, entreprise
   - Tags (Lead, Client, VIP)
   - Actions: appeler, email, voir
   - Recherche
   - Props: contacts, onAction, searchQuery, onSearch

3. **/components/DealPipeline.js** - Pipeline de ventes
   - 4 colonnes: Prospect, Négociation, Proposition, Gagné
   - Cartes de deals draggables
   - Montant et probabilité
   - Props: deals, onMove, onSelect

4. **/components/ActivityTimeline.js** - Timeline des activités
   - Liste chronologique des actions
   - Types: appel, email, rdv, note
   - Date relative (il y a 2h)
   - Props: activities

5. **/components/StatCard.js** - Métriques
   - Chiffre d'affaires, deals en cours, taux conversion, contacts
   - Props: icon, label, value, trend

6. **/App.js** - Layout principal
   - Importe tous les composants
   - State: contacts[], deals[], activities[], activePage
   - localStorage persistence
   - Layout: sidebar + dashboard

DONNÉES INITIALES:
- 5 contacts (Lead, Client, VIP)
- 4 deals dans différentes étapes
- 6 activités récentes
- Stats: 45k€ CA, 12 deals, 68% conversion

STYLE B2B PRO:
- Couleurs: bleu primaire, gris neutres
- Cards avec shadow et rounded-xl
- Typographie clean et lisible
- Badges colorés pour les statuts`,
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
