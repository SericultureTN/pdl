import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MISViewerNav from './MISViewerNav';
import MISFilterBar from './MISFilterBar';
import MISKpiCards from './MISKpiCards';
import PlantationOverallTable from './PlantationOverallTable';
import PlantationSchemeTable from './PlantationSchemeTable';
import DflsReportTable from './DflsReportTable';
import {
  MIS_SHEETS,
  fetchReport,
  saveDmData,
  exportExcel,
  downloadBlob,
  rolloverMonth,
} from '../../services/misReports';
import type { MisFilters, MisReportResponse, AcreFarmer } from '../../types/misReport';
import './misViewer.css';

const DEFAULT_FILTERS: MisFilters = {
  sheet: 'plantation-overall',
  month: 'July',
  year: '2025-26',
  region: 'All Regions',
  ad: 'All',
};

interface Props {
  userRole?: string;
}

export default function MISReportViewerPage({ userRole }: Props) {
  const [filters, setFilters] = useState<MisFilters>(DEFAULT_FILTERS);
  const [report, setReport] = useState<MisReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const regionParam = filters.region === 'All Regions' ? 'All' : filters.region;
  const adParam = filters.ad === 'All' ? 'All' : filters.ad;

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchReport({
        sheet: filters.sheet,
        month: filters.month,
        year: filters.year,
        region: regionParam,
        ad: adParam,
      });
      setReport(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Failed to load report. Ensure the API server is running.';
      setError(msg);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [filters.sheet, filters.month, filters.year, regionParam, adParam]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const adOptions = useMemo(() => {
    if (!report?.meta?.adOffices) return [];
    if (filters.region === 'All Regions') {
      return report.meta.adOffices.map((o) => o.name);
    }
    return report.meta.adOffices
      .filter((o) => o.region === filters.region)
      .map((o) => o.name);
  }, [report, filters.region]);

  const handleFilterChange = (patch: Partial<MisFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handlePrint = () => window.print();

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportExcel({
        month: filters.month,
        year: filters.year,
        region: regionParam,
        ad: adParam,
      });
      downloadBlob(blob, `Silk-Samagra-MIS-${filters.year}-${filters.month}.xlsx`);
    } catch {
      setError('Excel export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleRollover = async () => {
    if (!window.confirm(`Rollover ${filters.month} ${filters.year}? UM will become next month ULM and DM will reset.`)) {
      return;
    }
    try {
      await rolloverMonth(filters.month, filters.year);
      setSaveStatus('Monthly rollover completed successfully.');
      await loadReport();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Rollover failed';
      setError(msg);
    }
  };

  const persistDm = async (payload: Record<string, unknown>) => {
    try {
      setSaveStatus('Saving…');
      const result = await saveDmData({
        sheet: filters.sheet,
        month: filters.month,
        year: filters.year,
        ...payload,
      });
      setReport(result.report);
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Save failed';
      setError(msg);
    }
  };

  const handlePlantationDm = (adOfficeId: number, field: 'acre' | 'farmer', value: number, current: AcreFarmer) => {
    persistDm({ adOfficeId, dm: { ...current, [field]: value } });
  };

  const handleSchemeDm = (adOfficeId: number, category: string, field: 'acre' | 'farmer', value: number, current: AcreFarmer) => {
    persistDm({ adOfficeId, category, dm: { ...current, [field]: value } });
  };

  const handleDflsDm = (adOfficeId: number, path: string, value: number) => {
    const parts = path.split('.');
    const dm: Record<string, unknown> = { bv: {}, cb: {}, p1: { value: 0 } };
    if (parts[0] === 'bv') (dm.bv as Record<string, number>)[parts[1]] = value;
    else if (parts[0] === 'cb') (dm.cb as Record<string, number>)[parts[1]] = value;
    else if (parts[0] === 'p1') dm.p1 = { value };
    persistDm({ adOfficeId, dm });
  };

  const sheetType = report?.sheet?.type || 'plantation-overall';
  const isAdminUser = userRole === 'admin';

  return (
    <div className="mis-viewer-page min-h-screen bg-slate-50">
      <MISViewerNav
        onPrint={handlePrint}
        onExport={handleExport}
        onRollover={handleRollover}
        showRollover={isAdminUser}
        exporting={exporting}
      />

      <MISFilterBar filters={filters} adOptions={adOptions} onChange={handleFilterChange} />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mis-viewer-no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/mis-dashboard/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1a3d2b] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to MIS Dashboard
          </Link>
          {saveStatus && <span className="text-sm text-emerald-700">{saveStatus}</span>}
        </div>

        <div className="mb-4 flex flex-wrap gap-2 mis-viewer-no-print">
          {MIS_SHEETS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange({ sheet: tab.id })}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                filters.sheet === tab.id
                  ? 'bg-[#1a3d2b] text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-600">
            <Loader2 className="animate-spin" size={24} />
            Loading report…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-red-800">{error}</div>
        ) : report ? (
          <>
            <div className="mb-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-[#1a3d2b]">{report.sheet.label}</h2>
                  <p className="text-sm text-slate-600">Unit: {report.sheet.unit}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="rounded-full bg-[#E6F1FB] px-3 py-1 text-[#0C447C]">ULM = read only</span>
                  <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[#27500A]">DM = during month</span>
                  <span className="rounded-full bg-[#EEEDFE] px-3 py-1 text-[#3C3489]">UM = auto calculated</span>
                </div>
              </div>
              <MISKpiCards sheetType={sheetType} kpis={report.kpis} unit={report.sheet.unit} />
            </div>

            {sheetType === 'plantation-overall' && (
              <PlantationOverallTable
                regions={report.regions as never}
                grandTotal={report.grandTotal as never}
                canEdit={!!report.meta.canEditDm}
                editableAdIds={report.meta.editableAdIds}
                onSaveDm={handlePlantationDm}
              />
            )}

            {sheetType === 'plantation-scheme' && (
              <PlantationSchemeTable
                regions={report.regions as never}
                grandTotal={report.grandTotal as never}
                canEdit={!!report.meta.canEditDm}
                editableAdIds={report.meta.editableAdIds}
                onSaveDm={handleSchemeDm}
              />
            )}

            {(sheetType === 'dfls' || sheetType === 'cocoon') && (
              <DflsReportTable
                regions={report.regions as never}
                grandTotal={report.grandTotal as never}
                unit={report.sheet.unit}
                canEdit={!!report.meta.canEditDm}
                editableAdIds={report.meta.editableAdIds}
                onSaveDflsDm={handleDflsDm}
              />
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
