import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileInput,
  BarChart3,
  LineChart,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  MIS_DATA_ENTRY_ITEMS,
  MIS_MAIN_NAV_ITEMS,
  MIS_REPORT_ITEMS,
  MIS_REPORTS_DASHBOARD,
  misFullPath,
  isMisNavActive,
} from './misNavConfig.js';
import { authService } from '../../services/auth.js';
import cocoonArt from '../../assets/login-bg.png';

export default function MISSidebar({ onLogout }) {
  const location = useLocation();

  const dashboardItem = MIS_MAIN_NAV_ITEMS.find((item) => item.path === 'dashboard');
  const analyticsItem = MIS_MAIN_NAV_ITEMS.find((item) => item.path === 'analytics');
  const userManagementItem = MIS_MAIN_NAV_ITEMS.find((item) => item.path === 'user-management');
  const settingsItem = MIS_MAIN_NAV_ITEMS.find((item) => item.path === 'settings');

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with local logout even if API fails
    }
    onLogout?.();
  };

  const navLink = (item, icon) => (
    <Link
      key={item.path}
      to={misFullPath(item.path)}
      className={`mis-portal-nav-item ${isMisNavActive(location.pathname, item.path) ? 'active' : ''}`}
    >
      {icon}
      {item.label}
    </Link>
  );

  return (
    <aside className="mis-portal-sidebar">
      <div className="mis-portal-logo">
        <div className="mis-portal-logo-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
            <path d="M24 8C18 16 14 22 14 28C14 34 18 38 24 38C30 38 34 34 34 28C34 22 30 16 24 8Z" fill="currentColor" opacity="0.9" />
            <path d="M24 14C21 19 19 23 19 27C19 31 21 33 24 33C27 33 29 31 29 27C29 23 27 19 24 14Z" fill="#D4AF37" />
          </svg>
        </div>
        <div className="mis-portal-logo-text">
          <span className="mis-portal-logo-title">SILK SAMAGRA</span>
          <span className="mis-portal-logo-subtitle">MIS PORTAL</span>
        </div>
      </div>

      <nav className="mis-portal-nav">
        {navLink(dashboardItem, <LayoutDashboard size={18} />)}

        <div className="mis-portal-nav-group">
          <div className="mis-portal-nav-item mis-portal-nav-parent">
            <FileInput size={18} />
            Data Entry
            <ChevronDown size={16} className="mis-portal-nav-chevron" />
          </div>
          <div className="mis-portal-nav-sub">
            {MIS_DATA_ENTRY_ITEMS.map((item) => {
              const active = isMisNavActive(location.pathname, item.path);

              return (
                <Link
                  key={item.path}
                  to={misFullPath(item.path)}
                  className={`mis-portal-nav-sub-item ${active ? 'active' : ''}`}
                >
                  {active ? <ChevronRight size={14} /> : <span className="mis-portal-nav-dot" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mis-portal-nav-group">
          <div className="mis-portal-nav-item mis-portal-nav-parent">
            <BarChart3 size={18} />
            Reports
            <ChevronDown size={16} className="mis-portal-nav-chevron" />
          </div>
          <div className="mis-portal-nav-sub">
            <Link
              to={misFullPath(MIS_REPORTS_DASHBOARD.path)}
              className={`mis-portal-nav-sub-item ${location.pathname === misFullPath(MIS_REPORTS_DASHBOARD.path) ? 'active' : ''}`}
            >
              {location.pathname === misFullPath(MIS_REPORTS_DASHBOARD.path)
                ? <ChevronRight size={14} />
                : <span className="mis-portal-nav-dot" />}
              Reports Dashboard
            </Link>
            {MIS_REPORT_ITEMS.map((item) => {
              const active = isMisNavActive(location.pathname, item.path);

              return (
                <Link
                  key={item.path}
                  to={misFullPath(item.path)}
                  className={`mis-portal-nav-sub-item ${active ? 'active' : ''}`}
                >
                  {active ? <ChevronRight size={14} /> : <span className="mis-portal-nav-dot" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {navLink(analyticsItem, <LineChart size={18} />)}
        {navLink(userManagementItem, <Users size={18} />)}
      </nav>

      <div className="mis-portal-sidebar-footer">
        {navLink(settingsItem, <Settings size={18} />)}

        <button type="button" className="mis-portal-nav-item mis-portal-nav-logout" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>

        <div className="mis-portal-cocoon-art" aria-hidden="true">
          <img src={cocoonArt} alt="" />
        </div>

        <div className="mis-portal-sidebar-version">
          <span>Version 1.0</span>
          <span>Government of Tamil Nadu</span>
        </div>
      </div>
    </aside>
  );
}
