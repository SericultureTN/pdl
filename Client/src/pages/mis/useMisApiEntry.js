import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadPlantationSchemeEntry,
  savePlantationSchemeEntry,
  loadDflsEntry,
  saveDflsEntry,
  getApiErrorMessage,
  normalizeFinancialYear,
} from '../../services/misDataEntry';

function useLatestRef(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/** Run effect after delay; only re-schedule when `deps` change (not when effect fn identity changes). */
function useDebouncedEffect(effect, deps, delay = 300) {
  const requestId = useRef(0);
  const effectRef = useLatestRef(effect);

  useEffect(() => {
    const timer = setTimeout(() => {
      const id = ++requestId.current;
      effectRef.current(id, () => id === requestId.current);
    }, delay);
    return () => clearTimeout(timer);
  }, deps);
}

function buildFilterKey({ enabled, pageKey, schemeId, region, adOffice, month, financialYear }) {
  if (!enabled || !region || !adOffice || !month || !financialYear) return '';
  const scope = pageKey || schemeId || '';
  const year = normalizeFinancialYear(financialYear);
  return `${scope}|${region}|${adOffice}|${month}|${year}`;
}

export function usePlantationSchemeApiEntry({
  schemeId,
  uiCategories,
  region,
  adOffice,
  month,
  financialYear,
  enabled,
  createInitialDmData,
  createEmptyTargetData,
  createEmptyUlmData,
}) {
  const [targetData, setTargetData] = useState(() => createEmptyTargetData());
  const [ulmData, setUlmData] = useState(() => createEmptyUlmData());
  const [dmData, setDmData] = useState(() => createInitialDmData());
  const [adOfficeId, setAdOfficeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const createInitialDmDataRef = useLatestRef(createInitialDmData);
  const createEmptyTargetDataRef = useLatestRef(createEmptyTargetData);
  const createEmptyUlmDataRef = useLatestRef(createEmptyUlmData);
  const loadedKeyRef = useRef('');
  const abortRef = useRef(null);

  const filterKey = buildFilterKey({
    enabled,
    schemeId,
    region,
    adOffice,
    month,
    financialYear,
  });

  useEffect(() => {
    if (!filterKey) {
      setDataReady(false);
      return;
    }
    if (loadedKeyRef.current !== filterKey) {
      setDataReady(false);
    }
  }, [filterKey]);

  const loadNow = useCallback(
    async (isCurrent = () => true) => {
      if (!enabled || !region || !adOffice || !month || !financialYear) {
        setLoading(false);
        setDataReady(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const currentKey = buildFilterKey({
        enabled,
        schemeId,
        region,
        adOffice,
        month,
        financialYear,
      });
      const showLoading = loadedKeyRef.current !== currentKey;
      if (showLoading) setLoading(true);
      setError('');

      try {
        const result = await loadPlantationSchemeEntry({
          schemeId,
          region,
          adOffice,
          month,
          financialYear,
          uiCategories,
        });
        if (!isCurrent() || controller.signal.aborted) return;
        setAdOfficeId(result.adOfficeId);
        setTargetData(result.targetData || createEmptyTargetDataRef.current());
        setUlmData(result.ulmData || createEmptyUlmDataRef.current());
        setDmData(result.dmData || createInitialDmDataRef.current());
        loadedKeyRef.current = currentKey;
        setDataReady(true);
      } catch (err) {
        if (!isCurrent() || controller.signal.aborted) return;
        setError(getApiErrorMessage(err));
        setDataReady(false);
      } finally {
        if (isCurrent() && !controller.signal.aborted) setLoading(false);
      }
    },
    [enabled, schemeId, region, adOffice, month, financialYear, uiCategories]
  );

  const loadNowRef = useLatestRef(loadNow);

  useDebouncedEffect(
    (_, isCurrent) => {
      if (!filterKey) return;
      loadNowRef.current(isCurrent);
    },
    [filterKey],
    300
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async () => {
    if (!adOfficeId) {
      setError('No AD office record found in the database for the selected filters.');
      return false;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await savePlantationSchemeEntry({
        schemeId,
        adOfficeId,
        month,
        financialYear,
        dmData,
        uiCategories,
      });
      setMessage('Data saved to database successfully.');
      loadedKeyRef.current = '';
      await loadNow();
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const clearDm = () => {
    setDmData(createInitialDmDataRef.current());
    setMessage('');
    setError('');
  };

  return {
    targetData,
    ulmData,
    dmData,
    setDmData,
    adOfficeId,
    loading,
    dataReady,
    saving,
    error,
    message,
    setMessage,
    setError,
    submit,
    clearDm,
    reload: () => loadNow(),
  };
}

export function useDflsApiEntry({
  pageKey,
  region,
  adOffice,
  month,
  financialYear,
  enabled,
  createInitialDmData,
  createEmptyUlmData,
}) {
  const [ulmData, setUlmData] = useState(() => createEmptyUlmData());
  const [dmData, setDmData] = useState(() => createInitialDmData());
  const [adOfficeId, setAdOfficeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const createInitialDmDataRef = useLatestRef(createInitialDmData);
  const createEmptyUlmDataRef = useLatestRef(createEmptyUlmData);
  const loadedKeyRef = useRef('');
  const abortRef = useRef(null);

  const filterKey = buildFilterKey({
    enabled,
    pageKey,
    region,
    adOffice,
    month,
    financialYear,
  });

  useEffect(() => {
    if (!filterKey) {
      setDataReady(false);
      return;
    }
    if (loadedKeyRef.current !== filterKey) {
      setDataReady(false);
    }
  }, [filterKey]);

  const loadNow = useCallback(
    async (isCurrent = () => true) => {
      if (!enabled || !region || !adOffice || !month || !financialYear) {
        setLoading(false);
        setDataReady(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const currentKey = buildFilterKey({
        enabled,
        pageKey,
        region,
        adOffice,
        month,
        financialYear,
      });
      const showLoading = loadedKeyRef.current !== currentKey;
      if (showLoading) setLoading(true);
      setError('');

      try {
        const result = await loadDflsEntry({
          pageKey,
          region,
          adOffice,
          month,
          financialYear,
        });
        if (!isCurrent() || controller.signal.aborted) return;
        setAdOfficeId(result.adOfficeId);
        setUlmData(result.ulmData || createEmptyUlmDataRef.current());
        setDmData(result.dmData || createInitialDmDataRef.current());
        loadedKeyRef.current = currentKey;
        setDataReady(true);
      } catch (err) {
        if (!isCurrent() || controller.signal.aborted) return;
        setError(getApiErrorMessage(err));
        setDataReady(false);
      } finally {
        if (isCurrent() && !controller.signal.aborted) setLoading(false);
      }
    },
    [enabled, pageKey, region, adOffice, month, financialYear]
  );

  const loadNowRef = useLatestRef(loadNow);

  useDebouncedEffect(
    (_, isCurrent) => {
      if (!filterKey) return;
      loadNowRef.current(isCurrent);
    },
    [filterKey],
    300
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async () => {
    if (!adOfficeId) {
      setError('No AD office record found in the database for the selected filters.');
      return false;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await saveDflsEntry({
        pageKey,
        adOfficeId,
        month,
        financialYear,
        dmData,
      });
      setMessage('Data saved to database successfully.');
      loadedKeyRef.current = '';
      await loadNow();
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    ulmData,
    dmData,
    setDmData,
    adOfficeId,
    loading,
    dataReady,
    saving,
    error,
    message,
    submit,
    reload: () => loadNow(),
    resetDm: () => setDmData(createInitialDmDataRef.current()),
  };
}
