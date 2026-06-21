export {
  SUBORDINATE_OFFICES,
  REGIONS,
  AD_OFFICES_BY_REGION,
  FINANCIAL_YEARS,
  MONTHS,
} from './plantationConstants.js';

export const DISTRIBUTION_CATEGORIES = [
  'Chawkie Distribution',
  'Bed Disinfectant',
  'Nursery Inputs',
  'Support Materials',
];

export const DISTRIBUTION_CATEGORY_META = {
  'Chawkie Distribution': {
    description: 'Chawkie sheets / trays distributed to farmers',
    accent: 'green',
  },
  'Bed Disinfectant': {
    description: 'Disinfectant kits supplied to rearers',
    accent: 'blue',
  },
  'Nursery Inputs': {
    description: 'Nursery-related inputs and materials',
    accent: 'purple',
  },
  'Support Materials': {
    description: 'Other extension support materials',
    accent: 'amber',
  },
};

export function createEmptyNos() {
  return { nos: '' };
}

export function createInitialTargetData() {
  return {
    'Chawkie Distribution': { nos: 5000 },
    'Bed Disinfectant': { nos: 1200 },
    'Nursery Inputs': { nos: 800 },
    'Support Materials': { nos: 600 },
  };
}

export function createInitialUlmData() {
  return {
    'Chawkie Distribution': { nos: 1200 },
    'Bed Disinfectant': { nos: 280 },
    'Nursery Inputs': { nos: 150 },
    'Support Materials': { nos: 90 },
  };
}

export function createInitialDmData() {
  return Object.fromEntries(
    DISTRIBUTION_CATEGORIES.map((category) => [category, createEmptyNos()])
  );
}

export function hasDmValues(dmData) {
  return Object.values(dmData).some(
    (item) => item.nos !== '' && item.nos != null
  );
}

export function sumNos(data) {
  return Object.values(data).reduce(
    (acc, item) => acc + (Number(item.nos) || 0),
    0
  );
}

export function computeUmValue(ulm, dm) {
  return {
    nos: (Number(ulm.nos) || 0) + (Number(dm.nos) || 0),
  };
}
