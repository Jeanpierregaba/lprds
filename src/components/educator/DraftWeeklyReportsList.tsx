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
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
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

interface DraftWeeklyReport {
  id: string
  child_id: string
  week_start_date: string
  week_end_date: string
  created_at: string
  updated_at: string
  children: {
    first_name: string
    last_name: string
    photo_url?: string
    section?: string
  }
}

interface DraftWeeklyReportsListProps {
  onEditDraft: (report: any) => void
  refreshTrigger?: number
}

const DraftWeeklyReportsList = ({ onEditDraft, refreshTrigger }: DraftWeeklyReportsListProps) => {
  const [drafts, setDrafts] = useState<DraftWeeklyReport[]>([])
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
        .from('weekly_reports')
        .select(`
          id,
          child_id,
          week_start_date,
          week_end_date,
          created_at,
          updated_at,
          children:child_id (
            first_name,
            last_name,
            photo_url,
            section
          )
        `)
        .eq('educator_id', profile.id)
        .eq('status', 'draft')
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
        .from('weekly_reports')
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

  const handleEdit = async (draft: DraftWeeklyReport) => {
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
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
                Semaine du {format(new Date(draft.week_start_date), 'dd MMM', { locale: fr })} au {format(new Date(draft.week_end_date), 'dd MMM yyyy', { locale: fr })}
              </div>
              <div className="text-xs text-muted-foreground">
                Dernière modification: {format(new Date(draft.updated_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
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

export default DraftWeeklyReportsList
