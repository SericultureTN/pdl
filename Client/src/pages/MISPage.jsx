import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Home, Users, Settings, BarChart3, Menu, X, Bell, Search, ChevronRight, TrendingUp, Database, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./mispage.css";

export default function MISPage() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBackToMain = () => {
    console.log('Navigating back to main dashboard in same tab');
    navigate('/');
  };

  const handleSidebarClick = (view) => {
    console.log('Sidebar clicked, switching to view:', view);
    setActiveView(view);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileNavClick = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  const stats = [
    { icon: <Database size={24} />, label: 'Total Records', value: '12,450', trend: '+12%' },
    { icon: <Users size={24} />, label: 'Active Users', value: '1,234', trend: '+5%' },
    { icon: <FileText size={24} />, label: 'Reports Generated', value: '856', trend: '+18%' },
    { icon: <TrendingUp size={24} />, label: 'Growth Rate', value: '23.5%', trend: '+8%' }
  ];

  const recentActivities = [
    { title: 'Monthly Report Generated', time: '2 hours ago', type: 'report' },
    { title: 'New User Added', time: '4 hours ago', type: 'user' },
    { title: 'Data Backup Completed', time: '6 hours ago', type: 'system' },
    { title: 'Security Audit Passed', time: '1 day ago', type: 'security' }
  ];

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return (
          <div className="mis-dashboard-content">
            {/* Stats Cards */}
            <div className="mis-stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="mis-stat-card">
                  <div className="mis-stat-icon">{stat.icon}</div>
                  <div className="mis-stat-info">
                    <p className="mis-stat-label">{stat.label}</p>
                    <h3 className="mis-stat-value">{stat.value}</h3>
                    <span className="mis-stat-trend">{stat.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="mis-content-grid">
              <div className="mis-main-card">
                <div className="mis-card-header">
                  <h3>Welcome to MIS Dashboard</h3>
                  <p>Management Information System Overview</p>
                </div>
                <div className="mis-card-body">
                  <div className="mis-welcome-section">
                    <div className="mis-welcome-icon">
                      <BarChart3 size={48} />
                    </div>
                    <h2>System Overview</h2>
                    <p>Access comprehensive reports, manage users, and configure system settings from your centralized dashboard.</p>
                  </div>
                </div>
              </div>

              <div className="mis-side-cards">
                <div className="mis-side-card">
                  <h4>Recent Activity</h4>
                  <ul className="mis-activity-list">
                    {recentActivities.map((activity, index) => (
                      <li key={index} className={`mis-activity-item ${activity.type}`}>
                        <span className="mis-activity-dot"></span>
                        <div>
                          <p>{activity.title}</p>
                          <span>{activity.time}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mis-side-card mis-quick-actions">
                  <h4>Quick Actions</h4>
                  <div className="mis-action-buttons">
                    <button className="mis-action-btn" onClick={() => setActiveView('reports')}>
                      <FileText size={18} />
                      Generate Report
                    </button>
                    <button className="mis-action-btn" onClick={() => setActiveView('users')}>
                      <Users size={18} />
                      Manage Users
                    </button>
                    <button className="mis-action-btn" onClick={() => setActiveView('settings')}>
                      <Settings size={18} />
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="mis-page-content">
            <div className="mis-page-header-card">
              <h2><FileText size={28} /> MIS Reports</h2>
              <p>Generate and manage system reports</p>
            </div>
            <div className="mis-placeholder-content">
              <FileText size={64} className="mis-placeholder-icon" />
              <h3>Reports Section</h3>
              <p>Report generation interface coming soon</p>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="mis-page-content">
            <div className="mis-page-header-card">
              <h2><Users size={28} /> User Management</h2>
              <p>Manage system users and permissions</p>
            </div>
            <div className="mis-placeholder-content">
              <Users size={64} className="mis-placeholder-icon" />
              <h3>Users Section</h3>
              <p>User management interface coming soon</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="mis-page-content">
            <div className="mis-page-header-card">
              <h2><Settings size={28} /> System Settings</h2>
              <p>Configure MIS system preferences</p>
            </div>
            <div className="mis-placeholder-content">
              <Settings size={64} className="mis-placeholder-icon" />
              <h3>Settings Section</h3>
              <p>Configuration interface coming soon</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="mis-page-content">
            <div className="mis-placeholder-content">
              <BarChart3 size={64} className="mis-placeholder-icon" />
              <h3>Select a Section</h3>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mis-page-container">
      {/* Modern Sidebar */}
      <div className="mis-sidebar">
        <div className="mis-sidebar-brand">
          <div className="mis-brand-icon">
            <Database size={28} />
          </div>
          <div className="mis-brand-text">
            <h2>MIS</h2>
            <span>Management Information System</span>
          </div>
        </div>

        <div className="mis-sidebar-nav">
          <a 
            href="#" 
            className={`mis-sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              console.log('Dashboard sidebar item clicked');
              handleSidebarClick('dashboard');
            }}
          >
            <Home size={18} />
            Dashboard
          </a>
          <a 
            href="#" 
            className={`mis-sidebar-item ${activeView === 'reports' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              console.log('Reports sidebar item clicked');
              handleSidebarClick('reports');
            }}
          >
            <BarChart3 size={18} />
            Reports
          </a>
          <a 
            href="#" 
            className={`mis-sidebar-item ${activeView === 'users' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              console.log('Users sidebar item clicked');
              handleSidebarClick('users');
            }}
          >
            <Users size={18} />
            Users
          </a>
          <a 
            href="#" 
            className={`mis-sidebar-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              console.log('Settings sidebar item clicked');
              handleSidebarClick('settings');
            }}
          >
            <Settings size={18} />
            Settings
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="mis-main-content">
        <header className="mis-top-header">
          <div className="mis-header-left">
            <button
              className="mis-mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="mis-search-bar">
              <Search size={18} />
              <input type="text" placeholder="Search..." />
            </div>
          </div>
          <div className="mis-header-right">
            <button className="mis-header-btn">
              <Bell size={20} />
              <span className="mis-notification-badge">3</span>
            </button>
            <button onClick={handleBackToMain} className="mis-back-btn">
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </header>
        
        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="mis-mobile-nav-overlay" onClick={toggleMobileMenu}>
            <div className="mis-mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
              <div className="mis-mobile-nav-header">
                <h3>MIS Navigation</h3>
                <button className="mis-mobile-nav-close" onClick={toggleMobileMenu}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="mis-mobile-nav-items">
                <button
                  className={`mis-mobile-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleMobileNavClick('dashboard')}
                >
                  <Home size={20} />
                  <span>Dashboard</span>
                </button>
                
                <button
                  className={`mis-mobile-nav-item ${activeView === 'reports' ? 'active' : ''}`}
                  onClick={() => handleMobileNavClick('reports')}
                >
                  <BarChart3 size={20} />
                  <span>Reports</span>
                </button>
                
                <button
                  className={`mis-mobile-nav-item ${activeView === 'users' ? 'active' : ''}`}
                  onClick={() => handleMobileNavClick('users')}
                >
                  <Users size={20} />
                  <span>Users</span>
                </button>
                
                <button
                  className={`mis-mobile-nav-item ${activeView === 'settings' ? 'active' : ''}`}
                  onClick={() => handleMobileNavClick('settings')}
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {renderContent()}
      </div>
    </div>
  );
}
