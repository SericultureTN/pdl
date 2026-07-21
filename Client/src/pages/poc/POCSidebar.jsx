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
  POC_DATA_ENTRY_ITEMS,
  POC_MAIN_NAV_ITEMS,
  pocFullPath,
  isPocNavActive,
} from './pocNavConfig.js';
import { authService } from '../../services/auth.js';
import cocoonArt from '../../assets/login-bg.png';

export default function POCSidebar({ open = false, onLogout, onNavigate }) {
  const location = useLocation();

  const dashboardItem = POC_MAIN_NAV_ITEMS.find((item) => item.path === 'dashboard');
  const analyticsItem = POC_MAIN_NAV_ITEMS.find((item) => item.path === 'analytics');
  const userManagementItem = POC_MAIN_NAV_ITEMS.find((item) => item.path === 'user-management');
  const settingsItem = POC_MAIN_NAV_ITEMS.find((item) => item.path === 'settings');
  const reportViewerItem = POC_MAIN_NAV_ITEMS.find((item) => item.path === 'report-viewer');

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
      to={pocFullPath(item.path)}
      className={`mis-portal-nav-item ${isPocNavActive(location.pathname, item.path) ? 'active' : ''}`}
      onClick={onNavigate}
    >
      {icon}
      {item.label}
    </Link>
  );

  return (
    <aside className={`mis-portal-sidebar ${open ? 'open' : ''}`}>
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
          <span className="mis-portal-logo-subtitle">POC PORTAL</span>
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
            {POC_DATA_ENTRY_ITEMS.map((item) => {
              const active = isPocNavActive(location.pathname, item.path);

              return (
                <Link
                  key={item.path}
                  to={pocFullPath(item.path)}
                  className={`mis-portal-nav-sub-item ${active ? 'active' : ''}`}
                  onClick={onNavigate}
                >
                  {active ? <ChevronRight size={14} /> : <span className="mis-portal-nav-dot" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {navLink(reportViewerItem, <BarChart3 size={18} />)}

        <Link
          to="/reports"
          state={{ from: 'poc' }}
          className={`mis-portal-nav-item ${location.pathname === '/reports' ? 'active' : ''}`}
          onClick={onNavigate}
        >
          <BarChart3 size={18} />
          Reports Archive
        </Link>

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
