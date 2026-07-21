import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { CheckCircle2, ChevronLeft, ChevronRight, Printer, Save } from 'lucide-react';
import {
  MIS34_SHARED_HEADER_SECTION,
  MIS34_TAB_SECTIONS,
  MIS34_REPORT_TITLE,
  MIS34_FORM_CODE,
} from './mis34FormSchema.js';
import { MIS34_TAB_SCHEMAS, mis34HeaderSchema } from './mis34ZodSchema.js';
import { loadMis34Draft, saveMis34Draft } from './mis34DefaultValues.js';
import { applyMis34Calculations, applyMis34ComputedToForm } from './mis34Calculations.js';
import { SchemaSectionRenderer, SharedHeaderRenderer } from '../government-reeling-unit/SchemaFormRenderer.jsx';
import GovernmentTwistingUnitPrintView from './GovernmentTwistingUnitPrintView.jsx';

const TAB_IDS = ['tab1', 'tab2', 'tab3'];
const STEP_REVIEW = 'review';

function ReviewSummary({ values }) {
  const header = values.header || {};
  const profitLoss = values.tab3?.profitLoss || {};

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-primary/20 bg-emerald-muted p-4">
        <h3 className="text-lg font-semibold text-emerald-secondary">Report Summary — MIS-34</h3>
        <p className="mt-1 text-sm text-slate-600">
          {header.unitName || '—'} ({header.unitCode || '—'}) — {header.month || '—'} {header.year || '—'}
        </p>
        <p className="mt-1 text-xs text-slate-500">Unit type: twisting (shared reports/report_items schema)</p>
      </div>

      {MIS34_TAB_SECTIONS.map((tab) => (
        <div key={tab.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 font-semibold text-emerald-secondary">{tab.label}</h4>
          <p className="text-sm text-slate-600">
            {tab.sections.length} section(s). Calculated totals, machine stock closing, and profit/loss applied.
          </p>
        </div>
      ))}

      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 max-w-md">
        <p className="text-xs uppercase text-slate-500">Profit / Loss Result</p>
        <p className="text-xl font-bold text-emerald-700">
          {profitLoss.isProfit ? 'Profit' : 'Loss'}: Rs {Math.abs(Number(profitLoss.amount) || 0)}
        </p>
      </div>
    </div>
  );
}

export default function GovernmentTwistingUnitForm() {
  const defaultValues = useMemo(() => loadMis34Draft(), []);
  const [activeStep, setActiveStep] = useState('tab1');
  const [savedTabs, setSavedTabs] = useState(defaultValues.meta?.savedTabs || []);
  const [message, setMessage] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({ defaultValues, mode: 'onBlur' });

  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (!watchedValues || Object.keys(watchedValues).length === 0) return;
    applyMis34ComputedToForm(watchedValues, setValue);
  }, [watchedValues, setValue]);

  const currentTab = MIS34_TAB_SECTIONS.find((tab) => tab.id === activeStep);

  const persistDraft = (nextSavedTabs, status = 'draft') => {
    saveMis34Draft({
      ...getValues(),
      meta: { savedTabs: nextSavedTabs, status, unitType: 'twisting' },
    });
  };

  const validateStep = async (stepId) => {
    if (stepId === STEP_REVIEW) return true;

    const headerOk = await trigger('header');
    if (!headerOk) {
      setMessage('Please complete the shared header before continuing.');
      return false;
    }

    const headerResult = mis34HeaderSchema.safeParse(getValues().header);
    if (!headerResult.success) {
      setMessage('Please complete the shared header before continuing.');
      return false;
    }

    const schema = MIS34_TAB_SCHEMAS[stepId];
    if (!schema) return true;

    const tabResult = schema.safeParse(getValues()[stepId]);
    if (!tabResult.success) {
      await trigger(stepId);
      setMessage('Please fix validation errors on this tab before saving.');
      return false;
    }

    setMessage('');
    return true;
  };

  const handleSaveAndContinue = async () => {
    const ok = await validateStep(activeStep);
    if (!ok) return;

    const nextSaved = savedTabs.includes(activeStep) ? savedTabs : [...savedTabs, activeStep];
    setSavedTabs(nextSaved);
    persistDraft(nextSaved);
    setMessage('Tab saved successfully.');

    const currentIndex = TAB_IDS.indexOf(activeStep);
    if (currentIndex < TAB_IDS.length - 1) {
      setActiveStep(TAB_IDS[currentIndex + 1]);
    } else {
      setActiveStep(STEP_REVIEW);
    }
  };

  const handleFinalSubmit = handleSubmit(async () => {
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

    persistDraft(savedTabs, 'submitted');
    setSubmitted(true);
    setMessage('MIS-34 twisting unit report submitted successfully.');
  });

  if (showPrint) {
    return (
      <GovernmentTwistingUnitPrintView
        values={applyMis34Calculations(getValues())}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <form onSubmit={handleFinalSubmit} className="space-y-4">
        <SharedHeaderRenderer
          section={MIS34_SHARED_HEADER_SECTION}
          register={register}
          errors={errors}
          reportTitle={MIS34_REPORT_TITLE}
          formCode={MIS34_FORM_CODE}
        />

        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {MIS34_TAB_SECTIONS.map((tab) => (
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
                const idx = activeStep === STEP_REVIEW ? TAB_IDS.length : TAB_IDS.indexOf(activeStep);
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

            {activeStep !== STEP_REVIEW ? (
              <button
                type="button"
                onClick={handleSaveAndContinue}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light"
              >
                <Save className="h-4 w-4" /> Save &amp; Continue
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light"
              >
                <CheckCircle2 className="h-4 w-4" /> Submit Report
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
