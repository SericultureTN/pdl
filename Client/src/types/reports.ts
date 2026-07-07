export type ReportStatus = 'Submitted' | 'Draft' | 'Empty';

export interface ReportRow {
  id: string;
  module: string;
  subordinateOffice: string;
  region: string;
  adOffice: string;
  financialYear: string;
  month: string;
  periodLabel: string;
  entryDate: string;
  entryDateValue: Date | null;
  unit: string;
  ulm: string;
  dm: string;
  um: string;
  details: string[];
  detailsText: string;
  status: ReportStatus;
  hasEntry: boolean;
}

export interface ReportFilters {
  reportType: string;
  subordinateOffice: string;
  region: string;
  adOffice: string;
  financialYear: string;
  month: string;
  fromDate: string;
  toDate: string;
}

export interface ReportStats {
  total: number;
  withEntry: number;
  draft: number;
  submitted: number;
  empty: number;
}
