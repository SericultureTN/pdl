import OfficePeriodFilterCard from './OfficePeriodFilterCard.jsx';
import { usePlantationOfficePeriodFilters } from './usePlantationOfficePeriodFilters.js';

export default function PlantationPageShell({
  scheme,
  idPrefix,
  unitLabel = 'Unit: Acres & Farmers',
  persistOptions,
  children,
}) {
  const filters = usePlantationOfficePeriodFilters(scheme, persistOptions);

  return (
    <div className="dfls-distribution-view plantation-scheme-view plantation-scheme-friendly">
      <OfficePeriodFilterCard
        idPrefix={idPrefix}
        unitLabel={unitLabel}
        showInfoBanner={false}
        financialYearOptions={filters.financialYearOptions}
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
