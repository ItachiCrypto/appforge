import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth, currentUser } from '@clerk/nextjs'
import { SignOutButton } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles, LayoutDashboard, Settings, LogOut, Plus, CreditCard, PiggyBank, FolderKanban } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const clerkUser = await currentUser()
  
  // Get or create user in our database with error handling
  let user = null
  let totalSavings = 0
  
  try {
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })
    
    if (!user && clerkUser) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null,
          imageUrl: clerkUser.imageUrl,
        },
      })
    }

    // Calculer les économies totales
    if (user) {
      const apps = await prisma.app.findMany({
        where: { userId: user.id },
        select: { metadata: true }
      })
      
      totalSavings = apps.reduce((sum, app) => {
        const metadata = app.metadata as { monthlySavings?: number } | null
        return sum + (metadata?.monthlySavings || 0) * 12
      }, 0)
    }
  } catch (error) {
    console.error('Database error in layout:', error)
    // Continue with null user - the page will handle the error
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 flex flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">AppForge</span>
        </Link>
        
        <nav className="space-y-1 flex-1">
          <NavLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />}>
            Tableau de bord
          </NavLink>
          <NavLink href="/apps" icon={<FolderKanban className="h-5 w-5" />}>
            Mes apps
          </NavLink>
          <NavLink href="/app/new" icon={<Plus className="h-5 w-5" />}>
            Nouvelle app
          </NavLink>
          <NavLink href="/billing" icon={<CreditCard className="h-5 w-5" />}>
            Facturation
          </NavLink>
          <NavLink href="/settings" icon={<Settings className="h-5 w-5" />}>
            Paramètres
          </NavLink>
        </nav>
        
        {/* Économies Badge */}
        {totalSavings > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-600">
              <PiggyBank className="h-5 w-5" />
              <div>
                <div className="font-semibold">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(totalSavings)}/an
                </div>
                <div className="text-xs text-emerald-600/70">économisés</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Plan Badge */}
        <div className="mb-4 p-3 rounded-lg bg-muted">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">{user?.plan || 'FREE'}</span>
          </div>
          {user?.openaiKey && (
            <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
              ✓ BYOK Actif
            </div>
          )}
          <Link href="/settings#billing" className="text-xs text-primary mt-2 inline-block hover:underline">
            {user?.plan === 'FREE' ? 'Passer au plan supérieur' : 'Gérer la facturation'}
          </Link>
        </div>
        
        {/* User Section */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={clerkUser?.imageUrl || ''} />
              <AvatarFallback>
                {clerkUser?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {clerkUser?.firstName || user?.name || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {clerkUser?.emailAddresses[0]?.emailAddress || user?.email}
              </p>
            </div>
          </div>
          <SignOutButton>
            <Button variant="ghost" size="sm" className="w-full mt-3 justify-start text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </SignOutButton>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {icon}
      {children}
    </Link>
  )
}
