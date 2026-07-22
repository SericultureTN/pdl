import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Printer, Save } from 'lucide-react';
import { authService } from '../../../services/auth.js';
import { MIS37_SHARED_HEADER_SECTION, MIS37_TAB_SECTIONS } from './mis37FormSchema.js';
import { MIS37_TAB_SCHEMAS } from './mis37ZodSchema.js';
import { loadMis37Draft, MIS37_STORAGE_KEY } from './mis37DefaultValues.js';
import { applyMis37Calculations } from './mis37Calculations.js';
import {
  getPeriodKey,
  isReportLocked,
  loadMis37ReportForHeader,
  saveMis37Report,
  submitMis37ReportWithRollover,
} from './mis37MonthRollover.js';
import { FINANCIAL_BUDGET_ROWS, FINANCIAL_CATEGORY_TYPES, RECEIPT_ITEMS, SILK_SALES_ROWS, COCOON_STOCK_ROWS, COCOON_STOCK_METRICS, NSC_EXPENDITURE_ROWS, COST_DETAIL_FIELDS, COST_OF_PRODUCTION_ROWS } from './mis37Constants.js';
import { SchemaSectionRenderer, SharedHeaderRenderer } from './SchemaFormRenderer.jsx';
import GovernmentReelingUnitPrintView from './GovernmentReelingUnitPrintView.jsx';

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

  // Tab 1: Achievement financial
  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    FINANCIAL_CATEGORY_TYPES.forEach(({ key: typeKey }) => {
      const cat = computed.tab1.achievementFinancial[rowKey][typeKey];
      setValue(`tab1.achievementFinancial.${rowKey}.${typeKey}.budgetUm`, cat.budgetUm, { shouldDirty: false, shouldValidate: false });
      setValue(`tab1.achievementFinancial.${rowKey}.${typeKey}.actualAnnual`, cat.actualAnnual, { shouldDirty: false, shouldValidate: false });
    });
  });

  setValue('tab1.productionDetails.renditaPercent', computed.tab1.productionDetails.renditaPercent, { shouldDirty: false, shouldValidate: false });
  Object.entries(computed.tab1.stockParticulars).forEach(([itemKey, row]) => {
    setValue(`tab1.stockParticulars.${itemKey}.closingBalance`, row.closingBalance, { shouldDirty: false, shouldValidate: false });
  });

  RECEIPT_ITEMS.forEach(({ key }) => {
    setValue(`tab1.receipts.${key}.valueRs.um`, computed.tab1.receipts[key].valueRs.um, { shouldDirty: false, shouldValidate: false });
    setValue(`tab1.receipts.${key}.cash.um`, computed.tab1.receipts[key].cash.um, { shouldDirty: false, shouldValidate: false });
  });

  SILK_SALES_ROWS.forEach(({ key }) => {
    setValue(`tab1.silkSalesRealisation.${key}.qty.um`, computed.tab1.silkSalesRealisation[key].qty.um, { shouldDirty: false, shouldValidate: false });
    setValue(`tab1.silkSalesRealisation.${key}.value.um`, computed.tab1.silkSalesRealisation[key].value.um, { shouldDirty: false, shouldValidate: false });
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

  // Tab 2: Cost details — U.M = U.L.M + D.M (D.M is manual entry)
  COST_DETAIL_FIELDS.forEach(({ key }) => {
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

  // Tab 3
  Object.entries(computed.tab3.stockDetailsKgs).forEach(([itemKey, row]) => {
    setValue(`tab3.stockDetailsKgs.${itemKey}.total`, row.total, { shouldDirty: false, shouldValidate: false });
    setValue(`tab3.stockDetailsKgs.${itemKey}.closingBalance`, row.closingBalance, { shouldDirty: false, shouldValidate: false });
  });
  setValue('tab3.estimatedSaleValue.total.dm', computed.tab3.estimatedSaleValue.total.dm, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.estimatedSaleValue.total.um', computed.tab3.estimatedSaleValue.total.um, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.actualReceiptDetails.silkSold.total.qty', computed.tab3.actualReceiptDetails.silkSold.total.qty, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.actualReceiptDetails.silkSold.total.value', computed.tab3.actualReceiptDetails.silkSold.total.value, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.actualReceiptDetails.byeProductsSold.total.qty', computed.tab3.actualReceiptDetails.byeProductsSold.total.qty, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.actualReceiptDetails.byeProductsSold.total.value', computed.tab3.actualReceiptDetails.byeProductsSold.total.value, { shouldDirty: false, shouldValidate: false });
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
  const reportMeta = useWatch({ control, name: 'meta' }) || {};
  const isLocked = isReportLocked(reportMeta);

  const activePeriodRef = useRef(getPeriodKey(defaultValues.header));
  const skipPeriodSwitchRef = useRef(true);

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

    const loaded = loadMis37ReportForHeader({
      unitName: headerUnitName,
      month: headerMonth,
      year: headerYear,
    });
    reset(loaded);
    setSavedTabs(loaded.meta?.savedTabs || []);
    setSubmitted(loaded.meta?.status === 'submitted');
    activePeriodRef.current = nextKey;
    setMessage(
      loaded.meta?.ulmCarriedFrom
        ? `U.L.M values carried from ${loaded.meta.ulmCarriedFrom.replace(/\|/g, ' / ')}.`
        : ''
    );
  }, [headerUnitName, headerMonth, headerYear, getValues, reset]);

  const currentTab = MIS37_TAB_SECTIONS.find((tab) => tab.id === activeStep);

  const persistDraft = (nextSavedTabs, status = 'draft') => {
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
  };

  const validateStep = async (stepId) => {
    if (stepId === STEP_REVIEW) return true;

    const headerOk = await trigger('header');
    if (!headerOk) {
      setMessage('Please complete the shared header before continuing.');
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
      setMessage('Please fix validation errors on this tab before saving.');
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
    persistDraft(nextSaved);
    setMessage(`Tab saved successfully.`);

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
    const tab1Ok = await trigger('tab1');
    const tab2Ok = await trigger('tab2');
    const tab3Ok = await trigger('tab3');
    if (!headerOk || !tab1Ok || !tab2Ok || !tab3Ok) {
      setMessage('Please resolve all validation errors before submitting.');
      return;
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
      return;
    }

    reset(result.submittedReport);
    setSubmitted(true);
    setSavedTabs(result.submittedReport.meta?.savedTabs || savedTabs);
    localStorage.setItem(MIS37_STORAGE_KEY, JSON.stringify(result.submittedReport));
    activePeriodRef.current = getPeriodKey(result.submittedReport.header);

    const nextLabel = result.nextHeader
      ? `${result.nextHeader.month} ${result.nextHeader.year}`
      : null;
    setMessage(
      nextLabel
        ? `Report submitted and locked. ${nextLabel} draft created with U.L.M carried forward from this month's U.M values.`
        : 'Report submitted and locked.'
    );
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
      <form onSubmit={handleFinalSubmit} className="space-y-4">
        <SharedHeaderRenderer
          section={MIS37_SHARED_HEADER_SECTION}
          register={register}
          errors={errors}
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
          <div className={`rounded-lg px-4 py-3 text-sm ${submitted ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            {message}
          </div>
        )}

        {isLocked && (
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
