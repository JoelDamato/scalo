import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Task } from '@/hooks/useData';
import { AlertCircle, MessageSquare } from 'lucide-react';

interface NeedsInputCardProps {
  tasks: Task[];
}

export function NeedsInputCard({ tasks }: NeedsInputCardProps) {
  // Tasks in review that need client input
  const needsInputTasks = tasks
    .filter(t => t.status === 'review' && t.client_input_required === true)
    .slice(0, 3);

  return (
    <Card className="animate-fade-in border-status-review/30" style={{ animationDelay: '100ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-review/15">
            <AlertCircle className="h-4 w-4 text-status-review" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Necesita tu respuesta</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Tareas esperando tu feedback</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {needsInputTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nada requiere tu atención</p>
        ) : (
          <div className="space-y-3">
            {needsInputTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-status-review/5 border border-status-review/20 hover:bg-status-review/10 transition-colors cursor-pointer"
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
