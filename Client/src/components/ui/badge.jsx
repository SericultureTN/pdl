import { cn } from '../../lib/utils';

const variants = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  live: 'bg-sky-50 text-sky-700 border-sky-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
