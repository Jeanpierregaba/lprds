import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, Search, QrCode, UserCheck, UserX, FileText } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Child {
  id: string
  first_name: string
  last_name: string
  photo_url?: string
  section: string
  group_id?: string
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

const AttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<AttendanceStats>({ total: 0, present: 0, absent: 0, late: 0 })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAttendanceData()
  }, [selectedDate, selectedSection])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      
      // First get all children
      let childrenQuery = supabase.from('children').select('*')
      
      if (selectedSection !== 'all') {
        childrenQuery = childrenQuery.eq('section', selectedSection as 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil')
      }
      
      const { data: children, error: childrenError } = await childrenQuery
      if (childrenError) throw childrenError

      // Then get attendance records for the selected date
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('attendance_date', selectedDate)

      if (attendanceError) throw attendanceError

      // Combine the data
      const combinedData: AttendanceData[] = children?.map(child => {
        const attendance = attendanceRecords?.find(record => record.child_id === child.id)
        return {
          child,
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
      }) || []

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
    // Consider late if arrived after 9:00 AM
    const late = data.filter(d => 
      d.attendance?.arrival_time && new Date(`2000-01-01T${d.attendance.arrival_time}`) > new Date(`2000-01-01T09:00:00`)
    ).length

    setStats({ total, present, absent, late })
  }

  const markManualAttendance = async (childId: string, type: 'arrival' | 'departure') => {
    try {
      const currentTime = format(new Date(), 'HH:mm:ss')
      
      // Check if record exists for today
      const { data: existing } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('child_id', childId)
        .eq('attendance_date', selectedDate)
        .maybeSingle()

      if (existing) {
        // Update existing record
        const updateData = type === 'arrival' 
          ? { arrival_time: currentTime, is_present: true }
          : { departure_time: currentTime }

        const { error } = await supabase
          .from('daily_attendance')
          .update(updateData)
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Create new record
        const { error } = await supabase
          .from('daily_attendance')
          .insert([{
            child_id: childId,
            educator_id: '', // This will need to be populated properly
            attendance_date: selectedDate,
            arrival_time: type === 'arrival' ? currentTime : null,
            departure_time: type === 'departure' ? currentTime : null,
            is_present: type === 'arrival'
          }])

        if (error) throw error
      }

      toast({
        title: "Succès",
        description: `${type === 'arrival' ? 'Arrivée' : 'Départ'} enregistré(e)`,
      })

      fetchAttendanceData()
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la présence",
        variant: "destructive"
      })
    }
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Présences</h1>
          <p className="text-muted-foreground">
            Suivi et gestion des présences quotidiennes
          </p>
        </div>
        <Button>
          <QrCode className="w-4 h-4 mr-2" />
          Scanner QR
        </Button>
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
            
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sections</SelectItem>
                <SelectItem value="creche">Crèche</SelectItem>
                <SelectItem value="garderie">Garderie</SelectItem>
                <SelectItem value="maternelle">Maternelle</SelectItem>
              </SelectContent>
            </Select>
            
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
          <CardTitle>Liste des Présences - {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}</CardTitle>
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
                <div key={data.child.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
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
                        {data.child.section}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Arrivée</p>
                      <p className="font-medium">
                        {data.attendance?.arrival_time || '-'}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Départ</p>
                      <p className="font-medium">
                        {data.attendance?.departure_time || '-'}
                      </p>
                    </div>
                    
                    {getStatusBadge(data.attendance)}
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markManualAttendance(data.child.id, 'arrival')}
                        disabled={!!data.attendance?.arrival_time}
                      >
                        Arrivée
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markManualAttendance(data.child.id, 'departure')}
                        disabled={!data.attendance?.arrival_time || !!data.attendance?.departure_time}
                      >
                        Départ
                      </Button>
                    </div>
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

export default AttendancePage