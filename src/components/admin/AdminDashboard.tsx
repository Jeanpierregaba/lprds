import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Baby, Calendar, MessageSquare, Settings, LogOut, UserPlus, BookOpen, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChildrenManagement from './ChildrenManagement';

interface DashboardStats {
  totalChildren: number;
  activeChildren: number;
  totalEducators: number;
  totalParents: number;
  todayAttendance: number;
  unreadMessages: number;
}

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    activeChildren: 0,
    totalEducators: 0,
    totalParents: 0,
    todayAttendance: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch children stats
      const { data: children } = await supabase
        .from('children')
        .select('status');
      
      // Fetch user roles stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('date', today);
      
      // Fetch unread messages
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('is_read', false);

      const totalChildren = children?.length || 0;
      const activeChildren = children?.filter(c => c.status === 'active').length || 0;
      const totalEducators = profiles?.filter(p => p.role === 'educator').length || 0;
      const totalParents = profiles?.filter(p => p.role === 'parent').length || 0;
      const todayAttendance = attendance?.length || 0;
      const unreadMessages = messages?.length || 0;

      setStats({
        totalChildren,
        activeChildren,
        totalEducators,
        totalParents,
        todayAttendance,
        unreadMessages
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background border-b border-border/5 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Administration - {profile?.role === 'admin' ? 'Direction' : 'Secrétariat'}
            </h1>
            <p className="text-muted-foreground">
              Bonjour {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="capitalize">
              {profile?.role}
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
              <CardTitle className="text-sm font-medium">Enfants Inscrits</CardTitle>
              <Baby className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChildren}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeChildren} actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Équipe Éducative</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEducators}</div>
              <p className="text-xs text-muted-foreground">
                Éducateurs/trices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Présences Aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAttendance}</div>
              <p className="text-xs text-muted-foreground">
                Enfants présents
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="children">Enfants</TabsTrigger>
            <TabsTrigger value="staff">Personnel</TabsTrigger>
            <TabsTrigger value="attendance">Présences</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <RecentActivities />
          </TabsContent>

          <TabsContent value="children">
            <ChildrenManagement />
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Gestion du Personnel</CardTitle>
                <CardDescription>
                  Liste et gestion de l'équipe éducative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de gestion du personnel en développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Présences</CardTitle>
                <CardDescription>
                  Suivi et gestion des présences quotidiennes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de gestion des présences en développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Centre de Messages</CardTitle>
                <CardDescription>
                  Communication avec les parents et l'équipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de messagerie en développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
                <CardDescription>
                  Configuration de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de paramètres en développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Component for recent activities with real data
function RecentActivities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch recent children registrations
      const { data: recentChildren } = await supabase
        .from('children')
        .select('first_name, last_name, admission_date')
        .order('admission_date', { ascending: false })
        .limit(3);

      // Fetch recent messages
      const { data: recentMessages } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          created_at,
          sender:profiles!messages_sender_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select(`
          id,
          arrival_time,
          children(first_name, last_name)
        `)
        .eq('date', today)
        .order('arrival_time', { ascending: false })
        .limit(3);

      const activitiesList = [];

      // Add recent children
      if (recentChildren) {
        recentChildren.forEach(child => {
          activitiesList.push({
            id: `child-${child.admission_date}`,
            type: 'child',
            message: `Nouvel enfant inscrit: ${child.first_name} ${child.last_name}`,
            time: new Date(child.admission_date).toLocaleDateString('fr-FR'),
            color: 'green'
          });
        });
      }

      // Add recent messages
      if (recentMessages) {
        recentMessages.forEach(msg => {
          activitiesList.push({
            id: `msg-${msg.id}`,
            type: 'message',
            message: `Nouveau message: ${msg.subject}`,
            time: new Date(msg.created_at).toLocaleDateString('fr-FR'),
            color: 'blue'
          });
        });
      }

      // Add recent attendance
      if (recentAttendance) {
        recentAttendance.forEach(att => {
          if (att.children) {
            activitiesList.push({
              id: `att-${att.id}`,
              type: 'attendance',
              message: `Présence enregistrée pour ${att.children.first_name} ${att.children.last_name}`,
              time: att.arrival_time,
              color: 'orange'
            });
          }
        });
      }

      // Sort by time and limit to 6 items
      activitiesList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(activitiesList.slice(0, 6));

    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activités Récentes</CardTitle>
          <CardDescription>Chargement des dernières actions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>
            Accès rapide aux fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Inscrire un nouvel enfant
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Ajouter un membre du personnel
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Gérer le planning
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            Consulter les rapports
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activités Récentes</CardTitle>
          <CardDescription>
            Dernières actions sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full`}></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;