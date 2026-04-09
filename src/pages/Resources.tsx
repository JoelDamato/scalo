import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useResources } from '@/hooks/useResources';
import { CreateResourceDialog } from '@/components/resources/CreateResourceDialog';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FolderOpen } from 'lucide-react';

const CATEGORIES = ['todos', 'general', 'pricing', 'templates', 'procesos', 'legal', 'marketing'];

export default function Resources() {
  useDocumentTitle('Recursos');
  const { data: resources = [], isLoading } = useResources();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');

  const filtered = resources.filter((r) => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'todos' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recursos</h1>
            <p className="text-muted-foreground text-sm">Documentos, links y contenido del equipo</p>
          </div>
          <CreateResourceDialog />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar recursos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="capitalize text-xs">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">No hay recursos{activeCategory !== 'todos' ? ` en "${activeCategory}"` : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
