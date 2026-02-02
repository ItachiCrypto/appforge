export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    maxApps: 3,
    canDeploy: false,
    features: [
      '3 apps',
      'Preview only',
      'Community support',
    ],
  },
  STARTER: {
    name: 'Starter',
    price: 19,
    maxApps: 10,
    canDeploy: true,
    features: [
      '10 apps',
      'Deploy to Vercel',
      'Custom domains',
      'Email support',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 49,
    maxApps: -1, // unlimited
    canDeploy: true,
    features: [
      'Unlimited apps',
      'Deploy to Vercel',
      'Custom domains',
      'Analytics',
      'Priority support',
    ],
  },
  TEAM: {
    name: 'Team',
    price: 99,
    maxApps: -1,
    canDeploy: true,
    features: [
      'Everything in Pro',
      '5 team members',
      'Collaboration',
      'Shared projects',
      'Admin dashboard',
    ],
  },
} as const

export const BYOK_DISCOUNT = 0.5 // 50% off with BYOK

export const APP_LIMITS = {
  FREE: 3,
  STARTER: 10,
  PRO: Infinity,
  TEAM: Infinity,
  ENTERPRISE: Infinity,
}

export const DEFAULT_APP_FILES = {
  '/App.tsx': `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl opacity-80">Start building something amazing!</p>
      </div>
    </div>
  )
}`,
  '/styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}`,
}

// ============ APP TYPES ============

export const APP_TYPES = [
  { 
    id: 'WEB', 
    name: 'Web App', 
    icon: 'Globe',
    description: 'React / Next.js website',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'IOS', 
    name: 'iOS App', 
    icon: 'Smartphone',
    description: 'React Native for iPhone',
    color: 'from-gray-700 to-gray-900'
  },
  { 
    id: 'ANDROID', 
    name: 'Android App', 
    icon: 'Smartphone',
    description: 'React Native for Android',
    color: 'from-green-500 to-emerald-600'
  },
  { 
    id: 'DESKTOP', 
    name: 'Desktop App', 
    icon: 'Monitor',
    description: 'Electron cross-platform',
    color: 'from-purple-500 to-violet-600'
  },
  { 
    id: 'API', 
    name: 'API / Backend', 
    icon: 'Server',
    description: 'Node.js REST API',
    color: 'from-orange-500 to-red-500'
  },
] as const

export type AppTypeId = typeof APP_TYPES[number]['id']

// ============ DEFAULT FILES BY TYPE ============

export const DEFAULT_FILES_BY_TYPE: Record<AppTypeId, Record<string, string>> = {
  WEB: {
    '/App.js': `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🌐 Web App</h1>
        <p className="text-xl opacity-80">Start building your website!</p>
      </div>
    </div>
  )
}`,
    '/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; }`,
  },

  IOS: {
    '/App.js': `export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="text-6xl mb-4">📱</div>
        <h1 className="text-2xl font-bold mb-2">iOS App</h1>
        <p className="text-gray-400">React Native Preview</p>
        <div className="mt-8 space-y-3">
          <button className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-medium">
            Get Started
          </button>
          <button className="w-full bg-gray-800 text-white py-3 px-6 rounded-xl font-medium">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}`,
    '/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }`,
  },

  ANDROID: {
    '/App.js': `export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Android App</h1>
        <p className="text-gray-600">React Native Preview</p>
        <div className="mt-8 space-y-3">
          <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium shadow-lg">
            Get Started
          </button>
          <button className="w-full bg-white text-green-600 py-3 px-6 rounded-lg font-medium border border-green-600">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}`,
    '/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Roboto, sans-serif; }`,
  },

  DESKTOP: {
    '/App.js': `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center text-white max-w-md">
        <div className="text-6xl mb-4">🖥️</div>
        <h1 className="text-2xl font-bold mb-2">Desktop App</h1>
        <p className="text-white/70 mb-6">Electron Cross-Platform</p>
        <div className="flex gap-3 justify-center">
          <button className="bg-white text-purple-600 py-2 px-6 rounded-lg font-medium">
            Windows
          </button>
          <button className="bg-white/20 text-white py-2 px-6 rounded-lg font-medium">
            macOS
          </button>
        </div>
      </div>
    </div>
  )
}`,
    '/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; }`,
  },

  API: {
    '/App.js': `export default function App() {
  const endpoints = [
    { method: 'GET', path: '/api/users', desc: 'List all users' },
    { method: 'POST', path: '/api/users', desc: 'Create user' },
    { method: 'GET', path: '/api/users/:id', desc: 'Get user by ID' },
    { method: 'PUT', path: '/api/users/:id', desc: 'Update user' },
    { method: 'DELETE', path: '/api/users/:id', desc: 'Delete user' },
  ]
  
  const methodColors = {
    GET: 'bg-green-500',
    POST: 'bg-blue-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">📡 API Endpoints</h1>
        <p className="text-gray-400 mb-6">Your REST API documentation</p>
        
        <div className="space-y-3">
          {endpoints.map((ep, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
              <span className={\`\${methodColors[ep.method]} text-xs font-bold px-2 py-1 rounded\`}>
                {ep.method}
              </span>
              <code className="text-green-400 flex-1">{ep.path}</code>
              <span className="text-gray-500 text-sm">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}`,
    '/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Monaco', 'Menlo', monospace; }`,
  },
}

// ============ TEMPLATES BY TYPE ============

export const TEMPLATES_BY_TYPE: Record<AppTypeId, Array<{
  id: string
  name: string
  description: string
  prompt: string
}>> = {
  WEB: [
    // === FLAGSHIP CLONES - Économisez des centaines d'euros/an! ===
    {
      id: 'notemaster',
      name: '📝 NoteMaster',
      description: 'Clone de Notion - Économisez 96€/an',
      prompt: 'TEMPLATE_FILE:notemaster',
      isClone: true,
      savings: 96,
    },
    {
      id: 'moneytracker',
      name: '💎 MoneyTracker',
      description: 'Clone de Finary - Économisez 100€/an',
      prompt: 'TEMPLATE_FILE:moneytracker',
      isClone: true,
      savings: 100,
    },
    {
      id: 'taskflow',
      name: '✅ TaskFlow',
      description: 'Clone de Todoist - Économisez 48€/an',
      prompt: 'TEMPLATE_FILE:taskflow',
      isClone: true,
      savings: 48,
    },
    {
      id: 'meetbook',
      name: '📅 MeetBook',
      description: 'Clone de Calendly - Économisez 144€/an',
      prompt: 'TEMPLATE_FILE:meetbook',
      isClone: true,
      savings: 144,
    },
    {
      id: 'habitforge',
      name: '🔥 HabitForge',
      description: 'Clone Habit Tracker - Économisez 60€/an',
      prompt: 'TEMPLATE_FILE:habitforge',
      isClone: true,
      savings: 60,
    },
    // === TEMPLATES CLASSIQUES ===
    {
      id: 'landing',
      name: 'Landing Page',
      description: 'A beautiful landing page for your product',
      prompt: 'Create a modern landing page with hero section, features grid, and CTA',
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Admin dashboard with charts and metrics',
      prompt: 'Create a dashboard with sidebar, stat cards, and data table',
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      description: 'Showcase your work',
      prompt: 'Create a portfolio page with project gallery and about section',
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      description: 'Online store product page',
      prompt: 'Create a product listing page with filters and cards',
    },
  ],
  
  IOS: [
    {
      id: 'social',
      name: 'Social Feed',
      description: 'Instagram-style feed UI',
      prompt: 'Create a social media feed with posts, likes, and comments',
    },
    {
      id: 'settings',
      name: 'Settings Screen',
      description: 'iOS-style settings page',
      prompt: 'Create an iOS settings screen with grouped options and toggles',
    },
    {
      id: 'chat',
      name: 'Chat App',
      description: 'Messaging interface',
      prompt: 'Create a chat interface with message bubbles and input',
    },
  ],
  
  ANDROID: [
    {
      id: 'material',
      name: 'Material Design',
      description: 'Google Material UI',
      prompt: 'Create a Material Design home screen with FAB and bottom nav',
    },
    {
      id: 'list',
      name: 'List View',
      description: 'Scrollable list with cards',
      prompt: 'Create a list view with cards and pull-to-refresh',
    },
    {
      id: 'profile',
      name: 'Profile Screen',
      description: 'User profile page',
      prompt: 'Create a profile screen with avatar, stats, and action buttons',
    },
  ],
  
  DESKTOP: [
    {
      id: 'notepad',
      name: 'Notepad',
      description: 'Simple text editor',
      prompt: 'Create a notepad app with file menu and text area',
    },
    {
      id: 'music',
      name: 'Music Player',
      description: 'Spotify-style player',
      prompt: 'Create a music player with playlist, controls, and album art',
    },
    {
      id: 'files',
      name: 'File Explorer',
      description: 'File manager UI',
      prompt: 'Create a file explorer with sidebar and file grid',
    },
  ],
  
  API: [
    {
      id: 'crud',
      name: 'CRUD API',
      description: 'Basic REST endpoints',
      prompt: 'Create a REST API with users CRUD endpoints',
    },
    {
      id: 'auth',
      name: 'Auth API',
      description: 'Authentication endpoints',
      prompt: 'Create auth API with login, register, and logout endpoints',
    },
    {
      id: 'blog',
      name: 'Blog API',
      description: 'Blog post endpoints',
      prompt: 'Create a blog API with posts, comments, and categories',
    },
  ],
}
