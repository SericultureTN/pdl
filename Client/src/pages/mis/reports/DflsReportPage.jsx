import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MIS_REPORT_ITEMS } from '../misNavConfig.js';
import { getDflsEntryReport, DFLS_BV_ROWS, DFLS_CB_ROWS } from './entryReportData.js';

const PAGE_KEY_BY_PATH = {
  'dfls-distribution': 'distribution',
  'dfls-consumption': 'consumption',
  'cocoon-production': 'cocoon-production',
};

function num(value) {
  return Number(value) || 0;
}

function SectionTable({ title, rows, ulm, dm, um, singleValue = false }) {
  const ulmTotal = singleValue ? num(ulm.value) : rows.reduce((t, r) => t + num(ulm[r]), 0);
  const dmTotal = singleValue ? num(dm.value) : rows.reduce((t, r) => t + num(dm[r]), 0);
  const umTotal = singleValue ? num(um.value) : rows.reduce((t, r) => t + num(um[r]), 0);

  return (
    <div className="dfls-section">
      <div className="dfls-section-title">{title}</div>
      <table className="dfls-table mis-report-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>ULM</th>
            <th>DM</th>
            <th>UM</th>
          </tr>
        </thead>
        <tbody>
          {singleValue ? (
            <tr>
              <td>Value</td>
              <td>{num(ulm.value)}</td>
              <td>{num(dm.value)}</td>
              <td className="mis-report-um-cell">{num(um.value)}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row}>
                <td>{row}</td>
                <td>{num(ulm[row])}</td>
                <td>{num(dm[row])}</td>
                <td className="mis-report-um-cell">{num(um[row])}</td>
              </tr>
            ))
          )}
          <tr className="dfls-total-row">
            <td>Total</td>
            <td>{ulmTotal}</td>
            <td>{dmTotal}</td>
            <td>{umTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function DflsReportPage() {
  const { pathname } = useLocation();
  const reportSegment = pathname.split('/').pop();
  const pageKey = PAGE_KEY_BY_PATH[reportSegment];
  const meta = MIS_REPORT_ITEMS.find((item) => item.path === `reports/${reportSegment}`);

  const report = useMemo(
    () => (pageKey ? getDflsEntryReport(pageKey) : null),
    [pageKey, pathname]
  );

  if (!report || !meta) {
    return null;
  }

  const { filters, ulmData, dmData, umData, ulmTotal, dmTotal, umTotal, hasEntry } = report;
  const unitLabel = pageKey === 'cocoon-production' ? 'Kgs' : 'Nos';

  return (
    <div className="dfls-distribution-view mis-report-page">
      <div className="dfls-office-card">
        <div className="dfls-office-card-top">
          <h2>{meta.title}</h2>
          <span className={`dfls-unit-badge ${hasEntry ? 'mis-report-live-badge' : ''}`}>
            {hasEntry ? 'Live from Data Entry' : 'No entry yet'}
          </span>
        </div>

        <div className="mis-report-meta-grid">
          <div><label>Subordinate Office</label><span>{filters.subordinateOffice}</span></div>
          <div><label>Region</label><span>{filters.region}</span></div>
          <div><label>AD Office</label><span>{filters.adOffice}</span></div>
          <div><label>Financial Year</label><span>{filters.financialYear}</span></div>
          <div><label>Month</label><span>{filters.month}</span></div>
          <div><label>Unit</label><span>{unitLabel}</span></div>
        </div>
      </div>

      {!hasEntry && (
        <div className="dfls-info-banner mis-report-empty-banner">
          No data entered yet. Fill in the DM column on the Data Entry page and return here to view the report.
        </div>
      )}

      <div className="dfls-column-card mis-report-summary-card">
        <div className="dfls-card-header dfls-card-header-green">
          <div>
            <h3>Summary — ULM / DM / UM</h3>
            <p>Unit: {unitLabel}</p>
          </div>
        </div>
        <div className="dfls-card-body mis-report-kpi-row">
          <div><span>ULM Total</span><strong>{ulmTotal}</strong></div>
          <div><span>DM Total</span><strong>{dmTotal}</strong></div>
          <div><span>UM Total</span><strong>{umTotal}</strong></div>
        </div>
      </div>

      <div className="mis-report-sections-grid">
        <SectionTable title="BV" rows={DFLS_BV_ROWS} ulm={ulmData.bv} dm={dmData.bv} um={umData.bv} />
        <SectionTable title="CB" rows={DFLS_CB_ROWS} ulm={ulmData.cb} dm={dmData.cb} um={umData.cb} />
        <SectionTable title="P1" ulm={ulmData.p1} dm={dmData.p1} um={umData.p1} singleValue />
      </div>

      <div className="dfls-formula-note">
        UM (Up to Month) values are calculated as: <strong>UM = ULM + DM</strong>
      </div>
    </div>
  );
}
