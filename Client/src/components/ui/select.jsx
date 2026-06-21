import { cn } from '../../lib/utils';

export function Select({ className, label, id, children, ...props }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'h-10 w-full min-w-[120px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800',
          'shadow-sm transition-colors focus:border-emerald-primary focus:outline-none focus:ring-2 focus:ring-emerald-primary/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
