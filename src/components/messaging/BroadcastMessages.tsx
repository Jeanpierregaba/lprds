import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Megaphone, Send, Clock, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BroadcastMessage {
  id: string
  subject: string
  content: string
  created_at: string
  sender_id: string
  recipient_count: number
  sender?: {
    first_name: string
    last_name: string
    role: string
  }
}

export const BroadcastMessages = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([])
  const [showNewBroadcast, setShowNewBroadcast] = useState(false)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { profile } = useAuth()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'secretary'

  useEffect(() => {
    if (profile?.id) {
      loadBroadcasts()
    }
  }, [profile])

  const loadBroadcasts = async () => {
    try {
      setLoading(true)
      
      // Get all broadcast messages (messages sent by admin to multiple parents)
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          content,
          created_at,
          sender_id,
          sender:profiles!messages_sender_id_fkey (
            first_name,
            last_name,
            role
          )
        `)
        .in('sender_id', await getAdminIds())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group messages by subject and created_at to identify broadcasts
      const broadcastMap = new Map<string, BroadcastMessage>()
      
      messages?.forEach(msg => {
        const key = `${msg.subject}-${msg.created_at}`
        if (broadcastMap.has(key)) {
          const existing = broadcastMap.get(key)!
          existing.recipient_count++
        } else {
          broadcastMap.set(key, {
            ...msg,
            recipient_count: 1
          })
        }
      })

      // Filter to show only messages sent to multiple recipients
      const broadcastList = Array.from(broadcastMap.values())
        .filter(b => b.recipient_count > 1 || isAdmin)

      setBroadcasts(broadcastList)
    } catch (error) {
      console.error('Error loading broadcasts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAdminIds = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'secretary'])
    
    return data?.map(p => p.id) || []
  }

  const handleSendBroadcast = async () => {
    if (!subject || !content) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive'
      })
      return
    }

    try {
      setSending(true)
      
      // Get all parent profiles
      const { data: parents, error: parentsError } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name')
        .eq('role', 'parent')
        .eq('is_active', true)

      if (parentsError) throw parentsError

      if (!parents || parents.length === 0) {
        toast({
          title: 'Information',
          description: 'Aucun parent à qui envoyer le message',
          variant: 'default'
        })
        return
      }

      // Create message for each parent
      const messages = parents.map(parent => ({
        sender_id: profile!.id,
        recipient_id: parent.id,
        subject,
        content,
        is_read: false
      }))

      const { error: insertError } = await supabase
        .from('messages')
        .insert(messages)

      if (insertError) throw insertError

      // Send email notifications
      await supabase.functions.invoke('send-broadcast-notification', {
        body: {
          parent_ids: parents.map(p => p.id),
          subject,
          content,
          sender_name: `${profile!.first_name} ${profile!.last_name}`
        }
      })

      toast({
        title: 'Succès',
        description: `Message diffusé à ${parents.length} parent(s)`,
      })

      setSubject('')
      setContent('')
      setShowNewBroadcast(false)
      loadBroadcasts()
    } catch (error) {
      console.error('Error sending broadcast:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la diffusion',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="p-4">Chargement...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Messages de diffusion
          </h3>
          <p className="text-sm text-muted-foreground">
            Annonces et communications à tous les parents
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showNewBroadcast} onOpenChange={setShowNewBroadcast}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Nouvelle diffusion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nouveau message de diffusion</DialogTitle>
                <DialogDescription>
                  Ce message sera envoyé à tous les parents actifs
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sujet *</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Fermeture exceptionnelle, Événement à venir..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message *</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    rows={8}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewBroadcast(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSendBroadcast} disabled={sending}>
                    <Send className="mr-2 h-4 w-4" />
                    {sending ? 'Envoi...' : 'Envoyer à tous'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Broadcasts list */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {broadcasts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune diffusion</p>
              </CardContent>
            </Card>
          ) : (
            broadcasts.map((broadcast) => (
              <Card key={broadcast.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Megaphone className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {broadcast.subject}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {broadcast.recipient_count} parent{broadcast.recipient_count > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Par {broadcast.sender?.first_name} {broadcast.sender?.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(broadcast.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm">{broadcast.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
