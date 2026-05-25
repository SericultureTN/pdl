import { useState, useCallback } from "react";
import {
  LayoutDashboard, ChevronRight, ChevronDown, ChevronUp, Bell,
  Lock, Calculator, FileEdit, Info, RotateCcw, Save, Send,
  Menu, X, LogOut, BarChart2, User, Leaf,
  FileSpreadsheet, Activity
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
const DATA_ENTRY_CHILDREN = [
  { id: "plantation-overall",  label: "Plantation Overall" },
  { id: "scheme-2024",         label: "Plantation Scheme 2024-25" },
  { id: "scheme-2025",         label: "Plantation Scheme 2025-26" },
  { id: "distribution",        label: "Distribution" },
  { id: "dfls-distribution",   label: "DFLs Distribution", active: true },
  { id: "dfls-consumption",    label: "DFLs Consumption" },
  { id: "cocoon-production",   label: "Cocoon Production" },
];

/* ══════════════════════════════════════════════════════════════
   INITIAL STATE BUILDER
══════════════════════════════════════════════════════════════ */
function buildInitial() {
  return {
    bv_govt:   { ulm: 120, dm: "", um: 0 },
    bv_nsso:   { ulm: 200, dm: "", um: 0 },
    bv_tnpvt:  { ulm: 150, dm: "", um: 0 },
    bv_other:  { ulm: 40,  dm: "", um: 0 },
    cb_other:  { ulm: 80,  dm: "", um: 0 },
    cb_nsso:   { ulm: 40,  dm: "", um: 0 },
    p1:        { ulm: 220, dm: "", um: 0 },
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
   SECTION BLOCK — collapsible section inside a card
══════════════════════════════════════════════════════════════ */
function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="dfls-section">
      <button className="dfls-section-hd" onClick={() => setOpen(o => !o)}>
        <span className="dfls-section-title">{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ULM CARD
══════════════════════════════════════════════════════════════ */
function ULMCard({ data }) {
  return (
    <div className="dfls-entry-card dfls-card-ulm">
      {/* Header */}
      <div className="dfls-card-hd dfls-card-hd-ulm">
        <div className="dfls-card-hd-left">
          <div className="dfls-card-hd-icon"><FileSpreadsheet size={16} /></div>
          <div>
            <div className="dfls-card-hd-title">ULM (Up to Last Month)</div>
            <div className="dfls-card-hd-sub">Read Only</div>
          </div>
        </div>
        <Lock size={15} className="dfls-card-hd-lock" />
      </div>

      {/* BV */}
      <Section title="BV">
        <table className="dfls-tbl">
          <thead><tr><th>Category</th><th>Nos</th></tr></thead>
          <tbody>
            {BV_ROWS.map(r => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="dfls-val-ro">{num(data[`bv_${r.key}`]?.ulm)}</td>
              </tr>
            ))}
            <tr className="dfls-tbl-total">
              <td><strong>Total</strong></td>
              <td><strong>{bvTotal(data, "ulm")}</strong></td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* CB */}
      <Section title="CB">
        <table className="dfls-tbl">
          <thead><tr><th>Category</th><th>Nos</th></tr></thead>
          <tbody>
            {CB_ROWS.map(r => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="dfls-val-ro">{num(data[r.key]?.ulm)}</td>
              </tr>
            ))}
            <tr className="dfls-tbl-total">
              <td><strong>Total</strong></td>
              <td><strong>{cbTotal(data, "ulm")}</strong></td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* P1 */}
      <Section title="P1">
        <table className="dfls-tbl">
          <thead><tr><th>Value</th><th>Nos</th></tr></thead>
          <tbody>
            <tr>
              <td>Value</td>
              <td className="dfls-val-ro">{num(data.p1?.ulm)}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Grand total */}
      <div className="dfls-grand dfls-grand-ulm">
        <span>Grand Total</span>
        <strong className="dfls-grand-num">{grandTotal(data, "ulm")}</strong>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DM CARD
══════════════════════════════════════════════════════════════ */
function DMCard({ data, onChange }) {
  return (
    <div className="dfls-entry-card dfls-card-dm">
      <div className="dfls-card-hd dfls-card-hd-dm">
        <div className="dfls-card-hd-left">
          <div className="dfls-card-hd-icon"><FileEdit size={16} /></div>
          <div>
            <div className="dfls-card-hd-title dfls-dm-title">DM (During Month)</div>
            <div className="dfls-card-hd-sub">Enter Current Month Data</div>
          </div>
        </div>
        <FileEdit size={15} className="dfls-card-hd-pen" />
      </div>

      {/* BV */}
      <Section title="BV">
        <table className="dfls-tbl">
          <thead><tr><th>Category</th><th>Nos</th></tr></thead>
          <tbody>
            {BV_ROWS.map(r => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>
                  <input
                    type="number" min={0} placeholder="0"
                    className="dfls-inp"
                    value={data[`bv_${r.key}`]?.dm}
                    onChange={e => onChange(`bv_${r.key}`, e.target.value)}
                  />
                </td>
              </tr>
            ))}
            <tr className="dfls-tbl-total dfls-tbl-total-dm">
              <td><strong>Total</strong></td>
              <td><strong className="dfls-ora">{bvTotal(data, "dm")}</strong></td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* CB */}
      <Section title="CB">
        <table className="dfls-tbl">
          <thead><tr><th>Category</th><th>Nos</th></tr></thead>
          <tbody>
            {CB_ROWS.map(r => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>
                  <input
                    type="number" min={0} placeholder="0"
                    className="dfls-inp"
                    value={data[r.key]?.dm}
                    onChange={e => onChange(r.key, e.target.value)}
                  />
                </td>
              </tr>
            ))}
            <tr className="dfls-tbl-total dfls-tbl-total-dm">
              <td><strong>Total</strong></td>
              <td><strong className="dfls-ora">{cbTotal(data, "dm")}</strong></td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* P1 */}
      <Section title="P1">
        <table className="dfls-tbl">
          <thead><tr><th>Value</th><th>Nos</th></tr></thead>
          <tbody>
            <tr>
              <td>Value</td>
              <td>
                <input
                  type="number" min={0} placeholder="0"
                  className="dfls-inp"
                  value={data.p1?.dm}
                  onChange={e => onChange("p1", e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <div className="dfls-grand dfls-grand-dm">
        <span className="dfls-ora">Grand Total</span>
        <strong className="dfls-grand-num dfls-ora">{grandTotal(data, "dm")}</strong>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   UM CARD
══════════════════════════════════════════════════════════════ */
function UMCard({ data }) {
  return (
    <div className="dfls-entry-card dfls-card-um">
      <div className="dfls-card-hd dfls-card-hd-um">
        <div className="dfls-card-hd-left">
          <div className="dfls-card-hd-icon"><FileSpreadsheet size={16} /></div>
          <div>
            <div className="dfls-card-hd-title dfls-um-title">UM (Up to Month)</div>
            <div className="dfls-card-hd-sub">Auto Calculated</div>
          </div>
        </div>
        <Calculator size={15} className="dfls-card-hd-calc" />
      </div>

      {/* BV */}
      <Section title="BV">
        <table className="dfls-tbl">
          <thead><tr><th>Category</th><th>Nos</th></tr></thead>
          <tbody>
            {BV_ROWS.map(r => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="dfls-val-calc">{num(data[`bv_${r.key}`]?.ulm) + num(data[`bv_${r.key}`]?.dm)}</td>
              </tr>
            ))}
            <tr className="dfls-tbl-total dfls-tbl-total-um">
              <td><strong>Total</strong></td>
              <td><strong className="dfls-grn">{bvTotal(data, "ulm") + bvTotal(data, "dm")}</strong></td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* CB */}
      <Section title="CB">
        <table className="dfls-tbl">
          <thead><tr><th>Category</th><th>Nos</th></tr></thead>
          <tbody>
            {CB_ROWS.map(r => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="dfls-val-calc">{num(data[r.key]?.ulm) + num(data[r.key]?.dm)}</td>
              </tr>
            ))}
            <tr className="dfls-tbl-total dfls-tbl-total-um">
              <td><strong>Total</strong></td>
              <td><strong className="dfls-grn">{cbTotal(data, "ulm") + cbTotal(data, "dm")}</strong></td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* P1 */}
      <Section title="P1">
        <table className="dfls-tbl">
          <thead><tr><th>Value</th><th>Nos</th></tr></thead>
          <tbody>
            <tr>
              <td>Value</td>
              <td className="dfls-val-calc">{num(data.p1?.ulm) + num(data.p1?.dm)}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <div className="dfls-grand dfls-grand-um">
        <span className="dfls-grn">Grand Total</span>
        <strong className="dfls-grand-num dfls-grn">{grandTotal(data, "ulm") + grandTotal(data, "dm")}</strong>
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
            <Leaf size={18} />
          </div>
          <div className="dfls-brand-text">
            <span className="dfls-brand-title">SILK SAMAGRA</span>
            <span className="dfls-brand-sub">MIS PORTAL</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="dfls-nav">

          {/* Dashboard */}
          <button className="dfls-nav-item" onClick={onBack}>
            <span className="dfls-nav-icon"><LayoutDashboard size={16} /></span>
            <span className="dfls-nav-label">Dashboard</span>
          </button>

          {/* Data Entry (always expanded) */}
          <button
            className={`dfls-nav-item ${dataEntryOpen ? "expanded" : ""}`}
            onClick={() => setDataEntryOpen(o => !o)}
          >
            <span className="dfls-nav-icon"><FileEdit size={16} /></span>
            <span className="dfls-nav-label">Data Entry</span>
            <ChevronDown size={13} className={`dfls-nav-arrow ${dataEntryOpen ? "open" : ""}`} />
          </button>

          {dataEntryOpen && (
            <div className="dfls-nav-children">
              {DATA_ENTRY_CHILDREN.map(child => (
                <button
                  key={child.id}
                  className={`dfls-nav-child ${child.active ? "active" : ""}`}
                >
                  {child.label}
                </button>
              ))}
            </div>
          )}

          {/* Reports */}
          <button className="dfls-nav-item">
            <span className="dfls-nav-icon"><BarChart2 size={16} /></span>
            <span className="dfls-nav-label">Reports</span>
            <ChevronRight size={13} className="dfls-nav-arrow" />
          </button>

          {/* MIS Analytics */}
          <button className="dfls-nav-item">
            <span className="dfls-nav-icon"><Activity size={16} /></span>
            <span className="dfls-nav-label">MIS Analytics</span>
          </button>

          {/* Profile */}
          <button className="dfls-nav-item">
            <span className="dfls-nav-icon"><User size={16} /></span>
            <span className="dfls-nav-label">Profile</span>
          </button>

          <div className="dfls-nav-spacer" />

          {/* Logout */}
          <button className="dfls-nav-item dfls-nav-logout" onClick={onBack}>
            <span className="dfls-nav-icon"><LogOut size={16} /></span>
            <span className="dfls-nav-label">Logout</span>
          </button>
        </nav>

        {/* Decorative cocoon image at bottom */}
        <div className="dfls-sidebar-deco" aria-hidden="true">
          <div className="dfls-deco-cocoon" />
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

          {/* ── 3-Column Entry Cards ── */}
          <div className="dfls-cards-grid">
            <ULMCard data={data} />
            <DMCard  data={data} onChange={handleDMChange} />
            <UMCard  data={data} />
          </div>

          {/* ── Bottom row: note left, buttons right ── */}
          <div className="dfls-bottom-row">
            <div className="dfls-note-card">
              <Info size={15} className="dfls-note-icon" />
              <div>
                <span className="dfls-note-bold">Note: </span>
                <span className="dfls-note-link">UM (Up to Month) values are auto calculated as:</span>
                <br />
                <span className="dfls-note-formula">UM = ULM + DM</span>
              </div>
            </div>
            <div className="dfls-action-btns">
              <button className="dfls-btn dfls-btn-reset" onClick={handleReset}>Reset</button>
              <button className="dfls-btn dfls-btn-draft" onClick={handleSaveDraft}>Save Draft</button>
              <button className="dfls-btn dfls-btn-submit" onClick={handleSubmit}>Submit</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
