import { loadPlantationDraft } from '../plantationStorage.js';
import { loadDflsDraft } from '../dflsStorage.js';
import {
  PLANTATION_CATEGORIES,
  createInitialUlmData,
  createInitialTargetData,
  createInitialDmData,
  computeUmValue,
  sumAcreFarmer,
  hasDmValues,
  normalizeFilterDraft,
} from '../plantationConstants.js';
import {
  INITIAL_ULM,
  createInitialDmData as createDflsInitialDmData,
  normalizeDflsFilterDraft,
} from '../dflsConstants.js';
import { computeGrandTotal } from '../DataEntryColumn.jsx';

export const DFLS_BV_ROWS = ['Govt', 'NSSO', 'TN Pvt', 'Other State'];
export const DFLS_CB_ROWS = ['Other State', 'NSSO'];

function num(value) {
  return Number(value) || 0;
}

function computeDflsUmData(ulmData, dmData) {
  return {
    bv: Object.fromEntries(
      DFLS_BV_ROWS.map((row) => [row, num(ulmData.bv[row]) + num(dmData.bv[row])])
    ),
    cb: Object.fromEntries(
      DFLS_CB_ROWS.map((row) => [row, num(ulmData.cb[row]) + num(dmData.cb[row])])
    ),
    p1: { value: num(ulmData.p1.value) + num(dmData.p1.value) },
  };
}

function hasDflsDmValues(dmData) {
  const bv = dmData?.bv || {};
  const cb = dmData?.cb || {};
  return (
    DFLS_BV_ROWS.some((row) => bv[row] !== '' && bv[row] != null) ||
    DFLS_CB_ROWS.some((row) => cb[row] !== '' && cb[row] != null) ||
    (dmData?.p1?.value !== '' && dmData?.p1?.value != null)
  );
}

export function getPlantationEntryReport(scheme) {
  const draft = loadPlantationDraft(scheme.id);
  const filters = normalizeFilterDraft(draft, scheme);
  const ulmSource = createInitialUlmData();
  const targetSource = createInitialTargetData();
  const dmSource = draft?.dmData || createInitialDmData();

  const categories = PLANTATION_CATEGORIES.map((category) => {
    const ulm = ulmSource[category];
    const dmRaw = dmSource[category] || { acre: '', farmer: '' };
    const dm = { acre: num(dmRaw.acre), farmer: num(dmRaw.farmer) };
    return {
      category,
      target: targetSource[category],
      ulm,
      dm,
      um: computeUmValue(ulm, dmRaw),
    };
  });

  const target = sumAcreFarmer(targetSource);
  const ulm = sumAcreFarmer(ulmSource);
  const dm = sumAcreFarmer(
    Object.fromEntries(
      PLANTATION_CATEGORIES.map((cat) => [cat, dmSource[cat] || { acre: 0, farmer: 0 }])
    )
  );
  const um = sumAcreFarmer(
    Object.fromEntries(
      PLANTATION_CATEGORIES.map((cat) => [
        cat,
        computeUmValue(ulmSource[cat], dmSource[cat] || {}),
      ])
    )
  );
  const achievement = target.acre
    ? Number(((um.acre / target.acre) * 100).toFixed(2))
    : 0;

  return {
    filters,
    categories,
    target,
    ulm,
    dm,
    um,
    achievement,
    hasEntry: hasDmValues(dmSource),
    submitted: Boolean(draft?.submitted),
  };
}

export function getDflsEntryReport(pageKey) {
  const draft = loadDflsDraft(pageKey);
  const filters = normalizeDflsFilterDraft(draft);
  const ulmData = INITIAL_ULM;
  const dmSource = draft?.dmData || createDflsInitialDmData();
  const umData = computeDflsUmData(ulmData, dmSource);

  return {
    filters,
    ulmData,
    dmData: dmSource,
    umData,
    ulmTotal: computeGrandTotal(ulmData),
    dmTotal: computeGrandTotal(dmSource),
    umTotal: computeGrandTotal(umData),
    hasEntry: hasDflsDmValues(dmSource),
  };
}
