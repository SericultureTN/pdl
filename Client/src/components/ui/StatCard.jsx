import { TrendingUp, TrendingDown } from 'lucide-react';

const variantStyles = {
  emerald: {
    border: 'border-emerald-primary/20',
    iconBg: 'bg-emerald-primary/10 text-emerald-primary',
    glow: 'shadow-[0_0_24px_rgba(11,93,59,0.15)]',
    accent: 'from-emerald-primary to-emerald-light',
  },
  gold: {
    border: 'border-gold-accent/30',
    iconBg: 'bg-gold-muted text-gold-accent',
    glow: 'shadow-[0_0_24px_rgba(212,175,55,0.15)]',
    accent: 'from-gold-accent to-gold-light',
  },
  slate: {
    border: 'border-slate-200',
    iconBg: 'bg-slate-100 text-slate-600',
    glow: 'shadow-[0_0_24px_rgba(100,116,139,0.12)]',
    accent: 'from-slate-500 to-slate-600',
  },
};

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  trendUp = true,
  variant = 'emerald',
}) {
  const styles = variantStyles[variant] || variantStyles.emerald;

  return (
    <div
      className={`
        group relative overflow-hidden rounded-luxury border bg-surface-card p-6
        backdrop-blur-glass transition-all duration-300 ease-out
        shadow-luxury hover:-translate-y-1 hover:shadow-luxury-hover
        ${styles.border}
      `}
    >
      <div
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${styles.accent} opacity-80`}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className={`
            flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl
            transition-all duration-300 group-hover:scale-105 ${styles.iconBg} ${styles.glow}
          `}
        >
          {icon}
        </div>

        {trend && (
          <div
            className={`
              flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
              ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}
            `}
          >
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-secondary">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
