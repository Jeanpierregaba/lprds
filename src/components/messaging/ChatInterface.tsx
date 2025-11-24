import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, User, Clock } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  recipient_id: string
  child_id?: string
  is_read: boolean
  sender?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  child?: {
    first_name: string
    last_name: string
  }
}

interface ChatInterfaceProps {
  recipientId: string
  recipientName: string
  recipientRole: string
  childId?: string
  isAdminGroup?: boolean // When true, messages are sent to all admins and received from any admin
  onNewMessage?: () => void
}

export const ChatInterface = ({ 
  recipientId, 
  recipientName, 
  recipientRole,
  childId,
  isAdminGroup = false,
  onNewMessage 
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile?.id && recipientId) {
      loadMessages()
      const cleanup = subscribeToMessages()
      return cleanup
    }
  }, [profile, recipientId, childId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!profile?.id || !recipientId) return
    
    try {
      setLoading(true)
      
      if (isAdminGroup) {
        // Load messages between parent and any admin/secretary
        // Get all admin IDs using the SQL function (bypasses RLS)
        const { data: admins, error: adminError } = await supabase
          .rpc('get_active_admin_ids')

        // If we can't get admins (RLS restriction), try to load messages anyway
        // Messages might exist from previous interactions
        if (adminError) {
          console.warn('Could not fetch admin list (RLS restriction):', adminError)
          // Try to load messages where parent is sender or recipient
          // and the other party might be an admin (we'll filter on the client side)
          const { data: allParentMessages, error: messagesError } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                first_name,
                last_name,
                role
              ),
              recipient:profiles!messages_recipient_id_fkey (
                id,
                first_name,
                last_name,
                role
              ),
              child:children (
                first_name,
                last_name
              )
            `)
            .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
            .order('created_at', { ascending: true })

          if (messagesError) {
            console.error('Error loading messages:', messagesError)
            setMessages([])
            return
          }

          // Filter messages where the other party is an admin/secretary
          const adminMessages = (allParentMessages || []).filter(msg => {
            const otherParty = msg.sender_id === profile.id ? msg.recipient : msg.sender
            return otherParty && (otherParty.role === 'admin' || otherParty.role === 'secretary')
          })

          // Group sent messages and combine with received
          const sentMessagesMap = new Map<string, Message>()
          const receivedMessagesList: Message[] = []

          adminMessages.forEach(msg => {
            if (msg.sender_id === profile.id) {
              const key = `${msg.content}-${Math.floor(new Date(msg.created_at).getTime() / 1000)}`
              if (!sentMessagesMap.has(key)) {
                sentMessagesMap.set(key, msg)
              }
            } else {
              receivedMessagesList.push(msg)
            }
          })

          const combinedMessages = [
            ...Array.from(sentMessagesMap.values()),
            ...receivedMessagesList
          ].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

          const filteredMessages = childId
            ? combinedMessages.filter((m) => !m.child_id || m.child_id === childId)
            : combinedMessages

          setMessages(filteredMessages)

          // Mark received messages as read
          const unreadMessages = filteredMessages.filter(
            (m) => m.recipient_id === profile.id && !m.is_read
          )
          if (unreadMessages.length > 0) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .in('id', unreadMessages.map((m) => m.id))
          }
          return
        }

        if (!admins || admins.length === 0) {
          setMessages([])
          return
        }

        const adminIds = admins.map(a => a.id)

        // Get messages sent by parent to any admin
        const { data: sentMessages, error: sentError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey (
              id,
              first_name,
              last_name,
              role
            ),
            child:children (
              first_name,
              last_name
            )
          `)
          .eq('sender_id', profile.id)
          .in('recipient_id', adminIds)
          .order('created_at', { ascending: true })

        // Get messages received by parent from any admin
        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey (
              id,
              first_name,
              last_name,
              role
            ),
            child:children (
              first_name,
              last_name
            )
          `)
          .in('sender_id', adminIds)
          .eq('recipient_id', profile.id)
          .order('created_at', { ascending: true })

        if (sentError) throw sentError
        if (receivedError) throw receivedError

        // Combine messages
        const allMessages = [
          ...(sentMessages || []),
          ...(receivedMessages || [])
        ]

        // Group sent messages by content and timestamp to avoid duplicates
        // (when parent sends to multiple admins, we only show one message)
        const sentMessagesMap = new Map<string, Message>()
        const receivedMessagesList: Message[] = []

        allMessages.forEach(msg => {
          if (msg.sender_id === profile.id) {
            // Group sent messages by content + timestamp (within 1 second)
            const key = `${msg.content}-${Math.floor(new Date(msg.created_at).getTime() / 1000)}`
            if (!sentMessagesMap.has(key)) {
              sentMessagesMap.set(key, msg)
            }
          } else {
            receivedMessagesList.push(msg)
          }
        })

        // Combine grouped sent messages with received messages and sort
        const combinedMessages = [
          ...Array.from(sentMessagesMap.values()),
          ...receivedMessagesList
        ].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        // Filter by child_id if specified
        const filteredMessages = childId
          ? combinedMessages.filter((m) => !m.child_id || m.child_id === childId)
          : combinedMessages

        setMessages(filteredMessages)

        // Mark received messages as read
        const unreadMessages = filteredMessages.filter(
          (m) => m.recipient_id === profile.id && !m.is_read
        )
        if (unreadMessages.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map((m) => m.id))

          if (updateError) {
            console.error('Error marking messages as read:', updateError)
          }
        }
      } else {
        // Normal one-to-one conversation
        const [sentMessages, receivedMessages] = await Promise.all([
          supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                first_name,
                last_name,
                role
              ),
              child:children (
                first_name,
                last_name
              )
            `)
            .eq('sender_id', profile.id)
            .eq('recipient_id', recipientId)
            .order('created_at', { ascending: true }),
          supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                first_name,
                last_name,
                role
              ),
              child:children (
                first_name,
                last_name
              )
            `)
            .eq('sender_id', recipientId)
            .eq('recipient_id', profile.id)
            .order('created_at', { ascending: true })
        ])

        if (sentMessages.error) {
          console.error('Error loading sent messages:', sentMessages.error)
          throw sentMessages.error
        }
        if (receivedMessages.error) {
          console.error('Error loading received messages:', receivedMessages.error)
          throw receivedMessages.error
        }

        // Combine and sort messages
        const allMessages = [
          ...(sentMessages.data || []),
          ...(receivedMessages.data || [])
        ].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        // Filter by child_id if specified
        const filteredMessages = childId
          ? allMessages.filter((m) => !m.child_id || m.child_id === childId)
          : allMessages

        setMessages(filteredMessages)

        // Mark received messages as read
        const unreadMessages = filteredMessages.filter(
          (m) => m.recipient_id === profile.id && !m.is_read
        )
        if (unreadMessages.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map((m) => m.id))

          if (updateError) {
            console.error('Error marking messages as read:', updateError)
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        variant: 'destructive'
      })
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    if (!profile?.id || !recipientId) return () => {}

    const channelName = `messages-changes-${profile.id}-${recipientId}`
    const channel = supabase.channel(channelName)

    if (isAdminGroup) {
      // Subscribe to messages from any admin to this parent
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          // Verify sender is an admin
          if (payload.new?.sender_id) {
            supabase
              .from('profiles')
              .select('role')
              .eq('id', payload.new.sender_id)
              .single()
              .then(({ data }) => {
                if (data && (data.role === 'admin' || data.role === 'secretary')) {
                  console.log('New message from admin:', payload)
                  loadMessages()
                  if (onNewMessage) onNewMessage()
                }
              })
          }
        }
      )
      // Also subscribe to messages sent by parent to admins
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('New message sent to admin:', payload)
          loadMessages()
          if (onNewMessage) onNewMessage()
        }
      )
    } else {
      // Normal one-to-one subscription
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${profile.id}`
          },
          (payload) => {
            console.log('New message received:', payload)
            loadMessages()
            if (onNewMessage) onNewMessage()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${recipientId}`
          },
          (payload) => {
            console.log('New message from recipient:', payload)
            loadMessages()
            if (onNewMessage) onNewMessage()
          }
        )
    }

    channel.subscribe((status) => {
      console.log('Subscription status:', status)
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile?.id || !recipientId) return

    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX

    try {
      if (isAdminGroup) {
        // Send message to all active admins using the SQL function (bypasses RLS)
        const { data: admins, error: adminError } = await supabase
          .rpc('get_active_admin_ids')

        if (adminError) throw adminError

        if (!admins || admins.length === 0) {
          throw new Error('Aucun administrateur disponible')
        }

        // Create messages for all admins
        const messagesToInsert = admins.map(admin => ({
          sender_id: profile.id,
          recipient_id: admin.id,
          content: messageContent,
          subject: 'Message', // For compatibility with existing schema
          child_id: childId || null
        }))

        const { data, error } = await supabase
          .from('messages')
          .insert(messagesToInsert)
          .select()

        if (error) {
          console.error('Error sending message:', error)
          throw error
        }

        console.log(`Message sent successfully to ${admins.length} admin(s):`, data)
        
        // Reload messages to show the new one
        await loadMessages()
        
        // Trigger email notifications for all admins (non-blocking)
        const notificationPromises = admins.map(admin =>
          supabase.functions
            .invoke('send-message-notification', {
              body: {
                recipient_id: admin.id,
                sender_name: `${profile.first_name} ${profile.last_name}`,
                message_content: messageContent
              }
            })
            .catch((err) => {
              console.error(`Error sending notification to admin ${admin.id}:`, err)
            })
        )
        
        Promise.all(notificationPromises).catch(() => {
          // Errors already logged individually
        })
      } else {
        // Normal one-to-one message
        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: profile.id,
            recipient_id: recipientId,
            content: messageContent,
            subject: 'Message', // For compatibility with existing schema
            child_id: childId || null
          })
          .select()

        if (error) {
          console.error('Error sending message:', error)
          throw error
        }

        console.log('Message sent successfully:', data)
        
        // Reload messages to show the new one
        await loadMessages()
        
        // Trigger email notification (non-blocking)
        supabase.functions
          .invoke('send-message-notification', {
            body: {
              recipient_id: recipientId,
              sender_name: `${profile.first_name} ${profile.last_name}`,
              message_content: messageContent
            }
          })
          .catch((err) => {
            console.error('Error sending notification:', err)
            // Don't show error to user as message was sent successfully
          })
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      setNewMessage(messageContent) // Restore message on error
      toast({
        title: 'Erreur',
        description: error?.message || 'Impossible d\'envoyer le message',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Chargement...</div>
  }

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b bg-muted/30 flex-shrink-0 rounded-t-lg">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarFallback className="text-xs sm:text-sm">
            {recipientName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base truncate">{recipientName}</h3>
          <p className="text-xs text-muted-foreground">
            {recipientRole === 'admin' ? 'Administration' : 
             recipientRole === 'secretary' ? 'Secrétaire' :
             recipientRole === 'educator' ? 'Éducatrice' : 'Parent'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-2 sm:p-4 min-h-0" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-muted-foreground px-4">
              <p className="text-sm sm:text-base">Aucun message pour le moment</p>
              <p className="text-xs sm:text-sm mt-1">Commencez la conversation</p>
            </div>
          ) : (
            messages.map((message) => {
              const isSent = message.sender_id === profile!.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] sm:max-w-[70%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                      <AvatarFallback className="text-[10px] sm:text-xs">
                        {message.sender?.first_name?.[0]}
                        {message.sender?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 ${isSent ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${
                          isSent
                            ? 'bg-accent text-muted-foreground'
                            : 'bg-muted '
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 px-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                        </span>
                        {isSent && message.is_read && (
                          <span className="text-xs text-muted-foreground ml-1">✓✓</span>
                        )}
                      </div>
                      {message.child && (
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {message.child.first_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2 sm:p-4 border-t bg-background flex-shrink-0 rounded-b-lg">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="min-h-10 text-sm sm:text-base"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim()}
            size="icon"
            className="h-auto"
          >
            <Send className="h-auto w-auto" />
          </Button>
        </div>
      </div>
    </div>
  )
}
