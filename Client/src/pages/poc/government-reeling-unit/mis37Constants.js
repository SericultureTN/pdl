export const MIS37_REPORT_TITLE = 'Government Silk Reeling Unit Monthly Report';
export const MIS37_FORM_CODE = 'PDL MIS-37';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const TIME_PERIOD_COLUMNS = [
  { key: 'ulm', label: 'U.L.M', readOnly: true, input: false },
  { key: 'dm', label: 'D.M', readOnly: false, input: true },
  { key: 'um', label: 'U.M', readOnly: true, input: false, computed: true },
];

// Cocoon Stock Movement: U.L.M is never populated for this section, so it is hidden here
// (Quantity (kg) and Value (Rs) both drop it) while other sections keep the full U.L.M/D.M/U.M set.
export const COCOON_STOCK_TIME_PERIOD_COLUMNS = TIME_PERIOD_COLUMNS.filter((col) => col.key !== 'ulm');

// Target: yearly figure set once per fiscal year (Set Target page), auto-divided
// by 12 into this month's D.M (system-derived, read-only — see
// deriveMonthlyFromAnnual.js). U.L.M carries forward from last month's Target
// U.M exactly like Achieved, EXCEPT it resets to 0 when rolling into April
// (fiscal year start) — see mis37MonthRollover.js's FISCAL_YEAR_RESET_FIELDS.
// Achieved: a plain, independently-typed D.M field — U.L.M carried forward as
// standard, never reset (all-time running total).
export const ACHIEVEMENT_PHYSICAL_ROWS = [
  { key: 'target', label: 'Target (Kgs)', readOnly: true, resetAtFiscalYearStart: true },
  { key: 'achieved', label: 'Achieved (Kgs)' },
];

// Keys match NSC_EXPENDITURE_ROWS one-to-one (7 categories) so Financial Control Budget
// lines up exactly with Tab 2's NSC Expenditure.
export const FINANCIAL_BUDGET_ROWS = [
  { key: 'reeledCocoonsValue', label: 'Reeled Cocoons Value' },
  { key: 'wagesPaid', label: 'Wages Paid' },
  { key: 'fuelCost', label: 'Fuel Cost' },
  { key: 'ebCharges', label: 'E.B. Charges' },
  { key: 'maintenanceCharges', label: 'Maintenance Charges' },
  { key: 'transportCharges', label: 'Transport Charges' },
  { key: 'others', label: 'Others' },
];

// Financial Control Budget does NOT divide or accumulate like Physical
// Target: Budget Outlay is the full yearly figure (Set Target page), shown
// flat and unchanged every month — read-only, never divided by 12. Expenses
// (D.M) is a plain, independently-typed manual entry each month, no U.L.M —
// still auto-fetched by Tab 2 NSC Expenditure under this exact key, see
// mis37Calculations.js's computeNscExpenditure. Variance = Budget Outlay −
// Expenses, both this month's flat figures.
export const FINANCIAL_BUDGET_COLUMNS = [
  { key: 'budgetOutlay', label: 'Outlay', readOnly: true, input: false },
  { key: 'expenses', label: 'Expenses (D.M)', readOnly: false, input: true },
  { key: 'variance', label: 'Variance', readOnly: true, input: false, computed: true },
];

export const STOCK_PARTICULAR_ITEMS = [ 
  { key: 'cocoon', label: 'Cocoon' },
  { key: 'rawSilk', label: 'Raw Silk' },
  { key: 'silkWaste', label: 'Silk Waste' },
  { key: 'degummedWaste', label: 'Degummed Waste' },
  { key: 'throwsterWaste', label: 'Throwster Waste' },
  { key: 'doubleCocoon', label: 'Double Cocoon' },
  { key: 'others', label: 'Others' },
];

export const RECEIPT_ITEMS = [
  { key: 'rawSilk', label: 'Raw Silk' },
  { key: 'silkWaste', label: 'Silk Waste' },
  { key: 'dWaste', label: 'D.Waste' },
  { key: 'thWaste', label: 'Th.Waste' },
  { key: 'fCocoon', label: 'F.Cocoon' },
  { key: 'dCocoon', label: 'D.Cocoon' },
  { key: 'others', label: 'Others' },
];

// Opening Balance/Purchased/Reeled Quantity (kg) D.M is auto-fetched from Tab 1 Stock
// Particulars → Cocoon (Opening Balance / Stock Added / Consumed-Sold-Disposed
// respectively) and read-only here — see the Cocoon Stock block in
// mis37Calculations.js. Their Value (Rs) D.M stays manual (Stock Particulars only
// tracks Qty, not Rs). With all three Qty inputs auto-fetched, Closing Stock (Opening +
// Purchased − Reeled, per column) is now fully derived from Tab 1 — no manual Qty entry
// left in this card at all.
export const COCOON_STOCK_ROWS = [
  { key: 'openingBalance', label: 'Opening Balance', qtyDmAutoFetched: true },
  { key: 'purchased', label: 'Purchased', qtyDmAutoFetched: true },
  { key: 'reeled', label: 'Reeled', qtyDmAutoFetched: true },
  { key: 'closingStock', label: 'Closing Stock', computed: true },
];

export const COCOON_STOCK_METRICS = [
  { key: 'qty', label: 'Quantity (kg)' },
  { key: 'value', label: 'Value (Rs)' },
];

// D.M for every non-total row is auto-fetched from Tab 1 Financial Control Budget's
// Budget D.M for the matching category (same keys — see FINANCIAL_BUDGET_ROWS) and
// read-only here. The officer enters actual spend once, in Tab 1; it flows through to
// NSC Expenditure (and everything downstream: Cost Details, Cost of Production,
// Profit/Loss) automatically. See computeNscExpenditure in mis37Calculations.js.
export const NSC_EXPENDITURE_ROWS = [
  { key: 'reeledCocoonsValue', label: 'Reeled Cocoons Value', dmAutoFetched: true },
  { key: 'wagesPaid', label: 'Wages Paid', dmAutoFetched: true },
  { key: 'fuelCost', label: 'Fuel Cost', dmAutoFetched: true },
  { key: 'ebCharges', label: 'E.B. Charges', dmAutoFetched: true },
  { key: 'maintenanceCharges', label: 'Maintenance Charges', dmAutoFetched: true },
  { key: 'transportCharges', label: 'Transport Charges', dmAutoFetched: true },
  { key: 'others', label: 'Others', dmAutoFetched: true },
  { key: 'total', label: 'Total NSC Expenditure', computed: true },
];

// Cost Details has no U.L.M column at all — every field is a rate/ratio, not an
// accumulating total, and U.M is always recalculated fresh (never carried into next
// month's U.L.M, because there is no U.L.M here).
//  - Manual entry rows (Average S.R.% Cocoon, Assessed Rendita, Assessed Silk Kg,
//    Average Cocoon Cost/Kg): D.M is typed in; U.M just mirrors D.M.
//  - Actual Silk Kg: D.M and U.M are both auto-fetched from Tab 1 Achievement to
//    Target — Physical → Achieved (Kgs), same column (D.M/U.M).
//  - Actual Rendita: D.M = Tab1 Stock Particulars "Cocoon" consumed / this D.M's Actual Silk Kg;
//    U.M = Cocoon Stock Movement "Reeled" Qty (cumulative) / this U.M's Actual Silk Kg (cumulative).
//  - Fuel Cost/Kg: NSC Expenditure "Fuel Cost" / Actual Silk Kg, per column.
//  - Conversion Cost/Kg: sum of NSC Expenditure (Wages Paid, Fuel Cost, E.B., Maintenance,
//    Transport, Others) / Actual Silk Kg, per column.
//  - Mandays/Kg: Production Details "Mandays Used" / Actual Silk Kg, per column.
// Order matches the paper form: manual fields first, then the derived fields.
// Only avgSrPercentCocoon is a genuine 0-100 percentage (it's named "%" for a
// reason). Rendita is NOT a percentage — it's typically reported as grams of
// cocoon per 100g of silk (commonly 700-1400), so it was wrongly constrained
// to 0-100 here, which rejected real-world data on save (actualRendita is
// computed, not even user-entered, so this could fail with no way to "fix"
// the value at all).
export const COST_DETAIL_FIELDS = [
  { key: 'avgSrPercentCocoon', label: 'Average S.R.% Cocoon', percent: true, computedUm: true },
  { key: 'assessedRendita', label: 'Assessed Rendita', computedUm: true },
  { key: 'assessedSilkKg', label: 'Assessed Silk Kg', computedUm: true },
  { key: 'actualSilkKg', label: 'Actual Silk Kg', computedDm: true, computedUm: true },
  { key: 'avgCocoonCostPerKg', label: 'Average Cocoon Cost/Kg', computedUm: true },
  { key: 'actualRendita', label: 'Actual Rendita', computedDm: true, computedUm: true },
  { key: 'fuelCostPerKg', label: 'Fuel Cost/Kg', computedDm: true, computedUm: true },
  { key: 'conversionCostPerKg', label: 'Conversion Cost/Kg', computedDm: true, computedUm: true },
  { key: 'mandaysPerKg', label: 'Mandays/Kg', computedDm: true, computedUm: true },
];

// Cost Details columns — D.M and U.M only; no U.L.M (see COST_DETAIL_FIELDS above).
export const COST_DETAILS_COLUMNS = [
  { key: 'dm', label: 'D.M', readOnly: false, input: true },
  { key: 'um', label: 'U.M', readOnly: true, input: false, computed: true },
];

// Cost of Production/Kg (with/without staff) are derived from Total NSC Expenditure and
// Cost Details -> Actual Silk Kg — see computeCostOfProduction in mis37Calculations.js.
// Their U.L.M is unused; the other rows here are unchanged and still use U.L.M.
export const COST_OF_PRODUCTION_ROWS = [
  { key: 'totalNscExpenditure', label: 'Total NSC Expenditure', computed: true, source: 'nscTotal' },
  { key: 'saleValueByeProducts', label: 'Sale Value of Bye Products', timePeriod: true },
  { key: 'netNscExpenditure', label: 'Net NSC Expenditure', computed: true },
  { key: 'costPerKgWithStaff', label: 'Cost of Production/Kg (with staff)', computed: true, unit: 'Rs/Kg' },
  { key: 'costPerKgWithoutStaff', label: 'Cost of Production/Kg (without staff)', computed: true, unit: 'Rs/Kg' },
];

// Fire Wood has no counterpart in Tab 1 Stock Particulars, so it stays independently
// editable in Tab 3; every other item mirrors the matching Tab 1 row (see stockParticularKey).
export const STOCK_KGS_ITEMS = [
  { key: 'cocoons', label: 'Cocoons', stockParticularKey: 'cocoon' },
  { key: 'fireWood', label: 'Fire Wood' },
  { key: 'silkWaste', label: 'Silk Waste', stockParticularKey: 'silkWaste' },
  { key: 'degummedWaste', label: 'Degummed Waste', stockParticularKey: 'degummedWaste' },
  { key: 'throwsterWaste', label: 'Throwster Waste', stockParticularKey: 'throwsterWaste' },
  { key: 'doubleCocoon', label: 'Double Cocoon', stockParticularKey: 'doubleCocoon' },
  { key: 'rawSilk', label: 'Raw Silk', stockParticularKey: 'rawSilk' },
];

export const ESTIMATED_SALE_ROWS = [
  { key: 'rawSilk', label: 'Raw Silk @ Rs/Kg', timePeriod: true },
  { key: 'byeProducts', label: 'Bye Products', computed: true },
  { key: 'total', label: 'Total', computed: true },
];

// Actual Receipt Details (Section VII) — simplified to 2 items (Silk Sold, Bye Products
// Sold), each split into Current Year / Previous Year. Every leaf row is U.L.M/D.M/U.M x
// Qty/Value; D.M is the only editable cell, U.M = U.L.M + D.M, U.L.M carries forward
// monthly. No total or pending rows — those were removed entirely. `path` is the dotted
// key into tab3.actualReceiptDetails.
export const ACTUAL_RECEIPT_ROWS = [
  { no: 1, path: 'silkSold.currentYear', label: 'Silk Sold' },
  // { no: 1, path: 'silkSold.previousYear', label: 'Silk Sold — Previous Year' },
  // { no: 2, path: 'byeProductsSold.currentYear', label: 'Bye Products Sold — Current Year' },
  { no: 2, path: 'byeProductsSold.previousYear', label: 'Bye Products Sold' },
];

export const HEADER_FIELDS = [
  { key: 'unitName', label: 'Unit Name', type: 'text', required: true },
  // { key: 'unitCode', label: 'Unit Code', type: 'text', required: true },
  { key: 'adCode', label: 'AD Code', type: 'text', required: true },
  { key: 'disCode', label: 'DIS Code', type: 'text', required: true },
  { key: 'regCode', label: 'REG Code', type: 'text', required: true },
  { key: 'month', label: 'Month', type: 'select', required: true, options: MONTHS },
  { key: 'year', label: 'Year', type: 'number', required: true },
];

// Fixed unit characteristics — plain fields, no U.L.M/D.M/U.M split.
export const PRODUCTION_DETAIL_FIELDS = [
  { key: 'devicesInstalled', label: 'Devices Installed' },
  { key: 'productionCapacity', label: 'Production Capacity (Kgs)', type: 'number', unit: 'kgs' },
  { key: 'devicesInUse', label: 'Devices in Use' },
];

// Monthly-accumulating figures — standard U.L.M (carried forward) / D.M (entered) / U.M pattern.
export const PRODUCTION_WORK_ROWS = [
  { key: 'daysWorked', label: 'Days Worked' },
  { key: 'mandaysUsed', label: 'Mandays Used' },
];

export const COST_OF_PRODUCTION_FIELDS = COST_OF_PRODUCTION_ROWS;
