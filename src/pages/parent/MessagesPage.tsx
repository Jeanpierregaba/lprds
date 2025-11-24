import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Megaphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatInterface } from '@/components/messaging/ChatInterface';
import { BroadcastMessages } from '@/components/messaging/BroadcastMessages';

interface AdminProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface SelectedConversation {
  userId: string;
  userName: string;
  userRole: string;
  childId?: string;
}

const ParentMessagesPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<SelectedConversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      initializeConversation();
      loadUnreadCount();
    }
  }, [profile]);

  const initializeConversation = async () => {
    if (!profile?.id) return;

    // Always initialize conversation with "Administration"
    // The ChatInterface will handle checking for admins when loading/sending messages
    // This avoids RLS issues where parents can't see admin profiles
    setSelectedConversation({
      userId: 'admin-group', // Special identifier for admin group
      userName: 'Administration',
      userRole: 'admin',
    });
  };

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', profile!.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex-1">
          <h1 className="text-primary text-2xl sm:text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-primary text-sm sm:text-base mt-1">
            Communiquez avec l'administration de la crèche
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-sm sm:text-lg px-3 py-1 self-start sm:self-auto">
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="broadcast" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="broadcast" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <Megaphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Cahier de liaison</span>
            <span className="xs:hidden">Cahier</span>
          </TabsTrigger>
          <TabsTrigger value="conversations" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Messagerie école-famille</span>
            <span className="xs:hidden">Messagerie</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast" className="mt-4 sm:mt-6">
          <Card className="h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)] md:h-[600px] flex flex-col">
            <CardContent className="flex-1 p-0 sm:p-4 md:p-6 overflow-hidden">
              <BroadcastMessages />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="mt-4 sm:mt-6">
          <div className="w-full">
            {selectedConversation ? (
              <div className="h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)] md:h-[600px]">
                <ChatInterface
                  recipientId={selectedConversation.userId}
                  recipientName={selectedConversation.userName}
                  recipientRole={selectedConversation.userRole}
                  childId={selectedConversation.childId}
                  isAdminGroup={selectedConversation.userId === 'admin-group'}
                  onNewMessage={() => loadUnreadCount()}
                />
              </div>
            ) : (
              <Card className="h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)] md:h-[600px] flex items-center justify-center">
                <CardContent className="text-center p-4 sm:p-6">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Messagerie école-famille</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Aucun compte administration n'est disponible pour la messagerie pour le moment.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParentMessagesPage;
