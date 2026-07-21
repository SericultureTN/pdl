import {
  HEADER_FIELDS,
  FINANCIAL_BUDGET_ROWS,
  FINANCIAL_BUDGET_COLUMNS,
  PRODUCTION_DETAIL_FIELDS,
  STOCK_PARTICULAR_ITEMS,
  RECEIPT_ITEMS,
  SILK_SALES_ROWS,
  COCOON_STOCK_ROWS,
  COCOON_STOCK_COLUMN_GROUPS,
  NSC_EXPENDITURE_ROWS,
  COST_DETAIL_FIELDS,
  COST_OF_PRODUCTION_FIELDS,
  STOCK_KGS_ITEMS,
  ESTIMATED_SALE_ROWS,
  ACTUAL_RECEIPT_SILK_ROWS,
  ACTUAL_RECEIPT_BYE_ROWS,
  PENDING_AMOUNT_ROWS,
  MACHINERY_FIELDS,
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
        type: 'fieldGrid',
        title: 'Achievement to Target — Physical',
        path: 'tab1.achievementPhysical',
        fields: [
          { key: 'targetKg', label: 'Target (kg)', type: 'number' },
          { key: 'achievedKg', label: 'Achieved (kg)', type: 'number' },
        ],
      },
      {
        id: 'achievementFinancial',
        type: 'matrix',
        title: 'Achievement to Target — Financial Control Budget',
        path: 'tab1.achievementFinancial',
        rows: FINANCIAL_BUDGET_ROWS,
        columns: FINANCIAL_BUDGET_COLUMNS,
      },
      {
        id: 'productionDetails',
        type: 'fieldGrid',
        title: 'Production Details',
        path: 'tab1.productionDetails',
        fields: PRODUCTION_DETAIL_FIELDS,
        columns: 2,
      },
      {
        id: 'stockParticulars',
        type: 'stockParticulars',
        title: 'Stock Particulars',
        path: 'tab1.stockParticulars',
        items: STOCK_PARTICULAR_ITEMS,
        columns: [
          { key: 'openingBalance', label: 'Opening Balance' },
          { key: 'stockAdded', label: 'Stock Added' },
          { key: 'underProcess', label: 'Under Process' },
          { key: 'stockDisposedQty', label: 'Stock Disposed (Qty)' },
          { key: 'stockDisposedValue', label: 'Stock Disposed (Value)' },
          { key: 'closingBalance', label: 'Closing Balance', readOnly: true },
        ],
      },
      {
        id: 'receipts',
        type: 'receipts',
        title: 'Receipts',
        path: 'tab1.receipts',
        items: RECEIPT_ITEMS,
      },
      {
        id: 'silkSalesRealisation',
        type: 'silkSales',
        title: 'Silk Sales & Realisation (Anna Silk Exchange)',
        path: 'tab1.silkSalesRealisation',
        rows: SILK_SALES_ROWS,
      },
    ],
  },
  {
    id: 'tab2',
    label: 'Stock & Cost Details',
    sections: [
      {
        id: 'cocoonStockMovement',
        type: 'cocoonStock',
        title: 'Cocoon Stock Movement',
        path: 'tab2.cocoonStockMovement',
        rows: COCOON_STOCK_ROWS,
        columnGroups: COCOON_STOCK_COLUMN_GROUPS,
      },
      {
        id: 'nscExpenditure',
        type: 'singleColumn',
        title: 'NSC Expenditure',
        path: 'tab2.nscExpenditure',
        rows: NSC_EXPENDITURE_ROWS,
      },
      {
        id: 'costDetails',
        type: 'assessedActual',
        title: 'Cost Details',
        path: 'tab2.costDetails',
        fields: COST_DETAIL_FIELDS,
      },
      {
        id: 'costOfProduction',
        type: 'fieldGrid',
        title: 'Cost of Production',
        path: 'tab2.costOfProduction',
        fields: COST_OF_PRODUCTION_FIELDS,
        columns: 1,
      },
    ],
  },
  {
    id: 'tab3',
    label: 'Sales, Machinery & Profit/Loss',
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
      },
      {
        id: 'estimatedSaleValue',
        type: 'periodMatrix',
        title: 'Estimated Sale Value',
        path: 'tab3.estimatedSaleValue',
        rows: ESTIMATED_SALE_ROWS,
        periods: [
          { key: 'dm', label: 'D.M' },
          { key: 'um', label: 'U.M' },
        ],
      },
      {
        id: 'actualReceiptDetails',
        type: 'actualReceipts',
        title: 'Actual Receipt Details',
        path: 'tab3.actualReceiptDetails',
        silkRows: ACTUAL_RECEIPT_SILK_ROWS,
        byeRows: ACTUAL_RECEIPT_BYE_ROWS,
        pendingRows: PENDING_AMOUNT_ROWS,
      },
      {
        id: 'machineryWorking',
        type: 'fieldGrid',
        title: 'Machinery Working Details',
        path: 'tab3.machineryWorking',
        fields: MACHINERY_FIELDS,
        columns: 2,
      },
      {
        id: 'profitLoss',
        type: 'profitLoss',
        title: 'Profit / Loss',
        path: 'tab3.profitLoss',
      },
    ],
  },
];

export function getMis37TabById(tabId) {
  return MIS37_TAB_SECTIONS.find((tab) => tab.id === tabId);
}
