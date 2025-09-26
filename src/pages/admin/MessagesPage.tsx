import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const MessagesPage = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Centre de Messages</CardTitle>
          <CardDescription>
            Communication avec les parents et l'équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Interface de messagerie en développement...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default MessagesPage