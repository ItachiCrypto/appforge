'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return key && !key.includes('placeholder') && key.startsWith('pk_')
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder'}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0a0a0a',
          colorInputBackground: '#171717',
          colorInputText: '#ffffff',
        },
        elements: {
          formButtonPrimary: 
            'bg-primary text-primary-foreground hover:bg-primary/90',
          card: 'bg-card border border-border',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          formFieldInput: 
            'bg-background border-input',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
