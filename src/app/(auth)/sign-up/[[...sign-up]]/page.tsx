import { SignUp, useSignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  const { isLoaded } = useSignUp()
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-card/95 backdrop-blur border border-border shadow-xl",
          }
        }}
      />
    </div>
  )
}
