import { useState } from "react";
import { Leaf } from "lucide-react";
import FilterBar, { ALL_AD_OFFICES } from "./FilterBar.jsx";
import ActionBar from "./ActionBar.jsx";
import { TargetCell, ULMCell, DMCell, UMCell, MISFormulaBanner } from "./MISCellHelpers.jsx";
import { useMonthlyData } from "./useMonthlyData.js";

const DM_FIELDS   = ["dm_acre", "dm_farmer"];
const ulmFieldFor = f => f.replace("dm_", "ulm_");
const umFieldFor  = f => f.replace("dm_", "um_");

const buildEmptyRows = () =>
  ALL_AD_OFFICES.map((ad, i) => ({
    slNo: i + 1, adOffice: ad,
    target: "",
    ulm_acre: "", dm_acre: "", um_acre: "",
    ulm_farmer: "", dm_farmer: "", um_farmer: "",
  }));

const colSum = (rows, field) =>
  rows.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0).toFixed(2);

export default function PlantationOverall() {
  const [filters, setFilters] = useState({
    region: "All Regions", ad: "All AD Offices", year: "2025–26", month: "April"
  });

  const {
    rows, currentMonth, currentYear,
    updateDM, saveRows, resetCurrentMonth, handleMonthChange,
  } = useMonthlyData({ buildEmptyRows, dmFields: DM_FIELDS, ulmFieldFor, umFieldFor });

  const onFilterChange = (f) => {
    setFilters(f);
    handleMonthChange(f.year, f.month);
  };

  // Filter rows by selected AD office
  const visibleRows = filters.ad === "All AD Offices"
    ? rows
    : rows.filter(r => r.adOffice === filters.ad);

  const handleSaveDraft = () => { saveRows(rows); alert("Draft saved."); };
  const handleSubmit    = () => { saveRows(rows); alert("Data submitted successfully."); };
  const handleReset     = () => resetCurrentMonth();
  const handleExport    = () => alert("Exporting to Excel…");
  const handlePrint     = () => window.print();

  return (
    <div className="gov-data-entry">
      <div className="gov-page-title">
        <div className="gov-page-title-icon"><Leaf size={20} /></div>
        <div>
          <h2>Plantation Overall</h2>
          <p>New plantation — Monthly MIS Report &nbsp;·&nbsp;
            <strong>{currentMonth} {currentYear}</strong>
          </p>
        </div>
      </div>

      <FilterBar filters={filters} onChange={onFilterChange} />

      <MISFormulaBanner />

      <div className="gov-table-card">
        <div className="gov-table-scroll">
          <table className="gov-table">
            <thead>
              <tr>
                <th className="gov-th-sticky gov-th-sno">S.No</th>
                <th className="gov-th-sticky-2 gov-th-office">AD Office</th>
                <th className="gov-th-target">Target</th>
                <th className="gov-th-ulm-sub">ULM Acre</th>
                <th className="gov-th-ulm-sub">ULM Farmer</th>
                <th className="gov-th-dm-sub">DM Acre</th>
                <th className="gov-th-dm-sub">DM Farmer</th>
                <th className="gov-th-um-sub">UM Acre</th>
                <th className="gov-th-um-sub">UM Farmer</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => {
                const rowIdx = rows.indexOf(row);
                return (
                  <tr key={row.adOffice} className={i % 2 === 0 ? "gov-tr-even" : ""}>
                    <td className="gov-td-center gov-td-sticky">{i + 1}</td>
                    <td className="gov-td-sticky-2 gov-td-office">{row.adOffice}</td>
                    <TargetCell value={row.target} />
                    <ULMCell value={row.ulm_acre} />
                    <ULMCell value={row.ulm_farmer} />
                    <DMCell value={row.dm_acre}   onChange={v => updateDM(rowIdx, "dm_acre",   v)} />
                    <DMCell value={row.dm_farmer} onChange={v => updateDM(rowIdx, "dm_farmer", v)} />
                    <UMCell value={row.um_acre} />
                    <UMCell value={row.um_farmer} />
                  </tr>
                );
              })}
              <tr className="gov-tr-total">
                <td colSpan={3} className="gov-td-center gov-td-total-label">Total</td>
                {["ulm_acre","ulm_farmer","dm_acre","dm_farmer","um_acre","um_farmer"].map(f => (
                  <td key={f} className="gov-td-center gov-td-total-val">
                    {colSum(visibleRows, f)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ActionBar
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onExport={handleExport}
        onPrint={handlePrint}
      />
    </div>
  );
}
