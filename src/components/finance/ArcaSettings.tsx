import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Shield, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useArcaConfig, useSaveArcaConfig } from '@/hooks/useFinance';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  cuit: z.string().min(11, 'CUIT debe tener 11 dígitos').max(11, 'CUIT debe tener 11 dígitos'),
  punto_venta: z.string().min(1, 'Punto de venta requerido'),
  tipo_comprobante: z.string(),
  condicion_iva: z.string(),
  api_token: z.string().optional(),
  environment: z.enum(['testing', 'production']),
  enabled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export function ArcaSettings() {
  const { user } = useAuth();
  const { data: config, isLoading } = useArcaConfig();
  const saveConfig = useSaveArcaConfig();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cuit: config?.cuit || '',
      punto_venta: config?.punto_venta?.toString() || '1',
      tipo_comprobante: config?.tipo_comprobante || 'factura_c',
      condicion_iva: config?.condicion_iva || 'monotributo',
      api_token: '',
      environment: config?.environment || 'testing',
      enabled: config?.enabled || false,
    },
  });

  // Update form when config loads
  if (config && !form.formState.isDirty) {
    form.reset({
      cuit: config.cuit,
      punto_venta: config.punto_venta.toString(),
      tipo_comprobante: config.tipo_comprobante,
      condicion_iva: config.condicion_iva,
      api_token: '',
      environment: config.environment,
      enabled: config.enabled,
    });
  }

  const onSubmit = async (data: FormData) => {
    if (!user?.id) return;
    
    try {
      await saveConfig.mutateAsync({
        user_id: user.id,
        cuit: data.cuit,
        punto_venta: parseInt(data.punto_venta),
        tipo_comprobante: data.tipo_comprobante,
        condicion_iva: data.condicion_iva,
        api_token_encrypted: data.api_token || config?.api_token_encrypted || null,
        environment: data.environment,
        enabled: data.enabled,
      });
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Info Card */}
      <Alert className="border-blue-500/30 bg-blue-500/10">
        <Shield className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-500">Integración ARCA (AFIP)</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Conecta tu cuenta de monotributo para emitir facturas electrónicas directamente desde el portal.
          <a 
            href="https://www.afip.gob.ar/fe/documentos/WSFE-HOWTO.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 ml-2 text-blue-500 hover:underline"
          >
            Documentación AFIP <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      {/* Status */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Estado de la Integración
            </CardTitle>
            {config?.enabled ? (
              <span className="flex items-center gap-1.5 text-sm text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                Activa
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Inactiva
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Configuration Form */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Configuración ARCA</CardTitle>
          <CardDescription>
            Configura tus datos fiscales para la emisión de comprobantes electrónicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="cuit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CUIT</FormLabel>
                    <FormControl>
                      <Input placeholder="20123456789" maxLength={11} {...field} />
                    </FormControl>
                    <FormDescription>
                      Tu número de CUIT sin guiones (11 dígitos)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="punto_venta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Punto de Venta</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="99999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_comprobante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Comprobante</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="factura_c">Factura C</SelectItem>
                          <SelectItem value="factura_b">Factura B</SelectItem>
                          <SelectItem value="recibo_c">Recibo C</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="condicion_iva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición frente al IVA</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monotributo">Monotributo</SelectItem>
                        <SelectItem value="responsable_inscripto">Responsable Inscripto</SelectItem>
                        <SelectItem value="exento">Exento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="api_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token de Acceso AFIP</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={config?.api_token_encrypted ? '••••••••••••' : 'Pegar token aquí'} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Token generado desde AFIP. {config?.api_token_encrypted ? 'Ya tienes uno configurado.' : ''}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entorno</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="testing">Testing (Homologación)</SelectItem>
                        <SelectItem value="production">Producción</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Usa Testing para pruebas, Producción para facturas reales
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Habilitar Integración</FormLabel>
                      <FormDescription>
                        Activa para poder emitir facturas desde la app
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saveConfig.isPending}>
                  Guardar Configuración
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
