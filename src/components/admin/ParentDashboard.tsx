import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Baby, Calendar, MessageSquare, LogOut, Camera, Heart, Clock, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DailyReportsViewer from '@/components/parent/DailyReportsViewer';
import { ParentMessaging } from '@/components/parent/ParentMessaging';

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
      
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('date', today)
        .in('child_id', childrenIds);
      
      // Get unread messages for this parent
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', profile?.id)
        .eq('is_read', false);
      
      // Get recent activities for children
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .in('child_id', childrenIds)
        .gte('activity_date', weekAgo.toISOString().split('T')[0]);

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
              Espace Parent
            </h1>
            <p className="text-muted-foreground">
              Bonjour {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="capitalize">
              Parent
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
              <div className="text-2xl font-bold">{stats.myChildren}</div>
              <p className="text-xs text-muted-foreground">
                Inscrits à la crèche
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
              <p className="text-xs text-muted-foreground">
                Cette semaine
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

        {/* Children Cards */}
        {children.length > 0 && (
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
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="attendance">Présences</TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Rapports
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="profile">Mon Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                    <div className="flex items-center space-x-3">
                      <Camera className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Activité peinture</p>
                        <p className="text-xs text-muted-foreground">Emma - Il y a 2 heures</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Heart className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Temps de repos</p>
                        <p className="text-xs text-muted-foreground">Lucas - Il y a 3 heures</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Sortie au parc</p>
                        <p className="text-xs text-muted-foreground">Groupe - Hier</p>
                      </div>
                    </div>
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
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        📅 Sortie pédagogique prévue
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        Vendredi prochain au musée des enfants
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        🎉 Fête de fin d'année
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        Le 20 décembre à partir de 16h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
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
          </TabsContent>

          <TabsContent value="reports">
            <DailyReportsViewer />
          </TabsContent>

          <TabsContent value="messages">
            <ParentMessaging />
          </TabsContent>

          <TabsContent value="profile">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ParentDashboard;