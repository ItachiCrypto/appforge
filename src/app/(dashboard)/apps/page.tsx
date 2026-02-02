"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  ExternalLink,
  Loader2,
  FolderKanban,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type App = {
  id: string
  name: string
  description: string | null
  status: string
  type: string
  vercelUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function AppsPage() {
  const router = useRouter()
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit dialog
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Delete dialog
  const [deletingApp, setDeletingApp] = useState<App | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch apps
  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps')
      if (!res.ok) throw new Error('Failed to fetch apps')
      const data = await res.json()
      setApps(data)
    } catch (err) {
      setError('Impossible de charger tes apps')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Rename app
  const handleRename = async () => {
    if (!editingApp || !newName.trim()) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/apps/${editingApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      
      if (!res.ok) throw new Error('Failed to rename app')
      
      setApps(apps.map(app => 
        app.id === editingApp.id ? { ...app, name: newName.trim() } : app
      ))
      setEditingApp(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Delete app
  const handleDelete = async () => {
    if (!deletingApp) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/apps/${deletingApp.id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to delete app')
      
      setApps(apps.filter(app => app.id !== deletingApp.id))
      setDeletingApp(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => { setError(null); setLoading(true); fetchApps(); }}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mes apps</h1>
          <p className="text-muted-foreground mt-1">
            {apps.length} app{apps.length !== 1 ? 's' : ''} créée{apps.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/app/new">
          <Button className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle app
          </Button>
        </Link>
      </div>

      {/* Apps grid */}
      {apps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <Card key={app.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {app.description || 'Pas de description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/app/${app.id}`)}>
                        <FolderKanban className="h-4 w-4 mr-2" />
                        Ouvrir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingApp(app); setNewName(app.name); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Renommer
                      </DropdownMenuItem>
                      {app.vercelUrl && (
                        <DropdownMenuItem onClick={() => window.open(app.vercelUrl!, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir en ligne
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingApp(app)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    <Badge variant="outline" className="text-xs">
                      {app.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(new Date(app.updatedAt))}
                  </span>
                </div>
                <Link href={`/app/${app.id}`} className="block mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    Ouvrir l'éditeur
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingApp} onOpenChange={(open) => !open && setEditingApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer l'app</DialogTitle>
            <DialogDescription>
              Entre un nouveau nom pour ton app
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de l'app"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingApp(null)}>
              Annuler
            </Button>
            <Button onClick={handleRename} disabled={saving || !newName.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletingApp} onOpenChange={(open) => !open && setDeletingApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'app ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'app "{deletingApp?.name}" et toutes ses données seront supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingApp(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
