import { useEffect, useMemo, useRef, useState } from 'react';
import { Target, Lock, RefreshCw, Plus } from 'lucide-react';
import { FINANCIAL_BUDGET_ROWS as REELING_BUDGET_ROWS } from '../government-reeling-unit/mis37Constants.js';
import { ABSTRACT_UNIT_TYPES } from '../private-reeling-unit/mis40Constants.js';
import { MONTHS, getFinancialYearKey } from './fiscalYear.js';
import { getCurrentTarget, listTargets, saveTarget, reviseTarget } from './targetsApi.js';
import RegionMarketOfficeSelect from '../../../components/RegionMarketOfficeSelect.jsx';
import GovtReelingOfficeSelect from '../../../components/GovtReelingOfficeSelect.jsx';
import GovtTwistingOfficeSelect from '../../../components/GovtTwistingOfficeSelect.jsx';
import FiscalYearMonthPicker, { currentFyStart } from '../../../components/FiscalYearMonthPicker.jsx';

function fyStartFromFiscalYear(fy) {
  if (!fy) return null;
  const n = Number(String(fy).split('-')[0]);
  return Number.isFinite(n) ? n : null;
}

const PRIVATE_CATEGORIES = ABSTRACT_UNIT_TYPES.filter((u) => u.sourceCategory);

// All 3 report types here are POC forms (Government Reeling MIS-37, Government
// Twisting MIS-34, Private Reeling MIS-40 are government form numbers, not a
// reference to the MIS section) — Region/Office is locked to POC's hierarchy,
// no Section picker. All three are annual targets now, keyed by fiscal year:
// Government Reeling Unit and Government Twisting Unit are office-keyed
// (Region/Office + fiscal year) with a Yearly Target auto-divided ÷12 into
// monthly D.M on the report (see deriveMonthlyFromAnnual.js in each report
// type's own folder). Private Reeling is unit-code-keyed (fiscal year +
// Category).
const REPORT_TYPES = [
  {
    key: 'government_reeling',
    label: 'Government Reeling Unit',
    officeKeyed: true,
    physicalFields: [{ key: 'target', label: 'Yearly Target (Kgs)' }],
    budgetRows: REELING_BUDGET_ROWS,
  },
  {
    key: 'government_twisting',
    label: 'Government Twisting Unit',
    officeKeyed: true,
    physicalFields: [{ key: 'twistedSilkTarget', label: 'Twisted Silk Production Target (Kg)' }],
    budgetRows: null,
  },
  {
    key: 'private_reeling',
    label: 'Private Reeling Unit',
    unitLabel: 'Category',
    unitHint: 'Compared against total Silk Production summed across that category’s beneficiaries for the year (Abstract tab).',
    physicalFields: [{ key: 'target', label: 'Target Production (Kg)' }],
    budgetRows: null,
    categorySelect: true,
  },
];

// Office-keyed report types each read their own disjoint office table
// (govt_reeling_offices / govt_twisting_offices) via their own Select
// component — see RegionMarketOfficeSelect's usage below for the remaining
// unit-code-keyed type (Private Reeling), which still reads the shared
// poc_offices hierarchy.
const OFFICE_SELECT_COMPONENT = {
  government_reeling: GovtReelingOfficeSelect,
  government_twisting: GovtTwistingOfficeSelect,
};

const now = new Date();
const CURRENT_CALENDAR_YEAR = now.getFullYear();
const CURRENT_MONTH = MONTHS[now.getMonth()];
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_CALENDAR_YEAR - 1 + i);
const FISCAL_YEAR_OPTIONS = YEAR_OPTIONS.map((y) => getFinancialYearKey('April', y));

function currentFiscalYear() {
  return getFinancialYearKey(CURRENT_MONTH, CURRENT_CALENDAR_YEAR);
}

function emptyPhysical(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

function emptyBudget(rows) {
  if (!rows) return null;
  return Object.fromEntries(rows.map((r) => [r.key, '']));
}

export default function SetTargetPage() {
  const formTopRef = useRef(null);
  const [reportTypeKey, setReportTypeKey] = useState(REPORT_TYPES[0].key);
  const reportType = REPORT_TYPES.find((t) => t.key === reportTypeKey);
  const officeKeyed = Boolean(reportType.officeKeyed);

  const [unitCode, setUnitCode] = useState('');
  const [fiscalYear, setFiscalYear] = useState(currentFiscalYear());
  const [regionId, setRegionId] = useState(null);
  // Government Reeling Unit uses its own office table (govt_reeling_offices,
  // region as plain text) instead of the shared poc_offices hierarchy the
  // other two report types use — see GovtReelingOfficeSelect.jsx. officeId
  // stays one shared piece of state either way; only the region selector
  // itself (and which table officeId's id-space belongs to) differs.
  const [reelingRegion, setReelingRegion] = useState('');
  const [officeId, setOfficeId] = useState(null);

  const [physicalTarget, setPhysicalTarget] = useState(emptyPhysical(reportType.physicalFields));
  const [budgetOutlay, setBudgetOutlay] = useState(emptyBudget(reportType.budgetRows));
  const [currentTargetId, setCurrentTargetId] = useState(null);
  const [lockedAt, setLockedAt] = useState(null);

  // Separate from physicalTarget/budgetOutlay (which hold the CURRENTLY SET,
  // read-only values once locked) — these hold the new values being entered
  // during a revision, so "what's set now" and "what you're changing it to"
  // are always two distinct fields on screen, never the same input toggling
  // between locked/editable.
  const [revisedPhysicalTarget, setRevisedPhysicalTarget] = useState(emptyPhysical(reportType.physicalFields));
  const [revisedBudgetOutlay, setRevisedBudgetOutlay] = useState(emptyBudget(reportType.budgetRows));
  const [reviseReason, setReviseReason] = useState('');
  const [showRevise, setShowRevise] = useState(false);

  const [statusList, setStatusList] = useState([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters for the "Submitted Targets" list below — independent of the
  // office/period selected above (which drives what the top card shows), so
  // browsing what's already been set doesn't disturb what you're currently
  // viewing/revising. Mirrors the Report Viewer's Region -> AD Office -> All
  // AD Office -> Fiscal Year filter pattern. Office-keyed types only —
  // unit-code-keyed types (Twisting/Private Reeling) have no office filter.
  const [filterRegionId, setFilterRegionId] = useState(null);
  const [filterOfficeId, setFilterOfficeId] = useState(null);
  const [filterAllOffices, setFilterAllOffices] = useState(true);
  const [filterFiscalYear, setFilterFiscalYear] = useState(currentFiscalYear());

  const filteredStatusList = useMemo(() => {
    if (!officeKeyed || filterAllOffices) return statusList;
    return statusList.filter((t) => {
      if (filterOfficeId && t.officeId !== filterOfficeId) return false;
      if (!filterOfficeId && filterRegionId && t.regionId !== filterRegionId) return false;
      return true;
    });
  }, [statusList, officeKeyed, filterAllOffices, filterRegionId, filterOfficeId]);

  useEffect(() => {
    setUnitCode(reportType.categorySelect ? PRIVATE_CATEGORIES[0]?.sourceCategory || '' : '');
    setFiscalYear(currentFiscalYear());
    setPhysicalTarget(emptyPhysical(reportType.physicalFields));
    setBudgetOutlay(emptyBudget(reportType.budgetRows));
    setRevisedPhysicalTarget(emptyPhysical(reportType.physicalFields));
    setRevisedBudgetOutlay(emptyBudget(reportType.budgetRows));
    setCurrentTargetId(null);
    setLockedAt(null);
    setRegionId(null);
    setReelingRegion('');
    setOfficeId(null);
    setShowRevise(false);
    setMessage('');
    setFilterRegionId(null);
    setFilterOfficeId(null);
    setFilterAllOffices(true);
    setFilterFiscalYear(currentFiscalYear());
  }, [reportTypeKey]);

  const refreshStatusList = useMemo(
    () => async () => {
      const listFiscalYear = officeKeyed ? filterFiscalYear : fiscalYear;
      if (!listFiscalYear) return;
      try {
        const targets = await listTargets({ unitType: reportTypeKey, fiscalYear: listFiscalYear });
        setStatusList(targets);
      } catch (error) {
        console.error('Failed to list targets:', error);
      }
    },
    [reportTypeKey, officeKeyed, filterFiscalYear, fiscalYear]
  );

  useEffect(() => {
    refreshStatusList();
  }, [refreshStatusList]);

  // Identifies "which target period" is being edited — office+fiscalYear for
  // office-keyed types, unitCode+fiscalYear for the others. officeId is
  // deliberately NOT part of this for non-office-keyed types: Region/Office
  // there is advisory display state, not the persistence key, and the fetch
  // below actively churns it (nulling it out when no target is found for
  // this unitCode) — treating every officeId change as a new identity would
  // make picking a Region/Office wipe whatever's being typed once that
  // churn's own reset loops back around into this effect.
  const targetIdentityRef = useRef('');

  useEffect(() => {
    const identity = officeKeyed
      ? `office:${reportTypeKey}|${officeId}|${fiscalYear}`
      : `unit:${reportTypeKey}|${unitCode}|${fiscalYear}`;
    const identityChanged = identity !== targetIdentityRef.current;
    targetIdentityRef.current = identity;

    const ready = officeKeyed ? Boolean(officeId && fiscalYear) : Boolean(unitCode && fiscalYear);

    // Clear the "currently set" figures synchronously, the instant the
    // identity above actually changes — before the debounced fetch below
    // even starts, and only when it's a genuine switch (see identityChanged
    // above), not on every officeId churn. The 300ms fetch below then either
    // fills these back in with a real saved target or leaves them blank.
    // Resetting them only after the debounced fetch resolves (the previous
    // behavior) raced against typing instead: pick an office, start
    // entering a value within 300ms, and the "no target yet" branch would
    // silently wipe the field back to blank underneath you, right before
    // Save.
    if (identityChanged) {
      setPhysicalTarget(emptyPhysical(reportType.physicalFields));
      setBudgetOutlay(emptyBudget(reportType.budgetRows));
      setCurrentTargetId(null);
      setLockedAt(null);
    }
    if (!ready) return undefined;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const target = officeKeyed
          ? await getCurrentTarget({ unitType: reportTypeKey, officeId, fiscalYear })
          : await getCurrentTarget({ unitType: reportTypeKey, unitCode, fiscalYear });
        if (cancelled) return;
        if (!target) {
          if (!officeKeyed) {
            setRegionId(null);
            setOfficeId(null);
          }
          return;
        }
        setPhysicalTarget({ ...emptyPhysical(reportType.physicalFields), ...(target.physicalTarget || {}) });
        setBudgetOutlay(reportType.budgetRows ? { ...emptyBudget(reportType.budgetRows), ...(target.budgetOutlay || {}) } : null);
        setCurrentTargetId(target.id);
        setLockedAt(target.lockedAt);
        if (!officeKeyed) {
          setRegionId(target.regionId ?? null);
          setOfficeId(target.officeId ?? null);
        }
      } catch (error) {
        console.error('Failed to fetch target:', error);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reportTypeKey, unitCode, fiscalYear, officeKeyed, officeId]);

  const isLocked = Boolean(currentTargetId && lockedAt);

  const handleSave = async () => {
    if (!officeId) {
      setMessage('Select a Region and Office before saving.');
      return;
    }
    if (!fiscalYear) {
      setMessage('Enter a Fiscal Year before saving.');
      return;
    }
    if (!officeKeyed && !unitCode) {
      setMessage(`Enter a ${reportType.unitLabel} before saving.`);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const target = await saveTarget({
        unitType: reportTypeKey,
        unitCode: officeKeyed ? undefined : unitCode,
        fiscalYear,
        officeId,
        physicalTarget,
        budgetOutlay: reportType.budgetRows ? budgetOutlay : null,
      });
      setCurrentTargetId(target.id);
      setLockedAt(target.lockedAt);
      setMessage(`Target saved and locked for ${fiscalYear}.`);
      refreshStatusList();
    } catch (error) {
      setMessage(error.message || 'Failed to save target.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevise = async () => {
    if (!reviseReason.trim()) {
      setMessage('A reason is required to revise a locked target.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const target = await reviseTarget(currentTargetId, {
        physicalTarget: revisedPhysicalTarget,
        budgetOutlay: reportType.budgetRows ? revisedBudgetOutlay : null,
        reason: reviseReason,
      });
      setCurrentTargetId(target.id);
      setLockedAt(target.lockedAt);
      // The revised values become the new "currently set" values.
      setPhysicalTarget({ ...emptyPhysical(reportType.physicalFields), ...(target.physicalTarget || {}) });
      setBudgetOutlay(reportType.budgetRows ? { ...emptyBudget(reportType.budgetRows), ...(target.budgetOutlay || {}) } : null);
      setShowRevise(false);
      setReviseReason('');
      setMessage('Target revised.');
      refreshStatusList();
    } catch (error) {
      setMessage(error.message || 'Failed to revise target.');
    } finally {
      setSaving(false);
    }
  };

  // Jumps the top card to a target picked from the status list below — sets the
  // same selection state Region/Office (or Unit Code) + Fiscal Year would,
  // which drives the existing fetch effect to load it into "Currently Set"
  // with the Revise Target button ready, without retyping the selectors.
  const handleViewTarget = (t) => {
    setShowRevise(false);
    setMessage('');
    setFiscalYear(t.fiscalYear);
    if (officeKeyed) {
      setReelingRegion(t.regionId ?? '');
      setOfficeId(t.officeId ?? null);
    } else {
      setUnitCode(t.unitCode);
    }
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Clears the office/unit selection so the page returns to the blank "add a
  // new target" form, instead of staying stuck showing whatever target was
  // just viewed or revised.
  const handleStartNewTarget = () => {
    setShowRevise(false);
    setReviseReason('');
    setMessage('');
    setCurrentTargetId(null);
    setLockedAt(null);
    if (officeKeyed) {
      setReelingRegion('');
      setOfficeId(null);
    } else {
      setUnitCode(reportType.categorySelect ? PRIVATE_CATEGORIES[0]?.sourceCategory || '' : '');
    }
    setPhysicalTarget(emptyPhysical(reportType.physicalFields));
    setBudgetOutlay(emptyBudget(reportType.budgetRows));
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div ref={formTopRef} className="rounded-xl border border-emerald-primary/20 bg-emerald-muted p-4">
        <h1 className="flex items-center gap-2 text-lg font-bold text-emerald-secondary">
          <Target className="h-5 w-5" /> Set Target
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {officeKeyed
            ? 'Set each office’s yearly physical target and annual budget once per fiscal year. The report auto-divides both ÷12 into each month’s D.M, read-only there.'
            : 'Set each unit’s annual physical target and budget once per fiscal year. Monthly reports read these values read-only.'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {officeKeyed ? (
          (() => {
            const OfficeSelect = OFFICE_SELECT_COMPONENT[reportTypeKey];
            return (
              <OfficeSelect
                region={reelingRegion}
                officeId={officeId}
                onChange={({ region: nextRegion, officeId: nextOfficeId }) => {
                  setReelingRegion(nextRegion);
                  setOfficeId(nextOfficeId);
                }}
                required
              />
            );
          })()
        ) : (
          <RegionMarketOfficeSelect
            regionId={regionId}
            marketOfficeId={officeId}
            onChange={({ regionId: nextRegionId, marketOfficeId: nextOfficeId }) => {
              setRegionId(nextRegionId);
              setOfficeId(nextOfficeId);
            }}
            required
          />
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Report Type</span>
            <select
              value={reportTypeKey}
              onChange={(e) => setReportTypeKey(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </label>

          {!officeKeyed && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{reportType.unitLabel}</span>
              {reportType.categorySelect ? (
                <select
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {PRIVATE_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.sourceCategory}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              )}
              <span className="mt-1 block text-xs text-slate-400">{reportType.unitHint}</span>
            </label>
          )}

          <div>
            <FiscalYearMonthPicker
              label="Fiscal Year *"
              fyStart={fyStartFromFiscalYear(fiscalYear) ?? currentFyStart()}
              onFyStartChange={(next) => setFiscalYear(`${next}-${next + 1}`)}
              showMonthGrid={false}
            />
          </div>
        </div>

        {isLocked && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Locked on {new Date(lockedAt).toLocaleString()}.</span>
            <div className="ml-auto flex gap-2">
              {!showRevise && (
                <button
                  type="button"
                  onClick={() => {
                    setRevisedPhysicalTarget(physicalTarget);
                    setRevisedBudgetOutlay(budgetOutlay);
                    setShowRevise(true);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Revise Target
                </button>
              )}
              <button
                type="button"
                onClick={handleStartNewTarget}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Target
              </button>
            </div>
          </div>
        )}

        {/* Currently set values — always a plain read-only display once a target exists,
            never the same field the Revise form edits, so what's set and what you're
            changing it to are never mixed up. */}
        {isLocked && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-emerald-secondary">Currently Set</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {reportType.physicalFields.map((field) => (
                <div key={field.key}>
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</span>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    {physicalTarget[field.key] || '—'}
                  </div>
                </div>
              ))}
            </div>
            {reportType.budgetRows && (
              <>
                <p className="mb-3 mt-4 text-xs text-slate-500">Budget Annual per category</p>
                <div className="grid gap-4 md:grid-cols-3">
                  {reportType.budgetRows.map((row) => (
                    <div key={row.key}>
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</span>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        {budgetOutlay?.[row.key] || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* New values being entered for a revision — a separate field from "Currently Set"
            above, so both are visible at once for comparison while revising. */}
        {isLocked && showRevise && (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-amber-900">Revised Target</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {reportType.physicalFields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={revisedPhysicalTarget[field.key] ?? ''}
                    onChange={(e) => setRevisedPhysicalTarget((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
            {reportType.budgetRows && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {reportType.budgetRows.map((row) => (
                  <label key={row.key} className="block">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={revisedBudgetOutlay?.[row.key] ?? ''}
                      onChange={(e) => setRevisedBudgetOutlay((prev) => ({ ...prev, [row.key]: e.target.value }))}
                      className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            )}

            <label className="mb-1 mt-4 block text-xs font-medium uppercase tracking-wide text-amber-800">Reason for revision (required)</label>
            <textarea
              value={reviseReason}
              onChange={(e) => setReviseReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleRevise}
                disabled={saving}
                className="rounded-lg bg-emerald-primary px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Updating…' : 'Update Target'}
              </button>
              <button
                type="button"
                onClick={() => { setShowRevise(false); setReviseReason(''); }}
                className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* First-time entry — no target exists yet for this office/period, so there's
            nothing to "view" separately; this is the only editable field in that case. */}
        {!isLocked && (
          <>
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-emerald-secondary">Achievement to Target — Physical</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {reportType.physicalFields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={physicalTarget[field.key] ?? ''}
                      onChange={(e) => setPhysicalTarget((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>

            {reportType.budgetRows && (
              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <h3 className="mb-3 text-sm font-semibold text-emerald-secondary">Achievement to Target — Financial Control Budget</h3>
                <p className="mb-3 text-xs text-slate-500">Budget Annual per category for the fiscal year — the report auto-divides this ÷12 into each month's Budget Outlay D.M.</p>
                <div className="grid gap-4 md:grid-cols-3">
                  {reportType.budgetRows.map((row) => (
                    <label key={row.key} className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={budgetOutlay?.[row.key] ?? ''}
                        onChange={(e) => setBudgetOutlay((prev) => ({ ...prev, [row.key]: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {message && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>
        )}

        {!isLocked && (
          <div className="mt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !officeId || !fiscalYear || (!officeKeyed && !unitCode)}
              className="rounded-lg bg-emerald-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Target'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-emerald-secondary">
          Submitted Targets — {reportType.label} — {(officeKeyed ? filterFiscalYear : fiscalYear) || 'select a fiscal year'}
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Click any row to view its target above and revise it if needed.
        </p>

        {officeKeyed && (
          <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              {(() => {
                const OfficeSelect = OFFICE_SELECT_COMPONENT[reportTypeKey];
                return (
                  <OfficeSelect
                    region={filterRegionId}
                    officeId={filterOfficeId}
                    onChange={({ region, officeId }) => {
                      setFilterRegionId(region);
                      setFilterOfficeId(officeId);
                      if (region || officeId) setFilterAllOffices(false);
                    }}
                    disabled={filterAllOffices}
                  />
                );
              })()}
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filterAllOffices}
                onChange={(e) => setFilterAllOffices(e.target.checked)}
                className="h-4 w-4"
              />
              All AD Office
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Fiscal Year</span>
              <select
                value={filterFiscalYear}
                onChange={(e) => setFilterFiscalYear(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {FISCAL_YEAR_OPTIONS.map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-muted">
                <th className="border border-slate-200 px-3 py-2 text-left">{officeKeyed ? 'Office' : reportType.unitLabel}</th>
                <th className="border border-slate-200 px-3 py-2 text-left">Status</th>
                <th className="border border-slate-200 px-3 py-2 text-left">Locked At</th>
                <th className="border border-slate-200 px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStatusList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-slate-200 px-3 py-3 text-center text-slate-400">
                    {statusList.length === 0
                      ? 'No targets set yet for this fiscal year.'
                      : 'No targets match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredStatusList.map((t) => (
                  <tr
                    key={t.id}
                    className={`cursor-pointer hover:bg-emerald-muted/60 ${t.id === currentTargetId ? 'bg-emerald-muted/40' : ''}`}
                    onClick={() => handleViewTarget(t)}
                  >
                    <td className="border border-slate-200 px-3 py-2">
                      {officeKeyed ? (t.officeName || `Office #${t.officeId}`) : t.unitCode}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">{t.lockedAt ? 'Locked' : 'Set'}</td>
                    <td className="border border-slate-200 px-3 py-2">{t.lockedAt ? new Date(t.lockedAt).toLocaleString() : '—'}</td>
                    <td className="border border-slate-200 px-3 py-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleViewTarget(t); }}
                        className="font-semibold text-emerald-primary hover:underline"
                      >
                        View / Revise
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
