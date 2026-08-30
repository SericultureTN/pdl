import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Search } from 'lucide-react';
import { authService } from '../../../services/auth.js';
import { listGovtReelingOffices } from '../../../services/govtReelingOfficesApi.js';
import GovtReelingOfficeSelect from '../../../components/GovtReelingOfficeSelect.jsx';
import FiscalYearMonthPicker, { getFyStart, resolveMonthInFy, currentFyStart } from '../../../components/FiscalYearMonthPicker.jsx';
import { getFinancialYearKey } from '../set-target/fiscalYear.js';
import {
  getCurrentReport,
  listReports,
  exportReportExcel,
  exportAllOfficesExcel,
} from '../government-reeling-unit/reportsApi.js';
import { applyMis37Calculations } from '../government-reeling-unit/mis37Calculations.js';
import GovernmentReelingUnitPrintView from '../government-reeling-unit/GovernmentReelingUnitPrintView.jsx';

export default function GovtReelingReportViewerPage() {
  const [role, setRole] = useState(null);
  const [ownOfficeId, setOwnOfficeId] = useState(null);
  const [ownOfficeName, setOwnOfficeName] = useState('');
  const [userLoaded, setUserLoaded] = useState(false);

  const canManage = role === 'admin' || role === 'secondary_admin';

  const [region, setRegion] = useState(null);
  const [marketOfficeId, setMarketOfficeId] = useState(null);
  const [allOffices, setAllOffices] = useState(false);
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [browseFyStart, setBrowseFyStart] = useState(currentFyStart);

  const [officeDirectory, setOfficeDirectory] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null); // [{ officeId, officeName, data }]

  const selectionFyStart = month && year ? getFyStart(month, year) : null;
  const fyStart = selectionFyStart ?? browseFyStart;

  const handleFyStartChange = (nextFyStart) => {
    if (month && year) {
      const shifted = resolveMonthInFy(month, nextFyStart);
      if (shifted) {
        setMonth(shifted.month);
        setYear(shifted.year);
      }
    } else {
      setBrowseFyStart(nextFyStart);
    }
  };

  useEffect(() => {
    authService
      .getCurrentUser()
      .then((result) => {
        const user = result?.user;
        setRole(user?.role || null);
        if (user?.role === 'user') {
          setOwnOfficeId(user.office_id ?? null);
          setOwnOfficeName(user.office_name || '');
          setMarketOfficeId(user.office_id ?? null);
        }
      })
      .catch(() => setRole(null))
      .finally(() => setUserLoaded(true));
  }, []);

  useEffect(() => {
    listGovtReelingOffices()
      .then((offices) => {
        const map = {};
        offices.forEach((o) => {
          map[o.id] = o.name;
        });
        setOfficeDirectory(map);
      })
      .catch((err) => console.error('Failed to load office directory:', err));
  }, []);

  const canGenerate = Boolean(month && year) && (canManage ? (allOffices || Boolean(marketOfficeId)) : Boolean(ownOfficeId));

  const handleGenerate = async () => {
    setError('');
    setResults(null);
    const fiscalYear = getFinancialYearKey(month, year);
    if (!fiscalYear) {
      setError('Select a valid month and year.');
      return;
    }

    setLoading(true);
    try {
      if (canManage && allOffices) {
        const reports = await listReports({ fiscalYear });
        const matching = reports.filter((r) => r.month === month && r.data && Object.keys(r.data).length > 0);
        if (matching.length === 0) {
          setError('No reports found for any office in this period.');
        } else {
          setResults(
            matching.map((r) => ({
              officeId: r.officeId,
              officeName: officeDirectory[r.officeId] || `Office #${r.officeId}`,
              data: r.data,
            }))
          );
        }
      } else {
        const targetOfficeId = canManage ? marketOfficeId : ownOfficeId;
        const report = await getCurrentReport({ officeId: targetOfficeId, fiscalYear, month });
        if (!report || !report.data || Object.keys(report.data).length === 0) {
          setError('No report found for this office and period.');
        } else {
          setResults([
            {
              officeId: targetOfficeId,
              officeName: canManage
                ? officeDirectory[targetOfficeId] || `Office #${targetOfficeId}`
                : ownOfficeName,
              data: report.data,
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!results || results.length === 0) return;
    try {
      if (canManage && allOffices) {
        const fiscalYear = getFinancialYearKey(month, year);
        await exportAllOfficesExcel({ fiscalYear, month }, `government-reeling-${fiscalYear}-${month}-all-offices.xlsx`);
      } else {
        const single = results[0];
        // Report id isn't carried on the read-only view results array — re-fetch
        // it via getCurrentReport (cheap, cached by the browser/DB) to get the id.
        const fiscalYear = getFinancialYearKey(month, year);
        const officeId = single.officeId;
        const report = await getCurrentReport({ officeId, fiscalYear, month });
        if (!report?.id) throw new Error('Report id not found');
        await exportReportExcel(report.id, `government-reeling-${single.officeName}-${month}-${year}.xlsx`);
      }
    } catch (err) {
      console.error('Failed to download Excel:', err);
      setError(err.message || 'Failed to download Excel.');
    }
  };

  const handlePrint = () => window.print();

  const computedResults = useMemo(
    () => (results || []).map((r) => ({ ...r, computed: applyMis37Calculations(r.data) })),
    [results]
  );

  if (!userLoaded) {
    return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <h1 className="mb-4 text-lg font-semibold text-emerald-secondary">
          Government Reeling Unit — Report Viewer
        </h1>

        {canManage && (
          <label className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={allOffices}
              onChange={(e) => setAllOffices(e.target.checked)}
              className="h-4 w-4"
            />
            All Offices (consolidated)
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canManage ? (
            <div className="lg:col-span-2">
              <GovtReelingOfficeSelect
                region={region}
                officeId={marketOfficeId}
                onChange={({ region: r, officeId: m }) => {
                  setRegion(r);
                  setMarketOfficeId(m);
                }}
                disabled={allOffices}
                required
              />
            </div>
          ) : (
            <div>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Market Office
              </span>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {ownOfficeName || '—'}
              </div>
            </div>
          )}

          <FiscalYearMonthPicker
            label="Report Period *"
            fyStart={fyStart}
            onFyStartChange={handleFyStartChange}
            selectedMonth={month}
            selectedYear={year}
            onSelectMonth={({ month: m, year: y }) => {
              setMonth(m);
              setYear(y);
            }}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search className="h-4 w-4" /> {loading ? 'Generating…' : 'Generate Report'}
          </button>

          {results && results.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-4 w-4" /> Download Excel
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" /> Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {computedResults.length > 0 && (
        <div className="space-y-8">
          {computedResults.map((r) => (
            <div key={r.officeId} className="report-viewer-office-block break-after-page">
              <div className="mb-2 print:hidden">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {r.officeName}
                </h2>
              </div>
              <GovernmentReelingUnitPrintView values={r.computed} hideActions />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .report-viewer-office-block { break-after: page; }
          .report-viewer-office-block:last-child { break-after: auto; }
        }
      `}</style>
    </div>
  );
}
