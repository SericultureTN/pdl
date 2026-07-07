import { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import DataEntryColumn from './DataEntryColumn.jsx';
import DflsPageShell from './DflsPageShell.jsx';
import { createInitialDmData, createEmptyUlmData } from './dflsConstants.js';
import { usesRegionFilter } from './plantationConstants.js';
import { useDflsApiEntry } from './useMisApiEntry.js';

function DflsThreeColumnDataEntry({ ulmData, dmData, onDmChange, onReset, onSubmit, saving, loading, dataReady }) {
  return (
    <div className={`dfls-entry-panel ${dataReady ? 'is-ready' : 'is-loading'}`}>
      {!dataReady && loading && (
        <div className="dfls-entry-loading" aria-live="polite">
          <Loader2 size={22} className="animate-spin" />
          <span>Loading data from database…</span>
        </div>
      )}

      <div className="dfls-entry-content">
        <div className="dfls-three-columns">
          <DataEntryColumn type="ulm" ulmData={ulmData} dmData={dmData} />
          <DataEntryColumn type="dm" ulmData={ulmData} dmData={dmData} onDmChange={onDmChange} />
          <DataEntryColumn type="um" ulmData={ulmData} dmData={dmData} />
        </div>

        <div className="dfls-formula-note">
          UM (Up to Month) values are auto calculated as: <strong>UM = ULM + DM</strong>
        </div>

        <div className="dfls-actions">
          <button type="button" className="dfls-btn dfls-btn-reset" onClick={onReset} disabled={saving || !dataReady}>
            Reset
          </button>
          <button type="button" className="dfls-btn dfls-btn-submit" onClick={onSubmit} disabled={saving || loading || !dataReady}>
            {saving ? 'Saving…' : 'Submit to Database'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DflsStandardEntryView({
  pageKey,
  idPrefix,
  unitLabel = 'Unit: Nos',
}) {
  const [filters, setFilters] = useState(null);

  const apiEnabled = Boolean(
    filters &&
      usesRegionFilter(filters.subordinateOffice) &&
      filters.adOffice
  );

  const entry = useDflsApiEntry({
    pageKey,
    region: filters?.region,
    adOffice: filters?.adOffice,
    month: filters?.month,
    financialYear: filters?.financialYear,
    enabled: apiEnabled,
    createInitialDmData,
    createEmptyUlmData,
  });

  const handleDmChange = (section, key, value) => {
    entry.setDmData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const statusMessage = entry.error || entry.message;

  return (
    <DflsPageShell
      pageKey={pageKey}
      idPrefix={idPrefix}
      unitLabel={unitLabel}
      onFiltersChange={setFilters}
    >
      {statusMessage && (
        <div className={`plantation-submit-message ${entry.message ? 'success' : 'error'}`}>
          {entry.message ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {statusMessage}
        </div>
      )}

      <DflsThreeColumnDataEntry
        ulmData={entry.ulmData}
        dmData={entry.dmData}
        onDmChange={handleDmChange}
        onReset={entry.resetDm}
        onSubmit={entry.submit}
        saving={entry.saving}
        loading={entry.loading}
        dataReady={entry.dataReady}
      />
    </DflsPageShell>
  );
}
