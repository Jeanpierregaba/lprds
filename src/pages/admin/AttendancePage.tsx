import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const AttendancePage = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Présences</CardTitle>
          <CardDescription>
            Suivi et gestion des présences quotidiennes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Interface de gestion des présences en développement...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AttendancePage