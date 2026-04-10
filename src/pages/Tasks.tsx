import { AppLayout } from '@/components/layout/AppLayout';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';

export default function Tasks() {
  return (
    <AppLayout title="Tareas Internas" description="Tareas operativas del equipo">
      <div className="h-full">
        <div className="mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Operaciones</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tareas internas del equipo, no vinculadas a proyectos de clientes
            </p>
          </div>
        </div>

        <KanbanBoard mode="internal" />
      </div>
    </AppLayout>
  );
}
