import React, { useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import FilterBar, { ALL_AD_OFFICES } from "./FilterBar.jsx";
import ActionBar from "./ActionBar.jsx";
import { ULMCell, DMCell, UMCell, MISFormulaBanner } from "./MISCellHelpers.jsx";
import { useApiData } from "./useApiData.js";

const VARIETIES     = ["ULM", "DM", "UM"];
const DM_COLS       = ["bv_govt", "bv_nsso", "bv_tnpvt", "bv_other", "cb_other", "cb_nsso", "p1"];
const VARIETY_COLOR = { ULM: "gov-cat-blue", DM: "gov-cat-green", UM: "gov-cat-orange" };

const recalcTotals = (row, variety, tier) => {
  const u = { ...row };
  u[`${variety}__bv_total__${tier}`] = (
    (parseFloat(u[`${variety}__bv_govt__${tier}`])  || 0) +
    (parseFloat(u[`${variety}__bv_nsso__${tier}`])  || 0) +
    (parseFloat(u[`${variety}__bv_tnpvt__${tier}`]) || 0) +
    (parseFloat(u[`${variety}__bv_other__${tier}`]) || 0)
  ).toString();
  u[`${variety}__cb_total__${tier}`] = (
    (parseFloat(u[`${variety}__cb_other__${tier}`]) || 0) +
    (parseFloat(u[`${variety}__cb_nsso__${tier}`])  || 0)
  ).toString();
  return u;
};

const buildEmptyRows = () =>
  ALL_AD_OFFICES.map((ad, i) => {
    const row = { slNo: i + 1, adOffice: ad, reportId: null, status: "Draft" };
    VARIETIES.forEach(v => {
      [...DM_COLS, "bv_total", "cb_total"].forEach(c => {
        ["ulm","dm","um"].forEach(t => { row[`${v}__${c}__${t}`] = ""; });
      });
    });
    return row;
  });

function applyCarryForward(localRow, apiRow) {
  if (!apiRow) return localRow;
  const ulmVal = parseFloat(apiRow.ulm_acre) || 0;
  const u = { ...localRow };
  VARIETIES.forEach(v => {
    DM_COLS.forEach(c => {
      u[`${v}__${c}__ulm`] = ulmVal;
      u[`${v}__${c}__um`]  = ulmVal + (parseFloat(localRow[`${v}__${c}__dm`]) || 0);
    });
    ["bv_total", "cb_total"].forEach(c => {
      u[`${v}__${c}__ulm`] = ulmVal;
      u[`${v}__${c}__um`]  = ulmVal;
    });
  });
  return u;
}

const colSum = (rows, field) =>
  rows.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0).toFixed(2);

export default function CocoonProduction({ user }) {
  const [filters, setFilters] = useState({
    region: "All Regions", ad: "All AD Offices", year: "2025-26", month: "April",
  });

  const { rows, setRows, loading, saving, error, saveToApi, loadData } = useApiData({
    schemeName: "Cocoon Production",
    buildEmptyRows,
    applyCarryForward,
    year: filters.year,
    month: filters.month,
    user,
  });

  const onFilterChange = (f) => setFilters(f);

  const updateDM = (rowIdx, field, value) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== rowIdx) return r;
      const [variety, col] = field.split("__");
      let u = { ...r, [field]: value };
      u[`${variety}__${col}__um`] = ((parseFloat(u[`${variety}__${col}__ulm`]) || 0) + (parseFloat(value) || 0)).toString();
      ["ulm","dm","um"].forEach(t => { u = recalcTotals(u, variety, t); });
      return u;
    }));
  };

  const handleSaveDraft = async () => { if (await saveToApi(rows, filters.year, filters.month, "Draft"))      alert("Draft saved."); };
  const handleSubmit    = async () => { if (await saveToApi(rows, filters.year, filters.month, "Submitted")) alert("Data submitted successfully."); };
  const handleReset     = () => loadData(filters.year, filters.month);
  const handleExport    = () => alert("Exporting…");
  const handlePrint     = () => window.print();

  return (
    <div className="gov-data-entry">
      <div className="gov-page-title">
        <div className="gov-page-title-icon"><TrendingUp size={20} /></div>
        <div>
          <h2>Cocoon Production (kgs)</h2>
          <p>Variety-wise cocoon production — Monthly MIS Report &nbsp;·&nbsp;
            <strong>{filters.month} {filters.year}</strong>
          </p>
        </div>
      </div>

      <FilterBar filters={filters} onChange={onFilterChange} />
      {error && <div className="gov-alert gov-alert-error">⚠ {error}</div>}
      <MISFormulaBanner />

      {VARIETIES.map(variety => (
        <div key={variety} className={`gov-table-card gov-cat-card ${VARIETY_COLOR[variety]}`}>
          <div className="gov-cat-header">
            <span className="gov-cat-badge" />
            <h4>{variety} — Cocoon Production (kgs)</h4>
          </div>
          {loading ? (
            <div className="gov-loading-row"><Loader2 size={18} className="gov-spin" /> Loading…</div>
          ) : (
            <div className="gov-table-scroll">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th rowSpan={3} className="gov-th-sticky">Sl.No</th>
                    <th rowSpan={3} className="gov-th-sticky-2">AD Office</th>
                    <th colSpan={12} className="gov-th-group">BV</th>
                    <th colSpan={9}  className="gov-th-group gov-group-dm">CB</th>
                    <th colSpan={3}  className="gov-th-group gov-group-um">P1</th>
                  </tr>
                  <tr>
                    {["Govt","NSSO","TN Pvt","Other State","Total"].map(c => <th key={c} colSpan={3}>{c}</th>)}
                    {["Other State","NSSO","Total"].map(c => <th key={c} colSpan={3}>{c}</th>)}
                    <th colSpan={3}>Total</th>
                  </tr>
                  <tr>
                    {[...Array(9)].map((_, gi) =>
                      ["ulm","dm","um"].map(t => (
                        <th key={`${gi}-${t}`} className={
                          t === "ulm" ? "gov-th-ulm-sub" : t === "dm" ? "gov-th-dm-sub" : "gov-th-um-sub"
                        }>{t.toUpperCase()}</th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.adOffice} className={i % 2 === 0 ? "gov-tr-even" : ""}>
                      <td className="gov-td-center gov-td-sticky">{i + 1}</td>
                      <td className="gov-td-sticky-2 gov-td-office">{row.adOffice}</td>
                      {["bv_govt","bv_nsso","bv_tnpvt","bv_other"].map(c => (
                        <React.Fragment key={c}>
                          <ULMCell value={row[`${variety}__${c}__ulm`]} />
                          <DMCell  value={row[`${variety}__${c}__dm`]}  onChange={v => updateDM(i, `${variety}__${c}__dm`, v)} />
                          <UMCell  value={row[`${variety}__${c}__um`]} />
                        </React.Fragment>
                      ))}
                      <ULMCell value={row[`${variety}__bv_total__ulm`]} />
                      <td className="gov-td-calc">{row[`${variety}__bv_total__dm`] || "0"}</td>
                      <UMCell  value={row[`${variety}__bv_total__um`]} />
                      {["cb_other","cb_nsso"].map(c => (
                        <React.Fragment key={c}>
                          <ULMCell value={row[`${variety}__${c}__ulm`]} />
                          <DMCell  value={row[`${variety}__${c}__dm`]}  onChange={v => updateDM(i, `${variety}__${c}__dm`, v)} />
                          <UMCell  value={row[`${variety}__${c}__um`]} />
                        </React.Fragment>
                      ))}
                      <ULMCell value={row[`${variety}__cb_total__ulm`]} />
                      <td className="gov-td-calc">{row[`${variety}__cb_total__dm`] || "0"}</td>
                      <UMCell  value={row[`${variety}__cb_total__um`]} />
                      <ULMCell value={row[`${variety}__p1__ulm`]} />
                      <DMCell  value={row[`${variety}__p1__dm`]}  onChange={v => updateDM(i, `${variety}__p1__dm`, v)} />
                      <UMCell  value={row[`${variety}__p1__um`]} />
                    </tr>
                  ))}
                  <tr className="gov-tr-total">
                    <td colSpan={2} className="gov-td-center gov-td-total-label">Total</td>
                    {["bv_govt","bv_nsso","bv_tnpvt","bv_other","bv_total","cb_other","cb_nsso","cb_total","p1"].flatMap(c =>
                      ["ulm","dm","um"].map(t => (
                        <td key={`${c}-${t}`} className="gov-td-center gov-td-total-val">
                          {colSum(rows, `${variety}__${c}__${t}`)}
                        </td>
                      ))
                    )}
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
