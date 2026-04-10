import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Loader2, Lock, PlusCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCurrentProfile, useProfiles } from '@/hooks/useProfiles';
import { useCreateReport, useReports } from '@/hooks/useReports';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function Reports() {
  useDocumentTitle('Reportes');

  const { data: reports = [], isLoading } = useReports();
  const { data: profiles = [] } = useProfiles();
  const { data: currentProfile } = useCurrentProfile();
  const createReport = useCreateReport();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const profileByUserId = useMemo(
    () => new Map(profiles.map((profile) => [profile.user_id, profile])),
    [profiles],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    await createReport.mutateAsync({
      title,
      content,
    });

    setTitle('');
    setContent('');
  };

  return (
    <AppLayout title="Reportes" description="Registrá avances y dejalos publicados sin edición posterior">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <PlusCircle className="h-5 w-5" />
              Nuevo reporte
            </CardTitle>
            <CardDescription>
              Cada reporte se publica con la fecha del día y después queda bloqueado para edición.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-2">
                  <Label htmlFor="report-title">Título</Label>
                  <Input
                    id="report-title"
                    placeholder="Ej: Avance semanal de automatizaciones"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de publicación</Label>
                  <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-foreground">
                    {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-content">Desarrollo</Label>
                <Textarea
                  id="report-content"
                  placeholder="Contá qué se hizo, qué se entregó y cualquier contexto importante..."
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="min-h-40 resize-y"
                />
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Se guarda firmado con tu usuario
                    {currentProfile?.name ? ` (${currentProfile.name})` : ''} y no se podrá editar después.
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={createReport.isPending || !title.trim() || !content.trim()}
                >
                  {createReport.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Publicar reporte
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Historial</h2>
              <p className="text-sm text-muted-foreground">
                Reportes publicados en orden cronológico inverso.
              </p>
            </div>
            <Badge variant="secondary">{reports.length} publicados</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-36 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium">Todavía no hay reportes cargados</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Publicá el primero desde el formulario de arriba.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const author = profileByUserId.get(report.created_by);

                return (
                  <Card key={report.id}>
                    <CardHeader className="space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <CardDescription>
                            {format(new Date(`${report.report_date}T00:00:00`), "d 'de' MMMM 'de' yyyy", {
                              locale: es,
                            })}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Publicado</Badge>
                          <Badge variant="secondary">
                            {author?.name || author?.email || 'Usuario interno'}
                          </Badge>
                        </div>
                      </div>
                      <Separator />
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                        {report.content}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
