import { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import FilterBar, { ALL_AD_OFFICES } from "./FilterBar.jsx";
import ActionBar from "./ActionBar.jsx";
import { TargetCell, ULMCell, DMCell, UMCell, MISFormulaBanner } from "./MISCellHelpers.jsx";
import { useApiData } from "./useApiData.js";

const CATEGORIES = [
  { id: "cat2", label: "2.00 Acre Category", color: "gov-cat-blue" },
  { id: "cat1", label: "1.00 Acre Category", color: "gov-cat-green" },
  { id: "scsp", label: "SCSP Category",      color: "gov-cat-orange" },
  { id: "tsp",  label: "TSP Category",       color: "gov-cat-purple" },
];

const buildEmptyRows = () =>
  ALL_AD_OFFICES.map((ad, i) => {
    const row = { slNo: i + 1, adOffice: ad, reportId: null, status: "Draft" };
    CATEGORIES.forEach(c => {
      row[`${c.id}__target`]     = "";
      row[`${c.id}__ulm_acre`]   = "";  row[`${c.id}__dm_acre`]   = "";  row[`${c.id}__um_acre`]   = "";
      row[`${c.id}__ulm_farmer`] = "";  row[`${c.id}__dm_farmer`] = "";  row[`${c.id}__um_farmer`] = "";
    });
    return row;
  });

// Recalc UM for a given category after a DM edit
function recalcCat(row, catId) {
  const u = { ...row };
  CATEGORIES.forEach(c => {
    if (c.id !== catId) return;
    u[`${c.id}__um_acre`]   = ((parseFloat(u[`${c.id}__ulm_acre`])   || 0) + (parseFloat(u[`${c.id}__dm_acre`])   || 0)).toString();
    u[`${c.id}__um_farmer`] = ((parseFloat(u[`${c.id}__ulm_farmer`]) || 0) + (parseFloat(u[`${c.id}__dm_farmer`]) || 0)).toString();
  });
  return u;
}

// Apply carry-forward from API row: set ULM from prev month UM where present
function applyCarryForward(localRow, apiRow) {
  if (!apiRow) return localRow;
  const ulmAcre   = parseFloat(apiRow.ulm_acre)   || 0;
  const ulmFarmer = parseInt(apiRow.ulm_farmer, 10) || 0;
  const u = { ...localRow };
  CATEGORIES.forEach(c => {
    u[`${c.id}__ulm_acre`]   = ulmAcre;
    u[`${c.id}__ulm_farmer`] = ulmFarmer;
    // Recalc UM = ULM + existing DM
    u[`${c.id}__um_acre`]   = ulmAcre   + (parseFloat(localRow[`${c.id}__dm_acre`])   || 0);
    u[`${c.id}__um_farmer`] = ulmFarmer + (parseInt(localRow[`${c.id}__dm_farmer`], 10) || 0);
  });
  return u;
}

const colSum = (rows, field) =>
  rows.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0).toFixed(2);

export default function PlantationScheme({ year: yearProp, user }) {
  const [filters, setFilters] = useState({
    region: "All Regions", ad: "All AD Offices",
    year: yearProp || "2025-26", month: "April",
  });

  const { rows, setRows, loading, saving, error, saveToApi, loadData } = useApiData({
    schemeName: `Plantation Scheme ${yearProp || "2025-26"}`,
    buildEmptyRows,
    applyCarryForward,
    year: filters.year,
    month: filters.month,
    user,
  });

  const onFilterChange = (f) => setFilters(f);

  const updateField = (rowIdx, field, value) => {
    setRows(prev => {
      const catId = field.split("__")[0];
      const updated = prev.map((r, i) => i !== rowIdx ? r : recalcCat({ ...r, [field]: value }, catId));
      return updated;
    });
  };

  const visibleRows = filters.ad === "All AD Offices"
    ? rows : rows.filter(r => r.adOffice === filters.ad);

  const handleSaveDraft = async () => {
    const ok = await saveToApi(rows, filters.year, filters.month, "Draft");
    if (ok) alert("Draft saved.");
  };
  const handleSubmit = async () => {
    const ok = await saveToApi(rows, filters.year, filters.month, "Submitted");
    if (ok) alert("Data submitted successfully.");
  };
  const handleReset   = () => loadData(filters.year, filters.month);
  const handleExport  = () => alert("Exporting…");
  const handlePrint   = () => window.print();

  return (
    <div className="gov-data-entry">
      <div className="gov-page-title">
        <div className="gov-page-title-icon"><ClipboardList size={20} /></div>
        <div>
          <h2>Plantation Scheme {yearProp}</h2>
          <p>Category-wise plantation scheme — Monthly MIS Report &nbsp;·&nbsp;
            <strong>{filters.month} {filters.year}</strong>
          </p>
        </div>
      </div>

      <FilterBar filters={filters} onChange={onFilterChange} />
      {error && <div className="gov-alert gov-alert-error">⚠ {error}</div>}
      <MISFormulaBanner />

      {CATEGORIES.map(cat => (
        <div key={cat.id} className={`gov-table-card gov-cat-card ${cat.color}`}>
          <div className="gov-cat-header">
            <span className="gov-cat-badge" />
            <h4>{cat.label}</h4>
          </div>
          {loading ? (
            <div className="gov-loading-row"><Loader2 size={18} className="gov-spin" /> Loading…</div>
          ) : (
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
                    <th className="gov-th-target">Status</th>
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
                          onChange={v => updateField(rowIdx, `${cat.id}__dm_acre`, v)} />
                        <DMCell value={row[`${cat.id}__dm_farmer`]}
                          onChange={v => updateField(rowIdx, `${cat.id}__dm_farmer`, v)} />
                        <UMCell value={row[`${cat.id}__um_acre`]} />
                        <UMCell value={row[`${cat.id}__um_farmer`]} />
                        <td className="gov-td-center">
                          <span className={`gov-status-badge gov-status-${(row.status || "Draft").toLowerCase()}`}>
                            {row.status || "Draft"}
                          </span>
                        </td>
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
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <ActionBar
        onSaveDraft={handleSaveDraft} onSubmit={handleSubmit}
        onReset={handleReset} onExport={handleExport} onPrint={handlePrint}
        disabled={saving || loading}
      />
    </div>
  );
}
