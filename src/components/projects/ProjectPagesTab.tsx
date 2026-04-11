import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Globe, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useProfiles } from '@/hooks/useProfiles';
import {
  ProjectPage,
  useCreateProjectPage,
  useDeleteProjectPage,
  useProjectPages,
  useUpdateProjectPage,
} from '@/hooks/useProjectPages';

const pageSchema = z.object({
  title: z.string().trim().min(1, 'El nombre es obligatorio'),
  page_url: z.string().trim().url('Ingresa una URL válida'),
  description: z.string().trim().optional(),
});

type PageFormData = z.infer<typeof pageSchema>;

interface ProjectPagesTabProps {
  projectId: string;
  isAdmin: boolean;
}

function getDefaultValues(page?: ProjectPage): PageFormData {
  return {
    title: page?.title || '',
    page_url: page?.page_url || '',
    description: page?.description || '',
  };
}

export function ProjectPagesTab({ projectId, isAdmin }: ProjectPagesTabProps) {
  const { data: pages = [], isLoading } = useProjectPages(projectId);
  const { data: profiles = [] } = useProfiles();
  const createPage = useCreateProjectPage();
  const updatePage = useUpdateProjectPage();
  const deletePage = useDeleteProjectPage();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ProjectPage | null>(null);
  const [deletingPage, setDeletingPage] = useState<ProjectPage | null>(null);

  const profileByUserId = useMemo(
    () => new Map(profiles.map((profile) => [profile.user_id, profile])),
    [profiles],
  );

  const handleDelete = async () => {
    if (!deletingPage) return;

    try {
      await deletePage.mutateAsync({
        id: deletingPage.id,
        projectId,
      });
      toast.success('Página eliminada');
    } catch {
      toast.error('Error al eliminar la página');
    } finally {
      setDeletingPage(null);
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
              <Globe className="h-5 w-5" />
              Páginas
            </CardTitle>
            <CardDescription>
              Reúne links clave del proyecto como métricas, dashboards, landings, docs o assets compartidos.
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Página
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva Página</DialogTitle>
                  <DialogDescription>
                    Carga un link importante del proyecto con una descripción corta para ubicarlo rápido.
                  </DialogDescription>
                </DialogHeader>
                <ProjectPageForm
                  onSubmit={async (data) => {
                    await createPage.mutateAsync({
                      project_id: projectId,
                      title: data.title,
                      page_url: data.page_url,
                      description: data.description || null,
                    });
                    toast.success('Página guardada');
                    setIsCreateOpen(false);
                  }}
                  isSubmitting={createPage.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
              <Globe className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">Todavía no hay páginas cargadas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAdmin
                  ? 'Agrega links de métricas, páginas, paneles o documentos importantes.'
                  : 'Cuando el equipo cargue páginas útiles del proyecto, las vas a ver acá.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pages.map((page) => {
                const author = page.created_by ? profileByUserId.get(page.created_by) : null;

                return (
                  <Card key={page.id} className="border-border/60 bg-background/40">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <CardTitle className="text-base">{page.title}</CardTitle>
                          <CardDescription className="mt-1">
                            Actualizado {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true, locale: es })}
                            {author ? ` · por ${author.name || author.email}` : ''}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={page.page_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingPage(page)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeletingPage(page)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">Link</p>
                          <a
                            href={page.page_url}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-sm text-primary hover:underline"
                          >
                            {page.page_url}
                          </a>
                        </div>
                      </div>

                      {page.description && (
                        <div className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                          {page.description}
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

      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Página</DialogTitle>
            <DialogDescription>
              Actualiza el nombre, el link o la descripción de esta página.
            </DialogDescription>
          </DialogHeader>
          {editingPage && (
            <ProjectPageForm
              page={editingPage}
              onSubmit={async (data) => {
                await updatePage.mutateAsync({
                  id: editingPage.id,
                  projectId,
                  updates: {
                    title: data.title,
                    page_url: data.page_url,
                    description: data.description || null,
                  },
                });
                toast.success('Página actualizada');
                setEditingPage(null);
              }}
              isSubmitting={updatePage.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPage} onOpenChange={() => setDeletingPage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar página?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción quitará <strong>{deletingPage?.title}</strong> del proyecto.
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

interface ProjectPageFormProps {
  page?: ProjectPage;
  onSubmit: (data: PageFormData) => Promise<void>;
  isSubmitting: boolean;
}

function ProjectPageForm({ page, onSubmit, isSubmitting }: ProjectPageFormProps) {
  const form = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: getDefaultValues(page),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Métricas, Dashboard Ads, Landing principal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="page_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Qué es esta página y para qué sirve"
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : page ? 'Guardar Cambios' : 'Guardar Página'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
