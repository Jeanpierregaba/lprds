import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Baby, Calendar, MessageSquare, LogOut, Camera, Heart, Clock, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DailyReportsViewer from '@/components/parent/DailyReportsViewer';
import { ParentMessaging } from '@/components/parent/ParentMessaging';
import ParentSidebar from './ParentSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'; // <-- ajouté SidebarTrigger
import dashboardBg from '@/assets/dashboard-bg.png';

interface ParentStats {
  myChildren: number;
  todayPresent: number;
  newActivities: number;
  unreadMessages: number;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  status: string;
}

const ParentDashboard = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ParentStats>({
    myChildren: 0,
    todayPresent: 0,
    newActivities: 0,
    unreadMessages: 0
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<string>('overview');
  // SUPPRESSION DE activeView ET SIDEBAR

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      
      // Get parent's children
      const { data: parentChildren } = await supabase
        .from('parent_children')
        .select(`
          child_id,
          children (
            id,
            first_name,
            last_name,
            birth_date,
            status
          )
        `)
        .eq('parent_id', profile?.id);
      
      const childrenData = parentChildren?.map(pc => pc.children).flat().filter(Boolean) || [];
      setChildren(childrenData as Child[]);
      
      // Get today's attendance for children
      const today = new Date().toISOString().split('T')[0];
      const childrenIds = childrenData.map(c => c.id);
      let attendance = [];
      if (childrenIds.length > 0) {
        const { data } = await supabase
          .from('attendance')
          .select('id')
          .eq('date', today)
          .in('child_id', childrenIds);
        attendance = data || [];
      }
      
      // Get unread messages for this parent
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', profile?.id)
        .eq('is_read', false);
      
      // Get recent activities for children
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      let activities = [];
      if (childrenIds.length > 0) {
        const { data } = await supabase
          .from('activities')
          .select('id')
          .in('child_id', childrenIds)
          .gte('activity_date', weekAgo.toISOString().split('T')[0]);
        activities = data || [];
      }

      const myChildren = childrenData.filter(c => c.status === 'active').length;
      const todayPresent = attendance?.length || 0;
      const unreadMessages = messages?.length || 0;
      const newActivities = activities?.length || 0;

      setStats({
        myChildren,
        todayPresent,
        newActivities,
        unreadMessages
      });
    } catch (error) {
      console.error('Error fetching parent data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les informations."
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès."
      });
      // Force la navigation après déconnexion pour rafraîchir le contexte
      window.location.href = '/';
    }
  };

  return (
    <SidebarProvider>
      <div
        className="min-h-screen w-full relative"
        style={{
          backgroundImage: `url(${dashboardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed', // <-- background immobile fixe

        }}
      >
        {/* Plus de header ici */}
        <div className="flex w-full min-h-screen h-full p-0">
          <ParentSidebar activeView={activeView} setActiveView={setActiveView} />

          {/* Main content area with header that contains the SidebarTrigger (for mobile) */}
          <div className="flex-1 flex flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Espace Parent</span>
                <span className="text-muted-foreground">Parent</span>
              </div>
              <div className="ml-auto">
                <Button variant="ghost" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </div>
            </header>

            <main className="flex-1 px-6 py-8 space-y-6 overflow-y-auto max-h-screen">
              {/* Vue d'ensemble : KPI Cards + Activities/Announcements */}
              {activeView === 'overview' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mes Enfants</CardTitle>
                        <Baby className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.myChildren}</div>
                        <p className="text-xs text-muted-foreground">Inscrits à la crèche</p>
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
                          Sur {stats.myChildren} enfants
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nouvelles Activités</CardTitle>
                        <Camera className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.newActivities}</div>
                        <p className="text-xs text-muted-foreground">Cette semaine</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.unreadMessages}</div>
                        <p className="text-xs text-muted-foreground">Non lus</p>
                      </CardContent>
                    </Card>
                  </div>
                  <RecentActivitiesAndAnnouncements />
                </>
              )}
              {/* Les autres vues n'affichent plus les KPI */}
              {activeView === 'children' && (
                children.length > 0 ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Mes Enfants</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {children.map((child) => (
                          <Card key={child.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Baby className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">
                                    {child.first_name} {child.last_name}
                                  </CardTitle>
                                  <CardDescription>
                                    {calculateAge(child.birth_date)} ans
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                                  {child.status === 'active' ? 'Actif' : 'Inactif'}
                                </Badge>
                                <Button variant="outline" size="sm">
                                  Voir détails
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun enfant trouvé</p>
                )
              )}
              {activeView === 'attendance' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des Présences</CardTitle>
                    <CardDescription>
                      Suivi des arrivées et départs de vos enfants
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Interface de suivi des présences en développement...
                    </p>
                  </CardContent>
                </Card>
              )}
              {activeView === 'reports' && (
                <DailyReportsViewer />
              )}
              {activeView === 'messages' && (
                <ParentMessaging />
              )}
              {activeView === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mon Profil</CardTitle>
                    <CardDescription>
                      Informations personnelles et contacts d'urgence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Prénom</p>
                          <p className="text-sm text-muted-foreground">{profile?.first_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Nom</p>
                          <p className="text-sm text-muted-foreground">{profile?.last_name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Téléphone</p>
                        <p className="text-sm text-muted-foreground">{profile?.phone || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Adresse</p>
                        <p className="text-sm text-muted-foreground">{profile?.address || 'Non renseignée'}</p>
                      </div>
                      <Button variant="outline">
                        <User className="w-4 h-4 mr-2" />
                        Modifier mes informations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Component for recent activities and announcements with real data
function RecentActivitiesAndAnnouncements() {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivitiesAndAnnouncements();
  }, [profile]);

  const fetchActivitiesAndAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Get parent's children IDs
      const { data: parentChildren } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', profile?.id);
      
      const childrenIds = parentChildren?.map(pc => pc.child_id) || [];

      if (childrenIds.length === 0) {
        setActivities([]);
        setAnnouncements([]);
        return;
      }

      // Fetch recent activities for children
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      // @ts-ignore – simplification des types pour requêtes composées
      let activitiesRes: any = { data: [] };
      if (childrenIds.length > 0) {
        activitiesRes = await (supabase as any)
          .from('activities')
          .select(`
            id,
            activity_name,
            activity_date,
            description,
            children(first_name, last_name)
          `)
          .in('child_id', childrenIds as any)
          .gte('activity_date', weekAgo.toISOString().split('T')[0])
          .order('activity_date', { ascending: false })
          .limit(5);
      }

      // Fetch announcements/messages from staff
      // @ts-ignore – simplification des types pour requêtes composées
      const announcementsRes: any = await (supabase as any)
        .from('messages')
        .select(`
          id,
          subject,
          content,
          created_at,
          sender:profiles!messages_sender_id_fkey(first_name, last_name, role)
        `)
        .eq('recipient_id', profile?.id as any)
        .in('sender_role', ['admin', 'educator', 'secretary'] as any)
        .order('created_at', { ascending: false })
        .limit(3);

      setActivities(activitiesRes?.data || []);
      setAnnouncements(announcementsRes?.data || []);

    } catch (error) {
      console.error('Error fetching activities and announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dernières Activités</CardTitle>
            <CardDescription>Chargement...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
          <CardTitle>Dernières Activités</CardTitle>
          <CardDescription>
            Les activités récentes de vos enfants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <Camera className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{activity.activity_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.children?.first_name} {activity.children?.last_name} - 
                      {new Date(activity.activity_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations Importantes</CardTitle>
          <CardDescription>
            Messages et annonces de l'équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {announcement.subject}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    {announcement.sender?.first_name} {announcement.sender?.last_name} - 
                    {new Date(announcement.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucun message récent</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ParentDashboard;