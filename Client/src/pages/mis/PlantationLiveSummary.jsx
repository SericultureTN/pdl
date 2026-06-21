import { PLANTATION_CATEGORIES, computeUmValue, sumAcreFarmer } from './plantationConstants.js';

export default function PlantationLiveSummary({ targetData, ulmData, dmData, filledCount }) {
  const dmNormalized = Object.fromEntries(
    PLANTATION_CATEGORIES.map((cat) => [
      cat,
      {
        acre: Number(dmData[cat].acre) || 0,
        farmer: Number(dmData[cat].farmer) || 0,
      },
    ])
  );

  const umData = Object.fromEntries(
    PLANTATION_CATEGORIES.map((cat) => [
      cat,
      computeUmValue(ulmData[cat], dmData[cat]),
    ])
  );

  const rows = [
    { label: 'Annual Target', data: sumAcreFarmer(targetData), tone: 'neutral' },
    { label: 'Up to Last Month', data: sumAcreFarmer(ulmData), tone: 'muted' },
    { label: 'This Month (Entered)', data: sumAcreFarmer(dmNormalized), tone: 'accent' },
    { label: 'Total Up to This Month', data: sumAcreFarmer(umData), tone: 'success' },
  ];

  return (
    <div className="plantation-live-summary">
      <div className="plantation-live-summary-top">
        <h3>Quick Summary</h3>
        <span className="plantation-live-progress">
          {filledCount} of {PLANTATION_CATEGORIES.length} categories filled
        </span>
      </div>
      <div className="plantation-live-summary-grid">
        {rows.map((row) => (
          <div key={row.label} className={`plantation-live-summary-item tone-${row.tone}`}>
            <span className="plantation-live-summary-label">{row.label}</span>
            <span className="plantation-live-summary-value">
              {row.data.acre} <small>acres</small>
            </span>
            <span className="plantation-live-summary-value">
              {row.data.farmer} <small>farmers</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
