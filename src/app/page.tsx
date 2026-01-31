import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Zap, 
  Lock, 
  DollarSign, 
  Code, 
  Rocket,
  ArrowRight,
  Check,
  MessageSquare,
  Eye
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">AppForge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-sm text-violet-500">Build apps without code</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              From idea to{' '}
              <span className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
                live app
              </span>{' '}
              in minutes
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Describe what you want, and our AI builds it for you. No coding required. 
              Deploy with one click. Welcome to the future of app creation.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8">
                  Start Building Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Watch Demo
                </Button>
              </Link>
            </div>

            <p className="text-muted-foreground mt-4 text-sm">
              No credit card required • 3 free apps included
            </p>
          </div>

          {/* Demo Preview */}
          <div className="mt-16 relative max-w-5xl mx-auto" id="demo">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-card border rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-muted-foreground text-sm ml-2">AppForge Editor</span>
              </div>
              <div className="grid md:grid-cols-2 min-h-[400px]">
                <div className="border-r p-6 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      Hey! What would you like to build today? 🚀
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 text-sm max-w-[80%]">
                      I want a todo app with categories and a dark theme
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      Perfect! I'm creating your todo app with category tags and a beautiful dark theme... ✨
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse">
                      <Code className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-muted-foreground">Live preview appears here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to your custom app
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                icon: MessageSquare,
                title: 'Describe',
                desc: 'Tell us what you want to build in plain language. No technical jargon needed.',
              },
              {
                step: '2',
                icon: Eye,
                title: 'Preview',
                desc: 'Watch your app come to life in real-time. Make changes through chat instantly.',
              },
              {
                step: '3',
                icon: Rocket,
                title: 'Deploy',
                desc: 'One click to launch. Get a shareable URL and start using your app.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                  <item.icon className="w-8 h-8 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why AppForge?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to create, customize, and deploy your own applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Sparkles,
                title: 'AI-Powered Creation',
                desc: 'Just describe what you want. Our AI understands and builds it instantly.',
              },
              {
                icon: Zap,
                title: 'Real-time Preview',
                desc: 'See changes as they happen. Iterate quickly with live feedback.',
              },
              {
                icon: Rocket,
                title: 'One-Click Deploy',
                desc: 'Go from idea to production in minutes. No DevOps knowledge needed.',
              },
              {
                icon: Lock,
                title: 'Secure by Design',
                desc: 'Your code runs in isolated sandboxes. Your API keys are encrypted.',
              },
              {
                icon: DollarSign,
                title: 'BYOK (Bring Your Own Key)',
                desc: 'Use your own API key and pay only for what you use. Full transparency.',
              },
              {
                icon: Code,
                title: 'Export Anytime',
                desc: "Download your code anytime. No lock-in. It's your app.",
              },
            ].map((feature, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 border-t" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-card border rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['3 apps', 'Preview mode', 'Community support'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Starter - Popular */}
            <div className="bg-card border-2 border-primary rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['10 apps', 'Deploy to web', 'Custom domains', 'Email support'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block">
                <Button className="w-full">Start Free Trial</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-card border rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited apps', 'Advanced analytics', 'Priority support', 'API access'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            💡 <strong>BYOK Discount:</strong> Get 50% off when you use your own API key!
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-violet-500/20 to-blue-500/20 border rounded-2xl p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Ready to build your first app?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of creators building their own apps without writing code.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Start Building Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">AppForge</span>
            </div>
            <p className="text-muted-foreground">© 2024 AppForge. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
