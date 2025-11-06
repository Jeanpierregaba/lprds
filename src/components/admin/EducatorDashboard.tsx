import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Baby, Calendar, MessageSquare, LogOut, Clock, Activity, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dashboardBg from '@/assets/dashboard-bg.png';

interface EducatorStats {
  assignedChildren: number;
  todayPresent: number;
  pendingActivities: number;
  unreadMessages: number;
}

const EducatorDashboard = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<EducatorStats>({
    assignedChildren: 0,
    todayPresent: 0,
    pendingActivities: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducatorStats();
  }, []);

  const fetchEducatorStats = async () => {
    try {
      setLoading(true);
      
      // Get educator's assigned children
      const { data: children } = await supabase
        .from('children')
        .select('id, status')
        .eq('assigned_educator_id', profile?.id);
      
      // Get today's attendance for assigned children
      const today = new Date().toISOString().split('T')[0];
      const childrenIds = children?.map(c => c.id) || [];
      
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('date', today)
        .in('child_id', childrenIds);
      
      // Get unread messages for this educator
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', profile?.id)
        .eq('is_read', false);

      const assignedChildren = children?.filter(c => c.status === 'active').length || 0;
      const todayPresent = attendance?.length || 0;
      const unreadMessages = messages?.length || 0;

      setStats({
        assignedChildren,
        todayPresent,
        pendingActivities: 0, // This would need additional logic
        unreadMessages
      });
    } catch (error) {
      console.error('Error fetching educator stats:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les statistiques."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès."
    });
  };

  return (
    <div className="min-h-screen relative">
      {/* Background image layer */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${dashboardBg})`,
        }}
      />
      {/* Header */}
      <header className="bg-background border-b border-border/5 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Espace Éducateur/trice
            </h1>
            <p className="text-muted-foreground">
              Bonjour {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="capitalize">
              Éducateur/trice
            </Badge>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Enfants</CardTitle>
              <Baby className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignedChildren}</div>
              <p className="text-xs text-muted-foreground">
                Enfants assignés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Présents Aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayPresent}</div>
              <p className="text-xs text-muted-foreground">
                Sur {stats.assignedChildren} enfants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activités</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingActivities}</div>
              <p className="text-xs text-muted-foreground">
                À planifier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadMessages}</div>
              <p className="text-xs text-muted-foreground">
                Non lus
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="children">Mes Enfants</TabsTrigger>
            <TabsTrigger value="attendance">Présences</TabsTrigger>
            <TabsTrigger value="activities">Activités</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <EducatorOverview />
          </TabsContent>

          <TabsContent value="children">
            <Card>
              <CardHeader>
                <CardTitle>Mes Enfants Assignés</CardTitle>
                <CardDescription>
                  Liste des enfants dont vous avez la charge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de gestion des enfants en développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Présences</CardTitle>
                <CardDescription>
                  Marquer les arrivées et départs de vos enfants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de gestion des présences en développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Activités et Observations</CardTitle>
                <CardDescription>
                  Documenter les activités et observations quotidiennes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de gestion des activités en développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>
                  Messages avec les parents et l'administration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de messagerie en développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Component for educator overview with real data
function EducatorOverview() {
  const { profile } = useAuth();
  const [assignedChildren, setAssignedChildren] = useState<any[]>([]);
  const [medicalAlerts, setMedicalAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchEducatorOverview();
    }
  }, [profile]);

  const fetchEducatorOverview = async () => {
    try {
      setLoading(true);
      
      // Get educator's assigned children with medical info
      const { data: children } = await supabase
        .from('children')
        .select(`
          id,
          first_name,
          last_name,
          allergies,
          medical_info,
          special_needs,
          status
        `)
        .eq('assigned_educator_id', profile?.id)
        .eq('status', 'active');

      setAssignedChildren(children || []);

      // Filter children with medical alerts
      const alerts = [];
      children?.forEach(child => {
        if (child.allergies) {
          alerts.push({
            id: `allergy-${child.id}`,
            type: 'allergy',
            childName: `${child.first_name} ${child.last_name}`,
            message: `Allergique à: ${child.allergies}`,
            severity: 'warning'
          });
        }
        if (child.medical_info) {
          alerts.push({
            id: `medical-${child.id}`,
            type: 'medical',
            childName: `${child.first_name} ${child.last_name}`,
            message: child.medical_info,
            severity: 'info'
          });
        }
        if (child.special_needs) {
          alerts.push({
            id: `special-${child.id}`,
            type: 'special',
            childName: `${child.first_name} ${child.last_name}`,
            message: child.special_needs,
            severity: 'info'
          });
        }
      });

      setMedicalAlerts(alerts);

    } catch (error) {
      console.error('Error fetching educator overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions du Jour</CardTitle>
            <CardDescription>Chargement...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informations Importantes</CardTitle>
            <CardDescription>Chargement...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Actions du Jour</CardTitle>
          <CardDescription>
            Tâches importantes à effectuer aujourd'hui
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Marquer les présences ({assignedChildren.length} enfants)
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Ajouter une activité
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contacter les parents
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Voir le planning
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations Importantes</CardTitle>
          <CardDescription>
            Alertes et informations médicales ({medicalAlerts.length} alertes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {medicalAlerts.length > 0 ? (
              medicalAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'warning' 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <p className={`text-sm font-medium ${
                    alert.severity === 'warning' 
                      ? 'text-yellow-800 dark:text-yellow-200' 
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    {alert.type === 'allergy' && '⚠️ Allergie alimentaire'} 
                    {alert.type === 'medical' && '📋 Information médicale'} 
                    {alert.type === 'special' && '🔍 Besoins spéciaux'} 
                    - {alert.childName}
                  </p>
                  <p className={`text-xs ${
                    alert.severity === 'warning' 
                      ? 'text-yellow-600 dark:text-yellow-300' 
                      : 'text-blue-600 dark:text-blue-300'
                  }`}>
                    {alert.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  ✅ Aucune alerte médicale
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  Tous vos enfants assignés n'ont pas d'alertes particulières
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EducatorDashboard;