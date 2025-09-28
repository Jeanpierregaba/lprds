import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminOrSecretary, EducatorOnly } from '@/components/PermissionGuard'
import DailyReportForm from '@/components/admin/reports/DailyReportForm'
import ReportValidation from '@/components/admin/reports/ReportValidation'

const DailyReportsPage = () => {
  return (
    <div className="p-6">
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <EducatorOnly>
            <TabsTrigger value="create">Créer un rapport</TabsTrigger>
          </EducatorOnly>
          <AdminOrSecretary>
            <TabsTrigger value="validate">Validation</TabsTrigger>
          </AdminOrSecretary>
        </TabsList>

        <EducatorOnly>
          <TabsContent value="create">
            <DailyReportForm />
          </TabsContent>
        </EducatorOnly>

        <AdminOrSecretary>
          <TabsContent value="validate">
            <ReportValidation />
          </TabsContent>
        </AdminOrSecretary>
      </Tabs>
    </div>
  )
}

export default DailyReportsPage