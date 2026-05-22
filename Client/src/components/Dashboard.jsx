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
            
            {/* User Menu Dropdown - Click to open */}
            <div className="user-menu-wrapper">
              <div
                className="user-info"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User size={20} />
                <div className="user-info-text">
                  <span className="user-email">{user?.email}</span>
                  <span className="user-role">{getRoleDisplayName(user?.role)}</span>
                  {user?.ad_office && (
                    <span className="user-ad-office">{user.ad_office}</span>
                  )}
                </div>
                <ChevronDown size={16} className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`} />
              </div>

              {showUserMenu && (
                <div className="user-dropdown">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setActiveView('settings');
                      setShowUserMenu(false);
                    }}
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
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
              
              {canManageUsers(user?.role) && (
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
              
              <button
                className={`mobile-nav-item ${activeView === 'settings' ? 'active' : ''}`}
                onClick={() => handleMobileNavClick('settings')}
              >
                <Settings size={20} />
                <span>Settings</span>
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
        
        {canManageUsers(user?.role) && (
          <button
            className={`nav-btn ${activeView === 'users' ? 'active' : ''}`}
            onClick={() => setActiveView('users')}
          >
            <Users size={16} />
            Users
          </button>
        )}
        
        {/* Sections dropdown - Section Admin sees only their section, Super Admin sees all */}
        <div className="nav-dropdown-wrapper">
          <button
            className={`nav-btn ${activeView === 'ad-offices' ? 'active' : ''}`}
            onClick={() => {
              setShowSectionDropdown(!showSectionDropdown);
              setShowReportsDropdown(false);
            }}
          >
            <Building2 size={16} />
            Sections
            <ChevronDown size={14} className={`dropdown-arrow ${showSectionDropdown ? 'open' : ''}`} />
          </button>

          {showSectionDropdown && (
            <div className="nav-dropdown">
              <div className="dropdown-header">
                <Building2 size={16} />
                <span>Section Reports</span>
              </div>
              {/* Section Admin sees only their assigned section, Super Admin sees all */}
              {user?.role === ROLES.SECTION_ADMIN ? (
                user?.ad_office && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      handleReportSelect(user.ad_office);
                      setShowSectionDropdown(false);
                    }}
                  >
                    {user.ad_office}
                  </button>
                )
              ) : (
                REPORT_TYPES.map(report => (
                  <button
                    key={report}
                    className="dropdown-item"
                    onClick={() => {
                      handleReportSelect(report);
                      setShowSectionDropdown(false);
                    }}
                  >
                    {report}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="nav-dropdown-wrapper">
          <button
            className={`nav-btn ${activeView === 'reports-dashboard' ? 'active' : ''}`}
            onClick={() => {
              setShowReportsDropdown(!showReportsDropdown);
              setShowSectionDropdown(false);
            }}
          >
            <FileText size={16} />
            Reports
            <ChevronDown size={14} className={`dropdown-arrow ${showReportsDropdown ? 'open' : ''}`} />
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
              {/* Regular users see AD Offices, Admin users see Sections */}
              {user?.role === ROLES.USER ? (
                // Regular user - show their AD Office
                user?.ad_office && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      handleReportSelect(user.ad_office);
                      setShowReportsDropdown(false);
                    }}
                  >
                    {user.ad_office} Office
                  </button>
                )
              ) : (
                // Super Admin and Section Admin see all reports
                ALL_REPORT_TYPES.map(report => (
                  <button
                    key={report}
                    className="dropdown-item"
                    onClick={() => {
                      handleReportView(report);
                      setShowReportsDropdown(false);
                    }}
                  >
                    {report} Dashboard
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          className={`nav-btn ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <Settings size={16} />
          Settings
        </button>
        
      </nav>

      <main className="dashboard-main">
        {activeView === 'overview' && (
          <div className="overview-view">
            <div className="stats-grid">
              <StatCard
                icon={<Users size={24} />}
                title="Total Users"
                value={statistics?.totalUsers || 0}
                subtitle="Registered users"
                color="blue"
              />
              
              <StatCard
                icon={<UserCheck size={24} />}
                title="Active Users"
                value={statistics?.activeUsers || 0}
                subtitle={`${Math.round((statistics?.activeUsers || 0) / (statistics?.totalUsers || 1) * 100)}% of total`}
                color="green"
              />
              
              <StatCard
                icon={<UserX size={24} />}
                title="Inactive Users"
                value={statistics?.inactiveUsers || 0}
                subtitle="Need attention"
                color="orange"
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

        {activeView === 'users' && canManageUsers(user?.role) && (
          <div className="users-view">
            <UserList 
              userRole={user?.role} 
              userAdOffice={user?.ad_office}
              canDelete={canDeleteUsers(user?.role)}
              canCreate={canCreateUsers(user?.role)}
            />
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

        {activeView === 'settings' && (
          <UserSettings user={user} onBack={() => setActiveView('overview')} />
        )}
      </main>
    </div>
  );
}
