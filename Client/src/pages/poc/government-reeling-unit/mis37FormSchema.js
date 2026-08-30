import {
  HEADER_FIELDS,
  FINANCIAL_BUDGET_ROWS,
  FINANCIAL_BUDGET_COLUMNS,
  ACHIEVEMENT_PHYSICAL_ROWS,
  TIME_PERIOD_COLUMNS,
  PRODUCTION_DETAIL_FIELDS,
  PRODUCTION_WORK_ROWS,
  STOCK_PARTICULAR_ITEMS,
  RECEIPT_ITEMS,
  COCOON_STOCK_ROWS,
  COCOON_STOCK_METRICS,
  COCOON_STOCK_TIME_PERIOD_COLUMNS,
  NSC_EXPENDITURE_ROWS,
  COST_DETAIL_FIELDS,
  COST_DETAILS_COLUMNS,
  COST_OF_PRODUCTION_ROWS,
  STOCK_KGS_ITEMS,
  ESTIMATED_SALE_ROWS,
  ACTUAL_RECEIPT_ROWS,
} from './mis37Constants.js';

export const MIS37_SHARED_HEADER_SECTION = {
  id: 'sharedHeader',
  type: 'fieldGrid',
  title: 'Unit & Period Details',
  path: 'header',
  fields: HEADER_FIELDS,
  sticky: true,
};

export const MIS37_TAB_SECTIONS = [
  {
    id: 'tab1',
    label: 'Achievement & Production',
    sections: [
      {
        id: 'achievementPhysical',
        type: 'timePeriodMatrix',
        title: 'Achievement to Target — Physical',
        path: 'tab1.achievementPhysical',
        rows: ACHIEVEMENT_PHYSICAL_ROWS,
        columns: TIME_PERIOD_COLUMNS,
        unit: 'kg',
      },
      {
        id: 'achievementFinancial',
        type: 'financialBudget',
        title: 'Achievement to Target — Financial Control Budget',
        path: 'tab1.achievementFinancial',
        rows: FINANCIAL_BUDGET_ROWS,
        columns: FINANCIAL_BUDGET_COLUMNS,
        unit: 'rs',
      },
      {
        id: 'productionDetails',
        type: 'productionDetailsCard',
        title: 'Production Details',
        path: 'tab1.productionDetails',
        fields: PRODUCTION_DETAIL_FIELDS,
        rows: PRODUCTION_WORK_ROWS,
        columns: TIME_PERIOD_COLUMNS,
        // Days Worked/Mandays Used are plain counts, not Kg — only
        // productionCapacity (tagged unit:'kgs' on the field itself) is Kg.
        unit: 'count',
      },
      {
        id: 'stockParticulars',
        type: 'stockParticulars',
        title: 'Stock Particulars',
        path: 'tab1.stockParticulars',
        items: STOCK_PARTICULAR_ITEMS,
        columns: [
          { key: 'openingBalance', label: 'Opening Balance', readOnly: true },
          { key: 'stockAdded', label: 'Stock Added' },
          { key: 'total', label: 'Total', readOnly: true },
          { key: 'consumedSoldDisposed', label: 'Cocoon Consumed / Silk Produced / Sold / Disposed' },
          { key: 'closingBalance', label: 'Closing Balance (kg)', readOnly: true },
        ],
        unit: 'kg',
      },
      {
        id: 'receipts',
        type: 'receiptsTimePeriod',
        title: 'Receipts',
        path: 'tab1.receipts',
        items: RECEIPT_ITEMS,
        columns: TIME_PERIOD_COLUMNS,
        unit: 'rs',
      },
    ],
  },
  {
    id: 'tab2',
    label: 'Stock & Cost Details',
    sections: [
      {
        id: 'cocoonStockMovement',
        type: 'cocoonStockTimePeriod',
        title: 'Cocoon Stock Movement',
        path: 'tab2.cocoonStockMovement',
        rows: COCOON_STOCK_ROWS,
        metrics: COCOON_STOCK_METRICS,
        columns: COCOON_STOCK_TIME_PERIOD_COLUMNS,
        dmLabel: 'CSR Cocoon',
        // Per-metric, not per-section: Quantity rows are Kg, Value rows are Rs
        // — see COCOON_STOCK_METRICS' key ('qty' | 'value').
      },
      {
        id: 'nscExpenditure',
        type: 'nscExpenditureTimePeriod',
        title: 'NSC Expenditure',
        path: 'tab2.nscExpenditure',
        rows: NSC_EXPENDITURE_ROWS,
        columns: TIME_PERIOD_COLUMNS,
        unit: 'rs',
      },
      {
        id: 'costDetails',
        type: 'costDetailsPeriod',
        title: 'Cost Details',
        path: 'tab2.costDetails',
        fields: COST_DETAIL_FIELDS,
        columns: COST_DETAILS_COLUMNS,
        // Deliberately unformatted: avgSrPercentCocoon is stored as a whole
        // number (75.4, not 0.754) so formatPercent would double-scale it;
        // Rendita/Cost-per-Kg/Mandays-per-Kg are ratios of mixed real-world
        // units. Needs a field-by-field pass, not a section-wide guess.
      },
      {
        id: 'costOfProduction',
        type: 'costOfProductionPeriod',
        title: 'Cost of Production',
        path: 'tab2.costOfProduction',
        rows: COST_OF_PRODUCTION_ROWS,
        columns: TIME_PERIOD_COLUMNS,
        unit: 'rs',
      },
    ],
  },
  {
    id: 'tab3',
    label: 'Sales & Profit/Loss',
    sections: [
      {
        id: 'stockDetailsKgs',
        type: 'stockKgs',
        title: 'Stock Details (Kgs)',
        path: 'tab3.stockDetailsKgs',
        items: STOCK_KGS_ITEMS,
        columns: [
          { key: 'openingBalance', label: 'Opening Balance', input: true },
          { key: 'purchase', label: 'Purchase', input: true },
          { key: 'total', label: 'Total', readOnly: true },
          { key: 'soldIssued', label: 'Sold/Issued', input: true },
          { key: 'closingBalance', label: 'Closing Balance', readOnly: true },
        ],
        unit: 'kg',
      },
      {
        id: 'estimatedSaleValue',
        type: 'costOfProductionPeriod',
        title: 'Estimated Sale Value',
        path: 'tab3.estimatedSaleValue',
        rows: ESTIMATED_SALE_ROWS,
        unit: 'rs',
      },
      {
        id: 'actualReceiptDetails',
        type: 'actualReceipts',
        title: 'Actual Receipt Details',
        path: 'tab3.actualReceiptDetails',
        rows: ACTUAL_RECEIPT_ROWS,
        // Qty columns are Kg, Value columns are Rs — per-column, not per-section.
      },
      {
        id: 'profitLoss',
        type: 'profitLoss',
        title: 'Profit / Loss',
        path: 'tab3.profitLoss',
        unit: 'rs',
      },
    ],
  },
];

export function getMis37TabById(tabId) {
  return MIS37_TAB_SECTIONS.find((tab) => tab.id === tabId);
}
