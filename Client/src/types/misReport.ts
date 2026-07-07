export interface AcreFarmer {
  acre: number;
  farmer: number;
}

export interface PlantationRow {
  sno: number;
  adOfficeId: number;
  adOffice: string;
  base: AcreFarmer;
  ulm: AcreFarmer;
  dm: AcreFarmer;
  um: AcreFarmer;
}

export interface SchemeCategory {
  target: AcreFarmer;
  ulm: AcreFarmer;
  dm: AcreFarmer;
  um: AcreFarmer;
}

export interface SchemeRow {
  sno: number;
  adOfficeId: number;
  adOffice: string;
  categories: Record<string, SchemeCategory>;
  totals: { ulm: AcreFarmer; dm: AcreFarmer; um: AcreFarmer };
}

export interface DflsBlock {
  bv: Record<string, number>;
  cb: Record<string, number>;
  p1: { value: number };
  grandTotal?: number;
}

export interface DflsRow {
  sno: number;
  adOfficeId: number;
  adOffice: string;
  ulm: DflsBlock;
  dm: DflsBlock;
  um: DflsBlock;
}

export interface RegionBlock<T> {
  regionName: string;
  rows: T[];
  subtotal: unknown;
}

export interface MisReportResponse {
  ok: boolean;
  sheet: { id: string; label: string; type: string; unit: string; schemeYear?: string; sheetType?: string };
  filters: { month: string; year: string; region: string; ad: string };
  kpis: { ulm: unknown; dm: unknown; um: unknown };
  regions: RegionBlock<PlantationRow | SchemeRow | DflsRow>[];
  grandTotal: unknown;
  meta: {
    canEditDm: boolean;
    editableAdIds: number[];
    regions: { id: string; name: string }[];
    adOffices: { name: string; region: string }[];
    financialYears: string[];
    months: string[];
    sheets: { id: string; label: string }[];
  };
}

export interface MisFilters {
  sheet: string;
  month: string;
  year: string;
  region: string;
  ad: string;
}
