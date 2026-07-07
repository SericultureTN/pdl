import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MISSidebar from './MISSidebar.jsx';
import MISHeader from './MISHeader.jsx';
import { getMisRouteMeta } from './misNavConfig.js';
import '../mispage.css';

export default function MISDashboardLayout({ onLogout }) {
  const location = useLocation();
  const { title, breadcrumb } = getMisRouteMeta(location.pathname);
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
      <MISSidebar
        open={sidebarOpen}
        onLogout={onLogout}
        onNavigate={() => setSidebarOpen(false)}
      />
      <div className="mis-portal-main">
        <MISHeader
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
