"use client"

import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#0a0a0a] border border-[#262626] shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "bg-[#171717] border-[#262626] text-white hover:bg-[#262626]",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-[#171717] border-[#262626] text-white",
            footerActionLink: "text-violet-500 hover:text-violet-400",
            formButtonPrimary: "bg-violet-600 hover:bg-violet-700",
            dividerLine: "bg-[#262626]",
            dividerText: "text-gray-500",
          }
        }}
      />
    </div>
  )
}
