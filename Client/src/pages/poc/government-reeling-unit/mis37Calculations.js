function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumObjectValues(obj, keys) {
  return keys.reduce((acc, key) => acc + num(obj?.[key]), 0);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

export function applyMis37Calculations(data) {
  const next = structuredClone(data);

  // Tab 1: Rendita %
  const cocoonUsed = num(next.tab1.productionDetails.cocoonUsedKg);
  const silkProduced = num(next.tab1.productionDetails.silkProducedQty);
  next.tab1.productionDetails.renditaPercent = cocoonUsed > 0
    ? round2((silkProduced / cocoonUsed) * 100)
    : '';

  // Tab 1: Stock particulars closing balance
  Object.values(next.tab1.stockParticulars).forEach((row) => {
    const opening = num(row.openingBalance);
    const added = num(row.stockAdded);
    const disposed = num(row.stockDisposedQty);
    row.closingBalance = round2(opening + added - disposed);
  });

  // Tab 2: NSC Expenditure total
  const nscKeys = [
    'reeledCocoonsValue', 'wagesPaid', 'fuelCost', 'ebCharges',
    'maintenanceCharges', 'transportCharges', 'others',
  ];
  next.tab2.nscExpenditure.total = round2(
    sumObjectValues(next.tab2.nscExpenditure, nscKeys)
  );

  // Tab 2: Cost of production
  const totalNsc = num(next.tab2.nscExpenditure.total);
  const byeSale = num(next.tab2.costOfProduction.saleValueByeProducts);
  const netNsc = round2(totalNsc - byeSale);
  next.tab2.costOfProduction.totalNscExpenditure = totalNsc;
  next.tab2.costOfProduction.netNscExpenditure = netNsc;

  const silkKg = num(next.tab2.costDetails.actualSilkKg) || silkProduced;
  next.tab2.costOfProduction.costPerKgWithStaff = silkKg > 0 ? round2(netNsc / silkKg) : '';
  const wages = num(next.tab2.nscExpenditure.wagesPaid);
  const netWithoutStaff = round2(netNsc - wages);
  next.tab2.costOfProduction.costPerKgWithoutStaff = silkKg > 0
    ? round2(netWithoutStaff / silkKg)
    : '';

  // Tab 2: Actual rendita from production
  next.tab2.costDetails.actualRendita = next.tab1.productionDetails.renditaPercent;

  // Tab 3: Stock details kgs totals and closing
  Object.values(next.tab3.stockDetailsKgs).forEach((row) => {
    const opening = num(row.openingBalance);
    const purchase = num(row.purchase);
    const sold = num(row.soldIssued);
    row.total = round2(opening + purchase);
    row.closingBalance = round2(row.total - sold);
  });

  // Tab 3: Estimated sale value totals
  const rawDm = num(next.tab3.estimatedSaleValue.rawSilk.dm);
  const rawUm = num(next.tab3.estimatedSaleValue.rawSilk.um);
  const byeDm = num(next.tab3.estimatedSaleValue.byeProducts.dm);
  const byeUm = num(next.tab3.estimatedSaleValue.byeProducts.um);
  next.tab3.estimatedSaleValue.total.dm = round2(rawDm + byeDm);
  next.tab3.estimatedSaleValue.total.um = round2(rawUm + byeUm);

  // Tab 3: Actual receipt totals
  const silk = next.tab3.actualReceiptDetails.silkSold;
  silk.total.qty = round2(num(silk.currentYear.qty) + num(silk.previousYear.qty));
  silk.total.value = round2(num(silk.currentYear.value) + num(silk.previousYear.value));

  const bye = next.tab3.actualReceiptDetails.byeProductsSold;
  bye.total.qty = round2(num(bye.currentYear.qty) + num(bye.previousYear.qty));
  bye.total.value = round2(num(bye.currentYear.value) + num(bye.previousYear.value));

  // Tab 3: Profit / Loss
  const estimatedTotalDm = num(next.tab3.estimatedSaleValue.total.dm);
  const estimatedTotalUm = num(next.tab3.estimatedSaleValue.total.um);
  const silkSoldValue = num(silk.total.value);
  const byeSoldValue = num(bye.total.value);
  const pendingCurrent = num(next.tab3.actualReceiptDetails.pendingWithExchange.currentYear);
  const pendingPrevious = num(next.tab3.actualReceiptDetails.pendingWithExchange.previousYear);
  const pendingTotal = pendingCurrent + pendingPrevious;

  const dmProfitLoss = round2(totalNsc - estimatedTotalDm);
  const umReceipts = silkSoldValue + byeSoldValue + pendingTotal;
  const umProfitLoss = round2(totalNsc - umReceipts);

  next.tab3.profitLoss.dm = dmProfitLoss;
  next.tab3.profitLoss.um = umProfitLoss;
  next.tab3.profitLoss.dmIsProfit = dmProfitLoss <= 0;
  next.tab3.profitLoss.umIsProfit = umProfitLoss <= 0;

  return next;
}

export function getComputedFieldPaths() {
  return [
    'tab1.productionDetails.renditaPercent',
    'tab2.nscExpenditure.total',
    'tab2.costOfProduction.totalNscExpenditure',
    'tab2.costOfProduction.netNscExpenditure',
    'tab2.costOfProduction.costPerKgWithStaff',
    'tab2.costOfProduction.costPerKgWithoutStaff',
    'tab2.costDetails.actualRendita',
    'tab3.profitLoss.dm',
    'tab3.profitLoss.um',
    'tab3.profitLoss.dmIsProfit',
    'tab3.profitLoss.umIsProfit',
  ];
}
