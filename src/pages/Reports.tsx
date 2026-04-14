import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Loader2, Lock, PlusCircle, Send } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSearchParams } from 'react-router-dom';
import { MentionInput } from '@/components/mentions/MentionInput';
import { useAuth } from '@/hooks/useAuth';
import { useMentionNotifications } from '@/hooks/useNotifications';
import { useCurrentProfile, useProfiles, type Profile } from '@/hooks/useProfiles';
import { useCreateReport, useCreateReportComment, useReportComments, useReports } from '@/hooks/useReports';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function Reports() {
  useDocumentTitle('Reportes');

  const { role } = useAuth();
  const { data: reports = [], isLoading } = useReports();
  const { data: profiles = [] } = useProfiles();
  const { data: currentProfile } = useCurrentProfile();
  const createReport = useCreateReport();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const highlightedReportId = searchParams.get('report');
  const canCommentReports = role === 'admin';

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
    setCreateDialogOpen(false);
  };

  return (
    <AppLayout title="Reportes" description="Registrá avances y dejalos publicados sin edición posterior">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Reportes
              </CardTitle>
              <CardDescription>
                Publicá avances con fecha del día y sin edición posterior.
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Crear nuevo reporte
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo reporte</DialogTitle>
                  <DialogDescription>
                    Cada reporte se publica con la fecha del día y después queda bloqueado para edición.
                  </DialogDescription>
                </DialogHeader>
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
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              Para cargar uno nuevo usá el botón de arriba. El historial queda abajo en formato desplegable.
            </div>
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
            <Accordion
              type="multiple"
              defaultValue={highlightedReportId ? [highlightedReportId] : undefined}
              className="space-y-3"
            >
              {reports.map((report) => {
                const author = profileByUserId.get(report.created_by);

                return (
                  <AccordionItem
                    key={report.id}
                    value={report.id}
                    className="overflow-hidden rounded-xl border border-border/70 bg-card px-4"
                  >
                    <AccordionTrigger className="gap-4 py-4 text-left hover:no-underline">
                      <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 space-y-1">
                          <h3 className="truncate text-base font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(`${report.report_date}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Publicado</Badge>
                          <Badge variant="secondary">
                            {author?.name || author?.email || 'Usuario interno'}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border/60 pt-4">
                      <div className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                        {report.content}
                      </div>
                      <ReportComments
                        reportId={report.id}
                        reportTitle={report.title}
                        profiles={profiles}
                        canComment={canCommentReports}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ReportComments({
  reportId,
  reportTitle,
  profiles,
  canComment,
}: {
  reportId: string;
  reportTitle: string;
  profiles: Profile[];
  canComment: boolean;
}) {
  const { data: comments = [], isLoading } = useReportComments(reportId);
  const createReportComment = useCreateReportComment();
  const { sendMentionNotifications } = useMentionNotifications();
  const [comment, setComment] = useState('');

  const profileByUserId = useMemo(
    () => new Map(profiles.map((profile) => [profile.user_id, profile])),
    [profiles],
  );

  const handleSubmit = async () => {
    if (!comment.trim()) {
      return;
    }

    await createReportComment.mutateAsync({
      reportId,
      content: comment,
    });

    await sendMentionNotifications(
      comment,
      profiles.map((profile) => ({ user_id: profile.user_id, name: profile.name })),
      {
        contextType: 'comment',
        contextName: reportTitle,
        link: `/reports?report=${reportId}`,
      },
    );

    setComment('');
  };

  return (
    <div className="mt-6 border-t border-border/60 pt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">Comentarios</h4>
        <Badge variant="secondary">{comments.length}</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-center text-sm text-muted-foreground">
          Todavía no hay comentarios en este reporte.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((item) => {
            const author = profileByUserId.get(item.author_id);

            return (
              <div key={item.id} className="flex gap-3 rounded-lg bg-muted/20 p-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={author?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(author?.name || author?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{author?.name || author?.email || 'Admin'}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                    {item.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canComment ? (
        <div className="mt-4 space-y-2">
          <MentionInput
            value={comment}
            onChange={setComment}
            onSubmit={handleSubmit}
            placeholder="Agregar comentario... Usá @ para mencionar"
            className="min-h-24 resize-y"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!comment.trim() || createReportComment.isPending}
            >
              {createReportComment.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Comentar
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Solo los usuarios con rol admin pueden comentar reportes.
        </p>
      )}
    </div>
  );
}

function getInitials(value?: string | null) {
  if (!value) return 'AD';

  return value
    .split(/[ @._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
