import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ReportsStatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  accent?: 'emerald' | 'blue' | 'amber' | 'slate';
}

const accentStyles = {
  emerald: {
    bar: 'from-emerald-600 to-emerald-400',
    icon: 'bg-emerald-50 text-emerald-primary',
  },
  blue: {
    bar: 'from-blue-600 to-blue-400',
    icon: 'bg-blue-50 text-blue-600',
  },
  amber: {
    bar: 'from-amber-500 to-amber-400',
    icon: 'bg-amber-50 text-amber-600',
  },
  slate: {
    bar: 'from-slate-500 to-slate-400',
    icon: 'bg-slate-100 text-slate-600',
  },
};

export default function ReportsStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'emerald',
}: ReportsStatCardProps) {
  const styles = accentStyles[accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(11,93,59,0.1)]">
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', styles.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', styles.icon)}>
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
