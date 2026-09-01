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
  ACHIEVEMENT_METRIC_LABEL,
  PRODUCTION_FIELDS,
  UNIT_TABLE_GROUPS,
  LIST_COLUMNS,
  ABSTRACT_COLUMNS,
} from './mis34Constants.js';
import { createEmptyUnit, createMis34DefaultValues } from './mis34DefaultValues.js';
import { validateUnit } from './mis34ZodSchema.js';
import { getCurrentReport, saveReportDraft } from './reportsApi.js';
import {
  getFullTwistingReport,
  saveTwistingAchievement,
  createTwistingUnit,
  updateTwistingUnit,
  deleteTwistingUnit,
  submitTwistingReport,
} from './twistingReportApi.js';
import GovernmentTwistingUnitPrintView from './GovernmentTwistingUnitPrintView.jsx';

const CALENDAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function nextCalendarPeriod(month, year) {
  const idx = CALENDAR_MONTHS.indexOf(month);
  if (idx === -1) return null;
  return idx === 11 ? { month: 'January', year: Number(year) + 1 } : { month: CALENDAR_MONTHS[idx + 1], year: Number(year) };
}

function zodFieldErrors(error) {
  if (!error?.issues) return {};
  const map = {};
  error.issues.forEach((issue) => {
    map[issue.path[issue.path.length - 1]] = issue.message;
  });
  return map;
}

/** Server unit (flat, {fieldKey: {ulm,dm,um}}) -> the nested shape the entry-form/mis34* helpers already use. */
function serverUnitToEntry(serverUnit) {
  const entry = createEmptyUnit();
  entry.id = String(serverUnit.id);
  entry.unitName = serverUnit.unitName || '';
  entry.unitCode = serverUnit.unitCode || '';
  entry.productionDetails.spindlesInstalled = serverUnit.spindlesInstalled ?? '';
  entry.productionDetails.installedProductionCapacity = serverUnit.installedProductionCapacity ?? '';
  entry.productionDetails.spindlesInUse = serverUnit.spindlesInUse ?? '';
  UNIT_TABLE_GROUPS.forEach(({ path, fields }) => {
    fields.forEach((f) => {
      const triple = serverUnit[f.key] || {};
      entry[path][f.ulmKey] = triple.ulm ?? 0;
      entry[path][f.dmKey] = triple.dm ?? '';
      entry[path][f.umKey] = triple.um ?? '';
    });
  });
  return entry;
}

/** Entry-form draft -> the flat body the twisting-units API expects (D.M + plain fields only — U.L.M/U.M are server-managed). */
function entryUnitToServerPayload(entryUnit) {
  const payload = {
    unitName: entryUnit.unitName,
    unitCode: entryUnit.unitCode,
    spindlesInstalled: entryUnit.productionDetails.spindlesInstalled,
    installedProductionCapacity: entryUnit.productionDetails.installedProductionCapacity,
    spindlesInUse: entryUnit.productionDetails.spindlesInUse,
  };
  UNIT_TABLE_GROUPS.forEach(({ path, fields }) => {
    fields.forEach((f) => {
      payload[`${f.key}Dm`] = entryUnit[path][f.dmKey];
    });
  });
  return payload;
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
 * dmEditable, onDmChange, dmError, emphasis }.
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
                <td className="border border-slate-200 px-3 py-2 text-slate-700">{row.label}</td>
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

const emptyAchievement = { target: { ulm: 0, dm: 0, um: 0 }, achieved: { ulm: 0, dm: 0, um: 0 } };

export default function GovernmentTwistingUnitForm() {
  const [header, setHeader] = useState(createMis34DefaultValues().header);
  const [reportId, setReportId] = useState(null);
  const [reportMeta, setReportMeta] = useState({ status: 'draft', submittedAt: null });
  const [achievement, setAchievement] = useState(emptyAchievement);
  const [units, setUnits] = useState([]);
  const [abstractData, setAbstractData] = useState({ rows: [], grandTotal: null });

  const [entryUnit, setEntryUnit] = useState(createEmptyUnit());
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [entryErrors, setEntryErrors] = useState({});
  const [headerErrors, setHeaderErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [browseFyStart, setBrowseFyStart] = useState(currentFyStart);

  const isLocked = reportMeta.status === 'submitted';
  const skipInitialLoadRef = useRef(true);

  useEffect(() => {
    authService.getCurrentUser()
      .then((result) => setCurrentUserRole(result?.user?.role || null))
      .catch(() => setCurrentUserRole(null));
  }, []);

  // NOTE: no "lock to own office" effect here — Government Twisting Unit
  // offices live in their own table (govt_twisting_offices), disjoint from
  // poc_users.office_id. Same precedent as Government Reeling Unit.

  // Office/Month/Year selected -> get-or-create the poc_reports row (existing
  // generic /api/reports), then load its normalized achievement/units/
  // abstract from the new /api/twisting-reports/:id/full endpoint. All
  // rollover math already happened server-side by the time this loads.
  useEffect(() => {
    if (!header.marketOfficeId || !header.month || !header.year) return undefined;
    const fiscalYear = getFinancialYearKey(header.month, header.year);
    if (!fiscalYear) return undefined;

    let cancelled = false;
    setLoadingReport(true);
    (async () => {
      try {
        let report = await getCurrentReport({ officeId: header.marketOfficeId, fiscalYear, month: header.month });
        if (!report) {
          report = await saveReportDraft({ officeId: header.marketOfficeId, fiscalYear, month: header.month, data: {} });
        }
        if (cancelled) return;
        setReportId(report.id);
        setReportMeta({ status: report.status, submittedAt: report.submittedAt });

        const full = await getFullTwistingReport(report.id);
        if (cancelled) return;
        setAchievement(full.achievement || emptyAchievement);
        setUnits(full.units || []);
        setAbstractData(full.abstract || { rows: [], grandTotal: null });
        setEntryUnit(createEmptyUnit());
        setEditingUnitId(null);
        if (!skipInitialLoadRef.current) setMessage('');
        skipInitialLoadRef.current = false;
      } catch (error) {
        console.error('Failed to load twisting report:', error);
        if (!cancelled) setMessage('Failed to load this period\'s report — check your connection and try again.');
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    })();
    return () => { cancelled = true; };
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
  const handleAchievedField = (value) =>
    setAchievement((prev) => ({ ...prev, achieved: { ...prev.achieved, dm: value } }));

  // Live U.M preview for the unit currently being entered — display only;
  // the authoritative U.M is always whatever the server returns after save.
  const tables = useMemo(() => {
    const out = {};
    UNIT_TABLE_GROUPS.forEach(({ path, fields }) => {
      const data = entryUnit[path] || {};
      const computed = { ...data };
      fields.forEach(({ ulmKey, dmKey, umKey }) => {
        const ulm = Number(data[ulmKey]) || 0;
        const dm = Number(data[dmKey]) || 0;
        computed[umKey] = Math.round((ulm + dm) * 100) / 100;
      });
      out[path] = computed;
    });
    return out;
  }, [entryUnit]);

  const nscFields = UNIT_TABLE_GROUPS.find((g) => g.path === 'nscExpenditure').fields;
  const costSaleFields = UNIT_TABLE_GROUPS.find((g) => g.path === 'costSaleValue').fields;
  const productionFields = UNIT_TABLE_GROUPS.find((g) => g.path === 'productionDetails').fields.filter((f) => f.key !== 'spindlesInstalled');

  const nscTotalPreview = nscFields.reduce(
    (acc, f) => ({
      ulm: acc.ulm + (Number(tables.nscExpenditure[f.ulmKey]) || 0),
      dm: acc.dm + (Number(tables.nscExpenditure[f.dmKey]) || 0),
      um: acc.um + (Number(tables.nscExpenditure[f.umKey]) || 0),
    }),
    { ulm: 0, dm: 0, um: 0 }
  );
  const wasteField = costSaleFields.find((f) => f.key === 'saleValueOfTwistedWaste');
  const productionField = UNIT_TABLE_GROUPS.find((g) => g.path === 'productionDetails').fields.find((f) => f.key === 'productionOfTwistedRawSilk');
  const netExpenditurePreview = {
    dm: nscTotalPreview.dm - (Number(tables.costSaleValue[wasteField.dmKey]) || 0),
    um: nscTotalPreview.um - (Number(tables.costSaleValue[wasteField.umKey]) || 0),
  };
  const productionDm = Number(tables.productionDetails[productionField.dmKey]) || 0;
  const productionUm = Number(tables.productionDetails[productionField.umKey]) || 0;
  const costPerKgPreview = {
    dm: productionDm > 0 ? Math.round((netExpenditurePreview.dm / productionDm) * 100) / 100 : '',
    um: productionUm > 0 ? Math.round((netExpenditurePreview.um / productionUm) * 100) / 100 : '',
  };

  const achievementRows = [
    {
      key: 'target', label: 'Target',
      ulm: achievement.target.ulm, dm: achievement.target.dm, um: achievement.target.um,
      dmEditable: false,
    },
    {
      key: 'achieved', label: 'Achieved',
      ulm: achievement.achieved.ulm, dm: achievement.achieved.dm, um: achievement.achieved.um,
      dmEditable: !isLocked,
      onDmChange: handleAchievedField,
    },
  ];

  const nscRows = [
    ...buildRows(nscFields, entryUnit.nscExpenditure, tables.nscExpenditure, 'nscExpenditure', handleTableFieldChange, entryErrors),
    { key: 'nscTotal', label: 'TOTAL', ulm: nscTotalPreview.ulm, dm: nscTotalPreview.dm, um: nscTotalPreview.um, dmEditable: false, emphasis: true },
  ];

  const costSaleRows = [
    ...buildRows(costSaleFields, entryUnit.costSaleValue, tables.costSaleValue, 'costSaleValue', handleTableFieldChange, entryErrors),
    { key: 'netExpenditure', label: 'Net Expenditure (Rs)', ulm: undefined, dm: netExpenditurePreview.dm, um: netExpenditurePreview.um, dmEditable: false, emphasis: true },
    { key: 'costOfProductionPerKg', label: 'Cost of Production per Kg (Rs)', ulm: undefined, dm: costPerKgPreview.dm === '' ? '—' : costPerKgPreview.dm, um: costPerKgPreview.um === '' ? '—' : costPerKgPreview.um, dmEditable: false, emphasis: true },
  ];

  const refreshFullReport = async () => {
    if (!reportId) return;
    const full = await getFullTwistingReport(reportId);
    setAchievement(full.achievement || emptyAchievement);
    setUnits(full.units || []);
    setAbstractData(full.abstract || { rows: [], grandTotal: null });
  };

  const handleSaveUnit = async () => {
    const result = validateUnit(entryUnit);
    if (!result.success) {
      setEntryErrors(zodFieldErrors(result.error));
      setMessage('Fix validation errors before saving this unit.');
      return;
    }
    if (!reportId) {
      setMessage('Select a Region and Office and a period before adding units.');
      return;
    }
    setEntryErrors({});
    setSaving(true);
    try {
      const payload = entryUnitToServerPayload(entryUnit);
      if (editingUnitId) {
        await updateTwistingUnit(reportId, editingUnitId, payload);
      } else {
        await createTwistingUnit(reportId, payload);
      }
      await refreshFullReport();
      setEntryUnit(createEmptyUnit());
      setEditingUnitId(null);
      setMessage(editingUnitId ? 'Unit updated.' : 'Unit added to the list.');
    } catch (error) {
      console.error('Failed to save twisting unit:', error);
      setMessage(error.message || 'Failed to save unit.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUnit = (unit) => {
    setEntryUnit(serverUnitToEntry(unit));
    setEditingUnitId(unit.id);
    setMessage(`Editing ${unit.unitName || 'unit'} — save or cancel below.`);
  };

  const handleCancelEdit = () => {
    setEntryUnit(createEmptyUnit());
    setEditingUnitId(null);
    setEntryErrors({});
  };

  const handleDeleteUnit = async (unitId) => {
    if (!reportId) return;
    try {
      await deleteTwistingUnit(reportId, unitId);
      await refreshFullReport();
      if (editingUnitId === unitId) handleCancelEdit();
    } catch (error) {
      console.error('Failed to delete twisting unit:', error);
      setMessage(error.message || 'Failed to delete unit.');
    }
  };

  const validateHeader = () => {
    if (!header.region || !header.marketOfficeId || !header.month || !header.year) {
      setHeaderErrors({ region: !header.region ? 'Region is required' : undefined, marketOfficeId: !header.marketOfficeId ? 'Office is required' : undefined });
      return false;
    }
    setHeaderErrors({});
    return true;
  };

  const handleSaveReport = async () => {
    if (isLocked) {
      setMessage('This report is submitted and locked.');
      return;
    }
    if (!validateHeader() || !reportId) {
      setMessage('Complete the shared header (Region, Office, Month, Year) before saving.');
      return;
    }
    setSaving(true);
    try {
      const dm = Number(achievement.achieved.dm) || 0;
      await saveTwistingAchievement(reportId, dm);
      await refreshFullReport();
      setMessage('Report saved as draft.');
    } catch (error) {
      console.error('Failed to save achievement:', error);
      setMessage(error.message || 'Failed to save — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (isLocked) {
      setMessage('This report is submitted and locked.');
      return;
    }
    if (!validateHeader() || !reportId) {
      setMessage('Complete the shared header before submitting.');
      return;
    }
    if (units.length === 0) {
      setMessage('Add at least one twisting unit before submitting.');
      return;
    }

    setSaving(true);
    try {
      // Persist any not-yet-saved Achieved D.M edit before locking.
      await saveTwistingAchievement(reportId, Number(achievement.achieved.dm) || 0);
      const result = await submitTwistingReport(reportId);

      const nextPeriod = nextCalendarPeriod(header.month, header.year);
      skipInitialLoadRef.current = true;
      if (nextPeriod && result.nextReportId) {
        setHeader((prev) => ({ ...prev, month: nextPeriod.month, year: String(nextPeriod.year) }));
        setReportId(result.nextReportId);
        const full = await getFullTwistingReport(result.nextReportId);
        setReportMeta({ status: 'draft', submittedAt: null });
        setAchievement(full.achievement || emptyAchievement);
        setUnits(full.units || []);
        setAbstractData(full.abstract || { rows: [], grandTotal: null });
        setEntryUnit(createEmptyUnit());
        setEditingUnitId(null);
        setMessage(`Report submitted and locked. Now showing the ${nextPeriod.month} ${nextPeriod.year} draft, with U.L.M carried forward from this month's U.M values.`);
      } else {
        setReportMeta({ status: result.report.status, submittedAt: result.report.submittedAt });
        setMessage('Report submitted and locked.');
      }
    } catch (error) {
      console.error('Failed to submit twisting report:', error);
      setMessage(error.message || 'Submission failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (showPrint) {
    return (
      <GovernmentTwistingUnitPrintView
        header={header}
        achievement={achievement}
        units={units}
        abstractData={abstractData}
        onClose={() => setShowPrint(false)}
      />
    );
  }

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

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-emerald-secondary">Achievement to Target</h3>
        <p className="mb-3 text-xs text-slate-500">
          Office-wide, not per unit. Target row is read-only — D.M is auto-derived from the Target page's
          Yearly Target ÷ 12 for {ACHIEVEMENT_METRIC_LABEL}. Achieved D.M is the only editable cell.
        </p>
        <DataTable title={ACHIEVEMENT_METRIC_LABEL} rows={achievementRows} />
      </div>

      {message && (
        <div className={clsx('rounded-lg px-4 py-3 text-sm', isLocked ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800')}>
          {message}
        </div>
      )}

      {loadingReport && (
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">Loading report…</div>
      )}

      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Submitted report — locked
            {reportMeta.submittedAt ? ` on ${new Date(reportMeta.submittedAt).toLocaleString()}` : ''}.
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
              rows={buildRows(productionFields, entryUnit.productionDetails, tables.productionDetails, 'productionDetails', handleTableFieldChange, entryErrors)}
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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light disabled:opacity-50"
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
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/80">
                    <td className="border border-slate-100 px-3 py-2">{unit.unitName || '(unnamed unit)'}</td>
                    <td className="border border-slate-100 px-3 py-2 text-right">{unit.productionOfTwistedRawSilk?.dm || '—'}</td>
                    <td className="border border-slate-100 px-3 py-2 text-right">{unit.totals?.nscTotal?.dm || '—'}</td>
                    <td className="border border-slate-100 px-3 py-2 text-right">{unit.totals?.costOfProductionPerKg?.dm ?? '—'}</td>
                    {!isLocked && (
                      <td className="border border-slate-100 px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditUnit(unit)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-emerald-secondary">Abstract</h3>
        <p className="mb-3 text-xs text-slate-500">Server-computed from the units above — never entered directly.</p>
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
              {abstractData.rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {ABSTRACT_COLUMNS.map((col) => (
                    <td key={col.id} className={clsx('border border-slate-100 px-3 py-2', col.id !== 'unitName' && 'text-right')}>
                      {row[col.id] === '' || row[col.id] == null ? '—' : row[col.id]}
                    </td>
                  ))}
                </tr>
              ))}
              {abstractData.grandTotal && (
                <tr className="bg-amber-50 font-semibold">
                  {ABSTRACT_COLUMNS.map((col) => (
                    <td key={col.id} className={clsx('border border-slate-100 px-3 py-2', col.id !== 'unitName' && 'text-right')}>
                      {abstractData.grandTotal[col.id] === '' || abstractData.grandTotal[col.id] == null ? '—' : abstractData.grandTotal[col.id]}
                    </td>
                  ))}
                </tr>
              )}
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
