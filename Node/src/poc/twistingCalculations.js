// Server-side port of Client/src/pages/poc/government-twisting-unit/mis34Calculations.js's
// computeUnitTotals/computeAbstract, operating on poc_twisting_units DB rows
// (snake_case *_ulm/*_dm/*_um columns, *_um already computed by Postgres'
// GENERATED column) instead of the client's nested ulmKey/dmKey/umKey shape.
import { TWISTING_UNIT_ULM_DM_FIELDS } from './twistingReportSchema.js';

const NSC_FIELDS = ['value_of_raw_silk_issued', 'wages_paid', 'eb_charges', 'consumable_items', 'transport_cost', 'other_expenditures'];

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/** Reshapes a flat poc_twisting_units DB row into { fieldKey: {ulm, dm, um} } for every table field. */
export function unitFieldTriples(row) {
  const out = {};
  TWISTING_UNIT_ULM_DM_FIELDS.forEach((field) => {
    out[field] = { ulm: num(row[`${field}_ulm`]), dm: num(row[`${field}_dm`]), um: num(row[`${field}_um`]) };
  });
  return out;
}

/** Live-computed totals for one unit row — never stored. */
export function computeUnitTotals(row) {
  const fields = unitFieldTriples(row);

  const nscTotal = NSC_FIELDS.reduce(
    (acc, key) => ({ ulm: acc.ulm + fields[key].ulm, dm: acc.dm + fields[key].dm, um: acc.um + fields[key].um }),
    { ulm: 0, dm: 0, um: 0 }
  );
  nscTotal.ulm = round2(nscTotal.ulm);
  nscTotal.dm = round2(nscTotal.dm);
  nscTotal.um = round2(nscTotal.um);

  const netExpenditure = {
    dm: round2(nscTotal.dm - fields.sale_value_of_twisted_waste.dm),
    um: round2(nscTotal.um - fields.sale_value_of_twisted_waste.um),
  };
  const productionDm = fields.production_of_twisted_raw_silk.dm;
  const productionUm = fields.production_of_twisted_raw_silk.um;
  const costOfProductionPerKg = {
    dm: productionDm > 0 ? round2(netExpenditure.dm / productionDm) : null,
    um: productionUm > 0 ? round2(netExpenditure.um / productionUm) : null,
  };

  return { fields, nscTotal, netExpenditure, costOfProductionPerKg };
}

/** Abstract rollup: one row per unit plus a grand total row. */
export function computeAbstract(units) {
  const rows = units.map((row) => {
    const totals = computeUnitTotals(row);
    return {
      id: row.id,
      unitName: row.unit_name,
      spindlesInstalled: num(row.spindles_installed),
      productionOfTwistedRawSilk: totals.fields.production_of_twisted_raw_silk.dm,
      totalNscExpenditure: totals.nscTotal.dm,
      totalValueOfProduction: totals.fields.total_value_of_production.dm,
      costOfProductionPerKg: totals.costOfProductionPerKg.dm,
      netExpenditure: totals.netExpenditure.dm,
    };
  });

  const grandTotal = rows.reduce(
    (acc, row) => ({
      spindlesInstalled: acc.spindlesInstalled + row.spindlesInstalled,
      productionOfTwistedRawSilk: acc.productionOfTwistedRawSilk + row.productionOfTwistedRawSilk,
      totalNscExpenditure: acc.totalNscExpenditure + row.totalNscExpenditure,
      totalValueOfProduction: acc.totalValueOfProduction + row.totalValueOfProduction,
      netExpenditure: acc.netExpenditure + row.netExpenditure,
    }),
    { spindlesInstalled: 0, productionOfTwistedRawSilk: 0, totalNscExpenditure: 0, totalValueOfProduction: 0, netExpenditure: 0 }
  );

  return {
    rows,
    grandTotal: {
      unitName: 'TOTAL',
      spindlesInstalled: round2(grandTotal.spindlesInstalled),
      productionOfTwistedRawSilk: round2(grandTotal.productionOfTwistedRawSilk),
      totalNscExpenditure: round2(grandTotal.totalNscExpenditure),
      totalValueOfProduction: round2(grandTotal.totalValueOfProduction),
      costOfProductionPerKg: grandTotal.productionOfTwistedRawSilk > 0
        ? round2(grandTotal.netExpenditure / grandTotal.productionOfTwistedRawSilk)
        : null,
    },
  };
}

// April=1 .. March=12 fiscal month order, matching poc_reports.month's storage
// convention (see reports.js's monthNameToInt) — used to derive the Target
// row's D.M from a yearly target the same way deriveMonthlyFromAnnual.js does
// on the client.
export function deriveMonthlyFromAnnual(annualValue, fiscalMonthInt) {
  const annual = Number(annualValue);
  if (!Number.isFinite(annual) || !Number.isInteger(fiscalMonthInt) || fiscalMonthInt < 1 || fiscalMonthInt > 12) return 0;
  const base = Math.floor(annual / 12);
  if (fiscalMonthInt === 12) return annual - base * 11;
  return base;
}

export { num, round2 };
