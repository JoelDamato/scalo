import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, Lock, Send, Trash2, Webhook } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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

type WebhookApiKeyRow = {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function generateWebhookToken() {
  const randomBytes = new Uint8Array(24);
  window.crypto.getRandomValues(randomBytes);
  const suffix = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `scalo_whk_${suffix}`;
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
  const [apiKeys, setApiKeys] = useState<WebhookApiKeyRow[]>([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('n8n principal');
  const [freshApiKey, setFreshApiKey] = useState('');
  const [showFreshApiKey, setShowFreshApiKey] = useState(false);

  const curlExample = useMemo(() => `curl -X POST '${endpointUrl}' \\
  -H 'x-webhook-key: <webhook_api_key>' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(examples[0].body)}'`, []);

  const tokenPreview = sessionToken
    ? showToken
      ? sessionToken
      : `${sessionToken.slice(0, 24)}...${sessionToken.slice(-16)}`
      : 'Cargá tu token de sesión para copiarlo.';

  const loadApiKeys = async () => {
    setIsLoadingApiKeys(true);
    try {
      const { data, error } = await supabase
        .from('webhook_api_keys')
        .select('id, name, token_prefix, last_used_at, revoked_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys((data || []) as WebhookApiKeyRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude cargar las API keys');
    } finally {
      setIsLoadingApiKeys(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

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

  const createApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast.error('Poné un nombre para la API key');
      return;
    }

    setIsCreatingApiKey(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('No pude validar tu sesión');
      }

      const rawToken = generateWebhookToken();
      const tokenHash = await sha256Hex(rawToken);

      const { error } = await supabase.from('webhook_api_keys').insert({
        name: newApiKeyName.trim(),
        token_prefix: rawToken.slice(0, 16),
        token_hash: tokenHash,
        created_by: user.id,
      });

      if (error) throw error;

      setFreshApiKey(rawToken);
      setShowFreshApiKey(true);
      toast.success('API key creada');
      setNewApiKeyName('n8n principal');
      await loadApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude crear la API key');
    } finally {
      setIsCreatingApiKey(false);
    }
  };

  const revokeApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('API key revocada');
      await loadApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude revocar la API key');
    }
  };

  const copyFreshApiKey = async () => {
    if (!freshApiKey) return;
    try {
      await navigator.clipboard.writeText(freshApiKey);
      toast.success('API key copiada');
    } catch {
      toast.error('No pude copiar la API key');
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
                  Podés usar `x-webhook-key` estable o el `Authorization: Bearer` de tu sesión para tests.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  Permisos
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Las API keys se crean desde un admin y sirven para automatizaciones sin depender del vencimiento de la sesión.
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
            <CardTitle>API keys estables</CardTitle>
            <CardDescription>
              Estas llaves no dependen del vencimiento del JWT. Son la opción recomendada para n8n, Make y webhooks persistentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:flex-row">
              <Input
                value={newApiKeyName}
                onChange={(event) => setNewApiKeyName(event.target.value)}
                placeholder="Nombre de la API key"
              />
              <Button type="button" onClick={createApiKey} disabled={isCreatingApiKey}>
                {isCreatingApiKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Crear API key
              </Button>
            </div>

            {freshApiKey ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-sm font-medium">Copiala ahora</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Después solo queda guardado el hash. Si la perdés, generás otra.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <code className="min-w-0 break-all text-xs text-muted-foreground">
                    {showFreshApiKey ? freshApiKey : `${freshApiKey.slice(0, 16)}...${freshApiKey.slice(-8)}`}
                  </code>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowFreshApiKey((value) => !value)}>
                      {showFreshApiKey ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {showFreshApiKey ? 'Ocultar' : 'Ver'}
                    </Button>
                    <Button type="button" size="sm" onClick={copyFreshApiKey}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {isLoadingApiKeys ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando API keys...
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                  Todavía no generaste ninguna API key.
                </div>
              ) : (
                apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{apiKey.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {apiKey.token_prefix}... · {apiKey.revoked_at ? 'Revocada' : apiKey.last_used_at ? `Último uso: ${new Date(apiKey.last_used_at).toLocaleString()}` : 'Sin uso todavía'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => revokeApiKey(apiKey.id)}
                      disabled={!!apiKey.revoked_at}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {apiKey.revoked_at ? 'Revocada' : 'Revocar'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token de mi sesión</CardTitle>
            <CardDescription>
              Este es el access token del usuario logueado. Úsalo para pruebas rápidas; para producción conviene una API key estable.
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
              El endpoint acepta `POST`. Recomendado: `x-webhook-key`. También sigue aceptando `Authorization: Bearer`.
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
                role: 'admin',
                auth_mode: 'api_key',
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
