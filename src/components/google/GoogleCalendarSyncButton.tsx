import { CalendarPlus, CalendarSync, CalendarX2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleCalendarStatus, useGoogleCalendarSync, useGoogleCalendarSyncs } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';

interface GoogleCalendarSyncButtonProps {
  sourceType: 'task' | 'project_event';
  sourceId: string;
  disabled?: boolean;
  className?: string;
}

export function GoogleCalendarSyncButton({
  sourceType,
  sourceId,
  disabled,
  className,
}: GoogleCalendarSyncButtonProps) {
  const status = useGoogleCalendarStatus();
  const { data: syncs = [] } = useGoogleCalendarSyncs(sourceType, [sourceId]);
  const syncMutation = useGoogleCalendarSync(sourceType);

  const isConnected = status.data?.connected;
  const existingSync = syncs[0];
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!isConnected) {
    return null;
  }

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync({ sourceId, timeZone });
      toast.success(existingSync ? 'Google Calendar actualizado' : 'Agregado a Google Calendar');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude sincronizar con Google Calendar');
    }
  };

  const handleRemove = async () => {
    try {
      await syncMutation.mutateAsync({ sourceId, action: 'remove', timeZone });
      toast.success('Evento eliminado de Google Calendar');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude quitarlo de Google Calendar');
    }
  };

  if (existingSync) {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          disabled={disabled || syncMutation.isPending}
          onClick={handleSync}
        >
          {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarSync className="mr-2 h-4 w-4" />}
          Actualizar Google
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={className}
          disabled={disabled || syncMutation.isPending}
          onClick={handleRemove}
        >
          <CalendarX2 className="mr-2 h-4 w-4" />
          Quitar
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={disabled || syncMutation.isPending}
      onClick={handleSync}
    >
      {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
      Google Calendar
    </Button>
  );
}
