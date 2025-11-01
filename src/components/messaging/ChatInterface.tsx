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
  onNewMessage?: () => void
}

export const ChatInterface = ({ 
  recipientId, 
  recipientName, 
  recipientRole,
  childId,
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
      subscribeToMessages()
    }
  }, [profile, recipientId, childId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      let query = supabase
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
        .or(`and(sender_id.eq.${profile!.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${profile!.id})`)
        .order('created_at', { ascending: true })

      if (childId) {
        query = query.eq('child_id', childId)
      }

      const { data, error } = await query

      if (error) throw error
      setMessages(data || [])

      // Mark received messages as read
      const unreadMessages = data?.filter(m => m.recipient_id === profile!.id && !m.is_read) || []
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id))
      }
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

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${profile!.id}`
        },
        () => {
          loadMessages()
          if (onNewMessage) onNewMessage()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile!.id,
          recipient_id: recipientId,
          content: newMessage,
          subject: 'Message', // For compatibility with existing schema
          child_id: childId || null
        })

      if (error) throw error

      setNewMessage('')
      loadMessages()
      
      // Trigger email notification
      await supabase.functions.invoke('send-message-notification', {
        body: {
          recipient_id: recipientId,
          sender_name: `${profile!.first_name} ${profile!.last_name}`,
          message_content: newMessage
        }
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Chargement...</div>
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <Avatar>
          <AvatarFallback>
            {recipientName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{recipientName}</h3>
          <p className="text-xs text-muted-foreground">
            {recipientRole === 'admin' ? 'Administration' : 
             recipientRole === 'secretary' ? 'Secrétaire' :
             recipientRole === 'educator' ? 'Éducatrice' : 'Parent'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Commencez la conversation</p>
            </div>
          ) : (
            messages.map((message) => {
              const isSent = message.sender_id === profile!.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {message.sender?.first_name?.[0]}
                        {message.sender?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 ${isSent ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isSent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 px-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
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
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="resize-none"
            rows={2}
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
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
