import { Lock, Calculator, PenLine } from 'lucide-react';
import { computeUmValue, DISTRIBUTION_CATEGORY_META } from './distributionConstants.js';

export default function DistributionCategoryCard({
  title,
  target,
  ulm,
  dm,
  onDmChange,
  index,
}) {
  const um = computeUmValue(ulm, dm);
  const meta = DISTRIBUTION_CATEGORY_META[title] || {};
  const accent = meta.accent || 'green';
  const hasEntry = dm.nos !== '' && dm.nos != null;

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
          <span className="plantation-card-target-value">{target.nos} Nos</span>
        </div>

        <div className="plantation-card-block plantation-card-block-ulm">
          <div className="plantation-card-block-head">
            <span className="plantation-card-block-tag">ULM</span>
            <span className="plantation-card-block-title">Up to Last Month</span>
            <Lock size={14} className="plantation-card-block-lock" />
          </div>
          <div className="distribution-nos-row">
            <span className="plantation-card-metric-value">{ulm.nos ?? 0}</span>
          </div>
        </div>

        <div className="plantation-card-block plantation-card-block-dm">
          <div className="plantation-card-block-head">
            <span className="plantation-card-block-tag">DM</span>
            <span className="plantation-card-block-title">During Month</span>
            <PenLine size={14} />
          </div>
          <div className="distribution-nos-row">
            <input
              type="number"
              className="plantation-card-metric-input distribution-nos-input"
              placeholder="0"
              value={dm.nos ?? ''}
              onChange={(e) => onDmChange?.('nos', e.target.value)}
              min="0"
              step="1"
            />
          </div>
        </div>

        <div className="plantation-card-block plantation-card-block-um">
          <div className="plantation-card-block-head">
            <span className="plantation-card-block-tag">UM</span>
            <span className="plantation-card-block-title">Up to Month</span>
            <Calculator size={14} />
          </div>
          <div className="distribution-nos-row">
            <span className="plantation-card-metric-value distribution-um-value">{um.nos}</span>
          </div>
          <p className="plantation-card-block-formula">UM = ULM + DM</p>
        </div>
      </div>
    </article>
  );
}
