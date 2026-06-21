import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  SUBORDINATE_OFFICES,
  REGIONS,
  AD_OFFICES_BY_REGION,
  FINANCIAL_YEARS,
  MONTHS,
  DISTRIBUTION_CATEGORIES,
  createInitialTargetData,
  createInitialUlmData,
  createInitialDmData,
  hasDmValues,
} from './distributionConstants.js';
import {
  loadDistributionDraft,
  saveDistributionDraft,
  clearDistributionDraft,
  createDefaultDraft,
} from './distributionStorage.js';
import DistributionCategoryCard from './DistributionCategoryCard.jsx';
import DistributionSummaryReport from './DistributionSummaryReport.jsx';

function countFilledCategories(dmData) {
  return DISTRIBUTION_CATEGORIES.filter((cat) => {
    const d = dmData[cat];
    return d.nos !== '' && d.nos != null;
  }).length;
}

function applyDraftToState(draft, setters) {
  const defaults = createDefaultDraft();
  const data = draft ? { ...defaults, ...draft } : defaults;

  setters.setSubordinateOffice(data.subordinateOffice);
  setters.setRegion(data.region);
  setters.setAdOffice(data.adOffice);
  setters.setFinancialYear(data.financialYear);
  setters.setMonth(data.month);
  setters.setDmData(data.dmData || createInitialDmData());
  setters.setSubmitted(Boolean(data.submitted));
  setters.setSubmitMessage('');
}

export default function DistributionView() {
  const [subordinateOffice, setSubordinateOffice] = useState('Extension');
  const [region, setRegion] = useState('Erode Region');
  const [adOffice, setAdOffice] = useState('AD Salem');
  const [financialYear, setFinancialYear] = useState('2024–25');
  const [month, setMonth] = useState('May');

  const [targetData] = useState(createInitialTargetData);
  const [ulmData] = useState(createInitialUlmData);
  const [dmData, setDmData] = useState(createInitialDmData);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [storageReady, setStorageReady] = useState(false);

  const showRegionFields = subordinateOffice === 'Extension';
  const filledCount = countFilledCategories(dmData);
  const canSubmit = hasDmValues(dmData);

  const adOfficeOptions = useMemo(
    () => AD_OFFICES_BY_REGION[region] || [],
    [region]
  );

  const reportMeta = {
    subordinateOffice,
    region: showRegionFields ? region : null,
    adOffice: showRegionFields ? adOffice : null,
    financialYear,
    month,
  };

  useEffect(() => {
    setStorageReady(false);
    const saved = loadDistributionDraft();
    applyDraftToState(saved, {
      setSubordinateOffice,
      setRegion,
      setAdOffice,
      setFinancialYear,
      setMonth,
      setDmData,
      setSubmitted,
      setSubmitMessage,
    });
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveDistributionDraft({
      subordinateOffice,
      region,
      adOffice,
      financialYear,
      month,
      dmData,
      submitted,
    });
  }, [
    storageReady,
    subordinateOffice,
    region,
    adOffice,
    financialYear,
    month,
    dmData,
    submitted,
  ]);

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
    clearDistributionDraft();
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
    <div className="dfls-distribution-view plantation-scheme-view plantation-scheme-friendly">
      <div className="dfls-office-card">
        <div className="dfls-office-card-top">
          <h2>Office &amp; Period Details</h2>
          <span className="dfls-unit-badge">Unit: Nos</span>
        </div>

        <div className="plantation-filter-grid">
          <div className="plantation-filter-field">
            <label htmlFor="dist-subordinate-office">Subordinate Office</label>
            <select
              id="dist-subordinate-office"
              className="plantation-select"
              value={subordinateOffice}
              onChange={(e) => {
                setSubordinateOffice(e.target.value);
                if (e.target.value === 'Extension') {
                  setRegion('Erode Region');
                  setAdOffice('AD Salem');
                }
                resetSubmitState();
              }}
            >
              {SUBORDINATE_OFFICES.map((office) => (
                <option key={office} value={office}>{office}</option>
              ))}
            </select>
          </div>

          {showRegionFields && (
            <>
              <div className="plantation-filter-field">
                <label htmlFor="dist-region">Region</label>
                <select
                  id="dist-region"
                  className="plantation-select"
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setAdOffice(AD_OFFICES_BY_REGION[e.target.value]?.[0] || '');
                    resetSubmitState();
                  }}
                >
                  {REGIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="plantation-filter-field">
                <label htmlFor="dist-ad-office">AD Office</label>
                <select
                  id="dist-ad-office"
                  className="plantation-select"
                  value={adOffice}
                  onChange={(e) => { setAdOffice(e.target.value); resetSubmitState(); }}
                >
                  {adOfficeOptions.map((office) => (
                    <option key={office} value={office}>{office}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="plantation-filter-field">
            <label htmlFor="dist-financial-year">Financial Year</label>
            <select
              id="dist-financial-year"
              className="plantation-select"
              value={financialYear}
              onChange={(e) => { setFinancialYear(e.target.value); resetSubmitState(); }}
            >
              {FINANCIAL_YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="plantation-filter-field">
            <label htmlFor="dist-month">Month</label>
            <select
              id="dist-month"
              className="plantation-select"
              value={month}
              onChange={(e) => { setMonth(e.target.value); resetSubmitState(); }}
            >
              {MONTHS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="plantation-master-card">
        <div className="plantation-master-card-header">
          <div>
            <h3>Distribution — Data Entry</h3>
            <p>Chawkie · Disinfectant · Nursery · Support — Unit: Nos</p>
          </div>
          <span className="plantation-master-card-badge">
            {filledCount} / {DISTRIBUTION_CATEGORIES.length} filled
          </span>
        </div>

        <div className="plantation-master-card-body">
          <div className="plantation-four-cards">
            {DISTRIBUTION_CATEGORIES.map((category, index) => (
              <DistributionCategoryCard
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

      <DistributionSummaryReport
        targetData={targetData}
        ulmData={ulmData}
        dmData={dmData}
        meta={reportMeta}
        submitted={submitted}
        live
      />

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
    </div>
  );
}
