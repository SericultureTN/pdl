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

export const ACHIEVEMENT_PHYSICAL_ROWS = [
  { key: 'target', label: 'Target (Kgs)' },
  { key: 'achieved', label: 'Achieved (Kgs)' },
];

export const FINANCIAL_BUDGET_ROWS = [
  { key: 'salary', label: 'Salary' },
  { key: 'cocoonCost', label: 'Cocoon Cost' },
  { key: 'wages', label: 'Wages' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'others', label: 'Others' },
];

export const FINANCIAL_CATEGORY_TYPES = [
  { key: 'outlay', label: 'Outlay' },
  { key: 'expenses', label: 'Expenses' },
];

export const FINANCIAL_BUDGET_COLUMNS = [
  { key: 'budgetAnnual', label: 'Budget Annual', readOnly: false, input: true },
  { key: 'budgetUlM', label: 'Budget U.L.M', readOnly: true, input: false },
  { key: 'budgetDm', label: 'Budget D.M', readOnly: false, input: true },
  { key: 'budgetUm', label: 'Budget U.M', readOnly: true, input: false, computed: true },
  { key: 'actualAnnual', label: 'Actual Annual', readOnly: true, input: false, computed: true },
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

export const SILK_SALES_ROWS = [
  { key: 'openingBalance', label: 'Opening Balance' },
  { key: 'sold', label: 'Sold' },
  { key: 'dueSettled', label: 'Due Settled' },
  { key: 'balance', label: 'Balance' },
];

export const COCOON_STOCK_ROWS = [
  { key: 'openingBalance', label: 'Opening Balance' },
  { key: 'purchased', label: 'Purchased' },
  { key: 'reeled', label: 'Reeled' },
  { key: 'closingStock', label: 'Closing Stock', computed: true },
];

export const COCOON_STOCK_METRICS = [
  { key: 'qty', label: 'Quantity (kg)' },
  { key: 'value', label: 'Value (Rs)' },
];

export const NSC_EXPENDITURE_ROWS = [
  { key: 'reeledCocoonsValue', label: 'Reeled Cocoons Value' },
  { key: 'wagesPaid', label: 'Wages Paid' },
  { key: 'fuelCost', label: 'Fuel Cost' },
  { key: 'ebCharges', label: 'E.B. Charges' },
  { key: 'maintenanceCharges', label: 'Maintenance Charges' },
  { key: 'transportCharges', label: 'Transport Charges' },
  { key: 'others', label: 'Others' },
  { key: 'total', label: 'Total NSC Expenditure', computed: true },
];

export const COST_DETAIL_FIELDS = [
  { key: 'avgSrPercentCocoon', label: 'Average S.R.% Cocoon', percent: true },
  { key: 'assessedRendita', label: 'Assessed Rendita', percent: true },
  { key: 'actualRendita', label: 'Actual Rendita', percent: true },
  { key: 'assessedSilkKg', label: 'Assessed Silk Kg' },
  { key: 'actualSilkKg', label: 'Actual Silk Kg' },
  { key: 'fuelCostPerKg', label: 'Fuel Cost/Kg' },
  { key: 'conversionCostPerKg', label: 'Conversion Cost/Kg' },
  { key: 'mandaysPerKg', label: 'Mandays/Kg' },
  { key: 'avgCocoonCostPerKg', label: 'Average Cocoon Cost/Kg' },
];

export const COST_OF_PRODUCTION_ROWS = [
  { key: 'totalNscExpenditure', label: 'Total NSC Expenditure', computed: true, source: 'nscTotal' },
  { key: 'saleValueByeProducts', label: 'Sale Value of Bye Products', timePeriod: true },
  { key: 'netNscExpenditure', label: 'Net NSC Expenditure', computed: true },
  { key: 'costPerKgWithStaff', label: 'Cost of Production/Kg (with staff)', timePeriod: true, unit: 'Rs/Kg' },
  { key: 'costPerKgWithoutStaff', label: 'Cost of Production/Kg (without staff)', timePeriod: true, unit: 'Rs/Kg' },
];

export const STOCK_KGS_ITEMS = [
  { key: 'cocoons', label: 'Cocoons' },
  { key: 'fireWood', label: 'Fire Wood' },
  { key: 'silkWaste', label: 'Silk Waste' },
  { key: 'degummedWaste', label: 'Degummed Waste' },
  { key: 'throwsterWaste', label: 'Throwster Waste' },
  { key: 'doubleCocoon', label: 'Double Cocoon' },
  { key: 'rawSilk', label: 'Raw Silk' },
];

export const ESTIMATED_SALE_ROWS = [
  { key: 'rawSilk', label: 'Raw Silk @ Rs/Kg' },
  { key: 'byeProducts', label: 'Bye Products' },
  { key: 'total', label: 'Total', computed: true },
];

export const ACTUAL_RECEIPT_SILK_ROWS = [
  { key: 'currentYear', label: 'Current Year' },
  { key: 'previousYear', label: 'Previous Year' },
  { key: 'total', label: 'Total Silk Sold', computed: true },
];

export const ACTUAL_RECEIPT_BYE_ROWS = [
  { key: 'currentYear', label: 'Current Year' },
  { key: 'previousYear', label: 'Previous Year' },
  { key: 'total', label: 'Total Bye Products Sold', computed: true },
];

export const PENDING_AMOUNT_ROWS = [
  { key: 'currentYear', label: 'Current Year' },
  { key: 'previousYear', label: 'Previous Year' },
];

export const MACHINERY_FIELDS = [
  { key: 'totalReelingMachines', label: 'Total Reeling Machines' },
  { key: 'workingMachines', label: 'Working Machines' },
  { key: 'daysUnitFunctioned', label: 'Days Unit Functioned' },
  { key: 'mandaysUsed', label: 'Mandays Used' },
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

export const PRODUCTION_DETAIL_FIELDS = [
  { key: 'devicesInstalled', label: 'Devices Installed' },
  { key: 'productionCapacity', label: 'Production Capacity (Kgs)', type: 'number', unit: 'kgs' },
  { key: 'devicesInUse', label: 'Devices in Use' },
  { key: 'daysWorked', label: 'Days Worked' },
  { key: 'mandaysUsed', label: 'Mandays Used' },
  { key: 'cocoonUsedKg', label: 'Cocoon Used (Kgs)', type: 'number', unit: 'kgs' },
  { key: 'valueOfCocoonUsed', label: 'Value of Cocoon Used (Rs)', type: 'number', unit: 'rupees' },
  { key: 'valueOfFuelUsed', label: 'Value of Fuel Used (Rs)', type: 'number', unit: 'rupees' },
  { key: 'silkProducedQty', label: 'Qty of Silk Produced (Kgs)', type: 'number', unit: 'kgs' },
  { key: 'valueOfSilkProduced', label: 'Value of Silk Produced (Rs)', type: 'number', unit: 'rupees' },
  { key: 'renditaPercent', label: 'Rendita % (Cocoon Kg ÷ Silk Kg)', computed: true },
];

export const COST_OF_PRODUCTION_FIELDS = COST_OF_PRODUCTION_ROWS;
