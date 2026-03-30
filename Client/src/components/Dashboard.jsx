import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Clock, Users, UserCheck, UserX, TrendingUp, Calendar, Activity, Building2, ChevronDown, FileText, Package, Cpu, Factory, BarChart3, Settings, Menu, X } from 'lucide-react';
import { authService } from '../services/auth.js';
import { sericulturistService } from "../services/sericulturist.js";
import UserList from "./UserList.jsx";
import MISDashboard from "./MISDashboard.jsx";
import PLSDashboard from "./PLSDashboard.jsx";
import PRCDashboard from "./PRCDashboard.jsx";
import POCDashboard from "./POCDashboard.jsx";
import ReportsDashboard from "./ReportsDashboard.jsx";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://pdltn.vercel.app/api';
        const [dashboardRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/admin/dashboard`, {
            credentials: "include",
          }),
          sericulturistService.getStatistics()
        ]);
        
        const dashboard = await dashboardRes.json();
        if (dashboard.ok) {
          setDashboardData(dashboard);
          setStatistics(dashboard.statistics || statsRes.statistics);
        }
      } catch (err) {
        console.error(err);
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
    // Open in same tab for Section dropdown using React Router (NOT new tab)
    const reportUrl = `/${reportType.toLowerCase()}-dashboard`;
    console.log('Navigating to:', reportUrl, 'in same tab using React Router');
    navigate(reportUrl);
  };

  const handleReportView = (reportType) => {
    setSelectedReport(reportType);
    setShowReportsDropdown(false);
    // Open in same dashboard for Reports dropdown
    setActiveView(reportType.toLowerCase());
  };

  const handleDownloadReport = (reportType) => {
    console.log(`Downloading ${reportType} Report...`);
    setShowReportsDropdown(false);
    // Add actual download logic here
  };

  const StatCard = ({ icon, title, value, subtitle, color, trend }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        {trend && <div className="stat-trend">{trend}</div>}
      </div>
    </div>
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
        <div className="header-content">
          <div className="header-left">
            <h1>PDL Admin Dashboard</h1>
            <p>Welcome back, {user?.email}!</p>
          </div>
          
          <div className="header-right">
            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="user-info">
              <User size={20} />
              <span>{user?.email}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
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
              
              {user.role === 'admin' && (
                <button
                  className={`mobile-nav-item ${activeView === 'users' ? 'active' : ''}`}
                  onClick={() => handleMobileNavClick('users')}
                >
                  <Users size={20} />
                  <span>Users</span>
                </button>
              )}
              
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
        
        {user.role === 'admin' && (
          <button
            className={`nav-btn ${activeView === 'users' ? 'active' : ''}`}
            onClick={() => setActiveView('users')}
          >
            <Users size={16} />
            Users
          </button>
        )}
        
        <div 
          className="nav-dropdown-wrapper"
          onMouseEnter={() => setShowSectionDropdown(true)}
          onMouseLeave={() => setShowSectionDropdown(false)}
        >
          <button
            className={`nav-btn ${activeView === 'ad-offices' ? 'active' : ''}`}
          >
            <Building2 size={16} />
            {user.role === 'admin' ? 'Sections' : 'My Section'}
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
                📊 All Reports Dashboard
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
            <div className="stats-grid">
              <StatCard
                icon={<Users size={24} />}
                title="Total Users"
                value={statistics?.total || 0}
                subtitle="Registered sericulturists"
                color="blue"
              />
              
              <StatCard
                icon={<UserCheck size={24} />}
                title="Active Users"
                value={statistics?.active || 0}
                subtitle={`${statistics?.activePercentage || 0}% of total`}
                color="green"
              />
              
              <StatCard
                icon={<UserX size={24} />}
                title="Inactive Users"
                value={statistics?.inactive || 0}
                subtitle="Need attention"
                color="orange"
              />
              
              <StatCard
                icon={<TrendingUp size={24} />}
                title="New This Month"
                value={statistics?.recentGrowth || 0}
                subtitle="Last 30 days"
                color="purple"
              />
            </div>

            <div className="dashboard-cards">
              <div className="card">
                <div className="card-header">
                  <h3>
                    <Clock size={18} />
                    Server Information
                  </h3>
                </div>
                <div className="card-content">
                  <div className="info-item">
                    <label>Server Time:</label>
                    <span>{new Date(dashboardData?.serverTime).toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className="status-online">Online</span>
                  </div>
                  <div className="info-item">
                    <label>Database:</label>
                    <span>PostgreSQL</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>
                    <Calendar size={18} />
                    Recent Activity
                  </h3>
                </div>
                <div className="card-content">
                  <div className="activity-item">
                    <div className="activity-icon new-user"></div>
                    <div className="activity-details">
                      <strong>New registrations</strong>
                      <span>{statistics?.recentGrowth || 0} users this month</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon active-user"></div>
                    <div className="activity-details">
                      <strong>Active users</strong>
                      <span>{statistics?.activePercentage || 0}% engagement rate</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon system"></div>
                    <div className="activity-details">
                      <strong>System status</strong>
                      <span>All systems operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card full-width">
              <div className="card-header">
                <h3>System Message</h3>
              </div>
              <div className="card-content">
                <p>{dashboardData?.message}</p>
              </div>
            </div>
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
