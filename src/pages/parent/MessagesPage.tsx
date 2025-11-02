import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConversationsList } from '@/components/messaging/ConversationsList';
import { ChatInterface } from '@/components/messaging/ChatInterface';

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
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      loadAdmins();
      loadUnreadCount();
    }
  }, [profile]);

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('role', ['admin', 'secretary'])
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des administrateurs",
        variant: "destructive"
      });
    }
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

  const handleStartNewConversation = async () => {
    if (!selectedAdmin) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un destinataire",
        variant: "destructive"
      });
      return;
    }

    const admin = admins.find(a => a.id === selectedAdmin);
    if (admin) {
      setSelectedConversation({
        userId: admin.id,
        userName: `${admin.first_name} ${admin.last_name}`,
        userRole: admin.role
      });
    }
    
    setShowNewConversation(false);
    setSelectedAdmin('');
  };

  const handleConversationSelect = (userId: string, userName: string, userRole: string, childId?: string) => {
    setSelectedConversation({ userId, userName, userRole, childId });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Communiquez avec l'administration de la crèche
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="conversations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="conversations">
            <MessageSquare className="h-4 w-4 mr-2" />
            Conversations
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des conversations */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Vos conversations</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setShowNewConversation(!showNewConversation)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Cliquez sur une conversation pour l'ouvrir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showNewConversation && (
                    <div className="mb-4 p-4 border rounded-lg space-y-3">
                      <h4 className="font-semibold text-sm">Nouvelle conversation</h4>
                      <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un destinataire" />
                        </SelectTrigger>
                        <SelectContent>
                          {admins.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.first_name} {admin.last_name} ({admin.role === 'admin' ? 'Admin' : 'Secrétaire'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={handleStartNewConversation}
                        >
                          Démarrer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowNewConversation(false);
                            setSelectedAdmin('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                  <ConversationsList
                    onSelectConversation={handleConversationSelect}
                    selectedUserId={selectedConversation?.userId}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Interface de chat */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <ChatInterface
                  recipientId={selectedConversation.userId}
                  recipientName={selectedConversation.userName}
                  recipientRole={selectedConversation.userRole}
                  childId={selectedConversation.childId}
                  onNewMessage={() => loadUnreadCount()}
                />
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune conversation sélectionnée</h3>
                    <p className="text-muted-foreground mb-4">
                      Sélectionnez une conversation existante ou démarrez-en une nouvelle
                    </p>
                    <Button onClick={() => setShowNewConversation(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle conversation
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParentMessagesPage;
