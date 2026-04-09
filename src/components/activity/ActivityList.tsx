import { ActivityItem } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, FolderPlus, MoveRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityListProps {
  activity: ActivityItem[];
}

const activityIcons = {
  task_created: FolderPlus,
  task_updated: MoveRight,
  task_status_changed: MoveRight,
  comment_added: MessageSquare,
  project_created: FolderPlus,
};

export function ActivityList({ activity }: ActivityListProps) {
  return (
    <div className="space-y-1">
      {activity.map((item, index) => {
        const Icon = activityIcons[item.type];
        return (
          <div
            key={item.id}
            className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {item.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border">
                <Icon className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">{item.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                {' · '}
                {format(new Date(item.createdAt), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
