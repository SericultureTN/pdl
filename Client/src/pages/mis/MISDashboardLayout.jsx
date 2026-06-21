import { Outlet, useLocation } from 'react-router-dom';
import MISSidebar from './MISSidebar.jsx';
import MISHeader from './MISHeader.jsx';
import { getMisRouteMeta } from './misNavConfig.js';
import '../mispage.css';

export default function MISDashboardLayout({ onLogout }) {
  const location = useLocation();
  const { title, breadcrumb } = getMisRouteMeta(location.pathname);

  return (
    <div className="mis-portal">
      <MISSidebar onLogout={onLogout} />
      <div className="mis-portal-main">
        <MISHeader title={title} breadcrumb={breadcrumb} />
        <div className="mis-portal-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
