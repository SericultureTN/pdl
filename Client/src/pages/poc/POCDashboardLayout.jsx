import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import POCSidebar from './POCSidebar.jsx';
import POCHeader from './POCHeader.jsx';
import { getPocRouteMeta } from './pocNavConfig.js';
import '../mispage.css';

export default function POCDashboardLayout({ onLogout }) {
  const location = useLocation();
  const { title, breadcrumb } = getPocRouteMeta(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="mis-portal">
      {sidebarOpen && (
        <button
          type="button"
          className="mis-portal-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <POCSidebar
        open={sidebarOpen}
        onLogout={onLogout}
        onNavigate={() => setSidebarOpen(false)}
      />
      <div className="mis-portal-main">
        <POCHeader
          title={title}
          breadcrumb={breadcrumb}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="mis-portal-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
