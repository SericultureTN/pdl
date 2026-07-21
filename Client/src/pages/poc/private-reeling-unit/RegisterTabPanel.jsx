import { Save } from 'lucide-react';
import { HEADER_FIELDS } from './mis40Constants.js';
import RegisterGrid from './RegisterGrid.jsx';
import { createEmptyRow, createRowId } from './mis40Calculations.js';

export default function RegisterTabPanel({
  category,
  header,
  rows,
  onHeaderChange,
  onRowsChange,
  onSave,
  errors = {},
  rowErrors = {},
}) {
  const safeHeader = header || {};
  const safeRows = Array.isArray(rows) ? rows : [];

  const handleDeleteRow = (index) => {
    if (safeRows.length <= 1) return;
    onRowsChange(safeRows.filter((_, i) => i !== index));
  };

  const handleAddViaGrid = (nextRows) => {
    const normalized = nextRows.map((row) => ({
      ...createEmptyRow(),
      ...row,
      id: row.id || createRowId(),
    }));
    onRowsChange(normalized);
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-30 rounded-xl border border-emerald-primary/20 bg-white/95 p-4 shadow-md backdrop-blur">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-emerald-secondary">{category?.title || 'Register'}</h2>
            <p className="text-sm text-slate-500">Private Reeling Units Monthly Return — PDL MIS-40</p>
          </div>
          <span className="rounded-full bg-gold-muted px-3 py-1 text-xs font-semibold text-emerald-secondary">
            {safeHeader.pdlNo || 'MIS-40'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {HEADER_FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                {field.label}
              </span>
              {field.type === 'readonly' ? (
                <input
                  type="text"
                  readOnly
                  value={field.value || safeHeader[field.key] || ''}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              ) : field.type === 'select' ? (
                <select
                  value={safeHeader[field.key] || ''}
                  onChange={(e) => onHeaderChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select month</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={safeHeader[field.key] || ''}
                  onChange={(e) => onHeaderChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              )}
              {errors[field.key] && (
                <p className="mt-1 text-xs text-red-600">{errors[field.key]}</p>
              )}
            </label>
          ))}
        </div>
      </div>

      <RegisterGrid
        rows={safeRows}
        onRowsChange={handleAddViaGrid}
        onDeleteRow={handleDeleteRow}
        errors={rowErrors}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm text-slate-600">
          <p className="font-medium">Signature of the Reeling Extension Officer</p>
          <p className="text-xs text-slate-400">Display only — captured on final submit</p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-light"
        >
          <Save className="h-4 w-4" /> Save tab
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
        Assistant Director of Sericulture — sign-off on final submission
      </div>
    </div>
  );
}
