import {
  MONTHS,
  FINANCIAL_BUDGET_ROWS,
  FINANCIAL_CATEGORY_TYPES,
  ACHIEVEMENT_PHYSICAL_ROWS,
  RECEIPT_ITEMS,
  SILK_SALES_ROWS,
  COCOON_STOCK_ROWS,
  NSC_EXPENDITURE_ROWS,
  COST_DETAIL_FIELDS,
} from './mis37Constants.js';
import { applyMis37Calculations } from './mis37Calculations.js';
import { createMis37DefaultValues, mergeMis37StoredReport } from './mis37DefaultValues.js';

/** @deprecated Legacy archive — migrated into MIS37_REPORTS_KEY on read */
export const MIS37_ARCHIVE_KEY = 'pdl-mis37-government-reeling-unit-archive';
export const MIS37_REPORTS_KEY = 'pdl-mis37-government-reeling-unit-reports';

export function getPeriodKey(header) {
  if (!header?.unitName || !header?.month || !header?.year) return '';
  return `${header.unitName}|${header.year}|${header.month}`;
}

export function getPreviousPeriod(month, year) {
  const monthIndex = MONTHS.indexOf(month);
  if (monthIndex === -1) return null;
  if (monthIndex === 0) {
    return { month: MONTHS[11], year: String(Number(year) - 1) };
  }
  return { month: MONTHS[monthIndex - 1], year: String(year) };
}

export function getNextPeriod(month, year) {
  const monthIndex = MONTHS.indexOf(month);
  if (monthIndex === -1) return null;
  if (monthIndex === 11) {
    return { month: MONTHS[0], year: String(Number(year) + 1) };
  }
  return { month: MONTHS[monthIndex + 1], year: String(year) };
}

/** Indian financial year (April–March) */
export function getFinancialYearKey(month, year) {
  const monthIndex = MONTHS.indexOf(month);
  const y = Number(year);
  if (monthIndex === -1 || !Number.isFinite(y)) return '';
  if (monthIndex >= 3) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

export function isFirstMonthOfFinancialYear(month) {
  return month === 'April';
}

function migrateLegacyArchive(store) {
  try {
    const raw = localStorage.getItem(MIS37_ARCHIVE_KEY);
    if (!raw) return store;
    const legacy = JSON.parse(raw);
    Object.entries(legacy).forEach(([key, report]) => {
      if (!store[key]) {
        store[key] = {
          ...report,
          meta: {
            status: 'submitted',
            submittedAt: report.archivedAt
              ? new Date(report.archivedAt).toISOString()
              : null,
            submittedBy: report.submittedBy || 'legacy-import',
            locked: true,
          },
        };
      }
    });
    localStorage.setItem(MIS37_REPORTS_KEY, JSON.stringify(store));
  } catch {
    /* ignore corrupt legacy archive */
  }
  return store;
}

export function loadMis37Reports() {
  try {
    const raw = localStorage.getItem(MIS37_REPORTS_KEY);
    const store = raw ? JSON.parse(raw) : {};
    return migrateLegacyArchive(store);
  } catch {
    localStorage.removeItem(MIS37_REPORTS_KEY);
    return {};
  }
}

export function getMis37Report(periodKey) {
  if (!periodKey) return null;
  return loadMis37Reports()[periodKey] || null;
}

export function saveMis37Report(periodKey, report) {
  if (!periodKey) return;
  const store = loadMis37Reports();
  store[periodKey] = report;
  localStorage.setItem(MIS37_REPORTS_KEY, JSON.stringify(store));
}

export function findSubmittedReport(unitName, period) {
  if (!unitName || !period?.month || !period?.year) return null;
  const key = `${unitName}|${period.year}|${period.month}`;
  const report = getMis37Report(key);
  return report?.meta?.status === 'submitted' ? report : null;
}

export function extractCarryForwardFromTab1(tab1) {
  const carry = {
    achievementPhysical: {},
    achievementFinancial: {},
    receipts: {},
    silkSalesRealisation: {},
  };

  ACHIEVEMENT_PHYSICAL_ROWS.forEach(({ key }) => {
    carry.achievementPhysical[key] = {
      ulm: tab1.achievementPhysical?.[key]?.um ?? '',
    };
  });

  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    carry.achievementFinancial[rowKey] = {};
    FINANCIAL_CATEGORY_TYPES.forEach(({ key: typeKey }) => {
      carry.achievementFinancial[rowKey][typeKey] = {
        budgetUlM: tab1.achievementFinancial?.[rowKey]?.[typeKey]?.budgetUm ?? '',
      };
    });
  });

  RECEIPT_ITEMS.forEach(({ key }) => {
    carry.receipts[key] = {
      valueRs: { ulm: tab1.receipts?.[key]?.valueRs?.um ?? '' },
      cash: { ulm: tab1.receipts?.[key]?.cash?.um ?? '' },
    };
  });

  SILK_SALES_ROWS.forEach(({ key }) => {
    carry.silkSalesRealisation[key] = {
      qty: { ulm: tab1.silkSalesRealisation?.[key]?.qty?.um ?? '' },
      value: { ulm: tab1.silkSalesRealisation?.[key]?.value?.um ?? '' },
    };
  });

  return carry;
}

export function extractCarryForwardFromTab2(tab2) {
  const carry = {
    cocoonStockMovement: {},
    nscExpenditure: {},
    costDetails: {},
    costOfProduction: {
      saleValueByeProducts: {},
      costPerKgWithStaff: {},
      costPerKgWithoutStaff: {},
    },
  };

  COCOON_STOCK_ROWS.filter((r) => !r.computed).forEach(({ key }) => {
    carry.cocoonStockMovement[key] = {
      qty: { ulm: tab2.cocoonStockMovement?.[key]?.qty?.um ?? '' },
      value: { ulm: tab2.cocoonStockMovement?.[key]?.value?.um ?? '' },
    };
  });

  NSC_EXPENDITURE_ROWS.filter((r) => !r.computed).forEach(({ key }) => {
    carry.nscExpenditure[key] = { ulm: tab2.nscExpenditure?.[key]?.um ?? '' };
  });

  carry.costOfProduction.saleValueByeProducts = {
    ulm: tab2.costOfProduction?.saleValueByeProducts?.um ?? '',
  };
  carry.costOfProduction.costPerKgWithStaff = {
    ulm: tab2.costOfProduction?.costPerKgWithStaff?.um ?? '',
  };
  carry.costOfProduction.costPerKgWithoutStaff = {
    ulm: tab2.costOfProduction?.costPerKgWithoutStaff?.um ?? '',
  };

  COST_DETAIL_FIELDS.forEach(({ key }) => {
    carry.costDetails[key] = { ulm: tab2.costDetails?.[key]?.um ?? '' };
  });

  return carry;
}

export function extractCarryForwardFromReport(tab1, tab2) {
  return {
    tab1: extractCarryForwardFromTab1(tab1),
    tab2: extractCarryForwardFromTab2(tab2),
  };
}

function extractBudgetAnnualFromTab1(tab1) {
  const budget = {};
  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    budget[rowKey] = {};
    FINANCIAL_CATEGORY_TYPES.forEach(({ key: typeKey }) => {
      budget[rowKey][typeKey] =
        tab1.achievementFinancial?.[rowKey]?.[typeKey]?.budgetAnnual ?? '';
    });
  });
  return budget;
}

function hasAnyBudgetAnnual(tab1) {
  return FINANCIAL_BUDGET_ROWS.some(({ key: rowKey }) =>
    FINANCIAL_CATEGORY_TYPES.some(({ key: typeKey }) => {
      const val = tab1.achievementFinancial?.[rowKey]?.[typeKey]?.budgetAnnual;
      return val !== '' && val != null;
    })
  );
}

function applyBudgetAnnualToTab1(tab1, budgetAnnual) {
  const next = structuredClone(tab1);
  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    FINANCIAL_CATEGORY_TYPES.forEach(({ key: typeKey }) => {
      if (budgetAnnual[rowKey]?.[typeKey] !== undefined) {
        next.achievementFinancial[rowKey][typeKey].budgetAnnual =
          budgetAnnual[rowKey][typeKey];
      }
    });
  });
  return next;
}

/** Updates U.L.M / Budget U.L.M only — never clears or overwrites D.M entries. */
export function applyCarryForwardUlmOnly(tab1, carryForward) {
  const next = structuredClone(tab1);

  ACHIEVEMENT_PHYSICAL_ROWS.forEach(({ key }) => {
    if (carryForward.achievementPhysical?.[key]?.ulm !== undefined) {
      next.achievementPhysical[key].ulm = carryForward.achievementPhysical[key].ulm;
    }
  });

  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    FINANCIAL_CATEGORY_TYPES.forEach(({ key: typeKey }) => {
      const carried = carryForward.achievementFinancial?.[rowKey]?.[typeKey]?.budgetUlM;
      if (carried !== undefined) {
        next.achievementFinancial[rowKey][typeKey].budgetUlM = carried;
      }
    });
  });

  RECEIPT_ITEMS.forEach(({ key }) => {
    if (carryForward.receipts?.[key]?.valueRs?.ulm !== undefined) {
      next.receipts[key].valueRs.ulm = carryForward.receipts[key].valueRs.ulm;
    }
    if (carryForward.receipts?.[key]?.cash?.ulm !== undefined) {
      next.receipts[key].cash.ulm = carryForward.receipts[key].cash.ulm;
    }
  });

  SILK_SALES_ROWS.forEach(({ key }) => {
    if (carryForward.silkSalesRealisation?.[key]?.qty?.ulm !== undefined) {
      next.silkSalesRealisation[key].qty.ulm =
        carryForward.silkSalesRealisation[key].qty.ulm;
    }
    if (carryForward.silkSalesRealisation?.[key]?.value?.ulm !== undefined) {
      next.silkSalesRealisation[key].value.ulm =
        carryForward.silkSalesRealisation[key].value.ulm;
    }
  });

  return next;
}

/** Updates Tab 2 U.L.M fields only — cocoon stock, NSC expenditure, bye-product sale value, cost/kg. */
export function applyCarryForwardTab2UlmOnly(tab2, carryForward) {
  const next = structuredClone(tab2);

  COCOON_STOCK_ROWS.filter((r) => !r.computed).forEach(({ key }) => {
    const carried = carryForward.cocoonStockMovement?.[key];
    if (carried?.qty?.ulm !== undefined) {
      next.cocoonStockMovement[key].qty.ulm = carried.qty.ulm;
    }
    if (carried?.value?.ulm !== undefined) {
      next.cocoonStockMovement[key].value.ulm = carried.value.ulm;
    }
  });

  NSC_EXPENDITURE_ROWS.filter((r) => !r.computed).forEach(({ key }) => {
    if (carryForward.nscExpenditure?.[key]?.ulm !== undefined) {
      next.nscExpenditure[key].ulm = carryForward.nscExpenditure[key].ulm;
    }
  });

  if (!next.costOfProduction || typeof next.costOfProduction !== 'object') {
    next.costOfProduction = {};
  }

  const copDefaults = {
    saleValueByeProducts: { ulm: '', dm: '', um: '' },
    costPerKgWithStaff: { ulm: '', dm: '', um: '' },
    costPerKgWithoutStaff: { ulm: '', dm: '', um: '' },
  };
  Object.entries(copDefaults).forEach(([key, empty]) => {
    if (!next.costOfProduction[key] || typeof next.costOfProduction[key] !== 'object') {
      next.costOfProduction[key] = { ...empty };
    }
  });

  if (carryForward.costOfProduction?.saleValueByeProducts?.ulm !== undefined) {
    next.costOfProduction.saleValueByeProducts.ulm =
      carryForward.costOfProduction.saleValueByeProducts.ulm;
  }
  if (carryForward.costOfProduction?.costPerKgWithStaff?.ulm !== undefined) {
    next.costOfProduction.costPerKgWithStaff.ulm =
      carryForward.costOfProduction.costPerKgWithStaff.ulm;
  }
  if (carryForward.costOfProduction?.costPerKgWithoutStaff?.ulm !== undefined) {
    next.costOfProduction.costPerKgWithoutStaff.ulm =
      carryForward.costOfProduction.costPerKgWithoutStaff.ulm;
  }

  COST_DETAIL_FIELDS.forEach(({ key }) => {
    if (carryForward.costDetails?.[key]?.ulm !== undefined) {
      next.costDetails[key].ulm = carryForward.costDetails[key].ulm;
    }
  });

  return next;
}

function findFinancialYearBudgetAnnual(reports, header) {
  const fyKey = getFinancialYearKey(header.month, header.year);
  if (!fyKey || !header.unitName) return null;

  const candidates = Object.entries(reports)
    .filter(([key, report]) => {
      if (!key.startsWith(`${header.unitName}|`)) return false;
      if (report.meta?.status !== 'submitted') return false;
      const month = report.header?.month;
      const year = report.header?.year;
      return getFinancialYearKey(month, year) === fyKey && hasAnyBudgetAnnual(report.tab1);
    })
    .sort(([keyA], [keyB]) => {
      const [, yearA, monthA] = keyA.split('|');
      const [, yearB, monthB] = keyB.split('|');
      const idxA = MONTHS.indexOf(monthA);
      const idxB = MONTHS.indexOf(monthB);
      if (Number(yearA) !== Number(yearB)) return Number(yearA) - Number(yearB);
      return idxA - idxB;
    });

  if (candidates.length === 0) return null;
  return extractBudgetAnnualFromTab1(candidates[0][1].tab1);
}

function applyBudgetAnnualForPeriod(tab1, header, reports, priorSubmittedTab1) {
  if (isFirstMonthOfFinancialYear(header.month)) return tab1;
  const fyBudget =
    findFinancialYearBudgetAnnual(reports, header) ||
    (priorSubmittedTab1 ? extractBudgetAnnualFromTab1(priorSubmittedTab1) : null);
  return fyBudget ? applyBudgetAnnualToTab1(tab1, fyBudget) : tab1;
}

/**
 * Load a report for the given period. U.L.M is populated only when the prior month
 * was submitted (rollover at submit time, or fallback hydrate from submitted archive).
 */
export function loadMis37ReportForHeader(header) {
  const periodKey = getPeriodKey(header);
  const defaults = createMis37DefaultValues();
  if (!periodKey) return defaults;

  const stored = getMis37Report(periodKey);
  if (stored) {
    return mergeMis37StoredReport(stored);
  }

  const reports = loadMis37Reports();
  let report = mergeMis37StoredReport({
    ...defaults,
    header: { ...defaults.header, ...header },
  });

  const priorPeriod = getPreviousPeriod(header.month, header.year);
  const priorSubmitted = findSubmittedReport(header.unitName, priorPeriod);
  if (priorSubmitted) {
    const computedPrior = applyMis37Calculations(priorSubmitted);
    const carryForward = extractCarryForwardFromReport(computedPrior.tab1, computedPrior.tab2);
    report.tab1 = applyCarryForwardUlmOnly(report.tab1, carryForward.tab1);
    report.tab2 = applyCarryForwardTab2UlmOnly(report.tab2, carryForward.tab2);
    report.meta = {
      ...report.meta,
      ulmCarriedFrom: getPeriodKey(priorSubmitted.header),
      ulmCarriedAt: priorSubmitted.meta?.submittedAt || null,
      ulmLocked: true,
    };
    report.tab1 = applyBudgetAnnualForPeriod(
      report.tab1,
      header,
      reports,
      computedPrior.tab1
    );
    if (!isFirstMonthOfFinancialYear(header.month)) {
      report.meta.financialYearBudgetLocked = true;
    }
    report.meta.financialYearKey = getFinancialYearKey(header.month, header.year);
  }

  return report;
}

/**
 * Submit the current report and roll U.M → next month's U.L.M.
 * Server-side equivalent: finalize current report, upsert next draft with ulm only.
 */
export function submitMis37ReportWithRollover(report, submittedBy = 'unknown') {
  const computed = applyMis37Calculations(report);
  const periodKey = getPeriodKey(computed.header);
  if (!periodKey) {
    return { ok: false, error: 'Complete unit name, month, and year before submitting.' };
  }

  const existing = getMis37Report(periodKey);
  if (existing?.meta?.status === 'submitted') {
    return { ok: false, error: 'This report has already been submitted.' };
  }

  const submittedAt = new Date().toISOString();
  const submittedReport = {
    ...computed,
    meta: {
      ...computed.meta,
      status: 'submitted',
      locked: true,
      submittedAt,
      submittedBy,
      savedTabs: computed.meta?.savedTabs || [],
    },
  };

  saveMis37Report(periodKey, submittedReport);

  const nextPeriod = getNextPeriod(computed.header.month, computed.header.year);
  if (!nextPeriod) {
    return { ok: true, submittedReport, nextDraft: null };
  }

  const nextHeader = {
    ...computed.header,
    month: nextPeriod.month,
    year: nextPeriod.year,
  };
  const nextKey = getPeriodKey(nextHeader);
  const carryForward = extractCarryForwardFromReport(computed.tab1, computed.tab2);
  const reports = loadMis37Reports();

  let nextDraft = getMis37Report(nextKey);
  if (nextDraft?.meta?.status === 'submitted') {
    return {
      ok: true,
      submittedReport,
      nextDraft: null,
      warning: `${nextPeriod.month} ${nextPeriod.year} is already submitted; rollover skipped.`,
    };
  }

  if (!nextDraft) {
    nextDraft = mergeMis37StoredReport({
      ...createMis37DefaultValues(),
      header: nextHeader,
    });
  } else {
    nextDraft = mergeMis37StoredReport({ ...nextDraft, header: { ...nextDraft.header, ...nextHeader } });
  }

  nextDraft.tab1 = applyCarryForwardUlmOnly(nextDraft.tab1, carryForward.tab1);
  nextDraft.tab2 = applyCarryForwardTab2UlmOnly(nextDraft.tab2, carryForward.tab2);
  nextDraft.tab1 = applyBudgetAnnualForPeriod(
    nextDraft.tab1,
    nextHeader,
    { ...reports, [periodKey]: submittedReport },
    computed.tab1
  );

  nextDraft.meta = {
    ...nextDraft.meta,
    status: 'draft',
    locked: false,
    submittedAt: null,
    submittedBy: null,
    ulmCarriedFrom: periodKey,
    ulmCarriedAt: submittedAt,
    ulmLocked: true,
    financialYearKey: getFinancialYearKey(nextPeriod.month, nextPeriod.year),
    financialYearBudgetLocked: !isFirstMonthOfFinancialYear(nextPeriod.month),
  };

  saveMis37Report(nextKey, nextDraft);

  return {
    ok: true,
    submittedReport,
    nextDraft,
    nextPeriodKey: nextKey,
    nextHeader,
  };
}

/** @deprecated Use saveMis37Report with status submitted */
export function archiveMis37Report(report) {
  const key = getPeriodKey(report?.header);
  if (!key) return;
  saveMis37Report(key, {
    ...applyMis37Calculations(report),
    meta: {
      ...report.meta,
      status: 'submitted',
      locked: true,
      submittedAt: report.meta?.submittedAt || new Date().toISOString(),
      submittedBy: report.meta?.submittedBy || 'unknown',
    },
  });
}

export function isReportLocked(meta) {
  return meta?.status === 'submitted' || meta?.locked === true;
}

export function isBudgetAnnualLocked(meta, header) {
  if (isReportLocked(meta)) return true;
  if (meta?.financialYearBudgetLocked) return true;
  if (header?.month && !isFirstMonthOfFinancialYear(header.month)) return true;
  return false;
}

export function applyTab1UlmToForm(tab1, setValue) {
  ACHIEVEMENT_PHYSICAL_ROWS.forEach(({ key }) => {
    setValue(`tab1.achievementPhysical.${key}.ulm`, tab1.achievementPhysical[key].ulm, {
      shouldDirty: false,
      shouldValidate: false,
    });
  });

  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    FINANCIAL_CATEGORY_TYPES.forEach(({ key: typeKey }) => {
      setValue(
        `tab1.achievementFinancial.${rowKey}.${typeKey}.budgetUlM`,
        tab1.achievementFinancial[rowKey][typeKey].budgetUlM,
        { shouldDirty: false, shouldValidate: false }
      );
      setValue(
        `tab1.achievementFinancial.${rowKey}.${typeKey}.budgetAnnual`,
        tab1.achievementFinancial[rowKey][typeKey].budgetAnnual,
        { shouldDirty: false, shouldValidate: false }
      );
    });
  });

  RECEIPT_ITEMS.forEach(({ key }) => {
    ['valueRs', 'cash'].forEach((sub) => {
      setValue(`tab1.receipts.${key}.${sub}.ulm`, tab1.receipts[key][sub].ulm, {
        shouldDirty: false,
        shouldValidate: false,
      });
    });
  });

  SILK_SALES_ROWS.forEach(({ key }) => {
    ['qty', 'value'].forEach((sub) => {
      setValue(`tab1.silkSalesRealisation.${key}.${sub}.ulm`, tab1.silkSalesRealisation[key][sub].ulm, {
        shouldDirty: false,
        shouldValidate: false,
      });
    });
  });
}
