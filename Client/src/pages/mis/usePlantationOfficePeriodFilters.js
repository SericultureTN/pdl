import { useState, useMemo, useEffect } from 'react';
import {
  resolveAdOfficeForFilter,
  getAdOfficesForFilter,
  usesRegionFilter,
  showsAdOfficeFilter,
  getDefaultAdOffice,
  getFinancialYearsForScheme,
  normalizeFilterDraft,
} from './plantationConstants.js';
import {
  loadPlantationDraft,
  savePlantationDraft,
} from './plantationStorage.js';

export function usePlantationOfficePeriodFilters(
  scheme,
  { dmData, setDmData, createInitialDmData, submitted, setSubmitted, onFilterChange } = {}
) {
  const [subordinateOffice, setSubordinateOffice] = useState('Extension');
  const [region, setRegion] = useState('Erode Region');
  const [adOffice, setAdOffice] = useState('AD Salem');
  const [financialYear, setFinancialYear] = useState(scheme.defaultFinancialYear);
  const [month, setMonth] = useState('May');
  const [storageReady, setStorageReady] = useState(false);

  const showRegionFields = usesRegionFilter(subordinateOffice);
  const showAdOfficeFields = showsAdOfficeFilter(subordinateOffice);
  const financialYearOptions = useMemo(
    () => getFinancialYearsForScheme(scheme.id),
    [scheme.id]
  );

  const adOfficeOptions = useMemo(
    () => getAdOfficesForFilter(subordinateOffice, region),
    [subordinateOffice, region]
  );

  useEffect(() => {
    if (!showAdOfficeFields || adOfficeOptions.length === 0) return;
    if (!adOfficeOptions.includes(adOffice)) {
      setAdOffice(adOfficeOptions[0]);
    }
  }, [showAdOfficeFields, adOfficeOptions, adOffice]);

  useEffect(() => {
    setStorageReady(false);
    const saved = loadPlantationDraft(scheme.id);
    const data = normalizeFilterDraft(saved, scheme);

    setSubordinateOffice(data.subordinateOffice);
    setRegion(data.region);
    setAdOffice(data.adOffice);
    setFinancialYear(data.financialYear);
    setMonth(data.month);
    if (setDmData && createInitialDmData) {
      setDmData(saved?.dmData || createInitialDmData());
    }
    if (setSubmitted) {
      setSubmitted(Boolean(saved?.submitted));
    }
    setStorageReady(true);
  }, [scheme.id, scheme.defaultFinancialYear, setDmData, createInitialDmData, setSubmitted]);

  useEffect(() => {
    if (!storageReady) return;
    const payload = {
      subordinateOffice,
      region,
      adOffice,
      financialYear,
      month,
    };
    if (dmData !== undefined) {
      payload.dmData = dmData;
    }
    if (submitted !== undefined) {
      payload.submitted = submitted;
    }
    savePlantationDraft(scheme.id, payload);
  }, [
    storageReady,
    scheme.id,
    subordinateOffice,
    region,
    adOffice,
    financialYear,
    month,
    dmData,
    submitted,
  ]);

  const notifyFilterChange = () => {
    onFilterChange?.();
  };

  const handleSubordinateOfficeChange = (nextOffice) => {
    setSubordinateOffice(nextOffice);
    if (usesRegionFilter(nextOffice)) {
      setRegion('Erode Region');
      setAdOffice(getDefaultAdOffice(nextOffice, 'Erode Region'));
    } else {
      setAdOffice(getDefaultAdOffice(nextOffice, region));
    }
    notifyFilterChange();
  };

  const handleRegionChange = (nextRegion) => {
    setRegion(nextRegion);
    setAdOffice(resolveAdOfficeForFilter(subordinateOffice, nextRegion, adOffice));
    notifyFilterChange();
  };

  const wrapSetter = (setter) => (value) => {
    setter(value);
    notifyFilterChange();
  };

  return {
    subordinateOffice,
    region,
    adOffice,
    financialYear,
    month,
    setAdOffice: wrapSetter(setAdOffice),
    setFinancialYear: wrapSetter(setFinancialYear),
    setMonth: wrapSetter(setMonth),
    showRegionFields,
    showAdOfficeFields,
    adOfficeOptions,
    financialYearOptions,
    handleSubordinateOfficeChange,
    handleRegionChange,
  };
}
