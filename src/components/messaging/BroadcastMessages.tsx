import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Megaphone, Send, Clock, Users, CheckCircle2, FileSignature } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MessageSignature {
  id: string
  parent_id: string
  signed_at: string
  parent?: {
    first_name: string
    last_name: string
  }
}

interface BroadcastMessage {
  id: string
  subject: string
  content: string
  created_at: string
  sender_id: string
  recipient_count: number
  is_signed?: boolean
  signature_count?: number
  messageIds?: string[] // For admin: all message IDs in this broadcast
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
  const [signing, setSigning] = useState<string | null>(null)
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null)
  const [signatures, setSignatures] = useState<MessageSignature[]>([])
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
      
      if (isAdmin) {
        // For admins: get all broadcast messages sent by admins
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

        // Group messages by subject and created_at (rounded to nearest second) to identify broadcasts
        const broadcastMap = new Map<string, { message: any, messageIds: string[] }>()
        
        messages?.forEach(msg => {
          // Round timestamp to nearest second for grouping
          const timestamp = new Date(msg.created_at)
          timestamp.setMilliseconds(0)
          const key = `${msg.subject}-${timestamp.toISOString()}`
          
          if (broadcastMap.has(key)) {
            const existing = broadcastMap.get(key)!
            existing.messageIds.push(msg.id)
          } else {
            broadcastMap.set(key, {
              message: msg,
              messageIds: [msg.id]
            })
          }
        })

        // Create broadcast list with signature counts
        const broadcastList: BroadcastMessage[] = []
        
        for (const [key, { message, messageIds }] of broadcastMap.entries()) {
          // Only show broadcasts sent to multiple recipients
          if (messageIds.length > 1) {
            // Count all signatures for all messages in this broadcast
            const { count } = await supabase
              .from('message_signatures')
              .select('*', { count: 'exact', head: true })
              .in('message_id', messageIds)
            
            broadcastList.push({
              ...message,
              id: message.id, // Keep the original message ID
              recipient_count: messageIds.length,
              signature_count: count || 0,
              messageIds: messageIds // Store all message IDs for this broadcast
            })
          }
        }

        setBroadcasts(broadcastList)
      } else {
        // For parents: get broadcast messages received by this parent
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
          .eq('recipient_id', profile!.id)
          .in('sender_id', await getAdminIds())
          .order('created_at', { ascending: false })

        if (error) throw error

        // Check which messages are signed by this parent
        const messageIds = messages?.map(m => m.id) || []
        const { data: signedMessages } = await supabase
          .from('message_signatures')
          .select('message_id')
          .eq('parent_id', profile!.id)
          .in('message_id', messageIds)

        const signedMessageIds = new Set(signedMessages?.map(s => s.message_id) || [])

        const broadcastList = (messages || []).map(msg => ({
          ...msg,
          recipient_count: 1,
          is_signed: signedMessageIds.has(msg.id)
        }))

        setBroadcasts(broadcastList)
      }
    } catch (error) {
      console.error('Error loading broadcasts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAdminIds = async () => {
    const { data } = await supabase
      .rpc('get_active_admin_ids')
    
    return data?.map((p: { id: string }) => p.id) || []
  }

  const handleSignMessage = async (messageId: string) => {
    if (!profile?.id) return

    try {
      setSigning(messageId)
      
      const { error } = await supabase
        .from('message_signatures')
        .insert({
          message_id: messageId,
          parent_id: profile.id
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Information',
            description: 'Vous avez déjà signé ce message',
            variant: 'default'
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: 'Succès',
          description: 'Message signé avec succès',
        })
        loadBroadcasts()
      }
    } catch (error) {
      console.error('Error signing message:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de signer le message',
        variant: 'destructive'
      })
    } finally {
      setSigning(null)
    }
  }

  const loadSignatures = async (broadcast: BroadcastMessage) => {
    try {
      // For admins, use all message IDs for this broadcast
      if (isAdmin && broadcast.messageIds && broadcast.messageIds.length > 0) {
        const { data, error } = await supabase
          .from('message_signatures')
          .select(`
            id,
            parent_id,
            signed_at,
            parent:profiles!message_signatures_parent_id_fkey (
              first_name,
              last_name
            )
          `)
          .in('message_id', broadcast.messageIds)
          .order('signed_at', { ascending: false })

        if (error) throw error
        setSignatures(data || [])
      } else {
        // For parents, just load signatures for their specific message
        const { data, error } = await supabase
          .from('message_signatures')
          .select(`
            id,
            parent_id,
            signed_at,
            parent:profiles!message_signatures_parent_id_fkey (
              first_name,
              last_name
            )
          `)
          .eq('message_id', broadcast.id)
          .order('signed_at', { ascending: false })

        if (error) throw error
        setSignatures(data || [])
      }
    } catch (error) {
      console.error('Error loading signatures:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les signatures',
        variant: 'destructive'
      })
    }
  }

  const handleViewSignatures = async (broadcast: BroadcastMessage) => {
    setSelectedBroadcastId(broadcast.id)
    await loadSignatures(broadcast)
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
    <div className="flex flex-col h-full space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 flex-shrink-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
            Messages de diffusion
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Annonces et communications à tous les parents
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showNewBroadcast} onOpenChange={setShowNewBroadcast}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs sm:text-sm">
                <Send className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Nouvelle diffusion</span>
                <span className="sm:hidden">Nouveau</span>
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
      <ScrollArea className="flex-1 min-h-0">
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
              <Card key={broadcast.id} className="mb-3">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <CardTitle className="text-sm sm:text-base truncate">
                            {broadcast.subject}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs w-fit">
                            <Users className="h-3 w-3 mr-1" />
                            {broadcast.recipient_count} parent{broadcast.recipient_count > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Par {broadcast.sender?.first_name} {broadcast.sender?.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span className="hidden sm:inline">
                        {format(new Date(broadcast.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                      <span className="sm:hidden">
                        {format(new Date(broadcast.created_at), 'dd/MM HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm sm:text-base">{broadcast.content}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-4 border-t">
                    {isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSignatures(broadcast)}
                        className="text-xs sm:text-sm"
                      >
                        <FileSignature className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Voir les signatures ({broadcast.signature_count || 0})</span>
                        <span className="sm:hidden">Signatures ({broadcast.signature_count || 0})</span>
                      </Button>
                    ) : (
                      <Button
                        variant={broadcast.is_signed ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleSignMessage(broadcast.id)}
                        disabled={broadcast.is_signed || signing === broadcast.id}
                        className="text-xs sm:text-sm w-full sm:w-auto"
                      >
                        {broadcast.is_signed ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Signé
                          </>
                        ) : (
                          <>
                            <FileSignature className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            {signing === broadcast.id ? 'Signature...' : 'Signer le mot'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Signatures Dialog for Admins */}
      <Dialog open={selectedBroadcastId !== null} onOpenChange={(open) => !open && setSelectedBroadcastId(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Liste des signatures</DialogTitle>
            <DialogDescription>
              Parents qui ont signé ce message de diffusion
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {signatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune signature pour le moment</p>
              </div>
            ) : (
              <div className="space-y-2">
                {signatures.map((signature) => (
                  <div
                    key={signature.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {signature.parent?.first_name?.[0]}
                          {signature.parent?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {signature.parent?.first_name} {signature.parent?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Signé le {format(new Date(signature.signed_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
