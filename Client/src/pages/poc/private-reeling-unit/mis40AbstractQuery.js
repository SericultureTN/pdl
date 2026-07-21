import { ABSTRACT_UNIT_TYPES, NUMERIC_ROW_FIELDS } from './mis40Constants.js';
import { computeTotalRow } from './mis40Calculations.js';

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * SQL equivalent:
 *
 * SELECT unit_type,
 *   SUM(installed_unit), SUM(installed_device),
 *   SUM(functional_unit), SUM(functional_device),
 *   SUM(cocoon_purchased_dm), SUM(cocoon_purchased_um),
 *   SUM(cocoon_consumed_dm), SUM(cocoon_consumed_um),
 *   SUM(silk_production_dm), SUM(silk_production_um),
 *   SUM(disposal_ase_dm), SUM(disposal_ase_um),
 *   SUM(disposal_private_dm), SUM(disposal_private_um)
 * FROM reeling_register_rows r
 * JOIN reeling_registers reg ON r.register_id = reg.id
 * WHERE reg.month = :month AND reg.year = :year
 * GROUP BY unit_type;
 *
 * Client-side: aggregate each category's detail grid rows into abstract rows.
 */
export function computeAbstractFromCategories(categories = {}) {
  const safeCategories = categories && typeof categories === 'object' ? categories : {};

  const abstractRows = ABSTRACT_UNIT_TYPES.map((unitType) => {
    const row = {
      key: unitType.key,
      unitType: unitType.label,
      isGrandTotal: false,
    };

    NUMERIC_ROW_FIELDS.forEach((field) => {
      row[field] = 0;
    });

    if (unitType.sourceCategory && Array.isArray(safeCategories[unitType.sourceCategory]?.rows)) {
      const sourceRows = safeCategories[unitType.sourceCategory].rows;
      NUMERIC_ROW_FIELDS.forEach((field) => {
        row[field] = round2(sourceRows.reduce((acc, r) => acc + num(r[field]), 0));
      });
    }

    return row;
  });

  const grandTotal = {
    key: 'grandTotal',
    unitType: 'Grand Total',
    isGrandTotal: true,
  };

  NUMERIC_ROW_FIELDS.forEach((field) => {
    grandTotal[field] = round2(
      abstractRows.reduce((acc, row) => acc + num(row[field]), 0)
    );
  });

  return { rows: abstractRows, grandTotal };
}

export function getAbstractAsTableData(categories) {
  const { rows, grandTotal } = computeAbstractFromCategories(categories);
  return [...rows, grandTotal];
}

/** Mirrors DB aggregation for a single register category */
export function aggregateCategoryRows(rows) {
  if (!rows?.length) {
    return Object.fromEntries(NUMERIC_ROW_FIELDS.map((f) => [f, 0]));
  }
  return computeTotalRow(rows);
}
