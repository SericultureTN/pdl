import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PlantationPageShell from './PlantationPageShell.jsx';
import PlantationCategoryCard from './PlantationCategoryCard.jsx';
import {
  PLANTATION_CATEGORIES,
  createInitialTargetData,
  createInitialUlmData,
  createInitialDmData,
  hasDmValues,
} from './plantationConstants.js';
import { clearPlantationDraft } from './plantationStorage.js';

function countFilledCategories(dmData) {
  return PLANTATION_CATEGORIES.filter((cat) => {
    const d = dmData[cat];
    return (d.acre !== '' && d.acre != null) || (d.farmer !== '' && d.farmer != null);
  }).length;
}

export default function PlantationStandardEntryView({ scheme, idPrefix }) {
  const [targetData] = useState(createInitialTargetData);
  const [ulmData] = useState(createInitialUlmData);
  const [dmData, setDmData] = useState(createInitialDmData);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const filledCount = countFilledCategories(dmData);
  const canSubmit = hasDmValues(dmData);

  const resetSubmitState = () => {
    setSubmitted(false);
    setSubmitMessage('');
  };

  const handleDmChange = (category, field, value) => {
    setDmData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
    resetSubmitState();
  };

  const handleClear = () => {
    clearPlantationDraft(scheme.id);
    setDmData(createInitialDmData());
    resetSubmitState();
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      setSubmitMessage('Please enter DM values in at least one category before submitting.');
      return;
    }
    setSubmitted(true);
    setSubmitMessage('Data submitted successfully.');
  };

  return (
    <PlantationPageShell
      scheme={scheme}
      idPrefix={idPrefix}
      persistOptions={{
        dmData,
        setDmData,
        createInitialDmData,
        submitted,
        setSubmitted,
        onFilterChange: resetSubmitState,
      }}
    >
      <div className="plantation-master-card">
        <div className="plantation-master-card-header">
          <div>
            <h3>{scheme.reportTitle} — Data Entry</h3>
            <p>2.00 Acre · 1.00 Acre · SCSP · TSP — Unit: Acre &amp; Farmer</p>
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
                target={targetData[category]}
                ulm={ulmData[category]}
                dm={dmData[category]}
                onDmChange={(field, value) => handleDmChange(category, field, value)}
              />
            ))}
          </div>
        </div>
      </div>

      {submitMessage && (
        <div className={`plantation-submit-message ${submitted ? 'success' : 'error'}`}>
          {submitted && <CheckCircle2 size={16} />}
          {submitMessage}
        </div>
      )}

      <div className="dfls-actions plantation-bottom-actions">
        <button type="button" className="dfls-btn dfls-btn-reset" onClick={handleClear}>
          Clear All Entries
        </button>
        <button type="button" className="dfls-btn dfls-btn-submit" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </PlantationPageShell>
  );
}
