import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar,
  UserCheck,
  Shield
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { DashboardStatsCard } from './DashboardStatsCard';
import { BirthdaySection } from './BirthdaySection';
import { AlertsSection, type Alert } from './AlertsSection';

interface DashboardStats {
  totalActiveChildren: number;
  presentToday: number;
  attendanceRate: number;
  incidentsToday: number;
  birthdaysThisMonth: number;
}

interface SectionData {
  section: string;
  actifs: number;
  presents: number;
}

const SECTION_COLORS: Record<string, string> = {
  'Crèche Étoile': '#3b82f6',
  'Crèche Nuage': '#8b5cf6',
  'Crèche Soleil': '#f59e0b',
  'Garderie': '#22c55e',
  'Maternelle PS1': '#ec4899',
  'Maternelle PS2': '#06b6d4',
  'Maternelle MS': '#f97316',
  'Maternelle GS': '#6366f1',
};

const SECTION_CHART_FALLBACK_COLORS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ec4899', '#06b6d4', '#f97316', '#6366f1',
];

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalActiveChildren: 0,
    presentToday: 0,
    attendanceRate: 0,
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
      const [childrenRes, attendanceRes] = await Promise.all([
        supabase
          .from('children')
          .select('id, status, section, admission_date, first_name, last_name, allergies, birth_date'),
        supabase
          .from('daily_attendance')
          .select('id, child_id, arrival_time')
          .eq('attendance_date', today)
          .not('arrival_time', 'is', null), // Uniquement les enfants avec une heure d'arrivée
      ]);

      const children = childrenRes.data || [];
      const attendance = attendanceRes.data || [];

      const activeChildren = children.filter((c) => c.status === 'active');
      const activeChildIds = new Set(activeChildren.map((c) => c.id));
      const attendanceForActive = attendance.filter((a) => activeChildIds.has(a.child_id));

      // Stats basées uniquement sur les enfants actifs
      const totalActiveChildren = activeChildren.length;
      const presentToday = attendanceForActive.length;
      const attendanceRate =
        totalActiveChildren > 0
          ? Math.round((presentToday / totalActiveChildren) * 100)
          : 0;
      const incidentsToday = 0; // No incidents table available

      // Calculate birthdays this month
      const currentMonth = new Date().getMonth();
      const birthdayChildrenThisMonth = activeChildren.filter((child) => {
        if (!child.birth_date) return false;
        const birthDate = new Date(child.birth_date);
        return birthDate.getMonth() === currentMonth;
      });
      
      const birthdaysThisMonth = birthdayChildrenThisMonth.length;

      // Sort birthday children by day of month
      const sortedBirthdayChildren = birthdayChildrenThisMonth.sort((a, b) => {
        const dayA = new Date(a.birth_date).getDate();
        const dayB = new Date(b.birth_date).getDate();
        return dayA - dayB;
      });

      setBirthdayChildren(sortedBirthdayChildren);

      setStats({
        totalActiveChildren,
        presentToday,
        attendanceRate,
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
        const sectionChildren = activeChildren.filter((c) => c.section === key);
        const sectionAttendance = attendanceForActive.filter((a) =>
          sectionChildren.some((c) => c.id === a.child_id)
        );

        return {
          section: label,
          actifs: sectionChildren.length,
          presents: sectionAttendance.length,
        };
      });

      setSectionData(sectionStats);

      // Generate hourly attendance data
      const hourlyData = [];
      for (let hour = 8; hour <= 17; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const hourAttendance = attendanceForActive.filter((a) => {
          const arrivalHour = new Date(a.arrival_time).getHours();
          return arrivalHour <= hour;
        }).length;
        
        hourlyData.push({
          time: timeStr,
          presents: hourAttendance
        });
      }
      setAttendanceData(hourlyData);

      // Generate real alerts
      const realAlerts: Alert[] = [];
      
      // Check for medical alerts
      const childrenWithAllergies = activeChildren.filter((c) => c.allergies);
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
        if (section.actifs > 0 && section.presents > section.actifs * 0.9) {
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

  const sectionChartData = useMemo(
    () => sectionData.filter((s) => s.actifs > 0),
    [sectionData]
  );

  const totalActiveBySection = useMemo(
    () => sectionChartData.reduce((sum, s) => sum + s.actifs, 0),
    [sectionChartData]
  );

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardStatsCard
          title="Enfants Présents"
          value={stats.presentToday}
          subtitle={`sur ${stats.totalActiveChildren} actifs`}
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
            <CardDescription>Répartition des enfants actifs par section</CardDescription>
          </CardHeader>
          <CardContent>
            {sectionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={sectionChartData}
                    dataKey="actifs"
                    nameKey="section"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={95}
                    paddingAngle={2}
                    label={({ percent }) =>
                      percent >= 0.08 ? `${Math.round(percent * 100)}%` : ''
                    }
                  >
                    {sectionChartData.map((entry, index) => (
                      <Cell
                        key={entry.section}
                        fill={
                          SECTION_COLORS[entry.section] ??
                          SECTION_CHART_FALLBACK_COLORS[index % SECTION_CHART_FALLBACK_COLORS.length]
                        }
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name, item) => {
                      const pct =
                        totalActiveBySection > 0
                          ? Math.round((value / totalActiveBySection) * 100)
                          : 0;
                      return [`${value} actif${value > 1 ? 's' : ''} (${pct}%)`, item.payload.section];
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Aucun enfant actif réparti par section
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
                      <Badge variant="outline">{Math.ceil(section.presents / 8) || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Enfants:</span>
                      <Badge variant="secondary">{section.presents}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Ratio:</span>
                      <Badge variant={section.presents > 0 && section.presents / Math.ceil(section.presents / 8) > 8 ? "destructive" : "default"}>
                        1:{section.presents > 0 ? Math.round(section.presents / Math.ceil(section.presents / 8)) : 0}
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