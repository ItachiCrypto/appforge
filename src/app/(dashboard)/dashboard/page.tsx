import Link from 'next/link'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, FolderKanban, MessageSquare, Zap, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  try {
    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '',
        },
      })
    }

    const apps = await prisma.app.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    })

    const totalMessages = await prisma.message.count({
      where: {
        conversation: {
          userId: user.id,
        },
      },
    })

    return (
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your apps
            </p>
          </div>
          <Link href="/app/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New App
            </Button>
          </Link>
        </div>
        
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Total Apps"
            value={apps.length}
            icon={<FolderKanban className="h-5 w-5" />}
            description={`${Math.max(0, 3 - apps.length)} remaining on free plan`}
          />
          <StatCard
            title="Messages"
            value={totalMessages}
            icon={<MessageSquare className="h-5 w-5" />}
            description="Total AI interactions"
          />
          <StatCard
            title="Plan"
            value={user.plan}
            icon={<Zap className="h-5 w-5" />}
            description={user.openaiKey ? 'BYOK active 🎉' : 'Add API key for 50% off'}
          />
        </div>
        
        {/* Recent Apps */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Apps</CardTitle>
              <CardDescription>Your latest creations</CardDescription>
            </div>
            {apps.length > 0 && (
              <Link href="/apps">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {apps.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No apps yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first app by describing what you want
                </p>
                <Link href="/app/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First App
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/app/${app.id}`}
                    className="group block p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium group-hover:text-primary transition-colors">
                        {app.name}
                      </h4>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {app.description || 'No description'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDate(app.updatedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {apps.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/app/new">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Create New App</p>
                      <p className="text-sm text-muted-foreground">Start from scratch</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/settings">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Add API Key</p>
                      <p className="text-sm text-muted-foreground">Get 50% discount</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <a href="https://docs.appforge.dev" target="_blank" rel="noopener noreferrer">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">View Docs</p>
                      <p className="text-sm text-muted-foreground">Learn the basics</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
            <p className="text-muted-foreground mb-4">
              There was an error connecting to the database. Please try again later.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Try Again</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}

function StatCard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string
  value: number | string
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: 'secondary',
    PREVIEW: 'outline',
    DEPLOYED: 'default',
    ARCHIVED: 'secondary',
  }
  
  return (
    <Badge variant={variants[status] || 'secondary'} className="text-xs">
      {status.toLowerCase()}
    </Badge>
  )
}
