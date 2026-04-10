import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, FileText, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
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
  ProjectInstruction,
  useCreateProjectInstruction,
  useDeleteProjectInstruction,
  useProjectInstructions,
  useUpdateProjectInstruction,
} from '@/hooks/useProjectInstructions';

const instructionSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio'),
  instruction_url: z.string().trim().optional(),
  description: z.string().trim().min(1, 'La descripción es obligatoria'),
});

type InstructionFormData = z.infer<typeof instructionSchema>;

interface ProjectInstructionsTabProps {
  projectId: string;
  isAdmin: boolean;
}

function getDefaultValues(instruction?: ProjectInstruction): InstructionFormData {
  return {
    title: instruction?.title || '',
    instruction_url: instruction?.instruction_url || '',
    description: instruction?.description || '',
  };
}

export function ProjectInstructionsTab({ projectId, isAdmin }: ProjectInstructionsTabProps) {
  const { data: instructions = [], isLoading } = useProjectInstructions(projectId);
  const { data: profiles = [] } = useProfiles();
  const createInstruction = useCreateProjectInstruction();
  const updateInstruction = useUpdateProjectInstruction();
  const deleteInstruction = useDeleteProjectInstruction();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<ProjectInstruction | null>(null);
  const [deletingInstruction, setDeletingInstruction] = useState<ProjectInstruction | null>(null);

  const profileByUserId = useMemo(
    () => new Map(profiles.map((profile) => [profile.user_id, profile])),
    [profiles],
  );

  const handleDelete = async () => {
    if (!deletingInstruction) return;

    try {
      await deleteInstruction.mutateAsync({
        id: deletingInstruction.id,
        projectId,
      });
      toast.success('Instructivo eliminado');
    } catch {
      toast.error('Error al eliminar el instructivo');
    } finally {
      setDeletingInstruction(null);
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
              <FileText className="h-5 w-5" />
              Instructivos
            </CardTitle>
            <CardDescription>
              Links, guías y contexto operativo del proyecto para que el cliente y el equipo lo tengan a mano.
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Instructivo
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo Instructivo</DialogTitle>
                  <DialogDescription>
                    Agrega una guía, un link útil o información importante para este proyecto.
                  </DialogDescription>
                </DialogHeader>
                <ProjectInstructionForm
                  onSubmit={async (data) => {
                    await createInstruction.mutateAsync({
                      project_id: projectId,
                      title: data.title,
                      instruction_url: data.instruction_url || null,
                      description: data.description,
                    });
                    toast.success('Instructivo guardado');
                    setIsCreateOpen(false);
                  }}
                  isSubmitting={createInstruction.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {instructions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">Todavía no hay instructivos cargados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAdmin
                  ? 'Sube links, descripciones y pasos útiles para este proyecto.'
                  : 'Cuando el equipo cargue instructivos, los vas a ver acá.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {instructions.map((instruction) => {
                const author = instruction.created_by ? profileByUserId.get(instruction.created_by) : null;

                return (
                  <Card key={instruction.id} className="border-border/60 bg-background/40">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <CardTitle className="text-base">{instruction.title}</CardTitle>
                          <CardDescription className="mt-1">
                            Actualizado {formatDistanceToNow(new Date(instruction.updated_at), { addSuffix: true, locale: es })}
                            {author ? ` · por ${author.name || author.email}` : ''}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          {instruction.instruction_url && (
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={instruction.instruction_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingInstruction(instruction)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeletingInstruction(instruction)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {instruction.instruction_url && (
                        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Link</p>
                            <a
                              href={instruction.instruction_url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-sm text-primary hover:underline"
                            >
                              {instruction.instruction_url}
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                        {instruction.description}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingInstruction} onOpenChange={() => setEditingInstruction(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Instructivo</DialogTitle>
            <DialogDescription>
              Actualiza el título, el link o la descripción de este instructivo.
            </DialogDescription>
          </DialogHeader>
          {editingInstruction && (
            <ProjectInstructionForm
              instruction={editingInstruction}
              onSubmit={async (data) => {
                await updateInstruction.mutateAsync({
                  id: editingInstruction.id,
                  projectId,
                  updates: {
                    title: data.title,
                    instruction_url: data.instruction_url || null,
                    description: data.description,
                  },
                });
                toast.success('Instructivo actualizado');
                setEditingInstruction(null);
              }}
              isSubmitting={updateInstruction.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingInstruction} onOpenChange={() => setDeletingInstruction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar instructivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará {deletingInstruction?.title}. Esta acción no se puede deshacer.
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

function ProjectInstructionForm({
  instruction,
  onSubmit,
  isSubmitting,
}: {
  instruction?: ProjectInstruction;
  onSubmit: (data: InstructionFormData) => Promise<void>;
  isSubmitting: boolean;
}) {
  const form = useForm<InstructionFormData>({
    resolver: zodResolver(instructionSchema),
    defaultValues: getDefaultValues(instruction),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Acceso al panel de Meta Ads" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instruction_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (opcional)</FormLabel>
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
                  placeholder="Explica para qué sirve, qué mirar o qué pasos seguir..."
                  className="min-h-36 resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {instruction ? 'Guardar cambios' : 'Guardar instructivo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
