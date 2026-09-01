import {
  MIS34_REPORT_TITLE,
  MIS34_FORM_CODE,
  ACHIEVEMENT_METRIC_LABEL,
  PRODUCTION_FIELDS,
  UNIT_TABLE_GROUPS,
  ABSTRACT_COLUMNS,
} from './mis34Constants.js';

function cell(val) {
  return val === '' || val == null ? '—' : val;
}

/** Print-format U.L.M/D.M/U.M table. */
function DataTablePrint({ title, rows }) {
  return (
    <table className="mb-2 w-full border-collapse text-[10px]">
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-slate-300 px-1 py-1 text-left">{title}</th>
          <th className="border border-slate-300 px-1 py-1 text-left">U.L.M</th>
          <th className="border border-slate-300 px-1 py-1 text-left">D.M</th>
          <th className="border border-slate-300 px-1 py-1 text-left">U.M</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className={row.emphasis ? 'bg-amber-50 font-bold' : undefined}>
            <td className="border border-slate-200 px-1 py-0.5">{row.label}</td>
            <td className="border border-slate-200 px-1 py-0.5">{row.ulm === undefined ? '—' : cell(row.ulm)}</td>
            <td className="border border-slate-200 px-1 py-0.5">{cell(row.dm)}</td>
            <td className="border border-slate-200 px-1 py-0.5">{cell(row.um)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function unitToRows(fields, unit) {
  return fields.map((f) => ({ key: f.key, label: f.label, ...unit[f.key] }));
}

function UnitPrintCard({ unit, index }) {
  const nscFields = UNIT_TABLE_GROUPS.find((g) => g.path === 'nscExpenditure').fields;
  const costSaleFields = UNIT_TABLE_GROUPS.find((g) => g.path === 'costSaleValue').fields;
  const productionFields = UNIT_TABLE_GROUPS.find((g) => g.path === 'productionDetails').fields;

  const nscRows = [
    ...unitToRows(nscFields, unit),
    { key: 'nscTotal', label: 'TOTAL', ...unit.totals.nscTotal, emphasis: true },
  ];
  const costSaleRows = [
    ...unitToRows(costSaleFields, unit),
    { key: 'netExpenditure', label: 'Net Expenditure (Rs)', ulm: undefined, ...unit.totals.netExpenditure, emphasis: true },
    { key: 'costOfProductionPerKg', label: 'Cost of Production per Kg (Rs)', ulm: undefined, ...unit.totals.costOfProductionPerKg, emphasis: true },
  ];

  return (
    <div className="mb-6 break-inside-avoid rounded border border-slate-300 p-3">
      <h3 className="mb-2 border-b border-slate-400 pb-1 text-sm font-bold">
        {index + 1}. {unit.unitName || '(unnamed unit)'} {unit.unitCode ? `(${unit.unitCode})` : ''}
      </h3>

      <table className="mb-2 w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="w-32 border border-slate-300 px-1 py-1 text-left">Production Capacity</th>
            {PRODUCTION_FIELDS.map((f) => (
              <th key={f.key} className="border border-slate-300 px-1 py-1 text-left">{f.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-200 px-1 py-0.5" />
            {PRODUCTION_FIELDS.map((f) => (
              <td key={f.key} className="border border-slate-200 px-1 py-0.5">{unit[f.key] || '—'}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <DataTablePrint title="Production Details" rows={unitToRows(productionFields, unit)} />
      <DataTablePrint title="NSC Expenditure" rows={nscRows} />
      <DataTablePrint title="Cost & Sale Value" rows={costSaleRows} />
    </div>
  );
}

export default function GovernmentTwistingUnitPrintView({ header, achievement, units, abstractData, onClose }) {
  const safeHeader = header || {};
  const safeUnits = Array.isArray(units) ? units : [];
  const rows = abstractData?.rows || [];
  const grandTotal = abstractData?.grandTotal;

  const achievementRows = [
    { key: 'target', label: 'Target', ...achievement.target },
    { key: 'achieved', label: 'Achieved', ...achievement.achieved },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-4 flex gap-2 print:hidden">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
          Back to Form
        </button>
        <button type="button" onClick={() => window.print()} className="rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white">
          Print Report
        </button>
      </div>

      <div className="rounded-xl border border-slate-300 bg-white p-6 print:border-0">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">{MIS34_FORM_CODE}</p>
          <h1 className="text-xl font-bold text-emerald-secondary">{MIS34_REPORT_TITLE}</h1>
          <p className="mt-2 text-sm">
            AD: {safeHeader.adCode || '—'} | DIS: {safeHeader.disCode || '—'} | REG: {safeHeader.regCode || '—'} | {safeHeader.month || '—'} {safeHeader.year || '—'}
          </p>
        </div>

        <h2 className="mb-3 border-b-2 border-emerald-primary pb-1 text-base font-bold">Achievement to Target (Office-wide)</h2>
        <DataTablePrint title={ACHIEVEMENT_METRIC_LABEL} rows={achievementRows} />

        <h2 className="mb-3 mt-6 border-b-2 border-emerald-primary pb-1 text-base font-bold">Twisting Units ({safeUnits.length})</h2>
        {safeUnits.length === 0 ? (
          <p className="text-sm text-slate-500">No units added.</p>
        ) : (
          safeUnits.map((unit, index) => <UnitPrintCard key={unit.id} unit={unit} index={index} />)
        )}

        <h2 className="mb-3 mt-6 border-b-2 border-emerald-primary pb-1 text-base font-bold">Abstract</h2>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-100">
              {ABSTRACT_COLUMNS.map((col) => (
                <th key={col.id} className="border border-slate-300 px-1 py-1 text-left">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {ABSTRACT_COLUMNS.map((col) => (
                  <td key={col.id} className="border border-slate-200 px-1 py-0.5">
                    {row[col.id] === '' || row[col.id] == null ? '—' : row[col.id]}
                  </td>
                ))}
              </tr>
            ))}
            {grandTotal && (
              <tr className="bg-amber-50 font-bold">
                {ABSTRACT_COLUMNS.map((col) => (
                  <td key={col.id} className="border border-slate-200 px-1 py-0.5">
                    {grandTotal[col.id] === '' || grandTotal[col.id] == null ? '—' : grandTotal[col.id]}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
