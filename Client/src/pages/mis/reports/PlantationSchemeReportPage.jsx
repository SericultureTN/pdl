import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Printer,
  FileSpreadsheet,
  FileDown,
  History,
  Target,
  TrendingUp,
  CalendarDays,
  BarChart3,
  Percent,
  Search,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
  Users,
  Sprout,
  Award,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import AdOfficeWiseList from './AdOfficeWiseList.jsx';
import {
  REPORT_DEFAULTS,
  CATEGORY_DETAILS,
  FILTER_OPTIONS,
  getAdOfficesForRegion,
  getAdOfficeWiseList,
  getMonthlyHistory,
  getKpisFromOfficeList,
} from './plantationReportData.js';
import { getPlantationSchemeFromPath } from '../plantationConstants.js';
import { getPlantationEntryReport } from './entryReportData.js';

const PAGE_SIZE = 5;

function statusVariant(status) {
  if (status === 'Approved') return 'approved';
  if (status === 'Submitted') return 'submitted';
  if (status === 'Draft') return 'draft';
  return 'default';
}

function KpiCard({ icon: Icon, title, lines, accent, highlight }) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(11,93,59,0.12)]">
      <CardContent className="relative p-5">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${highlight}`}>
            <Icon size={22} strokeWidth={2} />
          </div>
        </div>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <div className="mt-2 space-y-1">
          {lines.map((line) => (
            <p key={line.label} className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-slate-500">{line.label}</span>
              <span className="text-lg font-bold text-slate-900">{line.value}</span>
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function scaleCategoryDetails(factor) {
  return CATEGORY_DETAILS.map((row) => ({
    ...row,
    ulm: {
      acre: Math.round(row.ulm.acre * factor),
      farmer: Math.round(row.ulm.farmer * factor),
    },
    dm: {
      acre: Math.round(row.dm.acre * factor),
      farmer: Math.round(row.dm.farmer * factor),
    },
    um: {
      acre: Math.round(row.um.acre * factor),
      farmer: Math.round(row.um.farmer * factor),
    },
  }));
}

export default function PlantationSchemeReportPage() {
  const { pathname } = useLocation();
  const scheme = getPlantationSchemeFromPath(pathname);

  const liveEntry = useMemo(
    () => getPlantationEntryReport(scheme),
    [scheme.id, pathname]
  );

  const [filters, setFilters] = useState({
    ...REPORT_DEFAULTS,
    financialYear: scheme.defaultFinancialYear.replace('–', '-'),
  });
  const [page, setPage] = useState(1);

  const adOfficeOptions = useMemo(
    () => ['All AD Offices', ...getAdOfficesForRegion(filters.region)],
    [filters.region]
  );

  const allRegionOffices = useMemo(
    () => getAdOfficeWiseList(filters.region, 'All AD Offices', 'All Status'),
    [filters.region]
  );

  const selectedOfficeData = useMemo(() => {
    if (filters.adOffice === 'All AD Offices') return null;
    return allRegionOffices.find((o) => o.adOffice === filters.adOffice) || null;
  }, [filters.adOffice, allRegionOffices]);

  const kpis = useMemo(() => {
    if (liveEntry.hasEntry) {
      return {
        target: liveEntry.target,
        ulm: liveEntry.ulm,
        dm: liveEntry.dm,
        um: liveEntry.um,
        achievement: liveEntry.achievement,
      };
    }
    if (selectedOfficeData) {
      return {
        target: selectedOfficeData.target,
        ulm: selectedOfficeData.ulm,
        dm: selectedOfficeData.dm,
        um: selectedOfficeData.um,
        achievement: selectedOfficeData.achievement,
      };
    }
    return getKpisFromOfficeList(allRegionOffices);
  }, [liveEntry, selectedOfficeData, allRegionOffices]);

  const categoryRows = useMemo(() => {
    if (liveEntry.hasEntry) {
      return liveEntry.categories.map((row) => ({
        category: row.category,
        ulm: row.ulm,
        dm: row.dm,
        um: row.um,
      }));
    }
    if (selectedOfficeData && selectedOfficeData.target.acre) {
      const factor = selectedOfficeData.um.acre / 56 || 1;
      return scaleCategoryDetails(factor);
    }
    return CATEGORY_DETAILS;
  }, [liveEntry, selectedOfficeData]);

  const monthlyHistory = useMemo(
    () => getMonthlyHistory(filters.region, filters.adOffice, filters.status),
    [filters.region, filters.adOffice, filters.status]
  );

  const totalPages = Math.max(1, Math.ceil(monthlyHistory.length / PAGE_SIZE));
  const historyRows = monthlyHistory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'region') {
        next.adOffice = 'All AD Offices';
      }
      return next;
    });
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      ...REPORT_DEFAULTS,
      financialYear: scheme.defaultFinancialYear.replace('–', '-'),
    });
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
  };

  const handleSelectOffice = (adOffice) => {
    setFilters((prev) => ({ ...prev, adOffice }));
    setPage(1);
  };

  const totalsRow = categoryRows.reduce(
    (acc, row) => ({
      ulm: { acre: acc.ulm.acre + row.ulm.acre, farmer: acc.ulm.farmer + row.ulm.farmer },
      dm: { acre: acc.dm.acre + row.dm.acre, farmer: acc.dm.farmer + row.dm.farmer },
      um: { acre: acc.um.acre + row.um.acre, farmer: acc.um.farmer + row.um.farmer },
    }),
    { ulm: { acre: 0, farmer: 0 }, dm: { acre: 0, farmer: 0 }, um: { acre: 0, farmer: 0 } }
  );

  const subtitleOffice =
    filters.adOffice === 'All AD Offices' ? 'All AD Offices' : filters.adOffice;

  const entrySubtitle = liveEntry.hasEntry
    ? `${liveEntry.filters.subordinateOffice} • ${liveEntry.filters.region} • ${liveEntry.filters.adOffice} • ${liveEntry.filters.financialYear} • ${liveEntry.filters.month}`
    : null;

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-primary">
            SILK SAMAGRA MIS PORTAL
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-[1.75rem]">
            {scheme.reportTitle} – Monthly Report
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            {entrySubtitle || `Extension • ${filters.region} • ${subtitleOffice}`}
          </p>
          {liveEntry.hasEntry && (
            <p className="mt-1 text-xs font-semibold text-emerald-600">
              Live data from Data Entry{liveEntry.submitted ? ' (Submitted)' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" type="button" onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </Button>
          <Button variant="outline" type="button">
            <FileSpreadsheet size={16} />
            Export Excel
          </Button>
          <Button variant="outline" type="button">
            <FileDown size={16} />
            Export PDF
          </Button>
          <Button variant="outline" type="button">
            <History size={16} />
            Filter History
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Select
                id="fy"
                label="Financial Year"
                value={filters.financialYear}
                onChange={(e) => handleFilterChange('financialYear', e.target.value)}
              >
                {FILTER_OPTIONS.financialYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
              <Select
                id="month"
                label="Month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                {FILTER_OPTIONS.months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
              <Select
                id="date"
                label="Date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              >
                {FILTER_OPTIONS.dates.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
              <Select
                id="region"
                label="Region"
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
              >
                {FILTER_OPTIONS.regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
              <Select
                id="adOffice"
                label="AD Office"
                value={filters.adOffice}
                onChange={(e) => handleFilterChange('adOffice', e.target.value)}
              >
                {adOfficeOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
              <Select
                id="status"
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {FILTER_OPTIONS.statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button variant="primary" type="button" onClick={handleSearch}>
                <Search size={16} />
                Search
              </Button>
              <Button variant="outline" type="button" onClick={handleReset}>
                <RotateCcw size={16} />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AD Office Wise List */}
      <AdOfficeWiseList
        offices={allRegionOffices}
        region={filters.region}
        selectedOffice={filters.adOffice === 'All AD Offices' ? null : filters.adOffice}
        onSelectOffice={handleSelectOffice}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon={Target}
          title="Total Target"
          accent="from-emerald-600 to-emerald-400"
          highlight="bg-emerald-50 text-emerald-primary"
          lines={[
            { label: 'Target Acre', value: kpis.target.acre },
            { label: 'Target Farmer', value: kpis.target.farmer },
          ]}
        />
        <KpiCard
          icon={Layers}
          title="Total ULM"
          accent="from-slate-500 to-slate-400"
          highlight="bg-slate-100 text-slate-600"
          lines={[
            { label: 'ULM Acre', value: kpis.ulm.acre },
            { label: 'ULM Farmer', value: kpis.ulm.farmer },
          ]}
        />
        <KpiCard
          icon={Sprout}
          title="Total DM"
          accent="from-orange-500 to-amber-400"
          highlight="bg-orange-50 text-orange-600"
          lines={[
            { label: 'DM Acre', value: kpis.dm.acre },
            { label: 'DM Farmer', value: kpis.dm.farmer },
          ]}
        />
        <KpiCard
          icon={TrendingUp}
          title="Total UM"
          accent="from-emerald-700 to-teal-500"
          highlight="bg-emerald-50 text-emerald-700"
          lines={[
            { label: 'UM Acre', value: kpis.um.acre },
            { label: 'UM Farmer', value: kpis.um.farmer },
          ]}
        />
        <KpiCard
          icon={Percent}
          title="Achievement %"
          accent="from-gold-accent to-amber-300"
          highlight="bg-gold-muted text-gold-accent"
          lines={[{ label: 'Achievement', value: `${kpis.achievement}%` }]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Category Wise Details</CardTitle>
              <p className="text-xs font-medium text-slate-500">
                {subtitleOffice} · Unit: Acre / Farmer
              </p>
            </div>
            <Badge variant="live">{liveEntry.hasEntry ? 'Live from Entry' : 'Live Report'}</Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                    Category
                  </th>
                  <th colSpan={2} className="border-l border-slate-100 px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    ULM
                  </th>
                  <th colSpan={2} className="border-l border-slate-100 px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-orange-600">
                    DM
                  </th>
                  <th colSpan={2} className="border-l border-slate-100 bg-emerald-50/80 px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-emerald-700">
                    UM
                  </th>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="border-l border-slate-100 px-2 py-2">Acre</th>
                  <th className="px-2 py-2">Farmer</th>
                  <th className="border-l border-slate-100 px-2 py-2">Acre</th>
                  <th className="px-2 py-2">Farmer</th>
                  <th className="border-l border-slate-100 bg-emerald-50/50 px-2 py-2 text-emerald-700">Acre</th>
                  <th className="bg-emerald-50/50 px-2 py-2 text-emerald-700">Farmer</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((row) => (
                  <tr key={row.category} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.category}</td>
                    <td className="border-l border-slate-50 px-3 py-3 text-center text-slate-700">{row.ulm.acre}</td>
                    <td className="px-3 py-3 text-center text-slate-700">{row.ulm.farmer}</td>
                    <td className="border-l border-slate-50 px-3 py-3 text-center font-medium text-orange-700">{row.dm.acre}</td>
                    <td className="px-3 py-3 text-center font-medium text-orange-700">{row.dm.farmer}</td>
                    <td className="border-l border-emerald-100 bg-emerald-50/40 px-3 py-3 text-center font-semibold text-emerald-800">{row.um.acre}</td>
                    <td className="bg-emerald-50/40 px-3 py-3 text-center font-semibold text-emerald-800">{row.um.farmer}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-100/60 font-bold text-emerald-900">
                  <td className="px-4 py-3.5">Overall Totals</td>
                  <td className="border-l border-emerald-200/60 px-3 py-3.5 text-center">{totalsRow.ulm.acre}</td>
                  <td className="px-3 py-3.5 text-center">{totalsRow.ulm.farmer}</td>
                  <td className="border-l border-emerald-200/60 px-3 py-3.5 text-center">{totalsRow.dm.acre}</td>
                  <td className="px-3 py-3.5 text-center">{totalsRow.dm.farmer}</td>
                  <td className="border-l border-emerald-200/60 bg-emerald-200/40 px-3 py-3.5 text-center">{totalsRow.um.acre}</td>
                  <td className="bg-emerald-200/40 px-3 py-3.5 text-center">{totalsRow.um.farmer}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-[#0B5D3B] via-[#0F7A4A] to-[#113D2C] text-white shadow-[0_12px_40px_rgba(11,93,59,0.35)]">
          <CardHeader className="border-white/10">
            <CardTitle className="flex items-center gap-2 text-white">
              <Award size={20} className="text-gold-accent" />
              Overall Totals
            </CardTitle>
            <p className="text-xs text-emerald-100/80">{subtitleOffice}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'ULM Acre', value: kpis.ulm.acre, icon: Layers },
              { label: 'ULM Farmer', value: kpis.ulm.farmer, icon: Users },
              { label: 'DM Acre', value: kpis.dm.acre, icon: Sprout },
              { label: 'DM Farmer', value: kpis.dm.farmer, icon: Users },
              { label: 'UM Acre', value: kpis.um.acre, icon: TrendingUp },
              { label: 'UM Farmer', value: kpis.um.farmer, icon: Users },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={16} className="text-emerald-200" />
                  <span className="text-sm font-medium text-emerald-100">{item.label}</span>
                </div>
                <span className="text-lg font-bold">{item.value}</span>
              </div>
            ))}
            <div className="mt-2 rounded-xl border border-gold-accent/40 bg-gold-accent/15 px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gold-light">Total Acre</span>
                <span className="text-xl font-bold text-white">{kpis.um.acre}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-2">
                <span className="text-sm font-semibold text-gold-light">Total Farmer</span>
                <span className="text-xl font-bold text-white">{kpis.um.farmer}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-2">
                <span className="text-sm font-semibold text-gold-light">Achievement</span>
                <span className="text-xl font-bold text-white">{kpis.achievement}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-primary">
              <CalendarDays size={20} />
            </div>
            <div>
              <CardTitle>Monthly History (AD Office Wise)</CardTitle>
              <p className="text-xs text-slate-500">
                {filters.region} · {subtitleOffice} · {monthlyHistory.length} records
              </p>
            </div>
          </div>
          <BarChart3 size={20} className="text-slate-400" />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-3 py-3 text-left">S.No</th>
                <th className="px-3 py-3 text-left">AD Office</th>
                <th className="px-3 py-3 text-left">Month</th>
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-center">ULM Acre</th>
                <th className="px-3 py-3 text-center">ULM Farmer</th>
                <th className="px-3 py-3 text-center">DM Acre</th>
                <th className="px-3 py-3 text-center">DM Farmer</th>
                <th className="px-3 py-3 text-center bg-emerald-50/80 text-emerald-700">UM Acre</th>
                <th className="px-3 py-3 text-center bg-emerald-50/80 text-emerald-700">UM Farmer</th>
                <th className="px-3 py-3 text-center">Total Acre</th>
                <th className="px-3 py-3 text-center">Total Farmer</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-left">Submitted On</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row, idx) => (
                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-3 py-3 font-medium text-slate-500">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleSelectOffice(row.adOffice)}
                      className="font-semibold text-emerald-primary hover:underline"
                    >
                      {row.adOffice}
                    </button>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800">{row.month}</td>
                  <td className="px-3 py-3 text-slate-600">{row.date}</td>
                  <td className="px-3 py-3 text-center">{row.ulm.acre}</td>
                  <td className="px-3 py-3 text-center">{row.ulm.farmer}</td>
                  <td className="px-3 py-3 text-center text-orange-700">{row.dm.acre}</td>
                  <td className="px-3 py-3 text-center text-orange-700">{row.dm.farmer}</td>
                  <td className="bg-emerald-50/30 px-3 py-3 text-center font-semibold text-emerald-800">{row.um.acre}</td>
                  <td className="bg-emerald-50/30 px-3 py-3 text-center font-semibold text-emerald-800">{row.um.farmer}</td>
                  <td className="px-3 py-3 text-center font-medium">{row.total.acre}</td>
                  <td className="px-3 py-3 text-center font-medium">{row.total.farmer}</td>
                  <td className="px-3 py-3 text-center">
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{row.submittedOn}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSelectOffice(row.adOffice)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-emerald-primary hover:bg-emerald-50 hover:text-emerald-primary"
                      aria-label="View record"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {monthlyHistory.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              No monthly history found for the selected AD office filters.
            </p>
          )}

          {monthlyHistory.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, monthlyHistory.length)} of{' '}
                {monthlyHistory.length} records
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  type="button"
                  className="h-9 w-9 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
                      p === page
                        ? 'bg-emerald-primary text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <Button
                  variant="outline"
                  type="button"
                  className="h-9 w-9 p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
