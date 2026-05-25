import { useState } from "react";
import {
  LayoutDashboard, Database, ClipboardList, BarChart3, FileText,
  Download, Users, Settings, LogOut, ChevronDown, ChevronRight,
  Bell, Menu, Leaf, TrendingUp, Activity, Calendar,
  CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlantationOverall from "../components/mis/PlantationOverall.jsx";
import PlantationScheme from "../components/mis/PlantationScheme.jsx";
import DFLsDistribution from "../components/mis/DFLsDistribution.jsx";
import DFLsConsumption from "../components/mis/DFLsConsumption.jsx";
import CocoonProduction from "../components/mis/CocoonProduction.jsx";
import "./mispage.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "master", label: "Master", icon: Database },
  {
    id: "data-entry", label: "Data Entry", icon: ClipboardList,
    children: [
      { id: "plantation-overall", label: "Plantation Overall" },
      { id: "plantation-2024", label: "Plantation Scheme 2024-25" },
      { id: "plantation-2025", label: "Plantation Scheme 2025-26" },
      { id: "dfls-distribution", label: "DFLs Distribution" },
      { id: "dfls-consumption", label: "DFLs Consumption" },
      { id: "cocoon-production", label: "Cocoon Production" },
    ]
  },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "mis-reports", label: "MIS Reports", icon: FileText },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "users", label: "User Management", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const FINANCIAL_YEARS = ["2025-26", "2024-25", "2023-24", "2022-23"];

export default function MISPage({ user }) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [dataEntryOpen, setDataEntryOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2025-26");

  const breadcrumbLabel = () => {
    const flat = NAV_ITEMS.flatMap(n => n.children ? [n, ...n.children] : [n]);
    return flat.find(n => n.id === activeView)?.label || "Dashboard";
  };

  const handleNav = (id, hasChildren) => {
    if (hasChildren) { setDataEntryOpen(o => !o); return; }
    setActiveView(id);
    if (!NAV_ITEMS.find(n => n.id === "data-entry")?.children?.find(c => c.id === id)) {
      setDataEntryOpen(false);
    }
  };

  const isDataEntryChild = NAV_ITEMS.find(n => n.id === "data-entry")
    ?.children?.some(c => c.id === activeView);

  const renderContent = () => {
    switch (activeView) {
      case "plantation-overall": return <PlantationOverall user={user} />;
      case "plantation-2024": return <PlantationScheme year="2024-25" user={user} />;
      case "plantation-2025": return <PlantationScheme year="2025-26" user={user} />;
      case "dfls-distribution": return <DFLsDistribution user={user} />;
      case "dfls-consumption": return <DFLsConsumption user={user} />;
      case "cocoon-production": return <CocoonProduction user={user} />;
      case "dashboard": return <MISDashboardOverview setActiveView={setActiveView} />;
      default:
        return (
          <div className="gov-placeholder">
            <FileText size={56} />
            <h3>{breadcrumbLabel()}</h3>
            <p>This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className={`gov-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      {/* ===== SIDEBAR ===== */}
      <aside className="gov-sidebar">
        <div className="gov-sidebar-brand">
          <div className="gov-brand-logo"><Leaf size={22} /></div>
          <div className="gov-brand-text">
            <span className="gov-brand-title">Silk Samagra</span>
            <span className="gov-brand-sub">MIS Portal</span>
          </div>
        </div>

        <nav className="gov-sidebar-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isActive = item.id === activeView || (hasChildren && isDataEntryChild && item.id === "data-entry");
            const isExpanded = hasChildren && dataEntryOpen;

            return (
              <div key={item.id}>
                <button
                  className={`gov-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleNav(item.id, hasChildren)}
                >
                  <Icon size={17} className="gov-nav-icon" />
                  <span className="gov-nav-label">{item.label}</span>
                  {hasChildren && (
                    <span className="gov-nav-arrow">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  )}
                </button>
                {hasChildren && isExpanded && (
                  <div className="gov-nav-children">
                    {item.children.map(child => (
                      <button
                        key={child.id}
                        className={`gov-nav-child ${activeView === child.id ? "active" : ""}`}
                        onClick={() => setActiveView(child.id)}
                      >
                        <span className="gov-child-dot" />
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button className="gov-nav-item gov-nav-logout" onClick={() => navigate("/")}>
            <LogOut size={17} className="gov-nav-icon" />
            <span className="gov-nav-label">Back to Portal</span>
          </button>
        </nav>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="gov-main">
        {/* Top Header */}
        <header className="gov-header">
          <div className="gov-header-left">
            <button className="gov-sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <Menu size={20} />
            </button>
            <div className="gov-breadcrumb">
              <span className="gov-bc-root">MIS Portal</span>
              <ChevronRight size={14} />
              {isDataEntryChild && <><span className="gov-bc-root">Data Entry</span><ChevronRight size={14} /></>}
              <span className="gov-bc-current">{breadcrumbLabel()}</span>
            </div>
          </div>
          <div className="gov-header-right">
            <div className="gov-fy-select">
              <Calendar size={15} />
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                {FINANCIAL_YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <button className="gov-icon-btn">
              <Bell size={18} />
              <span className="gov-notif-dot" />
            </button>
            <div className="gov-user-chip">
              <div className="gov-user-avatar">{user?.name?.[0] || "U"}</div>
              <div className="gov-user-info">
                <span className="gov-user-name">{user?.name || "User"}</span>
                <span className="gov-user-role">{user?.role || "Officer"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="gov-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function MISDashboardOverview({ setActiveView }) {
  const stats = [
    { label: "Plantation Records", value: "3,842", change: "+124 this month", icon: Leaf, color: "green" },
    { label: "DFLs Distributed", value: "1,26,540", change: "+8,200 this month", icon: Activity, color: "blue" },
    { label: "Cocoon Production", value: "48.6 MT", change: "+3.2 MT this month", icon: TrendingUp, color: "orange" },
    { label: "Farmers Covered", value: "9,214", change: "+312 this month", icon: Users, color: "purple" },
  ];

  const quickLinks = [
    { id: "plantation-overall", label: "Plantation Overall", icon: Leaf },
    { id: "plantation-2024", label: "Scheme 2024–25", icon: ClipboardList },
    { id: "plantation-2025", label: "Scheme 2025–26", icon: ClipboardList },
    { id: "dfls-distribution", label: "DFLs Distribution", icon: Activity },
    { id: "dfls-consumption", label: "DFLs Consumption", icon: Database },
    { id: "cocoon-production", label: "Cocoon Production", icon: TrendingUp },
  ];

  const recentEntries = [
    { label: "Plantation Overall – April 2025", status: "submitted", time: "2 hrs ago" },
    { label: "DFLs Distribution – March 2025", status: "pending", time: "5 hrs ago" },
    { label: "Cocoon Production – March 2025", status: "submitted", time: "Yesterday" },
    { label: "Scheme 2024–25 – Q4 Update", status: "draft", time: "2 days ago" },
  ];

  const statusIcon = (s) => s === "submitted"
    ? <CheckCircle2 size={14} className="gov-status-submitted" />
    : s === "pending"
    ? <Clock size={14} className="gov-status-pending" />
    : <AlertCircle size={14} className="gov-status-draft" />;

  return (
    <div className="gov-overview">
      <div className="gov-page-title">
        <h2>Dashboard Overview</h2>
        <p>Silk Samagra MIS Portal — Real-time sericulture data summary</p>
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
          <div className="gov-card-head"><h4>Quick Data Entry</h4></div>
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
            {recentEntries.map((e, i) => (
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
