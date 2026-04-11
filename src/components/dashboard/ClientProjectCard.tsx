import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import type { Project, Task } from '@/hooks/useData';
import { FolderKanban, ArrowRight, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientProjectCardProps {
  project: Project;
  tasks: Task[];
}

export function ClientProjectCard({ project, tasks }: ClientProjectCardProps) {
  const navigate = useNavigate();
  
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
    <Card className="animate-fade-in group hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso del proyecto</span>
            <span className="font-semibold text-primary">{progressPercentage}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-status-in-progress" />
            <div>
              <div className="text-lg font-semibold">{taskCounts['in-progress']}</div>
              <div className="text-[10px] text-muted-foreground">En progreso</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
            <MessageSquare className="h-4 w-4 text-status-review" />
            <div>
              <div className="text-lg font-semibold">{taskCounts.review}</div>
              <div className="text-[10px] text-muted-foreground">En revisión</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
            <CheckCircle2 className="h-4 w-4 text-status-done" />
            <div>
              <div className="text-lg font-semibold">{taskCounts.done}</div>
              <div className="text-[10px] text-muted-foreground">Completadas</div>
            </div>
          </div>
        </div>

        {/* View Project Button */}
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          Ver proyecto
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
