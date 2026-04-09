import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Activity } from '@/hooks/useData';
import { Activity as ActivityIcon, MessageSquare, FolderPlus, MoveRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityCardProps {
  activities: Activity[];
}

const activityIcons: Record<string, typeof ActivityIcon> = {
  task_created: FolderPlus,
  task_updated: MoveRight,
  task_status_changed: MoveRight,
  comment_added: MessageSquare,
  project_created: FolderPlus,
};

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const recentActivity = activities.slice(0, 5);

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Latest updates on your project</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((item, index) => {
              const Icon = activityIcons[item.type] || ActivityIcon;
              return (
                <div 
                  key={item.id} 
                  className="flex items-start gap-3 py-2.5 animate-slide-in-right"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-tight">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
