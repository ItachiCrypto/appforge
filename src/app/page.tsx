import { auth } from '@clerk/nextjs'
import { Navbar, HeroSection, ProblemSection, SolutionSection, TemplatesSection, GraveyardSection, FooterCTA } from '@/components/landing'

export default function LandingPage() {
  const { userId } = auth()
  const isSignedIn = !!userId

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <Navbar isSignedIn={isSignedIn} />

      {/* Hero with Calculator */}
      <HeroSection isSignedIn={isSignedIn} />

      {/* Problem: SaaS costs */}
      <ProblemSection />

      {/* Solution: 3 steps */}
      <div id="templates">
        <SolutionSection />
      </div>

      {/* Templates Gallery */}
      <TemplatesSection />

      {/* Testimonials / SaaS Graveyard */}
      <GraveyardSection />

      {/* Final CTA + Footer */}
      <div id="pricing">
        <FooterCTA isSignedIn={isSignedIn} />
      </div>
    </div>
  )
}
