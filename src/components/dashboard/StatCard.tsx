import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive?: boolean;
  };
  accentColor?: 'blue' | 'green' | 'amber' | 'rose' | 'violet';
  className?: string;
  delay?: number;
}

const accentClasses = {
  blue: 'bg-accent-blue/10 text-accent-blue',
  green: 'bg-accent-green/10 text-accent-green',
  amber: 'bg-accent-amber/10 text-accent-amber',
  rose: 'bg-accent-rose/10 text-accent-rose',
  violet: 'bg-accent-violet/10 text-accent-violet',
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  accentColor,
  className,
  delay = 0,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const animatedValue = useCountUp(numericValue);
  const displayValue = typeof value === 'number' ? animatedValue : value;

  return (
    <div 
      className={cn(
        "relative flex flex-col p-5 rounded-xl bg-card border border-border/80 transition-smooth hover:border-border hover:shadow-sm group animate-fade-in",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          accentColor ? accentClasses[accentColor] : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-lg",
            trend.positive 
              ? "bg-accent-green/10 text-accent-green" 
              : "bg-accent-rose/10 text-accent-rose"
          )}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[32px] font-semibold tracking-tight leading-none">{displayValue}</p>
        <p className="text-sm text-muted-foreground leading-tight break-words">{title}</p>
      </div>
    </div>
  );
}
