import {
  FINANCIAL_BUDGET_ROWS,
  FINANCIAL_BUDGET_COLUMNS,
  FINANCIAL_CATEGORY_TYPES,
  ACHIEVEMENT_PHYSICAL_ROWS,
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
    FINANCIAL_BUDGET_ROWS.map((row) => [
      row.key,
      Object.fromEntries(
        FINANCIAL_CATEGORY_TYPES.map((type) => [type.key, emptyFinancialCategory()])
      ),
    ])
  );
}

function buildStockParticulars() {
  const fields = [
    'openingBalance',
    'stockAdded',
    'underProcess',
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
      { valueRs: emptyTimePeriod(), cash: emptyTimePeriod() },
    ])
  );
}

function buildSilkSales() {
  return Object.fromEntries(
    SILK_SALES_ROWS.map((row) => [
      row.key,
      { qty: emptyTimePeriod(), value: emptyTimePeriod() },
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
    COST_DETAIL_FIELDS.map((field) => [field.key, emptyTimePeriod()])
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
      achievementPhysical: buildAchievementPhysical(),
      achievementFinancial: buildAchievementFinancial(),
      productionDetails: buildSimpleFields(PRODUCTION_DETAIL_FIELDS),
      stockParticulars: buildStockParticulars(),
      receipts: buildReceipts(),
      silkSalesRealisation: buildSilkSales(),
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
      locked: false,
      submittedAt: null,
      submittedBy: null,
      ulmCarriedFrom: null,
      ulmCarriedAt: null,
      ulmLocked: false,
      financialYearBudgetLocked: false,
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
      silkSalesRealisation: mergeSilkSales(
        defaults.tab1.silkSalesRealisation,
        parsed.tab1?.silkSalesRealisation
      ),
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
    tab3: { ...defaults.tab3, ...(parsed.tab3 || {}) },
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

function mergeCostDetails(defaults, saved) {
  if (!saved) return defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => {
      const legacy = saved[key];
      if (legacy?.ulm !== undefined || legacy?.dm !== undefined || legacy?.um !== undefined) {
        return [key, { ...defaults[key], ...legacy }];
      }
      if (legacy?.dm !== undefined || legacy?.um !== undefined) {
        return [key, { ulm: '', dm: legacy.dm ?? '', um: legacy.um ?? '' }];
      }
      const legacyActual = saved[`actual${key.charAt(0).toUpperCase()}${key.slice(1)}`];
      const legacyAssessed = saved[`assessed${key.charAt(0).toUpperCase()}${key.slice(1)}`];
      if (legacyActual !== undefined || legacyAssessed !== undefined) {
        const val = legacyActual ?? legacyAssessed ?? '';
        return [key, { ulm: '', dm: val, um: val }];
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

function mergeAchievementFinancial(defaults, saved) {
  if (!saved) return defaults;
  const merged = { ...defaults };
  Object.keys(defaults).forEach((rowKey) => {
    merged[rowKey] = { ...defaults[rowKey] };
    FINANCIAL_CATEGORY_TYPES.forEach(({ key: typeKey }) => {
      merged[rowKey][typeKey] = {
        ...defaults[rowKey][typeKey],
        ...(saved[rowKey]?.[typeKey] || {}),
      };
    });
  });
  return merged;
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
        return [key, { ...defaults[key], ...legacy }];
      }
      return [key, {
        valueRs: emptyTimePeriod(),
        cash: emptyTimePeriod(),
      }];
    })
  );
}

function mergeSilkSales(defaults, saved) {
  if (!saved) return defaults;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => {
      const legacy = saved[key];
      if (legacy?.qty?.dm !== undefined || legacy?.qty?.ulm !== undefined) {
        return [key, { ...defaults[key], ...legacy }];
      }
      if (legacy?.qtyDm !== undefined) {
        return [key, {
          qty: { ulm: '', dm: legacy.qtyDm ?? '', um: legacy.qtyUm ?? '' },
          value: { ulm: '', dm: legacy.valueDm ?? '', um: legacy.valueUm ?? '' },
        }];
      }
      return [key, defaults[key]];
    })
  );
}
