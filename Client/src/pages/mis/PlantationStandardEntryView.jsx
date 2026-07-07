import { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import PlantationPageShell from './PlantationPageShell.jsx';
import PlantationCategoryCard from './PlantationCategoryCard.jsx';
import {
  PLANTATION_CATEGORIES,
  createEmptyTargetData,
  createEmptyUlmData,
  createInitialDmData,
  hasDmValues,
  usesRegionFilter,
} from './plantationConstants.js';
import { usePlantationSchemeApiEntry } from './useMisApiEntry.js';

function countFilledCategories(dmData) {
  return PLANTATION_CATEGORIES.filter((cat) => {
    const d = dmData[cat];
    return (d.acre !== '' && d.acre != null) || (d.farmer !== '' && d.farmer != null);
  }).length;
}

export default function PlantationStandardEntryView({ scheme, idPrefix }) {
  const [filters, setFilters] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const apiEnabled = Boolean(
    filters &&
      usesRegionFilter(filters.subordinateOffice) &&
      filters.adOffice
  );

  const entry = usePlantationSchemeApiEntry({
    schemeId: scheme.id,
    uiCategories: PLANTATION_CATEGORIES,
    region: filters?.region,
    adOffice: filters?.adOffice,
    month: filters?.month,
    financialYear: filters?.financialYear,
    enabled: apiEnabled,
    createInitialDmData,
    createEmptyTargetData,
    createEmptyUlmData,
  });

  const filledCount = countFilledCategories(entry.dmData);
  const canSubmit = hasDmValues(entry.dmData) && !entry.saving && entry.dataReady;

  const handleDmChange = (category, field, value) => {
    entry.setDmData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
    setSubmitted(false);
    entry.setMessage('');
  };

  const handleClear = () => {
    entry.clearDm();
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      entry.setError('Please enter DM values in at least one category before submitting.');
      return;
    }
    const ok = await entry.submit();
    setSubmitted(ok);
  };

  const statusMessage = entry.error || entry.message;

  return (
    <PlantationPageShell
      scheme={scheme}
      idPrefix={idPrefix}
      onFiltersChange={setFilters}
    >
      {statusMessage && (
        <div className={`plantation-submit-message ${entry.message ? 'success' : 'error'}`}>
          {entry.message ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {statusMessage}
        </div>
      )}

      <div className={`dfls-entry-panel ${entry.dataReady ? 'is-ready' : 'is-loading'}`}>
        {!entry.dataReady && entry.loading && (
          <div className="dfls-entry-loading" aria-live="polite">
            <Loader2 size={22} className="animate-spin" />
            <span>Loading data from database…</span>
          </div>
        )}

        <div className="dfls-entry-content">
          <div className="plantation-master-card">
            <div className="plantation-master-card-header">
              <div>
                <h3>{scheme.reportTitle} — Data Entry</h3>
                <p>2.00 Acre · 1.00 Acre · SCSP · TSP — Unit: Acre &amp; Farmer · PostgreSQL</p>
              </div>
              <span className="plantation-master-card-badge">
                {filledCount} / {PLANTATION_CATEGORIES.length} filled
              </span>
            </div>

            <div className="plantation-master-card-body">
              <div className="plantation-four-cards">
                {PLANTATION_CATEGORIES.map((category, index) => (
                  <PlantationCategoryCard
                    key={category}
                    title={category}
                    index={index}
                    target={entry.targetData[category]}
                    ulm={entry.ulmData[category]}
                    dm={entry.dmData[category]}
                    onDmChange={(field, value) => handleDmChange(category, field, value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="dfls-actions plantation-bottom-actions">
            <button type="button" className="dfls-btn dfls-btn-reset" onClick={handleClear} disabled={entry.saving || !entry.dataReady}>
              Clear All Entries
            </button>
            <button
              type="button"
              className="dfls-btn dfls-btn-submit"
              onClick={handleSubmit}
              disabled={!canSubmit || entry.loading}
            >
              {entry.saving ? 'Saving…' : 'Submit to Database'}
            </button>
          </div>
        </div>
      </div>
    </PlantationPageShell>
  );
}
