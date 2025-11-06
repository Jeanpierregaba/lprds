import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import DailyReportForm from '@/components/admin/reports/DailyReportForm'
import DraftReportsList from '@/components/admin/reports/DraftReportsList'
import { ReportsList } from '@/components/educator/ReportsList'
import { 
  FileText, 
  FilePlus, 
  Clock, 
  CheckCircle, 
  XCircle,
  History
} from 'lucide-react'

const EducatorDailyReportsPage = () => {
  const [selectedDraft, setSelectedDraft] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('new')
  const [refreshDrafts, setRefreshDrafts] = useState(0)
  const [refreshPending, setRefreshPending] = useState(0)
  const [refreshValidated, setRefreshValidated] = useState(0)
  const [refreshRejected, setRefreshRejected] = useState(0)

  // Optimisation avec useCallback pour éviter les re-renders
  const handleEditDraft = useCallback((draft: any) => {
    setSelectedDraft(draft)
    setActiveTab('new')
  }, [])

  const handleReportSaved = useCallback(() => {
    setSelectedDraft(null)
    setRefreshDrafts(prev => prev + 1)
    setRefreshPending(prev => prev + 1)
  }, [])

  const handleViewReport = useCallback((report: any) => {
    // TODO: Implémenter la vue détaillée du rapport
    console.log('View report:', report)
  }, [])

  const handleEditReport = useCallback((report: any) => {
    setSelectedDraft(report)
    setActiveTab('new')
  }, [])

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Suivi Quotidien</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Créez et gérez les rapports quotidiens pour les enfants de votre groupe
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <TabsTrigger value="new" className="flex items-center gap-1 sm:gap-2">
            <FilePlus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Nouveau</span>
            <span className="sm:hidden">Nouveau</span>
          </TabsTrigger>
          
          <TabsTrigger value="drafts" className="flex items-center gap-1 sm:gap-2">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Brouillons</span>
            <span className="sm:hidden">Brouillons</span>
          </TabsTrigger>
          
          <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">En attente</span>
            <span className="sm:hidden">Attente</span>
          </TabsTrigger>
          
          <TabsTrigger value="rejected" className="flex items-center gap-1 sm:gap-2">
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Rejetés</span>
            <span className="sm:hidden">Rejetés</span>
          </TabsTrigger>
          
          <TabsTrigger value="validated" className="flex items-center gap-1 sm:gap-2">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Historique</span>
            <span className="sm:hidden">Validés</span>
          </TabsTrigger>
        </TabsList>

        {/* Nouveau Rapport */}
        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilePlus className="h-5 w-5" />
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

        {/* Brouillons */}
        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mes brouillons
              </CardTitle>
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

        {/* En Attente de Validation */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Rapports en attente de validation
                  </CardTitle>
                  <CardDescription>
                    Ces rapports ont été soumis et sont en cours de vérification par l'administration
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-blue-600">
                  En attente
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ReportsList
                status="pending"
                onViewReport={handleViewReport}
                refreshTrigger={refreshPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejetés */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Rapports rejetés
                  </CardTitle>
                  <CardDescription>
                    Ces rapports nécessitent des modifications avant d'être soumis à nouveau
                  </CardDescription>
                </div>
                <Badge variant="destructive">
                  Rejetés
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ReportsList
                status="rejected"
                onViewReport={handleViewReport}
                onEditReport={handleEditReport}
                refreshTrigger={refreshRejected}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique (Validés) */}
        <TabsContent value="validated">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-green-600" />
                    Historique des rapports validés
                  </CardTitle>
                  <CardDescription>
                    Tous vos rapports approuvés par l'administration
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Validés
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ReportsList
                status="validated"
                onViewReport={handleViewReport}
                refreshTrigger={refreshValidated}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EducatorDailyReportsPage
