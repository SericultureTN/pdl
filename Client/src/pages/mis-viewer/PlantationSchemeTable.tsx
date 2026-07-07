import { Fragment } from 'react';
import type { SchemeRow, RegionBlock, AcreFarmer } from '../../types/misReport';
import { CATEGORIES } from './PlantationOverallTable';

function pairCells(v: AcreFarmer, cls: string) {
  return (
    <>
      <td className={`${cls} px-1.5 py-1 text-right text-xs`}>{v.acre}</td>
      <td className={`${cls} px-1.5 py-1 text-right text-xs`}>{v.farmer}</td>
    </>
  );
}

interface Props {
  regions: RegionBlock<SchemeRow>[];
  grandTotal: { categories: Record<string, { ulm: AcreFarmer; dm: AcreFarmer; um: AcreFarmer; target: AcreFarmer }> };
  canEdit: boolean;
  editableAdIds: number[];
  onSaveDm: (adOfficeId: number, category: string, field: 'acre' | 'farmer', value: number, current: AcreFarmer) => void;
}

export default function PlantationSchemeTable({
  regions,
  grandTotal,
  canEdit,
  editableAdIds,
  onSaveDm,
}: Props) {
  return (
    <div className="mis-table-scroll mis-viewer-table-wrap rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[1200px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#1a3d2b] text-white text-xs">
            <th rowSpan={2} className="px-2 py-2 text-left">S.No</th>
            <th rowSpan={2} className="px-2 py-2 text-left min-w-[120px]">AD Office</th>
            {CATEGORIES.map((cat) => (
              <th key={cat} colSpan={7} className="px-1 py-2 border-l border-white/20">{cat}</th>
            ))}
          </tr>
          <tr className="bg-[#1a3d2b] text-white text-[10px]">
            {CATEGORIES.map((cat) => (
              <Fragment key={cat}>
                <th className="px-1 py-1 border-l border-white/20">Tgt Ac</th>
                <th className="px-1 py-1 bg-[#0C447C]/80">ULM Ac</th>
                <th className="px-1 py-1 bg-[#0C447C]/80">ULM Fr</th>
                <th className="px-1 py-1 bg-[#27500A]/80">DM Ac</th>
                <th className="px-1 py-1 bg-[#27500A]/80">DM Fr</th>
                <th className="px-1 py-1 bg-[#3C3489]/80">UM Ac</th>
                <th className="px-1 py-1 bg-[#3C3489]/80">UM Fr</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {regions.map((region) => (
            <Fragment key={region.regionName}>
              <tr key={`${region.regionName}-h`} className="mis-region-header">
                <td colSpan={2 + CATEGORIES.length * 7} className="px-3 py-2">{region.regionName}</td>
              </tr>
              {region.rows.map((row) => {
                const editable = canEdit && editableAdIds.includes(row.adOfficeId);
                return (
                  <tr key={row.adOfficeId} className="border-b border-slate-100">
                    <td className="px-2 py-1">{row.sno}</td>
                    <td className="px-2 py-1 font-medium">{row.adOffice}</td>
                    {CATEGORIES.map((cat) => {
                      const c = row.categories[cat];
                      return (
                        <Fragment key={cat}>
                          <td className="px-1.5 py-1 text-right text-xs border-l border-slate-100">{c.target.acre}</td>
                          {pairCells(c.ulm, 'mis-cell-ulm')}
                          <td className="mis-cell-dm px-1.5 py-1 text-right text-xs">
                            {editable ? (
                              <input
                                type="number"
                                min={0}
                                className="mis-dm-input w-12"
                                value={c.dm.acre}
                                onChange={(e) => onSaveDm(row.adOfficeId, cat, 'acre', Number(e.target.value) || 0, c.dm)}
                              />
                            ) : c.dm.acre}
                          </td>
                          <td className="mis-cell-dm px-1.5 py-1 text-right text-xs">
                            {editable ? (
                              <input
                                type="number"
                                min={0}
                                className="mis-dm-input w-12"
                                value={c.dm.farmer}
                                onChange={(e) => onSaveDm(row.adOfficeId, cat, 'farmer', Number(e.target.value) || 0, c.dm)}
                              />
                            ) : c.dm.farmer}
                          </td>
                          {pairCells(c.um, 'mis-cell-um')}
                        </Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
          <tr className="mis-grand-total-row text-xs">
            <td colSpan={2} className="px-3 py-2">Grand Total</td>
            {CATEGORIES.map((cat) => {
              const g = grandTotal.categories[cat];
              return (
                <Fragment key={cat}>
                  <td className="px-1.5 py-2 text-right border-l border-slate-200">{g.target.acre}</td>
                  {pairCells(g.ulm, 'mis-cell-ulm')}
                  {pairCells(g.dm, 'mis-cell-dm')}
                  {pairCells(g.um, 'mis-cell-um')}
                </Fragment>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
