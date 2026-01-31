'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0a0a0a',
          colorInputBackground: '#171717',
          colorInputText: '#ffffff',
          colorText: '#ffffff',
          colorTextSecondary: '#a1a1aa',
          colorDanger: '#ef4444',
          colorSuccess: '#22c55e',
          colorWarning: '#f59e0b',
          colorTextOnPrimaryBackground: '#ffffff',
          borderRadius: '0.5rem',
        },
        elements: {
          // Root and card
          rootBox: 'font-sans',
          card: 'bg-[#0a0a0a] border border-[#262626] shadow-2xl',
          
          // Headers
          headerTitle: 'text-white text-xl font-semibold',
          headerSubtitle: 'text-[#a1a1aa]',
          
          // Form fields
          formFieldLabel: 'text-[#d4d4d8]',
          formFieldInput: 'bg-[#171717] border-[#262626] text-white placeholder:text-[#737373]',
          formFieldInputShowPasswordButton: 'text-[#a1a1aa] hover:text-white',
          formFieldHintText: 'text-[#737373]',
          formFieldErrorText: 'text-[#ef4444]',
          formFieldSuccessText: 'text-[#22c55e]',
          
          // Buttons
          formButtonPrimary: 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium',
          formButtonReset: 'text-[#8b5cf6] hover:text-[#a78bfa]',
          
          // Social buttons
          socialButtonsBlockButton: 'bg-[#171717] border border-[#262626] text-white hover:bg-[#262626] transition-colors',
          socialButtonsBlockButtonText: 'text-white font-medium',
          socialButtonsProviderIcon: 'w-5 h-5',
          
          // Divider
          dividerLine: 'bg-[#262626]',
          dividerText: 'text-[#737373]',
          
          // Footer
          footer: 'bg-transparent',
          footerAction: 'bg-transparent',
          footerActionText: 'text-[#a1a1aa]',
          footerActionLink: 'text-[#8b5cf6] hover:text-[#a78bfa] font-medium',
          
          // Identity preview
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-[#8b5cf6] hover:text-[#a78bfa]',
          
          // OTP inputs
          otpCodeFieldInput: 'bg-[#171717] border-[#262626] text-white',
          
          // Phone input
          phoneInputBox: 'bg-[#171717] border-[#262626]',
          formFieldPhoneInput: 'bg-[#171717] text-white',
          selectButton: 'bg-[#171717] border-[#262626] text-white',
          selectOptionsContainer: 'bg-[#171717] border-[#262626]',
          selectOption: 'text-white hover:bg-[#262626]',
          
          // Alert
          alert: 'bg-[#171717] border-[#262626]',
          alertText: 'text-white',
          
          // Back button
          backLink: 'text-[#8b5cf6] hover:text-[#a78bfa]',
          
          // User profile
          profileSectionTitle: 'text-white',
          profileSectionTitleText: 'text-white',
          profileSectionContent: 'text-[#a1a1aa]',
          profileSectionPrimaryButton: 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white',
          
          // Navbar in profile
          navbar: 'bg-[#0a0a0a] border-[#262626]',
          navbarButton: 'text-[#a1a1aa] hover:text-white hover:bg-[#171717]',
          navbarButtonActive: 'text-white bg-[#171717]',
          
          // User button
          userButtonBox: 'text-white',
          userButtonOuterIdentifier: 'text-white',
          userButtonPopoverCard: 'bg-[#0a0a0a] border-[#262626]',
          userButtonPopoverActionButton: 'text-white hover:bg-[#171717]',
          userButtonPopoverActionButtonText: 'text-white',
          userButtonPopoverFooter: 'border-[#262626]',
          
          // Avatar
          avatarBox: 'bg-[#8b5cf6]',
          avatarImage: 'rounded-full',
          
          // Badge
          badge: 'bg-[#262626] text-white',
          
          // Modal
          modalBackdrop: 'bg-black/80',
          modalContent: 'bg-[#0a0a0a] border-[#262626]',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
