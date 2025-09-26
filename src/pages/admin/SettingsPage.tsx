import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const SettingsPage = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres</CardTitle>
          <CardDescription>
            Configuration de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Interface de paramètres en développement...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage