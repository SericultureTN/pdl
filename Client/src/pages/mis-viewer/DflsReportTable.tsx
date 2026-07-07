import { Fragment } from 'react';
import type { DflsRow, RegionBlock, DflsBlock } from '../../types/misReport';

const BV_ROWS = ['Govt', 'NSSO', 'TN Pvt', 'Other State', 'Total'];
const CB_ROWS = ['Other State', 'NSSO', 'Total'];

function numCell(v: number, cls: string) {
  return <td className={`${cls} px-1.5 py-1 text-right text-xs whitespace-nowrap`}>{v?.toLocaleString?.() ?? v}</td>;
}

function dmNumInput(value: number, editable: boolean, onChange: (v: number) => void) {
  if (!editable) return numCell(value, 'mis-cell-dm');
  return (
    <td className="mis-cell-dm px-1 py-1 text-right">
      <input
        type="number"
        min={0}
        className="mis-dm-input w-14"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </td>
  );
}

interface Props {
  regions: RegionBlock<DflsRow>[];
  grandTotal: { ulm: DflsBlock; dm: DflsBlock; um: DflsBlock };
  unit: string;
  canEdit: boolean;
  editableAdIds: number[];
  onSaveDflsDm: (adOfficeId: number, path: string, value: number) => void;
}

export default function DflsReportTable({
  regions,
  grandTotal,
  unit,
  canEdit,
  editableAdIds,
  onSaveDflsDm,
}: Props) {
  const colCount = 2 + (BV_ROWS.length + CB_ROWS.length + 2) * 3;

  const renderBlock = (row: DflsRow, block: 'ulm' | 'dm' | 'um', editable: boolean) => {
    const data = row[block];
    const cls = block === 'ulm' ? 'mis-cell-ulm' : block === 'dm' ? 'mis-cell-dm' : 'mis-cell-um';

    return (
      <>
        {BV_ROWS.map((r) =>
          block === 'dm' && editable && r !== 'Total'
            ? dmNumInput(data.bv[r] ?? 0, true, (v) => onSaveDflsDm(row.adOfficeId, `bv.${r}`, v))
            : numCell(data.bv[r] ?? 0, cls)
        )}
        {CB_ROWS.map((r) =>
          block === 'dm' && editable && r !== 'Total'
            ? dmNumInput(data.cb[r] ?? 0, true, (v) => onSaveDflsDm(row.adOfficeId, `cb.${r}`, v))
            : numCell(data.cb[r] ?? 0, cls)
        )}
        {block === 'dm' && editable
          ? dmNumInput(data.p1?.value ?? 0, true, (v) => onSaveDflsDm(row.adOfficeId, 'p1.value', v))
          : numCell(data.p1?.value ?? 0, cls)}
        {numCell(data.grandTotal ?? 0, cls)}
      </>
    );
  };

  const renderTotalBlock = (data: DflsBlock, cls: string) => (
    <>
      {BV_ROWS.map((r) => numCell(data.bv[r] ?? 0, cls))}
      {CB_ROWS.map((r) => numCell(data.cb[r] ?? 0, cls))}
      {numCell(data.p1?.value ?? 0, cls)}
      {numCell(data.grandTotal ?? 0, cls)}
    </>
  );

  return (
    <div className="mis-table-scroll mis-viewer-table-wrap rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[1400px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#1a3d2b] text-white text-xs">
            <th rowSpan={3} className="px-2 py-2 text-left">S.No</th>
            <th rowSpan={3} className="px-2 py-2 text-left min-w-[120px]">AD Office</th>
            <th colSpan={BV_ROWS.length + CB_ROWS.length + 2} className="px-1 py-2 border-l border-white/20 bg-[#0C447C]">ULM ({unit})</th>
            <th colSpan={BV_ROWS.length + CB_ROWS.length + 2} className="px-1 py-2 border-l border-white/20 bg-[#27500A]">DM ({unit})</th>
            <th colSpan={BV_ROWS.length + CB_ROWS.length + 2} className="px-1 py-2 border-l border-white/20 bg-[#3C3489]">UM ({unit})</th>
          </tr>
          <tr className="bg-[#1a3d2b] text-white text-[10px]">
            {[0, 1, 2].map((i) => (
              <Fragment key={`group-${i}`}>
                <th colSpan={BV_ROWS.length} className="px-1 py-1 border-l border-white/20">BV</th>
                <th colSpan={CB_ROWS.length} className="px-1 py-1">CB</th>
                <th className="px-1 py-1">P1</th>
                <th className="px-1 py-1">Grand Total</th>
              </Fragment>
            ))}
          </tr>
          <tr className="bg-[#1a3d2b] text-white text-[10px]">
            {[0, 1, 2].map((g) => (
              <Fragment key={`cols-${g}`}>
                {BV_ROWS.map((r) => (
                  <th key={`${g}-bv-${r}`} className="px-1 py-1 border-l border-white/10">{r}</th>
                ))}
                {CB_ROWS.map((r) => (
                  <th key={`${g}-cb-${r}`} className="px-1 py-1">{r}</th>
                ))}
                <th key={`${g}-p1`} className="px-1 py-1">P1</th>
                <th key={`${g}-gt`} className="px-1 py-1">Total</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {regions.map((region) => (
            <Fragment key={region.regionName}>
              <tr key={`${region.regionName}-h`} className="mis-region-header">
                <td colSpan={colCount} className="px-3 py-2">{region.regionName}</td>
              </tr>
              {region.rows.map((row) => {
                const editable = canEdit && editableAdIds.includes(row.adOfficeId);
                return (
                  <tr key={row.adOfficeId} className="border-b border-slate-100">
                    <td className="px-2 py-1">{row.sno}</td>
                    <td className="px-2 py-1 font-medium">{row.adOffice}</td>
                    {renderBlock(row, 'ulm', false)}
                    {renderBlock(row, 'dm', editable)}
                    {renderBlock(row, 'um', false)}
                  </tr>
                );
              })}
              <tr className="mis-subtotal-row text-xs">
                <td colSpan={2} className="px-3 py-2">Subtotal — {region.regionName}</td>
                {renderTotalBlock((region.subtotal as { ulm: DflsBlock }).ulm, 'mis-cell-ulm')}
                {renderTotalBlock((region.subtotal as { dm: DflsBlock }).dm, 'mis-cell-dm')}
                {renderTotalBlock((region.subtotal as { um: DflsBlock }).um, 'mis-cell-um')}
              </tr>
            </Fragment>
          ))}
          <tr className="mis-grand-total-row text-xs">
            <td colSpan={2} className="px-3 py-2">Grand Total</td>
            {renderTotalBlock(grandTotal.ulm, 'mis-cell-ulm')}
            {renderTotalBlock(grandTotal.dm, 'mis-cell-dm')}
            {renderTotalBlock(grandTotal.um, 'mis-cell-um')}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
