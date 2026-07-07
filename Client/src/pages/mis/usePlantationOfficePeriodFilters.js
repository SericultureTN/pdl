import { useState, useMemo, useEffect, useRef } from 'react';
import {
  resolveAdOfficeForFilter,
  getAdOfficesForFilter,
  usesRegionFilter,
  showsAdOfficeFilter,
  getDefaultAdOffice,
  getFinancialYearsForScheme,
  normalizeFilterDraft,
} from './plantationConstants.js';

const FILTER_STORAGE_PREFIX = 'pdl-mis-filters-plantation-';

function loadFilterPrefs(schemeId) {
  try {
    const raw = localStorage.getItem(`${FILTER_STORAGE_PREFIX}${schemeId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFilterPrefs(schemeId, data) {
  try {
    localStorage.setItem(`${FILTER_STORAGE_PREFIX}${schemeId}`, JSON.stringify(data));
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

export function usePlantationOfficePeriodFilters(scheme, { onFiltersChange } = {}) {
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;
  const lastEmittedKeyRef = useRef('');

  const [subordinateOffice, setSubordinateOffice] = useState('Extension');
  const [region, setRegion] = useState('Erode Region');
  const [adOffice, setAdOffice] = useState('AD Salem');
  const [financialYear, setFinancialYear] = useState(scheme.defaultFinancialYear);
  const [month, setMonth] = useState('July');
  const [ready, setReady] = useState(false);

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
    lastEmittedKeyRef.current = '';
    const saved = loadFilterPrefs(scheme.id);
    const data = normalizeFilterDraft(saved, scheme);

    const offices = getAdOfficesForFilter(data.subordinateOffice, data.region);
    const resolvedAdOffice = offices.includes(data.adOffice) ? data.adOffice : (offices[0] || data.adOffice);

    setSubordinateOffice(data.subordinateOffice);
    setRegion(data.region);
    setAdOffice(resolvedAdOffice);
    setFinancialYear(
      data.financialYear?.includes('2025') ? data.financialYear : scheme.defaultFinancialYear
    );
    setMonth(data.month === 'May' ? 'July' : data.month);
    setReady(true);
  }, [scheme.id, scheme.defaultFinancialYear]);

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
    saveFilterPrefs(scheme.id, payload);
    onFiltersChangeRef.current?.(payload);
  }, [
    ready,
    scheme.id,
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
    financialYearOptions,
    handleSubordinateOfficeChange,
    handleRegionChange,
  };
}
