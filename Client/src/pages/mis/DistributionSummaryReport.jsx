import { FileText, Download, Printer } from 'lucide-react';
import {
  DISTRIBUTION_CATEGORIES,
  computeUmValue,
  sumNos,
} from './distributionConstants.js';

export default function DistributionSummaryReport({
  targetData,
  ulmData,
  dmData,
  meta,
  submitted = false,
  live = false,
}) {
  const rows = DISTRIBUTION_CATEGORIES.map((category) => {
    const um = computeUmValue(ulmData[category], dmData[category]);
    return {
      category,
      target: targetData[category],
      ulm: ulmData[category],
      dm: { nos: Number(dmData[category].nos) || 0 },
      um,
    };
  });

  const targetTotal = sumNos(targetData);
  const ulmTotal = sumNos(ulmData);
  const dmTotal = sumNos(
    Object.fromEntries(
      DISTRIBUTION_CATEGORIES.map((cat) => [
        cat,
        { nos: Number(dmData[cat].nos) || 0 },
      ])
    )
  );
  const umTotal = sumNos(
    Object.fromEntries(
      DISTRIBUTION_CATEGORIES.map((cat) => [
        cat,
        computeUmValue(ulmData[cat], dmData[cat]),
      ])
    )
  );

  return (
    <div className="plantation-report-card">
      <div className="plantation-report-header">
        <div>
          <h2>
            <FileText size={20} />
            Distribution — Summary Report
          </h2>
          <p className="plantation-report-meta">
            {meta.subordinateOffice}
            {meta.region ? ` · ${meta.region}` : ''}
            {meta.adOffice ? ` · ${meta.adOffice}` : ''}
            {' · '}{meta.financialYear} · {meta.month}
            {live && !submitted && (
              <span className="plantation-report-live-tag"> · Live</span>
            )}
            {submitted && (
              <span className="plantation-report-submitted-tag"> · Submitted</span>
            )}
          </p>
        </div>
        <div className="plantation-report-actions">
          <button type="button" className="plantation-report-btn" onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </button>
          <button type="button" className="plantation-report-btn plantation-report-btn-primary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="plantation-report-table-wrap">
        <table className="plantation-report-table">
          <thead>
            <tr>
              <th rowSpan={2}>Category</th>
              <th colSpan={1}>Target</th>
              <th colSpan={1}>ULM</th>
              <th colSpan={1}>DM</th>
              <th colSpan={1}>UM</th>
            </tr>
            <tr>
              <th>Nos</th>
              <th>Nos</th>
              <th>Nos</th>
              <th>Nos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <td>{row.category}</td>
                <td>{row.target.nos}</td>
                <td>{row.ulm.nos}</td>
                <td>{row.dm.nos}</td>
                <td className="plantation-report-um">{row.um.nos}</td>
              </tr>
            ))}
            <tr className="plantation-report-total-row">
              <td>Grand Total</td>
              <td>{targetTotal}</td>
              <td>{ulmTotal}</td>
              <td>{dmTotal}</td>
              <td>{umTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="plantation-report-note">
        Report updates automatically as you enter DM values. UM = ULM + DM. Unit: Nos.
      </p>
    </div>
  );
}
