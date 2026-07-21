import { MIS37_TAB_SECTIONS } from './mis37FormSchema.js';
import { MIS37_FORM_CODE, MIS37_REPORT_TITLE } from './mis37Constants.js';

function PrintTable({ title, headers, rows }) {
  return (
    <div className="mb-6 break-inside-avoid">
      <h3 className="mb-2 border-b border-slate-400 pb-1 text-sm font-bold uppercase">{title}</h3>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="border border-slate-400 bg-slate-100 px-2 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="border border-slate-300 px-2 py-1">{cell ?? '—'}</td>
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

export default function GovernmentReelingUnitPrintView({ values, onClose }) {
  const header = values.header || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-4 flex gap-2 print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
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

      <div className="rounded-xl border border-slate-300 bg-white p-6 print:border-0 print:p-0">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">{MIS37_FORM_CODE}</p>
          <h1 className="text-xl font-bold text-emerald-secondary">{MIS37_REPORT_TITLE}</h1>
          <p className="mt-2 text-sm">
            Unit: {header.unitName} | Code: {header.unitCode} | AD: {header.adCode} | DIS: {header.disCode} | REG: {header.regCode}
          </p>
          <p className="text-sm">Period: {header.month} {header.year}</p>
        </div>

        {MIS37_TAB_SECTIONS.map((tab) => (
          <div key={tab.id} className="mb-8 break-inside-avoid">
            <h2 className="mb-4 border-b-2 border-emerald-primary pb-1 text-base font-bold text-emerald-secondary">
              {tab.label}
            </h2>

            {tab.sections.map((section) => {
              if (section.type === 'fieldGrid') {
                const data = getVal(values, section.path) || {};
                return (
                  <PrintTable
                    key={section.id}
                    title={section.title}
                    headers={['Field', 'Value']}
                    rows={(section.fields || []).map((f) => [f.label, data[f.key] ?? '—'])}
                  />
                );
              }

              if (section.type === 'matrix') {
                const data = getVal(values, section.path) || {};
                return (
                  <PrintTable
                    key={section.id}
                    title={section.title}
                    headers={['Particulars', ...(section.columns || []).map((c) => c.label)]}
                    rows={(section.rows || []).map((row) => [
                      row.label,
                      ...(section.columns || []).map((col) => data[row.key]?.[col.key] ?? '—'),
                    ])}
                  />
                );
              }

              if (section.type === 'profitLoss') {
                const pl = values.tab3?.profitLoss || {};
                return (
                  <PrintTable
                    key={section.id}
                    title={section.title}
                    headers={['Period', 'Result', 'Amount (Rs)']}
                    rows={[
                      ['D.M', pl.dmIsProfit ? 'Profit' : 'Loss', pl.dm ?? '—'],
                      ['U.M', pl.umIsProfit ? 'Profit' : 'Loss', pl.um ?? '—'],
                    ]}
                  />
                );
              }

              return (
                <div key={section.id} className="mb-4 text-xs text-slate-500">
                  {section.title} — see electronic submission for full tabular data.
                </div>
              );
            })}
          </div>
        ))}

        <p className="mt-8 text-center text-xs text-slate-500">
          Generated from PDL MIS-37 electronic data entry form
        </p>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .mis-portal-sidebar, .mis-portal-header, .mis-portal-sidebar-overlay { display: none !important; }
        }
      `}</style>
    </div>
  );
}
