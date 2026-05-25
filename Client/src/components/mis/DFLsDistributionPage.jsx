import { useState, useCallback } from "react";
import {
  LayoutDashboard, ChevronRight, ChevronDown, Bell, User,
  Lock, Calculator, FileEdit, Info, RotateCcw, Save, Send,
  Menu, X, LogOut, BarChart2, Settings, Leaf, TreePine,
  Layers, Activity, FileText, AlertTriangle
} from "lucide-react";
import "./DFLsDistributionPage.css";

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */
const AD_OFFICES = ["AD Salem", "AD Erode", "AD Talavady", "AD Madhahalli", "AD Coimbatore", "AD Udumalaipettai", "AD Coonoor"];
const REGIONS    = ["Erode", "Dharmapuri", "Vellore", "Trichy", "Madurai"];
const FIN_YEARS  = ["2024–25", "2025–26", "2023–24"];
const MONTHS     = ["April","May","June","July","August","September","October","November","December","January","February","March"];
const SCHEMES    = ["DFLs Distribution","DFLs Consumption","Cocoon Production","Plantation Overall"];

const BV_ROWS = [
  { key: "govt",   label: "Govt" },
  { key: "nsso",   label: "NSSO" },
  { key: "tnpvt",  label: "TN Pvt" },
  { key: "other",  label: "Other State" },
];
const CB_ROWS = [
  { key: "cb_other", label: "Other State" },
  { key: "cb_nsso",  label: "NSSO" },
];

/* sidebar nav tree */
const NAV = [
  { id: "dashboard", label: "Dashboard",     icon: <LayoutDashboard size={16} /> },
  {
    id: "data-entry", label: "Data Entry",   icon: <FileEdit size={16} />, children: [
      { id: "plantation-overall",  label: "Plantation Overall" },
      { id: "scheme-2024",         label: "Plantation Scheme 2024-25" },
      { id: "scheme-2025",         label: "Plantation Scheme 2025-26" },
      { id: "distribution",        label: "Distribution" },
      { id: "dfls-distribution",   label: "DFLs Distribution", active: true },
      { id: "dfls-consumption",    label: "DFLs Consumption" },
      { id: "cocoon-production",   label: "Cocoon Production" },
    ],
  },
  { id: "reports",    label: "Reports",      icon: <BarChart2 size={16} /> },
  { id: "analytics",  label: "MIS Analytics",icon: <Activity size={16} /> },
  { id: "profile",    label: "Profile",      icon: <User size={16} /> },
];

/* ══════════════════════════════════════════════════════════════
   INITIAL STATE BUILDER
══════════════════════════════════════════════════════════════ */
function buildInitial() {
  return {
    bv_govt:   { ulm: 120, dm: "", um: 0 },
    bv_nsso:   { ulm: 85,  dm: "", um: 0 },
    bv_tnpvt:  { ulm: 60,  dm: "", um: 0 },
    bv_other:  { ulm: 45,  dm: "", um: 0 },
    cb_other:  { ulm: 30,  dm: "", um: 0 },
    cb_nsso:   { ulm: 20,  dm: "", um: 0 },
    p1:        { ulm: 95,  dm: "", um: 0 },
  };
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
const num = (v) => parseFloat(v) || 0;

function calcTotals(data) {
  const d = { ...data };
  Object.keys(d).forEach(k => {
    d[k] = { ...d[k], um: num(d[k].ulm) + num(d[k].dm) };
  });
  return d;
}

function bvTotal(data, tier) {
  return BV_ROWS.reduce((s, r) => s + num(data[`bv_${r.key}`]?.[tier]), 0);
}
function cbTotal(data, tier) {
  return CB_ROWS.reduce((s, r) => s + num(data[r.key]?.[tier]), 0);
}
function grandTotal(data, tier) {
  return bvTotal(data, tier) + cbTotal(data, tier) + num(data.p1?.[tier]);
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

/* ---------- Accordion ---------- */
function Accordion({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="dfls-accordion">
      <button className="dfls-accordion-trigger" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <ChevronDown size={14} className={`dfls-chevron ${open ? "open" : ""}`} />
      </button>
      {open && <div className="dfls-accordion-body">{children}</div>}
    </div>
  );
}

/* ---------- ULM Card ---------- */
function ULMCard({ data }) {
  return (
    <div className="dfls-entry-card dfls-card-ulm">
      <div className="dfls-card-header dfls-header-ulm">
        <div className="dfls-card-header-left">
          <div className="dfls-card-icon"><Lock size={16} /></div>
          <div>
            <div className="dfls-card-title">ULM</div>
            <div className="dfls-card-sub">Up to Last Month</div>
          </div>
        </div>
        <Lock size={14} className="dfls-card-lock" />
      </div>
      <div className="dfls-card-body">

        <Accordion title="BV — Basic Varieties">
          <table className="dfls-mini-table">
            <thead><tr><th>Category</th><th>Nos</th></tr></thead>
            <tbody>
              {BV_ROWS.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="dfls-cell-readonly">{num(data[`bv_${r.key}`]?.ulm)}</td>
                </tr>
              ))}
              <tr className="dfls-row-total">
                <td>Total</td>
                <td>{bvTotal(data, "ulm")}</td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <Accordion title="CB — Chawki Bed">
          <table className="dfls-mini-table">
            <thead><tr><th>Category</th><th>Nos</th></tr></thead>
            <tbody>
              {CB_ROWS.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="dfls-cell-readonly">{num(data[r.key]?.ulm)}</td>
                </tr>
              ))}
              <tr className="dfls-row-total">
                <td>Total</td>
                <td>{cbTotal(data, "ulm")}</td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <Accordion title="P1 — Priority 1">
          <table className="dfls-mini-table">
            <thead><tr><th>Type</th><th>Value</th></tr></thead>
            <tbody>
              <tr>
                <td>P1</td>
                <td className="dfls-cell-readonly">{num(data.p1?.ulm)}</td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <div className="dfls-grand-total dfls-grand-ulm">
          <span>Grand Total</span>
          <span className="dfls-grand-value">{grandTotal(data, "ulm")}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- DM Card ---------- */
function DMCard({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="dfls-entry-card dfls-card-dm">
      <div className="dfls-card-header dfls-header-dm">
        <div className="dfls-card-header-left">
          <div className="dfls-card-icon"><FileEdit size={16} /></div>
          <div>
            <div className="dfls-card-title">DM</div>
            <div className="dfls-card-sub">During Month</div>
          </div>
        </div>
        <span className="dfls-editable-badge">Editable</span>
      </div>
      <div className="dfls-card-body">

        <Accordion title="BV — Basic Varieties">
          <table className="dfls-mini-table">
            <thead><tr><th>Category</th><th>Nos</th></tr></thead>
            <tbody>
              {BV_ROWS.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td>
                    <input
                      type="number"
                      className="dfls-cell-input"
                      value={data[`bv_${r.key}`]?.dm}
                      min={0}
                      placeholder="0"
                      onChange={e => handleChange(`bv_${r.key}`, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
              <tr className="dfls-row-total">
                <td>Total</td>
                <td>{bvTotal(data, "dm")}</td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <Accordion title="CB — Chawki Bed">
          <table className="dfls-mini-table">
            <thead><tr><th>Category</th><th>Nos</th></tr></thead>
            <tbody>
              {CB_ROWS.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td>
                    <input
                      type="number"
                      className="dfls-cell-input"
                      value={data[r.key]?.dm}
                      min={0}
                      placeholder="0"
                      onChange={e => handleChange(r.key, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
              <tr className="dfls-row-total">
                <td>Total</td>
                <td>{cbTotal(data, "dm")}</td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <Accordion title="P1 — Priority 1">
          <table className="dfls-mini-table">
            <thead><tr><th>Type</th><th>Value</th></tr></thead>
            <tbody>
              <tr>
                <td>P1</td>
                <td>
                  <input
                    type="number"
                    className="dfls-cell-input"
                    value={data.p1?.dm}
                    min={0}
                    placeholder="0"
                    onChange={e => handleChange("p1", e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <div className="dfls-grand-total dfls-grand-dm">
          <span>Grand Total</span>
          <span className="dfls-grand-value">{grandTotal(data, "dm")}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- UM Card ---------- */
function UMCard({ data }) {
  return (
    <div className="dfls-entry-card dfls-card-um">
      <div className="dfls-card-header dfls-header-um">
        <div className="dfls-card-header-left">
          <div className="dfls-card-icon"><Calculator size={16} /></div>
          <div>
            <div className="dfls-card-title">UM</div>
            <div className="dfls-card-sub">Up to Month</div>
          </div>
        </div>
        <span className="dfls-auto-badge">Auto</span>
      </div>
      <div className="dfls-card-body">

        <div className="dfls-formula-pill">UM = ULM + DM</div>

        <Accordion title="BV — Basic Varieties">
          <table className="dfls-mini-table">
            <thead><tr><th>Category</th><th>Nos</th></tr></thead>
            <tbody>
              {BV_ROWS.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="dfls-cell-calc">{num(data[`bv_${r.key}`]?.ulm) + num(data[`bv_${r.key}`]?.dm)}</td>
                </tr>
              ))}
              <tr className="dfls-row-total">
                <td>Total</td>
                <td>{bvTotal(data, "ulm") + bvTotal(data, "dm")}</td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <Accordion title="CB — Chawki Bed">
          <table className="dfls-mini-table">
            <thead><tr><th>Category</th><th>Nos</th></tr></thead>
            <tbody>
              {CB_ROWS.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="dfls-cell-calc">{num(data[r.key]?.ulm) + num(data[r.key]?.dm)}</td>
                </tr>
              ))}
              <tr className="dfls-row-total">
                <td>Total</td>
                <td>{cbTotal(data, "ulm") + cbTotal(data, "dm")}</td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <Accordion title="P1 — Priority 1">
          <table className="dfls-mini-table">
            <thead><tr><th>Type</th><th>Value</th></tr></thead>
            <tbody>
              <tr>
                <td>P1</td>
                <td className="dfls-cell-calc">{num(data.p1?.ulm) + num(data.p1?.dm)}</td>
              </tr>
            </tbody>
          </table>
        </Accordion>

        <div className="dfls-grand-total dfls-grand-um">
          <span>Grand Total</span>
          <span className="dfls-grand-value">{grandTotal(data, "ulm") + grandTotal(data, "dm")}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function DFLsDistributionPage({ user, onBack }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataEntryOpen, setDataEntryOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [filters, setFilters] = useState({
    adOffice:  "AD Salem",
    region:    "Erode",
    finYear:   "2024–25",
    month:     "May",
    scheme:    "DFLs Distribution",
  });

  const [data, setData] = useState(() => {
    const raw = buildInitial();
    return calcTotals(raw);
  });

  const handleDMChange = useCallback((field, value) => {
    setData(prev => {
      const updated = { ...prev, [field]: { ...prev[field], dm: value } };
      return calcTotals(updated);
    });
  }, []);

  const handleReset = () => setData(calcTotals(buildInitial()));
  const handleSaveDraft = () => alert("Draft saved successfully.");
  const handleSubmit = () => alert("Data submitted successfully.");

  const monthLabel = `${filters.month} ${filters.finYear.split("–")[0]}`;

  return (
    <div className="dfls-root">

      {/* ══════════════════════════════
          SIDEBAR
      ══════════════════════════════ */}
      {sidebarOpen && (
        <div className="dfls-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`dfls-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Brand */}
        <div className="dfls-brand">
          <div className="dfls-brand-logo">
            <Leaf size={20} />
          </div>
          <div className="dfls-brand-text">
            <span className="dfls-brand-title">SILK SAMAGRA</span>
            <span className="dfls-brand-sub">MIS PORTAL</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="dfls-nav">
          {NAV.map(item => (
            <div key={item.id}>
              <button
                className={`dfls-nav-item ${item.children ? "has-children" : ""} ${item.id === "data-entry" && dataEntryOpen ? "expanded" : ""}`}
                onClick={() => {
                  if (item.children) setDataEntryOpen(o => !o);
                  else if (item.id === "dashboard" && onBack) onBack();
                }}
              >
                <span className="dfls-nav-icon">{item.icon}</span>
                <span className="dfls-nav-label">{item.label}</span>
                {item.children && (
                  <ChevronDown size={13} className={`dfls-nav-arrow ${dataEntryOpen ? "open" : ""}`} />
                )}
              </button>

              {item.children && dataEntryOpen && (
                <div className="dfls-nav-children">
                  {item.children.map(child => (
                    <button
                      key={child.id}
                      className={`dfls-nav-child ${child.active ? "active" : ""}`}
                    >
                      <span className="dfls-child-dot" />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="dfls-nav-spacer" />

          <button className="dfls-nav-item dfls-nav-logout" onClick={onBack}>
            <span className="dfls-nav-icon"><LogOut size={16} /></span>
            <span className="dfls-nav-label">Logout</span>
          </button>
        </nav>

        {/* Decorative bottom cocoon illustration */}
        <div className="dfls-sidebar-deco">
          <div className="dfls-deco-leaves">
            <TreePine size={64} className="dfls-deco-icon" />
          </div>
          <div className="dfls-deco-text">Silk Samagra</div>
        </div>
      </aside>

      {/* ══════════════════════════════
          MAIN COLUMN
      ══════════════════════════════ */}
      <div className="dfls-main">

        {/* TOP HEADER */}
        <header className="dfls-topbar">
          <div className="dfls-topbar-left">
            <button className="dfls-hamburger" onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="dfls-topbar-title-wrap">
              <h1 className="dfls-topbar-title">DFLs Distribution</h1>
              <nav className="dfls-breadcrumb">
                <span className="dfls-bc-link">Dashboard</span>
                <ChevronRight size={12} />
                <span className="dfls-bc-link">Data Entry</span>
                <ChevronRight size={12} />
                <span className="dfls-bc-active">DFLs Distribution</span>
              </nav>
            </div>
          </div>

          <div className="dfls-topbar-right">
            {/* Month selector */}
            <div className="dfls-month-select">
              <select
                value={`${filters.month} ${filters.finYear.split("–")[0]}`}
                onChange={() => {}}
              >
                {MONTHS.map(m => (
                  <option key={m}>{m} {filters.finYear.split("–")[0]}</option>
                ))}
              </select>
              <ChevronDown size={13} className="dfls-select-arrow" />
            </div>

            {/* Bell */}
            <div className="dfls-bell-wrap">
              <button className="dfls-icon-btn">
                <Bell size={17} />
              </button>
              <span className="dfls-bell-badge">3</span>
            </div>

            {/* Profile */}
            <div className="dfls-profile-wrap">
              <button
                className="dfls-profile-card"
                onClick={() => setShowUserMenu(o => !o)}
              >
                <div className="dfls-avatar">AS</div>
                <div className="dfls-profile-info">
                  <span className="dfls-profile-name">{user?.name || "AD Salem"}</span>
                  <span className="dfls-profile-role">{user?.role || "AD Office User"}</span>
                </div>
                <ChevronDown size={13} className={`dfls-profile-arrow ${showUserMenu ? "open" : ""}`} />
              </button>
              {showUserMenu && (
                <div className="dfls-profile-dropdown">
                  <button className="dfls-dd-item"><Settings size={14} /> Settings</button>
                  <div className="dfls-dd-divider" />
                  <button className="dfls-dd-item dfls-dd-logout" onClick={onBack}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="dfls-content">

          {/* ── SECTION 1: Office & Period Details ── */}
          <div className="dfls-filter-card">
            <div className="dfls-filter-card-head">
              <div className="dfls-filter-card-title">
                <Layers size={15} />
                <span>Office &amp; Period Details</span>
              </div>
              <span className="dfls-unit-badge">Unit: Nos</span>
            </div>

            <div className="dfls-filter-row">
              <div className="dfls-filter-field">
                <label>AD Office</label>
                <div className="dfls-select-wrap">
                  <select value={filters.adOffice} onChange={e => setFilters(f => ({ ...f, adOffice: e.target.value }))}>
                    {AD_OFFICES.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>

              <div className="dfls-filter-field">
                <label>Region</label>
                <div className="dfls-select-wrap">
                  <select value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}>
                    {REGIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>

              <div className="dfls-filter-field">
                <label>Financial Year</label>
                <div className="dfls-select-wrap">
                  <select value={filters.finYear} onChange={e => setFilters(f => ({ ...f, finYear: e.target.value }))}>
                    {FIN_YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>

              <div className="dfls-filter-field">
                <label>Month</label>
                <div className="dfls-select-wrap">
                  <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}>
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>

              <div className="dfls-filter-field">
                <label>Scheme</label>
                <div className="dfls-select-wrap">
                  <select value={filters.scheme} onChange={e => setFilters(f => ({ ...f, scheme: e.target.value }))}>
                    {SCHEMES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>
            </div>

            {/* Carry forward info banner */}
            <div className="dfls-cf-banner">
              <Info size={15} className="dfls-cf-icon" />
              <span>
                <strong>ULM (Up to Last Month)</strong> values are automatically carried forward and cannot be edited.
              </span>
            </div>
          </div>

          {/* ── SECTION 2: 3-Column Entry Cards ── */}
          <div className="dfls-section-label">
            <FileText size={14} />
            Monthly Data Entry — <strong>{monthLabel}</strong>
          </div>

          <div className="dfls-cards-grid">
            <ULMCard data={data} />
            <DMCard  data={data} onChange={handleDMChange} />
            <UMCard  data={data} />
          </div>

          {/* ── Formula Note ── */}
          <div className="dfls-note-card">
            <Info size={15} />
            <div>
              <strong>Note:</strong> UM (Up to Month) values are auto calculated as: &nbsp;
              <code className="dfls-formula-code">UM = ULM + DM</code>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="dfls-action-bar">
            <div className="dfls-action-left" />
            <div className="dfls-action-right">
              <button className="dfls-btn dfls-btn-reset" onClick={handleReset}>
                <RotateCcw size={14} /> Reset
              </button>
              <button className="dfls-btn dfls-btn-draft" onClick={handleSaveDraft}>
                <Save size={14} /> Save Draft
              </button>
              <button className="dfls-btn dfls-btn-submit" onClick={handleSubmit}>
                <Send size={14} /> Submit
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
