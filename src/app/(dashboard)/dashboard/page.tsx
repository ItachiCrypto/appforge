import Link from 'next/link'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  FolderKanban, 
  MessageSquare, 
  Zap, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle,
  Skull,
  TrendingUp,
  PiggyBank,
  Calendar
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatCurrency, SAAS_APPS } from '@/lib/saas-data'

// Fonction pour calculer les économies d'une app
function getAppSavings(app: { metadata?: unknown } | Record<string, unknown>) {
  const metadata = (app as { metadata?: unknown }).metadata as { monthlySavings?: number; replacedSaasName?: string } | null
  if (!metadata?.monthlySavings) return null
  return {
    monthly: metadata.monthlySavings,
    yearly: metadata.monthlySavings * 12,
    saasName: metadata.replacedSaasName || 'SaaS'
  }
}

// Fonction pour obtenir l'icône d'un SaaS
function getSaasIcon(saasName: string): string {
  const saas = SAAS_APPS.find(s => 
    s.name.toLowerCase() === saasName.toLowerCase()
  )
  return saas?.icon || '📦'
}

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

    // Calculer les économies totales
    const appSavings = apps.map(getAppSavings).filter(Boolean)
    const totalMonthlySavings = appSavings.reduce((sum, s) => sum + (s?.monthly || 0), 0)
    const totalYearlySavings = totalMonthlySavings * 12
    
    // Calculer les économies depuis l'inscription
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    const savedSinceSignup = Math.round((totalMonthlySavings / 30) * daysSinceSignup)

    // Liste des SaaS remplacés (pour le "cimetière")
    const replacedSaas = apps
      .map(app => {
        const savings = getAppSavings(app)
        if (!savings) return null
        return {
          name: savings.saasName,
          icon: getSaasIcon(savings.saasName),
          monthly: savings.monthly,
          appName: app.name
        }
      })
      .filter(Boolean)

    return (
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenue{user.name ? `, ${user.name.split(' ')[0]}` : ''} ! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Voici tes économies et tes apps
            </p>
          </div>
          <Link href="/app/new">
            <Button className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle app
            </Button>
          </Link>
        </div>
        
        {/* Section Économies - Mise en avant */}
        {totalYearlySavings > 0 ? (
          <Card className="mb-8 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-background border-emerald-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600">
                <PiggyBank className="h-6 w-6" />
                Tes économies
              </CardTitle>
              <CardDescription>
                L'argent que tu gardes dans ta poche grâce à tes apps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                {/* Économies depuis inscription */}
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(savedSinceSignup)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    économisés depuis ton inscription
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ({daysSinceSignup} jours)
                  </div>
                </div>
                
                {/* Projection 1 an */}
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(totalYearlySavings)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    par an
                  </div>
                </div>
                
                {/* Projection 5 ans */}
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(totalYearlySavings * 5)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    sur 5 ans
                  </div>
                </div>
                
                {/* Projection 10 ans */}
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(totalYearlySavings * 10)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    sur 10 ans
                  </div>
                </div>
              </div>

              {/* SaaS Graveyard */}
              {replacedSaas.length > 0 && (
                <div className="mt-6 pt-6 border-t border-emerald-500/20">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Skull className="h-4 w-4" />
                    Cimetière des SaaS - Apps que tu ne paies plus
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {replacedSaas.map((saas, i) => (
                      <div 
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border"
                      >
                        <span className="text-lg">{saas?.icon}</span>
                        <span className="font-medium line-through text-muted-foreground">
                          {saas?.name}
                        </span>
                        <span className="text-emerald-600 text-sm font-medium">
                          +{formatCurrency(saas?.monthly || 0)}/mois
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* CTA pour commencer à économiser */
          <Card className="mb-8 bg-gradient-to-br from-primary/10 via-violet-500/5 to-background border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Commence à économiser maintenant
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Crée ta première app pour remplacer un SaaS que tu paies. 
                L'IA fait tout le travail, tu gardes l'argent.
              </p>
              <Link href="/app/new">
                <Button size="lg" className="bg-gradient-to-r from-primary to-violet-600">
                  <Skull className="h-4 w-4 mr-2" />
                  Tuer mon premier SaaS
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        
        {/* Stats rapides */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Mes apps"
            value={apps.length}
            icon={<FolderKanban className="h-5 w-5" />}
            description={`${Math.max(0, 3 - apps.length)} restantes sur le plan gratuit`}
          />
          <StatCard
            title="Messages"
            value={totalMessages}
            icon={<MessageSquare className="h-5 w-5" />}
            description="Interactions avec l'IA"
          />
          <StatCard
            title="Plan"
            value={user.plan}
            icon={<Zap className="h-5 w-5" />}
            description={user.openaiKey ? 'BYOK actif 🎉' : 'Ajoute une clé API pour -50%'}
          />
        </div>
        
        {/* Apps récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tes apps</CardTitle>
              <CardDescription>Tes créations récentes</CardDescription>
            </div>
            {apps.length > 0 && (
              <Link href="/apps">
                <Button variant="ghost" size="sm">
                  Voir tout <ArrowRight className="h-4 w-4 ml-1" />
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
                <h3 className="text-lg font-medium mb-2">Pas encore d'apps</h3>
                <p className="text-muted-foreground mb-4">
                  Décris ce que tu veux construire et l'IA le crée pour toi
                </p>
                <Link href="/app/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer ma première app
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apps.map((app) => {
                  const savings = getAppSavings(app)
                  return (
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
                      {savings && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-emerald-600">
                          <span>{getSaasIcon(savings.saasName)}</span>
                          <span>Remplace {savings.saasName}</span>
                          <span className="font-semibold">+{formatCurrency(savings.yearly)}/an</span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {app.description || 'Pas de description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Modifié {formatDate(app.updatedAt)}
                      </p>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        {apps.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/app/new">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Nouvelle app</p>
                      <p className="text-sm text-muted-foreground">Tuer un autre SaaS</p>
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
                      <p className="font-medium">Ajouter une clé API</p>
                      <p className="text-sm text-muted-foreground">-50% sur le plan</p>
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
                      <p className="font-medium">Documentation</p>
                      <p className="text-sm text-muted-foreground">Apprendre les bases</p>
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
            <h2 className="text-xl font-semibold mb-2">Impossible de charger le dashboard</h2>
            <p className="text-muted-foreground mb-4">
              Erreur de connexion à la base de données. Réessaie plus tard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">Accueil</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Réessayer</Button>
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
  
  const labels: Record<string, string> = {
    DRAFT: 'brouillon',
    PREVIEW: 'aperçu',
    DEPLOYED: 'déployé',
    ARCHIVED: 'archivé',
  }
  
  return (
    <Badge variant={variants[status] || 'secondary'} className="text-xs">
      {labels[status] || status.toLowerCase()}
    </Badge>
  )
}
