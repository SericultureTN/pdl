export const MIS37_REPORT_TITLE = 'Government Silk Reeling Unit Monthly Report';
export const MIS37_FORM_CODE = 'PDL MIS-37';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const FINANCIAL_BUDGET_ROWS = [
  { key: 'salary', label: 'Salary' },
  { key: 'cocoonCost', label: 'Cocoon Cost' },
  { key: 'wages', label: 'Wages' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'others', label: 'Others' },
];

export const FINANCIAL_BUDGET_COLUMNS = [
  { key: 'outlayDm', label: 'Outlay D.M', input: true },
  { key: 'outlayUm', label: 'Outlay U.M', input: true },
  { key: 'outlayAnnual', label: 'Outlay Annual', input: true },
  { key: 'expensesDm', label: 'Expenses D.M', input: true },
  { key: 'expensesUm', label: 'Expenses U.M', input: true },
  { key: 'expensesAnnual', label: 'Expenses Annual', input: true },
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
  { key: 'closingStock', label: 'Closing Stock' },
];

export const COCOON_STOCK_COLUMN_GROUPS = [
  {
    label: 'During Month',
    columns: [
      { key: 'csrDuringQty', label: 'CSR Qty (kg)', input: true },
      { key: 'csrDuringValue', label: 'CSR Value (Rs)', input: true },
      { key: 'cbDuringQty', label: 'CB Qty (kg)', input: true },
      { key: 'cbDuringValue', label: 'CB Value (Rs)', input: true },
    ],
  },
  {
    label: 'Upto Month',
    columns: [
      { key: 'csrUptoQty', label: 'CSR Qty (kg)', input: true },
      { key: 'csrUptoValue', label: 'CSR Value (Rs)', input: true },
      { key: 'cbUptoQty', label: 'CB Qty (kg)', input: true },
      { key: 'cbUptoValue', label: 'CB Value (Rs)', input: true },
    ],
  },
];

export const NSC_EXPENDITURE_ROWS = [
  { key: 'reeledCocoonsValue', label: 'Reeled Cocoons Value', input: true },
  { key: 'wagesPaid', label: 'Wages Paid', input: true },
  { key: 'fuelCost', label: 'Fuel Cost', input: true },
  { key: 'ebCharges', label: 'E.B. Charges', input: true },
  { key: 'maintenanceCharges', label: 'Maintenance Charges', input: true },
  { key: 'transportCharges', label: 'Transport Charges', input: true },
  { key: 'others', label: 'Others', input: true },
  { key: 'total', label: 'Total NSC Expenditure', input: false, computed: true },
];

export const COST_DETAIL_FIELDS = [
  { key: 'avgSrPercentCocoon', label: 'Average S.R.% Cocoon', assessedKey: 'assessedAvgSrPercentCocoon', actualKey: 'actualAvgSrPercentCocoon' },
  { key: 'rendita', label: 'Rendita', assessedKey: 'assessedRendita', actualKey: 'actualRendita' },
  { key: 'silkKg', label: 'Silk Kg', assessedKey: 'assessedSilkKg', actualKey: 'actualSilkKg' },
  { key: 'fuelCostPerKg', label: 'Fuel Cost/Kg', assessedKey: 'assessedFuelCostPerKg', actualKey: 'actualFuelCostPerKg' },
  { key: 'conversionCostPerKg', label: 'Conversion Cost/Kg', assessedKey: 'assessedConversionCostPerKg', actualKey: 'actualConversionCostPerKg' },
  { key: 'mandaysPerKg', label: 'Mandays/Kg', assessedKey: 'assessedMandaysPerKg', actualKey: 'actualMandaysPerKg' },
  { key: 'avgCocoonCostPerKg', label: 'Average Cocoon Cost/Kg', assessedKey: 'assessedAvgCocoonCostPerKg', actualKey: 'actualAvgCocoonCostPerKg' },
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
  { key: 'unitCode', label: 'Unit Code', type: 'text', required: true },
  { key: 'adCode', label: 'AD Code', type: 'text', required: true },
  { key: 'disCode', label: 'DIS Code', type: 'text', required: true },
  { key: 'regCode', label: 'REG Code', type: 'text', required: true },
  { key: 'month', label: 'Month', type: 'select', required: true, options: MONTHS },
  { key: 'year', label: 'Year', type: 'number', required: true },
];

export const PRODUCTION_DETAIL_FIELDS = [
  { key: 'devicesInstalled', label: 'Devices Installed' },
  { key: 'productionCapacity', label: 'Production Capacity' },
  { key: 'devicesInUse', label: 'Devices in Use' },
  { key: 'daysWorked', label: 'Days Worked' },
  { key: 'mandaysUsed', label: 'Mandays Used' },
  { key: 'cocoonUsedKg', label: 'Cocoon Used (kg)' },
  { key: 'valueOfCocoonUsed', label: 'Value of Cocoon Used' },
  { key: 'valueOfFuelUsed', label: 'Value of Fuel Used' },
  { key: 'silkProducedQty', label: 'Qty of Silk Produced' },
  { key: 'valueOfSilkProduced', label: 'Value of Silk Produced' },
  { key: 'renditaPercent', label: 'Rendita %', computed: true },
];

export const COST_OF_PRODUCTION_FIELDS = [
  { key: 'totalNscExpenditure', label: 'Total NSC Expenditure', computed: true },
  { key: 'saleValueByeProducts', label: 'Sale Value of Bye Products', input: true },
  { key: 'netNscExpenditure', label: 'Net NSC Expenditure (1 − 2)', computed: true },
  { key: 'costPerKgWithStaff', label: 'Cost of Production/Kg (with staff)', computed: true },
  { key: 'costPerKgWithoutStaff', label: 'Cost of Production/Kg (without staff)', computed: true },
];
