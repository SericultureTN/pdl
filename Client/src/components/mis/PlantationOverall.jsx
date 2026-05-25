import { useState, useEffect, useCallback } from "react";
import { Leaf, Loader2 } from "lucide-react";
import FilterBar, { ALL_AD_OFFICES } from "./FilterBar.jsx";
import ActionBar from "./ActionBar.jsx";
import { TargetCell, ULMCell, DMCell, UMCell, MISFormulaBanner } from "./MISCellHelpers.jsx";
import { misReportApi } from "../../services/misApi.js";

const SCHEME = "Plantation Overall";

const emptyRow = (ad, i) => ({
  slNo: i + 1, adOffice: ad,
  target: "", target_farmer: "",
  ulm_acre: "", ulm_farmer: "",
  dm_acre: "", dm_farmer: "",
  um_acre: "", um_farmer: "",
  reportId: null, status: "Draft",
});

const colSum = (rows, field) =>
  rows.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0).toFixed(2);

// Normalise an API row into the local row shape
function apiToRow(apiRow, index) {
  return {
    slNo: index + 1,
    adOffice: apiRow.office_name,
    target: apiRow.target_acre ?? "",
    target_farmer: apiRow.target_farmer ?? "",
    ulm_acre:   parseFloat(apiRow.ulm_acre)   || 0,
    ulm_farmer: parseInt(apiRow.ulm_farmer, 10) || 0,
    dm_acre:    parseFloat(apiRow.dm_acre)    || 0,
    dm_farmer:  parseInt(apiRow.dm_farmer, 10) || 0,
    um_acre:    parseFloat(apiRow.um_acre)    || 0,
    um_farmer:  parseInt(apiRow.um_farmer, 10) || 0,
    reportId: apiRow.id || null,
    status: apiRow.status || "Draft",
  };
}

export default function PlantationOverall({ user }) {
  const [filters, setFilters] = useState({
    region: "All Regions", ad: "All AD Offices", year: "2025-26", month: "April"
  });
  const [rows, setRows]       = useState(() => ALL_AD_OFFICES.map(emptyRow));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  // Load data from API whenever year or month changes
  const loadData = useCallback(async (year, month) => {
    setLoading(true);
    setError(null);
    try {
      // Admin/Super Admin: load all offices at once
      const isAdmin = user?.role === "super_admin" || user?.role === "section_admin";
      if (isAdmin) {
        const res = await misReportApi.loadAllOffices({ schemeName: SCHEME, yearName: year, monthName: month });
        setRows((res.rows || []).map(apiToRow));
      } else {
        // AD Office User: load only their own office
        const officeName = user?.ad_office;
        if (!officeName) return;
        const res = await misReportApi.loadReport({ officeName, schemeName: SCHEME, yearName: year, monthName: month });
        const r = apiToRow(res.report, 0);
        setRows([r]);
      }
    } catch (e) {
      setError(e.message);
      // Fall back to empty rows so UI stays usable
      setRows(ALL_AD_OFFICES.map(emptyRow));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData(filters.year, filters.month);
  }, [filters.year, filters.month, loadData]);

  const onFilterChange = (f) => setFilters(f);

  // Inline DM edit + instant UM recalc
  const updateDM = (rowIdx, field, value) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== rowIdx) return r;
      const u = { ...r, [field]: value };
      u.um_acre   = ((parseFloat(u.ulm_acre)   || 0) + (parseFloat(u.dm_acre)   || 0)).toString();
      u.um_farmer = ((parseFloat(u.ulm_farmer)  || 0) + (parseFloat(u.dm_farmer) || 0)).toString();
      return u;
    }));
  };

  const persistRows = async (status) => {
    setSaving(true);
    setError(null);
    try {
      await misReportApi.saveBulk({
        rows: rows.map(r => ({ adOffice: r.adOffice, dm_acre: r.dm_acre, dm_farmer: r.dm_farmer })),
        schemeName: SCHEME,
        yearName: filters.year,
        monthName: filters.month,
        status,
      });
      await loadData(filters.year, filters.month);
      alert(status === "Submitted" ? "Data submitted successfully." : "Draft saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => persistRows("Draft");
  const handleSubmit    = () => persistRows("Submitted");
  const handleReset     = () => loadData(filters.year, filters.month);
  const handleExport    = () => alert("Exporting to Excel…");
  const handlePrint     = () => window.print();

  const visibleRows = filters.ad === "All AD Offices"
    ? rows
    : rows.filter(r => r.adOffice === filters.ad);

  return (
    <div className="gov-data-entry">
      <div className="gov-page-title">
        <div className="gov-page-title-icon"><Leaf size={20} /></div>
        <div>
          <h2>Plantation Overall</h2>
          <p>New plantation — Monthly MIS Report &nbsp;·&nbsp;
            <strong>{filters.month} {filters.year}</strong>
          </p>
        </div>
      </div>

      <FilterBar filters={filters} onChange={onFilterChange} />

      {error && (
        <div className="gov-alert gov-alert-error">⚠ {error}</div>
      )}

      <MISFormulaBanner />

      <div className="gov-table-card">
        {loading ? (
          <div className="gov-loading-row">
            <Loader2 size={20} className="gov-spin" /> Loading data…
          </div>
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
                      <TargetCell value={row.target} />
                      <ULMCell value={row.ulm_acre} />
                      <ULMCell value={row.ulm_farmer} />
                      <DMCell value={row.dm_acre}   onChange={v => updateDM(rowIdx, "dm_acre",   v)} />
                      <DMCell value={row.dm_farmer} onChange={v => updateDM(rowIdx, "dm_farmer", v)} />
                      <UMCell value={row.um_acre} />
                      <UMCell value={row.um_farmer} />
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
                    <td key={f} className="gov-td-center gov-td-total-val">{colSum(visibleRows, f)}</td>
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ActionBar
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onExport={handleExport}
        onPrint={handlePrint}
        disabled={saving || loading}
      />
    </div>
  );
}
