import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MessageSquare, Megaphone, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ChatInterface } from '@/components/messaging/ChatInterface'
import { ConversationsList } from '@/components/messaging/ConversationsList'
import { BroadcastMessages } from '@/components/messaging/BroadcastMessages'

interface Parent {
  id: string
  first_name: string
  last_name: string
  role: string
}

const MessagesPage = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [selectedUserRole, setSelectedUserRole] = useState<string>('')
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>()
  const [parents, setParents] = useState<Parent[]>([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatParentId, setNewChatParentId] = useState('')
  const { profile } = useAuth()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'secretary'

  useEffect(() => {
    if (isAdmin) {
      loadParents()
    }
  }, [profile])

  const loadParents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('role', 'parent')
        .eq('is_active', true)
        .order('last_name')

      if (error) throw error
      setParents(data || [])
    } catch (error) {
      console.error('Error loading parents:', error)
    }
  }

  const handleSelectConversation = (userId: string, userName: string, userRole: string, childId?: string) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setSelectedUserRole(userRole)
    setSelectedChildId(childId)
  }

  const handleStartNewChat = () => {
    const parent = parents.find(p => p.id === newChatParentId)
    if (parent) {
      handleSelectConversation(
        parent.id,
        `${parent.first_name} ${parent.last_name}`,
        parent.role
      )
      setShowNewChat(false)
      setNewChatParentId('')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Centre de Messages</h2>
          <p className="text-muted-foreground">
            Communication avec les parents et l'équipe
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
            <DialogTrigger asChild>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Nouvelle conversation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Démarrer une conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sélectionner un parent</Label>
                  <Select value={newChatParentId} onValueChange={setNewChatParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un parent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map(parent => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.first_name} {parent.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewChat(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleStartNewChat} disabled={!newChatParentId}>
                    Démarrer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversations">
            <MessageSquare className="mr-2 h-4 w-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Megaphone className="mr-2 h-4 w-4" />
            Diffusions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
            {/* Conversations list */}
            <Card className="lg:col-span-1">
              <ConversationsList 
                onSelectConversation={handleSelectConversation}
                selectedUserId={selectedUserId}
              />
            </Card>

            {/* Chat interface */}
            <Card className="lg:col-span-2">
              {selectedUserId ? (
                <ChatInterface
                  recipientId={selectedUserId}
                  recipientName={selectedUserName}
                  recipientRole={selectedUserRole}
                  childId={selectedChildId}
                  onNewMessage={() => {}}
                />
              ) : (
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Sélectionnez une conversation pour commencer
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcast" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <BroadcastMessages />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MessagesPage