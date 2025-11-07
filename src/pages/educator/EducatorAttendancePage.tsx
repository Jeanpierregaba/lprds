import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Search, Download, Filter } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { AttendanceStatsCards } from '@/components/educator/AttendanceStatsCards'
import { AttendanceChildCard } from '@/components/educator/AttendanceChildCard'

interface Child {
  id: string
  first_name: string
  last_name: string
  photo_url?: string
  section: 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_GS' | 'maternelle_MS' | 'maternelle_PS1' | 'maternelle_PS2'
}

interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
}

interface AttendanceData {
  attendance: any
  child: Child
}

const EducatorAttendancePage = () => {
  const { profile } = useAuth()
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [searchQuery, setSearchQuery] = useState('')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [stats, setStats] = useState<AttendanceStats>({ total: 0, present: 0, absent: 0, late: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  // Mémorisation de la fonction de calcul des stats
  const calculateStats = useCallback((data: AttendanceData[]) => {
    const total = data.length
    const present = data.filter(d => d.attendance?.is_present && d.attendance?.arrival_time).length
    const absent = data.filter(d => !d.attendance?.is_present).length
    
    // Calculate late based on section:
    // - Maternelle sections: late after 8:00 AM
    // - Crèche sections: late after 9:00 AM
    const late = data.filter(d => {
      if (!d.attendance?.arrival_time) return false
      
      const arrivalTime = new Date(`2000-01-01T${d.attendance.arrival_time}`)
      const maternelleSections = ['maternelle_GS', 'maternelle_MS', 'maternelle_PS1', 'maternelle_PS2']
      const crecheSections = ['creche_etoile', 'creche_nuage', 'creche_soleil']
      
      if (maternelleSections.includes(d.child.section)) {
        return arrivalTime > new Date(`2000-01-01T08:00:00`)
      } else if (crecheSections.includes(d.child.section)) {
        return arrivalTime > new Date(`2000-01-01T09:00:00`)
      }
      
      return false
    }).length

    setStats({ total, present, absent, late })
  }, [])

  // Optimisation du chargement des données avec Promise.all
  const fetchAttendanceData = useCallback(async () => {
    if (!profile) return

    try {
      setLoading(true)

      // Identify educator's group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('assigned_educator_id', profile.id)
        .single()

      if (groupError || !group) {
        setAttendanceData([])
        setStats({ total: 0, present: 0, absent: 0, late: 0 })
        return
      }

      // Fetch children and attendance in parallel
      const [childrenRes, attendanceRes] = await Promise.all([
        supabase
          .from('children')
          .select('*')
          .eq('status', 'active')
          .eq('group_id', group.id)
          .order('first_name'),
        supabase
          .from('daily_attendance')
          .select('*')
          .eq('attendance_date', selectedDate)
      ])

      if (childrenRes.error) throw childrenRes.error

      const children = childrenRes.data || []
      const attendanceMap = new Map(
        (attendanceRes.data || []).map(a => [a.child_id, a])
      )

      const combinedData = children.map(child => ({
        child,
        attendance: attendanceMap.get(child.id) || null
      }))

      setAttendanceData(combinedData)
      calculateStats(combinedData)
    } catch (error) {
      console.error('Error fetching attendance data:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les données de présence.'
      })
    } finally {
      setLoading(false)
    }
  }, [profile, selectedDate, calculateStats, toast])

  useEffect(() => {
    fetchAttendanceData()
  }, [fetchAttendanceData])

  // Filtrage mémorisé des données
  const filteredData = useMemo(() => {
    return attendanceData.filter(item => {
      const matchesSearch = searchQuery === '' || 
        `${item.child.first_name} ${item.child.last_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      
      const matchesSection = sectionFilter === 'all' || item.child.section === sectionFilter
      
      return matchesSearch && matchesSection
    })
  }, [attendanceData, searchQuery, sectionFilter])

  // Groupement par statut
  const groupedData = useMemo(() => {
    return {
      present: filteredData.filter(d => d.attendance?.is_present),
      absent: filteredData.filter(d => d.attendance?.is_present === false),
      unmarked: filteredData.filter(d => d.attendance?.is_present === undefined)
    }
  }, [filteredData])

  // Actions optimisées
  const markPresent = useCallback(async (childId: string) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('daily_attendance')
        .upsert({
          child_id: childId,
          educator_id: profile!.id,
          attendance_date: selectedDate,
          is_present: true
        }, {
          onConflict: 'child_id,attendance_date'
        })

      if (error) throw error

      await fetchAttendanceData()
      toast({
        title: 'Succès',
        description: 'Présence enregistrée'
      })
    } catch (error) {
      console.error('Error marking present:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la présence'
      })
    } finally {
      setActionLoading(false)
    }
  }, [selectedDate, fetchAttendanceData, toast])

  const markAbsent = useCallback(async (childId: string) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('daily_attendance')
        .upsert({
          child_id: childId,
          educator_id: profile!.id,
          attendance_date: selectedDate,
          is_present: false
        }, {
          onConflict: 'child_id,attendance_date'
        })

      if (error) throw error

      await fetchAttendanceData()
      toast({
        title: 'Succès',
        description: 'Absence enregistrée'
      })
    } catch (error) {
      console.error('Error marking absent:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'enregistrer l\'absence'
      })
    } finally {
      setActionLoading(false)
    }
  }, [selectedDate, fetchAttendanceData, toast])

  const recordArrival = useCallback(async (childId: string) => {
    setActionLoading(true)
    try {
      const currentTime = format(new Date(), 'HH:mm:ss')
      
      const { error } = await supabase
        .from('daily_attendance')
        .update({ arrival_time: currentTime })
        .eq('child_id', childId)
        .eq('attendance_date', selectedDate)

      if (error) throw error

      await fetchAttendanceData()
      toast({
        title: 'Succès',
        description: `Arrivée enregistrée à ${currentTime}`
      })
    } catch (error) {
      console.error('Error recording arrival:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'enregistrer l\'arrivée'
      })
    } finally {
      setActionLoading(false)
    }
  }, [selectedDate, fetchAttendanceData, toast])

  const recordDeparture = useCallback(async (childId: string) => {
    setActionLoading(true)
    try {
      const currentTime = format(new Date(), 'HH:mm:ss')
      
      const { error } = await supabase
        .from('daily_attendance')
        .update({ departure_time: currentTime })
        .eq('child_id', childId)
        .eq('attendance_date', selectedDate)

      if (error) throw error

      await fetchAttendanceData()
      toast({
        title: 'Succès',
        description: `Départ enregistré à ${currentTime}`
      })
    } catch (error) {
      console.error('Error recording departure:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le départ'
      })
    } finally {
      setActionLoading(false)
    }
  }, [selectedDate, fetchAttendanceData, toast])

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Présences</h1>
          <p className="text-muted-foreground">
            Suivi quotidien des arrivées et départs
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Button variant="outline" size="icon" className="w-full sm:w-auto">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AttendanceStatsCards stats={stats} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle>Liste des Enfants</CardTitle>
          <CardDescription>
            Marquez les présences et enregistrez les horaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un enfant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sections</SelectItem>
                <SelectItem value="creche_etoile">Crèche Étoile</SelectItem>
                <SelectItem value="creche_nuage">Crèche Nuage</SelectItem>
                <SelectItem value="creche_soleil">Crèche Soleil TPS</SelectItem>
                <SelectItem value="maternelle_PS1">Maternelle PS1</SelectItem>
                <SelectItem value="maternelle_PS2">Maternelle PS2</SelectItem>
                <SelectItem value="maternelle_MS">Maternelle MS</SelectItem>
                <SelectItem value="maternelle_GS">Maternelle GS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs par statut */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Tous ({filteredData.length})</TabsTrigger>
              <TabsTrigger value="present">Présents ({groupedData.present.length})</TabsTrigger>
              <TabsTrigger value="absent">Absents ({groupedData.absent.length})</TabsTrigger>
              <TabsTrigger value="unmarked">Non marqués ({groupedData.unmarked.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun enfant trouvé
                </div>
              ) : (
                filteredData.map((item) => (
                  <AttendanceChildCard
                    key={item.child.id}
                    child={item.child}
                    attendance={item.attendance}
                    onMarkPresent={markPresent}
                    onMarkAbsent={markAbsent}
                    onRecordArrival={recordArrival}
                    onRecordDeparture={recordDeparture}
                    loading={actionLoading}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="present" className="space-y-4 mt-4">
              {groupedData.present.map((item) => (
                <AttendanceChildCard
                  key={item.child.id}
                  child={item.child}
                  attendance={item.attendance}
                  onMarkPresent={markPresent}
                  onMarkAbsent={markAbsent}
                  onRecordArrival={recordArrival}
                  onRecordDeparture={recordDeparture}
                  loading={actionLoading}
                />
              ))}
            </TabsContent>

            <TabsContent value="absent" className="space-y-4 mt-4">
              {groupedData.absent.map((item) => (
                <AttendanceChildCard
                  key={item.child.id}
                  child={item.child}
                  attendance={item.attendance}
                  onMarkPresent={markPresent}
                  onMarkAbsent={markAbsent}
                  onRecordArrival={recordArrival}
                  onRecordDeparture={recordDeparture}
                  loading={actionLoading}
                />
              ))}
            </TabsContent>

            <TabsContent value="unmarked" className="space-y-4 mt-4">
              {groupedData.unmarked.map((item) => (
                <AttendanceChildCard
                  key={item.child.id}
                  child={item.child}
                  attendance={item.attendance}
                  onMarkPresent={markPresent}
                  onMarkAbsent={markAbsent}
                  onRecordArrival={recordArrival}
                  onRecordDeparture={recordDeparture}
                  loading={actionLoading}
                />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default EducatorAttendancePage
