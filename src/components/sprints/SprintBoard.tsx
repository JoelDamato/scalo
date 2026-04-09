import { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { SprintColumn } from './SprintColumn';
import { StoryDetailSheet } from './StoryDetailSheet';
import { CreateStoryDialog } from './CreateStoryDialog';
import { CreateSprintDialog } from './CreateSprintDialog';
import {
  useSprints,
  useUserStories,
  useUpdateUserStory,
  useUpdateSprint,
  useCompleteSprint,
  Sprint,
  UserStory,
  StoryStatus,
} from '@/hooks/useSprints';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Play, CheckCircle2, Calendar, Target, Timer } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
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

const columns: StoryStatus[] = ['todo', 'in_progress', 'review', 'done'];

interface SprintBoardProps {
  projectId: string;
}

export function SprintBoard({ projectId }: SprintBoardProps) {
  const { isAdmin } = useAuth();
  const { data: sprints = [], isLoading: sprintsLoading } = useSprints(projectId);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const updateStory = useUpdateUserStory();
  const updateSprint = useUpdateSprint();
  const completeSprint = useCompleteSprint();

  // Auto-select active or first sprint
  const activeSprint = useMemo(() => {
    if (selectedSprintId) return sprints.find(s => s.id === selectedSprintId) || null;
    return sprints.find(s => s.status === 'active') || sprints[0] || null;
  }, [sprints, selectedSprintId]);

  const { data: sprintStories = [], isLoading: storiesLoading } = useUserStories(
    projectId,
    activeSprint?.id
  );
  const { data: backlogStories = [] } = useUserStories(projectId, null);

  if (sprintsLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (sprints.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">No hay sprints creados aún</p>
          {isAdmin && (
            <>
              <Button onClick={() => setCreateSprintOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Sprint
              </Button>
              <CreateSprintDialog projectId={projectId} open={createSprintOpen} onOpenChange={setCreateSprintOpen} />
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const doneCount = sprintStories.filter(s => s.status === 'done').length;
  const totalCount = sprintStories.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const totalPoints = sprintStories.reduce((sum, s) => sum + (s.points || 0), 0);
  const donePoints = sprintStories.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.points || 0), 0);

  const daysRemaining = activeSprint
    ? Math.max(0, differenceInDays(parseISO(activeSprint.end_date), new Date()))
    : 0;

  const getStoriesByStatus = (status: StoryStatus) =>
    sprintStories.filter(s => s.status === status);

  const handleDragEnd = (result: DropResult) => {
    if (!isAdmin) return;
    const { destination, draggableId } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as StoryStatus;
    updateStory.mutate({ id: draggableId, updates: { status: newStatus } });
  };

  const handleActivateSprint = async () => {
    if (!activeSprint) return;
    try {
      await updateSprint.mutateAsync({ id: activeSprint.id, updates: { status: 'active' as any } });
      toast.success('Sprint activado');
    } catch {
      toast.error('Error al activar sprint');
    }
  };

  const handleCompleteSprint = async () => {
    if (!activeSprint) return;
    try {
      await completeSprint.mutateAsync(activeSprint.id);
      toast.success(`Sprint completado. ${totalCount - doneCount} stories movidas al backlog.`);
    } catch {
      toast.error('Error al completar sprint');
    }
  };

  const statusLabels: Record<string, string> = {
    planning: 'Planificación',
    active: 'Activo',
    review: 'Revisión',
    completed: 'Completado',
  };

  return (
    <div className="space-y-4">
      {/* Sprint selector & header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Select
                value={activeSprint?.id || ''}
                onValueChange={setSelectedSprintId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccionar sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {statusLabels[s.status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeSprint && (
                <Badge variant={activeSprint.status === 'active' ? 'default' : 'secondary'}>
                  {statusLabels[activeSprint.status]}
                </Badge>
              )}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                {activeSprint?.status === 'planning' && (
                  <Button size="sm" variant="outline" onClick={handleActivateSprint}>
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Iniciar Sprint
                  </Button>
                )}
                {activeSprint?.status === 'active' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Completar Sprint
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Completar sprint?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {doneCount}/{totalCount} stories completadas ({donePoints}/{totalPoints} pts).
                          Las stories incompletas volverán al backlog.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteSprint}>Completar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button size="sm" onClick={() => setCreateStoryOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Story
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCreateSprintOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Sprint
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        {activeSprint && (
          <CardContent className="pt-0 space-y-3">
            {activeSprint.goal && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                {activeSprint.goal}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(parseISO(activeSprint.start_date), 'dd MMM', { locale: es })} — {format(parseISO(activeSprint.end_date), 'dd MMM', { locale: es })}
              </span>
              {activeSprint.status === 'active' && (
                <span className="flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" />
                  {daysRemaining} días restantes
                </span>
              )}
              <span>{donePoints}/{totalPoints} pts</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={progressPct} className="h-2 flex-1" />
              <span className="text-xs font-medium">{progressPct}%</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Kanban board */}
      {storiesLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isAdmin ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {columns.map(status => (
              <SprintColumn
                key={status}
                status={status}
                stories={getStoriesByStatus(status)}
                onStoryClick={setSelectedStory}
              />
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map(status => (
            <SprintColumn
              key={status}
              status={status}
              stories={getStoriesByStatus(status)}
              isReadOnly
              onStoryClick={setSelectedStory}
            />
          ))}
        </div>
      )}

      {/* Backlog section */}
      {isAdmin && backlogStories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Backlog ({backlogStories.length} stories)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {backlogStories.map(story => (
              <div
                key={story.id}
                className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedStory(story)}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{story.priority.toUpperCase()}</Badge>
                  <span className="text-sm">{story.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {story.points && <span className="text-xs text-muted-foreground">{story.points}pts</span>}
                  {activeSprint && activeSprint.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStory.mutate({
                          id: story.id,
                          updates: { sprint_id: activeSprint.id, status: 'todo' as any },
                        });
                        toast.success('Story añadida al sprint');
                      }}
                    >
                      + Sprint
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <StoryDetailSheet
        story={selectedStory}
        open={!!selectedStory}
        onOpenChange={(open) => !open && setSelectedStory(null)}
      />
      <CreateStoryDialog
        projectId={projectId}
        sprintId={activeSprint?.id}
        open={createStoryOpen}
        onOpenChange={setCreateStoryOpen}
      />
      <CreateSprintDialog
        projectId={projectId}
        open={createSprintOpen}
        onOpenChange={setCreateSprintOpen}
      />
    </div>
  );
}
