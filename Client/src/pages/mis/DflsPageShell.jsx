import OfficePeriodFilterCard from './OfficePeriodFilterCard.jsx';
import { useOfficePeriodFilters } from './useOfficePeriodFilters.js';

export default function DflsPageShell({
  pageKey,
  idPrefix,
  unitLabel = 'Unit: Nos',
  showInfoBanner = true,
  persistOptions,
  children,
}) {
  const filters = useOfficePeriodFilters(pageKey, persistOptions);

  return (
    <div className="dfls-distribution-view plantation-scheme-view plantation-scheme-friendly">
      <OfficePeriodFilterCard
        idPrefix={idPrefix}
        unitLabel={unitLabel}
        showInfoBanner={showInfoBanner}
        subordinateOffice={filters.subordinateOffice}
        region={filters.region}
        adOffice={filters.adOffice}
        financialYear={filters.financialYear}
        month={filters.month}
        showRegionFields={filters.showRegionFields}
        showAdOfficeFields={filters.showAdOfficeFields}
        adOfficeOptions={filters.adOfficeOptions}
        onSubordinateOfficeChange={filters.handleSubordinateOfficeChange}
        onRegionChange={filters.handleRegionChange}
        onAdOfficeChange={filters.setAdOffice}
        onFinancialYearChange={filters.setFinancialYear}
        onMonthChange={filters.setMonth}
      />
      {children}
    </div>
  );
}
