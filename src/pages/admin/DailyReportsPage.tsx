import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminOrSecretary, EducatorOnly } from '@/components/PermissionGuard'
import DailyReportForm from '@/components/admin/reports/DailyReportForm'
import ReportValidation from '@/components/admin/reports/ReportValidation'
import ReportsHistory from '@/components/admin/reports/ReportsHistory'
import RejectedReportsList from '@/components/admin/reports/RejectedReportsList'

const DailyReportsPage = () => {
  return (
    <div className="p-6">
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Créer un rapport</TabsTrigger>
          <AdminOrSecretary>
            <TabsTrigger value="validate">Validation</TabsTrigger>
          </AdminOrSecretary>
          <AdminOrSecretary>
            <TabsTrigger value="rejected">Rejetés</TabsTrigger>
          </AdminOrSecretary>
          <AdminOrSecretary>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </AdminOrSecretary>
        </TabsList>

        <TabsContent value="create">
          <DailyReportForm />
        </TabsContent>

        <AdminOrSecretary>
          <TabsContent value="validate">
            <ReportValidation />
          </TabsContent>
        </AdminOrSecretary>

        <AdminOrSecretary>
          <TabsContent value="rejected">
            <RejectedReportsList />
          </TabsContent>
        </AdminOrSecretary>

        <AdminOrSecretary>
          <TabsContent value="history">
            <ReportsHistory />
          </TabsContent>
        </AdminOrSecretary>
      </Tabs>
    </div>
  )
}

export default DailyReportsPage