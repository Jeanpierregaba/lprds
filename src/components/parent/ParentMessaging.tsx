import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, Inbox, Archive, MessageSquare, User } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Message {
  id: string
  subject: string
  content: string
  created_at: string
  is_read: boolean
  sender_id: string
  recipient_id: string
  child_id?: string
  sender?: {
    first_name: string
    last_name: string
    role: string
  }
  recipient?: {
    first_name: string
    last_name: string
  }
  child?: {
    first_name: string
    last_name: string
  }
}

interface Child {
  id: string
  first_name: string
  last_name: string
}

export const ParentMessaging = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  // New message form state
  const [newSubject, setNewSubject] = useState('')
  const [newContent, setNewContent] = useState('')
  const [selectedChild, setSelectedChild] = useState<string>('')

  useEffect(() => {
    if (profile?.id) {
      loadChildren()
      loadMessages()
    }
  }, [profile])

  const loadChildren = async () => {
    try {
      const { data: parentChildren, error } = await supabase
        .from('parent_children')
        .select(`
          child_id,
          children (
            id,
            first_name,
            last_name
          )
        `)
        .eq('parent_id', profile!.id)

      if (error) throw error

      const childrenData = parentChildren?.map(pc => pc.children).filter(Boolean) as Child[]
      setChildren(childrenData || [])
    } catch (error) {
      console.error('Error loading children:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des enfants',
        variant: 'destructive'
      })
    }
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            first_name,
            last_name,
            role
          ),
          recipient:profiles!messages_recipient_id_fkey (
            first_name,
            last_name
          ),
          child:children (
            first_name,
            last_name
          )
        `)
        .or(`sender_id.eq.${profile!.id},recipient_id.eq.${profile!.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newSubject || !newContent) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      })
      return
    }

    try {
      // Get admin/secretary to send message to
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'secretary'])
        .limit(1)
        .single()

      if (adminError) throw adminError

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile!.id,
          recipient_id: adminProfile.id,
          subject: newSubject,
          content: newContent,
          child_id: selectedChild || null
        })

      if (error) throw error

      toast({
        title: 'Succès',
        description: 'Message envoyé avec succès'
      })

      setNewSubject('')
      setNewContent('')
      setSelectedChild('')
      setShowNewMessage(false)
      loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        variant: 'destructive'
      })
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) throw error
      loadMessages()
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const receivedMessages = messages.filter(m => m.recipient_id === profile?.id)
  const sentMessages = messages.filter(m => m.sender_id === profile?.id)
  const unreadCount = receivedMessages.filter(m => !m.is_read).length

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            Communiquez avec l'administration de la crèche
          </p>
        </div>
        <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Nouveau message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nouveau message</DialogTitle>
              <DialogDescription>
                Envoyez un message à l'administration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="child">Enfant concerné (optionnel)</Label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enfant (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun enfant spécifique</SelectItem>
                    {children.map(child => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Objet du message"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">
            <Inbox className="mr-2 h-4 w-4" />
            Messages reçus
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Archive className="mr-2 h-4 w-4" />
            Messages envoyés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedMessages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun message reçu</p>
              </CardContent>
            </Card>
          ) : (
            receivedMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  !message.is_read ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setSelectedMessage(message)
                  if (!message.is_read) {
                    handleMarkAsRead(message.id)
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {message.sender?.first_name?.[0]}
                          {message.sender?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {message.sender?.first_name} {message.sender?.last_name}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {message.sender?.role === 'admin' ? 'Administration' : 
                             message.sender?.role === 'secretary' ? 'Secrétaire' :
                             message.sender?.role === 'educator' ? 'Éducatrice' : 'Parent'}
                          </Badge>
                          {!message.is_read && (
                            <Badge variant="default" className="text-xs">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {message.subject}
                        </CardDescription>
                        {message.child && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {message.child.first_name} {message.child.last_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </CardHeader>
                {selectedMessage?.id === message.id && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentMessages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun message envoyé</p>
              </CardContent>
            </Card>
          ) : (
            sentMessages.map((message) => (
              <Card
                key={message.id}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => setSelectedMessage(message)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {message.recipient?.first_name?.[0]}
                          {message.recipient?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          À: {message.recipient?.first_name} {message.recipient?.last_name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {message.subject}
                        </CardDescription>
                        {message.child && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {message.child.first_name} {message.child.last_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </CardHeader>
                {selectedMessage?.id === message.id && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
