import { useCallback, useMemo, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Plus, Trash2 } from 'lucide-react';
import { REGISTER_COLUMNS } from './mis40Constants.js';
import { computeRowsWithCalculations, computeTotalRow, createEmptyRow } from './mis40Calculations.js';

const EDITABLE_COLUMN_IDS = REGISTER_COLUMNS
  .filter((col) => col.type !== 'readonly' && col.type !== 'computed')
  .map((col) => col.id);

function EditableCell({ value, columnId, rowIndex, onChange, onNavigate, readOnly }) {
  const inputRef = useRef(null);
  const isNumber = REGISTER_COLUMNS.find((c) => c.id === columnId)?.type === 'number';

  const handleKeyDown = (e) => {
    const editableCols = EDITABLE_COLUMN_IDS;
    const colIdx = editableCols.indexOf(columnId);
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const direction = e.shiftKey ? -1 : 1;
      let nextCol = colIdx + direction;
      let nextRow = rowIndex;
      if (nextCol >= editableCols.length) {
        nextCol = 0;
        nextRow += 1;
      } else if (nextCol < 0) {
        nextCol = editableCols.length - 1;
        nextRow -= 1;
      }
      if (nextRow >= 0) {
        onNavigate(nextRow, editableCols[nextCol]);
      }
    }
  };

  if (readOnly) {
    return (
      <span className="block min-h-[28px] px-1 py-1 text-right text-slate-600">
        {value ?? '—'}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      data-cell={`${rowIndex}-${columnId}`}
      type={isNumber ? 'number' : 'text'}
      min={isNumber ? '0' : undefined}
      step={isNumber ? 'any' : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(columnId, e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full min-w-[60px] rounded border border-transparent bg-transparent px-1 py-1 text-sm outline-none focus:border-emerald-primary focus:bg-white"
    />
  );
}

export default function RegisterGrid({
  rows,
  onRowsChange,
  onDeleteRow,
  errors = {},
}) {
  const tableContainerRef = useRef(null);
  const [focusedCell, setFocusedCell] = useState(null);
  const safeRows = Array.isArray(rows) ? rows : [];

  const computedRows = useMemo(() => computeRowsWithCalculations(safeRows), [safeRows]);
  const totalRow = useMemo(() => computeTotalRow(computedRows), [computedRows]);

  const updateCell = useCallback((rowIndex, columnId, value) => {
    const next = [...safeRows];
    next[rowIndex] = { ...next[rowIndex], [columnId]: value };
    onRowsChange(next);
  }, [safeRows, onRowsChange]);

  const handlePaste = useCallback((e) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text.includes('\t') && !text.includes('\n')) return;

    e.preventDefault();
    const pastedRows = text.trim().split(/\r?\n/).map((line) => line.split('\t'));
    const startRow = focusedCell?.row ?? 0;
    const startColIdx = focusedCell
      ? EDITABLE_COLUMN_IDS.indexOf(focusedCell.col)
      : 0;

    const next = [...safeRows];
    while (next.length < startRow + pastedRows.length) {
      next.push(createEmptyRow());
    }

    pastedRows.forEach((cells, rOffset) => {
      const rowIdx = startRow + rOffset;
      cells.forEach((cellValue, cOffset) => {
        const colId = EDITABLE_COLUMN_IDS[startColIdx + cOffset];
        if (colId && next[rowIdx]) {
          next[rowIdx] = { ...next[rowIdx], [colId]: cellValue.trim() };
        }
      });
    });

    onRowsChange(next);
  }, [safeRows, focusedCell, onRowsChange]);

  const navigateToCell = useCallback((rowIndex, columnId) => {
    setFocusedCell({ row: rowIndex, col: columnId });
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-cell="${rowIndex}-${columnId}"]`);
      el?.focus();
    });
  }, []);

  const columns = useMemo(() => [
    ...REGISTER_COLUMNS.map((col) => ({
      id: col.id,
      accessorKey: col.id,
      header: col.label,
      meta: col,
      cell: ({ row, column }) => {
        const rowIndex = row.index;
        const columnId = column.id;
        const data = computedRows[rowIndex];

        if (columnId === 'sNo') {
          return <span className="font-medium text-slate-500">{rowIndex + 1}</span>;
        }

        if (col.type === 'computed') {
          return (
            <span className="block bg-slate-50 px-1 py-1 text-right text-slate-600">
              {data?.[columnId] ?? '—'}
            </span>
          );
        }

        const rowErrors = errors[rowIndex];
        const fieldError = rowErrors?.[columnId];

        return (
          <div>
            <EditableCell
              value={data?.[columnId]}
              columnId={columnId}
              rowIndex={rowIndex}
              onChange={(id, val) => updateCell(rowIndex, id, val)}
              onNavigate={navigateToCell}
              readOnly={col.type === 'readonly'}
            />
            {fieldError && (
              <p className="text-[10px] text-red-600">{fieldError}</p>
            )}
          </div>
        );
      },
    })),
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onDeleteRow(row.index)}
          disabled={safeRows.length <= 1}
          className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-30"
          title="Delete row"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ], [computedRows, safeRows.length, errors, updateCell, navigateToCell, onDeleteRow]);

  const table = useReactTable({
    data: computedRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => row.id || `row-${index}`,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {safeRows.length} beneficiary row(s). Click cells to edit; Tab/Enter to move. Paste from Excel supported.
        </p>
        <button
          type="button"
          onClick={() => onRowsChange([...safeRows, createEmptyRow()])}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-light"
        >
          <Plus className="h-4 w-4" /> Add beneficiary
        </button>
      </div>

      <div
        ref={tableContainerRef}
        onPaste={handlePaste}
        className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 shadow-sm"
      >
        <table className="min-w-max border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-emerald-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap border border-slate-200 px-2 py-2 text-left font-semibold text-emerald-secondary"
                    style={{ minWidth: header.column.columnDef.meta?.width }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border border-slate-100 px-1 py-0.5 align-top"
                    onFocus={() => setFocusedCell({
                      row: row.index,
                      col: cell.column.id,
                    })}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="sticky bottom-0 z-10 bg-amber-50 font-semibold">
              <td className="border border-slate-200 px-2 py-2">TOTAL</td>
              {REGISTER_COLUMNS.slice(1).map((col) => (
                <td key={col.id} className="border border-slate-200 px-2 py-2 text-right text-emerald-secondary">
                  {col.id === 'remarks' ? '—' : (totalRow[col.id] ?? '—')}
                </td>
              ))}
              <td className="border border-slate-200" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
