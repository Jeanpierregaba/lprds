import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Baby, CalendarDays, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DraftReport {
  id: string
  child_id: string
  report_date: string
  created_at: string
  updated_at: string
  children: {
    first_name: string
    last_name: string
    photo_url?: string
    section?: string
  }
}

interface DraftReportsListProps {
  onEditDraft: (report: any) => void
  refreshTrigger?: number
}

const DraftReportsList = ({ onEditDraft, refreshTrigger }: DraftReportsListProps) => {
  const [drafts, setDrafts] = useState<DraftReport[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadDrafts()
  }, [profile, refreshTrigger])

  const loadDrafts = async () => {
    if (!profile) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          id,
          child_id,
          report_date,
          created_at,
          updated_at,
          children (
            first_name,
            last_name,
            photo_url,
            section
          )
        `)
        .eq('educator_id', profile.id)
        .eq('is_draft', true)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setDrafts(data as any || [])
    } catch (error) {
      console.error('Erreur lors du chargement des brouillons:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les brouillons",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('daily_reports')
        .delete()
        .eq('id', draftId)

      if (error) throw error

      toast({
        title: "Brouillon supprimé",
        description: "Le brouillon a été supprimé avec succès"
      })

      loadDrafts()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le brouillon",
        variant: "destructive"
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedDraftId(null)
    }
  }

  const handleEdit = async (draft: DraftReport) => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('id', draft.id)
        .single()

      if (error) throw error
      
      onEditDraft({
        ...data,
        child: draft.children
      })
    } catch (error) {
      console.error('Erreur lors du chargement du brouillon:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le brouillon",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Chargement des brouillons...</p>
      </div>
    )
  }

  if (drafts.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Vous n'avez aucun brouillon sauvegardé. Les rapports que vous sauvegardez comme brouillon apparaîtront ici.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map((draft) => (
          <Card key={draft.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={draft.children.photo_url} />
                  <AvatarFallback>
                    <Baby className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {draft.children.first_name} {draft.children.last_name}
                  </CardTitle>
                  {draft.children.section && (
                    <Badge variant="outline" className="mt-1">
                      {draft.children.section}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {new Date(draft.report_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                Dernière modification: {new Date(draft.updated_at).toLocaleString('fr-FR')}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={() => handleEdit(draft)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Continuer
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedDraftId(draft.id)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le brouillon sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDraftId && handleDelete(selectedDraftId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DraftReportsList
