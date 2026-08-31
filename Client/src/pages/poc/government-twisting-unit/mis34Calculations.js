import {
  UNIT_TABLE_GROUPS,
  NSC_EXPENDITURE_TABLE_FIELDS,
  COST_SALE_TABLE_FIELDS,
  PRODUCTION_TABLE_FIELDS,
  ACHIEVEMENT_REPORT_FIELDS,
} from './mis34Constants.js';

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/** U.M is never entered directly — always U.L.M + D.M, for any U.L.M/D.M/U.M field group. */
export function computeTableUm(data, fields) {
  const next = { ...data };
  fields.forEach(({ ulmKey, dmKey, umKey }) => {
    next[umKey] = round2(num(data?.[ulmKey]) + num(data?.[dmKey]));
  });
  return next;
}

export function computeProductionUm(productionDetails) {
  return computeTableUm(productionDetails, PRODUCTION_TABLE_FIELDS);
}

/** Report-level Achievement to Target (Target/Achieved rows) — not per-unit. */
export function computeAchievementUm(achievementToTarget) {
  return computeTableUm(achievementToTarget, ACHIEVEMENT_REPORT_FIELDS);
}

/** Recomputes every U.L.M/D.M/U.M group on a unit — used before persisting/rolling over. */
export function computeUnitTables(unit) {
  const next = {};
  UNIT_TABLE_GROUPS.forEach(({ path, fields }) => {
    next[path] = computeTableUm(unit?.[path] || {}, fields);
  });
  return next;
}

/** Sums a table group's rows into a per-column { ulm, dm, um } total. */
function sumColumns(data, fields) {
  return fields.reduce(
    (acc, { ulmKey, dmKey, umKey }) => ({
      ulm: acc.ulm + num(data?.[ulmKey]),
      dm: acc.dm + num(data?.[dmKey]),
      um: acc.um + num(data?.[umKey]),
    }),
    { ulm: 0, dm: 0, um: 0 }
  );
}

/** Live-computed totals for one unit — never stored, always derived from its own fields. */
export function computeUnitTotals(unit) {
  const tables = computeUnitTables(unit);
  const nsc = tables.nscExpenditure;
  const costSale = tables.costSaleValue;
  const production = tables.productionDetails;

  const nscTotal = sumColumns(nsc, NSC_EXPENDITURE_TABLE_FIELDS);
  nscTotal.ulm = round2(nscTotal.ulm);
  nscTotal.dm = round2(nscTotal.dm);
  nscTotal.um = round2(nscTotal.um);

  // Net Expenditure / Cost per Kg have no U.L.M column of their own — they are
  // calculated fresh per D.M and U.M from other rows' D.M/U.M values.
  const netExpenditure = {
    dm: round2(nscTotal.dm - num(costSale.saleValueOfTwistedWasteDm)),
    um: round2(nscTotal.um - num(costSale.saleValueOfTwistedWasteUm)),
  };
  const productionDm = num(production.productionOfTwistedRawSilkDm);
  const productionUm = num(production.productionOfTwistedRawSilkUm);
  const costOfProductionPerKg = {
    dm: productionDm > 0 ? round2(netExpenditure.dm / productionDm) : '',
    um: productionUm > 0 ? round2(netExpenditure.um / productionUm) : '',
  };

  return {
    totalNscExpenditure: nscTotal.dm, // kept for backward-compatible callers (list/abstract, D.M column)
    nscTotal,
    netExpenditure,
    costOfProductionPerKg,
  };
}

export function computeUnitWithTotals(unit) {
  return { ...unit, computed: computeUnitTotals(unit) };
}

/** Abstract rollup: one row per unit plus a grand total row, all derived from `units`. */
export function computeAbstract(units) {
  const safeUnits = Array.isArray(units) ? units : [];

  const rows = safeUnits.map((unit) => {
    const totals = computeUnitTotals(unit);
    const production = computeProductionUm(unit.productionDetails || {});
    return {
      key: unit.id,
      unitName: unit.unitName || '(unnamed unit)',
      spindlesInstalled: num(unit.productionDetails?.spindlesInstalled),
      productionOfTwistedRawSilk: num(production.productionOfTwistedRawSilkDm),
      totalNscExpenditure: totals.nscTotal.dm,
      totalValueOfProduction: num(production.totalValueOfProductionDm),
      costOfProductionPerKg: totals.costOfProductionPerKg.dm,
      netExpenditure: totals.netExpenditure.dm,
    };
  });

  const grandTotal = rows.reduce(
    (acc, row) => {
      acc.spindlesInstalled += row.spindlesInstalled;
      acc.productionOfTwistedRawSilk += row.productionOfTwistedRawSilk;
      acc.totalNscExpenditure += row.totalNscExpenditure;
      acc.totalValueOfProduction += row.totalValueOfProduction;
      acc.netExpenditure += row.netExpenditure;
      return acc;
    },
    { spindlesInstalled: 0, productionOfTwistedRawSilk: 0, totalNscExpenditure: 0, totalValueOfProduction: 0, netExpenditure: 0 }
  );

  const grandTotalRow = {
    key: 'grand-total',
    unitName: 'TOTAL',
    isGrandTotal: true,
    spindlesInstalled: round2(grandTotal.spindlesInstalled),
    productionOfTwistedRawSilk: round2(grandTotal.productionOfTwistedRawSilk),
    totalNscExpenditure: round2(grandTotal.totalNscExpenditure),
    totalValueOfProduction: round2(grandTotal.totalValueOfProduction),
    costOfProductionPerKg: grandTotal.productionOfTwistedRawSilk > 0
      ? round2(grandTotal.netExpenditure / grandTotal.productionOfTwistedRawSilk)
      : '',
  };

  return [...rows, grandTotalRow];
}

export function createUnitId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `unit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
