import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { UserStory, useUpdateUserStory, useDeleteUserStory, StoryStatus, StoryPriority } from '@/hooks/useSprints';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface StoryDetailSheetProps {
  story: UserStory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryDetailSheet({ story, open, onOpenChange }: StoryDetailSheetProps) {
  const { isAdmin } = useAuth();
  const updateStory = useUpdateUserStory();
  const deleteStory = useDeleteUserStory();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setDescription(story.description || '');
      setPoints(story.points?.toString() || '');
    }
  }, [story]);

  if (!story) return null;

  const handleSave = async () => {
    try {
      await updateStory.mutateAsync({
        id: story.id,
        updates: {
          title,
          description: description || null,
          points: points ? parseInt(points) : null,
        },
      });
      toast.success('Story actualizada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStory.mutateAsync(story.id);
      toast.success('Story eliminada');
      onOpenChange(false);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            User Story
            {story.is_ai_generated && <Sparkles className="h-4 w-4 text-primary" />}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {isAdmin ? (
            <>
              <div>
                <Label>Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prioridad</Label>
                  <Select
                    value={story.priority}
                    onValueChange={v => updateStory.mutate({ id: story.id, updates: { priority: v as StoryPriority } })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="must">Must</SelectItem>
                      <SelectItem value="should">Should</SelectItem>
                      <SelectItem value="could">Could</SelectItem>
                      <SelectItem value="wont">Won't</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={story.status}
                    onValueChange={v => updateStory.mutate({ id: story.id, updates: { status: v as StoryStatus } })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Story Points</Label>
                <Input type="number" value={points} onChange={e => setPoints(e.target.value)} />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={updateStory.isPending}>
                Guardar cambios
              </Button>
            </>
          ) : (
            <>
              <div>
                <p className="font-medium">{story.title}</p>
                {story.description && <p className="text-sm text-muted-foreground mt-1">{story.description}</p>}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{story.priority.toUpperCase()}</Badge>
                <Badge variant="secondary">{story.status.replace('_', ' ')}</Badge>
                {story.points && <Badge variant="outline">{story.points}pts</Badge>}
              </div>
            </>
          )}

          {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
            <div>
              <Label>Criterios de aceptación</Label>
              <ul className="mt-1 space-y-1">
                {story.acceptance_criteria.map((c, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isAdmin && (
            <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Eliminar Story
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
