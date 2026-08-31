import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Lock, Pencil, Plus, Printer, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { authService } from '../../../services/auth.js';
import GovtTwistingOfficeSelect from '../../../components/GovtTwistingOfficeSelect.jsx';
import FiscalYearMonthPicker, {
  getFyStart,
  resolveMonthInFy,
  currentFyStart,
} from '../../../components/FiscalYearMonthPicker.jsx';
import { getFinancialYearKey } from '../set-target/fiscalYear.js';
import {
  MIS34_REPORT_TITLE,
  MIS34_FORM_CODE,
  ACHIEVEMENT_TABLE_FIELDS,
  PRODUCTION_FIELDS,
  PRODUCTION_TABLE_FIELDS,
  NSC_EXPENDITURE_TABLE_FIELDS,
  COST_SALE_TABLE_FIELDS,
  LIST_COLUMNS,
  ABSTRACT_COLUMNS,
} from './mis34Constants.js';
import { createEmptyUnit, createMis34DefaultValues, saveMis34Draft, MIS34_STORAGE_KEY } from './mis34DefaultValues.js';
import { computeUnitTotals, computeUnitTables, computeAbstract, computeProductionUm } from './mis34Calculations.js';
import { mis34FormSchema, mis34HeaderSchema, validateUnit } from './mis34ZodSchema.js';
import {
  getPeriodKey,
  isReportLocked,
  loadMis34ReportForHeader,
  saveMis34Report,
  submitMis34ReportWithRollover,
} from './mis34MonthRollover.js';
import { getCurrentReport, saveReportDraft, submitReport } from './reportsApi.js';
import GovernmentTwistingUnitPrintView from './GovernmentTwistingUnitPrintView.jsx';

function zodFieldErrors(error) {
  if (!error?.issues) return {};
  const map = {};
  error.issues.forEach((issue) => {
    map[issue.path[issue.path.length - 1]] = issue.message;
  });
  return map;
}

function NumberField({ label, value, onChange, error, readOnly, computed }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
        {computed && <span className="ml-1 text-emerald-primary">(auto)</span>}
      </span>
      {readOnly || computed ? (
        <input
          type="text"
          readOnly
          value={value === '' || value == null ? '—' : value}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
        />
      ) : (
        <input
          type="number"
          step="any"
          min="0"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-primary/30"
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

function FieldGroupCard({ title, fields, values, onChange, errors = {} }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-900">{title}</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <NumberField
            key={field.key}
            label={field.label}
            value={values?.[field.key]}
            onChange={(val) => onChange(field.key, val)}
            error={errors[field.key]}
          />
        ))}
      </div>
    </div>
  );
}

const cell = (val) => (val === '' || val == null ? 0 : val);

/**
 * Generic U.L.M / D.M / U.M table — same styling used across Government Reeling
 * Unit / Private Reeling. `rows` is a flat list of { key, label, ulm, dm, um,
 * dmEditable, onDmChange, dmError, indent, emphasis }. Rows with dmEditable:false
 * and no onDmChange render every column read-only (TOTAL / calculated rows).
 */
function DataTable({ title, rows }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-900">{title}</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-500">Field</th>
              <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">U.L.M</th>
              <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">D.M</th>
              <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">U.M</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={row.emphasis ? 'bg-amber-50 font-semibold' : undefined}>
                <td className={clsx('border border-slate-200 px-3 py-2 text-slate-700', row.indent && 'pl-6 font-normal')}>
                  {row.label}
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="text"
                    readOnly
                    value={row.ulm === undefined ? '—' : cell(row.ulm)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right text-slate-600"
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  {row.dmEditable ? (
                    <>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.dm ?? ''}
                        onChange={(e) => row.onDmChange(e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-right outline-none transition focus:ring-2 focus:ring-emerald-primary/30"
                      />
                      {row.dmError && <p className="text-[10px] text-red-600">{row.dmError}</p>}
                    </>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={cell(row.dm)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right text-slate-600"
                    />
                  )}
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="text"
                    readOnly
                    value={cell(row.um)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right text-slate-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildRows(fields, data, computedData, groupPath, onFieldChange, errors) {
  return fields.map((f) => ({
    key: f.key,
    label: f.label,
    ulm: data?.[f.ulmKey],
    dm: data?.[f.dmKey],
    um: computedData?.[f.umKey],
    dmEditable: true,
    onDmChange: (val) => onFieldChange(groupPath, f.dmKey, val),
    dmError: errors[f.dmKey],
  }));
}

export default function GovernmentTwistingUnitForm() {
  const initialDraft = useMemo(() => loadMis34ReportForHeader({}), []);
  const [header, setHeader] = useState(initialDraft.header);
  const [units, setUnits] = useState(initialDraft.units);
  const [meta, setMeta] = useState(initialDraft.meta);

  const [entryUnit, setEntryUnit] = useState(createEmptyUnit());
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [entryErrors, setEntryErrors] = useState({});
  const [headerErrors, setHeaderErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [browseFyStart, setBrowseFyStart] = useState(currentFyStart);

  const isLocked = isReportLocked(meta);

  const activePeriodRef = useRef(getPeriodKey(header));
  const skipPeriodSwitchRef = useRef(true);

  useEffect(() => {
    authService.getCurrentUser()
      .then((result) => setCurrentUserRole(result?.user?.role || null))
      .catch(() => setCurrentUserRole(null));
  }, []);

  // NOTE: no "lock to own office" effect here — Government Twisting Unit
  // offices now live in their own table (govt_twisting_offices) with their
  // own id space, disjoint from poc_users.office_id (which still points at
  // the shared poc_offices used by Private Reeling). Same precedent as
  // Government Reeling Unit: a 'user' picks their office freely each time.

  // Switching Region/Office/Month/Year loads that period's report — server-synced
  // first, then U.L.M-carried-forward local draft — same pattern as the other 2 forms.
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
      saveMis34Report(outgoingKey, { header, units, meta });
    }
    activePeriodRef.current = nextKey;

    let cancelled = false;
    (async () => {
      const fiscalYear = getFinancialYearKey(header.month, header.year);
      try {
        const remote = fiscalYear
          ? await getCurrentReport({ officeId: header.marketOfficeId, fiscalYear, month: header.month })
          : null;
        if (remote?.data && Object.keys(remote.data).length > 0) {
          saveMis34Report(nextKey, remote.data);
        }
      } catch (error) {
        console.error('Failed to sync current-period twisting report from server:', error);
      }
      if (cancelled) return;
      const loaded = loadMis34ReportForHeader(header);
      setHeader(loaded.header);
      setUnits(loaded.units);
      setMeta(loaded.meta);
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

  const handleHeaderField = (key, value) => setHeader((prev) => ({ ...prev, [key]: value }));

  const handleEntryTopField = (key, value) => setEntryUnit((prev) => ({ ...prev, [key]: value }));
  const handleProductionField = (key, value) =>
    setEntryUnit((prev) => ({ ...prev, productionDetails: { ...prev.productionDetails, [key]: value } }));
  const handleTableFieldChange = (groupPath, dmKey, value) =>
    setEntryUnit((prev) => ({ ...prev, [groupPath]: { ...prev[groupPath], [dmKey]: value } }));

  const computed = computeUnitTotals(entryUnit);
  const tables = computeUnitTables(entryUnit);
  const computedProduction = computeProductionUm(entryUnit.productionDetails);

  const achievementGroups = useMemo(() => {
    const byGroup = new Map();
    ACHIEVEMENT_TABLE_FIELDS.forEach((f) => {
      if (!byGroup.has(f.group)) byGroup.set(f.group, []);
      byGroup.get(f.group).push(f);
    });
    return Array.from(byGroup.entries());
  }, []);

  const nscRows = [
    ...buildRows(NSC_EXPENDITURE_TABLE_FIELDS, entryUnit.nscExpenditure, tables.nscExpenditure, 'nscExpenditure', handleTableFieldChange, entryErrors),
    {
      key: 'nscTotal',
      label: 'TOTAL',
      ulm: computed.nscTotal.ulm,
      dm: computed.nscTotal.dm,
      um: computed.nscTotal.um,
      dmEditable: false,
      emphasis: true,
    },
  ];

  const costSaleRows = [
    ...buildRows(COST_SALE_TABLE_FIELDS, entryUnit.costSaleValue, tables.costSaleValue, 'costSaleValue', handleTableFieldChange, entryErrors),
    {
      key: 'netExpenditure',
      label: 'Net Expenditure (Rs)',
      ulm: undefined,
      dm: computed.netExpenditure.dm,
      um: computed.netExpenditure.um,
      dmEditable: false,
      emphasis: true,
    },
    {
      key: 'costOfProductionPerKg',
      label: 'Cost of Production per Kg (Rs)',
      ulm: undefined,
      dm: computed.costOfProductionPerKg.dm === '' ? '—' : computed.costOfProductionPerKg.dm,
      um: computed.costOfProductionPerKg.um === '' ? '—' : computed.costOfProductionPerKg.um,
      dmEditable: false,
      emphasis: true,
    },
  ];

  const persistLocalDraft = (nextUnits, nextMeta, nextHeader = header) => {
    saveMis34Draft({ header: nextHeader, units: nextUnits, meta: nextMeta });
    const periodKey = getPeriodKey(nextHeader);
    if (periodKey && !isReportLocked(nextMeta)) {
      saveMis34Report(periodKey, { header: nextHeader, units: nextUnits, meta: nextMeta });
    }
  };

  const handleSaveUnit = () => {
    const result = validateUnit(entryUnit);
    if (!result.success) {
      setEntryErrors(zodFieldErrors(result.error));
      setMessage('Fix validation errors before saving this unit.');
      return;
    }
    setEntryErrors({});

    const nextUnits = editingUnitId
      ? units.map((u) => (u.id === editingUnitId ? entryUnit : u))
      : [...units, entryUnit];

    setUnits(nextUnits);
    persistLocalDraft(nextUnits, meta);
    setEntryUnit(createEmptyUnit());
    setEditingUnitId(null);
    setMessage(editingUnitId ? 'Unit updated.' : 'Unit added to the list.');
  };

  const handleEditUnit = (id) => {
    const unit = units.find((u) => u.id === id);
    if (!unit) return;
    setEntryUnit(unit);
    setEditingUnitId(id);
    setMessage(`Editing ${unit.unitName || 'unit'} — save or cancel below.`);
  };

  const handleCancelEdit = () => {
    setEntryUnit(createEmptyUnit());
    setEditingUnitId(null);
    setEntryErrors({});
  };

  const handleDeleteUnit = (id) => {
    const nextUnits = units.filter((u) => u.id !== id);
    setUnits(nextUnits);
    persistLocalDraft(nextUnits, meta);
    if (editingUnitId === id) handleCancelEdit();
  };

  const validateHeader = () => {
    const result = mis34HeaderSchema.safeParse(header);
    if (!result.success) {
      setHeaderErrors(zodFieldErrors(result.error));
      return false;
    }
    setHeaderErrors({});
    return true;
  };

  const persistToServer = async (targetHeader, targetUnits, nextMeta) => {
    const fiscalYear = getFinancialYearKey(targetHeader.month, targetHeader.year);
    const saved = await saveReportDraft({
      officeId: targetHeader.marketOfficeId,
      fiscalYear,
      month: targetHeader.month,
      data: { header: targetHeader, units: targetUnits, meta: nextMeta },
    });
    return saved;
  };

  const handleSaveReport = async () => {
    if (isLocked) {
      setMessage('This report is submitted and locked.');
      return;
    }
    if (!validateHeader()) {
      setMessage('Complete the shared header (Region, Market Office, Month, Year) before saving.');
      return;
    }
    if (units.length === 0) {
      setMessage('Add at least one twisting unit before saving.');
      return;
    }

    setSaving(true);
    try {
      await persistToServer(header, units, meta);
      persistLocalDraft(units, meta);
      setMessage('Report saved as draft.');
    } catch (error) {
      console.error('Failed to save twisting report:', error);
      setMessage('Saved locally, but syncing to the server failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (isLocked) {
      setMessage('This report is submitted and locked.');
      return;
    }
    if (!validateHeader()) {
      setMessage('Complete the shared header before submitting.');
      return;
    }

    const formResult = mis34FormSchema.safeParse({ header, units });
    if (!formResult.success) {
      setMessage('Resolve all validation errors before submitting — check each unit and add at least one.');
      return;
    }

    let submittedBy = 'unknown';
    try {
      const user = await authService.getCurrentUser();
      submittedBy = user?.user?.email || user?.user?.username || 'unknown';
    } catch {
      /* session unavailable in POC */
    }

    const result = submitMis34ReportWithRollover({ header, units, meta }, submittedBy);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setSaving(true);
    try {
      const saved = await persistToServer(result.submittedReport.header, result.submittedReport.units, result.submittedReport.meta);
      await submitReport(saved.id);

      if (result.nextDraft) {
        await persistToServer(result.nextDraft.header, result.nextDraft.units, result.nextDraft.meta);
      }

      // Move straight to next month's (carried U.L.M, blank D.M) draft rather
      // than leaving this month's just-submitted values on screen.
      const freshDraft = result.nextDraft || {
        ...createMis34DefaultValues(),
        header: { ...createMis34DefaultValues().header, adCode: result.submittedReport.header.adCode, disCode: result.submittedReport.header.disCode, regCode: result.submittedReport.header.regCode, region: result.submittedReport.header.region, marketOfficeId: result.submittedReport.header.marketOfficeId },
      };
      skipPeriodSwitchRef.current = true;
      setHeader(freshDraft.header);
      setUnits(freshDraft.units);
      setMeta(freshDraft.meta);
      setEntryUnit(createEmptyUnit());
      setEditingUnitId(null);
      localStorage.setItem(MIS34_STORAGE_KEY, JSON.stringify(freshDraft));
      activePeriodRef.current = getPeriodKey(freshDraft.header);

      const nextLabel = result.nextHeader ? `${result.nextHeader.month} ${result.nextHeader.year}` : null;
      setMessage(
        nextLabel
          ? `Report submitted and locked. Now showing the ${nextLabel} draft, with U.L.M carried forward from this month's U.M values.`
          : 'Report submitted and locked.'
      );
    } catch (error) {
      console.error('Failed to submit twisting report:', error);
      setMessage('Submission failed to sync to the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (showPrint) {
    return (
      <GovernmentTwistingUnitPrintView
        header={header}
        units={units}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  const abstractRows = computeAbstract(units);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-secondary">{MIS34_REPORT_TITLE}</h1>
          <p className="text-sm text-slate-500">{MIS34_FORM_CODE} — Register-based data entry</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPrint(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" /> Print / Export
        </button>
      </div>

      <div className="sticky top-0 z-10 rounded-xl border border-emerald-primary/20 bg-white/95 p-4 shadow-md backdrop-blur">
        <h2 className="mb-3 text-base font-semibold text-emerald-secondary">Unit &amp; Period Details</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">AD Code</span>
            <input
              type="text"
              value={header.adCode || ''}
              onChange={(e) => handleHeaderField('adCode', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">DIS Code</span>
            <input
              type="text"
              value={header.disCode || ''}
              onChange={(e) => handleHeaderField('disCode', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">REG Code</span>
            <input
              type="text"
              value={header.regCode || ''}
              onChange={(e) => handleHeaderField('regCode', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            />
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
          <GovtTwistingOfficeSelect
            region={header.region || null}
            officeId={header.marketOfficeId || null}
            onChange={({ region, officeId }) =>
              setHeader((prev) => ({ ...prev, region: region ?? '', marketOfficeId: officeId ?? '' }))
            }
            disabled={isLocked}
            required
          />
          {(headerErrors.region || headerErrors.marketOfficeId) && (
            <p className="mt-1 text-xs text-red-600">{headerErrors.region || headerErrors.marketOfficeId}</p>
          )}
        </div>
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

      {!isLocked && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-emerald-secondary">
              {editingUnitId ? 'Edit Twisting Unit' : 'Add a Twisting Unit'}
            </h3>
            {editingUnitId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" /> Cancel edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Unit Name</span>
              <input
                type="text"
                value={entryUnit.unitName}
                onChange={(e) => handleEntryTopField('unitName', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {entryErrors.unitName && <p className="mt-1 text-xs text-red-600">{entryErrors.unitName}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Unit Code</span>
              <input
                type="text"
                value={entryUnit.unitCode}
                onChange={(e) => handleEntryTopField('unitCode', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {achievementGroups.map(([groupName, groupFields]) => (
              <DataTable
                key={groupName}
                title={`Achievement to Target — ${groupName}`}
                rows={buildRows(groupFields, entryUnit.achievementToTarget, tables.achievementToTarget, 'achievementToTarget', handleTableFieldChange, entryErrors)}
              />
            ))}
          </div>

          <div className="mt-4">
            <FieldGroupCard
              title="Production Capacity"
              fields={PRODUCTION_FIELDS}
              values={entryUnit.productionDetails}
              onChange={handleProductionField}
              errors={entryErrors}
            />
          </div>

          <div className="mt-4">
            <DataTable
              title="Production Details"
              rows={buildRows(PRODUCTION_TABLE_FIELDS, entryUnit.productionDetails, computedProduction, 'productionDetails', handleTableFieldChange, entryErrors)}
            />
          </div>

          <div className="mt-4">
            <DataTable title="NSC Expenditure" rows={nscRows} />
          </div>

          <div className="mt-4">
            <DataTable title="Cost & Sale Value" rows={costSaleRows} />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveUnit}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light"
            >
              <Plus className="h-4 w-4" /> {editingUnitId ? 'Save changes' : 'Save twisting unit'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-emerald-secondary">Saved Twisting Units ({units.length})</h3>
        {units.length === 0 ? (
          <p className="text-sm text-slate-500">No units added yet — use the form above to add one.</p>
        ) : (
          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-emerald-muted">
                <tr>
                  {LIST_COLUMNS.map((col) => (
                    <th key={col.id} className="border border-slate-200 px-3 py-2 text-left font-semibold text-emerald-secondary">
                      {col.label}
                    </th>
                  ))}
                  {!isLocked && <th className="border border-slate-200 px-3 py-2" />}
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const totals = computeUnitTotals(unit);
                  const production = computeProductionUm(unit.productionDetails || {});
                  return (
                    <tr key={unit.id} className="hover:bg-slate-50/80">
                      <td className="border border-slate-100 px-3 py-2">{unit.unitName || '(unnamed unit)'}</td>
                      <td className="border border-slate-100 px-3 py-2 text-right">{production.productionOfTwistedRawSilkDm || '—'}</td>
                      <td className="border border-slate-100 px-3 py-2 text-right">{totals.nscTotal.dm || '—'}</td>
                      <td className="border border-slate-100 px-3 py-2 text-right">{totals.costOfProductionPerKg.dm || '—'}</td>
                      {!isLocked && (
                        <td className="border border-slate-100 px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditUnit(unit.id)}
                              className="rounded p-1 text-slate-500 hover:bg-slate-100"
                              title="Edit unit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="rounded p-1 text-red-500 hover:bg-red-50"
                              title="Delete unit"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-emerald-secondary">Abstract</h3>
        <p className="mb-3 text-xs text-slate-500">Auto-computed from the units above — never entered directly.</p>
        <div className="overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-emerald-muted">
              <tr>
                {ABSTRACT_COLUMNS.map((col) => (
                  <th key={col.id} className="border border-slate-200 px-3 py-2 text-left font-semibold text-emerald-secondary">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {abstractRows.map((row) => (
                <tr key={row.key} className={row.isGrandTotal ? 'bg-amber-50 font-semibold' : 'hover:bg-slate-50'}>
                  {ABSTRACT_COLUMNS.map((col) => (
                    <td key={col.id} className={clsx('border border-slate-100 px-3 py-2', col.id !== 'unitName' && 'text-right')}>
                      {row[col.id] === '' || row[col.id] == null ? '—' : row[col.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isLocked && (
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={handleSaveReport}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSubmitReport}
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
