import { forwardRef, useState, useEffect } from 'react';
import {
  MAX_TASK_IMAGE_SIZE,
  Task,
  TaskAttachment,
  useAddTaskAttachments,
  useComments,
  useCreateComment,
  useDeleteTask,
  useTaskAttachments,
  useUpdateTask,
} from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { useAdminProfiles } from '@/hooks/useAdminProfiles';
import { useTaskAssignees, useSetTaskAssignees } from '@/hooks/useTaskAssignees';
import { useMentionNotifications, useAssignmentNotifications } from '@/hooks/useNotifications';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { MentionInput } from '@/components/mentions/MentionInput';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Send, Pencil, Trash2, X, Check, Users, CalendarClock, ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TaskChecklist } from './TaskChecklist';
import { GoogleCalendarSyncButton } from '@/components/google/GoogleCalendarSyncButton';
import { useGoogleCalendarStatus, useGoogleCalendarSync } from '@/hooks/useGoogleCalendar';
import { useWhatsAppTaskAssignmentNotification } from '@/hooks/useWhatsAppIntegration';
import { supabase } from '@/integrations/supabase/client';

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TaskAttachmentGallery({ attachments }: { attachments: TaskAttachment[] }) {
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

export const TaskDetailSheet = forwardRef<HTMLDivElement, TaskDetailSheetProps>(
  function TaskDetailSheet({ task, open, onOpenChange }, ref) {
    const { isAdmin, user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editClientVisible, setEditClientVisible] = useState(false);
    const [editClientInput, setEditClientInput] = useState(false);
    const [editScheduledDate, setEditScheduledDate] = useState('');
    const [editScheduledTime, setEditScheduledTime] = useState('');
    const [editScheduledEndTime, setEditScheduledEndTime] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [taskImages, setTaskImages] = useState<File[]>([]);
    
    const { data: comments = [] } = useComments(task?.id || '');
    const { data: profiles = [] } = useProfiles();
    const { data: adminProfiles = [] } = useAdminProfiles();
    const { data: assignees = [] } = useTaskAssignees(task?.id);
    const { data: attachments = [] } = useTaskAttachments(task?.id || '');
    const addTaskAttachments = useAddTaskAttachments();
    const createComment = useCreateComment();
    const updateTask = useUpdateTask();
    const googleCalendarStatus = useGoogleCalendarStatus();
    const syncTaskToGoogle = useGoogleCalendarSync('task');
    const deleteTask = useDeleteTask();
    const setAssignees = useSetTaskAssignees();
    const { sendMentionNotifications } = useMentionNotifications();
    const { sendAssignmentNotification } = useAssignmentNotifications();
    const sendWhatsAppAssignmentNotification = useWhatsAppTaskAssignmentNotification();

    // Sync assignees when task changes or editing starts
    useEffect(() => {
      if (task && assignees) {
        setSelectedAssignees(assignees.map(a => a.user_id));
      }
    }, [task, task?.id, assignees]);

    useEffect(() => {
      if (open) {
        setTaskImages([]);
      }
    }, [open, task?.id]);

    if (!task) return null;

    const handleStartEdit = () => {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditClientVisible(task.is_client_visible);
      setEditClientInput(task.client_input_required);
      setEditScheduledDate(task.scheduled_date || '');
      setEditScheduledTime(task.scheduled_time?.slice(0, 5) || '');
      setEditScheduledEndTime(task.scheduled_end_time?.slice(0, 5) || '');
      setSelectedAssignees(assignees.map(a => a.user_id));
      setIsEditing(true);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setSelectedAssignees(assignees.map(a => a.user_id));
    };

    const handleSaveEdit = async () => {
      if (!editTitle.trim()) {
        toast.error('El título es requerido');
        return;
      }
      
      try {
        await updateTask.mutateAsync({
          taskId: task.id,
          updates: {
            title: editTitle.trim(),
            description: editDescription.trim() || null,
            is_client_visible: editClientVisible,
            client_input_required: editClientInput,
            scheduled_date: editScheduledDate || null,
            scheduled_time: editScheduledTime || null,
            scheduled_end_time: editScheduledEndTime || null,
            assignee_id: selectedAssignees[0] || null,
          }
        });

        if (googleCalendarStatus.data?.connected) {
          if (editScheduledDate) {
            await syncTaskToGoogle.mutateAsync({
              sourceId: task.id,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
          } else {
            await syncTaskToGoogle.mutateAsync({
              sourceId: task.id,
              action: 'remove',
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
          }
        }
        
        // Update assignees and send notifications for new ones
        const currentAssigneeIds = assignees.map(a => a.user_id);
        const newAssigneeIds = selectedAssignees.filter(id => !currentAssigneeIds.includes(id));
        
        await setAssignees.mutateAsync({
          taskId: task.id,
          userIds: selectedAssignees
        });
        
        // Send notifications to newly assigned users
        for (const userId of newAssigneeIds) {
          try {
            await sendAssignmentNotification(userId, task.title, task.id, task.project_id);
          } catch (error) {
            console.error('Error sending assignment notification:', error);
          }
          try {
            await sendWhatsAppAssignmentNotification.mutateAsync({
              task_id: task.id,
              assignee_user_id: userId,
            });
          } catch (error) {
            console.error('Error sending WhatsApp assignment notification:', error);
          }
        }
        
        toast.success('Tarea actualizada');
        setIsEditing(false);
      } catch (error) {
        toast.error('Error al actualizar');
      }
    };

    const handleDelete = async () => {
      try {
        await deleteTask.mutateAsync(task.id);
        toast.success('Tarea eliminada');
        onOpenChange(false);
      } catch (error) {
        toast.error('Error al eliminar');
      }
    };

    const handleSubmitComment = async () => {
      if (!newComment.trim()) return;
      
      createComment.mutate({ taskId: task.id, content: newComment.trim() });

      const assignedUserIds = assignees.map((assignee) => assignee.user_id);
      if (assignedUserIds.includes('378759b2-7f24-4523-893c-d23bd3213484') && user?.id !== '378759b2-7f24-4523-893c-d23bd3213484') {
        try {
          await supabase.functions.invoke('discord-dylan-notify', {
            body: {
              event_type: 'task_comment',
              related_assignee_ids: assignedUserIds,
              task_title: task.title,
              comment: newComment.trim(),
              link: `/my-tasks?task=${task.id}`,
            },
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
              'X-App-Origin': window.location.origin,
            },
          });
        } catch (error) {
          console.error('Error sending Dylan Discord task comment notification:', error);
        }
      }
      
      // Send mention notifications
      await sendMentionNotifications(
        newComment,
        profiles.map(p => ({ user_id: p.user_id, name: p.name })),
        {
          taskId: task.id,
          projectId: task.project_id,
          contextType: 'comment',
          contextName: task.title
        }
      );
      
      setNewComment('');
    };

    const toggleAssignee = (userId: string) => {
      setSelectedAssignees(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    };

    const getInitials = (name?: string) => {
      if (!name) return 'U';
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const getAssigneeProfiles = () => {
      return assignees
        .map(a => profiles.find(p => p.user_id === a.user_id))
        .filter(Boolean);
    };

    const isAssignedToCurrentUser = !!user?.id && assignees.some((assignee) => assignee.user_id === user.id);

    const validateSelectedImages = (files: File[]) => {
      const invalidFile = files.find((file) => !file.type.startsWith('image/'));
      if (invalidFile) {
        toast.error('Solo podés adjuntar imágenes');
        return false;
      }

      const oversizedFile = files.find((file) => file.size > MAX_TASK_IMAGE_SIZE);
      if (oversizedFile) {
        toast.error('Cada imagen debe pesar menos de 10 MB');
        return false;
      }

      return true;
    };

    const handleTaskImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (!validateSelectedImages(files)) {
        event.target.value = '';
        return;
      }

      setTaskImages((current) => [...current, ...files]);
      event.target.value = '';
    };

    const removeTaskImage = (index: number) => {
      setTaskImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleAddTaskImages = async () => {
      if (taskImages.length === 0) return;

      try {
        await addTaskAttachments.mutateAsync({
          taskId: task.id,
          images: taskImages,
        });
        setTaskImages([]);
        toast.success('Imágenes agregadas a la tarea');
      } catch {
        toast.error('Error al subir imágenes');
      }
    };

    const handleAssignToMe = async () => {
      if (!user?.id) return;

      try {
        const nextAssignees = Array.from(new Set([...assignees.map((item) => item.user_id), user.id]));
        await setAssignees.mutateAsync({ taskId: task.id, userIds: nextAssignees });
        toast.success('Te asignaste la tarea');
      } catch {
        toast.error('No pude asignarte la tarea');
      }
    };

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent ref={ref} className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="text-left">
            <div className="flex items-start justify-between gap-4">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                />
              ) : (
                <SheetTitle className="text-lg font-semibold leading-tight pr-4">
                  {task.title}
                </SheetTitle>
              )}
              <StatusBadge status={task.status} />
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Admin Edit/Delete Actions */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateTask.isPending || setAssignees.isPending}>
                      <Check className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={handleStartEdit}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Descripción
              </h4>
              {isEditing ? (
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descripción de la tarea..."
                  rows={3}
                />
              ) : (
                <p className="text-sm text-foreground">
                  {task.description || <span className="text-muted-foreground italic">Sin descripción</span>}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Imágenes
              </h4>
              <TaskAttachmentGallery attachments={attachments} />
              <div className="mt-3 space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                <Label className="text-xs text-muted-foreground">Agregar imágenes a la tarea</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleTaskImageChange}
                />
                {taskImages.length > 0 && (
                  <div className="space-y-2">
                    {taskImages.map((image, index) => (
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
                          onClick={() => removeTaskImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleAddTaskImages}
                      disabled={addTaskAttachments.isPending}
                    >
                      <ImageIcon className="h-4 w-4" />
                      {addTaskAttachments.isPending ? 'Subiendo...' : 'Guardar imágenes'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Assignees Section */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <Users className="h-3 w-3" />
                Responsables
              </h4>
              {!isEditing && isAdmin && user && !isAssignedToCurrentUser && (
                <Button size="sm" variant="outline" className="mb-3" onClick={handleAssignToMe} disabled={setAssignees.isPending}>
                  Asignármela
                </Button>
              )}
              {isEditing && isAdmin ? (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                  {adminProfiles.map(profile => (
                    <label 
                      key={profile.user_id} 
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedAssignees.includes(profile.user_id) ? "bg-primary/10" : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={selectedAssignees.includes(profile.user_id)}
                        onCheckedChange={() => toggleAssignee(profile.user_id)}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{profile.name}</span>
                    </label>
                  ))}
                  {adminProfiles.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No hay personal interno disponible</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {getAssigneeProfiles().length > 0 ? (
                    getAssigneeProfiles().map(profile => profile && (
                      <div key={profile.user_id} className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-full">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                            {getInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{profile.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin responsables asignados</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <CalendarClock className="h-3 w-3" />
                Agenda
              </h4>
              {isEditing && isAdmin ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">Fecha</Label>
                    <Input type="date" value={editScheduledDate} onChange={(e) => setEditScheduledDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">Desde</Label>
                    <Input type="time" value={editScheduledTime} onChange={(e) => setEditScheduledTime(e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">Hasta</Label>
                    <Input type="time" value={editScheduledEndTime} onChange={(e) => setEditScheduledEndTime(e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 p-3">
                  {task.scheduled_date ? (
                    <>
                      <p className="text-sm font-medium">
                        {task.scheduled_date}
                        {task.scheduled_time ? ` · ${task.scheduled_time.slice(0, 5)}` : ''}
                        {task.scheduled_end_time ? ` - ${task.scheduled_end_time.slice(0, 5)}` : ''}
                      </p>
                      <div className="mt-3">
                        <GoogleCalendarSyncButton sourceType="task" sourceId={task.id} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Esta tarea todavía no tiene fecha y hora para poder enviarla al calendario.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Visibility Settings (Admin only when editing) */}
            {isAdmin && isEditing && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Configuración
                </h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="client-visible" className="text-sm">Visible para cliente</Label>
                  <Switch
                    id="client-visible"
                    checked={editClientVisible}
                    onCheckedChange={setEditClientVisible}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="client-input" className="text-sm">Requiere input del cliente</Label>
                  <Switch
                    id="client-input"
                    checked={editClientInput}
                    onCheckedChange={setEditClientInput}
                  />
                </div>
              </div>
            )}

            {/* Checklist Section */}
            <TaskChecklist taskId={task.id} />

            <Separator />

            {/* Comments */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Comentarios ({comments.length})
              </h4>
              
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay comentarios aún
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const commentProfile = profiles.find(p => p.user_id === comment.author_id);
                    return (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={commentProfile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            {getInitials(commentProfile?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{commentProfile?.name || 'Usuario'}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mt-1">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <MentionInput
                  placeholder="Agregar comentario... Usá @ para mencionar"
                  value={newComment}
                  onChange={setNewComment}
                  onSubmit={handleSubmitComment}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="mt-2 flex justify-end">
                <Button 
                  size="sm" 
                  disabled={!newComment.trim() || createComment.isPending}
                  onClick={handleSubmitComment}
                >
                  <Send className="h-3 w-3 mr-1.5" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);
