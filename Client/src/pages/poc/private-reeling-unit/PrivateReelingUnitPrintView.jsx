import {
  CATEGORY_TABS,
  MIS40_FORM_CODE,
  MIS40_REPORT_TITLE,
  REGISTER_COLUMNS,
} from './mis40Constants.js';
import { computeRowsWithCalculations, computeTotalRow } from './mis40Calculations.js';
import { getAbstractAsTableData } from './mis40AbstractQuery.js';

export default function PrivateReelingUnitPrintView({ values, onClose }) {
  const { header, categories } = values;

  const handlePrint = () => window.print();

  return (
    <div className="mx-auto max-w-[1600px] p-4 md:p-6">
      <div className="mb-4 flex gap-2 print:hidden">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
          Back to Form
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-emerald-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Print Report
        </button>
      </div>

      <div className="space-y-8 rounded-xl border border-slate-300 bg-white p-6 print:border-0">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">PDL {MIS40_FORM_CODE}</p>
          <h1 className="text-xl font-bold">{MIS40_REPORT_TITLE}</h1>
          <p className="mt-2 text-sm">
            Assistant Director: {header.assistantDirectorName || '—'} | {header.month || '—'} {header.year || '—'}
          </p>
        </div>

        {CATEGORY_TABS.filter((t) => t.id !== 'abstract').map((tab) => {
          const rows = computeRowsWithCalculations(categories[tab.id]?.rows || []);
          const total = computeTotalRow(rows);

          return (
            <div key={tab.id} className="break-inside-avoid">
              <h2 className="mb-2 border-b border-emerald-primary pb-1 text-base font-bold text-emerald-secondary">
                {tab.title}
              </h2>
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-100">
                    {REGISTER_COLUMNS.map((col) => (
                      <th key={col.id} className="border border-slate-300 px-1 py-1 text-left">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="border border-slate-200 px-1 py-0.5">{idx + 1}</td>
                      {REGISTER_COLUMNS.slice(1).map((col) => (
                        <td key={col.id} className="border border-slate-200 px-1 py-0.5 text-right">
                          {row[col.id] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-amber-50 font-bold">
                    <td className="border border-slate-300 px-1 py-0.5">TOTAL</td>
                    {REGISTER_COLUMNS.slice(1).map((col) => (
                      <td key={col.id} className="border border-slate-300 px-1 py-0.5 text-right">
                        {col.id === 'remarks' ? '—' : (total[col.id] ?? '—')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        <div className="break-inside-avoid">
          <h2 className="mb-2 border-b border-emerald-primary pb-1 text-base font-bold">Abstract</h2>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-1 text-left">Unit Type</th>
                <th className="border border-slate-300 px-2 py-1">Installed Unit</th>
                <th className="border border-slate-300 px-2 py-1">Installed Device</th>
                <th className="border border-slate-300 px-2 py-1">Functional Unit</th>
                <th className="border border-slate-300 px-2 py-1">Functional Device</th>
                <th className="border border-slate-300 px-2 py-1">Cocoon Purch DM</th>
                <th className="border border-slate-300 px-2 py-1">Cocoon Purch UM</th>
                <th className="border border-slate-300 px-2 py-1">Cocoon Cons DM</th>
                <th className="border border-slate-300 px-2 py-1">Cocoon Cons UM</th>
                <th className="border border-slate-300 px-2 py-1">Silk Prod DM</th>
                <th className="border border-slate-300 px-2 py-1">Silk Prod UM</th>
                <th className="border border-slate-300 px-2 py-1">ASE DM</th>
                <th className="border border-slate-300 px-2 py-1">ASE UM</th>
                <th className="border border-slate-300 px-2 py-1">Private DM</th>
                <th className="border border-slate-300 px-2 py-1">Private UM</th>
              </tr>
            </thead>
            <tbody>
              {getAbstractAsTableData(categories).map((row) => (
                <tr key={row.key} className={row.isGrandTotal ? 'bg-amber-50 font-bold' : ''}>
                  <td className="border border-slate-200 px-2 py-0.5">{row.unitType}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.installedUnit ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.installedDevice ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.functionalUnit ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.functionalDevice ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.cocoonPurchasedDm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.cocoonPurchasedUm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.cocoonConsumedDm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.cocoonConsumedUm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.silkProductionDm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.silkProductionUm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.disposalAseDm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.disposalAseUm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.disposalPrivateDm ?? 0}</td>
                  <td className="border border-slate-200 px-2 py-0.5 text-right">{row.disposalPrivateUm ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
          <div className="border-t border-slate-400 pt-2">Signature of the Reeling Extension Officer</div>
          <div className="border-t border-slate-400 pt-2">Assistant Director of Sericulture</div>
        </div>
      </div>
    </div>
  );
}
