import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Clock, Users, UserCheck, UserX, TrendingUp, Calendar, Activity, Building2, ChevronDown, FileText, BarChart3, Settings, Menu, X, Bell, Search, Shield, Database, Zap } from 'lucide-react';
import { authService } from '../services/auth.js';
import { sericulturistService } from "../services/sericulturist.js";
import UserList from "./UserList.jsx";
import MISPage from "../pages/MISPage.jsx";
import PLSDashboard from "./PLSDashboard.jsx";
import PRCDashboard from "./PRCDashboard.jsx";
import POCDashboard from "./POCDashboard.jsx";
import ReportsDashboard from "./ReportsDashboard.jsx";
import UserSettings from "./UserSettings.jsx";
import "./Dashboard.css";

const REPORT_TYPES = [
  "MIS",
  "PLS", 
  "PRC",
  "POC"
];

const ALL_REPORT_TYPES = [
  "MIS",
  "PLS",
  "PRC",
  "POC"
];

// AD Offices for regular users
const AD_OFFICES = [
  "Hosur",
  "Denkanikkottai",
  "Krishnagiri",
  "Dharmapuri",
  "Pennagaram",
  "Salem",
  "Coimbatore",
  "Udumalpet",
  "Erode",
  "Talavady",
  "Coonoor",
  "Vaniyambadi",
  "Tiruvannamalai",
  "Villuppuram",
  "Trichy",
  "Namakkal",
  "Dindigul",
  "Theni",
  "Tenkasi"
];

// Role definitions
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SECTION_ADMIN: 'section_admin',
  USER: 'user'
};

// Role-based helper functions
const canManageUsers = (role) => role === ROLES.SUPER_ADMIN || role === ROLES.SECTION_ADMIN;
const canDeleteUsers = (role) => role === ROLES.SUPER_ADMIN;
const canCreateUsers = (role) => role === ROLES.SUPER_ADMIN;
const canViewAllOffices = (role) => role === ROLES.SUPER_ADMIN;
const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLES.SUPER_ADMIN: return 'Super Admin';
    case ROLES.SECTION_ADMIN: return 'Section Admin';
    case ROLES.USER: return 'AD Office User';
    default: return 'User';
  }
};

export default function Dashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Local API URL only
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const FINAL_API = API_BASE;
        
        console.log('Dashboard fetching from:', FINAL_API);
        
        const [dashboardRes, statsRes] = await Promise.all([
          fetch(`${FINAL_API}/admin/dashboard`, {
            credentials: "include",
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          sericulturistService.getStatistics()
        ]);
        
        const dashboard = await dashboardRes.json();
        console.log('Dashboard data:', dashboard);
        
        if (dashboard.ok) {
          const rawStatistics = dashboard.statistics || statsRes.statistics || {};
          const normalizedStatistics = {
            ...rawStatistics,
            totalUsers: rawStatistics.totalUsers ?? rawStatistics.total ?? rawStatistics.totalSericulturists ?? 0,
            activeUsers: rawStatistics.activeUsers ?? rawStatistics.active ?? rawStatistics.activeSericulturists ?? 0,
            inactiveUsers: rawStatistics.inactiveUsers ?? rawStatistics.inactive ?? rawStatistics.inactiveSericulturists ?? 0,
            recentGrowth: rawStatistics.recentGrowth ?? rawStatistics.recent ?? rawStatistics.newThisMonth ?? 0
          };
          setDashboardData(dashboard);
          setStatistics(normalizedStatistics);
        } else {
          console.error('Dashboard data not ok:', dashboard);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        // Set default data if API fails
        setDashboardData({
          ok: true,
          message: 'Dashboard loaded with default data',
          statistics: {
            totalUsers: 0,
            activeUsers: 0,
            totalSericulturists: 0,
            activeSericulturists: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    onLogout();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileNavClick = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  const handleReportSelect = (reportType) => {
    setSelectedReport(reportType);
    setShowSectionDropdown(false);
    setShowReportsDropdown(false);
    setActiveView(reportType.toLowerCase());
  };

  const handleReportView = (reportType) => {
    setSelectedReport(reportType);
    setShowReportsDropdown(false);
    setActiveView(reportType.toLowerCase());
  };

  const handleDownloadReport = (reportType) => {
    console.log(`Downloading ${reportType} Report...`);
    setShowReportsDropdown(false);
    // Add actual download logic here
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  /* ── Sidebar nav items ── */
  const navItems = [
    { id: 'overview',           label: 'Overview',  icon: <Activity size={18} />,  show: true },
    { id: 'users',              label: 'Users',     icon: <Users size={18} />,     show: canManageUsers(user?.role) },
    { id: 'sections-trigger',   label: 'Sections',  icon: <Building2 size={18} />, show: true, hasDropdown: true },
    { id: 'reports-trigger',    label: 'Reports',   icon: <FileText size={18} />,  show: true, hasDropdown: true },
    { id: 'settings',           label: 'Settings',  icon: <Settings size={18} />,  show: true },
  ];

  if (activeView === 'mis') {
    return <MISPage user={user} onBack={() => setActiveView('overview')} />;
  }

  return (
    <div className="db-root">

      {/* ══════════════════════════════════
          SIDEBAR
      ══════════════════════════════════ */}
      <aside className="db-sidebar">
        {/* Logo area */}
        <div className="db-sidebar-logo">
          <div className="db-logo-mark">P</div>
          <div className="db-logo-text">
            <span className="db-logo-title">PDL</span>
            <span className="db-logo-sub">ADMIN PANEL</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="db-sidebar-nav">
          <p className="db-nav-label">MAIN MENU</p>

          {/* Overview */}
          <button
            className={`db-nav-item ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveView('overview'); setShowSectionDropdown(false); setShowReportsDropdown(false); }}
          >
            <span className="db-nav-icon"><Activity size={18} /></span>
            <span>Overview</span>
          </button>

          {/* Users */}
          {canManageUsers(user?.role) && (
            <button
              className={`db-nav-item ${activeView === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveView('users'); setShowSectionDropdown(false); setShowReportsDropdown(false); }}
            >
              <span className="db-nav-icon"><Users size={18} /></span>
              <span>Users</span>
            </button>
          )}

          {/* Sections dropdown */}
          <div className="db-nav-group">
            <button
              className={`db-nav-item ${showSectionDropdown ? 'active' : ''}`}
              onClick={() => { setShowSectionDropdown(!showSectionDropdown); setShowReportsDropdown(false); }}
            >
              <span className="db-nav-icon"><Building2 size={18} /></span>
              <span>Sections</span>
              <ChevronDown size={14} className={`db-chevron ${showSectionDropdown ? 'open' : ''}`} />
            </button>
            {showSectionDropdown && (
              <div className="db-sub-menu">
                {user?.role === ROLES.SECTION_ADMIN ? (
                  user?.ad_office && (
                    <button className="db-sub-item" onClick={() => { handleReportSelect(user.ad_office); setShowSectionDropdown(false); }}>
                      {user.ad_office}
                    </button>
                  )
                ) : (
                  REPORT_TYPES.map(r => (
                    <button key={r} className="db-sub-item" onClick={() => { handleReportSelect(r); setShowSectionDropdown(false); }}>
                      {r} Report
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Reports dropdown */}
          <div className="db-nav-group">
            <button
              className={`db-nav-item ${activeView === 'reports-dashboard' || showReportsDropdown ? 'active' : ''}`}
              onClick={() => { setShowReportsDropdown(!showReportsDropdown); setShowSectionDropdown(false); }}
            >
              <span className="db-nav-icon"><BarChart3 size={18} /></span>
              <span>Reports</span>
              <ChevronDown size={14} className={`db-chevron ${showReportsDropdown ? 'open' : ''}`} />
            </button>
            {showReportsDropdown && (
              <div className="db-sub-menu">
                <button className="db-sub-item" onClick={() => { setActiveView('reports-dashboard'); setShowReportsDropdown(false); }}>
                  All Reports Dashboard
                </button>
                <div className="db-sub-divider" />
                {user?.role === ROLES.USER ? (
                  user?.ad_office && (
                    <button className="db-sub-item" onClick={() => { handleReportSelect(user.ad_office); setShowReportsDropdown(false); }}>
                      {user.ad_office} Office
                    </button>
                  )
                ) : (
                  ALL_REPORT_TYPES.map(r => (
                    <button key={r} className="db-sub-item" onClick={() => { handleReportView(r); setShowReportsDropdown(false); }}>
                      {r} Dashboard
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            className={`db-nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveView('settings'); setShowSectionDropdown(false); setShowReportsDropdown(false); }}
          >
            <span className="db-nav-icon"><Settings size={18} /></span>
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar footer version card */}
        <div className="db-sidebar-footer">
          <div className="db-version-card">
            <Shield size={14} />
            <div>
              <p className="db-version-name">PDL Admin Panel</p>
              <p className="db-version-num">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════
          MAIN COLUMN
      ══════════════════════════════════ */}
      <div className="db-main-col">

        {/* TOP HEADER */}
        <header className="db-topbar">
          <div className="db-topbar-left">
            {/* Mobile toggle */}
            <button className="db-mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="db-topbar-title">PDL Admin Dashboard</h1>
              <p className="db-topbar-sub">Enterprise Management System</p>
            </div>
          </div>

          <div className="db-topbar-right">
            {/* Search */}
            <button className="db-icon-btn" aria-label="Search">
              <Search size={18} />
            </button>

            {/* Bell */}
            <div className="db-bell-wrap">
              <button className="db-icon-btn" aria-label="Notifications">
                <Bell size={18} />
              </button>
              <span className="db-bell-badge">3</span>
            </div>

            {/* Profile */}
            <div className="user-menu-wrapper">
              <div className="db-profile-card" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="db-avatar">
                  <User size={16} />
                </div>
                <div className="user-info-text">
                  <span className="user-email">{user?.email}</span>
                  <span className="user-role">{getRoleDisplayName(user?.role)}</span>
                </div>
                <ChevronDown size={14} className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`} />
              </div>

              {showUserMenu && (
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={() => { setActiveView('settings'); setShowUserMenu(false); }}>
                    <Settings size={15} /> Settings
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile nav overlay */}
        {mobileMenuOpen && (
          <div className="mobile-nav-overlay" onClick={toggleMobileMenu}>
            <div className="mobile-nav-menu" onClick={e => e.stopPropagation()}>
              <div className="mobile-nav-header">
                <h3>Navigation</h3>
                <button className="mobile-nav-close" onClick={toggleMobileMenu}><X size={20} /></button>
              </div>
              <div className="mobile-nav-items">
                <button className={`mobile-nav-item ${activeView === 'overview' ? 'active' : ''}`} onClick={() => handleMobileNavClick('overview')}>
                  <Activity size={18} /><span>Overview</span>
                </button>
                {canManageUsers(user?.role) && (
                  <button className={`mobile-nav-item ${activeView === 'users' ? 'active' : ''}`} onClick={() => handleMobileNavClick('users')}>
                    <Users size={18} /><span>Users</span>
                  </button>
                )}
                <div className="mobile-nav-section">
                  <h4>Sections</h4>
                  {REPORT_TYPES.map(r => (
                    <button key={r} className="mobile-nav-item" onClick={() => handleReportSelect(r)}>
                      <Building2 size={18} /><span>{r} Report</span>
                    </button>
                  ))}
                </div>
                <button className={`mobile-nav-item ${activeView === 'reports-dashboard' ? 'active' : ''}`} onClick={() => handleMobileNavClick('reports-dashboard')}>
                  <FileText size={18} /><span>Reports</span>
                </button>
                <button className={`mobile-nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => handleMobileNavClick('settings')}>
                  <Settings size={18} /><span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="db-content">

          {activeView === 'overview' && (
            <div className="overview-view">

              {/* Stat cards */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon"><Users size={22} /></div>
                  <div className="stat-content">
                    <h3>Total Users</h3>
                    <div className="stat-value">{statistics?.totalUsers || 0}</div>
                    <div className="stat-subtitle">Registered users</div>
                    <div className="stat-trend">+12% this month</div>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon"><UserCheck size={22} /></div>
                  <div className="stat-content">
                    <h3>Active Users</h3>
                    <div className="stat-value">{statistics?.activeUsers || 0}</div>
                    <div className="stat-subtitle">{Math.round((statistics?.activeUsers || 0) / (statistics?.totalUsers || 1) * 100)}% of total</div>
                    <div className="stat-trend">+8% this month</div>
                  </div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-icon"><UserX size={22} /></div>
                  <div className="stat-content">
                    <h3>Inactive Users</h3>
                    <div className="stat-value">{statistics?.inactiveUsers || 0}</div>
                    <div className="stat-subtitle">Need attention</div>
                    <div className="stat-trend stat-trend-neg">−3% this month</div>
                  </div>
                </div>
              </div>

              {/* Cards row */}
              <div className="dashboard-cards">
                {/* Server Info */}
                <div className="card">
                  <div className="card-header">
                    <h3><Clock size={16} />Server Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-item">
                      <label>Server Time</label>
                      <span>{new Date(dashboardData?.serverTime).toLocaleString()}</span>
                    </div>
                    <div className="info-item">
                      <label>Status</label>
                      <span className="status-online">Online</span>
                    </div>
                    <div className="info-item">
                      <label>Database</label>
                      <span className="db-badge"><Database size={12} />PostgreSQL</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="card">
                  <div className="card-header">
                    <h3><Zap size={16} />Recent Activity</h3>
                  </div>
                  <div className="card-content">
                    <div className="activity-item">
                      <div className="activity-icon new-user" />
                      <div className="activity-details">
                        <strong>New registrations</strong>
                        <span>{statistics?.recentGrowth || 0} users this month</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon active-user" />
                      <div className="activity-details">
                        <strong>Active users</strong>
                        <span>{statistics?.activePercentage || 0}% engagement rate</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon system" />
                      <div className="activity-details">
                        <strong>System status</strong>
                        <span>All systems operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System message */}
              <div className="card full-width">
                <div className="card-header"><h3>System Message</h3></div>
                <div className="card-content"><p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{dashboardData?.message}</p></div>
              </div>

            </div>
          )}

          {activeView === 'users' && canManageUsers(user?.role) && (
            <div className="users-view">
              <UserList userRole={user?.role} userAdOffice={user?.ad_office} canDelete={canDeleteUsers(user?.role)} canCreate={canCreateUsers(user?.role)} />
            </div>
          )}

          {/* MIS handled by early return above */}
          {activeView === 'pls'              && <PLSDashboard user={user} />}
          {activeView === 'prc'              && <PRCDashboard user={user} />}
          {activeView === 'poc'              && <POCDashboard user={user} />}
          {activeView === 'reports-dashboard'&& <ReportsDashboard user={user} />}
          {activeView === 'settings'         && <UserSettings user={user} onBack={() => setActiveView('overview')} />}

        </main>
      </div>
    </div>
  );
}
