import { FINANCIAL_YEARS, FY_MONTHS, REGIONS } from '../../services/misReports';
import type { MisFilters } from '../../types/misReport';

interface Props {
  filters: MisFilters;
  adOptions: string[];
  onChange: (patch: Partial<MisFilters>) => void;
}

export default function MISFilterBar({ filters, adOptions, onChange }: Props) {
  const summary = [
    filters.year,
    filters.month,
    filters.region,
    filters.ad === 'All' ? 'All AD Offices' : filters.ad,
  ].join(' · ');

  return (
    <section className="mis-viewer-no-print border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Financial Year</span>
            <select
              value={filters.year}
              onChange={(e) => onChange({ year: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            >
              {FINANCIAL_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Month</span>
            <select
              value={filters.month}
              onChange={(e) => onChange({ month: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            >
              {FY_MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Region</span>
            <select
              value={filters.region}
              onChange={(e) => onChange({ region: e.target.value, ad: 'All' })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">AD Office</span>
            <select
              value={filters.ad}
              onChange={(e) => onChange({ ad: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            >
              <option value="All">All AD Offices</option>
              {adOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          <span className="font-semibold text-[#1a3d2b]">Active filters:</span> {summary}
        </p>
      </div>
    </section>
  );
}
