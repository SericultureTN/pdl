import { useState } from "react";
import {
  LayoutDashboard, BarChart3, LogOut,
  ChevronRight, Bell, Menu, Leaf, TrendingUp, Activity,
  Calendar, CheckCircle2, Clock, AlertCircle, Database,
  ClipboardList, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlantationOverallPage      from "../components/mis/PlantationOverallPage.jsx";
import PlantationSchemePage       from "../components/mis/PlantationSchemePage.jsx";
import PlantationSchemeReportPage from "../components/mis/PlantationSchemeReportPage.jsx";
import DFLsDistributionPage       from "../components/mis/DFLsDistributionPage.jsx";
import DFLsConsumptionPage        from "../components/mis/DFLsConsumptionPage.jsx";
import CocoonProductionPage       from "../components/mis/CocoonProductionPage.jsx";
import "./mispage.css";

const S = {
  root:    { display:"flex", minHeight:"100vh", fontFamily:"Inter,sans-serif", background:"#f4f6f8" },
  sidebar: { width:220, flexShrink:0, background:"linear-gradient(180deg,#0B5D3B 0%,#063d26 100%)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh" },
  brand:   { display:"flex", alignItems:"center", gap:10, padding:"18px 14px 14px", borderBottom:"1px solid rgba(255,255,255,0.1)" },
  logoBox: { width:34, height:34, borderRadius:8, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  main:    { flex:1, display:"flex", flexDirection:"column", minWidth:0 },
  header:  { height:54, background:"#fff", borderBottom:"1px solid #e0e7ef", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", position:"sticky", top:0, zIndex:40, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" },
  content: { flex:1, padding:"20px 24px", overflowY:"auto" },
};

const FINANCIAL_YEARS = ["2025-26", "2024-25", "2023-24", "2022-23"];

const DATA_ENTRY_VIEWS = [
  "plantation-overall", "plantation-2024", "plantation-2025",
  "dfls-distribution", "dfls-consumption", "cocoon-production",
];

const SIDEBAR_NAV = [
  { id: "dashboard",                label: "Dashboard", icon: LayoutDashboard },
  { id: "plantation-scheme-report", label: "Reports",   icon: BarChart3 },
];

export default function MISPage({ user, onBack }) {
  const navigate     = useNavigate();
  const goBack       = onBack || (() => navigate("/"));
  const [activeView,   setActiveView]   = useState("dashboard");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [selectedYear, setSelectedYear] = useState("2025-26");

  /* Full-screen early returns */
  if (activeView === "plantation-scheme-report") {
    return (
      <PlantationSchemeReportPage
        user={user}
        onBack={() => setActiveView("dashboard")}
        onDataEntry={id => setActiveView(id)}
      />
    );
  }

  if (DATA_ENTRY_VIEWS.includes(activeView)) {
    const back = () => setActiveView("dashboard");
    if (activeView === "plantation-overall") return <PlantationOverallPage user={user} onBack={back} />;
    if (activeView === "plantation-2024")    return <PlantationSchemePage year="2024-25" user={user} onBack={back}
      storageKey="Plantation Scheme 2024-25" onViewReport={() => setActiveView("plantation-scheme-report")} />;
    if (activeView === "plantation-2025")    return <PlantationSchemePage year="2025-26" user={user} onBack={back}
      storageKey="Plantation Scheme 2025-26" onViewReport={() => setActiveView("plantation-scheme-report")} />;
    if (activeView === "dfls-distribution")  return <DFLsDistributionPage  user={user} onBack={back} />;
    if (activeView === "dfls-consumption")   return <DFLsConsumptionPage   user={user} onBack={back} />;
    if (activeView === "cocoon-production")  return <CocoonProductionPage   user={user} onBack={back} />;
  }

  return (
    <div style={S.root}>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <aside style={S.sidebar}>
          <div style={S.brand}>
            <div style={S.logoBox}><Leaf size={18} color="#fff" /></div>
            <div style={{ display:"flex", flexDirection:"column" }}>
              <span style={{ fontSize:"0.78rem", fontWeight:800, color:"#fff", letterSpacing:"0.4px" }}>SILK SAMAGRA</span>
              <span style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.45)", marginTop:1 }}>MIS PORTAL</span>
            </div>
          </div>

          <nav style={{ flex:1, padding:"8px 0", display:"flex", flexDirection:"column" }}>
            {SIDEBAR_NAV.map(({ id, label, icon: Icon }) => {
              const active = activeView === id;
              return (
                <button key={id} onClick={() => setActiveView(id)} style={{
                  display:"flex", alignItems:"center", gap:9, width:"100%",
                  padding:"10px 16px",
                  background: active ? "rgba(255,255,255,0.18)" : "none",
                  border:"none",
                  borderLeft: active ? "3px solid #fff" : "3px solid transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.65)",
                  fontSize:"0.82rem", fontWeight: active ? 600 : 400,
                  cursor:"pointer", textAlign:"left",
                }}>
                  <Icon size={16} style={{ flexShrink:0 }} />
                  <span>{label}</span>
                </button>
              );
            })}

            <div style={{ flex:1 }} />

            <button onClick={goBack} style={{
              display:"flex", alignItems:"center", gap:9, width:"100%",
              padding:"12px 16px", background:"none", border:"none",
              borderTop:"1px solid rgba(255,255,255,0.1)",
              color:"rgba(255,255,255,0.5)", fontSize:"0.82rem",
              cursor:"pointer", textAlign:"left",
            }}>
              <LogOut size={16} />
              <span>Back to Portal</span>
            </button>
          </nav>
        </aside>
      )}

      {/* MAIN */}
      <div style={S.main}>
        <header style={S.header}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{
              background:"none", border:"none", cursor:"pointer",
              display:"flex", padding:6, borderRadius:6, color:"#4b5e6e",
            }}>
              <Menu size={20} />
            </button>
            <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#0B5D3B" }}>
              {activeView === "dashboard" ? "Dashboard Overview" : "Reports"}
            </span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"#f0fbf6", border:"1px solid #d1fae5", borderRadius:7, padding:"5px 10px" }}>
              <Calendar size={14} color="#0B5D3B" />
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                style={{ border:"none", background:"none", fontSize:"0.78rem", color:"#0B5D3B", fontWeight:600, outline:"none", cursor:"pointer" }}>
                {FINANCIAL_YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ position:"relative" }}>
              <button style={{ width:34, height:34, borderRadius:"50%", border:"1px solid #e0e7ef", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <Bell size={16} color="#4b5e6e" />
              </button>
              <span style={{ position:"absolute", top:-3, right:-3, width:14, height:14, background:"#ef4444", borderRadius:"50%", border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.5rem", color:"#fff", fontWeight:700 }}>3</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f0fbf6", border:"1px solid #d1fae5", borderRadius:8, padding:"5px 10px 5px 5px" }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"#0B5D3B", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:800 }}>
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", lineHeight:1.2 }}>
                <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#1a2533" }}>{user?.name || "User"}</span>
                <span style={{ fontSize:"0.63rem", color:"#8fa3b1" }}>{user?.role || "Officer"}</span>
              </div>
            </div>
          </div>
        </header>

        <main style={S.content}>
          <MISDashboardOverview setActiveView={setActiveView} />
        </main>
      </div>
    </div>
  );
}

/* ── Dashboard overview content ── */
function MISDashboardOverview({ setActiveView }) {
  const stats = [
    { label:"Plantation Records", value:"3,842",    change:"+124 this month",    icon:Leaf,       color:"green"  },
    { label:"DFLs Distributed",   value:"1,26,540", change:"+8,200 this month",  icon:Activity,   color:"blue"   },
    { label:"Cocoon Production",   value:"48.6 MT",  change:"+3.2 MT this month", icon:TrendingUp, color:"orange" },
    { label:"Farmers Covered",     value:"9,214",    change:"+312 this month",    icon:Users,      color:"purple" },
  ];

  const quickLinks = [
    { id:"plantation-overall", label:"Plantation Overall",        icon:Leaf          },
    { id:"plantation-2024",    label:"Plantation Scheme 2024-25", icon:ClipboardList },
    { id:"plantation-2025",    label:"Plantation Scheme 2025-26", icon:ClipboardList },
    { id:"dfls-distribution",  label:"DFLs Distribution",         icon:Activity      },
    { id:"dfls-consumption",   label:"DFLs Consumption",          icon:Database      },
    { id:"cocoon-production",  label:"Cocoon Production",         icon:TrendingUp    },
  ];

  const recent = [
    { label:"Plantation Overall - April 2025",  status:"submitted", time:"2 hrs ago"  },
    { label:"DFLs Distribution - March 2025",   status:"pending",   time:"5 hrs ago"  },
    { label:"Cocoon Production - March 2025",   status:"submitted", time:"Yesterday"  },
    { label:"Plantation Scheme 2024-25 - Q4",   status:"draft",     time:"2 days ago" },
  ];

  const statusIcon = s =>
    s === "submitted" ? <CheckCircle2 size={13} className="gov-status-submitted" /> :
    s === "pending"   ? <Clock        size={13} className="gov-status-pending"   /> :
                        <AlertCircle  size={13} className="gov-status-draft"     />;

  return (
    <div className="gov-overview">
      <div className="gov-page-title">
        <h2>Dashboard Overview</h2>
        <p>Silk Samagra MIS Portal — Monthly sericulture data reporting</p>
      </div>

      <div className="gov-stats-grid">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`gov-stat-card gov-stat-${s.color}`}>
              <div className="gov-stat-icon"><Icon size={22} /></div>
              <div className="gov-stat-body">
                <p className="gov-stat-label">{s.label}</p>
                <h3 className="gov-stat-value">{s.value}</h3>
                <span className="gov-stat-change">{s.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gov-overview-grid">
        <div className="gov-card">
          <div className="gov-card-head"><h4>Data Entry</h4></div>
          <div className="gov-quick-links">
            {quickLinks.map(q => {
              const Icon = q.icon;
              return (
                <button key={q.id} className="gov-quick-btn" onClick={() => setActiveView(q.id)}>
                  <Icon size={16} />
                  <span>{q.label}</span>
                  <ChevronRight size={14} className="gov-ql-arrow" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="gov-card">
          <div className="gov-card-head"><h4>Recent Entries</h4></div>
          <div className="gov-recent-list">
            {recent.map((e, i) => (
              <div key={i} className="gov-recent-item">
                <div className="gov-recent-info">
                  <p>{e.label}</p>
                  <span>{e.time}</span>
                </div>
                <span className={`gov-status-badge gov-status-${e.status}`}>
                  {statusIcon(e.status)} {e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
