import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Baby, Calendar, MessageSquare, LogOut, Camera, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ParentSidebar from './ParentSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import dashboardBg from '@/assets/dashboard-bg.png';
import { StatsCard } from '@/components/parent/StatsCard';
import { ChildCard } from '@/components/parent/ChildCard';
import { ChildDetailsDialog } from '@/components/parent/ChildDetailsDialog';

// Lazy load des composants lourds
const DailyReportsViewer = lazy(() => import('@/components/parent/DailyReportsViewer'));
const ParentMessagesPage = lazy(() => import('@/pages/parent/MessagesPage'));
const ParentAttendancePage = lazy(() => import('@/pages/parent/ParentAttendancePage'));
const RecentActivitiesAndAnnouncements = lazy(() => import('@/components/parent/RecentActivitiesAndAnnouncements'));

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
  admission_date?: string;
  medical_info?: string;
  allergies?: string;
  special_needs?: string;
  section?: string;
  photo_url?: string;
}

const SECTION_LABELS: Record<string, string> = {
  'creche_etoile': 'Crèche Étoile',
  'creche_nuage': 'Crèche Nuage',
  'creche_soleil': 'Crèche Soleil TPS',
  'garderie': 'Garderie',
  'maternelle_PS1': 'Maternelle PS1',
  'maternelle_PS2': 'Maternelle PS2',
  'maternelle_MS': 'Maternelle MS',
  'maternelle_GS': 'Maternelle GS'
};

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
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mémorisation des fonctions utilitaires
  const calculateAge = useCallback((birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }, []);

  const getSectionLabel = useCallback((section?: string): string => {
    if (!section) return 'Non définie';
    return SECTION_LABELS[section] || section;
  }, []);

  const handleViewChildDetails = useCallback((child: Child) => {
    setSelectedChild(child);
    setIsDialogOpen(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès."
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut, toast]);

  // Optimisation du chargement des données avec Promise.all
  const fetchParentData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Récupération des enfants d'abord
      const { data: parentChildren, error: childrenError } = await supabase
        .from('parent_children')
        .select(`
          child_id,
          children (
            id,
            first_name,
            last_name,
            birth_date,
            status,
            admission_date,
            medical_info,
            allergies,
            special_needs,
            section,
            photo_url
          )
        `)
        .eq('parent_id', profile.id);

      if (childrenError) throw childrenError;

      const childrenData = parentChildren?.map(pc => pc.children).flat().filter(Boolean) || [];
      setChildren(childrenData as Child[]);

      const childrenIds = childrenData.map(c => c.id);

      // Exécution parallèle des requêtes pour les stats
      const [attendanceRes, messagesRes, activitiesRes] = await Promise.all([
        childrenIds.length > 0
          ? supabase
              .from('daily_attendance')
              .select('id')
              .eq('attendance_date', today)
              .in('child_id', childrenIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from('messages')
          .select('id')
          .eq('recipient_id', profile.id)
          .eq('is_read', false),
        childrenIds.length > 0
          ? supabase
              .from('activities')
              .select('id')
              .in('child_id', childrenIds)
              .gte('activity_date', weekAgo.toISOString().split('T')[0])
          : Promise.resolve({ data: [] })
      ]);

      const myChildren = childrenData.filter(c => c.status === 'active').length;
      const todayPresent = attendanceRes.data?.length || 0;
      const unreadMessages = messagesRes.data?.length || 0;
      const newActivities = activitiesRes.data?.length || 0;

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
  }, [profile?.id, toast]);

  useEffect(() => {
    fetchParentData();
  }, [fetchParentData]);

  // Mémorisation des enfants actifs
  const activeChildren = useMemo(() => 
    children.filter(child => child.status === 'active'),
    [children]
  );

  return (
    <SidebarProvider>
      <div
        className="min-h-screen w-full relative"
        style={{
          backgroundImage: `url(${dashboardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="flex w-full min-h-screen h-full p-0">
          <ParentSidebar activeView={activeView} setActiveView={setActiveView} />

          <div className="flex-1 flex flex-col min-w-0">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                <span className="font-semibold truncate">Espace Parent</span>
                <span className="text-muted-foreground hidden sm:inline">Parent</span>
              </div>
              <Button variant="ghost" onClick={handleSignOut} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </header>

            <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 space-y-6 overflow-y-auto">
              {/* Vue d'ensemble */}
              {activeView === 'overview' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatsCard
                      title="Mes Enfants"
                      value={stats.myChildren}
                      description="Inscrits à la crèche"
                      icon={Baby}
                      titleColor="text-sm"
                      loading={loading}
                    />
                    <StatsCard
                      title="Présents Aujourd'hui"
                      value={stats.todayPresent}
                      description={`Sur ${stats.myChildren} enfants`}
                      icon={Clock}
                      titleColor="text-green-600 text-sm"
                      iconColor="text-green-600"
                      loading={loading}
                    />
                    <StatsCard
                      title="Nouvelles Activités"
                      value={stats.newActivities}
                      description="Cette semaine"
                      icon={Camera}
                      titleColor="text-blue-600 text-sm"
                      iconColor="text-blue-600"
                      loading={loading}
                    />
                    <StatsCard
                      title="Messages"
                      value={stats.unreadMessages}
                      description="Non lus"
                      icon={MessageSquare}
                      titleColor="text-red-600 text-sm"
                      iconColor="text-red-600"
                      loading={loading}
                    />
                  </div>
                  
                  <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
                    <RecentActivitiesAndAnnouncements />
                  </Suspense>
                </>
              )}

              {/* Mes Enfants */}
              {activeView === 'children' && (
                <div className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-primary">Mes Enfants</h2>
                  {activeChildren.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {activeChildren.map((child) => (
                        <ChildCard
                          key={child.id}
                          child={child}
                          onViewDetails={handleViewChildDetails}
                          calculateAge={calculateAge}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {loading ? 'Chargement...' : 'Aucun enfant trouvé'}
                    </p>
                  )}
                </div>
              )}

              {/* Présences */}
              {activeView === 'attendance' && (
                <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
                  <ParentAttendancePage />
                </Suspense>
              )}

              {/* Rapports */}
              {activeView === 'reports' && (
                <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
                  <DailyReportsViewer />
                </Suspense>
              )}

              {/* Messages */}
              {activeView === 'messages' && (
                <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
                  <ParentMessagesPage />
                </Suspense>
              )}
            </main>
          </div>
        </div>

        {/* Dialog des détails de l'enfant */}
        <ChildDetailsDialog
          child={selectedChild}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          calculateAge={calculateAge}
          getSectionLabel={getSectionLabel}
        />
      </div>
    </SidebarProvider>
  );
};

export default ParentDashboard;
