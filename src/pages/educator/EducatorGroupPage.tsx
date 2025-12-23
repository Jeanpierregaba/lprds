import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Baby, 
  Search,
  Users,
  AlertCircle,
  Info
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { GroupChildCard } from '@/components/educator/GroupChildCard'

interface Child {
  id: string
  first_name: string
  last_name: string
  birth_date: string
  photo_url?: string
  section?: string
  allergies?: string
  medical_info?: string
  special_needs?: string
  address?: string
  code_qr_id?: string
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
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { profile } = useAuth()
  const { toast } = useToast()

  // Optimisation du chargement avec Promise.all
  const loadGroupAndChildren = useCallback(async () => {
    if (!profile) return

    try {
      setLoading(true)

      // Fetch groups and children in parallel
      const [groupRes, childrenRes] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .eq('assigned_educator_id', profile.id)
          .order('name'),
        supabase
          .from('children')
          .select('*')
          .eq('status', 'active')
          .order('first_name')
      ])

      if (groupRes.error) throw groupRes.error

      const educatorGroups = groupRes.data || []
      setGroups(educatorGroups)

      if (educatorGroups.length === 0) {
        toast({
          variant: 'default',
          title: 'Information',
          description: 'Aucun groupe ne vous est assigné pour le moment.'
        })
        setChildren([])
        setSelectedGroupId(null)
        return
      }

      // Select first group by default if none selected
      const initialGroupId = selectedGroupId && educatorGroups.some(g => g.id === selectedGroupId)
        ? selectedGroupId
        : educatorGroups[0].id
      setSelectedGroupId(initialGroupId)

      // Filter children by selected group
      const groupChildren = (childrenRes.data || []).filter(
        child => child.group_id === initialGroupId
      )

      setChildren(groupChildren)
    } catch (error) {
      console.error('Error loading group and children:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les informations du groupe.'
      })
    } finally {
      setLoading(false)
    }
  }, [profile, toast, selectedGroupId])

  useEffect(() => {
    loadGroupAndChildren()
  }, [loadGroupAndChildren])

  // Filtrage mémorisé
  const filteredChildren = useMemo(() => {
    if (!searchTerm) return children

    const searchLower = searchTerm.toLowerCase()
    return children.filter(child =>
      `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchLower)
    )
  }, [children, searchTerm])

  // Statistiques mémorisées
  const currentGroup = useMemo(
    () => groups.find(g => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  )

  const stats = useMemo(() => {
    if (!currentGroup) {
      return {
        totalChildren: 0,
        withAllergies: 0,
        withMedicalInfo: 0,
        withSpecialNeeds: 0,
        occupancyRate: 0
      }
    }
    const totalChildren = children.length
    const withAllergies = children.filter(c => c.allergies).length
    const withMedicalInfo = children.filter(c => c.medical_info).length
    const withSpecialNeeds = children.filter(c => c.special_needs).length

    return {
      totalChildren,
      withAllergies,
      withMedicalInfo,
      withSpecialNeeds,
      occupancyRate: currentGroup.capacity ? Math.round((totalChildren / currentGroup.capacity) * 100) : 0
    }
  }, [children, currentGroup])

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      'creche_etoile': 'Crèche Étoile',
      'creche_nuage': 'Crèche Nuage',
      'creche_soleil': 'Crèche Soleil TPS',
      'garderie': 'Garderie',
      'maternelle_PS1': 'Maternelle PS1',
      'maternelle_PS2': 'Maternelle PS2',
      'maternelle_MS': 'Maternelle MS',
      'maternelle_GS': 'Maternelle GS',
    }
    return labels[section] || section
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!currentGroup) {
    return (
      <div className="p-4 sm:p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Aucun groupe ne vous est assigné pour le moment. Contactez l'administration pour plus d'informations.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{currentGroup.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {getSectionLabel(currentGroup.section)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {stats.totalChildren} / {currentGroup.capacity} enfants
            </span>
          </div>
          {currentGroup.description && (
            <p className="text-muted-foreground mt-2">{currentGroup.description}</p>
          )}
        </div>
        {groups.length > 1 && (
          <div className="w-full sm:w-64">
            <Label className="text-sm font-medium">Vos groupes</Label>
            <Select value={selectedGroupId || ''} onValueChange={(v) => setSelectedGroupId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un groupe" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name} ({getSectionLabel(g.section)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enfants</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChildren}</div>
            <p className="text-xs text-muted-foreground">
              Taux d'occupation: {stats.occupancyRate}%
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Allergies</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withAllergies}</div>
            <p className="text-xs text-muted-foreground">
              Enfants avec allergies
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Info Médicale</CardTitle>
            <Baby className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withMedicalInfo}</div>
            <p className="text-xs text-muted-foreground">
              Avec informations médicales
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Besoins Spéciaux</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withSpecialNeeds}</div>
            <p className="text-xs text-muted-foreground">
              Avec besoins spéciaux
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des enfants */}
      <Card>
        <CardHeader>
          <CardTitle>Enfants du Groupe</CardTitle>
          <CardDescription>
            Liste complète des enfants assignés à votre groupe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un enfant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Alertes médicales importantes */}
          {stats.withAllergies > 0 && (
            <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>{stats.withAllergies}</strong> enfant(s) avec des allergies dans ce groupe.
                Vérifiez les informations individuelles ci-dessous.
              </AlertDescription>
            </Alert>
          )}

          {/* Liste des enfants */}
          <div className="space-y-4">
            {filteredChildren.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Aucun enfant ne correspond à votre recherche' : 'Aucun enfant dans ce groupe'}
              </div>
            ) : (
              filteredChildren.map((child) => (
                <GroupChildCard key={child.id} child={child} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EducatorGroupPage
