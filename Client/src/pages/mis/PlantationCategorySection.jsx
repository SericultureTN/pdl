import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function FieldPair({ label, acre, farmer, readOnly, onChange, autoLabel, isDmField = false, isUpdated = false }) {
  return (
    <div className={`plantation-field-group ${isDmField && isUpdated ? 'plantation-dm-field-updated' : ''}`}>
      <div className="plantation-field-group-title">
        {label}
        {isDmField && isUpdated && <span className="plantation-dm-field-tag">Updated</span>}
      </div>
      <div className="plantation-field-row">
        <div className="plantation-field">
          <span className="plantation-field-label">Acre</span>
          {readOnly ? (
            <span className={`plantation-field-value ${isUpdated && autoLabel ? 'plantation-um-value-updated' : ''}`}>
              {autoLabel ? autoLabel.acre : (acre ?? 0)}
            </span>
          ) : (
            <input
              type="number"
              className={`plantation-input ${isDmField ? 'plantation-input-dm' : ''}`}
              value={acre ?? ''}
              onChange={(e) => onChange?.('acre', e.target.value)}
              min="0"
              step="any"
            />
          )}
        </div>
        <div className="plantation-field">
          <span className="plantation-field-label">Farmer</span>
          {readOnly ? (
            <span className={`plantation-field-value ${isUpdated && autoLabel ? 'plantation-um-value-updated' : ''}`}>
              {autoLabel ? autoLabel.farmer : (farmer ?? 0)}
            </span>
          ) : (
            <input
              type="number"
              className={`plantation-input ${isDmField ? 'plantation-input-dm' : ''}`}
              value={farmer ?? ''}
              onChange={(e) => onChange?.('farmer', e.target.value)}
              min="0"
              step="1"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlantationCategorySection({
  title,
  target,
  ulm,
  dm,
  um,
  columnType,
  defaultOpen = true,
  onDmChange,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const showTarget = true;
  const showUlm = columnType === 'ulm' || columnType === 'dm' || columnType === 'um';
  const showDm = columnType === 'dm';
  const showUm = columnType === 'um';

  const categoryDmUpdated =
    (dm.acre !== '' && dm.acre != null) || (dm.farmer !== '' && dm.farmer != null);

  return (
    <div className={`plantation-category ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="plantation-category-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <ChevronDown size={16} className="plantation-category-chevron" />
        <span>{title}</span>
      </button>

      {open && (
        <div className="plantation-category-body">
          {showTarget && (
            <FieldPair
              label="Target"
              acre={target.acre}
              farmer={target.farmer}
              readOnly
            />
          )}

          {showUlm && columnType === 'ulm' && (
            <FieldPair label="ULM" acre={ulm.acre} farmer={ulm.farmer} readOnly />
          )}

          {columnType === 'dm' && (
            <>
              <FieldPair label="ULM" acre={ulm.acre} farmer={ulm.farmer} readOnly />
              <FieldPair
                label="DM"
                acre={dm.acre}
                farmer={dm.farmer}
                readOnly={false}
                isDmField
                isUpdated={categoryDmUpdated}
                onChange={(field, value) => onDmChange?.(field, value)}
              />
            </>
          )}

          {showUm && (
            <>
              <FieldPair label="ULM" acre={ulm.acre} farmer={ulm.farmer} readOnly />
              <FieldPair label="DM" acre={dm.acre} farmer={dm.farmer} readOnly />
              <FieldPair
                label="UM"
                readOnly
                autoLabel={um}
                isUpdated={categoryDmUpdated}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
