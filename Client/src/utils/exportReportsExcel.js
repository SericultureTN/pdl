function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const EXPORT_HEADERS = [
  'S.No',
  'Report',
  'Subordinate Office',
  'Region',
  'AD Office',
  'Financial Year',
  'Month',
  'Date',
  'Unit',
  'ULM',
  'DM (Entered)',
  'UM',
  'Status',
  'Entry Details',
];

export function downloadReportsExcel(rows) {
  const csvLines = [
    EXPORT_HEADERS.map(escapeCsv).join(','),
    ...rows.map((row, index) =>
      [
        index + 1,
        row.module,
        row.subordinateOffice,
        row.region || '',
        row.adOffice,
        row.financialYear,
        row.month,
        row.entryDate,
        row.unit,
        row.ulm,
        row.dm,
        row.um,
        row.status,
        row.detailsText || '',
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ];

  const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `PDL-Reports-${stamp}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
