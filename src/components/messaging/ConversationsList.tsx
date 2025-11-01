import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, User } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Conversation {
  id: string
  other_user: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  last_message: {
    content: string
    created_at: string
    sender_id: string
  }
  unread_count: number
  child?: {
    first_name: string
    last_name: string
  }
}

interface ConversationsListProps {
  onSelectConversation: (userId: string, userName: string, userRole: string, childId?: string) => void
  selectedUserId?: string
}

export const ConversationsList = ({ onSelectConversation, selectedUserId }: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      loadConversations()
      subscribeToMessages()
    }
  }, [profile])

  const loadConversations = async () => {
    try {
      setLoading(true)
      
      // Get all messages involving the current user
      const { data: messages, error } = await supabase
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
        .or(`sender_id.eq.${profile!.id},recipient_id.eq.${profile!.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group messages by conversation partner
      const conversationsMap = new Map<string, Conversation>()
      
      messages?.forEach(msg => {
        const otherUser = msg.sender_id === profile!.id ? msg.recipient : msg.sender
        const key = `${otherUser.id}-${msg.child_id || 'none'}`
        
        if (!conversationsMap.has(key)) {
          const unreadCount = messages.filter(
            m => m.recipient_id === profile!.id && 
                 m.sender_id === otherUser.id && 
                 !m.is_read &&
                 (msg.child_id ? m.child_id === msg.child_id : true)
          ).length

          conversationsMap.set(key, {
            id: key,
            other_user: otherUser,
            last_message: {
              content: msg.content || msg.subject,
              created_at: msg.created_at,
              sender_id: msg.sender_id
            },
            unread_count: unreadCount,
            child: msg.child
          })
        }
      })

      setConversations(Array.from(conversationsMap.values()))
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    `${conv.other_user.first_name} ${conv.other_user.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-4">Chargement...</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune conversation</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedUserId === conv.other_user.id
              return (
                <Card
                  key={conv.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    isSelected ? 'bg-accent' : ''
                  } ${conv.unread_count > 0 ? 'border-primary' : ''}`}
                  onClick={() => onSelectConversation(
                    conv.other_user.id,
                    `${conv.other_user.first_name} ${conv.other_user.last_name}`,
                    conv.other_user.role,
                    conv.child?.first_name ? conv.id.split('-')[1] : undefined
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {conv.other_user.first_name[0]}
                          {conv.other_user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate">
                            {conv.other_user.first_name} {conv.other_user.last_name}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {conv.other_user.role === 'admin' ? 'Admin' :
                             conv.other_user.role === 'secretary' ? 'Secrétaire' :
                             conv.other_user.role === 'educator' ? 'Éducatrice' : 'Parent'}
                          </Badge>
                          {conv.child && (
                            <Badge variant="secondary" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {conv.child.first_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.last_message.sender_id === profile!.id ? 'Vous: ' : ''}
                          {conv.last_message.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(conv.last_message.created_at), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
