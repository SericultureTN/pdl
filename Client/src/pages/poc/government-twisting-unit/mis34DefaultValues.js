import {
  FINANCIAL_BUDGET_ROWS,
  FINANCIAL_BUDGET_COLUMNS,
  HEADER_FIELDS,
  PRODUCTION_DETAIL_FIELDS,
  STOCK_PARTICULAR_ITEMS,
  STOCK_PARTICULAR_COLUMNS,
  RECEIPT_ITEMS,
  SILK_SALES_ROWS,
  RAW_SILK_PURCHASED_ROWS,
  MACHINE_STOCK_ROWS,
  READY_SILK_ROWS,
  NSC_EXPENDITURE_ROWS,
  COST_OF_PRODUCTION_FIELDS,
  ESTIMATED_RECEIPT_ROWS,
  READY_SILK_SOLD_ROWS,
  TWISTED_WASTE_SOLD_ROWS,
  PENDING_READY_ROWS,
  PENDING_WASTE_ROWS,
  PRESENT_RATE_FIELDS,
  CAPACITY_FIELDS,
  MIS34_FORM_CODE,
  MIS34_UNIT_TYPE,
} from './mis34Constants.js';

function emptyRow(columns) {
  return Object.fromEntries(columns.map((col) => [col.key, '']));
}

function buildMatrixRows(rows, columns) {
  return Object.fromEntries(rows.map((row) => [row.key, emptyRow(columns)]));
}

function buildPeriodRows(rows, extraField) {
  return Object.fromEntries(
    rows.map((row) => {
      const base = { duringMonth: '', uptoMonth: '' };
      if (extraField && row.key === extraField.rowKey) {
        base[extraField.key] = '';
      }
      return [row.key, base];
    })
  );
}

function buildWarpWeftPeriodRows(rows) {
  const emptyPair = () => ({ warp: '', weft: '' });
  return Object.fromEntries(
    rows.map((row) => [
      row.key,
      { duringMonth: emptyPair(), uptoMonth: emptyPair() },
    ])
  );
}

function buildNscExpenditurePeriod() {
  return Object.fromEntries(
    NSC_EXPENDITURE_ROWS.map((row) => [
      row.key,
      { duringMonth: '', uptoMonth: '' },
    ])
  );
}

function buildStockParticulars() {
  return Object.fromEntries(
    STOCK_PARTICULAR_ITEMS.map((item) => [
      item.key,
      Object.fromEntries(STOCK_PARTICULAR_COLUMNS.map((col) => [col.key, ''])),
    ])
  );
}

function buildReceipts() {
  return Object.fromEntries(
    RECEIPT_ITEMS.filter((item) => !item.computed).map((item) => [
      item.key,
      { valueRs: '', cash: '' },
    ])
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

function buildSimpleFields(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

function buildAmountRows(rows) {
  return Object.fromEntries(rows.filter((r) => !r.computed).map((r) => [r.key, '']));
}

export function createMis34DefaultValues() {
  return {
    header: buildSimpleFields(HEADER_FIELDS),
    tab1: {
      achievementPhysical: {
        rawProducedTarget: '',
        rawProducedAchieved: '',
        twistedSilkTarget: '',
        twistedSilkAchieved: '',
      },
      achievementFinancial: buildMatrixRows(FINANCIAL_BUDGET_ROWS, FINANCIAL_BUDGET_COLUMNS),
      productionDetails: buildSimpleFields(PRODUCTION_DETAIL_FIELDS),
      stockParticulars: buildStockParticulars(),
      receipts: buildReceipts(),
      silkSalesRealisation: buildSilkSales(),
    },
    tab2: {
      rawSilkPurchased: buildPeriodRows(RAW_SILK_PURCHASED_ROWS, { rowKey: 'purchasedReceived', key: 'sourceUnit' }),
      machineStock: buildPeriodRows(MACHINE_STOCK_ROWS),
      readySilkTwisting: buildWarpWeftPeriodRows(READY_SILK_ROWS),
      nscExpenditure: buildNscExpenditurePeriod(),
    },
    tab3: {
      costOfProduction: buildSimpleFields(COST_OF_PRODUCTION_FIELDS),
      estimatedReceiptDetails: buildSimpleFields(ESTIMATED_RECEIPT_ROWS),
      actualReceiptDetails: {
        readySilkSold: buildAmountRows(READY_SILK_SOLD_ROWS),
        twistedWasteSold: buildAmountRows(TWISTED_WASTE_SOLD_ROWS),
        pendingReadySilk: buildAmountRows(PENDING_READY_ROWS),
        pendingTwistedWaste: buildAmountRows(PENDING_WASTE_ROWS),
        presentRates: buildSimpleFields(PRESENT_RATE_FIELDS),
      },
      capacityOfUnit: buildSimpleFields(CAPACITY_FIELDS),
      profitLoss: { amount: '', isProfit: true },
    },
    meta: {
      unitType: MIS34_UNIT_TYPE,
      savedTabs: [],
      status: 'draft',
    },
  };
}

export const MIS34_STORAGE_KEY = 'pdl-mis34-government-twisting-unit';

export function loadMis34Draft() {
  const defaults = createMis34DefaultValues();
  try {
    const raw = localStorage.getItem(MIS34_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;
    return {
      ...defaults,
      ...parsed,
      header: { ...defaults.header, ...(parsed.header || {}) },
      tab1: { ...defaults.tab1, ...(parsed.tab1 || {}) },
      tab2: { ...defaults.tab2, ...(parsed.tab2 || {}) },
      tab3: { ...defaults.tab3, ...(parsed.tab3 || {}) },
      meta: { ...defaults.meta, ...(parsed.meta || {}), unitType: MIS34_UNIT_TYPE },
    };
  } catch {
    localStorage.removeItem(MIS34_STORAGE_KEY);
    return defaults;
  }
}

export function saveMis34Draft(data) {
  localStorage.setItem(MIS34_STORAGE_KEY, JSON.stringify({
    ...data,
    meta: { ...data.meta, unitType: MIS34_UNIT_TYPE },
  }));
}
