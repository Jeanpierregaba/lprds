import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DailyReportForm from '@/components/admin/reports/DailyReportForm'

const EducatorDailyReportsPage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Suivi Quotidien</h1>
        <p className="text-muted-foreground">
          Créez des rapports quotidiens pour les enfants de votre groupe
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créer un rapport quotidien</CardTitle>
          <CardDescription>
            Sélectionnez un enfant de votre groupe et remplissez le formulaire de suivi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyReportForm restrictToAssigned />
        </CardContent>
      </Card>
    </div>
  )
}

export default EducatorDailyReportsPage
