import {
  MONTHS,
  ACHIEVEMENT_PHYSICAL_ROWS,
  PRODUCTION_WORK_ROWS,
  RECEIPT_ITEMS,
  COCOON_STOCK_ROWS,
  NSC_EXPENDITURE_ROWS,
  STOCK_PARTICULAR_ITEMS,
} from './mis37Constants.js';
import { applyMis37Calculations } from './mis37Calculations.js';
import { createMis37DefaultValues, mergeMis37StoredReport } from './mis37DefaultValues.js';
import { isFiscalYearStart } from './deriveMonthlyFromAnnual.js';

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
    productionDetails: {},
    receipts: {},
    stockParticulars: {},
  };

  ACHIEVEMENT_PHYSICAL_ROWS.forEach(({ key }) => {
    carry.achievementPhysical[key] = {
      ulm: tab1.achievementPhysical?.[key]?.um ?? '',
    };
  });

  PRODUCTION_WORK_ROWS.forEach(({ key }) => {
    carry.productionDetails[key] = {
      ulm: tab1.productionDetails?.[key]?.um ?? '',
    };
  });

  // achievementFinancial is intentionally not carried forward — Budget Outlay
  // is the full yearly figure (flat, unchanged every month) and Expenses is a
  // plain per-month manual entry; neither has a U.L.M to carry.

  RECEIPT_ITEMS.forEach(({ key }) => {
    carry.receipts[key] = {
      valueRs: { ulm: tab1.receipts?.[key]?.valueRs?.um ?? '' },
    };
  });

  // Stock Particulars: next month's Opening Balance = this month's Closing Balance, per item.
  STOCK_PARTICULAR_ITEMS.forEach(({ key }) => {
    carry.stockParticulars[key] = {
      openingBalance: tab1.stockParticulars?.[key]?.closingBalance ?? '',
    };
  });

  return carry;
}

// Cost Details has no U.L.M column and does not participate in rollover — every field
// there is a rate/ratio recomputed fresh each month (see mis37Constants.js).
export function extractCarryForwardFromTab2(tab2) {
  const carry = {
    cocoonStockMovement: {},
    nscExpenditure: {},
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

  return carry;
}

// Every leaf row-group in Section VII (Silk Sold, Bye Products Sold) rolls forward the
// same way: Current Year AND Previous Year each carry their U.M into next month's U.L.M,
// independently for Qty and Value. No pending or total rows exist in this section.
const ACTUAL_RECEIPT_ROW_GROUPS = ['silkSold', 'byeProductsSold'];

export function extractCarryForwardFromTab3(tab3) {
  const actualReceiptDetails = {};
  ACTUAL_RECEIPT_ROW_GROUPS.forEach((rowKey) => {
    actualReceiptDetails[rowKey] = {};
    ['currentYear', 'previousYear'].forEach((periodKey) => {
      actualReceiptDetails[rowKey][periodKey] = {
        qty: { ulm: tab3.actualReceiptDetails?.[rowKey]?.[periodKey]?.qty?.um ?? '' },
        value: { ulm: tab3.actualReceiptDetails?.[rowKey]?.[periodKey]?.value?.um ?? '' },
      };
    });
  });

  return {
    estimatedSaleValue: {
      rawSilk: { ulm: tab3.estimatedSaleValue?.rawSilk?.um ?? '' },
    },
    actualReceiptDetails,
  };
}

/** Updates Tab 3 U.L.M fields only — every Section VII row (Current Year AND Previous Year
 * roll forward identically) plus Raw Silk Sale Value. */
export function applyCarryForwardTab3UlmOnly(tab3, carryForward) {
  const next = structuredClone(tab3);

  if (carryForward.estimatedSaleValue?.rawSilk?.ulm !== undefined) {
    next.estimatedSaleValue.rawSilk.ulm = carryForward.estimatedSaleValue.rawSilk.ulm;
  }

  ACTUAL_RECEIPT_ROW_GROUPS.forEach((rowKey) => {
    const carried = carryForward.actualReceiptDetails?.[rowKey];
    ['currentYear', 'previousYear'].forEach((periodKey) => {
      const periodCarry = carried?.[periodKey];
      if (periodCarry?.qty?.ulm !== undefined) {
        next.actualReceiptDetails[rowKey][periodKey].qty.ulm = periodCarry.qty.ulm;
      }
      if (periodCarry?.value?.ulm !== undefined) {
        next.actualReceiptDetails[rowKey][periodKey].value.ulm = periodCarry.value.ulm;
      }
    });
  });

  return next;
}

export function extractCarryForwardFromReport(tab1, tab2, tab3) {
  return {
    tab1: extractCarryForwardFromTab1(tab1),
    tab2: extractCarryForwardFromTab2(tab2),
    tab3: extractCarryForwardFromTab3(tab3),
  };
}

/** Updates U.L.M / Budget U.L.M / Stock Particulars Opening Balance only — never clears
 * or overwrites D.M entries. Opening Balance rolls forward the same way U.L.M does:
 * next month's Opening Balance = this month's Closing Balance, per stock item.
 * `targetMonth` is the month being rolled INTO — fields flagged
 * resetAtFiscalYearStart (Target, Budget Outlay, Expenses) get U.L.M forced to
 * 0 instead of carried when that's April, so they start fresh each fiscal year. */
export function applyCarryForwardUlmOnly(tab1, carryForward, targetMonth) {
  const next = structuredClone(tab1);
  const resetting = isFiscalYearStart(targetMonth);

  ACHIEVEMENT_PHYSICAL_ROWS.forEach(({ key, resetAtFiscalYearStart }) => {
    if (resetting && resetAtFiscalYearStart) {
      next.achievementPhysical[key].ulm = 0;
      return;
    }
    if (carryForward.achievementPhysical?.[key]?.ulm !== undefined) {
      next.achievementPhysical[key].ulm = carryForward.achievementPhysical[key].ulm;
    }
  });

  PRODUCTION_WORK_ROWS.forEach(({ key }) => {
    if (carryForward.productionDetails?.[key]?.ulm !== undefined) {
      next.productionDetails[key].ulm = carryForward.productionDetails[key].ulm;
    }
  });

  // achievementFinancial is not carried forward — see extractCarryForwardFromTab1.

  RECEIPT_ITEMS.forEach(({ key }) => {
    if (carryForward.receipts?.[key]?.valueRs?.ulm !== undefined) {
      next.receipts[key].valueRs.ulm = carryForward.receipts[key].valueRs.ulm;
    }
  });

  STOCK_PARTICULAR_ITEMS.forEach(({ key }) => {
    const carried = carryForward.stockParticulars?.[key]?.openingBalance;
    if (carried !== undefined) {
      next.stockParticulars[key].openingBalance = carried;
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

  return next;
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
  let report = stored
    ? mergeMis37StoredReport(stored)
    : mergeMis37StoredReport({ ...defaults, header: { ...defaults.header, ...header } });

  // Once this period is itself submitted/locked, its own data is final —
  // never re-derive U.L.M from a prior period again.
  if (isReportLocked(report.meta)) {
    return report;
  }

  const priorPeriod = getPreviousPeriod(header.month, header.year);
  const priorSubmitted = priorPeriod ? findSubmittedReport(header.unitName, priorPeriod) : null;
  if (!priorSubmitted) {
    return report;
  }

  const priorKey = getPeriodKey(priorSubmitted.header);
  // Re-derive whenever this draft hasn't yet carried from this exact prior
  // submission — covers both "never carried" (new draft, or one created
  // before the prior month was submitted) and "prior month was resubmitted
  // with different figures since we last carried". D.M/manually-entered
  // values are untouched — only the U.L.M fields are overwritten.
  if (stored && report.meta?.ulmCarriedFrom === priorKey) {
    return report;
  }

  const computedPrior = applyMis37Calculations(priorSubmitted);
  const carryForward = extractCarryForwardFromReport(computedPrior.tab1, computedPrior.tab2, computedPrior.tab3);
  report.tab1 = applyCarryForwardUlmOnly(report.tab1, carryForward.tab1, header.month);
  report.tab2 = applyCarryForwardTab2UlmOnly(report.tab2, carryForward.tab2);
  report.tab3 = applyCarryForwardTab3UlmOnly(report.tab3, carryForward.tab3);
  report.meta = {
    ...report.meta,
    ulmCarriedFrom: priorKey,
    ulmCarriedAt: priorSubmitted.meta?.submittedAt || null,
    ulmLocked: true,
    financialYearKey: getFinancialYearKey(header.month, header.year),
  };

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
  const carryForward = extractCarryForwardFromReport(computed.tab1, computed.tab2, computed.tab3);

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

  nextDraft.tab1 = applyCarryForwardUlmOnly(nextDraft.tab1, carryForward.tab1, nextPeriod.month);
  nextDraft.tab2 = applyCarryForwardTab2UlmOnly(nextDraft.tab2, carryForward.tab2);
  nextDraft.tab3 = applyCarryForwardTab3UlmOnly(nextDraft.tab3, carryForward.tab3);

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

export function applyTab1UlmToForm(tab1, setValue) {
  ACHIEVEMENT_PHYSICAL_ROWS.filter((r) => !r.noCarryForward).forEach(({ key }) => {
    setValue(`tab1.achievementPhysical.${key}.ulm`, tab1.achievementPhysical[key].ulm, {
      shouldDirty: false,
      shouldValidate: false,
    });
  });

  PRODUCTION_WORK_ROWS.forEach(({ key }) => {
    setValue(`tab1.productionDetails.${key}.ulm`, tab1.productionDetails[key].ulm, {
      shouldDirty: false,
      shouldValidate: false,
    });
  });

  RECEIPT_ITEMS.forEach(({ key }) => {
    setValue(`tab1.receipts.${key}.valueRs.ulm`, tab1.receipts[key].valueRs.ulm, {
      shouldDirty: false,
      shouldValidate: false,
    });
  });
}
