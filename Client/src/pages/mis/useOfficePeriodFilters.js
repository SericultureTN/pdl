import { useState, useMemo, useEffect, useRef } from 'react';
import {
  resolveAdOfficeForFilter,
  getAdOfficesForFilter,
  usesRegionFilter,
  showsAdOfficeFilter,
  getDefaultAdOffice,
} from './plantationConstants.js';
import { normalizeDflsFilterDraft } from './dflsConstants.js';

const FILTER_STORAGE_PREFIX = 'pdl-mis-filters-dfls-';

function loadFilterPrefs(pageKey) {
  try {
    const raw = localStorage.getItem(`${FILTER_STORAGE_PREFIX}${pageKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFilterPrefs(pageKey, data) {
  try {
    localStorage.setItem(`${FILTER_STORAGE_PREFIX}${pageKey}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function buildFilterPayload(state) {
  return {
    subordinateOffice: state.subordinateOffice,
    region: state.region,
    adOffice: state.adOffice,
    financialYear: state.financialYear,
    month: state.month,
  };
}

export function useOfficePeriodFilters(pageKey, { onFiltersChange } = {}) {
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;
  const lastEmittedKeyRef = useRef('');

  const [subordinateOffice, setSubordinateOffice] = useState('Extension');
  const [region, setRegion] = useState('Erode Region');
  const [adOffice, setAdOffice] = useState('AD Salem');
  const [financialYear, setFinancialYear] = useState('2025–26');
  const [month, setMonth] = useState('July');
  const [ready, setReady] = useState(false);

  const showRegionFields = usesRegionFilter(subordinateOffice);
  const showAdOfficeFields = showsAdOfficeFilter(subordinateOffice);

  const adOfficeOptions = useMemo(
    () => getAdOfficesForFilter(subordinateOffice, region),
    [subordinateOffice, region]
  );

  useEffect(() => {
    lastEmittedKeyRef.current = '';
    const saved = loadFilterPrefs(pageKey);
    const data = normalizeDflsFilterDraft(saved);

    const offices = getAdOfficesForFilter(data.subordinateOffice, data.region);
    const resolvedAdOffice = offices.includes(data.adOffice) ? data.adOffice : (offices[0] || data.adOffice);

    setSubordinateOffice(data.subordinateOffice);
    setRegion(data.region);
    setAdOffice(resolvedAdOffice);
    setFinancialYear(data.financialYear?.includes('2025') ? data.financialYear : '2025–26');
    setMonth(data.month === 'May' ? 'July' : data.month);
    setReady(true);
  }, [pageKey]);

  useEffect(() => {
    if (!ready) return;

    if (showAdOfficeFields && adOfficeOptions.length > 0 && !adOfficeOptions.includes(adOffice)) {
      setAdOffice(adOfficeOptions[0]);
      return;
    }

    const payload = buildFilterPayload({
      subordinateOffice,
      region,
      adOffice,
      financialYear,
      month,
    });
    const payloadKey = JSON.stringify(payload);
    if (payloadKey === lastEmittedKeyRef.current) return;

    lastEmittedKeyRef.current = payloadKey;
    saveFilterPrefs(pageKey, payload);
    onFiltersChangeRef.current?.(payload);
  }, [
    ready,
    pageKey,
    subordinateOffice,
    region,
    adOffice,
    financialYear,
    month,
    showAdOfficeFields,
    adOfficeOptions,
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
