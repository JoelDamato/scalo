import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, FolderOpen, Link2, Loader2, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import scaloLogo from '@/assets/scalo-logo.png';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type PublicInstructionRow = {
  project_id: string;
  project_name: string;
  project_description: string | null;
  instruction_id: string | null;
  category: string | null;
  title: string | null;
  description: string | null;
  instruction_url: string | null;
  updated_at: string | null;
};

function getInstructionCategoryLabel(category: string | null | undefined) {
  return category?.trim() || 'General';
}

export default function PublicProjectInstructions() {
  const { token = '' } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-project-instructions', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_project_instructions', {
        p_token: token,
      });

      if (error) throw error;
      return (data ?? []) as PublicInstructionRow[];
    },
    enabled: !!token,
  });

  const project = data?.[0] ?? null;

  const instructions = useMemo(
    () =>
      (data ?? [])
        .filter((item): item is PublicInstructionRow & { instruction_id: string; title: string; description: string; updated_at: string } =>
          Boolean(item.instruction_id && item.title && item.description && item.updated_at),
        )
        .map((item) => ({
          id: item.instruction_id,
          category: item.category,
          title: item.title,
          description: item.description,
          instruction_url: item.instruction_url,
          updated_at: item.updated_at,
        })),
    [data],
  );

  const groupedInstructions = useMemo(() => {
    const groups = new Map<string, typeof instructions>();

    instructions.forEach((instruction) => {
      const category = getInstructionCategoryLabel(instruction.category);
      const currentItems = groups.get(category) || [];
      currentItems.push(instruction);
      groups.set(category, currentItems);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [instructions]);

  useDocumentTitle(project?.project_name ? `Instructivos ${project.project_name}` : 'Instructivos');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md space-y-4 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Link no disponible</h1>
          <p className="text-sm text-muted-foreground">
            Esta página de instructivos no existe o el enlace es incorrecto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
          <img src={scaloLogo} alt="Scalo" className="h-8 w-8 rounded-lg" />
          <div>
            <p className="text-sm font-semibold text-foreground">Scalo Portal</p>
            <p className="text-xs text-muted-foreground">Instructivos del cliente</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <section className="space-y-4">
          <Badge variant="outline">Acceso público</Badge>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{project.project_name}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Instructivos</h1>
            {project.project_description && (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {project.project_description}
              </p>
            )}
          </div>
        </section>

        <Separator className="my-8" />

        {groupedInstructions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="px-6 py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium text-foreground">No hay instructivos cargados todavía</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cuando el equipo agregue instructivos al proyecto, van a aparecer acá.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={groupedInstructions.map(({ category }) => category)}
            className="space-y-4"
          >
            {groupedInstructions.map(({ category, items }) => (
              <AccordionItem
                key={category}
                value={category}
                className="overflow-hidden rounded-xl border border-border/60 bg-background/30 px-4"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {category}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {items.length} instructivo{items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {items.map((instruction) => (
                      <Card key={instruction.id} className="border-border/60 bg-background/60 shadow-sm">
                        <CardHeader className="space-y-3 pb-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-base">{instruction.title}</CardTitle>
                                <Badge variant="secondary" className="gap-1">
                                  <Tag className="h-3 w-3" />
                                  {category}
                                </Badge>
                              </div>
                              <CardDescription className="mt-1">
                                Actualizado {formatDistanceToNow(new Date(instruction.updated_at), { addSuffix: true, locale: es })}
                              </CardDescription>
                            </div>
                            {instruction.instruction_url && (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <a href={instruction.instruction_url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
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
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
