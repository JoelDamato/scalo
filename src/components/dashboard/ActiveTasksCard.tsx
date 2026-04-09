import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Task } from '@/hooks/useData';
import { Zap } from 'lucide-react';

interface ActiveTasksCardProps {
  tasks: Task[];
}

export function ActiveTasksCard({ tasks }: ActiveTasksCardProps) {
  const activeTasks = tasks.filter(t => t.status === 'in-progress').slice(0, 3);

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-in-progress/15">
            <Zap className="h-4 w-4 text-status-in-progress" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Trabajo activo</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Tareas actualmente en progreso</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay tareas en progreso</p>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
