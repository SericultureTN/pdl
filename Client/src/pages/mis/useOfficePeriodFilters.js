import { useState, useMemo, useEffect } from 'react';
import {
  resolveAdOfficeForFilter,
  getAdOfficesForFilter,
  usesRegionFilter,
  showsAdOfficeFilter,
  getDefaultAdOffice,
} from './plantationConstants.js';
import { normalizeDflsFilterDraft } from './dflsConstants.js';
import { loadDflsDraft, saveDflsDraft } from './dflsStorage.js';

export function useOfficePeriodFilters(pageKey, { dmData, setDmData, createInitialDmData } = {}) {
  const [subordinateOffice, setSubordinateOffice] = useState('Extension');
  const [region, setRegion] = useState('Erode Region');
  const [adOffice, setAdOffice] = useState('AD Salem');
  const [financialYear, setFinancialYear] = useState('2024–25');
  const [month, setMonth] = useState('May');
  const [storageReady, setStorageReady] = useState(false);

  const showRegionFields = usesRegionFilter(subordinateOffice);
  const showAdOfficeFields = showsAdOfficeFilter(subordinateOffice);

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
    const saved = loadDflsDraft(pageKey);
    const data = normalizeDflsFilterDraft(saved);

    setSubordinateOffice(data.subordinateOffice);
    setRegion(data.region);
    setAdOffice(data.adOffice);
    setFinancialYear(data.financialYear);
    setMonth(data.month);
    if (setDmData && createInitialDmData) {
      setDmData(saved?.dmData || createInitialDmData());
    }
    setStorageReady(true);
  }, [pageKey, setDmData, createInitialDmData]);

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
    saveDflsDraft(pageKey, payload);
  }, [
    storageReady,
    pageKey,
    subordinateOffice,
    region,
    adOffice,
    financialYear,
    month,
    dmData,
  ]);

  const handleSubordinateOfficeChange = (nextOffice) => {
    setSubordinateOffice(nextOffice);
    if (usesRegionFilter(nextOffice)) {
      setRegion('Erode Region');
      setAdOffice(getDefaultAdOffice(nextOffice, 'Erode Region'));
    } else {
      setAdOffice(getDefaultAdOffice(nextOffice, region));
    }
  };

  const handleRegionChange = (nextRegion) => {
    setRegion(nextRegion);
    setAdOffice(resolveAdOfficeForFilter(subordinateOffice, nextRegion, adOffice));
  };

  return {
    subordinateOffice,
    region,
    adOffice,
    financialYear,
    month,
    setAdOffice,
    setFinancialYear,
    setMonth,
    showRegionFields,
    showAdOfficeFields,
    adOfficeOptions,
    handleSubordinateOfficeChange,
    handleRegionChange,
  };
}
