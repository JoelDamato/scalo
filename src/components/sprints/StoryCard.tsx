import { Draggable } from '@hello-pangea/dnd';
import { UserStory } from '@/hooks/useSprints';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Sparkles } from 'lucide-react';

const priorityColors: Record<string, string> = {
  must: 'bg-destructive/15 text-destructive border-destructive/20',
  should: 'bg-status-in-progress/15 text-status-in-progress border-status-in-progress/20',
  could: 'bg-status-review/15 text-status-review border-status-review/20',
  wont: 'bg-muted text-muted-foreground border-border',
};

interface StoryCardProps {
  story: UserStory;
  index: number;
  isReadOnly?: boolean;
  onClick?: (story: UserStory) => void;
}

export function StoryCard({ story, index, isReadOnly, onClick }: StoryCardProps) {
  const content = (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow border',
        story.client_input_required && 'border-accent/50 bg-accent/5'
      )}
      onClick={() => onClick?.(story)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{story.title}</p>
          {story.points && (
            <Badge variant="outline" className="shrink-0 text-xs px-1.5">
              {story.points}pts
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', priorityColors[story.priority])}>
            {story.priority.toUpperCase()}
          </Badge>
          {story.is_ai_generated && (
            <Sparkles className="h-3 w-3 text-primary/60" />
          )}
          {story.client_input_required && (
            <AlertTriangle className="h-3 w-3 text-accent" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isReadOnly) return content;

  return (
    <Draggable draggableId={story.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {content}
        </div>
      )}
    </Draggable>
  );
}
