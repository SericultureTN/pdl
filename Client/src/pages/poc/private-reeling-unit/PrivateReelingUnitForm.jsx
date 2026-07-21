import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Printer } from 'lucide-react';
import clsx from 'clsx';
import {
  CATEGORY_TABS,
  EDITABLE_CATEGORY_IDS,
  MIS40_FORM_CODE,
  MIS40_REPORT_TITLE,
} from './mis40Constants.js';
import { mis40FormSchema, mis40HeaderSchema, validateCategoryRows } from './mis40ZodSchema.js';
import { loadMis40Draft, saveMis40Draft } from './mis40DefaultValues.js';
import RegisterTabPanel from './RegisterTabPanel.jsx';
import AbstractTabPanel from './AbstractTabPanel.jsx';
import PrivateReelingUnitPrintView from './PrivateReelingUnitPrintView.jsx';

function zodFieldErrors(error) {
  if (!error?.issues) return {};
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path[issue.path.length - 1], issue.message])
  );
}

function validateCategoryRowErrors(rows) {
  const map = {};
  rows.forEach((row, index) => {
    const result = validateCategoryRows([row]);
    if (!result.success) {
      map[index] = Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[issue.path.length - 1], issue.message])
      );
    }
  });
  return map;
}

export default function PrivateReelingUnitForm() {
  const defaultValues = useMemo(() => loadMis40Draft(), []);
  const [activeTab, setActiveTab] = useState('arm');
  const [savedTabs, setSavedTabs] = useState(defaultValues.meta?.savedTabs || []);
  const [message, setMessage] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [headerErrors, setHeaderErrors] = useState({});
  const [rowErrorsByCategory, setRowErrorsByCategory] = useState({});

  const { watch, setValue, getValues } = useForm({ defaultValues });
  const header = watch('header') ?? defaultValues.header;
  const categories = watch('categories') ?? defaultValues.categories;

  const handleHeaderChange = (key, value) => {
    setValue(`header.${key}`, value, { shouldDirty: true });
  };

  const handleRowsChange = (categoryId, rows) => {
    setValue(`categories.${categoryId}.rows`, rows, { shouldDirty: true });
  };

  const validateHeader = () => {
    const result = mis40HeaderSchema.safeParse(getValues().header);
    if (!result.success) {
      setHeaderErrors(zodFieldErrors(result.error));
      return false;
    }
    setHeaderErrors({});
    return true;
  };

  const handleSaveTab = (categoryId) => {
    if (!validateHeader()) {
      setMessage('Complete the shared header (Assistant Director, Month, Year) before saving.');
      return;
    }

    const rows = getValues().categories[categoryId].rows;
    const categoryResult = validateCategoryRows(rows);
    if (!categoryResult.success) {
      setRowErrorsByCategory((prev) => ({
        ...prev,
        [categoryId]: validateCategoryRowErrors(rows),
      }));
      setMessage(`Fix validation errors in ${categoryId.toUpperCase()} before saving.`);
      return;
    }

    setRowErrorsByCategory((prev) => ({ ...prev, [categoryId]: {} }));
    const nextSaved = savedTabs.includes(categoryId)
      ? savedTabs
      : [...savedTabs, categoryId];
    setSavedTabs(nextSaved);

    saveMis40Draft({
      ...getValues(),
      meta: { status: 'draft', savedTabs: nextSaved },
    });
    setMessage(`${categoryId.toUpperCase()} tab saved.`);

    const currentIdx = EDITABLE_CATEGORY_IDS.indexOf(categoryId);
    if (currentIdx < EDITABLE_CATEGORY_IDS.length - 1) {
      setActiveTab(EDITABLE_CATEGORY_IDS[currentIdx + 1]);
    } else {
      setActiveTab('abstract');
    }
  };

  const handleSubmit = () => {
    if (!validateHeader()) {
      setMessage('Complete the header before submitting.');
      return;
    }

    const missing = EDITABLE_CATEGORY_IDS.filter((id) => !savedTabs.includes(id));
    if (missing.length) {
      setMessage(`Save all category tabs first: ${missing.join(', ').toUpperCase()}`);
      return;
    }

    const formResult = mis40FormSchema.safeParse(getValues());
    if (!formResult.success) {
      setMessage('Resolve all validation errors before submitting.');
      return;
    }

    saveMis40Draft({
      ...getValues(),
      signOff: {
        extensionOfficer: header.assistantDirectorName,
        signedAt: new Date().toISOString(),
      },
      meta: { status: 'submitted', savedTabs },
    });
    setMessage('MIS-40 report submitted successfully.');
  };

  if (showPrint) {
    return (
      <PrivateReelingUnitPrintView
        values={getValues()}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  const activeCategory = CATEGORY_TABS.find((t) => t.id === activeTab);

  if (!header || !categories) {
    return (
      <div className="p-6 text-center text-slate-600">
        Loading form data…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-secondary">{MIS40_REPORT_TITLE}</h1>
          <p className="text-sm text-slate-500">PDL {MIS40_FORM_CODE} — Register-based data entry</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPrint(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" /> Print / Export
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-medium transition',
              activeTab === tab.id
                ? 'bg-emerald-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {tab.label}
            {savedTabs.includes(tab.id) && (
              <CheckCircle2 className="ml-1 inline-block h-4 w-4 text-emerald-300" />
            )}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {activeTab === 'abstract' ? (
        <AbstractTabPanel categories={categories} header={header} />
      ) : activeCategory ? (
        <RegisterTabPanel
          category={activeCategory}
          header={header}
          rows={Array.isArray(categories[activeTab]?.rows) ? categories[activeTab].rows : []}
          onHeaderChange={handleHeaderChange}
          onRowsChange={(rows) => handleRowsChange(activeTab, rows)}
          onSave={() => handleSaveTab(activeTab)}
          errors={headerErrors}
          rowErrors={rowErrorsByCategory[activeTab] || {}}
        />
      ) : null}

      {activeTab === 'abstract' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-light"
          >
            <CheckCircle2 className="h-4 w-4" /> Submit Report
          </button>
        </div>
      )}
    </div>
  );
}
