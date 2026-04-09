import { forwardRef, useState, useEffect } from 'react';
import { Task, useComments, useCreateComment, useUpdateTask, useDeleteTask } from '@/hooks/useData';
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
import { Send, Pencil, Trash2, X, Check, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TaskChecklist } from './TaskChecklist';

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskDetailSheet = forwardRef<HTMLDivElement, TaskDetailSheetProps>(
  function TaskDetailSheet({ task, open, onOpenChange }, ref) {
    const { isAdmin } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editClientVisible, setEditClientVisible] = useState(false);
    const [editClientInput, setEditClientInput] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    
    const { data: comments = [] } = useComments(task?.id || '');
    const { data: profiles = [] } = useProfiles();
    const { data: adminProfiles = [] } = useAdminProfiles();
    const { data: assignees = [] } = useTaskAssignees(task?.id);
    const createComment = useCreateComment();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();
    const setAssignees = useSetTaskAssignees();
    const { sendMentionNotifications } = useMentionNotifications();
    const { sendAssignmentNotification } = useAssignmentNotifications();

    // Sync assignees when task changes or editing starts
    useEffect(() => {
      if (task && assignees) {
        setSelectedAssignees(assignees.map(a => a.user_id));
      }
    }, [task?.id, assignees]);

    if (!task) return null;

    const handleStartEdit = () => {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditClientVisible(task.is_client_visible);
      setEditClientInput(task.client_input_required);
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
          }
        });
        
        // Update assignees and send notifications for new ones
        const currentAssigneeIds = assignees.map(a => a.user_id);
        const newAssigneeIds = selectedAssignees.filter(id => !currentAssigneeIds.includes(id));
        
        await setAssignees.mutateAsync({
          taskId: task.id,
          userIds: selectedAssignees
        });
        
        // Send notifications to newly assigned users
        for (const userId of newAssigneeIds) {
          await sendAssignmentNotification(userId, task.title, task.id, task.project_id);
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

            {/* Assignees Section */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <Users className="h-3 w-3" />
                Responsables
              </h4>
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
