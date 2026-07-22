import {
  FINANCIAL_BUDGET_ROWS,
  FINANCIAL_CATEGORY_TYPES,
  RECEIPT_ITEMS,
  SILK_SALES_ROWS,
  COCOON_STOCK_ROWS,
  NSC_EXPENDITURE_ROWS,
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

/** Budget U.M = Budget U.L.M + Budget D.M; Actual Annual = Budget Annual − Budget U.M */
export function computeFinancialCategory(category) {
  if (!category || typeof category !== 'object') return category;
  const budgetUm = round2(num(category.budgetUlM) + num(category.budgetDm));
  return {
    ...category,
    budgetUm,
    actualAnnual: round2(num(category.budgetAnnual) - budgetUm),
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


function computeCostDetails(tab2) {
  Object.keys(tab2.costDetails).forEach((key) => {
    tab2.costDetails[key] = computeTimePeriod(tab2.costDetails[key]);
  });
  return tab2.costDetails;
}

function computeCostOfProduction(tab2) {
  const nsc = tab2.nscExpenditure;
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

  cop.costPerKgWithStaff = computeTimePeriod(cop.costPerKgWithStaff);
  cop.costPerKgWithoutStaff = computeTimePeriod(cop.costPerKgWithoutStaff);

  return cop;
}

export function applyMis37Calculations(data) {
  const next = structuredClone(data);

  // Tab 1: Achievement physical — U.M = U.L.M + D.M
  Object.keys(next.tab1.achievementPhysical).forEach((key) => {
    next.tab1.achievementPhysical[key] = computeTimePeriod(next.tab1.achievementPhysical[key]);
  });

  // Tab 1: Achievement financial
  FINANCIAL_BUDGET_ROWS.forEach(({ key: rowKey }) => {
    FINANCIAL_CATEGORY_TYPES.forEach(({ key: typeKey }) => {
      next.tab1.achievementFinancial[rowKey][typeKey] = computeFinancialCategory(
        next.tab1.achievementFinancial[rowKey][typeKey]
      );
    });
  });

  // Tab 1: Rendita % = (Cocoon Used Kg ÷ Silk Produced Kg) × 100
  const cocoonUsed = num(next.tab1.productionDetails.cocoonUsedKg);
  const silkProduced = num(next.tab1.productionDetails.silkProducedQty);
  next.tab1.productionDetails.renditaPercent = silkProduced > 0
    ? round2((cocoonUsed / silkProduced) * 100)
    : '';

  // Tab 1: Stock particulars — Closing = Opening + Added − Under Process
  Object.values(next.tab1.stockParticulars).forEach((row) => {
    const opening = num(row.openingBalance);
    const added = num(row.stockAdded);
    const underProcess = num(row.underProcess);
    row.closingBalance = round2(opening + added - underProcess);
  });

  // Tab 1: Receipts — U.M on valueRs and cash
  RECEIPT_ITEMS.forEach(({ key }) => {
    if (next.tab1.receipts[key]) {
      next.tab1.receipts[key].valueRs = computeTimePeriod(next.tab1.receipts[key].valueRs);
      next.tab1.receipts[key].cash = computeTimePeriod(next.tab1.receipts[key].cash);
    }
  });

  // Tab 1: Silk sales — U.M on qty and value
  SILK_SALES_ROWS.forEach(({ key }) => {
    if (next.tab1.silkSalesRealisation[key]) {
      next.tab1.silkSalesRealisation[key].qty = computeTimePeriod(
        next.tab1.silkSalesRealisation[key].qty
      );
      next.tab1.silkSalesRealisation[key].value = computeTimePeriod(
        next.tab1.silkSalesRealisation[key].value
      );
    }
  });

  // Tab 2: Cocoon stock — U.M = U.L.M + D.M; closing derived
  COCOON_STOCK_ROWS.filter((r) => !r.computed).forEach(({ key }) => {
    const row = next.tab2.cocoonStockMovement[key];
    if (row) {
      row.qty = computeTimePeriod(row.qty);
      row.value = computeTimePeriod(row.value);
    }
  });
  computeClosingStock(next.tab2.cocoonStockMovement);

  // Tab 2: NSC Expenditure — U.M per field; total summed per column (ulm, dm, um)
  const nscKeys = NSC_EXPENDITURE_ROWS.filter((r) => !r.computed).map((r) => r.key);
  nscKeys.forEach((key) => {
    next.tab2.nscExpenditure[key] = computeTimePeriod(next.tab2.nscExpenditure[key]);
  });
  next.tab2.nscExpenditure.total = {
    ulm: round2(nscKeys.reduce((acc, key) => acc + num(next.tab2.nscExpenditure[key]?.ulm), 0)),
    dm: round2(nscKeys.reduce((acc, key) => acc + num(next.tab2.nscExpenditure[key]?.dm), 0)),
    um: round2(nscKeys.reduce((acc, key) => acc + num(next.tab2.nscExpenditure[key]?.um), 0)),
  };

  next.tab2.costDetails = computeCostDetails(next.tab2);
  next.tab2.costOfProduction = computeCostOfProduction(next.tab2);

  const totalNscDm = num(next.tab2.nscExpenditure.total?.dm);
  const totalNscUm = num(next.tab2.nscExpenditure.total?.um);

  // Tab 3: Stock details kgs totals and closing
  Object.values(next.tab3.stockDetailsKgs).forEach((row) => {
    const opening = num(row.openingBalance);
    const purchase = num(row.purchase);
    const sold = num(row.soldIssued);
    row.total = round2(opening + purchase);
    row.closingBalance = round2(row.total - sold);
  });

  const rawDm = num(next.tab3.estimatedSaleValue.rawSilk.dm);
  const rawUm = num(next.tab3.estimatedSaleValue.rawSilk.um);
  const byeDm = num(next.tab3.estimatedSaleValue.byeProducts.dm);
  const byeUm = num(next.tab3.estimatedSaleValue.byeProducts.um);
  next.tab3.estimatedSaleValue.total.dm = round2(rawDm + byeDm);
  next.tab3.estimatedSaleValue.total.um = round2(rawUm + byeUm);

  const silk = next.tab3.actualReceiptDetails.silkSold;
  silk.total.qty = round2(num(silk.currentYear.qty) + num(silk.previousYear.qty));
  silk.total.value = round2(num(silk.currentYear.value) + num(silk.previousYear.value));

  const bye = next.tab3.actualReceiptDetails.byeProductsSold;
  bye.total.qty = round2(num(bye.currentYear.qty) + num(bye.previousYear.qty));
  bye.total.value = round2(num(bye.currentYear.value) + num(bye.previousYear.value));

  const estimatedTotalDm = num(next.tab3.estimatedSaleValue.total.dm);
  const silkSoldValue = num(silk.total.value);
  const byeSoldValue = num(bye.total.value);
  const pendingCurrent = num(next.tab3.actualReceiptDetails.pendingWithExchange.currentYear);
  const pendingPrevious = num(next.tab3.actualReceiptDetails.pendingWithExchange.previousYear);
  const pendingTotal = pendingCurrent + pendingPrevious;

  const dmProfitLoss = round2(totalNscDm - estimatedTotalDm);
  const umReceipts = silkSoldValue + byeSoldValue + pendingTotal;
  const umProfitLoss = round2(totalNscUm - umReceipts);

  next.tab3.profitLoss.dm = dmProfitLoss;
  next.tab3.profitLoss.um = umProfitLoss;
  next.tab3.profitLoss.dmIsProfit = dmProfitLoss <= 0;
  next.tab3.profitLoss.umIsProfit = umProfitLoss <= 0;

  return next;
}
