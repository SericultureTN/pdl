import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// April-first order — matches the rollover system's own month ordering
// throughout government-reeling-unit/mis37MonthRollover.js (fiscal month 0 =
// April, fiscal month 11 = March), so grid position 1 = April everywhere.
export const FISCAL_MONTH_ORDER = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
];

/** Calendar year the fiscal year STARTS in, e.g. April 2026 or March 2027 both -> 2026. */
export function getFyStart(month, year) {
  const idx = FISCAL_MONTH_ORDER.indexOf(month);
  const y = Number(year);
  if (idx === -1 || !Number.isFinite(y)) return null;
  return idx < 9 ? y : y - 1;
}

/** Same month name, resolved into the fiscal year starting at fyStart. */
export function resolveMonthInFy(month, fyStart) {
  const idx = FISCAL_MONTH_ORDER.indexOf(month);
  if (idx === -1 || fyStart == null) return null;
  return { month, year: idx < 9 ? fyStart : fyStart + 1 };
}

export function currentFyStart() {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function fyLabel(fyStart) {
  return fyStart == null ? 'FY —' : `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;
}

/**
 * Compact fiscal-year-first period picker. Collapsed: one row showing the
 * current selection as read-only text + a calendar icon button — no grid, no
 * year nav, until opened. Clicking the icon opens a small popover (fiscal
 * year nav "‹ FY 2026-27 ›" + a 6-column April-first month grid); picking a
 * month resolves its calendar year automatically (Jan/Feb/March belong to
 * fyStart + 1) and closes the popover. Fully controlled — the parent owns
 * fyStart (which fiscal year is being browsed) and, in month-grid mode, the
 * selected month/year. Reused as-is on Set Target (showMonthGrid=false,
 * fiscal-year-only — the popover has no month grid, just the year nav) and
 * the Government Reeling Unit report (showMonthGrid=true) so both pages
 * share one visual language for period selection.
 */
export default function FiscalYearMonthPicker({
  fyStart,
  onFyStartChange,
  selectedMonth,
  selectedYear,
  onSelectMonth,
  showMonthGrid = true,
  disabled = false,
  label = 'Report period',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const cells = FISCAL_MONTH_ORDER.map((month, i) => ({
    month,
    year: fyStart == null ? null : (i < 9 ? fyStart : fyStart + 1),
  }));

  const collapsedLabel = showMonthGrid
    ? (selectedMonth && selectedYear ? `${selectedMonth} ${selectedYear}` : 'Select period')
    : fyLabel(fyStart);

  const navFy = (delta) => onFyStartChange((fyStart ?? currentFyStart()) + delta);

  const handleSelectMonth = (cell) => {
    onSelectMonth({ month: cell.month, year: cell.year });
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={collapsedLabel}
          disabled={disabled}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Open period picker"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-60 rounded-lg border border-slate-300 bg-white p-2 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navFy(-1)}
              className="rounded p-1 text-slate-600 hover:bg-slate-100"
              aria-label="Previous fiscal year"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-semibold text-emerald-secondary">{fyLabel(fyStart)}</span>
            <button
              type="button"
              onClick={() => navFy(1)}
              className="rounded p-1 text-slate-600 hover:bg-slate-100"
              aria-label="Next fiscal year"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {showMonthGrid && (
            <div className="grid grid-cols-6 gap-1">
              {cells.map((cell) => {
                const isSelected = selectedMonth === cell.month && selectedYear === cell.year;
                return (
                  <button
                    key={cell.month}
                    type="button"
                    disabled={fyStart == null}
                    onClick={() => handleSelectMonth(cell)}
                    className={`rounded px-1 py-1.5 text-[11px] font-medium transition ${
                      isSelected
                        ? 'bg-emerald-primary text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {cell.month.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
