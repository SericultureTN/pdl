import { useMemo } from 'react';
import { ABSTRACT_COLUMNS } from './mis40Constants.js';
import { getAbstractAsTableData } from './mis40AbstractQuery.js';

export default function AbstractTabPanel({ categories, header }) {
  const tableData = useMemo(
    () => getAbstractAsTableData(categories),
    [categories]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-primary/20 bg-emerald-muted p-4">
        <h2 className="text-lg font-bold text-emerald-secondary">Abstract Summary</h2>
        <p className="mt-1 text-sm text-slate-600">
          Auto-computed from ARM, Charka, Cottage, and MRM registers for{' '}
          <strong>{header?.month || '—'} {header?.year || '—'}</strong>.
          Sarvodhaya Sangam has no detail tab — shows zero unless data is added later.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Equivalent SQL:{' '}
          <code className="rounded bg-white px-1 py-0.5">
            SELECT unit_type, SUM(...) GROUP BY unit_type
          </code>
        </p>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-max border-collapse text-xs">
          <thead className="sticky top-0 bg-emerald-muted">
            <tr>
              {ABSTRACT_COLUMNS.map((col) => (
                <th
                  key={col.id}
                  className="whitespace-nowrap border border-slate-200 px-3 py-2 text-left font-semibold text-emerald-secondary"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr
                key={row.key}
                className={row.isGrandTotal ? 'bg-amber-50 font-bold' : 'hover:bg-slate-50'}
              >
                {ABSTRACT_COLUMNS.map((col) => (
                  <td
                    key={col.id}
                    className="border border-slate-100 px-3 py-2 text-right"
                  >
                    {col.id === 'unitType'
                      ? row.unitType
                      : (row[col.id] ?? (row.isGrandTotal ? 0 : '—'))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        This tab is read-only. Edit beneficiary rows in ARM / Charka / Cottage / MRM tabs to update the abstract.
      </div>
    </div>
  );
}
