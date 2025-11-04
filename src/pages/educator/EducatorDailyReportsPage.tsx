import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DailyReportForm from '@/components/admin/reports/DailyReportForm'
import DraftReportsList from '@/components/admin/reports/DraftReportsList'
import { FileText, FilePlus } from 'lucide-react'

const EducatorDailyReportsPage = () => {
  const [selectedDraft, setSelectedDraft] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('new')
  const [refreshDrafts, setRefreshDrafts] = useState(0)

  const handleEditDraft = (draft: any) => {
    setSelectedDraft(draft)
    setActiveTab('new')
  }

  const handleReportSaved = () => {
    setSelectedDraft(null)
    setRefreshDrafts(prev => prev + 1)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Suivi Quotidien</h1>
        <p className="text-muted-foreground">
          Créez des rapports quotidiens pour les enfants de votre groupe
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="new" className="flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            Nouveau rapport
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mes brouillons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDraft ? 'Continuer le rapport' : 'Créer un rapport quotidien'}
              </CardTitle>
              <CardDescription>
                {selectedDraft 
                  ? 'Complétez et envoyez votre rapport sauvegardé'
                  : 'Sélectionnez un enfant de votre groupe et remplissez le formulaire de suivi'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyReportForm 
                restrictToAssigned 
                existingReport={selectedDraft}
                childId={selectedDraft?.child_id}
                onSaved={handleReportSaved}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle>Mes brouillons</CardTitle>
              <CardDescription>
                Retrouvez tous vos rapports sauvegardés en brouillon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DraftReportsList 
                onEditDraft={handleEditDraft}
                refreshTrigger={refreshDrafts}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EducatorDailyReportsPage
