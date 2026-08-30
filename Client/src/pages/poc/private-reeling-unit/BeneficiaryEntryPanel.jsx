import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import {
  BENEFICIARY_FIELDS,
  INSTALLED_FUNCTIONAL_FIELDS,
  KG_FIELD_GROUPS,
  LIST_COLUMNS,
} from './mis40Constants.js';
import { computeRowsWithCalculations, computeTotalRow, createEmptyRow } from './mis40Calculations.js';
import { validateRow } from './mis40ZodSchema.js';

function zodFieldErrors(error) {
  if (!error?.issues) return {};
  const map = {};
  error.issues.forEach((issue) => {
    map[issue.path[issue.path.length - 1]] = issue.message;
  });
  return map;
}

function TextField({ label, value, onChange, error, type = 'text', readOnly, computed }) {
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
          type={type}
          step={type === 'number' ? 'any' : undefined}
          min={type === 'number' ? '0' : undefined}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-primary/30"
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

/** One U.L.M / D.M / U.M table per section — Government Reeling Unit's matrix-table style. */
function KgFieldTable({ section, entryRow, computedEntry, onFieldChange, errors }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-900">{section.title}</h4>
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
            {section.groups.map((g) => (
              <tr key={g.key}>
                <td className="border border-slate-200 px-3 py-2 font-normal text-slate-700">{g.label}</td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="text"
                    readOnly
                    value={entryRow[g.ulmKey] === '' || entryRow[g.ulmKey] == null ? 0 : entryRow[g.ulmKey]}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right text-slate-600"
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={entryRow[g.dmKey] ?? ''}
                    onChange={(e) => onFieldChange(g.dmKey, e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-right outline-none transition focus:ring-2 focus:ring-emerald-primary/30"
                  />
                  {errors[g.dmKey] && <p className="text-[10px] text-red-600">{errors[g.dmKey]}</p>}
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="text"
                    readOnly
                    value={computedEntry[g.umKey] === '' || computedEntry[g.umKey] == null ? 0 : computedEntry[g.umKey]}
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

/** Groups KG_FIELD_GROUPS by their `.section`, preserving first-seen order. */
function groupBySection(groups) {
  const sections = [];
  const bySection = new Map();
  groups.forEach((g) => {
    if (!bySection.has(g.section)) {
      const entry = { title: g.section, groups: [] };
      bySection.set(g.section, entry);
      sections.push(entry);
    }
    bySection.get(g.section).groups.push(g);
  });
  return sections;
}

const KG_SECTIONS = groupBySection(KG_FIELD_GROUPS);

export default function BeneficiaryEntryPanel({ category, rows, onRowsChange, isLocked }) {
  const [entryRow, setEntryRow] = useState(createEmptyRow());
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const safeRows = Array.isArray(rows) ? rows : [];
  const computedEntry = computeRowsWithCalculations([entryRow])[0];
  const computedRows = computeRowsWithCalculations(safeRows);
  const totals = computeTotalRow(safeRows);

  const handleTopField = (key, value) => setEntryRow((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const result = validateRow(entryRow);
    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }
    setErrors({});

    const nextRows = editingId
      ? safeRows.map((r) => (r.id === editingId ? entryRow : r))
      : [...safeRows, entryRow];

    onRowsChange(nextRows);
    setEntryRow(createEmptyRow());
    setEditingId(null);
  };

  const handleEdit = (id) => {
    const row = safeRows.find((r) => r.id === id);
    if (!row) return;
    setEntryRow(row);
    setEditingId(id);
  };

  const handleCancel = () => {
    setEntryRow(createEmptyRow());
    setEditingId(null);
    setErrors({});
  };

  const handleDelete = (id) => {
    onRowsChange(safeRows.filter((r) => r.id !== id));
    if (editingId === id) handleCancel();
  };

  return (
    <div className="space-y-4">
      {!isLocked && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-emerald-secondary">
              {editingId ? `Edit Beneficiary — ${category?.title}` : `Add a Beneficiary — ${category?.title}`}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" /> Cancel edit
              </button>
            )}
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-900">Beneficiary</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {BENEFICIARY_FIELDS.map((f) => (
                <TextField
                  key={f.key}
                  label={f.label}
                  value={entryRow[f.key]}
                  onChange={(val) => handleTopField(f.key, val)}
                  error={errors[f.key]}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-900">Installed &amp; Functional</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {INSTALLED_FUNCTIONAL_FIELDS.map((f) => (
                <TextField
                  key={f.key}
                  label={f.label}
                  type="number"
                  value={entryRow[f.key]}
                  onChange={(val) => handleTopField(f.key, val)}
                  error={errors[f.key]}
                />
              ))}
            </div>
          </div>

          {KG_SECTIONS.map((section) => (
            <KgFieldTable
              key={section.title}
              section={section}
              entryRow={entryRow}
              computedEntry={computedEntry}
              onFieldChange={handleTopField}
              errors={errors}
            />
          ))}

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TextField label="Renditta % (D.M)" value={computedEntry.rendittaDm} computed />
            <TextField label="Renditta % (U.M)" value={computedEntry.rendittaUm} computed />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light"
            >
              <Plus className="h-4 w-4" /> {editingId ? 'Save changes' : 'Save beneficiary'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {safeRows.length === 0 ? (
          <p className="text-sm text-slate-500">No beneficiaries added yet.</p>
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
                {computedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    {LIST_COLUMNS.map((col) => (
                      <td key={col.id} className={clsx('border border-slate-100 px-3 py-2', col.id !== 'beneficiaryName' && col.id !== 'place' && 'text-right')}>
                        {row[col.id] === '' || row[col.id] == null ? '—' : row[col.id]}
                      </td>
                    ))}
                    {!isLocked && (
                      <td className="border border-slate-100 px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleEdit(row.id)} className="rounded p-1 text-slate-500 hover:bg-slate-100" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleDelete(row.id)} className="rounded p-1 text-red-500 hover:bg-red-50" title="Delete">
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

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Cocoon Consumed (D.M)</p>
            <p className="text-sm font-semibold text-emerald-secondary">{totals.cocoonConsumedDm || 0}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Silk Production (D.M)</p>
            <p className="text-sm font-semibold text-emerald-secondary">{totals.silkProductionDm || 0}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Overall Renditta % (D.M)</p>
            <p className="text-sm font-semibold text-emerald-secondary">{totals.rendittaDm || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Functional Devices</p>
            <p className="text-sm font-semibold text-emerald-secondary">{totals.functionalDevice || 0}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
        Signature of the Reeling Extension Officer — display only, captured on final submit
      </div>
    </div>
  );
}
