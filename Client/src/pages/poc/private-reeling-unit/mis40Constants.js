export const MIS40_REPORT_TITLE = 'Private Reeling Units Monthly Return';
export const MIS40_FORM_CODE = 'MIS-40';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CATEGORY_TABS = [
  { id: 'arm', label: 'ARM', title: 'Automatic Reeling Units', unitType: 'arm' },
  { id: 'charka', label: 'Charka', title: 'Charka Reeling Units', unitType: 'charka' },
  { id: 'cottage', label: 'Cottage', title: 'Cottage Reeling Units', unitType: 'cottage' },
  { id: 'mrm', label: 'MRM', title: 'Multiend Silk Reeling Units', unitType: 'mrm' },
  { id: 'abstract', label: 'Abstract', title: 'Abstract Summary', readOnly: true },
];

/** Columns summed in TOTAL row and Abstract aggregation */
export const NUMERIC_ROW_FIELDS = [
  'installedUnit',
  'installedDevice',
  'functionalUnit',
  'functionalDevice',
  'cocoonPurchasedDm',
  'cocoonPurchasedUm',
  'cocoonConsumedDm',
  'cocoonConsumedUm',
  'silkProductionDm',
  'silkProductionUm',
  'silkProductionCapacityDm',
  'silkProductionCapacityUm',
  'functionalDaysDm',
  'functionalDaysUm',
  'disposalAseDm',
  'disposalAseUm',
  'disposalPrivateDm',
  'disposalPrivateUm',
];

export const REGISTER_COLUMNS = [
  { id: 'sNo', label: 'S.No', type: 'readonly', width: 56 },
  { id: 'beneficiaryName', label: 'Name of the Beneficiary', type: 'text', width: 180 },
  { id: 'place', label: 'Place', type: 'text', width: 140 },
  { id: 'installedUnit', label: 'Installed — Unit', type: 'number', group: 'Installed', width: 90 },
  { id: 'installedDevice', label: 'Installed — Device', type: 'number', group: 'Installed', width: 90 },
  { id: 'functionalUnit', label: 'Functional — Unit', type: 'number', group: 'Functional', width: 90 },
  { id: 'functionalDevice', label: 'Functional — Device', type: 'number', group: 'Functional', width: 90 },
  { id: 'cocoonPurchasedDm', label: 'Cocoon Purchased DM (Kgs)', type: 'number', group: 'Cocoon', width: 100 },
  { id: 'cocoonPurchasedUm', label: 'Cocoon Purchased UM (Kgs)', type: 'number', group: 'Cocoon', width: 100 },
  { id: 'cocoonConsumedDm', label: 'Cocoon Consumed DM (Kgs)', type: 'number', group: 'Cocoon', width: 100 },
  { id: 'cocoonConsumedUm', label: 'Cocoon Consumed UM (Kgs)', type: 'number', group: 'Cocoon', width: 100 },
  { id: 'silkProductionDm', label: 'Silk Production DM (Kgs)', type: 'number', group: 'Silk', width: 100 },
  { id: 'silkProductionUm', label: 'Silk Production UM (Kgs)', type: 'number', group: 'Silk', width: 100 },
  { id: 'rendittaDm', label: 'Renditta DM (%)', type: 'computed', group: 'Renditta', width: 90 },
  { id: 'rendittaUm', label: 'Renditta UM (%)', type: 'computed', group: 'Renditta', width: 90 },
  { id: 'functionalDaysDm', label: 'Functional Days DM', type: 'number', group: 'Functional Days', width: 90 },
  { id: 'functionalDaysUm', label: 'Functional Days UM', type: 'number', group: 'Functional Days', width: 90 },
  { id: 'disposalAseDm', label: 'ASE Kanchi DM (Kgs)', type: 'number', group: 'Silk Disposal', width: 100 },
  { id: 'disposalAseUm', label: 'ASE Kanchi UM (Kgs)', type: 'number', group: 'Silk Disposal', width: 100 },
  { id: 'disposalPrivateDm', label: 'Private DM (Kgs)', type: 'number', group: 'Silk Disposal', width: 100 },
  { id: 'disposalPrivateUm', label: 'Private UM (Kgs)', type: 'number', group: 'Silk Disposal', width: 100 },
];

export const ABSTRACT_UNIT_TYPES = [
  { key: 'cottage', label: 'Cottage Basin', sourceCategory: 'cottage' },
  { key: 'mrm', label: 'Multiend', sourceCategory: 'mrm' },
  { key: 'arm', label: 'Automatic Reeling Units', sourceCategory: 'arm' },
  { key: 'charka', label: 'Charka Units', sourceCategory: 'charka' },
  { key: 'sarvodhaya', label: 'Sarvodhaya Sangam', sourceCategory: null },
];

export const ABSTRACT_COLUMNS = [
  { id: 'unitType', label: 'Unit Type', type: 'readonly' },
  { id: 'installedUnit', label: 'Installed — Unit', type: 'readonly' },
  { id: 'installedDevice', label: 'Installed — Device', type: 'readonly' },
  { id: 'functionalUnit', label: 'Functional — Unit', type: 'readonly' },
  { id: 'functionalDevice', label: 'Functional — Device', type: 'readonly' },
  { id: 'cocoonPurchasedDm', label: 'Cocoon Purchased DM', type: 'readonly' },
  { id: 'cocoonPurchasedUm', label: 'Cocoon Purchased UM', type: 'readonly' },
  { id: 'cocoonConsumedDm', label: 'Cocoon Consumed DM', type: 'readonly' },
  { id: 'cocoonConsumedUm', label: 'Cocoon Consumed UM', type: 'readonly' },
  { id: 'silkProductionDm', label: 'Silk Production DM', type: 'readonly' },
  { id: 'silkProductionUm', label: 'Silk Production UM', type: 'readonly' },
  { id: 'silkProductionCapacityDm', label: 'Silk Production Capacity DM', type: 'readonly' },
  { id: 'silkProductionCapacityUm', label: 'Silk Production Capacity UM', type: 'readonly' },
  { id: 'disposalAseDm', label: 'ASE Kanchi DM', type: 'readonly' },
  { id: 'disposalAseUm', label: 'ASE Kanchi UM', type: 'readonly' },
  { id: 'disposalPrivateDm', label: 'Private DM', type: 'readonly' },
  { id: 'disposalPrivateUm', label: 'Private UM', type: 'readonly' },
];

export const HEADER_FIELDS = [
  { key: 'pdlNo', label: 'PDL No.', type: 'readonly', value: MIS40_FORM_CODE },
  { key: 'month', label: 'Month', type: 'select', required: true, options: MONTHS },
  { key: 'year', label: 'Year', type: 'number', required: true },
];

export const EDITABLE_CATEGORY_IDS = ['arm', 'charka', 'cottage', 'mrm'];

// ── Card-entry field groups (one beneficiary at a time) ──────────────────

export const BENEFICIARY_FIELDS = [
  { key: 'beneficiaryName', label: 'Name of the Beneficiary', type: 'text', required: true },
  { key: 'place', label: 'Place', type: 'text' },
];

export const INSTALLED_FUNCTIONAL_FIELDS = [
  { key: 'installedUnit', label: 'Installed — Unit', type: 'number' },
  { key: 'installedDevice', label: 'Installed — Device', type: 'number' },
  { key: 'functionalUnit', label: 'Functional — Unit', type: 'number' },
  { key: 'functionalDevice', label: 'Functional — Device', type: 'number' },
];

/**
 * Each entry has a D.M (editable, entered this month) and a U.M (read-only,
 * = U.L.M + D.M). U.L.M is never entered directly — it's carried forward
 * automatically from last month's U.M for the same beneficiary (matched by
 * name) at submit time; see mis40MonthRollover.js.
 */
export const KG_FIELD_GROUPS = [
  {
    key: 'cocoonPurchased', section: 'Cocoon (Kgs)', label: 'Purchased',
    ulmKey: 'cocoonPurchasedUlm', dmKey: 'cocoonPurchasedDm', umKey: 'cocoonPurchasedUm',
  },
  {
    key: 'cocoonConsumed', section: 'Cocoon (Kgs)', label: 'Consumed',
    ulmKey: 'cocoonConsumedUlm', dmKey: 'cocoonConsumedDm', umKey: 'cocoonConsumedUm',
  },
  {
    key: 'silkProduction', section: 'Silk Production (Kgs)', label: 'Production',
    ulmKey: 'silkProductionUlm', dmKey: 'silkProductionDm', umKey: 'silkProductionUm',
  },
  {
    key: 'silkProductionCapacity', section: 'Silk Production (Kgs)', label: 'Production Capacity',
    ulmKey: 'silkProductionCapacityUlm', dmKey: 'silkProductionCapacityDm', umKey: 'silkProductionCapacityUm',
  },
  {
    key: 'functionalDays', section: 'Silk Production (Kgs)', label: 'Functional Days',
    ulmKey: 'functionalDaysUlm', dmKey: 'functionalDaysDm', umKey: 'functionalDaysUm',
  },
  {
    key: 'disposalAse', section: 'Silk Disposal (Kgs)', label: 'ASE Kanchi',
    ulmKey: 'disposalAseUlm', dmKey: 'disposalAseDm', umKey: 'disposalAseUm',
  },
  {
    key: 'disposalPrivate', section: 'Silk Disposal (Kgs)', label: 'Private',
    ulmKey: 'disposalPrivateUlm', dmKey: 'disposalPrivateDm', umKey: 'disposalPrivateUm',
  },
];

/** Columns shown in the compact saved-beneficiary list, per category. */
export const LIST_COLUMNS = [
  { id: 'beneficiaryName', label: 'Name' },
  { id: 'place', label: 'Place' },
  { id: 'cocoonConsumedDm', label: 'Cocoon Consumed (D.M)' },
  { id: 'silkProductionDm', label: 'Silk Production (D.M)' },
  { id: 'rendittaDm', label: 'Renditta %' },
];
