import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Baby, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  UserCheck,
  UserX,
  Heart,
  Shield,
  Cake
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: string;
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch children stats
      const { data: children } = await supabase
        .from('children')
        .select('id, status, section, admission_date, first_name, last_name, allergies, birth_date');
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id, child_id, arrival_time')
        .eq('date', today);
      
      // Fetch staff stats
      const { data: staff } = await supabase
        .from('profiles')
        .select('id, role, is_active')
        .in('role', ['educator', 'admin', 'secretary']);
      
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
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Heart className="h-4 w-4" />;
      case 'absence': return <UserX className="h-4 w-4" />;
      case 'ratio': return <Users className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-80 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administration</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Direction Générale
          </Badge>
        </div>
      </div>

      {/* Alertes importantes */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertes Importantes ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <span className="text-sm">{alert.message}</span>
                </div>
                <Badge variant={getAlertVariant(alert.severity)}>
                  {alert.severity === 'high' ? 'Urgent' : 'Attention'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enfants Présents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">sur {stats.totalChildren} inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.attendanceRate >= 80 ? 'Excellent' : stats.attendanceRate >= 60 ? 'Correct' : 'À surveiller'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personnel Présent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.staffPresent}</div>
            <p className="text-xs text-muted-foreground">sur {stats.totalStaff} prévus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents du Jour</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.incidentsToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.incidentsToday === 0 ? 'Aucun incident' : 'à traiter'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anniversaires</CardTitle>
            <Cake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.birthdaysThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {stats.birthdaysThisMonth === 0 ? 'Aucun ce mois' : 'ce mois-ci'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et données */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      {birthdayChildren.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5" />
              Anniversaires du Mois - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <CardDescription>
              {birthdayChildren.length} enfant{birthdayChildren.length > 1 ? 's' : ''} fêtent leur anniversaire ce mois-ci
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {birthdayChildren.map((child) => {
                const birthDate = new Date(child.birth_date);
                const currentYear = new Date().getFullYear();
                const age = currentYear - birthDate.getFullYear();
                const dayOfMonth = birthDate.getDate();
                
                return (
                  <div key={child.id} className="p-4 border rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Cake className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {child.first_name} {child.last_name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {dayOfMonth} {new Date().toLocaleDateString('fr-FR', { month: 'long' })} - {age} ans
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {child.section ? child.section.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Non assigné'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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