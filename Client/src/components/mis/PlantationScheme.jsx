import { useState } from "react";
import { ClipboardList } from "lucide-react";
import FilterBar, { ALL_AD_OFFICES } from "./FilterBar.jsx";
import ActionBar from "./ActionBar.jsx";
import { TargetCell, ULMCell, DMCell, UMCell, MISFormulaBanner } from "./MISCellHelpers.jsx";
import { useMonthlyData } from "./useMonthlyData.js";

const CATEGORIES = [
  { id: "cat2", label: "2.00 Acre Category", color: "gov-cat-blue" },
  { id: "cat1", label: "1.00 Acre Category", color: "gov-cat-green" },
  { id: "scsp", label: "SCSP Category",      color: "gov-cat-orange" },
  { id: "tsp",  label: "TSP Category",       color: "gov-cat-purple" },
];

// Each category has independent ULM/DM/UM Acre + Farmer columns
// Field naming: {catId}__dm_acre, {catId}__dm_farmer
const DM_FIELDS = CATEGORIES.flatMap(c => [`${c.id}__dm_acre`, `${c.id}__dm_farmer`]);
const ulmFieldFor = f => f.replace("__dm_", "__ulm_");
const umFieldFor  = f => f.replace("__dm_", "__um_");

const buildEmptyRows = () =>
  ALL_AD_OFFICES.map((ad, i) => {
    const row = { slNo: i + 1, adOffice: ad };
    CATEGORIES.forEach(c => {
      row[`${c.id}__target`]    = "";
      row[`${c.id}__ulm_acre`]  = "";
      row[`${c.id}__dm_acre`]   = "";
      row[`${c.id}__um_acre`]   = "";
      row[`${c.id}__ulm_farmer`]= "";
      row[`${c.id}__dm_farmer`] = "";
      row[`${c.id}__um_farmer`] = "";
    });
    return row;
  });

const colSum = (rows, field) =>
  rows.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0).toFixed(2);

export default function PlantationScheme({ year }) {
  const [filters, setFilters] = useState({
    region: "All Regions", ad: "All AD Offices", year: year || "2025–26", month: "April"
  });

  const {
    rows, currentMonth, currentYear,
    updateDM, saveRows, resetCurrentMonth, handleMonthChange,
  } = useMonthlyData({ buildEmptyRows, dmFields: DM_FIELDS, ulmFieldFor, umFieldFor });

  const onFilterChange = (f) => {
    setFilters(f);
    handleMonthChange(f.year, f.month);
  };

  const visibleRows = filters.ad === "All AD Offices"
    ? rows
    : rows.filter(r => r.adOffice === filters.ad);

  const handleSaveDraft = () => { saveRows(rows); alert("Draft saved."); };
  const handleSubmit    = () => { saveRows(rows); alert("Submitted."); };
  const handleReset     = () => resetCurrentMonth();
  const handleExport    = () => alert("Exporting…");
  const handlePrint     = () => window.print();

  return (
    <div className="gov-data-entry">
      <div className="gov-page-title">
        <div className="gov-page-title-icon"><ClipboardList size={20} /></div>
        <div>
          <h2>Plantation Scheme {year}</h2>
          <p>Category-wise plantation scheme — Monthly MIS Report &nbsp;·&nbsp;
            <strong>{currentMonth} {currentYear}</strong>
          </p>
        </div>
      </div>

      <FilterBar filters={filters} onChange={onFilterChange} />

      <MISFormulaBanner />

      {CATEGORIES.map(cat => (
        <div key={cat.id} className={`gov-table-card gov-cat-card ${cat.color}`}>
          <div className="gov-cat-header">
            <span className="gov-cat-badge" />
            <h4>{cat.label}</h4>
          </div>
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
                      <TargetCell value={row[`${cat.id}__target`]} />
                      <ULMCell value={row[`${cat.id}__ulm_acre`]} />
                      <ULMCell value={row[`${cat.id}__ulm_farmer`]} />
                      <DMCell value={row[`${cat.id}__dm_acre`]}
                        onChange={v => updateDM(rowIdx, `${cat.id}__dm_acre`, v)} />
                      <DMCell value={row[`${cat.id}__dm_farmer`]}
                        onChange={v => updateDM(rowIdx, `${cat.id}__dm_farmer`, v)} />
                      <UMCell value={row[`${cat.id}__um_acre`]} />
                      <UMCell value={row[`${cat.id}__um_farmer`]} />
                    </tr>
                  );
                })}
                <tr className="gov-tr-total">
                  <td colSpan={3} className="gov-td-center gov-td-total-label">Total</td>
                  {["ulm_acre","ulm_farmer","dm_acre","dm_farmer","um_acre","um_farmer"].map(f => (
                    <td key={f} className="gov-td-center gov-td-total-val">
                      {colSum(visibleRows, `${cat.id}__${f}`)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <ActionBar onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} onReset={handleReset} onExport={handleExport} onPrint={handlePrint} />
    </div>
  );
}
