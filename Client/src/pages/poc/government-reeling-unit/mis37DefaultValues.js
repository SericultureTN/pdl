import {
  FINANCIAL_BUDGET_ROWS,
  FINANCIAL_BUDGET_COLUMNS,
  ACHIEVEMENT_PHYSICAL_ROWS,
  STOCK_PARTICULAR_ITEMS,
  RECEIPT_ITEMS,
  COCOON_STOCK_ROWS,
  NSC_EXPENDITURE_ROWS,
  COST_DETAIL_FIELDS,
  STOCK_KGS_ITEMS,
  ESTIMATED_SALE_ROWS,
  HEADER_FIELDS,
  PRODUCTION_DETAIL_FIELDS,
  PRODUCTION_WORK_ROWS,
  COST_OF_PRODUCTION_FIELDS,
} from './mis37Constants.js';

function emptyTimePeriod() {
  return { ulm: '', dm: '', um: '' };
}

function emptyFinancialCategory() {
  return Object.fromEntries(
    FINANCIAL_BUDGET_COLUMNS.map((col) => [col.key, ''])
  );
}

function buildAchievementPhysical() {
  return Object.fromEntries(
    ACHIEVEMENT_PHYSICAL_ROWS.map((row) => [row.key, emptyTimePeriod()])
  );
}

function buildAchievementFinancial() {
  return Object.fromEntries(
    FINANCIAL_BUDGET_ROWS.map((row) => [row.key, emptyFinancialCategory()])
  );
}

function buildStockParticulars() {
  const fields = [
    'openingBalance',
    'stockAdded',
    'total',
    'consumedSoldDisposed',
    'closingBalance',
  ];
  return Object.fromEntries(
    STOCK_PARTICULAR_ITEMS.map((item) => [
      item.key,
      Object.fromEntries(fields.map((f) => [f, ''])),
    ])
  );
}

function buildReceipts() {
  return Object.fromEntries(
    RECEIPT_ITEMS.map((item) => [
      item.key,
      { valueRs: emptyTimePeriod() },
    ])
  );
}

function buildCocoonStockMovement() {
  return Object.fromEntries(
    COCOON_STOCK_ROWS.map((row) => [
      row.key,
      {
        qty: emptyTimePeriod(),
        value: emptyTimePeriod(),
      },
    ])
  );
}

function buildNscExpenditure() {
  const rows = Object.fromEntries(
    NSC_EXPENDITURE_ROWS.filter((r) => !r.computed).map((row) => [row.key, emptyTimePeriod()])
  );
  rows.total = { ulm: '', dm: '', um: '' };
  return rows;
}

function buildCostDetails() {
  return Object.fromEntries(
    COST_DETAIL_FIELDS.map((field) => [field.key, { dm: '', um: '' }])
  );
}

function buildCostOfProduction() {
  return {
    totalNscExpenditure: emptyTimePeriod(),
    saleValueByeProducts: emptyTimePeriod(),
    netNscExpenditure: emptyTimePeriod(),
    costPerKgWithStaff: emptyTimePeriod(),
    costPerKgWithoutStaff: emptyTimePeriod(),
  };
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
  return Object.fromEntries(
    ESTIMATED_SALE_ROWS.map((row) => [row.key, emptyTimePeriod()])
  );
}

function buildQtyValueTimePeriod() {
  return { qty: emptyTimePeriod(), value: emptyTimePeriod() };
}

/** Current Year and Previous Year are independent rows, each U.L.M/D.M/U.M (D.M editable,
 * U.M = U.L.M + D.M, U.L.M carried forward month to month) for both Qty and Value. */
function buildActualReceiptQtyValue() {
  return {
    currentYear: buildQtyValueTimePeriod(),
    previousYear: buildQtyValueTimePeriod(),
  };
}

function buildSimpleFields(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

function buildProductionDetails() {
  return {
    ...buildSimpleFields(PRODUCTION_DETAIL_FIELDS),
    ...Object.fromEntries(PRODUCTION_WORK_ROWS.map((row) => [row.key, emptyTimePeriod()])),
  };
}

export function createMis37DefaultValues() {
  return {
    header: { ...buildSimpleFields(HEADER_FIELDS), region: '', marketOfficeId: '' },
    tab1: {
      achievementPhysical: buildAchievementPhysical(),
      achievementFinancial: buildAchievementFinancial(),
      productionDetails: buildProductionDetails(),
      stockParticulars: buildStockParticulars(),
      receipts: buildReceipts(),
    },
    tab2: {
      cocoonStockMovement: buildCocoonStockMovement(),
      nscExpenditure: buildNscExpenditure(),
      costDetails: buildCostDetails(),
      costOfProduction: buildCostOfProduction(),
    },
    tab3: {
      stockDetailsKgs: buildStockKgs(),
      estimatedSaleValue: buildEstimatedSaleValue(),
      actualReceiptDetails: {
        silkSold: buildActualReceiptQtyValue(),
        byeProductsSold: buildActualReceiptQtyValue(),
      },
      profitLoss: { dm: '', um: '', dmIsProfit: true, umIsProfit: true },
    },
    meta: {
      savedTabs: [],
      status: 'draft',
      locked: false,
      submittedAt: null,
      submittedBy: null,
      ulmCarriedFrom: null,
      ulmCarriedAt: null,
      ulmLocked: false,
      financialYearKey: '',
    },
  };
}

export const MIS37_STORAGE_KEY = 'pdl-mis37-government-reeling-unit';

export function mergeMis37StoredReport(parsed) {
  const defaults = createMis37DefaultValues();
  return {
    ...defaults,
    ...parsed,
    header: { ...defaults.header, ...(parsed.header || {}) },
    tab1: {
      ...defaults.tab1,
      ...(parsed.tab1 || {}),
      achievementPhysical: mergeAchievementPhysical(
        defaults.tab1.achievementPhysical,
        parsed.tab1?.achievementPhysical
      ),
      achievementFinancial: mergeAchievementFinancial(
        defaults.tab1.achievementFinancial,
        parsed.tab1?.achievementFinancial
      ),
      stockParticulars: mergeStockParticulars(
        defaults.tab1.stockParticulars,
        parsed.tab1?.stockParticulars
      ),
      receipts: mergeReceipts(defaults.tab1.receipts, parsed.tab1?.receipts),
    },
    tab2: { ...defaults.tab2, ...(parsed.tab2 || {}),
      cocoonStockMovement: mergeCocoonStockMovement(
        defaults.tab2.cocoonStockMovement,
        parsed.tab2?.cocoonStockMovement
      ),
      nscExpenditure: mergeNscExpenditure(defaults.tab2.nscExpenditure, parsed.tab2?.nscExpenditure),
      costDetails: mergeCostDetails(defaults.tab2.costDetails, parsed.tab2?.costDetails),
      costOfProduction: mergeCostOfProduction(
        defaults.tab2.costOfProduction,
        parsed.tab2?.costOfProduction
      ),
    },
    tab3: mergeTab3(defaults.tab3, parsed.tab3),
    meta: { ...defaults.meta, ...(parsed.meta || {}) },
  };
}

export function loadMis37Draft() {
  const defaults = createMis37DefaultValues();
  try {
    const raw = localStorage.getItem(MIS37_STORAGE_KEY);
    if (!raw) return defaults;
    return mergeMis37StoredReport(JSON.parse(raw));
  } catch {
    localStorage.removeItem(MIS37_STORAGE_KEY);
    return defaults;
  }
}

function mergeCocoonStockMovement(defaults, saved) {
  if (!saved) return defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => {
      const legacy = saved[key];
      if (legacy?.qty?.dm !== undefined || legacy?.qty?.ulm !== undefined) {
        return [key, { ...defaults[key], ...legacy }];
      }
      if (legacy?.csrDuringQty !== undefined) {
        return [key, {
          qty: {
            ulm: '',
            dm: legacy.csrDuringQty ?? '',
            um: legacy.csrUptoQty ?? '',
          },
          value: {
            ulm: '',
            dm: legacy.csrDuringValue ?? '',
            um: legacy.csrUptoValue ?? '',
          },
        }];
      }
      return [key, defaults[key]];
    })
  );
}

function mergeNscExpenditure(defaults, saved) {
  if (!saved) return defaults;
  const merged = { ...defaults };
  NSC_EXPENDITURE_ROWS.filter((r) => !r.computed).forEach(({ key }) => {
    const legacy = saved[key];
    if (legacy?.dm !== undefined || legacy?.ulm !== undefined) {
      merged[key] = { ...defaults[key], ...legacy };
    } else if (typeof legacy === 'string' || typeof legacy === 'number') {
      merged[key] = { ulm: '', dm: legacy ?? '', um: '' };
    }
  });
  if (saved.total?.dm !== undefined) {
    merged.total = { ...defaults.total, ...saved.total };
  }
  return merged;
}

// Cost Details has no U.L.M column — any U.L.M on an older saved report (from before it
// was removed) is dropped here rather than carried into the {dm, um} shape.
function mergeCostDetails(defaults, saved) {
  if (!saved) return defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => {
      const legacy = saved[key];
      if (legacy?.dm !== undefined || legacy?.um !== undefined) {
        return [key, { dm: legacy.dm ?? '', um: legacy.um ?? '' }];
      }
      const legacyActual = saved[`actual${key.charAt(0).toUpperCase()}${key.slice(1)}`];
      const legacyAssessed = saved[`assessed${key.charAt(0).toUpperCase()}${key.slice(1)}`];
      if (legacyActual !== undefined || legacyAssessed !== undefined) {
        const val = legacyActual ?? legacyAssessed ?? '';
        return [key, { dm: val, um: val }];
      }
      return [key, defaults[key]];
    })
  );
}

function mergeCostOfProduction(defaults, saved) {
  if (!saved) return defaults;
  const merged = { ...defaults };
  if (saved.saleValueByeProducts?.dm !== undefined) {
    merged.saleValueByeProducts = { ...defaults.saleValueByeProducts, ...saved.saleValueByeProducts };
  } else if (typeof saved.saleValueByeProducts === 'string' || typeof saved.saleValueByeProducts === 'number') {
    merged.saleValueByeProducts = { ulm: '', dm: saved.saleValueByeProducts ?? '', um: '' };
  }
  ['totalNscExpenditure', 'netNscExpenditure'].forEach((key) => {
    if (saved[key]?.dm !== undefined || saved[key]?.ulm !== undefined) {
      merged[key] = { ...defaults[key], ...saved[key] };
    } else if (typeof saved[key] === 'string' || typeof saved[key] === 'number') {
      merged[key] = { ulm: '', dm: saved[key] ?? '', um: saved[key] ?? '' };
    }
  });
  ['costPerKgWithStaff', 'costPerKgWithoutStaff'].forEach((key) => {
    if (saved[key]?.dm !== undefined || saved[key]?.ulm !== undefined) {
      merged[key] = { ...defaults[key], ...saved[key] };
    } else if (typeof saved[key] === 'string' || typeof saved[key] === 'number') {
      merged[key] = { ulm: '', dm: saved[key] ?? '', um: '' };
    }
  });
  return merged;
}

function mergeAchievementPhysical(defaults, saved) {
  if (!saved) return defaults;
  if (saved.target?.dm !== undefined || saved.target?.ulm !== undefined) {
    return { ...defaults, ...saved };
  }
  return {
    target: { ulm: '', dm: saved.targetKg ?? '', um: '' },
    achieved: { ulm: '', dm: saved.achievedKg ?? '', um: '' },
  };
}

/** Rows used to be split by a Type (Outlay/Expenses) sub-key; now each row is flat. */
function mergeAchievementFinancial(defaults, saved) {
  if (!saved) return defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((rowKey) => [
      rowKey,
      { ...defaults[rowKey], ...(saved[rowKey] || {}) },
    ])
  );
}

function mergeStockParticulars(defaults, saved) {
  if (!saved) return defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => [
      key,
      { ...defaults[key], ...(saved[key] || {}) },
    ])
  );
}

function mergeReceipts(defaults, saved) {
  if (!saved) return defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => {
      const legacy = saved[key];
      if (legacy?.valueRs?.dm !== undefined || legacy?.valueRs?.ulm !== undefined) {
        return [key, { ...defaults[key], valueRs: legacy.valueRs }];
      }
      return [key, { valueRs: emptyTimePeriod() }];
    })
  );
}

function mergeEstimatedSaleValue(defaults, saved) {
  if (!saved) return defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => {
      const legacy = saved[key];
      if (legacy?.ulm !== undefined) return [key, { ...defaults[key], ...legacy }];
      if (legacy?.dm !== undefined) {
        return [key, { ulm: '', dm: legacy.dm ?? '', um: legacy.um ?? '' }];
      }
      return [key, defaults[key]];
    })
  );
}

/** Both rows moved from a flat {qty,value} pair to U.L.M/D.M/U.M; old drafts had it flat. */
function mergeTimePeriodQtyValueRow(defaults, legacy) {
  if (!legacy) return defaults;
  if (legacy.qty?.dm !== undefined || legacy.qty?.ulm !== undefined) {
    return { ...defaults, ...legacy };
  }
  return {
    qty: { ulm: '', dm: legacy.qty ?? '', um: '' },
    value: { ulm: '', dm: legacy.value ?? '', um: '' },
  };
}

/** {currentYear, previousYear}, each a {qty,value} time-period pair. Any legacy "total" on
 * an older saved report is dropped — Actual Receipt Details no longer has total rows. */
function mergeCurrentPreviousYearGroup(defaults, saved) {
  if (!saved) return defaults;
  return {
    currentYear: mergeTimePeriodQtyValueRow(defaults.currentYear, saved.currentYear),
    previousYear: mergeTimePeriodQtyValueRow(defaults.previousYear, saved.previousYear),
  };
}

function mergeTab3(defaults, saved) {
  if (!saved) return defaults;
  return {
    ...defaults,
    ...saved,
    stockDetailsKgs: {
      ...defaults.stockDetailsKgs,
      ...Object.fromEntries(
        Object.keys(defaults.stockDetailsKgs).map((key) => [
          key,
          { ...defaults.stockDetailsKgs[key], ...(saved.stockDetailsKgs?.[key] || {}) },
        ])
      ),
    },
    estimatedSaleValue: mergeEstimatedSaleValue(
      defaults.estimatedSaleValue,
      saved.estimatedSaleValue
    ),
    actualReceiptDetails: {
      silkSold: mergeCurrentPreviousYearGroup(
        defaults.actualReceiptDetails.silkSold,
        saved.actualReceiptDetails?.silkSold
      ),
      byeProductsSold: mergeCurrentPreviousYearGroup(
        defaults.actualReceiptDetails.byeProductsSold,
        saved.actualReceiptDetails?.byeProductsSold
      ),
    },
    profitLoss: { ...defaults.profitLoss, ...(saved.profitLoss || {}) },
  };
}
