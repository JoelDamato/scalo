import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export type TimeFilter = 'all' | 'today' | '7days' | '30days' | 'this_month';

interface PipelineFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
  totalCount: number;
  filteredCount: number;
}

const timeFilterOptions: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'today', label: 'Hoy' },
  { value: '7days', label: 'Últimos 7 días' },
  { value: '30days', label: 'Últimos 30 días' },
  { value: 'this_month', label: 'Este mes' },
];

export function PipelineFilters({
  searchQuery,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
  totalCount,
  filteredCount,
}: PipelineFiltersProps) {
  const hasActiveFilters = searchQuery || timeFilter !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onTimeFilterChange('all');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 w-[200px]"
          />
        </div>

        {/* Time filter */}
        <Select value={timeFilter} onValueChange={onTimeFilterChange}>
          <SelectTrigger className="h-9 w-[160px]">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {hasActiveFilters ? (
          <>
            <Badge variant="secondary" className="font-normal">
              {filteredCount} de {totalCount}
            </Badge>
            <span>resultados</span>
          </>
        ) : (
          <span>{totalCount} clientes totales</span>
        )}
      </div>
    </div>
  );
}
