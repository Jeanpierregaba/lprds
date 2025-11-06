import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, Search, UserCheck, UserX } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'

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

const ParentAttendancePage = () => {
  const { profile } = useAuth()
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<AttendanceStats>({ total: 0, present: 0, absent: 0, late: 0 })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchAttendanceData()
    }
  }, [profile, selectedDate])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)

      // Get parent's children
      const { data: parentChildren, error: parentChildrenError } = await supabase
        .from('parent_children')
        .select(`
          child_id,
          children (
            id,
            first_name,
            last_name,
            photo_url,
            section,
            status
          )
        `)
        .eq('parent_id', profile?.id)

      if (parentChildrenError) throw parentChildrenError

      // Filter only active children
      const childrenData = parentChildren
        ?.map(pc => pc.children)
        .flat()
        .filter(child => child && child.status === 'active') || []

      if (childrenData.length === 0) {
        setAttendanceData([])
        setStats({ total: 0, present: 0, absent: 0, late: 0 })
        setLoading(false)
        return
      }

      const childrenIds = childrenData.map(c => c.id)

      // Fetch attendance for selected date
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('attendance_date', selectedDate)
        .in('child_id', childrenIds)

      if (attendanceError) throw attendanceError

      const combinedData: AttendanceData[] = childrenData.map(child => {
        const attendance = attendanceRecords?.find(record => record.child_id === child.id)
        return {
          child: child as Child,
          attendance: attendance || {
            id: '',
            child_id: child.id,
            attendance_date: selectedDate,
            is_present: false,
            arrival_time: null,
            departure_time: null,
            absence_notified: false,
            absence_reason: null,
            notes: null
          }
        }
      })

      setAttendanceData(combinedData)
      calculateStats(combinedData)
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de présence",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: AttendanceData[]) => {
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
  }

  const filteredData = attendanceData.filter(data => {
    const searchLower = searchQuery.toLowerCase()
    const childName = `${data.child.first_name} ${data.child.last_name}`.toLowerCase()
    return childName.includes(searchLower)
  })

  const getStatusBadge = (attendance: any) => {
    if (!attendance?.is_present) {
      return <Badge variant="destructive">Absent</Badge>
    }
    if (attendance?.arrival_time && !attendance?.departure_time) {
      return <Badge variant="default">Présent</Badge>
    }
    if (attendance?.arrival_time && attendance?.departure_time) {
      return <Badge variant="secondary">Parti</Badge>
    }
    return <Badge variant="outline">Non pointé</Badge>
  }

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      'creche_etoile': 'Crèche Étoile',
      'creche_nuage': 'Crèche Nuage',
      'creche_soleil': 'Crèche Soleil TPS',
      'garderie': 'Garderie',
      'maternelle_PS1': 'Maternelle PS1',
      'maternelle_PS2': 'Maternelle PS2',
      'maternelle_MS': 'Maternelle MS',
      'maternelle_GS': 'Maternelle GS'
    }
    return labels[section] || section
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-primary text-3xl font-bold">Historique des Présences</h1>
        <p className="text-primary">
          Suivi des arrivées et départs de vos enfants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <UserCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Présents</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absents</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retards</p>
                <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un enfant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Présences - {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}</CardTitle>
          <CardDescription>
            {filteredData.length} enfant{filteredData.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : filteredData.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucun enfant trouvé</p>
            ) : (
              filteredData.map((data, index) => (
                <div key={data.child.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={data.child.photo_url} />
                      <AvatarFallback>
                        {data.child.first_name[0]}{data.child.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium">
                        {data.child.first_name} {data.child.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getSectionLabel(data.child.section)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <p className="text-sm text-muted-foreground">Arrivée</p>
                      <p className="font-medium">
                        {data.attendance?.arrival_time ? format(new Date(`2000-01-01T${data.attendance.arrival_time}`), 'HH:mm') : '-'}
                      </p>
                    </div>
                    
                    <div className="text-center min-w-[80px]">
                      <p className="text-sm text-muted-foreground">Départ</p>
                      <p className="font-medium">
                        {data.attendance?.departure_time ? format(new Date(`2000-01-01T${data.attendance.departure_time}`), 'HH:mm') : '-'}
                      </p>
                    </div>
                    
                    {getStatusBadge(data.attendance)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ParentAttendancePage
