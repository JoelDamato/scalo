import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityList } from '@/components/activity/ActivityList';
import { useActivities } from '@/hooks/useData';
import { useProfiles } from '@/hooks/useProfiles';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityItem } from '@/types';
import { useMemo } from 'react';

export default function Activity() {
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const { data: profiles = [] } = useProfiles();

  // Transform database activities to ActivityItem format
  const formattedActivity: ActivityItem[] = useMemo(() => {
    return activities.map(activity => {
      const userProfile = profiles.find(p => p.user_id === activity.user_id);
      return {
        id: activity.id,
        type: activity.type as ActivityItem['type'],
        message: activity.message,
        userId: activity.user_id,
        user: {
          id: activity.user_id,
          name: userProfile?.name || 'Usuario',
          email: userProfile?.email || '',
          role: 'admin' as const,
          avatar: userProfile?.avatar_url || undefined
        },
        projectId: activity.project_id || undefined,
        taskId: activity.task_id || undefined,
        createdAt: activity.created_at
      };
    });
  }, [activities, profiles]);

  if (activitiesLoading) {
    return (
      <AppLayout title="Actividad" description="Actualizaciones y cambios recientes">
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Actividad" description="Actualizaciones y cambios recientes">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Feed de actividad</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Todas las actualizaciones recientes de tus proyectos
          </p>
        </div>

        {formattedActivity.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay actividad reciente</p>
            <p className="text-sm mt-1">Las acciones en proyectos y tareas aparecerán aquí</p>
          </div>
        ) : (
          <ActivityList activity={formattedActivity} />
        )}
      </div>
    </AppLayout>
  );
}
