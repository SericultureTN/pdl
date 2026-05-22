import { useState, useCallback } from "react";

export const MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March"
];

/**
 * useMonthlyData
 *
 * Manages a month-keyed data store.
 * - ULM is auto-populated from previous month's UM (read-only)
 * - DM is user-editable
 * - UM = ULM + DM (auto-calculated, read-only)
 *
 * @param {Function} buildEmptyRows  - () => array of row objects (must have fields for each numeric key)
 * @param {string[]} dmFields        - field names the user can edit (DM fields)
 * @param {Function} ulmFieldFor     - (dmField) => ulmField name
 * @param {Function} umFieldFor      - (dmField) => umField name
 * @param {Function} calcExtras      - (row) => updatedRow  — optional extra auto-calcs (e.g. bv_total)
 */
export function useMonthlyData({
  buildEmptyRows,
  dmFields,
  ulmFieldFor,
  umFieldFor,
  calcExtras = (r) => r,
}) {
  // monthStore: { "2025–26::April": rows[] }
  const [monthStore, setMonthStore] = useState({});
  const [currentMonth, setCurrentMonth] = useState("April");
  const [currentYear, setCurrentYear] = useState("2025–26");

  const storeKey = (year, month) => `${year}::${month}`;

  /** Get rows for a given month, auto-applying carry-forward from previous month */
  const getRows = useCallback((year, month) => {
    const key = storeKey(year, month);
    if (monthStore[key]) return monthStore[key];

    // Build fresh rows
    const fresh = buildEmptyRows();

    // Find previous month's UM to populate ULM
    const monthIdx = MONTHS.indexOf(month);
    const prevMonthIdx = monthIdx - 1;
    let prevRows = null;

    if (prevMonthIdx >= 0) {
      const prevKey = storeKey(year, MONTHS[prevMonthIdx]);
      prevRows = monthStore[prevKey] || null;
    }
    // Handle financial year boundary: March → April uses previous year
    else if (month === "April") {
      const prevYearMatch = year.match(/(\d{4})–(\d{2})/);
      if (prevYearMatch) {
        const prevYear = `${parseInt(prevYearMatch[1]) - 1}–${String(parseInt(prevYearMatch[1]) - 1).slice(-2) === "99" ? "00" : String(parseInt(prevYearMatch[2], 10) - 1).padStart(2, "0")}`;
        const prevKey = storeKey(prevYear, "March");
        prevRows = monthStore[prevKey] || null;
      }
    }

    // Apply carry-forward
    const rows = fresh.map((row, i) => {
      const updated = { ...row };
      dmFields.forEach(dmF => {
        const ulmF = ulmFieldFor(dmF);
        const umF  = umFieldFor(dmF);
        // ULM = previous month's UM (or 0 if first month)
        const prevUM = prevRows ? (parseFloat(prevRows[i]?.[umF]) || 0) : 0;
        updated[ulmF] = prevUM === 0 ? "" : prevUM.toString();
        updated[dmF]  = "";
        updated[umF]  = prevUM === 0 ? "" : prevUM.toString();
      });
      return calcExtras(updated);
    });

    return rows;
  }, [monthStore, buildEmptyRows, dmFields, ulmFieldFor, umFieldFor, calcExtras]);

  /** Active rows (current month) */
  const rows = getRows(currentYear, currentMonth);

  /** User edits a DM field — UM is auto-recalculated */
  const updateDM = useCallback((rowIdx, dmField, value) => {
    const key = storeKey(currentYear, currentMonth);
    const currentRows = getRows(currentYear, currentMonth);

    const updated = currentRows.map((r, i) => {
      if (i !== rowIdx) return r;
      const u = { ...r, [dmField]: value };
      // Recalc UM for this dm field
      const ulmF = ulmFieldFor(dmField);
      const umF  = umFieldFor(dmField);
      const ulm  = parseFloat(u[ulmF]) || 0;
      const dm   = parseFloat(value)   || 0;
      u[umF] = (ulm + dm).toString();
      return calcExtras(u);
    });

    setMonthStore(prev => ({ ...prev, [key]: updated }));
  }, [currentYear, currentMonth, getRows, ulmFieldFor, umFieldFor, calcExtras]);

  /** Save current rows explicitly (e.g. on submit/draft) */
  const saveRows = useCallback((rowsToSave) => {
    const key = storeKey(currentYear, currentMonth);
    setMonthStore(prev => ({ ...prev, [key]: rowsToSave }));
  }, [currentYear, currentMonth]);

  /** Reset current month's edits (clears DM, resets ULM carry-forward) */
  const resetCurrentMonth = useCallback(() => {
    const key = storeKey(currentYear, currentMonth);
    setMonthStore(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [currentYear, currentMonth]);

  const handleMonthChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  return {
    rows,
    currentMonth,
    currentYear,
    updateDM,
    saveRows,
    resetCurrentMonth,
    handleMonthChange,
    MONTHS,
  };
}
