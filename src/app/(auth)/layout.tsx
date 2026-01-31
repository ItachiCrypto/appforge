'use client'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Force dark background for all auth pages including Clerk's internal pages */}
      <style jsx global>{`
        /* Force dark theme on ALL Clerk elements */
        .cl-rootBox,
        .cl-card,
        .cl-signIn-root,
        .cl-signUp-root,
        .cl-userProfile-root,
        .cl-organizationProfile-root,
        .cl-createOrganization-root,
        .cl-organizationSwitcher-root,
        .cl-userButton-root,
        [data-clerk-component] {
          --cl-background: #0a0a0a !important;
          --cl-foreground: #fafafa !important;
        }
        
        /* Clerk internal page backgrounds */
        .cl-main,
        .cl-pageScrollBox,
        .cl-page {
          background-color: #0a0a0a !important;
        }
        
        /* Force white text everywhere in Clerk */
        .cl-formFieldLabel,
        .cl-formFieldLabelText,
        .cl-headerTitle,
        .cl-headerSubtitle,
        .cl-identityPreviewText,
        .cl-identityPreviewEditButton,
        .cl-formFieldSuccessText,
        .cl-formFieldWarningText,
        .cl-otpCodeFieldInput,
        .cl-phoneInputBox,
        .cl-formResendCodeLink,
        .cl-footerActionText,
        .cl-footerActionLink,
        .cl-alertText,
        .cl-alternativeMethodsBlockButton,
        .cl-backLink,
        .cl-formFieldHintText,
        .cl-selectButton__countryCode,
        .cl-profileSectionTitle,
        .cl-profileSectionTitleText,
        .cl-profileSectionSubtitleText,
        .cl-menuButton,
        .cl-menuItem,
        .cl-breadcrumbsItem,
        .cl-breadcrumbsItemDivider,
        .cl-navbarButton,
        .cl-navbar,
        .cl-activeDevice,
        .cl-activeDeviceListItem,
        .cl-accordionTriggerButton,
        .cl-formFieldInputShowPasswordButton,
        [class*="cl-"] p,
        [class*="cl-"] span,
        [class*="cl-"] label,
        [class*="cl-"] div,
        [class*="cl-"] a {
          color: #fafafa !important;
        }
        
        /* Ensure input text is visible */
        .cl-formFieldInput,
        .cl-phoneInputBox input,
        .cl-otpCodeFieldInput,
        .cl-selectButton,
        input[class*="cl-"] {
          background-color: #171717 !important;
          color: #ffffff !important;
          border-color: #262626 !important;
        }
        
        .cl-formFieldInput::placeholder {
          color: #737373 !important;
        }
        
        /* Card styling */
        .cl-card {
          background-color: #0a0a0a !important;
          border-color: #262626 !important;
        }
        
        /* Social buttons */
        .cl-socialButtonsBlockButton,
        .cl-socialButtonsIconButton {
          background-color: #171717 !important;
          border-color: #262626 !important;
          color: #fafafa !important;
        }
        
        .cl-socialButtonsBlockButton:hover,
        .cl-socialButtonsIconButton:hover {
          background-color: #262626 !important;
        }
        
        /* Internal page text - specifically for /sign-up/continue */
        .cl-internal-text,
        .cl-internal-title,
        .cl-internal-subtitle,
        [class*="internal"] {
          color: #fafafa !important;
        }
        
        /* Links */
        .cl-footerActionLink,
        .cl-formResendCodeLink,
        .cl-identityPreviewEditButton,
        .cl-backLink {
          color: #8b5cf6 !important;
        }
        
        /* Dropdown/Select menus */
        .cl-selectOptionsContainer,
        .cl-selectOption {
          background-color: #171717 !important;
          color: #fafafa !important;
        }
        
        /* Dividers */
        .cl-dividerLine {
          background-color: #262626 !important;
        }
        
        .cl-dividerText {
          color: #737373 !important;
        }
        
        /* Primary buttons */
        .cl-formButtonPrimary {
          background-color: #8b5cf6 !important;
          color: #ffffff !important;
        }
        
        .cl-formButtonPrimary:hover {
          background-color: #7c3aed !important;
        }
        
        /* Error messages */
        .cl-formFieldErrorText {
          color: #ef4444 !important;
        }
        
        /* Profile sections */
        .cl-profileSection {
          background-color: #0a0a0a !important;
          border-color: #262626 !important;
        }
        
        /* Verification code inputs */
        .cl-otpCodeFieldInputs {
          gap: 8px;
        }
        
        .cl-otpCodeFieldInput {
          background-color: #171717 !important;
          border-color: #262626 !important;
          color: #ffffff !important;
        }
        
        /* Footer */
        .cl-footer,
        .cl-footerAction {
          background-color: transparent !important;
        }
        
        /* Badges and tags */
        .cl-badge,
        .cl-tag {
          background-color: #262626 !important;
          color: #fafafa !important;
        }
        
        /* Modal overlay */
        .cl-modalBackdrop {
          background-color: rgba(0, 0, 0, 0.8) !important;
        }
        
        .cl-modalContent {
          background-color: #0a0a0a !important;
        }
        
        /* User button popover */
        .cl-userButtonPopoverCard {
          background-color: #0a0a0a !important;
          border-color: #262626 !important;
        }
        
        .cl-userButtonPopoverActionButton,
        .cl-userButtonPopoverActionButtonText {
          color: #fafafa !important;
        }
        
        .cl-userButtonPopoverActionButton:hover {
          background-color: #171717 !important;
        }
        
        /* Avatar fallbacks */
        .cl-avatarBox {
          background-color: #8b5cf6 !important;
          color: #ffffff !important;
        }
      `}</style>
      {children}
    </div>
  )
}
