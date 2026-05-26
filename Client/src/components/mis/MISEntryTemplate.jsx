import { useState, useCallback } from "react";
import {
  LayoutDashboard, ChevronRight, ChevronDown, ChevronUp, Bell,
  Lock, Calculator, FileEdit, Info, RotateCcw, Save, Send,
  Menu, X, LogOut, BarChart2, User, Leaf,
  FileSpreadsheet, Activity, Layers, Settings
} from "lucide-react";
import "./DFLsDistributionPage.css";

/* ─────────────────────────────────────────────────────────────
   SHARED CONSTANTS
───────────────────────────────────────────────────────────────*/
const AD_OFFICES = ["AD Salem","AD Erode","AD Talavady","AD Madhahalli","AD Coimbatore","AD Udumalaipettai","AD Coonoor"];
const REGIONS    = ["Erode","Dharmapuri","Vellore","Trichy","Madurai"];
const FIN_YEARS  = ["2024–25","2025–26","2023–24"];
const MONTHS     = ["April","May","June","July","August","September","October","November","December","January","February","March"];
const SCHEMES    = ["DFLs Distribution","DFLs Consumption","Cocoon Production","Plantation Overall"];

const DATA_ENTRY_CHILDREN = [
  { id: "plantation-overall",  label: "Plantation Overall" },
  { id: "scheme-2024",         label: "Plantation Scheme 2024-25" },
  { id: "scheme-2025",         label: "Plantation Scheme 2025-26" },
  { id: "dfls-distribution",   label: "DFLs Distribution" },
  { id: "dfls-consumption",    label: "DFLs Consumption" },
  { id: "cocoon-production",   label: "Cocoon Production" },
];

const num = (v) => parseFloat(v) || 0;

/* ─────────────────────────────────────────────────────────────
   SECTION BLOCK — collapsible header + children
───────────────────────────────────────────────────────────────*/
export function Section({ title, children }) {
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

/* ─────────────────────────────────────────────────────────────
   CARD COMPONENTS — ULM / DM / UM
   Each accepts:
     sections: [{ title, rows: [{ key, label }] }]
     unit: string label for column header
     data: { [key]: { ulm, dm, um } }
     onChange(key, val): DM card only
───────────────────────────────────────────────────────────────*/
function calcSectionTotal(data, keys, tier) {
  return keys.reduce((s, k) => s + num(data[k]?.[tier]), 0);
}
function calcGrandTotal(data, sections, tier) {
  return sections.reduce((s, sec) =>
    s + calcSectionTotal(data, sec.rows.map(r => r.key), tier), 0);
}

export function ULMCard({ sections, unit, data }) {
  return (
    <div className="dfls-entry-card dfls-card-ulm">
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
      {sections.map(sec => (
        <Section key={sec.title} title={sec.title}>
          <table className="dfls-tbl">
            <thead><tr><th>Category</th><th>{unit}</th></tr></thead>
            <tbody>
              {sec.rows.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="dfls-val-ro">{num(data[r.key]?.ulm)}</td>
                </tr>
              ))}
              <tr className="dfls-tbl-total">
                <td><strong>Total</strong></td>
                <td><strong>{calcSectionTotal(data, sec.rows.map(r=>r.key), "ulm")}</strong></td>
              </tr>
            </tbody>
          </table>
        </Section>
      ))}
      <div className="dfls-grand dfls-grand-ulm">
        <span>Grand Total</span>
        <strong className="dfls-grand-num">{calcGrandTotal(data, sections, "ulm")}</strong>
      </div>
    </div>
  );
}

export function DMCard({ sections, unit, data, onChange }) {
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
      {sections.map(sec => (
        <Section key={sec.title} title={sec.title}>
          <table className="dfls-tbl">
            <thead><tr><th>Category</th><th>{unit}</th></tr></thead>
            <tbody>
              {sec.rows.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td>
                    <input
                      type="number" min={0} placeholder="0"
                      className="dfls-inp"
                      value={data[r.key]?.dm ?? ""}
                      onChange={e => onChange(r.key, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
              <tr className="dfls-tbl-total dfls-tbl-total-dm">
                <td><strong>Total</strong></td>
                <td><strong className="dfls-ora">{calcSectionTotal(data, sec.rows.map(r=>r.key), "dm")}</strong></td>
              </tr>
            </tbody>
          </table>
        </Section>
      ))}
      <div className="dfls-grand dfls-grand-dm">
        <span className="dfls-ora">Grand Total</span>
        <strong className="dfls-grand-num dfls-ora">{calcGrandTotal(data, sections, "dm")}</strong>
      </div>
    </div>
  );
}

export function UMCard({ sections, unit, data }) {
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
      {sections.map(sec => (
        <Section key={sec.title} title={sec.title}>
          <table className="dfls-tbl">
            <thead><tr><th>Category</th><th>{unit}</th></tr></thead>
            <tbody>
              {sec.rows.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="dfls-val-calc">{num(data[r.key]?.ulm) + num(data[r.key]?.dm)}</td>
                </tr>
              ))}
              <tr className="dfls-tbl-total dfls-tbl-total-um">
                <td><strong>Total</strong></td>
                <td><strong className="dfls-grn">
                  {calcSectionTotal(data, sec.rows.map(r=>r.key), "ulm") +
                   calcSectionTotal(data, sec.rows.map(r=>r.key), "dm")}
                </strong></td>
              </tr>
            </tbody>
          </table>
        </Section>
      ))}
      <div className="dfls-grand dfls-grand-um">
        <span className="dfls-grn">Grand Total</span>
        <strong className="dfls-grand-num dfls-grn">
          {calcGrandTotal(data, sections, "ulm") + calcGrandTotal(data, sections, "dm")}
        </strong>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MISEntryTemplate — THE ONE REUSABLE PAGE
   Props:
     pageTitle   : string   — e.g. "DFLs Distribution"
     breadcrumb  : string   — e.g. "DFLs Distribution"
     unit        : string   — e.g. "Nos" | "Acre" | "Kg"
     sections    : [{ title, rows:[{key,label}] }]
     defaultData : { [key]: { ulm: number } }
     activeNavId : string   — child nav item to highlight
     user        : object
     onBack      : fn
───────────────────────────────────────────────────────────────*/
export default function MISEntryTemplate({
  pageTitle, breadcrumb, unit, sections, defaultData, activeNavId, user, onBack,
  renderFilters, onViewReport, storageKey
}) {
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [dataEntryOpen,  setDataEntryOpen]  = useState(true);
  const [showUserMenu,   setShowUserMenu]   = useState(false);

  const [filters, setFilters] = useState({
    adOffice: "AD Salem", region: "Erode",
    finYear: "2024–25", month: "May", scheme: pageTitle,
  });

  /* build initial data */
  function buildInitial() {
    const out = {};
    sections.forEach(sec =>
      sec.rows.forEach(r => {
        out[r.key] = { ulm: defaultData[r.key]?.ulm ?? 0, dm: "", um: 0 };
      })
    );
    return out;
  }
  function calcAll(raw) {
    const d = { ...raw };
    Object.keys(d).forEach(k => { d[k] = { ...d[k], um: num(d[k].ulm) + num(d[k].dm) }; });
    return d;
  }

  const [data, setData] = useState(() => calcAll(buildInitial()));

  const handleDMChange = useCallback((key, val) => {
    setData(prev => calcAll({ ...prev, [key]: { ...prev[key], dm: val } }));
  }, []);

  const handleReset  = () => setData(calcAll(buildInitial()));
  const handleDraft  = () => alert("Draft saved successfully.");
  const handleSubmit = () => {
    const key = storageKey || pageTitle;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const record = {
      id: Date.now(),
      submittedAt: new Date().toLocaleString(),
      filters: { ...filters },
      data: { ...data },
      unit,
      sections,
    };
    localStorage.setItem(key, JSON.stringify([record, ...existing]));
    alert("Data submitted successfully.");
    if (onViewReport) onViewReport();
  };

  const initials = (user?.name || "AS").split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

  return (
    <div className="dfls-root">

      {/* overlay */}
      {sidebarOpen && <div className="dfls-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`dfls-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="dfls-brand">
          <div className="dfls-brand-logo"><Leaf size={18} /></div>
          <div className="dfls-brand-text">
            <span className="dfls-brand-title">SILK SAMAGRA</span>
            <span className="dfls-brand-sub">MIS PORTAL</span>
          </div>
        </div>

        <nav className="dfls-nav">
          <button className="dfls-nav-item" onClick={onBack}>
            <span className="dfls-nav-icon"><LayoutDashboard size={16} /></span>
            <span className="dfls-nav-label">Dashboard</span>
          </button>

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
                  className={`dfls-nav-child ${child.id === activeNavId ? "active" : ""}`}
                >
                  {child.label}
                </button>
              ))}
            </div>
          )}

          <button className="dfls-nav-item">
            <span className="dfls-nav-icon"><BarChart2 size={16} /></span>
            <span className="dfls-nav-label">Reports</span>
            <ChevronRight size={13} className="dfls-nav-arrow" />
          </button>

          <button className="dfls-nav-item">
            <span className="dfls-nav-icon"><Activity size={16} /></span>
            <span className="dfls-nav-label">MIS Analytics</span>
          </button>

          <button className="dfls-nav-item">
            <span className="dfls-nav-icon"><User size={16} /></span>
            <span className="dfls-nav-label">Profile</span>
          </button>

          <div className="dfls-nav-spacer" />

          <button className="dfls-nav-item dfls-nav-logout" onClick={onBack}>
            <span className="dfls-nav-icon"><LogOut size={16} /></span>
            <span className="dfls-nav-label">Logout</span>
          </button>
        </nav>

        <div className="dfls-sidebar-deco" aria-hidden="true">
          <div className="dfls-deco-cocoon" />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="dfls-main">

        {/* TOPBAR */}
        <header className="dfls-topbar">
          <div className="dfls-topbar-left">
            <button className="dfls-hamburger" onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="dfls-topbar-title-wrap">
              <h1 className="dfls-topbar-title">{pageTitle}</h1>
              <nav className="dfls-breadcrumb">
                <span className="dfls-bc-link">Dashboard</span>
                <ChevronRight size={12} />
                <span className="dfls-bc-link">Data Entry</span>
                <ChevronRight size={12} />
                <span className="dfls-bc-active">{breadcrumb}</span>
              </nav>
            </div>
          </div>

          <div className="dfls-topbar-right">
            <div className="dfls-month-select">
              <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
              <ChevronDown size={13} className="dfls-select-arrow" />
            </div>

            <div className="dfls-bell-wrap">
              <button className="dfls-icon-btn"><Bell size={17} /></button>
              <span className="dfls-bell-badge">3</span>
            </div>

            <div className="dfls-profile-wrap">
              <button className="dfls-profile-card" onClick={() => setShowUserMenu(o => !o)}>
                <div className="dfls-avatar">{initials}</div>
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
                  <button className="dfls-dd-item dfls-dd-logout" onClick={onBack}><LogOut size={14} /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="dfls-content">

          {/* Filter card */}
          <div className="dfls-filter-card">
            <div className="dfls-filter-card-head">
              <div className="dfls-filter-card-title">
                <Layers size={15} />
                <span>Office &amp; Period Details</span>
              </div>
              <span className="dfls-unit-badge">Unit: {unit}</span>
            </div>

            {renderFilters
              ? renderFilters()
              : (
              <div className="dfls-filter-row">
                {[
                  { label:"AD Office",      key:"adOffice",  opts: AD_OFFICES },
                  { label:"Region",         key:"region",    opts: REGIONS    },
                  { label:"Financial Year", key:"finYear",   opts: FIN_YEARS  },
                  { label:"Month",          key:"month",     opts: MONTHS     },
                  { label:"Scheme",         key:"scheme",    opts: SCHEMES    },
                ].map(f => (
                  <div className="dfls-filter-field" key={f.key}>
                    <label>{f.label}</label>
                    <div className="dfls-select-wrap">
                      <select value={filters[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}>
                        {f.opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                      <ChevronDown size={13} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="dfls-cf-banner">
              <Info size={15} className="dfls-cf-icon" />
              <span>
                <strong>ULM (Up to Last Month)</strong> values are automatically carried forward and cannot be edited.
              </span>
            </div>
          </div>

          {/* 3 cards */}
          <div className="dfls-cards-grid">
            <ULMCard sections={sections} unit={unit} data={data} />
            <DMCard  sections={sections} unit={unit} data={data} onChange={handleDMChange} />
            <UMCard  sections={sections} unit={unit} data={data} />
          </div>

          {/* Bottom row */}
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
              {onViewReport && (
                <button className="dfls-btn" onClick={onViewReport}
                  style={{ background: "#f1f5f9", color: "#0B5D3B", border: "1.5px solid #0B5D3B", marginRight: 8 }}>
                  <FileSpreadsheet size={13} style={{marginRight:5}} />View Reports
                </button>
              )}
              <button className="dfls-btn dfls-btn-reset"  onClick={handleReset}>
                <RotateCcw size={13} style={{marginRight:5}} />Reset
              </button>
              <button className="dfls-btn dfls-btn-draft"  onClick={handleDraft}>
                <Save size={13} style={{marginRight:5}} />Save Draft
              </button>
              <button className="dfls-btn dfls-btn-submit" onClick={handleSubmit}>
                <Send size={13} style={{marginRight:5}} />Submit
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
