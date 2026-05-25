/**
 * useApiData
 *
 * Shared hook that handles loading + saving MIS report data from the backend.
 * Used by all data-entry screens (PlantationScheme, DFLsDistribution, etc.)
 *
 * The API stores only the core ULM/DM/UM Acre+Farmer fields.
 * For screens with sub-columns (DFLs, Cocoon) we store those in the
 * `extra_data` JSONB field on mis_reports via a separate bulk endpoint.
 * Until that field is added we persist the full row as JSON in localStorage
 * as a fallback, while still syncing carry-forward ULM from the API.
 */

import { useState, useEffect, useCallback } from "react";
import { misReportApi } from "../../services/misApi.js";
import { ALL_AD_OFFICES } from "./FilterBar.jsx";

const LS_KEY = (scheme, year, month) => `mis_draft__${scheme}__${year}__${month}`;

export function useApiData({ schemeName, buildEmptyRows, applyCarryForward, year, month, user }) {
  const [rows, setRows]       = useState(buildEmptyRows);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const loadData = useCallback(async (yr, mo) => {
    setLoading(true);
    setError(null);
    try {
      const isAdmin = user?.role === "super_admin" || user?.role === "section_admin";

      // Fetch API carry-forward data (ULM from prev month UM)
      let apiRows = [];
      if (isAdmin) {
        const res = await misReportApi.loadAllOffices({ schemeName, yearName: yr, monthName: mo });
        apiRows = res.rows || [];
      } else {
        const officeName = user?.ad_office;
        if (officeName) {
          const res = await misReportApi.loadReport({ officeName, schemeName, yearName: yr, monthName: mo });
          apiRows = res.report ? [res.report] : [];
        }
      }

      // Build a map keyed by office_name
      const apiMap = {};
      apiRows.forEach(r => { apiMap[r.office_name] = r; });

      // Try restoring full draft from localStorage (only used when API has no saved record)
      const lsRaw = localStorage.getItem(LS_KEY(schemeName, yr, mo));
      const lsRows = lsRaw ? JSON.parse(lsRaw) : null;

      // Merge all rows: API is always source of truth for core ULM/DM/UM fields.
      // localStorage only supplements sub-column data that the API doesn't store.
      const fresh = buildEmptyRows();
      const merged = fresh.map((row, i) => {
        const api = apiMap[row.adOffice];
        const ls  = lsRows ? lsRows[i] : null;

        if (!api) {
          // Office not in API response at all — use LS or empty
          return { ...(ls || row), reportId: null, status: "Draft" };
        }

        // Always apply carry-forward from API (covers both saved records and new-month ULM)
        // applyCarryForward sets sub-column ULM values from api.ulm_acre
        const base = applyCarryForward
          ? applyCarryForward({ ...row, ...(ls || {}) }, api)
          : { ...row, ...(ls || {}) };

        return {
          ...base,
          // Core fields always from API
          ulm_acre:   parseFloat(api.ulm_acre)   || 0,
          ulm_farmer: parseInt(api.ulm_farmer, 10) || 0,
          dm_acre:    api.id ? (parseFloat(api.dm_acre)   || 0) : (parseFloat(base.dm_acre)   || 0),
          dm_farmer:  api.id ? (parseInt(api.dm_farmer, 10) || 0) : (parseInt(base.dm_farmer, 10) || 0),
          um_acre:    parseFloat(api.um_acre)    || 0,
          um_farmer:  parseInt(api.um_farmer, 10) || 0,
          reportId:   api.id || null,
          status:     api.status || "Draft",
        };
      });

      setRows(merged);
    } catch (e) {
      setError(e.message);
      setRows(buildEmptyRows());
    } finally {
      setLoading(false);
    }
  }, [schemeName, user, buildEmptyRows, applyCarryForward]);

  useEffect(() => {
    if (year && month) loadData(year, month);
  }, [year, month, loadData]);

  /** Persist rows to localStorage immediately (instant draft) */
  const persistLocal = useCallback((newRows, yr, mo) => {
    localStorage.setItem(LS_KEY(schemeName, yr, mo), JSON.stringify(newRows));
    setRows(newRows);
  }, [schemeName]);

  /** Save to API (core ULM/DM/UM fields only) + localStorage for full row data */
  const saveToApi = useCallback(async (currentRows, yr, mo, status = "Draft") => {
    setSaving(true);
    setError(null);
    try {
      // Save core fields to API
      await misReportApi.saveBulk({
        rows: currentRows.map(r => ({
          adOffice:   r.adOffice,
          dm_acre:    r.dm_acre    ?? 0,
          dm_farmer:  r.dm_farmer  ?? 0,
        })),
        schemeName,
        yearName:  yr,
        monthName: mo,
        status,
      });
      // Clear localStorage so loadData reads fresh API data as truth
      localStorage.removeItem(LS_KEY(schemeName, yr, mo));
      await loadData(yr, mo);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [schemeName, loadData]);

  return { rows, setRows, loading, saving, error, loadData, persistLocal, saveToApi };
}
