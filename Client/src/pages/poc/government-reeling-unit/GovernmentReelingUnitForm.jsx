import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Printer, Save } from 'lucide-react';
import { authService } from '../../../services/auth.js';
import { MIS37_SHARED_HEADER_SECTION, MIS37_TAB_SECTIONS } from './mis37FormSchema.js';
import { MIS37_TAB_SCHEMAS } from './mis37ZodSchema.js';
import { createMis37DefaultValues, loadMis37Draft, MIS37_STORAGE_KEY } from './mis37DefaultValues.js';
import { applyMis37Calculations } from './mis37Calculations.js';
import {
  getFinancialYearKey,
  getPeriodKey,
  getPreviousPeriod,
  isReportLocked,
  loadMis37ReportForHeader,
  saveMis37Report,
  submitMis37ReportWithRollover,
} from './mis37MonthRollover.js';
import { FINANCIAL_BUDGET_ROWS, PRODUCTION_WORK_ROWS, RECEIPT_ITEMS, COCOON_STOCK_ROWS, COCOON_STOCK_METRICS, NSC_EXPENDITURE_ROWS, COST_DETAIL_FIELDS, COST_OF_PRODUCTION_ROWS } from './mis37Constants.js';
import { deriveMonthlyFromAnnual } from './deriveMonthlyFromAnnual.js';
import { SchemaSectionRenderer, SharedHeaderRenderer } from './SchemaFormRenderer.jsx';
import GovernmentReelingUnitPrintView from './GovernmentReelingUnitPrintView.jsx';
import { getCurrentTarget } from '../set-target/targetsApi.js';
import { getCurrentReport, saveReportDraft, submitReport } from './reportsApi.js';
import { pocFullPath } from '../pocNavConfig.js';
import { useToast, ToastViewport } from '../../../components/Toast.jsx';

/**
 * Primes the localStorage period-cache that mis37MonthRollover.js reads/writes
 * from real DB state before any of its (unchanged, synchronous) load/rollover
 * functions run — so those functions' proven carry-forward math keeps working
 * unmodified while the database, not the browser, is the record that survives
 * across sessions/devices. Fetches this period and (for U.L.M rollover) the
 * previous period.
 */
async function syncPeriodFromServer(header) {
  if (!header?.marketOfficeId || !header?.year || !header?.month || !header?.unitName) return;

  const fiscalYear = getFinancialYearKey(header.month, header.year);
  if (!fiscalYear) return;

  try {
    const remote = await getCurrentReport({
      officeId: header.marketOfficeId,
      fiscalYear,
      month: header.month,
    });
    if (remote?.data && Object.keys(remote.data).length > 0) {
      saveMis37Report(getPeriodKey(header), remote.data);
    }
  } catch (error) {
    console.error('Failed to sync current-period report from server:', error);
  }

  const priorPeriod = getPreviousPeriod(header.month, header.year);
  if (!priorPeriod) return;

  try {
    const priorFiscalYear = getFinancialYearKey(priorPeriod.month, priorPeriod.year);
    const priorRemote = await getCurrentReport({
      officeId: header.marketOfficeId,
      fiscalYear: priorFiscalYear,
      month: priorPeriod.month,
    });
    if (priorRemote?.status === 'submitted' && priorRemote.data) {
      saveMis37Report(
        `${header.unitName}|${priorPeriod.year}|${priorPeriod.month}`,
        priorRemote.data
      );
    }
  } catch (error) {
    console.error('Failed to sync prior-period report from server:', error);
  }
}

function annualToMonthlyDm(annualValue, month) {
  if (annualValue === undefined || annualValue === null || annualValue === '') return '';
  return deriveMonthlyFromAnnual(annualValue, month);
}

/**
 * Fetches the YEARLY target/budget (one row per office+fiscal year, set on
 * Set Target). Physical Target is yearly ÷ 12 into this month's D.M
 * (deriveMonthlyFromAnnual) — U.L.M is exclusively rollover-driven (carried
 * forward from last month's U.M, reset at April). Financial Budget Outlay is
 * NOT divided — the full yearly figure is set as-is, unchanged every month.
 * Extracted so it can be called explicitly right after any reset() that
 * reloads a period's report data — reset() replaces the whole form tree, so
 * without this the two effects can race: whichever runs last wins, and a
 * reset() landing after the debounced target-fetch effect's setValue calls
 * would silently wipe the target/budget figures back to blank.
 */
async function applyCurrentTargetToForm(header, setValue) {
  if (!header?.marketOfficeId || !header?.year || !header?.month) return 'missing';
  const fiscalYear = getFinancialYearKey(header.month, header.year);
  if (!fiscalYear) return 'missing';
  try {
    const target = await getCurrentTarget({
      unitType: 'government_reeling',
      officeId: header.marketOfficeId,
      fiscalYear,
    });
    if (!target) return 'missing';

    setValue(
      'tab1.achievementPhysical.target.dm',
      annualToMonthlyDm(target.physicalTarget?.target, header.month),
      { shouldDirty: false, shouldValidate: false }
    );

    FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
      setValue(
        `tab1.achievementFinancial.${rowKey}.budgetOutlay`,
        target.budgetOutlay?.[rowKey] ?? '',
        { shouldDirty: false, shouldValidate: false }
      );
    });

    return 'found';
  } catch (error) {
    console.error('Failed to fetch target:', error);
    return 'missing';
  }
}

const TAB_IDS = ['tab1', 'tab2', 'tab3'];
const STEP_REVIEW = 'review';

function loadSavedDraft() {
  return loadMis37Draft();
}

function applyComputedToForm(values, setValue) {
  const computed = applyMis37Calculations(values);

  // Tab 1: Achievement physical
  ['target', 'achieved'].forEach((rowKey) => {
    setValue(`tab1.achievementPhysical.${rowKey}.um`, computed.tab1.achievementPhysical[rowKey].um, { shouldDirty: false, shouldValidate: false });
  });

  // Tab 1: Achievement financial — Variance = Outlay - Expenses (D.M)
  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    const cat = computed.tab1.achievementFinancial[rowKey];
    setValue(`tab1.achievementFinancial.${rowKey}.variance`, cat.variance, { shouldDirty: false, shouldValidate: false });
  });

  // Tab 1: Production Details — Days Worked / Mandays Used
  PRODUCTION_WORK_ROWS.forEach(({ key }) => {
    setValue(`tab1.productionDetails.${key}.um`, computed.tab1.productionDetails[key].um, { shouldDirty: false, shouldValidate: false });
  });
  Object.entries(computed.tab1.stockParticulars).forEach(([itemKey, row]) => {
    setValue(`tab1.stockParticulars.${itemKey}.total`, row.total, { shouldDirty: false, shouldValidate: false });
    setValue(`tab1.stockParticulars.${itemKey}.closingBalance`, row.closingBalance, { shouldDirty: false, shouldValidate: false });
  });

  RECEIPT_ITEMS.forEach(({ key }) => {
    setValue(`tab1.receipts.${key}.valueRs.um`, computed.tab1.receipts[key].valueRs.um, { shouldDirty: false, shouldValidate: false });
  });

  // Tab 2: Cocoon stock movement
  COCOON_STOCK_ROWS.forEach(({ key }) => {
    COCOON_STOCK_METRICS.forEach(({ key: metricKey }) => {
      ['ulm', 'dm', 'um'].forEach((col) => {
        setValue(
          `tab2.cocoonStockMovement.${key}.${metricKey}.${col}`,
          computed.tab2.cocoonStockMovement[key][metricKey][col],
          { shouldDirty: false, shouldValidate: false }
        );
      });
    });
  });

  // Tab 2: NSC expenditure
  NSC_EXPENDITURE_ROWS.filter((r) => !r.computed).forEach(({ key }) => {
    ['ulm', 'dm', 'um'].forEach((col) => {
      setValue(`tab2.nscExpenditure.${key}.${col}`, computed.tab2.nscExpenditure[key][col], {
        shouldDirty: false,
        shouldValidate: false,
      });
    });
  });
  setValue('tab2.nscExpenditure.total.ulm', computed.tab2.nscExpenditure.total.ulm, { shouldDirty: false, shouldValidate: false });
  setValue('tab2.nscExpenditure.total.dm', computed.tab2.nscExpenditure.total.dm, { shouldDirty: false, shouldValidate: false });
  setValue('tab2.nscExpenditure.total.um', computed.tab2.nscExpenditure.total.um, { shouldDirty: false, shouldValidate: false });

  // Tab 2: Cost details — no U.L.M. U.M is always recalculated; D.M is also recalculated
  // for the fields that are formula-derived rather than typed in (computedDm).
  COST_DETAIL_FIELDS.forEach(({ key, computedDm }) => {
    if (computedDm) {
      setValue(`tab2.costDetails.${key}.dm`, computed.tab2.costDetails[key].dm, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
    setValue(`tab2.costDetails.${key}.um`, computed.tab2.costDetails[key].um, {
      shouldDirty: false,
      shouldValidate: false,
    });
  });

  // Tab 2: Cost of production — computed rows sync all columns; manual rows sync U.M only
  COST_OF_PRODUCTION_ROWS.forEach(({ key, timePeriod, computed: isComputedRow }) => {
    const row = computed.tab2?.costOfProduction?.[key];
    if (!row) return;

    if (isComputedRow) {
      ['ulm', 'dm', 'um'].forEach((col) => {
        setValue(`tab2.costOfProduction.${key}.${col}`, row[col] ?? '', {
          shouldDirty: false,
          shouldValidate: false,
        });
      });
    } else if (timePeriod) {
      setValue(`tab2.costOfProduction.${key}.um`, row.um ?? '', {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  });

  // Tab 3: Stock Details Kgs — mirrored items sync opening/purchase/sold too; all items sync total/closing
  Object.entries(computed.tab3.stockDetailsKgs).forEach(([itemKey, row]) => {
    setValue(`tab3.stockDetailsKgs.${itemKey}.openingBalance`, row.openingBalance, { shouldDirty: false, shouldValidate: false });
    setValue(`tab3.stockDetailsKgs.${itemKey}.purchase`, row.purchase, { shouldDirty: false, shouldValidate: false });
    setValue(`tab3.stockDetailsKgs.${itemKey}.soldIssued`, row.soldIssued, { shouldDirty: false, shouldValidate: false });
    setValue(`tab3.stockDetailsKgs.${itemKey}.total`, row.total, { shouldDirty: false, shouldValidate: false });
    setValue(`tab3.stockDetailsKgs.${itemKey}.closingBalance`, row.closingBalance, { shouldDirty: false, shouldValidate: false });
  });

  // Tab 3: Estimated Sale Value — Raw Silk U.M is computed; Bye Products mirrors Tab 2 in full
  setValue('tab3.estimatedSaleValue.rawSilk.um', computed.tab3.estimatedSaleValue.rawSilk.um, { shouldDirty: false, shouldValidate: false });
  ['ulm', 'dm', 'um'].forEach((col) => {
    setValue(`tab3.estimatedSaleValue.byeProducts.${col}`, computed.tab3.estimatedSaleValue.byeProducts[col], { shouldDirty: false, shouldValidate: false });
    setValue(`tab3.estimatedSaleValue.total.${col}`, computed.tab3.estimatedSaleValue.total[col], { shouldDirty: false, shouldValidate: false });
  });

  // Tab 3: Actual Receipt Details (Section VII) — 2 items (Silk Sold, Bye Products Sold),
  // each Current Year / Previous Year; every leaf row's U.M only (D.M is typed in). No
  // total or pending rows.
  ['silkSold', 'byeProductsSold'].forEach((rowKey) => {
    const row = computed.tab3.actualReceiptDetails[rowKey];
    ['currentYear', 'previousYear'].forEach((periodKey) => {
      setValue(`tab3.actualReceiptDetails.${rowKey}.${periodKey}.qty.um`, row[periodKey].qty.um, { shouldDirty: false, shouldValidate: false });
      setValue(`tab3.actualReceiptDetails.${rowKey}.${periodKey}.value.um`, row[periodKey].value.um, { shouldDirty: false, shouldValidate: false });
    });
  });

  setValue('tab3.profitLoss.dm', computed.tab3.profitLoss.dm, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.profitLoss.um', computed.tab3.profitLoss.um, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.profitLoss.dmIsProfit', computed.tab3.profitLoss.dmIsProfit, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.profitLoss.umIsProfit', computed.tab3.profitLoss.umIsProfit, { shouldDirty: false, shouldValidate: false });
}

function ReviewSummary({ values }) {
  const header = values.header || {};
  const profitLoss = values.tab3?.profitLoss || {};

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-primary/20 bg-emerald-muted p-4">
        <h3 className="text-lg font-semibold text-emerald-secondary">Report Summary</h3>
        <p className="mt-1 text-sm text-slate-600">
          {header.unitName || '—'} ({header.unitCode || '—'}) — {header.month || '—'} {header.year || '—'}
        </p>
      </div>

      {MIS37_TAB_SECTIONS.map((tab) => (
        <div key={tab.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 font-semibold text-emerald-secondary">{tab.label}</h4>
          <p className="text-sm text-slate-600">
            {tab.sections.length} section(s) completed. All calculated totals and balances have been applied.
          </p>
        </div>
      ))}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-slate-500">D.M Result</p>
          <p className="text-xl font-bold text-emerald-700">
            {profitLoss.dmIsProfit ? 'Profit' : 'Loss'}: Rs {Math.abs(Number(profitLoss.dm) || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-slate-500">U.M Result</p>
          <p className="text-xl font-bold text-emerald-700">
            {profitLoss.umIsProfit ? 'Profit' : 'Loss'}: Rs {Math.abs(Number(profitLoss.um) || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GovernmentReelingUnitForm() {
  const [activeStep, setActiveStep] = useState('tab1');
  const [savedTabs, setSavedTabs] = useState([]);
  const [message, setMessage] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, showToast] = useToast();
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Secondary Admin gets view-only access to every office's reports — piggyback on
  // the existing meta.locked/isReportLocked mechanism every field renderer already
  // respects, rather than threading a second readOnly flag through the whole form.
  useEffect(() => {
    authService.getCurrentUser()
      .then((result) => setCurrentUserRole(result?.user?.role || null))
      .catch(() => setCurrentUserRole(null));
  }, []);
  const isReadOnlyForRole = currentUserRole === 'secondary_admin';

  const defaultValues = useMemo(() => loadSavedDraft(), []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: 'onBlur',
  });

  const watchedValues = useWatch({ control });
  const headerMonth = useWatch({ control, name: 'header.month' });
  const headerYear = useWatch({ control, name: 'header.year' });
  const headerUnitName = useWatch({ control, name: 'header.unitName' });
  const headerMarketOfficeId = useWatch({ control, name: 'header.marketOfficeId' });
  const reportMeta = useWatch({ control, name: 'meta' }) || {};
  const isLocked = isReportLocked(reportMeta);

  // Each field renderer inside SchemaSectionRenderer independently re-derives its own
  // `locked` from watch()?.meta (see SchemaFormRenderer.jsx) rather than taking a prop,
  // so a Secondary Admin's view-only access is applied by writing meta.locked into the
  // live form state itself, not just a local variable here.
  useEffect(() => {
    if (isReadOnlyForRole && !reportMeta?.locked) {
      setValue('meta.locked', true, { shouldDirty: false, shouldValidate: false });
    }
  }, [isReadOnlyForRole, reportMeta?.locked, setValue]);

  // NOTE: there used to be an effect here forcing a 'user' account's office
  // selection to match their assigned office (poc_users.office_id), since a
  // 'user' write is always forced server-side to req.user.officeId anyway.
  // Removed: Government Reeling Unit offices now live in their own table
  // (govt_reeling_offices) with their own id space, disjoint from
  // poc_users.office_id (which still points at the shared poc_offices used
  // by Private Reeling/Twisting) — so that comparison is no longer
  // meaningful. A 'user' assigned to Government Reeling Unit duty currently
  // picks their office freely on this form each time.

  const activePeriodRef = useRef(getPeriodKey(defaultValues.header));
  const skipPeriodSwitchRef = useRef(true);

  const [targetStatus, setTargetStatus] = useState('loading');

  // Targets are monthly now: one Target (Kgs) + Budget Outlay per Office + calendar
  // year + month (set on the Set Target page), not one annual figure per typed Unit Name.
  useEffect(() => {
    if (!headerMarketOfficeId || !headerYear || !headerMonth) {
      setTargetStatus('missing');
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const header = { marketOfficeId: headerMarketOfficeId, year: headerYear, month: headerMonth };
      const status = await applyCurrentTargetToForm(header, setValue);
      if (!cancelled) setTargetStatus(status);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [headerMarketOfficeId, headerMonth, headerYear, setValue]);

  useEffect(() => {
    const cop = getValues('tab2.costOfProduction') || {};
    ['saleValueByeProducts', 'costPerKgWithStaff', 'costPerKgWithoutStaff'].forEach((key) => {
      const row = cop[key];
      if (!row || typeof row !== 'object') {
        setValue(`tab2.costOfProduction.${key}`, { ulm: '', dm: '', um: '' }, {
          shouldDirty: false,
          shouldValidate: false,
        });
        return;
      }
      if (row.ulm === undefined) {
        setValue(`tab2.costOfProduction.${key}.ulm`, '', { shouldDirty: false, shouldValidate: false });
      }
    });
  }, [getValues, setValue]);

  useEffect(() => {
    if (!watchedValues || Object.keys(watchedValues).length === 0) return;
    applyComputedToForm(watchedValues, setValue);
  }, [watchedValues, setValue]);

  useEffect(() => {
    if (defaultValues.meta?.savedTabs) {
      setSavedTabs(defaultValues.meta.savedTabs);
    }
    if (defaultValues.meta?.status === 'submitted') {
      setSubmitted(true);
    }
  }, [defaultValues]);

  // Database is the source of truth: on mount, sync whatever period the
  // restored draft/header points at from the server before the user touches
  // anything, so a fresh session/device picks up real submitted data instead
  // of only what happens to be cached in this browser's localStorage.
  useEffect(() => {
    const header = defaultValues.header;
    if (!header?.marketOfficeId || !header?.year || !header?.month || !header?.unitName) return;
    let cancelled = false;
    (async () => {
      await syncPeriodFromServer(header);
      if (cancelled) return;
      const loaded = loadMis37ReportForHeader(header);
      reset(loaded);
      setSavedTabs(loaded.meta?.savedTabs || []);
      setSubmitted(loaded.meta?.status === 'submitted');
      const status = await applyCurrentTargetToForm(header, setValue);
      if (!cancelled) setTargetStatus(status);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!headerUnitName || !headerMonth || !headerYear) return;

    const nextKey = getPeriodKey({
      unitName: headerUnitName,
      month: headerMonth,
      year: headerYear,
    });
    if (!nextKey) return;

    if (skipPeriodSwitchRef.current) {
      skipPeriodSwitchRef.current = false;
      activePeriodRef.current = nextKey;
      return;
    }

    if (nextKey === activePeriodRef.current) return;

    const outgoingKey = activePeriodRef.current;
    if (outgoingKey) {
      const outgoing = getValues();
      saveMis37Report(outgoingKey, {
        ...outgoing,
        meta: { ...outgoing.meta, savedTabs: outgoing.meta?.savedTabs ?? savedTabs },
      });
    }

    const nextHeader = {
      unitName: headerUnitName,
      month: headerMonth,
      year: headerYear,
      marketOfficeId: headerMarketOfficeId,
    };
    activePeriodRef.current = nextKey;

    let cancelled = false;
    (async () => {
      await syncPeriodFromServer(nextHeader);
      if (cancelled) return;
      const loaded = loadMis37ReportForHeader(nextHeader);
      reset(loaded);
      setSavedTabs(loaded.meta?.savedTabs || []);
      setSubmitted(loaded.meta?.status === 'submitted');
      setMessage(
        loaded.meta?.ulmCarriedFrom
          ? `U.L.M values carried from ${loaded.meta.ulmCarriedFrom.replace(/\|/g, ' / ')}.`
          : ''
      );
      const status = await applyCurrentTargetToForm(nextHeader, setValue);
      if (!cancelled) setTargetStatus(status);
    })();
    return () => {
      cancelled = true;
    };
  }, [headerUnitName, headerMonth, headerYear, headerMarketOfficeId, getValues, reset]);

  const currentTab = MIS37_TAB_SECTIONS.find((tab) => tab.id === activeStep);

  const persistDraft = async (nextSavedTabs, status = 'draft') => {
    const values = getValues();
    const payload = {
      ...values,
      meta: {
        ...values.meta,
        savedTabs: nextSavedTabs,
        status: isReportLocked(values.meta) ? 'submitted' : status,
      },
    };
    const periodKey = getPeriodKey(payload.header);
    if (periodKey && !isReportLocked(payload.meta)) {
      saveMis37Report(periodKey, payload);
    }
    localStorage.setItem(MIS37_STORAGE_KEY, JSON.stringify(payload));

    const header = payload.header;
    if (header?.marketOfficeId && header?.year && header?.month && !isReportLocked(payload.meta)) {
      const fiscalYear = getFinancialYearKey(header.month, header.year);
      if (fiscalYear) {
        try {
          await saveReportDraft({
            officeId: header.marketOfficeId,
            fiscalYear,
            month: header.month,
            data: payload,
          });
        } catch (error) {
          console.error('Failed to save report to server:', error);
          setMessage('Saved locally, but syncing to the server failed — check your connection and try again.');
        }
      }
    }
  };

  const validateStep = async (stepId) => {
    if (stepId === STEP_REVIEW) return true;

    const headerOk = await trigger('header');
    if (!headerOk) {
      setMessage('Please complete the shared header before continuing.');
      return false;
    }

    // region/marketOfficeId are setValue-driven (GovtReelingOfficeSelect), not
    // register-driven, so trigger('header') above doesn't see them.
    if (!getValues('header.region') || !getValues('header.marketOfficeId')) {
      setMessage('Please select a Region and Office before continuing.');
      return false;
    }

    const schema = MIS37_TAB_SCHEMAS[stepId];
    if (!schema) return true;

    try {
      schema.parse(getValues()[stepId]);
      setMessage('');
      return true;
    } catch (err) {
      await trigger(stepId);
      const firstIssue = err?.issues?.[0];
      const detail = firstIssue ? ` (${firstIssue.path.join(' → ')}: ${firstIssue.message})` : '';
      setMessage(`Please fix validation errors on this tab before saving.${detail}`);
      return false;
    }
  };

  const handleSaveAndContinue = async () => {
    if (isLocked) {
      setMessage('This report is submitted and locked.');
      return;
    }

    const ok = await validateStep(activeStep);
    if (!ok) return;

    const nextSaved = savedTabs.includes(activeStep)
      ? savedTabs
      : [...savedTabs, activeStep];
    setSavedTabs(nextSaved);
    await persistDraft(nextSaved);
    setMessage((prev) => (prev?.includes('syncing to the server failed') ? prev : 'Tab saved successfully.'));

    const currentIndex = TAB_IDS.indexOf(activeStep);
    if (currentIndex < TAB_IDS.length - 1) {
      setActiveStep(TAB_IDS[currentIndex + 1]);
    } else {
      setActiveStep(STEP_REVIEW);
    }
  };

  const handleFinalSubmit = handleSubmit(async () => {
    if (isLocked) {
      setMessage('This report is submitted and locked.');
      return;
    }

    const allSaved = TAB_IDS.every((id) => savedTabs.includes(id));
    if (!allSaved) {
      setMessage('Save all three tabs before final submission.');
      return;
    }

    const headerOk = await trigger('header');
    if (!headerOk || !getValues('header.region') || !getValues('header.marketOfficeId')) {
      setMessage('Please resolve all validation errors before submitting.');
      return;
    }

    for (const tabId of TAB_IDS) {
      const schema = MIS37_TAB_SCHEMAS[tabId];
      if (!schema) continue;
      const result = schema.safeParse(getValues()[tabId]);
      if (!result.success) {
        await trigger(tabId);
        const firstIssue = result.error?.issues?.[0];
        const detail = firstIssue ? ` (${firstIssue.path.join(' → ')}: ${firstIssue.message})` : '';
        setMessage(`Please resolve all validation errors before submitting.${detail}`);
        setActiveStep(tabId);
        return;
      }
    }

    let submittedBy = 'unknown';
    try {
      const user = await authService.getCurrentUser();
      submittedBy = user?.email || user?.username || 'unknown';
    } catch {
      /* session unavailable in POC */
    }

    const result = submitMis37ReportWithRollover(getValues(), submittedBy);
    if (!result.ok) {
      setMessage(result.error);
      showToast('error', `Submit failed — ${result.error}`);
      return;
    }

    // Push the final submission to the database — this is what makes it
    // visible to the Report Viewer / other offices, not just this browser.
    try {
      const header = result.submittedReport.header;
      const fiscalYear = getFinancialYearKey(header.month, header.year);
      const savedReport = await saveReportDraft({
        officeId: header.marketOfficeId,
        fiscalYear,
        month: header.month,
        data: result.submittedReport,
      });
      await submitReport(savedReport.id);

      if (result.nextDraft) {
        const nextHeader = result.nextDraft.header;
        const nextFiscalYear = getFinancialYearKey(nextHeader.month, nextHeader.year);
        await saveReportDraft({
          officeId: nextHeader.marketOfficeId,
          fiscalYear: nextFiscalYear,
          month: nextHeader.month,
          data: result.nextDraft,
        });
      }
    } catch (error) {
      console.error('Failed to sync submission to server:', error);
      // submitMis37ReportWithRollover already committed 'submitted' into the
      // local period-cache above — roll that back to 'draft' so a retry
      // isn't blocked by its own "already submitted" guard.
      const periodKey = getPeriodKey(result.submittedReport.header);
      if (periodKey) {
        saveMis37Report(periodKey, {
          ...result.submittedReport,
          meta: { ...result.submittedReport.meta, status: 'draft', locked: false },
        });
      }
      const reason = error?.message || 'please try again';
      setMessage('Report submission failed to sync to the server. Please try submitting again.');
      showToast('error', `Submit failed — ${reason}`);
      return;
    }

    // Move straight to next month's (mostly blank, U.L.M carried) draft rather
    // than leaving this month's just-submitted values on screen — submitting
    // should clear the form for fresh entry, not display a read-only copy.
    const freshDraft = result.nextDraft || {
      ...createMis37DefaultValues(),
      header: { ...createMis37DefaultValues().header, unitName: result.submittedReport.header.unitName, unitCode: result.submittedReport.header.unitCode, region: result.submittedReport.header.region, marketOfficeId: result.submittedReport.header.marketOfficeId },
    };
    skipPeriodSwitchRef.current = true;
    reset(freshDraft);
    setSubmitted(false);
    setSavedTabs(freshDraft.meta?.savedTabs || []);
    setActiveStep('tab1');
    localStorage.setItem(MIS37_STORAGE_KEY, JSON.stringify(freshDraft));
    activePeriodRef.current = getPeriodKey(freshDraft.header);
    const status = await applyCurrentTargetToForm(freshDraft.header, setValue);
    setTargetStatus(status);

    const nextLabel = result.nextHeader
      ? `${result.nextHeader.month} ${result.nextHeader.year}`
      : null;
    setMessage(
      nextLabel
        ? `Report submitted and locked. Now showing the ${nextLabel} draft, with U.L.M carried forward from this month's U.M values.`
        : 'Report submitted and locked.'
    );
    showToast('success', 'Submitted successfully');
  });

  if (showPrint) {
    return (
      <GovernmentReelingUnitPrintView
        values={applyMis37Calculations(getValues())}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <ToastViewport toast={toast} />
      <form onSubmit={handleFinalSubmit} className="space-y-4">
        <SharedHeaderRenderer
          section={MIS37_SHARED_HEADER_SECTION}
          register={register}
          errors={errors}
          watch={() => watchedValues}
          setValue={setValue}
        />

        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {MIS37_TAB_SECTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStep(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeStep === tab.id
                  ? 'bg-emerald-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              {savedTabs.includes(tab.id) && (
                <CheckCircle2 className="ml-1 inline-block h-4 w-4 text-emerald-300" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveStep(STEP_REVIEW)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeStep === STEP_REVIEW
                ? 'bg-emerald-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Review & Submit
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${submitted || message.startsWith('Report submitted') ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            {(submitted || message.startsWith('Report submitted')) && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        {isLocked && isReadOnlyForRole && reportMeta.status !== 'submitted' && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Viewing read-only — Secondary Admin access.</span>
          </div>
        )}

        {isLocked && reportMeta.status === 'submitted' && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              Submitted report — locked on{' '}
              {reportMeta.submittedAt
                ? new Date(reportMeta.submittedAt).toLocaleString()
                : '—'}
              {reportMeta.submittedBy ? ` by ${reportMeta.submittedBy}` : ''}.
              {reportMeta.ulmCarriedFrom && (
                <> U.L.M for the next month was written on submit from this report&apos;s U.M totals.</>
              )}
            </span>
          </div>
        )}

        {/* Always mounted (never conditionally unmounted) — a grid-rows collapse
            transition instead of a hard mount/unmount, so toggling between months
            with/without a target set doesn't jump the sections below it. */}
        {activeStep === 'tab1' && (
          <div
            className={`grid overflow-hidden transition-all duration-200 ease-in-out ${
              targetStatus === 'missing' && headerMonth && headerYear
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No target set for {headerMonth} {headerYear} — Target (Kgs) and Budget Outlay will stay blank until it is.
              {(currentUserRole === 'admin' || currentUserRole === 'secondary_admin') && (
                <>
                  {' '}
                  <a href={pocFullPath('set-target')} className="font-semibold underline">
                    Set it now
                  </a>
                  .
                </>
              )}
            </div>
          </div>
        )}

        {activeStep === STEP_REVIEW ? (
          <ReviewSummary values={getValues()} />
        ) : (
          <div className="space-y-4">
            {currentTab?.sections.map((section) => (
              <SchemaSectionRenderer
                key={section.id}
                section={section}
                register={register}
                errors={errors}
                watch={() => getValues()}
              />
            ))}
          </div>
        )}

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const idx = activeStep === STEP_REVIEW
                  ? TAB_IDS.length
                  : TAB_IDS.indexOf(activeStep);
                if (idx > 0) setActiveStep(TAB_IDS[idx - 1]);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => {
                const idx = TAB_IDS.indexOf(activeStep);
                if (idx >= 0 && idx < TAB_IDS.length - 1) setActiveStep(TAB_IDS[idx + 1]);
                if (activeStep === TAB_IDS[TAB_IDS.length - 1]) setActiveStep(STEP_REVIEW);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPrint(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" /> Print / Export
            </button>

            {activeStep !== STEP_REVIEW && !isLocked ? (
              <button
                type="button"
                onClick={handleSaveAndContinue}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light"
              >
                <Save className="h-4 w-4" /> Save &amp; Continue
              </button>
            ) : activeStep === STEP_REVIEW && !isLocked ? (
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light"
              >
                <CheckCircle2 className="h-4 w-4" /> Submit Report
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
