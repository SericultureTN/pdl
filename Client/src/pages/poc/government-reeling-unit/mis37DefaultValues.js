import {
  FINANCIAL_BUDGET_ROWS,
  STOCK_PARTICULAR_ITEMS,
  RECEIPT_ITEMS,
  SILK_SALES_ROWS,
  COCOON_STOCK_ROWS,
  NSC_EXPENDITURE_ROWS,
  COST_DETAIL_FIELDS,
  STOCK_KGS_ITEMS,
  ESTIMATED_SALE_ROWS,
  ACTUAL_RECEIPT_SILK_ROWS,
  ACTUAL_RECEIPT_BYE_ROWS,
  PENDING_AMOUNT_ROWS,
  MACHINERY_FIELDS,
  HEADER_FIELDS,
  PRODUCTION_DETAIL_FIELDS,
  COST_OF_PRODUCTION_FIELDS,
} from './mis37Constants.js';

function emptyRow(columns) {
  return Object.fromEntries(columns.map((col) => [col.key, '']));
}

function buildMatrixRows(rows, columns) {
  return Object.fromEntries(
    rows.map((row) => [row.key, emptyRow(columns)])
  );
}

function buildStockParticulars() {
  const fields = ['openingBalance', 'stockAdded', 'underProcess', 'stockDisposedQty', 'stockDisposedValue', 'closingBalance'];
  return Object.fromEntries(
    STOCK_PARTICULAR_ITEMS.map((item) => [
      item.key,
      Object.fromEntries(fields.map((f) => [f, ''])),
    ])
  );
}

function buildReceipts() {
  return Object.fromEntries(
    RECEIPT_ITEMS.map((item) => [item.key, { valueRs: '', cash: '' }])
  );
}

function buildSilkSales() {
  const fields = ['qtyDm', 'qtyUm', 'valueDm', 'valueUm'];
  return Object.fromEntries(
    SILK_SALES_ROWS.map((row) => [
      row.key,
      Object.fromEntries(fields.map((f) => [f, ''])),
    ])
  );
}

function buildCocoonStockMovement() {
  const fields = [
    'csrDuringQty', 'csrDuringValue', 'cbDuringQty', 'cbDuringValue',
    'csrUptoQty', 'csrUptoValue', 'cbUptoQty', 'cbUptoValue',
  ];
  return Object.fromEntries(
    COCOON_STOCK_ROWS.map((row) => [
      row.key,
      Object.fromEntries(fields.map((f) => [f, ''])),
    ])
  );
}

function buildNscExpenditure() {
  return Object.fromEntries(
    NSC_EXPENDITURE_ROWS.map((row) => [row.key, ''])
  );
}

function buildCostDetails() {
  const result = {};
  COST_DETAIL_FIELDS.forEach((field) => {
    result[field.assessedKey] = '';
    result[field.actualKey] = '';
  });
  return result;
}

function buildStockKgs() {
  const fields = ['openingBalance', 'purchase', 'total', 'soldIssued', 'closingBalance'];
  return Object.fromEntries(
    STOCK_KGS_ITEMS.map((item) => [
      item.key,
      Object.fromEntries(fields.map((f) => [f, ''])),
    ])
  );
}

function buildEstimatedSaleValue() {
  const fields = ['dm', 'um'];
  return Object.fromEntries(
    ESTIMATED_SALE_ROWS.map((row) => [
      row.key,
      Object.fromEntries(fields.map((f) => [f, ''])),
    ])
  );
}

function buildActualReceiptQtyValue(rows) {
  return Object.fromEntries(
    rows.map((row) => [row.key, { qty: '', value: '' }])
  );
}

function buildPendingAmounts() {
  return Object.fromEntries(
    PENDING_AMOUNT_ROWS.map((row) => [row.key, ''])
  );
}

function buildSimpleFields(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

export function createMis37DefaultValues() {
  return {
    header: buildSimpleFields(HEADER_FIELDS),
    tab1: {
      achievementPhysical: { targetKg: '', achievedKg: '' },
      achievementFinancial: buildMatrixRows(FINANCIAL_BUDGET_ROWS, [
        { key: 'outlayDm' }, { key: 'outlayUm' }, { key: 'outlayAnnual' },
        { key: 'expensesDm' }, { key: 'expensesUm' }, { key: 'expensesAnnual' },
      ]),
      productionDetails: buildSimpleFields(PRODUCTION_DETAIL_FIELDS),
      stockParticulars: buildStockParticulars(),
      receipts: buildReceipts(),
      silkSalesRealisation: buildSilkSales(),
    },
    tab2: {
      cocoonStockMovement: buildCocoonStockMovement(),
      nscExpenditure: buildNscExpenditure(),
      costDetails: buildCostDetails(),
      costOfProduction: buildSimpleFields(COST_OF_PRODUCTION_FIELDS),
    },
    tab3: {
      stockDetailsKgs: buildStockKgs(),
      estimatedSaleValue: buildEstimatedSaleValue(),
      actualReceiptDetails: {
        silkSold: buildActualReceiptQtyValue(ACTUAL_RECEIPT_SILK_ROWS),
        byeProductsSold: buildActualReceiptQtyValue(ACTUAL_RECEIPT_BYE_ROWS),
        pendingWithExchange: buildPendingAmounts(),
      },
      machineryWorking: buildSimpleFields(MACHINERY_FIELDS),
      profitLoss: { dm: '', um: '', dmIsProfit: true, umIsProfit: true },
    },
    meta: {
      savedTabs: [],
      status: 'draft',
    },
  };
}

export const MIS37_STORAGE_KEY = 'pdl-mis37-government-reeling-unit';
