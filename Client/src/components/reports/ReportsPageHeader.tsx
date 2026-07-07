import { Link } from 'react-router-dom';
import { ArrowLeft, FilePlus, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface BackLink {
  to: string;
  label: string;
}

interface ReportsPageHeaderProps {
  onGenerateReport: () => void;
  onExportReports: () => void;
  exportDisabled?: boolean;
  backLink?: BackLink;
}

export default function ReportsPageHeader({
  onGenerateReport,
  onExportReports,
  exportDisabled = false,
  backLink,
}: ReportsPageHeaderProps) {
  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white',
        'px-6 py-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:px-8 sm:py-9'
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-primary via-emerald-light to-gold-accent" />

      {backLink && (
        <Link
          to={backLink.to}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2 text-sm font-semibold text-emerald-secondary transition-colors hover:border-emerald-primary/25 hover:bg-emerald-50/40"
        >
          <ArrowLeft size={16} />
          {backLink.label}
        </Link>
      )}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.875rem] md:leading-tight">
            Reports Management
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 md:text-[0.9375rem]">
            Manage, View, Search and Download Submitted Reports.
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="primary"
            onClick={onGenerateReport}
            className="h-11 w-full px-6 sm:w-auto"
          >
            <FilePlus size={16} />
            Generate Report
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onExportReports}
            disabled={exportDisabled}
            className="h-11 w-full px-6 sm:w-auto"
          >
            <FileSpreadsheet size={16} />
            Export Reports
          </Button>
        </div>
      </div>
    </header>
  );
}
