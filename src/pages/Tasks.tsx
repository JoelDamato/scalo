import { AppLayout } from '@/components/layout/AppLayout';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { VoiceTaskRecorder } from '@/components/tasks/VoiceTaskRecorder';
import { useAuth } from '@/hooks/useAuth';

export default function Tasks() {
  const { isAdmin } = useAuth();
  
  return (
    <AppLayout title="Tareas Internas" description="Tareas operativas del equipo">
      <div className="h-full">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Operaciones</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tareas internas del equipo, no vinculadas a proyectos de clientes
            </p>
          </div>
          
          {isAdmin && <VoiceTaskRecorder mode="internal" />}
        </div>

        <KanbanBoard mode="internal" />
      </div>
    </AppLayout>
  );
}
