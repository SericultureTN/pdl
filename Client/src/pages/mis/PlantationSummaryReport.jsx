import { FileText, Download, Printer } from 'lucide-react';
import {
  PLANTATION_CATEGORIES,
  computeUmValue,
  sumAcreFarmer,
} from './plantationConstants.js';

export default function PlantationSummaryReport({
  targetData,
  ulmData,
  dmData,
  meta,
  submitted = false,
  live = false,
  schemeTitle = 'Plantation Scheme 2024-25',
}) {
  const rows = PLANTATION_CATEGORIES.map((category) => {
    const um = computeUmValue(ulmData[category], dmData[category]);
    return {
      category,
      target: targetData[category],
      ulm: ulmData[category],
      dm: {
        acre: Number(dmData[category].acre) || 0,
        farmer: Number(dmData[category].farmer) || 0,
      },
      um,
    };
  });

  const targetTotal = sumAcreFarmer(targetData);
  const ulmTotal = sumAcreFarmer(ulmData);
  const dmTotal = sumAcreFarmer(
    Object.fromEntries(
      PLANTATION_CATEGORIES.map((cat) => [
        cat,
        {
          acre: Number(dmData[cat].acre) || 0,
          farmer: Number(dmData[cat].farmer) || 0,
        },
      ])
    )
  );
  const umTotal = sumAcreFarmer(
    Object.fromEntries(
      PLANTATION_CATEGORIES.map((cat) => [
        cat,
        computeUmValue(ulmData[cat], dmData[cat]),
      ])
    )
  );

  const handlePrint = () => window.print();

  return (
    <div className="plantation-report-card">
      <div className="plantation-report-header">
        <div>
          <h2>
            <FileText size={20} />
            {schemeTitle} — Summary Report
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
          <button type="button" className="plantation-report-btn" onClick={handlePrint}>
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
              <th colSpan={2}>Annual Target</th>
              <th colSpan={2}>Up to Last Month</th>
              <th colSpan={2}>This Month</th>
              <th colSpan={2}>Total Up to This Month</th>
            </tr>
            <tr>
              <th>Acres</th>
              <th>Farmers</th>
              <th>Acres</th>
              <th>Farmers</th>
              <th>Acres</th>
              <th>Farmers</th>
              <th>Acres</th>
              <th>Farmers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <td>{row.category}</td>
                <td>{row.target.acre}</td>
                <td>{row.target.farmer}</td>
                <td>{row.ulm.acre}</td>
                <td>{row.ulm.farmer}</td>
                <td>{row.dm.acre}</td>
                <td>{row.dm.farmer}</td>
                <td className="plantation-report-um">{row.um.acre}</td>
                <td className="plantation-report-um">{row.um.farmer}</td>
              </tr>
            ))}
            <tr className="plantation-report-total-row">
              <td>Grand Total</td>
              <td>{targetTotal.acre}</td>
              <td>{targetTotal.farmer}</td>
              <td>{ulmTotal.acre}</td>
              <td>{ulmTotal.farmer}</td>
              <td>{dmTotal.acre}</td>
              <td>{dmTotal.farmer}</td>
              <td>{umTotal.acre}</td>
              <td>{umTotal.farmer}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="plantation-report-note">
        Report updates automatically as you enter DM values. UM = ULM + DM.
      </p>
    </div>
  );
}
