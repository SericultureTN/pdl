import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  Fragment,
  type ChangeEvent,
} from 'react';
import {
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  ClipboardList,
  CheckCircle2,
  FileEdit,
  Inbox,
  Filter,
} from 'lucide-react';
import {
  SUBORDINATE_OFFICES,
  REGIONS,
  FINANCIAL_YEARS,
  getAdOfficesForFilter,
} from '../../pages/mis/plantationConstants.js';
import {
  collectAllReportRows,
  filterReportRows,
  DEFAULT_REPORT_FILTERS,
  REPORT_MODULES,
  REPORT_MONTHS,
} from '../../utils/reportsData.js';
import { downloadReportsExcel } from '../../utils/exportReportsExcel.js';
import type { ReportFilters, ReportRow, ReportStats, ReportStatus } from '../../types/reports';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import ReportsStatCard from './ReportsStatCard';
import ReportsPagination from './ReportsPagination';
import ReportsPageHeader from './ReportsPageHeader';
import { cn } from '../../lib/utils';

const PAGE_SIZE = 5;
const ALL_OPTION = { value: 'all', label: 'All' };

function statusVariant(status: ReportStatus) {
  if (status === 'Submitted') return 'approved';
  if (status === 'Draft') return 'draft';
  return 'default';
}

function computeStats(rows: ReportRow[]): ReportStats {
  return {
    total: rows.length,
    withEntry: rows.filter((row) => row.hasEntry).length,
    draft: rows.filter((row) => row.status === 'Draft').length,
    submitted: rows.filter((row) => row.status === 'Submitted').length,
    empty: rows.filter((row) => row.status === 'Empty').length,
  };
}

function matchesQuickSearch(row: ReportRow, term: string) {
  if (!term.trim()) return true;
  const haystack = [
    row.module,
    row.subordinateOffice,
    row.region,
    row.adOffice,
    row.periodLabel,
    row.status,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(term.trim().toLowerCase());
}

export default function ReportsManagementDashboard({
  backLink,
}: {
  backLink?: { to: string; label: string };
} = {}) {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [quickSearch, setQuickSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const refreshRows = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    refreshRows();
  }, [refreshRows]);

  useEffect(() => {
    const handleFocus = () => refreshRows();
    const handleStorage = () => refreshRows();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshRows]);

  const allRows = useMemo(() => collectAllReportRows() as ReportRow[], [refreshKey]);

  const filteredRows = useMemo(
    () => filterReportRows(allRows, appliedFilters) as ReportRow[],
    [allRows, appliedFilters]
  );

  const displayRows = useMemo(
    () => filteredRows.filter((row) => matchesQuickSearch(row, quickSearch)),
    [filteredRows, quickSearch]
  );

  const stats = useMemo(() => computeStats(displayRows), [displayRows]);

  const totalPages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () => displayRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [displayRows, page]
  );

  const adOfficeOptions = useMemo(() => {
    if (filters.subordinateOffice === 'all') {
      const offices = new Set(allRows.map((row) => row.adOffice).filter(Boolean));
      return [
        ALL_OPTION,
        ...Array.from(offices)
          .sort()
          .map((office) => ({ value: office, label: office })),
      ];
    }

    const region = filters.region === 'all' ? 'Erode Region' : filters.region;
    const offices = getAdOfficesForFilter(filters.subordinateOffice, region);
    return [ALL_OPTION, ...offices.map((office) => ({ value: office, label: office }))];
  }, [allRows, filters.subordinateOffice, filters.region]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'subordinateOffice' && value !== prev.subordinateOffice) {
        next.region = 'all';
        next.adOffice = 'all';
      }
      if (key === 'region' && value !== prev.region) {
        next.adOffice = 'all';
      }
      return next;
    });
  };

  const handleSearch = () => {
    refreshRows();
    setAppliedFilters({ ...filters });
    setExpandedRowId(null);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_REPORT_FILTERS);
    setAppliedFilters(DEFAULT_REPORT_FILTERS);
    setQuickSearch('');
    setExpandedRowId(null);
    setPage(1);
    refreshRows();
  };

  const handleExport = () => {
    if (displayRows.length === 0) return;
    downloadReportsExcel(displayRows);
  };

  const handleGenerateReport = () => {
    handleSearch();
  };

  const toggleRow = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };

  return (
    <div className="animate-fade-in space-y-8 pb-8">
      <ReportsPageHeader
        onGenerateReport={handleGenerateReport}
        onExportReports={handleExport}
        exportDisabled={displayRows.length === 0}
        backLink={backLink}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportsStatCard
          title="Total Reports"
          value={stats.total}
          subtitle="Matching current filters"
          icon={FileBarChart}
          accent="emerald"
        />
        <ReportsStatCard
          title="With Data Entry"
          value={stats.withEntry}
          subtitle="DM values captured"
          icon={ClipboardList}
          accent="blue"
        />
        <ReportsStatCard
          title="Draft"
          value={stats.draft}
          subtitle="Pending submission"
          icon={FileEdit}
          accent="amber"
        />
        <ReportsStatCard
          title="Submitted"
          value={stats.submitted}
          subtitle="Approved periodicals"
          icon={CheckCircle2}
          accent="emerald"
        />
      </div>

      {/* Search & filters */}
      <Card className="overflow-hidden">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-primary">
              <Filter size={18} />
            </div>
            <div>
              <CardTitle>Search &amp; Filters</CardTitle>
              <CardDescription>Refine reports by office, period, and date range</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="relative max-w-xl">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              type="search"
              placeholder="Quick search report, office, or period..."
              value={quickSearch}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setQuickSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 pl-10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              id="report-type"
              label="Report Module"
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
            >
              <option value="all">All Reports</option>
              {REPORT_MODULES.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.label}
                </option>
              ))}
            </Select>

            <Select
              id="subordinate-office"
              label="Subordinate Office"
              value={filters.subordinateOffice}
              onChange={(e) => handleFilterChange('subordinateOffice', e.target.value)}
            >
              <option value="all">All Offices</option>
              {SUBORDINATE_OFFICES.map((office) => (
                <option key={office} value={office}>
                  {office}
                </option>
              ))}
            </Select>

            <Select
              id="region"
              label="Region"
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
            >
              <option value="all">All Regions</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>

            <Select
              id="ad-office"
              label="AD Office"
              value={filters.adOffice}
              onChange={(e) => handleFilterChange('adOffice', e.target.value)}
            >
              {adOfficeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              id="financial-year"
              label="Financial Year"
              value={filters.financialYear}
              onChange={(e) => handleFilterChange('financialYear', e.target.value)}
            >
              <option value="all">All Years</option>
              {FINANCIAL_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>

            <Select
              id="month"
              label="Month"
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
            >
              <option value="all">All Months</option>
              {REPORT_MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="from-date"
                className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
              >
                From Date
              </label>
              <Input
                id="from-date"
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="to-date"
                className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
              >
                To Date
              </label>
              <Input
                id="to-date"
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="primary" onClick={handleSearch}>
              <Search size={16} />
              Apply Filters
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Report Records</CardTitle>
            <CardDescription>Live ULM / DM / UM from Data Entry screens</CardDescription>
          </div>
          <Badge variant="live">Live Data</Badge>
        </CardHeader>

        {displayRows.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox size={28} />
            </div>
            <p className="text-base font-semibold text-slate-800">No reports found</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Enter data on a Data Entry screen, then apply filters or reset to view all modules.
            </p>
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3.5 text-left">S.No</th>
                    <th className="px-4 py-3.5 text-left">Report Module</th>
                    <th className="px-4 py-3.5 text-left">Office</th>
                    <th className="px-4 py-3.5 text-left">Period</th>
                    <th className="px-4 py-3.5 text-left">Date</th>
                    <th className="px-4 py-3.5 text-left">ULM</th>
                    <th className="px-4 py-3.5 text-left">DM Entered</th>
                    <th className="px-4 py-3.5 text-left">UM</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, index) => (
                    <Fragment key={row.id}>
                      <tr
                        className={cn(
                          'border-b border-slate-50 transition-colors hover:bg-slate-50/60',
                          expandedRowId === row.id && 'bg-emerald-50/30'
                        )}
                      >
                        <td className="px-4 py-3.5 font-medium text-slate-500">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{row.module}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{row.adOffice}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-slate-800">{row.subordinateOffice}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{row.region || '—'}</p>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">{row.periodLabel}</td>
                        <td className="px-4 py-3.5 text-slate-600">{row.entryDate}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-700">{row.ulm}</td>
                        <td className="px-4 py-3.5 font-semibold text-orange-700">{row.dm}</td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-primary">{row.um}</td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {row.hasEntry ? (
                            <button
                              type="button"
                              onClick={() => toggleRow(row.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-emerald-primary hover:bg-emerald-50 hover:text-emerald-primary"
                              aria-label={expandedRowId === row.id ? 'Hide details' : 'Show details'}
                            >
                              {expandedRowId === row.id ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                      {expandedRowId === row.id && row.details.length > 0 && (
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <td colSpan={10} className="px-4 py-4">
                            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-emerald-primary">
                                Data Entry breakdown
                              </p>
                              <ul className="mt-3 space-y-2">
                                {row.details.map((line) => (
                                  <li
                                    key={line}
                                    className="flex items-start gap-2 text-sm text-slate-600"
                                  >
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-primary" />
                                    {line}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <ReportsPagination
              page={page}
              totalPages={totalPages}
              totalItems={displayRows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
