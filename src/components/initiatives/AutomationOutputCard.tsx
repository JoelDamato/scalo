import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, Download, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AutomationOutputCardProps {
  title: string;
  description: string;
  content: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onSave?: (content: string) => void;
  filename?: string;
  adminOnly?: boolean;
}

export function AutomationOutputCard({
  title,
  description,
  content,
  isGenerating,
  onGenerate,
  onSave,
  filename = 'output.md',
  adminOnly = true,
}: AutomationOutputCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{title}</CardTitle>
            {adminOnly && (
              <Badge variant="outline" className="text-[10px]">Solo admin</Badge>
            )}
          </div>
          {content ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2">
                <Download className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onGenerate} disabled={isGenerating} className="h-7 px-2">
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              </Button>
            </div>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none max-h-[400px] overflow-auto rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap font-mono">
            {content}
          </div>
        ) : (
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            variant="outline"
            className="w-full gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Generando...' : 'Generar con IA'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
