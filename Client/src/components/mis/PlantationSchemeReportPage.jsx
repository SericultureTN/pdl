import { useState, useEffect } from "react";
import {
  LayoutDashboard, ChevronRight, ChevronDown, Bell,
  FileEdit, LogOut, BarChart2, User, Leaf,
  Activity, Menu, X, FileSpreadsheet, Trash2,
  FileText, Search, Filter
} from "lucide-react";
import "./DFLsDistributionPage.css";

const DATA_ENTRY_CHILDREN = [
  { id: "plantation-overall", label: "Plantation Overall" },
  { id: "scheme-2024",        label: "Plantation Scheme 2024-25" },
  { id: "scheme-2025",        label: "Plantation Scheme 2025-26" },
  { id: "dfls-distribution",  label: "DFLs Distribution" },
  { id: "dfls-consumption",   label: "DFLs Consumption" },
  { id: "cocoon-production",  label: "Cocoon Production" },
];

const STORAGE_KEYS = {
  "2024-25": "Plantation Scheme 2024-25",
  "2025-26": "Plantation Scheme 2025-26",
};

function loadRecords(year) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS[year]) || "[]");
  } catch {
    return [];
  }
}

function deleteRecord(year, id) {
  const key = STORAGE_KEYS[year];
  const updated = loadRecords(year).filter(r => r.id !== id);
  localStorage.setItem(key, JSON.stringify(updated));
}

export default function PlantationSchemeReportPage({ user, onBack, onDataEntry }) {
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [dataEntryOpen, setDataEntryOpen] = useState(false);
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [activeYear,    setActiveYear]    = useState("2024-25");
  const [records,       setRecords]       = useState([]);
  const [search,        setSearch]        = useState("");
  const [expanded,      setExpanded]      = useState(null);

  useEffect(() => {
    setRecords(loadRecords(activeYear));
    setExpanded(null);
  }, [activeYear]);

  function handleDelete(id) {
    if (!window.confirm("Delete this record?")) return;
    deleteRecord(activeYear, id);
    setRecords(loadRecords(activeYear));
  }

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return (
      r.filters?.adOffice?.toLowerCase().includes(q) ||
      r.filters?.month?.toLowerCase().includes(q) ||
      r.filters?.finYear?.toLowerCase().includes(q) ||
      r.submittedAt?.toLowerCase().includes(q)
    );
  });

  const initials = (user?.name || "AS").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="dfls-root">
      {sidebarOpen && <div className="dfls-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
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
          <button className={`dfls-nav-item ${dataEntryOpen ? "expanded" : ""}`}
            onClick={() => setDataEntryOpen(o => !o)}>
            <span className="dfls-nav-icon"><FileEdit size={16} /></span>
            <span className="dfls-nav-label">Data Entry</span>
            <ChevronDown size={13} className={`dfls-nav-arrow ${dataEntryOpen ? "open" : ""}`} />
          </button>
          {dataEntryOpen && (
            <div className="dfls-nav-children">
              {DATA_ENTRY_CHILDREN.map(child => (
                <button key={child.id} className="dfls-nav-child"
                  onClick={() => onDataEntry && onDataEntry(child.id)}>
                  {child.label}
                </button>
              ))}
            </div>
          )}
          <button className="dfls-nav-item dfls-nav-item--active">
            <span className="dfls-nav-icon"><BarChart2 size={16} /></span>
            <span className="dfls-nav-label">Reports</span>
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
        <div className="dfls-sidebar-deco" aria-hidden="true" />
      </aside>

      {/* MAIN */}
      <div className="dfls-main">

        {/* TOPBAR */}
        <header className="dfls-topbar">
          <div className="dfls-topbar-left">
            <button className="dfls-hamburger" onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="dfls-topbar-title-wrap">
              <h1 className="dfls-topbar-title">Plantation Scheme Reports</h1>
              <nav className="dfls-breadcrumb">
                <span className="dfls-bc-link">Dashboard</span>
                <ChevronRight size={12} />
                <span className="dfls-bc-link">Reports</span>
                <ChevronRight size={12} />
                <span className="dfls-bc-active">Plantation Scheme</span>
              </nav>
            </div>
          </div>
          <div className="dfls-topbar-right">
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
                  <button className="dfls-dd-item dfls-dd-logout" onClick={onBack}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="dfls-content">

          {/* YEAR TABS + CONTROLS */}
          <div className="dfls-filter-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>

              {/* Year tab switcher */}
              <div style={{ display: "flex", gap: 6 }}>
                {["2024-25", "2025-26"].map(y => (
                  <button key={y} onClick={() => setActiveYear(y)}
                    style={{
                      padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                      fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.3px",
                      background: activeYear === y ? "#0B5D3B" : "#f1f5f9",
                      color: activeYear === y ? "#fff" : "#475569",
                      transition: "all 0.15s",
                    }}>
                    Plantation Scheme {y}
                  </button>
                ))}
              </div>

              {/* Search + Data Entry button */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    placeholder="Search by office, month..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{
                      paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                      border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: "0.82rem",
                      outline: "none", width: 220, color: "#334155",
                    }}
                  />
                </div>
                {onDataEntry && (
                  <button onClick={() => onDataEntry(activeYear === "2024-25" ? "plantation-2024" : "plantation-2025")}
                    className="dfls-btn dfls-btn-submit" style={{ whiteSpace: "nowrap" }}>
                    <FileEdit size={13} style={{ marginRight: 5 }} />New Entry
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RECORDS */}
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "60px 20px",
              background: "#fff", borderRadius: 16, border: "1.5px dashed #e2e8f0",
            }}>
              <FileText size={48} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
              <p style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.95rem" }}>
                No submissions found for Plantation Scheme {activeYear}
              </p>
              <p style={{ color: "#cbd5e1", fontSize: "0.82rem", marginTop: 4 }}>
                Submit data from the Data Entry form to see records here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((rec, idx) => (
                <div key={rec.id} style={{
                  background: "#fff", borderRadius: 14,
                  border: "1.5px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}>
                  {/* Record header */}
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 20px", cursor: "pointer",
                      background: expanded === rec.id ? "#f8fafc" : "#fff",
                      borderBottom: expanded === rec.id ? "1.5px solid #e2e8f0" : "none",
                    }}
                    onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg,#0B5D3B,#1a8a58)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FileSpreadsheet size={16} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b" }}>
                          {rec.filters?.adOffice || "—"} &nbsp;|&nbsp; {rec.filters?.month} {rec.filters?.finYear}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                          Submitted: {rec.submittedAt} &nbsp;·&nbsp; Record #{idx + 1}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(rec.id); }}
                        style={{
                          background: "#fef2f2", border: "none", borderRadius: 7, padding: "6px 10px",
                          cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", gap: 4,
                          fontSize: "0.76rem", fontWeight: 600,
                        }}>
                        <Trash2 size={13} /> Delete
                      </button>
                      <ChevronDown size={16} style={{
                        color: "#94a3b8",
                        transform: expanded === rec.id ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded === rec.id && (
                    <div style={{ padding: "16px 20px" }}>

                      {/* Filter summary */}
                      <div style={{
                        display: "flex", gap: 12, flexWrap: "wrap",
                        background: "#f8fafc", borderRadius: 10, padding: "10px 14px",
                        marginBottom: 16,
                      }}>
                        {[
                          ["AD Office",       rec.filters?.adOffice],
                          ["Region",          rec.filters?.region],
                          ["Financial Year",  rec.filters?.finYear],
                          ["Month",           rec.filters?.month],
                          ["Unit",            rec.unit],
                        ].map(([lbl, val]) => val && (
                          <div key={lbl} style={{ fontSize: "0.78rem" }}>
                            <span style={{ color: "#94a3b8", marginRight: 4 }}>{lbl}:</span>
                            <span style={{ fontWeight: 700, color: "#334155" }}>{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Data table */}
                      <div style={{ overflowX: "auto" }}>
                        <table style={{
                          width: "100%", borderCollapse: "collapse",
                          fontSize: "0.8rem", color: "#334155",
                        }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th style={{ padding: "9px 12px", textAlign: "left", borderRadius: "8px 0 0 0", fontWeight: 700 }}>Section</th>
                              <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700 }}>Row</th>
                              <th style={{ padding: "9px 12px", textAlign: "right", color: "#64748b", fontWeight: 700 }}>ULM</th>
                              <th style={{ padding: "9px 12px", textAlign: "right", color: "#E98A15", fontWeight: 700 }}>DM</th>
                              <th style={{ padding: "9px 12px", textAlign: "right", color: "#0B5D3B", fontWeight: 700, borderRadius: "0 8px 0 0" }}>UM</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rec.sections?.flatMap(sec =>
                              sec.rows.map((row, ri) => (
                                <tr key={row.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ padding: "8px 12px", fontWeight: ri === 0 ? 700 : 400, color: ri === 0 ? "#0B5D3B" : "#64748b" }}>
                                    {ri === 0 ? sec.title : ""}
                                  </td>
                                  <td style={{ padding: "8px 12px" }}>{row.label}</td>
                                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>
                                    {rec.data?.[row.key]?.ulm ?? "—"}
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#E98A15", fontWeight: 600 }}>
                                    {rec.data?.[row.key]?.dm || "0"}
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#0B5D3B", fontWeight: 700 }}>
                                    {rec.data?.[row.key]?.um ?? "—"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
