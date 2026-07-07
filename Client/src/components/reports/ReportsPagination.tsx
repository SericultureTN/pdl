import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface ReportsPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function ReportsPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: ReportsPaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{start}–{end}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> records
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          className="h-9 w-9 p-0"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </Button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              'flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors',
              p === page
                ? 'bg-emerald-primary text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {p}
          </button>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-9 w-9 p-0"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
