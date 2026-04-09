import { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatWindow } from '@/components/whatsapp/ChatWindow';
import { NewConversationDialog } from '@/components/whatsapp/NewConversationDialog';
import { 
  useWhatsAppConversations, 
  useWhatsAppMessages, 
  useSendWhatsAppMessage,
  useMarkConversationRead,
  type WhatsAppConversation 
} from '@/hooks/useWhatsApp';

export default function WhatsApp() {
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations = [], isLoading: conversationsLoading } = useWhatsAppConversations();
  const { data: messages = [], isLoading: messagesLoading } = useWhatsAppMessages(
    selectedConversation?.id ?? null
  );
  const sendMessage = useSendWhatsAppMessage();
  const markAsRead = useMarkConversationRead();

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      conv.contact_name?.toLowerCase().includes(search) ||
      conv.phone_number.includes(search) ||
      conv.customer?.name.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    if (selectedConversation?.unread_count && selectedConversation.unread_count > 0) {
      markAsRead.mutate(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  const handleSelectConversation = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedConversation) return;
    sendMessage.mutate({ 
      conversationId: selectedConversation.id, 
      content 
    });
  };

  const handleNewConversation = (conversationId: string) => {
    const newConv = conversations.find(c => c.id === conversationId);
    if (newConv) {
      setSelectedConversation(newConv);
    }
  };

  return (
    <AppLayout 
      title="WhatsApp" 
      description="Gestiona las conversaciones de WhatsApp del equipo comercial"
    >
      <div className="flex h-[calc(100vh-theme(spacing.24))] md:h-[calc(100vh-theme(spacing.28))] rounded-xl border bg-card overflow-hidden">
        {/* Conversation List - hidden on mobile when chat is open */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r flex-col bg-background`}>
          <div className="p-3 md:p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Chats</h2>
              <NewConversationDialog onSuccess={handleNewConversation} />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={filteredConversations}
              selectedId={selectedConversation?.id ?? null}
              onSelect={handleSelectConversation}
              isLoading={conversationsLoading}
            />
          </div>
        </div>

        {/* Chat Window - full width on mobile */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {/* Mobile back button */}
          {selectedConversation && (
            <div className="md:hidden flex items-center gap-2 p-2 border-b">
              <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium truncate">
                {selectedConversation.contact_name || selectedConversation.phone_number}
              </span>
            </div>
          )}
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            isLoading={messagesLoading}
            onSendMessage={handleSendMessage}
            isSending={sendMessage.isPending}
          />
        </div>
      </div>
    </AppLayout>
  );
}
