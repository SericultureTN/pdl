// Excel export for the Government Reeling Unit (MIS-37) report.
//
// The field/section layout mirrored here is intentionally a light, Node-side
// copy of Client/src/pages/poc/government-reeling-unit/mis37Constants.js —
// Client and Node deploy as two separate Vercel projects (see
// Node/vercel.json and Client/vercel.json), so a cross-package import would
// break in production even though it works locally. Keep this file's row/
// column labels in sync with mis37Constants.js by hand if that schema changes.
//
// Layout is best-effort against the on-screen form structure until
// PDL_Govt_Reeling_format.xlsx (the original paper-form layout) is supplied,
// at which point this should be revised to match it cell-for-cell.

const TIME_PERIOD_COLUMNS = ['U.L.M', 'D.M', 'U.M'];

const ACHIEVEMENT_PHYSICAL_ROWS = [
  { key: 'target', label: 'Target (Kgs)' },
  { key: 'achieved', label: 'Achieved (Kgs)' },
];

const FINANCIAL_BUDGET_ROWS = [
  { key: 'reeledCocoonsValue', label: 'Reeled Cocoons Value' },
  { key: 'wagesPaid', label: 'Wages Paid' },
  { key: 'fuelCost', label: 'Fuel Cost' },
  { key: 'ebCharges', label: 'E.B. Charges' },
  { key: 'maintenanceCharges', label: 'Maintenance Charges' },
  { key: 'transportCharges', label: 'Transport Charges' },
  { key: 'others', label: 'Others' },
];

const PRODUCTION_DETAIL_FIELDS = [
  { key: 'devicesInstalled', label: 'Devices Installed' },
  { key: 'productionCapacity', label: 'Production Capacity (Kgs)' },
  { key: 'devicesInUse', label: 'Devices in Use' },
];

const PRODUCTION_WORK_ROWS = [
  { key: 'daysWorked', label: 'Days Worked' },
  { key: 'mandaysUsed', label: 'Mandays Used' },
];

const STOCK_PARTICULAR_ITEMS = [
  { key: 'cocoon', label: 'Cocoon' },
  { key: 'rawSilk', label: 'Raw Silk' },
  { key: 'silkWaste', label: 'Silk Waste' },
  { key: 'degummedWaste', label: 'Degummed Waste' },
  { key: 'throwsterWaste', label: 'Throwster Waste' },
  { key: 'doubleCocoon', label: 'Double Cocoon' },
  { key: 'others', label: 'Others' },
];

const RECEIPT_ITEMS = [
  { key: 'rawSilk', label: 'Raw Silk' },
  { key: 'silkWaste', label: 'Silk Waste' },
  { key: 'dWaste', label: 'D.Waste' },
  { key: 'thWaste', label: 'Th.Waste' },
  { key: 'fCocoon', label: 'F.Cocoon' },
  { key: 'dCocoon', label: 'D.Cocoon' },
  { key: 'others', label: 'Others' },
];

const COCOON_STOCK_ROWS = [
  { key: 'openingBalance', label: 'Opening Balance' },
  { key: 'purchased', label: 'Purchased' },
  { key: 'reeled', label: 'Reeled' },
  { key: 'closingStock', label: 'Closing Stock' },
];

const NSC_EXPENDITURE_ROWS = [
  { key: 'reeledCocoonsValue', label: 'Reeled Cocoons Value' },
  { key: 'wagesPaid', label: 'Wages Paid' },
  { key: 'fuelCost', label: 'Fuel Cost' },
  { key: 'ebCharges', label: 'E.B. Charges' },
  { key: 'maintenanceCharges', label: 'Maintenance Charges' },
  { key: 'transportCharges', label: 'Transport Charges' },
  { key: 'others', label: 'Others' },
  { key: 'total', label: 'Total NSC Expenditure' },
];

const COST_DETAIL_FIELDS = [
  { key: 'avgSrPercentCocoon', label: 'Average S.R.% Cocoon' },
  { key: 'assessedRendita', label: 'Assessed Rendita' },
  { key: 'assessedSilkKg', label: 'Assessed Silk Kg' },
  { key: 'actualSilkKg', label: 'Actual Silk Kg' },
  { key: 'avgCocoonCostPerKg', label: 'Average Cocoon Cost/Kg' },
  { key: 'actualRendita', label: 'Actual Rendita' },
  { key: 'fuelCostPerKg', label: 'Fuel Cost/Kg' },
  { key: 'conversionCostPerKg', label: 'Conversion Cost/Kg' },
  { key: 'mandaysPerKg', label: 'Mandays/Kg' },
];

const COST_OF_PRODUCTION_ROWS = [
  { key: 'totalNscExpenditure', label: 'Total NSC Expenditure', timePeriod: true },
  { key: 'saleValueByeProducts', label: 'Sale Value of Bye Products', timePeriod: true },
  { key: 'netNscExpenditure', label: 'Net NSC Expenditure', timePeriod: true },
  { key: 'costPerKgWithStaff', label: 'Cost of Production/Kg (with staff)', timePeriod: false },
  { key: 'costPerKgWithoutStaff', label: 'Cost of Production/Kg (without staff)', timePeriod: false },
];

const STOCK_KGS_ITEMS = [
  { key: 'cocoons', label: 'Cocoons' },
  { key: 'fireWood', label: 'Fire Wood' },
  { key: 'silkWaste', label: 'Silk Waste' },
  { key: 'degummedWaste', label: 'Degummed Waste' },
  { key: 'throwsterWaste', label: 'Throwster Waste' },
  { key: 'doubleCocoon', label: 'Double Cocoon' },
  { key: 'rawSilk', label: 'Raw Silk' },
];

const ESTIMATED_SALE_ROWS = [
  { key: 'rawSilk', label: 'Raw Silk @ Rs/Kg', timePeriod: true },
  { key: 'byeProducts', label: 'Bye Products', timePeriod: true },
  { key: 'total', label: 'Total', timePeriod: true },
];

const ACTUAL_RECEIPT_ROWS = [
  { path: 'silkSold.currentYear', label: 'Silk Sold' },
  { path: 'byeProductsSold.previousYear', label: 'Bye Products Sold' },
];

function getVal(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function blank(v) {
  return v === undefined || v === null || v === '' ? '' : v;
}

function headerRows(header = {}) {
  return [
    ['Report Type', 'Government Reeling Unit'],
    ['Unit Name', blank(header.unitName)],
    ['AD Code', blank(header.adCode)],
    ['DIS Code', blank(header.disCode)],
    ['REG Code', blank(header.regCode)],
    ['Month', blank(header.month)],
    ['Year', blank(header.year)],
    [],
  ];
}

function buildTab1Sheet(data) {
  const rows = [];
  rows.push(...headerRows(data.header));

  rows.push(['ACHIEVEMENT TO TARGET — PHYSICAL']);
  rows.push(['Particulars', ...TIME_PERIOD_COLUMNS]);
  const ap = data.tab1?.achievementPhysical || {};
  ACHIEVEMENT_PHYSICAL_ROWS.forEach(({ key, label }) => {
    rows.push([label, blank(ap[key]?.ulm), blank(ap[key]?.dm), blank(ap[key]?.um)]);
  });
  rows.push([]);

  rows.push(['ACHIEVEMENT TO TARGET — FINANCIAL CONTROL BUDGET']);
  rows.push(['Category', 'Outlay (Yearly)', 'Expenses (D.M)', 'Variance']);
  const af = data.tab1?.achievementFinancial || {};
  FINANCIAL_BUDGET_ROWS.forEach(({ key, label }) => {
    const row = af[key] || {};
    rows.push([label, blank(row.budgetOutlay), blank(row.expenses), blank(row.variance)]);
  });
  rows.push([]);

  rows.push(['PRODUCTION DETAILS']);
  const pd = data.tab1?.productionDetails || {};
  PRODUCTION_DETAIL_FIELDS.forEach(({ key, label }) => {
    rows.push([label, blank(pd[key])]);
  });
  rows.push(['Particulars', ...TIME_PERIOD_COLUMNS]);
  PRODUCTION_WORK_ROWS.forEach(({ key, label }) => {
    rows.push([label, blank(pd[key]?.ulm), blank(pd[key]?.dm), blank(pd[key]?.um)]);
  });
  rows.push([]);

  rows.push(['STOCK PARTICULARS']);
  rows.push(['Item', 'Opening Balance', 'Stock Added', 'Total', 'Consumed/Sold/Disposed', 'Closing Balance']);
  const sp = data.tab1?.stockParticulars || {};
  STOCK_PARTICULAR_ITEMS.forEach(({ key, label }) => {
    const row = sp[key] || {};
    rows.push([
      label,
      blank(row.openingBalance),
      blank(row.stockAdded),
      blank(row.total),
      blank(row.consumedSoldDisposed),
      blank(row.closingBalance),
    ]);
  });
  rows.push([]);

  rows.push(['RECEIPTS']);
  rows.push(['Item', ...TIME_PERIOD_COLUMNS]);
  const receipts = data.tab1?.receipts || {};
  RECEIPT_ITEMS.forEach(({ key, label }) => {
    const valueRs = receipts[key]?.valueRs || {};
    rows.push([label, blank(valueRs.ulm), blank(valueRs.dm), blank(valueRs.um)]);
  });

  return rows;
}

function buildTab2Sheet(data) {
  const rows = [];
  rows.push(...headerRows(data.header));

  rows.push(['COCOON STOCK MOVEMENT']);
  rows.push(['Stage', 'Qty D.M', 'Qty U.M', 'Value D.M', 'Value U.M']);
  const csm = data.tab2?.cocoonStockMovement || {};
  COCOON_STOCK_ROWS.forEach(({ key, label }) => {
    const row = csm[key] || {};
    rows.push([
      label,
      blank(row.qty?.dm),
      blank(row.qty?.um),
      blank(row.value?.dm),
      blank(row.value?.um),
    ]);
  });
  rows.push([]);

  rows.push(['NSC EXPENDITURE']);
  rows.push(['Particulars', ...TIME_PERIOD_COLUMNS]);
  const nsc = data.tab2?.nscExpenditure || {};
  NSC_EXPENDITURE_ROWS.forEach(({ key, label }) => {
    const row = nsc[key] || {};
    rows.push([label, blank(row.ulm), blank(row.dm), blank(row.um)]);
  });
  rows.push([]);

  rows.push(['COST DETAILS (rates — no U.L.M)']);
  rows.push(['Particulars', 'D.M', 'U.M']);
  const cd = data.tab2?.costDetails || {};
  COST_DETAIL_FIELDS.forEach(({ key, label }) => {
    const row = cd[key] || {};
    rows.push([label, blank(row.dm), blank(row.um)]);
  });
  rows.push([]);

  rows.push(['COST OF PRODUCTION']);
  rows.push(['Particulars', 'U.L.M', 'D.M', 'U.M']);
  const cop = data.tab2?.costOfProduction || {};
  COST_OF_PRODUCTION_ROWS.forEach(({ key, label, timePeriod }) => {
    const row = cop[key] || {};
    rows.push([label, timePeriod ? blank(row.ulm) : '', blank(row.dm), blank(row.um)]);
  });

  return rows;
}

function buildTab3Sheet(data) {
  const rows = [];
  rows.push(...headerRows(data.header));

  rows.push(['STOCK DETAILS (KGS)']);
  rows.push(['Item', 'Opening Balance', 'Purchase', 'Total', 'Sold/Issued', 'Closing Balance']);
  const sk = data.tab3?.stockDetailsKgs || {};
  STOCK_KGS_ITEMS.forEach(({ key, label }) => {
    const row = sk[key] || {};
    rows.push([
      label,
      blank(row.openingBalance),
      blank(row.purchase),
      blank(row.total),
      blank(row.soldIssued),
      blank(row.closingBalance),
    ]);
  });
  rows.push([]);

  rows.push(['ESTIMATED SALE VALUE']);
  rows.push(['Particulars', ...TIME_PERIOD_COLUMNS]);
  const esv = data.tab3?.estimatedSaleValue || {};
  ESTIMATED_SALE_ROWS.forEach(({ key, label }) => {
    const row = esv[key] || {};
    rows.push([label, blank(row.ulm), blank(row.dm), blank(row.um)]);
  });
  rows.push([]);

  rows.push(['ACTUAL RECEIPT DETAILS']);
  rows.push(['Particulars', 'Qty U.L.M', 'Qty D.M', 'Qty U.M', 'Value U.L.M', 'Value D.M', 'Value U.M']);
  const ard = data.tab3?.actualReceiptDetails || {};
  ACTUAL_RECEIPT_ROWS.forEach(({ path, label }) => {
    const row = getVal(ard, path) || {};
    rows.push([
      label,
      blank(row.qty?.ulm),
      blank(row.qty?.dm),
      blank(row.qty?.um),
      blank(row.value?.ulm),
      blank(row.value?.dm),
      blank(row.value?.um),
    ]);
  });
  rows.push([]);

  rows.push(['PROFIT / LOSS']);
  rows.push(['Period', 'Result', 'Amount (Rs)']);
  const pl = data.tab3?.profitLoss || {};
  rows.push(['D.M', pl.dmIsProfit ? 'Profit' : 'Loss', blank(pl.dm)]);
  rows.push(['U.M', pl.umIsProfit ? 'Profit' : 'Loss', blank(pl.um)]);

  return rows;
}

/** Builds a 3-sheet workbook (one report = one office/month) — Achievement/Production,
 * Stock & Cost Details, Sales/Machinery/P&L, matching the on-screen form's 3 tabs. */
export async function buildGovtReelingWorkbook(reports) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const list = Array.isArray(reports) ? reports : [reports];

  if (list.length === 1) {
    const { data } = list[0];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildTab1Sheet(data)), 'Achievement-Production');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildTab2Sheet(data)), 'Stock-Cost Details');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildTab3Sheet(data)), 'Sales-Machinery-PL');
  } else {
    // Multi-office ("All Offices"): one 3-sheet block per office, sheet names
    // suffixed and truncated to Excel's 31-char sheet-name limit.
    list.forEach(({ officeName, data }, index) => {
      const suffix = ` - ${officeName || `Office ${index + 1}`}`;
      const nameFor = (base) => `${base}${suffix}`.slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildTab1Sheet(data)), nameFor('Achv-Prod'));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildTab2Sheet(data)), nameFor('Stock-Cost'));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildTab3Sheet(data)), nameFor('Sales-PL'));
    });
  }

  const buffer = await XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}
