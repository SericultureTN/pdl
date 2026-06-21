import { Lock } from 'lucide-react';
import { PLANTATION_CATEGORIES, computeUmValue, sumAcreFarmer } from './plantationConstants.js';
import PlantationCategorySection from './PlantationCategorySection.jsx';

const COLUMN_CONFIG = {
  ulm: {
    headerClass: 'dfls-card-header-grey',
    title: 'ULM (Up to Last Month)',
    subtitle: 'Read Only',
    showLock: true,
  },
  dm: {
    headerClass: 'dfls-card-header-orange',
    title: 'DM (During Month)',
    subtitle: 'Enter Current Month Data',
    showLock: false,
  },
  um: {
    headerClass: 'dfls-card-header-green',
    title: 'UM (Up to Month)',
    subtitle: 'Auto Calculated',
    showLock: false,
  },
};

export default function PlantationSchemeColumn({
  type,
  targetData,
  ulmData,
  dmData,
  onDmChange,
  dmUpdated = false,
}) {
  const config = COLUMN_CONFIG[type];

  const totals = type === 'ulm'
    ? sumAcreFarmer(ulmData)
    : type === 'dm'
      ? sumAcreFarmer(dmData)
      : sumAcreFarmer(
          Object.fromEntries(
            PLANTATION_CATEGORIES.map((cat) => [
              cat,
              computeUmValue(ulmData[cat], dmData[cat]),
            ])
          )
        );

  return (
    <div className={`dfls-column-card plantation-column-card ${type === 'um' && dmUpdated ? 'plantation-um-live' : ''}`}>
      <div className={`dfls-card-header ${config.headerClass}`}>
        <div>
          <h3>{config.title}</h3>
          <p>{config.subtitle}</p>
        </div>
        <div className="plantation-column-badges">
          {type === 'dm' && dmUpdated && (
            <span className="plantation-dm-badge">Updated</span>
          )}
          {type === 'um' && dmUpdated && (
            <span className="plantation-um-badge">Recalculated</span>
          )}
          {config.showLock && <Lock size={18} className="dfls-lock-icon" />}
        </div>
      </div>

      <div className="dfls-card-body plantation-card-body">
        {PLANTATION_CATEGORIES.map((category) => {
          const ulm = ulmData[category];
          const dm = dmData[category];
          const um = computeUmValue(ulm, dm);

          return (
            <PlantationCategorySection
              key={category}
              title={category}
              target={targetData[category]}
              ulm={ulm}
              dm={dm}
              um={um}
              columnType={type}
              defaultOpen
              onDmChange={(field, value) => onDmChange?.(category, field, value)}
            />
          );
        })}

        <div className="plantation-card-total">
          <div className="plantation-card-total-row">
            <span>Total Acre</span>
            <span>{totals.acre}</span>
          </div>
          <div className="plantation-card-total-row">
            <span>Total Farmer</span>
            <span>{totals.farmer}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
