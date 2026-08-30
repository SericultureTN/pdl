export const MIS34_REPORT_TITLE = 'Government Silk Twisting Unit Monthly Register';
export const MIS34_FORM_CODE = 'PDL MIS-34';
export const MIS34_UNIT_TYPE = 'government_twisting';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Report-level header fields — office identifiers, entered once per report (not per unit). */
export const HEADER_FIELDS = [
  { key: 'adCode', label: 'AD Code', type: 'text' },
  { key: 'disCode', label: 'DIS Code', type: 'text' },
  { key: 'regCode', label: 'REG Code', type: 'text' },
];

/**
 * Achievement to Target — two tables (Raw Produced, Twisted Silk Production),
 * each with a Target row and an Achieved row, U.L.M/D.M/U.M columns.
 * U.L.M is carried forward at month-end rollover like every other table row.
 */
export const ACHIEVEMENT_TABLE_FIELDS = [
  {
    key: 'targetRawProduced', label: 'Target', group: 'Raw Produced (Kg)',
    ulmKey: 'targetRawProducedUlm', dmKey: 'targetRawProducedDm', umKey: 'targetRawProducedUm',
  },
  {
    key: 'achievedRawProduced', label: 'Achieved', group: 'Raw Produced (Kg)',
    ulmKey: 'achievedRawProducedUlm', dmKey: 'achievedRawProducedDm', umKey: 'achievedRawProducedUm',
  },
  {
    key: 'targetTwistedSilkProduction', label: 'Target', group: 'Twisted Silk Production (Kg)',
    ulmKey: 'targetTwistedSilkProductionUlm', dmKey: 'targetTwistedSilkProductionDm', umKey: 'targetTwistedSilkProductionUm',
  },
  {
    key: 'achievedTwistedSilkProduction', label: 'Achieved', group: 'Twisted Silk Production (Kg)',
    ulmKey: 'achievedTwistedSilkProductionUlm', dmKey: 'achievedTwistedSilkProductionDm', umKey: 'achievedTwistedSilkProductionUm',
  },
];

/** Plain fields — no U.L.M/D.M/U.M split, shown above the Production Details table. */
export const PRODUCTION_FIELDS = [
  { key: 'spindlesInstalled', label: 'Spindles Installed', type: 'number' },
  { key: 'installedProductionCapacity', label: 'Installed Production Capacity (Kg)', type: 'number' },
  { key: 'spindlesInUse', label: 'Spindles in Use', type: 'number' },
];

/**
 * Production Details table — every row has a D.M (editable, entered this
 * month) and a U.M (read-only, = U.L.M + D.M). U.L.M is never entered
 * directly — carried forward automatically from last month's U.M for the
 * same unit (matched by unit name) at submit time; see mis34MonthRollover.js.
 */
export const PRODUCTION_TABLE_FIELDS = [
  {
    key: 'daysWorked', label: 'Days Worked',
    ulmKey: 'daysWorkedUlm', dmKey: 'daysWorkedDm', umKey: 'daysWorkedUm',
  },
  {
    key: 'mandaysUsed', label: 'Mandays Used',
    ulmKey: 'mandaysUsedUlm', dmKey: 'mandaysUsedDm', umKey: 'mandaysUsedUm',
  },
  {
    key: 'rawSilkPurchased', label: 'Raw Silk Purchased (Kg)',
    ulmKey: 'rawSilkPurchasedUlm', dmKey: 'rawSilkPurchasedDm', umKey: 'rawSilkPurchasedUm',
  },
  {
    key: 'rawSilkUsedKg', label: 'Raw Silk Used (Kg)',
    ulmKey: 'rawSilkUsedKgUlm', dmKey: 'rawSilkUsedKgDm', umKey: 'rawSilkUsedKgUm',
  },
  {
    key: 'rawSilkUsedRs', label: 'Raw Silk Used (Rs)',
    ulmKey: 'rawSilkUsedRsUlm', dmKey: 'rawSilkUsedRsDm', umKey: 'rawSilkUsedRsUm',
  },
  {
    key: 'productionOfTwistedRawSilk', label: 'Production of Twisted Raw Silk (Kg)',
    ulmKey: 'productionOfTwistedRawSilkUlm', dmKey: 'productionOfTwistedRawSilkDm', umKey: 'productionOfTwistedRawSilkUm',
  },
  {
    key: 'totalValueOfProduction', label: 'Total Value of Production (Rs)',
    ulmKey: 'totalValueOfProductionUlm', dmKey: 'totalValueOfProductionDm', umKey: 'totalValueOfProductionUm',
  },
];

/** NSC Expenditure table — same U.L.M/D.M/U.M pattern, plus a summed TOTAL row. */
export const NSC_EXPENDITURE_TABLE_FIELDS = [
  {
    key: 'valueOfRawSilkIssued', label: 'Value of Raw Silk Issued for Twisting (Rs)',
    ulmKey: 'valueOfRawSilkIssuedUlm', dmKey: 'valueOfRawSilkIssuedDm', umKey: 'valueOfRawSilkIssuedUm',
  },
  {
    key: 'wagesPaid', label: 'Wages Paid (Rs)',
    ulmKey: 'wagesPaidUlm', dmKey: 'wagesPaidDm', umKey: 'wagesPaidUm',
  },
  {
    key: 'ebCharges', label: 'E.B. Charges (Rs)',
    ulmKey: 'ebChargesUlm', dmKey: 'ebChargesDm', umKey: 'ebChargesUm',
  },
  {
    key: 'consumableItems', label: 'Consumable Items (Rs)',
    ulmKey: 'consumableItemsUlm', dmKey: 'consumableItemsDm', umKey: 'consumableItemsUm',
  },
  {
    key: 'transportCost', label: 'Transport Cost (Rs)',
    ulmKey: 'transportCostUlm', dmKey: 'transportCostDm', umKey: 'transportCostUm',
  },
  {
    key: 'otherExpenditures', label: 'Other Expenditures (Rs)',
    ulmKey: 'otherExpendituresUlm', dmKey: 'otherExpendituresDm', umKey: 'otherExpendituresUm',
  },
];

/** Cost & Sale Value table — U.L.M/D.M/U.M rows; Net Expenditure / Cost per Kg are calculated, not entered. */
export const COST_SALE_TABLE_FIELDS = [
  {
    key: 'saleValueOfTwistedWaste', label: 'Sale Value of Twisted Waste (Rs)',
    ulmKey: 'saleValueOfTwistedWasteUlm', dmKey: 'saleValueOfTwistedWasteDm', umKey: 'saleValueOfTwistedWasteUm',
  },
  {
    key: 'estimatedSaleValueOfReadySilk', label: 'Estimated Sale Value of Ready Silk @ Rate/Kg (Rs)',
    ulmKey: 'estimatedSaleValueOfReadySilkUlm', dmKey: 'estimatedSaleValueOfReadySilkDm', umKey: 'estimatedSaleValueOfReadySilkUm',
  },
];

/** Every table-shaped group on a unit — used generically by rollover, defaults, and zod. */
export const UNIT_TABLE_GROUPS = [
  { path: 'achievementToTarget', fields: ACHIEVEMENT_TABLE_FIELDS },
  { path: 'productionDetails', fields: PRODUCTION_TABLE_FIELDS },
  { path: 'nscExpenditure', fields: NSC_EXPENDITURE_TABLE_FIELDS },
  { path: 'costSaleValue', fields: COST_SALE_TABLE_FIELDS },
];

/** Columns shown in the compact saved-units list. */
export const LIST_COLUMNS = [
  { id: 'unitName', label: 'Unit Name' },
  { id: 'productionOfTwistedRawSilk', label: 'Production of Twisted Raw Silk (Kg)' },
  { id: 'totalNscExpenditure', label: 'Total NSC Expenditure (Rs)' },
  { id: 'costOfProductionPerKg', label: 'Cost of Production / Kg (Rs)' },
];

/** Columns shown in the read-only Abstract rollup. */
export const ABSTRACT_COLUMNS = [
  { id: 'unitName', label: 'Unit' },
  { id: 'spindlesInstalled', label: 'Spindles Installed' },
  { id: 'productionOfTwistedRawSilk', label: 'Production of Twisted Raw Silk (Kg)' },
  { id: 'totalNscExpenditure', label: 'Total NSC Expenditure (Rs)' },
  { id: 'totalValueOfProduction', label: 'Total Value of Production (Rs)' },
  { id: 'costOfProductionPerKg', label: 'Cost of Production / Kg (Rs)' },
];
