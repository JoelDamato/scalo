import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGoogleCalendarExchange } from '@/hooks/useGoogleCalendar';

export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exchange = useGoogleCalendarExchange();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google canceló la autorización');
      if (window.opener) {
        window.opener.postMessage(
          { type: 'google-calendar-error', message: 'Google canceló la autorización' },
          window.location.origin,
        );
        window.close();
      } else {
        navigate('/settings', { replace: true });
      }
      return;
    }

    if (!code || !state) {
      toast.error('Faltan datos para conectar Google Calendar');
      navigate('/settings', { replace: true });
      return;
    }

    exchange
      .mutateAsync({ code, state })
      .then(() => {
        toast.success('Google Calendar conectado');
        if (window.opener) {
          window.opener.postMessage({ type: 'google-calendar-connected' }, window.location.origin);
          window.close();
          return;
        }

        navigate('/settings', { replace: true });
      })
      .catch((exchangeError) => {
        const message = exchangeError instanceof Error ? exchangeError.message : 'No pude conectar Google Calendar';
        toast.error(message);
        if (window.opener) {
          window.opener.postMessage({ type: 'google-calendar-error', message }, window.location.origin);
          window.close();
          return;
        }

        navigate('/settings', { replace: true });
      });
  }, [exchange, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="text-lg font-semibold">Conectando Google Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Estamos terminando la autorización. Esta ventana se cierra sola cuando quede lista.
        </p>
      </div>
    </div>
  );
}
