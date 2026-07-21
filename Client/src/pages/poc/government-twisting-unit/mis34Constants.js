export const MIS34_REPORT_TITLE = 'Government Silk Twisting Unit Monthly Report';
export const MIS34_FORM_CODE = 'PDL MIS-34';
export const MIS34_UNIT_TYPE = 'twisting';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
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

export const FINANCIAL_BUDGET_ROWS = [
  { key: 'salary', label: 'Salary' },
  { key: 'cocoonCost', label: 'Cocoon Cost' },
  { key: 'rawSilkCost', label: 'Raw Silk Cost' },
  { key: 'wages', label: 'Wages' },
  { key: 'eb', label: 'EB' },
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

export const PRODUCTION_DETAIL_FIELDS = [
  { key: 'devicesSpindlesInstalled', label: 'Devices/Spindles Installed' },
  { key: 'installedProductionCapacity', label: 'Installed Production Capacity' },
  { key: 'devicesSpindlesInUse', label: 'Devices/Spindles in Use' },
  { key: 'daysWorked', label: 'Days Worked' },
  { key: 'mandaysUsed', label: 'Mandays Used' },
  { key: 'cocoonRawSilkUsedKg', label: 'Cocoon/Raw Silk Used (kg)' },
  { key: 'valueCocoonRawSilk', label: 'Value of Cocoon/Raw Silk Used' },
  { key: 'wages', label: 'Wages' },
  { key: 'powerAndFuel', label: 'Power & Fuel' },
  { key: 'transportChargesInwards', label: 'Transport Charges (Inwards)' },
  { key: 'repairsMaintenance', label: 'Repairs & Maintenance' },
  { key: 'salaries', label: 'Salaries' },
  { key: 'rent', label: 'Rent' },
  { key: 'depreciation', label: 'Depreciation' },
  { key: 'others', label: 'Others' },
  { key: 'productionRawSilkTwisted', label: 'Production of Raw Silk Twisted' },
  { key: 'totalValueOfProduction', label: 'Total Value of Production' },
  { key: 'costPerKgByProductWithStaff', label: 'Cost/Kg By-Product (with staff)', computed: true },
  { key: 'costPerKgByProductWithoutStaff', label: 'Cost/Kg By-Product (without staff)', computed: true },
];

export const STOCK_PARTICULAR_ITEMS = [
  { key: 'rawSilk', label: 'Own Production — Raw Silk' },
  { key: 'warp', label: 'Own Production — Warp' },
  { key: 'weft', label: 'Own Production — Weft' },
  { key: 'cocoon', label: 'Cocoon' },
  { key: 'silkWaste', label: 'Silk Waste' },
  { key: 'throwsterWaste', label: 'Throwster Waste' },
  { key: 'degumWaste', label: 'Degum Waste' },
  { key: 'flemcyCocoon', label: 'Flemcy Cocoon' },
  { key: 'doubleCocoon', label: 'Double Cocoon' },
  { key: 'fireWood', label: 'Fire Wood' },
];

export const STOCK_PARTICULAR_COLUMNS = [
  { key: 'openingBalance', label: 'Opening Balance (kg)' },
  { key: 'purchasedQty', label: 'Purchased Qty' },
  { key: 'purchasedValue', label: 'Purchased Value' },
  { key: 'ownProduction', label: 'Own Production' },
  { key: 'underProcess', label: 'Under Process' },
  { key: 'salesQty', label: 'Sales Made Qty' },
  { key: 'salesValue', label: 'Sales Made Value' },
  { key: 'transferStock', label: 'Transfer of Stock' },
  { key: 'closingBalance', label: 'Closing Balance (kg)', readOnly: true },
];

export const RECEIPT_ITEMS = [
  { key: 'rawSilk', label: 'Raw Silk' },
  { key: 'warpSilk', label: 'Warp Silk' },
  { key: 'weftSilk', label: 'Weft Silk' },
  { key: 'silkWaste', label: 'Silk Waste' },
  { key: 'dWaste', label: 'D.Waste' },
  { key: 'thWaste', label: 'Th.Waste' },
  { key: 'fCocoon', label: 'F.Cocoon' },
  { key: 'oCocoon', label: 'O.Cocoon' },
  { key: 'twisWaste', label: 'Twis.Waste' },
  { key: 'total', label: 'Total', computed: true },
];

export const SILK_SALES_ROWS = [
  { key: 'openingBalance', label: 'Opening Balance' },
  { key: 'sold', label: 'Sold' },
  { key: 'dueSettled', label: 'Due Settled' },
  { key: 'balance', label: 'Balance' },
];

export const PERIOD_KEYS = [
  { key: 'duringMonth', label: 'During Month' },
  { key: 'uptoMonth', label: 'Upto Month' },
];

export const RAW_SILK_PURCHASED_ROWS = [
  { key: 'openingBalance', label: 'Opening Balance' },
  { key: 'purchasedReceived', label: 'Purchased/Received' },
  { key: 'issuedForTwisting', label: 'Issued for Twisting' },
  { key: 'closingBalance', label: 'Closing Balance', readOnly: true },
];

export const MACHINE_STOCK_ROWS = [
  { key: 'openingStock', label: 'Opening Stock' },
  { key: 'rawSilkIssued', label: 'Raw Silk Issued During Month' },
  { key: 'total', label: 'Total', readOnly: true },
  { key: 'twistedSilkProduced', label: 'Twisted Silk Produced (−)' },
  { key: 'twistedWasteObtained', label: 'Twisted Waste Obtained (−)' },
  { key: 'closingMachineStock', label: 'Closing Machine Stock', readOnly: true },
];

export const READY_SILK_ROWS = [
  { key: 'quantityProduced', label: 'Quantity Produced' },
  { key: 'wasteObtained', label: 'Waste Obtained' },
  { key: 'quantitySold', label: 'Quantity Sold' },
  { key: 'closingBalance', label: 'Closing Balance', readOnly: true },
  { key: 'depositedTansilk', label: 'Deposited at Tansilk Branch' },
  { key: 'stockOnHand', label: 'Stock on Hand', readOnly: true },
];

export const NSC_EXPENDITURE_ROWS = [
  { key: 'rawSilkIssuedValue', label: 'Value of Raw Silk Issued for Twisting @ Rate' },
  { key: 'wagesPaid', label: 'Wages Paid' },
  { key: 'ebCharges', label: 'E.B. Charges' },
  { key: 'consumableItems', label: 'Consumable Items' },
  { key: 'transportCost', label: 'Transport Cost' },
  { key: 'otherExpenditures', label: 'Other Expenditures' },
  { key: 'total', label: 'Total NSC Expenditure', computed: true },
];

export const COST_OF_PRODUCTION_FIELDS = [
  { key: 'totalNscExpenditure', label: 'Total NSC Expenditure (from Tab 2)', computed: true },
  { key: 'lessTwistedWasteSale', label: 'Less: Sale Value of Silk Twisted Waste', input: true },
  { key: 'netExpenditure', label: 'Net Expenditure (1 − 2)', computed: true },
  { key: 'costPerKgReadySilk', label: 'Cost of Production/Kg of Ready Silk', computed: true },
];

export const ESTIMATED_RECEIPT_ROWS = [
  { key: 'readySilk', label: 'Estimated Sale Value of Ready Silk @ Rate/Kg' },
  { key: 'twistedWaste', label: 'Estimated Sale Value of Twisted Waste' },
  { key: 'total', label: 'Total Estimated Sale Value', computed: true },
];

export const READY_SILK_SOLD_ROWS = [
  { key: 'currentYear', label: 'Current Year' },
  { key: 'previousYear', label: 'Previous Year' },
  { key: 'total', label: 'Total Ready Silk Sold Amount Received', computed: true },
];

export const TWISTED_WASTE_SOLD_ROWS = [
  { key: 'currentYear', label: 'Current Year' },
  { key: 'previousYear', label: 'Previous Year' },
];

export const PENDING_READY_ROWS = [
  { key: 'currentYear', label: 'Current Year' },
  { key: 'previousYear', label: 'Previous Year' },
];

export const PENDING_WASTE_ROWS = [
  { key: 'currentYear', label: 'Current Year' },
  { key: 'previousYear', label: 'Previous Year' },
];

export const PRESENT_RATE_FIELDS = [
  { key: 'warp', label: 'Warp Rate/Kg' },
  { key: 'weft', label: 'Weft Rate/Kg' },
];

export const CAPACITY_FIELDS = [
  { key: 'numberOfSpindles', label: 'No. of Spindles' },
  { key: 'warpsWeftKgs', label: 'No. of Warps/Weft (Kgs)' },
];
