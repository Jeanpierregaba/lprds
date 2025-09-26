import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const StaffPage = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion du Personnel</CardTitle>
          <CardDescription>
            Liste et gestion de l'équipe éducative
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Interface de gestion du personnel en développement...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffPage