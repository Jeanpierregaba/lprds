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
  Shield
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Données fictives pour la démonstration
const sectionData = [
  { section: 'Crèche', effectif: 12, capacite: 15 },
  { section: 'Garderie', effectif: 18, capacite: 20 },
  { section: 'Maternelle Étoile', effectif: 22, capacite: 25 },
  { section: 'Maternelle Soleil', effectif: 20, capacite: 25 }
];

const attendanceData = [
  { time: '08:00', presents: 15 },
  { time: '09:00', presents: 45 },
  { time: '10:00', presents: 62 },
  { time: '11:00', presents: 68 },
  { time: '12:00', presents: 72 },
  { time: '13:00', presents: 70 },
  { time: '14:00', presents: 65 },
  { time: '15:00', presents: 55 },
  { time: '16:00', presents: 40 },
  { time: '17:00', presents: 25 }
];

const inscriptionTrend = [
  { mois: 'Jan', inscriptions: 65 },
  { mois: 'Fév', inscriptions: 68 },
  { mois: 'Mar', inscriptions: 70 },
  { mois: 'Avr', inscriptions: 72 },
  { mois: 'Mai', inscriptions: 75 },
  { mois: 'Juin', inscriptions: 72 }
];

const ratioData = [
  { name: 'Conforme', value: 85, color: '#22c55e' },
  { name: 'Attention', value: 15, color: '#f59e0b' }
];

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export const AdminDashboard = () => {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const alerts = [
    { id: 1, type: 'medical', message: 'Médicament à administrer à Emma (14h30)', severity: 'high' },
    { id: 2, type: 'absence', message: '3 absences non signalées ce matin', severity: 'medium' },
    { id: 3, type: 'ratio', message: 'Ratio d\'encadrement limite en section Garderie', severity: 'medium' }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enfants Présents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">68</div>
            <p className="text-xs text-muted-foreground">sur 85 inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">80%</div>
            <p className="text-xs text-muted-foreground">+2% vs hier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personnel Présent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">12</div>
            <p className="text-xs text-muted-foreground">sur 14 prévus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents du Jour</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">2</div>
            <p className="text-xs text-muted-foreground">à traiter</p>
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
          </CardContent>
        </Card>

        {/* Présences en temps réel */}
        <Card>
          <CardHeader>
            <CardTitle>Présences en Temps Réel</CardTitle>
            <CardDescription>Évolution des présences aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="presents" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ratios d'encadrement */}
        <Card>
          <CardHeader>
            <CardTitle>Ratios d'Encadrement</CardTitle>
            <CardDescription>Conformité réglementaire</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ratioData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ratioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution des inscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Inscriptions</CardTitle>
            <CardDescription>Tendance sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inscriptionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="inscriptions" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
            {sectionData.map((section, index) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};