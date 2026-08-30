import {
  FINANCIAL_BUDGET_ROWS,
  PRODUCTION_WORK_ROWS,
  RECEIPT_ITEMS,
  COCOON_STOCK_ROWS,
  NSC_EXPENDITURE_ROWS,
  STOCK_KGS_ITEMS,
} from './mis37Constants.js';

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function emptyTimePeriod() {
  return { ulm: '', dm: '', um: '' };
}

function ensureTimePeriod(value) {
  if (!value || typeof value !== 'object') return emptyTimePeriod();
  return { ...emptyTimePeriod(), ...value };
}

function ensureCostOfProductionShape(cop) {
  const next = cop && typeof cop === 'object' ? cop : {};
  return {
    totalNscExpenditure: ensureTimePeriod(next.totalNscExpenditure),
    saleValueByeProducts: ensureTimePeriod(next.saleValueByeProducts),
    netNscExpenditure: ensureTimePeriod(next.netNscExpenditure),
    costPerKgWithStaff: ensureTimePeriod(next.costPerKgWithStaff),
    costPerKgWithoutStaff: ensureTimePeriod(next.costPerKgWithoutStaff),
  };
}

/** U.M = U.L.M + D.M — only D.M is user input; U.L.M is carried from prior month */
export function computeTimePeriod(period) {
  if (!period || typeof period !== 'object') return emptyTimePeriod();
  return {
    ...period,
    um: round2(num(period.ulm) + num(period.dm)),
  };
}

/** Variance = Budget Outlay − Expenses (D.M) — both this month's flat figures.
 * Budget Outlay is the full yearly figure, unchanged every month (no ÷12, no
 * carry-forward); Expenses is a plain per-month manual entry. */
export function computeFinancialCategory(category) {
  if (!category || typeof category !== 'object') return category;
  return {
    ...category,
    variance: round2(num(category.budgetOutlay) - num(category.expenses)),
  };
}

function computeClosingStock(cocoonStock) {
  const opening = cocoonStock.openingBalance;
  const purchased = cocoonStock.purchased;
  const reeled = cocoonStock.reeled;
  const closing = cocoonStock.closingStock;

  ['qty', 'value'].forEach((metric) => {
    closing[metric].dm = round2(
      num(opening[metric].dm) + num(purchased[metric].dm) - num(reeled[metric].dm)
    );
    closing[metric].um = round2(
      num(opening[metric].um) + num(purchased[metric].um) - num(reeled[metric].um)
    );
  });
}


function divide(numerator, denominator) {
  return denominator ? round2(numerator / denominator) : 0;
}

function ensureDmUm(value) {
  if (!value || typeof value !== 'object') return { dm: '', um: '' };
  return { dm: value.dm ?? '', um: value.um ?? '' };
}

/**
 * Cost Details has no U.L.M column — every field is a rate/ratio, so summing across
 * months would be meaningless and nothing here rolls forward. "Manual entry" rows just
 * mirror D.M into U.M for the current month; the rest are fully derived (see
 * COST_DETAIL_FIELDS comment for formulas), pulling from Tab 1 Stock Particulars, Cocoon
 * Stock Movement, NSC Expenditure, and Production Details — so those source sections must
 * already be computed before this runs.
 */
function computeCostDetails(tab2, tab1) {
  const cd = tab2.costDetails;
  Object.keys(cd).forEach((key) => {
    cd[key] = ensureDmUm(cd[key]);
  });

  ['avgSrPercentCocoon', 'assessedRendita', 'assessedSilkKg', 'avgCocoonCostPerKg'].forEach((key) => {
    cd[key].um = round2(num(cd[key].dm));
  });

  // Actual Silk Kg is auto-fetched from Tab 1 Achievement to Target — Physical → Achieved
  // (Kgs), same D.M/U.M column — not typed in here.
  const achieved = tab1?.achievementPhysical?.achieved || {};
  cd.actualSilkKg.dm = num(achieved.dm);
  cd.actualSilkKg.um = num(achieved.um);

  const actualSilkKgDm = num(cd.actualSilkKg.dm);
  const actualSilkKgUm = num(cd.actualSilkKg.um);
  const nsc = tab2.nscExpenditure || {};
  const reeledQty = tab2.cocoonStockMovement?.reeled?.qty || {};
  const cocoonConsumed = num(tab1?.stockParticulars?.cocoon?.consumedSoldDisposed);
  const mandaysUsed = tab1?.productionDetails?.mandaysUsed || {};

  // D.M uses this month's cocoon consumed (Stock Particulars has no cumulative figure);
  // U.M uses the genuine cumulative Reeled Qty from Cocoon Stock Movement (kg/kg, same units).
  cd.actualRendita.dm = divide(cocoonConsumed, actualSilkKgDm);
  cd.actualRendita.um = divide(num(reeledQty.um), actualSilkKgUm);

  cd.fuelCostPerKg.dm = divide(num(nsc.fuelCost?.dm), actualSilkKgDm);
  cd.fuelCostPerKg.um = divide(num(nsc.fuelCost?.um), actualSilkKgUm);

  const conversionKeys = ['wagesPaid', 'fuelCost', 'ebCharges', 'maintenanceCharges', 'transportCharges', 'others'];
  const conversionDm = conversionKeys.reduce((acc, key) => acc + num(nsc[key]?.dm), 0);
  const conversionUm = conversionKeys.reduce((acc, key) => acc + num(nsc[key]?.um), 0);
  cd.conversionCostPerKg.dm = divide(conversionDm, actualSilkKgDm);
  cd.conversionCostPerKg.um = divide(conversionUm, actualSilkKgUm);

  cd.mandaysPerKg.dm = divide(num(mandaysUsed.dm), actualSilkKgDm);
  cd.mandaysPerKg.um = divide(num(mandaysUsed.um), actualSilkKgUm);

  return cd;
}

/**
 * Cost of Production/Kg (with/without staff) are derived from Total NSC Expenditure and
 * Actual Silk Kg (from Cost Details, which must already be computed) rather than typed
 * in — their U.L.M is unused/dead, same as Cost Details. The other rows in this section
 * (Total NSC, Sale Value of Bye Products, Net NSC) are unchanged and still use U.L.M.
 */
function computeCostOfProduction(tab2) {
  const nsc = tab2.nscExpenditure || {};
  tab2.costOfProduction = ensureCostOfProductionShape(tab2.costOfProduction);
  const cop = tab2.costOfProduction;

  cop.totalNscExpenditure = {
    ulm: num(nsc.total?.ulm),
    dm: num(nsc.total?.dm),
    um: num(nsc.total?.um),
  };

  cop.saleValueByeProducts = computeTimePeriod(cop.saleValueByeProducts);

  cop.netNscExpenditure = {
    ulm: round2(num(cop.totalNscExpenditure.ulm) - num(cop.saleValueByeProducts.ulm)),
    dm: round2(num(cop.totalNscExpenditure.dm) - num(cop.saleValueByeProducts.dm)),
    um: round2(num(cop.totalNscExpenditure.um) - num(cop.saleValueByeProducts.um)),
  };

  const actualSilkKg = tab2.costDetails?.actualSilkKg || {};
  const actualSilkKgDm = num(actualSilkKg.dm);
  const actualSilkKgUm = num(actualSilkKg.um);

  cop.costPerKgWithStaff.dm = divide(num(cop.totalNscExpenditure.dm), actualSilkKgDm);
  cop.costPerKgWithStaff.um = divide(num(cop.totalNscExpenditure.um), actualSilkKgUm);

  cop.costPerKgWithoutStaff.dm = divide(
    num(cop.totalNscExpenditure.dm) - num(nsc.wagesPaid?.dm),
    actualSilkKgDm
  );
  cop.costPerKgWithoutStaff.um = divide(
    num(cop.totalNscExpenditure.um) - num(nsc.wagesPaid?.um),
    actualSilkKgUm
  );

  return cop;
}

export function applyMis37Calculations(data) {
  const next = structuredClone(data);

  // Tab 1: Achievement physical — U.M = U.L.M + D.M. Achieved D.M is the manually entered
  // source of truth.
  Object.keys(next.tab1.achievementPhysical).forEach((key) => {
    next.tab1.achievementPhysical[key] = computeTimePeriod(next.tab1.achievementPhysical[key]);
  });

  // Tab 1: Achievement financial
  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    next.tab1.achievementFinancial[rowKey] = computeFinancialCategory(
      next.tab1.achievementFinancial[rowKey]
    );
  });

  // Tab 1: Production Details — Days Worked / Mandays Used: U.M = U.L.M + D.M
  PRODUCTION_WORK_ROWS.forEach(({ key }) => {
    next.tab1.productionDetails[key] = computeTimePeriod(next.tab1.productionDetails[key]);
  });

  // Tab 1: Stock particulars — Total = Opening + Added; Closing = Total − Consumed/Sold/Disposed
  Object.values(next.tab1.stockParticulars).forEach((row) => {
    const opening = num(row.openingBalance);
    const added = num(row.stockAdded);
    row.total = round2(opening + added);
    const consumedSoldDisposed = num(row.consumedSoldDisposed);
    row.closingBalance = round2(row.total - consumedSoldDisposed);
  });

  // Tab 1: Receipts — U.M on valueRs
  RECEIPT_ITEMS.forEach(({ key }) => {
    if (next.tab1.receipts[key]) {
      next.tab1.receipts[key].valueRs = computeTimePeriod(next.tab1.receipts[key].valueRs);
    }
  });

  // Tab 2: Cocoon stock — U.M = U.L.M + D.M; closing derived. Opening Balance/Purchased/
  // Reeled Qty D.M is auto-fetched from Tab 1 Stock Particulars → Cocoon rather than typed
  // in — see COCOON_STOCK_ROWS comment. Their Value D.M stays manual.
  const cocoon = next.tab1.stockParticulars?.cocoon || {};
  const qtyDmSource = {
    openingBalance: cocoon.openingBalance,
    purchased: cocoon.stockAdded,
    reeled: cocoon.consumedSoldDisposed,
  };
  COCOON_STOCK_ROWS.filter((r) => !r.computed).forEach(({ key, qtyDmAutoFetched }) => {
    const row = next.tab2.cocoonStockMovement[key];
    if (row) {
      if (qtyDmAutoFetched) {
        row.qty.dm = num(qtyDmSource[key]);
      }
      row.qty = computeTimePeriod(row.qty);
      row.value = computeTimePeriod(row.value);
    }
  });
  computeClosingStock(next.tab2.cocoonStockMovement);

  // Tab 2: NSC Expenditure — D.M is auto-fetched from Tab 1 Financial Control Budget's
  // Budget D.M for the matching category (same keys), not typed in here. U.M per field;
  // total summed per column (ulm, dm, um).
  const nscRows = NSC_EXPENDITURE_ROWS.filter((r) => !r.computed);
  const nscKeys = nscRows.map((r) => r.key);
  nscRows.forEach(({ key, dmAutoFetched }) => {
    if (dmAutoFetched) {
      next.tab2.nscExpenditure[key].dm = num(next.tab1.achievementFinancial?.[key]?.expenses);
    }
    next.tab2.nscExpenditure[key] = computeTimePeriod(next.tab2.nscExpenditure[key]);
  });
  next.tab2.nscExpenditure.total = {
    ulm: round2(nscKeys.reduce((acc, key) => acc + num(next.tab2.nscExpenditure[key]?.ulm), 0)),
    dm: round2(nscKeys.reduce((acc, key) => acc + num(next.tab2.nscExpenditure[key]?.dm), 0)),
    um: round2(nscKeys.reduce((acc, key) => acc + num(next.tab2.nscExpenditure[key]?.um), 0)),
  };

  next.tab2.costDetails = computeCostDetails(next.tab2, next.tab1);
  next.tab2.costOfProduction = computeCostOfProduction(next.tab2);

  const totalNscDm = num(next.tab2.nscExpenditure.total?.dm);
  const totalNscUm = num(next.tab2.nscExpenditure.total?.um);

  // Tab 3: Stock Details (Kgs) — live mirror of Tab 1 Stock Particulars for matching items
  // (Opening Balance / Purchase / Sold-Issued <- Opening Balance / Stock Added / Consumed-Sold-Disposed).
  // Fire Wood has no Tab 1 counterpart, so it stays independently entered.
  STOCK_KGS_ITEMS.forEach(({ key, stockParticularKey }) => {
    const row = next.tab3.stockDetailsKgs[key];
    if (!row) return;
    if (stockParticularKey) {
      const source = next.tab1.stockParticulars[stockParticularKey] || {};
      row.openingBalance = num(source.openingBalance);
      row.purchase = num(source.stockAdded);
      row.soldIssued = num(source.consumedSoldDisposed);
    }
    row.total = round2(num(row.openingBalance) + num(row.purchase));
    row.closingBalance = round2(row.total - num(row.soldIssued));
  });

  // Tab 3: Estimated Sale Value — Raw Silk is U.L.M/D.M/U.M (D.M typed directly as a Rupee
  // total). Bye Products is a read-only mirror of Tab 2 Cost of Production's
  // "Sale Value of Bye Products" (same D.M/U.M, plus U.L.M for column symmetry).
  next.tab3.estimatedSaleValue.rawSilk = computeTimePeriod(next.tab3.estimatedSaleValue.rawSilk);
  next.tab3.estimatedSaleValue.byeProducts = {
    ulm: num(next.tab2.costOfProduction.saleValueByeProducts?.ulm),
    dm: num(next.tab2.costOfProduction.saleValueByeProducts?.dm),
    um: num(next.tab2.costOfProduction.saleValueByeProducts?.um),
  };

  const rawSilk = next.tab3.estimatedSaleValue.rawSilk;
  const byeProducts = next.tab3.estimatedSaleValue.byeProducts;
  next.tab3.estimatedSaleValue.total = {
    ulm: round2(num(rawSilk.ulm) + num(byeProducts.ulm)),
    dm: round2(num(rawSilk.dm) + num(byeProducts.dm)),
    um: round2(num(rawSilk.um) + num(byeProducts.um)),
  };

  // Tab 3: Actual Receipt Details (Section VII) — 2 items (Silk Sold, Bye Products Sold),
  // each split into Current Year / Previous Year. Every leaf row is U.L.M/D.M/U.M x
  // Qty/Value (enter D.M only; U.M = U.L.M + D.M; U.L.M carries forward monthly). No
  // total or pending rows.
  const silk = next.tab3.actualReceiptDetails.silkSold;
  silk.currentYear.qty = computeTimePeriod(silk.currentYear.qty);
  silk.currentYear.value = computeTimePeriod(silk.currentYear.value);
  silk.previousYear.qty = computeTimePeriod(silk.previousYear.qty);
  silk.previousYear.value = computeTimePeriod(silk.previousYear.value);

  const bye = next.tab3.actualReceiptDetails.byeProductsSold;
  bye.currentYear.qty = computeTimePeriod(bye.currentYear.qty);
  bye.currentYear.value = computeTimePeriod(bye.currentYear.value);
  bye.previousYear.qty = computeTimePeriod(bye.previousYear.qty);
  bye.previousYear.value = computeTimePeriod(bye.previousYear.value);

  // D.M Profit/Loss compares this month's expenditure against this month's estimated sale value.
  const estimatedTotalDm = num(next.tab3.estimatedSaleValue.total.dm);
  const dmProfitLoss = round2(totalNscDm - estimatedTotalDm);

  // U.M Profit/Loss includes Current Year AND Previous Year for Silk/Bye — pending rows no
  // longer exist in this section.
  const umReceipts =
    num(silk.currentYear.value.um) +
    num(silk.previousYear.value.um) +
    num(bye.currentYear.value.um) +
    num(bye.previousYear.value.um);
  const umProfitLoss = round2(totalNscUm - umReceipts);

  next.tab3.profitLoss.dm = dmProfitLoss;
  next.tab3.profitLoss.um = umProfitLoss;
  next.tab3.profitLoss.dmIsProfit = dmProfitLoss <= 0;
  next.tab3.profitLoss.umIsProfit = umProfitLoss <= 0;

  return next;
}
