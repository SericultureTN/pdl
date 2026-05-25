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

      // Merge: if API has a real saved record (id != null), use it as the source of truth.
      // Only fall back to localStorage when there's no API record yet.
      const fresh = buildEmptyRows();
      const merged = fresh.map((row, i) => {
        const api = apiMap[row.adOffice];
        const ls  = lsRows ? lsRows[i] : null;

        // API record exists — use it as truth, overlay sub-column LS data on top
        if (api?.id) {
          const base = applyCarryForward
            ? applyCarryForward({ ...row, ...(ls || {}) }, api)
            : { ...row, ...(ls || {}) };
          return {
            ...base,
            // Always reflect saved core fields from API
            ulm_acre:   parseFloat(api.ulm_acre)   || 0,
            ulm_farmer: parseInt(api.ulm_farmer, 10) || 0,
            dm_acre:    parseFloat(api.dm_acre)    || 0,
            dm_farmer:  parseInt(api.dm_farmer, 10) || 0,
            um_acre:    parseFloat(api.um_acre)    || 0,
            um_farmer:  parseInt(api.um_farmer, 10) || 0,
            reportId:   api.id,
            status:     api.status || "Draft",
          };
        }

        // No API record — use localStorage draft if available, else carry-forward
        const base = applyCarryForward
          ? applyCarryForward(ls || row, api)
          : (ls || row);
        return {
          ...base,
          reportId: null,
          status:   "Draft",
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
