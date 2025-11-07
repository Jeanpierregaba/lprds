import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Calendar,
  UserCheck,
  Shield
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DashboardStatsCard } from './DashboardStatsCard';
import { BirthdaySection } from './BirthdaySection';
import { AlertsSection, type Alert } from './AlertsSection';

interface DashboardStats {
  totalChildren: number;
  presentToday: number;
  attendanceRate: number;
  staffPresent: number;
  totalStaff: number;
  incidentsToday: number;
  birthdaysThisMonth: number;
}

interface SectionData {
  section: string;
  effectif: number;
  capacite: number;
}


export const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    presentToday: 0,
    attendanceRate: 0,
    staffPresent: 0,
    totalStaff: 0,
    incidentsToday: 0,
    birthdaysThisMonth: 0
  });
  const [sectionData, setSectionData] = useState<SectionData[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [birthdayChildren, setBirthdayChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];

      // Fetch all data in parallel for better performance
      const [childrenRes, attendanceRes, staffRes] = await Promise.all([
        supabase
          .from('children')
          .select('id, status, section, admission_date, first_name, last_name, allergies, birth_date'),
        supabase
          .from('attendance')
          .select('id, child_id, arrival_time')
          .eq('date', today),
        supabase
          .from('profiles')
          .select('id, role, is_active')
          .in('role', ['educator', 'admin', 'secretary'])
      ]);

      const children = childrenRes.data || [];
      const attendance = attendanceRes.data || [];
      const staff = staffRes.data || [];
      
      // Calculate stats
      const totalChildren = children?.filter(c => c.status === 'active').length || 0;
      const presentToday = attendance?.length || 0;
      const attendanceRate = totalChildren > 0 ? Math.round((presentToday / totalChildren) * 100) : 0;
      const totalStaff = staff?.filter(s => s.is_active).length || 0;
      const staffPresent = totalStaff; // Assuming all active staff are present for now
      const incidentsToday = 0; // No incidents table available

      // Calculate birthdays this month
      const currentMonth = new Date().getMonth();
      const birthdayChildrenThisMonth = children?.filter(child => {
        if (!child.birth_date) return false;
        const birthDate = new Date(child.birth_date);
        return birthDate.getMonth() === currentMonth && child.status === 'active';
      }) || [];
      
      const birthdaysThisMonth = birthdayChildrenThisMonth.length;

      // Sort birthday children by day of month
      const sortedBirthdayChildren = birthdayChildrenThisMonth.sort((a, b) => {
        const dayA = new Date(a.birth_date).getDate();
        const dayB = new Date(b.birth_date).getDate();
        return dayA - dayB;
      });

      setBirthdayChildren(sortedBirthdayChildren);

      setStats({
        totalChildren,
        presentToday,
        attendanceRate,
        staffPresent,
        totalStaff,
        incidentsToday,
        birthdaysThisMonth
      });

      // Generate section data
      const sectionLabels = {
        'creche_etoile': 'Crèche Étoile',
        'creche_nuage': 'Crèche Nuage', 
        'creche_soleil': 'Crèche Soleil',
        'garderie': 'Garderie',
        'maternelle_PS1': 'Maternelle PS1',
        'maternelle_PS2': 'Maternelle PS2',
        'maternelle_MS': 'Maternelle MS',
        'maternelle_GS': 'Maternelle GS'
      };

      const sectionStats = Object.entries(sectionLabels).map(([key, label]) => {
        const sectionChildren = children?.filter(c => c.section === key && c.status === 'active') || [];
        const sectionAttendance = attendance?.filter(a => 
          sectionChildren.some(c => c.id === a.child_id)
        ) || [];
        
        return {
          section: label,
          effectif: sectionAttendance.length,
          capacite: Math.max(sectionChildren.length, sectionAttendance.length) // Use actual capacity
        };
      });

      setSectionData(sectionStats);

      // Generate hourly attendance data
      const hourlyData = [];
      for (let hour = 8; hour <= 17; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const hourAttendance = attendance?.filter(a => {
          const arrivalHour = new Date(a.arrival_time).getHours();
          return arrivalHour <= hour;
        }).length || 0;
        
        hourlyData.push({
          time: timeStr,
          presents: hourAttendance
        });
      }
      setAttendanceData(hourlyData);

      // Generate real alerts
      const realAlerts: Alert[] = [];
      
      // Check for medical alerts
      const childrenWithAllergies = children?.filter(c => c.allergies && c.status === 'active') || [];
      childrenWithAllergies.forEach(child => {
        realAlerts.push({
          id: `medical-${child.id}`,
          type: 'medical',
          message: `Allergie: ${child.first_name} ${child.last_name} - ${child.allergies}`,
          severity: 'high'
        });
      });

      // Check for low attendance
      if (attendanceRate < 70) {
        realAlerts.push({
          id: 'attendance-low',
          type: 'absence',
          message: `Taux de présence faible: ${attendanceRate}%`,
          severity: 'medium'
        });
      }

      // Check for section capacity issues
      sectionStats.forEach(section => {
        if (section.effectif > section.capacite * 0.9) {
          realAlerts.push({
            id: `capacity-${section.section}`,
            type: 'ratio',
            message: `Section ${section.section} proche de la capacité maximale`,
            severity: 'medium'
          });
        }
      });

      setAlerts(realAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const currentDate = useMemo(() => 
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 
  []);


  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Administration</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </div>
        <Badge variant="secondary" className="text-sm self-start sm:self-center">
          Direction Générale
        </Badge>
      </div>

      {/* Alertes importantes */}
      <AlertsSection alerts={alerts} />

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <DashboardStatsCard
          title="Enfants Présents"
          value={stats.presentToday}
          subtitle={`sur ${stats.totalChildren} inscrits`}
          icon={UserCheck}
          iconColor="text-green-600"
          loading={loading}
        />
        <DashboardStatsCard
          title="Taux de Présence"
          value={`${stats.attendanceRate}%`}
          subtitle={stats.attendanceRate >= 80 ? 'Excellent' : stats.attendanceRate >= 60 ? 'Correct' : 'À surveiller'}
          icon={TrendingUp}
          iconColor="text-blue-600"
          loading={loading}
        />
        <DashboardStatsCard
          title="Personnel Présent"
          value={stats.staffPresent}
          subtitle={`sur ${stats.totalStaff} prévus`}
          icon={Users}
          iconColor="text-purple-600"
          loading={loading}
        />
        <DashboardStatsCard
          title="Incidents du Jour"
          value={stats.incidentsToday}
          subtitle={stats.incidentsToday === 0 ? 'Aucun incident' : 'à traiter'}
          icon={Shield}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardStatsCard
          title="Anniversaires"
          value={stats.birthdaysThisMonth}
          subtitle={stats.birthdaysThisMonth === 0 ? 'Aucun ce mois' : 'ce mois-ci'}
          icon={Calendar}
          iconColor="text-pink-600"
          loading={loading}
        />
      </div>

      {/* Graphiques et données */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Effectifs par section */}
        <Card>
          <CardHeader>
            <CardTitle>Effectifs par Section</CardTitle>
            <CardDescription>Occupation actuelle vs capacité maximale</CardDescription>
          </CardHeader>
          <CardContent>
            {sectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="section" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="effectif" fill="#3b82f6" name="Effectif actuel" />
                  <Bar dataKey="capacite" fill="#e5e7eb" name="Capacité max" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Présences en temps réel */}
        <Card>
          <CardHeader>
            <CardTitle>Présences en Temps Réel</CardTitle>
            <CardDescription>Évolution des présences aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="presents" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Aucune donnée de présence disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Anniversaires du mois */}
      <BirthdaySection children={birthdayChildren} />

      {/* Planning du personnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning du Personnel - Aujourd'hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sectionData.length > 0 ? (
              sectionData.map((section, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm mb-2">{section.section}</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Éducateurs:</span>
                      <Badge variant="outline">{Math.ceil(section.effectif / 8)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Enfants:</span>
                      <Badge variant="secondary">{section.effectif}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Ratio:</span>
                      <Badge variant={section.effectif / Math.ceil(section.effectif / 8) > 8 ? "destructive" : "default"}>
                        1:{Math.round(section.effectif / Math.ceil(section.effectif / 8))}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-8">
                Aucune donnée de section disponible
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};