import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Lock, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { 
  SupportTicket, 
  TicketStatus,
  TicketPriority,
  useTicketMessages, 
  useAddTicketMessage,
  useUpdateTicket 
} from '@/hooks/useTickets';
import { toast } from 'sonner';

interface TicketDetailSheetProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  waiting_response: 'Esperando respuesta',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export function TicketDetailSheet({ ticket, open, onOpenChange }: TicketDetailSheetProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  
  const { isAdmin, user } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const { data: messages = [] } = useTicketMessages(ticket?.id || '');
  const addMessage = useAddTicketMessage();
  const updateTicket = useUpdateTicket();

  if (!ticket) return null;

  const getAuthorName = (authorId: string) => {
    const profile = profiles.find(p => p.user_id === authorId);
    return profile?.name || 'Usuario';
  };

  const getAuthorInitials = (authorId: string) => {
    const name = getAuthorName(authorId);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await addMessage.mutateAsync({
        ticketId: ticket.id,
        content: newMessage.trim(),
        isInternal: isAdmin ? isInternal : false,
      });

      // If admin responds and ticket is open, mark first response
      if (isAdmin && !ticket.first_response_at && ticket.created_by !== user?.id) {
        await updateTicket.mutateAsync({
          ticketId: ticket.id,
          updates: { 
            first_response_at: new Date().toISOString(),
            status: 'in_progress' as TicketStatus
          }
        });
      }

      setNewMessage('');
      setIsInternal(false);
      toast.success('Mensaje enviado');
    } catch (error) {
      toast.error('Error al enviar mensaje');
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      const updates: Partial<SupportTicket> = { status };
      
      if (status === 'resolved' && !ticket.resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }
      
      await updateTicket.mutateAsync({ ticketId: ticket.id, updates });
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    try {
      await updateTicket.mutateAsync({ 
        ticketId: ticket.id, 
        updates: { priority } 
      });
      toast.success('Prioridad actualizada');
    } catch (error) {
      toast.error('Error al actualizar prioridad');
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: { assigned_to: userId === 'unassigned' ? null : userId }
      });
      toast.success('Ticket asignado');
    } catch (error) {
      toast.error('Error al asignar ticket');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">{ticket.subject}</SheetTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Creado {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}</span>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 mt-4">
          {/* Admin controls */}
          {isAdmin && (
            <div className="space-y-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Estado</Label>
                  <Select value={ticket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs">Prioridad</Label>
                  <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Asignado a</Label>
                <Select 
                  value={ticket.assigned_to || 'unassigned'} 
                  onValueChange={handleAssign}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />
            </div>
          )}

          {/* Description */}
          {ticket.description && (
            <div className="pb-4">
              <Label className="text-xs text-muted-foreground">Descripción</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.description}</p>
              <Separator className="mt-4" />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 min-h-0">
            <Label className="text-xs text-muted-foreground">Conversación</Label>
            <ScrollArea className="h-[300px] mt-2 pr-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay mensajes aún
                  </p>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={cn(
                        "flex gap-3",
                        message.is_internal && "bg-amber-500/10 rounded-lg p-3 -mx-1"
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getAuthorInitials(message.author_id)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {getAuthorName(message.author_id)}
                          </span>
                          {message.is_internal && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-amber-500/20 text-amber-600 border-amber-500/30">
                              <Lock className="h-2.5 w-2.5 mr-1" />
                              Interno
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'dd MMM HH:mm', { locale: es })}
                          </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* New message input */}
          <div className="pt-4 border-t mt-4 space-y-3">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Switch 
                  id="internal" 
                  checked={isInternal} 
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="internal" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Nota interna (solo visible para admins)
                </Label>
              </div>
            )}
            
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSendMessage();
                  }
                }}
              />
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || addMessage.isPending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {addMessage.isPending ? 'Enviando...' : 'Enviar mensaje'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
