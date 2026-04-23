import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BadgeCheck,
  Loader2,
  MessageSquare,
  Play,
  QrCode,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useWhatsAppConnect,
  useWhatsAppRefresh,
  useWhatsAppReminderDelete,
  useWhatsAppReminderRunNow,
  useWhatsAppReminders,
  useWhatsAppReminderToggle,
  useWhatsAppReminderUpsert,
  useWhatsAppSaveConfig,
  useWhatsAppSendTest,
  useWhatsAppStatus,
  type WhatsAppReminder,
} from '@/hooks/useWhatsAppIntegration';

const cronPresets = [
  { label: 'Todos los días 09:00', value: '0 9 * * *' },
  { label: 'Lunes a viernes 18:00', value: '0 18 * * 1-5' },
  { label: 'Cada hora', value: '0 * * * *' },
];

const defaultReminderForm = {
  id: '',
  title: '',
  phone_number: '',
  message_template: '',
  cron_expression: '0 9 * * *',
  timezone: 'America/Argentina/Buenos_Aires',
  send_delay_ms: '0',
  active: true,
};

export default function WhatsAppPage() {
  const statusQuery = useWhatsAppStatus();
  const remindersQuery = useWhatsAppReminders();
  const saveConfig = useWhatsAppSaveConfig();
  const connectInstance = useWhatsAppConnect();
  const refreshInstance = useWhatsAppRefresh();
  const sendTest = useWhatsAppSendTest();
  const upsertReminder = useWhatsAppReminderUpsert();
  const deleteReminder = useWhatsAppReminderDelete();
  const toggleReminder = useWhatsAppReminderToggle();
  const runNowReminder = useWhatsAppReminderRunNow();

  const integration = statusQuery.data?.integration || null;
  const reminders = remindersQuery.data?.reminders || [];
  const runs = remindersQuery.data?.runs || [];

  const [configForm, setConfigForm] = useState({
    label: 'Principal',
    evolution_api_url: '',
    evolution_api_key: '',
    instance_name: '',
    instance_phone_number: '',
    instance_token: '',
  });
  const [testForm, setTestForm] = useState({
    phone_number: '',
    message: 'Primer test desde Scalo por WhatsApp.',
  });
  const [reminderForm, setReminderForm] = useState(defaultReminderForm);

  useEffect(() => {
    if (!integration) return;

    setConfigForm((current) => ({
      ...current,
      label: integration.label || 'Principal',
      evolution_api_url: integration.evolution_api_url || '',
      evolution_api_key: '',
      instance_name: integration.instance_name || '',
      instance_phone_number: integration.instance_phone_number || '',
      instance_token: integration.instance_token || '',
    }));
  }, [integration]);

  const qrImageSrc = useMemo(() => {
    if (!integration?.qr_code) return null;
    return integration.qr_code.startsWith('data:')
      ? integration.qr_code
      : `data:image/png;base64,${integration.qr_code}`;
  }, [integration?.qr_code]);

  const handleSaveConfig = async () => {
    try {
      await saveConfig.mutateAsync(configForm);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude guardar la configuración');
    }
  };

  const handleConnect = async () => {
    try {
      await connectInstance.mutateAsync();
      toast.success('WhatsApp listo para vincular');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude iniciar la vinculación');
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshInstance.mutateAsync();
      toast.success('Estado sincronizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude sincronizar el estado');
    }
  };

  const handleSendTest = async () => {
    try {
      await sendTest.mutateAsync(testForm);
      toast.success('Prueba enviada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude enviar la prueba');
    }
  };

  const handleSaveReminder = async () => {
    try {
      await upsertReminder.mutateAsync({
        id: reminderForm.id || undefined,
        title: reminderForm.title,
        phone_number: reminderForm.phone_number,
        message_template: reminderForm.message_template,
        cron_expression: reminderForm.cron_expression,
        timezone: reminderForm.timezone,
        send_delay_ms: Number(reminderForm.send_delay_ms || '0'),
        active: reminderForm.active,
      });
      toast.success(reminderForm.id ? 'Recordatorio actualizado' : 'Recordatorio creado');
      setReminderForm(defaultReminderForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude guardar el recordatorio');
    }
  };

  const editReminder = (reminder: WhatsAppReminder) => {
    setReminderForm({
      id: reminder.id,
      title: reminder.title,
      phone_number: reminder.phone_number,
      message_template: reminder.message_template,
      cron_expression: reminder.cron_expression,
      timezone: reminder.timezone,
      send_delay_ms: String(reminder.send_delay_ms || 0),
      active: reminder.active,
    });
  };

  return (
    <AppLayout title="WhatsApp" description="Conectá Evolution API y programá recordatorios por WhatsApp">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conexión de WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Esta sección es solo para admin. Acá vinculás Evolution API y dejás lista la instancia.
                  </CardDescription>
                </div>
                <Badge variant={integration?.status === 'connected' ? 'default' : 'outline'}>
                  {integration?.status || 'sin configurar'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wa-label">Nombre</Label>
                  <Input
                    id="wa-label"
                    value={configForm.label}
                    onChange={(event) => setConfigForm((current) => ({ ...current, label: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wa-instance">Instancia</Label>
                  <Input
                    id="wa-instance"
                    value={configForm.instance_name}
                    onChange={(event) => setConfigForm((current) => ({ ...current, instance_name: event.target.value }))}
                    placeholder="scalo-principal"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="wa-url">URL de Evolution API</Label>
                  <Input
                    id="wa-url"
                    value={configForm.evolution_api_url}
                    onChange={(event) => setConfigForm((current) => ({ ...current, evolution_api_url: event.target.value }))}
                    placeholder="https://tu-servidor-evolution.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wa-key">API key</Label>
                  <Input
                    id="wa-key"
                    type="password"
                    value={configForm.evolution_api_key}
                    onChange={(event) => setConfigForm((current) => ({ ...current, evolution_api_key: event.target.value }))}
                    placeholder={integration?.api_key_preview || 'Pegá la API key'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wa-phone">Número del WhatsApp</Label>
                  <Input
                    id="wa-phone"
                    value={configForm.instance_phone_number}
                    onChange={(event) => setConfigForm((current) => ({ ...current, instance_phone_number: event.target.value }))}
                    placeholder="54911..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="wa-token">Token de instancia</Label>
                  <Input
                    id="wa-token"
                    value={configForm.instance_token}
                    onChange={(event) => setConfigForm((current) => ({ ...current, instance_token: event.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveConfig} disabled={saveConfig.isPending}>
                  {saveConfig.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar
                </Button>
                <Button variant="secondary" onClick={handleConnect} disabled={connectInstance.isPending || !integration && saveConfig.isPending}>
                  {connectInstance.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                  Vincular WhatsApp
                </Button>
                <Button variant="outline" onClick={handleRefresh} disabled={refreshInstance.isPending}>
                  {refreshInstance.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Sincronizar
                </Button>
              </div>

              <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Número conectado</p>
                  <p className="text-sm font-medium">{integration?.connected_phone || 'Todavía no conectado'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Perfil</p>
                  <p className="text-sm font-medium">{integration?.profile_name || 'Sin perfil todavía'}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Último sync</p>
                  <p className="text-sm font-medium">
                    {integration?.last_synced_at
                      ? format(new Date(integration.last_synced_at), "d 'de' MMMM, HH:mm", { locale: es })
                      : 'Sin sincronización todavía'}
                  </p>
                </div>
                {integration?.last_error ? (
                  <div className="md:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {integration.last_error}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5" />
                QR, pairing y prueba
              </CardTitle>
              <CardDescription>
                Cuando la instancia no está abierta, refrescá y escaneá el QR o usá el pairing code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                {qrImageSrc ? (
                  <img src={qrImageSrc} alt="QR de WhatsApp" className="mx-auto h-56 w-56 rounded-md object-contain" />
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-border/70 text-sm text-muted-foreground">
                    Todavía no hay QR disponible.
                  </div>
                )}
                <div className="mt-3 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pairing code</p>
                  <p className="break-all rounded-md bg-background px-3 py-2 font-mono text-sm">
                    {integration?.pairing_code || 'Sin pairing code'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="test-phone">Número para prueba</Label>
                  <Input
                    id="test-phone"
                    value={testForm.phone_number}
                    onChange={(event) => setTestForm((current) => ({ ...current, phone_number: event.target.value }))}
                    placeholder="54911..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-message">Mensaje de prueba</Label>
                  <Textarea
                    id="test-message"
                    value={testForm.message}
                    onChange={(event) => setTestForm((current) => ({ ...current, message: event.target.value }))}
                    rows={4}
                  />
                </div>
                <Button className="w-full" onClick={handleSendTest} disabled={sendTest.isPending}>
                  {sendTest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Enviar prueba
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Nuevo recordatorio</CardTitle>
              <CardDescription>
                Guardá el cron y Scalo lo va a disparar solo por WhatsApp usando la instancia conectada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reminder-title">Título</Label>
                  <Input
                    id="reminder-title"
                    value={reminderForm.title}
                    onChange={(event) => setReminderForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-phone">Número</Label>
                  <Input
                    id="reminder-phone"
                    value={reminderForm.phone_number}
                    onChange={(event) => setReminderForm((current) => ({ ...current, phone_number: event.target.value }))}
                    placeholder="54911..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reminder-message">Mensaje</Label>
                  <Textarea
                    id="reminder-message"
                    value={reminderForm.message_template}
                    onChange={(event) => setReminderForm((current) => ({ ...current, message_template: event.target.value }))}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-cron">Cron</Label>
                  <Input
                    id="reminder-cron"
                    value={reminderForm.cron_expression}
                    onChange={(event) => setReminderForm((current) => ({ ...current, cron_expression: event.target.value }))}
                    placeholder="0 18 * * 1-5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-timezone">Timezone</Label>
                  <Input
                    id="reminder-timezone"
                    value={reminderForm.timezone}
                    onChange={(event) => setReminderForm((current) => ({ ...current, timezone: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-delay">Delay en ms</Label>
                  <Input
                    id="reminder-delay"
                    type="number"
                    min="0"
                    value={reminderForm.send_delay_ms}
                    onChange={(event) => setReminderForm((current) => ({ ...current, send_delay_ms: event.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Activo</p>
                    <p className="text-xs text-muted-foreground">Si está prendido, el cron queda programado.</p>
                  </div>
                  <Switch
                    checked={reminderForm.active}
                    onCheckedChange={(checked) => setReminderForm((current) => ({ ...current, active: checked }))}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {cronPresets.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReminderForm((current) => ({ ...current, cron_expression: preset.value }))}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveReminder} disabled={upsertReminder.isPending}>
                  {upsertReminder.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {reminderForm.id ? 'Actualizar' : 'Crear recordatorio'}
                </Button>
                {reminderForm.id ? (
                  <Button variant="outline" onClick={() => setReminderForm(defaultReminderForm)}>
                    Cancelar edición
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recordatorios cargados</CardTitle>
              <CardDescription>
                Desde acá los editás, los pausás o los corrés manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="overflow-hidden rounded-lg border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recordatorio</TableHead>
                      <TableHead>Cron</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Todavía no hay recordatorios cargados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reminders.map((reminder) => (
                        <TableRow key={reminder.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{reminder.title}</p>
                              <p className="text-xs text-muted-foreground">{reminder.phone_number}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{reminder.cron_expression}</TableCell>
                          <TableCell>
                            <Badge variant={reminder.active ? 'default' : 'outline'}>
                              {reminder.active ? 'Activo' : 'Pausado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => editReminder(reminder)}>
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => runNowReminder.mutate(reminder.id)}
                                disabled={runNowReminder.isPending}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleReminder.mutate({ id: reminder.id, active: !reminder.active })}
                                disabled={toggleReminder.isPending}
                              >
                                <BadgeCheck className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => deleteReminder.mutate(reminder.id)}
                                disabled={deleteReminder.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Últimas ejecuciones</h3>
                <div className="space-y-2">
                  {runs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todavía no hay ejecuciones registradas.</p>
                  ) : (
                    runs.map((run) => (
                      <div key={run.id} className="rounded-lg border border-border/70 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant={run.status === 'queued' ? 'default' : 'outline'}>{run.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(run.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{run.detail || 'Sin detalle'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
