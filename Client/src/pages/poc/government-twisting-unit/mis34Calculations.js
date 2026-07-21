function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function sumPeriodField(rows, fieldKey, periodKey) {
  return round2(
    Object.values(rows)
      .filter((row) => row && typeof row === 'object' && periodKey in row)
      .reduce((acc, row) => acc + num(row[periodKey]?.[fieldKey] ?? row[periodKey]), 0)
  );
}

export function applyMis34Calculations(data) {
  const next = structuredClone(data);

  // Tab 1: Stock particulars closing balance (kg)
  Object.values(next.tab1.stockParticulars).forEach((row) => {
    const opening = num(row.openingBalance);
    const added = num(row.purchasedQty) + num(row.ownProduction);
    const disposed = num(row.salesQty) + num(row.transferStock);
    row.closingBalance = round2(opening + added - disposed);
  });

  // Tab 1: Cost per kg by-product (from production details)
  const production = num(next.tab1.productionDetails.productionRawSilkTwisted);
  const totalValue = num(next.tab1.productionDetails.totalValueOfProduction);
  const salaries = num(next.tab1.productionDetails.salaries);
  next.tab1.productionDetails.costPerKgByProductWithStaff = production > 0
    ? round2(totalValue / production)
    : '';
  const valueWithoutSalaries = totalValue - salaries;
  next.tab1.productionDetails.costPerKgByProductWithoutStaff = production > 0
    ? round2(valueWithoutSalaries / production)
    : '';

  // Tab 2: Raw silk purchased closing balance
  ['duringMonth', 'uptoMonth'].forEach((period) => {
    const opening = num(next.tab2.rawSilkPurchased.openingBalance[period]);
    const purchased = num(next.tab2.rawSilkPurchased.purchasedReceived[period]);
    const issued = num(next.tab2.rawSilkPurchased.issuedForTwisting[period]);
    next.tab2.rawSilkPurchased.closingBalance[period] = round2(opening + purchased - issued);
  });

  // Tab 2: Machine stock totals and closing
  ['duringMonth', 'uptoMonth'].forEach((period) => {
    const ms = next.tab2.machineStock;
    const opening = num(ms.openingStock[period]);
    const issued = num(ms.rawSilkIssued[period]);
    const total = round2(opening + issued);
    ms.total[period] = total;
    const produced = num(ms.twistedSilkProduced[period]);
    const waste = num(ms.twistedWasteObtained[period]);
    ms.closingMachineStock[period] = round2(total - (produced + waste));
  });

  // Tab 2: Ready silk twisting closing & stock on hand
  ['duringMonth', 'uptoMonth'].forEach((period) => {
    const rs = next.tab2.readySilkTwisting;
    ['warp', 'weft'].forEach((kind) => {
      const produced = num(rs.quantityProduced[period][kind]);
      const sold = num(rs.quantitySold[period][kind]);
      const deposited = num(rs.depositedTansilk[period][kind]);
      rs.closingBalance[period][kind] = round2(produced - sold);
      rs.stockOnHand[period][kind] = round2(produced - sold - deposited);
    });
  });

  // Tab 2: NSC expenditure totals
  const nscKeys = [
    'rawSilkIssuedValue', 'wagesPaid', 'ebCharges',
    'consumableItems', 'transportCost', 'otherExpenditures',
  ];
  ['duringMonth', 'uptoMonth'].forEach((period) => {
    next.tab2.nscExpenditure.total[period] = round2(
      nscKeys.reduce((acc, key) => acc + num(next.tab2.nscExpenditure[key]?.[period]), 0)
    );
  });

  // Tab 3: Cost of production
  const totalNsc = num(next.tab2.nscExpenditure.total?.duringMonth);
  const lessWaste = num(next.tab3.costOfProduction.lessTwistedWasteSale);
  const netExp = round2(totalNsc - lessWaste);
  next.tab3.costOfProduction.totalNscExpenditure = totalNsc;
  next.tab3.costOfProduction.netExpenditure = netExp;

  const readyProduced = num(next.tab2.readySilkTwisting.quantityProduced?.duringMonth?.warp)
    + num(next.tab2.readySilkTwisting.quantityProduced?.duringMonth?.weft);
  next.tab3.costOfProduction.costPerKgReadySilk = readyProduced > 0
    ? round2(netExp / readyProduced)
    : '';

  // Tab 3: Estimated receipt total
  next.tab3.estimatedReceiptDetails.total = round2(
    num(next.tab3.estimatedReceiptDetails.readySilk)
    + num(next.tab3.estimatedReceiptDetails.twistedWaste)
  );

  // Tab 3: Actual receipt totals
  const rs = next.tab3.actualReceiptDetails.readySilkSold;
  rs.total = round2(num(rs.currentYear) + num(rs.previousYear));

  // Tab 3: Total actual receipts for profit/loss
  const totalActualReceipts = round2(
    num(rs.total)
    + num(next.tab3.actualReceiptDetails.twistedWasteSold.currentYear)
    + num(next.tab3.actualReceiptDetails.twistedWasteSold.previousYear)
  );

  const profitAmount = round2(totalActualReceipts - netExp);
  next.tab3.profitLoss.amount = profitAmount;
  next.tab3.profitLoss.isProfit = profitAmount >= 0;

  return next;
}

export function applyMis34ComputedToForm(values, setValue) {
  const computed = applyMis34Calculations(values);

  Object.entries(computed.tab1.stockParticulars).forEach(([key, row]) => {
    setValue(`tab1.stockParticulars.${key}.closingBalance`, row.closingBalance, { shouldDirty: false, shouldValidate: false });
  });
  setValue('tab1.productionDetails.costPerKgByProductWithStaff', computed.tab1.productionDetails.costPerKgByProductWithStaff, { shouldDirty: false, shouldValidate: false });
  setValue('tab1.productionDetails.costPerKgByProductWithoutStaff', computed.tab1.productionDetails.costPerKgByProductWithoutStaff, { shouldDirty: false, shouldValidate: false });

  ['duringMonth', 'uptoMonth'].forEach((period) => {
    setValue(`tab2.rawSilkPurchased.closingBalance.${period}`, computed.tab2.rawSilkPurchased.closingBalance[period], { shouldDirty: false, shouldValidate: false });
    setValue(`tab2.machineStock.total.${period}`, computed.tab2.machineStock.total[period], { shouldDirty: false, shouldValidate: false });
    setValue(`tab2.machineStock.closingMachineStock.${period}`, computed.tab2.machineStock.closingMachineStock[period], { shouldDirty: false, shouldValidate: false });
    setValue(`tab2.nscExpenditure.total.${period}`, computed.tab2.nscExpenditure.total[period], { shouldDirty: false, shouldValidate: false });
    ['warp', 'weft'].forEach((kind) => {
      setValue(`tab2.readySilkTwisting.closingBalance.${period}.${kind}`, computed.tab2.readySilkTwisting.closingBalance[period][kind], { shouldDirty: false, shouldValidate: false });
      setValue(`tab2.readySilkTwisting.stockOnHand.${period}.${kind}`, computed.tab2.readySilkTwisting.stockOnHand[period][kind], { shouldDirty: false, shouldValidate: false });
    });
  });

  setValue('tab3.costOfProduction.totalNscExpenditure', computed.tab3.costOfProduction.totalNscExpenditure, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.costOfProduction.netExpenditure', computed.tab3.costOfProduction.netExpenditure, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.costOfProduction.costPerKgReadySilk', computed.tab3.costOfProduction.costPerKgReadySilk, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.estimatedReceiptDetails.total', computed.tab3.estimatedReceiptDetails.total, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.actualReceiptDetails.readySilkSold.total', computed.tab3.actualReceiptDetails.readySilkSold.total, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.profitLoss.amount', computed.tab3.profitLoss.amount, { shouldDirty: false, shouldValidate: false });
  setValue('tab3.profitLoss.isProfit', computed.tab3.profitLoss.isProfit, { shouldDirty: false, shouldValidate: false });
}
