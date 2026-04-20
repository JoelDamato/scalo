import { useMemo, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, Lock, Send, Webhook } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const endpointUrl = 'https://imkbxtolhutpxcvhwbtd.supabase.co/functions/v1/system-webhook';

const actions = [
  { name: 'create_task', description: 'Crea una tarea en un proyecto o una tarea interna.' },
  { name: 'update_task', description: 'Actualiza título, descripción, estado, visibilidad o agenda de una tarea.' },
  { name: 'read_project', description: 'Lee un proyecto por ID o nombre, opcionalmente con sus tareas.' },
  { name: 'update_project', description: 'Modifica nombre, descripción, estado, soporte activo o cliente asociado.' },
  { name: 'create_report', description: 'Publica un reporte nuevo.' },
  { name: 'read_report', description: 'Lee un reporte por ID.' },
  { name: 'list_reports', description: 'Lista reportes recientes.' },
  { name: 'add_report_addendum', description: 'Agrega una adenda a un reporte ya publicado.' },
];

const examples = [
  {
    title: 'Crear tarea en proyecto',
    body: {
      action: 'create_task',
      payload: {
        project_id: 'uuid-del-proyecto',
        title: 'Revisar integración de pagos',
        description: 'Validar payload, logs y respuesta del proveedor.',
        status: 'backlog',
        is_client_visible: false,
      },
    },
  },
  {
    title: 'Crear tarea interna',
    body: {
      action: 'create_task',
      payload: {
        internal: true,
        title: 'Ordenar backlog operativo',
        status: 'backlog',
      },
    },
  },
  {
    title: 'Actualizar tarea',
    body: {
      action: 'update_task',
      payload: {
        task_id: 'uuid-de-la-tarea',
        status: 'done',
      },
    },
  },
  {
    title: 'Leer proyecto con tareas',
    body: {
      action: 'read_project',
      payload: {
        project_name: 'Portal Scalo',
        include_tasks: true,
      },
    },
  },
  {
    title: 'Modificar proyecto',
    body: {
      action: 'update_project',
      payload: {
        project_id: 'uuid-del-proyecto',
        support_active: true,
        status: 'active',
      },
    },
  },
  {
    title: 'Crear reporte',
    body: {
      action: 'create_report',
      payload: {
        title: 'Reporte diario',
        content: 'Resumen de avances, bloqueos y próximos pasos.',
        report_date: '2026-04-20',
      },
    },
  },
  {
    title: 'Agregar adenda a reporte',
    body: {
      action: 'add_report_addendum',
      payload: {
        report_id: 'uuid-del-reporte',
        title: 'Actualización',
        content: 'Se agrega contexto posterior a la publicación.',
      },
    },
  },
];

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function CodeBlock({ value, copyLabel = 'Copiar' }: { value: string; copyLabel?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copiado');
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error('No pude copiar');
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
        <span className="text-xs text-muted-foreground">{copyLabel}</span>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Listo' : 'Copiar'}
        </Button>
      </div>
      <pre className="max-h-[360px] overflow-auto p-3 text-xs leading-5">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export default function WebhookDocs() {
  const [sessionToken, setSessionToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<unknown>(null);

  const curlExample = useMemo(() => `curl -X POST '${endpointUrl}' \\
  -H 'Authorization: Bearer <access_token>' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(examples[0].body)}'`, []);

  const tokenPreview = sessionToken
    ? showToken
      ? sessionToken
      : `${sessionToken.slice(0, 24)}...${sessionToken.slice(-16)}`
    : 'Cargá tu token de sesión para copiarlo.';

  const loadSessionToken = async () => {
    setIsLoadingToken(true);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      const token = data.session?.access_token;
      if (!token) {
        toast.error('No hay sesión activa');
        return;
      }

      setSessionToken(token);
      toast.success('Token cargado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude cargar el token');
    } finally {
      setIsLoadingToken(false);
    }
  };

  const copySessionToken = async () => {
    if (!sessionToken) {
      await loadSessionToken();
      return;
    }

    try {
      await navigator.clipboard.writeText(sessionToken);
      toast.success('Token copiado');
    } catch {
      toast.error('No pude copiar el token');
    }
  };

  const testEndpoint = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      let token = sessionToken;

      if (!token) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        token = data.session?.access_token || '';
        setSessionToken(token);
      }

      if (!token) {
        throw new Error('No hay sesión activa para probar el endpoint');
      }

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_reports',
          payload: { limit: 1 },
        }),
      });

      const data = await response.json();
      setTestResult(data);

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || `Error ${response.status}`);
      }

      toast.success('Endpoint funcionando');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falló el test');
      setTestResult({
        ok: false,
        error: error instanceof Error ? error.message : 'Falló el test',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AppLayout title="Webhooks" description="Documentación para integraciones internas">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Endpoint del sistema
                </CardTitle>
                <CardDescription className="mt-1">
                  Usá este endpoint para cargar tareas, crear reportes y leer o modificar proyectos desde automatizaciones.
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit">Solo internos</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock value={endpointUrl} copyLabel="URL" />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <KeyRound className="h-4 w-4" />
                  Autenticación
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enviá el access token del usuario en `Authorization: Bearer`.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  Permisos
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Los clientes quedan bloqueados. Admin y dev pasan por RLS, así que el acceso sigue limitado.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Send className="h-4 w-4" />
                  Formato
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mandá siempre `action` y `payload` como JSON.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token de mi sesión</CardTitle>
            <CardDescription>
              Este es el access token del usuario logueado. Copialo para probar desde Postman, n8n, Make o cualquier automatización.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="min-w-0 break-all text-xs text-muted-foreground">
                  {tokenPreview}
                </code>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={loadSessionToken} disabled={isLoadingToken}>
                    {isLoadingToken ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Cargar token
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowToken((value) => !value)} disabled={!sessionToken}>
                    {showToken ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showToken ? 'Ocultar' : 'Ver'}
                  </Button>
                  <Button type="button" size="sm" onClick={copySessionToken}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar token
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              Este token vence y representa tu sesión. No lo pegues en lugares públicos ni lo compartas con clientes.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                El test usa `list_reports` con `limit: 1`, no modifica datos.
              </p>
              <Button type="button" onClick={testEndpoint} disabled={isTesting}>
                {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Probar endpoint
              </Button>
            </div>

            {testResult !== null && (
              <CodeBlock value={stringify(testResult)} copyLabel="Resultado del test" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request base</CardTitle>
            <CardDescription>
              El endpoint acepta `POST`. El token tiene que pertenecer a un usuario interno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock value={curlExample} copyLabel="cURL" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones disponibles</CardTitle>
            <CardDescription>
              Las acciones están acotadas. No se ejecuta SQL libre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {actions.map((action) => (
                <div key={action.name} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <code className="text-sm font-semibold">{action.name}</code>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ejemplos de payload</CardTitle>
            <CardDescription>
              Podés copiar cualquiera de estos cuerpos y cambiar IDs o textos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {examples.map((example, index) => (
              <div key={example.title} className="space-y-2">
                {index > 0 && <Separator />}
                <h3 className="pt-2 text-sm font-semibold">{example.title}</h3>
                <CodeBlock value={stringify(example.body)} copyLabel={example.title} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Respuesta</CardTitle>
            <CardDescription>
              Cuando sale bien, el endpoint devuelve `ok: true` y el resultado de la acción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock
              copyLabel="Respuesta exitosa"
              value={stringify({
                ok: true,
                action: 'create_task',
                role: 'dev',
                result: {
                  task: {
                    id: 'uuid-de-la-tarea',
                    title: 'Revisar integración de pagos',
                    status: 'backlog',
                  },
                },
              })}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
