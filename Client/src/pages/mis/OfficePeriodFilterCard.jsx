import {
  SUBORDINATE_OFFICES,
  REGIONS,
  MONTHS,
  FINANCIAL_YEARS,
} from './plantationConstants.js';

export default function OfficePeriodFilterCard({
  idPrefix,
  unitLabel = 'Unit: Nos',
  subordinateOffice,
  region,
  adOffice,
  financialYear,
  month,
  showRegionFields,
  showAdOfficeFields,
  adOfficeOptions,
  onSubordinateOfficeChange,
  onRegionChange,
  onAdOfficeChange,
  onFinancialYearChange,
  onMonthChange,
  showInfoBanner = true,
  financialYearOptions,
}) {
  const yearOptions = financialYearOptions ?? FINANCIAL_YEARS;
  return (
    <div className="dfls-office-card">
      <div className="dfls-office-card-top">
        <h2>Office &amp; Period Details</h2>
        <span className="dfls-unit-badge">{unitLabel}</span>
      </div>

      <div className="plantation-filter-grid">
        <div className="plantation-filter-field">
          <label htmlFor={`${idPrefix}-subordinate-office`}>Subordinate Office</label>
          <select
            id={`${idPrefix}-subordinate-office`}
            className="plantation-select"
            value={subordinateOffice}
            onChange={(e) => onSubordinateOfficeChange(e.target.value)}
          >
            {SUBORDINATE_OFFICES.map((office) => (
              <option key={office} value={office}>{office}</option>
            ))}
          </select>
        </div>

        {showAdOfficeFields && !showRegionFields && (
          <div className="plantation-filter-field">
            <label htmlFor={`${idPrefix}-ad-office`}>AD Office</label>
            <select
              id={`${idPrefix}-ad-office`}
              className="plantation-select"
              value={adOffice}
              onChange={(e) => onAdOfficeChange(e.target.value)}
            >
              {adOfficeOptions.map((office) => (
                <option key={office} value={office}>{office}</option>
              ))}
            </select>
          </div>
        )}

        {showRegionFields && (
          <>
            <div className="plantation-filter-field">
              <label htmlFor={`${idPrefix}-region`}>Region</label>
              <select
                id={`${idPrefix}-region`}
                className="plantation-select"
                value={region}
                onChange={(e) => onRegionChange(e.target.value)}
              >
                {REGIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="plantation-filter-field">
              <label htmlFor={`${idPrefix}-ad-office`}>AD Office</label>
              <select
                id={`${idPrefix}-ad-office`}
                className="plantation-select"
                value={adOffice}
                onChange={(e) => onAdOfficeChange(e.target.value)}
              >
                {adOfficeOptions.map((office) => (
                  <option key={office} value={office}>{office}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="plantation-filter-field">
          <label htmlFor={`${idPrefix}-financial-year`}>Financial Year</label>
          <select
            id={`${idPrefix}-financial-year`}
            className="plantation-select"
            value={financialYear}
            onChange={(e) => onFinancialYearChange(e.target.value)}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="plantation-filter-field">
          <label htmlFor={`${idPrefix}-month`}>Month</label>
          <select
            id={`${idPrefix}-month`}
            className="plantation-select"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
          >
            {MONTHS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      {showInfoBanner && (
        <div className="dfls-info-banner">
          ULM (Up to Last Month) values are automatically carried forward and cannot be edited.
        </div>
      )}
    </div>
  );
}
