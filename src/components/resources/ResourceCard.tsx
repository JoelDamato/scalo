import { ExternalLink, FileText, Type, Trash2, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeleteResource, type Resource } from '@/hooks/useResources';
import { toast } from 'sonner';
import { format } from 'date-fns';

const typeIcons = {
  link: ExternalLink,
  document: FileText,
  text: Type,
};

const typeLabels = {
  link: 'Link',
  document: 'Documento',
  text: 'Texto',
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const deleteResource = useDeleteResource();
  const Icon = typeIcons[resource.type] || FileText;

  const handleOpen = () => {
    if (resource.url && resource.type !== 'text') {
      window.open(resource.url, '_blank');
    }
  };

  const handleCopy = () => {
    const text = resource.type === 'text' ? resource.content : resource.url;
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success('Copiado al portapapeles');
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle
                className={`text-sm truncate ${resource.url && resource.type !== 'text' ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                onClick={handleOpen}
              >
                {resource.title}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => deleteResource.mutate(resource.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {resource.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{resource.description}</p>
        )}
        {resource.type === 'text' && resource.content && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-3 whitespace-pre-wrap">{resource.content}</p>
        )}
        {resource.url && resource.type !== 'text' && (
          <p className="text-xs text-muted-foreground mb-2 truncate">{resource.url}</p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] capitalize">{resource.category}</Badge>
          <Badge variant="secondary" className="text-[10px]">{typeLabels[resource.type]}</Badge>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {format(new Date(resource.created_at), 'dd/MM/yy')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
