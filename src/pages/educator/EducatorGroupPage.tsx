import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { 
  Baby, 
  Search,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Heart,
  Info
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface Child {
  id: string
  first_name: string
  last_name: string
  birth_date: string
  photo_url?: string
  section?: string
  allergies?: string
  medical_info?: string
  address?: string
}

interface Group {
  id: string
  name: string
  section: string
  capacity: number
  description?: string
}

const EducatorGroupPage = () => {
  const [children, setChildren] = useState<Child[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadGroupAndChildren()
  }, [profile])

  const loadGroupAndChildren = async () => {
    if (!profile) return

    try {
      setLoading(true)

      // Charger les informations du groupe
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('assigned_educator_id', profile.id)
        .single()

      if (groupError && groupError.code !== 'PGRST116') {
        console.error('Erreur chargement groupe:', groupError)
      } else if (groupData) {
        setGroup(groupData)
      }

      // Charger les enfants assignés à l'éducateur
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, first_name, last_name, birth_date, photo_url, section, allergies, medical_info, address')
        .eq('assigned_educator_id', profile.id)
        .eq('status', 'active')
        .order('first_name')

      if (childrenError) throw childrenError

      setChildren(childrenData || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du groupe",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let months = (today.getFullYear() - birth.getFullYear()) * 12
    months += today.getMonth() - birth.getMonth()
    
    if (months < 12) {
      return `${months} mois`
    } else {
      const years = Math.floor(months / 12)
      const remainingMonths = months % 12
      return remainingMonths > 0 ? `${years} ans ${remainingMonths} mois` : `${years} ans`
    }
  }

  const filteredChildren = children.filter(child =>
    `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de votre groupe...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon Groupe</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble des enfants dont vous avez la charge
        </p>
      </div>

      {/* Informations du groupe */}
      {group ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              {group.name}
            </CardTitle>
            <CardDescription>
              Section: {group.section} • Capacité: {children.length}/{group.capacity} enfants
            </CardDescription>
          </CardHeader>
          {group.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </CardContent>
          )}
        </Card>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Vous n'êtes pas encore assigné à un groupe. Contactez l'administration.
          </AlertDescription>
        </Alert>
      )}

      {/* Barre de recherche et statistiques */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un enfant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="text-sm py-2 px-4">
          {filteredChildren.length} enfant{filteredChildren.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Liste des enfants */}
      {filteredChildren.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun enfant trouvé</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Aucun résultat pour cette recherche" : "Aucun enfant n'est assigné à votre groupe"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChildren.map((child) => (
            <Card key={child.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={child.photo_url} />
                    <AvatarFallback className="bg-primary/10 text-lg">
                      {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {child.first_name} {child.last_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {calculateAge(child.birth_date)}
                      </span>
                    </div>
                    {child.section && (
                      <Badge variant="outline" className="mt-2">
                        {child.section}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {child.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">{child.address}</span>
                  </div>
                )}

                {child.allergies && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Allergies:</strong> {child.allergies}
                    </AlertDescription>
                  </Alert>
                )}

                {child.medical_info && (
                  <Alert className="py-2 bg-blue-50 border-blue-200">
                    <Heart className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-900">
                      <strong>Info médicale:</strong> {child.medical_info}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Voir le détail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default EducatorGroupPage
