import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Link2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ProjectCredential,
  useCreateProjectCredential,
  useDeleteProjectCredential,
  useProjectCredentials,
  useUpdateProjectCredential,
} from '@/hooks/useProjectCredentials';

const credentialSchema = z.object({
  tool_name: z.string().trim().min(1, 'La herramienta es obligatoria'),
  access_url: z.string().trim().optional(),
  username: z.string().trim().optional(),
  password: z.string().trim().min(1, 'La contraseña es obligatoria'),
  notes: z.string().trim().optional(),
});

type CredentialFormData = z.infer<typeof credentialSchema>;

interface ProjectCredentialsTabProps {
  projectId: string;
}

function getDefaultValues(credential?: ProjectCredential): CredentialFormData {
  return {
    tool_name: credential?.tool_name || '',
    access_url: credential?.access_url || '',
    username: credential?.username || '',
    password: credential?.password || '',
    notes: credential?.notes || '',
  };
}

export function ProjectCredentialsTab({ projectId }: ProjectCredentialsTabProps) {
  const { data: credentials = [], isLoading } = useProjectCredentials(projectId);
  const createCredential = useCreateProjectCredential();
  const updateCredential = useUpdateProjectCredential();
  const deleteCredential = useDeleteProjectCredential();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<ProjectCredential | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<ProjectCredential | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (credentialId: string) => {
    setVisiblePasswords((current) => ({
      ...current,
      [credentialId]: !current[credentialId],
    }));
  };

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado al portapapeles`);
    } catch {
      toast.error(`No pude copiar ${label.toLowerCase()}`);
    }
  };

  const handleDelete = async () => {
    if (!deletingCredential) return;

    try {
      await deleteCredential.mutateAsync({
        id: deletingCredential.id,
        projectId,
      });
      toast.success('Acceso eliminado');
    } catch {
      toast.error('Error al eliminar el acceso');
    } finally {
      setDeletingCredential(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5" />
              Contraseñas y Accesos
            </CardTitle>
            <CardDescription>
              Guarda accesos de herramientas del proyecto. Esta sección es privada para el equipo interno.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Acceso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo Acceso</DialogTitle>
                <DialogDescription>
                  Registra usuario y contraseña de una herramienta vinculada a este proyecto.
                </DialogDescription>
              </DialogHeader>
              <ProjectCredentialForm
                onSubmit={async (data) => {
                  await createCredential.mutateAsync({
                    project_id: projectId,
                    tool_name: data.tool_name,
                    access_url: data.access_url || null,
                    username: data.username || null,
                    password: data.password,
                    notes: data.notes || null,
                  });
                  toast.success('Acceso guardado');
                  setIsCreateOpen(false);
                }}
                isSubmitting={createCredential.isPending}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
              <KeyRound className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">Todavía no hay accesos cargados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Puedes guardar usuarios, contraseñas, URL de login y notas para cada herramienta del proyecto.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {credentials.map((credential) => {
                const isPasswordVisible = visiblePasswords[credential.id] ?? false;
                const passwordText = isPasswordVisible
                  ? credential.password
                  : '•'.repeat(Math.max(credential.password.length, 8));

                return (
                  <Card key={credential.id} className="border-border/60 bg-background/40">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">{credential.tool_name}</CardTitle>
                          <CardDescription className="mt-1">
                            Actualizado {formatDistanceToNow(new Date(credential.updated_at), { addSuffix: true, locale: es })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          {credential.access_url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a href={credential.access_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingCredential(credential)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingCredential(credential)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {credential.access_url && (
                        <CredentialField
                          icon={Link2}
                          label="Login"
                          value={credential.access_url}
                          actionLabel="Copiar link"
                          onAction={() => copyValue(credential.access_url!, 'Link')}
                        />
                      )}

                      {credential.username && (
                        <CredentialField
                          icon={UserRound}
                          label="Usuario"
                          value={credential.username}
                          actionLabel="Copiar usuario"
                          onAction={() => copyValue(credential.username!, 'Usuario')}
                        />
                      )}

                      <CredentialField
                        icon={Lock}
                        label="Contraseña"
                        value={passwordText}
                        actionLabel={isPasswordVisible ? 'Ocultar' : 'Mostrar'}
                        onAction={() => togglePasswordVisibility(credential.id)}
                        secondaryActionLabel="Copiar contraseña"
                        onSecondaryAction={() => copyValue(credential.password, 'Contraseña')}
                      />

                      {credential.notes && (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Notas</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{credential.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingCredential} onOpenChange={() => setEditingCredential(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Acceso</DialogTitle>
            <DialogDescription>
              Actualiza usuario, contraseña o datos de ingreso de esta herramienta.
            </DialogDescription>
          </DialogHeader>
          {editingCredential && (
            <ProjectCredentialForm
              key={editingCredential.id}
              credential={editingCredential}
              onSubmit={async (data) => {
                await updateCredential.mutateAsync({
                  id: editingCredential.id,
                  projectId,
                  updates: {
                    tool_name: data.tool_name,
                    access_url: data.access_url || null,
                    username: data.username || null,
                    password: data.password,
                    notes: data.notes || null,
                  },
                });
                toast.success('Acceso actualizado');
                setEditingCredential(null);
              }}
              isSubmitting={updateCredential.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCredential} onOpenChange={() => setDeletingCredential(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el acceso de {deletingCredential?.tool_name}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CredentialField({
  icon: Icon,
  label,
  value,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  icon: typeof Link2;
  label: string;
  value: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  const primaryIcon = useMemo(() => {
    if (actionLabel === 'Mostrar') return Eye;
    if (actionLabel === 'Ocultar') return EyeOff;
    return Copy;
  }, [actionLabel]);

  const PrimaryIcon = primaryIcon;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </p>
          <p className="mt-1 break-all text-sm font-medium">{value}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onAction}
            aria-label={actionLabel}
            title={actionLabel}
          >
            <PrimaryIcon className="h-4 w-4" />
          </Button>
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onSecondaryAction}
              aria-label={secondaryActionLabel}
              title={secondaryActionLabel}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCredentialForm({
  credential,
  onSubmit,
  isSubmitting,
}: {
  credential?: ProjectCredential;
  onSubmit: (data: CredentialFormData) => Promise<void>;
  isSubmitting: boolean;
}) {
  const form = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: getDefaultValues(credential),
  });

  const submit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    form.reset(getDefaultValues());
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4">
        <FormField
          control={form.control}
          name="tool_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Herramienta</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Meta Ads, Hostinger, Railway" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="mail@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="access_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de acceso</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Ej: el código 2FA lo tiene el cliente / se usa solo para billing"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {credential ? 'Guardar cambios' : 'Guardar acceso'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
