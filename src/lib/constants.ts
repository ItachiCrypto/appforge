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
}

export const DEFAULT_APP_FILES = {
  '/App.js': `export default function App() {
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
