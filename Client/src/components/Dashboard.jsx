import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Clock,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Activity,
  Building2,
  ChevronDown,
  FileText,
  Menu,
  X,
  UserPlus,
  ShieldCheck,
  Database,
} from 'lucide-react';
import cocoonLogo from '../assets/login-bg.png';
import { authService } from '../services/auth.js';
import { sericulturistService } from "../services/sericulturist.js";
import UserList from "./UserList.jsx";
import MISDashboard from "./MISDashboard.jsx";
import PLSDashboard from "./PLSDashboard.jsx";
import PRCDashboard from "./PRCDashboard.jsx";
import POCDashboard from "./POCDashboard.jsx";
import ReportsDashboard from "./ReportsDashboard.jsx";
import StatCard from "./ui/StatCard.jsx";
import ProfileDropdown from "./ui/ProfileDropdown.jsx";
import LuxuryCard from "./ui/LuxuryCard.jsx";
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

export default function Dashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const FINAL_API = API_BASE;
        
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
        
        if (dashboard.ok) {
          setDashboardData(dashboard);
          setStatistics(dashboard.statistics || statsRes.statistics);
        } else {
          console.error('Dashboard data not ok:', dashboard);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
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
    const reportUrl = `/${reportType.toLowerCase()}-dashboard`;
    navigate(reportUrl);
  };

  const handleReportView = (reportType) => {
    setSelectedReport(reportType);
    setShowReportsDropdown(false);
    setActiveView(reportType.toLowerCase());
  };

  const activePercentage = Math.round(
    (statistics?.activeUsers || 0) / (statistics?.totalUsers || 1) * 100
  );
  const inactivePercentage = Math.round(
    (statistics?.inactiveUsers || 0) / (statistics?.totalUsers || 1) * 100
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-accent" aria-hidden="true" />
        <div className="dashboard-header-pattern" aria-hidden="true" />

        <div className="header-content">
          <div className="header-left">
            <div className="brand-mark">
              <div className="brand-cocoon-frame">
                <img
                  src={cocoonLogo}
                  alt="Silk cocoon"
                  className="brand-cocoon-img"
                />
              </div>
            </div>
            <div className="brand-divider" aria-hidden="true" />
            <div className="brand-text">
              <span className="brand-eyebrow">Silk Samagra · Sericulture</span>
              <h1>PDL Admin Dashboard</h1>
              <p>Enterprise Management System</p>
            </div>
          </div>
          
          <div className="header-right">
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <ProfileDropdown
              user={user}
              isOpen={showProfileDropdown}
              onToggle={() => setShowProfileDropdown(!showProfileDropdown)}
              onClose={() => setShowProfileDropdown(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={toggleMobileMenu}>
          <div className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <h3>Navigation</h3>
              <button className="mobile-nav-close" onClick={toggleMobileMenu}>
                <X size={20} />
              </button>
            </div>
            
            <div className="mobile-nav-items">
              <button
                className={`mobile-nav-item ${activeView === 'overview' ? 'active' : ''}`}
                onClick={() => handleMobileNavClick('overview')}
              >
                <Activity size={20} />
                <span>Overview</span>
              </button>
              
              <button
                className={`mobile-nav-item ${activeView === 'users' ? 'active' : ''}`}
                onClick={() => handleMobileNavClick('users')}
              >
                <Users size={20} />
                <span>Users</span>
              </button>
              
              <div className="mobile-nav-section">
                <h4>Sections</h4>
                {REPORT_TYPES.map(report => (
                  <button
                    key={report}
                    className="mobile-nav-item"
                    onClick={() => handleReportSelect(report)}
                  >
                    <Building2 size={20} />
                    <span>{report} Report</span>
                  </button>
                ))}
              </div>
              
              <button
                className={`mobile-nav-item ${activeView === 'reports-dashboard' ? 'active' : ''}`}
                onClick={() => handleMobileNavClick('reports-dashboard')}
              >
                <FileText size={20} />
                <span>Reports</span>
              </button>

              <div className="mobile-nav-divider" />
              <button className="mobile-nav-logout" onClick={handleLogout}>
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        
        <button
          className={`nav-btn ${activeView === 'users' ? 'active' : ''}`}
          onClick={() => setActiveView('users')}
        >
          <Users size={16} />
          Users
        </button>
        
        <div 
          className="nav-dropdown-wrapper"
          onMouseEnter={() => setShowSectionDropdown(true)}
          onMouseLeave={() => setShowSectionDropdown(false)}
        >
          <button
            className={`nav-btn ${activeView === 'ad-offices' ? 'active' : ''}`}
          >
            <Building2 size={16} />
            Sections
            <ChevronDown size={14} className="dropdown-arrow" />
          </button>
          
          {showSectionDropdown && (
            <div className="nav-dropdown">
              <div className="dropdown-header">
                <Building2 size={16} />
                <span>Section Reports</span>
              </div>
              {REPORT_TYPES.map(report => (
                <button
                  key={report}
                  className="dropdown-item"
                  onClick={() => handleReportSelect(report)}
                >
                  {report}
                </button>
              ))}
            </div>
          )}
        </div>

        <div 
          className="nav-dropdown-wrapper"
          onMouseEnter={() => setShowReportsDropdown(true)}
          onMouseLeave={() => setShowReportsDropdown(false)}
        >
          <button className={`nav-btn ${activeView === 'reports-dashboard' ? 'active' : ''}`}>
            <FileText size={16} />
            Reports
            <ChevronDown size={14} className="dropdown-arrow" />
          </button>
          
          {showReportsDropdown && (
            <div className="nav-dropdown">
              <div className="dropdown-header">
                <FileText size={16} />
                <span>Report Options</span>
              </div>
              <button
                className="dropdown-item"
                onClick={() => {
                  setActiveView('reports-dashboard');
                  setShowReportsDropdown(false);
                }}
              >
                All Reports Dashboard
              </button>
              <div className="dropdown-divider"></div>
              {ALL_REPORT_TYPES.map(report => (
                <button
                  key={report}
                  className="dropdown-item"
                  onClick={() => handleReportView(report)}
                >
                  {report} Dashboard
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="dashboard-main">
        {activeView === 'overview' && (
          <div className="overview-view">
            <div className="overview-header">
              <div>
                <h2 className="overview-title">Dashboard Overview</h2>
                <p className="overview-subtitle">
                  Welcome back, {user?.email}. Here&apos;s your enterprise snapshot.
                </p>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard
                icon={<Users size={24} />}
                title="Total Users"
                value={statistics?.totalUsers || 0}
                subtitle="Registered users"
                trend={
                  statistics?.recentGrowth != null || statistics?.newThisMonth != null
                    ? `+${statistics?.recentGrowth ?? statistics?.newThisMonth}% this month`
                    : 'All registered accounts'
                }
                trendUp
                variant="emerald"
              />
              
              <StatCard
                icon={<UserCheck size={24} />}
                title="Active Users"
                value={statistics?.activeUsers || 0}
                subtitle={`${activePercentage}% of total`}
                trend={`${activePercentage}% active`}
                trendUp={activePercentage >= 50}
                variant="gold"
              />
              
              <StatCard
                icon={<UserX size={24} />}
                title="Inactive Users"
                value={statistics?.inactiveUsers || 0}
                subtitle="Need attention"
                trend={`${inactivePercentage}% inactive`}
                trendUp={false}
                variant="slate"
              />
            </div>

            <div className="dashboard-cards">
              <LuxuryCard
                title="Server Information"
                icon={<Clock size={18} />}
              >
                <div className="server-info-grid">
                  <div className="server-info-item">
                    <span className="server-info-label">Server Time</span>
                    <span className="server-info-value">
                      {new Date(dashboardData?.serverTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="server-info-item">
                    <span className="server-info-label">Status</span>
                    <span className="status-badge status-online">
                      <span className="status-dot"></span>
                      Online
                    </span>
                  </div>
                  <div className="server-info-item">
                    <span className="server-info-label">Database</span>
                    <span className="db-badge">
                      <Database size={14} />
                      PostgreSQL
                    </span>
                  </div>
                </div>
              </LuxuryCard>

              <LuxuryCard
                title="Recent Activity"
                icon={<Calendar size={18} />}
              >
                <div className="activity-timeline">
                  <div className="activity-item">
                    <div className="activity-icon new-user">
                      <UserPlus size={16} />
                    </div>
                    <div className="activity-details">
                      <strong>New registrations</strong>
                      <span>{statistics?.recentGrowth || 0} users this month</span>
                    </div>
                    <span className="activity-time">Today</span>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon active-user">
                      <UserCheck size={16} />
                    </div>
                    <div className="activity-details">
                      <strong>Active users</strong>
                      <span>{statistics?.activePercentage || activePercentage}% engagement rate</span>
                    </div>
                    <span className="activity-time">Live</span>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon system">
                      <ShieldCheck size={16} />
                    </div>
                    <div className="activity-details">
                      <strong>System status</strong>
                      <span>All systems operational</span>
                    </div>
                    <span className="activity-time activity-time-success">Healthy</span>
                  </div>
                </div>
              </LuxuryCard>
            </div>

            <LuxuryCard title="System Message" fullWidth>
              <p className="system-message">{dashboardData?.message}</p>
            </LuxuryCard>
          </div>
        )}

        {activeView === 'users' && (
          <div className="users-view">
            <UserList />
          </div>
        )}

        {activeView === 'mis' && (
          <MISDashboard user={user} />
        )}

        {activeView === 'pls' && (
          <PLSDashboard user={user} />
        )}

        {activeView === 'prc' && (
          <PRCDashboard user={user} />
        )}

        {activeView === 'poc' && (
          <POCDashboard user={user} />
        )}

        {activeView === 'reports-dashboard' && (
          <ReportsDashboard user={user} />
        )}
      </main>
    </div>
  );
}
