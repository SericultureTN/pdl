import { MIS34_TAB_SECTIONS, MIS34_REPORT_TITLE, MIS34_FORM_CODE } from './mis34FormSchema.js';

function PrintSection({ title, headers, rows }) {
  return (
    <div className="mb-6 break-inside-avoid">
      <h3 className="mb-2 border-b border-slate-400 pb-1 text-sm font-bold uppercase">{title}</h3>
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-100">
            {headers.map((h) => (
              <th key={h} className="border border-slate-300 px-1 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="border border-slate-200 px-1 py-0.5">{cell ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getVal(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export default function GovernmentTwistingUnitPrintView({ values, onClose }) {
  const header = values.header || {};

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
            {header.unitName} | {header.unitCode} | AD: {header.adCode} | {header.month} {header.year}
          </p>
        </div>

        {MIS34_TAB_SECTIONS.map((tab) => (
          <div key={tab.id} className="mb-8 break-inside-avoid">
            <h2 className="mb-3 border-b-2 border-emerald-primary pb-1 text-base font-bold">{tab.label}</h2>
            {tab.sections.map((section) => {
              if (section.type === 'fieldGrid') {
                const data = getVal(values, section.path) || {};
                return (
                  <PrintSection
                    key={section.id}
                    title={section.title}
                    headers={['Field', 'Value']}
                    rows={(section.fields || []).map((f) => [f.label, data[f.key] ?? '—'])}
                  />
                );
              }
              if (section.type === 'profitLossSingle') {
                const pl = getVal(values, section.path) || {};
                return (
                  <PrintSection
                    key={section.id}
                    title={section.title}
                    headers={['Result', 'Amount (Rs)']}
                    rows={[[pl.isProfit ? 'Profit' : 'Loss', Math.abs(Number(pl.amount) || 0)]]}
                  />
                );
              }
              return (
                <p key={section.id} className="mb-2 text-xs text-slate-500">
                  {section.title} — see electronic submission for full tabular data.
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
