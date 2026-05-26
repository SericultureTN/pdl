import { useState } from "react";
import {
  LayoutDashboard, LogOut, Bell, Menu, Leaf, Calendar,
  TrendingUp, Users, Activity, ChevronRight, ArrowUpRight,
  ClipboardList, Database, Sprout, BarChart2, Clock, CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlantationOverallPage      from "../components/mis/PlantationOverallPage.jsx";
import PlantationSchemePage       from "../components/mis/PlantationSchemePage.jsx";
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
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function MISPage({ user, onBack }) {
  const navigate     = useNavigate();
  const goBack       = onBack || (() => navigate("/"));
  const [activeView,   setActiveView]   = useState("dashboard");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [selectedYear, setSelectedYear] = useState("2025-26");

  /* Full-screen early returns */
  if (DATA_ENTRY_VIEWS.includes(activeView)) {
    const back = () => setActiveView("dashboard");
    if (activeView === "plantation-overall") return <PlantationOverallPage user={user} onBack={back} />;
    if (activeView === "plantation-2024")    return <PlantationSchemePage year="2024-25" user={user} onBack={back} />;
    if (activeView === "plantation-2025")    return <PlantationSchemePage year="2025-26" user={user} onBack={back} />;
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
          <MISDashboardOverview setActiveView={setActiveView} user={user} selectedYear={selectedYear} />
        </main>
      </div>
    </div>
  );
}

function MISDashboardOverview({ setActiveView, user, selectedYear }) {
  const stats = [
    { label:"Plantation Records", value:"3,842",    delta:"+124",   icon:Sprout,    grad:"linear-gradient(135deg,#0B5D3B,#1a8a58)" },
    { label:"DFLs Distributed",   value:"1,26,540", delta:"+8,200", icon:Activity,  grad:"linear-gradient(135deg,#1d4ed8,#3b82f6)" },
    { label:"Cocoon Production",   value:"48.6 MT",  delta:"+3.2MT", icon:TrendingUp,grad:"linear-gradient(135deg,#b45309,#f59e0b)" },
    { label:"Farmers Covered",     value:"9,214",    delta:"+312",   icon:Users,     grad:"linear-gradient(135deg,#7c3aed,#a78bfa)" },
  ];

  const modules = [
    { id:"plantation-overall", label:"Plantation Overall",        sub:"Monthly plantation status",        icon:Sprout,       color:"#0B5D3B", bg:"#f0fdf4" },
    { id:"plantation-2024",    label:"Plantation Scheme 2024-25", sub:"Scheme-wise entry for 2024-25",    icon:ClipboardList, color:"#1d4ed8", bg:"#eff6ff" },
    { id:"plantation-2025",    label:"Plantation Scheme 2025-26", sub:"Scheme-wise entry for 2025-26",    icon:ClipboardList, color:"#7c3aed", bg:"#f5f3ff" },
    { id:"dfls-distribution",  label:"DFLs Distribution",         sub:"Disease-free layings distributed", icon:BarChart2,     color:"#b45309", bg:"#fffbeb" },
    { id:"dfls-consumption",   label:"DFLs Consumption",          sub:"Consumption data entry",           icon:Database,     color:"#0e7490", bg:"#ecfeff" },
    { id:"cocoon-production",  label:"Cocoon Production",         sub:"Bivoltine & CB production",        icon:TrendingUp,   color:"#be123c", bg:"#fff1f2" },
  ];

  const recent = [
    { label:"Plantation Overall — April 2025",  status:"submitted" },
    { label:"DFLs Distribution — March 2025",   status:"pending"   },
    { label:"Cocoon Production — March 2025",   status:"submitted" },
    { label:"Plantation Scheme 2024-25 — Q4",   status:"draft"     },
  ];

  const statusStyle = s => s === "submitted"
    ? { background:"#dcfce7", color:"#16a34a" }
    : s === "pending"
    ? { background:"#fef9c3", color:"#ca8a04" }
    : { background:"#f1f5f9", color:"#64748b" };

  const statusDot = s => s === "submitted" ? "#22c55e" : s === "pending" ? "#f59e0b" : "#94a3b8";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* WELCOME BANNER */}
      <div style={{
        background:"linear-gradient(120deg,#0B5D3B 0%,#1a8a58 60%,#22c55e 100%)",
        borderRadius:18, padding:"26px 30px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 8px 28px rgba(11,93,59,0.20)", overflow:"hidden", position:"relative",
      }}>
        <div style={{ position:"absolute", right:-20, top:-20, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"absolute", right:70, bottom:-40, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ zIndex:1 }}>
          <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.72rem", marginBottom:5, letterSpacing:"0.6px", textTransform:"uppercase" }}>
            Silk Samagra · MIS Portal · {selectedYear}
          </p>
          <h2 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:800, margin:0, letterSpacing:"-0.2px" }}>
            Welcome back, {user?.name?.split(" ")[0] || "Officer"} 👋
          </h2>
          <p style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.8rem", marginTop:5, margin:"5px 0 0" }}>
            Tamil Nadu Sericulture Department — Monthly data reporting
          </p>
        </div>
        <div style={{ zIndex:1 }}>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 20px", backdropFilter:"blur(6px)", textAlign:"center" }}>
            <p style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.67rem", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Financial Year</p>
            <p style={{ color:"#fff", fontWeight:800, fontSize:"1.05rem", margin:0 }}>{selectedYear}</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{
              background:"#fff", borderRadius:16, padding:"18px 20px",
              boxShadow:"0 2px 12px rgba(0,0,0,0.055)",
              border:"1px solid #f1f5f9", position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute", top:-8, right:-8, width:60, height:60, borderRadius:"50%", background:"rgba(0,0,0,0.025)" }} />
              <div style={{
                width:40, height:40, borderRadius:11, background:s.grad,
                display:"flex", alignItems:"center", justifyContent:"center",
                marginBottom:12, boxShadow:"0 3px 10px rgba(0,0,0,0.12)",
              }}>
                <Icon size={18} color="#fff" />
              </div>
              <p style={{ fontSize:"0.68rem", color:"#94a3b8", fontWeight:600, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</p>
              <h3 style={{ fontSize:"1.35rem", fontWeight:800, color:"#1e293b", margin:0 }}>{s.value}</h3>
              <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:5 }}>
                <ArrowUpRight size={12} color="#16a34a" />
                <span style={{ fontSize:"0.68rem", color:"#16a34a", fontWeight:600 }}>{s.delta} this month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODULES + RECENT */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:18 }}>

        {/* MODULE GRID */}
        <div style={{ background:"#fff", borderRadius:18, padding:"22px", boxShadow:"0 2px 12px rgba(0,0,0,0.055)", border:"1px solid #f1f5f9" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <h4 style={{ margin:0, fontSize:"0.92rem", fontWeight:800, color:"#1e293b" }}>Data Entry Modules</h4>
              <p style={{ margin:"3px 0 0", fontSize:"0.7rem", color:"#94a3b8" }}>Click a module to enter monthly data</p>
            </div>
            <span style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"3px 10px", fontSize:"0.68rem", color:"#16a34a", fontWeight:700 }}>6 Active</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {modules.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setActiveView(m.id)}
                  style={{
                    display:"flex", alignItems:"center", gap:11, padding:"13px 14px",
                    borderRadius:13, background:m.bg, border:`1.5px solid ${m.color}20`,
                    cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 6px 18px ${m.color}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
                >
                  <div style={{ width:36, height:36, borderRadius:10, background:m.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 3px 8px ${m.color}40` }}>
                    <Icon size={16} color="#fff" />
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0, fontSize:"0.76rem", fontWeight:700, color:"#1e293b", lineHeight:1.3 }}>{m.label}</p>
                    <p style={{ margin:"2px 0 0", fontSize:"0.65rem", color:"#94a3b8", lineHeight:1.3 }}>{m.sub}</p>
                  </div>
                  <ChevronRight size={13} style={{ marginLeft:"auto", flexShrink:0, color:"#cbd5e1" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* RECENT ENTRIES */}
        <div style={{ background:"#fff", borderRadius:18, padding:"22px", boxShadow:"0 2px 12px rgba(0,0,0,0.055)", border:"1px solid #f1f5f9" }}>
          <div style={{ marginBottom:16 }}>
            <h4 style={{ margin:0, fontSize:"0.92rem", fontWeight:800, color:"#1e293b" }}>Recent Submissions</h4>
            <p style={{ margin:"3px 0 0", fontSize:"0.7rem", color:"#94a3b8" }}>Latest entries from your office</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {recent.map((r, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"11px 13px", borderRadius:11,
                background:"#f8fafc", border:"1px solid #f1f5f9",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:statusDot(r.status), flexShrink:0 }} />
                  <span style={{ fontSize:"0.76rem", color:"#334155", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.label}</span>
                </div>
                <span style={{
                  fontSize:"0.65rem", fontWeight:700, padding:"3px 8px",
                  borderRadius:20, flexShrink:0, marginLeft:6, ...statusStyle(r.status),
                }}>{r.status}</span>
              </div>
            ))}
          </div>

          {/* Bottom info strip */}
          <div style={{
            marginTop:16, padding:"12px 14px", borderRadius:12,
            background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",
            border:"1px solid #bbf7d0",
          }}>
            <p style={{ margin:0, fontSize:"0.7rem", color:"#15803d", fontWeight:600 }}>📋 Submission Deadline</p>
            <p style={{ margin:"3px 0 0", fontSize:"0.72rem", color:"#166534" }}>Monthly data must be submitted by the <strong>5th of every month</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
