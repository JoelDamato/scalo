import { Droppable } from '@hello-pangea/dnd';
import { StoryCard } from './StoryCard';
import { UserStory, StoryStatus } from '@/hooks/useSprints';
import { cn } from '@/lib/utils';

const columnLabels: Record<StoryStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Finalizadas',
};

const columnColors: Record<StoryStatus, string> = {
  backlog: 'border-t-muted-foreground/30',
  todo: 'border-t-status-backlog',
  in_progress: 'border-t-status-in-progress',
  review: 'border-t-status-review',
  done: 'border-t-status-done',
};

interface SprintColumnProps {
  status: StoryStatus;
  stories: UserStory[];
  isReadOnly?: boolean;
  onStoryClick?: (story: UserStory) => void;
}

export function SprintColumn({ status, stories, isReadOnly, onStoryClick }: SprintColumnProps) {
  return (
    <div className={cn('flex flex-col min-w-[220px] flex-1 rounded-lg border border-t-4 bg-muted/30', columnColors[status])}>
      <div className="p-3 pb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{columnLabels[status]}</h4>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {stories.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 space-y-2 min-h-[200px] transition-colors',
              snapshot.isDraggingOver && 'bg-primary/5'
            )}
          >
            {stories.map((story, idx) => (
              <StoryCard
                key={story.id}
                story={story}
                index={idx}
                isReadOnly={isReadOnly}
                onClick={onStoryClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
