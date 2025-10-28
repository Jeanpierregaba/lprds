import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Baby, 
  Clock, 
  MessageSquare, 
  Calendar,
  Camera,
  Heart,
  AlertCircle,
  CheckCircle,
  Users,
  Activity,
  FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DailyReportsViewer from '@/components/parent/DailyReportsViewer';
import { ParentMessaging } from '@/components/parent/ParentMessaging';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  status: string;
  photo_url?: string;
  allergies?: string;
}

interface ParentStats {
  myChildren: number;
  todayPresent: number;
  newActivities: number;
  unreadMessages: number;
}

export const ParentDashboard = () => {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [stats, setStats] = useState<ParentStats>({
    myChildren: 0,
    todayPresent: 0,
    newActivities: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchParentData();
    }
  }, [profile]);

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
            status,
            photo_url,
            allergies
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

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Espace Parents</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Famille {profile?.last_name}
          </Badge>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">
            <Activity className="mr-2 h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            Rapports Journaliers
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Résumé du jour */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enfants Présents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.todayPresent}/{stats.myChildren}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todayPresent > 0 ? 'À la crèche' : 'Aucun enfant présent'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Non Lus</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.unreadMessages}
            </div>
            <p className="text-xs text-muted-foreground">
              nouveaux messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles Activités</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.newActivities}
            </div>
            <p className="text-xs text-muted-foreground">
              cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mes enfants - Résumé journalier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" />
            Mes Enfants - Résumé du Jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {children.length > 0 ? (
              children.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={child.photo_url || undefined} />
                      <AvatarFallback>
                        {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{child.first_name} {child.last_name}</h3>
                        <Badge variant="outline" className="text-xs">{calculateAge(child.birth_date)} ans</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {child.status === 'active' ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Actif</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span>Inactif</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    {child.allergies && (
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          Allergies: {child.allergies}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun enfant inscrit
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages de l'équipe */}
        <RecentMessages />
        
        {/* Dernières photos partagées */}
        <RecentPhotos />
      </div>

      {/* Planning de présence à venir */}
      <WeeklySchedule />
        </TabsContent>

        <TabsContent value="reports">
          <DailyReportsViewer />
        </TabsContent>

        <TabsContent value="messages">
          <ParentMessaging />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component for recent messages with real data
function RecentMessages() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchRecentMessages();
    }
  }, [profile]);

  const fetchRecentMessages = async () => {
    try {
      setLoading(true);
      
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          content,
          created_at,
          is_read,
          urgent,
          sender:profiles!messages_sender_id_fkey(first_name, last_name, role)
        `)
        .eq('recipient_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages de l'Équipe
          </CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages de l'Équipe
        </CardTitle>
        <CardDescription>Communications récentes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className={`p-3 border rounded-lg ${!message.is_read ? 'bg-blue-50 border-blue-200' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.sender?.first_name} {message.sender?.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {message.urgent && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                      {!message.is_read && (
                        <Badge variant="default" className="text-xs">Non lu</Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                    <p className="text-sm text-muted-foreground">
                      {message.content?.substring(0, 100)}...
                    </p>
                  </div>
                </div>
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
  );
}

// Component for recent photos with real data
function RecentPhotos() {
  const { profile } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchRecentPhotos();
    }
  }, [profile]);

  const fetchRecentPhotos = async () => {
    try {
      setLoading(true);
      
      // Get parent's children IDs
      const { data: parentChildren } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', profile?.id);
      
      const childrenIds = parentChildren?.map(pc => pc.child_id) || [];

      if (childrenIds.length === 0) {
        setPhotos([]);
        return;
      }

      const { data: photosData } = await supabase
        .from('activities')
        .select(`
          id,
          activity_name,
          activity_date,
          photo_url,
          children(first_name, last_name)
        `)
        .in('child_id', childrenIds)
        .not('photo_url', 'is', null)
        .order('activity_date', { ascending: false })
        .limit(5);

      setPhotos(photosData || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Dernières Photos
          </CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Dernières Photos
        </CardTitle>
        <CardDescription>Moments partagés par l'équipe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {photos.length > 0 ? (
            photos.map((photo) => (
              <div key={photo.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{photo.activity_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.activity_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    {photo.children?.first_name} {photo.children?.last_name}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune photo récente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for weekly schedule with real data
function WeeklySchedule() {
  const { profile } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchWeeklySchedule();
    }
  }, [profile]);

  const fetchWeeklySchedule = async () => {
    try {
      setLoading(true);
      
      // Get parent's children IDs
      const { data: parentChildren } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', profile?.id);
      
      const childrenIds = parentChildren?.map(pc => pc.child_id) || [];

      if (childrenIds.length === 0) {
        setSchedule([]);
        return;
      }

      // Get this week's attendance
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          date,
          children(first_name, last_name)
        `)
        .in('child_id', childrenIds)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);

      // Group by day
      const scheduleMap = new Map();
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
      
      for (let i = 0; i < 5; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        scheduleMap.set(i, {
          day: days[i],
          date: date.getDate().toString(),
          children: []
        });
      }

      attendanceData?.forEach(att => {
        const dayIndex = new Date(att.date).getDay() - 1;
        if (dayIndex >= 0 && dayIndex < 5) {
          const daySchedule = scheduleMap.get(dayIndex);
          if (daySchedule && att.children) {
            daySchedule.children.push(`${att.children.first_name} ${att.children.last_name}`);
          }
        }
      });

      setSchedule(Array.from(scheduleMap.values()));
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning de Présence - Cette Semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Planning de Présence - Cette Semaine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {schedule.map((day, index) => (
            <div key={index} className="text-center p-3 border rounded-lg">
              <div className="font-medium text-sm mb-2">{day.day}</div>
              <div className="text-lg font-bold text-primary mb-2">{day.date}</div>
              <div className="space-y-1">
                {day.children.map((child: string, childIndex: number) => (
                  <Badge key={childIndex} variant="secondary" className="text-xs block">
                    {child}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}