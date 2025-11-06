import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  activity_date: string;
  description?: string;
  children?: {
    first_name: string;
    last_name: string;
  };
}

interface Announcement {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

const RecentActivitiesAndAnnouncements = () => {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchActivitiesAndAnnouncements();
    }
  }, [profile?.id]);

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
        setLoading(false);
        return;
      }

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Exécution parallèle des requêtes
      const [activitiesRes, announcementsRes] = await Promise.all([
        supabase
          .from('activities')
          .select(`
            id,
            title,
            activity_date,
            description,
            children(first_name, last_name)
          `)
          .in('child_id', childrenIds)
          .gte('activity_date', weekAgo.toISOString().split('T')[0])
          .order('activity_date', { ascending: false })
          .limit(5),
        supabase
          .from('messages')
          .select(`
            id,
            subject,
            content,
            created_at,
            sender:profiles!messages_sender_id_fkey(first_name, last_name, role)
          `)
          .eq('recipient_id', profile?.id)
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      setActivities(activitiesRes.data || []);
      setAnnouncements(announcementsRes.data || []);
    } catch (error) {
      console.error('Error fetching activities and announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dernières Activités</CardTitle>
            <CardDescription>Chargement...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
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
              {[1, 2].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Camera className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.children?.first_name} {activity.children?.last_name} - 
                      {' '}{new Date(activity.activity_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune activité récente
              </p>
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
                <div 
                  key={announcement.id} 
                  className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 line-clamp-2">
                    {announcement.subject}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {announcement.sender?.first_name} {announcement.sender?.last_name} - 
                    {' '}{new Date(announcement.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun message récent
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentActivitiesAndAnnouncements;
