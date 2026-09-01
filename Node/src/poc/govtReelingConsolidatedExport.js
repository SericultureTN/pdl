import ExcelJS from 'exceljs';

// Header layout (3 rows: title/month, group title, DM/UM sub-label) and
// column order copied cell-by-cell from the real department workbook — see
// govtReelingConsolidated.js's module comment for the handful of fields with
// no exact equivalent in our data model.

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
const TOTAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE5CD' } };
const THIN_BORDER = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

// { key, group, sub, width } — `group` cells spanning >1 column are merged automatically.
const COLUMNS = [
  { key: 'slNo', group: 'Sl.No', sub: '', width: 6 },
  { key: 'officeName', group: 'Assistant Director', sub: '', width: 16 },
  { key: 'targetAnnual', group: 'Target (Kgs)', sub: 'Annual', width: 10 },
  { key: 'targetDm', group: 'Target (Kgs)', sub: 'D.M', width: 10 },
  { key: 'targetUm', group: 'Target (Kgs)', sub: 'U.M', width: 10 },
  { key: 'achievedUlm', group: 'Achievement (Kgs)', sub: 'U.L.M', width: 10 },
  { key: 'achievedDm', group: 'Achievement (Kgs)', sub: 'D.M', width: 10 },
  { key: 'achievedUm', group: 'Achievement (Kgs)', sub: 'U.M', width: 10 },
  { key: 'achievementPercentDm', group: 'Achievement (%)', sub: 'D.M', width: 9, fmt: '0.0%' },
  { key: 'achievementPercentUm', group: 'Achievement (%)', sub: 'U.M', width: 9, fmt: '0.0%' },
  { key: 'priorAchievedDm', group: 'Prior-Year Achievement (Kgs)', sub: 'D.M', width: 10 },
  { key: 'priorAchievedUm', group: 'Prior-Year Achievement (Kgs)', sub: 'U.M', width: 10 },
  { key: 'differenceDm', group: 'Difference (Kgs)', sub: 'D.M', width: 10 },
  { key: 'differenceUm', group: 'Difference (Kgs)', sub: 'U.M', width: 10 },
  { key: 'cocoonOpeningBalance', group: 'Cocoon Opening Balance (Kgs)', sub: '', width: 12 },
  { key: 'cocoonPurchasedUlm', group: 'Cocoon Purchased (Kgs)', sub: 'U.L.M', width: 9 },
  { key: 'cocoonPurchasedDm', group: 'Cocoon Purchased (Kgs)', sub: 'D.M', width: 9 },
  { key: 'cocoonPurchasedUm', group: 'Cocoon Purchased (Kgs)', sub: 'U.M', width: 9 },
  { key: 'cocoonReeledUlm', group: 'Cocoon Reeled (Kgs)', sub: 'U.L.M', width: 9 },
  { key: 'cocoonReeledDm', group: 'Cocoon Reeled (Kgs)', sub: 'D.M', width: 9 },
  { key: 'cocoonReeledUm', group: 'Cocoon Reeled (Kgs)', sub: 'U.M', width: 9 },
  { key: 'cocoonClosingBalance', group: 'Cocoon Closing Balance (Kgs)', sub: '', width: 12 },
  { key: 'functionalDays', group: 'Functional Days', sub: '', width: 9 },
  { key: 'basinsInUse', group: 'Basins in Use', sub: '', width: 9 },

  { key: 'assessedRenditaCb', group: 'Assessed Renditta', sub: 'CB D.M', width: 9 },
  { key: 'assessedRenditaCsrDm', group: 'Assessed Renditta', sub: 'CSR D.M', width: 9 },
  { key: 'assessedRenditaUm', group: 'Assessed Renditta', sub: 'U.M', width: 9 },
  { key: 'actualRenditaCb', group: 'Actual Renditta', sub: 'CB D.M', width: 9 },
  { key: 'actualRenditaDm', group: 'Actual Renditta', sub: 'CSR D.M', width: 9 },
  { key: 'actualRenditaUm', group: 'Actual Renditta', sub: 'U.M', width: 9 },
  { key: 'fuelCostDm', group: 'Fuel Cost (Rs.)', sub: 'D.M', width: 10 },
  { key: 'fuelCostUm', group: 'Fuel Cost (Rs.)', sub: 'U.M', width: 10 },
  { key: 'fuelCostPerKgDm', group: 'Fuel Cost / Kg (Rs.)', sub: 'D.M', width: 9 },
  { key: 'fuelCostPerKgUm', group: 'Fuel Cost / Kg (Rs.)', sub: 'U.M', width: 9 },
  { key: 'mandaysDm', group: 'Mandays', sub: 'D.M', width: 9 },
  { key: 'mandaysUm', group: 'Mandays', sub: 'U.M', width: 9 },
  { key: 'mandaysPerKgDm', group: 'Mandays / Kg', sub: 'D.M', width: 9 },
  { key: 'mandaysPerKgUm', group: 'Mandays / Kg', sub: 'U.M', width: 9 },
  { key: 'wagesDm', group: 'Wages (Rs.)', sub: 'D.M', width: 10 },
  { key: 'wagesUm', group: 'Wages (Rs.)', sub: 'U.M', width: 10 },
  { key: 'ebDm', group: 'E.B. (Rs.)', sub: 'D.M', width: 9 },
  { key: 'ebUm', group: 'E.B. (Rs.)', sub: 'U.M', width: 9 },
  { key: 'transportDm', group: 'Transport (Rs.)', sub: 'D.M', width: 10 },
  { key: 'transportUm', group: 'Transport (Rs.)', sub: 'U.M', width: 10 },
  { key: 'othersDm', group: 'Others (Rs.)', sub: 'D.M', width: 10 },
  { key: 'othersUm', group: 'Others (Rs.)', sub: 'U.M', width: 10 },
  { key: 'conversionCostDm', group: 'Conversion Cost (Rs.)', sub: 'D.M', width: 10 },
  { key: 'conversionCostUm', group: 'Conversion Cost (Rs.)', sub: 'U.M', width: 10 },
  { key: 'conversionCostFinalDm', group: 'Conversion Cost Final (Rs.)', sub: 'D.M', width: 10 },
  { key: 'conversionCostFinalUm', group: 'Conversion Cost Final (Rs.)', sub: 'U.M', width: 10 },

  { key: 'costPerKgWithWagesDm', group: 'Cost of Production with Wages (Rs.)', sub: 'D.M', width: 10 },
  { key: 'costPerKgWithWagesUm', group: 'Cost of Production with Wages (Rs.)', sub: 'U.M', width: 10 },
  { key: 'costPerKgWithoutWagesDm', group: 'Cost of Production without Wages (Rs.)', sub: 'D.M', width: 10 },
  { key: 'costPerKgWithoutWagesUm', group: 'Cost of Production without Wages (Rs.)', sub: 'U.M', width: 10 },
  { key: 'nscExpenditureUlm', group: 'NSC Expenditure (Rs.)', sub: 'U.L.M', width: 10 },
  { key: 'nscExpenditureDm', group: 'NSC Expenditure (Rs.)', sub: 'D.M', width: 10 },
  { key: 'nscExpenditureUm', group: 'NSC Expenditure (Rs.)', sub: 'U.M', width: 10 },
  { key: 'rawSilkSaleUlm', group: 'Estimated Sale Value — Raw Silk (Rs.)', sub: 'U.L.M', width: 10 },
  { key: 'rawSilkSaleAvgRate', group: 'Estimated Sale Value — Raw Silk (Rs.)', sub: 'Avg Rate', width: 9 },
  { key: 'rawSilkSaleDm', group: 'Estimated Sale Value — Raw Silk (Rs.)', sub: 'D.M', width: 10 },
  { key: 'rawSilkSaleUm', group: 'Estimated Sale Value — Raw Silk (Rs.)', sub: 'U.M', width: 10 },
  { key: 'byeProductsSaleDm', group: 'Estimated Sale Value — Bye Products (Rs.)', sub: 'D.M', width: 10 },
  { key: 'byeProductsSaleUm', group: 'Estimated Sale Value — Bye Products (Rs.)', sub: 'U.M', width: 10 },
  { key: 'totalValueDm', group: 'Total Value (Rs.)', sub: 'D.M', width: 11 },
  { key: 'totalValueUm', group: 'Total Value (Rs.)', sub: 'U.M', width: 11 },
  { key: 'rawSilkOpening', group: 'Raw Silk Opening Balance (Kgs)', sub: '', width: 11 },
  { key: 'rawSilkAchieved', group: 'Achievement (Kgs)', sub: '', width: 10 },
  { key: 'totalRawSilk', group: 'Total Raw Silk (Kgs)', sub: '', width: 10 },
  { key: 'rawSilkSold', group: 'Raw Silk Sold (Kgs)', sub: '', width: 10 },
  { key: 'rawSilkOnHand', group: 'Raw Silk on Hand (Kgs)', sub: '', width: 10 },
  { key: 'profitLossDm', group: 'Estimated Profit / Loss (Rs.)', sub: 'D.M', width: 11 },
  { key: 'profitLossUm', group: 'Estimated Profit / Loss (Rs.)', sub: 'U.M', width: 11 },
];

function styleHeaderCell(cell) {
  cell.fill = HEADER_FILL;
  cell.font = { bold: true, size: 9 };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = THIN_BORDER;
}

function buildSheet(workbook, sheetName, monthData) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];

  // Row 1: report title + month
  sheet.mergeCells(1, 1, 1, COLUMNS.length);
  const title = sheet.getCell(1, 1);
  title.value = `PERFORMANCE OF GOVERNMENT SILK REELING UNITS — ${monthData.month.toUpperCase()} ${monthData.calendarYear}`;
  title.font = { bold: true, size: 12 };
  title.alignment = { horizontal: 'center' };

  // Row 2: group headers (merged where a group spans multiple sub-columns)
  let col = 1;
  let i = 0;
  while (i < COLUMNS.length) {
    const group = COLUMNS[i].group;
    let span = 1;
    while (i + span < COLUMNS.length && COLUMNS[i + span].group === group) span++;
    if (span > 1) {
      sheet.mergeCells(2, col, 2, col + span - 1);
    } else {
      sheet.mergeCells(2, col, 3, col); // no sub-label: span both header rows
    }
    const cell = sheet.getCell(2, col);
    cell.value = group;
    styleHeaderCell(cell);
    col += span;
    i += span;
  }

  // Row 3: sub-labels (D.M / U.M / etc.) — blank where the group cell already spans row 3.
  COLUMNS.forEach((c, idx) => {
    if (!c.sub) return;
    const cell = sheet.getCell(3, idx + 1);
    cell.value = c.sub;
    styleHeaderCell(cell);
  });
  // Ensure every row-2/row-3 header cell (including merged-span ones) gets border+fill.
  for (let c = 1; c <= COLUMNS.length; c++) {
    styleHeaderCell(sheet.getCell(2, c));
    styleHeaderCell(sheet.getCell(3, c));
  }

  sheet.columns = COLUMNS.map((c) => ({ width: c.width }));

  monthData.rows.forEach((row, idx) => {
    const excelRow = sheet.getRow(4 + idx);
    excelRow.getCell(1).value = idx + 1;
    COLUMNS.slice(1).forEach((c, colIdx) => {
      const cell = excelRow.getCell(colIdx + 2);
      cell.value = c.key === 'officeName' ? row.officeName : (row[c.key] ?? 0);
      if (c.fmt) cell.numFmt = c.fmt;
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: c.key === 'officeName' ? 'left' : 'right' };
    });
  });

  const totalRowIdx = 4 + monthData.rows.length;
  const totalRow = sheet.getRow(totalRowIdx);
  totalRow.getCell(1).value = '';
  totalRow.getCell(2).value = 'TOTAL';
  COLUMNS.slice(1).forEach((c, colIdx) => {
    if (c.key === 'officeName') return;
    const cell = totalRow.getCell(colIdx + 2);
    cell.value = monthData.total[c.key] ?? 0;
    if (c.fmt) cell.numFmt = c.fmt;
  });
  totalRow.eachCell((cell) => {
    cell.fill = TOTAL_FILL;
    cell.font = { bold: true };
    cell.border = THIN_BORDER;
  });

  return sheet;
}

/** `months` is an array of the JSON objects returned by getConsolidatedReport, one per sheet. */
export async function buildConsolidatedWorkbook(months) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Silk Samagra POC Portal';
  workbook.created = new Date();

  months.forEach((monthData) => {
    const sheetName = `${monthData.month.slice(0, 3)}'${String(monthData.calendarYear).slice(-2)}`;
    buildSheet(workbook, sheetName.slice(0, 31), monthData);
  });

  return workbook.xlsx.writeBuffer();
}
