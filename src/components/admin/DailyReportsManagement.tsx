import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Camera, FileText, QrCode, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Child {
  id: string
  first_name: string
  last_name: string
  photo_url?: string
  code_qr_id?: string
  section: 'creche_etoile' | 'creche_nuage' | 'creche_soleil' | 'garderie' | 'maternelle_GS' | 'maternelle_MS' | 'maternelle_PS1' | 'maternelle_PS2'
  group_id?: string
}

interface DailyReport {
  id: string
  child_id: string
  report_date: string
  arrival_time?: string
  departure_time?: string
  health_status?: string
  health_notes?: string
  activities: any
  nap_taken: boolean
  nap_duration_minutes?: number
  breakfast_eaten?: string
  lunch_eaten?: string
  snack_eaten?: string
  hygiene_bath: boolean
  hygiene_bowel_movement: boolean
  hygiene_frequency_notes?: string
  mood?: string
  special_observations?: string
  photos: any
  is_validated: boolean
  children?: any
}

interface Attendance {
  id: string
  child_id: string
  attendance_date: string
  arrival_time?: string
  departure_time?: string
  is_present: boolean
  absence_reason?: string
  children?: any
}

const DailyReportsManagement = () => {
  const { profile } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false)
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)
  const [scanType, setScanType] = useState<'arrival' | 'departure'>('arrival')
  const [isValidating, setIsValidating] = useState(false)

  // Form state for daily reports
  const [reportForm, setReportForm] = useState({
    health_status: '',
    health_notes: '',
    activities: [] as string[],
    nap_taken: false,
    nap_duration_minutes: '',
    breakfast_eaten: '',
    lunch_eaten: '',
    snack_eaten: '',
    hygiene_bath: false,
    hygiene_bowel_movement: false,
    hygiene_frequency_notes: '',
    mood: '',
    special_observations: ''
  })

  const isAdmin = profile?.role === 'admin' || profile?.role === 'secretary'
  const isEducator = profile?.role === 'educator'

  // Activity options for crèche/garderie
  const activityOptions = [
    'Peinture', 'Lecture', 'Jeux d\'extérieur', 'Musique', 'Danse',
    'Jeux de construction', 'Puzzles', 'Activités sensorielles',
    'Jeux d\'eau', 'Motricité', 'Cuisine', 'Jardinage'
  ]

  useEffect(() => {
    if (profile) {
      fetchChildren()
    }
  }, [profile])

  useEffect(() => {
    if (selectedChild && selectedDate) {
      fetchDayData()
    }
  }, [selectedChild, selectedDate])

  const fetchChildren = async () => {
    try {
      let query = supabase.from('children').select('*')

      if (isEducator) {
        // Educators only see their assigned children
        const { data: educatorChildren } = await supabase
          .rpc('get_educator_children', { user_uuid: profile?.user_id })
        
        if (educatorChildren) {
          query = query.in('id', educatorChildren)
        }
      }

      const { data, error } = await query.order('first_name')

      if (error) throw error
      setChildren(data || [])
    } catch (error) {
      console.error('Error fetching children:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des enfants",
        variant: "destructive"
      })
    }
  }

  const fetchDayData = async () => {
    if (!selectedChild) return

    try {
      // Fetch daily report for crèche/garderie
      if (selectedChild.section.startsWith('creche') || selectedChild.section === 'garderie') {
        const { data: reportData, error: reportError } = await supabase
          .from('daily_reports')
          .select('*, children(*)')
          .eq('child_id', selectedChild.id)
          .eq('report_date', selectedDate)
          .maybeSingle()

        if (reportError) throw reportError
        setDailyReport(reportData)

        if (reportData) {
          setReportForm({
            health_status: reportData.health_status || '',
            health_notes: reportData.health_notes || '',
            activities: Array.isArray(reportData.activities) ? reportData.activities.map(String) : [],
            nap_taken: reportData.nap_taken || false,
            nap_duration_minutes: reportData.nap_duration_minutes?.toString() || '',
            breakfast_eaten: reportData.breakfast_eaten || '',
            lunch_eaten: reportData.lunch_eaten || '',
            snack_eaten: reportData.snack_eaten || '',
            hygiene_bath: reportData.hygiene_bath || false,
            hygiene_bowel_movement: reportData.hygiene_bowel_movement || false,
            hygiene_frequency_notes: reportData.hygiene_frequency_notes || '',
            mood: reportData.mood || '',
            special_observations: reportData.special_observations || ''
          })
        } else {
          // Reset form for new report
          setReportForm({
            health_status: '',
            health_notes: '',
            activities: [],
            nap_taken: false,
            nap_duration_minutes: '',
            breakfast_eaten: '',
            lunch_eaten: '',
            snack_eaten: '',
            hygiene_bath: false,
            hygiene_bowel_movement: false,
            hygiene_frequency_notes: '',
            mood: '',
            special_observations: ''
          })
        }
      }

      // Fetch attendance for all sections
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('daily_attendance')
        .select('*, children(*)')
        .eq('child_id', selectedChild.id)
        .eq('attendance_date', selectedDate)
        .maybeSingle()

      if (attendanceError) throw attendanceError
      setAttendance(attendanceData)

    } catch (error) {
      console.error('Error fetching day data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du jour",
        variant: "destructive"
      })
    }
  }

  const handleQrScan = async (qrCode: string) => {
    if (!selectedChild) return

    try {
      const currentTime = format(new Date(), 'HH:mm:ss')
      
      // Update or create attendance record
      const attendanceData = {
        child_id: selectedChild.id,
        educator_id: profile?.id,
        attendance_date: selectedDate,
        [`${scanType}_time`]: currentTime,
        [`${scanType}_scanned_by`]: profile?.user_id,
        is_present: true
      }

      const { error: attendanceError } = await supabase
        .from('daily_attendance')
        .upsert(attendanceData)

      if (attendanceError) throw attendanceError

      // Log QR scan
      const { error: logError } = await supabase
        .from('qr_scan_logs')
        .insert({
          child_id: selectedChild.id,
          scanned_by: profile?.user_id,
          scan_type: scanType
        })

      if (logError) throw logError

      toast({
        title: "Succès",
        description: `${scanType === 'arrival' ? 'Arrivée' : 'Départ'} enregistré(e) avec succès`
      })

      setIsQrScannerOpen(false)
      fetchDayData()

    } catch (error) {
      console.error('Error processing QR scan:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement du pointage",
        variant: "destructive"
      })
    }
  }

  const handleSaveReport = async () => {
    if (!selectedChild || (!selectedChild.section.startsWith('creche') && selectedChild.section !== 'garderie')) return

    try {
      const reportData = {
        child_id: selectedChild.id,
        educator_id: profile?.id,
        report_date: selectedDate,
        ...reportForm,
        nap_duration_minutes: reportForm.nap_duration_minutes ? parseInt(reportForm.nap_duration_minutes) : null
      }

      const { error } = await supabase
        .from('daily_reports')
        .upsert(reportData)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Rapport journalier sauvegardé avec succès"
      })

      setIsCreateReportOpen(false)
      fetchDayData()

    } catch (error) {
      console.error('Error saving report:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde du rapport",
        variant: "destructive"
      })
    }
  }

  const handleValidateReport = async () => {
    if (!dailyReport || !isAdmin) return

    setIsValidating(true)
    try {
      const { error } = await supabase
        .from('daily_reports')
        .update({
          is_validated: true,
          validated_by: profile?.user_id,
          validated_at: new Date().toISOString()
        })
        .eq('id', dailyReport.id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Rapport validé avec succès"
      })

      fetchDayData()

    } catch (error) {
      console.error('Error validating report:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la validation",
        variant: "destructive"
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleMarkAbsent = async () => {
    if (!selectedChild) return

    try {
      const attendanceData = {
        child_id: selectedChild.id,
        educator_id: profile?.id,
        attendance_date: selectedDate,
        is_present: false,
        absence_notified: false
      }

      const { error } = await supabase
        .from('daily_attendance')
        .upsert(attendanceData)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Absence marquée avec succès"
      })

      fetchDayData()

    } catch (error) {
      console.error('Error marking absent:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors du marquage d'absence",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suivi Quotidien</h2>
          <p className="text-muted-foreground">
            Gestion des rapports journaliers et présences
          </p>
        </div>
      </div>

      {/* Child and Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sélection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Enfant</Label>
              <Select
                value={selectedChild?.id || ''}
                onValueChange={(value) => {
                  const child = children.find(c => c.id === value)
                  setSelectedChild(child || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un enfant" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name} ({child.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedChild && (
        <>
          {/* QR Code Scanning for Arrival/Departure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Pointage QR Code
              </CardTitle>
              <CardDescription>
                Scanner le code QR de {selectedChild.first_name} pour l'arrivée ou le départ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setScanType('arrival')
                    setIsQrScannerOpen(true)
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Enregistrer Arrivée
                </Button>
                <Button
                  onClick={() => {
                    setScanType('departure')
                    setIsQrScannerOpen(true)
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Enregistrer Départ
                </Button>
                {selectedChild.section.startsWith('maternelle') && (
                  <Button
                    onClick={handleMarkAbsent}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Marquer Absent
                  </Button>
                )}
              </div>

              {attendance && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Pointage du jour</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Arrivée</Label>
                      <p className="font-medium">
                        {attendance.arrival_time ? attendance.arrival_time : 'Non enregistrée'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Départ</Label>
                      <p className="font-medium">
                        {attendance.departure_time ? attendance.departure_time : 'Non enregistré'}
                      </p>
                    </div>
                  </div>
                  {!attendance.is_present && (
                    <Badge variant="destructive" className="mt-2">Absent</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Report for Crèche/Garderie */}
          {(selectedChild.section.startsWith('creche') || selectedChild.section === 'garderie') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Journal de Vie - {selectedChild.first_name}
                  </div>
                  <div className="flex items-center gap-2">
                    {dailyReport?.is_validated && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Validé
                      </Badge>
                    )}
                    {isEducator && (
                      <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            {dailyReport ? 'Modifier' : 'Créer'} le rapport
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Journal de vie - {selectedChild.first_name} {selectedChild.last_name}
                            </DialogTitle>
                            <DialogDescription>
                              {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            {/* Health Status */}
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">État de santé</Label>
                              <Select
                                value={reportForm.health_status}
                                onValueChange={(value) => setReportForm(prev => ({ ...prev, health_status: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner l'état de santé" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bien">Bien</SelectItem>
                                  <SelectItem value="surveiller">À surveiller</SelectItem>
                                  <SelectItem value="malade">Malade</SelectItem>
                                </SelectContent>
                              </Select>
                              <Textarea
                                placeholder="Précisions sur l'état de santé (optionnel)"
                                value={reportForm.health_notes}
                                onChange={(e) => setReportForm(prev => ({ ...prev, health_notes: e.target.value }))}
                              />
                            </div>

                            {/* Activities */}
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">Activités réalisées</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {activityOptions.map((activity) => (
                                  <div key={activity} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={activity}
                                      checked={reportForm.activities.includes(activity)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setReportForm(prev => ({
                                            ...prev,
                                            activities: [...prev.activities, activity]
                                          }))
                                        } else {
                                          setReportForm(prev => ({
                                            ...prev,
                                            activities: prev.activities.filter(a => a !== activity)
                                          }))
                                        }
                                      }}
                                    />
                                    <Label htmlFor={activity} className="text-sm">{activity}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Nap */}
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">Sieste</Label>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="nap"
                                  checked={reportForm.nap_taken}
                                  onCheckedChange={(checked) => setReportForm(prev => ({ ...prev, nap_taken: !!checked }))}
                                />
                                <Label htmlFor="nap">A fait la sieste</Label>
                              </div>
                              {reportForm.nap_taken && (
                                <div className="space-y-2">
                                  <Label>Durée (en minutes)</Label>
                                  <Input
                                    type="number"
                                    placeholder="90"
                                    value={reportForm.nap_duration_minutes}
                                    onChange={(e) => setReportForm(prev => ({ ...prev, nap_duration_minutes: e.target.value }))}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Meals */}
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">Repas</Label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Petit-déjeuner</Label>
                                  <Select
                                    value={reportForm.breakfast_eaten}
                                    onValueChange={(value) => setReportForm(prev => ({ ...prev, breakfast_eaten: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Quantité" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bien_mange">Bien mangé</SelectItem>
                                      <SelectItem value="peu_mange">Peu mangé</SelectItem>
                                      <SelectItem value="rien_mange">Rien mangé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Déjeuner</Label>
                                  <Select
                                    value={reportForm.lunch_eaten}
                                    onValueChange={(value) => setReportForm(prev => ({ ...prev, lunch_eaten: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Quantité" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bien_mange">Bien mangé</SelectItem>
                                      <SelectItem value="peu_mange">Peu mangé</SelectItem>
                                      <SelectItem value="rien_mange">Rien mangé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Goûter</Label>
                                  <Select
                                    value={reportForm.snack_eaten}
                                    onValueChange={(value) => setReportForm(prev => ({ ...prev, snack_eaten: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Quantité" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bien_mange">Bien mangé</SelectItem>
                                      <SelectItem value="peu_mange">Peu mangé</SelectItem>
                                      <SelectItem value="rien_mange">Rien mangé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>

                            {/* Hygiene */}
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">Hygiène</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="bath"
                                    checked={reportForm.hygiene_bath}
                                    onCheckedChange={(checked) => setReportForm(prev => ({ ...prev, hygiene_bath: !!checked }))}
                                  />
                                  <Label htmlFor="bath">Bain/Toilette</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="bowel"
                                    checked={reportForm.hygiene_bowel_movement}
                                    onCheckedChange={(checked) => setReportForm(prev => ({ ...prev, hygiene_bowel_movement: !!checked }))}
                                  />
                                  <Label htmlFor="bowel">Selles</Label>
                                </div>
                                <Textarea
                                  placeholder="Notes sur la fréquence (optionnel)"
                                  value={reportForm.hygiene_frequency_notes}
                                  onChange={(e) => setReportForm(prev => ({ ...prev, hygiene_frequency_notes: e.target.value }))}
                                />
                              </div>
                            </div>

                            {/* Mood */}
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">Humeur du jour</Label>
                              <Select
                                value={reportForm.mood}
                                onValueChange={(value) => setReportForm(prev => ({ ...prev, mood: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner l'humeur" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="joyeux">😊 Joyeux</SelectItem>
                                  <SelectItem value="calme">😌 Calme</SelectItem>
                                  <SelectItem value="agite">😤 Agité</SelectItem>
                                  <SelectItem value="triste">😢 Triste</SelectItem>
                                  <SelectItem value="fatigue">😴 Fatigué</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Special Observations */}
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">Observations particulières</Label>
                              <Textarea
                                placeholder="Notes additionnelles de l'éducatrice..."
                                value={reportForm.special_observations}
                                onChange={(e) => setReportForm(prev => ({ ...prev, special_observations: e.target.value }))}
                                rows={4}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsCreateReportOpen(false)}>
                                Annuler
                              </Button>
                              <Button onClick={handleSaveReport}>
                                Sauvegarder
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {isAdmin && dailyReport && !dailyReport.is_validated && (
                      <Button
                        onClick={handleValidateReport}
                        disabled={isValidating}
                        variant="default"
                      >
                        {isValidating ? 'Validation...' : 'Valider le rapport'}
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyReport ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">État de santé</Label>
                        <Badge variant={
                          dailyReport.health_status === 'bien' ? 'default' :
                          dailyReport.health_status === 'surveiller' ? 'secondary' : 'destructive'
                        }>
                          {dailyReport.health_status}
                        </Badge>
                        {dailyReport.health_notes && (
                          <p className="text-sm">{dailyReport.health_notes}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Sieste</Label>
                        <p className="font-medium">
                          {dailyReport.nap_taken ? 
                            `Oui${dailyReport.nap_duration_minutes ? ` (${dailyReport.nap_duration_minutes} min)` : ''}` : 
                            'Non'
                          }
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Humeur</Label>
                        <p className="font-medium">
                          {dailyReport.mood === 'joyeux' && '😊 Joyeux'}
                          {dailyReport.mood === 'calme' && '😌 Calme'}
                          {dailyReport.mood === 'agite' && '😤 Agité'}
                          {dailyReport.mood === 'triste' && '😢 Triste'}
                          {dailyReport.mood === 'fatigue' && '😴 Fatigué'}
                        </p>
                      </div>
                    </div>

                    {dailyReport.activities.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Activités</Label>
                        <div className="flex flex-wrap gap-1">
                          {dailyReport.activities.map((activity, index) => (
                            <Badge key={index} variant="outline">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {dailyReport.special_observations && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Observations</Label>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {dailyReport.special_observations}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun rapport journalier pour cette date
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Scanner QR Code - {scanType === 'arrival' ? 'Arrivée' : 'Départ'}
            </DialogTitle>
            <DialogDescription>
              Scannez le code QR de {selectedChild?.first_name} pour enregistrer son {scanType === 'arrival' ? 'arrivée' : 'départ'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center">
            <div className="border-2 border-dashed border-muted-foreground rounded-lg p-8">
              <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Interface de scan QR à implémenter
              </p>
              <Button 
                className="mt-4"
                onClick={() => handleQrScan(selectedChild?.code_qr_id || '')}
              >
                Simuler scan (Dev)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DailyReportsManagement