import { Lock, Calculator } from 'lucide-react';
import { computeUmValue, PLANTATION_CATEGORY_META } from './plantationConstants.js';

function MetricRow({ label, acre, farmer, readOnly, onChange, isDm = false }) {
  return (
    <div className={`plantation-card-metric-row ${isDm ? 'is-dm' : ''}`}>
      <span className="plantation-card-metric-label">{label}</span>
      {readOnly ? (
        <span className="plantation-card-metric-value">{acre ?? 0}</span>
      ) : (
        <input
          type="number"
          className="plantation-card-metric-input"
          placeholder="0"
          value={acre ?? ''}
          onChange={(e) => onChange?.('acre', e.target.value)}
          min="0"
          step="any"
        />
      )}
      {readOnly ? (
        <span className="plantation-card-metric-value">{farmer ?? 0}</span>
      ) : (
        <input
          type="number"
          className="plantation-card-metric-input"
          placeholder="0"
          value={farmer ?? ''}
          onChange={(e) => onChange?.('farmer', e.target.value)}
          min="0"
          step="1"
        />
      )}
    </div>
  );
}

export default function PlantationCategoryCard({
  title,
  target,
  ulm,
  dm,
  onDmChange,
  index,
}) {
  const um = computeUmValue(ulm, dm);
  const meta = PLANTATION_CATEGORY_META[title] || {};
  const accent = meta.accent || 'green';
  const hasEntry =
    (dm.acre !== '' && dm.acre != null) || (dm.farmer !== '' && dm.farmer != null);

  return (
    <article
      className={`plantation-entry-card plantation-entry-card-${accent} ${hasEntry ? 'has-entry' : ''}`}
    >
      <header className="plantation-entry-card-header">
        <span className="plantation-entry-badge">{index + 1}</span>
        <div className="plantation-entry-card-titles">
          <h3>{title}</h3>
          {meta.description && <p>{meta.description}</p>}
        </div>
        {hasEntry && <span className="plantation-entry-status">Updated</span>}
      </header>

      <div className="plantation-entry-body">
        <div className="plantation-card-target">
          <span className="plantation-card-target-label">Target</span>
          <span className="plantation-card-target-value">
            {target.acre} Acre · {target.farmer} Farmer
          </span>
        </div>

        <div className="plantation-card-block plantation-card-block-ulm">
          <div className="plantation-card-block-head">
            <span className="plantation-card-block-tag">ULM</span>
            <span className="plantation-card-block-title">Up to Last Month</span>
            <Lock size={14} className="plantation-card-block-lock" />
          </div>
          <div className="plantation-card-block-cols">
            <span>Acre</span>
            <span>Farmer</span>
          </div>
          <MetricRow label="" acre={ulm.acre} farmer={ulm.farmer} readOnly />
        </div>

        <div className="plantation-card-block plantation-card-block-dm">
          <div className="plantation-card-block-head">
            <span className="plantation-card-block-tag">DM</span>
            <span className="plantation-card-block-title">During Month</span>
            {hasEntry && <span className="plantation-card-block-badge">Updated</span>}
          </div>
          <div className="plantation-card-block-cols">
            <span>Acre</span>
            <span>Farmer</span>
          </div>
          <MetricRow
            label=""
            acre={dm.acre}
            farmer={dm.farmer}
            readOnly={false}
            isDm
            onChange={onDmChange}
          />
        </div>

        <div className="plantation-card-block plantation-card-block-um">
          <div className="plantation-card-block-head">
            <span className="plantation-card-block-tag">UM</span>
            <span className="plantation-card-block-title">Up to Month</span>
            <Calculator size={14} />
          </div>
          <div className="plantation-card-block-cols">
            <span>Acre</span>
            <span>Farmer</span>
          </div>
          <MetricRow label="" acre={um.acre} farmer={um.farmer} readOnly />
          <p className="plantation-card-block-formula">UM = ULM + DM</p>
        </div>
      </div>
    </article>
  );
}
