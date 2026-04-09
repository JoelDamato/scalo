import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Phone, MoreVertical, User, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { WhatsAppConversation, WhatsAppMessage } from '@/hooks/useWhatsApp';

interface ChatWindowProps {
  conversation: WhatsAppConversation | null;
  messages: WhatsAppMessage[];
  isLoading?: boolean;
  onSendMessage: (content: string) => void;
  isSending?: boolean;
}

export function ChatWindow({ 
  conversation, 
  messages, 
  isLoading,
  onSendMessage,
  isSending 
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when conversation changes
    if (conversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/30 text-muted-foreground">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Phone className="h-10 w-10 text-primary/50" />
        </div>
        <h3 className="text-lg font-medium">WhatsApp Business</h3>
        <p className="text-sm mt-1">Selecciona una conversación para comenzar</p>
      </div>
    );
  }

  const displayName = conversation.contact_name || 
                     conversation.customer?.name || 
                     conversation.phone_number;
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials || <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{displayName}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.phone_number}
            {conversation.customer?.company && ` · ${conversation.customer.company}`}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-48" : "w-40")} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No hay mensajes en esta conversación</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOutbound = message.direction === 'outbound';
              const showDate = index === 0 || 
                format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd') !== 
                format(new Date(message.created_at), 'yyyy-MM-dd');

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                        {format(new Date(message.created_at), "d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                  )}
                  <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[70%] px-3 py-2 rounded-2xl text-sm",
                        isOutbound 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={cn(
                        "flex items-center justify-end gap-1 mt-1",
                        isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        <span className="text-[10px]">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                        {isOutbound && (
                          message.status === 'read' ? (
                            <CheckCheck className="h-3 w-3 text-sky-400" />
                          ) : message.status === 'delivered' ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!inputValue.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
