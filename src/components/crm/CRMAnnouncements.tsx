import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  useCRMAnnouncements,
  useCreateCRMAnnouncement,
  useDeleteCRMAnnouncement,
  useTogglePinAnnouncement,
} from '@/hooks/useCRMEvents';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { Megaphone, Plus, Trash2, Pin, PinOff } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function CRMAnnouncements() {
  const { data: announcements = [], isLoading } = useCRMAnnouncements();
  const createAnn = useCreateCRMAnnouncement();
  const deleteAnn = useDeleteCRMAnnouncement();
  const togglePin = useTogglePinAnnouncement();
  const { isAdmin } = useAuth();
  const { data: profiles = [] } = useProfiles();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);

  const getAuthorName = (userId: string) => {
    const p = profiles.find(pr => pr.user_id === userId);
    return p?.name || 'Usuario';
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      await createAnn.mutateAsync({ title: title.trim(), content: content.trim(), is_pinned: pinned });
      toast.success('Comunicado publicado');
      setTitle(''); setContent(''); setPinned(false);
      setDialogOpen(false);
    } catch {
      toast.error('Error al publicar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          Comunicados
        </h3>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No hay comunicados aún</p>
            {isAdmin && (
              <Button variant="ghost" size="sm" className="mt-3 gap-1.5" onClick={() => setDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Publicar comunicado
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <Card key={ann.id} className={cn(ann.is_pinned && 'border-primary/30 bg-primary/5')}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {ann.is_pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                    <CardTitle className="text-sm font-semibold truncate">{ann.title}</CardTitle>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => togglePin.mutate({ id: ann.id, is_pinned: !ann.is_pinned })}
                      >
                        {ann.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => { deleteAnn.mutate(ann.id); toast.success('Eliminado'); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ann.content}</p>
                <p className="text-[11px] text-muted-foreground mt-3">
                  {getAuthorName(ann.created_by)} · {formatDistanceToNow(parseISO(ann.created_at), { addSuffix: true, locale: es })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Comunicado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Título *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Actualización de proceso" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Contenido *</label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Escribí el comunicado..." rows={4} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={pinned} onCheckedChange={setPinned} />
              <label className="text-sm text-muted-foreground">Fijar arriba</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !content.trim() || createAnn.isPending}>Publicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
