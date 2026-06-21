import { Building2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { getRegionTotals, getAchievementPercent } from './plantationReportData.js';

function statusVariant(status) {
  if (status === 'Approved') return 'approved';
  if (status === 'Submitted') return 'submitted';
  if (status === 'Draft') return 'draft';
  return 'default';
}

export default function AdOfficeWiseList({ offices, region, selectedOffice, onSelectOffice }) {
  const totals = getRegionTotals(offices);
  const regionAchievement = getAchievementPercent(totals.um, totals.target);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-primary">
            <Building2 size={20} />
          </div>
          <div>
            <CardTitle>AD Office Wise List</CardTitle>
            <p className="text-xs text-slate-500">
              {region} · {offices.length} office{offices.length !== 1 ? 's' : ''} · Unit: Acre / Farmer
            </p>
          </div>
        </div>
        <Badge variant="live">Region Summary</Badge>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="px-3 py-3 text-left">S.No</th>
              <th className="px-3 py-3 text-left">AD Office</th>
              <th className="px-3 py-3 text-left">Region</th>
              <th className="px-3 py-3 text-center">Target Acre</th>
              <th className="px-3 py-3 text-center">Target Farmer</th>
              <th className="px-3 py-3 text-center">ULM Acre</th>
              <th className="px-3 py-3 text-center">ULM Farmer</th>
              <th className="px-3 py-3 text-center text-orange-600">DM Acre</th>
              <th className="px-3 py-3 text-center text-orange-600">DM Farmer</th>
              <th className="px-3 py-3 text-center bg-emerald-50/80 text-emerald-700">UM Acre</th>
              <th className="px-3 py-3 text-center bg-emerald-50/80 text-emerald-700">UM Farmer</th>
              <th className="px-3 py-3 text-center">Achievement %</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {offices.map((row, idx) => {
              const isSelected = selectedOffice === row.adOffice;
              return (
                <tr
                  key={row.adOffice}
                  className={`border-b border-slate-50 transition-colors hover:bg-slate-50/60 ${
                    isSelected ? 'bg-emerald-50/50 ring-1 ring-inset ring-emerald-200' : ''
                  }`}
                >
                  <td className="px-3 py-3 font-medium text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectOffice?.(row.adOffice)}
                      className="font-semibold text-emerald-primary hover:underline"
                    >
                      {row.adOffice}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{row.region}</td>
                  <td className="px-3 py-3 text-center">{row.target.acre}</td>
                  <td className="px-3 py-3 text-center">{row.target.farmer}</td>
                  <td className="px-3 py-3 text-center">{row.ulm.acre}</td>
                  <td className="px-3 py-3 text-center">{row.ulm.farmer}</td>
                  <td className="px-3 py-3 text-center font-medium text-orange-700">{row.dm.acre}</td>
                  <td className="px-3 py-3 text-center font-medium text-orange-700">{row.dm.farmer}</td>
                  <td className="bg-emerald-50/30 px-3 py-3 text-center font-semibold text-emerald-800">{row.um.acre}</td>
                  <td className="bg-emerald-50/30 px-3 py-3 text-center font-semibold text-emerald-800">{row.um.farmer}</td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-800">{row.achievement}%</td>
                  <td className="px-3 py-3 text-center">
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectOffice?.(row.adOffice)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-emerald-primary hover:bg-emerald-50 hover:text-emerald-primary"
                      aria-label={`View ${row.adOffice}`}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {offices.length > 0 && (
              <tr className="bg-emerald-100/60 font-bold text-emerald-900">
                <td colSpan={3} className="px-3 py-3.5">Region Total</td>
                <td className="px-3 py-3.5 text-center">{totals.target.acre}</td>
                <td className="px-3 py-3.5 text-center">{totals.target.farmer}</td>
                <td className="px-3 py-3.5 text-center">{totals.ulm.acre}</td>
                <td className="px-3 py-3.5 text-center">{totals.ulm.farmer}</td>
                <td className="px-3 py-3.5 text-center">{totals.dm.acre}</td>
                <td className="px-3 py-3.5 text-center">{totals.dm.farmer}</td>
                <td className="bg-emerald-200/40 px-3 py-3.5 text-center">{totals.um.acre}</td>
                <td className="bg-emerald-200/40 px-3 py-3.5 text-center">{totals.um.farmer}</td>
                <td className="px-3 py-3.5 text-center">{regionAchievement}%</td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>
        {offices.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            No AD offices found for the selected filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
