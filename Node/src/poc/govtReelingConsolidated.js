import { query } from '../postgres.js';

// Consolidated cross-office monthly report for Government Reeling Unit,
// matching the real department workbook (POC PDL formats/Govt Reeling/GSRU
// 2026-27 - Copy.xlsx) — one row per office, columns/groups/Total-row math
// extracted directly from that file's actual formulas (verified cell by
// cell, not guessed). `data` on each submitted poc_reports row already
// holds fully-computed tab1/tab2/tab3 values (the client's
// mis37Calculations.js runs applyMis37Calculations() before every save), so
// this module reads those directly rather than re-implementing the
// calculation engine here.
//
// FIELDS WITH NO EXACT EQUIVALENT in our data model (best-effort mapping,
// flagged inline below):
//   - Cocoon Purchased/Reeled U.L.M (P, S columns): the source file tracks
//     these as their own running U.L.M/D.M/U.M triples; our Stock
//     Particulars only carries the *overall* opening/closing balance
//     forward, not per-purchased/per-reeled totals. Rendered as 0.
//   - Assessed Renditta "CB" sub-column (AA): the source has two renditta
//     assessment methods (CB / CSR); we only track one value
//     (costDetails.assessedRendita). Rendered as 0; CSR (AB/AC) uses our
//     real value.
//   - Estimated Sale Value of Raw Silk "avg rate of 4 weeks" (BK): the
//     source computes D.M as rate × achieved qty; ours stores the D.M Rs
//     value directly. BK is back-derived (dm ÷ achievedDm) for display.

const MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeDiv(numerator, denominator) {
  return denominator ? numerator / denominator : 0;
}

function get(obj, path, fallback = 0) {
  const val = path.split('.').reduce((acc, key) => acc?.[key], obj);
  return val === undefined || val === null || val === '' ? fallback : val;
}

/** Previous fiscal year's same calendar month, for the Prior-Year Achievement columns. */
function priorYear(fiscalYear) {
  return Number(fiscalYear) - 1;
}

async function fetchOfficeReport(officeId, unitType, fiscalYear, month) {
  const result = await query(
    'SELECT * FROM poc_reports WHERE unit_type = $1 AND office_id = $2 AND fiscal_year = $3 AND month = $4 LIMIT 1',
    [unitType, officeId, fiscalYear, MONTHS.indexOf(month) + 1]
  );
  return result.rows[0] || null;
}

async function fetchTarget(officeId, fiscalYearLabel) {
  // poc_targets is still keyed by the "YYYY-YYYY" fiscal_year label + office_id.
  const result = await query(
    `SELECT * FROM poc_targets WHERE unit_type = 'government_reeling' AND office_id = $1 AND fiscal_year = $2 AND is_current LIMIT 1`,
    [officeId, fiscalYearLabel]
  );
  return result.rows[0] || null;
}

function buildOfficeRow({ office, current, priorYearReport, target }) {
  const data = current?.data || {};
  const tab1 = data.tab1 || {};
  const tab2 = data.tab2 || {};
  const tab3 = data.tab3 || {};

  const targetRow = tab1.achievementPhysical?.target || {};
  const achievedRow = tab1.achievementPhysical?.achieved || {};
  const targetAnnual = num(target?.physical_target?.target);
  const targetDm = num(targetRow.dm);
  const targetUm = num(targetRow.um);
  const achievedUlm = num(achievedRow.ulm);
  const achievedDm = num(achievedRow.dm);
  const achievedUm = num(achievedRow.um);

  const priorAchievedDm = num(get(priorYearReport, 'data.tab1.achievementPhysical.achieved.dm'));
  const priorAchievedUm = priorAchievedDm; // sheet formula: L = K (mirrors D.M)

  const cocoon = tab1.stockParticulars?.cocoon || {};
  const cocoonPurchasedDm = num(cocoon.stockAdded);
  const cocoonReeledDm = num(cocoon.consumedSoldDisposed);

  const nsc = tab2.nscExpenditure || {};
  const cd = tab2.costDetails || {};
  const pd = tab1.productionDetails || {};

  const fuelCostDm = num(nsc.fuelCost?.dm);
  const fuelCostUm = num(nsc.fuelCost?.um);
  const mandaysDm = num(pd.mandaysUsed?.dm);
  const mandaysUm = num(pd.mandaysUsed?.um);
  const conversionCostDm = num(cd.conversionCostPerKg?.dm);
  const conversionCostUm = num(cd.conversionCostPerKg?.um);

  const cop = tab2.costOfProduction || {};
  const esv = tab3.estimatedSaleValue || {};
  const rawSilkSale = esv.rawSilk || {};
  const byeProductsSale = esv.byeProducts || {};
  const skg = tab3.stockDetailsKgs?.rawSilk || {};
  const pl = tab3.profitLoss || {};

  const plDm = num(pl.dm) * (pl.dmIsProfit === false ? -1 : 1);
  const plUm = num(pl.um) * (pl.umIsProfit === false ? -1 : 1);

  const rawSilkOpening = num(skg.openingBalance);
  const rawSilkAchieved = achievedDm;
  const totalRawSilk = rawSilkOpening + rawSilkAchieved;
  const rawSilkSold = num(skg.soldIssued);

  return {
    officeId: office.id,
    officeName: office.name,
    region: office.region,
    hasReport: Boolean(current),
    // Group 1 — Achievement & Cocoon Stock
    targetAnnual,
    targetDm,
    targetUm,
    achievedUlm,
    achievedDm,
    achievedUm,
    achievementPercentDm: safeDiv(achievedDm, targetDm),
    achievementPercentUm: safeDiv(achievedUm, targetUm),
    priorAchievedDm,
    priorAchievedUm,
    differenceDm: achievedDm - priorAchievedDm,
    differenceUm: achievedUm - priorAchievedUm,
    cocoonOpeningBalance: num(cocoon.openingBalance),
    cocoonPurchasedUlm: 0, // see module-level note
    cocoonPurchasedDm,
    cocoonPurchasedUm: cocoonPurchasedDm,
    cocoonReeledUlm: 0, // see module-level note
    cocoonReeledDm,
    cocoonReeledUm: cocoonReeledDm,
    cocoonClosingBalance: num(cocoon.closingBalance),
    functionalDays: num(pd.daysWorked?.dm),
    basinsInUse: num(pd.devicesInUse),
    // Group 2 — Cost Details
    assessedRenditaCb: 0, // see module-level note
    assessedRenditaCsrDm: num(cd.assessedRendita?.dm),
    assessedRenditaUm: num(cd.assessedRendita?.um),
    actualRenditaCb: '-',
    actualRenditaDm: num(cd.actualRendita?.dm),
    actualRenditaUm: num(cd.actualRendita?.um),
    fuelCostDm,
    fuelCostUm,
    fuelCostPerKgDm: num(cd.fuelCostPerKg?.dm),
    fuelCostPerKgUm: num(cd.fuelCostPerKg?.um),
    mandaysDm,
    mandaysUm,
    mandaysPerKgDm: num(cd.mandaysPerKg?.dm),
    mandaysPerKgUm: num(cd.mandaysPerKg?.um),
    wagesDm: num(nsc.wagesPaid?.dm),
    wagesUm: num(nsc.wagesPaid?.um),
    ebDm: num(nsc.ebCharges?.dm),
    ebUm: num(nsc.ebCharges?.um),
    transportDm: num(nsc.transportCharges?.dm),
    transportUm: num(nsc.transportCharges?.um),
    othersDm: num(nsc.others?.dm),
    othersUm: num(nsc.others?.um),
    conversionCostDm,
    conversionCostUm,
    conversionCostFinalDm: conversionCostDm - 100,
    conversionCostFinalUm: conversionCostUm - 100,
    // Group 3 — Cost of Production, Sales & Profit/Loss
    costPerKgWithWagesDm: num(cop.costPerKgWithStaff?.dm),
    costPerKgWithWagesUm: num(cop.costPerKgWithStaff?.um),
    costPerKgWithoutWagesDm: num(cop.costPerKgWithoutStaff?.dm),
    costPerKgWithoutWagesUm: num(cop.costPerKgWithoutStaff?.um),
    nscExpenditureUlm: num(nsc.total?.ulm),
    nscExpenditureDm: num(nsc.total?.dm),
    nscExpenditureUm: num(nsc.total?.um),
    rawSilkSaleUlm: num(rawSilkSale.ulm),
    rawSilkSaleAvgRate: safeDiv(num(rawSilkSale.dm), achievedDm),
    rawSilkSaleDm: num(rawSilkSale.dm),
    rawSilkSaleUm: num(rawSilkSale.um),
    byeProductsSaleDm: num(byeProductsSale.dm),
    byeProductsSaleUm: num(byeProductsSale.um),
    totalValueDm: num(esv.total?.dm),
    totalValueUm: num(esv.total?.um),
    rawSilkOpening,
    rawSilkAchieved,
    totalRawSilk,
    rawSilkSold,
    rawSilkOnHand: totalRawSilk - rawSilkSold,
    profitLossDm: plDm,
    profitLossUm: plUm,
  };
}

const SUM_KEYS = [
  'targetAnnual', 'targetDm', 'targetUm', 'achievedUlm', 'achievedDm', 'achievedUm',
  'priorAchievedDm', 'priorAchievedUm', 'differenceDm', 'differenceUm',
  'cocoonOpeningBalance', 'cocoonPurchasedUlm', 'cocoonPurchasedDm', 'cocoonPurchasedUm',
  'cocoonReeledUlm', 'cocoonReeledDm', 'cocoonReeledUm', 'cocoonClosingBalance',
  'nscExpenditureUlm', 'nscExpenditureDm', 'nscExpenditureUm',
  'rawSilkSaleUlm', 'rawSilkSaleDm', 'rawSilkSaleUm',
  'byeProductsSaleDm', 'byeProductsSaleUm', 'totalValueDm', 'totalValueUm',
  'rawSilkOpening', 'rawSilkAchieved', 'totalRawSilk', 'rawSilkSold', 'rawSilkOnHand',
  'profitLossDm', 'profitLossUm',
];

/** Ratio/rate columns: Total row recomputes from summed raw components, never
 * sums or averages the per-office ratios themselves — matches the source
 * file's own formulas (e.g. Total Achievement % = SUM(Achieved) / SUM(Target)). */
function buildTotalRow(rows) {
  const total = { officeName: 'TOTAL', region: '', hasReport: true };
  SUM_KEYS.forEach((key) => {
    total[key] = rows.reduce((acc, r) => acc + num(r[key]), 0);
  });
  total.achievementPercentDm = safeDiv(total.achievedDm, total.targetDm);
  total.achievementPercentUm = safeDiv(total.achievedUm, total.targetUm);
  total.rawSilkSaleAvgRate = safeDiv(total.rawSilkSaleDm, total.achievedDm);
  total.assessedRenditaCsrDm = safeDiv(
    rows.reduce((acc, r) => acc + num(r.assessedRenditaCsrDm), 0), rows.length || 1
  );
  return total;
}

/** Assembles one month's consolidated report: one row per govt_reeling_offices office + Total row. */
export async function getConsolidatedReport({ fiscalYear, fiscalYearLabel, month }) {
  const officesResult = await query('SELECT id, name, region FROM govt_reeling_offices ORDER BY id');
  const offices = officesResult.rows;

  const rows = [];
  for (const office of offices) {
    const [current, priorYearReport, target] = await Promise.all([
      fetchOfficeReport(office.id, 'government_reeling', fiscalYear, month),
      fetchOfficeReport(office.id, 'government_reeling', priorYear(fiscalYear), month),
      fetchTarget(office.id, fiscalYearLabel),
    ]);
    rows.push(buildOfficeRow({ office, current, priorYearReport, target }));
  }

  // April-December fall in the fiscal year's start year; Jan/Feb/March in start+1.
  const monthIdx = MONTHS.indexOf(month);
  const calendarYear = monthIdx >= 9 ? Number(fiscalYear) + 1 : Number(fiscalYear);

  return { month, fiscalYear, fiscalYearLabel, calendarYear, rows, total: buildTotalRow(rows) };
}
