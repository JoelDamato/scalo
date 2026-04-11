import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ImageIcon, Lock, Send, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  TicketAttachment,
  MAX_TICKET_IMAGE_SIZE,
  useAddTicketAttachments,
  useTicketAttachments,
  useTicketMessages, 
  useAddTicketMessage,
  useUpdateTicket 
} from '@/hooks/useTickets';
import { toast } from 'sonner';
import { ConvertTicketToTaskDialog } from './ConvertTicketToTaskDialog';

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

function TicketAttachmentGallery({ attachments }: { attachments: TicketAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.signed_url || undefined}
          target={attachment.signed_url ? '_blank' : undefined}
          rel="noreferrer"
          className="group overflow-hidden rounded-lg border border-border/70 bg-muted/20 transition hover:border-primary/40"
        >
          {attachment.signed_url ? (
            <img
              src={attachment.signed_url}
              alt={attachment.file_name}
              className="aspect-video w-full object-cover transition group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{attachment.file_name}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export function TicketDetailSheet({ ticket, open, onOpenChange }: TicketDetailSheetProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [ticketImages, setTicketImages] = useState<File[]>([]);
  const [messageImages, setMessageImages] = useState<File[]>([]);
  
  const { isAdmin, user } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const { data: messages = [] } = useTicketMessages(ticket?.id || '');
  const { data: attachments = [] } = useTicketAttachments(ticket?.id || '');
  const addTicketAttachments = useAddTicketAttachments();
  const addMessage = useAddTicketMessage();
  const updateTicket = useUpdateTicket();

  useEffect(() => {
    if (open) {
      setNewMessage('');
      setTicketImages([]);
      setMessageImages([]);
      setIsInternal(false);
    }
  }, [open, ticket?.id]);

  const ticketAttachments = attachments.filter((attachment) => !attachment.message_id);
  const attachmentsByMessageId = useMemo(() => {
    const grouped = new Map<string, TicketAttachment[]>();

    attachments.forEach((attachment) => {
      if (!attachment.message_id) return;
      const current = grouped.get(attachment.message_id) || [];
      grouped.set(attachment.message_id, [...current, attachment]);
    });

    return grouped;
  }, [attachments]);

  if (!ticket) return null;

  const getAuthorName = (authorId: string) => {
    const profile = profiles.find(p => p.user_id === authorId);
    return profile?.name || 'Usuario';
  };

  const getAuthorInitials = (authorId: string) => {
    const name = getAuthorName(authorId);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const validateSelectedImages = (files: File[]) => {
    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      toast.error('Solo podés adjuntar imágenes');
      return false;
    }

    const oversizedFile = files.find((file) => file.size > MAX_TICKET_IMAGE_SIZE);
    if (oversizedFile) {
      toast.error('Cada imagen debe pesar menos de 10 MB');
      return false;
    }

    return true;
  };

  const handleTicketImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (!validateSelectedImages(files)) {
      event.target.value = '';
      return;
    }

    setTicketImages((current) => [...current, ...files]);
    event.target.value = '';
  };

  const handleMessageImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (!validateSelectedImages(files)) {
      event.target.value = '';
      return;
    }

    setMessageImages((current) => [...current, ...files]);
    event.target.value = '';
  };

  const removeTicketImage = (index: number) => {
    setTicketImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const removeMessageImage = (index: number) => {
    setMessageImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleAddTicketImages = async () => {
    if (ticketImages.length === 0) return;

    try {
      await addTicketAttachments.mutateAsync({
        ticketId: ticket.id,
        images: ticketImages,
        isInternal: false,
      });
      setTicketImages([]);
      toast.success('Imágenes agregadas al ticket');
    } catch (error) {
      toast.error('Error al subir imágenes');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && messageImages.length === 0) return;

    try {
      await addMessage.mutateAsync({
        ticketId: ticket.id,
        content: newMessage.trim(),
        isInternal: isAdmin ? isInternal : false,
        attachments: messageImages,
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
      setMessageImages([]);
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
      <SheetContent className="w-full sm:max-w-xl flex max-h-svh flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">{ticket.subject}</SheetTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Creado {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}</span>
          </div>
        </SheetHeader>

        <div className="flex flex-col mt-4 pb-6">
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

              <div>
                <ConvertTicketToTaskDialog ticket={ticket} variant="default" className="w-full" />
              </div>

              <Separator />
            </div>
          )}

          {/* Description */}
          <div className="pb-4">
            {(ticket.description || ticketAttachments.length > 0) && (
              <>
              {ticket.description && (
                <>
                  <Label className="text-xs text-muted-foreground">Descripción</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.description}</p>
                </>
              )}
              <TicketAttachmentGallery attachments={ticketAttachments} />
              </>
            )}

            <div className="mt-3 space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
              <Label className="text-xs text-muted-foreground">Agregar imágenes al ticket</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleTicketImageChange}
              />
              {ticketImages.length > 0 && (
                <div className="space-y-2">
                  {ticketImages.map((image, index) => (
                    <div key={`${image.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{image.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeTicketImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleAddTicketImages}
                    disabled={addTicketAttachments.isPending}
                  >
                    <ImageIcon className="h-4 w-4" />
                    {addTicketAttachments.isPending ? 'Subiendo...' : 'Guardar imágenes'}
                  </Button>
                </div>
              )}
            </div>
            <Separator className="mt-4" />
          </div>

          {/* Messages */}
          <div>
            <Label className="text-xs text-muted-foreground">Conversación</Label>
            <div className="mt-2 space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay mensajes aún
                </p>
              ) : (
                messages.map((message) => {
                  const messageAttachments = attachmentsByMessageId.get(message.id) || [];

                  return (
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
                        <TicketAttachmentGallery attachments={messageAttachments} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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

            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMessageImageChange}
              />
              {messageImages.length > 0 && (
                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                  {messageImages.map((image, index) => (
                    <div key={`${image.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{image.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeMessageImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={(!newMessage.trim() && messageImages.length === 0) || addMessage.isPending}
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
