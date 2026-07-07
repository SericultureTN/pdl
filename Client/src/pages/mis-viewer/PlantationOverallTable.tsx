import { Fragment } from 'react';
import type { PlantationRow, RegionBlock, AcreFarmer } from '../../types/misReport';

const CATEGORIES = ['2.00 Acre', '1.00 Acre', 'SCSP', 'TSP'];

function cellPair(v: AcreFarmer) {
  return (
    <>
      <td className="mis-cell-ulm px-2 py-1.5 text-right whitespace-nowrap">{v.acre}</td>
      <td className="mis-cell-ulm px-2 py-1.5 text-right whitespace-nowrap">{v.farmer}</td>
    </>
  );
}

function dmInput(
  value: number,
  onChange: (v: number) => void,
  editable: boolean
) {
  if (!editable) {
    return <td className="mis-cell-dm px-2 py-1.5 text-right">{value}</td>;
  }
  return (
    <td className="mis-cell-dm px-2 py-1.5 text-right">
      <input
        type="number"
        min={0}
        step="any"
        className="mis-dm-input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </td>
  );
}

interface Props {
  regions: RegionBlock<PlantationRow>[];
  grandTotal: { base: AcreFarmer; ulm: AcreFarmer; dm: AcreFarmer; um: AcreFarmer };
  canEdit: boolean;
  editableAdIds: number[];
  onSaveDm: (adOfficeId: number, field: 'acre' | 'farmer', value: number, current: AcreFarmer) => void;
}

export default function PlantationOverallTable({
  regions,
  grandTotal,
  canEdit,
  editableAdIds,
  onSaveDm,
}: Props) {
  return (
    <div className="mis-table-scroll mis-viewer-table-wrap rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#1a3d2b] text-white">
            <th rowSpan={2} className="px-3 py-2 text-left">S.No</th>
            <th rowSpan={2} className="px-3 py-2 text-left min-w-[140px]">AD Office</th>
            <th colSpan={2} className="px-2 py-2 border-l border-white/20">Base Area</th>
            <th colSpan={2} className="px-2 py-2 border-l border-white/20 bg-[#0C447C]">ULM</th>
            <th colSpan={2} className="px-2 py-2 border-l border-white/20 bg-[#27500A]">DM</th>
            <th colSpan={2} className="px-2 py-2 border-l border-white/20 bg-[#3C3489]">UM</th>
          </tr>
          <tr className="bg-[#1a3d2b] text-white text-xs">
            <th className="px-2 py-1">Acre</th>
            <th className="px-2 py-1">Farmer</th>
            <th className="px-2 py-1 bg-[#0C447C]/80">Acre</th>
            <th className="px-2 py-1 bg-[#0C447C]/80">Farmer</th>
            <th className="px-2 py-1 bg-[#27500A]/80">Acre</th>
            <th className="px-2 py-1 bg-[#27500A]/80">Farmer</th>
            <th className="px-2 py-1 bg-[#3C3489]/80">Acre</th>
            <th className="px-2 py-1 bg-[#3C3489]/80">Farmer</th>
          </tr>
        </thead>
        <tbody>
          {regions.map((region) => (
            <Fragment key={region.regionName}>
              <tr key={`${region.regionName}-header`} className="mis-region-header">
                <td colSpan={10} className="px-3 py-2">{region.regionName}</td>
              </tr>
              {region.rows.map((row) => {
                const editable = canEdit && editableAdIds.includes(row.adOfficeId);
                return (
                  <tr key={row.adOfficeId} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-1.5">{row.sno}</td>
                    <td className="px-3 py-1.5 font-medium">{row.adOffice}</td>
                    <td className="px-2 py-1.5 text-right">{row.base.acre}</td>
                    <td className="px-2 py-1.5 text-right">{row.base.farmer}</td>
                    {cellPair(row.ulm)}
                    {dmInput(row.dm.acre, (v) => onSaveDm(row.adOfficeId, 'acre', v, row.dm), editable)}
                    {dmInput(row.dm.farmer, (v) => onSaveDm(row.adOfficeId, 'farmer', v, row.dm), editable)}
                    {cellPair(row.um)}
                  </tr>
                );
              })}
              <tr className="mis-subtotal-row border-b border-slate-200">
                <td colSpan={2} className="px-3 py-2">Subtotal — {region.regionName}</td>
                <td className="px-2 py-2 text-right">{(region.subtotal as { base: AcreFarmer }).base.acre}</td>
                <td className="px-2 py-2 text-right">{(region.subtotal as { base: AcreFarmer }).base.farmer}</td>
                {cellPair((region.subtotal as { ulm: AcreFarmer }).ulm)}
                {cellPair((region.subtotal as { dm: AcreFarmer }).dm)}
                {cellPair((region.subtotal as { um: AcreFarmer }).um)}
              </tr>
            </Fragment>
          ))}
          <tr className="mis-grand-total-row">
            <td colSpan={2} className="px-3 py-2">Grand Total</td>
            <td className="px-2 py-2 text-right">{grandTotal.base.acre}</td>
            <td className="px-2 py-2 text-right">{grandTotal.base.farmer}</td>
            {cellPair(grandTotal.ulm)}
            {cellPair(grandTotal.dm)}
            {cellPair(grandTotal.um)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export { CATEGORIES };
