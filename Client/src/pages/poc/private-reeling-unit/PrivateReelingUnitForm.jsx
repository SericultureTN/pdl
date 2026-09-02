import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Lock, Printer } from 'lucide-react';
import clsx from 'clsx';
import { authService } from '../../../services/auth.js';
import RegionMarketOfficeSelect from '../../../components/RegionMarketOfficeSelect.jsx';
import FiscalYearMonthPicker, {
  getFyStart,
  resolveMonthInFy,
  currentFyStart,
} from '../../../components/FiscalYearMonthPicker.jsx';
import {
  CATEGORY_TABS,
  EDITABLE_CATEGORY_IDS,
  MIS40_FORM_CODE,
  MIS40_REPORT_TITLE,
} from './mis40Constants.js';
import { mis40FormSchema, mis40HeaderSchema } from './mis40ZodSchema.js';
import { createMis40DefaultValues, loadMis40Draft, saveMis40Draft, MIS40_STORAGE_KEY } from './mis40DefaultValues.js';
import {
  getFinancialYearKey,
  getPeriodKey,
  isReportLocked,
  loadMis40ReportForHeader,
  saveMis40Report,
  submitMis40ReportWithRollover,
} from './mis40MonthRollover.js';
import BeneficiaryEntryPanel from './BeneficiaryEntryPanel.jsx';
import AbstractTabPanel from './AbstractTabPanel.jsx';
import PrivateReelingUnitPrintView from './PrivateReelingUnitPrintView.jsx';
import { getCurrentReport, saveReportDraft, submitReport } from './reportsApi.js';

function zodFieldErrors(error) {
  if (!error?.issues) return {};
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path[issue.path.length - 1], issue.message])
  );
}

async function syncPeriodFromServer(header) {
  if (!header?.marketOfficeId || !header?.year || !header?.month) return;
  const fiscalYear = getFinancialYearKey(header.month, header.year);
  if (!fiscalYear) return;
  try {
    const remote = await getCurrentReport({ officeId: header.marketOfficeId, fiscalYear, month: header.month });
    if (remote?.data && Object.keys(remote.data).length > 0) {
      saveMis40Report(getPeriodKey(header), remote.data);
    }
  } catch (error) {
    console.error('Failed to sync current-period report from server:', error);
  }
}

export default function PrivateReelingUnitForm() {
  const defaultValues = useMemo(() => loadMis40Draft(), []);
  const [header, setHeader] = useState(defaultValues.header);
  const [categories, setCategories] = useState(defaultValues.categories);
  const [meta, setMeta] = useState(defaultValues.meta);

  const [activeTab, setActiveTab] = useState('arm');
  const [savedTabs, setSavedTabs] = useState(defaultValues.meta?.savedTabs || []);
  const [message, setMessage] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [headerErrors, setHeaderErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [ownOfficeId, setOwnOfficeId] = useState(null);
  const [ownRegionId, setOwnRegionId] = useState(null);
  const [browseFyStart, setBrowseFyStart] = useState(currentFyStart);

  const isLocked = isReportLocked(meta);

  const activePeriodRef = useRef(getPeriodKey(defaultValues.header));
  const skipPeriodSwitchRef = useRef(true);

  useEffect(() => {
    authService.getCurrentUser()
      .then((result) => {
        const user = result?.user;
        setCurrentUserRole(user?.role || null);
        if (user?.role === 'user') {
          setOwnOfficeId(user.office_id ?? null);
          setOwnRegionId(user.group_id ?? null);
        }
      })
      .catch(() => setCurrentUserRole(null));
  }, []);

  useEffect(() => {
    if (currentUserRole !== 'user' || !ownOfficeId || !ownRegionId) return;
    if (header.marketOfficeId === ownOfficeId) return;
    setHeader((prev) => ({ ...prev, regionId: ownRegionId, marketOfficeId: ownOfficeId }));
  }, [currentUserRole, ownOfficeId, ownRegionId, header.marketOfficeId]);

  // Switching Region/Office/Month/Year loads that period's report (server-synced
  // first, then U.L.M-carried-forward local draft), same pattern as Government
  // Reeling Unit's period switch.
  useEffect(() => {
    if (!header.marketOfficeId || !header.month || !header.year) return;
    const nextKey = getPeriodKey(header);
    if (!nextKey) return;

    if (skipPeriodSwitchRef.current) {
      skipPeriodSwitchRef.current = false;
      activePeriodRef.current = nextKey;
      return;
    }
    if (nextKey === activePeriodRef.current) return;

    const outgoingKey = activePeriodRef.current;
    if (outgoingKey) {
      saveMis40Report(outgoingKey, { header, categories, meta: { ...meta, savedTabs } });
    }
    activePeriodRef.current = nextKey;

    let cancelled = false;
    (async () => {
      await syncPeriodFromServer(header);
      if (cancelled) return;
      const loaded = loadMis40ReportForHeader(header);
      setHeader(loaded.header);
      setCategories(loaded.categories);
      setMeta(loaded.meta);
      setSavedTabs(loaded.meta?.savedTabs || []);
      setMessage(
        loaded.meta?.ulmCarriedFrom
          ? `U.L.M values carried from ${loaded.meta.ulmCarriedFrom.replace(/\|/g, ' / ')}.`
          : ''
      );
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header.marketOfficeId, header.month, header.year]);

  const selectionFyStart = header.month && header.year ? getFyStart(header.month, header.year) : null;
  const fyStart = selectionFyStart ?? browseFyStart;

  const handleFyStartChange = (nextFyStart) => {
    if (header.month && header.year) {
      const shifted = resolveMonthInFy(header.month, nextFyStart);
      if (shifted) setHeader((prev) => ({ ...prev, month: shifted.month, year: String(shifted.year) }));
    } else {
      setBrowseFyStart(nextFyStart);
    }
  };

  const handleRowsChange = (categoryId, rows) => {
    const nextCategories = { ...categories, [categoryId]: { rows } };
    setCategories(nextCategories);
    persistLocalDraft(nextCategories, savedTabs);
  };

  const persistLocalDraft = (nextCategories, nextSavedTabs) => {
    const payload = { header, categories: nextCategories, meta: { ...meta, savedTabs: nextSavedTabs } };
    saveMis40Draft(payload);
    const periodKey = getPeriodKey(header);
    if (periodKey && !isReportLocked(meta)) saveMis40Report(periodKey, payload);
  };

  const validateHeader = () => {
    const result = mis40HeaderSchema.safeParse(header);
    if (!result.success) {
      setHeaderErrors(zodFieldErrors(result.error));
      return false;
    }
    setHeaderErrors({});
    return true;
  };

  const handleSaveTab = (categoryId) => {
    if (!validateHeader()) {
      setMessage('Complete the shared header (Region, Market Office, Assistant Director, Month, Year) before saving.');
      return;
    }

    const nextSaved = savedTabs.includes(categoryId) ? savedTabs : [...savedTabs, categoryId];
    setSavedTabs(nextSaved);
    persistLocalDraft(categories, nextSaved);
    setMessage(`${categoryId.toUpperCase()} tab saved.`);

    const currentIdx = EDITABLE_CATEGORY_IDS.indexOf(categoryId);
    setActiveTab(currentIdx < EDITABLE_CATEGORY_IDS.length - 1 ? EDITABLE_CATEGORY_IDS[currentIdx + 1] : 'abstract');
  };

  const handleSubmit = async () => {
    if (isLocked) {
      setMessage('This report is submitted and locked.');
      return;
    }
    if (!validateHeader()) {
      setMessage('Complete the header before submitting.');
      return;
    }

    const formResult = mis40FormSchema.safeParse({ header, categories });
    if (!formResult.success) {
      setMessage('Resolve all validation errors before submitting — every category needs at least one beneficiary.');
      return;
    }

    let submittedBy = 'unknown';
    try {
      const user = await authService.getCurrentUser();
      submittedBy = user?.user?.email || user?.user?.username || 'unknown';
    } catch {
      /* session unavailable in POC */
    }

    const report = {
      header,
      categories,
      signOff: { extensionOfficer: '', signedAt: new Date().toISOString() },
      meta: { ...meta, savedTabs },
    };

    const result = submitMis40ReportWithRollover(report, submittedBy);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setSaving(true);
    try {
      const fiscalYear = getFinancialYearKey(header.month, header.year);
      const saved = await saveReportDraft({
        officeId: header.marketOfficeId,
        fiscalYear,
        month: header.month,
        data: result.submittedReport,
      });
      await submitReport(saved.id);

      if (result.nextDraft) {
        const nextFiscalYear = getFinancialYearKey(result.nextHeader.month, result.nextHeader.year);
        await saveReportDraft({
          officeId: result.nextHeader.marketOfficeId,
          fiscalYear: nextFiscalYear,
          month: result.nextHeader.month,
          data: result.nextDraft,
        });
      }

      setHeader(result.submittedReport.header);
      setCategories(result.submittedReport.categories);
      setMeta(result.submittedReport.meta);
      setSavedTabs(result.submittedReport.meta?.savedTabs || savedTabs);
      localStorage.setItem(MIS40_STORAGE_KEY, JSON.stringify(result.submittedReport));
      activePeriodRef.current = getPeriodKey(result.submittedReport.header);

      const nextLabel = result.nextHeader ? `${result.nextHeader.month} ${result.nextHeader.year}` : null;
      setMessage(
        nextLabel
          ? `Report submitted and locked. ${nextLabel} draft created with U.L.M carried forward from this month's U.M values.`
          : 'Report submitted and locked.'
      );
    } catch (error) {
      console.error('Failed to sync submission to server:', error);
      setMessage('Report submission failed to sync to the server. Please try submitting again.');
    } finally {
      setSaving(false);
    }
  };

  if (showPrint) {
    return (
      <PrivateReelingUnitPrintView
        header={header}
        categories={categories}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  const activeCategory = CATEGORY_TABS.find((t) => t.id === activeTab);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-secondary">{MIS40_REPORT_TITLE}</h1>
          <p className="text-sm text-slate-500">PDL {MIS40_FORM_CODE} — Card-based data entry</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPrint(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" /> Print / Export
        </button>
      </div>

      <div className="sticky top-0 z-20 rounded-xl border border-emerald-primary/20 bg-white/95 p-4 shadow-md backdrop-blur">
        <h2 className="mb-3 text-base font-semibold text-emerald-secondary">Unit &amp; Period Details</h2>
        <div className="max-w-xs">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">PDL No.</span>
            <input type="text" readOnly value={header.pdlNo || MIS40_FORM_CODE} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-4 max-w-sm">
          <FiscalYearMonthPicker
            label="Report Period *"
            fyStart={fyStart}
            onFyStartChange={handleFyStartChange}
            selectedMonth={header.month}
            selectedYear={header.year}
            onSelectMonth={({ month, year }) => setHeader((prev) => ({ ...prev, month, year: String(year) }))}
            disabled={isLocked}
          />
          {headerErrors.month && <p className="mt-1 text-xs text-red-600">{headerErrors.month}</p>}
        </div>
        <div className="mt-4">
          <RegionMarketOfficeSelect
            regionId={header.regionId || null}
            marketOfficeId={header.marketOfficeId || null}
            onChange={({ regionId, marketOfficeId }) =>
              setHeader((prev) => ({ ...prev, regionId: regionId ?? '', marketOfficeId: marketOfficeId ?? '' }))
            }
            disabled={isLocked || currentUserRole === 'user'}
            officeLabel="Private Reeling Units"
            required
          />
          {(headerErrors.regionId || headerErrors.marketOfficeId) && (
            <p className="mt-1 text-xs text-red-600">{headerErrors.regionId || headerErrors.marketOfficeId}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-medium transition',
              activeTab === tab.id ? 'bg-emerald-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {tab.label}
            {savedTabs.includes(tab.id) && <CheckCircle2 className="ml-1 inline-block h-4 w-4 text-emerald-300" />}
          </button>
        ))}
      </div>

      {message && (
        <div className={clsx('rounded-lg px-4 py-3 text-sm', isLocked ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800')}>
          {message}
        </div>
      )}

      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Submitted report — locked
            {meta.submittedAt ? ` on ${new Date(meta.submittedAt).toLocaleString()}` : ''}
            {meta.submittedBy ? ` by ${meta.submittedBy}` : ''}.
          </span>
        </div>
      )}

      {activeTab === 'abstract' ? (
        <AbstractTabPanel categories={categories} header={header} />
      ) : activeCategory ? (
        <BeneficiaryEntryPanel
          category={activeCategory}
          rows={Array.isArray(categories[activeTab]?.rows) ? categories[activeTab].rows : []}
          onRowsChange={(rows) => handleRowsChange(activeTab, rows)}
          isLocked={isLocked}
          month={header.month}
        />
      ) : null}

      {!isLocked && activeTab !== 'abstract' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveTab(activeTab)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Save tab &amp; continue
          </button>
        </div>
      )}

      {!isLocked && activeTab === 'abstract' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-light disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> Submit Report
          </button>
        </div>
      )}
    </div>
  );
}
