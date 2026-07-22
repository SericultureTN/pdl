import { MIS37_TAB_SECTIONS } from './mis37FormSchema.js';
import {
  MIS37_FORM_CODE,
  MIS37_REPORT_TITLE,
} from './mis37Constants.js';

function PrintTable({ title, headers, rows, note }) {
  return (
    <div className="mb-6 break-inside-avoid">
      <h3 className="mb-2 border-b border-slate-400 pb-1 text-sm font-bold uppercase">{title}</h3>
      {note && <p className="mb-2 text-xs text-slate-500">{note}</p>}
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

function renderSection(section, values) {
  const data = getVal(values, section.path) || {};

  if (section.type === 'fieldGrid') {
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        headers={['Field', 'Value']}
        rows={(section.fields || []).map((f) => [f.label, data[f.key] ?? '—'])}
      />
    );
  }

  if (section.type === 'timePeriodMatrix') {
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        note="U.L.M carried forward; U.M = U.L.M + D.M"
        headers={['Particulars', ...(section.columns || []).map((c) => c.label)]}
        rows={(section.rows || []).map((row) => [
          row.label,
          ...(section.columns || []).map((col) => data[row.key]?.[col.key] ?? '—'),
        ])}
      />
    );
  }

  if (section.type === 'financialBudget') {
    const rows = [];
    (section.rows || []).forEach((row) => {
      section.categoryTypes.forEach((type) => {
        rows.push([
          row.label,
          type.label,
          ...(section.columns || []).map((col) => data[row.key]?.[type.key]?.[col.key] ?? '—'),
        ]);
      });
    });
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        note="Budget U.M = Budget U.L.M + Budget D.M; Actual Annual = Budget Annual − Budget U.M"
        headers={['Category', 'Type', ...(section.columns || []).map((c) => c.label)]}
        rows={rows}
      />
    );
  }

  if (section.type === 'stockParticulars') {
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        note="Closing Balance = Opening + Added − Under Process"
        headers={['Item', ...(section.columns || []).map((c) => c.label)]}
        rows={(section.items || []).map((item) => [
          item.label,
          ...(section.columns || []).map((col) => data[item.key]?.[col.key] ?? '—'),
        ])}
      />
    );
  }

  if (section.type === 'receiptsTimePeriod') {
    const subCols = [
      { key: 'valueRs', label: 'Value (Rs)' },
      { key: 'cash', label: 'Cash' },
    ];
    const headers = ['Particulars'];
    subCols.forEach((sub) => {
      (section.columns || []).forEach((col) => {
        headers.push(`${sub.label} ${col.label}`);
      });
    });
    const rows = (section.items || []).map((item) => {
      const cells = [item.label];
      subCols.forEach((sub) => {
        (section.columns || []).forEach((col) => {
          cells.push(data[item.key]?.[sub.key]?.[col.key] ?? '—');
        });
      });
      return cells;
    });
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        headers={headers}
        rows={rows}
      />
    );
  }

  if (section.type === 'silkSalesTimePeriod') {
    const subCols = [
      { key: 'qty', label: 'Qty (Kgs)' },
      { key: 'value', label: 'Value (Rs)' },
    ];
    const headers = ['Particulars'];
    subCols.forEach((sub) => {
      (section.columns || []).forEach((col) => {
        headers.push(`${sub.label} ${col.label}`);
      });
    });
    const rows = (section.rows || []).map((row) => {
      const cells = [row.label];
      subCols.forEach((sub) => {
        (section.columns || []).forEach((col) => {
          cells.push(data[row.key]?.[sub.key]?.[col.key] ?? '—');
        });
      });
      return cells;
    });
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        headers={headers}
        rows={rows}
      />
    );
  }

  if (section.type === 'cocoonStockTimePeriod') {
    const headers = ['Stage'];
    (section.metrics || []).forEach((metric) => {
      (section.columns || []).forEach((col) => {
        const label = col.key === 'dm' && section.dmLabel ? `D.M (${section.dmLabel})` : col.label;
        headers.push(`${metric.label} ${label}`);
      });
    });
    const rows = (section.rows || []).map((row) => {
      const cells = [row.label];
      (section.metrics || []).forEach((metric) => {
        (section.columns || []).forEach((col) => {
          cells.push(data[row.key]?.[metric.key]?.[col.key] ?? '—');
        });
      });
      return cells;
    });
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        note="Closing Stock = Opening + Purchased − Reeled (per column)"
        headers={headers}
        rows={rows}
      />
    );
  }

  if (section.type === 'nscExpenditureTimePeriod') {
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        note="Total row = sum of all 7 line items per column (U.L.M, D.M, U.M)"
        headers={['Particulars', ...(section.columns || []).map((c) => c.label)]}
        rows={(section.rows || []).map((row) => [
          row.label,
          ...(section.columns || []).map((col) => data[row.key]?.[col.key] ?? '—'),
        ])}
      />
    );
  }

  if (section.type === 'costDetailsPeriod') {
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        note="Enter D.M manually. U.L.M carried on submit. U.M = U.L.M + D.M (cumulative index)."
        headers={['Particulars','U.L.M', 'D.M', 'U.M']}
        rows={(section.fields || []).map((field) => [
          field.label,
          data[field.key]?.ulm ?? '—',
          data[field.key]?.dm ?? '—',
          data[field.key]?.um ?? '—',
        ])}
      />
    );
  }

  if (section.type === 'costOfProductionPeriod') {
    return (
      <PrintTable
        key={section.id}
        title={section.title}
        headers={['Particulars', 'U.L.M', 'D.M', 'U.M']}
        rows={(section.rows || []).map((row) => {
          const rowData = data[row.key] || {};
          const label = row.unit ? `${row.label} (${row.unit})` : row.label;
          if (row.timePeriod || row.computed) {
            return [label, rowData.ulm ?? '—', rowData.dm ?? '—', rowData.um ?? '—'];
          }
          return [label, '—', rowData.dm ?? '—', rowData.um ?? '—'];
        })}
      />
    );
  }

  if (section.type === 'matrix') {
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
            {tab.sections.map((section) => renderSection(section, values))}
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
