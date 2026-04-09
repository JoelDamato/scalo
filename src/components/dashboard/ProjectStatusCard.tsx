import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Project, Task } from '@/hooks/useData';
import { FolderKanban } from 'lucide-react';

interface ProjectStatusCardProps {
  project: Project | null;
  tasks: Task[];
}

export function ProjectStatusCard({ project, tasks }: ProjectStatusCardProps) {
  if (!project) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No project found</p>
        </CardContent>
      </Card>
    );
  }

  const taskCounts = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const totalTasks = tasks.length;
  const completedTasks = taskCounts.done;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">{project.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-lg font-semibold">{taskCounts.backlog}</div>
              <div className="text-[10px] text-muted-foreground">Backlog</div>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-lg font-semibold text-status-in-progress">{taskCounts['in-progress']}</div>
              <div className="text-[10px] text-muted-foreground">In Progress</div>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-lg font-semibold text-status-review">{taskCounts.review}</div>
              <div className="text-[10px] text-muted-foreground">Review</div>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-lg font-semibold text-status-done">{taskCounts.done}</div>
              <div className="text-[10px] text-muted-foreground">Done</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
